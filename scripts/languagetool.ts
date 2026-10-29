#!/usr/bin/env bun
/**
 * LanguageTool gate (P3e §8): every target-language string of a course
 * (scripts/lib/target-strings.ts) is checked by a LanguageTool server; a
 * match fails the run unless content/<lang>/languagetool-allow.json
 * disables its rule or allows that exact match, each with a reason.
 *
 * LanguageTool (LGPL-2.1) is a CI/dev tool only: it runs on the CI runner
 * or a developer machine, never ships in the app, and is therefore not in
 * content/sources/registry.json (the shipped-provenance registry).
 *
 *   bun scripts/languagetool.ts --course es-vi [--scope course|stories] [--server http://localhost:8081] [--json <file>]
 *
 * `--scope stories` checks only the target's graded stories (titles and
 * sentences) — the French gate, whose lessons are frozen (CLAUDE.md §4).
 *
 * CI: .github/workflows/ci.yml job `languagetool` downloads the pinned
 * LanguageTool release, starts its HTTP server and runs this script.
 */

import { existsSync, writeFileSync } from "fs";

import { z } from "zod";

import { readJson, safeResolve } from "./lib/pipeline";
import { collectTargetStrings, uniqueTargetStrings } from "./lib/target-strings";

const AllowSchema = z.object({
  version: z.literal(1),
  /** LanguageTool variant to check against (es: Peninsular "es"). */
  language: z.string().min(2),
  disabledRules: z.array(z.object({ rule: z.string().min(1), reason: z.string().min(10) })),
  allow: z.array(
    z.object({
      rule: z.string().min(1),
      /** The flagged span, exactly as LanguageTool reports it. */
      match: z.string().min(1),
      /** Optional: only inside this exact string. */
      text: z.string().optional(),
      reason: z.string().min(10),
    })
  ),
});
export type LanguageToolAllow = z.infer<typeof AllowSchema>;

export type LtMatch = { rule: string; category: string; message: string; match: string; replacements: string[] };
export type LtFinding = LtMatch & { text: string; where: string[] };

type LtResponse = {
  matches: {
    message: string;
    offset: number;
    length: number;
    replacements: { value: string }[];
    rule: { id: string; category: { id: string } };
  }[];
};

/**
 * One request's ceiling. CI 2026-10-29: the de-vi gate never finished in its
 * 20-minute job, because a request without a timeout could wait forever.
 * The server also caps each check (maxCheckTimeMillis in ci.yml).
 */
export const LT_REQUEST_TIMEOUT_MS = 60_000;

async function rawCheck(server: string, language: string, text: string, disabled: string[], timeoutMs: number): Promise<LtResponse["matches"]> {
  const body = new URLSearchParams({ text, language, disabledRules: disabled.join(",") });
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${server}/v2/check`, { method: "POST", body, signal: AbortSignal.timeout(timeoutMs) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return ((await res.json()) as LtResponse).matches;
    } catch (e) {
      if (attempt >= 3) throw new Error(`LanguageTool at ${server} failed on "${text.slice(0, 40)}": ${(e as Error).message}`);
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
}

export async function checkText(server: string, language: string, text: string, disabled: string[], timeoutMs = LT_REQUEST_TIMEOUT_MS): Promise<LtMatch[]> {
  return (await rawCheck(server, language, text, disabled, timeoutMs)).map((m) => ({
    rule: m.rule.id,
    category: m.rule.category.id,
    message: m.message,
    match: text.slice(m.offset, m.offset + m.length),
    replacements: m.replacements.slice(0, 3).map((r) => r.value),
  }));
}

/**
 * Screening batches (CI 2026-10-29): German costs about 0.9 s per request
 * whatever its length (the speller), so 4,675 single requests could not
 * finish in the job. Strings are screened in batches of paragraphs, and
 * every string a batch match touches is then checked ON ITS OWN, so the
 * reported findings are exactly the single-string results.
 */
export const LT_BATCH_STRINGS = 40;
export const LT_BATCH_CHARS = 4000;
export const LT_BATCH_SEPARATOR = "\n\n";

/** Indices of the strings, grouped into batches (pure; tested). */
export function batchIndices(texts: readonly string[], maxStrings = LT_BATCH_STRINGS, maxChars = LT_BATCH_CHARS): number[][] {
  const out: number[][] = [];
  let cur: number[] = [];
  let chars = 0;
  texts.forEach((t, i) => {
    if (cur.length > 0 && (cur.length >= maxStrings || chars + t.length > maxChars)) {
      out.push(cur);
      cur = [];
      chars = 0;
    }
    cur.push(i);
    chars += t.length + LT_BATCH_SEPARATOR.length;
  });
  if (cur.length > 0) out.push(cur);
  return out;
}

/** Positions (within the batch) of the strings a match [offset, offset + length) touches (pure; tested). */
export function touchedStrings(texts: readonly string[], offset: number, length: number): number[] {
  const touched: number[] = [];
  let start = 0;
  texts.forEach((t, i) => {
    const end = start + t.length + LT_BATCH_SEPARATOR.length;
    if (offset < end && offset + Math.max(length, 1) > start) touched.push(i);
    start = end;
  });
  return touched;
}

async function screenBatch(server: string, language: string, texts: readonly string[], disabled: string[]): Promise<number[]> {
  const matches = await rawCheck(server, language, texts.join(LT_BATCH_SEPARATOR), disabled, LT_REQUEST_TIMEOUT_MS);
  return [...new Set(matches.flatMap((m) => touchedStrings(texts, m.offset, m.length)))];
}

/**
 * Rules that only make sense for a whole sentence: vocabulary items and
 * options ("el pan", "manzana") are fragments, so these are kept only when
 * the string ends like a sentence.
 */
const SENTENCE_ONLY_RULES = new Set(["UPPERCASE_SENTENCE_START"]);
const ENDS_LIKE_SENTENCE = /[.!?…]["»”)]?\s*$/;

export function applicable(m: LtMatch, text: string): boolean {
  return !SENTENCE_ONLY_RULES.has(m.rule) || ENDS_LIKE_SENTENCE.test(text);
}

/** Findings the allow file does not cover (pure; tested). */
export function unallowed(findings: LtFinding[], allow: LanguageToolAllow): LtFinding[] {
  return findings.filter(
    (f) => !allow.allow.some((a) => a.rule === f.rule && a.match === f.match && (a.text === undefined || a.text === f.text))
  );
}

/** Allow entries no finding used any more — stale whitelisting fails too. */
export function unusedAllowances(findings: LtFinding[], allow: LanguageToolAllow): LanguageToolAllow["allow"] {
  return allow.allow.filter((a) => !findings.some((f) => a.rule === f.rule && a.match === f.match && (a.text === undefined || a.text === f.text)));
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const opt = (name: string) => {
    const i = args.indexOf(`--${name}`);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const courseId = opt("course");
  if (!courseId) throw new Error("usage: bun scripts/languagetool.ts --course <id> [--scope course|stories] [--server <url>] [--json <file>]");
  const scope = opt("scope") ?? "course";
  if (scope !== "course" && scope !== "stories") throw new Error(`--scope must be "course" or "stories" (got "${scope}")`);
  const server = opt("server") ?? process.env.LT_URL ?? "http://localhost:8081";
  const lang = courseId.split("-")[0];
  const allowRel = `content/${lang}/languagetool-allow.json`;
  if (!existsSync(safeResolve(allowRel))) throw new Error(`${allowRel} is missing`);
  const allow = AllowSchema.parse(readJson(allowRel));
  const disabled = allow.disabledRules.map((d) => d.rule);

  const unique = uniqueTargetStrings(collectTargetStrings(courseId, scope));
  const findings: LtFinding[] = [];
  const started = Date.now();
  const elapsed = () => `${Math.round((Date.now() - started) / 1000)} s`;
  const pool = async <T>(items: T[], run: (item: T) => Promise<void>) => {
    const queue = [...items];
    await Promise.all(Array.from({ length: 8 }, async () => {
      for (let it = queue.shift(); it !== undefined; it = queue.shift()) await run(it);
    }));
  };
  // Screen in batches (unless --no-batch), then check every touched string on its own.
  let suspects = unique;
  if (!args.includes("--no-batch")) {
    const touched = new Set<number>();
    await pool(batchIndices(unique.map((s) => s.text)), async (batch) => {
      for (const j of await screenBatch(server, allow.language, batch.map((i) => unique[i].text), disabled)) touched.add(batch[j]);
    });
    suspects = [...touched].sort((a, b) => a - b).map((i) => unique[i]);
    console.log(`languagetool ${courseId}: screened ${unique.length} strings in batches, ${suspects.length} to check one by one (${elapsed()})`);
  }
  let done = 0;
  await pool(suspects, async (s) => {
    for (const m of await checkText(server, allow.language, s.text, disabled)) {
      if (applicable(m, s.text)) findings.push({ ...m, text: s.text, where: s.where });
    }
    done += 1;
    if (done % 500 === 0) console.log(`languagetool ${courseId}: ${done}/${suspects.length} strings checked (${elapsed()})`);
  });
  findings.sort((a, b) => a.rule.localeCompare(b.rule) || a.text.localeCompare(b.text));

  const failing = unallowed(findings, allow);
  const stale = unusedAllowances(findings, allow);
  const json = opt("json");
  if (json) writeFileSync(json, JSON.stringify({ courseId, strings: unique.length, findings, failing: failing.length, stale }, null, 2) + "\n");

  console.log(`languagetool ${courseId}: ${unique.length} distinct target strings, ${findings.length} match(es), ${findings.length - failing.length} allowed, ${failing.length} failing, ${stale.length} stale allowance(s)`);
  for (const f of failing) {
    console.log(`  ${f.rule} [${f.category}] "${f.match}" in "${f.text}" — ${f.message}${f.replacements.length ? ` (→ ${f.replacements.join(" | ")})` : ""}  @ ${f.where[0]}`);
  }
  for (const a of stale) console.log(`  stale allowance: ${a.rule} "${a.match}"${a.text ? ` in "${a.text}"` : ""} — remove it from ${allowRel}`);
  if (failing.length > 0 || stale.length > 0) process.exit(1);
}

if (import.meta.main) {
  main().catch((e) => {
    console.error((e as Error).message);
    process.exit(2);
  });
}

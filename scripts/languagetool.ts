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
 *   bun scripts/languagetool.ts --course es-vi [--server http://localhost:8081] [--json <file>]
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

export async function checkText(server: string, language: string, text: string, disabled: string[]): Promise<LtMatch[]> {
  const body = new URLSearchParams({ text, language, disabledRules: disabled.join(",") });
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${server}/v2/check`, { method: "POST", body });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as LtResponse;
      return data.matches.map((m) => ({
        rule: m.rule.id,
        category: m.rule.category.id,
        message: m.message,
        match: text.slice(m.offset, m.offset + m.length),
        replacements: m.replacements.slice(0, 3).map((r) => r.value),
      }));
    } catch (e) {
      if (attempt >= 3) throw new Error(`LanguageTool at ${server} failed on "${text.slice(0, 40)}": ${(e as Error).message}`);
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
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
  if (!courseId) throw new Error("usage: bun scripts/languagetool.ts --course <id> [--server <url>] [--json <file>]");
  const server = opt("server") ?? process.env.LT_URL ?? "http://localhost:8081";
  const lang = courseId.split("-")[0];
  const allowRel = `content/${lang}/languagetool-allow.json`;
  if (!existsSync(safeResolve(allowRel))) throw new Error(`${allowRel} is missing`);
  const allow = AllowSchema.parse(readJson(allowRel));
  const disabled = allow.disabledRules.map((d) => d.rule);

  const unique = uniqueTargetStrings(collectTargetStrings(courseId));
  const findings: LtFinding[] = [];
  const queue = [...unique];
  const worker = async () => {
    for (let s = queue.shift(); s; s = queue.shift()) {
      for (const m of await checkText(server, allow.language, s.text, disabled)) {
        if (applicable(m, s.text)) findings.push({ ...m, text: s.text, where: s.where });
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
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

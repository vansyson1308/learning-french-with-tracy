/**
 * Authoring toolkit CLI (P3c) — LLM-assisted drafts that must pass the
 * validators. No network code: `emit` writes a prompt bundle Claude (in a
 * Claude Code session or the owner's chat) answers with OUTPUT.jsonl;
 * `ingest` validates and merges the answer and writes a REPORT.md the
 * next session fixes against. Linters and the review checklist are pure
 * reads over committed content.
 *
 *   bun scripts/author.ts emit <step> --target es --native vi         → content/es/_drafts/<step>/{PROMPT.md,INPUT.json}
 *   bun scripts/author.ts ingest <step> --target es --native vi [--dry-run] [--output FILE]
 *   bun scripts/author.ts lint --course fr-en [--out FILE]
 *   bun scripts/author.ts checklist --course es-vi
 *   bun scripts/author.ts blueprint                                    → prints the French census the blueprint cites
 *   bun scripts/author.ts selftest --target xx --native en            → emit every step + ingest the committed xx content as if drafted (dry run)
 *   bun scripts/author.ts steps
 *   bun scripts/author.ts promote --target es --native vi             → move the staged course layer into content/ once everything validates
 *
 * Staging (P3d): while a course does not exist yet (no content/courses/<id>.json)
 * or content/<lang>/_drafts/staged/ exists, ingest writes there instead of
 * content/, and emit / ingest / lint / checklist see the staged files overlaid
 * on the real tree; `--direct` writes straight into content/.
 */

import { existsSync, mkdirSync, writeFileSync } from "fs";

import type { PackSource } from "../content/schema";

import { buildBundle, writeBundle } from "./lib/authoring/bundle";
import { collectChecklist, renderChecklist } from "./lib/authoring/checklist";
import { ingestStep } from "./lib/authoring/ingest";
import { listStaged, promote, stagedRoot, withStaging } from "./lib/authoring/staging";
import { lintCourse, renderLintReport } from "./lib/authoring/lint";
import { STEP_IDS, STEPS, stepDef, type StepId } from "./lib/authoring/steps";
import { readJson, safeResolve, validateContent } from "./lib/pipeline";

function fail(msg: string): never {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}
const args = process.argv.slice(2);
const command = args[0];
const positional = args.slice(1).filter((a, i, all) => !a.startsWith("--") && !(i > 0 && all[i - 1].startsWith("--") && !all[i - 1].includes("=")));
const opt = (name: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && !args[i + 1]?.startsWith("--") ? args[i + 1] : undefined;
};
const flag = (name: string) => args.includes(`--${name}`);

function courseIdFor(target: string, native: string): string {
  return `${target}-${native}`;
}

/** Run with the staged layer overlaid when the course is being built (see the header). */
function staged<T>(lang: string, courseId: string, fn: () => T): T {
  const building = existsSync(safeResolve(stagedRoot(lang))) || !existsSync(safeResolve(`content/courses/${courseId}.json`));
  if (flag("direct") || !building) return fn();
  const result = withStaging(lang, fn);
  console.log(`(staged: ${listStaged(lang).length} file(s) under ${stagedRoot(lang)})`);
  return result;
}

function blueprintCensus(): Record<string, unknown> {
  const pack = readJson("content/courses/fr-en.json") as PackSource;
  const sections = pack.sections.map((s) => {
    const exercises = s.units.flatMap((u) => u.lessons.flatMap((l) => l.exercises));
    const types: Record<string, number> = {};
    for (const e of exercises) types[e.type] = (types[e.type] ?? 0) + 1;
    const gb = s.units.map((u) => (u.guidebook ?? "").length);
    return { id: s.id, title: s.title, units: s.units.length, lessons: s.units.reduce((n, u) => n + u.lessons.length, 0), exercises: exercises.length, types, wordsPerUnit: s.units.map((u) => u.words.length), guidebookChars: [Math.min(...gb), Math.max(...gb)] };
  });
  const count = (rel: string, key: string) => (existsSync(safeResolve(rel)) ? ((readJson(rel) as Record<string, unknown>)[key] as unknown[]).length : 0);
  return {
    sections,
    totals: { units: sections.reduce((n, s) => n + s.units, 0), lessons: sections.reduce((n, s) => n + s.lessons, 0), exercises: sections.reduce((n, s) => n + s.exercises, 0) },
    lexemes: count("content/fr/lexicon/lexemes.json", "lexemes"),
    concepts: count("content/fr/pedagogy/concepts.json", "concepts"),
    paradigms: count("content/fr/pedagogy/paradigms.json", "tables"),
    readings: count("content/fr/reception/reading.json", "readings"),
    clips: count("content/fr/reception/listening.json", "clips"),
    speechItems: count("content/fr/speech/items.json", "items"),
    writingTasks: count("content/fr/writing/tasks.json", "tasks"),
    scenarios: count("content/fr/interaction/scenarios.json", "scenarios"),
    objectives: count("content/fr/assessment/objectives.json", "objectives"),
    checkpoints: count("content/fr/assessment/checkpoints.json", "checkpoints"),
    placementStages: count("content/fr/assessment/placement.json", "stages"),
  };
}

/** Synthesize an OUTPUT.jsonl for a step from the committed content of a language (self-test: the toolkit's own round trip). */
function synthesizeOutput(step: StepId, lang: string, native: string, courseId: string): string[] {
  const rows = (rel: string, key: string) => (existsSync(safeResolve(rel)) ? ((readJson(rel) as Record<string, unknown>)[key] as unknown[]) : []);
  switch (step) {
    case "objectives":
      return rows(`content/${lang}/assessment/objectives.json`, "objectives").map((r) => JSON.stringify(r));
    case "units": {
      const pack = readJson(`content/courses/${courseId}.json`) as PackSource;
      return pack.sections.slice(1).flatMap((s) => s.units.map((u) => JSON.stringify({ sectionId: s.id, id: u.id, title: u.title, description: u.description, guidebook: u.guidebook.padEnd(600, " ").slice(0, 2200), words: u.words, lessons: u.lessons.map((l) => ({ id: l.id, title: l.title, objectives: l.objectives ?? ["none"] })) })));
    }
    case "lessons": {
      const pack = readJson(`content/courses/${courseId}.json`) as PackSource;
      return pack.sections.flatMap((s) => s.units.flatMap((u) => u.lessons.map((l) => JSON.stringify({ lessonId: l.id, exercises: l.exercises, ...(l.flow ? { flow: l.flow } : {}) }))));
    }
    case "concepts":
      return [...rows(`content/${lang}/pedagogy/concepts.json`, "concepts").map((r) => JSON.stringify(r)), ...rows(`content/${lang}/pedagogy/paradigms.json`, "tables").map((t) => JSON.stringify({ paradigm: t }))];
    case "readings":
      return rows(`content/${lang}/reception/reading.json`, "readings").map((r) => JSON.stringify(r));
    case "listening":
      return rows(`content/${lang}/reception/listening.json`, "clips").map((r) => JSON.stringify(r));
    case "speech":
      return rows(`content/${lang}/speech/items.json`, "items").map((r) => JSON.stringify(r));
    case "writing":
      return rows(`content/${lang}/writing/tasks.json`, "tasks").map((r) => JSON.stringify(r));
    case "scenarios":
      return rows(`content/${lang}/interaction/scenarios.json`, "scenarios").map((r) => JSON.stringify(r));
    case "checkpoints":
      return rows(`content/${lang}/assessment/checkpoints.json`, "checkpoints").map((r) => JSON.stringify(r));
    case "placement":
      return rows(`content/${lang}/assessment/placement.json`, "stages").map((r) => JSON.stringify(r));
    case "lexicon-review":
      return (rows(`content/${lang}/lexicon/lexemes.json`, "lexemes") as { id: string; glosses: Record<string, string>; examples: { translations: Record<string, string> }[]; relations?: { confusables: string[] } }[]).map((l) => JSON.stringify({ id: l.id, glossVi: l.glosses[native] ?? l.glosses.en, exampleTranslationsVi: l.examples.map((e) => e.translations[native] ?? e.translations.en), confusables: l.relations?.confusables }));
    case "lexicon-add":
      // Additions are new words by definition: nothing committed to round-trip (bundle only).
      return [];
  }
}

if (command === "steps") {
  for (const id of STEP_IDS) console.log(`${id.padEnd(16)} ${STEPS[id].sessions.padEnd(28)} → ${STEPS[id].target("<lang>", "<courseId>")}`);
} else if (command === "blueprint") {
  console.log(JSON.stringify(blueprintCensus(), null, 2));
} else if (command === "emit") {
  const step = (positional[0] ?? fail("emit <step>")) as StepId;
  stepDef(step);
  const target = opt("target") ?? fail("--target <code>");
  const native = opt("native") ?? "vi";
  const bundle = staged(target, courseIdFor(target, native), () => buildBundle(step, target, native, courseIdFor(target, native)));
  writeBundle(bundle);
  console.log(`emitted ${bundle.promptPath} + ${bundle.inputPath} (${(bundle.input.allowedIds as { lexemes: unknown[] }).lexemes.length} lexeme ids, ${(bundle.input.exemplars as unknown[]).length} exemplars)`);
} else if (command === "ingest") {
  const step = (positional[0] ?? fail("ingest <step>")) as StepId;
  stepDef(step);
  const target = opt("target") ?? fail("--target <code>");
  const native = opt("native") ?? "vi";
  const result = staged(target, courseIdFor(target, native), () => ingestStep(step, target, native, courseIdFor(target, native), { dryRun: flag("dry-run"), outputPath: opt("output") }));
  const failed = result.rows.filter((r) => !r.ok).length;
  console.log(`ingest ${step}: ${result.rows.length} records, ${failed} failed, ${result.validatorErrors.length} validator errors → ${result.reportPath}${result.written.length ? ` (wrote ${result.written.join(", ")})` : ""}`);
  if (failed > 0 || result.validatorErrors.length > 0) process.exit(1);
} else if (command === "lint") {
  const courseId = opt("course") ?? fail("--course <id>");
  const report = staged(courseId.split("-")[0], courseId, () => lintCourse(courseId));
  const text = renderLintReport(report);
  const out = opt("out");
  if (out) {
    mkdirSync(safeResolve(out, ".."), { recursive: true });
    writeFileSync(safeResolve(out), text);
    console.log(`lint ${courseId}: ${report.findings.length} findings → ${out}`);
  } else console.log(text);
} else if (command === "checklist") {
  const courseId = opt("course") ?? fail("--course <id>");
  const { pack, lines } = staged(courseId.split("-")[0], courseId, () => ({ pack: readJson(`content/courses/${courseId}.json`) as PackSource, lines: collectChecklist(courseId) }));
  const rel = `content/${pack.targetCode}/REVIEW-CHECKLIST.md`;
  writeFileSync(safeResolve(rel), renderChecklist(courseId, lines));
  console.log(`checklist ${courseId}: ${lines.length} strings → ${rel}`);
} else if (command === "selftest") {
  const target = opt("target") ?? "xx";
  const native = opt("native") ?? "en";
  const courseId = courseIdFor(target, native);
  let failures = 0;
  for (const step of STEP_IDS) {
    const bundle = buildBundle(step, target, native, courseId);
    writeBundle(bundle);
    const lines = synthesizeOutput(step, target, native, courseId);
    const outRel = `content/${target}/_drafts/${step}/OUTPUT.jsonl`;
    writeFileSync(safeResolve(outRel), lines.length > 0 ? `${lines.join("\n")}\n` : "");
    if (lines.length === 0) {
      console.log(`${step.padEnd(16)} no committed ${target} content to round-trip — bundle only`);
      continue;
    }
    const result = ingestStep(step, target, native, courseId, { dryRun: true });
    const failed = result.rows.filter((r) => !r.ok);
    failures += failed.length;
    console.log(`${step.padEnd(16)} ${result.rows.length} records, ${failed.length} failed (dry run)`);
    for (const f of failed.slice(0, 3)) console.log(`   ${f.id}: ${f.reasons.join("; ")}`);
  }
  if (failures > 0) fail(`selftest: ${failures} record(s) failed the round trip`);
  console.log(`selftest ok: every committed ${target} record round-trips through its step schema`);
} else if (command === "promote") {
  const target = opt("target") ?? fail("--target <code>");
  const result = promote(target, () => validateContent().errors);
  if (result.errors.length > 0) {
    for (const e of result.errors.slice(0, 40)) console.error(`  ${e}`);
    fail(`promote ${target}: ${result.errors.length} validator error(s) with the staged layer applied — nothing moved`);
  }
  console.log(`promote ${target}: moved ${result.moved.length} file(s) into content/ — compiling`);
  const compile = Bun.spawnSync(["bun", "scripts/compile-content.ts"], { stdout: "inherit", stderr: "inherit" });
  if (compile.exitCode !== 0) fail(`promote ${target}: content:compile failed after the move — fix, then run bun run content:compile`);
  const after = validateContent();
  if (after.errors.length > 0) {
    for (const e of after.errors.slice(0, 40)) console.error(`  ${e}`);
    fail(`promote ${target}: ${after.errors.length} validator error(s) after compile`);
  }
  console.log(`promote ${target}: compiled and validated — commit content/ and src/content/`);
} else {
  fail("usage: author.ts <steps|blueprint|emit <step>|ingest <step>|lint|checklist|selftest|promote> [--target es] [--native vi] [--course id] [--dry-run] [--direct]");
}


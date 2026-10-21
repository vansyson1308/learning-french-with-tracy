/**
 * Ingest (P3c): read `_drafts/<step>/OUTPUT.jsonl`, validate every record
 * against the step's schema, merge the valid ones into the authored file
 * (by id — a record replaces the item with the same id, new ids append),
 * run the relevant validators over the result and write
 * `_drafts/<step>/REPORT.md` (pass/fail per record with reasons). With
 * `dryRun` nothing is written: the report still says what WOULD fail.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

import type { PackSource } from "../../../content/schema";
import { validateTarget } from "../compile-artifacts";
import { loadPacks, readJson, safeResolve } from "../pipeline";

import { stepDef, type StepId } from "./steps";

export type IngestRow = { line: number; id: string; ok: boolean; reasons: string[] };
export type IngestResult = { step: StepId; rows: IngestRow[]; written: string[]; validatorErrors: string[]; reportPath: string };

type Doc = Record<string, unknown>;

function loadDoc(rel: string, fallback: Doc): Doc {
  return existsSync(safeResolve(rel)) ? (readJson(rel) as Doc) : fallback;
}
function writeDoc(rel: string, doc: Doc, written: string[], dryRun: boolean): void {
  if (dryRun) return;
  mkdirSync(safeResolve(rel, ".."), { recursive: true });
  writeFileSync(safeResolve(rel), `${JSON.stringify(doc, null, 2)}\n`);
  written.push(rel);
}
function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const out = [...existing];
  for (const rec of incoming) {
    const i = out.findIndex((x) => x.id === rec.id);
    if (i >= 0) out[i] = rec;
    else out.push(rec);
  }
  return out;
}

/** Apply valid records of a step to the authored files (pure merge semantics per step). */
export function applyRecords(step: StepId, lang: string, native: string, courseId: string, records: Doc[], written: string[], dryRun: boolean): void {
  const def = stepDef(step);
  const target = def.target(lang, courseId);
  const base = { version: 1, language: lang };
  switch (step) {
    case "objectives": {
      const doc = loadDoc(target, { ...base, objectives: [] });
      doc.objectives = mergeById(doc.objectives as { id: string }[], records as { id: string }[]);
      writeDoc(target, doc, written, dryRun);
      // Scaffold the policies the assessment validators need (copied from the French template; attainment from the essentials).
      const claimRel = `content/${lang}/assessment/claim-policy.json`;
      if (!existsSync(safeResolve(claimRel)) && existsSync(safeResolve("content/fr/assessment/claim-policy.json"))) writeDoc(claimRel, readJson("content/fr/assessment/claim-policy.json") as Doc, written, dryRun);
      const attRel = `content/${lang}/assessment/attainment.json`;
      if (!existsSync(safeResolve(attRel))) {
        const frAtt = existsSync(safeResolve("content/fr/assessment/attainment.json")) ? (readJson("content/fr/assessment/attainment.json") as Doc) : {};
        const essentials = (doc.objectives as { id: string; essential?: boolean; category: string; cefrAlignments: { level: string; relation: string }[] }[]).filter((o) => o.essential);
        const byDomain: Record<string, string[]> = {};
        for (const o of essentials) if (o.cefrAlignments.some((a) => a.relation === "direct" && a.level === "A1")) (byDomain[o.category] ??= []).push(o.id);
        writeDoc(attRel, { ...frAtt, language: lang, domains: byDomain }, written, dryRun);
      }
      break;
    }
    case "units": {
      const pack = loadDoc(target, { ...(loadDoc(`content/courses/${courseId}.json`, { id: courseId, version: 1, targetCode: lang, nativeCode: native, sections: [] }) as Doc) }) as Doc;
      const sections = (pack.sections as { id: string; title: string; units: Doc[] }[]) ?? [];
      for (const rec of records as { sectionId: string; id: string; lessons: { id: string; title: string; objectives: string[] }[] }[]) {
        let section = sections.find((s) => s.id === rec.sectionId);
        if (!section) {
          section = { id: rec.sectionId, title: rec.sectionId.split(":")[1], units: [] };
          sections.push(section);
        }
        const unit: Doc = { ...rec, lessons: rec.lessons.map((l) => ({ id: l.id, title: l.title, objectives: l.objectives, exercises: [] })) };
        delete unit.sectionId;
        const i = section.units.findIndex((u) => u.id === rec.id);
        if (i >= 0) {
          // keep already-authored exercises of existing lesson ids
          const prev = section.units[i] as { lessons: { id: string; exercises: unknown[] }[] };
          (unit.lessons as { id: string; exercises: unknown[] }[]).forEach((l) => {
            const old = prev.lessons.find((x) => x.id === l.id);
            if (old && old.exercises.length > 0) l.exercises = old.exercises;
          });
          section.units[i] = unit;
        } else section.units.push(unit);
      }
      sections.sort((a, b) => a.id.localeCompare(b.id));
      pack.sections = sections;
      writeDoc(target, pack, written, dryRun);
      break;
    }
    case "lessons": {
      const draftRel = `content/${lang}/_drafts/pack.json`;
      const draft = loadDoc(draftRel, loadDoc(target, {})) as PackSource;
      for (const rec of records as { lessonId: string; exercises: unknown[]; flow?: unknown[] }[]) {
        let found = false;
        for (const s of draft.sections ?? []) for (const u of s.units) for (const l of u.lessons) {
          if (l.id !== rec.lessonId) continue;
          (l as Doc).exercises = rec.exercises;
          if (rec.flow) (l as Doc).flow = rec.flow;
          found = true;
        }
        if (!found) throw new Error(`${rec.lessonId}: no such lesson stub in ${draftRel}`);
      }
      writeDoc(draftRel, draft as unknown as Doc, written, dryRun);
      // The real pack is written only when every lesson has exercises.
      const complete = (draft.sections ?? []).every((s) => s.units.every((u) => u.lessons.every((l) => (l.exercises ?? []).length > 0)));
      if (complete) writeDoc(target, draft as unknown as Doc, written, dryRun);
      break;
    }
    case "concepts": {
      const concepts = records.filter((r) => !("paradigm" in r));
      const paradigms = records.filter((r) => "paradigm" in r).map((r) => r.paradigm as { lemma: string });
      const cdoc = loadDoc(target, { ...base, concepts: [] });
      cdoc.concepts = mergeById(cdoc.concepts as { id: string }[], concepts as { id: string }[]);
      writeDoc(target, cdoc, written, dryRun);
      if (paradigms.length > 0) {
        const prel = `content/${lang}/pedagogy/paradigms.json`;
        const pdoc = loadDoc(prel, { ...base, tables: [] });
        const tables = pdoc.tables as { lemma: string }[];
        for (const t of paradigms) {
          const i = tables.findIndex((x) => x.lemma === t.lemma);
          if (i >= 0) tables[i] = t;
          else tables.push(t);
        }
        writeDoc(prel, pdoc, written, dryRun);
      }
      break;
    }
    case "readings": {
      const doc = loadDoc(target, { ...base, readings: [] });
      doc.readings = mergeById(doc.readings as { id: string }[], records as { id: string }[]);
      writeDoc(target, doc, written, dryRun);
      break;
    }
    case "listening": {
      const casts = existsSync(safeResolve("content/audio/voice-casts.json")) ? (readJson("content/audio/voice-casts.json") as { languages: Record<string, { cast: { A: string | null; B: string | null } }> }).languages[lang]?.cast : undefined;
      const doc = loadDoc(target, { ...base, voiceCast: { A: { voiceId: casts?.A ?? "unselected", speaker: null }, B: { voiceId: casts?.B ?? casts?.A ?? "unselected", speaker: null } }, clips: [] });
      doc.clips = mergeById(doc.clips as { id: string }[], records as { id: string }[]);
      writeDoc(target, doc, written, dryRun);
      break;
    }
    case "speech": {
      const doc = loadDoc(target, { ...base, items: [] });
      doc.items = mergeById(doc.items as { id: string }[], records as { id: string }[]);
      writeDoc(target, doc, written, dryRun);
      break;
    }
    case "writing": {
      const doc = loadDoc(target, { ...base, tasks: [] });
      doc.tasks = mergeById(doc.tasks as { id: string }[], records as { id: string }[]);
      writeDoc(target, doc, written, dryRun);
      break;
    }
    case "scenarios": {
      const doc = loadDoc(target, { ...base, scenarios: [] });
      doc.scenarios = mergeById(doc.scenarios as { id: string }[], records as { id: string }[]);
      writeDoc(target, doc, written, dryRun);
      break;
    }
    case "checkpoints": {
      const doc = loadDoc(target, { ...base, exerciseNativeCode: native, checkpoints: [] });
      doc.checkpoints = mergeById(doc.checkpoints as { id: string }[], records as { id: string }[]);
      writeDoc(target, doc, written, dryRun);
      break;
    }
    case "placement": {
      const doc = loadDoc(target, { ...base, exerciseNativeCode: native, placementVersion: 1, maxItems: 28, allComfortableLessonId: `${courseId}:un-l0`, stages: [] });
      doc.stages = mergeById(doc.stages as { id: string }[], records as { id: string }[]);
      writeDoc(target, doc, written, dryRun);
      break;
    }
    case "lexicon-review": {
      const doc = loadDoc(target, { ...base, lexemes: [] });
      const lexemes = doc.lexemes as { id: string; glosses: Record<string, string>; examples: { translations: Record<string, string> }[]; relations?: { confusables: string[] }; sourceRefs: { source: string }[] }[];
      for (const rec of records as { id: string; glossVi: string; exampleTranslationsVi: string[]; confusables?: string[] }[]) {
        const lex = lexemes.find((l) => l.id === rec.id);
        if (!lex) throw new Error(`${rec.id}: not in ${target}`);
        lex.glosses = { ...lex.glosses, [native]: rec.glossVi };
        lex.examples = lex.examples.map((ex, i) => (rec.exampleTranslationsVi[i] ? { ...ex, translations: { ...ex.translations, [native]: rec.exampleTranslationsVi[i] } } : ex));
        if (rec.confusables) lex.relations = rec.confusables.length > 0 ? { confusables: [...rec.confusables].sort() } : undefined;
      }
      // Symmetry of confusables is a validator rule; make reviewed pairs symmetric here.
      for (const lex of lexemes) for (const other of lex.relations?.confusables ?? []) {
        const o = lexemes.find((l) => l.id === other);
        if (o && !(o.relations?.confusables ?? []).includes(lex.id)) o.relations = { confusables: [...(o.relations?.confusables ?? []), lex.id].sort() };
      }
      writeDoc(target, doc, written, dryRun);
      break;
    }
  }
}

export function ingestStep(step: StepId, lang: string, native: string, courseId: string, opts: { dryRun?: boolean; outputPath?: string; reportDir?: string } = {}): IngestResult {
  const def = stepDef(step);
  const dir = `content/${lang}/_drafts/${step}`;
  const outputRel = opts.outputPath ?? `${dir}/OUTPUT.jsonl`;
  if (!existsSync(safeResolve(outputRel))) throw new Error(`${outputRel} does not exist — paste Claude's answer there first`);
  const schema = def.recordSchema(lang, native);
  const rows: IngestRow[] = [];
  const valid: Doc[] = [];
  const lines = readFileSync(safeResolve(outputRel), "utf8").split("\n");
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t === "") return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(t);
    } catch (e) {
      rows.push({ line: i + 1, id: "(unparsable)", ok: false, reasons: [`JSON: ${(e as Error).message}`] });
      return;
    }
    const res = schema.safeParse(parsed);
    const id = (parsed as { id?: string; lessonId?: string; paradigm?: { lemma: string } }).id ?? (parsed as { lessonId?: string }).lessonId ?? (parsed as { paradigm?: { lemma: string } }).paradigm?.lemma ?? `(line ${i + 1})`;
    if (!res.success) {
      rows.push({ line: i + 1, id, ok: false, reasons: res.error.issues.slice(0, 6).map((x) => `${x.path.join(".") || "(root)"}: ${x.message}`) });
      return;
    }
    const todo = JSON.stringify(res.data).match(/"TODO:[^"]*"/g);
    if (todo) {
      rows.push({ line: i + 1, id, ok: false, reasons: [`draft markers left: ${todo.slice(0, 3).join(", ")}`] });
      return;
    }
    rows.push({ line: i + 1, id, ok: true, reasons: [] });
    valid.push(res.data as Doc);
  });
  const written: string[] = [];
  let validatorErrors: string[] = [];
  const dryRun = opts.dryRun === true;
  if (valid.length > 0) {
    applyRecords(step, lang, native, courseId, valid, written, dryRun);
    if (!dryRun) {
      const packs = loadPacks();
      const all = validateTarget(lang, packs);
      validatorErrors = all.filter((e) => def.validatorPrefixes.some((p) => e.toLowerCase().startsWith(p)) || e.includes(courseId));
    }
  }
  const passed = rows.filter((r) => r.ok).length;
  const report = [
    `# ${step} — ingest report (${courseId})`,
    "",
    `Records: ${rows.length} · schema-valid: ${passed} · failed: ${rows.length - passed} · validator errors after merge: ${validatorErrors.length}${dryRun ? " (dry run — nothing written)" : ""}`,
    "",
    "## Records",
    "",
    ...rows.map((r) => (r.ok ? `- ✅ line ${r.line} \`${r.id}\`` : `- ❌ line ${r.line} \`${r.id}\`: ${r.reasons.join("; ")}`)),
    "",
    "## Validator errors (fix these records and ingest again)",
    "",
    ...(validatorErrors.length > 0 ? validatorErrors.map((e) => `- ${e}`) : ["- none"]),
    "",
    "## Written",
    "",
    ...(written.length > 0 ? written.map((w) => `- ${w}`) : ["- nothing"]),
    "",
  ].join("\n");
  const reportDir = opts.reportDir ?? dir;
  const reportPath = `${reportDir}/REPORT.md`;
  mkdirSync(safeResolve(reportDir), { recursive: true });
  writeFileSync(safeResolve(reportPath), report);
  return { step, rows, written, validatorErrors, reportPath };
}

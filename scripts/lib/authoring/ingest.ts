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

import { beforeWrite, isGeneratedDrift } from "./staging";
import { stepDef, type StepId } from "./steps";

export type IngestRow = { line: number; id: string; ok: boolean; reasons: string[] };
export type IngestResult = { step: StepId; rows: IngestRow[]; written: string[]; validatorErrors: string[]; reportPath: string };

type Doc = Record<string, unknown>;

function loadDoc(rel: string, fallback: Doc): Doc {
  return existsSync(safeResolve(rel)) ? (readJson(rel) as Doc) : fallback;
}
function writeDoc(rel: string, doc: Doc, written: string[], dryRun: boolean): void {
  if (dryRun) return;
  beforeWrite(rel);
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
        const objectives = doc.objectives as { id: string; essential?: boolean; category: string; cefrAlignments: { level: string; relation: string }[] }[];
        const directA1 = objectives.filter((o) => o.cefrAlignments.some((a) => a.relation === "direct" && a.level === "A1"));
        const domains = ["spoken_reception", "written_reception", "spoken_production", "written_production", "interaction"].map((domain) => {
          const required = directA1.filter((o) => o.category === domain && o.essential).map((o) => o.id);
          const excluded = directA1.filter((o) => o.category === domain && !o.essential).map((o) => o.id);
          return {
            domain,
            requiredObjectiveIds: required,
            excludedObjectiveIds: excluded.map((objectiveId) => ({ objectiveId, reason: "Direct at A1 but authored as non-essential: practised and reported on its own, not required for the estimate. Review this reason before promote." })),
            rationale: `Scaffolded by the authoring toolkit from the essential objectives aligned directly to an A1 scale in ${domain}. Review against the checkpoints before promote.`,
          };
        });
        writeDoc(attRel, { ...frAtt, language: lang, domains }, written, dryRun);
      }
      break;
    }
    case "units": {
      // A new course pack takes its language names and flag from a sibling pack of the same target / native language.
      const sibling = (code: string, field: "targetCode" | "nativeCode") =>
        loadPacks().find((p) => (p.pack as unknown as Doc)[field] === code && p.pack.testOnly !== true)?.pack as unknown as Doc | undefined;
      const fresh: Doc = {
        id: courseId,
        version: 1,
        targetLanguage: (sibling(lang, "targetCode")?.targetLanguage as string | undefined) ?? lang,
        targetCode: lang,
        nativeLanguage: (sibling(native, "nativeCode")?.nativeLanguage as string | undefined) ?? native,
        nativeCode: native,
        flag: (sibling(lang, "targetCode")?.flag as string | undefined) ?? "🏳️",
        sections: [],
      };
      const pack = loadDoc(target, { ...(loadDoc(`content/courses/${courseId}.json`, fresh) as Doc) }) as Doc;
      for (const k of ["targetLanguage", "nativeLanguage", "flag"]) if (pack[k] === undefined) pack[k] = fresh[k];
      const ordered: Doc = { id: pack.id, version: pack.version, targetLanguage: pack.targetLanguage, targetCode: pack.targetCode, nativeLanguage: pack.nativeLanguage, nativeCode: pack.nativeCode, flag: pack.flag };
      for (const [k, v] of Object.entries(pack)) if (!(k in ordered)) ordered[k] = v;
      for (const k of Object.keys(pack)) delete pack[k];
      Object.assign(pack, ordered);
      const sections = (pack.sections as { id: string; title: string; units: Doc[] }[]) ?? [];
      for (const rec of records as { sectionId: string; sectionTitle?: string; id: string; lessons: { id: string; title: string; objectives: string[] }[] }[]) {
        let section = sections.find((s) => s.id === rec.sectionId);
        if (!section) {
          section = { id: rec.sectionId, title: rec.sectionTitle ?? rec.sectionId.split(":")[1], units: [] };
          sections.push(section);
        } else if (rec.sectionTitle) section.title = rec.sectionTitle;
        const unit: Doc = { ...rec, lessons: rec.lessons.map((l) => ({ id: l.id, title: l.title, objectives: l.objectives, exercises: [] })) };
        delete unit.sectionId;
        delete unit.sectionTitle;
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
    case "exam": {
      // One file per track: content/<lang>/exam/<track-slug>.json (the record IS the document).
      for (const rec of records as { id: string }[]) {
        const slug = rec.id.split(".").pop()!.replace(/_/g, "-");
        writeDoc(`content/${lang}/exam/${slug}.json`, { ...base, exerciseNativeCode: native, ...(rec as Doc) }, written, dryRun);
      }
      break;
    }
    case "placement": {
      const doc = loadDoc(target, { ...base, exerciseNativeCode: native, placementVersion: 1, maxItems: 28, allComfortableLessonId: `${courseId}:un-l0`, stages: [] });
      doc.stages = mergeById(doc.stages as { id: string }[], records as { id: string }[]);
      writeDoc(target, doc, written, dryRun);
      break;
    }
    case "stories": {
      // A new language starts from its listening cast (N narrates with A's voice) and an empty
      // function-word list the author fills — the schema then insists on ≥ 10 entries.
      const listening = loadDoc(`content/${lang}/reception/listening.json`, {}) as { voiceCast?: Record<"A" | "B", unknown> };
      const cast = listening.voiceCast ? { N: listening.voiceCast.A, A: listening.voiceCast.A, B: listening.voiceCast.B } : undefined;
      const doc = loadDoc(target, { ...base, ...(cast ? { voiceCast: cast } : {}), functionWords: [], stories: [] });
      doc.stories = mergeById(doc.stories as { id: string }[], records as { id: string }[]);
      writeDoc(target, doc, written, dryRun);
      break;
    }
    case "lexicon-add": {
      const doc = loadDoc(target, { ...base, lexemes: [] });
      const lexemes = doc.lexemes as Doc[];
      const frozenRel = `content/${lang}/lexemes.json`;
      const frozen = loadDoc(frozenRel, {}) as Record<string, string>;
      const usedIds = new Set([...Object.values(frozen), ...lexemes.map((l) => l.id as string)]);
      const surfaces = new Set(lexemes.map((l) => l.surface as string));
      const poolRel = `content/${lang}/lexicon/derived/candidate-pool.json`;
      type PoolEntry = { lemma: string; partOfSpeech: string; sourcePos: string; ipa?: string | null; frequency?: { perMillion: number; rank: number; band: string } | null };
      const pool = existsSync(safeResolve(poolRel)) ? ((readJson(poolRel) as { entries: PoolEntry[] }).entries ?? []) : [];
      const ARTICLE: Record<string, Record<string, string>> = { es: { masculine: "el", feminine: "la" }, it: { masculine: "il", feminine: "la" }, pt: { masculine: "o", feminine: "a" }, de: { masculine: "der", feminine: "die", neuter: "das" } };
      const slugOf = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ñ/g, "n").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      for (const rec of records as { lemma: string; partOfSpeech: string; poolPos?: string; surface?: string; gender?: string; glossEn: string; glossVi: string; topic: string; examples: { target: string; en: string; vi: string }[] }[]) {
        const surface = rec.surface ?? (rec.partOfSpeech === "noun" && rec.gender && ARTICLE[lang]?.[rec.gender] ? `${ARTICLE[lang][rec.gender]} ${rec.lemma}` : rec.lemma);
        if (surfaces.has(surface)) throw new Error(`${surface}: already in ${target} — use lexicon-review to change it`);
        const base0 = slugOf(rec.lemma.normalize("NFC").replace(/ñ/g, "n")) || "w";
        let id = `${lang}:w:${base0}`;
        for (const v of [id, `${lang}:w:${base0}-${rec.partOfSpeech}`]) if (!usedIds.has(v)) { id = v; break; }
        let n = 2;
        while (usedIds.has(id)) id = `${lang}:w:${base0}-${rec.partOfSpeech}-${n++}`;
        usedIds.add(id);
        surfaces.add(surface);
        const ev = pool.find((e) => e.lemma === rec.lemma && e.partOfSpeech === (rec.poolPos ?? rec.partOfSpeech));
        const sourceRefs: { source: string; key?: string }[] = [];
        if (ev) sourceRefs.push({ source: "kaikki-en", key: `${ev.lemma}|${ev.sourcePos}` });
        if (ev?.frequency) sourceRefs.push({ source: "frequencywords", key: ev.lemma });
        sourceRefs.push({ source: "original-lexicon-etl" });
        lexemes.push({
          id,
          surface,
          lemma: rec.lemma,
          lookupForm: rec.lemma,
          partOfSpeech: rec.partOfSpeech,
          ...(rec.partOfSpeech === "noun" ? { gender: rec.gender } : {}),
          glosses: { en: rec.glossEn, [native]: rec.glossVi },
          ...(ev?.ipa ? { pronunciation: { value: ev.ipa, notation: "ipa", source: "kaikki-en" } } : {}),
          ...(ev?.frequency ? { frequency: { source: "frequencywords", rawValue: ev.frequency.perMillion, rank: ev.frequency.rank, band: ev.frequency.band } } : {}),
          topic: rec.topic,
          examples: rec.examples.map((x) => ({ target: x.target, translations: { en: x.en, [native]: x.vi }, source: "original-lexicon-etl", key: "add" })),
          sourceRefs,
        });
        frozen[surface] = id;
      }
      writeDoc(target, doc, written, dryRun);
      writeDoc(frozenRel, frozen as Doc, written, dryRun);
      break;
    }
    case "lexicon-review": {
      const doc = loadDoc(target, { ...base, lexemes: [] });
      const lexemes = doc.lexemes as { id: string; glosses: Record<string, string>; examples: { translations: Record<string, string> }[]; relations?: { confusables: string[] }; sourceRefs: { source: string }[] }[];
      for (const rec of records as { id: string; glossVi: string; exampleTranslationsVi: string[]; confusables?: string[]; dropExamples?: number[]; partOfSpeech?: string; addExamples?: { target: string; en: string; vi: string }[] }[]) {
        const lex = lexemes.find((l) => l.id === rec.id) as ((typeof lexemes)[number] & { partOfSpeech?: string }) | undefined;
        if (!lex) throw new Error(`${rec.id}: not in ${target}`);
        lex.glosses = { ...lex.glosses, [native]: rec.glossVi };
        if (rec.partOfSpeech) {
          lex.partOfSpeech = rec.partOfSpeech;
          // Grammatical gender is a noun property (lexicon validator): a corrected non-noun drops it.
          if (rec.partOfSpeech !== "noun") delete (lex as { gender?: string }).gender;
        }
        if (rec.dropExamples && rec.dropExamples.length > 0) {
          const drop = new Set(rec.dropExamples);
          for (const i of drop) if (i >= lex.examples.length) throw new Error(`${rec.id}: dropExamples index ${i} out of range (${lex.examples.length} examples)`);
          lex.examples = lex.examples.filter((_, i) => !drop.has(i));
        }
        if (rec.exampleTranslationsVi.length !== lex.examples.length) throw new Error(`${rec.id}: ${rec.exampleTranslationsVi.length} Vietnamese translation(s) for ${lex.examples.length} kept example(s)`);
        lex.examples = lex.examples.map((ex, i) => ({ ...ex, translations: { ...ex.translations, [native]: rec.exampleTranslationsVi[i] } }));
        for (const add of rec.addExamples ?? []) lex.examples.push({ target: add.target, translations: { en: add.en, [native]: add.vi }, source: "original-lexicon-etl", key: "review" } as (typeof lex.examples)[number]);
        if (lex.examples.length === 0) throw new Error(`${rec.id}: no example left — keep one or add an original example`);
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
      // Generated-artifact drift is resolved by content:compile (after promote), not by editing records.
      validatorErrors = all.filter((e) => !isGeneratedDrift(e)).filter((e) => def.validatorPrefixes.some((p) => e.toLowerCase().startsWith(p)) || e.includes(courseId));
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

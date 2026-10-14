/**
 * Native-language translation workflow (P2b):
 *
 *   bun scripts/translate-native.ts extract --from en --to vi --target fr
 *       → content/<target>/translations/<to>.jsonl: one record per string
 *         still without a draft (existing drafts are kept), ready for the
 *         prompt template in plan/authoring/TRANSLATION-STYLE-<to>.md.
 *   bun scripts/translate-native.ts apply --from en --to vi --target fr
 *       → writes the `<to>` keys into content/<target>/** records and the
 *         assessment overlays, emits content/courses/<target>-<to>.json from
 *         content/courses/<target>-<from>.json plus <target>-<to>.map.json,
 *         and writes the review sheet content/<target>/REVIEW-<to>.md.
 *         Fail-closed: any string without a draft (or with a stale one) is
 *         listed and the command exits 1 — `fr-vi` cannot compile until
 *         every string has a draft; the compiler's own validators then
 *         refuse any record that is still missing the native code.
 *   bun scripts/translate-native.ts status --from en --to vi --target fr
 *       → counts only.
 *
 * No network: the only draft source is the JSONL file (JsonlDraftProvider).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

import { PackSchema, type PackSource } from "../content/schema";
import { getPath, setPath } from "./lib/native-fields";
import { canonicalJson, readJson, safeResolve } from "./lib/pipeline";
import { DictionaryDraftProvider, JsonlDraftProvider, LayeredDraftProvider, type Draft } from "./lib/translate/provider";
import { assessmentOverlaySlots, loadContentDocs, packSlots, recordSlots, type Slot } from "./lib/translate/walk";

const args = process.argv.slice(2);
const command = args[0];
const opt = (name: string, fallback?: string): string => {
  const i = args.indexOf(`--${name}`);
  const v = i >= 0 ? args[i + 1] : undefined;
  if (v === undefined) {
    if (fallback !== undefined) return fallback;
    throw new Error(`missing --${name}`);
  }
  return v;
};

if (!["extract", "apply", "status"].includes(command ?? "")) {
  console.error("usage: bun scripts/translate-native.ts <extract|apply|status> --from en --to vi --target fr [--drafts <file>]");
  process.exit(2);
}
/** Indentation width of an existing JSON file (2 when it does not exist yet). */
function detectIndent(rel: string): number {
  const abs = safeResolve(rel);
  if (!existsSync(abs)) return 2;
  const match = /\n( +)"/.exec(readFileSync(abs, "utf8"));
  return match ? match[1].length : 2;
}

const from = opt("from", "en");
const to = opt("to");
const target = opt("target");
const draftsRel = opt("drafts", `content/${target}/translations/${to}.jsonl`);
const NATIVE_LANGUAGE_NAMES: Record<string, string> = { en: "English", vi: "Vietnamese", fr: "French" };
const sourceCourseId = `${target}-${from}`;
const newCourseId = `${target}-${to}`;

const dictionaryRel = opt("dictionary", `content/${target}/translations/${to}.dictionary.json`);
const jsonl = new JsonlDraftProvider(safeResolve(draftsRel), from, to);
const dictionary = new DictionaryDraftProvider(safeResolve(dictionaryRel));
/** Markdown (guidebooks, explanations) and structured records are always per key. */
const dictionaryAllowed = (key: string) => !/guidebook$|\.explanation$|\.wordBank$|\.typeAnswer$/.test(key);
const provider = new LayeredDraftProvider(jsonl, dictionary, dictionaryAllowed);
const docs = loadContentDocs(target).map((d) => ({ ...d, to }));
const packRel = `content/courses/${sourceCourseId}.json`;
const pack = PackSchema.parse(readJson(packRel));

type Unit = { slot: Slot; apply: (draft: Draft) => string[] };
const units: Unit[] = [];
for (const loaded of docs) {
  for (const { slot, set } of recordSlots(loaded, from)) {
    units.push({ slot, apply: (draft) => (typeof draft === "string" ? (set(draft), []) : [`${slot.key}: draft must be a string`]) });
  }
  for (const { slot, set } of assessmentOverlaySlots(loaded, from, to)) {
    units.push({ slot, apply: (draft) => (typeof draft === "string" ? (set(draft), []) : [`${slot.key}: draft must be a string`]) });
  }
}

/** The new pack, built by applying drafts onto a deep copy of the source pack. */
let newPack: PackSource = JSON.parse(JSON.stringify(pack)) as PackSource;
for (const { slot, path: p } of packSlots(pack, packRel)) {
  units.push({
    slot,
    apply: (draft) => {
      if (slot.exerciseType === "wordBank" && slot.key.endsWith(".wordBank")) {
        if (typeof draft !== "object" || typeof draft.answer !== "string") return [`${slot.key}: wordBank draft needs {answer, distractors}`];
        const answer = draft.answer.trim().split(/\s+/);
        const distractors = Array.isArray(draft.distractors) ? (draft.distractors as string[]) : [];
        const exercise = getPath(newPack, p) as Record<string, unknown>;
        const tokens = shuffleDeterministic([...answer, ...distractors.filter((d) => !answer.includes(d))], slot.key);
        newPack = setPath(newPack, p, { ...exercise, tokens, answer });
        return [];
      }
      if (slot.exerciseType === "typeAnswer" && slot.key.endsWith(".typeAnswer")) {
        if (typeof draft !== "object" || typeof draft.answer !== "string") return [`${slot.key}: typeAnswer draft needs {answer, alternatives}`];
        const exercise = getPath(newPack, p) as Record<string, unknown>;
        newPack = setPath(newPack, p, { ...exercise, answer: draft.answer, alternatives: Array.isArray(draft.alternatives) ? draft.alternatives : [] });
        return [];
      }
      if (typeof draft !== "string") return [`${slot.key}: draft must be a string`];
      newPack = setPath(newPack, p, draft);
      return [];
    },
  });
}

/** Stable shuffle of the token bank (seeded by the slot key) so a re-run emits identical bytes. */
function shuffleDeterministic(items: string[], seedText: string): string[] {
  let seed = 2166136261;
  for (const ch of seedText) seed = Math.imul(seed ^ ch.charCodeAt(0), 16777619) >>> 0;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------------------------------------------------------------------------
const missing: Slot[] = [];
const applied: string[] = [];
const problems: string[] = [];
for (const unit of units) {
  const draft = provider.lookup(unit.slot.key, unit.slot.source);
  if (draft === undefined) {
    missing.push(unit.slot);
    continue;
  }
  if (command === "apply") problems.push(...unit.apply(draft));
  applied.push(unit.slot.key);
}
const stale = provider.stale();

if (command === "status") {
  console.log(`${target} ${from}→${to}: ${units.length} strings, ${applied.length} drafted, ${missing.length} missing, ${stale.length} stale`);
  process.exit(missing.length === 0 && stale.length === 0 ? 0 : 1);
}

if (command === "extract") {
  const abs = safeResolve(draftsRel);
  mkdirSync(path.dirname(abs), { recursive: true });
  // Per-key file: only the slots the dictionary cannot serve (markdown,
  // structured) plus any existing per-key override; everything else goes to
  // the dictionary skeleton (unique source text → draft).
  const lines: string[] = [];
  const dict: Record<string, string> = {};
  for (const unit of units) {
    const key = unit.slot.key;
    const raw = jsonl.has(key) ? jsonl.draftOf(key) : undefined;
    const own = typeof raw === "string" ? (raw.trim() === "" ? undefined : raw) : raw;
    if (!dictionaryAllowed(key) || own !== undefined) {
      const keep = own !== undefined && jsonl.lookup(key, unit.slot.source) !== undefined;
      const rec: Record<string, unknown> = { key, [from]: unit.slot.source, [to]: keep ? own : "" };
      if (unit.slot.note) rec.note = unit.slot.note;
      if (unit.slot.exerciseType) rec.type = unit.slot.exerciseType;
      lines.push(JSON.stringify(rec));
    } else if (!(unit.slot.source in dict)) {
      dict[unit.slot.source] = dictionary.draftOf(unit.slot.source) ?? "";
    }
  }
  writeFileSync(abs, `${lines.join("\n")}\n`);
  writeFileSync(safeResolve(dictionaryRel), `${JSON.stringify(dict, null, 2)}\n`);
  const dictMissing = Object.values(dict).filter((v) => v === "").length;
  console.log(
    `${draftsRel}: ${lines.length} per-key records; ${dictionaryRel}: ${Object.keys(dict).length} unique strings (${dictMissing} to draft); ${units.length} slots total, ${missing.length} still missing, ${stale.length} stale`
  );
  process.exit(0);
}

// apply
if (problems.length > 0 || missing.length > 0 || stale.length > 0) {
  for (const p of problems) console.error(`ERROR ${p}`);
  for (const s of stale) console.error(`STALE ${s.key}: source changed`);
  console.error(`${missing.length} string(s) without a draft — run \`extract\`, draft them with the style guide, then \`apply\` again.`);
  for (const m of missing.slice(0, 20)) console.error(`  ${m.key}`);
  process.exit(1);
}

// 1. content/<target>/** files with the new native code.
for (const loaded of docs) {
  // Keep each source file's own indentation so the diff is the added keys only.
  writeFileSync(safeResolve(loaded.rel), `${JSON.stringify(loaded.doc, null, detectIndent(loaded.rel))}\n`);
}
// 2. The new course pack + id map.
const idMap: Record<string, string> = {};
/**
 * Ids: section and unit ids are TARGET-level identities shared by every
 * native language of the course (checkpoints reference them) and stay as
 * authored; lesson and exercise ids are per course (persisted learner data)
 * and follow the `<courseId>:<unit>-<lesson>-e<n>` convention. Lesson flows
 * reference exercise ids and are rewritten through the same map.
 */
const rewriteIds = (p: PackSource): PackSource => ({
  ...p,
  id: newCourseId,
  nativeCode: to,
  nativeLanguage: NATIVE_LANGUAGE_NAMES[to] ?? to,
  sections: p.sections.map((section) => ({
    ...section,
    units: section.units.map((unit) => ({
      ...unit,
      lessons: unit.lessons.map((lesson) => {
        const lessonId = lesson.id.replace(new RegExp(`^${sourceCourseId}:`), `${newCourseId}:`);
        const local: Record<string, string> = {};
        const exercises = lesson.exercises.map((e, x) => {
          const id = `${lessonId}-e${x}`;
          idMap[id] = e.id;
          local[e.id] = id;
          return { ...e, id };
        });
        const flow = (lesson as { flow?: unknown }).flow;
        const rewrittenFlow = Array.isArray(flow)
          ? flow.map((step) => (typeof step === "string" ? (local[step] ?? step) : rewriteFlowStep(step as Record<string, unknown>, local)))
          : undefined;
        return { ...lesson, id: lessonId, exercises, ...(rewrittenFlow !== undefined ? { flow: rewrittenFlow } : {}) } as typeof lesson;
      }),
    })),
  })),
});

/** A flow step object: every string value that is a source exercise id is remapped. */
function rewriteFlowStep(step: Record<string, unknown>, local: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(step)) {
    if (typeof v === "string") out[k] = local[v] ?? v;
    else if (Array.isArray(v)) out[k] = v.map((x) => (typeof x === "string" ? (local[x] ?? x) : x));
    else out[k] = v;
  }
  return out;
}
const rewritten = JSON.parse(JSON.stringify(rewriteIds(newPack))) as Record<string, unknown>;
delete rewritten.frozenExerciseIds;
writeFileSync(safeResolve(`content/courses/${newCourseId}.json`), `${JSON.stringify(rewritten, null, 2)}\n`);
writeFileSync(safeResolve(`content/courses/${newCourseId}.map.json`), canonicalJson({ source: sourceCourseId, generator: "scripts/translate-native.ts", exercises: idMap }));
// 3. Review sheet.
writeReviewSheet();
console.log(`applied ${applied.length} drafts: content/${target}/** (+${to}), content/courses/${newCourseId}.json, ${newCourseId}.map.json, content/${target}/REVIEW-${to}.md`);

function writeReviewSheet(): void {
  const lines: string[] = [
    `# Native review sheet — ${target} → ${to} (generated by scripts/translate-native.ts)`,
    "",
    `Every learner-facing string of the \`${newCourseId}\` course with its \`${from}\` source and the \`${to}\` draft, grouped by file. Reviewer: mark each line ✅ / ✏️ (with the corrected text) / ❌. Lines flagged **re-author** are word banks and typed answers whose Vietnamese word order differs from the source — check the token bank and accepted variants, not only the wording. Review status: **pending native review** (see release/KNOWN_LIMITATIONS.md).`,
    "",
    `Strings: ${units.length} · drafts applied: ${applied.length}`,
    "",
  ];
  let currentFile = "";
  for (const unit of units) {
    const [file] = unit.slot.key.split("#");
    if (file !== currentFile) {
      currentFile = file;
      lines.push(`## ${file}`, "");
    }
    const draft = provider.lookup(unit.slot.key, unit.slot.source);
    const flag = unit.slot.note ? " **re-author**" : "";
    const shown = typeof draft === "string" ? draft : JSON.stringify(draft);
    lines.push(`- \`${unit.slot.key.split("#")[1]}\`${flag}`, `  - ${from}: ${unit.slot.source.replace(/\n/g, "⏎")}`, `  - ${to}: ${(shown ?? "").replace(/\n/g, "⏎")}`);
  }
  writeFileSync(safeResolve(`content/${target}/REVIEW-${to}.md`), `${lines.join("\n")}\n`);
}


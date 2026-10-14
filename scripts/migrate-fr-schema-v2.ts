/**
 * One-shot, idempotent migration of content/fr/** to the P1c schema
 * (`bun scripts/migrate-fr-schema-v2.ts`). Mechanical rewrites only —
 * no wording changes:
 *
 *   lexicon/lexemes.json      nativeGloss → glosses.en;
 *                             examples[{fr,en,source}] → [{target, translations.en, source}]
 *   pedagogy/concepts.json    title/shortRule/explanation/memoryHint/exceptions[] → {en}
 *                             examples[{fr,en,note}] → [{target, translations.en, note.en}]
 *   pedagogy/conjugations.json → pedagogy/paradigms.json
 *                             verbs[{lemma,english,group,auxiliary,cells}] →
 *                             tables[{lemma, gloss.en, group, cells, evidence.source, attributes.auxiliary}]
 *   assessment/objectives.json      title, canDo → {en}
 *   assessment/checkpoints.json     title, description → {en}
 *   assessment/placement.json       stages[].title → {en}
 *   reception/reading.json          supportGlossary[].gloss → {en}
 *   speech/items.json               prompt.instruction, cueFacts[].label → {en}
 *   writing/tasks.json              instruction, cueFacts[].label, rubric slot description → {en}
 *   interaction/scenarios.json      title, goal, learner-node prompt → {en}
 *
 * The compiled artifacts stay byte-identical: the compiler resolves every
 * record by each course's nativeCode (content/courses/fr-en.json → "en").
 * Each file keeps its own indentation and trailing newline. Running the
 * script twice is a no-op (already-migrated shapes are recognised).
 */
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";

import { safeResolve } from "./lib/pipeline";

const NATIVE = process.argv.includes("--native") ? process.argv[process.argv.indexOf("--native") + 1] : "en";
const TARGET = process.argv.includes("--target") ? process.argv[process.argv.indexOf("--target") + 1] : "fr";
const ROOT = `content/${TARGET}`;

type Json = Record<string, unknown>;

function readWithFormat(rel: string): { doc: Json; indent: number; trailingNewline: boolean } | null {
  const abs = safeResolve(rel);
  if (!existsSync(abs)) return null;
  const raw = readFileSync(abs, "utf8");
  const indentMatch = /\n( +)"/.exec(raw);
  return {
    doc: JSON.parse(raw) as Json,
    indent: indentMatch ? indentMatch[1].length : 2,
    trailingNewline: raw.endsWith("\n"),
  };
}

function write(rel: string, doc: Json, indent: number, trailingNewline: boolean): void {
  writeFileSync(safeResolve(rel), `${JSON.stringify(doc, null, indent)}${trailingNewline ? "\n" : ""}`);
}

const isRecord = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);

/** A plain string becomes `{ [NATIVE]: s }`; an existing record is kept. */
function toNative(value: unknown, where: string): Json {
  if (typeof value === "string") return { [NATIVE]: value };
  if (isRecord(value)) return value;
  throw new Error(`${where}: expected a string or a native-text record, got ${JSON.stringify(value)}`);
}

/** Rewrites `obj[key]` in place (key order preserved). */
function nativize(obj: Json, key: string, where: string): void {
  if (obj[key] === undefined) return;
  obj[key] = toNative(obj[key], `${where}.${key}`);
}

function migrateExample(ex: Json, where: string): Json {
  if (typeof ex.target === "string" && isRecord(ex.translations)) return ex; // already migrated
  if (typeof ex[TARGET] !== "string" || typeof ex[NATIVE] !== "string") {
    throw new Error(`${where}: example must carry "${TARGET}" and "${NATIVE}" strings`);
  }
  const out: Json = { target: ex[TARGET], translations: { [NATIVE]: ex[NATIVE] } };
  if (ex.source !== undefined) out.source = ex.source;
  if (ex.note !== undefined) out.note = toNative(ex.note, `${where}.note`);
  for (const key of Object.keys(ex)) {
    if (![TARGET, NATIVE, "source", "note"].includes(key)) throw new Error(`${where}: unexpected example key ${key}`);
  }
  return out;
}

/** Rebuilds an object with one key renamed in place (same position). */
function renameKey(obj: Json, from: string, to: string, map: (v: unknown) => unknown): Json {
  const out: Json = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === from) out[to] = map(value);
    else out[key] = value;
  }
  return out;
}

let changed = 0;
function migrate(rel: string, fn: (doc: Json) => Json | void): void {
  const loaded = readWithFormat(rel);
  if (!loaded) {
    console.log(`skip   ${rel} (absent)`);
    return;
  }
  const before = JSON.stringify(loaded.doc);
  const result = fn(loaded.doc) ?? loaded.doc;
  if (JSON.stringify(result) === before) {
    console.log(`ok     ${rel} (already migrated)`);
    return;
  }
  write(rel, result, loaded.indent, loaded.trailingNewline);
  changed += 1;
  console.log(`wrote  ${rel}`);
}

// --- lexicon -------------------------------------------------------------
migrate(`${ROOT}/lexicon/lexemes.json`, (doc) => {
  const lexemes = (doc.lexemes as Json[]).map((lex) => {
    let out = lex;
    if (typeof out.nativeGloss === "string") out = renameKey(out, "nativeGloss", "glosses", (v) => ({ [NATIVE]: v }));
    out = { ...out, examples: (out.examples as Json[]).map((ex, i) => migrateExample(ex, `${lex.id}.examples[${i}]`)) };
    return out;
  });
  return { ...doc, lexemes };
});

// --- pedagogy ------------------------------------------------------------
migrate(`${ROOT}/pedagogy/concepts.json`, (doc) => {
  for (const concept of doc.concepts as Json[]) {
    const where = String(concept.id);
    for (const key of ["title", "shortRule", "explanation", "memoryHint"]) nativize(concept, key, where);
    concept.examples = (concept.examples as Json[]).map((ex, i) => migrateExample(ex, `${where}.examples[${i}]`));
    concept.exceptions = (concept.exceptions as unknown[]).map((e, i) => toNative(e, `${where}.exceptions[${i}]`));
  }
});

{
  const legacy = `${ROOT}/pedagogy/conjugations.json`;
  const modern = `${ROOT}/pedagogy/paradigms.json`;
  const loaded = readWithFormat(legacy);
  if (loaded) {
    const doc = loaded.doc;
    const tables = (doc.verbs as Json[]).map((verb) => {
      const attributes: Json = {};
      if (verb.auxiliary !== undefined) attributes.auxiliary = verb.auxiliary;
      return {
        lemma: verb.lemma,
        gloss: toNative(verb.english ?? verb.gloss, `${String(verb.lemma)}.gloss`),
        group: verb.group,
        cells: verb.cells,
        evidence: { source: "lexique-4" },
        ...(Object.keys(attributes).length > 0 ? { attributes } : {}),
      };
    });
    write(modern, { version: doc.version, language: doc.language, tables }, loaded.indent, loaded.trailingNewline);
    unlinkSync(safeResolve(legacy));
    changed += 1;
    console.log(`wrote  ${modern} (from conjugations.json, removed)`);
  } else {
    console.log(`ok     ${modern} (conjugations.json already migrated or absent)`);
  }
}

// --- assessment ----------------------------------------------------------
migrate(`${ROOT}/assessment/objectives.json`, (doc) => {
  for (const o of doc.objectives as Json[]) {
    nativize(o, "title", String(o.id));
    nativize(o, "canDo", String(o.id));
  }
});
migrate(`${ROOT}/assessment/checkpoints.json`, (doc) => {
  for (const cp of doc.checkpoints as Json[]) {
    nativize(cp, "title", String(cp.id));
    nativize(cp, "description", String(cp.id));
  }
});
migrate(`${ROOT}/assessment/placement.json`, (doc) => {
  for (const stage of doc.stages as Json[]) nativize(stage, "title", String(stage.id));
});

// --- reception -----------------------------------------------------------
migrate(`${ROOT}/reception/reading.json`, (doc) => {
  for (const reading of doc.readings as Json[]) {
    for (const g of reading.supportGlossary as Json[]) nativize(g, "gloss", `${String(reading.id)}.supportGlossary`);
  }
});

// --- speech --------------------------------------------------------------
migrate(`${ROOT}/speech/items.json`, (doc) => {
  for (const item of doc.items as Json[]) {
    const prompt = item.prompt as Json;
    nativize(prompt, "instruction", `${String(item.id)}.prompt`);
    for (const fact of (prompt.cueFacts as Json[] | undefined) ?? []) nativize(fact, "label", `${String(item.id)}.cueFacts`);
  }
});

// --- writing -------------------------------------------------------------
migrate(`${ROOT}/writing/tasks.json`, (doc) => {
  for (const task of doc.tasks as Json[]) {
    const where = String(task.id);
    nativize(task, "instruction", where);
    for (const fact of (task.cueFacts as Json[] | undefined) ?? []) nativize(fact, "label", `${where}.cueFacts`);
    for (const slot of (task.rubric as Json).requiredSlots as Json[]) nativize(slot, "description", `${where}.rubric`);
  }
});

// --- interaction ---------------------------------------------------------
migrate(`${ROOT}/interaction/scenarios.json`, (doc) => {
  for (const scenario of doc.scenarios as Json[]) {
    const where = String(scenario.id);
    nativize(scenario, "title", where);
    nativize(scenario, "goal", where);
    for (const node of Object.values(scenario.nodes as Record<string, Json>)) {
      if (node.kind === "learner") nativize(node, "prompt", `${where}/${String(node.id)}`);
    }
  }
});

console.log(changed === 0 ? "nothing to migrate" : `migrated ${changed} file(s) — run bun run content:compile and the goldens`);

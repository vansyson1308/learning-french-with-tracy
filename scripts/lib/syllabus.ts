/**
 * Lexical syllabus (P3e): which lexemes a level covers and which unit of
 * the target's primary course unlocks each one for the "daily new words"
 * stream (TODAY introduces N of them per day, in order, once the learner
 * has reached their unit). A committed `content/<lang>/lexicon/syllabus.json`
 * is authoritative; without one the compiler derives the same list with
 * `deriveSyllabus` (French: no content change, only the stream reads the
 * existing lexicon).
 *
 * Derivation (deterministic, documented in every file it writes):
 *   members  = lexemes the primary course teaches ∪ the "very-common" and
 *              "common" frequency bands, minus regional forms (VARIETY.md)
 *   unit     = the first unit whose word list teaches the lexeme; otherwise
 *              the first unit teaching any lexeme of the same topic;
 *              otherwise the first unit of the course
 *   order    = unit order, then frequency rank (most frequent first)
 */

import { existsSync } from "fs";

import { syllabusSchema, type PackSource, type RichLexicon, type Syllabus } from "../../content/schema";

import { readJson, safeResolve, type ValidationResult } from "./pipeline";

export const SYLLABUS_DERIVATION =
  "members: lexemes taught by the primary course + frequency bands very-common/common; unit: first unit teaching the lexeme, else first unit teaching its topic, else the first unit; order: unit, then frequency rank";

export function syllabusPath(lang: string): string {
  return `content/${lang}/lexicon/syllabus.json`;
}

export function loadSyllabus(lang: string): Syllabus | null {
  const rel = syllabusPath(lang);
  return existsSync(safeResolve(rel)) ? syllabusSchema(lang).parse(readJson(rel)) : null;
}

function unitOrder(pack: PackSource): { id: string; surfaces: Set<string> }[] {
  return pack.sections.flatMap((s) => s.units.map((u) => ({ id: u.id, surfaces: new Set(u.words.map((w) => w.target)) })));
}

export function deriveSyllabus(args: { lang: string; level: string; minLexemes: number; lexicon: RichLexicon; pack: PackSource }): Syllabus {
  const units = unitOrder(args.pack);
  const unitIndex = new Map(units.map((u, i) => [u.id, i]));
  const firstUnitOf = (surface: string) => units.find((u) => u.surfaces.has(surface))?.id;
  const topicUnit = new Map<string, string>();
  for (const lex of args.lexicon.lexemes) {
    const unit = firstUnitOf(lex.surface);
    if (!unit || !lex.topic) continue;
    const current = topicUnit.get(lex.topic);
    if (current === undefined || unitIndex.get(unit)! < unitIndex.get(current)!) topicUnit.set(lex.topic, unit);
  }
  const taught = new Set(units.flatMap((u) => [...u.surfaces]));
  // Regional forms (P3e variety) are accepted, never taught as the model.
  const members = args.lexicon.lexemes.filter((l) => !l.variety && (taught.has(l.surface) || l.frequency?.band === "very-common" || l.frequency?.band === "common"));
  const rank = (l: (typeof members)[number]) => l.frequency?.rank ?? Number.MAX_SAFE_INTEGER;
  const entries = members
    .map((l) => ({ lexemeId: l.id, unitId: firstUnitOf(l.surface) ?? (l.topic ? topicUnit.get(l.topic) : undefined) ?? units[0]?.id ?? "", rank: rank(l), surface: l.surface }))
    .sort((a, b) => unitIndex.get(a.unitId)! - unitIndex.get(b.unitId)! || a.rank - b.rank || a.surface.localeCompare(b.surface))
    .map(({ lexemeId, unitId }) => ({ lexemeId, unitId }));
  return { version: 1, language: args.lang, level: args.level, minLexemes: args.minLexemes, derivation: SYLLABUS_DERIVATION, entries };
}

/** Entries resolve, units belong to the primary course, no duplicates, the floor is met, every entry is renderable in every rich native language. */
export function validateSyllabusData(input: { syllabus: Syllabus; lang: string; lexicon: RichLexicon; pack: PackSource; nativeCodes: readonly string[] }): ValidationResult {
  const errors: string[] = [];
  const err = (m: string) => errors.push(`syllabus (${input.lang}): ${m}`);
  const { syllabus } = input;
  if (syllabus.language !== input.lang) err(`language "${syllabus.language}" ≠ content/${input.lang}/`);
  const byId = new Map(input.lexicon.lexemes.map((l) => [l.id, l]));
  const units = new Set(input.pack.sections.flatMap((s) => s.units.map((u) => u.id)));
  const seen = new Set<string>();
  for (const e of syllabus.entries) {
    if (seen.has(e.lexemeId)) err(`duplicate lexeme ${e.lexemeId}`);
    seen.add(e.lexemeId);
    const lex = byId.get(e.lexemeId);
    if (!lex) {
      err(`unknown lexeme ${e.lexemeId}`);
      continue;
    }
    if (!units.has(e.unitId)) err(`${e.lexemeId}: unit ${e.unitId} is not a unit of ${input.pack.id}`);
    if (lex.variety) err(`${e.lexemeId}: a regional form (${lex.variety.region}) is never a syllabus word — teach ${lex.variety.equivalent}`);
    for (const code of input.nativeCodes) {
      if (!lex.glosses[code]) err(`${e.lexemeId}: no "${code}" gloss — a daily word needs one`);
      if (!lex.examples.some((x) => x.translations[code])) err(`${e.lexemeId}: no example translated into "${code}" — a daily word shows one`);
    }
  }
  if (syllabus.entries.length < syllabus.minLexemes) err(`${syllabus.entries.length} lexemes, the ${syllabus.level} floor is ${syllabus.minLexemes}`);
  return { errors, warnings: [] };
}

/** The runtime artifact: delivery order with unlock units (native-independent). */
export function compileDailyWordsArtifact(syllabus: Syllabus): string {
  return `${JSON.stringify({ version: 1, language: syllabus.language, level: syllabus.level, entries: syllabus.entries.map((e) => ({ id: e.lexemeId, unitId: e.unitId })) }, null, 2)}\n`;
}

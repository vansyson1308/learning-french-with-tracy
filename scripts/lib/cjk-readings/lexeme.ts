/**
 * Rich-lexeme reading rules (P4b stage 4), run by the lexicon validator
 * for every lexeme of a language with reading notations (ja kana, zh
 * pinyin, ko rr — scripts/lib/languages BUILD_LANGUAGES `readings`):
 *
 *  - `pronunciation` is present, labelled with one of the language's
 *    notations, and its value is the reading in that notation (the kana,
 *    the pinyin, the rr) — the runtime's dictionary plugins read exactly
 *    this pair from the compiled lexicon index;
 *  - `reading` holds that notation's fields and passes the reading
 *    contract (validate.ts) for the lexeme's surface;
 *  - the surface is the course spelling: a zh `reading.simplified` (a
 *    pool-only field) is never on a lexeme.
 * A language without notations carries neither a reading nor a CJK
 * pronunciation notation.
 */

import { isReadingNotation, pronunciationValueOf, readingErrors, type ReadingNotation, type StoredReading } from "./validate";

type LexemeLike = {
  surface: string;
  partOfSpeech: string;
  pronunciation?: { value: string; notation: string };
  reading?: StoredReading;
};

export function lexemeReadingErrors(notations: readonly ReadingNotation[], lex: LexemeLike): string[] {
  const errors: string[] = [];
  const p = lex.pronunciation;
  if (notations.length === 0) {
    if (lex.reading !== undefined) errors.push("carries a reading but the language has no reading notation");
    if (p && isReadingNotation(p.notation)) errors.push(`pronunciation notation "${p.notation}" belongs to a CJK language`);
    return errors;
  }
  if (!p) return [`no pronunciation — every lexeme of this language carries its reading (${notations.join(" / ")})`];
  if (!isReadingNotation(p.notation) || !notations.includes(p.notation)) {
    return [`pronunciation notation "${p.notation}" is not one of this language's reading notations (${notations.join(", ")})`];
  }
  if (lex.reading === undefined) return [`no reading object for its ${p.notation} pronunciation`];
  for (const m of readingErrors(p.notation, lex.surface, lex.partOfSpeech, lex.reading)) errors.push(`reading: ${m}`);
  const value = pronunciationValueOf(p.notation, lex.reading);
  if (value !== undefined && value !== p.value) errors.push(`pronunciation "${p.value}" ≠ its reading's ${p.notation} "${value}"`);
  if (lex.reading.simplified !== undefined) errors.push(`reading.simplified is a pool-only field — a lexeme's surface is the simplified spelling`);
  return errors;
}

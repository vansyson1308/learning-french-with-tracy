/**
 * Reading validators (P4b stage 4) — the contract for every stored CJK
 * reading, whether on a rich lexeme (content/<lang>/lexicon/lexemes.json)
 * or in a candidate pool's derived readings (lexeme-readings.json):
 *
 *  kana   kana only; a surface with kanji carries furigana whose bases
 *         concatenate back to the surface and whose rubies (kana bases as
 *         they are) concatenate back to the kana; a kana-only surface is
 *         its own reading.
 *  pinyin space-separated tone-marked syllables, each a pinyin syllable,
 *         as many as the surface has Han characters; the surface is Han
 *         only; the traditional spelling (when stored) has the same length.
 *  rr     equals the Revised Romanization rule output of the surface (or of
 *         its `rrSpelling`, the surface with `+` at compound boundaries).
 */

import { katakanaToHiragana } from "../../../src/lib/languages/ja";

import { isHangulSyllable, romanizeKorean, stripRrBoundaries } from "./korean-rr";
import { hanCount, isAllHan, pinyinShapeErrors, pinyinSyllableCount } from "./pinyin";

export const READING_NOTATIONS = ["kana", "pinyin", "rr"] as const;
export type ReadingNotation = (typeof READING_NOTATIONS)[number];

export type FuriganaSegment = { base: string; ruby?: string };
export type StoredReading = {
  kana?: string;
  furigana?: FuriganaSegment[];
  pinyin?: string;
  traditional?: string;
  simplified?: string;
  rr?: string;
  rrSpelling?: string;
};

const KANA_ONLY = /^[\p{Script=Hiragana}\p{Script=Katakana}ー゛゜]+$/u;
const HAS_HAN = /[\p{Script=Han}々〆ヶ]/u;

export function isReadingNotation(n: string): n is ReadingNotation {
  return (READING_NOTATIONS as readonly string[]).includes(n);
}

/** Furigana segments → errors against the surface and its kana. */
export function furiganaErrors(surface: string, kana: string, segments: readonly FuriganaSegment[]): string[] {
  const errors: string[] = [];
  if (segments.map((s) => s.base).join("") !== surface) errors.push(`furigana bases "${segments.map((s) => s.base).join("")}" do not spell the surface "${surface}"`);
  const spoken = segments.map((s) => s.ruby ?? s.base).join("");
  if (katakanaToHiragana(spoken) !== katakanaToHiragana(kana)) errors.push(`furigana reads "${spoken}", the kana is "${kana}"`);
  for (const s of segments) {
    if (s.ruby !== undefined && !HAS_HAN.test(s.base)) errors.push(`furigana ruby "${s.ruby}" sits on "${s.base}", which has no kanji`);
    if (s.ruby !== undefined && !KANA_ONLY.test(s.ruby)) errors.push(`furigana ruby "${s.ruby}" is not kana`);
    if (s.ruby === undefined && HAS_HAN.test(s.base)) errors.push(`furigana segment "${s.base}" has kanji but no ruby`);
  }
  return errors;
}

/** Errors of one stored reading in one notation, for a surface of a given part of speech. */
export function readingErrors(notation: ReadingNotation, surface: string, partOfSpeech: string, reading: StoredReading | undefined): string[] {
  const errors: string[] = [];
  if (reading === undefined) return [`no reading (notation ${notation})`];
  if (notation === "kana") {
    if (reading.kana === undefined) return ["no kana reading"];
    if (!KANA_ONLY.test(reading.kana)) errors.push(`kana "${reading.kana}" is not kana only`);
    if (HAS_HAN.test(surface)) {
      if (reading.furigana === undefined) errors.push(`"${surface}" has kanji but no furigana`);
      else errors.push(...furiganaErrors(surface, reading.kana, reading.furigana));
    } else if (!KANA_ONLY.test(surface)) {
      errors.push(`"${surface}" is neither kanji nor kana`);
    } else {
      if (reading.kana !== surface) errors.push(`kana-only "${surface}" must be its own reading, found "${reading.kana}"`);
      if (reading.furigana !== undefined) errors.push(`kana-only "${surface}" carries furigana`);
    }
  } else if (notation === "pinyin") {
    if (reading.pinyin === undefined) return ["no pinyin reading"];
    if (!isAllHan(surface)) errors.push(`pinyin surface "${surface}" is not Han characters only`);
    errors.push(...pinyinShapeErrors(reading.pinyin));
    const syllables = pinyinSyllableCount(reading.pinyin);
    if (syllables !== hanCount(surface)) errors.push(`pinyin "${reading.pinyin}" has ${syllables} syllable(s) for ${hanCount(surface)} hanzi in "${surface}"`);
    if (reading.traditional !== undefined && [...reading.traditional].length !== [...surface].length) {
      errors.push(`traditional "${reading.traditional}" and simplified "${surface}" differ in length`);
    }
    if (reading.simplified !== undefined) {
      if (reading.traditional !== surface) errors.push(`a reading with "simplified" belongs to a traditional-script surface (traditional must equal "${surface}")`);
      if (reading.simplified === surface || [...reading.simplified].length !== [...surface].length) errors.push(`simplified "${reading.simplified}" is not a different same-length spelling of "${surface}"`);
    }
  } else {
    if (reading.rr === undefined) return ["no rr reading"];
    if (![...surface].every(isHangulSyllable)) errors.push(`rr surface "${surface}" is not hangul syllables only`);
    const spelling = reading.rrSpelling ?? surface;
    if (stripRrBoundaries(spelling) !== surface) errors.push(`rrSpelling "${spelling}" does not spell "${surface}"`);
    const expected = romanizeKorean(spelling, { noun: partOfSpeech === "noun" });
    if (reading.rr !== expected) errors.push(`rr "${reading.rr}" ≠ the rule output "${expected}" of "${spelling}"`);
  }
  // A reading carries only the fields of its own notation.
  const own: Record<ReadingNotation, readonly (keyof StoredReading)[]> = {
    kana: ["kana", "furigana"],
    pinyin: ["pinyin", "traditional", "simplified"],
    rr: ["rr", "rrSpelling"],
  };
  for (const key of Object.keys(reading) as (keyof StoredReading)[]) {
    if (!own[notation].includes(key)) errors.push(`field "${key}" does not belong to a ${notation} reading`);
  }
  return errors;
}

export type DisplayReading = { kana?: string; furigana?: FuriganaSegment[]; pinyin?: string; rr?: string };

/**
 * The display fields of a stored reading (kana, furigana, pinyin, rr) —
 * what a course word carries as `Word.reading` and the lexicon index as
 * `reading`. The rule input `rrSpelling`, the zh `traditional` (emitted
 * beside it) and the pool-only `simplified` are not display fields;
 * undefined when nothing is left.
 */
export function displayReading(reading: StoredReading): DisplayReading | undefined {
  const out: DisplayReading = {};
  if (reading.kana !== undefined) out.kana = reading.kana;
  if (reading.furigana !== undefined) out.furigana = reading.furigana.map((s) => (s.ruby === undefined ? { base: s.base } : { base: s.base, ruby: s.ruby }));
  if (reading.pinyin !== undefined) out.pinyin = reading.pinyin;
  if (reading.rr !== undefined) out.rr = reading.rr;
  return Object.keys(out).length > 0 ? out : undefined;
}

/** The value a lexeme's `pronunciation` must carry for its reading. */
export function pronunciationValueOf(notation: ReadingNotation, reading: StoredReading): string | undefined {
  return notation === "kana" ? reading.kana : notation === "pinyin" ? reading.pinyin : reading.rr;
}

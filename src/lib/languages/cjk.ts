/**
 * Shared machinery for the Japanese, Chinese and Korean plugins (P1b; P4b
 * stage 3). Answers and transcripts carry no reliable spaces, so tokens
 * come from one of two paths:
 *
 *  - DICTIONARY path (a course's own words, handed in through
 *    `withLexicon`): deterministic left-to-right maximal match over the
 *    course's word list; characters no course word covers become one token
 *    per character cluster, Latin/digit runs one token each. Never touches
 *    Intl.Segmenter, so grading is identical on every runtime.
 *  - FALLBACK path (no course data): Intl.Segmenter (word granularity) when
 *    the runtime has it — Hermes gained it in RN 0.80+ — else one token per
 *    character cluster for han/kana and whitespace for hangul.
 *
 * Every function here is a pure string function; no plugin reads course
 * content itself (src/lib/languages/index.ts binds a course's words).
 */

import type { CourseLexicon } from "./types";

/** NFKC (full-width ↔ half-width, compatibility forms), case, punctuation and spaces (P1b form). */
export function foldCjk(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[　\s]+/g, " ")
    .replace(/[.,!?;:"'、。！？，：；「」『』…«»“”()（）]/g, "")
    .trim();
}

/**
 * Sentence punctuation of CJK text after NFKC (full-width ！，：；（） are
 * already ASCII by then): ideographic marks, brackets, middle dots, quotes.
 * Hyphens and tildes are NOT here — Japanese uses them as a long-vowel
 * mark, so each plugin decides.
 */
export const CJK_PUNCTUATION = /[.,!?;:"'、。「」『』【】〔〕〈〉《》…‥・·«»“”‘’()[\]{}]/g;

/** Marks that belong to the preceding character (combining marks, kana voicing, variation selectors, ZWJ). */
const CLUSTER_TAIL = /^[̀-゙゚ͯ︀-️‍\u{E0100}-\u{E01EF}]$/u;

/** Latin letters and decimal digits group into one token ("abc", "12"). */
const LATIN_OR_DIGIT = /^[\p{Script=Latin}\p{Nd}]$/u;

/** Any Han ideograph (CJK unified, extensions, compatibility, 々 and 〆). */
export const HAN = /[\p{Script=Han}々〆]/u;

/** NFKC + lower case + collapsed whitespace: the first step of every CJK fold. */
export function nfkcLower(text: string): string {
  return text.normalize("NFKC").toLowerCase().replace(/\s+/g, " ");
}

/**
 * Spaces next to a non-ASCII character are not word separators in ja/zh text ("私 は" = "私は"); Latin spacing stays —
 * including Latin letters with marks (P4c: the pinyin "wǒ shì" keeps its two words).
 */
export function dropCjkSpaces(text: string): string {
  return text
    .replace(/([^\x00-\x7F\p{Script=Latin}]) +/gu, "$1")
    .replace(/ +([^\x00-\x7F\p{Script=Latin}])/gu, "$1")
    .trim();
}

export function collapseSpaces(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** A word list folded into the form the matcher compares (built once per course). */
export type CjkDictionary = {
  readonly words: ReadonlySet<string>;
  /** Longest word, in code points. */
  readonly maxLength: number;
};

export const EMPTY_DICTIONARY: CjkDictionary = { words: new Set(), maxLength: 0 };

export function buildDictionary(words: Iterable<string>, fold: (word: string) => string): CjkDictionary {
  const set = new Set<string>();
  let maxLength = 0;
  for (const word of words) {
    const folded = fold(word).replace(/ /g, "");
    const length = [...folded].length;
    if (length < 2) continue; // one character is a token either way
    set.add(folded);
    maxLength = Math.max(maxLength, length);
  }
  return { words: set, maxLength };
}

/** Index just past the character cluster starting at `i`. */
function clusterEnd(cps: readonly string[], i: number): number {
  let j = i + 1;
  while (j < cps.length && (CLUSTER_TAIL.test(cps[j]!) || cps[j - 1]!.endsWith("‍"))) j++;
  return j;
}

/**
 * Deterministic left-to-right maximal match over one chunk of text (no
 * spaces): the longest dictionary word starting at each position wins;
 * otherwise a Latin/digit run, otherwise one character cluster.
 */
function matchChunk(chunk: string, dict: CjkDictionary, out: string[]): void {
  const cps = [...chunk];
  let i = 0;
  while (i < cps.length) {
    let end = 0;
    for (let len = Math.min(dict.maxLength, cps.length - i); len >= 2; len--) {
      if (dict.words.has(cps.slice(i, i + len).join(""))) {
        end = i + len;
        break;
      }
    }
    if (end === 0 && LATIN_OR_DIGIT.test(cps[i]!)) {
      end = i + 1;
      while (end < cps.length && LATIN_OR_DIGIT.test(cps[end]!)) end++;
    }
    if (end === 0) end = clusterEnd(cps, i);
    out.push(cps.slice(i, end).join(""));
    i = end;
  }
}

/** Tokens of folded text by maximal match; spaces are hard boundaries unless `ignoreSpaces`. */
export function maximalMatch(folded: string, dict: CjkDictionary, ignoreSpaces = false): string[] {
  const text = collapseSpaces(folded);
  if (text.length === 0) return [];
  const out: string[] = [];
  const chunks = ignoreSpaces ? [text.replace(/ /g, "")] : text.split(" ");
  for (const chunk of chunks) if (chunk.length > 0) matchChunk(chunk, dict, out);
  return out;
}

/**
 * Longest-first replacement of whole keys ("學生" → "学生", "學" → "学"),
 * one left-to-right pass; text no key covers is kept as is. Used for
 * variant spellings (zh traditional → the course's simplified spelling).
 */
export function replaceLongest(text: string, map: ReadonlyMap<string, string>, maxLength: number): string {
  if (map.size === 0) return text;
  const cps = [...text];
  let out = "";
  let i = 0;
  while (i < cps.length) {
    let hit: string | undefined;
    let len = Math.min(maxLength, cps.length - i);
    for (; len >= 1; len--) {
      hit = map.get(cps.slice(i, i + len).join(""));
      if (hit !== undefined) break;
    }
    if (hit !== undefined && len >= 1) {
      out += hit;
      i += len;
    } else {
      out += cps[i];
      i += 1;
    }
  }
  return out;
}

/**
 * P4c, free writing typed in a reading notation (ja kana, zh pinyin). `answer` is normalized free writing (tokens
 * joined by single spaces). Left to right, each run of whole tokens that are all reading-notation tokens and that
 * `spells` the key ("match") is replaced by `key`; "shorter" extends the run by one token, "past" gives up at this
 * start. Tokens in the target script are never part of a run, so a kanji / hanzi the learner typed is never
 * rewritten. Returns `answer` itself when nothing matched.
 */
export function replaceReadingRuns(
  answer: string,
  key: string,
  isReadingToken: (token: string) => boolean,
  spells: (run: readonly string[]) => "match" | "shorter" | "past"
): string {
  const tokens = answer.split(" ").filter((t) => t.length > 0);
  const out: string[] = [];
  let changed = false;
  let i = 0;
  while (i < tokens.length) {
    let end = -1;
    for (let j = i; j < tokens.length && isReadingToken(tokens[j]!); j++) {
      const verdict = spells(tokens.slice(i, j + 1));
      if (verdict === "match") end = j + 1;
      if (verdict !== "shorter") break;
    }
    if (end > 0) {
      out.push(key);
      changed = true;
      i = end;
    } else {
      out.push(tokens[i]!);
      i += 1;
    }
  }
  return changed ? out.join(" ") : answer;
}

type SegmenterLike ={ segment(input: string): Iterable<{ segment: string; isWordLike?: boolean }> };

function segmenterFor(locale: string): SegmenterLike | null {
  const IntlAny = Intl as unknown as { Segmenter?: new (loc: string, opts: { granularity: "word" }) => SegmenterLike };
  if (typeof IntlAny.Segmenter !== "function") return null;
  try {
    return new IntlAny.Segmenter(locale, { granularity: "word" });
  } catch {
    return null;
  }
}

/** The fallback tokenizer (no course data): segmenter words, else per-character clusters / whitespace. */
export function tokenizeCjk(locale: string, perCharacterFallback: boolean) {
  const segmenter = segmenterFor(locale);
  return (folded: string): string[] => {
    const text = collapseSpaces(folded);
    if (text.length === 0) return [];
    if (segmenter) {
      const out: string[] = [];
      for (const part of segmenter.segment(text)) {
        const piece = part.segment.trim();
        if (piece.length === 0) continue;
        if (part.isWordLike === false && !/[\p{L}\p{N}]/u.test(piece)) continue;
        out.push(piece);
      }
      return out;
    }
    if (!perCharacterFallback) return text.split(" ").filter((t) => t.length > 0);
    const cps = [...text.replace(/ /g, "")];
    const out: string[] = [];
    let i = 0;
    while (i < cps.length) {
      const end = clusterEnd(cps, i);
      out.push(cps.slice(i, end).join(""));
      i = end;
    }
    return out;
  };
}

/** The course's spellings, readings in one notation, and variant spellings, as maps a plugin folds once. */
export function lexiconMaps(
  lexicon: CourseLexicon,
  notation: string | undefined
): { words: string[]; readings: Map<string, string>; variants: Map<string, string> } {
  const words: string[] = [];
  const readings = new Map<string, string>();
  const variants = new Map<string, string>();
  for (const entry of lexicon.entries) {
    words.push(entry.surface);
    if (notation !== undefined && entry.reading?.notation === notation && entry.reading.value.trim().length > 0) {
      if (!readings.has(entry.surface)) readings.set(entry.surface, entry.reading.value);
    }
    for (const v of entry.variants ?? []) if (v !== entry.surface && !variants.has(v)) variants.set(v, entry.surface);
  }
  return { words, readings, variants };
}

/** Numbers 0–100 in a positional ideographic system (zh/ja kanji, ko sino-hangul share the shape). */
export function positionalNumber(
  value: number,
  digits: readonly string[],
  ten: string,
  hundred: string,
  zero: string,
  opts: { oneBeforeTen?: boolean } = {}
): string {
  if (!Number.isInteger(value) || value < 0 || value > 100) throw new RangeError(`number ${value} is outside 0–100`);
  if (value === 0) return zero;
  if (value === 100) return hundred;
  const tens = Math.floor(value / 10);
  const unit = value % 10;
  const tensPart = tens === 0 ? "" : tens === 1 ? (opts.oneBeforeTen ? digits[1] + ten : ten) : digits[tens] + ten;
  return tensPart + (unit === 0 ? "" : digits[unit]);
}

const DIGIT_RUN = /(^|[^0-9a-z])(\d{1,3})(?![0-9a-z])/g;

/**
 * Every digit run 0–100 not glued to Latin letters spelt in place, BEFORE
 * segmentation: CJK numerals then segment exactly like authored ones
 * ("12个" and "十二个" give the same tokens). Larger numbers stay digits.
 */
export function spellDigitRuns(text: string, speller: (value: number) => string): string {
  let prev: string;
  let out = text;
  do {
    prev = out;
    out = out.replace(DIGIT_RUN, (m, pre: string, digits: string) => (Number(digits) > 100 ? m : pre + speller(Number(digits))));
  } while (out !== prev);
  return out;
}

/** A standalone digit token 0–100 spelt by `speller`; any other token unchanged. */
export function spellDigitToken(token: string, speller: (value: number) => string): string {
  if (!/^\d{1,3}$/.test(token)) return token;
  const value = Number(token);
  return value > 100 ? token : speller(value);
}

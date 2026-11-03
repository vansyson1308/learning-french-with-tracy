/**
 * Korean rules (P1b; P4b stage 3).
 *
 *  - jamo: conjoining jamo compose by NFC (ᄇ+ᅡ+ᆮ → 받) and so do
 *    compatibility jamo typed one by one (ㅂㅏㄷ → 받, 바ㄷ → 받, a final
 *    moving on before a vowel as a keyboard does: ㄷㅏㄹㄱㅇㅣ → 닭이) in
 *    the lenient and spoken forms. Strict keeps what was typed.
 *  - spacing: the lenient ALTERNATE form drops every space, so
 *    "학생 입니다" = "학생입니다" for typed answers; with course words
 *    (withLexicon) the tokenizer is spacing-insensitive too (maximal match
 *    over the text without spaces). Without course data: Intl.Segmenter,
 *    else whitespace (eojeol).
 *  - numbers: a standalone digit is sino-Korean (1 → 일); a digit before a
 *    native counter is the native attributive form (1개 → 한 개, 3시 →
 *    세 시, 20살 → 스무 살). 하나 and 일 stay different words.
 *  - search fold: keystroke jamo (학생 → ㅎㅏㄱㅅㅐㅇ, clusters and
 *    compound vowels split), so any jamo prefix of a word matches it.
 */

import {
  buildDictionary,
  CJK_PUNCTUATION,
  collapseSpaces,
  lexiconMaps,
  maximalMatch,
  positionalNumber,
  spellDigitRuns,
  spellDigitToken,
  tokenizeCjk,
} from "./cjk";
import type { CourseLexicon, LanguageRules } from "./types";

// --- jamo -------------------------------------------------------------------

const CHO = [..."ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"];
const JUNG = [..."ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ"];
const JONG = ["", ..."ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ"];

const CLUSTER_PARTS: Readonly<Record<string, string>> = {
  ㄳ: "ㄱㅅ", ㄵ: "ㄴㅈ", ㄶ: "ㄴㅎ", ㄺ: "ㄹㄱ", ㄻ: "ㄹㅁ", ㄼ: "ㄹㅂ", ㄽ: "ㄹㅅ", ㄾ: "ㄹㅌ", ㄿ: "ㄹㅍ", ㅀ: "ㄹㅎ", ㅄ: "ㅂㅅ",
};
const VOWEL_PARTS: Readonly<Record<string, string>> = { ㅘ: "ㅗㅏ", ㅙ: "ㅗㅐ", ㅚ: "ㅗㅣ", ㅝ: "ㅜㅓ", ㅞ: "ㅜㅔ", ㅟ: "ㅜㅣ", ㅢ: "ㅡㅣ" };
const CLUSTER_OF = new Map(Object.entries(CLUSTER_PARTS).map(([c, parts]) => [parts, c] as const));
const COMPOUND_OF = new Map(Object.entries(VOWEL_PARTS).map(([c, parts]) => [parts, c] as const));

const SYLLABLE_BASE = 0xac00;
const isSyllable = (code: number) => code >= SYLLABLE_BASE && code <= 0xd7a3;

/**
 * Compatibility jamo composed into syllable blocks the way a 2-beolsik
 * keyboard composes them; a block with no final directly before jamo takes
 * them on (바ㄷ → 받). Every other character is left as it is.
 */
export function composeJamo(text: string): string {
  let out = "";
  let l = -1;
  let v = -1;
  let t = 0;
  const flush = () => {
    if (l >= 0 && v >= 0) out += String.fromCharCode(SYLLABLE_BASE + (l * 21 + v) * 28 + t);
    else if (l >= 0) out += CHO[l];
    else if (v >= 0) out += JUNG[v];
    l = -1;
    v = -1;
    t = 0;
  };
  const startConsonant = (ch: string) => {
    flush();
    const ci = CHO.indexOf(ch);
    if (ci >= 0) l = ci;
    else out += ch; // a final-only cluster (ㄳ) cannot start a block
  };
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    const vi = JUNG.indexOf(ch);
    const isConsonant = CHO.includes(ch) || JONG.indexOf(ch) > 0;
    if (isConsonant) {
      if (l >= 0 && v >= 0 && t === 0 && JONG.indexOf(ch) > 0) t = JONG.indexOf(ch);
      else if (l >= 0 && v >= 0 && t > 0 && CLUSTER_OF.has(JONG[t]! + ch)) t = JONG.indexOf(CLUSTER_OF.get(JONG[t]! + ch)!);
      else startConsonant(ch);
    } else if (vi >= 0) {
      if (l >= 0 && v < 0) v = vi;
      else if (l >= 0 && v >= 0 && t === 0 && COMPOUND_OF.has(JUNG[v]! + ch)) v = JUNG.indexOf(COMPOUND_OF.get(JUNG[v]! + ch)!);
      else if (l >= 0 && v >= 0 && t > 0) {
        // The final moves on to start the next block (a cluster gives up its second consonant).
        const parts = CLUSTER_PARTS[JONG[t]!];
        const carry = parts ? parts[1]! : JONG[t]!;
        t = parts ? JONG.indexOf(parts[0]!) : 0;
        flush();
        l = CHO.indexOf(carry);
        v = vi;
      } else {
        flush();
        v = vi;
      }
    } else if (isSyllable(code)) {
      flush();
      const s = code - SYLLABLE_BASE;
      l = Math.floor(s / 588);
      v = Math.floor((s % 588) / 28);
      t = s % 28;
    } else {
      flush();
      out += ch;
    }
  }
  flush();
  return out;
}

/** Keystroke jamo: 학생 → ㅎㅏㄱㅅㅐㅇ, 닭 → ㄷㅏㄹㄱ, 화 → ㅎㅗㅏ (a typed prefix is a prefix of the word). */
export function koreanKeystrokes(text: string): string {
  let out = "";
  for (const ch of text.normalize("NFC")) {
    const code = ch.charCodeAt(0);
    if (isSyllable(code)) {
      const s = code - SYLLABLE_BASE;
      const vowel = JUNG[Math.floor((s % 588) / 28)]!;
      const final = JONG[s % 28]!;
      out += CHO[Math.floor(s / 588)]! + (VOWEL_PARTS[vowel] ?? vowel) + (CLUSTER_PARTS[final] ?? final);
    } else out += CLUSTER_PARTS[ch] ?? VOWEL_PARTS[ch] ?? ch;
  }
  return out;
}

// --- numbers ----------------------------------------------------------------

const SINO_DIGITS = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
const NATIVE_UNITS = ["", "하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉"];
const NATIVE_ATTRIBUTIVE_UNITS = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉"];
const NATIVE_TENS = ["", "열", "스물", "서른", "마흔", "쉰", "예순", "일흔", "여든", "아흔"];

/** Sino-Korean cardinal 0–100 (영, 일, 십, 십일, 이십, 백). */
export function koreanSinoNumber(value: number): string {
  return positionalNumber(value, SINO_DIGITS, "십", "백", "영");
}

/** Native Korean cardinal 1–99 (하나, 열, 스물하나); `attributive` = the form before a counter (한, 스무, 스물한). */
export function koreanNativeNumber(value: number, attributive = false): string {
  if (!Number.isInteger(value) || value < 1 || value > 99) throw new RangeError(`native Korean number ${value} is outside 1–99`);
  if (attributive && value === 20) return "스무";
  const units = attributive ? NATIVE_ATTRIBUTIVE_UNITS : NATIVE_UNITS;
  return NATIVE_TENS[Math.floor(value / 10)]! + units[value % 10]!;
}

export function spellKoreanDigits(token: string): string {
  return spellDigitToken(token, koreanSinoNumber);
}

/** Counters that take native numbers (개월 is sino and excluded; 번 is both and left alone). */
const NATIVE_COUNTER = /(^|[^0-9])([1-9][0-9]?) ?(시간|마리|사람|그릇|송이|켤레|군데|개(?!월)|명|살|시|잔|권|병|장|대|벌)/g;

/** 1개 → 한 개, 3시 → 세 시, 20살 → 스무 살 (digits before native counters, as spoken). */
export function koreanNativeCounters(text: string): string {
  let prev: string;
  let out = text;
  do {
    prev = out;
    out = out.replace(NATIVE_COUNTER, (_m, pre: string, n: string, counter: string) => `${pre}${koreanNativeNumber(Number(n), true)} ${counter}`);
  } while (out !== prev);
  return out;
}

// --- forms ------------------------------------------------------------------

/** NFKC everywhere except hangul (NFKC would turn compatibility jamo into conjoining initials), then NFC. */
function widthFold(text: string): string {
  return text
    .replace(/[^ᄀ-ᇿ㄰-㆏ꥠ-꥿가-힣ힰ-퟿]+/g, (s) => s.normalize("NFKC"))
    .normalize("NFC")
    .toLowerCase();
}

/** Lenient / spoken form: width, case, jamo composed, punctuation; spaces collapsed (the alternate drops them). */
export function normalizeLenientKorean(text: string): string {
  return collapseSpaces(composeJamo(widthFold(text)).replace(CJK_PUNCTUATION, ""));
}

/** Strict form: width, case, NFC, punctuation; uncomposed jamo and spacing count. */
export function normalizeStrictKorean(text: string): string {
  return collapseSpaces(widthFold(text).replace(CJK_PUNCTUATION, ""));
}

const KO_READING_SPEED = {
  unit: "syllable",
  native: { min: 4.0, max: 6.0 },
  source: "estimate — no published Korean reading-aloud norm was checked; band set near typical read-speech rates of hangul syllable blocks",
  estimate: true,
} as const;

export function createKoreanRules(lexicon?: CourseLexicon): LanguageRules {
  const dict = lexicon && lexicon.entries.length > 0 ? buildDictionary(lexiconMaps(lexicon, undefined).words, normalizeLenientKorean) : null;
  const fallback = tokenizeCjk("ko-KR", false);
  return {
    code: "ko",
    ttsLocale: "ko-KR",
    recognitionLocale: "ko-KR",
    articleCue: () => undefined,
    splitArticle: (surface) => ({ bare: surface }),
    numberToWords: koreanSinoNumber,
    spellDigits: spellKoreanDigits,
    normalizeLenient: normalizeLenientKorean,
    normalizeLenientAlternate: (text) => normalizeLenientKorean(text).replace(/ /g, ""),
    normalizeStrict: normalizeStrictKorean,
    foldSpoken: normalizeLenientKorean,
    tokenize: (folded) => {
      // Native counters first (1개 → 한 개), then every other digit run is sino-Korean, before segmentation.
      const text = spellDigitRuns(koreanNativeCounters(folded), koreanSinoNumber);
      return dict ? maximalMatch(text, dict, true) : fallback(text);
    },
    fold: (text) => collapseSpaces(koreanKeystrokes(widthFold(text))),
    charsPerSecBand: KO_READING_SPEED,
    withLexicon: (next) => createKoreanRules(next),
  };
}

export const ko: LanguageRules = createKoreanRules();

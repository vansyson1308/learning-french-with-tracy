/**
 * Chinese (Mandarin, simplified) rules (P1b; P4b stage 3).
 *
 *  - tokenize: maximal match over the course's words when the course hands
 *    them in (withLexicon); otherwise Intl.Segmenter, else one token per
 *    character. A digit 2 before a measure word is 两 (2个 = 两个); a bare
 *    2 is 二, so 二个 (a learner error) never equals 两个.
 *  - simplified/traditional: a traditional spelling the course lexicon
 *    records for a word (from CC-CEDICT, which stores both) folds to the
 *    simplified surface in the lenient, spoken and search forms
 *    (學生 = 学生). The fold is word-level and data-driven: without course
 *    data nothing is folded — no character table ships in the app.
 *  - pinyin: an answer typed in pinyin for a key in hanzi counts as a
 *    LENIENT (practice) match when it spells the stored reading — with tone
 *    marks (nǐ hǎo), tone numbers (ni3 hao3) or no tones at all (ni hao);
 *    a tone that IS given must be the stored one (ni2 hao3 fails). Readings
 *    are the stored ones, so 了 reads le in 看了 and liǎo in 了解.
 *  - normalizeStrict (dictation, cloze): width and case only — hanzi as
 *    typed; no traditional fold, no pinyin.
 *  - search fold: traditional → simplified, pinyin without tones (marks
 *    and numbers dropped, ü → u as SQLite's remove_diacritics does).
 */

import {
  buildDictionary,
  CJK_PUNCTUATION,
  collapseSpaces,
  dropCjkSpaces,
  HAN,
  lexiconMaps,
  maximalMatch,
  nfkcLower,
  positionalNumber,
  replaceLongest,
  spellDigitRuns,
  spellDigitToken,
  tokenizeCjk,
  type CjkDictionary,
} from "./cjk";
import type { CourseLexicon, LanguageRules } from "./types";

const HAN_DIGITS = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

/** Cardinal 0–100 (零, 二, 十, 十一, 二十一, 一百). */
export function chineseNumber(value: number): string {
  return positionalNumber(value, HAN_DIGITS, "十", "一百", "零");
}

export function spellChineseDigits(token: string): string {
  return spellDigitToken(token, chineseNumber);
}

/** Measure words (simplified and traditional) after which the number two is 两. */
const MEASURE_WORDS = [
  "个", "個", "本", "只", "隻", "张", "張", "杯", "次", "天", "年", "位", "块", "塊", "件", "条", "條", "辆", "輛", "双", "雙",
  "瓶", "碗", "口", "岁", "歲", "点", "點", "斤", "公斤", "分钟", "分鐘", "小时", "小時", "种", "種", "家", "节", "節", "台", "臺",
  "支", "把", "份", "门", "門", "头", "頭", "封", "间", "間", "层", "層", "座", "遍", "周", "星期",
];
const TWO_BEFORE_MEASURE = new RegExp(`(^|[^0-9])2(?=(?:${MEASURE_WORDS.join("|")}))`, "g");

/** 2个 → 两个 (also after a non-digit: 买2本 → 买两本); 12个 and a bare 2 are left to the digit speller. */
export function chineseTwoBeforeMeasure(text: string): string {
  let prev: string;
  let out = text;
  do {
    prev = out;
    out = out.replace(TWO_BEFORE_MEASURE, "$1两");
  } while (out !== prev);
  return out;
}

// --- pinyin -----------------------------------------------------------------

const TONE_MARK: Readonly<Record<string, number>> = { "\u0304": 1, "\u0301": 2, "\u030C": 3, "\u0300": 4 };

type Syllable = { base: string; tone: number };

/** One stored syllable ("nǐ", "ni3", "lǜ", "lv4", "le", "le5") → letters (ü as v) and tone (0 = neutral). */
function parseSyllable(syllable: string): Syllable | null {
  let base = "";
  let tone = 0;
  for (const ch of syllable.normalize("NFD").toLowerCase().replace(/u:/g, "v")) {
    if (TONE_MARK[ch] !== undefined) tone = TONE_MARK[ch]!;
    else if (ch === "\u0308") base = base.endsWith("u") ? `${base.slice(0, -1)}v` : base;
    else if (/[1-5]/.test(ch)) tone = ch === "5" ? 0 : Number(ch);
    else if (/[a-z]/.test(ch)) base += ch;
    else return null;
  }
  return base.length > 0 ? { base, tone } : null;
}

/** A stored reading (syllables separated by spaces or apostrophes). */
export function parsePinyinReading(reading: string): Syllable[] | null {
  const parts = reading.trim().split(/[\s']+/).filter((p) => p.length > 0);
  const out: Syllable[] = [];
  for (const p of parts) {
    const s = parseSyllable(p);
    if (s === null) return null;
    out.push(s);
  }
  return out.length > 0 ? out : null;
}

type TypedPinyin = { letters: string; tones: { at: number; tone: number }[] };

/** A typed pinyin answer: its letters (ü/u:/v as v) and every tone it states, at the letter it follows. */
function parseTypedPinyin(answer: string): TypedPinyin | null {
  let letters = "";
  const tones: { at: number; tone: number }[] = [];
  for (const ch of answer.normalize("NFD").toLowerCase().replace(/u:/g, "v")) {
    if (TONE_MARK[ch] !== undefined) {
      if (letters.length === 0) return null;
      tones.push({ at: letters.length - 1, tone: TONE_MARK[ch]! });
    } else if (ch === "\u0308") {
      if (!letters.endsWith("u")) return null;
      letters = `${letters.slice(0, -1)}v`;
    } else if (/[1-5]/.test(ch)) {
      if (letters.length === 0) return null;
      tones.push({ at: letters.length - 1, tone: ch === "5" ? 0 : Number(ch) });
    } else if (/[a-z]/.test(ch)) letters += ch;
    else if (ch !== " " && ch !== "'" && ch !== "-") return null;
  }
  return letters.length > 0 ? { letters, tones } : null;
}

/** Whether a typed pinyin answer spells the key's stored syllables (tones optional, never wrong). */
export function pinyinMatches(typed: string, key: readonly Syllable[]): boolean {
  const parsed = parseTypedPinyin(typed);
  if (parsed === null || parsed.letters !== key.map((s) => s.base).join("")) return false;
  const ends: number[] = [];
  let acc = 0;
  for (const s of key) ends.push((acc += s.base.length));
  return parsed.tones.every(({ at, tone }) => {
    const i = ends.findIndex((end) => at < end);
    return i >= 0 && key[i]!.tone === tone;
  });
}

// --- forms ------------------------------------------------------------------

const stripPunctuation = (text: string) => text.replace(CJK_PUNCTUATION, "");

/** Strict form: width, case, punctuation; hanzi exactly as typed. */
export function normalizeStrictChinese(text: string): string {
  return dropCjkSpaces(collapseSpaces(stripPunctuation(nfkcLower(text))));
}

const ZH_READING_SPEED = {
  unit: "character",
  native: { min: 3.8, max: 4.7 },
  source:
    "IReST reading-aloud norms, Trauzettel-Klosinski & Dietz 2012 (Invest Ophthalmol Vis Sci 53:5452): Chinese 255 ± 29 characters/min — cited from the paper's summary table; re-check before any learner-facing claim",
  estimate: false,
} as const;

type Bound = {
  /** The course's words (both the spoken and the lenient forms fold hanzi the same way). */
  dict: CjkDictionary;
  /** variant spelling → course spelling (lenient form). */
  variants: Map<string, string>;
  variantMax: number;
  /** lenient(surface) → stored syllables. */
  readings: Map<string, Syllable[]>;
};

function bind(lexicon: CourseLexicon): Bound {
  const { words, readings, variants } = lexiconMaps(lexicon, "pinyin");
  const folded = new Map<string, string>();
  let variantMax = 0;
  for (const [variant, surface] of variants) {
    const key = nfkcLower(variant).replace(/ /g, "");
    folded.set(key, nfkcLower(surface).replace(/ /g, ""));
    variantMax = Math.max(variantMax, [...key].length);
  }
  const parsed = new Map<string, Syllable[]>();
  for (const [surface, reading] of readings) {
    const syllables = parsePinyinReading(reading);
    if (syllables !== null) parsed.set(nfkcLower(surface).replace(/ /g, ""), syllables);
  }
  return {
    dict: buildDictionary(words, nfkcLower),
    variants: folded,
    variantMax,
    readings: parsed,
  };
}

export function createChineseRules(lexicon?: CourseLexicon): LanguageRules {
  const bound = lexicon && lexicon.entries.length > 0 ? bind(lexicon) : null;
  const foldVariants = (text: string) => (bound ? replaceLongest(text, bound.variants, bound.variantMax) : text);
  const foldSpoken = (text: string) => dropCjkSpaces(collapseSpaces(stripPunctuation(foldVariants(nfkcLower(text)))));
  // Typed pinyin may spell ü as "u:" (CC-CEDICT style); keep it through the punctuation strip.
  const normalizeLenient = (text: string) => collapseSpaces(stripPunctuation(foldVariants(nfkcLower(text).replace(/u:/g, "ü"))));
  const fallback = tokenizeCjk("zh-CN", true);

  /** The key's stored syllables, or null when a hanzi of it has no stored reading. */
  const keySyllables = (key: string): Syllable[] | null => {
    if (!bound) return null;
    const out: Syllable[] = [];
    for (const token of maximalMatch(key, bound.dict, true)) {
      const syllables = bound.readings.get(token);
      if (syllables === undefined) return null;
      out.push(...syllables);
    }
    return out.length > 0 ? out : null;
  };

  return {
    code: "zh",
    ttsLocale: "zh-CN",
    recognitionLocale: "zh-CN",
    articleCue: () => undefined,
    splitArticle: (surface) => ({ bare: surface }),
    numberToWords: chineseNumber,
    spellDigits: spellChineseDigits,
    normalizeLenient,
    normalizeLenientAlternate: (text) => normalizeLenient(text).replace(/ /g, ""),
    alignAnswerToKey: (answer, key) => {
      if (HAN.test(answer) || !/[a-z]/.test(answer) || !HAN.test(key)) return answer;
      const syllables = keySyllables(key.replace(/ /g, ""));
      return syllables !== null && pinyinMatches(answer, syllables) ? key : answer;
    },
    readingInput: "pinyin",
    normalizeStrict: normalizeStrictChinese,
    foldSpoken,
    tokenize: (folded) => {
      // Digits are spelt before segmentation, so 12个 and 十二个 split alike.
      const text = spellDigitRuns(chineseTwoBeforeMeasure(folded), chineseNumber);
      return bound ? maximalMatch(text, bound.dict) : fallback(text);
    },
    fold: (text) =>
      collapseSpaces(
        foldVariants(nfkcLower(text))
          .replace(/u:/g, "u")
          .normalize("NFD")
          .replace(/[\u0300-\u036F]/g, "")
          .replace(/([a-z])[1-5]/g, "$1")
          .normalize("NFC")
      ),
    charsPerSecBand: ZH_READING_SPEED,
    withLexicon: (next) => createChineseRules(next),
  };
}

export const zh: LanguageRules = createChineseRules();

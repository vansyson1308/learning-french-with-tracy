/**
 * Japanese rules (P1b; P4b stage 3).
 *
 *  - tokenize: maximal match over the course's words and their kana
 *    readings when the course hands them in (withLexicon); otherwise
 *    Intl.Segmenter, else one token per character cluster. Native counters
 *    are read first: 1つ / 一つ → ひとつ, 1人 / 一人 → ひとり.
 *  - normalizeLenient (typed practice): NFKC width fold, katakana →
 *    hiragana, ヴ → ば行 (ヴァイオリン = バイオリン), a hyphen or tilde typed
 *    after kana → ー, ー → the vowel it lengthens (カード = かあど), small
 *    kana → full size. The particle は is never folded to わ: that is a
 *    spelling, not a formatting variance.
 *  - alignAnswerToKey: an answer typed in kana for a key written in kanji
 *    counts when the stored readings agree and the answer brings no kanji
 *    of its own (はし for 橋 yes; 箸 for 橋 no) — practice only.
 *  - alignWrittenToKey (P4c, free writing): a run of whole tokens written
 *    in kana alone whose reading is the key's (がくせい for 学生, たべます for
 *    食べます) stands for the key — practice only; a kanji the learner typed
 *    is never rewritten. knownReading: kana spelling a course word.
 *  - normalizeLenientInScript (D-10 owner decision): an item that asks for
 *    katakana (typeAnswer.script) folds width, case and punctuation but
 *    keeps the script — ぱん is not パン there.
 *  - normalizeStrict (dictation, cloze): width and case only; kana type,
 *    small kana, ー and kanji-vs-kana all count. Romaji never matches.
 *  - utteranceReading (P4c, spoken grading): a whole utterance read through
 *    the stored words AND the inflection keys (はたらいています for
 *    働いています), so a recogniser that writes a verb in kana matches the
 *    variant; concept slots keep the word-level spokenReading.
 *  - numbers: digits 0–100 → kanji numerals (3 → 三, 21 → 二十一) for
 *    spoken grading, spelt before segmentation so they split like
 *    authored numerals.
 */

import {
  buildDictionary,
  CJK_PUNCTUATION,
  collapseSpaces,
  dropCjkSpaces,
  EMPTY_DICTIONARY,
  HAN,
  lexiconMaps,
  maximalMatch,
  nfkcLower,
  positionalNumber,
  replaceReadingRuns,
  spellDigitRuns,
  spellDigitToken,
  tokenizeCjk,
  type CjkDictionary,
} from "./cjk";
import { furiganaFromKana, japaneseInflections } from "./ja-inflection";
import type { CourseLexicon, LanguageRules, NegationRules } from "./types";

const KANJI_DIGITS = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

/** Cardinal 0–100 in kanji numerals (零, 三, 十一, 二十一, 百). */
export function japaneseNumber(value: number): string {
  return positionalNumber(value, KANJI_DIGITS, "十", "百", "零");
}

export function spellJapaneseDigits(token: string): string {
  return spellDigitToken(token, japaneseNumber);
}

// --- kana -------------------------------------------------------------------

/** Katakana → hiragana (ヴ → ゔ, ヵ/ヶ → ゕ/ゖ, ヽ/ヾ → ゝ/ゞ); ヷ–ヺ have no hiragana and stay. */
export function katakanaToHiragana(text: string): string {
  return text.replace(/[ァ-ヶヽヾ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

const SMALL_KANA: Readonly<Record<string, string>> = {
  ぁ: "あ", ぃ: "い", ぅ: "う", ぇ: "え", ぉ: "お", っ: "つ", ゃ: "や", ゅ: "ゆ", ょ: "よ", ゎ: "わ", ゕ: "か", ゖ: "け",
};

const VOWEL_ROWS: readonly [string, string][] = [
  ["あ", "あかさたなはまやらわがざだばぱぁゃゎゕ"],
  ["い", "いきしちにひみりぎじぢびぴぃ"],
  ["う", "うくすつぬふむゆるぐずづぶぷぅっゅゔ"],
  ["え", "えけせてねへめれげぜでべぺぇゖ"],
  ["お", "おこそとのほもよろをごぞどぼぽぉょ"],
];
const VOWEL_OF = new Map<string, string>(VOWEL_ROWS.flatMap(([v, row]) => [...row].map((c) => [c, v] as const)));

const KANA = "ぁ-ゖゝゞァ-ヺー-ヾ";
/** A token of lenient (folded) text written in kana alone. */
const KANA_RUN = /^[ぁ-ゖゝゞー]+$/;
const HYPHEN_AFTER_KANA = new RegExp(`([${KANA}])[-~‐-―−〜]`, "g");

function foldVu(text: string): string {
  return text.replace(/ゔぁ/g, "ば").replace(/ゔぃ/g, "び").replace(/ゔぇ/g, "べ").replace(/ゔぉ/g, "ぼ").replace(/ゔ/g, "ぶ");
}

function repeatReplace(text: string, re: RegExp, by: string | ((...args: string[]) => string)): string {
  let prev: string;
  let out = text;
  do {
    prev = out;
    out = typeof by === "string" ? out.replace(re, by) : out.replace(re, by as (...args: string[]) => string);
  } while (out !== prev);
  return out;
}

/** ー spelt as the vowel it lengthens (かーど → かあど); ー after ん or a non-kana stays. */
function expandChoon(text: string): string {
  let out = "";
  for (const ch of text) {
    const vowel = ch === "ー" ? VOWEL_OF.get([...out].pop() ?? "") : undefined;
    out += vowel ?? ch;
  }
  return out;
}

function foldSmallKana(text: string): string {
  return text.replace(/[ぁぃぅぇぉっゃゅょゎゕゖ]/g, (ch) => SMALL_KANA[ch] ?? ch);
}

/** Kana-level lenient fold of any text (kanji untouched). */
export function foldJapaneseKana(text: string): string {
  let t = katakanaToHiragana(nfkcLower(text));
  t = foldVu(t);
  t = repeatReplace(t, HYPHEN_AFTER_KANA, "$1ー");
  t = expandChoon(t);
  return foldSmallKana(t);
}

// --- counters ---------------------------------------------------------------

const NATIVE_TSU = ["", "ひとつ", "ふたつ", "みっつ", "よっつ", "いつつ", "むっつ", "ななつ", "やっつ", "ここのつ"];
const NATIVE_PEOPLE = ["", "ひとり", "ふたり"];
const NUMERAL = "0-9〇零一二三四五六七八九十百千万";
const TSU = new RegExp(`(^|[^${NUMERAL}])([1-9一二三四五六七八九])つ`, "g");
const PEOPLE = new RegExp(`(^|[^${NUMERAL}])([12一二])人`, "g");

function digitValue(d: string): number {
  return /\d/.test(d) ? Number(d) : KANJI_DIGITS.indexOf(d);
}

/** Native-reading counters in their kana form: 1つ / 一つ → ひとつ, 2人 / 二人 → ふたり (not 12人, not 十二人). */
export function japaneseNativeCounters(text: string): string {
  const t = repeatReplace(text, TSU, (_m, pre, d) => pre + NATIVE_TSU[digitValue(d)]);
  return repeatReplace(t, PEOPLE, (_m, pre, d) => pre + NATIVE_PEOPLE[digitValue(d)]);
}

// --- forms ------------------------------------------------------------------

const stripPunctuation = (text: string) => text.replace(CJK_PUNCTUATION, "");

/** Spoken / validator fold: width, case, punctuation; no spaces between Japanese characters. */
export function foldSpokenJapanese(text: string): string {
  return dropCjkSpaces(collapseSpaces(stripPunctuation(nfkcLower(text))));
}

/** Lenient typed form (spaces kept collapsed so word tokens survive; the alternate form drops them). */
export function normalizeLenientJapanese(text: string): string {
  return collapseSpaces(stripPunctuation(foldJapaneseKana(text)).replace(/[-~〜]/g, ""));
}

/**
 * D-10 owner decision (2026-11-03): an item that asks for katakana (typeAnswer.script) keeps the script — width, case,
 * punctuation and a hyphen typed for ー are folded, but katakana is never folded to hiragana, small kana stay small and
 * ー stays ー (コオヒイ is not コーヒー). Spaces drop, as in the alternate lenient form.
 */
export function normalizeLenientKatakana(text: string): string {
  return stripPunctuation(repeatReplace(nfkcLower(text), HYPHEN_AFTER_KANA, "$1ー"))
    .replace(/[-~〜]/g, "")
    .replace(/\s+/g, "");
}

/** Strict form: width and case only. */
export function normalizeStrictJapanese(text: string): string {
  return foldSpokenJapanese(text);
}

/** Search fold: width, case, katakana → hiragana (カード finds かーど). */
export function foldSearchJapanese(text: string): string {
  return collapseSpaces(katakanaToHiragana(nfkcLower(text)));
}

const JA_READING_SPEED = {
  unit: "character",
  native: { min: 5.0, max: 6.9 },
  source:
    "IReST reading-aloud norms, Trauzettel-Klosinski & Dietz 2012 (Invest Ophthalmol Vis Sci 53:5452): Japanese 357 ± 56 characters/min — cited from the paper's summary table; re-check before any learner-facing claim",
  estimate: false,
} as const;

// --- the plugin ---------------------------------------------------------------

type Bound = {
  spoken: CjkDictionary;
  lenient: CjkDictionary;
  /** foldSpoken(surface) → hiragana reading. */
  spokenReadings: Map<string, string>;
  /** lenient(surface) → lenient(reading). */
  lenientReadings: Map<string, string>;
  /** P4c: whole-utterance readings — the stored words plus the inflection keys, longest match first. */
  utterance: CjkDictionary;
  /** foldSpoken(inflection key) → hiragana reading (食べま → たべま); stored words keep spokenReadings. */
  inflectedReadings: Map<string, string>;
};

function bind(lexicon: CourseLexicon): Bound {
  const { words, readings } = lexiconMaps(lexicon, "kana");
  const spokenReadings = new Map<string, string>();
  const lenientReadings = new Map<string, string>();
  for (const [surface, reading] of readings) {
    spokenReadings.set(foldSpokenJapanese(surface), katakanaToHiragana(foldSpokenJapanese(reading)));
    lenientReadings.set(normalizeLenientJapanese(surface).replace(/ /g, ""), normalizeLenientJapanese(reading).replace(/ /g, ""));
  }
  // P4c: the stems of inflected verbs and い-adjectives (食べま → たべま) join the lenient readings only, so kana typed
  // for 食べます aligns (practice); tokenizing and spoken grading keep the stored words.
  const inflected = japaneseInflections(
    lexicon.entries.flatMap((e) => {
      const kana = e.reading?.notation === "kana" ? e.reading.value : undefined;
      const furigana = kana ? furiganaFromKana(e.surface, kana) : null;
      return kana && furigana ? [{ surface: e.surface, kana, pos: e.pos, furigana }] : [];
    })
  );
  for (const form of inflected) {
    const key = normalizeLenientJapanese(form.surface).replace(/ /g, "");
    if (!lenientReadings.has(key)) lenientReadings.set(key, normalizeLenientJapanese(form.kana).replace(/ /g, ""));
  }
  // P4c session 5: the same keys read a whole spoken utterance, so a recogniser that writes 働いています in kana
  // (はたらいています) matches the variant. The tokenizer, and so concept slots, keep the stored words only.
  const inflectedReadings = new Map<string, string>();
  for (const form of inflected) {
    const key = foldSpokenJapanese(form.surface);
    if (!spokenReadings.has(key)) inflectedReadings.set(key, katakanaToHiragana(foldSpokenJapanese(form.kana)));
  }
  const kanaForms = [...readings.values()].flatMap((r) => [r, katakanaToHiragana(r)]);
  return {
    spoken: buildDictionary([...words, ...kanaForms], foldSpokenJapanese),
    lenient: buildDictionary([...words, ...inflected.map((f) => f.surface), ...kanaForms], normalizeLenientJapanese),
    spokenReadings,
    lenientReadings,
    utterance: buildDictionary([...words, ...inflected.map((f) => f.surface), ...kanaForms], foldSpokenJapanese),
    inflectedReadings,
  };
}

/**
 * QC 2026-11-05 §1.2: Japanese negates after the predicate — 行きません is not 行き(ます), 好きじゃない is not 好き,
 * 時間がない is not 時間. A keyword run followed, after at most one character (a particle が/は or a stem vowel), by
 * one of these endings is negated. Counted in characters: the dictionary tokenizer splits ません as ま + せん.
 */
const NEGATION: NegationRules = {
  unit: "text",
  after: {
    negators: ["ない", "なかった", "なくて", "ません", "ありません", "いません", "じゃない", "ではない", "じゃありません", "ではありません", "じゃなかった", "ではなかった"],
    gap: 1,
  },
};

export function createJapaneseRules(lexicon?: CourseLexicon): LanguageRules {
  const bound = lexicon && lexicon.entries.length > 0 ? bind(lexicon) : null;
  const fallback = tokenizeCjk("ja-JP", true);
  const tokenize = (folded: string): string[] => {
    const text = spellDigitRuns(japaneseNativeCounters(folded), japaneseNumber);
    return bound ? maximalMatch(text, bound.spoken) : fallback(text);
  };
  const lenientTokens = (lenient: string) => maximalMatch(lenient, bound?.lenient ?? EMPTY_DICTIONARY, true);
  const readingOf = (lenient: string) => lenientTokens(lenient).map((t) => bound?.lenientReadings.get(t) ?? t).join("");
  const knownReadings = new Set(bound ? bound.lenientReadings.values() : []);

  return {
    code: "ja",
    ttsLocale: "ja-JP",
    recognitionLocale: "ja-JP",
    negation: NEGATION,
    articleCue: () => undefined,
    splitArticle: (surface) => ({ bare: surface }),
    numberToWords: japaneseNumber,
    spellDigits: spellJapaneseDigits,
    normalizeLenient: normalizeLenientJapanese,
    normalizeLenientAlternate: (text) => normalizeLenientJapanese(text).replace(/ /g, ""),
    normalizeLenientInScript: (text) => normalizeLenientKatakana(text),
    alignAnswerToKey: (answer, key) => {
      if (!bound || bound.lenientReadings.size === 0) return answer;
      const a = answer.replace(/ /g, "");
      const k = key.replace(/ /g, "");
      if (a === k || readingOf(a) !== readingOf(k)) return answer;
      const keyTokens = new Set(lenientTokens(k));
      const bringsKanji = lenientTokens(a).some((t) => HAN.test(t) && !keyTokens.has(t));
      return bringsKanji ? answer : key;
    },
    alignWrittenToKey: (answer, key) => {
      if (!bound || bound.lenientReadings.size === 0 || !HAN.test(key)) return answer;
      const target = readingOf(key.replace(/ /g, ""));
      if (!KANA_RUN.test(target)) return answer; // a kanji of the key has no stored reading
      return replaceReadingRuns(answer, key, (t) => KANA_RUN.test(t), (run) => {
        const spelled = run.join("");
        return spelled === target ? "match" : target.startsWith(spelled) ? "shorter" : "past";
      });
    },
    knownReading: (token) => KANA_RUN.test(token) && knownReadings.has(token),
    readingInput: "kana",
    normalizeStrict: normalizeStrictJapanese,
    foldSpoken: foldSpokenJapanese,
    tokenize,
    fold: foldSearchJapanese,
    spokenReading: (normalized) =>
      normalized
        .split(" ")
        .filter((t) => t.length > 0)
        .map((t) => katakanaToHiragana(bound?.spokenReadings.get(t) ?? t))
        .join(" "),
    utteranceReading: (normalized) => {
      const joined = normalized.replace(/ /g, "");
      if (!bound) return katakanaToHiragana(joined);
      return maximalMatch(joined, bound.utterance)
        .map((t) => katakanaToHiragana(bound.spokenReadings.get(t) ?? bound.inflectedReadings.get(t) ?? t))
        .join("");
    },
    charsPerSecBand: JA_READING_SPEED,
    withLexicon: (next) => createJapaneseRules(next),
  };
}

export const ja: LanguageRules = createJapaneseRules();

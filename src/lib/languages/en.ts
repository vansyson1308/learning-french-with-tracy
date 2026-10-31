/**
 * English rules (P1b; P4 en-vi): Latin defaults, no gendered article cue, plus
 * the tolerances a Vietnamese learner of English needs and the course promises.
 *
 * Contractions count as their full forms in typed and spoken answers (I'm = I am),
 * and only where the two mean the same thing:
 *  - `'s` is "is"; it is "has" only before got or been. "He's a car" never matches
 *    "He has a car". He's gone (is or has?) needs an authored alternative;
 *  - `'d` is "would" only before like, love, prefer, rather; other uses stay as written;
 *  - a positive contraction cannot end a clause: "Yes, I'm." never matches "Yes, I am.";
 *  - an inverted n't stays together: "Do not you know?" never matches "Don't you know?";
 *  - no apostrophe is forgiven when that makes another word: its, were, well, ill.
 * Spoken grading spells standalone digits 0–100 and reads the recognizer's clock and
 * price formats (8:30, half past eight and eight thirty are one answer; so are $10 and
 * ten dollars). en-GB spellings count as their US form everywhere, since neither is wrong.
 * Strict comparison (dictation, conjugation) expands nothing: exact form is the construct.
 */
import { foldSpokenLatin, latinRules, normalizeLenientLatin, normalizeStrictLatin } from "./base";
import type { LanguageRules } from "./types";

const UNITS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const TEENS = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** Cardinal 0–100 in standard spelling ("twenty-one", "forty", "one hundred"). */
export function englishNumber(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 100) throw new RangeError(`englishNumber: ${value} is outside 0–100`);
  if (value === 100) return "one hundred";
  if (value < 10) return UNITS[value];
  if (value < 20) return TEENS[value - 10];
  const unit = value % 10;
  const tens = TENS[Math.floor(value / 10)];
  return unit === 0 ? tens : `${tens}-${UNITS[unit]}`;
}

/** Standalone digit tokens 0–100 become words, hyphen folded as authored text folds it ("21" → "twenty one"). */
export function spellEnglishDigits(token: string): string {
  if (!/^\d{1,3}$/.test(token)) return token;
  const value = Number(token);
  return value > 100 ? token : englishNumber(value).replace(/-/g, " ");
}

const HOUR_WORDS = [...UNITS.slice(1), ...TEENS.slice(0, 3)];
const HOUR = `\\d{1,2}|${HOUR_WORDS.join("|")}`;
const hourValue = (hour: string) => (/^\d/.test(hour) ? Number(hour) : HOUR_WORDS.indexOf(hour.toLowerCase()) + 1);
const TENS_ALTERNATION = TENS.slice(2).join("|");
const UNITS_ALTERNATION = UNITS.slice(1).join("|");
const CENTS_AMOUNT = `\\d{1,2}|(?:${TENS_ALTERNATION})(?:[\\s-](?:${UNITS_ALTERNATION}))?|${TEENS.join("|")}|${UNITS_ALTERNATION}`;

/** "half past eight", "a quarter to nine" as hour and minutes, in digits: one form with "8:30" and "eight thirty". */
const CLOCK_IDIOM = new RegExp(`\\b(?:(half)\\s+past|(?:a\\s+)?quarter\\s+(past|after|to))\\s+(${HOUR})\\b`, "gi");
function clockIdiom(match: string, half: string | undefined, direction: string | undefined, hour: string): string {
  const h = hourValue(hour);
  if (h < 1 || h > 12) return match;
  if (half !== undefined) return `${h} 30`;
  return direction?.toLowerCase() === "to" ? `${h === 1 ? 12 : h - 1} 45` : `${h} 15`;
}

function clockDigits(match: string, hour: string, minute: string): string {
  if (Number(hour) > 23 || Number(minute) > 59) return match;
  if (minute === "00") return `${hour} o'clock`;
  return minute.startsWith("0") ? `${hour} oh ${minute[1]}` : `${hour} ${minute}`;
}

function dollarsAndCents(_: string, dollars: string, cents: string): string {
  const whole = dollars.replace(/,/g, "");
  if (Number(whole) === 0 && cents !== "00") return `${Number(cents)} cents`;
  const amount = `${whole} ${Number(whole) === 1 ? "dollar" : "dollars"}`;
  return cents === "00" ? amount : `${amount} ${Number(cents)}`;
}

/** The recognizer's number formats in spoken word order. Digits stay digits: the speller converts them. */
function spokenNumberFormats(text: string): string {
  return text
    .replace(/\b([ap])\.\s?m\b\.?/gi, "$1m")
    .replace(/\b(\d{1,2})(am|pm)\b/gi, "$1 $2")
    .replace(/\b(\d{1,2}):00\s+(am|pm)\b/gi, "$1 $2")
    .replace(/\b(\d{1,2}):(\d{2})\b/g, clockDigits)
    .replace(CLOCK_IDIOM, clockIdiom)
    .replace(/\$\s?(\d[\d,]*)\.(\d{2})\b/g, dollarsAndCents)
    .replace(/\$\s?(\d[\d,]*)/g, (_, d: string) => dollarsAndCents("", d, "00"))
    .replace(/£\s?(\d+)/g, (_, n: string) => `${n} ${Number(n) === 1 ? "pound" : "pounds"}`)
    .replace(/€\s?(\d+)/g, (_, n: string) => `${n} ${Number(n) === 1 ? "euro" : "euros"}`)
    .replace(/(\d+)\s?¢/g, "$1 cents")
    .replace(/\ba\s+(hundred|dollar)\b/gi, "one $1")
    .replace(new RegExp(`\\b(dollars?)\\s+(?:and\\s+)?(${CENTS_AMOUNT})\\s+cents?\\b`, "gi"), "$1 $2");
}

/** A positive contraction expands only with a word after it: "Yes, I'm." is not English. */
const WORD_FOLLOWS = "(?=\\s+[A-Za-z0-9\\u00C0-\\u1EFF])";
/** An n't before its subject is an inverted question: "Do not you know?" is not English. */
const NO_SUBJECT = "(?!\\s+(?:i|you|he|she|it|we|they|there)\\b)";
const IS_HOSTS = "he|she|it|that|what|where|who|how|there|here";

const CONTRACTIONS: readonly (readonly [RegExp, string])[] = [
  [new RegExp(`\\b(do|does|did|is|are|was|were|have|has|had|could|would|should|must)n'?t\\b${NO_SUBJECT}`, "gi"), "$1 not"],
  [new RegExp(`\\bcan'?t\\b${NO_SUBJECT}`, "gi"), "can not"],
  [new RegExp(`\\bwon'?t\\b${NO_SUBJECT}`, "gi"), "will not"],
  [/\bcannot\b/gi, "can not"],
  [new RegExp(`\\bi'?m\\b${WORD_FOLLOWS}`, "gi"), "i am"],
  [new RegExp(`\\b(you|we|they)'re\\b${WORD_FOLLOWS}`, "gi"), "$1 are"],
  [new RegExp(`\\b(you|they)re\\b${WORD_FOLLOWS}`, "gi"), "$1 are"],
  [new RegExp(`\\b(i|you|we|they)'?ve\\b${WORD_FOLLOWS}`, "gi"), "$1 have"],
  [new RegExp(`\\b(i|you|he|she|it|we|they|that|there|who)'ll\\b${WORD_FOLLOWS}`, "gi"), "$1 will"],
  [new RegExp(`\\b(${IS_HOSTS})'s\\s+(been|got)\\b`, "gi"), "$1 has $2"],
  [new RegExp(`\\b(${IS_HOSTS})'s\\b${WORD_FOLLOWS}`, "gi"), "$1 is"],
  // Without the apostrophe only where no other word results: not its, whos.
  [new RegExp(`\\b(he|she|that|what|where|how|there|here)s\\b${WORD_FOLLOWS}`, "gi"), "$1 is"],
  [/\b(i|you|he|she|it|we|they)'d\s+(like|love|prefer|rather)\b/gi, "$1 would $2"],
  [/\bid\s+(like|love|prefer|rather)\b/gi, "i would $1"],
];

function expandContractions(text: string): string {
  return CONTRACTIONS.reduce((s, [re, rep]) => s.replace(re, rep), text.replace(/[‘’ʼ]/g, "'"));
}

/** Word families in one line: stem + each ending, British on the left of the pair. */
function family(gb: string, us: string, endings: readonly string[]): [string, string][] {
  return endings.map((e) => [`${gb}${e}`, `${us}${e}`]);
}
const NOUN = ["", "s"];
const OUR = ["", "s", "ed", "ing"];
const ISE: readonly [string, string][] = ["organ", "real", "recogn", "apolog", "memor", "summar", "emphas", "special", "general"].flatMap((stem) =>
  family(`${stem}is`, `${stem}iz`, ["e", "es", "ed", "ing"])
);

/** en-GB spelling → the US spelling the course authors. Closed on purpose: every entry is the same word. */
const SPELLINGS: ReadonlyMap<string, string> = new Map<string, string>([
  ...family("colour", "color", [...OUR, "ful"]),
  ...family("favour", "favor", [...OUR, "ite", "ites"]),
  ...family("neighbour", "neighbor", [...NOUN, "hood", "hoods"]),
  ...family("flavour", "flavor", OUR),
  ...family("honour", "honor", OUR),
  ...family("labour", "labor", OUR),
  ...family("harbour", "harbor", NOUN),
  ...family("humour", "humor", NOUN),
  ...family("rumour", "rumor", NOUN),
  ...family("behaviour", "behavior", NOUN),
  ...family("centre", "center", NOUN),
  ...family("metre", "meter", NOUN),
  ...family("kilometre", "kilometer", NOUN),
  ...family("centimetre", "centimeter", NOUN),
  ...family("litre", "liter", NOUN),
  ...family("theatre", "theater", NOUN),
  ...family("programme", "program", NOUN),
  ...family("cheque", "check", NOUN),
  ...family("tyre", "tire", NOUN),
  ...family("aeroplane", "airplane", NOUN),
  ...family("catalogue", "catalog", NOUN),
  ...family("dialogue", "dialog", NOUN),
  ...family("licence", "license", NOUN),
  ...family("defence", "defense", NOUN),
  ...family("offence", "offense", NOUN),
  ...family("grey", "gray", NOUN),
  ...family("practis", "practic", ["e", "es", "ed", "ing"]),
  ...family("travell", "travel", ["ed", "ing", "er", "ers"]),
  ...family("cancell", "cancel", ["ed", "ing"]),
  ...family("labell", "label", ["ed", "ing"]),
  ["jewellery", "jewelry"],
  ["pyjamas", "pajamas"],
  ["organisation", "organization"],
  ["organisations", "organizations"],
  ["okay", "ok"],
  ...ISE,
]);

/** On lower-cased text: whole words only ("colourless" stays). */
function usSpelling(text: string): string {
  return text.replace(/[a-z]+/g, (word, at: number) => {
    const next = text[at + word.length];
    const prev = text[at - 1];
    if ((next !== undefined && /[\u0080-ỿ]/.test(next)) || (prev !== undefined && /[\u0080-ỿ]/.test(prev))) return word;
    return SPELLINGS.get(word) ?? word;
  });
}

/** Marks folded before the contractions: a typed Vietnamese answer must keep comparing as the base compares it. */
function foldMarks(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}

const HYPHENATED_NUMBER = new RegExp(`\\b(${TENS_ALTERNATION})-(${UNITS_ALTERNATION})\\b`, "g");

function normalizeLenientEnglish(text: string): string {
  return usSpelling(normalizeLenientLatin(expandContractions(foldMarks(text)).replace(HYPHENATED_NUMBER, "$1 $2")));
}

function foldSpokenEnglish(text: string): string {
  return usSpelling(foldSpokenLatin(expandContractions(spokenNumberFormats(text))));
}

export const en: LanguageRules = latinRules(
  { code: "en", ttsLocale: "en-US", recognitionLocale: "en-US" },
  {
    numberToWords: englishNumber,
    spellDigits: spellEnglishDigits,
    normalizeLenient: normalizeLenientEnglish,
    normalizeStrict: (text) => usSpelling(normalizeStrictLatin(text)),
    foldSpoken: foldSpokenEnglish,
    // The Vietnamese wording of the note lives in the i18n catalog; these are the target's own names, as for every language.
    grammarLabels: {
      persons: { "pre:1s": "I", "pre:2s": "you", "pre:3s": "he/she/it", "pre:1p": "we", "pre:2p": "you", "pre:3p": "they" },
      presentTense: "present simple",
      articleGenders: {},
    },
  }
);

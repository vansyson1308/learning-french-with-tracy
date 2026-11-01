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
 *  - an inverted n't stays together: "Do not you know?" never matches "Don't you know?", while "She wasn't there." is "She was not there.";
 *  - no apostrophe is forgiven when that makes another word: its, were, well, ill.
 * Spoken grading spells standalone digits 0–100 and reads the recognizer's clock and
 * price formats (8:30, half past eight and eight thirty are one answer; so are $10 and
 * ten dollars). en-GB spellings count as their US form everywhere, since neither is wrong
 * (colour, centre, organise, learnt). en-GB words are another matter: flat and lift are ordinary
 * words with other meanings, so they count only against a key that has the US word (alignAnswerToKey).
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
const SUBJECT_FOLLOWS = /^\s+(?:i|you|he|she|it|we|they|there)\b/i;
/** Where an inverted verb stands: the start of a clause, or right after a question word. */
const INVERTS_HERE = /(?:^\s*|[.,;:!?"—–]\s*|\b(?:why|where|when|what|who|whom|whose|which|how|and|but|or|so)\s+)$/i;

/**
 * An inverted n't stays together: "Do not you know?" is not English. Inverted means a subject after it
 * AND nothing of a subject before it: "She wasn't there." and "That isn't it." expand.
 */
function expandNegatives(text: string): string {
  const expand = (match: string, offset: number, whole: string, full: string) =>
    SUBJECT_FOLLOWS.test(whole.slice(offset + match.length)) && INVERTS_HERE.test(whole.slice(0, offset)) ? match : full;
  return text
    .replace(/\b(do|does|did|is|are|was|were|have|has|had|could|would|should|must)n'?t\b/gi, (m, aux: string, at: number, s: string) => expand(m, at, s, `${aux} not`))
    .replace(/\bcan'?t\b/gi, (m, at: number, s: string) => expand(m, at, s, "can not"))
    .replace(/\bwon'?t\b/gi, (m, at: number, s: string) => expand(m, at, s, "will not"));
}

const IS_HOSTS = "he|she|it|that|what|where|who|how|there|here";

const CONTRACTIONS: readonly (readonly [RegExp, string])[] = [
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
  return CONTRACTIONS.reduce((s, [re, rep]) => s.replace(re, rep), expandNegatives(text.replace(/[‘’ʼ]/g, "'")));
}

/** Word families in one line: stem + each ending, British on the left of the pair. */
function family(gb: string, us: string, endings: readonly string[]): [string, string][] {
  return endings.map((e) => [`${gb}${e}`, `${us}${e}`]);
}
const NOUN = ["", "s"];
const OUR = ["", "s", "ed", "ing"];
const ISE: readonly [string, string][] = [
  "organ", "real", "recogn", "apolog", "memor", "summar", "emphas", "special", "general", "critic", "final", "modern", "priorit", "personal",
  "categor", "custom", "minim", "maxim", "util", "author", "standard", "visual", "social", "familiar", "hospital", "capital", "civil", "legal",
  "mobil", "stabil", "symbol", "sympath", "character",
].flatMap((stem) =>
  family(`${stem}is`, `${stem}iz`, ["e", "es", "ed", "ing"])
);

/** en-GB spelling → the US spelling the course authors. Closed on purpose: every entry is the same word. */
const SPELLINGS: ReadonlyMap<string, string> = new Map<string, string>([
  ...family("colour", "color", [...OUR, "ful"]),
  ...family("favour", "favor", [...OUR, "ite", "ites"]),
  ...family("neighbour", "neighbor", [...NOUN, "hood", "hoods"]),
  ...family("flavour", "flavor", OUR),
  ...family("armour", "armor", NOUN),
  ...family("odour", "odor", NOUN),
  ...family("vapour", "vapor", NOUN),
  ...family("parlour", "parlor", NOUN),
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
  ...family("millimetre", "millimeter", NOUN),
  ...family("millilitre", "milliliter", NOUN),
  ...family("fibre", "fiber", NOUN),
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
  ...family("modell", "model", ["ed", "ing"]),
  ...family("fuell", "fuel", ["ed", "ing"]),
  ...family("signall", "signal", ["ed", "ing"]),
  ...family("levell", "level", ["ed", "ing"]),
  ...family("analys", "analyz", ["e", "es", "ed", "ing"]),
  ...family("paralys", "paralyz", ["e", "es", "ed", "ing"]),
  ...family("mould", "mold", OUR),
  ...family("plough", "plow", OUR),
  ...family("doughnut", "donut", NOUN),
  ...family("moustache", "mustache", NOUN),
  ...family("disc", "disk", NOUN),
  ...family("mum", "mom", NOUN),
  ...family("judgement", "judgment", NOUN),
  ["mummy", "mommy"],
  ["maths", "math"],
  ["cosy", "cozy"],
  ["sceptical", "skeptical"],
  ["woollen", "woolen"],
  ["marvellous", "marvelous"],
  ["skilful", "skillful"],
  ["fulfil", "fulfill"],
  ["enrol", "enroll"],
  ["towards", "toward"],
  ["learnt", "learned"],
  ["burnt", "burned"],
  ["spelt", "spelled"],
  ["dreamt", "dreamed"],
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

/**
 * en-GB words and phrases for a US word, on lenient text: same thing, different word. Only ever
 * rewritten when the key has the US word, and in that direction: "Lift the box" keeps its verb,
 * "The road is flat" never takes "apartment". A US word goes here only if every sense of it a
 * learner could be keyed on is a sense of the British word: `line` stays out (queue is not a drawn line),
 * as does `check` (bill), and the two meanings of "first floor" are different floors.
 */
const WORD_PAIRS: readonly (readonly [gb: string, us: string])[] = [
  ["flat", "apartment"],
  ["flats", "apartments"],
  ["block of flats", "apartment building"],
  ["lift", "elevator"],
  ["lifts", "elevators"],
  ["lorry", "truck"],
  ["lorries", "trucks"],
  ["petrol", "gas"],
  ["petrol station", "gas station"],
  ["mobile phone", "cell phone"],
  ["mobile", "cell phone"],
  ["mobile phones", "cell phones"],
  ["rubbish", "trash"],
  ["rubbish", "garbage"],
  ["bin", "trash can"],
  ["underground", "subway"],
  ["motorway", "highway"],
  ["pavement", "sidewalk"],
  ["biscuit", "cookie"],
  ["biscuits", "cookies"],
  ["sweets", "candy"],
  ["trousers", "pants"],
  ["jumper", "sweater"],
  ["trainers", "sneakers"],
  ["wardrobe", "closet"],
  ["holiday", "vacation"],
  ["holidays", "vacation"],
  ["film", "movie"],
  ["films", "movies"],
  ["shop", "store"],
  ["shops", "stores"],
  ["post", "mail"],
  ["postbox", "mailbox"],
  ["postcode", "zip code"],
  ["car park", "parking lot"],
  ["chips", "fries"],
  ["chips", "french fries"],
  ["crisps", "chips"],
  ["football", "soccer"],
  ["tap", "faucet"],
  ["cooker", "stove"],
  ["nappy", "diaper"],
  ["torch", "flashlight"],
  ["rubber", "eraser"],
  ["timetable", "schedule"],
  ["railway", "railroad"],
  ["return ticket", "round trip ticket"],
  ["chemist", "pharmacy"],
  ["toilet", "restroom"],
  ["at the weekend", "on the weekend"],
  // `fall` is first of all a verb: only as a season, where the key says so.
  ["autumn", "fall"],
];
const SEASON_FALL = /\b(?:in|the|this|last|next|every)\s+fall\b/;
/** Longest first: "petrol station" before "petrol". */
const WORD_PAIRS_LONGEST = [...WORD_PAIRS].sort((a, b) => b[0].length - a[0].length || b[1].length - a[1].length);
const startsWithVowelSound = (word: string) => /^[aeiou]/.test(word);

function hasWord(text: string, word: string): boolean {
  return new RegExp(`(?:^| )${word}(?= |$)`).test(text);
}

const articleOf = (word: string) => (startsWithVowelSound(word) ? "an" : "a");

const pairApplies = (text: string, key: string, gb: string, us: string) =>
  hasWord(key, us) && hasWord(text, gb) && (us !== "fall" || SEASON_FALL.test(key));

/** The article follows the word: "a flat" is "an apartment", and "an flat" stays wrong. */
const wrongArticle = (text: string, gb: string) => hasWord(text, `${articleOf(gb) === "a" ? "an" : "a"} ${gb}`);

function rewriteEverywhere(text: string, gb: string, us: string): string {
  return text
    .replace(new RegExp(`(^| )${articleOf(gb)} ${gb}(?= |$)`, "g"), `$1${articleOf(us)} ${us}`)
    .replace(new RegExp(`(^| )${gb}(?= |$)`, "g"), `$1${us}`);
}

function alignAnswerToKey(answer: string, key: string): string {
  return WORD_PAIRS_LONGEST.reduce(
    (text, [gb, us]) => (!pairApplies(text, key, gb, us) || wrongArticle(text, gb) ? text : rewriteEverywhere(text, gb, us)),
    answer
  );
}

const DETERMINERS: ReadonlySet<string> = new Set(["a", "an", "the", "my", "your", "his", "her", "our", "their", "this", "that", "these", "those", "one"]);
/**
 * Closed, in the lenient form, because nothing here parses: an open slot would take a noun as subject too
 * ("The children film it"). An unlisted adjective costs one British word its match; the US word always counts.
 */
const NOUN_ADJECTIVES: ReadonlySet<string> = new Set(
  ("new old big small little large great good nice bad lovely beautiful pretty cheap expensive clean dirty quiet noisy busy empty full " +
    "long short tall high low hot cold warm cool dark light modern old-fashioned first second third last next same own other favorite " +
    "funny boring interesting sad happy scary red blue green black white yellow brown gray pink orange local nearby popular famous free comfortable").split(" ")
);

function inNounContext(tokens: readonly string[], at: number): boolean {
  const before = tokens[at - 1];
  return DETERMINERS.has(before) || (NOUN_ADJECTIVES.has(before) && DETERMINERS.has(tokens[at - 2]));
}

function rewriteNouns(text: string, gb: string, us: string): string {
  const tokens = text.split(" ");
  return tokens
    .map((token, at) => {
      if (token === gb) return inNounContext(tokens, at) ? us : token;
      return tokens[at + 1] === gb && token === articleOf(gb) ? articleOf(us) : token;
    })
    .join(" ");
}

/**
 * Free text has the same pairs and less certainty: the answer's words are the learner's own, so "The land is flat"
 * must not meet an apartment slot. A single British word therefore counts only as a noun. A key of several words
 * ("i like soccer") pins the meaning itself, since the whole run has to match, and so does a British phrase.
 */
function alignWrittenToKey(answer: string, key: string): string {
  return WORD_PAIRS_LONGEST.reduce((text, [gb, us]) => {
    if (!pairApplies(text, key, gb, us) || wrongArticle(text, gb)) return text;
    return gb.includes(" ") || key.includes(" ") ? rewriteEverywhere(text, gb, us) : rewriteNouns(text, gb, us);
  }, answer);
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
    alignAnswerToKey,
    alignWrittenToKey,
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

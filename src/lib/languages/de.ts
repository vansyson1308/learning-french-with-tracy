/**
 * German rules (P1b; D-10 review): Latin defaults + der/die/das article cue,
 * plus the German grading tolerances the course promises (VARIETY.md):
 *  - typed answers fold ß → ss, so a Swiss spelling ("heisst", "gross") is
 *    never punished;
 *  - a second lenient form spells ä/ö/ü as ae/oe/ue, so "schoen" and
 *    "Mueller" match "schön" and "Müller" (the Latin a/o/u fold stays);
 *  - spoken and written grading spell standalone digits 0–100 as German
 *    words and read the recognizer's clock and price formats ("8:15 Uhr",
 *    "3,50 €"), as the French plugin does for its numbers.
 * Strict comparison (dictation, conjugation cloze) keeps every umlaut and ß:
 * orthography is the construct there.
 */
import { articleTable, foldSpokenLatin, latinRules, normalizeLenientLatin } from "./base";
import type { LanguageRules } from "./types";

const UNITS = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"];
const TEENS = ["zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
const TENS = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];

/** Cardinal 0–100 in standard spelling ("einundzwanzig", "dreißig", "hundert"). */
export function germanNumber(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 100) throw new RangeError(`germanNumber: ${value} is outside 0–100`);
  if (value === 100) return "hundert";
  if (value < 10) return UNITS[value];
  if (value < 20) return TEENS[value - 10];
  const unit = value % 10;
  const tens = TENS[Math.floor(value / 10)];
  if (unit === 0) return tens;
  return `${unit === 1 ? "ein" : UNITS[unit]}und${tens}`;
}

/** Standalone digit tokens 0–100 become German words ("8" → "acht"); every other token is unchanged. */
export function spellGermanDigits(token: string): string {
  if (!/^\d{1,3}$/.test(token)) return token;
  const value = Number(token);
  return value > 100 ? token : germanNumber(value);
}

/**
 * The recognizer's number formats, rewritten in spoken word order before
 * folding ("8:15 Uhr" → "8 Uhr 15", "15:00 Uhr" → "15 Uhr", "3,50 €" →
 * "3 Euro 50", "10 €" → "10 Euro"). Digits stay digits here: the speller
 * converts them, so foldSpoken still never spells numbers.
 */
function spokenNumberFormats(text: string): string {
  return text
    .replace(/\b(\d{1,2})[:.](\d{2})\s*Uhr\b/gi, (_, h: string, m: string) => (m === "00" ? `${h} Uhr` : `${h} Uhr ${Number(m)}`))
    .replace(/\b(\d{1,3}),(\d{2})\s*(?:€|Euro\b)/gi, (_, e: string, c: string) => (c === "00" ? `${e} Euro` : `${e} Euro ${Number(c)}`))
    .replace(/\b(\d{1,3})\s*€/g, "$1 Euro");
}

/** Lenient typed form: the Latin fold, then ß → ss (lower-cased ẞ included). */
function normalizeLenientGerman(text: string): string {
  return normalizeLenientLatin(text).replace(/ß/g, "ss");
}

/** The alternate lenient form: ä/ö/ü spelt ae/oe/ue before the marks are stripped. */
function normalizeLenientGermanTransliterated(text: string): string {
  return normalizeLenientGerman(
    text.normalize("NFC").toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
  );
}

export const de: LanguageRules = latinRules(
  { code: "de", ttsLocale: "de-DE", recognitionLocale: "de-DE" },
  {
    ...articleTable(["der", "die", "das"]),
    numberToWords: germanNumber,
    spellDigits: spellGermanDigits,
    normalizeLenient: normalizeLenientGerman,
    normalizeLenientAlternate: normalizeLenientGermanTransliterated,
    foldSpoken: (text) => foldSpokenLatin(spokenNumberFormats(text)),
  }
);

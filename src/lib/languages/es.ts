/**
 * Spanish rules (P1b; D-10 review pass 2): Latin defaults + el/la/los/las
 * article cue, plus the number speller the course promises (unit-m
 * guidebook: "8" and "ocho" count the same):
 *  - spoken and written grading spell standalone digits 0–100 as Spanish
 *    words ("16" → "dieciséis");
 *  - the recognizer's euro formats read as spoken ("16 €" → "16 euros",
 *    "1 €" → "un euro", "21 €" → "veintiún euros", "3,50 €" → "3 euros con
 *    50");
 *  - clock times read as spoken: ":00" drops ("10:00" → "10"); 12-hour times
 *    use "y cuarto", "y media", "menos cuarto", "y <minutos>"; 24-hour times
 *    (13–23 h) are read as two numbers ("18:30" → "18 30"); "la 1" is
 *    "la una".
 * Dictation and conjugation stay on the strict form, which spells nothing.
 */
import { articleTable, foldSpokenLatin, latinRules } from "./base";
import type { LanguageRules } from "./types";

const UNITS = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
const TEENS = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
const TWENTIES = [
  "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro",
  "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve",
];
const TENS = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];

/** Cardinal 0–100 in standard spelling ("veintidós", "treinta y uno", "cien"). */
export function spanishNumber(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 100) throw new RangeError(`spanishNumber: ${value} is outside 0–100`);
  if (value === 100) return "cien";
  if (value < 10) return UNITS[value];
  if (value < 20) return TEENS[value - 10];
  if (value < 30) return TWENTIES[value - 20];
  const unit = value % 10;
  const tens = TENS[Math.floor(value / 10)];
  return unit === 0 ? tens : `${tens} y ${UNITS[unit]}`;
}

/** Standalone digit tokens 0–100 become Spanish words ("8" → "ocho"); every other token is unchanged. */
export function spellSpanishDigits(token: string): string {
  if (!/^\d{1,3}$/.test(token)) return token;
  const value = Number(token);
  return value > 100 ? token : spanishNumber(value);
}

/** "1 euro", "21 euros", "31 euros": the apocopated forms before a noun (un, veintiún, treinta y un). */
function euroAmount(digits: string): string {
  const value = Number(digits);
  if (value === 1) return "un euro";
  if (value <= 100 && value % 10 === 1 && value !== 11) {
    return `${spanishNumber(value).replace(/uno$/, "ún").replace(/ y ún$/, " y un")} euros`;
  }
  return `${digits} euros`;
}

/** One clock time in spoken order (digits stay digits; the speller converts them). */
function clockTime(hour: string, minute: string): string {
  const h = Number(hour);
  const m = Number(minute);
  if (m === 0) return `${h}`;
  if (h > 12) return `${h} ${m}`;
  if (m === 15) return `${h} y cuarto`;
  if (m === 30) return `${h} y media`;
  if (m === 45) {
    const next = h + 1 > 12 ? 1 : h + 1;
    return `${next} menos cuarto`;
  }
  return `${h} y ${m}`;
}

/**
 * The recognizer's number formats, rewritten in spoken word order before
 * folding. Digits mostly stay digits here: the speller converts them, so
 * foldSpoken still never spells plain numbers.
 */
function spokenNumberFormats(text: string): string {
  return text
    .replace(/\b(\d{1,2}):(\d{2})(?:\s*h\b)?/g, (_, h: string, m: string) => clockTime(h, m))
    .replace(/\b(las?)\s+1\b(?![\d,])/gi, (_, art: string) => `${art.toLowerCase().startsWith("las") ? "la" : art} una`)
    .replace(/\b(\d{1,3}),(\d{2})\s*(?:€|euros?\b)/gi, (_, e: string, c: string) =>
      c === "00" ? euroAmount(e) : `${euroAmount(e)} con ${Number(c)}`
    )
    .replace(/\b(\d{1,3})\s*(?:€|euros?\b)/gi, (_, e: string) => euroAmount(e));
}

export const es: LanguageRules = latinRules(
  { code: "es", ttsLocale: "es-ES", recognitionLocale: "es-ES" },
  {
    ...articleTable(["el", "la", "los", "las"]),
    numberToWords: spanishNumber,
    spellDigits: spellSpanishDigits,
    foldSpoken: (text) => foldSpokenLatin(spokenNumberFormats(text)),
    // P3e: Peninsular person labels (vosotros taught for recognition; ustedes accepted).
    grammarLabels: {
      persons: { "pre:1s": "yo", "pre:2s": "tú", "pre:3s": "él/ella/usted", "pre:1p": "nosotros", "pre:2p": "vosotros", "pre:3p": "ellos/ellas/ustedes" },
      presentTense: "presente",
      articleGenders: { el: "masculine", la: "feminine", un: "masculine", una: "feminine", los: "masculine", las: "feminine" },
    },
  }
);

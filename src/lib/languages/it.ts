/**
 * Italian rules (P1b; P3d it): Latin defaults + il/lo/la/l'/i/gli/le article
 * cue, plus the number speller the course promises ("8" and "otto" count the same):
 *  - spoken and written grading spell standalone digits 0–100 as Italian words;
 *  - the recognizer's euro formats read as spoken ("16 €" → "16 euro", "1 €" →
 *    "un euro", "3,50 €" → "3 euro e 50"; euro is invariable);
 *  - clock times read as spoken: ":00" drops, ":15" is "e un quarto", ":30" is
 *    "e mezza", ":45" is "meno un quarto" of the next hour up to 12; other times
 *    are "<ore> e <minuti>"; "all'1" is "all'una".
 * Dictation and conjugation stay on the strict form, which spells nothing.
 */
import { articleTable, foldSpokenLatin, latinRules } from "./base";
import type { LanguageRules } from "./types";

const UNITS = ["zero", "uno", "due", "tre", "quattro", "cinque", "sei", "sette", "otto", "nove"];
const TEENS = ["dieci", "undici", "dodici", "tredici", "quattordici", "quindici", "sedici", "diciassette", "diciotto", "diciannove"];
const TENS = ["", "", "venti", "trenta", "quaranta", "cinquanta", "sessanta", "settanta", "ottanta", "novanta"];

/** Cardinal 0–100 in standard spelling ("ventuno", "trentotto", "ventitré", "cento"). */
export function italianNumber(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 100) throw new RangeError(`italianNumber: ${value} is outside 0–100`);
  if (value === 100) return "cento";
  if (value < 10) return UNITS[value];
  if (value < 20) return TEENS[value - 10];
  const unit = value % 10;
  const tens = TENS[Math.floor(value / 10)];
  if (unit === 0) return tens;
  if (unit === 3) return `${tens}tré`;
  // venti + uno → ventuno, trenta + otto → trentotto: the tens lose their final vowel.
  return unit === 1 || unit === 8 ? `${tens.slice(0, -1)}${UNITS[unit]}` : `${tens}${UNITS[unit]}`;
}

/** Standalone digit tokens 0–100 become Italian words ("8" → "otto"); every other token is unchanged. */
export function spellItalianDigits(token: string): string {
  if (!/^\d{1,3}$/.test(token)) return token;
  const value = Number(token);
  return value > 100 ? token : italianNumber(value);
}

/** One clock time in spoken order (digits stay digits; the speller converts them). */
function clockTime(hour: string, minute: string): string {
  const h = Number(hour);
  const m = Number(minute);
  if (m === 0) return `${h}`;
  if (h <= 12 && m === 15) return `${h} e un quarto`;
  if (h <= 12 && m === 30) return `${h} e mezza`;
  if (h <= 12 && m === 45) return `${h + 1 > 12 ? 1 : h + 1} meno un quarto`;
  return `${h} e ${m}`;
}

/** The recognizer's number formats, rewritten in spoken word order before folding. */
function spokenNumberFormats(text: string): string {
  return text
    .replace(/\b(\d{1,2}):(\d{2})(?:\s*h\b)?/g, (_, h: string, m: string) => clockTime(h, m))
    .replace(/\b(all|l)['’]1\b(?![\d,])/gi, (_, art: string) => `${art}'una`)
    .replace(/\b(\d{1,3}),(\d{2})\s*(?:€|euro\b)/gi, (_, e: string, c: string) => {
      const euro = Number(e) === 1 ? "un euro" : `${e} euro`;
      return c === "00" ? euro : `${euro} e ${Number(c)}`;
    })
    .replace(/\b(\d{1,3})\s*(?:€|euro\b)/gi, (_, e: string) => (Number(e) === 1 ? "un euro" : `${e} euro`));
}

export const it: LanguageRules = latinRules(
  { code: "it", ttsLocale: "it-IT", recognitionLocale: "it-IT" },
  {
    ...articleTable(["il", "lo", "la", "l'", "i", "gli", "le"]),
    numberToWords: italianNumber,
    spellDigits: spellItalianDigits,
    foldSpoken: (text) => foldSpokenLatin(spokenNumberFormats(text)),
    grammarLabels: {
      persons: { "pre:1s": "io", "pre:2s": "tu", "pre:3s": "lui/lei/Lei", "pre:1p": "noi", "pre:2p": "voi", "pre:3p": "loro" },
      presentTense: "presente",
      articleGenders: { il: "masculine", lo: "masculine", la: "feminine", un: "masculine", uno: "masculine", una: "feminine", i: "masculine", gli: "masculine", le: "feminine" },
    },
  }
);

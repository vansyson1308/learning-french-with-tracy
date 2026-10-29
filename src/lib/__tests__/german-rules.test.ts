/**
 * D-10 review (de-vi): the German plugin's grading tolerances.
 *  - Typed answers fold ß → ss (VARIETY.md: Swiss "ss" spellings are never
 *    punished) and also accept ae/oe/ue for ä/ö/ü ("schoen", "Mueller"),
 *    while the Latin a/o/u fold the course shipped with stays.
 *  - Dictation and conjugation stay strict: every umlaut and ß counts.
 *  - Spoken and written grading spell digits 0–100 as German words and read
 *    the recognizer's clock ("8:15 Uhr") and price ("3,50 €") formats.
 *  - French behaviour is untouched (no alternate fold, its own speller).
 */
import { describe, expect, test } from "bun:test";

import { checkAnswer } from "../grading";
import { languageRules } from "../languages";
import { germanNumber, spellGermanDigits } from "../languages/de";
import { gradeSpokenAttempt, normalizeSpoken } from "../speech/grader";
import type { ConjugationClozeExercise, DictationExercise, TypeAnswerExercise, WordBankExercise } from "../types";
import { normalizeWritten } from "../writing/rubric";

const de = languageRules("de");
const fr = languageRules("fr");

const typed = (answer: string, alternatives: string[] = []): TypeAnswerExercise => ({
  type: "typeAnswer",
  id: "de-vi:test-e0",
  mode: "produceTarget",
  prompt: "",
  answer,
  alternatives,
});

describe("German typed answers (lenient)", () => {
  test("ß and ss are the same letter pair", () => {
    expect(de.normalizeLenient("Ich heiße Lena.")).toBe(de.normalizeLenient("Ich heisse Lena"));
    expect(de.normalizeLenient("STRAẞE")).toBe("strasse");
    expect(checkAnswer(typed("Wie heißen Sie?"), "Wie heissen Sie", "de-vi")).toBe(true);
    expect(checkAnswer(typed("dreißig"), "dreissig", "de-vi")).toBe(true);
    expect(checkAnswer(typed("Der Hund ist groß."), "der hund ist gross", "de-vi")).toBe(true);
  });

  test("ae/oe/ue are accepted spellings of ä/ö/ü", () => {
    expect(checkAnswer(typed("schön"), "schoen", "de-vi")).toBe(true);
    expect(checkAnswer(typed("Mein Chef heißt Müller."), "Mein Chef heisst Mueller.", "de-vi")).toBe(true);
    expect(checkAnswer(typed("Die Tür ist zu."), "Die Tuer ist zu", "de-vi")).toBe(true);
    expect(checkAnswer(typed("Ich wohne in Köln."), "Ich wohne in Koeln", "de-vi")).toBe(true);
    // the a/o/u fold the course shipped with is kept
    expect(checkAnswer(typed("schön"), "schon", "de-vi")).toBe(true);
  });

  test("the transliteration never merges different words", () => {
    // "neue" is not ä/ö/ü spelt out: the key keeps its e, so "neu" stays wrong
    expect(checkAnswer(typed("Das Auto ist neu."), "Das Auto ist neue", "de-vi")).toBe(false);
    expect(checkAnswer(typed("Die neue Wohnung."), "Die neu Wohnung", "de-vi")).toBe(false);
    expect(checkAnswer(typed("Ich habe neun Euro."), "Ich habe neuen Euro", "de-vi")).toBe(false);
    expect(checkAnswer(typed("Der Hund ist groß."), "Der Hund ist gros", "de-vi")).toBe(false);
  });

  test("word banks share the folds", () => {
    const bank: WordBankExercise = {
      type: "wordBank",
      id: "de-vi:test-e1",
      direction: "nativeToTarget",
      prompt: "",
      tokens: ["Ich", "heiße", "Lena", "heisse"],
      answer: ["Ich", "heiße", "Lena"],
    };
    expect(checkAnswer(bank, [0, 3, 2], "de-vi")).toBe(true);
    expect(checkAnswer(bank, [2, 1, 0], "de-vi")).toBe(false);
  });
});

describe("German strict grading keeps umlauts and ß", () => {
  test("dictation", () => {
    const dictation: DictationExercise = { type: "dictation", id: "de-vi:test-e2", clipId: "c", answer: "die Straße", alternatives: [] };
    expect(checkAnswer(dictation, "Die Straße.", "de-vi")).toBe(true);
    expect(checkAnswer(dictation, "die Strasse", "de-vi")).toBe(false);
    const tuer: DictationExercise = { type: "dictation", id: "de-vi:test-e3", clipId: "c", answer: "Die Tür ist zu.", alternatives: [] };
    expect(checkAnswer(tuer, "Die Tuer ist zu", "de-vi")).toBe(false);
  });

  test("conjugation cloze", () => {
    const cloze: ConjugationClozeExercise = {
      type: "conjugationCloze",
      id: "de-vi:test-e4",
      sentence: "Er ___ Paul.",
      translation: "",
      verb: "heißen",
      cell: "pre:3s",
      answer: "heißt",
      alternatives: [],
    };
    expect(checkAnswer(cloze, "heißt", "de-vi")).toBe(true);
    expect(checkAnswer(cloze, "heisst", "de-vi")).toBe(false);
  });
});

describe("German number speller", () => {
  test("0–100 in words", () => {
    const cases: [number, string][] = [
      [0, "null"], [1, "eins"], [2, "zwei"], [6, "sechs"], [7, "sieben"], [10, "zehn"], [11, "elf"], [12, "zwölf"],
      [13, "dreizehn"], [16, "sechzehn"], [17, "siebzehn"], [20, "zwanzig"], [21, "einundzwanzig"], [25, "fünfundzwanzig"],
      [30, "dreißig"], [31, "einunddreißig"], [37, "siebenunddreißig"], [40, "vierzig"], [50, "fünfzig"], [60, "sechzig"],
      [66, "sechsundsechzig"], [70, "siebzig"], [77, "siebenundsiebzig"], [80, "achtzig"], [99, "neunundneunzig"], [100, "hundert"],
    ];
    for (const [n, word] of cases) expect(germanNumber(n)).toBe(word);
    const all = Array.from({ length: 101 }, (_, n) => germanNumber(n));
    expect(new Set(all).size).toBe(101);
    for (const w of all) expect(w).toMatch(/^[a-zäöüß]+$/);
    expect(de.numberToWords!(30)).toBe("dreißig");
  });

  test("only standalone digit tokens 0–100 are spelt", () => {
    expect(spellGermanDigits("8")).toBe("acht");
    expect(spellGermanDigits("08")).toBe("acht");
    expect(spellGermanDigits("101")).toBe("101");
    expect(spellGermanDigits("500")).toBe("500");
    expect(spellGermanDigits("acht")).toBe("acht");
    expect(spellGermanDigits("8a")).toBe("8a");
  });

  test("spoken digits, clock times and prices match the authored words", () => {
    const same = (a: string, b: string) => expect(normalizeSpoken(a, de)).toBe(normalizeSpoken(b, de));
    same("Es ist 8 Uhr", "Es ist acht Uhr.");
    same("Das kostet 10 €", "Das kostet zehn Euro.");
    same("Das kostet 3 Euro", "Das kostet drei Euro");
    same("Drei Euro fünfzig", "3,50 €");
    same("Das macht 4,00 Euro", "Das macht vier Euro");
    same("acht Uhr fünfzehn", "8:15 Uhr");
    same("Um 15:00 Uhr", "um fünfzehn Uhr");
    same("um sechzehn Uhr dreißig", "um 16:30 Uhr");
    same("Abfahrt 9.10 Uhr", "Abfahrt neun Uhr zehn");
    same("Ich bin 25", "Ich bin fünfundzwanzig");
    // without "Uhr" a clock stays two numbers, as spoken ("acht fünfzehn")
    same("8:15", "acht fünfzehn");
    expect(normalizeSpoken("Gleis 101", de)).toBe("gleis 101");
  });

  test("the spoken grader accepts a recognizer's digits", () => {
    const spec = { acceptedVariants: ["Es ist acht Uhr", "Acht Uhr"] };
    expect(gradeSpokenAttempt({ finalTranscript: "Es ist 8 Uhr", alternatives: [] }, spec, de).correct).toBe(true);
    expect(gradeSpokenAttempt({ finalTranscript: "Es ist 9 Uhr", alternatives: [] }, spec, de).correct).toBe(false);
    const price = { acceptedVariants: ["Das kostet drei Euro"] };
    expect(gradeSpokenAttempt({ finalTranscript: "Das kostet 3 €", alternatives: [] }, price, de).correct).toBe(true);
  });

  test("written rubrics see the same numbers and the ß fold", () => {
    expect(normalizeWritten("Wir treffen uns um 15:00 Uhr.", de)).toBe(normalizeWritten("wir treffen uns um 15 uhr", de));
    expect(normalizeWritten("Mit freundlichen Grüssen", de)).toBe(normalizeWritten("mit freundlichen grüßen", de));
    expect(normalizeWritten("Ich bin dreißig", de)).toBe(normalizeWritten("Ich bin 30", de));
  });
});

describe("French is untouched", () => {
  test("no alternate fold, the French speller, accents folded as before", () => {
    expect(fr.normalizeLenientAlternate).toBeUndefined();
    expect(fr.normalizeLenient("Straße")).toBe("straße");
    expect(normalizeSpoken("J'ai 2 chats", fr)).toBe("j ai deux chats");
    expect(normalizeSpoken("8:15 Uhr", fr)).toBe("huit quinze uhr");
    expect(checkAnswer(typed("école"), "ecole", "fr-vi")).toBe(true);
    expect(checkAnswer(typed("le cœur"), "le coeur", "fr-vi")).toBe(true);
  });
});

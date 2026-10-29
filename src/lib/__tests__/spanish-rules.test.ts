/**
 * D-10 review pass 2 (es-vi): the Spanish number speller for spoken and
 * written answers. The es-ES recognizer writes numbers as digits ("cuesta
 * 16 euros", "16 €", "a las 10", "10:30"); the course authors them as words.
 *  - standalone digits 0–100 are spelt as Spanish words ("16" → "dieciséis");
 *  - euro amounts read as spoken ("1 €" → "un euro", "21 €" → "veintiún
 *    euros", "3,50 €" → "tres euros con cincuenta");
 *  - clock times read as spoken: ":00" drops, 12-hour times use "y cuarto",
 *    "y media", "menos cuarto", 24-hour times are read as two numbers;
 *  - "la 1" (one o'clock) is "la una".
 * French behaviour is untouched.
 */
import { describe, expect, test } from "bun:test";

import { languageRules } from "../languages";
import { spanishNumber, spellSpanishDigits } from "../languages/es";
import { gradeSpokenAttempt, normalizeSpoken } from "../speech/grader";
import { normalizeWritten } from "../writing/rubric";

const es = languageRules("es");
const fr = languageRules("fr");

describe("Spanish number speller", () => {
  test("0–100 in words", () => {
    const cases: [number, string][] = [
      [0, "cero"], [1, "uno"], [2, "dos"], [5, "cinco"], [9, "nueve"], [10, "diez"], [11, "once"], [12, "doce"],
      [15, "quince"], [16, "dieciséis"], [17, "diecisiete"], [19, "diecinueve"], [20, "veinte"], [21, "veintiuno"],
      [22, "veintidós"], [23, "veintitrés"], [26, "veintiséis"], [29, "veintinueve"], [30, "treinta"],
      [31, "treinta y uno"], [45, "cuarenta y cinco"], [50, "cincuenta"], [66, "sesenta y seis"], [70, "setenta"],
      [80, "ochenta"], [99, "noventa y nueve"], [100, "cien"],
    ];
    for (const [n, word] of cases) expect(spanishNumber(n)).toBe(word);
    const all = Array.from({ length: 101 }, (_, n) => spanishNumber(n));
    expect(new Set(all).size).toBe(101);
    for (const w of all) expect(w).toMatch(/^[a-záéíóúñ ]+$/);
    expect(es.numberToWords!(16)).toBe("dieciséis");
    expect(() => spanishNumber(101)).toThrow(RangeError);
  });

  test("only standalone digit tokens 0–100 are spelt", () => {
    expect(spellSpanishDigits("8")).toBe("ocho");
    expect(spellSpanishDigits("08")).toBe("ocho");
    expect(spellSpanishDigits("100")).toBe("cien");
    expect(spellSpanishDigits("101")).toBe("101");
    expect(spellSpanishDigits("ocho")).toBe("ocho");
    expect(spellSpanishDigits("4a")).toBe("4a");
  });

  test("spoken digits, euro amounts and clock times match the authored words", () => {
    const same = (a: string, b: string) => expect(normalizeSpoken(a, es)).toBe(normalizeSpoken(b, es));
    same("El billete cuesta 16 euros", "El billete cuesta dieciséis euros.");
    same("El billete cuesta 16 €", "El billete cuesta dieciséis euros.");
    same("Cuesta 3 €", "Cuesta tres euros");
    same("Son 3 euros", "Son tres euros");
    same("Cuesta 1 €", "Cuesta un euro");
    same("Cuesta 1 euro", "Cuesta un euro");
    same("Son 21 €", "Son veintiún euros");
    same("Son 31 euros", "Son treinta y un euros");
    same("Cuesta 3,50 €", "Cuesta tres euros con cincuenta");
    same("Cuesta 3,00 €", "Cuesta tres euros");
    same("El museo abre a las 10 el domingo", "El museo abre a las diez el domingo.");
    same("El museo abre a las 10:00 el domingo", "El museo abre a las diez el domingo.");
    same("Son las 10:00", "Son las diez");
    same("Son las 10:00 h", "Son las diez");
    same("a las 10:30", "a las diez y media");
    same("a las 9:15", "a las nueve y cuarto");
    same("a las 10:45", "a las once menos cuarto");
    same("a las 12:45", "a la una menos cuarto");
    same("a las 8:20", "a las ocho y veinte");
    same("a las 18:30", "a las dieciocho treinta");
    same("a las 18:00", "a las dieciocho");
    same("Es la 1", "Es la una");
    same("Es la 1:30", "Es la una y media");
    same("Tengo 25 años", "Tengo veinticinco años");
    expect(normalizeSpoken("Andén 101", es)).toBe("andén 101");
  });

  test("the spoken grader accepts a recognizer's digits", () => {
    const price = { acceptedVariants: ["El billete cuesta dieciséis euros."] };
    expect(gradeSpokenAttempt({ finalTranscript: "El billete cuesta 16 €", alternatives: [] }, price, es).correct).toBe(true);
    expect(gradeSpokenAttempt({ finalTranscript: "El billete cuesta 15 €", alternatives: [] }, price, es).correct).toBe(false);
    const time = { acceptedVariants: ["Son las diez"] };
    expect(gradeSpokenAttempt({ finalTranscript: "Son las 10:00", alternatives: [] }, time, es).correct).toBe(true);
    expect(gradeSpokenAttempt({ finalTranscript: "Son las 11:00", alternatives: [] }, time, es).correct).toBe(false);
    const concepts = { acceptedVariants: [], requiredConcepts: [["cuesta", "son"], ["tres"], ["euros", "euro"]] };
    expect(gradeSpokenAttempt({ finalTranscript: "Cuesta 3 €", alternatives: [] }, concepts, es).correct).toBe(true);
  });

  test("written rubrics see the same numbers", () => {
    expect(normalizeWritten("Quedamos el sábado a las 18:00.", es)).toBe(normalizeWritten("quedamos el sábado a las dieciocho", es));
    expect(normalizeWritten("Tengo treinta años", es)).toBe(normalizeWritten("Tengo 30 años", es));
  });
});

describe("French is untouched", () => {
  test("the French speller and folds", () => {
    expect(normalizeSpoken("J'ai 2 chats", fr)).toBe("j ai deux chats");
    expect(normalizeSpoken("Il est 10:30", fr)).toBe("il est dix trente");
    expect(normalizeSpoken("3 €", fr)).toBe("trois €");
  });
});

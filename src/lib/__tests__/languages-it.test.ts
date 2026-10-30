/** Italian rules (P3d it): number speller, spoken number formats, grammar labels. */
import { describe, expect, test } from "bun:test";

import { it as rules, italianNumber, spellItalianDigits } from "../languages/it";

describe("Italian number speller", () => {
  test("0–100 in standard spelling, with the vowel drop and the accented -tré", () => {
    const cases: [number, string][] = [
      [0, "zero"],
      [1, "uno"],
      [9, "nove"],
      [10, "dieci"],
      [11, "undici"],
      [16, "sedici"],
      [17, "diciassette"],
      [19, "diciannove"],
      [20, "venti"],
      [21, "ventuno"],
      [23, "ventitré"],
      [28, "ventotto"],
      [30, "trenta"],
      [31, "trentuno"],
      [33, "trentatré"],
      [38, "trentotto"],
      [46, "quarantasei"],
      [59, "cinquantanove"],
      [81, "ottantuno"],
      [100, "cento"],
    ];
    for (const [n, word] of cases) expect(italianNumber(n)).toBe(word);
    expect(() => italianNumber(101)).toThrow(RangeError);
  });

  test("standalone digits are spelled; every other token is unchanged", () => {
    expect(spellItalianDigits("8")).toBe("otto");
    expect(spellItalianDigits("101")).toBe("101");
    expect(spellItalianDigits("otto")).toBe("otto");
  });
});

describe("Italian spoken number formats", () => {
  test("clock times read as spoken", () => {
    expect(rules.foldSpoken("Alle 8:00")).toBe("alle 8");
    expect(rules.foldSpoken("Alle 8:30")).toBe("alle 8 e mezza");
    expect(rules.foldSpoken("Alle 8:15")).toBe("alle 8 e un quarto");
    expect(rules.foldSpoken("Alle 8:45")).toBe("alle 9 meno un quarto");
    expect(rules.foldSpoken("Alle 18:30")).toBe("alle 18 e 30");
    expect(rules.foldSpoken("All'1")).toBe("all una");
  });

  test("euro amounts read as spoken; euro is invariable", () => {
    expect(rules.foldSpoken("1 €")).toBe("un euro");
    expect(rules.foldSpoken("16 €")).toBe("16 euro");
    expect(rules.foldSpoken("3,50 €")).toBe("3 euro e 50");
  });
});

describe("Italian articles and labels", () => {
  test("the article split handles every form", () => {
    expect(rules.splitArticle("l'amico")).toEqual({ article: "l'", bare: "amico" });
    expect(rules.splitArticle("lo zaino")).toEqual({ article: "lo", bare: "zaino" });
    expect(rules.splitArticle("gli amici")).toEqual({ article: "gli", bare: "amici" });
    expect(rules.splitArticle("il libro")).toEqual({ article: "il", bare: "libro" });
  });

  test("grammar labels name the Italian persons", () => {
    expect(rules.grammarLabels?.persons["pre:1s"]).toBe("io");
    expect(rules.grammarLabels?.persons["pre:3s"]).toBe("lui/lei/Lei");
    expect(rules.grammarLabels?.presentTense).toBe("presente");
  });
});

/**
 * French numbers 0–100 (Phase 5B §75–80): EXHAUSTIVE — every integer in
 * the range is pinned against a hand-authored expected spelling, plus the
 * orthography-variant contract and structural invariants.
 */
import { describe, expect, test } from "bun:test";

import { acceptedNumberSpellings, frenchNumber } from "../learning/french-numbers";

/** Hand-authored expected traditional spellings for every value 0–100. */
const EXPECTED: Record<number, string> = (() => {
  const units = [
    "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit",
    "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
    "dix-sept", "dix-huit", "dix-neuf",
  ];
  const table: Record<number, string> = {};
  for (let n = 0; n <= 19; n++) table[n] = units[n];
  const tens: [number, string][] = [
    [20, "vingt"], [30, "trente"], [40, "quarante"], [50, "cinquante"], [60, "soixante"],
  ];
  for (const [ten, word] of tens) {
    table[ten] = word;
    table[ten + 1] = `${word} et un`;
    for (let u = 2; u <= 9; u++) table[ten + u] = `${word}-${units[u]}`;
  }
  table[70] = "soixante-dix";
  table[71] = "soixante et onze";
  for (let n = 72; n <= 79; n++) table[n] = `soixante-${units[n - 60]}`;
  table[80] = "quatre-vingts";
  for (let n = 81; n <= 99; n++) table[n] = `quatre-vingt-${units[n - 80]}`;
  table[100] = "cent";
  return table;
})();

describe("frenchNumber — exhaustive 0–100", () => {
  test("every integer matches the hand-authored table", () => {
    for (let n = 0; n <= 100; n++) {
      expect({ n, word: frenchNumber(n).traditional }).toEqual({ n, word: EXPECTED[n] });
    }
  });

  test("the classic landmarks, spelled out explicitly", () => {
    expect(frenchNumber(21).traditional).toBe("vingt et un");
    expect(frenchNumber(61).traditional).toBe("soixante et un");
    expect(frenchNumber(70).traditional).toBe("soixante-dix");
    expect(frenchNumber(71).traditional).toBe("soixante et onze");
    expect(frenchNumber(77).traditional).toBe("soixante-dix-sept");
    expect(frenchNumber(80).traditional).toBe("quatre-vingts");
    expect(frenchNumber(81).traditional).toBe("quatre-vingt-un");
    expect(frenchNumber(90).traditional).toBe("quatre-vingt-dix");
    expect(frenchNumber(91).traditional).toBe("quatre-vingt-onze");
    expect(frenchNumber(99).traditional).toBe("quatre-vingt-dix-neuf");
    expect(frenchNumber(100).traditional).toBe("cent");
  });

  test("structural invariants over the whole range", () => {
    for (let n = 0; n <= 100; n++) {
      const { traditional, rectified } = frenchNumber(n);
      // "et" appears exactly in 21/31/41/51/61/71 — never in the 80s/90s.
      const hasEt = / et /.test(traditional);
      expect({ n, hasEt }).toEqual({ n, hasEt: [21, 31, 41, 51, 61, 71].includes(n) });
      // quatre-vingts keeps its -s only when bare.
      if (n > 80 && n <= 99) expect(traditional).toMatch(/^quatre-vingt-/);
      // No stray whitespace or doubled separators, ever.
      expect(traditional).not.toMatch(/(^[ -])|([ -]$)|(--)|(  )/);
      // The rectified form is exactly the traditional with spaces hyphenated.
      expect(rectified).toBe(traditional.replace(/ /g, "-"));
      expect(rectified).not.toContain(" ");
    }
  });

  test("out-of-range and non-integer inputs throw", () => {
    for (const bad of [-1, 101, 0.5, NaN, Infinity]) {
      expect(() => frenchNumber(bad)).toThrow();
    }
  });
});

describe("acceptedNumberSpellings — both official orthographies", () => {
  test("space-bearing numbers accept traditional and rectified", () => {
    expect(acceptedNumberSpellings(21)).toEqual(["vingt et un", "vingt-et-un"]);
    expect(acceptedNumberSpellings(71)).toEqual(["soixante et onze", "soixante-et-onze"]);
  });

  test("hyphen-only numbers accept exactly one spelling", () => {
    expect(acceptedNumberSpellings(17)).toEqual(["dix-sept"]);
    expect(acceptedNumberSpellings(80)).toEqual(["quatre-vingts"]);
    expect(acceptedNumberSpellings(91)).toEqual(["quatre-vingt-onze"]);
    expect(acceptedNumberSpellings(0)).toEqual(["zéro"]);
  });

  test("every value yields 1 or 2 spellings, first always the displayed traditional", () => {
    for (let n = 0; n <= 100; n++) {
      const accepted = acceptedNumberSpellings(n);
      expect(accepted.length === 1 || accepted.length === 2).toBe(true);
      expect(accepted[0]).toBe(frenchNumber(n).traditional);
    }
  });
});

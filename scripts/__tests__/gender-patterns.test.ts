/**
 * Gender-pattern derivation (§51–53): thresholds, longest-distinctive-
 * suffix subsumption (the recorded "-on vs -ion" trap), refinement
 * pruning, honest wording — proven on synthetic fixtures plus pinned on
 * the real committed population.
 */
import { describe, expect, test } from "bun:test";

import {
  PATTERN_MIN_COUNT,
  deriveGenderPatterns,
  type DerivedGenderPattern,
} from "../lib/gender-patterns";
import type { GenderSuffixStats } from "../lib/lexique-derive-lib";
import { readJson } from "../lib/pipeline";

function statsOf(endings: { ending: string; m: number; f: number; e?: number }[]): GenderSuffixStats {
  const items = endings.map((x) => ({ ending: x.ending, m: x.m, f: x.f, e: x.e ?? 0, total: x.m + x.f + (x.e ?? 0) }));
  return {
    population: { definition: "fixture", size: 0, byGenre: {} },
    researchedSuffixes: [],
    dataDrivenEndings: items,
    minCount: 30,
  };
}

const bySuffix = (patterns: DerivedGenderPattern[], suffix: string) =>
  patterns.find((p) => p.suffix === suffix);

describe("deriveGenderPatterns", () => {
  test("the -on/-ion trap: subsumption re-judges the short ending on its own words", () => {
    // Raw "-on" looks 70% feminine ONLY because "-ion" dominates it.
    const patterns = deriveGenderPatterns(
      statsOf([
        { ending: "on", m: 900, f: 2100 },
        { ending: "ion", m: 30, f: 2070 },
      ])
    );
    const ion = bySuffix(patterns, "ion");
    expect(ion?.gender).toBe("feminine");
    const on = bySuffix(patterns, "on");
    // After subtracting -ion: 870 m / 30 f → masculine, 96.7%.
    expect(on?.gender).toBe("masculine");
    expect(on?.reliabilityPct).toBeCloseTo(96.7, 1);
    expect(on?.subtracted).toEqual(["ion"]);
  });

  test("below-threshold reliability or coverage never becomes a pattern", () => {
    const patterns = deriveGenderPatterns(
      statsOf([
        { ending: "ure", m: 40, f: 210 }, // 84% — honest exclusion
        { ending: "zz", m: 99, f: 0 }, // n < 100
      ])
    );
    expect(patterns).toEqual([]);
    expect(PATTERN_MIN_COUNT).toBe(100);
  });

  test("wording is derived: ≥99% almost always, ≥90% usually", () => {
    const patterns = deriveGenderPatterns(
      statsOf([
        { ending: "isme", m: 995, f: 5 },
        { ending: "ette", m: 40, f: 360 },
      ])
    );
    expect(bySuffix(patterns, "isme")?.wording).toBe("almost always");
    expect(bySuffix(patterns, "ette")?.wording).toBe("usually");
  });

  test("épicène rows weaken a claim (count in the denominator, in neither gender)", () => {
    const patterns = deriveGenderPatterns(statsOf([{ ending: "iste", m: 100, f: 2, e: 18 }]));
    // 100 / 120 = 83.3% — below the bar, honestly excluded.
    expect(patterns).toEqual([]);
  });

  test("a same-gender refinement prunes the shorter form unless it is genuinely broader", () => {
    const narrow = deriveGenderPatterns(
      statsOf([
        { ending: "té", m: 90, f: 941 }, // 91.3%
        { ending: "ité", m: 19, f: 836 }, // 97.8% — refinement, and té is < 1.5× ité
      ])
    );
    expect(bySuffix(narrow, "té")).toBeUndefined();
    expect(bySuffix(narrow, "ité")).toBeDefined();

    const broad = deriveGenderPatterns(
      statsOf([
        { ending: "ie", m: 70, f: 1830 }, // n=1900, 96.3%
        { ending: "mie", m: 2, f: 198 }, // strong but small refinement
      ])
    );
    // "ie" covers ≥ 1.5× the refinement — both survive.
    expect(bySuffix(broad, "ie")).toBeDefined();
  });
});

describe("real committed population", () => {
  const stats = readJson("content/fr/lexicon/derived/gender-suffix-stats.json") as GenderSuffixStats;
  const patterns = deriveGenderPatterns(stats);

  test("the classic patterns derive with their real reliabilities", () => {
    expect(bySuffix(patterns, "tion")).toMatchObject({ gender: "feminine", wording: "almost always" });
    expect(bySuffix(patterns, "isme")).toMatchObject({ gender: "masculine", wording: "almost always" });
    expect(bySuffix(patterns, "ment")).toMatchObject({ gender: "masculine", wording: "almost always" });
    expect(bySuffix(patterns, "age")?.gender).toBe("masculine");
    expect(bySuffix(patterns, "eau")?.gender).toBe("masculine");
  });

  test("the honest exclusions hold: -ure (84%) is not a pattern; bare -té yields to -ité", () => {
    expect(bySuffix(patterns, "ure")).toBeUndefined();
    expect(bySuffix(patterns, "té")).toBeUndefined();
    expect(bySuffix(patterns, "ité")).toBeDefined();
  });

  test("every derived pattern meets the documented bars", () => {
    for (const p of patterns) {
      expect(p.reliabilityPct).toBeGreaterThanOrEqual(90);
      expect(p.lemmaCount).toBeGreaterThanOrEqual(100);
    }
  });
});

/**
 * Smart distractor matrix (§92): tier preferences, gender preference,
 * direction-aware uniqueness, unwinnability protection, tiny pools,
 * missing metadata, determinism — over the REAL French lexicon index plus
 * synthetic fixtures for the cases real data cannot exercise yet.
 */
import { describe, expect, test } from "bun:test";

import { pickDistractors, tierOf } from "../learning/distractors";
import { frItemIdFor } from "../learning/ids-fr";
import { lexemeMetaFor, type LexemeMeta } from "../learning/lexicon-index";
import { seededRng } from "../review-builder";
import { PACKS } from "../../content/packs";
import type { Word } from "../types";

const FR = "fr-en";
const frPool: Word[] = PACKS[FR].sections.flatMap((s) =>
  s.units.flatMap((u) => u.words.map((w) => ({ target: w.target, native: w.native, emoji: w.emoji })))
);
const wordFor = (target: string): Word => {
  const w = frPool.find((x) => x.target === target);
  if (!w) throw new Error(`missing pool word ${target}`);
  return w;
};

function pick(target: string, direction: "targetToNative" | "nativeToTarget", seed = 42): Word[] {
  return pickDistractors({
    courseId: FR,
    word: wordFor(target),
    pool: frPool,
    rng: seededRng(seed),
    direction,
  });
}

describe("tier preferences", () => {
  test("authored confusables always come first (gauche → droite)", () => {
    for (const seed of [1, 2, 3, 7, 99]) {
      const picks = pick("la gauche", "targetToNative", seed).map((w) => w.target);
      expect(picks).toContain("la droite");
    }
  });

  test("same POS + topic dominates: an animal noun draws animal-noun distractors", () => {
    const picks = pick("le chat", "targetToNative", 5);
    expect(picks.length).toBe(3);
    for (const w of picks) {
      const meta = lexemeMetaFor(idOf(w));
      // chien is a confusable (tier 1) and also an animal; the rest tier 2.
      expect(meta?.pos).toBe("noun");
      expect(meta?.topic).toBe("animals");
    }
  });

  test("nouns prefer same-gender distractors so articles cannot leak the answer", () => {
    // vache is feminine; only two other feminine animals exist (souris,
    // poule) — the engine must take both before any masculine animal.
    for (const seed of [1, 4, 9]) {
      const picks = pick("la vache", "nativeToTarget", seed).map((w) => w.target);
      expect(picks).toContain("la souris");
      expect(picks).toContain("la poule");
      expect(picks.filter((t) => t.startsWith("la ")).length).toBeGreaterThanOrEqual(2);
    }
  });

  test("tier order is exact, including the frequency-band tier (synthetic)", () => {
    const meta = (over: Partial<LexemeMeta>): LexemeMeta => ({
      id: "fr:w:t",
      surface: "le t",
      lookupForm: "t",
      lemma: "t",
      gloss: "the t",
      pos: "noun",
      ...over,
    });
    const target = meta({ topic: "food", band: "common", confusables: ["fr:w:rival"] });
    expect(tierOf(target, meta({ id: "fr:w:rival", topic: "travel" }))).toBe(1);
    expect(tierOf(target, meta({ id: "fr:w:a", topic: "food" }))).toBe(2);
    expect(tierOf(target, meta({ id: "fr:w:b", topic: "travel", band: "common" }))).toBe(3);
    expect(tierOf(target, meta({ id: "fr:w:c", topic: "travel", band: "very-common" }))).toBe(4);
    expect(tierOf(target, meta({ id: "fr:w:d", pos: "verb" }))).toBe(5);
    expect(tierOf(target, undefined)).toBe(5);
    expect(tierOf(undefined, meta({}))).toBe(5);
  });
});

describe("hard rules", () => {
  test("the answer never appears, displays are unique (both directions)", () => {
    for (const direction of ["targetToNative", "nativeToTarget"] as const) {
      for (const target of ["le chat", "l'eau", "manger", "bonjour"]) {
        const word = wordFor(target);
        const picks = pick(target, direction, 11);
        const displays = picks.map((w) => (direction === "targetToNative" ? w.native : w.target));
        expect(picks.some((w) => w.target === target)).toBe(false);
        expect(new Set(displays).size).toBe(displays.length);
        expect(displays).not.toContain(direction === "targetToNative" ? word.native : word.target);
      }
    }
  });

  test("production never offers a second correct answer (duplicate gloss of the target)", () => {
    const pool: Word[] = [
      { target: "l'eau", native: "the water", emoji: "💧" },
      { target: "la flotte", native: "the water", emoji: "🌊" }, // synthetic duplicate gloss
      { target: "le lait", native: "the milk", emoji: "🥛" },
      { target: "le jus", native: "the juice", emoji: "🧃" },
      { target: "le café", native: "the coffee", emoji: "☕" },
    ];
    for (const seed of [1, 2, 3]) {
      const picks = pickDistractors({
        courseId: FR,
        word: pool[0],
        pool,
        rng: seededRng(seed),
        direction: "nativeToTarget",
      });
      expect(picks.some((w) => w.native === "the water")).toBe(false);
      expect(picks.length).toBe(3);
    }
  });

  test("duplicate glosses among distractors relax only when the pool is too small", () => {
    const pool: Word[] = [
      { target: "le chat", native: "the cat", emoji: "🐈" },
      { target: "le matou", native: "the cat", emoji: "🐱" }, // synthetic duplicate gloss
      { target: "le chien", native: "the dog", emoji: "🐕" },
      { target: "la vache", native: "the cow", emoji: "🐄" },
    ];
    const picks = pickDistractors({
      courseId: FR,
      word: { target: "la poule", native: "the hen", emoji: "🐔" },
      pool: [...pool, { target: "la poule", native: "the hen", emoji: "🐔" }],
      rng: seededRng(1),
      direction: "nativeToTarget",
    });
    // Needs 3 of 4 candidates; strict pass yields chat/chien/vache — the
    // duplicate-gloss matou is only used when nothing else can fill.
    expect(picks.length).toBe(3);
    const natives = picks.map((w) => w.native);
    expect(new Set(natives).size).toBe(3);
  });

  test("tiny pools return fewer distractors instead of blocking", () => {
    const two: Word[] = [
      { target: "le chat", native: "the cat", emoji: "🐈" },
      { target: "le chien", native: "the dog", emoji: "🐕" },
    ];
    expect(
      pickDistractors({ courseId: FR, word: two[0], pool: two, rng: seededRng(1), direction: "targetToNative" })
    ).toHaveLength(1);
    expect(
      pickDistractors({ courseId: FR, word: two[0], pool: [two[0]], rng: seededRng(1), direction: "targetToNative" })
    ).toHaveLength(0);
  });

  test("missing metadata never crashes: legacy courses and unmapped French words", () => {
    const es: Word[] = [
      { target: "el gato", native: "the cat", emoji: "🐈" },
      { target: "el perro", native: "the dog", emoji: "🐕" },
      { target: "la vaca", native: "the cow", emoji: "🐄" },
      { target: "el pan", native: "the bread", emoji: "🍞" },
    ];
    const legacy = pickDistractors({
      courseId: "es-en",
      word: es[0],
      pool: es,
      rng: seededRng(3),
      direction: "targetToNative",
    });
    expect(legacy).toHaveLength(3);

    const withUnmapped = pickDistractors({
      courseId: FR,
      word: { target: "le dragon", native: "the dragon", emoji: "🐉" },
      pool: frPool,
      rng: seededRng(3),
      direction: "targetToNative",
    });
    expect(withUnmapped).toHaveLength(3);
  });
});

describe("determinism", () => {
  test("same seed → same picks; picks come only from the session rng", () => {
    for (const direction of ["targetToNative", "nativeToTarget"] as const) {
      const a = pick("le pain", direction, 123).map((w) => w.target);
      const b = pick("le pain", direction, 123).map((w) => w.target);
      expect(a).toEqual(b);
    }
  });
});

function idOf(w: Word): string {
  // Test helper: resolve through the frozen map the engine itself uses.
  return frItemIdFor(w.target);
}

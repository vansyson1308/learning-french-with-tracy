import { describe, expect, test } from "bun:test";

import { buildSrsExercises, REVIEW_SESSION_SIZE } from "../review-builder";
import type { Word } from "../types";

const pool: Word[] = Array.from({ length: 20 }, (_, i) => ({
  target: `mot-${i}`,
  native: `word-${i}`,
  emoji: "🔤",
}));

describe("spaced-review session builder", () => {
  test("caps the session and produces one select exercise per due word", () => {
    const due = pool.map((w) => w.target).concat(["missing-word"]);
    const exercises = buildSrsExercises(due, pool, 42);
    expect(exercises.length).toBe(REVIEW_SESSION_SIZE);
    for (const e of exercises) {
      expect(e.type).toBe("select");
      if (e.type === "select") {
        expect(e.options).toHaveLength(4);
        expect(e.correct).toBeGreaterThanOrEqual(0);
        expect(e.correct).toBeLessThan(4);
      }
    }
  });

  test("the correct option matches the word and distractors never equal it", () => {
    const exercises = buildSrsExercises(["mot-3"], pool, 7);
    const e = exercises[0];
    if (e.type !== "select") throw new Error("expected select");
    expect(e.options[e.correct].text).toBe("word-3");
    const texts = e.options.map((o) => o.text);
    expect(new Set(texts).size).toBe(4); // all options unique
    expect(texts.filter((t) => t === "word-3")).toHaveLength(1);
  });

  test("duplicate display strings in the pool are deduped", () => {
    const dupPool: Word[] = [
      { target: "a", native: "the same", emoji: "🅰️" },
      { target: "b", native: "the same", emoji: "🅱️" },
      { target: "c", native: "unique-1", emoji: "©️" },
      { target: "d", native: "unique-2", emoji: "🇩" },
      { target: "e", native: "unique-3", emoji: "📧" },
    ];
    for (let seed = 0; seed < 25; seed++) {
      const [e] = buildSrsExercises(["a"], dupPool, seed);
      if (e.type !== "select") throw new Error("expected select");
      const texts = e.options.map((o) => o.text);
      expect(new Set(texts).size).toBe(texts.length);
      expect(texts.filter((t) => t === "the same")).toHaveLength(1);
    }
  });

  test("the correct answer's position is uniformly distributed (was always 0)", () => {
    const counts = [0, 0, 0, 0];
    for (let seed = 0; seed < 200; seed++) {
      const [e] = buildSrsExercises(["mot-5"], pool, seed);
      if (e.type !== "select") throw new Error("expected select");
      counts[e.correct]++;
    }
    for (const c of counts) {
      expect(c).toBeGreaterThan(20); // ~50 expected per slot; far from 0/200 skew
    }
  });

  test("deterministic for a given seed", () => {
    const a = buildSrsExercises(["mot-1", "mot-2"], pool, 1234);
    const b = buildSrsExercises(["mot-1", "mot-2"], pool, 1234);
    expect(a).toEqual(b);
    const c = buildSrsExercises(["mot-1", "mot-2"], pool, 999);
    expect(JSON.stringify(c)).not.toBe(JSON.stringify(a));
  });

  test("unknown due targets are skipped; tiny pools still work", () => {
    const tiny: Word[] = [
      { target: "x", native: "ex", emoji: "❌" },
      { target: "y", native: "why", emoji: "❓" },
    ];
    const exercises = buildSrsExercises(["x", "ghost"], tiny, 5);
    expect(exercises).toHaveLength(1);
    const e = exercises[0];
    if (e.type !== "select") throw new Error("expected select");
    expect(e.options.length).toBe(2);
    expect(e.options[e.correct].text).toBe("ex");
  });
});

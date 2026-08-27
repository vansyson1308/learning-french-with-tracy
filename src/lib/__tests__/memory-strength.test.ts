/**
 * French memory-strength display value (§74–76): FSRS retrievability
 * through the app-owned adapter — never a UI reimplementation — with
 * honest null for words that have no memory model yet.
 */
import { describe, expect, test } from "bun:test";

import { frMemoryStrengthPercent } from "../learning/engine";
import { fsrsScheduler } from "../learning/fsrs-adapter";

const DAY = 24 * 60 * 60 * 1000;

describe("frMemoryStrengthPercent", () => {
  test("a just-reviewed card is near 100% and decays over time", () => {
    const now = 1_700_000_000_000;
    const { card } = fsrsScheduler.review(fsrsScheduler.initialCard(now), "good", now);
    const fresh = frMemoryStrengthPercent(card, now)!;
    const later = frMemoryStrengthPercent(card, now + 30 * DAY)!;
    expect(fresh).toBeGreaterThanOrEqual(90);
    expect(later).toBeLessThan(fresh);
    expect(later).toBeGreaterThanOrEqual(0);
    expect(later).toBeLessThanOrEqual(100);
  });

  test("matches the adapter's retrievability exactly (no UI formula)", () => {
    const now = 1_700_000_000_000;
    const { card } = fsrsScheduler.review(fsrsScheduler.initialCard(now), "good", now);
    const at = now + 10 * DAY;
    expect(frMemoryStrengthPercent(card, at)).toBe(
      Math.round(fsrsScheduler.retrievability(card, at) * 100)
    );
  });

  test("no card → null (empty bar, never a fabricated value)", () => {
    expect(frMemoryStrengthPercent(undefined)).toBeNull();
  });

  test("an invalid card fails closed to null instead of crashing the screen", () => {
    const bad = {
      due: Number.NaN,
      stability: -5,
      difficulty: 99,
      scheduled_days: 0,
      learning_steps: 0,
      reps: 0,
      lapses: 0,
      state: "review" as const,
    };
    expect(frMemoryStrengthPercent(bad)).toBeNull();
  });
});

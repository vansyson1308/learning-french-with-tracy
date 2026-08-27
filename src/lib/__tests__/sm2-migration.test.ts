import { describe, expect, test } from "bun:test";

import { validateFsrsCard } from "../learning/fsrs-adapter";
import { S_MAX, S_MIN } from "../learning/fsrs-defaults";
import { estimateFsrsCardFromSm2, sm2ToFsrsMemory } from "../learning/sm2-migration";
import type { SrsEntry } from "../srs";

const DAY = 86_400_000;

describe("sm2ToFsrsMemory vs the fsrs-rs reference (golden vectors)", () => {
  // Difficulty values computed independently from memory_state_from_sm2
  // (fsrs-rs src/inference.rs:291) with the FSRS-6 default weights and
  // r = 0.9, at double precision. A change here means the formula or the
  // weights changed — either must be a deliberate, visible diff.
  test.each([
    [1, 2.5, 8.215850888],
    [3, 2.6, 7.433767808],
    [8, 2.6, 6.800708656],
    [20, 2.0, 7.942595999],
    [30, 2.8, 5.112076775],
    [100, 3.0, 3.004765098],
    [365, 1.3, 9.512008405],
  ])("interval=%d ease=%d → D=%f", (interval, ease, expectedD) => {
    const { stability, difficulty } = sm2ToFsrsMemory(interval, ease);
    expect(stability).toBe(interval); // r=0.9 identity, float-exact
    expect(difficulty).toBeCloseTo(expectedD, 8);
  });

  test("difficulty clamps to [1,10] at extreme ease values", () => {
    expect(sm2ToFsrsMemory(1, 1.3).difficulty).toBe(10); // min ease at 1d = hardest
    expect(sm2ToFsrsMemory(3, 0.5).difficulty).toBe(10); // corrupt sub-1 ease
    expect(sm2ToFsrsMemory(3, 100).difficulty).toBe(1); // corrupt huge ease
  });

  test("stability floors at S_MIN for sub-day intervals", () => {
    expect(sm2ToFsrsMemory(0.0001, 2.5).stability).toBe(S_MIN);
  });
});

describe("estimateFsrsCardFromSm2", () => {
  test("reviewed entry: due preserved verbatim, memory estimated, history mapped", () => {
    const entry: SrsEntry = { interval: 3, ease: 2.6, dueAt: 1768200000000, streak: 2 };
    const card = estimateFsrsCardFromSm2(entry, 1);
    expect(card).toEqual({
      due: 1768200000000, // never bulk-shift users' schedules
      stability: 3,
      difficulty: card.difficulty,
      scheduled_days: 3,
      learning_steps: 0,
      reps: 2,
      lapses: 1,
      state: "review",
      last_review: 1768200000000 - 3 * DAY,
    });
    expect(card.difficulty).toBeCloseTo(7.433767808, 8);
    expect(validateFsrsCard(card)).toEqual([]);
  });

  test("interval 0 (just-failed / brand-new): plain new card, due preserved", () => {
    const entry: SrsEntry = { interval: 0, ease: 2.3, dueAt: 1767950000000, streak: 0 };
    const card = estimateFsrsCardFromSm2(entry, 2);
    expect(card).toEqual({
      due: 1767950000000,
      stability: 0,
      difficulty: 0,
      scheduled_days: 0,
      learning_steps: 0,
      reps: 0,
      lapses: 2,
      state: "new",
    });
    expect(validateFsrsCard(card)).toEqual([]);
  });

  test("interval > 0 with streak 0 (corrupt) lands in learning, not review", () => {
    const card = estimateFsrsCardFromSm2(
      { interval: 5, ease: 2.5, dueAt: 1768200000000, streak: 0 },
      0
    );
    expect(card.state).toBe("learning");
    expect(card.reps).toBe(0);
  });

  test("total on garbage: NaN/Infinity/negative inputs yield a valid card", () => {
    const garbage = [
      { interval: NaN, ease: NaN, dueAt: NaN, streak: NaN },
      { interval: Infinity, ease: -Infinity, dueAt: Infinity, streak: -3 },
      { interval: -5, ease: 0, dueAt: -100, streak: 2.7 },
    ] as SrsEntry[];
    for (const entry of garbage) {
      const card = estimateFsrsCardFromSm2(entry, NaN);
      expect(validateFsrsCard(card)).toEqual([]);
    }
    // NaN interval → new-card path with due sanitized to 0 (due immediately).
    expect(estimateFsrsCardFromSm2(garbage[0], NaN).state).toBe("new");
    // Infinity interval is finite-checked, not trusted.
    expect(estimateFsrsCardFromSm2(garbage[1], 0).state).toBe("new");
  });

  test("absurd intervals clamp stability to S_MAX", () => {
    const card = estimateFsrsCardFromSm2(
      { interval: 1e9, ease: 2.5, dueAt: 1768200000000, streak: 3 },
      0
    );
    expect(card.stability).toBe(S_MAX);
    expect(validateFsrsCard(card)).toEqual([]);
  });

  test("property sweep: no field is ever non-finite", () => {
    const intervals = [0, 1, 2, 3, 8, 21, 55, 144, 377, 1000];
    const eases = [1.3, 1.5, 2.0, 2.5, 2.6, 3.0];
    for (const interval of intervals)
      for (const ease of eases) {
        const card = estimateFsrsCardFromSm2(
          { interval, ease, dueAt: 1768200000000, streak: interval > 0 ? 3 : 0 },
          2
        );
        expect(validateFsrsCard(card)).toEqual([]);
        expect(card.due).toBe(1768200000000);
      }
  });
});

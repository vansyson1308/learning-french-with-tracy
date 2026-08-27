import { describe, expect, test } from "bun:test";

import { DEFAULT_EASE, dueInDays, isDue, MIN_EASE, reviewWord } from "../srs";

const DAY = 86_400_000;

/**
 * Characterization suite: pins the CURRENT legacy scheduler behavior exactly,
 * so any future scheduler change (Phase 1) is a deliberate, visible diff.
 */
describe("legacy SM-2-ish scheduler (characterization)", () => {
  test("fresh word answered good: 1 day, ease +0.05, streak 1", () => {
    const before = Date.now();
    const entry = reviewWord(undefined, 2);
    expect(entry.interval).toBe(1);
    expect(entry.ease).toBeCloseTo(DEFAULT_EASE + 0.05, 10);
    expect(entry.streak).toBe(1);
    expect(entry.dueAt).toBeGreaterThanOrEqual(before + DAY - 5000);
    expect(entry.dueAt).toBeLessThanOrEqual(Date.now() + DAY + 5000);
  });

  test("good streak ladder: 1 → 3 → round(3×ease) days", () => {
    let entry = reviewWord(undefined, 2);
    expect(entry.interval).toBe(1);
    entry = reviewWord(entry, 2);
    expect(entry.interval).toBe(3);
    expect(entry.ease).toBeCloseTo(2.6, 10);
    entry = reviewWord(entry, 2);
    expect(entry.interval).toBe(Math.round(3 * 2.6)); // 8
    expect(entry.streak).toBe(3);
  });

  test("wrong resets: interval 0, streak 0, ease −0.2, due now", () => {
    const seeded = reviewWord(reviewWord(undefined, 2), 2); // interval 3
    const before = Date.now();
    const entry = reviewWord(seeded, 0);
    expect(entry.interval).toBe(0);
    expect(entry.streak).toBe(0);
    expect(entry.ease).toBeCloseTo(seeded.ease - 0.2, 10);
    expect(entry.dueAt).toBeGreaterThanOrEqual(before);
    expect(entry.dueAt).toBeLessThanOrEqual(Date.now() + 5000);
  });

  test("hard advances the ladder like good but drops ease by 0.15", () => {
    const first = reviewWord(undefined, 1);
    expect(first.interval).toBe(1);
    expect(first.streak).toBe(1);
    expect(first.ease).toBeCloseTo(DEFAULT_EASE - 0.15, 10);
  });

  test("ease is floored at 1.3 and capped at 3.0", () => {
    let entry = reviewWord(undefined, 2);
    for (let i = 0; i < 20; i++) entry = reviewWord(entry, 1);
    expect(entry.ease).toBeCloseTo(MIN_EASE, 10);

    let up = reviewWord(undefined, 2);
    for (let i = 0; i < 20; i++) up = reviewWord(up, 2);
    expect(up.ease).toBeCloseTo(3.0, 10);
  });

  test("isDue: missing entries and past dueAt are due", () => {
    expect(isDue(undefined)).toBe(true);
    expect(isDue({ interval: 1, ease: 2.5, dueAt: 100, streak: 1 }, 200)).toBe(true);
    expect(isDue({ interval: 1, ease: 2.5, dueAt: 300, streak: 1 }, 200)).toBe(false);
  });

  test("dueInDays: 0 when overdue, ceil otherwise", () => {
    const now = 1_000_000_000_000;
    expect(dueInDays({ interval: 1, ease: 2.5, dueAt: now - 1, streak: 1 }, now)).toBe(0);
    expect(
      dueInDays({ interval: 3, ease: 2.5, dueAt: now + 2.2 * DAY, streak: 2 }, now)
    ).toBe(3);
  });
});

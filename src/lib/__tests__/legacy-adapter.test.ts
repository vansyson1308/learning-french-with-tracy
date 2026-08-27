import { describe, expect, test } from "bun:test";

import { GRADE_TO_LEGACY_QUALITY, legacyScheduler } from "../learning/legacy-adapter";
import type { Grade } from "../learning/scheduler";
import { DEFAULT_EASE, reviewWord, type SrsEntry } from "../srs";

const DAY = 86_400_000;
const T0 = 1_700_000_000_000;

/**
 * Parity suite: the adapter must be a pure delegation to src/lib/srs.ts —
 * any divergence from reviewWord is a bug, because non-French courses'
 * persisted SrsEntry data must keep its exact semantics.
 */
describe("legacyScheduler parity with srs.ts", () => {
  const seeded: SrsEntry = { interval: 3, ease: 2.6, dueAt: T0, streak: 2 };

  test.each(["again", "hard", "good", "easy"] as Grade[])(
    "review('%s') equals reviewWord with the mapped quality",
    (grade) => {
      const viaAdapter = legacyScheduler.review(seeded, grade, T0).card;
      const direct = reviewWord(seeded, GRADE_TO_LEGACY_QUALITY[grade], T0);
      expect(viaAdapter).toEqual(direct);
    }
  );

  test("easy maps to good (legacy has no stronger grade)", () => {
    expect(GRADE_TO_LEGACY_QUALITY.easy).toBe(GRADE_TO_LEGACY_QUALITY.good);
    expect(legacyScheduler.review(seeded, "easy", T0).card).toEqual(
      legacyScheduler.review(seeded, "good", T0).card
    );
  });

  test("initialCard matches reviewWord's implicit base for a missing entry", () => {
    expect(legacyScheduler.initialCard(T0)).toEqual({
      interval: 0,
      ease: DEFAULT_EASE,
      dueAt: T0,
      streak: 0,
    });
    // Reviewing the initial card equals reviewing `undefined` directly.
    expect(legacyScheduler.review(legacyScheduler.initialCard(T0), "good", T0).card).toEqual(
      reviewWord(undefined, 2, T0)
    );
  });

  test("explicit now is honored deterministically: dueAt = now + interval days", () => {
    const next = legacyScheduler.review(seeded, "good", T0).card;
    expect(next.interval).toBe(Math.round(3 * 2.6)); // streak 2→3: round(interval × ease)
    expect(next.dueAt).toBe(T0 + next.interval * DAY);

    const failed = legacyScheduler.review(seeded, "again", T0).card;
    expect(failed).toEqual({ interval: 0, ease: 2.4, dueAt: T0, streak: 0 });
  });

  test("isDue delegates to srs.ts", () => {
    const entry: SrsEntry = { interval: 1, ease: 2.5, dueAt: T0, streak: 1 };
    expect(legacyScheduler.isDue(entry, T0 - 1)).toBe(false);
    expect(legacyScheduler.isDue(entry, T0)).toBe(true);
    expect(legacyScheduler.isDue(entry, T0 + 1)).toBe(true);
  });

  test("retrievability is a due-flag only (no memory model): due→0, not-due→1", () => {
    const entry: SrsEntry = { interval: 1, ease: 2.5, dueAt: T0, streak: 1 };
    expect(legacyScheduler.retrievability(entry, T0 - 1)).toBe(1);
    expect(legacyScheduler.retrievability(entry, T0 + 1)).toBe(0);
  });

  test("mutation log snapshots prevCard; rollback restores it exactly", () => {
    const res = legacyScheduler.review(seeded, "good", T0);
    expect(res.log.grade).toBe("good");
    expect(res.log.at).toBe(T0);
    expect(res.log.prevCard).toEqual(seeded);
    expect(res.log.prevCard).not.toBe(seeded); // defensive copy
    expect(res.log.fsrsLog).toBeUndefined(); // legacy has no FSRS log

    const restored = legacyScheduler.rollback(res.card, res.log);
    expect(restored).toEqual(seeded);
    expect(legacyScheduler.review(restored, "good", T0).card).toEqual(res.card);
  });
});

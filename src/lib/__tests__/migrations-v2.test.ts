import { afterEach, describe, expect, test } from "bun:test";

import { validateFsrsCard } from "../learning/fsrs-adapter";
import { FR_LEGACY_PREFIX } from "../learning/ids-fr";
import {
  __setMigrationFailureForTests,
  mergeWordStats,
  migrateProgress,
  PERSIST_VERSION,
  type PersistedProgress,
} from "../persistence/migrations";
import richFixture from "../__fixtures__/progress/v0-rich.json";
import multiFixture from "../__fixtures__/progress/multi-course.json";

const NOW = new Date(2026, 5, 15, 12, 0, 0);
const DAY = 86_400_000;

afterEach(() => __setMigrationFailureForTests(null));

function v1Of(fixtureState: unknown): PersistedProgress {
  return migrateProgress(fixtureState, 0, NOW, 1);
}

describe("v1 → v2 migration: French moves to FSRS", () => {
  test("PERSIST_VERSION is 3", () => {
    expect(PERSIST_VERSION).toBe(3);
  });

  test("rich user: srs → cards under stable ids, srsLegacy kept, due preserved", () => {
    const v1 = v1Of(richFixture.state);
    const out = migrateProgress(richFixture.state, 0, NOW);
    const fr = out.courses["fr-en"];

    // The old map is gone from its slot but kept verbatim as the rollback copy.
    expect(fr.srs).toBeUndefined();
    expect(fr.srsLegacy).toEqual(v1.courses["fr-en"].srs!);

    // Reviewed card: SM-2 state estimated, due date preserved verbatim.
    const homme = fr.cards!["fr:w:homme|recognize"];
    expect(homme).toBeDefined();
    expect(homme.due).toBe(1768200000000);
    expect(homme.stability).toBe(3); // r=0.9 identity: S = interval
    expect(homme.difficulty).toBeCloseTo(7.433767808, 8);
    expect(homme.scheduled_days).toBe(3);
    expect(homme.reps).toBe(2);
    expect(homme.lapses).toBe(1); // from wordStats["l'homme"].wrong
    expect(homme.state).toBe("review");
    expect(homme.last_review).toBe(1768200000000 - 3 * DAY);

    // Just-failed card (interval 0): plain new card, due preserved.
    const femme = fr.cards!["fr:w:femme|recognize"];
    expect(femme.state).toBe("new");
    expect(femme.stability).toBe(0);
    expect(femme.due).toBe(1767950000000);
    expect(femme.lapses).toBe(0); // no wordStats entry for la femme

    // Exactly the srs keys became cards — nothing dropped, nothing invented.
    expect(Object.keys(fr.cards!).sort()).toEqual(
      ["fr:w:homme|recognize", "fr:w:femme|recognize"].sort()
    );
    for (const card of Object.values(fr.cards!)) {
      expect(validateFsrsCard(card)).toEqual([]);
    }

    // wordStats re-keyed through the same ids; surface keys gone.
    expect(fr.wordStats["fr:w:homme"]).toEqual({
      correct: 4,
      wrong: 1,
      lastSeen: 1767950000000,
    });
    expect(fr.wordStats["l'homme"]).toBeUndefined();

    // New top-level review log, everything else intact.
    expect(out.reviewLog).toEqual([]);
    expect((out as Record<string, unknown>).hearts).toBe(3);
    expect(out.streak).toBe(5);
    expect(fr.xp).toBe(215);
    expect(fr.completedLessons["fr-en:u0-l0"]).toBe(true);
    expect(fr.mistakes).toHaveLength(1);
  });

  test("non-French courses are byte-identical through v2", () => {
    const v1 = v1Of(multiFixture.state);
    const out = migrateProgress(multiFixture.state, 0, NOW);
    for (const courseId of ["es-en", "ja-en"]) {
      expect(JSON.stringify(out.courses[courseId])).toBe(
        JSON.stringify(v1.courses[courseId])
      );
    }
    // French really did migrate in the same pass.
    expect(out.courses["fr-en"].cards).toBeDefined();
    expect(out.courses["fr-en"].srs).toBeUndefined();
  });

  test("unknown surfaces are preserved under fr:legacy: ids — zero silent loss", () => {
    const v1 = v1Of(richFixture.state);
    const crafted: PersistedProgress = JSON.parse(JSON.stringify(v1));
    crafted.courses["fr-en"].srs!["Je mange une pomme."] = {
      interval: 2,
      ease: 2.5,
      dueAt: 1768100000000,
      streak: 1,
    };
    crafted.courses["fr-en"].wordStats["Je mange une pomme."] = {
      correct: 1,
      wrong: 0,
      lastSeen: 1768000000000,
    };

    const out = migrateProgress(crafted, 1, NOW);
    const fr = out.courses["fr-en"];
    const legacyCardKeys = Object.keys(fr.cards!).filter((k) =>
      k.startsWith(FR_LEGACY_PREFIX)
    );
    expect(legacyCardKeys).toHaveLength(1);
    const card = fr.cards![legacyCardKeys[0]];
    expect(card.due).toBe(1768100000000);
    expect(card.stability).toBe(2);
    expect(validateFsrsCard(card)).toEqual([]);
    // wordStats orphan re-keyed alongside.
    const legacyStatKeys = Object.keys(fr.wordStats).filter((k) =>
      k.startsWith(FR_LEGACY_PREFIX)
    );
    expect(legacyStatKeys).toHaveLength(1);
    // srsLegacy still carries the original surface key.
    expect(fr.srsLegacy!["Je mange une pomme."]).toBeDefined();
  });

  test("a user without a French course only gains the review log and the assessment container", () => {
    const v1 = v1Of(multiFixture.state);
    const noFr: PersistedProgress = JSON.parse(JSON.stringify(v1));
    delete noFr.courses["fr-en"];

    const out = migrateProgress(noFr, 1, NOW);
    expect(out.reviewLog).toEqual([]);
    expect(out.assessment).toEqual({ checkpointAttempts: [], placementFloor: 0 });
    const { reviewLog: _r1, assessment: _a1, ...outRest } = out;
    const { reviewLog: _r2, assessment: _a2, ...inRest } = noFr;
    expect(JSON.stringify(outRest)).toBe(JSON.stringify(inRest));
  });

  test("running the chain from v2 changes nothing (idempotent endpoint)", () => {
    const v2 = migrateProgress(richFixture.state, 0, NOW);
    const again = migrateProgress(v2, 2, NOW);
    expect(again).toEqual(v2);
  });

  test("mergeWordStats: sum/sum/max", () => {
    expect(
      mergeWordStats(
        { correct: 3, wrong: 1, lastSeen: 100 },
        { correct: 2, wrong: 4, lastSeen: 250 }
      )
    ).toEqual({ correct: 5, wrong: 5, lastSeen: 250 });
  });

  test("failure seam: an injected v2 failure throws instead of half-migrating", () => {
    __setMigrationFailureForTests(2);
    expect(() => migrateProgress(richFixture.state, 0, NOW)).toThrow(
      "injected migration failure at v2"
    );
    // …and v0→v1 can be failed independently.
    __setMigrationFailureForTests(1);
    expect(() => migrateProgress(richFixture.state, 0, NOW)).toThrow(
      "injected migration failure at v1"
    );
    __setMigrationFailureForTests(null);
    expect(migrateProgress(richFixture.state, 0, NOW).courses["fr-en"]).toBeDefined();
  });
});

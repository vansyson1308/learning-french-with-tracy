/**
 * v2 → v3 migration (Phase 6 §44-48): the assessment container arrives,
 * NOTHING else changes — srsLegacy survives (§46), placementFloor starts
 * at 0 for every existing user (§89), corrupt containers are replaced,
 * the failure seam leaves stored data untouched, and backup imports
 * validate assessment structure fail-closed.
 */
import { describe, expect, test } from "bun:test";

import {
  capCheckpointAttempts,
  CHECKPOINT_ATTEMPTS_KEPT_PER_ID,
  emptyAssessmentState,
  type CheckpointAttempt,
} from "../assessment/types";
import {
  __setMigrationFailureForTests,
  migrateProgress,
  PERSIST_VERSION,
  type PersistedProgress,
} from "../persistence/migrations";
import { runInvariants, stageImport } from "../persistence/backup-core";

import richFixture from "../__fixtures__/progress/v0-rich.json";
import multiFixture from "../__fixtures__/progress/multi-course.json";

const NOW = new Date("2026-03-10T15:00:00");

function v2Of(fixtureState: unknown): PersistedProgress {
  return migrateProgress(fixtureState, 0, NOW, 2);
}

describe("v2 → v3: the assessment container", () => {
  test("a Phase-5 user gains exactly the empty container; everything else is byte-identical", () => {
    const v2 = v2Of(richFixture.state);
    const out = migrateProgress(JSON.parse(JSON.stringify(v2)), 2, NOW);
    expect(out.assessment).toEqual(emptyAssessmentState());
    expect(out.assessment!.placementFloor).toBe(0);
    const { assessment: _a, ...outRest } = out;
    expect(JSON.stringify(outRest)).toBe(JSON.stringify(v2));
  });

  test("srsLegacy SURVIVES v3 (§46 — rollback data needs its own migration decision)", () => {
    const v2 = v2Of(richFixture.state);
    expect(v2.courses["fr-en"].srsLegacy).toBeDefined();
    const out = migrateProgress(v2, 2, NOW);
    expect(out.courses["fr-en"].srsLegacy).toEqual(v2.courses["fr-en"].srsLegacy);
  });

  test("the full v0 → v3 chain works for every persona fixture", () => {
    for (const fixture of [richFixture.state, multiFixture.state, {}]) {
      const out = migrateProgress(JSON.parse(JSON.stringify(fixture)), 0, NOW);
      expect(out.assessment).toEqual(emptyAssessmentState());
      expect(Array.isArray(out.reviewLog)).toBe(true);
    }
  });

  test("a corrupt pre-existing assessment value is replaced by the empty container", () => {
    const v2 = v2Of(richFixture.state);
    for (const corrupt of [null, 42, "x", { checkpointAttempts: "nope" }, { checkpointAttempts: [], placementFloor: -1 }, { checkpointAttempts: [], placementFloor: Number.NaN }]) {
      const out = migrateProgress({ ...v2, assessment: corrupt }, 2, NOW);
      expect(out.assessment).toEqual(emptyAssessmentState());
    }
  });

  test("a structurally valid container passes through unchanged (re-imported v3 data)", () => {
    const v2 = v2Of(richFixture.state);
    const container = {
      checkpointAttempts: [],
      placementFloor: 7,
      placement: {
        placementVersion: 1,
        completedAt: NOW.getTime(),
        recommendedLessonId: "fr-en:ua-l0",
        recommendedFloorIndex: 20,
        objectiveEstimates: [],
        itemResults: [],
      },
    };
    const out = migrateProgress({ ...v2, assessment: container }, 2, NOW);
    expect(out.assessment).toEqual(container);
  });

  test("migrating from v3 is a no-op endpoint (idempotent)", () => {
    const v3 = migrateProgress(v2Of(richFixture.state), 2, NOW);
    const again = migrateProgress(JSON.parse(JSON.stringify(v3)), PERSIST_VERSION, NOW);
    expect(JSON.stringify(again)).toBe(JSON.stringify(v3));
  });

  test("an injected failure at v3 propagates without partial state", () => {
    __setMigrationFailureForTests(3);
    try {
      expect(() => migrateProgress(v2Of(richFixture.state), 2, NOW)).toThrow(
        "injected migration failure at v3"
      );
    } finally {
      __setMigrationFailureForTests(null);
    }
  });
});

describe("backup import validates assessment state fail-closed (§47-48)", () => {
  function envelope(stateMutator: (s: PersistedProgress) => void): string {
    const state = migrateProgress(JSON.parse(JSON.stringify(v2Of(richFixture.state))), 2, NOW);
    stateMutator(state);
    return JSON.stringify({
      format: "lingo-progress-backup",
      envelopeVersion: 1,
      persistVersion: 3,
      exportedAt: NOW.toISOString(),
      state,
    });
  }

  test("a valid v3 backup with assessment data stages cleanly", () => {
    const staged = stageImport(
      envelope((s) => {
        s.assessment = {
          checkpointAttempts: [
            {
              checkpointId: "fr.checkpoint.section-1",
              checkpointVersion: 1,
              startedAt: NOW.getTime() - 1000,
              completedAt: NOW.getTime(),
              itemResults: [{ itemId: "x", correct: true }],
              objectiveResults: [
                { objectiveId: "fr.obj.greetings.basic", result: "demonstrated", correct: 3, total: 3 },
              ],
              overallCorrectShare: 1,
            },
          ],
          placementFloor: 0,
        };
      }),
      NOW
    );
    expect(staged.ok).toBe(true);
  });

  test("corrupt checkpoint attempts are rejected", () => {
    const staged = stageImport(
      envelope((s) => {
        s.assessment = {
          checkpointAttempts: [{ checkpointId: 42 } as never],
          placementFloor: 0,
        };
      }),
      NOW
    );
    expect(staged.ok).toBe(false);
  });

  test("form-stamped attempts import cleanly; malformed form fields fail closed (P9 §38)", () => {
    const attempt = {
      checkpointId: "fr.checkpoint.section-1",
      checkpointVersion: 1,
      formId: "a",
      formVersion: 2,
      startedAt: 1000,
      completedAt: 2000,
      itemResults: [],
      objectiveResults: [],
      overallCorrectShare: 0,
    };
    const ok = stageImport(
      envelope((s) => {
        s.assessment = { checkpointAttempts: [attempt as never], placementFloor: 0 };
      }),
      NOW
    );
    expect(ok.ok).toBe(true);
    for (const bad of [{ formId: 7 }, { formVersion: 0 }, { formVersion: "x" }]) {
      const staged = stageImport(
        envelope((s) => {
          s.assessment = {
            checkpointAttempts: [{ ...attempt, ...bad } as never],
            placementFloor: 0,
          };
        }),
        NOW
      );
      expect({ bad, ok: staged.ok }).toEqual({ bad, ok: false });
    }
  });

  test("a negative or non-numeric placement floor is rejected", () => {
    for (const bad of [-3, Number.NaN, "seven"]) {
      const staged = stageImport(
        envelope((s) => {
          s.assessment = { checkpointAttempts: [], placementFloor: bad as never };
        }),
        NOW
      );
      expect(staged.ok).toBe(false);
    }
  });

  test("a malformed placement result is rejected", () => {
    const staged = stageImport(
      envelope((s) => {
        s.assessment = {
          checkpointAttempts: [],
          placementFloor: 0,
          placement: { placementVersion: 0 } as never,
        };
      }),
      NOW
    );
    expect(staged.ok).toBe(false);
  });

  test("invariants accept a state without any assessment field (older backups)", () => {
    const state = v2Of(richFixture.state);
    expect(runInvariants(state, NOW)).toEqual([]);
  });
});

describe("checkpoint attempt retention (§164)", () => {
  const attempt = (id: string, n: number): CheckpointAttempt => ({
    checkpointId: id,
    checkpointVersion: 1,
    startedAt: n,
    completedAt: n + 1,
    itemResults: [],
    objectiveResults: [],
    overallCorrectShare: 0,
  });

  test("keeps the most recent attempts per checkpoint, never dropping the latest", () => {
    const attempts = [
      ...Array.from({ length: 9 }, (_, i) => attempt("a", i)),
      attempt("b", 100),
    ];
    const capped = capCheckpointAttempts(attempts);
    const aKept = capped.filter((x) => x.checkpointId === "a");
    expect(aKept.length).toBe(CHECKPOINT_ATTEMPTS_KEPT_PER_ID);
    expect(aKept[aKept.length - 1].startedAt).toBe(8);
    expect(capped.filter((x) => x.checkpointId === "b").length).toBe(1);
  });

  test("under the cap nothing is touched and order is preserved", () => {
    const attempts = [attempt("a", 1), attempt("b", 2), attempt("a", 3)];
    expect(capCheckpointAttempts(attempts)).toEqual(attempts);
  });
});

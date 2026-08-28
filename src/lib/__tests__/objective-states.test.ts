/**
 * Objective learner-state derivation (§37-43, §90-93): checkpoint evidence
 * beats placement beats lessons; "demonstrated" requires checkpoint
 * evidence; placement yields only "estimated"; thin checkpoint sampling
 * (insufficient_evidence) is not a verdict and never shows as "needs
 * practice" (§93).
 */
import { describe, expect, test } from "bun:test";

import { PACKS } from "../../content/packs/index";
import { deriveObjectiveStates, objectiveLessonMap } from "../assessment/states";
import type { CheckpointAttempt } from "../assessment/types";

const OID = "fr.obj.greetings.basic";
const OTHER = "fr.obj.numbers.0_100";

function attempt(
  results: { objectiveId: string; result: "demonstrated" | "needs_practice" | "insufficient_evidence" }[],
  completedAt: number
): CheckpointAttempt {
  return {
    checkpointId: "fr.checkpoint.section-1",
    checkpointVersion: 1,
    startedAt: completedAt - 1,
    completedAt,
    itemResults: [],
    objectiveResults: results.map((r) => ({ ...r, correct: 0, total: 0 })),
    overallCorrectShare: 0,
  };
}

const LESSONS = { [OID]: ["fr-en:u1-l0"], [OTHER]: ["fr-en:ud-l0"] };

function derive(input: {
  completedLessons?: Record<string, true>;
  checkpointAttempts?: CheckpointAttempt[];
  placement?: { objectiveEstimates: { objectiveId: string; estimate: "comfortable" | "gap" | "unknown" }[] };
}) {
  return deriveObjectiveStates({
    objectiveIds: [OID, OTHER],
    objectiveLessons: LESSONS,
    completedLessons: input.completedLessons ?? {},
    checkpointAttempts: input.checkpointAttempts ?? [],
    placement: input.placement
      ? {
          placementVersion: 1,
          completedAt: 1,
          recommendedLessonId: "fr-en:u0-l0",
          recommendedFloorIndex: 0,
          objectiveEstimates: input.placement.objectiveEstimates,
          itemResults: [],
        }
      : undefined,
  });
}

describe("state precedence (§43)", () => {
  test("fresh learner: everything not_started", () => {
    expect(derive({})).toEqual({ [OID]: "not_started", [OTHER]: "not_started" });
  });

  test("a completed mapped lesson makes it learning", () => {
    expect(derive({ completedLessons: { "fr-en:u1-l0": true } })[OID]).toBe("learning");
  });

  test("a comfortable placement estimate beats lesson progress — but is only estimated (§40)", () => {
    const states = derive({
      completedLessons: { "fr-en:u1-l0": true },
      placement: { objectiveEstimates: [{ objectiveId: OID, estimate: "comfortable" }] },
    });
    expect(states[OID]).toBe("estimated");
  });

  test("a placement gap or unknown never shows as estimated", () => {
    const states = derive({
      placement: {
        objectiveEstimates: [
          { objectiveId: OID, estimate: "gap" },
          { objectiveId: OTHER, estimate: "unknown" },
        ],
      },
    });
    expect(states[OID]).toBe("not_started");
    expect(states[OTHER]).toBe("not_started");
  });

  test("checkpoint evidence beats placement (§38)", () => {
    const states = derive({
      checkpointAttempts: [attempt([{ objectiveId: OID, result: "demonstrated" }], 100)],
      placement: { objectiveEstimates: [{ objectiveId: OID, estimate: "comfortable" }] },
    });
    expect(states[OID]).toBe("demonstrated");
  });

  test("needs_practice from a checkpoint beats a comfortable estimate", () => {
    const states = derive({
      checkpointAttempts: [attempt([{ objectiveId: OID, result: "needs_practice" }], 100)],
      placement: { objectiveEstimates: [{ objectiveId: OID, estimate: "comfortable" }] },
    });
    expect(states[OID]).toBe("needs_practice");
  });

  test("the LATEST real verdict wins, in both directions", () => {
    const demoThenNeeds = derive({
      checkpointAttempts: [
        attempt([{ objectiveId: OID, result: "demonstrated" }], 100),
        attempt([{ objectiveId: OID, result: "needs_practice" }], 200),
      ],
    });
    expect(demoThenNeeds[OID]).toBe("needs_practice");
    const needsThenDemo = derive({
      checkpointAttempts: [
        attempt([{ objectiveId: OID, result: "needs_practice" }], 100),
        attempt([{ objectiveId: OID, result: "demonstrated" }], 200),
      ],
    });
    expect(needsThenDemo[OID]).toBe("demonstrated");
  });

  test("insufficient_evidence is NOT a verdict — it falls through (§93)", () => {
    // Thin sampling alone: state comes from lessons, never "needs_practice".
    const thin = derive({
      completedLessons: { "fr-en:u1-l0": true },
      checkpointAttempts: [attempt([{ objectiveId: OID, result: "insufficient_evidence" }], 100)],
    });
    expect(thin[OID]).toBe("learning");
    // And a NEWER thin result never erases an older real verdict.
    const keepVerdict = derive({
      checkpointAttempts: [
        attempt([{ objectiveId: OID, result: "demonstrated" }], 100),
        attempt([{ objectiveId: OID, result: "insufficient_evidence" }], 200),
      ],
    });
    expect(keepVerdict[OID]).toBe("demonstrated");
  });
});

describe("objectiveLessonMap (real pack)", () => {
  test("maps every authored lesson objective; French lessons carry objectives", () => {
    const map = objectiveLessonMap(PACKS["fr-en"]);
    expect(map["fr.obj.greetings.basic"]).toContain("fr-en:u1-l0");
    expect(map["fr.obj.numbers.0_100"]).toContain("fr-en:ud-l0");
    // Every mapped lesson id resolves to a real fr-en lesson.
    const lessonIds = new Set(
      PACKS["fr-en"].sections.flatMap((s) =>
        s.units.flatMap((u) => u.lessons.map((l) => l.id))
      )
    );
    for (const ids of Object.values(map)) {
      for (const id of ids) expect(lessonIds.has(id)).toBe(true);
    }
  });

  test("non-French packs have no objectives — the map is empty (§153)", () => {
    expect(objectiveLessonMap(PACKS["es-en"])).toEqual({});
  });
});

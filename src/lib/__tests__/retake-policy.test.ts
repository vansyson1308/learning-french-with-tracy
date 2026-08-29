/**
 * Parallel forms + retake policy (P9 §38-§40).
 *
 * The policy, in one place: a checkpoint sitting administers ONE
 * deterministic form (retakes rotate through declared forms; a bank
 * without forms is its own single form); every attempt records
 * checkpointVersion + formId + formVersion; the learner's standing per
 * objective is the LATEST attempt with a real verdict — in both
 * directions — while insufficient_evidence never overwrites anything;
 * history is append-only (bounded per checkpoint), never rescored, and
 * old attempts import unchanged.
 */
import { describe, expect, test } from "bun:test";

import {
  buildCheckpointAttempt,
  selectCheckpointForm,
} from "../assessment/checkpoint";
import {
  capCheckpointAttempts,
  CHECKPOINT_ATTEMPTS_KEPT_PER_ID,
  type CheckpointAttempt,
} from "../assessment/types";
import { deriveObjectiveStates } from "../assessment/states";
import { buildCheckpointSessionDefinition } from "../session/sources";
import type { SelectExercise } from "../types";

const select = (id: string): SelectExercise => ({
  type: "select",
  id: `x-${id}`,
  mode: "targetToNative",
  prompt: "le chat",
  options: [{ text: "the cat" }, { text: "the dog" }, { text: "the bird" }, { text: "the horse" }],
  correct: 0,
});

const OBJ_A = "fr.obj.test.alpha";
const OBJ_B = "fr.obj.test.beta";

const bank = {
  id: "fr.checkpoint.test",
  checkpointVersion: 2,
  formVersion: 3,
  sectionId: "fr-en:section-x",
  title: "Test check",
  description: "Test.",
  items: ["i1", "i2", "i3", "i4", "i5", "i6"].map((id, index) => ({
    id,
    itemVersion: 1,
    exercise: select(id),
    objectiveTargets: [index < 3 ? OBJ_A : OBJ_B],
    essential: true,
  })),
  forms: [
    { formId: "a", itemIds: ["i1", "i2", "i4", "i5"] },
    { formId: "b", itemIds: ["i2", "i3", "i5", "i6"] },
  ],
  criteria: { minItemsPerObjective: 2, demonstratedShare: 0.66 },
};

describe("deterministic form selection (§38-§39)", () => {
  test("no declared forms → the whole bank as the single 'full' form", () => {
    const { forms: _omit, ...formless } = bank;
    expect(selectCheckpointForm(formless, 0)).toEqual({
      formId: "full",
      itemIds: ["i1", "i2", "i3", "i4", "i5", "i6"],
    });
    expect(selectCheckpointForm(formless, 7).formId).toBe("full");
  });

  test("retakes rotate through forms by prior attempt count — pure and stable", () => {
    expect(selectCheckpointForm(bank, 0).formId).toBe("a");
    expect(selectCheckpointForm(bank, 1).formId).toBe("b");
    expect(selectCheckpointForm(bank, 2).formId).toBe("a");
    expect(selectCheckpointForm(bank, 0)).toEqual(selectCheckpointForm(bank, 0));
  });

  test("the session administers ONLY the selected form's items and stamps the plan", () => {
    const def = buildCheckpointSessionDefinition(bank, 1);
    expect(def.steps.map((s) => s.stepId)).toEqual(["i2", "i3", "i5", "i6"]);
    expect(def.assessment).toMatchObject({
      checkpointId: "fr.checkpoint.test",
      checkpointVersion: 2,
      formId: "b",
      formVersion: 3,
    });
    expect(Object.keys(def.assessment!.itemObjectives).sort()).toEqual([
      "i2",
      "i3",
      "i5",
      "i6",
    ]);
  });

  test("every form still clears the per-objective criteria floor", () => {
    for (const count of [0, 1]) {
      const def = buildCheckpointSessionDefinition(bank, count);
      const perObjective = new Map<string, number>();
      for (const objectives of Object.values(def.assessment!.itemObjectives)) {
        for (const oid of objectives) {
          perObjective.set(oid, (perObjective.get(oid) ?? 0) + 1);
        }
      }
      expect(perObjective.get(OBJ_A)).toBeGreaterThanOrEqual(2);
      expect(perObjective.get(OBJ_B)).toBeGreaterThanOrEqual(2);
    }
  });

  test("the attempt records checkpointVersion, formId and formVersion (§38)", () => {
    const def = buildCheckpointSessionDefinition(bank, 0);
    const attempt = buildCheckpointAttempt({
      plan: def.assessment!,
      firstResults: { i1: true, i2: true, i4: true, i5: false },
      startedAt: 1000,
      completedAt: 2000,
    });
    expect(attempt.checkpointVersion).toBe(2);
    expect(attempt.formId).toBe("a");
    expect(attempt.formVersion).toBe(3);
  });
});

describe("retake policy: latest valid attempt wins, history never rescored (§40)", () => {
  const attemptAt = (
    completedAt: number,
    result: "demonstrated" | "needs_practice" | "insufficient_evidence",
    formId?: string
  ): CheckpointAttempt => ({
    checkpointId: "fr.checkpoint.test",
    checkpointVersion: 2,
    formId,
    formVersion: formId === undefined ? undefined : 3,
    startedAt: completedAt - 60_000,
    completedAt,
    itemResults: [],
    objectiveResults: [{ objectiveId: OBJ_A, result, correct: 0, total: 0 }],
    overallCorrectShare: 0,
  });

  const derive = (attempts: CheckpointAttempt[]) =>
    deriveObjectiveStates({
      objectiveIds: [OBJ_A],
      objectiveLessons: { [OBJ_A]: ["l1"] },
      completedLessons: { l1: true },
      checkpointAttempts: attempts,
    })[OBJ_A];

  test("a later real verdict overwrites an earlier one — in BOTH directions", () => {
    expect(derive([attemptAt(1, "demonstrated"), attemptAt(2, "needs_practice", "b")])).toBe(
      "needs_practice"
    );
    expect(derive([attemptAt(1, "needs_practice"), attemptAt(2, "demonstrated", "b")])).toBe(
      "demonstrated"
    );
  });

  test("insufficient_evidence is not a verdict and never overwrites one (§93)", () => {
    expect(
      derive([attemptAt(1, "demonstrated"), attemptAt(2, "insufficient_evidence", "b")])
    ).toBe("demonstrated");
    // Nor does it count against a learner with no verdict at all.
    expect(derive([attemptAt(1, "insufficient_evidence")])).toBe("learning");
  });

  test("attempts recorded before forms existed (no formId) still count fully", () => {
    expect(derive([attemptAt(1, "demonstrated")])).toBe("demonstrated");
  });

  test("history is append-only and bounded per checkpoint — oldest attempts drop, none mutate", () => {
    const attempts = Array.from({ length: CHECKPOINT_ATTEMPTS_KEPT_PER_ID + 3 }, (_, i) =>
      attemptAt(i + 1, "demonstrated", i % 2 === 0 ? "a" : "b")
    );
    const frozen = JSON.parse(JSON.stringify(attempts)) as CheckpointAttempt[];
    const capped = capCheckpointAttempts(attempts);
    expect(capped.length).toBe(CHECKPOINT_ATTEMPTS_KEPT_PER_ID);
    expect(capped[0].completedAt).toBe(4); // oldest three dropped
    expect(capped[capped.length - 1].completedAt).toBe(CHECKPOINT_ATTEMPTS_KEPT_PER_ID + 3);
    // Never rescored: surviving attempts are byte-identical to what was recorded.
    expect(JSON.parse(JSON.stringify(attempts))).toEqual(frozen);
  });
});

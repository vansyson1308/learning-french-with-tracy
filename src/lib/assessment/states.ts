/**
 * Objective learner-state derivation (§37-43): pure — content + learner
 * state in, one honest state per objective out.
 *
 * Precedence: checkpoint evidence (the latest attempt with a real verdict)
 * beats placement estimates beats lesson progress. "demonstrated" REQUIRES
 * checkpoint evidence (§38); placement can only ever yield "estimated"
 * (§40); "insufficient_evidence" is thin sampling, not a verdict — it falls
 * through instead of counting for or against the learner (§93).
 */

import type { Pack } from "../types";
import type { CheckpointAttempt, PlacementResult } from "./types";

export type ObjectiveLearnerState =
  | "not_started"
  | "learning"
  | "needs_practice"
  | "demonstrated"
  | "estimated";

/** objectiveId → lesson ids that teach it, from the compiled pack. */
export function objectiveLessonMap(pack: Pack): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const section of pack.sections)
    for (const unit of section.units)
      for (const lesson of unit.lessons)
        for (const oid of lesson.objectives ?? []) {
          (map[oid] ??= []).push(lesson.id);
        }
  return map;
}

export function deriveObjectiveStates(input: {
  objectiveIds: readonly string[];
  objectiveLessons: Record<string, string[]>;
  completedLessons: Record<string, true>;
  checkpointAttempts: CheckpointAttempt[];
  placement?: PlacementResult;
}): Record<string, ObjectiveLearnerState> {
  // Latest real verdict per objective across all recorded attempts —
  // insufficient_evidence never overwrites anything (§93).
  const verdicts = new Map<string, "demonstrated" | "needs_practice">();
  const attempts = [...input.checkpointAttempts].sort(
    (a, b) => a.completedAt - b.completedAt
  );
  for (const attempt of attempts) {
    for (const result of attempt.objectiveResults) {
      if (result.result === "demonstrated" || result.result === "needs_practice") {
        verdicts.set(result.objectiveId, result.result);
      }
    }
  }

  const comfortable = new Set(
    (input.placement?.objectiveEstimates ?? [])
      .filter((e) => e.estimate === "comfortable")
      .map((e) => e.objectiveId)
  );

  const states: Record<string, ObjectiveLearnerState> = {};
  for (const oid of input.objectiveIds) {
    const verdict = verdicts.get(oid);
    if (verdict) {
      states[oid] = verdict;
      continue;
    }
    if (comfortable.has(oid)) {
      states[oid] = "estimated";
      continue;
    }
    const lessons = input.objectiveLessons[oid] ?? [];
    states[oid] = lessons.some((id) => input.completedLessons[id])
      ? "learning"
      : "not_started";
  }
  return states;
}

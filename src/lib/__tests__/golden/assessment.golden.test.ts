/**
 * Assessment goldens (P1a): objective states + the A1 estimate for each
 * persona, checkpoint scoring of a scripted sitting (and the estimate that
 * follows it), and the placement engine's verdict for a scripted answer
 * path. Fixed instants only — no local-day dependence.
 */
import { describe, test } from "bun:test";

import { buildCheckpointAttempt } from "../../assessment/checkpoint";
import {
  CHECKPOINT_ORDER,
  attainmentPolicy,
  checkpointFor,
  courseClaimableAt,
  OBJECTIVE_ORDER,
  placementContent,
  placementEnginePlan,
} from "../../assessment/content";
import { deriveA1Estimate } from "../../assessment/estimate";
import {
  advanceToNextStage,
  answersFromSession,
  buildPlacementResult,
  placementEstimates,
  recommendPlacement,
} from "../../assessment/placement";
import { deriveObjectiveStates, objectiveLessonMap } from "../../assessment/states";
import type { CheckpointAttempt } from "../../assessment/types";
import { emptySessionState, sessionReducer, type SessionMachineState } from "../../session/reducer";
import { buildCheckpointSessionDefinition, buildPlacementStageSessionDefinition } from "../../session/sources";
import type { ExerciseStep } from "../../session/types";
import { MINUTE, NOW_MS, PERSONA_NAMES, correctAnswerFor, expectGolden, frPack, lessonRef, migratedPersona, wrongAnswerFor } from "./helpers";

const OBJECTIVE_LESSONS = objectiveLessonMap(frPack);

function estimateFor(completedLessons: Record<string, true>, attempts: CheckpointAttempt[], speechAvailable: boolean | null) {
  const states = deriveObjectiveStates({
    objectiveIds: OBJECTIVE_ORDER,
    objectiveLessons: OBJECTIVE_LESSONS,
    completedLessons,
    checkpointAttempts: attempts,
  });
  return {
    states,
    estimate: deriveA1Estimate({
      policy: attainmentPolicy(),
      states,
      courseClaimable: courseClaimableAt("A1"),
      speechAvailable,
    }),
  };
}

/** Answer every exercise step once (no retries in scored sessions). */
function sitScored(
  steps: ExerciseStep[],
  verdict: (i: number) => "correct" | "wrong" | "skip"
): SessionMachineState {
  let s = sessionReducer(emptySessionState(), { type: "start", sessionId: "golden", steps, retryPolicy: "none" });
  steps.forEach((step, i) => {
    const v = verdict(i);
    const ex = step.exercise;
    if (v === "skip") {
      s = sessionReducer(s, { type: "skip" });
      return;
    }
    if (ex.type === "match") {
      s = sessionReducer(s, { type: "matchComplete", wrongAttempts: v === "wrong" ? 1 : 0 });
      return;
    }
    s = sessionReducer(s, { type: "answer", value: v === "wrong" ? wrongAnswerFor(ex) : correctAnswerFor(ex) });
    s = sessionReducer(s, { type: "check" });
    s = sessionReducer(s, { type: "continue" });
  });
  return s;
}

describe("assessment goldens (fr-en)", () => {
  for (const persona of PERSONA_NAMES) {
    test(`objective states + A1 estimate: ${persona}`, () => {
      const state = migratedPersona(persona);
      const completed = state.courses["fr-en"]?.completedLessons ?? {};
      expectGolden(`assessment/estimate.${persona}`, {
        speechKnownAvailable: estimateFor(completed, state.assessment?.checkpointAttempts ?? [], true),
        speechUnknown: estimateFor(completed, state.assessment?.checkpointAttempts ?? [], null),
      });
    });
  }

  for (const checkpointId of [CHECKPOINT_ORDER[0], CHECKPOINT_ORDER[2]]) {
    test(`checkpoint scoring + estimate after it: ${checkpointId}`, () => {
      const cp = checkpointFor(checkpointId)!;
      const def = buildCheckpointSessionDefinition(cp, 0);
      const steps = def.steps.filter((s): s is ExerciseStep => s.type === "exercise");
      // Two-thirds right, every third item wrong: enough signal for both verdicts.
      const sitting = sitScored(steps, (i) => (i % 3 === 2 ? "wrong" : "correct"));
      const attempt = buildCheckpointAttempt({
        plan: def.assessment!,
        firstResults: sitting.firstResults,
        startedAt: NOW_MS,
        completedAt: NOW_MS + 9 * MINUTE,
      });
      const completed = Object.fromEntries(
        (OBJECTIVE_LESSONS[Object.keys(def.assessment!.itemObjectives)[0]] ?? []).map((id) => [id, true as const])
      );
      expectGolden(`assessment/checkpoint.${checkpointId}`, {
        firstResults: sitting.firstResults,
        attempt,
        after: estimateFor(completed, [attempt], true),
      });
    });
  }

  test("placement: scripted stage-1 run (first cluster strong, second weak, one audio skip)", () => {
    const plan = placementEnginePlan();
    const content = placementContent();
    const stage = content.stages[0];
    const def = buildPlacementStageSessionDefinition(stage, "golden-run");
    const steps = def.steps.filter((s): s is ExerciseStep => s.type === "exercise");
    const firstClusterIds = new Set(stage.clusters[0].items.map((item) => item.id));
    const sitting = sitScored(steps, (i) => {
      const id = steps[i].stepId;
      if (i === steps.length - 1) return "skip";
      return firstClusterIds.has(id) ? "correct" : i % 2 === 0 ? "wrong" : "correct";
    });
    const audioStepIds = new Set(
      steps
        .filter((s) => s.exercise.type === "listeningComprehension" || s.exercise.type === "dictation")
        .map((s) => s.stepId)
    );
    const answers = answersFromSession({
      stepIds: steps.map((s) => s.stepId),
      firstResults: sitting.firstResults,
      skipped: sitting.skipped,
      audioStepIds,
    });
    const advance = advanceToNextStage(plan, 0, answers, plan.stages.map(() => false), false);
    const recommendation = recommendPlacement(plan, answers);
    const ref = lessonRef(recommendation.recommendedLessonId);
    const result = buildPlacementResult({
      plan,
      answers,
      recommendedFloorIndex: ref?.globalIndex ?? 0,
      completedAt: NOW_MS + 4 * MINUTE,
    });
    expectGolden("assessment/placement.stage-1", {
      answers,
      advance,
      recommendation,
      estimates: placementEstimates(recommendation.clusterOutcomes),
      result,
    });
  });
});

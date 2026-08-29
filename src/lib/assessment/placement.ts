/**
 * Placement evaluation (§73-80): a pure, deterministic rule engine. Same
 * answers + same placement version → same recommendation, always (§76).
 * No IRT, no randomness, no LLM (§122, §182). Placement answers where the
 * learner should start in THIS course — never an official CEFR level (§68).
 */

import type {
  AssessmentItemResult,
  PlacementObjectiveEstimate,
  PlacementResult,
} from "./types";

export type PlacementClusterContent = {
  id: string;
  objectiveId: string;
  anchorLessonId: string;
  itemIds: string[];
};

export type PlacementStageContent = {
  id: string;
  title: string;
  clusters: PlacementClusterContent[];
};

export type PlacementPlanContent = {
  placementVersion: number;
  maxItems: number;
  allComfortableLessonId: string;
  stages: PlacementStageContent[];
};

/**
 * Per-item outcome: true/false from grading, null = explicit "I don't
 * know" (§117), "audio_unavailable" = a skipped AUDIO-dependent item
 * (P7 §110), "speech_unavailable" = a speaking item the device could not
 * administer (P8 §22) — device problems, never evidence about the learner.
 */
export type PlacementAnswer = boolean | null | "audio_unavailable" | "speech_unavailable";
export type PlacementAnswers = Record<string, PlacementAnswer>;

/** Device-state answers that estimate NOTHING about the learner. */
export function isUnavailableAnswer(answer: PlacementAnswer | undefined): boolean {
  return answer === "audio_unavailable" || answer === "speech_unavailable";
}

/**
 * Assemble engine answers from a finished scored session: first-attempt
 * verdicts, with an explicit "I don't know" recorded as null (§115-117).
 * A skip on an audio-dependent step (listening comprehension, dictation)
 * is the audio-unavailable escape (P7 §69-70, §110); a skip on a speaking
 * step is the speech-unavailable escape (P8 §22-23) — neither is a
 * declared gap. Steps never reached (abandoned session) simply stay absent.
 */
export function answersFromSession(input: {
  stepIds: string[];
  firstResults: Record<string, boolean>;
  skipped: Record<string, boolean>;
  /** Step ids whose exercise needs audio (listening/dictation). */
  audioStepIds?: ReadonlySet<string>;
  /** Step ids whose exercise needs speech capture (speak types). */
  speechStepIds?: ReadonlySet<string>;
}): PlacementAnswers {
  const out: PlacementAnswers = {};
  for (const id of input.stepIds) {
    if (input.skipped[id]) {
      out[id] = input.audioStepIds?.has(id)
        ? "audio_unavailable"
        : input.speechStepIds?.has(id)
          ? "speech_unavailable"
          : null;
    } else if (id in input.firstResults) out[id] = input.firstResults[id];
  }
  return out;
}

export type ClusterOutcome = {
  clusterId: string;
  objectiveId: string;
  anchorLessonId: string;
  /**
   * comfortable = every estimating item correct; gap = any wrong/idk;
   * unknown = unanswered; not_estimated = the only evidence was
   * audio/speech-unavailable skips (P7 §110, P8 §22) — a device state,
   * not a learner state, so it can never anchor the floor or count as weak.
   */
  outcome: "comfortable" | "gap" | "unknown" | "not_estimated";
};

export function evaluateClusters(
  stage: PlacementStageContent,
  answers: PlacementAnswers
): ClusterOutcome[] {
  return stage.clusters.map((cluster) => {
    const base = {
      clusterId: cluster.id,
      objectiveId: cluster.objectiveId,
      anchorLessonId: cluster.anchorLessonId,
    };
    const seen = cluster.itemIds.filter((id) => answers[id] !== undefined);
    // Audio-unavailable answers estimate nothing (P7 §110).
    const estimating = seen.filter((id) => !isUnavailableAnswer(answers[id]));
    if (seen.length === 0) return { ...base, outcome: "unknown" };
    if (estimating.length === 0) return { ...base, outcome: "not_estimated" };
    // "I don't know" counts once, as gap evidence — never punished twice (§117).
    const allCorrect = estimating.every((id) => answers[id] === true);
    return { ...base, outcome: allCorrect ? "comfortable" : "gap" };
  });
}

/** A later stage runs only when every earlier cluster is comfortable (§73). */
export function shouldRunStage(
  plan: PlacementPlanContent,
  stageIndex: number,
  answers: PlacementAnswers
): boolean {
  if (stageIndex === 0) return true;
  for (let i = 0; i < stageIndex; i++) {
    const outcomes = evaluateClusters(plan.stages[i], answers);
    if (!outcomes.every((o) => o.outcome === "comfortable")) return false;
  }
  return true;
}

export type PlacementRecommendation = {
  recommendedLessonId: string;
  clusterOutcomes: ClusterOutcome[];
  /** True when every ESTIMATED cluster came back comfortable. */
  allComfortable: boolean;
  /** True when any probed cluster could not be estimated (audio skips). */
  hasNotEstimated: boolean;
};

/**
 * Earliest weak frontier (§75): walk clusters in curricular order across
 * the stages that actually ran; the first gap/unknown cluster's anchor is
 * the recommendation. A not_estimated cluster is transparent — a learner
 * without working audio is never anchored down for it (P7 §110); the floor
 * only ever OPENS lessons, so the un-estimated units stay fully available.
 * All estimated comfortable → the authored all-comfortable anchor.
 */
export function recommendPlacement(
  plan: PlacementPlanContent,
  answers: PlacementAnswers
): PlacementRecommendation {
  const outcomes: ClusterOutcome[] = [];
  for (let i = 0; i < plan.stages.length; i++) {
    if (!shouldRunStage(plan, i, answers)) break;
    outcomes.push(...evaluateClusters(plan.stages[i], answers));
  }
  const firstWeak = outcomes.find(
    (o) => o.outcome !== "comfortable" && o.outcome !== "not_estimated"
  );
  return {
    recommendedLessonId: firstWeak?.anchorLessonId ?? plan.allComfortableLessonId,
    clusterOutcomes: outcomes,
    allComfortable: firstWeak === undefined,
    hasNotEstimated: outcomes.some((o) => o.outcome === "not_estimated"),
  };
}

/** Placement evidence is an ESTIMATE — never "demonstrated" (§80). */
export function placementEstimates(
  outcomes: ClusterOutcome[]
): PlacementObjectiveEstimate[] {
  return outcomes.map((o) => ({
    objectiveId: o.objectiveId,
    estimate: o.outcome === "unknown" ? "unknown" : o.outcome,
  }));
}

export function buildPlacementResult(input: {
  plan: PlacementPlanContent;
  answers: PlacementAnswers;
  recommendedFloorIndex: number;
  completedAt: number;
}): PlacementResult {
  const recommendation = recommendPlacement(input.plan, input.answers);
  // Stored item results keep the Phase-6 shape: an audio-unavailable skip
  // persists as null (no verdict), exactly like "I don't know" — the
  // distinction lives in the per-objective "not_estimated" estimates.
  const itemResults: AssessmentItemResult[] = Object.entries(input.answers).map(
    ([itemId, answer]) => ({ itemId, correct: isUnavailableAnswer(answer) ? null : (answer as boolean | null) })
  );
  return {
    placementVersion: input.plan.placementVersion,
    completedAt: input.completedAt,
    recommendedLessonId: recommendation.recommendedLessonId,
    recommendedFloorIndex: input.recommendedFloorIndex,
    objectiveEstimates: placementEstimates(recommendation.clusterOutcomes),
    itemResults,
  };
}

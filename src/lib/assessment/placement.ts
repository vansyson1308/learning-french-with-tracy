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

/** Per-item outcome: true/false from grading, null = explicit "I don't know" (§117). */
export type PlacementAnswers = Record<string, boolean | null>;

/**
 * Assemble engine answers from a finished scored session: first-attempt
 * verdicts, with an explicit "I don't know" recorded as null (§115-117).
 * Steps never reached (abandoned session) simply stay absent.
 */
export function answersFromSession(input: {
  stepIds: string[];
  firstResults: Record<string, boolean>;
  skipped: Record<string, boolean>;
}): PlacementAnswers {
  const out: PlacementAnswers = {};
  for (const id of input.stepIds) {
    if (input.skipped[id]) out[id] = null;
    else if (id in input.firstResults) out[id] = input.firstResults[id];
  }
  return out;
}

export type ClusterOutcome = {
  clusterId: string;
  objectiveId: string;
  anchorLessonId: string;
  /** comfortable = every item correct; gap = any wrong/idk; unknown = unanswered. */
  outcome: "comfortable" | "gap" | "unknown";
};

export function evaluateClusters(
  stage: PlacementStageContent,
  answers: PlacementAnswers
): ClusterOutcome[] {
  return stage.clusters.map((cluster) => {
    const answered = cluster.itemIds.filter((id) => answers[id] !== undefined);
    if (answered.length === 0) {
      return {
        clusterId: cluster.id,
        objectiveId: cluster.objectiveId,
        anchorLessonId: cluster.anchorLessonId,
        outcome: "unknown",
      };
    }
    // "I don't know" counts once, as gap evidence — never punished twice (§117).
    const allCorrect = answered.every((id) => answers[id] === true);
    return {
      clusterId: cluster.id,
      objectiveId: cluster.objectiveId,
      anchorLessonId: cluster.anchorLessonId,
      outcome: allCorrect ? "comfortable" : "gap",
    };
  });
}

/** Stage 2 runs only when every stage-1 cluster is comfortable (§73). */
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
  /** True when every probed cluster came back comfortable. */
  allComfortable: boolean;
};

/**
 * Earliest weak frontier (§75): walk clusters in curricular order across
 * the stages that actually ran; the first gap/unknown cluster's anchor is
 * the recommendation. All comfortable → the authored all-comfortable
 * anchor (the final unit — the course has nothing beyond it to place into).
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
  const firstWeak = outcomes.find((o) => o.outcome !== "comfortable");
  return {
    recommendedLessonId: firstWeak?.anchorLessonId ?? plan.allComfortableLessonId,
    clusterOutcomes: outcomes,
    allComfortable: firstWeak === undefined,
  };
}

/** Placement evidence is an ESTIMATE — never "demonstrated" (§80). */
export function placementEstimates(
  outcomes: ClusterOutcome[]
): PlacementObjectiveEstimate[] {
  return outcomes.map((o) => ({
    objectiveId: o.objectiveId,
    estimate:
      o.outcome === "comfortable" ? "comfortable" : o.outcome === "gap" ? "gap" : "unknown",
  }));
}

export function buildPlacementResult(input: {
  plan: PlacementPlanContent;
  answers: PlacementAnswers;
  recommendedFloorIndex: number;
  completedAt: number;
}): PlacementResult {
  const recommendation = recommendPlacement(input.plan, input.answers);
  const itemResults: AssessmentItemResult[] = Object.entries(input.answers).map(
    ([itemId, correct]) => ({ itemId, correct })
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

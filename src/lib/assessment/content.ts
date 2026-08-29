/**
 * Runtime access to the compiled Phase-6 assessment artifacts (checkpoints
 * + objective metadata). Content only — learner state lives in the store.
 */

import checkpointsArtifact from "../../content/assessment/fr-checkpoints.json";
import claimArtifact from "../../content/assessment/fr-claim.json";
import objectivesArtifact from "../../content/assessment/fr-objectives.json";
import placementArtifact from "../../content/assessment/fr-placement.json";
import type { Exercise } from "../types";
import type { PlacementPlanContent } from "./placement";
import type { CheckpointObjectiveResult } from "./types";

export type CompiledCheckpointItem = {
  id: string;
  itemVersion: number;
  exercise: Exercise;
  objectiveTargets: string[];
  essential: boolean;
};

export type CompiledCheckpoint = {
  id: string;
  checkpointVersion: number;
  /** Form-structure version, recorded on every attempt (P9 §38). */
  formVersion: number;
  sectionId: string;
  title: string;
  description: string;
  items: CompiledCheckpointItem[];
  /** ≥2 parallel forms when declared; absent = the bank is one form. */
  forms?: { formId: string; itemIds: string[] }[];
  criteria: { minItemsPerObjective: number; demonstratedShare: number };
};

export type CompiledObjective = {
  id: string;
  title: string;
  canDo: string;
  category:
    | "lexical"
    | "grammar"
    | "spoken_reception"
    | "written_reception"
    | "spoken_production"
    | "written_production"
    | "interaction"
    | "phonology"
    | "strategy";
  essential: boolean;
  prerequisites: string[];
  cefrAlignments: {
    level: string;
    scaleName: string;
    relation: "direct" | "supports";
    sourceRef: string;
  }[];
};

const checkpoints = checkpointsArtifact as unknown as {
  order: string[];
  byId: Record<string, CompiledCheckpoint>;
};

const objectives = objectivesArtifact as unknown as {
  order: string[];
  byId: Record<string, CompiledObjective>;
};

export const CHECKPOINT_ORDER: readonly string[] = checkpoints.order;

export function checkpointFor(id: string): CompiledCheckpoint | undefined {
  return checkpoints.byId[id];
}

/** The checkpoint attached to a PATH section, if any. */
export function checkpointForSection(sectionId: string): CompiledCheckpoint | undefined {
  return checkpoints.order
    .map((id) => checkpoints.byId[id])
    .find((cp) => cp.sectionId === sectionId);
}

export type CompiledPlacementItem = {
  id: string;
  itemVersion: number;
  exercise: Exercise;
  objectiveTargets: string[];
};

export type CompiledPlacementCluster = {
  id: string;
  objectiveId: string;
  anchorLessonId: string;
  items: CompiledPlacementItem[];
};

export type CompiledPlacementStage = {
  id: string;
  title: string;
  clusters: CompiledPlacementCluster[];
};

export type CompiledPlacement = {
  placementVersion: number;
  maxItems: number;
  allComfortableLessonId: string;
  stages: CompiledPlacementStage[];
};

const placement = placementArtifact as unknown as CompiledPlacement;

/** The full compiled placement plan (stages with exercise payloads). */
export function placementContent(): CompiledPlacement {
  return placement;
}

/** The same plan reduced to the pure engine's shape (item ids only). */
export function placementEnginePlan(): PlacementPlanContent {
  return {
    placementVersion: placement.placementVersion,
    maxItems: placement.maxItems,
    allComfortableLessonId: placement.allComfortableLessonId,
    stages: placement.stages.map((stage) => ({
      id: stage.id,
      title: stage.title,
      clusters: stage.clusters.map((cluster) => ({
        id: cluster.id,
        objectiveId: cluster.objectiveId,
        anchorLessonId: cluster.anchorLessonId,
        itemIds: cluster.items.map((item) => item.id),
      })),
    })),
  };
}

export const OBJECTIVE_ORDER: readonly string[] = objectives.order;

export function objectiveFor(id: string): CompiledObjective | undefined {
  return objectives.byId[id];
}

export function allObjectives(): CompiledObjective[] {
  return objectives.order.map((id) => objectives.byId[id]);
}

/** COURSE-claimability artifact (P9 §45-§47): a compile-time fact of the
 *  content — whether the course's reserved assessment system covers each
 *  evaluated level — plus the non-certification wording, verbatim. */
export type CompiledCourseClaim = {
  claimWording: string;
  levels: { level: string; courseClaimable: boolean; unassessedDomains: string[] }[];
};

const claim = claimArtifact as unknown as CompiledCourseClaim;

export function courseClaim(): CompiledCourseClaim {
  return claim;
}

export function courseClaimableAt(level: string): boolean {
  return claim.levels.some((l) => l.level === level && l.courseClaimable);
}

/** Split a scored attempt's objective results for the results screen (§112). */
export function splitObjectiveResults(results: CheckpointObjectiveResult[]): {
  strong: CheckpointObjectiveResult[];
  review: CheckpointObjectiveResult[];
  thin: CheckpointObjectiveResult[];
} {
  return {
    strong: results.filter((r) => r.result === "demonstrated"),
    review: results.filter((r) => r.result === "needs_practice"),
    thin: results.filter((r) => r.result === "insufficient_evidence"),
  };
}

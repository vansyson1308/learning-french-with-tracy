/**
 * Compiled assessment content, per course (P1b). Every accessor takes the
 * course id and resolves the course's artifacts through the registry —
 * objectives, checkpoints, placement, attainment policy and the course
 * claim. A course without assessment content gets empty orders and
 * undefined lookups, never an error.
 */
import { artifactsFor, memoByCourse } from "../content-registry";
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

/** COURSE-claimability artifact (P9 §45-§47): a compile-time fact of the
 *  content — whether the course's reserved assessment system covers each
 *  evaluated level — plus the non-certification wording, verbatim. */
export type CompiledCourseClaim = {
  claimWording: string;
  levels: { level: string; courseClaimable: boolean; unassessedDomains: string[] }[];
};

/** LEARNER-attainment policy artifact (Phase 10 Gate 2): per domain, the
 *  authored objectives a learner must demonstrate. The runtime never
 *  derives this denominator from counts — it reads the reviewed content. */
export type CompiledAttainmentPolicy = {
  level: string;
  domains: { domain: string; requiredObjectiveIds: string[] }[];
};

type Ordered<T> = { order: string[]; byId: Record<string, T> };

const EMPTY_ORDERED = { order: [] as string[], byId: {} as Record<string, never> };
const EMPTY_PLACEMENT: CompiledPlacement = { placementVersion: 0, maxItems: 0, allComfortableLessonId: "", stages: [] };
const EMPTY_CLAIM: CompiledCourseClaim = { claimWording: "", levels: [] };
const EMPTY_ATTAINMENT: CompiledAttainmentPolicy = { level: "", domains: [] };

const checkpointsOf = memoByCourse<Ordered<CompiledCheckpoint>>(
  (courseId) => (artifactsFor(courseId).checkpoints as Ordered<CompiledCheckpoint> | undefined) ?? EMPTY_ORDERED
);
const objectivesOf = memoByCourse<Ordered<CompiledObjective>>(
  (courseId) => (artifactsFor(courseId).objectives as Ordered<CompiledObjective> | undefined) ?? EMPTY_ORDERED
);
const placementOf = memoByCourse<CompiledPlacement>(
  (courseId) => (artifactsFor(courseId).placement as CompiledPlacement | undefined) ?? EMPTY_PLACEMENT
);
const claimOf = memoByCourse<CompiledCourseClaim>(
  (courseId) => (artifactsFor(courseId).claim as CompiledCourseClaim | undefined) ?? EMPTY_CLAIM
);
const attainmentOf = memoByCourse<CompiledAttainmentPolicy>(
  (courseId) => (artifactsFor(courseId).attainment as CompiledAttainmentPolicy | undefined) ?? EMPTY_ATTAINMENT
);

export function checkpointOrder(courseId: string): readonly string[] {
  return checkpointsOf(courseId).order;
}

export function checkpointFor(courseId: string, id: string): CompiledCheckpoint | undefined {
  return checkpointsOf(courseId).byId[id];
}

/** The checkpoint attached to a PATH section, if any. */
export function checkpointForSection(courseId: string, sectionId: string): CompiledCheckpoint | undefined {
  const { order, byId } = checkpointsOf(courseId);
  return order.map((id) => byId[id]).find((cp) => cp.sectionId === sectionId);
}

/** The full compiled placement plan (stages with exercise payloads). */
export function placementContent(courseId: string): CompiledPlacement {
  return placementOf(courseId);
}

/** The same plan reduced to the pure engine's shape (item ids only). */
export function placementEnginePlan(courseId: string): PlacementPlanContent {
  const placement = placementOf(courseId);
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

export function objectiveOrder(courseId: string): readonly string[] {
  return objectivesOf(courseId).order;
}

export function objectiveFor(courseId: string, id: string): CompiledObjective | undefined {
  return objectivesOf(courseId).byId[id];
}

export function allObjectives(courseId: string): CompiledObjective[] {
  const { order, byId } = objectivesOf(courseId);
  return order.map((id) => byId[id]);
}

export function courseClaim(courseId: string): CompiledCourseClaim {
  return claimOf(courseId);
}

export function courseClaimableAt(courseId: string, level: string): boolean {
  return claimOf(courseId).levels.some((l) => l.level === level && l.courseClaimable);
}

export function attainmentPolicy(courseId: string): CompiledAttainmentPolicy {
  return attainmentOf(courseId);
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

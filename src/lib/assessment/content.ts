/**
 * Runtime access to the compiled Phase-6 assessment artifacts (checkpoints
 * + objective metadata). Content only — learner state lives in the store.
 */

import checkpointsArtifact from "../../content/assessment/fr-checkpoints.json";
import objectivesArtifact from "../../content/assessment/fr-objectives.json";
import type { Exercise } from "../types";
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
  sectionId: string;
  title: string;
  description: string;
  items: CompiledCheckpointItem[];
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

export const OBJECTIVE_ORDER: readonly string[] = objectives.order;

export function objectiveFor(id: string): CompiledObjective | undefined {
  return objectives.byId[id];
}

export function allObjectives(): CompiledObjective[] {
  return objectives.order.map((id) => objectives.byId[id]);
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

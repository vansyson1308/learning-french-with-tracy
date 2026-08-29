/**
 * Compiled writing content (P9 §13): reads the generated
 * src/content/writing/fr-writing.json — non-reserved tasks plus the
 * deterministic known-French vocabulary the rubric engine's plausibility
 * floor uses. Reserved assessment tasks are excluded at compile time, so
 * nothing here can leak a checkpoint stimulus.
 */

import writingJson from "../../content/writing/fr-writing.json";
import type { WritingRubricSpec } from "../types";

export type WritingTaskContent = {
  id: string;
  taskFamily: "personal_profile" | "simple_description" | "short_message" | "simple_form";
  mode: "guided" | "open";
  instruction: string;
  cueFacts?: { label: string; value: string }[];
  formFields?: { id: string; label: string; slotId: string }[];
  rubric: WritingRubricSpec;
  modelAnswers: string[];
  objectiveRefs: string[];
  lexemeRefs: string[];
  scoredEligibility: boolean;
};

type WritingArtifact = {
  order: string[];
  byId: Record<string, WritingTaskContent>;
  knownFrench: string[];
};

const artifact = writingJson as unknown as WritingArtifact;

let vocabulary: Set<string> | null = null;

/** The compiled known-French token set (built once, shared). */
export function knownFrenchVocabulary(): ReadonlySet<string> {
  if (vocabulary === null) vocabulary = new Set(artifact.knownFrench);
  return vocabulary;
}

export function writingTaskFor(id: string): WritingTaskContent | null {
  return artifact.byId[id] ?? null;
}

/** All non-reserved tasks in authored order. */
export function writingTasks(): WritingTaskContent[] {
  return artifact.order.map((id) => artifact.byId[id]);
}

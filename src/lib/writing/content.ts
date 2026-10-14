/**
 * Compiled writing content, per course (P9 §13, P1b): the course's
 * non-reserved tasks plus the deterministic known-vocabulary token set the
 * rubric engine's plausibility floor uses. Reserved assessment tasks are
 * excluded at compile time, so nothing here can leak a checkpoint
 * stimulus. A course without writing content has an empty vocabulary.
 */

import { artifactsFor, memoByCourse } from "../content-registry";
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
  /** Compiled token vocabulary of the target language (the artifact's historical key). */
  knownFrench?: string[];
  knownVocabulary?: string[];
};

const EMPTY: WritingArtifact = { order: [], byId: {} };

const artifactOf = memoByCourse<WritingArtifact>(
  (courseId) => (artifactsFor(courseId).writing as WritingArtifact | undefined) ?? EMPTY
);

/** The compiled known-token set of the course's target language (built once per course). */
export const knownVocabulary = memoByCourse<ReadonlySet<string>>((courseId) => {
  const artifact = artifactOf(courseId);
  return new Set(artifact.knownVocabulary ?? artifact.knownFrench ?? []);
});

export function writingTaskFor(courseId: string, id: string): WritingTaskContent | null {
  return artifactOf(courseId).byId[id] ?? null;
}

/** All non-reserved tasks in authored order. */
export function writingTasks(courseId: string): WritingTaskContent[] {
  const artifact = artifactOf(courseId);
  return artifact.order.map((id) => artifact.byId[id]);
}

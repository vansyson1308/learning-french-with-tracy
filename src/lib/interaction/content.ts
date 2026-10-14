/**
 * Compiled interaction scenarios, per course (P9 §25, P1b). The artifact
 * carries reserved assessment scenarios too (the checkpoint executes
 * them); every PRACTICE surface must go through
 * interactionPracticeScenarios(), which filters reserved out. A course
 * without scenarios resolves an empty list.
 */

import { artifactsFor, memoByCourse } from "../content-registry";

import type { InteractionScenario } from "./machine";

type InteractionArtifact = {
  order: string[];
  byId: Record<string, InteractionScenario>;
};

const EMPTY: InteractionArtifact = { order: [], byId: {} };

const artifactOf = memoByCourse<InteractionArtifact>(
  (courseId) => (artifactsFor(courseId).scenarios as InteractionArtifact | undefined) ?? EMPTY
);

export function interactionScenarioFor(courseId: string, id: string): InteractionScenario | null {
  return artifactOf(courseId).byId[id] ?? null;
}

/** Non-reserved scenarios in authored order — the only practice list. */
export function interactionPracticeScenarios(courseId: string): InteractionScenario[] {
  const artifact = artifactOf(courseId);
  return artifact.order.map((id) => artifact.byId[id]).filter((s) => !s.reserved);
}

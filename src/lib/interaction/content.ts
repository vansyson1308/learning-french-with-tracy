/**
 * Compiled interaction scenarios (P9 §25): reads the generated
 * src/content/interaction/fr-scenarios.json. The artifact carries reserved
 * assessment scenarios too (the checkpoint executes them); every PRACTICE
 * surface must go through interactionPracticeScenarios(), which filters
 * reserved out.
 */

import scenariosJson from "../../content/interaction/fr-scenarios.json";
import type { InteractionScenario } from "./machine";

type InteractionArtifact = {
  order: string[];
  byId: Record<string, InteractionScenario>;
};

const artifact = scenariosJson as unknown as InteractionArtifact;

export function interactionScenarioFor(id: string): InteractionScenario | null {
  return artifact.byId[id] ?? null;
}

/** Non-reserved scenarios in authored order — the only practice list. */
export function interactionPracticeScenarios(): InteractionScenario[] {
  return artifact.order
    .map((id) => artifact.byId[id])
    .filter((s) => !s.reserved);
}

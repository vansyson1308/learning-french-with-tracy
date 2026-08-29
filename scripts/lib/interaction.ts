/**
 * Spoken-interaction content pipeline (P9 §24-§37).
 *
 * Source of truth: content/fr/interaction/scenarios.json. The compiled
 * artifact carries EVERY scenario (reserved flagged, filtered by runtime
 * practice surfaces) because the interaction checkpoint executes reserved
 * graphs directly. Validators enforce graph integrity (no dead ends, no
 * unreachable goals), deterministic gradability of every intent, honest
 * clip references, and the CONSTRUCT rules: a scenario is only direct
 * interaction evidence when it is genuinely multi-turn (§36, §80).
 */

import { existsSync } from "fs";

import {
  InteractionScenariosSchema,
  type CourseObjectives,
  type InteractionScenarios,
  type InteractionScenarioSource,
  type Listening,
} from "../../content/schema";
import { normalizeSpokenFrench } from "../../src/lib/speech/grader";
import { canonicalJson, readJson, safeResolve, type ValidationResult } from "./pipeline";

export const INTERACTION_SOURCE = "content/fr/interaction/scenarios.json";

export function loadInteractionScenarios(): InteractionScenarios | null {
  if (!existsSync(safeResolve(INTERACTION_SOURCE))) return null;
  return InteractionScenariosSchema.parse(readJson(INTERACTION_SOURCE));
}

/** Runtime artifact: ALL scenarios, reserved flagged (checkpoint needs them). */
export function compileInteractionArtifact(
  doc: InteractionScenarios | null
): string {
  const scenarios = doc?.scenarios ?? [];
  const byId: Record<string, unknown> = {};
  for (const scenario of scenarios) {
    byId[scenario.id] = {
      id: scenario.id,
      title: scenario.title,
      goal: scenario.goal,
      taskFamily: scenario.taskFamily,
      objectiveRefs: scenario.objectiveRefs,
      startNodeId: scenario.startNodeId,
      nodes: scenario.nodes,
      support: scenario.support,
      reserved: scenario.reserved,
    };
  }
  return canonicalJson({
    generator: "scripts/lib/interaction.ts",
    version: 1,
    order: scenarios.map((s) => s.id),
    byId,
  });
}

type InteractionExerciseRef = { type: string; id: string; scenarioId?: string };

export type FrPackForInteraction = {
  sections: { units: { lessons: { exercises: InteractionExerciseRef[] }[] }[] }[];
};

export function validateInteraction(input: {
  interaction: InteractionScenarios | null;
  objectives: CourseObjectives | null;
  listening: Listening | null;
  frPack?: FrPackForInteraction;
  /** interactionScenario exercises found in scored banks. */
  assessmentInteraction?: InteractionExerciseRef[];
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const err = (m: string) => errors.push(`interaction: ${m}`);
  if (input.interaction === null) return { errors, warnings };

  const knownObjectives = new Set(
    (input.objectives?.objectives ?? []).map((o) => o.id)
  );
  const knownClips = new Set((input.listening?.clips ?? []).map((c) => c.id));

  const byId = new Map<string, InteractionScenarioSource>();
  for (const scenario of input.interaction.scenarios) {
    if (byId.has(scenario.id)) err(`duplicate scenario id ${scenario.id}`);
    byId.set(scenario.id, scenario);
    validateScenario(scenario);
  }

  function validateScenario(scenario: InteractionScenarioSource) {
    const nodes = scenario.nodes;
    const nodeIds = new Set(Object.keys(nodes));
    const ref = (from: string, target: string) => {
      if (!nodeIds.has(target)) {
        err(`${scenario.id}/${from}: references unknown node "${target}"`);
      }
    };
    for (const [key, node] of Object.entries(nodes)) {
      if (key !== node.id) err(`${scenario.id}: node key ${key} != id ${node.id}`);
    }
    if (!nodeIds.has(scenario.startNodeId)) {
      err(`${scenario.id}: startNodeId does not resolve`);
      return;
    }

    let learnerCount = 0;
    let scoredCount = 0;
    let goalMetTerminals = 0;
    for (const node of Object.values(nodes)) {
      if (node.kind === "partner") {
        ref(node.id, node.next);
        if (!knownClips.has(node.clipId)) {
          err(`${scenario.id}/${node.id}: clip ${node.clipId} resolves to no listening clip`);
        }
        // Rephrase support is text+clip together or absent (§29/§30).
        if ((node.rephraseText === undefined) !== (node.rephraseClipId === undefined)) {
          err(`${scenario.id}/${node.id}: rephraseText and rephraseClipId must come together`);
        }
        if (node.rephraseClipId && !knownClips.has(node.rephraseClipId)) {
          err(`${scenario.id}/${node.id}: rephrase clip ${node.rephraseClipId} resolves to no clip`);
        }
      } else if (node.kind === "learner") {
        learnerCount += 1;
        if (node.scored) scoredCount += 1;
        ref(node.id, node.noMatchNext);
        const seenIntents = new Set<string>();
        for (const expected of node.expected) {
          if (seenIntents.has(expected.intent)) {
            err(`${scenario.id}/${node.id}: duplicate intent ${expected.intent}`);
          }
          seenIntents.add(expected.intent);
          ref(node.id, expected.next);
          const normalized = expected.acceptedVariants.map(normalizeSpokenFrench);
          normalized.forEach((v, i) => {
            if (v.length === 0) {
              err(`${scenario.id}/${node.id}/${expected.intent}: variant[${i}] normalizes to nothing`);
            }
          });
          for (const slot of expected.requiredConcepts ?? []) {
            for (const form of slot) {
              if (normalizeSpokenFrench(form).length === 0) {
                err(`${scenario.id}/${node.id}/${expected.intent}: concept form normalizes to nothing`);
              }
            }
          }
        }
        // A learner node that repairs into ITSELF would loop without a
        // partner turn; the repair target must not be this node.
        if (node.noMatchNext === node.id) {
          err(`${scenario.id}/${node.id}: noMatchNext must route via a partner repair, not itself`);
        }
      } else {
        if (node.outcome === "goal_met") goalMetTerminals += 1;
        if (node.clipId && !knownClips.has(node.clipId)) {
          err(`${scenario.id}/${node.id}: clip ${node.clipId} resolves to no clip`);
        }
        if ((node.text === undefined) !== (node.clipId === undefined)) {
          err(`${scenario.id}/${node.id}: terminal text and clipId must come together`);
        }
      }
    }
    if (goalMetTerminals === 0) err(`${scenario.id}: no goal_met terminal exists`);

    // Reachability: every node reachable from start; every non-terminal
    // node can reach SOME terminal (no dead ends, §68/§98).
    const forward = new Map<string, string[]>();
    for (const node of Object.values(nodes)) {
      const out: string[] = [];
      if (node.kind === "partner") out.push(node.next);
      if (node.kind === "learner") {
        out.push(node.noMatchNext, ...node.expected.map((e) => e.next));
      }
      forward.set(node.id, out.filter((t) => nodeIds.has(t)));
    }
    const reachable = new Set<string>();
    const stack = [scenario.startNodeId];
    while (stack.length) {
      const id = stack.pop()!;
      if (reachable.has(id)) continue;
      reachable.add(id);
      for (const next of forward.get(id) ?? []) stack.push(next);
    }
    for (const id of nodeIds) {
      if (!reachable.has(id)) err(`${scenario.id}/${id}: unreachable from start`);
    }
    const reachesTerminal = new Set<string>(
      Object.values(nodes)
        .filter((n) => n.kind === "terminal")
        .map((n) => n.id)
    );
    let grew = true;
    while (grew) {
      grew = false;
      for (const [id, outs] of forward) {
        if (reachesTerminal.has(id)) continue;
        if (outs.some((t) => reachesTerminal.has(t))) {
          reachesTerminal.add(id);
          grew = true;
        }
      }
    }
    for (const id of nodeIds) {
      if (!reachesTerminal.has(id)) {
        err(`${scenario.id}/${id}: dead end — no terminal is reachable from here`);
      }
    }

    // Construct floor (§36/§80): interaction is multi-turn by definition.
    if (learnerCount < 2) {
      err(`${scenario.id}: interaction requires at least two learner turns`);
    }
    if (scenario.reserved && scoredCount < 2) {
      err(`${scenario.id}: reserved assessment scenarios need >= 2 SCORED learner turns`);
    }

    for (const objective of scenario.objectiveRefs) {
      if (!knownObjectives.has(objective)) {
        err(`${scenario.id}: unknown objective ${objective}`);
      }
    }
  }

  // --- exercise references --------------------------------------------
  const checkRef = (exercise: InteractionExerciseRef, context: "path" | "assessment") => {
    if (exercise.type !== "interactionScenario") return;
    const scenario = exercise.scenarioId ? byId.get(exercise.scenarioId) : undefined;
    if (!scenario) {
      err(`${exercise.id}: unknown scenario ${exercise.scenarioId}`);
      return;
    }
    if (context === "path" && scenario.reserved) {
      err(`${exercise.id}: reserved assessment scenario used as teaching material`);
    }
    if (context === "assessment" && !scenario.reserved) {
      err(`${exercise.id}: scored banks require RESERVED scenarios`);
    }
  };
  if (input.frPack) {
    for (const section of input.frPack.sections) {
      for (const unit of section.units) {
        for (const lesson of unit.lessons) {
          for (const exercise of lesson.exercises) checkRef(exercise, "path");
        }
      }
    }
  }
  for (const exercise of input.assessmentInteraction ?? []) {
    checkRef(exercise, "assessment");
  }

  return { errors, warnings };
}

/** interactionScenario exercises inside scored banks. */
export function assessmentBankInteractionExercises(): InteractionExerciseRef[] {
  const out: InteractionExerciseRef[] = [];
  const collect = (items: unknown) => {
    if (!Array.isArray(items)) return;
    for (const entry of items) {
      const exercise = (entry as { exercise?: InteractionExerciseRef }).exercise;
      if (exercise?.type === "interactionScenario") out.push(exercise);
    }
  };
  for (const [relPath, key] of [
    ["content/fr/assessment/checkpoints.json", "checkpoints"],
    ["content/fr/assessment/placement.json", "stages"],
  ] as const) {
    try {
      const doc = readJson(relPath) as Record<string, unknown>;
      const containers = doc[key];
      if (!Array.isArray(containers)) continue;
      for (const container of containers) {
        collect((container as { items?: unknown }).items);
        for (const cluster of (container as { clusters?: unknown[] }).clusters ?? []) {
          collect((cluster as { items?: unknown }).items);
        }
      }
    } catch {
      // Bank absent — nothing to check.
    }
  }
  return out;
}

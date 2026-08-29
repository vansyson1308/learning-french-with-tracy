/**
 * Interaction content red team (P9 §68/§98): adversarial checks over the
 * AUTHORED scenario graphs that the structural validator cannot express,
 * run through the REAL machine + grader:
 *
 *  1. No intent shadowing — every intent's own authored variants route to
 *     that intent (authored order wins, so a generous earlier intent must
 *     never swallow a later one's utterances).
 *  2. Bounded failure — a learner who never matches anything reaches a
 *     terminal (the graceful goal_not_met exit), never an infinite repair
 *     loop, and the result is a judged non-pass with repair recorded.
 *  3. First-try pass — walking every scenario matching each scored turn's
 *     FIRST intent on the first final reaches goal_met with
 *     passedFirstTry, and every authored branch intent also reaches a
 *     terminal.
 *  4. Support never hurts — repeat+rephrase before a clean run leaves
 *     passedFirstTry true (only supportUsed moves).
 *  5. No answer leak — no learner prompt (shown in scored mode) contains
 *     a full accepted variant's French.
 */
import { describe, expect, test } from "bun:test";

import { readFileSync } from "fs";

import {
  currentLearnerNode,
  interactionReducer,
  interactionResult,
  matchIntent,
  startInteraction,
  type InteractionScenario,
  type InteractionState,
  type LearnerNode,
} from "../../src/lib/interaction/machine";
import { normalizeSpokenFrench } from "../../src/lib/speech/grader";

const doc = JSON.parse(
  readFileSync("content/fr/interaction/scenarios.json", "utf8")
) as { scenarios: InteractionScenario[] };
const scenarios = doc.scenarios;

test("the authored source exists and carries both banks", () => {
  expect(scenarios.length).toBeGreaterThanOrEqual(10);
  expect(scenarios.filter((s) => s.reserved).length).toBeGreaterThanOrEqual(6);
});

function learnerNodes(scenario: InteractionScenario): LearnerNode[] {
  return Object.values(scenario.nodes).filter(
    (n): n is LearnerNode => n.kind === "learner"
  );
}

/** Drive one event loop step: auto-advance partner nodes like the screen. */
function settle(scenario: InteractionScenario, state: InteractionState): InteractionState {
  let current = state;
  for (let hops = 0; hops < 20; hops++) {
    if (current.finished) return current;
    const node = scenario.nodes[current.currentNodeId];
    if (node?.kind !== "partner") return current;
    current = interactionReducer(scenario, current, { type: "advance" });
  }
  throw new Error(`${scenario.id}: partner chain never settled`);
}

function speak(
  scenario: InteractionScenario,
  state: InteractionState,
  utterance: string
): InteractionState {
  return settle(
    scenario,
    interactionReducer(scenario, state, {
      type: "learnerFinal",
      finalTranscript: utterance,
      alternatives: [],
    })
  );
}

describe("1. no intent shadowing (authored order is safe)", () => {
  for (const scenario of scenarios) {
    test(scenario.id, () => {
      for (const node of learnerNodes(scenario)) {
        for (const expected of node.expected) {
          for (const variant of expected.acceptedVariants) {
            const matched = matchIntent(node, {
              finalTranscript: variant,
              alternatives: [],
            });
            expect(
              `${node.id}/${variant} → ${matched?.intent ?? "NO MATCH"}`
            ).toBe(`${node.id}/${variant} → ${expected.intent}`);
          }
        }
      }
    });
  }
});

describe("2. total failure is bounded and judged, never a trap", () => {
  for (const scenario of scenarios) {
    test(scenario.id, () => {
      let state = settle(scenario, startInteraction(scenario));
      for (let turns = 0; turns < 30 && !state.finished; turns++) {
        expect(currentLearnerNode(scenario, state)).not.toBeNull();
        state = speak(scenario, state, "je ne sais pas quoi dire du tout");
      }
      expect(state.finished).not.toBeNull();
      expect(state.finished!.outcome).toBe("goal_not_met");
      const result = interactionResult(scenario, state);
      expect(result.goalMet).toBe(false);
      expect(result.passedFirstTry).toBe(false);
      expect(result.technicallyIncomplete).toBe(false); // judged, not incomplete
      expect(result.repairMoves).toBeGreaterThan(0);
      // First-judgment integrity: the scored first turn was judged a miss.
      expect(result.matchedFirstTry).toBe(0);
    });
  }
});

describe("3. every scenario has a clean first-try pass, and every branch terminates", () => {
  for (const scenario of scenarios) {
    test(`${scenario.id}: primary path passes first-try`, () => {
      let state = settle(scenario, startInteraction(scenario));
      for (let turns = 0; turns < 10 && !state.finished; turns++) {
        const node = currentLearnerNode(scenario, state);
        expect(node).not.toBeNull();
        state = speak(scenario, state, node!.expected[0].acceptedVariants[0]);
      }
      expect(state.finished?.outcome).toBe("goal_met");
      const result = interactionResult(scenario, state);
      expect(result.passedFirstTry).toBe(true);
      expect(result.matchedFirstTry).toBe(result.scoredTurns);
      expect(result.scoredTurns).toBeGreaterThanOrEqual(2);
    });

    test(`${scenario.id}: every authored intent branch reaches a terminal`, () => {
      // For each learner node and each of its intents: play a run that
      // reaches that node via first intents, then takes THIS intent.
      for (const target of learnerNodes(scenario)) {
        for (const expected of target.expected) {
          let state = settle(scenario, startInteraction(scenario));
          let guard = 0;
          while (!state.finished && guard++ < 20) {
            const node = currentLearnerNode(scenario, state);
            if (node === null) break;
            const pick =
              node.id === target.id
                ? expected
                : node.expected[0];
            state = speak(scenario, state, pick.acceptedVariants[0]);
            if (node.id === target.id) break;
          }
          // After taking the branch, finish greedily.
          let hops = 0;
          while (!state.finished && hops++ < 10) {
            const node = currentLearnerNode(scenario, state);
            expect(node).not.toBeNull();
            state = speak(scenario, state, node!.expected[0].acceptedVariants[0]);
          }
          expect(state.finished).not.toBeNull();
        }
      }
    });
  }
});

describe("4. support and silence never fail the learner (§29/§71)", () => {
  for (const scenario of scenarios.filter((s) => s.reserved)) {
    test(scenario.id, () => {
      let state = settle(scenario, startInteraction(scenario));
      // Lean on every support move and a technical failure before speaking.
      state = interactionReducer(scenario, state, { type: "repeatRequested" });
      state = interactionReducer(scenario, state, { type: "rephraseRequested" });
      state = interactionReducer(scenario, state, { type: "technical" });
      for (let turns = 0; turns < 10 && !state.finished; turns++) {
        const node = currentLearnerNode(scenario, state);
        state = speak(scenario, state, node!.expected[0].acceptedVariants[0]);
      }
      const result = interactionResult(scenario, state);
      expect(result.goalMet).toBe(true);
      expect(result.passedFirstTry).toBe(true);
      expect(result.supportUsed).toBe(2);
    });
  }
});

describe("5. scored-mode prompts never leak a full accepted variant", () => {
  for (const scenario of scenarios) {
    test(scenario.id, () => {
      for (const node of learnerNodes(scenario)) {
        const prompt = normalizeSpokenFrench(node.prompt);
        for (const expected of node.expected) {
          for (const variant of expected.acceptedVariants) {
            const normalized = normalizeSpokenFrench(variant);
            expect(prompt.includes(normalized)).toBe(false);
          }
        }
      }
    });
  }
});

describe("checkpoint bank ↔ scenario consistency (§35)", () => {
  const cps = JSON.parse(
    readFileSync("content/fr/assessment/checkpoints.json", "utf8")
  ) as {
    checkpoints: {
      id: string;
      items: { objectiveTargets: string[]; exercise: { type: string; scenarioId?: string } }[];
    }[];
  };
  const cp6 = cps.checkpoints.find((c) => c.id === "fr.checkpoint.section-6");

  test("six reserved multi-turn items, 3 per interaction objective, 3 families", () => {
    expect(cp6).toBeDefined();
    const byId = new Map(scenarios.map((s) => [s.id, s]));
    const perObjective = new Map<string, Set<string>>();
    const families = new Set<string>();
    for (const item of cp6!.items) {
      expect(item.exercise.type).toBe("interactionScenario");
      const scenario = byId.get(item.exercise.scenarioId!);
      expect(scenario).toBeDefined();
      expect(scenario!.reserved).toBe(true);
      families.add(scenario!.taskFamily);
      const scored = learnerNodes(scenario!).filter((n) => n.scored).length;
      expect(scored).toBeGreaterThanOrEqual(2);
      // Item targets must agree with the scenario's own objective refs.
      for (const oid of item.objectiveTargets) {
        expect(scenario!.objectiveRefs).toContain(oid);
        let inputs = perObjective.get(oid);
        if (!inputs) perObjective.set(oid, (inputs = new Set()));
        inputs.add(scenario!.id);
      }
    }
    expect(cp6!.items.length).toBe(6);
    expect(families.size).toBe(3);
    for (const [oid, inputs] of perObjective) {
      expect(`${oid}: ${inputs.size}`).toBe(`${oid}: 3`);
    }
  });

  test("reserved scenarios never appear in Section-6 lessons", () => {
    const pack = JSON.parse(
      readFileSync("content/courses/fr-en.json", "utf8")
    ) as {
      sections: {
        id: string;
        units: { lessons: { exercises: { type: string; scenarioId?: string }[] }[] }[];
      }[];
    };
    const byId = new Map(scenarios.map((s) => [s.id, s]));
    const used = new Set<string>();
    for (const section of pack.sections) {
      for (const unit of section.units) {
        for (const lesson of unit.lessons) {
          for (const exercise of lesson.exercises) {
            if (exercise.type !== "interactionScenario") continue;
            const scenario = byId.get(exercise.scenarioId!);
            expect(scenario).toBeDefined();
            expect(scenario!.reserved).toBe(false);
            used.add(scenario!.id);
          }
        }
      }
    }
    // All 8 practice scenarios are actually taught.
    expect(used.size).toBe(scenarios.filter((s) => !s.reserved).length);
  });
});

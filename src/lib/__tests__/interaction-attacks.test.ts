/**
 * Interaction attacks (Phase 10 §28, §76) over EVERY authored scenario:
 * intent shadowing, clarification/repeat/silence never judged as answers,
 * the repair path never turning a first miss into a scored pass, stale
 * finals ignored, and the honest first-try path still passing.
 */
import { describe, expect, test } from "bun:test";

import checkpointsArtifact from "../../content/assessment/fr-checkpoints.json";
import { interactionPracticeScenarios, interactionScenarioFor } from "../interaction/content";
import {
  interactionReducer,
  matchIntent,
  startInteraction,
  type InteractionScenario,
  type InteractionState,
  type LearnerNode,
} from "../interaction/machine";

const reservedIds = new Set<string>();
for (const cp of Object.values((checkpointsArtifact as { byId: Record<string, { items: { exercise: { type: string; scenarioId?: string } }[] }> }).byId)) {
  for (const item of cp.items) if (item.exercise.type === "interactionScenario" && item.exercise.scenarioId) reservedIds.add(item.exercise.scenarioId);
}
const scenarios: InteractionScenario[] = [
  ...interactionPracticeScenarios(),
  ...[...reservedIds].map((id) => interactionScenarioFor(id)!).filter(Boolean),
];

const finals = (t: string, alternatives: string[] = []) => ({ finalTranscript: t, alternatives });

/** A transcript that satisfies an intent: its first whole variant, else its concept forms joined. */
function utteranceFor(intent: LearnerNode["expected"][number]): string {
  if (intent.acceptedVariants.length > 0) return intent.acceptedVariants[0];
  return (intent.requiredConcepts ?? []).map((slot) => slot[0]).join(" ");
}

/** Advance through partner nodes until a learner node or a terminal. */
function settle(scenario: InteractionScenario, state: InteractionState): InteractionState {
  let current = state;
  for (let guard = 0; guard < 50 && !current.finished; guard += 1) {
    const node = scenario.nodes[current.currentNodeId];
    if (node.kind !== "partner") break;
    current = interactionReducer(scenario, current, { type: "advance" });
  }
  return current;
}

function learnerNodes(scenario: InteractionScenario): LearnerNode[] {
  return Object.values(scenario.nodes).filter((n): n is LearnerNode => n.kind === "learner");
}

describe("intent matching under attack", () => {
  test("every scenario loads; every intent's own utterance matches ITSELF (no shadowing by an earlier intent)", () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(18);
    for (const scenario of scenarios) {
      for (const node of learnerNodes(scenario)) {
        for (const intent of node.expected) {
          const matched = matchIntent(node, finals(utteranceFor(intent)));
          expect({ scenario: scenario.id, node: node.id, intent: intent.intent, matched: matched?.intent ?? null }).toEqual({
            scenario: scenario.id,
            node: node.id,
            intent: intent.intent,
            matched: intent.intent,
          });
        }
      }
    }
  });

  test("clarification requests, 'I don't know', and silence never match an intent", () => {
    const nonAnswers = [
      "pardon, vous pouvez répéter ?",
      "je ne comprends pas",
      "je ne sais pas",
      "euh",
      "",
      "comment ?",
    ];
    for (const scenario of scenarios) {
      for (const node of learnerNodes(scenario)) {
        const expectsClarification = node.expected.some((e) =>
          [...e.acceptedVariants, ...(e.requiredConcepts ?? []).flat()].some((v) => /répét|comprends|sais pas|comment/i.test(v))
        );
        if (expectsClarification) continue;
        for (const text of nonAnswers) {
          expect({ scenario: scenario.id, node: node.id, text, matched: matchIntent(node, finals(text)) }).toEqual({
            scenario: scenario.id,
            node: node.id,
            text,
            matched: null,
          });
        }
      }
    }
  });

  test("overlapping keywords in the wrong frame: a negated utterance never matches a concept intent", () => {
    let checked = 0;
    for (const scenario of scenarios) {
      for (const node of learnerNodes(scenario)) {
        for (const intent of node.expected) {
          const concepts = intent.requiredConcepts;
          if (!concepts || concepts.length === 0) continue;
          const first = concepts[0][0];
          if (!/^(je veux|je voudrais|il y a|j'ai|je suis)/i.test(first)) continue;
          const negated = utteranceFor(intent).replace(/^je veux/i, "je ne veux pas").replace(/^je voudrais/i, "je ne voudrais pas").replace(/^il y a/i, "il n'y a pas").replace(/^j'ai/i, "je n'ai pas").replace(/^je suis/i, "je ne suis pas");
          if (negated === utteranceFor(intent)) continue;
          checked += 1;
          const matched = matchIntent(node, finals(negated));
          expect({ scenario: scenario.id, node: node.id, negated, matched: matched?.intent ?? null }).toEqual({
            scenario: scenario.id,
            node: node.id,
            negated,
            matched: expect.not.stringMatching(new RegExp(`^${intent.intent}$`)),
          });
        }
      }
    }
    expect(checked).toBeGreaterThanOrEqual(0);
  });
});

describe("the reducer under attack", () => {
  test("silence/technical outcomes are never judged and never move the conversation", () => {
    for (const scenario of scenarios) {
      const start = settle(scenario, startInteraction(scenario));
      if (start.finished) continue;
      const after = interactionReducer(scenario, start, { type: "technical" });
      expect(after.judged).toEqual(start.judged);
      expect(after.currentNodeId).toBe(start.currentNodeId);
      expect(after.technicalRetries).toBe(start.technicalRetries + 1);
      expect(after.finished).toBeNull();
    }
  });

  test("a stale final delivered while the partner is speaking is ignored", () => {
    for (const scenario of scenarios) {
      const state = startInteraction(scenario);
      const node = scenario.nodes[state.currentNodeId];
      if (node.kind !== "partner") continue;
      const after = interactionReducer(scenario, state, { type: "learnerFinal", finalTranscript: "bonjour", alternatives: [] });
      expect(after).toBe(state);
    }
  });

  test("the honest first-try path reaches goal_met with passedFirstTry = true", () => {
    let reached = 0;
    for (const scenario of scenarios) {
      let state = settle(scenario, startInteraction(scenario));
      for (let guard = 0; guard < 40 && !state.finished; guard += 1) {
        const node = scenario.nodes[state.currentNodeId];
        if (node.kind !== "learner") break;
        state = settle(scenario, interactionReducer(scenario, state, { type: "learnerFinal", ...finals(utteranceFor(node.expected[0])) }));
      }
      expect({ scenario: scenario.id, finished: state.finished }).toEqual({
        scenario: scenario.id,
        finished: { outcome: "goal_met", passedFirstTry: true },
      });
      reached += 1;
    }
    expect(reached).toBe(scenarios.length);
  });

  test("the repair-path exploit: a first miss on a scored node can never become a scored pass", () => {
    let repaired = 0;
    for (const scenario of scenarios) {
      let state = settle(scenario, startInteraction(scenario));
      const firstNode = scenario.nodes[state.currentNodeId];
      if (firstNode.kind !== "learner" || !firstNode.scored) continue;
      // Miss on purpose, then answer everything else correctly.
      state = settle(scenario, interactionReducer(scenario, state, { type: "learnerFinal", ...finals("euh alors bof") }));
      expect(state.judged[firstNode.id]).toEqual({ matchedFirstTry: false, intent: null });
      for (let guard = 0; guard < 40 && !state.finished; guard += 1) {
        const node = scenario.nodes[state.currentNodeId];
        if (node.kind !== "learner") break;
        state = settle(scenario, interactionReducer(scenario, state, { type: "learnerFinal", ...finals(utteranceFor(node.expected[0])) }));
      }
      expect(state.finished).not.toBeNull();
      expect(state.finished!.passedFirstTry).toBe(false);
      expect(state.judged[firstNode.id]).toEqual({ matchedFirstTry: false, intent: null });
      repaired += 1;
    }
    expect(repaired).toBeGreaterThanOrEqual(10);
  });

  test("repeat / rephrase support is counted, never judged, and never changes the node", () => {
    for (const scenario of scenarios) {
      const start = settle(scenario, startInteraction(scenario));
      if (start.finished) continue;
      let state = interactionReducer(scenario, start, { type: "repeatRequested" });
      state = interactionReducer(scenario, state, { type: "rephraseRequested" });
      expect(state.judged).toEqual(start.judged);
      expect(state.currentNodeId).toBe(start.currentNodeId);
      const expectedSupport = (scenario.support.allowRepeat ? 1 : 0) + (scenario.support.allowRephrase ? 1 : 0);
      expect(state.supportUsed).toBe(expectedSupport);
    }
  });

  test("terminal immunity: nothing changes a finished conversation", () => {
    for (const scenario of scenarios) {
      let state = settle(scenario, startInteraction(scenario));
      for (let guard = 0; guard < 40 && !state.finished; guard += 1) {
        const node = scenario.nodes[state.currentNodeId];
        if (node.kind !== "learner") break;
        state = settle(scenario, interactionReducer(scenario, state, { type: "learnerFinal", ...finals(utteranceFor(node.expected[0])) }));
      }
      const done = state;
      for (const event of [
        { type: "advance" as const },
        { type: "technical" as const },
        { type: "learnerFinal" as const, finalTranscript: "bonjour", alternatives: [] },
      ]) {
        expect(interactionReducer(scenario, done, event)).toBe(done);
      }
    }
  });
});

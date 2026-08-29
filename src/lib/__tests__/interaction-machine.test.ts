/**
 * Interaction engine battery (P9 §26-§29, §37, §79-§80): the deterministic
 * scenario walker. The load-bearing pins: CONTINGENCY (the learner's
 * recognized meaning decides the partner's next turn), the supportive
 * interlocutor (repeat/rephrase never fail anyone), first-attempt
 * integrity (a judged turn is judged once), technical ≠ evidence, and
 * abandonment = incomplete, never failed.
 */
import { describe, expect, test } from "bun:test";

import {
  currentLearnerNode,
  currentPartnerNode,
  interactionReducer,
  interactionResult,
  startInteraction,
  type InteractionEvent,
  type InteractionScenario,
  type InteractionState,
} from "../interaction/machine";

/** A small café exchange with REAL branching. */
const CAFE: InteractionScenario = {
  id: "fr.scenario.test_cafe",
  title: "Au café",
  goal: "Order a drink and close politely.",
  taskFamily: "transaction",
  objectiveRefs: ["fr.obj.interaction.transaction"],
  startNodeId: "p_hello",
  support: { allowRepeat: true, allowRephrase: true },
  reserved: false,
  nodes: {
    p_hello: {
      kind: "partner",
      id: "p_hello",
      text: "Bonjour ! Vous désirez ?",
      clipId: "fr.clip.test_hello",
      rephraseText: "Bonjour. Un café ? Un thé ?",
      rephraseClipId: "fr.clip.test_hello_slow",
      next: "l_order",
    },
    l_order: {
      kind: "learner",
      id: "l_order",
      prompt: "Order a coffee — or just greet the server first.",
      expected: [
        {
          intent: "order_drink",
          acceptedVariants: ["je voudrais un café", "un café s'il vous plaît", "un café"],
          next: "p_price",
        },
        {
          intent: "greet",
          acceptedVariants: ["bonjour", "bonsoir"],
          next: "p_hello_again",
        },
      ],
      noMatchNext: "p_repair",
      scored: true,
    },
    p_hello_again: {
      kind: "partner",
      id: "p_hello_again",
      text: "Oui, bonjour ! Vous désirez ?",
      clipId: "fr.clip.test_hello_again",
      next: "l_order",
    },
    p_repair: {
      kind: "partner",
      id: "p_repair",
      text: "Pardon ? Un café, un thé ?",
      clipId: "fr.clip.test_repair",
      next: "l_order",
    },
    p_price: {
      kind: "partner",
      id: "p_price",
      text: "Voilà. Deux euros, s'il vous plaît.",
      clipId: "fr.clip.test_price",
      next: "l_close",
    },
    l_close: {
      kind: "learner",
      id: "l_close",
      prompt: "Thank them and say goodbye.",
      expected: [
        {
          intent: "thank_close",
          acceptedVariants: ["merci au revoir", "merci beaucoup au revoir", "merci"],
          next: "t_met",
        },
      ],
      noMatchNext: "p_price",
      scored: true,
    },
    t_met: {
      kind: "terminal",
      id: "t_met",
      outcome: "goal_met",
      text: "Merci, au revoir !",
    },
  },
};

function run(state: InteractionState, ...events: InteractionEvent[]): InteractionState {
  return events.reduce((s, e) => interactionReducer(CAFE, s, e), state);
}

const final = (text: string, alternatives: string[] = []): InteractionEvent => ({
  type: "learnerFinal",
  finalTranscript: text,
  alternatives,
});

describe("scenario flow and contingency (§26, §79-80)", () => {
  test("start presents the opening partner turn", () => {
    const s = startInteraction(CAFE);
    expect(currentPartnerNode(CAFE, s)?.id).toBe("p_hello");
    expect(s.history).toEqual([
      { speaker: "partner", nodeId: "p_hello", text: "Bonjour ! Vous désirez ?", rephrased: false },
    ]);
  });

  test("CONTINGENCY: different recognized meanings produce different partner responses", () => {
    const atLearner = run(startInteraction(CAFE), { type: "advance" });
    expect(currentLearnerNode(CAFE, atLearner)?.id).toBe("l_order");

    const greeted = run(atLearner, final("Bonjour !"));
    expect(currentPartnerNode(CAFE, greeted)?.id).toBe("p_hello_again");

    const ordered = run(atLearner, final("Je voudrais un café."));
    expect(currentPartnerNode(CAFE, ordered)?.id).toBe("p_price");
  });

  test("a clean run passes first-try and meets the goal", () => {
    const s = run(
      startInteraction(CAFE),
      { type: "advance" },
      final("Un café, s'il vous plaît"),
      { type: "advance" },
      final("Merci, au revoir !")
    );
    expect(s.finished).toEqual({ outcome: "goal_met", passedFirstTry: true });
    const result = interactionResult(CAFE, s);
    expect(result).toEqual({
      goalMet: true,
      passedFirstTry: true,
      scoredTurns: 2,
      matchedFirstTry: 2,
      supportUsed: 0,
      repairMoves: 0,
      technicallyIncomplete: false,
    });
  });

  test("n-best: a lower-ranked final alternative may carry the intent", () => {
    const s = run(
      startInteraction(CAFE),
      { type: "advance" },
      final("je voudrais un gateau", ["je voudrais un café"])
    );
    expect(currentPartnerNode(CAFE, s)?.id).toBe("p_price");
  });
});

describe("repair and first-attempt integrity (§28-29, §37)", () => {
  test("an unmatched final routes through the authored repair branch — no dead end", () => {
    const s = run(startInteraction(CAFE), { type: "advance" }, final("la fenêtre est bleue"));
    expect(currentPartnerNode(CAFE, s)?.id).toBe("p_repair");
    expect(s.repairMoves).toBe(1);
    expect(s.judged.l_order).toEqual({ matchedFirstTry: false, intent: null });
  });

  test("the conversation survives the miss, but the first judgment stands", () => {
    const s = run(
      startInteraction(CAFE),
      { type: "advance" },
      final("la fenêtre est bleue"), // judged miss
      { type: "advance" }, // repair partner line → back at l_order
      final("un café"), // matches now — conversation proceeds
      { type: "advance" },
      final("merci")
    );
    expect(s.finished?.outcome).toBe("goal_met");
    expect(s.finished?.passedFirstTry).toBe(false); // §37: no retry laundering
    expect(interactionResult(CAFE, s).matchedFirstTry).toBe(1);
  });

  test("technical/silent outcomes are never judgments (§71)", () => {
    const atLearner = run(startInteraction(CAFE), { type: "advance" });
    const afterTech = run(atLearner, { type: "technical" }, { type: "technical" });
    expect(afterTech.judged).toEqual({});
    expect(afterTech.technicalRetries).toBe(2);
    expect(currentLearnerNode(CAFE, afterTech)?.id).toBe("l_order");
    // The real final afterwards is the FIRST judgment.
    const done = run(afterTech, final("un café"));
    expect(done.judged.l_order?.matchedFirstTry).toBe(true);
  });

  test("support moves are tracked and never affect judgments (§29)", () => {
    const s = run(
      startInteraction(CAFE),
      { type: "repeatRequested" },
      { type: "rephraseRequested" },
      { type: "advance" },
      final("un café"),
      { type: "advance" },
      final("merci au revoir")
    );
    expect(s.supportUsed).toBe(2);
    expect(s.history[0]).toEqual({
      speaker: "partner",
      nodeId: "p_hello",
      text: "Bonjour ! Vous désirez ?",
      rephrased: true,
    });
    expect(s.finished?.passedFirstTry).toBe(true); // support ≠ failure
  });

  test("support is policy-gated: a scenario that forbids rephrase ignores the request", () => {
    const strict: InteractionScenario = {
      ...CAFE,
      support: { allowRepeat: false, allowRephrase: false },
    };
    let s = startInteraction(strict);
    s = interactionReducer(strict, s, { type: "repeatRequested" });
    s = interactionReducer(strict, s, { type: "rephraseRequested" });
    expect(s.supportUsed).toBe(0);
  });
});

describe("terminal immunity, abandonment, determinism (§79)", () => {
  test("events after a terminal change nothing", () => {
    const done = run(
      startInteraction(CAFE),
      { type: "advance" },
      final("un café"),
      { type: "advance" },
      final("merci")
    );
    const poked = run(done, final("bonjour"), { type: "advance" }, { type: "technical" });
    expect(JSON.stringify(poked)).toBe(JSON.stringify(done));
  });

  test("an unfinished run is INCOMPLETE — never a judged failure", () => {
    const midway = run(startInteraction(CAFE), { type: "advance" }, { type: "technical" });
    const result = interactionResult(CAFE, midway);
    expect(result.technicallyIncomplete).toBe(true);
    expect(result.goalMet).toBe(false);
    expect(result.passedFirstTry).toBe(false);
  });

  test("determinism: the same event sequence yields byte-identical state", () => {
    const events: InteractionEvent[] = [
      { type: "advance" },
      final("bonjour"),
      { type: "advance" },
      final("un café s'il vous plaît"),
      { type: "advance" },
      final("merci"),
    ];
    const a = events.reduce((s, e) => interactionReducer(CAFE, s, e), startInteraction(CAFE));
    const b = events.reduce((s, e) => interactionReducer(CAFE, s, e), startInteraction(CAFE));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  test("a greeting detour still reaches the goal with clean first-try turns", () => {
    // §80: this is what makes it INTERACTION — the learner's social move
    // reshapes the exchange without being punished as a wrong answer.
    const s = run(
      startInteraction(CAFE),
      { type: "advance" },
      final("bonjour"), // matched greet intent — a VALID first-try turn
      { type: "advance" },
      final("je voudrais un café"),
      { type: "advance" },
      final("merci beaucoup au revoir")
    );
    expect(s.finished).toEqual({ outcome: "goal_met", passedFirstTry: true });
  });
});

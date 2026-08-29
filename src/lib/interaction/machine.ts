/**
 * Deterministic spoken-interaction engine (P9 §24-§29, §37).
 *
 * An authored finite scenario graph: partner turns (text + clip, with an
 * authored rephrase variant), learner turns (small authored intent sets
 * matched deterministically over the recognizer's FINAL n-best — no NLU,
 * no LLM), and terminals. GENUINE CONTINGENCY: the matched intent decides
 * the next node, and an unmatched final routes through the authored repair
 * branch — never a scripted sequence that ignores the learner.
 *
 * The supportive A1 interlocutor is modeled, not faked (§29): repeating or
 * rephrasing the partner turn is a legitimate support move that never
 * fails the learner; technical/silent speech outcomes are never judged.
 * First-attempt integrity (§37): each learner NODE is judged exactly once,
 * on its first RECOGNIZED final; a repair branch keeps the conversation
 * alive but can never turn that judgment into a pass.
 *
 * Pure reducer; the screen supplies events, audio and recognition live
 * outside. Same input sequence → same state, always.
 */

import { gradeSpokenAttempt } from "../speech/grader";

export type PartnerNode = {
  kind: "partner";
  id: string;
  /** What the partner says (French). */
  text: string;
  /** Piper clip for the line (never device TTS in scored contexts). */
  clipId: string;
  /** Authored slower/simpler variant for the §29 rephrase support move. */
  rephraseText?: string;
  rephraseClipId?: string;
  next: string;
};

export type ExpectedIntent = {
  /** Authored intent id (provide_name, answer_yes, ask_price, …). */
  intent: string;
  /** Whole-utterance variants (n-best matched, folded, digits-aware). */
  acceptedVariants: string[];
  /** Alternative: concept slots that must all appear in ONE transcript. */
  requiredConcepts?: string[][];
  next: string;
};

export type LearnerNode = {
  kind: "learner";
  id: string;
  /** English guidance shown in learning mode ("Order something to drink"). */
  prompt: string;
  expected: ExpectedIntent[];
  /**
   * Where an unmatched final sends the conversation (an authored repair
   * branch — typically a partner rephrase that asks again). Never a dead
   * end (validator-enforced).
   */
  noMatchNext: string;
  /** Scored scenarios judge this node; purely social turns may opt out. */
  scored: boolean;
};

export type TerminalNode = {
  kind: "terminal";
  id: string;
  outcome: "goal_met" | "goal_not_met";
  /** Optional closing partner line. */
  text?: string;
  clipId?: string;
};

export type InteractionNode = PartnerNode | LearnerNode | TerminalNode;

export type InteractionScenario = {
  id: string;
  title: string;
  /** English description of the communicative goal ("order a drink"). */
  goal: string;
  taskFamily: "conversation" | "information_exchange" | "transaction";
  objectiveRefs: string[];
  startNodeId: string;
  nodes: Record<string, InteractionNode>;
  support: { allowRepeat: boolean; allowRephrase: boolean };
  reserved: boolean;
};

export type TurnRecord =
  | { speaker: "partner"; nodeId: string; text: string; rephrased: boolean }
  | { speaker: "learner"; nodeId: string; heard: string; matchedIntent: string | null };

export type InteractionState = {
  scenarioId: string;
  currentNodeId: string;
  history: TurnRecord[];
  /** First-judgment verdict per SCORED learner node (§37). */
  judged: Record<string, { matchedFirstTry: boolean; intent: string | null }>;
  supportUsed: number;
  repairMoves: number;
  /** Technical/silent attempts — never judgments (§71). */
  technicalRetries: number;
  finished: null | {
    outcome: "goal_met" | "goal_not_met";
    /** True only when the goal was met AND every scored node matched on
     *  its first judged final — the scenario-level PASS for scoring. */
    passedFirstTry: boolean;
  };
};

export type InteractionEvent =
  /** Partner/terminal line finished presenting — move on. */
  | { type: "advance" }
  /** A FINAL recognition arrived for the current learner node. */
  | { type: "learnerFinal"; finalTranscript: string; alternatives: string[] }
  /** Silence or technical outcome — never judged, partner re-asks. */
  | { type: "technical" }
  /** §29 support moves (tracking only; playback is the screen's job). */
  | { type: "repeatRequested" }
  | { type: "rephraseRequested" };

export function startInteraction(scenario: InteractionScenario): InteractionState {
  const state: InteractionState = {
    scenarioId: scenario.id,
    currentNodeId: scenario.startNodeId,
    history: [],
    judged: {},
    supportUsed: 0,
    repairMoves: 0,
    technicalRetries: 0,
    finished: null,
  };
  return enterNode(scenario, state, scenario.startNodeId, false);
}

/** Deterministic intent match over the final n-best; authored order wins. */
export function matchIntent(
  node: LearnerNode,
  finals: { finalTranscript: string; alternatives: string[] }
): ExpectedIntent | null {
  for (const expected of node.expected) {
    const grade = gradeSpokenAttempt(finals, {
      acceptedVariants: expected.acceptedVariants,
      requiredConcepts: expected.requiredConcepts,
    });
    if (grade.correct) return expected;
  }
  return null;
}

function enterNode(
  scenario: InteractionScenario,
  state: InteractionState,
  nodeId: string,
  viaRepair: boolean
): InteractionState {
  const node = scenario.nodes[nodeId];
  if (!node) {
    // Authoring error — validator-impossible; fail closed as not-met.
    return {
      ...state,
      currentNodeId: nodeId,
      finished: { outcome: "goal_not_met", passedFirstTry: false },
    };
  }
  if (node.kind === "partner") {
    return {
      ...state,
      currentNodeId: nodeId,
      repairMoves: viaRepair ? state.repairMoves + 1 : state.repairMoves,
      history: [
        ...state.history,
        { speaker: "partner", nodeId, text: node.text, rephrased: false },
      ],
    };
  }
  if (node.kind === "terminal") {
    const scoredNodes = Object.values(scenario.nodes).filter(
      (n): n is LearnerNode => n.kind === "learner" && n.scored
    );
    const passedFirstTry =
      node.outcome === "goal_met" &&
      scoredNodes.every((n) => state.judged[n.id]?.matchedFirstTry === true);
    return {
      ...state,
      currentNodeId: nodeId,
      history: node.text
        ? [
            ...state.history,
            { speaker: "partner", nodeId, text: node.text, rephrased: false },
          ]
        : state.history,
      finished: { outcome: node.outcome, passedFirstTry },
    };
  }
  return { ...state, currentNodeId: nodeId };
}

export function interactionReducer(
  scenario: InteractionScenario,
  state: InteractionState,
  event: InteractionEvent
): InteractionState {
  if (state.finished) return state; // terminal immunity
  const node = scenario.nodes[state.currentNodeId];
  if (!node) return state;

  switch (event.type) {
    case "advance": {
      if (node.kind !== "partner") return state;
      return enterNode(scenario, state, node.next, false);
    }
    case "learnerFinal": {
      if (node.kind !== "learner") return state;
      const matched = matchIntent(node, event);
      const firstJudgment = !(node.id in state.judged);
      const judged =
        node.scored && firstJudgment
          ? {
              ...state.judged,
              [node.id]: {
                matchedFirstTry: matched !== null,
                intent: matched?.intent ?? null,
              },
            }
          : state.judged;
      const withTurn: InteractionState = {
        ...state,
        judged,
        history: [
          ...state.history,
          {
            speaker: "learner",
            nodeId: node.id,
            heard: event.finalTranscript,
            matchedIntent: matched?.intent ?? null,
          },
        ],
      };
      if (matched) return enterNode(scenario, withTurn, matched.next, false);
      // Unmatched final: authored repair branch — the conversation goes on,
      // but a scored node's first judgment (above) already stands (§37).
      return enterNode(scenario, withTurn, node.noMatchNext, true);
    }
    case "technical": {
      if (node.kind !== "learner") return state;
      // Never judged (§71): stay on the node; the screen re-opens the mic.
      return { ...state, technicalRetries: state.technicalRetries + 1 };
    }
    case "repeatRequested": {
      if (!scenario.support.allowRepeat) return state;
      return { ...state, supportUsed: state.supportUsed + 1 };
    }
    case "rephraseRequested": {
      if (!scenario.support.allowRephrase) return state;
      // Mark the most recent partner line as rephrased for the transcript.
      const history = [...state.history];
      for (let i = history.length - 1; i >= 0; i--) {
        const turn = history[i];
        if (turn.speaker === "partner") {
          history[i] = { ...turn, rephrased: true };
          break;
        }
      }
      return { ...state, supportUsed: state.supportUsed + 1, history };
    }
  }
}

/** The learner node currently awaiting speech, if any. */
export function currentLearnerNode(
  scenario: InteractionScenario,
  state: InteractionState
): LearnerNode | null {
  const node = scenario.nodes[state.currentNodeId];
  return node && node.kind === "learner" && !state.finished ? node : null;
}

/** The partner node currently presenting, if any. */
export function currentPartnerNode(
  scenario: InteractionScenario,
  state: InteractionState
): PartnerNode | null {
  const node = scenario.nodes[state.currentNodeId];
  return node && node.kind === "partner" && !state.finished ? node : null;
}

/**
 * Scenario-level result for assessment surfaces (§36-37): PASS requires
 * the goal AND clean first-judgment turns. A run that never reached a
 * terminal (abandoned, or speech stayed technical throughout) is
 * INCOMPLETE — the insufficient-evidence path, never a failure (§71).
 * A run that DID reach a terminal was the learner's real exchange: a
 * miss-route into a goal_not_met terminal is a judged non-pass, not
 * incompleteness.
 */
export type InteractionResult = {
  goalMet: boolean;
  passedFirstTry: boolean;
  scoredTurns: number;
  matchedFirstTry: number;
  supportUsed: number;
  repairMoves: number;
  technicallyIncomplete: boolean;
};

export function interactionResult(
  scenario: InteractionScenario,
  state: InteractionState
): InteractionResult {
  const scoredNodes = Object.values(scenario.nodes).filter(
    (n): n is LearnerNode => n.kind === "learner" && n.scored
  );
  const matched = scoredNodes.filter(
    (n) => state.judged[n.id]?.matchedFirstTry === true
  ).length;
  return {
    goalMet: state.finished?.outcome === "goal_met",
    passedFirstTry: state.finished?.passedFirstTry === true,
    scoredTurns: scoredNodes.length,
    matchedFirstTry: matched,
    supportUsed: state.supportUsed,
    repairMoves: state.repairMoves,
    technicallyIncomplete: state.finished === null,
  };
}

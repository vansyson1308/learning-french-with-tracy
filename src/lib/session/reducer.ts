/**
 * Pure session state-machine. Owns queue mechanics, retry insertion, status,
 * answers, first-attempt results, attempt counts and completion — with zero
 * React/store/side-effect knowledge, so every rule is unit-testable.
 *
 * Grading happens here (via the pure grading module); effects — sound,
 * haptics, evidence submission, persistence, navigation — live in the
 * controller, keyed off state transitions.
 */

import { checkAnswer, type Answer } from "../grading";

import type { SessionStep } from "./types";

export type StepStatus = "idle" | "correct" | "wrong";

export type SessionMachineState = {
  /** Stable for the whole session; set once by "start". */
  sessionId: string;
  /** The frozen plan — never changes after start. */
  steps: SessionStep[];
  /** Active queue: plan order plus retries appended at the end. */
  queue: SessionStep[];
  index: number;
  status: StepStatus;
  answer: Answer;
  /** Steps completed (teach continues + correct exercise checks, retries included). */
  completedCount: number;
  /** stepId → times answered wrong (drives perfect + retry bookkeeping). */
  wrongCounts: Record<string, number>;
  /** stepId → attempts made so far (0 before the first check). */
  attempts: Record<string, number>;
  /** stepId → correctness of the FIRST attempt only (exercise steps). */
  firstResults: Record<string, boolean>;
  finished: boolean;
};

export type SessionAction =
  | { type: "start"; sessionId: string; steps: SessionStep[] }
  | { type: "answer"; value: Answer }
  | { type: "check" }
  | { type: "matchComplete"; wrongAttempts: number }
  | { type: "teachContinue" }
  | { type: "continue" }
  | { type: "undoCurrent" };

export function emptySessionState(): SessionMachineState {
  return {
    sessionId: "",
    steps: [],
    queue: [],
    index: 0,
    status: "idle",
    answer: null,
    completedCount: 0,
    wrongCounts: {},
    attempts: {},
    firstResults: {},
    finished: false,
  };
}

export function currentStep(state: SessionMachineState): SessionStep | undefined {
  return state.queue[state.index];
}

export function isPerfect(state: SessionMachineState): boolean {
  return Object.keys(state.wrongCounts).length === 0;
}

/** First-attempt accuracy over exercise steps that were actually attempted. */
export function firstAttemptAccuracy(state: SessionMachineState): number | null {
  const results = Object.values(state.firstResults);
  if (results.length === 0) return null;
  return results.filter(Boolean).length / results.length;
}

/** Progress toward completion in [0, 1]; retries don't shrink it. */
export function sessionProgress(state: SessionMachineState): number {
  if (state.steps.length === 0) return 0;
  return Math.min(1, state.completedCount / state.steps.length);
}

function advance(state: SessionMachineState, requeueCurrent: boolean): SessionMachineState {
  const step = state.queue[state.index];
  const queue = requeueCurrent && step ? [...state.queue, step] : state.queue;
  const index = state.index + 1;
  return {
    ...state,
    queue,
    index,
    status: "idle",
    answer: null,
    finished: index >= queue.length && state.queue.length > 0,
  };
}

export function sessionReducer(
  state: SessionMachineState,
  action: SessionAction
): SessionMachineState {
  switch (action.type) {
    case "start":
      return {
        ...emptySessionState(),
        sessionId: action.sessionId,
        steps: action.steps,
        queue: action.steps,
        finished: false,
      };

    case "answer": {
      const step = currentStep(state);
      if (!step || step.type !== "exercise" || state.status !== "idle") return state;
      return { ...state, answer: action.value };
    }

    case "check": {
      const step = currentStep(state);
      if (!step || step.type !== "exercise" || state.status !== "idle") return state;
      const correct = checkAnswer(step.exercise, state.answer);
      const attempt = state.attempts[step.stepId] ?? 0;
      const firstResults =
        attempt === 0
          ? { ...state.firstResults, [step.stepId]: correct }
          : state.firstResults;
      return {
        ...state,
        status: correct ? "correct" : "wrong",
        attempts: { ...state.attempts, [step.stepId]: attempt + 1 },
        firstResults,
        completedCount: correct ? state.completedCount + 1 : state.completedCount,
        wrongCounts: correct
          ? state.wrongCounts
          : {
              ...state.wrongCounts,
              [step.stepId]: (state.wrongCounts[step.stepId] ?? 0) + 1,
            },
      };
    }

    case "matchComplete": {
      const step = currentStep(state);
      if (!step || step.type !== "exercise" || state.status !== "idle") return state;
      const wrong = action.wrongAttempts > 0;
      const attempt = state.attempts[step.stepId] ?? 0;
      const next: SessionMachineState = {
        ...state,
        attempts: { ...state.attempts, [step.stepId]: attempt + 1 },
        firstResults:
          attempt === 0
            ? { ...state.firstResults, [step.stepId]: !wrong }
            : state.firstResults,
        completedCount: wrong ? state.completedCount : state.completedCount + 1,
        wrongCounts: wrong
          ? {
              ...state.wrongCounts,
              [step.stepId]: (state.wrongCounts[step.stepId] ?? 0) + 1,
            }
          : state.wrongCounts,
      };
      // Match auto-advances (no feedback footer): wrong plays re-queue.
      return advance(next, wrong);
    }

    case "teachContinue": {
      // Acknowledge-only steps: teach cards and concept steps share the
      // same mechanics — advance on Continue, count toward progress, no
      // grading and no retry semantics.
      const step = currentStep(state);
      if (!step || (step.type !== "teach" && step.type !== "concept")) return state;
      return advance({ ...state, completedCount: state.completedCount + 1 }, false);
    }

    case "continue": {
      const step = currentStep(state);
      if (!step || step.type !== "exercise" || state.status === "idle") return state;
      return advance(state, state.status === "wrong");
    }

    case "undoCurrent": {
      // Reverts the just-answered check so the learner can retry cleanly.
      // The store-side scheduler/log rollback is the controller's job; this
      // only rewinds session bookkeeping for the CURRENT answered step.
      const step = currentStep(state);
      if (!step || step.type !== "exercise" || state.status === "idle") return state;
      const attempt = state.attempts[step.stepId] ?? 1;
      const wasFirst = attempt === 1;
      const wrongCounts = { ...state.wrongCounts };
      if (state.status === "wrong") {
        const count = (wrongCounts[step.stepId] ?? 1) - 1;
        if (count <= 0) delete wrongCounts[step.stepId];
        else wrongCounts[step.stepId] = count;
      }
      const firstResults = { ...state.firstResults };
      if (wasFirst) delete firstResults[step.stepId];
      return {
        ...state,
        status: "idle",
        answer: null,
        attempts: { ...state.attempts, [step.stepId]: Math.max(0, attempt - 1) },
        firstResults,
        completedCount:
          state.status === "correct"
            ? Math.max(0, state.completedCount - 1)
            : state.completedCount,
        wrongCounts,
      };
    }
  }
}

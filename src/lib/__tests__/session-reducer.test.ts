import { describe, expect, test } from "bun:test";

import {
  currentStep,
  emptySessionState,
  firstAttemptAccuracy,
  isPerfect,
  sessionProgress,
  sessionReducer,
  type SessionAction,
  type SessionMachineState,
} from "../session/reducer";
import type { ExerciseStep, SessionStep, TeachStep } from "../session/types";
import type { SelectExercise } from "../types";

function select(id: string, correct = 0): SelectExercise {
  return {
    type: "select",
    id,
    mode: "targetToNative",
    prompt: id,
    options: [{ text: "right" }, { text: "wrong-a" }, { text: "wrong-b" }],
    correct,
  };
}

function exStep(id: string): ExerciseStep {
  return { type: "exercise", stepId: id, exercise: select(id) };
}

function teachStep(id: string): TeachStep {
  return {
    type: "teach",
    stepId: id,
    itemId: `fr:w:${id}`,
    word: { target: id, native: `${id}-en`, emoji: "🍞" },
  };
}

function start(steps: SessionStep[]): SessionMachineState {
  return sessionReducer(emptySessionState(), { type: "start", sessionId: "s-1", steps });
}

function run(state: SessionMachineState, ...actions: SessionAction[]) {
  return actions.reduce(sessionReducer, state);
}

const answerRight: SessionAction = { type: "answer", value: 0 };
const answerWrong: SessionAction = { type: "answer", value: 1 };

describe("session reducer: core flow", () => {
  test("start freezes the plan and resets everything", () => {
    const s = start([exStep("a"), exStep("b")]);
    expect(s.sessionId).toBe("s-1");
    expect(s.queue).toHaveLength(2);
    expect(s.steps).toHaveLength(2);
    expect(currentStep(s)!.stepId).toBe("a");
    expect(s.finished).toBe(false);
    expect(s.status).toBe("idle");
  });

  test("correct answer: status, counters, first result; continue advances", () => {
    let s = run(start([exStep("a"), exStep("b")]), answerRight, { type: "check" });
    expect(s.status).toBe("correct");
    expect(s.completedCount).toBe(1);
    expect(s.firstResults["a"]).toBe(true);
    expect(s.attempts["a"]).toBe(1);
    expect(isPerfect(s)).toBe(true);
    s = sessionReducer(s, { type: "continue" });
    expect(currentStep(s)!.stepId).toBe("b");
    expect(s.status).toBe("idle");
    expect(s.answer).toBeNull();
    expect(s.queue).toHaveLength(2); // no requeue on correct
  });

  test("wrong answer: requeued on continue, session not perfect", () => {
    let s = run(start([exStep("a"), exStep("b")]), answerWrong, { type: "check" });
    expect(s.status).toBe("wrong");
    expect(s.completedCount).toBe(0);
    expect(s.firstResults["a"]).toBe(false);
    expect(s.wrongCounts["a"]).toBe(1);
    expect(isPerfect(s)).toBe(false);
    s = sessionReducer(s, { type: "continue" });
    expect(s.queue.map((q) => q.stepId)).toEqual(["a", "b", "a"]);
    expect(currentStep(s)!.stepId).toBe("b");
  });

  test("finishes after the last queued step, including retries", () => {
    let s = start([exStep("a")]);
    s = run(s, answerWrong, { type: "check" }, { type: "continue" });
    expect(s.finished).toBe(false); // retry pending
    s = run(s, answerRight, { type: "check" }, { type: "continue" });
    expect(s.finished).toBe(true);
    expect(s.completedCount).toBe(1);
    expect(s.attempts["a"]).toBe(2);
    expect(s.firstResults["a"]).toBe(false); // retry can't rewrite history
  });

  test("multiple wrong retries keep requeueing until correct", () => {
    let s = start([exStep("a")]);
    for (let i = 0; i < 3; i++) {
      s = run(s, answerWrong, { type: "check" }, { type: "continue" });
    }
    expect(s.wrongCounts["a"]).toBe(3);
    expect(s.queue).toHaveLength(4);
    s = run(s, answerRight, { type: "check" }, { type: "continue" });
    expect(s.finished).toBe(true);
    expect(firstAttemptAccuracy(s)).toBe(0);
  });

  test("empty session: no crash, never finishes on its own", () => {
    const s = start([]);
    expect(currentStep(s)).toBeUndefined();
    expect(sessionReducer(s, { type: "continue" })).toEqual(s);
    expect(s.finished).toBe(false);
    expect(sessionProgress(s)).toBe(0);
  });
});

describe("session reducer: teach steps", () => {
  test("teach → continue advances and counts progress; check is a no-op", () => {
    let s = start([teachStep("pain"), exStep("a")]);
    expect(sessionReducer(s, { type: "check" })).toEqual(s); // teach can't be checked
    expect(sessionReducer(s, answerRight)).toEqual(s); // or answered
    s = sessionReducer(s, { type: "teachContinue" });
    expect(s.completedCount).toBe(1);
    expect(currentStep(s)!.stepId).toBe("a");
    expect(s.firstResults["pain"]).toBeUndefined(); // teach has no accuracy
  });

  test("teachContinue on an exercise step is a no-op", () => {
    const s = start([exStep("a")]);
    expect(sessionReducer(s, { type: "teachContinue" })).toEqual(s);
  });
});

describe("session reducer: match", () => {
  test("clean match auto-advances and counts", () => {
    const s = run(start([exStep("m"), exStep("b")]), {
      type: "matchComplete",
      wrongAttempts: 0,
    });
    expect(s.completedCount).toBe(1);
    expect(currentStep(s)!.stepId).toBe("b");
    expect(s.firstResults["m"]).toBe(true);
  });

  test("match with wrong attempts requeues and marks wrong", () => {
    const s = run(start([exStep("m")]), { type: "matchComplete", wrongAttempts: 2 });
    expect(s.wrongCounts["m"]).toBe(1);
    expect(s.queue.map((q) => q.stepId)).toEqual(["m", "m"]);
    expect(s.finished).toBe(false);
  });
});

describe("session reducer: undoCurrent", () => {
  test("undo after correct rewinds counters and first result", () => {
    let s = run(start([exStep("a")]), answerRight, { type: "check" });
    s = sessionReducer(s, { type: "undoCurrent" });
    expect(s.status).toBe("idle");
    expect(s.answer).toBeNull();
    expect(s.completedCount).toBe(0);
    expect(s.attempts["a"]).toBe(0);
    expect(s.firstResults["a"]).toBeUndefined();
    // Re-answering counts as a genuine first attempt again.
    s = run(s, answerRight, { type: "check" });
    expect(s.firstResults["a"]).toBe(true);
    expect(s.attempts["a"]).toBe(1);
  });

  test("undo after wrong decrements wrongCounts and restores perfect", () => {
    let s = run(start([exStep("a")]), answerWrong, { type: "check" });
    s = sessionReducer(s, { type: "undoCurrent" });
    expect(s.wrongCounts["a"]).toBeUndefined();
    expect(isPerfect(s)).toBe(true);
  });

  test("undo of a retry check does not erase the first-attempt record", () => {
    let s = start([exStep("a")]);
    s = run(s, answerWrong, { type: "check" }, { type: "continue" }); // first attempt wrong
    s = run(s, answerRight, { type: "check" }); // now on the retry (attempt 2), correct
    s = sessionReducer(s, { type: "undoCurrent" });
    expect(s.firstResults["a"]).toBe(false); // history intact
    expect(s.attempts["a"]).toBe(1);
    expect(s.wrongCounts["a"]).toBe(1);
  });

  test("undo with nothing answered is a no-op", () => {
    const s = start([exStep("a")]);
    expect(sessionReducer(s, { type: "undoCurrent" })).toEqual(s);
  });
});

describe("session reducer: guards and identity", () => {
  test("answer/check are ignored once a status is showing", () => {
    let s = run(start([exStep("a")]), answerRight, { type: "check" });
    const after = run(s, answerWrong, { type: "check" });
    expect(after).toEqual(s); // can't change the answer post-grade
  });

  test("sessionId never changes after start, whatever happens", () => {
    let s = start([exStep("a"), teachStep("t"), exStep("b")]);
    const script: SessionAction[] = [
      answerWrong,
      { type: "check" },
      { type: "undoCurrent" },
      answerRight,
      { type: "check" },
      { type: "continue" },
      { type: "teachContinue" },
      answerWrong,
      { type: "check" },
      { type: "continue" },
      answerRight,
      { type: "check" },
      { type: "continue" },
    ];
    for (const action of script) {
      s = sessionReducer(s, action);
      expect(s.sessionId).toBe("s-1");
      expect(s.steps).toHaveLength(3); // frozen plan untouched
    }
    expect(s.finished).toBe(true);
  });

  test("a new start replaces everything, including sessionId", () => {
    let s = run(start([exStep("a")]), answerRight, { type: "check" });
    s = sessionReducer(s, { type: "start", sessionId: "s-2", steps: [exStep("z")] });
    expect(s.sessionId).toBe("s-2");
    expect(s.completedCount).toBe(0);
    expect(currentStep(s)!.stepId).toBe("z");
  });

  test("first-attempt accuracy: retried wrong stays counted as wrong", () => {
    let s = start([exStep("a"), exStep("b")]);
    s = run(s, answerRight, { type: "check" }, { type: "continue" }); // a right
    s = run(s, answerWrong, { type: "check" }, { type: "continue" }); // b wrong
    s = run(s, answerRight, { type: "check" }, { type: "continue" }); // b retry right
    expect(s.finished).toBe(true);
    expect(firstAttemptAccuracy(s)).toBe(0.5);
    expect(s.completedCount).toBe(2);
    expect(sessionProgress(s)).toBe(1);
  });
});

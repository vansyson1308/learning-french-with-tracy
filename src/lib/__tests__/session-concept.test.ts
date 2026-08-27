/**
 * ConceptStep mechanics (Phase 5B §48): Continue-only, counts toward
 * progress, never grades, never enters retry/first-attempt bookkeeping —
 * and lesson flows interleave concepts with exercises without ever
 * dropping or duplicating graded work.
 */
import { describe, expect, test } from "bun:test";

import {
  emptySessionState,
  sessionProgress,
  sessionReducer,
  type SessionMachineState,
} from "../session/reducer";
import { lessonSteps } from "../session/sources";
import type { ConceptStep, SessionStep } from "../session/types";
import type { Exercise, LessonPack } from "../types";

const select = (id: string): Exercise => ({
  type: "select",
  id,
  mode: "targetToNative",
  prompt: "chat",
  audioTarget: "chat",
  options: [{ text: "cat" }, { text: "dog" }, { text: "hat" }, { text: "bat" }],
  correct: 0,
});

const conceptStep = (id: string): ConceptStep => ({
  type: "concept",
  stepId: `concept:0:${id}`,
  conceptId: id,
});

function started(steps: SessionStep[]): SessionMachineState {
  return sessionReducer(emptySessionState(), { type: "start", sessionId: "s", steps });
}

describe("reducer: concept steps", () => {
  const steps: SessionStep[] = [
    conceptStep("fr:concept:gender-two-classes"),
    { type: "exercise", stepId: "e1", exercise: select("e1") },
  ];

  test("Continue advances, counts progress, and touches no grading state", () => {
    const s0 = started(steps);
    expect(sessionProgress(s0)).toBe(0);
    const s1 = sessionReducer(s0, { type: "teachContinue" });
    expect(s1.index).toBe(1);
    expect(s1.completedCount).toBe(1);
    expect(s1.attempts).toEqual({});
    expect(s1.firstResults).toEqual({});
    expect(s1.wrongCounts).toEqual({});
    expect(sessionProgress(s1)).toBe(0.5);
  });

  test("grading actions are inert on a concept step", () => {
    const s0 = started(steps);
    expect(sessionReducer(s0, { type: "answer", value: 0 })).toBe(s0);
    expect(sessionReducer(s0, { type: "check" })).toBe(s0);
    expect(sessionReducer(s0, { type: "continue" })).toBe(s0);
    expect(sessionReducer(s0, { type: "undoCurrent" })).toBe(s0);
  });

  test("a concept-only session finishes cleanly through Continue", () => {
    const s0 = started([conceptStep("fr:concept:gender-two-classes")]);
    const s1 = sessionReducer(s0, { type: "teachContinue" });
    expect(s1.finished).toBe(true);
  });
});

describe("lessonSteps: explicit flow", () => {
  const lesson: LessonPack = {
    id: "l1",
    title: "Lesson",
    exercises: [select("e1"), select("e2")],
    flow: [
      { concept: "fr:concept:gender-two-classes" },
      { exercise: "e1" },
      { concept: "fr:concept:gender-two-classes" },
      { exercise: "e2" },
    ],
  };

  test("flow interleaves concept and exercise steps in order with unique step ids", () => {
    const steps = lessonSteps(lesson);
    expect(steps.map((s) => s.type)).toEqual(["concept", "exercise", "concept", "exercise"]);
    const ids = steps.map((s) => s.stepId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(steps[1]).toMatchObject({ type: "exercise", stepId: "e1" });
  });

  test("without a flow, the steps are exactly the exercises in order", () => {
    const plain: LessonPack = { id: "l2", title: "L", exercises: [select("a"), select("b")] };
    expect(lessonSteps(plain).map((s) => s.stepId)).toEqual(["a", "b"]);
  });

  test("a dangling flow reference fails loudly, never silently drops work", () => {
    const broken: LessonPack = {
      id: "l3",
      title: "L",
      exercises: [select("a")],
      flow: [{ exercise: "ghost" }],
    };
    expect(() => lessonSteps(broken)).toThrow(/missing exercise ghost/);
  });
});

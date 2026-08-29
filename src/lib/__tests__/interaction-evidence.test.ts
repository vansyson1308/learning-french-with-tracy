/**
 * Interaction evidence boundary + skip gate (P9 §35-§36, §71, §80):
 * a whole-scenario interaction step is OBJECTIVE evidence via checkpoints
 * only — it never mints lexical FSRS evidence of any skill — and the
 * device-dependent skip escape works in every session kind, so a learner
 * without a microphone is never trapped (skip → insufficient evidence,
 * never a failure).
 */
import { describe, expect, test } from "bun:test";

import { answerIsReady, checkAnswer, correctAnswerText, type InteractionAnswer } from "../grading";
import { buildCheckEvidence, evidencePlanFor } from "../session/evidence";
import { skipAllowed } from "../session/reducer";
import type { ExerciseStep, SessionDefinition } from "../session/types";
import type { InteractionScenarioExercise } from "../types";

const exercise: InteractionScenarioExercise = {
  type: "interactionScenario",
  id: "ix-1",
  scenarioId: "fr.scenario.test_cafe",
};

const step: ExerciseStep = { type: "exercise", stepId: exercise.id, exercise };

function definitionOf(kind: SessionDefinition["kind"]): SessionDefinition {
  return {
    kind,
    courseId: "fr-en",
    lessonId: kind === "path" ? "fr-en:uo-l0" : kind,
    steps: [],
    completion: kind === "path" ? "lesson" : "practice",
    evidenceSource: "lesson",
    trackMistakes: false,
    allowUndo: false,
  };
}

function answerOf(partial: Partial<InteractionAnswer>): InteractionAnswer {
  return {
    interaction: true,
    goalMet: true,
    passedFirstTry: true,
    scoredTurns: 2,
    matchedFirstTry: 2,
    supportUsed: 0,
    repairMoves: 0,
    technicallyIncomplete: false,
    ...partial,
  };
}

describe("interaction steps never mint lexical FSRS evidence (§35)", () => {
  test("evidencePlanFor is null in lessons, practice, and TODAY", () => {
    for (const kind of ["path", "review", "today"] as const) {
      expect(evidencePlanFor(definitionOf(kind), step)).toBeNull();
    }
  });

  test("buildCheckEvidence yields nothing — the scheduler never hears about a conversation", () => {
    const evidence = buildCheckEvidence({
      definition: definitionOf("path"),
      step,
      sessionId: "s1",
      correct: true,
      attemptIndex: 0,
      latencyMs: 60_000,
    });
    expect(evidence).toBeNull();
  });
});

describe("the skip gate (§36; P8 §24 regression)", () => {
  test("device-dependent steps are skippable in EVERY session kind", () => {
    for (const kind of ["path", "review", "today", "checkpoint", "placement"] as const) {
      expect(skipAllowed(kind, "interactionScenario")).toBe(true);
      expect(skipAllowed(kind, "speakProduction")).toBe(true);
      expect(skipAllowed(kind, "speakRepetition")).toBe(true);
      expect(skipAllowed(kind, "listeningComprehension")).toBe(true);
      expect(skipAllowed(kind, "dictation")).toBe(true);
    }
  });

  test("knowledge steps skip only in placement ('I don't know')", () => {
    expect(skipAllowed("placement", "select")).toBe(true);
    expect(skipAllowed("placement", "guidedWriting")).toBe(true);
    for (const kind of ["path", "review", "today", "checkpoint"] as const) {
      expect(skipAllowed(kind, "select")).toBe(false);
      expect(skipAllowed(kind, "typeAnswer")).toBe(false);
      expect(skipAllowed(kind, "guidedWriting")).toBe(false);
      expect(skipAllowed(kind, "simpleForm")).toBe(false);
    }
  });
});

describe("whole-scenario grading contract (§36-§37)", () => {
  test("correct = goal met AND clean first-judgment turns AND complete", () => {
    expect(checkAnswer(exercise, answerOf({}))).toBe(true);
    expect(checkAnswer(exercise, answerOf({ goalMet: false }))).toBe(false);
    expect(
      checkAnswer(exercise, answerOf({ passedFirstTry: false, matchedFirstTry: 1 }))
    ).toBe(false);
    expect(checkAnswer(exercise, answerOf({ technicallyIncomplete: true }))).toBe(false);
  });

  test("support never fails the learner (§29): repeat/rephrase-heavy passes stay passes", () => {
    expect(checkAnswer(exercise, answerOf({ supportUsed: 5 }))).toBe(true);
  });

  test("readiness requires a COMPLETED conversation; incompleteness routes to skip, not Check", () => {
    expect(answerIsReady(exercise, null)).toBe(false);
    expect(answerIsReady(exercise, answerOf({}))).toBe(true);
    expect(answerIsReady(exercise, answerOf({ technicallyIncomplete: true }))).toBe(false);
  });

  test("no single 'correct sentence' exists for a conversation", () => {
    expect(correctAnswerText(exercise)).toBe("");
  });
});

/**
 * articleSelect (Phase 5B §54–58): grading, registry behavior, and the
 * hard §58 guarantee — grammar answers are practice evidence on the
 * drilled noun's lexeme and can NEVER be scheduler assessments.
 */
import { describe, expect, test } from "bun:test";

import { behaviorFor } from "../exercise-registry";
import { answerIsReady, checkAnswer, correctAnswerText } from "../grading";
import { evidencePlanFor } from "../session/evidence";
import type { ExerciseStep, SessionDefinition } from "../session/types";
import type { ArticleSelectExercise } from "../types";

const drill = (over: Partial<ArticleSelectExercise> = {}): ArticleSelectExercise => ({
  type: "articleSelect",
  id: "gx1",
  articles: ["le", "la"],
  noun: "pomme",
  gloss: "the apple",
  correct: 1,
  ...over,
});

describe("grading", () => {
  test("index equality, readiness, and correct-answer display", () => {
    const exercise = drill();
    expect(checkAnswer(exercise, 1)).toBe(true);
    expect(checkAnswer(exercise, 0)).toBe(false);
    expect(answerIsReady(exercise, null)).toBe(false);
    expect(answerIsReady(exercise, 0)).toBe(true);
    expect(correctAnswerText(exercise)).toBe("la pomme");
  });

  test("registry: grammarChoice modality, not self-advancing", () => {
    const behavior = behaviorFor(drill());
    expect(behavior.modality(drill())).toBe("grammarChoice");
    expect(behavior.selfAdvancing).toBe(false);
  });
});

describe("§58 evidence: practice on the noun's lexeme, never assessment", () => {
  const definition = (courseId: string): SessionDefinition => ({
    kind: "path",
    courseId,
    lessonId: "l1",
    steps: [],
    completion: "lesson",
    evidenceSource: "lesson",
    trackMistakes: true,
    allowUndo: false,
  });
  const step = (exercise: ArticleSelectExercise): ExerciseStep => ({
    type: "exercise",
    stepId: exercise.id,
    exercise,
  });

  test("a curated noun resolves to its lexeme with srsRole practice", () => {
    const plan = evidencePlanFor(definition("fr-en"), step(drill()));
    expect(plan).toEqual({ itemId: "fr:w:pomme", srsRole: "practice" });
  });

  test("an unknown noun yields no evidence — never a guessed id", () => {
    expect(evidencePlanFor(definition("fr-en"), step(drill({ noun: "zzz" })))).toBeNull();
  });

  test("outside the French course there is no plan at all", () => {
    expect(evidencePlanFor(definition("es-en"), step(drill()))).toBeNull();
  });

  test("an explicit step plan can never make a grammar drill an assessment by accident", () => {
    // Planners set step.evidence explicitly; for articleSelect the sources
    // never do — this pins that the default derivation alone can only say
    // "practice".
    const plan = evidencePlanFor(definition("fr-en"), step(drill()));
    expect(plan?.srsRole).toBe("practice");
  });
});

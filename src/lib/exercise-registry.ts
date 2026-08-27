/**
 * Exercise behavior registry (Phase 3). ONE place describes how each of the
 * five exercise types behaves — readiness, grading, correct-answer display,
 * evidence modality, advance style — replacing the per-type switch sites
 * that were spread across the lesson screen.
 *
 * Pure metadata only: React renderers live in
 * src/components/session/exercise-renderer.tsx; the pure grading helpers
 * (already clean) are delegated to, not duplicated.
 */

import {
  answerIsReady,
  checkAnswer,
  correctAnswerText,
  type Answer,
} from "./grading";
import type { Modality } from "./learning/evidence";
import type { Exercise } from "./types";

export type ExerciseBehavior = {
  /** Enables the Check button. */
  isReady(exercise: Exercise, answer: Answer): boolean;
  /** Grades a submitted answer. */
  check(exercise: Exercise, answer: Answer): boolean;
  /** Text shown after a wrong answer. */
  answerText(exercise: Exercise): string;
  /** Evidence modality for the interaction. */
  modality(exercise: Exercise): Modality;
  /**
   * Self-advancing types (match) grade themselves during play and skip the
   * Check/Continue footer flow entirely.
   */
  selfAdvancing: boolean;
};

const delegate = {
  isReady: answerIsReady,
  check: checkAnswer,
  answerText: correctAnswerText,
};

export const EXERCISE_BEHAVIOR: Record<Exercise["type"], ExerciseBehavior> = {
  select: {
    ...delegate,
    modality: (exercise) => {
      if (exercise.type !== "select") return "recognizeText";
      if (exercise.mode === "listen") return "listen";
      if (exercise.mode === "nativeToTarget") return "produceText";
      return "recognizeText";
    },
    selfAdvancing: false,
  },
  wordBank: {
    ...delegate,
    modality: () => "arrange",
    selfAdvancing: false,
  },
  match: {
    ...delegate,
    modality: () => "match",
    selfAdvancing: true,
  },
  typeAnswer: {
    ...delegate,
    modality: () => "produceText",
    selfAdvancing: false,
  },
  fillBlank: {
    ...delegate,
    modality: () => "recognizeText",
    selfAdvancing: false,
  },
  articleSelect: {
    ...delegate,
    modality: () => "grammarChoice",
    selfAdvancing: false,
  },
  conjugationCloze: {
    ...delegate,
    modality: () => "produceText",
    selfAdvancing: false,
  },
};

export function behaviorFor(exercise: Exercise): ExerciseBehavior {
  return EXERCISE_BEHAVIOR[exercise.type];
}

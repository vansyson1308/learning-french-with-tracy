/**
 * conjugationCloze (Phase 5B §63–67): STRICT French grading (accents and
 * exact inflection matter), registry behavior, and the §67 guarantee —
 * conjugation production is practice evidence on the verb's lexeme and can
 * NEVER be a scheduler assessment.
 */
import { describe, expect, test } from "bun:test";

import { behaviorFor } from "../exercise-registry";
import {
  answerIsReady,
  checkAnswer,
  correctAnswerText,
  strictEquals,
} from "../grading";
import { evidencePlanFor } from "../session/evidence";
import type { ExerciseStep, SessionDefinition } from "../session/types";
import type { ConjugationClozeExercise } from "../types";

describe("strictEquals — accents and inflection are preserved", () => {
  test("accents distinguish forms (mange ≠ mangé ≠ manges)", () => {
    expect(strictEquals("mange", "mangé", "fr-en")).toBe(false);
    expect(strictEquals("mange", "manges", "fr-en")).toBe(false);
    expect(strictEquals("mangé", "mangé", "fr-en")).toBe(true);
    expect(strictEquals("etes", "êtes", "fr-en")).toBe(false);
  });

  test("case is ignored but nothing else about letters is", () => {
    expect(strictEquals("Suis", "suis", "fr-en")).toBe(true);
    expect(strictEquals("ÊTES", "êtes", "fr-en")).toBe(true);
    expect(strictEquals("suis", "suit", "fr-en")).toBe(false);
  });

  test("Unicode NFC: composed and decomposed accents compare equal", () => {
    expect(strictEquals("mangé", "mangé", "fr-en")).toBe(true);
  });

  test("smart apostrophes and exotic spaces are unified, whitespace collapsed", () => {
    expect(strictEquals("j’ai", "j'ai", "fr-en")).toBe(true);
    expect(strictEquals("va bien", "va bien", "fr-en")).toBe(true);
    expect(strictEquals("  sommes ", "sommes", "fr-en")).toBe(true);
  });
});

const cloze = (over: Partial<ConjugationClozeExercise> = {}): ConjugationClozeExercise => ({
  type: "conjugationCloze",
  id: "cx1",
  sentence: "Tu ___ une pomme.",
  translation: "You eat an apple.",
  verb: "manger",
  cell: "pre:2s",
  answer: "manges",
  alternatives: [],
  ...over,
});

describe("grading", () => {
  test("only the exact inflected form (or a listed variant) is accepted", () => {
    const exercise = cloze();
    expect(checkAnswer(exercise, "manges", "fr-en")).toBe(true);
    expect(checkAnswer(exercise, "Manges", "fr-en")).toBe(true);
    expect(checkAnswer(exercise, "mange", "fr-en")).toBe(false);
    expect(checkAnswer(exercise, "mangé", "fr-en")).toBe(false);
    expect(checkAnswer(exercise, 1, "fr-en")).toBe(false);
  });

  test("alternatives are graded with the same strict comparison", () => {
    const exercise = cloze({ alternatives: ["bouffes"] });
    expect(checkAnswer(exercise, "bouffes", "fr-en")).toBe(true);
    expect(checkAnswer(exercise, "bouffe", "fr-en")).toBe(false);
  });

  test("readiness needs a non-blank string; answer text fills the blank", () => {
    const exercise = cloze();
    expect(answerIsReady(exercise, "")).toBe(false);
    expect(answerIsReady(exercise, "   ")).toBe(false);
    expect(answerIsReady(exercise, "m")).toBe(true);
    expect(correctAnswerText(exercise)).toBe("Tu manges une pomme.");
  });

  test("registry: produceText modality, not self-advancing", () => {
    const behavior = behaviorFor(cloze());
    expect(behavior.modality(cloze())).toBe("produceText");
    expect(behavior.selfAdvancing).toBe(false);
  });
});

describe("§67 evidence: practice on the verb's lexeme, never assessment", () => {
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
  const step = (exercise: ConjugationClozeExercise): ExerciseStep => ({
    type: "exercise",
    stepId: exercise.id,
    exercise,
  });

  test("a curated verb resolves to its lexeme with srsRole practice", () => {
    const plan = evidencePlanFor(definition("fr-en"), step(cloze()));
    expect(plan).toEqual({ itemId: "fr:w:manger", srsRole: "practice" });
  });

  test("an unknown verb yields no evidence — never a guessed id", () => {
    expect(evidencePlanFor(definition("fr-en"), step(cloze({ verb: "zzz" })))).toBeNull();
  });

  test("outside the French course there is no plan at all", () => {
    expect(evidencePlanFor(definition("es-en"), step(cloze()))).toBeNull();
  });
});

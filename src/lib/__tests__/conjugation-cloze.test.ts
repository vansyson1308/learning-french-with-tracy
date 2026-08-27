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
  strictFrenchEquals,
} from "../grading";
import { evidencePlanFor } from "../session/evidence";
import type { ExerciseStep, SessionDefinition } from "../session/types";
import type { ConjugationClozeExercise } from "../types";

describe("strictFrenchEquals — accents and inflection are preserved", () => {
  test("accents distinguish forms (mange ≠ mangé ≠ manges)", () => {
    expect(strictFrenchEquals("mange", "mangé")).toBe(false);
    expect(strictFrenchEquals("mange", "manges")).toBe(false);
    expect(strictFrenchEquals("mangé", "mangé")).toBe(true);
    expect(strictFrenchEquals("etes", "êtes")).toBe(false);
  });

  test("case is ignored but nothing else about letters is", () => {
    expect(strictFrenchEquals("Suis", "suis")).toBe(true);
    expect(strictFrenchEquals("ÊTES", "êtes")).toBe(true);
    expect(strictFrenchEquals("suis", "suit")).toBe(false);
  });

  test("Unicode NFC: composed and decomposed accents compare equal", () => {
    expect(strictFrenchEquals("mangé", "mangé")).toBe(true);
  });

  test("smart apostrophes and exotic spaces are unified, whitespace collapsed", () => {
    expect(strictFrenchEquals("j’ai", "j'ai")).toBe(true);
    expect(strictFrenchEquals("va bien", "va bien")).toBe(true);
    expect(strictFrenchEquals("  sommes ", "sommes")).toBe(true);
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
    expect(checkAnswer(exercise, "manges")).toBe(true);
    expect(checkAnswer(exercise, "Manges")).toBe(true);
    expect(checkAnswer(exercise, "mange")).toBe(false);
    expect(checkAnswer(exercise, "mangé")).toBe(false);
    expect(checkAnswer(exercise, 1)).toBe(false);
  });

  test("alternatives are graded with the same strict comparison", () => {
    const exercise = cloze({ alternatives: ["bouffes"] });
    expect(checkAnswer(exercise, "bouffes")).toBe(true);
    expect(checkAnswer(exercise, "bouffe")).toBe(false);
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

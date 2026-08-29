/**
 * Writing evidence boundary (P9 §62, §78): written production NEVER mints
 * lexical FSRS evidence — no writing cards exist in Phase 9, and a writing
 * step must not touch recognize/listen/speak cards either. Objective-level
 * assessment evidence flows through checkpoints only.
 */
import { describe, expect, test } from "bun:test";

import { answerIsReady, checkAnswer, correctAnswerText } from "../grading";
import { buildCheckEvidence, evidencePlanFor } from "../session/evidence";
import type { ExerciseStep, SessionDefinition } from "../session/types";
import type { GuidedWritingExercise, SimpleFormExercise } from "../types";

const guided: GuidedWritingExercise = {
  type: "guidedWriting",
  id: "gw-1",
  writingTaskId: "fr.write.test_profile",
  writingMode: "guided",
  instruction: "Introduce yourself. Name: Marie. City: Paris.",
  cueFacts: [
    { label: "Name", value: "Marie" },
    { label: "City", value: "Paris" },
  ],
  rubric: {
    requiredSlots: [
      {
        id: "name",
        description: "your name",
        variants: ["je m'appelle Marie", "je suis Marie"],
        cueProvided: true,
      },
      {
        id: "city",
        description: "where you live",
        variants: ["j'habite à Paris", "j'habite Paris"],
        cueProvided: true,
      },
    ],
    minTokens: 4,
    maxTokens: 30,
  },
  modelAnswers: ["Je m'appelle Marie et j'habite à Paris."],
};

const form: SimpleFormExercise = {
  type: "simpleForm",
  id: "sf-1",
  writingTaskId: "fr.write.test_form",
  instruction: "Fill in the registration form.",
  fields: [
    { id: "prenom", label: "First name", slotId: "name" },
    { id: "ville", label: "City", slotId: "city" },
  ],
  rubric: {
    requiredSlots: [
      { id: "name", description: "your name", variants: ["Marie"], cueProvided: true },
      { id: "city", description: "your city", variants: ["Paris"], cueProvided: true },
    ],
    minTokens: 2,
    maxTokens: 10,
  },
  modelAnswers: ["Marie | Paris"],
};

function lessonDefinition(): SessionDefinition {
  return {
    kind: "path",
    courseId: "fr-en",
    lessonId: "fr-en:uo-l0",
    steps: [],
    completion: "lesson",
    evidenceSource: "lesson",
    trackMistakes: true,
    allowUndo: false,
  };
}

function stepOf(exercise: GuidedWritingExercise | SimpleFormExercise): ExerciseStep {
  return { type: "exercise", stepId: exercise.id, exercise };
}

describe("writing steps never mint FSRS evidence (§62)", () => {
  test("evidencePlanFor is null for both writing types in a French lesson", () => {
    expect(evidencePlanFor(lessonDefinition(), stepOf(guided))).toBeNull();
    expect(evidencePlanFor(lessonDefinition(), stepOf(form))).toBeNull();
  });

  test("buildCheckEvidence yields nothing — the scheduler never hears about writing", () => {
    const evidence = buildCheckEvidence({
      definition: lessonDefinition(),
      step: stepOf(guided),
      sessionId: "s1",
      correct: true,
      attemptIndex: 0,
      latencyMs: 4000,
    });
    expect(evidence).toBeNull();
  });
});

describe("boolean grading contract over the tri-state engine", () => {
  test("meets_rubric → correct; does_not_meet → wrong; unscorable → not correct", () => {
    const meets = {
      written: true,
      kind: "text",
      text: "Je m'appelle Marie et j'habite à Paris.",
    } as const;
    const misses = { written: true, kind: "text", text: "Je m'appelle Marie." } as const;
    const english = {
      written: true,
      kind: "text",
      text: "I honestly cannot write anything in French today folks",
    } as const;
    expect(checkAnswer(guided, meets)).toBe(true);
    expect(checkAnswer(guided, misses)).toBe(false);
    expect(checkAnswer(guided, english)).toBe(false); // boolean surface; scored routing skips it earlier
  });

  test("readiness and model answer contracts", () => {
    expect(answerIsReady(guided, { written: true, kind: "text", text: " " })).toBe(false);
    expect(answerIsReady(guided, { written: true, kind: "text", text: "je" })).toBe(true);
    expect(answerIsReady(form, { written: true, kind: "form", values: {} })).toBe(false);
    expect(
      answerIsReady(form, { written: true, kind: "form", values: { prenom: "Marie" } })
    ).toBe(true);
    expect(correctAnswerText(guided)).toBe("Je m'appelle Marie et j'habite à Paris.");
    expect(checkAnswer(form, { written: true, kind: "form", values: { prenom: "Marie", ville: "Paris" } })).toBe(true);
  });
});

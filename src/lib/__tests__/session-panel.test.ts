/**
 * PostAnswerPanel identity matrix (§ panel appears only when semantically
 * valid) + panel display data. Identity comes from evidence plans and
 * authored gradeTargets only — never from rendered text — and anything
 * ambiguous resolves to null.
 */
import { describe, expect, test } from "bun:test";

import { FR_COURSE_ID } from "../learning/ids-fr";
import {
  displayPronunciation,
  grammarNoteFor,
  panelDataFor,
  panelItemIdFor,
  teachMetaFor,
} from "../session/panel";
import type { ExerciseStep, SessionDefinition, SessionStep, TeachStep } from "../session/types";
import type { Exercise } from "../types";

function definitionFor(
  kind: SessionDefinition["kind"],
  courseId: string,
  steps: SessionStep[] = []
): SessionDefinition {
  return {
    kind,
    courseId,
    lessonId: "test-lesson",
    steps,
    completion: kind === "path" ? "lesson" : "practice",
    evidenceSource: kind === "today" ? "today" : kind === "review" ? "review" : "lesson",
    trackMistakes: false,
    allowUndo: false,
  };
}

function selectExercise(over: Partial<Extract<Exercise, { type: "select" }>> = {}): Exercise {
  return {
    type: "select",
    id: "ex-select",
    mode: "targetToNative",
    prompt: "What does this mean?",
    audioTarget: "le chat",
    options: [{ text: "the cat" }, { text: "the dog" }, { text: "the cow" }, { text: "the hen" }],
    correct: 0,
    ...over,
  };
}

function exerciseStep(exercise: Exercise, evidence?: ExerciseStep["evidence"]): ExerciseStep {
  return { type: "exercise", stepId: "s1", exercise, ...(evidence ? { evidence } : {}) };
}

describe("panelItemIdFor — the §94 matrix", () => {
  test("PATH French select with one authored gradeTarget → its stable id", () => {
    const step = exerciseStep(selectExercise({ gradeTargets: ["fr:w:chat"] }));
    expect(panelItemIdFor(definitionFor("path", FR_COURSE_ID), step)).toBe("fr:w:chat");
  });

  test("identity is independent of correctness (caller renders for both)", () => {
    const step = exerciseStep(selectExercise({ gradeTargets: ["fr:w:chat"] }));
    const id = panelItemIdFor(definitionFor("path", FR_COURSE_ID), step);
    expect(id).toBe("fr:w:chat");
  });

  test("TODAY generated step with an explicit evidence plan → its id", () => {
    const step = exerciseStep(selectExercise({ audioTarget: "la vache" }), {
      itemId: "fr:w:vache",
      srsRole: "assessment",
    });
    expect(panelItemIdFor(definitionFor("today", FR_COURSE_ID), step)).toBe("fr:w:vache");
  });

  test("manual review step with an explicit evidence plan → its id", () => {
    const step = exerciseStep(selectExercise({ audioTarget: "le pain" }), {
      itemId: "fr:w:pain",
      srsRole: "assessment",
    });
    expect(panelItemIdFor(definitionFor("review", FR_COURSE_ID), step)).toBe("fr:w:pain");
  });

  test("mistakes re-drill (practice role) still identifies its single item", () => {
    const step = exerciseStep(selectExercise({ gradeTargets: ["fr:w:chat"] }));
    expect(panelItemIdFor(definitionFor("mistakes", FR_COURSE_ID), step)).toBe("fr:w:chat");
  });

  test("French select without curated identity (sentence target) → null", () => {
    const step = exerciseStep(
      selectExercise({ audioTarget: "Bonjour, comment ça va ?", gradeTargets: undefined })
    );
    expect(panelItemIdFor(definitionFor("path", FR_COURSE_ID), step)).toBeNull();
  });

  test("legacy-language answers never get a panel", () => {
    const step = exerciseStep(selectExercise({ audioTarget: "el gato" }));
    expect(panelItemIdFor(definitionFor("path", "es-en"), step)).toBeNull();
  });

  test("match exercises (multi-item, self-advancing) never get a panel", () => {
    const match: Exercise = {
      type: "match",
      id: "ex-match",
      pairs: [
        { target: "le chat", native: "the cat" },
        { target: "la vache", native: "the cow" },
      ],
    };
    expect(panelItemIdFor(definitionFor("today", FR_COURSE_ID), exerciseStep(match))).toBeNull();
  });

  test("non-emitting exercise types (wordBank) → null", () => {
    const wordBank: Exercise = {
      type: "wordBank",
      id: "ex-wb",
      direction: "targetToNative",
      prompt: "Le chat",
      tokens: ["the", "cat"],
      answer: ["the", "cat"],
    };
    expect(panelItemIdFor(definitionFor("path", FR_COURSE_ID), exerciseStep(wordBank))).toBeNull();
  });

  test("teach steps get no post-answer panel", () => {
    const teach: TeachStep = {
      type: "teach",
      stepId: "t1",
      itemId: "fr:w:chat",
      word: { target: "le chat", native: "the cat", emoji: "🐈" },
    };
    expect(panelItemIdFor(definitionFor("today", FR_COURSE_ID), teach)).toBeNull();
  });
});

describe("teachMetaFor", () => {
  const word = { target: "l'eau", native: "the water", emoji: "💧" };

  test("curated teach step resolves rich metadata", () => {
    const teach: TeachStep = { type: "teach", stepId: "t", itemId: "fr:w:eau", word };
    const meta = teachMetaFor(teach);
    expect(meta?.gloss).toBe("the water");
    expect(meta?.gender).toBe("feminine");
    expect(meta?.pronunciation).toEqual({ value: "o", notation: "ipa" });
  });

  test("uncurated/legacy ids and exercise steps resolve to undefined", () => {
    const legacy: TeachStep = { type: "teach", stepId: "t", itemId: "fr:legacy:x", word };
    expect(teachMetaFor(legacy)).toBeUndefined();
    expect(teachMetaFor(exerciseStep(selectExercise()))).toBeUndefined();
  });
});

describe("panelDataFor — display model", () => {
  test("noun with visible article", () => {
    const data = panelDataFor("fr:w:chat");
    expect(data).toMatchObject({
      surface: "le chat",
      gloss: "the cat",
      genderLabel: "masculine noun",
      pronunciation: "/ʃa/",
      lemma: "chat",
      pos: "noun",
      topic: "animals",
    });
    expect(data?.example?.fr).toBe("Le chat boit du lait.");
    // Real Lexique 4 measurement: chat is in the common band (29.851/M).
    expect(data?.band).toBe("common");
  });

  test("elided noun marks the l' cue so gender is still taught", () => {
    expect(panelDataFor("fr:w:eau")?.genderLabel).toBe("feminine noun (l')");
  });

  test("non-nouns carry no gender label", () => {
    const data = panelDataFor("fr:w:manger");
    expect(data?.genderLabel).toBeUndefined();
    expect(data?.pos).toBe("verb");
  });

  test("missing lexicon entries yield null (no fake panel)", () => {
    expect(panelDataFor("fr:w:ghost")).toBeNull();
    expect(panelDataFor("fr:legacy:whatever")).toBeNull();
  });

  test("pronunciation display never mislabels phonology as IPA", () => {
    expect(displayPronunciation({ value: "Sa", notation: "phonology" })).toBe("Sa");
    expect(displayPronunciation({ value: "ʃa", notation: "ipa" })).toBe("/ʃa/");
  });
});

describe("grammarNoteFor — the Phase 5B single-note addition", () => {
  const step = (exercise: Exercise): ExerciseStep => ({
    type: "exercise",
    stepId: exercise.id,
    exercise,
  });

  test("articleSelect notes the article and its gender", () => {
    const note = grammarNoteFor(
      step({
        type: "articleSelect",
        id: "g1",
        articles: ["le", "la"],
        noun: "maison",
        gloss: "the house",
        correct: 1,
      })
    );
    expect(note).toBe("maison takes la — feminine.");
  });

  test("conjugationCloze notes the person and tense", () => {
    const note = grammarNoteFor(
      step({
        type: "conjugationCloze",
        id: "g2",
        sentence: "Tu ___ une pomme.",
        translation: "You eat an apple.",
        verb: "manger",
        cell: "pre:2s",
        answer: "manges",
        alternatives: [],
      })
    );
    expect(note).toBe("manges is the tu form of manger in the présent.");
  });

  test("participle cell gets no tense suffix", () => {
    const note = grammarNoteFor(
      step({
        type: "conjugationCloze",
        id: "g3",
        sentence: "J'ai ___ une pomme.",
        translation: "I ate an apple.",
        verb: "manger",
        cell: "participle",
        answer: "mangé",
        alternatives: [],
      })
    );
    expect(note).toBe("mangé is the past participle of manger.");
  });

  test("lexical exercises and non-exercise steps get no note", () => {
    expect(grammarNoteFor(step(selectExercise()))).toBeNull();
    expect(
      grammarNoteFor({ type: "concept", stepId: "c", conceptId: "fr:concept:elision" })
    ).toBeNull();
  });
});

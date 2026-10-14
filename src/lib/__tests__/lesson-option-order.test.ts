/**
 * Lesson MCQ option order (P0): authored lessons put the correct answer at
 * a fixed index far more often than chance. Each sitting renders the
 * select / fillBlank / listeningComprehension / readingComprehension
 * options in a seeded order with `correct` remapped; the step plan, the
 * authored content and the non-MCQ exercises are untouched.
 */
import { describe, expect, test } from "bun:test";

import { OPTION_ORDER_SCORED_TYPES } from "../assessment/option-order";
import { buildPathSessionDefinition, lessonSteps, shuffleLessonOptions } from "../session/sources";
import type { Exercise, LessonPack } from "../types";

type Mcq = Extract<
  Exercise,
  { type: "select" | "fillBlank" | "listeningComprehension" | "readingComprehension" }
>;

const OPTIONS = [{ text: "the apple" }, { text: "the bread" }, { text: "the water" }, { text: "the cat" }];

function mcq(id: string, type: Mcq["type"] = "select"): Exercise {
  switch (type) {
    case "select":
      return {
        type,
        id,
        mode: "targetToNative",
        prompt: "la pomme",
        audioTarget: "la pomme",
        options: OPTIONS,
        correct: 0,
        gradeTargets: ["fr:w:pomme"],
      };
    case "fillBlank":
      return {
        type,
        id,
        sentence: "Je mange ___ pomme.",
        options: ["la", "le", "les", "un"],
        correct: 0,
      } as unknown as Exercise;
    case "readingComprehension":
      return {
        type,
        id,
        passage: "Je mange une pomme.",
        question: "What do I eat?",
        options: OPTIONS.map((o) => o.text),
        correct: 0,
      } as unknown as Exercise;
    case "listeningComprehension":
      return {
        type,
        id,
        audioTarget: "la pomme",
        question: "What did you hear?",
        options: OPTIONS.map((o) => o.text),
        correct: 0,
      } as unknown as Exercise;
  }
}

const lesson: LessonPack = {
  id: "fr-en:u0-l0",
  title: "Basics",
  exercises: [
    mcq("e1"),
    mcq("e2"),
    mcq("e3"),
    mcq("e4"),
    mcq("e5"),
    mcq("e6"),
    { type: "match", id: "m1", pairs: [{ target: "a", native: "b" }, { target: "c", native: "d" }] },
    {
      type: "articleSelect",
      id: "a1",
      noun: "pomme",
      options: ["le", "la", "l'", "les"],
      correct: 1,
    } as unknown as Exercise,
  ],
};

function optionText(opt: unknown): string {
  return typeof opt === "string" ? opt : (opt as { text: string }).text;
}

function mcqSteps(def: ReturnType<typeof buildPathSessionDefinition>) {
  return def.steps.flatMap((s) =>
    s.type === "exercise" && OPTION_ORDER_SCORED_TYPES.has(s.exercise.type)
      ? [s.exercise as Mcq]
      : []
  );
}

describe("lesson MCQ option order", () => {
  test("keeps `correct` pointing at the same answer in every MCQ", () => {
    const def = buildPathSessionDefinition({ courseId: "fr-en", lesson, alreadyCompleted: false });
    const shuffled = mcqSteps(def);
    expect(shuffled).toHaveLength(6);
    for (const ex of shuffled) {
      expect(ex.options).toHaveLength(4);
      expect(optionText(ex.options[ex.correct])).toBe("the apple");
      expect(ex.options.map(optionText).sort()).toEqual(OPTIONS.map((o) => o.text).sort());
    }
  });

  test("the correct answer is not always at the authored index 0", () => {
    const def = buildPathSessionDefinition({ courseId: "fr-en", lesson, alreadyCompleted: false });
    const positions = mcqSteps(def).map((ex) => ex.correct);
    expect(positions.some((p) => p !== 0)).toBe(true);
  });

  test("step ids, order and non-MCQ exercises are untouched", () => {
    const def = buildPathSessionDefinition({ courseId: "fr-en", lesson, alreadyCompleted: false });
    expect(def.steps.map((s) => s.stepId)).toEqual(lessonSteps(lesson).map((s) => s.stepId));
    const match = def.steps.find((s) => s.stepId === "m1");
    const article = def.steps.find((s) => s.stepId === "a1");
    expect(match?.type === "exercise" && match.exercise).toEqual(lesson.exercises[6]);
    // articleSelect presents the paradigm in canonical order — never shuffled.
    expect(article?.type === "exercise" && article.exercise).toBe(lesson.exercises[7]);
  });

  test("the authored lesson object is never mutated", () => {
    const before = JSON.stringify(lesson);
    buildPathSessionDefinition({ courseId: "fr-en", lesson, alreadyCompleted: false, attempt: "first" });
    buildPathSessionDefinition({ courseId: "fr-en", lesson, alreadyCompleted: true, attempt: "replay:2026-10-14" });
    expect(JSON.stringify(lesson)).toBe(before);
    expect((lesson.exercises[0] as Mcq).correct).toBe(0);
  });

  test("same attempt → same order (a re-render never reshuffles under the learner)", () => {
    const a = buildPathSessionDefinition({ courseId: "fr-en", lesson, alreadyCompleted: false, attempt: "first" });
    const b = buildPathSessionDefinition({ courseId: "fr-en", lesson, alreadyCompleted: false, attempt: "first" });
    expect(mcqSteps(a).map((e) => e.options.map(optionText))).toEqual(
      mcqSteps(b).map((e) => e.options.map(optionText))
    );
  });

  test("different attempts → a different order for at least one item", () => {
    const first = buildPathSessionDefinition({ courseId: "fr-en", lesson, alreadyCompleted: false, attempt: "first" });
    const replay = buildPathSessionDefinition({ courseId: "fr-en", lesson, alreadyCompleted: true, attempt: "replay:2026-10-14" });
    const orderA = mcqSteps(first).map((e) => e.options.map(optionText).join("|"));
    const orderB = mcqSteps(replay).map((e) => e.options.map(optionText).join("|"));
    expect(orderA).not.toEqual(orderB);
  });

  test("every scored MCQ type is shuffled with correct remapped", () => {
    const types: Mcq["type"][] = ["select", "fillBlank", "listeningComprehension", "readingComprehension"];
    const mixed: LessonPack = { id: "fr-en:u0-l1", title: "Mixed", exercises: types.map((t, i) => mcq(`x${i}`, t)) };
    const def = buildPathSessionDefinition({ courseId: "fr-en", lesson: mixed, alreadyCompleted: false });
    for (const ex of mcqSteps(def)) {
      const authored = mixed.exercises.find((e) => e.id === ex.id) as Mcq;
      expect(optionText(ex.options[ex.correct])).toBe(optionText(authored.options[authored.correct]));
    }
  });

  test("shuffleLessonOptions leaves concept steps alone", () => {
    const steps = shuffleLessonOptions(
      [{ type: "concept", stepId: "concept:0:c", conceptId: "c" }, ...lessonSteps(lesson)],
      lesson.id,
      0
    );
    expect(steps[0]).toEqual({ type: "concept", stepId: "concept:0:c", conceptId: "c" });
  });
});

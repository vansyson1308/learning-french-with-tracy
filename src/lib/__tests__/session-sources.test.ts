import { describe, expect, test } from "bun:test";

import { fsrsScheduler } from "../learning/fsrs-adapter";
import {
  buildMistakesSessionDefinition,
  buildPathSessionDefinition,
  buildReviewSessionDefinition,
} from "../session/sources";
import type { LessonPack, Word } from "../types";

const T0 = 1_700_000_000_000;
const DAY = 86_400_000;

const lesson: LessonPack = {
  id: "fr-en:u0-l0",
  title: "Basics",
  exercises: [
    {
      type: "select",
      id: "e1",
      mode: "targetToNative",
      prompt: "la pomme",
      audioTarget: "la pomme",
      options: [{ text: "the apple" }, { text: "the bread" }],
      correct: 0,
      gradeTargets: ["fr:w:pomme"],
    },
    { type: "match", id: "e2", pairs: [{ target: "a", native: "b" }, { target: "c", native: "d" }] },
  ],
};

const pool: Word[] = [
  { target: "la pomme", native: "the apple", emoji: "🍎" },
  { target: "le pain", native: "the bread", emoji: "🍞" },
  { target: "le chat", native: "the cat", emoji: "🐱" },
  { target: "le chien", native: "the dog", emoji: "🐶" },
  { target: "l'eau", native: "the water", emoji: "💧" },
];

describe("path/replay definitions", () => {
  test("fresh lesson: kind path, lesson completion, mistakes tracked", () => {
    const def = buildPathSessionDefinition({
      courseId: "fr-en",
      lesson,
      alreadyCompleted: false,
    });
    expect(def.kind).toBe("path");
    expect(def.completion).toBe("lesson");
    expect(def.evidenceSource).toBe("lesson");
    expect(def.trackMistakes).toBe(true);
    expect(def.allowUndo).toBe(false);
    expect(def.steps.map((s) => s.stepId)).toEqual(["e1", "e2"]);
    // Authored steps carry NO explicit plan — gradeTargets decide later.
    expect(def.steps.every((s) => s.type === "exercise" && s.evidence === undefined)).toBe(true);
  });

  test("replay: practice completion, still tracks mistakes (parity)", () => {
    const def = buildPathSessionDefinition({
      courseId: "fr-en",
      lesson,
      alreadyCompleted: true,
    });
    expect(def.kind).toBe("replay");
    expect(def.completion).toBe("practice");
    expect(def.trackMistakes).toBe(true);
  });
});

describe("mistakes definition", () => {
  const getLesson = (id: string) => (id === lesson.id ? { lesson } : undefined);

  test("resolves refs, drops orphans, caps at 10, never adds new mistakes", () => {
    const mistakes = [
      { lessonId: lesson.id, exerciseId: "e1" },
      { lessonId: lesson.id, exerciseId: "gone" }, // orphan → dropped
      { lessonId: "missing", exerciseId: "e1" }, // orphan lesson → dropped
      ...Array.from({ length: 15 }, () => ({ lessonId: lesson.id, exerciseId: "e2" })),
    ];
    const def = buildMistakesSessionDefinition({ courseId: "fr-en", mistakes, getLesson });
    expect(def.kind).toBe("mistakes");
    expect(def.completion).toBe("practice");
    expect(def.evidenceSource).toBe("mistakes");
    expect(def.trackMistakes).toBe(false);
    expect(def.steps.length).toBeLessThanOrEqual(10);
    expect(def.steps[0].stepId).toBe("e1");
  });
});

describe("review definitions", () => {
  test("French: FSRS queue order, explicit per-step card targets, undo allowed", () => {
    const dueCard = { ...fsrsScheduler.initialCard(T0), due: T0 - DAY };
    const def = buildReviewSessionDefinition({
      courseId: "fr-en",
      course: {
        cards: {
          "fr:w:pomme|recognize": dueCard,
          "fr:w:chat|recognize": { ...dueCard, due: T0 - 2 * DAY },
        },
      },
      pool,
      now: T0,
    });
    expect(def.kind).toBe("review");
    expect(def.evidenceSource).toBe("review");
    expect(def.allowUndo).toBe(true);
    expect(def.steps).toHaveLength(2);
    const plans = def.steps.map((s) => (s.type === "exercise" ? s.evidence : undefined));
    // Generated steps carry explicit stable-item targets — never inferred.
    expect(plans.map((p) => p?.itemId).sort()).toEqual(["fr:w:chat", "fr:w:pomme"]);
    expect(plans.every((p) => p?.srsRole === "assessment")).toBe(true);
  });

  test("French review builds are deterministic per queue state", () => {
    const dueCard = { ...fsrsScheduler.initialCard(T0), due: T0 - DAY };
    const args = {
      courseId: "fr-en",
      course: { cards: { "fr:w:pomme|recognize": dueCard } },
      pool,
      now: T0,
    };
    const a = buildReviewSessionDefinition(args);
    const b = buildReviewSessionDefinition(args);
    expect(a.steps).toEqual(b.steps);
  });

  test("legacy: dueSrsWords queue, surface-keyed targets, no undo", () => {
    const def = buildReviewSessionDefinition({
      courseId: "es-en",
      course: {
        srs: { "la pomme": { interval: 1, ease: 2.5, dueAt: T0 - DAY, streak: 1 } },
      },
      pool,
      now: T0,
    });
    expect(def.allowUndo).toBe(false);
    expect(def.steps).toHaveLength(1);
    const step = def.steps[0];
    expect(step.type === "exercise" && step.evidence).toEqual({
      itemId: "la pomme",
      srsRole: "assessment",
    });
  });

  test("empty queues produce an empty session", () => {
    const def = buildReviewSessionDefinition({
      courseId: "fr-en",
      course: { cards: {} },
      pool,
      now: T0,
    });
    expect(def.steps).toEqual([]);
  });
});

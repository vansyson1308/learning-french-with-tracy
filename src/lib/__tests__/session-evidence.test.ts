import { describe, expect, test } from "bun:test";

import { behaviorFor } from "../exercise-registry";
import { applyEvidence } from "../learning/engine";
import {
  buildCheckEvidence,
  buildMatchWordEvidence,
  evidencePlanFor,
} from "../session/evidence";
import type { ExerciseStep, SessionDefinition } from "../session/types";
import type { CourseProgress } from "../store";
import type { SelectExercise } from "../types";

const T0 = 1_700_000_000_000;

function def(overrides: Partial<SessionDefinition> = {}): SessionDefinition {
  return {
    kind: "path",
    courseId: "fr-en",
    lessonId: "fr-en:u0-l0",
    steps: [],
    completion: "lesson",
    evidenceSource: "lesson",
    trackMistakes: true,
    allowUndo: false,
    ...overrides,
  };
}

function selectStep(overrides: Partial<SelectExercise> = {}, evidence?: ExerciseStep["evidence"]): ExerciseStep {
  return {
    type: "exercise",
    stepId: "e1",
    evidence,
    exercise: {
      type: "select",
      id: "e1",
      mode: "targetToNative",
      prompt: "la pomme",
      audioTarget: "la pomme",
      options: [{ text: "the apple" }, { text: "the bread" }],
      correct: 0,
      gradeTargets: ["fr:w:pomme"],
      ...overrides,
    },
  };
}

describe("evidencePlanFor: gradeTargets are the authored authority (§23-24)", () => {
  test("exactly one valid stable target → assessment on that id", () => {
    expect(evidencePlanFor(def(), selectStep())).toEqual({
      itemId: "fr:w:pomme",
      srsRole: "assessment",
    });
  });

  test("missing gradeTargets → practice under the fallback id (no scheduling)", () => {
    const plan = evidencePlanFor(def(), selectStep({ gradeTargets: undefined }));
    expect(plan).toEqual({ itemId: "fr:w:pomme", srsRole: "practice" });
  });

  test("ambiguous (two targets) → practice, never guess", () => {
    const plan = evidencePlanFor(
      def(),
      selectStep({ gradeTargets: ["fr:w:pomme", "fr:w:pain"] })
    );
    expect(plan?.srsRole).toBe("practice");
  });

  test("invalid/unknown target fails closed to practice without crashing", () => {
    const plan = evidencePlanFor(def(), selectStep({ gradeTargets: ["fr:w:bogus-word"] }));
    expect(plan).toEqual({ itemId: "fr:w:pomme", srsRole: "practice" });
    const malformed = evidencePlanFor(def(), selectStep({ gradeTargets: [""] }));
    expect(malformed?.srsRole).toBe("practice");
  });

  test("mistake re-drills are practice even with a perfect gradeTarget", () => {
    expect(evidencePlanFor(def({ kind: "mistakes" }), selectStep())?.srsRole).toBe(
      "practice"
    );
  });

  test("explicit step.evidence (generated steps) overrides everything", () => {
    const plan = evidencePlanFor(
      def({ kind: "review", evidenceSource: "review" }),
      selectStep({ gradeTargets: undefined }, { itemId: "fr:w:chat", srsRole: "assessment" })
    );
    expect(plan).toEqual({ itemId: "fr:w:chat", srsRole: "assessment" });
  });

  test("legacy courses keep surface identity; gradeTargets never apply", () => {
    const plan = evidencePlanFor(
      def({ courseId: "es-en" }),
      selectStep({ audioTarget: "el agua", gradeTargets: undefined })
    );
    expect(plan).toEqual({ itemId: "el agua", srsRole: "assessment" });
  });

  test("audio-less selects assess through gradeTargets (Section 2); with neither signal, nothing", () => {
    // Phase 5B revision of the Phase-1 interim rule: compiler-emitted
    // gradeTargets are the deliberate eligibility metadata, so a Section-2
    // select with no bundled audio still assesses its single curated item.
    expect(evidencePlanFor(def(), selectStep({ audioTarget: undefined }))).toEqual({
      itemId: "fr:w:pomme",
      srsRole: "assessment",
    });
    expect(
      evidencePlanFor(def(), selectStep({ audioTarget: undefined, gradeTargets: undefined }))
    ).toBeNull();
    const wordBank: ExerciseStep = {
      type: "exercise",
      stepId: "wb",
      exercise: {
        type: "wordBank",
        id: "wb",
        direction: "targetToNative",
        prompt: "Je mange une pomme",
        tokens: ["I", "eat", "an", "apple"],
        answer: ["I", "eat", "an", "apple"],
      },
    };
    expect(evidencePlanFor(def(), wordBank)).toBeNull();
  });
});

describe("evidence builders", () => {
  test("buildCheckEvidence: full shape with the definition's source", () => {
    const ev = buildCheckEvidence({
      definition: def({ evidenceSource: "today", kind: "today" }),
      step: selectStep({}, { itemId: "fr:w:pomme", srsRole: "assessment" }),
      sessionId: "s-1",
      correct: true,
      attemptIndex: 0,
      latencyMs: 1234,
    });
    expect(ev).toEqual({
      cardKey: { itemId: "fr:w:pomme", skill: "recognize" },
      sessionId: "s-1",
      exerciseId: "e1",
      modality: "recognizeText",
      srsRole: "assessment",
      source: "today",
      correct: true,
      hinted: false,
      assisted: false,
      toleranceUsed: false,
      latencyMs: 1234,
      attemptIndex: 0,
    });
  });

  test("match evidence is reinforcement-only: role none, modality match", () => {
    const ev = buildMatchWordEvidence({
      definition: def(),
      step: selectStep(),
      sessionId: "s-1",
      surface: "la pomme",
      correct: true,
      attemptIndex: 0,
      latencyMs: 500,
    });
    expect(ev.srsRole).toBe("none");
    expect(ev.modality).toBe("match");
    expect(ev.cardKey.itemId).toBe("fr:w:pomme");
  });

  test("registry modality table", () => {
    const sel = selectStep().exercise as SelectExercise;
    const produce: SelectExercise = { ...sel, mode: "nativeToTarget" };
    const listen: SelectExercise = { ...sel, mode: "listen" };
    expect(behaviorFor(sel).modality(sel)).toBe("recognizeText");
    expect(behaviorFor(produce).modality(produce)).toBe("produceText");
    expect(behaviorFor(listen).modality(listen)).toBe("listen");
    expect(behaviorFor(sel).selfAdvancing).toBe(false);
    const match = { type: "match", id: "m", pairs: [] } as never;
    expect(behaviorFor(match).selfAdvancing).toBe(true);
  });
});

describe("TODAY wordStats semantics through the engine (§28)", () => {
  const empty = (): CourseProgress => ({
    xp: 0,
    completedLessons: {},
    mistakes: [],
    wordStats: {},
    srs: {},
  });
  const todayEv = (overrides: object) => ({
    cardKey: { itemId: "fr:w:pomme", skill: "recognize" as const },
    sessionId: "s1",
    exerciseId: "e1",
    modality: "recognizeText" as const,
    srsRole: "assessment" as const,
    source: "today" as const,
    correct: true,
    hinted: false,
    assisted: false,
    toleranceUsed: false,
    latencyMs: 900,
    attemptIndex: 0,
    ...overrides,
  });

  test("a mutating designated assessment bumps stats exactly once", () => {
    const first = applyEvidence({
      courseId: "fr-en",
      course: empty(),
      reviewLog: [],
      ev: todayEv({}),
      now: T0,
    });
    expect(first.mutated).toBe(true);
    expect(first.course.wordStats["fr:w:pomme"]).toEqual({
      correct: 1,
      wrong: 0,
      lastSeen: T0,
    });

    // Second assessment in the same session: gate refuses → no second bump.
    const second = applyEvidence({
      courseId: "fr-en",
      course: first.course,
      reviewLog: first.reviewLog,
      ev: todayEv({ exerciseId: "e2" }),
      now: T0 + 1000,
    });
    expect(second.mutated).toBe(false);
    expect(second.course.wordStats["fr:w:pomme"].correct).toBe(1);
  });

  test("teach, practice and finale reinforcement never touch stats", () => {
    for (const srsRole of ["teach", "practice", "none"] as const) {
      const out = applyEvidence({
        courseId: "fr-en",
        course: empty(),
        reviewLog: [],
        ev: todayEv({ srsRole }),
        now: T0,
      });
      expect(out.course.wordStats).toEqual({});
      expect(out.mutated).toBe(false);
      expect(out.reviewLog).toHaveLength(1); // still logged
    }
  });

  test("lesson/mistakes stats semantics are unchanged by the TODAY rule", () => {
    const lessonOut = applyEvidence({
      courseId: "fr-en",
      course: empty(),
      reviewLog: [],
      ev: todayEv({ source: "lesson", srsRole: "practice" }),
      now: T0,
    });
    expect(lessonOut.course.wordStats["fr:w:pomme"].correct).toBe(1); // pre-Phase-3 behavior

    const reviewOut = applyEvidence({
      courseId: "fr-en",
      course: empty(),
      reviewLog: [],
      ev: todayEv({ source: "review" }),
      now: T0,
    });
    expect(reviewOut.course.wordStats).toEqual({}); // review never bumped
  });

  test("defensive: legacy course + today source behaves like review (no stats)", () => {
    const out = applyEvidence({
      courseId: "es-en",
      course: empty(),
      reviewLog: [],
      ev: todayEv({ cardKey: { itemId: "el agua", skill: "recognize" } }),
      now: T0,
    });
    expect(out.course.wordStats).toEqual({});
    expect(out.course.srs!["el agua"]).toBeDefined();
    expect(out.mutated).toBe(false);
  });
});

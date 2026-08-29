/**
 * Speak-skill activation tests (P8 §15-17).
 *
 * The contract under test, end to end:
 *  - "speak" is a real CardKey skill; recognize AND listen cards stay
 *    byte-identical when speak evidence lands (the isolation pins);
 *  - speak evidence exists ONLY for elicited production steps with exactly
 *    one curated evidence lexeme, outside scored assessment kinds;
 *  - assisted production (bias / revealed target) is logged but NEVER
 *    mutates the scheduler;
 *  - the speaking review surface builds only sessionable steps and keeps
 *    un-sessionable due cards visibly due;
 *  - TODAY's speaking share is bounded (≤¼ review; listening+speaking ≤½)
 *    and a "Can't speak now" session composes fully silent.
 */
import { describe, expect, test } from "bun:test";

import { parseCardKey, serializeCardKey, SKILLS } from "../learning/card-key";
import { applyEvidence, dueFrenchReviewQueue } from "../learning/engine";
import type { ReviewEvidence } from "../learning/evidence";
import { fsrsScheduler } from "../learning/fsrs-adapter";
import {
  composeTodaySession,
  TODAY_PRESETS,
  todayListenBudget,
  todaySpeakBudget,
} from "../learning/today";
import { buildCheckEvidence, evidencePlanFor } from "../session/evidence";
import {
  buildSpeakingReviewSessionDefinition,
  dueSpeakingReviewCounts,
} from "../session/sources";
import type { ExerciseStep, SessionDefinition } from "../session/types";
import type { CourseProgress } from "../store";
import type { Pack, SpeakProductionExercise, SpeakRepetitionExercise } from "../types";
import frPackJson from "../../content/packs/fr-en.json";

const frPack = frPackJson as unknown as Pack;
const NOW = Date.UTC(2026, 7, 29, 12, 0, 0);

function dueCard(now = NOW) {
  return fsrsScheduler.initialCard(now - 1000);
}

function courseWith(cards: Record<string, ReturnType<typeof dueCard>>): CourseProgress {
  return { xp: 0, completedLessons: {}, mistakes: [], wordStats: {}, srs: {}, cards };
}

function definitionOf(kind: SessionDefinition["kind"] = "review"): SessionDefinition {
  return {
    kind,
    courseId: "fr-en",
    lessonId: "x",
    steps: [],
    completion: "practice",
    evidenceSource: "review",
    trackMistakes: false,
    allowUndo: true,
  };
}

function productionExercise(
  over: Partial<SpeakProductionExercise> = {}
): SpeakProductionExercise {
  return {
    type: "speakProduction",
    id: "sp-x",
    speechItemId: "fr.speak.x",
    instruction: "Say that you would like a coffee.",
    target: "Je voudrais un café",
    acceptedVariants: ["Je voudrais un café"],
    evidenceLexemeRefs: ["fr:w:cafe"],
    revealTargetAfterAttempts: null,
    allowContextualBias: false,
    modelClipId: null,
    allowedAttempts: 2,
    ...over,
  };
}

function stepOf(exercise: SpeakProductionExercise | SpeakRepetitionExercise): ExerciseStep {
  return { type: "exercise", stepId: exercise.id, exercise };
}

function speakEvidence(over: Partial<ReviewEvidence> = {}): ReviewEvidence {
  return {
    cardKey: { itemId: "fr:w:cafe", skill: "speak" },
    sessionId: "s1",
    exerciseId: "sp-x",
    modality: "speak",
    srsRole: "assessment",
    source: "review",
    correct: true,
    hinted: false,
    assisted: false,
    toleranceUsed: false,
    latencyMs: 2100,
    attemptIndex: 0,
    ...over,
  };
}

describe("card key: speak skill (§15)", () => {
  test("speak is an activated skill and round-trips", () => {
    expect(SKILLS).toContain("speak");
    const key = serializeCardKey({ itemId: "fr:w:cafe", skill: "speak" });
    expect(key).toBe("fr:w:cafe|speak");
    expect(parseCardKey(key)).toEqual({ itemId: "fr:w:cafe", skill: "speak" });
  });

  test("the due queue is skill-scoped in all three directions", () => {
    const cards = {
      "fr:w:cafe|recognize": dueCard(),
      "fr:w:cafe|listen": dueCard(),
      "fr:w:cafe|speak": dueCard(),
      "fr:w:train|speak": dueCard(),
    };
    expect(dueFrenchReviewQueue(cards, NOW).map((d) => d.key)).toEqual([
      "fr:w:cafe|recognize",
    ]);
    expect(dueFrenchReviewQueue(cards, NOW, "listen").map((d) => d.key)).toEqual([
      "fr:w:cafe|listen",
    ]);
    expect(
      dueFrenchReviewQueue(cards, NOW, "speak")
        .map((d) => d.key)
        .sort()
    ).toEqual(["fr:w:cafe|speak", "fr:w:train|speak"]);
  });
});

describe("speak evidence eligibility (§15 — the ten conditions)", () => {
  test("elicited production with ONE curated evidence lexeme → speak assessment", () => {
    const plan = evidencePlanFor(definitionOf(), stepOf(productionExercise()));
    expect(plan).toEqual({ itemId: "fr:w:cafe", skill: "speak", srsRole: "assessment" });
  });

  test("repetition NEVER produces evidence (§11)", () => {
    const repetition: SpeakRepetitionExercise = {
      type: "speakRepetition",
      id: "sr-x",
      speechItemId: "fr.speak.rep",
      modelClipId: "fr.clip.uf_cafe",
      target: "Bonjour",
      acceptedVariants: ["Bonjour"],
    };
    expect(evidencePlanFor(definitionOf(), stepOf(repetition))).toBeNull();
    expect(evidencePlanFor(definitionOf("path"), stepOf(repetition))).toBeNull();
  });

  test("zero, multiple, or unknown evidence lexemes fail closed", () => {
    expect(
      evidencePlanFor(definitionOf(), stepOf(productionExercise({ evidenceLexemeRefs: [] })))
    ).toBeNull();
    expect(
      evidencePlanFor(
        definitionOf(),
        stepOf(productionExercise({ evidenceLexemeRefs: ["fr:w:cafe", "fr:w:train"] }))
      )
    ).toBeNull();
    expect(
      evidencePlanFor(
        definitionOf(),
        stepOf(productionExercise({ evidenceLexemeRefs: ["fr:w:pas-un-mot"] }))
      )
    ).toBeNull();
  });

  test("scored assessment kinds produce NO learning evidence (§20)", () => {
    expect(evidencePlanFor(definitionOf("checkpoint"), stepOf(productionExercise()))).toBeNull();
    expect(evidencePlanFor(definitionOf("placement"), stepOf(productionExercise()))).toBeNull();
  });

  test("non-French courses never create speak cards", () => {
    const definition = { ...definitionOf(), courseId: "es-en" };
    expect(evidencePlanFor(definition, stepOf(productionExercise()))).toBeNull();
  });

  test("mistakes sessions keep production steps as practice", () => {
    const plan = evidencePlanFor(definitionOf("mistakes"), stepOf(productionExercise()));
    expect(plan).toEqual({ itemId: "fr:w:cafe", skill: "speak", srsRole: "practice" });
  });

  test("buildCheckEvidence carries skill, modality, and the assisted flag", () => {
    const ev = buildCheckEvidence({
      definition: definitionOf(),
      step: stepOf(productionExercise()),
      sessionId: "s1",
      correct: true,
      attemptIndex: 0,
      latencyMs: 1500,
      assisted: true,
    });
    expect(ev?.cardKey).toEqual({ itemId: "fr:w:cafe", skill: "speak" });
    expect(ev?.modality).toBe("speak");
    expect(ev?.assisted).toBe(true);
  });
});

describe("isolation pins (§15): fr:w:X|speak mutates NEITHER |recognize NOR |listen", () => {
  test("speak evidence creates the speak card and leaves the other skills byte-identical", () => {
    const recognizeBefore = dueCard();
    const listenBefore = dueCard();
    const course = courseWith({
      "fr:w:cafe|recognize": recognizeBefore,
      "fr:w:cafe|listen": listenBefore,
    });
    const result = applyEvidence({
      courseId: "fr-en",
      course,
      reviewLog: [],
      ev: speakEvidence(),
      now: NOW,
    });
    const cards = result.course.cards!;
    expect(result.mutated).toBe(true);
    expect(cards["fr:w:cafe|speak"]).toBeDefined();
    expect(cards["fr:w:cafe|speak"].reps).toBe(1);
    expect(cards["fr:w:cafe|recognize"]).toEqual(recognizeBefore);
    expect(cards["fr:w:cafe|listen"]).toEqual(listenBefore);
  });

  test("recognize evidence never touches an existing speak card either", () => {
    const speakBefore = dueCard();
    const course = courseWith({ "fr:w:cafe|speak": speakBefore });
    const result = applyEvidence({
      courseId: "fr-en",
      course,
      reviewLog: [],
      ev: speakEvidence({ cardKey: { itemId: "fr:w:cafe", skill: "recognize" }, modality: "recognizeText" }),
      now: NOW,
    });
    expect(result.course.cards!["fr:w:cafe|speak"]).toEqual(speakBefore);
  });

  test("ASSISTED speak production is logged but NEVER mutates the scheduler (§13)", () => {
    const course = courseWith({});
    const result = applyEvidence({
      courseId: "fr-en",
      course,
      reviewLog: [],
      ev: speakEvidence({ assisted: true }),
      now: NOW,
    });
    expect(result.mutated).toBe(false);
    expect(result.course.cards?.["fr:w:cafe|speak"]).toBeUndefined();
    expect(result.reviewLog).toHaveLength(1);
    expect(result.reviewLog[0].assisted).toBe(true);
  });

  test("a WRONG recognized production is real negative evidence", () => {
    const result = applyEvidence({
      courseId: "fr-en",
      course: courseWith({}),
      reviewLog: [],
      ev: speakEvidence({ correct: false }),
      now: NOW,
    });
    // The scheduler genuinely mutates (a graded Again), unlike silence or
    // technical failure which never reach evidence at all.
    expect(result.mutated).toBe(true);
    expect(result.course.cards!["fr:w:cafe|speak"].reps).toBe(1);
    expect(result.reviewLog[0].correct).toBe(false);
    expect(result.reviewLog[0].srsRole).toBe("assessment");
  });
});

describe("speaking review surface (§16)", () => {
  test("with no authored speech items, due speak cards stay VISIBLY due and unsessionable", () => {
    // fr:w:train has an authored production item (Section 4's "say when
    // the train leaves"); fr:w:cafe has none — its speak card must stay
    // VISIBLY due and unsessionable, never silently hidden.
    const cards = { "fr:w:cafe|speak": dueCard(), "fr:w:train|speak": dueCard() };
    const definition = buildSpeakingReviewSessionDefinition({
      course: courseWith(cards),
      now: NOW,
    });
    expect(definition.steps).toHaveLength(1);
    const step = definition.steps[0] as ExerciseStep;
    expect(step.evidence).toEqual({
      itemId: "fr:w:train",
      skill: "speak",
      srsRole: "assessment",
    });
    expect(step.exercise.type).toBe("speakProduction");
    expect(dueSpeakingReviewCounts(cards, NOW)).toEqual({ sessionable: 1, total: 2 });
    // The cards themselves are untouched — still due.
    expect(dueFrenchReviewQueue(cards, NOW, "speak")).toHaveLength(2);
  });

  test("review steps never use RESERVED items (§20)", async () => {
    const { speechItemFor, speakProductionIndex } = await import("../speech/content");
    for (const itemId of Object.values(speakProductionIndex())) {
      const item = speechItemFor(itemId)!;
      // The compiled artifact excludes reserved items entirely, so the
      // review index can only ever reach curriculum production items.
      expect(item).toBeDefined();
      expect(item.id.includes("cp4")).toBe(false);
      expect(item.id.includes("pl4")).toBe(false);
    }
  });
});

describe("TODAY speaking share (§17)", () => {
  const speakExercises = {
    "fr:w:cafe": productionExercise({ id: "seed-cafe", evidenceLexemeRefs: ["fr:w:cafe"] }),
    "fr:w:train": productionExercise({ id: "seed-train", evidenceLexemeRefs: ["fr:w:train"] }),
    "fr:w:gare": productionExercise({ id: "seed-gare", evidenceLexemeRefs: ["fr:w:gare"] }),
    "fr:w:chat": productionExercise({ id: "seed-chat", evidenceLexemeRefs: ["fr:w:chat"] }),
  };

  function speakDue(n: number) {
    const lexemes = ["fr:w:cafe", "fr:w:train", "fr:w:gare", "fr:w:chat"].slice(0, n);
    return Object.fromEntries(lexemes.map((id) => [`${id}|speak`, dueCard()]));
  }

  test("budget arithmetic: ≤ a quarter, and listening+speaking ≤ half", () => {
    expect(todaySpeakBudget(10, 0)).toBe(2); // floor(10/4)
    expect(todaySpeakBudget(10, 3)).toBe(2); // half-cap 5-3=2
    expect(todaySpeakBudget(10, 5)).toBe(0); // listening already used the half
    expect(todaySpeakBudget(5, 1)).toBe(1);
    expect(todayListenBudget(10) + todaySpeakBudget(10, todayListenBudget(10))).toBeLessThanOrEqual(5);
  });

  test("speak steps are bounded, carry speak-card evidence, and count as reviews", () => {
    const plan = composeTodaySession({
      pack: frPack,
      completedLessons: {},
      cards: speakDue(4),
      preset: "regular",
      seed: 7,
      now: NOW,
      speakExercises,
    });
    expect(plan.speakCount).toBe(2); // floor(10/4) with no listening taken
    const speakSteps = plan.steps.filter(
      (s) => s.type === "exercise" && s.exercise.type === "speakProduction"
    ) as ExerciseStep[];
    expect(speakSteps).toHaveLength(2);
    for (const step of speakSteps) {
      expect(step.evidence?.skill).toBe("speak");
      expect(step.evidence?.srsRole).toBe("assessment");
      expect(step.stepId.startsWith("today-speak-")).toBe(true);
    }
    // The two that didn't fit stay in the honest backlog.
    expect(plan.backlogTotal).toBe(4);
    expect(plan.backlogRemaining).toBe(2);
  });

  test("'Can't speak now' (no speakExercises) composes a fully silent session", () => {
    const plan = composeTodaySession({
      pack: frPack,
      completedLessons: {},
      cards: speakDue(3),
      preset: "regular",
      seed: 7,
      now: NOW,
    });
    expect(plan.speakCount).toBe(0);
    expect(
      plan.steps.some((s) => s.type === "exercise" && s.exercise.type === "speakProduction")
    ).toBe(false);
    // Due speak cards still count toward the honest backlog.
    expect(plan.backlogTotal).toBe(3);
    expect(plan.backlogRemaining).toBe(3);
  });

  test("preset budgets stay consistent for every preset", () => {
    for (const preset of ["short", "regular", "long"] as const) {
      const review = TODAY_PRESETS[preset].review;
      const listen = todayListenBudget(review);
      expect(todaySpeakBudget(review, listen) + listen).toBeLessThanOrEqual(
        Math.floor(review / 2)
      );
    }
  });
});

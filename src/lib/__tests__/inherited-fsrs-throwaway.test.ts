/**
 * P1b Definition of Done: a legacy course can be moved onto the French
 * layer through DATA, not code. This throwaway lifts `fsrs` + `dailySession`
 * on de-en (es-en gained a registry in P3a) through the profile test seam and proves the engine, the
 * TODAY composer and the review builder work on SPANISH words with FSRS
 * cards. Nothing here is product behaviour (the override is cleared), and
 * no Spanish content changes.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { getPack } from "../content";
import { __setCourseCapabilityOverrideForTests, hasCapability } from "../course-profile";
import { applyEvidence, dueReviewQueue, itemIdForCourse } from "../learning/engine";
import type { ReviewEvidence } from "../learning/evidence";
import { fsrsScheduler } from "../learning/fsrs-adapter";
import type { FsrsCardState } from "../learning/scheduler";
import { composeTodaySession } from "../learning/today";
import { buildReviewSessionDefinition } from "../session/sources";
import type { CourseProgress } from "../store";

const ES = "de-en";
const T0 = Date.UTC(2026, 5, 15, 12);
const DAY = 86_400_000;

const pack = getPack(ES);
const words = pack.sections.flatMap((s) => s.units.flatMap((u) => u.words));

function evidence(surface: string, correct: boolean, i: number): ReviewEvidence {
  return {
    cardKey: { itemId: itemIdForCourse(ES, surface), skill: "recognize" },
    sessionId: "es-throwaway",
    exerciseId: `e${i}`,
    modality: "recognizeText",
    srsRole: "assessment",
    source: "lesson",
    correct,
    hinted: false,
    assisted: false,
    toleranceUsed: false,
    latencyMs: 1200,
    attemptIndex: 0,
  };
}

function dueCard(daysOverdue: number): FsrsCardState {
  const due = T0 - daysOverdue * DAY;
  return { ...fsrsScheduler.initialCard(T0 - 30 * DAY), due, stability: 3, difficulty: 6, scheduled_days: 3, reps: 2, state: "review", last_review: due - 3 * DAY };
}

describe("de-en on FSRS through a profile override (throwaway, P1b DoD; es-en has a registry since P3a)", () => {
  beforeAll(() => __setCourseCapabilityOverrideForTests(ES, { fsrs: true, dailySession: true }));
  afterAll(() => __setCourseCapabilityOverrideForTests(ES, null));

  test("the override is visible and leaves the other courses alone", () => {
    expect(hasCapability(ES, "fsrs")).toBe(true);
    expect(hasCapability("it-en", "fsrs")).toBe(false);
    expect(hasCapability("fr-en", "fsrs")).toBe(true);
  });

  test("ids: a course without a registry keys cards by raw surface", () => {
    expect(itemIdForCourse(ES, words[0].target)).toBe(words[0].target);
  });

  test("applyEvidence routes Spanish evidence through the FSRS gate and review log", () => {
    let course: CourseProgress = { xp: 0, completedLessons: {}, mistakes: [], wordStats: {}, srs: {} };
    let log = [] as ReturnType<typeof applyEvidence>["reviewLog"];
    const surfaces = words.slice(0, 3).map((w) => w.target);
    surfaces.forEach((s, i) => {
      const out = applyEvidence({ courseId: ES, course, reviewLog: log, ev: evidence(s, i !== 1, i), now: T0 + i * 60_000 });
      course = out.course;
      log = out.reviewLog;
      expect(out.mutated).toBe(true);
    });
    expect(Object.keys(course.cards ?? {}).sort()).toEqual(surfaces.map((s) => `${s}|recognize`).sort());
    expect(course.srs).toEqual({}); // the legacy map is untouched
    expect(log).toHaveLength(3);
    expect(log.every((e) => e.courseId === ES && e.mutation !== undefined)).toBe(true);
    expect(course.wordStats[surfaces[1]]).toEqual({ correct: 0, wrong: 1, lastSeen: T0 + 60_000 });
  });

  test("the due queue and the review builder render Spanish words from FSRS cards", () => {
    const surfaces = words.slice(0, 4).map((w) => w.target);
    const cards = Object.fromEntries(surfaces.map((s, i) => [`${s}|recognize`, dueCard(i + 1)]));
    const queue = dueReviewQueue(ES, cards, T0);
    expect(queue.map((d) => d.surface).sort()).toEqual([...surfaces].sort());
    const def = buildReviewSessionDefinition({ courseId: ES, course: { cards, srs: undefined }, pool: words, now: T0 });
    expect(def.kind).toBe("review");
    expect(def.courseId).toBe(ES);
    expect(def.allowUndo).toBe(true);
    expect(def.steps.length).toBe(4);
    for (const step of def.steps) {
      expect(step.type).toBe("exercise");
      if (step.type === "exercise") {
        expect(step.exercise.type).toBe("select");
        expect(step.evidence?.srsRole).toBe("assessment");
        expect(surfaces).toContain(step.evidence?.itemId ?? "");
      }
    }
  });

  test("the TODAY composer builds a Spanish session (warm-up from cards, nothing new without gradeTargets)", () => {
    const surfaces = words.slice(0, 5).map((w) => w.target);
    const cards = Object.fromEntries(surfaces.map((s, i) => [`${s}|recognize`, dueCard(i + 1)]));
    const plan = composeTodaySession({ courseId: ES, pack, completedLessons: {}, cards, preset: "regular", seed: 7, now: T0 });
    expect(plan.reviewCount).toBe(5);
    expect(plan.backlogTotal).toBe(5);
    // Spanish lessons carry no compiler gradeTargets (no id registry), so
    // the frontier teaches nothing — honest, not a crash.
    expect(plan.newCount).toBe(0);
    const prompts = plan.steps.flatMap((s) => (s.type === "exercise" && s.exercise.type === "select" ? [s.exercise.prompt] : []));
    expect(prompts.length).toBeGreaterThan(0);
    for (const p of prompts) expect(words.some((w) => w.target === p || w.native === p)).toBe(true);
  });
});

/**
 * P2b decision D-4 at the STORE level with the real courses: `fr-en` and
 * `fr-vi` are two courses of ONE target language, so a review taken in the
 * Vietnamese-native course updates the FSRS card the English-native course
 * loads (and vice versa), the placement / checkpoint record is the target
 * language's, while lesson completion, XP and the review-log window stay
 * per course. Runs on the SQLite learner store (the device path).
 */
import { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, test, setSystemTime } from "bun:test";

import { catalog } from "../content";
import { courseProfile } from "../course-profile";
import type { ReviewEvidence } from "../learning/evidence";
import { __setLearnerStoreForTests, learnerStore } from "../persistence/learner";
import { SqlLearnerStore } from "../persistence/learner-sql";
import { assessmentFor, useProgress, whenLearnerReady } from "../store";
import type { PlacementResult } from "../assessment/types";
import { memoryStorage } from "./helpers/mocks";
import { bunSqliteExecutor } from "./helpers/sqlite-executor";

const T0 = new Date("2026-10-15T08:00:00").getTime();
const CARD = "fr:w:homme|recognize";

const kv = {
  async getItem(key: string) {
    return memoryStorage.get(key) ?? null;
  },
  async setItem(key: string, value: string) {
    memoryStorage.set(key, value);
  },
  async removeItem(key: string) {
    memoryStorage.delete(key);
  },
};

function evidence(courseId: string, i: number, correct: boolean): ReviewEvidence {
  return {
    cardKey: { itemId: "fr:w:homme", skill: "recognize" },
    sessionId: `${courseId}:lesson-${i}`,
    exerciseId: `${courseId}:u0-l0-e${i}`,
    modality: "recognizeText",
    srsRole: "assessment",
    source: "lesson",
    correct,
    hinted: false,
    assisted: false,
    toleranceUsed: false,
    latencyMs: 1500,
    attemptIndex: 0,
  };
}

const placement: PlacementResult = {
  placementVersion: 1,
  completedAt: T0,
  recommendedLessonId: "fr-vi:ua-l0",
  recommendedFloorIndex: 20,
  objectiveEstimates: [],
  itemResults: [],
};

async function resetWorld(firstCourse: string): Promise<void> {
  setSystemTime(new Date(T0));
  useProgress.setState({ courses: {}, reviewLog: [], activeDays: {}, streak: 0, lastActiveDay: null as unknown as string, dailyXp: 0, assessmentByTarget: {} } as never);
  memoryStorage.clear();
  const store = new SqlLearnerStore(bunSqliteExecutor(new Database(":memory:")));
  await store.init();
  __setLearnerStoreForTests(store, kv);
  await useProgress.persist.rehydrate();
  await whenLearnerReady();
  useProgress.getState().finishOnboarding(firstCourse, 20);
  await useProgress.getState().loadLearnerCourse(firstCourse);
}

async function switchTo(courseId: string): Promise<void> {
  useProgress.getState().setActiveCourse(courseId);
  await useProgress.getState().loadLearnerCourse(courseId);
}

describe("fr-vi and fr-en share French learner memory (D-4, store level)", () => {
  beforeEach(() => resetWorld("fr-vi"));
  afterEach(() => __setLearnerStoreForTests(null));

  test("both courses ship, with the same capabilities and the same card id space", () => {
    expect(catalog.courses.map((c) => c.id)).toContain("fr-vi");
    expect(courseProfile("fr-vi").capabilities).toEqual(courseProfile("fr-en").capabilities);
    expect(courseProfile("fr-vi").idPrefix).toBe("fr:w:");
  });

  test("a review in fr-vi is the card fr-en sees; the log window and lesson completion stay per course", async () => {
    const s = useProgress.getState();
    expect(s.submitEvidence(evidence("fr-vi", 0, true), "fr-vi")).toBe(true);
    expect(s.submitEvidence(evidence("fr-vi", 1, false), "fr-vi")).toBe(true);
    s.completeLesson("fr-vi:u0-l0", false);
    await s.flushLearner();
    const viCard = useProgress.getState().courses["fr-vi"].cards![CARD];
    expect(viCard.reps).toBe(2);
    expect(useProgress.getState().reviewLog.filter((e) => e.courseId === "fr-vi").length).toBe(2);

    await switchTo("fr-en");
    const after = useProgress.getState();
    // The card is one record per target language — same reps, same state.
    expect(after.courses["fr-en"].cards![CARD]).toEqual(viCard);
    // Memory only holds the active course's window: the fr-vi entries stay in the store.
    expect(after.reviewLog.filter((e) => e.courseId === "fr-vi").length).toBe(0);
    expect(after.reviewLog.filter((e) => e.courseId === "fr-en").length).toBe(0);
    const store = await learnerStore();
    expect((await store.loadCourse("fr-vi")).reviewLog.length).toBe(2);
    // Lesson completion and XP are the course's own.
    expect(after.courses["fr-en"].completedLessons["fr-en:u0-l0"]).toBeUndefined();
    expect(after.courses["fr-en"].xp).toBe(0);
    expect(after.courses["fr-vi"].completedLessons["fr-vi:u0-l0"]).toBe(true);

    // And back: a further review in fr-en advances the card fr-vi loads.
    expect(after.submitEvidence(evidence("fr-en", 2, true), "fr-en")).toBe(true);
    await after.flushLearner();
    await switchTo("fr-vi");
    expect(useProgress.getState().courses["fr-vi"].cards![CARD].reps).toBe(3);
    // One card in the store, keyed by the target language.
    const all = await (await learnerStore()).exportAll();
    expect(Object.keys(all.cards)).toEqual(["fr"]);
    expect(Object.keys(all.cards.fr)).toEqual([CARD]);
    expect(all.reviewLog.map((e) => e.courseId).sort()).toEqual(["fr-en", "fr-vi", "fr-vi"]);
  });

  test("placement and checkpoint records are the target language's, tagged with the course that produced them", () => {
    useProgress.getState().setPlacementResult(placement, 20);
    const viewVi = assessmentFor(useProgress.getState(), "fr-vi");
    const viewEn = assessmentFor(useProgress.getState(), "fr-en");
    expect(viewEn).toEqual(viewVi);
    expect(viewEn.placement?.courseId).toBe("fr-vi");
    expect(viewEn.placementFloor).toBe(20);
    expect(Object.keys(useProgress.getState().assessmentByTarget)).toEqual(["fr"]);
  });
});

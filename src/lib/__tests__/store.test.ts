import { beforeEach, describe, expect, test } from "bun:test";

import { dayString } from "../dates";
import { __setMigrationFailureForTests } from "../persistence/migrations";
import {
  dailyQuests,
  lastSevenDays,
  PROGRESS_STORAGE_KEY,
  useProgress,
} from "../store";
import { memoryStorage } from "./helpers/mocks";
import richFixture from "../__fixtures__/progress/v0-rich.json";

function resetStore() {
  useProgress.setState({
    activeCourseId: "es-en",
    streak: 0,
    lastActiveDay: null,
    dailyGoal: 20,
    dailyXp: 0,
    dailyXpDay: null,
    onboardingDone: false,
    themePreference: "system",
    courses: {},
    activeDays: {},
  });
}

async function rehydrateFrom(fixture: unknown) {
  memoryStorage.set(PROGRESS_STORAGE_KEY, JSON.stringify(fixture));
  await useProgress.persist.rehydrate();
}

beforeEach(() => {
  memoryStorage.clear();
  resetStore();
});

describe("persist wiring: rehydrate runs the full migration chain", () => {
  test("v0 fixture rehydrates at the latest version: French on FSRS cards, next write stores version 3", async () => {
    await rehydrateFrom(richFixture);
    const s = useProgress.getState();
    expect(s.streak).toBe(5);
    expect(s.themePreference).toBe("dark");
    expect(s.courses["fr-en"].xp).toBe(215);
    expect(s.courses["fr-en"].completedLessons["srs"]).toBeUndefined();
    expect(s.courses["fr-en"].completedLessons["fr-en:u0-l0"]).toBe(true);
    // v2: French srs became FSRS cards under stable ids (legacy copy kept).
    expect(s.courses["fr-en"].srs).toBeUndefined();
    expect(s.courses["fr-en"].cards!["fr:w:homme|recognize"].stability).toBe(3);
    expect(s.courses["fr-en"].srsLegacy!["l'homme"].interval).toBe(3);

    useProgress.getState().setThemePreference("light");
    await new Promise((r) => setTimeout(r, 0)); // let persist flush
    const raw = memoryStorage.get(PROGRESS_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const stored = JSON.parse(raw as string);
    expect(stored.version).toBe(3);
    expect(stored.state.themePreference).toBe("light");
    expect(stored.state.courses["fr-en"].completedLessons["srs"]).toBeUndefined();
    expect(stored.state.courses["fr-en"].cards["fr:w:femme|recognize"].state).toBe("new");
  });

  test("a failing migration leaves stored bytes untouched (fail closed)", async () => {
    const before = JSON.stringify(richFixture);
    memoryStorage.set(PROGRESS_STORAGE_KEY, before);
    __setMigrationFailureForTests(2);
    try {
      await Promise.resolve(useProgress.persist.rehydrate()).catch(() => undefined);
    } finally {
      __setMigrationFailureForTests(null);
    }
    // The learner's only copy of their data was not rewritten or lost —
    // the next launch (with the bug fixed) migrates it normally.
    expect(memoryStorage.get(PROGRESS_STORAGE_KEY)).toBe(before);
    await useProgress.persist.rehydrate();
    expect(useProgress.getState().courses["fr-en"].cards).toBeDefined();
  });
});

describe("completeLesson", () => {
  test("first completion awards XP; replay is activity-only (no re-award)", () => {
    const today = dayString(new Date());
    useProgress.getState().completeLesson("l1", true);
    let s = useProgress.getState();
    expect(s.courses["es-en"].xp).toBe(20); // 15 + 5 perfect
    expect(s.courses["es-en"].completedLessons["l1"]).toBe(true);
    expect(s.dailyXp).toBe(20);
    expect(s.activeDays[today]).toEqual({ xp: 20, lessons: 1, perfect: 1, sessions: 0 });
    expect(s.streak).toBe(1);
    expect(s.lastActiveDay).toBe(today);

    useProgress.getState().completeLesson("l1", false);
    s = useProgress.getState();
    expect(s.courses["es-en"].xp).toBe(20); // unchanged
    expect(s.dailyXp).toBe(20); // unchanged
    expect(Object.keys(s.courses["es-en"].completedLessons)).toEqual(["l1"]);
    expect(s.activeDays[today].lessons).toBe(1);
    expect(s.activeDays[today].sessions).toBe(1); // replay counted as a session
    expect(s.lastActiveDay).toBe(today); // still activity
  });

  test("a different lesson still awards normally", () => {
    useProgress.getState().completeLesson("l1", false);
    useProgress.getState().completeLesson("l2", false);
    const s = useProgress.getState();
    expect(s.courses["es-en"].xp).toBe(30);
    expect(Object.keys(s.courses["es-en"].completedLessons).sort()).toEqual([
      "l1",
      "l2",
    ]);
  });
});

describe("recordPracticeSession", () => {
  test("counts as activity but never as completion or XP", () => {
    const today = dayString(new Date());
    useProgress.getState().recordPracticeSession();
    const s = useProgress.getState();
    expect(s.lastActiveDay).toBe(today);
    expect(s.streak).toBe(1);
    expect(s.dailyXp).toBe(0);
    expect(s.courses["es-en"]?.completedLessons ?? {}).toEqual({});
    expect(s.activeDays[today].sessions).toBe(1);
    expect(s.activeDays[today].lessons).toBe(0);
  });
});

describe("daily quests re-spec", () => {
  test("lessons-or-reviews quest counts both", () => {
    useProgress.getState().completeLesson("l1", false);
    useProgress.getState().recordPracticeSession();
    useProgress.getState().recordPracticeSession();
    const quests = dailyQuests(useProgress.getState());
    const lessonQuest = quests.find((q) => q.id === "lessons");
    expect(lessonQuest?.value).toBe(3);
    expect(lessonQuest?.done).toBe(true);
  });
});

describe("streak calendar", () => {
  test("a practice-only day lights up in the 7-day strip", () => {
    useProgress.getState().recordPracticeSession();
    const week = lastSevenDays(useProgress.getState());
    expect(week[6].active).toBe(true);
    expect(week.slice(0, 6).every((d) => !d.active)).toBe(true);
  });
});

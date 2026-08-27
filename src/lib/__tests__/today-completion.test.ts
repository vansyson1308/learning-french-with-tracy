import { afterEach, beforeEach, describe, expect, test, setSystemTime } from "bun:test";

import { dayString } from "../dates";
import { dailyQuests, useProgress, XP_PER_LESSON } from "../store";
import { memoryStorage } from "./helpers/mocks";

const NOW = new Date(2026, 7, 20, 15, 0, 0);

beforeEach(async () => {
  useProgress.setState({
    activeCourseId: "fr-en",
    streak: 0,
    lastActiveDay: null,
    dailyGoal: 20,
    dailyXp: 0,
    dailyXpDay: null,
    onboardingDone: true,
    themePreference: "system",
    courses: {},
    activeDays: {},
    reviewLog: [],
  });
  await new Promise((r) => setTimeout(r, 0));
  memoryStorage.clear();
  setSystemTime(NOW);
});

afterEach(() => setSystemTime());

describe("completeTodaySession (§58-61)", () => {
  test("bounded XP, activity, streak — never a lesson completion", () => {
    useProgress.getState().completeTodaySession(7);
    const s = useProgress.getState();
    const today = dayString(NOW);

    expect(s.courses["fr-en"].xp).toBe(7);
    expect(s.dailyXp).toBe(7);
    expect(s.activeDays[today].xp).toBe(7);
    expect(s.activeDays[today].sessions).toBe(1);
    expect(s.activeDays[today].lessons).toBe(0); // not a lesson
    expect(s.activeDays[today].perfect).toBe(0); // never perfect credit
    expect(s.courses["fr-en"].completedLessons).toEqual({}); // no unlock
    expect(s.streak).toBe(1);
    expect(s.lastActiveDay).toBe(today);
  });

  test("XP is capped at XP_PER_LESSON and sanitized", () => {
    useProgress.getState().completeTodaySession(50);
    expect(useProgress.getState().courses["fr-en"].xp).toBe(XP_PER_LESSON);

    useProgress.setState({ courses: {} });
    useProgress.getState().completeTodaySession(-3);
    expect(useProgress.getState().courses["fr-en"].xp).toBe(0);

    useProgress.setState({ courses: {} });
    useProgress.getState().completeTodaySession(Number.NaN);
    expect(useProgress.getState().courses["fr-en"].xp).toBe(0);
  });

  test("a zero-assessment session still counts as activity", () => {
    useProgress.getState().completeTodaySession(0);
    const s = useProgress.getState();
    expect(s.activeDays[dayString(NOW)].sessions).toBe(1);
    expect(s.streak).toBe(1);
    expect(s.dailyXp).toBe(0);
  });

  test("two sessions accumulate sessions and XP independently", () => {
    useProgress.getState().completeTodaySession(5);
    useProgress.getState().completeTodaySession(3);
    const s = useProgress.getState();
    expect(s.activeDays[dayString(NOW)].sessions).toBe(2);
    expect(s.dailyXp).toBe(8);
    expect(s.courses["fr-en"].xp).toBe(8);
  });
});

describe("TODAY × daily quests (§62)", () => {
  test("TODAY sessions advance the XP quest and the lessons-or-sessions quest", () => {
    useProgress.getState().completeTodaySession(12);
    const quests = dailyQuests(useProgress.getState());
    const xpQuest = quests.find((q) => q.id === "xp")!;
    const lessonsQuest = quests.find((q) => q.id === "lessons")!;
    const perfectQuest = quests.find((q) => q.id === "perfect")!;

    expect(xpQuest.value).toBe(12);
    expect(lessonsQuest.value).toBe(1); // sessions count toward it
    expect(perfectQuest.value).toBe(0); // perfect stays PATH-only
  });

  test("three TODAY sessions can complete the lessons-or-sessions quest", () => {
    for (let i = 0; i < 3; i++) useProgress.getState().completeTodaySession(1);
    const quest = dailyQuests(useProgress.getState()).find((q) => q.id === "lessons")!;
    expect(quest.done).toBe(true);
  });
});

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { addDays, dayString, localWeek } from "./dates";
import {
  DEFAULT_COURSE_ID,
  migrateProgress,
  PERSIST_VERSION,
} from "./persistence/migrations";
import { isDue, reviewWord, type SrsEntry } from "./srs";

export const XP_PER_LESSON = 15;
export const XP_PERFECT_BONUS = 5;
export const DAILY_GOAL_OPTIONS = [10, 20, 30, 50] as const;
export const DEFAULT_DAILY_GOAL = 20;
export const DEFAULT_COURSE = DEFAULT_COURSE_ID;
/** The AsyncStorage key. Never renamed — schema changes bump PERSIST_VERSION. */
export const PROGRESS_STORAGE_KEY = "progress-v2";
/** Days of per-day history kept for the streak calendar and quests. */
const DAY_HISTORY_LIMIT = 70;

export type ThemePreference = "system" | "light" | "dark";
export type WordStat = { correct: number; wrong: number; lastSeen: number };
export type MistakeRef = { lessonId: string; exerciseId: string };
export type DayActivity = {
  xp: number;
  lessons: number;
  perfect: number;
  /** Practice/review sessions and lesson replays (added in v1). */
  sessions?: number;
};

export type CourseProgress = {
  xp: number;
  completedLessons: Record<string, true>;
  mistakes: MistakeRef[];
  wordStats: Record<string, WordStat>;
  srs: Record<string, SrsEntry>;
};

function emptyCourseProgress(): CourseProgress {
  return {
    xp: 0,
    completedLessons: {},
    mistakes: [],
    wordStats: {},
    srs: {},
  };
}

type ProgressState = {
  activeCourseId: string;
  streak: number;
  lastActiveDay: string | null;
  dailyGoal: number;
  dailyXp: number;
  dailyXpDay: string | null;
  onboardingDone: boolean;
  /** "system" follows the device's light/dark setting. */
  themePreference: ThemePreference;
  courses: Record<string, CourseProgress>;
  /** Per-day activity across courses, for the streak calendar and quests. */
  activeDays: Record<string, DayActivity>;

  course: () => CourseProgress;
  completeLesson: (lessonId: string, perfect: boolean) => void;
  /** Mistake/review practice: counts as activity, never as lesson completion. */
  recordPracticeSession: () => void;
  addMistake: (mistake: MistakeRef) => void;
  clearMistake: (exerciseId: string) => void;
  recordWord: (target: string, correct: boolean) => void;
  reviewSrsWord: (target: string, correct: boolean) => void;
  setActiveCourse: (courseId: string) => void;
  setThemePreference: (preference: ThemePreference) => void;
  finishOnboarding: (courseId: string, goal: number) => void;
};

function bumpDailyXp(state: ProgressState, amount: number, today: string) {
  const dailyXp = state.dailyXpDay === today ? state.dailyXp + amount : amount;
  return { dailyXp, dailyXpDay: today };
}

/** Streak/day fields shared by lesson completion, replays and practice. */
function activityBase(state: ProgressState, now: Date) {
  const today = dayString(now);
  const yesterday = dayString(addDays(now, -1));
  const streak =
    state.lastActiveDay === today
      ? state.streak
      : state.lastActiveDay === yesterday
        ? state.streak + 1
        : 1;
  return { today, streak };
}

function pruneDays(days: Record<string, DayActivity>) {
  const keys = Object.keys(days).sort();
  if (keys.length <= DAY_HISTORY_LIMIT) return days;
  const keep = new Set(keys.slice(-DAY_HISTORY_LIMIT));
  return Object.fromEntries(Object.entries(days).filter(([k]) => keep.has(k)));
}

function updateCourse(
  state: ProgressState,
  courseId: string,
  fn: (c: CourseProgress) => CourseProgress
): Partial<ProgressState> {
  const prev = state.courses[courseId] ?? emptyCourseProgress();
  return { courses: { ...state.courses, [courseId]: fn(prev) } };
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      activeCourseId: DEFAULT_COURSE,
      streak: 0,
      lastActiveDay: null,
      dailyGoal: DEFAULT_DAILY_GOAL,
      dailyXp: 0,
      dailyXpDay: null,
      onboardingDone: false,
      themePreference: "system",
      courses: {},
      activeDays: {},

      course: () => get().courses[get().activeCourseId] ?? emptyCourseProgress(),

      completeLesson: (lessonId, perfect) =>
        set((state) => {
          const { today, streak } = activityBase(state, new Date());
          const prevDay = state.activeDays[today] ?? {
            xp: 0,
            lessons: 0,
            perfect: 0,
          };
          const alreadyCompleted =
            !!state.courses[state.activeCourseId]?.completedLessons[lessonId];

          if (alreadyCompleted) {
            // Replaying a finished lesson counts as activity, not as a fresh
            // completion — no XP, no lesson count (closes the replay-farming
            // exploit while keeping the streak reachable).
            const activeDays = pruneDays({
              ...state.activeDays,
              [today]: { ...prevDay, sessions: (prevDay.sessions ?? 0) + 1 },
            });
            return { streak, lastActiveDay: today, activeDays };
          }

          const earned = XP_PER_LESSON + (perfect ? XP_PERFECT_BONUS : 0);
          const daily = bumpDailyXp(state, earned, today);
          const activeDays = pruneDays({
            ...state.activeDays,
            [today]: {
              xp: prevDay.xp + earned,
              lessons: prevDay.lessons + 1,
              perfect: prevDay.perfect + (perfect ? 1 : 0),
              sessions: prevDay.sessions ?? 0,
            },
          });
          const courseUpdate = updateCourse(state, state.activeCourseId, (c) => ({
            ...c,
            xp: c.xp + earned,
            completedLessons: { ...c.completedLessons, [lessonId]: true },
          }));
          return { streak, lastActiveDay: today, activeDays, ...daily, ...courseUpdate };
        }),

      recordPracticeSession: () =>
        set((state) => {
          const { today, streak } = activityBase(state, new Date());
          const prevDay = state.activeDays[today] ?? {
            xp: 0,
            lessons: 0,
            perfect: 0,
          };
          const activeDays = pruneDays({
            ...state.activeDays,
            [today]: { ...prevDay, sessions: (prevDay.sessions ?? 0) + 1 },
          });
          return { streak, lastActiveDay: today, activeDays };
        }),

      addMistake: (mistake) =>
        set((state) =>
          updateCourse(state, state.activeCourseId, (c) =>
            c.mistakes.some((m) => m.exerciseId === mistake.exerciseId)
              ? c
              : { ...c, mistakes: [...c.mistakes, mistake] }
          )
        ),

      clearMistake: (exerciseId) =>
        set((state) =>
          updateCourse(state, state.activeCourseId, (c) => ({
            ...c,
            mistakes: c.mistakes.filter((m) => m.exerciseId !== exerciseId),
          }))
        ),

      recordWord: (target, correct) =>
        set((state) =>
          updateCourse(state, state.activeCourseId, (c) => {
            const prev = c.wordStats[target] ?? { correct: 0, wrong: 0, lastSeen: 0 };
            const quality = correct ? (prev.wrong > prev.correct ? 1 : 2) : 0;
            return {
              ...c,
              wordStats: {
                ...c.wordStats,
                [target]: {
                  correct: prev.correct + (correct ? 1 : 0),
                  wrong: prev.wrong + (correct ? 0 : 1),
                  lastSeen: Date.now(),
                },
              },
              srs: { ...c.srs, [target]: reviewWord(c.srs[target], quality) },
            };
          })
        ),

      reviewSrsWord: (target, correct) =>
        set((state) =>
          updateCourse(state, state.activeCourseId, (c) => ({
            ...c,
            srs: { ...c.srs, [target]: reviewWord(c.srs[target], correct ? 2 : 0) },
          }))
        ),

      setActiveCourse: (courseId) => set({ activeCourseId: courseId }),

      setThemePreference: (preference) => set({ themePreference: preference }),

      finishOnboarding: (courseId, goal) =>
        set({ activeCourseId: courseId, dailyGoal: goal, onboardingDone: true }),
    }),
    {
      name: PROGRESS_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      version: PERSIST_VERSION,
      migrate: (persisted, version) =>
        migrateProgress(persisted, version, new Date()) as unknown as ProgressState,
    }
  )
);

export function currentLessonIndex(
  completed: Record<string, true>,
  lessonIds: string[]
) {
  const firstIncomplete = lessonIds.findIndex((id) => !completed[id]);
  return firstIncomplete === -1 ? lessonIds.length : firstIncomplete;
}

export function dailyXpToday(state: Pick<ProgressState, "dailyXp" | "dailyXpDay">) {
  const today = dayString(new Date());
  return state.dailyXpDay === today ? state.dailyXp : 0;
}

/**
 * The streak as it should be displayed *now*: the stored value goes stale if a
 * full day was missed (it's only recomputed on lesson completion).
 */
export function currentStreak(
  state: Pick<ProgressState, "streak" | "lastActiveDay">,
  now = new Date()
) {
  const today = dayString(now);
  const yesterday = dayString(addDays(now, -1));
  return state.lastActiveDay === today || state.lastActiveDay === yesterday
    ? state.streak
    : 0;
}

/** True once a lesson or practice session finished today (lights the flame). */
export function activeToday(state: Pick<ProgressState, "lastActiveDay">) {
  return state.lastActiveDay === dayString(new Date());
}

export function todayActivity(
  state: Pick<ProgressState, "activeDays">
): DayActivity {
  return (
    state.activeDays[dayString(new Date())] ?? { xp: 0, lessons: 0, perfect: 0 }
  );
}

export type Quest = {
  id: string;
  label: string;
  target: number;
  value: number;
  done: boolean;
};

export function dailyQuests(
  state: Pick<ProgressState, "activeDays" | "dailyGoal">
): Quest[] {
  const today = todayActivity(state);
  const make = (id: string, label: string, target: number, value: number): Quest => ({
    id,
    label,
    target,
    value: Math.min(value, target),
    done: value >= target,
  });
  return [
    make("xp", `Earn ${state.dailyGoal} XP`, state.dailyGoal, today.xp),
    make(
      "lessons",
      "Finish 3 lessons or reviews",
      3,
      today.lessons + (today.sessions ?? 0)
    ),
    make("perfect", "Get 1 perfect lesson", 1, today.perfect),
  ];
}

/** Rolling 7-day window ending today, for the streak calendar strip. */
export function lastSevenDays(state: Pick<ProgressState, "activeDays">) {
  return localWeek(new Date()).map((d) => {
    const activity = state.activeDays[d.day];
    return {
      ...d,
      active: (activity?.lessons ?? 0) + (activity?.sessions ?? 0) > 0,
    };
  });
}

export function dueSrsWords(srs: Record<string, SrsEntry>, now = Date.now()) {
  return Object.entries(srs)
    .filter(([, entry]) => isDue(entry, now))
    .map(([target]) => target);
}

/**
 * Pure persisted-state migrations. No React Native imports — every step is a
 * plain (state, now) => state function so the chain is unit-testable and the
 * backup importer can reuse it (see backup-core.ts).
 *
 * Version ladder (the AsyncStorage key stays "progress-v2" — the key name and
 * the schema version are separate concepts):
 *   v0  implicit zustand default — what every install before Phase 0 has
 *   v1  Phase 0: explicit versioning, practice-pollution pruning, local-day
 *       streak grandfathering
 */

import {
  grandfatherLastActiveDay,
  grandfatherTodayField,
} from "../dates";
import type { SrsEntry } from "../srs";

export const PERSIST_VERSION = 1;

/** Course flat-legacy (pre-per-course) progress nests under. */
export const DEFAULT_COURSE_ID = "es-en";

export type PersistedWordStat = { correct: number; wrong: number; lastSeen: number };
export type PersistedMistake = { lessonId: string; exerciseId: string };
export type PersistedCourseProgress = {
  xp: number;
  completedLessons: Record<string, true>;
  mistakes: PersistedMistake[];
  wordStats: Record<string, PersistedWordStat>;
  srs: Record<string, SrsEntry>;
} & Record<string, unknown>;
export type PersistedDayActivity = {
  xp: number;
  lessons: number;
  perfect: number;
  /** Practice/review sessions (added in v1; absent in older day entries). */
  sessions?: number;
};
export type PersistedProgress = {
  activeCourseId: string;
  streak: number;
  lastActiveDay: string | null;
  dailyGoal: number;
  dailyXp: number;
  dailyXpDay: string | null;
  onboardingDone: boolean;
  themePreference: "system" | "light" | "dark";
  courses: Record<string, PersistedCourseProgress>;
  activeDays: Record<string, PersistedDayActivity>;
} & Record<string, unknown>;

/** Route ids that practice sessions historically wrote into completedLessons. */
const PRACTICE_SENTINELS = ["mistakes", "srs"] as const;

function emptyCourse(): PersistedCourseProgress {
  return { xp: 0, completedLessons: {}, mistakes: [], wordStats: {}, srs: {} };
}

/**
 * The very first schema was flat (no `courses` map). The old in-code migration
 * for it was unreachable (no persist version was ever set) and, had it run,
 * would have dropped `themePreference` and `activeDays` — this version keeps
 * them.
 */
function nestFlatLegacy(old: Record<string, unknown>): PersistedProgress {
  const legacy = old as Partial<PersistedCourseProgress> & Record<string, unknown>;
  return {
    activeCourseId: DEFAULT_COURSE_ID,
    streak: typeof old.streak === "number" ? old.streak : 0,
    lastActiveDay: typeof old.lastActiveDay === "string" ? old.lastActiveDay : null,
    dailyGoal: typeof old.dailyGoal === "number" ? old.dailyGoal : 20,
    dailyXp: typeof old.dailyXp === "number" ? old.dailyXp : 0,
    dailyXpDay: typeof old.dailyXpDay === "string" ? old.dailyXpDay : null,
    onboardingDone: old.onboardingDone === true,
    themePreference:
      old.themePreference === "light" || old.themePreference === "dark"
        ? old.themePreference
        : "system",
    activeDays:
      old.activeDays && typeof old.activeDays === "object"
        ? (old.activeDays as PersistedProgress["activeDays"])
        : {},
    courses: {
      [DEFAULT_COURSE_ID]: {
        ...emptyCourse(),
        xp: typeof legacy.xp === "number" ? legacy.xp : 0,
        completedLessons: legacy.completedLessons ?? {},
        mistakes: legacy.mistakes ?? [],
        wordStats: legacy.wordStats ?? {},
        srs: legacy.srs ?? {},
      },
    },
  };
}

function migrateV0toV1(persisted: unknown, now: Date): PersistedProgress {
  const raw =
    persisted && typeof persisted === "object"
      ? (persisted as Record<string, unknown>)
      : {};
  const base: PersistedProgress = raw.courses
    ? ({ ...raw } as PersistedProgress)
    : nestFlatLegacy(raw);

  base.themePreference =
    base.themePreference === "light" || base.themePreference === "dark"
      ? base.themePreference
      : "system";
  base.activeDays =
    base.activeDays && typeof base.activeDays === "object" ? base.activeDays : {};

  // Practice sessions used to write completedLessons["mistakes"|"srs"],
  // inflating lesson counts. Prune the stored pollution.
  const courses: PersistedProgress["courses"] = {};
  for (const [courseId, course] of Object.entries(base.courses ?? {})) {
    const completedLessons = { ...(course?.completedLessons ?? {}) };
    for (const sentinel of PRACTICE_SENTINELS) delete completedLessons[sentinel];
    courses[courseId] = { ...emptyCourse(), ...course, completedLessons };
  }
  base.courses = courses;

  // Day keys were UTC before v1; rewrite live ones to local so nobody's
  // streak or daily goal breaks on update day.
  base.lastActiveDay = grandfatherLastActiveDay(base.lastActiveDay ?? null, now);
  base.dailyXpDay = grandfatherTodayField(base.dailyXpDay ?? null, now);
  if (typeof base.streak !== "number" || !Number.isFinite(base.streak)) base.streak = 0;

  return base;
}

/** Run every step from `fromVersion` up to PERSIST_VERSION. */
export function migrateProgress(
  persisted: unknown,
  fromVersion: number,
  now: Date
): PersistedProgress {
  let state: unknown = persisted;
  if (fromVersion < 1) state = migrateV0toV1(state, now);
  return state as PersistedProgress;
}

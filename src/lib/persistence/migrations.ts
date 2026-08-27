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
 *   v2  Phase 1: fr-en ONLY moves to FSRS — srs → cards (stable ids via
 *       SM-2 estimation) + srsLegacy rollback copy + wordStats re-key;
 *       top-level reviewLog initialized. Every other course byte-preserved.
 */

import {
  grandfatherLastActiveDay,
  grandfatherTodayField,
} from "../dates";
import { serializeCardKey } from "../learning/card-key";
import { FR_COURSE_ID, frItemIdFor, isWordMappedFrSurface } from "../learning/ids-fr";
import type { ReviewLogEntry } from "../learning/review-log";
import type { FsrsCardState } from "../learning/scheduler";
import { estimateFsrsCardFromSm2 } from "../learning/sm2-migration";
import type { SrsEntry } from "../srs";

export const PERSIST_VERSION = 2;

/** Course flat-legacy (pre-per-course) progress nests under. */
export const DEFAULT_COURSE_ID = "es-en";

export type PersistedWordStat = { correct: number; wrong: number; lastSeen: number };
export type PersistedMistake = { lessonId: string; exerciseId: string };
export type PersistedCourseProgress = {
  xp: number;
  completedLessons: Record<string, true>;
  mistakes: PersistedMistake[];
  wordStats: Record<string, PersistedWordStat>;
  /** Legacy scheduler state. Absent for fr-en from v2 on. */
  srs?: Record<string, SrsEntry>;
  /** FSRS cards keyed by serialized CardKey. fr-en only, from v2. */
  cards?: Record<string, FsrsCardState>;
  /** One-release rollback copy of the pre-v2 fr srs map (removed in v3). */
  srsLegacy?: Record<string, SrsEntry>;
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
  /** Append-only evidence log (added in v2), ring-capped in the store. */
  reviewLog?: ReviewLogEntry[];
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

export function mergeWordStats(
  a: PersistedWordStat,
  b: PersistedWordStat
): PersistedWordStat {
  return {
    correct: a.correct + b.correct,
    wrong: a.wrong + b.wrong,
    lastSeen: Math.max(a.lastSeen, b.lastSeen),
  };
}

/**
 * v1 → v2: French-first FSRS. Touches ONLY courses["fr-en"] (plus adding the
 * empty top-level reviewLog); every other course object passes through
 * untouched — asserted byte-identical by tests, not aspirationally.
 *
 * For fr-en:
 * - every srs entry becomes an FSRS card under (stable itemId, "recognize");
 *   unknown surfaces get reversible fr:legacy: ids — zero entries dropped
 * - the old srs map is kept verbatim as srsLegacy (one-release rollback)
 * - wordStats re-key through the same ids; collisions merge sum/sum/max
 */
function migrateV1toV2(persisted: PersistedProgress): PersistedProgress {
  const next: PersistedProgress = {
    ...persisted,
    reviewLog: Array.isArray(persisted.reviewLog) ? persisted.reviewLog : [],
  };
  const fr = persisted.courses?.[FR_COURSE_ID];
  if (!fr) return next;

  const srs = fr.srs ?? {};
  const cards: Record<string, FsrsCardState> = {};
  let orphanCount = 0;
  for (const [surface, entry] of Object.entries(srs)) {
    if (!isWordMappedFrSurface(surface)) orphanCount += 1;
    const key = serializeCardKey({ itemId: frItemIdFor(surface), skill: "recognize" });
    const card = estimateFsrsCardFromSm2(entry, fr.wordStats?.[surface]?.wrong ?? 0);
    const existing = cards[key];
    // Two surfaces can only collide if they map to the same lexeme; keep the
    // more recently reviewed card (defensive — impossible with today's map).
    if (!existing || (card.last_review ?? 0) >= (existing.last_review ?? 0)) {
      cards[key] = card;
    }
  }

  const wordStats: Record<string, PersistedWordStat> = {};
  for (const [surface, stat] of Object.entries(fr.wordStats ?? {})) {
    const id = frItemIdFor(surface);
    wordStats[id] = wordStats[id] ? mergeWordStats(wordStats[id], stat) : { ...stat };
  }

  const { srs: _dropped, ...frRest } = fr;
  next.courses = {
    ...persisted.courses,
    [FR_COURSE_ID]: { ...frRest, cards, srsLegacy: srs, wordStats },
  };
  if (orphanCount > 0 && typeof console !== "undefined") {
    console.info(
      `fr-en migration: ${orphanCount} legacy-keyed card${orphanCount === 1 ? "" : "s"} preserved`
    );
  }
  return next;
}

/**
 * Test seam: force the step that migrates TO the given version to throw, so
 * suites can prove a mid-chain failure leaves stored data untouched.
 */
let failAtVersionForTests: number | null = null;
export function __setMigrationFailureForTests(version: number | null): void {
  failAtVersionForTests = version;
}

function checkFailureSeam(targetVersion: number): void {
  if (failAtVersionForTests === targetVersion) {
    throw new Error(`injected migration failure at v${targetVersion}`);
  }
}

/** Run every step from `fromVersion` up to `toVersion` (default: latest). */
export function migrateProgress(
  persisted: unknown,
  fromVersion: number,
  now: Date,
  toVersion: number = PERSIST_VERSION
): PersistedProgress {
  let state: unknown = persisted;
  if (fromVersion < 1 && toVersion >= 1) {
    checkFailureSeam(1);
    state = migrateV0toV1(state, now);
  }
  if (fromVersion < 2 && toVersion >= 2) {
    checkFailureSeam(2);
    state = migrateV1toV2(state as PersistedProgress);
  }
  return state as PersistedProgress;
}

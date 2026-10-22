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
 *   v3  Phase 6: top-level `assessment` container (checkpoint attempts,
 *       placement result, placement floor). Everything else — srsLegacy
 *       included (§46: its removal needs its own explicit migration
 *       decision) — passes through untouched; placementFloor starts at 0
 *       so existing users behave exactly as before (§89).
 *   v6  P3e: `dailyNewWords` arrives — how many new words the TODAY
 *       session introduces from the course's syllabus each day (0–15);
 *       every existing learner starts at the default (5). Nothing else moves.
 *   v5  P2b: assessment becomes PER TARGET LANGUAGE (`assessmentByTarget`,
 *       decision D-4; attempts and placement record their courseId).
 *   v4  P1d: assessment becomes PER COURSE (`assessmentByCourse`, the v3
 *       data moved under the course it belonged to — French, the only
 *       course with checkpoints/placement before v4); `uiLanguage` arrives
 *       ("system", used by P2a). Cards and the review log leave the blob
 *       for the learner store (SQLite/JSON) on the first launch after v4 —
 *       that move is NOT part of this pure chain (it needs the store): the
 *       bootstrap in persistence/learner.ts imports them and the persist
 *       layer stops serialising them. A v4 state may therefore still carry
 *       `courses[*].cards` / `reviewLog` until that bootstrap ran.
 */

import {
  grandfatherLastActiveDay,
  grandfatherTodayField,
} from "../dates";
import { serializeCardKey } from "../learning/card-key";
import { FR_COURSE_ID, frItemIdFor, isWordMappedFrSurface } from "../learning/ids-fr";
import type { ReviewLogEntry } from "../learning/review-log";
import type { FsrsCardState } from "../learning/scheduler";
import { normalizeDailyNewWords } from "../learning/daily-words-setting";
import { estimateFsrsCardFromSm2 } from "../learning/sm2-migration";
import type { SrsEntry } from "../srs";
import {
  emptyAssessmentState,
  type PersistedAssessmentState,
} from "../assessment/types";

export const PERSIST_VERSION = 6;

/**
 * The course the single v3 `assessment` container belonged to. A MIGRATION
 * constant frozen at the only course that had checkpoints and placement
 * before v4 (French); never read by runtime code.
 */
export const V3_ASSESSMENT_COURSE_ID = "fr-en";

/** UI language preference (P2a reads it): "system" follows the device. */
export type UiLanguagePreference = "system" | "vi" | "en";

/**
 * Course the flat-legacy (pre-per-course, v0) progress nests under. This is
 * a MIGRATION constant frozen at the course the v0 app shipped with; it is
 * deliberately separate from the onboarding default (`DEFAULT_COURSE` in
 * store.ts), which may change without touching persisted data.
 */
export const LEGACY_FLAT_COURSE_ID = "es-en";

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
  /**
   * Rollback copy of the pre-v2 fr srs map. Still retained at v3 — removing
   * rollback data requires a separate explicit migration decision (§46).
   */
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
  /** Learner assessment state (v3 only; moved under assessmentByCourse in v4). */
  assessment?: PersistedAssessmentState;
  /** Per-course assessment state (v4 only; moved under assessmentByTarget in v5). */
  assessmentByCourse?: Record<string, PersistedAssessmentState>;
  /**
   * Per-TARGET-language assessment state (v5, P2b decision D-4): the
   * checkpoints, placement and estimate are target-level — `fr-en` and
   * `fr-vi` share one French record; each attempt / placement result
   * records the `courseId` it was taken in.
   */
  assessmentByTarget?: Record<string, PersistedAssessmentState>;
  /** UI language preference (v4). */
  uiLanguage?: UiLanguagePreference;
  /** Daily new words from the syllabus, 0–15 (v6, P3e). */
  dailyNewWords?: number;
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
    activeCourseId: LEGACY_FLAT_COURSE_ID,
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
      [LEGACY_FLAT_COURSE_ID]: {
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

/**
 * v2 → v3: Phase 6 assessment container. Additive only — initializes the
 * `assessment` field (empty attempts, no placement, floor 0). A malformed
 * pre-existing value of the field is replaced by the empty container; a
 * structurally valid one (e.g. re-import of a v3 backup routed through the
 * chain) passes through.
 */
function migrateV2toV3(persisted: PersistedProgress): PersistedProgress {
  const existing = persisted.assessment;
  const valid =
    !!existing &&
    typeof existing === "object" &&
    Array.isArray((existing as PersistedAssessmentState).checkpointAttempts) &&
    typeof (existing as PersistedAssessmentState).placementFloor === "number" &&
    Number.isFinite((existing as PersistedAssessmentState).placementFloor) &&
    (existing as PersistedAssessmentState).placementFloor >= 0;
  return {
    ...persisted,
    assessment: valid ? (existing as PersistedAssessmentState) : emptyAssessmentState(),
  };
}

function validAssessment(value: unknown): value is PersistedAssessmentState {
  return (
    !!value &&
    typeof value === "object" &&
    Array.isArray((value as PersistedAssessmentState).checkpointAttempts) &&
    typeof (value as PersistedAssessmentState).placementFloor === "number" &&
    Number.isFinite((value as PersistedAssessmentState).placementFloor) &&
    (value as PersistedAssessmentState).placementFloor >= 0
  );
}

function assessmentHasData(a: PersistedAssessmentState): boolean {
  return a.checkpointAttempts.length > 0 || a.placement !== undefined || a.placementFloor > 0;
}

/**
 * v3 → v4 (P1d): the global `assessment` container becomes
 * `assessmentByCourse`. The v3 data — if it holds anything — moves under
 * V3_ASSESSMENT_COURSE_ID; an empty container becomes an empty map (no
 * course key is invented). A malformed OBJECT moves as it is: the backup
 * invariants reject it fail-closed and `assessmentFor` reads a malformed
 * live container as empty — nothing is silently "repaired" into valid
 * data. An `assessmentByCourse` already present (re-import of a v4 backup
 * routed through the chain) passes through. `uiLanguage` starts at
 * "system". Cards and the review log are left exactly where they are.
 */
function migrateV3toV4(persisted: PersistedProgress): PersistedProgress {
  const { assessment, assessmentByCourse: existing, uiLanguage, ...rest } = persisted;
  const byCourse: Record<string, PersistedAssessmentState> = {};
  if (existing && typeof existing === "object") {
    for (const [courseId, value] of Object.entries(existing)) {
      if (value && typeof value === "object") byCourse[courseId] = value as PersistedAssessmentState;
    }
  }
  if (assessment && typeof assessment === "object" && byCourse[V3_ASSESSMENT_COURSE_ID] === undefined) {
    const emptyAndValid = validAssessment(assessment) && !assessmentHasData(assessment);
    if (!emptyAndValid) byCourse[V3_ASSESSMENT_COURSE_ID] = assessment as PersistedAssessmentState;
  }
  return {
    ...rest,
    assessmentByCourse: byCourse,
    uiLanguage: uiLanguage === "vi" || uiLanguage === "en" ? uiLanguage : "system",
  };
}

/** Course ids are `<target>-<native>`; a key without a dash is already a target code. */
export function targetCodeOfCourseId(courseId: string): string {
  const at = courseId.indexOf("-");
  return at > 0 ? courseId.slice(0, at) : courseId;
}

/**
 * v4 → v5 (P2b): `assessmentByCourse` becomes `assessmentByTarget`. Two
 * courses of one target (fr-en + fr-vi) merge: attempts are concatenated
 * (each tagged with its course of origin, oldest first), the most recent
 * placement result wins, the accepted floor is the higher one. An
 * `assessmentByTarget` already present (re-import of a v5 backup) is kept
 * and only merged with what v4 data still exists.
 */
function migrateV4toV5(persisted: PersistedProgress): PersistedProgress {
  const { assessmentByCourse, assessmentByTarget: existing, ...rest } = persisted;
  const byTarget: Record<string, PersistedAssessmentState> = {};
  if (existing && typeof existing === "object") {
    for (const [target, value] of Object.entries(existing)) {
      if (value && typeof value === "object") byTarget[target] = value as PersistedAssessmentState;
    }
  }
  if (assessmentByCourse && typeof assessmentByCourse === "object") {
    for (const [courseId, value] of Object.entries(assessmentByCourse)) {
      if (!value || typeof value !== "object") continue;
      const a = value as PersistedAssessmentState;
      const target = targetCodeOfCourseId(courseId);
      const current = byTarget[target];
      const attempts = (Array.isArray(a.checkpointAttempts) ? a.checkpointAttempts : []).map((attempt) =>
        attempt && typeof attempt === "object" && (attempt as { courseId?: unknown }).courseId === undefined ? { ...attempt, courseId } : attempt
      );
      const placement =
        a.placement && typeof a.placement === "object"
          ? (a.placement as { courseId?: unknown }).courseId === undefined
            ? { ...a.placement, courseId }
            : a.placement
          : undefined;
      if (!current) {
        byTarget[target] = { ...a, checkpointAttempts: attempts, ...(placement ? { placement } : {}) };
        continue;
      }
      const mergedAttempts = [...current.checkpointAttempts, ...attempts].sort((x, y) => (x?.completedAt ?? 0) - (y?.completedAt ?? 0));
      const newerPlacement =
        placement && (!current.placement || placement.completedAt > current.placement.completedAt) ? placement : current.placement;
      byTarget[target] = {
        ...current,
        checkpointAttempts: mergedAttempts,
        ...(newerPlacement ? { placement: newerPlacement } : {}),
        placementFloor: Math.max(Number(current.placementFloor) || 0, Number(a.placementFloor) || 0),
      };
    }
  }
  return { ...rest, assessmentByTarget: byTarget };
}

/**
 * v5 → v6 (P3e): add `dailyNewWords`, normalised to 0–15 (a value already
 * present — re-import of a v6 backup routed through the chain — is kept
 * when valid). Idempotent; nothing else changes.
 */
function migrateV5toV6(persisted: PersistedProgress): PersistedProgress {
  return { ...persisted, dailyNewWords: normalizeDailyNewWords(persisted.dailyNewWords) };
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
  if (fromVersion < 3 && toVersion >= 3) {
    checkFailureSeam(3);
    state = migrateV2toV3(state as PersistedProgress);
  }
  if (fromVersion < 4 && toVersion >= 4) {
    checkFailureSeam(4);
    state = migrateV3toV4(state as PersistedProgress);
  }
  if (fromVersion < 5 && toVersion >= 5) {
    checkFailureSeam(5);
    state = migrateV4toV5(state as PersistedProgress);
  }
  if (fromVersion < 6 && toVersion >= 6) {
    checkFailureSeam(6);
    state = migrateV5toV6(state as PersistedProgress);
  }
  return state as PersistedProgress;
}

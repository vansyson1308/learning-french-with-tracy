/**
 * Pure core of progress backup/import. No React Native imports — the I/O shell
 * (src/lib/backup.ts) handles files, sharing, the store and the learner
 * database; everything that can be unit-tested lives here.
 *
 * Envelope v2 (P1d): the blob (`state`, persist v4, without cards/review
 * log) plus a `learner` section (every FSRS card and review-log entry,
 * pulled from the learner store). Envelope v1 (cards and log inline in
 * `state`) is accepted forever: its learner data is split out after the
 * migration chain. Import is a staged transaction: parse → validate
 * envelope → sanitize → migrate into a scratch state → split → run
 * invariants over both halves. Only when every step passes does the caller
 * commit; any failure leaves current user state untouched.
 */

import { hasCapability } from "../course-profile";
import { msg, type Message } from "../i18n/message";
import type { ReviewLogEntry } from "../learning/review-log";
import type { FsrsCardState } from "../learning/scheduler";
import type { SrsEntry } from "../srs";

import { learnerDataFromBlob } from "./learner";
import { emptyLearnerData, normalizeLearnerCards, targetCodeOfCourse, type LearnerData } from "./learner-types";
import {
  migrateProgress,
  PERSIST_VERSION,
  type PersistedProgress,
} from "./migrations";

const FSRS_STATES = new Set(["new", "learning", "review", "relearning"]);

export const BACKUP_FORMAT = "lingo-progress-backup";
/** v2 (P1d): `learner` section; v1 backups (cards/log inside `state`) stay importable. */
export const ENVELOPE_VERSION = 2;

export type BackupEnvelope = {
  format: typeof BACKUP_FORMAT;
  envelopeVersion: number;
  persistVersion: number;
  exportedAt: string;
  manifest: { topLevelKeys: string[]; courses: string[]; cards: number; reviewLog: number };
  /** The settings/progress blob — no cards, no review log (v2). */
  state: PersistedProgress;
  /** Every FSRS card and review-log entry (v2). */
  learner: LearnerData;
};

/** Removes the learner-owned fields from a blob (what a v4 blob never carries once the store holds them). */
export function stripLearnerData(state: PersistedProgress): PersistedProgress {
  const { reviewLog: _log, ...rest } = state;
  const courses: PersistedProgress["courses"] = {};
  for (const [courseId, course] of Object.entries(state.courses ?? {})) {
    if (!course) continue;
    const { cards: _cards, ...courseRest } = course;
    courses[courseId] = courseRest;
  }
  return { ...rest, courses };
}

/** A blob that still carries learner data (pre-v4 / v1 backup) → (stripped blob, learner data). */
export function splitLearnerData(state: PersistedProgress): { state: PersistedProgress; learner: LearnerData } {
  return { state: stripLearnerData(state), learner: learnerDataFromBlob(state) };
}

export function countCards(learner: LearnerData): number {
  return Object.values(learner.cards).reduce((n, byKey) => n + Object.keys(byKey).length, 0);
}

export function createEnvelope(
  state: PersistedProgress,
  learner: LearnerData,
  persistVersion: number,
  now: Date
): BackupEnvelope {
  const blob = stripLearnerData(state);
  return {
    format: BACKUP_FORMAT,
    envelopeVersion: ENVELOPE_VERSION,
    persistVersion,
    exportedAt: now.toISOString(),
    manifest: {
      topLevelKeys: Object.keys(blob),
      courses: Object.keys(blob.courses ?? {}),
      cards: countCards(learner),
      reviewLog: learner.reviewLog.length,
    },
    state: blob,
    learner,
  };
}

export type StagedImport =
  | { ok: true; state: PersistedProgress; learner: LearnerData }
  | { ok: false; reason: Message };

const BANNED_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Deep-copy onto fresh objects, dropping prototype-pollution keys. Unknown
 * forward-compatible fields survive (they're plain data); anything that isn't
 * JSON-shaped is structurally unsafe and throws (caught by stageImport).
 */
export function sanitize(value: unknown): unknown {
  if (value === null) return null;
  const t = typeof value;
  if (t === "string" || t === "boolean" || t === "number") return value;
  if (Array.isArray(value)) return value.map(sanitize);
  if (t === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as object)) {
      if (BANNED_KEYS.has(key)) continue;
      out[key] = sanitize((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  throw new Error(`unsupported value of type ${t}`);
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isDayOrNull(v: unknown): boolean {
  return v === null || (typeof v === "string" && DAY_RE.test(v));
}

function finiteAtLeast(v: unknown, min: number): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= min;
}

function invalidAssessment(a: unknown, maxTimestamp: number): string | null {
  const s = a as {
    checkpointAttempts?: unknown;
    placement?: unknown;
    placementFloor?: unknown;
  } | null;
  if (!s || typeof s !== "object") return "invalid assessment state";
  if (!Array.isArray(s.checkpointAttempts)) return "invalid checkpoint attempts";
  for (const attempt of s.checkpointAttempts as {
    checkpointId?: unknown;
    checkpointVersion?: unknown;
    formId?: unknown;
    formVersion?: unknown;
    startedAt?: unknown;
    completedAt?: unknown;
    itemResults?: unknown;
    objectiveResults?: unknown;
  }[]) {
    if (
      !attempt ||
      typeof attempt.checkpointId !== "string" ||
      !finiteAtLeast(attempt.checkpointVersion, 1) ||
      // P9 §38: form fields are OPTIONAL (pre-forms attempts carry
      // neither) but must be sane when present.
      (attempt.formId !== undefined && typeof attempt.formId !== "string") ||
      (attempt.formVersion !== undefined && !finiteAtLeast(attempt.formVersion, 1)) ||
      !finiteAtLeast(attempt.startedAt, 0) ||
      !finiteAtLeast(attempt.completedAt, 0) ||
      (attempt.completedAt as number) > maxTimestamp ||
      !Array.isArray(attempt.itemResults) ||
      !Array.isArray(attempt.objectiveResults)
    ) {
      return "invalid checkpoint attempt";
    }
  }
  if (!finiteAtLeast(s.placementFloor, 0)) return "invalid placement floor";
  if (s.placement !== undefined) {
    const p = s.placement as {
      placementVersion?: unknown;
      completedAt?: unknown;
      recommendedLessonId?: unknown;
      recommendedFloorIndex?: unknown;
    } | null;
    if (
      !p ||
      typeof p !== "object" ||
      !finiteAtLeast(p.placementVersion, 1) ||
      !finiteAtLeast(p.completedAt, 0) ||
      (p.completedAt as number) > maxTimestamp ||
      typeof p.recommendedLessonId !== "string" ||
      !finiteAtLeast(p.recommendedFloorIndex, 0)
    ) {
      return "invalid placement result";
    }
  }
  return null;
}

/**
 * Structural sanity checks run on the migrated scratch state (and its
 * learner half) before commit. `learner` defaults to the cards/log the
 * blob itself carries (pre-v4 shapes), so the invariants hold for both.
 */
export function runInvariants(state: PersistedProgress, now: Date, learner?: LearnerData): string[] {
  const problems: string[] = [];
  const maxTimestamp = now.getTime() + 10 * 365 * 86_400_000;
  const learnerData = learner ?? learnerDataFromBlob(state);

  if (typeof state.activeCourseId !== "string" || !state.activeCourseId) {
    problems.push("missing active course");
  }
  if (!finiteAtLeast(state.streak, 0)) problems.push("invalid streak");
  if (!finiteAtLeast(state.dailyGoal, 1)) problems.push("invalid daily goal");
  if (!finiteAtLeast(state.dailyXp, 0)) problems.push("invalid daily XP");
  if (typeof state.onboardingDone !== "boolean") problems.push("invalid onboarding flag");
  if (!isDayOrNull(state.lastActiveDay)) problems.push("invalid last active day");
  if (!isDayOrNull(state.dailyXpDay)) problems.push("invalid daily XP day");
  if (!state.courses || typeof state.courses !== "object") {
    problems.push("missing courses");
    return problems;
  }
  if (!state.activeDays || typeof state.activeDays !== "object") {
    problems.push("missing day history");
  } else {
    for (const [day, activity] of Object.entries(state.activeDays)) {
      if (!DAY_RE.test(day)) problems.push(`invalid day key ${day}`);
      if (
        !activity ||
        !finiteAtLeast(activity.xp, 0) ||
        !finiteAtLeast(activity.lessons, 0) ||
        !finiteAtLeast(activity.perfect, 0) ||
        (activity.sessions !== undefined && !finiteAtLeast(activity.sessions, 0))
      ) {
        problems.push(`invalid day activity for ${day}`);
      }
    }
  }

  for (const [courseId, course] of Object.entries(state.courses)) {
    if (!course || typeof course !== "object") {
      problems.push(`invalid course ${courseId}`);
      continue;
    }
    if (!finiteAtLeast(course.xp, 0)) problems.push(`invalid XP in ${courseId}`);
    if (!course.completedLessons || typeof course.completedLessons !== "object") {
      problems.push(`invalid completed lessons in ${courseId}`);
    } else {
      for (const v of Object.values(course.completedLessons)) {
        if (v !== true) problems.push(`invalid completed-lesson entry in ${courseId}`);
      }
    }
    if (!Array.isArray(course.mistakes)) {
      problems.push(`invalid mistakes in ${courseId}`);
    } else {
      for (const m of course.mistakes) {
        if (!m || typeof m.lessonId !== "string" || typeof m.exerciseId !== "string") {
          problems.push(`invalid mistake entry in ${courseId}`);
          break;
        }
      }
    }
    if (!course.wordStats || typeof course.wordStats !== "object") {
      problems.push(`invalid word stats in ${courseId}`);
    } else {
      for (const stat of Object.values(course.wordStats)) {
        if (
          !stat ||
          !finiteAtLeast(stat.correct, 0) ||
          !finiteAtLeast(stat.wrong, 0) ||
          !finiteAtLeast(stat.lastSeen, 0) ||
          stat.lastSeen > maxTimestamp
        ) {
          problems.push(`invalid word stat in ${courseId}`);
          break;
        }
      }
    }
    // A course keeps its review data either as a legacy `srs` map or as
    // FSRS cards in the learner store (an fsrs course may have none yet).
    const hasSrs = !!course.srs && typeof course.srs === "object";
    // Cards are keyed by TARGET language in the learner section (D-4); an inline (pre-v4) map is per course.
    const hasCards =
      learnerData.cards[targetCodeOfCourse(courseId)] !== undefined ||
      learnerData.cards[courseId] !== undefined ||
      (!!course.cards && typeof course.cards === "object");
    if (!hasSrs && !hasCards && !hasCapability(courseId, "fsrs")) {
      problems.push(`invalid review data in ${courseId}`);
    }
    if (hasSrs && !validSrsMap(course.srs!, maxTimestamp)) {
      problems.push(`invalid review entry in ${courseId}`);
    }
    if (course.srsLegacy !== undefined) {
      if (
        typeof course.srsLegacy !== "object" ||
        course.srsLegacy === null ||
        !validSrsMap(course.srsLegacy, maxTimestamp)
      ) {
        problems.push(`invalid legacy review copy in ${courseId}`);
      }
    }
  }

  // Learner data (cards + review log) — from the store section or the blob.
  if (!learnerData.cards || typeof learnerData.cards !== "object") {
    problems.push("invalid learner cards");
  } else {
    outer: for (const [courseId, cards] of Object.entries(learnerData.cards)) {
      if (!cards || typeof cards !== "object") {
        problems.push(`invalid cards in ${courseId}`);
        continue;
      }
      for (const [key, card] of Object.entries(cards)) {
        if (!validCard(key, card, maxTimestamp)) {
          problems.push(`invalid card in ${courseId}`);
          break outer;
        }
      }
    }
  }

  // v3-style single container, v4 per-course map or v5 per-target map, whichever the state carries.
  if (state.assessment !== undefined) {
    const problem = invalidAssessment(state.assessment, maxTimestamp);
    if (problem) problems.push(problem);
  }
  for (const field of ["assessmentByCourse", "assessmentByTarget"] as const) {
    const map = state[field];
    if (map === undefined) continue;
    if (!map || typeof map !== "object") {
      problems.push("invalid assessment map");
      continue;
    }
    for (const [key, a] of Object.entries(map)) {
      const problem = invalidAssessment(a, maxTimestamp);
      if (problem) {
        problems.push(`${problem} (${key})`);
        break;
      }
    }
  }
  if (state.uiLanguage !== undefined && !["system", "vi", "en"].includes(String(state.uiLanguage))) {
    problems.push("invalid UI language");
  }

  if (!Array.isArray(learnerData.reviewLog)) {
    problems.push("invalid review log");
  } else {
    for (const e of learnerData.reviewLog) {
      if (
        !e ||
        typeof e !== "object" ||
        !finiteAtLeast(e.at, 0) ||
        e.at > maxTimestamp ||
        typeof e.cardKey !== "string" ||
        typeof e.sessionId !== "string" ||
        typeof e.courseId !== "string" ||
        typeof e.exerciseId !== "string" ||
        !finiteAtLeast(e.attemptIndex, 0)
      ) {
        problems.push("invalid review log entry");
        break;
      }
    }
  }

  return problems;
}

function validSrsMap(map: Record<string, SrsEntry>, maxTimestamp: number): boolean {
  for (const entry of Object.values(map)) {
    if (
      !entry ||
      !finiteAtLeast(entry.interval, 0) ||
      !finiteAtLeast(entry.ease, 1) ||
      entry.ease > 10 ||
      !finiteAtLeast(entry.dueAt, 0) ||
      entry.dueAt > maxTimestamp ||
      !finiteAtLeast(entry.streak, 0)
    ) {
      return false;
    }
  }
  return true;
}

function validCard(key: string, card: FsrsCardState, maxTimestamp: number): boolean {
  if (!key || key.indexOf("|") <= 0) return false;
  return (
    !!card &&
    typeof card === "object" &&
    finiteAtLeast(card.due, 0) &&
    card.due <= maxTimestamp &&
    finiteAtLeast(card.stability, 0) &&
    finiteAtLeast(card.difficulty, 0) &&
    card.difficulty <= 10 &&
    finiteAtLeast(card.scheduled_days, 0) &&
    finiteAtLeast(card.learning_steps, 0) &&
    finiteAtLeast(card.reps, 0) &&
    finiteAtLeast(card.lapses, 0) &&
    FSRS_STATES.has(card.state) &&
    (card.last_review === undefined || finiteAtLeast(card.last_review, 0))
  );
}

/** The learner section of a v2 envelope, sanitized and shape-checked (null = unusable). */
function learnerSection(value: unknown): LearnerData | null {
  if (value === undefined) return emptyLearnerData();
  if (!value || typeof value !== "object") return null;
  const raw = value as { cards?: unknown; reviewLog?: unknown };
  if (!raw.cards || typeof raw.cards !== "object" || !Array.isArray(raw.reviewLog)) return null;
  // Backups written before P2b key cards by course id; the store keys by target language.
  return { cards: normalizeLearnerCards(raw.cards as LearnerData["cards"]), reviewLog: raw.reviewLog as ReviewLogEntry[] };
}

/**
 * Parse + validate + migrate a backup file into a committable state. Never
 * touches live state; a failure at any stage returns a reason instead.
 */
export function stageImport(raw: string, now: Date): StagedImport {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: msg("backup.reason.invalidJson") };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, reason: msg("backup.reason.notBackup") };
  }
  const envelope = parsed as Record<string, unknown>;
  if (envelope.format !== BACKUP_FORMAT) {
    return { ok: false, reason: msg("backup.reason.notBackup") };
  }
  if (
    typeof envelope.envelopeVersion !== "number" ||
    envelope.envelopeVersion > ENVELOPE_VERSION
  ) {
    return {
      ok: false,
      reason: msg("backup.reason.newerVersion"),
    };
  }
  const persistVersion = envelope.persistVersion;
  if (
    typeof persistVersion !== "number" ||
    !Number.isInteger(persistVersion) ||
    persistVersion < 0 ||
    persistVersion > PERSIST_VERSION
  ) {
    return {
      ok: false,
      reason: msg("backup.reason.unsupportedVersion"),
    };
  }
  if (!envelope.state || typeof envelope.state !== "object") {
    return { ok: false, reason: msg("backup.reason.noProgress") };
  }

  let clean: unknown;
  let cleanLearner: unknown;
  try {
    clean = sanitize(envelope.state);
    cleanLearner = envelope.envelopeVersion >= 2 ? sanitize(envelope.learner) : undefined;
  } catch {
    return { ok: false, reason: msg("backup.reason.unsupportedData") };
  }

  let migrated: PersistedProgress;
  try {
    migrated = migrateProgress(clean, persistVersion, now);
  } catch {
    return { ok: false, reason: msg("backup.reason.upgradeFailed") };
  }

  // Learner half: the v2 section, plus anything the (older) blob still
  // carried inline — a v1 backup's cards/log, or a v2 state exported
  // before its bootstrap ran. Store data wins on a card key collision.
  const section = learnerSection(cleanLearner);
  if (section === null) return { ok: false, reason: msg("backup.reason.reviewDataUnreadable") };
  const { state, learner: inline } = splitLearnerData(migrated);
  const cards: LearnerData["cards"] = {};
  for (const [courseId, byKey] of Object.entries(inline.cards)) cards[courseId] = { ...byKey };
  for (const [courseId, byKey] of Object.entries(section.cards)) cards[courseId] = { ...(cards[courseId] ?? {}), ...byKey };
  const learner: LearnerData = { cards, reviewLog: [...inline.reviewLog, ...section.reviewLog] };

  const problems = runInvariants(state, now, learner);
  if (problems.length > 0) {
    return { ok: false, reason: msg("backup.reason.validationFailed", { problem: problems[0] }) };
  }

  return { ok: true, state, learner };
}

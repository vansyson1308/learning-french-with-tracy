/**
 * Pure core of progress backup/import. No React Native imports — the I/O shell
 * (src/lib/backup.ts) handles files, sharing and the store; everything that can
 * be unit-tested lives here.
 *
 * Import is a staged transaction: parse → validate envelope → sanitize →
 * migrate into a scratch state → run invariants. Only when every step passes
 * does the caller commit; any failure leaves current user state untouched.
 */

import {
  migrateProgress,
  PERSIST_VERSION,
  type PersistedProgress,
} from "./migrations";

export const BACKUP_FORMAT = "lingo-progress-backup";
export const ENVELOPE_VERSION = 1;

export type BackupEnvelope = {
  format: typeof BACKUP_FORMAT;
  envelopeVersion: number;
  persistVersion: number;
  exportedAt: string;
  manifest: { topLevelKeys: string[]; courses: string[] };
  state: PersistedProgress;
};

export function createEnvelope(
  state: PersistedProgress,
  persistVersion: number,
  now: Date
): BackupEnvelope {
  return {
    format: BACKUP_FORMAT,
    envelopeVersion: ENVELOPE_VERSION,
    persistVersion,
    exportedAt: now.toISOString(),
    manifest: {
      topLevelKeys: Object.keys(state),
      courses: Object.keys(state.courses ?? {}),
    },
    state,
  };
}

export type StagedImport =
  | { ok: true; state: PersistedProgress }
  | { ok: false; reason: string };

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

/** Structural sanity checks run on the migrated scratch state before commit. */
export function runInvariants(state: PersistedProgress, now: Date): string[] {
  const problems: string[] = [];
  const maxTimestamp = now.getTime() + 10 * 365 * 86_400_000;

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
    if (!course.srs || typeof course.srs !== "object") {
      problems.push(`invalid review data in ${courseId}`);
    } else {
      for (const entry of Object.values(course.srs)) {
        if (
          !entry ||
          !finiteAtLeast(entry.interval, 0) ||
          !finiteAtLeast(entry.ease, 1) ||
          entry.ease > 10 ||
          !finiteAtLeast(entry.dueAt, 0) ||
          entry.dueAt > maxTimestamp ||
          !finiteAtLeast(entry.streak, 0)
        ) {
          problems.push(`invalid review entry in ${courseId}`);
          break;
        }
      }
    }
  }

  return problems;
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
    return { ok: false, reason: "The file isn't valid JSON." };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, reason: "This isn't a progress backup file." };
  }
  const envelope = parsed as Record<string, unknown>;
  if (envelope.format !== BACKUP_FORMAT) {
    return { ok: false, reason: "This isn't a progress backup file." };
  }
  if (
    typeof envelope.envelopeVersion !== "number" ||
    envelope.envelopeVersion > ENVELOPE_VERSION
  ) {
    return {
      ok: false,
      reason: "This backup is from a newer app version. Update the app first.",
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
      reason: "This backup uses an unsupported data version.",
    };
  }
  if (!envelope.state || typeof envelope.state !== "object") {
    return { ok: false, reason: "The backup contains no progress data." };
  }

  let clean: unknown;
  try {
    clean = sanitize(envelope.state);
  } catch {
    return { ok: false, reason: "The backup contains unsupported data." };
  }

  let migrated: PersistedProgress;
  try {
    migrated = migrateProgress(clean, persistVersion, now);
  } catch {
    return { ok: false, reason: "The backup data couldn't be upgraded." };
  }

  const problems = runInvariants(migrated, now);
  if (problems.length > 0) {
    return { ok: false, reason: `The backup failed validation (${problems[0]}).` };
  }

  return { ok: true, state: migrated };
}

/**
 * Learner store contract (P1d, persist v4). FSRS cards and the review log
 * leave the AsyncStorage blob and live in a per-device learner database
 * behind this interface — SQLite on iOS/Android (`learner-db.native.ts`),
 * an AsyncStorage JSON document on web and in tests (`learner-json.ts`).
 * The pure engine (src/lib/learning/engine.ts) keeps operating on the
 * in-memory `cards` / `reviewLog` of the store; the store records every
 * mutation as a DELTA in a crash-safe pending buffer and commits the
 * buffer as ONE transaction at session completion (src/lib/persistence/learner.ts).
 *
 * Nothing here is learner-visible content; no transcript, recording or
 * identifier ever enters this store (release/PRIVACY_INVENTORY.md).
 */

import type { ReviewLogEntry } from "../learning/review-log";
import type { FsrsCardState } from "../learning/scheduler";

/** courseId → serialized CardKey → card. */
export type LearnerCards = Record<string, Record<string, FsrsCardState>>;

/** Everything the learner store holds — the backup's `learner` section. */
export type LearnerData = {
  cards: LearnerCards;
  /** Every entry, oldest first (the store itself is append-only; undo deletes). */
  reviewLog: ReviewLogEntry[];
};

export function emptyLearnerData(): LearnerData {
  return { cards: {}, reviewLog: [] };
}

/**
 * The identity of one review-log row. The log has no client-side sequence
 * number (entries are created in memory before they are stored), so a row
 * is addressed by the fields that identify one evidence event; the SQL
 * store carries a UNIQUE index over them, which also makes a replayed
 * pending buffer idempotent.
 */
export type LogRef = {
  courseId: string;
  at: number;
  cardKey: string;
  sessionId: string;
  exerciseId: string;
  attemptIndex: number;
};

export function logRefOf(entry: ReviewLogEntry): LogRef {
  return {
    courseId: entry.courseId,
    at: entry.at,
    cardKey: entry.cardKey,
    sessionId: entry.sessionId,
    exerciseId: entry.exerciseId,
    attemptIndex: entry.attemptIndex,
  };
}

export function sameLogRef(a: LogRef, b: LogRef): boolean {
  return (
    a.courseId === b.courseId &&
    a.at === b.at &&
    a.cardKey === b.cardKey &&
    a.sessionId === b.sessionId &&
    a.exerciseId === b.exerciseId &&
    a.attemptIndex === b.attemptIndex
  );
}

export type CardUpsert = { courseId: string; cardKey: string; card: FsrsCardState };

/** One unit of work the learner store commits atomically. */
export type LearnerBatch = {
  cardUpserts: CardUpsert[];
  logAppends: ReviewLogEntry[];
  logRemovals: LogRef[];
};

export function emptyBatch(): LearnerBatch {
  return { cardUpserts: [], logAppends: [], logRemovals: [] };
}

export function isEmptyBatch(batch: LearnerBatch): boolean {
  return batch.cardUpserts.length === 0 && batch.logAppends.length === 0 && batch.logRemovals.length === 0;
}

/**
 * Merge a delta into a pending batch. A later upsert of the same card
 * replaces the earlier one; a removal of an entry that is still pending
 * simply cancels the pending append (the row never existed in the store),
 * otherwise it is queued for deletion.
 */
export function mergeBatch(pending: LearnerBatch, delta: LearnerBatch): LearnerBatch {
  const upserts = new Map<string, CardUpsert>();
  for (const u of [...pending.cardUpserts, ...delta.cardUpserts]) upserts.set(`${u.courseId}\u0000${u.cardKey}`, u);
  let appends = [...pending.logAppends, ...delta.logAppends];
  const removals = [...pending.logRemovals];
  for (const ref of delta.logRemovals) {
    const index = appends.findIndex((e) => sameLogRef(logRefOf(e), ref));
    if (index >= 0) appends = [...appends.slice(0, index), ...appends.slice(index + 1)];
    else removals.push(ref);
  }
  return { cardUpserts: [...upserts.values()], logAppends: appends, logRemovals: removals };
}

/** The slice of the learner store the session engine needs in memory for one course. */
export type CourseLearnerSlice = {
  cards: Record<string, FsrsCardState>;
  /** The course's most recent entries, oldest first (a window, not the whole history). */
  reviewLog: ReviewLogEntry[];
};

/** Review-log entries kept in memory per course (undo and the session gate only look near the tail). */
export const LEARNER_LOG_WINDOW = 2_000;

export interface LearnerStore {
  readonly kind: "sqlite" | "json";
  /** Cards + the recent log window of one course. */
  loadCourse(courseId: string, logWindow?: number): Promise<CourseLearnerSlice>;
  /** Apply one batch atomically (all or nothing). */
  commit(batch: LearnerBatch): Promise<void>;
  counts(): Promise<{ cards: number; reviewLog: number }>;
  /** Everything, for backups. */
  exportAll(): Promise<LearnerData>;
  /** Replace everything atomically (import / rollback). */
  replaceAll(data: LearnerData): Promise<void>;
  getMeta(key: string): Promise<string | null>;
  setMeta(key: string, value: string): Promise<void>;
}

/** Meta keys the facade uses. */
export const LEARNER_META = {
  schemaVersion: "schemaVersion",
  /** ISO instant of the one-time blob → store import (v4 first launch). */
  blobImportedAt: "blobImportedAt",
} as const;

export const LEARNER_SCHEMA_VERSION = 1;

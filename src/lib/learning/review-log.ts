/**
 * Append-only review log (Phase 1). Every piece of ReviewEvidence lands here
 * — including non-assessment roles — so undo, honest stats, and future FSRS
 * parameter optimization have complete data (PopMots discarded its logs and
 * foreclosed all three).
 *
 * Storage: a ring buffer inside the persisted store, capped at 10,000
 * entries (~1.2 MB) — a 2k cap would wrap within a month of daily use and
 * discard exactly the history the optimizer needs. SQLite is deliberately
 * NOT introduced in Phase 1; the cap is the accepted loss window until the
 * roadmap's storage phase.
 */

import type { Modality, SrsRole } from "./evidence";
import type { FsrsCardState, Grade, PlainFsrsLog } from "./scheduler";

export const REVIEW_LOG_CAP = 10_000;

/** Present only on entries whose evidence mutated the scheduler. */
export type PersistedMutation = {
  grade: Grade;
  /** Exact pre-review card — undo restores this verbatim. */
  prevCard: FsrsCardState;
  fsrsLog?: PlainFsrsLog;
};

export type ReviewLogEntry = {
  at: number;
  courseId: string;
  /** Serialized CardKey (`itemId|skill`). */
  cardKey: string;
  sessionId: string;
  exerciseId: string;
  modality: Modality;
  srsRole: SrsRole;
  correct: boolean;
  hinted: boolean;
  assisted: boolean;
  toleranceUsed: boolean;
  latencyMs: number;
  attemptIndex: number;
  mutation?: PersistedMutation;
};

/** Ring-buffer append: returns a new array, dropping the oldest overflow. */
export function appendToReviewLog(
  log: readonly ReviewLogEntry[],
  entry: ReviewLogEntry,
  cap = REVIEW_LOG_CAP
): ReviewLogEntry[] {
  const next = [...log, entry];
  return next.length > cap ? next.slice(next.length - cap) : next;
}

/**
 * The evidence gate's one-mutation-per-card-per-session rule reads this:
 * has this card already produced a scheduler mutation in this session?
 * Scans backwards — matches are always near the tail.
 */
export function cardMutatedInSession(
  log: readonly ReviewLogEntry[],
  cardKey: string,
  sessionId: string
): boolean {
  for (let i = log.length - 1; i >= 0; i--) {
    const e = log[i];
    if (e.sessionId !== sessionId) continue;
    if (e.cardKey === cardKey && e.mutation !== undefined) return true;
  }
  return false;
}

/** Most recent scheduler mutation for a course (undo target), with its index. */
export function lastMutationIndex(
  log: readonly ReviewLogEntry[],
  courseId: string
): number {
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i].courseId === courseId && log[i].mutation !== undefined) return i;
  }
  return -1;
}

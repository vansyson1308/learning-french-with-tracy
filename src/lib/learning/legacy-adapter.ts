/**
 * LegacySchedulerAdapter — wraps src/lib/srs.ts behind the ReviewScheduler
 * port with semantics unchanged (pinned by the Phase-0 characterization
 * suite and the parity tests). Serves every course except fr-en; their
 * persisted SrsEntry data is read and written verbatim.
 */

import { DEFAULT_EASE, isDue as legacyIsDue, reviewWord, type SrsEntry } from "../srs";

import type { Grade, ReviewScheduler, SchedulerMutation } from "./scheduler";

/**
 * The legacy scheduler has three qualities (0 wrong / 1 hard / 2 good) and
 * no notion of "easy", so easy maps to good — the strongest grade it can
 * express. This map is the single place the translation lives.
 */
export const GRADE_TO_LEGACY_QUALITY: Record<Grade, 0 | 1 | 2> = {
  again: 0,
  hard: 1,
  good: 2,
  easy: 2,
};

export const legacyScheduler: ReviewScheduler<SrsEntry> = {
  initialCard(now: number): SrsEntry {
    // Mirrors reviewWord's own base for a missing entry.
    return { interval: 0, ease: DEFAULT_EASE, dueAt: now, streak: 0 };
  },

  review(card: SrsEntry, grade: Grade, now: number) {
    const next = reviewWord(card, GRADE_TO_LEGACY_QUALITY[grade], now);
    const log: SchedulerMutation<SrsEntry> = { grade, at: now, prevCard: { ...card } };
    return { card: next, log };
  },

  isDue(card: SrsEntry, now: number): boolean {
    return legacyIsDue(card, now);
  },

  /**
   * The legacy scheduler has no memory model, so this is a due-flag
   * (1 = not yet due, 0 = due), NOT a recall probability. Review ordering by
   * retrievability is a French/FSRS feature; legacy courses never order by
   * this value.
   */
  retrievability(card: SrsEntry, now: number): number {
    return legacyIsDue(card, now) ? 0 : 1;
  },

  rollback(_card: SrsEntry, mutation: SchedulerMutation<SrsEntry>): SrsEntry {
    return { ...mutation.prevCard };
  },
};

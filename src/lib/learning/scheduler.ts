/**
 * App-owned review-scheduler port. Screens and the store speak ONLY these
 * plain JSON-safe types — never ts-fsrs classes/Dates — so the persisted
 * storage contract belongs to us, not to a library minor version.
 *
 * Two adapters implement the port (French-first rollout):
 *   LegacySchedulerAdapter — wraps src/lib/srs.ts, unchanged semantics
 *   FsrsSchedulerAdapter   — wraps ts-fsrs (FSRS-6)
 */

export type Grade = "again" | "hard" | "good" | "easy";

/** FSRS card state, stored as strings so persisted data is self-describing. */
export type FsrsStateName = "new" | "learning" | "review" | "relearning";

/**
 * Plain persisted FSRS card. Mirrors ts-fsrs 5.4.1 `Card` minus the
 * deprecated `elapsed_days` (removed in ts-fsrs 6); dates are Unix ms.
 */
export type FsrsCardState = {
  due: number;
  stability: number;
  difficulty: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: FsrsStateName;
  last_review?: number;
};

/**
 * Plain snapshot of the ts-fsrs ReviewLog (non-deprecated fields only),
 * kept for future parameter optimization / analytics.
 */
export type PlainFsrsLog = {
  rating: number;
  state: number;
  due: number;
  stability: number;
  difficulty: number;
  scheduled_days: number;
  learning_steps: number;
  review: number;
};

/**
 * What a scheduler write produces. `prevCard` is the exact pre-review card —
 * undo restores it verbatim (ts-fsrs's own rollback() reconstructs `due`
 * shifted by the review delay, verified in the Phase-1 spike, so snapshot
 * restore is the exact mechanism).
 */
export type SchedulerMutation<C> = {
  grade: Grade;
  at: number;
  prevCard: C;
  fsrsLog?: PlainFsrsLog;
};

export interface ReviewScheduler<C> {
  initialCard(now: number): C;
  review(card: C, grade: Grade, now: number): { card: C; log: SchedulerMutation<C> };
  isDue(card: C, now: number): boolean;
  /** 0..1 recall probability; used to order due reviews (most at risk first). */
  retrievability(card: C, now: number): number;
  rollback(card: C, mutation: SchedulerMutation<C>): C;
}

/**
 * Pure SM-2 → FSRS state estimation for the v1→v2 French migration.
 *
 * Reimplements `memory_state_from_sm2` from the canonical Rust reference
 * (open-spaced-repetition/fsrs-rs, src/inference.rs:291, retrieved
 * 2026-08-27) in TypeScript. Deliberately does NOT import ts-fsrs: the
 * migration must be a pure, fixture-testable function with no engine
 * dependency, and this matches Anki's own approach for log-less cards.
 *
 *   S = max(interval, S_MIN) × factor / (r^(1/decay) − 1)
 *       with decay = −w20, factor = 0.9^(1/decay) − 1, r = 0.9
 *       → for r = 0.9 the ratio is exactly 1, so S = max(interval, S_MIN)
 *   D = 11 − (ease − 1) / (e^{w8} · S^{−w9} · (e^{(1−r)·w10} − 1))
 *       clamped to [D_MIN, D_MAX]
 *
 * Guarantees (fixture- and property-tested): total for any input (NaN,
 * Infinity, negatives included), never produces a non-finite field, and
 * preserves due dates verbatim — users' schedules never bulk-shift.
 */

import type { SrsEntry } from "../srs";

import { D_MAX, D_MIN, FSRS_W, S_MAX, S_MIN } from "./fsrs-defaults";
import type { FsrsCardState } from "./scheduler";

const DAY_MS = 86_400_000;

/** The retention SM-2's interval schedule implicitly targeted. */
const SM2_RETENTION = 0.9;

const DECAY = -FSRS_W[20];
const FACTOR = Math.pow(0.9, 1 / DECAY) - 1;

/** fsrs-rs memory_state_from_sm2, faithful including the r parameter. */
export function sm2ToFsrsMemory(
  interval: number,
  ease: number,
  sm2Retention = SM2_RETENTION
): { stability: number; difficulty: number } {
  // Structured as base × (factor/denominator) so the r=0.9 identity is
  // float-exact: S === max(interval, S_MIN) with no rounding drift.
  const ratio = FACTOR / (Math.pow(sm2Retention, 1 / DECAY) - 1);
  const stability = Math.max(interval, S_MIN) * ratio;
  const denominator =
    Math.exp(FSRS_W[8]) *
    Math.pow(stability, -FSRS_W[9]) *
    (Math.exp((1 - sm2Retention) * FSRS_W[10]) - 1);
  const raw = 11 - (ease - 1) / denominator;
  const difficulty = Math.min(D_MAX, Math.max(D_MIN, raw));
  return { stability, difficulty };
}

function finiteOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Total SrsEntry → plain FSRS card estimation.
 *
 * - interval ≤ 0 (brand-new or just-failed — legacy already reset it) →
 *   a plain new card; its first FSRS rating re-initializes memory state.
 * - due preserved verbatim; last_review reconstructed as due − interval.
 * - reps ← streak, lapses ← the word's lifetime wrong count (approximation,
 *   the only per-word failure signal v1 kept).
 * - state ← streak > 0 ? review : learning (per the reference approach).
 */
export function estimateFsrsCardFromSm2(
  entry: SrsEntry,
  wrongCount: number
): FsrsCardState {
  const due = finiteOr(entry.dueAt, 0);
  const lapses = Math.max(0, Math.round(finiteOr(wrongCount, 0)));
  const interval = finiteOr(entry.interval, 0);
  const streak = Math.max(0, Math.round(finiteOr(entry.streak, 0)));

  if (interval <= 0) {
    return {
      due,
      stability: 0,
      difficulty: 0,
      scheduled_days: 0,
      learning_steps: 0,
      reps: 0,
      lapses,
      state: "new",
    };
  }

  const ease = finiteOr(entry.ease, 2.5);
  const { stability, difficulty } = sm2ToFsrsMemory(interval, ease);
  return {
    due,
    // The reference formula has no upper clamp; corrupt absurd intervals
    // (real ones top out in the hundreds) are bounded to fsrs-rs's S_MAX.
    stability: Math.min(stability, S_MAX),
    difficulty,
    scheduled_days: Math.round(interval),
    learning_steps: 0,
    reps: streak,
    lapses,
    state: streak > 0 ? "review" : "learning",
    last_review: due - interval * DAY_MS,
  };
}

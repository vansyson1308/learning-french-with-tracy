/**
 * FSRS-6 constants shared by the runtime adapter and the (ts-fsrs-free) pure
 * migration math. Values are pinned here and drift-guarded by a test that
 * asserts equality with ts-fsrs 5.4.1's generatorParameters().
 *
 * References (recorded 2026-08-27):
 * - ts-fsrs 5.4.1 (MIT, published 2026-05-22) — FSRS-6, 21 weights.
 * - fsrs-rs main `src/simulation.rs:58-61`: S_MIN=0.001, S_MAX=36500,
 *   D_MIN=1.0, D_MAX=10.0; `src/inference.rs:291` memory_state_from_sm2.
 */

/** FSRS-6 default weights (ts-fsrs 5.4.1 defaults). */
export const FSRS_W: readonly number[] = [
  0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722,
  0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425,
  0.0912, 0.0658, 0.1542,
];

export const S_MIN = 0.001;
export const S_MAX = 36500;
export const D_MIN = 1;
export const D_MAX = 10;

/**
 * Conservative explicit scheduler configuration (per the approved plan):
 * 90% target retention, deterministic (no fuzz), interval capped at one year
 * while the curriculum is small, short-term learning steps on.
 * NOTE: maximum_interval is in DAYS — PopMots shipped `0.8` here and silently
 * capped every interval at 1-3 days; the parameter-guard test pins this.
 */
export const FSRS_PARAMS = {
  request_retention: 0.9,
  enable_fuzz: false,
  maximum_interval: 365,
  enable_short_term: true,
} as const;

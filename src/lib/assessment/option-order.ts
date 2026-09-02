/**
 * Deterministic option-order randomization for SCORED multiple-choice items
 * (Phase 10 Gate 3, §17-§19).
 *
 * Authored checkpoint and placement banks carry the correct answer at
 * index 0 far more often than chance (Section 1: 12/12; Section 3
 * listening 11/11). A learner who notices that pattern could pass a scored
 * check without the construct being measured. The fix lives at the
 * ADMINISTRATION, not in the source: every scored sitting renders each
 * MCQ-like item in a seeded order that
 *
 *  - keeps exactly one correct option and remaps `correct` with it;
 *  - is stable for one administration (same seed → same order), so a
 *    re-render or resume never reshuffles under the learner;
 *  - varies across administrations (the seed carries the attempt count
 *    and the form), so a retake is not a position memory test;
 *  - needs no stored history: the order is a pure function of the seed;
 *  - leaves types alone where order carries meaning — `articleSelect`
 *    presents the article paradigm (le / la / l' / les) in its canonical
 *    order, and its authored positions are not a giveaway pattern.
 *
 * Practice sessions are untouched: this module is applied only by the
 * checkpoint and placement builders.
 */

import { hashSeed, seededRng } from "../review-builder";
import type { Exercise } from "../types";

/** Exercise types whose option order is randomized when scored. */
export const OPTION_ORDER_SCORED_TYPES: ReadonlySet<Exercise["type"]> = new Set<
  Exercise["type"]
>(["select", "fillBlank", "listeningComprehension", "readingComprehension"]);

/** A seed string from the parts that identify one administration of one item. */
export function administrationSeed(parts: readonly (string | number)[]): string {
  return parts.map(String).join(":");
}

/**
 * Fisher–Yates permutation of 0..n-1 under a seeded generator.
 * Result: `perm[newIndex] = oldIndex`.
 */
export function seededPermutation(n: number, seed: string): number[] {
  const perm = Array.from({ length: n }, (_, i) => i);
  const rng = seededRng(hashSeed(seed));
  for (let i = n - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  return perm;
}

/**
 * The same exercise with its options in seeded order and `correct`
 * pointing at the same answer. Non-MCQ types (and articleSelect) are
 * returned unchanged — by identity, so callers can detect "no change".
 */
export function shuffleScoredOptions<E extends Exercise>(exercise: E, seed: string): E {
  switch (exercise.type) {
    case "select":
    case "listeningComprehension":
    case "readingComprehension":
    case "fillBlank": {
      const perm = seededPermutation(exercise.options.length, seed);
      const options = perm.map((old) => exercise.options[old]);
      const correct = perm.indexOf(exercise.correct);
      if (correct < 0) return exercise;
      return { ...exercise, options, correct } as E;
    }
    default:
      return exercise;
  }
}

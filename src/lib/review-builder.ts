import { pickDistractors } from "./learning/distractors";
import type { Exercise, Word } from "./types";

/** FNV-1a string hash — a pure way to derive a session seed from content. */
export function hashSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Deterministic PRNG (mulberry32) so review sessions are reproducible in tests. */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const REVIEW_SESSION_SIZE = 10;

/**
 * Build the spaced-review session for the due words. Distractors come from
 * the smart engine (Phase 4): tiered by confusables/POS/topic with a
 * same-gender preference for nouns where lexicon metadata exists, safe
 * deduped fallback where it doesn't (legacy courses) — never the answer,
 * never a duplicate display, and the correct option's position is shuffled.
 */
export function buildSrsExercises(
  dueTargets: string[],
  pool: Word[],
  seed: number,
  limit = REVIEW_SESSION_SIZE,
  courseId = "fr-en"
): Exercise[] {
  const rng = seededRng(seed);
  return dueTargets.slice(0, limit).flatMap((target) => {
    const word = pool.find((w) => w.target === target);
    if (!word) return [];

    // Every option carries its own word's emoji — an emoji only on the
    // correct answer would telegraph it (pre-Phase-3 flaw, fixed here).
    const distractors = pickDistractors({
      courseId,
      word,
      pool,
      rng,
      direction: "targetToNative",
    }).map((w) => ({ text: w.native, emoji: w.emoji }));
    if (distractors.length === 0) return [];

    const options = shuffle(
      [{ text: word.native, emoji: word.emoji }, ...distractors],
      rng
    );
    const correct = options.findIndex((o) => o.text === word.native);

    return [
      {
        type: "select" as const,
        id: `srs-${target}`,
        mode: "targetToNative" as const,
        // The prompt is what the Select renders as the word being asked —
        // it must be the French surface, not a duplicate of the title.
        prompt: word.target,
        audioTarget: word.target,
        options,
        correct,
      },
    ];
  });
}

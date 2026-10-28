/**
 * The word check that closes a story (P5b). Reading a story is exposure,
 * not retrieval, so it never touches the scheduler by itself; what feeds
 * FSRS is this short check over the story's NEW lexemes (plus the words the
 * learner asked to learn while reading), through the normal evidence gate:
 *   - a word without a recognition card: teach card, then its recognition
 *     probe (assessment) — exactly the TODAY "new word" pair;
 *   - a word already carded: its recognition probe only (the gate allows
 *     one mutation per card per session);
 *   - a word with a bundled word clip: also a listening probe (`listen`).
 * Pure: the route resolves the lexicon and clips and passes them in.
 */

import { contentString } from "../content-strings";
import { courseProfile } from "../course-profile";
import { dailyWordFromMeta } from "../learning/daily-words";
import { pickDistractors } from "../learning/distractors";
import type { LexemeMeta } from "../learning/lexicon-index";
import { buildSelect, shuffle } from "../learning/today";
import { hashSeed, seededRng } from "../review-builder";
import type { SessionStep } from "../session/types";
import type { Word } from "../types";

import type { CompiledStory } from "./content";
import { isKnownLexeme } from "./selection";

/** New lexemes (≤ 5) + words picked while reading: one short sitting. */
export const STORY_WORD_CHECK_MAX = 8;

export function storyCheckLexemes(story: Pick<CompiledStory, "newLexemes" | "lexemes">, picked: readonly string[] = []): string[] {
  const inStory = new Set(story.lexemes);
  const out: string[] = [];
  for (const id of [...story.newLexemes, ...picked]) {
    if (out.length >= STORY_WORD_CHECK_MAX) break;
    if (inStory.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function composeStoryWordCheck(args: {
  courseId: string;
  story: CompiledStory;
  cards: Record<string, unknown> | undefined;
  /** Lexemes the learner asked to learn while reading (in tap order). */
  picked?: readonly string[];
  lookup: (lexemeId: string) => LexemeMeta | undefined;
  /** Distractor pool (syllabus words); the story's own words are added. */
  pool: readonly Word[];
  /** lexemeId → word clip with bundled audio (listenWordClipIndex). */
  listenClips?: Record<string, string>;
  /** Same story + same day → the same check. */
  day: string;
}): SessionStep[] {
  const rng = seededRng(hashSeed(`${args.story.id}|${args.day}`));
  const words = new Map<string, Word>();
  for (const id of args.story.lexemes) {
    const meta = args.lookup(id);
    if (meta?.gloss) words.set(id, dailyWordFromMeta(meta));
  }
  const bySurface = new Map(args.pool.map((w) => [w.target, w]));
  for (const w of words.values()) if (!bySurface.has(w.target)) bySurface.set(w.target, w);
  const pool = [...bySurface.values()];
  const listenClips = args.listenClips ?? {};
  const nativeCode = courseProfile(args.courseId).nativeCode;

  const steps: SessionStep[] = [];
  for (const itemId of storyCheckLexemes(args.story, args.picked)) {
    const word = words.get(itemId);
    if (!word) continue;
    if (!isKnownLexeme(args.cards, itemId)) {
      steps.push({ type: "teach", stepId: `story-teach-${itemId}`, itemId, word });
    }
    const select = buildSelect({ courseId: args.courseId, id: `story-check-${itemId}`, word, pool, rng, direction: "targetToNative" });
    if (select) {
      steps.push({ type: "exercise", stepId: select.id, exercise: select, evidence: { itemId, srsRole: "assessment" } });
    }
    const clipId = listenClips[itemId];
    if (clipId !== undefined) {
      const distractors = pickDistractors({ courseId: args.courseId, word, pool, rng, direction: "targetToNative" }).map((w) => ({ text: w.native }));
      if (distractors.length > 0) {
        const options = shuffle([{ text: word.native }, ...distractors], rng);
        steps.push({
          type: "exercise",
          stepId: `story-listen-${itemId}`,
          exercise: {
            type: "listeningComprehension",
            id: `story-listen-${itemId}`,
            clipId,
            question: contentString(nativeCode, "whatDoYouHear"),
            options,
            correct: options.findIndex((o) => o.text === word.native),
          },
          evidence: { itemId, skill: "listen", srsRole: "assessment" },
        });
      }
    }
  }
  return steps;
}

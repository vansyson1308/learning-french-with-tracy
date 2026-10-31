/**
 * Which story to read next (P5b). Pure: the learner's knowledge is read
 * from the card states, never from a separate "read" list — once a story's
 * new words have recognition cards, its unknown count drops and the next
 * story takes its place.
 *
 * A lexeme counts as known when it has a recognition card (taught and
 * retrieved at least once). The target window is 3–6 unknown lexemes:
 * comprehensible input with a few new words. Order:
 *   1. "target"  — 3–6 unknown, lowest band first, then reading order;
 *   2. "stretch" — more than 6 unknown, the fewest first (a beginner's
 *                  closest story);
 *   3. "easy"    — fewer than 3 unknown, the most unknown first (rereading
 *                  material once everything is known).
 */

import { STORY_BANDS } from "./bands";
import type { CompiledStory } from "./content";

export const STORY_TARGET_MIN_UNKNOWN = 3;
export const STORY_TARGET_MAX_UNKNOWN = 6;

export type StoryPickReason = "target" | "stretch" | "easy";
export type StoryPick = { story: CompiledStory; unknown: string[]; reason: StoryPickReason };

type Cards = Record<string, unknown> | undefined;

export function isKnownLexeme(cards: Cards, lexemeId: string): boolean {
  return cards?.[`${lexemeId}|recognize`] !== undefined;
}

export function unknownLexemes(story: Pick<CompiledStory, "lexemes">, cards: Cards): string[] {
  return story.lexemes.filter((id) => !isKnownLexeme(cards, id));
}

const BAND_ORDER: readonly string[] = STORY_BANDS;

/** Every story with its unknown words and reason, in recommendation order. */
export function rankStories(stories: readonly CompiledStory[], cards: Cards): StoryPick[] {
  const picks = stories.map((story, i) => {
    const unknown = unknownLexemes(story, cards);
    const n = unknown.length;
    const reason: StoryPickReason = n < STORY_TARGET_MIN_UNKNOWN ? "easy" : n > STORY_TARGET_MAX_UNKNOWN ? "stretch" : "target";
    return { story, unknown, reason, i };
  });
  const tier = { target: 0, stretch: 1, easy: 2 } as const;
  return picks
    .sort((a, b) => {
      if (tier[a.reason] !== tier[b.reason]) return tier[a.reason] - tier[b.reason];
      if (a.reason === "stretch" && a.unknown.length !== b.unknown.length) return a.unknown.length - b.unknown.length;
      if (a.reason === "easy" && a.unknown.length !== b.unknown.length) return b.unknown.length - a.unknown.length;
      const band = BAND_ORDER.indexOf(a.story.band) - BAND_ORDER.indexOf(b.story.band);
      return band !== 0 ? band : a.i - b.i;
    })
    .map(({ story, unknown, reason }) => ({ story, unknown, reason }));
}

export function nextStory(stories: readonly CompiledStory[], cards: Cards): StoryPick | null {
  return rankStories(stories, cards)[0] ?? null;
}

/**
 * QC 2026-10-30 §2.2: TODAY suggests a story only when it is readable for
 * this learner — at most this many unknown words (from the card states).
 */
export const TODAY_STORY_MAX_UNKNOWN = 10;

export type TodayStorySuggestion =
  | { kind: "story"; pick: StoryPick }
  /** No story is readable yet: learn `n` more words (the closest story's unknown count above the cap). */
  | { kind: "learnMore"; n: number }
  | null;

/** The first readable story in recommendation order; else how many words are missing. */
export function todayStorySuggestion(stories: readonly CompiledStory[], cards: Cards): TodayStorySuggestion {
  const ranked = rankStories(stories, cards);
  if (ranked.length === 0) return null;
  const readable = ranked.find((p) => p.unknown.length <= TODAY_STORY_MAX_UNKNOWN);
  if (readable) return { kind: "story", pick: readable };
  const fewest = Math.min(...ranked.map((p) => p.unknown.length));
  return { kind: "learnMore", n: fewest - TODAY_STORY_MAX_UNKNOWN };
}

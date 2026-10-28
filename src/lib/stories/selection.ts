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

const BAND_ORDER = ["A1-1", "A1-2", "A2-1", "A2-2"];

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

/**
 * Story bands in reading order: a level's first half, then its second, with A1-0 for the
 * first days. Any level up to B2 can ship stories; content/schema.ts keeps the same list
 * (a test pins them together).
 */
export const STORY_BANDS = ["A1-0", "A1-1", "A1-2", "A2-1", "A2-2", "B1-1", "B1-2", "B2-1", "B2-2"] as const;
export type StoryBand = (typeof STORY_BANDS)[number];

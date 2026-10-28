/**
 * Readers of the per-word progress maps (wordStats, the legacy srs map).
 * Both are keyed by the item id the engine writes (`itemIdFor`): the raw
 * surface for a course without an id registry, `<code>:w:` / `<code>:legacy:`
 * ids for a registry course. UI code reads them through here, never by
 * indexing a map with a pack surface directly.
 */
import type { PersistedWordStat } from "../persistence/migrations";
import type { SrsEntry } from "../srs";
import { itemIdFor } from "./ids";

export function wordStatFor(
  courseId: string,
  wordStats: Readonly<Record<string, PersistedWordStat>> | undefined,
  surface: string
): PersistedWordStat | undefined {
  return wordStats?.[itemIdFor(courseId, surface)];
}

export function srsEntryFor(
  courseId: string,
  srs: Readonly<Record<string, SrsEntry>> | undefined,
  surface: string
): SrsEntry | undefined {
  return srs?.[itemIdFor(courseId, surface)];
}

/** Distinct pack words of the course that carry a stat. */
export function wordsLearnedCount(
  courseId: string,
  wordStats: Readonly<Record<string, PersistedWordStat>>,
  words: readonly { target: string }[]
): number {
  const ids = new Set(words.map((w) => itemIdFor(courseId, w.target)));
  return Object.keys(wordStats).filter((key) => ids.has(key)).length;
}

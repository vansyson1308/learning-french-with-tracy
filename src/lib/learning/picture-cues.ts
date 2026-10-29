/**
 * Picture cues of a choice question (QC 2026-10-30 §2.1). In a picture-
 * choice question every option's image must be distinct and must not give
 * away or contradict the meaning. A question whose options would share an
 * emoji ("el hombre" 👨 / "el papá" 👨), or that asks about a kinship word
 * (no emoji tells "uncle" from "father"), is shown as text only — never
 * pictures on some options and not on others, which would telegraph one.
 */

import { itemIdFor } from "./ids";
import { lexemeMetaFor } from "./lexicon-index";
import type { Word } from "../types";

/** Topics whose words no emoji can depict without misleading. */
export const UNPICTURED_TOPICS: ReadonlySet<string> = new Set(["family"]);

/** Every option has an emoji and no two share one. */
export function picturesAreDistinct(options: readonly { emoji?: string }[]): boolean {
  const emoji = options.map((o) => o.emoji);
  return emoji.every((e) => e !== undefined && e.length > 0) && new Set(emoji).size === emoji.length;
}

/** The options with their pictures, or all of them text-only (copies; the input is untouched). */
export function withPictureCues<T extends { text: string; emoji?: string }>(options: readonly T[], unpictured = false): T[] {
  if (!unpictured && picturesAreDistinct(options)) return [...options];
  return options.map((o) => {
    const { emoji: _emoji, ...rest } = o;
    return rest as T;
  });
}

/** A word of an unpictured topic (kinship) in this course's lexicon. */
export function isUnpicturedWord(courseId: string, word: Word): boolean {
  const topic = lexemeMetaFor(courseId, itemIdFor(courseId, word.target))?.topic;
  return topic !== undefined && UNPICTURED_TOPICS.has(topic);
}

/**
 * Reading aid (P4a): the romanization authored on a course's words
 * (`Word.romanization` — rōmaji, pinyin, RR) shown under the target text,
 * behind a per-course switch that defaults to ON (every shipped course is
 * A1). Dependency-free so the persistence layer can use the normaliser.
 */
import type { Word } from "../types";

export const READING_AID_DEFAULT = true;

/** Stored per course id; an absent key means the default. */
export type ReadingAidSettings = Record<string, boolean>;

/** Keep only `courseId → boolean` entries (imported / migrated data). */
export function normalizeReadingAid(value: unknown): ReadingAidSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: ReadingAidSettings = {};
  for (const [courseId, on] of Object.entries(value as Record<string, unknown>)) {
    if (courseId.length > 0 && typeof on === "boolean") out[courseId] = on;
  }
  return out;
}

export function readingAidOn(settings: ReadingAidSettings | undefined, courseId: string): boolean {
  return settings?.[courseId] ?? READING_AID_DEFAULT;
}

/** target surface → romanization, for the words that author one. */
export function readingMap(words: readonly Word[]): ReadonlyMap<string, string> {
  const map = new Map<string, string>();
  for (const w of words) if (w.romanization && !map.has(w.target)) map.set(w.target, w.romanization);
  return map;
}

/** The reading of a displayed text: exact surface match only (sentences have none). */
export function readingFor(map: ReadonlyMap<string, string>, text: string): string | undefined {
  return map.get(text.trim());
}

/**
 * Synchronous accessor over a course's compiled lightweight lexicon index
 * (src/content/lexicon/<code>-index.json, resolved through the per-course
 * artifact registry). This is the ONLY lexicon surface the session-critical
 * path may use — TODAY, TeachCard, PostAnswerPanel and the distractor
 * engine read metadata here; SQLite never enters a session. Courses without
 * an index resolve nothing and every caller degrades cleanly.
 */

import { artifactsFor, memoByCourse } from "../content-registry";
import { languageRulesForCourse } from "../languages";

export type LexemeMeta = {
  id: string;
  surface: string;
  lookupForm: string;
  lemma: string;
  gloss: string;
  pos: string;
  gender?: string;
  topic?: string;
  band?: string;
  pronunciation?: { value: string; notation: string };
  /** First example keyed by language code (`{ [targetCode]: …, [nativeCode]: … }`). */
  example?: Record<string, string>;
  confusables?: string[];
};

type IndexShape = { contentHash: string; entries: LexemeMeta[] };

type Resolved = {
  index: IndexShape;
  byId: Map<string, LexemeMeta>;
  /** lookupForm → id, unique matches only (homographs resolve to null). */
  byLookupForm: Map<string, string | null>;
};

const EMPTY: Resolved = {
  index: { contentHash: "", entries: [] },
  byId: new Map(),
  byLookupForm: new Map(),
};

const resolve = memoByCourse<Resolved>((courseId) => {
  const raw = artifactsFor(courseId).lexiconIndex as IndexShape | undefined;
  if (!raw) return EMPTY;
  const byLookupForm = new Map<string, string | null>();
  for (const entry of raw.entries) {
    byLookupForm.set(entry.lookupForm, byLookupForm.has(entry.lookupForm) ? null : entry.id);
  }
  return { index: raw, byId: new Map(raw.entries.map((e) => [e.id, e])), byLookupForm };
});

/** Rich metadata for a stable item id of the course, or undefined (never throws). */
export function lexemeMetaFor(courseId: string, itemId: string | undefined | null): LexemeMeta | undefined {
  if (typeof itemId !== "string") return undefined;
  return resolve(courseId).byId.get(itemId);
}

export function allLexemeMeta(courseId: string): readonly LexemeMeta[] {
  return resolve(courseId).index.entries;
}

/** lookupForm → id, unique matches only: a form shared by several lexemes resolves to undefined. */
export function lexemeIdForLookupForm(courseId: string, lookupForm: string): string | undefined {
  const id = resolve(courseId).byLookupForm.get(lookupForm);
  return id === null || id === undefined ? undefined : id;
}

export function lexiconIndexContentHash(courseId: string): string {
  return resolve(courseId).index.contentHash;
}

/** The article a noun surface leads with, per the course's language rules. */
export function articleCueFor(courseId: string, meta: LexemeMeta): string | undefined {
  return languageRulesForCourse(courseId).articleCue(meta.surface, meta.pos);
}

/**
 * Synchronous accessor over the compiled lightweight lexicon index
 * (src/content/lexicon/fr-index.json). This is the ONLY lexicon surface
 * the session-critical path may use — TODAY, TeachCard, PostAnswerPanel
 * and the distractor engine read metadata here; SQLite never enters a
 * session. Missing entries return undefined and every caller must degrade
 * cleanly (the legacy courses have no index at all).
 */

import frIndex from "../../content/lexicon/fr-index.json";

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
  example?: { fr: string; en: string };
  confusables?: string[];
};

type IndexShape = { contentHash: string; entries: LexemeMeta[] };

const INDEX = frIndex as IndexShape;
const BY_ID = new Map<string, LexemeMeta>(INDEX.entries.map((e) => [e.id, e]));

/** Rich metadata for a stable French item id, or undefined (never throws). */
export function lexemeMetaFor(itemId: string | undefined | null): LexemeMeta | undefined {
  if (typeof itemId !== "string") return undefined;
  return BY_ID.get(itemId);
}

/** All index entries in authored course order (frozen array — do not mutate). */
export function allLexemeMeta(): readonly LexemeMeta[] {
  return INDEX.entries;
}

// lookupForm → id, unique matches only: a form shared by several lexemes
// resolves to undefined so no caller can guess between homographs.
const BY_LOOKUP_FORM = (() => {
  const map = new Map<string, string | null>();
  for (const entry of INDEX.entries) {
    map.set(entry.lookupForm, map.has(entry.lookupForm) ? null : entry.id);
  }
  return map;
})();

/**
 * Resolves a bare form (no article) to its curated lexeme id when exactly
 * one lexeme carries it — used by grammar drills to attach practice
 * evidence to the right word without ever guessing.
 */
export function lexemeIdForLookupForm(lookupForm: string): string | undefined {
  const id = BY_LOOKUP_FORM.get(lookupForm);
  return id === null || id === undefined ? undefined : id;
}

export function lexiconIndexContentHash(): string {
  return INDEX.contentHash;
}

/**
 * The gender-bearing article cue for a noun surface ("le", "la", "l'"),
 * derived from the authored surface — never computed by stripping
 * arbitrary words at runtime.
 */
export function articleCueFor(meta: LexemeMeta): string | undefined {
  if (meta.pos !== "noun") return undefined;
  if (meta.surface.startsWith("le ")) return "le";
  if (meta.surface.startsWith("la ")) return "la";
  if (meta.surface.startsWith("l'")) return "l'";
  return undefined;
}

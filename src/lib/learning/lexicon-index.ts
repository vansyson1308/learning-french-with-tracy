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

/**
 * LexiconRepository — the app-owned port over the compiled French lexicon
 * (Phase 4). UI code never writes SQL; implementations:
 *
 *  - NativeSqliteLexiconRepository (expo-sqlite over the prebuilt asset,
 *    prepared statements only, lazy open, graceful fallback)
 *  - GeneratedLexiconRepository (pure TS over the compiled web-fallback
 *    JSON — the web tier, and, with an injected fixture, the test tier)
 *
 * Both compile from the same rich source and obey the same search
 * contract (src/lib/learning/lexicon-search.ts). The repository is
 * read-only: no learner state lives here (that stays in the Zustand
 * store), and nothing here mutates the lexicon.
 */

export type LexemeSummary = {
  id: string;
  surface: string;
  gloss: string;
  pos: string;
  gender?: string;
  topic?: string;
  band?: string;
};

export type LexemeExample = { fr: string; en: string };

export type LexemeDetail = LexemeSummary & {
  lemma: string;
  lookupForm: string;
  pronunciation?: { value: string; notation: string };
  frequency?: { band: string; rank: number; perMillion: number };
  examples: LexemeExample[];
  confusables?: string[];
  sourceRefs: { source: string; key?: string }[];
};

export type LexiconSort = "course" | "alpha" | "frequency";

export type ListOptions = {
  sort?: LexiconSort;
  /** Filter by normalized part of speech (e.g. "noun"). */
  pos?: string;
};

export interface LexiconRepository {
  getById(id: string): Promise<LexemeDetail | null>;
  /** Empty/whitespace queries resolve to [] — callers use list() instead. */
  search(query: string): Promise<LexemeSummary[]>;
  list(options?: ListOptions): Promise<LexemeSummary[]>;
  getExamples(id: string): Promise<LexemeExample[]>;
  /** True only when the underlying data really carries frequency bands. */
  supportsFrequencySort(): Promise<boolean>;
}

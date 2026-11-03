/**
 * GeneratedLexiconRepository — pure-TS LexiconRepository over the compiled
 * web-fallback dataset. This is the web tier (no wasm, no
 * SharedArrayBuffer, no COOP/COEP) and, with an injected fixture, the test
 * tier. Same compiled source, same search contract as native.
 */

import { foldForSearch, foldSearchable, rankMatches, searchTokens, type FoldedSearchable } from "../learning/lexicon-search";
import { cjkReadingKeys, cjkSearchPatterns, rankCjk, type CjkReading } from "./cjk-search";
import type {
  LexemeDetail,
  LexemeExample,
  LexemeSummary,
  LexiconRepository,
  ListOptions,
} from "./types";

export type GeneratedLexiconData = {
  contentHash: string;
  /** P4b stage 5: "cjk" = the CJK search contract (src/lib/lexicon/cjk-search.ts); absent = Latin. */
  searchMode?: "cjk";
  entries: {
    id: string;
    surface: string;
    lookupForm: string;
    lemma: string;
    gloss: string;
    pos: string;
    gender?: string;
    topic?: string;
    frequency?: { band: string; rank?: number; perMillion: number };
    pronunciation?: { value: string; notation: string };
    /** P4b: the CJK reading (ja kana, zh pinyin, ko rr) — the source of the CJK search keys. */
    reading?: CjkReading;
    /** Keyed by language code (target + native) plus the registered `source` id. */
    examples: Record<string, string>[];
    confusables?: string[];
    sourceRefs: { source: string; key?: string }[];
  }[];
};

type Entry = GeneratedLexiconData["entries"][number] & { ord: number };

/** The example texts without their provenance key (the repository surfaces language-coded text only). */
function withoutSource(example: Record<string, string>): LexemeExample {
  const { source: _source, ...texts } = example;
  return texts;
}

function toSummary(e: Entry): LexemeSummary {
  return {
    id: e.id,
    surface: e.surface,
    gloss: e.gloss,
    pos: e.pos,
    ...(e.gender !== undefined ? { gender: e.gender } : {}),
    ...(e.topic !== undefined ? { topic: e.topic } : {}),
    ...(e.frequency !== undefined ? { band: e.frequency.band } : {}),
  };
}

function toDetail(e: Entry): LexemeDetail {
  return {
    ...toSummary(e),
    lemma: e.lemma,
    lookupForm: e.lookupForm,
    ...(e.pronunciation !== undefined ? { pronunciation: { ...e.pronunciation } } : {}),
    ...(e.frequency !== undefined ? { frequency: { ...e.frequency } } : {}),
    examples: e.examples.map(withoutSource),
    ...(e.confusables !== undefined ? { confusables: [...e.confusables] } : {}),
    sourceRefs: e.sourceRefs.map((r) => ({ ...r })),
  };
}

export class GeneratedLexiconRepository implements LexiconRepository {
  private readonly entries: Entry[];
  private readonly byId: Map<string, Entry>;
  /** Folded search words per entry (by ord), built on the first search — never at startup. */
  private folded: FoldedSearchable[] | null = null;
  /** Alphabetical sort keys per entry (by ord), built on the first alphabetical list. */
  private sortKeys: string[] | null = null;

  /** P4b: the CJK search contract, or undefined for the Latin one. */
  private readonly searchMode: "cjk" | undefined;
  /** CJK search keys per entry (by ord), built on the first search. */
  private readingKeys: string[] | null = null;

  constructor(data: GeneratedLexiconData) {
    this.searchMode = data.searchMode;
    this.entries = data.entries.map((e, ord) => ({ ...e, ord }));
    this.byId = new Map(this.entries.map((e) => [e.id, e]));
  }

  private foldedEntries(): FoldedSearchable[] {
    if (this.folded === null) this.folded = this.entries.map(foldSearchable);
    return this.folded;
  }

  private alphaKeys(): string[] {
    if (this.sortKeys === null) this.sortKeys = this.entries.map((e) => foldForSearch(e.lookupForm));
    return this.sortKeys;
  }

  async getById(id: string): Promise<LexemeDetail | null> {
    const entry = this.byId.get(id);
    return entry ? toDetail(entry) : null;
  }

  async search(query: string): Promise<LexemeSummary[]> {
    if (this.searchMode === "cjk") {
      if (cjkSearchPatterns(query) === null) return [];
      if (this.readingKeys === null) this.readingKeys = this.entries.map(cjkReadingKeys);
      const keys = this.readingKeys;
      return rankCjk(
        this.entries.map((e) => ({ surface: e.surface, gloss: e.gloss, readingKeys: keys[e.ord]!, ord: e.ord, e })),
        query
      ).map((r) => toSummary(r.e));
    }
    const tokens = searchTokens(query);
    if (tokens.length === 0) return [];
    const folded = this.foldedEntries();
    return rankMatches(this.entries, tokens, (e) => folded[e.ord]).map(toSummary);
  }

  async list(options?: ListOptions): Promise<LexemeSummary[]> {
    let rows = [...this.entries];
    if (options?.pos !== undefined) rows = rows.filter((e) => e.pos === options.pos);
    const sort = options?.sort ?? "course";
    if (sort === "alpha") {
      // Same deterministic key the database precomputes (sort_key): the
      // accent/ligature-folded lookup form. No locale/ICU variance.
      // Keys folded once per entry, not twice per comparison (D-15 §7).
      const keys = this.alphaKeys();
      rows.sort((a, b) => {
        const ka = keys[a.ord];
        const kb = keys[b.ord];
        return ka < kb ? -1 : ka > kb ? 1 : a.ord - b.ord;
      });
    } else if (sort === "frequency") {
      // Raw per-million descending — the same key as the SQL tier: rank is
      // absent for unranked categories (merci), so it can never be the sort
      // key. Unmeasured entries sink to the end in course order.
      rows.sort((a, b) => {
        const fa = a.frequency?.perMillion ?? Number.NEGATIVE_INFINITY;
        const fb = b.frequency?.perMillion ?? Number.NEGATIVE_INFINITY;
        return fb - fa || a.ord - b.ord;
      });
    } else {
      rows.sort((a, b) => a.ord - b.ord);
    }
    return rows.map(toSummary);
  }

  async getExamples(id: string): Promise<LexemeExample[]> {
    const entry = this.byId.get(id);
    return entry ? entry.examples.map(withoutSource) : [];
  }

  async supportsFrequencySort(): Promise<boolean> {
    return this.entries.some((e) => e.frequency !== undefined);
  }
}

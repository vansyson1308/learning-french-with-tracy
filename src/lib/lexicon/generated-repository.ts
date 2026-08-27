/**
 * GeneratedLexiconRepository — pure-TS LexiconRepository over the compiled
 * web-fallback dataset. This is the web tier (no wasm, no
 * SharedArrayBuffer, no COOP/COEP) and, with an injected fixture, the test
 * tier. Same compiled source, same search contract as native.
 */

import { foldForSearch, rankMatches, searchTokens } from "../learning/lexicon-search";
import type {
  LexemeDetail,
  LexemeExample,
  LexemeSummary,
  LexiconRepository,
  ListOptions,
} from "./types";

export type GeneratedLexiconData = {
  contentHash: string;
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
    examples: { fr: string; en: string; source: string }[];
    confusables?: string[];
    sourceRefs: { source: string; key?: string }[];
  }[];
};

type Entry = GeneratedLexiconData["entries"][number] & { ord: number };

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
    examples: e.examples.map((ex) => ({ fr: ex.fr, en: ex.en })),
    ...(e.confusables !== undefined ? { confusables: [...e.confusables] } : {}),
    sourceRefs: e.sourceRefs.map((r) => ({ ...r })),
  };
}

export class GeneratedLexiconRepository implements LexiconRepository {
  private readonly entries: Entry[];
  private readonly byId: Map<string, Entry>;

  constructor(data: GeneratedLexiconData) {
    this.entries = data.entries.map((e, ord) => ({ ...e, ord }));
    this.byId = new Map(this.entries.map((e) => [e.id, e]));
  }

  async getById(id: string): Promise<LexemeDetail | null> {
    const entry = this.byId.get(id);
    return entry ? toDetail(entry) : null;
  }

  async search(query: string): Promise<LexemeSummary[]> {
    const tokens = searchTokens(query);
    if (tokens.length === 0) return [];
    return rankMatches(this.entries, tokens).map(toSummary);
  }

  async list(options?: ListOptions): Promise<LexemeSummary[]> {
    let rows = [...this.entries];
    if (options?.pos !== undefined) rows = rows.filter((e) => e.pos === options.pos);
    const sort = options?.sort ?? "course";
    if (sort === "alpha") {
      // Same deterministic key the database precomputes (sort_key): the
      // accent/ligature-folded lookup form. No locale/ICU variance.
      rows.sort((a, b) => {
        const ka = foldForSearch(a.lookupForm);
        const kb = foldForSearch(b.lookupForm);
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
    return entry ? entry.examples.map((ex) => ({ fr: ex.fr, en: ex.en })) : [];
  }

  async supportsFrequencySort(): Promise<boolean> {
    return this.entries.some((e) => e.frequency !== undefined);
  }
}

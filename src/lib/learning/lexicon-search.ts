/**
 * Shared search-text normalization for the French lexicon. Used by BOTH the
 * build-time FTS indexer and the runtime repositories (native SQLite and
 * web fallback), so their matching semantics stay in lockstep.
 *
 * SQLite's unicode61 tokenizer with remove_diacritics handles true
 * diacritics (é→e, ç→c, â→a) at match time, but œ/æ are ligature letters,
 * not letters-with-diacritics, so "oeuf" would never find "œuf". We fold
 * ligatures on BOTH the indexed text and the query text; accent folding for
 * the pure-TS web path is applied via NFD stripping to mirror
 * remove_diacritics 2.
 */

/** Ligature folding applied to indexed text and query text alike. */
export function foldLigatures(text: string): string {
  return text.replace(/œ/g, "oe").replace(/Œ/g, "OE").replace(/æ/g, "ae").replace(/Æ/g, "AE");
}

/**
 * Full fold for pure-TS matching (web fallback): ligatures + lowercase +
 * accent removal (NFD, strip combining marks) — the TS mirror of what
 * unicode61 remove_diacritics 2 does to the FTS index.
 */
export function foldForSearch(text: string): string {
  return foldLigatures(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Query tokens: fold, then split on anything that is not a letter or digit
 * (apostrophes and hyphens split words, matching unicode61's separator
 * behavior). Empty tokens drop out.
 */
export function searchTokens(query: string): string[] {
  return foldForSearch(query)
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 0);
}

/* ------------------------------------------------------------------ */
/* Shared search contract (native SQLite and web fallback both obey it) */
/* ------------------------------------------------------------------ */

/** The folded fields a search candidate exposes for matching/ranking. */
export type SearchableFields = {
  surface: string;
  lemma: string;
  gloss: string;
};

function words(folded: string): string[] {
  return folded.split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 0);
}

/**
 * Match contract: EVERY query token must be a word-prefix somewhere in the
 * folded surface, lemma, or gloss (mirrors FTS5 `tok*` AND semantics).
 */
export function matchesAllTokens(fields: SearchableFields, tokens: string[]): boolean {
  if (tokens.length === 0) return false;
  const haystacks = [
    ...words(foldForSearch(fields.surface)),
    ...words(foldForSearch(fields.lemma)),
    ...words(foldForSearch(fields.gloss)),
  ];
  return tokens.every((t) => haystacks.some((w) => w.startsWith(t)));
}

/**
 * Ranking contract, deterministic and identical across implementations:
 * per token take the best field weight (surface word-prefix 30, lemma 15,
 * gloss 8; +10 bonus when the token prefixes the FIRST surface word — the
 * headword feel), sum over tokens, then order by score descending with the
 * stable course order (`ord`) as the tiebreak.
 */
export function searchScore(fields: SearchableFields, tokens: string[]): number {
  return scoreFolded(foldSearchable(fields), tokens);
}

/** A candidate's folded words per field — what the ranker compares tokens against. */
export type FoldedSearchable = { surfaceWords: string[]; lemmaWords: string[]; glossWords: string[] };

export function foldSearchable(fields: SearchableFields): FoldedSearchable {
  return {
    surfaceWords: words(foldForSearch(fields.surface)),
    lemmaWords: words(foldForSearch(fields.lemma)),
    glossWords: words(foldForSearch(fields.gloss)),
  };
}

function scoreFolded({ surfaceWords, lemmaWords, glossWords }: FoldedSearchable, tokens: string[]): number {
  let score = 0;
  for (const t of tokens) {
    let best = 0;
    if (surfaceWords.some((w) => w.startsWith(t))) best = 30;
    else if (lemmaWords.some((w) => w.startsWith(t))) best = 15;
    else if (glossWords.some((w) => w.startsWith(t))) best = 8;
    if (best === 0) return 0; // must match every token
    if (surfaceWords.length > 0 && surfaceWords[0].startsWith(t)) best += 10;
    score += best;
  }
  return score;
}

/**
 * `folded` lets a caller that searches the same candidates repeatedly (the
 * web tier: every query ranks all ~12,000 entries at C2 scale, D-15 §7)
 * fold each candidate once instead of once per query. Same words, same
 * scores, same order.
 */
export function rankMatches<T extends SearchableFields & { ord: number }>(
  candidates: T[],
  tokens: string[],
  folded: (candidate: T) => FoldedSearchable = foldSearchable
): T[] {
  return candidates
    .map((c) => ({ c, score: scoreFolded(folded(c), tokens) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.c.ord - b.c.ord)
    .map((x) => x.c);
}

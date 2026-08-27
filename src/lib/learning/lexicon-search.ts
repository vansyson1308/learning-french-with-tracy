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

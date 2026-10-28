/**
 * Shared building blocks for language plugins (P1b). The Latin-script
 * defaults are exactly the folding the French course shipped with — the
 * French plugin only adds its article cue and number speller on top — so
 * every plugin that reuses them inherits behaviour that is golden-pinned.
 * Character classes are written as \u escapes on purpose: the exact set
 * is the contract.
 */

import type { LanguageRules } from "./types";

/** Ligature folding applied to indexed text and query text alike (œ/æ). */
export function foldLigatures(text: string): string {
  return text.replace(/œ/g, "oe").replace(/Œ/g, "OE").replace(/æ/g, "ae").replace(/Æ/g, "AE");
}

/**
 * Lenient typed-answer form: smart apostrophes → ASCII, no-break spaces →
 * space, lowercase, NFD with combining marks stripped, ligatures folded,
 * punctuation removed, whitespace collapsed.
 */
export function normalizeLenientLatin(text: string): string {
  return (
    text
      .replace(/[\u2018\u2019\u02BC]/g, "'")
      .replace(/[\u00A0\u202F\u2009]/g, " ")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036F]/g, "")
      // D-10 review: typed Vietnamese answers fold đ like the other marks ("dan ong" = "đàn ông"); no Latin target uses it.
      .replace(/đ/g, "d")
      .replace(/œ/g, "oe")
      .replace(/æ/g, "ae")
      .replace(/[.,!?\u00BF\u00A1;:"'\u3001\u3002\uFF01\uFF1F\u00AB\u00BB\u201C\u201D\u2026]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/**
 * Strict form for grammar production: apostrophe/space variants unified
 * and case-insensitive, but accents and exact inflection preserved.
 */
export function normalizeStrictLatin(text: string): string {
  return text
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u00A0\u202F\u2009]/g, " ")
    .normalize("NFC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Spoken folding: case, ligatures, apostrophes/hyphens/punctuation → spaces. */
export function foldSpokenLatin(text: string): string {
  return foldLigatures(text.normalize("NFC"))
    .toLowerCase()
    .replace(/[\u2019\u02BC']/g, " ")
    .replace(/[-\u2010\u2011\u2013\u2014]/g, " ")
    .replace(/[.,!?;:\u2026"\u201C\u201D\u00AB\u00BB()\u00A0]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Search folding: ligatures + lowercase + diacritics stripped (unicode61 remove_diacritics 2). */
export function foldForSearchLatin(text: string): string {
  return foldLigatures(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036F]/g, "");
}

export function tokenizeWhitespace(folded: string): string[] {
  return folded.length === 0 ? [] : folded.split(" ").filter((t) => t.length > 0);
}

/**
 * Article cue + split from a fixed article table ("le " / "l'" prefixes).
 * Longer and elided forms are tried first so "l'" wins over "le".
 */
export function articleTable(articles: readonly string[]) {
  const sorted = [...articles].sort((a, b) => b.length - a.length);
  const splitArticle = (surface: string): { article?: string; bare: string } => {
    for (const article of sorted) {
      const prefix = article.endsWith("'") ? article : `${article} `;
      if (surface.startsWith(prefix)) {
        return { article, bare: surface.slice(prefix.length) };
      }
    }
    return { bare: surface };
  };
  const articleCue = (surface: string, pos?: string): string | undefined => {
    if (pos !== undefined && pos !== "noun") return undefined;
    return splitArticle(surface).article;
  };
  return { articleCue, splitArticle };
}

export const NO_ARTICLES = {
  articleCue: (): string | undefined => undefined,
  splitArticle: (surface: string): { article?: string; bare: string } => ({ bare: surface }),
};

/** A plugin from the Latin defaults plus per-language overrides. */
export function latinRules(
  base: Pick<LanguageRules, "code" | "ttsLocale" | "recognitionLocale">,
  overrides: Partial<LanguageRules> = {}
): LanguageRules {
  return {
    ...base,
    ...NO_ARTICLES,
    spellDigits: (token) => token,
    normalizeLenient: normalizeLenientLatin,
    normalizeStrict: normalizeStrictLatin,
    foldSpoken: foldSpokenLatin,
    tokenize: tokenizeWhitespace,
    fold: foldForSearchLatin,
    ...overrides,
  };
}

/**
 * Generic build plugin (P1c): the defaults every language gets unless its
 * own module overrides them — no gendered articles, no paradigms, no
 * number speller, Latin FTS folding (CJK scripts switch to trigram), and
 * the runtime rules of the same code. A language can be added by content
 * alone and still validate, compile and ship; its own plugin only refines.
 */

import { languageRules } from "../../../src/lib/languages";

import type { ArticleGender, ArticleRules, BuildLanguage, BuildLanguagePlugin, ScriptKind } from "./types";

/** FTS5 tokenizer by script: diacritic-folding unicode61 for Latin, trigram for CJK. */
export function ftsTokenizerFor(script: ScriptKind): string {
  return script === "latin" ? "unicode61 remove_diacritics 2" : "trigram";
}

/** Word-boundary-aware gendered-determiner scan from an article table. */
export function genderEvidenceScanner(
  rules: ArticleRules | null
): (text: string, lookupForm: string) => ArticleGender[] {
  if (rules === null) return () => [];
  const articles = Object.keys(rules.gender);
  if (articles.length === 0) return () => [];
  const alternation = articles.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  return (text, lookupForm) => {
    const evidence: ArticleGender[] = [];
    const escaped = lookupForm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(?:^|[^\\p{L}])(${alternation})\\s+${escaped}(?=$|[^\\p{L}])`, "giu");
    const silent = rules.neutralBefore && rules.neutralBefore.noun.test(lookupForm) ? new Set(rules.neutralBefore.articles) : null;
    for (const m of text.matchAll(re)) {
      const article = m[1].toLowerCase();
      if (silent?.has(article)) continue;
      const g = rules.gender[article];
      if (g) evidence.push(g);
    }
    return evidence;
  };
}

/** Surface splitter from an article table (longest/elided forms first). */
export function articleSplitter(
  rules: ArticleRules | null
): (surface: string) => { article: string | null; rest: string } {
  if (rules === null) return (surface) => ({ article: null, rest: surface });
  const sorted = [...Object.keys(rules.gender), ...rules.neutral].sort((a, b) => b.length - a.length);
  return (surface) => {
    for (const article of sorted) {
      const prefix = article.endsWith("'") ? article : `${article} `;
      if (surface.startsWith(prefix)) return { article, rest: surface.slice(prefix.length) };
    }
    return { article: null, rest: surface };
  };
}

export function genericPlugin(
  facts: BuildLanguage,
  overrides: Partial<BuildLanguagePlugin> = {}
): BuildLanguagePlugin {
  const rules = overrides.rules ?? languageRules(facts.code);
  const articleRules = overrides.articleRules ?? null;
  return {
    ...facts,
    rules,
    articleRules,
    splitSurfaceArticle: articleSplitter(articleRules),
    genderEvidenceInText: genderEvidenceScanner(articleRules),
    normalizeForAsr: {
      ligatures: {},
      apostropheSplit: true,
      wordChars: facts.script === "latin" ? "a-z\\u00e0-\\u00ff0-9" : "\\w",
      whisperLanguage: facts.code,
    },
    charsPerSecBand: { min: 4, max: 30 },
    tokenize: (text) => rules.tokenize(rules.foldSpoken(text)),
    ftsTokenizer: ftsTokenizerFor(facts.script),
    functionWords: [],
    targetLanguageName: facts.code,
    ...overrides,
  };
}

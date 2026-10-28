/**
 * Build-time language plugin (P1c). Everything the compiler and the
 * validators need to know about a TARGET language that is not course
 * content: the runtime rules (folding, tokenising, digit spelling — the
 * same object the app ships, so build and runtime can never disagree) plus
 * build-only facts: article↔gender rules, the paradigm (grammar-table)
 * cell vocabulary and its evidence source, the ASR-normalisation spec the
 * audio audit consumes, the FTS tokenizer for the lexicon database, and
 * the function words the writing engine's plausibility floor accepts.
 *
 * One plugin per language under scripts/lib/languages/<code>.ts; unknown
 * codes get the generic Latin plugin under their own code, so no caller
 * ever branches on a language literal.
 */

import type { LanguageRules } from "../../../src/lib/languages/types";

export type ScriptKind = "latin" | "japanese" | "han" | "hangul";

/** Build-side facts the compiler bakes into course profiles (since P1b). */
export type BuildLanguage = {
  code: string;
  recognitionLocale: string;
  ttsLocale: string;
  script: ScriptKind;
  /** assets/images/flags/<flagAsset>.svg (HatScripts circle-flags, MIT). */
  flagAsset: string;
  /**
   * Verified number speller for the pack validator's number-drill rule
   * (a bare-integer prompt must key the engine's spelling). Absent until a
   * language's speller is verified — the rule then does not apply.
   */
  numberDrill?: { accepted(n: number): string[]; expected(n: number): string };
};

export type ArticleGender = "masculine" | "feminine" | "neuter";

/**
 * How a language cues noun gender through articles. `null` for languages
 * without gendered articles (then every article/gender rule is skipped).
 */
export type ArticleRules = {
  /** Gendered articles → the gender they prove ("le" → masculine, "una" → feminine). */
  gender: Record<string, ArticleGender>;
  /** Elided/gender-neutral surface articles ("l'") — carry no gender evidence. */
  neutral: readonly string[];
  /**
   * Nouns a gendered-article drill must NOT be run on (French: vowel/h-initial
   * nouns elide to l'); undefined = no such restriction.
   */
  elisionSensitiveNoun?: RegExp;
  /** Articles whose drill triggers the elision rule (French: le/la). */
  elisionSensitiveArticles?: readonly string[];
  /**
   * P3a: articles that carry NO gender evidence before nouns matching the
   * pattern (Spanish "el agua": feminine nouns with a stressed initial /a/
   * take `el`). Removing evidence only — never adds a gender.
   */
  neutralBefore?: { articles: readonly string[]; noun: RegExp };
};

/** A paradigm-evidence row: a form with its analysis atoms (e.g. "ind:pre:1"). */
export type MorphRow = { mot: string; infoVer: string };
export type MorphVerb = { lemma: string; rows: MorphRow[] };

/**
 * The grammar-paradigm vocabulary of a language (undefined = the language
 * authors no paradigm tables; conjugationCloze exercises are then invalid).
 */
export type ParadigmSpec = {
  /** Cell ids every table must fill completely (French: inf, pre:1s … participle). */
  cellIds: readonly string[];
  /** Allowed `group` values. */
  groups: readonly string[];
  /** Registered source id whose rows evidence every cell. */
  evidenceSource: string;
  /** Load the evidence rows (committed derived data); null when not derived yet. */
  loadEvidence(): MorphVerb[] | null;
  /** Predicate: does an analysis atom evidence this cell? */
  cellEvidencedBy(cellId: string, atom: string): boolean;
  /** Extra per-group rules (e.g. the French regular -er written paradigm). */
  groupRules?(table: { lemma: string; group: string; cells: Record<string, string> }, err: (m: string) => void): void;
  /** Required `attributes` keys with their allowed values (French: auxiliary ∈ {avoir, être}). */
  attributes?: Record<string, readonly string[]>;
};

/**
 * ASR-normalisation spec (consumed by scripts/reception-asr-audit.py via
 * the generation plan, so the Python audit never re-implements language
 * rules): ligature folds, whether apostrophes split clitics, and the
 * character class kept as word characters.
 */
export type AsrNormalization = {
  ligatures: Record<string, string>;
  apostropheSplit: boolean;
  /** Regex character class (Python syntax) of word characters after lowercasing + NFC. */
  wordChars: string;
  /** Whisper language code. */
  whisperLanguage: string;
  /** P3e: "cer" for scripts without reliable word spaces (Han, kana, Hangul); absent = by language (ja/zh/ko → cer). */
  metric?: "wer" | "cer";
};

export type BuildLanguagePlugin = BuildLanguage & {
  /** The runtime rules the app ships for this language (src/lib/languages/<code>.ts). */
  rules: LanguageRules;
  articleRules: ArticleRules | null;
  /** Surface → leading article (if any) and the rest; verifies authored lookupForms. */
  splitSurfaceArticle(surface: string): { article: string | null; rest: string };
  /** Cardinal number words 0..100 for the writing floor, when a verified speller exists. */
  numberWords?(n: number): string;
  /** Gendered determiners immediately preceding a form inside a text (example evidence). */
  genderEvidenceInText(text: string, lookupForm: string): ArticleGender[];
  normalizeForAsr: AsrNormalization;
  /** Plausible transcript-chars-per-second band for synthesized clips (QA). */
  charsPerSecBand: { min: number; max: number };
  tokenize(text: string): string[];
  paradigm?: ParadigmSpec;
  /** FTS5 tokenizer clause for the lexicon database, chosen by script. */
  ftsTokenizer: string;
  /** High-frequency function words the writing plausibility floor accepts (not lexicon headwords). */
  functionWords: readonly string[];
  /** Target-language name as the writing engine labels it in feedback. */
  targetLanguageName: string;
  /**
   * Language-specific course gates run by content:validate on every course
   * of the language except inherited basic packs (QC 2026-10-28: German
   * articles/plurals, dative chunks, verb-second practice).
   */
  courseErrors?(pack: import("../../../content/schema").PackSource): string[];
  /**
   * Plural / agreement endings the story resolver strips from nouns and
   * adjectives, tried in order (default: the Romance list in stories.ts).
   * Stem changes (umlaut plurals) are never guessed — tokenMap.
   */
  storyEndings?: readonly (readonly [RegExp, string])[];
};

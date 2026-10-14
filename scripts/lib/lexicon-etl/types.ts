/**
 * Lexicon ETL v2 (P3a) — the language-neutral record every source adapter
 * fills and every derivation consumes. One `CandidateLexeme` per
 * (lemma, part of speech) of a target language, assembled from the open
 * sources listed in `sources.ts` (licences recorded there and in the
 * registry). Nothing here is learner-facing: the authoring step
 * (`scripts/lexicon-author.ts`) turns a selection of candidates into the
 * authored rich lexicon, which is what the validators and the compiler see.
 */

import type { PartOfSpeech } from "../../../content/schema";

/** A gloss in one native language with the source it came from. */
export type SourcedGloss = { text: string; source: string };

/** An example sentence with its translations per native code, each with a source. */
export type CandidateExample = {
  target: string;
  translations: Record<string, string>;
  /** Registry id of the sentence source (kaikki-en, kaikki-vi, tatoeba). */
  source: string;
  /** Source-side identity (Tatoeba sentence ids `spa|eng`, or `word|pos|senseIndex`). */
  key: string;
};

/** An inflected form with its analysis atoms (`ind:pre:1`, `inf`, `par:pas`, `pl`, `f`…). */
export type CandidateForm = { form: string; atoms: string[]; rawTags: string[] };

export type CandidateFrequency = {
  /** Primary source rank (1 = most frequent form) and occurrences per million of the list total. */
  primary?: { source: string; rank: number; count: number; perMillion: number };
  /** Secondary source (wordfreq): Zipf frequency (log10 per billion). */
  secondary?: { source: string; zipf: number };
};

export type CandidateLexeme = {
  lemma: string;
  partOfSpeech: PartOfSpeech;
  /** The source's own part-of-speech label (kaikki `pos`), kept for audit. */
  sourcePos: string;
  gender?: "masculine" | "feminine" | "neuter" | "both" | "unknown";
  ipa?: { value: string; source: string };
  glosses: Record<string, SourcedGloss[]>;
  examples: CandidateExample[];
  forms: CandidateForm[];
  frequency: CandidateFrequency;
  /** Topical labels the sources carry (kaikki sense topics / topical categories), lowercased. */
  topics: string[];
  /** Register / usage tags that disqualify a learner lexeme (vulgar, offensive, obsolete…). */
  usageTags: string[];
  /** Exam / CEFR anchor levels per anchor source id (e.g. { openjlpt: "N5" }). */
  anchors: Record<string, string>;
  /** Readings for non-Latin scripts (kana, romaji, pinyin, revised romanisation). */
  readings?: Record<string, string>;
  /** Source ids that contributed any field (registry ids). */
  sourceIds: string[];
};

/** A form → lemma mapping from the sources' form-of senses. */
export type FormOfIndex = Map<string, Set<string>>;

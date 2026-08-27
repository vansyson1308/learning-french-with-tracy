/**
 * Content-pack schemas — the validation source of truth for content/courses/.
 * Mirrors src/lib/types.ts exactly (that file's header has pointed here since
 * the original, unpublished pipeline). Strict objects: an unknown field in
 * source content is a typo until proven otherwise.
 *
 * `gradeTargets` is emitted by the compiler (never authored): the stable
 * lexeme ids an exercise unambiguously assesses. Phase 2 only emits it where
 * ambiguity is zero; the runtime keeps its conservative interim rule.
 */

import { z } from "zod";

const id = z.string().min(1);

export const WordSchema = z.strictObject({
  target: z.string().min(1),
  native: z.string().min(1),
  emoji: z.string().min(1),
  romanization: z.string().min(1).optional(),
});

const gradeTargets = z.array(z.string().min(1)).min(1).optional();

export const SelectExerciseSchema = z.strictObject({
  type: z.literal("select"),
  id,
  mode: z.enum(["targetToNative", "nativeToTarget", "listen"]),
  prompt: z.string(),
  audioTarget: z.string().min(1).optional(),
  options: z
    .array(z.strictObject({ text: z.string().min(1), emoji: z.string().optional() }))
    .min(2),
  correct: z.number().int().min(0),
  gradeTargets,
});

export const WordBankExerciseSchema = z.strictObject({
  type: z.literal("wordBank"),
  id,
  direction: z.enum(["targetToNative", "nativeToTarget"]),
  prompt: z.string(),
  audioTarget: z.string().min(1).optional(),
  tokens: z.array(z.string().min(1)).min(1),
  answer: z.array(z.string().min(1)).min(1),
  gradeTargets,
});

export const MatchExerciseSchema = z.strictObject({
  type: z.literal("match"),
  id,
  pairs: z
    .array(z.strictObject({ target: z.string().min(1), native: z.string().min(1) }))
    .min(2),
  gradeTargets,
});

export const TypeAnswerExerciseSchema = z.strictObject({
  type: z.literal("typeAnswer"),
  id,
  mode: z.enum(["translate", "listen"]),
  prompt: z.string(),
  audioTarget: z.string().min(1).optional(),
  answer: z.string().min(1),
  alternatives: z.array(z.string()),
  gradeTargets,
});

export const FillBlankExerciseSchema = z.strictObject({
  type: z.literal("fillBlank"),
  id,
  sentence: z.string().min(1),
  translation: z.string().min(1),
  audioTarget: z.string().min(1).optional(),
  options: z.array(z.string().min(1)).min(2),
  correct: z.number().int().min(0),
  gradeTargets,
});

/**
 * Grammar drill (Phase 5B §54–58): pick the right article for a noun. By
 * DESIGN this schema has no gradeTargets field — grammar answers are
 * practice evidence and must never mutate a lexical recognize card; the
 * strict object makes that structural, not conventional. Elision safety
 * (§57): when the choice set contains le/la, the noun must start with a
 * consonant sound (validated) — vowel/h-initial nouns take l' and cannot
 * be drilled on le-vs-la.
 */
export const ArticleSelectExerciseSchema = z.strictObject({
  type: z.literal("articleSelect"),
  id,
  /** The article choices, e.g. ["le","la"] or ["un","une"]. */
  articles: z.array(z.string().min(1)).min(2),
  /** The noun WITHOUT its article, exactly as it should follow it. */
  noun: z.string().min(1),
  /** English gloss shown under the noun. */
  gloss: z.string().min(1),
  correct: z.number().int().min(0),
  audioTarget: z.string().min(1).optional(),
});

export const ExerciseSchema = z.discriminatedUnion("type", [
  SelectExerciseSchema,
  WordBankExerciseSchema,
  MatchExerciseSchema,
  TypeAnswerExerciseSchema,
  FillBlankExerciseSchema,
  ArticleSelectExerciseSchema,
]);

/** Stable pedagogy-concept id, e.g. "fr:concept:gender-two-classes". */
export const conceptId = z.string().regex(/^fr:concept:[a-z0-9]+(?:-[a-z0-9]+)*$/);

/**
 * Optional explicit lesson flow (Phase 5B): the ordered interleaving of
 * concept steps (Continue-only teaching, no grading/FSRS/XP) and the
 * lesson's exercises. When absent, the flow is simply the exercises in
 * order — every pre-5B lesson keeps its exact behavior. When present, the
 * validator requires each entry to resolve and every exercise to appear
 * exactly once, so a flow can reorder or interleave but never drop or
 * duplicate graded work.
 */
export const LessonFlowEntrySchema = z.union([
  z.strictObject({ concept: conceptId }),
  z.strictObject({ exercise: id }),
]);

export const LessonSchema = z.strictObject({
  id,
  title: z.string().min(1),
  exercises: z.array(ExerciseSchema).min(1),
  flow: z.array(LessonFlowEntrySchema).min(1).optional(),
});

export const UnitSchema = z.strictObject({
  id,
  title: z.string().min(1),
  description: z.string(),
  guidebook: z.string(),
  words: z.array(WordSchema).min(1),
  lessons: z.array(LessonSchema).min(1),
});

export const SectionSchema = z.strictObject({
  id,
  title: z.string().min(1),
  units: z.array(UnitSchema).min(1),
});

export const PackSchema = z.strictObject({
  id,
  version: z.number().int().min(1),
  targetLanguage: z.string().min(1),
  targetCode: z.string().min(2),
  nativeLanguage: z.string().min(1),
  nativeCode: z.string().min(2),
  flag: z.string().min(1),
  sections: z.array(SectionSchema).min(1),
});
export type PackSource = z.infer<typeof PackSchema>;

export const CatalogSchema = z.strictObject({
  version: z.number().int().min(1),
  courses: z.array(
    z.strictObject({
      id,
      targetLanguage: z.string().min(1),
      targetCode: z.string().min(2),
      nativeLanguage: z.string().min(1),
      flag: z.string().min(1),
      unitCount: z.number().int().min(1),
      lessonCount: z.number().int().min(1),
    })
  ),
});

/** content/fr/lexemes.json: surface → stable lexeme id (fr:w:<slug>). */
export const FrLexemeMapSchema = z.record(
  z.string().min(1),
  z.string().regex(/^fr:w:[a-z0-9-]+$/)
);

/* ------------------------------------------------------------------ */
/* Phase 4: rich French lexicon (content/fr/lexicon/)                  */
/* ------------------------------------------------------------------ */

const lexemeId = z.string().regex(/^fr:w:[a-z0-9-]+$/);

export const POS_VALUES = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "determiner",
  "preposition",
  "conjunction",
  "interjection",
  "expression",
  "other",
] as const;
export type PartOfSpeech = (typeof POS_VALUES)[number];

export const GENDER_VALUES = ["masculine", "feminine", "both", "unknown"] as const;
export type LexemeGender = (typeof GENDER_VALUES)[number];

export const TOPIC_VALUES = ["people", "greetings", "food", "animals", "travel"] as const;
export type LexemeTopic = (typeof TOPIC_VALUES)[number];

export const FREQUENCY_BAND_VALUES = ["very-common", "common", "less-common"] as const;
export type FrequencyBand = (typeof FREQUENCY_BAND_VALUES)[number];

/**
 * `notation` is honest labeling: "ipa" only for values that really are IPA.
 * Lexique 4's 2_Phono ASCII alphabet ships as "phonology"; its dedicated
 * 3_Phono_IPA column is genuine IPA and may ship as "ipa" verbatim (see
 * content/fr/lexicon/LEXIQUE4_COLUMNS.md; the validator rejects
 * lexique-sourced "ipa" values carrying ASCII-alphabet characters).
 */
export const PronunciationSchema = z.strictObject({
  value: z.string().min(1),
  notation: z.enum(["ipa", "phonology"]),
  source: z.string().min(1),
});

export const LexemeExampleSchema = z.strictObject({
  fr: z.string().min(1),
  en: z.string().min(1),
  source: z.string().min(1),
});

export const LexemeFrequencySchema = z.strictObject({
  /** Registry id of the measurement source (real measurements only). */
  source: z.string().min(1),
  /** The source's raw measurement (occurrences per million words). */
  rawValue: z.number().nonnegative(),
  /**
   * 1-based rank in the eligible lemma population under the documented
   * ordering (derived/core-ranks.json). Absent when the lemma's category
   * sits outside the ranked population (e.g. interjections like merci) —
   * sorting always uses rawValue, never rank.
   */
  rank: z.number().int().min(1).optional(),
  /** Band derived from the population-quantile thresholds (§18). */
  band: z.enum(FREQUENCY_BAND_VALUES),
});

export const RichLexemeSchema = z.strictObject({
  /** Frozen stable id — must equal the entry in content/fr/lexemes.json. */
  id: lexemeId,
  /** The course-visible string, verbatim (articles included for nouns). */
  surface: z.string().min(1),
  /** Dictionary lemma. */
  lemma: z.string().min(1),
  /**
   * The form used for external-source matching (surface minus any leading
   * article). Stored explicitly — the runtime never strips articles
   * heuristically; validation cross-checks it against `surface`.
   */
  lookupForm: z.string().min(1),
  partOfSpeech: z.enum(POS_VALUES),
  /** Nouns only (validated); other parts of speech must omit it. */
  gender: z.enum(GENDER_VALUES).optional(),
  nativeGloss: z.string().min(1),
  pronunciation: PronunciationSchema.optional(),
  frequency: LexemeFrequencySchema.optional(),
  topic: z.enum(TOPIC_VALUES).optional(),
  examples: z.array(LexemeExampleSchema),
  relations: z
    .strictObject({ confusables: z.array(lexemeId).min(1) })
    .optional(),
  sourceRefs: z
    .array(z.strictObject({ source: z.string().min(1), key: z.string().min(1).optional() }))
    .min(1),
});
export type RichLexeme = z.infer<typeof RichLexemeSchema>;

export const RichLexiconSchema = z.strictObject({
  version: z.literal(1),
  language: z.literal("fr"),
  lexemes: z.array(RichLexemeSchema).min(1),
});
export type RichLexicon = z.infer<typeof RichLexiconSchema>;

/**
 * content/fr/lexicon/source-manifest.json — the external-source contract.
 * Fail-closed by construction: "retrieved" requires a pinned SHA-256 and
 * artifact identity; "not-retrieved" forbids them, and the extractor
 * refuses to ingest anything while the status is "not-retrieved".
 */
export const SourceManifestSchema = z
  .strictObject({
    source: z.strictObject({
      id: z.string().min(1),
      name: z.string().min(1),
      targetVersion: z.string().min(1),
      authors: z.array(z.string().min(1)).min(1),
      citation: z.string().min(1),
      license: z.enum(["CC-BY-SA-4.0"]),
      officialLocations: z.array(z.string().min(1)).min(1),
    }),
    retrieval: z.strictObject({
      status: z.enum(["not-retrieved", "retrieved"]),
      artifactFilename: z.string().min(1).nullable(),
      url: z.string().min(1).nullable(),
      retrievedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
      sha256: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
    }),
    /**
     * Column names the extractor will look for, declared ahead of retrieval
     * from the Lexique documentation lineage. `toConfirm: true` means the
     * layout has not been checked against a real artifact yet — the
     * extractor treats any mismatch as a hard error, never a guess.
     */
    expectedColumns: z.strictObject({
      toConfirm: z.boolean(),
      names: z.array(z.string().min(1)).min(1),
    }),
    notes: z.string().min(1),
  })
  .superRefine((m, ctx) => {
    const r = m.retrieval;
    if (r.status === "retrieved") {
      if (!r.sha256 || !r.artifactFilename || !r.retrievedAt || !r.url) {
        ctx.addIssue({
          code: "custom",
          message:
            'retrieval.status "retrieved" requires artifactFilename, url, retrievedAt and sha256 to be pinned',
          path: ["retrieval"],
        });
      }
    } else if (r.sha256 !== null || r.artifactFilename !== null || r.retrievedAt !== null || r.url !== null) {
      ctx.addIssue({
        code: "custom",
        message:
          'retrieval.status "not-retrieved" must not carry artifact fields — pin them together with status "retrieved"',
        path: ["retrieval"],
      });
    }
  });
export type SourceManifest = z.infer<typeof SourceManifestSchema>;

/**
 * content/fr/pedagogy/concepts.json — the Phase 5B pedagogy-concept model.
 * A concept is Continue-only teaching content rendered by the generic
 * ConceptStep: it never grades, never touches FSRS/wordStats/XP, and is
 * clean-room authored (facts with sourceRefs; no copied prose).
 */
export const ConceptExampleSchema = z.strictObject({
  fr: z.string().min(1),
  en: z.string().min(1),
  /** Optional gloss/why line shown under the pair. */
  note: z.string().min(1).optional(),
});

export const ConceptSchema = z.strictObject({
  id: conceptId,
  /** Learner-facing title (no CEFR labels — program rule). */
  title: z.string().min(1),
  /** One-line memorable rule, honest wording ("usually", "very often"). */
  shortRule: z.string().min(1),
  /** A few sentences of plain-language explanation. */
  explanation: z.string().min(1),
  examples: z.array(ConceptExampleSchema).min(1),
  /** Honest exceptions/limits of the rule (may be empty, never hidden). */
  exceptions: z.array(z.string().min(1)),
  memoryHint: z.string().min(1).optional(),
  /** Registered sources backing the FACTS (data stats, references). */
  sourceRefs: z
    .array(z.strictObject({ source: z.string().min(1), key: z.string().min(1).optional() }))
    .min(1),
});
export type Concept = z.infer<typeof ConceptSchema>;

export const PedagogyConceptsSchema = z.strictObject({
  version: z.literal(1),
  language: z.literal("fr"),
  concepts: z.array(ConceptSchema),
});
export type PedagogyConcepts = z.infer<typeof PedagogyConceptsSchema>;

/**
 * content/fr/lexicon/match-overrides.json — the §15 manual-disposition
 * channel for lexemes the strict matcher leaves unmatched. Every override
 * names the exact source row it adopts and the human justification; the
 * validator additionally requires the override to reference a row that
 * really exists in the committed evidence subset for that lexeme, and
 * rejects overrides for lexemes the matcher already resolves (or that are
 * never matchable, i.e. expressions). Silent correction stays impossible.
 */
export const MatchOverridesSchema = z.strictObject({
  version: z.literal(1),
  overrides: z.array(
    z.strictObject({
      id: lexemeId,
      /** Mot|Cgram|Genre|Nombre of the adopted source row. */
      matchKey: z.string().min(1),
      justification: z.string().min(20),
    })
  ),
});
export type MatchOverrides = z.infer<typeof MatchOverridesSchema>;

const LICENSE_ALLOWLIST = [
  "MIT",
  "Apache-2.0",
  "CC-BY-4.0",
  "CC-BY-SA-4.0",
  "CC-BY-2.0-FR",
  "CC0-1.0",
  "original",
] as const;
export const ALLOWED_LICENSES: readonly string[] = LICENSE_ALLOWLIST;

/**
 * content/sources/registry.json — provenance registry. Every content/audio
 * path must be covered by a registered source with an allowlisted license;
 * a source whose exact redistribution terms are ambiguous cannot be
 * registered, so its data cannot be ingested. That is the gate, by design.
 */
export const SourceRegistrySchema = z.strictObject({
  sources: z
    .array(
      z.strictObject({
        id,
        name: z.string().min(1),
        kind: z.string().min(1),
        license: z.enum(LICENSE_ALLOWLIST),
        url: z.string().min(1),
        attribution: z.string().min(1),
        retrievedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        covers: z.array(z.string().min(1)).min(1),
        notes: z.string().optional(),
      })
    )
    .min(1),
});
export type SourceRegistry = z.infer<typeof SourceRegistrySchema>;

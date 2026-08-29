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

/**
 * Stable course-objective id, e.g. "fr.obj.gender.articles_basic" — a
 * long-lived content identity (§20), never derived from titles.
 */
export const objectiveId = z.string().regex(/^fr\.obj\.[a-z0-9_]+\.[a-z0-9_]+$/);

/**
 * Course-objective assessment/practice targets (§29-31). AUTHORED metadata,
 * orthogonal to compiler-emitted `gradeTargets`: gradeTargets is lexical
 * FSRS identity; objectiveTargets is curriculum/assessment meaning. The two
 * systems are never conflated.
 */
const objectiveTargets = z.array(objectiveId).min(1).optional();

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
  objectiveTargets,
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
  objectiveTargets,
});

export const MatchExerciseSchema = z.strictObject({
  type: z.literal("match"),
  id,
  pairs: z
    .array(z.strictObject({ target: z.string().min(1), native: z.string().min(1) }))
    .min(2),
  gradeTargets,
  objectiveTargets,
});

export const TypeAnswerExerciseSchema = z.strictObject({
  type: z.literal("typeAnswer"),
  id,
  /**
   * translate = target prompt, native answer; listen = audio, target
   * answer; produceTarget = native/digit prompt, TARGET-language answer
   * (Phase 5B §76 — the numbers unit's typed production drills).
   */
  mode: z.enum(["translate", "listen", "produceTarget"]),
  prompt: z.string(),
  audioTarget: z.string().min(1).optional(),
  answer: z.string().min(1),
  alternatives: z.array(z.string()),
  gradeTargets,
  objectiveTargets,
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
  objectiveTargets,
});

export const CONJUGATION_CELLS = [
  "inf",
  "pre:1s",
  "pre:2s",
  "pre:3s",
  "pre:1p",
  "pre:2p",
  "pre:3p",
  "participle",
] as const;
export type ConjugationCell = (typeof CONJUGATION_CELLS)[number];

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
  objectiveTargets,
});

/**
 * Typed conjugation production (Phase 5B §64–66). The expected answer is
 * the named verb's authored cell (validated against the conjugation tables
 * and, through them, the Lexique 4 morphology evidence). No gradeTargets
 * by design — grammar production is practice evidence, never lexical FSRS
 * (§67). Grading is STRICT: accents and exact inflection matter.
 */
export const ConjugationClozeExerciseSchema = z.strictObject({
  type: z.literal("conjugationCloze"),
  id,
  /** Sentence with ___ where the conjugated form goes. */
  sentence: z.string().min(1),
  translation: z.string().min(1),
  /** Infinitive lemma of the drilled verb (shown as the hint). */
  verb: z.string().min(1),
  cell: z.enum(CONJUGATION_CELLS),
  answer: z.string().min(1),
  /** Documented acceptable variants only — never meaning-changing endings. */
  alternatives: z.array(z.string().min(1)),
  objectiveTargets,
});

/**
 * Listening comprehension (Phase 7 §61): bundled deterministic clip +
 * meaning question. Transcript never rendered before the answer. No
 * gradeTargets by design (P7 §75).
 */
export const ListeningComprehensionExerciseSchema = z.strictObject({
  type: z.literal("listeningComprehension"),
  id,
  clipId: z.string().regex(/^fr\.clip\.[a-z0-9_]+$/),
  question: z.string().min(1),
  options: z.array(z.strictObject({ text: z.string().min(1) })).min(2),
  correct: z.number().int().min(0),
  objectiveTargets,
});

/** Reading comprehension (Phase 7 §62): passage + meaning question. */
export const ReadingComprehensionExerciseSchema = z.strictObject({
  type: z.literal("readingComprehension"),
  id,
  readingId: z.string().regex(/^fr\.read\.[a-z0-9_]+$/),
  question: z.string().min(1),
  options: z.array(z.strictObject({ text: z.string().min(1) })).min(2),
  correct: z.number().int().min(0),
  objectiveTargets,
});

/**
 * Dictation (Phase 7 §63): hear a bundled clip, type it. Strict grading
 * (orthographic decoding is the construct); no gradeTargets by design.
 */
export const DictationExerciseSchema = z.strictObject({
  type: z.literal("dictation"),
  id,
  clipId: z.string().regex(/^fr\.clip\.[a-z0-9_]+$/),
  answer: z.string().min(1),
  alternatives: z.array(z.string().min(1)),
  objectiveTargets,
});

export const ExerciseSchema = z.discriminatedUnion("type", [
  SelectExerciseSchema,
  WordBankExerciseSchema,
  MatchExerciseSchema,
  TypeAnswerExerciseSchema,
  FillBlankExerciseSchema,
  ArticleSelectExerciseSchema,
  ConjugationClozeExerciseSchema,
  ListeningComprehensionExerciseSchema,
  ReadingComprehensionExerciseSchema,
  DictationExerciseSchema,
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
  /**
   * Course objectives this lesson teaches (§27). Required for every French
   * lesson by validation; forbidden outside fr-en (§153) — other courses
   * carry no CEFR/objective metadata.
   */
  objectives: z.array(objectiveId).min(1).optional(),
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

export const TOPIC_VALUES = [
  "people",
  "greetings",
  "food",
  "animals",
  "travel",
  "everyday",
  "ideas",
  // Phase 7 (Section 3 receptive vocabulary domains)
  "places",
  "shopping",
  "time",
] as const;
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
  /** Course objectives this concept teaches toward (§28). */
  objectives: z.array(objectiveId).min(1).optional(),
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
 * content/fr/pedagogy/conjugations.json — authored conjugation tables for
 * the High-Yield Verbs unit (Phase 5B §60–68). Scope: présent, past
 * participle (passé composé), infinitive (futur proche). AUTHORED cells,
 * each machine-verified against the committed Lexique 4 verb-morphology
 * evidence (the §26 consumption contract: never blind extraction).
 */
export const ConjugatedVerbSchema = z.strictObject({
  /** Infinitive lemma, e.g. "être". */
  lemma: z.string().min(1),
  english: z.string().min(1),
  /** "er-regular" drives the pattern lesson; "irregular" is taught by table. */
  group: z.enum(["er-regular", "irregular"]),
  /** Passé-composé auxiliary for this verb. */
  auxiliary: z.enum(["avoir", "être"]),
  cells: z.record(z.enum(CONJUGATION_CELLS), z.string().min(1)),
});
export type ConjugatedVerb = z.infer<typeof ConjugatedVerbSchema>;

export const ConjugationsSchema = z.strictObject({
  version: z.literal(1),
  language: z.literal("fr"),
  verbs: z.array(ConjugatedVerbSchema).min(1),
});
export type Conjugations = z.infer<typeof ConjugationsSchema>;

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

// ---------------------------------------------------------------------------
// Phase 6: course objectives, CEFR alignment, assessment (§17-22, §98-103)
// ---------------------------------------------------------------------------

export const OBJECTIVE_CATEGORIES = [
  "lexical",
  "grammar",
  "spoken_reception",
  "written_reception",
  "spoken_production",
  "written_production",
  "interaction",
  "phonology",
  "strategy",
] as const;
export type ObjectiveCategory = (typeof OBJECTIVE_CATEGORIES)[number];

export const CEFR_LEVELS = ["PRE_A1", "A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

/**
 * One CEFR alignment (§18). `direct` means the objective closely represents
 * the communicative ability the referenced scale describes at that level;
 * `supports` means the objective develops linguistic resources that support
 * it. When in doubt the mapping MUST be `supports` (§166) — overclaiming is
 * the failure mode this schema exists to prevent. `sourceRef` names the
 * official reference (registered in assessment RESEARCH.md), never quoted
 * descriptor text.
 */
export const CefrAlignmentSchema = z.strictObject({
  level: z.enum(CEFR_LEVELS),
  scaleName: z.string().min(1),
  relation: z.enum(["direct", "supports"]),
  sourceRef: z.string().min(1),
});
export type CefrAlignment = z.infer<typeof CefrAlignmentSchema>;

/**
 * An app-owned course objective (§17). `canDo` is ORIGINAL app wording in
 * learner-friendly can-do form — official CEFR descriptor text is never
 * pasted (§141). `essential` marks objectives whose demonstration the
 * section checkpoints must cover (§64).
 */
export const CourseObjectiveSchema = z.strictObject({
  id: objectiveId,
  title: z.string().min(1),
  canDo: z.string().min(10),
  category: z.enum(OBJECTIVE_CATEGORIES),
  prerequisites: z.array(objectiveId),
  cefrAlignments: z.array(CefrAlignmentSchema).min(1),
  essential: z.boolean(),
  /** Honest evidence limitation shown to reviewers/reports (optional). */
  evidenceNote: z.string().optional(),
});
export type CourseObjective = z.infer<typeof CourseObjectiveSchema>;

export const CourseObjectivesSchema = z.strictObject({
  version: z.literal(1),
  language: z.literal("fr"),
  objectives: z.array(CourseObjectiveSchema).min(1),
});
export type CourseObjectives = z.infer<typeof CourseObjectivesSchema>;

/**
 * Claim policy (§98-103): the data half of the overall-level claim gate.
 * A level is claimable only when every `requiredDomains` entry has at least
 * `minAssessedObjectivesPerDomain` objectives that (a) belong to that
 * activity domain, (b) carry a DIRECT alignment at the level, and (c) have
 * real checkpoint assessment coverage. Vocabulary counts and lesson counts
 * are deliberately not inputs (§100-101).
 */
export const ClaimPolicySchema = z.strictObject({
  version: z.literal(2),
  /** Levels the product evaluates claims for (higher levels implicitly false). */
  evaluatedLevels: z.array(z.enum(CEFR_LEVELS)).min(1),
  /**
   * The communicative-activity domains an overall claim requires at every
   * evaluated level. Uses objective categories restricted to activity-like
   * domains (reception/production/interaction) — competences (lexical,
   * grammar, phonology, strategy) support but never substitute (§8).
   */
  requiredDomains: z.array(z.enum(OBJECTIVE_CATEGORIES)).min(1),
  minAssessedObjectivesPerDomain: z.number().int().min(1),
  /**
   * Phase-7 breadth thresholds (P7 §10-14). All of these are INTERNAL
   * evidence-sufficiency rules — product-local, never Council of Europe cut
   * scores (P7 §12). A domain "covers" a level only when its direct
   * objectives clear every one of them.
   */
  /** Scored items each direct objective needs before it counts as assessed. */
  minItemsPerDirectObjective: z.number().int().min(1),
  /**
   * Independent source inputs (distinct clips/texts; a standalone item is
   * its own input) each direct objective's evidence must span — three
   * questions about one clip are one input (P7 §13).
   */
  minDistinctInputsPerDirectObjective: z.number().int().min(1),
  /** Distinct task families across a domain's assessed direct objectives. */
  minTaskFamiliesPerDomain: z.number().int().min(1),
  /** Distinct aligned CEFR scale families among those direct objectives. */
  minDistinctScalesPerDomain: z.number().int().min(1),
  /** Wording rule: even a claimable level is an aligned estimate (§102). */
  claimWording: z.string().min(1),
});
export type ClaimPolicy = z.infer<typeof ClaimPolicySchema>;

// ---------------------------------------------------------------------------
// Phase 6: checkpoint assessment banks (§49-66, §121-123)
// ---------------------------------------------------------------------------

export const checkpointId = z.string().regex(/^fr\.checkpoint\.[a-z0-9-]+$/);
export const assessmentItemId = z.string().regex(/^fr\.cpi\.[a-z0-9_.-]+$/);

/**
 * One original checkpoint item (§51, §53): a standard exercise payload plus
 * REQUIRED objective mapping. Authored content — gradeTargets never appears
 * (checkpoints don't touch lexical FSRS), and item ids/versions are stable
 * so stored attempts stay interpretable (§66, §123).
 */
export const CheckpointItemSchema = z.strictObject({
  id: assessmentItemId,
  itemVersion: z.number().int().min(1),
  exercise: ExerciseSchema,
  objectiveTargets: z.array(objectiveId).min(1),
  /** Items assessing an essential objective the blueprint counts on. */
  essential: z.boolean(),
});
export type CheckpointItem = z.infer<typeof CheckpointItemSchema>;

/**
 * Product-local demonstration criteria (§62-63): NOT official CEFR cut
 * scores — documented course diagnostics. An objective is `demonstrated`
 * in an attempt when it has ≥ minItemsPerObjective scored items AND the
 * correct share is ≥ demonstratedShare; with fewer items the result is
 * `insufficient_evidence`; otherwise `needs_practice`.
 */
export const CheckpointCriteriaSchema = z.strictObject({
  minItemsPerObjective: z.number().int().min(2),
  demonstratedShare: z.number().min(0.5).max(1),
});

export const CheckpointSchema = z.strictObject({
  id: checkpointId,
  /** Bump when items/criteria change meaning (§66). */
  checkpointVersion: z.number().int().min(1),
  /** The PATH section whose completion unlocks this checkpoint. */
  sectionId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  items: z.array(CheckpointItemSchema).min(1),
  criteria: CheckpointCriteriaSchema,
});
export type Checkpoint = z.infer<typeof CheckpointSchema>;

export const CheckpointsSchema = z.strictObject({
  version: z.literal(1),
  language: z.literal("fr"),
  checkpoints: z.array(CheckpointSchema).min(1),
});
export type Checkpoints = z.infer<typeof CheckpointsSchema>;

// ---------------------------------------------------------------------------
// Phase 6: placement diagnostic (§67-80, §121-123)
// ---------------------------------------------------------------------------

export const placementStageId = z.string().regex(/^fr\.pstage\.[a-z0-9_]+$/);
export const placementClusterId = z.string().regex(/^fr\.pcluster\.[a-z0-9_]+$/);
export const placementItemId = z.string().regex(/^fr\.pli\.[a-z0-9_.-]+$/);

export const PlacementItemSchema = z.strictObject({
  id: placementItemId,
  itemVersion: z.number().int().min(1),
  exercise: ExerciseSchema,
  objectiveTargets: z.array(objectiveId).min(1),
});
export type PlacementItem = z.infer<typeof PlacementItemSchema>;

/**
 * One curriculum-area probe (§74): a cluster maps to one objective and one
 * ANCHOR lesson — the recommendation for a learner whose earliest gap is
 * this cluster (§75). Cluster order inside a stage must follow curriculum
 * order (validated), so "earliest weak cluster" is well-defined.
 */
export const PlacementClusterSchema = z.strictObject({
  id: placementClusterId,
  objectiveId,
  anchorLessonId: z.string().min(1),
  items: z.array(PlacementItemSchema).min(1).max(3),
});
export type PlacementCluster = z.infer<typeof PlacementClusterSchema>;

export const PlacementStageSchema = z.strictObject({
  id: placementStageId,
  title: z.string().min(1),
  clusters: z.array(PlacementClusterSchema).min(1),
});
export type PlacementStage = z.infer<typeof PlacementStageSchema>;

/**
 * The staged deterministic diagnostic (§73): stage 2 runs only when every
 * stage-1 cluster is comfortable. No IRT, no adaptivity beyond the stage
 * gate (§122). Item budget across all stages is validated ≤ maxItems.
 */
export const PlacementSchema = z.strictObject({
  version: z.literal(1),
  language: z.literal("fr"),
  placementVersion: z.number().int().min(1),
  maxItems: z.number().int().min(1).max(22),
  /** Recommendation when every probed cluster is comfortable. */
  allComfortableLessonId: z.string().min(1),
  stages: z.array(PlacementStageSchema).min(1),
});
export type PlacementContent = z.infer<typeof PlacementSchema>;

// ---------------------------------------------------------------------------
// Phase 7: reception sources (P7 §43-49)
// ---------------------------------------------------------------------------

export const readingIdSchema = z.string().regex(/^fr\.read\.[a-z0-9_]+$/);
export const clipIdSchema = z.string().regex(/^fr\.clip\.[a-z0-9_]+$/);

export const READING_KINDS = [
  "notice",
  "message",
  "dialogue",
  "description",
  "directions",
  "info",
  "narrative",
] as const;

export const LISTENING_KINDS = [
  "word_phrase",
  "announcement",
  "instruction",
  "message",
  "dialogue",
  "factual",
] as const;

/**
 * Authoring difficulty variables (P7 §8): DESIGN CONTROLS recorded per
 * input, never psychometrically calibrated scores (§119).
 */
export const ReceptionAuthoringSpecSchema = z.strictObject({
  informationUnits: z.number().int().min(1).max(6),
  inferenceDemand: z.enum(["locate", "basic_inference"]),
  lexicalNotes: z.string().optional(),
});

/** Reading content blocks: paragraphs, or speaker-labeled dialogue lines. */
export const ReadingBlockSchema = z.union([
  z.strictObject({ kind: z.literal("paragraph"), text: z.string().min(1) }),
  z.strictObject({
    kind: z.literal("line"),
    speaker: z.string().min(1),
    text: z.string().min(1),
  }),
]);

export const ReadingSourceSchema = z.strictObject({
  id: readingIdSchema,
  kind: z.enum(READING_KINDS),
  title: z.string().min(1).optional(),
  blocks: z.array(ReadingBlockSchema).min(1).max(10),
  objectiveRefs: z.array(objectiveId).min(1),
  /** Course lexemes the text leans on (coverage QA, not grading). */
  lexemeRefs: z.array(z.string().regex(/^fr:w:[a-z0-9-]+$/)),
  /** Learning-mode-only glosses for the small supported-unknown load. */
  supportGlossary: z.array(
    z.strictObject({ surface: z.string().min(1), gloss: z.string().min(1) })
  ),
  sourceRef: z.literal("original-project"),
  authoringSpec: ReceptionAuthoringSpecSchema,
});
export type ReadingSource = z.infer<typeof ReadingSourceSchema>;

export const ReadingsSchema = z.strictObject({
  version: z.literal(1),
  language: z.literal("fr"),
  readings: z.array(ReadingSourceSchema).min(1),
});
export type Readings = z.infer<typeof ReadingsSchema>;

/**
 * A listening clip is one or more speaker-labeled segments synthesized with
 * the pinned voice cast and concatenated deterministically at generation
 * time — the segments ARE the single authoritative transcript (P7 §40).
 */
export const ListeningSegmentSchema = z.strictObject({
  speaker: z.enum(["A", "B"]),
  text: z.string().min(1),
});

export const ListeningClipSchema = z.strictObject({
  id: clipIdSchema,
  kind: z.enum(LISTENING_KINDS),
  segments: z.array(ListeningSegmentSchema).min(1).max(4),
  objectiveRefs: z.array(objectiveId).min(1),
  lexemeRefs: z.array(z.string().regex(/^fr:w:[a-z0-9-]+$/)),
  sourceRef: z.literal("original-project"),
  authoringSpec: ReceptionAuthoringSpecSchema,
  /** Scored sessions: normal rate only, bounded deliberate plays (P7 §23, §67). */
  scoredPlaybackPolicy: z.strictObject({
    maxPlays: z.number().int().min(1).max(3),
    rate: z.literal(1),
  }),
});
export type ListeningClip = z.infer<typeof ListeningClipSchema>;

export const ListeningSchema = z.strictObject({
  version: z.literal(1),
  language: z.literal("fr"),
  /**
   * The pinned voice cast (P7 §59): stable speaker letters map to concrete
   * pinned voices/speaker ids in ONE place, so a re-generation can never
   * silently reshuffle who speaks.
   */
  voiceCast: z.strictObject({
    A: z.strictObject({ voiceId: z.string().min(1), speaker: z.number().int().nullable() }),
    B: z.strictObject({ voiceId: z.string().min(1), speaker: z.number().int().nullable() }),
  }),
  clips: z.array(ListeningClipSchema).min(1),
});
export type Listening = z.infer<typeof ListeningSchema>;

/**
 * Content schemas — the validation source of truth for content/courses/
 * and content/<target>/** (P1c: parameterised by TARGET language).
 * Mirrors src/lib/types.ts for the pack shapes (that file's header has
 * pointed here since the original, unpublished pipeline). Strict objects:
 * an unknown field in source content is a typo until proven otherwise.
 *
 * Three conventions make the schema language-neutral:
 *  - every content id is namespaced by its target language and built by a
 *    FACTORY (`lexemeId(lang)`, `objectiveId(lang)`, `clipId(lang)`, …);
 *    the language-agnostic variants (`ANY_LANGUAGE`) accept any code and
 *    the validators cross-check the prefix against the pack's targetCode;
 *  - every NATIVE-language string (glosses, translations, instructions,
 *    can-do statements, …) is a `Record<nativeCode, string>` so several
 *    courses can share one target corpus; the compiler emits the per-course
 *    native text by the pack's nativeCode (artifacts stay plain strings);
 *  - the grammar-table shape is generic (`ParadigmTableSchema`) with the
 *    cell ids declared by the build-time language plugin.
 *
 * `gradeTargets` is emitted by the compiler (never authored): the stable
 * lexeme ids an exercise unambiguously assesses. Phase 2 only emits it where
 * ambiguity is zero; the runtime keeps its conservative interim rule.
 */

import { z } from "zod";

const id = z.string().min(1);

/* ------------------------------------------------------------------ */
/* Language codes and id factories                                     */
/* ------------------------------------------------------------------ */

/** ISO 639-1/-3 lowercase code: "fr", "vi", "xx" (the synthetic test language). */
export const LANGUAGE_CODE_PATTERN = "[a-z]{2,3}";
export const languageCode = z.string().regex(new RegExp(`^${LANGUAGE_CODE_PATTERN}$`));

/** Pass this to an id factory to accept ANY language's ids (pack-level schemas). */
export const ANY_LANGUAGE = "*";

function langPattern(lang: string): string {
  if (lang === ANY_LANGUAGE) return LANGUAGE_CODE_PATTERN;
  if (!new RegExp(`^${LANGUAGE_CODE_PATTERN}$`).test(lang)) {
    throw new Error(`not a language code: "${lang}"`);
  }
  return lang;
}

/** Regex source for a namespaced id, e.g. idPattern("fr", "\\.clip\\.", "[a-z0-9_]+"). */
export function idPattern(lang: string, separator: string, slug: string): RegExp {
  return new RegExp(`^${langPattern(lang)}${separator}${slug}$`);
}

/** Frozen lexeme id `<lang>:w:<slug>` — persisted in learner data, never renamed. */
export const lexemeId = (lang: string) => z.string().regex(idPattern(lang, ":w:", "[a-z0-9-]+"));
/** Stable course-objective id `<lang>.obj.<area>.<slug>` (§20) — never derived from titles. */
export const objectiveId = (lang: string) =>
  z.string().regex(idPattern(lang, "\\.obj\\.", "[a-z0-9_]+\\.[a-z0-9_]+"));
/** Stable pedagogy-concept id `<lang>:concept:<slug>`. */
export const conceptId = (lang: string) =>
  z.string().regex(idPattern(lang, ":concept:", "[a-z0-9]+(?:-[a-z0-9]+)*"));
export const clipId = (lang: string) => z.string().regex(idPattern(lang, "\\.clip\\.", "[a-z0-9_]+"));
export const readingId = (lang: string) => z.string().regex(idPattern(lang, "\\.read\\.", "[a-z0-9_]+"));
/** Graded story id `<lang>.story.<slug>` (P5b). */
export const storyId = (lang: string) => z.string().regex(idPattern(lang, "\\.story\\.", "[a-z0-9_]+"));
export const speechItemId = (lang: string) => z.string().regex(idPattern(lang, "\\.speak\\.", "[a-z0-9_]+"));
export const writingTaskId = (lang: string) => z.string().regex(idPattern(lang, "\\.write\\.", "[a-z0-9_]+"));
export const scenarioId = (lang: string) => z.string().regex(idPattern(lang, "\\.scenario\\.", "[a-z0-9_]+"));
export const checkpointId = (lang: string) => z.string().regex(idPattern(lang, "\\.checkpoint\\.", "[a-z0-9-]+"));
export const assessmentItemId = (lang: string) => z.string().regex(idPattern(lang, "\\.cpi\\.", "[a-z0-9_.-]+"));
export const placementStageId = (lang: string) => z.string().regex(idPattern(lang, "\\.pstage\\.", "[a-z0-9_]+"));
export const placementClusterId = (lang: string) => z.string().regex(idPattern(lang, "\\.pcluster\\.", "[a-z0-9_]+"));
export const placementItemId = (lang: string) => z.string().regex(idPattern(lang, "\\.pli\\.", "[a-z0-9_.-]+"));

/** The language code an id is namespaced under ("fr.clip.x" → "fr", "fr:w:x" → "fr"). */
export function idLanguage(contentId: string): string | undefined {
  const m = /^([a-z]{2,3})[.:]/.exec(contentId);
  return m?.[1];
}

/**
 * BCP-47 language tag (language[-script][-region]…): "fr-FR", "zh-Hans-CN",
 * "pt-BR". Deliberately permissive on subtags; the validator cross-checks
 * the value against the language plugin's locale.
 */
export const BCP47_PATTERN = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/;
export const recognitionLocale = z.string().regex(BCP47_PATTERN);

/* ------------------------------------------------------------------ */
/* Native-language text                                                */
/* ------------------------------------------------------------------ */

/**
 * Native-language text keyed by native code (`{ en: "…", vi: "…" }`). At
 * least one entry; the validator additionally requires every nativeCode
 * used by a course of the target language. `min` is the per-value length
 * floor (can-do statements, slot descriptions).
 */
export function nativeText(min = 1) {
  return z
    .record(languageCode, z.string().min(min))
    .refine((r) => Object.keys(r).length > 0, { message: "at least one native-language entry" });
}
export type NativeText = Record<string, string>;

/** A cue fact: native-language label, verbatim value (names, numbers, places). */
export const CueFactSourceSchema = z.strictObject({ label: nativeText(), value: z.string().min(1) });

/* ------------------------------------------------------------------ */
/* Course packs (per course: ONE native language, plain strings)       */
/* ------------------------------------------------------------------ */

export const WordSchema = z.strictObject({
  target: z.string().min(1),
  native: z.string().min(1),
  emoji: z.string().min(1),
  romanization: z.string().min(1).optional(),
});

const gradeTargets = z.array(z.string().min(1)).min(1).optional();

/**
 * Course-objective assessment/practice targets (§29-31). AUTHORED metadata,
 * orthogonal to compiler-emitted `gradeTargets`: gradeTargets is lexical
 * FSRS identity; objectiveTargets is curriculum/assessment meaning. The two
 * systems are never conflated.
 */
const objectiveTargetsFor = (lang: string) => z.array(objectiveId(lang)).min(1).optional();

export const PACK_AUDIO_POLICIES = ["bundled", "device-tts", "test-only"] as const;

/**
 * Written-production rubric (P9 §16): every check the deterministic local
 * engine is allowed to make is authored here — nothing is inferred at
 * runtime beyond these rules. `writingRubricSchema(descriptions)` builds the
 * SOURCE shape (native-text slot descriptions) and the PACK shape (plain
 * strings, one native language) from the same definition.
 */
function writingSlotSchema<D extends z.ZodTypeAny>(description: D) {
  return z.strictObject({
    id: z.string().regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/),
    /** Learner-facing description used in missing-slot feedback. */
    description,
    /** Accepted target-language realizations; contiguous-run matched after folding. */
    variants: z.array(z.string().min(1)).min(1),
    /**
     * True when the slot's content is handed to the learner as a cue fact
     * (e.g. the city they should say they live in) — such variants may
     * legitimately appear inside instruction/cues; un-cued slot variants
     * appearing there are an answer leak and fail validation.
     */
    cueProvided: z.boolean(),
  });
}

function writingRubricSchema<D extends z.ZodTypeAny>(description: D) {
  return z.strictObject({
    requiredSlots: z.array(writingSlotSchema(description)).min(1),
    /** Minimum meaningful length in tokens (anti "oui" answers). */
    minTokens: z.number().int().min(2).max(40),
    /** Maximum sensible length (anti keyword-stuffed paste). */
    maxTokens: z.number().int().min(6).max(120),
    /**
     * When present, at least one of these conjugated forms must appear —
     * the task demands a real clause, checked ONLY against this authored
     * allowlist (the engine never invents grammar judgment, §18).
     */
    requireSentenceVerbs: z.array(z.string().min(1)).min(1).optional(),
  });
}

/** Pack/exercise rubric: plain strings (the course's one native language). */
export const WritingSlotSchema = writingSlotSchema(z.string().min(3));
export const WritingRubricSchema = writingRubricSchema(z.string().min(3));
/** Source rubric (content/<lang>/writing/tasks.json): native-text descriptions. */
export const WritingRubricSourceSchema = writingRubricSchema(nativeText(3));
export type WritingRubricSource = z.infer<typeof WritingRubricSourceSchema>;

/**
 * Every exercise schema, namespaced ids resolved for `lang` (ANY_LANGUAGE
 * for packs — the pack validator cross-checks the prefixes; the target's
 * own code for assessment banks).
 */
export function exerciseSchemas(lang: string) {
  const objectiveTargets = objectiveTargetsFor(lang);
  const SelectExerciseSchema = z.strictObject({
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

  const WordBankExerciseSchema = z.strictObject({
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

  const MatchExerciseSchema = z.strictObject({
    type: z.literal("match"),
    id,
    pairs: z
      .array(z.strictObject({ target: z.string().min(1), native: z.string().min(1) }))
      .min(2),
    gradeTargets,
    objectiveTargets,
  });

  const TypeAnswerExerciseSchema = z.strictObject({
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

  const FillBlankExerciseSchema = z.strictObject({
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

  /**
   * Grammar drill (Phase 5B §54–58): pick the right article for a noun. By
   * DESIGN this schema has no gradeTargets field — grammar answers are
   * practice evidence and must never mutate a lexical recognize card; the
   * strict object makes that structural, not conventional. Elision safety
   * (§57) is the language plugin's rule (validated).
   */
  const ArticleSelectExerciseSchema = z.strictObject({
    type: z.literal("articleSelect"),
    id,
    /** The article choices, e.g. ["le","la"] or ["un","une"]. */
    articles: z.array(z.string().min(1)).min(2),
    /** The noun WITHOUT its article, exactly as it should follow it. */
    noun: z.string().min(1),
    /** Native-language gloss shown under the noun. */
    gloss: z.string().min(1),
    correct: z.number().int().min(0),
    audioTarget: z.string().min(1).optional(),
    objectiveTargets,
  });

  /**
   * Typed conjugation production (Phase 5B §64–66). The expected answer is
   * the named verb's authored paradigm cell (validated against the tables
   * and, through them, the registered morphology evidence). No gradeTargets
   * by design — grammar production is practice evidence, never lexical FSRS
   * (§67). Grading is STRICT: accents and exact inflection matter. The cell
   * id vocabulary is the language plugin's.
   */
  const ConjugationClozeExerciseSchema = z.strictObject({
    type: z.literal("conjugationCloze"),
    id,
    /** Sentence with ___ where the conjugated form goes. */
    sentence: z.string().min(1),
    translation: z.string().min(1),
    /** Infinitive lemma of the drilled verb (shown as the hint). */
    verb: z.string().min(1),
    cell: z.string().regex(/^[a-z]+(?::[a-z0-9]+)*$/),
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
  const ListeningComprehensionExerciseSchema = z.strictObject({
    type: z.literal("listeningComprehension"),
    id,
    clipId: clipId(lang),
    question: z.string().min(1),
    /** P3e: an option may be a picture (emoji tile rendered by the OS emoji font; no bundled asset). */
    options: z.array(z.strictObject({ text: z.string().min(1), emoji: z.string().min(1).optional() })).min(2),
    correct: z.number().int().min(0),
    objectiveTargets,
  });

  /** Reading comprehension (Phase 7 §62): passage + meaning question. */
  const ReadingComprehensionExerciseSchema = z.strictObject({
    type: z.literal("readingComprehension"),
    id,
    readingId: readingId(lang),
    question: z.string().min(1),
    /** P3e: an option may be a picture (emoji tile rendered by the OS emoji font; no bundled asset). */
    options: z.array(z.strictObject({ text: z.string().min(1), emoji: z.string().min(1).optional() })).min(2),
    correct: z.number().int().min(0),
    objectiveTargets,
  });

  /**
   * Dictation (Phase 7 §63): hear a bundled clip, type it. Strict grading
   * (orthographic decoding is the construct); no gradeTargets by design.
   */
  const DictationExerciseSchema = z.strictObject({
    type: z.literal("dictation"),
    id,
    clipId: clipId(lang),
    answer: z.string().min(1),
    alternatives: z.array(z.string().min(1)),
    objectiveTargets,
  });

  /**
   * Speak-after-the-model PRACTICE (P8 §11): the model clip is the stimulus,
   * the target text is visible, and the recognized transcript is feedback
   * only — NEVER spoken-production evidence. Grading fields are embedded
   * from the referenced speech item; the speech validator enforces
   * byte-equality.
   */
  const SpeakRepetitionExerciseSchema = z.strictObject({
    type: z.literal("speakRepetition"),
    id,
    speechItemId: speechItemId(lang),
    modelClipId: clipId(lang),
    target: z.string().min(1),
    acceptedVariants: z.array(z.string().min(1)).min(1),
    requiredConcepts: z.array(z.array(z.string().min(1)).min(1)).min(1).optional(),
    objectiveTargets,
  });

  /**
   * Elicited spoken PRODUCTION (P8 §11): a meaning-only cue (native-language
   * instruction, emoji, facts), the target never exposed before the
   * attempt, deterministic grading of what the recognizer heard.
   */
  const SpeakProductionExerciseSchema = z.strictObject({
    type: z.literal("speakProduction"),
    id,
    speechItemId: speechItemId(lang),
    instruction: z.string().min(1),
    cueEmoji: z.string().min(1).optional(),
    cueFacts: z
      .array(z.strictObject({ label: z.string().min(1), value: z.string().min(1) }))
      .min(1)
      .optional(),
    target: z.string().min(1),
    acceptedVariants: z.array(z.string().min(1)).min(1),
    requiredConcepts: z.array(z.array(z.string().min(1)).min(1)).min(1).optional(),
    /** Mirror of the item's evidenceLexemeRefs (P8 §15) — pipeline-checked. */
    evidenceLexemeRefs: z.array(lexemeId(lang)),
    /** Learning mode may reveal the target after N non-matching recordings. */
    revealTargetAfterAttempts: z.number().int().min(1).max(5).nullable(),
    allowContextualBias: z.boolean(),
    /** Learning-mode model answer, played only AFTER a graded attempt. */
    modelClipId: clipId(lang).nullable(),
    /** Scored recording attempts before the step must resolve. */
    allowedAttempts: z.number().int().min(1).max(3),
    objectiveTargets,
  });

  const GuidedWritingExerciseSchema = z.strictObject({
    type: z.literal("guidedWriting"),
    id,
    writingTaskId: writingTaskId(lang),
    /** "guided" is rubric-graded; "open" is practice-only, never evidence. */
    writingMode: z.enum(["guided", "open"]),
    instruction: z.string().min(1),
    /** Facts the learner must express (native labels; values may be names/numbers). */
    cueFacts: z
      .array(z.strictObject({ label: z.string().min(1), value: z.string().min(1) }))
      .min(1)
      .optional(),
    rubric: WritingRubricSchema,
    /** Shown only AFTER an attempt in learning mode; never pre-submission in scored. */
    modelAnswers: z.array(z.string().min(1)).min(1),
    objectiveTargets,
  });

  const SimpleFormExerciseSchema = z.strictObject({
    type: z.literal("simpleForm"),
    id,
    writingTaskId: writingTaskId(lang),
    instruction: z.string().min(1),
    /**
     * P3d: the cue card the instruction refers to ("the details on the
     * card"), native labels; mirrors the task's cueFacts when present.
     */
    cueFacts: z
      .array(z.strictObject({ label: z.string().min(1), value: z.string().min(1) }))
      .min(1)
      .optional(),
    /** Discrete labeled fields (target-language form labels); each checks against one rubric slot. */
    fields: z
      .array(
        z.strictObject({
          id: z.string().regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/),
          label: z.string().min(1),
          slotId: z.string().regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/),
        })
      )
      .min(2),
    rubric: WritingRubricSchema,
    modelAnswers: z.array(z.string().min(1)).min(1),
    objectiveTargets,
  });

  /**
   * A whole authored multi-turn scenario runs as ONE session step (P9 §32):
   * the exercise references the scenario by id; the graph itself lives in
   * the interaction source and its compiled artifact.
   */
  const InteractionScenarioExerciseSchema = z.strictObject({
    type: z.literal("interactionScenario"),
    id,
    scenarioId: scenarioId(lang),
    objectiveTargets,
  });

  const ExerciseSchema = z.discriminatedUnion("type", [
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
    SpeakRepetitionExerciseSchema,
    SpeakProductionExerciseSchema,
    GuidedWritingExerciseSchema,
    SimpleFormExerciseSchema,
    InteractionScenarioExerciseSchema,
  ]);

  return {
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
    SpeakRepetitionExerciseSchema,
    SpeakProductionExerciseSchema,
    GuidedWritingExerciseSchema,
    SimpleFormExerciseSchema,
    InteractionScenarioExerciseSchema,
    ExerciseSchema,
  };
}

const ANY_EXERCISES = exerciseSchemas(ANY_LANGUAGE);
export const {
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
  SpeakRepetitionExerciseSchema,
  SpeakProductionExerciseSchema,
  GuidedWritingExerciseSchema,
  SimpleFormExerciseSchema,
  InteractionScenarioExerciseSchema,
  ExerciseSchema,
} = ANY_EXERCISES;
export type Exercise = z.infer<typeof ExerciseSchema>;

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
  z.strictObject({ concept: conceptId(ANY_LANGUAGE) }),
  z.strictObject({ exercise: id }),
]);

export const LessonSchema = z.strictObject({
  id,
  title: z.string().min(1),
  exercises: z.array(ExerciseSchema).min(1),
  flow: z.array(LessonFlowEntrySchema).min(1).optional(),
  /**
   * Course objectives this lesson teaches (§27). Required for every lesson
   * of a course whose target language has an objectives source; forbidden
   * otherwise (§153) — such courses carry no CEFR/objective metadata.
   */
  objectives: z.array(objectiveId(ANY_LANGUAGE)).min(1).optional(),
  /**
   * P3e: "teaching" (default) lessons hold ≥ 5 exercises; a lesson that IS
   * one conversation or one form declares "scenario" / "form" and holds
   * exactly that exercise (scripts/lib/lesson-shape.ts).
   */
  lessonKind: z.enum(["teaching", "scenario", "form"]).optional(),
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

/**
 * Course audio policy (V1 publication program, Part II): "bundled" (the
 * default — every audioTarget resolves to a pipeline-generated MP3),
 * "device-tts" (no bundled audio; the runtime speaks through the device's
 * own text-to-speech voice because no license-clean voice exists for the
 * language) or "test-only" (P1c: the synthetic test language — generated
 * tones, never shipped; only valid on a `testOnly` pack). A reason is
 * mandatory for device-tts so the decision is on record next to the
 * content.
 */
export const PackAudioPolicySchema = z.strictObject({
  policy: z.enum(PACK_AUDIO_POLICIES),
  reason: z.string().min(20).optional(),
});

export const PackSchema = z.strictObject({
  id,
  version: z.number().int().min(1),
  targetLanguage: z.string().min(1),
  targetCode: languageCode,
  nativeLanguage: z.string().min(1),
  nativeCode: languageCode,
  flag: z.string().min(1),
  /**
   * P1c: a test-only course (the synthetic `xx` language) is compiled and
   * validated like any other but never reaches the app bundle, the catalog
   * or the audio baseline.
   */
  testOnly: z.boolean().optional(),
  /**
   * Legacy packs whose exercise ids predate the `<courseId>:<unit>-<lesson>-e<n>`
   * convention. Exercise ids are persisted in learner data (mistakes,
   * lesson history) so they are never rewritten; every other pack must
   * follow the convention (validated). New packs never set this.
   */
  frozenExerciseIds: z.boolean().optional(),
  audio: PackAudioPolicySchema.optional(),
  sections: z.array(SectionSchema).min(1),
});
export type PackSource = z.infer<typeof PackSchema>;

/** src/content/catalog.json — GENERATED from the packs since P1c (nativeCode included). */
export const CatalogSchema = z.strictObject({
  version: z.number().int().min(1),
  courses: z.array(
    z.strictObject({
      id,
      targetLanguage: z.string().min(1),
      targetCode: languageCode,
      nativeLanguage: z.string().min(1),
      nativeCode: languageCode,
      flag: z.string().min(1),
      unitCount: z.number().int().min(1),
      lessonCount: z.number().int().min(1),
    })
  ),
});

/**
 * content/courses/<id>.profile.json (P1b, optional): explicit capability
 * overrides layered on what the compiler derives from the course's
 * artifacts — e.g. `{ "enabled": { "fsrs": true } }` to move a legacy
 * course onto FSRS before it has a rich lexicon.
 */
export const CourseProfileOverrideSchema = z.strictObject({
  /**
   * P3c review gate: a course whose learner-facing text was authored or
   * translated (every course whose native language is not the original
   * English) compiles only when a native reviewer has signed it off here,
   * or when `allowUnreviewed` is set explicitly AND release/KNOWN_LIMITATIONS.md
   * names the course — so beta content ships honestly, never silently.
   */
  review: z.strictObject({ native: z.string().min(2), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), checklist: z.string().optional() }).optional(),
  allowUnreviewed: z.boolean().optional(),
  /**
   * P3e: a course authored before the lesson-shape rules (French) keeps its
   * lesson sizes and repeats byte-identical; every other course must pass
   * scripts/lib/lesson-shape.ts.
   */
  legacyLessonShapes: z.boolean().optional(),
  /**
   * P4a: an inherited upstream "basic pack" (5 units of the Lingo Lessons
   * template, English-only). Its word lists must not repeat across units,
   * and onboarding hides it once a `<target>-vi` course of the same target
   * is A1-claimable (it stays under "Other courses").
   */
  basicPack: z.boolean().optional(),
  /**
   * P3e §8: while no `review` is recorded, the app labels the course
   * "beta — content under review" (es-vi until the owner signs Tier-1 vi).
   * The label disappears by itself once `review` is added.
   */
  betaUntilReviewed: z.boolean().optional(),
  /**
   * P3d course role within its target (scripts/lib/course-roles.ts): omitted
   * = mirror of the primary (or the primary itself when its native code is
   * the smallest); "primary" = this course carries the target's rich layers
   * and reports; "standalone" = an independent course that shares only the
   * target's lexicon.
   */
  role: z.enum(["primary", "standalone"]).optional(),
  enabled: z
    .strictObject({
      fsrs: z.boolean().optional(),
      dailySession: z.boolean().optional(),
      lexicon: z.boolean().optional(),
      concepts: z.boolean().optional(),
      placement: z.boolean().optional(),
      checkpoints: z.boolean().optional(),
      goals: z.boolean().optional(),
      listening: z.boolean().optional(),
      reading: z.boolean().optional(),
      speaking: z.boolean().optional(),
      writing: z.boolean().optional(),
      conversation: z.boolean().optional(),
    })
    .optional(),
});

/** content/<lang>/lexemes.json: surface → stable lexeme id (<lang>:w:<slug>). */
export const lexemeMapSchema = (lang: string) => z.record(z.string().min(1), lexemeId(lang));
export const LexemeMapSchema = lexemeMapSchema(ANY_LANGUAGE);
/** @deprecated P1b name — the French map; prefer lexemeMapSchema("fr"). */
export const FrLexemeMapSchema = lexemeMapSchema("fr");

/* ------------------------------------------------------------------ */
/* Rich lexicon (content/<lang>/lexicon/)                              */
/* ------------------------------------------------------------------ */

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

export const GENDER_VALUES = ["masculine", "feminine", "neuter", "both", "unknown"] as const;
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
  // P3a (lexicon ETL v2: topic-balanced selection for the new target languages)
  "family",
  "home",
  "body",
  "clothing",
  "colors",
  "numbers",
  "weather",
  "nature",
  "work",
  "school",
  "feelings",
  "leisure",
  "technology",
] as const;
export type TopicValue = (typeof TOPIC_VALUES)[number];
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

/** One example sentence: target text + its translation per native code. */
export const LexemeExampleSchema = z.strictObject({
  target: z.string().min(1),
  translations: nativeText(),
  source: z.string().min(1),
  /** Source-side identity of the sentence (P3a: Tatoeba `spaId|engId`, kaikki `word|pos|sense`). */
  key: z.string().min(1).optional(),
});
export type LexemeExampleSource = z.infer<typeof LexemeExampleSchema>;

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

export const richLexemeSchema = (lang: string) =>
  z.strictObject({
    /** Frozen stable id — must equal the entry in content/<lang>/lexemes.json. */
    id: lexemeId(lang),
    /** The course-visible string, verbatim (articles included for nouns). */
    surface: z.string().min(1),
    /**
     * QC 2026-10-28: older course surfaces of this lexeme that learner data
     * may hold as keys (the inherited de-en pack teaches "Freund"; de-vi
     * teaches "der Freund"). The id registry maps them to this id; they are
     * never shown as the lexeme's surface and never a second lexeme.
     */
    legacySurfaces: z.array(z.string().min(1)).min(1).optional(),
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
    /** Native-language gloss per native code; byte-identical to the course word's `native`. */
    glosses: nativeText(),
    pronunciation: PronunciationSchema.optional(),
    frequency: LexemeFrequencySchema.optional(),
    topic: z.enum(TOPIC_VALUES).optional(),
    examples: z.array(LexemeExampleSchema),
    relations: z
      .strictObject({ confusables: z.array(lexemeId(lang)).min(1) })
      .optional(),
    /**
     * P3e: this lexeme is a REGIONAL form (es: "latam") of `equivalent`, the
     * course's production-variety lexeme (content/<lang>/VARIETY.md). It is
     * accepted in graded answers and shown as a note ("Ở Mỹ Latinh: …") on
     * the equivalent, never taught as the model and never in the syllabus.
     */
    variety: z.strictObject({ region: z.string().regex(/^[a-z]+(?:-[a-z]+)*$/), equivalent: lexemeId(lang) }).optional(),
    sourceRefs: z
      .array(z.strictObject({ source: z.string().min(1), key: z.string().min(1).optional() }))
      .min(1),
  });
export const RichLexemeSchema = richLexemeSchema(ANY_LANGUAGE);
export type RichLexeme = z.infer<typeof RichLexemeSchema>;

export const richLexiconSchema = (lang: string) =>
  z.strictObject({
    version: z.literal(1),
    language: languageCode,
    lexemes: z.array(richLexemeSchema(lang)).min(1),
  });
export const RichLexiconSchema = richLexiconSchema(ANY_LANGUAGE);
export type RichLexicon = z.infer<typeof RichLexiconSchema>;

/**
 * content/<lang>/lexicon/source-manifest.json — the external-source
 * contract (optional: a language without an external lexical source has
 * none). Fail-closed by construction: "retrieved" requires a pinned SHA-256
 * and artifact identity; "not-retrieved" forbids them, and the extractor
 * refuses to ingest anything while the status is "not-retrieved".
 */
export const SourceManifestV1Schema = z
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
export type SourceManifestV1 = z.infer<typeof SourceManifestV1Schema>;

/**
 * P3a: a multi-source manifest for the ETL v2 languages — one pinned
 * retrieval per open source (kaikki editions, FrequencyWords, wordfreq,
 * Tatoeba, anchor lists, dictionaries). `frequencySourceId` names the
 * measurement every `frequency` field must cite; a `retrieved` source pins
 * sha256 + bytes + date; a declared-but-not-retrieved source (SUBTLEX-PT,
 * NIKL) records the blocker and can never be referenced by a lexeme.
 */
export const SOURCE_ROLES = ["lexicon", "gloss-vi", "frequency", "frequency-secondary", "examples", "anchor", "dictionary"] as const;
export const SourceManifestV2Schema = z
  .strictObject({
    version: z.literal(2),
    language: languageCode,
    generator: z.literal("scripts/lexicon-etl.ts"),
    sources: z
      .array(
        z.strictObject({
          id,
          role: z.enum(SOURCE_ROLES),
          name: z.string().min(1),
          license: z.string().min(1),
          citation: z.string().min(1),
          url: z.string().min(1),
          artifactFilename: z.string().min(1),
          retrieval: z.strictObject({
            status: z.enum(["not-retrieved", "retrieved"]),
            retrievedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
            sha256: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
            bytes: z.number().int().nonnegative().nullable(),
            /** Why a declared source is not retrieved (blocked download, no stable URL). */
            blocker: z.string().min(1).optional(),
          }),
          notes: z.string().min(1),
        })
      )
      .min(1),
    frequencySourceId: id,
    notes: z.string().min(1),
  })
  .superRefine((m, ctx) => {
    const ids = new Set<string>();
    m.sources.forEach((s, i) => {
      const r = s.retrieval;
      if (r.status === "retrieved" && (!r.sha256 || !r.retrievedAt || r.bytes === null)) {
        ctx.addIssue({ code: "custom", message: `source ${s.id} (${s.artifactFilename}) is "retrieved" but sha256/bytes/retrievedAt are not pinned`, path: ["sources", i, "retrieval"] });
      }
      if (r.status === "not-retrieved" && (r.sha256 !== null || r.retrievedAt !== null || r.bytes !== null)) {
        ctx.addIssue({ code: "custom", message: `source ${s.id} is "not-retrieved" and must not carry artifact pins`, path: ["sources", i, "retrieval"] });
      }
      ids.add(s.id);
    });
    if (!ids.has(m.frequencySourceId)) {
      ctx.addIssue({ code: "custom", message: `frequencySourceId ${m.frequencySourceId} is not one of the manifest sources`, path: ["frequencySourceId"] });
    }
  });
export type SourceManifestV2 = z.infer<typeof SourceManifestV2Schema>;

export const SourceManifestSchema = z.union([SourceManifestV1Schema, SourceManifestV2Schema]);
export type SourceManifest = z.infer<typeof SourceManifestSchema>;

/* ------------------------------------------------------------------ */
/* Pedagogy (content/<lang>/pedagogy/)                                 */
/* ------------------------------------------------------------------ */

/**
 * content/<lang>/pedagogy/concepts.json — the Phase 5B pedagogy-concept
 * model. A concept is Continue-only teaching content rendered by the
 * generic ConceptStep: it never grades, never touches FSRS/wordStats/XP,
 * and is clean-room authored (facts with sourceRefs; no copied prose).
 * Every learner-facing string is native-language text.
 */
export const ConceptExampleSchema = z.strictObject({
  target: z.string().min(1),
  translations: nativeText(),
  /** Optional gloss/why line shown under the pair. */
  note: nativeText().optional(),
});

export const conceptSchema = (lang: string) =>
  z.strictObject({
    id: conceptId(lang),
    /** Learner-facing title (no CEFR labels — program rule). */
    title: nativeText(),
    /** One-line memorable rule, honest wording ("usually", "very often"). */
    shortRule: nativeText(),
    /** A few sentences of plain-language explanation. */
    explanation: nativeText(),
    examples: z.array(ConceptExampleSchema).min(1),
    /** Honest exceptions/limits of the rule (may be empty, never hidden). */
    exceptions: z.array(nativeText()),
    memoryHint: nativeText().optional(),
    /** Course objectives this concept teaches toward (§28). */
    objectives: z.array(objectiveId(lang)).min(1).optional(),
    /** Registered sources backing the FACTS (data stats, references). */
    sourceRefs: z
      .array(z.strictObject({ source: z.string().min(1), key: z.string().min(1).optional() }))
      .min(1),
  });
export const ConceptSchema = conceptSchema(ANY_LANGUAGE);
export type Concept = z.infer<typeof ConceptSchema>;

export const pedagogyConceptsSchema = (lang: string) =>
  z.strictObject({
    version: z.literal(1),
    language: languageCode,
    concepts: z.array(conceptSchema(lang)),
  });
export const PedagogyConceptsSchema = pedagogyConceptsSchema(ANY_LANGUAGE);
export type PedagogyConcepts = z.infer<typeof PedagogyConceptsSchema>;

/**
 * content/<lang>/pedagogy/paradigms.json — authored grammar paradigm
 * tables (P1c generalisation of the French conjugation tables, Phase 5B
 * §60–68). The CELL vocabulary is declared by the language plugin
 * (French: infinitive, présent persons, past participle; Japanese/Korean
 * will declare politeness/tense cells; Chinese declares none). Every cell
 * is AUTHORED and machine-verified against the registered evidence source
 * named in `evidence` (the §26 consumption contract: never blind
 * extraction). `attributes` carries language-specific facts the plugin
 * understands (French: the passé-composé auxiliary).
 */
export const paradigmTableSchema = (cellIds: readonly string[]) =>
  z.strictObject({
    /** Lemma, e.g. "être". */
    lemma: z.string().min(1),
    gloss: nativeText(),
    /** Plugin-declared paradigm group (French: "er-regular" | "irregular"). */
    group: z.string().min(1),
    cells: z.record(z.enum(cellIds as [string, ...string[]]), z.string().min(1)),
    /** Registered source whose rows evidence every cell. */
    evidence: z.strictObject({ source: z.string().min(1) }),
    attributes: z.record(z.string().regex(/^[a-z][a-zA-Z0-9]*$/), z.string().min(1)).optional(),
  });
export type ParadigmTable = z.infer<ReturnType<typeof paradigmTableSchema>>;

export const paradigmTablesSchema = (cellIds: readonly string[]) =>
  z.strictObject({
    version: z.literal(1),
    language: languageCode,
    tables: z.array(paradigmTableSchema(cellIds)).min(1),
  });
export type ParadigmTables = z.infer<ReturnType<typeof paradigmTablesSchema>>;

/** The French cell vocabulary (kept here so the migration and tests share it). */
export const FR_PARADIGM_CELLS = [
  "inf",
  "pre:1s",
  "pre:2s",
  "pre:3s",
  "pre:1p",
  "pre:2p",
  "pre:3p",
  "participle",
] as const;

/**
 * content/<lang>/lexicon/match-overrides.json — the §15 manual-disposition
 * channel for lexemes the strict matcher leaves unmatched. Every override
 * names the exact source row it adopts and the human justification; the
 * validator additionally requires the override to reference a row that
 * really exists in the committed evidence subset for that lexeme, and
 * rejects overrides for lexemes the matcher already resolves (or that are
 * never matchable, i.e. expressions). Silent correction stays impossible.
 */
export const matchOverridesSchema = (lang: string) =>
  z.strictObject({
    version: z.literal(1),
    overrides: z.array(
      z.strictObject({
        id: lexemeId(lang),
        /** Mot|Cgram|Genre|Nombre of the adopted source row. */
        matchKey: z.string().min(1),
        justification: z.string().min(20),
      })
    ),
  });
export const MatchOverridesSchema = matchOverridesSchema(ANY_LANGUAGE);
export type MatchOverrides = z.infer<typeof MatchOverridesSchema>;

const LICENSE_ALLOWLIST = [
  "MIT",
  "Apache-2.0",
  "CC-BY-4.0",
  "CC-BY-SA-4.0",
  "CC-BY-2.0-FR",
  "CC0-1.0",
  "original",
  /**
   * P3a: CEFR-J Vocabulary Profile terms (Tono Lab, TUFS, via Open Language
   * Profiles): "can be used for research and commercial purposes with no
   * charge, provided that you cite the dataset properly". Attribution-only
   * terms, used as a BUILD-TIME selection anchor for English (level labels
   * in content/en/lexicon/derived/anchors.json); no CEFR-J text ships in
   * the app. Registered explicitly so the allowlist stays the gate.
   */
  "CEFR-J-terms",
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
        /** P1c: a source that only backs TEST-ONLY content — registered for provenance, never attributed in the app. */
        testOnly: z.boolean().optional(),
        /** P3a: a build-time selection reference (anchor lists) whose data never ships; attributed in ATTRIBUTIONS.md only. */
        buildTimeOnly: z.boolean().optional(),
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
 * learner-friendly can-do form, per native language — official CEFR
 * descriptor text is never pasted (§141). `essential` marks objectives
 * whose demonstration the section checkpoints must cover (§64).
 */
export const courseObjectiveSchema = (lang: string) =>
  z.strictObject({
    id: objectiveId(lang),
    title: nativeText(),
    canDo: nativeText(10),
    category: z.enum(OBJECTIVE_CATEGORIES),
    prerequisites: z.array(objectiveId(lang)),
    cefrAlignments: z.array(CefrAlignmentSchema).min(1),
    essential: z.boolean(),
    /** Honest evidence limitation shown to reviewers/reports (optional). */
    evidenceNote: z.string().optional(),
  });
export const CourseObjectiveSchema = courseObjectiveSchema(ANY_LANGUAGE);
export type CourseObjective = z.infer<typeof CourseObjectiveSchema>;

export const courseObjectivesSchema = (lang: string) =>
  z.strictObject({
    version: z.literal(1),
    language: languageCode,
    objectives: z.array(courseObjectiveSchema(lang)).min(1),
  });
export const CourseObjectivesSchema = courseObjectivesSchema(ANY_LANGUAGE);
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

/**
 * Learner A1 attainment policy (Phase 10 Gate 2, §10-§16): the AUTHORED
 * denominator of the learner-side estimate. For each communicative domain
 * the overall claim requires, it lists every objective a learner must
 * actually demonstrate (a real checkpoint verdict, latest attempt) before
 * the domain counts. It is content, reviewed like content — never inferred
 * from runtime counts, and never "any one objective". Non-essential direct
 * objectives that are deliberately not gates are listed with a reason so
 * nothing is omitted silently; the validator enforces that every essential
 * direct objective of the domain is either required or explicitly excluded.
 */
export const attainmentDomainPolicySchema = (lang: string) =>
  z.strictObject({
    domain: z.enum(OBJECTIVE_CATEGORIES),
    requiredObjectiveIds: z.array(objectiveId(lang)).min(1),
    excludedObjectiveIds: z.array(
      z.strictObject({ objectiveId: objectiveId(lang), reason: z.string().min(20) })
    ),
    rationale: z.string().min(20),
  });
export const AttainmentDomainPolicySchema = attainmentDomainPolicySchema(ANY_LANGUAGE);
export type AttainmentDomainPolicy = z.infer<typeof AttainmentDomainPolicySchema>;

export const attainmentPolicySchema = (lang: string) =>
  z.strictObject({
    version: z.literal(1),
    language: languageCode,
    level: z.enum(CEFR_LEVELS),
    principle: z.string().min(40),
    domains: z.array(attainmentDomainPolicySchema(lang)).min(1),
  });
export const AttainmentPolicySchema = attainmentPolicySchema(ANY_LANGUAGE);
export type AttainmentPolicy = z.infer<typeof AttainmentPolicySchema>;

// ---------------------------------------------------------------------------
// Phase 6: checkpoint assessment banks (§49-66, §121-123)
// ---------------------------------------------------------------------------

/**
 * One original checkpoint item (§51, §53): a standard exercise payload plus
 * REQUIRED objective mapping. Authored content — gradeTargets never appears
 * (checkpoints don't touch lexical FSRS), and item ids/versions are stable
 * so stored attempts stay interpretable (§66, §123).
 */
/**
 * P2b: the exercise payload is authored in ONE native language (the
 * document's `exerciseNativeCode`); every other native language a course of
 * this target uses supplies the same native-language fields (see
 * scripts/lib/native-fields.ts) as a dot-path → text overlay. The compiler
 * applies the overlay for that course and fails closed on a missing path.
 */
export const ExerciseNativeOverlaySchema = z.record(languageCode, z.record(z.string().min(1), z.string().min(1)));

export const checkpointItemSchema = (lang: string) =>
  z.strictObject({
    id: assessmentItemId(lang),
    itemVersion: z.number().int().min(1),
    exercise: exerciseSchemas(lang).ExerciseSchema,
    exerciseNative: ExerciseNativeOverlaySchema.optional(),
    objectiveTargets: z.array(objectiveId(lang)).min(1),
    /** Items assessing an essential objective the blueprint counts on. */
    essential: z.boolean(),
  });
export const CheckpointItemSchema = checkpointItemSchema(ANY_LANGUAGE);
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

/**
 * A parallel assessment form (P9 §38-§39): one named, valid administration
 * of the checkpoint — a subset of its item bank that still satisfies the
 * per-objective criteria floor for every objective the bank targets.
 * Retakes rotate deterministically through forms so a second sitting is
 * never a memory test of the first. Declaring forms is a content decision:
 * a bank sitting exactly at the claim-gate item floor stays single-form
 * (splitting it would thin per-sitting evidence below its own criteria).
 */
export const checkpointFormSchema = (lang: string) =>
  z.strictObject({
    formId: z.string().regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/),
    itemIds: z.array(assessmentItemId(lang)).min(1),
  });
export const CheckpointFormSchema = checkpointFormSchema(ANY_LANGUAGE);
export type CheckpointForm = z.infer<typeof CheckpointFormSchema>;

export const checkpointSchema = (lang: string) =>
  z.strictObject({
    id: checkpointId(lang),
    /** Bump when items/criteria change meaning (§66). */
    checkpointVersion: z.number().int().min(1),
    /**
     * Bump when the FORM structure changes meaning (P9 §38): which forms
     * exist or which items each administers. Recorded on every attempt so
     * history stays interpretable after content updates — never rescored.
     */
    formVersion: z.number().int().min(1),
    /** The PATH section whose completion unlocks this checkpoint. */
    sectionId: z.string().min(1),
    title: nativeText(),
    description: nativeText(),
    items: z.array(checkpointItemSchema(lang)).min(1),
    /** ≥2 parallel forms, or absent: the whole bank is the single form. */
    forms: z.array(checkpointFormSchema(lang)).min(2).optional(),
    criteria: CheckpointCriteriaSchema,
  });
export const CheckpointSchema = checkpointSchema(ANY_LANGUAGE);
export type Checkpoint = z.infer<typeof CheckpointSchema>;

export const checkpointsSchema = (lang: string) =>
  z.strictObject({
    version: z.literal(1),
    language: languageCode,
    /** Native language of the plain exercise payloads (P2b); other native languages come from `exerciseNative`. */
    exerciseNativeCode: languageCode.default("en"),
    checkpoints: z.array(checkpointSchema(lang)).min(1),
  });
export const CheckpointsSchema = checkpointsSchema(ANY_LANGUAGE);
export type Checkpoints = z.infer<typeof CheckpointsSchema>;

// ---------------------------------------------------------------------------
// Phase 6: placement diagnostic (§67-80, §121-123)
// ---------------------------------------------------------------------------

export const placementItemSchema = (lang: string) =>
  z.strictObject({
    id: placementItemId(lang),
    itemVersion: z.number().int().min(1),
    exercise: exerciseSchemas(lang).ExerciseSchema,
    exerciseNative: ExerciseNativeOverlaySchema.optional(),
    objectiveTargets: z.array(objectiveId(lang)).min(1),
  });
export const PlacementItemSchema = placementItemSchema(ANY_LANGUAGE);
export type PlacementItem = z.infer<typeof PlacementItemSchema>;

/**
 * One curriculum-area probe (§74): a cluster maps to one objective and one
 * ANCHOR lesson — the recommendation for a learner whose earliest gap is
 * this cluster (§75). Cluster order inside a stage must follow curriculum
 * order (validated), so "earliest weak cluster" is well-defined.
 */
export const placementClusterSchema = (lang: string) =>
  z.strictObject({
    id: placementClusterId(lang),
    objectiveId: objectiveId(lang),
    anchorLessonId: z.string().min(1),
    items: z.array(placementItemSchema(lang)).min(1).max(3),
  });
export const PlacementClusterSchema = placementClusterSchema(ANY_LANGUAGE);
export type PlacementCluster = z.infer<typeof PlacementClusterSchema>;

export const placementStageSchema = (lang: string) =>
  z.strictObject({
    id: placementStageId(lang),
    title: nativeText(),
    clusters: z.array(placementClusterSchema(lang)).min(1),
  });
export const PlacementStageSchema = placementStageSchema(ANY_LANGUAGE);
export type PlacementStage = z.infer<typeof PlacementStageSchema>;

/**
 * The staged deterministic diagnostic (§73): stage 2 runs only when every
 * stage-1 cluster is comfortable. No IRT, no adaptivity beyond the stage
 * gate (§122). Item budget across all stages is validated ≤ maxItems.
 */
export const placementSchema = (lang: string) =>
  z.strictObject({
    version: z.literal(1),
    language: languageCode,
    exerciseNativeCode: languageCode.default("en"),
    placementVersion: z.number().int().min(1),
    /**
     * Worst-case item budget. Raised 22 → 28 for placement v3's OPTIONAL
     * production stage (P8 §22): those 6 speaking items run only when every
     * earlier cluster is comfortable AND the device can do scored speech —
     * the common path stays the same length as v2.
     */
    maxItems: z.number().int().min(1).max(28),
    /** Recommendation when every probed cluster is comfortable. */
    allComfortableLessonId: z.string().min(1),
    stages: z.array(placementStageSchema(lang)).min(1),
  });
export const PlacementSchema = placementSchema(ANY_LANGUAGE);
export type PlacementContent = z.infer<typeof PlacementSchema>;

// ---------------------------------------------------------------------------
// Phase 7: reception sources (P7 §43-49)
// ---------------------------------------------------------------------------

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

export const readingSourceSchema = (lang: string) =>
  z.strictObject({
    id: readingId(lang),
    kind: z.enum(READING_KINDS),
    /** Target-language title of the text (a notice heading, a subject line). */
    title: z.string().min(1).optional(),
    blocks: z.array(ReadingBlockSchema).min(1).max(10),
    objectiveRefs: z.array(objectiveId(lang)).min(1),
    /** Course lexemes the text leans on (coverage QA, not grading). */
    lexemeRefs: z.array(lexemeId(lang)),
    /** Learning-mode-only glosses for the small supported-unknown load. */
    supportGlossary: z.array(z.strictObject({ surface: z.string().min(1), gloss: nativeText() })),
    sourceRef: z.literal("original-project"),
    authoringSpec: ReceptionAuthoringSpecSchema,
    /**
     * P3e: "exam" = a stimulus of an exam track, written to the public
     * format's length (up to 260 words) — never used in lessons.
     */
    use: z.literal("exam").optional(),
  });
export const ReadingSourceSchema = readingSourceSchema(ANY_LANGUAGE);
export type ReadingSource = z.infer<typeof ReadingSourceSchema>;

export const readingsSchema = (lang: string) =>
  z.strictObject({
    version: z.literal(1),
    language: languageCode,
    readings: z.array(readingSourceSchema(lang)).min(1),
  });
export const ReadingsSchema = readingsSchema(ANY_LANGUAGE);
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

export const listeningClipSchema = (lang: string) =>
  z.strictObject({
    id: clipId(lang),
    kind: z.enum(LISTENING_KINDS),
    /** ≤ 4 segments for teaching clips; exam conversations (use "exam") up to 16. */
    segments: z.array(ListeningSegmentSchema).min(1).max(16),
    objectiveRefs: z.array(objectiveId(lang)).min(1),
    lexemeRefs: z.array(lexemeId(lang)),
    sourceRef: z.literal("original-project"),
    authoringSpec: ReceptionAuthoringSpecSchema,
    /** Scored sessions: normal rate only, bounded deliberate plays (P7 §23, §67). */
    scoredPlaybackPolicy: z.strictObject({
      maxPlays: z.number().int().min(1).max(3),
      rate: z.literal(1),
    }),
    /** P3e: "exam" = an exam-track recording (format length, up to 1,400 characters) — never used in lessons. */
    use: z.literal("exam").optional(),
  });
export const ListeningClipSchema = listeningClipSchema(ANY_LANGUAGE);
export type ListeningClip = z.infer<typeof ListeningClipSchema>;

export const listeningSchema = (lang: string) =>
  z.strictObject({
    version: z.literal(1),
    language: languageCode,
    /**
     * The pinned voice cast (P7 §59): stable speaker letters map to concrete
     * pinned voices/speaker ids in ONE place, so a re-generation can never
     * silently reshuffle who speaks.
     */
    voiceCast: z.strictObject({
      A: z.strictObject({ voiceId: z.string().min(1), speaker: z.number().int().nullable() }),
      B: z.strictObject({ voiceId: z.string().min(1), speaker: z.number().int().nullable() }),
    }),
    clips: z.array(listeningClipSchema(lang)).min(1),
  });
export const ListeningSchema = listeningSchema(ANY_LANGUAGE);
export type Listening = z.infer<typeof ListeningSchema>;

// ---------------------------------------------------------------------------
// Graded stories (P5b): comprehensible input from the learner's lexicon
// ---------------------------------------------------------------------------

/**
 * Lexicon bands a story is graded by: the first and second half of the
 * target's syllabus at each level (scripts/lib/stories.ts `lexemeBands`).
 */
export const STORY_BANDS = ["A1-1", "A1-2", "A2-1", "A2-2"] as const;
export type StoryBand = (typeof STORY_BANDS)[number];

/** N = narrator; A/B = the two dialogue voices (a story may be narration only). */
export const STORY_SPEAKERS = ["N", "A", "B"] as const;

export const StorySentenceSchema = z.strictObject({
  speaker: z.enum(STORY_SPEAKERS),
  /** One sentence, one synthesized clip — the unit of highlight and gloss. */
  text: z.string().min(1),
  /** Tap-to-gloss translation of the whole sentence, per native language. */
  translation: nativeText(),
});

export const StoryQuestionSchema = z.strictObject({
  /** locate = stated in one sentence; infer = put two sentences together. */
  kind: z.enum(["locate", "infer"]),
  prompt: nativeText(),
  options: z.array(nativeText()).min(3).max(4),
  answer: z.number().int().min(0).max(3),
});

export const storySourceSchema = (lang: string) =>
  z.strictObject({
    id: storyId(lang),
    band: z.enum(STORY_BANDS),
    /** Target-language title. */
    title: z.string().min(1),
    /** Native-language subtitle shown under the title in the list. */
    blurb: nativeText(),
    sentences: z.array(StorySentenceSchema).min(8).max(60),
    /**
     * The 3–5 lexemes this story introduces: the only words beyond its band
     * it may use, and the only ones its word check grades (FSRS).
     */
    newLexemes: z.array(lexemeId(lang)).min(3).max(5),
    /**
     * Token resolution overrides, lower-case surface → lexeme id, or
     * "function" / "name". Most tokens resolve through the lexicon and its
     * morphology; this records the rest explicitly — never silently.
     */
    tokenMap: z.record(z.string().min(1), z.union([lexemeId(lang), z.enum(["function", "name"])])).optional(),
    questions: z.array(StoryQuestionSchema).length(3),
    sourceRef: z.literal("original-project"),
  });
export const StorySourceSchema = storySourceSchema(ANY_LANGUAGE);
export type StorySource = z.infer<typeof StorySourceSchema>;

export const storiesSchema = (lang: string) =>
  z.strictObject({
    version: z.literal(1),
    language: languageCode,
    /**
     * Pinned voices: N narrates, A and B carry dialogue — two distinct
     * voices whenever a story has dialogue (validator).
     */
    voiceCast: z.strictObject({
      N: z.strictObject({ voiceId: z.string().min(1), speaker: z.number().int().nullable() }),
      A: z.strictObject({ voiceId: z.string().min(1), speaker: z.number().int().nullable() }),
      B: z.strictObject({ voiceId: z.string().min(1), speaker: z.number().int().nullable() }),
    }),
    /** Closed-class words of the language (articles, pronouns, prepositions …), lower case. */
    functionWords: z.array(z.string().min(1)).min(10),
    /** Language-wide token overrides (homographs such as "son" → ser); a story's own map wins. */
    tokenMap: z.record(z.string().min(1), z.union([lexemeId(lang), z.enum(["function", "name"])])).optional(),
    stories: z.array(storySourceSchema(lang)).min(1),
  });
export const StoriesSchema = storiesSchema(ANY_LANGUAGE);
export type Stories = z.infer<typeof StoriesSchema>;

// ---------------------------------------------------------------------------
// Spoken production (P8 §11/§19)
// ---------------------------------------------------------------------------

/** CEFR-anchored A1 oral-production task families (RESEARCH.md §4). */
export const SPEECH_TASK_FAMILIES = [
  "formulaic_exchange",
  "self_introduction",
  "information_giving",
  "description",
] as const;

/**
 * PRACTICE-ONLY elicitations expose or model the target before the attempt
 * — they are NEVER spoken-production evidence (§11). The construct
 * validators enforce the split; the enums keep it explicit in data.
 */
export const SPEECH_PRACTICE_ELICITATIONS = ["repetition", "read_aloud"] as const;
/** Production elicitations: the cue carries meaning, never the target form. */
export const SPEECH_PRODUCTION_ELICITATIONS = [
  "semantic_prompt",
  "situation_prompt",
  "picture_prompt",
  "information_prompt",
] as const;
export const SPEECH_ELICITATION_TYPES = [
  ...SPEECH_PRACTICE_ELICITATIONS,
  ...SPEECH_PRODUCTION_ELICITATIONS,
] as const;

/** The learner-visible cue. Native text/emoji/data only for production items. */
export const SpeechPromptSchema = z.strictObject({
  /** Task instruction per native code ("Say that you would like a coffee."). */
  instruction: nativeText(),
  /** Optional emoji/icon cue (picture prompts). */
  cueEmoji: z.string().min(1).optional(),
  /** Structured facts to convey for information-giving ("Cats" → "2"). */
  cueFacts: z.array(CueFactSourceSchema).min(1).optional(),
});

export const speechItemSchema = (lang: string) =>
  z.strictObject({
    id: speechItemId(lang),
    taskFamily: z.enum(SPEECH_TASK_FAMILIES),
    elicitationType: z.enum(SPEECH_ELICITATION_TYPES),
    prompt: SpeechPromptSchema,
    /** Canonical target-language answer — displayed only AFTER attempts in learning. */
    target: z.string().min(1),
    /** Whole-utterance answers the deterministic grader accepts (§12). */
    acceptedVariants: z.array(z.string().min(1)).min(1),
    /** Concept slots (each = acceptable forms); all must be heard at once. */
    requiredConcepts: z.array(z.array(z.string().min(1)).min(1)).min(1).optional(),
    objectiveRefs: z.array(objectiveId(lang)).min(1),
    /** Course lexemes the item leans on (coverage QA). */
    lexemeRefs: z.array(lexemeId(lang)),
    /** Lexemes whose |speak cards a correct production may grade (⊆ lexemeRefs). */
    evidenceLexemeRefs: z.array(lexemeId(lang)),
    assistancePolicy: z.strictObject({
      /** Practice-only recognition bias; never sent on scored attempts (§13). */
      allowContextualBias: z.boolean(),
      /** Learning mode may reveal the target after N failed attempts (null = never). */
      revealTargetAfterAttempts: z.number().int().min(1).max(5).nullable(),
    }),
    /** May appear in scored contexts (review probes, checkpoint, placement). */
    scoredEligibility: z.boolean(),
    /** Model-answer clip: learning-mode feedback AFTER attempts; never pre-scoring (§18). */
    modelAudioRef: clipId(lang).nullable(),
    /** BCP-47; must equal the language plugin's recognition locale (validated). */
    recognitionLocale,
    /** Recording attempts before the item resolves (humane retry, §23). */
    allowedAttempts: z.number().int().min(1).max(3),
    /** Checkpoint-reserved prompts never appear as teaching stimuli (§20). */
    reserved: z.boolean(),
    sourceRef: z.literal("original-project"),
  });
export const SpeechItemSchema = speechItemSchema(ANY_LANGUAGE);
export type SpeechItem = z.infer<typeof SpeechItemSchema>;

export const speechItemsSchema = (lang: string) =>
  z.strictObject({
    version: z.literal(1),
    language: languageCode,
    items: z.array(speechItemSchema(lang)).min(1),
  });
export const SpeechItemsSchema = speechItemsSchema(ANY_LANGUAGE);
export type SpeechItems = z.infer<typeof SpeechItemsSchema>;

/* ------------------------------------------------------------------ */
/* Written production (Phase 9 §13-§23)                                */
/* ------------------------------------------------------------------ */

export const WRITING_TASK_FAMILIES = [
  "personal_profile",
  "simple_description",
  "short_message",
  "simple_form",
] as const;

/**
 * One authored writing task — the single source of truth the pack,
 * checkpoint and capstone exercises must mirror byte-for-byte (the same
 * discipline as speech items). `mode: "open"` tasks are practice-only and
 * may never be scored-eligible (P9 §15).
 */
export const writingTaskSchema = (lang: string) =>
  z.strictObject({
    id: writingTaskId(lang),
    taskFamily: z.enum(WRITING_TASK_FAMILIES),
    mode: z.enum(["guided", "open"]),
    instruction: nativeText(),
    cueFacts: z.array(CueFactSourceSchema).min(1).optional(),
    /** simple_form tasks list their discrete fields (target-language labels); others omit. */
    formFields: z
      .array(
        z.strictObject({
          id: z.string().regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/),
          label: z.string().min(1),
          slotId: z.string().regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/),
        })
      )
      .min(2)
      .optional(),
    rubric: WritingRubricSourceSchema,
    modelAnswers: z.array(z.string().min(1)).min(1),
    objectiveRefs: z.array(objectiveId(lang)).min(1),
    lexemeRefs: z.array(lexemeId(lang)),
    /** May appear in scored contexts (checkpoint / capstone forms). */
    scoredEligibility: z.boolean(),
    /** Reserved assessment stimuli never appear as teaching material. */
    reserved: z.boolean(),
    sourceRef: z.literal("original-project"),
  });
export const WritingTaskSchema = writingTaskSchema(ANY_LANGUAGE);
export type WritingTask = z.infer<typeof WritingTaskSchema>;

export const writingTasksSchema = (lang: string) =>
  z.strictObject({
    version: z.literal(1),
    language: languageCode,
    tasks: z.array(writingTaskSchema(lang)).min(1),
  });
export const WritingTasksSchema = writingTasksSchema(ANY_LANGUAGE);
export type WritingTasks = z.infer<typeof WritingTasksSchema>;

/* ------------------------------------------------------------------ */
/* Spoken interaction (Phase 9 §24-§37)                                */
/* ------------------------------------------------------------------ */

const interactionNodeId = z.string().regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/);

export const interactionPartnerNodeSchema = (lang: string) =>
  z.strictObject({
    kind: z.literal("partner"),
    id: interactionNodeId,
    text: z.string().min(1),
    clipId: clipId(lang),
    rephraseText: z.string().min(1).optional(),
    rephraseClipId: clipId(lang).optional(),
    next: interactionNodeId,
  });

export const InteractionExpectedIntentSchema = z.strictObject({
  intent: z.string().regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/),
  acceptedVariants: z.array(z.string().min(1)).min(1),
  requiredConcepts: z.array(z.array(z.string().min(1)).min(1)).min(1).optional(),
  next: interactionNodeId,
});

export const InteractionLearnerNodeSchema = z.strictObject({
  kind: z.literal("learner"),
  id: interactionNodeId,
  /** Native-language instruction for the learner's turn. */
  prompt: nativeText(),
  expected: z.array(InteractionExpectedIntentSchema).min(1),
  noMatchNext: interactionNodeId,
  scored: z.boolean(),
});

export const interactionTerminalNodeSchema = (lang: string) =>
  z.strictObject({
    kind: z.literal("terminal"),
    id: interactionNodeId,
    outcome: z.enum(["goal_met", "goal_not_met"]),
    text: z.string().min(1).optional(),
    clipId: clipId(lang).optional(),
  });

export const interactionNodeSchema = (lang: string) =>
  z.discriminatedUnion("kind", [
    interactionPartnerNodeSchema(lang),
    InteractionLearnerNodeSchema,
    interactionTerminalNodeSchema(lang),
  ]);
export const InteractionNodeSchema = interactionNodeSchema(ANY_LANGUAGE);

export const INTERACTION_TASK_FAMILIES = [
  "conversation",
  "information_exchange",
  "transaction",
] as const;

export const interactionScenarioSchema = (lang: string) =>
  z.strictObject({
    id: scenarioId(lang),
    title: nativeText(),
    goal: nativeText(),
    taskFamily: z.enum(INTERACTION_TASK_FAMILIES),
    objectiveRefs: z.array(objectiveId(lang)).min(1),
    startNodeId: interactionNodeId,
    nodes: z.record(interactionNodeId, interactionNodeSchema(lang)),
    support: z.strictObject({
      allowRepeat: z.boolean(),
      allowRephrase: z.boolean(),
    }),
    reserved: z.boolean(),
    sourceRef: z.literal("original-project"),
  });
export const InteractionScenarioSchema = interactionScenarioSchema(ANY_LANGUAGE);
export type InteractionScenarioSource = z.infer<typeof InteractionScenarioSchema>;

export const interactionScenariosSchema = (lang: string) =>
  z.strictObject({
    version: z.literal(1),
    language: languageCode,
    scenarios: z.array(interactionScenarioSchema(lang)).min(1),
  });
export const InteractionScenariosSchema = interactionScenariosSchema(ANY_LANGUAGE);
export type InteractionScenarios = z.infer<typeof InteractionScenariosSchema>;

// ---------------------------------------------------------------------------
// P3d: exam tracks (content/<lang>/exam/<track>.json)
// ---------------------------------------------------------------------------

export const examTrackId = (lang: string) => z.string().regex(idPattern(lang, "\\.exam\\.", "[a-z0-9_]+"));
export const examItemId = (lang: string) => z.string().regex(idPattern(lang, "\\.exi\\.", "[a-z0-9_]+\\.[a-z0-9_]+"));
const examSlug = z.string().regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/);
/** "structures": a language-structures section (CILS "Analisi delle strutture di comunicazione"). */
export const EXAM_SKILLS = ["reading", "listening", "writing", "speaking", "structures"] as const;
/**
 * Public task formats an exam track reproduces (formats only — never real
 * exam items). P3e:
 *  - mcq3            one question, 3 text options
 *  - mcq2            one question, 2 options in a fixed order (Goethe:
 *                    richtig / falsch, a / b)
 *  - pictureMcq      one question, 3 picture (emoji) options
 *  - matchToPool     N items share ONE pool of M > N options (texts, ads,
 *                    pictures, sentence endings); every option is the key of
 *                    at most one item; pool order is fixed (lettered)
 *  - completeFromPool  N statements completed from a shared pool of M > N
 *  - form / short_text / monologue / conversation  productive tasks
 *  - cloze           a gap in a sentence or short text, chosen or typed
 *                    (exam-engine-v2: CILS structures)
 *  - formCompletion  the right form of a given word (article, verb ending,
 *                    agreement) typed into a gap
 */
export const EXAM_TASK_FORMATS = ["mcq3", "mcq2", "pictureMcq", "matchToPool", "completeFromPool", "form", "short_text", "monologue", "conversation", "cloze", "formCompletion"] as const;
export const EXAM_POOL_FORMATS: readonly string[] = ["matchToPool", "completeFromPool"];

const wordBand = z.strictObject({ min: z.number().int().min(1), max: z.number().int().min(1) });

export const examTaskSchema = z.strictObject({
  id: examSlug,
  title: nativeText(),
  instruction: nativeText(),
  format: z.enum(EXAM_TASK_FORMATS),
  /** Items one parallel form administers for this task. */
  itemsPerForm: z.number().int().min(1),
  /** Pool formats: the shared pool's size (M > itemsPerForm). */
  poolSize: z.number().int().min(2).optional(),
  /**
   * Word-length band of the task's stimulus, per the public format:
   * `per: "text"` counts each referenced reading / clip transcript as one
   * text; `per: "block"` counts each paragraph of a multi-text reading
   * (nine short notices) separately.
   */
  stimulusWords: wordBand.extend({ per: z.enum(["text", "block"]) }).optional(),
  /** Writing tasks: word band of the expected answer (model answers are checked against it). */
  answerWords: wordBand.optional(),
  /** Speaking tasks: the format's spoken length in minutes (shown to the learner). */
  speakingMinutes: z.strictObject({ min: z.number().min(0.5), max: z.number().min(0.5) }).optional(),
  /**
   * The format's raw points for this task (Goethe Schreiben: Teil 1 5, Teil 2
   * 10). Set on every task of a section or on none; with them the section's
   * maxPoints is shared by task points instead of equally per item.
   */
  points: z.number().positive().optional(),
  /**
   * Listening parts with their own play count (QC 2026-10-29 §1.4: Goethe
   * Hören Teil 2 is heard once); otherwise the section's playsPerRecording.
   */
  playsPerRecording: z.number().int().min(1).max(3).optional(),
  /** The format's time for this part, when it times parts separately (shown to the learner; the parts fit the section's minutes). */
  minutes: z.number().int().min(1).max(240).optional(),
});

export const examSectionSchema = z.strictObject({
  id: examSlug,
  skill: z.enum(EXAM_SKILLS),
  title: nativeText(),
  /** The public format's time limit; the timed mock enforces it. */
  minutes: z.number().int().min(1).max(240),
  preparationMinutes: z.number().int().min(1).max(60).optional(),
  maxPoints: z.number().positive(),
  /** Listening: how many times each recording plays (must equal every referenced clip's maxPlays). */
  playsPerRecording: z.number().int().min(1).max(3).optional(),
  /**
   * Speaking: the real exam holds this part in a group or face to face with
   * an examiner, and the app simulates it alone (QC 2026-10-29 §2). The
   * section card says so.
   */
  simulatedIndividually: z.literal(true).optional(),
  tasks: z.array(examTaskSchema).min(1),
});

/**
 * Generic pass rule (P3e, exam-engine-v2): the exam is "passed" in its own
 * terms only when EVERY declared rule is met — any combination of group
 * minimums (DELE: reading + writing ≥ 30/50 AND listening + speaking
 * ≥ 30/50), per-section minimums (CILS: each section ≥ 7/12), a total
 * minimum (Goethe ≥ 60/100 as one group; CILS ≥ 35/60) and "every section
 * taken". Used only to word an ESTIMATED readiness.
 */
export const examPassRuleSchema = z
  .strictObject({
    groups: z
      .array(
        z.strictObject({
          id: examSlug,
          title: nativeText(),
          sections: z.array(examSlug).min(1),
          min: z.number().positive(),
        })
      )
      .min(1)
      .optional(),
    sectionMinimums: z.array(z.strictObject({ section: examSlug, min: z.number().positive() })).min(1).optional(),
    total: z.strictObject({ title: nativeText(), min: z.number().positive() }).optional(),
    /** No readiness at all unless every section was taken (CILS: all five parts are sat). */
    everySectionTaken: z.literal(true).optional(),
  })
  .refine((r) => r.groups !== undefined || r.sectionMinimums !== undefined || r.total !== undefined, {
    message: "a pass rule declares groups, sectionMinimums or a total",
  });

export const examReadinessBandSchema = z.strictObject({
  id: examSlug,
  /** Lowest rule share (points / max, over every group, section minimum and total) that reaches this band. */
  minGroupShare: z.number().min(0).max(1),
  label: nativeText(),
  message: nativeText(),
});

export const examItemSchema = (lang: string) =>
  z.strictObject({
    id: examItemId(lang),
    itemVersion: z.number().int().min(1),
    sectionId: examSlug,
    taskId: examSlug,
    exercise: exerciseSchemas(lang).ExerciseSchema,
    exerciseNative: ExerciseNativeOverlaySchema.optional(),
    objectiveTargets: z.array(objectiveId(lang)).min(1),
  });

/**
 * One exam track (P3d, format v2 since P3e): the PUBLIC format of an exam
 * (sections, tasks, timing, pass rule) with original practice items in two
 * or more disjoint parallel forms. Results are worded as an estimated
 * readiness ("mức sẵn sàng ước tính"), never as a prediction of passing.
 */
export const examTrackSchema = (lang: string) =>
  z.strictObject({
    version: z.literal(1),
    language: languageCode,
    exerciseNativeCode: languageCode.default("en"),
    id: examTrackId(lang),
    /** Bump when items, forms or scoring change meaning; recorded on every attempt. */
    trackVersion: z.number().int().min(1),
    name: z.string().min(2),
    level: z.string().min(1),
    title: nativeText(),
    description: nativeText(),
    formatSource: z.strictObject({
      publisher: z.string().min(2),
      /** Official documents the format follows (URL + what was taken from it). */
      references: z.array(z.strictObject({ url: z.string().url(), title: z.string().min(2), retrieved: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional() })).min(1),
      /** True only after the figures were read in the official document itself. */
      checkedAgainstOfficialGuide: z.boolean(),
      /** P3f: who read the official documents, and when (required when checked). */
      checkedBy: z.string().min(2).optional(),
      checkedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      note: nativeText(),
    }),
    sections: z.array(examSectionSchema).min(1),
    passRule: examPassRuleSchema,
    /** How a correct item scores (DELE: 1 point per correct objective item, no negative marking). */
    scoring: z.strictObject({ perItem: z.literal("share_of_section_points"), negativeMarking: z.literal(false) }),
    readiness: z.strictObject({
      bands: z.array(examReadinessBandSchema).min(2),
      incomplete: nativeText(),
      disclaimer: nativeText(),
    }),
    items: z.array(examItemSchema(lang)).min(1),
    forms: z
      .array(z.strictObject({ formId: z.string().regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/), itemIds: z.array(examItemId(lang)).min(1) }))
      .min(2),
  });
export const ExamTrackSchema = examTrackSchema(ANY_LANGUAGE);
export type ExamTrack = z.infer<typeof ExamTrackSchema>;

// ---------------------------------------------------------------------------
// P3e: lexical syllabus (content/<lang>/lexicon/syllabus.json)
// ---------------------------------------------------------------------------

/**
 * Which lexemes belong to a level and which unit of the target's primary
 * course unlocks them for the "daily new words" stream. Order = delivery
 * order (unlock unit, then frequency). Generated by `bun scripts/syllabus.ts
 * derive` and committed; the validator re-checks every entry.
 */
export const syllabusSchema = (lang: string) =>
  z.strictObject({
    version: z.literal(1),
    language: languageCode,
    level: z.string().min(1),
    /** The level's lexical floor this target promises (es A1: 600). */
    minLexemes: z.number().int().min(0),
    /** How the list was derived (human-readable, reproducible). */
    derivation: z.string().min(10),
    entries: z.array(z.strictObject({ lexemeId: lexemeId(lang), unitId: z.string().min(1) })).min(1),
  });
export const SyllabusSchema = syllabusSchema(ANY_LANGUAGE);
export type Syllabus = z.infer<typeof SyllabusSchema>;

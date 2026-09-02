/** Content pack types — keep in sync with content/schema.ts */

export type Word = {
  target: string;
  native: string;
  emoji: string;
  romanization?: string;
};

export type SelectExercise = {
  type: "select";
  id: string;
  mode: "targetToNative" | "nativeToTarget" | "listen";
  prompt: string;
  audioTarget?: string;
  options: { text: string; emoji?: string }[];
  correct: number;
  /** Compiler-emitted stable lexeme ids this exercise unambiguously assesses (see content/schema.ts). Unused by the runtime until deliberate eligibility metadata lands. */
  gradeTargets?: string[];
  /** AUTHORED course-objective targets (Phase 6 §29-31) — curriculum/assessment meaning, orthogonal to the lexical gradeTargets system. */
  objectiveTargets?: string[];
};

export type WordBankExercise = {
  type: "wordBank";
  id: string;
  direction: "targetToNative" | "nativeToTarget";
  prompt: string;
  audioTarget?: string;
  tokens: string[];
  answer: string[];
  /** Compiler-emitted stable lexeme ids this exercise unambiguously assesses (see content/schema.ts). Unused by the runtime until deliberate eligibility metadata lands. */
  gradeTargets?: string[];
  /** AUTHORED course-objective targets (Phase 6 §29-31) — curriculum/assessment meaning, orthogonal to the lexical gradeTargets system. */
  objectiveTargets?: string[];
};

export type MatchExercise = {
  type: "match";
  id: string;
  pairs: { target: string; native: string }[];
  /** Compiler-emitted stable lexeme ids this exercise unambiguously assesses (see content/schema.ts). Unused by the runtime until deliberate eligibility metadata lands. */
  gradeTargets?: string[];
  /** AUTHORED course-objective targets (Phase 6 §29-31) — curriculum/assessment meaning, orthogonal to the lexical gradeTargets system. */
  objectiveTargets?: string[];
};

export type TypeAnswerExercise = {
  type: "typeAnswer";
  id: string;
  mode: "translate" | "listen" | "produceTarget";
  prompt: string;
  audioTarget?: string;
  answer: string;
  alternatives: string[];
  /** Compiler-emitted stable lexeme ids this exercise unambiguously assesses (see content/schema.ts). Unused by the runtime until deliberate eligibility metadata lands. */
  gradeTargets?: string[];
  /** AUTHORED course-objective targets (Phase 6 §29-31) — curriculum/assessment meaning, orthogonal to the lexical gradeTargets system. */
  objectiveTargets?: string[];
};

export type FillBlankExercise = {
  type: "fillBlank";
  id: string;
  sentence: string;
  translation: string;
  audioTarget?: string;
  options: string[];
  correct: number;
  /** Compiler-emitted stable lexeme ids this exercise unambiguously assesses (see content/schema.ts). Unused by the runtime until deliberate eligibility metadata lands. */
  gradeTargets?: string[];
  /** AUTHORED course-objective targets (Phase 6 §29-31) — curriculum/assessment meaning, orthogonal to the lexical gradeTargets system. */
  objectiveTargets?: string[];
};

/**
 * Grammar drill (Phase 5B): pick the right article for a noun. Carries NO
 * gradeTargets by design — grammar answers are practice evidence and never
 * mutate a lexical recognize card (§58).
 */
export type ArticleSelectExercise = {
  type: "articleSelect";
  id: string;
  articles: string[];
  noun: string;
  gloss: string;
  correct: number;
  audioTarget?: string;
  /** AUTHORED course-objective targets (Phase 6 §29-31) — curriculum/assessment meaning, orthogonal to the lexical gradeTargets system. */
  objectiveTargets?: string[];
};

/**
 * Typed conjugation production (Phase 5B): STRICT grading (accents and
 * exact inflection matter). No gradeTargets by design — grammar production
 * is practice evidence, never lexical FSRS (§67).
 */
export type ConjugationClozeExercise = {
  type: "conjugationCloze";
  id: string;
  sentence: string;
  translation: string;
  verb: string;
  cell: string;
  answer: string;
  alternatives: string[];
  /** AUTHORED course-objective targets (Phase 6 §29-31) — curriculum/assessment meaning, orthogonal to the lexical gradeTargets system. */
  objectiveTargets?: string[];
};

/**
 * Listening comprehension (Phase 7 §61): a bundled deterministic clip plus
 * a meaning question. The transcript is NEVER rendered before the answer.
 * No gradeTargets by design — clip comprehension is objective evidence,
 * never a lexical FSRS write (P7 §75).
 */
export type ListeningComprehensionExercise = {
  type: "listeningComprehension";
  id: string;
  clipId: string;
  question: string;
  options: { text: string }[];
  correct: number;
  /** AUTHORED course-objective targets (Phase 6 §29-31). */
  objectiveTargets?: string[];
};

/** Reading comprehension (Phase 7 §62): a passage plus a meaning question. */
export type ReadingComprehensionExercise = {
  type: "readingComprehension";
  id: string;
  readingId: string;
  question: string;
  options: { text: string }[];
  correct: number;
  objectiveTargets?: string[];
};

/**
 * Dictation (Phase 7 §63): hear a clip, type what was said. Primarily
 * listening decoding + orthographic production — never sole evidence of
 * broad listening comprehension, and no gradeTargets by design.
 */
export type DictationExercise = {
  type: "dictation";
  id: string;
  clipId: string;
  answer: string;
  alternatives: string[];
  objectiveTargets?: string[];
};

/**
 * Speak-after-the-model PRACTICE (P8 §11): model clip is the stimulus, the
 * French is visible, the recognized transcript is feedback only — NEVER
 * spoken-production evidence, and no gradeTargets by design.
 */
export type SpeakRepetitionExercise = {
  type: "speakRepetition";
  id: string;
  speechItemId: string;
  modelClipId: string;
  target: string;
  acceptedVariants: string[];
  requiredConcepts?: string[][];
  objectiveTargets?: string[];
};

/**
 * Elicited spoken PRODUCTION (P8 §11): meaning-only cue, the French target
 * never exposed before the attempt, deterministic grading of what the
 * recognizer heard (§12). Grading fields mirror the authored speech item
 * (pipeline-enforced).
 */
export type SpeakProductionExercise = {
  type: "speakProduction";
  id: string;
  speechItemId: string;
  instruction: string;
  cueEmoji?: string;
  cueFacts?: { label: string; value: string }[];
  target: string;
  acceptedVariants: string[];
  requiredConcepts?: string[][];
  /** Lexemes whose |speak cards this step may grade (P8 §15; ⊆ the item's). */
  evidenceLexemeRefs: string[];
  revealTargetAfterAttempts: number | null;
  allowContextualBias: boolean;
  modelClipId: string | null;
  allowedAttempts: number;
  objectiveTargets?: string[];
};

/** Authored deterministic writing rubric (P9 §16) — mirrors the task. */
export type WritingRubricSpec = {
  requiredSlots: {
    id: string;
    description: string;
    variants: string[];
    cueProvided: boolean;
  }[];
  minTokens: number;
  maxTokens: number;
  requireSentenceVerbs?: string[];
};

export type GuidedWritingExercise = {
  type: "guidedWriting";
  id: string;
  writingTaskId: string;
  /** "guided" is rubric-graded; "open" is practice-only, never evidence. */
  writingMode: "guided" | "open";
  instruction: string;
  cueFacts?: { label: string; value: string }[];
  rubric: WritingRubricSpec;
  /** Shown only AFTER an attempt in learning; never pre-submission scored. */
  modelAnswers: string[];
  objectiveTargets?: string[];
};

export type SimpleFormExercise = {
  type: "simpleForm";
  id: string;
  writingTaskId: string;
  instruction: string;
  fields: { id: string; label: string; slotId: string }[];
  rubric: WritingRubricSpec;
  modelAnswers: string[];
  objectiveTargets?: string[];
};

export type InteractionScenarioExercise = {
  type: "interactionScenario";
  id: string;
  /** The authored scenario graph, resolved from the compiled artifact. */
  scenarioId: string;
  objectiveTargets?: string[];
};

export type Exercise =
  | SelectExercise
  | WordBankExercise
  | MatchExercise
  | TypeAnswerExercise
  | FillBlankExercise
  | ArticleSelectExercise
  | ConjugationClozeExercise
  | ListeningComprehensionExercise
  | ReadingComprehensionExercise
  | DictationExercise
  | SpeakRepetitionExercise
  | SpeakProductionExercise
  | GuidedWritingExercise
  | SimpleFormExercise
  | InteractionScenarioExercise;

/**
 * Optional explicit lesson flow (Phase 5B): ordered interleaving of
 * Continue-only concept steps and the lesson's exercises. Absent = the
 * exercises in order (every pre-5B lesson unchanged).
 */
export type LessonFlowEntry = { concept: string } | { exercise: string };

export type LessonPack = {
  id: string;
  title: string;
  exercises: Exercise[];
  flow?: LessonFlowEntry[];
  /** Course objectives this lesson teaches (Phase 6 §27; French only). */
  objectives?: string[];
};

export type UnitPack = {
  id: string;
  title: string;
  description: string;
  guidebook: string;
  words: Word[];
  lessons: LessonPack[];
};

export type SectionPack = { id: string; title: string; units: UnitPack[] };

export type PackAudioPolicy = { policy: "bundled" | "device-tts"; reason?: string };

export type Pack = {
  id: string;
  version: number;
  targetLanguage: string;
  targetCode: string;
  nativeLanguage: string;
  nativeCode: string;
  flag: string;
  /** Absent = bundled audio; device-tts courses speak via expo-speech. */
  audio?: PackAudioPolicy;
  sections: SectionPack[];
};

export type CatalogCourse = {
  id: string;
  targetLanguage: string;
  targetCode: string;
  nativeLanguage: string;
  flag: string;
  unitCount: number;
  lessonCount: number;
};

export type Catalog = {
  version: number;
  courses: CatalogCourse[];
};

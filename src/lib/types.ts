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
};

export type MatchExercise = {
  type: "match";
  id: string;
  pairs: { target: string; native: string }[];
  /** Compiler-emitted stable lexeme ids this exercise unambiguously assesses (see content/schema.ts). Unused by the runtime until deliberate eligibility metadata lands. */
  gradeTargets?: string[];
};

export type TypeAnswerExercise = {
  type: "typeAnswer";
  id: string;
  mode: "translate" | "listen";
  prompt: string;
  audioTarget?: string;
  answer: string;
  alternatives: string[];
  /** Compiler-emitted stable lexeme ids this exercise unambiguously assesses (see content/schema.ts). Unused by the runtime until deliberate eligibility metadata lands. */
  gradeTargets?: string[];
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
};

export type Exercise =
  | SelectExercise
  | WordBankExercise
  | MatchExercise
  | TypeAnswerExercise
  | FillBlankExercise
  | ArticleSelectExercise
  | ConjugationClozeExercise;

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

export type Pack = {
  id: string;
  version: number;
  targetLanguage: string;
  targetCode: string;
  nativeLanguage: string;
  nativeCode: string;
  flag: string;
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

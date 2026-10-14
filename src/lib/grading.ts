import type { Exercise, GuidedWritingExercise, SimpleFormExercise } from "./types";

import { courseProfile } from "./course-profile";
import { languageRulesForCourse } from "./languages";
import { normalizeLenientLatin, normalizeStrictLatin } from "./languages/base";
import { gradeSpokenAttempt } from "./speech/grader";
import { knownVocabulary } from "./writing/content";
import {
  evaluateGuidedWriting,
  evaluateSimpleForm,
  type WritingEvaluation,
} from "./writing/rubric";

export type Status = "none" | "correct" | "wrong";

/**
 * A finished speech attempt as a submittable answer (P8 §12): the
 * recognizer's FINAL n-best transcripts, plus whether practice assistance
 * (contextual bias, a revealed target) was active when it was recorded —
 * consumed by the evidence layer, never by grading itself.
 */
export type SpokenAnswer = {
  spoken: true;
  finalTranscript: string;
  alternatives: string[];
  assisted: boolean;
};

/**
 * A written-production submission (P9 §14): free text for guidedWriting,
 * per-field values for simpleForm. Grading itself is the deterministic
 * tri-state rubric engine; the boolean checkAnswer contract maps
 * meets_rubric → true and everything else → false, while scored surfaces
 * read the full evaluation to route insufficiently_scorable to the
 * no-evidence path (§17).
 */
export type WrittenAnswer =
  | { written: true; kind: "text"; text: string }
  | { written: true; kind: "form"; values: Record<string, string> };

/**
 * A finished interaction scenario as a submittable answer (P9 §36-37):
 * the deterministic engine's whole-scenario result. "Correct" means the
 * communicative goal was met AND every scored turn matched on its first
 * judged final; an unfinished (technically incomplete) run is routed to
 * the no-evidence skip path by scored surfaces, never graded.
 */
export type InteractionAnswer = {
  interaction: true;
  goalMet: boolean;
  passedFirstTry: boolean;
  scoredTurns: number;
  matchedFirstTry: number;
  supportUsed: number;
  repairMoves: number;
  technicallyIncomplete: boolean;
};

export type Answer =
  | number
  | number[]
  | string
  | SpokenAnswer
  | WrittenAnswer
  | InteractionAnswer
  | null;

export function isSpokenAnswer(answer: Answer): answer is SpokenAnswer {
  return (
    typeof answer === "object" &&
    answer !== null &&
    !Array.isArray(answer) &&
    (answer as { spoken?: unknown }).spoken === true
  );
}

export function isInteractionAnswer(answer: Answer): answer is InteractionAnswer {
  return (
    typeof answer === "object" &&
    answer !== null &&
    !Array.isArray(answer) &&
    (answer as { interaction?: unknown }).interaction === true
  );
}

export function isWrittenAnswer(answer: Answer): answer is WrittenAnswer {
  return (
    typeof answer === "object" &&
    answer !== null &&
    !Array.isArray(answer) &&
    (answer as { written?: unknown }).written === true
  );
}

/** Full tri-state evaluation for a writing step (renderer + scored routing). */
export function evaluateWrittenAnswer(
  exercise: GuidedWritingExercise | SimpleFormExercise,
  answer: Answer,
  courseId: string
): WritingEvaluation | null {
  if (!isWrittenAnswer(answer)) return null;
  const rules = languageRulesForCourse(courseId);
  const targetLanguage = courseProfile(courseId).targetLanguage;
  if (exercise.type === "guidedWriting") {
    if (answer.kind !== "text") return null;
    return evaluateGuidedWriting({
      rules,
      targetLanguage,
      text: answer.text,
      rubric: exercise.rubric,
      promptText: [
        exercise.instruction,
        ...(exercise.cueFacts ?? []).flatMap((cue) => [cue.label, cue.value]),
      ].join(" "),
      knownVocabulary: knownVocabulary(courseId),
      mode: exercise.writingMode,
    });
  }
  if (answer.kind !== "form") return null;
  return evaluateSimpleForm({
    rules,
    targetLanguage,
    values: answer.values,
    fields: exercise.fields,
    rubric: exercise.rubric,
  });
}

/**
 * Generic lenient typed-answer form (the Latin defaults every plugin
 * inherits; French-identical). Session grading goes through the course's
 * language rules — this export stays for callers without a course.
 */
export function normalize(text: string) {
  return normalizeLenientLatin(text);
}

/**
 * STRICT comparison for grammar production (conjugationCloze, dictation):
 * apostrophe/space variants unified and case-insensitive, but accents and
 * exact inflection are preserved — "mange" ≠ "mangé" ≠ "manges" here.
 */
export function strictEquals(a: string, b: string, courseId?: string): boolean {
  const fold = courseId === undefined ? normalizeStrictLatin : languageRulesForCourse(courseId).normalizeStrict;
  return fold(a) === fold(b);
}

/**
 * Grade a submitted answer under the course's language rules. `courseId`
 * "" (bare reducer tests) falls back to the Latin defaults, which are
 * identical to the French rules for every typed-answer comparison.
 */
export function checkAnswer(exercise: Exercise, answer: Answer, courseId: string): boolean {
  const rules = languageRulesForCourse(courseId);
  switch (exercise.type) {
    case "select":
    case "fillBlank":
    case "articleSelect":
      return answer === exercise.correct;
    case "wordBank": {
      if (!Array.isArray(answer)) return false;
      const attempt = answer.map((i) => exercise.tokens[i]).join(" ");
      return rules.normalizeLenient(attempt) === rules.normalizeLenient(exercise.answer.join(" "));
    }
    case "typeAnswer": {
      if (typeof answer !== "string") return false;
      const attempt = rules.normalizeLenient(answer);
      return [exercise.answer, ...exercise.alternatives].some(
        (a) => rules.normalizeLenient(a) === attempt
      );
    }
    case "conjugationCloze":
    case "dictation": {
      // Dictation shares the strict contract (P7 §63): orthographic
      // decoding is the construct, so accents and exact forms matter.
      if (typeof answer !== "string") return false;
      return [exercise.answer, ...exercise.alternatives].some(
        (a) => rules.normalizeStrict(a) === rules.normalizeStrict(answer)
      );
    }
    case "listeningComprehension":
    case "readingComprehension":
      return answer === exercise.correct;
    case "match":
      return answer === "done";
    case "speakRepetition":
    case "speakProduction":
      // Deterministic spoken grading (P8 §12) over the FINAL n-best only.
      if (!isSpokenAnswer(answer)) return false;
      return gradeSpokenAttempt(
        answer,
        {
          acceptedVariants: exercise.acceptedVariants,
          requiredConcepts: exercise.requiredConcepts,
        },
        rules
      ).correct;
    case "guidedWriting":
    case "simpleForm":
      // Tri-state collapses honestly here: only meets_rubric is "correct";
      // insufficiently_scorable is routed to no-evidence by the scored
      // surfaces BEFORE this boolean is recorded (§17).
      return evaluateWrittenAnswer(exercise, answer, courseId)?.verdict === "meets_rubric";
    case "interactionScenario":
      // §37: goal met AND clean first-judgment turns; incomplete runs are
      // never graded (scored surfaces skip them before this boolean).
      return (
        isInteractionAnswer(answer) &&
        !answer.technicallyIncomplete &&
        answer.goalMet &&
        answer.passedFirstTry
      );
  }
}

export function correctAnswerText(exercise: Exercise): string {
  switch (exercise.type) {
    case "select":
      return exercise.options[exercise.correct].text;
    case "fillBlank":
      return exercise.sentence.replace("___", exercise.options[exercise.correct]);
    case "articleSelect":
      return `${exercise.articles[exercise.correct]} ${exercise.noun}`;
    case "wordBank":
      return exercise.answer.join(" ");
    case "typeAnswer":
      return exercise.answer;
    case "conjugationCloze":
      return exercise.sentence.replace("___", exercise.answer);
    case "dictation":
      return exercise.answer;
    case "listeningComprehension":
    case "readingComprehension":
      return exercise.options[exercise.correct].text;
    case "match":
      return "";
    case "speakRepetition":
    case "speakProduction":
      return exercise.target;
    case "guidedWriting":
    case "simpleForm":
      return exercise.modelAnswers[0];
    case "interactionScenario":
      return ""; // there is no single "correct sentence" for a conversation
  }
}

export function answerIsReady(exercise: Exercise, answer: Answer): boolean {
  switch (exercise.type) {
    case "select":
    case "fillBlank":
    case "articleSelect":
      return typeof answer === "number";
    case "wordBank":
      return Array.isArray(answer) && answer.length > 0;
    case "typeAnswer":
    case "conjugationCloze":
    case "dictation":
      return typeof answer === "string" && answer.trim().length > 0;
    case "listeningComprehension":
    case "readingComprehension":
      return typeof answer === "number";
    case "match":
      return answer === "done";
    case "speakRepetition":
    case "speakProduction":
      return isSpokenAnswer(answer);
    case "guidedWriting":
      return (
        isWrittenAnswer(answer) && answer.kind === "text" && answer.text.trim().length > 0
      );
    case "simpleForm":
      return (
        isWrittenAnswer(answer) &&
        answer.kind === "form" &&
        Object.values(answer.values).some((v) => v.trim().length > 0)
      );
    case "interactionScenario":
      // The step resolves only when the scenario reached a terminal.
      return isInteractionAnswer(answer) && !answer.technicallyIncomplete;
  }
}

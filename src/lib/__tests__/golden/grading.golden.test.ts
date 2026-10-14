/**
 * Grading goldens (P1a): a table of `answerIsReady` / `checkAnswer` /
 * `correctAnswerText` verdicts for the first authored exercise of every
 * type in the French course, over five inputs each (correct, wrong, empty,
 * a near miss, an alternative form). Pure functions, no clock.
 */
import { describe, test } from "bun:test";

import { answerIsReady, checkAnswer, correctAnswerText, normalize, type Answer } from "../../grading";
import type { Exercise } from "../../types";
import { correctAnswerFor, expectGolden, frPack, wrongAnswerFor } from "./helpers";

/** First authored exercise per type, in path order. */
function firstPerType(): Exercise[] {
  const seen = new Map<Exercise["type"], Exercise>();
  for (const section of frPack.sections) {
    for (const unit of section.units) {
      for (const lesson of unit.lessons) {
        for (const e of lesson.exercises) if (!seen.has(e.type)) seen.set(e.type, e);
      }
    }
  }
  return [...seen.values()];
}

function nearMiss(exercise: Exercise): Answer {
  const correct = correctAnswerFor(exercise);
  if (typeof correct === "string") return correct.toUpperCase().replace(/É/g, "E").replace(/È/g, "E") + " ";
  if (typeof correct === "number") return -1;
  if (Array.isArray(correct)) return correct.slice(0, -1);
  if (correct && typeof correct === "object" && "spoken" in correct) {
    return { ...correct, finalTranscript: correct.finalTranscript.split(" ").slice(0, -1).join(" ") };
  }
  if (correct && typeof correct === "object" && "written" in correct && correct.kind === "text") {
    return { ...correct, text: correct.text.slice(0, Math.max(3, correct.text.length - 4)) };
  }
  if (correct && typeof correct === "object" && "written" in correct && correct.kind === "form") {
    const keys = Object.keys(correct.values);
    return { ...correct, values: Object.fromEntries(keys.slice(0, -1).map((k) => [k, correct.values[k]])) };
  }
  return correct;
}

function alternative(exercise: Exercise): Answer {
  switch (exercise.type) {
    case "typeAnswer":
    case "conjugationCloze":
    case "dictation":
      return exercise.alternatives[0] ?? normalize(exercise.answer);
    case "speakRepetition":
    case "speakProduction":
      return { spoken: true, finalTranscript: exercise.acceptedVariants[1] ?? exercise.target, alternatives: [exercise.target], assisted: false };
    case "guidedWriting":
      return { written: true, kind: "text", text: exercise.modelAnswers[1] ?? exercise.modelAnswers[0] ?? "" };
    case "simpleForm": {
      const base = correctAnswerFor(exercise) as { written: true; kind: "form"; values: Record<string, string> };
      return { ...base, values: Object.fromEntries(Object.entries(base.values).map(([k, v]) => [k, ` ${v.toLowerCase()} `])) };
    }
    case "wordBank":
      return (correctAnswerFor(exercise) as number[]).map((i) => i);
    default:
      return correctAnswerFor(exercise);
  }
}

describe("grading goldens (fr-en)", () => {
  test("every exercise type × five inputs", () => {
    const rows = firstPerType().map((exercise) => {
      const inputs: Record<string, Answer> = {
        correct: correctAnswerFor(exercise),
        wrong: wrongAnswerFor(exercise),
        empty: exercise.type === "wordBank" ? [] : exercise.type === "match" ? null : typeof correctAnswerFor(exercise) === "string" ? "" : null,
        nearMiss: nearMiss(exercise),
        alternative: alternative(exercise),
      };
      return {
        id: exercise.id,
        type: exercise.type,
        correctAnswerText: correctAnswerText(exercise),
        verdicts: Object.fromEntries(
          Object.entries(inputs).map(([label, answer]) => [
            label,
            { answer, ready: answerIsReady(exercise, answer), correct: checkAnswer(exercise, answer, "fr-en") },
          ])
        ),
      };
    });
    expectGolden("grading/table", rows);
  });
});

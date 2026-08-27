/**
 * Single dispatch point from an exercise step to its renderer — the five
 * per-type branches that used to live inline in the lesson route. Behavior
 * metadata (grading, readiness, modality) lives in src/lib/exercise-registry;
 * this module owns only JSX.
 */

import React from "react";

import { ArticleSelect } from "@/components/exercises/article-select";
import { ConjugationCloze } from "@/components/exercises/conjugation-cloze";
import { FillBlank } from "@/components/exercises/fill-blank";
import { Match } from "@/components/exercises/match";
import { Select } from "@/components/exercises/select";
import { TypeAnswer } from "@/components/exercises/type-answer";
import { WordBank } from "@/components/exercises/word-bank";
import { speakTarget } from "@/lib/audio";
import type { Answer, Status } from "@/lib/grading";
import type { Exercise } from "@/lib/types";

export function ExerciseRenderer({
  exercise,
  answer,
  status,
  courseId,
  targetLanguage,
  onAnswer,
  onMatchComplete,
  onMatchWordResult,
}: {
  exercise: Exercise;
  answer: Answer;
  status: Status;
  courseId: string;
  targetLanguage: string;
  onAnswer: (value: Answer) => void;
  onMatchComplete: (wrongAttempts: number) => void;
  onMatchWordResult: (target: string, correct: boolean) => void;
}) {
  switch (exercise.type) {
    case "select":
      return (
        <Select
          exercise={exercise}
          answer={typeof answer === "number" ? answer : null}
          onAnswer={onAnswer}
          status={status}
          targetLanguage={targetLanguage}
        />
      );
    case "wordBank":
      return (
        <WordBank
          exercise={exercise}
          answer={Array.isArray(answer) ? answer : []}
          onAnswer={onAnswer}
          status={status}
        />
      );
    case "match":
      return (
        <Match
          exercise={exercise}
          onComplete={onMatchComplete}
          onWordResult={onMatchWordResult}
          onSpeak={(target) => speakTarget(courseId, target)}
        />
      );
    case "typeAnswer":
      return (
        <TypeAnswer
          exercise={exercise}
          answer={typeof answer === "string" ? answer : ""}
          onAnswer={onAnswer}
          status={status}
          targetLanguage={targetLanguage}
        />
      );
    case "fillBlank":
      return (
        <FillBlank
          exercise={exercise}
          answer={typeof answer === "number" ? answer : null}
          onAnswer={onAnswer}
          status={status}
        />
      );
    case "articleSelect":
      return (
        <ArticleSelect
          exercise={exercise}
          answer={typeof answer === "number" ? answer : null}
          onAnswer={onAnswer}
          status={status}
        />
      );
    case "conjugationCloze":
      return (
        <ConjugationCloze
          exercise={exercise}
          answer={typeof answer === "string" ? answer : ""}
          onAnswer={onAnswer}
          status={status}
        />
      );
  }
}

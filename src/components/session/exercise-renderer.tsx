/**
 * Single dispatch point from an exercise step to its renderer — the five
 * per-type branches that used to live inline in the lesson route. Behavior
 * metadata (grading, readiness, modality) lives in src/lib/exercise-registry;
 * this module owns only JSX.
 */

import React from "react";

import { ArticleSelect } from "@/components/exercises/article-select";
import { ConjugationCloze } from "@/components/exercises/conjugation-cloze";
import { Dictation } from "@/components/exercises/dictation";
import { FillBlank } from "@/components/exercises/fill-blank";
import { ListeningComprehension } from "@/components/exercises/listening-comprehension";
import { Match } from "@/components/exercises/match";
import { ReadingComprehension } from "@/components/exercises/reading-comprehension";
import { Select } from "@/components/exercises/select";
import { SpeakProduction } from "@/components/exercises/speak-production";
import { SpeakRepetition } from "@/components/exercises/speak-repetition";
import { TypeAnswer } from "@/components/exercises/type-answer";
import { WordBank } from "@/components/exercises/word-bank";
import { speakTarget } from "@/lib/audio";
import type { Answer, Status } from "@/lib/grading";
import { clipAudioSource, clipFor } from "@/lib/reception/content";
import { useListeningPlayer } from "@/lib/reception/use-listening-player";
import type { SpeechExerciseContext } from "@/lib/speech/use-speech-session";
import type {
  DictationExercise,
  Exercise,
  ListeningComprehensionExercise,
} from "@/lib/types";

/**
 * Reception rendering context (P7 §66-71): scored sessions cap plays at the
 * clip's authored policy and forbid slow mode; learning is uncapped with
 * slow available. Transcript reveal and the audio-skip affordance are the
 * session screen's calls.
 */
export type ReceptionContext = {
  scored: boolean;
  revealTranscript: boolean;
  onAudioSkip?: () => void;
};

function ListeningComprehensionStep({
  exercise,
  answer,
  status,
  reception,
  onAnswer,
}: {
  exercise: ListeningComprehensionExercise;
  answer: number | null;
  status: Status;
  reception: ReceptionContext;
  onAnswer: (value: Answer) => void;
}) {
  const clip = clipFor(exercise.clipId);
  const player = useListeningPlayer(clipAudioSource(exercise.clipId), {
    maxPlays: reception.scored ? (clip?.scoredPlaybackPolicy.maxPlays ?? 2) : null,
    allowSlow: !reception.scored,
  });
  return (
    <ListeningComprehension
      exercise={exercise}
      answer={answer}
      status={status}
      player={player}
      showTranscript={reception.revealTranscript && status !== "none"}
      onAnswer={onAnswer}
      onAudioUnavailable={status === "none" ? reception.onAudioSkip : undefined}
    />
  );
}

function DictationStep({
  exercise,
  answer,
  status,
  reception,
  onAnswer,
}: {
  exercise: DictationExercise;
  answer: string | null;
  status: Status;
  reception: ReceptionContext;
  onAnswer: (value: Answer) => void;
}) {
  const clip = clipFor(exercise.clipId);
  const player = useListeningPlayer(clipAudioSource(exercise.clipId), {
    maxPlays: reception.scored ? (clip?.scoredPlaybackPolicy.maxPlays ?? 2) : null,
    allowSlow: !reception.scored,
  });
  return (
    <Dictation
      exercise={exercise}
      answer={answer}
      status={status}
      player={player}
      onAnswer={onAnswer}
      onAudioUnavailable={status === "none" ? reception.onAudioSkip : undefined}
    />
  );
}

export function ExerciseRenderer({
  exercise,
  answer,
  status,
  courseId,
  targetLanguage,
  onAnswer,
  onMatchComplete,
  onMatchWordResult,
  reception,
  speech,
}: {
  exercise: Exercise;
  answer: Answer;
  status: Status;
  courseId: string;
  targetLanguage: string;
  onAnswer: (value: Answer) => void;
  onMatchComplete: (wrongAttempts: number) => void;
  onMatchWordResult: (target: string, correct: boolean) => void;
  /** Required whenever reception exercise types can appear (French). */
  reception?: ReceptionContext;
  /** Required whenever speak exercise types can appear (French, P8). */
  speech?: SpeechExerciseContext;
}) {
  const receptionCtx: ReceptionContext =
    reception ?? { scored: false, revealTranscript: true };
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
    case "listeningComprehension":
      return (
        <ListeningComprehensionStep
          exercise={exercise}
          answer={typeof answer === "number" ? answer : null}
          status={status}
          reception={receptionCtx}
          onAnswer={onAnswer}
        />
      );
    case "readingComprehension":
      return (
        <ReadingComprehension
          exercise={exercise}
          answer={typeof answer === "number" ? answer : null}
          status={status}
          allowGloss={!receptionCtx.scored}
          onAnswer={onAnswer}
        />
      );
    case "dictation":
      return (
        <DictationStep
          exercise={exercise}
          answer={typeof answer === "string" ? answer : null}
          status={status}
          reception={receptionCtx}
          onAnswer={onAnswer}
        />
      );
    case "speakRepetition":
      // Without a session speech context there is no recognizer to drive —
      // render nothing rather than a dead control (steps stay skippable).
      if (!speech) return null;
      return (
        <SpeakRepetition
          key={exercise.id}
          exercise={exercise}
          answer={answer}
          status={status}
          speech={speech}
          onAnswer={onAnswer}
        />
      );
    case "speakProduction":
      if (!speech) return null;
      return (
        <SpeakProduction
          key={exercise.id}
          exercise={exercise}
          answer={answer}
          status={status}
          speech={speech}
          onAnswer={onAnswer}
        />
      );
  }
}

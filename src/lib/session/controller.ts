/**
 * Session controller (Phase 3): the thin React layer between the pure
 * session reducer and the world. Owns ONLY side effects — sound, haptics,
 * speech, evidence submission, mistakes bookkeeping, completion policy,
 * AppState-aware latency — and delegates every session rule to the reducer.
 */

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { AppState } from "react-native";

import { speakTarget, useSfx } from "../audio";
import { behaviorFor } from "../exercise-registry";
import { isSpokenAnswer } from "../grading";
import { haptics } from "../haptics";
import { useProgress, XP_PER_LESSON } from "../store";

import { buildCheckpointAttempt } from "../assessment/checkpoint";
import { buildCheckEvidence, buildMatchWordEvidence } from "./evidence";
import {
  currentStep,
  emptySessionState,
  isPerfect,
  sessionReducer,
  type SessionMachineState,
} from "./reducer";
import {
  isActiveAppState,
  pauseClock,
  readClockMs,
  resumeClock,
  startClock,
} from "./timing";
import type { SessionDefinition } from "./types";

function newSessionId(): string {
  return `s-${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffffffff).toString(36)}`;
}

export type SessionController = {
  state: SessionMachineState;
  definition: SessionDefinition;
  /** True right after an answer that mutated the FSRS scheduler. */
  lastMutated: boolean;
  /** Scheduler mutations so far (undo-adjusted) — drives TODAY XP. */
  assessmentsCompleted: number;
  onAnswer: (value: SessionMachineState["answer"]) => void;
  onCheck: () => void;
  /** "I don't know" (§117) — placement only; records a declared gap. */
  onSkip: () => void;
  onContinue: () => void;
  onTeachContinue: () => void;
  onMatchComplete: (wrongAttempts: number) => void;
  onMatchWordResult: (surface: string, correct: boolean) => void;
  onUndo: () => void;
};

export function useSessionController(definition: SessionDefinition): SessionController {
  const progress = useProgress();
  const sfx = useSfx();
  const [state, dispatch] = useReducer(sessionReducer, undefined, emptySessionState);
  const [lastMutated, setLastMutated] = useState(false);
  const [assessmentsCompleted, setAssessmentsCompleted] = useState(0);
  const clockRef = useRef(startClock(0));
  const startedAtRef = useRef(0);
  const finishedRef = useRef(false);

  // One session per definition: identity, plan and timers reset together.
  // The definition is frozen by the route (memo over a state snapshot), so
  // store writes made DURING the session never re-run this.
  useEffect(() => {
    dispatch({
      type: "start",
      sessionId: newSessionId(),
      steps: definition.steps,
      retryPolicy: definition.retryPolicy ?? "untilCorrect",
    });
    clockRef.current = startClock(Date.now());
    startedAtRef.current = Date.now();
    finishedRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLastMutated(false);
    setAssessmentsCompleted(0);
  }, [definition]);

  // Active-time latency: background/inactive time never counts (§19).
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      clockRef.current = isActiveAppState(next)
        ? resumeClock(clockRef.current, Date.now())
        : pauseClock(clockRef.current, Date.now());
    });
    return () => sub.remove();
  }, []);

  // Completion policy — runs exactly once when the machine finishes.
  const { finished } = state;
  useEffect(() => {
    if (!finished || finishedRef.current || state.steps.length === 0) return;
    finishedRef.current = true;
    if (definition.completion === "lesson") {
      progress.completeLesson(definition.lessonId, isPerfect(state));
    } else if (definition.completion === "practice") {
      progress.recordPracticeSession();
    } else if (definition.completion === "checkpoint") {
      // Assessment record only (§59): zero XP, no streak, no completion.
      if (definition.assessment) {
        progress.recordCheckpointAttempt(
          buildCheckpointAttempt({
            plan: definition.assessment,
            firstResults: state.firstResults,
            startedAt: startedAtRef.current,
            completedAt: Date.now(),
          })
        );
      }
    } else if (definition.completion === "placement") {
      // The placement route reads the machine state and stores the result
      // itself; completing here must mutate nothing (§78).
    } else {
      progress.completeTodaySession(
        Math.min(assessmentsCompleted, XP_PER_LESSON)
      );
    }
    sfx.playFinish();
    haptics.celebrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const latencyNow = () => readClockMs(clockRef.current, Date.now());
  const resetClock = () => {
    clockRef.current = startClock(Date.now());
  };

  const onAnswer = useCallback<SessionController["onAnswer"]>((value) => {
    dispatch({ type: "answer", value });
  }, []);

  const onCheck = useCallback(() => {
    const step = currentStep(state);
    if (!step || step.type !== "exercise" || state.status !== "idle") return;
    const behavior = behaviorFor(step.exercise);
    const correct = behavior.check(step.exercise, state.answer);

    const scored = definition.kind === "checkpoint" || definition.kind === "placement";
    // Minimal feedback (§118) hides the verdict — the sound and haptic must
    // not reveal what the screen deliberately withholds.
    const silentVerdict = definition.feedbackPolicy === "minimal";
    if (correct) {
      if (silentVerdict) {
        haptics.tap();
      } else {
        sfx.playCorrect();
        haptics.success();
      }
      // Scored assessments never touch the mistakes system, either way (§58).
      if (!scored) progress.clearMistake(step.exercise.id);
    } else {
      if (silentVerdict) {
        haptics.tap();
      } else {
        sfx.playIncorrect();
        haptics.error();
      }
      if (definition.trackMistakes) {
        progress.addMistake({
          lessonId: definition.lessonId,
          exerciseId: step.exercise.id,
        });
      }
    }

    const evidence = buildCheckEvidence({
      definition,
      step,
      sessionId: state.sessionId,
      correct,
      attemptIndex: state.attempts[step.stepId] ?? 0,
      latencyMs: Math.max(0, latencyNow()),
      assisted: isSpokenAnswer(state.answer) ? state.answer.assisted : false,
    });
    if (evidence) {
      const mutated = progress.submitEvidence(evidence);
      setLastMutated(mutated);
      if (mutated) setAssessmentsCompleted((n) => n + 1);
    } else {
      setLastMutated(false);
    }

    if (
      correct &&
      !silentVerdict &&
      step.exercise.type === "select" &&
      step.exercise.mode === "nativeToTarget" &&
      step.exercise.audioTarget
    ) {
      speakTarget(definition.courseId, step.exercise.audioTarget);
    }

    dispatch({ type: "check" });
  }, [state, definition, progress, sfx]);

  const onSkip = useCallback(() => {
    // Declared-unknown (§117) and the audio-unavailable escape (P7 §69-70,
    // §81): allowed in placement, and on audio-dependent steps everywhere —
    // a learner without audio continues without penalty; in checkpoints the
    // skipped item simply yields insufficient evidence (P7 §104), and no
    // learning memory mutates anywhere.
    const step = currentStep(state);
    if (!step || step.type !== "exercise" || state.status !== "idle") return;
    const audioDependent =
      step.exercise.type === "listeningComprehension" || step.exercise.type === "dictation";
    if (definition.kind !== "placement" && !audioDependent) return;
    haptics.tap();
    resetClock();
    dispatch({ type: "skip" });
  }, [state, definition]);

  const onContinue = useCallback(() => {
    setLastMutated(false);
    resetClock();
    dispatch({ type: "continue" });
  }, []);

  const onTeachContinue = useCallback(() => {
    resetClock();
    dispatch({ type: "teachContinue" });
  }, []);

  const onMatchComplete = useCallback(
    (wrongAttempts: number) => {
      const step = currentStep(state);
      if (!step || step.type !== "exercise") return;
      if (wrongAttempts > 0) {
        sfx.playIncorrect();
        if (definition.trackMistakes) {
          progress.addMistake({
            lessonId: definition.lessonId,
            exerciseId: step.exercise.id,
          });
        }
      } else {
        sfx.playCorrect();
        progress.clearMistake(step.exercise.id);
      }
      resetClock();
      dispatch({ type: "matchComplete", wrongAttempts });
    },
    [state, definition, progress, sfx]
  );

  const onMatchWordResult = useCallback(
    (surface: string, correct: boolean) => {
      const step = currentStep(state);
      if (!step || step.type !== "exercise") return;
      progress.submitEvidence(
        buildMatchWordEvidence({
          definition,
          step,
          sessionId: state.sessionId,
          surface,
          correct,
          attemptIndex: state.attempts[step.stepId] ?? 0,
          latencyMs: Math.max(0, latencyNow()),
        })
      );
    },
    [state, definition, progress]
  );

  const onUndo = useCallback(() => {
    if (!definition.allowUndo || !lastMutated) return;
    if (!progress.undoLastFrenchReview()) return;
    setLastMutated(false);
    setAssessmentsCompleted((n) => Math.max(0, n - 1));
    resetClock();
    dispatch({ type: "undoCurrent" });
  }, [definition, lastMutated, progress]);

  return {
    state,
    definition,
    lastMutated,
    assessmentsCompleted,
    onAnswer,
    onCheck,
    onSkip,
    onContinue,
    onTeachContinue,
    onMatchComplete,
    onMatchWordResult,
    onUndo,
  };
}

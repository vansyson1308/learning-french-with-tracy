/**
 * Speech step policy (P8 §11/§13/§14/§23-25) — pure decisions the two
 * speak renderers must not improvise:
 *
 *  - repetition PRACTICE: model + target text visible, partials allowed, always
 *    assisted, never scored;
 *  - elicited PRODUCTION: no target text, no model, no partials before grading;
 *    learning may reveal the target after N non-matching recordings (the
 *    attempt is then assisted) and play the model only AFTER grading;
 *  - scored: nothing but the cue before submission, bounded recording
 *    attempts, browser speech never scored;
 *  - honest, non-punitive wording for every non-final outcome.
 */

import type { SpeakProductionExercise, SpeakRepetitionExercise } from "../types";
import { msg, type Message } from "../i18n/message";
import type { SpeechCapability, SpeechOutcome } from "./types";

export type SpeakExercise = SpeakRepetitionExercise | SpeakProductionExercise;

export type SpeakStepContext = { scored: boolean };

/** May the target text be visible right now? */
export function showTarget(
  exercise: SpeakExercise,
  ctx: SpeakStepContext,
  state: { wrongFinals: number; answered: boolean }
): boolean {
  if (exercise.type === "speakRepetition") return true; // practice construct
  if (state.answered) return true; // grading is done; the footer names it anyway
  if (ctx.scored) return false; // NEVER before a scored submission (§13)
  const reveal = exercise.revealTargetAfterAttempts;
  return reveal !== null && state.wrongFinals >= reveal;
}

/** May the model clip play right now? (§10/§18: never during scored capture) */
export function canPlayModel(
  exercise: SpeakExercise,
  ctx: SpeakStepContext,
  state: { answered: boolean }
): boolean {
  if (exercise.type === "speakRepetition") return true; // the model IS the stimulus
  if (exercise.modelClipId === null || ctx.scored) return false;
  return state.answered; // learning: only after the graded attempt
}

/** Adapter attempt mode: "practice" unlocks interim results + bias (§13). */
export function attemptMode(
  exercise: SpeakExercise,
  ctx: SpeakStepContext
): "practice" | "scored" {
  if (ctx.scored) return "scored";
  if (exercise.type === "speakRepetition") return "practice";
  return exercise.allowContextualBias ? "practice" : "scored";
}

/** Contextual bias strings for the attempt — a practice affordance only. */
export function contextualStringsFor(
  exercise: SpeakExercise,
  ctx: SpeakStepContext
): string[] | undefined {
  if (ctx.scored) return undefined;
  if (exercise.type === "speakRepetition") return [exercise.target];
  return exercise.allowContextualBias ? [exercise.target] : undefined;
}

/** Live partial transcript display: repetition practice only. */
export function showPartials(exercise: SpeakExercise, ctx: SpeakStepContext): boolean {
  return !ctx.scored && exercise.type === "speakRepetition";
}

/** "I heard: …" before Check: learning yes, scored never (§13). */
export function showHeardBeforeCheck(ctx: SpeakStepContext): boolean {
  return !ctx.scored;
}

/** Recording starts allowed for this step; null = unlimited (learning). */
export function recordingBudget(
  exercise: SpeakExercise,
  ctx: SpeakStepContext
): number | null {
  if (!ctx.scored) return null;
  // A scored repetition cannot exist (pipeline-rejected); fail safe anyway.
  return exercise.type === "speakProduction" ? exercise.allowedAttempts : 1;
}

/**
 * Whether the attempt being started counts as ASSISTED (§13): assisted
 * production is logged but can never become positive speak evidence.
 */
export function attemptAssisted(
  exercise: SpeakExercise,
  ctx: SpeakStepContext,
  state: { targetVisibleAtStart: boolean }
): boolean {
  if (exercise.type === "speakRepetition") return true;
  return contextualStringsFor(exercise, ctx) !== undefined || state.targetVisibleAtStart;
}

/** Honest wording for a non-final outcome (§14); null = say nothing. */
export function outcomeNotice(
  outcome: SpeechOutcome | null
): { retryable: boolean; message: Message } | null {
  if (outcome === null || outcome.kind === "final") return null;
  switch (outcome.kind) {
    case "no_speech":
      return {
        retryable: true,
        message: msg("speech.outcome.noSpeech"),
      };
    case "permission_denied":
      return {
        retryable: false,
        message: msg("speech.outcome.permissionDenied"),
      };
    case "aborted":
      return null; // the learner's own action needs no commentary
    case "technical":
      switch (outcome.reason) {
        case "backgrounded":
          return {
            retryable: true,
            message: msg("speech.outcome.backgrounded"),
          };
        case "network_failed":
          return {
            retryable: true,
            message: msg("speech.outcome.networkNeeded"),
          };
        default:
          return {
            retryable: true,
            message: msg("speech.outcome.failed"),
          };
      }
  }
}

export type SpeechGate =
  | { kind: "probing" }
  | { kind: "ready" }
  /** Permissions undetermined: show the rationale and a request button (§24). */
  | { kind: "needsPermission" }
  | { kind: "blocked"; reason: "permission" | "unavailable" | "noTargetLanguage" };

/** Point-of-use capability gate for a speak step (§24/§25). */
export function gateFor(
  capability: SpeechCapability | null,
  ctx: SpeakStepContext
): SpeechGate {
  if (capability === null) return { kind: "probing" };
  if (!capability.available) return { kind: "blocked", reason: "unavailable" };
  // Scored production NEVER depends on browser speech (§25).
  if (ctx.scored && capability.platform === "web") {
    return { kind: "blocked", reason: "unavailable" };
  }
  if (!capability.targetRecognitionAvailable) return { kind: "blocked", reason: "noTargetLanguage" };
  const mic = capability.microphonePermission;
  const speech = capability.speechPermission;
  if (mic === "granted" && speech === "granted") return { kind: "ready" };
  if (mic === "undetermined" || speech === "undetermined") return { kind: "needsPermission" };
  return { kind: "blocked", reason: "permission" };
}

/** Copy for a blocked gate — plain, honest, with the path forward. */
export function gateMessage(gate: SpeechGate, targetLanguage: string): Message | null {
  if (gate.kind !== "blocked") return null;
  switch (gate.reason) {
    case "unavailable":
      return msg("speech.gate.unavailable");
    case "noTargetLanguage":
      return msg("speech.gate.noTargetLanguage", { language: targetLanguage });
    case "permission":
      return msg("speech.gate.permission");
  }
}

/**
 * Network-backed recognition disclosure (P9 §7): when the SYSTEM recognizer
 * may process speech over the network because no offline target-language model is
 * proven installed, the learner is told once — before their first recording,
 * not buried in a policy document and not repeated on every question.
 * Pure rule; the acknowledgement flag lives in the persisted store.
 */
export function networkDisclosureRequired(
  capability: SpeechCapability | null,
  acknowledged: boolean
): boolean {
  if (acknowledged || capability === null) return false;
  return (
    capability.available &&
    capability.targetRecognitionAvailable &&
    capability.networkBackedRecognitionPossible &&
    !capability.targetOnDeviceModelInstalled
  );
}

/** Honest wording for the §7 disclosure — facts only, no scare copy. */
export function networkDisclosureText(targetLanguage: string): Message {
  return msg("speech.disclosure", { language: targetLanguage });
}

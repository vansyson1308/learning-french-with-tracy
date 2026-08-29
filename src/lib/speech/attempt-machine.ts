/**
 * Speech attempt state machine (P8 §9) — pure, following the Phase-7
 * listening-player precedent. One machine instance = one attempt with a
 * stable attemptId; the adapter stamps every native event with the attempt
 * id it belongs to, and anything stale is ignored here by construction.
 *
 * Invariants carried by this module:
 *  - a terminal state is terminal: no event can double-finalize;
 *  - a PARTIAL transcript is display-only state, never an outcome;
 *  - stop without a final result is a TECHNICAL outcome (the Android
 *    rapid-stop race), enforced by the finalize timeout and by "end"
 *    handling — the last partial is never promoted;
 *  - silence ("no-speech"/"nomatch") is its own outcome, distinguishable
 *    from a wrong recognized answer AND from hard technical failure;
 *  - backgrounding/interruption/abort produce no learner evidence.
 */

import type { SpeechOutcome, SpeechRecognitionResult } from "./types";

export type AttemptPhase =
  | "idle"
  | "starting"
  | "recording"
  | "stopping"
  | "finalized";

export type AttemptState = {
  attemptId: string;
  phase: AttemptPhase;
  /** Practice-only display of what the engine is hearing; never graded. */
  lastPartialTranscript: string | null;
  /** Milliseconds timestamp of the recording start (audio flowing). */
  recordingStartedAt: number | null;
  outcome: SpeechOutcome | null;
};

/** Error codes as normalized by the adapter (provider-agnostic). */
export type AttemptErrorCode =
  | "no-speech"
  | "aborted"
  | "interrupted"
  | "not-allowed"
  | "service-not-allowed"
  | "language-not-supported"
  | "network"
  | "busy"
  | "audio-capture"
  | "client"
  | "unknown";

export type AttemptEvent =
  /** Native: recognition session actually started. */
  | { type: "started"; at: number }
  /** Native: a partial (non-final) transcript. */
  | { type: "partial"; transcript: string }
  /** Native: THE final n-best result. */
  | { type: "final"; result: SpeechRecognitionResult }
  /** Native: terminal error. */
  | { type: "error"; code: AttemptErrorCode }
  /** Native: session ended (always after any verdict on both platforms). */
  | { type: "end" }
  /** UI: learner tapped stop — await the engine's final result. */
  | { type: "stopRequested" }
  /** UI/system: abandon the attempt; no evidence of any kind. */
  | { type: "abortRequested" }
  /** App lifecycle: backgrounded mid-attempt — technical, no penalty. */
  | { type: "backgrounded" }
  /** Timer: the engine failed to finalize after stop within the budget. */
  | { type: "finalizeTimeout" };

/** How long stop() may wait for the engine's final before failing closed. */
export const FINALIZE_TIMEOUT_MS = 6000;

export function initialAttemptState(attemptId: string): AttemptState {
  return {
    attemptId,
    phase: "starting",
    lastPartialTranscript: null,
    recordingStartedAt: null,
    outcome: null,
  };
}

function finalize(state: AttemptState, outcome: SpeechOutcome): AttemptState {
  return { ...state, phase: "finalized", outcome };
}

function outcomeForError(code: AttemptErrorCode): SpeechOutcome {
  switch (code) {
    case "no-speech":
      return { kind: "no_speech" };
    case "aborted":
      return { kind: "aborted" };
    case "not-allowed":
      return { kind: "permission_denied" };
    case "interrupted":
      return { kind: "technical", reason: "interrupted" };
    case "service-not-allowed":
      return { kind: "technical", reason: "service_unavailable" };
    case "language-not-supported":
      return { kind: "technical", reason: "language_unsupported" };
    case "network":
      return { kind: "technical", reason: "network_failed" };
    case "busy":
      return { kind: "technical", reason: "recognizer_busy" };
    case "audio-capture":
      return { kind: "technical", reason: "audio_capture" };
    case "client":
    case "unknown":
      return { kind: "technical", reason: "unknown" };
  }
}

/**
 * Pure transition. Events for other attempts must be filtered by the caller
 * (the adapter stamps ids); this function additionally hard-ignores
 * everything once finalized, so even a mis-routed duplicate cannot
 * double-finalize, re-grade, or resurrect an attempt.
 */
export function attemptReducer(state: AttemptState, event: AttemptEvent): AttemptState {
  if (state.phase === "finalized") return state;

  switch (event.type) {
    case "started":
      return state.phase === "starting"
        ? { ...state, phase: "recording", recordingStartedAt: event.at }
        : state;

    case "partial":
      // Display-only; legal in recording AND stopping (engines flush
      // partials while finalizing). Never contributes to the outcome.
      return state.phase === "recording" || state.phase === "stopping"
        ? { ...state, lastPartialTranscript: event.transcript }
        : state;

    case "final":
      // The one legitimate path to learner evidence. Accepted from
      // recording (iOS can finalize spontaneously at end-of-speech) and
      // stopping. A final arriving in "starting" means the engine finalized
      // faster than our start event ordering — still legitimate.
      return finalize(state, { kind: "final", result: event.result });

    case "error":
      return finalize(state, outcomeForError(event.code));

    case "end":
      // Both platforms emit any verdict BEFORE end; an end that arrives
      // with no verdict means the verdict was lost (the stop race) — a
      // technical no-result, never a wrong answer, never the last partial.
      return finalize(state, { kind: "technical", reason: "no_final_result" });

    case "stopRequested":
      return state.phase === "starting" || state.phase === "recording"
        ? { ...state, phase: "stopping" }
        : state;

    case "abortRequested":
      return finalize(state, { kind: "aborted" });

    case "backgrounded":
      return finalize(state, { kind: "technical", reason: "backgrounded" });

    case "finalizeTimeout":
      return state.phase === "stopping"
        ? finalize(state, { kind: "technical", reason: "finalize_timeout" })
        : state;
  }
}

/** Milliseconds of audio captured so far (for the recording indicator). */
export function elapsedMs(state: AttemptState, now: number): number {
  return state.recordingStartedAt === null ? 0 : Math.max(0, now - state.recordingStartedAt);
}

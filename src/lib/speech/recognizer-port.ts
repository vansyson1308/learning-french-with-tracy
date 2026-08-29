/**
 * App-owned speech recognizer port (P8 §7). UI and session code speak ONLY
 * this interface; the provider package is an implementation detail behind
 * one adapter, replaceable without touching exercises, evidence, or
 * assessment. One attempt is active at a time by contract — starting while
 * active is a programming error and throws rather than silently aborting.
 */

import type { AttemptErrorCode } from "./attempt-machine";
import type { SpeechCapability, SpeechRecognitionResult } from "./types";

/** Normalized, attempt-stamped events the adapter emits. */
export type SpeechAdapterEvent =
  | { attemptId: string; type: "started"; at: number }
  | { attemptId: string; type: "partial"; transcript: string }
  | { attemptId: string; type: "final"; result: SpeechRecognitionResult }
  | { attemptId: string; type: "error"; code: AttemptErrorCode }
  | { attemptId: string; type: "end" }
  /** The persisted own-voice file became readable (after audioend). */
  | { attemptId: string; type: "recordingReady"; uri: string };

export type StartAttemptOptions = {
  attemptId: string;
  locale: string;
  /**
   * Scored attempts NEVER receive contextual bias strings and never persist
   * beyond the step; the adapter enforces this as defense in depth on top
   * of the exercise layer never providing them (P8 §13).
   */
  mode: "practice" | "scored";
  /** Persist the attempt audio for own-voice replay (capability-gated). */
  persistRecording: boolean;
  /** Practice-only recognition bias (ignored with a warning when scored). */
  contextualStrings?: string[];
};

export interface SpeechRecognizerPort {
  /** Immutable snapshot of what this device/session can do right now. */
  probeCapabilities(): Promise<SpeechCapability>;
  /**
   * Point-of-use permission request (microphone + speech recognition).
   * Returns the refreshed capability snapshot; never called at startup.
   */
  requestPermissions(): Promise<SpeechCapability>;
  startAttempt(options: StartAttemptOptions): void;
  /** Ask the engine to finalize; the final result arrives as an event. */
  stopAttempt(attemptId: string): void;
  /** Abandon without a final result; emits nothing gradeable. */
  abortAttempt(attemptId: string): void;
  addListener(listener: (event: SpeechAdapterEvent) => void): () => void;
  /** Release native listeners; late native callbacks become no-ops. */
  dispose(): void;
}

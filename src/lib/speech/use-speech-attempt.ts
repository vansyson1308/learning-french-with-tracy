/**
 * React binding of the pure attempt machine to a SpeechRecognizerPort
 * (P8 §9/§10): id-filtered event routing (second stale-callback layer on
 * top of the adapter's stamping), the finalize-timeout timer, AppState
 * background → abort, audio-session restore after EVERY terminal state
 * (the recognizer does not restore iOS playback mode itself), and
 * ephemeral own-voice recording state. All attempt policy lives in
 * attemptReducer; this file only wires effects, mirroring the Phase-7
 * useListeningPlayer pattern.
 *
 * Privacy (§8/§27): the recording URI lives ONLY in this hook's React
 * state and is deleted the moment it can no longer be replayed (non-final
 * outcome, replaced attempt, unmount). Nothing here touches Zustand,
 * AsyncStorage, or the review log.
 */

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { AppState } from "react-native";

import { restorePlaybackAudioMode, stopSpeechPlayback } from "../audio";
import {
  attemptReducer,
  FINALIZE_TIMEOUT_MS,
  initialAttemptState,
  type AttemptEvent,
  type AttemptPhase,
  type AttemptState,
} from "./attempt-machine";
import type { SpeechRecognizerPort } from "./recognizer-port";
import { deleteRecording } from "./speech-cache";
import { FRENCH_LOCALE, type SpeechOutcome } from "./types";

type HookEvent = AttemptEvent | { type: "reset"; attemptId: string };

function hookReducer(state: AttemptState | null, event: HookEvent): AttemptState | null {
  if (event.type === "reset") return initialAttemptState(event.attemptId);
  return state === null ? state : attemptReducer(state, event);
}

let attemptCounter = 0;
/** Process-unique, filesystem-safe attempt ids. */
export function nextAttemptId(): string {
  attemptCounter += 1;
  return `sp-${Date.now().toString(36)}-${attemptCounter}`;
}

export type StartSpeechAttemptOptions = {
  mode: "practice" | "scored";
  /** Keep the attempt audio for own-voice replay (capability-gated). */
  persistRecording?: boolean;
  /** Practice-only recognition bias; stripped for scored by the adapter too. */
  contextualStrings?: string[];
  locale?: string;
};

export type SpeechAttemptApi = {
  /** "idle" until the first start() of this hook instance. */
  phase: AttemptPhase;
  state: AttemptState | null;
  outcome: SpeechOutcome | null;
  /** Practice-only live transcript (never rendered in scored mode, §13). */
  lastPartialTranscript: string | null;
  /** Own-voice replay file, present only after a FINAL outcome asked to persist. */
  recordingUri: string | null;
  /** Milliseconds recorded so far; ticks while recording. */
  elapsedMs: number;
  start: (options: StartSpeechAttemptOptions) => void;
  /** Ask the engine to finalize; arms the fail-closed timeout (§9). */
  stop: () => void;
  /** Abandon with no evidence of any kind. */
  abort: () => void;
  /** Drop the replay audio now (step done with it). */
  discardRecording: () => void;
};

export function useSpeechAttempt(port: SpeechRecognizerPort): SpeechAttemptApi {
  const [state, dispatch] = useReducer(hookReducer, null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const attemptIdRef = useRef<string | null>(null);
  const recordingUriRef = useRef<string | null>(null);
  const finalizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const phase: AttemptPhase = state?.phase ?? "idle";
  const outcome = state?.outcome ?? null;

  // Mirrors for event handlers/listeners (render stays pure — the refs are
  // written in an effect, plus synchronous latches inside the handlers
  // themselves so a same-tick double tap cannot slip past the guards).
  const phaseRef = useRef<AttemptPhase>("idle");
  const outcomeKindRef = useRef<SpeechOutcome["kind"] | null>(null);
  useEffect(() => {
    phaseRef.current = phase;
    outcomeKindRef.current = outcome?.kind ?? null;
  });

  const clearFinalizeTimer = useCallback(() => {
    if (finalizeTimerRef.current !== null) {
      clearTimeout(finalizeTimerRef.current);
      finalizeTimerRef.current = null;
    }
  }, []);

  const dropRecording = useCallback(() => {
    if (recordingUriRef.current !== null) {
      deleteRecording(recordingUriRef.current);
      recordingUriRef.current = null;
      setRecordingUri(null);
    }
  }, []);

  // Port events → machine events, filtered by the CURRENT attempt id.
  useEffect(() => {
    const unsubscribe = port.addListener((event) => {
      if (event.attemptId !== attemptIdRef.current) return; // stale attempt
      switch (event.type) {
        case "started":
          dispatch({ type: "started", at: event.at });
          break;
        case "partial":
          dispatch({ type: "partial", transcript: event.transcript });
          break;
        case "final":
          dispatch({ type: "final", result: event.result });
          break;
        case "error":
          dispatch({ type: "error", code: event.code });
          break;
        case "end":
          dispatch({ type: "end" });
          break;
        case "recordingReady":
          // A file for an attempt that already ended without a final has
          // no replay value — delete instead of holding it (§8).
          if (outcomeKindRef.current !== null && outcomeKindRef.current !== "final") {
            deleteRecording(event.uri);
            break;
          }
          recordingUriRef.current = event.uri;
          setRecordingUri(event.uri);
          break;
      }
    });
    return unsubscribe;
  }, [port]);

  // Backgrounding mid-attempt aborts with a technical outcome (§9/§24 —
  // never background recording, never a learner penalty).
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") return;
      const attemptId = attemptIdRef.current;
      if (attemptId === null || phaseRef.current === "finalized" || phaseRef.current === "idle") {
        return;
      }
      port.abortAttempt(attemptId);
      dispatch({ type: "backgrounded" });
    });
    return () => subscription.remove();
  }, [port]);

  // Terminal housekeeping: stop the timer, restore the playback audio
  // session (EVERY terminal state, §10), drop unusable recordings.
  useEffect(() => {
    if (phase !== "finalized") return;
    clearFinalizeTimer();
    restorePlaybackAudioMode();
    if (outcome !== null && outcome.kind !== "final") dropRecording();
  }, [phase, outcome, clearFinalizeTimer, dropRecording]);

  // Recording indicator: elapsed ticks while recording, freezes at the
  // captured duration on any terminal phase (interval torn down).
  const recordingStartedAt = state?.recordingStartedAt ?? null;
  useEffect(() => {
    if (phase !== "recording" || recordingStartedAt === null) return;
    const update = () => setElapsed(Math.max(0, Date.now() - recordingStartedAt));
    update();
    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, [phase, recordingStartedAt]);

  // Unmount: abandon anything in flight and leave no audio behind.
  useEffect(() => {
    return () => {
      const attemptId = attemptIdRef.current;
      if (attemptId !== null && phaseRef.current !== "finalized" && phaseRef.current !== "idle") {
        port.abortAttempt(attemptId);
        restorePlaybackAudioMode();
      }
      if (finalizeTimerRef.current !== null) clearTimeout(finalizeTimerRef.current);
      if (recordingUriRef.current !== null) deleteRecording(recordingUriRef.current);
    };
  }, [port]);

  const start = useCallback(
    (options: StartSpeechAttemptOptions) => {
      if (phaseRef.current !== "idle" && phaseRef.current !== "finalized") return;
      phaseRef.current = "starting"; // synchronous double-tap latch
      outcomeKindRef.current = null;
      const attemptId = nextAttemptId();
      attemptIdRef.current = attemptId;
      clearFinalizeTimer();
      dropRecording(); // the previous attempt's replay is over
      setElapsed(0);
      stopSpeechPlayback(); // §10: nothing may play while the mic opens
      dispatch({ type: "reset", attemptId });
      try {
        port.startAttempt({
          attemptId,
          locale: options.locale ?? FRENCH_LOCALE,
          mode: options.mode,
          persistRecording: options.persistRecording ?? false,
          contextualStrings:
            options.mode === "practice" ? options.contextualStrings : undefined,
        });
      } catch {
        // The port still holds a session whose end never arrived, or was
        // disposed: a technical state, never a crash or a learner failure.
        dispatch({ type: "error", code: "busy" });
      }
    },
    [port, clearFinalizeTimer, dropRecording]
  );

  const stop = useCallback(() => {
    const attemptId = attemptIdRef.current;
    if (attemptId === null) return;
    if (phaseRef.current !== "starting" && phaseRef.current !== "recording") return;
    phaseRef.current = "stopping"; // synchronous double-tap latch
    dispatch({ type: "stopRequested" });
    port.stopAttempt(attemptId);
    clearFinalizeTimer();
    finalizeTimerRef.current = setTimeout(() => {
      finalizeTimerRef.current = null;
      // Fail closed (§9): no verdict within budget is a technical outcome,
      // and the stuck engine session is torn down so the next attempt can
      // start cleanly.
      dispatch({ type: "finalizeTimeout" });
      port.abortAttempt(attemptId);
    }, FINALIZE_TIMEOUT_MS);
  }, [port, clearFinalizeTimer]);

  const abort = useCallback(() => {
    const attemptId = attemptIdRef.current;
    if (attemptId === null || phaseRef.current === "finalized" || phaseRef.current === "idle") {
      return;
    }
    phaseRef.current = "finalized"; // synchronous latch
    clearFinalizeTimer();
    dispatch({ type: "abortRequested" });
    port.abortAttempt(attemptId);
  }, [port, clearFinalizeTimer]);

  return {
    phase,
    state,
    outcome,
    lastPartialTranscript: state?.lastPartialTranscript ?? null,
    recordingUri,
    elapsedMs: elapsed,
    start,
    stop,
    abort,
    discardRecording: dropRecording,
  };
}

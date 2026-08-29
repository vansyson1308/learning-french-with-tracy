/**
 * useSpeechAttempt wiring suite (P8 §9/§10, test program §28.B hook half):
 * machine + port binding, stale-event filtering, the fail-closed finalize
 * timer, AppState background → abort, audio-session restore on EVERY
 * terminal state, and recording-URI hygiene — all against a fake port.
 *
 * Honesty note (§6): this verifies OUR hook logic under mocks; platform
 * recognizer behavior stays an outstanding real-device gate.
 */
import { act, renderHook } from "@testing-library/react-native";
import { AppState } from "react-native";

import { restorePlaybackAudioMode, stopSpeechPlayback } from "@/lib/audio";
import { FINALIZE_TIMEOUT_MS } from "@/lib/speech/attempt-machine";
import type { SpeechAdapterEvent, SpeechRecognizerPort } from "@/lib/speech/recognizer-port";
import { deleteRecording } from "@/lib/speech/speech-cache";
import { unavailableCapability, type SpeechRecognitionResult } from "@/lib/speech/types";
import { useSpeechAttempt } from "@/lib/speech/use-speech-attempt";

// Hoisted above the imports by babel-jest.
jest.mock("@/lib/audio", () => ({
  stopSpeechPlayback: jest.fn(),
  restorePlaybackAudioMode: jest.fn(),
}));
jest.mock("@/lib/speech/speech-cache", () => ({
  SPEECH_CACHE_SUBDIR: "speech-attempts",
  speechCacheDirectory: jest.fn(),
  ensureSpeechCacheDirectory: jest.fn(() => null),
  deleteRecording: jest.fn(),
  sweepSpeechCache: jest.fn(() => 0),
}));

type FakePort = SpeechRecognizerPort & {
  emit: (event: SpeechAdapterEvent) => void;
  startAttempt: jest.Mock;
  stopAttempt: jest.Mock;
  abortAttempt: jest.Mock;
};

function makePort(): FakePort {
  const listeners = new Set<(event: SpeechAdapterEvent) => void>();
  return {
    probeCapabilities: jest.fn(async () => unavailableCapability("ios")),
    requestPermissions: jest.fn(async () => unavailableCapability("ios")),
    startAttempt: jest.fn(),
    stopAttempt: jest.fn(),
    abortAttempt: jest.fn(),
    addListener(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose: jest.fn(),
    emit(event) {
      for (const listener of [...listeners]) listener(event);
    },
  };
}

const attemptIdOf = (port: FakePort): string =>
  (port.startAttempt.mock.calls.at(-1)?.[0] as { attemptId: string }).attemptId;

const finalResult = (attemptId: string, transcript: string): SpeechRecognitionResult => ({
  attemptId,
  finalTranscript: transcript,
  alternatives: [],
  locale: "fr-FR",
  provider: "fake",
  recognitionMode: "on_device",
  durationMs: 900,
  recordingUri: null,
});

let appStateHandler: ((next: string) => void) | null = null;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  appStateHandler = null;
  jest.spyOn(AppState, "addEventListener").mockImplementation(((
    _type: string,
    handler: (next: string) => void
  ) => {
    appStateHandler = handler;
    return { remove: jest.fn() };
  }) as unknown as typeof AppState.addEventListener);
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("start wiring (§10/§13)", () => {
  test("start stops playback FIRST, then opens a French attempt on the port", () => {
    const port = makePort();
    const { result } = renderHook(() => useSpeechAttempt(port));
    expect(result.current.phase).toBe("idle");

    act(() => result.current.start({ mode: "practice", contextualStrings: ["le lait"] }));

    expect(result.current.phase).toBe("starting");
    expect(port.startAttempt).toHaveBeenCalledTimes(1);
    const options = port.startAttempt.mock.calls[0][0];
    expect(options.locale).toBe("fr-FR");
    expect(options.mode).toBe("practice");
    expect(options.contextualStrings).toEqual(["le lait"]);
    expect(options.persistRecording).toBe(false);
    // §10 ordering: silence the model audio before the mic session starts.
    expect(stopSpeechPlayback).toHaveBeenCalledTimes(1);
    expect((stopSpeechPlayback as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      port.startAttempt.mock.invocationCallOrder[0]
    );
  });

  test("scored mode never forwards contextual bias from the hook either (§13)", () => {
    const port = makePort();
    const { result } = renderHook(() => useSpeechAttempt(port));
    act(() => result.current.start({ mode: "scored", contextualStrings: ["je voudrais"] }));
    expect(port.startAttempt.mock.calls[0][0].contextualStrings).toBeUndefined();
  });

  test("a second start while one attempt is active is ignored", () => {
    const port = makePort();
    const { result } = renderHook(() => useSpeechAttempt(port));
    act(() => result.current.start({ mode: "practice" }));
    act(() => result.current.start({ mode: "practice" }));
    expect(port.startAttempt).toHaveBeenCalledTimes(1);
  });

  test("a port that refuses to start yields a technical outcome, not a crash", () => {
    const port = makePort();
    port.startAttempt.mockImplementation(() => {
      throw new Error("previous session still active");
    });
    const { result } = renderHook(() => useSpeechAttempt(port));
    act(() => result.current.start({ mode: "practice" }));
    expect(result.current.outcome).toEqual({ kind: "technical", reason: "recognizer_busy" });
  });
});

describe("event routing and stale immunity (§9)", () => {
  test("happy path: started → partial → final, session restored after terminal", () => {
    const port = makePort();
    const { result } = renderHook(() => useSpeechAttempt(port));
    act(() => result.current.start({ mode: "practice" }));
    const id = attemptIdOf(port);

    act(() => port.emit({ attemptId: id, type: "started", at: Date.now() }));
    expect(result.current.phase).toBe("recording");

    act(() => port.emit({ attemptId: id, type: "partial", transcript: "je vou" }));
    expect(result.current.lastPartialTranscript).toBe("je vou");

    expect(restorePlaybackAudioMode).not.toHaveBeenCalled();
    act(() => port.emit({ attemptId: id, type: "final", result: finalResult(id, "je voudrais") }));
    expect(result.current.phase).toBe("finalized");
    expect(result.current.outcome?.kind).toBe("final");
    // §10: playback mode re-asserted after EVERY terminal state.
    expect(restorePlaybackAudioMode).toHaveBeenCalled();
  });

  test("events stamped with a different attempt id never reach the machine", () => {
    const port = makePort();
    const { result } = renderHook(() => useSpeechAttempt(port));
    act(() => result.current.start({ mode: "practice" }));
    const id = attemptIdOf(port);

    act(() => port.emit({ attemptId: "ghost", type: "started", at: 1 }));
    expect(result.current.phase).toBe("starting");

    act(() => port.emit({ attemptId: id, type: "started", at: Date.now() }));
    act(() =>
      port.emit({ attemptId: "ghost", type: "final", result: finalResult("ghost", "fantôme") })
    );
    expect(result.current.phase).toBe("recording");
    expect(result.current.outcome).toBeNull();
  });
});

describe("stop and the fail-closed finalize timer (§9)", () => {
  test("stop asks the engine to finalize and arms the timeout", () => {
    const port = makePort();
    const { result } = renderHook(() => useSpeechAttempt(port));
    act(() => result.current.start({ mode: "practice" }));
    const id = attemptIdOf(port);
    act(() => port.emit({ attemptId: id, type: "started", at: Date.now() }));

    act(() => result.current.stop());
    expect(result.current.phase).toBe("stopping");
    expect(port.stopAttempt).toHaveBeenCalledWith(id);

    act(() => jest.advanceTimersByTime(FINALIZE_TIMEOUT_MS));
    expect(result.current.outcome).toEqual({ kind: "technical", reason: "finalize_timeout" });
    // The stuck engine session is torn down so the next attempt can start.
    expect(port.abortAttempt).toHaveBeenCalledWith(id);
  });

  test("a final inside the budget disarms the timer", () => {
    const port = makePort();
    const { result } = renderHook(() => useSpeechAttempt(port));
    act(() => result.current.start({ mode: "practice" }));
    const id = attemptIdOf(port);
    act(() => port.emit({ attemptId: id, type: "started", at: Date.now() }));
    act(() => result.current.stop());
    act(() => port.emit({ attemptId: id, type: "final", result: finalResult(id, "merci") }));

    act(() => jest.advanceTimersByTime(FINALIZE_TIMEOUT_MS * 2));
    expect(result.current.outcome?.kind).toBe("final");
    expect(port.abortAttempt).not.toHaveBeenCalled();
  });

  test("stop before the engine confirmed the session start is honored", () => {
    const port = makePort();
    const { result } = renderHook(() => useSpeechAttempt(port));
    act(() => result.current.start({ mode: "practice" }));
    act(() => result.current.stop());
    expect(result.current.phase).toBe("stopping");
  });
});

describe("abort and background (§9 — no evidence, no penalty)", () => {
  test("abort abandons the attempt and tells the port", () => {
    const port = makePort();
    const { result } = renderHook(() => useSpeechAttempt(port));
    act(() => result.current.start({ mode: "practice" }));
    const id = attemptIdOf(port);
    act(() => port.emit({ attemptId: id, type: "started", at: Date.now() }));

    act(() => result.current.abort());
    expect(result.current.outcome).toEqual({ kind: "aborted" });
    expect(port.abortAttempt).toHaveBeenCalledWith(id);
  });

  test("abort after the outcome exists is a no-op", () => {
    const port = makePort();
    const { result } = renderHook(() => useSpeechAttempt(port));
    act(() => result.current.start({ mode: "practice" }));
    const id = attemptIdOf(port);
    act(() => port.emit({ attemptId: id, type: "final", result: finalResult(id, "oui") }));
    act(() => result.current.abort());
    expect(result.current.outcome?.kind).toBe("final");
    expect(port.abortAttempt).not.toHaveBeenCalled();
  });

  test("backgrounding mid-attempt aborts with a technical outcome", () => {
    const port = makePort();
    const { result } = renderHook(() => useSpeechAttempt(port));
    act(() => result.current.start({ mode: "practice" }));
    const id = attemptIdOf(port);
    act(() => port.emit({ attemptId: id, type: "started", at: Date.now() }));

    act(() => appStateHandler?.("background"));
    expect(result.current.outcome).toEqual({ kind: "technical", reason: "backgrounded" });
    expect(port.abortAttempt).toHaveBeenCalledWith(id);
  });

  test("backgrounding with nothing in flight does nothing", () => {
    const port = makePort();
    renderHook(() => useSpeechAttempt(port));
    act(() => appStateHandler?.("background"));
    expect(port.abortAttempt).not.toHaveBeenCalled();
  });
});

describe("recording hygiene (§8/§27)", () => {
  test("a persisted recording surfaces for replay after a final outcome", () => {
    const port = makePort();
    const { result } = renderHook(() => useSpeechAttempt(port));
    act(() => result.current.start({ mode: "practice", persistRecording: true }));
    const id = attemptIdOf(port);
    expect(port.startAttempt.mock.calls[0][0].persistRecording).toBe(true);

    act(() => port.emit({ attemptId: id, type: "started", at: Date.now() }));
    act(() => port.emit({ attemptId: id, type: "recordingReady", uri: "cache/sp/a.wav" }));
    act(() => port.emit({ attemptId: id, type: "final", result: finalResult(id, "bonjour") }));
    expect(result.current.recordingUri).toBe("cache/sp/a.wav");
    expect(deleteRecording).not.toHaveBeenCalled();
  });

  test("a non-final outcome deletes the attempt audio immediately", () => {
    const port = makePort();
    const { result } = renderHook(() => useSpeechAttempt(port));
    act(() => result.current.start({ mode: "practice", persistRecording: true }));
    const id = attemptIdOf(port);
    act(() => port.emit({ attemptId: id, type: "started", at: Date.now() }));
    act(() => port.emit({ attemptId: id, type: "recordingReady", uri: "cache/sp/b.wav" }));
    act(() => port.emit({ attemptId: id, type: "error", code: "no-speech" }));

    expect(result.current.recordingUri).toBeNull();
    expect(deleteRecording).toHaveBeenCalledWith("cache/sp/b.wav");
  });

  test("audio arriving AFTER a non-final outcome is deleted, never stored", () => {
    const port = makePort();
    const { result } = renderHook(() => useSpeechAttempt(port));
    act(() => result.current.start({ mode: "practice", persistRecording: true }));
    const id = attemptIdOf(port);
    act(() => port.emit({ attemptId: id, type: "started", at: Date.now() }));
    act(() => port.emit({ attemptId: id, type: "error", code: "aborted" }));
    act(() => port.emit({ attemptId: id, type: "recordingReady", uri: "cache/sp/late.wav" }));

    expect(result.current.recordingUri).toBeNull();
    expect(deleteRecording).toHaveBeenCalledWith("cache/sp/late.wav");
  });

  test("starting the next attempt deletes the previous replay file", () => {
    const port = makePort();
    const { result } = renderHook(() => useSpeechAttempt(port));
    act(() => result.current.start({ mode: "practice", persistRecording: true }));
    const first = attemptIdOf(port);
    act(() => port.emit({ attemptId: first, type: "started", at: Date.now() }));
    act(() => port.emit({ attemptId: first, type: "recordingReady", uri: "cache/sp/one.wav" }));
    act(() =>
      port.emit({ attemptId: first, type: "final", result: finalResult(first, "un") })
    );

    act(() => result.current.start({ mode: "practice", persistRecording: true }));
    expect(deleteRecording).toHaveBeenCalledWith("cache/sp/one.wav");
    expect(result.current.recordingUri).toBeNull();
    expect(port.startAttempt).toHaveBeenCalledTimes(2);
  });

  test("unmount mid-attempt aborts the port and leaves no audio behind", () => {
    const port = makePort();
    const { result, unmount } = renderHook(() => useSpeechAttempt(port));
    act(() => result.current.start({ mode: "practice", persistRecording: true }));
    const id = attemptIdOf(port);
    act(() => port.emit({ attemptId: id, type: "started", at: Date.now() }));
    act(() => port.emit({ attemptId: id, type: "recordingReady", uri: "cache/sp/gone.wav" }));

    unmount();
    expect(port.abortAttempt).toHaveBeenCalledWith(id);
    expect(deleteRecording).toHaveBeenCalledWith("cache/sp/gone.wav");
    expect(restorePlaybackAudioMode).toHaveBeenCalled();
  });
});

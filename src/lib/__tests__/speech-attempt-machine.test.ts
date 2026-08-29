/**
 * Speech attempt state machine (P8 §9, test program §28.B): normal
 * start/final, stop, abort, background, interruption, late callbacks,
 * duplicate finals, final timeout, no-speech, and the Android rapid-stop
 * race. The machine is pure; every invariant here is enforced without any
 * native module.
 */
import { describe, expect, test } from "bun:test";

import {
  attemptReducer,
  elapsedMs,
  FINALIZE_TIMEOUT_MS,
  initialAttemptState,
  type AttemptErrorCode,
  type AttemptEvent,
  type AttemptState,
} from "../speech/attempt-machine";
import type { SpeechRecognitionResult, SpeechTechnicalReason } from "../speech/types";

const ATTEMPT = "attempt-1";

function result(transcript: string): SpeechRecognitionResult {
  return {
    attemptId: ATTEMPT,
    finalTranscript: transcript,
    alternatives: [],
    locale: "fr-FR",
    provider: "expo-speech-recognition",
    recognitionMode: "on_device",
    durationMs: 1800,
    recordingUri: null,
  };
}

function seq(state: AttemptState, ...events: AttemptEvent[]): AttemptState {
  return events.reduce(attemptReducer, state);
}

const started: AttemptEvent = { type: "started", at: 1000 };

describe("normal lifecycle", () => {
  test("start → recording → stop → final produces a gradeable final outcome", () => {
    let s = initialAttemptState(ATTEMPT);
    expect(s.phase).toBe("starting");
    expect(s.outcome).toBeNull();

    s = attemptReducer(s, started);
    expect(s.phase).toBe("recording");
    expect(s.recordingStartedAt).toBe(1000);

    s = attemptReducer(s, { type: "stopRequested" });
    expect(s.phase).toBe("stopping");

    s = attemptReducer(s, { type: "final", result: result("je voudrais un café") });
    expect(s.phase).toBe("finalized");
    expect(s.outcome).toEqual({ kind: "final", result: result("je voudrais un café") });
  });

  test("spontaneous end-of-speech final (no stop pressed) is legitimate", () => {
    const s = seq(initialAttemptState(ATTEMPT), started, {
      type: "final",
      result: result("bonjour"),
    });
    expect(s.phase).toBe("finalized");
    expect(s.outcome?.kind).toBe("final");
  });

  test("a final arriving while still 'starting' (engine beat our ordering) is accepted", () => {
    const s = attemptReducer(initialAttemptState(ATTEMPT), {
      type: "final",
      result: result("oui"),
    });
    expect(s.outcome?.kind).toBe("final");
  });

  test("end AFTER a final does not disturb the final outcome", () => {
    const s = seq(
      initialAttemptState(ATTEMPT),
      started,
      { type: "final", result: result("merci") },
      { type: "end" }
    );
    expect(s.outcome?.kind).toBe("final");
  });

  test("the attempt id is stable across every transition", () => {
    const s = seq(
      initialAttemptState(ATTEMPT),
      started,
      { type: "partial", transcript: "je" },
      { type: "stopRequested" },
      { type: "final", result: result("je voudrais") },
      { type: "end" }
    );
    expect(s.attemptId).toBe(ATTEMPT);
  });
});

describe("partials are display-only (§9, §13)", () => {
  test("partials update the display in recording and stopping, never the outcome", () => {
    let s = seq(initialAttemptState(ATTEMPT), started, {
      type: "partial",
      transcript: "je vou",
    });
    expect(s.lastPartialTranscript).toBe("je vou");
    expect(s.outcome).toBeNull();

    s = seq(s, { type: "stopRequested" }, { type: "partial", transcript: "je voudrais" });
    expect(s.lastPartialTranscript).toBe("je voudrais");
    expect(s.phase).toBe("stopping");
  });

  test("a partial before the session started is ignored", () => {
    const s = attemptReducer(initialAttemptState(ATTEMPT), {
      type: "partial",
      transcript: "早"
    });
    expect(s.lastPartialTranscript).toBeNull();
  });
});

describe("rapid-stop race (§9 — the Android verdict-loss case)", () => {
  test("end without any verdict is a technical no_final_result, never a grade", () => {
    const s = seq(initialAttemptState(ATTEMPT), started, { type: "stopRequested" }, { type: "end" });
    expect(s.outcome).toEqual({ kind: "technical", reason: "no_final_result" });
  });

  test("the last partial is NEVER promoted to a final when the verdict is lost", () => {
    const s = seq(
      initialAttemptState(ATTEMPT),
      started,
      { type: "partial", transcript: "bonjour tout le monde" },
      { type: "stopRequested" },
      { type: "end" }
    );
    expect(s.outcome?.kind).toBe("technical");
    // The partial stays as display state only; no outcome carries it.
    expect(s.lastPartialTranscript).toBe("bonjour tout le monde");
  });

  test("finalize timeout while stopping fails closed as technical", () => {
    const s = seq(
      initialAttemptState(ATTEMPT),
      started,
      { type: "stopRequested" },
      { type: "finalizeTimeout" }
    );
    expect(s.outcome).toEqual({ kind: "technical", reason: "finalize_timeout" });
  });

  test("finalize timeout outside 'stopping' is a no-op (stale timer)", () => {
    const recording = seq(initialAttemptState(ATTEMPT), started);
    expect(attemptReducer(recording, { type: "finalizeTimeout" })).toBe(recording);
  });

  test("the timeout budget is a sane finite constant", () => {
    expect(FINALIZE_TIMEOUT_MS).toBeGreaterThanOrEqual(2000);
    expect(FINALIZE_TIMEOUT_MS).toBeLessThanOrEqual(15000);
  });
});

describe("silence vs wrong vs broken (§9, §14)", () => {
  test("no-speech is its own outcome — distinguishable from technical failure", () => {
    const s = seq(initialAttemptState(ATTEMPT), started, { type: "error", code: "no-speech" });
    expect(s.outcome).toEqual({ kind: "no_speech" });
  });

  test("stop twice is a no-op: the second tap changes nothing (red-team #7)", () => {
    const once = seq(initialAttemptState(ATTEMPT), started, { type: "stopRequested" });
    const twice = seq(once, { type: "stopRequested" });
    expect(twice).toBe(once); // same object — the reducer returned state untouched
    // …and stop after a terminal outcome cannot resurrect the attempt.
    const done = seq(once, { type: "final", result: result("bonjour") }, { type: "stopRequested" });
    expect(done.phase).toBe("finalized");
    expect(done.outcome?.kind).toBe("final");
  });

  test("a network failure is technical — never a grade, never silence (red-team #14)", () => {
    const s = seq(initialAttemptState(ATTEMPT), started, {
      type: "error",
      code: "network",
    });
    expect(s.outcome).toEqual({ kind: "technical", reason: "network_failed" });
  });

  test("a recognized-but-wrong answer stays a final (grading happens later)", () => {
    const s = seq(initialAttemptState(ATTEMPT), started, {
      type: "final",
      result: result("au revoir"),
    });
    // The machine never grades; wrong French is still a FINAL outcome.
    expect(s.outcome?.kind).toBe("final");
  });
});

describe("abort, background, interruption produce no learner evidence (§9)", () => {
  test("user abort finalizes as aborted", () => {
    const s = seq(initialAttemptState(ATTEMPT), started, { type: "abortRequested" });
    expect(s.outcome).toEqual({ kind: "aborted" });
  });

  test("abort while still starting is honored", () => {
    const s = attemptReducer(initialAttemptState(ATTEMPT), { type: "abortRequested" });
    expect(s.outcome).toEqual({ kind: "aborted" });
  });

  test("backgrounding mid-recording is technical, not a failure grade", () => {
    const s = seq(initialAttemptState(ATTEMPT), started, { type: "backgrounded" });
    expect(s.outcome).toEqual({ kind: "technical", reason: "backgrounded" });
  });

  test("an OS audio interruption is technical", () => {
    const s = seq(initialAttemptState(ATTEMPT), started, { type: "error", code: "interrupted" });
    expect(s.outcome).toEqual({ kind: "technical", reason: "interrupted" });
  });
});

describe("error-code mapping is total and honest", () => {
  const technical: [AttemptErrorCode, SpeechTechnicalReason][] = [
    ["service-not-allowed", "service_unavailable"],
    ["language-not-supported", "language_unsupported"],
    ["network", "network_failed"],
    ["busy", "recognizer_busy"],
    ["audio-capture", "audio_capture"],
    ["client", "unknown"],
    ["unknown", "unknown"],
  ];
  for (const [code, reason] of technical) {
    test(`${code} → technical/${reason}`, () => {
      const s = seq(initialAttemptState(ATTEMPT), started, { type: "error", code });
      expect(s.outcome).toEqual({ kind: "technical", reason });
    });
  }

  test("not-allowed → permission_denied (its own UX path, §24)", () => {
    const s = seq(initialAttemptState(ATTEMPT), started, { type: "error", code: "not-allowed" });
    expect(s.outcome).toEqual({ kind: "permission_denied" });
  });

  test("aborted error code → aborted outcome", () => {
    const s = seq(initialAttemptState(ATTEMPT), started, { type: "error", code: "aborted" });
    expect(s.outcome).toEqual({ kind: "aborted" });
  });
});

describe("terminal immunity — late callbacks and duplicates (§9)", () => {
  const finalized = seq(initialAttemptState(ATTEMPT), started, {
    type: "final",
    result: result("premier"),
  });

  const lateEvents: AttemptEvent[] = [
    { type: "started", at: 9999 },
    { type: "partial", transcript: "fantôme" },
    { type: "final", result: result("deuxième") },
    { type: "error", code: "network" },
    { type: "end" },
    { type: "stopRequested" },
    { type: "abortRequested" },
    { type: "backgrounded" },
    { type: "finalizeTimeout" },
  ];

  for (const event of lateEvents) {
    test(`finalized state ignores late '${event.type}' (same reference)`, () => {
      expect(attemptReducer(finalized, event)).toBe(finalized);
    });
  }

  test("duplicate final cannot re-finalize: the FIRST result stands", () => {
    const s = attemptReducer(finalized, { type: "final", result: result("deuxième") });
    expect(s.outcome).toEqual({ kind: "final", result: result("premier") });
  });

  test("an error after abort cannot rewrite the aborted outcome", () => {
    const aborted = seq(initialAttemptState(ATTEMPT), started, { type: "abortRequested" });
    const s = attemptReducer(aborted, { type: "error", code: "no-speech" });
    expect(s.outcome).toEqual({ kind: "aborted" });
  });
});

describe("elapsed time for the recording indicator", () => {
  test("zero before audio flows, monotone after", () => {
    let s = initialAttemptState(ATTEMPT);
    expect(elapsedMs(s, 5000)).toBe(0);
    s = attemptReducer(s, started); // at: 1000
    expect(elapsedMs(s, 3500)).toBe(2500);
    expect(elapsedMs(s, 900)).toBe(0); // clock skew clamps at zero
  });
});

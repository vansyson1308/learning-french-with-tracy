/**
 * ExpoSpeechRecognizerAdapter unit suite (P8 §7/§9/§13, test program §28.B
 * adapter half) against a fully controllable provider double: capability
 * probing, permission mapping, scored-mode bias stripping, attempt
 * serialization, event stamping, error normalization, recording placement
 * inside the sweepable cache, and dispose/late-callback neutering.
 *
 * NOTE (§6 honesty): this mocks the PROVIDER MODULE boundary. It verifies
 * OUR adapter logic, not platform recognizer behavior — real-device
 * validation remains an outstanding release gate (RESEARCH.md §7).
 */
import { beforeEach, describe, expect, mock, test } from "bun:test";

import type { SpeechAdapterEvent } from "../speech/recognizer-port";
import { memDirs, memFiles } from "./helpers/mocks";

// ---------- controllable provider double ----------

type Handler = (payload: unknown) => void;
const handlers = new Map<string, Handler[]>();

function fire(name: string, payload?: unknown) {
  for (const handler of [...(handlers.get(name) ?? [])]) handler(payload);
}

type PermissionShape = Record<string, unknown> | null;

const providerState = {
  available: true,
  availableThrows: false,
  onDevice: true,
  recording: true,
  localesThrows: false,
  locales: ["en-US", "fr-FR"] as string[],
  installedLocales: ["fr-FR"] as string[],
  mic: { granted: true, status: "granted", canAskAgain: true } as PermissionShape,
  speech: { granted: true, status: "granted", canAskAgain: true } as PermissionShape,
};

const calls = { start: [] as Record<string, unknown>[], stop: 0, abort: 0, removed: 0 };

const fakeProviderModule = {
  addListener(name: string, handler: Handler) {
    const list = handlers.get(name) ?? [];
    list.push(handler);
    handlers.set(name, list);
    return {
      remove() {
        calls.removed += 1;
        handlers.set(name, (handlers.get(name) ?? []).filter((h) => h !== handler));
      },
    };
  },
  start(options: Record<string, unknown>) {
    calls.start.push(options);
  },
  stop() {
    calls.stop += 1;
  },
  abort() {
    calls.abort += 1;
  },
  isRecognitionAvailable() {
    if (providerState.availableThrows) throw new Error("module not implemented");
    return providerState.available;
  },
  supportsOnDeviceRecognition() {
    return providerState.onDevice;
  },
  supportsRecording() {
    return providerState.recording;
  },
  async getSupportedLocales(_options: Record<string, unknown>) {
    if (providerState.localesThrows) throw new Error("service cannot enumerate locales");
    return { locales: providerState.locales, installedLocales: providerState.installedLocales };
  },
  async getMicrophonePermissionsAsync() {
    if (!providerState.mic) throw new Error("permission query failed");
    return providerState.mic;
  },
  async getSpeechRecognizerPermissionsAsync() {
    if (!providerState.speech) throw new Error("permission query failed");
    return providerState.speech;
  },
  async requestPermissionsAsync() {
    providerState.mic = { granted: true, status: "granted", canAskAgain: true };
    providerState.speech = { granted: true, status: "granted", canAskAgain: true };
    return { granted: true, status: "granted" };
  },
};

const platform = { OS: "ios" };

mock.module("react-native", () => ({ Platform: platform }));
mock.module("expo-speech-recognition", () => ({
  ExpoSpeechRecognitionModule: fakeProviderModule,
}));

// Dynamic import AFTER the module mocks are registered.
const { ExpoSpeechRecognizerAdapter, SPEECH_PROVIDER, SPEECH_PROVIDER_VERSION } = await import(
  "../speech/expo-adapter"
);
type Adapter = InstanceType<typeof ExpoSpeechRecognizerAdapter>;

function makeAdapter(): { adapter: Adapter; events: SpeechAdapterEvent[] } {
  const adapter = new ExpoSpeechRecognizerAdapter();
  const events: SpeechAdapterEvent[] = [];
  adapter.addListener((event) => events.push(event));
  return { adapter, events };
}

const startOpts = (over: Record<string, unknown> = {}) => ({
  attemptId: "att-1",
  locale: "fr-FR",
  mode: "practice" as const,
  persistRecording: false,
  ...over,
});

beforeEach(() => {
  handlers.clear();
  calls.start = [];
  calls.stop = 0;
  calls.abort = 0;
  calls.removed = 0;
  memFiles.clear();
  memDirs.clear();
  platform.OS = "ios";
  providerState.available = true;
  providerState.availableThrows = false;
  providerState.onDevice = true;
  providerState.recording = true;
  providerState.localesThrows = false;
  providerState.locales = ["en-US", "fr-FR"];
  providerState.installedLocales = ["fr-FR"];
  providerState.mic = { granted: true, status: "granted", canAskAgain: true };
  providerState.speech = { granted: true, status: "granted", canAskAgain: true };
});

describe("capability probing (§7)", () => {
  test("full iOS snapshot: available, French on-device, granted → scoredEligible", async () => {
    const { adapter } = makeAdapter();
    const cap = await adapter.probeCapabilities();
    expect(cap).toEqual({
      platform: "ios",
      available: true,
      microphonePermission: "granted",
      speechPermission: "granted",
      frenchRecognitionAvailable: true,
      onDeviceRecognitionAvailable: true,
      frenchOnDeviceModelInstalled: true,
      networkBackedRecognitionPossible: false,
      recordingPersistenceAvailable: true,
      provider: SPEECH_PROVIDER,
      providerVersion: SPEECH_PROVIDER_VERSION,
      scoredEligible: true,
    });
    adapter.dispose();
  });

  test("no recognizer → the unavailable snapshot, nothing eligible", async () => {
    providerState.available = false;
    const { adapter } = makeAdapter();
    const cap = await adapter.probeCapabilities();
    expect(cap.available).toBe(false);
    expect(cap.scoredEligible).toBe(false);
    expect(cap.frenchRecognitionAvailable).toBe(false);
    adapter.dispose();
  });

  test("a throwing availability check degrades to unavailable, never crashes", async () => {
    providerState.availableThrows = true;
    const { adapter } = makeAdapter();
    const cap = await adapter.probeCapabilities();
    expect(cap.available).toBe(false);
    expect(cap.scoredEligible).toBe(false);
    adapter.dispose();
  });

  test("web is NEVER scored-eligible, even fully granted (§25)", async () => {
    platform.OS = "web";
    const { adapter } = makeAdapter();
    const cap = await adapter.probeCapabilities();
    expect(cap.platform).toBe("web");
    expect(cap.scoredEligible).toBe(false);
    adapter.dispose();
  });

  test("Android speech permission mirrors the mic (no separate dialog)", async () => {
    platform.OS = "android";
    providerState.speech = { granted: false, status: "denied", canAskAgain: true };
    const { adapter } = makeAdapter();
    const cap = await adapter.probeCapabilities();
    expect(cap.microphonePermission).toBe("granted");
    expect(cap.speechPermission).toBe("granted");
    expect(cap.scoredEligible).toBe(true);
    adapter.dispose();
  });

  test("un-enumerable locales keep the conservative default: French assumed offered, never proven installed", async () => {
    providerState.localesThrows = true;
    const { adapter } = makeAdapter();
    const cap = await adapter.probeCapabilities();
    expect(cap.frenchRecognitionAvailable).toBe(true);
    expect(cap.frenchOnDeviceModelInstalled).toBe(false);
    expect(cap.networkBackedRecognitionPossible).toBe(true);
    adapter.dispose();
  });

  test("enumerable locales WITHOUT French → not eligible for scored French", async () => {
    providerState.locales = ["en-US", "de-DE"];
    providerState.installedLocales = ["en-US"];
    const { adapter } = makeAdapter();
    const cap = await adapter.probeCapabilities();
    expect(cap.frenchRecognitionAvailable).toBe(false);
    expect(cap.scoredEligible).toBe(false);
    adapter.dispose();
  });

  test("permission states: denied+cannot-ask, restricted, undetermined", async () => {
    providerState.mic = { granted: false, status: "denied", canAskAgain: false };
    providerState.speech = { granted: false, status: "denied", restricted: true };
    const { adapter } = makeAdapter();
    const cap = await adapter.probeCapabilities();
    expect(cap.microphonePermission).toBe("cannotAskAgain");
    expect(cap.speechPermission).toBe("restricted");
    expect(cap.scoredEligible).toBe(false);

    providerState.mic = { granted: false, status: "undetermined", canAskAgain: true };
    const again = await adapter.probeCapabilities();
    expect(again.microphonePermission).toBe("undetermined");
    adapter.dispose();
  });

  test("requestPermissions re-probes: the snapshot reflects the fresh grant", async () => {
    providerState.mic = { granted: false, status: "undetermined", canAskAgain: true };
    providerState.speech = { granted: false, status: "undetermined", canAskAgain: true };
    const { adapter } = makeAdapter();
    expect((await adapter.probeCapabilities()).scoredEligible).toBe(false);
    const cap = await adapter.requestPermissions();
    expect(cap.microphonePermission).toBe("granted");
    expect(cap.scoredEligible).toBe(true);
    adapter.dispose();
  });
});

describe("startAttempt wiring (§12/§13)", () => {
  test("practice mode: interim results on, contextual bias allowed, n-best requested", async () => {
    const { adapter } = makeAdapter();
    await adapter.probeCapabilities();
    adapter.startAttempt(startOpts({ contextualStrings: ["le lait", "du pain"] }));
    expect(calls.start).toHaveLength(1);
    const options = calls.start[0];
    expect(options.lang).toBe("fr-FR");
    expect(options.interimResults).toBe(true);
    expect(options.maxAlternatives).toBe(5);
    expect(options.continuous).toBe(false);
    expect(options.addsPunctuation).toBe(false);
    expect(options.contextualStrings).toEqual(["le lait", "du pain"]);
    expect(options.requiresOnDeviceRecognition).toBe(true);
    adapter.dispose();
  });

  test("scored mode STRIPS contextual bias and interim results (§13)", async () => {
    const { adapter } = makeAdapter();
    await adapter.probeCapabilities();
    adapter.startAttempt(
      startOpts({ mode: "scored", contextualStrings: ["je voudrais un café"] })
    );
    const options = calls.start[0];
    expect(options.interimResults).toBe(false);
    expect(options.contextualStrings).toBeUndefined();
    adapter.dispose();
  });

  test("without a proven on-device French model, on-device is not forced", async () => {
    providerState.installedLocales = [];
    const { adapter } = makeAdapter();
    await adapter.probeCapabilities();
    adapter.startAttempt(startOpts());
    expect(calls.start[0].requiresOnDeviceRecognition).toBe(false);
    adapter.dispose();
  });

  test("persisted recording goes into the sweepable speech cache only (§8/§27)", () => {
    const { adapter } = makeAdapter();
    adapter.startAttempt(startOpts({ persistRecording: true }));
    expect(calls.start[0].recordingOptions).toEqual({
      persist: true,
      outputDirectory: "cache/speech-attempts",
      outputFileName: "attempt-att-1.wav",
    });
    expect(memDirs.has("cache/speech-attempts")).toBe(true);
    adapter.dispose();
  });

  test("no persistence requested → persist:false, no directory created", () => {
    const { adapter } = makeAdapter();
    adapter.startAttempt(startOpts());
    expect(calls.start[0].recordingOptions).toEqual({ persist: false });
    expect(memDirs.size).toBe(0);
    adapter.dispose();
  });

  test("attempts are serialized: concurrent start throws, end frees the slot", () => {
    const { adapter } = makeAdapter();
    adapter.startAttempt(startOpts({ attemptId: "att-1" }));
    expect(() => adapter.startAttempt(startOpts({ attemptId: "att-2" }))).toThrow(/att-1/);
    fire("end", null);
    adapter.startAttempt(startOpts({ attemptId: "att-2" }));
    expect(calls.start).toHaveLength(2);
    adapter.dispose();
  });

  test("stop/abort are id-guarded: a stale id never reaches the engine", () => {
    const { adapter } = makeAdapter();
    adapter.startAttempt(startOpts({ attemptId: "att-1" }));
    adapter.stopAttempt("att-STALE");
    adapter.abortAttempt("att-STALE");
    expect(calls.stop).toBe(0);
    expect(calls.abort).toBe(0);
    adapter.stopAttempt("att-1");
    expect(calls.stop).toBe(1);
    adapter.abortAttempt("att-1");
    expect(calls.abort).toBe(1);
    adapter.dispose();
  });
});

describe("event translation and attempt stamping (§9)", () => {
  test("a full happy path: started → partial → final → end, all stamped", async () => {
    const { adapter, events } = makeAdapter();
    await adapter.probeCapabilities();
    adapter.startAttempt(startOpts({ attemptId: "att-9" }));

    fire("start", null);
    fire("result", { isFinal: false, results: [{ transcript: "je vou" }] });
    fire("result", {
      isFinal: true,
      results: [
        { transcript: "je voudrais un café" },
        { transcript: "je voudrai un café" },
      ],
    });
    fire("end", null);

    expect(events.map((e) => e.type)).toEqual(["started", "partial", "final", "end"]);
    expect(events.every((e) => e.attemptId === "att-9")).toBe(true);

    const partial = events[1];
    if (partial.type !== "partial") throw new Error("expected partial");
    expect(partial.transcript).toBe("je vou");

    const final = events[2];
    if (final.type !== "final") throw new Error("expected final");
    expect(final.result.finalTranscript).toBe("je voudrais un café");
    expect(final.result.alternatives).toEqual(["je voudrai un café"]);
    expect(final.result.recognitionMode).toBe("on_device");
    expect(final.result.locale).toBe("fr-FR");
    expect(final.result.durationMs).toBeGreaterThanOrEqual(0);
    expect(final.result.recordingUri).toBeNull();
    adapter.dispose();
  });

  test("recognition mode is honest: no proven local model → network_possible", async () => {
    providerState.installedLocales = [];
    const { adapter, events } = makeAdapter();
    await adapter.probeCapabilities();
    adapter.startAttempt(startOpts());
    fire("result", { isFinal: true, results: [{ transcript: "bonjour" }] });
    const final = events.find((e) => e.type === "final");
    if (final?.type !== "final") throw new Error("expected final");
    expect(final.result.recognitionMode).toBe("network_possible");
    adapter.dispose();
  });

  test("an empty final result emits nothing (nomatch carries that case)", () => {
    const { adapter, events } = makeAdapter();
    adapter.startAttempt(startOpts());
    fire("result", { isFinal: true, results: [] });
    fire("result", { isFinal: true, results: [{ transcript: "" }] });
    expect(events).toHaveLength(0);
    adapter.dispose();
  });

  test("nomatch → no-speech; speech-timeout normalizes to no-speech (§9)", () => {
    const { adapter, events } = makeAdapter();
    adapter.startAttempt(startOpts());
    fire("nomatch", null);
    fire("error", { error: "speech-timeout", message: "no speech before timeout" });
    expect(events).toEqual([
      { attemptId: "att-1", type: "error", code: "no-speech" },
      { attemptId: "att-1", type: "error", code: "no-speech" },
    ]);
    adapter.dispose();
  });

  test("unknown provider error codes normalize to 'unknown', known pass through", () => {
    const { adapter, events } = makeAdapter();
    adapter.startAttempt(startOpts());
    fire("error", { error: "busy", message: "" });
    fire("error", { error: "some-future-code", message: "" });
    fire("error", null);
    const codes = events.map((e) => (e.type === "error" ? e.code : "?"));
    expect(codes).toEqual(["busy", "unknown", "unknown"]);
    adapter.dispose();
  });

  test("audioend with a uri emits recordingReady; without one, nothing", () => {
    const { adapter, events } = makeAdapter();
    adapter.startAttempt(startOpts({ attemptId: "att-3", persistRecording: true }));
    fire("audioend", { uri: null });
    expect(events).toHaveLength(0);
    fire("audioend", { uri: "cache/speech-attempts/attempt-att-3.wav" });
    expect(events).toEqual([
      {
        attemptId: "att-3",
        type: "recordingReady",
        uri: "cache/speech-attempts/attempt-att-3.wav",
      },
    ]);
    adapter.dispose();
  });

  test("native noise with NO active attempt is dropped (stale-callback immunity)", () => {
    const { adapter, events } = makeAdapter();
    fire("start", null);
    fire("result", { isFinal: true, results: [{ transcript: "fantôme" }] });
    fire("error", { error: "network", message: "" });
    fire("end", null);
    expect(events).toHaveLength(0);

    adapter.startAttempt(startOpts());
    fire("end", null); // finishes the attempt, frees the slot
    events.length = 0;
    fire("result", { isFinal: true, results: [{ transcript: "trop tard" }] });
    expect(events).toHaveLength(0);
    adapter.dispose();
  });

  test("a listener that starts the NEXT attempt on 'end' is not clobbered by the slot-free", () => {
    const adapter = new ExpoSpeechRecognizerAdapter();
    const seen: SpeechAdapterEvent[] = [];
    adapter.addListener((event) => {
      seen.push(event);
      if (event.type === "end" && event.attemptId === "att-1") {
        adapter.startAttempt(startOpts({ attemptId: "att-2" }));
      }
    });
    adapter.startAttempt(startOpts({ attemptId: "att-1" }));
    fire("end", null);
    // att-2 must still hold the slot: a third start collides with att-2.
    expect(() => adapter.startAttempt(startOpts({ attemptId: "att-3" }))).toThrow(/att-2/);
    adapter.dispose();
  });
});

describe("dispose (§9 late-callback neutering)", () => {
  test("dispose removes native subscriptions and drops all later events", () => {
    const { adapter, events } = makeAdapter();
    adapter.startAttempt(startOpts());
    const subscribed = calls.removed;
    adapter.dispose();
    expect(calls.removed).toBeGreaterThan(subscribed);
    fire("result", { isFinal: true, results: [{ transcript: "après la mort" }] });
    fire("end", null);
    expect(events).toHaveLength(0);
  });

  test("a disposed adapter refuses new attempts and ignores stop/abort", () => {
    const { adapter } = makeAdapter();
    adapter.dispose();
    expect(() => adapter.startAttempt(startOpts())).toThrow(/disposed/);
    adapter.stopAttempt("att-1");
    adapter.abortAttempt("att-1");
    expect(calls.stop).toBe(0);
    expect(calls.abort).toBe(0);
  });
});

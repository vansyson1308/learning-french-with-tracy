/**
 * SpeechRecognizerPort adapter over expo-speech-recognition 56.0.4 (pinned;
 * see content/fr/speech/RESEARCH.md for the source-level evaluation). The
 * ONLY module in the app that imports the provider.
 *
 * Responsibilities beyond translation:
 *  - stamp every native event with the attempt id it belongs to, so stale
 *    callbacks from a disposed/previous attempt can never reach a newer
 *    machine (P8 §9);
 *  - serialize attempts (one active at a time; concurrent start throws);
 *  - prefer on-device recognition whenever the French model is installed;
 *  - strip contextual bias from scored attempts (defense in depth, §13);
 *  - keep persisted attempt audio inside one sweepable cache subdirectory.
 */

import { Platform } from "react-native";
import {
  ExpoSpeechRecognitionModule,
  type ExpoSpeechRecognitionOptions,
} from "expo-speech-recognition";

import type {
  SpeechAdapterEvent,
  SpeechRecognizerPort,
  StartAttemptOptions,
} from "./recognizer-port";
import type { AttemptErrorCode } from "./attempt-machine";
import { ensureSpeechCacheDirectory } from "./speech-cache";
import {
  FRENCH_LOCALE,
  unavailableCapability,
  type SpeechCapability,
  type SpeechPermissionState,
} from "./types";

/** Distributive omit: each event variant minus its stamp (added by emit). */
type UnstampedEvent = SpeechAdapterEvent extends infer E
  ? E extends { attemptId: string }
    ? Omit<E, "attemptId"> & { attemptId?: string }
    : never
  : never;

export const SPEECH_PROVIDER = "expo-speech-recognition";
export const SPEECH_PROVIDER_VERSION = "56.0.4";
export { FRENCH_LOCALE };

type ExpoPermissionResponse = {
  granted: boolean;
  status: string;
  canAskAgain?: boolean;
  restricted?: boolean;
};

function toPermissionState(response: ExpoPermissionResponse | null): SpeechPermissionState {
  if (!response) return "undetermined";
  if (response.restricted) return "restricted";
  if (response.granted) return "granted";
  if (response.status === "undetermined") return "undetermined";
  return response.canAskAgain === false ? "cannotAskAgain" : "denied";
}

const KNOWN_ERROR_CODES: readonly AttemptErrorCode[] = [
  "no-speech",
  "aborted",
  "interrupted",
  "not-allowed",
  "service-not-allowed",
  "language-not-supported",
  "network",
  "busy",
  "audio-capture",
  "client",
];

function normalizeErrorCode(code: string): AttemptErrorCode {
  // Android's speech-timeout is the platform's "no speech before timeout".
  if (code === "speech-timeout") return "no-speech";
  return (KNOWN_ERROR_CODES as readonly string[]).includes(code)
    ? (code as AttemptErrorCode)
    : "unknown";
}

export class ExpoSpeechRecognizerAdapter implements SpeechRecognizerPort {
  private listeners = new Set<(event: SpeechAdapterEvent) => void>();
  private subscriptions: { remove(): void }[] = [];
  private activeAttemptId: string | null = null;
  private activeStartedAt = 0;
  private activeMode: StartAttemptOptions["mode"] = "practice";
  private activeLocale = FRENCH_LOCALE;
  private onDeviceUsed = false;
  private disposed = false;
  private cachedCapability: SpeechCapability | null = null;

  constructor() {
    this.subscribe();
  }

  private subscribe() {
    const add = <T,>(name: string, handler: (payload: T) => void) => {
      this.subscriptions.push(
        ExpoSpeechRecognitionModule.addListener(name as never, handler as never)
      );
    };
    add<null>("start", () => {
      this.emit({ type: "started", at: Date.now() });
    });
    add<{ isFinal: boolean; results: { transcript: string }[] }>("result", (event) => {
      const transcripts = (event?.results ?? [])
        .map((r) => r.transcript)
        .filter((t) => typeof t === "string" && t.length > 0);
      if (transcripts.length === 0) return;
      if (event.isFinal) {
        const attemptId = this.activeAttemptId;
        if (attemptId === null) return;
        this.emit({
          type: "final",
          result: {
            attemptId,
            finalTranscript: transcripts[0],
            alternatives: transcripts.slice(1),
            locale: this.activeLocale,
            provider: SPEECH_PROVIDER,
            recognitionMode: this.onDeviceUsed ? "on_device" : "network_possible",
            durationMs: Math.max(0, Date.now() - this.activeStartedAt),
            recordingUri: null,
          },
        });
      } else {
        this.emit({ type: "partial", transcript: transcripts[0] });
      }
    });
    // An empty final result: the engine finished with nothing significant.
    add<null>("nomatch", () => this.emit({ type: "error", code: "no-speech" }));
    add<{ error: string; message: string }>("error", (event) => {
      this.emit({ type: "error", code: normalizeErrorCode(event?.error ?? "unknown") });
    });
    add<{ uri: string | null }>("audioend", (event) => {
      if (event?.uri) this.emit({ type: "recordingReady", uri: event.uri });
    });
    add<null>("end", () => {
      // Read-and-clear BEFORE notifying: "end" is terminal, and a listener
      // may legitimately start the next attempt synchronously from it, so
      // the serialization slot must already be free when listeners run. The
      // event still carries the ended attempt's id via the explicit stamp.
      const ended = this.activeAttemptId;
      if (ended === null) return; // stale end with no active attempt
      this.activeAttemptId = null;
      this.emit({ type: "end", attemptId: ended });
    });
  }

  private emit(event: UnstampedEvent) {
    if (this.disposed) return;
    const attemptId = event.attemptId ?? this.activeAttemptId;
    if (attemptId === null) return; // no active attempt: stale native noise
    const stamped = { ...event, attemptId } as SpeechAdapterEvent;
    for (const listener of this.listeners) listener(stamped);
  }

  async probeCapabilities(): Promise<SpeechCapability> {
    const platform =
      Platform.OS === "ios" || Platform.OS === "android" || Platform.OS === "web"
        ? Platform.OS
        : "unknown";
    let available = false;
    try {
      available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
    } catch {
      return unavailableCapability(platform, SPEECH_PROVIDER);
    }
    if (!available) return unavailableCapability(platform, SPEECH_PROVIDER);

    let onDevice = false;
    let recording = false;
    try {
      onDevice = ExpoSpeechRecognitionModule.supportsOnDeviceRecognition();
      recording = ExpoSpeechRecognitionModule.supportsRecording();
    } catch {
      // Conservative: capabilities stay false.
    }

    let frenchAvailable = platform !== "web"; // system recognizers offer fr-FR
    let frenchInstalled = false;
    try {
      const locales = await ExpoSpeechRecognitionModule.getSupportedLocales({});
      const isFrench = (l: string) => l.toLowerCase().startsWith("fr");
      if (locales.locales.length > 0 || locales.installedLocales.length > 0) {
        frenchAvailable =
          locales.locales.some(isFrench) || locales.installedLocales.some(isFrench);
      }
      frenchInstalled = locales.installedLocales.some(isFrench);
    } catch {
      // Some Android services cannot enumerate locales; keep the
      // conservative defaults above (available, not proven installed).
    }

    const [mic, speech] = await Promise.all([
      ExpoSpeechRecognitionModule.getMicrophonePermissionsAsync().catch(() => null),
      ExpoSpeechRecognitionModule.getSpeechRecognizerPermissionsAsync().catch(() => null),
    ]);
    const micState = toPermissionState(mic as ExpoPermissionResponse | null);
    const speechState =
      platform === "android" ? micState : toPermissionState(speech as ExpoPermissionResponse | null);

    const capability: SpeechCapability = {
      platform,
      available,
      microphonePermission: micState,
      speechPermission: speechState,
      frenchRecognitionAvailable: frenchAvailable,
      onDeviceRecognitionAvailable: onDevice,
      frenchOnDeviceModelInstalled: onDevice && frenchInstalled,
      networkBackedRecognitionPossible: !onDevice || !frenchInstalled,
      recordingPersistenceAvailable: recording,
      provider: SPEECH_PROVIDER,
      providerVersion: SPEECH_PROVIDER_VERSION,
      // Scored production never depends on browser speech (P8 §25).
      scoredEligible:
        platform !== "web" &&
        available &&
        frenchAvailable &&
        micState === "granted" &&
        speechState === "granted",
    };
    this.cachedCapability = capability;
    return capability;
  }

  async requestPermissions(): Promise<SpeechCapability> {
    try {
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    } catch {
      // Denials surface through the refreshed snapshot below.
    }
    return this.probeCapabilities();
  }

  startAttempt(options: StartAttemptOptions): void {
    if (this.disposed) throw new Error("speech adapter disposed");
    if (this.activeAttemptId !== null) {
      throw new Error(
        `speech attempt ${this.activeAttemptId} is still active — one attempt at a time`
      );
    }
    this.activeAttemptId = options.attemptId;
    this.activeStartedAt = Date.now();
    this.activeMode = options.mode;
    this.activeLocale = options.locale;
    const onDevicePreferred =
      this.cachedCapability?.frenchOnDeviceModelInstalled === true;
    this.onDeviceUsed = onDevicePreferred;

    const startOptions: ExpoSpeechRecognitionOptions = {
      lang: options.locale,
      interimResults: options.mode === "practice",
      maxAlternatives: 5,
      continuous: false,
      // Local-first (P8 §8): never send audio off-device when the French
      // model is installed; otherwise the SYSTEM service may use the
      // network, which the UI discloses before recording.
      requiresOnDeviceRecognition: onDevicePreferred,
      addsPunctuation: false,
      // Persisted audio goes ONLY into the sweepable speech cache (§8/§27);
      // if the directory can't be created, degrade to no-replay rather
      // than letting the provider write to its own default location.
      recordingOptions: options.persistRecording
        ? (() => {
            const dir = ensureSpeechCacheDirectory();
            return dir
              ? {
                  persist: true,
                  outputDirectory: dir.uri,
                  // Used verbatim by both platforms; both write WAV.
                  outputFileName: `attempt-${options.attemptId}.wav`,
                }
              : { persist: false };
          })()
        : { persist: false },
      // §13: contextual bias is a PRACTICE affordance only.
      contextualStrings:
        options.mode === "practice" ? options.contextualStrings : undefined,
    };
    ExpoSpeechRecognitionModule.start(startOptions);
  }

  stopAttempt(attemptId: string): void {
    if (this.disposed || attemptId !== this.activeAttemptId) return;
    ExpoSpeechRecognitionModule.stop();
  }

  abortAttempt(attemptId: string): void {
    if (this.disposed || attemptId !== this.activeAttemptId) return;
    ExpoSpeechRecognitionModule.abort();
  }

  addListener(listener: (event: SpeechAdapterEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  dispose(): void {
    this.disposed = true;
    this.activeAttemptId = null;
    for (const sub of this.subscriptions) sub.remove();
    this.subscriptions = [];
    this.listeners.clear();
  }
}

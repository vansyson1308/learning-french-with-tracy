/**
 * Speech capability + result model (P8 §7). UI never infers these facts from
 * exceptions: one immutable snapshot describes what THIS device/session can
 * do, and every surface gates on it. Recognition results carry diagnosis
 * metadata without ever persisting audio or entering the store.
 */

/** The one recognition locale scored French production ever uses. */
export const FRENCH_LOCALE = "fr-FR";

export type SpeechPermissionState =
  | "undetermined"
  | "granted"
  | "denied"
  | "restricted"
  | "cannotAskAgain";

export type SpeechCapability = {
  platform: "ios" | "android" | "web" | "unknown";
  /** A recognizer implementation exists and reports itself available. */
  available: boolean;
  microphonePermission: SpeechPermissionState;
  speechPermission: SpeechPermissionState;
  /** French ("fr-FR") recognition is offered by the platform recognizer. */
  frenchRecognitionAvailable: boolean;
  /** The platform supports on-device (no-network) recognition at all. */
  onDeviceRecognitionAvailable: boolean;
  /** A French on-device model is installed (subset of the above). */
  frenchOnDeviceModelInstalled: boolean;
  /**
   * The system recognizer may process audio over the network (the platform's
   * own service — never a third-party SaaS). Disclosed in UI when it is the
   * only mode; never silently chosen when on-device is available.
   */
  networkBackedRecognitionPossible: boolean;
  /** The provider can persist the attempt's audio for own-voice replay. */
  recordingPersistenceAvailable: boolean;
  provider: string;
  providerVersion: string;
  /**
   * Everything a SCORED attempt needs: recognizer available, French
   * available, both permissions granted. Placement/checkpoint speaking runs
   * only when true; otherwise those stages report not_estimated.
   */
  scoredEligible: boolean;
};

/** The capability shape for environments with no recognizer at all. */
export function unavailableCapability(
  platform: SpeechCapability["platform"],
  provider = "none"
): SpeechCapability {
  return {
    platform,
    available: false,
    microphonePermission: "undetermined",
    speechPermission: "undetermined",
    frenchRecognitionAvailable: false,
    onDeviceRecognitionAvailable: false,
    frenchOnDeviceModelInstalled: false,
    networkBackedRecognitionPossible: false,
    recordingPersistenceAvailable: false,
    provider,
    providerVersion: "",
    scoredEligible: false,
  };
}

/** A FINAL recognition result (n-best). Partials never produce one. */
export type SpeechRecognitionResult = {
  attemptId: string;
  /** Best final transcript as delivered by the engine. */
  finalTranscript: string;
  /** Remaining final alternatives, best-first (may be empty). */
  alternatives: string[];
  locale: string;
  provider: string;
  recognitionMode: "on_device" | "network_possible" | "unknown";
  durationMs: number;
  /**
   * Cache-file URI of the attempt's audio when persistence was requested
   * and the platform delivered one. NEVER persisted to the store/backups;
   * deleted when the step no longer needs it.
   */
  recordingUri: string | null;
};

/** Why an attempt ended without usable learner evidence. */
export type SpeechTechnicalReason =
  | "audio_capture"
  | "recognizer_busy"
  | "service_unavailable"
  | "language_unsupported"
  | "network_failed"
  | "interrupted"
  | "backgrounded"
  | "finalize_timeout"
  | "no_final_result"
  | "unknown";

/**
 * Terminal outcome of one attempt. The four non-final kinds are all
 * DEVICE/TECHNICAL states for assessment purposes — only "final" can ever
 * be graded, and only "final" with wrong French is learner evidence.
 * "no_speech" is kept distinct from technical failures so the UI can say
 * "I didn't hear anything" rather than "something went wrong".
 */
export type SpeechOutcome =
  | { kind: "final"; result: SpeechRecognitionResult }
  | { kind: "no_speech" }
  | { kind: "technical"; reason: SpeechTechnicalReason }
  | { kind: "permission_denied" }
  | { kind: "aborted" };

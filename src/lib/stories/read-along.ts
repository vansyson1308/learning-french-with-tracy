/**
 * Story read-along without bundled audio (QC 2026-10-29b §2.4). Pure: no
 * expo-speech import, so it runs under bun test.
 *
 *   - storyAudioSource: "bundled" when every sentence has a bundled asset,
 *     otherwise "device-voice". This is the one seam: the audio pipeline
 *     will add a per-story field to the compiled stories artifact; when it
 *     lands, read it here (and nowhere else).
 *   - pickDeviceVoice: the installed, local TTS voice for the course's
 *     speech locale (exact locale first, then any region of the language).
 *   - readAlongMode: bundled | device-voice | text-only.
 *   - readAlongReducer / readAlongCommand: the sentence sequencing that
 *     drives the highlight. Each sentence is one utterance; its onDone moves
 *     to the next; pause, background, an error or leaving the reader stop.
 *
 * Never a silent fallback: a story with bundled audio always uses the
 * bundled player, whatever voices the device has.
 */

import { initialStoryPlayback, storyPlaybackReducer, type StoryPlaybackState } from "./playback";

export type StoryAudioSource = "bundled" | "device-voice";
export type ReadAlongMode = "bundled" | "device-voice" | "text-only";

/** assetKey → bundled module (the compiled `storyAssets` of a course). */
export type StoryAudioManifest = Readonly<Record<string, unknown>>;

export function storyAudioSource(
  story: { readonly sentences: readonly { readonly assetKey: string }[] },
  manifest: StoryAudioManifest
): StoryAudioSource {
  const bundled =
    story.sentences.length > 0 &&
    story.sentences.every((s) => manifest[s.assetKey] !== undefined && manifest[s.assetKey] !== null);
  return bundled ? "bundled" : "device-voice";
}

/** The fields of an expo-speech `Voice` (and web `WebVoice`) this engine reads. */
export type DeviceVoice = {
  identifier: string;
  name?: string;
  language: string;
  /** "Default" | "Enhanced" (expo-speech VoiceQuality). */
  quality?: string;
  /** Web only: false = the browser synthesises on a server. */
  localService?: boolean;
};

/** Read-along speech rate (1 = normal): a little slower, like speakTarget. The story player has no slow mode. */
export const DEVICE_VOICE_RATE = 0.9;

const NETWORK_NAME = /(^|[-_.\s])network($|[-_.\s])/i;
const LOCAL_NAME = /(^|[-_.\s])local($|[-_.\s])/i;

function normLocale(tag: string): string {
  return tag.trim().replace(/_/g, "-").toLowerCase();
}

function names(v: DeviceVoice): string[] {
  return [v.identifier, v.name ?? ""];
}

/**
 * Whether a voice synthesises on the device. expo-speech exposes no
 * `networkConnectionRequired` flag on Android, so a Google TTS voice is
 * judged by its name (`…-network` vs `…-local`); the web build reports
 * `localService`. iOS voices are always on-device.
 */
export function isLocalVoice(v: DeviceVoice): boolean {
  if (v.localService === false) return false;
  return !names(v).some((n) => NETWORK_NAME.test(n));
}

function explicitlyLocal(v: DeviceVoice): boolean {
  return v.localService === true || names(v).some((n) => LOCAL_NAME.test(n));
}

/**
 * The voice to read a story in, or null when none is installed for the
 * locale's language. Tiers: exact locale (es-ES), then same language
 * (es-MX, es-US, or any es-* for a bare "es"). Within a tier: an explicitly
 * local voice, then enhanced quality, then identifier order (deterministic).
 */
export function pickDeviceVoice(voices: readonly DeviceVoice[], locale: string): DeviceVoice | null {
  const want = normLocale(locale);
  const wantLang = want.split("-")[0];
  if (!wantLang) return null;
  const rank = (v: DeviceVoice): number | null => {
    const lang = normLocale(v.language);
    if (!lang || !isLocalVoice(v)) return null;
    if (lang === want) return 0;
    return lang.split("-")[0] === wantLang ? 1 : null;
  };
  const candidates = voices
    .map((v) => ({ v, tier: rank(v) }))
    .filter((c): c is { v: DeviceVoice; tier: number } => c.tier !== null);
  candidates.sort(
    (a, b) =>
      a.tier - b.tier ||
      Number(explicitlyLocal(b.v)) - Number(explicitlyLocal(a.v)) ||
      Number(b.v.quality === "Enhanced") - Number(a.v.quality === "Enhanced") ||
      (a.v.identifier < b.v.identifier ? -1 : a.v.identifier > b.v.identifier ? 1 : 0)
  );
  return candidates[0]?.v ?? null;
}

export function readAlongMode(source: StoryAudioSource, voice: DeviceVoice | null): ReadAlongMode {
  if (source === "bundled") return "bundled";
  return voice ? "device-voice" : "text-only";
}

// ---- device-voice sequencing ------------------------------------------------

export type ReadAlongState = StoryPlaybackState & {
  /** Bumped whenever a sentence must be (re)spoken; an onDone of an older utterance is stale. */
  utterance: number;
};

export type ReadAlongEvent =
  | { type: "play" }
  | { type: "playFrom"; index: number }
  | { type: "pause" }
  | { type: "appBackground" }
  | { type: "utteranceDone"; utterance: number }
  | { type: "utteranceError"; utterance: number }
  | { type: "leave" };

export const initialReadAlong: ReadAlongState = { ...initialStoryPlayback, utterance: 0 };

export type ReadAlongCommand = { kind: "speak"; index: number; utterance: number } | { kind: "stop" };

export function readAlongReducer(count: number) {
  const playback = storyPlaybackReducer(count);
  return (state: ReadAlongState, event: ReadAlongEvent): ReadAlongState => {
    if (count <= 0) return state;
    switch (event.type) {
      case "utteranceDone":
        if (event.utterance !== state.utterance) return state;
        return advance(state, playback(state, { type: "sentenceEnded" }));
      case "utteranceError":
        if (event.utterance !== state.utterance) return state;
        return advance(state, playback(state, { type: "pause" }));
      case "leave":
        return state.index === null && !state.playing ? state : { ...state, index: null, playing: false };
      default:
        return advance(state, playback(state, event));
    }
  };
}

/** A new utterance starts when playback (re)starts or moves to another sentence. */
function advance(prev: ReadAlongState, next: StoryPlaybackState): ReadAlongState {
  if (next === prev) return prev;
  const restarts = next.playing && (!prev.playing || next.index !== prev.index);
  return { ...next, utterance: restarts ? prev.utterance + 1 : prev.utterance };
}

/** What the speech adapter must do for a state: speak the current sentence, or be silent. */
export function readAlongCommand(state: ReadAlongState): ReadAlongCommand {
  return state.playing && state.index !== null
    ? { kind: "speak", index: state.index, utterance: state.utterance }
    : { kind: "stop" };
}

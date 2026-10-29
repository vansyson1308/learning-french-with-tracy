/**
 * React adapters for the device-voice read-along (QC 2026-10-29b §2.4).
 * Every rule lives in read-along.ts; this file only talks to expo-speech.
 *
 * Privacy: expo-speech hands text to the OS text-to-speech engine and plays
 * it; nothing is recorded, written to disk or sent by the app. Only voices
 * judged local are used (isLocalVoice), and the chosen voice is passed by
 * identifier so the engine cannot swap in its network variant.
 */

import * as Speech from "expo-speech";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AppState } from "react-native";

import {
  DEVICE_VOICE_RATE,
  initialReadAlong,
  pickDeviceVoice,
  readAlongCommand,
  readAlongReducer,
  type DeviceVoice,
  type ReadAlongState,
} from "./read-along";

/** The web voice list may never populate (no `voiceschanged`): give up, show text only. */
const VOICE_LOOKUP_TIMEOUT_MS = 3000;

async function installedVoices(): Promise<DeviceVoice[]> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<DeviceVoice[]>((resolve) => {
    timer = setTimeout(() => resolve([]), VOICE_LOOKUP_TIMEOUT_MS);
  });
  try {
    const voices = await Promise.race([Speech.getAvailableVoicesAsync(), timeout]);
    return Array.isArray(voices) ? (voices as DeviceVoice[]) : [];
  } catch {
    // No TTS engine, or it failed to initialise: the story is read as text.
    return [];
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

/**
 * The installed local voice for `locale`: undefined while looking, null when
 * there is none. Looks again when the app returns to the foreground (the
 * learner may have just installed the voice in Android settings).
 */
export function useDeviceVoice(locale: string, enabled: boolean): DeviceVoice | null | undefined {
  const [found, setFound] = useState<{ locale: string; voice: DeviceVoice | null } | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const look = () => {
      installedVoices().then((voices) => {
        if (alive) setFound({ locale, voice: pickDeviceVoice(voices, locale) });
      });
    };
    look();
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") look();
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, [enabled, locale]);
  if (!enabled) return null;
  return found?.locale === locale ? found.voice : undefined;
}

export type DeviceReadAlongApi = {
  state: ReadAlongState;
  /**
   * The engine reported an error speaking (Android lists voices whose data is
   * not downloaded, and expo-speech does not expose that flag): the reader
   * then treats the story as having no voice.
   */
  voiceFailed: boolean;
  play: () => void;
  playFrom: (index: number) => void;
  pause: () => void;
  /** Stop and cancel (the learner leaves the reading phase). */
  leave: () => void;
};

/** Sentence-by-sentence read-along of `texts` in `voice` (null = silent). */
export function useDeviceReadAlong(texts: readonly string[], voice: DeviceVoice | null): DeviceReadAlongApi {
  const reducer = useMemo(() => readAlongReducer(voice ? texts.length : 0), [voice, texts.length]);
  const [state, dispatch] = useReducer(reducer, initialReadAlong);
  const [failedVoice, setFailedVoice] = useState<string | null>(null);
  const command = readAlongCommand(state);
  const speakKey = command.kind === "speak" ? command.utterance : null;
  const voiceId = voice?.identifier ?? null;
  // Speech.stop() only once this reader has spoken: a bundled-audio story never touches TTS.
  const spoke = useRef(false);

  useEffect(() => {
    if (command.kind !== "speak" || !voice) {
      if (spoke.current) Speech.stop();
      return;
    }
    const { index, utterance } = command;
    spoke.current = true;
    Speech.stop();
    Speech.speak(texts[index] ?? "", {
      language: voice.language,
      voice: voice.identifier,
      rate: DEVICE_VOICE_RATE,
      onDone: () => dispatch({ type: "utteranceDone", utterance }),
      onError: () => {
        dispatch({ type: "utteranceError", utterance });
        setFailedVoice(voice.identifier);
      },
    });
    // Only a new utterance (or stopping) re-runs; the command is derived from state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakKey, voiceId]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") dispatch({ type: "appBackground" });
    });
    return () => {
      sub.remove();
      // Unmounting the reader cancels whatever is being spoken.
      if (spoke.current) Speech.stop();
    };
  }, []);

  return {
    state,
    // Per voice: a voice found later (installed meanwhile) gets its own chance.
    voiceFailed: voice !== null && failedVoice === voice.identifier,
    play: () => dispatch({ type: "play" }),
    playFrom: (index: number) => dispatch({ type: "playFrom", index }),
    pause: () => dispatch({ type: "pause" }),
    leave: () => dispatch({ type: "leave" }),
  };
}

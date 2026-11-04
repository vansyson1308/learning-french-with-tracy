/**
 * React adapter for device-voice listening (QC 2026-11-05 §2.1): the same
 * pure listening-player machine as bundled clips (play budget, slow mode,
 * technical interruptions that never consume a play — P7 §17-24), driving
 * expo-speech instead of expo-audio. The clip's utterances are spoken one
 * after another; finishing the last one is a completed play. Every rule
 * lives in listening-player.ts and device-voice-listening.ts.
 *
 * A course without device-voice listening never reaches expo-speech here:
 * with no voice or no utterances the adapter is inert (no speak, no stop).
 */

import * as Speech from "expo-speech";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { AppState } from "react-native";

import type { DeviceVoice } from "../stories/read-along";

import { deviceSpeechRate, type DeviceUtterance } from "./device-voice-listening";
import { canPlay, initialPlayerState, playerReducer, playsLeft, type ListeningPlayerConfig } from "./listening-player";
import type { ListeningPlayerApi } from "./use-listening-player";

export type DeviceListeningPlayerApi = ListeningPlayerApi & {
  /** The engine reported an error (a listed voice whose data is missing): treat as no voice. */
  voiceFailed: boolean;
};

export function useDeviceListeningPlayer(
  utterances: readonly DeviceUtterance[],
  voice: DeviceVoice | null,
  config: ListeningPlayerConfig
): DeviceListeningPlayerApi {
  const [state, dispatch] = useReducer(playerReducer, config, initialPlayerState);
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState<string | null>(null);
  // The utterance being (or next to be) spoken, and a token that makes callbacks of a stopped run stale.
  const indexRef = useRef(0);
  const runRef = useRef(0);
  const spoke = useRef(false);
  const ready = voice !== null && utterances.length > 0;

  const stop = useCallback(() => {
    runRef.current += 1;
    if (spoke.current) Speech.stop();
  }, []);

  const speakFrom = useCallback(
    (from: number, rate: number) => {
      if (!voice) return;
      const run = ++runRef.current;
      const say = (i: number) => {
        const u = utterances[i];
        if (!u) return;
        indexRef.current = i;
        spoke.current = true;
        Speech.speak(u.text, {
          language: voice.language,
          voice: voice.identifier,
          pitch: u.pitch,
          rate: deviceSpeechRate(rate),
          onDone: () => {
            if (run !== runRef.current) return;
            setDone(i + 1);
            if (i + 1 < utterances.length) say(i + 1);
            else {
              indexRef.current = 0;
              dispatch({ type: "finished" });
            }
          },
          onError: () => {
            if (run !== runRef.current) return;
            setFailed(voice.identifier);
            dispatch({ type: "externalPause" });
          },
        });
      };
      say(from);
    },
    [utterances, voice]
  );

  // Backgrounding stops speech; the interruption grants a free resume (P7 §20-21).
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") {
        stop();
        dispatch({ type: "appBackground" });
      }
    });
    return () => {
      sub.remove();
      stop();
    };
  }, [stop]);

  const onPlayPress = useCallback(() => {
    if (!ready || !canPlay(state)) return;
    // A resumed play restarts the utterance it stopped in; a new play starts at the top.
    const from = state.resumeCredit ? indexRef.current : 0;
    if (!state.resumeCredit) setDone(0);
    dispatch({ type: "playPressed" });
    speakFrom(from, state.rate);
  }, [ready, state, speakFrom]);

  const onPausePress = useCallback(() => {
    if (!state.playing) return;
    stop();
    dispatch({ type: "pausePressed" });
  }, [state.playing, stop]);

  const onToggleRate = useCallback(() => {
    dispatch({ type: "toggleRate" });
  }, []);

  return {
    state,
    position: done,
    duration: utterances.length,
    isLoaded: ready,
    playsLeft: playsLeft(state),
    canPlay: ready && canPlay(state),
    onPlayPress,
    onPausePress,
    onToggleRate,
    voiceFailed: voice !== null && failed === voice.identifier,
  };
}

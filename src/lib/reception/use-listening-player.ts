/**
 * React adapter for the pure listening-player machine (P7 §17-24): binds
 * expo-audio's component-lifecycle hooks (useAudioPlayer /
 * useAudioPlayerStatus — released on unmount, §18) to playerReducer.
 * Every policy rule lives in the reducer; this file only wires effects.
 */

import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useCallback, useEffect, useReducer, useRef } from "react";
import { AppState } from "react-native";

import {
  canPlay,
  initialPlayerState,
  playerReducer,
  playsLeft,
  SLOW_RATE,
  type ListeningPlayerConfig,
  type ListeningPlayerState,
} from "./listening-player";

export type ListeningPlayerApi = {
  state: ListeningPlayerState;
  /** Seconds; NaN-safe zeros before load. */
  position: number;
  duration: number;
  isLoaded: boolean;
  playsLeft: number | null;
  canPlay: boolean;
  onPlayPress: () => void;
  onPausePress: () => void;
  onToggleRate: () => void;
};

export function useListeningPlayer(
  source: number | null,
  config: ListeningPlayerConfig
): ListeningPlayerApi {
  const player = useAudioPlayer(source ?? undefined);
  const status = useAudioPlayerStatus(player);
  const [state, dispatch] = useReducer(playerReducer, config, initialPlayerState);
  const ourPauseRef = useRef(false);
  const prevPlayingRef = useRef(false);

  // Clip finished → the machine records a completed play.
  useEffect(() => {
    if (status.didJustFinish) dispatch({ type: "finished" });
  }, [status.didJustFinish]);

  // External stop (headphone/Bluetooth route change, OS interruption):
  // playback went false without our pause and without finishing (§21).
  useEffect(() => {
    const was = prevPlayingRef.current;
    prevPlayingRef.current = status.playing;
    if (was && !status.playing && !status.didJustFinish) {
      if (ourPauseRef.current) {
        ourPauseRef.current = false;
        return;
      }
      dispatch({ type: "externalPause" });
    }
  }, [status.playing, status.didJustFinish]);

  // Backgrounding pauses scored audio; background time never counts (§20).
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") {
        ourPauseRef.current = true;
        player.pause();
        dispatch({ type: "appBackground" });
      }
    });
    return () => sub.remove();
  }, [player]);

  // Rate follows the machine (pitch-corrected slow mode, §22).
  useEffect(() => {
    player.setPlaybackRate(state.rate, "high");
  }, [player, state.rate]);

  const onPlayPress = useCallback(() => {
    if (!canPlay(state) || !status.isLoaded) return;
    // Replay of a finished clip restarts from the top; a paused/interrupted
    // clip resumes where it stopped.
    if (!state.playing && state.everFinished && !state.resumeCredit) {
      player.seekTo(0).catch(() => {});
    }
    player.play();
    dispatch({ type: "playPressed" });
  }, [player, state, status.isLoaded]);

  const onPausePress = useCallback(() => {
    if (!state.playing) return;
    ourPauseRef.current = true;
    player.pause();
    dispatch({ type: "pausePressed" });
  }, [player, state.playing]);

  const onToggleRate = useCallback(() => {
    dispatch({ type: "toggleRate" });
  }, []);

  return {
    state,
    position: Number.isFinite(status.currentTime) ? status.currentTime : 0,
    duration: Number.isFinite(status.duration) ? status.duration : 0,
    isLoaded: status.isLoaded,
    playsLeft: playsLeft(state),
    canPlay: canPlay(state) && status.isLoaded,
    onPlayPress,
    onPausePress,
    onToggleRate,
  };
}

export { SLOW_RATE };
export type { ListeningPlayerConfig };

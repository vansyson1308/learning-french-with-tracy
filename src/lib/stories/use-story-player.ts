/**
 * React adapter for the story playback machine: one expo-audio player whose
 * source follows the current sentence. Every rule lives in playback.ts.
 */

import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useEffect, useMemo, useReducer } from "react";
import { AppState } from "react-native";

import { initialStoryPlayback, storyPlaybackReducer, type StoryPlaybackState } from "./playback";

export type StoryPlayerApi = {
  state: StoryPlaybackState;
  play: () => void;
  playFrom: (index: number) => void;
  pause: () => void;
};

/** `sources[i]`: bundled module of sentence i (the reader offers audio only when all exist). */
export function useStoryPlayer(sources: readonly (number | null)[]): StoryPlayerApi {
  const reducer = useMemo(() => storyPlaybackReducer(sources.length), [sources.length]);
  const [state, dispatch] = useReducer(reducer, initialStoryPlayback);
  const player = useAudioPlayer(sources[0] ?? undefined);
  const status = useAudioPlayerStatus(player);

  // The current sentence's clip, from its start.
  useEffect(() => {
    if (state.index === null) return;
    const source = sources[state.index];
    if (source === null || source === undefined) return;
    player.replace(source);
    if (state.playing) player.play();
    // Only a sentence change reloads; play/pause is the next effect's job.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, state.index]);

  useEffect(() => {
    if (state.playing) player.play();
    else player.pause();
  }, [player, state.playing]);

  useEffect(() => {
    if (status.didJustFinish) dispatch({ type: "sentenceEnded" });
  }, [status.didJustFinish]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      if (next !== "active") dispatch({ type: "appBackground" });
    });
    return () => sub.remove();
  }, []);

  return {
    state,
    play: () => dispatch({ type: "play" }),
    playFrom: (index: number) => dispatch({ type: "playFrom", index }),
    pause: () => dispatch({ type: "pause" }),
  };
}

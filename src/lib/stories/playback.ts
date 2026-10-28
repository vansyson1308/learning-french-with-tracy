/**
 * Story read-along playback (P5b): a pure machine over the story's
 * sentence clips. "Listen" plays the sentences in order from the current
 * one, each sentence highlighted while it plays; tapping a sentence's play
 * button jumps there; the end of the last sentence stops at the top.
 * Backgrounding pauses. Learning mode only — no play caps, nothing scored.
 */

export type StoryPlaybackState = {
  /** Sentence being played (or paused on); null = stopped. */
  index: number | null;
  playing: boolean;
  /** The whole story played through at least once. */
  finishedOnce: boolean;
};

export type StoryPlaybackEvent =
  | { type: "play" }
  | { type: "playFrom"; index: number }
  | { type: "pause" }
  | { type: "sentenceEnded" }
  | { type: "appBackground" };

export const initialStoryPlayback: StoryPlaybackState = { index: null, playing: false, finishedOnce: false };

export function storyPlaybackReducer(count: number) {
  return (state: StoryPlaybackState, event: StoryPlaybackEvent): StoryPlaybackState => {
    if (count <= 0) return state;
    switch (event.type) {
      case "play":
        return { ...state, index: state.index ?? 0, playing: true };
      case "playFrom":
        return event.index >= 0 && event.index < count ? { ...state, index: event.index, playing: true } : state;
      case "pause":
      case "appBackground":
        return state.playing ? { ...state, playing: false } : state;
      case "sentenceEnded": {
        if (state.index === null || !state.playing) return state;
        const next = state.index + 1;
        return next < count ? { ...state, index: next } : { index: null, playing: false, finishedOnce: true };
      }
    }
  };
}

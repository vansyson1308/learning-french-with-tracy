/**
 * Listening-player state machine (P7 §17-24): a PURE reducer the React hook
 * adapts onto expo-audio, so every playback-policy rule — deliberate-play
 * budgets, technical interruptions that never consume the budget, slow-mode
 * gating, background pause — is unit-testable without a device.
 *
 * Vocabulary (P7 §21):
 * - deliberate play  = a play the LEARNER started; scored caps count these
 * - completed play   = audio actually reached the end
 * - interruption     = playback stopped without finishing for a technical
 *                      reason (app background, hardware/route change). It
 *                      grants a resume credit: the next play is free.
 */

export const SLOW_RATE = 0.85;

export type ListeningPlayerConfig = {
  /** Deliberate-play cap; null = unlimited (learning mode). */
  maxPlays: number | null;
  /** Slow playback offered at all (never in scored sessions, §23). */
  allowSlow: boolean;
};

export type ListeningPlayerState = {
  config: ListeningPlayerConfig;
  playing: boolean;
  /** The clip finished at least once. */
  everFinished: boolean;
  deliberatePlays: number;
  completedPlays: number;
  /** Last stop was technical; next play consumes no budget. */
  resumeCredit: boolean;
  rate: 1 | typeof SLOW_RATE;
};

export type ListeningPlayerEvent =
  | { type: "playPressed" }
  | { type: "pausePressed" }
  | { type: "finished" }
  /** Playback stopped without us or the clip ending it (route change etc.). */
  | { type: "externalPause" }
  | { type: "appBackground" }
  | { type: "toggleRate" };

export function initialPlayerState(config: ListeningPlayerConfig): ListeningPlayerState {
  return {
    config,
    playing: false,
    everFinished: false,
    deliberatePlays: 0,
    completedPlays: 0,
    resumeCredit: false,
    rate: 1,
  };
}

/** Plays left under the cap; null = unlimited. */
export function playsLeft(state: ListeningPlayerState): number | null {
  if (state.config.maxPlays === null) return null;
  return Math.max(0, state.config.maxPlays - state.deliberatePlays);
}

export function canPlay(state: ListeningPlayerState): boolean {
  if (state.playing) return false;
  if (state.resumeCredit) return true;
  const left = playsLeft(state);
  return left === null || left > 0;
}

export function playerReducer(
  state: ListeningPlayerState,
  event: ListeningPlayerEvent
): ListeningPlayerState {
  switch (event.type) {
    case "playPressed": {
      if (!canPlay(state)) return state;
      // A technical interruption's resume is free (§21); otherwise the
      // start of a play is what consumes budget.
      if (state.resumeCredit) {
        return { ...state, playing: true, resumeCredit: false };
      }
      return { ...state, playing: true, deliberatePlays: state.deliberatePlays + 1 };
    }
    case "pausePressed":
      // The learner's own pause keeps the play "in progress": resuming it
      // is not a new deliberate play.
      return state.playing ? { ...state, playing: false, resumeCredit: true } : state;
    case "finished":
      return {
        ...state,
        playing: false,
        everFinished: true,
        completedPlays: state.completedPlays + 1,
        resumeCredit: false,
      };
    case "externalPause":
    case "appBackground":
      // Technical interruption (§20-21): never learner failure, never a
      // consumed play — grant the resume credit.
      return state.playing ? { ...state, playing: false, resumeCredit: true } : state;
    case "toggleRate": {
      if (!state.config.allowSlow) return state; // structural (§23)
      return { ...state, rate: state.rate === 1 ? SLOW_RATE : 1 };
    }
  }
}

/**
 * Playback probe for the acceptance-only Opus diagnostics screen
 * (src/app/diagnostics/opus.tsx, bundled only when the build sets
 * LFT_ACCEPTANCE_DIAGNOSTICS=1, see metro.config.js). A PURE reducer over
 * expo-audio status snapshots, so the verdict rules are unit-tested without
 * a device:
 *
 *   start -> "normal" phase (rate 1): loaded, playing, finished
 *         -> "slow" phase (the listening player's SLOW_RATE): loaded,
 *            playing, finished
 *         -> "done"
 *
 * Any decoder/player error, or a phase that does not finish in time, ends
 * the probe as a failure. The verdict is "pass" only when both phases saw
 * every event and no error arrived.
 */

export type ProbePhaseName = "normal" | "slow";

/** The subset of expo-audio's AudioStatus the probe reads. */
export type ProbeStatus = {
  isLoaded: boolean;
  playing: boolean;
  didJustFinish: boolean;
  error?: string | null;
  playbackRate?: number;
  currentTime?: number;
  duration?: number;
};

export type PhaseLog = {
  loaded: boolean;
  playing: boolean;
  finished: boolean;
  /** The last playback rate reported while playing (null when the player reports none). */
  rateSeen: number | null;
  /** Largest position reported (seconds). */
  maxPosition: number;
  startedAtMs: number | null;
  finishedAtMs: number | null;
};

export type ProbeState = {
  phase: "idle" | ProbePhaseName | "done";
  normal: PhaseLog;
  slow: PhaseLog;
  error: string | null;
  timedOut: ProbePhaseName | null;
  durationSec: number | null;
  /** The rate the slow phase asks for (the listening player's SLOW_RATE). */
  slowRate: number;
};

export type ProbeAction =
  | { type: "start"; nowMs: number; slowRate: number }
  | { type: "status"; status: ProbeStatus; nowMs: number }
  | { type: "timeout"; phase: ProbePhaseName };

const emptyPhase = (): PhaseLog => ({ loaded: false, playing: false, finished: false, rateSeen: null, maxPosition: 0, startedAtMs: null, finishedAtMs: null });

export const initialProbe: ProbeState = { phase: "idle", normal: emptyPhase(), slow: emptyPhase(), error: null, timedOut: null, durationSec: null, slowRate: 1 };

/** A reported rate within this of the requested one counts as applied. */
export const RATE_TOLERANCE = 0.02;

/** A phase that has not finished after this long fails (the fixture is ~2.6 s; slow ~3 s). */
export const PROBE_PHASE_TIMEOUT_MS = 30000;

function observe(log: PhaseLog, s: ProbeStatus, nowMs: number): PhaseLog {
  const playing = log.playing || s.playing;
  return {
    loaded: log.loaded || s.isLoaded,
    playing,
    // A finish only counts once this phase has been seen playing (a stale
    // didJustFinish of the previous phase must not end the next one).
    finished: log.finished || (playing && s.didJustFinish),
    rateSeen: s.playing && typeof s.playbackRate === "number" ? s.playbackRate : log.rateSeen,
    maxPosition: Math.max(log.maxPosition, Number.isFinite(s.currentTime) ? (s.currentTime as number) : 0),
    startedAtMs: log.startedAtMs ?? (s.playing ? nowMs : null),
    finishedAtMs: log.finishedAtMs ?? (playing && s.didJustFinish ? nowMs : null),
  };
}

export function probeReducer(state: ProbeState, action: ProbeAction): ProbeState {
  switch (action.type) {
    case "start":
      return state.phase === "idle" ? { ...initialProbe, phase: "normal", normal: emptyPhase(), slow: emptyPhase(), slowRate: action.slowRate } : state;
    case "timeout":
      return state.phase === action.phase ? { ...state, phase: "done", timedOut: action.phase } : state;
    case "status": {
      const s = action.status;
      const durationSec = Number.isFinite(s.duration) && (s.duration as number) > 0 ? (s.duration as number) : state.durationSec;
      if (state.phase === "idle" || state.phase === "done") return durationSec === state.durationSec ? state : { ...state, durationSec };
      if (s.error) return { ...state, phase: "done", error: s.error, durationSec };
      const phase = state.phase;
      const log = observe(state[phase], s, action.nowMs);
      const next = { ...state, [phase]: log, durationSec };
      if (!log.finished) return next;
      return { ...next, phase: phase === "normal" ? "slow" : "done" };
    }
  }
}

export type ProbeVerdict = "pending" | "pass" | "fail";

const phaseOk = (p: PhaseLog) => p.loaded && p.playing && p.finished;
/** A rate the player reports must be the one asked for; a player that reports none is judged by its events. */
const rateOk = (p: PhaseLog, expected: number) => p.rateSeen === null || Math.abs(p.rateSeen - expected) <= RATE_TOLERANCE;

export function probeVerdict(state: ProbeState): ProbeVerdict {
  if (state.phase !== "done") return "pending";
  const ok =
    state.error === null &&
    state.timedOut === null &&
    phaseOk(state.normal) &&
    phaseOk(state.slow) &&
    rateOk(state.normal, 1) &&
    rateOk(state.slow, state.slowRate);
  return ok ? "pass" : "fail";
}

/** One line for the screen and the logs (the acceptance report quotes it). */
export function probeSummary(state: ProbeState): string {
  const p = (name: ProbePhaseName) => {
    const l = state[name];
    const wall = l.startedAtMs !== null && l.finishedAtMs !== null ? `${l.finishedAtMs - l.startedAtMs}ms` : "-";
    return `${name}: loaded=${l.loaded} playing=${l.playing} finished=${l.finished} rate=${l.rateSeen ?? "-"} wall=${wall}`;
  };
  return [`verdict=${probeVerdict(state)}`, p("normal"), p("slow"), `error=${state.error ?? "none"}`, `timeout=${state.timedOut ?? "none"}`, `duration=${state.durationSec ?? "-"}s`].join(" | ");
}

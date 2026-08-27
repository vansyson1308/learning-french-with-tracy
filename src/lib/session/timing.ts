/**
 * Active-time latency clock (Phase 3, §19). Wall-clock latency poisons
 * evidence: backgrounding the app for ten minutes must not record a
 * ten-minute answer. This clock accumulates only foreground-active time.
 *
 * Pure data + transition functions; the controller feeds it AppState
 * changes and step boundaries. Latency remains descriptive data in the
 * review log — it still never auto-derives an Easy grade.
 */

export type LatencyClock = {
  /** Foreground-active milliseconds accumulated while paused/stopped. */
  accumulatedMs: number;
  /** Wall timestamp when the current active run started; null = paused. */
  runningSince: number | null;
};

export function startClock(now: number): LatencyClock {
  return { accumulatedMs: 0, runningSince: now };
}

/** App left the foreground (background/inactive): bank active time, pause. */
export function pauseClock(clock: LatencyClock, now: number): LatencyClock {
  if (clock.runningSince === null) return clock;
  return {
    accumulatedMs: clock.accumulatedMs + Math.max(0, now - clock.runningSince),
    runningSince: null,
  };
}

/** App became active again: resume without counting the away time. */
export function resumeClock(clock: LatencyClock, now: number): LatencyClock {
  if (clock.runningSince !== null) return clock;
  return { ...clock, runningSince: now };
}

/** Active time so far; safe to read while running or paused. */
export function readClockMs(clock: LatencyClock, now: number): number {
  const running = clock.runningSince === null ? 0 : Math.max(0, now - clock.runningSince);
  return clock.accumulatedMs + running;
}

/** True while the app is foreground-active per React Native AppState. */
export function isActiveAppState(state: string): boolean {
  return state === "active";
}

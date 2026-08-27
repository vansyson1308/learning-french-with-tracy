import { describe, expect, test } from "bun:test";

import {
  isActiveAppState,
  pauseClock,
  readClockMs,
  resumeClock,
  startClock,
} from "../session/timing";

const T0 = 1_700_000_000_000;

describe("active-time latency clock", () => {
  test("counts foreground time while running", () => {
    const c = startClock(T0);
    expect(readClockMs(c, T0 + 1000)).toBe(1000);
    expect(readClockMs(c, T0 + 2500)).toBe(2500);
  });

  test("background time is excluded", () => {
    let c = startClock(T0);
    c = pauseClock(c, T0 + 1000); // user backgrounds after 1s
    expect(readClockMs(c, T0 + 10 * 60_000)).toBe(1000); // 10 min away: still 1s
    c = resumeClock(c, T0 + 10 * 60_000);
    expect(readClockMs(c, T0 + 10 * 60_000 + 1500)).toBe(2500);
  });

  test("multiple pause/resume cycles accumulate correctly", () => {
    let c = startClock(T0);
    c = pauseClock(c, T0 + 500);
    c = resumeClock(c, T0 + 5000);
    c = pauseClock(c, T0 + 5300);
    c = resumeClock(c, T0 + 60_000);
    expect(readClockMs(c, T0 + 60_200)).toBe(500 + 300 + 200);
  });

  test("double pause and double resume are idempotent", () => {
    let c = startClock(T0);
    c = pauseClock(c, T0 + 100);
    const doublePaused = pauseClock(c, T0 + 900);
    expect(doublePaused).toEqual(c);
    c = resumeClock(c, T0 + 1000);
    expect(resumeClock(c, T0 + 2000)).toEqual(c);
  });

  test("reading never mutates (re-render safe)", () => {
    const c = startClock(T0);
    const snapshot = { ...c };
    readClockMs(c, T0 + 1000);
    readClockMs(c, T0 + 9999);
    expect(c).toEqual(snapshot);
  });

  test("clock skew clamps to zero instead of going negative", () => {
    const c = startClock(T0);
    expect(readClockMs(c, T0 - 5000)).toBe(0);
    expect(pauseClock(c, T0 - 5000).accumulatedMs).toBe(0);
  });

  test("only 'active' counts as foreground", () => {
    expect(isActiveAppState("active")).toBe(true);
    expect(isActiveAppState("background")).toBe(false);
    expect(isActiveAppState("inactive")).toBe(false);
    expect(isActiveAppState("unknown")).toBe(false);
  });
});

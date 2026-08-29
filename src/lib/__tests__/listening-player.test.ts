/**
 * Listening-player policy machine (P7 §142-143): deliberate-play budgets,
 * replay caps, technical interruptions that never consume the budget or
 * count as learner failure, background pause, and structural slow-mode
 * gating for scored sessions.
 */
import { describe, expect, test } from "bun:test";

import {
  canPlay,
  initialPlayerState,
  playerReducer,
  playsLeft,
  SLOW_RATE,
  type ListeningPlayerState,
} from "../reception/listening-player";

const scored = () => initialPlayerState({ maxPlays: 2, allowSlow: false });
const learning = () => initialPlayerState({ maxPlays: null, allowSlow: true });

function seq(state: ListeningPlayerState, ...events: Parameters<typeof playerReducer>[1][]) {
  return events.reduce(playerReducer, state);
}

describe("deliberate-play budget (§67, §142)", () => {
  test("a full play then a replay consume the two scored plays; a third is refused", () => {
    let s = seq(scored(), { type: "playPressed" }, { type: "finished" });
    expect(s.completedPlays).toBe(1);
    expect(playsLeft(s)).toBe(1);
    s = seq(s, { type: "playPressed" }, { type: "finished" });
    expect(playsLeft(s)).toBe(0);
    expect(canPlay(s)).toBe(false);
    const refused = playerReducer(s, { type: "playPressed" });
    expect(refused).toEqual(s);
  });

  test("learning mode is uncapped", () => {
    let s = learning();
    for (let i = 0; i < 7; i++) s = seq(s, { type: "playPressed" }, { type: "finished" });
    expect(playsLeft(s)).toBeNull();
    expect(canPlay(s)).toBe(true);
  });

  test("play while playing is a no-op (no budget drain)", () => {
    const s = seq(scored(), { type: "playPressed" });
    expect(playerReducer(s, { type: "playPressed" })).toEqual(s);
    expect(s.deliberatePlays).toBe(1);
  });
});

describe("technical interruption is never learner failure (§21, §143)", () => {
  test("a headphone disconnect grants a free resume — budget unchanged", () => {
    let s = seq(scored(), { type: "playPressed" }, { type: "externalPause" });
    expect(s.playing).toBe(false);
    expect(s.resumeCredit).toBe(true);
    expect(s.deliberatePlays).toBe(1);
    s = playerReducer(s, { type: "playPressed" }); // free resume
    expect(s.deliberatePlays).toBe(1);
    expect(s.playing).toBe(true);
  });

  test("backgrounding pauses and grants the same credit (§20)", () => {
    let s = seq(scored(), { type: "playPressed" }, { type: "appBackground" });
    expect(s.playing).toBe(false);
    expect(s.resumeCredit).toBe(true);
    s = playerReducer(s, { type: "playPressed" });
    expect(s.deliberatePlays).toBe(1);
  });

  test("repeated interruptions can never drain the whole budget (§21)", () => {
    let s = scored();
    s = playerReducer(s, { type: "playPressed" });
    for (let i = 0; i < 5; i++) {
      s = seq(s, { type: "externalPause" }, { type: "playPressed" });
    }
    expect(s.deliberatePlays).toBe(1);
    expect(playsLeft(s)).toBe(1);
  });

  test("the learner's own pause resumes without a new play", () => {
    let s = seq(scored(), { type: "playPressed" }, { type: "pausePressed" });
    expect(s.resumeCredit).toBe(true);
    s = playerReducer(s, { type: "playPressed" });
    expect(s.deliberatePlays).toBe(1);
  });

  test("even with plays exhausted, an interrupted play can resume", () => {
    let s = seq(
      scored(),
      { type: "playPressed" },
      { type: "finished" },
      { type: "playPressed" },
      { type: "externalPause" }
    );
    expect(playsLeft(s)).toBe(0);
    expect(canPlay(s)).toBe(true); // the credit, not the budget
    s = playerReducer(s, { type: "playPressed" });
    expect(s.playing).toBe(true);
    expect(s.deliberatePlays).toBe(2);
  });
});

describe("slow mode is structurally scored-proof (§23, §143)", () => {
  test("scored config refuses the rate toggle entirely", () => {
    const s = playerReducer(scored(), { type: "toggleRate" });
    expect(s.rate).toBe(1);
  });

  test("learning config toggles 1 ↔ 0.85 with pitch-corrected slow rate", () => {
    let s = playerReducer(learning(), { type: "toggleRate" });
    expect(s.rate).toBe(SLOW_RATE);
    s = playerReducer(s, { type: "toggleRate" });
    expect(s.rate).toBe(1);
  });

  test("finishing resets the credit and records completion", () => {
    const s = seq(learning(), { type: "playPressed" }, { type: "pausePressed" }, { type: "playPressed" }, { type: "finished" });
    expect(s.everFinished).toBe(true);
    expect(s.completedPlays).toBe(1);
    expect(s.resumeCredit).toBe(false);
  });
});

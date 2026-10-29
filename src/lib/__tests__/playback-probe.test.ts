/**
 * The acceptance-only Opus playback probe: both passes (rate 1, then the
 * listening player's slow rate) must load, play and finish with no decoder
 * error; an error or a pass that never finishes fails.
 */
import { describe, expect, test } from "bun:test";

import { initialProbe, probeReducer, probeSummary, probeVerdict, type ProbeAction, type ProbeState, type ProbeStatus } from "../diagnostics/playback-probe";
import { SLOW_RATE } from "../reception/listening-player";

const st = (over: Partial<ProbeStatus>): ProbeStatus => ({ isLoaded: true, playing: false, didJustFinish: false, error: null, playbackRate: 1, currentTime: 0, duration: 2.55, ...over });
const run = (actions: ProbeAction[], from: ProbeState = initialProbe) => actions.reduce(probeReducer, from);
let clock = 0;
const status = (over: Partial<ProbeStatus>): ProbeAction => ({ type: "status", status: st(over), nowMs: (clock += 100) });
const start: ProbeAction = { type: "start", nowMs: 0, slowRate: SLOW_RATE };

const normalPass = [status({}), status({ playing: true, currentTime: 0.5 }), status({ playing: false, didJustFinish: true, currentTime: 2.55 })];
const slowPass = [status({ playing: false, didJustFinish: true }), status({ playing: true, playbackRate: SLOW_RATE, currentTime: 0.4 }), status({ playing: false, didJustFinish: true, playbackRate: SLOW_RATE })];

describe("Opus playback probe", () => {
  test("statuses before start are ignored; the verdict is pending until both passes end", () => {
    const s = run([status({ playing: true }), status({ didJustFinish: true })]);
    expect(s.phase).toBe("idle");
    expect(probeVerdict(s)).toBe("pending");
    expect(probeVerdict(run([start, ...normalPass]))).toBe("pending");
  });

  test("loaded, playing, finished at rate 1, then again at the slow rate: pass", () => {
    const s = run([start, ...normalPass, ...slowPass]);
    expect(s.phase).toBe("done");
    expect(s.normal).toMatchObject({ loaded: true, playing: true, finished: true, rateSeen: 1 });
    expect(s.slow).toMatchObject({ loaded: true, playing: true, finished: true, rateSeen: SLOW_RATE });
    expect(probeVerdict(s)).toBe("pass");
    expect(probeSummary(s)).toContain("verdict=pass");
    expect(s.durationSec).toBeCloseTo(2.55, 5);
  });

  test("the finish of the first pass does not end the slow pass (it must play first)", () => {
    const s = run([start, ...normalPass, status({ playing: false, didJustFinish: true })]);
    expect(s.phase).toBe("slow");
    expect(s.slow.finished).toBe(false);
  });

  test("a finish without any playing event is not a finish", () => {
    const s = run([start, status({ didJustFinish: true })]);
    expect(s.phase).toBe("normal");
    expect(s.normal.finished).toBe(false);
  });

  test("a decoder error fails at once, in either pass", () => {
    const e1 = run([start, status({ error: "MediaCodecAudioRenderer error: opus" })]);
    expect(e1.phase).toBe("done");
    expect(probeVerdict(e1)).toBe("fail");
    expect(probeSummary(e1)).toContain("error=MediaCodecAudioRenderer error: opus");
    const e2 = run([start, ...normalPass, status({ error: "decode" })]);
    expect(probeVerdict(e2)).toBe("fail");
  });

  test("a pass that never finishes times out and fails; a stale timeout is ignored", () => {
    const stuck = run([start, status({ playing: true }), { type: "timeout", phase: "normal" }]);
    expect(stuck).toMatchObject({ phase: "done", timedOut: "normal" });
    expect(probeVerdict(stuck)).toBe("fail");
    const fine = run([start, ...normalPass, { type: "timeout", phase: "normal" }]);
    expect(fine.phase).toBe("slow");
  });

  test("slow mode must play at the slow rate when the player reports a rate", () => {
    const wrongRate = run([start, ...normalPass, status({ playing: false, didJustFinish: true }), status({ playing: true, playbackRate: 1 }), status({ didJustFinish: true })]);
    expect(probeVerdict(wrongRate)).toBe("fail");
    const noRate = run([start, ...normalPass, status({ playbackRate: undefined }), status({ playing: true, playbackRate: undefined }), status({ didJustFinish: true, playbackRate: undefined })]);
    expect(noRate.slow.rateSeen).toBeNull();
    expect(probeVerdict(noRate)).toBe("pass");
  });

  test("start is idempotent once running", () => {
    const s = run([start, status({ playing: true }), start]);
    expect(s.normal.playing).toBe(true);
  });
});

/**
 * Coordinator decision 2026-10-29: a clip is clipping only with >= 3
 * CONSECUTIVE decoded samples at |x| >= 0.999. Isolated hot samples (MP3
 * decoder overshoot) are reported, never failed.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { spawnSync } from "child_process";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import os from "os";
import path from "path";

import { CLIPPING, clippingIssue, f32leSamples, ffClipping, scanClipping } from "../lib/audio-clipping";
import { QA_THRESHOLDS } from "../lib/piper-audio";

const ROOT = path.resolve(import.meta.dir, "../..");
const hasFfmpeg = spawnSync("ffmpeg", ["-version"]).status === 0 && spawnSync("ffprobe", ["-version"]).status === 0;
const tmp = mkdtempSync(path.join(os.tmpdir(), "audio-clipping-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe("scanClipping (pure)", () => {
  test("the rule is 3 consecutive samples at |x| >= 0.999", () => {
    expect(CLIPPING).toEqual({ sampleAbs: 0.999, minRun: 3 });
    expect(QA_THRESHOLDS.clippingMinRun).toBe(3);
    expect(QA_THRESHOLDS.clippingSampleAbs).toBe(0.999);
  });

  test("isolated hot samples and runs of two are not clipping", () => {
    const s = scanClipping([0.1, 1.097, 0.2, -0.9995, 0.3, 0.9991, -0.9992, 0.1], 22050);
    expect(s).toEqual({ sampleRate: 22050, samples: 8, peakAbs: 1.097, hotSamples: 4, runs: 0, longestRun: 2, clippedSamples: 0, clippedShare: 0 });
    expect(clippingIssue(s)).toBeNull();
  });

  test("a run of 3 counts, with either sign, and a run at the very end is closed", () => {
    const s = scanClipping([0, 1, -1, 1, 0, 0.5, 0.999, 0.9999, 1, 1], 16000);
    expect(s.runs).toBe(2);
    expect(s.longestRun).toBe(4);
    expect(s.clippedSamples).toBe(7);
    expect(s.hotSamples).toBe(7);
    expect(s.clippedShare).toBeCloseTo(0.7, 10);
    expect(clippingIssue(s)).toBe("clipping: 2 run(s) of >=3 samples at |x|>=0.999 (longest 4, 7 of 10 samples, 70.0000%)");
  });

  test("just under the sample threshold is never hot; empty input is clean", () => {
    expect(scanClipping([0.9989, 0.9989, 0.9989, 0.9989], 8000).hotSamples).toBe(0);
    expect(scanClipping([], 8000)).toEqual({ sampleRate: 8000, samples: 0, peakAbs: 0, hotSamples: 0, runs: 0, longestRun: 0, clippedSamples: 0, clippedShare: 0 });
    expect(clippingIssue(null)).toBeNull();
  });

  test("f32le bytes decode little-endian and drop a partial trailing sample", () => {
    const b = Buffer.alloc(9);
    b.writeFloatLE(0.5, 0);
    b.writeFloatLE(-1, 4);
    expect([...f32leSamples(b)]).toEqual([0.5, -1]);
  });
});

/** 16-bit PCM mono WAV (32767 / 32768 = 0.99997 is a hot sample). */
function wav16(samples: number[], rate: number): Buffer {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((x, i) => data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x * 32767))), i * 2));
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

describe("ffClipping decodes the file at its own rate (needs ffmpeg)", () => {
  test.skipIf(!hasFfmpeg)("a flat top of 5 samples is one clipped run; the rate is the file's", () => {
    const tone = Array.from({ length: 1600 }, (_, i) => 0.5 * Math.sin((2 * Math.PI * 440 * i) / 16000));
    for (let i = 800; i < 805; i += 1) tone[i] = 1;
    tone[100] = -1; // isolated
    const p = path.join(tmp, "flat-top.wav");
    writeFileSync(p, wav16(tone, 16000));
    const s = ffClipping(p);
    expect(s.sampleRate).toBe(16000);
    expect(s.samples).toBe(1600);
    expect(s.runs).toBe(1);
    expect(s.longestRun).toBe(5);
    expect(s.clippedSamples).toBe(5);
    expect(s.hotSamples).toBe(6);
  });

  // The 4 frozen French clips the old peak test (> -0.2 dB) failed. Re-measured
  // 2026-10-29: no clipped run in any of them, so no waiver and no re-generation.
  test.skipIf(!hasFfmpeg)("the 4 frozen French clips have no clipped run", () => {
    const expected: Record<string, { peakAbsMin: number; hotSamples: number; longestRun: number }> = {
      "assets/audio/fr/6151b3ba3c15a20f5d91.mp3": { peakAbsMin: 0.99, hotSamples: 0, longestRun: 0 },
      "assets/audio/fr/a2354e82adc4bebb03f9.mp3": { peakAbsMin: 0.98, hotSamples: 0, longestRun: 0 },
      "assets/audio/fr-reception/0dc39b0688bd4633d05d.mp3": { peakAbsMin: 1.09, hotSamples: 1, longestRun: 1 },
      "assets/audio/fr-reception/2da1374014c3c417aa7d.mp3": { peakAbsMin: 1.0, hotSamples: 1, longestRun: 1 },
    };
    // Measured with ffmpeg 7.1 (mp3float). The exact hot-sample count may move by one
    // between decoder builds; the verdict (no run of 3) must not.
    for (const [file, e] of Object.entries(expected)) {
      const s = ffClipping(path.join(ROOT, file));
      expect({ file, runs: s.runs, rate: s.sampleRate }).toEqual({ file, runs: 0, rate: 22050 });
      expect(s.longestRun).toBeLessThan(CLIPPING.minRun);
      expect(Math.abs(s.hotSamples - e.hotSamples)).toBeLessThanOrEqual(1);
      expect(Math.abs(s.longestRun - e.longestRun)).toBeLessThanOrEqual(1);
      expect(s.peakAbs).toBeGreaterThanOrEqual(e.peakAbsMin);
    }
  });
});

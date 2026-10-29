/**
 * Sample-level clipping detection (coordinator decision 2026-10-29 on the
 * French clipping check).
 *
 * A peak at -0.1..0 dBFS is not clipping by itself: an MP3 decoder overshoots
 * a near-full-scale waveform by a sample here and there. A clip counts as
 * clipping only when the decoded PCM holds at least CLIPPING.minRun
 * CONSECUTIVE samples with |x| >= CLIPPING.sampleAbs, the flat top that real
 * clipping leaves. Isolated hot samples are counted and reported, never
 * failed.
 *
 * The decode is ffmpeg -> f32le mono at the file's own sample rate, so the
 * scan sees what a player hands to the output (no resampling, no dither).
 *
 * Re-measured 2026-10-29 on the 4 frozen French clips the peak check failed
 * (fr-en:aujourd'hui, fr-en:Le chat est petit., fr.clip.ui_cafe_commande,
 * fr.story.les_animaux_de_monsieur_martin#4): 0 clipped runs each, at most
 * one isolated hot sample. No waiver was needed.
 */

import { spawnSync } from "child_process";

/** The clipping rule for every clip. */
export const CLIPPING = {
  /** |x| at or above this (linear, 1.0 = full scale) is a hot sample. */
  sampleAbs: 0.999,
  /** This many consecutive hot samples make a clipped run. */
  minRun: 3,
} as const;

export type ClippingStats = {
  sampleRate: number;
  samples: number;
  /** Largest |x| of the decoded PCM. */
  peakAbs: number;
  /** Samples with |x| >= sampleAbs, isolated ones included. */
  hotSamples: number;
  /** Runs of at least minRun consecutive hot samples. */
  runs: number;
  /** Longest run of consecutive hot samples (any length; 0 when none). */
  longestRun: number;
  /** Hot samples inside the counted runs. */
  clippedSamples: number;
  /** clippedSamples / samples. */
  clippedShare: number;
};

/** Scans decoded samples for clipped runs (pure; tested). */
export function scanClipping(samples: ArrayLike<number>, sampleRate: number, rule: { sampleAbs: number; minRun: number } = CLIPPING): ClippingStats {
  let peakAbs = 0;
  let hotSamples = 0;
  let runs = 0;
  let longestRun = 0;
  let clippedSamples = 0;
  let current = 0;
  const close = () => {
    if (current >= rule.minRun) {
      runs += 1;
      clippedSamples += current;
    }
    longestRun = Math.max(longestRun, current);
    current = 0;
  };
  for (let i = 0; i < samples.length; i += 1) {
    const a = Math.abs(samples[i]);
    if (a > peakAbs) peakAbs = a;
    if (a >= rule.sampleAbs) {
      hotSamples += 1;
      current += 1;
    } else if (current > 0) close();
  }
  close();
  const n = samples.length;
  return { sampleRate, samples: n, peakAbs, hotSamples, runs, longestRun, clippedSamples, clippedShare: n === 0 ? 0 : clippedSamples / n };
}

/** f32le bytes to samples (pure; tested). A trailing partial sample is dropped. */
export function f32leSamples(buf: Buffer): Float32Array {
  const samples = new Float32Array(Math.floor(buf.length / 4));
  for (let i = 0; i < samples.length; i += 1) samples[i] = buf.readFloatLE(i * 4);
  return samples;
}

/** The file's own sample rate (first audio stream). */
export function ffSampleRate(p: string): number {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "a:0", "-show_entries", "stream=sample_rate", "-of", "csv=p=0", p], { encoding: "utf8" });
  const rate = Number((r.stdout ?? "").trim());
  if (r.status !== 0 || !Number.isFinite(rate) || rate <= 0) throw new Error(`ffprobe sample rate failed on ${p}: ${(r.stderr ?? "").slice(-300)}`);
  return rate;
}

/** Decodes a file to mono 32-bit float PCM at its own sample rate. */
export function decodeMonoF32(p: string): { samples: Float32Array; sampleRate: number } {
  const sampleRate = ffSampleRate(p);
  const r = spawnSync("ffmpeg", ["-v", "error", "-nostdin", "-i", p, "-ac", "1", "-c:a", "pcm_f32le", "-f", "f32le", "-"], { maxBuffer: 1024 * 1024 * 1024 });
  if (r.status !== 0 || !Buffer.isBuffer(r.stdout)) throw new Error(`ffmpeg decode failed on ${p}: ${String(r.stderr ?? "").slice(-300)}`);
  return { samples: f32leSamples(r.stdout), sampleRate };
}

export function ffClipping(p: string): ClippingStats {
  const { samples, sampleRate } = decodeMonoF32(p);
  return scanClipping(samples, sampleRate);
}

/** The technical issue of a clipped clip, or null. */
export function clippingIssue(c: ClippingStats | null): string | null {
  if (c === null || c.runs === 0) return null;
  return `clipping: ${c.runs} run(s) of >=${CLIPPING.minRun} samples at |x|>=${CLIPPING.sampleAbs} (longest ${c.longestRun}, ${c.clippedSamples} of ${c.samples} samples, ${(c.clippedShare * 100).toFixed(4)}%)`;
}

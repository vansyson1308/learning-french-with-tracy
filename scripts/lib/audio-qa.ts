/**
 * Audio QA helpers shared by `scripts/audio.ts tech-qa` and `qa`
 * (QC 2026-10-29b §3.1, §3.4).
 *
 *  - Fail fast: every cheap technical check (duration floor and speaking
 *    rate, speech-only floor, clipping (>= 3 consecutive decoded samples at
 *    |x| >= 0.999, scripts/lib/audio-clipping.ts), near-silence, edge silence, file
 *    size) runs on every unique asset right after synthesis, BEFORE the ASR
 *    audit. A bad clip ends the run in minutes instead of after 1–2.5 h of ASR.
 *    The final strict QA runs the same checks again; nothing is relaxed.
 *  - Owner listening list: a clip flagged by the ASR review after a declared
 *    re-synthesis goes to plan/OWNER-FINAL-CHECKLIST.md for a listen.
 */

import { existsSync } from "fs";
import path from "path";

import { assetFileName, type AudioCodec } from "./audio-codec";
import { loadBaselineGroups } from "./audio";
import { sha256File, technicalQa, type QaOptions, type TechnicalQa } from "./piper-audio";

export type QaPlanClip = { clipId: string; assetKey: string; text: string; language: string; codec?: AudioCodec };

export type TechQaRow = { clipId: string; assetKey: string; transcript: string; newlyRendered: boolean } & TechnicalQa;

/**
 * Is this file blessed? Its bytes hash to a file of a committed audio
 * baseline (content/audio/baseline/*.json). A clip the run copied from the
 * committed assets is blessed; anything the run rendered is new, so the
 * newly-rendered peak gate (QA_THRESHOLDS.newClipMaxPeakDb) applies to it.
 * Content, not names: a re-render under a blessed key is new.
 */
export function blessedBySha(blessedSha256: ReadonlySet<string>): (file: string) => boolean {
  return (file) => blessedSha256.has(sha256File(file).sha256);
}

/** The sha256 of every committed baseline file. */
export function committedBlessedSha256(): Set<string> {
  return new Set(Object.values(loadBaselineGroups().files));
}

type QaFn = (file: string, transcript: string, language: string, band: [number, number], opts: QaOptions) => TechnicalQa;

/** Technical QA of every unique asset of a plan (the first clip naming an asset stands for it). */
export function techQaDoc(input: {
  clips: QaPlanClip[];
  outdir: string;
  band: [number, number];
  qa?: QaFn;
  /** Default: the committed audio baselines. */
  isBlessed?: (file: string) => boolean;
}): { rows: TechQaRow[]; failures: TechQaRow[]; uniqueAssets: number } {
  const qa = input.qa ?? technicalQa;
  const isBlessed = input.isBlessed ?? blessedBySha(committedBlessedSha256());
  const seen = new Set<string>();
  const rows: TechQaRow[] = [];
  for (const clip of input.clips) {
    if (seen.has(clip.assetKey)) continue;
    seen.add(clip.assetKey);
    const file = path.join(input.outdir, assetFileName(clip.assetKey, clip.codec));
    const exists = existsSync(file);
    const newlyRendered = !(exists && isBlessed(file));
    const t: TechnicalQa = exists
      ? qa(file, clip.text, clip.language, input.band, { newlyRendered })
      : { durationSec: 0, speechSec: 0, bytes: 0, maxVolumeDb: null, meanVolumeDb: null, clipping: null, leadingSilenceSec: null, trailingSilenceSec: null, charsPerSec: 0, technical: "fail", technicalIssues: ["missing file"] };
    rows.push({ clipId: clip.clipId, assetKey: clip.assetKey, transcript: clip.text, newlyRendered, ...t });
  }
  rows.sort((a, b) => a.clipId.localeCompare(b.clipId));
  return { rows, failures: rows.filter((r) => r.technical === "fail"), uniqueAssets: seen.size };
}

export type ReviewRow = { clipId: string; voiceId: string; transcript: string; heard: string; wer: number; durationSec: number };

/**
 * Splits the ASR review list by the declared re-synthesis: a clip already
 * re-rendered and still flagged goes to the owner's listening check; any
 * other flagged clip is a candidate for the next re-synthesis.
 */
export function splitReview(review: ReviewRow[], resynthesized: readonly string[]): { ownerListening: ReviewRow[]; resynthesisCandidates: ReviewRow[] } {
  const done = new Set(resynthesized);
  return { ownerListening: review.filter((r) => done.has(r.clipId)), resynthesisCandidates: review.filter((r) => !done.has(r.clipId)) };
}

/** Checklist lines for plan/OWNER-FINAL-CHECKLIST.md (Vietnamese, the owner judges the sound, not the German). */
export function ownerListeningLines(lang: string, rows: (ReviewRow & { assetPath?: string })[]): string[] {
  return rows.map((r) => `- [ ] ${lang}: nghe xem có bị méo/rè không — \`${r.clipId}\` «${r.transcript}»${r.assetPath ? ` (\`${r.assetPath}\`)` : ""}`);
}

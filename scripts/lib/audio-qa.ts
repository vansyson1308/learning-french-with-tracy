/**
 * Audio QA helpers shared by `scripts/audio.ts tech-qa` and `qa`
 * (QC 2026-10-29b §3.1, §3.4).
 *
 *  - Fail fast: every cheap technical check (duration floor and speaking
 *    rate, speech-only floor, clipping, near-silence, edge silence, file
 *    size) runs on every unique asset right after synthesis, BEFORE the ASR
 *    audit. A bad clip ends the run in minutes instead of after 1–2.5 h of ASR.
 *    The final strict QA runs the same checks again; nothing is relaxed.
 *  - Owner listening list: a clip flagged by the ASR review after a declared
 *    re-synthesis goes to plan/OWNER-FINAL-CHECKLIST.md for a listen.
 */

import { existsSync } from "fs";
import path from "path";

import { technicalQa, type TechnicalQa } from "./piper-audio";

export type QaPlanClip = { clipId: string; assetKey: string; text: string; language: string };

export type TechQaRow = { clipId: string; assetKey: string; transcript: string } & TechnicalQa;

/** Technical QA of every unique asset of a plan (the first clip naming an asset stands for it). */
export function techQaDoc(input: {
  clips: QaPlanClip[];
  outdir: string;
  band: [number, number];
  qa?: (file: string, transcript: string, language: string, band: [number, number]) => TechnicalQa;
}): { rows: TechQaRow[]; failures: TechQaRow[]; uniqueAssets: number } {
  const qa = input.qa ?? technicalQa;
  const seen = new Set<string>();
  const rows: TechQaRow[] = [];
  for (const clip of input.clips) {
    if (seen.has(clip.assetKey)) continue;
    seen.add(clip.assetKey);
    const file = path.join(input.outdir, `${clip.assetKey}.mp3`);
    const t: TechnicalQa = existsSync(file)
      ? qa(file, clip.text, clip.language, input.band)
      : { durationSec: 0, speechSec: 0, bytes: 0, maxVolumeDb: null, meanVolumeDb: null, leadingSilenceSec: null, trailingSilenceSec: null, charsPerSec: 0, technical: "fail", technicalIssues: ["missing file"] };
    rows.push({ clipId: clip.clipId, assetKey: clip.assetKey, transcript: clip.text, ...t });
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

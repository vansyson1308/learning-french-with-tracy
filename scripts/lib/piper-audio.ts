/**
 * Shared Piper audio helpers (V1 publication program, Part II).
 *
 * Extracted so the reception pipeline (scripts/reception-audio.ts, French
 * listening clips) and the pack pipeline (scripts/pack-audio.ts, every
 * bundled course word/sentence) apply the SAME provenance rules:
 *   - voices are pinned by double-download hash;
 *   - a MODEL_CARD must state a dataset/license that the allow list matches
 *     and no deny token touches (fail closed);
 *   - technical QA is ffprobe/ffmpeg based and language-aware.
 * Pure helpers only: no network, no model weights, nothing paid.
 */

import { createHash } from "crypto";
import { execFileSync, spawnSync } from "child_process";
import { readFileSync } from "fs";

import { CLIPPING, clippingIssue, ffClipping, type ClippingStats } from "./audio-clipping";

export type VoiceFile = { path: string; sha256: string | null; bytes: number | null };
export type VoiceFiles = Record<"model" | "config" | "modelCard", VoiceFile>;
export type LicenseGate = { note?: string; allow: string[]; deny: string[] };

export function sha256File(p: string): { sha256: string; bytes: number } {
  const buf = readFileSync(p);
  return { sha256: createHash("sha256").update(buf).digest("hex"), bytes: buf.length };
}

/** Extract "Dataset: X" / license mentions from a Piper MODEL_CARD. */
export function parseModelCard(text: string): { dataset: string | null; license: string | null } {
  const fm = frontMatterLicense(text);
  if (fm !== null) return { dataset: null, license: `license: ${fm}` };
  const dataset =
    text.match(/^\s*\*?\s*Dataset:\s*(.+)$/im)?.[1]?.trim() ??
    text.match(/^\s*Dataset\s*[-—:]\s*(.+)$/im)?.[1]?.trim() ??
    null;
  const licenseLines = text
    .split("\n")
    .filter((l) => /licen[cs]e|creative commons|cc[- ]by|cc0|public domain/i.test(l))
    .map((l) => l.trim());
  return { dataset, license: licenseLines.length > 0 ? licenseLines.join(" | ") : null };
}

export type GateVerdict = { ok: boolean; matched: string | null; reason: string | null };

/**
 * Non-throwing license gate over the license-relevant lines only (a whole
 * card substring check once matched "NC" inside "French"). Deny tokens
 * match on token boundaries; allow entries match spelling-normalized.
 */
/** The `license:` value of a YAML front matter (Hugging Face model cards), when the card starts with one. */
export function frontMatterLicense(cardText: string): string | null {
  const m = /^---\s*\n([\s\S]*?)\n---/.exec(cardText);
  if (!m) return null;
  const line = m[1].split("\n").find((l) => /^license:\s*\S/.test(l.trim()));
  return line ? line.trim().replace(/^license:\s*/, "").replace(/^["']|["']$/g, "") : null;
}

export function licenseGate(gate: LicenseGate, cardText: string): GateVerdict {
  const { dataset, license } = parseModelCard(cardText);
  // A machine-readable front-matter licence is the statement of record: the
  // gate reads it alone (the prose may legitimately say "free for commercial
  // and non-commercial use" — not a restriction).
  const frontMatter = frontMatterLicense(cardText);
  const haystack = frontMatter !== null ? frontMatter : [dataset ?? "", license ?? ""].join("\n");
  if (haystack.trim().length === 0) {
    return { ok: false, matched: null, reason: "MODEL_CARD carries no parseable dataset/license line" };
  }
  for (const bad of gate.deny) {
    const boundary = new RegExp(
      `(^|[^A-Za-z])${bad.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z]|$)`,
      "i"
    );
    if (boundary.test(haystack)) {
      return { ok: false, matched: null, reason: `license/dataset line mentions denied token "${bad}"` };
    }
  }
  const norm = (x: string) => x.toLowerCase().replace(/[-\s]+/g, "");
  const hit = gate.allow.find((ok) => norm(haystack).includes(norm(ok)));
  if (!hit) {
    return { ok: false, matched: null, reason: `license/dataset line matches no allowed license (saw: ${haystack.replace(/\n/g, " | ")})` };
  }
  return { ok: true, matched: hit, reason: null };
}

/** Map a matched allow-list entry to the registry's SPDX-style license id. */
export function registryLicenseFor(matched: string): "CC-BY-4.0" | "CC-BY-SA-4.0" | "CC0-1.0" | "Apache-2.0" | "MIT" | null {
  const n = matched.toLowerCase().replace(/[-\s]+/g, "");
  // Creative Commons URLs (creativecommons.org/licenses/by/4.0, …/by-sa/4.0, …/publicdomain/zero/1.0).
  if (/creativecommons\.org\/licenses\/bysa\//.test(n)) return "CC-BY-SA-4.0";
  if (/creativecommons\.org\/licenses\/by\//.test(n)) return "CC-BY-4.0";
  if (/creativecommons\.org\/publicdomain\/zero\//.test(n)) return "CC0-1.0";
  if (n.includes("bysa")) return "CC-BY-SA-4.0";
  if (n.includes("cc0") || n.includes("publicdomain")) return "CC0-1.0";
  if (n.includes("ccby")) return "CC-BY-4.0";
  if (n.includes("apache")) return "Apache-2.0";
  if (n === "mit") return "MIT";
  return null;
}

// ---------------------------------------------------------------------------
// ffmpeg-based technical QA
// ---------------------------------------------------------------------------

export function ffprobeDuration(p: string): number {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p],
    { encoding: "utf8" }
  ).trim();
  return Number(out);
}

/**
 * ffmpeg's filter reports (volumedetect, silencedetect) go to STDERR.
 * QC 2026-10-29b §3.1: the earlier helpers parsed stdout only, so the
 * clipping and edge-silence checks never saw a value (every report row had
 * null levels). The analysis output is read from stderr now.
 */
function ffAnalyze(p: string, filter: string): string {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-nostats", "-i", p, "-af", filter, "-f", "null", "-"], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`ffmpeg ${filter} failed on ${p}: ${(r.stderr ?? "").slice(-400)}`);
  return `${r.stdout ?? ""}\n${r.stderr ?? ""}`;
}

export function ffVolume(p: string): { maxVolumeDb: number | null; meanVolumeDb: number | null } {
  const out = ffAnalyze(p, "volumedetect");
  const max = /max_volume:\s*(-?[\d.]+|-inf)\s*dB/.exec(out);
  const mean = /mean_volume:\s*(-?[\d.]+|-inf)\s*dB/.exec(out);
  const num = (m: RegExpExecArray | null) => (m === null ? null : m[1] === "-inf" ? -Infinity : Number(m[1]));
  return { maxVolumeDb: num(max), meanVolumeDb: num(mean) };
}

/** Edge-silence threshold shared by the QA and the speech-only measurement. */
export const SILENCE_NOISE_DB = -40;
export const SILENCE_MIN_SEC = 0.05;

export type EdgeSilence = {
  lead: number | null;
  trail: number | null;
  /** Speech-only duration: the clip minus its leading and trailing silence. */
  speechSec: number;
};

/**
 * Leading/trailing silence from silencedetect output (pure; tested). A
 * silence that runs to the end of the stream has no `silence_end` on older
 * ffmpeg and one at the stream end on newer builds: both count as trailing.
 */
export function parseEdgeSilence(out: string, duration: number): EdgeSilence {
  const starts = [...out.matchAll(/silence_start:\s*(-?[\d.]+)/g)].map((m) => Math.max(0, Number(m[1])));
  const ends = [...out.matchAll(/silence_end:\s*([\d.]+)/g)].map((m) => Number(m[1]));
  const spans = starts.map((start, i) => ({ start, end: Math.min(ends[i] ?? duration, duration) }));
  const first = spans[0];
  const last = spans[spans.length - 1];
  const leadSpan = first !== undefined && first.start <= 0.01 ? first : null;
  const trailSpan = last !== undefined && last.end >= duration - 0.02 ? last : null;
  const lead = leadSpan === null ? null : leadSpan.end;
  const trail = trailSpan === null ? null : Math.max(0, duration - trailSpan.start);
  // One silence spanning the whole clip: no speech at all.
  const speechSec = leadSpan !== null && leadSpan === trailSpan ? 0 : Math.max(0, duration - (lead ?? 0) - (trail ?? 0));
  return { lead, trail, speechSec };
}

/**
 * Decoded length of the analysed stream (astats sample count / sample rate),
 * or null. An MP3's container duration (ffprobe) includes the encoder delay,
 * while silencedetect timestamps run on the decoded samples: edge silence is
 * measured against the decoded length.
 */
export function parseDecodedSec(out: string): number | null {
  const samples = /Number of samples:\s*(\d+)/.exec(out);
  const rate = /Audio:[^\n]*?(\d+) Hz/.exec(out);
  return samples && rate ? Number(samples[1]) / Number(rate[1]) : null;
}

export function ffEdgeSilence(p: string, fallbackDuration?: number): EdgeSilence {
  const out = ffAnalyze(p, `silencedetect=noise=${SILENCE_NOISE_DB}dB:d=${SILENCE_MIN_SEC},astats=metadata=0`);
  return parseEdgeSilence(out, parseDecodedSec(out) ?? fallbackDuration ?? ffprobeDuration(p));
}

/**
 * Plausible speaking rates in transcript characters per second. Latin
 * scripts were tuned on the French reception corpus; Chinese carries far
 * more meaning per character, so its band is lower.
 */
export function charsPerSecBand(language: string): [number, number] {
  if (language === "zh") return [1.2, 12];
  return [3, 30];
}

/** Transcripts this short (letters/digits only) have no meaningful speaking rate. */
export const SHORT_TRANSCRIPT_UNITS = 3;

/** A 1–3 letter/digit transcript ("du", "Sie", "sí", 犬): rendered with edge padding (QC 2026-10-29b §3.3). */
export function isShortTranscript(text: string): boolean {
  return [...text].filter((c) => /[\p{L}\p{N}]/u.test(c)).length <= SHORT_TRANSCRIPT_UNITS;
}
/** Absolute duration band for short transcripts (one word, one or two Han / kana / Hangul characters). */
export const SHORT_DURATION_BAND: [number, number] = [0.25, 3.0];

/**
 * P3e: the speaking-rate check. A single short word (犬, 公园, sí) is mostly
 * the voice's fixed attack and release, so chars/sec is meaningless there
 * (the ja/zh canaries failed every one-character word at a normal ~1 s); such
 * transcripts are checked against an absolute duration band instead.
 */
export function rateIssue(transcript: string, durationSec: number, band: [number, number]): string | null {
  const units = [...transcript].filter((c) => /[\p{L}\p{N}]/u.test(c)).length;
  if (units <= SHORT_TRANSCRIPT_UNITS) {
    const [lo, hi] = SHORT_DURATION_BAND;
    return durationSec >= lo && durationSec <= hi ? null : `duration ${durationSec.toFixed(2)}s implausible for a ${units}-character transcript (expected ${lo}–${hi}s)`;
  }
  const charsPerSec = transcript.length / Math.max(durationSec, 0.001);
  return charsPerSec < band[0] || charsPerSec > band[1] ? `duration implausible for transcript (${charsPerSec.toFixed(1)} chars/sec)` : null;
}

export type TechnicalQa = {
  durationSec: number;
  /** QC 2026-10-29b §3.3: duration without the leading/trailing silence. */
  speechSec: number;
  bytes: number;
  /** Peak level (volumedetect); reported, no longer the clipping test. */
  maxVolumeDb: number | null;
  meanVolumeDb: number | null;
  /** Sample-level clipping scan of the decoded PCM (scripts/lib/audio-clipping.ts); null when not measured. */
  clipping: ClippingStats | null;
  leadingSilenceSec: number | null;
  trailingSilenceSec: number | null;
  charsPerSec: number;
  technical: "pass" | "fail";
  technicalIssues: string[];
};

/**
 * Technical QA thresholds. They only ever get stricter (QC 2026-10-29b §3.1):
 * the duration floor applies to the whole (padded) clip, the speech-only
 * floor to the clip without its edge silence, so padding cannot hide a
 * clipped word.
 */
export const QA_THRESHOLDS = {
  /** Whole clip, padding included. */
  minDurationSec: 0.25,
  /** Speech only (silence-trimmed at -40 dB). */
  minSpeechSec: 0.12,
  minBytes: 800,
  /**
   * Clipping: at least this many CONSECUTIVE decoded samples at |x| >= 0.999
   * (CLIPPING in scripts/lib/audio-clipping.ts). Coordinator decision
   * 2026-10-29: the former "peak above -0.2 dB" test failed MP3 decoder
   * overshoot (isolated samples), not clipping.
   */
  clippingMinRun: CLIPPING.minRun,
  clippingSampleAbs: CLIPPING.sampleAbs,
  /** Peak below this: the clip is near-silent (a broken render), whatever the loudness target. */
  quietMaxDb: -20,
  maxLeadingSilenceSec: 1.0,
  maxTrailingSilenceSec: 1.2,
} as const;

export type ClipMeasurement = {
  durationSec: number;
  bytes: number;
  maxVolumeDb: number | null;
  meanVolumeDb: number | null;
  clipping: ClippingStats | null;
  lead: number | null;
  trail: number | null;
  speechSec: number;
};

/** Every technical issue of one measured clip (pure; tested). */
export function technicalIssues(m: ClipMeasurement, transcript: string, band: [number, number]): string[] {
  const t = QA_THRESHOLDS;
  const issues: string[] = [];
  if (!(m.durationSec > t.minDurationSec)) issues.push(`duration ${m.durationSec.toFixed(2)}s too short`);
  if (!(m.speechSec >= t.minSpeechSec)) issues.push(`speech-only duration ${m.speechSec.toFixed(2)}s under ${t.minSpeechSec}s (silence-trimmed)`);
  if (m.bytes < t.minBytes) issues.push(`file under ${t.minBytes} bytes`);
  const clipped = clippingIssue(m.clipping);
  if (clipped !== null) issues.push(clipped);
  if (m.maxVolumeDb !== null && m.maxVolumeDb < t.quietMaxDb) issues.push(`too quiet (max ${m.maxVolumeDb}dB, under ${t.quietMaxDb}dB)`);
  if (m.lead !== null && m.lead > t.maxLeadingSilenceSec) issues.push(`leading silence ${m.lead.toFixed(2)}s`);
  if (m.trail !== null && m.trail > t.maxTrailingSilenceSec) issues.push(`trailing silence ${m.trail.toFixed(2)}s`);
  const rate = rateIssue(transcript, m.durationSec, band);
  if (rate !== null) issues.push(rate);
  return issues;
}

export function measureClip(filePath: string): ClipMeasurement {
  const { bytes } = sha256File(filePath);
  const durationSec = ffprobeDuration(filePath);
  const { maxVolumeDb, meanVolumeDb } = ffVolume(filePath);
  const clipping = ffClipping(filePath);
  const { lead, trail, speechSec } = ffEdgeSilence(filePath);
  return { durationSec, bytes, maxVolumeDb, meanVolumeDb, clipping, lead, trail, speechSec };
}

export function technicalQa(filePath: string, transcript: string, language: string, band?: [number, number]): TechnicalQa {
  const m = measureClip(filePath);
  // P3b: the band comes from the language plugin (carried in the plan); the legacy table is the fallback.
  const issues = technicalIssues(m, transcript, band ?? charsPerSecBand(language));
  const round = (x: number | null) => (x === null ? null : Number(x.toFixed(3)));
  const level = (x: number | null) => (x === null || Number.isFinite(x) ? x : -999);
  return {
    durationSec: Number(m.durationSec.toFixed(3)),
    speechSec: Number(m.speechSec.toFixed(3)),
    bytes: m.bytes,
    maxVolumeDb: level(m.maxVolumeDb),
    meanVolumeDb: level(m.meanVolumeDb),
    clipping: m.clipping === null ? null : { ...m.clipping, peakAbs: Number(m.clipping.peakAbs.toFixed(5)), clippedShare: Number(m.clipping.clippedShare.toFixed(7)) },
    leadingSilenceSec: round(m.lead),
    trailingSilenceSec: round(m.trail),
    charsPerSec: Number((transcript.length / Math.max(m.durationSec, 0.001)).toFixed(2)),
    technical: issues.length === 0 ? "pass" : "fail",
    technicalIssues: issues,
  };
}

// ---------------------------------------------------------------------------
// synthesis scripts (emitted as bash so the run log shows the exact recipe)
// ---------------------------------------------------------------------------

export type SynthSegment = { voiceId: string; speaker: number | null; text: string };
export type SynthClip = { assetKey: string; segments: SynthSegment[] };

export const shq = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;

export function synthScript(clips: SynthClip[], dl: string, wav: string, out: string): string {
  const lines: string[] = [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    `mkdir -p ${shq(wav)} ${shq(out)}`,
    `ffmpeg -v error -y -f lavfi -i anullsrc=r=22050:cl=mono -t 0.35 ${shq(`${wav}/_gap.wav`)}`,
  ];
  for (const clip of clips) {
    const segWavs: string[] = [];
    clip.segments.forEach((seg, i) => {
      const segWav = `${wav}/${clip.assetKey}.seg${i}.wav`;
      segWavs.push(segWav);
      const speakerArgs = seg.speaker === null ? "" : ` --speaker ${seg.speaker}`;
      lines.push(
        `printf '%s' ${shq(seg.text)} | piper --model ${shq(`${dl}/${seg.voiceId}.model.1`)} --config ${shq(`${dl}/${seg.voiceId}.config.1`)}${speakerArgs} --output_file ${shq(segWav)}`
      );
    });
    const joined = `${wav}/${clip.assetKey}.joined.wav`;
    if (segWavs.length === 1) {
      lines.push(`cp ${shq(segWavs[0])} ${shq(joined)}`);
    } else {
      const listFile = `${wav}/${clip.assetKey}.list`;
      const entries = segWavs.map((p) => `file ${shq(p)}`).join(`\\nfile ${shq(`${wav}/_gap.wav`)}\\n`);
      lines.push(`printf '%b\\n' ${shq(entries)} > ${shq(listFile)}`);
      lines.push(`ffmpeg -v error -y -f concat -safe 0 -i ${shq(listFile)} -ar 22050 -ac 1 ${shq(joined)}`);
    }
    lines.push(
      `ffmpeg -v error -y -i ${shq(joined)} -ar 22050 -ac 1 -codec:a libmp3lame -b:a 64k ${shq(`${out}/${clip.assetKey}.mp3`)}`
    );
  }
  lines.push(`echo "synthesized ${clips.length} clips"`);
  return `${lines.join("\n")}\n`;
}

/**
 * Deterministic, provenance-clean sound effects: pure ffmpeg expressions
 * (no samples, no third-party audio). Names/extensions match the runtime
 * requires in src/lib/audio.ts so no code changes are needed.
 */
export function sfxScript(out: string): string {
  const tone = (freq: number, dur: number, gain: number, decay: number) =>
    `aevalsrc='${gain}*sin(2*PI*${freq}*t)*exp(-${decay}*t)':s=44100:d=${dur}`;
  const lines = [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    `mkdir -p ${shq(out)}`,
    // correct: a bright two-note rise (E6 → B6)
    `ffmpeg -v error -y -f lavfi -i "${tone(1318.51, 0.12, 0.35, 9)}" -f lavfi -i "${tone(1975.53, 0.2, 0.35, 8)}" -filter_complex "[0:a][1:a]concat=n=2:v=0:a=1,afade=t=out:st=0.28:d=0.04" -ar 44100 -ac 1 -c:a pcm_s16le ${shq(`${out}/correct.wav`)}`,
    // incorrect: a soft low double thud (A3, with a short gap)
    `ffmpeg -v error -y -f lavfi -i "${tone(220, 0.14, 0.4, 12)}" -f lavfi -i "anullsrc=r=44100:cl=mono:d=0.05" -f lavfi -i "${tone(196, 0.18, 0.4, 10)}" -filter_complex "[0:a][1:a][2:a]concat=n=3:v=0:a=1" -ar 44100 -ac 1 -c:a pcm_s16le ${shq(`${out}/incorrect.wav`)}`,
    // finish: a four-note ascending arpeggio (C5 E5 G5 C6) with a longer tail
    `ffmpeg -v error -y -f lavfi -i "${tone(523.25, 0.14, 0.32, 6)}" -f lavfi -i "${tone(659.25, 0.14, 0.32, 6)}" -f lavfi -i "${tone(783.99, 0.14, 0.32, 6)}" -f lavfi -i "${tone(1046.5, 0.5, 0.34, 4)}" -filter_complex "[0:a][1:a][2:a][3:a]concat=n=4:v=0:a=1,afade=t=out:st=0.7:d=0.2" -ar 44100 -ac 1 -codec:a libmp3lame -b:a 96k ${shq(`${out}/finish.mp3`)}`,
    `echo "synthesized 3 sfx"`,
  ];
  return `${lines.join("\n")}\n`;
}

/**
 * Content-addressed key for a pack clip: what is spoken, by which voice, how.
 * `recipe` (scripts/lib/audio-recipe.ts) names a render recipe that differs
 * from the default one; it is left out of the hash when absent, so every
 * clip rendered with the default recipe keeps its key and its blessed bytes.
 */
export function packAssetKey(
  courseId: string,
  voiceId: string,
  speaker: number | null,
  text: string,
  pipelineVersion: number,
  recipe: string | null = null
): string {
  const canonical = JSON.stringify(["pack", courseId, voiceId, speaker, text, 1.0, pipelineVersion, ...(recipe === null ? [] : [recipe])]);
  return createHash("sha256").update(canonical).digest("hex").slice(0, 20);
}

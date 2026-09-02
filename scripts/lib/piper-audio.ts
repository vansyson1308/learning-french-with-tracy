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
import { execFileSync } from "child_process";
import { readFileSync } from "fs";

export type VoiceFile = { path: string; sha256: string | null; bytes: number | null };
export type VoiceFiles = Record<"model" | "config" | "modelCard", VoiceFile>;
export type LicenseGate = { note?: string; allow: string[]; deny: string[] };

export function sha256File(p: string): { sha256: string; bytes: number } {
  const buf = readFileSync(p);
  return { sha256: createHash("sha256").update(buf).digest("hex"), bytes: buf.length };
}

/** Extract "Dataset: X" / license mentions from a Piper MODEL_CARD. */
export function parseModelCard(text: string): { dataset: string | null; license: string | null } {
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
export function licenseGate(gate: LicenseGate, cardText: string): GateVerdict {
  const { dataset, license } = parseModelCard(cardText);
  const haystack = [dataset ?? "", license ?? ""].join("\n");
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
export function registryLicenseFor(matched: string): "CC-BY-4.0" | "CC-BY-SA-4.0" | "CC0-1.0" | null {
  const n = matched.toLowerCase().replace(/[-\s]+/g, "");
  if (n.includes("bysa")) return "CC-BY-SA-4.0";
  if (n.includes("cc0") || n.includes("publicdomain")) return "CC0-1.0";
  if (n.includes("ccby")) return "CC-BY-4.0";
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

export function ffVolume(p: string): { maxVolumeDb: number | null } {
  const out = execFileSync("ffmpeg", ["-i", p, "-af", "volumedetect", "-f", "null", "-"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const m = /max_volume:\s*(-?[\d.]+)\s*dB/.exec(out);
  return { maxVolumeDb: m ? Number(m[1]) : null };
}

export function ffEdgeSilence(p: string): { lead: number | null; trail: number | null } {
  const out = execFileSync(
    "ffmpeg",
    ["-i", p, "-af", "silencedetect=noise=-40dB:d=0.05", "-f", "null", "-"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  const starts = [...out.matchAll(/silence_start:\s*([\d.]+)/g)].map((m) => Number(m[1]));
  const ends = [...out.matchAll(/silence_end:\s*([\d.]+)/g)].map((m) => Number(m[1]));
  const duration = ffprobeDuration(p);
  let lead: number | null = null;
  let trail: number | null = null;
  if (starts.length > 0 && starts[0] <= 0.01 && ends.length > 0) lead = ends[0];
  const lastStart = starts[starts.length - 1];
  if (lastStart !== undefined) {
    const lastEnd = ends[ends.length - 1];
    if (lastEnd === undefined || lastEnd < lastStart) trail = duration - lastStart;
  }
  return { lead, trail };
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

export type TechnicalQa = {
  durationSec: number;
  bytes: number;
  maxVolumeDb: number | null;
  leadingSilenceSec: number | null;
  trailingSilenceSec: number | null;
  charsPerSec: number;
  technical: "pass" | "fail";
  technicalIssues: string[];
};

export function technicalQa(filePath: string, transcript: string, language: string): TechnicalQa {
  const issues: string[] = [];
  const { bytes } = sha256File(filePath);
  const duration = ffprobeDuration(filePath);
  const { maxVolumeDb } = ffVolume(filePath);
  const { lead, trail } = ffEdgeSilence(filePath);
  const charsPerSec = transcript.length / Math.max(duration, 0.001);
  const [lo, hi] = charsPerSecBand(language);
  if (!(duration > 0.25)) issues.push(`duration ${duration.toFixed(2)}s too short`);
  if (bytes < 800) issues.push("file under 800 bytes");
  if (maxVolumeDb !== null && maxVolumeDb > -0.2) issues.push(`possible clipping (max ${maxVolumeDb}dB)`);
  if (lead !== null && lead > 1.0) issues.push(`leading silence ${lead.toFixed(2)}s`);
  if (trail !== null && trail > 1.2) issues.push(`trailing silence ${trail.toFixed(2)}s`);
  if (charsPerSec < lo || charsPerSec > hi) {
    issues.push(`duration implausible for transcript (${charsPerSec.toFixed(1)} chars/sec)`);
  }
  return {
    durationSec: Number(duration.toFixed(3)),
    bytes,
    maxVolumeDb,
    leadingSilenceSec: lead === null ? null : Number(lead.toFixed(3)),
    trailingSilenceSec: trail === null ? null : Number(trail.toFixed(3)),
    charsPerSec: Number(charsPerSec.toFixed(2)),
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

/** Content-addressed key for a pack clip: what is spoken, by which voice, how. */
export function packAssetKey(
  courseId: string,
  voiceId: string,
  speaker: number | null,
  text: string,
  pipelineVersion: number
): string {
  const canonical = JSON.stringify(["pack", courseId, voiceId, speaker, text, 1.0, pipelineVersion]);
  return createHash("sha256").update(canonical).digest("hex").slice(0, 20);
}

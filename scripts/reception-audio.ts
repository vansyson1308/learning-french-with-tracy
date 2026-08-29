/**
 * Phase-7 reception-audio pipeline driver (P7 §25-42). Runs INSIDE the
 * dispatch-only GitHub Actions workflow (the interactive environment cannot
 * reach huggingface.co) and locally for pure/report subcommands.
 *
 * Subcommands:
 *   recon   --downloads <dir>   Pin the double-downloaded voice files:
 *                               verify copy1==copy2, hash, parse MODEL_CARD
 *                               dataset/license, apply the license gate
 *                               FAIL-CLOSED, write pins + model cards +
 *                               recon report.
 *   verify  --downloads <dir>   Recompute hashes against the pinned
 *                               manifest; any drift aborts (P7 §34).
 *   plan    --mode canary|generate --out <file>
 *                               Deterministic generation plan: clip list
 *                               with voice/speaker/params and content-hash
 *                               asset keys (P7 §27, §131-132).
 *   qa      --plan <file> --outdir <dir> --report <file> [--asr <file>]
 *                               Technical QA over generated WAV/MP3s
 *                               (duration, sample rate, clipping, silence
 *                               edges, transcript-plausible duration) +
 *                               optional ASR audit merge (P7 §39-42).
 */

import { createHash } from "crypto";
import { execFileSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dir, "..");
const MANIFEST_PATH = path.join(ROOT, "content/fr/reception/audio-source-manifest.json");
const CANARY_PATH = path.join(ROOT, "content/fr/reception/audio-canary.json");
const LISTENING_PATH = path.join(ROOT, "content/fr/reception/listening.json");

type VoiceFiles = Record<string, { path: string; sha256: string | null; bytes: number | null }>;
type Voice = {
  id: string;
  role: string;
  multiSpeaker: boolean;
  pinnedSpeakers?: number[];
  files: VoiceFiles;
  declaredDataset: string | null;
  declaredLicense: string | null;
};
type Manifest = {
  version: number;
  pipelineVersion: number;
  note: string;
  piperTts: { package: string; pinnedVersion: string };
  voicesRepository: string;
  voicesRevision: string;
  licenseGate: { note: string; allow: string[]; deny: string[] };
  voices: Voice[];
  excludedVoices: { id: string; reason: string }[];
};

function sha256File(p: string): { sha256: string; bytes: number } {
  const buf = readFileSync(p);
  return { sha256: createHash("sha256").update(buf).digest("hex"), bytes: buf.length };
}

function loadManifest(): Manifest {
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as Manifest;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function fail(msg: string): never {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// recon / verify
// ---------------------------------------------------------------------------

/** Extract "Dataset: X" / license mentions from a Piper MODEL_CARD. */
function parseModelCard(text: string): { dataset: string | null; license: string | null } {
  const dataset =
    text.match(/^\s*\*?\s*Dataset:\s*(.+)$/im)?.[1]?.trim() ??
    text.match(/^\s*Dataset\s*[-—:]\s*(.+)$/im)?.[1]?.trim() ??
    null;
  // License lines vary; collect every line mentioning licence/license/CC.
  const licenseLines = text
    .split("\n")
    .filter((l) => /licen[cs]e|creative commons|cc[- ]by/i.test(l))
    .map((l) => l.trim());
  return { dataset, license: licenseLines.length > 0 ? licenseLines.join(" | ") : null };
}

function licenseGateCheck(manifest: Manifest, voiceId: string, cardText: string): string {
  const { allow, deny } = manifest.licenseGate;
  const haystack = cardText.toLowerCase();
  for (const bad of deny) {
    // Deny entries are short tokens (AGPL, NC…): match as standalone-ish text.
    if (haystack.includes(bad.toLowerCase())) {
      fail(`${voiceId}: MODEL_CARD mentions denied license token "${bad}" — failing closed (P7 §31/§37)`);
    }
  }
  const hit = allow.find((ok) => haystack.includes(ok.toLowerCase()));
  if (!hit) {
    fail(`${voiceId}: MODEL_CARD matches no allowed license (${allow.join(", ")}) — failing closed (P7 §37)`);
  }
  return hit;
}

function recon(downloads: string) {
  const manifest = loadManifest();
  const report: Record<string, unknown>[] = [];
  for (const voice of manifest.voices) {
    for (const [kind, file] of Object.entries(voice.files)) {
      const a = path.join(downloads, `${voice.id}.${kind}.1`);
      const b = path.join(downloads, `${voice.id}.${kind}.2`);
      if (!existsSync(a) || !existsSync(b)) fail(`${voice.id}: missing downloaded ${kind} copies`);
      const ha = sha256File(a);
      const hb = sha256File(b);
      if (ha.sha256 !== hb.sha256) {
        fail(`${voice.id}.${kind}: the two downloads differ — refusing to pin an unstable artifact`);
      }
      file.sha256 = ha.sha256;
      file.bytes = ha.bytes;
    }
    const cardText = readFileSync(path.join(downloads, `${voice.id}.modelCard.1`), "utf8");
    const { dataset, license } = parseModelCard(cardText);
    voice.declaredDataset = dataset;
    voice.declaredLicense = license;
    const matched = licenseGateCheck(manifest, voice.id, cardText);
    // Commit the MODEL_CARD verbatim as the provenance record (P7 §36).
    const cardsDir = path.join(ROOT, "content/fr/reception/model-cards");
    mkdirSync(cardsDir, { recursive: true });
    writeFileSync(path.join(cardsDir, `${voice.id}.MODEL_CARD.txt`), cardText);
    report.push({
      voice: voice.id,
      dataset,
      license,
      licenseGateMatched: matched,
      files: voice.files,
    });
    console.log(`pinned ${voice.id}: dataset=${dataset} license-gate=${matched}`);
  }
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  const reportPath = path.join(ROOT, "content/reports/reception-audio-recon.json");
  writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        generator: "scripts/reception-audio.ts recon",
        voicesRevision: manifest.voicesRevision,
        piperTts: manifest.piperTts,
        voices: report,
      },
      null,
      2
    )}\n`
  );
  console.log(`recon complete: pins written to manifest, report at ${reportPath}`);
}

function verify(downloads: string) {
  const manifest = loadManifest();
  for (const voice of manifest.voices) {
    for (const [kind, file] of Object.entries(voice.files)) {
      if (!file.sha256) fail(`${voice.id}.${kind}: manifest has no pin — run recon first`);
      const p = path.join(downloads, `${voice.id}.${kind}.1`);
      if (!existsSync(p)) fail(`${voice.id}: missing downloaded ${kind}`);
      const h = sha256File(p);
      if (h.sha256 !== file.sha256) {
        fail(
          `${voice.id}.${kind}: hash drift — pinned ${file.sha256}, downloaded ${h.sha256}. Source changed upstream; failing closed (P7 §34).`
        );
      }
    }
    console.log(`verified ${voice.id} against pins`);
  }
}

// ---------------------------------------------------------------------------
// plan
// ---------------------------------------------------------------------------

export type GenClip = {
  clipId: string;
  text: string;
  voiceId: string;
  speaker: number | null;
  lengthScale: number;
  assetKey: string;
};

function assetKeyFor(input: {
  language: string;
  text: string;
  voiceId: string;
  speaker: number | null;
  lengthScale: number;
  pipelineVersion: number;
}): string {
  const canonical = JSON.stringify([
    input.language,
    input.text,
    input.voiceId,
    input.speaker,
    input.lengthScale,
    input.pipelineVersion,
  ]);
  return createHash("sha256").update(canonical).digest("hex").slice(0, 20);
}

/** Canary sweep speakers for the multi-speaker voice (selection audit). */
const CANARY_MLS_SPEAKERS = [0, 1, 2, 3, 4, 5, 6, 7];

function plan(mode: string, out: string) {
  const manifest = loadManifest();
  const clips: GenClip[] = [];
  const push = (clipId: string, text: string, voiceId: string, speaker: number | null) => {
    clips.push({
      clipId,
      text,
      voiceId,
      speaker,
      lengthScale: 1.0,
      assetKey: assetKeyFor({
        language: "fr",
        text,
        voiceId,
        speaker,
        lengthScale: 1.0,
        pipelineVersion: manifest.pipelineVersion,
      }),
    });
  };
  if (mode === "canary") {
    const canary = JSON.parse(readFileSync(CANARY_PATH, "utf8")) as {
      items: { id: string; text: string }[];
    };
    for (const item of canary.items) {
      push(`${item.id}@siwis`, item.text, "fr_FR-siwis-medium", null);
      for (const sp of CANARY_MLS_SPEAKERS) {
        push(`${item.id}@mls-${sp}`, item.text, "fr_FR-mls-medium", sp);
      }
    }
  } else if (mode === "generate") {
    if (!existsSync(LISTENING_PATH)) fail("listening.json does not exist yet — author content first");
    const listening = JSON.parse(readFileSync(LISTENING_PATH, "utf8")) as {
      clips: { id: string; transcript: string; voice: { voiceId: string; speaker: number | null } }[];
    };
    for (const clip of listening.clips) {
      push(clip.id, clip.transcript, clip.voice.voiceId, clip.voice.speaker);
    }
  } else {
    fail(`unknown plan mode ${mode}`);
  }
  writeFileSync(out, `${JSON.stringify({ pipelineVersion: manifest.pipelineVersion, clips }, null, 2)}\n`);
  console.log(`plan (${mode}): ${clips.length} clips → ${out}`);
}

// ---------------------------------------------------------------------------
// qa
// ---------------------------------------------------------------------------

function ffprobeDuration(p: string): number {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p],
    { encoding: "utf8" }
  ).trim();
  return Number(out);
}

function ffVolume(p: string): { maxVolumeDb: number | null } {
  const out = execFileSync(
    "ffmpeg",
    ["-i", p, "-af", "volumedetect", "-f", "null", "-"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
  );
  const m = /max_volume:\s*(-?[\d.]+)\s*dB/.exec(out);
  return { maxVolumeDb: m ? Number(m[1]) : null };
}

function ffEdgeSilence(p: string): { lead: number | null; trail: number | null } {
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

type QaRow = {
  clipId: string;
  assetKey: string;
  voiceId: string;
  speaker: number | null;
  transcript: string;
  durationSec: number;
  bytes: number;
  maxVolumeDb: number | null;
  leadingSilenceSec: number | null;
  trailingSilenceSec: number | null;
  charsPerSec: number;
  technical: "pass" | "fail";
  technicalIssues: string[];
  asr?: { text: string; wer: number };
};

function qa(planPath: string, outdir: string, reportPath: string, asrPath?: string) {
  const genPlan = JSON.parse(readFileSync(planPath, "utf8")) as { clips: GenClip[] };
  const asr: Record<string, { text: string; wer: number }> = asrPath
    ? (JSON.parse(readFileSync(asrPath, "utf8")) as Record<string, { text: string; wer: number }>)
    : {};
  const rows: QaRow[] = [];
  let failures = 0;
  for (const clip of genPlan.clips) {
    const p = path.join(outdir, `${clip.assetKey}.mp3`);
    const issues: string[] = [];
    if (!existsSync(p)) {
      rows.push({
        clipId: clip.clipId,
        assetKey: clip.assetKey,
        voiceId: clip.voiceId,
        speaker: clip.speaker,
        transcript: clip.text,
        durationSec: 0,
        bytes: 0,
        maxVolumeDb: null,
        leadingSilenceSec: null,
        trailingSilenceSec: null,
        charsPerSec: 0,
        technical: "fail",
        technicalIssues: ["missing file"],
      });
      failures++;
      continue;
    }
    const { bytes } = sha256File(p);
    const duration = ffprobeDuration(p);
    const { maxVolumeDb } = ffVolume(p);
    const { lead, trail } = ffEdgeSilence(p);
    const charsPerSec = clip.text.length / Math.max(duration, 0.001);
    if (!(duration > 0.3)) issues.push(`duration ${duration.toFixed(2)}s too short`);
    if (bytes < 1000) issues.push("file under 1KB");
    if (maxVolumeDb !== null && maxVolumeDb > -0.2) issues.push(`possible clipping (max ${maxVolumeDb}dB)`);
    if (lead !== null && lead > 1.0) issues.push(`leading silence ${lead.toFixed(2)}s`);
    if (trail !== null && trail > 1.2) issues.push(`trailing silence ${trail.toFixed(2)}s`);
    if (charsPerSec < 4 || charsPerSec > 30) {
      issues.push(`duration implausible for transcript (${charsPerSec.toFixed(1)} chars/sec)`);
    }
    if (issues.length > 0) failures++;
    rows.push({
      clipId: clip.clipId,
      assetKey: clip.assetKey,
      voiceId: clip.voiceId,
      speaker: clip.speaker,
      transcript: clip.text,
      durationSec: Number(duration.toFixed(3)),
      bytes,
      maxVolumeDb,
      leadingSilenceSec: lead === null ? null : Number(lead.toFixed(3)),
      trailingSilenceSec: trail === null ? null : Number(trail.toFixed(3)),
      charsPerSec: Number(charsPerSec.toFixed(2)),
      technical: issues.length === 0 ? "pass" : "fail",
      technicalIssues: issues,
      ...(asr[clip.clipId] ? { asr: asr[clip.clipId] } : {}),
    });
  }
  rows.sort((a, b) => a.clipId.localeCompare(b.clipId));
  // Per-voice/speaker WER aggregates drive the pinned-speaker selection.
  const bySpeaker = new Map<string, { count: number; werSum: number; techFails: number }>();
  for (const row of rows) {
    const key = row.speaker === null ? row.voiceId : `${row.voiceId}#${row.speaker}`;
    let agg = bySpeaker.get(key);
    if (!agg) bySpeaker.set(key, (agg = { count: 0, werSum: 0, techFails: 0 }));
    agg.count += 1;
    if (row.asr) agg.werSum += row.asr.wer;
    if (row.technical === "fail") agg.techFails += 1;
  }
  const speakerSummary = [...bySpeaker.entries()]
    .map(([key, a]) => ({
      speaker: key,
      clips: a.count,
      meanWer: Number((a.werSum / Math.max(a.count, 1)).toFixed(4)),
      technicalFailures: a.techFails,
    }))
    .sort((a, b) => a.meanWer - b.meanWer || a.speaker.localeCompare(b.speaker));
  writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        generator: "scripts/reception-audio.ts qa",
        clipCount: rows.length,
        technicalFailures: failures,
        speakerSummary,
        clips: rows,
      },
      null,
      2
    )}\n`
  );
  console.log(`qa: ${rows.length} clips, ${failures} technical failures → ${reportPath}`);
  if (failures > 0 && arg("strict") === "true") fail("technical QA failures in strict mode");
}

// ---------------------------------------------------------------------------

const cmd = process.argv[2];
if (cmd === "recon") recon(arg("downloads") ?? fail("--downloads required"));
else if (cmd === "verify") verify(arg("downloads") ?? fail("--downloads required"));
else if (cmd === "plan") plan(arg("mode") ?? fail("--mode required"), arg("out") ?? fail("--out required"));
else if (cmd === "qa")
  qa(
    arg("plan") ?? fail("--plan required"),
    arg("outdir") ?? fail("--outdir required"),
    arg("report") ?? fail("--report required"),
    arg("asr")
  );
else fail(`unknown subcommand ${cmd ?? "(none)"}`);

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
  /** Speaker ids the canary sweeps for a multi-speaker voice. */
  canarySpeakers?: number[];
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
  // Gate over the LICENSE-RELEVANT lines only (license/CC/dataset lines) —
  // the first recon run proved a whole-card substring check is wrong: bare
  // "NC" matches inside the word "French". Deny tokens match with token
  // boundaries so CC BY-NC fails but FRENCH does not.
  const { dataset, license } = parseModelCard(cardText);
  const haystack = [dataset ?? "", license ?? ""].join("\n");
  if (haystack.trim().length === 0) {
    fail(`${voiceId}: MODEL_CARD carries no parseable dataset/license line — failing closed (P7 §37)`);
  }
  for (const bad of deny) {
    const boundary = new RegExp(`(^|[^A-Za-z])${bad.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z]|$)`, "i");
    if (boundary.test(haystack)) {
      fail(
        `${voiceId}: license/dataset line mentions denied token "${bad}" (${haystack.replace(/\n/g, " | ")}) — failing closed (P7 §31/§37)`
      );
    }
  }
  // Spelling-normalized allow match: "CC BY 4.0" == "CC-BY 4.0" ==
  // "CC-BY-4.0" (the siwis card writes "CC-BY 4.0" — verified from the
  // double-downloaded card). Deny stayed boundary-based on the RAW lines
  // above, so CC-BY-NC still fails before ever reaching this.
  const norm = (x: string) => x.toLowerCase().replace(/[-\s]+/g, "");
  const hit = allow.find((ok) => norm(haystack).includes(norm(ok)));
  if (!hit) {
    fail(
      `${voiceId}: license/dataset line matches no allowed license (${allow.join(", ")}); saw: ${haystack.replace(/\n/g, " | ")} — failing closed (P7 §37)`
    );
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

export type GenSegment = { voiceId: string; speaker: number | null; text: string };
export type GenClip = {
  clipId: string;
  /** Joined transcript — the QA/ASR reference. */
  text: string;
  segments: GenSegment[];
  assetKey: string;
};

function assetKeyFor(segments: GenSegment[], pipelineVersion: number): string {
  const canonical = JSON.stringify([
    "fr",
    segments.map((s) => [s.voiceId, s.speaker, s.text]),
    1.0, // length scale (normal authored rate; slow mode is playback-time)
    pipelineVersion,
  ]);
  return createHash("sha256").update(canonical).digest("hex").slice(0, 20);
}

/** Short label for canary clip ids: "fr_FR-upmc-medium" → "upmc". */
function voiceShortName(voiceId: string): string {
  return voiceId.replace(/^[a-z]{2}_[A-Z]{2}-/, "").replace(/-[a-z]+$/, "");
}

function plan(mode: string, out: string) {
  const manifest = loadManifest();
  const clips: GenClip[] = [];
  const push = (clipId: string, segments: GenSegment[]) => {
    clips.push({
      clipId,
      text: segments.map((s) => s.text).join(" "),
      segments,
      assetKey: assetKeyFor(segments, manifest.pipelineVersion),
    });
  };
  if (mode === "canary") {
    const canary = JSON.parse(readFileSync(CANARY_PATH, "utf8")) as {
      items: { id: string; text: string }[];
    };
    // Manifest-driven sweep: every candidate voice, every canary speaker for
    // multi-speaker models — the ASR audit over this output picks the pins.
    for (const item of canary.items) {
      for (const voice of manifest.voices) {
        const short = voiceShortName(voice.id);
        if (!voice.multiSpeaker) {
          push(`${item.id}@${short}`, [{ voiceId: voice.id, speaker: null, text: item.text }]);
          continue;
        }
        const speakers = voice.canarySpeakers ?? voice.pinnedSpeakers ?? [];
        if (speakers.length === 0) fail(`${voice.id}: multi-speaker voice has no canarySpeakers`);
        for (const sp of speakers) {
          push(`${item.id}@${short}-${sp}`, [{ voiceId: voice.id, speaker: sp, text: item.text }]);
        }
      }
    }
  } else if (mode === "generate") {
    if (!existsSync(LISTENING_PATH)) fail("listening.json does not exist yet — author content first");
    const listening = JSON.parse(readFileSync(LISTENING_PATH, "utf8")) as {
      voiceCast: Record<"A" | "B", { voiceId: string; speaker: number | null }>;
      clips: { id: string; segments: { speaker: "A" | "B"; text: string }[] }[];
    };
    for (const clip of listening.clips) {
      push(
        clip.id,
        clip.segments.map((seg) => ({
          voiceId: listening.voiceCast[seg.speaker].voiceId,
          speaker: listening.voiceCast[seg.speaker].speaker,
          text: seg.text,
        }))
      );
    }
  } else {
    fail(`unknown plan mode ${mode}`);
  }
  writeFileSync(out, `${JSON.stringify({ pipelineVersion: manifest.pipelineVersion, clips }, null, 2)}\n`);
  console.log(`plan (${mode}): ${clips.length} clips → ${out}`);
}

/**
 * Emit a deterministic bash script that synthesizes every planned clip:
 * piper per segment → 0.35s silence joins → one 22.05kHz mono 64k MP3 per
 * clip. Generated (not hand-run) so quoting is exact and the run log shows
 * the full recipe.
 */
function synthScript(planPath: string, dl: string, wav: string, out: string) {
  const genPlan = JSON.parse(readFileSync(planPath, "utf8")) as { clips: GenClip[] };
  const shq = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;
  const lines: string[] = [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    `mkdir -p ${shq(wav)} ${shq(out)}`,
    // Inter-segment beat for dialogue clips.
    `ffmpeg -v error -y -f lavfi -i anullsrc=r=22050:cl=mono -t 0.35 ${shq(`${wav}/_gap.wav`)}`,
  ];
  for (const clip of genPlan.clips) {
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
      const entries = segWavs
        .map((p) => `file ${shq(p)}`)
        .join(`\\nfile ${shq(`${wav}/_gap.wav`)}\\n`);
      lines.push(`printf '%b\\n' ${shq(entries)} > ${shq(listFile)}`);
      lines.push(
        `ffmpeg -v error -y -f concat -safe 0 -i ${shq(listFile)} -ar 22050 -ac 1 ${shq(joined)}`
      );
    }
    lines.push(
      `ffmpeg -v error -y -i ${shq(joined)} -ar 22050 -ac 1 -codec:a libmp3lame -b:a 64k ${shq(`${out}/${clip.assetKey}.mp3`)}`
    );
  }
  lines.push(`echo "synthesized ${genPlan.clips.length} clips"`);
  process.stdout.write(`${lines.join("\n")}\n`);
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
  /** First segment's voice, or "mixed" for multi-voice dialogue clips. */
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
    const voices = new Set(clip.segments.map((s) => s.voiceId));
    const rowVoice = voices.size === 1 ? clip.segments[0].voiceId : "mixed";
    const rowSpeaker = voices.size === 1 ? clip.segments[0].speaker : null;
    if (!existsSync(p)) {
      rows.push({
        clipId: clip.clipId,
        assetKey: clip.assetKey,
        voiceId: rowVoice,
        speaker: rowSpeaker,
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
      voiceId: rowVoice,
      speaker: rowSpeaker,
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
        // Census names (P8 Gate 0): one QA row per AUTHORED clip; distinct
        // asset keys deduplicate identical synthesized content by design.
        authoredClipCount: rows.length,
        uniqueAssetCount: new Set(rows.map((r) => r.assetKey)).size,
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
else if (cmd === "synth-script")
  synthScript(
    arg("plan") ?? fail("--plan required"),
    arg("dl") ?? fail("--dl required"),
    arg("wav") ?? fail("--wav required"),
    arg("out") ?? fail("--out required")
  );
else if (cmd === "qa")
  qa(
    arg("plan") ?? fail("--plan required"),
    arg("outdir") ?? fail("--outdir required"),
    arg("report") ?? fail("--report required"),
    arg("asr")
  );
else fail(`unknown subcommand ${cmd ?? "(none)"}`);

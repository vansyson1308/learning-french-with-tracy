/**
 * Engine registry + the shared synthesis-script builder (P3b). The
 * pipeline asks `engineFor(voice.engine)` for downloads / licence card /
 * synthesis lines; `buildSynthScript` turns a list of clips (segments with
 * a voice each) into one deterministic bash recipe: per-engine synthesis
 * → 0.35 s gaps between segments → optional EBU R128 loudness
 * normalisation (pipelineVersion ≥ 2) → 22.05 kHz mono 64 kbps MP3.
 */

import { readFileSync } from "fs";

import { shq } from "../piper-audio";
import { readJson } from "../pipeline";

import { kokoroEngine } from "./kokoro";
import { melottsEngine } from "./melotts";
import { piperEngine } from "./piper";
import type { EngineId, EnginesDoc, SynthJob, TtsEngine, Voice } from "./types";

export * from "./types";

const ENGINES: Record<EngineId, TtsEngine> = { piper: piperEngine, kokoro: kokoroEngine, melotts: melottsEngine };

export function engineFor(id: EngineId): TtsEngine {
  const e = ENGINES[id];
  if (!e) throw new Error(`unknown TTS engine "${id}"`);
  return e;
}

export function loadEngines(): EnginesDoc {
  return readJson("content/audio/engines.json") as EnginesDoc;
}

export function loadEnginesFrom(absPath: string): EnginesDoc {
  return JSON.parse(readFileSync(absPath, "utf8")) as EnginesDoc;
}

export type ScriptClip = {
  assetKey: string;
  /** The pipeline version the clip's key was derived with (≥ 2 → loudness-normalised). */
  pipelineVersion: number;
  segments: { voiceId: string; speaker: number | string | null; text: string }[];
};

/**
 * One bash script for every clip: segment WAVs by engine (each engine
 * batches its jobs), concatenation with a 0.35 s gap, loudness
 * normalisation for v2 clips, MP3 encode. Clips present in `existing`
 * (already blessed, content-addressed) are copied, never re-rendered.
 */
/** Speech bitrate for a pipeline version (P3f: 32 kbps mono from version 3; French stays at version 1). */
export function mp3KbpsFor(engines: Pick<EnginesDoc, "encoding">, pipelineVersion: number): number {
  let kbps = engines.encoding.mp3Kbps;
  let from = 0;
  for (const [v, k] of Object.entries(engines.encoding.mp3KbpsFromVersion ?? {})) {
    if (Number(v) <= pipelineVersion && Number(v) > from) {
      from = Number(v);
      kbps = k;
    }
  }
  return kbps;
}

export function buildSynthScript(input: {
  clips: ScriptClip[];
  voices: Voice[];
  engines: EnginesDoc;
  downloadsDir: string;
  wavDir: string;
  outDir: string;
  existingDir?: string;
  existingKeys?: ReadonlySet<string>;
}): string {
  const { clips, engines, downloadsDir, wavDir, outDir } = input;
  const voicesById = new Map(input.voices.map((v) => [v.id, v]));
  const lines: string[] = [
    "#!/usr/bin/env bash",
    "set -euo pipefail",
    `mkdir -p ${shq(wavDir)} ${shq(outDir)}`,
    `ffmpeg -v error -y -f lavfi -i anullsrc=r=${engines.encoding.sampleRateHz}:cl=mono -t 0.35 ${shq(`${wavDir}/_gap.wav`)}`,
  ];
  const jobsByEngine = new Map<EngineId, SynthJob[]>();
  const render: ScriptClip[] = [];
  let reused = 0;
  const seen = new Set<string>();
  for (const clip of clips) {
    if (seen.has(clip.assetKey)) continue;
    seen.add(clip.assetKey);
    if (input.existingDir && input.existingKeys?.has(clip.assetKey)) {
      lines.push(`cp ${shq(`${input.existingDir}/${clip.assetKey}.mp3`)} ${shq(`${outDir}/${clip.assetKey}.mp3`)}`);
      reused += 1;
      continue;
    }
    render.push(clip);
    clip.segments.forEach((seg, i) => {
      const voice = voicesById.get(seg.voiceId);
      if (!voice) throw new Error(`synth: unknown voice ${seg.voiceId}`);
      const list = jobsByEngine.get(voice.engine) ?? [];
      list.push({ voiceId: seg.voiceId, speaker: seg.speaker, text: seg.text, wavPath: `${wavDir}/${clip.assetKey}.seg${i}.wav` });
      jobsByEngine.set(voice.engine, list);
    });
  }
  for (const [engineId, jobs] of [...jobsByEngine.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`# --- ${engineId}: ${jobs.length} segment(s) ---`);
    lines.push(...engineFor(engineId).synthScript(jobs, voicesById, downloadsDir, wavDir, engines));
  }
  const { integratedLufs, truePeakDb, loudnessRange } = engines.loudness;
  for (const clip of render) {
    const segWavs = clip.segments.map((_, i) => `${wavDir}/${clip.assetKey}.seg${i}.wav`);
    const joined = `${wavDir}/${clip.assetKey}.joined.wav`;
    if (segWavs.length === 1) {
      lines.push(`cp ${shq(segWavs[0])} ${shq(joined)}`);
    } else {
      const listFile = `${wavDir}/${clip.assetKey}.list`;
      const entries = segWavs.map((p) => `file ${shq(p)}`).join(`\\nfile ${shq(`${wavDir}/_gap.wav`)}\\n`);
      lines.push(`printf '%b\\n' ${shq(entries)} > ${shq(listFile)}`);
      lines.push(`ffmpeg -v error -y -f concat -safe 0 -i ${shq(listFile)} -ar ${engines.encoding.sampleRateHz} -ac 1 ${shq(joined)}`);
    }
    const filter = clip.pipelineVersion >= 2 ? ` -af ${shq(`loudnorm=I=${integratedLufs}:TP=${truePeakDb}:LRA=${loudnessRange}`)}` : "";
    lines.push(
      `ffmpeg -v error -y -i ${shq(joined)}${filter} -ar ${engines.encoding.sampleRateHz} -ac ${engines.encoding.channels} -codec:a libmp3lame -b:a ${mp3KbpsFor(engines, clip.pipelineVersion)}k ${shq(`${outDir}/${clip.assetKey}.mp3`)}`
    );
  }
  lines.push(`echo "synthesized ${render.length} clips, reused ${reused} existing assets (${clips.length} plan clips)"`);
  return `${lines.join("\n")}\n`;
}

/** Engines a set of voices needs (install only those). */
export function enginesNeeded(voices: Voice[]): EngineId[] {
  return [...new Set(voices.map((v) => v.engine))].sort();
}

/**
 * MeloTTS engine (P3b): MIT library pinned by git commit; one MIT model
 * repository per language on Hugging Face (checkpoint.pth + config.json),
 * pinned by revision and file hashes. Synthesis runs one Python process per
 * voice over a JSONL job list (the model loads once).
 */

import { readFileSync } from "fs";
import path from "path";

import { shq } from "../piper-audio";

import type { DownloadItem, EnginesDoc, LicenseCard, SynthJob, TtsEngine, Voice } from "./types";

export const MELOTTS_HELPER = "scripts/lib/tts/melotts_synth.py";

export const melottsEngine: TtsEngine = {
  id: "melotts",
  install: (engines) => engines.engines.melotts.install,
  downloads(voice, engines) {
    const model = engines.engines.melotts.models[voice.language];
    if (!model) throw new Error(`melotts: no model repository for ${voice.language}`);
    const base = `${model.repository}/resolve/${model.revision ?? "main"}`;
    return Object.entries(voice.files).map(([kind, f]) => ({ voiceId: voice.id, kind, url: `${base}/${f.path}?download=true` }));
  },
  licenseCard(voice, downloadsDir) {
    const p = path.join(downloadsDir, `${voice.id}.modelCard.1`);
    return { text: readFileSync(p, "utf8"), source: voice.files.modelCard?.path ?? "README.md" };
  },
  synthScript(jobs, voicesById, downloadsDir, scratchDir, engines) {
    const lines: string[] = [];
    const byVoice = new Map<string, SynthJob[]>();
    for (const job of jobs) byVoice.set(job.voiceId, [...(byVoice.get(job.voiceId) ?? []), job]);
    for (const [voiceId, list] of byVoice) {
      const voice = voicesById.get(voiceId);
      if (!voice) throw new Error(`melotts: unknown voice ${voiceId}`);
      const model = engines.engines.melotts.models[voice.language];
      if (!model) throw new Error(`melotts: no model for ${voice.language}`);
      const jobsFile = `${scratchDir}/melotts-${voiceId}.jobs.jsonl`;
      const payload = list.map((j) => JSON.stringify({ text: j.text, out: j.wavPath })).join("\n");
      lines.push(`printf '%s\\n' ${shq(payload)} > ${shq(jobsFile)}`);
      const speaker = typeof voice.speaker === "string" ? voice.speaker : model.defaultSpeaker;
      lines.push(
        `python3 ${MELOTTS_HELPER} --language ${shq(model.language)} --speaker ${shq(speaker)} --ckpt ${shq(`${downloadsDir}/${voiceId}.checkpoint.1`)} --config ${shq(`${downloadsDir}/${voiceId}.config.1`)} --jobs ${shq(jobsFile)}`
      );
    }
    return lines;
  },
};

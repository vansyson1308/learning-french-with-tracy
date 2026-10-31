/**
 * Kokoro-82M engine (P3b): Apache-2.0 model + `kokoro` package (Apache),
 * voices are per-speaker `.pt` style vectors in the model repository.
 * The shared model and config are pinned once (engines.json revision +
 * file hashes recorded on the voice's `files.model` / `files.config` at
 * recon); every voice pins its own `.pt`. Synthesis runs one Python
 * process per voice over a JSONL job list (the model loads once).
 */

import { readFileSync } from "fs";
import path from "path";

import { shq } from "../piper-audio";

import type { DownloadItem, EnginesDoc, LicenseCard, SynthJob, TtsEngine, Voice } from "./types";

export const KOKORO_HELPER = "scripts/lib/tts/kokoro_synth.py";

/** Kokoro's French voice leaves long edge silence on short words, which fails the speaking-rate check ("merci": 0.55 s of speech in 1.25 s). */
const TRIM_EDGES = new Set(["fr"]);

export const kokoroEngine: TtsEngine = {
  id: "kokoro",
  install: (engines) => engines.engines.kokoro.install,
  downloads(voice, engines) {
    const k = engines.engines.kokoro;
    const base = `${k.modelRepository}/resolve/${k.modelRevision}`;
    const items: DownloadItem[] = [];
    for (const [kind, f] of Object.entries(voice.files)) items.push({ voiceId: voice.id, kind, url: `${base}/${f.path}?download=true` });
    return items;
  },
  licenseCard(voice, downloadsDir) {
    // The model card (README.md) of the Kokoro-82M repository states the licence of model and voices.
    const p = path.join(downloadsDir, `${voice.id}.modelCard.1`);
    return { text: readFileSync(p, "utf8"), source: voice.files.modelCard?.path ?? "README.md" };
  },
  synthScript(jobs, voicesById, downloadsDir, scratchDir, engines) {
    const lines: string[] = [];
    const byVoice = new Map<string, SynthJob[]>();
    for (const job of jobs) byVoice.set(job.voiceId, [...(byVoice.get(job.voiceId) ?? []), job]);
    for (const [voiceId, list] of byVoice) {
      const voice = voicesById.get(voiceId);
      if (!voice) throw new Error(`kokoro: unknown voice ${voiceId}`);
      const langCode = engines.engines.kokoro.langCodes[voice.language];
      if (!langCode) throw new Error(`kokoro: no lang code for ${voice.language}`);
      const jobsFile = `${scratchDir}/kokoro-${voiceId}.jobs.jsonl`;
      const payload = list.map((j) => JSON.stringify({ text: j.text, out: j.wavPath })).join("\n");
      lines.push(`printf '%s\\n' ${shq(payload)} > ${shq(jobsFile)}`);
      lines.push(
        `python3 ${KOKORO_HELPER} --lang-code ${shq(langCode)} --model ${shq(`${downloadsDir}/${voiceId}.model.1`)} --config ${shq(`${downloadsDir}/${voiceId}.config.1`)} --voice ${shq(`${downloadsDir}/${voiceId}.voiceFile.1`)} --jobs ${shq(jobsFile)}${TRIM_EDGES.has(voice.language) ? " --trim-edges" : ""}`
      );
    }
    return lines;
  },
};

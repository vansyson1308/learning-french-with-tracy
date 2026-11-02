/**
 * Parler-TTS Mini Multilingual engine (D-11): Apache-2.0 model trained on CC BY 4.0
 * datasets, for languages with no clean Kokoro or Piper voice. A voice is one of the
 * model's named speakers, chosen through the description prompt. Weights are pinned
 * once (engines.json revision, hashes on the voice's files at recon) and the URL-keyed
 * download cache shares the 3.75 GB checkpoint between voices.
 */

import { readFileSync } from "fs";
import path from "path";

import { shq } from "../piper-audio";

import type { DownloadItem, EnginesDoc, TtsEngine, Voice } from "./types";

export const PARLER_HELPER = "scripts/lib/tts/parler_synth.py";

/** Local file name inside the assembled model directory, per download kind. */
export const PARLER_MODEL_FILES: Record<string, string> = {
  model: "model.safetensors",
  config: "config.json",
  generationConfig: "generation_config.json",
  preprocessorConfig: "preprocessor_config.json",
  specialTokens: "special_tokens_map.json",
  tokenizer: "tokenizer.json",
  tokenizerModel: "tokenizer.model",
  tokenizerConfig: "tokenizer_config.json",
};

/** The description prompt's tokenizer, from the model's text encoder repository. */
export const PARLER_DESCRIPTION_FILES: Record<string, string> = {
  descTokenizer: "tokenizer.json",
  descTokenizerModel: "spiece.model",
  descTokenizerConfig: "tokenizer_config.json",
  descSpecialTokens: "special_tokens_map.json",
};

const urlOf = (engines: EnginesDoc, kind: string, file: string) => {
  const p = engines.engines.parler;
  return kind in PARLER_DESCRIPTION_FILES ? `${p.descriptionRepository}/resolve/${p.descriptionRevision}/${file}?download=true` : `${p.modelRepository}/resolve/${p.modelRevision}/${file}?download=true`;
};

export const parlerEngine: TtsEngine = {
  id: "parler",
  install: (engines) => engines.engines.parler.install,
  downloads(voice, engines) {
    const items: DownloadItem[] = [];
    for (const [kind, f] of Object.entries(voice.files)) items.push({ voiceId: voice.id, kind, url: urlOf(engines, kind, f.path) });
    return items;
  },
  licenseCard(voice, downloadsDir) {
    const p = path.join(downloadsDir, `${voice.id}.modelCard.1`);
    return { text: readFileSync(p, "utf8"), source: voice.files.modelCard?.path ?? "README.md" };
  },
  synthScript(jobs, voicesById, downloadsDir, scratchDir) {
    const lines: string[] = [];
    const byVoice = new Map<string, typeof jobs>();
    for (const job of jobs) byVoice.set(job.voiceId, [...(byVoice.get(job.voiceId) ?? []), job]);
    for (const [voiceId, list] of byVoice) {
      const voice: Voice | undefined = voicesById.get(voiceId);
      if (!voice || typeof voice.speaker !== "string") throw new Error(`parler: voice ${voiceId} needs a named speaker`);
      const jobsFile = `${scratchDir}/parler-${voiceId}.jobs.jsonl`;
      const modelDir = `${scratchDir}/parler-${voiceId}.model`;
      const descDir = `${scratchDir}/parler-${voiceId}.desc`;
      lines.push(`mkdir -p ${shq(modelDir)} ${shq(descDir)}`);
      for (const [kind, file] of Object.entries(PARLER_MODEL_FILES)) lines.push(`ln -sf "$(realpath ${shq(`${downloadsDir}/${voiceId}.${kind}.1`)})" ${shq(`${modelDir}/${file}`)}`);
      for (const [kind, file] of Object.entries(PARLER_DESCRIPTION_FILES)) lines.push(`ln -sf "$(realpath ${shq(`${downloadsDir}/${voiceId}.${kind}.1`)})" ${shq(`${descDir}/${file}`)}`);
      lines.push(`printf '%s\\n' ${shq(list.map((j) => JSON.stringify({ text: j.text, out: j.wavPath })).join("\n"))} > ${shq(jobsFile)}`);
      lines.push(`python3 ${PARLER_HELPER} --model ${shq(modelDir)} --description-tokenizer ${shq(descDir)} --speaker ${shq(voice.speaker)} --jobs ${shq(jobsFile)}`);
    }
    return lines;
  },
};

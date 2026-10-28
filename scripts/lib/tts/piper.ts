/**
 * Piper engine (P3b): the classic MIT `piper-tts` package with voices from
 * rhasspy/piper-voices (pinned revision). Unchanged recipe from the V1
 * pipeline — `printf text | piper --model … --config … [--speaker n]`.
 */

import { readFileSync } from "fs";
import path from "path";

import { SHORT_TRANSCRIPT_UNITS, shq } from "../piper-audio";

/**
 * 2026-10-29 (audio run 40769226097): Piper trims an isolated 1–3 letter
 * word to under the 0.25 s QA floor (de "du" 0.20 s, "Sie" 0.24 s). Such
 * transcripts are rendered with a longer phoneme length. The QA floor is
 * unchanged, and longer texts keep the voice's own rate. Already-blessed
 * assets are reused byte for byte, so no committed clip changes.
 */
export const PIPER_SHORT_LENGTH_SCALE = 1.35;
const letterUnits = (text: string) => [...text].filter((c) => /[\p{L}\p{N}]/u.test(c)).length;

import type { DownloadItem, EnginesDoc, LicenseCard, SynthJob, TtsEngine, Voice } from "./types";

export const piperEngine: TtsEngine = {
  id: "piper",
  install: (engines) => engines.engines.piper.install,
  downloads(voice, engines) {
    const base = `${engines.engines.piper.voicesRepository}/resolve/${engines.engines.piper.voicesRevision}`;
    return Object.entries(voice.files).map(([kind, f]) => ({ voiceId: voice.id, kind, url: `${base}/${f.path}?download=true` }));
  },
  licenseCard(voice, downloadsDir) {
    const p = path.join(downloadsDir, `${voice.id}.modelCard.1`);
    return { text: readFileSync(p, "utf8"), source: voice.files.modelCard?.path ?? "MODEL_CARD" };
  },
  synthScript(jobs, voicesById, downloadsDir) {
    const lines: string[] = [];
    for (const job of jobs) {
      const voice = voicesById.get(job.voiceId);
      if (!voice) throw new Error(`piper: unknown voice ${job.voiceId}`);
      const speakerArgs = job.speaker === null || job.speaker === undefined ? "" : ` --speaker ${job.speaker}`;
      const lengthArgs = letterUnits(job.text) <= SHORT_TRANSCRIPT_UNITS ? ` --length_scale ${PIPER_SHORT_LENGTH_SCALE}` : "";
      lines.push(
        `printf '%s' ${shq(job.text)} | piper --model ${shq(`${downloadsDir}/${voice.id}.model.1`)} --config ${shq(`${downloadsDir}/${voice.id}.config.1`)}${speakerArgs}${lengthArgs} --output_file ${shq(job.wavPath)}`
      );
    }
    return lines;
  },
};

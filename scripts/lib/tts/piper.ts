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
 *
 * Audio run 40782316966: "du" still came out at 0.21 s at 1.35 (ASR heard
 * "Hm."). A bare two-letter token gets no utterance prosody from Piper, so a
 * short transcript is synthesised as a sentence ("du" → "du.") at scale
 * 1.7. Run 40809387767: "du." passed at 1.7, while "Sie." at 1.35 came out
 * at 0.23 s, so every 1–3 letter transcript now uses 1.7. The clip's
 * transcript is unchanged.
 */
export const PIPER_SHORT_LENGTH_SCALE = 1.7;
const letterUnits = (text: string) => [...text].filter((c) => /[\p{L}\p{N}]/u.test(c)).length;
/** What Piper is given for a transcript: a short one ends as a sentence. */
export function piperInput(text: string): string {
  return letterUnits(text) <= SHORT_TRANSCRIPT_UNITS && !/[.!?…]\s*$/u.test(text) ? `${text}.` : text;
}
function lengthScaleFor(text: string): number | null {
  return letterUnits(text) <= SHORT_TRANSCRIPT_UNITS ? PIPER_SHORT_LENGTH_SCALE : null;
}

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
      const scale = lengthScaleFor(job.text);
      const lengthArgs = scale === null ? "" : ` --length_scale ${scale}`;
      lines.push(
        `printf '%s' ${shq(piperInput(job.text))} | piper --model ${shq(`${downloadsDir}/${voice.id}.model.1`)} --config ${shq(`${downloadsDir}/${voice.id}.config.1`)}${speakerArgs}${lengthArgs} --output_file ${shq(job.wavPath)}`
      );
    }
    return lines;
  },
};

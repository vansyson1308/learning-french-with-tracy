/**
 * Piper engine (P3b): the classic MIT `piper-tts` package with voices from
 * rhasspy/piper-voices (pinned revision). Unchanged recipe from the V1
 * pipeline — `printf text | piper --model … --config … [--speaker n]`.
 */

import { readFileSync } from "fs";
import path from "path";

import { isShortTranscript, shq } from "../piper-audio";

/**
 * Short words (1–3 letters), QC 2026-10-29b §3.3.
 *
 * History: Piper trims an isolated 1–3 letter word under the 0.25 s QA floor
 * (audio run 40769226097: de "du" 0.20 s, "Sie" 0.24 s). Runs 40782316966 and
 * 40809387767 answered with a 1.35×, then 1.7× phoneme length, which made
 * "du / Sie / ja / und" sound drawn out.
 *
 * Now: near-normal speed (1.1, the QC allows ≤ 1.15) and ≈ 120 ms of
 * digital silence before and after the word, added at encode time for every
 * engine (scripts/lib/tts/index.ts `SHORT_CLIP_PAD_MS`). The 0.25 s floor is
 * checked on the padded clip and a separate speech-only floor (0.12 s,
 * silence-trimmed) catches a clipped word that padding would hide.
 */
export const PIPER_SHORT_LENGTH_SCALE = 1.1;

/**
 * What Piper is given for a transcript: a short one ends as a sentence
 * ("du" → "du."). Kept on purpose: run 40782316966 showed that a bare
 * two-letter token gets no utterance prosody from Piper — no phrase-final
 * lengthening, so the vowel is cut ("du" was heard as "Hm.") — and the
 * sentence-final period is what restores it. It is independent of the length
 * scale, so it stays with the normal-speed recipe. The clip's transcript is
 * unchanged.
 */
export function piperInput(text: string): string {
  return isShortTranscript(text) && !/[.!?…]\s*$/u.test(text) ? `${text}.` : text;
}
function lengthScaleFor(text: string): number | null {
  return isShortTranscript(text) ? PIPER_SHORT_LENGTH_SCALE : null;
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
      // QC 2026-10-29b §3.4: a declared re-synthesis renders the same voice with another noise scale.
      const noiseArgs = `${job.noiseScale === undefined ? "" : ` --noise_scale ${job.noiseScale}`}${job.noiseW === undefined ? "" : ` --noise_w ${job.noiseW}`}`;
      lines.push(
        `printf '%s' ${shq(piperInput(job.text))} | piper --model ${shq(`${downloadsDir}/${voice.id}.model.1`)} --config ${shq(`${downloadsDir}/${voice.id}.config.1`)}${speakerArgs}${lengthArgs}${noiseArgs} --output_file ${shq(job.wavPath)}`
      );
    }
    return lines;
  },
};

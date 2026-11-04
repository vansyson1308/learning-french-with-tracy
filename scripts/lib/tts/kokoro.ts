/**
 * Kokoro-82M engine (P3b): Apache-2.0 model + `kokoro` package (Apache),
 * voices are per-speaker `.pt` style vectors in the model repository.
 * The shared model and config are pinned once (engines.json revision +
 * file hashes recorded on the voice's `files.model` / `files.config` at
 * recon); every voice pins its own `.pt`. Synthesis runs one Python
 * process per voice over a JSONL job list (the model loads once).
 *
 * P4c: a language listed in `engines.kokoro.phonemeFrontends` is NOT handed
 * to Kokoro's own G2P. Its phonemes are built at plan time from the course's
 * stored readings ("course-readings": ja, scripts/lib/tts/ja-kana.ts — misaki's
 * Japanese G2P needs a MeCab dictionary, and every one is BSD; P4d: zh,
 * scripts/lib/tts/zh-readings.ts — the stored CC-CEDICT pinyin with the tone
 * sandhi for audio, instead of jieba + pypinyin), carried on each plan
 * segment, and the helper feeds them to the model directly
 * (`--input phonemes`). Every other language is unchanged: text in, misaki /
 * espeak-ng G2P inside the helper.
 */

import { readFileSync } from "fs";
import path from "path";

import { shq } from "../piper-audio";

import type { DownloadItem, EnginesDoc, LicenseCard, SynthJob, TtsEngine, Voice } from "./types";

export const KOKORO_HELPER = "scripts/lib/tts/kokoro_synth.py";

/**
 * Kokoro leaves long edge silence on short words, which fails the speaking-rate check: French "merci"
 * (0.55 s of speech in 1.25 s), English run 41474632304 (302 of 1,656 clips, "about": 0.51 s in 1.25 s).
 */
export const TRIM_EDGES: ReadonlySet<string> = new Set(["fr", "en"]);

export type PhonemeFrontend = "course-readings";

/** The plan-time phoneme front-end of a language's Kokoro voices, or null (Kokoro's own G2P reads the text). */
export function kokoroFrontend(engines: Pick<EnginesDoc, "engines">, language: string): PhonemeFrontend | null {
  return engines.engines.kokoro.phonemeFrontends?.[language]?.id ?? null;
}

type PhonemeSegment = { voiceId: string; text: string; phonemes?: string };

/** A front-end's reading of one clip text: its Kokoro phonemes, or why they cannot be built without a guess. */
export type PhonemeReader = (text: string) => { ok: true; phonemes: string } | { ok: false; error: string };
/** A language's front-end, loaded once: its reader, or the problems that stop it (scripts/lib/tts/frontends.ts). */
export type PhonemeReaderLoad = { read: PhonemeReader | null; problems: string[] };

/**
 * Plan step (P4c): the Kokoro phonemes of every segment whose voice is a Kokoro voice of a front-end language,
 * as new segments (inputs untouched); a segment the front-end cannot read without a guess is a problem.
 * `load` is called once per front-end language the clips need.
 */
export function attachKokoroPhonemes<C extends { clipId: string; segments: S[] }, S extends PhonemeSegment>(
  clips: readonly C[],
  voicesById: ReadonlyMap<string, Pick<Voice, "engine" | "language">>,
  engines: Pick<EnginesDoc, "engines">,
  load: (language: string) => PhonemeReaderLoad
): { clips: C[]; problems: string[] } {
  const languageOf = (s: PhonemeSegment): string | null => {
    const v = voicesById.get(s.voiceId);
    return v !== undefined && v.engine === "kokoro" && kokoroFrontend(engines, v.language) === "course-readings" ? v.language : null;
  };
  if (!clips.some((c) => c.segments.some((s) => languageOf(s) !== null))) return { clips: [...clips], problems: [] };
  const problems: string[] = [];
  const readers = new Map<string, PhonemeReader | null>();
  const readerFor = (language: string): PhonemeReader | null => {
    if (!readers.has(language)) {
      const loaded = load(language);
      problems.push(...loaded.problems);
      readers.set(language, loaded.read);
    }
    return readers.get(language) ?? null;
  };
  const out = clips.map((clip) => ({
    ...clip,
    segments: clip.segments.map((seg) => {
      const language = languageOf(seg);
      if (language === null) return seg;
      const read = readerFor(language);
      if (read === null) return seg;
      const r = read(seg.text);
      if (!r.ok) {
        problems.push(`kokoro ${language} front-end: ${clip.clipId}: ${r.error}`);
        return seg;
      }
      return { ...seg, phonemes: r.phonemes };
    }),
  }));
  return { clips: out, problems };
}

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
      const frontend = kokoroFrontend(engines, voice.language);
      const missing = frontend === null ? undefined : list.find((j) => !j.phonemes);
      if (missing) throw new Error(`kokoro: ${voice.language} reads phonemes from the plan (${frontend}), but the segment "${missing.text}" has none — re-run plan`);
      const jobsFile = `${scratchDir}/kokoro-${voiceId}.jobs.jsonl`;
      const payload = list.map((j) => JSON.stringify(frontend === null ? { text: j.text, out: j.wavPath } : { phonemes: j.phonemes, text: j.text, out: j.wavPath })).join("\n");
      lines.push(`printf '%s\\n' ${shq(payload)} > ${shq(jobsFile)}`);
      lines.push(
        `python3 ${KOKORO_HELPER} --lang-code ${shq(langCode)} --model ${shq(`${downloadsDir}/${voiceId}.model.1`)} --config ${shq(`${downloadsDir}/${voiceId}.config.1`)} --voice ${shq(`${downloadsDir}/${voiceId}.voiceFile.1`)} --jobs ${shq(jobsFile)}${frontend === null ? "" : " --input phonemes"}${TRIM_EDGES.has(voice.language) ? " --trim-edges" : ""}`
      );
    }
    return lines;
  },
};

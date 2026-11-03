/**
 * Render recipes that differ from the default one (QC 2026-10-29b §3.3–3.4).
 *
 * Assets are content-addressed and an already-blessed file is reused by its
 * key, so a recipe change reaches a clip only through its key. A recipe tag
 * enters the key ONLY for the clips it changes; every other clip keeps its
 * key and its blessed bytes.
 *
 *  - Short words: a 1–3 letter Piper headword at pipeline version ≥ 3 was
 *    rendered at 1.7× length (runs 40782316966, 40809387767). The new recipe
 *    (near-normal speed + ≈ 120 ms edge padding) is tagged so those clips
 *    re-render. Other engines never had the slow-down; their blessed short
 *    words keep their keys, and new ones get the padding at encode time.
 *  - Re-synthesis: a voice manifest may declare clips to re-render with the
 *    same voice and another Piper noise scale (`resynthesis` in
 *    content/<lang>/reception/audio-source-manifest.json).
 *  - Phoneme front-end (P4c): a language whose Kokoro phonemes the plan builds
 *    (engines.json `kokoro.phonemeFrontends`, ja) tags every Kokoro clip with
 *    the front-end's id and version. The key hashes the text, not the phonemes,
 *    so a reading fix reaches the audio only when the version is bumped
 *    (scripts/lib/tts/ja-frontend-inputs.ts guards that). Every other language
 *    has no front-end: no tag, keys unchanged.
 */

import { existsSync } from "fs";

import { codecRecipe, type AudioCodec, type CodecSettings } from "./audio-codec";
import { isShortTranscript } from "./piper-audio";
import { readJson, safeResolve } from "./pipeline";
import type { PhonemeFrontendSpec } from "./tts/types";

/** Normal speed + edge padding; bump the number when the short-word recipe changes again. */
export const SHORT_WORD_RECIPE = "short-words-2";
/** Lowest pipeline version whose Piper short words were rendered with the 1.7× recipe. */
export const SHORT_WORD_RECIPE_FROM_VERSION = 3;

export type SynthesisOverride = { noiseScale: number; noiseW: number };
export type Resynthesis = { reason: string; piper: SynthesisOverride; clips: string[] };

export function voiceManifestRel(lang: string): string {
  return `content/${lang}/reception/audio-source-manifest.json`;
}

/** The language's declared re-synthesis, or null. */
export function loadResynthesis(lang: string): Resynthesis | null {
  const rel = voiceManifestRel(lang);
  if (!existsSync(safeResolve(rel))) return null;
  const r = (readJson(rel) as { resynthesis?: Resynthesis }).resynthesis;
  return r ?? null;
}

export function resynthesisFor(lang: string, clipId: string, declared: Resynthesis | null = loadResynthesis(lang)): SynthesisOverride | null {
  return declared !== null && declared.clips.includes(clipId) ? declared.piper : null;
}

/** Shape problems of a declared re-synthesis (pure; tested). */
export function resynthesisProblems(r: Resynthesis | null): string[] {
  if (r === null) return [];
  const problems: string[] = [];
  const inRange = (x: unknown) => typeof x === "number" && x > 0 && x <= 1.5;
  if (!r.reason?.trim()) problems.push("resynthesis: a reason is required");
  if (!inRange(r.piper?.noiseScale) || !inRange(r.piper?.noiseW)) problems.push("resynthesis: piper.noiseScale and piper.noiseW must be numbers in (0, 1.5]");
  if (!Array.isArray(r.clips) || r.clips.length === 0) problems.push("resynthesis: clips must list at least one clip id");
  else if (new Set(r.clips).size !== r.clips.length) problems.push("resynthesis: clips repeats a clip id");
  for (const id of r.clips ?? []) if (id.includes(".story.")) problems.push(`resynthesis: ${id} — story sentences are not re-synthesised this way`);
  return problems;
}

const synthesisTag = (s: SynthesisOverride) => `piper-noise=${s.noiseScale},${s.noiseW}`;

const ENGINES_REL = "content/audio/engines.json";
const PACK_MANIFEST_REL = "content/audio/pack-audio-manifest.json";

/** The Kokoro phoneme front-end of a language (engines.json `kokoro.phonemeFrontends`), or null. */
export function phonemeFrontendSpec(lang: string): PhonemeFrontendSpec | null {
  const doc = readJson(ENGINES_REL) as { engines?: { kokoro?: { phonemeFrontends?: Record<string, PhonemeFrontendSpec> } } };
  return doc.engines?.kokoro?.phonemeFrontends?.[lang] ?? null;
}

/** Problems of a declared front-end (pure; tested): a positive integer version and a sha256. */
export function phonemeFrontendProblems(lang: string, spec: PhonemeFrontendSpec | null): string[] {
  if (spec === null) return [];
  const at = `content/audio/engines.json kokoro.phonemeFrontends.${lang}`;
  const problems: string[] = [];
  if (spec.id !== "course-readings") problems.push(`${at}.id must be "course-readings"`);
  if (!Number.isInteger(spec.version) || spec.version < 1) problems.push(`${at}.version must be a positive integer`);
  if (typeof spec.inputsSha256 !== "string" || !/^[0-9a-f]{64}$/.test(spec.inputsSha256)) problems.push(`${at}.inputsSha256 must be a sha256 (64 hex digits)`);
  return problems;
}

/** The tag a front-end puts into the key: id and version (never the hash, which only guards the version). */
export const phonemeFrontendTag = (spec: PhonemeFrontendSpec) => `phonemes=${spec.id}-v${spec.version}`;

/** Front-end tag of a clip spoken by a voice of `engine` (Kokoro voices only), or null. */
export function frontendRecipeForEngine(lang: string, engine: string, spec: PhonemeFrontendSpec | null = phonemeFrontendSpec(lang)): string | null {
  return spec !== null && engine === "kokoro" ? phonemeFrontendTag(spec) : null;
}

/** Engine of each voice the language's manifests declare (its reception manifest first, then the pack manifest). */
function voiceEngines(lang: string, voiceIds: readonly string[]): (string | undefined)[] {
  const found = new Map<string, string>();
  for (const rel of [voiceManifestRel(lang), PACK_MANIFEST_REL]) {
    if (voiceIds.every((id) => found.has(id)) || !existsSync(safeResolve(rel))) continue;
    for (const v of (readJson(rel) as { voices?: { id: string; engine: string }[] }).voices ?? []) if (!found.has(v.id)) found.set(v.id, v.engine);
  }
  return voiceIds.map((id) => found.get(id));
}

/** Front-end tag of a reception clip or story sentence: present when one of its voices is a Kokoro voice of a front-end language. */
export function frontendRecipeForVoices(lang: string, voiceIds: readonly string[], spec: PhonemeFrontendSpec | null = phonemeFrontendSpec(lang)): string | null {
  if (spec === null) return null;
  return voiceEngines(lang, voiceIds).some((e) => e === "kokoro") ? phonemeFrontendTag(spec) : null;
}

const joinRecipe = (parts: (string | null)[]) => {
  const present = parts.filter((p): p is string => p !== null);
  return present.length === 0 ? null : present.join("|");
};

/** Recipe tag of a pack/lexicon clip (null: the default recipe, key unchanged). */
export function packClipRecipe(input: { language: string; engine: string; text: string; pipelineVersion: number; synthesis: SynthesisOverride | null }): string | null {
  const shortWord = input.engine === "piper" && input.pipelineVersion >= SHORT_WORD_RECIPE_FROM_VERSION && isShortTranscript(input.text) ? SHORT_WORD_RECIPE : null;
  return joinRecipe([frontendRecipeForEngine(input.language, input.engine), shortWord, input.synthesis === null ? null : synthesisTag(input.synthesis)]);
}

/** Recipe tag of a listening clip: a phoneme front-end and a declared re-synthesis change it. */
export function receptionClipRecipe(lang: string, clipId: string, voiceIds: readonly string[], declared: Resynthesis | null = loadResynthesis(lang)): string | null {
  const s = resynthesisFor(lang, clipId, declared);
  return joinRecipe([frontendRecipeForVoices(lang, voiceIds), s === null ? null : synthesisTag(s)]);
}

/** Recipe tag of a story sentence: a phoneme front-end and the codec (an mp3 sentence of a language without front-end keeps its key). */
export function storyClipRecipe(lang: string, voiceIds: readonly string[], codec: AudioCodec, enc: CodecSettings | undefined): string | null {
  return joinRecipe([frontendRecipeForVoices(lang, voiceIds), codecRecipe(codec, enc)]);
}

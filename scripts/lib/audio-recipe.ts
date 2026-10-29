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
 */

import { existsSync } from "fs";

import { isShortTranscript } from "./piper-audio";
import { readJson, safeResolve } from "./pipeline";

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

/** Recipe tag of a pack/lexicon clip (null: the default recipe, key unchanged). */
export function packClipRecipe(input: { engine: string; text: string; pipelineVersion: number; synthesis: SynthesisOverride | null }): string | null {
  const parts: string[] = [];
  if (input.engine === "piper" && input.pipelineVersion >= SHORT_WORD_RECIPE_FROM_VERSION && isShortTranscript(input.text)) parts.push(SHORT_WORD_RECIPE);
  if (input.synthesis !== null) parts.push(synthesisTag(input.synthesis));
  return parts.length === 0 ? null : parts.join("|");
}

/** Recipe tag of a reception clip: only a declared re-synthesis changes it. */
export function receptionClipRecipe(lang: string, clipId: string, declared: Resynthesis | null = loadResynthesis(lang)): string | null {
  const s = resynthesisFor(lang, clipId, declared);
  return s === null ? null : synthesisTag(s);
}

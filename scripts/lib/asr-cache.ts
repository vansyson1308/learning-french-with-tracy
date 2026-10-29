/**
 * Incremental ASR/QA cache (QC 2026-10-29b §3.2).
 *
 * The ASR audit is the slow step of an audio run (Whisper medium: 1–2.5 h
 * for a language). Its result for a clip depends only on the clip's bytes,
 * the recogniser and its scoring configuration, and the transcript it is
 * scored against, so it is cached under
 *
 *   sha256( sha256(clip bytes) ‖ model id ‖ transcript )
 *
 * where the model id names the recogniser and its pinned version, the
 * language, the plan's ASR normalisation spec and the audit script itself.
 * Any change to one of them is a miss; a one-clip fix re-audits one clip.
 *
 * Store: one JSON file per key under a cache directory that the audio
 * workflow restores and saves with actions/cache (key per language + model).
 * Entries are immutable; nothing is ever written for a clip whose file is
 * missing or whose transcription failed.
 */

import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

import { assetFileName, type AudioCodec } from "./audio-codec";

export type AsrResult = { text: string; wer: number; metric?: string; model?: string; engine?: string };
export type AsrPlanClip = { clipId: string; assetKey: string; text: string; codec?: AudioCodec };
export type AsrPlan = { language: string; normalization: unknown; clips: AsrPlanClip[] };
type CacheEntry = { key: string; modelId: string; transcript: string; result: AsrResult };

const sha256 = (data: string | Uint8Array) => createHash("sha256").update(data).digest("hex");

/** The cache key of one clip (unambiguous: the bytes enter as their own digest). */
export function asrCacheKey(bytes: Uint8Array, modelId: string, transcript: string): string {
  return sha256(`${sha256(bytes)}\n${JSON.stringify([modelId, transcript])}`);
}

/** The model id: recogniser + pinned version, language, scoring spec, audit script digest. */
export function asrModelId(input: { recognizer: string; language: string; normalization: unknown; auditScript: Uint8Array | string }): string {
  return `${input.recognizer}|lang=${input.language}|norm=${sha256(JSON.stringify(input.normalization ?? null)).slice(0, 16)}|audit=${sha256(input.auditScript).slice(0, 16)}`;
}

function entryPath(cacheDir: string, key: string): string {
  return path.join(cacheDir, key.slice(0, 2), `${key}.json`);
}

function clipFile(outdir: string, clip: AsrPlanClip): string {
  return path.join(outdir, assetFileName(clip.assetKey, clip.codec));
}

/** The key of a clip whose file exists, else null (never cached). */
function keyOf(outdir: string, clip: AsrPlanClip, modelId: string): string | null {
  const file = clipFile(outdir, clip);
  return existsSync(file) ? asrCacheKey(readFileSync(file), modelId, clip.text) : null;
}

function readEntry(cacheDir: string, key: string, modelId: string, transcript: string): AsrResult | null {
  const p = entryPath(cacheDir, key);
  if (!existsSync(p)) return null;
  try {
    const e = JSON.parse(readFileSync(p, "utf8")) as CacheEntry;
    // The key already binds these; a mismatch means a corrupt or foreign file — treat as a miss.
    if (e.key !== key || e.modelId !== modelId || e.transcript !== transcript || typeof e.result?.wer !== "number") return null;
    return e.result;
  } catch {
    return null;
  }
}

/**
 * Splits a plan into cached results and the clips that still need ASR. The
 * returned `todo` plan keeps the plan's other fields, so the audit script
 * reads it unchanged.
 */
export function splitPlanByCache<P extends AsrPlan>(input: { plan: P; outdir: string; cacheDir: string; modelId: string }): { hits: Record<string, AsrResult>; todo: P; stats: { clips: number; hits: number; misses: number } } {
  const hits: Record<string, AsrResult> = {};
  const todo: AsrPlanClip[] = [];
  for (const clip of input.plan.clips) {
    const key = keyOf(input.outdir, clip, input.modelId);
    const cached = key === null ? null : readEntry(input.cacheDir, key, input.modelId, clip.text);
    if (cached !== null) hits[clip.clipId] = cached;
    else todo.push(clip);
  }
  return { hits, todo: { ...input.plan, clips: todo }, stats: { clips: input.plan.clips.length, hits: Object.keys(hits).length, misses: todo.length } };
}

/**
 * Cached + fresh results for every plan clip (plan order); stores each fresh
 * result that comes from a real transcription (it names its model) of an
 * existing file. Returns the merged results and the number of entries written.
 */
export function mergeAsrResults(input: { plan: AsrPlan; outdir: string; cacheDir: string; modelId: string; hits: Record<string, AsrResult>; fresh: Record<string, AsrResult> }): { results: Record<string, AsrResult>; written: number } {
  const results: Record<string, AsrResult> = {};
  let written = 0;
  for (const clip of input.plan.clips) {
    const fresh = input.fresh[clip.clipId];
    const result = fresh ?? input.hits[clip.clipId];
    if (result === undefined) continue;
    results[clip.clipId] = result;
    if (fresh === undefined || !fresh.model) continue;
    const key = keyOf(input.outdir, clip, input.modelId);
    if (key === null) continue;
    const p = entryPath(input.cacheDir, key);
    if (existsSync(p)) continue;
    mkdirSync(path.dirname(p), { recursive: true });
    const entry: CacheEntry = { key, modelId: input.modelId, transcript: clip.text, result: fresh };
    writeFileSync(p, `${JSON.stringify(entry)}\n`);
    written += 1;
  }
  return { results, written };
}

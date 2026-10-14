/**
 * Tatoeba adapter (P3a): per-language "detailed" sentence exports
 * (`id \t lang \t text \t username \t date_added \t date_modified`) and
 * link exports (`source_id \t target_id`). Used only as the example
 * fallback when a kaikki sense carries no usable example; every chosen
 * sentence keeps its id and contributor username for CC BY attribution
 * (derived/tatoeba-credits.json).
 */

import { readLines } from "../jsonl";

export type TatoebaSentence = { id: number; text: string; username: string };

/** Read the sentences whose text passes `keep` (streamed; the English export is ~1.8 M lines). */
export async function readTatoebaSentences(
  path: string,
  keep: (text: string) => boolean,
  keepIds?: ReadonlySet<number>
): Promise<Map<number, TatoebaSentence>> {
  const out = new Map<number, TatoebaSentence>();
  for await (const line of readLines(path)) {
    const parts = line.split("\t");
    if (parts.length < 3) continue;
    const id = Number(parts[0]);
    if (!Number.isFinite(id)) continue;
    if (keepIds && !keepIds.has(id)) continue;
    const text = parts[2];
    if (!keepIds && !keep(text)) continue;
    out.set(id, { id, text, username: parts[3] && parts[3] !== "\\N" ? parts[3] : "" });
  }
  return out;
}

/** Read `source → targets` links restricted to known source ids. */
export async function readTatoebaLinks(path: string, sourceIds: ReadonlySet<number>): Promise<Map<number, number[]>> {
  const out = new Map<number, number[]>();
  for await (const line of readLines(path)) {
    const tab = line.indexOf("\t");
    if (tab <= 0) continue;
    const a = Number(line.slice(0, tab));
    const b = Number(line.slice(tab + 1));
    if (!Number.isFinite(a) || !Number.isFinite(b) || !sourceIds.has(a)) continue;
    const list = out.get(a);
    if (list) list.push(b);
    else out.set(a, [b]);
  }
  return out;
}

/** A short, plain learner sentence: one clause-ish, no quotes, bounded length. */
export function isLearnerSentence(text: string, maxChars = 70): boolean {
  if (text.length < 8 || text.length > maxChars) return false;
  if (/["«»“”()[\]{}<>]|https?:|\n/.test(text)) return false;
  return true;
}

/**
 * Frequency adapters (P3a): hermitdave/FrequencyWords (`word count` per
 * line, OpenSubtitles 2018; the primary measurement) and wordfreq
 * (`word,zipf` CSV exported at acquisition time; secondary). Both are
 * word-FORM lists: lemmatisation happens in the derivation through the
 * kaikki form-of index, never by guessing.
 */

import { readLines } from "../jsonl";

export type FrequencyRow = { word: string; count: number; rank: number; perMillion: number };

export type FrequencyList = {
  rows: FrequencyRow[];
  byWord: Map<string, FrequencyRow>;
  /** Sum of the counts of the list (the per-million denominator — the list, not the corpus). */
  total: number;
};

/** Parse a FrequencyWords list; ranks follow file order; per-million is relative to the list total. */
export async function readFrequencyWords(path: string): Promise<FrequencyList> {
  const raw: { word: string; count: number }[] = [];
  for await (const line of readLines(path)) {
    const t = line.trim();
    if (t === "") continue;
    const sp = t.lastIndexOf(" ");
    if (sp <= 0) continue;
    const word = t.slice(0, sp);
    const count = Number(t.slice(sp + 1));
    if (!Number.isFinite(count) || count <= 0) continue;
    raw.push({ word, count });
  }
  const total = raw.reduce((n, r) => n + r.count, 0);
  const rows: FrequencyRow[] = raw.map((r, i) => ({ word: r.word, count: r.count, rank: i + 1, perMillion: (r.count / total) * 1e6 }));
  const byWord = new Map<string, FrequencyRow>();
  for (const r of rows) if (!byWord.has(r.word)) byWord.set(r.word, r);
  return { rows, byWord, total };
}

/** Parse the wordfreq export (`word,zipf` with a header line). */
export async function readWordfreqCsv(path: string): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  let first = true;
  for await (const line of readLines(path)) {
    if (first) {
      first = false;
      if (/^word,zipf/i.test(line)) continue;
    }
    const comma = line.lastIndexOf(",");
    if (comma <= 0) continue;
    const word = line.slice(0, comma);
    const zipf = Number(line.slice(comma + 1));
    if (!Number.isFinite(zipf)) continue;
    if (!out.has(word)) out.set(word, zipf);
  }
  return out;
}

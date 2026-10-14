/**
 * Exam / CEFR anchor adapters (P3a): OpenJLPT (ja, N5/N4 levels), HSK 3.0
 * (zh, levels 1–6 + 7-9), CEFR-J (en, A1–B2 per headword+pos), NGSL (en,
 * rank). Each returns `lemma → level label` facts; no source text ships.
 */

import { readFileSync } from "fs";

/** Minimal CSV parser (quoted fields, commas, CRLF). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

export type AnchorTable = {
  source: string;
  /** lemma (or word form) → level label (`N5`, `HSK1`, `A1`, …). */
  levels: Map<string, string>;
  /** Optional reading per word (JLPT kana) for disambiguation. */
  readings?: Map<string, string>;
  /** Optional rank per word (NGSL). */
  ranks?: Map<string, number>;
};

/** OpenJLPT: data/csv/vocab-n5.csv … vocab-n1.csv (`word,reading,meanings,level,…`). */
export function readOpenJlpt(dir: string, levels: string[] = ["n5", "n4", "n3", "n2", "n1"]): AnchorTable {
  const out = new Map<string, string>();
  const readings = new Map<string, string>();
  for (const level of levels) {
    const rows = parseCsv(readFileSync(`${dir}/data/csv/vocab-${level}.csv`, "utf8"));
    const header = rows[0] ?? [];
    const wi = header.indexOf("word");
    const ri = header.indexOf("reading");
    const li = header.indexOf("level");
    for (const r of rows.slice(1)) {
      const word = r[wi]?.trim();
      if (!word) continue;
      const label = (r[li] ?? level).toUpperCase();
      // Lower level wins when a word appears twice (lists are cumulative in places).
      if (!out.has(word)) out.set(word, label);
      const reading = r[ri]?.trim();
      if (reading && !readings.has(word)) readings.set(word, reading);
    }
  }
  return { source: "openjlpt", levels: out, readings };
}

/** ivankra/hsk30.csv: `ID,Simplified,Traditional,Pinyin,POS,Level,…`. */
export function readHsk30(path: string): AnchorTable {
  const rows = parseCsv(readFileSync(path, "utf8"));
  const header = rows[0] ?? [];
  const si = header.indexOf("Simplified");
  const li = header.indexOf("Level");
  const out = new Map<string, string>();
  for (const r of rows.slice(1)) {
    const word = r[si]?.trim();
    const level = r[li]?.trim();
    if (!word || !level) continue;
    if (!out.has(word)) out.set(word, `HSK${level}`);
  }
  return { source: "hsk30", levels: out };
}

/** CEFR-J vocabulary profile 1.5: `headword,pos,CEFR,…`; several headword variants separated by `/`. */
export function readCefrJ(path: string): AnchorTable {
  const rows = parseCsv(readFileSync(path, "utf8"));
  const header = rows[0] ?? [];
  const hi = header.indexOf("headword");
  const pi = header.indexOf("pos");
  const li = header.indexOf("CEFR");
  const out = new Map<string, string>();
  const order = ["A1", "A2", "B1", "B2", "C1", "C2"];
  for (const r of rows.slice(1)) {
    const level = r[li]?.trim();
    if (!level) continue;
    for (const variant of (r[hi] ?? "").split("/")) {
      const word = variant.trim();
      if (!word) continue;
      const key = `${word}|${(r[pi] ?? "").trim()}`;
      const prev = out.get(key);
      if (!prev || order.indexOf(level) < order.indexOf(prev)) out.set(key, level);
      const bare = out.get(word);
      if (!bare || order.indexOf(level) < order.indexOf(bare)) out.set(word, level);
    }
  }
  return { source: "cefr-j", levels: out };
}

/** NGSL 1.2 stats: `Lemma,SFI Rank,SFI,Adjusted Frequency per Million (U)`. */
export function readNgsl(path: string): AnchorTable {
  const rows = parseCsv(readFileSync(path, "utf8"));
  const header = rows[0] ?? [];
  const li = header.findIndex((h) => /^lemma$/i.test(h.trim()));
  const ri = header.findIndex((h) => /rank/i.test(h));
  const ranks = new Map<string, number>();
  const levels = new Map<string, string>();
  for (const r of rows.slice(1)) {
    const lemma = r[li]?.trim().toLowerCase();
    const rank = Number(r[ri]);
    if (!lemma || !Number.isFinite(rank)) continue;
    if (!ranks.has(lemma)) {
      ranks.set(lemma, rank);
      levels.set(lemma, rank <= 1000 ? "NGSL-1k" : rank <= 2000 ? "NGSL-2k" : "NGSL-3k");
    }
  }
  return { source: "ngsl", levels, ranks };
}

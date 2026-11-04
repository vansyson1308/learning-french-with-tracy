/**
 * Build helper of ko-lex.py (P4e session 1): the Revised Romanization of each course word from the project's own rule
 * set (scripts/lib/cjk-readings/korean-rr.ts, P4b), and the Hán-Việt check of hanviet-ko.txt (scripts/lib/hanviet.ts).
 * No data source and no guess: a pool lemma keeps the reading P4b confirmed against Wiktionary
 * (derived/lexeme-readings.json); any other word gets the rule output, and a disagreement with the pool's Wiktionary
 * romanization is reported for review.
 *
 * usage: bun content/ko/_drafts/_generators/ko-readings.ts <in.json> <out.json>
 *   in:  { words: [{ surface, pos, rrSpelling? }], hanviet: [{ word, hanja, reading, note? }] }
 *   out: { words: { "<surface>|<pos>": { rr, rrSpelling?, basis, wiktionary? , disagreement? } },
 *          hanviet: { "<word>": { errors, unconfirmed } } }
 */
import { existsSync, readFileSync, writeFileSync } from "fs";

import { foldRomanization } from "../../../../scripts/lib/cjk-readings/derive";
import { romanizeKorean, stripRrBoundaries } from "../../../../scripts/lib/cjk-readings/korean-rr";
import { checkEntry, loadUnihanReadings, type HanVietEntry } from "../../../../scripts/lib/hanviet";
import { UnihanReadingsSchema } from "../../../../scripts/lib/hanviet-unihan";

type InWord = { surface: string; pos: string; rrSpelling?: string };
type In = { words: InWord[]; hanviet: HanVietEntry[] };
type Stored = { rr: string; rrSpelling?: string };

const [inPath, outPath] = process.argv.slice(2);
if (inPath === undefined || outPath === undefined) {
  console.error("usage: ko-readings.ts <in.json> <out.json>");
  process.exit(2);
}
const input = JSON.parse(readFileSync(inPath, "utf8")) as In;
const confirmed = (JSON.parse(readFileSync("content/ko/lexicon/derived/lexeme-readings.json", "utf8")) as { readings: Record<string, Stored> }).readings;
const pool = (JSON.parse(readFileSync("content/ko/lexicon/derived/candidate-pool.json", "utf8")) as {
  entries: { lemma: string; partOfSpeech: string; readings?: { romanization?: string } }[];
}).entries;
const wiktionary = new Map<string, string>();
for (const e of pool) {
  const r = e.readings?.romanization;
  if (r !== undefined && !wiktionary.has(`${e.lemma}|${e.partOfSpeech}`)) wiktionary.set(`${e.lemma}|${e.partOfSpeech}`, r);
}

const words: Record<string, Stored & { basis: "pool-confirmed" | "rule"; wiktionary?: string; disagreement?: string }> = {};
for (const w of input.words) {
  const key = `${w.surface}|${w.pos}`;
  const noun = w.pos === "noun";
  const spelling = w.rrSpelling ?? w.surface;
  if (stripRrBoundaries(spelling) !== w.surface) throw new Error(`${key}: rrSpelling ${spelling} does not spell the surface`);
  const own = { rr: romanizeKorean(spelling, { noun }), ...(w.rrSpelling !== undefined ? { rrSpelling: w.rrSpelling } : {}) };
  const p = confirmed[key];
  if (p !== undefined && w.rrSpelling === undefined) {
    words[key] = { ...p, basis: "pool-confirmed" };
    continue;
  }
  const wk = wiktionary.get(key);
  const entry: (typeof words)[string] = { ...own, basis: "rule", ...(wk !== undefined ? { wiktionary: wk } : {}) };
  if (wk !== undefined && foldRomanization(own.rr) !== foldRomanization(wk)) entry.disagreement = `rule "${own.rr}" vs Wiktionary "${wk}"`;
  words[key] = entry;
}

// The Unihan subset re-derived with the ko-vi hanja lives in the staged layer until promote (P4e session 1).
const STAGED_UNIHAN = "content/ko/_drafts/staged/content/hanviet/unihan-readings.json";
const unihan = existsSync(STAGED_UNIHAN) ? UnihanReadingsSchema.parse(JSON.parse(readFileSync(STAGED_UNIHAN, "utf8"))) : loadUnihanReadings();
const hanviet: Record<string, { errors: string[]; unconfirmed: string[] }> = {};
for (const e of input.hanviet) hanviet[e.word] = checkEntry("ko", e, unihan);

writeFileSync(outPath, `${JSON.stringify({ words, hanviet }, null, 1)}\n`);

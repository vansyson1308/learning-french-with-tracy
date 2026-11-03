/**
 * Hán-Việt (Sino-Vietnamese) readings for Vietnamese learners of Japanese,
 * Chinese and Korean (P4b stage 2, QC 2026-11-03 §2). Pure lookup over the
 * compiled tables (src/content/hanviet/*.json, generated from the authored
 * and Unihan-checked content/hanviet/*.json): a reading exists only for
 * Sino-Vietnamese words — ja kanji compounds read with on'yomi, zh hanzi
 * words, ko Sino-Korean words (looked up by hangul or by hanja). Native
 * Japanese kun words, native Korean words and loanwords have no entry, so
 * they get null: the reading is shown only where it helps.
 */
import jaTable from "../../content/hanviet/ja.json";
import koTable from "../../content/hanviet/ko.json";
import zhTable from "../../content/hanviet/zh.json";

type Row = { reading: string; kana?: string; hanja?: string };
type Table = { language: string; readings: Record<string, Row> };

export type HanVietLanguage = "ja" | "zh" | "ko";

function index(table: Table, byHanja: boolean): ReadonlyMap<string, Row> {
  const entries = Object.entries(table.readings);
  const extra = byHanja ? entries.flatMap(([, row]) => (row.hanja ? [[row.hanja, row] as const] : [])) : [];
  return new Map([...entries, ...extra]);
}

const TABLES: Readonly<Record<HanVietLanguage, ReadonlyMap<string, Row>>> = {
  ja: index(jaTable as Table, false),
  zh: index(zhTable as Table, false),
  ko: index(koTable as Table, true),
};

export function hasHanViet(lang: string): lang is HanVietLanguage {
  return lang === "ja" || lang === "zh" || lang === "ko";
}

/**
 * The Hán-Việt reading of `word` in `lang` (学生 → "học sinh", 학생 or
 * 學生 → "học sinh"), or null when the word is not a listed Sino-Vietnamese
 * word. For Japanese, pass the word's kana when known: a spelling that is
 * also read natively (e.g. a kun reading of the same kanji) then gets null.
 */
export function hanVietFor(lang: string, word: string, opts: { kana?: string } = {}): string | null {
  if (!hasHanViet(lang)) return null;
  const row = TABLES[lang].get(word.normalize("NFC").trim());
  if (row === undefined) return null;
  if (opts.kana !== undefined && row.kana !== undefined && opts.kana !== row.kana) return null;
  return row.reading;
}

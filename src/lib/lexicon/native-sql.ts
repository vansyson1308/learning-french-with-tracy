/**
 * The exact SQL the native repository runs, kept pure so build-time tests
 * execute the SAME statements against the committed database with
 * bun:sqlite (no device needed) and assert parity with the web fallback.
 *
 * Every statement takes bound parameters — user input is never
 * concatenated into SQL. The FTS match string is built exclusively from
 * sanitized tokens (letters/digits only, see searchTokens) with a `*`
 * prefix operator per token, and even that string is bound, not inlined.
 */

import { rankMatches, searchTokens } from "../learning/lexicon-search";
import type { LexemeDetail, LexemeExample, LexemeSummary } from "./types";

export const SQL = {
  byId: `SELECT id, ord, surface, lookup_form, lemma, pos, gender, gloss, topic,
      ipa, ipa_notation, freq_band, freq_rank, freq_per_million
    FROM lexemes WHERE id = ?`,
  /** Candidate ids for a search, via FTS5 (AND semantics over prefix tokens). */
  searchCandidates: `SELECT id FROM lexeme_fts WHERE lexeme_fts MATCH ?`,
  /** Hydrate summaries+folded fields for ranking; id list is expanded to bound placeholders. */
  rowsByIds: (count: number) =>
    `SELECT id, ord, surface, lookup_form, lemma, pos, gender, gloss, topic, freq_band
     FROM lexemes WHERE id IN (${Array.from({ length: count }, () => "?").join(", ")})`,
  listBase: `SELECT id, ord, surface, lookup_form, lemma, pos, gender, gloss, topic, freq_band
    FROM lexemes`,
  listWherePos: ` WHERE pos = ?`,
  orderCourse: ` ORDER BY ord`,
  // sort_key is the accent/ligature-folded lookup form, precomputed at
  // build time — deterministic on every platform, no locale/ICU variance.
  orderAlpha: ` ORDER BY sort_key, ord`,
  // Raw per-million frequency is the sort key: it is meaningful for every
  // measured entry, while the population rank is absent for categories
  // outside the ranked population (e.g. merci, ONO). Unmeasured entries
  // sink to the end in course order.
  orderFrequency: ` ORDER BY (freq_per_million IS NULL), freq_per_million DESC, ord`,
  examples: `SELECT fr, en FROM examples WHERE lexeme_id = ? ORDER BY ordinal`,
  confusables: `SELECT target_id FROM relations WHERE lexeme_id = ? AND rel_type = 'confusable' ORDER BY target_id`,
  // Authored order (ord) is the cross-tier contract — the generated tier
  // returns refs in authored order, so the SQL tier must too.
  sourceRefs: `SELECT source_id, match_key FROM lexeme_sources WHERE lexeme_id = ? ORDER BY ord`,
  anyFrequency: `SELECT COUNT(*) AS n FROM lexemes WHERE freq_band IS NOT NULL`,
} as const;

/** FTS5 match string from sanitized tokens: `tok1* tok2* …`. */
export function ftsMatchString(tokens: string[]): string {
  return tokens.map((t) => `${t}*`).join(" ");
}

export type LexemeRow = {
  id: string;
  ord: number;
  surface: string;
  lookup_form: string;
  lemma: string;
  pos: string;
  gender: string | null;
  gloss: string;
  topic: string | null;
  freq_band: string | null;
};

export type LexemeDetailRow = LexemeRow & {
  ipa: string | null;
  ipa_notation: string | null;
  freq_rank: number | null;
  freq_per_million: number | null;
};

export function rowToSummary(row: LexemeRow): LexemeSummary {
  return {
    id: row.id,
    surface: row.surface,
    gloss: row.gloss,
    pos: row.pos,
    ...(row.gender !== null ? { gender: row.gender } : {}),
    ...(row.topic !== null ? { topic: row.topic } : {}),
    ...(row.freq_band !== null ? { band: row.freq_band } : {}),
  };
}

export function rowToDetail(
  row: LexemeDetailRow,
  examples: LexemeExample[],
  confusables: string[],
  sourceRefs: { source: string; key?: string }[]
): LexemeDetail {
  return {
    ...rowToSummary(row),
    lemma: row.lemma,
    lookupForm: row.lookup_form,
    ...(row.ipa !== null && row.ipa_notation !== null
      ? { pronunciation: { value: row.ipa, notation: row.ipa_notation } }
      : {}),
    ...(row.freq_band !== null && row.freq_per_million !== null
      ? {
          frequency: {
            band: row.freq_band,
            ...(row.freq_rank !== null ? { rank: row.freq_rank } : {}),
            perMillion: row.freq_per_million,
          },
        }
      : {}),
    examples,
    ...(confusables.length > 0 ? { confusables } : {}),
    sourceRefs,
  };
}

/** Fields the shared ranker needs, derived from a hydrated row. */
export function rowToSearchable(row: LexemeRow): { surface: string; lemma: string; gloss: string; ord: number } {
  return { surface: row.surface, lemma: row.lemma, gloss: row.gloss, ord: row.ord };
}

/* ------------------------------------------------------------------ */
/* Executor-agnostic query pipelines                                    */
/* ------------------------------------------------------------------ */
/**
 * The native repository and the build-time parity tests run the SAME
 * pipeline; only the row executor differs (expo-sqlite on device,
 * bun:sqlite in tests). This is what makes the parity suite test the real
 * shipped logic instead of a reimplementation.
 */

export type SqlExecutor = {
  all: <T>(sql: string, params: (string | number)[]) => Promise<T[]>;
  first: <T>(sql: string, params: (string | number)[]) => Promise<T | null>;
};

export async function runNativeSearch(exec: SqlExecutor, query: string): Promise<LexemeSummary[]> {
  const tokens = searchTokens(query);
  if (tokens.length === 0) return [];
  const candidates = await exec.all<{ id: string }>(SQL.searchCandidates, [ftsMatchString(tokens)]);
  if (candidates.length === 0) return [];
  const ids = candidates.map((c) => c.id);
  const rows = await exec.all<LexemeRow>(SQL.rowsByIds(ids.length), ids);
  const ranked = rankMatches(
    rows.map((row) => ({ ...rowToSearchable(row), row })),
    tokens
  );
  return ranked.map((r) => rowToSummary(r.row));
}

export async function runNativeList(
  exec: SqlExecutor,
  options?: { sort?: "course" | "alpha" | "frequency"; pos?: string }
): Promise<LexemeSummary[]> {
  const sort = options?.sort ?? "course";
  const order =
    sort === "alpha" ? SQL.orderAlpha : sort === "frequency" ? SQL.orderFrequency : SQL.orderCourse;
  const where = options?.pos !== undefined ? SQL.listWherePos : "";
  const params = options?.pos !== undefined ? [options.pos] : [];
  const rows = await exec.all<LexemeRow>(`${SQL.listBase}${where}${order}`, params);
  return rows.map(rowToSummary);
}

export async function runNativeGetById(exec: SqlExecutor, id: string): Promise<LexemeDetail | null> {
  const row = await exec.first<LexemeDetailRow>(SQL.byId, [id]);
  if (!row) return null;
  const [examples, confusables, refs] = await Promise.all([
    exec.all<LexemeExample>(SQL.examples, [id]),
    exec.all<{ target_id: string }>(SQL.confusables, [id]),
    exec.all<{ source_id: string; match_key: string | null }>(SQL.sourceRefs, [id]),
  ]);
  return rowToDetail(
    row,
    examples,
    confusables.map((r) => r.target_id),
    refs.map((r) => ({ source: r.source_id, ...(r.match_key !== null ? { key: r.match_key } : {}) }))
  );
}

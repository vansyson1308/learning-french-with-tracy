/**
 * Synthetic scale, build side (D-15 §7, plan/10-LADDER-A1-C2.md §7): the
 * lexicon compiler and the native search pipeline hold a C2-sized language
 * — 12,000 lexemes — within explicit budgets. The rich lexicon is generated
 * in memory from the seeded test helper (src/lib/__tests__/helpers/
 * synthetic-scale.ts; never content, never written under content/ or
 * src/content/) and compiled with the REAL builders:
 *   - text artifacts: the runtime index + web fallback (and they match what
 *     the runtime test feeds the app, so both halves test one course);
 *   - the SQLite database, built into a temp dir;
 *   - the EXACT native search pipeline (runNativeSearch) over ~30 queries,
 *     including one-letter prefixes whose FTS hits span thousands of rows,
 *     with web-tier parity on every query.
 * Budgets are set for GitHub's ubuntu runners (~2× slower than a dev
 * laptop) and are each ≥ 4× the post-fix laptop measurement, yet an
 * accidental O(n²) over 12,000 lexemes blows them.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync } from "fs";
import os from "os";
import path from "path";

import type { RichLexicon, SourceRegistry } from "../../content/schema";
import {
  GeneratedLexiconRepository,
  type GeneratedLexiconData,
} from "../../src/lib/lexicon/generated-repository";
import { runNativeSearch, type SqlExecutor } from "../../src/lib/lexicon/native-sql";
import {
  SCALE_LEXEMES,
  SCALE_NATIVE,
  SCALE_SOURCE_ID,
  SCALE_TARGET,
  percentile,
  syntheticLexemes,
  syntheticLexiconIndex,
  syntheticQueries,
  syntheticWebFallback,
  type SyntheticLexeme,
} from "../../src/lib/__tests__/helpers/synthetic-scale";
import { buildPlugin } from "../lib/languages";
import { buildRuntimeIndex, buildSqliteDb, buildWebFallback, lexiconContentHash, verifySqliteDb } from "../lib/lexicon-build";
import { removeTempDirSync } from "../lib/pipeline";

// Dev-laptop measurements (Windows, bun 1.4.3, 2026-11-03), before → after
// the D-15 §7 fixes, on a shared machine:
//   text artifacts  3,731 ms → 94–204 ms (buildRuntimeIndex scanned every
//                   lexeme for regional variants of every lexeme: O(n²));
//   DB build        1,006,534 ms (16.8 min: every INSERT its own fsynced
//                   autocommit) → 0.6–1.1 s in one transaction;
//   FTS search      p95 206 ms (one bound `?` per FTS hit, a fresh statement
//                   per query, every hydrated row re-folded) → 29–37 ms.
// Eight of the ~30 queries are one/two-letter or "the" prefixes that
// hydrate 3,000–9,000 rows each, so the p95 IS a broad query: ~20–30 ms of
// row materialisation locally — the FTS budget leaves ≥ 4× for CI.
const BUDGET = {
  textArtifactsMs: 3_000,
  dbBuildMs: 10_000,
  ftsSearchP95Ms: 150,
};

function toRich(lex: SyntheticLexeme): RichLexicon["lexemes"][number] {
  return {
    id: lex.id,
    surface: lex.surface,
    ...(lex.legacySurfaces !== undefined ? { legacySurfaces: [...lex.legacySurfaces] } : {}),
    lemma: lex.lemma,
    lookupForm: lex.lookupForm,
    partOfSpeech: lex.pos as RichLexicon["lexemes"][number]["partOfSpeech"],
    ...(lex.gender !== undefined ? { gender: lex.gender } : {}),
    glosses: { [SCALE_NATIVE]: lex.gloss },
    ...(lex.pronunciation !== undefined ? { pronunciation: { ...lex.pronunciation, source: SCALE_SOURCE_ID } } : {}),
    ...(lex.frequency !== undefined
      ? {
          frequency: {
            source: SCALE_SOURCE_ID,
            rawValue: lex.frequency.perMillion,
            ...(lex.frequency.rank !== undefined ? { rank: lex.frequency.rank } : {}),
            band: lex.frequency.band,
          },
        }
      : {}),
    ...(lex.topic !== undefined ? { topic: lex.topic as RichLexicon["lexemes"][number]["topic"] } : {}),
    examples: [{ target: lex.example.target, translations: { [SCALE_NATIVE]: lex.example.native }, source: SCALE_SOURCE_ID }],
    ...(lex.confusables !== undefined ? { relations: { confusables: [...lex.confusables] } } : {}),
    ...(lex.variety !== undefined ? { variety: { ...lex.variety } } : {}),
    sourceRefs: [{ source: SCALE_SOURCE_ID }],
  };
}

const lexemes = syntheticLexemes();
const lexicon: RichLexicon = { version: 1, language: SCALE_TARGET, lexemes: lexemes.map(toRich) };
const registry: SourceRegistry = {
  sources: [
    {
      id: SCALE_SOURCE_ID,
      name: "Synthetic scale language (xx)",
      kind: "test-fixture",
      license: "original",
      url: "https://example.invalid/synthetic-scale",
      attribution: "Generated in memory by the scale tests; never shipped.",
      retrievedAt: "2026-11-03",
      covers: ["src/lib/__tests__/helpers/synthetic-scale.ts"],
      testOnly: true,
    },
  ],
};
const queries = syntheticQueries(lexemes);
const dir = mkdtempSync(path.join(os.tmpdir(), "lexdb-scale-"));
const dbPath = path.join(dir, "xx-scale.db");
const measured: Record<string, string> = {};
let db: Database | null = null;
let webData: GeneratedLexiconData | null = null;

afterAll(() => {
  db?.close();
  removeTempDirSync(dir);
  console.log(`synthetic scale (build): ${Object.entries(measured).map(([k, v]) => `${k} ${v}`).join(", ")}`);
});

describe("synthetic scale: 12,000-lexeme lexicon build and native search", () => {
  test("text artifacts (runtime index + web fallback) compile within budget and match the runtime fixture", () => {
    expect(lexicon.lexemes.length).toBe(SCALE_LEXEMES);
    const started = performance.now();
    const contentHash = lexiconContentHash(lexicon, null, registry, SCALE_NATIVE);
    const index = buildRuntimeIndex(lexicon, SCALE_TARGET, SCALE_NATIVE);
    const fallback = buildWebFallback(lexicon, registry, contentHash, SCALE_TARGET, SCALE_NATIVE);
    const elapsed = performance.now() - started;
    measured.textArtifacts = `${elapsed.toFixed(0)} ms`;
    webData = fallback;
    // The runtime test feeds the app these same shapes (helper-built).
    expect(index.entries).toEqual(syntheticLexiconIndex(lexemes).entries);
    const fallbackEntries: unknown = fallback.entries;
    expect(fallbackEntries).toEqual(syntheticWebFallback(lexemes).entries);
    expect(elapsed).toBeLessThan(BUDGET.textArtifactsMs);
  }, 120_000);

  test("the SQLite database builds in a temp dir within budget and verifies", () => {
    const started = performance.now();
    buildSqliteDb(dbPath, lexicon, registry, "5ca1e5ca1e5ca1e0", { plugin: buildPlugin(SCALE_TARGET), nativeCode: SCALE_NATIVE });
    const elapsed = performance.now() - started;
    measured.dbBuild = `${elapsed.toFixed(0)} ms`;
    expect(verifySqliteDb(dbPath)).toEqual([]);
    db = new Database(dbPath, { readonly: true });
    expect(db.query<{ n: number }, []>("SELECT COUNT(*) AS n FROM lexemes").get()?.n).toBe(SCALE_LEXEMES);
    expect(elapsed).toBeLessThan(BUDGET.dbBuildMs);
  }, 120_000);

  test("native FTS search p95 over ~30 queries, one-letter prefixes included, with web-tier parity", async () => {
    if (!db || !webData) throw new Error("the build steps did not run");
    const handle = db;
    const exec: SqlExecutor = {
      all: async <T>(sql: string, params: (string | number)[]) => handle.query(sql).all(...(params as never[])) as T[],
      first: async <T>(sql: string, params: (string | number)[]) => (handle.query(sql).get(...(params as never[])) as T | undefined) ?? null,
    };
    const web = new GeneratedLexiconRepository(webData);
    const samples: number[] = [];
    const hits: Record<string, number> = {};
    for (const q of queries) {
      const started = performance.now();
      const results = await runNativeSearch(exec, q);
      samples.push(performance.now() - started);
      hits[q] = results.length;
      expect(results.map((r) => r.id)).toEqual((await web.search(q)).map((r) => r.id));
    }
    const p95 = percentile(samples, 95);
    measured.ftsSearch = `p95 ${p95.toFixed(1)} ms, max ${Math.max(...samples).toFixed(1)} ms, "t" → ${hits.t} hits`;
    expect(hits.t).toBeGreaterThan(1_000); // one-letter prefix: thousands of hits, no throw
    expect(hits.xyzzy).toBe(0);
    expect(p95).toBeLessThan(BUDGET.ftsSearchP95Ms);
  }, 120_000);
});

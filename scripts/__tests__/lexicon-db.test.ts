/**
 * Prebuilt SQLite lexicon tests (Phase 4): the committed database is
 * healthy (integrity + foreign keys), carries the right metadata and all
 * 54 lexemes, its FTS behaves as researched (accent-insensitive, ligature-
 * folded, apostrophe-separating), and the build is deterministic under the
 * logical-dump contract (never raw bytes).
 */
import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync } from "fs";
import os from "os";
import path from "path";

import { loadRichLexicon, loadSourceManifest } from "../lib/lexicon";
import {
  DB_SCHEMA_VERSION,
  buildSqliteDb,
  dbAssetName,
  lexiconContentHash,
  logicalDump,
  verifySqliteDb,
} from "../lib/lexicon-build";
import { loadRegistry, safeResolve } from "../lib/pipeline";

const lexicon = loadRichLexicon();
const manifest = loadSourceManifest();
const registry = loadRegistry();
const contentHash = lexiconContentHash(lexicon, manifest, registry);
const committedPath = safeResolve(`assets/lexicon/${dbAssetName(contentHash)}`);

function open(dbPath: string): Database {
  return new Database(dbPath, { readonly: true });
}

describe("committed lexicon database", () => {
  test("exists under the source-derived versioned name and passes integrity + FK checks", () => {
    expect(verifySqliteDb(committedPath)).toEqual([]);
  });

  test("metadata carries schema version, content hash, license and language", () => {
    const db = open(committedPath);
    const meta = Object.fromEntries(
      db.query<{ key: string; value: string }, []>("SELECT key, value FROM metadata").all()
        .map((r) => [r.key, r.value])
    );
    db.close();
    expect(meta.schemaVersion).toBe(String(DB_SCHEMA_VERSION));
    expect(meta.contentHash).toBe(contentHash);
    expect(meta.contentVersion).toBe("1");
    expect(meta.language).toBe("fr");
    expect(meta.datasetLicense).toBe("CC-BY-SA-4.0");
    expect(meta.generator).toBe("scripts/compile-content.ts");
  });

  test("user_version equals the schema version", () => {
    const db = open(committedPath);
    const v = db.query<{ user_version: number }, []>("PRAGMA user_version").get();
    db.close();
    expect(v?.user_version).toBe(DB_SCHEMA_VERSION);
  });

  test("all 97 lexemes are present in authored order with their ids", () => {
    const db = open(committedPath);
    const rows = db
      .query<{ id: string; surface: string }, []>("SELECT id, surface FROM lexemes ORDER BY ord")
      .all();
    db.close();
    expect(rows.length).toBe(97);
    expect(rows.map((r) => r.id)).toEqual(lexicon.lexemes.map((l) => l.id));
    expect(rows.map((r) => r.surface)).toEqual(lexicon.lexemes.map((l) => l.surface));
  });

  test("every lexeme has examples and registered source references (incl. lexique-4)", () => {
    const db = open(committedPath);
    const exampleCounts = db
      .query<{ lexeme_id: string; n: number }, []>(
        "SELECT lexeme_id, COUNT(*) as n FROM examples GROUP BY lexeme_id"
      )
      .all();
    const refCounts = db
      .query<{ n: number }, []>("SELECT COUNT(*) as n FROM lexeme_sources")
      .get();
    const sources = db
      .query<{ id: string; license: string }, []>("SELECT id, license FROM sources ORDER BY id")
      .all();
    const lexiqueRefs = db
      .query<{ n: number }, []>(
        "SELECT COUNT(*) as n FROM lexeme_sources WHERE source_id = 'lexique-4' AND match_key IS NOT NULL"
      )
      .get();
    db.close();
    expect(exampleCounts.length).toBe(97);
    expect(exampleCounts.every((r) => r.n >= 1)).toBe(true);
    // 97 authored refs + 88 adopted Lexique 4 rows (49 + 2 overrides from
    // the original 54, 17 Unit A, 7 Unit B — être/avoir via documented
    // VER-row overrides — and 13 Unit C; the 6 Unit D time nouns are
    // authored-only until extract round 7).
    expect(refCounts?.n).toBe(185);
    expect(lexiqueRefs?.n).toBe(88);
    expect(sources).toEqual([
      { id: "lexique-4", license: "CC-BY-SA-4.0" },
      { id: "original-french-lexicon", license: "CC-BY-SA-4.0" },
    ]);
  });

  test("relations mirror the authored symmetric confusable pairs", () => {
    const db = open(committedPath);
    const rows = db
      .query<{ lexeme_id: string; rel_type: string; target_id: string }, []>(
        "SELECT * FROM relations ORDER BY lexeme_id, target_id"
      )
      .all();
    db.close();
    const expected = lexicon.lexemes.flatMap((l) =>
      (l.relations?.confusables ?? []).map((t) => ({ lexeme_id: l.id, rel_type: "confusable", target_id: t }))
    );
    expect(rows.length).toBe(expected.length);
    for (const row of rows) {
      // symmetry: the mirror edge exists
      expect(rows.some((r) => r.lexeme_id === row.target_id && r.target_id === row.lexeme_id)).toBe(true);
    }
  });

  test("FTS search: accents, ç, ligatures and apostrophes behave as designed", () => {
    const db = open(committedPath);
    const q = (s: string) =>
      db.query<{ id: string }, [string]>("SELECT id FROM lexeme_fts WHERE lexeme_fts MATCH ?").all(s).map((r) => r.id);
    const results = {
      cafe: q("cafe"),
      café: q("café"),
      garcon: q("garcon"),
      oeuf: q("oeuf"),
      plait: q("plait"),
      homme: q("homme"),
      prefix: q("gar*"),
    };
    db.close();
    expect(results.cafe).toContain("fr:w:cafe");
    expect(results.café).toContain("fr:w:cafe");
    expect(results.garcon).toEqual(["fr:w:garcon"]);
    expect(results.oeuf).toEqual(["fr:w:oeuf"]); // ligature folded at build time
    expect(results.plait).toEqual(["fr:w:s-il-vous-plait"]); // apostrophe separates
    expect(results.homme).toEqual(["fr:w:homme"]); // l' separates
    expect(results.prefix).toContain("fr:w:garcon");
    expect(results.prefix).toContain("fr:w:gare");
  });
});

describe("build determinism (logical-dump contract)", () => {
  test(
    "two fresh builds are logically identical, and match the committed database",
    () => {
      const dir = mkdtempSync(path.join(os.tmpdir(), "lexdb-test-"));
      try {
        const a = path.join(dir, "a.db");
        const b = path.join(dir, "b.db");
        buildSqliteDb(a, lexicon, registry, contentHash);
        buildSqliteDb(b, lexicon, registry, contentHash);
        const dumpA = logicalDump(a);
        expect(dumpA).toBe(logicalDump(b));
        expect(dumpA).toBe(logicalDump(committedPath));
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    },
    // Two full builds (each VACUUMs) + three logical dumps: comfortably fast
    // locally but past Bun's 5s default on slower CI runners.
    30_000
  );

  test("the content hash is derived from source data, not the binary", () => {
    // Recomputing from the same in-memory sources is stable.
    expect(lexiconContentHash(lexicon, manifest, registry)).toBe(contentHash);
    // And it responds to source changes.
    const mutated = structuredClone(lexicon);
    mutated.lexemes[0].nativeGloss = "the mutant";
    expect(lexiconContentHash(mutated, manifest, registry)).not.toBe(contentHash);
  });
});

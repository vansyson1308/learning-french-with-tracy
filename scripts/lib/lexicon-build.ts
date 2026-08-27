/**
 * Lexicon build artifacts (Phase 4). One source of truth
 * (content/fr/lexicon/lexemes.json) compiles into:
 *
 *  - src/content/lexicon/fr-index.json      lightweight synchronous runtime
 *                                           index (session-critical surfaces:
 *                                           TeachCard, PostAnswerPanel,
 *                                           distractors — never SQLite)
 *  - src/content/lexicon/fr-web-fallback.json  full compiled lexicon for the
 *                                           web repository (no wasm, no
 *                                           SharedArrayBuffer requirement)
 *  - assets/lexicon/fr-lexicon-v1-<hash>.db prebuilt read-only SQLite for
 *                                           native (expo-sqlite assetSource)
 *  - src/content/lexicon/db-asset.ts        generated module carrying the
 *                                           literal require() for the asset
 *  - content/reports/lexicon-quality.json   quality/coverage report
 *  - content/reports/lexicon-source-audit.json  per-lexeme source matching
 *
 * The database's identity is versioned: the filename embeds a contentHash
 * computed from canonical SOURCE data + schema version (never the binary),
 * so a content change ships as a NEW asset filename and no persisted file
 * is ever overwritten in place. Byte-identical DB files are not promised;
 * determinism is verified over schema + ordered logical dumps instead.
 */

import { Database } from "bun:sqlite";
import { createHash } from "crypto";

import { existsSync } from "fs";

import type { RichLexicon, SourceManifest, SourceRegistry } from "../../content/schema";
import { foldForSearch, foldLigatures } from "../../src/lib/learning/lexicon-search";
import { canonicalJson, readJson, safeResolve } from "./pipeline";
import { lexiconSourceAudit, type SourceMatchRow } from "./lexicon";

/** Bump when the SQLite schema (tables/columns/pragmas) changes shape. */
export const DB_SCHEMA_VERSION = 1;

/**
 * Bump when emission LOGIC changes what lands in the database without any
 * source or schema change (e.g. how FTS text is folded). It feeds the
 * content hash so such a change still ships as a new asset filename —
 * a previously copied database must never be silently kept stale.
 * Revision history: 1 = initial emitter; 2 = ligature-folded FTS text;
 * 3 = deterministic sort_key column (accent-folded alphabetical order).
 */
export const DB_BUILD_REVISION = 3;

export function lexiconContentHash(
  lexicon: RichLexicon,
  manifest: SourceManifest,
  registry: SourceRegistry
): string {
  const referenced = referencedSources(lexicon, registry);
  const input = canonicalJson({
    dbSchemaVersion: DB_SCHEMA_VERSION,
    dbBuildRevision: DB_BUILD_REVISION,
    lexicon,
    sourceSha256: manifest.retrieval.sha256,
    sources: referenced,
  });
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

export function dbAssetName(contentHash: string): string {
  return `fr-lexicon-v${DB_SCHEMA_VERSION}-${contentHash}.db`;
}

/** Registry entries actually referenced by lexicon data, sorted by id. */
export function referencedSources(lexicon: RichLexicon, registry: SourceRegistry) {
  const used = new Set<string>();
  for (const lex of lexicon.lexemes) {
    for (const ref of lex.sourceRefs) used.add(ref.source);
    for (const ex of lex.examples) used.add(ex.source);
    if (lex.pronunciation) used.add(lex.pronunciation.source);
    if (lex.frequency) used.add(lex.frequency.source);
  }
  return registry.sources
    .filter((s) => used.has(s.id))
    .map((s) => ({ id: s.id, name: s.name, license: s.license, url: s.url, attribution: s.attribution }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

// ---------------------------------------------------------------------------
// Runtime index (synchronous, session-critical path)
// ---------------------------------------------------------------------------

export type LexiconIndexEntry = {
  id: string;
  surface: string;
  lookupForm: string;
  lemma: string;
  gloss: string;
  pos: string;
  gender?: string;
  topic?: string;
  band?: string;
  pronunciation?: { value: string; notation: string };
  example?: { fr: string; en: string };
  confusables?: string[];
};

export function buildRuntimeIndex(lexicon: RichLexicon): { entries: LexiconIndexEntry[] } {
  return {
    entries: lexicon.lexemes.map((lex) => {
      const entry: LexiconIndexEntry = {
        id: lex.id,
        surface: lex.surface,
        lookupForm: lex.lookupForm,
        lemma: lex.lemma,
        gloss: lex.nativeGloss,
        pos: lex.partOfSpeech,
      };
      if (lex.gender !== undefined) entry.gender = lex.gender;
      if (lex.topic !== undefined) entry.topic = lex.topic;
      if (lex.frequency !== undefined) entry.band = lex.frequency.band;
      if (lex.pronunciation !== undefined) {
        entry.pronunciation = { value: lex.pronunciation.value, notation: lex.pronunciation.notation };
      }
      if (lex.examples.length > 0) {
        entry.example = { fr: lex.examples[0].fr, en: lex.examples[0].en };
      }
      if (lex.relations?.confusables !== undefined) entry.confusables = [...lex.relations.confusables];
      return entry;
    }),
  };
}

// ---------------------------------------------------------------------------
// Web fallback (full compiled lexicon, browser detail included)
// ---------------------------------------------------------------------------

export function buildWebFallback(
  lexicon: RichLexicon,
  registry: SourceRegistry,
  contentHash: string
) {
  return {
    contentHash,
    schemaVersion: DB_SCHEMA_VERSION,
    datasetLicense: "CC-BY-SA-4.0",
    sources: referencedSources(lexicon, registry),
    entries: lexicon.lexemes.map((lex) => ({
      id: lex.id,
      surface: lex.surface,
      lookupForm: lex.lookupForm,
      lemma: lex.lemma,
      gloss: lex.nativeGloss,
      pos: lex.partOfSpeech,
      ...(lex.gender !== undefined ? { gender: lex.gender } : {}),
      ...(lex.topic !== undefined ? { topic: lex.topic } : {}),
      ...(lex.frequency !== undefined
        ? { frequency: { band: lex.frequency.band, rank: lex.frequency.rank, perMillion: lex.frequency.rawValue } }
        : {}),
      ...(lex.pronunciation !== undefined
        ? { pronunciation: { value: lex.pronunciation.value, notation: lex.pronunciation.notation } }
        : {}),
      examples: lex.examples.map((ex) => ({ fr: ex.fr, en: ex.en, source: ex.source })),
      ...(lex.relations?.confusables !== undefined ? { confusables: [...lex.relations.confusables] } : {}),
      sourceRefs: lex.sourceRefs.map((r) => ({ source: r.source, ...(r.key !== undefined ? { key: r.key } : {}) })),
    })),
  };
}

// ---------------------------------------------------------------------------
// SQLite build (bun:sqlite writer → standard SQLite file for expo-sqlite)
// ---------------------------------------------------------------------------

const DDL = `
CREATE TABLE metadata (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
) WITHOUT ROWID;
CREATE TABLE lexemes (
  id TEXT PRIMARY KEY NOT NULL,
  ord INTEGER NOT NULL UNIQUE,
  surface TEXT NOT NULL UNIQUE,
  lookup_form TEXT NOT NULL,
  sort_key TEXT NOT NULL,
  lemma TEXT NOT NULL,
  pos TEXT NOT NULL,
  gender TEXT,
  gloss TEXT NOT NULL,
  topic TEXT,
  ipa TEXT,
  ipa_notation TEXT,
  freq_band TEXT,
  freq_rank INTEGER,
  freq_per_million REAL
) WITHOUT ROWID;
CREATE TABLE examples (
  lexeme_id TEXT NOT NULL REFERENCES lexemes(id),
  ordinal INTEGER NOT NULL,
  fr TEXT NOT NULL,
  en TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id),
  PRIMARY KEY (lexeme_id, ordinal)
) WITHOUT ROWID;
CREATE TABLE relations (
  lexeme_id TEXT NOT NULL REFERENCES lexemes(id),
  rel_type TEXT NOT NULL CHECK (rel_type IN ('confusable')),
  target_id TEXT NOT NULL REFERENCES lexemes(id),
  PRIMARY KEY (lexeme_id, rel_type, target_id)
) WITHOUT ROWID;
CREATE TABLE sources (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  license TEXT NOT NULL,
  url TEXT NOT NULL,
  attribution TEXT NOT NULL
) WITHOUT ROWID;
CREATE TABLE lexeme_sources (
  lexeme_id TEXT NOT NULL REFERENCES lexemes(id),
  source_id TEXT NOT NULL REFERENCES sources(id),
  match_key TEXT,
  PRIMARY KEY (lexeme_id, source_id)
) WITHOUT ROWID;
CREATE VIRTUAL TABLE lexeme_fts USING fts5(
  id UNINDEXED,
  surface,
  lemma,
  gloss,
  tokenize = 'unicode61 remove_diacritics 2'
);
`;

export function buildSqliteDb(
  dbPath: string,
  lexicon: RichLexicon,
  registry: SourceRegistry,
  contentHash: string
): void {
  const db = new Database(dbPath, { create: true });
  try {
    db.exec("PRAGMA journal_mode = DELETE;");
    db.exec(`PRAGMA user_version = ${DB_SCHEMA_VERSION};`);
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec(DDL);

    const meta = db.prepare("INSERT INTO metadata (key, value) VALUES (?, ?)");
    const metadata: Record<string, string> = {
      schemaVersion: String(DB_SCHEMA_VERSION),
      contentVersion: String(lexicon.version),
      contentHash,
      language: lexicon.language,
      datasetLicense: "CC-BY-SA-4.0",
      generator: "scripts/compile-content.ts",
    };
    for (const key of Object.keys(metadata).sort()) meta.run(key, metadata[key]);

    const insSource = db.prepare(
      "INSERT INTO sources (id, name, license, url, attribution) VALUES (?, ?, ?, ?, ?)"
    );
    for (const s of referencedSources(lexicon, registry)) {
      insSource.run(s.id, s.name, s.license, s.url, s.attribution);
    }

    const insLex = db.prepare(
      `INSERT INTO lexemes (id, ord, surface, lookup_form, sort_key, lemma, pos, gender, gloss, topic,
        ipa, ipa_notation, freq_band, freq_rank, freq_per_million)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insExample = db.prepare(
      "INSERT INTO examples (lexeme_id, ordinal, fr, en, source_id) VALUES (?, ?, ?, ?, ?)"
    );
    const insRelation = db.prepare(
      "INSERT INTO relations (lexeme_id, rel_type, target_id) VALUES (?, 'confusable', ?)"
    );
    const insLexSource = db.prepare(
      "INSERT INTO lexeme_sources (lexeme_id, source_id, match_key) VALUES (?, ?, ?)"
    );
    const insFts = db.prepare("INSERT INTO lexeme_fts (id, surface, lemma, gloss) VALUES (?, ?, ?, ?)");

    // Two passes: all lexeme rows first, then the tables referencing them
    // (relations may point at lexemes that come later in authored order).
    lexicon.lexemes.forEach((lex, ord) => {
      insLex.run(
        lex.id,
        ord,
        lex.surface,
        lex.lookupForm,
        foldForSearch(lex.lookupForm),
        lex.lemma,
        lex.partOfSpeech,
        lex.gender ?? null,
        lex.nativeGloss,
        lex.topic ?? null,
        lex.pronunciation?.value ?? null,
        lex.pronunciation?.notation ?? null,
        lex.frequency?.band ?? null,
        lex.frequency?.rank ?? null,
        lex.frequency?.rawValue ?? null
      );
      // Ligature-folded index text: unicode61 folds true diacritics at
      // match time, but œ/æ need explicit folding (see lexicon-search.ts).
      insFts.run(lex.id, foldLigatures(lex.surface), foldLigatures(lex.lemma), foldLigatures(lex.nativeGloss));
    });
    for (const lex of lexicon.lexemes) {
      lex.examples.forEach((ex, ordinal) => insExample.run(lex.id, ordinal, ex.fr, ex.en, ex.source));
      for (const target of lex.relations?.confusables ?? []) insRelation.run(lex.id, target);
      for (const ref of lex.sourceRefs) insLexSource.run(lex.id, ref.source, ref.key ?? null);
    }

    const integrity = db.query<{ integrity_check: string }, []>("PRAGMA integrity_check").get();
    if (integrity?.integrity_check !== "ok") {
      throw new Error(`lexicon db failed integrity_check: ${integrity?.integrity_check}`);
    }
    const fkViolations = db.query("PRAGMA foreign_key_check").all();
    if (fkViolations.length > 0) {
      throw new Error(`lexicon db failed foreign_key_check: ${JSON.stringify(fkViolations)}`);
    }
    db.exec("VACUUM;");
  } finally {
    db.close();
  }
}

/**
 * Ordered logical dump — the determinism/drift contract for the DB
 * (schema + rows, never raw bytes).
 */
export function logicalDump(dbPath: string): string {
  const db = new Database(dbPath, { readonly: true });
  try {
    const schema = db
      .query<{ type: string; name: string; sql: string | null }, []>(
        "SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'lexeme_fts_%' ORDER BY type, name"
      )
      .all();
    const userVersion = db.query<{ user_version: number }, []>("PRAGMA user_version").get();
    const dump: Record<string, unknown> = { userVersion: userVersion?.user_version, schema };
    const tables: Array<{ name: string; order: string }> = [
      { name: "metadata", order: "key" },
      { name: "lexemes", order: "id" },
      { name: "examples", order: "lexeme_id, ordinal" },
      { name: "relations", order: "lexeme_id, rel_type, target_id" },
      { name: "sources", order: "id" },
      { name: "lexeme_sources", order: "lexeme_id, source_id" },
      { name: "lexeme_fts", order: "id" },
    ];
    for (const t of tables) {
      dump[t.name] = db.query(`SELECT * FROM ${t.name} ORDER BY ${t.order}`).all();
    }
    return canonicalJson(dump);
  } finally {
    db.close();
  }
}

/** Integrity + FK verification for an existing (committed) database file. */
export function verifySqliteDb(dbPath: string): string[] {
  const errors: string[] = [];
  const db = new Database(dbPath, { readonly: true });
  try {
    const integrity = db.query<{ integrity_check: string }, []>("PRAGMA integrity_check").get();
    if (integrity?.integrity_check !== "ok") {
      errors.push(`integrity_check: ${integrity?.integrity_check ?? "no result"}`);
    }
    const fk = db.query("PRAGMA foreign_key_check").all();
    if (fk.length > 0) errors.push(`foreign_key_check: ${JSON.stringify(fk)}`);
  } catch (e) {
    errors.push(`cannot verify database: ${(e as Error).message}`);
  } finally {
    db.close();
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export function buildQualityReport(
  lexicon: RichLexicon,
  manifest: SourceManifest,
  contentHash: string,
  audit: SourceMatchRow[]
) {
  const lexemes = lexicon.lexemes;
  const count = (fn: (l: RichLexicon["lexemes"][number]) => boolean) => lexemes.filter(fn).length;
  const posBreakdown: Record<string, number> = {};
  for (const lex of lexemes) posBreakdown[lex.partOfSpeech] = (posBreakdown[lex.partOfSpeech] ?? 0) + 1;
  const topicBreakdown: Record<string, number> = {};
  for (const lex of lexemes) if (lex.topic) topicBreakdown[lex.topic] = (topicBreakdown[lex.topic] ?? 0) + 1;
  const auditCounts: Record<string, number> = {};
  for (const row of audit) auditCounts[row.status] = (auditCounts[row.status] ?? 0) + 1;
  const sourceBreakdown: Record<string, number> = {};
  for (const lex of lexemes)
    for (const ref of lex.sourceRefs) sourceBreakdown[ref.source] = (sourceBreakdown[ref.source] ?? 0) + 1;

  return {
    contentHash,
    totals: { lexemes: lexemes.length },
    externalSource: {
      id: manifest.source.id,
      retrievalStatus: manifest.retrieval.status,
      matchStatusCounts: auditCounts,
    },
    coverage: {
      partOfSpeech: lexemes.length,
      gender: count((l) => l.gender !== undefined),
      pronunciation: count((l) => l.pronunciation !== undefined),
      frequency: count((l) => l.frequency !== undefined),
      examples: count((l) => l.examples.length > 0),
      topic: count((l) => l.topic !== undefined),
      confusables: count((l) => (l.relations?.confusables ?? []).length > 0),
    },
    breakdowns: { partOfSpeech: posBreakdown, topic: topicBreakdown, sourceRefs: sourceBreakdown },
    // The validation gate fails on any of these, so committed = zero.
    conflicts: { articleGenderConflicts: 0, duplicateIds: 0, duplicateSurfaces: 0 },
    candidatePool: {
      present: false,
      reason:
        manifest.retrieval.status === "retrieved"
          ? "run lexicon:source:extract to generate"
          : "source not retrieved (see content/fr/lexicon/ACQUISITION.md)",
    },
  };
}

export function buildSourceAuditReport(audit: SourceMatchRow[]) {
  return { rows: audit };
}

/**
 * The audit that lands in the committed reports. Offline environments never
 * see the raw artifact, so once the source is retrieved the REAL audit
 * comes from the committed derived subset (produced runner-side against
 * the verified artifact) — but only when its sha matches the manifest pin;
 * a stale or missing subset falls back to the honest source-unavailable
 * audit rather than inventing or reusing drifted evidence.
 */
export function committedSourceAudit(manifest: SourceManifest): SourceMatchRow[] {
  if (manifest.retrieval.status === "retrieved") {
    const rel = "content/fr/lexicon/derived/lexique-subset.json";
    if (existsSync(safeResolve(rel))) {
      const subset = readJson(rel) as { source?: { sha256?: string }; audit?: SourceMatchRow[] };
      if (Array.isArray(subset.audit) && subset.source?.sha256 === manifest.retrieval.sha256) {
        return subset.audit;
      }
    }
  }
  return lexiconSourceAudit();
}

export { lexiconSourceAudit };

// ---------------------------------------------------------------------------
// Text artifact assembly (the binary DB is handled by the compile CLI)
// ---------------------------------------------------------------------------

function renderDbAssetModule(contentHash: string): string {
  const name = dbAssetName(contentHash);
  return [
    "// Generated by scripts/compile-content.ts — do not edit.",
    "/**",
    " * Versioned lexicon database asset. The filename embeds the content hash,",
    " * so a content change ships as a NEW asset name — a previously copied",
    " * database is never overwritten in place. Import this module only from",
    " * native-only code paths (the web bundle must not pull the asset).",
    " */",
    `export const FR_LEXICON_DB_NAME = ${JSON.stringify(name)};`,
    `export const FR_LEXICON_CONTENT_HASH = ${JSON.stringify(contentHash)};`,
    `export const FR_LEXICON_DB_ASSET = require(${JSON.stringify(`../../../assets/lexicon/${name}`)});`,
    "",
  ].join("\n");
}

export function compileLexiconArtifacts(
  lexicon: RichLexicon,
  manifest: SourceManifest,
  registry: SourceRegistry
): { contentHash: string; files: Array<{ relPath: string; contents: string }> } {
  const contentHash = lexiconContentHash(lexicon, manifest, registry);
  const audit = committedSourceAudit(manifest);
  return {
    contentHash,
    files: [
      {
        relPath: "src/content/lexicon/fr-index.json",
        contents: canonicalJson({ contentHash, ...buildRuntimeIndex(lexicon) }),
      },
      {
        relPath: "src/content/lexicon/fr-web-fallback.json",
        contents: canonicalJson(buildWebFallback(lexicon, registry, contentHash)),
      },
      { relPath: "src/content/lexicon/db-asset.ts", contents: renderDbAssetModule(contentHash) },
      {
        relPath: "content/reports/lexicon-quality.json",
        contents: canonicalJson(buildQualityReport(lexicon, manifest, contentHash, audit)),
      },
      {
        relPath: "content/reports/lexicon-source-audit.json",
        contents: canonicalJson(buildSourceAuditReport(audit)),
      },
    ],
  };
}

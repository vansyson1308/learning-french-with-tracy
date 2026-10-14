/**
 * Lexicon build artifacts (Phase 4, per target language since P1c). One
 * source of truth (content/<lang>/lexicon/lexemes.json) compiles into:
 *
 *  - src/content/lexicon/<lang>-index.json  lightweight synchronous runtime
 *                                           index (session-critical surfaces:
 *                                           TeachCard, PostAnswerPanel,
 *                                           distractors — never SQLite)
 *  - src/content/lexicon/<lang>-web-fallback.json  full compiled lexicon for
 *                                           the web repository (no wasm, no
 *                                           SharedArrayBuffer requirement)
 *  - assets/lexicon/<lang>-lexicon-v3-<hash>.db  prebuilt read-only SQLite
 *                                           for native (expo-sqlite assetSource)
 *  - (src/content/lexicon/db-assets.ts is emitted by course-profiles.ts — the
 *                                           literal require() per language)
 *  - content/reports/[<lang>/]lexicon-quality.json   quality/coverage report
 *  - content/reports/[<lang>/]lexicon-source-audit.json  per-lexeme source matching
 *
 * The database's identity is versioned: the filename embeds a contentHash
 * computed from canonical SOURCE data + schema version (never the binary),
 * so a content change ships as a NEW asset filename and no persisted file
 * is ever overwritten in place. Byte-identical DB files are not promised;
 * determinism is verified over schema + ordered logical dumps instead.
 *
 * Example sentences are stored generically (`target_text` / `native_text`)
 * and emitted into the JSON artifacts keyed by language code
 * (`{ fr: …, en: …, source }` for a French course with English native) —
 * the runtime resolves the two keys through the course profile.
 */

import { Database, type Statement } from "bun:sqlite";
import { createHash } from "crypto";

import { existsSync } from "fs";

import type { RichLexicon, SourceManifest, SourceRegistry } from "../../content/schema";
import { foldLigatures } from "../../src/lib/languages/base";
import { buildPlugin, type BuildLanguagePlugin } from "./languages";
import { localizeLexeme } from "./native-text";
import { canonicalJson, readJson, safeResolve } from "./pipeline";
import { lexiconSourceAudit, type SourceMatchRow } from "./lexicon";

/**
 * Bump when the SQLite schema (tables/columns/pragmas) changes shape.
 * History: 1 = Phase 4 initial; 2 = lexeme_sources.ord (authored source-ref
 * order is the cross-tier contract — alphabetical source_id ordering broke
 * parity once lexemes carried two refs); 3 = P1c language-neutral schema
 * (examples.target_text/native_text replace fr/en; the FTS tokenizer is
 * chosen by script; one database per target language).
 */
export const DB_SCHEMA_VERSION = 3;

/**
 * Bump when emission LOGIC changes what lands in the database without any
 * source or schema change (e.g. how FTS text is folded). It feeds the
 * content hash so such a change still ships as a new asset filename —
 * a previously copied database must never be silently kept stale.
 * Revision history: 1 = initial emitter; 2 = ligature-folded FTS text;
 * 3 = deterministic sort_key column (accent-folded alphabetical order).
 */
export const DB_BUILD_REVISION = 3;

/**
 * The lexicon as seen from ONE native language: `glosses` and example
 * `translations` keep only that native code's text. The content hash is
 * taken over this view (P2b), so adding a translation for another native
 * language never changes the asset of an existing course — the French
 * database for `fr-en` stays byte-identical when `vi` glosses are added.
 */
export function lexiconNativeView(lexicon: RichLexicon, nativeCode: string): RichLexicon {
  const pick = (map: Record<string, string>): Record<string, string> =>
    nativeCode in map ? { [nativeCode]: map[nativeCode] } : {};
  return {
    ...lexicon,
    lexemes: lexicon.lexemes.map((lex) => ({
      ...lex,
      glosses: pick(lex.glosses),
      examples: lex.examples.map((ex) => ({ ...ex, translations: pick(ex.translations) })),
    })),
  };
}

export function lexiconContentHash(
  lexicon: RichLexicon,
  manifest: SourceManifest | null,
  registry: SourceRegistry,
  nativeCode: string
): string {
  const referenced = referencedSources(lexicon, registry);
  const input = canonicalJson({
    dbSchemaVersion: DB_SCHEMA_VERSION,
    dbBuildRevision: DB_BUILD_REVISION,
    lexicon: lexiconNativeView(lexicon, nativeCode),
    sourceSha256: manifest?.retrieval.sha256 ?? null,
    sources: referenced,
  });
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

/**
 * `<prefix>-lexicon-v<n>-<hash>.db`. The prefix is the target language for
 * the target's primary native language and the COURSE id (`fr-vi`) for a
 * secondary native language (P2b): one database per (target, native).
 */
export function dbAssetName(prefix: string, contentHash: string): string {
  return `${prefix}-lexicon-v${DB_SCHEMA_VERSION}-${contentHash}.db`;
}

/** `<prefix>-lexicon-v<n>-<hash>.db` → prefix (`fr` or `fr-vi`), or undefined for a foreign file. */
export function dbAssetLanguage(fileName: string): string | undefined {
  return /^([a-z]{2,3}(?:-[a-z]{2,3})?)-lexicon-v\d+-[0-9a-f]{16}\.db$/.exec(fileName)?.[1];
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

/** The dataset licence line of a lexicon: CC BY-SA when any referenced source is, else the strictest referenced. */
export function datasetLicense(lexicon: RichLexicon, registry: SourceRegistry): string {
  const licenses = referencedSources(lexicon, registry).map((s) => s.license);
  if (licenses.includes("CC-BY-SA-4.0")) return "CC-BY-SA-4.0";
  if (licenses.includes("CC-BY-4.0")) return "CC-BY-4.0";
  return licenses[0] ?? "original";
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
  /** First example keyed by language code: `{ [targetCode]: …, [nativeCode]: … }`. */
  example?: Record<string, string>;
  confusables?: string[];
};

export function buildRuntimeIndex(
  lexicon: RichLexicon,
  targetCode: string,
  nativeCode: string
): { entries: LexiconIndexEntry[] } {
  return {
    entries: lexicon.lexemes.map((source) => {
      const lex = localizeLexeme(source, nativeCode);
      const entry: LexiconIndexEntry = {
        id: lex.id,
        surface: lex.surface,
        lookupForm: lex.lookupForm,
        lemma: lex.lemma,
        gloss: lex.gloss,
        pos: lex.partOfSpeech,
      };
      if (lex.gender !== undefined) entry.gender = lex.gender;
      if (lex.topic !== undefined) entry.topic = lex.topic;
      if (lex.frequency !== undefined) entry.band = lex.frequency.band;
      if (lex.pronunciation !== undefined) {
        entry.pronunciation = { value: lex.pronunciation.value, notation: lex.pronunciation.notation };
      }
      if (lex.examples.length > 0) {
        entry.example = { [targetCode]: lex.examples[0].target, [nativeCode]: lex.examples[0].native };
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
  contentHash: string,
  targetCode: string,
  nativeCode: string
) {
  return {
    contentHash,
    schemaVersion: DB_SCHEMA_VERSION,
    datasetLicense: datasetLicense(lexicon, registry),
    sources: referencedSources(lexicon, registry),
    entries: lexicon.lexemes.map((source) => {
      const lex = localizeLexeme(source, nativeCode);
      return {
        id: lex.id,
        surface: lex.surface,
        lookupForm: lex.lookupForm,
        lemma: lex.lemma,
        gloss: lex.gloss,
        pos: lex.partOfSpeech,
        ...(lex.gender !== undefined ? { gender: lex.gender } : {}),
        ...(lex.topic !== undefined ? { topic: lex.topic } : {}),
        ...(lex.frequency !== undefined
          ? {
              frequency: {
                band: lex.frequency.band,
                ...(lex.frequency.rank !== undefined ? { rank: lex.frequency.rank } : {}),
                perMillion: lex.frequency.rawValue,
              },
            }
          : {}),
        ...(lex.pronunciation !== undefined
          ? { pronunciation: { value: lex.pronunciation.value, notation: lex.pronunciation.notation } }
          : {}),
        examples: lex.examples.map((ex) => ({ [targetCode]: ex.target, [nativeCode]: ex.native, source: ex.source })),
        ...(lex.relations?.confusables !== undefined ? { confusables: [...lex.relations.confusables] } : {}),
        sourceRefs: lex.sourceRefs.map((r) => ({ source: r.source, ...(r.key !== undefined ? { key: r.key } : {}) })),
      };
    }),
  };
}

// ---------------------------------------------------------------------------
// SQLite build (bun:sqlite writer → standard SQLite file for expo-sqlite)
// ---------------------------------------------------------------------------

function ddl(ftsTokenizer: string): string {
  return `
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
  target_text TEXT NOT NULL,
  native_text TEXT NOT NULL,
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
  ord INTEGER NOT NULL,
  PRIMARY KEY (lexeme_id, source_id)
) WITHOUT ROWID;
CREATE VIRTUAL TABLE lexeme_fts USING fts5(
  id UNINDEXED,
  surface,
  lemma,
  gloss,
  tokenize = '${ftsTokenizer}'
);
`;
}

export type DbBuildOptions = {
  plugin: BuildLanguagePlugin;
  nativeCode: string;
};

/** Index-text fold for FTS: ligatures for Latin scripts (unicode61 folds diacritics itself), identity for CJK. */
function ftsFold(plugin: BuildLanguagePlugin, text: string): string {
  return plugin.script === "latin" ? foldLigatures(text) : text;
}

export function buildSqliteDb(
  dbPath: string,
  lexicon: RichLexicon,
  registry: SourceRegistry,
  contentHash: string,
  options: DbBuildOptions
): void {
  const { plugin, nativeCode } = options;
  const db = new Database(dbPath, { create: true });
  // Every prepared statement is finalized before close(): an unfinalized
  // statement turns sqlite3_close into a zombie connection that only goes
  // away at GC, which keeps the file locked on Windows (EBUSY on rm).
  const statements: Statement[] = [];
  const prepare = (sql: string): Statement => {
    const stmt = db.prepare(sql);
    statements.push(stmt);
    return stmt;
  };
  try {
    db.exec("PRAGMA journal_mode = DELETE;");
    db.exec(`PRAGMA user_version = ${DB_SCHEMA_VERSION};`);
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec(ddl(plugin.ftsTokenizer));

    const meta = prepare("INSERT INTO metadata (key, value) VALUES (?, ?)");
    const metadata: Record<string, string> = {
      schemaVersion: String(DB_SCHEMA_VERSION),
      contentVersion: String(lexicon.version),
      contentHash,
      language: lexicon.language,
      datasetLicense: datasetLicense(lexicon, registry),
      generator: "scripts/compile-content.ts",
    };
    for (const key of Object.keys(metadata).sort()) meta.run(key, metadata[key]);

    const insSource = prepare(
      "INSERT INTO sources (id, name, license, url, attribution) VALUES (?, ?, ?, ?, ?)"
    );
    for (const s of referencedSources(lexicon, registry)) {
      insSource.run(s.id, s.name, s.license, s.url, s.attribution);
    }

    const insLex = prepare(
      `INSERT INTO lexemes (id, ord, surface, lookup_form, sort_key, lemma, pos, gender, gloss, topic,
        ipa, ipa_notation, freq_band, freq_rank, freq_per_million)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insExample = prepare(
      "INSERT INTO examples (lexeme_id, ordinal, target_text, native_text, source_id) VALUES (?, ?, ?, ?, ?)"
    );
    const insRelation = prepare(
      "INSERT INTO relations (lexeme_id, rel_type, target_id) VALUES (?, 'confusable', ?)"
    );
    const insLexSource = prepare(
      "INSERT INTO lexeme_sources (lexeme_id, source_id, match_key, ord) VALUES (?, ?, ?, ?)"
    );
    const insFts = prepare("INSERT INTO lexeme_fts (id, surface, lemma, gloss) VALUES (?, ?, ?, ?)");

    const localized = lexicon.lexemes.map((lex) => localizeLexeme(lex, nativeCode));
    // Two passes: all lexeme rows first, then the tables referencing them
    // (relations may point at lexemes that come later in authored order).
    localized.forEach((lex, ord) => {
      insLex.run(
        lex.id,
        ord,
        lex.surface,
        lex.lookupForm,
        plugin.rules.fold(lex.lookupForm),
        lex.lemma,
        lex.partOfSpeech,
        lex.gender ?? null,
        lex.gloss,
        lex.topic ?? null,
        lex.pronunciation?.value ?? null,
        lex.pronunciation?.notation ?? null,
        lex.frequency?.band ?? null,
        lex.frequency?.rank ?? null,
        lex.frequency?.rawValue ?? null
      );
      // Ligature-folded index text: unicode61 folds true diacritics at
      // match time, but œ/æ need explicit folding (see lexicon-search.ts).
      insFts.run(lex.id, ftsFold(plugin, lex.surface), ftsFold(plugin, lex.lemma), ftsFold(plugin, lex.gloss));
    });
    for (const lex of localized) {
      lex.examples.forEach((ex, ordinal) => insExample.run(lex.id, ordinal, ex.target, ex.native, ex.source));
      for (const target of lex.relations?.confusables ?? []) insRelation.run(lex.id, target);
      lex.sourceRefs.forEach((ref, refIdx) => insLexSource.run(lex.id, ref.source, ref.key ?? null, refIdx));
    }

    const integrity = prepare("PRAGMA integrity_check").get() as { integrity_check: string } | null;
    if (integrity?.integrity_check !== "ok") {
      throw new Error(`lexicon db failed integrity_check: ${integrity?.integrity_check}`);
    }
    const fkViolations = prepare("PRAGMA foreign_key_check").all();
    if (fkViolations.length > 0) {
      throw new Error(`lexicon db failed foreign_key_check: ${JSON.stringify(fkViolations)}`);
    }
    db.exec("VACUUM;");
  } finally {
    for (const stmt of statements) stmt.finalize();
    db.close();
  }
}

/**
 * Ordered logical dump — the determinism/drift contract for the DB
 * (schema + rows, never raw bytes).
 */
export function logicalDump(dbPath: string): string {
  const db = new Database(dbPath, { readonly: true });
  const statements: Statement[] = [];
  const prepare = (sql: string): Statement => {
    const stmt = db.prepare(sql);
    statements.push(stmt);
    return stmt;
  };
  try {
    const schema = prepare(
      "SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'lexeme_fts_%' ORDER BY type, name"
    ).all() as { type: string; name: string; sql: string | null }[];
    const userVersion = prepare("PRAGMA user_version").get() as { user_version: number } | null;
    const dump: Record<string, unknown> = { userVersion: userVersion?.user_version, schema };
    const tables: Array<{ name: string; order: string }> = [
      { name: "metadata", order: "key" },
      { name: "lexemes", order: "id" },
      { name: "examples", order: "lexeme_id, ordinal" },
      { name: "relations", order: "lexeme_id, rel_type, target_id" },
      { name: "sources", order: "id" },
      { name: "lexeme_sources", order: "lexeme_id, ord" },
      { name: "lexeme_fts", order: "id" },
    ];
    for (const t of tables) {
      dump[t.name] = prepare(`SELECT * FROM ${t.name} ORDER BY ${t.order}`).all();
    }
    return canonicalJson(dump);
  } finally {
    for (const stmt of statements) stmt.finalize();
    db.close();
  }
}

/** Integrity + FK verification for an existing (committed) database file. */
export function verifySqliteDb(dbPath: string): string[] {
  const errors: string[] = [];
  const db = new Database(dbPath, { readonly: true });
  const statements: Statement[] = [];
  try {
    const integrityStmt = db.prepare("PRAGMA integrity_check");
    statements.push(integrityStmt);
    const integrity = integrityStmt.get() as { integrity_check: string } | null;
    if (integrity?.integrity_check !== "ok") {
      errors.push(`integrity_check: ${integrity?.integrity_check ?? "no result"}`);
    }
    const fkStmt = db.prepare("PRAGMA foreign_key_check");
    statements.push(fkStmt);
    const fk = fkStmt.all();
    if (fk.length > 0) errors.push(`foreign_key_check: ${JSON.stringify(fk)}`);
  } catch (e) {
    errors.push(`cannot verify database: ${(e as Error).message}`);
  } finally {
    for (const stmt of statements) stmt.finalize();
    db.close();
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export function buildQualityReport(
  lexicon: RichLexicon,
  manifest: SourceManifest | null,
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
      id: manifest?.source.id ?? null,
      retrievalStatus: manifest?.retrieval.status ?? "none",
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
        manifest === null
          ? "no external lexical source for this language"
          : manifest.retrieval.status === "retrieved"
            ? "run lexicon:source:extract to generate"
            : `source not retrieved (see content/${lexicon.language}/lexicon/ACQUISITION.md)`,
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
export function committedSourceAudit(lexicon: RichLexicon, manifest: SourceManifest | null): SourceMatchRow[] {
  if (manifest?.retrieval.status === "retrieved") {
    const rel = `content/${lexicon.language}/lexicon/derived/lexique-subset.json`;
    if (existsSync(safeResolve(rel))) {
      const subset = readJson(rel) as { source?: { sha256?: string }; audit?: SourceMatchRow[] };
      if (Array.isArray(subset.audit) && subset.source?.sha256 === manifest.retrieval.sha256) {
        return subset.audit;
      }
    }
  }
  return lexiconSourceAudit(lexicon);
}

export { lexiconSourceAudit };

// ---------------------------------------------------------------------------
// Text artifact assembly (the binary DB is handled by the compile CLI)
// ---------------------------------------------------------------------------

export function compileLexiconArtifacts(input: {
  lexicon: RichLexicon;
  manifest: SourceManifest | null;
  registry: SourceRegistry;
  nativeCode: string;
  /** src/content or the test-only root. */
  artifactRoot: string;
  /** content/reports or content/reports/<lang>; null = a secondary native language (no reports). */
  reportsDir: string | null;
  /** Artifact file prefix: the language code (primary native) or the course id (secondary native). */
  artifactPrefix?: string;
}): { contentHash: string; files: Array<{ relPath: string; contents: string }> } {
  const { lexicon, manifest, registry, nativeCode, artifactRoot, reportsDir } = input;
  const lang = lexicon.language;
  const prefix = input.artifactPrefix ?? lang;
  const contentHash = lexiconContentHash(lexicon, manifest, registry, nativeCode);
  const audit = committedSourceAudit(lexicon, manifest);
  const files: Array<{ relPath: string; contents: string }> = [
    {
      relPath: `${artifactRoot}/lexicon/${prefix}-index.json`,
      contents: canonicalJson({ contentHash, ...buildRuntimeIndex(lexicon, lang, nativeCode) }),
    },
    {
      relPath: `${artifactRoot}/lexicon/${prefix}-web-fallback.json`,
      contents: canonicalJson(buildWebFallback(lexicon, registry, contentHash, lang, nativeCode)),
    },
  ];
  if (reportsDir !== null) {
    files.push(
      {
        relPath: `${reportsDir}/lexicon-quality.json`,
        contents: canonicalJson(buildQualityReport(lexicon, manifest, contentHash, audit)),
      },
      {
        relPath: `${reportsDir}/lexicon-source-audit.json`,
        contents: canonicalJson(buildSourceAuditReport(audit)),
      }
    );
  }
  return { contentHash, files };
}

/** Everything the SQLite build of one language needs. */
export type LexiconDbPlan = {
  lang: string;
  /** `fr` (primary native) or the course id `fr-vi` (secondary native). */
  assetPrefix: string;
  name: string;
  contentHash: string;
  lexicon: RichLexicon;
  options: DbBuildOptions;
  testOnly: boolean;
};

export function lexiconDbPlan(input: {
  lexicon: RichLexicon;
  contentHash: string;
  nativeCode: string;
  testOnly: boolean;
  assetPrefix?: string;
}): LexiconDbPlan {
  const lang = input.lexicon.language;
  const assetPrefix = input.assetPrefix ?? lang;
  return {
    lang,
    assetPrefix,
    name: dbAssetName(assetPrefix, input.contentHash),
    contentHash: input.contentHash,
    lexicon: input.lexicon,
    options: { plugin: buildPlugin(lang), nativeCode: input.nativeCode },
    testOnly: input.testOnly,
  };
}

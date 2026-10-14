/**
 * Compile goldens (P1a): a committed manifest of sha256 hashes for every
 * generated artifact — every file under src/content/**, every
 * content/reports/**.json, ATTRIBUTIONS.md, src/content/attributions.json —
 * plus the logical dump of every prebuilt SQLite lexicon (one per target
 * language since P1c). The golden test
 * (scripts/__tests__/golden/compile-golden.test.ts) checks the committed
 * files against the manifest AND recompiles everything in memory to prove
 * that a refactor of the pipeline changed nothing observable.
 *
 * Re-blessing is deliberate: `bun scripts/golden.ts --update --reason "…"`
 * appends the reason to scripts/__tests__/golden/CHANGELOG.md.
 */
import { createHash } from "crypto";
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync } from "fs";
import os from "os";
import path from "path";

import { compileAllArtifacts } from "./compile-artifacts";
import { buildSqliteDb, dbAssetLanguage, logicalDump } from "./lexicon-build";
import { loadRegistry, readJson, removeTempDirSync, safeResolve } from "./pipeline";

export const GOLDEN_DIR = "scripts/__tests__/golden";
export const COMPILE_MANIFEST_REL = `${GOLDEN_DIR}/compile-manifest.json`;
export const COMPILE_CHANGELOG_REL = `${GOLDEN_DIR}/CHANGELOG.md`;
export const RUNTIME_GOLDEN_DIR = "src/lib/__tests__/golden";
export const RUNTIME_SNAPSHOT_DIR = `${RUNTIME_GOLDEN_DIR}/snapshots`;

/** Format 2 (P1c): `lexiconDbs` keyed by language replaces the single `lexiconDb`. */
export const COMPILE_MANIFEST_FORMAT = "compile-golden/2";

export type LexiconDbPin = { name: string; logicalDumpSha256: string };

export type CompileManifest = {
  format: typeof COMPILE_MANIFEST_FORMAT;
  /** repo-relative POSIX path → sha256 of the committed bytes. */
  files: Record<string, string>;
  /** language → committed database name + logical-dump hash. */
  lexiconDbs: Record<string, LexiconDbPin>;
};

export function sha256(data: string | Uint8Array): string {
  return createHash("sha256").update(data).digest("hex");
}

function toPosix(rel: string): string {
  return rel.split(path.sep).join("/");
}

/** Every committed file under a directory (recursive, sorted, POSIX relPaths). */
export function walkFiles(relDir: string, filter: (rel: string) => boolean = () => true): string[] {
  const root = safeResolve(relDir);
  if (!existsSync(root)) return [];
  const out: string[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    for (const entry of readdirSync(dir).sort()) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) stack.push(full);
      else {
        const rel = toPosix(path.relative(safeResolve("."), full));
        if (filter(rel)) out.push(rel);
      }
    }
  }
  return out.sort();
}

/** The set of committed generated files the manifest pins. */
export function pinnedGeneratedFiles(): string[] {
  return [
    ...walkFiles("src/content"),
    ...walkFiles("content/reports", (rel) => rel.endsWith(".json")),
    "ATTRIBUTIONS.md",
  ].sort();
}

/** The committed lexicon databases (assets/lexicon/<lang>-lexicon-v*-<hash>.db), by language. */
export function committedLexiconDbs(): Record<string, { name: string; abs: string }> {
  const dir = safeResolve("assets/lexicon");
  const out: Record<string, { name: string; abs: string }> = {};
  const dbs = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".db")).sort() : [];
  for (const name of dbs) {
    const lang = dbAssetLanguage(name);
    if (lang === undefined) throw new Error(`assets/lexicon/${name} is not a <lang>-lexicon-v<n>-<hash>.db asset`);
    if (out[lang]) throw new Error(`assets/lexicon has two databases for ${lang}: ${out[lang].name}, ${name}`);
    out[lang] = { name, abs: path.join(dir, name) };
  }
  return out;
}

/** Manifest of what is COMMITTED right now (no compilation). */
export function committedCompileManifest(): CompileManifest {
  const files: Record<string, string> = {};
  for (const rel of pinnedGeneratedFiles()) files[rel] = sha256(readFileSync(safeResolve(rel)));
  const lexiconDbs: Record<string, LexiconDbPin> = {};
  for (const [lang, db] of Object.entries(committedLexiconDbs())) {
    lexiconDbs[lang] = { name: db.name, logicalDumpSha256: sha256(logicalDump(db.abs)) };
  }
  return { format: COMPILE_MANIFEST_FORMAT, files, lexiconDbs };
}

export type FreshCompile = {
  /** relPath → sha256 of the freshly compiled contents (text artifacts only). */
  files: Record<string, string>;
  lexiconDbs: Record<string, LexiconDbPin>;
};

/**
 * Recompile every artifact in memory (and the SQLite databases into a temp
 * dir) and hash the results. Never touches the repository.
 */
export function freshCompile(): FreshCompile {
  const compiled = compileAllArtifacts();
  const files: Record<string, string> = {};
  for (const f of compiled.files) files[f.relPath] = sha256(f.contents);
  const tempDir = mkdtempSync(path.join(os.tmpdir(), "golden-db-"));
  try {
    const registry = loadRegistry();
    const lexiconDbs: Record<string, LexiconDbPin> = {};
    for (const plan of compiled.lexiconDbs) {
      const fresh = path.join(tempDir, plan.name);
      buildSqliteDb(fresh, plan.lexicon, registry, plan.contentHash, plan.options);
      lexiconDbs[plan.assetPrefix] = { name: plan.name, logicalDumpSha256: sha256(logicalDump(fresh)) };
    }
    return { files, lexiconDbs };
  } finally {
    removeTempDirSync(tempDir);
  }
}

export function readCompileManifest(): CompileManifest | undefined {
  if (!existsSync(safeResolve(COMPILE_MANIFEST_REL))) return undefined;
  const parsed = readJson(COMPILE_MANIFEST_REL) as CompileManifest;
  if (parsed.format !== COMPILE_MANIFEST_FORMAT) {
    throw new Error(`${COMPILE_MANIFEST_REL}: unknown format ${String(parsed.format)}`);
  }
  return parsed;
}

export type ManifestDiff = { added: string[]; removed: string[]; changed: string[] };

/** Differences between the stored manifest (`expected`) and `actual`. */
export function diffFileHashes(
  expected: Record<string, string>,
  actual: Record<string, string>
): ManifestDiff {
  const added = Object.keys(actual).filter((k) => !(k in expected)).sort();
  const removed = Object.keys(expected).filter((k) => !(k in actual)).sort();
  const changed = Object.keys(expected)
    .filter((k) => k in actual && expected[k] !== actual[k])
    .sort();
  return { added, removed, changed };
}

export function formatDiff(label: string, diff: ManifestDiff): string[] {
  const lines: string[] = [];
  for (const f of diff.changed) lines.push(`${label}: changed  ${f}`);
  for (const f of diff.added) lines.push(`${label}: new      ${f}`);
  for (const f of diff.removed) lines.push(`${label}: missing  ${f}`);
  return lines;
}

/** Database pins as a flat `lang:name` → dump-hash map so diffFileHashes can compare them. */
export function dbPinsAsFiles(pins: Record<string, LexiconDbPin>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [lang, pin] of Object.entries(pins)) out[`lexicon-db:${lang}:${pin.name}`] = pin.logicalDumpSha256;
  return out;
}

/** Runtime snapshot files (src/lib/__tests__/golden/snapshots/*.json) with hashes. */
export function runtimeSnapshotHashes(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rel of walkFiles(RUNTIME_SNAPSHOT_DIR, (r) => r.endsWith(".json"))) {
    out[rel] = sha256(readFileSync(safeResolve(rel)));
  }
  return out;
}

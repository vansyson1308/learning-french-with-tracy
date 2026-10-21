/**
 * Compiles content/ sources into the committed generated artifacts:
 * src/content/packs/*.json (+index.ts), src/content/catalog.json, per
 * target language src/content/<layer>/<lang>-*.json, src/content/lexicon/*
 * (runtime index, web fallback, db-asset module), assets/lexicon/*.db (one
 * prebuilt SQLite per language), content/reports/*, ATTRIBUTIONS.md.
 * Deterministic; validation runs first; writes are containment-checked.
 * With --check, compares instead of writing and exits non-zero on drift
 * (the CI guard).
 *
 * The SQLite artifacts are binary, so their drift/determinism contract is
 * the ordered LOGICAL dump (schema + rows + user_version), never raw bytes;
 * integrity_check and foreign_key_check must also pass on the committed
 * files, and no stale versioned .db may remain next to the current ones.
 */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "fs";
import os from "os";
import path from "path";

import { compileAllArtifacts, validateAllSources } from "./lib/compile-artifacts";
import { buildSqliteDb, logicalDump, verifySqliteDb } from "./lib/lexicon-build";
import { loadRegistry } from "./lib/pipeline";
import { assertGeneratedTarget, removeTempDirSync, safeResolve } from "./lib/pipeline";

const checkOnly = process.argv.includes("--check");

// A validation error that only says a GENERATED artifact is stale ("run
// bun run content:compile" — e.g. src/content/ids/<lang>.json after new
// lexemes were frozen) is exactly what a write-mode compile repairs; it is
// deferred and re-checked after writing. --check never defers anything.
const isGeneratedDrift = (message: string) => /run bun run content:compile/.test(message);
const validation = validateAllSources();
const blocking = checkOnly ? validation : validation.filter((e) => !isGeneratedDrift(e));
if (blocking.length > 0) {
  for (const e of blocking) console.error(`ERROR ${e}`);
  process.exit(1);
}
const deferredDrift = validation.length - blocking.length;

// Every text artifact, assembled in memory (scripts/lib/compile-artifacts.ts);
// the SQLite databases are built below under the logical-dump contract.
const { files, coverage, lexiconDbs } = compileAllArtifacts();

let drifted = 0;
for (const file of files) {
  assertGeneratedTarget(file.relPath);
  const abs = safeResolve(file.relPath);
  const current = existsSync(abs) ? readFileSync(abs, "utf8") : undefined;
  if (current === file.contents) continue;
  drifted += 1;
  if (checkOnly) {
    console.error(`DRIFT ${file.relPath} is stale — run \`bun run content:compile\``);
  } else {
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, file.contents);
    console.log(`wrote ${file.relPath}`);
  }
}

// --- Binary SQLite artifacts (logical-dump drift contract), one per language ---
const lexiconAssetsDir = safeResolve("assets/lexicon");
const expectedDbNames = new Set(lexiconDbs.map((plan) => plan.name));
const registry = loadRegistry();
const tempDir = mkdtempSync(path.join(os.tmpdir(), "lexicon-db-"));
try {
  for (const plan of lexiconDbs) {
    const dbRel = `assets/lexicon/${plan.name}`;
    assertGeneratedTarget(dbRel);
    const dbAbs = safeResolve(dbRel);
    const freshPath = path.join(tempDir, plan.name);
    buildSqliteDb(freshPath, plan.lexicon, registry, plan.contentHash, plan.options);
    const freshDump = logicalDump(freshPath);

    const committedOk =
      existsSync(dbAbs) && verifySqliteDb(dbAbs).length === 0 && logicalDump(dbAbs) === freshDump;

    if (checkOnly) {
      if (!existsSync(dbAbs)) {
        drifted += 1;
        console.error(`DRIFT ${dbRel} is missing — run \`bun run content:compile\``);
      } else {
        const verifyErrors = verifySqliteDb(dbAbs);
        for (const e of verifyErrors) {
          drifted += 1;
          console.error(`ERROR ${dbRel}: ${e}`);
        }
        if (verifyErrors.length === 0 && logicalDump(dbAbs) !== freshDump) {
          drifted += 1;
          console.error(`DRIFT ${dbRel} logical contents are stale — run \`bun run content:compile\``);
        }
      }
    } else if (!committedOk) {
      mkdirSync(path.dirname(dbAbs), { recursive: true });
      writeFileSync(dbAbs, readFileSync(freshPath));
      console.log(`wrote ${dbRel}`);
    }
  }
  const staleDbs = existsSync(lexiconAssetsDir)
    ? readdirSync(lexiconAssetsDir).filter((f) => f.endsWith(".db") && !expectedDbNames.has(f))
    : [];
  for (const stale of staleDbs) {
    if (checkOnly) {
      drifted += 1;
      console.error(`DRIFT assets/lexicon/${stale} is a stale versioned database — run \`bun run content:compile\``);
    } else {
      unlinkSync(path.join(lexiconAssetsDir, stale));
      console.log(`removed stale assets/lexicon/${stale}`);
    }
  }
} finally {
  removeTempDirSync(tempDir);
}

for (const [courseId, row] of Object.entries(coverage)) {
  if (row.withGradeTargets > 0) {
    console.log(
      `${courseId}: gradeTargets on ${row.withGradeTargets}/${row.total} exercises (` +
        Object.entries(row.byType)
          .filter(([, t]) => t.withGradeTargets > 0)
          .map(([type, t]) => `${type} ${t.withGradeTargets}/${t.total}`)
          .join(", ") +
        ")"
    );
  }
}
for (const plan of lexiconDbs) {
  console.log(`lexicon ${plan.assetPrefix}: ${plan.lexicon.lexemes.length} lexemes, contentHash ${plan.contentHash}, db ${plan.name}${plan.testOnly ? " (test-only)" : ""}`);
}

if (checkOnly && drifted > 0) process.exit(1);
if (deferredDrift > 0) {
  const remaining = validateAllSources();
  if (remaining.length > 0) {
    for (const e of remaining) console.error(`ERROR ${e}`);
    console.error(`ERROR compile wrote the generated artifacts, but ${remaining.length} validation error(s) remain`);
    process.exit(1);
  }
}
console.log(
  checkOnly ? "generated artifacts are up to date" : `compile done (${files.length + lexiconDbs.length} artifacts)`
);

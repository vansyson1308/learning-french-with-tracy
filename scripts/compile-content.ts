/**
 * Compiles content/ sources into the committed generated artifacts:
 * src/content/packs/*.json (+index.ts), src/content/lexicon/* (runtime
 * index, web fallback, db-asset module), assets/lexicon/*.db (prebuilt
 * SQLite), content/reports/*, ATTRIBUTIONS.md. Deterministic; validation
 * runs first; writes are containment-checked. With --check, compares
 * instead of writing and exits non-zero on drift (the CI guard).
 *
 * The SQLite artifact is binary, so its drift/determinism contract is the
 * ordered LOGICAL dump (schema + rows + user_version), never raw bytes;
 * integrity_check and foreign_key_check must also pass on the committed
 * file, and no stale versioned .db may remain next to the current one.
 */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "fs";
import os from "os";
import path from "path";

import { validateLexicon, loadRichLexicon, loadSourceManifest } from "./lib/lexicon";
import { deriveGenderPatterns } from "./lib/gender-patterns";
import type { GenderSuffixStats } from "./lib/lexique-derive-lib";
import {
  CONCEPTS_ARTIFACT,
  compileConceptsArtifact,
  loadPedagogyConcepts,
  validatePedagogy,
} from "./lib/pedagogy";
import { collectAssessmentItemTargets, loadClaimPolicy, loadCourseObjectives, validateAssessment } from "./lib/assessment";
import {
  buildCefrAlignment,
  buildObjectiveCoverage,
  evaluateClaimGate,
} from "./lib/assessment-reports";
import { PackSchema } from "../content/schema";
import {
  buildSqliteDb,
  compileLexiconArtifacts,
  dbAssetName,
  logicalDump,
  verifySqliteDb,
} from "./lib/lexicon-build";
import {
  assertGeneratedTarget,
  canonicalJson,
  compileAll,
  loadRegistry,
  readJson,
  safeResolve,
  validateContent,
} from "./lib/pipeline";

const checkOnly = process.argv.includes("--check");

const validation = [
  ...validateContent().errors,
  ...validateLexicon().errors,
  ...validatePedagogy().errors,
  ...validateAssessment().errors,
];
if (validation.length > 0) {
  for (const e of validation) console.error(`ERROR ${e}`);
  process.exit(1);
}

const { files, coverage } = compileAll();
const lexicon = loadRichLexicon();
const lexiconArtifacts = compileLexiconArtifacts(lexicon, loadSourceManifest(), loadRegistry());
files.push(...lexiconArtifacts.files);
files.push({ relPath: CONCEPTS_ARTIFACT, contents: compileConceptsArtifact(loadPedagogyConcepts()) });

// §51–53 committed pattern report: every statistically-derived pattern from
// the real noun-lemma population (the curriculum teaches a curated subset;
// this report is the honest full record the curation draws from).
{
  const genderStats = readJson("content/fr/lexicon/derived/gender-suffix-stats.json") as GenderSuffixStats & {
    source: { sha256: string };
  };
  files.push({
    relPath: "content/reports/gender-patterns.json",
    contents: canonicalJson({
      source: genderStats.source,
      generator: "scripts/lib/gender-patterns.ts",
      thresholds: { minLemmas: 100, minReliabilityPct: 90, almostAlwaysPct: 99 },
      population: genderStats.population,
      patterns: deriveGenderPatterns(genderStats),
    }),
  });
}

// §131-135 assessment reports: objective coverage, CEFR alignment, and the
// overall-level claim gate — deterministic content-only artifacts. The
// checkpoint/placement item-target lists come from the authored assessment
// content when present (empty arrays until those banks exist).
{
  const objectivesDoc = loadCourseObjectives();
  const policy = loadClaimPolicy();
  const frPack = PackSchema.parse(readJson("content/courses/fr-en.json"));
  const concepts = loadPedagogyConcepts().concepts;
  const checkpointItemTargets = collectAssessmentItemTargets("content/fr/assessment/checkpoints.json", "checkpoints");
  const placementItemTargets = collectAssessmentItemTargets("content/fr/assessment/placement.json", "stages");
  files.push({
    relPath: "content/reports/course-objective-coverage.json",
    contents: canonicalJson({
      generator: "scripts/lib/assessment-reports.ts",
      objectives: buildObjectiveCoverage({
        objectives: objectivesDoc.objectives,
        frPack,
        concepts,
        checkpointItemTargets,
        placementItemTargets,
      }),
    }),
  });
  files.push({
    relPath: "content/reports/cefr-alignment.json",
    contents: canonicalJson({
      generator: "scripts/lib/assessment-reports.ts",
      ...buildCefrAlignment(objectivesDoc.objectives),
    }),
  });
  files.push({
    relPath: "content/reports/cefr-claim-gate.json",
    contents: canonicalJson({
      generator: "scripts/lib/assessment-reports.ts",
      ...evaluateClaimGate({
        objectives: objectivesDoc.objectives,
        policy,
        checkpointItemTargets,
      }),
    }),
  });
}

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

// --- Binary SQLite artifact (logical-dump drift contract) ---
const dbName = dbAssetName(lexiconArtifacts.contentHash);
const dbRel = `assets/lexicon/${dbName}`;
assertGeneratedTarget(dbRel);
const dbAbs = safeResolve(dbRel);
const tempDir = mkdtempSync(path.join(os.tmpdir(), "lexicon-db-"));
try {
  const freshPath = path.join(tempDir, dbName);
  buildSqliteDb(freshPath, lexicon, loadRegistry(), lexiconArtifacts.contentHash);
  const freshDump = logicalDump(freshPath);

  const committedOk =
    existsSync(dbAbs) && verifySqliteDb(dbAbs).length === 0 && logicalDump(dbAbs) === freshDump;
  const lexiconAssetsDir = safeResolve("assets/lexicon");
  const staleDbs = existsSync(lexiconAssetsDir)
    ? readdirSync(lexiconAssetsDir).filter((f) => f.endsWith(".db") && f !== dbName)
    : [];

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
    for (const stale of staleDbs) {
      drifted += 1;
      console.error(`DRIFT assets/lexicon/${stale} is a stale versioned database — run \`bun run content:compile\``);
    }
  } else {
    if (!committedOk) {
      mkdirSync(path.dirname(dbAbs), { recursive: true });
      writeFileSync(dbAbs, readFileSync(freshPath));
      console.log(`wrote ${dbRel}`);
    }
    for (const stale of staleDbs) {
      unlinkSync(path.join(lexiconAssetsDir, stale));
      console.log(`removed stale assets/lexicon/${stale}`);
    }
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
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
console.log(`lexicon: ${lexicon.lexemes.length} lexemes, contentHash ${lexiconArtifacts.contentHash}, db ${dbName}`);

if (checkOnly && drifted > 0) process.exit(1);
console.log(
  checkOnly ? "generated artifacts are up to date" : `compile done (${files.length + 1} artifacts)`
);

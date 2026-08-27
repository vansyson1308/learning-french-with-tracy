/**
 * Compiles content/ sources into the committed generated artifacts:
 * src/content/packs/*.json (+index.ts), content/reports/grade-targets.json,
 * ATTRIBUTIONS.md. Deterministic; validation runs first; writes are
 * containment-checked. With --check, compares instead of writing and exits
 * non-zero on drift (the CI guard).
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

import { assertGeneratedTarget, compileAll, safeResolve, validateContent } from "./lib/pipeline";

const checkOnly = process.argv.includes("--check");

const { errors } = validateContent();
if (errors.length > 0) {
  for (const e of errors) console.error(`ERROR ${e}`);
  process.exit(1);
}

const { files, coverage } = compileAll();
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

if (checkOnly && drifted > 0) process.exit(1);
console.log(
  checkOnly ? "generated artifacts are up to date" : `compile done (${files.length} artifacts)`
);

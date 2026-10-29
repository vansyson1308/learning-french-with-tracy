/**
 * Context coverage of a target WITH its staged course layer overlaid
 * (QC 2026-10-28 §4): the list stories are written against while a course is
 * still in staging. Writes nothing to the repository; prints a summary and
 * saves the report to the given path.
 * `bun scripts/context-draft.ts <lang> <out.json>`
 */
import { writeFileSync } from "fs";

import { withStaging } from "./lib/authoring/staging";
import { compileAllArtifacts, reportsDirFor } from "./lib/compile-artifacts";

const [lang, out] = process.argv.slice(2);
if (!lang || !out) {
  console.error("usage: bun scripts/context-draft.ts <lang> <out.json>");
  process.exit(2);
}
const report = withStaging(lang, () => {
  const rel = `${reportsDirFor(lang)}/context-coverage.json`;
  return compileAllArtifacts().files.find((f) => f.relPath === rel)?.contents ?? null;
});
if (report === null) {
  console.error(`no context-coverage report for ${lang}`);
  process.exit(1);
}
writeFileSync(out, report);
const r = JSON.parse(report) as { syllabus: number; withContext: number; share: number; bySource: Record<string, number>; units: { unitId: string; total: number; missing: string[] }[] };
console.log(`${lang}: ${r.withContext}/${r.syllabus} (${(r.share * 100).toFixed(1)} %) with context; by source ${JSON.stringify(r.bySource)}`);
for (const u of r.units) if (u.missing.length > 0) console.log(`  ${u.unitId}: ${u.missing.length}/${u.total} missing`);

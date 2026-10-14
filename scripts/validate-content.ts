/**
 * CI entry: schema + rule + provenance validation of the content sources —
 * every course pack, the registry, and for every target language that has
 * rich sources: lexicon, pedagogy, assessment, reception, speech, writing,
 * interaction and native-text completeness (scripts/lib/compile-artifacts.ts
 * `validateAllSources`, the same gate the compiler runs first).
 */
import { validateAllSources } from "./lib/compile-artifacts";
import { discoverTargets } from "./lib/pipeline";

const errors = validateAllSources();
for (const e of errors) console.error(`ERROR ${e}`);
if (errors.length > 0) {
  console.error(`\ncontent validation failed with ${errors.length} error(s)`);
  process.exit(1);
}
console.log(
  `content validation passed (packs + registry + rich sources of ${discoverTargets().join(", ")})`
);

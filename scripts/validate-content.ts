/** CI entry: schema + rule + provenance validation of the content sources. */
import { validateLexicon } from "./lib/lexicon";
import { validateContent } from "./lib/pipeline";

const content = validateContent();
const lexicon = validateLexicon();
const errors = [...content.errors, ...lexicon.errors];
const warnings = [...content.warnings, ...lexicon.warnings];
for (const w of warnings) console.warn(`WARN  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);
if (errors.length > 0) {
  console.error(`\ncontent validation failed with ${errors.length} error(s)`);
  process.exit(1);
}
console.log("content validation passed (packs + registry + rich lexicon)");

/** CI entry: schema + rule + provenance validation of the content sources. */
import { validateAssessment } from "./lib/assessment";
import { validateLexicon } from "./lib/lexicon";
import { validatePedagogy } from "./lib/pedagogy";
import { validateContent } from "./lib/pipeline";

const content = validateContent();
const lexicon = validateLexicon();
const pedagogy = validatePedagogy();
const assessment = validateAssessment();
const errors = [...content.errors, ...lexicon.errors, ...pedagogy.errors, ...assessment.errors];
const warnings = [
  ...content.warnings,
  ...lexicon.warnings,
  ...pedagogy.warnings,
  ...assessment.warnings,
];
for (const w of warnings) console.warn(`WARN  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);
if (errors.length > 0) {
  console.error(`\ncontent validation failed with ${errors.length} error(s)`);
  process.exit(1);
}
console.log("content validation passed (packs + registry + rich lexicon + pedagogy + assessment)");

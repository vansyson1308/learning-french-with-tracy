/** CI entry: schema + rule + provenance validation of the content sources. */
import { loadCourseObjectives, validateAssessment } from "./lib/assessment";
import { loadRichLexicon, validateLexicon } from "./lib/lexicon";
import { validatePedagogy } from "./lib/pedagogy";
import { validateContent } from "./lib/pipeline";
import { loadListening, loadReadings, validateReception } from "./lib/reception";

const content = validateContent();
const lexicon = validateLexicon();
const pedagogy = validatePedagogy();
const assessment = validateAssessment();
let reception = { errors: [] as string[], warnings: [] as string[] };
try {
  reception = validateReception({
    readings: loadReadings(),
    listening: loadListening(),
    objectives: loadCourseObjectives(),
    lexemeIds: new Set(loadRichLexicon().lexemes.map((l) => l.id)),
    frPack: JSON.parse(require("fs").readFileSync("content/courses/fr-en.json", "utf8")),
  });
} catch (e) {
  reception = {
    errors: [`reception: schema validation failed — ${(e as Error).message.split("\n")[0]}`],
    warnings: [],
  };
}
const errors = [
  ...content.errors,
  ...lexicon.errors,
  ...pedagogy.errors,
  ...assessment.errors,
  ...reception.errors,
];
const warnings = [
  ...content.warnings,
  ...lexicon.warnings,
  ...pedagogy.warnings,
  ...assessment.warnings,
  ...reception.warnings,
];
for (const w of warnings) console.warn(`WARN  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);
if (errors.length > 0) {
  console.error(`\ncontent validation failed with ${errors.length} error(s)`);
  process.exit(1);
}
console.log("content validation passed (packs + registry + rich lexicon + pedagogy + assessment + reception)");

/** CI entry: schema + rule + provenance validation of the content sources. */
import { readFileSync } from "fs";

import { loadCourseObjectives, validateAssessment } from "./lib/assessment";
import { loadRichLexicon, validateLexicon } from "./lib/lexicon";
import { validatePedagogy } from "./lib/pedagogy";
import { validateContent } from "./lib/pipeline";
import { loadListening, loadReadings, validateReception } from "./lib/reception";
import {
  assessmentBankSpeechExercises,
  loadSpeechItems,
  validateSpeech,
} from "./lib/speech";
import {
  assessmentBankWritingExercises,
  loadWritingTasks,
  validateWriting,
} from "./lib/writing";

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
    frPack: JSON.parse(readFileSync("content/courses/fr-en.json", "utf8")),
  });
} catch (e) {
  reception = {
    errors: [`reception: schema validation failed — ${(e as Error).message.split("\n")[0]}`],
    warnings: [],
  };
}
let speech = { errors: [] as string[], warnings: [] as string[] };
try {
  speech = validateSpeech({
    speech: loadSpeechItems(),
    objectives: loadCourseObjectives(),
    listening: loadListening(),
    lexemeIds: new Set(loadRichLexicon().lexemes.map((l) => l.id)),
    frPack: JSON.parse(readFileSync("content/courses/fr-en.json", "utf8")),
    assessmentSpeech: assessmentBankSpeechExercises(),
  });
} catch (e) {
  speech = {
    errors: [`speech: schema validation failed — ${(e as Error).message.split("\n")[0]}`],
    warnings: [],
  };
}
let writing = { errors: [] as string[], warnings: [] as string[] };
try {
  writing = validateWriting({
    writing: loadWritingTasks(),
    objectives: loadCourseObjectives(),
    lexemeIds: new Set(loadRichLexicon().lexemes.map((l) => l.id)),
    frPack: JSON.parse(readFileSync("content/courses/fr-en.json", "utf8")),
    assessmentWriting: assessmentBankWritingExercises(),
  });
} catch (e) {
  writing = {
    errors: [`writing: schema validation failed — ${(e as Error).message.split("\n")[0]}`],
    warnings: [],
  };
}
const errors = [
  ...content.errors,
  ...lexicon.errors,
  ...pedagogy.errors,
  ...assessment.errors,
  ...reception.errors,
  ...speech.errors,
  ...writing.errors,
];
const warnings = [
  ...content.warnings,
  ...lexicon.warnings,
  ...pedagogy.warnings,
  ...assessment.warnings,
  ...reception.warnings,
  ...speech.warnings,
  ...writing.warnings,
];
for (const w of warnings) console.warn(`WARN  ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);
if (errors.length > 0) {
  console.error(`\ncontent validation failed with ${errors.length} error(s)`);
  process.exit(1);
}
console.log("content validation passed (packs + registry + rich lexicon + pedagogy + assessment + reception + speech + writing)");

/**
 * Run the German course gates on the de-vi DRAFT pack (content/de/_drafts/pack.json)
 * while it is being authored — content:validate runs them only once the course
 * is promoted. `bun scripts/de-gates-draft.ts`
 */
import type { PackSource } from "../content/schema";
import { germanCourseErrors, loadGermanGateData } from "./lib/languages/de-gates";
import { readJson } from "./lib/pipeline";

const pack = readJson("content/de/_drafts/pack.json") as PackSource;
const lexicon = (readJson("content/de/lexicon/lexemes.json") as { lexemes: { id: string; surface: string; legacySurfaces?: string[]; partOfSpeech: string }[] }).lexemes;
const errors = germanCourseErrors(pack, { lexicon, ...loadGermanGateData() });
for (const e of errors) console.log(`ERROR ${e}`);
console.log(errors.length === 0 ? "German gates: draft clean" : `German gates: ${errors.length} error(s)`);
process.exit(errors.length === 0 ? 0 : 1);

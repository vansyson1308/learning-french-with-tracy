/**
 * Run the English course gates on the en-vi DRAFT pack (content/en/_drafts/pack.json)
 * while it is being authored — content:validate runs them only once the course
 * is promoted. Concepts and scenarios are read from the staged layer when present.
 * `bun scripts/en-gates-draft.ts`
 */
import { existsSync } from "fs";

import type { PackSource } from "../content/schema";
import { englishCourseErrors, loadEnglishGateData, scenarioLines, scenarioRegisterErrors, targetTextErrors } from "./lib/languages/en-gates";
import { readJson, safeResolve } from "./lib/pipeline";

const staged = (rel: string) => [`content/en/_drafts/staged/${rel}`, rel].find((p) => existsSync(safeResolve(p)));
const pack = readJson("content/en/_drafts/pack.json") as PackSource;
const lexicon = (readJson("content/en/lexicon/lexemes.json") as { lexemes: Parameters<typeof englishCourseErrors>[1]["lexicon"] }).lexemes;
const { irregular } = loadEnglishGateData();
const conceptsRel = staged("content/en/pedagogy/concepts.json");
const conceptIds = conceptsRel === undefined ? null : (readJson(conceptsRel) as { concepts: { id: string }[] }).concepts.map((c) => c.id);
const scenariosRel = staged("content/en/interaction/scenarios.json");
const scenarios = scenariosRel === undefined ? [] : (readJson(scenariosRel) as { scenarios: Parameters<typeof scenarioRegisterErrors>[0] }).scenarios;
const data = { lexicon, irregular };
const errors = [
  ...englishCourseErrors(pack, { ...data, conceptIds }),
  ...scenarioRegisterErrors(scenarios),
  ...scenarios.flatMap((s) => scenarioLines(s).flatMap((line) => targetTextErrors(line, data).map((m) => `${s.id}: ${m}`))),
];
for (const e of errors) console.log(`ERROR ${e}`);
console.log(errors.length === 0 ? `English gates: draft clean (${scenarios.length} scenarios checked)` : `English gates: ${errors.length} error(s)`);
process.exit(errors.length === 0 ? 0 : 1);

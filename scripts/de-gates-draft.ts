/**
 * Run the German course gates on the de-vi DRAFT pack (content/de/_drafts/pack.json)
 * while it is being authored — content:validate runs them only once the course
 * is promoted. Scenarios are read from the staged layer when present.
 * `bun scripts/de-gates-draft.ts`
 */
import { existsSync } from "fs";

import type { PackSource } from "../content/schema";
import { germanCourseErrors, loadGermanGateData, scenarioRegisterErrors } from "./lib/languages/de-gates";
import { readJson, safeResolve } from "./lib/pipeline";

const pack = readJson("content/de/_drafts/pack.json") as PackSource;
const lexicon = (readJson("content/de/lexicon/lexemes.json") as { lexemes: { id: string; surface: string; legacySurfaces?: string[]; partOfSpeech: string }[] }).lexemes;
const scenariosRel = ["content/de/_drafts/staged/content/de/interaction/scenarios.json", "content/de/interaction/scenarios.json"].find((p) => existsSync(safeResolve(p)));
const scenarios = scenariosRel === undefined ? [] : (readJson(scenariosRel) as { scenarios: Parameters<typeof scenarioRegisterErrors>[0] }).scenarios;
const errors = [...germanCourseErrors(pack, { lexicon, ...loadGermanGateData() }), ...scenarioRegisterErrors(scenarios)];
for (const e of errors) console.log(`ERROR ${e}`);
console.log(errors.length === 0 ? `German gates: draft clean (${scenarios.length} scenarios checked)` : `German gates: ${errors.length} error(s)`);
process.exit(errors.length === 0 ? 0 : 1);

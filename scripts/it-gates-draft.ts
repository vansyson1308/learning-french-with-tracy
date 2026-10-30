/**
 * Run the Italian course gates on the it-vi DRAFT pack (content/it/_drafts/pack.json)
 * while it is being authored — content:validate runs them only once the course
 * is promoted. Paradigms and scenarios are read from the staged layer when present.
 * `bun scripts/it-gates-draft.ts`
 */
import { existsSync } from "fs";

import type { PackSource } from "../content/schema";
import { italianCourseErrors, loadItalianGateData, scenarioRegisterErrors } from "./lib/languages/it-gates";
import { readJson, safeResolve } from "./lib/pipeline";

const staged = (rel: string) => [`content/it/_drafts/staged/${rel}`, rel].find((p) => existsSync(safeResolve(p)));
const pack = readJson("content/it/_drafts/pack.json") as PackSource;
const lexicon = (readJson("content/it/lexicon/lexemes.json") as { lexemes: Parameters<typeof italianCourseErrors>[1]["lexicon"] }).lexemes;
const paradigmsRel = staged("content/it/pedagogy/paradigms.json");
const tables = paradigmsRel === undefined ? [] : (readJson(paradigmsRel) as { tables: { cells: Record<string, string>; attributes?: { auxiliary?: string } }[] }).tables;
const auxiliaries = { avere: [] as string[], essere: [] as string[] };
for (const t of tables) if (t.attributes?.auxiliary === "avere" || t.attributes?.auxiliary === "essere") auxiliaries[t.attributes.auxiliary].push(t.cells.participle);
const scenariosRel = staged("content/it/interaction/scenarios.json");
const scenarios = scenariosRel === undefined ? [] : (readJson(scenariosRel) as { scenarios: Parameters<typeof scenarioRegisterErrors>[0] }).scenarios;
const errors = [...italianCourseErrors(pack, { lexicon, plurals: loadItalianGateData().plurals, auxiliaries }), ...scenarioRegisterErrors(scenarios)];
for (const e of errors) console.log(`ERROR ${e}`);
console.log(errors.length === 0 ? `Italian gates: draft clean (${scenarios.length} scenarios checked)` : `Italian gates: ${errors.length} error(s)`);
process.exit(errors.length === 0 ? 0 : 1);

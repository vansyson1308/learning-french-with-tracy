/**
 * en-vi while it has no lessons (P4f). A pack whose lessons are empty fails PackSchema, so
 * loadPacks drops it, and then `syllabus.ts derive` finds no primary course and validateTarget
 * stops at "no course pack". These two commands work from the draft pack instead.
 *
 *   bun scripts/en-draft.ts syllabus    derive content/en/lexicon/syllabus.json from content/en/_drafts/pack.json
 *   bun scripts/en-draft.ts validate    validateAllSources with the staged layer, one stub exercise in each empty
 *                                       lesson, grouped by kind of error; nothing is written
 */
import { readFileSync, writeFileSync } from "fs";

import type { PackSource } from "../content/schema";
import { isGeneratedDrift, withStaging } from "./lib/authoring/staging";
import { validateAllSources } from "./lib/compile-artifacts";
import { loadRichLexicon } from "./lib/lexicon";
import { readJson, safeResolve } from "./lib/pipeline";
import { deriveSyllabus, syllabusPath } from "./lib/syllabus";

const DRAFT = "content/en/_drafts/pack.json";
const REAL = "content/courses/en-vi.json";

function withStubExercises(pack: PackSource): PackSource {
  return {
    ...pack,
    sections: pack.sections.map((s) => ({
      ...s,
      units: s.units.map((u) => ({
        ...u,
        lessons: u.lessons.map((l) =>
          (l.exercises ?? []).length > 0 ? l : { ...l, exercises: [{ type: "select" as const, id: `${l.id}-e0`, mode: "targetToNative" as const, prompt: u.words[0].target, options: [{ text: u.words[0].native }, { text: "—" }], correct: 0 }] }
        ),
      })),
    })),
  };
}

const command = process.argv[2];
if (command === "syllabus") {
  const syllabus = deriveSyllabus({ lang: "en", level: "A1", minLexemes: 600, lexicon: loadRichLexicon("en"), pack: readJson(DRAFT) as PackSource });
  writeFileSync(safeResolve(syllabusPath("en")), `${JSON.stringify(syllabus, null, 2)}\n`);
  console.log(`${syllabusPath("en")}: ${syllabus.entries.length} lexemes before the A2-1 split`);
} else if (command === "validate") {
  const errors = withStaging("en", () => {
    const staged = readFileSync(safeResolve(REAL));
    writeFileSync(safeResolve(REAL), `${JSON.stringify(withStubExercises(readJson(DRAFT) as PackSource), null, 2)}\n`);
    try {
      return validateAllSources().filter((e) => !isGeneratedDrift(e));
    } finally {
      writeFileSync(safeResolve(REAL), staged);
    }
  });
  for (const e of errors) console.log(e);
  console.log(`en-draft validate: ${errors.length} error(s) with the staged layer and stub exercises`);
} else {
  console.error("usage: en-draft.ts syllabus|validate");
  process.exit(2);
}

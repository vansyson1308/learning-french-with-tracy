/**
 * A new <lang>-vi course while it has no lessons (P4f en-vi, P4c ja-vi). A pack whose lessons are empty fails PackSchema,
 * so loadPacks drops it, and then `syllabus.ts derive` finds no primary course and validateTarget stops at
 * "no course pack". These two commands work from the draft pack (content/<lang>/_drafts/pack.json) instead.
 *
 *   bun scripts/course-draft.ts syllabus --target ja [--min 600] [--out <rel>]
 *        derive the A1 syllabus from the draft pack with the staged layer overlaid (topic-units.json may be staged);
 *        written to --out (default: the staged syllabus when content/<lang>/_drafts/staged exists, else
 *        content/<lang>/lexicon/syllabus.json)
 *   bun scripts/course-draft.ts validate --target ja
 *        validateAllSources with the staged layer, one stub exercise in each empty lesson, grouped by kind of error;
 *        nothing is written
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import path from "path";

import type { PackSource } from "../content/schema";
import { isGeneratedDrift, stagedRoot, withStaging } from "./lib/authoring/staging";
import { validateAllSources } from "./lib/compile-artifacts";
import { loadRichLexicon } from "./lib/lexicon";
import { readJson, safeResolve } from "./lib/pipeline";
import { deriveSyllabus, syllabusPath } from "./lib/syllabus";

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

export function runCourseDraft(argv: string[]): number {
  const [command, ...rest] = argv;
  const opt = (name: string): string | undefined => {
    const i = rest.indexOf(`--${name}`);
    return i >= 0 ? rest[i + 1] : undefined;
  };
  const lang = opt("target");
  if (lang === undefined || !/^[a-z]{2,3}$/.test(lang)) {
    console.error("usage: course-draft.ts syllabus|validate --target <lang> [--min N] [--out <rel>]");
    return 2;
  }
  const draft = `content/${lang}/_drafts/pack.json`;
  const real = `content/courses/${lang}-vi.json`;
  if (command === "syllabus") {
    const minLexemes = Number(opt("min") ?? "600");
    const staged = existsSync(safeResolve(stagedRoot(lang)));
    const out = opt("out") ?? (staged ? `${stagedRoot(lang)}/${syllabusPath(lang)}` : syllabusPath(lang));
    const syllabus = withStaging(lang, () => deriveSyllabus({ lang, level: "A1", minLexemes, lexicon: loadRichLexicon(lang), pack: readJson(draft) as PackSource }));
    mkdirSync(path.dirname(safeResolve(out)), { recursive: true });
    writeFileSync(safeResolve(out), `${JSON.stringify(syllabus, null, 2)}\n`);
    console.log(`${out}: ${syllabus.entries.length} lexemes before the A2-1 split`);
    return 0;
  }
  if (command === "validate") {
    const errors = withStaging(lang, () => {
      const before = existsSync(safeResolve(real)) ? readFileSync(safeResolve(real)) : null;
      writeFileSync(safeResolve(real), `${JSON.stringify(withStubExercises(readJson(draft) as PackSource), null, 2)}\n`);
      try {
        return validateAllSources().filter((e) => !isGeneratedDrift(e));
      } finally {
        if (before === null) rmSync(safeResolve(real));
        else writeFileSync(safeResolve(real), before);
      }
    });
    for (const e of errors) console.log(e);
    console.log(`course-draft validate ${lang}: ${errors.length} error(s) with the staged layer and stub exercises`);
    return 0;
  }
  console.error("usage: course-draft.ts syllabus|validate --target <lang> [--min N] [--out <rel>]");
  return 2;
}

if (import.meta.main) process.exit(runCourseDraft(process.argv.slice(2)));

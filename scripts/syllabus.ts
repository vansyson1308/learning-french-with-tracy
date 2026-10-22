/**
 * Lexical syllabus tool (P3e).
 *
 *   bun scripts/syllabus.ts derive --target es --level A1 --min 600
 *       writes content/<target>/lexicon/syllabus.json from the rich lexicon
 *       and the target's primary course (scripts/lib/syllabus.ts).
 *   bun scripts/syllabus.ts report --target es
 *       prints the size per unit and the floor.
 */
import { writeFileSync } from "fs";

import { loadRichLexicon } from "./lib/lexicon";
import { courseRolesFor, loadPacks, safeResolve } from "./lib/pipeline";
import { deriveSyllabus, loadSyllabus, syllabusPath } from "./lib/syllabus";

const [command] = process.argv.slice(2);
const opt = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const fail = (m: string): never => {
  console.error(`ERROR: ${m}`);
  process.exit(1);
};

const target = opt("target") ?? fail("--target <code>");
const primary = courseRolesFor(target, loadPacks()).primary?.pack ?? fail(`${target}: no primary course`);

if (command === "derive") {
  const syllabus = deriveSyllabus({ lang: target, level: opt("level") ?? "A1", minLexemes: Number(opt("min") ?? "0"), lexicon: loadRichLexicon(target), pack: primary });
  writeFileSync(safeResolve(syllabusPath(target)), `${JSON.stringify(syllabus, null, 2)}\n`);
  console.log(`${syllabusPath(target)}: ${syllabus.entries.length} lexemes (${syllabus.level}, floor ${syllabus.minLexemes})`);
} else if (command === "report") {
  const syllabus = loadSyllabus(target) ?? fail(`${syllabusPath(target)} does not exist`);
  const perUnit = new Map<string, number>();
  for (const e of syllabus.entries) perUnit.set(e.unitId, (perUnit.get(e.unitId) ?? 0) + 1);
  for (const [unit, n] of perUnit) console.log(`${unit.padEnd(20)} ${n}`);
  console.log(`total ${syllabus.entries.length} (floor ${syllabus.minLexemes})`);
} else {
  fail("usage: syllabus.ts derive|report --target <code>");
}

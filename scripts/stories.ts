#!/usr/bin/env bun
/**
 * Graded-story authoring helper (P5b, authoring step `stories`).
 *
 *   bun scripts/stories.ts bands --lang <code>   vocabulary per band (surface = id), function words
 *   bun scripts/stories.ts check --lang <code>   per-story grading (tokens, coverage, unresolved,
 *                                                undeclared beyond-band words) + every validator error
 *   … --staged                                   the same with the language's staged layer overlaid
 *                                                (a course still being built; nothing is written)
 *
 * Read-only: content is changed by hand or through `author ingest stories`.
 */

import { withStaging } from "./lib/authoring/staging";
import { courseRolesFor, loadPacks } from "./lib/pipeline";
import { loadRichLexicon } from "./lib/lexicon";
import { deriveSyllabus, loadLaterSyllabus, loadSyllabus } from "./lib/syllabus";
import { lexemeBands, loadStories, validateStories } from "./lib/stories";

function fail(message: string): never {
  console.error(message);
  process.exit(2);
}

const cmd = process.argv[2];
const langIdx = process.argv.indexOf("--lang");
const lang = langIdx > 0 ? process.argv[langIdx + 1] : fail("--lang <code> required");

/** Runs the command; returns the exit code (never exits itself, so a staging overlay is always restored). */
function run(): number {
  const packs = loadPacks();
  const lexicon = loadRichLexicon(lang);
  const primary = courseRolesFor(lang, packs).primary?.pack;
  if (!primary) {
    console.error(`${lang}: no primary course`);
    return 2;
  }
  const syllabus = loadSyllabus(lang) ?? deriveSyllabus({ lang, level: "A1", minLexemes: 0, lexicon, pack: primary });

  if (cmd === "bands") {
    const bands = lexemeBands(syllabus, loadLaterSyllabus(lang));
    const byId = new Map(lexicon.lexemes.map((l) => [l.id, l]));
    const groups = new Map<string, string[]>();
    for (const e of syllabus.entries) {
      const band = bands.get(e.lexemeId) ?? "?";
      const lex = byId.get(e.lexemeId);
      groups.set(band, [...(groups.get(band) ?? []), `${lex?.lookupForm ?? "?"}=${lex?.glosses.vi ?? lex?.glosses.en ?? ""}`]);
    }
    for (const [band, words] of groups) console.log(`## ${band} (${words.length})\n${words.join(" · ")}\n`);
    const beyond = lexicon.lexemes.filter((l) => !bands.has(l.id)).map((l) => `${l.lookupForm}=${l.glosses.vi ?? l.glosses.en ?? ""}`);
    console.log(`## beyond the syllabus — only as declared new words (${beyond.length})\n${beyond.join(" · ")}`);
    return 0;
  }
  if (cmd === "check") {
    const stories = loadStories(lang);
    if (!stories) {
      console.error(`content/${lang}/stories/stories.json not found`);
      return 2;
    }
    const result = validateStories({ lang, stories, lexicon, syllabus, laterSyllabus: loadLaterSyllabus(lang), nativeCodes: ["vi", "en"], receptionVoices: null });
    for (const a of result.analyses) {
      console.log(`${a.id} [${a.band}] ${a.tokens} tokens, ${(a.coverage * 100).toFixed(1)} % known${a.unresolved.length ? ` · unresolved: ${a.unresolved.join(" ")}` : ""}${a.undeclared.length ? ` · beyond band: ${a.undeclared.join(" ")}` : ""}`);
    }
    if (process.argv.includes("--tokens")) {
      // Every word whose surface differs from its lexeme's dictionary form: review the resolutions.
      const form = new Map(lexicon.lexemes.map((l) => [l.id, l.lookupForm]));
      for (const a of result.analyses) {
        const seen = new Set<string>();
        for (const s of a.sentences) for (const p of s) if (p.lexemeId && p.text.toLowerCase() !== form.get(p.lexemeId)) seen.add(`${p.text}→${form.get(p.lexemeId)}`);
        console.log(`  ${a.id}: ${[...seen].join(" ")}`);
      }
    }
    for (const e of result.errors) console.log(`ERROR ${e}`);
    for (const w of result.warnings) console.log(`warn  ${w}`);
    return result.errors.length > 0 ? 1 : 0;
  }
  console.error("usage: stories.ts bands|check --lang <code> [--staged] [--tokens]");
  return 2;
}

process.exitCode = process.argv.includes("--staged") ? withStaging(lang, run) : run();

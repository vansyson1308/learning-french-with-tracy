/**
 * P4e session 4: the ko-vi graded stories pass the real story validator (scripts/lib/stories.ts: Intl.Segmenter
 * cuts, lexeme index, bands, coverage) on the staged layer, before promote. content:validate only reads committed
 * stories; this runs the same validateStories over content/ko/_drafts/staged. No story bundles audio (ko has no clean
 * recorded voice; the reader uses the device voice).
 */
import { describe, expect, test } from "bun:test";
import { existsSync } from "fs";

import { storiesSchema, type RichLexicon, type Syllabus } from "../../content/schema";
import { readJson } from "../lib/pipeline";
import { microBandLexemes, validateStories } from "../lib/stories";

const S = "content/ko/_drafts/staged/content";
const STORIES = `${S}/ko/stories/stories.json`;

describe("ko-vi graded stories (staged)", () => {
  test.skipIf(!existsSync(STORIES))("pass the story validator with 0 errors", () => {
    const stories = storiesSchema("ko").parse(readJson(STORIES));
    const lexicon = readJson(`${S}/ko/lexicon/lexemes.json`) as RichLexicon;
    const pack = readJson(`${S}/courses/ko-vi.json`) as { sections: { units: { words: { target: string }[] }[] }[] };
    const r = validateStories({
      lang: "ko",
      stories,
      lexicon,
      syllabus: readJson(`${S}/ko/lexicon/syllabus.json`) as Syllabus,
      laterSyllabus: readJson(`${S}/ko/lexicon/syllabus-a2-1.json`) as Syllabus,
      nativeCodes: ["vi"],
      receptionVoices: null,
      storyAudio: { kind: "none", reason: "ko: no clean recorded voice (D-11); the device voice reads every story" },
      microLexemes: microBandLexemes(lexicon, pack, readJson(`${S}/ko/lexemes.json`) as Record<string, string>),
    });
    expect(r.errors).toEqual([]);
    const graded = stories.stories.filter((s) => s.band !== "A1-0").length;
    expect(graded).toBeGreaterThanOrEqual(40);
    expect(graded).toBeLessThanOrEqual(50);
    // Every word token resolves; the analysis the app compiles agrees with the generator's port.
    for (const a of r.analyses) expect(a.unresolved, a.id).toEqual([]);
  });
});

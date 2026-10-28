/**
 * QC 2026-10-29 §1.2: the German A1 syllabus is the Wortliste-aligned core
 * (650–750 lexemes); every other lexicon entry is band A2-1, which graded
 * stories may use but the daily-words stream does not offer.
 */
import { describe, expect, test } from "bun:test";

import { loadRichLexicon } from "../lib/lexicon";
import { lexemeBands } from "../lib/stories";
import { loadLaterSyllabus, loadSyllabus, validateLaterSyllabus } from "../lib/syllabus";

describe("A1 syllabus and the A2-1 band", () => {
  const lexicon = loadRichLexicon("de");
  const a1 = loadSyllabus("de")!;
  const later = loadLaterSyllabus("de")!;

  test("German A1 stays within 650–750 lexemes; A1 and A2-1 partition the lexicon", () => {
    expect(a1.entries.length).toBeGreaterThanOrEqual(650);
    expect(a1.entries.length).toBeLessThanOrEqual(750);
    const ids = new Set([...a1.entries, ...later.entries].map((e) => e.lexemeId));
    expect(ids.size).toBe(a1.entries.length + later.entries.length);
    expect(ids.size).toBe(lexicon.lexemes.length);
    expect(validateLaterSyllabus({ later, syllabus: a1, lexicon, lang: "de" })).toEqual([]);
  });

  test("later entries take the later band; A1 halves keep A1-1 / A1-2", () => {
    const bands = lexemeBands(a1, later);
    expect(bands.get(a1.entries[0].lexemeId)).toBe("A1-1");
    expect(bands.get(a1.entries[a1.entries.length - 1].lexemeId)).toBe("A1-2");
    expect(bands.get(later.entries[0].lexemeId)).toBe("A2-1");
    expect(lexemeBands(a1).has(later.entries[0].lexemeId)).toBe(false);
  });

  test("a later list that repeats an A1 lexeme or an unknown id is an error", () => {
    const bad = { ...later, entries: [...later.entries, a1.entries[0], { lexemeId: "de:w:nope", unitId: a1.entries[0].unitId }] };
    expect(validateLaterSyllabus({ later: bad, syllabus: a1, lexicon, lang: "de" })).toEqual([
      `syllabus-a2-1 (de): ${a1.entries[0].lexemeId} is already in the A1 syllabus`,
      "syllabus-a2-1 (de): unknown lexeme de:w:nope",
    ]);
  });
});

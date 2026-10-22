import { describe, expect, test } from "bun:test";

import { lintSyllabusCoverage } from "../lib/authoring/lint";
import { loadRichLexicon } from "../lib/lexicon";
import { courseRolesFor, loadPacks } from "../lib/pipeline";
import { deriveSyllabus, loadSyllabus, validateSyllabusData } from "../lib/syllabus";

const packs = loadPacks();
const esPack = courseRolesFor("es", packs).primary!.pack;
const frPack = courseRolesFor("fr", packs).primary!.pack;
const esLex = loadRichLexicon("es");
const frLex = loadRichLexicon("fr");
const ES = loadSyllabus("es")!;

describe("lexical syllabus (P3e)", () => {
  test("es commits an A1 syllabus of ≥ 600 lexemes that equals the documented derivation", () => {
    expect(ES.level).toBe("A1");
    expect(ES.minLexemes).toBe(600);
    expect(ES.entries.length).toBeGreaterThanOrEqual(600);
    expect(deriveSyllabus({ lang: "es", level: "A1", minLexemes: 600, lexicon: esLex, pack: esPack })).toEqual(ES);
    expect(validateSyllabusData({ syllabus: ES, lang: "es", lexicon: esLex, pack: esPack, nativeCodes: ["vi"] }).errors).toEqual([]);
  });

  test("French needs no file: the derived syllabus covers its whole lexicon", () => {
    expect(loadSyllabus("fr")).toBeNull();
    const fr = deriveSyllabus({ lang: "fr", level: "A1", minLexemes: 0, lexicon: frLex, pack: frPack });
    expect(fr.entries.length).toBe(frLex.lexemes.length);
  });

  test("delivery order: unit order first, then frequency", () => {
    const unitOrder = esPack.sections.flatMap((s) => s.units.map((u) => u.id));
    const idx = ES.entries.map((e) => unitOrder.indexOf(e.unitId));
    expect(idx).toEqual([...idx].sort((a, b) => a - b));
    expect(idx.every((i) => i >= 0)).toBe(true);
  });

  test("every rule fires", () => {
    const bad = { ...ES, entries: [...ES.entries, ES.entries[0], { lexemeId: "es:w:nope", unitId: "es-vi:unit-1" }, { lexemeId: ES.entries[1].lexemeId, unitId: "es-vi:unit-zz" }], minLexemes: 5000 };
    const errors = validateSyllabusData({ syllabus: bad, lang: "es", lexicon: esLex, pack: esPack, nativeCodes: ["vi", "ja"] }).errors.join("\n");
    expect(errors).toContain("duplicate lexeme");
    expect(errors).toContain("unknown lexeme es:w:nope");
    expect(errors).toContain("is not a unit of es-vi");
    expect(errors).toContain('no "ja" gloss');
    expect(errors).toContain("floor is 5000");
  });

  test("coverage linter: 0 uncovered for es-vi; a lexeme without a gloss is an error", () => {
    const ok = lintSyllabusCoverage(esPack, ES, esLex.lexemes, "vi");
    expect(ok.stats.uncovered).toBe(0);
    expect(ok.stats.lessons + ok.stats.daily).toBe(ES.entries.length);
    const packText = JSON.stringify(esPack).toLowerCase();
    const dailyOnly = ES.entries.map((e) => esLex.lexemes.find((l) => l.id === e.lexemeId)!).find((l) => !packText.includes(l.lookupForm.toLowerCase()))!;
    const broken = esLex.lexemes.map((l) => (l.id === dailyOnly.id ? { ...l, glosses: { en: l.glosses.en } } : l));
    const bad = lintSyllabusCoverage(esPack, ES, broken, "vi");
    expect(bad.stats.uncovered).toBe(1);
    expect(bad.findings.map((f) => f.where)).toEqual([dailyOnly.id]);
    expect(bad.findings.every((f) => f.severity === "error" && f.rule === "syllabus-coverage")).toBe(true);
  });
});

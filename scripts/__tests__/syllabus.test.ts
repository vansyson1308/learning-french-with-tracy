import { describe, expect, test } from "bun:test";

import { lintSyllabusContext, lintSyllabusCoverage } from "../lib/authoring/lint";
import { loadRichLexicon } from "../lib/lexicon";
import { courseRolesFor, loadPacks } from "../lib/pipeline";
import { courseAuthored, courseSelected, deriveSyllabus, loadSyllabus, loadTopicUnits, validateSyllabusData, validateTopicUnits } from "../lib/syllabus";

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

  test("P3e §8: course-authored core vocabulary is in the syllabus without a frequency measurement", () => {
    const authored = esLex!.lexemes.filter((l) => courseAuthored(l) && !l.variety);
    expect(authored.length).toBeGreaterThan(20);
    const ids = new Set(ES.entries.map((e) => e.lexemeId));
    for (const l of authored) expect(ids.has(l.id)).toBe(true);
    expect(courseAuthored({ sourceRefs: [{ source: "kaikki-en" }, { source: "original-lexicon-etl" }] })).toBe(false);
    expect(courseAuthored({ sourceRefs: [] })).toBe(false);
  });

  test("P3d(de): a lexeme the course added through lexicon-add is a syllabus word even when the subtitle corpus rates it less-common", () => {
    const added = { sourceRefs: [{ source: "kaikki-en" }, { source: "frequencywords" }, { source: "original-lexicon-etl" }], examples: [{ source: "original-lexicon-etl", key: "add" }] };
    expect(courseSelected(added)).toBe(true);
    expect(courseSelected({ sourceRefs: [{ source: "kaikki-en" }], examples: [{ source: "tatoeba", key: "123" }] })).toBe(false);
    expect(courseSelected({ sourceRefs: [{ source: "original-lexicon-etl" }], examples: [] })).toBe(true);
    // es: rojo / la playa were added by the course (pool band less-common) and now count.
    const ids = new Set(ES.entries.map((e) => e.lexemeId));
    for (const id of ["es:w:rojo", "es:w:playa"]) expect(ids.has(id)).toBe(true);
    const deLex = loadRichLexicon("de");
    const dePack = courseRolesFor("de", packs).primary!.pack;
    const de = new Set(deriveSyllabus({ lang: "de", level: "A1", minLexemes: 0, lexicon: deLex, pack: dePack }).entries.map((e) => e.lexemeId));
    expect(de.has("de:w:garten")).toBe(true);
  });

  test("P3e §8: words whose frequency belonged to a homograph are not daily words", () => {
    const ids = new Set(ES.entries.map((e) => e.lexemeId));
    for (const id of ["es:w:asir", "es:w:casar", "es:w:mesar", "es:w:ademar", "es:w:hemo", "es:w:aguar", "es:w:tipar", "es:w:haya", "es:w:son", "es:w:era"]) {
      expect(ids.has(id)).toBe(false);
      expect(esLex!.lexemes.find((l) => l.id === id)?.frequency).toBeUndefined();
    }
  });

  test("P3f: the authored topic map places words no unit teaches in their theme's unit", () => {
    const map = loadTopicUnits("es")!;
    expect(validateTopicUnits(map, { lexicon: esLex!, pack: esPack })).toEqual([]);
    const onUnit1 = ES.entries.filter((e) => e.unitId === "es-vi:unit-1").length;
    expect(onUnit1).toBeLessThan(60); // was 328 before the map
    const byId = new Map(esLex!.lexemes.map((l) => [l.id, l]));
    const verb = ES.entries.find((e) => byId.get(e.lexemeId)?.topic === "everyday" && byId.get(e.lexemeId)?.partOfSpeech === "verb" && e.unitId === "es-vi:unit-b");
    expect(verb).toBeDefined();
    const bad = { ...map, units: { ...map.units, nosuchtopic: "es-vi:unit-1", "food:verb": "es-vi:unit-zz" } };
    expect(validateTopicUnits(bad, { lexicon: esLex!, pack: esPack })).toHaveLength(2);
  });

  test("P3f: the context lint counts daily words that no sentence of the course uses", () => {
    const r = lintSyllabusContext(esPack, "es", ES, esLex!.lexemes);
    expect(r.stats.withContext + r.stats.withoutContext).toBe(ES.entries.length);
    expect(r.findings.every((f) => f.rule === "syllabus-context" && f.severity === "warn")).toBe(true);
  });

  // P4d: scripts written without spaces are read by the language plugin's dictionary tokenizer (withLexicon), so a
  // sentence of three words counts and a word inside it is found; a Latin language keeps the whitespace path.
  const miniPack = (lang: string, sentences: string[]) =>
    ({
      id: `${lang}-vi`,
      targetCode: lang,
      nativeCode: "vi",
      sections: [{ id: `${lang}-vi:section-1`, units: [{ id: `${lang}-vi:u1`, words: [], lessons: [{ id: `${lang}-vi:u1-l0`, exercises: sentences.map((s, i) => ({ id: `${lang}-vi:u1-l0-e${i}`, type: "select", mode: "targetToNative", prompt: s })) }] }] }],
    }) as unknown as typeof esPack;
  const miniCase = (lang: string, sentences: string[], surfaces: string[]) => {
    const lexicon = surfaces.map((surface, i) => ({ id: `${lang}:w:t${i}`, surface }));
    return lintSyllabusContext(miniPack(lang, sentences), lang, { entries: lexicon.map((l) => ({ lexemeId: l.id })) }, lexicon);
  };

  test("P4d: an unspaced Chinese sentence counts its words through the dictionary tokenizer", () => {
    // 鼹鼠 (mole) is in no sentence; the other four are.
    const r = miniCase("zh", ["我今天很忙。", "我们去超市。"], ["我", "今天", "忙", "超市", "鼹鼠"]);
    expect(r.stats).toEqual({ withContext: 4, withoutContext: 1 });
    expect(r.findings.map((f) => f.where)).toEqual(["zh:w:t4"]);
  });

  // The committed content of the language joins the sentences, so the words expected without context are ones no
  // course text will ever use (鼹鼠 "mole").
  test("P4d: a word is matched whole, never inside a longer stored word", () => {
    // 鼹 is inside 鼹鼠 only, so it has no sentence of its own; 鼹鼠 has one.
    const r = miniCase("zh", ["我看见鼹鼠了。"], ["我", "看见", "鼹鼠", "了", "鼹"]);
    expect(r.findings.map((f) => f.where)).toEqual(["zh:w:t4"]);
  });

  test("P4d: a one-word Chinese line is not a sentence", () => {
    const r = miniCase("zh", ["鼹鼠", "我很忙。"], ["鼹鼠", "我", "很", "忙"]);
    expect(r.findings.map((f) => f.where)).toEqual(["zh:w:t0"]);
  });

  test("P4d: Japanese is read by the dictionary tokenizer too", () => {
    const r = miniCase("ja", ["わたしは学生です。"], ["わたし", "は", "学生", "です", "鼹鼠"]);
    expect(r.findings.map((f) => f.where)).toEqual(["ja:w:t4"]);
  });

  test("P4d: a Latin-script language keeps the whitespace path (a word glued to punctuation counts, a substring does not)", () => {
    // "qq": a Latin-script code with no content folder, so no committed reading, clip or story joins the sentences.
    const r = miniCase("qq", ["Yo como pan, gracias.", "Hola amigo"], ["pan", "como", "amigo", "hola", "pa"]);
    expect(r.findings.map((f) => f.where).sort()).toEqual(["qq:w:t2", "qq:w:t3", "qq:w:t4"]);
  });
});

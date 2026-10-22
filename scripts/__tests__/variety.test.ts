import { describe, expect, test } from "bun:test";

import { loadRichLexicon } from "../lib/lexicon";
import { courseRolesFor, loadPacks, readJson } from "../lib/pipeline";
import { loadSyllabus } from "../lib/syllabus";
import { regionalFormHits, regionalForms, varietyErrors } from "../lib/variety";

const lexicon = loadRichLexicon("es");
const forms = regionalForms(lexicon);
const pack = courseRolesFor("es", loadPacks()).primary!.pack;

describe("Spanish variety (P3e)", () => {
  test("the Latin-American lexemes are regional forms of their Peninsular equivalents", () => {
    expect(forms.map((f) => [f.word, f.equivalent]).sort()).toEqual([
      ["auto", "el coche"],
      ["boleto", "el billete"],
      ["computadora", "el ordenador"],
      ["jugo", "el zumo"],
    ]);
  });

  test("regional forms are never syllabus words", () => {
    const ids = new Set(loadSyllabus("es")!.entries.map((e) => e.lexemeId));
    for (const id of ["es:w:boleto", "es:w:jugo", "es:w:auto", "es:w:computadora"]) expect(ids.has(id)).toBe(false);
    for (const id of ["es:w:billete", "es:w:zumo", "es:w:coche"]) expect(ids.has(id)).toBe(true);
  });

  test("es-vi models Peninsular text everywhere; Latin-American forms stay accepted", () => {
    expect(varietyErrors({ lang: "es", lexicon, packs: [pack], sources: [] })).toEqual([]);
    const speech = JSON.stringify(readJson("content/es/speech/items.json"));
    expect(speech).toContain("El billete cuesta dieciséis euros.");
    expect(speech).toContain("El boleto cuesta dieciséis euros.");
  });

  test("a regional form in model text is an error; in an accepted-answer list it is fine", () => {
    const doc = { exercises: [{ type: "typeAnswer", prompt: "vé", answer: "el boleto", alternatives: ["el boleto"] }] };
    expect(regionalFormHits(doc, forms, "x").join("\n")).toContain('regional form "boleto" (latam)');
    const ok = { exercises: [{ type: "typeAnswer", prompt: "vé", answer: "el billete", alternatives: ["el boleto"], requiredConcepts: [["billete", "boleto"]] }] };
    expect(regionalFormHits(ok, forms, "x")).toEqual([]);
  });
});

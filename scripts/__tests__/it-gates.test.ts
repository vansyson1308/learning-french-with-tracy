/**
 * Italian course gates (QC 2026-10-29 §3.4): each rule fires on a bad pack and
 * stays quiet on a good one.
 */
import { describe, expect, test } from "bun:test";

import type { PackSource } from "../../content/schema";
import { collectTargetText, DOUBLE_CONSONANT_CONCEPT, expectedDefiniteArticle, expectedPluralArticle, italianCourseErrors, scenarioRegisterErrors, targetTextErrors } from "../lib/languages/it-gates";

const lexicon = [
  { id: "it:w:libro", surface: "il libro", partOfSpeech: "noun", gender: "masculine" },
  { id: "it:w:amico", surface: "l'amico", partOfSpeech: "noun", gender: "masculine" },
  { id: "it:w:amica", surface: "l'amica", partOfSpeech: "noun", gender: "feminine" },
  { id: "it:w:zaino", surface: "lo zaino", partOfSpeech: "noun", gender: "masculine" },
  { id: "it:w:studente", surface: "lo studente", partOfSpeech: "noun", gender: "masculine" },
  { id: "it:w:casa", surface: "la casa", partOfSpeech: "noun", gender: "feminine" },
  { id: "it:w:insegnante", surface: "l'insegnante", partOfSpeech: "noun", gender: "masculine" },
  { id: "it:w:uovo", surface: "l'uovo", partOfSpeech: "noun", gender: "masculine" },
  { id: "it:w:ciao", surface: "ciao", partOfSpeech: "interjection" },
];
const plurals = { "it:w:libro": "i libri", "it:w:amico": "gli amici", "it:w:amica": "le amiche", "it:w:zaino": "gli zaini", "it:w:studente": "gli studenti", "it:w:casa": "le case", "it:w:uovo": "le uova" };
const auxiliaries = { avere: ["mangiato", "parlato"], essere: ["andato", "arrivato"] };
const ok = { lexicon, plurals, auxiliaries };
const ex = (id: string, extra: Record<string, unknown>) => ({ type: "typeAnswer", id, mode: "produceTarget", prompt: "x", answer: "y", ...extra });

function pack(opts: { words: string[]; exercises?: unknown[]; flow?: unknown[] }): PackSource {
  const lesson = { id: "it-vi:u0-l0", exercises: opts.exercises ?? [], ...(opts.flow ? { flow: opts.flow } : {}) };
  const unit = { id: "it-vi:unit-1", words: opts.words.map((t) => ({ target: t, native: "n", emoji: "e" })), lessons: [lesson] };
  return { id: "it-vi", sections: [{ id: "it-vi:section-1", units: [unit] }] } as unknown as PackSource;
}
const pairs = ["pala", "palla", "caro", "carro", "nono", "nonno", "sete", "sette"];
const drillFlow = (n: number) => [{ concept: DOUBLE_CONSONANT_CONCEPT }, ...Array.from({ length: n }, (_, i) => ({ exercise: `d${i}` }))];
const drill = [ex("d0", { answer: pairs.join(" ") })];
const rules = (errors: string[]) => errors.map((e) => e.split(": ")[1]);
const clean = (over: Partial<Parameters<typeof pack>[0]>) => pack({ words: [], exercises: drill, flow: drillFlow(6), ...over });

describe("Italian article rules", () => {
  test("the definite article follows the initial sound and the gender", () => {
    const cases: [string, "masculine" | "feminine", string][] = [
      ["libro", "masculine", "il"],
      ["amico", "masculine", "l'"],
      ["hotel", "masculine", "l'"],
      ["zaino", "masculine", "lo"],
      ["studente", "masculine", "lo"],
      ["gnocco", "masculine", "lo"],
      ["psicologo", "masculine", "lo"],
      ["yogurt", "masculine", "lo"],
      ["sale", "masculine", "il"],
      ["casa", "feminine", "la"],
      ["amica", "feminine", "l'"],
      ["scuola", "feminine", "la"],
    ];
    for (const [noun, gender, article] of cases) expect(expectedDefiniteArticle(noun, gender)).toBe(article);
  });

  test("the plural article follows the initial sound of the plural", () => {
    expect(expectedPluralArticle("libri", "masculine")).toBe("i");
    expect(expectedPluralArticle("amici", "masculine")).toBe("gli");
    expect(expectedPluralArticle("studenti", "masculine")).toBe("gli");
    expect(expectedPluralArticle("zaini", "masculine")).toBe("gli");
    expect(expectedPluralArticle("case", "feminine")).toBe("le");
    expect(expectedPluralArticle("amiche", "feminine")).toBe("le");
  });
});

describe("Italian course gates", () => {
  test("a clean pack passes", () => {
    expect(italianCourseErrors(clean({ words: ["il libro", "lo zaino", "l'amica", "ciao"] }), ok)).toEqual([]);
  });

  test("a taught noun needs its correct article and a plural", () => {
    expect(rules(italianCourseErrors(clean({ words: ["libro"] }), { ...ok, lexicon: [{ id: "it:w:libro", surface: "libro", partOfSpeech: "noun", gender: "masculine" }] }))).toEqual(["noun-article"]);
    expect(rules(italianCourseErrors(clean({ words: ["il zaino"] }), { ...ok, lexicon: [{ id: "it:w:zaino", surface: "il zaino", partOfSpeech: "noun", gender: "masculine" }] }))).toEqual(["noun-article"]);
    expect(rules(italianCourseErrors(clean({ words: ["il libro"] }), { ...ok, plurals: {} }))).toEqual(["noun-plural"]);
    expect(rules(italianCourseErrors(clean({ words: ["il libro"] }), { ...ok, plurals: { "it:w:libro": "gli libri" } }))).toEqual(["noun-plural"]);
  });

  test("an irregular feminine plural of a masculine noun is declared with its own article", () => {
    expect(italianCourseErrors(clean({ words: ["l'uovo"] }), ok)).toEqual([]);
    expect(rules(italianCourseErrors(clean({ words: ["il libro"] }), { ...ok, plurals: { "it:w:libro": "le libra" } }))).toEqual(["noun-plural"]);
  });

  test("an invariable noun keeps its form, and no plural is written as a dash", () => {
    const lex = [{ id: "it:w:citta", surface: "la città", partOfSpeech: "noun", gender: "feminine" }, { id: "it:w:pane", surface: "il pane", partOfSpeech: "noun", gender: "masculine" }];
    expect(italianCourseErrors(clean({ words: ["la città", "il pane"] }), { ...ok, lexicon: lex, plurals: { "it:w:citta": "le città", "it:w:pane": "—" } })).toEqual([]);
  });

  test("a target sentence with a wrong article or elision is rejected", () => {
    const bad = (s: string) => rules(italianCourseErrors(clean({ exercises: [...drill, ex("e1", { answer: s })] }), ok));
    expect(bad("il amico")).toEqual(["elision"]);
    expect(bad("il zaino")).toEqual(["elision"]);
    expect(bad("la amica")).toEqual(["elision"]);
    expect(bad("una amica")).toEqual(["elision"]);
    expect(bad("un'amico")).toEqual(["elision"]);
    expect(bad("un amica")).toEqual(["elision"]);
    expect(bad("l' amico")).toEqual(["elision"]);
    expect(bad("i amici")).toEqual(["elision"]);
    expect(bad("lo libro")).toEqual(["elision"]);
    expect(bad("al zaino")).toEqual(["elision"]);
  });

  test("clitic pronouns and correct forms stay quiet", () => {
    const good = (s: string) => italianCourseErrors(clean({ exercises: [...drill, ex("e1", { answer: s })] }), ok);
    for (const s of ["Uno e cinquanta.", "Una in tasca.", "Un'insegnante e un insegnante.", "È scritto qui.", "Lo vedo.", "La amo davvero.", "Gli parlo.", "Un amico e un'amica.", "L'amico dello studente.", "All'amica, allo zaino, al libro.", "Le case e gli studenti."]) expect(good(s)).toEqual([]);
  });

  test("the auxiliary of the passato prossimo and the plural agreement after essere", () => {
    const bad = (s: string) => rules(italianCourseErrors(clean({ exercises: [...drill, ex("e1", { answer: s })] }), ok));
    expect(bad("Ho andato a casa.")).toEqual(["auxiliary"]);
    expect(bad("Sono mangiato.")).toEqual(["auxiliary"]);
    expect(bad("Siamo andato a casa.")).toEqual(["agreement"]);
    expect(bad("Marco è andati a casa.")).toEqual(["agreement"]);
    const good = (s: string) => italianCourseErrors(clean({ exercises: [...drill, ex("e1", { answer: s })] }), ok);
    for (const s of ["Ho mangiato.", "Sono andata a casa.", "Siamo arrivati.", "Marco ha parlato."]) expect(good(s)).toEqual([]);
  });

  test("the double-consonant card needs its practice and four minimal pairs after it", () => {
    expect(rules(italianCourseErrors(pack({ words: [] }), ok))).toContain("double-consonants");
    expect(rules(italianCourseErrors(pack({ words: [], exercises: drill, flow: drillFlow(3) }), ok))).toEqual(["double-consonants"]);
    expect(rules(italianCourseErrors(pack({ words: [], exercises: [ex("d0", { answer: "pala palla" })], flow: drillFlow(6) }), ok))).toEqual(["double-consonants"]);
  });

  test("collectTargetText reads stories and clips, not translations or glossaries", () => {
    const doc = { stories: [{ sentences: [{ text: "Il libro.", translation: { vi: "x", en: "y" } }], questions: [{ text: "no" }] }], supportGlossary: [{ text: "no" }], clips: [{ segments: [{ text: "La casa." }] }] };
    expect(collectTargetText(doc)).toEqual(["Il libro.", "La casa."]);
  });

  test("targetTextErrors checks one free string (stories, readings)", () => {
    expect(targetTextErrors("il amico", ok)).toHaveLength(1);
    expect(targetTextErrors("Sono andato con un amico.", ok)).toEqual([]);
  });
});

describe("Italian scenario register", () => {
  const node = (text: string) => ({ kind: "partner", text });
  test("tu and Lei may not mix in a scenario", () => {
    expect(scenarioRegisterErrors([{ id: "s1", nodes: { a: node("Come ti chiami?"), b: node("Come si chiama Lei?") } }])).toHaveLength(1);
    expect(scenarioRegisterErrors([{ id: "s1", nodes: { a: node("Tu vuoi un caffè?"), b: node("Può ripetere, per favore?") } }])).toHaveLength(1);
    expect(scenarioRegisterErrors([{ id: "s1", nodes: { a: node("Scusi, Lei vuole un caffè?"), b: node("Buongiorno, signora.") } }])).toEqual([]);
    expect(scenarioRegisterErrors([{ id: "s1", nodes: { a: node("Come ti chiami?"), b: node("Vuoi un caffè?") } }])).toEqual([]);
  });

  test("a learner's accepted answers count too; a sentence-initial Le or La is not a register marker", () => {
    expect(scenarioRegisterErrors([{ id: "s1", nodes: { a: { kind: "learner", expected: [{ acceptedVariants: ["Come sta Lei?"] }] }, b: node("Come stai?") } }])).toHaveLength(1);
    expect(scenarioRegisterErrors([{ id: "s1", nodes: { a: node("Le case sono belle."), b: node("Come ti chiami?") } }])).toEqual([]);
  });
});

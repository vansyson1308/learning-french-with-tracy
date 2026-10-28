/**
 * German course gates (QC 2026-10-28 §2): each rule fires on a bad pack and
 * stays quiet on a good one.
 */
import { describe, expect, test } from "bun:test";

import type { PackSource } from "../../content/schema";
import { germanCourseErrors } from "../lib/languages/de-gates";

const lexicon = [
  { id: "de:w:tisch", surface: "der Tisch", partOfSpeech: "noun" },
  { id: "de:w:freund", surface: "der Freund", legacySurfaces: ["Freund"], partOfSpeech: "noun" },
  { id: "de:w:hallo", surface: "Hallo", partOfSpeech: "interjection" },
];
const ex = (id: string, extra: Record<string, unknown>) => ({ type: "typeAnswer", id, mode: "produceTarget", prompt: "x", answer: "y", ...extra });

function pack(opts: { words: string[]; exercises?: unknown[]; flow?: unknown[]; sectionIndex?: number }): PackSource {
  const lesson = { id: "de-vi:u0-l0", exercises: opts.exercises ?? [], ...(opts.flow ? { flow: opts.flow } : {}) };
  const unit = { id: "de-vi:unit-1", words: opts.words.map((t) => ({ target: t, native: "n", emoji: "e" })), lessons: [lesson] };
  const sections = Array.from({ length: 4 }, (_, i) => ({ id: `de-vi:section-${i + 1}`, units: i === (opts.sectionIndex ?? 0) ? [unit] : [] }));
  return { id: "de-vi", sections } as unknown as PackSource;
}
const v2Flow = (n: number) => ["de:concept:verb-second", "de:concept:separable-verbs"].flatMap((c) => [{ concept: c }, ...Array.from({ length: n }, (_, i) => ({ exercise: `${c}-${i}` }))]);
const ok = { lexicon, plurals: { "de:w:tisch": "-e", "de:w:freund": "-e" }, dativeChunks: ["mit dem Bus", "im Haus"] };
const rules = (errors: string[]) => errors.map((e) => e.split(": ")[1]);

describe("German course gates", () => {
  test("a clean pack passes", () => {
    expect(germanCourseErrors(pack({ words: ["der Tisch", "Hallo"], exercises: [ex("e1", { answer: "Ich fahre mit dem Bus." })], flow: v2Flow(6) }), ok)).toEqual([]);
  });

  test("a noun without its article, a missing or malformed plural", () => {
    expect(rules(germanCourseErrors(pack({ words: ["Freund"], flow: v2Flow(6) }), ok))).toEqual(["noun-article"]);
    expect(rules(germanCourseErrors(pack({ words: ["der Freund"], flow: v2Flow(6) }), { ...ok, plurals: {} }))).toEqual(["noun-plural"]);
    expect(rules(germanCourseErrors(pack({ words: ["der Tisch"], flow: v2Flow(6) }), { ...ok, plurals: { "de:w:tisch": "e" } }))).toEqual(["noun-plural"]);
  });

  test("a dative outside a declared chunk before Section 4 — and fine from Section 4 on", () => {
    const bad = [ex("e1", { answer: "Ich gebe dem Mann das Buch." })];
    expect(rules(germanCourseErrors(pack({ words: [], exercises: bad, flow: v2Flow(6) }), ok))).toEqual(["dative-chunks"]);
    expect(germanCourseErrors(pack({ words: [], exercises: bad, flow: v2Flow(6), sectionIndex: 3 }), ok)).toEqual([]);
  });

  test("verb-second and separable verbs need their card and at least 6 exercises after it", () => {
    expect(rules(germanCourseErrors(pack({ words: [] }), ok))).toEqual(["v2-separable", "v2-separable"]);
    expect(rules(germanCourseErrors(pack({ words: [], flow: v2Flow(5) }), ok))).toEqual(["v2-separable", "v2-separable"]);
  });
});

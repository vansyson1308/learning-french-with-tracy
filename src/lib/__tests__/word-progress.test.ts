/**
 * Readers of the legacy progress maps resolve words through the same id the
 * engine writes (`itemIdFor`): raw surfaces for a course without a registry,
 * `<code>:w:` ids for a registry course (es-en since P3a; fr-en since v2).
 * Before this, the legacy review queue treated srs keys as surfaces — an
 * es-en word learned after P3a (`es:w:hombre`) never came back for review —
 * and Profile counted only surface keys as "words learned" (0 for fr-en).
 */
import { describe, expect, test } from "bun:test";

import { getPack } from "../content";
import { srsEntryFor, wordStatFor, wordsLearnedCount } from "../learning/word-progress";
import { buildReviewSessionDefinition } from "../session/sources";

const T0 = Date.UTC(2026, 9, 28, 12);
const DAY = 86_400_000;
const wordsOf = (courseId: string) => getPack(courseId).sections.flatMap((s) => s.units.flatMap((u) => u.words));
const due = (days: number) => ({ interval: 1, ease: 2.5, dueAt: T0 - days * DAY, streak: 1 });

describe("legacy review queue on a registry course", () => {
  test("es-en: id-keyed srs entries come back as review exercises with their id as evidence", () => {
    const pool = wordsOf("es-en");
    const srs = { "es:w:hombre": due(2), "es:w:mujer": due(1) };
    const def = buildReviewSessionDefinition({ courseId: "es-en", course: { srs, cards: undefined }, pool, now: T0 });
    expect(def.steps).toHaveLength(2);
    const ids = def.steps.map((s) => (s.type === "exercise" ? s.evidence?.itemId : undefined)).sort();
    expect(ids).toEqual(["es:w:hombre", "es:w:mujer"]);
    const prompts = def.steps.map((s) => (s.type === "exercise" && s.exercise.type === "select" ? s.exercise.audioTarget : "")).sort();
    expect(prompts).toEqual(["el hombre", "la mujer"]);
  });

  test("a course without a registry keeps surface keys (pt-en)", () => {
    const pool = wordsOf("pt-en");
    const surface = pool[0].target;
    const def = buildReviewSessionDefinition({ courseId: "pt-en", course: { srs: { [surface]: due(1) }, cards: undefined }, pool, now: T0 });
    expect(def.steps).toHaveLength(1);
    expect(def.steps[0].type === "exercise" ? def.steps[0].evidence?.itemId : undefined).toBe(surface);
  });
});

describe("word progress readers", () => {
  const stat = { correct: 2, wrong: 0, lastSeen: T0 };

  test("stats and srs entries resolve through the course's item id", () => {
    expect(wordStatFor("es-en", { "es:w:hombre": stat }, "el hombre")).toEqual(stat);
    expect(wordStatFor("es-en", { "el hombre": stat }, "el hombre")).toBeUndefined();
    expect(wordStatFor("pt-en", { gato: stat }, "gato")).toEqual(stat);
    expect(srsEntryFor("es-en", { "es:w:mujer": due(0) }, "la mujer")).toEqual(due(0));
    expect(srsEntryFor("es-en", undefined, "la mujer")).toBeUndefined();
  });

  test("words learned counts the pack words that have a stat, whatever the key scheme", () => {
    const fr = wordsOf("fr-en");
    expect(wordsLearnedCount("fr-en", { "fr:w:homme": stat, "fr:legacy:zzz": stat }, fr)).toBe(1);
    const es = wordsOf("es-en");
    expect(wordsLearnedCount("es-en", { "es:w:hombre": stat, "es:w:mujer": stat }, es)).toBe(2);
    const pt = wordsOf("pt-en");
    expect(wordsLearnedCount("pt-en", { [pt[0].target]: stat, "not a word": stat }, pt)).toBe(1);
  });
});

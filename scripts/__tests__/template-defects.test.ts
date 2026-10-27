/**
 * P4a: the inherited-template defects (degenerate fillBlanks, romanized
 * "translations", word lists repeated across units) cannot come back.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";

import { PackSchema, type PackSource } from "../../content/schema";
import { templateDefectErrors } from "../lib/lesson-shape";

const load = (id: string): PackSource => PackSchema.parse(JSON.parse(readFileSync(`content/courses/${id}.json`, "utf8")));
const BASIC = ["de-en", "es-en", "it-en", "ja-en", "ko-en", "pt-en", "zh-en"];

function firstOf<T extends PackSource["sections"][number]["units"][number]["lessons"][number]["exercises"][number]["type"]>(pack: PackSource, type: T) {
  for (const s of pack.sections) for (const u of s.units) for (const l of u.lessons) for (const e of l.exercises) if (e.type === type) return e as Extract<typeof e, { type: T }>;
  throw new Error(`no ${type} in ${pack.id}`);
}

describe("template defects", () => {
  test("every basic pack is clean", () => {
    for (const id of BASIC) expect(templateDefectErrors(load(id), { checkWordRepeats: true })).toEqual([]);
  });

  test("the authored courses are clean (word repeats allowed there)", () => {
    for (const id of ["es-vi", "fr-en", "fr-vi"]) expect(templateDefectErrors(load(id), { checkWordRepeats: false })).toEqual([]);
  });

  test("a whole-sentence blank is rejected", () => {
    const pack = load("zh-en");
    const e = firstOf(pack, "fillBlank");
    e.sentence = "___。";
    e.options[e.correct] = "我是女孩";
    expect(templateDefectErrors(pack, { checkWordRepeats: true }).join("\n")).toContain("blank is the whole sentence");
  });

  test("a sentence without a blank, or with two, is rejected", () => {
    const pack = load("it-en");
    const e = firstOf(pack, "fillBlank");
    e.sentence = "Bevo l'acqua.";
    expect(templateDefectErrors(pack, { checkWordRepeats: true }).join("\n")).toContain("exactly one ___ (has 0)");
    e.sentence = "___ e ___.";
    expect(templateDefectErrors(pack, { checkWordRepeats: true }).join("\n")).toContain("exactly one ___ (has 2)");
  });

  test("a romanized prompt is not accepted as a translation; loanwords are", () => {
    const pack = load("ja-en");
    const e = firstOf(pack, "typeAnswer");
    e.alternatives = ["ano hito wa otoko no hito desu"];
    expect(templateDefectErrors(pack, { checkWordRepeats: true }).join("\n")).toContain("is the romanized prompt");
    const ko = load("ko-en");
    const hotel = ko.sections[0].units[4].lessons[0].exercises.find((x) => x.type === "typeAnswer");
    expect(hotel && hotel.type === "typeAnswer" && hotel.alternatives).toContain("I'm going to the hotel.");
    expect(templateDefectErrors(ko, { checkWordRepeats: true })).toEqual([]);
  });

  test("a word listed in two units of a basic pack is rejected", () => {
    const pack = load("pt-en");
    pack.sections[0].units[3].words.push(pack.sections[0].units[0].words[0]);
    expect(templateDefectErrors(pack, { checkWordRepeats: true }).join("\n")).toContain("is already listed in unit");
    expect(templateDefectErrors(pack, { checkWordRepeats: false })).toEqual([]);
  });
});

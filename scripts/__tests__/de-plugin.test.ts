/**
 * The German build plugin's regular (weak) paradigm rule (P3d(de)): the
 * linking e appears after -d/-t and after a consonant + m/n cluster, never
 * after a lengthening h, l, r or a doubled m/n.
 */
import { describe, expect, test } from "bun:test";

import { buildPlugin } from "../lib/languages";

const DE_PARADIGM = buildPlugin("de").paradigm!;

function regular(lemma: string, stem: string, linking: string): string[] {
  const errors: string[] = [];
  const cells = {
    inf: lemma,
    "pre:1s": `${stem}e`,
    "pre:2s": `${stem}${linking}st`,
    "pre:3s": `${stem}${linking}t`,
    "pre:1p": lemma,
    "pre:2p": `${stem}${linking}t`,
    "pre:3p": lemma,
    participle: `ge${stem}${linking}t`,
  };
  DE_PARADIGM.groupRules!({ lemma, group: "regular", cells }, (m) => errors.push(m));
  return errors;
}

describe("German regular paradigm rule", () => {
  test("no linking e after a lengthening h, l, r or a doubled consonant", () => {
    expect(regular("wohnen", "wohn", "")).toEqual([]);
    expect(regular("lernen", "lern", "")).toEqual([]);
    expect(regular("filmen", "film", "")).toEqual([]);
    expect(regular("spielen", "spiel", "")).toEqual([]);
  });

  test("a linking e after -d / -t and after a consonant + m / n cluster", () => {
    expect(regular("arbeiten", "arbeit", "e")).toEqual([]);
    expect(regular("atmen", "atm", "e")).toEqual([]);
    expect(regular("rechnen", "rechn", "e")).toEqual([]);
    expect(regular("öffnen", "öffn", "e")).toEqual([]);
  });

  test("a wrong regular form is reported", () => {
    expect(regular("wohnen", "wohn", "e").length).toBeGreaterThan(0);
    expect(regular("arbeiten", "arbeit", "").length).toBeGreaterThan(0);
  });
});

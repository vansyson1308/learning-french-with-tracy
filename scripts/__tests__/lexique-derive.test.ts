/**
 * Pure derivation-function tests (Phase 5A). The runner-side derive step
 * runs exactly these functions over the real artifact; here a synthetic
 * Lexique-4-shaped fixture proves each filter, aggregate and ordering rule,
 * so a silently-broken derivation cannot reach the committed artifacts.
 */
import { describe, expect, test } from "bun:test";

import type { RichLexicon } from "../../content/schema";
import {
  coreLexemeRows,
  eligibleLemmaPopulation,
  frequencyStats,
  genderSuffixStats,
  quantileOf,
  trimRow,
  verbMorphology,
} from "../lib/lexique-derive-lib";

function l4row(over: Record<string, string>): Record<string, string> {
  return {
    "1_Mot": "",
    "2_Phono": "",
    "3_Phono_IPA": "",
    "4_Lemme": "",
    "5_Cgram": "",
    "6_CgramOrtho": "",
    "7_Genre": "",
    "8_Nombre": "",
    "9_InfoVER": "",
    "10_FreqMot": "",
    "11_FreqOrtho": "",
    "12_FreqLemme": "",
    "13_CDOrtho": "",
    "14_IsLem": "",
    "33_Preval": "",
    ...over,
  };
}

const noun = (mot: string, genre: string, freq: string, over: Record<string, string> = {}) =>
  l4row({
    "1_Mot": mot,
    "4_Lemme": over.lemme ?? mot,
    "5_Cgram": "NOM",
    "7_Genre": genre,
    "8_Nombre": "s",
    "12_FreqLemme": freq,
    "13_CDOrtho": over.cd ?? "0.1",
    "14_IsLem": over.isLem ?? "1",
    ...over,
  });

describe("trimRow", () => {
  test("projects used columns with honest numeric parsing", () => {
    const t = trimRow(
      l4row({
        "1_Mot": "chat",
        "2_Phono": "Sa",
        "3_Phono_IPA": "ʃa",
        "4_Lemme": "chat",
        "5_Cgram": "NOM",
        "7_Genre": "m",
        "8_Nombre": "s",
        "10_FreqMot": "12.5",
        "12_FreqLemme": "not-a-number",
        "14_IsLem": "1",
        "33_Preval": "",
      })
    );
    expect(t.mot).toBe("chat");
    expect(t.ipa).toBe("ʃa");
    expect(t.freqMot).toBe(12.5);
    expect(t.freqLemme).toBeNull(); // non-finite → null, never coerced
    expect(t.preval).toBeNull(); // empty → null, never zero
    expect(t.isLem).toBe(true);
  });
});

describe("eligibleLemmaPopulation", () => {
  test("applies the documented filters and dedupes by (lemma, POS)", () => {
    const population = eligibleLemmaPopulation([
      noun("chat", "m", "30"),
      noun("chat", "m", "5"), // duplicate — lower freq dropped
      noun("chats", "m", "30", { lemme: "chat", isLem: "0" }), // inflected — dropped
      noun("Paris", "m", "500"), // proper noun — dropped
      noun("pomme de terre", "f", "12"), // multiword — dropped
      l4row({ "1_Mot": "le", "4_Lemme": "le", "5_Cgram": "ART:def", "12_FreqLemme": "25000", "14_IsLem": "1" }), // POS — dropped
      l4row({ "1_Mot": "manger", "4_Lemme": "manger", "5_Cgram": "VER", "12_FreqLemme": "120", "14_IsLem": "1" }),
      noun("gare", "f", ""), // no parseable frequency — dropped
    ]);
    expect(population.map((e) => `${e.lemma}|${e.partOfSpeech}|${e.freqLemme}`)).toEqual([
      "manger|verb|120",
      "chat|noun|30",
    ]);
  });
});

describe("quantileOf (nearest-rank, deterministic)", () => {
  const sorted = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  test("nearest-rank values", () => {
    expect(quantileOf(sorted, 0.5)).toBe(5);
    expect(quantileOf(sorted, 0.9)).toBe(9);
    expect(quantileOf(sorted, 0.99)).toBe(10);
    expect(quantileOf(sorted, 0.1)).toBe(1);
    expect(quantileOf([42], 0.5)).toBe(42);
  });

  test("empty population is a hard error", () => {
    expect(() => quantileOf([], 0.5)).toThrow(/empty population/);
  });
});

describe("frequencyStats", () => {
  const rows = [
    noun("chat", "m", "30", { cd: "0.9", "33_Preval": "99" }),
    noun("gare", "f", "10", { cd: "0.5" }),
    l4row({ "1_Mot": "manger", "4_Lemme": "manger", "5_Cgram": "VER", "12_FreqLemme": "120", "13_CDOrtho": "0.7", "14_IsLem": "1" }),
    l4row({ "1_Mot": "xx", "4_Lemme": "xx", "5_Cgram": "MYSTERY", "12_FreqLemme": "1", "14_IsLem": "1" }),
    l4row({ "1_Mot": "yy", "4_Lemme": "yy", "5_Cgram": "MYSTERY", "12_FreqLemme": "1", "14_IsLem": "1" }),
  ];

  test("population, quantiles, top list and unknown-cgram report", () => {
    const stats = frequencyStats(rows);
    expect(stats.population.size).toBe(3);
    expect(stats.population.byPos).toEqual({ noun: 2, verb: 1 });
    expect(stats.freqLemme.min).toBe(10);
    expect(stats.freqLemme.max).toBe(120);
    expect(stats.freqLemme.quantiles.p50).toBe(30);
    expect(stats.topByFreqLemme[0]).toEqual({
      lemma: "manger",
      partOfSpeech: "verb",
      freqLemme: 120,
      cdOrtho: 0.7,
    });
    expect(stats.unknownCgramValues).toEqual({ MYSTERY: 2 });
    expect(stats.preval).toEqual({ present: 1, min: 99, max: 99 });
    expect(stats.totalDataRows).toBe(5);
  });

  test("an empty eligible population refuses to emit statistics", () => {
    expect(() => frequencyStats([noun("Paris", "m", "500")])).toThrow(/empty eligible lemma population/);
  });
});

describe("genderSuffixStats", () => {
  const rows = [
    noun("nation", "f", "50"),
    noun("addition", "f", "20"),
    noun("bastion", "m", "5"),
    noun("château", "m", "40"),
    noun("élève", "e", "30"),
    noun("tour", "m", "25"),
    noun("tour", "f", "15"), // two-gender homograph — counts once per gender
    noun("Paris", "m", "500"), // proper noun — excluded
    noun("chats", "m", "1", { lemme: "chat", isLem: "0" }), // inflected — excluded
  ];

  test("population counts one entry per (lemma, gender), épicène included", () => {
    const stats = genderSuffixStats(rows, 2);
    expect(stats.population.size).toBe(7);
    expect(stats.population.byGenre).toEqual({ m: 3, f: 3, e: 1 });
  });

  test("researched suffixes aggregate over the population", () => {
    const stats = genderSuffixStats(rows, 2);
    const tion = stats.researchedSuffixes.find((s) => s.ending === "tion");
    expect(tion).toEqual({ ending: "tion", m: 1, f: 2, e: 0, total: 3 });
    const eau = stats.researchedSuffixes.find((s) => s.ending === "eau");
    expect(eau).toEqual({ ending: "eau", m: 1, f: 0, e: 0, total: 1 });
  });

  test("data-driven endings honor the minimum count and sort by total", () => {
    const stats = genderSuffixStats(rows, 3);
    const on = stats.dataDrivenEndings.find((s) => s.ending === "on");
    expect(on).toEqual({ ending: "on", m: 1, f: 2, e: 0, total: 3 });
    const ion = stats.dataDrivenEndings.find((s) => s.ending === "ion");
    expect(ion).toEqual({ ending: "ion", m: 1, f: 2, e: 0, total: 3 });
    // "ur"/"our" appear only twice (tour m + tour f) — below minCount 3.
    expect(stats.dataDrivenEndings.find((s) => s.ending === "ur")).toBeUndefined();
    for (let i = 1; i < stats.dataDrivenEndings.length; i++) {
      expect(stats.dataDrivenEndings[i - 1].total).toBeGreaterThanOrEqual(stats.dataDrivenEndings[i].total);
    }
  });
});

describe("verbMorphology", () => {
  const rows = [
    l4row({ "1_Mot": "être", "4_Lemme": "être", "5_Cgram": "VER", "9_InfoVER": "inf", "14_IsLem": "1", "10_FreqMot": "300" }),
    l4row({ "1_Mot": "suis", "4_Lemme": "être", "5_Cgram": "AUX", "9_InfoVER": "ind:pre:1", "8_Nombre": "s", "10_FreqMot": "900" }),
    l4row({ "1_Mot": "sommes", "4_Lemme": "être", "5_Cgram": "VER", "9_InfoVER": "ind:pre:1", "8_Nombre": "p", "10_FreqMot": "80" }),
    l4row({ "1_Mot": "accusons", "4_Lemme": "accuser", "5_Cgram": "VER", "9_InfoVER": "ind:pre:1,imp:pre:1", "8_Nombre": "p" }),
    l4row({ "1_Mot": "chanté", "4_Lemme": "chanter", "5_Cgram": "VER", "9_InfoVER": "par:pas:" }),
    l4row({ "1_Mot": "chat", "4_Lemme": "chat", "5_Cgram": "NOM", "7_Genre": "m" }), // not a verb row
  ];

  test("collects VER and AUX rows per requested lemma", () => {
    const morph = verbMorphology(rows, ["être", "aimer"]);
    const etre = morph.verbs.find((v) => v.lemma === "être");
    expect(etre?.found).toBe(true);
    expect(etre?.rows.map((r) => r.mot)).toEqual(["être", "sommes", "suis"]);
    expect(etre?.rows.find((r) => r.mot === "suis")?.cgram).toBe("AUX");
    expect(etre?.rows.find((r) => r.mot === "suis")?.nombre).toBe("s");
    const aimer = morph.verbs.find((v) => v.lemma === "aimer");
    expect(aimer?.found).toBe(false);
    expect(aimer?.rows).toEqual([]);
  });

  test("inventories raw InfoVER values and their atomic analyses", () => {
    const morph = verbMorphology(rows, []);
    expect(morph.infoVerInventory["ind:pre:1"]).toBe(2);
    expect(morph.infoVerInventory["ind:pre:1,imp:pre:1"]).toBe(1);
    expect(morph.infoVerInventory["par:pas:"]).toBe(1);
    expect(morph.atomicAnalyses["ind:pre:1"]).toBe(3); // comma-join contributes
    expect(morph.atomicAnalyses["imp:pre:1"]).toBe(1);
  });
});

describe("coreLexemeRows", () => {
  const lexicon: RichLexicon = {
    version: 1,
    language: "fr",
    lexemes: [
      {
        id: "fr:w:chat",
        surface: "le chat",
        lemma: "chat",
        lookupForm: "chat",
        partOfSpeech: "noun",
        gender: "masculine",
        nativeGloss: "the cat",
        topic: "animals",
        examples: [{ fr: "Le chat dort.", en: "The cat sleeps.", source: "original-french-lexicon" }],
        sourceRefs: [{ source: "original-french-lexicon" }],
      },
      {
        id: "fr:w:au-revoir",
        surface: "au revoir",
        lemma: "au revoir",
        lookupForm: "au revoir",
        partOfSpeech: "expression",
        nativeGloss: "goodbye",
        topic: "greetings",
        examples: [{ fr: "Au revoir !", en: "Goodbye!", source: "original-french-lexicon" }],
        sourceRefs: [{ source: "original-french-lexicon" }],
      },
    ],
  };
  const rows = [
    noun("chat", "m", "30"),
    noun("chats", "m", "30", { lemme: "chat", isLem: "0", "8_Nombre": "p" }),
    noun("gare", "f", "10"),
  ];

  test("separates form rows from other lemma inflections, expressions collect nothing", () => {
    const core = coreLexemeRows(lexicon, rows);
    const chat = core.entries.find((e) => e.id === "fr:w:chat");
    expect(chat?.formRows.map((r) => r.mot)).toEqual(["chat"]);
    expect(chat?.lemmaRows.map((r) => r.mot)).toEqual(["chats"]);
    const expr = core.entries.find((e) => e.id === "fr:w:au-revoir");
    expect(expr?.formRows).toEqual([]);
    expect(expr?.lemmaRows).toEqual([]);
    expect(core.audit.find((r) => r.id === "fr:w:chat")?.status).toBe("matched");
    expect(core.audit.find((r) => r.id === "fr:w:au-revoir")?.status).toBe("not-applicable");
  });
});

/**
 * 54-core cross-check tests (Phase 5A §13–15): every status the report can
 * emit is proven to fire on a synthetic fixture, and the IPA comparison
 * normalization is pinned exactly (nothing beyond the documented folds may
 * silently agree).
 */
import { describe, expect, test } from "bun:test";

import type { RichLexicon } from "../../content/schema";
import {
  crossCheckCore,
  normalizeIpaForComparison,
} from "../lib/lexicon-crosscheck";
import { coreLexemeRows } from "../lib/lexique-derive-lib";

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

const noun = (mot: string, genre: string, ipa: string, freq: string) =>
  l4row({
    "1_Mot": mot,
    "4_Lemme": mot,
    "5_Cgram": "NOM",
    "7_Genre": genre,
    "8_Nombre": "s",
    "3_Phono_IPA": ipa,
    "12_FreqLemme": freq,
    "14_IsLem": "1",
  });

function lexeme(over: Partial<RichLexicon["lexemes"][number]> & { id: string }): RichLexicon["lexemes"][number] {
  return {
    surface: over.lookupForm ?? "x",
    lemma: over.lookupForm ?? "x",
    lookupForm: "x",
    partOfSpeech: "noun",
    gender: "masculine",
    nativeGloss: "gloss",
    topic: "animals",
    examples: [{ fr: "Exemple.", en: "Example.", source: "original-french-lexicon" }],
    sourceRefs: [{ source: "original-french-lexicon" }],
    ...over,
  };
}

function lexiconOf(...lexemes: RichLexicon["lexemes"]): RichLexicon {
  return { version: 1, language: "fr", lexemes };
}

function reportFor(lexicon: RichLexicon, rows: Record<string, string>[]) {
  return crossCheckCore(lexicon, coreLexemeRows(lexicon, rows));
}

describe("normalizeIpaForComparison", () => {
  test("documented folds only", () => {
    expect(normalizeIpaForComparison("bɔ̃.ʒuʁ")).toBe(normalizeIpaForComparison("bɔ̃ʒuʁ"));
    expect(normalizeIpaForComparison("ˈʃa")).toBe(normalizeIpaForComparison("ʃa"));
    expect(normalizeIpaForComparison("paʀi")).toBe(normalizeIpaForComparison("paʁi"));
    expect(normalizeIpaForComparison("ɡaʁ")).toBe(normalizeIpaForComparison("gaʁ"));
    // NFD vs NFC nasal (o + combining tilde vs precomposed).
    expect(normalizeIpaForComparison("bɔ̃")).toBe(normalizeIpaForComparison("bɔ̃"));
    // Real segmental differences never fold away.
    expect(normalizeIpaForComparison("ʃa")).not.toBe(normalizeIpaForComparison("sa"));
    expect(normalizeIpaForComparison("ʒuʁ")).not.toBe(normalizeIpaForComparison("ʒyʁ"));
  });
});

describe("crossCheckCore", () => {
  test("full agreement: matched noun with equal gender and normalized-equal IPA", () => {
    const lex = lexeme({
      id: "fr:w:chat",
      surface: "le chat",
      lemma: "chat",
      lookupForm: "chat",
      pronunciation: { value: "ˈʃa", notation: "ipa", source: "original-french-lexicon" },
    });
    const report = reportFor(lexiconOf(lex), [noun("chat", "m", "ʃa", "30")]);
    const item = report.items[0];
    expect(item.overall).toBe("agree");
    const by = Object.fromEntries(item.fields.map((f) => [f.field, f.status]));
    expect(by.lookup).toBe("agree");
    expect(by.lemma).toBe("agree");
    expect(by.partOfSpeech).toBe("agree");
    expect(by.gender).toBe("agree");
    expect(by.pronunciation).toBe("agree");
    // Frequency not yet activated — recorded honestly, not a conflict.
    expect(by.frequency).toBe("authored-missing");
  });

  test("gender conflict is a disagree and lands in the attention queue", () => {
    const lex = lexeme({ id: "fr:w:gare", lookupForm: "gare", lemma: "gare", surface: "la gare", gender: "masculine" });
    const report = reportFor(lexiconOf(lex), [noun("gare", "f", "ɡaʁ", "10")]);
    const item = report.items[0];
    expect(item.fields.find((f) => f.field === "gender")?.status).toBe("disagree");
    expect(item.overall).toBe("attention");
  });

  test("épicène source gender never silently satisfies an authored m/f", () => {
    const lex = lexeme({ id: "fr:w:eleve", lookupForm: "élève", lemma: "élève", surface: "l'élève" });
    const report = reportFor(lexiconOf(lex), [noun("élève", "e", "elɛv", "25")]);
    const gender = report.items[0].fields.find((f) => f.field === "gender");
    expect(gender?.status).toBe("ambiguous");
    expect(gender?.note).toContain("épicène");
    expect(report.items[0].overall).toBe("attention");
  });

  test("authored both + épicène source agree", () => {
    const lex = lexeme({ id: "fr:w:eleve", lookupForm: "élève", lemma: "élève", surface: "élève", gender: "both" });
    const report = reportFor(lexiconOf(lex), [noun("élève", "e", "elɛv", "25")]);
    expect(report.items[0].fields.find((f) => f.field === "gender")?.status).toBe("agree");
  });

  test("real IPA difference disagrees with an investigation note", () => {
    const lex = lexeme({
      id: "fr:w:chat",
      lookupForm: "chat",
      lemma: "chat",
      surface: "le chat",
      pronunciation: { value: "sa", notation: "ipa", source: "original-french-lexicon" },
    });
    const report = reportFor(lexiconOf(lex), [noun("chat", "m", "ʃa", "30")]);
    const pron = report.items[0].fields.find((f) => f.field === "pronunciation");
    expect(pron?.status).toBe("disagree");
    expect(pron?.note).toContain("never auto-correct");
    expect(report.items[0].overall).toBe("attention");
  });

  test("a word absent from the source is external-missing AND attention", () => {
    const lex = lexeme({ id: "fr:w:ghost", lookupForm: "fantômette", lemma: "fantômette", surface: "fantômette" });
    const report = reportFor(lexiconOf(lex), [noun("chat", "m", "ʃa", "30")]);
    const item = report.items[0];
    expect(item.fields.find((f) => f.field === "lookup")?.status).toBe("external-missing");
    expect(item.overall).toBe("attention");
  });

  test("form present only under other readings → disagree with the observed readings", () => {
    const lex = lexeme({ id: "fr:w:manger", lookupForm: "manger", lemma: "manger", surface: "manger", partOfSpeech: "verb", gender: undefined });
    // Source knows "manger" only as a noun here.
    const report = reportFor(lexiconOf(lex), [noun("manger", "m", "mɑ̃ʒe", "5")]);
    const item = report.items[0];
    expect(item.matchStatus).toBe("unmatched");
    expect(item.fields.find((f) => f.field === "lemma")?.status).toBe("disagree");
    expect(item.fields.find((f) => f.field === "lemma")?.external).toContain("manger/NOM");
    expect(item.overall).toBe("attention");
  });

  test("expressions are not-applicable end to end", () => {
    const lex = lexeme({
      id: "fr:w:au-revoir",
      surface: "au revoir",
      lemma: "au revoir",
      lookupForm: "au revoir",
      partOfSpeech: "expression",
      gender: undefined,
    });
    const report = reportFor(lexiconOf(lex), [noun("chat", "m", "ʃa", "30")]);
    expect(report.items[0].overall).toBe("not-applicable");
    expect(report.summary.items).toEqual({ "not-applicable": 1 });
  });

  test("activated frequency agrees only on the exact raw value", () => {
    const agree = lexeme({
      id: "fr:w:chat",
      lookupForm: "chat",
      lemma: "chat",
      surface: "le chat",
      frequency: { source: "lexique-4", rawValue: 30, rank: 1, band: "very-common" },
    });
    const drift = lexeme({
      id: "fr:w:gare",
      lookupForm: "gare",
      lemma: "gare",
      surface: "la gare",
      gender: "feminine",
      frequency: { source: "lexique-4", rawValue: 11, rank: 2, band: "common" },
    });
    const report = reportFor(lexiconOf(agree, drift), [
      noun("chat", "m", "ʃa", "30"),
      noun("gare", "f", "ɡaʁ", "10"),
    ]);
    expect(report.items[0].fields.find((f) => f.field === "frequency")?.status).toBe("agree");
    expect(report.items[1].fields.find((f) => f.field === "frequency")?.status).toBe("disagree");
  });

  test("ligature digraph lemma (oeuf for œuf) agrees with a documented note", () => {
    const lex = lexeme({
      id: "fr:w:oeuf",
      surface: "l'œuf",
      lemma: "œuf",
      lookupForm: "œuf",
      pronunciation: { value: "œf", notation: "ipa", source: "original-french-lexicon" },
    });
    const report = reportFor(lexiconOf(lex), [noun("oeuf", "m", "œf", "24")]);
    const item = report.items[0];
    expect(item.matchStatus).toBe("matched");
    const lemma = item.fields.find((f) => f.field === "lemma");
    expect(lemma?.status).toBe("agree");
    expect(lemma?.note).toContain("digraph");
    expect(item.overall).toBe("agree");
  });

  test("a documented override supplies the evidence row; the POS divergence stays flagged", () => {
    const lex = lexeme({
      id: "fr:w:bonjour",
      surface: "bonjour",
      lemma: "bonjour",
      lookupForm: "bonjour",
      partOfSpeech: "interjection",
      gender: undefined,
      pronunciation: { value: "bɔ̃ʒuʁ", notation: "ipa", source: "lexique-4" },
      frequency: { source: "lexique-4", rawValue: 483.788, band: "very-common" },
    });
    const rows = [noun("bonjour", "m", "bɔ̃ʒuʁ", "483.788")];
    const overrides = new Map([["fr:w:bonjour", "bonjour|NOM|m|s"]]);
    const report = crossCheckCore(lexiconOf(lex), coreLexemeRows(lexiconOf(lex), rows), overrides);
    const item = report.items[0];
    expect(item.matchStatus).toBe("unmatched");
    expect(item.overrideKey).toBe("bonjour|NOM|m|s");
    const by = Object.fromEntries(item.fields.map((f) => [f.field, f.status]));
    // Fields compare against the adopted row, not against nothing.
    expect(by.lemma).toBe("agree");
    expect(by.pronunciation).toBe("agree");
    expect(by.frequency).toBe("agree");
    // The real taxonomy divergence stays visible, with the disposition note.
    const pos = item.fields.find((f) => f.field === "partOfSpeech");
    expect(pos?.status).toBe("disagree");
    expect(pos?.note).toContain("documented override");
    expect(item.overall).toBe("attention");
  });

  test("summary counts add up per field", () => {
    const lex = lexeme({ id: "fr:w:chat", lookupForm: "chat", lemma: "chat", surface: "le chat" });
    const report = reportFor(lexiconOf(lex), [noun("chat", "m", "ʃa", "30")]);
    expect(report.summary.items).toEqual({ agree: 1 });
    expect(report.summary.fields.lookup).toEqual({ agree: 1 });
    expect(report.summary.fields.pronunciation).toEqual({ "authored-missing": 1 });
  });

  test("a subset missing a lexeme is a hard error, never a silent skip", () => {
    const lexA = lexeme({ id: "fr:w:chat", lookupForm: "chat", lemma: "chat", surface: "le chat" });
    const lexB = lexeme({ id: "fr:w:gare", lookupForm: "gare", lemma: "gare", surface: "la gare", gender: "feminine" });
    const core = coreLexemeRows(lexiconOf(lexA), [noun("chat", "m", "ʃa", "30")]);
    expect(() => crossCheckCore(lexiconOf(lexA, lexB), core)).toThrow(/missing lexeme fr:w:gare/);
  });
});

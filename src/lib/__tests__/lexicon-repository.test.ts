/**
 * GeneratedLexiconRepository (web/test tier) over the real compiled
 * fallback data, plus the synchronous runtime-index accessor. The
 * repository is read-only lexicon data — learner state never appears here.
 */
import { describe, expect, test } from "bun:test";

import frWebFallback from "../../content/lexicon/fr-web-fallback.json";
import {
  allLexemeMeta,
  articleCueFor,
  lexemeMetaFor,
  lexiconIndexContentHash,
} from "../learning/lexicon-index";
import {
  GeneratedLexiconRepository,
  type GeneratedLexiconData,
} from "../lexicon/generated-repository";

const repo = new GeneratedLexiconRepository(frWebFallback as GeneratedLexiconData);

describe("GeneratedLexiconRepository over the real compiled data", () => {
  test("getById returns full detail for a known id", async () => {
    const homme = await repo.getById("fr:w:homme");
    expect(homme).not.toBeNull();
    expect(homme!.surface).toBe("l'homme");
    expect(homme!.lookupForm).toBe("homme");
    expect(homme!.lemma).toBe("homme");
    expect(homme!.pos).toBe("noun");
    expect(homme!.gender).toBe("masculine");
    expect(homme!.gloss).toBe("the man");
    expect(homme!.pronunciation).toEqual({ value: "ɔm", notation: "ipa" });
    expect(homme!.examples.length).toBeGreaterThanOrEqual(1);
    // Authored ref first, then the adopted Lexique 4 row (authored order is
    // the cross-tier contract).
    expect(homme!.sourceRefs).toEqual([
      { source: "original-french-lexicon" },
      { source: "lexique-4", key: "homme|NOM|m|s" },
    ]);
    // Real measurement: homme is the 57th most frequent learnable lemma.
    expect(homme!.frequency).toEqual({ band: "very-common", rank: 57, perMillion: 1248.636 });
  });

  test("getById returns null for unknown ids", async () => {
    expect(await repo.getById("fr:w:ghost")).toBeNull();
    expect(await repo.getById("")).toBeNull();
  });

  test("search finds accented words from unaccented queries and vice versa", async () => {
    expect((await repo.search("garcon")).map((r) => r.id)).toEqual(["fr:w:garcon"]);
    expect((await repo.search("garçon")).map((r) => r.id)).toEqual(["fr:w:garcon"]);
    expect((await repo.search("oeuf")).map((r) => r.id)).toEqual(["fr:w:oeuf"]);
    expect((await repo.search("œuf")).map((r) => r.id)).toEqual(["fr:w:oeuf"]);
    expect((await repo.search("plait")).map((r) => r.id)).toEqual(["fr:w:s-il-vous-plait"]);
  });

  test("search matches glosses and prefixes; empty and garbage queries are empty", async () => {
    expect((await repo.search("egg")).map((r) => r.id)).toEqual(["fr:w:oeuf"]);
    const gar = (await repo.search("gar")).map((r) => r.id);
    expect(gar).toContain("fr:w:garcon");
    expect(gar).toContain("fr:w:gare");
    expect(await repo.search("")).toEqual([]);
    expect(await repo.search("   ")).toEqual([]);
    expect(await repo.search("zzz")).toEqual([]);
  });

  test("list: course order, alphabetical, and pos filter", async () => {
    const course = await repo.list();
    expect(course.length).toBe(54);
    expect(course[0].id).toBe("fr:w:homme");
    const alpha = await repo.list({ sort: "alpha" });
    // âne sorts under A with the accent-folded sort key
    expect(alpha.map((r) => r.id).indexOf("fr:w:ane")).toBeLessThan(
      alpha.map((r) => r.id).indexOf("fr:w:billet")
    );
    // 54 total − 2 verbs − 2 adverbs (oui/non) − 5 interjections − 3 expressions = 42 nouns
    const nouns = await repo.list({ pos: "noun" });
    expect(nouns.every((r) => r.pos === "noun")).toBe(true);
    expect(nouns.length).toBe(42);
    const expressions = await repo.list({ pos: "expression" });
    expect(expressions.map((r) => r.id).sort()).toEqual([
      "fr:w:au-revoir",
      "fr:w:bonne-nuit",
      "fr:w:s-il-vous-plait",
    ]);
  });

  test("frequency sort is supported and orders by raw per-million descending", async () => {
    expect(await repo.supportsFrequencySort()).toBe(true);
    const byFreq = await repo.list({ sort: "frequency" });
    const ids = byFreq.map((r) => r.id);
    // Real Lexique 4 measurements: non (4070.88/M) > oui > homme > merci.
    expect(ids.slice(0, 4)).toEqual(["fr:w:non", "fr:w:oui", "fr:w:homme", "fr:w:merci"]);
    // merci has no population rank (ONO category) yet sorts by its raw
    // frequency — rank is never the sort key.
    expect(ids.indexOf("fr:w:merci")).toBeLessThan(ids.indexOf("fr:w:femme"));
    // The three unmeasured expressions sink to the end in course order.
    expect(ids.slice(-3)).toEqual(["fr:w:au-revoir", "fr:w:s-il-vous-plait", "fr:w:bonne-nuit"]);
  });

  test("getExamples returns the authored example pairs", async () => {
    const examples = await repo.getExamples("fr:w:chat");
    expect(examples).toEqual([{ fr: "Le chat boit du lait.", en: "The cat is drinking milk." }]);
    expect(await repo.getExamples("fr:w:ghost")).toEqual([]);
  });

  test("acts as the test tier with an injected fixture", async () => {
    const fixture = new GeneratedLexiconRepository({
      contentHash: "test",
      entries: [
        {
          id: "fr:w:x",
          surface: "le x",
          lookupForm: "x",
          lemma: "x",
          gloss: "the x",
          pos: "noun",
          gender: "masculine",
          examples: [],
          sourceRefs: [{ source: "original-french-lexicon" }],
        },
      ],
    });
    expect((await fixture.list()).length).toBe(1);
    expect(await fixture.getById("fr:w:x")).not.toBeNull();
  });
});

describe("license artifacts in the compiled dataset (§101)", () => {
  test("the web fallback carries the dataset license and full source attributions", () => {
    const data = frWebFallback as GeneratedLexiconData & {
      datasetLicense: string;
      sources: { id: string; license: string; attribution: string; url: string }[];
    };
    expect(data.datasetLicense).toBe("CC-BY-SA-4.0");
    expect(data.sources.length).toBeGreaterThanOrEqual(1);
    for (const s of data.sources) {
      expect(s.license.length).toBeGreaterThan(0);
      expect(s.attribution.length).toBeGreaterThan(0);
      expect(s.url.length).toBeGreaterThan(0);
    }
    // Every sourceRef in shipped entries points at a shipped source record.
    const ids = new Set(data.sources.map((s) => s.id));
    for (const e of data.entries) {
      for (const ref of e.sourceRefs) expect(ids.has(ref.source)).toBe(true);
    }
  });
});

describe("runtime lexicon index (session-critical accessor)", () => {
  test("covers all 54 lexemes with pronunciation, example and topic", () => {
    const all = allLexemeMeta();
    expect(all.length).toBe(54);
    for (const meta of all) {
      expect(meta.pronunciation?.notation).toBe("ipa");
      expect(meta.example?.fr.length).toBeGreaterThan(0);
      expect(meta.topic).toBeDefined();
    }
  });

  test("lookups are safe on unknown/null input", () => {
    expect(lexemeMetaFor("fr:w:chat")?.gloss).toBe("the cat");
    expect(lexemeMetaFor("fr:legacy:xyz")).toBeUndefined();
    expect(lexemeMetaFor(undefined)).toBeUndefined();
    expect(lexemeMetaFor(null)).toBeUndefined();
  });

  test("article cues derive from the authored surface only", () => {
    expect(articleCueFor(lexemeMetaFor("fr:w:chat")!)).toBe("le");
    expect(articleCueFor(lexemeMetaFor("fr:w:vache")!)).toBe("la");
    expect(articleCueFor(lexemeMetaFor("fr:w:eau")!)).toBe("l'");
    expect(articleCueFor(lexemeMetaFor("fr:w:monsieur")!)).toBeUndefined();
    expect(articleCueFor(lexemeMetaFor("fr:w:manger")!)).toBeUndefined();
  });

  test("index and web fallback carry the same content hash (one compile)", () => {
    expect(lexiconIndexContentHash()).toBe((frWebFallback as GeneratedLexiconData).contentHash);
  });

  test("confusables in the index are symmetric", () => {
    for (const meta of allLexemeMeta()) {
      for (const other of meta.confusables ?? []) {
        expect(lexemeMetaFor(other)?.confusables ?? []).toContain(meta.id);
      }
    }
  });
});

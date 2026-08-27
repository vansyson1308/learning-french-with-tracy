/**
 * Rich-lexicon pipeline tests (Phase 4). Two layers:
 *  - the committed data itself validates (the real gate), and the
 *    sacrosanct triple lock holds against the real files;
 *  - mutation tests over a synthetic fixture prove each rule actually
 *    fires, so a silently-disabled audit cannot pass review.
 */
import { describe, expect, test } from "bun:test";

import { FR_LEXEME_IDS } from "../../src/lib/learning/ids-fr";
import type { RichLexicon, SourceManifest } from "../../content/schema";
import { SourceManifestSchema } from "../../content/schema";
import {
  derivedSurfaceMap,
  frequencyBandFor,
  genderEvidenceInText,
  lexiqueGenderFor,
  lexiquePosFor,
  loadRichLexicon,
  matchLexemes,
  parseLexiqueTsv,
  selectCandidatePool,
  splitSurfaceArticle,
  validateLexicon,
  validateLexiconData,
} from "../lib/lexicon";
import { readJson } from "../lib/pipeline";

describe("committed lexicon data", () => {
  test("validateLexicon passes on the real content", () => {
    const { errors } = validateLexicon();
    expect(errors).toEqual([]);
  });

  test("triple lock holds: rich lexicon ≡ frozen map ≡ runtime map (54 ids)", () => {
    const rich = derivedSurfaceMap(loadRichLexicon());
    const frozen = readJson("content/fr/lexemes.json") as Record<string, string>;
    const canon = (m: Record<string, string>) => JSON.stringify(Object.entries(m).sort());
    expect(canon(rich)).toBe(canon(frozen));
    expect(canon(frozen)).toBe(canon(FR_LEXEME_IDS));
    expect(Object.keys(rich).length).toBe(54);
  });

  test("every lexeme ships pronunciation labeled ipa from the authored source", () => {
    for (const lex of loadRichLexicon().lexemes) {
      expect(lex.pronunciation?.notation).toBe("ipa");
      expect(lex.pronunciation?.source).toBe("original-french-lexicon");
    }
  });

  test("no lexeme carries frequency or any lexique-4 reference while unretrieved", () => {
    for (const lex of loadRichLexicon().lexemes) {
      expect(lex.frequency).toBeUndefined();
      const sources = [
        ...lex.sourceRefs.map((r) => r.source),
        ...lex.examples.map((e) => e.source),
        lex.pronunciation?.source,
      ];
      expect(sources).not.toContain("lexique-4");
    }
  });
});

describe("surface article helpers", () => {
  test("splitSurfaceArticle handles le/la/l'/none", () => {
    expect(splitSurfaceArticle("le chat")).toEqual({ article: "le", rest: "chat" });
    expect(splitSurfaceArticle("la vache")).toEqual({ article: "la", rest: "vache" });
    expect(splitSurfaceArticle("l'eau")).toEqual({ article: "l'", rest: "eau" });
    expect(splitSurfaceArticle("bonjour")).toEqual({ article: null, rest: "bonjour" });
    expect(splitSurfaceArticle("manger")).toEqual({ article: null, rest: "manger" });
  });

  test("genderEvidenceInText finds gendered determiners with word boundaries", () => {
    expect(genderEvidenceInText("Je mange un œuf.", "œuf")).toEqual(["masculine"]);
    expect(genderEvidenceInText("La pomme est rouge.", "pomme")).toEqual(["feminine"]);
    expect(genderEvidenceInText("Une pomme, merci.", "pomme")).toEqual(["feminine"]);
    // Elision carries no gender.
    expect(genderEvidenceInText("Je bois de l'eau.", "eau")).toEqual([]);
    // Word boundary: "le poulet" must not count as evidence for "poule".
    expect(genderEvidenceInText("Le poulet est bon.", "poule")).toEqual([]);
    // Case-insensitive at sentence start.
    expect(genderEvidenceInText("Le chat dort.", "chat")).toEqual(["masculine"]);
  });
});

// ---------------------------------------------------------------------------
// Synthetic fixture for mutation tests
// ---------------------------------------------------------------------------

function fixtureLexicon(): RichLexicon {
  return {
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
        pronunciation: { value: "ʃa", notation: "ipa", source: "original-french-lexicon" },
        topic: "animals",
        examples: [{ fr: "Le chat dort.", en: "The cat is sleeping.", source: "original-french-lexicon" }],
        sourceRefs: [{ source: "original-french-lexicon" }],
      },
      {
        id: "fr:w:manger",
        surface: "manger",
        lemma: "manger",
        lookupForm: "manger",
        partOfSpeech: "verb",
        nativeGloss: "to eat",
        pronunciation: { value: "mɑ̃ʒe", notation: "ipa", source: "original-french-lexicon" },
        topic: "food",
        examples: [{ fr: "Je mange du pain.", en: "I am eating bread.", source: "original-french-lexicon" }],
        sourceRefs: [{ source: "original-french-lexicon" }],
      },
      {
        id: "fr:w:au-revoir",
        surface: "au revoir",
        lemma: "au revoir",
        lookupForm: "au revoir",
        partOfSpeech: "expression",
        nativeGloss: "goodbye",
        pronunciation: { value: "o ʁəvwaʁ", notation: "ipa", source: "original-french-lexicon" },
        topic: "greetings",
        examples: [{ fr: "Au revoir, madame.", en: "Goodbye, madam.", source: "original-french-lexicon" }],
        sourceRefs: [{ source: "original-french-lexicon" }],
      },
    ],
  };
}

function fixtureManifest(status: "not-retrieved" | "retrieved" = "not-retrieved"): SourceManifest {
  if (status === "retrieved") {
    return SourceManifestSchema.parse({
      source: manifestSource(),
      retrieval: {
        status: "retrieved",
        artifactFilename: "Lexique4.tsv",
        url: "http://www.lexique.org/databases/Lexique4/Lexique4.tsv",
        retrievedAt: "2026-08-27",
        sha256: "a".repeat(64),
      },
      expectedColumns: { toConfirm: false, names: ["ortho", "phon", "lemme", "cgram", "genre"] },
      notes: "fixture",
    });
  }
  return SourceManifestSchema.parse({
    source: manifestSource(),
    retrieval: { status: "not-retrieved", artifactFilename: null, url: null, retrievedAt: null, sha256: null },
    expectedColumns: { toConfirm: true, names: ["ortho", "phon", "lemme", "cgram", "genre"] },
    notes: "fixture",
  });
}

function manifestSource() {
  return {
    id: "lexique-4",
    name: "Lexique 4",
    targetVersion: "4.00",
    authors: ["Boris New"],
    citation: "New et al. (2026)",
    license: "CC-BY-SA-4.0",
    officialLocations: ["http://www.lexique.org"],
  };
}

function fixtureInput(overrides: {
  lexicon?: RichLexicon;
  manifest?: SourceManifest;
  frozenMap?: Record<string, string>;
  runtimeMap?: Record<string, string>;
  registryIds?: Set<string>;
  packGloss?: Map<string, string>;
} = {}) {
  const lexicon = overrides.lexicon ?? fixtureLexicon();
  const map = derivedSurfaceMap(lexicon);
  return {
    lexicon,
    manifest: overrides.manifest ?? fixtureManifest(),
    frozenMap: overrides.frozenMap ?? map,
    runtimeMap: overrides.runtimeMap ?? overrides.frozenMap ?? map,
    registryIds: overrides.registryIds ?? new Set(["original-french-lexicon", "lexique-4"]),
    packGloss:
      overrides.packGloss ??
      new Map([
        ["le chat", "the cat"],
        ["manger", "to eat"],
        ["au revoir", "goodbye"],
      ]),
  };
}

function errorsFor(overrides: Parameters<typeof fixtureInput>[0] = {}) {
  return validateLexiconData(fixtureInput(overrides)).errors;
}

describe("validateLexiconData mutation tests — every rule fires", () => {
  test("fixture baseline is valid", () => {
    expect(errorsFor()).toEqual([]);
  });

  test("changing a stable id trips the triple lock", () => {
    const lexicon = fixtureLexicon();
    lexicon.lexemes[0].id = "fr:w:chat-2";
    const frozen = derivedSurfaceMap(fixtureLexicon()); // original map
    const errors = validateLexiconData(fixtureInput({ lexicon, frozenMap: frozen, runtimeMap: frozen }));
    expect(errors.errors.join("\n")).toContain("stable ids are frozen");
  });

  test("frozen map drifting from the runtime map is an error", () => {
    const map = derivedSurfaceMap(fixtureLexicon());
    const runtime = { ...map, "le chat": "fr:w:different" };
    expect(errorsFor({ runtimeMap: runtime }).join("\n")).toContain("ids-fr.ts");
  });

  test("noun without gender fails", () => {
    const lexicon = fixtureLexicon();
    delete lexicon.lexemes[0].gender;
    expect(errorsFor({ lexicon }).join("\n")).toContain("nouns must carry gender");
  });

  test("gender on a verb fails", () => {
    const lexicon = fixtureLexicon();
    lexicon.lexemes[1].gender = "masculine";
    expect(errorsFor({ lexicon }).join("\n")).toContain("nouns only");
  });

  test("lookupForm that disagrees with the surface fails", () => {
    const lexicon = fixtureLexicon();
    lexicon.lexemes[0].lookupForm = "chats";
    expect(errorsFor({ lexicon }).join("\n")).toContain("surface minus article");
  });

  test("article audit: le + feminine authored gender fails the gate", () => {
    const lexicon = fixtureLexicon();
    lexicon.lexemes[0].gender = "feminine";
    expect(errorsFor({ lexicon }).join("\n")).toContain('surface article "le" contradicts');
  });

  test("article audit: example sentence with a contradicting article fails", () => {
    const lexicon = fixtureLexicon();
    lexicon.lexemes[0].examples = [
      { fr: "Une chat dort.", en: "x", source: "original-french-lexicon" },
    ];
    expect(errorsFor({ lexicon }).join("\n")).toContain("example text shows a feminine article");
  });

  test("missing examples and missing topic fail", () => {
    const lexicon = fixtureLexicon();
    lexicon.lexemes[0].examples = [];
    delete lexicon.lexemes[0].topic;
    const joined = errorsFor({ lexicon }).join("\n");
    expect(joined).toContain("at least one example");
    expect(joined).toContain("topic is required");
  });

  test("unregistered source fails", () => {
    const lexicon = fixtureLexicon();
    lexicon.lexemes[0].sourceRefs = [{ source: "wiktionary" }];
    expect(errorsFor({ lexicon }).join("\n")).toContain('source "wiktionary" is not registered');
  });

  test("fail-closed: lexique-4 reference while not-retrieved fails", () => {
    const lexicon = fixtureLexicon();
    lexicon.lexemes[0].sourceRefs = [
      { source: "original-french-lexicon" },
      { source: "lexique-4", key: "chat|NOM" },
    ];
    expect(errorsFor({ lexicon }).join("\n")).toContain("fail-closed");
  });

  test("with a retrieved manifest the same reference is accepted", () => {
    const lexicon = fixtureLexicon();
    lexicon.lexemes[0].sourceRefs = [
      { source: "original-french-lexicon" },
      { source: "lexique-4", key: "chat|NOM" },
    ];
    expect(errorsFor({ lexicon, manifest: fixtureManifest("retrieved") })).toEqual([]);
  });

  test("an expression with a lexique-4 match is fabricated — fails even when retrieved", () => {
    const lexicon = fixtureLexicon();
    lexicon.lexemes[2].sourceRefs = [
      { source: "original-french-lexicon" },
      { source: "lexique-4", key: "au revoir|???" },
    ];
    expect(errorsFor({ lexicon, manifest: fixtureManifest("retrieved") }).join("\n")).toContain(
      "fabricated"
    );
  });

  test("lexique-sourced pronunciation labeled ipa fails (never mislabel)", () => {
    const lexicon = fixtureLexicon();
    lexicon.lexemes[0].pronunciation = { value: "Sa", notation: "ipa", source: "lexique-4" };
    expect(
      errorsFor({ lexicon, manifest: fixtureManifest("retrieved") }).join("\n")
    ).toContain('must not be labeled "ipa"');
  });

  test("lexique-sourced pronunciation labeled phonology is accepted when retrieved", () => {
    const lexicon = fixtureLexicon();
    lexicon.lexemes[0].pronunciation = { value: "Sa", notation: "phonology", source: "lexique-4" };
    expect(errorsFor({ lexicon, manifest: fixtureManifest("retrieved") })).toEqual([]);
  });

  test("frequency from any non-lexique source fails", () => {
    const lexicon = fixtureLexicon();
    lexicon.lexemes[0].frequency = {
      source: "original-french-lexicon",
      rawValue: 12,
      rank: 100,
      band: "very-common",
    };
    expect(errorsFor({ lexicon }).join("\n")).toContain("real lexique-4 measurements only");
  });

  test("confusable must exist, not self-reference, and be symmetric", () => {
    const missing = fixtureLexicon();
    missing.lexemes[0].relations = { confusables: ["fr:w:ghost"] };
    expect(errorsFor({ lexicon: missing }).join("\n")).toContain("does not exist");

    const self = fixtureLexicon();
    self.lexemes[0].relations = { confusables: ["fr:w:chat"] };
    expect(errorsFor({ lexicon: self }).join("\n")).toContain("self-reference");

    const asym = fixtureLexicon();
    asym.lexemes[0].relations = { confusables: ["fr:w:manger"] };
    expect(errorsFor({ lexicon: asym }).join("\n")).toContain("not symmetric");
  });

  test("duplicate ids and surfaces fail", () => {
    const lexicon = fixtureLexicon();
    lexicon.lexemes[1] = { ...lexicon.lexemes[0] };
    const joined = errorsFor({ lexicon }).join("\n");
    expect(joined).toContain("duplicate id");
    expect(joined).toContain("duplicate surfaces");
  });

  test("gloss drift against the course pack fails", () => {
    const lexicon = fixtureLexicon();
    lexicon.lexemes[0].nativeGloss = "the kitty";
    expect(errorsFor({ lexicon }).join("\n")).toContain("one truth, no drift");
  });

  test("a pack word missing from the rich lexicon fails", () => {
    const packGloss = new Map([
      ["le chat", "the cat"],
      ["manger", "to eat"],
      ["au revoir", "goodbye"],
      ["le chien", "the dog"],
    ]);
    expect(errorsFor({ packGloss }).join("\n")).toContain('pack word "le chien" missing');
  });
});

describe("source manifest schema is fail-closed", () => {
  test('"retrieved" without a pinned sha256 is rejected', () => {
    const bad = {
      source: manifestSource(),
      retrieval: {
        status: "retrieved",
        artifactFilename: "Lexique4.tsv",
        url: "http://www.lexique.org/x",
        retrievedAt: "2026-08-27",
        sha256: null,
      },
      expectedColumns: { toConfirm: false, names: ["ortho"] },
      notes: "x",
    };
    expect(SourceManifestSchema.safeParse(bad).success).toBe(false);
  });

  test('"not-retrieved" with artifact fields is rejected', () => {
    const bad = {
      source: manifestSource(),
      retrieval: {
        status: "not-retrieved",
        artifactFilename: null,
        url: null,
        retrievedAt: null,
        sha256: "b".repeat(64),
      },
      expectedColumns: { toConfirm: true, names: ["ortho"] },
      notes: "x",
    };
    expect(SourceManifestSchema.safeParse(bad).success).toBe(false);
  });
});

describe("Lexique mapping tables", () => {
  test("cgram → app POS is deterministic and total over declared values", () => {
    expect(lexiquePosFor("NOM")).toBe("noun");
    expect(lexiquePosFor("VER")).toBe("verb");
    expect(lexiquePosFor("AUX")).toBe("verb");
    expect(lexiquePosFor("ADJ")).toBe("adjective");
    expect(lexiquePosFor("ADJ:num")).toBe("adjective");
    expect(lexiquePosFor("ADV")).toBe("adverb");
    expect(lexiquePosFor("ART:def")).toBe("determiner");
    expect(lexiquePosFor("PRO:per")).toBe("pronoun");
    expect(lexiquePosFor("PRE")).toBe("preposition");
    expect(lexiquePosFor("CON")).toBe("conjunction");
    expect(lexiquePosFor("ONO")).toBe("interjection");
    expect(lexiquePosFor("LIA")).toBe("other");
    // Unknown values map to null — the caller must fail loudly, not guess.
    expect(lexiquePosFor("XXX")).toBeNull();
    expect(lexiquePosFor("")).toBeNull();
  });

  test("genre mapping", () => {
    expect(lexiqueGenderFor("m")).toBe("masculine");
    expect(lexiqueGenderFor("f")).toBe("feminine");
    expect(lexiqueGenderFor("")).toBe("unknown");
    expect(lexiqueGenderFor("?")).toBe("unknown");
  });

  test("frequency bands use the documented thresholds", () => {
    expect(frequencyBandFor(250)).toBe("very-common");
    expect(frequencyBandFor(10)).toBe("very-common");
    expect(frequencyBandFor(9.99)).toBe("common");
    expect(frequencyBandFor(1)).toBe("common");
    expect(frequencyBandFor(0.99)).toBe("less-common");
    expect(frequencyBandFor(0)).toBe("less-common");
  });
});

describe("parseLexiqueTsv", () => {
  const header = "ortho\tphon\tlemme\tcgram\tgenre";

  test("parses well-formed rows", () => {
    const rows = parseLexiqueTsv(`${header}\nchat\tSa\tchat\tNOM\tm\n`, ["ortho", "cgram"]);
    expect(rows).toEqual([{ ortho: "chat", phon: "Sa", lemme: "chat", cgram: "NOM", genre: "m" }]);
  });

  test("missing expected column is a hard error, not a guess", () => {
    expect(() => parseLexiqueTsv(`ortho\tphon\nchat\tSa`, ["ortho", "cgram"])).toThrow(
      /missing expected column "cgram"/
    );
  });

  test("empty artifact is a hard error", () => {
    expect(() => parseLexiqueTsv("", ["ortho"])).toThrow(/empty source artifact/);
  });
});

describe("matchLexemes — deterministic, fail-closed", () => {
  const lexicon = fixtureLexicon();

  test("null rows → source-unavailable for matchable entries, not-applicable for expressions", () => {
    const audit = matchLexemes(lexicon, null);
    expect(audit.find((r) => r.id === "fr:w:chat")?.status).toBe("source-unavailable");
    expect(audit.find((r) => r.id === "fr:w:manger")?.status).toBe("source-unavailable");
    expect(audit.find((r) => r.id === "fr:w:au-revoir")?.status).toBe("not-applicable");
  });

  test("a single lemma+POS candidate matches with a stable key", () => {
    const rows = [
      { ortho: "chat", lemme: "chat", cgram: "NOM", genre: "m" },
      { ortho: "chatte", lemme: "chatte", cgram: "NOM", genre: "f" },
    ];
    const audit = matchLexemes(lexicon, rows);
    const chat = audit.find((r) => r.id === "fr:w:chat");
    expect(chat?.status).toBe("matched");
    expect(chat?.matchKey).toBe("chat|NOM");
  });

  test("POS filtering resolves homographs (noun vs verb row)", () => {
    const rows = [
      { ortho: "manger", lemme: "manger", cgram: "NOM", genre: "m" },
      { ortho: "manger", lemme: "manger", cgram: "VER", genre: "" },
    ];
    const manger = matchLexemes(lexicon, rows).find((r) => r.id === "fr:w:manger");
    expect(manger?.status).toBe("matched");
    expect(manger?.matchKey).toBe("manger|VER");
  });

  test("gender disambiguates same-POS noun rows", () => {
    const rows = [
      { ortho: "chat", lemme: "chat", cgram: "NOM", genre: "f" },
      { ortho: "chat", lemme: "chat", cgram: "NOM", genre: "m" },
    ];
    const chat = matchLexemes(lexicon, rows).find((r) => r.id === "fr:w:chat");
    expect(chat?.status).toBe("matched");
  });

  test("still-ambiguous candidates stay ambiguous — never picked by frequency", () => {
    const rows = [
      { ortho: "chat", lemme: "chat", cgram: "NOM", genre: "m", freqfilms: "999" },
      { ortho: "chat", lemme: "chat", cgram: "NOM", genre: "m", freqfilms: "1" },
    ];
    const chat = matchLexemes(lexicon, rows).find((r) => r.id === "fr:w:chat");
    expect(chat?.status).toBe("ambiguous");
    expect(chat?.matchKey).toBeNull();
    expect(chat?.candidateCount).toBe(2);
  });

  test("no candidate → unmatched", () => {
    const chat = matchLexemes(lexicon, [
      { ortho: "chien", lemme: "chien", cgram: "NOM", genre: "m" },
    ]).find((r) => r.id === "fr:w:chat");
    expect(chat?.status).toBe("unmatched");
  });
});

describe("selectCandidatePool — documented deterministic selection", () => {
  const row = (ortho: string, cgram: string, freq: string, over: Record<string, string> = {}) => ({
    ortho,
    lemme: over.lemme ?? ortho,
    cgram,
    genre: over.genre ?? "",
    freqlemfilms: freq,
    ...over,
  });

  test("filters POS, inflected rows, proper nouns and multiword forms", () => {
    const pool = selectCandidatePool([
      row("chat", "NOM", "30", { genre: "m" }),
      row("manger", "VER", "120"),
      row("mangeons", "VER", "120", { lemme: "manger" }), // inflected — dropped
      row("Paris", "NOM", "500"), // capitalized — dropped
      row("pomme de terre", "NOM", "12"), // multiword — dropped
      row("le", "ART:def", "25000"), // POS outside the pool — dropped
      row("aujourd'hui", "ADV", "300"), // internal apostrophe — kept
    ]);
    expect(pool.map((p) => p.lemma)).toEqual(["aujourd'hui", "manger", "chat"]);
    expect(pool.find((p) => p.lemma === "chat")?.gender).toBe("masculine");
    expect(pool.find((p) => p.lemma === "manger")?.gender).toBeNull();
  });

  test("dedupes by (lemma, POS) keeping the highest frequency, and truncates", () => {
    const pool = selectCandidatePool(
      [
        row("chat", "NOM", "5", { genre: "m" }),
        row("chat", "NOM", "30", { genre: "m" }),
        row("chien", "NOM", "20", { genre: "m" }),
        row("vache", "NOM", "10", { genre: "f" }),
      ],
      2
    );
    expect(pool.map((p) => `${p.lemma}:${p.perMillion}`)).toEqual(["chat:30", "chien:20"]);
  });

  test("ordering is frequency descending with alphabetical tiebreak", () => {
    const pool = selectCandidatePool([
      row("zèbre", "NOM", "3", { genre: "m" }),
      row("abeille", "NOM", "3", { genre: "f" }),
      row("chat", "NOM", "30", { genre: "m" }),
    ]);
    expect(pool.map((p) => p.lemma)).toEqual(["chat", "abeille", "zèbre"]);
  });
});

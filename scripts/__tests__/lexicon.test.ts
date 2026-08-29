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
  effectiveMatchKeys,
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
  validateMatchOverridesData,
  type SourceMatchRow,
} from "../lib/lexicon";
import { PENDING_LEXIQUE_IMPORT } from "../../src/lib/__tests__/pending-lexique-import";
import { readJson } from "../lib/pipeline";

describe("committed lexicon data", () => {
  test("validateLexicon passes on the real content", () => {
    const { errors } = validateLexicon();
    expect(errors).toEqual([]);
  });

  test("triple lock holds: rich lexicon ≡ frozen map ≡ runtime map (126 ids)", () => {
    const rich = derivedSurfaceMap(loadRichLexicon());
    const frozen = readJson("content/fr/lexemes.json") as Record<string, string>;
    const canon = (m: Record<string, string>) => JSON.stringify(Object.entries(m).sort());
    expect(canon(rich)).toBe(canon(frozen));
    expect(canon(frozen)).toBe(canon(FR_LEXEME_IDS));
    expect(Object.keys(rich).length).toBe(126); // 54 originals + 17 A + 7 B + 13 C + 6 D + 2 E + 27 Section-3 reception
  });

  test("post-activation pronunciation: genuine IPA everywhere; lexique-4 for adopted words, authored otherwise", () => {
    for (const lex of loadRichLexicon().lexemes) {
      expect(lex.pronunciation?.notation).toBe("ipa");
      if (lex.partOfSpeech === "expression" || PENDING_LEXIQUE_IMPORT.has(lex.id)) {
        expect(lex.pronunciation?.source).toBe("original-french-lexicon");
      } else {
        // Adopted verbatim from 3_Phono_IPA (REVIEW.md pass 3 disposition);
        // never a Lexique-ASCII value mislabeled as IPA.
        expect(lex.pronunciation?.source).toBe("lexique-4");
        expect(lex.pronunciation?.value).not.toMatch(/[A-Z0-9§@°&]/);
      }
    }
  });

  test("post-activation frequency: adopted word lexemes carry real lexique-4 measurements; expressions and pending none", () => {
    const unrankedOno = new Set(["fr:w:merci", "fr:w:salut", "fr:w:pardon"]);
    for (const lex of loadRichLexicon().lexemes) {
      if (lex.partOfSpeech === "expression" || PENDING_LEXIQUE_IMPORT.has(lex.id)) {
        // Pending lexemes must NOT fake measurements before adoption.
        expect(lex.frequency).toBeUndefined();
        expect(lex.sourceRefs.map((r) => r.source)).not.toContain("lexique-4");
        continue;
      }
      expect(lex.frequency?.source).toBe("lexique-4");
      expect(lex.frequency!.rawValue).toBeGreaterThan(0);
      // Population rank exists exactly where the category is ranked —
      // the three ONO-category greetings legitimately have none.
      if (unrankedOno.has(lex.id)) {
        expect(lex.frequency!.rank).toBeUndefined();
      } else {
        expect(lex.frequency!.rank).toBeGreaterThanOrEqual(1);
      }
      // Provenance: the adopted row is recorded.
      expect(lex.sourceRefs.some((r) => r.source === "lexique-4" && r.key)).toBe(true);
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
  const names = ["1_Mot", "2_Phono", "3_Phono_IPA", "4_Lemme", "5_Cgram", "7_Genre"];
  if (status === "retrieved") {
    return SourceManifestSchema.parse({
      source: manifestSource(),
      retrieval: {
        status: "retrieved",
        artifactFilename: "Lexique400.tsv",
        url: "https://lexique.org/databases/Lexique400/Lexique400.tsv",
        retrievedAt: "2026-08-27",
        sha256: "a".repeat(64),
      },
      expectedColumns: { toConfirm: false, names },
      notes: "fixture",
    });
  }
  return SourceManifestSchema.parse({
    source: manifestSource(),
    retrieval: { status: "not-retrieved", artifactFilename: null, url: null, retrievedAt: null, sha256: null },
    expectedColumns: { toConfirm: true, names },
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

  test("lexique ASCII phonology mislabeled as ipa fails (2_Phono is never IPA)", () => {
    const lexicon = fixtureLexicon();
    lexicon.lexemes[0].pronunciation = { value: "Sa", notation: "ipa", source: "lexique-4" };
    expect(
      errorsFor({ lexicon, manifest: fixtureManifest("retrieved") }).join("\n")
    ).toContain("Lexique-ASCII alphabet characters");
  });

  test("genuine IPA from 3_Phono_IPA labeled ipa is accepted when retrieved", () => {
    const lexicon = fixtureLexicon();
    lexicon.lexemes[0].pronunciation = { value: "ʃa", notation: "ipa", source: "lexique-4" };
    expect(errorsFor({ lexicon, manifest: fixtureManifest("retrieved") })).toEqual([]);
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

  test("genre mapping (Lexique 4 adds épicène e → both)", () => {
    expect(lexiqueGenderFor("m")).toBe("masculine");
    expect(lexiqueGenderFor("f")).toBe("feminine");
    expect(lexiqueGenderFor("e")).toBe("both");
    expect(lexiqueGenderFor("")).toBe("unknown");
    expect(lexiqueGenderFor("?")).toBe("unknown");
  });

  test("frequency bands apply explicit population-derived thresholds — no built-in cutoffs", () => {
    const t = { veryCommon: 10, common: 1 };
    expect(frequencyBandFor(250, t)).toBe("very-common");
    expect(frequencyBandFor(10, t)).toBe("very-common");
    expect(frequencyBandFor(9.99, t)).toBe("common");
    expect(frequencyBandFor(1, t)).toBe("common");
    expect(frequencyBandFor(0.99, t)).toBe("less-common");
    expect(frequencyBandFor(0, t)).toBe("less-common");
    // The thresholds genuinely parameterize the result.
    expect(frequencyBandFor(5, { veryCommon: 4, common: 2 })).toBe("very-common");
    expect(frequencyBandFor(5, { veryCommon: 40, common: 4 })).toBe("common");
  });
});

describe("parseLexiqueTsv (real Lexique 4 header)", () => {
  const header = "1_Mot\t2_Phono\t3_Phono_IPA\t4_Lemme\t5_Cgram\t7_Genre";

  test("parses well-formed rows", () => {
    const rows = parseLexiqueTsv(`${header}\nchat\tSa\tʃa\tchat\tNOM\tm\n`, ["1_Mot", "5_Cgram"]);
    expect(rows).toEqual([
      {
        "1_Mot": "chat",
        "2_Phono": "Sa",
        "3_Phono_IPA": "ʃa",
        "4_Lemme": "chat",
        "5_Cgram": "NOM",
        "7_Genre": "m",
      },
    ]);
  });

  test("missing expected column is a hard error, not a guess", () => {
    expect(() => parseLexiqueTsv(`1_Mot\t2_Phono\nchat\tSa`, ["1_Mot", "5_Cgram"])).toThrow(
      /missing expected column "5_Cgram"/
    );
  });

  test("empty artifact is a hard error", () => {
    expect(() => parseLexiqueTsv("", ["1_Mot"])).toThrow(/empty source artifact/);
  });
});

/** Full-shape Lexique 4 row for matcher/pool tests (unused columns empty). */
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

describe("matchLexemes — deterministic, fail-closed", () => {
  const lexicon = fixtureLexicon();
  const chatRow = (over: Record<string, string> = {}) =>
    l4row({ "1_Mot": "chat", "4_Lemme": "chat", "5_Cgram": "NOM", "7_Genre": "m", "8_Nombre": "s", "14_IsLem": "1", ...over });

  test("null rows → source-unavailable for matchable entries, not-applicable for expressions", () => {
    const audit = matchLexemes(lexicon, null);
    expect(audit.find((r) => r.id === "fr:w:chat")?.status).toBe("source-unavailable");
    expect(audit.find((r) => r.id === "fr:w:manger")?.status).toBe("source-unavailable");
    expect(audit.find((r) => r.id === "fr:w:au-revoir")?.status).toBe("not-applicable");
  });

  test("a single lemma+POS candidate matches with a stable Mot|Cgram|Genre|Nombre key", () => {
    const rows = [
      chatRow(),
      l4row({ "1_Mot": "chatte", "4_Lemme": "chatte", "5_Cgram": "NOM", "7_Genre": "f", "8_Nombre": "s", "14_IsLem": "1" }),
    ];
    const chat = matchLexemes(lexicon, rows).find((r) => r.id === "fr:w:chat");
    expect(chat?.status).toBe("matched");
    expect(chat?.matchKey).toBe("chat|NOM|m|s");
  });

  test("POS filtering resolves homographs (noun vs verb row)", () => {
    const rows = [
      l4row({ "1_Mot": "manger", "4_Lemme": "manger", "5_Cgram": "NOM", "7_Genre": "m", "8_Nombre": "s", "14_IsLem": "1" }),
      l4row({ "1_Mot": "manger", "4_Lemme": "manger", "5_Cgram": "VER", "9_InfoVER": "inf", "14_IsLem": "1" }),
    ];
    const manger = matchLexemes(lexicon, rows).find((r) => r.id === "fr:w:manger");
    expect(manger?.status).toBe("matched");
    expect(manger?.matchKey).toBe("manger|VER||");
  });

  test("the source's own lemma flag disambiguates before gender", () => {
    const rows = [chatRow({ "14_IsLem": "0", "8_Nombre": "p" }), chatRow()];
    const chat = matchLexemes(lexicon, rows).find((r) => r.id === "fr:w:chat");
    expect(chat?.status).toBe("matched");
    expect(chat?.matchKey).toBe("chat|NOM|m|s");
  });

  test("gender disambiguates same-POS noun rows", () => {
    const rows = [chatRow({ "7_Genre": "f" }), chatRow()];
    const chat = matchLexemes(lexicon, rows).find((r) => r.id === "fr:w:chat");
    expect(chat?.status).toBe("matched");
    expect(chat?.matchKey).toBe("chat|NOM|m|s");
  });

  test("an épicène (e) row is compatible with either authored gender", () => {
    const rows = [chatRow({ "7_Genre": "f" }), chatRow({ "7_Genre": "e" })];
    const chat = matchLexemes(lexicon, rows).find((r) => r.id === "fr:w:chat");
    expect(chat?.status).toBe("matched");
    expect(chat?.matchKey).toBe("chat|NOM|e|s");
  });

  test("still-ambiguous candidates stay ambiguous — never picked by frequency", () => {
    const rows = [chatRow({ "12_FreqLemme": "999" }), chatRow({ "12_FreqLemme": "1" })];
    const chat = matchLexemes(lexicon, rows).find((r) => r.id === "fr:w:chat");
    expect(chat?.status).toBe("ambiguous");
    expect(chat?.matchKey).toBeNull();
    expect(chat?.candidateCount).toBe(2);
  });

  test("no candidate → unmatched", () => {
    const chat = matchLexemes(lexicon, [
      l4row({ "1_Mot": "chien", "4_Lemme": "chien", "5_Cgram": "NOM", "7_Genre": "m", "14_IsLem": "1" }),
    ]).find((r) => r.id === "fr:w:chat");
    expect(chat?.status).toBe("unmatched");
  });

  test("the documented ligature fold matches œuf against the source's oeuf", () => {
    const oeufLexicon: RichLexicon = {
      version: 1,
      language: "fr",
      lexemes: [
        {
          id: "fr:w:oeuf",
          surface: "l'œuf",
          lemma: "œuf",
          lookupForm: "œuf",
          partOfSpeech: "noun",
          gender: "masculine",
          nativeGloss: "the egg",
          topic: "food",
          examples: [{ fr: "Je mange un œuf.", en: "I eat an egg.", source: "original-french-lexicon" }],
          sourceRefs: [{ source: "original-french-lexicon" }],
        },
      ],
    };
    const audit = matchLexemes(oeufLexicon, [
      l4row({ "1_Mot": "oeuf", "4_Lemme": "oeuf", "5_Cgram": "NOM", "7_Genre": "m", "8_Nombre": "s", "14_IsLem": "1" }),
    ]);
    expect(audit[0].status).toBe("matched");
    expect(audit[0].matchKey).toBe("oeuf|NOM|m|s");
  });
});

describe("match overrides — §15 dispositions, never silent", () => {
  const audit: SourceMatchRow[] = [
    { id: "fr:w:chat", surface: "le chat", lookupForm: "chat", partOfSpeech: "noun", status: "matched", matchKey: "chat|NOM|m|s", candidateCount: 1 },
    { id: "fr:w:bonjour", surface: "bonjour", lookupForm: "bonjour", partOfSpeech: "interjection", status: "unmatched", matchKey: null, candidateCount: 0 },
    { id: "fr:w:au-revoir", surface: "au revoir", lookupForm: "au revoir", partOfSpeech: "expression", status: "not-applicable", matchKey: null, candidateCount: 0 },
    { id: "fr:w:vide", surface: "vide", lookupForm: "vide", partOfSpeech: "adjective", status: "source-unavailable", matchKey: null, candidateCount: 0 },
  ];
  const availableRowKeys = new Map([["fr:w:bonjour", new Set(["bonjour|NOM|m|s"])]]);
  const justification = "documented disposition with a real reason, see REVIEW.md";
  const check = (overrides: { id: string; matchKey: string; justification: string }[]) =>
    validateMatchOverridesData({ overrides: { version: 1, overrides }, audit, availableRowKeys }).errors;

  test("a valid override for an unmatched lexeme adopting an existing evidence row passes", () => {
    expect(check([{ id: "fr:w:bonjour", matchKey: "bonjour|NOM|m|s", justification }])).toEqual([]);
  });

  test("overriding an already-matched lexeme is rejected (hides drift)", () => {
    expect(check([{ id: "fr:w:chat", matchKey: "chat|NOM|m|s", justification }]).join("\n")).toContain(
      "already matched"
    );
  });

  test("expressions can never be overridden into a match", () => {
    expect(check([{ id: "fr:w:au-revoir", matchKey: "x|NOM|m|s", justification }]).join("\n")).toContain(
      "never lexique-matched"
    );
  });

  test("source-unavailable, unknown ids, phantom rows and duplicates are rejected", () => {
    expect(check([{ id: "fr:w:vide", matchKey: "vide|ADJ||s", justification }]).join("\n")).toContain(
      "source-unavailable"
    );
    expect(check([{ id: "fr:w:ghost", matchKey: "g|NOM|m|s", justification }]).join("\n")).toContain(
      "not a known lexeme"
    );
    expect(
      check([{ id: "fr:w:bonjour", matchKey: "bonjour|INT||", justification }]).join("\n")
    ).toContain("not among the committed evidence rows");
    expect(
      check([
        { id: "fr:w:bonjour", matchKey: "bonjour|NOM|m|s", justification },
        { id: "fr:w:bonjour", matchKey: "bonjour|NOM|m|s", justification },
      ]).join("\n")
    ).toContain("duplicate override");
  });

  test("effectiveMatchKeys merges matcher results with overrides, labeled by provenance", () => {
    const effective = effectiveMatchKeys(audit, {
      version: 1,
      overrides: [{ id: "fr:w:bonjour", matchKey: "bonjour|NOM|m|s", justification }],
    });
    expect(effective.get("fr:w:chat")).toEqual({ matchKey: "chat|NOM|m|s", via: "matcher" });
    expect(effective.get("fr:w:bonjour")).toEqual({ matchKey: "bonjour|NOM|m|s", via: "override" });
    expect(effective.has("fr:w:au-revoir")).toBe(false);
  });
});

describe("selectCandidatePool — documented deterministic selection", () => {
  const row = (mot: string, cgram: string, freqLemme: string, over: Record<string, string> = {}) =>
    l4row({
      "1_Mot": mot,
      "4_Lemme": over.lemme ?? mot,
      "5_Cgram": cgram,
      "7_Genre": over.genre ?? "",
      "12_FreqLemme": freqLemme,
      "13_CDOrtho": over.cd ?? "0.5",
      "14_IsLem": over.isLem ?? "1",
      "3_Phono_IPA": over.ipa ?? "",
      "33_Preval": over.preval ?? "",
    });

  test("filters non-plain categories, non-lemma rows, proper nouns and multiword forms", () => {
    const { entries } = selectCandidatePool([
      row("chat", "NOM", "30", { genre: "m", ipa: "ʃa", preval: "99" }),
      row("manger", "VER", "120"),
      row("mangeons", "VER", "120", { lemme: "manger", isLem: "0" }), // inflected — dropped
      row("Paris", "NOM", "500"), // capitalized — dropped
      row("pomme de terre", "NOM", "12"), // multiword — dropped
      row("le", "ART:def", "25000"), // POS outside the pool — dropped
      row("mon", "ADJ:pos", "6900"), // function word (maps to adjective) — dropped
      row("aujourd'hui", "ADV", "300"), // internal apostrophe — kept
    ]);
    expect(entries.map((p) => p.lemma)).toEqual(["aujourd'hui", "manger", "chat"]);
    expect(entries.find((p) => p.lemma === "chat")?.gender).toBe("masculine");
    expect(entries.find((p) => p.lemma === "chat")?.ipa).toBe("ʃa");
    expect(entries.find((p) => p.lemma === "chat")?.preval).toBe(99);
    expect(entries.find((p) => p.lemma === "manger")?.gender).toBeNull();
    expect(entries.find((p) => p.lemma === "manger")?.preval).toBeNull();
  });

  test("dedupes by (lemma, POS) keeping the highest lemma frequency, and truncates", () => {
    const { entries } = selectCandidatePool(
      [
        row("chat", "NOM", "5", { genre: "m" }),
        row("chat", "NOM", "30", { genre: "m" }),
        row("chien", "NOM", "20", { genre: "m" }),
        row("vache", "NOM", "10", { genre: "f" }),
      ],
      2
    );
    expect(entries.map((p) => `${p.lemma}:${p.freqLemme}`)).toEqual(["chat:30", "chien:20"]);
  });

  test("ordering is frequency descending with alphabetical tiebreak; ranks are 1-based", () => {
    const { entries } = selectCandidatePool([
      row("zèbre", "NOM", "3", { genre: "m" }),
      row("abeille", "NOM", "3", { genre: "f" }),
      row("chat", "NOM", "30", { genre: "m" }),
    ]);
    expect(entries.map((p) => p.lemma)).toEqual(["chat", "abeille", "zèbre"]);
    expect(entries.map((p) => p.sourceRank)).toEqual([1, 2, 3]);
    expect(entries[0].selectionReason).toContain("rank 1 by lemma subtitle frequency (30/M)");
  });

  test("épicène nouns carry gender both; authored (lemma, POS) pairs are flagged", () => {
    const { entries } = selectCandidatePool(
      [row("élève", "NOM", "40", { genre: "e" }), row("chat", "NOM", "30", { genre: "m" })],
      1500,
      new Set(["chat|noun"])
    );
    expect(entries.find((p) => p.lemma === "élève")?.gender).toBe("both");
    expect(entries.find((p) => p.lemma === "chat")?.alreadyAuthored).toBe(true);
    expect(entries.find((p) => p.lemma === "chat")?.selectionReason).toContain("already authored");
    expect(entries.find((p) => p.lemma === "élève")?.alreadyAuthored).toBe(false);
  });

  test("CD corroboration excludes lemmatization artifacts, RECORDED not silent", () => {
    const { entries, excludedByQualityGuard } = selectCandidatePool([
      row("pas", "ADV", "18098.642", { cd: "99.79639" }),
      row("upas", "ADV", "18098.642", { cd: "0.01378", preval: "0" }), // the real observed artifact
      row("chat", "NOM", "30", { genre: "m", cd: "12" }),
    ]);
    expect(entries.map((p) => p.lemma)).toEqual(["pas", "chat"]);
    expect(excludedByQualityGuard).toHaveLength(1);
    expect(excludedByQualityGuard[0].lemma).toBe("upas");
    expect(excludedByQualityGuard[0].reason).toContain("lemmatization artifact");
    // Genuinely rare words (low freq AND low CD) are untouched by the guard.
    const rare = selectCandidatePool([row("ferlage", "NOM", "0.076", { genre: "m", cd: "0.003" })]);
    expect(rare.entries.map((p) => p.lemma)).toEqual(["ferlage"]);
    expect(rare.excludedByQualityGuard).toEqual([]);
  });
});

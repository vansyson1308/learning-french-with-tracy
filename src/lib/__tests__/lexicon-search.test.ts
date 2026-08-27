/** Shared lexicon search contract (folding, tokenization, ranking). */
import { describe, expect, test } from "bun:test";

import {
  foldForSearch,
  foldLigatures,
  matchesAllTokens,
  rankMatches,
  searchScore,
  searchTokens,
} from "../learning/lexicon-search";

describe("folding", () => {
  test("ligatures fold in both cases (accents untouched)", () => {
    expect(foldLigatures("l'œuf")).toBe("l'oeuf");
    expect(foldLigatures("Œuvre")).toBe("OEuvre");
    expect(foldLigatures("curriculum vitæ")).toBe("curriculum vitae");
    expect(foldLigatures("Æneas")).toBe("AEneas");
    expect(foldLigatures("café")).toBe("café");
  });

  test("foldForSearch lowercases, strips accents and folds ligatures", () => {
    expect(foldForSearch("Café")).toBe("cafe");
    expect(foldForSearch("l'Œuf")).toBe("l'oeuf");
    expect(foldForSearch("garçon")).toBe("garcon");
    expect(foldForSearch("plaît")).toBe("plait");
    expect(foldForSearch("âne")).toBe("ane");
  });

  test("searchTokens splits on apostrophes, hyphens and spaces", () => {
    expect(searchTokens("s'il vous plaît")).toEqual(["s", "il", "vous", "plait"]);
    expect(searchTokens("  L'ŒUF  ")).toEqual(["l", "oeuf"]);
    expect(searchTokens("!!!")).toEqual([]);
    expect(searchTokens("")).toEqual([]);
  });
});

describe("matching and ranking", () => {
  const chat = { surface: "le chat", lemma: "chat", gloss: "the cat", ord: 0 };
  const chapeau = { surface: "le chapeau", lemma: "chapeau", gloss: "the hat", ord: 1 };
  const vache = { surface: "la vache", lemma: "vache", gloss: "the cow", ord: 2 };

  test("every token must match as a word prefix", () => {
    expect(matchesAllTokens(chat, ["cha"])).toBe(true);
    expect(matchesAllTokens(chat, ["cat"])).toBe(true); // gloss
    expect(matchesAllTokens(chat, ["cha", "xyz"])).toBe(false);
    expect(matchesAllTokens(chat, [])).toBe(false);
    // mid-word substrings do not match ("hat" is not a prefix of "chat")
    expect(matchesAllTokens(chat, ["hat"])).toBe(false);
    expect(matchesAllTokens(chapeau, ["hat"])).toBe(true); // gloss word "hat"
  });

  test("surface matches outrank gloss matches; course order breaks ties", () => {
    const ranked = rankMatches([chapeau, chat], ["cha"]);
    // both surface-prefix matches → tie on score → ord decides (chat first)
    expect(ranked.map((r) => r.lemma)).toEqual(["chat", "chapeau"]);
    const glossVsSurface = rankMatches([vache, chat], ["cat"]);
    expect(glossVsSurface.map((r) => r.lemma)).toEqual(["chat"]);
  });

  test("headword bonus favors the first surface word", () => {
    const bonjour = { surface: "bonjour", lemma: "bonjour", gloss: "hello / good day", ord: 5 };
    const bonne = { surface: "bonne nuit", lemma: "bonne nuit", gloss: "good night", ord: 9 };
    // "bon" prefixes the first word of both → both get the bonus; ord decides.
    expect(rankMatches([bonne, bonjour], ["bon"]).map((r) => r.ord)).toEqual([5, 9]);
    // "nuit" prefixes a non-first surface word only → no bonus, still ranked.
    expect(searchScore(bonne, ["nuit"])).toBe(30);
    expect(searchScore(bonne, ["bon"])).toBe(40);
  });

  test("non-matching candidates score zero and drop out", () => {
    expect(searchScore(chat, ["dog"])).toBe(0);
    expect(rankMatches([chat, vache], ["cow"]).map((r) => r.lemma)).toEqual(["vache"]);
  });
});

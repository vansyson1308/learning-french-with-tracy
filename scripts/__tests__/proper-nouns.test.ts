/**
 * P4c session 4 (coordinator decision): proper nouns — the Japanese names and places of ja-vi (田中, 東京 …) — are
 * lexemes the lessons teach, but TODAY never offers one as a daily new word. The lexeme says so (`proper: true`, nouns
 * only), the compiled index carries the flag, and the daily-words selection skips it (src/lib/learning/daily-words.ts).
 */
import { describe, expect, test } from "bun:test";

import { RichLexiconSchema, type RichLexeme, type RichLexicon } from "../../content/schema";
import { buildPlugin } from "../lib/languages";
import { validateLexiconData } from "../lib/lexicon";
import { buildRuntimeIndex } from "../lib/lexicon-build";
import { readJson } from "../lib/pipeline";

const xc = RichLexiconSchema.parse(readJson("content/xc/lexicon/lexemes.json"));
const frozen = readJson("content/xc/lexemes.json") as Record<string, string>;
const errorsOf = (lexemes: RichLexeme[]) =>
  validateLexiconData({
    plugin: buildPlugin("xc"),
    lexicon: { ...xc, lexemes } as RichLexicon,
    manifest: null,
    frozenMap: frozen,
    runtimeMap: frozen,
    registryIds: new Set(["synthetic-test-language"]),
    packGlosses: [],
  }).errors;

describe("the proper-noun flag", () => {
  const noun = xc.lexemes.find((l) => l.partOfSpeech === "noun")!;

  test("the schema takes proper: true on a lexeme", () => {
    expect(() => RichLexiconSchema.parse({ ...xc, lexemes: [{ ...noun, proper: true }] })).not.toThrow();
    expect(() => RichLexiconSchema.parse({ ...xc, lexemes: [{ ...noun, proper: false }] })).toThrow();
  });

  test("nouns only", () => {
    const flagged = xc.lexemes.map((l) => (l.id === noun.id ? { ...l, proper: true as const } : l));
    expect(errorsOf(flagged)).toEqual([]);
    const verb = xc.lexemes.map((l) => (l.id === noun.id ? { ...l, partOfSpeech: "verb" as const, proper: true as const } : l));
    expect(errorsOf(verb).some((m) => m.includes("proper nouns are nouns"))).toBe(true);
  });

  test("the compiled index carries it, and only where it is set", () => {
    const flagged = { ...xc, lexemes: xc.lexemes.map((l) => (l.id === noun.id ? { ...l, proper: true as const } : l)) };
    const index = buildRuntimeIndex(flagged, "xc", "en");
    expect(index.entries.find((e) => e.id === noun.id)!.proper).toBe(true);
    expect(index.entries.filter((e) => e.id !== noun.id).every((e) => !("proper" in e))).toBe(true);
    expect(buildRuntimeIndex(xc, "xc", "en").entries.every((e) => !("proper" in e))).toBe(true);
  });
});

describe("ja: the names and places are the flagged lexemes", () => {
  const ja = RichLexiconSchema.parse(readJson("content/ja/lexicon/lexemes.json"));

  test("exactly the eight proper nouns of session 3", () => {
    const flagged = ja.lexemes.filter((l) => l.proper === true).map((l) => l.surface).sort();
    expect(flagged).toEqual(["京都", "北海道", "名古屋", "大阪", "富士山", "木村", "東京", "田中"].sort());
  });

  test("no other course lexicon flags a lexeme (fr, en, es, de, it unchanged)", () => {
    for (const code of ["fr", "en", "es", "de", "it"]) {
      const lexicon = readJson(`content/${code}/lexicon/lexemes.json`) as { lexemes: { proper?: unknown }[] };
      expect(lexicon.lexemes.some((l) => "proper" in l)).toBe(false);
    }
  });
});

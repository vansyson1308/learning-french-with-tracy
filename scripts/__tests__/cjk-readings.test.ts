/**
 * P4b stage 4: readings precomputed at build time — pinyin conversion, the
 * reading contract (furigana, syllable count, RR rule output), the pool
 * derivations, the rich-lexeme rules, the committed pool files, and the
 * synthetic CJK test variant `xc` (content/xc, course xc-en) that runs the
 * validators and the compiler end to end.
 */
import { describe, expect, test } from "bun:test";

import { RichLexiconSchema, type RichLexeme, type RichLexicon } from "../../content/schema";
import { deriveChinese, deriveJapanese, deriveKorean, indexJmdictFurigana, longVowelEquivalent } from "../lib/cjk-readings/derive";
import { lexemeReadingErrors } from "../lib/cjk-readings/lexeme";
import { cedictPinyin, numberedToMarked, parseCedict, pinyinShapeErrors } from "../lib/cjk-readings/pinyin";
import { CJK_READING_LANGS, lexemeReadingsRel, poolReadingsErrors, validateCjkPoolReadings } from "../lib/cjk-readings/pool";
import { displayReading, furiganaErrors, readingErrors } from "../lib/cjk-readings/validate";
import { buildPlugin } from "../lib/languages";
import { validateLexicon, validateLexiconData } from "../lib/lexicon";
import { buildRuntimeIndex } from "../lib/lexicon-build";
import { compilePack, loadPacks, loadReadingMaps, readJson } from "../lib/pipeline";

describe("pinyin (CC-CEDICT numbered → tone marks)", () => {
  const cases: [string, string][] = [
    ["zhong1", "zhōng"], ["guo2", "guó"], ["hao3", "hǎo"], ["xie4", "xiè"], ["men5", "men"], ["lu:4", "lǜ"], ["nu:3", "nǚ"],
    ["liu4", "liù"], ["gui4", "guì"], ["dou1", "dōu"], ["xue2", "xué"], ["r5", "r"], ["er2", "ér"], ["Zhong1", "zhōng"],
  ];
  for (const [n, m] of cases) test(`${n} → ${m}`, () => expect(numberedToMarked(n.toLowerCase())).toBe(m));
  test("not a pinyin syllable", () => {
    expect(numberedToMarked("xx5")).toBeNull();
    expect(numberedToMarked("A")).toBeNull();
  });
  test("shape check: one mark per syllable, real syllables, NFC, single spaces", () => {
    expect(pinyinShapeErrors("hàn yǔ")).toEqual([]);
    expect(pinyinShapeErrors("hàn  yǔ").length).toBeGreaterThan(0);
    expect(pinyinShapeErrors("hànyǔ").length).toBeGreaterThan(0);
    expect(pinyinShapeErrors("xyz").length).toBeGreaterThan(0);
  });
  test("parseCedict indexes both headwords; cedictPinyin lower-cases proper names", () => {
    const text = "# comment\n漢語 汉语 [Han4 yu3] /Chinese language/\n大學 大学 [da4 xue2] /university/\n";
    const map = parseCedict(text, new Set(["汉语", "大學"]));
    expect(map.get("汉语")?.[0]?.traditional).toBe("漢語");
    expect(map.get("大學")?.[0]?.simplified).toBe("大学");
    expect(cedictPinyin(map.get("汉语")![0]!)).toBe("hàn yǔ");
  });
});

describe("the reading contract", () => {
  test("furigana bases spell the surface, rubies the kana", () => {
    expect(furiganaErrors("食べる", "たべる", [{ base: "食", ruby: "た" }, { base: "べる" }])).toEqual([]);
    expect(furiganaErrors("食べる", "たべる", [{ base: "食", ruby: "た" }, { base: "べ" }]).length).toBeGreaterThan(0);
    expect(furiganaErrors("学生", "がくせい", [{ base: "学", ruby: "がく" }, { base: "生", ruby: "しょう" }]).length).toBeGreaterThan(0);
    expect(furiganaErrors("学生", "がくせい", [{ base: "学生" }]).length).toBeGreaterThan(0); // kanji without ruby
  });
  test("kana: a kanji surface needs furigana; a kana surface is its own reading", () => {
    expect(readingErrors("kana", "学生", "noun", { kana: "がくせい" })).toContain('"学生" has kanji but no furigana');
    expect(readingErrors("kana", "りんご", "noun", { kana: "りんご" })).toEqual([]);
    expect(readingErrors("kana", "パン", "noun", { kana: "ぱん" }).length).toBeGreaterThan(0);
  });
  test("pinyin: one syllable per hanzi, Han-only surface, same-length traditional", () => {
    expect(readingErrors("pinyin", "汉语", "noun", { pinyin: "hàn yǔ", traditional: "漢語" })).toEqual([]);
    expect(readingErrors("pinyin", "汉语", "noun", { pinyin: "hàn" }).some((m) => m.includes("1 syllable(s) for 2 hanzi"))).toBe(true);
    expect(readingErrors("pinyin", "汉语", "noun", { pinyin: "hàn yǔ", traditional: "漢" }).length).toBeGreaterThan(0);
    expect(readingErrors("pinyin", "大學", "noun", { pinyin: "dà xué", traditional: "大學", simplified: "大学" })).toEqual([]);
  });
  test("rr: equals the rule output of the surface or its +-marked spelling", () => {
    expect(readingErrors("rr", "신라", "noun", { rr: "silla" })).toEqual([]);
    expect(readingErrors("rr", "신라", "noun", { rr: "sinla" }).length).toBeGreaterThan(0);
    expect(readingErrors("rr", "학여울", "noun", { rr: "hangnyeoul", rrSpelling: "학+여울" })).toEqual([]);
    expect(readingErrors("rr", "학여울", "noun", { rr: "hangnyeoul" }).length).toBeGreaterThan(0);
    expect(readingErrors("rr", "학여울", "noun", { rr: "hangnyeoul", rrSpelling: "학+여+울" })).toEqual([]);
    expect(readingErrors("rr", "학여울", "noun", { rr: "hangnyeoul", rrSpelling: "항+여울" }).length).toBeGreaterThan(0);
  });
  test("a reading carries only its own notation's fields", () => {
    expect(readingErrors("rr", "신라", "noun", { rr: "silla", kana: "しら" })).toContain('field "kana" does not belong to a rr reading');
  });
  test("displayReading drops rule inputs and spellings", () => {
    expect(displayReading({ rr: "hangnyeoul", rrSpelling: "학+여울" })).toEqual({ rr: "hangnyeoul" });
    expect(displayReading({ pinyin: "hàn yǔ", traditional: "漢語" })).toEqual({ pinyin: "hàn yǔ" });
    expect(displayReading({ traditional: "漢語" })).toBeUndefined();
  });
});

describe("pool derivations", () => {
  const furigana = indexJmdictFurigana(
    [
      { text: "英語", reading: "えいご", furigana: [{ ruby: "英", rt: "えい" }, { ruby: "語", rt: "ご" }] },
      { text: "今日", reading: "きょう", furigana: [{ ruby: "今日", rt: "きょう" }] },
      { text: "今日", reading: "こんにち", furigana: [{ ruby: "今", rt: "こん" }, { ruby: "日", rt: "にち" }] },
      { text: "食べる", reading: "たべる", furigana: [{ ruby: "食", rt: "た" }, { ruby: "べ" }, { ruby: "る" }] },
    ],
    new Set(["英語", "今日", "食べる"])
  );
  test("ja: pool kana picks the JMdict reading; ー matches the long vowel; kana-only lemmas read themselves", () => {
    const d = deriveJapanese(
      [
        { lemma: "英語", partOfSpeech: "noun" },
        { lemma: "今日", partOfSpeech: "noun" },
        { lemma: "食べる", partOfSpeech: "verb" },
        { lemma: "りんご", partOfSpeech: "noun" },
        { lemma: "明日", partOfSpeech: "noun" },
      ],
      { "英語|noun": { kana: "えーご" }, "今日|noun": { kana: "きょう" } },
      furigana
    );
    expect(d.readings["英語|noun"]).toEqual({ kana: "えいご", furigana: [{ base: "英", ruby: "えい" }, { base: "語", ruby: "ご" }] });
    expect(d.readings["今日|noun"]?.kana).toBe("きょう");
    expect(d.readings["食べる|verb"]?.furigana).toEqual([{ base: "食", ruby: "た" }, { base: "べる" }]);
    expect(d.readings["りんご|noun"]).toEqual({ kana: "りんご" });
    expect(d.unresolved["明日|noun"]).toContain("no JMdict");
  });
  test("ja: ー stands for the lengthened vowel, い after e-row, う after o-row", () => {
    expect(longVowelEquivalent("とーぜん", "とうぜん")).toBe(true);
    expect(longVowelEquivalent("えーご", "えいご")).toBe(true);
    expect(longVowelEquivalent("こーだい", "たかだい")).toBe(false);
  });
  test("zh: kaikki pinyin picks the CC-CEDICT reading; traditional lemmas keep their simplified spelling", () => {
    const cedict = parseCedict(
      "先生 先生 [xian1 sheng5] /teacher/\n行 行 [xing2] /to walk/\n行 行 [hang2] /row/\n大學 大学 [da4 xue2] /university/\n",
      new Set(["先生", "行", "大學", "未知"])
    );
    const d = deriveChinese(
      [
        { lemma: "先生", partOfSpeech: "noun" },
        { lemma: "行", partOfSpeech: "verb" },
        { lemma: "行", partOfSpeech: "noun" },
        { lemma: "大學", partOfSpeech: "noun" },
        { lemma: "未知", partOfSpeech: "noun" },
      ],
      { "先生|noun": { pinyin: "xiānshēng" }, "行|verb": { pinyin: "xíng" } },
      cedict
    );
    expect(d.readings["先生|noun"]).toEqual({ pinyin: "xiān sheng", traditional: "先生" });
    expect(d.readings["行|verb"]).toEqual({ pinyin: "xíng", traditional: "行" });
    expect(d.unresolved["行|noun"]).toContain("2 readings");
    expect(d.readings["大學|noun"]).toEqual({ pinyin: "dà xué", traditional: "大學", simplified: "大学" });
    expect(d.unresolved["未知|noun"]).toContain("no CC-CEDICT entry");
  });
  test("ko: the rule output confirmed by Wiktionary, a compound boundary found when needed, disagreements listed", () => {
    const d = deriveKorean(
      [
        { lemma: "신라", partOfSpeech: "noun" },
        { lemma: "담요", partOfSpeech: "noun" },
        { lemma: "특히", partOfSpeech: "adverb" },
        { lemma: "라디오", partOfSpeech: "noun" },
      ],
      { "신라|noun": { romanization: "Silla" }, "담요|noun": { romanization: "damnyo" }, "특히|adverb": { romanization: "teukhi" } }
    );
    expect(d.readings["신라|noun"]).toEqual({ rr: "silla" });
    expect(d.readings["담요|noun"]).toEqual({ rr: "damnyo", rrSpelling: "담+요" });
    expect(d.unresolved["특히|adverb"]).toContain("keeps ㅎ");
    expect(d.unresolved["라디오|noun"]).toContain("no independent romanization");
  });
});

describe("committed pool readings (content/<lang>/lexicon/derived/lexeme-readings.json)", () => {
  test("validate clean: every pool entry is read or listed with a reason", () => expect(validateCjkPoolReadings()).toEqual([]));
  for (const lang of CJK_READING_LANGS) {
    test(`${lang}: at least 95% of the pool carries a confirmed reading`, () => {
      const file = readJson(lexemeReadingsRel(lang)) as { coverage: { entries: number; confirmed: number } };
      expect(file.coverage.confirmed / file.coverage.entries).toBeGreaterThanOrEqual(0.95);
    });
  }
  test("a pool entry missing from both maps, an extra key and drifted coverage all fail", () => {
    const file = {
      generator: "scripts/cjk-readings.ts" as const,
      language: "ko",
      notation: "rr" as const,
      sources: [],
      method: "m",
      coverage: { entries: 2, confirmed: 1, unresolved: 0 },
      readings: { "신라|noun": { rr: "silla" }, "없는|noun": { rr: "eomneun" } },
      unresolved: {},
    };
    const errors = poolReadingsErrors("ko", file, [
      { lemma: "신라", partOfSpeech: "noun" },
      { lemma: "종로", partOfSpeech: "noun" },
    ]);
    expect(errors.some((m) => m.includes('"종로|noun" has no confirmed reading'))).toBe(true);
    expect(errors.some((m) => m.includes('"없는|noun", which is not a pool entry'))).toBe(true);
    expect(errors.some((m) => m.includes("does not recompute"))).toBe(true);
  });
});

describe("rich-lexeme reading rules", () => {
  const base = { surface: "신라", partOfSpeech: "noun" };
  test("a CJK lexeme needs a pronunciation in its language's notation and a matching reading", () => {
    expect(lexemeReadingErrors(["rr"], base)[0]).toContain("no pronunciation");
    expect(lexemeReadingErrors(["rr"], { ...base, pronunciation: { value: "silla", notation: "ipa" } })[0]).toContain("not one of");
    expect(lexemeReadingErrors(["rr"], { ...base, pronunciation: { value: "silla", notation: "rr" } })[0]).toContain("no reading object");
    expect(lexemeReadingErrors(["rr"], { ...base, pronunciation: { value: "sila", notation: "rr" }, reading: { rr: "silla" } })).toEqual([
      'pronunciation "sila" ≠ its reading\'s rr "silla"',
    ]);
    expect(lexemeReadingErrors(["rr"], { ...base, pronunciation: { value: "silla", notation: "rr" }, reading: { rr: "silla" } })).toEqual([]);
  });
  test("a Latin language carries no reading", () => {
    expect(lexemeReadingErrors([], { surface: "ami", partOfSpeech: "noun", reading: { kana: "あみ" } }).length).toBe(1);
    expect(lexemeReadingErrors([], { surface: "ami", partOfSpeech: "noun", pronunciation: { value: "ami", notation: "ipa" } })).toEqual([]);
  });
  test("a lexeme surface is simplified: reading.simplified is pool-only", () => {
    const errors = lexemeReadingErrors(["pinyin"], { surface: "大學", partOfSpeech: "noun", pronunciation: { value: "dà xué", notation: "pinyin" }, reading: { pinyin: "dà xué", traditional: "大學", simplified: "大学" } });
    expect(errors.some((m) => m.includes("pool-only"))).toBe(true);
  });
});

describe("synthetic CJK test variant xc (P4b DoD)", () => {
  const lexicon = RichLexiconSchema.parse(readJson("content/xc/lexicon/lexemes.json"));
  const frozen = readJson("content/xc/lexemes.json") as Record<string, string>;
  const run = (lexemes: RichLexeme[]) =>
    validateLexiconData({
      plugin: buildPlugin("xc"),
      lexicon: { ...lexicon, lexemes } as RichLexicon,
      manifest: null,
      frozenMap: frozen,
      runtimeMap: frozen,
      registryIds: new Set(["synthetic-test-language"]),
      packGlosses: [],
    }).errors;
  const patch = (id: string, change: Partial<RichLexeme>) => lexicon.lexemes.map((l) => (l.id === id ? { ...l, ...change } : l));

  test("the variant carries kana (with furigana), pinyin (with traditional) and rr (with and without a compound boundary)", () => {
    const notations = lexicon.lexemes.map((l) => l.pronunciation?.notation);
    expect(new Set(notations)).toEqual(new Set(["kana", "pinyin", "rr"]));
    expect(lexicon.lexemes.length).toBeGreaterThanOrEqual(3);
    expect(lexicon.lexemes.length).toBeLessThanOrEqual(5);
  });
  test("the committed variant validates through the real lexicon validator", () => {
    expect(validateLexicon("xc", loadPacks()).errors).toEqual([]);
    expect(run(lexicon.lexemes)).toEqual([]);
  });
  test("broken furigana fails", () => {
    const errors = run(patch("xc:w:gakusei", { reading: { kana: "がくせい", furigana: [{ base: "学", ruby: "がく" }, { base: "生", ruby: "しょう" }] } }));
    expect(errors.some((m) => m.includes("furigana reads"))).toBe(true);
  });
  test("a pinyin syllable count that misses a hanzi fails", () => {
    const errors = run(patch("xc:w:hanyu", { pronunciation: { value: "hàn", notation: "pinyin", source: "synthetic-test-language" }, reading: { pinyin: "hàn", traditional: "漢語" } }));
    expect(errors.some((m) => m.includes("1 syllable(s) for 2 hanzi"))).toBe(true);
  });
  test("an rr that is not the rule output fails", () => {
    const errors = run(patch("xc:w:silla", { pronunciation: { value: "sinla", notation: "rr", source: "synthetic-test-language" }, reading: { rr: "sinla" } }));
    expect(errors.some((m) => m.includes('≠ the rule output "silla"'))).toBe(true);
  });
  test("a lexeme without its reading fails", () => {
    const { pronunciation: _p, reading: _r, ...bare } = lexicon.lexemes[0]!;
    expect(run([bare as RichLexeme, ...lexicon.lexemes.slice(1)]).some((m) => m.includes("no pronunciation"))).toBe(true);
  });
  test("the compiled index carries pronunciation, reading and traditional; course words get their reading", () => {
    const index = buildRuntimeIndex(lexicon, "xc", "en");
    const hanyu = index.entries.find((e) => e.id === "xc:w:hanyu")!;
    expect(hanyu.pronunciation).toEqual({ value: "hàn yǔ", notation: "pinyin" });
    expect(hanyu.reading).toEqual({ pinyin: "hàn yǔ" });
    expect(hanyu.traditional).toBe("漢語");
    expect(index.entries.find((e) => e.id === "xc:w:hangnyeoul")!.reading).toEqual({ rr: "hangnyeoul" });
    const pack = loadPacks().find((p) => p.pack.id === "xc-en")!.pack;
    const compiled = compilePack(pack, frozen, loadReadingMaps()["xc"]).pack;
    const words = compiled.sections[0]!.units[0]!.words;
    expect(words.find((w) => w.target === "学生")!.reading).toEqual({ kana: "がくせい", furigana: [{ base: "学", ruby: "がく" }, { base: "生", ruby: "せい" }] });
    expect(words.find((w) => w.target === "신라")!.reading).toEqual({ rr: "silla" });
  });
  test("Latin-script courses get no reading maps (fr/en packs compile unchanged)", () => {
    const maps = loadReadingMaps();
    for (const code of ["fr", "en", "es", "de", "it", "xx"]) expect(maps[code]).toBeUndefined();
  });
});

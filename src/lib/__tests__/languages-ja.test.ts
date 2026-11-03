/**
 * Japanese plugin (P4b stage 3): dictionary tokenizer, kana folds, kana-for-
 * kanji via stored readings, native counters, kanji numerals, and the
 * speech grader's reading layer. Readings here are a test lexicon; stage 4
 * populates real ones from the course's lexicon.
 */
import { afterEach, describe, expect, test } from "bun:test";

import { __registerCourseArtifactsForTests } from "../content-registry";
import { __registerCourseProfileForTests, courseProfile } from "../course-profile";
import { languageRules, languageRulesForCourse, type CourseLexicon } from "../languages";
import { createJapaneseRules, ja, japaneseNativeCounters, japaneseNumber, katakanaToHiragana } from "../languages/ja";
import { gradeSpokenAttempt, normalizeSpoken } from "../speech/grader";

const kana = (surface: string, value: string) => ({ surface, reading: { value, notation: "kana" } });

const LEX: CourseLexicon = {
  entries: [
    kana("私", "わたし"),
    kana("学生", "がくせい"),
    kana("大学生", "だいがくせい"),
    kana("先生", "せんせい"),
    kana("橋", "はし"),
    kana("箸", "はし"),
    { surface: "です" },
    kana("日本語", "にほんご"),
    kana("切手", "きって"),
    { surface: "コーヒー" },
    kana("三", "さん"),
    kana("水", "みず"),
    kana("飲みます", "のみます"),
  ],
};
const jaL = ja.withLexicon!(LEX);

const lenient = (s: string) => ja.normalizeLenient(s);
const strict = (s: string) => ja.normalizeStrict(s);
const spoken = (s: string, rules = jaL) => normalizeSpoken(s, rules);
const align = (answer: string, key: string, rules = jaL) => rules.alignAnswerToKey!(rules.normalizeLenient(answer), rules.normalizeLenient(key)) === rules.normalizeLenient(key);
const grade = (heard: string, variants: string[], concepts?: string[][], rules = jaL) =>
  gradeSpokenAttempt({ finalTranscript: heard, alternatives: [] }, { acceptedVariants: variants, requiredConcepts: concepts }, rules).correct;

/** Runs `build` with Intl.Segmenter removed, as on a runtime without it. */
function withoutSegmenter<T>(build: () => T): T {
  const intl = Intl as unknown as { Segmenter?: unknown };
  const saved = intl.Segmenter;
  intl.Segmenter = undefined;
  try {
    return build();
  } finally {
    intl.Segmenter = saved;
  }
}

describe("ja numbers: kanji numerals 0–100", () => {
  test.each([
    [0, "零"],
    [1, "一"],
    [9, "九"],
    [10, "十"],
    [11, "十一"],
    [20, "二十"],
    [21, "二十一"],
    [99, "九十九"],
    [100, "百"],
  ])("%d → %s", (n, word) => expect(japaneseNumber(n)).toBe(word));

  test("standalone digits are spelt; larger numbers and words are not", () => {
    expect(ja.spellDigits("3")).toBe("三");
    expect(ja.spellDigits("150")).toBe("150");
    expect(ja.spellDigits("さん")).toBe("さん");
  });

  test("multi-digit numbers segment like authored numerals (21歳 = 二十一歳)", () => {
    expect(spoken("21歳")).toBe(spoken("二十一歳"));
  });

  test("full-width digits fold before spelling (３ → 3 → 三)", () => {
    expect(spoken("３")).toBe(spoken("三"));
  });

  test("native counters: 1つ = 一つ = ひとつ, ３つ = みっつ", () => {
    expect(spoken("1つ")).toBe(spoken("ひとつ"));
    expect(spoken("一つ")).toBe(spoken("ひとつ"));
    expect(spoken("３つ")).toBe(spoken("みっつ"));
  });

  test("people: 2人 = 二人 = ふたり, but 12人 and 十二人 are not ふたり", () => {
    expect(spoken("2人")).toBe(spoken("ふたり"));
    expect(japaneseNativeCounters("二人")).toBe("ふたり");
    expect(japaneseNativeCounters("12人")).toBe("12人");
    expect(japaneseNativeCounters("十二人")).toBe("十二人");
  });

  test("consecutive counters all fold (1つ2つ)", () => {
    expect(japaneseNativeCounters("1つ2つ")).toBe("ひとつふたつ");
  });
});

describe("ja lenient (typed practice)", () => {
  test("half-width katakana = hiragana (ｶﾞｯｺｳ = がっこう)", () => expect(lenient("ｶﾞｯｺｳ")).toBe(lenient("がっこう")));
  test("katakana = hiragana (コーヒー = こーひー)", () => expect(lenient("コーヒー")).toBe(lenient("こーひー")));
  test("ー is the vowel it lengthens (カード = かあど)", () => expect(lenient("カード")).toBe(lenient("かあど")));
  test("ノート = のおと", () => expect(lenient("ノート")).toBe(lenient("のおと")));
  test("a hyphen or tilde typed for ー (カ-ド, カ〜ド) = カード", () => {
    expect(lenient("カ-ド")).toBe(lenient("カード"));
    expect(lenient("カ〜ド")).toBe(lenient("カード"));
  });
  test("small っ folds (きって = きつて) but only in lenient", () => {
    expect(lenient("きって")).toBe(lenient("きつて"));
    expect(strict("きって")).not.toBe(strict("きつて"));
  });
  test("ヴ = バ行 (ヴァイオリン = バイオリン), lenient only", () => {
    expect(lenient("ヴァイオリン")).toBe(lenient("バイオリン"));
    expect(strict("ヴァイオリン")).not.toBe(strict("バイオリン"));
  });
  test("the particle は is not わ (わたしは ≠ わたしわ)", () => expect(lenient("わたしは")).not.toBe(lenient("わたしわ")));
  test("punctuation and brackets drop (「はい」。)", () => expect(lenient("「はい」。")).toBe("はい"));
  test("full-width Latin folds (ＡＢＣ → abc)", () => expect(lenient("ＡＢＣ")).toBe("abc"));
  test("the alternate form ignores spaces (私 は 学生 = 私は学生)", () =>
    expect(ja.normalizeLenientAlternate!("私 は 学生")).toBe(ja.normalizeLenientAlternate!("私は学生")));
  test("mixed kanji–kana text keeps its kanji", () => expect(lenient("日本語を勉強します")).toBe("日本語を勉強します"));
});

describe("ja strict (dictation, cloze): the target script is the construct", () => {
  test("kana type counts (コーヒー ≠ こーひー)", () => expect(strict("コーヒー")).not.toBe(strict("こーひー")));
  test("kanji ≠ its kana (学生 ≠ がくせい)", () => expect(strict("学生")).not.toBe(strict("がくせい")));
  test("width does not count (ｺｰﾋｰ = コーヒー)", () => expect(strict("ｺｰﾋｰ")).toBe(strict("コーヒー")));
  test("romaji never matches (gakusei ≠ 学生)", () => expect(strict("gakusei")).not.toBe(strict("学生")));
  test("spaces between Japanese characters do not count", () => expect(strict("わたし は")).toBe(strict("わたしは")));
  test("ー is kept (カード ≠ カド)", () => expect(strict("カード")).not.toBe(strict("カド")));
});

describe("ja kana for kanji via stored readings (alignAnswerToKey, practice only)", () => {
  test("all-kana answer for a kanji key", () => expect(align("わたしはがくせいです", "私は学生です")).toBe(true));
  test("partly kana answer (わたしは学生です)", () => expect(align("わたしは学生です", "私は学生です")).toBe(true));
  test("katakana answer for a kanji key", () => expect(align("ハシ", "橋")).toBe(true));
  test("a homophone KANJI is a different word (箸 for 橋)", () => expect(align("箸", "橋")).toBe(false));
  test("は written わ is still wrong (わたしわがくせいです)", () => expect(align("わたしわがくせいです", "私は学生です")).toBe(false));
  test("a different word fails (せんせい for 学生)", () => expect(align("せんせい", "学生")).toBe(false));
  test("no stored readings → no kana-for-kanji (plain plugin)", () => expect(align("がくせい", "学生", ja)).toBe(false));
});

describe("ja tokenize", () => {
  test("dictionary maximal match (私は学生です)", () => expect(jaL.tokenize(jaL.foldSpoken("私は学生です。"))).toEqual(["私", "は", "学生", "です"]));
  test("the longest word wins (大学生です → 大学生, です)", () => expect(jaL.tokenize("大学生です")).toEqual(["大学生", "です"]));
  test("kana transcripts split on the stored readings", () => expect(jaL.tokenize("わたしはがくせいです")).toEqual(["わたし", "は", "がくせい", "です"]));
  test("Latin/digit runs stay one token", () => expect(jaL.tokenize("abc123です")).toEqual(["abc123", "です"]));
  test("the dictionary path does not depend on Intl.Segmenter", () => {
    const noSeg = withoutSegmenter(() => createJapaneseRules(LEX));
    for (const s of ["私は学生です", "わたしはがくせいです", "コーヒーを三つ"]) expect(noSeg.tokenize(s)).toEqual(jaL.tokenize(s));
  });
  test("without course data and without a segmenter: one token per character cluster", () => {
    const bare = withoutSegmenter(() => createJapaneseRules());
    expect(bare.tokenize("これは")).toEqual(["こ", "れ", "は"]);
    expect(bare.tokenize("が")).toEqual(["が"]);
  });
  test("deterministic: the same input always gives the same tokens", () => expect(jaL.tokenize("日本語です")).toEqual(jaL.tokenize("日本語です")));
});

describe("ja speech grader: no spaces, kana vs kanji by stored reading", () => {
  test("kana transcript passes a kanji variant", () => expect(grade("わたしはがくせいです", ["私は学生です"])).toBe(true));
  test("kanji transcript passes a kana variant", () => expect(grade("私は学生です。", ["わたしはがくせいです"])).toBe(true));
  test("katakana transcript passes a hiragana variant", () => expect(grade("ミズ", ["みず"])).toBe(true));
  test("without stored readings kana and kanji stay different", () => expect(grade("がくせい", ["学生"], undefined, ja)).toBe(false));
  test("a concept slot matches by reading (学生 inside a kana transcript)", () => expect(grade("わたしはがくせいです", [], [["学生"]])).toBe(true));
  test("concepts are word-level: 学生 is not inside the word 大学生", () => expect(grade("大学生です", [], [["学生"]])).toBe(false));
  test("digits and native counters (三つ / 3つ / みっつ)", () => {
    expect(grade("3つ", ["みっつ"])).toBe(true);
    expect(grade("三つ", ["みっつ"])).toBe(true);
  });
  test("a different word fails (先生 for 学生)", () => expect(grade("私は先生です", ["私は学生です"])).toBe(false));
  test("homophones pass in SPEECH (箸 heard for 橋): the sounds are the same", () => expect(grade("箸", ["橋"])).toBe(true));
  test("okurigana verb by reading (のみます = 飲みます)", () => expect(grade("みずをのみます", ["水を飲みます"])).toBe(true));
});

describe("ja search fold, locales, reading speed, registry", () => {
  test("search fold: katakana = hiragana, width folded", () => {
    expect(ja.fold("カード")).toBe(ja.fold("かーど"));
    expect(ja.fold("ＡＢＣ")).toBe("abc");
  });
  test("katakanaToHiragana keeps ヷ (no hiragana) and maps ヴ/ヶ", () => expect(katakanaToHiragana("ヴヶヷ")).toBe("ゔゖヷ"));
  test("locales are ja-JP", () => {
    expect(ja.recognitionLocale).toBe("ja-JP");
    expect(ja.ttsLocale).toBe("ja-JP");
  });
  test("reading speed is counted in characters", () => {
    expect(ja.charsPerSecBand?.unit).toBe("character");
    expect(ja.charsPerSecBand!.native.min).toBeLessThan(ja.charsPerSecBand!.native.max);
  });
  test("Latin plugins carry no lexicon binding or reading layer (fr/en results unchanged)", () => {
    for (const code of ["fr", "en", "es", "de", "it", "pt", "vi"]) {
      expect(languageRules(code).withLexicon).toBeUndefined();
      expect(languageRules(code).spokenReading).toBeUndefined();
    }
    expect(languageRulesForCourse("fr-en")).toBe(languageRules("fr"));
    expect(languageRulesForCourse("en-vi")).toBe(languageRules("en"));
  });
});

describe("ja course binding (languageRulesForCourse reads the course's lexicon index)", () => {
  afterEach(() => {
    __registerCourseArtifactsForTests("ja-zz", null);
    __registerCourseProfileForTests(null, "ja-zz");
  });
  test("a course with a lexicon index tokenizes and reads by its words", () => {
    __registerCourseProfileForTests({ ...courseProfile("ja-en"), id: "ja-zz", nativeCode: "zz" });
    __registerCourseArtifactsForTests("ja-zz", {
      lexiconIndex: { contentHash: "t", entries: [{ surface: "学生", pronunciation: { value: "がくせい", notation: "kana" } }, { surface: "です" }] },
    });
    const rules = languageRulesForCourse("ja-zz");
    expect(rules.tokenize("学生です")).toEqual(["学生", "です"]);
    expect(rules.spokenReading!("学生 です")).toBe("がくせい です");
  });
  test("a course without a lexicon index keeps the plain plugin", () => expect(languageRulesForCourse("ja-en")).toBe(ja));
});

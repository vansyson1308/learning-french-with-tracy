/**
 * Chinese plugin (P4b stage 3): dictionary tokenizer, 两 vs 二, word-level
 * traditional → simplified fold from the course lexicon, pinyin typed with
 * marks / numbers / no tones as a lenient (practice) match, search fold.
 */
import { describe, expect, test } from "bun:test";

import type { CourseLexicon } from "../languages";
import { chineseNumber, chineseTwoBeforeMeasure, createChineseRules, parsePinyinReading, pinyinMatches, zh } from "../languages/zh";
import { gradeSpokenAttempt, normalizeSpoken } from "../speech/grader";

const py = (surface: string, value: string, variants?: string[]) => ({ surface, reading: { value, notation: "pinyin" }, ...(variants ? { variants } : {}) });

const LEX: CourseLexicon = {
  entries: [
    py("你好", "nǐ hǎo"),
    py("学生", "xué sheng", ["學生"]),
    py("看", "kàn"),
    py("了", "le"),
    py("了解", "liǎo jiě"),
    py("着", "zhe"),
    py("我", "wǒ"),
    py("是", "shì"),
    py("女", "nǚ"),
    py("绿", "lǜ"),
    py("两", "liǎng"),
    py("个", "gè", ["個"]),
    py("说话", "shuō huà", ["說話"]),
    py("中国", "zhōng guó", ["中國"]),
    py("西安", "xī ān"),
    py("有", "yǒu"),
    py("书", "shū", ["書"]),
  ],
};
const zhL = zh.withLexicon!(LEX);

const spoken = (s: string, rules = zhL) => normalizeSpoken(s, rules);
const typedPinyin = (answer: string, key: string, rules = zhL) =>
  rules.alignAnswerToKey!(rules.normalizeLenient(answer), rules.normalizeLenient(key)) === rules.normalizeLenient(key);
const grade = (heard: string, variants: string[], concepts?: string[][], rules = zhL) =>
  gradeSpokenAttempt({ finalTranscript: heard, alternatives: [] }, { acceptedVariants: variants, requiredConcepts: concepts }, rules).correct;

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

describe("zh numbers", () => {
  test.each([
    [0, "零"],
    [2, "二"],
    [10, "十"],
    [11, "十一"],
    [20, "二十"],
    [21, "二十一"],
    [99, "九十九"],
    [100, "一百"],
  ])("%d → %s", (n, word) => expect(chineseNumber(n)).toBe(word));

  test("standalone digits are spelt, larger ones kept", () => {
    expect(zh.spellDigits("5")).toBe("五");
    expect(zh.spellDigits("250")).toBe("250");
  });
  test("2 before a measure word is 两 (2个 = 两个)", () => expect(spoken("2个")).toBe(spoken("两个")));
  test("两 vs 二: 二个 (a learner error) never equals 两个", () => expect(spoken("二个")).not.toBe(spoken("两个")));
  test("a bare 2 is 二", () => expect(spoken("2")).toBe(spoken("二")));
  test("12个 is 十二个, not 1两个", () => {
    expect(chineseTwoBeforeMeasure("12个")).toBe("12个");
    expect(spoken("12个")).toBe(spoken("十二个"));
  });
  test("inside a sentence (我有2本书 = 我有两本书)", () => expect(spoken("我有2本书")).toBe(spoken("我有两本书")));
});

describe("zh traditional → simplified (word-level, from the course lexicon)", () => {
  test("lenient: 學生 = 学生", () => expect(zhL.normalizeLenient("學生")).toBe(zhL.normalizeLenient("学生")));
  test("spoken: 說話 → 说话", () => expect(zhL.foldSpoken("說話")).toBe("说话"));
  test("search: 中國 finds 中国", () => expect(zhL.fold("中國")).toBe(zhL.fold("中国")));
  test("a sentence mixing both scripts (我是學生 = 我是学生)", () => expect(spoken("我是學生")).toBe(spoken("我是学生")));
  test("strict keeps the script as typed (學生 ≠ 学生)", () => expect(zhL.normalizeStrict("學生")).not.toBe(zhL.normalizeStrict("学生")));
  test("without course data nothing is folded (no shipped table)", () => expect(zh.normalizeLenient("學生")).not.toBe(zh.normalizeLenient("学生")));
});

describe("zh pinyin typed for hanzi (lenient practice match from stored readings)", () => {
  test("no tones: ni hao", () => expect(typedPinyin("ni hao", "你好")).toBe(true));
  test("tone marks: nǐ hǎo", () => expect(typedPinyin("nǐ hǎo", "你好")).toBe(true));
  test("tone numbers: ni3 hao3", () => expect(typedPinyin("ni3 hao3", "你好")).toBe(true));
  test("no spaces: nǐhǎo, nihao", () => {
    expect(typedPinyin("nǐhǎo", "你好")).toBe(true);
    expect(typedPinyin("nihao", "你好")).toBe(true);
  });
  test("capitals and punctuation: Nǐ hǎo!", () => expect(typedPinyin("Nǐ hǎo!", "你好")).toBe(true));
  test("a wrong tone that IS given fails: ni2 hao3", () => expect(typedPinyin("ni2 hao3", "你好")).toBe(false));
  test("a wrong tone mark fails: nì hǎo", () => expect(typedPinyin("nì hǎo", "你好")).toBe(false));
  test("extra syllables fail: ni hao ma", () => expect(typedPinyin("ni hao ma", "你好")).toBe(false));
  test("了 reads le after a verb (kan le for 看了)", () => expect(typedPinyin("kan le", "看了")).toBe(true));
  test("…and liǎo in 了解 (liao jie yes, le jie no)", () => {
    expect(typedPinyin("liao jie", "了解")).toBe(true);
    expect(typedPinyin("le jie", "了解")).toBe(false);
  });
  test("kan liao for 看了 fails (the stored reading is le)", () => expect(typedPinyin("kan liao", "看了")).toBe(false));
  test("着 as an aspect particle: kan zhe for 看着", () => expect(typedPinyin("kan zhe", "看着")).toBe(true));
  test("ü as v, ü or u: (nv3, nǚ, nu:3) — plain u is another syllable", () => {
    expect(typedPinyin("nv3", "女")).toBe(true);
    expect(typedPinyin("nǚ", "女")).toBe(true);
    expect(typedPinyin("nu:3", "女")).toBe(true);
    expect(typedPinyin("nu3", "女")).toBe(false);
  });
  test("neutral tone: xue sheng / xue2 sheng5 yes, xue2 sheng1 no", () => {
    expect(typedPinyin("xue sheng", "学生")).toBe(true);
    expect(typedPinyin("xue2 sheng5", "学生")).toBe(true);
    expect(typedPinyin("xue2 sheng1", "学生")).toBe(false);
  });
  test("syllable apostrophe: xi'an and xi1 an1 for 西安", () => {
    expect(typedPinyin("xi'an", "西安")).toBe(true);
    expect(typedPinyin("xi1 an1", "西安")).toBe(true);
  });
  test("a key with a hanzi that has no stored reading never takes pinyin", () => expect(typedPinyin("mao", "猫")).toBe(false));
  test("without course readings pinyin is not accepted", () => expect(typedPinyin("ni hao", "你好", zh)).toBe(false));
  test("strict never accepts pinyin for hanzi", () => expect(zhL.normalizeStrict("ni hao")).not.toBe(zhL.normalizeStrict("你好")));
  test("parsePinyinReading reads marks and numbers alike", () => {
    expect(parsePinyinReading("nǐ hǎo")).toEqual(parsePinyinReading("ni3 hao3"));
    expect(pinyinMatches("lv4", parsePinyinReading("lǜ")!)).toBe(true);
  });
});

describe("zh lenient / strict / search folds", () => {
  test("full-width Latin and punctuation (Ｗｏ！ → wo)", () => expect(zh.normalizeLenient("Ｗｏ！")).toBe("wo"));
  test("Chinese punctuation drops (你好！ 你好。 你好，)", () => {
    for (const s of ["你好！", "你好。", "你好，", "“你好”"]) expect(zh.normalizeLenient(s)).toBe("你好");
  });
  test("the alternate form ignores spaces (你 好 = 你好)", () => expect(zh.normalizeLenientAlternate!("你 好")).toBe(zh.normalizeLenientAlternate!("你好")));
  test("strict drops spaces between hanzi", () => expect(zh.normalizeStrict("你 好")).toBe(zh.normalizeStrict("你好")));
  test("search: pinyin without tones (nǐ hǎo, ni3 hao3 → ni hao; lǜ → lu)", () => {
    expect(zh.fold("nǐ hǎo")).toBe("ni hao");
    expect(zh.fold("ni3 hao3")).toBe("ni hao");
    expect(zh.fold("lǜ")).toBe("lu");
  });
  test("search keeps hanzi and numbers", () => expect(zh.fold("2个苹果")).toBe("2个苹果"));
});

describe("zh tokenize", () => {
  test("dictionary maximal match (我是学生)", () => expect(zhL.tokenize("我是学生")).toEqual(["我", "是", "学生"]));
  test("the longest word wins (看了解 → 看, 了解)", () => expect(zhL.tokenize("看了解")).toEqual(["看", "了解"]));
  test("the dictionary path does not depend on Intl.Segmenter", () => {
    const noSeg = withoutSegmenter(() => createChineseRules(LEX));
    for (const s of ["我是学生", "看了解", "我有两个"]) expect(noSeg.tokenize(s)).toEqual(zhL.tokenize(s));
  });
  test("no course data, no segmenter: one token per character", () => {
    const bare = withoutSegmenter(() => createChineseRules());
    expect(bare.tokenize("我有猫")).toEqual(["我", "有", "猫"]);
  });
});

describe("zh speech grader", () => {
  test("a zh-TW style transcript (traditional) passes a simplified variant", () => expect(grade("我是學生", ["我是学生"])).toBe(true));
  test("2个 heard for 两个 passes", () => expect(grade("我有2个", ["我有两个"])).toBe(true));
  test("二个 heard for 两个 fails", () => expect(grade("我有二个", ["我有两个"])).toBe(false));
  test("a concept slot inside an unspaced transcript", () => expect(grade("你好我是学生", [], [["学生"], ["你好"]])).toBe(true));
  test("a different word fails", () => expect(grade("我是老师", ["我是学生"])).toBe(false));
  test("locales are zh-CN, reading speed in characters", () => {
    expect(zh.recognitionLocale).toBe("zh-CN");
    expect(zh.ttsLocale).toBe("zh-CN");
    expect(zh.charsPerSecBand?.unit).toBe("character");
  });
});

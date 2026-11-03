/**
 * P4c (session 2): inflected verbs and い-adjectives get their furigana and their kana readings from the stored
 * reading of the dictionary form. Without this, 食べます showed no furigana over 食 (annotateText matches whole stored
 * surfaces only), and たべます typed for a 食べます key was graded wrong instead of practice. The content generators
 * port the same keys (content/ja/_drafts/_generators/ja_text.py inflection_keys).
 */
import { describe, expect, test } from "bun:test";

import { createJapaneseRules } from "../languages/ja";
import { japaneseInflectedForms, japaneseInflectionSources } from "../languages/ja-inflection";
import { annotateText, buildScriptReadingIndex, type ReadingSource } from "../learning/script-reading";

const f = (...pairs: [string, string?][]) => pairs.map(([base, ruby]) => (ruby ? { base, ruby } : { base }));

const LEXICON: ReadingSource[] = [
  { surface: "食べる", pos: "verb", reading: { kana: "たべる", furigana: f(["食", "た"], ["べる"]) } },
  { surface: "飲む", pos: "verb", reading: { kana: "のむ", furigana: f(["飲", "の"], ["む"]) } },
  { surface: "行く", pos: "verb", reading: { kana: "いく", furigana: f(["行", "い"], ["く"]) } },
  { surface: "来る", pos: "verb", reading: { kana: "くる", furigana: f(["来", "く"], ["る"]) } },
  { surface: "帰る", pos: "verb", reading: { kana: "かえる", furigana: f(["帰", "かえ"], ["る"]) } },
  { surface: "勉強する", pos: "verb", reading: { kana: "べんきょうする", furigana: f(["勉", "べん"], ["強", "きょう"], ["する"]) } },
  { surface: "大きい", pos: "adjective", reading: { kana: "おおきい", furigana: f(["大", "おお"], ["きい"]) } },
  { surface: "降る", pos: "verb", reading: { kana: "ふる", furigana: f(["降", "ふ"], ["る"]) } },
  { surface: "降りる", pos: "verb", reading: { kana: "おりる", furigana: f(["降", "お"], ["りる"]) } },
  { surface: "休み", pos: "noun", reading: { kana: "やすみ", furigana: f(["休", "やす"], ["み"]) } },
  { surface: "休む", pos: "verb", reading: { kana: "やすむ", furigana: f(["休", "やす"], ["む"]) } },
];

const index = buildScriptReadingIndex([...LEXICON, ...japaneseInflectionSources(LEXICON)]);
/** The text with each ruby run written base(ruby). */
const ruby = (text: string) => (annotateText(text, index)?.segments ?? []).map((s) => (s.ruby ? `${s.base}(${s.ruby})` : s.base)).join("");

describe("japaneseInflectedForms", () => {
  test("ichidan: the stem keeps its furigana, the okurigana changes", () => {
    const forms = japaneseInflectedForms({ surface: "食べる", kana: "たべる", pos: "verb", furigana: f(["食", "た"], ["べる"]) });
    expect(forms.map((x) => x.surface)).toContain("食べま");
    expect(forms.find((x) => x.surface === "食べて")).toEqual({ surface: "食べて", kana: "たべて", furigana: f(["食", "た"], ["べて"]) });
  });
  test("only verbs and い-adjectives with kanji inflect", () => {
    expect(japaneseInflectedForms({ surface: "休み", kana: "やすみ", pos: "noun", furigana: f(["休", "やす"], ["み"]) })).toEqual([]);
    expect(japaneseInflectedForms({ surface: "いる", kana: "いる", pos: "verb" })).toEqual([]);
  });
});

describe("furigana over inflected forms", () => {
  test("polite forms of a verb", () => {
    expect(ruby("パンを食べます。")).toBe("パンを食(た)べます。");
    expect(ruby("水を飲みました。")).toBe("水を飲(の)みました。");
    expect(ruby("家へ帰りません。")).toBe("家へ帰(かえ)りません。");
  });
  test("te form, including 行く → 行って", () => {
    expect(ruby("行ってください")).toBe("行(い)ってください");
    expect(ruby("飲んでください")).toBe("飲(の)んでください");
  });
  test("来る reads き before ます and て, こ before ない", () => {
    expect(ruby("来ます")).toBe("来(き)ます");
    expect(ruby("来てください")).toBe("来(き)てください");
    expect(ruby("来ない")).toBe("来(こ)ない");
  });
  test("noun + する verbs", () => expect(ruby("勉強しました")).toBe("勉(べん)強(きょう)しました"));
  test("い-adjectives: negative and past", () => {
    expect(ruby("大きくないです")).toBe("大(おお)きくないです");
    expect(ruby("大きかったです")).toBe("大(おお)きかったです");
  });
  test("a stored surface wins over an inflection key; the verb's own forms still read", () => {
    expect(ruby("休みです")).toBe("休(やす)みです");
    expect(ruby("休みます")).toBe("休(やす)みます");
  });
  test("a key two verbs make with different readings is dropped (降ります: ふります or おります)", () => {
    expect(annotateText("降ります", index)).toBeNull();
    expect(ruby("降って")).toBe("降(ふ)って");
    expect(ruby("降りて")).toBe("降(お)りて");
  });
});

describe("kana typed for an inflected kanji key (practice through alignAnswerToKey)", () => {
  const rules = createJapaneseRules({
    entries: LEXICON.map((e) => ({ surface: e.surface, reading: { value: e.reading.kana!, notation: "kana" }, pos: e.pos })),
  });
  const align = (answer: string, key: string) => rules.alignAnswerToKey!(rules.normalizeLenient(answer), rules.normalizeLenient(key)) === rules.normalizeLenient(key);
  test("たべます for 食べます", () => expect(align("ぱんをたべます", "パンを食べます")).toBe(true));
  test("きてください for 来てください", () => expect(align("きてください", "来てください")).toBe(true));
  test("おおきくないです for 大きくないです", () => expect(align("おおきくないです", "大きくないです")).toBe(true));
  test("a wrong form in kana is still wrong", () => expect(align("たべりました", "食べました")).toBe(false));
  test("the ambiguous 降ります is not aligned from kana", () => expect(align("ふります", "降ります")).toBe(false));
});

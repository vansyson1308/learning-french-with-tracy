/**
 * P4c: the Hepburn reading of kana — one module for the kana primer (each
 * table cell's rōmaji is checked against it) and the romaji line shown under
 * Japanese text until the learner passes the primer checkpoint.
 *
 * Kana-faithful Hepburn: every kana is spelt as the primer teaches it
 * (し shi, ち chi, つ tsu, ふ fu, を o, ぢ ji, づ zu), yōon join (きゃ kya,
 * しゃ sha, じゃ ja), っ doubles the next consonant (っち tch), ん is n
 * (n' before a vowel or y), ー puts a macron on the vowel it lengthens; vowel
 * sequences written in kana stay as written (おう ou, ええ ee).
 */
import { describe, expect, test } from "bun:test";

import { hepburn, kanaHepburn } from "../languages/ja-romaji";

describe("single kana", () => {
  test("the basic table, both scripts", () => {
    expect(["あ", "し", "ち", "つ", "ふ", "を", "ん", "ツ", "シ", "ン", "ヲ"].map(kanaHepburn)).toEqual([
      "a", "shi", "chi", "tsu", "fu", "o", "n", "tsu", "shi", "n", "o",
    ]);
  });
  test("dakuten and handakuten", () => {
    expect(["が", "ざ", "じ", "ぢ", "づ", "ば", "ぱ", "ポ", "ヴ"].map(kanaHepburn)).toEqual(["ga", "za", "ji", "ji", "zu", "ba", "pa", "po", "vu"]);
  });
  test("yōon cells", () => {
    expect(["きゃ", "しゅ", "ちょ", "にゃ", "ひゅ", "みょ", "りゃ", "ぎゅ", "じょ", "びゃ", "ぴゅ", "シャ", "ジュ"].map(kanaHepburn)).toEqual([
      "kya", "shu", "cho", "nya", "hyu", "myo", "rya", "gyu", "jo", "bya", "pyu", "sha", "ju",
    ]);
  });
  test("not kana, or not one cell: undefined", () => {
    expect(kanaHepburn("a")).toBeUndefined();
    expect(kanaHepburn("学")).toBeUndefined();
    expect(kanaHepburn("かき")).toBeUndefined();
    expect(kanaHepburn("ゃ")).toBeUndefined();
  });
});

describe("words", () => {
  test("small tsu doubles the next consonant (tch before ch)", () => {
    expect(["きって", "がっこう", "ざっし", "まっちゃ", "コップ"].map((k) => hepburn(k))).toEqual(["kitte", "gakkou", "zasshi", "matcha", "koppu"]);
  });
  test("ー is a macron; vowel letters written in kana stay as written", () => {
    expect(["コーヒー", "ケーキ", "スーパー", "おばあさん", "おばさん", "とうきょう", "ええ"].map((k) => hepburn(k))).toEqual([
      "kōhī", "kēki", "sūpā", "obaasan", "obasan", "toukyou", "ee",
    ]);
  });
  test("ん before a vowel or y takes an apostrophe", () => {
    expect(["きんえん", "こんや", "せんせい", "しんぶん", "てんいん"].map((k) => hepburn(k))).toEqual(["kin'en", "kon'ya", "sensei", "shinbun", "ten'in"]);
  });
  test("katakana loanword sounds", () => {
    expect(["ファイル", "パーティー", "ディスク", "ウィンドウ", "チェック", "シェア", "ジェット"].map((k) => hepburn(k))).toEqual([
      "fairu", "pātī", "disuku", "windou", "chekku", "shea", "jetto",
    ]);
  });
  test("text that is not kana: undefined (no guessed reading)", () => {
    expect(hepburn("学生")).toBeUndefined();
    expect(hepburn("abc")).toBeUndefined();
    expect(hepburn("")).toBeUndefined();
  });
});

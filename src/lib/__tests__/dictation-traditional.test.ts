/**
 * QC 2026-11-05 §1.1: a zh dictation answer written in traditional characters
 * is correct; the screen shows the simplified key (the taught script). The
 * fold is word-level, from the course lexicon's stored traditional spellings
 * (CC-CEDICT, content/zh/lexicon/lexemes.json reading.traditional) — the same
 * data the lenient form uses. A wrong word stays wrong in either script.
 */
import { describe, expect, test } from "bun:test";

import { dictationMatch, dictationScriptNote } from "../grading";
import { translate } from "../i18n/translate";
import { languageRules } from "../languages";
import { zh } from "../languages/zh";
import type { DictationExercise } from "../types";
import { ZH_LEXICON } from "./zh-course-lexicon";

const zhL = zh.withLexicon!(ZH_LEXICON);

const dictation = (answer: string, alternatives: string[] = []): DictationExercise => ({
  type: "dictation",
  id: "zh-vi:test-e1",
  clipId: "zh.clip.test",
  answer,
  alternatives,
});

/** [simplified key, traditional answer] — words and sentences of the zh-vi course. */
const PAIRS: [string, string][] = [
  ["学生", "學生"],
  ["谢谢", "謝謝"],
  ["这个", "這個"],
  ["银行", "銀行"],
  ["医院", "醫院"],
  ["电话", "電話"],
  ["飞机", "飛機"],
  ["时间", "時間"],
  ["东西", "東西"],
  ["们", "們"],
  ["我们", "我們"],
  ["他们", "他們"],
  ["中国", "中國"],
  ["工厂", "工廠"],
  ["安静", "安靜"],
  ["火车站", "火車站"],
  ["发烧", "發燒"],
  ["汉语", "漢語"],
  ["说话", "說話"],
  ["钱", "錢"],
  ["买", "買"],
  ["开", "開"],
  ["门", "門"],
  ["问题", "問題"],
  ["对不起", "對不起"],
  ["没关系", "沒關係"],
  ["现在", "現在"],
  ["学校", "學校"],
  ["老师", "老師"],
  ["欢迎", "歡迎"],
  ["机场", "機場"],
  ["医生", "醫生"],
  ["护照", "護照"],
  ["图书馆", "圖書館"],
  ["头发", "頭髮"],
  ["认识", "認識"],
  ["请先下车，后上车。", "請先下車，後上車。"],
  ["我听不懂。", "我聽不懂。"],
  ["晚上十一点以后请安静。", "晚上十一點以後請安靜。"],
  ["阮海在一家中国工厂工作。", "阮海在一家中國工廠工作。"],
  ["火车站很近。", "火車站很近。"],
  ["请注意安全。", "請注意安全。"],
];

describe("zh dictation: traditional characters accepted, simplified key shown", () => {
  test.each(PAIRS)("%s ← %s", (key, traditional) => {
    expect(key).not.toBe(traditional);
    expect(dictationMatch(dictation(key), traditional, zhL)).toEqual({ kind: "script", key });
    expect(dictationMatch(dictation(key), key, zhL)).toEqual({ kind: "exact", key });
  });

  test("at least 30 pairs", () => {
    expect(PAIRS.length).toBeGreaterThanOrEqual(30);
  });

  test("an alternative key is matched in traditional too, and reported as that key", () => {
    const exercise = dictation("晚上十一点以后请安静。", ["晚上11点以后请安静。"]);
    expect(dictationMatch(exercise, "晚上11點以後請安靜", zhL)).toEqual({ kind: "script", key: "晚上11点以后请安静。" });
  });

  test("mixed simplified and traditional is accepted", () => {
    expect(dictationMatch(dictation("请先下车，后上车。"), "请先下車，後上车", zhL)?.kind).toBe("script");
    expect(dictationMatch(dictation("我们在中国工作。"), "我們在中国工作。", zhL)?.kind).toBe("script");
  });

  test.each([
    ["银行", "醫院"],
    ["学生", "學校"],
    ["买", "賣"],
    ["请先下车，后上车。", "請先上車，後下車。"],
    ["火车站很近。", "火車站很遠。"],
    ["我听不懂。", "我聽得懂。"],
  ])("a wrong word in traditional is still wrong: %s ≠ %s", (key, answer) => {
    expect(dictationMatch(dictation(key), answer, zhL)).toBeNull();
  });

  test("punctuation stays outside the construct; a wrong simplified word is wrong", () => {
    expect(dictationMatch(dictation("请注意安全。"), "請注意安全", zhL)?.kind).toBe("script");
    expect(dictationMatch(dictation("请注意安全。"), "请注意安静", zhL)).toBeNull();
  });

  test("without the course lexicon nothing is folded (no character table ships)", () => {
    expect(dictationMatch(dictation("学生"), "學生", zh)).toBeNull();
  });

  test("the screen's note: only for an answer accepted in the other script", () => {
    expect(dictationScriptNote(dictation("Il a mangé."), "il a mangé", "fr-en")).toBeNull();
    expect(dictationScriptNote(dictation("Il a mangé."), "il a mange", "fr-en")).toBeNull();
    expect(dictationScriptNote(dictation("学生"), null, "fr-en")).toBeNull();
    expect(translate("en", "ex.traditionalAccepted", { form: "学生" })).toBe("Traditional characters accepted. Simplified: 学生");
    expect(translate("vi", "ex.traditionalAccepted", { form: "学生" })).toBe("Chữ phồn thể được chấp nhận. Giản thể: 学生");
  });

  test("other languages keep the strict contract: no script fold, accents count", () => {
    const fr = languageRules("fr");
    expect(fr.alignScriptToKey).toBeUndefined();
    expect(dictationMatch(dictation("Il a mangé."), "il a mangé", fr)?.kind).toBe("exact");
    expect(dictationMatch(dictation("Il a mangé."), "il a mange", fr)).toBeNull();
  });
});

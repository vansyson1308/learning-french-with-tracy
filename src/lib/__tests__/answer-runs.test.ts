/**
 * Answer-key review pass 2 of zh-vi (2026-11-05): the engine root causes the second reviewer found by running the
 * graders, fixed with per-language plugin data (LanguageRules.slotRuns, LanguageRules.utteranceFrame):
 *  (a) a multi-word writing slot takes the insertions the plugin declares between (zh: and inside) its words
 *      — 喝一杯咖啡, 吃了早饭, 请一天假, 叫李组长 — while a wrong word still fails;
 *  (b) token boundaries are the segmenter's: a slot is realized by answer tokens whose concatenation is its words
 *      (138 1234 5678 = 13812345678), never inside a longer token;
 *  (c) a whole spoken answer may carry the plugin's optional frame — a sentence-final particle where it changes
 *      nothing, a leading filler, a vocative — with every content word exact.
 * Every other plugin declares neither, so its outcomes are unchanged (checked below for fr, en, de, ja, ko).
 */
import { describe, expect, test } from "bun:test";

import { matchIntent, type LearnerNode } from "../interaction/machine";
import { languageRules, type LanguageRules } from "../languages";
import { slotRunSpans } from "../languages/runs";
import { zh } from "../languages/zh";
import { gradeSpokenAttempt } from "../speech/grader";
import { evaluateGuidedWriting, evaluateSimpleForm, normalizeWritten, type WritingRubric, type WritingSlot } from "../writing/rubric";
import { ZH_LEXICON } from "./zh-course-lexicon";

const zhL = zh.withLexicon!(ZH_LEXICON);
const slot = (id: string, variants: string[], cueProvided = false): WritingSlot => ({ id, description: id, variants, cueProvided });
const rubric = (slots: WritingSlot[]): WritingRubric => ({ requiredSlots: slots, minTokens: 1, maxTokens: 80 });
const matched = (rules: LanguageRules, text: string, slots: WritingSlot[]) =>
  evaluateGuidedWriting({ rules, targetLanguage: "X", text, rubric: rubric(slots), promptText: "", knownVocabulary: new Set() }).matchedSlotIds;
const says = (rules: LanguageRules, heard: string, variants: string[]) =>
  gradeSpokenAttempt({ finalTranscript: heard, alternatives: [] }, { acceptedVariants: variants }, rules).correct;
const tokensOf = (rules: LanguageRules, text: string) => normalizeWritten(text, rules).split(" ");

describe("(a) insertions inside a multi-word writing slot (zh plugin data)", () => {
  const drink = slot("drink", ["喝咖啡"]);
  test("a numeral + measure word, an aspect particle: 喝一杯咖啡, 喝了咖啡, 喝杯咖啡", () => {
    for (const text of ["阮南早上喝一杯咖啡。", "阮南早上喝了咖啡。", "阮南早上喝杯咖啡。", "阮南早上喝两杯咖啡。"]) {
      expect(matched(zhL, text, [drink])).toEqual(["drink"]);
    }
  });
  test("inside a separable word (zh: a slot word may open for an insertion): 吃了早饭, 请一天假, 请个假", () => {
    expect(matched(zhL, "我吃了早饭以后去上班。", [slot("breakfast", ["吃早饭"])])).toEqual(["breakfast"]);
    for (const text of ["我发烧了，今天想请一天假。", "我发烧了，今天想请个假。", "我发烧了，今天想请两天假。"]) {
      expect(matched(zhL, text, [slot("rest", ["请假"])])).toEqual(["rest"]);
    }
  });
  test("一下, and a surname before a title: 叫一下组长, 叫李组长", () => {
    const call = slot("call", ["叫组长"]);
    expect(matched(zhL, "机器坏了，请叫一下组长。", [call])).toEqual(["call"]);
    expect(matched(zhL, "机器坏了，请叫李组长来。", [call])).toEqual(["call"]);
    expect(matched(zhL, "我给王经理打电话。", [slot("phone", ["给经理打电话"])])).toEqual(["phone"]);
  });
  test("a wrong word still fails: another drink, another person, a word the plugin does not declare, a negation", () => {
    expect(matched(zhL, "阮南早上喝一杯茶。", [drink])).toEqual([]);
    expect(matched(zhL, "阮南早上喝热咖啡。", [drink])).toEqual([]);
    expect(matched(zhL, "请叫王经理来。", [slot("call", ["叫组长"])])).toEqual([]);
    expect(matched(zhL, "我吃饭以后去上班。", [slot("breakfast", ["吃早饭"])])).toEqual([]);
    expect(matched(zhL, "阮南早上不喝一杯咖啡。", [drink])).toEqual([]);
    // a surname is an insertion only before a title, never on its own
    expect(matched(zhL, "阮南早上喝李咖啡。", [drink])).toEqual([]);
  });
  test("the spans: an insertion is never at the edge of a slot", () => {
    const tokens = tokensOf(zhL, "我喝一杯咖啡");
    expect(slotRunSpans(tokens, tokensOf(zhL, "喝咖啡"), zhL.slotRuns)).toEqual([[1, tokens.length]]);
    expect(slotRunSpans(tokens, tokensOf(zhL, "咖啡"), zhL.slotRuns)).toEqual([[tokens.length - 1, tokens.length]]);
    expect(slotRunSpans(tokensOf(zhL, "喝了"), tokensOf(zhL, "喝"), zhL.slotRuns)).toEqual([[0, 1]]);
  });
});

describe("(b) a slot matches the segmenter's tokens, joined", () => {
  const fields = [{ id: "phone", label: "电话", slotId: "phone" }];
  const form = (value: string, variants: string[]) =>
    evaluateSimpleForm({ rules: zhL, targetLanguage: "X", values: { phone: value }, fields, rubric: rubric([slot("phone", variants, true)]) }).verdict;
  test("a phone number typed with spaces, hyphens or neither satisfies a slot that lists it unbroken or hyphenated", () => {
    for (const value of ["13812345678", "138-1234-5678", "138 1234 5678", "138 - 1234 - 5678"]) {
      expect(form(value, ["138-1234-5678", "13812345678"])).toBe("meets_rubric");
    }
    expect(form("138 1234 5679", ["138-1234-5678", "13812345678"])).toBe("does_not_meet_rubric");
  });
  test("the compound: the slot's words concatenate to one answer token (and the other way round)", () => {
    expect(form("13812345678", ["138 1234 5678"])).toBe("meets_rubric");
    expect(matched(zhL, "李组长，早上好！", [slot("greeting", ["早上好"])])).toEqual(["greeting"]);
  });
  test("never inside a longer token: 早上 is not in 早上好, 电影 is not in 电影院", () => {
    expect(matched(zhL, "李组长，早上好！", [slot("morning", ["早上"])])).toEqual([]);
    expect(matched(zhL, "我们七点去电影院吧。", [slot("movie", ["电影"])])).toEqual([]);
  });
});

describe("(c) the frame of a whole spoken answer (zh plugin data)", () => {
  test("a sentence-final 啊 / 呀 after any answer", () => {
    expect(says(zhL, "谢谢啊", ["谢谢"])).toBe(true);
    expect(says(zhL, "晚上好呀", ["晚上好"])).toBe(true);
    expect(says(zhL, "大家早上好啊", ["大家早上好"])).toBe(true);
  });
  test("了 after an age (今年 … 岁了), 吧 after a request, 呢 after a question word — and not elsewhere", () => {
    expect(says(zhL, "我今年二十五岁了", ["我今年二十五岁"])).toBe(true);
    expect(says(zhL, "我今年25岁了", ["我今年二十五岁"])).toBe(true);
    expect(says(zhL, "给我两张票吧", ["给我两张票"])).toBe(true);
    expect(says(zhL, "银行在哪儿呢", ["银行在哪儿"])).toBe(true);
    expect(says(zhL, "我是学生了", ["我是学生"])).toBe(false);
    expect(says(zhL, "我是越南人吧", ["我是越南人"])).toBe(false);
    expect(says(zhL, "我叫阮海呢", ["我叫阮海"])).toBe(false);
    // an answer that already ends with a particle takes no second one
    expect(says(zhL, "好吗啊", ["好吗"])).toBe(false);
  });
  test("a leading 嗯 / 那, a vocative before or after: 组长，谢谢 · 谢谢您，组长 · 王经理，早上好 · 老李，对不起", () => {
    expect(says(zhL, "嗯，我叫阮海", ["我叫阮海"])).toBe(true);
    expect(says(zhL, "那我先走了", ["我先走了"])).toBe(true);
    expect(says(zhL, "组长，谢谢", ["谢谢"])).toBe(true);
    expect(says(zhL, "谢谢您，组长", ["谢谢您"])).toBe(true);
    expect(says(zhL, "王经理，早上好", ["早上好"])).toBe(true);
    expect(says(zhL, "老李，对不起啊", ["对不起"])).toBe(true);
    expect(says(zhL, "李组长，对不起，我迟到了", ["对不起我迟到了"])).toBe(true);
  });
  test("content words stay exact: another name, another number, a negation, a vocative alone", () => {
    expect(says(zhL, "我叫阮南啊", ["我叫阮海"])).toBe(false);
    expect(says(zhL, "我今年二十六岁了", ["我今年二十五岁"])).toBe(false);
    expect(says(zhL, "组长，不谢", ["谢谢"])).toBe(false);
    expect(says(zhL, "组长", ["谢谢"])).toBe(false);
    expect(says(zhL, "谢谢你们组长好", ["谢谢"])).toBe(false);
  });
  test("the interaction grader reads the same frame", () => {
    const node: LearnerNode = { kind: "learner", id: "l0", prompt: "", noMatchNext: "r0", scored: true, expected: [{ intent: "thank", acceptedVariants: ["谢谢"], next: "t" }] };
    expect(matchIntent(node, { finalTranscript: "组长，谢谢啊", alternatives: [] }, zhL)?.intent).toBe("thank");
  });
});

describe("every other plugin declares no slot runs and no frame: outcomes unchanged", () => {
  test("no data", () => {
    for (const code of ["fr", "en", "es", "de", "it", "pt", "vi", "ja", "ko"]) {
      const rules = languageRules(code);
      expect(rules.slotRuns).toBeUndefined();
      expect(rules.utteranceFrame).toBeUndefined();
    }
  });
  test("an insertion still breaks a Latin slot; a framed answer is still not a Latin variant", () => {
    const fr = languageRules("fr");
    expect(matched(fr, "Je bois un café le matin.", [slot("drink", ["bois café"])])).toEqual([]);
    expect(matched(fr, "Je bois café le matin.", [slot("drink", ["bois café"])])).toEqual(["drink"]);
    expect(says(fr, "merci Paul", ["merci"])).toBe(false);
    expect(says(languageRules("en"), "thanks ah", ["thanks"])).toBe(false);
    expect(says(languageRules("de"), "danke Paul", ["danke"])).toBe(false);
  });
  test("ja stays as it was (no opt-in)", () => {
    const ja = languageRules("ja");
    expect(says(ja, "ありがとうね", ["ありがとう"])).toBe(false);
  });
});

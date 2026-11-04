/**
 * P4d: the writing rubric's sentence-verb check under the ja dictionary tokenizer the app grades with.
 *
 * Bound to a course's words, the ja tokenizer reads いますか as いま (the kana of 今) + す + か, so the authored
 * allowlist entry ます (tokens ま す) was never a token run of 住んでいますか, 妹が二人います or 日本にいます: the app
 * told a learner who wrote a polite verb that the sentence has no verb. A plugin with a whole-utterance reading (ja)
 * also finds the verb in the reading of the whole answer, as the speech grader reads a whole variant.
 */
import { describe, expect, test } from "bun:test";

import jaIndex from "../../content/lexicon/ja-index.json";
import { languageRules, type CourseLexicon } from "../languages";
import { createJapaneseRules } from "../languages/ja";
import { createChineseRules } from "../languages/zh";
import { evaluateGuidedWriting, normalizeWritten, type WritingRubric } from "../writing/rubric";

const kana = (surface: string, value: string, pos?: string) => ({ surface, reading: { value, notation: "kana" }, ...(pos ? { pos } : {}) });

const JA: CourseLexicon = {
  entries: [kana("今", "いま"), kana("住む", "すむ", "verb"), kana("どこ", "どこ"), kana("に", "に"), kana("か", "か"), kana("日本", "にほん"), kana("学生", "がくせい"), { surface: "です" }],
};
const ja = createJapaneseRules(JA);
const VERBS = ["です", "ます", "ました"];
const ask: WritingRubric = { requiredSlots: [{ id: "ask", description: "ask", variants: ["どこに住んで"], cueProvided: false }], minTokens: 2, maxTokens: 12, requireSentenceVerbs: VERBS };

const known = (rules: typeof ja, words: string[]) => new Set(words.flatMap((w) => normalizeWritten(w, rules).split(" ")));
const run = (rules: typeof ja, text: string, rubric: WritingRubric, vocabulary: ReadonlySet<string>) =>
  evaluateGuidedWriting({ rules, targetLanguage: "X", text, rubric, promptText: "", knownVocabulary: vocabulary });
const usesVerb = (ev: ReturnType<typeof run>) => ev.feedback.some((m) => m.key === "rubric.useVerb");

describe("ja: a polite verb after い is a sentence verb", () => {
  const vocabulary = known(ja, ["どこ", "に", "住んで", "います", "か", "日本", "学生", "です"]);

  test("the dictionary tokens hide ます inside いま", () => {
    expect(normalizeWritten("どこに住んでいますか", ja)).toBe("どこ に 住 ん で いま す か");
  });

  test("どこに住んでいますか meets the rubric", () => {
    const ev = run(ja, "どこに住んでいますか。", ask, vocabulary);
    expect(usesVerb(ev)).toBe(false);
    expect(ev.verdict).toBe("meets_rubric");
  });

  test("a verb written in kana, and います alone, count too", () => {
    const where: WritingRubric = { requiredSlots: [{ id: "where", description: "where", variants: ["日本"], cueProvided: false }], minTokens: 2, maxTokens: 12, requireSentenceVerbs: VERBS };
    expect(usesVerb(run(ja, "日本にいます。", where, vocabulary))).toBe(false);
    expect(usesVerb(run(ja, "どこにすんでいますか", ask, vocabulary))).toBe(false);
  });

  test("an answer with no verb still gets the feedback", () => {
    const where: WritingRubric = { requiredSlots: [{ id: "where", description: "where", variants: ["日本"], cueProvided: false }], minTokens: 1, maxTokens: 12, requireSentenceVerbs: VERBS };
    const ev = run(ja, "日本に", where, vocabulary);
    expect(usesVerb(ev)).toBe(true);
    expect(ev.verdict).toBe("does_not_meet_rubric");
  });
});

describe("ja-vi: the shipped course lexicon", () => {
  const entries = (jaIndex as { entries: { surface: string; pos?: string; pronunciation?: { value: string; notation: string } }[] }).entries.map((e) => ({
    surface: e.surface,
    ...(e.pronunciation ? { reading: { value: e.pronunciation.value, notation: e.pronunciation.notation } } : {}),
    ...(e.pos ? { pos: e.pos } : {}),
  }));
  const bound = createJapaneseRules({ entries });

  test("ja.write.p_ask's model answer has its verb", () => {
    const vocabulary = known(bound, ["どこ", "に", "住んで", "います", "か"]);
    expect(usesVerb(run(bound, "どこに住んでいますか。", ask, vocabulary))).toBe(false);
  });
});

describe("plugins without a whole-utterance reading keep token runs", () => {
  test("zh: 是 inside 可是 is not the verb 是", () => {
    const zh = createChineseRules({ entries: [{ surface: "可是" }, { surface: "我" }, { surface: "是" }, { surface: "学生" }] });
    const rubric: WritingRubric = { requiredSlots: [{ id: "who", description: "who", variants: ["学生"], cueProvided: false }], minTokens: 1, maxTokens: 12, requireSentenceVerbs: ["是"] };
    const vocabulary = known(zh, ["可是", "我", "是", "学生"]);
    expect(usesVerb(run(zh, "可是学生", rubric, vocabulary))).toBe(true);
    expect(usesVerb(run(zh, "我是学生", rubric, vocabulary))).toBe(false);
  });

  test("Latin plugins have none", () => {
    for (const code of ["fr", "en", "es", "de", "it", "pt", "vi"]) expect(languageRules(code).utteranceReading).toBeUndefined();
  });
});

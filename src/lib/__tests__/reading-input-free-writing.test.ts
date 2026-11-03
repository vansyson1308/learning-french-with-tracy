/**
 * P4c (P4b open item, decided): free writing typed in the reading notation.
 *
 * A guided-writing answer whose only mismatch is that it is written in the
 * plugin's reading notation (ja kana, zh pinyin) counts as UNDERSTOOD
 * PRACTICE, exactly like a simple-form slot (P4b rubric guard):
 *  - the ja / zh plugins align a run of the free text to a slot through the
 *    stored readings (alignWrittenToKey), and only a run written entirely in
 *    the reading notation is ever rewritten — a kanji / hanzi the learner
 *    typed is never replaced;
 *  - kana / pinyin spellings of course words count as target-language
 *    vocabulary for the "recognizably the target language" floor;
 *  - the slot is reported in readingOnlySlotIds, so the session shows the
 *    task accepted but records no first-attempt result (no production
 *    evidence) unless the profile sets readingInputIsProduction;
 *  - Latin plugins are unchanged.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import xcIndex from "../../content/test-only/lexicon/xc-index.json";
import { __registerCourseArtifactsForTests } from "../content-registry";
import { __registerCourseProfileForTests, courseProfile } from "../course-profile";
import { checkAnswer, readingOnlyAnswer, type Answer } from "../grading";
import { languageRules, type CourseLexicon } from "../languages";
import { createJapaneseRules } from "../languages/ja";
import { createChineseRules } from "../languages/zh";
import { emptySessionState, sessionReducer } from "../session/reducer";
import type { GuidedWritingExercise } from "../types";
import { evaluateGuidedWriting, normalizeWritten, type WritingRubric } from "../writing/rubric";

const kana = (surface: string, value: string, pos?: string) => ({ surface, reading: { value, notation: "kana" }, ...(pos ? { pos } : {}) });
const pinyin = (surface: string, value: string) => ({ surface, reading: { value, notation: "pinyin" } });

const JA: CourseLexicon = {
  entries: [kana("私", "わたし"), kana("学生", "がくせい"), kana("毎日", "まいにち"), kana("食べる", "たべる", "verb"), { surface: "です" }, { surface: "パン" }],
};
const ZH: CourseLexicon = { entries: [pinyin("我", "wǒ"), pinyin("是", "shì"), pinyin("学生", "xué shēng"), pinyin("汉语", "hàn yǔ")] };

const ja = createJapaneseRules(JA);
const zh = createChineseRules(ZH);

const slot = (id: string, variants: string[]) => ({ id, description: id, variants, cueProvided: false });

/** Known vocabulary as the build compiles it: the course's words in the target script. */
const known = (rules: typeof ja, words: string[]) => new Set(words.flatMap((w) => normalizeWritten(w, rules).split(" ")));
const JA_KNOWN = known(ja, ["私", "は", "学生", "です", "毎日", "パン", "を", "食べます"]);
const ZH_KNOWN = known(zh, ["我", "是", "学生", "汉语"]);

const run = (rules: typeof ja, vocabulary: ReadonlySet<string>, text: string, rubric: WritingRubric) =>
  evaluateGuidedWriting({ rules, targetLanguage: "X", text, rubric, promptText: "", knownVocabulary: vocabulary });

describe("ja: free writing aligned through the stored readings", () => {
  const who: WritingRubric = { requiredSlots: [slot("who", ["学生"])], minTokens: 2, maxTokens: 20 };

  test("an answer typed entirely in kana meets the rubric, reading-only", () => {
    const ev = run(ja, JA_KNOWN, "わたしは がくせいです。", who);
    expect(ev.verdict).toBe("meets_rubric");
    expect(ev.matchedSlotIds).toEqual(["who"]);
    expect(ev.readingOnlySlotIds).toEqual(["who"]);
  });

  test("katakana and small spacing differences fold the same way", () => {
    expect(run(ja, JA_KNOWN, "ワタシハ ガクセイデス", who).readingOnlySlotIds).toEqual(["who"]);
  });

  test("an inflected verb typed in kana aligns to its kanji form", () => {
    const eat: WritingRubric = { requiredSlots: [slot("eat", ["食べます"])], minTokens: 2, maxTokens: 20 };
    const ev = run(ja, JA_KNOWN, "まいにち パンを たべます。", eat);
    expect(ev.verdict).toBe("meets_rubric");
    expect(ev.readingOnlySlotIds).toEqual(["eat"]);
  });

  test("the target script is production: no readingOnlySlotIds field", () => {
    const ev = run(ja, JA_KNOWN, "私は学生です。", who);
    expect(ev.verdict).toBe("meets_rubric");
    expect("readingOnlySlotIds" in ev).toBe(false);
  });

  test("kana that spells another reading never matches", () => {
    const ev = run(ja, JA_KNOWN, "わたしは がくしょうです。", who);
    expect(ev.matchedSlotIds).toEqual([]);
    expect(ev.verdict).not.toBe("meets_rubric");
  });

  test("a run holding a kanji the learner typed is never rewritten", () => {
    // 学 + せい: half kanji, half kana — not the reading notation alone.
    expect(ja.alignWrittenToKey!(normalizeWritten("学せいです", ja), normalizeWritten("学生", ja))).toBe(normalizeWritten("学せいです", ja));
  });

  test("kana spellings of course words count toward the known-vocabulary floor", () => {
    const none: WritingRubric = { requiredSlots: [slot("bread", ["パン"])], minTokens: 2, maxTokens: 20 };
    // まいにち is 毎日 in kana: known vocabulary, so the answer is judged (not "write in Japanese").
    const ev = run(ja, JA_KNOWN, "まいにち パンです", none);
    expect(ev.verdict).toBe("meets_rubric");
    expect(ev.knownShare).toBe(1);
  });
});

describe("zh: free writing aligned through pinyin", () => {
  const who: WritingRubric = { requiredSlots: [slot("who", ["学生"])], minTokens: 2, maxTokens: 20, requireSentenceVerbs: ["是"] };

  test("pinyin without tones, with tone marks, with tone numbers", () => {
    for (const text of ["wo shi xuesheng", "wǒ shì xuéshēng", "wo3 shi4 xue2 sheng1"]) {
      const ev = run(zh, ZH_KNOWN, text, who);
      expect(ev.verdict).toBe("meets_rubric");
      expect(ev.readingOnlySlotIds).toEqual(["who"]);
    }
  });

  test("a tone that is given must be the stored one", () => {
    expect(run(zh, ZH_KNOWN, "wo shi xue3 sheng", who).matchedSlotIds).toEqual([]);
  });

  test("hanzi is production; a mixed answer realizes the hanzi slot in the script", () => {
    expect("readingOnlySlotIds" in run(zh, ZH_KNOWN, "我是学生", who)).toBe(false);
    expect("readingOnlySlotIds" in run(zh, ZH_KNOWN, "wo shi 学生", who)).toBe(false);
  });
});

describe("Latin plugins are unchanged", () => {
  test("no reading alignment for free writing, no known-reading predicate", () => {
    for (const code of ["fr", "es", "de", "it", "en", "vi", "pt"]) {
      const rules = languageRules(code);
      expect(rules.knownReading).toBeUndefined();
      expect(rules.readingInput).toBeUndefined();
    }
  });
});

// --- through grading and the session machine (course ja-xc, the xc test lexicon) ---

beforeAll(() => {
  __registerCourseProfileForTests({ ...courseProfile("ja-en"), id: "ja-xcw" });
  __registerCourseArtifactsForTests("ja-xcw", { lexiconIndex: xcIndex });
});
afterAll(() => {
  __registerCourseArtifactsForTests("ja-xcw", null);
  __registerCourseProfileForTests(null, "ja-xcw");
});

const guided: GuidedWritingExercise = {
  type: "guidedWriting",
  id: "xc:gw",
  writingTaskId: "xc.write.gw",
  writingMode: "guided",
  instruction: "Write who you are.",
  rubric: { requiredSlots: [slot("who", ["学生"])], minTokens: 1, maxTokens: 10 },
  modelAnswers: [],
};

const text = (value: string): Answer => ({ written: true, kind: "text", text: value });

describe("grading and session: guided writing in kana is practice", () => {
  test("accepted, and reading-only", () => {
    expect(checkAnswer(guided, text("がくせい"), "ja-xcw")).toBe(true);
    expect(readingOnlyAnswer(guided, text("がくせい"), "ja-xcw")).toBe(true);
    expect(readingOnlyAnswer(guided, text("学生"), "ja-xcw")).toBe(false);
  });

  test("the session shows it correct but records no first-attempt result", () => {
    const started = sessionReducer(emptySessionState(), {
      type: "start",
      sessionId: "s",
      steps: [{ type: "exercise", stepId: guided.id, exercise: guided }],
      courseId: "ja-xcw",
      retryPolicy: "none",
    });
    const s = [{ type: "answer" as const, value: text("がくせい") }, { type: "check" as const }].reduce(sessionReducer, started);
    expect(s.status).toBe("correct");
    expect(s.firstResults).toEqual({});
    expect(s.readingOnly).toEqual({ "xc:gw": true });
  });
});

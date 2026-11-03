/**
 * P4b task 4, writing rubric: production evidence requires the target
 * script unless the course profile says otherwise. The rubric engine
 * reports which slots were realized ONLY through the plugin's reading
 * notation (ja kana for a kanji variant, zh pinyin for a hanzi variant),
 * with the same semantics as grading.ts readingOnlyAnswer:
 *  - the learner still sees the verdict (understood: practice),
 *  - a task that meets its rubric only thanks to such a slot records no
 *    first-attempt result (whole task: the rubric's verdict is one result),
 *  - per-slot scoring (exam message points) never credits such a slot,
 *  - `readingInputIsProduction` restores the plain behaviour.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import xcIndex from "../../content/test-only/lexicon/xc-index.json";
import { __registerCourseArtifactsForTests } from "../content-registry";
import { __registerCourseProfileForTests, courseProfile } from "../course-profile";
import { checkAnswer, evaluateWrittenAnswer, productionWritingEvaluation, readingOnlyAnswer, type Answer } from "../grading";
import { languageRules, languageRulesForCourse } from "../languages";
import { emptySessionState, sessionReducer, type SessionMachineState } from "../session/reducer";
import type { ExerciseStep } from "../session/types";
import type { SimpleFormExercise } from "../types";
import { evaluateGuidedWriting, evaluateSimpleForm, type WritingRubric } from "../writing/rubric";

const COURSES = { "ja-xc": "ja-en", "zh-xc": "zh-en", "ja-xcprod": "ja-en" } as const;

beforeAll(() => {
  for (const [id, base] of Object.entries(COURSES)) {
    __registerCourseProfileForTests({
      ...courseProfile(base),
      id,
      ...(id === "ja-xcprod" ? { readingInputIsProduction: true as const } : {}),
    });
    __registerCourseArtifactsForTests(id, { lexiconIndex: xcIndex });
  }
});

afterAll(() => {
  for (const id of Object.keys(COURSES)) {
    __registerCourseArtifactsForTests(id, null);
    __registerCourseProfileForTests(null, id);
  }
});

const slot = (id: string, variants: string[]) => ({ id, description: id, variants, cueProvided: true });

const form = (slots: [string, string[]][]): SimpleFormExercise => ({
  type: "simpleForm",
  id: "xc:form",
  writingTaskId: "xc.write.form",
  instruction: "Fill in the card.",
  fields: slots.map(([id]) => ({ id, label: id, slotId: id })),
  rubric: { requiredSlots: slots.map(([id, variants]) => slot(id, variants)), minTokens: 1, maxTokens: 10 },
  modelAnswers: [],
});

const filled = (values: Record<string, string>): Answer => ({ written: true, kind: "form", values });

const jaForm = form([["word", ["学生"]]]);
const zhForm = form([["word", ["汉语"]]]);

describe("rubric engine: slots realized only through the reading notation", () => {
  const evaluate = (courseId: string, value: string, variants: string[]) =>
    evaluateSimpleForm({
      rules: languageRulesForCourse(courseId),
      targetLanguage: "X",
      values: { word: value },
      fields: [{ id: "word", label: "word", slotId: "word" }],
      rubric: { requiredSlots: [slot("word", variants)], minTokens: 1, maxTokens: 10 },
    });

  test("ja: kana for a kanji variant still matches, and is reported as reading-only", () => {
    const ev = evaluate("ja-xc", "がくせい", ["学生"]);
    expect(ev.verdict).toBe("meets_rubric");
    expect(ev.matchedSlotIds).toEqual(["word"]);
    expect(ev.readingOnlySlotIds).toEqual(["word"]);
  });
  test("ja: the target script (or an authored kana variant) is a script match: no extra field at all", () => {
    expect("readingOnlySlotIds" in evaluate("ja-xc", "学生", ["学生"])).toBe(false);
    expect("readingOnlySlotIds" in evaluate("ja-xc", "がくせい", ["学生", "がくせい"])).toBe(false);
  });
  test("zh: pinyin for a hanzi variant is reading-only; hanzi is not", () => {
    expect(evaluate("zh-xc", "hàn yǔ", ["汉语"]).readingOnlySlotIds).toEqual(["word"]);
    expect("readingOnlySlotIds" in evaluate("zh-xc", "汉语", ["汉语"])).toBe(false);
  });
  test("Latin plugins never report it (shape unchanged)", () => {
    expect(evaluate("fr-en", "Paris", ["Paris"])).toEqual({
      verdict: "meets_rubric",
      matchedSlotIds: ["word"],
      missingSlots: [],
      knownShare: 1,
      tokenCount: 1,
      feedback: [],
    });
  });
  test("guided writing: a plugin aligning free writing through its reading notation is classified the same way", () => {
    const ja = languageRulesForCourse("ja-xc");
    const rules = { ...ja, alignWrittenToKey: ja.alignAnswerToKey };
    const rubric: WritingRubric = { requiredSlots: [slot("who", ["学生"])], minTokens: 1, maxTokens: 10 };
    const run = (text: string) =>
      evaluateGuidedWriting({ rules, targetLanguage: "X", text, rubric, promptText: "", knownVocabulary: new Set(["がくせい", "学生"]) });
    expect(run("がくせい").matchedSlotIds).toEqual(["who"]);
    expect(run("がくせい").readingOnlySlotIds).toEqual(["who"]);
    expect("readingOnlySlotIds" in run("学生")).toBe(false);
  });
});

describe("grading: a writing task accepted only through the reading notation", () => {
  test("is shown accepted, but is reading-only", () => {
    expect(checkAnswer(jaForm, filled({ word: "がくせい" }), "ja-xc")).toBe(true);
    expect(readingOnlyAnswer(jaForm, filled({ word: "がくせい" }), "ja-xc")).toBe(true);
    expect(readingOnlyAnswer(zhForm, filled({ word: "han4 yu3" }), "zh-xc")).toBe(true);
  });
  test("the target script is production", () => {
    expect(readingOnlyAnswer(jaForm, filled({ word: "学生" }), "ja-xc")).toBe(false);
    expect(readingOnlyAnswer(zhForm, filled({ word: "漢語" }), "zh-xc")).toBe(false);
  });
  test("one reading-only field makes the whole task practice", () => {
    const two = form([["a", ["学生"]], ["b", ["食べる"]]]);
    expect(checkAnswer(two, filled({ a: "がくせい", b: "食べる" }), "ja-xc")).toBe(true);
    expect(readingOnlyAnswer(two, filled({ a: "がくせい", b: "食べる" }), "ja-xc")).toBe(true);
    expect(readingOnlyAnswer(two, filled({ a: "学生", b: "食べる" }), "ja-xc")).toBe(false);
  });
  test("a task that does not meet its rubric is not 'accepted through reading'", () => {
    const two = form([["a", ["学生"]], ["b", ["食べる"]]]);
    expect(checkAnswer(two, filled({ a: "がくせい", b: "x" }), "ja-xc")).toBe(false);
    expect(readingOnlyAnswer(two, filled({ a: "がくせい", b: "x" }), "ja-xc")).toBe(false);
  });
  test("the course profile opt-out, Latin courses and bare tests", () => {
    expect(readingOnlyAnswer(jaForm, filled({ word: "がくせい" }), "ja-xcprod")).toBe(false);
    expect(readingOnlyAnswer(form([["word", ["Paris"]]]), filled({ word: "Paris" }), "fr-en")).toBe(false);
    expect(readingOnlyAnswer(jaForm, filled({ word: "がくせい" }), "")).toBe(false);
  });
  test("the production view of an evaluation drops reading-only slots from what it scores", () => {
    const two = form([["a", ["学生"]], ["b", ["食べる"]]]);
    const answer = filled({ a: "がくせい", b: "食べる" });
    expect(evaluateWrittenAnswer(two, answer, "ja-xc")?.matchedSlotIds).toEqual(["a", "b"]);
    expect(productionWritingEvaluation(two, answer, "ja-xc")?.matchedSlotIds).toEqual(["b"]);
    expect(productionWritingEvaluation(two, answer, "ja-xcprod")?.matchedSlotIds).toEqual(["a", "b"]);
    const latin = form([["word", ["Paris"]]]);
    const paris = filled({ word: "Paris" });
    expect(productionWritingEvaluation(latin, paris, "fr-en")).toEqual(evaluateWrittenAnswer(latin, paris, "fr-en"));
  });
});

const formStep = (exercise: SimpleFormExercise, extra: Partial<ExerciseStep> = {}): ExerciseStep => ({
  type: "exercise",
  stepId: exercise.id,
  exercise,
  ...extra,
});

function checked(step: ExerciseStep, answer: Answer, courseId: string): SessionMachineState {
  const started = sessionReducer(emptySessionState(), { type: "start", sessionId: "s", steps: [step], courseId, retryPolicy: "none" });
  return [{ type: "answer" as const, value: answer }, { type: "check" as const }].reduce(sessionReducer, started);
}

describe("session machine: writing steps", () => {
  test("a kana form is shown correct but leaves no first-attempt evidence", () => {
    const s = checked(formStep(jaForm), filled({ word: "がくせい" }), "ja-xc");
    expect(s.status).toBe("correct");
    expect(s.firstResults).toEqual({});
    expect(s.readingOnly).toEqual({ "xc:form": true });
  });
  test("the target script records the first attempt as before", () => {
    const s = checked(formStep(jaForm), filled({ word: "学生" }), "ja-xc");
    expect(s.firstResults).toEqual({ "xc:form": true });
    expect("readingOnly" in s).toBe(false);
  });
  test("with the profile opt-in, kana is a first-attempt result", () => {
    expect(checked(formStep(jaForm), filled({ word: "がくせい" }), "ja-xcprod").firstResults).toEqual({ "xc:form": true });
  });

  // A message-scored part (exam): greeting, one point, closing.
  const message = form([["g", ["学生"]], ["p", ["食べる"]], ["c", ["学生"]]]);
  const writingPoints = { greetingSlotId: "g", closingSlotId: "c", pointSlotIds: ["p"], minTokens: 1, maxTokens: 10, maxPoints: 10 };
  const scored = formStep(message, { writingPoints });

  test("message points never credit a slot realized only in the reading notation", () => {
    const answer = filled({ g: "がくせい", p: "食べる", c: "x" });
    const guarded = checked(scored, answer, "ja-xc");
    const optOut = checked(scored, answer, "ja-xcprod");
    expect(guarded.firstResults).toEqual({ "xc:form": false });
    expect(optOut.firstResults).toEqual({ "xc:form": false });
    expect(optOut.firstCredits).toEqual({ "xc:form": 0.9 });
    expect(guarded.firstCredits).toEqual({ "xc:form": 0.8 });
  });
  test("a message accepted only through the reading notation records neither a result nor a credit", () => {
    const s = checked(scored, filled({ g: "がくせい", p: "食べる", c: "学生" }), "ja-xc");
    expect(s.status).toBe("correct");
    expect(s.firstResults).toEqual({});
    expect(s.firstCredits).toBeUndefined();
    expect(checked(scored, filled({ g: "学生", p: "食べる", c: "学生" }), "ja-xc").firstCredits).toEqual({ "xc:form": 1 });
  });
});

test("plugins: only ja and zh declare a reading notation", () => {
  expect(languageRules("ja").readingInput).toBe("kana");
  expect(languageRules("zh").readingInput).toBe("pinyin");
});

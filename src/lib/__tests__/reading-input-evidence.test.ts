/**
 * P4b stage 5 (task 4): kana typed for a Japanese key and pinyin typed for
 * a Chinese key are accepted as PRACTICE only. Production evidence still
 * needs the target script, unless the course profile says otherwise:
 *  - grading: readingOnlyAnswer tells the two apart,
 *  - session machine: a reading-only answer is correct but leaves no
 *    first-attempt result (scored surfaces get no evidence for the item),
 *  - evidence plan: an assessment drops to practice, so the gate never
 *    schedules from it.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import xcIndex from "../../content/test-only/lexicon/xc-index.json";
import { scoreObjectives } from "../assessment/checkpoint";
import { __registerCourseArtifactsForTests } from "../content-registry";
import { __registerCourseProfileForTests, courseProfile } from "../course-profile";
import { checkAnswer, readingOnlyAnswer } from "../grading";
import { languageRules } from "../languages";
import { gateEvidence } from "../learning/evidence-gate";
import { buildCheckEvidence } from "../session/evidence";
import { emptySessionState, sessionReducer, type SessionMachineState } from "../session/reducer";
import type { ExerciseStep, SessionDefinition } from "../session/types";
import type { TypeAnswerExercise, WordBankExercise } from "../types";

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

const typed = (answer: string, alternatives: string[] = []): TypeAnswerExercise => ({
  type: "typeAnswer",
  id: "t:1",
  mode: "produceTarget",
  prompt: "student",
  answer,
  alternatives,
});

describe("plugins declare their reading notation", () => {
  test("ja reads kana, zh reads pinyin; ko and Latin plugins declare none", () => {
    expect(languageRules("ja").readingInput).toBe("kana");
    expect(languageRules("zh").readingInput).toBe("pinyin");
    for (const code of ["ko", "fr", "en", "es", "de", "it", "pt", "vi"]) expect(languageRules(code).readingInput).toBeUndefined();
  });
});

describe("readingOnlyAnswer", () => {
  test("ja: kana for a kanji key is accepted, but only as reading input", () => {
    expect(checkAnswer(typed("学生"), "がくせい", "ja-xc")).toBe(true);
    expect(readingOnlyAnswer(typed("学生"), "がくせい", "ja-xc")).toBe(true);
    expect(readingOnlyAnswer(typed("学生"), "ガクセイ", "ja-xc")).toBe(true);
    expect(readingOnlyAnswer(typed("食べる"), "たべる", "ja-xc")).toBe(true);
  });
  test("ja: the target script is production; a wrong answer is not reading input", () => {
    expect(readingOnlyAnswer(typed("学生"), "学生", "ja-xc")).toBe(false);
    expect(readingOnlyAnswer(typed("学生"), " 学生。", "ja-xc")).toBe(false);
    expect(checkAnswer(typed("学生"), "がくしょう", "ja-xc")).toBe(false);
    expect(readingOnlyAnswer(typed("学生"), "がくしょう", "ja-xc")).toBe(false);
  });
  test("ja: an authored kana alternative makes the kana answer a script match", () => {
    expect(readingOnlyAnswer(typed("学生", ["がくせい"]), "がくせい", "ja-xc")).toBe(false);
  });
  test("zh: pinyin with tones, tone numbers or none is reading input; hanzi (simplified or traditional) is production", () => {
    expect(checkAnswer(typed("汉语"), "hàn yǔ", "zh-xc")).toBe(true);
    expect(readingOnlyAnswer(typed("汉语"), "hàn yǔ", "zh-xc")).toBe(true);
    expect(readingOnlyAnswer(typed("汉语"), "han4 yu3", "zh-xc")).toBe(true);
    expect(readingOnlyAnswer(typed("汉语"), "hanyu", "zh-xc")).toBe(true);
    expect(readingOnlyAnswer(typed("汉语"), "汉语", "zh-xc")).toBe(false);
    expect(readingOnlyAnswer(typed("汉语"), "漢語", "zh-xc")).toBe(false);
    expect(readingOnlyAnswer(typed("汉语"), "hán yǔ", "zh-xc")).toBe(false); // wrong tone: not accepted at all
  });
  test("a course profile can declare reading input production evidence", () => {
    expect(checkAnswer(typed("学生"), "がくせい", "ja-xcprod")).toBe(true);
    expect(readingOnlyAnswer(typed("学生"), "がくせい", "ja-xcprod")).toBe(false);
  });
  test("word-bank tiles in kana for a kanji sentence are reading input", () => {
    const bank: WordBankExercise = { type: "wordBank", id: "b:1", direction: "nativeToTarget", prompt: "I am a student.", tokens: ["がくせい", "です", "学生"], answer: ["学生", "です"] };
    expect(readingOnlyAnswer(bank, [0, 1], "ja-xc")).toBe(true);
    expect(readingOnlyAnswer(bank, [2, 1], "ja-xc")).toBe(false);
  });
  test("Latin courses, bare tests and non-typed exercises never are", () => {
    expect(readingOnlyAnswer(typed("le chat"), "le chat", "fr-en")).toBe(false);
    expect(readingOnlyAnswer(typed("学生"), "がくせい", "")).toBe(false);
    expect(readingOnlyAnswer({ type: "select", id: "s", mode: "targetToNative", prompt: "学生", options: [{ text: "x" }], correct: 0 }, 0, "ja-xc")).toBe(false);
  });
});

const step: ExerciseStep = { type: "exercise", stepId: "t:1", exercise: typed("学生") };

function checked(answer: string, courseId = "ja-xc"): SessionMachineState {
  const started = sessionReducer(emptySessionState(), { type: "start", sessionId: "s", steps: [step], courseId, retryPolicy: "none" });
  return [{ type: "answer" as const, value: answer }, { type: "check" as const }].reduce(sessionReducer, started);
}

describe("session machine", () => {
  test("a kana answer is shown correct but leaves no first-attempt evidence", () => {
    const s = checked("がくせい");
    expect(s.status).toBe("correct");
    expect(s.firstResults).toEqual({});
    expect(s.readingOnly).toEqual({ "t:1": true });
    expect(s.wrongCounts).toEqual({});
  });
  test("the target script records the first attempt as before; no readingOnly key appears", () => {
    const s = checked("学生");
    expect(s.firstResults).toEqual({ "t:1": true });
    expect("readingOnly" in s).toBe(false);
  });
  test("a wrong answer is still a wrong first attempt", () => {
    expect(checked("がくしょう").firstResults).toEqual({ "t:1": false });
  });
  test("with the profile opt-in, kana is a first-attempt result", () => {
    expect(checked("がくせい", "ja-xcprod").firstResults).toEqual({ "t:1": true });
  });
  test("a checkpoint scored over the withheld item finds insufficient evidence, never a pass", () => {
    const s = checked("がくせい");
    const plan = {
      checkpointId: "c",
      checkpointVersion: 1,
      formId: "full",
      formVersion: 1,
      criteria: { minItemsPerObjective: 1, demonstratedShare: 0.5 },
      itemObjectives: { "t:1": ["ja.obj.write.word"] },
    };
    expect(scoreObjectives(plan, s.firstResults)).toEqual([]);
    expect(scoreObjectives(plan, checked("学生").firstResults)[0]?.result).toBe("demonstrated");
  });
});

describe("evidence plan", () => {
  const definition: SessionDefinition = {
    kind: "review",
    courseId: "ja-xc",
    lessonId: "srs",
    steps: [],
    completion: "practice",
    evidenceSource: "review",
    trackMistakes: false,
    allowUndo: false,
  };
  const planned: ExerciseStep = { ...step, evidence: { itemId: "xc:w:gakusei", srsRole: "assessment" } };
  const build = (readingOnly: boolean) =>
    buildCheckEvidence({ definition, step: planned, sessionId: "s", correct: true, attemptIndex: 0, latencyMs: 900, readingOnly })!;

  test("a reading-only answer is logged as practice and never mutates the scheduler", () => {
    const ev = build(true);
    expect(ev.srsRole).toBe("practice");
    expect(gateEvidence(ev, false)).toEqual({ mutate: false, reason: "role-practice" });
  });
  test("a target-script answer keeps its planned assessment", () => {
    const ev = build(false);
    expect(ev.srsRole).toBe("assessment");
    expect(gateEvidence(ev, false)).toEqual({ mutate: true, grade: "good" });
  });
});

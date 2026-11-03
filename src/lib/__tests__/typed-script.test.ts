/**
 * D-10 owner decision (2026-11-03): an item that asks for katakana ("Gõ bằng katakana: bánh mì") must reject the same
 * word typed in hiragana. typeAnswer.script = "katakana" makes the grader compare that item without the katakana →
 * hiragana fold; every other item, and every other language, grades as before.
 */
import { describe, expect, test } from "bun:test";

import { checkAnswer } from "../grading";
import { languageRules } from "../languages";
import type { TypeAnswerExercise } from "../types";

const typed = (answer: string, script?: "katakana"): TypeAnswerExercise => ({
  type: "typeAnswer",
  id: "t:1",
  mode: "produceTarget",
  prompt: "Gõ bằng katakana: \"bánh mì\".",
  answer,
  alternatives: [],
  ...(script ? { script } : {}),
});

describe("typeAnswer.script katakana", () => {
  test("the katakana answer is accepted, in full or half width, with a hyphen typed for ー", () => {
    expect(checkAnswer(typed("パン", "katakana"), "パン", "ja-en")).toBe(true);
    expect(checkAnswer(typed("パン", "katakana"), "ﾊﾟﾝ", "ja-en")).toBe(true);
    expect(checkAnswer(typed("コーヒー", "katakana"), "コーヒ-", "ja-en")).toBe(true);
    expect(checkAnswer(typed("コーヒー", "katakana"), "コーヒー。", "ja-en")).toBe(true);
  });

  test("the same word in hiragana, or ー spelt as a vowel, is rejected", () => {
    expect(checkAnswer(typed("パン", "katakana"), "ぱん", "ja-en")).toBe(false);
    expect(checkAnswer(typed("コーヒー", "katakana"), "こーひー", "ja-en")).toBe(false);
    expect(checkAnswer(typed("コーヒー", "katakana"), "コオヒイ", "ja-en")).toBe(false);
    expect(checkAnswer(typed("ベトナム", "katakana"), "ベとナム", "ja-en")).toBe(false);
  });

  test("without the flag the item folds kana as before", () => {
    expect(checkAnswer(typed("パン"), "ぱん", "ja-en")).toBe(true);
    expect(checkAnswer(typed("コーヒー"), "こおひい", "ja-en")).toBe(true);
  });

  test("only the ja plugin has the in-script form; the Latin plugins are unchanged", () => {
    expect(languageRules("ja").normalizeLenientInScript?.("コーヒ-", "katakana")).toBe("コーヒー");
    expect(languageRules("ja").normalizeLenientInScript?.("ぱん", "katakana")).toBe("ぱん");
    for (const code of ["fr", "en", "es", "de", "it", "pt", "vi", "zh", "ko"]) expect(languageRules(code).normalizeLenientInScript).toBeUndefined();
  });
});

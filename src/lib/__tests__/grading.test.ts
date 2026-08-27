import { describe, expect, test } from "bun:test";

import { answerIsReady, checkAnswer, correctAnswerText, normalize } from "../grading";
import type { Exercise } from "../types";

describe("normalize — French input tolerance", () => {
  test("smart apostrophe ≡ ASCII apostrophe (iOS smart punctuation)", () => {
    expect(normalize("j’ai")).toBe(normalize("j'ai"));
    expect(normalize("l’homme")).toBe(normalize("l'homme"));
  });

  test("no-break and narrow spaces ≡ plain space", () => {
    expect(normalize("bonjour\u00A0!")).toBe(normalize("bonjour !"));
    expect(normalize("Ça va\u202F?")).toBe(normalize("Ça va ?"));
    expect(normalize("mille\u2009francs")).toBe(normalize("mille francs"));
  });

  test("œ ligature ≡ oe", () => {
    expect(normalize("œufs")).toBe(normalize("oeufs"));
    expect(normalize("sœur")).toBe(normalize("soeur"));
  });

  test("previously accepted forms stay accepted (accent/case/punct-blind)", () => {
    expect(normalize("café")).toBe("cafe");
    expect(normalize("Garçon!")).toBe("garcon");
    expect(normalize("  Je   suis  ")).toBe("je suis");
    expect(normalize("これは、テスト。")).toBe("これはテスト");
  });

  test("guillemets and curly quotes are stripped", () => {
    expect(normalize("«bonjour»")).toBe("bonjour");
    expect(normalize("“hello”")).toBe("hello");
  });
});

const select: Exercise = {
  type: "select",
  id: "e1",
  mode: "targetToNative",
  prompt: "l'homme",
  options: [{ text: "the man" }, { text: "the woman" }],
  correct: 0,
};

const typeAnswer: Exercise = {
  type: "typeAnswer",
  id: "e2",
  mode: "translate",
  prompt: "Je suis une femme.",
  answer: "I am a woman.",
  alternatives: ["I'm a woman"],
};

const wordBank: Exercise = {
  type: "wordBank",
  id: "e3",
  direction: "targetToNative",
  prompt: "Je suis un homme.",
  tokens: ["man", "I", "am", "a"],
  answer: ["I", "am", "a", "man"],
};

const fillBlank: Exercise = {
  type: "fillBlank",
  id: "e4",
  sentence: "Je suis un ___.",
  translation: "I am a man.",
  options: ["l'eau", "homme"],
  correct: 1,
};

describe("checkAnswer", () => {
  test("select/fillBlank compare the option index", () => {
    expect(checkAnswer(select, 0)).toBe(true);
    expect(checkAnswer(select, 1)).toBe(false);
    expect(checkAnswer(fillBlank, 1)).toBe(true);
  });

  test("typeAnswer accepts the answer and alternatives, normalized", () => {
    expect(checkAnswer(typeAnswer, "i am a woman")).toBe(true);
    expect(checkAnswer(typeAnswer, "I’m a woman")).toBe(true);
    expect(checkAnswer(typeAnswer, "I am a man")).toBe(false);
  });

  test("wordBank compares the assembled token sequence", () => {
    expect(checkAnswer(wordBank, [1, 2, 3, 0])).toBe(true);
    expect(checkAnswer(wordBank, [0, 1, 2, 3])).toBe(false);
    expect(checkAnswer(wordBank, "nope")).toBe(false);
  });
});

describe("answerIsReady / correctAnswerText", () => {
  test("readiness per type", () => {
    expect(answerIsReady(select, null)).toBe(false);
    expect(answerIsReady(select, 1)).toBe(true);
    expect(answerIsReady(wordBank, [])).toBe(false);
    expect(answerIsReady(wordBank, [0])).toBe(true);
    expect(answerIsReady(typeAnswer, "  ")).toBe(false);
    expect(answerIsReady(typeAnswer, "hi")).toBe(true);
  });

  test("correct answer display strings", () => {
    expect(correctAnswerText(select)).toBe("the man");
    expect(correctAnswerText(fillBlank)).toBe("Je suis un homme.");
    expect(correctAnswerText(wordBank)).toBe("I am a man");
    expect(correctAnswerText(typeAnswer)).toBe("I am a woman.");
  });
});

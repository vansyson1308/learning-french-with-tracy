/**
 * Korean plugin (P4b stage 3): jamo composition (conjoining and typed
 * compatibility jamo), spacing-insensitive lenient matching and
 * tokenization, sino vs native numbers before counters, keystroke-jamo
 * search fold.
 */
import { describe, expect, test } from "bun:test";

import type { CourseLexicon } from "../languages";
import { composeJamo, createKoreanRules, ko, koreanKeystrokes, koreanNativeCounters, koreanNativeNumber, koreanSinoNumber } from "../languages/ko";
import { gradeSpokenAttempt, normalizeSpoken } from "../speech/grader";

const LEX: CourseLexicon = {
  entries: ["학생", "입니다", "저", "는", "사과", "한", "개", "주세요", "한국어", "공부", "해요", "감사합니다"].map((surface) => ({ surface })),
};
const koL = ko.withLexicon!(LEX);

const lenient = (s: string) => ko.normalizeLenient(s);
const alternate = (s: string) => ko.normalizeLenientAlternate!(s);
const strict = (s: string) => ko.normalizeStrict(s);
const spoken = (s: string, rules = koL) => normalizeSpoken(s, rules);
const grade = (heard: string, variants: string[], concepts?: string[][], rules = koL) =>
  gradeSpokenAttempt({ finalTranscript: heard, alternatives: [] }, { acceptedVariants: variants, requiredConcepts: concepts }, rules).correct;

function withoutSegmenter<T>(build: () => T): T {
  const intl = Intl as unknown as { Segmenter?: unknown };
  const saved = intl.Segmenter;
  intl.Segmenter = undefined;
  try {
    return build();
  } finally {
    intl.Segmenter = saved;
  }
}

describe("ko numbers", () => {
  test.each([
    [0, "영"],
    [1, "일"],
    [10, "십"],
    [11, "십일"],
    [20, "이십"],
    [99, "구십구"],
    [100, "백"],
  ])("sino %d → %s", (n, word) => expect(koreanSinoNumber(n)).toBe(word));

  test.each([
    [1, "하나"],
    [2, "둘"],
    [10, "열"],
    [20, "스물"],
    [21, "스물하나"],
    [99, "아흔아홉"],
  ])("native %d → %s", (n, word) => expect(koreanNativeNumber(n)).toBe(word));

  test.each([
    [1, "한"],
    [2, "두"],
    [3, "세"],
    [4, "네"],
    [20, "스무"],
    [21, "스물한"],
  ])("native attributive %d → %s", (n, word) => expect(koreanNativeNumber(n, true)).toBe(word));

  test("digits before native counters: 1개 → 한 개, 3시 → 세 시, 2시간 → 두 시간, 20살 → 스무 살", () => {
    expect(koreanNativeCounters("사과 1개")).toBe("사과 한 개");
    expect(koreanNativeCounters("3시")).toBe("세 시");
    expect(koreanNativeCounters("2시간")).toBe("두 시간");
    expect(koreanNativeCounters("20살")).toBe("스무 살");
  });
  test("sino counters are left to the digit speller (1개월, 30분, 1번)", () => {
    expect(koreanNativeCounters("1개월")).toBe("1개월");
    expect(koreanNativeCounters("30분")).toBe("30분");
    expect(koreanNativeCounters("1번")).toBe("1번");
  });
  test("sino numbers segment like authored ones (11월 = 십일월, 3층 = 삼층)", () => {
    expect(spoken("11월")).toBe(spoken("십일월"));
    expect(spoken("3층")).toBe(spoken("삼층"));
  });
  test("하나 vs 일: a standalone 1 is sino 일, never 하나", () => {
    expect(spoken("1")).toBe("일");
    expect(spoken("1")).not.toBe(spoken("하나"));
  });
});

describe("ko jamo composition", () => {
  test("받침 from typed compatibility jamo (ㅂㅏㄷ → 받)", () => expect(composeJamo("ㅂㅏㄷ")).toBe("받"));
  test("a block takes a following final (바ㄷ → 받)", () => expect(composeJamo("바ㄷ")).toBe("받"));
  test("a final moves on before a vowel (ㄷㅏㄹㄱㅇㅣ → 닭이)", () => expect(composeJamo("ㄷㅏㄹㄱㅇㅣ")).toBe("닭이"));
  test("compound vowels (ㅎㅗㅏ → 화)", () => expect(composeJamo("ㅎㅗㅏ")).toBe("화"));
  test("cluster finals (ㅇㅓㅂㅅㄷㅏ → 없다)", () => expect(composeJamo("ㅇㅓㅂㅅㄷㅏ")).toBe("없다"));
  test("ㄸ cannot be a final (ㄱㅏㄸㅏ → 가따)", () => expect(composeJamo("ㄱㅏㄸㅏ")).toBe("가따"));
  test("lone jamo stay (ㅋㅋ)", () => expect(composeJamo("ㅋㅋ")).toBe("ㅋㅋ"));
  test("well-formed text is unchanged", () => expect(composeJamo("저는 학생입니다.")).toBe("저는 학생입니다."));
  test("conjoining jamo compose by NFC in the lenient form (ᄇ+ᅡ+ᆮ = 받)", () => expect(lenient("받")).toBe("받"));
  test("lenient: typed jamo = the composed word; strict: not", () => {
    expect(lenient("ㅂㅏㄷㅇㅏㅇㅛ")).toBe(lenient("받아요"));
    expect(strict("ㅂㅏㄷㅇㅏㅇㅛ")).not.toBe(strict("받아요"));
  });
});

describe("ko spacing and other folds", () => {
  test("the alternate lenient form ignores spacing (학생 입니다 = 학생입니다)", () => expect(alternate("학생 입니다")).toBe(alternate("학생입니다")));
  test("…also across several words (감사 합니다 = 감사합니다)", () => expect(alternate("감사 합니다")).toBe(alternate("감사합니다")));
  test("the lenient form keeps one space between words", () => expect(lenient("저는   학생입니다")).toBe("저는 학생입니다"));
  test("strict keeps spacing (띄어쓰기 counts)", () => expect(strict("학생 입니다")).not.toBe(strict("학생입니다")));
  test("punctuation drops (안녕하세요! = 안녕하세요)", () => expect(lenient("안녕하세요!")).toBe("안녕하세요"));
  test("full-width Latin and digits fold (ＡＢＣ１ → abc1)", () => expect(lenient("ＡＢＣ１")).toBe("abc1"));
  test("romanization never matches hangul in strict", () => expect(strict("haksaeng")).not.toBe(strict("학생")));
});

describe("ko search fold: keystroke jamo, so a prefix of jamo matches", () => {
  test("학생 → ㅎㅏㄱㅅㅐㅇ", () => expect(ko.fold("학생")).toBe("ㅎㅏㄱㅅㅐㅇ"));
  test("prefixes mid-syllable match (하, 학ㅅ)", () => {
    expect(ko.fold("학생").startsWith(ko.fold("하"))).toBe(true);
    expect(ko.fold("학생").startsWith(ko.fold("학ㅅ"))).toBe(true);
  });
  test("a cluster final splits (달 is a prefix of 닭)", () => expect(ko.fold("닭").startsWith(ko.fold("달"))).toBe(true));
  test("a compound vowel splits (호 is a prefix of 화)", () => expect(ko.fold("화").startsWith(ko.fold("호"))).toBe(true));
  test("keystrokes of typed compatibility clusters split too (ㄳ → ㄱㅅ)", () => expect(koreanKeystrokes("ㄳ")).toBe("ㄱㅅ"));
});

describe("ko tokenize", () => {
  test("no course data, no segmenter: eojeol (whitespace)", () => {
    const bare = withoutSegmenter(() => createKoreanRules());
    expect(bare.tokenize("저는 학생입니다")).toEqual(["저는", "학생입니다"]);
  });
  test("with course words: spacing-insensitive maximal match", () => {
    expect(koL.tokenize("저는 학생입니다")).toEqual(["저", "는", "학생", "입니다"]);
    expect(koL.tokenize("저는학생 입니다")).toEqual(koL.tokenize("저는 학생입니다"));
  });
  test("the dictionary path does not depend on Intl.Segmenter", () => {
    const noSeg = withoutSegmenter(() => createKoreanRules(LEX));
    expect(noSeg.tokenize("한국어공부해요")).toEqual(koL.tokenize("한국어공부해요"));
  });
});

describe("ko speech grader", () => {
  test("spacing variants of the recognizer pass (학생 입니다 for 학생입니다)", () => expect(grade("학생 입니다", ["학생입니다"])).toBe(true));
  test("사과 1개 주세요 = 사과 한 개 주세요", () => expect(grade("사과 1개 주세요", ["사과 한 개 주세요"])).toBe(true));
  test("사과 일 개 (sino before 개) fails", () => expect(grade("사과 일 개 주세요", ["사과 한 개 주세요"])).toBe(false));
  test("하나 heard for 일 fails", () => expect(grade("하나", ["일"])).toBe(false));
  test("a concept slot across spacing", () => expect(grade("저는 한국어 공부 해요", [], [["한국어공부"]])).toBe(true));
  test("locales are ko-KR; the reading-speed band is an estimate in syllables", () => {
    expect(ko.recognitionLocale).toBe("ko-KR");
    expect(ko.ttsLocale).toBe("ko-KR");
    expect(ko.charsPerSecBand?.unit).toBe("syllable");
    expect(ko.charsPerSecBand?.estimate).toBe(true);
  });
});

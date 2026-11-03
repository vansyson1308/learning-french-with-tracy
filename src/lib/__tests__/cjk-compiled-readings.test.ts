/**
 * P4b stage 4: the readings precomputed at build time reach stage 3's
 * `withLexicon` hook through the COMPILED lexicon index. The synthetic CJK
 * test course xc-en (content/xc) compiles to
 * src/content/test-only/lexicon/xc-index.json; registered under ja/zh
 * course profiles here, its kana / pinyin / traditional fields bind the
 * plugins exactly as a real ja/zh course's index will.
 */
import { afterEach, describe, expect, test } from "bun:test";

import xcIndex from "../../content/test-only/lexicon/xc-index.json";
import { __registerCourseArtifactsForTests } from "../content-registry";
import { __registerCourseProfileForTests, courseProfile } from "../course-profile";
import { courseLexiconFor, languageRulesForCourse } from "../languages";

const COURSES = ["ja-xc", "zh-xc"] as const;

function register(courseId: (typeof COURSES)[number], base: string) {
  __registerCourseProfileForTests({ ...courseProfile(base), id: courseId });
  __registerCourseArtifactsForTests(courseId, { lexiconIndex: xcIndex });
}

afterEach(() => {
  for (const id of COURSES) {
    __registerCourseArtifactsForTests(id, null);
    __registerCourseProfileForTests(null, id);
  }
});

describe("compiled readings → CourseLexicon", () => {
  test("every compiled entry carries its reading under its notation; zh carries its traditional spelling", () => {
    register("ja-xc", "ja-en");
    const lexicon = courseLexiconFor("ja-xc")!;
    const by = new Map(lexicon.entries.map((e) => [e.surface, e]));
    expect(by.get("学生")?.reading).toEqual({ value: "がくせい", notation: "kana" });
    expect(by.get("食べる")?.reading).toEqual({ value: "たべる", notation: "kana" });
    expect(by.get("汉语")?.reading).toEqual({ value: "hàn yǔ", notation: "pinyin" });
    expect(by.get("汉语")?.variants).toEqual(["漢語"]);
    expect(by.get("신라")?.reading).toEqual({ value: "silla", notation: "rr" });
  });
  test("the compiled index also carries the display reading (furigana segments) for the renderers", () => {
    const entry = xcIndex.entries.find((e) => e.surface === "食べる") as { reading?: { furigana?: unknown } };
    expect(entry.reading?.furigana).toEqual([{ base: "食", ruby: "た" }, { base: "べる" }]);
  });
});

describe("plugins bound to compiled readings", () => {
  test("ja: kana typed for a kanji key counts as practice; the reading layer reads the compiled kana", () => {
    register("ja-xc", "ja-en");
    const rules = languageRulesForCourse("ja-xc");
    const answer = rules.normalizeLenient("がくせい");
    const key = rules.normalizeLenient("学生");
    expect(rules.alignAnswerToKey!(answer, key)).toBe(key);
    expect(rules.spokenReading!(rules.foldSpoken("学生"))).toBe("がくせい");
    expect(rules.tokenize(rules.foldSpoken("学生です"))[0]).toBe("学生");
  });
  test("zh: the traditional spelling folds to the simplified surface; pinyin with tones matches the stored syllables", () => {
    register("zh-xc", "zh-en");
    const rules = languageRulesForCourse("zh-xc");
    expect(rules.normalizeLenient("漢語")).toBe(rules.normalizeLenient("汉语"));
    const key = rules.normalizeLenient("汉语");
    expect(rules.alignAnswerToKey!(rules.normalizeLenient("hàn yǔ"), key)).toBe(key);
    expect(rules.alignAnswerToKey!(rules.normalizeLenient("hán yǔ"), key)).not.toBe(key);
  });
});

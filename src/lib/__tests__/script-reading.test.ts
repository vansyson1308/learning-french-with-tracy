/**
 * P4b stage 5 (task 4): the pure reading layout behind the ruby renderer.
 */
import { describe, expect, test } from "bun:test";

import {
  annotateText,
  buildScriptReadingIndex,
  EMPTY_SCRIPT_INDEX,
  hanVietOfWord,
  readingLine,
  scriptReadingFor,
  wordSegments,
} from "../learning/script-reading";

const INDEX = buildScriptReadingIndex([
  { surface: "学生", reading: { kana: "がくせい", furigana: [{ base: "学", ruby: "がく" }, { base: "生", ruby: "せい" }] } },
  { surface: "食べる", reading: { kana: "たべる", furigana: [{ base: "食", ruby: "た" }, { base: "べる" }] } },
  { surface: "です", reading: { kana: "です", furigana: [{ base: "です" }] } },
  { surface: "汉语", reading: { pinyin: "hàn yǔ" } },
  { surface: "学习", reading: { pinyin: "xué xí" } },
  { surface: "학생", reading: { rr: "haksaeng" } },
  { surface: "신라", reading: { rr: "silla" } },
  // A later duplicate never overrides the first source (pack words before the lexicon).
  { surface: "学生", reading: { pinyin: "xué shēng" } },
]);

const opts = (targetCode: string, showHanViet = false) => ({ targetCode, showHanViet });

describe("index", () => {
  test("first source of a surface wins; entries without any reading are skipped", () => {
    expect(INDEX.bySurface.get("学生")?.kana).toBe("がくせい");
    const index = buildScriptReadingIndex([{ surface: "x", reading: {} }, { surface: "  ", reading: { rr: "a" } }]);
    expect(index.bySurface.size).toBe(0);
    expect(INDEX.maxLength).toBe(3);
  });
});

describe("wordSegments", () => {
  test("ja: stored furigana segments; okurigana runs carry no reading", () => {
    expect(wordSegments("食べる", INDEX.bySurface.get("食べる")!)).toEqual({
      segments: [{ base: "食", ruby: "た" }, { base: "べる" }],
      kind: "kana",
    });
  });
  test("ja: furigana that do not spell the surface fall back to the whole word's kana", () => {
    expect(wordSegments("学生", { kana: "がくせい", furigana: [{ base: "学", ruby: "がく" }] })?.segments).toEqual([{ base: "学生", ruby: "がくせい" }]);
  });
  test("ja: a kana-only word gets no reading over it", () => {
    expect(wordSegments("です", { kana: "です" })?.segments).toEqual([{ base: "です" }]);
  });
  test("zh: one syllable under each hanzi; non-hanzi characters stay plain", () => {
    expect(wordSegments("汉语", { pinyin: "hàn yǔ" })?.segments).toEqual([{ base: "汉", ruby: "hàn" }, { base: "语", ruby: "yǔ" }]);
    expect(wordSegments("卡拉OK", { pinyin: "kǎ lā" })?.segments).toEqual([{ base: "卡", ruby: "kǎ" }, { base: "拉", ruby: "lā" }, { base: "O" }, { base: "K" }]);
  });
  test("zh: a syllable count that does not match the hanzi puts the whole reading under the word", () => {
    expect(wordSegments("汉语", { pinyin: "hànyǔ" })?.segments).toEqual([{ base: "汉语", ruby: "hànyǔ" }]);
  });
  test("ko: the word's RR under the whole word", () => {
    expect(wordSegments("신라", { rr: "silla" })).toEqual({ segments: [{ base: "신라", ruby: "silla" }], kind: "rr" });
  });
  test("no reading → null", () => {
    expect(wordSegments("x", {})).toBeNull();
  });
});

describe("annotateText", () => {
  test("ja sentence: known words read, unknown runs and punctuation plain (merged)", () => {
    expect(annotateText("パンを食べる。", INDEX)?.segments).toEqual([{ base: "パンを" }, { base: "食", ruby: "た" }, { base: "べる。" }]);
    expect(annotateText("学生です。", INDEX)?.segments).toEqual([{ base: "学", ruby: "がく" }, { base: "生", ruby: "せい" }, { base: "です。" }]);
  });
  test("longest stored word first", () => {
    const index = buildScriptReadingIndex([
      { surface: "学", reading: { pinyin: "xué" } },
      { surface: "学习", reading: { pinyin: "xué xí" } },
    ]);
    expect(annotateText("学习", index)?.segments).toEqual([{ base: "学", ruby: "xué" }, { base: "习", ruby: "xí" }]);
  });
  test("ko sentence: words read, particles and spaces plain", () => {
    expect(annotateText("신라는 학생", INDEX)?.segments).toEqual([{ base: "신라", ruby: "silla" }, { base: "는 " }, { base: "학생", ruby: "haksaeng" }]);
  });
  test("text with nothing to read, an empty index or empty text → null", () => {
    expect(annotateText("パン", INDEX)).toBeNull();
    expect(annotateText("です", INDEX)).toBeNull();
    expect(annotateText("学生", EMPTY_SCRIPT_INDEX)).toBeNull();
    expect(annotateText("", INDEX)).toBeNull();
    expect(annotateText("le chat", INDEX)).toBeNull();
  });
});

describe("scriptReadingFor", () => {
  test("furigana above; pinyin and RR below", () => {
    expect(scriptReadingFor("学生", INDEX, opts("ja"))?.position).toBe("above");
    expect(scriptReadingFor("汉语", INDEX, opts("zh"))?.position).toBe("below");
    expect(scriptReadingFor("신라", INDEX, opts("ko"))?.position).toBe("below");
    expect(scriptReadingFor("chat", INDEX, opts("fr"))).toBeUndefined();
  });
  test("Hán-Việt only when asked (vi-native) and only for one listed Sino-Vietnamese word", () => {
    expect(scriptReadingFor("学生", INDEX, opts("ja"))?.hanViet).toBeUndefined();
    expect(scriptReadingFor("学生", INDEX, opts("ja", true))?.hanViet).toBe("học sinh");
    expect(scriptReadingFor("学生です。", INDEX, opts("ja", true))?.hanViet).toBeUndefined();
    expect(scriptReadingFor("食べる", INDEX, opts("ja", true))?.hanViet).toBeUndefined();
    expect(scriptReadingFor("汉语", INDEX, opts("zh", true))?.hanViet).toBe("Hán ngữ");
    expect(scriptReadingFor("학생", INDEX, opts("ko", true))?.hanViet).toBe("học sinh");
    expect(scriptReadingFor("신라", INDEX, opts("ko", true))?.hanViet).toBeUndefined();
  });
});

describe("hanVietOfWord", () => {
  test("ja needs the stored kana: a different reading of the spelling gets none", () => {
    const kun = buildScriptReadingIndex([{ surface: "学生", reading: { kana: "がくしょう" } }]);
    expect(hanVietOfWord("学生", kun, "ja")).toBeNull();
    expect(hanVietOfWord("学生", INDEX, "ja")).toBe("học sinh");
  });
  test("a non-CJK target infers the table from the reading's notation (synthetic xc course)", () => {
    expect(hanVietOfWord("学生", INDEX, "xc")).toBe("học sinh");
    expect(hanVietOfWord("汉语", INDEX, "xc")).toBe("Hán ngữ");
    expect(hanVietOfWord("학생", INDEX, "xc")).toBe("học sinh");
    expect(hanVietOfWord("unknown", INDEX, "xc")).toBeNull();
  });
});

describe("readingLine", () => {
  test("kana spelt through; pinyin / RR syllables spaced", () => {
    expect(readingLine(scriptReadingFor("食べる", INDEX, opts("ja"))!)).toBe("たべる");
    expect(readingLine(scriptReadingFor("汉语", INDEX, opts("zh"))!)).toBe("hàn yǔ");
    expect(readingLine(scriptReadingFor("신라는 학생", INDEX, opts("ko"))!)).toBe("silla haksaeng");
  });
});

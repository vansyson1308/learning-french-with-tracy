/**
 * P4e session 1: Korean set phrases are written with spaces (띄어쓰기) —
 * 안녕히 가세요, 처음 뵙겠습니다, 잘 먹겠습니다. A lexeme surface may hold
 * hangul words separated by single spaces; its RR is the rule output word by
 * word (romanizeKorean ends a word at a non-hangul character), so the reading
 * contract is unchanged for one-word surfaces.
 */
import { describe, expect, test } from "bun:test";

import { readingErrors } from "../lib/cjk-readings/validate";
import { romanizeKorean } from "../lib/cjk-readings/korean-rr";

describe("rr readings of spaced surfaces", () => {
  test("a spaced set phrase validates against the word-by-word rule output", () => {
    for (const s of ["안녕히 가세요", "처음 뵙겠습니다", "잘 먹겠습니다", "만나서 반갑습니다"]) {
      expect(readingErrors("rr", s, "expression", { rr: romanizeKorean(s) })).toEqual([]);
    }
    expect(romanizeKorean("안녕히 가세요")).toBe("annyeonghi gaseyo");
  });

  test("double spaces, edge spaces and non-hangul words are still refused", () => {
    for (const s of ["안녕히  가세요", " 안녕히 가세요", "안녕히 가세요 ", "안녕 ok"]) {
      expect(readingErrors("rr", s, "expression", { rr: romanizeKorean(s) }).join()).toContain("is not hangul syllables only");
    }
  });

  test("one-word surfaces behave as before", () => {
    expect(readingErrors("rr", "사과", "noun", { rr: "sagwa" })).toEqual([]);
    expect(readingErrors("rr", "사과", "noun", { rr: "sakwa" }).join()).toContain("rule output");
  });
});

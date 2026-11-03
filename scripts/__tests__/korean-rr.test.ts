/**
 * P4b stage 4: Revised Romanization rule tests. Every example word below is
 * quoted from the official rule text — National Institute of Korean
 * Language, "Romanization of Korean" (https://www.korean.go.kr/front_eng/roman/roman_01.do,
 * read 2026-11-03) — with the page's romanization; capitals on the page mark
 * proper nouns (the rules return lower case, capitalizeRr restores them).
 * The vowel and consonant cases are the page's Chapter 2 tables.
 */
import { describe, expect, test } from "bun:test";

import { capitalizeRr, romanizeKorean, stripRrBoundaries } from "../lib/cjk-readings/korean-rr";

const rr = (spelling: string, noun = false) => romanizeKorean(spelling, { noun });

describe("Chapter 2 — vowels (table 1: simple vowels, diphthongs; ㅢ is ui)", () => {
  const vowels: [string, string][] = [
    ["아", "a"], ["어", "eo"], ["오", "o"], ["우", "u"], ["으", "eu"], ["이", "i"], ["애", "ae"], ["에", "e"], ["외", "oe"], ["위", "wi"],
    ["야", "ya"], ["여", "yeo"], ["요", "yo"], ["유", "yu"], ["얘", "yae"], ["예", "ye"], ["와", "wa"], ["왜", "wae"], ["워", "wo"], ["웨", "we"], ["의", "ui"],
  ];
  for (const [h, r] of vowels) test(`${h} → ${r}`, () => expect(rr(h)).toBe(r));
  test("ㅢ stays ui after a consonant (희 → hui)", () => expect(rr("희")).toBe("hui"));
});

describe("Chapter 2 — consonants (table 2)", () => {
  const initials: [string, string][] = [
    ["가", "ga"], ["까", "kka"], ["카", "ka"], ["다", "da"], ["따", "tta"], ["타", "ta"], ["바", "ba"], ["빠", "ppa"], ["파", "pa"],
    ["자", "ja"], ["짜", "jja"], ["차", "cha"], ["사", "sa"], ["싸", "ssa"], ["하", "ha"], ["나", "na"], ["마", "ma"], ["라", "ra"],
  ];
  for (const [h, r] of initials) test(`word-initial ${h} → ${r}`, () => expect(rr(h)).toBe(r));
});

describe("Chapter 2 notes — ㄱ ㄷ ㅂ: g d b before a vowel, k t p before a consonant or at the end", () => {
  const cases: [string, string][] = [
    ["구미", "Gumi"], ["영동", "Yeongdong"], ["백암", "Baegam"], ["옥천", "Okcheon"], ["합덕", "Hapdeok"], ["호법", "Hobeop"],
    ["월곶", "Wolgot"], ["벚꽃", "beotkkot"], ["한밭", "Hanbat"],
  ];
  for (const [h, r] of cases) test(`${h} → ${r}`, () => expect(rr(h)).toBe(r.toLowerCase()));
});

describe("Chapter 2 notes — ㄹ: r before a vowel, l before a consonant or at the end, ㄹㄹ = ll", () => {
  const cases: [string, string][] = [["구리", "Guri"], ["설악", "Seorak"], ["칠곡", "Chilgok"], ["임실", "Imsil"], ["울릉", "Ulleung"], ["대관령", "Daegwallyeong"]];
  for (const [h, r] of cases) test(`${h} → ${r}`, () => expect(rr(h)).toBe(r.toLowerCase()));
});

describe("Chapter 3 Article 1.1 — assimilation of adjacent consonants (nasalisation, ㄹ rules)", () => {
  const cases: [string, string][] = [["백마", "Baengma"], ["종로", "Jongno"], ["왕십리", "Wangsimni"], ["별내", "Byeollae"], ["신라", "Silla"]];
  for (const [h, r] of cases) test(`${h} → ${r}`, () => expect(rr(h)).toBe(r.toLowerCase()));
  test("신문로 → Sinmunno (ㄴ+ㄹ = [ㄴㄴ] at the compound boundary 신문+로)", () => {
    expect(rr("신문+로")).toBe("sinmunno");
    expect(rr("신문로")).toBe("sinmullo"); // without the boundary the general ㄴ+ㄹ → [ㄹㄹ] rule applies
  });
});

describe("Chapter 3 Article 1.2 — epenthetic ㄴ and ㄹ (compound boundary marked with +)", () => {
  test("학여울 → Hangnyeoul", () => expect(rr("학+여울")).toBe("hangnyeoul"));
  test("알약 → allyak", () => expect(rr("알+약")).toBe("allyak"));
  test("without a boundary there is plain liaison (학여울 → hagyeoul)", () => expect(rr("학여울")).toBe("hagyeoul"));
});

describe("Chapter 3 Article 1.3 — palatalization", () => {
  const cases: [string, string][] = [["해돋이", "haedoji"], ["같이", "gachi"], ["굳히다", "guchida"]];
  for (const [h, r] of cases) test(`${h} → ${r}`, () => expect(rr(h)).toBe(r));
});

describe("Chapter 3 Article 1.4 — ㄱ ㄷ ㅂ ㅈ next to ㅎ (aspiration)", () => {
  const cases: [string, string][] = [["좋고", "joko"], ["놓다", "nota"], ["잡혀", "japyeo"], ["낳지", "nachi"]];
  for (const [h, r] of cases) test(`${h} → ${r}`, () => expect(rr(h)).toBe(r));
  test("nouns keep ㅎ after ㄱ ㄷ ㅂ: 묵호 → Mukho", () => expect(rr("묵호", true)).toBe("mukho"));
  test("nouns keep ㅎ after ㄱ ㄷ ㅂ: 집현전 → Jiphyeonjeon", () => expect(rr("집현전", true)).toBe("jiphyeonjeon"));
});

describe("Chapter 3 Article 1 note — tensification is not reflected", () => {
  const cases: [string, string][] = [
    ["압구정", "Apgujeong"], ["낙동강", "Nakdonggang"], ["죽변", "Jukbyeon"], ["낙성대", "Nakseongdae"],
    ["합정", "Hapjeong"], ["팔당", "Paldang"], ["샛별", "saetbyeol"], ["울산", "Ulsan"],
  ];
  for (const [h, r] of cases) test(`${h} → ${r}`, () => expect(rr(h)).toBe(r.toLowerCase()));
});

describe("Chapter 3 Article 2 — hyphen where pronunciation could be confused", () => {
  const cases: [string, string][] = [["중앙", "Jung-ang"], ["반구대", "Ban-gudae"], ["세운", "Se-un"], ["해운대", "Hae-undae"]];
  for (const [h, r] of cases) test(`${h} → ${r}`, () => expect(rr(h)).toBe(r.toLowerCase()));
  test("the hyphen can be switched off", () => expect(romanizeKorean("중앙", { hyphenate: false })).toBe("jungang"));
});

describe("helpers", () => {
  test("capitalizeRr restores the page's proper-noun capitals", () => {
    expect(capitalizeRr(rr("신라"))).toBe("Silla");
    expect(capitalizeRr(rr("종로"))).toBe("Jongno");
  });
  test("stripRrBoundaries gives back the spelling", () => expect(stripRrBoundaries("학+여울")).toBe("학여울"));
  test("non-hangul characters pass through and end a word (final neutralised before a space)", () => {
    expect(rr("부엌 문")).toBe("bueok mun");
  });
});

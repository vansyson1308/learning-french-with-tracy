/**
 * Hán-Việt readings at runtime (P4b stage 2, QC 2026-11-03 §2): ≥ 50
 * word → reading pairs across ja, zh and ko (every pair is in the authored
 * tables, which the build validator checks against Unihan kVietnamese), and
 * null for everything that is not a Sino-Vietnamese word: native Japanese
 * kun words, native Korean words, katakana / hangul loanwords, other
 * languages.
 */
import { describe, expect, test } from "bun:test";

import { hanVietFor, hasHanViet } from "../languages/hanviet";

const JA: [string, string][] = [
  ["学生", "học sinh"], ["図書館", "đồ thư quán"], ["大学", "đại học"], ["電話", "điện thoại"], ["学校", "học hiệu"],
  ["先生", "tiên sinh"], ["時間", "thời gian"], ["世界", "thế giới"], ["新聞", "tân văn"], ["銀行", "ngân hàng"],
  ["会社", "hội xã"], ["病院", "bệnh viện"], ["天気", "thiên khí"], ["家族", "gia tộc"], ["食堂", "thực đường"],
  ["旅行", "lữ hành"], ["写真", "tả chân"], ["音楽", "âm nhạc"], ["勉強", "miễn cưỡng"], ["経済", "kinh tế"],
  ["国家", "quốc gia"], ["文化", "văn hoá"], ["日本", "Nhật Bản"], ["問題", "vấn đề"], ["大丈夫", "đại trượng phu"],
  ["留学生", "lưu học sinh"], ["中国", "Trung Quốc"], ["練習", "luyện tập"], ["簡単", "giản đơn"], ["便利", "tiện lợi"],
];
const ZH: [string, string][] = [
  ["学生", "học sinh"], ["中国", "Trung Quốc"], ["越南", "Việt Nam"], ["经济", "kinh tế"], ["国家", "quốc gia"],
  ["大学", "đại học"], ["电话", "điện thoại"], ["老师", "lão sư"], ["朋友", "bằng hữu"], ["时间", "thời gian"],
  ["银行", "ngân hàng"], ["学习", "học tập"], ["问题", "vấn đề"], ["文化", "văn hoá"], ["汉语", "Hán ngữ"],
  ["图书馆", "đồ thư quán"], ["欢迎", "hoan nghênh"], ["公司", "công ty"], ["介绍", "giới thiệu"], ["发展", "phát triển"],
];
const KO: [string, string, string][] = [
  ["학생", "學生", "học sinh"], ["대학교", "大學校", "đại học hiệu"], ["문화", "文化", "văn hoá"], ["학교", "學校", "học hiệu"],
  ["시간", "時間", "thời gian"], ["도서관", "圖書館", "đồ thư quán"], ["한국", "韓國", "Hàn Quốc"], ["여행", "旅行", "lữ hành"],
  ["친구", "親舊", "thân cựu"], ["경제", "經濟", "kinh tế"], ["국가", "國家", "quốc gia"], ["지하철", "地下鐵", "địa hạ thiết"],
];

describe("hanVietFor — Sino-Vietnamese words", () => {
  test("at least 50 pairs across the three languages", () => {
    expect(JA.length + ZH.length + KO.length).toBeGreaterThanOrEqual(50);
  });
  test.each(JA)("ja %s → %s", (word, reading) => expect(hanVietFor("ja", word)).toBe(reading));
  test.each(ZH)("zh %s → %s", (word, reading) => expect(hanVietFor("zh", word)).toBe(reading));
  test.each(KO)("ko %s (%s) → %s", (word, hanja, reading) => {
    expect(hanVietFor("ko", word)).toBe(reading);
    expect(hanVietFor("ko", hanja)).toBe(reading);
  });
  test("a Japanese word with its on'yomi kana matches; another kana does not", () => {
    expect(hanVietFor("ja", "学生", { kana: "がくせい" })).toBe("học sinh");
    // A kana that is not the listed on'yomi reading (e.g. a kun reading) shows nothing.
    expect(hanVietFor("ja", "学生", { kana: "まなぶ" })).toBeNull();
  });
  test("input is NFC-normalised and trimmed", () => {
    expect(hanVietFor("zh", " 学生 ")).toBe("học sinh");
  });
});

describe("hanVietFor — no reading where it does not help", () => {
  test.each(["山", "水", "人", "手紙", "名前", "子供", "話す", "食べる", "たべる", "やま"])("ja native kun word %s → null", (w) => expect(hanVietFor("ja", w)).toBeNull());
  test.each(["コーヒー", "テレビ", "パン", "アルバイト"])("ja katakana loanword %s → null", (w) => expect(hanVietFor("ja", w)).toBeNull());
  test.each(["사랑", "하나", "바다", "먹다", "선생님"])("ko native or mixed word %s → null", (w) => expect(hanVietFor("ko", w)).toBeNull());
  test.each(["커피", "버스", "컴퓨터"])("ko loanword %s → null", (w) => expect(hanVietFor("ko", w)).toBeNull());
  test.each(["咖啡", "沙发", "的士"])("zh phonetic loan %s → null", (w) => expect(hanVietFor("zh", w)).toBeNull());
  test("the zh table is not consulted for Japanese (and vice versa)", () => {
    expect(hanVietFor("ja", "越南")).toBeNull();
    expect(hanVietFor("zh", "勉強")).toBeNull();
  });
  test("non-CJK targets have no Hán-Việt layer", () => {
    for (const lang of ["fr", "en", "de", "vi"]) {
      expect(hasHanViet(lang)).toBe(false);
      expect(hanVietFor(lang, "学生")).toBeNull();
    }
  });
});

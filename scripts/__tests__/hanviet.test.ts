/**
 * Hán-Việt validator and Unihan derivation (P4b stage 2, QC 2026-11-03 §2):
 * the committed tables pass; a reading syllable outside kVietnamese, a kun
 * word, a native Korean word, a katakana word, an unsorted or non-canonical
 * table each fail; a `note` naming the unconfirmed character is the only
 * way past Unihan; the derivation is pure and deterministic.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";

import { coverFitsScope } from "../lib/licence-scope";
import {
  checkEntry,
  compileHanVietArtifact,
  firstNonOnChar,
  foldViSyllable,
  HANVIET_LANGS,
  hanVietTableRel,
  initialSoundLaw,
  loadUnihanReadings,
  renderHanVietTable,
  tableSchema,
  validateHanViet,
  validateHanVietTable,
  type HanVietEntry,
  type HanVietTable,
} from "../lib/hanviet";
import {
  buildVariantGraph,
  deriveUnihanReadings,
  jinmeiyoLinks,
  parseUnihanText,
  renderUnihanReadings,
  UNIHAN_READINGS_REL,
  UnihanReadingsSchema,
  type UnihanManifest,
} from "../lib/hanviet-unihan";
import { loadRegistry, readJson, safeResolve } from "../lib/pipeline";

const unihan = loadUnihanReadings();
const sino = (e: Omit<HanVietEntry, "kind">): HanVietEntry => ({ ...e, kind: "sino" });
const tableText = (lang: (typeof HANVIET_LANGS)[number], entries: HanVietEntry[]) => renderHanVietTable({ language: lang, entries });

describe("committed Hán-Việt tables", () => {
  test("validate with no error", () => {
    expect(validateHanViet()).toEqual([]);
  });
  test("hold at least 50 pairs, every entry kind sino", () => {
    let n = 0;
    for (const lang of HANVIET_LANGS) {
      const table = tableSchema(lang).parse(readJson(hanVietTableRel(lang))) as HanVietTable;
      n += table.entries.length;
      expect(table.entries.length).toBeGreaterThanOrEqual(30);
      for (const e of table.entries) expect(e.kind).toBe("sino");
    }
    expect(n).toBeGreaterThanOrEqual(50);
  });
  test("are canonical JSON, sorted by word (deterministic)", () => {
    for (const lang of HANVIET_LANGS) {
      const raw = readFileSync(safeResolve(hanVietTableRel(lang)), "utf8").replace(/\r\n/g, "\n");
      const table = tableSchema(lang).parse(JSON.parse(raw)) as HanVietTable;
      expect(renderHanVietTable(table)).toBe(raw);
      const words = table.entries.map((e) => e.word);
      expect(words).toEqual([...words].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
    }
  });
  test("examples from the QC decision are confirmed by Unihan without a note", () => {
    const ja = checkEntry("ja", sino({ word: "学生", kana: "がくせい", reading: "học sinh" }), unihan);
    expect(ja).toEqual({ errors: [], unconfirmed: [] });
    const ko = checkEntry("ko", sino({ word: "대학교", hanja: "大學校", reading: "đại học hiệu" }), unihan);
    expect(ko).toEqual({ errors: [], unconfirmed: [] });
    expect(checkEntry("zh", sino({ word: "越南", reading: "Việt Nam" }), unihan).errors).toEqual([]);
  });
  test("the runtime artifact keeps word → reading only (no notes)", () => {
    const out = JSON.parse(compileHanVietArtifact({ language: "ja", entries: [sino({ word: "勉強", kana: "べんきょう", reading: "miễn cưỡng", note: "強: a note that stays build-side." })] }));
    expect(out.readings).toEqual({ 勉強: { reading: "miễn cưỡng", kana: "べんきょう" } });
  });
});

describe("validator rejects", () => {
  test("a reading syllable that is not among the character's kVietnamese readings", () => {
    const { errors } = checkEntry("zh", sino({ word: "学生", reading: "học sanh" }), unihan);
    expect(errors.join()).toContain("does not confirm 生");
  });
  test("the first-reading shortcut is not trusted: 行 in 旅行 needs a note (kVietnamese has only hàng)", () => {
    expect(checkEntry("zh", sino({ word: "旅行", reading: "lữ hành" }), unihan).unconfirmed).toEqual(["行"]);
  });
  test("a note naming the character lets an unconfirmed reading through; a vague note does not", () => {
    const named = sino({ word: "旅行", reading: "lữ hành", note: "行: kVietnamese lists only hàng; hành is the reading here." });
    expect(checkEntry("zh", named, unihan).errors).toEqual([]);
    const vague = sino({ word: "旅行", reading: "lữ hành", note: "this is a well-known reading" });
    expect(checkEntry("zh", vague, unihan).errors.length).toBe(1);
  });
  test("a Japanese kun compound (手紙 てがみ, 名前 なまえ) — its kana is not a chain of on'yomi", () => {
    expect(firstNonOnChar("手紙", "てがみ", unihan)).toBe("手");
    expect(checkEntry("ja", sino({ word: "名前", kana: "なまえ", reading: "danh tiền" }), unihan).errors.join()).toContain("does not confirm 名");
  });
  test("a character outside the derived file is an error, not a silent pass", () => {
    expect(checkEntry("ja", sino({ word: "手紙", kana: "しゅし", reading: "thủ chỉ" }), unihan).errors.join()).toContain(`紙 is not in ${UNIHAN_READINGS_REL}`);
  });
  test("a native kun word with a kanji (山 やま) and words with okurigana or katakana", () => {
    expect(checkEntry("ja", sino({ word: "山", kana: "やま", reading: "sơn" }), unihan).errors.length).toBeGreaterThan(0);
    expect(checkEntry("ja", sino({ word: "話す", kana: "はなす", reading: "thoại" }), unihan).errors.join()).toContain("Han characters only");
    expect(checkEntry("ja", sino({ word: "コーヒー", kana: "こーひー", reading: "cà phê" }), unihan).errors.join()).toContain("Han characters only");
  });
  test("on'yomi chains accept rendaku and sokuon (学校 がっこう, 国家 こっか, 留学生 りゅうがくせい)", () => {
    expect(firstNonOnChar("学校", "がっこう", unihan)).toBeNull();
    expect(firstNonOnChar("国家", "こっか", unihan)).toBeNull();
    expect(firstNonOnChar("留学生", "りゅうがくせい", unihan)).toBeNull();
  });
  test("a native Korean word: hanja that do not read as its hangul (사랑 ≠ 思量)", () => {
    expect(checkEntry("ko", sino({ word: "사랑", hanja: "思量", reading: "tư lượng" }), unihan).unconfirmed).toContain("量");
    expect(checkEntry("ko", sino({ word: "하나", hanja: "一", reading: "nhất" }), unihan).errors.join()).toContain("syllable");
  });
  test("Korean word-initial 두음법칙: 旅 려 → 여 only at the start", () => {
    expect(initialSoundLaw("려")).toBe("여");
    expect(initialSoundLaw("로")).toBe("노");
    expect(initialSoundLaw("녀")).toBe("여");
    expect(initialSoundLaw("학")).toBe("학");
    expect(checkEntry("ko", sino({ word: "여행", hanja: "旅行", reading: "lữ hành", note: "行: kVietnamese lists only hàng." }), unihan).errors).toEqual([]);
  });
  test("syllable count, case and script of the reading", () => {
    expect(checkEntry("zh", sino({ word: "学生", reading: "học" }), unihan).errors.join()).toContain("1 syllable(s) for 2");
    expect(checkEntry("zh", sino({ word: "学生", reading: "HỌC sinh" }), unihan).errors.join()).toContain("lower case");
    expect(checkEntry("zh", sino({ word: "学生", reading: "xue sheng2" }), unihan).errors.join()).toContain("not a Vietnamese syllable");
  });
  test("an unsorted, duplicated or non-canonical table", () => {
    const a = sino({ word: "学生", reading: "học sinh" });
    const b = sino({ word: "中国", reading: "Trung Quốc" });
    expect(validateHanVietTable("zh", tableText("zh", [a, b]), unihan).errors.join()).toContain("sorted");
    expect(validateHanVietTable("zh", tableText("zh", [b, b]), unihan).errors.join()).toContain("duplicate word 中国");
    expect(validateHanVietTable("zh", JSON.stringify({ language: "zh", entries: [b] }), unihan).errors.join()).toContain("canonical");
    expect(validateHanVietTable("zh", tableText("zh", [b]), unihan).errors).toEqual([]);
  });
  test("an entry that is not kind sino, or a ko entry without hanja", () => {
    expect(validateHanVietTable("zh", JSON.stringify({ language: "zh", entries: [{ word: "中国", reading: "Trung Quốc", kind: "native" }] }), unihan).errors.length).toBe(1);
    expect(validateHanVietTable("ko", JSON.stringify({ language: "ko", entries: [{ word: "사랑", reading: "x", kind: "sino" }] }), unihan).errors.join()).toContain("hanja");
  });
});

describe("Vietnamese syllable folding", () => {
  test("old and new tone placement are one key; tones stay distinct", () => {
    expect(foldViSyllable("hoá")).toBe(foldViSyllable("hóa"));
    expect(foldViSyllable("hoạ")).toBe(foldViSyllable("họa"));
    expect(foldViSyllable("hoá")).not.toBe(foldViSyllable("hoà"));
    expect(foldViSyllable("học")).not.toBe(foldViSyllable("hộc"));
  });
  test("onset + y folds to onset + i (lý = lí), a bare y does not", () => {
    expect(foldViSyllable("lý")).toBe(foldViSyllable("lí"));
    expect(foldViSyllable("Quý")).toBe(foldViSyllable("quí"));
    expect(foldViSyllable("y")).not.toBe(foldViSyllable("i"));
  });
});

describe("Unihan derivation (pure, deterministic)", () => {
  const readingsText = ["# comment", "U+5B66\tkMandarin\txué", "U+5B78\tkVietnamese\thọc", "U+5B78\tkHangul\t학:0E", "U+6C23\tkVietnamese\tkhí", "U+5B78\tkDefinition\tlearning"].join("\n");
  const variantsText = ["U+5B66\tkTraditionalVariant\tU+5B78", "U+5B78\tkSemanticVariant\tU+6588<kLau,kMatthews", "U+5B78\tkSpoofingVariant\tU+4E00"].join("\n");
  const manifest = { source: { url: "https://example.org/Unihan.zip", sha256: "0".repeat(64), unicodeVersion: "17.0.0" } } as UnihanManifest;
  const readings = parseUnihanText(readingsText, new Set(["kMandarin", "kVietnamese", "kHangul"]));
  const graph = buildVariantGraph(
    parseUnihanText(variantsText, new Set(["kTraditionalVariant", "kSimplifiedVariant", "kSemanticVariant", "kZVariant"])),
    jinmeiyoLinks(parseUnihanText("U+6C23\tkJinmeiyoKanji\t2010:U+6C17\nU+4E00\tkJinmeiyoKanji\t2010", new Set(["kJinmeiyoKanji"])))
  );

  test("variants: the four fields both ways only as Unihan states them, kJinmeiyoKanji both ways, never kSpoofingVariant", () => {
    expect(graph.get("学")).toEqual(["學"]);
    expect(graph.get("學")).toEqual(["斈"]);
    expect(graph.get("気")).toEqual(["氣"]);
    expect(graph.get("氣")).toEqual(["気"]);
    expect(graph.has("一")).toBe(false);
  });
  test("derived file: requested characters + variants, kHangul source codes dropped, unwanted fields absent", () => {
    const doc = deriveUnihanReadings({ readings, graph, chars: ["学", "気"], manifest });
    // Code-point order: 学 U+5B66, 學 U+5B78, 気 U+6C17, 氣 U+6C23 (斈 is two hops from 学: not kept).
    expect(Object.keys(doc.chars)).toEqual(["学", "學", "気", "氣"]);
    expect(doc.chars["學"]).toEqual({ kVietnamese: "học", kHangul: "학", variants: "斈" });
    expect(doc.chars["学"]).toEqual({ kMandarin: "xué", variants: "學" });
    const text = renderUnihanReadings(doc);
    expect(UnihanReadingsSchema.parse(JSON.parse(text))).toEqual(doc);
    expect(renderUnihanReadings(deriveUnihanReadings({ readings, graph, chars: ["気", "学"], manifest }))).toBe(text);
  });
  test("the committed derived file is in canonical form and covers every table character", () => {
    const raw = readFileSync(safeResolve(UNIHAN_READINGS_REL), "utf8").replace(/\r\n/g, "\n");
    expect(renderUnihanReadings(UnihanReadingsSchema.parse(JSON.parse(raw)))).toBe(raw);
    expect(Buffer.byteLength(raw)).toBeLessThan(600_000);
  });
});

describe("provenance", () => {
  test("Unihan is registered Unicode-3.0, build-time only, covering data files only", () => {
    const s = loadRegistry().sources.find((x) => x.id === "unihan");
    expect(s?.license).toBe("Unicode-3.0");
    expect(s?.buildTimeOnly).toBe(true);
    expect(s?.covers).toContain(UNIHAN_READINGS_REL);
    for (const c of s?.covers ?? []) expect(coverFitsScope(c, "data")).toBe(true);
  });
  test("ATTRIBUTIONS.md credits Unihan", () => {
    expect(readFileSync(safeResolve("ATTRIBUTIONS.md"), "utf8")).toContain("Unihan Database");
  });
});

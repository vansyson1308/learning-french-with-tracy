/**
 * P3e §8: the LanguageTool gate's pure parts (no server needed) and the
 * target-string collector it checks.
 */
import { describe, expect, test } from "bun:test";

import { applicable, unallowed, unusedAllowances, type LanguageToolAllow, type LtFinding } from "../languagetool";
import { readJson } from "../lib/pipeline";
import { collectTargetStrings, uniqueTargetStrings } from "../lib/target-strings";

const finding = (rule: string, match: string, text: string): LtFinding => ({
  rule,
  category: "X",
  message: "m",
  match,
  replacements: [],
  text,
  where: ["somewhere"],
});

const allow = (entries: LanguageToolAllow["allow"]): LanguageToolAllow => ({ version: 1, language: "es", disabledRules: [], allow: entries });

describe("LanguageTool gate", () => {
  test("sentence-start casing applies to sentences, not to vocabulary fragments", () => {
    const m = { rule: "UPPERCASE_SENTENCE_START", category: "CASING", message: "", match: "el", replacements: [] };
    expect(applicable(m, "el pan")).toBe(false);
    expect(applicable(m, "el niño come pan.")).toBe(true);
    expect(applicable({ ...m, rule: "MORFOLOGIK_RULE_ES" }, "el arból")).toBe(true);
  });

  test("an allowance covers its rule + match, optionally only inside one text", () => {
    const f = [finding("MORFOLOGIK_RULE_ES", "Minh", "Me llamo Minh."), finding("MORFOLOGIK_RULE_ES", "cafe", "el cafe"), finding("MORFOLOGIK_RULE_ES", "cafe", "un cafe solo")];
    const a = allow([
      { rule: "MORFOLOGIK_RULE_ES", match: "Minh", reason: "Vietnamese personal name" },
      { rule: "MORFOLOGIK_RULE_ES", match: "cafe", text: "el cafe", reason: "deliberate wrong option" },
    ]);
    expect(unallowed(f, a).map((x) => x.text)).toEqual(["un cafe solo"]);
  });

  test("an allowance no finding uses is reported as stale", () => {
    const a = allow([{ rule: "MAS", match: "mas", text: "nada mas", reason: "accent-free accepted answer" }]);
    expect(unusedAllowances([], a)).toHaveLength(1);
    expect(unusedAllowances([finding("MAS", "mas", "nada mas")], a)).toHaveLength(0);
  });

  test("the committed allow file gives every entry a reason", () => {
    const a = readJson("content/es/languagetool-allow.json") as LanguageToolAllow;
    expect(a.language).toBe("es");
    for (const e of [...a.allow, ...a.disabledRules]) expect(e.reason.length).toBeGreaterThanOrEqual(10);
  });
});

describe("target strings (es-vi)", () => {
  const all = collectTargetStrings("es-vi");
  const texts = new Set(all.map((s) => s.text));

  test("collects Spanish model text from the pack and the rich layers", () => {
    expect(texts.has("el hombre")).toBe(true);
    expect(all.some((s) => s.where.startsWith("content/es/reception/listening.json"))).toBe(true);
    expect(all.some((s) => s.where.startsWith("content/es/exam/"))).toBe(true);
    expect(all.some((s) => s.where.startsWith("content/es/lexicon/lexemes.json") && s.key === "target")).toBe(true);
  });

  test("leaves out Vietnamese text, ids and enum values", () => {
    // A Spanish sentence may carry a Vietnamese name ("Mi apellido es Nguyễn."); a Vietnamese string never passes.
    for (const s of all) {
      if (s.key !== "target") expect(s.text).not.toMatch(/[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹà]/i);
      expect(s.text).not.toMatch(/^es[.:]/);
    }
    expect(texts.has("H. Máy bay")).toBe(false); // exam picture option (native text inside a bank item)
    expect(texts.has("tình bạn")).toBe(false);
    expect(texts.has("targetToNative")).toBe(false);
    expect(texts.has("es-ES")).toBe(false);
  });

  test("dedupes with every location kept", () => {
    const u = uniqueTargetStrings(all);
    expect(u.length).toBeLessThan(all.length);
    expect(u.reduce((n, x) => n + x.where.length, 0)).toBe(all.length);
  });
});

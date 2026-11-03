/**
 * typeAnswer.script (D-10 owner decision, 2026-11-03): the schema takes only "katakana"; the validator allows it only
 * where the target plugin has an in-script form (ja) and only on a key and alternatives written in katakana.
 */
import { describe, expect, test } from "bun:test";

import { TypeAnswerExerciseSchema } from "../../content/schema";
import { languageRules } from "../../src/lib/languages";
import { BUILD_LANGUAGES } from "../lib/languages";
import { validateExercise } from "../lib/pipeline";

const item = (answer: string, alternatives: string[] = [], script: unknown = "katakana") => ({
  type: "typeAnswer" as const,
  id: "ja-en:x-e1",
  mode: "produceTarget" as const,
  prompt: "Gõ bằng katakana: \"bánh mì\".",
  answer,
  alternatives,
  script,
});

function scriptErrors(courseId: string, targetCode: string, e: ReturnType<typeof item>): string[] {
  const out: string[] = [];
  validateExercise(courseId, e as never, (m) => out.push(m), targetCode);
  return out.filter((m) => m.includes("script"));
}

describe("typeAnswer.script", () => {
  test("the schema takes katakana, nothing else, and leaves it out by default", () => {
    expect(TypeAnswerExerciseSchema.parse(item("パン")).script).toBe("katakana");
    expect(() => TypeAnswerExerciseSchema.parse(item("パン", [], "hiragana"))).toThrow();
    const { script: _s, ...plain } = item("パン");
    expect(TypeAnswerExerciseSchema.parse(plain).script).toBeUndefined();
  });

  test("a katakana key passes; a key or alternative with hiragana or kanji is an error", () => {
    expect(scriptErrors("ja-en", "ja", item("コーヒー", ["ｺｰﾋｰ"]))).toEqual([]);
    expect(scriptErrors("ja-en", "ja", item("グエン・ナム"))).toEqual([]);
    expect(scriptErrors("ja-en", "ja", item("ぱん")).join("\n")).toContain("written in katakana");
    expect(scriptErrors("ja-en", "ja", item("パン", ["ぱん"])).join("\n")).toContain("written in katakana");
    expect(scriptErrors("ja-en", "ja", item("日本")).join("\n")).toContain("written in katakana");
  });

  test("a language without an in-script form cannot use it", () => {
    expect(scriptErrors("fr-en", "fr", { ...item("pain"), id: "fr-en:x-e1" }).join("\n")).toContain("has no in-script comparison");
  });

  test("the build facts and the runtime plugins agree on which languages have the form", () => {
    for (const [code, lang] of Object.entries(BUILD_LANGUAGES)) {
      expect([code, (lang.typedScripts ?? []).length > 0]).toEqual([code, languageRules(code).normalizeLenientInScript !== undefined]);
    }
  });
});

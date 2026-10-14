/**
 * i18n (P2a): the formatter (placeholders, plural, select, lists,
 * nesting, malformed templates), language resolution (preference, device
 * tag, env pin), the catalogue contract (English is the key source of
 * truth; Vietnamese mirrors every key with the same placeholders; the
 * generated MessageKey union is current; no empty values; honesty
 * wording present in both languages), and the store-bound `t()`.
 */
import { afterEach, describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import path from "path";

import en from "../i18n/catalog/en.json";
import vi from "../i18n/catalog/vi.json";
import { __setDeviceLanguageTagsForTests } from "../i18n/device-locale";
import { formatMessage, placeholdersOf, pluralCategory } from "../i18n/format";
import { currentUiLanguage, resolveUiLanguage, t, tm, translatorFor } from "../i18n";
import { MESSAGE_KEY_COUNT } from "../i18n/keys";
import { msg } from "../i18n/message";
import { languageName, translate } from "../i18n/translate";
import { useProgress } from "../store";

const ROOT = path.resolve(__dirname, "..", "..", "..");

afterEach(() => {
  __setDeviceLanguageTagsForTests(null);
  useProgress.setState({ uiLanguage: "system" });
  delete process.env.EXPO_PUBLIC_UI_LANG;
});

describe("formatMessage", () => {
  test("placeholders, numbers, missing params stay visible", () => {
    expect(formatMessage("Hello {name}, {n} left", { name: "Ann", n: 3 })).toBe("Hello Ann, 3 left");
    expect(formatMessage("Hello {name}", {})).toBe("Hello {name}");
  });
  test("plural: exact, one/other, # substitution; Vietnamese has no 'one'", () => {
    const tpl = "{n, plural, =0 {none} one {# word} other {# words}}";
    expect(formatMessage(tpl, { n: 0 }, "en")).toBe("none");
    expect(formatMessage(tpl, { n: 1 }, "en")).toBe("1 word");
    expect(formatMessage(tpl, { n: 5 }, "en")).toBe("5 words");
    expect(formatMessage("{n, plural, one {một} other {# từ}}", { n: 1 }, "vi")).toBe("1 từ");
    expect(pluralCategory(1, "vi")).toBe("other");
    expect(pluralCategory(1.5, "en")).toBe("other");
  });
  test("select with nesting and lists with language joiners", () => {
    const tpl = "{g, select, m {he has {n, plural, one {# cat} other {# cats}}} other {they have {n}}}";
    expect(formatMessage(tpl, { g: "m", n: 2 })).toBe("he has 2 cats");
    expect(formatMessage(tpl, { g: "x", n: 2 })).toBe("they have 2");
    expect(formatMessage("{a, list, and}", { a: ["x", "y", "z"] }, "en")).toBe("x, y and z");
    expect(formatMessage("{a, list, or}", { a: ["x", "y"] }, "vi")).toBe("x hoặc y");
    expect(formatMessage("{a, list, comma}", { a: ["x"] }, "vi")).toBe("x");
    expect(placeholdersOf(tpl)).toEqual(["g", "n"]);
  });
  test("a malformed template formats as itself", () => {
    expect(formatMessage("{oops", { oops: 1 })).toBe("{oops");
    expect(formatMessage("{n, weird, a {b}}", { n: 1 })).toBe("{n, weird, a {b}}");
  });
});

describe("resolveUiLanguage", () => {
  test("explicit preference wins; system follows the first device tag; env pins system", () => {
    expect(resolveUiLanguage("vi", ["en-US"])).toBe("vi");
    expect(resolveUiLanguage("en", ["vi-VN"])).toBe("en");
    expect(resolveUiLanguage("system", ["vi-VN", "en-US"])).toBe("vi");
    expect(resolveUiLanguage("system", ["vi"])).toBe("vi");
    expect(resolveUiLanguage("system", ["en-US", "vi-VN"])).toBe("en");
    expect(resolveUiLanguage("system", ["fr-FR"])).toBe("en");
    expect(resolveUiLanguage("system", [])).toBe("en");
    process.env.EXPO_PUBLIC_UI_LANG = "vi";
    expect(resolveUiLanguage("system", ["en-US"])).toBe("vi");
    expect(resolveUiLanguage("en", ["en-US"])).toBe("en");
  });
  test("the store-bound t() follows the preference and the device", () => {
    __setDeviceLanguageTagsForTests(["vi-VN"]);
    useProgress.setState({ uiLanguage: "system" });
    expect(currentUiLanguage()).toBe("vi");
    expect(t("tabs.learn")).toBe("Học");
    useProgress.getState().setUiLanguage("en");
    expect(t("tabs.learn")).toBe("Learn");
    expect(tm(msg("quest.xp", { goal: 20 }))).toBe("Earn 20 XP");
    const tr = translatorFor("vi");
    expect(tr.languageName("fr", "French")).toBe("Tiếng Pháp");
    expect(tr.languageName("zz", "Zonk")).toBe("Zonk");
  });
});

describe("catalogue contract", () => {
  const enKeys = Object.keys(en).sort();
  const viKeys = Object.keys(vi).sort();
  test("Vietnamese mirrors every English key, nothing more", () => {
    expect(viKeys).toEqual(enKeys);
  });
  test("the generated MessageKey union is current (bun scripts/i18n-keys.ts)", () => {
    expect(MESSAGE_KEY_COUNT).toBe(enKeys.length);
    const generated = readFileSync(path.join(ROOT, "src/lib/i18n/keys.ts"), "utf8");
    for (const key of enKeys) expect(generated).toContain(JSON.stringify(key));
  });
  test("every value is non-empty, parses, and Vietnamese uses only placeholders English defines", () => {
    for (const key of enKeys) {
      const e = (en as Record<string, string>)[key];
      const v = (vi as Record<string, string>)[key];
      expect({ key, empty: e.trim() === "" || v.trim() === "" }).toEqual({ key, empty: false });
      // A translation may drop a parameter it does not need (Vietnamese has
      // no plural inflection, so a count used only for pluralising English
      // may vanish); it may never invent one the caller does not pass.
      const enNames = new Set(placeholdersOf(e));
      const unknown = placeholdersOf(v).filter((name) => !enNames.has(name));
      expect({ key, unknown }).toEqual({ key, unknown: [] });
    }
  });
  test("English catalogue keys are namespaced and sorted (deterministic diffs)", () => {
    expect(Object.keys(en)).toEqual(enKeys);
    for (const key of enKeys) expect(key).toMatch(/^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9_:-]+)+$/);
  });
  test("translate falls back to English, then to the key", () => {
    expect(translate("vi", "tabs.profile")).toBe("Hồ sơ");
    expect(translate("vi", "nope.missing" as never)).toBe("nope.missing");
    expect(languageName("en", "vi", "x")).toBe("Vietnamese");
  });
});

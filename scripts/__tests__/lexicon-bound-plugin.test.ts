/**
 * P4d: validators read zh speech, writing and interaction answers with the tokens the app grades with — the runtime
 * plugin bound to the target's words (lexiconBoundPlugin) — never Intl.Segmenter's. Only an opted-in language is bound.
 */
import { describe, expect, test } from "bun:test";

import { normalizeWritten } from "../../src/lib/writing/rubric";
import { buildPlugin, lexiconBoundPlugin } from "../lib/languages";

const zhWords = ["我", "是", "越南人", "越南", "人", "住", "在", "上海", "公交车", "六", "点", "到", "学生"].map((surface) => ({ surface }));

describe("lexiconBoundPlugin", () => {
  test("zh: the dictionary path — words of the lexicon, every other hanzi a token of its own", () => {
    const bound = lexiconBoundPlugin(buildPlugin("zh"), zhWords);
    expect(normalizeWritten("我是越南人。我住在上海。", bound.rules)).toBe("我 是 越南人 我 住 在 上海");
    expect(normalizeWritten("我的公交车六点到。", bound.rules)).toBe("我 的 公交车 六 点 到");
    expect(bound.tokenize("我是学生")).toEqual(["我", "是", "学生"]);
  });

  test("zh: the traditional spelling a lexeme stores is folded to its surface", () => {
    const bound = lexiconBoundPlugin(buildPlugin("zh"), [{ surface: "学生", reading: { traditional: "學生" } }, { surface: "我" }, { surface: "是" }]);
    expect(normalizeWritten("我是學生", bound.rules)).toBe("我 是 学生");
  });

  test("a language that has not opted in (ja), a Latin-script one and an empty lexicon keep the plugin as it is", () => {
    for (const code of ["ja", "es", "fr"]) {
      const plugin = buildPlugin(code);
      expect(lexiconBoundPlugin(plugin, [{ surface: "x" }])).toBe(plugin);
    }
    const zh = buildPlugin("zh");
    expect(lexiconBoundPlugin(zh, [])).toBe(zh);
    expect(lexiconBoundPlugin(zh, null)).toBe(zh);
  });
});

/**
 * The graded-story reader's reading layer (pure): furigana over each word
 * token — its own lexeme's stored reading first, else the course's reading
 * index (inflection keys included) — and the romaji line of a sentence.
 * Never a Hán-Việt line on a token (the lessons show it on single words only).
 */
import { describe, expect, test } from "bun:test";

import { buildScriptReadingIndex, EMPTY_SCRIPT_INDEX } from "../learning/script-reading";
import { storySentenceRomaji, storyTokenReading } from "../stories/story-reading";

const GAKUSEI = { kana: "がくせい", furigana: [{ base: "学", ruby: "がく" }, { base: "生", ruby: "せい" }] };
const INDEX = buildScriptReadingIndex([
  { surface: "学生", reading: GAKUSEI },
  { surface: "食べる", reading: { kana: "たべる", furigana: [{ base: "食", ruby: "た" }, { base: "べる" }] } },
  { surface: "今日", reading: { kana: "きょう", furigana: [{ base: "今日", ruby: "きょう" }] } },
  { surface: "です", reading: { kana: "です", furigana: [{ base: "です" }] } },
  { surface: "食べま", reading: { kana: "たべま", furigana: [{ base: "食", ruby: "た" }, { base: "べま" }] }, stem: true },
]);

const ON = { targetCode: "ja", furigana: true, romaji: true };

describe("storyTokenReading", () => {
  test("a word token carries its furigana, never a Hán-Việt or romaji line", () => {
    const reading = storyTokenReading("学生", { surface: "学生", reading: GAKUSEI }, INDEX, ON);
    expect(reading?.segments).toEqual([
      { base: "学", ruby: "がく" },
      { base: "生", ruby: "せい" },
    ]);
    expect(reading?.position).toBe("above");
    expect(reading?.hanViet).toBeUndefined();
    expect(reading?.romaji).toBeUndefined();
  });

  test("the token's own lexeme wins over a homograph in the index", () => {
    const konnichi = { kana: "こんにち", furigana: [{ base: "今日", ruby: "こんにち" }] };
    expect(storyTokenReading("今日", { surface: "今日", reading: konnichi }, INDEX, ON)?.segments).toEqual([{ base: "今日", ruby: "こんにち" }]);
    expect(storyTokenReading("今日", undefined, INDEX, ON)?.segments).toEqual([{ base: "今日", ruby: "きょう" }]);
  });

  test("an inflected token reads through the index's inflection keys", () => {
    const reading = storyTokenReading("食べます", { surface: "食べる", reading: { kana: "たべる" } }, INDEX, ON);
    expect(reading?.segments).toEqual([{ base: "食", ruby: "た" }, { base: "べます" }]);
  });

  test("no reading: kana-only text, the switch off, an empty index, blank text", () => {
    expect(storyTokenReading("です", undefined, INDEX, ON)).toBeUndefined();
    expect(storyTokenReading("学生", undefined, INDEX, { ...ON, furigana: false })).toBeUndefined();
    expect(storyTokenReading("学生", undefined, EMPTY_SCRIPT_INDEX, ON)).toBeUndefined();
    expect(storyTokenReading("", undefined, INDEX, ON)).toBeUndefined();
  });
});

describe("storySentenceRomaji", () => {
  test("the whole sentence's romaji while the course shows it", () => {
    expect(storySentenceRomaji("学生です。", INDEX, ON)).toBe("gakusei desu.");
    expect(storySentenceRomaji("学生です。", INDEX, { ...ON, furigana: false })).toBe("gakusei desu.");
  });

  test("none after the primer, for a Latin text or an empty index", () => {
    expect(storySentenceRomaji("学生です。", INDEX, { ...ON, romaji: false })).toBeUndefined();
    expect(storySentenceRomaji("Le chat dort.", INDEX, ON)).toBeUndefined();
    expect(storySentenceRomaji("学生です。", EMPTY_SCRIPT_INDEX, ON)).toBeUndefined();
  });
});

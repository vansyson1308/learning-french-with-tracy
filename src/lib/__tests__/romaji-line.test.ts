/**
 * P4c task 5: the romaji line. A course whose profile says `romajiUntilPrimer`
 * shows the Hepburn reading of its Japanese text — read from the stored kana
 * of the words, never guessed — until the learner passes the kana primer
 * checkpoint; the reading-aid switch still controls the furigana only.
 */
import { describe, expect, test } from "bun:test";

import { courseProfile } from "../course-profile";
import { furiganaFromKana, japaneseInflectionSources } from "../languages/ja-inflection";
import { buildScriptReadingIndex, romajiLine, scriptReadingFor, type ReadingSource } from "../learning/script-reading";
import { romajiShown } from "../use-reading-aid";

/** A stored word as the lexicon index holds it: kana, and furigana where it has kanji. */
const kana = (surface: string, value: string, pos?: string): ReadingSource => {
  const furigana = furiganaFromKana(surface, value);
  return { surface, reading: { kana: value, ...(furigana && /\p{Script=Han}/u.test(surface) ? { furigana } : {}) }, ...(pos ? { pos } : {}) };
};

const SOURCES: ReadingSource[] = [
  kana("私", "わたし"),
  kana("学生", "がくせい"),
  kana("です", "です"),
  kana("食べる", "たべる", "verb"),
  kana("毎日", "まいにち"),
  kana("こんにちは", "こんにちは"),
  kana("田中", "たなか"),
  kana("さん", "さん"),
  kana("東京", "とうきょう"),
  kana("行く", "いく", "verb"),
  kana("コーヒー", "コーヒー"),
  kana("ください", "ください"),
  kana("時", "じ"),
  kana("下", "した"),
  kana("何", "なに"),
  kana("か", "か"),
];
const INDEX = buildScriptReadingIndex([...SOURCES, ...japaneseInflectionSources(SOURCES).map((s) => ({ ...s, stem: true as const }))]);
const line = (text: string) => romajiLine(text, INDEX);

describe("romajiLine", () => {
  test("words spaced, the particle は read wa, sentence punctuation kept", () => {
    expect(line("私は学生です。")).toBe("watashi wa gakusei desu.");
    expect(line("わたしは がくせいです")).toBe("watashi wa gakusei desu");
  });
  test("an inflected verb is one word with its ending", () => {
    expect(line("毎日食べます。")).toBe("mainichi tabemasu.");
    expect(line("東京へ行きました。")).toBe("toukyou e ikimashita.");
  });
  test("names, set expressions, katakana and numbers", () => {
    expect(line("田中さん、こんにちは！")).toBe("tanaka san, konnichiwa!");
    expect(line("コーヒーをください")).toBe("kōhī o kudasai");
  });
  test("words stay apart: を is its own word, the n-apostrophe only inside a word", () => {
    // ぱん is no stored word here: the kana run used to be read as one word, "pan'o".
    expect(line("ぱんをください")).toBe("pan o kudasai");
    expect(line("きんえんです")).toBe("kin'en desu");
    expect(line("べんきょうをします")).toBe("benkyou o shimasu");
  });
  test("an inflection key keeps its whole ending, even when the ending spells a stored word (した)", () => {
    expect(line("毎日食べました。")).toBe("mainichi tabemashita.");
    expect(line("毎日食べませんでした")).toBe("mainichi tabemasendeshita");
    expect(line("何かありましたか")).toBe("nani ka arimashita ka");
  });
  test("a kanji with no stored reading: no line at all (never a guess)", () => {
    expect(line("私は猫です。")).toBeUndefined();
  });
  test("text that is not Japanese (a native-language prompt or option) gets no line", () => {
    expect(line("Tôi là sinh viên.")).toBeUndefined();
    expect(line("student")).toBeUndefined();
    expect(line("7時 OK です")).toBe("7 ji OK desu");
  });
});

describe("scriptReadingFor with the romaji option", () => {
  const opts = { targetCode: "ja", showHanViet: false };
  test("furigana and romaji together; romaji alone when the reading aid is off; text without kanji gets a line too", () => {
    const both = scriptReadingFor("学生です", INDEX, { ...opts, romaji: true })!;
    expect(both.segments.some((s) => s.ruby === "がくせい")).toBe(true);
    expect(both.romaji).toBe("gakusei desu");
    const romajiOnly = scriptReadingFor("学生です", INDEX, { ...opts, romaji: true, furigana: false })!;
    expect(romajiOnly.segments).toEqual([{ base: "学生です" }]);
    expect(romajiOnly.romaji).toBe("gakusei desu");
    expect(scriptReadingFor("ありがとう", INDEX, { ...opts, romaji: true })?.romaji).toBe("arigatou");
  });
  test("without the option nothing changes (P4b behaviour)", () => {
    expect(scriptReadingFor("学生です", INDEX, opts)?.romaji).toBeUndefined();
    expect(scriptReadingFor("ありがとう", INDEX, opts)).toBeUndefined();
    expect(scriptReadingFor("学生です", INDEX, { ...opts, furigana: false })).toBeUndefined();
  });
});

describe("romajiShown", () => {
  test("only a romajiUntilPrimer course, only until its primer is passed", () => {
    // No shipped course sets the flag yet (ja-vi is staged until promote).
    expect(courseProfile("ja-en").romajiUntilPrimer).toBeUndefined();
    expect(romajiShown("ja-en", {})).toBe(false);
    expect(romajiShown("fr-en", {})).toBe(false);
  });
});

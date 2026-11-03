/**
 * P4c session 3: ja verb / adjective morphology from the kaikki tables, tagged with the nine paradigm cells. Entries
 * here copy the shape of the real dump (scripts/lib/lexicon-etl/ja-morphology.ts explains each table).
 */
import { describe, expect, test } from "bun:test";

import { japaneseParadigmCells } from "../lib/languages/ja-morph";
import { japaneseMorphologyFromEntries, type JaKaikkiEntry, type JaKaikkiForm } from "../lib/lexicon-etl/ja-morphology";

const conj = (form: string, ...tags: string[]): JaKaikkiForm => ({ form, tags, source: "conjugation" });
const key = (form: string, roman: string, ...tags: string[]): JaKaikkiForm => ({ form, tags, roman, source: "conjugation" });
const infl = (form: string, ...tags: string[]): JaKaikkiForm => ({ form, tags, source: "inflection" });

/** 書く: both tables (the key-constructions rows carry `roman`), the bungo rows, rōmaji rows and a header row. */
const KAKU: JaKaikkiEntry = {
  word: "書く",
  pos: "verb",
  lang_code: "ja",
  forms: [
    { form: "書く", tags: ["canonical"] },
    { form: "書いた", tags: ["past"] },
    conj("no-table-tags", "table-tags"),
    conj("書く", "terminative"),
    conj("かく", "terminative"),
    conj("kaku", "terminative"),
    conj("書かない", "negative"),
    conj("かかない", "negative"),
    conj("書きます", "formal"),
    conj("かきます", "formal"),
    conj("書いた", "perfective"),
    conj("書いて", "conjunctive"),
    conj("かいて", "conjunctive"),
    conj("書かず", "negative"), // bungo
    conj("書きき", "past"), // bungo
    key("書かないで", "kakanaide", "conjunctive", "negative"),
    key("書きます", "kakimasu", "polite"),
    key("書きません", "kakimasen", "negative", "polite"),
    key("書かなかった", "kakanakatta", "negative"),
    key("書きました", "kakimashita", "polite"),
    key("書きませんでした", "kakimasen deshita", "negative", "polite"),
  ],
};

/** 来る: its key-constructions table writes ruby into the form (来きます) — not the word as written, so it is not taken. */
const KURU: JaKaikkiEntry = {
  word: "来る",
  pos: "verb",
  lang_code: "ja",
  forms: [
    conj("来る", "terminative"),
    conj("くる", "terminative"),
    conj("来ない", "negative"),
    conj("こない", "negative"),
    conj("来ます", "formal"),
    conj("きます", "formal"),
    conj("来た", "perfective"),
    conj("来て", "conjunctive"),
    key("来きます", "kimasu", "polite"),
    key("来こなかった", "konakatta", "negative"),
  ],
};
/** The other 来る (きたる): never the course's くる. */
const KITARU: JaKaikkiEntry = { word: "来る", pos: "verb", lang_code: "ja", forms: [conj("来る", "terminative"), conj("きたる", "terminative"), conj("来らない", "negative")] };

/** 勉強する is filed under the noun 勉強. */
const BENKYOU: JaKaikkiEntry = {
  word: "勉強",
  pos: "verb",
  lang_code: "ja",
  forms: [conj("勉強する", "terminative"), conj("べんきょうする", "terminative"), conj("勉強しない", "negative"), conj("勉強します", "formal"), conj("勉強した", "perfective"), conj("勉強して", "conjunctive")],
};

const TAKAI: JaKaikkiEntry = {
  word: "高い",
  pos: "adj",
  lang_code: "ja",
  forms: [
    infl("高い", "stem", "terminative"),
    infl("たかい", "stem", "terminative"),
    infl("高くない", "informal", "negative"),
    infl("高かった", "informal", "past"),
    infl("高くなかった", "informal", "negative", "past"),
    infl("高いです", "formal"),
    infl("高くないです", "formal", "negative"),
    infl("高かったです", "formal", "past"),
    infl("高くなかったです", "formal", "negative", "past"),
    infl("高くて", "conjunctive"),
    infl("takakute", "conjunctive"),
  ],
};

const LEXEMES = [
  { lemma: "書く", partOfSpeech: "verb", reading: { kana: "かく" } },
  { lemma: "来る", partOfSpeech: "verb", reading: { kana: "くる" } },
  { lemma: "勉強する", partOfSpeech: "verb", reading: { kana: "べんきょうする" } },
  { lemma: "高い", partOfSpeech: "adjective", reading: { kana: "たかい" } },
  { lemma: "読む", partOfSpeech: "verb", reading: { kana: "よむ" } },
];

const result = japaneseMorphologyFromEntries([KAKU, KURU, KITARU, BENKYOU, TAKAI], LEXEMES);
const rowsOf = (lemma: string) => [...result.verbs, ...result.adjectives].find((w) => w.lemma === lemma)!.rows;
const cellsOf = (lemma: string, cell: string) => rowsOf(lemma).filter((r) => r.infoVer.split(",")[0] === cell).map((r) => r.mot);

describe("ja morphology from kaikki", () => {
  test("書く: all nine cells stated by the page (two tables), kana rows kept, rōmaji and bungo rows dropped", () => {
    const expected = japaneseParadigmCells("書く", "godan")!;
    for (const [cell, form] of Object.entries(expected)) expect(cellsOf("書く", cell)).toContain(form);
    expect(rowsOf("書く").some((r) => r.infoVer.includes("composed"))).toBe(false);
    expect(cellsOf("書く", "plain:nonpast:neg")).toEqual(["かかない", "書かない"]);
    expect(rowsOf("書く").map((r) => r.mot)).not.toContain("kaku");
    expect(rowsOf("書く").map((r) => r.mot)).not.toContain("書かず");
    expect(rowsOf("書く")[0]).toEqual({ mot: "書く", infoVer: "inf" });
  });

  test("来る: the ruby-written table is not taken; the missing cells are composed from stated rows and marked", () => {
    expect(rowsOf("来る").map((r) => r.mot)).not.toContain("来きます");
    expect(rowsOf("来る")).toContainEqual({ mot: "来ませんでした", infoVer: "polite:past:neg,composed" });
    expect(rowsOf("来る")).toContainEqual({ mot: "こなかった", infoVer: "plain:past:neg,composed" });
    expect(rowsOf("来る").map((r) => r.mot)).not.toContain("来らない"); // きたる is another word
    const expected = japaneseParadigmCells("来る", "irregular")!;
    for (const [cell, form] of Object.entries(expected)) expect(cellsOf("来る", cell)).toContain(form);
  });

  test("a する verb is read from its noun's entry", () => {
    expect(cellsOf("勉強する", "polite:nonpast:aff")).toEqual(["勉強します"]);
    expect(cellsOf("勉強する", "polite:past:aff")).toEqual(["勉強しました"]);
  });

  test("i-adjectives: the inflection table fills the nine cells directly", () => {
    expect(result.adjectives.map((a) => a.lemma)).toEqual(["高い"]);
    expect(cellsOf("高い", "polite:past:neg")).toEqual(["高くなかったです"]);
    expect(cellsOf("高い", "te")).toEqual(["高くて"]);
    expect(rowsOf("高い").some((r) => r.infoVer.includes("composed"))).toBe(false);
  });

  test("a lexeme with no entry gets no rows (nothing is generated from the lemma)", () => {
    expect(result.verbs.map((v) => v.lemma)).toEqual(["勉強する", "書く", "来る"]);
  });
});

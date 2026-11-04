/**
 * P4b stage 5 (task 6): paradigm cells declared by the ja / ko build
 * plugins, with the group rules that check authored tables; zh declares no
 * paradigm and exposes its measure-word and aspect-particle concepts
 * instead.
 */
import { describe, expect, test } from "bun:test";

import { conceptId } from "../../content/schema";
import { BUILD_LANGUAGES, buildPlugin } from "../lib/languages";
import { japaneseGroupRules, japaneseParadigmCells } from "../lib/languages/ja-morph";
import { koreanAeoForm, koreanGroupRules, koreanParadigmCells, tagKoreanCells } from "../lib/languages/ko-morph";
import { genericPlugin } from "../lib/languages/generic";
import { validateParadigmsData } from "../lib/pedagogy";

const errorsOf = (rules: typeof japaneseGroupRules, table: { lemma: string; group: string; cells: Record<string, string> }) => {
  const errors: string[] = [];
  rules(table, (m) => errors.push(m));
  return errors;
};

describe("plugins declare their cells", () => {
  test("ja: plain/polite × non-past/past × affirmative/negative, and the te-form", () => {
    expect(buildPlugin("ja").paradigm?.cellIds).toEqual([
      "plain:nonpast:aff",
      "plain:nonpast:neg",
      "plain:past:aff",
      "plain:past:neg",
      "polite:nonpast:aff",
      "polite:nonpast:neg",
      "polite:past:aff",
      "polite:past:neg",
      "te",
    ]);
    expect(buildPlugin("ja").paradigm?.groups).toEqual(["ichidan", "godan", "irregular"]);
  });
  test("ko: dictionary form, 해요체 present / past / future, honorific present", () => {
    expect(buildPlugin("ko").paradigm?.cellIds).toEqual(["inf", "haeyo:pre", "haeyo:pas", "haeyo:fut", "hon:pre"]);
  });
  test("zh: no paradigm; measure-word and aspect-particle concept ids instead", () => {
    const zh = buildPlugin("zh");
    expect(zh.paradigm).toBeUndefined();
    expect(zh.grammarConcepts?.map((c) => c.id)).toEqual([
      "zh:concept:measure-words",
      "zh:concept:aspect-le",
      "zh:concept:aspect-guo",
      "zh:concept:aspect-zhe",
      "zh:concept:aspect-zai",
    ]);
    for (const c of zh.grammarConcepts ?? []) expect(conceptId("zh").safeParse(c.id).success).toBe(true);
    expect(zh.grammarConcepts?.find((c) => c.kind === "measure-word")?.forms).toContain("个");
    expect(buildPlugin("ja").grammarConcepts).toBeUndefined();
  });
  test("the CJK plugins keep every generic default (trigram FTS, CER, facts)", () => {
    for (const code of ["ja", "ko", "zh"] as const) {
      const own = buildPlugin(code);
      const generic = genericPlugin(BUILD_LANGUAGES[code]!);
      expect(own.ftsTokenizer).toBe("trigram");
      expect(own.normalizeForAsr).toEqual(generic.normalizeForAsr);
      expect(own.charsPerSecBand).toEqual(generic.charsPerSecBand);
      expect({ ...own, paradigm: undefined, grammarConcepts: undefined, rules: undefined, splitSurfaceArticle: undefined, genderEvidenceInText: undefined, tokenize: undefined }).toEqual({
        ...generic,
        paradigm: undefined,
        grammarConcepts: undefined,
        rules: undefined,
        splitSurfaceArticle: undefined,
        genderEvidenceInText: undefined,
        tokenize: undefined,
      });
    }
  });
});

describe("ja conjugation rules", () => {
  test("ichidan 食べる", () => {
    expect(japaneseParadigmCells("食べる", "ichidan")).toEqual({
      "plain:nonpast:aff": "食べる",
      "plain:nonpast:neg": "食べない",
      "plain:past:aff": "食べた",
      "plain:past:neg": "食べなかった",
      "polite:nonpast:aff": "食べます",
      "polite:nonpast:neg": "食べません",
      "polite:past:aff": "食べました",
      "polite:past:neg": "食べませんでした",
      te: "食べて",
    });
  });
  test("godan te/ta sound changes, 行く and ある", () => {
    const te = (lemma: string) => japaneseParadigmCells(lemma, "godan")?.te;
    expect([te("書く"), te("泳ぐ"), te("話す"), te("待つ"), te("死ぬ"), te("飲む"), te("遊ぶ"), te("帰る"), te("買う"), te("行く")]).toEqual([
      "書いて", "泳いで", "話して", "待って", "死んで", "飲んで", "遊んで", "帰って", "買って", "行って",
    ]);
    expect(japaneseParadigmCells("買う", "godan")?.["plain:nonpast:neg"]).toBe("買わない");
    expect(japaneseParadigmCells("飲む", "godan")?.["polite:past:neg"]).toBe("飲みませんでした");
    expect(japaneseParadigmCells("行く", "godan")?.["plain:past:aff"]).toBe("行った");
    expect(japaneseParadigmCells("ある", "godan")?.["plain:nonpast:neg"]).toBe("ない");
    expect(japaneseParadigmCells("ある", "godan")?.["plain:past:neg"]).toBe("なかった");
  });
  test("irregular する, 勉強する, 来る / くる", () => {
    expect(japaneseParadigmCells("勉強する", "irregular")?.["polite:nonpast:aff"]).toBe("勉強します");
    expect(japaneseParadigmCells("する", "irregular")?.["plain:nonpast:neg"]).toBe("しない");
    expect(japaneseParadigmCells("来る", "irregular")?.te).toBe("来て");
    expect(japaneseParadigmCells("くる", "irregular")?.["plain:nonpast:neg"]).toBe("こない");
    expect(japaneseParadigmCells("くる", "irregular")?.["polite:nonpast:aff"]).toBe("きます");
    expect(japaneseParadigmCells("見る", "irregular")).toBeNull();
    expect(japaneseParadigmCells("書く", "ichidan")).toBeNull();
  });
  test("group rules flag a wrong cell and a verb its group cannot conjugate", () => {
    const cells = { ...japaneseParadigmCells("書く", "godan")!, te: "書きて" };
    expect(errorsOf(japaneseGroupRules, { lemma: "書く", group: "godan", cells })).toEqual(['書く: godan te must be "書いて", got "書きて"']);
    expect(errorsOf(japaneseGroupRules, { lemma: "書く", group: "ichidan", cells })).toEqual(["書く: no ichidan rule conjugates it — check the group"]);
    expect(errorsOf(japaneseGroupRules, { lemma: "書く", group: "godan", cells: japaneseParadigmCells("書く", "godan")! })).toEqual([]);
  });
});

describe("ko conjugation rules", () => {
  test("the 아/어 form with contractions", () => {
    expect(["가", "오", "보", "주", "마시", "쓰", "바쁘", "되", "보내", "먹", "좋", "읽", "공부하"].map(koreanAeoForm)).toEqual([
      "가", "와", "봐", "줘", "마셔", "써", "바빠", "돼", "보내", "먹어", "좋아", "읽어", "공부해",
    ]);
  });
  test("regular verbs: 해요체 present / past / future, honorific present", () => {
    expect(koreanParadigmCells("가다", "regular")).toEqual({ inf: "가다", "haeyo:pre": "가요", "haeyo:pas": "갔어요", "haeyo:fut": "갈 거예요", "hon:pre": "가세요" });
    expect(koreanParadigmCells("먹다", "regular")).toEqual({ inf: "먹다", "haeyo:pre": "먹어요", "haeyo:pas": "먹었어요", "haeyo:fut": "먹을 거예요", "hon:pre": "먹으세요" });
    expect(koreanParadigmCells("마시다", "regular")?.["haeyo:pas"]).toBe("마셨어요");
    expect(koreanParadigmCells("오다", "regular")?.["haeyo:pas"]).toBe("왔어요");
    expect(koreanParadigmCells("배우다", "regular")?.["haeyo:pre"]).toBe("배워요");
    // ㄹ-final: the future keeps it, the honorific drops it.
    expect(koreanParadigmCells("살다", "regular")).toEqual({ inf: "살다", "haeyo:pre": "살아요", "haeyo:pas": "살았어요", "haeyo:fut": "살 거예요", "hon:pre": "사세요" });
  });
  test("하다 verbs; irregular verbs are not rule-generated", () => {
    expect(koreanParadigmCells("공부하다", "hada")).toEqual({ inf: "공부하다", "haeyo:pre": "공부해요", "haeyo:pas": "공부했어요", "haeyo:fut": "공부할 거예요", "hon:pre": "공부하세요" });
    expect(koreanParadigmCells("먹다", "hada")).toBeNull();
    expect(koreanParadigmCells("듣다", "irregular")).toBeNull();
  });
  test("group rules flag a wrong cell; irregular tables are left to the evidence", () => {
    const cells = { ...koreanParadigmCells("가다", "regular")!, "haeyo:pas": "가었어요" };
    expect(errorsOf(koreanGroupRules, { lemma: "가다", group: "regular", cells })).toEqual(['가다: regular haeyo:pas must be "갔어요", got "가었어요"']);
    expect(errorsOf(koreanGroupRules, { lemma: "듣다", group: "irregular", cells: { inf: "듣다", "haeyo:pre": "들어요" } })).toEqual([]);
  });
});

describe("paradigm validation with the declared cells", () => {
  test("a ja table is evidence-checked: the dictionary and polite forms by kaikki tags, other cells only by their own atom", () => {
    const plugin = buildPlugin("ja");
    const cells = japaneseParadigmCells("食べる", "ichidan")!;
    const table = { lemma: "食べる", group: "ichidan", cells, evidence: { source: "kaikki-en" } };
    const evidence = [{ lemma: "食べる", rows: [{ mot: "食べる", infoVer: "inf" }, { mot: "食べます", infoVer: "formal" }] }];
    const result = validateParadigmsData({
      paradigms: { language: "ja", tables: [table] } as never,
      plugin,
      evidence,
      registryIds: new Set(["kaikki-en"]),
    });
    expect(result.errors.some((e) => e.includes("plain:nonpast:aff"))).toBe(false);
    expect(result.errors.some((e) => e.includes("polite:nonpast:aff"))).toBe(false);
    expect(result.errors.some((e) => e.includes('cell te = "食べて" is not evidenced'))).toBe(true);
  });

  test("P4c: the committed ja morphology tags the nine cells, so real tables validate (and a wrong cell still fails)", () => {
    const plugin = buildPlugin("ja");
    const evidence = plugin.paradigm!.loadEvidence()!;
    const check = (lemma: string, group: "ichidan" | "godan" | "irregular", cells = japaneseParadigmCells(lemma, group)!) =>
      validateParadigmsData({
        paradigms: { version: 1, language: "ja", tables: [{ lemma, gloss: { vi: "x", en: "x" }, group, cells, evidence: { source: "kaikki-en" } }] } as never,
        plugin,
        evidence,
        registryIds: new Set(["kaikki-en"]),
      }).errors;
    expect(check("食べる", "ichidan")).toEqual([]);
    expect(check("書く", "godan")).toEqual([]);
    expect(check("行く", "godan")).toEqual([]);
    expect(check("来る", "irregular")).toEqual([]); // four cells composed from stated rows, and marked so
    expect(check("勉強する", "irregular")).toEqual([]);
    expect(check("食べる", "ichidan", { ...japaneseParadigmCells("食べる", "ichidan")!, te: "食べって" }).join()).toContain("is not evidenced");
    const nine = evidence.filter((v) => new Set(v.rows.map((r) => r.infoVer.split(",")[0])).size >= 10).length; // inf + 9 cells
    expect(nine).toBeGreaterThanOrEqual(140);
  });

  test("P4e: ko 해요체 cells are read from the verb's own kaikki rows; the future is composed from the stated modifier", () => {
    const rows = [
      { mot: "가다", infoVer: "inf" },
      { mot: "가", infoVer: "inf" },
      { mot: "가", infoVer: "informal" },
      { mot: "가요", infoVer: "informal" },
      { mot: "갔어요", infoVer: "informal" },
      { mot: "가세요", infoVer: "informal" },
      { mot: "가셔요", infoVer: "informal" },
      { mot: "갈", infoVer: "formal" },
      { mot: "가실", infoVer: "formal" },
    ];
    const tagged = tagKoreanCells(rows).slice(rows.length);
    expect(tagged).toEqual([
      { mot: "가요", infoVer: "haeyo:pre" },
      { mot: "갔어요", infoVer: "haeyo:pas" },
      { mot: "가세요", infoVer: "hon:pre" },
      { mot: "갈 거예요", infoVer: "haeyo:fut,composed" },
    ]);
    // The honorific 가셔요 is informal and ends in 요, but 가셔 is no infinitive row: it is never the present.
    expect(tagged.some((r) => r.mot === "가셔요")).toBe(false);
    // A table without the honorific row tags no hon:pre.
    expect(tagKoreanCells(rows.filter((r) => r.mot !== "가세요")).some((r) => r.infoVer === "hon:pre")).toBe(false);
  });

  test("P4e: the committed ko morphology validates real tables (regular, 하다, an irregular), and a wrong cell fails", () => {
    const plugin = buildPlugin("ko");
    const evidence = plugin.paradigm!.loadEvidence()!;
    const check = (lemma: string, group: "regular" | "hada" | "irregular", cells: Record<string, string>) =>
      validateParadigmsData({
        paradigms: { version: 1, language: "ko", tables: [{ lemma, gloss: { vi: "x", en: "x" }, group, cells, evidence: { source: "kaikki-en" } }] } as never,
        plugin,
        evidence,
        registryIds: new Set(["kaikki-en"]),
      }).errors;
    expect(check("가다", "regular", koreanParadigmCells("가다", "regular")!)).toEqual([]);
    expect(check("살다", "regular", koreanParadigmCells("살다", "regular")!)).toEqual([]);
    expect(check("하다", "hada", koreanParadigmCells("하다", "hada")!)).toEqual([]);
    // 걷다's page merges 걷다 (walk, ㄷ-irregular) and 걷다 (roll up): both futures are composed.
    expect(check("걷다", "irregular", { inf: "걷다", "haeyo:pre": "걸어요", "haeyo:pas": "걸었어요", "haeyo:fut": "걸을 거예요", "hon:pre": "걸으세요" })).toEqual([]);
    expect(check("모르다", "irregular", { inf: "모르다", "haeyo:pre": "몰라요", "haeyo:pas": "몰랐어요", "haeyo:fut": "모를 거예요", "hon:pre": "모르세요" })).toEqual([]);
    expect(check("모르다", "irregular", { inf: "모르다", "haeyo:pre": "모르어요", "haeyo:pas": "몰랐어요", "haeyo:fut": "모를 거예요", "hon:pre": "모르세요" }).join()).toContain(
      'cell haeyo:pre = "모르어요" is not evidenced'
    );
    // 먹다's honorific is 드세요, which its kaikki table does not state: no complete table.
    expect(check("먹다", "regular", koreanParadigmCells("먹다", "regular")!).join()).toContain("hon:pre");
  });
});

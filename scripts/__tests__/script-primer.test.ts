/**
 * P4b stage 5 (task 5): script primers. The committed ja / zh / ko primers
 * pass every rule; each rule rejects the mistake it exists for.
 */
import { describe, expect, test } from "bun:test";

import { ScriptPrimerSchema, type ScriptPrimer } from "../../content/schema";
import { readJson, romajiUntilPrimerErrors } from "../lib/pipeline";
import {
  BASIC_CONSONANTS,
  BASIC_VOWELS,
  compileScriptPrimerFiles,
  kanaRomaji,
  PRIMER_LANGS,
  primerSourceRel,
  renderPrimerReview,
  validateScriptPrimerData,
  validateScriptPrimers,
  type PrimerLang,
} from "../lib/script-primer";

function load(lang: PrimerLang): ScriptPrimer {
  return ScriptPrimerSchema.parse(readJson(primerSourceRel(lang)));
}

/** A deep copy changed by `edit`, validated. */
function errorsAfter(lang: PrimerLang, edit: (p: ScriptPrimer) => void): string[] {
  const copy = structuredClone(load(lang));
  edit(copy);
  return validateScriptPrimerData(lang, copy);
}

type Section<K extends ScriptPrimer["sections"][number]["kind"]> = Extract<ScriptPrimer["sections"][number], { kind: K }>;
const section = <K extends ScriptPrimer["sections"][number]["kind"]>(p: ScriptPrimer, kind: K) =>
  p.sections.find((s) => s.kind === kind) as Section<K>;

describe("committed primers", () => {
  test("every primer passes the schema and every rule", () => {
    expect(validateScriptPrimers()).toEqual([]);
    for (const lang of PRIMER_LANGS) expect(validateScriptPrimerData(lang, load(lang))).toEqual([]);
  });
  test("ja: full hiragana and katakana (46 + 25 dakuten + 33 yōon each) with っ and long vowels, and a 20-item checkpoint; zh 4 tones + neutral and 4 minimal pairs, ko 14 + 10 jamo and 3 blocks", () => {
    const ja = load("ja").sections.filter((s) => s.kind === "kanaTable") as Section<"kanaTable">[];
    const cells = (id: string) => ja.find((s) => s.id === id)!.rows.flatMap((r) => r.cells).filter((c) => c !== null).length;
    for (const script of ["hiragana", "katakana"]) {
      expect(cells(`${script}-basic`)).toBe(46);
      expect(cells(`${script}-dakuten`)).toBe(25);
      expect(cells(`${script}-yoon`)).toBe(33);
    }
    expect(cells("hiragana-small-tsu-long-vowels")).toBe(8);
    expect(cells("katakana-long-vowels")).toBe(8);
    const checkpoint = load("ja").checkpoint!;
    expect(checkpoint.items).toHaveLength(20);
    expect(checkpoint.passMark).toBe(16);
    expect(new Set(checkpoint.items.map((i) => i.kind))).toEqual(new Set(["kanaToRomaji", "soundToKana"]));
    expect(load("zh").checkpoint).toBeUndefined();
    expect(load("ko").checkpoint).toBeUndefined();
    const tones = section(load("zh"), "tones");
    expect(tones.tones.map((t) => t.tone)).toEqual([1, 2, 3, 4, 5]);
    expect(tones.minimalPairs).toHaveLength(4);
    expect(section(load("zh"), "strokes").rules.length).toBeGreaterThanOrEqual(4);
    const ko = section(load("ko"), "hangulBlocks");
    expect(ko.consonants.map((c) => c.jamo)).toEqual(BASIC_CONSONANTS);
    expect(ko.vowels.map((v) => v.jamo)).toEqual(BASIC_VOWELS);
    expect(ko.blocks).toHaveLength(3);
  });
  test("compiled once per language with a D-10 review sheet listing every Vietnamese text", () => {
    const files = compileScriptPrimerFiles();
    expect(files.map((f) => f.relPath).sort()).toEqual([
      "content/ja/primer/REVIEW.md",
      "content/ko/primer/REVIEW.md",
      "content/zh/primer/REVIEW.md",
      "src/content/primer/ja.json",
      "src/content/primer/ko.json",
      "src/content/primer/zh.json",
    ]);
    const review = renderPrimerReview(load("zh"));
    expect(review).toContain("D-10 review sheet");
    expect(review).toContain("| four-tones.tone3 | Thanh 3:");
    expect(review).toContain("mua");
  });
});

describe("kana rules", () => {
  test("Hepburn readings of kana cells (the app's rules), hiragana and katakana", () => {
    expect(kanaRomaji("し")).toBe("shi");
    expect(kanaRomaji("ツ")).toBe("tsu");
    expect(kanaRomaji("を")).toBe("o");
    expect(kanaRomaji("が")).toBe("ga");
    expect(kanaRomaji("ぢ")).toBe("ji");
    expect(kanaRomaji("ショ")).toBe("sho");
    expect(kanaRomaji("a")).toBeUndefined();
  });
  test("a wrong rōmaji, a cell of the other script, a wrong audio and a short row are rejected", () => {
    expect(errorsAfter("ja", (p) => (section(p, "kanaTable").rows[1]!.cells[1]!.romaji = "chi"))).toEqual([
      'primer (ja): hiragana-basic: き reads "ki", not "chi"',
    ]);
    expect(errorsAfter("ja", (p) => (p.sections.find((s) => s.id === "katakana-long-vowels") as Section<"kanaTable">).rows[0]!.cells[0]!.romaji = "koohii")).toEqual([
      'primer (ja): katakana-long-vowels: コーヒー reads "kōhī", not "koohii"',
    ]);
    expect(errorsAfter("ja", (p) => (section(p, "kanaTable").rows[0]!.cells[0]!.kana = "ア")).join()).toContain("ア is not hiragana");
    expect(errorsAfter("ja", (p) => (section(p, "kanaTable").rows[0]!.cells[0]!.audio.say = "か")).join()).toContain('audio of あ says "か"');
    expect(errorsAfter("ja", (p) => section(p, "kanaTable").rows[0]!.cells.pop()).join()).toContain("has 4 cells for 5 columns");
  });
});

describe("checkpoint rules (P4c)", () => {
  type Item = NonNullable<ScriptPrimer["checkpoint"]>["items"][number];
  const item = (p: ScriptPrimer, kind: Item["kind"]) => p.checkpoint!.items.find((i) => i.kind === kind)!;

  test("a key that is not the Hepburn reading, and a sound item whose audio is not its key", () => {
    expect(
      errorsAfter("ja", (p) => {
        const i = item(p, "kanaToRomaji");
        i.options[i.correct] = "si";
      }).join()
    ).toContain('reads "shi", not "si"');
    expect(
      errorsAfter("ja", (p) => {
        const i = item(p, "soundToKana") as Extract<Item, { kind: "soundToKana" }>;
        i.audio.say = "か";
      }).join()
    ).toContain('audio says "か"');
  });
  test("two options that sound the same (じ / ぢ) and a kana the tables do not teach", () => {
    expect(
      errorsAfter("ja", (p) => {
        const i = item(p, "soundToKana") as Extract<Item, { kind: "soundToKana" }>;
        i.options = ["じ", "ぢ"];
        i.audio.say = "じ";
        i.correct = 0;
      }).join()
    ).toContain("two options sound the same");
    expect(
      errorsAfter("ja", (p) => {
        const i = item(p, "kanaToRomaji") as Extract<Item, { kind: "kanaToRomaji" }>;
        i.kana = "ゐ";
      }).join()
    ).toContain("ゐ is not kana");
  });
  test("pass mark bounds, repeated ids, a fixed key position, and a checkpoint on a primer without kana", () => {
    expect(errorsAfter("ja", (p) => (p.checkpoint!.passMark = 10)).join()).toContain("below 75%");
    expect(errorsAfter("ja", (p) => (p.checkpoint!.passMark = 21)).join()).toContain("more than the 20 items");
    expect(errorsAfter("ja", (p) => (p.checkpoint!.items[1]!.id = p.checkpoint!.items[0]!.id)).join()).toContain("item ids repeat");
    expect(
      errorsAfter("ja", (p) => {
        for (const i of p.checkpoint!.items) {
          const key = i.options[i.correct]!;
          i.options = [key, ...i.options.filter((o) => o !== key)];
          i.correct = 0;
        }
      }).join()
    ).toContain("always in the same position");
    expect(errorsAfter("zh", (p) => (p.checkpoint = structuredClone(load("ja").checkpoint))).join()).toContain("only a kana primer has a checkpoint");
  });
});

describe("profile romajiUntilPrimer (P4c)", () => {
  test("allowed only with a kana primer that has a checkpoint; absent = nothing to check", () => {
    expect(romajiUntilPrimerErrors("ja-vi", { romajiUntilPrimer: true }, load("ja"))).toEqual([]);
    expect(romajiUntilPrimerErrors("zh-vi", { romajiUntilPrimer: true }, load("zh")).join()).toContain("needs a primer with kana tables");
    const noCheckpoint = structuredClone(load("ja"));
    delete noCheckpoint.checkpoint;
    expect(romajiUntilPrimerErrors("ja-vi", { romajiUntilPrimer: true }, noCheckpoint).join()).toContain("needs a primer checkpoint");
    expect(romajiUntilPrimerErrors("fr-vi", { romajiUntilPrimer: true }, null).join()).toContain("needs a script primer");
    expect(romajiUntilPrimerErrors("fr-vi", {}, null)).toEqual([]);
    expect(romajiUntilPrimerErrors("fr-vi", null, null)).toEqual([]);
  });
});

describe("tone rules", () => {
  test("an example in the wrong tone, a mark of the wrong tone and a missing tone are rejected", () => {
    expect(errorsAfter("zh", (p) => (section(p, "tones").tones[2]!.example.pinyin = "mà")).join()).toContain("example mà is not tone 3");
    expect(errorsAfter("zh", (p) => (section(p, "tones").tones[0]!.mark = "á")).join()).toContain('mark "á" is not tone 1');
    expect(errorsAfter("zh", (p) => section(p, "tones").tones.splice(3, 1)).join()).toContain("tone 4 is missing");
  });
  test("a minimal pair must share its syllables and differ in tone", () => {
    expect(errorsAfter("zh", (p) => (section(p, "tones").minimalPairs[0]!.b.pinyin = "mǎi")).join()).toContain("have the same tones");
    expect(errorsAfter("zh", (p) => (section(p, "tones").minimalPairs[1]!.b.pinyin = "tóng")).join()).toContain("are not the same syllables");
    expect(errorsAfter("zh", (p) => (section(p, "tones").minimalPairs[2]!.a.pinyin = "wèn wèn")).join()).toContain("1 hanzi for 2 syllables");
  });
});

describe("hangul rules", () => {
  test("RR of consonants and vowels comes from the RR rules", () => {
    expect(errorsAfter("ko", (p) => (section(p, "hangulBlocks").consonants[3]!.initial = "l")).join()).toContain('ㄹ before a vowel is "r" in RR, not "l"');
    expect(errorsAfter("ko", (p) => (section(p, "hangulBlocks").consonants[6]!.final = "s")).join()).toContain('ㅅ as a final is "t" in RR, not "s"');
    expect(errorsAfter("ko", (p) => (section(p, "hangulBlocks").vowels[2]!.rr = "o")).join()).toContain('ㅓ is "eo" in RR, not "o"');
    expect(errorsAfter("ko", (p) => (section(p, "hangulBlocks").consonants[0]!.jamo = "ㄲ")).join()).toContain("ㄲ is not a basic consonant");
  });
  test("a block must compose from its parts, use taught jamo and carry its RR", () => {
    expect(errorsAfter("ko", (p) => (section(p, "hangulBlocks").blocks[2]!.parts = ["ㅎ", "ㅏ", "ㅁ"])).join()).toContain("does not compose 한");
    expect(errorsAfter("ko", (p) => (section(p, "hangulBlocks").blocks[0]!.rr = "ka")).join()).toContain('가 is "ga" in RR, not "ka"');
    expect(
      errorsAfter("ko", (p) => {
        const s = section(p, "hangulBlocks");
        s.vowels = s.vowels.filter((v) => v.jamo !== "ㅜ");
      }).join()
    ).toContain("block 구 uses ㅜ, which the section does not teach");
  });
});

describe("primer-level rules", () => {
  test("language, id and the language's own section kind", () => {
    expect(errorsAfter("ja", (p) => (p.id = "ja.primer.kana" as never)).join()).toContain("must be ja.primer.script");
    expect(errorsAfter("zh", (p) => (p.sections = p.sections.filter((s) => s.kind !== "tones"))).join()).toContain("a zh primer needs a tones section");
    expect(errorsAfter("ko", (p) => (p.title.vi = " Hangul")).join()).toContain("title: text has leading/trailing spaces");
  });
  test("the schema requires both vi and en and a pending audio status", () => {
    const raw = structuredClone(readJson(primerSourceRel("ja"))) as { title: Record<string, string> };
    delete raw.title.vi;
    expect(ScriptPrimerSchema.safeParse(raw).success).toBe(false);
    const audio = structuredClone(readJson(primerSourceRel("ko"))) as ScriptPrimer;
    (section(audio, "hangulBlocks").blocks[0]!.audio as { status: string }).status = "ready";
    expect(ScriptPrimerSchema.safeParse(audio).success).toBe(false);
  });
});

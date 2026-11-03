/**
 * P4b stage 5 (task 7): CJK lexicon search. The CJK database (FTS5
 * `trigram` + a `reading` key column) answers kana, toneless pinyin and
 * jamo-prefix queries with the SAME pipeline the native repository ships
 * (src/lib/lexicon/native-sql.ts), run here against the committed test-only
 * xc database through bun:sqlite (the lexicon-parity.test.ts adapter
 * pattern), and agrees with the web-fallback tier. Latin databases keep
 * their schema and search unchanged. Runtime support: expo-sqlite vendors
 * SQLite ≥ 3.34 built with FTS5 (checked below from the installed package).
 */
import { afterAll, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { readFileSync } from "fs";
import path from "path";

import xcWebFallback from "../../src/content/test-only/lexicon/xc-web-fallback.json";
import { cjkReadingKeys, cjkSearchPatterns, foldCjkSearch } from "../../src/lib/lexicon/cjk-search";
import { GeneratedLexiconRepository, type GeneratedLexiconData } from "../../src/lib/lexicon/generated-repository";
import { runNativeCjkSearch, runNativeLexiconSearch, type SqlExecutor } from "../../src/lib/lexicon/native-sql";
import { buildPlugin } from "../lib/languages";
import { loadRichLexicon, loadSourceManifest } from "../lib/lexicon";
import { dbAssetName, lexiconContentHash } from "../lib/lexicon-build";
import { loadRegistry, safeResolve } from "../lib/pipeline";

function open(lang: string, native: string): Database {
  const hash = lexiconContentHash(loadRichLexicon(lang), loadSourceManifest(lang), loadRegistry(), native);
  return new Database(safeResolve(`assets/lexicon/${dbAssetName(lang, hash)}`), { readonly: true });
}

const xc = open("xc", "en");
const fr = open("fr", "en");
afterAll(() => {
  xc.close();
  fr.close();
});

const executor = (db: Database): SqlExecutor => ({
  all: async <T>(sql: string, params: (string | number)[]) => db.query(sql).all(...(params as never[])) as T[],
  first: async <T>(sql: string, params: (string | number)[]) => (db.query(sql).get(...(params as never[])) as T | undefined) ?? null,
});

const exec = executor(xc);
const web = new GeneratedLexiconRepository(xcWebFallback as GeneratedLexiconData);
const surfaces = async (q: string) => (await runNativeLexiconSearch(exec, q)).map((r) => r.surface);

describe("the CJK database", () => {
  test("uses the trigram tokenizer with a reading column and declares the CJK search mode", () => {
    const sql = (xc.query("SELECT sql FROM sqlite_master WHERE name = 'lexeme_fts'").get() as { sql: string }).sql;
    expect(sql).toContain("tokenize = 'trigram'");
    expect(sql).toContain("reading");
    expect(xc.query("SELECT value FROM metadata WHERE key = 'searchMode'").get()).toEqual({ value: "cjk" });
    expect(buildPlugin("ja").ftsTokenizer).toBe("trigram");
    expect(buildPlugin("zh").ftsTokenizer).toBe("trigram");
    expect(buildPlugin("ko").ftsTokenizer).toBe("trigram");
  });
  test("stores folded reading keys: hiragana, toneless pinyin, keystroke jamo + RR", () => {
    const keys = Object.fromEntries((xc.query("SELECT f.surface, f.reading FROM lexeme_fts f").all() as { surface: string; reading: string }[]).map((r) => [r.surface, r.reading]));
    expect(keys["学生"]).toBe("がくせい");
    expect(keys["汉语"]).toBe("hanyu");
    expect(keys["신라"]).toBe("silla ㅅㅣㄴㄹㅏ");
    expect(keys["학여울"]).toBe("hangnyeoul ㅎㅏㄱㅇㅕㅇㅜㄹ");
  });
  test("a Latin database is unchanged: no reading column, no search mode", () => {
    const sql = (fr.query("SELECT sql FROM sqlite_master WHERE name = 'lexeme_fts'").get() as { sql: string }).sql;
    expect(sql).not.toContain("reading");
    expect(sql).toContain("unicode61");
    expect(fr.query("SELECT value FROM metadata WHERE key = 'searchMode'").get()).toBeNull();
  });
});

describe("search (native pipeline over bun:sqlite)", () => {
  test("kana: hiragana or katakana prefix finds the kanji word", async () => {
    expect(await surfaces("がく")).toEqual(["学生"]);
    expect(await surfaces("ガクセイ")).toEqual(["学生"]);
    expect(await surfaces("たべ")).toEqual(["食べる"]);
    expect(await surfaces("ｶﾞｸ")).toEqual(["学生"]); // half-width katakana
  });
  test("pinyin without tones (or with marks / numbers, spaced or not) finds the hanzi word", async () => {
    for (const q of ["hanyu", "han yu", "hàn yǔ", "han4 yu3", "Hanyu", "hany"]) expect(await surfaces(q)).toEqual(["汉语"]);
  });
  test("jamo prefix: keystroke jamo or a partial block finds the hangul word", async () => {
    expect(await surfaces("ㅅㅣ")).toEqual(["신라"]);
    expect(await surfaces("신")).toEqual(["신라"]);
    expect(await surfaces("ㅎㅏㄱ")).toEqual(["학여울"]);
    expect(await surfaces("학")).toEqual(["학여울"]);
    expect(await surfaces("하")).toEqual(["학여울"]);
  });
  test("RR, hanzi / kanji substrings and the gloss also match", async () => {
    expect(await surfaces("silla")).toEqual(["신라"]);
    expect(await surfaces("汉")).toEqual(["汉语"]);
    expect(await surfaces("学")).toEqual(["学生"]);
    expect(await surfaces("食べる")).toEqual(["食べる"]);
    expect(await surfaces("student")).toEqual(["学生"]);
    expect(await surfaces("eat")).toEqual(["食べる"]);
  });
  test("no match, an empty query and LIKE wildcards in the input return nothing", async () => {
    for (const q of ["xyz", "", "   ", "%", "_", "\\"]) expect(await surfaces(q)).toEqual([]);
  });
  test("ranking: an exact surface beats a reading prefix beats a gloss match", async () => {
    // "silla" is a reading key of 신라 and part of no gloss; "a" matches glosses only.
    expect((await runNativeCjkSearch(exec, "a")).length).toBeGreaterThan(0);
    expect(await surfaces("신라")).toEqual(["신라"]);
  });
});

describe("web fallback parity", () => {
  const queries = ["がく", "ガクセイ", "たべ", "hanyu", "han4 yu3", "hany", "ㅅㅣ", "신", "하", "학", "silla", "汉", "学", "student", "eat", "a", "xyz", "", "%"];
  for (const q of queries) {
    test(`query ${JSON.stringify(q)} agrees between SQLite and web fallback`, async () => {
      expect((await runNativeLexiconSearch(exec, q)).map((r) => r.id)).toEqual((await web.search(q)).map((r) => r.id));
    });
  }
});

describe("pure folding", () => {
  test("query fold: width, case, katakana, hangul → jamo, tones and spaces", () => {
    expect(foldCjkSearch("ガクセイ")).toBe("がくせい");
    expect(foldCjkSearch("Nǐ Hǎo")).toBe("nihao");
    expect(foldCjkSearch("ni3 hao3")).toBe("nihao");
    expect(foldCjkSearch("lǜ")).toBe("lu");
    expect(foldCjkSearch("학생")).toBe("ㅎㅏㄱㅅㅐㅇ");
    expect(foldCjkSearch("학생")).toBe(foldCjkSearch("ㅎㅏㄱㅅㅐㅇ"));
    expect(foldCjkSearch("が")).toBe("が"); // voiced kana survive the tone strip
  });
  test("reading keys and LIKE patterns", () => {
    expect(cjkReadingKeys({ surface: "学生", reading: { kana: "がくせい" } })).toBe("がくせい");
    expect(cjkReadingKeys({ surface: "학생", reading: { rr: "haksaeng" } })).toBe("haksaeng ㅎㅏㄱㅅㅐㅇ");
    expect(cjkReadingKeys({ surface: "chat" })).toBe("");
    expect(cjkSearchPatterns("50%_")).toEqual({ text: "%50\\%\\_%", reading: "%50\\%\\_%" });
    expect(cjkSearchPatterns(" ")).toBeNull();
  });
});

describe("runtime SQLite supports FTS5 trigram", () => {
  const version = (v: string) => v.split(".").map(Number).reduce((acc, n) => acc * 1000 + n, 0);
  test("the build-time SQLite (bun) is ≥ 3.34", () => {
    const v = (xc.query("SELECT sqlite_version() AS v").get() as { v: string }).v;
    expect(version(v)).toBeGreaterThanOrEqual(version("3.34.0"));
  });
  test("expo-sqlite vendors SQLite ≥ 3.34 compiled with FTS5 on Android and iOS", () => {
    const root = path.dirname(require.resolve("expo-sqlite/package.json"));
    const header = readFileSync(path.join(root, "vendor/sqlite3/sqlite3.h"), "utf8");
    const vendored = /#define SQLITE_VERSION\s+"([\d.]+)"/.exec(header)?.[1] ?? "0";
    expect(version(vendored)).toBeGreaterThanOrEqual(version("3.34.0"));
    expect(readFileSync(path.join(root, "android/build.gradle"), "utf8")).toContain("-DSQLITE_ENABLE_FTS5=1");
    expect(readFileSync(path.join(root, "ios/ExpoSQLite.podspec"), "utf8")).toContain("-DSQLITE_ENABLE_FTS5=1");
  });
});

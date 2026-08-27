/**
 * Native/web repository parity (Phase 4 §96): the EXACT query pipelines the
 * native repository ships (src/lib/lexicon/native-sql.ts) run here against
 * the committed SQLite asset via bun:sqlite, and their results must agree
 * with the GeneratedLexiconRepository over the compiled web fallback.
 * Implementations differ internally; answers must not.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";

import frWebFallback from "../../src/content/lexicon/fr-web-fallback.json";
import {
  GeneratedLexiconRepository,
  type GeneratedLexiconData,
} from "../../src/lib/lexicon/generated-repository";
import {
  SQL,
  runNativeGetById,
  runNativeList,
  runNativeSearch,
  type SqlExecutor,
} from "../../src/lib/lexicon/native-sql";
import { loadRichLexicon, loadSourceManifest } from "../lib/lexicon";
import { dbAssetName, lexiconContentHash } from "../lib/lexicon-build";
import { loadRegistry, safeResolve } from "../lib/pipeline";

const contentHash = lexiconContentHash(loadRichLexicon(), loadSourceManifest(), loadRegistry());
const db = new Database(safeResolve(`assets/lexicon/${dbAssetName(contentHash)}`), {
  readonly: true,
});
afterAll(() => db.close());

/** bun:sqlite executor implementing the same contract expo-sqlite provides. */
const exec: SqlExecutor = {
  all: async <T>(sql: string, params: (string | number)[]) =>
    db.query(sql).all(...(params as never[])) as T[],
  first: async <T>(sql: string, params: (string | number)[]) =>
    (db.query(sql).get(...(params as never[])) as T | undefined) ?? null,
};

const web = new GeneratedLexiconRepository(frWebFallback as GeneratedLexiconData);

const GOLDEN_QUERIES = [
  "femme",
  "gar",
  "garçon",
  "garcon",
  "oeuf",
  "œuf",
  "café",
  "cafe",
  "the",
  "eau",
  "s'il vous plaît",
  "plait",
  "chien",
  "egg",
  "good",
  "le",
  "bon",
  "a",
  "xyz",
  "",
  "   ",
];

describe("search parity", () => {
  for (const q of GOLDEN_QUERIES) {
    test(`query ${JSON.stringify(q)} agrees between SQLite and web fallback`, async () => {
      const nativeIds = (await runNativeSearch(exec, q)).map((r) => r.id);
      const webIds = (await web.search(q)).map((r) => r.id);
      expect(nativeIds).toEqual(webIds);
    });
  }

  test("a representative query returns identical full summaries", async () => {
    expect(await runNativeSearch(exec, "chat")).toEqual(await web.search("chat"));
  });
});

describe("list parity", () => {
  test("course order agrees", async () => {
    expect(await runNativeList(exec)).toEqual(await web.list());
  });

  test("alphabetical order agrees", async () => {
    const nativeIds = (await runNativeList(exec, { sort: "alpha" })).map((r) => r.id);
    const webIds = (await web.list({ sort: "alpha" })).map((r) => r.id);
    expect(nativeIds).toEqual(webIds);
  });

  test("pos filters agree", async () => {
    for (const pos of ["noun", "verb", "expression", "interjection", "adverb"]) {
      expect(await runNativeList(exec, { pos })).toEqual(await web.list({ pos }));
    }
  });

  test("frequency sort agrees over the real activated measurements (§19)", async () => {
    const native = await runNativeList(exec, { sort: "frequency" });
    expect(native).toEqual(await web.list({ sort: "frequency" }));
    // Sanity against the real data: raw per-million descending — the Unit B
    // anchor verbs lead (être 35040.2/M, avoir 13032.0, aller 9795.9,
    // faire 9061.7), and rank-less merci (ONO) is still placed by its raw
    // frequency, not sunk.
    const ids = native.map((r: { id: string }) => r.id);
    expect(ids.slice(0, 4)).toEqual(["fr:w:etre", "fr:w:avoir", "fr:w:aller", "fr:w:faire"]);
    expect(ids.indexOf("fr:w:merci")).toBeLessThan(ids.indexOf("fr:w:femme"));
  });
});

describe("detail parity", () => {
  test("getById agrees field-for-field on representative entries", async () => {
    for (const id of ["fr:w:homme", "fr:w:oeuf", "fr:w:s-il-vous-plait", "fr:w:gauche", "fr:w:manger"]) {
      expect(await runNativeGetById(exec, id)).toEqual(await web.getById(id));
    }
  });

  test("unknown ids agree (null)", async () => {
    expect(await runNativeGetById(exec, "fr:w:ghost")).toBeNull();
    expect(await web.getById("fr:w:ghost")).toBeNull();
  });

  test("examples agree", async () => {
    const nativeExamples = await exec.all(SQL.examples, ["fr:w:poule"]);
    expect(nativeExamples).toEqual(await web.getExamples("fr:w:poule"));
  });

  test("frequency-sort support agrees (both true with activated data)", async () => {
    const row = await exec.first<{ n: number }>(SQL.anyFrequency, []);
    expect((row?.n ?? 0) > 0).toBe(true);
    expect(await web.supportsFrequencySort()).toBe(true);
  });
});

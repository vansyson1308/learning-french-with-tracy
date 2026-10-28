/**
 * v6 → v7 migration (P4a): `readingAid` arrives as an empty map (every
 * course on its default, ON) for every existing learner; valid entries
 * already present (re-import of a v7 backup) are kept, junk dropped;
 * nothing else changes; idempotent; backups carry the setting (and the
 * daily-words setting, which exports skipped before) through a round trip.
 */
import { afterEach, describe, expect, test } from "bun:test";

import { createEnvelope, runInvariants, stageImport } from "../persistence/backup-core";
import { learnerDataFromBlob } from "../persistence/learner";
import { __setMigrationFailureForTests, migrateProgress, PERSIST_VERSION } from "../persistence/migrations";
import { normalizeReadingAid, readingAidOn, readingFor, readingMap } from "../learning/reading-aid";
import v6Fixture from "../__fixtures__/progress/v6-reading-aid.json";

const NOW = new Date(Date.UTC(2026, 9, 27, 12));
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const v6 = () => clone(v6Fixture.state) as Parameters<typeof migrateProgress>[0] & Record<string, unknown>;

afterEach(() => __setMigrationFailureForTests(null));

describe("v6 → v7: reading aid setting", () => {
  test("PERSIST_VERSION is 9 (v9: German re-key)", () => {
    expect(PERSIST_VERSION).toBe(9);
  });

  test("an existing learner gets an empty map; nothing else changes", () => {
    const before = v6();
    const out = migrateProgress(v6(), 6, NOW);
    expect(out.readingAid).toEqual({});
    expect(readingAidOn(out.readingAid, "ja-en")).toBe(true);
    const { readingAid: _r, ...rest } = out;
    expect(JSON.stringify(rest)).toBe(JSON.stringify(before));
  });

  test("valid entries are kept, junk dropped", () => {
    const out = migrateProgress({ ...v6(), readingAid: { "ja-en": false, "zh-en": "yes", "": true } }, 6, NOW);
    expect(out.readingAid).toEqual({ "ja-en": false });
    expect(migrateProgress({ ...v6(), readingAid: ["x"] }, 6, NOW).readingAid).toEqual({});
  });

  test("idempotent, and the whole chain from v0-era data reaches v7", () => {
    const once = migrateProgress(v6(), 6, NOW);
    expect(migrateProgress(clone(once), 6, NOW)).toEqual(once);
    expect(migrateProgress(v6(), 3, NOW).readingAid).toEqual({});
  });

  test("the failure seam propagates", () => {
    __setMigrationFailureForTests(7);
    expect(() => migrateProgress(v6(), 6, NOW)).toThrow();
  });

  test("backup invariants reject a malformed map", () => {
    const state = migrateProgress(v6(), 6, NOW);
    const problems = (s: unknown) => runInvariants(s as never, NOW).join("|");
    expect(problems(state)).not.toContain("reading aid");
    expect(problems({ ...state, readingAid: { "ja-en": 1 } })).toContain("invalid reading aid settings");
    expect(problems({ ...state, readingAid: [] })).toContain("invalid reading aid settings");
  });

  test("a v7 backup round-trips the reading aid and the daily-words setting", () => {
    const state = { ...migrateProgress(v6(), 6, NOW), readingAid: { "ja-en": false } };
    const raw = JSON.stringify(createEnvelope(state, learnerDataFromBlob(state), PERSIST_VERSION, NOW));
    const staged = stageImport(raw, NOW);
    expect(staged.ok).toBe(true);
    if (!staged.ok) return;
    expect(staged.state.readingAid).toEqual({ "ja-en": false });
    expect(staged.state.dailyNewWords).toBe(8);
  });
});

describe("reading aid helpers", () => {
  const words = [
    { target: "男の人", native: "the man", emoji: "👨", romanization: "otoko no hito" },
    { target: "犬", native: "dog", emoji: "🐕" },
  ];
  test("lookup is by exact surface; words without a romanization have none", () => {
    const map = readingMap(words);
    expect(readingFor(map, "男の人")).toBe("otoko no hito");
    expect(readingFor(map, " 男の人 ")).toBe("otoko no hito");
    expect(readingFor(map, "犬")).toBeUndefined();
    expect(readingFor(map, "あの ひとは 男の 人です。")).toBeUndefined();
  });
  test("default is on; the stored switch wins", () => {
    expect(readingAidOn(undefined, "ja-en")).toBe(true);
    expect(readingAidOn({ "ja-en": false }, "ja-en")).toBe(false);
    expect(readingAidOn({ "ja-en": false }, "zh-en")).toBe(true);
    expect(normalizeReadingAid(null)).toEqual({});
  });
});

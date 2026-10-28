/**
 * v8 → v9 migration (P3d(de)): German gains its id registry, so de-en
 * progress RC3 wrote by surface ("der Mann") is re-keyed to `de:w:` ids with
 * the same rules as v8 (curated id or reversible `de:legacy:` id; nothing
 * dropped; collisions merge; idempotent). Other courses are untouched by v9.
 */
import { afterEach, describe, expect, test } from "bun:test";

import { itemIdFor } from "../learning/ids";
import { createEnvelope, runInvariants, stageImport } from "../persistence/backup-core";
import { learnerDataFromBlob } from "../persistence/learner";
import { __setMigrationFailureForTests, migrateProgress, PERSIST_VERSION, type PersistedProgress } from "../persistence/migrations";
import rc3Fixture from "../__fixtures__/progress/v3-rc3-es-de.json";

const NOW = new Date(Date.UTC(2026, 9, 28, 12));
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const rc3 = () => clone(rc3Fixture.state) as unknown as PersistedProgress;

afterEach(() => __setMigrationFailureForTests(null));

describe("v8 → v9: German re-key", () => {
  test("PERSIST_VERSION is 9", () => {
    expect(PERSIST_VERSION).toBe(9);
  });

  test("RC3 de-en progress: every key becomes the id the runtime writes; counts are preserved", () => {
    const before = rc3().courses["de-en"];
    const out = migrateProgress(rc3(), 3, NOW).courses["de-en"];
    for (const surface of Object.keys(before.wordStats)) {
      const id = itemIdFor("de-en", surface);
      expect(id.startsWith("de:w:"), surface).toBe(true);
      expect(out.wordStats[id], surface).toEqual(before.wordStats[surface]);
      expect(out.srs?.[id], surface).toEqual(before.srs?.[surface]);
    }
    expect(Object.keys(out.wordStats).sort()).toEqual(["de:w:madchen", "de:w:mann"]);
    expect(Object.keys(out.srs ?? {})).toHaveLength(Object.keys(before.srs ?? {}).length);
    expect(out.xp).toBe(before.xp);
    expect(out.completedLessons).toEqual(before.completedLessons);
  });

  test("v9 touches only German: everything else equals the v8 state", () => {
    const v8 = migrateProgress(rc3(), 3, NOW, 8);
    const v9 = migrateProgress(rc3(), 3, NOW);
    const { "de-en": _de8, ...rest8 } = v8.courses;
    const { "de-en": _de9, ...rest9 } = v9.courses;
    expect(JSON.stringify(rest9)).toBe(JSON.stringify(rest8));
    expect({ ...v9, courses: undefined }).toEqual({ ...v8, courses: undefined });
  });

  test("an unknown German surface keeps a reversible legacy id; a surface next to its id merges", () => {
    const state = migrateProgress(rc3(), 3, NOW, 8);
    const de = state.courses["de-en"];
    de.wordStats["das Quatschwort | xy"] = { correct: 1, wrong: 0, lastSeen: 1790000000000 };
    de.wordStats["de:w:mann"] = { correct: 1, wrong: 1, lastSeen: 1790400000000 };
    const out = migrateProgress(state, 8, NOW).courses["de-en"];
    expect(out.wordStats[`de:legacy:${encodeURIComponent("das Quatschwort | xy")}`]).toEqual({ correct: 1, wrong: 0, lastSeen: 1790000000000 });
    expect(out.wordStats["de:w:mann"]).toEqual({ correct: 4, wrong: 1, lastSeen: 1790400000000 });
    expect(out.wordStats["der Mann"]).toBeUndefined();
  });

  test("idempotent; the failure seam propagates", () => {
    const once = migrateProgress(rc3(), 3, NOW);
    expect(migrateProgress(clone(once), 8, NOW)).toEqual(once);
    __setMigrationFailureForTests(9);
    expect(() => migrateProgress(rc3(), 3, NOW)).toThrow();
  });

  test("invariants hold and an RC3 backup imports re-keyed", () => {
    const state = migrateProgress(rc3(), 3, NOW);
    expect(runInvariants(state, NOW)).toEqual([]);
    const old = rc3();
    const staged = stageImport(JSON.stringify(createEnvelope(old, learnerDataFromBlob(old), 3, NOW)), NOW);
    expect(staged.ok).toBe(true);
    if (staged.ok) expect(Object.keys(staged.state.courses["de-en"].wordStats).sort()).toEqual(["de:w:madchen", "de:w:mann"]);
  });
});

/**
 * v5 → v6 migration (P3e): `dailyNewWords` arrives at the default (5) for
 * every existing learner, a valid value already present (re-import of a v6
 * backup) is kept, an invalid one is clamped; nothing else changes; the
 * step is idempotent; a v6 backup with an out-of-range value is rejected.
 */
import { afterEach, describe, expect, test } from "bun:test";

import { runInvariants } from "../persistence/backup-core";
import { __setMigrationFailureForTests, migrateProgress, PERSIST_VERSION } from "../persistence/migrations";
import v3Fixture from "../__fixtures__/progress/v3-assessed.json";

const NOW = new Date(Date.UTC(2026, 9, 22, 12));
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const v5 = () => migrateProgress(clone(v3Fixture.state), 3, NOW, 5);

afterEach(() => __setMigrationFailureForTests(null));

describe("v5 → v6: daily new words setting", () => {
  test("PERSIST_VERSION is 6", () => {
    expect(PERSIST_VERSION).toBe(6);
  });

  test("an existing learner starts at 5; nothing else changes", () => {
    const before = v5();
    const out = migrateProgress(v5(), 5, NOW);
    expect(before.dailyNewWords).toBeUndefined();
    expect(out.dailyNewWords).toBe(5);
    const { dailyNewWords: _d, ...rest } = out;
    expect(JSON.stringify(rest)).toBe(JSON.stringify(before));
  });

  test("a valid value is kept, an invalid one clamped", () => {
    expect(migrateProgress({ ...v5(), dailyNewWords: 12 }, 5, NOW).dailyNewWords).toBe(12);
    expect(migrateProgress({ ...v5(), dailyNewWords: 99 }, 5, NOW).dailyNewWords).toBe(15);
    expect(migrateProgress({ ...v5(), dailyNewWords: "x" }, 5, NOW).dailyNewWords).toBe(5);
  });

  test("idempotent", () => {
    const once = migrateProgress(v5(), 5, NOW);
    expect(migrateProgress(clone(once), 5, NOW)).toEqual(once);
  });

  test("the failure seam propagates", () => {
    __setMigrationFailureForTests(6);
    expect(() => migrateProgress(v5(), 5, NOW)).toThrow();
  });

  test("backup invariants accept 0–15 and reject anything else", () => {
    const state = migrateProgress(v5(), 5, NOW);
    const problems = (s: unknown) => runInvariants(s as never, NOW);
    expect(problems(state).join("|")).not.toContain("daily new words");
    expect(problems({ ...state, dailyNewWords: 16 }).join("|")).toContain("invalid daily new words");
    expect(problems({ ...state, dailyNewWords: 2.5 }).join("|")).toContain("invalid daily new words");
  });
});

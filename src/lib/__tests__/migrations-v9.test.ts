/**
 * v8 → v9 migration (P4c): `primerPassed` arrives — the per-course record that
 * the learner passed the script primer's checkpoint (courseId → true). Every
 * existing learner starts with an empty map (nobody has passed it: the
 * checkpoint did not exist), so a course whose profile says
 * `romajiUntilPrimer` shows its romaji line until the learner passes. Valid
 * entries already present (re-import of a v9 backup) are kept, junk dropped;
 * nothing else changes; idempotent; backups carry the record through a round
 * trip and the import invariants reject a malformed one.
 */
import { afterEach, describe, expect, test } from "bun:test";

import { createEnvelope, runInvariants, stageImport } from "../persistence/backup-core";
import { learnerDataFromBlob } from "../persistence/learner";
import { __setMigrationFailureForTests, migrateProgress, PERSIST_VERSION } from "../persistence/migrations";
import { normalizePrimerPassed, primerPassedFor } from "../learning/primer-progress";
import v8Fixture from "../__fixtures__/progress/v8-before-primer.json";
import v6Fixture from "../__fixtures__/progress/v6-reading-aid.json";

const NOW = new Date(Date.UTC(2026, 10, 3, 12));
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const v8 = () => clone(v8Fixture.state) as Parameters<typeof migrateProgress>[0] & Record<string, unknown>;

afterEach(() => __setMigrationFailureForTests(null));

describe("v8 → v9: script primer passed", () => {
  test("PERSIST_VERSION is 9 (v9: primerPassed)", () => {
    expect(PERSIST_VERSION).toBe(9);
  });

  test("an existing learner gets an empty map; nothing else changes", () => {
    const before = v8();
    const out = migrateProgress(v8(), 8, NOW);
    expect(out.primerPassed).toEqual({});
    expect(primerPassedFor(out.primerPassed, "ja-vi")).toBe(false);
    const { primerPassed: _p, ...rest } = out;
    expect(JSON.stringify(rest)).toBe(JSON.stringify(before));
  });

  test("valid entries are kept, junk dropped", () => {
    const out = migrateProgress({ ...v8(), primerPassed: { "ja-vi": true, "ja-en": "yes", "zh-vi": 1, "": true } }, 8, NOW);
    expect(out.primerPassed).toEqual({ "ja-vi": true });
    expect(migrateProgress({ ...v8(), primerPassed: ["ja-vi"] }, 8, NOW).primerPassed).toEqual({});
    // false is not a record of anything: only a pass is stored.
    expect(migrateProgress({ ...v8(), primerPassed: { "ja-vi": false } }, 8, NOW).primerPassed).toEqual({});
  });

  test("idempotent, and older data reaches v9 through the whole chain", () => {
    const once = migrateProgress(v8(), 8, NOW);
    expect(migrateProgress(clone(once), 8, NOW)).toEqual(once);
    const fromV6 = migrateProgress(clone(v6Fixture.state), 6, NOW);
    expect(fromV6.primerPassed).toEqual({});
    expect(fromV6.readingAid).toEqual({});
  });

  test("the failure seam propagates", () => {
    __setMigrationFailureForTests(9);
    expect(() => migrateProgress(v8(), 8, NOW)).toThrow();
  });

  test("backup invariants reject a malformed record", () => {
    const state = migrateProgress(v8(), 8, NOW);
    const problems = (s: unknown) => runInvariants(s as never, NOW).join("|");
    expect(problems(state)).not.toContain("primer");
    expect(problems({ ...state, primerPassed: { "ja-vi": false } })).toContain("invalid primer record");
    expect(problems({ ...state, primerPassed: { "ja-vi": "yes" } })).toContain("invalid primer record");
    expect(problems({ ...state, primerPassed: [] })).toContain("invalid primer record");
  });

  test("a v9 backup round-trips the primer record next to the reading aid", () => {
    const state = { ...migrateProgress(v8(), 8, NOW), primerPassed: { "ja-vi": true as const } };
    const raw = JSON.stringify(createEnvelope(state, learnerDataFromBlob(state), PERSIST_VERSION, NOW));
    const staged = stageImport(raw, NOW);
    expect(staged.ok).toBe(true);
    if (!staged.ok) return;
    expect(staged.state.primerPassed).toEqual({ "ja-vi": true });
    expect(staged.state.readingAid).toEqual({ "ja-en": false });
  });

  test("a v8 backup (before the checkpoint existed) imports with an empty record", () => {
    const state = v8();
    const raw = JSON.stringify(createEnvelope(state as never, learnerDataFromBlob(state as never), 8, NOW));
    const staged = stageImport(raw, NOW);
    expect(staged.ok).toBe(true);
    if (!staged.ok) return;
    expect(staged.state.primerPassed).toEqual({});
  });
});

describe("primer record helpers", () => {
  test("absent = not passed; per course", () => {
    expect(primerPassedFor(undefined, "ja-vi")).toBe(false);
    expect(primerPassedFor({ "ja-vi": true }, "ja-vi")).toBe(true);
    expect(primerPassedFor({ "ja-vi": true }, "ja-en")).toBe(false);
    expect(normalizePrimerPassed(null)).toEqual({});
  });
});

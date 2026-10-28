/**
 * v4 → v5 migration (P2b, decision D-4): the per-course assessment map
 * becomes per TARGET language. One course moves under its target with
 * every attempt and the placement tagged by course; two courses of one
 * target merge (attempts concatenated oldest first, newest placement wins,
 * higher accepted floor wins); a map keyed by target already (re-import of
 * a v5 backup) passes through; every historical persona reaches v5; the
 * step is idempotent and the failure seam propagates.
 */
import { afterEach, describe, expect, test } from "bun:test";

import type { PersistedAssessmentState } from "../assessment/types";
import { runInvariants } from "../persistence/backup-core";
import {
  __setMigrationFailureForTests,
  migrateProgress,
  PERSIST_VERSION,
  targetCodeOfCourseId,
  type PersistedProgress,
} from "../persistence/migrations";
import freshFixture from "../__fixtures__/progress/fresh.json";
import multiFixture from "../__fixtures__/progress/multi-course.json";
import flatFixture from "../__fixtures__/progress/v0-flat-legacy.json";
import richFixture from "../__fixtures__/progress/v0-rich.json";
import v3Fixture from "../__fixtures__/progress/v3-assessed.json";

const NOW = new Date(Date.UTC(2026, 5, 15, 12));
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
/** The v3 persona at v4 (the input shape of this step). */
const v4 = () => migrateProgress(clone(v3Fixture.state), 3, NOW, 4);

afterEach(() => __setMigrationFailureForTests(null));

function attempt(checkpointId: string, completedAt: number): PersistedAssessmentState["checkpointAttempts"][number] {
  return { checkpointId, checkpointVersion: 1, startedAt: completedAt - 1000, completedAt, itemResults: [], objectiveResults: [], overallCorrectShare: 0 };
}

describe("v4 → v5: assessment per target language", () => {
  test("PERSIST_VERSION is 8; course ids split on the first dash", () => {
    expect(PERSIST_VERSION).toBe(8);
    expect(targetCodeOfCourseId("fr-en")).toBe("fr");
    expect(targetCodeOfCourseId("fr-vi")).toBe("fr");
    expect(targetCodeOfCourseId("fr")).toBe("fr");
  });

  test("one course moves under its target; attempts and placement record the course; nothing else changes", () => {
    const before = v4();
    const out = migrateProgress(v4(), 4, NOW, 5);
    expect(out.assessmentByCourse).toBeUndefined();
    expect(Object.keys(out.assessmentByTarget!)).toEqual(["fr"]);
    const fr = out.assessmentByTarget!.fr;
    const was = before.assessmentByCourse!["fr-en"];
    expect(fr.placementFloor).toBe(was.placementFloor);
    expect(fr.checkpointAttempts.length).toBe(was.checkpointAttempts.length);
    for (const a of fr.checkpointAttempts) expect(a.courseId).toBe("fr-en");
    expect(fr.placement?.courseId).toBe("fr-en");
    expect(fr.placement?.completedAt).toBe(was.placement?.completedAt);
    const { assessmentByCourse: _a, ...beforeRest } = before;
    const { assessmentByTarget: _b, ...outRest } = out;
    expect(JSON.stringify(outRest)).toBe(JSON.stringify(beforeRest));
    expect(runInvariants(out, NOW)).toEqual([]);
  });

  test("two courses of one target merge: attempts oldest first, newest placement, higher floor", () => {
    const state = v4();
    const frEn = state.assessmentByCourse!["fr-en"];
    const frVi: PersistedAssessmentState = {
      checkpointAttempts: [attempt("fr.checkpoint.section-2", NOW.getTime() - 3 * 86_400_000), attempt("fr.checkpoint.section-1", NOW.getTime() - 30 * 86_400_000)],
      placement: { ...frEn.placement!, completedAt: NOW.getTime() - 86_400_000, recommendedFloorIndex: 8 },
      placementFloor: 8,
    };
    state.assessmentByCourse = { "fr-en": frEn, "fr-vi": frVi, "es-en": { checkpointAttempts: [], placementFloor: 2 } };
    const out = migrateProgress(state, 4, NOW);
    expect(Object.keys(out.assessmentByTarget!).sort()).toEqual(["es", "fr"]);
    const fr = out.assessmentByTarget!.fr;
    expect(fr.checkpointAttempts.length).toBe(frEn.checkpointAttempts.length + 2);
    const times = fr.checkpointAttempts.map((a) => a.completedAt);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(fr.checkpointAttempts.map((a) => a.courseId).sort()).toEqual(["fr-en", "fr-en", "fr-vi", "fr-vi"]);
    expect(fr.placement?.courseId).toBe("fr-vi"); // newer
    expect(fr.placementFloor).toBe(Math.max(frEn.placementFloor, 8));
    expect(out.assessmentByTarget!.es.placementFloor).toBe(2);
    expect(runInvariants(out, NOW)).toEqual([]);
  });

  test("a map already keyed by target passes through and merges with any v4 leftovers", () => {
    const state = v4();
    const existing = { es: { checkpointAttempts: [], placementFloor: 3 } };
    const out = migrateProgress({ ...state, assessmentByTarget: existing }, 4, NOW);
    expect(out.assessmentByTarget!.es).toEqual(existing.es);
    expect(out.assessmentByTarget!.fr.placementFloor).toBe(20);
  });

  test("an empty v4 map becomes an empty target map", () => {
    expect(migrateProgress({ ...v4(), assessmentByCourse: {} }, 4, NOW).assessmentByTarget).toEqual({});
  });

  test("migrating from v5 is a no-op endpoint (idempotent)", () => {
    const v5 = migrateProgress(v4(), 4, NOW);
    const again = migrateProgress(clone(v5), PERSIST_VERSION, NOW);
    expect(JSON.stringify(again)).toBe(JSON.stringify(v5));
  });

  test("an injected failure at v5 propagates without partial state", () => {
    __setMigrationFailureForTests(5);
    expect(() => migrateProgress(v4(), 4, NOW)).toThrow("injected migration failure at v5");
  });

  test("every historical persona reaches v5 with a per-target map and passes the invariants", () => {
    for (const [name, fixture, version] of [
      ["fresh", freshFixture.state, 0],
      ["flat", flatFixture.state, 0],
      ["rich", richFixture.state, 0],
      ["multi", multiFixture.state, 0],
      ["v3-assessed", v3Fixture.state, 3],
    ] as const) {
      const out = migrateProgress(clone(fixture) as PersistedProgress, version, NOW);
      expect({ name, ok: runInvariants(out, NOW) }).toEqual({ name, ok: [] });
      expect({ name, map: typeof out.assessmentByTarget }).toEqual({ name, map: "object" });
      expect({ name, legacy: out.assessmentByCourse }).toEqual({ name, legacy: undefined });
      for (const key of Object.keys(out.assessmentByTarget ?? {})) expect({ name, key }).toEqual({ name, key: targetCodeOfCourseId(key) });
    }
  });
});

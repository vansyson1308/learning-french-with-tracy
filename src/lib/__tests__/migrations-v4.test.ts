/**
 * v3 → v4 migration (P1d): the single assessment container becomes
 * per-course (its data under the course it belonged to), `uiLanguage`
 * arrives, cards and the review log are left exactly where they were for
 * the learner-store bootstrap, every historical persona reaches v4, the
 * step is idempotent, the failure seam leaves stored data untouched, and
 * malformed containers are never repaired into valid data.
 */
import { afterEach, describe, expect, test } from "bun:test";

import { emptyAssessmentState } from "../assessment/types";
import { runInvariants, stageImport, createEnvelope } from "../persistence/backup-core";
import { learnerDataFromBlob } from "../persistence/learner";
import {
  __setMigrationFailureForTests,
  migrateProgress,
  PERSIST_VERSION,
  V3_ASSESSMENT_COURSE_ID,
  type PersistedProgress,
} from "../persistence/migrations";
import freshFixture from "../__fixtures__/progress/fresh.json";
import multiFixture from "../__fixtures__/progress/multi-course.json";
import flatFixture from "../__fixtures__/progress/v0-flat-legacy.json";
import richFixture from "../__fixtures__/progress/v0-rich.json";
import v3Fixture from "../__fixtures__/progress/v3-assessed.json";

const NOW = new Date(Date.UTC(2026, 5, 15, 12));
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const v3 = () => clone(v3Fixture.state) as PersistedProgress;

afterEach(() => __setMigrationFailureForTests(null));

describe("v3 → v4: per-course assessment", () => {
  test("PERSIST_VERSION is 4 and the v3 fixture is a real v3 state", () => {
    expect(PERSIST_VERSION).toBe(8);
    expect(v3Fixture.version).toBe(3);
    expect(v3().assessment?.placementFloor).toBe(20);
    expect(v3().reviewLog?.length).toBe(3);
  });

  test("the assessment data moves under the French course; nothing else changes", () => {
    const before = v3();
    const out = migrateProgress(v3(), 3, NOW, 4);
    expect(out.assessment).toBeUndefined();
    expect(out.assessmentByCourse).toEqual({ [V3_ASSESSMENT_COURSE_ID]: before.assessment! });
    expect(out.uiLanguage).toBe("system");
    // Cards and the review log stay inline — the learner-store bootstrap moves them.
    expect(out.courses["fr-en"].cards).toEqual(before.courses["fr-en"].cards);
    expect(out.reviewLog).toEqual(before.reviewLog);
    const { assessment: _a, ...beforeRest } = before;
    const { assessmentByCourse: _b, uiLanguage: _u, ...outRest } = out;
    expect(JSON.stringify(outRest)).toBe(JSON.stringify(beforeRest));
    expect(runInvariants(out, NOW)).toEqual([]);
  });

  test("an empty v3 container becomes an empty map — no course key is invented", () => {
    const state = { ...v3(), assessment: emptyAssessmentState() };
    const out = migrateProgress(state, 3, NOW, 4);
    expect(out.assessmentByCourse).toEqual({});
  });

  test("a floor-only container still moves (the accepted floor is learner data)", () => {
    const state = { ...v3(), assessment: { checkpointAttempts: [], placementFloor: 4 } };
    expect(migrateProgress(state, 3, NOW, 4).assessmentByCourse).toEqual({
      "fr-en": { checkpointAttempts: [], placementFloor: 4 },
    });
  });

  test("a malformed container object is moved, not repaired — the backup import then rejects it", () => {
    const corrupt = { checkpointAttempts: "nope", placementFloor: -1 } as never;
    const out = migrateProgress({ ...v3(), assessment: corrupt }, 3, NOW, 4);
    expect(out.assessmentByCourse).toEqual({ "fr-en": corrupt });
    expect(runInvariants(out, NOW).length).toBeGreaterThan(0);
    const raw = JSON.stringify({ ...createEnvelope(out, learnerDataFromBlob(out), PERSIST_VERSION, NOW) });
    expect(stageImport(raw, NOW).ok).toBe(false);
  });

  test("a non-object container value is dropped", () => {
    for (const corrupt of [null, 42, "x"]) {
      const out = migrateProgress({ ...v3(), assessment: corrupt as never }, 3, NOW, 4);
      expect(out.assessmentByCourse).toEqual({});
    }
  });

  test("an existing assessmentByCourse (re-imported v4 data) passes through and is not overwritten", () => {
    const byCourse = { "es-en": { checkpointAttempts: [], placementFloor: 2 } };
    const state = { ...v3(), assessmentByCourse: byCourse };
    const out = migrateProgress(state, 3, NOW, 4);
    expect(out.assessmentByCourse).toEqual({ ...byCourse, "fr-en": v3().assessment! });
  });

  test("uiLanguage: a valid preference survives, anything else becomes system", () => {
    expect(migrateProgress({ ...v3(), uiLanguage: "vi" }, 3, NOW, 4).uiLanguage).toBe("vi");
    expect(migrateProgress({ ...v3(), uiLanguage: "klingon" as never }, 3, NOW, 4).uiLanguage).toBe("system");
  });

  test("migrating from v4 is a no-op endpoint (idempotent)", () => {
    const v4 = migrateProgress(v3(), 3, NOW, 4);
    const again = migrateProgress(clone(v4), 4, NOW, 4);
    expect(JSON.stringify(again)).toBe(JSON.stringify(v4));
  });

  test("an injected failure at v4 propagates without partial state", () => {
    __setMigrationFailureForTests(4);
    expect(() => migrateProgress(v3(), 3, NOW, 4)).toThrow("injected migration failure at v4");
  });

  test("every historical persona reaches v4 with a per-course map and passes the invariants", () => {
    for (const [name, fixture, version] of [
      ["fresh", freshFixture.state, 0],
      ["flat", flatFixture.state, 0],
      ["rich", richFixture.state, 0],
      ["multi", multiFixture.state, 0],
      ["v3-assessed", v3Fixture.state, 3],
    ] as const) {
      const out = migrateProgress(clone(fixture), version, NOW, 4);
      expect({ name, ok: runInvariants(out, NOW) }).toEqual({ name, ok: [] });
      expect({ name, map: typeof out.assessmentByCourse }).toEqual({ name, map: "object" });
      expect({ name, legacy: out.assessment }).toEqual({ name, legacy: undefined });
      expect({ name, ui: out.uiLanguage }).toEqual({ name, ui: "system" });
    }
  });
});

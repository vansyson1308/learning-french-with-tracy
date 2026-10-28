/**
 * v7 → v8 migration: surface-keyed progress of the registry courses is
 * re-keyed to the ids the runtime writes today.
 *
 * An RC3 learner of es-en has wordStats / srs keyed by raw surfaces
 * ("el hombre"); since P3a gave Spanish an id registry the runtime keys the
 * same words by `es:w:hombre`, so without v8 the RC3 progress would sit
 * next to — and be ignored by — everything written after the update. The
 * RC3 fixture (v3, es-en + de-en + fr-en) goes through the whole chain;
 * counts are preserved, unmapped surfaces keep a reversible
 * `<code>:legacy:` id, fr-en and registry-less courses stay byte-identical,
 * and a backup round-trips.
 */
import { afterEach, describe, expect, test } from "bun:test";

import { ID_REGISTRIES } from "../../content/ids";
import { idRegistryForLanguage, itemIdFor } from "../learning/ids";
import { createEnvelope, runInvariants, stageImport } from "../persistence/backup-core";
import { learnerDataFromBlob } from "../persistence/learner";
import {
  __setMigrationFailureForTests,
  migrateProgress,
  PERSIST_VERSION,
  rekeyRegistryCourses,
  V8_REKEYED_TARGETS,
  type PersistedProgress,
} from "../persistence/migrations";
import rc3Fixture from "../__fixtures__/progress/v3-rc3-es-de.json";

const NOW = new Date(Date.UTC(2026, 9, 28, 12));
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const rc3 = () => clone(rc3Fixture.state) as unknown as PersistedProgress;

afterEach(() => __setMigrationFailureForTests(null));

const totals = (stats: Record<string, { correct: number; wrong: number }>) =>
  Object.values(stats).reduce((t, s) => ({ correct: t.correct + s.correct, wrong: t.wrong + s.wrong }), { correct: 0, wrong: 0 });

describe("v7 → v8: legacy re-key of registry courses", () => {
  test("PERSIST_VERSION is 8", () => {
    expect(PERSIST_VERSION).toBe(8);
  });

  test("every id registry the app ships was re-keyed by a numbered step (a new registry needs its own migration)", () => {
    expect([...V8_REKEYED_TARGETS].sort()).toEqual(Object.keys(ID_REGISTRIES).sort());
  });

  test("RC3 es-en progress: every key becomes the id the runtime writes; counts are preserved", () => {
    const before = rc3().courses["es-en"];
    const out = migrateProgress(rc3(), 3, NOW).courses["es-en"];
    for (const surface of Object.keys(before.wordStats)) {
      const id = itemIdFor("es-en", surface);
      expect(id.startsWith("es:w:"), surface).toBe(true);
      expect(out.wordStats[id], surface).toEqual(before.wordStats[surface]);
      expect(out.srs?.[id], surface).toEqual(before.srs?.[surface]);
    }
    expect(Object.keys(out.wordStats).sort()).toEqual(["es:w:agua", "es:w:hombre", "es:w:manzana", "es:w:mujer", "es:w:nino"]);
    expect(Object.keys(out.wordStats)).toHaveLength(Object.keys(before.wordStats).length);
    expect(Object.keys(out.srs ?? {})).toHaveLength(Object.keys(before.srs ?? {}).length);
    expect(totals(out.wordStats)).toEqual(totals(before.wordStats));
    // Everything that is not keyed by a word is untouched.
    expect(out.xp).toBe(before.xp);
    expect(out.completedLessons).toEqual(before.completedLessons);
    expect(out.mistakes).toEqual(before.mistakes);
  });

  test("fr-en (re-keyed at v2, srsLegacy kept) and courses without a registry are byte-identical", () => {
    const via7 = migrateProgress(rc3(), 3, NOW, 7);
    const via8 = migrateProgress(rc3(), 3, NOW);
    expect(JSON.stringify(via8.courses["fr-en"])).toBe(JSON.stringify(via7.courses["fr-en"]));
    for (const courseId of Object.keys(via7.courses)) {
      const code = courseId.slice(0, courseId.indexOf("-"));
      if (V8_REKEYED_TARGETS.includes(code) && idRegistryForLanguage(code)) continue;
      expect(JSON.stringify(via8.courses[courseId]), courseId).toBe(JSON.stringify(via7.courses[courseId]));
    }
    const { courses: c7, ...rest7 } = via7;
    const { courses: c8, ...rest8 } = via8;
    expect(Object.keys(c8)).toEqual(Object.keys(c7));
    expect(rest8).toEqual(rest7);
  });

  test("a surface key next to its id (progress after the P3a update) merges: stats sum/sum/max, srs keeps the later review", () => {
    const state = migrateProgress(rc3(), 3, NOW, 7);
    const es = state.courses["es-en"];
    es.wordStats["es:w:agua"] = { correct: 2, wrong: 1, lastSeen: 1790500000000 };
    es.srs = { ...es.srs, "es:w:agua": { interval: 3, ease: 2.6, dueAt: 1790800000000, streak: 2 } };
    const out = migrateProgress(state, 7, NOW).courses["es-en"];
    expect(out.wordStats["es:w:agua"]).toEqual({ correct: 3, wrong: 1, lastSeen: 1790500000000 });
    expect(out.srs?.["es:w:agua"]).toEqual({ interval: 3, ease: 2.6, dueAt: 1790800000000, streak: 2 });
    expect(out.wordStats["el agua"]).toBeUndefined();
    expect(out.srs?.["el agua"]).toBeUndefined();
  });

  test("a surface the registry does not know keeps a reversible legacy id — nothing is dropped", () => {
    const state = migrateProgress(rc3(), 3, NOW, 7);
    state.courses["es-en"].wordStats["el ordenador | viejo"] = { correct: 1, wrong: 0, lastSeen: 1790000000000 };
    const out = migrateProgress(state, 7, NOW).courses["es-en"];
    const legacy = `es:legacy:${encodeURIComponent("el ordenador | viejo")}`;
    expect(out.wordStats[legacy]).toEqual({ correct: 1, wrong: 0, lastSeen: 1790000000000 });
    expect(itemIdFor("es-en", "el ordenador | viejo")).toBe(legacy);
    expect(legacy.includes("|")).toBe(false);
  });

  test("idempotent: an already re-keyed state passes through as the same object", () => {
    const once = migrateProgress(rc3(), 3, NOW);
    expect(migrateProgress(clone(once), 7, NOW)).toEqual(once);
    expect(rekeyRegistryCourses(once, V8_REKEYED_TARGETS)).toBe(once);
  });

  test("the failure seam propagates", () => {
    __setMigrationFailureForTests(8);
    expect(() => migrateProgress(rc3(), 3, NOW)).toThrow();
  });

  test("the migrated state passes the backup invariants, and a v8 backup round-trips", () => {
    const state = migrateProgress(rc3(), 3, NOW);
    expect(runInvariants(state, NOW)).toEqual([]);
    const raw = JSON.stringify(createEnvelope(state, learnerDataFromBlob(state), PERSIST_VERSION, NOW));
    const staged = stageImport(raw, NOW);
    expect(staged.ok).toBe(true);
    if (!staged.ok) return;
    expect(staged.state.courses["es-en"].wordStats).toEqual(state.courses["es-en"].wordStats);
    expect(staged.state.courses["es-en"].srs).toEqual(state.courses["es-en"].srs);
    expect(staged.state.courses["de-en"]).toEqual(state.courses["de-en"]);
  });

  test("an RC3 (v3) backup imported into this build lands re-keyed", () => {
    const old = rc3();
    const raw = JSON.stringify(createEnvelope(old, learnerDataFromBlob(old), 3, NOW));
    const staged = stageImport(raw, NOW);
    expect(staged.ok).toBe(true);
    if (!staged.ok) return;
    const es = staged.state.courses["es-en"];
    expect(Object.keys(es.wordStats).every((k) => k.startsWith("es:w:"))).toBe(true);
    expect(totals(es.wordStats)).toEqual(totals(old.courses["es-en"].wordStats));
  });
});

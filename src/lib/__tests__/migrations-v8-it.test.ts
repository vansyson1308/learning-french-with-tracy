/**
 * v8 re-key for Italian (P3d(it), the rule of coordinator QC 2026-10-28 §1):
 * Italian's id registry ships with it-vi and v8 never ran on a learner's device
 * before it, so it is part of v8 (no v9). RC3-era it-en progress is keyed by the
 * it-en pack surfaces, and the it-en pack is never edited.
 */
import { describe, expect, test } from "bun:test";

import { getPack } from "../content";
import { idRegistryForLanguage, itemIdFor } from "../learning/ids";
import { createEnvelope, runInvariants, stageImport } from "../persistence/backup-core";
import { learnerDataFromBlob } from "../persistence/learner";
import { migrateProgress, V8_REKEYED_TARGETS, type PersistedProgress } from "../persistence/migrations";
import { buildReviewSessionDefinition } from "../session/sources";
import rc3Fixture from "../__fixtures__/progress/v3-rc3-it.json";

const NOW = new Date(Date.UTC(2026, 9, 31, 12));
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const rc3 = () => clone(rc3Fixture.state) as unknown as PersistedProgress;
const REKEYED = ["it:w:pane", "it:w:ragazza", "it:w:uomo"];

describe("v8: Italian re-key", () => {
  test("Italian is a v8 target with a registry", () => {
    expect(V8_REKEYED_TARGETS).toContain("it");
    expect(idRegistryForLanguage("it")?.surfaceToId["l'uomo"]).toBe("it:w:uomo");
  });

  test("every it-en pack word maps to a curated lexeme id", () => {
    const words = getPack("it-en").sections.flatMap((s) => s.units.flatMap((u) => u.words.map((w) => w.target)));
    for (const w of words) expect(itemIdFor("it-en", w).startsWith("it:w:"), w).toBe(true);
  });

  test("RC3 it-en progress lands on it:w: ids with every count preserved", () => {
    const before = rc3().courses["it-en"];
    const out = migrateProgress(rc3(), 3, NOW).courses["it-en"];
    expect(Object.keys(out.wordStats).sort()).toEqual(REKEYED);
    expect(out.wordStats["it:w:uomo"]).toEqual(before.wordStats["l'uomo"]);
    expect(out.srs?.["it:w:uomo"]).toEqual(before.srs?.["l'uomo"]);
    expect(Object.keys(out.srs ?? {})).toHaveLength(Object.keys(before.srs ?? {}).length);
    expect(out.xp).toBe(before.xp);
    expect(out.completedLessons).toEqual(before.completedLessons);
    expect(runInvariants(migrateProgress(rc3(), 3, NOW), NOW)).toEqual([]);
  });

  test("the legacy review queue of it-en shows its own pack surface", () => {
    const pool = getPack("it-en").sections.flatMap((s) => s.units.flatMap((u) => u.words));
    const due = { interval: 1, ease: 2.5, dueAt: NOW.getTime() - 86_400_000, streak: 1 };
    const def = buildReviewSessionDefinition({ courseId: "it-en", course: { srs: { "it:w:pane": due }, cards: undefined }, pool, now: NOW.getTime() });
    expect(def.steps).toHaveLength(1);
    const step = def.steps[0];
    expect(step.type === "exercise" && step.exercise.type === "select" ? step.exercise.audioTarget : "").toBe("il pane");
    expect(step.type === "exercise" ? step.evidence?.itemId : "").toBe("it:w:pane");
  });

  test("an RC3 backup with it-en progress imports re-keyed", () => {
    const old = rc3();
    const staged = stageImport(JSON.stringify(createEnvelope(old, learnerDataFromBlob(old), 3, NOW)), NOW);
    expect(staged.ok).toBe(true);
    if (staged.ok) expect(Object.keys(staged.state.courses["it-en"].wordStats).sort()).toEqual(REKEYED);
  });
});

/**
 * v8 re-key for German (coordinator QC 2026-10-28 §1): German's id registry
 * ships with P3d(de) and v8 never ran on a learner's device before it, so de
 * is part of v8 (no v9). RC3-era de-en progress is keyed by the de-en pack
 * surfaces — "der Mann", and "Freund", which the de-en pack never gave an
 * article. "Freund" reaches `de:w:freund` through the registry's
 * `legacySurfaces` (de-vi teaches it as "der Freund"); the de-en pack is
 * never edited.
 */
import { describe, expect, test } from "bun:test";

import { getPack } from "../content";
import { idRegistryForLanguage, itemIdFor, surfacesFor } from "../learning/ids";
import { createEnvelope, runInvariants, stageImport } from "../persistence/backup-core";
import { learnerDataFromBlob } from "../persistence/learner";
import { migrateProgress, type PersistedProgress } from "../persistence/migrations";
import { buildReviewSessionDefinition } from "../session/sources";
import rc3Fixture from "../__fixtures__/progress/v3-rc3-es-de.json";

const NOW = new Date(Date.UTC(2026, 9, 28, 12));
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const rc3 = () => clone(rc3Fixture.state) as unknown as PersistedProgress;

describe("v8: German re-key with legacy surfaces", () => {
  test("the registry maps the de-en pack surface Freund to the lexeme taught as der Freund", () => {
    const reg = idRegistryForLanguage("de")!;
    expect(reg.surfaceToId["der Freund"]).toBe("de:w:freund");
    expect(reg.legacySurfaces?.["Freund"]).toBe("de:w:freund");
    expect(itemIdFor("de-en", "Freund")).toBe("de:w:freund");
    expect(itemIdFor("de-vi", "der Freund")).toBe("de:w:freund");
    expect(surfacesFor("de-en", "de:w:freund")).toEqual(["der Freund", "Freund"]);
  });

  test("every de-en pack word maps to a lexeme id, directly or through legacySurfaces", () => {
    const words = getPack("de-en").sections.flatMap((s) => s.units.flatMap((u) => u.words.map((w) => w.target)));
    for (const w of words) expect(itemIdFor("de-en", w).startsWith("de:w:"), w).toBe(true);
  });

  test("RC3 de-en progress lands on de:w: ids with every count preserved", () => {
    const before = rc3().courses["de-en"];
    const out = migrateProgress(rc3(), 3, NOW).courses["de-en"];
    expect(Object.keys(out.wordStats).sort()).toEqual(["de:w:freund", "de:w:madchen", "de:w:mann"]);
    expect(out.wordStats["de:w:freund"]).toEqual(before.wordStats["Freund"]);
    expect(out.srs?.["de:w:freund"]).toEqual(before.srs?.["Freund"]);
    expect(Object.keys(out.srs ?? {})).toHaveLength(Object.keys(before.srs ?? {}).length);
    expect(runInvariants(migrateProgress(rc3(), 3, NOW), NOW)).toEqual([]);
  });

  test("the legacy review queue of de-en shows its own pack surface for a re-keyed word", () => {
    const pool = getPack("de-en").sections.flatMap((s) => s.units.flatMap((u) => u.words));
    const due = { interval: 1, ease: 2.5, dueAt: NOW.getTime() - 86_400_000, streak: 1 };
    const def = buildReviewSessionDefinition({ courseId: "de-en", course: { srs: { "de:w:freund": due }, cards: undefined }, pool, now: NOW.getTime() });
    expect(def.steps).toHaveLength(1);
    const step = def.steps[0];
    expect(step.type === "exercise" && step.exercise.type === "select" ? step.exercise.audioTarget : "").toBe("Freund");
    expect(step.type === "exercise" ? step.evidence?.itemId : "").toBe("de:w:freund");
  });

  test("an RC3 backup with de-en progress imports re-keyed", () => {
    const old = rc3();
    const staged = stageImport(JSON.stringify(createEnvelope(old, learnerDataFromBlob(old), 3, NOW)), NOW);
    expect(staged.ok).toBe(true);
    if (staged.ok) expect(Object.keys(staged.state.courses["de-en"].wordStats).sort()).toEqual(["de:w:freund", "de:w:madchen", "de:w:mann"]);
  });
});

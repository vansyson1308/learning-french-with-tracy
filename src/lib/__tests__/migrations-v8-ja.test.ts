/**
 * v8 re-key for Japanese (P4c, ja-plan.md §9): the ja id registry ships with ja-vi, and v8 never ran on a learner's
 * device before it (RC3, the last device build, predates v8), so ja joins V8_REKEYED_TARGETS — no v9 step. RC3-era
 * ja-en progress is keyed by the ja-en pack surfaces (no registry: itemIdFor returned the surface), and the ja-en pack
 * is never edited: its kana surfaces reach their lexeme through `legacySurfaces` (みず → 水 → ja:w:mizu), and さかな,
 * which ja-en teaches beside 魚 with another gloss, keeps a reversible ja:legacy: key (legacy-unmapped.json).
 *
 * Until the first ja compile (the audio bot commit writes src/content/ids/ja.json) the test registers the registry the
 * compiler writes from the same sources (content/ja/lexemes.json, the lexicon's legacySurfaces); once it exists, the
 * compiled registry must be exactly that one.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import frozenMap from "../../../content/ja/lexemes.json";
import jaLexicon from "../../../content/ja/lexicon/lexemes.json";
import { ID_REGISTRIES } from "../../content/ids";
import { getPack } from "../content";
import { __registerIdRegistryForTests, idRegistryForLanguage, itemIdFor, type IdRegistry } from "../learning/ids";
import { createEnvelope, runInvariants, stageImport } from "../persistence/backup-core";
import { learnerDataFromBlob } from "../persistence/learner";
import { migrateProgress, REKEYED_TARGETS, V8_REKEYED_TARGETS, type PersistedProgress } from "../persistence/migrations";
import { buildReviewSessionDefinition } from "../session/sources";
import rc3Fixture from "../__fixtures__/progress/v3-rc3-ja.json";

const NOW = new Date(Date.UTC(2026, 10, 3, 12));
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const rc3 = () => clone(rc3Fixture.state) as unknown as PersistedProgress;
const SAKANA_LEGACY = `ja:legacy:${encodeURIComponent("さかな")}`;
const REKEYED = ["ja:w:inu", "ja:w:mizu", "ja:w:sakana", "ja:w:taberu", SAKANA_LEGACY].sort();

const compiled = (ID_REGISTRIES as Record<string, IdRegistry | undefined>).ja;
const lexemes = (jaLexicon as { lexemes: { id: string; legacySurfaces?: string[] }[] }).lexemes;
const fromSources: IdRegistry = {
  language: "ja",
  prefix: "ja:w:",
  legacyPrefix: "ja:legacy:",
  surfaceToId: frozenMap as Record<string, string>,
  legacySurfaces: Object.fromEntries(lexemes.flatMap((l) => (l.legacySurfaces ?? []).map((s) => [s, l.id] as const))),
};

beforeAll(() => {
  if (compiled === undefined) __registerIdRegistryForTests("ja", fromSources);
});
afterAll(() => {
  if (compiled === undefined) __registerIdRegistryForTests("ja", null);
});

describe("v8: Japanese re-key", () => {
  test("Japanese is a v8 target; the registry is the one the compiler writes from the ja sources", () => {
    expect(V8_REKEYED_TARGETS).toContain("ja");
    expect(REKEYED_TARGETS).toContain("ja");
    if (compiled !== undefined) expect(compiled).toEqual(fromSources);
    expect(idRegistryForLanguage("ja")?.legacySurfaces?.["みず"]).toBe("ja:w:mizu");
  });

  test("every ja-en pack word maps to a curated lexeme id, except さかな, which keeps a reversible legacy id", () => {
    const words = getPack("ja-en").sections.flatMap((s) => s.units.flatMap((u) => u.words.map((w) => w.target)));
    for (const w of words) {
      if (w === "さかな") expect(itemIdFor("ja-en", w)).toBe(SAKANA_LEGACY);
      else expect(itemIdFor("ja-en", w).startsWith("ja:w:"), w).toBe(true);
    }
    expect(itemIdFor("ja-en", "魚")).toBe("ja:w:sakana");
  });

  test("RC3 ja-en progress lands on ja ids with every count preserved; さかな and 魚 stay apart", () => {
    const before = rc3().courses["ja-en"];
    const out = migrateProgress(rc3(), 3, NOW).courses["ja-en"];
    expect(Object.keys(out.wordStats).sort()).toEqual(REKEYED);
    expect(out.wordStats["ja:w:mizu"]).toEqual(before.wordStats["みず"]);
    expect(out.wordStats["ja:w:taberu"]).toEqual(before.wordStats["たべます"]);
    expect(out.wordStats["ja:w:sakana"]).toEqual(before.wordStats["魚"]);
    expect(out.wordStats[SAKANA_LEGACY]).toEqual(before.wordStats["さかな"]);
    expect(out.srs?.["ja:w:mizu"]).toEqual(before.srs?.["みず"]);
    expect(out.srs?.[SAKANA_LEGACY]).toEqual(before.srs?.["さかな"]);
    expect(Object.keys(out.srs ?? {})).toHaveLength(Object.keys(before.srs ?? {}).length);
    expect(out.xp).toBe(before.xp);
    expect(out.completedLessons).toEqual(before.completedLessons);
    expect(runInvariants(migrateProgress(rc3(), 3, NOW), NOW)).toEqual([]);
  });

  test("the legacy review queue of ja-en shows its own pack surface (みず, not 水)", () => {
    const pool = getPack("ja-en").sections.flatMap((s) => s.units.flatMap((u) => u.words));
    const due = { interval: 1, ease: 2.5, dueAt: NOW.getTime() - 86_400_000, streak: 1 };
    const def = buildReviewSessionDefinition({ courseId: "ja-en", course: { srs: { "ja:w:mizu": due }, cards: undefined }, pool, now: NOW.getTime() });
    expect(def.steps).toHaveLength(1);
    const step = def.steps[0];
    expect(step.type === "exercise" ? step.evidence?.itemId : "").toBe("ja:w:mizu");
    expect(JSON.stringify(step)).toContain("みず");
  });

  test("an RC3 backup with ja-en progress imports re-keyed; the re-key is idempotent", () => {
    const old = rc3();
    const staged = stageImport(JSON.stringify(createEnvelope(old, learnerDataFromBlob(old), 3, NOW)), NOW);
    expect(staged.ok).toBe(true);
    if (staged.ok) expect(Object.keys(staged.state.courses["ja-en"].wordStats).sort()).toEqual(REKEYED);
    const once = migrateProgress(rc3(), 3, NOW);
    expect(migrateProgress(clone(once), 7, NOW)).toEqual(once);
  });
});

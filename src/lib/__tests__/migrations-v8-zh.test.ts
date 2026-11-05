/**
 * v8 re-key for Chinese (P4d, zh-plan.md §11): the zh id registry ships with zh-vi, and v8 never ran on a learner's
 * device before it (RC3, the last device build, predates v8), so zh joins V8_REKEYED_TARGETS — no new step. RC3-era
 * zh-en progress is keyed by the zh-en pack surfaces (no registry: itemIdFor returned the surface). The zh-en pack is
 * never edited and every one of its surfaces is a zh-vi lexeme (no legacySurfaces, no legacy-unmapped.json), so each
 * pack key lands on its curated id; a key the registry does not know (a surface no pack teaches today) is never
 * dropped: it keeps a reversible zh:legacy: id that decodes back to the surface.
 *
 * Until the first zh compile (the audio bot commit writes src/content/ids/zh.json) the test registers the registry the
 * compiler writes from the same source (content/zh/lexemes.json; zh has no legacySurfaces, so the key is absent);
 * once it exists, the compiled registry must be exactly that one.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import frozenMap from "../../../content/zh/lexemes.json";
import zhLexicon from "../../../content/zh/lexicon/lexemes.json";
import { ID_REGISTRIES } from "../../content/ids";
import { getPack } from "../content";
import { __registerIdRegistryForTests, idRegistryForLanguage, itemIdFor, surfaceFor, type IdRegistry } from "../learning/ids";
import { createEnvelope, runInvariants, stageImport } from "../persistence/backup-core";
import { learnerDataFromBlob } from "../persistence/learner";
import { migrateProgress, REKEYED_TARGETS, V8_REKEYED_TARGETS, type PersistedProgress } from "../persistence/migrations";
import { buildReviewSessionDefinition } from "../session/sources";
import rc3Fixture from "../__fixtures__/progress/v3-rc3-zh.json";

const NOW = new Date(Date.UTC(2026, 10, 5, 12));
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const rc3 = () => clone(rc3Fixture.state) as unknown as PersistedProgress;
const PANDA_LEGACY = `zh:legacy:${encodeURIComponent("熊猫")}`;
const REKEYED = ["zh:w:mao-1", "zh:w:shui", "zh:w:xiexie", "zh:w:zhi", PANDA_LEGACY].sort();

const compiled = (ID_REGISTRIES as Record<string, IdRegistry | undefined>).zh;
const fromSources: IdRegistry = { language: "zh", prefix: "zh:w:", legacyPrefix: "zh:legacy:", surfaceToId: frozenMap as Record<string, string> };

beforeAll(() => {
  if (compiled === undefined) __registerIdRegistryForTests("zh", fromSources);
});
afterAll(() => {
  if (compiled === undefined) __registerIdRegistryForTests("zh", null);
});

describe("v8: Chinese re-key", () => {
  test("Chinese is a v8 target; the registry is the one the compiler writes from the zh source", () => {
    expect(V8_REKEYED_TARGETS).toContain("zh");
    expect(REKEYED_TARGETS).toContain("zh");
    if (compiled !== undefined) expect(compiled).toEqual(fromSources);
    expect((zhLexicon as { lexemes: { legacySurfaces?: string[] }[] }).lexemes.some((l) => l.legacySurfaces?.length)).toBe(false);
    expect(idRegistryForLanguage("zh")?.surfaceToId["水"]).toBe("zh:w:shui");
  });

  test("every zh-en pack word maps to a curated zh-vi lexeme id", () => {
    const words = getPack("zh-en").sections.flatMap((s) => s.units.flatMap((u) => u.words.map((w) => w.target)));
    expect(words.length).toBeGreaterThan(50);
    for (const w of words) expect(itemIdFor("zh-en", w).startsWith("zh:w:"), w).toBe(true);
  });

  test("RC3 zh-en progress lands on zh ids with every count preserved; an unknown surface keeps a reversible legacy id", () => {
    const before = rc3().courses["zh-en"];
    const out = migrateProgress(rc3(), 3, NOW).courses["zh-en"];
    expect(Object.keys(out.wordStats).sort()).toEqual(REKEYED);
    expect(out.wordStats["zh:w:shui"]).toEqual(before.wordStats["水"]);
    expect(out.wordStats["zh:w:xiexie"]).toEqual(before.wordStats["谢谢"]);
    expect(out.wordStats["zh:w:mao-1"]).toEqual(before.wordStats["猫"]);
    expect(out.wordStats["zh:w:zhi"]).toEqual(before.wordStats["只"]);
    expect(out.wordStats[PANDA_LEGACY]).toEqual(before.wordStats["熊猫"]);
    expect(surfaceFor("zh-en", PANDA_LEGACY)).toBe("熊猫");
    expect(out.srs?.["zh:w:shui"]).toEqual(before.srs?.["水"]);
    expect(out.srs?.["zh:w:mao-1"]).toEqual(before.srs?.["猫"]);
    expect(out.srs?.[PANDA_LEGACY]).toEqual(before.srs?.["熊猫"]);
    expect(Object.keys(out.srs ?? {})).toHaveLength(Object.keys(before.srs ?? {}).length);
    expect(out.xp).toBe(before.xp);
    expect(out.completedLessons).toEqual(before.completedLessons);
    expect(runInvariants(migrateProgress(rc3(), 3, NOW), NOW)).toEqual([]);
  });

  test("the legacy review queue of zh-en shows its own pack word", () => {
    const pool = getPack("zh-en").sections.flatMap((s) => s.units.flatMap((u) => u.words));
    const due = { interval: 1, ease: 2.5, dueAt: NOW.getTime() - 86_400_000, streak: 1 };
    const def = buildReviewSessionDefinition({ courseId: "zh-en", course: { srs: { "zh:w:shui": due }, cards: undefined }, pool, now: NOW.getTime() });
    expect(def.steps).toHaveLength(1);
    const step = def.steps[0];
    expect(step.type === "exercise" ? step.evidence?.itemId : "").toBe("zh:w:shui");
    expect(JSON.stringify(step)).toContain("水");
  });

  test("an RC3 backup with zh-en progress imports re-keyed; the re-key is idempotent", () => {
    const old = rc3();
    const staged = stageImport(JSON.stringify(createEnvelope(old, learnerDataFromBlob(old), 3, NOW)), NOW);
    expect(staged.ok).toBe(true);
    if (staged.ok) expect(Object.keys(staged.state.courses["zh-en"].wordStats).sort()).toEqual(REKEYED);
    const once = migrateProgress(rc3(), 3, NOW);
    expect(migrateProgress(clone(once), 7, NOW)).toEqual(once);
  });
});

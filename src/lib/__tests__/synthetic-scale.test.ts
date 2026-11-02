/**
 * Synthetic scale (D-15 §7, plan/10-LADDER-A1-C2.md §7): the runtime holds
 * a C2-sized language — 12,000 lexemes over 300 units — within explicit
 * budgets. The course is generated in memory (helpers/synthetic-scale.ts,
 * seeded, never content) and enters through the same seams the test-only
 * `xx` language uses: course profile, id registry and per-course
 * artifacts. Measured here, on the runtime side:
 *   - cold start: parse the artifacts, register the course, resolve the id
 *     registry, the lexicon index, the syllabus words and the web-tier
 *     lexicon repository;
 *   - TODAY: the route's real composition (daily candidates + syllabus pool
 *     + composeTodayFromSnapshot) for a learner with ~3,000 FSRS cards, five
 *     consecutive days with the learner's answers applied in between;
 *   - the generated (JS) lexicon tier's search over ~30 queries;
 *   - heap growth after a forced collection.
 * The SQLite build and FTS search at the same scale live in
 * scripts/__tests__/synthetic-scale-lexicon.test.ts.
 *
 * Budgets are set for GitHub's ubuntu runners (~2× slower than a dev
 * laptop): each is ≥ 4× the post-fix laptop measurement recorded beside
 * it, yet an accidental O(n²) over 12,000 items (≥ 10⁸ steps) blows it.
 */
import { afterAll, describe, expect, test } from "bun:test";

import { __registerCourseArtifactsForTests } from "../content-registry";
import { __registerCourseProfileForTests } from "../course-profile";
import { dailyWordCandidates, syllabusWords } from "../learning/daily-words";
import { pickDistractors, prepareDistractorPool } from "../learning/distractors";
import { fsrsScheduler } from "../learning/fsrs-adapter";
import { __registerIdRegistryForTests, hasIdRegistry, itemIdFor, surfaceFor, surfacesFor } from "../learning/ids";
import { lexemeMetaFor } from "../learning/lexicon-index";
import type { FsrsCardState } from "../learning/scheduler";
import { composeTodayFromSnapshot, type TodayPlan } from "../learning/today";
import { GeneratedLexiconRepository, type GeneratedLexiconData } from "../lexicon/generated-repository";
import { seededRng } from "../review-builder";
import type { Pack } from "../types";

import {
  SCALE_COURSE_ID,
  SCALE_LEXEMES,
  SCALE_TARGET,
  SCALE_UNITS,
  percentile,
  syntheticDaily,
  syntheticIdRegistry,
  syntheticLearner,
  syntheticLexemes,
  syntheticLexiconIndex,
  syntheticPack,
  syntheticProfile,
  syntheticQueries,
  syntheticWebFallback,
} from "./helpers/synthetic-scale";

// Dev-laptop measurements (Windows, bun 1.4.3, 2026-11-03), before → after
// the D-15 §7 fixes, best of several runs on a shared machine:
//   cold start  166 ms → 130–190 ms (the id registry's legacy-surface
//               inversion alone went 60 → 5 ms; JSON.parse of the ~12 MB of
//               artifacts is the rest);
//   TODAY plan  168–324 ms → 18–58 ms per plan (the per-pick full-pool scan
//               re-resolving every candidate's id + metadata through a fresh
//               course profile, and six due-queue passes per plan);
//   JS search   p95 43 ms → 7–10 ms (every query re-folded 12,000 entries);
//   JS list     alpha 196 ms → 32–54 ms (two folds per sort comparison);
//   heap        +28 MB → +33–38 MB after GC (the web tier keeps its folded
//               search words and sort keys once built — by design).
const BUDGET = {
  coldStartMs: 1_500,
  todayPlanMs: 300,
  jsSearchP95Ms: 100,
  jsListMs: 250,
  heapGrowthBytes: 150 * 1024 * 1024,
};
const DAY = 86_400_000;
const T0 = new Date("2026-11-03T08:00:00").getTime();
const PLANS = 5;

const heapAfterGc = () => {
  Bun.gc(true);
  return process.memoryUsage().heapUsed;
};

// Fixture generation is NOT measured: it stands in for the compiler. The
// artifacts are serialized so the cold start pays the JSON parse the app
// pays when a course bundle's modules evaluate.
const lexemes = syntheticLexemes();
const packJson = JSON.stringify(syntheticPack(lexemes));
const idsJson = JSON.stringify(syntheticIdRegistry(lexemes));
const indexJson = JSON.stringify(syntheticLexiconIndex(lexemes));
const fallbackJson = JSON.stringify(syntheticWebFallback(lexemes));
const dailyJson = JSON.stringify(syntheticDaily(lexemes));
const queries = syntheticQueries(lexemes);

type Loaded = { pack: Pack; repository: GeneratedLexiconRepository };
let loaded: Loaded | null = null;
let heapBefore = 0;
const measured: Record<string, string> = {};

afterAll(() => {
  __registerCourseProfileForTests(null, SCALE_COURSE_ID);
  __registerCourseArtifactsForTests(SCALE_COURSE_ID, null);
  __registerIdRegistryForTests(SCALE_TARGET, null);
  console.log(`synthetic scale (runtime): ${Object.entries(measured).map(([k, v]) => `${k} ${v}`).join(", ")}`);
});

function requireLoaded(): Loaded {
  if (!loaded) throw new Error("cold start did not run");
  return loaded;
}

describe("synthetic scale: 12,000 lexemes / 300 units through the runtime", () => {
  test("the generator is deterministic and C2-sized", () => {
    expect(lexemes.length).toBe(SCALE_LEXEMES);
    expect(new Set(lexemes.map((l) => l.id)).size).toBe(SCALE_LEXEMES);
    expect(new Set(lexemes.map((l) => l.surface)).size).toBe(SCALE_LEXEMES);
    const pack = JSON.parse(packJson) as Pack;
    expect(pack.sections.flatMap((s) => s.units).length).toBe(SCALE_UNITS);
    // Same seed → byte-identical artifacts.
    expect(JSON.stringify(syntheticPack(syntheticLexemes()))).toBe(packJson);
    expect(queries.length).toBeGreaterThanOrEqual(30);
  }, 120_000);

  test("cold start: parse + register + resolve ids, index, syllabus and repository", () => {
    heapBefore = heapAfterGc();
    const started = performance.now();
    const pack = JSON.parse(packJson) as Pack;
    const ids = JSON.parse(idsJson);
    const lexiconIndex = JSON.parse(indexJson);
    const lexiconFallback = JSON.parse(fallbackJson) as GeneratedLexiconData;
    const dailyWords = JSON.parse(dailyJson);
    __registerCourseProfileForTests(syntheticProfile());
    __registerIdRegistryForTests(SCALE_TARGET, ids);
    __registerCourseArtifactsForTests(SCALE_COURSE_ID, { ids, lexiconIndex, lexiconFallback, dailyWords });
    // First touches resolve every derived view the session path needs.
    expect(hasIdRegistry(SCALE_COURSE_ID)).toBe(true);
    const sample = lexemes[1234];
    expect(lexemeMetaFor(SCALE_COURSE_ID, sample.id)?.surface).toBe(sample.surface);
    const words = syllabusWords(SCALE_COURSE_ID);
    const repository = new GeneratedLexiconRepository(lexiconFallback);
    const elapsed = performance.now() - started;
    loaded = { pack, repository };
    measured.coldStart = `${elapsed.toFixed(0)} ms`;

    expect(words.length).toBe(lexemes.filter((l) => !l.variety).length);
    expect(itemIdFor(SCALE_COURSE_ID, sample.surface)).toBe(sample.id);
    expect(surfaceFor(SCALE_COURSE_ID, sample.id)).toBe(sample.surface);
    const legacy = lexemes.find((l) => l.legacySurfaces);
    expect(legacy).toBeDefined();
    if (legacy) {
      expect(itemIdFor(SCALE_COURSE_ID, legacy.legacySurfaces![0])).toBe(legacy.id);
      expect(surfacesFor(SCALE_COURSE_ID, legacy.id)).toEqual([legacy.surface, ...legacy.legacySurfaces!]);
    }
    expect(elapsed).toBeLessThan(BUDGET.coldStartMs);
  }, 120_000);

  test("distractors: the prepared 12,000-word pool picks exactly what the plain scan picks", () => {
    const { pack } = requireLoaded();
    const words = [...pack.sections.flatMap((s) => s.units.flatMap((u) => u.words)), ...syllabusWords(SCALE_COURSE_ID)];
    const pool = [...new Map(words.map((w) => [w.target, w])).values()];
    const prepared = prepareDistractorPool(SCALE_COURSE_ID, pool);
    for (const direction of ["targetToNative", "nativeToTarget"] as const) {
      for (let i = 0; i < 200; i++) {
        const word = pool[(i * 59) % pool.length];
        const plainRng = seededRng(i + 7);
        const preparedRng = seededRng(i + 7);
        const plain = pickDistractors({ courseId: SCALE_COURSE_ID, word, pool, rng: plainRng, direction });
        expect(pickDistractors({ courseId: SCALE_COURSE_ID, word, pool: prepared, rng: preparedRng, direction })).toEqual(plain);
        expect(preparedRng()).toBe(plainRng());
      }
    }
  }, 120_000);

  test("TODAY: five consecutive plans for a ~3,000-card learner stay under budget", () => {
    const { pack } = requireLoaded();
    const learner = syntheticLearner(lexemes, pack, T0);
    let cards: Record<string, FsrsCardState> = learner.cards;
    expect(Object.keys(cards).length).toBeGreaterThanOrEqual(2_900);
    const planMs: number[] = [];
    const plans: TodayPlan[] = [];
    for (let day = 0; day < PLANS; day++) {
      const now = T0 + day * DAY;
      // Collect first: inside the full suite, the garbage of ~160 earlier
      // test files must not be billed to this plan.
      Bun.gc(true);
      const started = performance.now();
      // Exactly what src/app/session/today.tsx composes at entry.
      const plan = composeTodayFromSnapshot({
        courseId: SCALE_COURSE_ID,
        pack,
        completedLessons: learner.completedLessons,
        cards,
        preset: "regular",
        placementFloor: 0,
        listenClips: learner.listenClips,
        dailyWords: dailyWordCandidates({
          courseId: SCALE_COURSE_ID,
          pack,
          completedLessons: learner.completedLessons,
          placementFloor: 0,
          cards,
        }),
        dailyNewWords: 10,
        lexiconWords: syllabusWords(SCALE_COURSE_ID),
        now,
      });
      planMs.push(performance.now() - started);
      plans.push(plan);
      // The learner answers every designated assessment correctly; the
      // next day's plan sees the new and rescheduled cards.
      const next = { ...cards };
      for (const step of plan.steps) {
        if (step.type !== "exercise" || step.evidence?.srsRole !== "assessment") continue;
        const key = `${step.evidence.itemId}|${step.evidence.skill ?? "recognize"}`;
        next[key] = fsrsScheduler.review(next[key] ?? fsrsScheduler.initialCard(now), "good", now).card;
      }
      cards = next;
    }
    measured.today = `${planMs.map((ms) => ms.toFixed(0)).join("/")} ms (5 plans)`;

    for (const plan of plans) {
      expect(plan.reviewCount).toBe(10);
      expect(plan.listenCount).toBeGreaterThan(0);
      expect(plan.newCount).toBeGreaterThan(0);
      expect(plan.backlogTotal).toBeGreaterThan(plan.reviewCount);
      for (const step of plan.steps) {
        if (step.type === "exercise" && step.exercise.type === "select") {
          expect(step.exercise.options.length).toBe(4);
        }
      }
    }
    for (const ms of planMs) expect(ms).toBeLessThan(BUDGET.todayPlanMs);
  }, 120_000);

  test("generated (JS) lexicon tier: search p95 over ~30 queries", async () => {
    const { repository } = requireLoaded();
    const samples: number[] = [];
    const hits: Record<string, number> = {};
    for (const q of queries) {
      const started = performance.now();
      const results = await repository.search(q);
      samples.push(performance.now() - started);
      hits[q] = results.length;
    }
    const p95 = percentile(samples, 95);
    measured.jsSearch = `p95 ${p95.toFixed(1)} ms, max ${Math.max(...samples).toFixed(1)} ms`;
    expect(hits.t).toBeGreaterThan(1_000); // the broadest one-letter query works
    expect(hits.xyzzy).toBe(0);
    expect(p95).toBeLessThan(BUDGET.jsSearchP95Ms);
  }, 120_000);

  test("generated (JS) lexicon tier: the vocabulary browser's sorts over all 12,000 entries", async () => {
    const { repository } = requireLoaded();
    const listMs: Record<string, number> = {};
    for (const sort of ["course", "alpha", "frequency"] as const) {
      const started = performance.now();
      const rows = await repository.list({ sort });
      listMs[sort] = performance.now() - started;
      expect(rows.length).toBe(SCALE_LEXEMES);
    }
    measured.jsList = Object.entries(listMs).map(([k, v]) => `${k} ${v.toFixed(0)}`).join("/") + " ms";
    for (const ms of Object.values(listMs)) expect(ms).toBeLessThan(BUDGET.jsListMs);
  }, 120_000);

  test("heap growth after cold start + five plans stays bounded", () => {
    requireLoaded();
    const growth = heapAfterGc() - heapBefore;
    measured.heap = `+${(growth / 1048576).toFixed(1)} MB`;
    expect(growth).toBeLessThan(BUDGET.heapGrowthBytes);
  });
});

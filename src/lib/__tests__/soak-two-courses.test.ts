/**
 * Soak (P1d): two FSRS courses, fifty days, through the real store on top
 * of the learner store — once on the SQLite store (the device path, via
 * bun:sqlite) and once on the JSON store (web / fallback). The learner
 * alternates courses day by day; every session's scheduler mutations go
 * through the pending buffer and are flushed at completion; the persisted
 * BLOB must stay small (its size no longer grows with the review log —
 * that lives in the learner store), memory only holds the active course's
 * window, the store keeps every entry of both courses, and a day-50 backup
 * (envelope v2) stages cleanly. On SQLite a cycle must not get slower with
 * history (commits are O(delta)); the JSON store rewrites its whole
 * document per flush, so its cost grows with the store — recorded, not
 * bounded by ratio. Device-level soak stays a device task —
 * release/SOAK_REPORT.md.
 */
import { Database } from "bun:sqlite";
import { afterAll, beforeAll, describe, expect, test, setSystemTime } from "bun:test";

import frIndex from "../../content/lexicon/fr-index.json";
import { __setCourseCapabilityOverrideForTests } from "../course-profile";
import type { ReviewEvidence } from "../learning/evidence";
import { REVIEW_LOG_CAP } from "../learning/review-log";
import { createEnvelope, runInvariants, stageImport } from "../persistence/backup-core";
import { __setLearnerStoreForTests, learnerStore } from "../persistence/learner";
import { SqlLearnerStore } from "../persistence/learner-sql";
import { PERSIST_VERSION } from "../persistence/migrations";
import { PROGRESS_STORAGE_KEY, useProgress, whenLearnerReady } from "../store";
import { memoryStorage } from "./helpers/mocks";
import { bunSqliteExecutor } from "./helpers/sqlite-executor";

const DAY = 86_400_000;
const T0 = new Date("2026-09-03T08:00:00").getTime();
const CYCLES = 50;
const LESSON_STEPS = 11;
const TODAY_STEPS = 20;
const BLOB_LIMIT_BYTES = 512 * 1024;
const COURSES = ["fr-en", "es-en"] as const;

const frItems = [...new Set([...JSON.stringify(frIndex).matchAll(/"(fr:w:[a-z0-9-]+)"/g)].map((m) => m[1]))].sort();
const esItems = Array.from({ length: 126 }, (_, i) => `es:w:item-${i}`);
const itemsOf = (courseId: string) => (courseId === "fr-en" ? frItems : esItems);

function evidence(courseId: string, i: number, cycle: number, source: ReviewEvidence["source"], sessionId: string): ReviewEvidence {
  const items = itemsOf(courseId);
  const itemId = items[(cycle * 7 + i) % items.length];
  const skill = i % 5 === 4 ? "listen" : "recognize";
  return {
    cardKey: { itemId, skill },
    sessionId,
    exerciseId: `${sessionId}:${i}`,
    modality: skill === "listen" ? "listen" : "recognizeText",
    srsRole: "assessment",
    source,
    correct: (i + cycle) % 4 !== 0,
    hinted: false,
    assisted: false,
    toleranceUsed: i % 9 === 0,
    latencyMs: 1200 + ((i * 37) % 900),
    attemptIndex: 0,
  };
}

const kv = {
  async getItem(key: string) {
    return memoryStorage.get(key) ?? null;
  },
  async setItem(key: string, value: string) {
    memoryStorage.set(key, value);
  },
  async removeItem(key: string) {
    memoryStorage.delete(key);
  },
};

const blobBytes = () => (memoryStorage.get(PROGRESS_STORAGE_KEY) ?? "").length;
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const median = (xs: number[]) => {
  const sorted = [...xs].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

async function resetWorld(backend: "sqlite" | "json"): Promise<void> {
  setSystemTime(new Date(T0));
  __setCourseCapabilityOverrideForTests("es-en", { fsrs: true });
  // A clean slate in memory FIRST: the bootstrap imports whatever cards and
  // log the in-memory state carries (another test's leftovers would land in
  // the store as a "pre-v4 blob").
  useProgress.setState({ courses: {}, reviewLog: [], activeDays: {}, streak: 0, lastActiveDay: null as unknown as string, dailyXp: 0 });
  memoryStorage.clear();
  if (backend === "sqlite") {
    const store = new SqlLearnerStore(bunSqliteExecutor(new Database(":memory:")));
    await store.init();
    __setLearnerStoreForTests(store, kv);
  } else {
    __setLearnerStoreForTests(null);
  }
  await useProgress.persist.rehydrate();
  await whenLearnerReady();
  useProgress.getState().finishOnboarding("fr-en", 20);
  await useProgress.getState().loadLearnerCourse("fr-en");
}

type SoakNumbers = { cycleMs: number[]; blobSizes: number[] };

async function runFiftyDays(): Promise<SoakNumbers> {
  const cycleMs: number[] = [];
  const blobSizes: number[] = [];
  for (let cycle = 0; cycle < CYCLES; cycle++) {
    setSystemTime(new Date(T0 + cycle * DAY));
    const courseId = COURSES[cycle % COURSES.length];
    const started = performance.now();
    const store = useProgress.getState();
    if (store.activeCourseId !== courseId) {
      store.setActiveCourse(courseId);
      await store.loadLearnerCourse(courseId);
    }

    const lessonSession = `${courseId}:lesson-${cycle}`;
    for (let i = 0; i < LESSON_STEPS; i++) store.submitEvidence(evidence(courseId, i, cycle, "lesson", lessonSession), courseId);
    store.completeLesson(`${courseId}:u0-l${cycle % 7}`, cycle % 2 === 0);
    await store.flushLearner();

    const todaySession = `${courseId}:today-${cycle}`;
    for (let i = 0; i < TODAY_STEPS; i++) store.submitEvidence(evidence(courseId, i + 100, cycle, "today", todaySession), courseId);
    store.completeTodaySession(12);
    await store.flushLearner();

    // One undo per day keeps the removal path under load too.
    expect(store.undoLastReview(courseId)).toBe(true);
    await store.flushLearner();

    cycleMs.push(performance.now() - started);
    blobSizes.push(blobBytes());

    const s = useProgress.getState();
    expect(blobBytes()).toBeLessThan(BLOB_LIMIT_BYTES);
    expect(memoryStorage.get(PROGRESS_STORAGE_KEY)).not.toMatch(/"reviewLog"/);
    expect(memoryStorage.get(PROGRESS_STORAGE_KEY)).not.toMatch(/"cards"/);
    expect(s.reviewLog.length).toBeLessThanOrEqual(REVIEW_LOG_CAP);
    // Memory only carries the active course's learner data.
    for (const other of COURSES) {
      if (other !== courseId) expect(Object.keys(s.courses[other]?.cards ?? {}).length).toBe(0);
    }
    expect(s.reviewLog.every((e) => e.courseId === courseId)).toBe(true);
  }
  return { cycleMs, blobSizes };
}

async function checkStoreAfterFiftyDays(backend: string, numbers: SoakNumbers): Promise<void> {
  const counts = await (await learnerStore()).counts();
  const perDay = LESSON_STEPS + TODAY_STEPS - 1; // one undo per day
  expect(counts.reviewLog).toBe(CYCLES * perDay);
  const all = await (await learnerStore()).exportAll();
  for (const courseId of COURSES) {
    expect(all.reviewLog.filter((e) => e.courseId === courseId).length).toBe((CYCLES / 2) * perDay);
    expect(Object.keys(all.cards[courseId] ?? {}).length).toBeLessThanOrEqual(itemsOf(courseId).length * 2);
    expect(Object.keys(all.cards[courseId] ?? {}).length).toBeGreaterThan(0);
  }
  const s = useProgress.getState();
  expect(s.streak).toBe(CYCLES);
  const early = mean(numbers.cycleMs.slice(0, 10));
  const late = mean(numbers.cycleMs.slice(-10));
  const storeBytes = JSON.stringify(all).length;
  console.log(
    `soak (2 courses, ${backend}): ${CYCLES} cycles, blob ${(numbers.blobSizes[0] / 1024).toFixed(1)} KB day 1 → ` +
      `${(numbers.blobSizes[CYCLES - 1] / 1024).toFixed(1)} KB day 50 (limit 512 KB), learner store ${counts.reviewLog} entries / ` +
      `${counts.cards} cards (${(storeBytes / 1024).toFixed(0)} KB as JSON), memory window ${s.reviewLog.length}, ` +
      `cycle ms early ${early.toFixed(1)} → late ${late.toFixed(1)}`
  );
  expect(late).toBeLessThanOrEqual(400);
  // SQLite commits are O(delta): no trend with history. Medians (a GC pause
  // in one cycle must not fail the run) after a 5-cycle warm-up, × 4 noise.
  if (backend === "sqlite") {
    const settled = median(numbers.cycleMs.slice(5, 15));
    const end = median(numbers.cycleMs.slice(-10));
    expect(end / Math.max(settled, 1)).toBeLessThanOrEqual(4);
  }
}

async function checkDayFiftyBackup(): Promise<void> {
  const live = useProgress.getState();
  const learner = await (await learnerStore()).exportAll();
  const envelope = createEnvelope(live as never, learner, PERSIST_VERSION, new Date());
  const staged = stageImport(JSON.stringify(envelope), new Date());
  expect(staged.ok).toBe(true);
  if (!staged.ok) return;
  expect(runInvariants(staged.state, new Date(), staged.learner)).toEqual([]);
  expect(Object.keys(staged.learner.cards).sort()).toEqual([...COURSES].sort());
  expect(staged.learner.reviewLog.length).toBe(learner.reviewLog.length);
  expect(staged.state.courses["fr-en"].xp).toBe(live.courses["fr-en"].xp);
  expect(staged.state.courses["es-en"].xp).toBe(live.courses["es-en"].xp);
}

describe.each(["sqlite", "json"] as const)("soak: two FSRS courses × fifty days on the %s learner store", (backend) => {
  let numbers: SoakNumbers = { cycleMs: [], blobSizes: [] };

  beforeAll(() => resetWorld(backend));
  afterAll(() => {
    setSystemTime();
    __setCourseCapabilityOverrideForTests("es-en", null);
    __setLearnerStoreForTests(null);
  });

  test("runs 50 alternating days; the blob stays under 512 KB while the store keeps every entry", async () => {
    numbers = await runFiftyDays();
    await checkStoreAfterFiftyDays(backend, numbers);
  }, 120_000);

  test("the day-50 backup (envelope v2) stages with both courses and clean invariants", checkDayFiftyBackup);
});

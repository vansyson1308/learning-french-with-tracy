/**
 * Learner bootstrap + pending buffer (P1d): a pre-v4 blob's cards and
 * review log move into the learner store ONCE (safety copy first, counts
 * verified, idempotent — a second run adds nothing), a crash-left pending
 * buffer is replayed before anything else, every scheduler mutation lands
 * in the buffer and is persisted immediately, a flush commits it as one
 * batch, undo reverses it in the store, and the 10k-entry persona imports
 * well inside the 2 s budget on the real SQL path.
 */
import { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import type { ReviewLogEntry } from "../learning/review-log";
import type { FsrsCardState } from "../learning/scheduler";
import {
  __setLearnerStoreForTests,
  bootstrapLearner,
  flushLearnerWrites,
  LEARNER_PENDING_KEY,
  learnerStore,
  pendingLearnerBatch,
  recordLearnerDelta,
  replayPendingLearnerWrites,
} from "../persistence/learner";
import { JsonLearnerStore } from "../persistence/learner-json";
import { SqlLearnerStore } from "../persistence/learner-sql";
import { LEARNER_META, emptyBatch, type LearnerData } from "../persistence/learner-types";
import { migrateProgress, PERSIST_VERSION, type PersistedProgress } from "../persistence/migrations";
import { PROGRESS_STORAGE_KEY, runLearnerBootstrap, useProgress, whenLearnerReady } from "../store";
import { bunSqliteExecutor } from "./helpers/sqlite-executor";
import { memFiles, memoryStorage } from "./helpers/mocks";
import v3Fixture from "../__fixtures__/progress/v3-assessed.json";

const NOW = new Date(Date.UTC(2026, 5, 15, 12));
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

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

async function freshSqlStore(): Promise<SqlLearnerStore> {
  const store = new SqlLearnerStore(bunSqliteExecutor(new Database(":memory:")));
  await store.init();
  return store;
}

function v4Blob(): PersistedProgress {
  return migrateProgress(clone(v3Fixture.state), 3, NOW);
}

const safetyCopies: LearnerData[] = [];
const writeSafetyCopy = async (data: LearnerData) => {
  safetyCopies.push(data);
};

beforeEach(() => {
  memoryStorage.clear();
  memFiles.clear();
  safetyCopies.length = 0;
});
afterEach(() => __setLearnerStoreForTests(null));

describe("one-time import of a pre-v4 blob", () => {
  test("cards + log move into the store once; the safety copy is written first; counts verified; a second run adds nothing", async () => {
    const store = await freshSqlStore();
    __setLearnerStoreForTests(store, kv);
    const blob = v4Blob();
    const result = await bootstrapLearner({ courses: blob.courses, reviewLog: blob.reviewLog ?? [], activeCourseId: "fr-en", writeSafetyCopy, now: NOW });
    expect(result.imported).toEqual({ cards: Object.keys(blob.courses["fr-en"].cards ?? {}).length, reviewLog: 3 });
    expect(safetyCopies.length).toBe(1);
    expect(safetyCopies[0].reviewLog.length).toBe(3);
    expect(await store.counts()).toEqual({ cards: result.imported!.cards, reviewLog: 3 });
    expect(await store.getMeta(LEARNER_META.blobImportedAt)).toBe(NOW.toISOString());
    // The active course comes back merged: the blob's own cards win on a tie.
    expect(Object.keys(result.active.cards).sort()).toEqual(Object.keys(blob.courses["fr-en"].cards ?? {}).sort());
    expect(result.active.reviewLog.map((e) => e.at)).toEqual((blob.reviewLog ?? []).map((e) => e.at));

    // A crash before the strip re-runs the import: nothing doubles.
    const again = await bootstrapLearner({ courses: blob.courses, reviewLog: blob.reviewLog ?? [], activeCourseId: "fr-en", writeSafetyCopy, now: NOW });
    expect(again.imported).not.toBeNull();
    expect(await store.counts()).toEqual({ cards: result.imported!.cards, reviewLog: 3 });

    // Once the blob is stripped, bootstrap imports nothing and just loads.
    const stripped = await bootstrapLearner({ courses: { "fr-en": { cards: undefined } }, reviewLog: [], activeCourseId: "fr-en", writeSafetyCopy, now: NOW });
    expect(stripped.imported).toBeNull();
    expect(Object.keys(stripped.active.cards).length).toBe(result.imported!.cards);
    expect(safetyCopies.length).toBe(2);
  });

  test("a 10k-entry log persona imports in under 2 s on the SQL store", async () => {
    const store = await freshSqlStore();
    __setLearnerStoreForTests(store, kv);
    const blob = v4Blob();
    const base = blob.reviewLog![0];
    const cards: Record<string, FsrsCardState> = {};
    const reviewLog: ReviewLogEntry[] = [];
    for (let i = 0; i < 10_000; i++) {
      const cardKey = `fr:w:item${i % 400}|${i % 3 === 0 ? "listen" : "recognize"}`;
      cards[cardKey] = { ...blob.courses["fr-en"].cards!["fr:w:pomme|recognize"], due: NOW.getTime() + i * 1000 };
      reviewLog.push({ ...base, at: NOW.getTime() - (10_000 - i) * 60_000, cardKey, exerciseId: `ex-${i}`, sessionId: `s-${Math.floor(i / 30)}` });
    }
    const started = performance.now();
    const result = await bootstrapLearner({ courses: { "fr-en": { cards } }, reviewLog, activeCourseId: "fr-en", writeSafetyCopy, now: NOW });
    const elapsed = performance.now() - started;
    const cardCount = Object.keys(cards).length;
    expect(result.imported).toEqual({ cards: cardCount, reviewLog: 10_000 });
    expect(await store.counts()).toEqual({ cards: cardCount, reviewLog: 10_000 });
    expect(elapsed).toBeLessThan(2000);
    console.log(`learner import: ${cardCount} cards + 10,000 log entries in ${elapsed.toFixed(0)} ms (bun:sqlite)`);
  });
});

describe("pending buffer", () => {
  test("every delta is persisted at once, replayed on launch, and cleared by a flush", async () => {
    const store = await freshSqlStore();
    __setLearnerStoreForTests(store, kv);
    const blob = v4Blob();
    const entry = blob.reviewLog![0];
    recordLearnerDelta({ cardUpserts: [{ courseId: "fr-en", cardKey: "fr:w:pomme|recognize", card: blob.courses["fr-en"].cards!["fr:w:pomme|recognize"] }], logAppends: [{ ...entry, at: 1 }], logRemovals: [] });
    await new Promise((r) => setTimeout(r, 0));
    const persisted = JSON.parse(memoryStorage.get(LEARNER_PENDING_KEY) as string);
    expect(persisted.logAppends.length).toBe(1);
    expect((await store.counts()).reviewLog).toBe(0);

    // "Crash": a fresh facade over the same storage replays the buffer.
    __setLearnerStoreForTests(store, kv);
    expect(await replayPendingLearnerWrites()).toBe(2);
    expect(await store.counts()).toEqual({ cards: 1, reviewLog: 1 });
    expect(memoryStorage.has(LEARNER_PENDING_KEY)).toBe(false);
    expect(await replayPendingLearnerWrites()).toBe(0);

    // A normal flush commits once and clears the buffer.
    recordLearnerDelta({ ...emptyBatch(), logAppends: [{ ...entry, at: 2 }] });
    await flushLearnerWrites();
    expect(pendingLearnerBatch()).toEqual(emptyBatch());
    expect((await store.counts()).reviewLog).toBe(2);
    expect(memoryStorage.has(LEARNER_PENDING_KEY)).toBe(false);
  });

  test("an unreadable buffer is discarded, never crashes the launch", async () => {
    __setLearnerStoreForTests(await freshSqlStore(), kv);
    memoryStorage.set(LEARNER_PENDING_KEY, "{not json");
    expect(await replayPendingLearnerWrites()).toBe(0);
    expect(memoryStorage.has(LEARNER_PENDING_KEY)).toBe(false);
  });
});

describe("the store on top of the learner store", () => {
  test("rehydrating a v3 blob: the blob is rewritten without cards/log, the JSON store holds them, memory keeps the active course", async () => {
    memoryStorage.set(PROGRESS_STORAGE_KEY, JSON.stringify(v3Fixture));
    await useProgress.persist.rehydrate();
    await whenLearnerReady();
    const s = useProgress.getState();
    expect(s.learnerReady).toBe(true);
    expect(s.activeCourseId).toBe("fr-en");
    expect(Object.keys(s.courses["fr-en"].cards ?? {}).length).toBeGreaterThan(0);
    expect(s.reviewLog.length).toBe(3);
    expect(s.assessmentByTarget["fr"].placementFloor).toBe(20);
    // Force a blob write and check the stripped shape.
    s.setThemePreference("dark");
    await new Promise((r) => setTimeout(r, 0));
    const stored = JSON.parse(memoryStorage.get(PROGRESS_STORAGE_KEY) as string);
    expect(stored.version).toBe(PERSIST_VERSION);
    expect(stored.state.courses["fr-en"].cards).toBeUndefined();
    expect(stored.state.reviewLog).toBeUndefined();
    const learner = await (await learnerStore()).exportAll();
    expect(learner.reviewLog.length).toBe(3);
    expect(Object.keys(learner.cards["fr"]).length).toBe(Object.keys(s.courses["fr-en"].cards ?? {}).length);
    // The pre-v4 safety copy went to the documents directory.
    expect([...memFiles.keys()].some((k) => k.includes("progress-before-v4-"))).toBe(true);
  });

  test("submitEvidence + flush commit to the store; undo reverses both halves", async () => {
    memoryStorage.set(PROGRESS_STORAGE_KEY, JSON.stringify(v3Fixture));
    await useProgress.persist.rehydrate();
    await whenLearnerReady();
    const store = useProgress.getState();
    const before = (await (await learnerStore()).counts()).reviewLog;
    const mutated = store.submitEvidence({
      cardKey: { itemId: "fr:w:chat", skill: "recognize" },
      sessionId: "s-new",
      exerciseId: "x1",
      modality: "recognizeText",
      srsRole: "assessment",
      source: "lesson",
      correct: true,
      hinted: false,
      assisted: false,
      toleranceUsed: false,
      latencyMs: 900,
      attemptIndex: 0,
    });
    expect(mutated).toBe(true);
    expect(pendingLearnerBatch().logAppends.length).toBe(1);
    await store.flushLearner();
    let counts = await (await learnerStore()).counts();
    expect(counts.reviewLog).toBe(before + 1);
    const committed = (await (await learnerStore()).loadCourse("fr-en")).cards["fr:w:chat|recognize"];
    expect(committed).toBeDefined();

    expect(useProgress.getState().undoLastReview("fr-en")).toBe(true);
    await useProgress.getState().flushLearner();
    counts = await (await learnerStore()).counts();
    expect(counts.reviewLog).toBe(before);
    const restored = (await (await learnerStore()).loadCourse("fr-en")).cards["fr:w:chat|recognize"];
    expect(restored.reps).toBe(0);
    expect(useProgress.getState().courses["fr-en"].cards?.["fr:w:chat|recognize"].reps).toBe(0);
  });

  test("the bootstrap is fail-soft: a broken learner store never blocks readiness", async () => {
    const broken = new JsonLearnerStore({
      async getItem() {
        throw new Error("disk on fire");
      },
      async setItem() {
        throw new Error("disk on fire");
      },
    });
    __setLearnerStoreForTests(broken, kv);
    useProgress.setState({ learnerReady: false });
    await runLearnerBootstrap();
    expect(useProgress.getState().learnerReady).toBe(true);
  });
});

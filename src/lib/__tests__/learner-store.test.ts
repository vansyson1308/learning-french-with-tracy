/**
 * Learner store (P1d): the SQLite store (real SQL on bun:sqlite) and the
 * JSON store (web/test tier) obey one contract — load per course, commit a
 * batch atomically, export/replace everything — and both are idempotent
 * under a replayed batch and honest under an undo. The pending-batch
 * merge rules are pinned too.
 */
import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";

import type { ReviewLogEntry } from "../learning/review-log";
import type { FsrsCardState } from "../learning/scheduler";
import { JsonLearnerStore } from "../persistence/learner-json";
import { SqlLearnerStore } from "../persistence/learner-sql";
import { emptyBatch, logRefOf, mergeBatch, type LearnerBatch, type LearnerStore } from "../persistence/learner-types";
import { subtractBatch } from "../persistence/learner";
import { bunSqliteExecutor } from "./helpers/sqlite-executor";

function card(due: number, reps = 1): FsrsCardState {
  return { due, stability: 2, difficulty: 5, scheduled_days: 1, learning_steps: 0, reps, lapses: 0, state: "review", last_review: due - 86_400_000 };
}

function entry(courseId: string, at: number, cardKey: string, exerciseId = "e1", attemptIndex = 0): ReviewLogEntry {
  return {
    at,
    courseId,
    cardKey,
    sessionId: "s1",
    exerciseId,
    modality: "recognizeText",
    srsRole: "assessment",
    source: "lesson",
    correct: true,
    hinted: false,
    assisted: false,
    toleranceUsed: false,
    latencyMs: 1000,
    attemptIndex,
  };
}

async function sqlStore(): Promise<SqlLearnerStore> {
  const store = new SqlLearnerStore(bunSqliteExecutor(new Database(":memory:")));
  await store.init();
  return store;
}

function jsonStore(): JsonLearnerStore {
  const map = new Map<string, string>();
  return new JsonLearnerStore({
    async getItem(key) {
      return map.get(key) ?? null;
    },
    async setItem(key, value) {
      map.set(key, value);
    },
  });
}

const STORES: [string, () => Promise<LearnerStore>][] = [
  ["sqlite", sqlStore],
  ["json", async () => jsonStore()],
];

const batch: LearnerBatch = {
  cardUpserts: [
    { courseId: "fr-en", cardKey: "fr:w:chat|recognize", card: card(1000) },
    { courseId: "fr-en", cardKey: "fr:w:chat|listen", card: card(2000) },
    { courseId: "es-en", cardKey: "el gato|recognize", card: card(3000) },
  ],
  logAppends: [entry("fr-en", 10, "fr:w:chat|recognize"), entry("es-en", 20, "el gato|recognize"), entry("fr-en", 30, "fr:w:chat|listen", "e2")],
  logRemovals: [],
};

for (const [name, open] of STORES) {
  describe(`${name} learner store`, () => {
    test("commit → loadCourse returns the course's cards and log window, oldest first", async () => {
      const store = await open();
      await store.commit(batch);
      const fr = await store.loadCourse("fr-en");
      expect(Object.keys(fr.cards).sort()).toEqual(["fr:w:chat|listen", "fr:w:chat|recognize"]);
      expect(fr.cards["fr:w:chat|listen"].due).toBe(2000);
      expect(fr.reviewLog.map((e) => e.at)).toEqual([10, 30]);
      const es = await store.loadCourse("es-en");
      expect(Object.keys(es.cards)).toEqual(["el gato|recognize"]);
      expect(es.reviewLog.map((e) => e.at)).toEqual([20]);
      expect(await store.counts()).toEqual({ cards: 3, reviewLog: 3 });
    });

    test("the log window is a tail: only the most recent N entries are loaded", async () => {
      const store = await open();
      await store.commit({ ...emptyBatch(), logAppends: Array.from({ length: 10 }, (_, i) => entry("fr-en", i + 1, "k", `e${i}`)) });
      const slice = await store.loadCourse("fr-en", 3);
      expect(slice.reviewLog.map((e) => e.at)).toEqual([8, 9, 10]);
    });

    test("a replayed batch is idempotent (same rows, not duplicates); an upsert updates in place", async () => {
      const store = await open();
      await store.commit(batch);
      await store.commit(batch);
      expect(await store.counts()).toEqual({ cards: 3, reviewLog: 3 });
      await store.commit({ ...emptyBatch(), cardUpserts: [{ courseId: "fr-en", cardKey: "fr:w:chat|recognize", card: card(9999, 7) }] });
      const fr = await store.loadCourse("fr-en");
      expect(fr.cards["fr:w:chat|recognize"].reps).toBe(7);
      expect(await store.counts()).toEqual({ cards: 3, reviewLog: 3 });
    });

    test("undo: a removal deletes exactly the identified row and the restored card lands", async () => {
      const store = await open();
      await store.commit(batch);
      await store.commit({
        cardUpserts: [{ courseId: "fr-en", cardKey: "fr:w:chat|recognize", card: card(500, 0) }],
        logAppends: [],
        logRemovals: [logRefOf(batch.logAppends[0])],
      });
      const fr = await store.loadCourse("fr-en");
      expect(fr.reviewLog.map((e) => e.at)).toEqual([30]);
      expect(fr.cards["fr:w:chat|recognize"].due).toBe(500);
      expect((await store.counts()).reviewLog).toBe(2);
    });

    test("exportAll / replaceAll round-trip everything", async () => {
      const store = await open();
      await store.commit(batch);
      const data = await store.exportAll();
      expect(Object.keys(data.cards).sort()).toEqual(["es-en", "fr-en"]);
      expect(data.reviewLog.map((e) => e.at)).toEqual([10, 20, 30]);
      const other = await open();
      await other.replaceAll(data);
      expect(await other.exportAll()).toEqual(data);
      await other.replaceAll({ cards: {}, reviewLog: [] });
      expect(await other.counts()).toEqual({ cards: 0, reviewLog: 0 });
    });

    test("meta keys persist", async () => {
      const store = await open();
      expect(await store.getMeta("blobImportedAt")).toBeNull();
      await store.setMeta("blobImportedAt", "2026-10-15");
      expect(await store.getMeta("blobImportedAt")).toBe("2026-10-15");
      expect(await store.getMeta("schemaVersion")).toBe("1");
    });
  });
}

describe("sqlite transactions are all-or-nothing", () => {
  test("a failing statement inside commit rolls the whole batch back", async () => {
    const db = new Database(":memory:");
    const store = new SqlLearnerStore(bunSqliteExecutor(db));
    await store.init();
    const poisoned: LearnerBatch = {
      ...batch,
      // A card whose JSON cannot be produced: the serializer throws mid-transaction.
      cardUpserts: [...batch.cardUpserts, { courseId: "fr-en", cardKey: "fr:w:bad|recognize", card: { toJSON() { throw new Error("boom"); } } as unknown as FsrsCardState }],
    };
    await expect(store.commit(poisoned)).rejects.toThrow("boom");
    expect(await store.counts()).toEqual({ cards: 0, reviewLog: 0 });
    db.close();
  });

  test("unparseable card keys are kept verbatim, never dropped", async () => {
    const store = await sqlStore();
    await store.commit({ ...emptyBatch(), cardUpserts: [{ courseId: "fr-en", cardKey: "weird-key-without-skill", card: card(1) }] });
    const fr = await store.loadCourse("fr-en");
    expect(Object.keys(fr.cards)).toEqual(["weird-key-without-skill"]);
  });
});

describe("pending-batch merge rules", () => {
  test("later upserts replace earlier ones; an undo of a pending append cancels it instead of queueing a removal", () => {
    const first = mergeBatch(emptyBatch(), { cardUpserts: [{ courseId: "fr-en", cardKey: "k|recognize", card: card(1) }], logAppends: [entry("fr-en", 5, "k|recognize")], logRemovals: [] });
    const second = mergeBatch(first, { cardUpserts: [{ courseId: "fr-en", cardKey: "k|recognize", card: card(2) }], logAppends: [], logRemovals: [logRefOf(entry("fr-en", 5, "k|recognize"))] });
    expect(second.cardUpserts).toEqual([{ courseId: "fr-en", cardKey: "k|recognize", card: card(2) }]);
    expect(second.logAppends).toEqual([]);
    expect(second.logRemovals).toEqual([]);
  });

  test("an undo of an already-committed entry queues a removal", () => {
    const merged = mergeBatch(emptyBatch(), { cardUpserts: [], logAppends: [], logRemovals: [logRefOf(entry("fr-en", 5, "k|recognize"))] });
    expect(merged.logRemovals.length).toBe(1);
  });

  test("subtractBatch keeps what arrived during a commit", () => {
    const committed = mergeBatch(emptyBatch(), { cardUpserts: [{ courseId: "fr-en", cardKey: "k|recognize", card: card(1) }], logAppends: [entry("fr-en", 5, "k|recognize")], logRemovals: [] });
    const current = mergeBatch(committed, { cardUpserts: [{ courseId: "fr-en", cardKey: "j|recognize", card: card(3) }], logAppends: [entry("fr-en", 6, "j|recognize")], logRemovals: [] });
    const rest = subtractBatch(current, committed);
    expect(rest.cardUpserts.map((u) => u.cardKey)).toEqual(["j|recognize"]);
    expect(rest.logAppends.map((e) => e.at)).toEqual([6]);
    expect(subtractBatch(committed, committed)).toEqual(emptyBatch());
  });
});

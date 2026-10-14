/**
 * Backup envelope v2 (P1d): exports carry the blob and the learner store
 * as two halves; a v1 backup (cards/log inline) imports with its learner
 * data split out; a v2 backup round-trips through the real commit path;
 * the commit is one logical transaction — a failure after the learner
 * store was replaced restores BOTH halves from the rollback.
 */
import { beforeEach, describe, expect, test } from "bun:test";

import { commitImport, exportProgress, prepareImport } from "../backup";
import { BACKUP_FORMAT, ENVELOPE_VERSION, createEnvelope } from "../persistence/backup-core";
import { __setLearnerStoreForTests, learnerDataFromBlob, learnerStore } from "../persistence/learner";
import { migrateProgress, PERSIST_VERSION, type PersistedProgress } from "../persistence/migrations";
import { PROGRESS_STORAGE_KEY, useProgress, whenLearnerReady } from "../store";
import { asyncStorageMock, memFiles, memoryStorage } from "./helpers/mocks";
import v3Fixture from "../__fixtures__/progress/v3-assessed.json";

const NOW = new Date(Date.UTC(2026, 5, 15, 12));
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** A v1 envelope exactly as the pre-P1d app wrote it (cards + log inside state). */
function v1Envelope(state: PersistedProgress, persistVersion: number): string {
  return JSON.stringify({
    format: BACKUP_FORMAT,
    envelopeVersion: 1,
    persistVersion,
    exportedAt: NOW.toISOString(),
    manifest: { topLevelKeys: Object.keys(state), courses: Object.keys(state.courses) },
    state,
  });
}

beforeEach(async () => {
  memFiles.clear();
  asyncStorageMock.failNextSet = false;
  memoryStorage.clear();
  __setLearnerStoreForTests(null);
  memoryStorage.set(PROGRESS_STORAGE_KEY, JSON.stringify(v3Fixture));
  await useProgress.persist.rehydrate();
  await whenLearnerReady();
  await useProgress.getState().flushLearner();
});

describe("envelope v2", () => {
  test("export writes both halves and the manifest counts them", async () => {
    const outcome = await exportProgress(NOW);
    expect(outcome.ok).toBe(true);
    const exported = [...memFiles.entries()].find(([k]) => k.includes("lingo-progress-"));
    const envelope = JSON.parse((exported as [string, string])[1]);
    expect(envelope.envelopeVersion).toBe(ENVELOPE_VERSION);
    expect(envelope.persistVersion).toBe(PERSIST_VERSION);
    expect(envelope.state.courses["fr-en"].cards).toBeUndefined();
    expect(envelope.state.reviewLog).toBeUndefined();
    expect(envelope.learner.reviewLog.length).toBe(3);
    expect(Object.keys(envelope.learner.cards["fr-en"]).length).toBeGreaterThan(0);
    expect(envelope.manifest).toMatchObject({ reviewLog: 3, cards: Object.keys(envelope.learner.cards["fr-en"]).length });
    expect(envelope.state.assessmentByCourse["fr-en"].placementFloor).toBe(20);
    // Speech never rides along.
    expect(JSON.stringify(envelope)).not.toMatch(/transcript|recordingUri|\.wav/);
  });

  test("a v1 backup imports: the inline learner data is split into the learner half", () => {
    const staged = prepareImport(v1Envelope(clone(v3Fixture.state) as PersistedProgress, 3), NOW);
    expect(staged.ok).toBe(true);
    if (!staged.ok) return;
    expect(staged.state.courses["fr-en"].cards).toBeUndefined();
    expect(staged.state.reviewLog).toBeUndefined();
    expect(staged.state.assessmentByCourse!["fr-en"].placementFloor).toBe(20);
    expect(staged.learner.reviewLog.length).toBe(3);
    expect(staged.learner.cards["fr-en"]["fr:w:pomme|listen"]).toBeDefined();
  });

  test("a v2 backup round-trips through commitImport: blob + learner store + live memory agree", async () => {
    const v4 = migrateProgress(clone(v3Fixture.state), 3, NOW);
    const learner = learnerDataFromBlob(v4);
    // Tweak so the import is observable against the current state.
    v4.streak = 42;
    learner.reviewLog = learner.reviewLog.slice(0, 2);
    const raw = JSON.stringify(createEnvelope(v4, learner, PERSIST_VERSION, NOW));
    const staged = prepareImport(raw, NOW);
    expect(staged.ok).toBe(true);
    if (!staged.ok) return;
    const outcome = await commitImport(staged.state, staged.learner, NOW);
    expect(outcome).toEqual({ ok: true });
    expect(useProgress.getState().streak).toBe(42);
    expect(useProgress.getState().reviewLog.length).toBe(2);
    const stored = await (await learnerStore()).exportAll();
    expect(stored.reviewLog.length).toBe(2);
    expect(Object.keys(stored.cards["fr-en"]).length).toBe(Object.keys(learner.cards["fr-en"]).length);
    expect([...memFiles.keys()].some((k) => k.includes("progress-before-import-"))).toBe(true);
    // The rollback file is gone after a verified commit.
    expect([...memFiles.keys()].some((k) => k.includes("progress-rollback-"))).toBe(false);
  });

  test("a failure after the learner store was replaced restores both halves", async () => {
    const beforeBlob = memoryStorage.get(PROGRESS_STORAGE_KEY) as string;
    const beforeLearner = await (await learnerStore()).exportAll();
    const v4 = migrateProgress(clone(v3Fixture.state), 3, NOW);
    const learner = { ...learnerDataFromBlob(v4), reviewLog: [] };
    const staged = prepareImport(JSON.stringify(createEnvelope({ ...v4, streak: 99 }, learner, PERSIST_VERSION, NOW)), NOW);
    if (!staged.ok) throw new Error("stage failed");
    // The learner write succeeds; the write of the NEW blob (streak 99) fails.
    const originalSet = asyncStorageMock.setItem;
    asyncStorageMock.setItem = async (key: string, value: string) => {
      if (key === PROGRESS_STORAGE_KEY && value.includes('"streak":99')) throw new Error("simulated blob write failure");
      memoryStorage.set(key, value);
    };
    try {
      const outcome = await commitImport(staged.state, staged.learner, NOW);
      expect(outcome.ok).toBe(false);
    } finally {
      asyncStorageMock.setItem = originalSet;
    }
    expect(memoryStorage.get(PROGRESS_STORAGE_KEY)).toBe(beforeBlob);
    expect(await (await learnerStore()).exportAll()).toEqual(beforeLearner);
    expect(useProgress.getState().streak).not.toBe(99);
    expect(useProgress.getState().reviewLog.length).toBe(3);
  });
});

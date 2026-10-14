import { beforeEach, describe, expect, test } from "bun:test";
import { translateMessage } from "../i18n/translate";

import { commitImport, exportProgress, prepareImport } from "../backup";
import {
  BACKUP_FORMAT,
  createEnvelope,
  ENVELOPE_VERSION,
  sanitize,
} from "../persistence/backup-core";
import { __setLearnerStoreForTests, learnerDataFromBlob, learnerStore } from "../persistence/learner";
import type { LearnerData } from "../persistence/learner-types";
import { PERSIST_VERSION, type PersistedProgress } from "../persistence/migrations";
import { PROGRESS_STORAGE_KEY, useProgress, whenLearnerReady } from "../store";
import { asyncStorageMock, memFiles, memoryStorage } from "./helpers/mocks";
import freshFixture from "../__fixtures__/progress/fresh.json";
import richFixture from "../__fixtures__/progress/v0-rich.json";

const NOW = new Date(2026, 5, 15, 12, 0, 0);

function validState(): PersistedProgress {
  return JSON.parse(JSON.stringify(richFixture.state)) as PersistedProgress;
}

/** An envelope of `state` (cards/log inline in older shapes are split into the learner section). */
function wrap(state: unknown, persistVersion = 0, extra: object = {}, learner?: LearnerData) {
  const s = state as PersistedProgress;
  return JSON.stringify({
    ...createEnvelope(s, learner ?? learnerDataFromBlob(s), persistVersion, NOW),
    ...extra,
  });
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

beforeEach(async () => {
  memFiles.clear();
  asyncStorageMock.failNextSet = false;
  useProgress.setState({
    activeCourseId: "es-en",
    streak: 0,
    lastActiveDay: null,
    dailyGoal: 20,
    dailyXp: 0,
    dailyXpDay: null,
    onboardingDone: false,
    themePreference: "system",
    courses: {},
    activeDays: {},
  });
  // Let the persist middleware's own async write flush before tests seed
  // storage, so it can't race in behind a test's memoryStorage.set().
  await new Promise((r) => setTimeout(r, 0));
  memoryStorage.clear();
  __setLearnerStoreForTests(null);
});

describe("prepareImport (staged validation — never mutates)", () => {
  test("valid v0 backup round-trips and comes out migrated", () => {
    const staged = prepareImport(wrap(validState(), 0), NOW);
    expect(staged.ok).toBe(true);
    if (!staged.ok) return;
    expect(staged.state.courses["fr-en"].xp).toBe(215);
    // Import runs the same migration chain: pollution is pruned.
    expect(staged.state.courses["fr-en"].completedLessons["srs"]).toBeUndefined();
    // Unknown forward-compatible fields survive.
    expect((staged.state as Record<string, unknown>).hearts).toBe(3);
  });

  test("corrupt JSON is rejected", () => {
    const staged = prepareImport("{not json!!", NOW);
    expect(staged.ok).toBe(false);
    if (!staged.ok) expect(translateMessage("en", staged.reason)).toContain("JSON");
  });

  test("structurally invalid payloads are rejected", () => {
    expect(prepareImport("[1,2,3]", NOW).ok).toBe(false);
    expect(prepareImport(JSON.stringify({ format: "other" }), NOW).ok).toBe(false);
    expect(
      prepareImport(
        JSON.stringify({ format: BACKUP_FORMAT, envelopeVersion: 1 }),
        NOW
      ).ok
    ).toBe(false); // no state
  });

  test("a backup from a newer envelope version is rejected, not guessed at", () => {
    const staged = prepareImport(
      wrap(validState(), 0, { envelopeVersion: ENVELOPE_VERSION + 1 }),
      NOW
    );
    expect(staged.ok).toBe(false);
    if (!staged.ok) expect(translateMessage("en", staged.reason)).toContain("newer");
  });

  test("an unsupported persist version is rejected", () => {
    const staged = prepareImport(wrap(validState(), 99), NOW);
    expect(staged.ok).toBe(false);
    if (!staged.ok) expect(translateMessage("en", staged.reason)).toContain("version");
  });

  test("invariant violations are rejected (negative streak)", () => {
    const bad = validState();
    bad.streak = -5;
    const staged = prepareImport(wrap(bad, 0), NOW);
    expect(staged.ok).toBe(false);
    if (!staged.ok) expect(translateMessage("en", staged.reason)).toContain("validation");
  });

  test("invariant violations are rejected (malformed SRS entry)", () => {
    // On a non-French course: those stay legacy through v2, so the raw
    // invalid entry reaches the invariant checks untransformed. (NaN becomes
    // null in JSON, which finite checks reject.)
    const bad = validState();
    bad.courses["es-en"].srs!["evil"] = {
      interval: Number.NaN,
      ease: 2.5,
      dueAt: 0,
      streak: 0,
    };
    expect(prepareImport(wrap(bad, 0), NOW).ok).toBe(false);
  });

  test("invariant violations are rejected (malformed FSRS card in the learner section)", () => {
    // A current-version backup skips migration, so its cards are validated as-is.
    const v4 = prepareImport(wrap(validState(), 0), NOW);
    if (!v4.ok) throw new Error("stage failed");
    const bad = clone(v4.learner);
    bad.cards["fr-en"]["fr:w:homme|recognize"].stability = null as unknown as number;
    expect(prepareImport(wrap(v4.state, PERSIST_VERSION, {}, bad), NOW).ok).toBe(false);

    const badKey = clone(v4.learner);
    badKey.cards["fr-en"]["no-separator"] = badKey.cards["fr-en"]["fr:w:homme|recognize"];
    expect(prepareImport(wrap(v4.state, PERSIST_VERSION, {}, badKey), NOW).ok).toBe(false);
  });

  test("a current export round-trips: French cards and srsLegacy survive import", () => {
    const v4 = prepareImport(wrap(validState(), 0), NOW);
    if (!v4.ok) throw new Error("stage failed");
    const again = prepareImport(wrap(v4.state, PERSIST_VERSION, {}, v4.learner), NOW);
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.state).toEqual(v4.state);
    expect(again.learner).toEqual(v4.learner);
    expect(again.learner.cards["fr-en"]["fr:w:homme|recognize"].stability).toBe(3);
    expect(again.state.courses["fr-en"].srsLegacy!["l'homme"].interval).toBe(3);
    expect(again.state.courses["fr-en"].cards).toBeUndefined();
    expect(again.learner.reviewLog).toEqual([]);
  });

  test("prototype-pollution keys are stripped, not merged", () => {
    const raw = wrap(validState(), 0).replace(
      '"hearts":3',
      '"hearts":3,"__proto__":{"polluted":true}'
    );
    const staged = prepareImport(raw, NOW);
    expect(staged.ok).toBe(true);
    if (!staged.ok) return;
    expect(Object.keys(staged.state)).not.toContain("__proto__");
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe("sanitize", () => {
  test("throws on structurally unsafe values", () => {
    expect(() => sanitize({ f: () => 1 })).toThrow();
  });
});

describe("commitImport (transaction safety)", () => {
  test("happy path: safety copy written, storage committed at the latest version, store live", async () => {
    memoryStorage.set(PROGRESS_STORAGE_KEY, JSON.stringify(freshFixture));
    const staged = prepareImport(wrap(validState(), 0), NOW);
    if (!staged.ok) throw new Error("stage failed");

    const outcome = await commitImport(staged.state, staged.learner, NOW);
    expect(outcome.ok).toBe(true);

    const stored = JSON.parse(memoryStorage.get(PROGRESS_STORAGE_KEY) as string);
    expect(stored.version).toBe(PERSIST_VERSION);
    expect(stored.state.courses["fr-en"].xp).toBe(215);
    // Cards live in the learner store, never in the blob (P1d).
    expect(stored.state.courses["fr-en"].cards).toBeUndefined();
    const learner = await (await learnerStore()).exportAll();
    expect(learner.cards["fr-en"]["fr:w:homme|recognize"]).toBeDefined();
    // …and the live store has them in memory for the active course.
    expect(useProgress.getState().courses["fr-en"].cards?.["fr:w:homme|recognize"]).toBeDefined();
    expect(useProgress.getState().streak).toBe(5);
    expect(useProgress.getState().activeCourseId).toBe("fr-en");

    const backupKey = [...memFiles.keys()].find((k) =>
      k.includes("progress-before-import-")
    );
    expect(backupKey).toBeTruthy();
    const safety = JSON.parse(memFiles.get(backupKey as string) as string);
    expect(safety.format).toBe(BACKUP_FORMAT);
    expect(safety.state.activeCourseId).toBe("es-en"); // the PREVIOUS state
  });

  test("interrupted commit leaves current state untouched", async () => {
    // Seed the fresh fixture and let the store write it back in the current
    // persisted form, so the restore path's rehydrate rewrites identical bytes.
    memoryStorage.set(PROGRESS_STORAGE_KEY, JSON.stringify(freshFixture));
    await useProgress.persist.rehydrate();
    await whenLearnerReady();
    useProgress.getState().setThemePreference("system");
    await new Promise((r) => setTimeout(r, 0));
    const before = memoryStorage.get(PROGRESS_STORAGE_KEY) as string;
    expect(JSON.parse(before).version).toBe(PERSIST_VERSION);
    const staged = prepareImport(wrap(validState(), 0), NOW);
    if (!staged.ok) throw new Error("stage failed");

    asyncStorageMock.failNextSet = true; // the first commit write (learner store) fails
    const outcome = await commitImport(staged.state, staged.learner, NOW);
    expect(outcome.ok).toBe(false);
    expect(memoryStorage.get(PROGRESS_STORAGE_KEY)).toBe(before);
    expect(useProgress.getState().activeCourseId).toBe("es-en");
    expect(useProgress.getState().streak).toBe(0);
  });

  test("a rejected stage never reaches storage at all", () => {
    const before = JSON.stringify(freshFixture);
    memoryStorage.set(PROGRESS_STORAGE_KEY, before);
    const staged = prepareImport("{broken", NOW);
    expect(staged.ok).toBe(false);
    expect(memoryStorage.get(PROGRESS_STORAGE_KEY)).toBe(before);
    expect(memFiles.size).toBe(0);
  });
});

describe("exportProgress", () => {
  test("writes an envelope of the persisted state and shares it", async () => {
    memoryStorage.set(PROGRESS_STORAGE_KEY, JSON.stringify(richFixture));
    const outcome = await exportProgress(NOW);
    expect(outcome.ok).toBe(true);
    const exported = [...memFiles.entries()].find(([k]) =>
      k.includes("lingo-progress-")
    );
    expect(exported).toBeTruthy();
    const envelope = JSON.parse((exported as [string, string])[1]);
    expect(envelope.format).toBe(BACKUP_FORMAT);
    expect(envelope.persistVersion).toBe(0); // exports what's stored, as stored
    expect(envelope.state.courses["fr-en"].xp).toBe(215);
    // And the export itself re-imports cleanly.
    const roundTrip = prepareImport(JSON.stringify(envelope), NOW);
    expect(roundTrip.ok).toBe(true);
  });
});

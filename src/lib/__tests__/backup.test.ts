import { beforeEach, describe, expect, test } from "bun:test";

import { commitImport, exportProgress, prepareImport } from "../backup";
import {
  BACKUP_FORMAT,
  createEnvelope,
  ENVELOPE_VERSION,
  sanitize,
} from "../persistence/backup-core";
import type { PersistedProgress } from "../persistence/migrations";
import { PROGRESS_STORAGE_KEY, useProgress } from "../store";
import { asyncStorageMock, memFiles, memoryStorage } from "./helpers/mocks";
import freshFixture from "../__fixtures__/progress/fresh.json";
import richFixture from "../__fixtures__/progress/v0-rich.json";

const NOW = new Date(2026, 5, 15, 12, 0, 0);

function validState(): PersistedProgress {
  return JSON.parse(JSON.stringify(richFixture.state)) as PersistedProgress;
}

function wrap(state: unknown, persistVersion = 0, extra: object = {}) {
  return JSON.stringify({
    ...createEnvelope(state as PersistedProgress, persistVersion, NOW),
    ...extra,
  });
}

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
    if (!staged.ok) expect(staged.reason).toContain("JSON");
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
    if (!staged.ok) expect(staged.reason).toContain("newer");
  });

  test("an unsupported persist version is rejected", () => {
    const staged = prepareImport(wrap(validState(), 99), NOW);
    expect(staged.ok).toBe(false);
    if (!staged.ok) expect(staged.reason).toContain("version");
  });

  test("invariant violations are rejected (negative streak)", () => {
    const bad = validState();
    bad.streak = -5;
    const staged = prepareImport(wrap(bad, 0), NOW);
    expect(staged.ok).toBe(false);
    if (!staged.ok) expect(staged.reason).toContain("validation");
  });

  test("invariant violations are rejected (malformed SRS entry)", () => {
    const bad = validState();
    bad.courses["fr-en"].srs["evil"] = {
      interval: Number.NaN,
      ease: 2.5,
      dueAt: 0,
      streak: 0,
    };
    expect(prepareImport(wrap(bad, 0), NOW).ok).toBe(false);
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
  test("happy path: safety copy written, storage committed at v1, store live", async () => {
    memoryStorage.set(PROGRESS_STORAGE_KEY, JSON.stringify(freshFixture));
    const staged = prepareImport(wrap(validState(), 0), NOW);
    if (!staged.ok) throw new Error("stage failed");

    const outcome = await commitImport(staged.state, NOW);
    expect(outcome.ok).toBe(true);

    const stored = JSON.parse(memoryStorage.get(PROGRESS_STORAGE_KEY) as string);
    expect(stored.version).toBe(1);
    expect(stored.state.courses["fr-en"].xp).toBe(215);
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
    // Seed at the current persist version so the restore path's rehydrate
    // doesn't (legitimately) migrate-and-rewrite the stored form.
    const before = JSON.stringify({ state: freshFixture.state, version: 1 });
    memoryStorage.set(PROGRESS_STORAGE_KEY, before);
    const staged = prepareImport(wrap(validState(), 0), NOW);
    if (!staged.ok) throw new Error("stage failed");

    asyncStorageMock.failNextSet = true; // the commit write fails
    const outcome = await commitImport(staged.state, NOW);
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

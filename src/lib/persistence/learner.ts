/**
 * Learner-store facade (P1d): the ONE place the store talks to the learner
 * database. Responsibilities:
 *
 *  - open the platform store lazily (SQLite on device, JSON elsewhere) —
 *    a test seam can inject any LearnerStore;
 *  - the crash-safe PENDING BUFFER: every scheduler mutation is recorded as
 *    a delta (card upsert + log append, or undo = card restore + log
 *    removal), merged into one pending batch and persisted under a small
 *    AsyncStorage key after every change — so the blob is never
 *    re-serialised per answer and a crash never loses an answered step;
 *  - FLUSH: at session completion (and before a backup, a course switch
 *    or an import) the pending batch is committed as ONE transaction and
 *    the buffer cleared; on launch any left-over buffer is replayed first
 *    (idempotent: the store ignores a row it already has);
 *  - the one-time v4 import of the cards/review log that pre-v4 blobs
 *    carried (safety copy first; counts verified; idempotent);
 *  - per-course lazy loading of the in-memory slice the engine uses.
 *
 * No React, no store import here: the store calls in, this module calls
 * the LearnerStore. Pure helpers are exported for the tests.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import type { ReviewLogEntry } from "../learning/review-log";
import { REVIEW_LOG_CAP } from "../learning/review-log";
import type { FsrsCardState } from "../learning/scheduler";

import { openLearnerStore } from "./learner-db";
import {
  LEARNER_LOG_WINDOW,
  LEARNER_META,
  emptyBatch,
  isEmptyBatch,
  logRefOf,
  mergeBatch,
  sameLogRef,
  type CourseLearnerSlice,
  type LearnerBatch,
  type LearnerData,
  type LearnerStore,
} from "./learner-types";

export const LEARNER_PENDING_KEY = "learner-pending-v4";

/**
 * The pre-v4 safety copy: the cards/review log a blob carried, written to
 * the documents directory (`progress-before-v4-<stamp>.json`) before the
 * one-time import — like the import flow's own safety copy. Best effort:
 * a file-system failure must never block the import itself.
 */
export async function writeLearnerSafetyCopy(data: LearnerData, now = new Date()): Promise<void> {
  try {
    const { File, Paths } = await import("expo-file-system");
    const name = `progress-before-v4-${now.toISOString().replace(/[:.]/g, "-")}.json`;
    const file = new File(Paths.document, name);
    try {
      file.create({ intermediates: true, overwrite: true });
    } catch {
      // Some platforms create on write.
    }
    file.write(JSON.stringify({ format: "lingo-progress-learner-v4-safety", exportedAt: now.toISOString(), learner: data }));
  } catch (error) {
    console.warn("learner store: could not write the pre-v4 safety copy", error);
  }
}

type KeyValue = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<void>; removeItem(key: string): Promise<void> };

let storePromise: Promise<LearnerStore> | null = null;
let injected: LearnerStore | null = null;
let kv: KeyValue = AsyncStorage;
let pending: LearnerBatch = emptyBatch();
let pendingWrite: Promise<void> = Promise.resolve();

/** Test seam: inject a LearnerStore (and optionally the key-value storage); null = reset to the platform default. */
export function __setLearnerStoreForTests(store: LearnerStore | null, storage?: KeyValue): void {
  injected = store;
  storePromise = null;
  pending = emptyBatch();
  pendingWrite = Promise.resolve();
  kv = storage ?? AsyncStorage;
}

export function learnerStore(): Promise<LearnerStore> {
  if (injected) return Promise.resolve(injected);
  if (!storePromise) storePromise = openLearnerStore();
  return storePromise;
}

/** The pending batch (for tests and diagnostics). */
export function pendingLearnerBatch(): LearnerBatch {
  return pending;
}

function persistPending(): Promise<void> {
  const snapshot = pending;
  pendingWrite = pendingWrite
    .then(() =>
      isEmptyBatch(snapshot)
        ? kv.removeItem(LEARNER_PENDING_KEY)
        : kv.setItem(LEARNER_PENDING_KEY, JSON.stringify(snapshot))
    )
    .catch((error) => {
      console.warn("learner store: could not persist the pending buffer", error);
    });
  return pendingWrite;
}

/**
 * Record a scheduler delta. Synchronous for the store (memory is the
 * truth during a session); the buffer write is queued.
 */
export function recordLearnerDelta(delta: LearnerBatch): void {
  pending = mergeBatch(pending, delta);
  void persistPending();
}

/** Commit the pending buffer as one transaction, then clear it. Safe to call when empty. */
export async function flushLearnerWrites(): Promise<void> {
  await pendingWrite;
  if (isEmptyBatch(pending)) return;
  const batch = pending;
  const store = await learnerStore();
  await store.commit(batch);
  // Only the committed delta leaves the buffer — deltas recorded while the
  // commit ran stay pending for the next flush.
  pending = subtractBatch(pending, batch);
  await persistPending();
}

/** Remove a committed batch from the pending batch (what arrived during the commit stays). */
export function subtractBatch(current: LearnerBatch, committed: LearnerBatch): LearnerBatch {
  if (current === committed) return emptyBatch();
  const committedUpserts = new Set(committed.cardUpserts.map((u) => `${u.courseId}\u0000${u.cardKey}\u0000${JSON.stringify(u.card)}`));
  const committedAppends = committed.logAppends.map(logRefOf);
  const committedRemovals = committed.logRemovals;
  return {
    cardUpserts: current.cardUpserts.filter((u) => !committedUpserts.has(`${u.courseId}\u0000${u.cardKey}\u0000${JSON.stringify(u.card)}`)),
    logAppends: current.logAppends.filter((e) => !committedAppends.some((r) => sameLogRef(r, logRefOf(e)))),
    logRemovals: current.logRemovals.filter((r) => !committedRemovals.some((c) => sameLogRef(c, r))),
  };
}

/** On launch: commit a buffer a crash left behind (idempotent on the store side). */
export async function replayPendingLearnerWrites(): Promise<number> {
  const raw = await kv.getItem(LEARNER_PENDING_KEY);
  if (!raw) return 0;
  let batch: LearnerBatch;
  try {
    const parsed = JSON.parse(raw) as Partial<LearnerBatch>;
    batch = {
      cardUpserts: Array.isArray(parsed.cardUpserts) ? parsed.cardUpserts : [],
      logAppends: Array.isArray(parsed.logAppends) ? parsed.logAppends : [],
      logRemovals: Array.isArray(parsed.logRemovals) ? parsed.logRemovals : [],
    };
  } catch {
    console.warn("learner store: discarding an unreadable pending buffer");
    await kv.removeItem(LEARNER_PENDING_KEY);
    return 0;
  }
  const store = await learnerStore();
  await store.commit(batch);
  await kv.removeItem(LEARNER_PENDING_KEY);
  return batch.cardUpserts.length + batch.logAppends.length + batch.logRemovals.length;
}

// ---------------------------------------------------------------------------
// Pure helpers shared with the migration/backup paths
// ---------------------------------------------------------------------------

/** The cards + review log a pre-v4 blob (or v1 backup) carries inline. */
export function learnerDataFromBlob(state: {
  courses?: Record<string, { cards?: Record<string, FsrsCardState> } | undefined>;
  reviewLog?: ReviewLogEntry[];
}): LearnerData {
  const cards: LearnerData["cards"] = {};
  for (const [courseId, course] of Object.entries(state.courses ?? {})) {
    if (course?.cards && typeof course.cards === "object" && Object.keys(course.cards).length > 0) {
      cards[courseId] = { ...course.cards };
    }
  }
  return { cards, reviewLog: Array.isArray(state.reviewLog) ? [...state.reviewLog] : [] };
}

export function blobCarriesLearnerData(state: {
  courses?: Record<string, { cards?: Record<string, FsrsCardState> } | undefined>;
  reviewLog?: ReviewLogEntry[];
}): boolean {
  if (Array.isArray(state.reviewLog) && state.reviewLog.length > 0) return true;
  return Object.values(state.courses ?? {}).some((c) => !!c?.cards && Object.keys(c.cards).length > 0);
}

/** Merge a loaded slice under the in-memory state (memory wins; log entries deduplicated, oldest first, ring-capped). */
export function mergeCourseSlice(
  memoryCards: Record<string, FsrsCardState> | undefined,
  memoryLog: readonly ReviewLogEntry[],
  courseId: string,
  slice: CourseLearnerSlice
): { cards: Record<string, FsrsCardState>; reviewLog: ReviewLogEntry[] } {
  const cards = { ...slice.cards, ...(memoryCards ?? {}) };
  const refs = memoryLog.map(logRefOf);
  const fromStore = slice.reviewLog.filter((e) => e.courseId === courseId && !refs.some((r) => sameLogRef(r, logRefOf(e))));
  const merged = [...memoryLog, ...fromStore].sort((a, b) => a.at - b.at);
  return { cards, reviewLog: merged.length > REVIEW_LOG_CAP ? merged.slice(merged.length - REVIEW_LOG_CAP) : merged };
}

// ---------------------------------------------------------------------------
// Bootstrap (first launch after v4, every launch after)
// ---------------------------------------------------------------------------

export type BootstrapInput = {
  /** The hydrated in-memory state's courses (may still carry pre-v4 cards). */
  courses: Record<string, { cards?: Record<string, FsrsCardState> } | undefined>;
  reviewLog: ReviewLogEntry[];
  activeCourseId: string;
  /** Writes the pre-v4 safety copy (`progress-before-v4-*.json`); platform I/O lives in the caller. */
  writeSafetyCopy: (data: LearnerData) => Promise<void>;
  now?: Date;
};

export type BootstrapResult = {
  store: LearnerStore;
  replayed: number;
  imported: { cards: number; reviewLog: number } | null;
  /** The active course's slice merged under memory (what the store should set). */
  active: { cards: Record<string, FsrsCardState>; reviewLog: ReviewLogEntry[] };
};

/**
 * 1. replay a left-over pending buffer; 2. if the blob still carries cards
 * or a review log (first launch after v4, or a crash before the strip),
 * import them into the store inside ONE transaction, verify the counts,
 * record the import; 3. load the active course's slice.
 */
export async function bootstrapLearner(input: BootstrapInput): Promise<BootstrapResult> {
  const store = await learnerStore();
  const replayed = await replayPendingLearnerWrites();
  let imported: BootstrapResult["imported"] = null;
  if (blobCarriesLearnerData(input)) {
    const data = learnerDataFromBlob(input);
    await input.writeSafetyCopy(data);
    const before = await store.counts();
    const batch: LearnerBatch = {
      cardUpserts: Object.entries(data.cards).flatMap(([courseId, cards]) =>
        Object.entries(cards).map(([cardKey, card]) => ({ courseId, cardKey, card }))
      ),
      logAppends: data.reviewLog,
      logRemovals: [],
    };
    await store.commit(batch);
    const after = await store.counts();
    const expectedCards = Object.values(data.cards).reduce((n, c) => n + Object.keys(c).length, 0);
    // Every imported card must now exist and the log can only have grown
    // (a row the store already had — a crash after a previous import —
    // is ignored by identity, never lost).
    if (after.cards < expectedCards || after.reviewLog < before.reviewLog) {
      throw new Error(`learner import verification failed (cards ${before.cards}→${after.cards}, log ${before.reviewLog}→${after.reviewLog})`);
    }
    await store.setMeta(LEARNER_META.blobImportedAt, (input.now ?? new Date()).toISOString());
    imported = { cards: expectedCards, reviewLog: data.reviewLog.length };
  }
  const slice = await store.loadCourse(input.activeCourseId, LEARNER_LOG_WINDOW);
  const active = mergeCourseSlice(input.courses[input.activeCourseId]?.cards, input.reviewLog, input.activeCourseId, slice);
  return { store, replayed, imported, active };
}

/** Load one course's slice (course switch). */
export async function loadCourseLearnerSlice(courseId: string): Promise<CourseLearnerSlice> {
  await flushLearnerWrites();
  const store = await learnerStore();
  return store.loadCourse(courseId, LEARNER_LOG_WINDOW);
}

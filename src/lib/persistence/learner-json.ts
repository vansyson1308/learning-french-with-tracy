/**
 * JSON learner store (P1d): the web tier and the test tier. One
 * AsyncStorage document holds every card and log entry under the SAME
 * interface as the SQLite store (learner-sql.ts). A commit is a
 * read-modify-write of that one document, so it is atomic at the
 * AsyncStorage level; the pending buffer makes an interrupted commit
 * replayable. Entries are deduplicated by their LogRef identity, mirroring
 * the SQL store's unique index.
 */

import type { ReviewLogEntry } from "../learning/review-log";

import {
  LEARNER_LOG_WINDOW,
  LEARNER_META,
  LEARNER_SCHEMA_VERSION,
  emptyLearnerData,
  logRefOf,
  normalizeLearnerCards,
  sameLogRef,
  targetCodeOfCourse,
  type CourseLearnerSlice,
  type LearnerBatch,
  type LearnerData,
  type LearnerStore,
} from "./learner-types";

export const LEARNER_JSON_KEY = "learner-v4";

export type KeyValueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

type Document = LearnerData & { meta: Record<string, string> };

function emptyDocument(): Document {
  return { ...emptyLearnerData(), meta: { [LEARNER_META.schemaVersion]: String(LEARNER_SCHEMA_VERSION) } };
}

export class JsonLearnerStore implements LearnerStore {
  readonly kind = "json" as const;

  constructor(private readonly storage: KeyValueStorage, private readonly key = LEARNER_JSON_KEY) {}

  private async read(): Promise<Document> {
    const raw = await this.storage.getItem(this.key);
    if (!raw) return emptyDocument();
    const parsed = JSON.parse(raw) as Partial<Document>;
    const meta = parsed.meta && typeof parsed.meta === "object" ? parsed.meta : emptyDocument().meta;
    const rawCards = parsed.cards && typeof parsed.cards === "object" ? parsed.cards : {};
    // Schema v1 (P1d) keyed cards by course; v2 (P2b) keys them by target
    // language. Re-key on read (newest evidence wins) and persist the
    // upgraded document once.
    const upgrade = meta[LEARNER_META.schemaVersion] !== String(LEARNER_SCHEMA_VERSION);
    const doc: Document = {
      cards: upgrade ? normalizeLearnerCards(rawCards) : rawCards,
      reviewLog: Array.isArray(parsed.reviewLog) ? parsed.reviewLog : [],
      meta: upgrade ? { ...meta, [LEARNER_META.schemaVersion]: String(LEARNER_SCHEMA_VERSION) } : meta,
    };
    if (upgrade) await this.write(doc);
    return doc;
  }

  private async write(doc: Document): Promise<void> {
    await this.storage.setItem(this.key, JSON.stringify(doc));
  }

  async loadCourse(courseId: string, logWindow = LEARNER_LOG_WINDOW): Promise<CourseLearnerSlice> {
    const doc = await this.read();
    const mine = doc.reviewLog.filter((e) => e.courseId === courseId);
    return { cards: { ...(doc.cards[targetCodeOfCourse(courseId)] ?? {}) }, reviewLog: mine.slice(Math.max(0, mine.length - logWindow)) };
  }

  async commit(batch: LearnerBatch): Promise<void> {
    const doc = await this.read();
    for (const u of batch.cardUpserts) (doc.cards[targetCodeOfCourse(u.courseId)] ??= {})[u.cardKey] = u.card;
    const known = doc.reviewLog.map(logRefOf);
    const appended: ReviewLogEntry[] = [];
    for (const e of batch.logAppends) {
      const ref = logRefOf(e);
      if (known.some((k) => sameLogRef(k, ref))) continue; // idempotent replay
      known.push(ref);
      appended.push(e);
    }
    let log = [...doc.reviewLog, ...appended];
    for (const r of batch.logRemovals) {
      const index = log.findIndex((e) => sameLogRef(logRefOf(e), r));
      if (index >= 0) log = [...log.slice(0, index), ...log.slice(index + 1)];
    }
    await this.write({ ...doc, reviewLog: log });
  }

  async counts(): Promise<{ cards: number; reviewLog: number }> {
    const doc = await this.read();
    const cards = Object.values(doc.cards).reduce((n, byKey) => n + Object.keys(byKey).length, 0);
    return { cards, reviewLog: doc.reviewLog.length };
  }

  async exportAll(): Promise<LearnerData> {
    const doc = await this.read();
    return { cards: doc.cards, reviewLog: doc.reviewLog };
  }

  async replaceAll(data: LearnerData): Promise<void> {
    const doc = await this.read();
    await this.write({ cards: normalizeLearnerCards(data.cards), reviewLog: data.reviewLog, meta: doc.meta });
  }

  async getMeta(key: string): Promise<string | null> {
    return (await this.read()).meta[key] ?? null;
  }

  async setMeta(key: string, value: string): Promise<void> {
    const doc = await this.read();
    await this.write({ ...doc, meta: { ...doc.meta, [key]: value } });
  }
}

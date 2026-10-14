/**
 * The SQL learner store (P1d), executor-agnostic exactly like the lexicon's
 * native-sql.ts: the same statements run on expo-sqlite on device and on
 * bun:sqlite in tests, so the tested logic IS the shipped logic. Every
 * statement binds parameters; nothing from learner data is ever
 * concatenated into SQL.
 *
 * Tables:
 *   meta(key, value)
 *   cards(target_code, item_id, skill, state_json, due, updated_at, course_id)   PK (target_code, item_id, skill)
 *     — shared per TARGET language since P2b (D-4); course_id = provenance of the last write
 *   review_log(seq, course_id, at, card_key, session_id, exercise_id, attempt_index, entry_json)
 *     UNIQUE (course_id, at, card_key, session_id, exercise_id, attempt_index) — the LogRef identity;
 *     INSERT OR IGNORE makes a replayed pending buffer idempotent.
 */

import { parseCardKey } from "../learning/card-key";
import type { ReviewLogEntry } from "../learning/review-log";
import type { FsrsCardState } from "../learning/scheduler";

import {
  LEARNER_LOG_WINDOW,
  normalizeLearnerCards,
  targetCodeOfCourse,
  LEARNER_META,
  LEARNER_SCHEMA_VERSION,
  type CourseLearnerSlice,
  type LearnerBatch,
  type LearnerCards,
  type LearnerData,
  type LearnerStore,
} from "./learner-types";

export const LEARNER_DB_NAME = "learner-v4.db";

export type SqlParam = string | number | null;

/** The executor surface both expo-sqlite and bun:sqlite can provide. */
export type LearnerSqlExecutor = {
  run(sql: string, params?: SqlParam[]): Promise<void>;
  all<T>(sql: string, params?: SqlParam[]): Promise<T[]>;
  first<T>(sql: string, params?: SqlParam[]): Promise<T | null>;
  /** Run `fn` inside BEGIN … COMMIT; any throw rolls back and rethrows. */
  transaction(fn: () => Promise<void>): Promise<void>;
};

export const LEARNER_DDL = [
  `CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS cards (
    target_code TEXT NOT NULL,
    item_id TEXT NOT NULL,
    skill TEXT NOT NULL,
    state_json TEXT NOT NULL,
    due INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    course_id TEXT NOT NULL,
    PRIMARY KEY (target_code, item_id, skill)
  )`,
  `CREATE TABLE IF NOT EXISTS review_log (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id TEXT NOT NULL,
    at INTEGER NOT NULL,
    card_key TEXT NOT NULL,
    session_id TEXT NOT NULL,
    exercise_id TEXT NOT NULL,
    attempt_index INTEGER NOT NULL,
    entry_json TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS review_log_identity
    ON review_log (course_id, at, card_key, session_id, exercise_id, attempt_index)`,
  `CREATE INDEX IF NOT EXISTS review_log_course_seq ON review_log (course_id, seq)`,
];

/**
 * Schema v1 → v2 (P2b): cards re-keyed from course to target language.
 * Newest write wins on a collision; course_id is kept as provenance.
 */
export const LEARNER_MIGRATE_CARDS_V2 = [
  `CREATE TABLE cards_v2 (
    target_code TEXT NOT NULL,
    item_id TEXT NOT NULL,
    skill TEXT NOT NULL,
    state_json TEXT NOT NULL,
    due INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    course_id TEXT NOT NULL,
    PRIMARY KEY (target_code, item_id, skill)
  )`,
  `INSERT OR REPLACE INTO cards_v2 (target_code, item_id, skill, state_json, due, updated_at, course_id)
    SELECT CASE WHEN instr(course_id, '-') > 0 THEN substr(course_id, 1, instr(course_id, '-') - 1) ELSE course_id END,
           item_id, skill, state_json, due, updated_at, course_id
    FROM cards ORDER BY updated_at ASC`,
  `DROP TABLE cards`,
  `ALTER TABLE cards_v2 RENAME TO cards`,
] as const;

export const SQL = {
  upsertCard: `INSERT INTO cards (target_code, item_id, skill, state_json, due, updated_at, course_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (target_code, item_id, skill) DO UPDATE SET
      state_json = excluded.state_json, due = excluded.due, updated_at = excluded.updated_at, course_id = excluded.course_id`,
  cardColumns: `PRAGMA table_info(cards)`,
  cardsIndex: `CREATE INDEX IF NOT EXISTS cards_target_due ON cards (target_code, due)`,
  appendLog: `INSERT OR IGNORE INTO review_log
    (course_id, at, card_key, session_id, exercise_id, attempt_index, entry_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
  removeLog: `DELETE FROM review_log
    WHERE course_id = ? AND at = ? AND card_key = ? AND session_id = ? AND exercise_id = ? AND attempt_index = ?`,
  targetCards: `SELECT item_id, skill, state_json FROM cards WHERE target_code = ? ORDER BY item_id, skill`,
  courseLogTail: `SELECT entry_json FROM review_log WHERE course_id = ? ORDER BY seq DESC LIMIT ?`,
  allCards: `SELECT target_code, item_id, skill, state_json FROM cards ORDER BY target_code, item_id, skill`,
  allLog: `SELECT entry_json FROM review_log ORDER BY seq`,
  countCards: `SELECT COUNT(*) AS n FROM cards`,
  countLog: `SELECT COUNT(*) AS n FROM review_log`,
  deleteAllCards: `DELETE FROM cards`,
  deleteAllLog: `DELETE FROM review_log`,
  getMeta: `SELECT value FROM meta WHERE key = ?`,
  setMeta: `INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
} as const;

function splitCardKey(cardKey: string): { itemId: string; skill: string } {
  const parsed = parseCardKey(cardKey);
  if (parsed) return parsed;
  // A key this module could not have produced is still stored verbatim
  // (never dropped): the whole key as item id, skill "unknown".
  return { itemId: cardKey, skill: "unknown" };
}

function joinCardKey(itemId: string, skill: string): string {
  return skill === "unknown" ? itemId : `${itemId}|${skill}`;
}

export class SqlLearnerStore implements LearnerStore {
  readonly kind = "sqlite" as const;

  constructor(private readonly exec: LearnerSqlExecutor) {}

  /** Create the schema when missing; migrate a v1 (course-keyed) cards table; idempotent. */
  async init(): Promise<void> {
    for (const statement of LEARNER_DDL) await this.exec.run(statement);
    const columns = await this.exec.all<{ name: string }>(SQL.cardColumns);
    if (!columns.some((c) => c.name === "target_code")) {
      await this.exec.transaction(async () => {
        for (const statement of LEARNER_MIGRATE_CARDS_V2) await this.exec.run(statement);
      });
    }
    // The cards index is created after the (possible) migration: on a v1
    // table the column does not exist yet.
    await this.exec.run(SQL.cardsIndex);
    await this.setMeta(LEARNER_META.schemaVersion, String(LEARNER_SCHEMA_VERSION));
  }

  async loadCourse(courseId: string, logWindow = LEARNER_LOG_WINDOW): Promise<CourseLearnerSlice> {
    // Cards are the TARGET language's (shared across its courses); the log tail is the course's own.
    const cardRows = await this.exec.all<{ item_id: string; skill: string; state_json: string }>(SQL.targetCards, [targetCodeOfCourse(courseId)]);
    const cards: Record<string, FsrsCardState> = {};
    for (const row of cardRows) cards[joinCardKey(row.item_id, row.skill)] = JSON.parse(row.state_json) as FsrsCardState;
    const logRows = await this.exec.all<{ entry_json: string }>(SQL.courseLogTail, [courseId, logWindow]);
    const reviewLog = logRows.map((row) => JSON.parse(row.entry_json) as ReviewLogEntry).reverse();
    return { cards, reviewLog };
  }

  async commit(batch: LearnerBatch): Promise<void> {
    await this.exec.transaction(async () => {
      const now = Date.now();
      for (const u of batch.cardUpserts) {
        const { itemId, skill } = splitCardKey(u.cardKey);
        await this.exec.run(SQL.upsertCard, [targetCodeOfCourse(u.courseId), itemId, skill, JSON.stringify(u.card), u.card.due, now, u.courseId]);
      }
      for (const e of batch.logAppends) {
        await this.exec.run(SQL.appendLog, [e.courseId, e.at, e.cardKey, e.sessionId, e.exerciseId, e.attemptIndex, JSON.stringify(e)]);
      }
      for (const r of batch.logRemovals) {
        await this.exec.run(SQL.removeLog, [r.courseId, r.at, r.cardKey, r.sessionId, r.exerciseId, r.attemptIndex]);
      }
    });
  }

  async counts(): Promise<{ cards: number; reviewLog: number }> {
    const cards = await this.exec.first<{ n: number }>(SQL.countCards);
    const reviewLog = await this.exec.first<{ n: number }>(SQL.countLog);
    return { cards: cards?.n ?? 0, reviewLog: reviewLog?.n ?? 0 };
  }

  async exportAll(): Promise<LearnerData> {
    const cardRows = await this.exec.all<{ target_code: string; item_id: string; skill: string; state_json: string }>(SQL.allCards);
    const cards: LearnerCards = {};
    for (const row of cardRows) {
      (cards[row.target_code] ??= {})[joinCardKey(row.item_id, row.skill)] = JSON.parse(row.state_json) as FsrsCardState;
    }
    const logRows = await this.exec.all<{ entry_json: string }>(SQL.allLog);
    return { cards, reviewLog: logRows.map((row) => JSON.parse(row.entry_json) as ReviewLogEntry) };
  }

  async replaceAll(data: LearnerData): Promise<void> {
    await this.exec.transaction(async () => {
      await this.exec.run(SQL.deleteAllLog);
      await this.exec.run(SQL.deleteAllCards);
      const now = Date.now();
      // A backup written before P2b keys cards by course; re-key by target.
      for (const [targetCode, cards] of Object.entries(normalizeLearnerCards(data.cards))) {
        for (const [cardKey, card] of Object.entries(cards)) {
          const { itemId, skill } = splitCardKey(cardKey);
          await this.exec.run(SQL.upsertCard, [targetCode, itemId, skill, JSON.stringify(card), card.due, now, targetCode]);
        }
      }
      for (const e of data.reviewLog) {
        await this.exec.run(SQL.appendLog, [e.courseId, e.at, e.cardKey, e.sessionId, e.exerciseId, e.attemptIndex, JSON.stringify(e)]);
      }
    });
  }

  async getMeta(key: string): Promise<string | null> {
    const row = await this.exec.first<{ value: string }>(SQL.getMeta, [key]);
    return row?.value ?? null;
  }

  async setMeta(key: string, value: string): Promise<void> {
    await this.exec.run(SQL.setMeta, [key, value]);
  }
}

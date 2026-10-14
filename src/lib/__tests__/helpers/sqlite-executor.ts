/**
 * bun:sqlite executor for the learner SQL store (P1d): the SAME statements
 * expo-sqlite runs on device, executed here against an in-memory or
 * temp-file database, so tests exercise the shipped SQL.
 */
import { Database } from "bun:sqlite";

import type { LearnerSqlExecutor, SqlParam } from "../../persistence/learner-sql";

export function bunSqliteExecutor(db: Database): LearnerSqlExecutor {
  return {
    async run(sql: string, params: SqlParam[] = []) {
      db.query(sql).run(...(params as never[]));
    },
    async all<T>(sql: string, params: SqlParam[] = []) {
      return db.query(sql).all(...(params as never[])) as T[];
    },
    async first<T>(sql: string, params: SqlParam[] = []) {
      return (db.query(sql).get(...(params as never[])) as T | undefined) ?? null;
    },
    async transaction(fn) {
      db.exec("BEGIN");
      try {
        await fn();
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

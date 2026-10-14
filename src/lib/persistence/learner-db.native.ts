/**
 * Native learner-store opener (P1d): one expo-sqlite database
 * (`SQLite/learner-v4.db` in the app's document directory — never a
 * bundled asset, never shared) behind the executor-agnostic SQL store.
 * Fail-soft: if the native module is missing (jest), the open fails or
 * the schema cannot be created, the JSON store takes over so learning
 * never depends on SQLite being healthy.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import { JsonLearnerStore } from "./learner-json";
import { LEARNER_DB_NAME, SqlLearnerStore, type LearnerSqlExecutor, type SqlParam } from "./learner-sql";
import type { LearnerStore } from "./learner-types";

export async function openLearnerStore(): Promise<LearnerStore> {
  try {
    const sqlite = await import("expo-sqlite");
    const db = await sqlite.openDatabaseAsync(LEARNER_DB_NAME);
    await db.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    const exec: LearnerSqlExecutor = {
      async run(sql, params: SqlParam[] = []) {
        await db.runAsync(sql, params);
      },
      all<T>(sql: string, params: SqlParam[] = []) {
        return db.getAllAsync<T>(sql, params);
      },
      first<T>(sql: string, params: SqlParam[] = []) {
        return db.getFirstAsync<T>(sql, params);
      },
      transaction(fn) {
        return db.withExclusiveTransactionAsync(async () => {
          await fn();
        });
      },
    };
    const store = new SqlLearnerStore(exec);
    await store.init();
    return store;
  } catch (error) {
    console.warn("learner store: SQLite unavailable, using the JSON store", error);
    return new JsonLearnerStore(AsyncStorage);
  }
}

/**
 * NativeSqliteLexiconRepository — LexiconRepository over the prebuilt
 * SQLite asset via expo-sqlite. Read-only by contract; every statement is
 * parameterized (expo-sqlite's getAllAsync/getFirstAsync bind parameters —
 * no user input is ever concatenated into SQL). All query logic lives in
 * the executor-agnostic pipelines in ./native-sql, which the build-time
 * parity tests run against the committed database with bun:sqlite — the
 * tested logic IS the shipped logic.
 */

import type { SQLiteDatabase } from "expo-sqlite";

import {
  SQL,
  runNativeGetById,
  runNativeList,
  runNativeSearch,
  type SqlExecutor,
} from "./native-sql";
import type {
  LexemeDetail,
  LexemeExample,
  LexemeSummary,
  LexiconRepository,
  ListOptions,
} from "./types";

export class NativeSqliteLexiconRepository implements LexiconRepository {
  private readonly exec: SqlExecutor;

  constructor(db: SQLiteDatabase) {
    this.exec = {
      all: <T>(sql: string, params: (string | number)[]) => db.getAllAsync<T>(sql, params),
      first: <T>(sql: string, params: (string | number)[]) => db.getFirstAsync<T>(sql, params),
    };
  }

  getById(id: string): Promise<LexemeDetail | null> {
    return runNativeGetById(this.exec, id);
  }

  search(query: string): Promise<LexemeSummary[]> {
    return runNativeSearch(this.exec, query);
  }

  list(options?: ListOptions): Promise<LexemeSummary[]> {
    return runNativeList(this.exec, options);
  }

  async getExamples(id: string): Promise<LexemeExample[]> {
    return this.exec.all<LexemeExample>(SQL.examples, [id]);
  }

  async supportsFrequencySort(): Promise<boolean> {
    const row = await this.exec.first<{ n: number }>(SQL.anyFrequency, []);
    return (row?.n ?? 0) > 0;
  }
}

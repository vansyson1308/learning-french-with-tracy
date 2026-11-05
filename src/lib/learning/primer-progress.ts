/**
 * Script primer checkpoint record (P4c, persisted from v9): the courses whose
 * primer checkpoint the learner passed (courseId → true): the kana check, and
 * from P4d the tone and pinyin check of zh courses (same record, no new
 * migration). A course whose profile sets `romajiUntilPrimer` shows a romaji
 * line under Japanese text until its entry exists; for any other course the
 * entry only marks the primer card "passed". Only a pass is stored — a failed attempt changes
 * nothing, and nothing here locks a lesson. Dependency-free so the
 * persistence layer can use the normaliser.
 */

/** Stored per course id; an absent key means "not passed". */
export type PrimerPassedRecord = Record<string, true>;

/** Keep only `courseId → true` entries (imported / migrated data). */
export function normalizePrimerPassed(value: unknown): PrimerPassedRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: PrimerPassedRecord = {};
  for (const [courseId, passed] of Object.entries(value as Record<string, unknown>)) {
    if (courseId.length > 0 && passed === true) out[courseId] = true;
  }
  return out;
}

/** Whether a record is well formed (backup import invariants). */
export function isPrimerPassedRecord(value: unknown): value is PrimerPassedRecord {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.values(value as Record<string, unknown>).every((v) => v === true);
}

export function primerPassedFor(record: PrimerPassedRecord | undefined, courseId: string): boolean {
  return record?.[courseId] === true;
}

/**
 * The learner's "new words a day" setting (P3e) — dependency-free so the
 * persistence layer (migrations, backup) can use it without loading content.
 */
export const DAILY_NEW_WORDS_DEFAULT = 5;
export const DAILY_NEW_WORDS_MAX = 15;

/** Clamp a stored / imported setting to the allowed range. */
export function normalizeDailyNewWords(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : DAILY_NEW_WORDS_DEFAULT;
  return Math.min(DAILY_NEW_WORDS_MAX, Math.max(0, n));
}

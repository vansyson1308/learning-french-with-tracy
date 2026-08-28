/**
 * Phase 6 learner assessment state (§42-43, §60, §79). Deliberately COMPACT:
 * checkpoint attempts and one placement result — objective states are
 * DERIVED at read time from static content + completedLessons + these
 * records (§43), never duplicated as persisted summaries.
 *
 * This is learner state (AsyncStorage via the store), never the immutable
 * lexicon SQLite (§162). It is orthogonal to FSRS: nothing here schedules,
 * decays, or touches lexical memory (§41, §56).
 */

/** One scored item outcome. `correct: null` = explicit "I don't know" (§117). */
export type AssessmentItemResult = {
  itemId: string;
  correct: boolean | null;
};

/** Per-objective outcome of one checkpoint attempt (§61). */
export type CheckpointObjectiveResult = {
  objectiveId: string;
  result: "demonstrated" | "needs_practice" | "insufficient_evidence";
  correct: number;
  total: number;
};

/** One completed checkpoint attempt (§60, §66). First-attempt answers only. */
export type CheckpointAttempt = {
  checkpointId: string;
  /** Content version of the checkpoint definition when attempted (§66). */
  checkpointVersion: number;
  startedAt: number;
  completedAt: number;
  itemResults: AssessmentItemResult[];
  objectiveResults: CheckpointObjectiveResult[];
  /** Share of items answered correctly on first attempt, 0..1. */
  overallCorrectShare: number;
};

/** Per-objective placement estimate (§80): never "demonstrated". */
export type PlacementObjectiveEstimate = {
  objectiveId: string;
  estimate: "comfortable" | "gap" | "unknown";
};

/** The persisted placement outcome (§79). */
export type PlacementResult = {
  placementVersion: number;
  completedAt: number;
  /** Lesson the learner is recommended to start from. */
  recommendedLessonId: string;
  /** Global PATH index of that lesson (the access floor, §82). */
  recommendedFloorIndex: number;
  objectiveEstimates: PlacementObjectiveEstimate[];
  itemResults: AssessmentItemResult[];
};

/**
 * The persisted container (top-level store field from persist v3).
 * placementFloor is the ACCEPTED access floor (global lesson index; 0 for
 * everyone who starts from the beginning and for all pre-v3 users, §89).
 * Accepting a placement recommendation sets it; resetting restores 0
 * without touching completedLessons/FSRS/XP (§86).
 */
export type PersistedAssessmentState = {
  checkpointAttempts: CheckpointAttempt[];
  placement?: PlacementResult;
  placementFloor: number;
};

export function emptyAssessmentState(): PersistedAssessmentState {
  return { checkpointAttempts: [], placementFloor: 0 };
}

/**
 * Retention cap (§164): keep the most recent attempts per checkpoint. The
 * latest attempt is never discarded; older history beyond the cap is.
 */
export const CHECKPOINT_ATTEMPTS_KEPT_PER_ID = 5;

export function capCheckpointAttempts(
  attempts: CheckpointAttempt[]
): CheckpointAttempt[] {
  const byId = new Map<string, CheckpointAttempt[]>();
  for (const attempt of attempts) {
    const list = byId.get(attempt.checkpointId) ?? [];
    list.push(attempt);
    byId.set(attempt.checkpointId, list);
  }
  const kept = new Set<CheckpointAttempt>();
  for (const list of byId.values()) {
    for (const attempt of list.slice(-CHECKPOINT_ATTEMPTS_KEPT_PER_ID)) kept.add(attempt);
  }
  return attempts.filter((a) => kept.has(a));
}

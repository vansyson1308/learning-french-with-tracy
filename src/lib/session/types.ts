/**
 * Session model (Phase 3). One session architecture powers PATH lessons,
 * replays, SRS review, mistakes review, and TODAY — the definition makes
 * policies explicit instead of encoding them in magic route strings.
 */

import type { EvidenceSource, SrsRole } from "../learning/evidence";
import type { Exercise, Word } from "../types";

export type SessionKind = "path" | "replay" | "review" | "mistakes" | "today";

/** TODAY session phases (informational on steps; drives summary grouping). */
export type TodayPhase = "warmup" | "new" | "mixed" | "finale";

/**
 * Explicit evidence plan attached by the session source/planner. Generated
 * steps (review/TODAY) carry their target here — they never fake authored
 * pack metadata. Authored PATH steps may omit it; the evidence layer then
 * derives eligibility from the exercise's compiler-emitted gradeTargets.
 */
export type StepEvidencePlan = {
  /** Stable item id (French) or raw surface (legacy courses). */
  itemId: string;
  /** Planner-designated role for the FIRST attempt at this step. */
  srsRole: SrsRole;
};

export type ExerciseStep = {
  type: "exercise";
  /** Unique within the session; retry re-queues the same stepId. */
  stepId: string;
  exercise: Exercise;
  evidence?: StepEvidencePlan;
  phase?: TodayPhase;
};

export type TeachStep = {
  type: "teach";
  stepId: string;
  itemId: string;
  word: Word;
  phase?: TodayPhase;
};

export type SessionStep = ExerciseStep | TeachStep;

/**
 * What finishing the session does:
 *  - "lesson":   completeLesson(lessonId, perfect) — XP, unlock, streak
 *  - "practice": recordPracticeSession() — activity only
 *  - "today":    completeTodaySession(...) — activity + bounded TODAY XP
 */
export type CompletionPolicy = "lesson" | "practice" | "today";

export type SessionDefinition = {
  kind: SessionKind;
  courseId: string;
  /** Real lesson id for PATH; sentinel ("srs"/"mistakes"/"today") otherwise. */
  lessonId: string;
  steps: SessionStep[];
  completion: CompletionPolicy;
  evidenceSource: EvidenceSource;
  /** PATH lessons record/clear mistakes; practice surfaces do not add new ones. */
  trackMistakes: boolean;
  /** French review surfaces offer undo after a scheduler mutation. */
  allowUndo: boolean;
};

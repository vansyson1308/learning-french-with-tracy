/**
 * Session model (Phase 3). One session architecture powers PATH lessons,
 * replays, SRS review, mistakes review, and TODAY — the definition makes
 * policies explicit instead of encoding them in magic route strings.
 */

import type { Skill } from "../learning/card-key";
import type { EvidenceSource, SrsRole } from "../learning/evidence";
import type { Exercise, Word } from "../types";

export type SessionKind =
  | "path"
  | "replay"
  | "review"
  | "mistakes"
  | "today"
  | "checkpoint"
  | "placement";

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
  /** Card skill dimension; omitted means "recognize" (pre-Phase-7 shape). */
  skill?: Skill;
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

/**
 * Continue-only pedagogy step (Phase 5B): renders an authored concept and
 * advances on acknowledge. Never grades, never emits evidence, never
 * touches FSRS/wordStats/XP — structurally identical to a teach step in
 * the machine, with content resolved from the compiled concepts artifact.
 */
export type ConceptStep = {
  type: "concept";
  stepId: string;
  conceptId: string;
  phase?: TodayPhase;
};

export type SessionStep = ExerciseStep | TeachStep | ConceptStep;

/**
 * What finishing the session does:
 *  - "lesson":     completeLesson(lessonId, perfect) — XP, unlock, streak
 *  - "practice":   recordPracticeSession() — activity only
 *  - "today":      completeTodaySession(...) — activity + bounded TODAY XP
 *  - "checkpoint": recordCheckpointAttempt(...) — assessment record ONLY:
 *                  no XP, no streak, no lesson completion (§59)
 *  - "placement":  the placement route stores the result — no XP, no
 *                  learning-memory mutation of any kind (§78)
 */
export type CompletionPolicy =
  | "lesson"
  | "practice"
  | "today"
  | "checkpoint"
  | "placement";

/**
 * Scored-assessment plan attached to checkpoint/placement definitions: the
 * step→objective map the completion scorer needs (§52-53). Steps in scored
 * sessions are exercises only — no teach/concept steps (§108).
 */
export type SessionAssessmentPlan = {
  checkpointId: string;
  checkpointVersion: number;
  /** Which parallel form this sitting administers (P9 §38-§39). */
  formId: string;
  formVersion: number;
  criteria: { minItemsPerObjective: number; demonstratedShare: number };
  /** stepId → objective ids the item assesses. */
  itemObjectives: Record<string, string[]>;
};

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
  /**
   * Wrong-answer policy (§55, §105): "untilCorrect" (default when absent —
   * every pre-Phase-6 session) re-queues wrong steps; "none" records the
   * first attempt and moves on — scored assessments never drill.
   */
  retryPolicy?: "untilCorrect" | "none";
  /**
   * Answer-feedback depth (§118): "full" (default when absent) shows the
   * correct answer and post-answer teaching; "minimal" acknowledges that the
   * answer was recorded without revealing it — a diagnostic must not teach
   * mid-test or leak answers into a retake.
   */
  feedbackPolicy?: "full" | "minimal";
  /**
   * Present for checkpoint sessions (§104): the step→objective scoring plan.
   * Placement sessions resolve scoring from the compiled placement plan in
   * the route instead, so they carry no per-session plan here.
   */
  assessment?: SessionAssessmentPlan;
};

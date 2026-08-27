/**
 * Session sources (Phase 3): pure builders that turn route intent + explicit
 * state into a SessionDefinition. Routes become thin adapters; magic ids
 * ("srs", "mistakes") and `alreadyCompleted` no longer leak policy across
 * the UI.
 *
 * All inputs are explicit (content, progress snapshots, now) — no store
 * reads here, so the Phase-0 freeze rule holds: the route resolves a
 * definition ONCE per session from a state snapshot, and later store writes
 * cannot reshape the running queue.
 */

import { dueFrenchReviewQueue } from "../learning/engine";
import { FR_COURSE_ID } from "../learning/ids-fr";
import { buildSrsExercises, hashSeed } from "../review-builder";
import { dueSrsWords, type CourseProgress, type MistakeRef } from "../store";
import type { SrsEntry } from "../srs";
import type { Exercise, LessonPack, Word } from "../types";

import type { ExerciseStep, SessionDefinition } from "./types";

function exerciseSteps(
  exercises: Exercise[],
  evidence?: (exercise: Exercise) => ExerciseStep["evidence"]
): ExerciseStep[] {
  return exercises.map((exercise) => ({
    type: "exercise",
    stepId: exercise.id,
    exercise,
    evidence: evidence?.(exercise),
  }));
}

export function buildPathSessionDefinition(args: {
  courseId: string;
  lesson: LessonPack;
  alreadyCompleted: boolean;
}): SessionDefinition {
  const replay = args.alreadyCompleted;
  return {
    kind: replay ? "replay" : "path",
    courseId: args.courseId,
    lessonId: args.lesson.id,
    steps: exerciseSteps(args.lesson.exercises),
    completion: replay ? "practice" : "lesson",
    evidenceSource: "lesson",
    trackMistakes: true,
    allowUndo: false,
  };
}

export function buildMistakesSessionDefinition(args: {
  courseId: string;
  mistakes: MistakeRef[];
  getLesson: (lessonId: string) => { lesson: LessonPack } | undefined;
  limit?: number;
}): SessionDefinition {
  const exercises = args.mistakes
    .map((m) => {
      const ref = args.getLesson(m.lessonId);
      return ref?.lesson.exercises.find((e) => e.id === m.exerciseId);
    })
    .filter((e): e is Exercise => !!e)
    .slice(0, args.limit ?? 10);
  return {
    kind: "mistakes",
    courseId: args.courseId,
    lessonId: "mistakes",
    steps: exerciseSteps(exercises),
    completion: "practice",
    evidenceSource: "mistakes",
    trackMistakes: false,
    allowUndo: false,
  };
}

/**
 * Spaced review. French: FSRS due queue ordered by retrievability, each
 * generated step carrying its explicit card target. Legacy: the untouched
 * dueSrsWords queue with surface-keyed evidence. Seeds derive purely from
 * the queue content, so builds are deterministic per state (Phase-0 rule).
 */
export function buildReviewSessionDefinition(args: {
  courseId: string;
  course: Pick<CourseProgress, "cards" | "srs">;
  pool: Word[];
  now?: number;
}): SessionDefinition {
  const { courseId, course, pool } = args;
  let exercises: Exercise[];
  let evidenceBySurface: Record<string, string>;

  if (courseId === FR_COURSE_ID) {
    const queue = dueFrenchReviewQueue(course.cards, args.now);
    const seed = hashSeed(queue.map((d) => `${d.surface}@${d.dueAt}`).join("|"));
    exercises = buildSrsExercises(
      queue.map((d) => d.surface),
      pool,
      seed,
      undefined,
      courseId
    );
    evidenceBySurface = Object.fromEntries(
      queue.map((d) => [d.surface, d.key.slice(0, d.key.lastIndexOf("|"))])
    );
  } else {
    const srs = (course.srs ?? {}) as Record<string, SrsEntry>;
    const due = dueSrsWords(srs, args.now);
    const seed = hashSeed(due.map((t) => `${t}@${srs[t]?.dueAt ?? 0}`).join("|"));
    exercises = buildSrsExercises(due, pool, seed, undefined, courseId);
    evidenceBySurface = Object.fromEntries(due.map((t) => [t, t]));
  }

  return {
    kind: "review",
    courseId,
    lessonId: "srs",
    steps: exerciseSteps(exercises, (exercise) => {
      const surface = exercise.type === "select" ? exercise.audioTarget : undefined;
      const itemId = surface === undefined ? undefined : evidenceBySurface[surface];
      return itemId === undefined
        ? undefined
        : { itemId, srsRole: "assessment" as const };
    }),
    completion: "practice",
    evidenceSource: "review",
    trackMistakes: false,
    allowUndo: courseId === FR_COURSE_ID,
  };
}

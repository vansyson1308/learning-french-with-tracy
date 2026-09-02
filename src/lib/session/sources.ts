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

import { selectCheckpointForm } from "../assessment/checkpoint";
import { administrationSeed, shuffleScoredOptions } from "../assessment/option-order";
import { interactionPracticeScenarios } from "../interaction/content";
import { pickDistractors } from "../learning/distractors";
import { dueFrenchReviewQueue } from "../learning/engine";
import { FR_COURSE_ID } from "../learning/ids-fr";
import type { FsrsCardState } from "../learning/scheduler";
import { listenWordClipIndex } from "../reception/content";
import { speakExerciseForItem, speakProductionIndex, speechItemFor } from "../speech/content";
import { buildSrsExercises, hashSeed, seededRng } from "../review-builder";
import { dueSrsWords, type CourseProgress, type MistakeRef } from "../store";
import type { SrsEntry } from "../srs";
import type { Exercise, LessonPack, ListeningComprehensionExercise, Pack, Word } from "../types";

import type { ExerciseStep, SessionDefinition, SessionStep } from "./types";

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

/**
 * A lesson's step plan: the explicit flow (concept steps interleaved with
 * exercises) when authored, otherwise the exercises in order. Flow
 * integrity (every entry resolves; every exercise exactly once) is a
 * compile-time content-validation guarantee; a dangling reference here is
 * a build bug and fails loudly rather than silently dropping graded work.
 */
export function lessonSteps(lesson: LessonPack): SessionStep[] {
  if (!lesson.flow) return exerciseSteps(lesson.exercises);
  const byId = new Map(lesson.exercises.map((e) => [e.id, e]));
  return lesson.flow.map((entry, i) => {
    if ("concept" in entry) {
      return { type: "concept", stepId: `concept:${i}:${entry.concept}`, conceptId: entry.concept };
    }
    const exercise = byId.get(entry.exercise);
    if (!exercise) {
      throw new Error(`lesson ${lesson.id}: flow references missing exercise ${entry.exercise}`);
    }
    return { type: "exercise", stepId: exercise.id, exercise };
  });
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
    steps: lessonSteps(args.lesson),
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

/**
 * Listening review (P7 §79-81): due LISTEN cards replayed as generated
 * audio→meaning questions over the lexeme's own bundled word clip. Cards
 * whose clip has no generated asset yet are simply not sessionable — they
 * stay due untouched (never wrong, never consumed). Skipping a step via
 * the audio-unavailable affordance produces no evidence, so the card
 * stays due too.
 */
export function buildListeningReviewSessionDefinition(args: {
  course: Pick<CourseProgress, "cards">;
  pool: Word[];
  now?: number;
}): SessionDefinition {
  const clipIndex = listenWordClipIndex();
  const queue = dueFrenchReviewQueue(args.course.cards, args.now, "listen").filter(
    (d) => clipIndex[d.key.slice(0, d.key.lastIndexOf("|"))] !== undefined
  );
  const wordBySurface = new Map(args.pool.map((w) => [w.target, w]));
  const rng = seededRng(hashSeed(queue.map((d) => `${d.key}@${d.dueAt}`).join("|")));

  const steps: ExerciseStep[] = [];
  for (const due of queue) {
    const itemId = due.key.slice(0, due.key.lastIndexOf("|"));
    const word = wordBySurface.get(due.surface);
    if (!word) continue;
    const distractors = pickDistractors({
      courseId: FR_COURSE_ID,
      word,
      pool: args.pool,
      rng,
      direction: "targetToNative",
    }).map((w) => ({ text: w.native }));
    if (distractors.length === 0) continue;
    const options = [{ text: word.native }, ...distractors]
      .map((option) => ({ option, order: rng() }))
      .sort((a, b) => a.order - b.order)
      .map((x) => x.option);
    const exercise: ListeningComprehensionExercise = {
      type: "listeningComprehension",
      id: `listen-review-${itemId}`,
      clipId: clipIndex[itemId],
      question: "What do you hear?",
      options,
      correct: options.findIndex((o) => o.text === word.native),
    };
    steps.push({
      type: "exercise",
      stepId: exercise.id,
      exercise,
      evidence: { itemId, skill: "listen", srsRole: "assessment" },
    });
  }

  return {
    kind: "review",
    courseId: FR_COURSE_ID,
    lessonId: "srs-listening",
    steps,
    completion: "practice",
    evidenceSource: "review",
    trackMistakes: false,
    allowUndo: true,
  };
}

/** Due listen cards that are actually sessionable (clip asset bundled). */
export function dueListeningReviewCount(
  cards: Record<string, FsrsCardState> | undefined,
  now?: number
): number {
  const clipIndex = listenWordClipIndex();
  return dueFrenchReviewQueue(cards, now, "listen").filter(
    (d) => clipIndex[d.key.slice(0, d.key.lastIndexOf("|"))] !== undefined
  ).length;
}

/**
 * Speaking review (P8 §16): due SPEAK cards re-probed with an elicited
 * production item that grades exactly that lexeme. Cards with no authored
 * production item are not sessionable — they stay visibly due, untouched.
 * Skipping ("Can't speak right now") produces no evidence, and assisted
 * attempts are refused by the gate, so a card can only move on a real,
 * unassisted, recognized production.
 */
export function buildSpeakingReviewSessionDefinition(args: {
  course: Pick<CourseProgress, "cards">;
  now?: number;
}): SessionDefinition {
  const itemIndex = speakProductionIndex();
  const queue = dueFrenchReviewQueue(args.course.cards, args.now, "speak").filter(
    (d) => itemIndex[d.key.slice(0, d.key.lastIndexOf("|"))] !== undefined
  );

  const steps: ExerciseStep[] = [];
  for (const due of queue) {
    const lexemeId = due.key.slice(0, due.key.lastIndexOf("|"));
    const item = speechItemFor(itemIndex[lexemeId]);
    if (!item) continue;
    const exercise = speakExerciseForItem(item, `speak-review-${lexemeId}`);
    steps.push({
      type: "exercise",
      stepId: exercise.id,
      exercise,
      evidence: { itemId: lexemeId, skill: "speak", srsRole: "assessment" },
    });
  }

  return {
    kind: "review",
    courseId: FR_COURSE_ID,
    lessonId: "srs-speaking",
    steps,
    completion: "practice",
    evidenceSource: "review",
    trackMistakes: false,
    allowUndo: true,
  };
}

/** Due speak cards split into sessionable / total (backlog honesty, §16). */
export function dueSpeakingReviewCounts(
  cards: Record<string, FsrsCardState> | undefined,
  now?: number
): { sessionable: number; total: number } {
  const itemIndex = speakProductionIndex();
  const due = dueFrenchReviewQueue(cards, now, "speak");
  return {
    sessionable: due.filter(
      (d) => itemIndex[d.key.slice(0, d.key.lastIndexOf("|"))] !== undefined
    ).length,
    total: due.length,
  };
}

// ---------------------------------------------------------------------------
// Phase 9: writing + conversation practice (§62-§64)
// ---------------------------------------------------------------------------

/**
 * Writing practice (P9 §62): a short rotating set of the course's TAUGHT
 * writing steps (lesson exercises only — reserved assessment tasks can
 * never appear here because they are never in lessons). Learning-mode
 * feedback, zero evidence (writing mints no cards, §62), practice
 * completion. Deterministic per seed key so a day's session is stable.
 */
export function buildWritingPracticeSessionDefinition(args: {
  pack: Pack;
  seedKey: string;
  count?: number;
}): SessionDefinition {
  const writing: Exercise[] = [];
  for (const section of args.pack.sections)
    for (const unit of section.units)
      for (const lesson of unit.lessons)
        for (const exercise of lesson.exercises) {
          if (exercise.type === "guidedWriting" || exercise.type === "simpleForm") {
            writing.push(exercise);
          }
        }
  const rng = seededRng(hashSeed(`writing:${args.seedKey}`));
  const shuffled = [...writing].sort(() => rng() - 0.5);
  const chosen = shuffled.slice(0, Math.max(1, args.count ?? 4));
  return {
    kind: "review",
    courseId: FR_COURSE_ID,
    lessonId: "writing-practice",
    steps: chosen.map((exercise) => ({
      type: "exercise",
      stepId: `wp-${exercise.id}`,
      exercise,
    })),
    completion: "practice",
    evidenceSource: "lesson",
    trackMistakes: false,
    allowUndo: false,
  };
}

/**
 * Conversation practice (P9 §63): exactly ONE practice scenario per
 * session — a whole conversation is one step — rotating deterministically
 * through the non-reserved bank. Reserved assessment scenarios can never
 * appear (interactionPracticeScenarios filters them), TODAY is untouched
 * (§64: no multi-turn conversation is ever injected there), and no
 * lexical evidence flows (§35).
 */
export function buildConversationPracticeSessionDefinition(args: {
  seedKey: string;
}): SessionDefinition {
  const scenarios = interactionPracticeScenarios();
  const steps: SessionStep[] = [];
  if (scenarios.length > 0) {
    const scenario = scenarios[hashSeed(`conversation:${args.seedKey}`) % scenarios.length];
    steps.push({
      type: "exercise",
      stepId: `cp-${scenario.id}`,
      exercise: {
        type: "interactionScenario",
        id: `conversation-${scenario.id}`,
        scenarioId: scenario.id,
      },
    });
  }
  return {
    kind: "review",
    courseId: FR_COURSE_ID,
    lessonId: "conversation",
    steps,
    completion: "practice",
    evidenceSource: "lesson",
    trackMistakes: false,
    allowUndo: false,
  };
}

// ---------------------------------------------------------------------------
// Phase 6: checkpoint sessions (§54, §104-108)
// ---------------------------------------------------------------------------

/** Compiled checkpoint artifact shape (src/content/assessment). */
type CompiledCheckpoint = {
  id: string;
  checkpointVersion: number;
  formVersion: number;
  sectionId: string;
  title: string;
  description: string;
  items: {
    id: string;
    itemVersion: number;
    exercise: Exercise;
    objectiveTargets: string[];
    essential: boolean;
  }[];
  forms?: { formId: string; itemIds: string[] }[];
  criteria: { minItemsPerObjective: number; demonstratedShare: number };
};

/**
 * A scored checkpoint session (§49-59): exercises ONLY (no teach/concept —
 * §108 structural), retryPolicy "none" (first attempt is the record, §55),
 * no evidence flow (evidencePlanFor nulls scored kinds), no mistakes
 * tracking, completion "checkpoint" (assessment record, zero XP).
 *
 * Parallel forms (P9 §38-§39): the sitting administers ONE deterministic
 * form — retakes rotate by prior attempt count, so pass the learner's
 * recorded attempt count for this checkpoint; a bank without declared
 * forms is its own single "full" form (count irrelevant).
 */
export function buildCheckpointSessionDefinition(
  checkpoint: CompiledCheckpoint,
  priorAttemptCount = 0
): SessionDefinition {
  const form = selectCheckpointForm(checkpoint, priorAttemptCount);
  const administered = new Set(form.itemIds);
  const items = checkpoint.items.filter((item) => administered.has(item.id));
  // Phase 10 Gate 3: scored MCQ options are rendered in a seeded order that
  // is fixed for this administration (checkpoint, form, form version,
  // attempt count, item) and different on the next attempt.
  const steps: SessionStep[] = items.map((item) => ({
    type: "exercise",
    stepId: item.id,
    exercise: shuffleScoredOptions(
      item.exercise,
      administrationSeed([
        checkpoint.id,
        form.formId,
        `v${checkpoint.formVersion}`,
        `attempt${priorAttemptCount}`,
        item.id,
      ])
    ),
  }));
  return {
    kind: "checkpoint",
    courseId: "fr-en",
    lessonId: checkpoint.id,
    steps,
    completion: "checkpoint",
    evidenceSource: "lesson",
    trackMistakes: false,
    allowUndo: false,
    retryPolicy: "none",
    assessment: {
      checkpointId: checkpoint.id,
      checkpointVersion: checkpoint.checkpointVersion,
      formId: form.formId,
      formVersion: checkpoint.formVersion,
      criteria: checkpoint.criteria,
      itemObjectives: Object.fromEntries(
        items.map((item) => [item.id, item.objectiveTargets])
      ),
    },
  };
}

// ---------------------------------------------------------------------------
// Phase 6: placement sessions (§67-80, §115-120)
// ---------------------------------------------------------------------------

/** Compiled placement stage shape (src/content/assessment/fr-placement). */
type CompiledPlacementStageSource = {
  id: string;
  title: string;
  clusters: {
    id: string;
    objectiveId: string;
    anchorLessonId: string;
    items: { id: string; itemVersion: number; exercise: Exercise; objectiveTargets: string[] }[];
  }[];
};

/**
 * One placement stage as a scored session (§73): exercises only, first
 * attempt is the record (§55), minimal feedback so the diagnostic never
 * teaches mid-test (§118), an "I don't know" affordance recorded as a
 * declared gap (§117), and NO learning-memory mutation of any kind — no
 * evidence, no mistakes, no XP (§78). The route owns cross-stage flow and
 * result storage; completion "placement" is a structural no-op.
 */
export function buildPlacementStageSessionDefinition(
  stage: CompiledPlacementStageSource,
  /**
   * Identifies THIS administration of the diagnostic (Phase 10 Gate 3):
   * the route captures it once per run, so scored MCQ options keep one
   * seeded order for the run and a different one on a later run. The
   * empty default keeps the builder pure and reproducible in tests.
   */
  runSeed = ""
): SessionDefinition {
  const steps: SessionStep[] = stage.clusters.flatMap((cluster) =>
    cluster.items.map((item) => ({
      type: "exercise" as const,
      stepId: item.id,
      exercise: shuffleScoredOptions(
        item.exercise,
        administrationSeed(["placement", stage.id, runSeed, item.id])
      ),
    }))
  );
  return {
    kind: "placement",
    courseId: "fr-en",
    lessonId: `placement:${stage.id}`,
    steps,
    completion: "placement",
    evidenceSource: "lesson",
    trackMistakes: false,
    allowUndo: false,
    retryPolicy: "none",
    feedbackPolicy: "minimal",
  };
}

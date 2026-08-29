/**
 * TODAY plan composer (Phase 3) — a pure function from explicit state to a
 * session plan. No store reads, no Math.random, no Date.now: same input +
 * same seed → the same plan, which is what makes the whole surface testable.
 *
 * Session shape (French-first):
 *   1. WARM-UP  due FSRS cards, most at-risk first — designated assessments
 *   2. NEW      teach card → immediate Fr→En retrieval (the new card's
 *               designated assessment), material drawn ONLY from the PATH
 *               frontier (first incomplete lesson), in authored order
 *   3. MIXED    reinforcement in the other direction (En→Fr) — practice
 *   4. FINALE   a small match game — reinforcement, never FSRS evidence
 *
 * Budgets cap the SESSION, never the scheduler: due dates are read, never
 * rewritten, and the plan reports the remaining backlog honestly.
 */

import { dayString } from "../dates";
import { hashSeed, seededRng } from "../review-builder";
import type { ExerciseStep, SessionStep, TeachStep } from "../session/types";
import type {
  ListeningComprehensionExercise,
  MatchExercise,
  Pack,
  SelectExercise,
  Word,
} from "../types";

import { pickDistractors } from "./distractors";
import { dueFrenchReviewQueue } from "./engine";
import { FR_COURSE_ID, FR_SURFACE_FOR_ID, isCuratedFrItemId } from "./ids-fr";
import type { FsrsCardState } from "./scheduler";

export type TodayPreset = "short" | "regular" | "long";

/** Learning-item budgets, not countdown timers (§30). */
export const TODAY_PRESETS: Record<
  TodayPreset,
  { minutes: number; review: number; newItems: number; mixed: number }
> = {
  short: { minutes: 5, review: 5, newItems: 3, mixed: 3 },
  regular: { minutes: 10, review: 10, newItems: 5, mixed: 5 },
  long: { minutes: 15, review: 15, newItems: 8, mixed: 8 },
};

/** Calibration constant for the honest duration estimate (§31). */
export const TODAY_STEP_SECONDS = 20;

export const TODAY_FINALE_MAX_PAIRS = 4;

export type TodayPlanInput = {
  pack: Pack;
  completedLessons: Record<string, true>;
  cards: Record<string, FsrsCardState> | undefined;
  preset: TodayPreset;
  seed: number;
  now: number;
  /**
   * Accepted placement floor (§87-88): the frontier — and therefore new-word
   * introduction — starts at this global lesson index. Lessons before it are
   * placement-cleared: open for review, never the frontier. 0 = no floor.
   */
  placementFloor?: number;
  /**
   * Sessionable listen-card stimuli (P7 §134-137): itemId → clipId for
   * lexemes whose single-word clip has a bundled asset. Passed in (never
   * read here) so the composer stays pure; empty/omitted disables the
   * listening share entirely — exactly the pre-Phase-7 plan.
   */
  listenClips?: Record<string, string>;
};

export type TodayPlan = {
  steps: SessionStep[];
  /** Warm-up reviews included in this session (listening included). */
  reviewCount: number;
  /** Listening reviews among reviewCount (bounded share, P7 §135). */
  listenCount: number;
  /** New words taught (each = teach + immediate assessment). */
  newCount: number;
  /** All currently due cards, before budgeting (both skills). */
  backlogTotal: number;
  /** Due cards that did NOT fit this session's budget. */
  backlogRemaining: number;
  /** Honest estimate from the actual composed step count. */
  estimatedMinutes: number;
};

/** Listening's bounded slice of the review budget: at most a third (§135). */
export function todayListenBudget(reviewBudget: number): number {
  return Math.floor(reviewBudget / 3);
}

type Item = { itemId: string; word: Word };

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function packWords(pack: Pack): Word[] {
  const seen = new Map<string, Word>();
  for (const section of pack.sections)
    for (const unit of section.units)
      for (const word of unit.words)
        if (!seen.has(word.target)) seen.set(word.target, word);
  return [...seen.values()];
}

/**
 * The PATH frontier: the first lesson the learner has not completed at or
 * after the placement floor (§35, §87-88). Placement-cleared lessons before
 * the floor stay open for review but are never the frontier — TODAY must
 * not re-introduce what the learner placed past.
 */
export function pathFrontierLesson(
  pack: Pack,
  completedLessons: Record<string, true>,
  floorIndex = 0
): { lessonId: string; gradeTargetIds: string[] } | null {
  let globalIndex = -1;
  for (const section of pack.sections)
    for (const unit of section.units)
      for (const lesson of unit.lessons) {
        globalIndex += 1;
        if (globalIndex < floorIndex) continue;
        if (completedLessons[lesson.id]) continue;
        const ids: string[] = [];
        for (const exercise of lesson.exercises) {
          // Grammar drills (articleSelect) carry no gradeTargets by design.
          const targets = "gradeTargets" in exercise ? exercise.gradeTargets ?? [] : [];
          for (const id of targets) if (!ids.includes(id)) ids.push(id); // authored order, deduped
        }
        return { lessonId: lesson.id, gradeTargetIds: ids };
      }
  return null;
}

/**
 * Deterministic select builder shared by all TODAY exercises (§41): four
 * unique options where the pool permits, shuffled answer position,
 * distractors never equal to (or displaying like) the answer.
 */
function buildSelect(args: {
  id: string;
  word: Word;
  pool: Word[];
  rng: () => number;
  direction: "targetToNative" | "nativeToTarget";
}): SelectExercise | null {
  const { word, pool, rng, direction } = args;
  const display = (w: Word) => (direction === "targetToNative" ? w.native : w.target);
  const answerText = display(word);

  // Smart engine (Phase 4): confusables → same POS+topic → same band →
  // same POS → safe fallback, same-gender preference for nouns (in
  // production the option surfaces carry articles — a lone gender would
  // leak the answer). Deterministic under the session rng.
  // Recognition options all carry their word's emoji (an emoji only on the
  // answer would give it away); production options are plain French text.
  const withEmoji = direction === "targetToNative";
  const distractors = pickDistractors({
    courseId: FR_COURSE_ID,
    word,
    pool,
    rng,
    direction,
  }).map((w) => (withEmoji ? { text: display(w), emoji: w.emoji } : { text: display(w) }));
  if (distractors.length === 0) return null;

  const options = shuffle(
    [
      withEmoji ? { text: answerText, emoji: word.emoji } : { text: answerText },
      ...distractors,
    ],
    rng
  );
  return {
    type: "select",
    id: args.id,
    mode: direction,
    // The Select renders `prompt` as the asked word (titles come from the
    // mode): show the French for recognition, the native for production.
    prompt: direction === "targetToNative" ? word.target : word.native,
    audioTarget: word.target,
    options,
    correct: options.findIndex((o) => o.text === answerText),
  };
}

/**
 * Route-facing wrapper: derives the deterministic seed from the state
 * snapshot + local day + preset (§46 — same state, same day, same preset →
 * the same plan), with lint-friendly time defaults. Tests use
 * composeTodaySession directly with explicit values.
 */
export function composeTodayFromSnapshot(args: {
  pack: Pack;
  completedLessons: Record<string, true>;
  cards: Record<string, FsrsCardState> | undefined;
  preset: TodayPreset;
  placementFloor?: number;
  listenClips?: Record<string, string>;
  day?: string;
  now?: number;
}): TodayPlan {
  const now = args.now ?? Date.now();
  const day = args.day ?? dayString(new Date(now));
  const dueKeys = [
    ...dueFrenchReviewQueue(args.cards, now),
    ...dueFrenchReviewQueue(args.cards, now, "listen"),
  ]
    .map((d) => `${d.key}@${d.dueAt}`)
    .join(",");
  const frontier = pathFrontierLesson(args.pack, args.completedLessons, args.placementFloor ?? 0);
  const seed = hashSeed(`${day}|${args.preset}|${frontier?.lessonId ?? "-"}|${dueKeys}`);
  return composeTodaySession({
    pack: args.pack,
    completedLessons: args.completedLessons,
    cards: args.cards,
    listenClips: args.listenClips,
    preset: args.preset,
    seed,
    now,
    placementFloor: args.placementFloor,
  });
}

export function composeTodaySession(input: TodayPlanInput): TodayPlan {
  const budgets = TODAY_PRESETS[input.preset];
  const rng = seededRng(input.seed);
  const pool = packWords(input.pack);
  const wordBySurface = new Map(pool.map((w) => [w.target, w]));
  const steps: SessionStep[] = [];

  // ---- 1. WARM-UP: most at-risk due cards, capped by budget only --------
  // Listening takes a BOUNDED share (≤ a third, P7 §135): reading recall
  // stays the session's core, and a listener without working audio loses at
  // most that slice (each listening step also carries the skip escape).
  const listenClips = input.listenClips ?? {};
  const listenQueue = dueFrenchReviewQueue(input.cards, input.now, "listen").filter(
    (d) => listenClips[d.key.slice(0, d.key.lastIndexOf("|"))] !== undefined
  );
  const listenItems: Item[] = [];
  for (const due of listenQueue) {
    if (listenItems.length >= todayListenBudget(budgets.review)) break;
    const word = wordBySurface.get(due.surface);
    if (!word) continue;
    listenItems.push({ itemId: due.key.slice(0, due.key.lastIndexOf("|")), word });
  }

  const dueQueue = dueFrenchReviewQueue(input.cards, input.now);
  const warmupItems: Item[] = [];
  for (const due of dueQueue) {
    if (warmupItems.length + listenItems.length >= budgets.review) break;
    const word = wordBySurface.get(due.surface);
    if (!word) continue; // unrenderable stays safely in the backlog
    const itemId = due.key.slice(0, due.key.lastIndexOf("|"));
    warmupItems.push({ itemId, word });
  }
  for (const item of warmupItems) {
    const exercise = buildSelect({
      id: `today-review-${item.itemId}`,
      word: item.word,
      pool,
      rng,
      direction: "targetToNative",
    });
    if (!exercise) continue;
    steps.push({
      type: "exercise",
      stepId: exercise.id,
      exercise,
      evidence: { itemId: item.itemId, srsRole: "assessment" },
      phase: "warmup",
    } satisfies ExerciseStep);
  }
  let listenCount = 0;
  for (const item of listenItems) {
    const distractors = pickDistractors({
      courseId: FR_COURSE_ID,
      word: item.word,
      pool,
      rng,
      direction: "targetToNative",
    }).map((w) => ({ text: w.native }));
    if (distractors.length === 0) continue;
    const options = shuffle([{ text: item.word.native }, ...distractors], rng);
    const exercise: ListeningComprehensionExercise = {
      type: "listeningComprehension",
      id: `today-listen-${item.itemId}`,
      clipId: listenClips[item.itemId],
      question: "What do you hear?",
      options,
      correct: options.findIndex((o) => o.text === item.word.native),
    };
    steps.push({
      type: "exercise",
      stepId: exercise.id,
      exercise,
      evidence: { itemId: item.itemId, skill: "listen", srsRole: "assessment" },
      phase: "warmup",
    } satisfies ExerciseStep);
    listenCount += 1;
  }
  const reviewCount = steps.length;

  // ---- 2. NEW: PATH frontier only, authored order (§34-40) --------------
  const frontier = pathFrontierLesson(
    input.pack,
    input.completedLessons,
    input.placementFloor ?? 0
  );
  const newItems: Item[] = [];
  for (const id of frontier?.gradeTargetIds ?? []) {
    if (newItems.length >= budgets.newItems) break;
    if (!isCuratedFrItemId(id)) continue; // fail closed on bad content
    if (input.cards?.[`${id}|recognize`]) continue; // already has a card
    const surface = FR_SURFACE_FOR_ID[id];
    const word = surface === undefined ? undefined : wordBySurface.get(surface);
    if (!word) continue; // must be renderable from course data
    if (newItems.some((n) => n.itemId === id)) continue;
    newItems.push({ itemId: id, word });
  }
  for (const item of newItems) {
    steps.push({
      type: "teach",
      stepId: `today-teach-${item.itemId}`,
      itemId: item.itemId,
      word: item.word,
      phase: "new",
    } satisfies TeachStep);
    const exercise = buildSelect({
      id: `today-new-${item.itemId}`,
      word: item.word,
      pool,
      rng,
      direction: "targetToNative", // easiest first retrieval (§40)
    });
    if (exercise) {
      steps.push({
        type: "exercise",
        stepId: exercise.id,
        exercise,
        evidence: { itemId: item.itemId, srsRole: "assessment" },
        phase: "new",
      });
    }
  }

  // ---- 3. MIXED: other-direction reinforcement, practice only (§42) -----
  const mixedPoolItems = [...newItems, ...warmupItems].slice(0, budgets.mixed);
  let mixedSteps: ExerciseStep[] = [];
  for (const item of mixedPoolItems) {
    const exercise = buildSelect({
      id: `today-mixed-${item.itemId}`,
      word: item.word,
      pool,
      rng,
      direction: "nativeToTarget",
    });
    if (!exercise) continue;
    mixedSteps.push({
      type: "exercise",
      stepId: exercise.id,
      exercise,
      evidence: { itemId: item.itemId, srsRole: "practice" },
      phase: "mixed",
    });
  }
  mixedSteps = shuffle(mixedSteps, rng);
  // §47: keep an item's mixed step away from its immediately-preceding
  // assessment when the pool allows.
  const lastStep = steps[steps.length - 1];
  const lastItemId =
    lastStep?.type === "exercise" ? lastStep.evidence?.itemId : undefined;
  if (
    mixedSteps.length > 1 &&
    lastItemId !== undefined &&
    mixedSteps[0].evidence?.itemId === lastItemId
  ) {
    const swap = mixedSteps.findIndex((s) => s.evidence?.itemId !== lastItemId);
    if (swap > 0) [mixedSteps[0], mixedSteps[swap]] = [mixedSteps[swap], mixedSteps[0]];
  }
  steps.push(...mixedSteps);

  // ---- 4. FINALE: small match game, reinforcement only (§44) ------------
  const sessionItems = [...newItems, ...warmupItems];
  const uniqueByNative = new Map<string, Item>();
  for (const item of sessionItems) {
    if (!uniqueByNative.has(item.word.native)) uniqueByNative.set(item.word.native, item);
  }
  const finaleItems = shuffle([...uniqueByNative.values()], rng).slice(
    0,
    TODAY_FINALE_MAX_PAIRS
  );
  if (finaleItems.length >= 2) {
    const finale: MatchExercise = {
      type: "match",
      id: "today-finale",
      pairs: finaleItems.map((item) => ({
        target: item.word.target,
        native: item.word.native,
      })),
    };
    steps.push({
      type: "exercise",
      stepId: finale.id,
      exercise: finale,
      phase: "finale",
    });
  }

  return {
    steps,
    reviewCount,
    listenCount,
    newCount: newItems.length,
    backlogTotal: dueQueue.length + listenQueue.length,
    backlogRemaining: Math.max(
      0,
      dueQueue.length - warmupItems.length + listenQueue.length - listenItems.length
    ),
    estimatedMinutes:
      steps.length === 0
        ? 0
        : Math.max(1, Math.round((steps.length * TODAY_STEP_SECONDS) / 60)),
  };
}

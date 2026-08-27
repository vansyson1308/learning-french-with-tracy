/**
 * FsrsSchedulerAdapter — the only module in the app allowed to import ts-fsrs.
 * Converts between the plain persisted FsrsCardState (Unix-ms dates, string
 * state names) and ts-fsrs Card objects at the call boundary.
 *
 * Fail-closed policy: before the engine is trusted with a learner card, a
 * one-time known-vector check runs (values pinned from the Phase-1 Hermes
 * spike); every card the engine returns is validated for finite, in-range
 * numbers. Any failure throws FsrsRuntimeError instead of persisting a
 * corrupt card — callers keep the learner's previous state.
 */

import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
  type Card,
  type CardInput,
  type FSRS,
  type Grade as TsFsrsGrade,
  type ReviewLog,
} from "ts-fsrs";

import { D_MAX, FSRS_PARAMS, FSRS_W } from "./fsrs-defaults";
import type {
  FsrsCardState,
  FsrsStateName,
  Grade,
  PlainFsrsLog,
  ReviewScheduler,
  SchedulerMutation,
} from "./scheduler";

const DAY_MS = 86_400_000;

export class FsrsRuntimeError extends Error {
  constructor(message: string) {
    super(`FSRS engine failure (no card was modified): ${message}`);
    this.name = "FsrsRuntimeError";
  }
}

const STATE_TO_NAME: Record<State, FsrsStateName> = {
  [State.New]: "new",
  [State.Learning]: "learning",
  [State.Review]: "review",
  [State.Relearning]: "relearning",
};

const NAME_TO_STATE: Record<FsrsStateName, State> = {
  new: State.New,
  learning: State.Learning,
  review: State.Review,
  relearning: State.Relearning,
};

const GRADE_TO_RATING: Record<Grade, TsFsrsGrade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

export function toPlainCard(card: Card): FsrsCardState {
  const plain: FsrsCardState = {
    due: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: STATE_TO_NAME[card.state],
  };
  if (card.last_review) plain.last_review = card.last_review.getTime();
  return plain;
}

/**
 * The deprecated `elapsed_days` (removed in ts-fsrs 6) is not persisted;
 * CardInput still requires it, so it is reconstructed from `last_review`.
 * The adapter round-trip test pins that this changes nothing.
 */
export function fromPlainCard(plain: FsrsCardState, now: number): CardInput {
  return {
    due: plain.due,
    stability: plain.stability,
    difficulty: plain.difficulty,
    elapsed_days:
      plain.last_review === undefined
        ? 0
        : Math.max(0, (now - plain.last_review) / DAY_MS),
    scheduled_days: plain.scheduled_days,
    learning_steps: plain.learning_steps,
    reps: plain.reps,
    lapses: plain.lapses,
    state: NAME_TO_STATE[plain.state],
    last_review: plain.last_review,
  };
}

function toPlainLog(log: ReviewLog): PlainFsrsLog {
  return {
    rating: log.rating,
    state: log.state,
    due: log.due.getTime(),
    stability: log.stability,
    difficulty: log.difficulty,
    scheduled_days: log.scheduled_days,
    learning_steps: log.learning_steps,
    review: log.review.getTime(),
  };
}

/** Returns human-readable problems; empty array = card is storable. */
export function validateFsrsCard(plain: FsrsCardState): string[] {
  const problems: string[] = [];
  const numeric: [string, number][] = [
    ["due", plain.due],
    ["stability", plain.stability],
    ["difficulty", plain.difficulty],
    ["scheduled_days", plain.scheduled_days],
    ["learning_steps", plain.learning_steps],
    ["reps", plain.reps],
    ["lapses", plain.lapses],
  ];
  if (plain.last_review !== undefined) numeric.push(["last_review", plain.last_review]);
  for (const [name, value] of numeric) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      problems.push(`${name} is not a finite number: ${String(value)}`);
    }
  }
  if (problems.length > 0) return problems;

  if (plain.stability < 0) problems.push(`stability < 0: ${plain.stability}`);
  if (plain.difficulty < 0 || plain.difficulty > D_MAX + 1e-6) {
    problems.push(`difficulty out of range [0, ${D_MAX}]: ${plain.difficulty}`);
  }
  if (plain.reps < 0 || plain.lapses < 0) {
    problems.push(`negative reps/lapses: ${plain.reps}/${plain.lapses}`);
  }
  if (!(plain.state in NAME_TO_STATE)) {
    problems.push(`unknown state: ${String(plain.state)}`);
  }
  return problems;
}

let engine: FSRS | undefined;
let engineVerified = false;

/**
 * Known-vector sanity check (values from the Phase-1 spike, byte-identical
 * between Node and the Hermes VM): Good on an empty card with our parameters
 * must yield stability = w[2], Learning state, and a future due date. Guards
 * against a systematically broken engine on an untested JS runtime before it
 * ever touches a learner card.
 */
function getEngine(): FSRS {
  if (!engine) {
    engine = fsrs(generatorParameters({ ...FSRS_PARAMS, w: [...FSRS_W] }));
  }
  if (!engineVerified) {
    const t0 = 1_700_000_000_000;
    const probe = engine.next(createEmptyCard(new Date(t0)), t0, Rating.Good);
    const sane =
      Math.abs(probe.card.stability - FSRS_W[2]) < 1e-9 &&
      probe.card.state === State.Learning &&
      Number.isFinite(probe.card.difficulty) &&
      probe.card.due.getTime() > t0;
    if (!sane) {
      throw new FsrsRuntimeError(
        `self-test produced unexpected output (stability=${probe.card.stability}, state=${probe.card.state})`
      );
    }
    engineVerified = true;
  }
  return engine;
}

export const fsrsScheduler: ReviewScheduler<FsrsCardState> = {
  initialCard(now: number): FsrsCardState {
    getEngine();
    return toPlainCard(createEmptyCard(new Date(now)));
  },

  review(card: FsrsCardState, grade: Grade, now: number) {
    const result = getEngine().next(
      fromPlainCard(card, now),
      now,
      GRADE_TO_RATING[grade]
    );
    const next = toPlainCard(result.card);
    const problems = validateFsrsCard(next);
    if (problems.length > 0) {
      throw new FsrsRuntimeError(problems.join("; "));
    }
    const log: SchedulerMutation<FsrsCardState> = {
      grade,
      at: now,
      prevCard: { ...card },
      fsrsLog: toPlainLog(result.log),
    };
    return { card: next, log };
  },

  isDue(card: FsrsCardState, now: number): boolean {
    return card.due <= now;
  },

  retrievability(card: FsrsCardState, now: number): number {
    const r = getEngine().get_retrievability(fromPlainCard(card, now), now, false);
    if (!Number.isFinite(r) || r < 0 || r > 1) {
      throw new FsrsRuntimeError(`retrievability out of range: ${String(r)}`);
    }
    return r;
  },

  /**
   * Undo restores the exact pre-review snapshot. ts-fsrs's own rollback()
   * recomputes `due` shifted by the review delay (verified in the spike),
   * so the snapshot IS the correct mechanism, not a shortcut.
   */
  rollback(_card: FsrsCardState, mutation: SchedulerMutation<FsrsCardState>): FsrsCardState {
    return { ...mutation.prevCard };
  },
};

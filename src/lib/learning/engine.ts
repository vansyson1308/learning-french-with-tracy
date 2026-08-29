/**
 * Evidence application engine — the single path from ReviewEvidence to
 * persisted learning state, for every course:
 *
 *   fr-en          → evidence gate → FSRS card mutation + review log
 *   everything else → EXACT translation to the legacy recordWord /
 *                     reviewSrsWord semantics (parity-tested field-for-field)
 *
 * Pure state-transition functions; the store supplies state and commits the
 * result. No React imports.
 */

import type { CourseProgress, WordStat } from "../store";
import { reviewWord } from "../srs";

import { serializeCardKey, type Skill } from "./card-key";
import type { ReviewEvidence } from "./evidence";
import { gateEvidence } from "./evidence-gate";
import { fsrsScheduler } from "./fsrs-adapter";
import { FR_COURSE_ID, FR_SURFACE_FOR_ID, frItemIdFor } from "./ids-fr";
import {
  appendToReviewLog,
  cardMutatedInSession,
  type PersistedMutation,
  type ReviewLogEntry,
} from "./review-log";
import type { FsrsCardState } from "./scheduler";

/** fr-en gets stable lexical ids; legacy courses keep raw surfaces. */
export function itemIdForCourse(courseId: string, surface: string): string {
  return courseId === FR_COURSE_ID ? frItemIdFor(surface) : surface;
}

/**
 * CardKey-safe log key carrying the evidence's REAL skill (legacy surfaces
 * could contain "|", so the itemId is escaped). The skill must never be
 * collapsed here: the one-mutation-per-card-per-session gate and undo both
 * resolve cards through this exact string, so a listen/speak review logged
 * under "|recognize" would break the session guard for its own card AND
 * point undo at the wrong card.
 */
function logCardKey(cardKey: ReviewEvidence["cardKey"]): string {
  return serializeCardKey({
    itemId: cardKey.itemId.split("|").join("%7C"),
    skill: cardKey.skill,
  });
}

function bumpStat(prev: WordStat | undefined, correct: boolean, now: number): WordStat {
  const base = prev ?? { correct: 0, wrong: 0, lastSeen: 0 };
  return {
    correct: base.correct + (correct ? 1 : 0),
    wrong: base.wrong + (correct ? 0 : 1),
    lastSeen: now,
  };
}

export type ApplyEvidenceResult = {
  course: CourseProgress;
  reviewLog: ReviewLogEntry[];
  /** True when the FSRS scheduler was mutated (drives the undo affordance). */
  mutated: boolean;
};

function baseLogEntry(
  courseId: string,
  ev: ReviewEvidence,
  now: number
): ReviewLogEntry {
  return {
    at: now,
    courseId,
    cardKey: logCardKey(ev.cardKey),
    sessionId: ev.sessionId,
    exerciseId: ev.exerciseId,
    modality: ev.modality,
    srsRole: ev.srsRole,
    source: ev.source,
    correct: ev.correct,
    hinted: ev.hinted,
    assisted: ev.assisted,
    toleranceUsed: ev.toleranceUsed,
    latencyMs: ev.latencyMs,
    attemptIndex: ev.attemptIndex,
  };
}

/**
 * Legacy translation — must stay field-for-field identical to the historical
 * store actions (pinned by parity tests):
 * - source "review"  → reviewSrsWord: srs write only, quality correct?2:0
 * - anything else    → recordWord: wordStats bump + srs write with the
 *                      hard-inference quality (wrong>correct history → 1)
 * The srsRole is deliberately ignored: legacy courses keep their exact
 * pre-Phase-1 behavior, evidence roles are an FSRS-side concept.
 */
function applyLegacy(
  course: CourseProgress,
  ev: ReviewEvidence,
  now: number
): CourseProgress {
  const surface = ev.cardKey.itemId;
  // TODAY is French-only; if evidence ever reached a legacy course anyway,
  // the safe translation is the review one (srs write, no stats inflation).
  if (ev.source === "review" || ev.source === "today") {
    return {
      ...course,
      srs: {
        ...course.srs,
        [surface]: reviewWord(course.srs?.[surface], ev.correct ? 2 : 0, now),
      },
    };
  }
  const prev = course.wordStats[surface] ?? { correct: 0, wrong: 0, lastSeen: 0 };
  const quality = ev.correct ? (prev.wrong > prev.correct ? 1 : 2) : 0;
  return {
    ...course,
    wordStats: { ...course.wordStats, [surface]: bumpStat(prev, ev.correct, now) },
    srs: {
      ...course.srs,
      [surface]: reviewWord(course.srs?.[surface], quality, now),
    },
  };
}

function applyFrench(
  course: CourseProgress,
  reviewLog: ReviewLogEntry[],
  ev: ReviewEvidence,
  now: number
): ApplyEvidenceResult {
  const key = serializeCardKey(ev.cardKey);
  let next: CourseProgress = course;

  // Strength stats mirror the legacy visibility rules: lesson/mistakes
  // interactions update them, review sessions never did, teach never will.
  // TODAY (§28) is stricter: only a designated assessment that actually
  // mutates the scheduler bumps stats — see below, after the gate.
  if (
    (ev.source === "lesson" || ev.source === "mistakes") &&
    ev.srsRole !== "teach"
  ) {
    next = {
      ...next,
      wordStats: {
        ...next.wordStats,
        [ev.cardKey.itemId]: bumpStat(
          next.wordStats[ev.cardKey.itemId],
          ev.correct,
          now
        ),
      },
    };
  }

  let mutation: PersistedMutation | undefined;
  const decision = gateEvidence(ev, cardMutatedInSession(reviewLog, key, ev.sessionId));
  if (decision.mutate) {
    try {
      const card = course.cards?.[key] ?? fsrsScheduler.initialCard(now);
      const result = fsrsScheduler.review(card, decision.grade, now);
      next = { ...next, cards: { ...next.cards, [key]: result.card } };
      mutation = {
        grade: decision.grade,
        prevCard: result.log.prevCard,
        fsrsLog: result.log.fsrsLog,
      };
    } catch (error) {
      // Fail closed: the card (and everything else) stays exactly as it was;
      // the evidence is still logged below, without a mutation.
      console.warn("FSRS review failed; card left unchanged", error);
    }
  }

  // TODAY stats: exactly one bump per card, tied to the one scheduler
  // mutation — teach, mixed practice and finale reinforcement never inflate.
  if (ev.source === "today" && mutation !== undefined) {
    next = {
      ...next,
      wordStats: {
        ...next.wordStats,
        [ev.cardKey.itemId]: bumpStat(
          next.wordStats[ev.cardKey.itemId],
          ev.correct,
          now
        ),
      },
    };
  }

  const entry: ReviewLogEntry = { ...baseLogEntry(FR_COURSE_ID, ev, now), mutation };
  return {
    course: next,
    reviewLog: appendToReviewLog(reviewLog, entry),
    mutated: mutation !== undefined,
  };
}

/** The one entry point the store routes ALL exercise evidence through. */
export function applyEvidence(args: {
  courseId: string;
  course: CourseProgress;
  reviewLog: ReviewLogEntry[];
  ev: ReviewEvidence;
  now: number;
}): ApplyEvidenceResult {
  const { courseId, course, reviewLog, ev, now } = args;
  if (courseId === FR_COURSE_ID) {
    return applyFrench(course, reviewLog, ev, now);
  }
  return {
    course: applyLegacy(course, ev, now),
    reviewLog: appendToReviewLog(reviewLog, baseLogEntry(courseId, ev, now)),
    mutated: false,
  };
}

export type DueFrenchItem = {
  /** Serialized CardKey. */
  key: string;
  /** Canonical surface (resolvable to a pack word). */
  surface: string;
  dueAt: number;
  retrievability: number;
};

/**
 * The French review queue: due cards ordered ascending by retrievability —
 * most-at-risk first (new/lapsed cards report 0 and lead). Only curated ids
 * are returned: fr:legacy: orphans stay safely in storage but cannot render
 * an exercise (exactly like pre-v2 sentence-keyed entries never surfaced).
 * Scoped to ONE skill (default "recognize", the pre-Phase-7 behavior):
 * listen cards live in the same map but review through their own surface,
 * so neither queue can render the other's modality. Deterministic: ties
 * break by due date, then key.
 */
export function dueFrenchReviewQueue(
  cards: Record<string, FsrsCardState> | undefined,
  now = Date.now(),
  skill: Skill = "recognize"
): DueFrenchItem[] {
  if (!cards) return [];
  const due: DueFrenchItem[] = [];
  for (const [key, card] of Object.entries(cards)) {
    if (!fsrsScheduler.isDue(card, now)) continue;
    if (key.slice(key.lastIndexOf("|") + 1) !== skill) continue;
    const itemId = key.slice(0, key.lastIndexOf("|"));
    const surface = FR_SURFACE_FOR_ID[itemId];
    if (surface === undefined) continue;
    due.push({
      key,
      surface,
      dueAt: card.due,
      retrievability: fsrsScheduler.retrievability(card, now),
    });
  }
  return due.sort(
    (a, b) =>
      a.retrievability - b.retrievability ||
      a.dueAt - b.dueAt ||
      (a.key < b.key ? -1 : 1)
  );
}

/** Card lookup by surface, for UI (due badges on the word list). */
export function frCardForSurface(
  cards: Record<string, FsrsCardState> | undefined,
  surface: string
): FsrsCardState | undefined {
  if (!cards) return undefined;
  return cards[serializeCardKey({ itemId: frItemIdFor(surface), skill: "recognize" })];
}

/**
 * Memory strength for the French word list (Phase 4): current FSRS
 * retrievability as a 0–100 percentage, through the app-owned adapter —
 * the UI never reimplements the forgetting formula. Words without a card
 * have no memory model yet → null (callers show an empty bar, never a
 * fabricated value). Fail-closed: an invalid card yields null, not a crash.
 */
export function frMemoryStrengthPercent(
  card: FsrsCardState | undefined,
  now: number = Date.now()
): number | null {
  if (!card) return null;
  try {
    return Math.round(fsrsScheduler.retrievability(card, now) * 100);
  } catch {
    return null;
  }
}

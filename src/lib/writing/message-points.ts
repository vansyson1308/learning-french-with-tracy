/**
 * Exam message scoring (QC 2026-10-29 §1.5). The Goethe A1 Schreiben Teil 2
 * message is worth 10 points, given in the real exam by two graders on fixed
 * criteria. The app turns its deterministic writing evaluation into points
 * with an explicit rubric, scaled to the task's points:
 *   the guided points (every slot between greeting and closing)   6
 *   greeting (first slot)                                          1
 *   closing (last slot)                                            1
 *   length within the rubric's word band (≈ 30 words)              1
 *   comprehensible German (≥ 80 % recognised vocabulary)           1
 * rounded to whole points, as the Goethe graders' mean is. Unscorable input
 * (nothing written, not the target language) is no evidence: null. The
 * result is always presented as an estimate.
 */
import { KNOWN_SHARE_FLOOR, type WritingEvaluation, type WritingRubric } from "./rubric";

export type MessagePointsSpec = {
  greetingSlotId: string;
  closingSlotId: string;
  pointSlotIds: string[];
  minTokens: number;
  maxTokens: number;
  maxPoints: number;
};

export type MessageCriterion = { id: "points" | "greeting" | "closing" | "length" | "comprehensible"; earned: number; max: number };
export type MessagePoints = { points: number; maxPoints: number; criteria: MessageCriterion[] };

/** Weights on a 10-point scale; scaled to the task's points. */
const WEIGHTS = { points: 6, greeting: 1, closing: 1, length: 1, comprehensible: 1 } as const;
/** Recognised-vocabulary share for the "comprehensible" point (above the rubric's scorable floor). */
export const COMPREHENSIBLE_SHARE = 0.8;

/** Greeting = first slot, closing = last, the guided points in between; null without at least one point. */
export function messagePointsSpecFor(rubric: WritingRubric, maxPoints: number): MessagePointsSpec | null {
  const slots = rubric.requiredSlots;
  if (slots.length < 3) return null;
  return {
    greetingSlotId: slots[0].id,
    closingSlotId: slots[slots.length - 1].id,
    pointSlotIds: slots.slice(1, -1).map((s) => s.id),
    minTokens: rubric.minTokens,
    maxTokens: rubric.maxTokens,
    maxPoints,
  };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function messagePoints(evaluation: WritingEvaluation, spec: MessagePointsSpec): MessagePoints | null {
  if (evaluation.verdict === "insufficiently_scorable" || evaluation.knownShare < KNOWN_SHARE_FLOOR) return null;
  const scale = spec.maxPoints / 10;
  const matched = new Set(evaluation.matchedSlotIds);
  const copiedPrompt = evaluation.feedback.some((m) => m.key === "rubric.ownAnswer");
  const covered = spec.pointSlotIds.filter((id) => matched.has(id)).length;
  const part = (id: MessageCriterion["id"], share: number): MessageCriterion => ({ id, earned: r2(copiedPrompt ? 0 : share * WEIGHTS[id] * scale), max: r2(WEIGHTS[id] * scale) });
  const criteria: MessageCriterion[] = [
    part("points", spec.pointSlotIds.length === 0 ? 0 : covered / spec.pointSlotIds.length),
    part("greeting", matched.has(spec.greetingSlotId) ? 1 : 0),
    part("closing", matched.has(spec.closingSlotId) ? 1 : 0),
    part("length", evaluation.tokenCount >= spec.minTokens && evaluation.tokenCount <= spec.maxTokens ? 1 : 0),
    part("comprehensible", evaluation.knownShare >= COMPREHENSIBLE_SHARE ? 1 : 0),
  ];
  const points = Math.round(criteria.reduce((n, c) => n + c.earned, 0));
  return { points, maxPoints: spec.maxPoints, criteria };
}

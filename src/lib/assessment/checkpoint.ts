/**
 * Checkpoint scoring (§60-64): pure derivation of a CheckpointAttempt from
 * the session machine's FIRST-attempt results. Product-local demonstration
 * criteria — documented course diagnostics, never official CEFR cut scores
 * (§62-63).
 */

import type { SessionAssessmentPlan } from "../session/types";
import type {
  AssessmentItemResult,
  CheckpointAttempt,
  CheckpointObjectiveResult,
} from "./types";

/**
 * Objective result rules (§61, §64):
 *  - fewer than criteria.minItemsPerObjective scored items →
 *    "insufficient_evidence" (one lucky MCQ can never demonstrate)
 *  - correct share ≥ criteria.demonstratedShare → "demonstrated"
 *  - otherwise → "needs_practice"
 */
export function scoreObjectives(
  plan: SessionAssessmentPlan,
  firstResults: Record<string, boolean>
): CheckpointObjectiveResult[] {
  const perObjective = new Map<string, { correct: number; total: number }>();
  for (const [stepId, objectives] of Object.entries(plan.itemObjectives)) {
    const result = firstResults[stepId];
    if (result === undefined) continue;
    for (const objectiveId of objectives) {
      const entry = perObjective.get(objectiveId) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (result) entry.correct += 1;
      perObjective.set(objectiveId, entry);
    }
  }
  return [...perObjective.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([objectiveId, { correct, total }]) => ({
      objectiveId,
      result:
        total < plan.criteria.minItemsPerObjective
          ? "insufficient_evidence"
          : correct / total >= plan.criteria.demonstratedShare
            ? "demonstrated"
            : "needs_practice",
      correct,
      total,
    }));
}

export function buildCheckpointAttempt(input: {
  plan: SessionAssessmentPlan;
  firstResults: Record<string, boolean>;
  startedAt: number;
  completedAt: number;
}): CheckpointAttempt {
  const itemResults: AssessmentItemResult[] = Object.entries(input.plan.itemObjectives)
    .filter(([stepId]) => input.firstResults[stepId] !== undefined)
    .map(([stepId]) => ({ itemId: stepId, correct: input.firstResults[stepId]! }));
  const total = itemResults.length;
  const correct = itemResults.filter((r) => r.correct === true).length;
  return {
    checkpointId: input.plan.checkpointId,
    checkpointVersion: input.plan.checkpointVersion,
    formId: input.plan.formId,
    formVersion: input.plan.formVersion,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    itemResults,
    objectiveResults: scoreObjectives(input.plan, input.firstResults),
    overallCorrectShare: total === 0 ? 0 : correct / total,
  };
}

/**
 * Deterministic parallel-form selection (P9 §38-§39): retakes rotate
 * through the declared forms in authored order, seeded by how many
 * attempts at THIS checkpoint the learner has already recorded — the
 * second sitting is a different form, never a memory test of the first.
 * A checkpoint without declared forms administers its whole bank as the
 * single implicit form "full". Pure: same history in, same form out.
 */
export function selectCheckpointForm(
  checkpoint: {
    items: { id: string }[];
    forms?: { formId: string; itemIds: string[] }[];
  },
  priorAttemptCount: number
): { formId: string; itemIds: string[] } {
  const forms = checkpoint.forms;
  if (!forms || forms.length === 0) {
    return { formId: "full", itemIds: checkpoint.items.map((i) => i.id) };
  }
  const index = ((priorAttemptCount % forms.length) + forms.length) % forms.length;
  const form = forms[index];
  return { formId: form.formId, itemIds: [...form.itemIds] };
}

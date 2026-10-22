/**
 * Exam-track engine (P3d): pure functions over a compiled exam track —
 * parallel-form rotation, section and mock session definitions, scoring
 * by the format's score groups, an ESTIMATED readiness band and weak
 * areas. Nothing here schedules or touches FSRS: weak areas become a
 * normal FSRS-recorded practice session only when the learner starts one.
 *
 * Attempts are stored as CheckpointAttempts (same persisted shape, no
 * migration) with `objectiveResults: []`, so exam practice never moves the
 * CEFR objective states or the claim-gated estimate; every exam score is
 * derived at read time from `itemResults` + the compiled track.
 */

import { administrationSeed, shuffleScoredOptions } from "../assessment/option-order";
import type { AssessmentItemResult, CheckpointAttempt } from "../assessment/types";
import type { SessionDefinition, SessionStep } from "../session/types";
import type { Exercise } from "../types";

export type ExamSkill = "reading" | "listening" | "writing" | "speaking";

export type CompiledExamTask = {
  id: string;
  title: string;
  instruction: string;
  format: string;
  itemsPerForm: number;
  /** Pool formats (matchToPool / completeFromPool): the shared pool's size. */
  poolSize?: number;
  speakingMinutes?: { min: number; max: number };
};
/** Formats whose items share one lettered pool: option order is fixed, never shuffled. */
export const POOL_FORMATS: readonly string[] = ["matchToPool", "completeFromPool"];
export type CompiledExamSection = {
  id: string;
  skill: ExamSkill;
  title: string;
  minutes: number;
  preparationMinutes?: number;
  maxPoints: number;
  /** Listening: each recording plays this many times. */
  playsPerRecording?: number;
  tasks: CompiledExamTask[];
};
/** A pass-rule group: the format's minimum over the group's sections (DELE: 30 of 50). */
export type CompiledExamGroup = { id: string; title: string; sections: string[]; min: number; max: number };
export type CompiledExamBand = { id: string; minGroupShare: number; label: string; message: string };
export type CompiledExamItem = {
  id: string;
  itemVersion: number;
  sectionId: string;
  taskId: string;
  exercise: Exercise;
  objectiveTargets: string[];
  lexemeRefs: string[];
};
export type CompiledExamTrack = {
  id: string;
  trackVersion: number;
  name: string;
  level: string;
  title: string;
  description: string;
  formatSource: { publisher: string; references: { url: string; title: string; retrieved?: string }[]; checkedAgainstOfficialGuide: boolean; checkedBy?: string; checkedAt?: string; note: string };
  sections: CompiledExamSection[];
  /** Generic pass rule (P3e): every group must reach its minimum — never a single total. */
  passRule: { groups: CompiledExamGroup[] };
  readiness: { bands: CompiledExamBand[]; incomplete: string; disclaimer: string };
  items: CompiledExamItem[];
  forms: { formId: string; itemIds: string[] }[];
};

export type ExamMode = "mock" | "practice";

/** Attempt ids live in the checkpoint-attempt list under the track id, never a checkpoint id. */
export function examAttemptId(trackId: string, mode: ExamMode, sectionId?: string): string {
  return mode === "mock" ? `${trackId}#mock` : `${trackId}#practice:${sectionId ?? ""}`;
}

export function isExamAttemptOf(attempt: { checkpointId: string }, trackId: string): boolean {
  return attempt.checkpointId.startsWith(`${trackId}#`);
}

/** Mock sittings rotate through the parallel forms by how many mocks are already recorded. */
export function selectMockForm(track: CompiledExamTrack, priorMockCount: number): { formId: string; itemIds: string[] } {
  const n = track.forms.length;
  const form = track.forms[((priorMockCount % n) + n) % n];
  return { formId: form.formId, itemIds: [...form.itemIds] };
}

/** A section's items in task order (bank order inside a task); `formId` null = the whole bank (practice). */
export function sectionItems(track: CompiledExamTrack, sectionId: string, formId: string | null): CompiledExamItem[] {
  const section = track.sections.find((s) => s.id === sectionId);
  if (!section) return [];
  const allowed = formId === null ? null : new Set(track.forms.find((f) => f.formId === formId)?.itemIds ?? []);
  const taskOrder = new Map(section.tasks.map((t, i) => [t.id, i]));
  return track.items
    .filter((i) => i.sectionId === sectionId && (allowed === null || allowed.has(i.id)))
    .map((item, index) => ({ item, index }))
    .sort((a, b) => (taskOrder.get(a.item.taskId) ?? 0) - (taskOrder.get(b.item.taskId) ?? 0) || a.index - b.index)
    .map(({ item }) => item);
}

/**
 * One section as a scored session. Mock: first attempt only, minimal
 * feedback (a mock never teaches mid-test). Practice: first attempt is the
 * record too, but feedback is full so the learner sees what was right.
 * Completion "exam": the route records the attempt itself.
 */
export function buildExamSectionSession(args: {
  courseId: string;
  track: CompiledExamTrack;
  sectionId: string;
  formId: string | null;
  mode: ExamMode;
  attemptSeed: number;
}): SessionDefinition {
  const items = sectionItems(args.track, args.sectionId, args.formId);
  const section = args.track.sections.find((s) => s.id === args.sectionId);
  const formatOf = new Map((section?.tasks ?? []).map((t) => [t.id, t.format]));
  const steps: SessionStep[] = items.map((item) => ({
    type: "exercise",
    stepId: item.id,
    // A lettered shared pool keeps its order (the letters ARE the answer
    // sheet); every other scored option set is reshuffled per sitting.
    exercise: POOL_FORMATS.includes(formatOf.get(item.taskId) ?? "")
      ? item.exercise
      : shuffleScoredOptions(
          item.exercise,
          administrationSeed([args.track.id, args.mode, args.formId ?? "bank", `v${args.track.trackVersion}`, `attempt${args.attemptSeed}`, item.id])
        ),
  }));
  return {
    kind: "checkpoint",
    courseId: args.courseId,
    lessonId: examAttemptId(args.track.id, args.mode, args.sectionId),
    steps,
    completion: "exam",
    evidenceSource: "lesson",
    trackMistakes: false,
    allowUndo: false,
    retryPolicy: "none",
    feedbackPolicy: args.mode === "mock" ? "minimal" : "full",
  };
}

/** Item results from a session's first attempts; items never reached (time up) are `null`. */
export function itemResultsFor(itemIds: readonly string[], firstResults: Record<string, boolean>): AssessmentItemResult[] {
  return itemIds.map((itemId) => ({ itemId, correct: firstResults[itemId] === undefined ? null : firstResults[itemId] }));
}

export function buildExamAttempt(args: {
  track: CompiledExamTrack;
  mode: ExamMode;
  sectionId?: string;
  formId: string;
  itemResults: AssessmentItemResult[];
  startedAt: number;
  completedAt: number;
}): CheckpointAttempt {
  const total = args.itemResults.length;
  const correct = args.itemResults.filter((r) => r.correct === true).length;
  return {
    checkpointId: examAttemptId(args.track.id, args.mode, args.sectionId),
    checkpointVersion: args.track.trackVersion,
    formId: args.formId,
    formVersion: args.track.trackVersion,
    startedAt: args.startedAt,
    completedAt: args.completedAt,
    itemResults: args.itemResults,
    objectiveResults: [],
    overallCorrectShare: total === 0 ? 0 : correct / total,
  };
}

export type ExamSectionScore = {
  id: string;
  title: string;
  maxPoints: number;
  administered: number;
  correct: number;
  /** null when the section was not taken (e.g. speaking without a capable device). */
  points: number | null;
};
export type ExamGroupScore = { id: string; title: string; points: number | null; max: number; min: number; reachesThreshold: boolean | null };
export type ExamScore = { sections: ExamSectionScore[]; groups: ExamGroupScore[]; complete: boolean; band: CompiledExamBand | null };

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Score by the format: a section's points are its first-attempt correct
 * share × maxPoints (DELE reading/listening: 1 point per correct item, no
 * negative marking; unanswered = 0); a pass-rule group sums its sections and
 * reaches the format's threshold only at ≥ its minimum. The readiness band
 * comes from the WEAKER group's share — never from a total. With a section
 * not taken the score is incomplete and NO band is given.
 */
export function scoreExam(track: CompiledExamTrack, itemResults: readonly AssessmentItemResult[]): ExamScore {
  const bySection = new Map<string, AssessmentItemResult[]>();
  const sectionOf = new Map(track.items.map((i) => [i.id, i.sectionId]));
  for (const r of itemResults) {
    const sid = sectionOf.get(r.itemId);
    if (sid === undefined) continue;
    bySection.set(sid, [...(bySection.get(sid) ?? []), r]);
  }
  const sections: ExamSectionScore[] = track.sections.map((s) => {
    const rows = bySection.get(s.id) ?? [];
    const correct = rows.filter((r) => r.correct === true).length;
    return { id: s.id, title: s.title, maxPoints: s.maxPoints, administered: rows.length, correct, points: rows.length === 0 ? null : round1((correct / rows.length) * s.maxPoints) };
  });
  const sectionScore = new Map(sections.map((s) => [s.id, s]));
  const groups: ExamGroupScore[] = track.passRule.groups.map((g) => {
    const parts = g.sections.map((id) => sectionScore.get(id));
    const complete = parts.every((p) => p !== undefined && p.points !== null);
    const points = complete ? round1(parts.reduce((n, p) => n + (p!.points ?? 0), 0)) : null;
    return { id: g.id, title: g.title, points, max: g.max, min: g.min, reachesThreshold: points === null ? null : points >= g.min };
  });
  const complete = groups.every((g) => g.points !== null);
  let band: CompiledExamBand | null = null;
  if (complete && groups.length > 0) {
    const minShare = Math.min(...groups.map((g) => (g.points as number) / g.max));
    band = track.readiness.bands.find((b) => minShare >= b.minGroupShare) ?? null;
  }
  return { sections, groups, complete, band };
}

export type ExamWeakAreas = {
  /** Tasks with at least one missed item, worst share first. */
  tasks: { sectionId: string; taskId: string; title: string; missed: number; total: number }[];
  objectiveIds: string[];
  /** Lexemes the missed items exercise — the weak-area practice pool. */
  lexemeIds: string[];
};

export function examWeakAreas(track: CompiledExamTrack, itemResults: readonly AssessmentItemResult[]): ExamWeakAreas {
  const byId = new Map(track.items.map((i) => [i.id, i]));
  const tasks = new Map<string, { sectionId: string; taskId: string; missed: number; total: number }>();
  const objectives = new Map<string, number>();
  const lexemes = new Set<string>();
  for (const r of itemResults) {
    const item = byId.get(r.itemId);
    if (!item) continue;
    const key = `${item.sectionId}/${item.taskId}`;
    const row = tasks.get(key) ?? { sectionId: item.sectionId, taskId: item.taskId, missed: 0, total: 0 };
    row.total += 1;
    if (r.correct !== true) {
      row.missed += 1;
      for (const o of item.objectiveTargets) objectives.set(o, (objectives.get(o) ?? 0) + 1);
      for (const l of item.lexemeRefs) lexemes.add(l);
    }
    tasks.set(key, row);
  }
  const title = (sectionId: string, taskId: string) => track.sections.find((s) => s.id === sectionId)?.tasks.find((t) => t.id === taskId)?.title ?? taskId;
  return {
    tasks: [...tasks.values()]
      .filter((t) => t.missed > 0)
      .sort((a, b) => b.missed / b.total - a.missed / a.total || a.sectionId.localeCompare(b.sectionId) || a.taskId.localeCompare(b.taskId))
      .map((t) => ({ ...t, title: title(t.sectionId, t.taskId) })),
    objectiveIds: [...objectives.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([o]) => o),
    lexemeIds: [...lexemes].sort(),
  };
}

/** Seconds left on a section clock (never negative). */
export function secondsLeft(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}

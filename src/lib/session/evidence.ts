/**
 * Evidence-plan resolution for session steps (Phase 3).
 *
 * Two truth sources, never mixed:
 *  - GENERATED steps (review/TODAY) carry an explicit `step.evidence` plan —
 *    the source already knows exactly which card it tests.
 *  - AUTHORED French PATH selects use the compiler-emitted `gradeTargets`
 *    as the authoritative declaration: exactly one valid stable id makes
 *    the step assessment-eligible; missing, multiple, or invalid targets
 *    fail closed to practice (never a crash, never a guessed card).
 *  - Legacy courses keep their exact pre-Phase-3 shape: surface-keyed
 *    evidence whose role the legacy translation ignores anyway.
 *
 * The evidence GATE (one mutation per card per session, retries, hints,
 * assistance) remains downstream in the engine — this module only decides
 * the target and the planner-intended role.
 */

import { behaviorFor } from "../exercise-registry";
import type { ReviewEvidence, SrsRole } from "../learning/evidence";
import { itemIdForCourse } from "../learning/engine";
import { FR_COURSE_ID, frItemIdFor, isCuratedFrItemId } from "../learning/ids-fr";
import { lexemeIdForLookupForm } from "../learning/lexicon-index";
import { clipFor } from "../reception/content";

import type { ExerciseStep, SessionDefinition, StepEvidencePlan } from "./types";

/** Mistake re-drills stay reinforcement; everything else may assess. */
function plannedRole(definition: SessionDefinition): SrsRole {
  return definition.kind === "mistakes" ? "practice" : "assessment";
}

/**
 * Resolves what a checked exercise step is evidence OF, or null when the
 * step produces no per-check evidence (wordBank/typeAnswer/fillBlank stay
 * non-emitting until deliberate content metadata exists; match emits per
 * pair through its own callback instead).
 */
export function evidencePlanFor(
  definition: SessionDefinition,
  step: ExerciseStep
): StepEvidencePlan | null {
  // Scored assessments (§56-57, §78): NOTHING flows to the learning engine —
  // no FSRS mutation, no wordStats, no review-log noise. Their outcomes are
  // recorded as assessment state by the completion policy instead.
  if (definition.kind === "checkpoint" || definition.kind === "placement") return null;
  if (step.evidence) return step.evidence;

  const exercise = step.exercise;

  // Grammar drills (§58): practice evidence on the drilled noun's own
  // lexeme when it resolves unambiguously — logged, NEVER an assessment,
  // so a grammar answer can never mutate the lexical recognize card.
  if (exercise.type === "articleSelect") {
    if (definition.courseId !== FR_COURSE_ID) return null;
    const id = lexemeIdForLookupForm(exercise.noun);
    return id !== undefined && isCuratedFrItemId(id) ? { itemId: id, srsRole: "practice" } : null;
  }

  // Conjugation production (§67): practice evidence on the verb's own
  // lexeme when it exists — never lexical FSRS assessment.
  if (exercise.type === "conjugationCloze") {
    if (definition.courseId !== FR_COURSE_ID) return null;
    const id = lexemeIdForLookupForm(exercise.verb);
    return id !== undefined && isCuratedFrItemId(id) ? { itemId: id, srsRole: "practice" } : null;
  }

  // Listening comprehension (P7 §72-78): the ONLY exercise shape that may
  // create listen-card evidence is a single-lexeme word_phrase clip with a
  // meaning question — auditory recognition of one word. Every other clip
  // kind (announcements, dialogues, factual, multi-word phrases) is
  // sentence comprehension and NEVER creates lexical cards (§75). Dictation
  // tests orthographic decoding, not meaning — it emits nothing.
  if (exercise.type === "listeningComprehension") {
    if (definition.courseId !== FR_COURSE_ID) return null;
    const clip = clipFor(exercise.clipId);
    if (!clip || clip.kind !== "word_phrase") return null;
    if (clip.lexemeRefs.length !== 1) return null;
    const id = clip.lexemeRefs[0];
    if (!isCuratedFrItemId(id)) return null;
    return { itemId: id, skill: "listen", srsRole: plannedRole(definition) };
  }

  // Elicited spoken production (P8 §15): the ONLY construct that may
  // create speak-card evidence. Repetition/read-aloud are practice by
  // definition (the pipeline also rejects them claiming evidence), scored
  // kinds already returned null above, silence/technical outcomes never
  // reach a check, and skip emits nothing — so what remains is a
  // recognized FINAL on a production step with exactly one curated
  // evidence lexeme. The assisted flag rides the SpokenAnswer and the
  // gate refuses assisted assessments downstream.
  if (exercise.type === "speakProduction") {
    if (definition.courseId !== FR_COURSE_ID) return null;
    const targets = exercise.evidenceLexemeRefs;
    if (targets.length !== 1 || !isCuratedFrItemId(targets[0])) return null;
    return { itemId: targets[0], skill: "speak", srsRole: plannedRole(definition) };
  }
  if (exercise.type === "speakRepetition") return null; // §11: never evidence

  if (exercise.type !== "select") return null;

  if (definition.courseId === FR_COURSE_ID) {
    // The compiler-emitted gradeTargets ARE the deliberate eligibility
    // metadata (Section 2 lessons ship without bundled audio, so the
    // Phase-1 audioTarget proxy cannot be the gate any more).
    const targets = exercise.gradeTargets ?? [];
    if (targets.length === 1 && isCuratedFrItemId(targets[0])) {
      return { itemId: targets[0], srsRole: plannedRole(definition) };
    }
    if (!exercise.audioTarget) return null;
    // No/ambiguous/unknown gradeTargets: log under the best-known id so the
    // interaction is preserved, but never schedule from a guess.
    return { itemId: frItemIdFor(exercise.audioTarget), srsRole: "practice" };
  }

  // Legacy courses: raw surface, unchanged semantics.
  if (!exercise.audioTarget) return null;
  return {
    itemId: exercise.audioTarget,
    srsRole: plannedRole(definition),
  };
}

export function buildCheckEvidence(args: {
  definition: SessionDefinition;
  step: ExerciseStep;
  sessionId: string;
  correct: boolean;
  attemptIndex: number;
  latencyMs: number;
  /** Practice assistance active when the answer was produced (P8 §13). */
  assisted?: boolean;
}): ReviewEvidence | null {
  const { definition, step } = args;
  const plan = evidencePlanFor(definition, step);
  if (!plan) return null;
  const exercise = step.exercise;
  return {
    cardKey: { itemId: plan.itemId, skill: plan.skill ?? "recognize" },
    sessionId: args.sessionId,
    exerciseId: exercise.id,
    modality: behaviorFor(exercise).modality(exercise),
    srsRole: plan.srsRole,
    source: definition.evidenceSource,
    correct: args.correct,
    hinted: false,
    assisted: args.assisted ?? false,
    toleranceUsed: false,
    latencyMs: args.latencyMs,
    attemptIndex: args.attemptIndex,
  };
}

/** Match pair outcomes: reinforcement only — never schedules (contract §4). */
export function buildMatchWordEvidence(args: {
  definition: SessionDefinition;
  step: ExerciseStep;
  sessionId: string;
  surface: string;
  correct: boolean;
  attemptIndex: number;
  latencyMs: number;
}): ReviewEvidence {
  return {
    cardKey: {
      itemId: itemIdForCourse(args.definition.courseId, args.surface),
      skill: "recognize",
    },
    sessionId: args.sessionId,
    exerciseId: args.step.exercise.id,
    modality: "match",
    srsRole: "none",
    source: args.definition.evidenceSource,
    correct: args.correct,
    hinted: false,
    assisted: false,
    toleranceUsed: false,
    latencyMs: args.latencyMs,
    attemptIndex: args.attemptIndex,
  };
}

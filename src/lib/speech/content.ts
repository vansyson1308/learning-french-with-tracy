/**
 * Runtime access to the compiled speech items, per course (P1b). Content
 * only — learner state lives in the store. Reserved (assessment) items are
 * excluded at COMPILE time, so nothing this module returns can ever leak a
 * checkpoint prompt into practice or review (§20). A course without
 * authored speech items resolves an empty artifact — every consumer
 * handles that as "no speaking content yet", never as an error.
 */

import { artifactsFor, memoByCourse } from "../content-registry";
import type { SpeakProductionExercise } from "../types";

export type CompiledSpeechItem = {
  id: string;
  taskFamily: "formulaic_exchange" | "self_introduction" | "information_giving" | "description";
  elicitationType:
    | "repetition"
    | "read_aloud"
    | "semantic_prompt"
    | "situation_prompt"
    | "picture_prompt"
    | "information_prompt";
  prompt: {
    instruction: string;
    cueEmoji?: string;
    cueFacts?: { label: string; value: string }[];
  };
  target: string;
  acceptedVariants: string[];
  requiredConcepts?: string[][];
  objectiveRefs: string[];
  lexemeRefs: string[];
  evidenceLexemeRefs: string[];
  assistancePolicy: {
    allowContextualBias: boolean;
    revealTargetAfterAttempts: number | null;
  };
  scoredEligibility: boolean;
  modelAudioRef: string | null;
  allowedAttempts: number;
};

type SpeechArtifact = { order: string[]; byId: Record<string, CompiledSpeechItem> };
const EMPTY: SpeechArtifact = { order: [], byId: {} };

const speechOf = memoByCourse<SpeechArtifact>(
  (courseId) => (artifactsFor(courseId).speech as SpeechArtifact | undefined) ?? EMPTY
);

const PRODUCTION_TYPES: readonly string[] = [
  "semantic_prompt",
  "situation_prompt",
  "picture_prompt",
  "information_prompt",
];

export function speechItemFor(courseId: string, id: string): CompiledSpeechItem | undefined {
  return speechOf(courseId).byId[id];
}

export function speechItemIds(courseId: string): string[] {
  return speechOf(courseId).order;
}

/**
 * lexemeId → the FIRST production item that grades exactly that one
 * lexeme's speak card — the same single-evidence-target rule the evidence
 * plan enforces, applied at selection time so review probes always
 * resolve to a gradeable step.
 */
export const speakProductionIndex = memoByCourse<Record<string, string>>((courseId) => {
  const speech = speechOf(courseId);
  const index: Record<string, string> = {};
  for (const id of speech.order) {
    const item = speech.byId[id];
    if (!item || !PRODUCTION_TYPES.includes(item.elicitationType)) continue;
    if (item.evidenceLexemeRefs.length !== 1) continue;
    const lexemeId = item.evidenceLexemeRefs[0];
    if (index[lexemeId] === undefined) index[lexemeId] = id;
  }
  return index;
});

/**
 * lexemeId → prebuilt production exercise for TODAY's speaking share
 * (P8 §17). Ids are stable per lexeme; the composer re-ids its copies.
 */
export function speakExerciseIndex(courseId: string): Record<string, SpeakProductionExercise> {
  const speech = speechOf(courseId);
  const result: Record<string, SpeakProductionExercise> = {};
  for (const [lexemeId, itemId] of Object.entries(speakProductionIndex(courseId))) {
    const item = speech.byId[itemId];
    if (item) result[lexemeId] = speakExerciseForItem(item, `speak-${lexemeId}`);
  }
  return result;
}

/** Build the runtime production exercise a compiled item describes. */
export function speakExerciseForItem(
  item: CompiledSpeechItem,
  exerciseId: string
): SpeakProductionExercise {
  return {
    type: "speakProduction",
    id: exerciseId,
    speechItemId: item.id,
    instruction: item.prompt.instruction,
    ...(item.prompt.cueEmoji !== undefined ? { cueEmoji: item.prompt.cueEmoji } : {}),
    ...(item.prompt.cueFacts !== undefined ? { cueFacts: item.prompt.cueFacts } : {}),
    target: item.target,
    acceptedVariants: item.acceptedVariants,
    ...(item.requiredConcepts !== undefined
      ? { requiredConcepts: item.requiredConcepts }
      : {}),
    evidenceLexemeRefs: item.evidenceLexemeRefs,
    revealTargetAfterAttempts: item.assistancePolicy.revealTargetAfterAttempts,
    allowContextualBias: item.assistancePolicy.allowContextualBias,
    modelClipId: item.modelAudioRef,
    allowedAttempts: item.allowedAttempts,
    objectiveTargets: item.objectiveRefs,
  };
}

/**
 * Runtime access to the compiled Phase-8 speech items. Content only —
 * learner state lives in the store. Reserved (assessment) items are
 * excluded at COMPILE time, so nothing this module returns can ever leak a
 * checkpoint prompt into practice or review (§20). The artifact is empty
 * until the Section-4 curriculum authors items; every consumer handles
 * that as "no speaking content yet", never as an error.
 */

import speechArtifact from "../../content/speech/fr-speech-items.json";
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

const speech = speechArtifact as unknown as {
  order: string[];
  byId: Record<string, CompiledSpeechItem>;
};

const PRODUCTION_TYPES: readonly string[] = [
  "semantic_prompt",
  "situation_prompt",
  "picture_prompt",
  "information_prompt",
];

export function speechItemFor(id: string): CompiledSpeechItem | undefined {
  return speech.byId[id];
}

export function speechItemIds(): string[] {
  return speech.order;
}

/**
 * lexemeId → the FIRST production item that grades exactly that one
 * lexeme's speak card — the same single-evidence-target rule the evidence
 * plan enforces, applied at selection time so review probes always
 * resolve to a gradeable step.
 */
export function speakProductionIndex(): Record<string, string> {
  const index: Record<string, string> = {};
  for (const id of speech.order) {
    const item = speech.byId[id];
    if (!item || !PRODUCTION_TYPES.includes(item.elicitationType)) continue;
    if (item.evidenceLexemeRefs.length !== 1) continue;
    const lexemeId = item.evidenceLexemeRefs[0];
    if (index[lexemeId] === undefined) index[lexemeId] = id;
  }
  return index;
}

/**
 * lexemeId → prebuilt production exercise for TODAY's speaking share
 * (P8 §17). Ids are stable per lexeme; the composer re-ids its copies.
 */
export function speakExerciseIndex(): Record<string, SpeakProductionExercise> {
  const result: Record<string, SpeakProductionExercise> = {};
  for (const [lexemeId, itemId] of Object.entries(speakProductionIndex())) {
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

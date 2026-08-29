/**
 * Phase-8 speech pipeline library (P8 §19): loader + construct-validity
 * validators for spoken-production items. The validators REJECT construct
 * contradictions at authoring time — a scored item that exposes its French,
 * a repetition item claiming production evidence, an ungradeable target —
 * so no construct-invalid item can ever reach a learner.
 */

import { existsSync } from "fs";

import { z } from "zod";

import {
  SPEECH_PRACTICE_ELICITATIONS,
  SpeakProductionExerciseSchema,
  SpeakRepetitionExerciseSchema,
  SpeechItemsSchema,
  type CourseObjectives,
  type Listening,
  type SpeechItem,
  type SpeechItems,
} from "../../content/schema";
import { foldSpokenFrench, normalizeSpokenFrench } from "../../src/lib/speech/grader";
import { canonicalJson, readJson, safeResolve, type ValidationResult } from "./pipeline";

export const SPEECH_SOURCE = "content/fr/speech/items.json";

export function loadSpeechItems(): SpeechItems | null {
  if (!existsSync(safeResolve(SPEECH_SOURCE))) return null;
  return SpeechItemsSchema.parse(readJson(SPEECH_SOURCE));
}

/**
 * Runtime artifact for the app's speech content module. ALWAYS emitted
 * (empty before the curriculum authors items) so the static import exists,
 * and NEVER includes reserved items — assessment prompts stay out of every
 * practice/review surface by construction (§20).
 */
export function compileSpeechItemsArtifact(speech: SpeechItems | null): string {
  const items = (speech?.items ?? []).filter((item) => !item.reserved);
  const byId: Record<string, unknown> = {};
  for (const item of items) {
    byId[item.id] = {
      id: item.id,
      taskFamily: item.taskFamily,
      elicitationType: item.elicitationType,
      prompt: item.prompt,
      target: item.target,
      acceptedVariants: item.acceptedVariants,
      ...(item.requiredConcepts ? { requiredConcepts: item.requiredConcepts } : {}),
      objectiveRefs: item.objectiveRefs,
      lexemeRefs: item.lexemeRefs,
      evidenceLexemeRefs: item.evidenceLexemeRefs,
      assistancePolicy: item.assistancePolicy,
      scoredEligibility: item.scoredEligibility,
      modelAudioRef: item.modelAudioRef,
      allowedAttempts: item.allowedAttempts,
    };
  }
  return canonicalJson({
    generator: "scripts/lib/speech.ts",
    version: 1,
    order: items.map((item) => item.id),
    byId,
  });
}

const PRACTICE_TYPES: readonly string[] = SPEECH_PRACTICE_ELICITATIONS;

export function isPracticeElicitation(item: SpeechItem): boolean {
  return PRACTICE_TYPES.includes(item.elicitationType);
}

/** Every learner-visible prompt string of an item (emoji cues excluded). */
function promptTexts(item: SpeechItem): string[] {
  const texts = [item.prompt.instruction];
  for (const fact of item.prompt.cueFacts ?? []) texts.push(fact.label, fact.value);
  return texts;
}

/**
 * Does a prompt text expose the French answer (§13)? True when any
 * contiguous run of min(2, |answer|) answer tokens appears in the text —
 * whole short answers ("Bonjour") and fragments of longer ones ("un café"
 * inside a cue) both count. Folding is DIGIT-BLIND on purpose: a cue
 * showing "2" conveys the meaning, not the French word "deux", so numeric
 * task data never trips the validator while French orthography always does.
 */
function exposesFrench(promptText: string, frenchAnswer: string): boolean {
  const prompt = foldSpokenFrench(promptText).split(" ").filter(Boolean);
  const french = foldSpokenFrench(frenchAnswer).split(" ").filter(Boolean);
  if (french.length === 0 || prompt.length === 0) return false;
  const window = Math.min(2, french.length);
  for (let start = 0; start + window <= french.length; start++) {
    const run = french.slice(start, start + window);
    outer: for (let at = 0; at + run.length <= prompt.length; at++) {
      for (let offset = 0; offset < run.length; offset++) {
        if (prompt[at + offset] !== run[offset]) continue outer;
      }
      return true;
    }
  }
  return false;
}

type SpeakRepetitionExercise = z.infer<typeof SpeakRepetitionExerciseSchema>;
type SpeakProductionExercise = z.infer<typeof SpeakProductionExerciseSchema>;

/** Minimal pack shape for the exercise cross-checks (schema-validated upstream). */
export type FrPackForSpeech = {
  sections: {
    units: { lessons: { exercises: ({ type: string; id: string } & Record<string, unknown>)[] }[] }[];
  }[];
};

function packSpeechExercises(
  pack: FrPackForSpeech
): (SpeakRepetitionExercise | SpeakProductionExercise)[] {
  const found: (SpeakRepetitionExercise | SpeakProductionExercise)[] = [];
  for (const section of pack.sections) {
    for (const unit of section.units) {
      for (const lesson of unit.lessons) {
        for (const exercise of lesson.exercises) {
          if (exercise.type === "speakRepetition") {
            found.push(exercise as unknown as SpeakRepetitionExercise);
          } else if (exercise.type === "speakProduction") {
            found.push(exercise as unknown as SpeakProductionExercise);
          }
        }
      }
    }
  }
  return found;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export function validateSpeech(input: {
  speech: SpeechItems | null;
  objectives: CourseObjectives | null;
  listening: Listening | null;
  lexemeIds: Set<string>;
  /** When provided, embedded speech-exercise fields must mirror the items. */
  frPack?: FrPackForSpeech;
  /** Speak exercises from scored banks (checkpoints/placement) — must
   *  mirror RESERVED items (§20). Callers collect via
   *  assessmentBankSpeechExercises(). */
  assessmentSpeech?: (SpeakRepetitionExercise | SpeakProductionExercise)[];
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const err = (m: string) => errors.push(`speech: ${m}`);
  if (input.speech === null) return { errors, warnings };

  const knownObjectives = new Set(
    (input.objectives?.objectives ?? []).map((objective) => objective.id)
  );
  const knownClips = new Set((input.listening?.clips ?? []).map((clip) => clip.id));
  const knownLexemes = input.lexemeIds;

  const ids = new Set<string>();
  for (const item of input.speech.items) {
    if (ids.has(item.id)) err(`duplicate item id ${item.id}`);
    ids.add(item.id);

    // --- gradability -----------------------------------------------------
    const normalizedVariants = item.acceptedVariants.map(normalizeSpokenFrench);
    normalizedVariants.forEach((variant, index) => {
      if (variant.length === 0) {
        err(`${item.id}: acceptedVariants[${index}] normalizes to nothing`);
      }
    });
    if (new Set(normalizedVariants).size !== normalizedVariants.length) {
      err(`${item.id}: acceptedVariants contains duplicates after normalization`);
    }
    const normalizedTarget = normalizeSpokenFrench(item.target);
    if (normalizedTarget.length === 0) {
      err(`${item.id}: target normalizes to nothing`);
    } else if (!normalizedVariants.includes(normalizedTarget)) {
      err(`${item.id}: target "${item.target}" is not accepted by its own variants`);
    }
    for (const [slotIndex, slot] of (item.requiredConcepts ?? []).entries()) {
      for (const form of slot) {
        if (normalizeSpokenFrench(form).length === 0) {
          err(`${item.id}: requiredConcepts[${slotIndex}] has a form normalizing to nothing`);
        }
      }
    }

    // --- construct validity (§11/§13) ------------------------------------
    if (isPracticeElicitation(item)) {
      if (item.scoredEligibility) {
        err(
          `${item.id}: ${item.elicitationType} is a PRACTICE construct and can never be scored spoken production`
        );
      }
      if (item.evidenceLexemeRefs.length > 0) {
        err(
          `${item.id}: ${item.elicitationType} can never produce speak-card evidence (evidenceLexemeRefs must be empty)`
        );
      }
      if (item.elicitationType === "repetition" && item.modelAudioRef === null) {
        err(`${item.id}: repetition needs a modelAudioRef — there is nothing to repeat`);
      }
    } else {
      // Production cues must carry MEANING, never the French form: no
      // accepted answer (whole or fragment) may occur inside any
      // learner-visible prompt text.
      for (const text of promptTexts(item)) {
        for (const variant of item.acceptedVariants) {
          if (exposesFrench(text, variant)) {
            err(
              `${item.id}: prompt text ${JSON.stringify(text)} exposes the French answer ${JSON.stringify(variant)} before the attempt`
            );
          }
        }
      }
    }
    if (item.assistancePolicy.allowContextualBias && item.scoredEligibility) {
      err(
        `${item.id}: contextual bias is a practice affordance — a scored-eligible item must not allow it (§13)`
      );
    }

    // --- reference integrity ---------------------------------------------
    for (const objective of item.objectiveRefs) {
      if (input.objectives !== null && !knownObjectives.has(objective)) {
        err(`${item.id}: unknown objective ${objective}`);
      }
    }
    const lexemeRefs = new Set(item.lexemeRefs);
    for (const lexeme of item.lexemeRefs) {
      if (!knownLexemes.has(lexeme)) err(`${item.id}: unknown lexeme ${lexeme}`);
    }
    for (const lexeme of item.evidenceLexemeRefs) {
      if (!lexemeRefs.has(lexeme)) {
        err(`${item.id}: evidence lexeme ${lexeme} is not in lexemeRefs`);
      }
    }
    if (item.modelAudioRef !== null && input.listening !== null && !knownClips.has(item.modelAudioRef)) {
      err(`${item.id}: modelAudioRef ${item.modelAudioRef} resolves to no listening clip`);
    }
  }

  // --- embedded exercises must mirror their items exactly (single source
  // of truth stays the item; embedded runtime copies cannot drift) --------
  const itemById = new Map(input.speech.items.map((entry) => [entry.id, entry]));
  const checkMirror = (
    exercise: SpeakRepetitionExercise | SpeakProductionExercise,
    context: "path" | "assessment"
  ) => {
    const item = itemById.get(exercise.speechItemId);
    if (!item) {
      err(`${exercise.id}: unknown speech item ${exercise.speechItemId}`);
      return;
    }
    if (context === "path" && item.reserved) {
      // §20: reserved assessment prompts never appear as teaching or
      // practice stimuli anywhere in the course path.
      err(`${exercise.id}: speech item ${item.id} is RESERVED for assessment`);
    }
    if (context === "assessment" && !item.reserved) {
      // The mirror rule: scored banks may only probe with reserved items,
      // so no teaching stimulus is ever re-used as an assessment prompt.
      err(`${exercise.id}: assessment banks must use RESERVED items, got ${item.id}`);
    }
    if (!same(exercise.target, item.target)) {
      err(`${exercise.id}: target differs from item ${item.id}`);
    }
    if (!same(exercise.acceptedVariants, item.acceptedVariants)) {
      err(`${exercise.id}: acceptedVariants differ from item ${item.id}`);
    }
    if (!same(exercise.requiredConcepts, item.requiredConcepts)) {
      err(`${exercise.id}: requiredConcepts differ from item ${item.id}`);
    }
    if (exercise.type === "speakRepetition") {
      if (context === "assessment") {
        err(`${exercise.id}: repetition is practice — it can never appear in a scored bank`);
      }
      if (item.elicitationType !== "repetition") {
        err(
          `${exercise.id}: speakRepetition must reference a repetition item, got ${item.elicitationType}`
        );
      }
      if (item.modelAudioRef === null || exercise.modelClipId !== item.modelAudioRef) {
        err(`${exercise.id}: modelClipId must equal item ${item.id} modelAudioRef`);
      }
    } else {
      if (isPracticeElicitation(item)) {
        err(
          `${exercise.id}: speakProduction must reference a production item, got ${item.elicitationType}`
        );
      }
      if (!same(exercise.instruction, item.prompt.instruction)) {
        err(`${exercise.id}: instruction differs from item ${item.id}`);
      }
      if (!same(exercise.cueEmoji, item.prompt.cueEmoji)) {
        err(`${exercise.id}: cueEmoji differs from item ${item.id}`);
      }
      if (!same(exercise.cueFacts, item.prompt.cueFacts)) {
        err(`${exercise.id}: cueFacts differ from item ${item.id}`);
      }
      if (exercise.revealTargetAfterAttempts !== item.assistancePolicy.revealTargetAfterAttempts) {
        err(`${exercise.id}: revealTargetAfterAttempts differs from item ${item.id}`);
      }
      if (exercise.allowContextualBias !== item.assistancePolicy.allowContextualBias) {
        err(`${exercise.id}: allowContextualBias differs from item ${item.id}`);
      }
      if (!same(exercise.modelClipId, item.modelAudioRef)) {
        err(`${exercise.id}: modelClipId differs from item ${item.id} modelAudioRef`);
      }
      if (exercise.allowedAttempts !== item.allowedAttempts) {
        err(`${exercise.id}: allowedAttempts differs from item ${item.id}`);
      }
      if (!same(exercise.evidenceLexemeRefs, item.evidenceLexemeRefs)) {
        err(`${exercise.id}: evidenceLexemeRefs differ from item ${item.id}`);
      }
    }
  };

  if (input.frPack) {
    for (const exercise of packSpeechExercises(input.frPack)) checkMirror(exercise, "path");
  }
  for (const exercise of input.assessmentSpeech ?? []) {
    checkMirror(exercise, "assessment");
  }

  return { errors, warnings };
}

/** Speak exercises inside the checkpoint and placement banks (§20). */
export function assessmentBankSpeechExercises(): (
  | SpeakRepetitionExercise
  | SpeakProductionExercise
)[] {
  const found: (SpeakRepetitionExercise | SpeakProductionExercise)[] = [];
  const collect = (items: unknown) => {
    if (!Array.isArray(items)) return;
    for (const entry of items) {
      const exercise = (entry as { exercise?: { type?: unknown } }).exercise;
      if (
        exercise?.type === "speakProduction" ||
        exercise?.type === "speakRepetition"
      ) {
        found.push(exercise as SpeakRepetitionExercise | SpeakProductionExercise);
      }
    }
  };
  for (const [relPath, key] of [
    ["content/fr/assessment/checkpoints.json", "checkpoints"],
    ["content/fr/assessment/placement.json", "stages"],
  ] as const) {
    try {
      const doc = readJson(relPath) as Record<string, unknown>;
      const containers = doc[key];
      if (!Array.isArray(containers)) continue;
      for (const container of containers) {
        collect((container as { items?: unknown }).items);
        for (const cluster of (container as { clusters?: unknown[] }).clusters ?? []) {
          collect((cluster as { items?: unknown }).items);
        }
      }
    } catch {
      // Bank absent — nothing to check.
    }
  }
  return found;
}

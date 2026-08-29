/**
 * Phase-8 speech pipeline library (P8 §19): loader + construct-validity
 * validators for spoken-production items. The validators REJECT construct
 * contradictions at authoring time — a scored item that exposes its French,
 * a repetition item claiming production evidence, an ungradeable target —
 * so no construct-invalid item can ever reach a learner.
 */

import { existsSync } from "fs";

import {
  SPEECH_PRACTICE_ELICITATIONS,
  SpeechItemsSchema,
  type CourseObjectives,
  type Listening,
  type SpeechItem,
  type SpeechItems,
} from "../../content/schema";
import { foldSpokenFrench, normalizeSpokenFrench } from "../../src/lib/speech/grader";
import { readJson, safeResolve, type ValidationResult } from "./pipeline";

export const SPEECH_SOURCE = "content/fr/speech/items.json";

export function loadSpeechItems(): SpeechItems | null {
  if (!existsSync(safeResolve(SPEECH_SOURCE))) return null;
  return SpeechItemsSchema.parse(readJson(SPEECH_SOURCE));
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

export function validateSpeech(input: {
  speech: SpeechItems | null;
  objectives: CourseObjectives | null;
  listening: Listening | null;
  lexemeIds: Set<string>;
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

  return { errors, warnings };
}

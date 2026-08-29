/**
 * Deterministic writing rubric engine (P9 §16-§19).
 *
 * Grades GUIDED written production locally, with three honest outcomes:
 *
 *   meets_rubric            — every authored communicative requirement is
 *                             demonstrably present;
 *   does_not_meet_rubric    — the engine can point at a concrete, named
 *                             failure (missing slot, too short, no clause,
 *                             prompt copy);
 *   insufficiently_scorable — the engine genuinely cannot classify the
 *                             response safely (empty, or not recognizably
 *                             French). In scored contexts this is
 *                             INSUFFICIENT EVIDENCE, never failure (§17).
 *
 * Everything checked here is authored in the task's rubric. The engine
 * never invents grammar judgment (§18): "sentence-ness" is checked only
 * against an explicit per-task verb allowlist, and French plausibility is
 * membership in a compiled known-forms vocabulary — not parsing.
 *
 * Normalization is accent-INSENSITIVE on top of the shared French folding
 * (case, apostrophes, hyphens, punctuation, digits→words): A1 orthographic
 * control is low, and failing "ecole" against "école" would grade typing,
 * not communication. No LLM, no fuzz, no confidence anywhere.
 */

import { normalizeSpokenFrench } from "../speech/grader";

export type WritingVerdict =
  | "meets_rubric"
  | "does_not_meet_rubric"
  | "insufficiently_scorable";

export type WritingSlot = {
  id: string;
  /** Learner-facing description, used verbatim in feedback. */
  description: string;
  variants: string[];
  cueProvided: boolean;
};

export type WritingRubric = {
  requiredSlots: WritingSlot[];
  minTokens: number;
  maxTokens: number;
  requireSentenceVerbs?: string[];
};

export type WritingEvaluation = {
  verdict: WritingVerdict;
  matchedSlotIds: string[];
  missingSlots: { id: string; description: string }[];
  /** Share of tokens recognized as French (0..1); 1 for empty input. */
  frenchShare: number;
  tokenCount: number;
  /** Honest, specific problem feedback — empty when the rubric is met. */
  feedback: string[];
};

/** Fold + digits→words + diacritic-insensitive (typing-kind, meaning-strict). */
export function normalizeWrittenFrench(text: string): string {
  return normalizeSpokenFrench(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC");
}

function tokensOf(normalized: string): string[] {
  return normalized.length === 0 ? [] : normalized.split(" ");
}

/** Contiguous token-run containment (shared matching semantics with speech). */
function containsRun(haystack: string[], needle: string[]): boolean {
  if (needle.length === 0) return false;
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return true;
  }
  return false;
}

function slotMatched(answerTokens: string[], slot: WritingSlot): boolean {
  return slot.variants.some((variant) =>
    containsRun(answerTokens, tokensOf(normalizeWrittenFrench(variant)))
  );
}

/** The insufficiently-scorable floor: below this share we refuse to judge. */
export const FRENCH_SHARE_FLOOR = 0.5;

export function evaluateGuidedWriting(input: {
  text: string;
  rubric: WritingRubric;
  /** Instruction + cue text, for prompt-copy detection. */
  promptText: string;
  /** Compiled known-French token vocabulary (fr-writing artifact). */
  knownFrench: ReadonlySet<string>;
}): WritingEvaluation {
  const { rubric } = input;
  const normalized = normalizeWrittenFrench(input.text);
  const answerTokens = tokensOf(normalized);
  const tokenCount = answerTokens.length;

  const matched = rubric.requiredSlots.filter((s) => slotMatched(answerTokens, s));
  const missing = rubric.requiredSlots
    .filter((s) => !matched.includes(s))
    .map((s) => ({ id: s.id, description: s.description }));
  const matchedSlotIds = matched.map((s) => s.id);

  // Tokens the task itself makes legitimate: slot variants and cue values
  // (names, cities, numbers handed to the learner) count as French here.
  const taskTokens = new Set<string>();
  for (const slot of rubric.requiredSlots) {
    for (const v of slot.variants) {
      for (const t of tokensOf(normalizeWrittenFrench(v))) taskTokens.add(t);
    }
  }
  const knownCount = answerTokens.filter(
    (t) => input.knownFrench.has(t) || taskTokens.has(t)
  ).length;
  const frenchShare = tokenCount === 0 ? 1 : knownCount / tokenCount;

  const base = { matchedSlotIds, missingSlots: missing, frenchShare, tokenCount };

  // 1. Nothing written → nothing to judge.
  if (tokenCount === 0) {
    return {
      ...base,
      verdict: "insufficiently_scorable",
      feedback: ["Write your answer in French."],
    };
  }

  // 2. Not recognizably French → refuse to judge rather than guess (§17).
  //    This is deliberately checked BEFORE slots: an English sentence with
  //    French keywords must never pass (§67).
  if (frenchShare < FRENCH_SHARE_FLOOR) {
    return {
      ...base,
      verdict: "insufficiently_scorable",
      feedback: ["I can only check French — try writing your answer in French."],
    };
  }

  // 3. Prompt copy: every answer token already appears in the prompt/cues.
  //    A real answer adds its own French around the given facts.
  const promptTokens = new Set(tokensOf(normalizeWrittenFrench(input.promptText)));
  if (tokenCount >= 2 && answerTokens.every((t) => promptTokens.has(t))) {
    return {
      ...base,
      verdict: "does_not_meet_rubric",
      feedback: ["Write your own answer in French — don't copy the prompt."],
    };
  }

  const feedback: string[] = [];

  // 4. Length bounds.
  if (tokenCount < rubric.minTokens) {
    feedback.push(
      `Try a complete short answer — at least ${rubric.minTokens} words.`
    );
  } else if (tokenCount > rubric.maxTokens) {
    feedback.push("Keep it short and simple — a few short sentences are enough.");
  }

  // 5. A real clause, when the task demands one (authored allowlist only).
  const verbs = rubric.requireSentenceVerbs ?? [];
  if (verbs.length > 0) {
    const hasVerb = verbs.some((v) =>
      containsRun(answerTokens, tokensOf(normalizeWrittenFrench(v)))
    );
    if (!hasVerb) {
      feedback.push(
        `Use a complete sentence with a verb (for example: “${verbs[0]}”).`
      );
    }
  }

  // 6. Required information slots.
  if (missing.length > 0) {
    if (matched.length > 0) {
      feedback.push(
        `You included ${matched.map((s) => s.description).join(" and ")}, ` +
          `but not ${missing.map((m) => m.description).join(" or ")}.`
      );
    } else {
      feedback.push(`Don't forget: ${missing.map((m) => m.description).join(", ")}.`);
    }
  }

  if (feedback.length > 0) {
    return { ...base, verdict: "does_not_meet_rubric", feedback };
  }
  return { ...base, verdict: "meets_rubric", feedback: [] };
}

export type FormFieldSpec = { id: string; label: string; slotId: string };

export function evaluateSimpleForm(input: {
  values: Record<string, string>;
  fields: FormFieldSpec[];
  rubric: WritingRubric;
}): WritingEvaluation {
  const slotsById = new Map(input.rubric.requiredSlots.map((s) => [s.id, s]));
  const matchedSlotIds: string[] = [];
  const missingSlots: { id: string; description: string }[] = [];
  const feedback: string[] = [];
  let filled = 0;
  let totalTokens = 0;

  for (const field of input.fields) {
    const slot = slotsById.get(field.slotId);
    if (!slot) continue; // validator-impossible; fail closed as missing
    const raw = input.values[field.id] ?? "";
    const answerTokens = tokensOf(normalizeWrittenFrench(raw));
    totalTokens += answerTokens.length;
    if (answerTokens.length === 0) {
      missingSlots.push({ id: slot.id, description: slot.description });
      feedback.push(`Fill in the “${field.label}” field.`);
      continue;
    }
    filled += 1;
    if (slotMatched(answerTokens, slot)) {
      matchedSlotIds.push(slot.id);
    } else {
      missingSlots.push({ id: slot.id, description: slot.description });
      feedback.push(`Check the “${field.label}” field.`);
    }
  }

  const base = {
    matchedSlotIds,
    missingSlots,
    frenchShare: 1,
    tokenCount: totalTokens,
  };
  if (filled === 0) {
    return {
      ...base,
      verdict: "insufficiently_scorable",
      feedback: ["Fill in the form to answer."],
    };
  }
  if (missingSlots.length > 0) {
    return { ...base, verdict: "does_not_meet_rubric", feedback };
  }
  return { ...base, verdict: "meets_rubric", feedback: [] };
}

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

import { msg, type Message } from "../i18n/message";
import { alignedMatchKind, bestMatchKind, type MatchKind } from "../languages/reading-input";
import type { LanguageRules } from "../languages/types";
import { normalizeSpoken } from "../speech/grader";

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
  /** A letter's closing: "Thank you. Best regards" is one ending, so realizing it twice is not keyword stuffing. */
  repeatable?: boolean;
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
  /** Share of tokens recognized as target-language vocabulary (0..1); 1 for empty input. */
  knownShare: number;
  tokenCount: number;
  /** Honest, specific problem feedback as message references (the UI formats them) — empty when the rubric is met. */
  feedback: Message[];
  /**
   * P4b: matched slots realized ONLY through the plugin's reading notation
   * (ja kana / zh pinyin for a variant in the target script). They count
   * for the verdict the learner sees; whether they count as production is
   * the course's call (grading.ts readingOnlyAnswer /
   * productionWritingEvaluation). Absent when there are none — always for
   * Latin-script plugins.
   */
  readingOnlySlotIds?: string[];
};

/**
 * Fold + digits→words + diacritic-insensitive (typing-kind, meaning-strict)
 * under the course's language rules. Diacritic stripping is a Latin-script
 * typing tolerance; plugins whose marks are phonemic (Vietnamese tones)
 * keep them because their lenient form already does.
 */
export function normalizeWritten(text: string, rules: LanguageRules): string {
  return rules.normalizeLenient(normalizeSpoken(text, rules));
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

type AlignToKey = LanguageRules["alignAnswerToKey"];

/**
 * How the answer realizes one slot: in the target script, ONLY through the
 * plugin's reading notation (P4b: kana for a kanji variant, pinyin for a
 * hanzi variant — languages/reading-input.ts), or not at all. Whether it
 * matches is exactly the plain containment-after-alignment test.
 */
function slotMatch(answerTokens: string[], slot: WritingSlot, rules: LanguageRules, align: AlignToKey): MatchKind {
  return bestMatchKind(
    slot.variants.map((variant) => {
      const key = normalizeWritten(variant, rules);
      const aligned = align?.(answerTokens.join(" "), key);
      const keyTokens = tokensOf(key);
      if (!containsRun(aligned === undefined ? answerTokens : tokensOf(aligned), keyTokens)) return null;
      return aligned === undefined || containsRun(answerTokens, keyTokens) ? "script" : alignedMatchKind(rules);
    })
  );
}

/** The optional evaluation field, present only when some slot was realized through the reading notation alone. */
function readingOnlyField(slotIds: string[]): { readingOnlySlotIds?: string[] } {
  return slotIds.length === 0 ? {} : { readingOnlySlotIds: slotIds };
}

/** Every [start, end) run where `needle` occurs in `haystack`. */
function runSpans(haystack: string[], needle: string[]): [number, number][] {
  const spans: [number, number][] = [];
  if (needle.length === 0) return spans;
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    spans.push([i, i + needle.length]);
  }
  return spans;
}

/**
 * How many DISTINCT places the answer realizes one slot (Phase 10 §27):
 * overlapping variant matches ("moi je suis Léa" hitting two variants at
 * once) count once; "je m'appelle Léa … je suis Léa" counts twice. Writing
 * every variant you can think of is keyword stuffing, not an answer.
 */
function slotRealizations(answerTokens: string[], slot: WritingSlot, rules: LanguageRules): number {
  const spans = slot.variants
    .flatMap((variant) => runSpans(answerTokens, tokensOf(normalizeWritten(variant, rules))))
    .sort((a, b) => a[0] - b[0]);
  let count = 0;
  let end = -1;
  for (const [start, stop] of spans) {
    if (start >= end) {
      count += 1;
      end = stop;
    } else if (stop > end) {
      end = stop;
    }
  }
  return count;
}

/** The insufficiently-scorable floor: below this share we refuse to judge. */
export const KNOWN_SHARE_FLOOR = 0.5;

export function evaluateGuidedWriting(input: {
  /** The course's language rules (folding, digits, tokens). */
  rules: LanguageRules;
  /** Display name of the target language, for the feedback copy. */
  targetLanguage: string;
  text: string;
  rubric: WritingRubric;
  /** Instruction + cue text, for prompt-copy detection. */
  promptText: string;
  /** Compiled known-vocabulary token set of the course (writing artifact). */
  knownVocabulary: ReadonlySet<string>;
  /**
   * Task mode (default "guided"). Open practice rubrics carry MENU slots —
   * "any sentence about you" satisfied by several different starters — so
   * realizing several of them is the point, never keyword stuffing.
   */
  mode?: "guided" | "open";
}): WritingEvaluation {
  const { rubric, rules, targetLanguage } = input;
  const normalized = normalizeWritten(input.text, rules);
  const answerTokens = tokensOf(normalized);
  const tokenCount = answerTokens.length;

  const kinds = new Map(rubric.requiredSlots.map((s) => [s, slotMatch(answerTokens, s, rules, rules.alignWrittenToKey)]));
  const matched = rubric.requiredSlots.filter((s) => kinds.get(s) !== null);
  const missing = rubric.requiredSlots
    .filter((s) => !matched.includes(s))
    .map((s) => ({ id: s.id, description: s.description }));
  const matchedSlotIds = matched.map((s) => s.id);

  // Tokens the task itself makes legitimate: slot variants and cue values
  // (names, cities, numbers handed to the learner) count as French here.
  const taskTokens = new Set<string>();
  for (const slot of rubric.requiredSlots) {
    for (const v of slot.variants) {
      for (const t of tokensOf(normalizeWritten(v, rules))) taskTokens.add(t);
    }
  }
  const knownCount = answerTokens.filter(
    (t) => input.knownVocabulary.has(t) || taskTokens.has(t)
  ).length;
  const knownShare = tokenCount === 0 ? 1 : knownCount / tokenCount;

  const base = {
    matchedSlotIds,
    missingSlots: missing,
    knownShare,
    tokenCount,
    ...readingOnlyField(matched.filter((s) => kinds.get(s) === "reading").map((s) => s.id)),
  };

  // 1. Nothing written → nothing to judge.
  if (tokenCount === 0) {
    return {
      ...base,
      verdict: "insufficiently_scorable",
      feedback: [msg("rubric.writeIn", { language: targetLanguage })],
    };
  }

  // 2. Not recognizably the target language → refuse to judge rather than
  //    guess (§17). This is deliberately checked BEFORE slots: a native-
  //    language sentence with target keywords must never pass (§67).
  if (knownShare < KNOWN_SHARE_FLOOR) {
    return {
      ...base,
      verdict: "insufficiently_scorable",
      feedback: [msg("rubric.onlyLanguage", { language: targetLanguage })],
    };
  }

  // 3. Prompt copy: every answer token already appears in the prompt/cues.
  //    A real answer adds its own French around the given facts.
  const promptTokens = new Set(tokensOf(normalizeWritten(input.promptText, rules)));
  if (tokenCount >= 2 && answerTokens.every((t) => promptTokens.has(t))) {
    return {
      ...base,
      verdict: "does_not_meet_rubric",
      feedback: [msg("rubric.ownAnswer", { language: targetLanguage })],
    };
  }

  const feedback: Message[] = [];

  // 4. Length bounds.
  if (tokenCount < rubric.minTokens) {
    feedback.push(msg("rubric.minTokens", { count: rubric.minTokens }));
  } else if (tokenCount > rubric.maxTokens) {
    feedback.push(msg("rubric.keepShort"));
  }

  // 5. A real clause, when the task demands one (authored allowlist only).
  const verbs = rubric.requireSentenceVerbs ?? [];
  if (verbs.length > 0) {
    const hasVerb = verbs.some((v) =>
      containsRun(answerTokens, tokensOf(normalizeWritten(v, rules)))
    );
    if (!hasVerb) {
      feedback.push(msg("rubric.useVerb", { verb: verbs[0] }));
    }
  }

  // 6. Required information slots.
  if (missing.length > 0) {
    if (matched.length > 0) {
      feedback.push(
        msg("rubric.includedButNot", {
          included: matched.map((s) => s.description),
          missing: missing.map((m) => m.description),
        })
      );
    } else {
      feedback.push(msg("rubric.dontForget", { missing: missing.map((m) => m.description) }));
    }
  }

  // 7. Keyword stuffing (Phase 10 §27): a slot with several authored
  //    phrasings realized in several separate places is a list of guesses,
  //    not one answer. Single-phrasing slots (a name, "demain") are exempt:
  //    repeating one fact ("… demain à dix heures. À demain !") is not a
  //    list of alternatives. Nor is a slot the author marked repeatable.
  const stuffed =
    (input.mode ?? "guided") === "guided"
      ? matched.filter(
          (s) => !s.repeatable && s.variants.length >= 2 && slotRealizations(answerTokens, s, rules) >= 2
        )
      : [];
  if (stuffed.length > 0) {
    feedback.push(msg("rubric.sayOnce", { items: stuffed.map((s) => s.description) }));
  }

  if (feedback.length > 0) {
    return { ...base, verdict: "does_not_meet_rubric", feedback };
  }
  return { ...base, verdict: "meets_rubric", feedback: [] };
}

export type FormFieldSpec = { id: string; label: string; slotId: string };

export function evaluateSimpleForm(input: {
  rules: LanguageRules;
  targetLanguage: string;
  values: Record<string, string>;
  fields: FormFieldSpec[];
  rubric: WritingRubric;
}): WritingEvaluation {
  const { rules } = input;
  const slotsById = new Map(input.rubric.requiredSlots.map((s) => [s.id, s]));
  const matchedSlotIds: string[] = [];
  const readingOnlySlotIds: string[] = [];
  const missingSlots: { id: string; description: string }[] = [];
  const feedback: Message[] = [];
  let filled = 0;
  let totalTokens = 0;

  for (const field of input.fields) {
    const slot = slotsById.get(field.slotId);
    if (!slot) continue; // validator-impossible; fail closed as missing
    const raw = input.values[field.id] ?? "";
    const answerTokens = tokensOf(normalizeWritten(raw, rules));
    totalTokens += answerTokens.length;
    if (answerTokens.length === 0) {
      missingSlots.push({ id: slot.id, description: slot.description });
      feedback.push(msg("rubric.fillField", { field: field.label }));
      continue;
    }
    filled += 1;
    // A form field holds one value, not the learner's sentence: it aligns as a typed answer does.
    const kind = slotMatch(answerTokens, slot, rules, rules.alignAnswerToKey);
    if (kind !== null) {
      matchedSlotIds.push(slot.id);
      if (kind === "reading") readingOnlySlotIds.push(slot.id);
    } else {
      missingSlots.push({ id: slot.id, description: slot.description });
      feedback.push(msg("rubric.checkField", { field: field.label }));
    }
  }

  const base = {
    matchedSlotIds,
    missingSlots,
    knownShare: 1,
    tokenCount: totalTokens,
    ...readingOnlyField(readingOnlySlotIds),
  };
  if (filled === 0) {
    return {
      ...base,
      verdict: "insufficiently_scorable",
      feedback: [msg("rubric.fillForm")],
    };
  }
  if (missingSlots.length > 0) {
    return { ...base, verdict: "does_not_meet_rubric", feedback };
  }
  return { ...base, verdict: "meets_rubric", feedback: [] };
}

/**
 * Deterministic spoken-answer grader (P8 §12, language-neutral since P1b):
 * grades WHAT THE RECOGNIZER HEARD against authored answers — pure string
 * logic, no confidence values, no fuzzy edit distance, no runtime
 * learning. What it accepts is exactly what an author wrote down
 * (whole-utterance variants and/or required concept slots), across the
 * engine's n-best FINAL transcripts only.
 *
 * Normalization equates only ENGINE-FORMATTING variance, never learner
 * errors — and WHICH variance is the language plugin's decision
 * (src/lib/languages/<code>.ts): for French, case, punctuation,
 * apostrophe/hyphen/whitespace forms, œ/æ ligatures, and digits vs. number
 * words (0–100); accents are KEPT, because recognizers emit well-formed
 * orthography and equating a/à or ou/où would grade different words as
 * the same one (the "no aggressive fuzzing" rule). "chat" never matches
 * "chats": homophone spellings the engine may legitimately choose are
 * authored as acceptedVariants, not guessed by the grader.
 */

import type { LanguageRules } from "../languages/types";

/** Grading inputs an item author controls (subset of the speech schema). */
export type SpeechGradingSpec = {
  /** Whole-utterance answers; any one matching any final transcript passes. */
  acceptedVariants: string[];
  /**
   * Concept slots for information-giving tasks: EVERY slot must be
   * satisfied (any of its forms, as a contiguous token run) by ONE single
   * transcript. Optional; whole-variant matching also applies when both
   * are present.
   */
  requiredConcepts?: string[][];
};

export type SpeechGradeResult = {
  correct: boolean;
  /** Index into [finalTranscript, ...alternatives] that matched; null = none. */
  matchedTranscriptIndex: number | null;
  /** The authored variant that matched verbatim-after-normalization, if any. */
  matchedVariant: string | null;
  /** True when the pass came from requiredConcepts rather than a variant. */
  matchedByConcepts: boolean;
  /** The engine's best transcript, verbatim, for "I heard: …" (§14). */
  heard: string;
};

/**
 * Orthographic folding WITHOUT digit conversion: case, ligatures,
 * apostrophes, hyphens, punctuation, whitespace — per the language. The
 * construct validators compare with this (a cue showing "2" conveys
 * meaning, not the word "deux" — only target orthography counts as
 * exposing the answer).
 */
export function foldSpoken(text: string, rules: LanguageRules): string {
  return rules.foldSpoken(text);
}

/**
 * Normalize one utterance (authored or recognized) for GRADING comparison.
 * Both sides of every grading comparison go through exactly this function,
 * digit conversion included ("2 chats" == "deux chats" under French rules).
 */
export function normalizeSpoken(text: string, rules: LanguageRules): string {
  return rules
    .tokenize(rules.foldSpoken(text))
    .map((t) => rules.spellDigits(t))
    .join(" ");
}

function tokens(normalized: string): string[] {
  return normalized.length === 0 ? [] : normalized.split(" ");
}

/** Contiguous token-run containment ("il y a" inside "il y a deux chats"). */
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

function conceptsSatisfied(transcriptTokens: string[], slots: string[][], rules: LanguageRules): boolean {
  if (slots.length === 0) return false;
  return slots.every((slot) =>
    slot.some((form) => containsRun(transcriptTokens, tokens(normalizeSpoken(form, rules))))
  );
}

/**
 * Grade an attempt's FINAL n-best transcripts. Partials must never reach
 * this function — the attempt machine guarantees only SpeechOutcome kind
 * "final" carries transcripts.
 */
export function gradeSpokenAttempt(
  finals: { finalTranscript: string; alternatives: string[] },
  spec: SpeechGradingSpec,
  rules: LanguageRules
): SpeechGradeResult {
  const transcripts = [finals.finalTranscript, ...finals.alternatives];
  const normalizedVariants = spec.acceptedVariants.map((v) => ({
    authored: v,
    normalized: normalizeSpoken(v, rules),
  }));

  for (let index = 0; index < transcripts.length; index++) {
    const normalized = normalizeSpoken(transcripts[index], rules);
    if (normalized.length === 0) continue;
    const variant = normalizedVariants.find(
      (v) => v.normalized.length > 0 && v.normalized === normalized
    );
    if (variant) {
      return {
        correct: true,
        matchedTranscriptIndex: index,
        matchedVariant: variant.authored,
        matchedByConcepts: false,
        heard: finals.finalTranscript,
      };
    }
    if (spec.requiredConcepts && conceptsSatisfied(tokens(normalized), spec.requiredConcepts, rules)) {
      return {
        correct: true,
        matchedTranscriptIndex: index,
        matchedVariant: null,
        matchedByConcepts: true,
        heard: finals.finalTranscript,
      };
    }
  }

  return {
    correct: false,
    matchedTranscriptIndex: null,
    matchedVariant: null,
    matchedByConcepts: false,
    heard: finals.finalTranscript,
  };
}

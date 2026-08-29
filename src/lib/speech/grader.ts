/**
 * Deterministic spoken-French grader (P8 §12): grades WHAT THE RECOGNIZER
 * HEARD against authored answers — pure string logic, no confidence values,
 * no fuzzy edit distance, no runtime learning. What it accepts is exactly
 * what an author wrote down (whole-utterance variants and/or required
 * concept slots), across the engine's n-best FINAL transcripts only.
 *
 * Normalization equates only ENGINE-FORMATTING variance, never learner
 * errors: case, punctuation, apostrophe/hyphen/whitespace forms, œ/æ
 * ligatures, and digits vs. number words (0–100). Accents are KEPT —
 * recognizers emit well-formed French orthography, and equating a/à or
 * ou/où would grade different words as the same one (the "no aggressive
 * fuzzing" rule). "chat" never matches "chats": homophone spellings the
 * engine may legitimately choose are authored as acceptedVariants, not
 * guessed by the grader.
 */

import { frenchNumber } from "../learning/french-numbers";
import { foldLigatures } from "../learning/lexicon-search";

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
 * Standalone digit tokens 0–100 become French words ("2" → "deux"). The
 * generated words get the same hyphen→space folding as authored text, so
 * "80", "quatre-vingts" and "quatre vingts" all normalize identically.
 */
function digitsToFrench(token: string): string {
  if (!/^\d{1,3}$/.test(token)) return token;
  const value = Number(token);
  if (value > 100) return token;
  return frenchNumber(value).traditional.replace(/-/g, " ");
}

/**
 * Orthographic folding WITHOUT digit conversion: case, ligatures,
 * apostrophes, hyphens, punctuation, whitespace. The construct validators
 * compare with this (a cue showing "2" conveys meaning, not the French
 * word "deux" — only French orthography counts as exposing the answer).
 */
export function foldSpokenFrench(text: string): string {
  return foldLigatures(text.normalize("NFC"))
    .toLowerCase()
    // Apostrophe forms, then elision/hyphen/punctuation all become spaces:
    // "j'ai", "j ai" and "est-ce que" / "est ce que" compare equal.
    .replace(/[’ʼ']/g, " ")
    .replace(/[-‐‑–—]/g, " ")
    .replace(/[.,!?;:…"“”«»() ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize one utterance (authored or recognized) for GRADING comparison.
 * Both sides of every grading comparison go through exactly this function,
 * digit conversion included ("2 chats" == "deux chats").
 */
export function normalizeSpokenFrench(text: string): string {
  return foldSpokenFrench(text)
    .split(" ")
    .filter((t) => t.length > 0)
    .map(digitsToFrench)
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

function conceptsSatisfied(transcriptTokens: string[], slots: string[][]): boolean {
  if (slots.length === 0) return false;
  return slots.every((slot) =>
    slot.some((form) => containsRun(transcriptTokens, tokens(normalizeSpokenFrench(form))))
  );
}

/**
 * Grade an attempt's FINAL n-best transcripts. Partials must never reach
 * this function — the attempt machine guarantees only SpeechOutcome kind
 * "final" carries transcripts.
 */
export function gradeSpokenAttempt(
  finals: { finalTranscript: string; alternatives: string[] },
  spec: SpeechGradingSpec
): SpeechGradeResult {
  const transcripts = [finals.finalTranscript, ...finals.alternatives];
  const normalizedVariants = spec.acceptedVariants.map((v) => ({
    authored: v,
    normalized: normalizeSpokenFrench(v),
  }));

  for (let index = 0; index < transcripts.length; index++) {
    const normalized = normalizeSpokenFrench(transcripts[index]);
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
    if (spec.requiredConcepts && conceptsSatisfied(tokens(normalized), spec.requiredConcepts)) {
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

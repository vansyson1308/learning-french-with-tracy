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

import { expressesNegation, negationAwareMatcher } from "../languages/negation";
import type { LanguageRules } from "../languages/types";

/** Grading inputs an item author controls (subset of the speech schema). */
export type SpeechGradingSpec = {
  /** Whole-utterance answers; any one matching any final transcript passes. */
  acceptedVariants: string[];
  /**
   * Concept slots for information-giving tasks: EVERY slot must be
   * satisfied (any of its forms, as a contiguous token run) by ONE single
   * transcript. Optional; whole-variant matching also applies when both
   * are present. A run inside a negated span does not satisfy a slot
   * (QC 2026-11-05 §1.2) unless the form itself is a negation.
   */
  requiredConcepts?: string[][];
};

export type SpeechGradeResult = {
  correct: boolean;
  /** Index into [finalTranscript, ...alternatives] that matched; null = none. */
  matchedTranscriptIndex: number | null;
  /** The authored variant that matched verbatim-after-normalization (or, ja, by stored reading), if any. */
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

/**
 * P4b: the reading form of a normalized utterance (ja: 学生 → がくせい),
 * or null for languages without a reading layer — every language but the
 * CJK plugins, whose results therefore never change.
 */
function readingOf(normalized: string, rules: LanguageRules): string | null {
  return rules.spokenReading ? rules.spokenReading(normalized) : null;
}

/** Whole-utterance reading comparison ignores token boundaries (kana and kanji may segment differently). */
function compact(reading: string): string {
  return reading.replace(/ /g, "");
}

/** The reading a whole variant or transcript is compared by: the plugin's utterance reading (ja: inflected forms too), else the compacted spoken reading. */
function wholeReading(normalized: string, rules: LanguageRules): string | null {
  if (rules.utteranceReading) return rules.utteranceReading(normalized);
  const reading = readingOf(normalized, rules);
  return reading === null ? null : compact(reading);
}

type Frame = NonNullable<LanguageRules["utteranceFrame"]>;

/** Whether `text` is one or two pieces of `pieces` (character comparison: token boundaries do not count). */
function inPieces(text: string, pieces: ReadonlySet<string>): boolean {
  if (pieces.has(text)) return true;
  const cps = [...text];
  for (let i = 1; i < cps.length; i++) {
    if (pieces.has(cps.slice(0, i).join("")) && pieces.has(cps.slice(i).join(""))) return true;
  }
  return false;
}

/** The particles the frame allows after one variant (its normalized tokens). */
function particlesAfter(frame: Frame, variantTokens: readonly string[]): string[] {
  const last = variantTokens[variantTokens.length - 1] ?? "";
  if ((frame.finals ?? []).includes(last)) return [];
  return (frame.particles ?? [])
    .filter((p) => {
      const conditions = [...(p.ifLast ?? []), ...(p.ifContains ?? [])];
      return conditions.length === 0 || (p.ifLast ?? []).includes(last) || (p.ifContains ?? []).some((t) => variantTokens.includes(t));
    })
    .map((p) => p.particle);
}

/**
 * Answer-key review pass 2: the transcript (compact, spaces dropped) is the variant inside the plugin's frame — a
 * leading filler or vocative, a trailing vocative or particle (LanguageRules.utteranceFrame). The variant's text is
 * compared exactly; only the frame around it is optional. No frame: false, so the result is the plain comparison.
 */
function framedMatch(heard: string, variant: { normalized: string }, frame: Frame | undefined): boolean {
  if (frame === undefined) return false;
  const core = compact(variant.normalized);
  if (core.length === 0 || heard.length <= core.length) return false;
  const leading = new Set([...(frame.leading ?? []), ...(frame.vocatives ?? [])]);
  const trailing = new Set([...(frame.vocatives ?? []), ...particlesAfter(frame, tokens(variant.normalized))]);
  for (let at = heard.indexOf(core); at >= 0; at = heard.indexOf(core, at + 1)) {
    const before = heard.slice(0, at);
    const after = heard.slice(at + core.length);
    if ((before === "" || inPieces(before, leading)) && (after === "" || inPieces(after, trailing))) return true;
  }
  return false;
}

/**
 * Every slot realized as a contiguous token run (or, P4b, a run of the reading) that is not inside a negated span
 * (QC 2026-11-05 §1.2, languages/negation.ts): 不是 does not realize 是, "I don't like" does not realize "like".
 */
function conceptsSatisfied(
  transcript: string,
  transcriptTokens: string[],
  transcriptReading: string[] | null,
  slots: string[][],
  rules: LanguageRules,
  /** The item's own expected text is negated: negation is what it asks for, so no slot is negation-checked. */
  negationRequired: boolean
): boolean {
  if (slots.length === 0) return false;
  const polarity = negationRequired ? {} : rules;
  const matchTokens = negationAwareMatcher(polarity, transcript, transcriptTokens, (s) => normalizeSpoken(s, rules));
  const matchReading =
    transcriptReading === null
      ? null
      : negationAwareMatcher(polarity, transcript, transcriptReading, (s) => readingOf(normalizeSpoken(s, rules), rules) ?? "");
  return slots.every((slot) =>
    slot.some((form) => {
      const normalized = normalizeSpoken(form, rules);
      if (matchTokens(tokens(normalized))) return true;
      const reading = matchReading === null ? null : readingOf(normalized, rules);
      return reading !== null && matchReading!(tokens(reading));
    })
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
  // QC 2026-11-05 §1.2: if the expected text (any variant or concept form) is itself negated, negation is required.
  let required: boolean | undefined;
  const negationRequired = () =>
    (required ??= [...spec.acceptedVariants, ...(spec.requiredConcepts ?? []).flat()].some((t) =>
      expressesNegation(rules, t, (s) => normalizeSpoken(s, rules))
    ));
  const normalizedVariants = spec.acceptedVariants.map((v) => {
    const normalized = normalizeSpoken(v, rules);
    return { authored: v, normalized, reading: wholeReading(normalized, rules) };
  });

  for (let index = 0; index < transcripts.length; index++) {
    const normalized = normalizeSpoken(transcripts[index], rules);
    if (normalized.length === 0) continue;
    const heardReading = readingOf(normalized, rules);
    const heardCompact = wholeReading(normalized, rules);
    // P4b: or the same READING (ja: the recognizer wrote in kana what the author wrote in kanji).
    const variant =
      normalizedVariants.find(
        (v) =>
          v.normalized.length > 0 &&
          (v.normalized === normalized || (heardCompact !== null && v.reading !== null && v.reading.length > 0 && v.reading === heardCompact))
      ) ??
      // Answer-key review pass 2: or the variant inside the plugin's frame (zh 谢谢啊, 组长，谢谢; absent elsewhere).
      normalizedVariants.find((v) => framedMatch(compact(normalized), v, rules.utteranceFrame));
    if (variant) {
      return {
        correct: true,
        matchedTranscriptIndex: index,
        matchedVariant: variant.authored,
        matchedByConcepts: false,
        heard: finals.finalTranscript,
      };
    }
    if (
      spec.requiredConcepts &&
      conceptsSatisfied(transcripts[index]!, tokens(normalized), heardReading === null ? null : tokens(heardReading), spec.requiredConcepts, rules, negationRequired())
    ) {
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

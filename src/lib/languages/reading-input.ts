/**
 * P4b evidence guard, shared by typed-answer grading (src/lib/grading.ts
 * readingOnlyAnswer) and the writing rubric (src/lib/writing/rubric.ts):
 * one definition of "matched only through the reading notation".
 *
 * A key is matched in the target SCRIPT when the answer's own folded form
 * contains it, or when the plugin's alignment made the match and the plugin
 * declares no reading notation (a same-script alignment such as an English
 * variety). It is matched through the READING notation when only the
 * alignment of a plugin that declares `readingInput` (ja kana, zh pinyin)
 * made it.
 */
import type { LanguageRules } from "./types";

export type MatchKind = "script" | "reading" | null;

/** The kind of a match that only the plugin's alignment made. */
export function alignedMatchKind(rules: LanguageRules): "script" | "reading" {
  return rules.readingInput === undefined ? "script" : "reading";
}

/**
 * How an answer matched a set of alternative keys (a typed answer's key and
 * alternatives; a writing slot's variants): any script match wins, so an
 * authored kana / pinyin alternative makes the answer a script match.
 */
export function bestMatchKind(kinds: readonly MatchKind[]): MatchKind {
  if (kinds.includes("script")) return "script";
  return kinds.includes("reading") ? "reading" : null;
}

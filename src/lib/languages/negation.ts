/**
 * Negation-aware keyword matching (QC 2026-11-05 §1.2), shared by the speech
 * grader (speech items and interaction intents) and the writing rubric (guided
 * writing and simple forms): a required run of tokens counts only where it is
 * NOT inside a negated span — 不是 is not 是, 行きません is not 行き, "I don't
 * like coffee" is not "like". Which words negate, and how far, is the language
 * plugin's data (LanguageRules.negation, documented in ./types.ts); this file
 * holds no language literal.
 *
 * Deterministic and conservative: clauses split at sentence punctuation in the
 * raw text and at the plugin's break words; a negator inside an idiom phrase
 * (没问题, "no problem") negates nothing; a form that itself contains a negator
 * asks for the negation and is matched as before.
 */

import type { LanguageRules, NegationRules } from "./types";

/** Text → its normalized form with tokens space-separated (normalizeSpoken, normalizeWritten, a reading). */
export type Normalizer = (text: string) => string;

/** Sentence punctuation that ends a clause in the raw text (Latin, Spanish inverted marks, CJK full-width). */
const CLAUSE_PUNCTUATION = /[.,!?;:…¿¡、。，！？；：]+/;

function split(normalized: string): string[] {
  return normalized.length === 0 ? [] : normalized.split(" ").filter((t) => t.length > 0);
}

/** A sequence of comparison units: tokens ("word") or the characters of the tokens joined ("text"). */
type Units = {
  units: string[];
  /** Clause id per unit. */
  clause: number[];
  /** Unit offset where token i starts; tokenStart[tokens.length] = units.length. */
  tokenStart: number[];
};

function unitsOf(tokens: readonly string[], clauseOfToken: readonly number[], unit: NegationRules["unit"]): Units {
  const units: string[] = [];
  const clause: number[] = [];
  const tokenStart: number[] = [];
  tokens.forEach((token, i) => {
    tokenStart.push(units.length);
    const parts = unit === "word" ? [token] : [...token];
    for (const part of parts) {
      units.push(part);
      clause.push(clauseOfToken[i] ?? 0);
    }
  });
  tokenStart.push(units.length);
  return { units, clause, tokenStart };
}

function phraseUnits(phrase: string, normalize: Normalizer, unit: NegationRules["unit"]): string[] {
  const tokens = split(normalize(phrase));
  return unit === "word" ? tokens : [...tokens.join("")];
}

/** Every [start, end) where `needle` occurs inside one clause. */
function occurrences(seq: Units, needle: readonly string[]): [number, number][] {
  const out: [number, number][] = [];
  if (needle.length === 0) return out;
  outer: for (let i = 0; i + needle.length <= seq.units.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (seq.units[i + j] !== needle[j] || seq.clause[i + j] !== seq.clause[i]) continue outer;
    }
    out.push([i, i + needle.length]);
  }
  return out;
}

type Occurrence = { kind: "clause" | "before" | "after"; start: number; end: number; clause: number };

/** Negator occurrences in a unit sequence, minus those inside an idiom and (before, wholeToken) those inside a word. */
function negatorsIn(seq: Units, negation: NegationRules, normalize: Normalizer): Occurrence[] {
  const idioms = (negation.idioms ?? []).flatMap((p) => occurrences(seq, phraseUnits(p, normalize, negation.unit)));
  const inIdiom = ([a, b]: [number, number]) => idioms.some(([x, y]) => x <= a && b <= y);
  const boundaries = new Set(seq.tokenStart);
  const found: Occurrence[] = [];
  const collect = (kind: Occurrence["kind"], phrases: readonly string[] | undefined, wholeToken = false) => {
    for (const phrase of phrases ?? []) {
      for (const span of occurrences(seq, phraseUnits(phrase, normalize, negation.unit))) {
        if (inIdiom(span)) continue;
        if (wholeToken && !(boundaries.has(span[0]) && boundaries.has(span[1]))) continue;
        found.push({ kind, start: span[0], end: span[1], clause: seq.clause[span[0]]! });
      }
    }
  };
  collect("clause", negation.clause);
  collect("before", negation.before?.negators, negation.before?.wholeToken === true);
  collect("after", negation.after?.negators);
  return found;
}

/** Whether units [start, end) sit inside a negated span. */
function negatedSpan(found: readonly Occurrence[], negation: NegationRules, clause: number, start: number, end: number): boolean {
  return found.some((n) => {
    if (n.clause !== clause) return false;
    if (n.kind === "clause") return true;
    if (n.kind === "before") {
      const reach = negation.before!.reach;
      return n.end <= start && (reach === "clause" || start - n.end <= reach);
    }
    return n.start >= end && n.start - end <= negation.after!.gap;
  });
}

/**
 * Clause id per token: the raw text split at sentence punctuation, each piece
 * normalized on its own; when the pieces do not re-assemble into exactly the
 * same tokens (a normalizer that reads across punctuation), one clause. Then a
 * break word ("but", 但是 is not one: zh/ja/ko rely on punctuation) opens a new clause.
 */
function clausesOf(raw: string, tokens: readonly string[], normalize: Normalizer, negation: NegationRules): number[] {
  const pieces = raw.split(CLAUSE_PUNCTUATION).map((p) => split(normalize(p)));
  const flat = pieces.flat();
  const byPunctuation =
    flat.length === tokens.length && flat.every((t, i) => t === tokens[i]) ? pieces.flatMap((ts, c) => ts.map(() => c)) : tokens.map(() => 0);
  const breaks = new Set((negation.clauseBreaks ?? []).flatMap((b) => split(normalize(b))));
  const out: number[] = [];
  let id = 0;
  tokens.forEach((token, i) => {
    if (i > 0 && (byPunctuation[i] !== byPunctuation[i - 1] || breaks.has(token))) id += 1;
    out.push(id);
  });
  return out;
}

/**
 * The matcher for one text: `matches(needle)` is the plain contiguous-run test,
 * except that an occurrence inside a negated span does not count — unless the
 * needle itself contains a negator (the key asks for the negation). Without
 * negation data it is exactly the plain test.
 */
export type RunMatcher = (needle: readonly string[]) => boolean;

export function negationAwareMatcher(
  rules: Pick<LanguageRules, "negation">,
  raw: string | null,
  tokens: readonly string[],
  normalize: Normalizer
): RunMatcher {
  const negation = rules.negation;
  const plain: RunMatcher = (needle) => runStarts(tokens, needle).length > 0;
  if (negation === undefined) return plain;
  const clauses = raw === null ? tokens.map(() => 0) : clausesOf(raw, tokens, normalize, negation);
  const seq = unitsOf(tokens, clauses, negation.unit);
  const found = negatorsIn(seq, negation, normalize);
  return (needle) => {
    const starts = runStarts(tokens, needle);
    if (starts.length === 0) return false;
    if (found.length === 0 || isNegation(needle, negation, normalize)) return true;
    return starts.some((i) => {
      const start = seq.tokenStart[i]!;
      return !negatedSpan(found, negation, seq.clause[start]!, start, seq.tokenStart[i + needle.length]!);
    });
  };
}

/**
 * Whether an authored text (a variant, a concept form) contains a negator outside an idiom. An item whose expected
 * answer is itself negated ("I don't like coffee", with slots [do not] + [coffee]) requires the negation: its other
 * slots are then matched without the negation check.
 */
export function expressesNegation(rules: Pick<LanguageRules, "negation">, text: string, normalize: Normalizer): boolean {
  const negation = rules.negation;
  return negation !== undefined && isNegation(split(normalize(text)), negation, normalize);
}

/** Whether a form's own tokens contain a negator (then its negated occurrence is what is required). */
function isNegation(needle: readonly string[], negation: NegationRules, normalize: Normalizer): boolean {
  const seq = unitsOf(needle, needle.map(() => 0), negation.unit);
  return negatorsIn(seq, negation, normalize).length > 0;
}

/** Token indices where `needle` starts as a contiguous run. */
function runStarts(haystack: readonly string[], needle: readonly string[]): number[] {
  const out: number[] = [];
  if (needle.length === 0) return out;
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    out.push(i);
  }
  return out;
}

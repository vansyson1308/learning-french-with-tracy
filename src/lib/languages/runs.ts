/**
 * Where a writing slot's words occur in an answer (answer-key review pass 2, zh-vi 2026-11-05). Without plugin data a
 * slot is an exact contiguous run of the answer's tokens — what every plugin but zh keeps. A plugin may declare
 * (LanguageRules.slotRuns, documented in ./types.ts):
 *  - joinTokens: the answer's tokens are consumed whole, but their boundaries need not be the slot's — tokens whose
 *    concatenation is the slot's words realize it (138 1234 5678 = 13812345678); a slot is never realized inside a
 *    longer token (早上 is not in 早上好);
 *  - insertions: a gap of answer tokens between two words of the slot (with joinTokens, also inside one) that reads
 *    as a sequence of the plugin's insertion units — a word, a measure word after an optional numeral run, a title
 *    prefix right before a title of the slot. Never at the slot's edges, never two gaps in a row.
 * Pure and deterministic; this file holds no language literal.
 */

import type { SlotRunRules } from "./types";

/** [first token, one past the last token] of one occurrence. */
export type Span = [number, number];

/** The longest gap tried, in answer tokens (一 杯 了 …). */
const MAX_GAP_TOKENS = 4;

function exactSpans(tokens: readonly string[], needle: readonly string[]): Span[] {
  const out: Span[] = [];
  outer: for (let i = 0; i + needle.length <= tokens.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (tokens[i + j] !== needle[j]) continue outer;
    }
    out.push([i, i + needle.length]);
  }
  return out;
}

type Insertions = NonNullable<SlotRunRules["insertions"]>;

/** Whether `text` reads as a sequence of insertion units; a title prefix only as the last unit, before a title. */
function isInsertion(text: string, insertions: Insertions, beforeTitle: boolean): boolean {
  const cps = [...text];
  const words = insertions.words.map((w) => [...w]);
  const numerals = new Set(insertions.numerals ?? []);
  const measures = (insertions.measures ?? []).map((m) => [...m]);
  const prefixes = beforeTitle ? (insertions.titled?.prefixes ?? []).map((p) => [...p]) : [];
  const startsAt = (i: number, unit: readonly string[]) => unit.length > 0 && unit.every((c, k) => cps[i + k] === c);
  const memo = new Map<number, boolean>();
  const from = (i: number): boolean => {
    if (i === cps.length) return true;
    const known = memo.get(i);
    if (known !== undefined) return known;
    let ok = words.some((w) => startsAt(i, w) && from(i + w.length));
    if (!ok) {
      // a measure word after an optional run of numerals (一杯, 两个, 十五个, 个)
      let j = i;
      while (j < cps.length && numerals.has(cps[j]!)) j++;
      for (let k = i; k <= j && !ok; k++) ok = measures.some((m) => startsAt(k, m) && from(k + m.length));
    }
    if (!ok) ok = prefixes.some((p) => startsAt(i, p) && i + p.length === cps.length);
    memo.set(i, ok);
    return ok;
  };
  return cps.length > 0 && from(0);
}

/**
 * Every [start, end) where the slot's words `needle` (normalized tokens) occur in `tokens`, under the plugin's run rules.
 * No rules (or none of either kind): the exact contiguous runs, as before.
 */
export function slotRunSpans(tokens: readonly string[], needle: readonly string[], runs?: SlotRunRules): Span[] {
  if (needle.length === 0) return [];
  const insertions = runs?.insertions;
  const join = runs?.joinTokens === true;
  if (!join && insertions === undefined) return exactSpans(tokens, needle);

  const text = needle.join("");
  // Character offset where each slot word starts (and the end), so a consumed token can be matched against them.
  const wordStarts: number[] = [];
  let offset = 0;
  for (const word of needle) {
    wordStarts.push(offset);
    offset += word.length;
  }
  const boundaries = new Set(wordStarts.slice(1));
  const titles = new Set(insertions?.titled?.titles ?? []);
  const wordAt = (c: number) => needle[wordStarts.indexOf(c)];

  const spans: Span[] = [];
  const seen = new Set<string>();
  // state: answer token index a, character offset c in the slot's text, whether the last step was a gap
  const walk = (start: number, a: number, c: number, gapped: boolean) => {
    if (c === text.length) {
      const key = `${start}:${a}`;
      if (!seen.has(key)) {
        seen.add(key);
        spans.push([start, a]);
      }
      return;
    }
    if (a >= tokens.length) return;
    const token = tokens[a]!;
    // consume one whole answer token
    if (join ? token.length > 0 && text.startsWith(token, c) : boundaries.has(c) || c === 0 ? wordAt(c) === token : false) {
      walk(start, a + 1, c + token.length, false);
    }
    // a gap of insertions at a slot-word boundary (with joinTokens, anywhere inside the slot)
    if (insertions !== undefined && !gapped && c > 0 && (boundaries.has(c) || join)) {
      const beforeTitle = boundaries.has(c) && titles.has(wordAt(c) ?? "");
      for (let b = a + 1; b <= Math.min(tokens.length, a + MAX_GAP_TOKENS); b++) {
        if (isInsertion(tokens.slice(a, b).join(""), insertions, beforeTitle)) walk(start, b, c, true);
      }
    }
  };
  for (let start = 0; start < tokens.length; start++) walk(start, start, 0, false);
  return spans.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
}

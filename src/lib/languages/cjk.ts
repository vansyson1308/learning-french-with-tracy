/**
 * Shared folding for Japanese, Chinese and Korean targets (P1b, used fully
 * from P4b). Transcripts and answers carry no reliable spaces, so tokens
 * come from Intl.Segmenter (word granularity) when the runtime has it —
 * Hermes gained it in RN 0.80+; the bundled fallback is one token per
 * character cluster for han/kana and whitespace for hangul, which keeps
 * contiguous-run matching deterministic everywhere.
 */

import type { LanguageRules } from "./types";

/** NFKC (full-width ↔ half-width, compatibility forms), case, punctuation and spaces. */
export function foldCjk(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[　\s]+/g, " ")
    .replace(/[.,!?;:"'、。！？，：；「」『』…«»“”()（）]/g, "")
    .trim();
}

type SegmenterLike = { segment(input: string): Iterable<{ segment: string; isWordLike?: boolean }> };

function segmenterFor(locale: string): SegmenterLike | null {
  const IntlAny = Intl as unknown as { Segmenter?: new (loc: string, opts: { granularity: "word" }) => SegmenterLike };
  if (typeof IntlAny.Segmenter !== "function") return null;
  try {
    return new IntlAny.Segmenter(locale, { granularity: "word" });
  } catch {
    return null;
  }
}

/** Tokens of folded CJK text: segmenter words, else per-character clusters. */
export function tokenizeCjk(locale: string, perCharacterFallback: boolean) {
  const segmenter = segmenterFor(locale);
  return (folded: string): string[] => {
    const text = folded.replace(/\s+/g, " ").trim();
    if (text.length === 0) return [];
    if (segmenter) {
      const out: string[] = [];
      for (const part of segmenter.segment(text)) {
        const piece = part.segment.trim();
        if (piece.length === 0) continue;
        if (part.isWordLike === false && !/[\p{L}\p{N}]/u.test(piece)) continue;
        out.push(piece);
      }
      return out;
    }
    if (!perCharacterFallback) return text.split(" ").filter((t) => t.length > 0);
    return [...text.replace(/ /g, "")];
  };
}

export function cjkRules(
  base: Pick<LanguageRules, "code" | "ttsLocale" | "recognitionLocale">,
  perCharacterFallback: boolean
): LanguageRules {
  const tokenize = tokenizeCjk(base.recognitionLocale, perCharacterFallback);
  return {
    ...base,
    articleCue: () => undefined,
    splitArticle: (surface) => ({ bare: surface }),
    spellDigits: (token) => token,
    normalizeLenient: foldCjk,
    normalizeStrict: foldCjk,
    foldSpoken: foldCjk,
    tokenize,
    fold: foldCjk,
  };
}

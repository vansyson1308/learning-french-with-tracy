/**
 * Vietnamese rules (P1b): tone marks are phonemic (ma / má / mà / mả / mã /
 * mạ are six words), so even the LENIENT form keeps every diacritic — only
 * case, punctuation and whitespace fold. Tokens are whitespace syllables.
 * Numbers arrive with the en-vi/vi authoring milestones.
 */

import type { LanguageRules } from "./types";

/** Case/punctuation/space folding that keeps every letter and tone mark. */
export function foldVietnamese(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[   ]/g, " ")
    .toLowerCase()
    .replace(/[.,!?;:"'«»“”…()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const vi: LanguageRules = {
  code: "vi",
  ttsLocale: "vi-VN",
  recognitionLocale: "vi-VN",
  articleCue: () => undefined,
  splitArticle: (surface) => ({ bare: surface }),
  spellDigits: (token) => token,
  normalizeLenient: foldVietnamese,
  normalizeStrict: foldVietnamese,
  foldSpoken: (text) => foldVietnamese(text).replace(/[-‐‑–—]/g, " ").replace(/\s+/g, " ").trim(),
  tokenize: (folded) => (folded.length === 0 ? [] : folded.split(" ").filter((t) => t.length > 0)),
  fold: foldVietnamese,
};

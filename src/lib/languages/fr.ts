/**
 * French rules (P1b): the logic the French course shipped with, moved here
 * unchanged — le/la/l' article cues, the verified 0–100 number speller for
 * spoken/written grading, œ/æ folding, accent-keeping strict comparison.
 * Golden-pinned: any change here changes French behaviour.
 */

import { frenchNumber } from "../learning/french-numbers";

import { articleTable, latinRules } from "./base";
import type { LanguageRules } from "./types";

const ARTICLES = articleTable(["le", "la", "l'"]);

/**
 * Standalone digit tokens 0–100 become French words ("2" → "deux"). The
 * generated words get the same hyphen→space folding as authored text, so
 * "80", "quatre-vingts" and "quatre vingts" all normalize identically.
 */
export function spellFrenchDigits(token: string): string {
  if (!/^\d{1,3}$/.test(token)) return token;
  const value = Number(token);
  if (value > 100) return token;
  return frenchNumber(value).traditional.replace(/-/g, " ");
}

export const fr: LanguageRules = latinRules(
  { code: "fr", ttsLocale: "fr-FR", recognitionLocale: "fr-FR" },
  {
    ...ARTICLES,
    numberToWords: (value) => frenchNumber(value).traditional,
    spellDigits: spellFrenchDigits,
    // The labels the post-answer grammar note always used for French.
    grammarLabels: {
      persons: { "pre:1s": "je", "pre:2s": "tu", "pre:3s": "il/elle", "pre:1p": "nous", "pre:2p": "vous", "pre:3p": "ils/elles" },
      presentTense: "présent",
      articleGenders: { le: "masculine", la: "feminine", un: "masculine", une: "feminine" },
    },
  }
);

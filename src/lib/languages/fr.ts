/**
 * French rules (P1b): the logic the French course shipped with, moved here
 * unchanged — le/la/l' article cues, the verified 0–100 number speller for
 * spoken/written grading, œ/æ folding, accent-keeping strict comparison.
 * Golden-pinned: any change here changes French behaviour.
 */

import { frenchNumber } from "../learning/french-numbers";

import { articleTable, latinRules } from "./base";
import type { LanguageRules, NegationRules } from "./types";

const ARTICLES = articleTable(["le", "la", "l'"]);

/**
 * QC 2026-11-05 §1.2: ne…pas / n'…pas / ne…jamais / ne…plus negate the rest of their clause from "ne" / "n'" (the
 * verb and what follows; the subject before it is not negated: "le restaurant n'est pas ouvert" still names the
 * restaurant). Spoken French drops "ne" ("j'aime pas le café"): pas, jamais and rien negate what follows them and the
 * verb right before them. Plus and personne alone do not ("plus tard", "une personne"). Idioms that negate nothing:
 * pas mal, pas de problème, de rien, n'importe, n'est-ce pas. Conjunctions open a new clause.
 */
const NEGATION: NegationRules = {
  unit: "word",
  before: { negators: ["ne", "n'", "pas", "jamais", "rien"], reach: "clause" },
  after: { negators: ["pas", "jamais", "rien"], gap: 0 },
  idioms: ["pas mal", "pas de problème", "de rien", "n'importe", "n'est-ce pas"],
  clauseBreaks: ["mais", "parce", "car", "et", "ou", "quand", "si"],
};

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
    negation: NEGATION,
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

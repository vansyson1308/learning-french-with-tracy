/**
 * Lexemes authored but not yet carrying adopted Lexique 4 measurements.
 * The invariants stay HARD for everything else: original-54 word lexemes
 * must carry lexique-4 frequency/IPA, and a lexeme in this list must NOT
 * (its adoption lands with the next runner-derive + import commit, which
 * ALSO empties this list — leaving it stale fails the suite both ways).
 */
export const PENDING_LEXIQUE_IMPORT: ReadonlySet<string> = new Set([
  "fr:w:question",
  "fr:w:situation",
  "fr:w:voyage",
  "fr:w:message",
  "fr:w:bureau",
  "fr:w:cadeau",
  "fr:w:moment",
  "fr:w:sentiment",
  "fr:w:verite",
  "fr:w:securite",
  "fr:w:chance",
  "fr:w:confiance",
  "fr:w:maison",
  "fr:w:raison",
  "fr:w:patron",
  "fr:w:papier",
  "fr:w:vie",
]);

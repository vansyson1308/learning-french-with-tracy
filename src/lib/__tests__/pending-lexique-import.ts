/**
 * Lexemes authored but not yet carrying adopted Lexique 4 measurements.
 * The invariants stay HARD for everything else: word lexemes outside this
 * list must carry lexique-4 frequency/IPA, and a lexeme in this list must
 * NOT (its adoption lands with the next runner-derive + import commit,
 * which ALSO empties this list — leaving it stale fails the suite both
 * ways). Currently listed: the 7 Unit B verb lexemes awaiting extract
 * round 5.
 */
export const PENDING_LEXIQUE_IMPORT: ReadonlySet<string> = new Set([
  "fr:w:etre",
  "fr:w:avoir",
  "fr:w:aller",
  "fr:w:faire",
  "fr:w:parler",
  "fr:w:aimer",
  "fr:w:habiter",
]);

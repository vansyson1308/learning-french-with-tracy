/**
 * Lexemes authored but not yet carrying adopted Lexique 4 measurements.
 * The invariants stay HARD for everything else: word lexemes outside this
 * list must carry lexique-4 frequency/IPA, and a lexeme in this list must
 * NOT (its adoption lands with the next runner-derive + import commit,
 * which ALSO empties this list — leaving it stale fails the suite both
 * ways). Currently listed: the 6 Unit D time nouns awaiting extract
 * round 7.
 */
export const PENDING_LEXIQUE_IMPORT: ReadonlySet<string> = new Set([
  "fr:w:jour",
  "fr:w:heure",
  "fr:w:minute",
  "fr:w:semaine",
  "fr:w:mois",
  "fr:w:annee",
]);

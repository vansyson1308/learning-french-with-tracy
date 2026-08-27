/**
 * Lexemes authored but not yet carrying adopted Lexique 4 measurements.
 * The invariants stay HARD for everything else: word lexemes outside this
 * list must carry lexique-4 frequency/IPA, and a lexeme in this list must
 * NOT (its adoption lands with the next runner-derive + import commit,
 * which ALSO empties this list — leaving it stale fails the suite both
 * ways). Currently listed: the 13 Unit C lexemes awaiting extract round 6.
 */
export const PENDING_LEXIQUE_IMPORT: ReadonlySet<string> = new Set([
  "fr:w:solution",
  "fr:w:direction",
  "fr:w:attention",
  "fr:w:liberte",
  "fr:w:realite",
  "fr:w:musique",
  "fr:w:journee",
  "fr:w:argent",
  "fr:w:librairie",
  "fr:w:bibliotheque",
  "fr:w:monnaie",
  "fr:w:rester",
  "fr:w:attendre",
]);

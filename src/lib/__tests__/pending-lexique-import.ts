/**
 * Lexemes authored but not yet carrying adopted Lexique 4 measurements.
 * The invariants stay HARD for everything else: word lexemes outside this
 * list must carry lexique-4 frequency/IPA, and a lexeme in this list must
 * NOT (its adoption lands with the next runner-derive + import commit,
 * which ALSO empties this list — leaving it stale fails the suite both
 * ways). Empty right now: every authored word lexeme is adopted (extract
 * round 8 delivered the 2 Unit E h-words).
 */
export const PENDING_LEXIQUE_IMPORT: ReadonlySet<string> = new Set([]);

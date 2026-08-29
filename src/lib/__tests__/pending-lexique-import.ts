/**
 * Lexemes authored but not yet carrying adopted Lexique 4 measurements.
 * The invariants stay HARD for everything else: word lexemes outside this
 * list must carry lexique-4 frequency/IPA, and a lexeme in this list must
 * NOT (its adoption lands with the next runner-derive + import commit,
 * which ALSO empties this list — leaving it stale fails the suite both
 * ways). Currently: the 27 Section-3 reception lexemes (Phase 7), authored
 * with provisional IPA and awaiting the Phase-7 Lexique extract round.
 */
export const PENDING_LEXIQUE_IMPORT: ReadonlySet<string> = new Set([
  "fr:w:train",
  "fr:w:magasin",
  "fr:w:prix",
  "fr:w:porte",
  "fr:w:matin",
  "fr:w:soir",
  "fr:w:demain",
  "fr:w:aujourdhui",
  "fr:w:samedi",
  "fr:w:dimanche",
  "fr:w:ouvert",
  "fr:w:ouvrir",
  "fr:w:fermer",
  "fr:w:acheter",
  "fr:w:couter",
  "fr:w:vouloir",
  "fr:w:prendre",
  "fr:w:payer",
  "fr:w:travailler",
  "fr:w:restaurant",
  "fr:w:depart",
  "fr:w:voie",
  "fr:w:place",
  "fr:w:table",
  "fr:w:plage",
  "fr:w:entree",
  "fr:w:sortie",
]);

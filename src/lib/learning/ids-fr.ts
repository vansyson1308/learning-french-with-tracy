/**
 * Stable French lexical identities (Phase 1, hand-curated).
 *
 * Review cards must never be keyed by raw surface strings: content edits
 * orphan them silently (PopMots lost ~9% of user cards this way). Until the
 * Phase-2 content pipeline emits ids, this map IS the source of truth for
 * fr-en; the pipeline will validate and regenerate the same ids (drift test).
 *
 * Verified against src/content/packs/fr-en.json: the 54 distinct word
 * targets below are exactly the surfaces that can reach srs/wordStats —
 * every select exercise's audioTarget and every match pair target is one of
 * them (sentence audioTargets belong to exercise types that never record).
 * The 6 duplicate pack targets (le pain, l'eau, manger, boire, oui, non)
 * are same-lexeme repeats across units, so surface → id is a function.
 *
 * Slugs are opaque: lowercase, accents folded (œ→oe), articles dropped,
 * spaces/apostrophes → hyphens. Never rename an id once shipped — ids are
 * persisted in learner data.
 */

export const FR_COURSE_ID = "fr-en";

/** Prefix for surfaces with a curated identity. */
const WORD_PREFIX = "fr:w:";
/** Prefix for unknown surfaces preserved from legacy data (never dropped). */
export const FR_LEGACY_PREFIX = "fr:legacy:";

export const FR_LEXEME_IDS: Readonly<Record<string, string>> = {
  // Unit 1 — people & basics
  "l'homme": "fr:w:homme",
  "la femme": "fr:w:femme",
  "le garçon": "fr:w:garcon",
  "la fille": "fr:w:fille",
  "la pomme": "fr:w:pomme",
  "le pain": "fr:w:pain",
  "l'eau": "fr:w:eau",
  "le lait": "fr:w:lait",
  manger: "fr:w:manger",
  boire: "fr:w:boire",
  oui: "fr:w:oui",
  non: "fr:w:non",
  // Unit 2 — greetings
  bonjour: "fr:w:bonjour",
  "au revoir": "fr:w:au-revoir",
  merci: "fr:w:merci",
  "s'il vous plaît": "fr:w:s-il-vous-plait",
  bonsoir: "fr:w:bonsoir",
  "bonne nuit": "fr:w:bonne-nuit",
  salut: "fr:w:salut",
  pardon: "fr:w:pardon",
  monsieur: "fr:w:monsieur",
  madame: "fr:w:madame",
  // Unit 3 — food & drink
  "le café": "fr:w:cafe",
  "le thé": "fr:w:the",
  "le riz": "fr:w:riz",
  "l'œuf": "fr:w:oeuf",
  "le fromage": "fr:w:fromage",
  "le fruit": "fr:w:fruit",
  "le jus": "fr:w:jus",
  "le poulet": "fr:w:poulet",
  // Unit 4 — animals
  "le chien": "fr:w:chien",
  "le chat": "fr:w:chat",
  "le cheval": "fr:w:cheval",
  "l'oiseau": "fr:w:oiseau",
  "le poisson": "fr:w:poisson",
  "la vache": "fr:w:vache",
  "le lapin": "fr:w:lapin",
  "la souris": "fr:w:souris",
  "le mouton": "fr:w:mouton",
  "l'âne": "fr:w:ane",
  "la poule": "fr:w:poule",
  "le cochon": "fr:w:cochon",
  // Unit 5 — city & travel
  "la ville": "fr:w:ville",
  "la rue": "fr:w:rue",
  "la gare": "fr:w:gare",
  "l'aéroport": "fr:w:aeroport",
  "l'hôtel": "fr:w:hotel",
  "le musée": "fr:w:musee",
  "le billet": "fr:w:billet",
  "la carte": "fr:w:carte",
  "le taxi": "fr:w:taxi",
  "la valise": "fr:w:valise",
  "la gauche": "fr:w:gauche",
  "la droite": "fr:w:droite",
  // Section 2, Unit A — Gender & Articles (Phase 5B; ids immutable once shipped)
  "la question": "fr:w:question",
  "la situation": "fr:w:situation",
  "le voyage": "fr:w:voyage",
  "le message": "fr:w:message",
  "le bureau": "fr:w:bureau",
  "le cadeau": "fr:w:cadeau",
  "le moment": "fr:w:moment",
  "le sentiment": "fr:w:sentiment",
  "la vérité": "fr:w:verite",
  "la sécurité": "fr:w:securite",
  "la chance": "fr:w:chance",
  "la confiance": "fr:w:confiance",
  "la maison": "fr:w:maison",
  "la raison": "fr:w:raison",
  "le patron": "fr:w:patron",
  "le papier": "fr:w:papier",
  "la vie": "fr:w:vie",
  être: "fr:w:etre",
  avoir: "fr:w:avoir",
  aller: "fr:w:aller",
  faire: "fr:w:faire",
  parler: "fr:w:parler",
  aimer: "fr:w:aimer",
  habiter: "fr:w:habiter",
};

/** Reverse map (id → canonical surface) for review-session building. */
export const FR_SURFACE_FOR_ID: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(FR_LEXEME_IDS).map(([surface, id]) => [id, surface])
);

/** True when the surface has a curated lexical identity (assessment-eligible). */
export function isWordMappedFrSurface(surface: string): boolean {
  return Object.prototype.hasOwnProperty.call(FR_LEXEME_IDS, surface);
}

/**
 * Total mapping: curated id when known, otherwise a reversible legacy id.
 * encodeURIComponent never emits "|" (the CardKey separator) — pinned by test.
 */
export function frItemIdFor(surface: string): string {
  const mapped = FR_LEXEME_IDS[surface];
  return mapped ?? `${FR_LEGACY_PREFIX}${encodeURIComponent(surface)}`;
}

/** Recovers the original surface from any id this module can produce. */
export function frSurfaceForItemId(itemId: string): string | undefined {
  if (itemId.startsWith(FR_LEGACY_PREFIX)) {
    try {
      return decodeURIComponent(itemId.slice(FR_LEGACY_PREFIX.length));
    } catch {
      return undefined;
    }
  }
  return FR_SURFACE_FOR_ID[itemId];
}

export function isCuratedFrItemId(itemId: string): boolean {
  return itemId.startsWith(WORD_PREFIX) && itemId in FR_SURFACE_FOR_ID;
}

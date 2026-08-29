/**
 * CardKey — the identity a review card is stored under: (itemId, skill).
 *
 * The skill dimension was reserved in Phase 1 exactly so this moment costs
 * one union member: Phase 7 activates "listen" (auditory recognition of a
 * single lexeme — audio→meaning), Phase 8 activates "speak" (elicited
 * spoken production of a lexeme in a deterministic frame — meaning→spoken
 * French, graded on what the recognizer heard). New skills' cards are NEW
 * keys created by their first assessment; no existing entry is ever
 * rewritten, so activation needs no migration. Serialized form is
 * `${itemId}|${skill}` — persisted in the v2 card map, so both directions
 * must stay stable forever.
 */

export const SKILLS = ["recognize", "listen", "speak"] as const;
export type Skill = (typeof SKILLS)[number];

export type CardKey = {
  itemId: string;
  skill: Skill;
};

const SEPARATOR = "|";

/** Throws on itemIds that would make the serialized form ambiguous. */
export function serializeCardKey(key: CardKey): string {
  if (key.itemId.includes(SEPARATOR)) {
    throw new Error(`itemId must not contain "${SEPARATOR}": ${key.itemId}`);
  }
  if (key.itemId.length === 0) {
    throw new Error("itemId must not be empty");
  }
  return `${key.itemId}${SEPARATOR}${key.skill}`;
}

/** Returns undefined for strings this module could not have produced. */
export function parseCardKey(serialized: string): CardKey | undefined {
  const at = serialized.lastIndexOf(SEPARATOR);
  if (at <= 0) return undefined;
  const itemId = serialized.slice(0, at);
  const skill = serialized.slice(at + 1);
  if (itemId.includes(SEPARATOR)) return undefined;
  if (!(SKILLS as readonly string[]).includes(skill)) return undefined;
  return { itemId, skill: skill as Skill };
}

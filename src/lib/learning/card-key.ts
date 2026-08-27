/**
 * CardKey — the identity a review card is stored under: (itemId, skill).
 *
 * The skill dimension is reserved NOW (Phase 1 uses only "recognize") so the
 * roadmap's listening/production drills become new cards, not a second
 * card-key migration. Serialized form is `${itemId}|${skill}` — persisted in
 * the v2 card map, so both directions must stay stable forever.
 */

export const SKILLS = ["recognize"] as const;
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

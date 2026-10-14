/**
 * French id map — thin, frozen re-export (P1b). The hand-maintained map
 * that lived here since Phase 1 was proven identical to the compiler's
 * generated registry (src/content/ids/fr.json, from content/fr/lexemes.json)
 * and deleted; this module keeps the historical names for the build-side
 * drift checks and the French-specific tests. Runtime code uses the
 * course-neutral registry in ./ids.ts.
 *
 * Slugs are opaque: lowercase, accents folded (œ→oe), articles dropped,
 * spaces/apostrophes → hyphens. Never rename an id once shipped — ids are
 * persisted in learner data.
 */

import { idRegistryForLanguage, isCuratedItemId, isCuratedSurface, itemIdFor, surfaceFor } from "./ids";

const REGISTRY = idRegistryForLanguage("fr");
if (!REGISTRY) throw new Error("src/content/ids/fr.json is missing — run bun run content:compile");

/** The French course id (tests and build scripts only). */
export const FR_COURSE_ID = "fr-en";

/** Prefix for surfaces with a curated identity. */
export const FR_WORD_PREFIX = REGISTRY.prefix;
/** Prefix for unknown surfaces preserved from legacy data (never dropped). */
export const FR_LEGACY_PREFIX = REGISTRY.legacyPrefix;

/** Frozen surface → id map (≡ content/fr/lexemes.json, drift-checked by the compiler). */
export const FR_LEXEME_IDS: Readonly<Record<string, string>> = REGISTRY.surfaceToId;

/** Reverse map (id → canonical surface). */
export const FR_SURFACE_FOR_ID: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(FR_LEXEME_IDS).map(([surface, id]) => [id, surface])
);

/** True when the surface has a curated lexical identity (assessment-eligible). */
export function isWordMappedFrSurface(surface: string): boolean {
  return isCuratedSurface(FR_COURSE_ID, surface);
}

/**
 * Total mapping: curated id when known, otherwise a reversible legacy id
 * (`fr:legacy:<encoded surface>`). Kept for the historical v1→v2 migration,
 * which must keep producing exactly these ids forever.
 */
export function frItemIdFor(surface: string): string {
  return itemIdFor(FR_COURSE_ID, surface);
}

/** Recovers the original surface from any id this module can produce. */
export function frSurfaceForItemId(itemId: string): string | undefined {
  return surfaceFor(FR_COURSE_ID, itemId);
}

export function isCuratedFrItemId(itemId: string): boolean {
  return isCuratedItemId(FR_COURSE_ID, itemId);
}

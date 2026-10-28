/**
 * Stable lexical identities per course (P1b). The compiler generates one
 * registry per TARGET language under src/content/ids/<code>.json from the
 * frozen content/<code>/lexemes.json map (surface → `<code>:w:<slug>`);
 * courses whose language has no registry keep raw surfaces as item ids —
 * exactly the legacy behaviour. Ids are persisted in learner data: a
 * registry entry is never renamed.
 *
 * Total mapping for registry courses: curated id when known, otherwise a
 * reversible legacy id (`<code>:legacy:<encoded surface>`) — nothing is
 * ever dropped, and encodeURIComponent never emits "|" (the CardKey
 * separator; pinned by test).
 */

import { ID_REGISTRIES } from "../../content/ids";
import { courseProfile } from "../course-profile";

export type IdRegistry = {
  language: string;
  prefix: string;
  legacyPrefix: string;
  surfaceToId: Record<string, string>;
  /**
   * Older course surfaces → id (QC 2026-10-28): the inherited de-en pack
   * teaches "Freund", de-vi "der Freund" — one lexeme, one id. Learner data
   * keyed by the old surface resolves here; the canonical surface stays in
   * `surfaceToId`.
   */
  legacySurfaces?: Record<string, string>;
};

type Resolved = IdRegistry & { idToSurface: Record<string, string>; idToLegacy: Record<string, string[]> };

const RESOLVED = new Map<string, Resolved | null>();

/** Test seam (P1c): id registries of TEST-ONLY languages (src/content/test-only/ids). */
const TEST_REGISTRIES = new Map<string, IdRegistry>();

export function __registerIdRegistryForTests(code: string, registry: IdRegistry | null): void {
  if (registry === null) TEST_REGISTRIES.delete(code);
  else TEST_REGISTRIES.set(code, registry);
  RESOLVED.delete(code);
}

function registryForLanguage(code: string): Resolved | null {
  const hit = RESOLVED.get(code);
  if (hit !== undefined) return hit;
  const raw = TEST_REGISTRIES.get(code) ?? (ID_REGISTRIES as Record<string, IdRegistry | undefined>)[code];
  const resolved = raw
    ? {
        ...raw,
        idToSurface: Object.fromEntries(Object.entries(raw.surfaceToId).map(([s, id]) => [id, s])),
        idToLegacy: Object.entries(raw.legacySurfaces ?? {}).reduce<Record<string, string[]>>((acc, [s, id]) => ({ ...acc, [id]: [...(acc[id] ?? []), s] }), {}),
      }
    : null;
  RESOLVED.set(code, resolved);
  return resolved;
}

function registryFor(courseId: string): Resolved | null {
  return registryForLanguage(courseProfile(courseId).targetCode);
}

/** True when the course's target language ships a stable-id registry. */
export function hasIdRegistry(courseId: string): boolean {
  return registryFor(courseId) !== null;
}

/** `<code>:w:` for registry courses, "" otherwise. */
export function idPrefix(courseId: string): string {
  return registryFor(courseId)?.prefix ?? "";
}

/** Item id for a pack surface: curated id, reversible legacy id, or the raw surface. */
export function itemIdFor(courseId: string, surface: string): string {
  const registry = registryFor(courseId);
  if (!registry) return surface;
  return registry.surfaceToId[surface] ?? registry.legacySurfaces?.[surface] ?? `${registry.legacyPrefix}${encodeURIComponent(surface)}`;
}

/**
 * Every surface an item id can be shown with in a course of this language:
 * the canonical one first, then its legacy surfaces (a course whose pack
 * uses an older surface — de-en "Freund" — picks the one its pack has).
 */
export function surfacesFor(courseId: string, itemId: string): string[] {
  const registry = registryFor(courseId);
  if (!registry) return [itemId];
  const canonical = surfaceFor(courseId, itemId);
  return [...(canonical === undefined ? [] : [canonical]), ...(registry.idToLegacy[itemId] ?? [])];
}

/** Canonical surface for an item id this module can produce (undefined when unknown). */
export function surfaceFor(courseId: string, itemId: string): string | undefined {
  const registry = registryFor(courseId);
  if (!registry) return itemId;
  if (itemId.startsWith(registry.legacyPrefix)) {
    try {
      return decodeURIComponent(itemId.slice(registry.legacyPrefix.length));
    } catch {
      return undefined;
    }
  }
  return registry.idToSurface[itemId];
}

/** True when the id is a curated registry entry (assessment-eligible). */
export function isCuratedItemId(courseId: string, itemId: string): boolean {
  const registry = registryFor(courseId);
  return registry !== null && itemId.startsWith(registry.prefix) && itemId in registry.idToSurface;
}

/** True when the surface has a curated identity. */
export function isCuratedSurface(courseId: string, surface: string): boolean {
  const registry = registryFor(courseId);
  return (
    registry !== null &&
    (Object.prototype.hasOwnProperty.call(registry.surfaceToId, surface) || Object.prototype.hasOwnProperty.call(registry.legacySurfaces ?? {}, surface))
  );
}

/** The frozen surface → id map of a course (empty without a registry). */
export function surfaceIdMap(courseId: string): Readonly<Record<string, string>> {
  return registryFor(courseId)?.surfaceToId ?? {};
}

/** Registry by LANGUAGE code (build scripts and drift tests). */
export function idRegistryForLanguage(code: string): IdRegistry | undefined {
  const r = registryForLanguage(code);
  return r
    ? { language: r.language, prefix: r.prefix, legacyPrefix: r.legacyPrefix, surfaceToId: r.surfaceToId, ...(r.legacySurfaces ? { legacySurfaces: r.legacySurfaces } : {}) }
    : undefined;
}

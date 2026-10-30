/**
 * Per-course id registry (P1b): the generated src/content/ids/fr.json is
 * byte-equal to the frozen content/fr/lexemes.json map (the proof that
 * replaced the hand-maintained TS map), ids are total and reversible for
 * registry courses, raw surfaces for the others, and no id can ever carry
 * the CardKey separator.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import path from "path";

import frIds from "../../content/ids/fr.json";
import { FR_LEXEME_IDS, FR_SURFACE_FOR_ID } from "../learning/ids-fr";
import {
  hasIdRegistry,
  idPrefix,
  isCuratedItemId,
  isCuratedSurface,
  itemIdFor,
  surfaceFor,
  surfaceIdMap,
} from "../learning/ids";

const frozen = JSON.parse(
  readFileSync(path.resolve(__dirname, "..", "..", "..", "content", "fr", "lexemes.json"), "utf8")
) as Record<string, string>;

describe("generated id registry", () => {
  test("src/content/ids/fr.json ≡ content/fr/lexemes.json (frozen, drift-checked)", () => {
    expect(frIds.language).toBe("fr");
    expect(frIds.prefix).toBe("fr:w:");
    expect(frIds.legacyPrefix).toBe("fr:legacy:");
    expect(Object.entries(frIds.surfaceToId).sort()).toEqual(Object.entries(frozen).sort());
    expect(Object.keys(frozen)).toHaveLength(126);
  });

  test("the thin French re-export reads the same registry", () => {
    expect(Object.entries(FR_LEXEME_IDS).sort()).toEqual(Object.entries(frozen).sort());
    expect(FR_SURFACE_FOR_ID["fr:w:homme"]).toBe("l'homme");
    expect(surfaceIdMap("fr-en")).toEqual(FR_LEXEME_IDS);
  });

  test("registry course: curated ids, reversible legacy ids, prefix", () => {
    expect(hasIdRegistry("fr-en")).toBe(true);
    expect(idPrefix("fr-en")).toBe("fr:w:");
    expect(itemIdFor("fr-en", "l'homme")).toBe("fr:w:homme");
    expect(surfaceFor("fr-en", "fr:w:homme")).toBe("l'homme");
    expect(isCuratedItemId("fr-en", "fr:w:homme")).toBe(true);
    expect(isCuratedSurface("fr-en", "l'homme")).toBe(true);
    const legacy = itemIdFor("fr-en", "une phrase | inconnue");
    expect(legacy.startsWith("fr:legacy:")).toBe(true);
    expect(legacy).not.toContain("|");
    expect(surfaceFor("fr-en", legacy)).toBe("une phrase | inconnue");
    expect(isCuratedItemId("fr-en", legacy)).toBe(false);
    expect(isCuratedItemId("fr-en", "fr:w:not-a-word")).toBe(false);
    expect(surfaceFor("fr-en", "fr:w:not-a-word")).toBeUndefined();
    expect(surfaceFor("fr-en", "fr:legacy:%E0%A4%A")).toBeUndefined(); // malformed → undefined, never a throw
  });

  test("es-en (P3a) has a registry: stable ids from the Spanish lexicon", () => {
    expect(hasIdRegistry("es-en")).toBe(true);
    expect(idPrefix("es-en")).toBe("es:w:");
    expect(itemIdFor("es-en", "el agua")).toBe("es:w:agua");
    expect(surfaceFor("es-en", "es:w:agua")).toBe("el agua");
    expect(isCuratedItemId("es-en", "es:w:agua")).toBe(true);
  });

  test("courses without a registry keep raw surfaces (legacy behaviour)", () => {
    for (const courseId of ["pt-en", "ja-en", "zz-zz"]) {
      expect(hasIdRegistry(courseId)).toBe(false);
      expect(idPrefix(courseId)).toBe("");
      expect(itemIdFor(courseId, "el agua")).toBe("el agua");
      expect(surfaceFor(courseId, "el agua")).toBe("el agua");
      expect(isCuratedItemId(courseId, "el agua")).toBe(false);
      expect(surfaceIdMap(courseId)).toEqual({});
    }
  });

  test("every curated id round-trips and never contains the CardKey separator", () => {
    for (const [surface, id] of Object.entries(frozen)) {
      expect(id).not.toContain("|");
      expect(itemIdFor("fr-en", surface)).toBe(id);
      expect(surfaceFor("fr-en", id)).toBe(surface);
    }
  });
});

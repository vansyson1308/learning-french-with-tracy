import { describe, expect, test } from "bun:test";

import frPack from "../../content/packs/fr-en.json";
import { parseCardKey, serializeCardKey, SKILLS, type CardKey } from "../learning/card-key";
import {
  FR_LEGACY_PREFIX,
  FR_LEXEME_IDS,
  FR_SURFACE_FOR_ID,
  frItemIdFor,
  frSurfaceForItemId,
  isCuratedFrItemId,
  isWordMappedFrSurface,
} from "../learning/ids-fr";

type PackShape = {
  sections: {
    units: {
      words: { target: string }[];
      lessons: {
        exercises: ({ type: string } & Record<string, unknown>)[];
      }[];
    }[];
  }[];
};

const pack = frPack as unknown as PackShape;

function packWordTargets(): Set<string> {
  const targets = new Set<string>();
  for (const s of pack.sections)
    for (const u of s.units) for (const w of u.words) targets.add(w.target);
  return targets;
}

/** Every surface that the current code can write into srs/wordStats. */
function packWritableSurfaces(): Set<string> {
  const out = new Set<string>();
  for (const s of pack.sections)
    for (const u of s.units)
      for (const l of u.lessons)
        for (const e of l.exercises) {
          if (e.type === "select" && typeof e.audioTarget === "string") {
            out.add(e.audioTarget);
          }
          if (e.type === "match") {
            for (const p of e.pairs as { target: string }[]) out.add(p.target);
          }
        }
  return out;
}

describe("FR_LEXEME_IDS ↔ fr-en pack (drift guards)", () => {
  test("covers exactly the pack's distinct word targets", () => {
    const targets = packWordTargets();
    expect(targets.size).toBe(97);
    expect(Object.keys(FR_LEXEME_IDS).sort()).toEqual([...targets].sort());
  });

  test("covers every surface the app can write into srs/wordStats", () => {
    for (const surface of packWritableSurfaces()) {
      expect(isWordMappedFrSurface(surface)).toBe(true);
    }
  });

  test("ids are unique, well-formed, and CardKey-safe (no '|')", () => {
    const ids = Object.values(FR_LEXEME_IDS);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^fr:w:[a-z0-9-]+$/);
      expect(id.includes("|")).toBe(false);
    }
  });

  test("reverse map inverts the forward map", () => {
    for (const [surface, id] of Object.entries(FR_LEXEME_IDS)) {
      expect(FR_SURFACE_FOR_ID[id]).toBe(surface);
      expect(frSurfaceForItemId(id)).toBe(surface);
      expect(isCuratedFrItemId(id)).toBe(true);
    }
  });
});

describe("frItemIdFor orphan fallback", () => {
  test("known surfaces map to curated ids", () => {
    expect(frItemIdFor("la pomme")).toBe("fr:w:pomme");
    expect(frItemIdFor("l'œuf")).toBe("fr:w:oeuf");
  });

  test("unknown surfaces get a reversible legacy id — no data is ever dropped", () => {
    const sentence = "Je mange une pomme. | vraiment ?";
    const id = frItemIdFor(sentence);
    expect(id.startsWith(FR_LEGACY_PREFIX)).toBe(true);
    expect(id.includes("|")).toBe(false); // encodeURIComponent escapes it
    expect(frSurfaceForItemId(id)).toBe(sentence);
    expect(isCuratedFrItemId(id)).toBe(false);
  });

  test("legacy ids survive a CardKey round trip", () => {
    const id = frItemIdFor("Attention: 100% importants !");
    const key: CardKey = { itemId: id, skill: "recognize" };
    expect(parseCardKey(serializeCardKey(key))).toEqual(key);
  });

  test("malformed legacy ids return undefined instead of throwing", () => {
    expect(frSurfaceForItemId(`${FR_LEGACY_PREFIX}%E0%A4%A`)).toBeUndefined();
    expect(frSurfaceForItemId("fr:w:not-a-real-id")).toBeUndefined();
  });
});

describe("CardKey serialization", () => {
  test("round-trips every curated id", () => {
    for (const id of Object.values(FR_LEXEME_IDS)) {
      const key: CardKey = { itemId: id, skill: "recognize" };
      const s = serializeCardKey(key);
      expect(s).toBe(`${id}|recognize`);
      expect(parseCardKey(s)).toEqual(key);
    }
  });

  test("rejects itemIds containing the separator or empty", () => {
    expect(() => serializeCardKey({ itemId: "a|b", skill: "recognize" })).toThrow();
    expect(() => serializeCardKey({ itemId: "", skill: "recognize" })).toThrow();
  });

  test("parse rejects unknown skills and malformed strings", () => {
    expect(parseCardKey("fr:w:pomme|produce")).toBeUndefined();
    expect(parseCardKey("fr:w:pomme")).toBeUndefined();
    expect(parseCardKey("|recognize")).toBeUndefined();
    expect(parseCardKey("")).toBeUndefined();
  });

  test("skill registry currently contains exactly 'recognize'", () => {
    expect([...SKILLS]).toEqual(["recognize"]);
  });
});

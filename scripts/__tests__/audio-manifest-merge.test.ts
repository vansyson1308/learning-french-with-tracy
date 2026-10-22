/**
 * P3f: the pack and lexicon layers both key clips by `<course>:<text>`;
 * the generated manifest must keep one entry per key (TS1117 otherwise).
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";

import { mergeManifestEntries } from "../lib/audio-manifest";

describe("audio manifest merge (P3f)", () => {
  test("a word in a lesson and in the lexicon with the same asset becomes one entry", () => {
    const out = mergeManifestEntries([
      { key: "es-vi:el perro", file: "a.mp3", layer: "pack" },
      { key: "es-vi:el perro", file: "a.mp3", layer: "lexicon" },
      { key: "es-vi:el gato", file: "b.mp3", layer: "lexicon" },
    ]);
    expect(out.errors).toEqual([]);
    expect(out.entries).toEqual([
      { key: "es-vi:el perro", file: "a.mp3" },
      { key: "es-vi:el gato", file: "b.mp3" },
    ]);
  });

  test("different assets for one key: the pack clip wins, in either order", () => {
    for (const order of [
      [{ key: "k", file: "lex.mp3", layer: "lexicon" as const }, { key: "k", file: "pack.mp3", layer: "pack" as const }],
      [{ key: "k", file: "pack.mp3", layer: "pack" as const }, { key: "k", file: "lex.mp3", layer: "lexicon" as const }],
    ]) {
      const out = mergeManifestEntries(order);
      expect(out.errors).toEqual([]);
      expect(out.entries).toEqual([{ key: "k", file: "pack.mp3" }]);
    }
  });

  test("two pack assets for one key, or keys differing only by normalisation, fail the run", () => {
    expect(mergeManifestEntries([{ key: "k", file: "a.mp3", layer: "pack" }, { key: "k", file: "b.mp3", layer: "pack" }]).errors).toHaveLength(1);
    const nfc = "es-vi:el café";
    const nfd = nfc.normalize("NFD");
    expect(mergeManifestEntries([{ key: nfc, file: "a.mp3", layer: "pack" }, { key: nfd, file: "b.mp3", layer: "lexicon" }]).errors).toHaveLength(1);
  });

  test("the committed manifest has no duplicate keys", () => {
    const text = readFileSync("src/content/audio-manifest.ts", "utf8");
    const keys = [...text.matchAll(/^\s*("(?:[^"\\]|\\.)*"): require\(/gm)].map((m) => JSON.parse(m[1]) as string);
    expect(keys.length).toBeGreaterThan(0);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

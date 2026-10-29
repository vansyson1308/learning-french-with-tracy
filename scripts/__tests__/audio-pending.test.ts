import { describe, expect, test } from "bun:test";

import { courseLangOf, demotePendingAudio, isMissingAudioError, pendingAudioLangs } from "../lib/audio-pending";

describe("pending-language audio (QC 2026-10-29b §2.5: one run per language)", () => {
  const errors = [
    'de-vi: de-vi:us-l3-e4 audioTarget has no audio: "Meine Freundin heißt Lea."',
    "de.clip.goethe_a_h1_01: generated asset 0c1f.mp3 missing — run the reception-audio generate workflow (P7 §26)",
    "orphan asset 014a56faeeb1a6e2c69f.mp3: no authored clip resolves to it — delete it or restore its clip",
    "stories (de): 271 story sentence assets missing (e.g. 1535.mp3) — re-run the audio generate workflow (layer reception)",
    'es-vi: es-vi:u2-l2-e10 audioTarget has no audio: "La carta, por favor."',
    "de-vi: de-vi:u0-l0-e0 wordBank answer cannot be built from its tiles",
  ];
  const langOf = (m: string) => courseLangOf(m) ?? (m.includes("de.") || m.includes("(de)") || m.startsWith("orphan") ? "de" : null);

  test("only missing audio of a pending language is demoted; everything else still fails", () => {
    const r = demotePendingAudio(errors, langOf, new Set(["de"]));
    expect(r.demoted).toHaveLength(4);
    expect(r.errors).toEqual([errors[4], errors[5]]);
  });

  test("nothing is demoted without pending languages (CI on a pull request)", () => {
    expect(demotePendingAudio(errors, langOf, new Set()).errors).toEqual(errors);
  });

  test("the env value is parsed strictly", () => {
    expect([...pendingAudioLangs("de, it")]).toEqual(["de", "it"]);
    expect(pendingAudioLangs(undefined).size).toBe(0);
    expect(() => pendingAudioLangs("de;rm -rf")).toThrow(/not a language code/);
  });

  test("course messages name their target language; non-audio errors are not missing audio", () => {
    expect(courseLangOf(errors[0])).toBe("de");
    expect(courseLangOf(errors[1])).toBeNull();
    expect(isMissingAudioError(errors[5])).toBe(false);
  });
});

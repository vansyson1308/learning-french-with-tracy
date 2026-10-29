import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "fs";
import path from "path";

import { AUDIO_WORKFLOW_NAME, courseLangOf, demotePendingAudio, isMissingAudioError, isPendingLanguageAsset, pendingAudioLangs } from "../lib/audio-pending";

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
    expect([...pendingAudioLangs("de, it", {})]).toEqual(["de", "it"]);
    expect(pendingAudioLangs("", {}).size).toBe(0);
    expect(() => pendingAudioLangs("de;rm -rf", {})).toThrow(/not a language code/);
  });

  test("on CI, pending is legal only in a workflow_dispatch of the audio workflow (PR CI and release builds fail)", () => {
    const audio = { GITHUB_ACTIONS: "true", GITHUB_EVENT_NAME: "workflow_dispatch", GITHUB_WORKFLOW: AUDIO_WORKFLOW_NAME };
    expect([...pendingAudioLangs("de", audio)]).toEqual(["de"]);
    expect(() => pendingAudioLangs("de", { ...audio, GITHUB_EVENT_NAME: "pull_request", GITHUB_WORKFLOW: "CI" })).toThrow(/only allowed in a workflow_dispatch/);
    expect(() => pendingAudioLangs("de", { ...audio, GITHUB_WORKFLOW: "CI" })).toThrow(/only allowed/);
    expect(() => pendingAudioLangs("de", { ...audio, GITHUB_WORKFLOW: "EAS build" })).toThrow(/only allowed/);
    expect(pendingAudioLangs("", { ...audio, GITHUB_EVENT_NAME: "pull_request" }).size).toBe(0);
  });

  test("the audio workflow is named exactly as the guard expects", () => {
    const yml = readFileSync(path.join(import.meta.dir, "../../.github/workflows/audio.yml"), "utf8");
    expect(yml).toContain(`name: ${AUDIO_WORKFLOW_NAME}\n`);
    for (const wf of readdirSync(path.join(import.meta.dir, "../../.github/workflows"))) {
      if (wf === "audio.yml") continue;
      expect(readFileSync(path.join(import.meta.dir, "../../.github/workflows", wf), "utf8")).not.toContain("LFT_AUDIO_PENDING");
    }
  });

  test("a pending language's bundled files are recognised by path", () => {
    expect(isPendingLanguageAsset("assets/audio/de-reception/94c7.mp3", new Set(["de"]))).toBe(true);
    expect(isPendingLanguageAsset("assets/audio/de/1a2b.mp3", new Set(["de"]))).toBe(true);
    expect(isPendingLanguageAsset("assets/audio/es-reception/94c7.mp3", new Set(["de"]))).toBe(false);
    expect(isPendingLanguageAsset("assets/audio/de-reception/94c7.mp3", new Set())).toBe(false);
  });

  test("course messages name their target language; non-audio errors are not missing audio", () => {
    expect(courseLangOf(errors[0])).toBe("de");
    expect(courseLangOf(errors[1])).toBeNull();
    expect(isMissingAudioError(errors[5])).toBe(false);
  });
});

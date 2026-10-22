/**
 * P3f: the per-language audio budget, the version → bitrate rule and the
 * syllabus-only lexicon layer.
 */
import { describe, expect, test } from "bun:test";

import { AUDIO_BUDGET_BYTES_PER_LANGUAGE, audioBudgetErrors, buildAudioSizeReport } from "../lib/audio-size";
import { lexiconAudioStrings } from "../lib/lexicon-audio";
import { readJson } from "../lib/pipeline";
import { loadEngines, mp3KbpsFor } from "../lib/tts";

describe("audio size budget (P3f)", () => {
  test("a language over 12 MB fails, one under it passes", () => {
    expect(AUDIO_BUDGET_BYTES_PER_LANGUAGE).toBe(12_000_000);
    const sizes = [
      { language: "es", files: 2510, bytes: 40_000_000 },
      { language: "fr", files: 900, bytes: 4_900_000 },
    ];
    const errors = audioBudgetErrors(sizes);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("es");
    expect(buildAudioSizeReport(sizes).totalBytes).toBe(44_900_000);
  });

  test("speech is 64 kbps up to pipelineVersion 2 (French frozen at 1) and 32 kbps from 3", () => {
    const engines = loadEngines();
    expect(mp3KbpsFor(engines, 1)).toBe(64);
    expect(mp3KbpsFor(engines, 2)).toBe(64);
    expect(mp3KbpsFor(engines, 3)).toBe(32);
    const manifest = readJson("content/audio/pack-audio-manifest.json") as { pipelineVersions: Record<string, number> };
    expect(manifest.pipelineVersions.fr).toBe(1);
    expect(manifest.pipelineVersions.default).toBe(3);
  });

  test("the Spanish lexicon layer voices the syllabus words only", () => {
    const syllabus = readJson("content/es/lexicon/syllabus.json") as { entries: { lexemeId: string }[] };
    const strings = lexiconAudioStrings("es");
    expect(strings.length).toBeGreaterThan(0);
    expect(strings.length).toBeLessThanOrEqual(syllabus.entries.length);
    // No example sentences (they end with punctuation).
    expect(strings.some((s) => /[.!?]$/.test(s))).toBe(false);
  });
});

describe("reception asset keys follow the voice manifest's pipeline version (P3f)", () => {
  test("French stays at version 1, Spanish is keyed at version 3", async () => {
    const { receptionPipelineVersion } = await import("../lib/reception");
    expect(receptionPipelineVersion("fr")).toBe(1);
    expect(receptionPipelineVersion("es")).toBe(3);
    expect(receptionPipelineVersion("xx")).toBe(1);
  });
});

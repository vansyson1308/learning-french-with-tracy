/**
 * P3f: the per-language audio budget, the version → bitrate rule and the
 * syllabus-only lexicon layer.
 */
import { describe, expect, test } from "bun:test";

import {
  AUDIO_BUDGET_BYTES_PER_LANGUAGE,
  AUDIO_BUDGET_BYTES_TOTAL,
  audioBudgetErrors,
  audioSizeSummary,
  audioTotalBudgetErrors,
  buildAudioSizeReport,
  loadAudioBudget,
  measureAudioSizes,
} from "../lib/audio-size";
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

  test("QC 2026-10-29b §2.2: the sum over all languages is capped at 88 MB (150 MB APK − ≈ 62 MB non-audio), configurable, reported per language", () => {
    expect(AUDIO_BUDGET_BYTES_TOTAL).toBe(88_000_000);
    // The committed caps: 12 MB per language stays, 88 MB in total.
    expect(loadAudioBudget()).toEqual({ perLanguageBytes: 12_000_000, totalBytes: 88_000_000 });
    // Nine languages at 9.5 MB fit (≈ 85.5 MB); one more MB each does not, although every language is under 12 MB.
    const nine = (mb: number) => ["de", "en", "es", "fr", "it", "ja", "ko", "pt", "zh"].map((language) => ({ language, files: 1000, bytes: mb * 1e6 }));
    expect(audioBudgetErrors(nine(10.5))).toEqual([]);
    expect(audioTotalBudgetErrors(nine(9.5))).toEqual([]);
    const over = audioTotalBudgetErrors(nine(10.5));
    expect(over).toHaveLength(1);
    expect(over[0]).toContain("94.5 MB");
    expect(over[0]).toContain("de 10.5 + en 10.5");
    // The cap is configurable (content/audio/size-budget.json); a larger one passes the same set.
    expect(audioTotalBudgetErrors(nine(10.5), 100_000_000)).toEqual([]);
    const summary = audioSizeSummary(nine(9.5), { perLanguageBytes: 12_000_000, totalBytes: 88_000_000 });
    expect(summary).toHaveLength(10);
    expect(summary[9]).toContain("85.5 MB");
    expect(summary[9]).toContain("2.5 MB left");
    expect(buildAudioSizeReport(nine(1)).budgetBytesTotal).toBe(88_000_000);
  });

  test("the committed audio is within both caps today", () => {
    const sizes = measureAudioSizes();
    const budget = loadAudioBudget();
    expect(audioBudgetErrors(sizes, budget.perLanguageBytes)).toEqual([]);
    expect(audioTotalBudgetErrors(sizes, budget.totalBytes)).toEqual([]);
  });

  test("speech is 64 kbps up to pipelineVersion 2 and 32 kbps from 3; every language is on the default", () => {
    const engines = loadEngines();
    expect(mp3KbpsFor(engines, 1)).toBe(64);
    expect(mp3KbpsFor(engines, 2)).toBe(64);
    expect(mp3KbpsFor(engines, 3)).toBe(32);
    const manifest = readJson("content/audio/pack-audio-manifest.json") as { pipelineVersions: Record<string, number> };
    expect(manifest.pipelineVersions.fr).toBeUndefined();
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
  test("French and Spanish are keyed at version 3", async () => {
    const { receptionPipelineVersion } = await import("../lib/reception");
    expect(receptionPipelineVersion("fr")).toBe(3);
    expect(receptionPipelineVersion("es")).toBe(3);
    expect(receptionPipelineVersion("xx")).toBe(1);
  });
});

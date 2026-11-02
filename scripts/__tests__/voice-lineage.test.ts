/**
 * D-11 (QC 2026-10-31): a voice ships only when every link of its lineage, from
 * the voice back to the first checkpoint, is on the licence allowlist. An
 * unknown link fails.
 */
import { describe, expect, test } from "bun:test";

import { engineLineageVerdict, lineageErrors, parsePiperTraining, piperLineageVerdict, type VoiceSource } from "../lib/voice-lineage";

const card = (dataset: string, training: string) =>
  `# Model card\n\n* Speakers: 1\n\n## Dataset\n\n* URL: https://example.org\n* License: ${dataset}\n\n## Training\n\n${training}\n`;

const SIWIS = card("CC-BY 4.0", "Finetuned from U.S. English lessac voice (medium quality)");
const THORSTEN = card("CC0", "Finetuned from U.S. English lessac voice (high quality).");
const KERSTIN = card("CC0", "Finetuned from U.S. English Ryan voice (low quality).");
const MLS = card("CC-BY 4.0", "Trained from scratch");

const voice = (lineage: VoiceSource["lineage"], id = "piper-voice-x"): VoiceSource => ({ id, kind: "neural TTS voice used at pipeline time to synthesize bundled course audio", lineage });
const clean = { model: "x", dataset: "y", licence: "CC-BY-4.0", url: "https://example.org" };

describe("the Piper card's training line", () => {
  test("reads the base of a finetuned voice and a from-scratch voice", () => {
    expect(parsePiperTraining(SIWIS)).toEqual({ kind: "finetuned", base: "lessac" });
    expect(parsePiperTraining(KERSTIN)).toEqual({ kind: "finetuned", base: "ryan" });
    expect(parsePiperTraining(MLS)).toEqual({ kind: "scratch" });
  });

  test("a missing or unclear training line is unknown", () => {
    expect(parsePiperTraining("# Model card\n").kind).toBe("unknown");
    expect(parsePiperTraining(card("apache-2.0", "See URL above")).kind).toBe("unknown");
  });
});

describe("the recon gate", () => {
  test("siwis, thorsten-high and kerstin-low fail, whatever their own dataset says", () => {
    for (const [text, base] of [[SIWIS, "lessac"], [THORSTEN, "lessac"], [KERSTIN, "ryan"]] as const) {
      const v = piperLineageVerdict(text);
      expect(v.ok).toBe(false);
      expect(v.reason).toContain(base);
    }
  });

  test("a voice trained from scratch passes, an unknown training line fails", () => {
    expect(piperLineageVerdict(MLS).ok).toBe(true);
    expect(piperLineageVerdict(card("apache-2.0", "See URL above")).ok).toBe(false);
  });

  test("an engine's declared lineage passes only with every link allowlisted", () => {
    expect(engineLineageVerdict("kokoro", [clean]).ok).toBe(true);
    expect(engineLineageVerdict("melotts", [{ ...clean, licence: "unknown" }]).ok).toBe(false);
    expect(engineLineageVerdict("melotts", undefined).ok).toBe(false);
    expect(engineLineageVerdict("melotts", []).ok).toBe(false);
  });
});

describe("the registry gate", () => {
  test("every voice source needs a lineage", () => {
    expect(lineageErrors([voice(undefined)]).join("\n")).toContain("no lineage");
    expect(lineageErrors([voice([])]).join("\n")).toContain("no lineage");
  });

  test("the three voices fail on their parent's licence", () => {
    const lessac = { model: "en_US-lessac", dataset: "Blizzard 2013", licence: "Blizzard-2013-research", url: "https://example.org" };
    const ryan = { model: "en_US-ryan", dataset: "RyanSpeech", licence: "CC-BY-NC-SA-4.0", url: "https://example.org" };
    expect(lineageErrors([voice([clean, lessac], "piper-voice-siwis")]).join("\n")).toContain("Blizzard-2013-research");
    expect(lineageErrors([voice([clean, lessac], "piper-voice-thorsten")]).join("\n")).toContain("piper-voice-thorsten");
    expect(lineageErrors([voice([clean, ryan], "piper-voice-kerstin")]).join("\n")).toContain("CC-BY-NC-SA-4.0");
  });

  test("an unknown link fails, a clean chain passes, and other sources are not voices", () => {
    expect(lineageErrors([voice([{ ...clean, licence: "unknown" }])])).toHaveLength(1);
    expect(lineageErrors([voice([clean])])).toEqual([]);
    expect(lineageErrors([{ id: "tts-engine-kokoro", kind: "TTS engine used at pipeline time (never shipped)" }])).toEqual([]);
  });
});

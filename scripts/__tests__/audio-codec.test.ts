/**
 * The per-layer codec switch (content/audio/engines.json encoding.codecByLayer):
 * mp3 everywhere by default, keys/files/bytes unchanged; opus prepared for
 * the story layer only; French is always mp3 (release/ASSET_DELIVERY.md).
 */
import { describe, expect, test } from "bun:test";

import {
  assetFileName,
  codecFor,
  codecProblems,
  codecRecipe,
  encodeOptions,
  isAudioFile,
  OPUS_SAMPLE_RATE_HZ,
  type CodecSettings,
} from "../lib/audio-codec";
import { loadStories, storyAssetFiles, storyAudioPolicy, storyCodec, storySentenceAssetKey, storySentenceFile } from "../lib/stories";
import { buildSynthScript, loadEngines } from "../lib/tts";

const engines = loadEngines();
const flipped: CodecSettings = { ...engines.encoding, codecByLayer: { ...engines.encoding.codecByLayer, story: "opus" } };

describe("the committed setting: story is opus (CI proved playback, PR #51), every other layer mp3", () => {
  test("engines.json: story opus at 16 kbps, other layers mp3, French mp3-only, no problem", () => {
    expect(engines.encoding.codecByLayer).toEqual({ pack: "mp3", lexicon: "mp3", reception: "mp3", story: "opus" });
    expect(engines.encoding.opusKbps).toBe(16);
    expect(engines.encoding.mp3OnlyLanguages).toEqual(["fr"]);
    expect(codecProblems(engines.encoding)).toEqual([]);
    expect(storyCodec("fr")).toBe("mp3");
    for (const lang of ["es", "de"]) expect(storyCodec(lang)).toBe("opus");
  });

  test("an mp3 clip keeps its key, its file name and its encode line", () => {
    expect(codecRecipe("mp3", engines.encoding)).toBeNull();
    expect(assetFileName("abc", undefined)).toBe("abc.mp3");
    expect(assetFileName("abc", "mp3")).toBe("abc.mp3");
    expect(encodeOptions("mp3", { sampleRateHz: 22050, channels: 1, mp3Kbps: 24, opusKbps: 16 })).toBe("-ar 22050 -ac 1 -codec:a libmp3lame -b:a 24k");
    // French story files are the committed ones.
    const fr = loadStories("fr")!;
    for (const f of storyAssetFiles("fr", fr, storyAudioPolicy("fr"))) expect(f).toMatch(/^[0-9a-f]{20}\.mp3$/);
  });
});

describe("codecFor / codecProblems", () => {
  test("unset is mp3; a mp3-only language stays mp3 whatever the layer says", () => {
    expect(codecFor(undefined, "story")).toBe("mp3");
    expect(codecFor({}, "pack", "es")).toBe("mp3");
    expect(codecFor(flipped, "story", "es")).toBe("opus");
    expect(codecFor(flipped, "story", "fr")).toBe("mp3");
    expect(codecFor(flipped, "reception", "es")).toBe("mp3");
  });

  test("opus only for the story layer, 16-20 kbps, French kept mp3-only, known layers and codecs", () => {
    const base = { mp3OnlyLanguages: ["fr"] };
    expect(codecProblems({ ...base, codecByLayer: { story: "opus" }, opusKbps: 20 })).toEqual([]);
    expect(codecProblems({ ...base, codecByLayer: { reception: "opus" } }).join()).toContain("prepared for story only");
    expect(codecProblems({ ...base, codecByLayer: { pack: "aac" as never } }).join()).toContain("not mp3 or opus");
    expect(codecProblems({ ...base, codecByLayer: { video: "mp3" } as never }).join()).toContain("unknown layer");
    expect(codecProblems({ ...base, opusKbps: 12 }).join()).toContain("outside 16-20");
    expect(codecProblems({ ...base, opusKbps: 24 }).join()).toContain("outside 16-20");
    expect(codecProblems({ mp3OnlyLanguages: [] }).join()).toContain('must keep "fr"');
  });

  test("bundled audio files include .opus", () => {
    expect(["a.mp3", "b.wav", "c.opus"].every(isAudioFile)).toBe(true);
    expect(isAudioFile("plan.json")).toBe(false);
  });
});

describe("flipping story to opus (what CI must have proven first)", () => {
  const es = loadStories("es")!;
  const sentence = es.stories[0].sentences[0];

  test("an opus story sentence gets its own key and an .opus file; mp3 is untouched", () => {
    const mp3 = storySentenceAssetKey("es", es, sentence, "mp3");
    const opus = storySentenceAssetKey("es", es, sentence, "opus");
    expect(opus).not.toBe(mp3);
    expect(storySentenceAssetKey("es", es, sentence)).toBe(opus); // the committed setting
    expect(storySentenceFile("es", es, sentence, "opus")).toBe(`${opus}.opus`);
    const files = storyAssetFiles("es", es, storyAudioPolicy("es"), "opus");
    expect([...files].every((f) => f.endsWith(".opus"))).toBe(true);
    expect(codecRecipe("opus", flipped)).toBe("opus-16k");
  });

  test("the synth script encodes an opus clip with libopus at 24 kHz mono and copies a blessed .opus as is", () => {
    const voices = [{ id: "es_ES-davefx-medium", engine: "piper", status: "selected" }] as never;
    const clip = { assetKey: "k1", pipelineVersion: 4, segments: [{ voiceId: "es_ES-davefx-medium", speaker: null, text: "Ana tiene un perro." }], codec: "opus" as const };
    const script = buildSynthScript({ clips: [clip], voices, engines, downloadsDir: "/dl", wavDir: "/wav", outDir: "/out" });
    const encode = script.split("\n").find((l) => l.includes("libopus"))!;
    expect(encode).toContain(`-ar ${OPUS_SAMPLE_RATE_HZ} -ac 1 -map_metadata -1 -codec:a libopus -b:a 16k`);
    expect(encode).toContain("'/out/k1.opus'");
    expect(script).not.toContain("libmp3lame");
    const reused = buildSynthScript({ clips: [clip], voices, engines, downloadsDir: "/dl", wavDir: "/wav", outDir: "/out", existingFiles: new Map([["k1", "assets/audio/es-reception/k1.opus"]]) });
    expect(reused).toContain("cp 'assets/audio/es-reception/k1.opus' '/out/k1.opus'");
  });
});

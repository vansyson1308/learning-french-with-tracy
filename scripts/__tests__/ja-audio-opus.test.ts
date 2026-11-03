/**
 * Japanese bundled audio as Opus 16 kbps (run 41655941175: 16.9 MB > the
 * 12 MB per-language cap with MP3 pack, lexicon and listening clips;
 * release/ASSET_DELIVERY.md). One per-language setting,
 * content/audio/engines.json `encoding.codecByLanguage.ja`, switches the
 * pack, lexicon and reception layers of ja to Opus; the codec enters every
 * such key (recipe "opus-16k-lim3", the stories' recipe), so the plan, the
 * validator and the generated maps agree, and every other language keeps
 * its keys, files and bytes.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";

import { codecFor, codecProblems, type CodecLayer, type CodecSettings } from "../lib/audio-codec";
import { packClipRecipe, phonemeFrontendSpec, phonemeFrontendTag, receptionClipRecipe } from "../lib/audio-recipe";
import { receptionAssetKind } from "../lib/compile-artifacts";
import { renderAudioSlice } from "../lib/course-bundles";
import { loadPacks, safeResolve } from "../lib/pipeline";
import { compileClipAssetsModule, listeningClipKey, loadListening, receptionAssetKey, receptionAssetsDir, receptionPipelineVersion, resolveClipSegments } from "../lib/reception";
import { loadEngines } from "../lib/tts";

const enc = loadEngines().encoding;
const LAYERS: CodecLayer[] = ["pack", "lexicon", "reception", "story"];
const ESLINT_DIRECTIVE = "/* eslint-disable @typescript-eslint/no-require-imports -- generated: Metro static asset requires */";

describe("the committed setting: Japanese is Opus on every layer, every other language unchanged", () => {
  test("engines.json: codecByLanguage.ja switches pack, lexicon and reception; no problem", () => {
    expect(enc.codecByLanguage).toEqual({ ja: { pack: "opus", lexicon: "opus", reception: "opus" } });
    expect(enc.opusKbps).toBe(16);
    expect(codecProblems(enc)).toEqual([]);
    for (const layer of LAYERS) expect(codecFor(enc, layer, "ja")).toBe("opus");
  });

  test("es, de, en, it, pt keep mp3 pack/lexicon/reception (story opus); French mp3 everywhere", () => {
    for (const lang of ["es", "de", "en", "it", "pt"]) {
      for (const layer of ["pack", "lexicon", "reception"] as const) expect(codecFor(enc, layer, lang)).toBe("mp3");
      expect(codecFor(enc, "story", lang)).toBe("opus");
    }
    for (const layer of LAYERS) expect(codecFor(enc, layer, "fr")).toBe("mp3");
  });
});

describe("codecByLanguage: resolution and validation", () => {
  const base: CodecSettings = { mp3OnlyLanguages: ["fr"], codecByLayer: { story: "opus" } };

  test("a language override wins over the layer setting, never leaks to another language, never beats mp3-only", () => {
    const s: CodecSettings = { ...base, codecByLanguage: { ja: { pack: "opus" } } };
    expect(codecFor(s, "pack", "ja")).toBe("opus");
    expect(codecFor(s, "lexicon", "ja")).toBe("mp3");
    expect(codecFor(s, "story", "ja")).toBe("opus");
    expect(codecFor(s, "pack", "es")).toBe("mp3");
    expect(codecFor(s, "pack")).toBe("mp3");
    expect(codecFor({ ...base, codecByLanguage: { ja: { story: "mp3" } } }, "story", "ja")).toBe("mp3");
    expect(codecFor({ ...base, codecByLanguage: { fr: { pack: "opus" } } }, "pack", "fr")).toBe("mp3");
  });

  test("problems: an mp3-only language, an unknown layer or codec, a malformed language code", () => {
    expect(codecProblems({ ...base, codecByLanguage: { ja: { pack: "opus", lexicon: "opus", reception: "opus" } } })).toEqual([]);
    expect(codecProblems({ ...base, codecByLanguage: { fr: { pack: "opus" } } }).join()).toContain("fr is mp3-only");
    expect(codecProblems({ ...base, codecByLanguage: { ja: { video: "opus" } as never } }).join()).toContain('unknown layer "video"');
    expect(codecProblems({ ...base, codecByLanguage: { ja: { pack: "aac" as never } } }).join()).toContain("not mp3 or opus");
    expect(codecProblems({ ...base, codecByLanguage: { JA: { pack: "opus" } } }).join()).toContain("not a language code");
    // The layer-wide switch stays story-only: a language opts in by name.
    expect(codecProblems({ ...base, codecByLayer: { pack: "opus" } }).join()).toContain("prepared for story only");
  });
});

describe("asset keys: the codec is part of the recipe", () => {
  const frontend = phonemeFrontendTag(phonemeFrontendSpec("ja")!);

  test("pack/lexicon: an opus clip carries opus-16k-lim3 after the front-end; mp3 keeps the default recipe", () => {
    expect(packClipRecipe({ language: "ja", engine: "kokoro", text: "水", pipelineVersion: 3, synthesis: null, codec: "opus", encoding: enc })).toBe(`${frontend}|opus-16k-lim3`);
    expect(packClipRecipe({ language: "ja", engine: "kokoro", text: "水", pipelineVersion: 3, synthesis: null, codec: "mp3", encoding: enc })).toBe(frontend);
    expect(packClipRecipe({ language: "es", engine: "kokoro", text: "el perro", pipelineVersion: 3, synthesis: null, codec: "mp3", encoding: enc })).toBeNull();
    expect(packClipRecipe({ language: "es", engine: "kokoro", text: "el perro", pipelineVersion: 3, synthesis: null })).toBeNull();
  });

  test("reception: a ja listening clip's key (validator and compiler) carries the codec", () => {
    const ja = loadListening("ja")!;
    for (const clip of ja.clips.slice(0, 5)) {
      const segments = resolveClipSegments(ja, clip);
      const voiceIds = segments.map((s) => s.voiceId);
      expect(receptionClipRecipe("ja", clip.id, voiceIds)).toBe(`${frontend}|opus-16k-lim3`);
      expect(listeningClipKey("ja", ja, clip)).toBe(receptionAssetKey("ja", segments, receptionPipelineVersion("ja"), `${frontend}|opus-16k-lim3`));
      expect(listeningClipKey("ja", ja, clip)).not.toBe(receptionAssetKey("ja", segments, receptionPipelineVersion("ja"), frontend));
    }
  });

  test("es and de listening clips still resolve to their committed .mp3 files", () => {
    for (const lang of ["es", "de"]) {
      const listening = loadListening(lang)!;
      for (const clip of listening.clips) expect(existsSync(safeResolve(receptionAssetsDir(lang), `${listeningClipKey(lang, listening, clip)}.mp3`))).toBe(true);
    }
  });

  test("the generate plan of ja marks every pack, lexicon and listening clip opus, with the validator's keys", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "ja-opus-plan-"));
    try {
      const out = path.join(dir, "plan.json");
      const run = Bun.spawnSync(["bun", "scripts/audio.ts", "plan", "--lang", "ja", "--layer", "all", "--mode", "generate", "--out", out], { cwd: safeResolve("."), stdout: "pipe", stderr: "pipe" });
      expect(run.exitCode).toBe(0);
      const plan = JSON.parse(readFileSync(out, "utf8")) as { clips: { clipId: string; layer: string; assetKey: string; codec?: string }[] };
      expect(plan.clips.length).toBeGreaterThan(2000);
      expect(plan.clips.filter((c) => c.codec !== "opus")).toEqual([]);
      const ja = loadListening("ja")!;
      const planned = new Map(plan.clips.map((c) => [c.clipId, c.assetKey]));
      for (const clip of ja.clips) expect(planned.get(clip.id)).toBe(listeningClipKey("ja", ja, clip));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 120_000);
});

describe("validators and generated maps handle .opus for these layers", () => {
  const packs = loadPacks();

  test("the reception asset kind follows the codec: ja opus, es mp3, the test language wav", () => {
    expect(receptionAssetKind("ja", packs)).toBe("opus");
    expect(receptionAssetKind("es", packs)).toBe("mp3");
    expect(receptionAssetKind("xx", packs)).toBe("wav");
  });

  test("an Opus clip map requires .opus files under the lint directive; an mp3 map is unchanged", () => {
    const ja = loadListening("ja")!;
    const opus = compileClipAssetsModule(ja, "../../..", "opus", () => true);
    expect(opus).toContain(ESLINT_DIRECTIVE);
    expect(opus).toContain(`"${ja.clips[0].id}": require("../../../assets/audio/ja-reception/${listeningClipKey("ja", ja, ja.clips[0])}.opus"),`);
    expect(compileClipAssetsModule(ja, "../../..", "opus", () => false)).not.toContain("eslint-disable");
    const es = loadListening("es")!;
    const mp3 = compileClipAssetsModule(es, "../../..", "mp3");
    expect(mp3).not.toContain("eslint-disable");
    expect(`${mp3}`).toBe(readFileSync(safeResolve("src/content/reception/es-clip-assets.ts"), "utf8"));
  });

  test("a course audio slice with .opus requires gets the lint directive; an mp3 slice is unchanged", () => {
    const opus = renderAudioSlice("ja-vi", [{ key: "ja-vi:水", file: "../../assets/audio/ja/0123456789abcdef0123.opus" }]);
    expect(opus).toContain(ESLINT_DIRECTIVE);
    expect(opus).toContain('"ja-vi:水": require("../../../assets/audio/ja/0123456789abcdef0123.opus"),');
    const mp3 = renderAudioSlice("es-vi", [{ key: "es-vi:el perro", file: "../../assets/audio/es/a.mp3" }]);
    expect(mp3).not.toContain("eslint-disable");
  });
});

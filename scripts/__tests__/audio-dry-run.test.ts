/**
 * Audio pipeline v2 (P3b): `scripts/audio.ts plan --dry-run` validates the
 * voice manifests, the listening source and the course/lexicon strings of
 * a language without network or writes — the part of the dispatch-only
 * workflow CI can run. The reception asset keys it plans must be the
 * compiler's keys (one derivation), and the French reception plan is the
 * V1 plan (pipelineVersion 1, unchanged keys).
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";

import { safeResolve } from "../lib/pipeline";
import { listeningClipKey, loadListening, receptionAssetKey, resolveClipSegments } from "../lib/reception";
import { bundledStoryIds, loadStories, storyAudioPolicy, storySentenceAssetKey } from "../lib/stories";

function run(args: string[]): { code: number; out: string } {
  const proc = Bun.spawnSync({
    cmd: ["bun", "scripts/audio.ts", ...args],
    cwd: safeResolve("."),
    stdout: "pipe",
    stderr: "pipe",
  });
  return { code: proc.exitCode, out: `${proc.stdout.toString()}${proc.stderr.toString()}` };
}

describe("the plan writes exactly the reception files the validator wants", () => {
  // Run 41166387785: a Parler speaker's name was hashed as null by the plan and as the name by the
  // validator, so a voice change left 152 orphans and 121 clips missing.
  const expected = (lang: string) => {
    const listening = loadListening(lang)!;
    const stories = loadStories(lang)!;
    const bundled = bundledStoryIds(stories, storyAudioPolicy(lang));
    return new Set([
      ...listening.clips.map((c) => listeningClipKey(lang, listening, c)),
      ...stories.stories.filter((s) => bundled.has(s.id)).flatMap((s) => s.sentences).map((s) => storySentenceAssetKey(lang, stories, s)),
    ]);
  };

  for (const lang of ["fr", "de", "es"]) {
    test(`${lang}: no orphan and no missing clip after a generate`, () => {
      const dir = mkdtempSync(path.join(tmpdir(), "audio-plan-"));
      try {
        const file = path.join(dir, "plan.json");
        const { code, out } = run(["plan", "--lang", lang, "--layer", "reception", "--mode", "generate", "--out", file]);
        expect(code, out).toBe(0);
        const plan = JSON.parse(readFileSync(file, "utf8")) as { clips: { assetKey: string }[] };
        expect(new Set(plan.clips.map((c) => c.assetKey))).toEqual(expected(lang));
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  }

  test("a voice's speaker changes the key, so a recast regenerates its clips", () => {
    const seg = (speaker: number | string | null) => [{ voiceId: "parler-fr-daniel", speaker, text: "Bonjour." }];
    expect(receptionAssetKey("fr", seg("Daniel"), 3)).not.toBe(receptionAssetKey("fr", seg(null), 3));
  });
});

describe("audio.ts plan --dry-run", () => {
  test("French generate plan validates offline and reports the authored clip count", () => {
    const listening = loadListening("fr")!;
    // P5b: the reception layer also carries one clip per sentence of a bundled
    // story (every French story but the A1-0 micro-stories, read with the device voice).
    const stories = loadStories("fr")!;
    const bundled = bundledStoryIds(stories, storyAudioPolicy("fr"));
    const sentences = stories.stories.filter((s) => bundled.has(s.id)).flatMap((s) => s.sentences);
    const keys = new Set([
      ...listening.clips.map((c) => listeningClipKey("fr", listening, c)),
      ...sentences.map((s) => storySentenceAssetKey("fr", stories, s)),
    ]);
    const { code, out } = run(["plan", "--lang", "fr", "--layer", "reception", "--mode", "generate", "--dry-run"]);
    expect(out).toContain(`dry run ok (fr, generate, reception): ${listening.clips.length + sentences.length} clips, ${keys.size} unique assets`);
    expect(code).toBe(0);
  });

  test("the canary plan validates offline too", () => {
    const { code, out } = run(["plan", "--lang", "fr", "--layer", "reception", "--mode", "canary", "--dry-run"]);
    expect(out).toContain("dry run ok (fr, canary, reception)");
    expect(code).toBe(0);
  });

  test("a language without a voice manifest fails closed", () => {
    const { code, out } = run(["plan", "--lang", "xx", "--layer", "reception", "--mode", "generate", "--dry-run"]);
    expect(code).not.toBe(0);
    expect(out).toContain("no reception voice manifest for xx");
  });

  test("a malformed language code is rejected", () => {
    const { code } = run(["plan", "--lang", "../fr", "--layer", "reception", "--mode", "generate", "--dry-run"]);
    expect(code).not.toBe(0);
  });
});

describe("audio.ts plan --dry-run — pack + lexicon layers (P3b)", () => {
  test("the Spanish generate plan covers the pack strings, every lexicon surface + example and the reception clips (P3e)", () => {
    const { code, out } = run(["plan", "--lang", "es", "--layer", "all", "--mode", "generate", "--dry-run"]);
    expect(code).toBe(0);
    expect(out).toContain("dry run ok (es, generate, pack+lexicon+reception)");
  });

  test("French pack audio is frozen at pipelineVersion 1: the plan reproduces the committed keys", () => {
    const { code, out } = run(["plan", "--lang", "fr", "--layer", "pack", "--mode", "generate", "--dry-run"]);
    expect(code).toBe(0);
    expect(out).toContain("dry run ok (fr, generate, pack)");
  });

  test("a language whose candidates are not pinned yet cannot plan a canary (recon first)", () => {
    // The synthetic language has no voice candidates at all, so this never depends on which real
    // languages a dispatched recon has pinned (ja was the example until its 2026-10-21 recon).
    const { code, out } = run(["plan", "--lang", "xx", "--layer", "pack", "--mode", "canary", "--dry-run"]);
    expect(code).not.toBe(0);
    expect(out).toContain("no eligible candidate");
  });
});

/**
 * Audio pipeline v2 (P3b): `scripts/audio.ts plan --dry-run` validates the
 * voice manifests, the listening source and the course/lexicon strings of
 * a language without network or writes — the part of the dispatch-only
 * workflow CI can run. The reception asset keys it plans must be the
 * compiler's keys (one derivation), and the French reception plan is the
 * V1 plan (pipelineVersion 1, unchanged keys).
 */
import { describe, expect, test } from "bun:test";

import { safeResolve } from "../lib/pipeline";
import { loadListening, receptionAssetKey, resolveClipSegments } from "../lib/reception";

function run(args: string[]): { code: number; out: string } {
  const proc = Bun.spawnSync({
    cmd: ["bun", "scripts/audio.ts", ...args],
    cwd: safeResolve("."),
    stdout: "pipe",
    stderr: "pipe",
  });
  return { code: proc.exitCode, out: `${proc.stdout.toString()}${proc.stderr.toString()}` };
}

describe("audio.ts plan --dry-run", () => {
  test("French generate plan validates offline and reports the authored clip count", () => {
    const listening = loadListening("fr")!;
    const unique = new Set(listening.clips.map((c) => receptionAssetKey("fr", resolveClipSegments(listening, c)))).size;
    const { code, out } = run(["plan", "--lang", "fr", "--layer", "reception", "--mode", "generate", "--dry-run"]);
    expect(out).toContain(`dry run ok (fr, generate, reception): ${listening.clips.length} clips, ${unique} unique assets`);
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
  test("the Spanish generate plan covers the pack strings and every lexicon surface + example", () => {
    const { code, out } = run(["plan", "--lang", "es", "--layer", "all", "--mode", "generate", "--dry-run"]);
    expect(code).toBe(0);
    expect(out).toContain("dry run ok (es, generate, pack+lexicon)");
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

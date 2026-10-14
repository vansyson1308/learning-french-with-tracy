/**
 * P1c: the reception-audio driver takes `--lang` and has a `--dry-run`
 * that validates the voice manifest and the listening source without
 * network or writes — the part of the dispatch-only workflow CI can run.
 * The asset keys it plans must be the compiler's keys (one derivation).
 */
import { describe, expect, test } from "bun:test";

import { safeResolve } from "../lib/pipeline";
import { loadListening, receptionAssetKey, resolveClipSegments } from "../lib/reception";

function run(args: string[]): { code: number; out: string } {
  const proc = Bun.spawnSync({
    cmd: ["bun", "scripts/reception-audio.ts", ...args],
    cwd: safeResolve("."),
    stdout: "pipe",
    stderr: "pipe",
  });
  return { code: proc.exitCode, out: `${proc.stdout.toString()}${proc.stderr.toString()}` };
}

describe("reception-audio.ts plan --dry-run", () => {
  test("French generate plan validates offline and reports the authored clip count", () => {
    const listening = loadListening("fr")!;
    const unique = new Set(listening.clips.map((c) => receptionAssetKey("fr", resolveClipSegments(listening, c)))).size;
    const { code, out } = run(["plan", "--lang", "fr", "--mode", "generate", "--dry-run"]);
    expect(out).toContain(`dry run ok (fr, generate): ${listening.clips.length} clips, ${unique} unique assets`);
    expect(code).toBe(0);
  });

  test("the canary plan validates offline too", () => {
    const { code, out } = run(["plan", "--lang", "fr", "--mode", "canary", "--dry-run"]);
    expect(out).toContain("dry run ok (fr, canary)");
    expect(code).toBe(0);
  });

  test("a language without a voice manifest fails closed", () => {
    const { code, out } = run(["plan", "--lang", "xx", "--mode", "generate", "--dry-run"]);
    expect(code).not.toBe(0);
    expect(out).toContain("no voice manifest for xx");
  });

  test("a malformed language code is rejected", () => {
    const { code } = run(["plan", "--lang", "../fr", "--mode", "generate", "--dry-run"]);
    expect(code).not.toBe(0);
  });
});

/**
 * The acceptance-only Opus diagnostics (route + fixture) are bundled only by
 * builds that set LFT_ACCEPTANCE_DIAGNOSTICS=1. Release builds block both
 * folders in Metro (metro.config.js), and scripts/check-diagnostics-export.ts
 * proves an output holds neither. The fixture's provenance is pinned.
 */
import { describe, expect, test } from "bun:test";
import { createHash } from "crypto";
import { spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import path from "path";

import { FIXTURE_PATH, ROUTE_MARKERS, scanForDiagnostics } from "../check-diagnostics-export";
import { loadRegistry } from "../lib/pipeline";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const gate = require("../lib/diagnostics-gate") as {
  DIAGNOSTICS_ENV: string;
  DIAGNOSTICS_DIRS: string[];
  diagnosticsEnabled: (env: Record<string, string | undefined>) => boolean;
  diagnosticsBlockList: () => RegExp[];
};

const ROOT = path.resolve(import.meta.dir, "../..");
const sha256 = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");

describe("diagnostics gate (scripts/lib/diagnostics-gate.js)", () => {
  test("only the exact flag value enables the diagnostics", () => {
    expect(gate.DIAGNOSTICS_ENV).toBe("LFT_ACCEPTANCE_DIAGNOSTICS");
    expect(gate.diagnosticsEnabled({})).toBe(false);
    expect(gate.diagnosticsEnabled({ LFT_ACCEPTANCE_DIAGNOSTICS: "0" })).toBe(false);
    expect(gate.diagnosticsEnabled({ LFT_ACCEPTANCE_DIAGNOSTICS: "true" })).toBe(false);
    expect(gate.diagnosticsEnabled({ LFT_ACCEPTANCE_DIAGNOSTICS: "1" })).toBe(true);
  });

  test("the block list hides the route and the fixture, on POSIX and Windows paths, and nothing else", () => {
    const blocked = (p: string) => gate.diagnosticsBlockList().some((re) => re.test(p));
    for (const p of [
      "/home/runner/work/lft/src/app/diagnostics/opus.tsx",
      "C:\\src\\lft\\src\\app\\diagnostics\\opus.tsx",
      "src/app/diagnostics",
      "/home/runner/work/lft/assets/diagnostics/opus/story-sentence-16k.opus",
      "C:\\src\\lft\\assets\\diagnostics\\opus\\story-sentence-16k.opus",
    ]) expect({ p, blocked: blocked(p) }).toEqual({ p, blocked: true });
    for (const p of [
      "/home/runner/work/lft/src/app/stories.tsx",
      "/home/runner/work/lft/src/app/diagnosticsx.tsx",
      "/home/runner/work/lft/src/lib/diagnostics/playback-probe.ts",
      "/home/runner/work/lft/assets/audio/fr-reception/fab0c8369a8f73a2b1ae.mp3",
    ]) expect({ p, blocked: blocked(p) }).toEqual({ p, blocked: false });
    for (const dir of gate.DIAGNOSTICS_DIRS) expect(existsSync(path.join(ROOT, dir))).toBe(true);
  });

  // metro.config.js reads the flag when it loads: each case runs in its own process.
  const metro = (env: Record<string, string>) => {
    const code = `const c = require(${JSON.stringify(path.join(ROOT, "metro.config.js"))}); const bl = [].concat(c.resolver.blockList); const hit = (p) => bl.some((re) => re.test(p)); console.log(JSON.stringify({ route: hit(${JSON.stringify(path.join(ROOT, "src/app/diagnostics/opus.tsx"))}), fixture: hit(${JSON.stringify(path.join(ROOT, FIXTURE_PATH))}), story: hit(${JSON.stringify(path.join(ROOT, "src/app/stories.tsx"))}), opus: c.resolver.assetExts.includes("opus"), mp3: c.resolver.assetExts.includes("mp3") }));`;
    const childEnv: NodeJS.ProcessEnv = Object.assign({}, process.env, env);
    if (!("LFT_ACCEPTANCE_DIAGNOSTICS" in env)) delete childEnv.LFT_ACCEPTANCE_DIAGNOSTICS;
    const r = spawnSync(process.execPath, ["-e", code], { cwd: ROOT, env: childEnv, encoding: "utf8" });
    expect(r.status).toBe(0);
    return JSON.parse(r.stdout.trim().split("\n").pop() ?? "{}") as Record<string, boolean>;
  };

  test("metro.config.js: a release build blocks the route and the fixture; .opus is an asset type", () => {
    expect(metro({})).toEqual({ route: true, fixture: true, story: false, opus: true, mp3: true });
  }, 60000);

  test("metro.config.js: the acceptance build (LFT_ACCEPTANCE_DIAGNOSTICS=1) bundles them", () => {
    expect(metro({ LFT_ACCEPTANCE_DIAGNOSTICS: "1" })).toEqual({ route: false, fixture: false, story: false, opus: true, mp3: true });
  }, 60000);
});

describe("check-diagnostics-export (content evidence, not file names)", () => {
  const fixture = readFileSync(path.join(ROOT, FIXTURE_PATH));
  const fixtureSha = sha256(fixture);
  const file = (rel: string, text: string) => ({ rel, bytes: new Uint8Array(Buffer.from(text, "utf8")) });

  test("a renamed fixture and the route's marker strings are found; a clean output is clean", () => {
    const found = scanForDiagnostics(
      [{ rel: "assets/7f3a9c", bytes: new Uint8Array(fixture) }, file("_expo/static/js/web/entry-abc.js", `x="${ROUTE_MARKERS[0]}"`), file("index.android.bundle", `\u0000${ROUTE_MARKERS[1]} verdict=pass`)],
      fixtureSha
    );
    expect(found).toEqual([
      { file: "assets/7f3a9c", kind: "fixture bytes" },
      { file: "_expo/static/js/web/entry-abc.js", kind: "marker diag-opus-screen" },
      { file: "index.android.bundle", kind: "marker LFT_DIAG_OPUS" },
    ]);
    expect(scanForDiagnostics([file("index.html", "<div>stories</div>"), file("a.js", "diag-opus")], fixtureSha)).toEqual([]);
  });

  test("the markers are the route's own strings", () => {
    const route = readFileSync(path.join(ROOT, "src/app/diagnostics/opus.tsx"), "utf8");
    for (const m of ROUTE_MARKERS) expect(route).toContain(m);
    // ... and nothing outside the gated folders uses them.
    const layout = readFileSync(path.join(ROOT, "src/app/_layout.tsx"), "utf8");
    for (const m of ROUTE_MARKERS) expect(layout).not.toContain(m);
  });
});

describe("Opus fixture provenance (content/audio/diagnostics-fixtures.json)", () => {
  const doc = JSON.parse(readFileSync(path.join(ROOT, "content/audio/diagnostics-fixtures.json"), "utf8")) as {
    fixtures: { file: string; sha256: string; bytes: number; bitrateKbps: number; channels: number; source: { clipId: string; file: string; sha256: string; baseline: string } }[];
  };

  test("the fixture and its source clip match their pinned hashes; the source is a baselined story sentence", () => {
    expect(doc.fixtures.map((f) => f.file)).toEqual([FIXTURE_PATH]);
    for (const f of doc.fixtures) {
      const bytes = readFileSync(path.join(ROOT, f.file));
      expect(sha256(bytes)).toBe(f.sha256);
      expect(bytes.length).toBe(f.bytes);
      expect(bytes.subarray(0, 4).toString("latin1")).toBe("OggS");
      expect(bytes.includes(Buffer.from("OpusHead"))).toBe(true);
      expect(f.bitrateKbps).toBeGreaterThanOrEqual(16);
      expect(f.bitrateKbps).toBeLessThanOrEqual(20);
      expect(f.channels).toBe(1);
      expect(f.source.clipId).toMatch(/^[a-z]{2}\.story\./);
      expect(sha256(readFileSync(path.join(ROOT, f.source.file)))).toBe(f.source.sha256);
      const baseline = JSON.parse(readFileSync(path.join(ROOT, f.source.baseline), "utf8")) as { files: Record<string, string> };
      expect(baseline.files[f.source.file]).toBe(f.source.sha256);
    }
  });

  test("the registry covers the fixture folder with the source voice's licence, test-only", () => {
    const entry = loadRegistry().sources.find((s) => s.id === "acceptance-diagnostics-fixtures");
    expect(entry).toBeDefined();
    expect(entry!.covers).toEqual(["assets/diagnostics/"]);
    expect(entry!.testOnly).toBe(true);
  });
});

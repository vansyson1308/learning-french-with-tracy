/**
 * P3g E: release hygiene that a reviewer would otherwise check by hand.
 *  - the app has no network code path (non-negotiable 1; allow-list empty);
 *  - every bundled audio file is referenced, every reference has its file;
 *  - CI-only tools (LanguageTool, ASR audits) never reach the app.
 */
import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dir, "../../..");

function files(dir: string, re: RegExp): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) return name === "__tests__" || name === "test-only" ? [] : files(p, re);
    return re.test(name) ? [p] : [];
  });
}

const APP_SOURCES = ["src/app", "src/components", "src/lib"].flatMap((d) => files(path.join(ROOT, d), /\.(ts|tsx)$/));

describe("release hygiene (P3g E)", () => {
  test("no network code path in the app (fetch / XMLHttpRequest / WebSocket / EventSource)", () => {
    // Any future opt-in network feature needs consent + policy changes (CLAUDE.md non-negotiable 1)
    // and an explicit entry here.
    const ALLOW: string[] = [];
    const re = /\bfetch\s*\(|XMLHttpRequest|new\s+WebSocket|EventSource|from\s+["']axios["']/;
    const offenders = APP_SOURCES.filter((f) => re.test(readFileSync(f, "utf8"))).map((f) => path.relative(ROOT, f).replace(/\\/g, "/"));
    expect(offenders.filter((f) => !ALLOW.includes(f))).toEqual([]);
  });

  test("every bundled pack/lexicon/reception/story audio file is referenced, and every reference exists", () => {
    const referenced = new Set<string>();
    const generated = files(path.join(ROOT, "src/content"), /\.ts$/).filter((f) => /[\\/](audio|reception)[\\/]/.test(f) || f.endsWith("audio-manifest.ts"));
    for (const f of generated) {
      for (const m of readFileSync(f, "utf8").matchAll(/require\("([^"]+\.(?:mp3|wav))"\)/g)) {
        const abs = path.resolve(path.dirname(f), m[1]);
        expect(existsSync(abs)).toBe(true);
        referenced.add(path.relative(ROOT, abs).replace(/\\/g, "/"));
      }
    }
    const shipped = files(path.join(ROOT, "assets/audio"), /\.(mp3|wav)$/).map((f) => path.relative(ROOT, f).replace(/\\/g, "/"));
    const orphans = shipped.filter((f) => !referenced.has(f) && !f.startsWith("assets/audio/xx-"));
    expect(orphans).toEqual([]);
  });

  test("CI-only tools never reach the app (LanguageTool, ASR audits)", () => {
    const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8")) as { dependencies?: Record<string, string> };
    const deps = Object.keys(pkg.dependencies ?? {});
    expect(deps.filter((d) => /languagetool|whisper|sensevoice|funasr/i.test(d))).toEqual([]);
    const offenders = APP_SOURCES.filter((f) => /languagetool|faster-whisper|SenseVoice/i.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});

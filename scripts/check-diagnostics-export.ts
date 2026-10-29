#!/usr/bin/env bun
/**
 * Proves whether a build output holds the acceptance-only Opus diagnostics
 * (the route src/app/diagnostics/opus.tsx and its fixture
 * assets/diagnostics/opus/story-sentence-16k.opus).
 *
 *   bun scripts/check-diagnostics-export.ts <dir> --absent    release outputs (web export, unzipped APK/AAB)
 *   bun scripts/check-diagnostics-export.ts <dir> --present   the LFT_ACCEPTANCE_DIAGNOSTICS=1 build
 *
 * Evidence is content, not names (Metro renames assets, Hermes compiles the
 * JS): a file whose bytes are the fixture's, or a file that carries the
 * route's marker strings (its testID and its log tag survive minification
 * and Hermes bytecode).
 */
import { createHash } from "crypto";
import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dir, "..");
export const FIXTURE_PATH = "assets/diagnostics/opus/story-sentence-16k.opus";
/** Strings only the diagnostics route contains. */
export const ROUTE_MARKERS = ["diag-opus-screen", "LFT_DIAG_OPUS"] as const;

export type Finding = { file: string; kind: "fixture bytes" | `marker ${string}` };

const sha256 = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");

/** Every diagnostics trace in a set of files (pure; tested). */
export function scanForDiagnostics(files: Iterable<{ rel: string; bytes: Uint8Array }>, fixtureSha256: string): Finding[] {
  const found: Finding[] = [];
  const markers = ROUTE_MARKERS.map((m) => ({ m, b: Buffer.from(m, "utf8") }));
  for (const { rel, bytes } of files) {
    if (sha256(bytes) === fixtureSha256) found.push({ file: rel, kind: "fixture bytes" });
    const buf = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (const { m, b } of markers) if (buf.includes(b)) found.push({ file: rel, kind: `marker ${m}` });
  }
  return found;
}

function* walk(dir: string, base = dir): Generator<{ rel: string; bytes: Uint8Array }> {
  for (const name of readdirSync(dir).sort()) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full, base);
    else yield { rel: path.relative(base, full).split(path.sep).join("/"), bytes: readFileSync(full) };
  }
}

if (import.meta.main) {
  const [dir, mode] = process.argv.slice(2);
  if (!dir || (mode !== "--absent" && mode !== "--present")) {
    console.error("usage: check-diagnostics-export.ts <dir> --absent|--present");
    process.exit(2);
  }
  const fixtureSha = sha256(readFileSync(path.join(ROOT, FIXTURE_PATH)));
  const found = scanForDiagnostics(walk(dir), fixtureSha);
  for (const f of found) console.log(`  ${f.kind}: ${f.file}`);
  const hasFixture = found.some((f) => f.kind === "fixture bytes");
  const hasRoute = found.some((f) => f.kind !== "fixture bytes");
  if (mode === "--absent") {
    if (found.length > 0) {
      console.error(`FAIL ${dir}: the acceptance-only diagnostics are in this build (${found.length} trace(s)); only an LFT_ACCEPTANCE_DIAGNOSTICS=1 build may carry them`);
      process.exit(1);
    }
    console.log(`ok ${dir}: no diagnostics route and no Opus fixture (release build)`);
  } else {
    if (!hasFixture || !hasRoute) {
      console.error(`FAIL ${dir}: expected the diagnostics route and its fixture (route ${hasRoute}, fixture ${hasFixture})`);
      process.exit(1);
    }
    console.log(`ok ${dir}: diagnostics route and Opus fixture present (acceptance build)`);
  }
}

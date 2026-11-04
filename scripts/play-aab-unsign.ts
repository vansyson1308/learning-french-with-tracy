#!/usr/bin/env bun
/**
 * D-16 (Google Play closed test): make the generated Android project build an
 * UNSIGNED release bundle. The Expo template signs the `release` build type
 * with the template debug keystore; Play rejects a debug-signed bundle and the
 * owner signs the AAB with the upload key (C:\keys\lft-upload.jks) afterwards,
 * so the release build type must carry no signing config at all.
 *
 *   bun scripts/play-aab-unsign.ts android/app/build.gradle
 *
 * Runs after `expo prebuild` (android/ is generated and never committed).
 * Refuses — instead of guessing — when the template changed shape.
 */
import { readFileSync, writeFileSync } from "fs";

const DEBUG_SIGNING = /^[ \t]*signingConfig signingConfigs\.debug[ \t]*\r?\n/m;

/** Index just past the `}` that closes the block opened at `open` (the `{`). */
function blockEnd(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}" && --depth === 0) return i + 1;
  }
  return -1;
}

/** Pure: the build.gradle text with the release build type unsigned. */
export function unsignReleaseBuildType(gradle: string): string {
  const buildTypes = gradle.search(/^[ \t]*buildTypes[ \t]*\{/m);
  const releaseRel = buildTypes < 0 ? -1 : gradle.slice(buildTypes).search(/^[ \t]*release[ \t]*\{/m);
  if (releaseRel < 0) throw new Error("no release build type found under buildTypes {}");
  const start = buildTypes + releaseRel;
  const end = blockEnd(gradle, gradle.indexOf("{", start));
  if (end < 0) throw new Error("the release build type block is not closed");
  const block = gradle.slice(start, end);
  if (!DEBUG_SIGNING.test(block)) {
    throw new Error("the release build type does not sign with signingConfigs.debug — template changed; refusing to patch");
  }
  const patched = block.replace(DEBUG_SIGNING, "");
  if (/signingConfig\b/.test(patched)) throw new Error("the release build type still names a signingConfig after the patch");
  return gradle.slice(0, start) + patched + gradle.slice(end);
}

if (import.meta.main) {
  const file = process.argv[2];
  if (!file) {
    console.error("usage: bun scripts/play-aab-unsign.ts <android/app/build.gradle>");
    process.exit(2);
  }
  writeFileSync(file, unsignReleaseBuildType(readFileSync(file, "utf8")));
  console.log(`[aab] ${file}: release build type is unsigned (the owner signs the bundle with the upload key)`);
}

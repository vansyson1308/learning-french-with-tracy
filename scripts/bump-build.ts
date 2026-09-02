/**
 * Build-number bump (release/VERSIONING.md): the version source is LOCAL,
 * so every binary uploaded to a store carries a new `ios.buildNumber` and
 * `android.versionCode`, moved together, monotonically, by this script —
 * never by hand and never by the build service.
 *
 *   bun scripts/bump-build.ts            # build +1 on both platforms
 *   bun scripts/bump-build.ts --version 1.0.1   # also set expo.version
 *   bun scripts/bump-build.ts --dry-run  # print, write nothing
 *
 * Refuses a non-semver version, a version lower than the current one, or a
 * build number that would not increase. Prints the resulting triple so the
 * value can be pasted into release/RC_HISTORY.md.
 */
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dir, "..");
const APP_JSON = path.join(ROOT, "app.json");

export type VersionTriple = { version: string; buildNumber: string; versionCode: number };

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

export function compareSemver(a: string, b: string): number {
  const pa = a.match(SEMVER);
  const pb = b.match(SEMVER);
  if (!pa || !pb) throw new Error(`not a semantic version: ${!pa ? a : b}`);
  for (let i = 1; i <= 3; i++) {
    const d = Number(pa[i]) - Number(pb[i]);
    if (d !== 0) return d;
  }
  return 0;
}

/** Pure: the next triple, or an error message. */
export function bumpTriple(current: VersionTriple, nextVersion?: string): VersionTriple {
  const build = Number(current.buildNumber);
  if (!Number.isInteger(build) || build < 1) throw new Error(`ios.buildNumber must be a positive integer, got ${current.buildNumber}`);
  if (!Number.isInteger(current.versionCode) || current.versionCode < 1) throw new Error(`android.versionCode must be a positive integer, got ${current.versionCode}`);
  if (build !== current.versionCode) throw new Error(`buildNumber (${build}) and versionCode (${current.versionCode}) must move together`);
  let version = current.version;
  if (nextVersion !== undefined) {
    if (!SEMVER.test(nextVersion)) throw new Error(`--version must be MAJOR.MINOR.PATCH, got ${nextVersion}`);
    if (compareSemver(nextVersion, current.version) < 0) throw new Error(`version ${nextVersion} is lower than the current ${current.version}`);
    version = nextVersion;
  }
  return { version, buildNumber: String(build + 1), versionCode: current.versionCode + 1 };
}

export function readTriple(appJsonText: string): VersionTriple {
  const app = JSON.parse(appJsonText) as { expo: { version: string; ios?: { buildNumber?: string }; android?: { versionCode?: number } } };
  const buildNumber = app.expo.ios?.buildNumber;
  const versionCode = app.expo.android?.versionCode;
  if (buildNumber === undefined || versionCode === undefined) {
    throw new Error("app.json must carry ios.buildNumber and android.versionCode (local version source) — run the identity migration first");
  }
  return { version: app.expo.version, buildNumber, versionCode };
}

/** Textual edit so app.json keeps its formatting (the identity gate pins it). */
export function applyTriple(appJsonText: string, current: VersionTriple, next: VersionTriple): string {
  const replaceOnce = (text: string, from: string, to: string) => {
    if (text.split(from).length !== 2) throw new Error(`expected exactly one occurrence of ${from}`);
    return text.replace(from, to);
  };
  let out = appJsonText;
  out = replaceOnce(out, `"buildNumber": "${current.buildNumber}"`, `"buildNumber": "${next.buildNumber}"`);
  out = replaceOnce(out, `"versionCode": ${current.versionCode}`, `"versionCode": ${next.versionCode}`);
  if (next.version !== current.version) out = replaceOnce(out, `"version": "${current.version}"`, `"version": "${next.version}"`);
  return out;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const vIndex = args.indexOf("--version");
  const nextVersion = vIndex >= 0 ? args[vIndex + 1] : undefined;
  const text = readFileSync(APP_JSON, "utf8");
  const current = readTriple(text);
  const next = bumpTriple(current, nextVersion);
  const updated = applyTriple(text, current, next);
  JSON.parse(updated); // still valid JSON
  if (!dryRun) writeFileSync(APP_JSON, updated);
  console.log(`${dryRun ? "(dry run) " : ""}version ${current.version} → ${next.version}; build ${current.buildNumber} → ${next.buildNumber}; versionCode ${current.versionCode} → ${next.versionCode}`);
}

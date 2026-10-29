/**
 * Build-time gate for the acceptance-only diagnostics (the Opus playback
 * check): src/app/diagnostics/ (the route) and assets/diagnostics/ (its
 * fixture) reach a bundle ONLY when the build sets
 * LFT_ACCEPTANCE_DIAGNOSTICS=1. Every other build (the release APK/AAB, the
 * web export, EAS) blocks both folders in Metro's file map, so Expo Router's
 * route context never sees the route and nothing can require the fixture.
 *
 * CommonJS: metro.config.js loads it before any transpiler runs.
 */
const DIAGNOSTICS_ENV = "LFT_ACCEPTANCE_DIAGNOSTICS";

/** Repo-relative folders that exist only for the acceptance build. */
const DIAGNOSTICS_DIRS = ["src/app/diagnostics", "assets/diagnostics"];

function diagnosticsEnabled(env) {
  return (env || {})[DIAGNOSTICS_ENV] === "1";
}

/** One separator-agnostic pattern per folder (Metro tests absolute and project-relative paths). */
function diagnosticsBlockList() {
  return DIAGNOSTICS_DIRS.map((dir) => new RegExp(`(^|[\\\\/])${dir.split("/").join("[\\\\/]")}([\\\\/].*)?$`));
}

module.exports = { DIAGNOSTICS_ENV, DIAGNOSTICS_DIRS, diagnosticsEnabled, diagnosticsBlockList };

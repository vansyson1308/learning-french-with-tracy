// Metro configuration: Expo's defaults plus two project rules.
// https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

const { diagnosticsBlockList, diagnosticsEnabled } = require("./scripts/lib/diagnostics-gate");

const config = getDefaultConfig(__dirname);

// Ogg Opus (.opus) is a bundled audio format (release/ASSET_DELIVERY.md, the
// per-layer codec setting in content/audio/engines.json). Metro's default
// asset list has no "opus".
config.resolver.assetExts = [...new Set([...config.resolver.assetExts, "opus"])];

// The acceptance-only diagnostics route and its fixture are invisible to
// every build that does not set LFT_ACCEPTANCE_DIAGNOSTICS=1 (the release
// APK/AAB and the web export); scripts/lib/diagnostics-gate.js.
if (!diagnosticsEnabled(process.env)) {
  const existing = config.resolver.blockList;
  config.resolver.blockList = [...(Array.isArray(existing) ? existing : existing ? [existing] : []), ...diagnosticsBlockList()];
}

module.exports = config;

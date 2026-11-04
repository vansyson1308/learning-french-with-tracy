#!/usr/bin/env bash
# Google Play bundle (D-16, closed test): an UNSIGNED release AAB with the two
# phone ABIs, arm64-v8a + armeabi-v7a. Play App Signing splits it per ABI and
# per screen density for each phone; no x86/x86_64 (emulator-only ABIs).
#
#   bash plan/scripts/build-play-aab.sh        # Git Bash on the owner's PC, or CI (ubuntu)
#
# Output (out/ is git-ignored):
#   out/play/learning-french-with-tracy-<version>-vc<versionCode>-unsigned.aab
#   out/play/...-unsigned.aab.report.txt   (non-secret: commit, sizes, SHA-256, manifest checks)
#
# The bundle is NOT signed here. The owner signs it with the upload key
# (C:\keys\lft-upload.jks, alias upload) by typing the password into
# jarsigner — release/PLAY_SIGNING.md (copy: out\play-signing.md).
# No keystore, password or token is read, written or needed by this script.
set -euo pipefail
export PATH="$HOME/.bun/bin:$PATH"
if [ -z "${JAVA_HOME:-}" ]; then
  for d in "/c/Program Files/Eclipse Adoptium"/jdk-17*; do [ -d "$d" ] && JAVA_HOME="$d"; done
fi
export JAVA_HOME
if [ -z "${ANDROID_HOME:-}" ] && [ -n "${LOCALAPPDATA:-}" ]; then ANDROID_HOME="$LOCALAPPDATA/Android/Sdk"; fi
export ANDROID_HOME
export PATH="$JAVA_HOME/bin:$PATH"
ABIS="${ABIS:-arm64-v8a,armeabi-v7a}"
cd "$(dirname "$0")/../.."
ROOT="$(pwd)"

# Same gates the phone APK build uses, plus the identity gate.
bun install --frozen-lockfile
bun run release:identity
bun scripts/compile-content.ts --check

VERSION=$(bun -e 'console.log(require("./app.json").expo.version)')
VCODE=$(bun -e 'console.log(require("./app.json").expo.android.versionCode)')
COMMIT=$(git rev-parse HEAD)
DIRTY=$(git status --porcelain --untracked-files=no | wc -l | tr -d ' ')
NAME="learning-french-with-tracy-${VERSION}-vc${VCODE}-unsigned.aab"
OUT_DIR="$ROOT/out/play"
mkdir -p "$OUT_DIR"

bunx expo prebuild --platform android --no-install --clean
git checkout package.json 2>/dev/null || true
bun scripts/play-aab-unsign.ts android/app/build.gradle

cd android
GRADLEW=./gradlew
case "${OSTYPE:-}" in msys*|cygwin*)
  GRADLEW=./gradlew.bat
  # Metro reads all ~9k assets in one Promise.all; Node on Windows then hits its
  # file-handle ceiling (EMFILE). Cap concurrent reads (scripts/lib/fs-read-limit.cjs).
  export NODE_OPTIONS="--require $(cygpath -m "$ROOT/scripts/lib/fs-read-limit-preload.cjs") ${NODE_OPTIONS:-}"
  ;;
esac
"$GRADLEW" :app:bundleRelease --no-daemon -PreactNativeArchitectures="$ABIS"
cd "$ROOT"

AAB=android/app/build/outputs/bundle/release/app-release.aab
[ -f "$AAB" ] || { echo "[aab] $AAB not found" >&2; exit 1; }
cp "$AAB" "$OUT_DIR/$NAME"

# Checks on the artifact itself (no bundletool needed: the AAB is a zip).
X="$OUT_DIR/.aab-x"
rm -rf "$X" && mkdir -p "$X"
(cd "$X" && "$JAVA_HOME/bin/jar" xf "$OUT_DIR/$NAME")
# 1. Unsigned — the owner's jarsigner run is the only signature it ever gets.
if "$JAVA_HOME/bin/jarsigner" -verify "$OUT_DIR/$NAME" | grep -q "jar is unsigned"; then SIGNED="unsigned (as intended)"; else
  echo "[aab] the bundle is signed — the release build type still has a signingConfig" >&2; exit 1; fi
# 2. Exactly the two phone ABIs.
ABI_FOUND=$(ls "$X/base/lib" | sort | tr '\n' ' ')
[ "$ABI_FOUND" = "arm64-v8a armeabi-v7a " ] || { echo "[aab] unexpected ABIs: $ABI_FOUND" >&2; exit 1; }
# 3. The acceptance-only diagnostics never ship.
bun scripts/check-diagnostics-export.ts "$X" --absent
# 4. targetSdk 36 and no removed permission, from the merged release manifest.
MANIFEST=$(ls android/app/build/intermediates/merged_manifest/release/*/AndroidManifest.xml android/app/build/intermediates/merged_manifests/release/*/AndroidManifest.xml android/app/build/intermediates/merged_manifest/release/AndroidManifest.xml 2>/dev/null | head -1 || true)
[ -n "$MANIFEST" ] || { echo "[aab] merged release manifest not found" >&2; exit 1; }
grep -q 'android:targetSdkVersion="36"' "$MANIFEST" || { echo "[aab] targetSdkVersion is not 36" >&2; exit 1; }
if grep -qE "FOREGROUND_SERVICE|SYSTEM_ALERT_WINDOW|READ_EXTERNAL_STORAGE|WRITE_EXTERNAL_STORAGE|ACCESS_NETWORK_STATE|WAKE_LOCK" "$MANIFEST"; then
  echo "[aab] a removed permission is back in the merged manifest" >&2; exit 1; fi
rm -rf "$X"

SIZE=$(wc -c < "$OUT_DIR/$NAME" | tr -d ' ')
SHA=$(sha256sum "$OUT_DIR/$NAME" | cut -d' ' -f1)
{
  echo "Play AAB build report (non-secret) — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "file: out/play/$NAME"
  echo "commit: $COMMIT (tracked files modified at build time: $DIRTY)"
  echo "version: $VERSION  versionCode: $VCODE"
  echo "abis: $ABI_FOUND"
  echo "signature: $SIGNED"
  echo "size-bytes: $SIZE"
  echo "sha256: $SHA"
  echo "merged manifest: targetSdkVersion 36; no removed permission"
  echo "uses-permission:"
  grep -o 'android:name="android.permission[^"]*"' "$MANIFEST" | sort -u | sed 's/^/  /'
} > "$OUT_DIR/$NAME.report.txt"
cat "$OUT_DIR/$NAME.report.txt"
echo
echo "[aab] Next: sign it with the upload key — release/PLAY_SIGNING.md, step 3"

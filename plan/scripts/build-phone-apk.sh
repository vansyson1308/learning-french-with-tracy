#!/usr/bin/env bash
# Local release APK for PHONES (P3g C): arm64-v8a + armeabi-v7a only — no
# x86/x86_64 (those are emulator ABIs; the CI QA APK and the P3h emulator
# suite build x86_64 separately). The store build is an AAB with ABI splits.
#
#   bash plan/scripts/build-phone-apk.sh            # from Git Bash on the owner's PC
#
# Output: android/app/build/outputs/apk/release/app-release.apk (unsigned —
# the owner signs it with the out\ky-apk-*.cmd script; never commit keys).
set -euo pipefail
export PATH="$HOME/.bun/bin:$PATH"
export JAVA_HOME="${JAVA_HOME:-/c/Program Files/Eclipse Adoptium/jdk-17.0.18.8-hotspot}"
export ANDROID_HOME="${ANDROID_HOME:-$LOCALAPPDATA/Android/Sdk}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
ABIS="${ABIS:-arm64-v8a,armeabi-v7a}"
cd "$(dirname "$0")/../.."
bun install --frozen-lockfile
bun scripts/compile-content.ts --check
bunx expo prebuild --platform android --no-install --clean
git checkout package.json 2>/dev/null || true
cd android
./gradlew.bat :app:assembleRelease --no-daemon -PreactNativeArchitectures="$ABIS"
ls -la app/build/outputs/apk/release/

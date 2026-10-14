# Audit: building a signed release APK locally on Windows (2026-10-14)

Source: full read of `release/ANDROID_RC2.md`, `ANDROID_SIGNING.md`, `ANDROID_RC2_BASELINE.md`, `PUBLISHING_RUNBOOK.md`, `RELEASE_CHECKLIST.md`, `RC_HISTORY.md`, `RC_ARTIFACTS.md`, `VERSIONING.md`, `RELEASE_IDENTITY.md`, `identity.json`, `DEVICE_ACCEPTANCE.md`, `ANDROID_DEVICE_ACCEPTANCE_PACKETS.md`, `KNOWN_LIMITATIONS.md`, `SDK57_UPGRADE.md`, `PERFORMANCE.md`, `SOAK_REPORT.md`, all `.github/workflows/*.yml`, `scripts/release-identity-gate.ts`, `scripts/lib/release-identity.ts`, `apply-identity.ts`, `bump-build.ts`, `emulator-smoke.sh`, `scripts/lib/audio.ts`, `scripts/compile-content.ts`, `eas.json`, `app.json`, `bunfig.toml`, `.gitignore`. Repo at `main` @ `7f85d32` (merge of PR #27).

## 1. Current state

- **`android/` is NOT committed** (`.gitignore`: `/ios`, `/android`). CNG: `expo prebuild` regenerates it every time. Prebuild rewrites the npm `android`/`ios` scripts to `expo run:*` — revert that (`ANDROID_RC2.md` §2, `SDK57_UPGRADE.md`).
- Identity (`app.json`, `release/identity.json`): package `com.vansyson1308.learningfrenchwithtracy`, name "Learning French with Tracy", scheme `learningfrenchtracy`, version 1.0.0 / versionCode 1 / iOS buildNumber "1", `allowBackup:false`, permissions RECORD_AUDIO + MODIFY_AUDIO_SETTINGS (SYSTEM_ALERT_WINDOW, READ/WRITE_EXTERNAL_STORAGE blocked), `experiments.reactCompiler:true`, `typedRoutes:true`. No `extra.eas.projectId`, no `owner`; `identity.json` ownership `confirmed` (2026-09-08), `easProjectId:null`, `storeDistribution:"blocked"`.
- `eas.json`: `appVersionSource:"local"`; `preview` = internal, APK, no dev client; `production` = store, AAB; `development` = dev client.
- Toolchain (from `SDK57_UPGRADE.md` prebuild output): Expo 57.0.19 / RN 0.86.3 / React 19.2.3 / Hermes 250829098.0.17; compileSdk/targetSdk/minSdk 36/36/24; build-tools 36.0.0; **NDK 27.1.12297006**; AGP 8.12.0 / Kotlin 2.1.20; New Architecture + Hermes + edge-to-edge all on; `enableOnBackInvokedCallback=false`; `reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64` → universal APK ≈125–136 MB.
- CI pins: bun 1.3.11; **JDK Temurin 17** in every Android workflow; `eas-cli@23.2.0`; `expo-doctor@1.20.4`.

## 2. What blocks a release APK today

- **Gate G1** (`ANDROID_RC2.md` §3): no EAS project for the owner; `eas whoami` = Not logged in; no `EXPO_TOKEN`. RC2 is defined as an EAS `preview` build with an EAS-managed keystore → "NOT BUILT YET".
- **No keystore exists anywhere.** `ANDROID_SIGNING.md` planned an EAS-managed key with a "One key" rule (a changed signer fingerprint on a later RC is a release failure unless explained). Runbook D4 allows a self-held key (backed up offline, uploaded to EAS credentials); D5 allows a direct-APK key held as 4 repo secrets.
- **Not blocking a local build:** `release-identity-gate.ts` only runs when called (`bun run release:identity`, CI, and the `eas-build-pre-install` hook). It checks `app.json`/`eas.json` vs `identity.json`; with `EAS_BUILD_PROFILE=production` it fails while store distribution is BLOCKED, `preview` passes. Trap: `eas init` writes `extra.eas.projectId` → gate fails until `bun scripts/apply-identity.ts link --eas-project-id <uuid> --evidence "…"` is committed. Never pass `--allow-store` before a Play account exists.
- The interim debug-signed QA APK (run 34164812120, 2026-09-07, 30-day retention) has expired. Any debug-signed install must be uninstalled before a differently-signed APK installs (progress only survives via Export/Import).

### What `android-release-build.yml` does (debug-signed QA APK)
```
# setup-bun 1.3.11; setup-java temurin 17 (ubuntu-latest)
bun install --frozen-lockfile
bun run release:identity
bunx expo prebuild --platform android --no-install --clean
cd android && ./gradlew :app:assembleRelease --no-daemon --stacktrace
APK=$(ls android/app/build/outputs/apk/release/*.apk | head -1)
BT=$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)
"$BT/aapt2" dump badging "$APK"; "$BT/aapt2" dump permissions "$APK"
grep -q "targetSdkVersion:'36'" badging.txt
! grep -qE "FOREGROUND_SERVICE|SYSTEM_ALERT_WINDOW|READ_EXTERNAL_STORAGE|WRITE_EXTERNAL_STORAGE" permissions.txt
```
It does **not** run `compile-content`. The APK is debug-signed because the Expo template's `release` build type uses `signingConfigs.debug` (`RC_ARTIFACTS.md`).

### `android-direct-apk.yml` (the repo's own owner-key signing pattern — post-sign, no Gradle edits)
```
bun scripts/compile-content.ts --check; bun scripts/validate-content.ts; bun scripts/check-audio.ts
bunx expo prebuild --platform android --no-install --clean
cd android && ./gradlew --no-daemon assembleRelease
"$BT/zipalign" -p -f 4 "$APK" out/aligned.apk
"$BT/apksigner" sign --ks "$KS" --ks-pass env:KS_PASS --ks-key-alias "$KEY_ALIAS" --key-pass env:KEY_PASS --out "out/$NAME" out/aligned.apk
"$BT/apksigner" verify --print-certs "out/$NAME"
sha256sum "$NAME" > "$NAME.sha256"
```
Refuses unless: tag `v[0-9]*`, `identity.json` ownership `confirmed`, package ≠ `com.ahmet.lingo`, and 4 secrets (`ANDROID_RELEASE_KEYSTORE_BASE64`, `..._PASSWORD`, `ANDROID_RELEASE_KEY_ALIAS`, `ANDROID_RELEASE_KEY_PASSWORD`). Publishes `learning-french-with-tracy-<tag>.apk` as a GitHub prerelease.

`eas-build.yml` needs `EXPO_TOKEN`; runs `eas init --account <x>` when `init_account` is set, `apply-identity.ts link`, then `eas build --platform android --profile <p> --non-interactive`, downloads the APK and checks package / targetSdk 36 / versionName 1.0.0 / removed permissions / `apksigner` Verifies / DEBUGGABLE; artifact kept 7 days. `android-emulator-smoke.yml` runs `scripts/emulator-smoke.sh` on an API 34 x86_64 emulator.

## 3. Local Windows procedure without EAS

### 3.0 Signing key decision first
The signer of the first phone install decides how every later update installs. Repo-consistent local route: generate **one** owner-held key (runbook D4), back it up offline outside the repo (`*.jks`, `*.p12`, `*.key` are gitignored), record non-secret facts (SHA-256 fingerprint, DN, created, alias) in `ANDROID_SIGNING.md` and change the Strategy row to "owner-held (to be uploaded to EAS credentials if EAS is used later)". If EAS is ever used, upload this same key first so EAS never generates a second signer.

### 3.1 Prerequisites (owner PC, verified 2026-10-14: Node 24.14, Temurin JDK 17 + 21, Git 2.49, Claude Code 2.1.296, 32 GB RAM, 113 GB free, LongPathsEnabled=1; **missing: bun, Android SDK, adb**)
- JDK **17** (Temurin, `C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot`) → `JAVA_HOME`, `%JAVA_HOME%\bin` on PATH (CI parity; JBR 21 unverified).
- Android SDK at `%LOCALAPPDATA%\Android\Sdk` via cmdline-tools: `platform-tools`, `platforms;android-36`, `build-tools;36.0.0`, `ndk;27.1.12297006`, `cmake;3.22.1`; `sdkmanager --licenses`. `ANDROID_HOME` set; `%ANDROID_HOME%\platform-tools` and `build-tools\36.0.0` on PATH.
- bun 1.3.x (`irm bun.sh/install.ps1 | iex`). Node 24 is fine for `npx`/`bunx`.
- Clone with `-c core.autocrlf=false` to a **short path without spaces** (`C:\src\lft`); `git config --global core.longpaths true`.

### 3.2 Commands (PowerShell)
```powershell
git clone -c core.autocrlf=false https://github.com/vansyson1308/learning-french-with-tracy C:\src\lft
cd C:\src\lft
bun install --frozen-lockfile
bun run release:identity          # expect "STORE DISTRIBUTION IDENTITY = BLOCKED" + "release identity gate passed"
bun scripts/compile-content.ts --check   # drift guard only — never run plain compile for a build
bun scripts/validate-content.ts
# bun scripts/check-audio.ts  → FAILS on Windows (path separators, see §4); skip or run under WSL/Git Bash
bunx expo prebuild --platform android --no-install --clean
git checkout package.json         # revert the expo run:* script rewrite
cd android
.\gradlew.bat :app:assembleRelease --no-daemon --stacktrace
# faster phone-only variant: .\gradlew.bat :app:assembleRelease -PreactNativeArchitectures=arm64-v8a   (record that it is not the universal CI artifact)
cd ..
```
Output: `android\app\build\outputs\apk\release\app-release.apk` (release build, template debug key).

### 3.3 Generate the key once (outside the repo)
```powershell
keytool -genkeypair -v -keystore C:\keys\lft-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
```

### 3.4 Sign (post-sign, mirrors `android-direct-apk.yml`)
```powershell
$BT = "$env:ANDROID_HOME\build-tools\36.0.0"
$APK = "android\app\build\outputs\apk\release\app-release.apk"
mkdir out -Force
& "$BT\zipalign.exe" -p -f 4 $APK out\aligned.apk
& "$BT\apksigner.bat" sign --ks C:\keys\lft-upload.jks --ks-key-alias upload --out out\learning-french-with-tracy-v1.0.0-rc.3.apk out\aligned.apk
Remove-Item out\aligned.apk
& "$BT\apksigner.bat" verify --verbose --print-certs out\learning-french-with-tracy-v1.0.0-rc.3.apk   # must say Verifies; copy Signer #1 SHA-256 + DN
& "$BT\aapt2.exe" dump badging out\learning-french-with-tracy-v1.0.0-rc.3.apk | findstr /R "^package: targetSdkVersion application-debuggable"
& "$BT\aapt2.exe" dump permissions out\learning-french-with-tracy-v1.0.0-rc.3.apk
certutil -hashfile out\learning-french-with-tracy-v1.0.0-rc.3.apk SHA256
```
Checks (from `ANDROID_RC2.md` §4 and `eas-build.yml`): package id correct; `versionName='1.0.0'`, `versionCode='1'` (or the bumped values); `targetSdkVersion:'36'`; permissions exactly `INTERNET`, `MODIFY_AUDIO_SETTINGS`, `RECORD_AUDIO`, `VIBRATE`; no `application-debuggable`; `apksigner` "Verifies".

Alternatives: sign inside Gradle via a `signingConfigs.release` block reading `%USERPROFILE%\.gradle\gradle.properties` (lost on `prebuild --clean` unless made a config plugin = app change = new RC); `expo run:android --variant release` (still debug-signed, rewrites scripts) — not recommended.

### 3.5 Install
```powershell
adb devices
adb install out\learning-french-with-tracy-v1.0.0-rc.3.apk
# same key later: adb install -r <apk>; different signer: export progress, adb uninstall com.vansyson1308.learningfrenchwithtracy
```

### 3.6 Build-setting implications
Hermes V1 0.17 includes the memory-regression fix; New Arch means NDK/CMake C++ builds (long, path-length sensitive); `reactCompiler` is Babel-time only; edge-to-edge + `predictiveBackGestureEnabled:false` → `enableOnBackInvokedCallback=false`; `expo-dev-client` is a dependency but `assembleRelease` does not activate the dev launcher (confirm "no debug overlay" in Packet 2).

### 3.7 EAS fallback
Route A on the owner PC: `npx eas-cli@23.2.0 login` → `whoami` → `init --account <user>` → `build --platform android --profile preview` (answer yes to keystore only if no local key exists; otherwise upload the local key via `eas credentials` first), then `bun scripts/apply-identity.ts link --eas-project-id <uuid> --evidence "…"` and commit `app.json` + `release/identity.json`. Route B: `EXPO_TOKEN` repo secret + dispatch "EAS build (Android RC)". `eas build --local` does not support Windows (WSL2 only).

## 4. Windows pitfalls visible in the repo
1. **No `.gitattributes`.** With `core.autocrlf=true`, `compile-content --check` reports DRIFT on every generated file (exact string compare, `compile-content.ts:341-355`) and `check-audio` fails (manifest sha). Clone with `-c core.autocrlf=false` (or add `.gitattributes` `* text=auto eol=lf`).
2. **`check-audio` fails on Windows**: `scripts/lib/audio.ts` builds keys with `path.relative()` → backslashes vs the baseline's `assets/audio/...` (lines 85–102, 137–143). Guard only; fix by normalising to `/` (small PR) or run under WSL.
3. Bash/Python scripts (`emulator-smoke.sh`, `verify-site.sh`, `e2e/*.mjs` spawn `python3`) are CI-only or need Git Bash / `python`.
4. Device packets use Unix host commands (`grep`, `seq`); `adb exec-out screencap -p > x.png` corrupts PNGs in PowerShell 5.1 — use `adb shell screencap -p /sdcard/x.png` + `adb pull`. `certutil -hashfile` is already listed for Windows.
5. Long paths: NDK/CMake under `node_modules\...\android\.cxx`; keep the checkout at `C:\src\lft`, `core.longpaths true`.
6. `.\gradlew.bat`, `--no-daemon` for CI parity; `~/.gradle` cache reused.
7. Prebuild rewrites `package.json` scripts — revert.
8. bun on Windows: `bun install`, `bun scripts/*.ts`, `bunx` work; `bun:sqlite` only needed by `compile-content`. CI verified bun only on Linux.

## 5. Versioning / RC rules
- `appVersionSource: local`; versions change only via `bun run release:bump` (`--version X.Y.Z`, `--dry-run`); it requires iOS buildNumber == Android versionCode and increments both. Never hand-edit.
- One build number per uploaded binary; `expo.version` stays 1.0.0 across RCs; RC labels (`1.0.0-rc.N`) live only in `RC_HISTORY.md`.
- Any app change after device testing → next RC (RC3, RC4…); record-only commits keep the RC number. Annotated tag `v1.0.0-rc.N` on the exact built commit, pushed by the owner (automation credential gets 403 on tags). `android-direct-apk.yml` accepts only `v[0-9]*` tags.
- Per-RC records: `RC_HISTORY.md` row (commit, tag, version/build, APK sha256, CI run, guide walk, device acceptance, outcome); `ANDROID_RC2.md` §4 build table; `ANDROID_SIGNING.md` signer record; every later RC must show the same Signer #1 SHA-256.
- Final RC exit gate: CI green on the commit; DEVICE ACCEPTED (both platforms, 0 P0/P1); accessibility A1–A15; soak; listings + screenshots from this build; privacy URL 200; identity linked and store distribution ALLOWED.
- Never commit or print tokens or keystores; never create the long-lived key in CI or a cloud container.

## 6. Phone acceptance checklist (condensed from `ANDROID_DEVICE_ACCEPTANCE_PACKETS.md` + `DEVICE_ACCEPTANCE.md`)
Reply format per packet: `PACKET <n>` / `<item>: PASS | FAIL | N/A — <one line>` / `attachments:`. Never send serial numbers or voice recordings. Severity: P0 crash/data loss/privacy/false claim; P1 major journey broken; P2 real non-blocking; P3 cosmetic.
- **P0 Connect**: USB debugging; `getprop` manufacturer/model/release/sdk, `wm size`, `wm density`, MemTotal, `voice_recognition_service`, speech/tts packages.
- **P1 Install & launch**: sha256 check; `adb install`; `dumpsys package $PKG | grep -E "versionName|versionCode|targetSdk"`; `logcat -c`, launch, 30 s, save `*:E` lines (AndroidRuntime, FATAL, ReactNative, SQLite, Audio, Speech, Recogni) → `01-launch-errors.txt` (should be ~empty); `01-launch.png`.
- **P2 Fresh install**: name/icon; splash without white flash/debug overlay/red box; choose French; placement → start from beginning; path shows lesson 1 unlocked; Profile shows `1.0.0 (build N)`; Privacy and Licenses open.
- **P3 Core learning**: lessons 1–2 all exercise types, wrong answer re-queued, XP, streak 1; Today counts; Vocabulary load time, `café`/`cafe` and `oeuf`/`œuf` same results; entry shows gender/audio/example/memory state.
- **P4 Audio**: word/sentence clips, Play again + Slow, partner line, number clips, checkpoint clip; rate the 5 ASR-flagged sentences; audio stops on Back/Home.
- **P5 Microphone & speech**: allow/record/stop; revoke RECORD_AUDIO → blocked panel/Skip/Open Settings; 7 real attempts (category only); rapid-stop race ×5 → technical outcome only; airplane mode notice accuracy; Home while recording aborts safely; headset unplug no crash.
- **P6 Writing, conversation, checkpoints, capstone**: real keyboard cases (valid, missing fact, no accents, ’, keyword stuffing, very long); 3 scenarios (repeat/rephrase/repair/silence/technical failure); 4 checkpoints (option order changes on retake, no leak); A1 capstone never says A1 unless every required objective demonstrated.
- **P7 Backup**: export (name + size only) → `pm clear` → import → lessons/streak/cards/placement/checkpoints/estimate restored.
- **P8 Accessibility**: TalkBack announcements for nodes/options/Check/feedback/record/partner line; largest text & display size not clipped; Accessibility Scanner if installed.
- **P9 Soak**: `dumpsys meminfo` snapshots 00–06 (idle, 20 bg/fg cycles, 50 clips, 50 speech, 25 conversations, 25 vocab opens, 3 lessons + 2 Today); cache not growing; errors file; pass = plateau after block 2, no block >25 % above; `speech-attempts/` empty.
- **P10 User guide walk**: `docs/USER_GUIDE.md` §1–36; `SCREENSHOT_MANIFEST.md` shots.
- Exit criteria for DEVICE ACCEPTED: both matrices on the RC build, ≥2 devices per platform (one Android 14/15, one 8–10), 0 open P0/P1, P2s fixed or accepted in `KNOWN_LIMITATIONS.md`, A1–A15 PASS, soak complete, sheet committed. Results go to `DEVICE_ACCEPTANCE.md`, `ACCESSIBILITY_FINAL.md`, `SOAK_REPORT.md`, `docs/USER_GUIDE_VALIDATION.md`, `ANDROID_RC2.md`.

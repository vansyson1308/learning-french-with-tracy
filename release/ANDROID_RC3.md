# Android RC3 — first candidate built locally on Windows, owner-signed

**RC3 status (2026-10-14): unsigned release APK built and verified on the
owner's PC; signing + phone install are owner actions (§3, §4).**

RC3 supersedes the RC2 EAS route (`ANDROID_RC2.md`): same permanent
identity (`com.vansyson1308.learningfrenchwithtracy`, 1.0.0, versionCode 1),
same sources plus the P0 small fixes, but built with `expo prebuild` +
Gradle on Windows and signed with an owner-held keystore
(`ANDROID_SIGNING.md`). Any app change after the phone test produces RC4 —
a tag or hash is never reused for changed bytes.

## 1. Commit and changes

| Item | Value |
|---|---|
| Branch | `phase-0/rc3-local-apk` (PR to `main`) |
| Commit built | `e5dcfd015c407bf445afae9d517661f367934104` |
| On top of | `main` `7f85d32` (PR #27 security audit) + `1c41a96` (plan docs) + `94413f7` (P0 small fixes); `e5dcfd0` adds `ACCESS_NETWORK_STATE` + `WAKE_LOCK` to `blockedPermissions` after the first local build (from `94413f7`, SHA-256 `38d5c9b5…a43f`, 125,210,718 bytes, never signed or installed) showed them merged in from expo-image / media3 library manifests |
| App changes vs RC2 sources | P0 small fixes: Windows `audio:check` path keys, onboarding preselects `fr-en`, course guards for French-only routes, lesson MCQ option order seeded, orphan `pack.json` removed, licence doc truth (`LEXICON_LICENSE.md`). **No French learning behaviour or authored content changed**; generated artifacts changed only in `ATTRIBUTIONS.md`. |
| Version | `1.0.0` / build 1 / versionCode 1 — **not bumped** (no device test yet; `VERSIONING.md`) |

## 2. Toolchain (verified on the owner's PC)

| Tool | Version / location |
|---|---|
| Windows | 10 Pro 10.0.19045, `LongPathsEnabled=1`, `git config --global core.longpaths true` |
| Checkout | `C:\src\lft`, cloned with `-c core.autocrlf=false` (0 CRLF files; `.gitattributes` now pins LF) |
| Node / bun | Node 24.14.0 / bun 1.4.3 (`%USERPROFILE%\.bun\bin`) |
| JDK | Temurin 17.0.18 (`JAVA_HOME`); JDK 21 also installed, not used |
| Android SDK | `%LOCALAPPDATA%\Android\Sdk`: platform-tools 37.0.1, platforms;android-36, build-tools;36.0.0, ndk;27.1.12297006, cmake;3.22.1 (installed with `sdkmanager`, licences accepted) |
| Gradle | 9.3.1 via the generated wrapper |
| PowerShell | Constrained Language Mode on this PC — `setup-windows-android.ps1` cannot run; steps done from Git Bash / cmd (note in the script header) |

## 3. Build record

```
bunx expo prebuild --platform android --no-install --clean   # then: git checkout package.json
cd android && gradlew.bat :app:assembleRelease --no-daemon --stacktrace
```

| Field | Value |
|---|---|
| Prebuild | `/android` generated (git-ignored), `package.json` script edits reverted |
| Gradle result | `BUILD SUCCESSFUL in 15m 29s` (868 tasks; 2026-10-14, after the `e5dcfd0` rebuild; the first build from `94413f7` took ~45 min cold including Gradle 9.3.1 + NDK downloads) |
| Unsigned APK | `android\app\build\outputs\apk\release\app-release.apk` — 125,210,674 bytes, SHA-256 `ed112417b0ffb6b6fb0a424a7325409b91d92655c6fb552602e2d10b4330164e`, universal (arm64-v8a, armeabi-v7a, x86, x86_64); Gradle signs it with the template debug key (`signingConfigs.debug`) — the owner's `apksigner` run replaces that signature |
| Signed APK | `out\learning-french-with-tracy-v1.0.0-rc.3.apk` — **pending the owner's signing run** (`plan\scripts\sign-apk-windows.cmd`); SHA-256, size, signer SHA-256 and DN are then copied here and into `RC_HISTORY.md` / `ANDROID_SIGNING.md` from `out\rc.3-signing-report.txt` |
| Package / versionName / versionCode / targetSdk | must read `com.vansyson1308.learningfrenchwithtracy` / `1.0.0` / `1` / `36` — **observed:** `package: name='com.vansyson1308.learningfrenchwithtracy' versionCode='1' versionName='1.0.0'`, `targetSdkVersion:'36'`, `compileSdkVersion='36'`, label `Learning French with Tracy` — PASS |
| Permissions | must be exactly `INTERNET`, `MODIFY_AUDIO_SETTINGS`, `RECORD_AUDIO`, `VIBRATE` — **observed:** exactly those four, plus the app's own AndroidX-generated `com.vansyson1308.learningfrenchwithtracy.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` (signature-scoped, no prompt) — PASS. The first build (`94413f7`) also carried `ACCESS_NETWORK_STATE` (expo-image, media3) and `WAKE_LOCK` (media3-exoplayer); both are now in `blockedPermissions` (`e5dcfd0`) |
| Debuggable | `aapt2 dump badging` must not print `application-debuggable` — **observed:** no `application-debuggable` line — PASS |
| Signature | `apksigner verify` must report *Verifies* — pending the owner's signing run |

### 3a. Owner: sign (once per RC)

In a normal `cmd.exe` window at `C:\src\lft`:

```
plan\scripts\sign-apk-windows.cmd 3
```

The first run creates `C:\keys\lft-upload.jks` with `keytool` (you type the
keystore password, the key password and a certificate name — nothing is
written to the repo). Then it zipaligns, signs (asks for the password),
verifies, dumps badging/permissions and the SHA-256 into
`out\rc.3-signing-report.txt`. **Back up the `.jks` and both passwords
offline in two places before installing anything.**

## 4. Owner: install and phone packets 1–3 (Windows commands)

Enable USB debugging on the phone (Settings → About → tap Build number ×7 →
Developer options → USB debugging), plug in, accept the RSA prompt. Then,
in `cmd.exe` at `C:\src\lft` (`adb` is on the user PATH; otherwise use
`%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe`):

```
set PKG=com.vansyson1308.learningfrenchwithtracy
set APK=out\learning-french-with-tracy-v1.0.0-rc.3.apk
mkdir out\packets 2>nul
adb devices
```

**Packet 0 — connect** (reply: PASS/FAIL per line, never serial numbers):

```
adb shell getprop ro.product.manufacturer & adb shell getprop ro.product.model & adb shell getprop ro.build.version.release & adb shell getprop ro.build.version.sdk
adb shell wm size & adb shell wm density
adb shell cat /proc/meminfo | findstr MemTotal
adb shell settings get secure voice_recognition_service
adb shell pm list packages | findstr /I "speech tts recognition google.android.tts"
```

**Packet 1 — install & launch**:

```
certutil -hashfile %APK% SHA256                      (must equal the report)
adb shell pm list packages | findstr %PKG%           (if a debug-signed build is present: export progress in the app first, then  adb uninstall %PKG%)
adb install %APK%
adb shell dumpsys package %PKG% | findstr /I "versionName versionCode targetSdk"
adb logcat -c
adb shell monkey -p %PKG% -c android.intent.category.LAUNCHER 1
timeout /t 30
adb logcat -d *:E | findstr /I "AndroidRuntime FATAL ReactNative SQLite Audio Speech Recogni" > out\packets\01-launch-errors.txt
adb shell screencap -p /sdcard/01-launch.png & adb pull /sdcard/01-launch.png out\packets\01-launch.png
```

`01-launch-errors.txt` should be empty or near-empty; any `FATAL` /
`AndroidRuntime` line is P0 — send the file.

**Packet 2 — fresh install journey** (PASS/FAIL + one line each):

- app name and icon on the launcher; splash without white flash, debug overlay or red box
- onboarding preselects **French** (P0 fix) → "Learn French"; Today tab visible
- placement intro → "start from the beginning" → path shows lesson 1 unlocked
- Profile shows `1.0.0 (build 1)`; Privacy and Licenses screens open (Licences lists Lexique 4)
- deep links while French is active:  `adb shell am start -W -a android.intent.action.VIEW -d "learningfrenchtracy://goals"` opens Goals; after switching the course to Spanish in Courses, the same link goes home (P0 guard)
- screenshot: `adb shell screencap -p /sdcard/02-path.png & adb pull /sdcard/02-path.png out\packets\02-path.png`

**Packet 3 — core learning**:

- lessons 1–2: every exercise type renders; a wrong answer is re-queued; **the correct option is not always first** (P0 shuffle) and re-opening the same lesson keeps the same order that day; XP and streak 1 appear
- Today session counts; Vocabulary opens in < 2 s, `café` / `cafe` and `oeuf` / `œuf` return the same entry; entry shows gender, audio, example, memory state
- Practice → Mistakes re-drills the missed items; Backup export writes a file (name + size only in the reply)
- `adb logcat -d *:E | findstr /I "AndroidRuntime FATAL ReactNative SQLite Audio Speech Recogni" > out\packets\03-learning-errors.txt`

Reply format per packet: `PACKET <n>` / `<item>: PASS | FAIL | N/A — <one line>` /
`attachments:` (the `.txt` and `.png` files under `out\packets`). Severity:
P0 crash/data loss/privacy/false claim; P1 major journey broken; P2 real
non-blocking; P3 cosmetic. Packets 4–10 (`ANDROID_DEVICE_ACCEPTANCE_PACKETS.md`)
follow once 1–3 pass.

## 5. Tag

`v1.0.0-rc.3` is created only on the merged commit, after CI is green on
GitHub (the automation credential cannot push tags):

```
git tag -a v1.0.0-rc.3 e5dcfd015c407bf445afae9d517661f367934104 -m "v1.0.0-rc.3 — RC3, first locally built, owner-signed candidate"
git push origin v1.0.0-rc.3
```

Until then RC3 is **not** called tagged.

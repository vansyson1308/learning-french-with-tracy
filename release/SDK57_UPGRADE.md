# Gate 0 — Expo SDK 56 → 57 production stabilization

Executed 2026-09-02 on `phase10/final-release`, as its own isolated commit,
after the baseline in `release/BASELINE.md` was recorded.

## Why

`expo-doctor` on the SDK-56 tree reported the upstream-known Hermes V1
memory regression: Hermes `250829098.0.10` was installed; the first fixed
Hermes is `250829098.0.16`, shipped with React Native 0.86.2 / expo 57.0.9.
Apps that import `react-native-reanimated` / `react-native-worklets` (this
app does, through Expo Router and the session UI) were reported to use
drastically more memory. Remaining on SDK 56 would have required a
technical justification; none exists.

## What changed (dependency table)

| Package | Before | After | Source of the "after" |
|---|---|---|---|
| expo | 56.0.11 | **57.0.19** | npm `latest` (2026-09-01) |
| react-native | 0.85.3 | **0.86.3** | `expo@57.0.19/bundledNativeModules.json` |
| react / react-dom | 19.2.3 | 19.2.3 (unchanged) | same |
| Hermes V1 | 250829098.0.10 | **250829098.0.17** (`hermes-compiler`; `HERMES_VERSION_NAME=0.17.0`) | installed tree |
| react-native-reanimated | 4.3.1 | 4.5.1 | bundledNativeModules |
| react-native-worklets | 0.8.3 | 0.10.1 | bundledNativeModules |
| react-native-gesture-handler | ~2.31.1 | ~2.32.0 (2.32.0) | bundledNativeModules |
| react-native-screens | 4.25.2 | ~4.26.0 (4.26.2) | bundledNativeModules |
| expo-audio | ~56.0.12 | ~57.0.4 | bundledNativeModules |
| expo-sqlite | ~56.0.5 | ~57.0.2 | bundledNativeModules |
| expo-router | ~56.2.10 | ~57.0.18 | bundledNativeModules |
| expo-file-system / expo-sharing / expo-document-picker / expo-speech / expo-haptics / expo-image / expo-splash-screen / expo-constants / expo-dev-client / expo-device / expo-font / expo-glass-effect / expo-linking / expo-status-bar / expo-symbols / expo-system-ui / expo-web-browser / @expo/ui | 56.x | 57.x | bundledNativeModules |
| **expo-asset** | (missing) | ~57.0.16 | `expo-doctor`: required peer of expo-audio |
| expo-speech-recognition | 56.0.4 | **57.0.0** (exact) | third-party; tarballs byte-identical except the version string |
| jest-expo | 56.0.5 | ~57.0.5 | bundledNativeModules |
| eslint-config-expo | ^57.0.2 | ~57.0.2 | bundledNativeModules |
| ts-fsrs / zustand / async-storage / typescript / zod | unchanged | unchanged | not SDK-paired |

Method: `expo install --fix` could not reach `api.expo.dev` from this
environment, so the identical alignment was applied from the installed
`bundledNativeModules.json` (the file `--fix` falls back to). The lockfile
was then regenerated because the first install left same-version nested
copies of `expo-constants`, `expo-file-system` and `expo-font` under
`node_modules/expo/` and `node_modules/expo-asset/` (flagged by
`expo-doctor` as a native-build risk). After regeneration every module has
exactly one copy and `bun install --frozen-lockfile` reproduces the tree
("Checked 1146 installs across 1050 packages (no changes)").

`expo prebuild` rewrites the `android`/`ios` npm scripts to `expo run:*`;
that was reverted — the project is Continuous Native Generation and does
not commit native folders.

## expo-doctor before → after

| Check | SDK 56 | SDK 57 |
|---|---|---|
| Hermes V1 regression | **FAIL** (0.10 installed, fix at 0.16) | pass (0.17) |
| Required peer dependencies | **FAIL** (expo-asset missing) | pass |
| Duplicate native modules | pass | pass (after lockfile regeneration) |
| Expo config schema | network error (blocked) | network error (blocked) |
| React Native Directory metadata | network error (blocked) | network error (blocked) |
| Total | 18/22 | 19/21 — only the two network-dependent checks fail |

## Regression (complete Phase 0–9 suite on the upgraded tree)

| Lane | Result |
|---|---|
| `bunx tsc --noEmit` | clean |
| `bun run test` | 1057 pass / 0 fail (1047 baseline + 10 new Gate 1 tests), 9,023 assertions |
| `bunx jest` | 68 pass / 10 suites (first run 21.6 s cold cache, then 7.1 s) |
| `bunx eslint .` | 0 errors, 25 warnings (unchanged set) |
| `validate-content` | passed |
| `compile-content --check` | artifacts up to date |
| 8 courses | pack fixtures and byte-parity suites unchanged and green |
| FSRS recognize/listen/speak, migrations v0→v3, backup, Today, Practice, Vocabulary, SQLite repository, audio manifest, speech, writing, interaction, placement, checkpoints, capstone | all covered by the suites above — green |
| Web | static export succeeds (see sizes) |

## Before / after measurements

| Measure | SDK 56 (Phase 9) | SDK 57 | Δ |
|---|---|---|---|
| Web export directory | 28 MB | 28 MB | 0 |
| Largest web JS chunk | 4.0 MB | 4.1 MB | +~0.1 MB |
| Android Hermes bytecode (`expo export --platform android`) | 5,792,979 B | 5,763,725 B | −29,254 B |
| Web export duration (this sandbox) | n/a (not timed) | 70 s | — |
| Android export duration | n/a | 54 s | — |
| Startup / memory on device | not measurable here | not measurable here | — see release/NATIVE_ACCEPTANCE.md |
| Audio behaviour | unchanged code paths; `expo-audio` 57 plugin options reviewed (see permissions) | | |
| Speech behaviour | identical library code (57.0.0 ≡ 56.0.4) | | |

## Native project facts under SDK 57 (from `expo prebuild --no-install`)

| Item | Value |
|---|---|
| Android compileSdk / targetSdk / minSdk | **36 / 36 / 24** — from `react-native/gradle/libs.versions.toml` (`targetSdk = "36"`), read by Expo's root Gradle plugin; Expo's fallback of 35 applies only when the catalog is absent |
| Build tools / NDK / AGP / Kotlin | 36.0.0 / 27.1.12297006 / 8.12.0 / 2.1.20 |
| New Architecture / Hermes / edge-to-edge | enabled / enabled / enabled |
| `enableOnBackInvokedCallback` | `false` (from `predictiveBackGestureEnabled: false`) |
| iOS deployment target | 16.4 |
| iOS usage strings | microphone + speech recognition (authored, honest) |
| iOS `UIBackgroundModes` | `audio` — added by the expo-audio plugin default `enableBackgroundPlayback: true`; **not needed** (removed in the permissions gate) |
| Android foreground service | `expo.modules.audio.service.AudioControlsService` (`mediaPlayback`) + `FOREGROUND_SERVICE*` permissions — same plugin default; **not needed** (removed in the permissions gate) |
| App-level `PrivacyInfo.xcprivacy` | not generated; libraries ship their own (see release/PRIVACY_MANIFEST.md) |

## Acceptance

All Phase 0–9 behaviour preserved; no blocker found; the SDK-56 memory
regression is closed by a supported, current release line. Gate 0: PASS.

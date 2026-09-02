# Native acceptance record (Phase 10 §29-§34)

## Environment ceiling (stated up front)

This execution environment has **no physical iPhone, no physical Android
device, no Android SDK (dl.google.com is egress-blocked), and no Xcode**.
Nothing below is reported as device-tested. What could be done instead:

1. Native projects were generated with `expo prebuild` and inspected
   (manifest, Info.plist, privacy manifest, SDK levels).
2. Two dispatch-only GitHub Actions workflows compile the app on
   GitHub-hosted runners (which do have the SDKs): a release-configuration
   Android APK with the merged manifest and `targetSdkVersion` read from the
   artifact, and an unsigned iOS simulator build capturing the bundle's
   Info.plist and privacy manifests. Results are recorded in the "CI build
   results" section as the runs complete.
3. The jest-expo integration suites drive the real Expo Router tree with a
   controllable speech-provider double; the browser E2E drives the web tier.

## CI build results

| Build | Run | Result | Facts read from the artifact |
|---|---|---|---|
| Android release APK (debug-signed QA artifact) | `android-release-build.yml` run 33587735924 (#1) on `phase10/final-release` @ `2306eab9` | ✅ success — `assembleRelease` in 21 min 13 s, 868 Gradle tasks; gate step printed "targetSdk 36 confirmed; no removed permission present" | `aapt2 dump badging` matched `targetSdkVersion:'36'`; the permissions dump contains none of FOREGROUND_SERVICE / SYSTEM_ALERT_WINDOW / READ_EXTERNAL_STORAGE / WRITE_EXTERNAL_STORAGE; `app-release.apk` = 135,811,537 bytes (universal APK, all ABIs, debug-signed — not a store size; an AAB per-device download is far smaller); artifact `android-release-qa` (id 9831095473, 30-day retention) carries the APK, badging, permissions, manifest xmltree and merged manifest |
| iOS simulator (unsigned) | `ios-simulator-build.yml` run 33587737931 (#1) @ `2306eab9` | ✅ success — Xcode 26.6 / iPhoneSimulator 26.5 SDK, deployment target iOS 16.4, `** BUILD SUCCEEDED **` in 15 min; gate step passed (no `UIBackgroundModes`; `NSMicrophoneUsageDescription` and `NSSpeechRecognitionUsageDescription` present) | `LingoLessons.app` = 126 MB unsigned simulator bundle (fat arm64 + x86_64, Debug symbols, not a store size); privacy manifests found inside the bundle (the app-level `PrivacyInfo.xcprivacy` plus the React Native dependency bundles, e.g. `ReactNativeDependencies_glog.bundle/PrivacyInfo.xcprivacy`); bundle identifier `com.ahmet.lingo` (the inherited identity — see `RELEASE_IDENTITY.md`, still BLOCKED for store distribution); artifact `ios-simulator-report` (id 9830995525) carries `Info.plist`, `privacy-manifests.txt`, `size.txt` |

Both runs were dispatched manually (the workflows have no automatic
trigger) against the commit that introduced them; the content and rubric
changes that followed do not touch native configuration, so the facts above
hold for the release candidate. The Android run also executed the release
identity gate with `EAS_BUILD_PROFILE` unset (internal QA), which passed —
the same gate refuses any store profile while ownership is unconfirmed.

## Device outcome matrix (§31-§33)

Legend: PASS · FAIL · NOT TESTED · NOT APPLICABLE. Every row below is
**NOT TESTED** on hardware; the "automated coverage" column says what the
repository's own tests establish so the device tester knows what is
already known.

### iPhone (§31)

| Test | Device result | Automated coverage |
|---|---|---|
| Fresh install, launch, onboarding, French selection | NOT TESTED | E2E (web) + integration tests |
| PATH, lesson, TODAY, Practice, Vocabulary | NOT TESTED | integration + unit suites |
| SQLite lexicon opens from the bundled asset | NOT TESTED | native-loader unit tests (mocked), web fallback parity tests |
| Audio playback (clips, TTS fallback) | NOT TESTED | manifest/asset checks only |
| Speech permissions prompt (microphone + speech recognition strings) | NOT TESTED | strings verified in generated Info.plist |
| Speech recognition, on-device model behaviour, network-possible disclosure | NOT TESTED | capability probe + disclosure logic unit-tested with a provider double |
| Record / stop / rapid stop / stale callback | NOT TESTED | attempt machine + adapter tests (stale-callback guard) |
| Background / resume during a recording | NOT TESTED | AppState handling unit-tested (abort on background) |
| Bluetooth / headphones | NOT TESTED | — |
| Writing, interaction, checkpoint, A1 capstone | NOT TESTED | full engine + integration coverage |
| Backup export / import | NOT TESTED (share sheet, document picker) | backup-core suites, persona round trips |
| Termination / relaunch (hydration) | NOT TESTED | hydration gate tests |
| VoiceOver / Voice Control / Larger Text / Reduce Motion | NOT TESTED | `ACCESSIBILITY_AUDIT.md` code-level evidence |

### Android (§32)

| Test | Device result | Automated coverage |
|---|---|---|
| Android 16 / targetSdk 36 behaviour (predictive back opt-out, edge-to-edge) | NOT TESTED | manifest: `enableOnBackInvokedCallback=false`, `edgeToEdgeEnabled=true`; targetSdk from CI artifact |
| System back through modals and sessions | NOT TESTED | router-level tests only |
| Speech recognizer availability / offline French model / network-backed path | NOT TESTED | capability probe logic unit-tested |
| Permission denial / cannot-ask-again | NOT TESTED | blocked-panel + Settings link paths integration-tested with the double |
| Low-memory / background restoration | NOT TESTED | store hydration + no partial persistence by design |
| OEM speech differences | NOT TESTED | — |
| TalkBack / font scaling / touch targets | NOT TESTED | `ACCESSIBILITY_AUDIT.md` |

## Consequence for the product status (§34)

Until an owner runs the matrix on at least one real iPhone and one real
Android phone, the honest product state is:

**ENGINEERING COMPLETE · RELEASE CANDIDATE READY (CI artifacts) ·
PHYSICAL ACCEPTANCE OUTSTANDING.**

## How to run the matrix (owner)

1. Download the Android QA APK from the `android-release-qa` workflow
   artifact (debug-signed; sideload on a test device) — or build with EAS
   after Gate 1.
2. iOS needs signing: `eas build --profile development --platform ios`
   (internal distribution) after Gate 1, or a local Xcode run.
3. Walk each row above; record PASS/FAIL with device model and OS version;
   attach Xcode/Android Studio memory readings for the soak in
   `PERFORMANCE.md`.

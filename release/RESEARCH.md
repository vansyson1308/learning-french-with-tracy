# Phase 10 — Release research refresh (current official sources)

Date: 2026-09-02. Every claim below says where it came from. Where the
sandbox could not reach the authoritative page, that is stated rather than
papered over, and the item is flagged **VERIFY AT SUBMISSION** for the
release owner.

## 0. What this environment can and cannot reach

Probed with `curl` through the session proxy (HTTP status; `403 CONNECT`
means policy-blocked):

| Reachable | Blocked |
|---|---|
| `registry.npmjs.org` (package metadata + tarballs) | `expo.dev`, `docs.expo.dev` |
| `raw.githubusercontent.com` (raw files) | `github.com` HTML / `api.github.com` (403) |
| `developer.apple.com` (HTML shells; most doc bodies are JS-rendered and come back empty) | `reactnative.dev` |
| `developer.android.com` (full HTML) | `support.google.com`, `play.google.com` |
| `repo1.maven.org`, `services.gradle.org`, `plugins.gradle.org` | `dl.google.com`, `maven.google.com` (→ dl.google.com) |
| web search (snippets only) | `www.coe.int`, `rm.coe.int`, `www.ecml.at` |

Consequences: (a) Expo/RN facts were taken from the npm registry, package
tarballs (`bundledNativeModules.json`, templates) and `expo-doctor`, which
are the same inputs `expo install --fix` uses; (b) Apple doc bodies that did
not render were replaced by inspection of the shipped `PrivacyInfo.xcprivacy`
files and the App Store Connect definitions page that did render; (c) Council
of Europe texts could not be re-read here — the assessment dossier relies on
the repository's Phase 6–9 research files plus search-visible summaries, and
says so.

## 1. Expo SDK 56 → 57

### 1.1 Registry facts (npm, 2026-09-02)

| Package | `sdk-56` tag | `latest` | Notes |
|---|---|---|---|
| expo | 56.0.21 (2026-08-28) | **57.0.19** (2026-09-01) | 58 exists only as canary |
| react-native | — | 0.87.1 | `0.86-stable` = 0.86.3 (2026-08-24) |
| expo-audio | 56.0.13 | 57.0.4 | |
| expo-sqlite | 56.0.6 | 57.0.2 | |
| jest-expo | — | 57.0.5 | |
| react-native-reanimated | — | 4.6.0 | SDK 57 pairs 4.5.1 |
| react-native-worklets | — | 0.12.1 | SDK 57 pairs 0.10.1 |
| expo-speech-recognition | 56.0.4 (2026-08-28) | 57.0.0 (2026-08-30) | see §1.4 |

### 1.2 SDK 57 pairing (from `expo@57.0.19/bundledNativeModules.json`)

react-native 0.86.3 · react 19.2.3 · react-dom 19.2.3 · react-native-web
~0.21.0 · react-native-reanimated 4.5.1 · react-native-worklets 0.10.1 ·
react-native-gesture-handler ~2.32.0 · react-native-screens ~4.26.0 ·
react-native-safe-area-context ~5.7.0 · expo-audio ~57.0.4 · expo-sqlite
~57.0.2 · expo-router ~57.0.18 · expo-speech ~57.0.2 · expo-file-system
~57.0.6 · expo-dev-client ~57.0.17 · jest-expo ~57.0.5 · eslint-config-expo
~57.0.2 · @expo/ui ~57.0.15 · expo-image ~57.0.4 · expo-splash-screen
~57.0.8 · async-storage 2.2.0 (unchanged) · expo-speech-recognition not
bundled (third-party).

### 1.3 The Hermes V1 memory regression (the reason Gate 0 exists)

`expo-doctor` run on the SDK-56 tree in this session (verbatim):

> This project uses Hermes V1 with expo@56.0.11, which is affected by a known
> memory regression. Detected Hermes V1 250829098.0.10 from React Native.
> Hermes V1 250829098.0.15 and earlier are affected by this regression;
> 250829098.0.16 is the first version that contains the fix.
> Upgrade to Expo SDK 57 and expo@57.0.9 or later … Upgrade to React Native
> 0.86.2 or later, which includes the fixed Hermes version.

Search-visible summary of `expo.dev/changelog/sdk-57` (page itself blocked):
importing react-native-worklets or react-native-reanimated could increase
memory drastically under Hermes V1 shipped with RN 0.85; expo@57.0.9 moved to
RN 0.86.2 which resolves it; "Update on August 27th: expo@57.0.17 updates
React Native to 0.86.3". SDK 57's stated scope: RN 0.86 with React unchanged
at 19.2, "no user-facing breaking changes", edge-to-edge fixes on Android,
rendering/layout/animation fixes. Worklets "bundle mode" is an unsupported
workaround and is not used.

Decision input: the correct target is **expo 57.0.19 (RN 0.86.3, Hermes
≥ 250829098.0.16)** — not 57.0.0, which predates the fix. This is verified
after the upgrade by reading `hermes-compiler`'s version in the installed
tree and by re-running `expo-doctor`.

### 1.4 expo-speech-recognition 57.0.0 vs 56.0.4

Both tarballs were downloaded and compared: 62 files each; `sha256` over
`android/`, `ios/`, `src/`, `build/` is identical
(`d8796e43…3ae2a9`); the only difference is the `version` string in
`package.json`. The library's own `devDependencies` still declare `expo
~56.0.12`. Peer dependencies are `expo: *`, `react-native: *`.
Search-visible README: SDK 56 raised the iOS minimum from 13.4 to 16.4 (the
SDK 57 bare template's deployment target is also 16.4).

Decision: pin **57.0.0 exactly**. It is the maintainer's SDK-57 label for
the exact code already validated in Phases 8–9 (n-best finals, stop race
guard, on-device preference); there is no newer, safer code to pick. No
open-issue list could be read (github.com HTML blocked) — **VERIFY AT
SUBMISSION**: check the repository issues for iOS 26 / Android 16 reports
before the first store build.

### 1.5 Native project defaults (SDK 57 bare template 57.0.21, downloaded)

`gradle.properties`: `newArchEnabled=true`, `hermesEnabled=true`,
`edgeToEdgeEnabled=true`, `reactNativeArchitectures=armeabi-v7a,arm64-v8a,
x86,x86_64`. iOS deployment target 16.4. Compile/target SDK levels are
supplied by the React Native Gradle plugin and are read from the generated
project after `expo prebuild` (Gate 0 records the actual numbers).

### 1.6 expo-doctor peer-dependency finding

`expo-audio` requires `expo-asset` as a direct dependency; it is missing from
`package.json`. This is a real defect ("may crash outside of Expo Go") and is
fixed inside the SDK-57 upgrade commit with `expo install expo-asset`.

## 2. React Native 0.86

`0.86-stable` = 0.86.3 (2026-08-24); 0.87.1 is `latest` but is not the
Expo-paired version and is not adopted. reactnative.dev is blocked; the RN
0.84 announcement (search-visible) confirms Hermes V1 became the default in
0.84, and Software Mansion's write-up documents the worklets/reanimated
memory interaction. Nothing in 0.86 changes the app's public API surface
(SDK 57 "no breaking changes" claim; confirmed empirically by the Gate 0
regression run).

## 3. Apple

### 3.1 App Review Guidelines (developer.apple.com, rendered)

5.1.1(i), quoted: "All apps must include a link to their privacy policy in
the App Store Connect metadata field and within the app in an easily
accessible manner. The privacy policy must clearly and explicitly: Identify
what data, if any, the app/service collects, how it collects that data, and
all uses of that data … Explain its data retention/deletion policies and
describe how a user can revoke consent and/or request deletion of the user's
data." 5.1.1(ii): consent for collection; 5.1.1(iii): data minimisation.
2.3: metadata must "accurately reflect the app's core experience".

Implication: the app needs an in-app privacy policy surface (added in Phase
10) and a hosted URL for App Store Connect (external prerequisite — not
invented).

### 3.2 App Privacy details (developer.apple.com/app-store/app-privacy-details, rendered)

Quoted definition: "'Collect' refers to transmitting data off the device in
a way that allows you and/or your third-party partners to access it for a
period longer than what is necessary to service the transmitted request in
real time." And: "Data that is processed only on device is not 'collected'
and does not need to be disclosed in your answers." Third-party SDK
practices must be accounted for.

### 3.3 Privacy manifests / required-reason APIs

The documentation bodies did not render through the proxy. Phase 10 relies
on (a) inspecting every `PrivacyInfo.xcprivacy` shipped in `node_modules`
and the app manifest generated by `expo prebuild`, and (b) the reason codes
as documented by Apple prior to this session (UserDefaults `CA92.1`; file
timestamp `C617.1`/`DDA9.1`/`3B52.1`/`0A2A.1`; system boot time `35F9.1`;
disk space `E174.1`/`85F4.1`; active keyboards `3EC4.1`). **VERIFY AT
SUBMISSION**: run Xcode's privacy report on the archive.

### 3.4 Accessibility Nutrition Labels (App Store Connect help, rendered)

Nine features: VoiceOver, Voice Control, Larger Text ("200% or more"), Dark
Interface, Differentiate Without Color Alone, Sufficient Contrast, Reduced
Motion, Captions, Audio Descriptions. Criterion, quoted: "users must be able
to complete all of the common tasks of your app using that feature" —
primary functionality, first launch, login, purchase, settings. Labels are
self-declared and must be kept accurate. Phase 10 therefore claims nothing it
has not exercised (see `release/ACCESSIBILITY_AUDIT.md`).

### 3.5 TestFlight / upload

Not re-fetchable here (JS-rendered). Operational facts used: TestFlight
internal testing needs an App Store Connect app record the uploader owns;
uploads require a valid distribution certificate and provisioning profile
for the bundle identifier. All three are owner-held prerequisites (Gate 1).

## 4. Google Play / Android

### 4.1 Target API (developer.android.com/google/play/requirements/target-sdk, rendered)

Quoted, effective 2026-08-31: "New apps and app updates must target Android
16 (API level 36) or higher to be submitted to Google Play". "Existing apps
must target Android 15 (API level 35) or higher to remain available to new
users". Extension: "you'll be able to request an extension to November 1,
2026". Phase 10 verifies `targetSdkVersion` from the generated project and,
where a CI build is possible, from the built artifact.

### 4.2 Android 16 behaviour changes (rendered)

For apps targeting 36: predictive back animations on by default and
`onBackPressed`/`KEYCODE_BACK` no longer delivered (opt-out via
`android:enableOnBackInvokedCallback="false"`); edge-to-edge cannot be opted
out; local-network access needs `NEARBY_WIFI_DEVICES` (not used by this
app). The page does not list microphone/foreground-service changes.
`app.json` currently sets `predictiveBackGestureEnabled: false` — reviewed
in the native gate.

### 4.3 Data safety (developer.android.com/guide/topics/data/collect-share rendered; Play Console help blocked)

Rendered page: apps declaring `RECORD_AUDIO` must consider "Voice or sound
recordings" data types; "If a third-party SDK or library in your app collects
or shares user data, you must reflect this collection and sharing in the
Data safety form." Search-visible Play Console definition: processing
"ephemerally" means the data is only in memory and retained no longer than
necessary to service the request in real time; such off-device transfers are
entered in the form but not shown as collected. **VERIFY AT SUBMISSION**
against the live help article (blocked here).

### 4.4 Testing tracks

Internal testing / internal app sharing require a Play Console developer
account that owns the application ID — owner-held (Gate 1).

## 5. Council of Europe (CEFR)

Blocked domains: coe.int, rm.coe.int, ecml.at. Documents identified from
search results, with the repository's earlier research as the working text:

- *CEFR Companion Volume* (2020) — descriptor scales used for objective
  alignment (already cited per objective via `sourceRef` keys).
- *Manual for Language Test Development and Examining* (ALTE for the Council
  of Europe, 2011; revised edition announced) — test development cycle,
  specification, standardisation, validation.
- *Relating Language Examinations to the CEFR: A Manual* (2009) —
  familiarisation → specification → standardisation → empirical validation.

Search-visible statement used verbatim in the dossier: "it is not the role
of the Council of Europe to verify and validate the quality of the link
between language examinations and the CEFR's proficiency levels."

Terminology discipline adopted: the product performs **specification** (a
documented construct and blueprint) and **internal standardisation**
(deterministic scoring rules and authored attainment policy); it has
performed **no empirical validation** (no learner population, no item
statistics, no standard setting). The wording "CEFR-aligned estimate" is the
strongest claim the evidence supports.

## 6. Native build feasibility in this environment

- `dl.google.com` (Android SDK, NDK, Google Maven) is blocked.
- Maven Central carries only AGP ≤ 2.3.0 and no `aapt2`/`r8`/`androidx`
  (probed: 404).
- No Xcode.

Therefore no local Android/iOS compile is possible. GitHub-hosted runners
(`ubuntu-latest`, and `macos-latest` for public repositories at no cost)
have the SDKs; Phase 10 uses a dispatch-only workflow, as Phases 5A/7 did for
data and audio, to build a release-configuration APK and to dump the merged
manifest and `targetSdkVersion` from the real artifact. No store upload of
any kind is performed by that workflow.

## 7. Decisions taken from this research

1. Upgrade to expo 57.0.19 / RN 0.86.3 via `expo install --fix`; add the
   missing `expo-asset`; verify Hermes ≥ 250829098.0.16; re-run
   `expo-doctor`.
2. Pin `expo-speech-recognition@57.0.0` (identical code to the validated
   56.0.4).
3. Add an in-app privacy policy screen fed by `release/PRIVACY_POLICY.md`
   content; the hosted URL is an owner task.
4. Verify `targetSdkVersion = 36` from the generated project and CI artifact.
5. Claim no Accessibility Nutrition Label without common-task evidence.
6. Keep the assessment dossier at "specification + internal
   standardisation; no empirical validation".

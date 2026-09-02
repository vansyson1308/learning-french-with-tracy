# Release-candidate artifacts (Phase 10 §67-§69)

No public release was made and no release tag was created: the store
identity the repository carries (`com.ahmet.lingo`, EAS project
`c5e5ee9a…`, ASC app `6781818623`, owner `ahmet909`) is not proven to be
this fork's (`RELEASE_IDENTITY.md`), and a tag tied to an identity or
version the owner does not control would be a false promise. Everything
below is the strongest artifact that could be produced honestly from this
environment, plus the exact commands for the steps that need the owner's
prerequisites.

## What exists today

| Artifact | Where | Built from | Facts | Expires |
|---|---|---|---|---|
| Android release APK (debug-signed QA build) | GitHub Actions artifact `android-release-qa`, id `9831095473`, run 33587735924 | `phase10/final-release` @ `2306eab9` (native configuration unchanged since) | `targetSdkVersion 36`, permissions RECORD_AUDIO + MODIFY_AUDIO_SETTINGS + INTERNET + VIBRATE, none of the removed permissions; universal APK 135,811,537 bytes; artifact zip SHA-256 `2db58ea57f30a4e252d1f275d60be573817e81ce18824f2b06818a9b8ef71eb5` | 30 days after 2026-09-02 (re-dispatch the workflow to rebuild) |
| iOS simulator bundle report | artifact `ios-simulator-report`, id `9830995525`, run 33587737931 | same commit | `Info.plist` (no `UIBackgroundModes`, both usage strings), `privacy-manifests.txt`, 126 MB unsigned fat simulator bundle; zip SHA-256 `fb5e27bbc17027b0c94e6d7cf8157411aa3a7e49e8a7eba50ec866ff96592ede` | 30 days |
| Web static export | produced on demand: `bunx expo export --platform web --output-dir <dir>`; served by `python3 e2e/serve-static.py <dir>` and exercised by `bun run e2e:web <dir>` | any commit | 28 MB export, 12/12 browser checks | n/a |
| Hermes bytecode size probe | `PERFORMANCE.md` | | 5,763,725 bytes (SDK 57) | n/a |

The QA APK is **not installable as an update over a store build** (debug
signing) and is not a Play artifact (universal APK, not an AAB). It is the
right artifact for sideload acceptance on a test device and for reading the
merged manifest — nothing more.

## Rebuilding the artifacts

Both native workflows are dispatch-only (no automatic trigger, no
secrets, no store upload). From the GitHub UI or the API:

```text
Actions → "Android release build (QA artifact)" → Run workflow → ref: phase10/final-release
Actions → "iOS simulator build (compile check)" → Run workflow → ref: phase10/final-release
```

Equivalent local commands (need the Android SDK / Xcode, which this
environment does not have):

```bash
bun install --frozen-lockfile
bun run release:identity                          # must print BLOCKED for store profiles until Gate 1
bunx expo prebuild --platform android --clean
(cd android && ./gradlew :app:assembleRelease)    # debug-signed unless a release keystore is configured
bunx expo prebuild --platform ios --clean
(cd ios && xcodebuild -workspace LingoLessons.xcworkspace -scheme LingoLessons \
   -configuration Release -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
   CODE_SIGNING_ALLOWED=NO build)
```

## The store path (blocked on the owner's prerequisites)

Prerequisites, in order — none can be supplied from this repository:

1. **Identity decision** (`RELEASE_IDENTITY.md`, Option A or B) recorded in
   `release/identity.json` with `ownership.status: "confirmed"`,
   `confirmedBy`, `confirmedOn`, evidence, and `storeDistribution:
   "allowed"`. Until then `bun run release:identity` and the EAS
   `eas-build-pre-install` hook refuse every store-distribution profile,
   by design.
2. **Accounts and credentials**: Apple Developer Program membership with a
   distribution certificate and an App Store provisioning profile for the
   chosen bundle id; a Google Play developer account with an upload key (or
   Play App Signing) for the chosen package name; an EAS account that owns
   the chosen `projectId` (Option B needs a fresh `eas init`).
3. **Store metadata**: the hosted privacy-policy URL and a support contact
   (`APP_PRIVACY.md`, `DATA_SAFETY.md`, `STORE_METADATA.md`), screenshots
   from the release build.

Once 1-2 exist:

```bash
# authenticate once
npx eas-cli login
npx eas-cli whoami

# internal test builds (TestFlight internal / Play internal testing)
npx eas-cli build --profile production --platform ios      # pre-install hook re-runs the identity gate
npx eas-cli build --profile production --platform android  # AAB; Play requires targetSdk 36 — verified in CI

# submit to the internal tracks only (never a public release from this program)
npx eas-cli submit --platform ios --profile production      # uses submit.production.ios.ascAppId
npx eas-cli submit --platform android --profile production  # requires a Play service-account key
```

`eas.json` keeps `appVersionSource: remote` with `autoIncrement: true`, so
build numbers are allocated by EAS for the confirmed project; `expo.version`
stays 1.1.0 in `app.json` until the owner sets the release version
(`RELEASE_IDENTITY.md`, version audit).

For a local, EAS-free path the owner can instead run the two `prebuild`
commands above and sign in Android Studio / Xcode with their own
credentials; nothing in the app depends on EAS at runtime.

## Tagging policy

A release-candidate tag is **proposed, not created**: `v1.1.0-rc.1` on the
merge commit of the Phase-10 pull request, to be created by the owner only
after step 1 above, so the tag names a version the owner actually
controls. Creating it earlier would freeze a version/identity pair that may
never ship.

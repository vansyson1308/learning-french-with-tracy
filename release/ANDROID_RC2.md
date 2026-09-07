# Android RC2 — first release candidate under the permanent identity

**RC2 status: NOT BUILT YET — waiting for one owner action (gate G1 below).**
Everything the repository can do on its own for RC2 is done and recorded
here; the build itself needs the owner's Expo account.

RC1 (`RC_HISTORY.md`) stays what it was: an engineering candidate under the
inherited identity. RC2 is the first candidate under
`com.vansyson1308.learningfrenchwithtracy`, version 1.0.0, versionCode 1.
Any app change after device testing produces RC3, RC4, … — a tag or hash is
never reused for changed bytes.

## 1. Identity applied (Part I)

| Item | Value |
|---|---|
| Migration | `bun scripts/apply-identity.ts migrate …` (dry run reviewed first, then applied; `PUBLISHING_RUNBOOK.md` B2) |
| `expo.name` / `slug` / `scheme` | Learning French with Tracy / `learning-french-with-tracy` / `learningfrenchtracy` |
| iOS bundle id / Android package | `com.vansyson1308.learningfrenchwithtracy` |
| Version / iOS build / Android versionCode | 1.0.0 / 1 / 1 (`appVersionSource: local`) |
| Removed | upstream Expo owner `ahmet909`, EAS project `c5e5ee9a…`, App Store Connect id `6781818623`, `com.ahmet.lingo` |
| `release/identity.json` | ownership **confirmed** (project owner, 2026-09-08); `storeDistribution` **blocked** until the store accounts exist |
| Stale-reference audit | every remaining mention of the upstream identity is lineage/attribution (README, site, Licenses screen, ATTRIBUTIONS), a historical release record (banner added to `RELEASE_IDENTITY.md`, `STORE_METADATA.md`), a refusal guard (`android-direct-apk.yml`) or a test fixture; the upstream store-metadata drafts (`metadata/`, `store.config.example.json`) were rewritten to the v1 listing |
| Support email | `duymank250997@gmail.com` (provisional) in `release/support-contact.json` → website support and privacy pages, store metadata drafts, user guide §36, beta guide, runbook, privacy/data-safety records |

## 2. Prebuild identity verification (Part II §7)

`npx expo prebuild --platform android --no-install` on the migrated
configuration; generated project inspected and then deleted (CNG — `/android`
is git-ignored and never committed; the `expo run:*` script edits prebuild
makes to package.json were reverted).

| Fact | Generated value | Expected | Result |
|---|---|---|---|
| `applicationId` / `namespace` | `com.vansyson1308.learningfrenchwithtracy` | same | PASS |
| `versionName` / `versionCode` | `1.0.0` / `1` | same | PASS |
| `targetSdkVersion` / `compileSdk` / `minSdk` | 36 / 36 / 24 (React Native 0.86 `libs.versions.toml`) | 36+ (Google Play requirement at mandate time) | PASS |
| Permissions | `INTERNET`, `MODIFY_AUDIO_SETTINGS`, `RECORD_AUDIO`, `VIBRATE`; `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `SYSTEM_ALERT_WINDOW` removed with `tools:node="remove"` | only the expected final set | PASS |
| App label | `Learning French with Tracy` | same | PASS |
| URL schemes | `learningfrenchtracy`, `exp+learning-french-with-tracy` | scheme applied | PASS |
| Inherited identifiers in the native project | none (`grep` for `com.ahmet`, `c5e5ee9a`, `ahmet909`, `Lingo` in gradle/xml/java/kt/properties: 0 hits) | none | PASS |

## 3. Gate G1 — the owner's EAS project (Part III)

`eas whoami` in the automation environment answers **Not logged in**, and no
token exists there (none may be committed). Two routes; either one unblocks
the build. Route B lets the repository drive every later RC itself.

### Route A — on your own computer (interactive, ~5 minutes)

1. Open a terminal in a clone of the repository on branch
   `release/android-v1-device-acceptance` (or `main` after it merges).
2. Run `npx eas-cli@23.2.0 login` and complete the Expo sign-in.
3. Run `npx eas-cli@23.2.0 whoami` — note the username it prints.
4. Run `npx eas-cli@23.2.0 init --account <that username>` — accept creating
   `@<username>/learning-french-with-tracy`; it writes
   `extra.eas.projectId` into `app.json`.
5. Run `npx eas-cli@23.2.0 build --platform android --profile preview` —
   answer **yes** to "Generate a new Android Keystore?" (the app's permanent
   signing key, kept by EAS), then wait for the build page URL.

Send back: the Expo username, the project id from `app.json`, and the build
page URL. Never send the password, a token, or the keystore.

### Route B — let the repository build (non-interactive)

1. On expo.dev → Account settings → **Access tokens** → create a token
   named `learning-french-with-tracy-ci`.
2. On GitHub → repository **Settings → Secrets and variables → Actions →
   New repository secret**: name `EXPO_TOKEN`, value = the token. (It is
   never printed and never enters git.)
3. On GitHub → **Actions → "EAS build (Android RC)" → Run workflow**:
   branch `release/android-v1-device-acceptance`, profile `preview`,
   `init_account` = your Expo username, `wait` = true.
4. Reply "dispatched" — the workflow creates the project, records its id in
   the branch, builds RC2, downloads the APK, verifies package / version /
   targetSdk / permissions / signature, and attaches it with its SHA-256.

## 4. Build record (filled when RC2 exists)

| Field | Value |
|---|---|
| Expo account / project id | pending G1 |
| EAS build id | pending |
| Build page URL | pending |
| APK artifact URL (EAS, expires per EAS policy — internal builds are shareable links; kept out of the public website) | pending |
| GitHub artifact | `android-rc-preview` from the `eas-build.yml` run (90-day retention), when built by Route B |
| Commit built | pending (the exact commit; tag `v1.0.0-rc.2` targets it) |
| APK SHA-256 / size | pending |
| Package / versionName / versionCode / targetSdk | must read `com.vansyson1308.learningfrenchwithtracy` / `1.0.0` / `1` / `36` |
| Permissions | must read the Part II §7 set only |
| Signature | `apksigner verify` must report *Verifies*; signer certificate SHA-256 recorded in `ANDROID_SIGNING.md` |
| Debuggable | `preview` is a release-configuration build (`developmentClient: false`); `aapt2 dump badging` must not print `application-debuggable` — recorded exactly as observed |
| Created | pending |

## 5. Install on the phone

```
adb install app.apk
```

A first install shows Android's "install unknown apps" prompt for
sideloads. A later RC signed with the same EAS key installs over it with
`adb install -r app.apk`; a build signed with a different key (for example a
future Play build) requires uninstalling first (`ANDROID_SIGNING.md`).

## 6. Tag

`v1.0.0-rc.2` is created only on the commit that produced the APK, after
the automated gates pass on it. The automation credential cannot push tags
(HTTP 403 on `refs/tags`, `RC_HISTORY.md`), so the owner runs, once the
commit is known:

```
git tag -a v1.0.0-rc.2 <commit> -m "v1.0.0-rc.2 — RC2, first build under the permanent identity"
git push origin v1.0.0-rc.2
```

Until then RC2 is **not** called tagged.

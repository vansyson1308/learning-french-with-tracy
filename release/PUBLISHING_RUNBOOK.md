# Publishing runbook — A to Z (Part XIV)

One ordered list from "engineering complete" to "live", with the exact
commands, the gate that must be green before each step, and who acts (the
repository, the owner). Nothing here presses a public production button;
that step is the owner's alone (Part XV).

Conventions: `OWNER` = a human action or credential; `REPO` = a command or
workflow that runs from this repository; every step names the document
that carries its evidence.

## A. Baseline

| Step | Who | Command / evidence |
|---|---|---|
| A1. Main is green and the release branch merges cleanly | REPO | CI on `main`; PR #18 |
| A2. Content, audio and drift guards pass | REPO | `bun run test`, `bun scripts/validate-content.ts`, `bun scripts/check-audio.ts` |
| A3. Audio provenance closed | REPO | `AUDIO_PROVENANCE_FINAL.md` — every shipped clip synthesized by the pinned pipeline, no class-D file left |

## B. Identity (immutable once claimed)

| Step | Who | Command / evidence |
|---|---|---|
| B1. Confirm the identifier set ONCE | OWNER | **DONE 2026-09-08** — display name Learning French with Tracy, iOS bundle id and Android package `com.vansyson1308.learningfrenchwithtracy`, Expo slug `learning-french-with-tracy`, URL scheme `learningfrenchtracy` |
| B2. Apply the migration | REPO | **DONE** — `bun scripts/apply-identity.ts migrate --name "Learning French with Tracy" --slug learning-french-with-tracy --scheme learningfrenchtracy --ios com.vansyson1308.learningfrenchwithtracy --android com.vansyson1308.learningfrenchwithtracy --confirmed-by "project owner" --confirmed-on 2026-09-08 --evidence "…"` (dry run reviewed first; rewrote app.json/eas.json, reset version to 1.0.0 build 1, recorded `release/identity.json`, removed the upstream Expo owner, EAS project id and ASC id) |
| B3. Store records | OWNER | create the App Store Connect app and the Play Console app with the SAME identifiers (`APPLE_ACCOUNT_SETUP.md`, `GOOGLE_PLAY_ACCOUNT_SETUP.md`) — a bundle id/package cannot be changed after upload |

## C. Accounts and fees (never paid from here)

| Step | Who | Evidence |
|---|---|---|
| C1. Apple Developer Program (individual) enrolled and active | OWNER | `APPLE_ACCOUNT_SETUP.md` |
| C2. Google Play Console personal developer account verified | OWNER | `GOOGLE_PLAY_ACCOUNT_SETUP.md` |
| C3. Expo account for EAS (free tier is enough for v1 volumes) | OWNER | `eas whoami` on the owner's machine (the automation environment is not logged in and holds no token) |

## D. Build service and signing

| Step | Who | Command / evidence |
|---|---|---|
| D1. Create the EAS project under the owner's account | OWNER | Route A (owner's machine): `npx eas-cli login`, then `npx eas-cli init --account <expo-username>` in the repository — it writes `extra.eas.projectId` into app.json; run `bun scripts/apply-identity.ts link --eas-project-id <uuid> --evidence "…"` (no `--allow-store` until Play exists) and commit. Route B (automation): store a personal access token from expo.dev as the `EXPO_TOKEN` **repository secret** (never in git) and dispatch `eas-build.yml` with `init: true`, which runs `eas init --account <username> --non-interactive`; the workflow prints the id and the same `link` command is run afterwards. Both routes: `ANDROID_RC2.md` |
| D2. Version source | REPO | eas.json `appVersionSource: local` (set by B2); build numbers move only through `bun run release:bump` (`VERSIONING.md`) |
| D3. iOS signing | OWNER | let EAS manage the distribution certificate and provisioning profile (`eas credentials` → iOS → managed); nothing is stored in the repo |
| D4. Android signing key | OWNER / EAS | For the internal RC line (`preview` profile) EAS generates and stores the keystore on the first build (`eas build` interactively asks "Generate a new Android Keystore?" → yes; in `--non-interactive` mode EAS CLI generates it automatically). That keystore is the app's signing identity for every later RC (`ANDROID_SIGNING.md`: fingerprint recorded, never rotated casually). For Play: **Play App Signing** with this same keystore as the upload key is the recommended path; a self-held key is optional (`keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`, backed up offline, uploaded to EAS credentials) — `.gitignore` already excludes `*.jks`, `*.p8`, `*.p12`, `*.key` |
| D5. Direct-APK signing key (optional, Part X) | OWNER | a second long-lived key for GitHub Releases APKs, created and kept on the owner's machine, added as the `ANDROID_RELEASE_KEYSTORE_BASE64` / `…_PASSWORD` / `…_KEY_ALIAS` / `…_KEY_PASSWORD` repository secrets; the release workflow reads secrets only, never a file in the tree |

## E. Release candidate

| Step | Who | Command / evidence |
|---|---|---|
| E1. Cut the RC commit | REPO | tag `v1.0.0-rc.N` on the release branch head; `RC_HISTORY.md` gets a row: commit, tag, `expo.version`, build number, artifacts and their SHA-256 |
| E2. Web tier proof | REPO | `bunx expo export --platform web --output-dir dist && bun run e2e:web dist && bun run e2e:guide dist` (CI runs both) |
| E3. Android QA artifact | REPO | dispatch `android-release-build.yml` (debug-signed QA APK; permissions and targetSdk 36 verified from the artifact) |
| E4. Internal RC build (Android, permanent identity) | OWNER / REPO | `npx eas-cli build --platform android --profile preview` (internal distribution, direct-install APK, EAS-managed keystore) — or dispatch `eas-build.yml` once `EXPO_TOKEN` is a repository secret. Store builds (`--profile production`, app bundle) stay refused by the identity gate until `storeDistribution` is `allowed`. Record build id, artifact URL, SHA-256, size, certificate fingerprint in `ANDROID_RC2.md` / `RC_HISTORY.md` |
| E5. Device acceptance on this RC | OWNER (+ testers) | `DEVICE_ACCEPTANCE.md` matrices; `SOAK_REPORT.md` device blocks; `ACCESSIBILITY_FINAL.md` rows — DEVICE ACCEPTED requires zero open P0/P1 |
| E6. Any fix → new RC | REPO | fix, `bun run release:bump`, tag `rc.N+1`, repeat E2–E5 for the affected rows |

## F. Store metadata

| Step | Who | Evidence |
|---|---|---|
| F1. Website live | REPO/OWNER | Pages was enabled by the owner on 2026-09-08 (Settings → Pages → Source: GitHub Actions); `pages.yml` deploys on every push to `main` that touches the site sources. Verify from outside the automation sandbox (which cannot reach github.io): `curl -sI https://vansyson1308.github.io/learning-french-with-tracy/privacy/` → 200; the deployment is also visible in the repository's Deployments (environment `github-pages`) |
| F2. Listings | OWNER | `STORE_METADATA_FINAL.md` copied field by field; support email `duymank250997@gmail.com` is already filled in; still owner-supplied: support phone, seller name, copyright line |
| F3. Screenshots | OWNER | `SCREENSHOT_MANIFEST.md` from the FINAL RC build; record the build number on each set |
| F4. Privacy declarations | OWNER | `PRIVACY_FINAL.md`: App Privacy = Data Not Collected; Play Data safety per the recorded answers; Ads = No; content rating questionnaires; target audience 13+ |
| F5. Review information | OWNER | reviewer notes from `PRIVACY_FINAL.md` (no login; speech uses the OS service; how to reach each feature) |

## G. Testing tracks

| Step | Who | Command / evidence |
|---|---|---|
| G1. iOS TestFlight | OWNER | `bunx eas submit --platform ios --latest` (App Store Connect API key or app-specific password entered on the owner's machine); internal testers first, external group after Apple's beta review |
| G2. Android internal testing | OWNER | `bunx eas submit --platform android --latest` (service-account JSON kept on the owner's machine) — first upload goes to the internal track |
| G3. Android closed test (personal accounts) | OWNER | `ANDROID_CLOSED_TEST_PLAN.md`: ≥ 12 testers opted in for 14 consecutive days (recruit 15–20 via `docs/BETA_TESTER_GUIDE.md`); then apply for production access in the console and answer its questionnaire |
| G4. Beta feedback loop | REPO | issues via the templates; P0/P1 → fix → E6 |

## H. Submission (owner-consequential)

| Step | Who | Evidence |
|---|---|---|
| H1. Final RC exit gate | REPO | `RC_HISTORY.md` marks the RC FINAL: CI green, guide walk green, DEVICE ACCEPTED, no open P0/P1, listings complete, website 200 |
| H2. Submit for App Review | OWNER | App Store Connect → the version → Add build → Submit for Review (release option: **Manually release this version**) |
| H3. Submit to Play production | OWNER | Play Console → Production → create release from the tested bundle → review → **do not roll out** until H5 |
| H4. Review responses | OWNER/REPO | Part XVI: answer only with facts from this repository; a required change → E6 |
| H5. **Public production release** | OWNER ONLY | press Release (App Store) / Roll out (Play). This program never performs H5. |

## I. After release

| Step | Who | Evidence |
|---|---|---|
| I1. Verify the live listings, the privacy link, the install on a clean device | OWNER | screenshots into `PUBLICATION_STATUS.md` |
| I2. Monitor | OWNER | App Store Connect crashes / Play vitals (platform-side, no SDK in the app); GitHub Issues |
| I3. Hotfix | REPO/OWNER | fix on a branch → CI → `release:bump` → E4 → the affected DEVICE rows → G1/G2 → H2/H3 with a phased rollout |
| I4. Tag | REPO | `v1.0.0` on the exact commit that went live; `RC_HISTORY.md` closes the RC |

## J. Direct APK via GitHub Releases (optional, Part X)

Only after B (identity fixed) and D5 (owner-controlled key as secrets):
`android-release-build.yml` gains a signing step that reads the secrets;
the resulting universal APK is attached to a GitHub Release tagged with
the RC tag, together with its SHA-256 and the install caveat text from
`docs/USER_GUIDE.md` §2. Never a debug-signed build, never a key from the
runner.

## Never

- Never commit or print an Expo token, an App Store Connect key, a Play
  service-account JSON, or a keystore. Secrets live in the owner's
  machine keychain or in repository secrets.
- Never create the long-lived signing key in an ephemeral environment.
- Never register a bundle id/package before B1.
- Never press H5 from this program.

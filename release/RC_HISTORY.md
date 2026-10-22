# Release-candidate history (Part XII)

Ledger of every release candidate: what was built, from which commit,
with which hashes, and what happened to it. An RC is cut only from the
release branch (or `main` after merge) with CI green; it is superseded by
the next RC, never edited. The FINAL RC is the one whose exit gate below
is fully satisfied; it becomes `v1.0.0`.

## Rules

- **Tag** `v1.0.0-rc.N` on the exact commit; the commit SHA is the
  identity of the RC, the tag is its name.
- **Versions**: `expo.version` stays `1.0.0` across RCs; every store build
  carries a new build number / versionCode (`bun run release:bump`), never
  reused (`VERSIONING.md`).
- **Hashes**: SHA-256 of every artifact that leaves the repository (EAS
  build artifacts as shown on the build page, the GitHub Actions QA APK
  artifact zip, the web export's entry bundle). The store binaries'
  hashes come from the EAS build page; the direct APK's from
  `sha256sum` before it is attached to a GitHub Release.
- **Evidence per RC**: CI run id (green), guide-walk result, device
  acceptance rows run on it, open findings with severity.

## Final RC exit gate (all must hold on the same commit)

1. CI green on the commit (unit, content, audio, drift, export, browser
   E2E, guide walk).
2. `DEVICE_ACCEPTANCE.md`: DEVICE ACCEPTED on both platforms for this
   build number; zero open P0/P1; P2s fixed or accepted with a reason.
3. `ACCESSIBILITY_FINAL.md` rows A1–A15 recorded.
4. `SOAK_REPORT.md` device blocks recorded.
5. Listings complete (`STORE_METADATA_FINAL.md`), screenshots from this
   build (`SCREENSHOT_MANIFEST.md`), privacy declarations entered
   (`PRIVACY_FINAL.md`), website privacy URL returns 200.
6. Identity confirmed and linked; store distribution ALLOWED
   (`release/identity.json`).

## Ledger

| RC | Commit | Tag | Version / build | Artifacts (SHA-256) | CI | Guide walk | Device acceptance | Outcome |
|---|---|---|---|---|---|---|---|---|
| RC1 | `4fb6cebb094548117c4e6cb2acc998a9f15de9a1` (release branch head after the reception-audio run; every later commit on the branch touches only release records and one test pin — no app source, content or asset changes, verified with `git diff --stat`) | `v1.0.0-rc.1` — annotated tag prepared; the push was refused to the automation credential (`git push` → HTTP 403 on `refs/tags/v1.0.0-rc.1`, branch pushes succeed), so the owner pushes it: `git tag -a v1.0.0-rc.1 4fb6cebb094548117c4e6cb2acc998a9f15de9a1 -m "v1.0.0-rc.1 — RC1, engineering candidate" && git push origin v1.0.0-rc.1` | 1.1.0 inherited / no build number yet — the identity migration resets to 1.0.0 / build 1 and yields RC2 | web export entry bundle `entry-4f1909b2f84fd4eb929ff03afa98240e.js` (4,194,333 bytes) SHA-256 `d5434685dc6b40870d3ee4edad79471420fa48b9117f0f000384fe9789821f37`; QA APK: `android-release-build.yml` run 33660049388 (dispatched on `07f1b50`, which differs from `4fb6ceb` only in release records — identical app sources): `app-release.apk` 125,209,226 bytes (universal, debug-signed), `targetSdkVersion 36` confirmed, no removed permission present; artifact `android-release-qa` id 9859191410, zip 64,233,638 bytes, SHA-256 `db799a2b57b5b504b7d87313e9baa015186800a798c4ea1cf1d92f167bec15d3` (retained until 2026-10-02; re-dispatch to rebuild); EAS store builds: blocked until the owner's EAS project exists | CI green on the branch (runs 33663191403 and 33663196628 on the merged head `19e985e`) and on `main` after the merge (`eaeb604`, run 33663402877 = success); audio provenance CLOSED | 30 pass · 0 fail · 5 device-only · 3 test-backed | not started (no store build; needs identity + accounts) | open — engineering candidate; superseded by RC2 after `apply-identity.ts migrate` |
| RC2 | head of `release/android-v1-device-acceptance` at build time (the identity migration commit and its records; the exact SHA is written into `ANDROID_RC2.md` §4 when the build exists) | `v1.0.0-rc.2` — only on the built commit, pushed by the owner (automation cannot push tags) | **1.0.0 / build 1 / versionCode 1** under `com.vansyson1308.learningfrenchwithtracy` (`appVersionSource: local`) | EAS `preview` profile (internal distribution, APK, EAS-managed keystore): build id, APK URL, SHA-256, size, signer fingerprint recorded in `ANDROID_RC2.md` / `ANDROID_SIGNING.md` when built | full regression green on the migrated configuration (typecheck, lint, 1,184 unit tests in 5 time zones, 69 integration tests, content/audio/drift checks, export, browser E2E); CI run ids in the PR | 30 pass · 0 fail · 5 device-only · 3 test-backed | emulator smoke PASS on the same sources (run 34169308900, `ANDROID_RC2.md` §2b); phone packets ready (`ANDROID_DEVICE_ACCEPTANCE_PACKETS.md`); phone acceptance not started — needs the signed APK on a phone | open — **NOT BUILT: waiting for the owner's EAS project (gate G1)**; first candidate under the permanent identity |
| RC3 | `e5dcfd015c407bf445afae9d517661f367934104` (`phase-0/rc3-local-apk`: `94413f7` P0 small fixes on top of `main` `7f85d32` — Windows audio check, onboarding default fr-en, course guards, lesson option shuffle, licence doc — plus `e5dcfd0` blocking the library-merged `ACCESS_NETWORK_STATE` / `WAKE_LOCK` permissions found on the first local build; no French content change) | `v1.0.0-rc.3` — pushed by the owner after CI is green on the merged commit | **1.0.0 / build 1 / versionCode 1** (not bumped: no device test has happened yet; the next RC after device findings bumps via `bun run release:bump`) | **local Windows build** (`expo prebuild` + `gradlew :app:assembleRelease`, JDK 17, SDK 36 / NDK 27.1, signed with the owner-held `lft-upload.jks`): unsigned `app-release.apk` 125,210,674 bytes SHA-256 `ed112417b0ffb6b6fb0a424a7325409b91d92655c6fb552602e2d10b4330164e`; **signed** `out\learning-french-with-tracy-v1.0.0-rc.3.apk` 125,390,101 bytes SHA-256 `579a39062ef06d9c8bb0669465f610ad9e46cfebe109988365a6819600137a9f`, `apksigner verify` Verifies (v2 + v3), signer SHA-256 `d280d1de…3182` (`ANDROID_SIGNING.md`) | all local gates green on the commit (typecheck, lint, 1,202 bun tests, 69 jest, content:check, audio:check, release:identity); GitHub CI pending the owner's push | not re-run (web export unchanged by P0) | **pending** — signed APK exists; no phone connected yet; packets 0–3 ready (`ANDROID_RC3.md` §4) | open — first locally built, owner-signed candidate; supersedes the RC2 EAS route for now |
| RC4 | `3ff3b96` (`release/rc4`: `main` `4a0bc7e` after PR #40 + the build bump) | `v1.0.0-rc.4` — pushed by the owner after the device checklist passes | **1.0.0 / build 2 / versionCode 2** (`bun run release:bump`) | local Windows build: unsigned `app-release.apk` 133,664,309 bytes SHA-256 `79abde99bb8753424e2054fb8f20d39c4b623424aaf0b26a19c884dd7471fbc3`; per-ABI ≈ 67.2 (arm64) / 60.0 (v7a) / 68.5 (x86) / 68.7 (x86_64) MB; signed APK pending the owner (`ANDROID_RC4.md` §3) | local gates green on the commit (typecheck, 1,538 bun tests, content/audio checks, identity); CI green on PR #40 | not re-run | **pending** — upgrade over RC3 + 15-minute checklist (`ANDROID_RC4.md` §4) | open — first device candidate since RC3 |

## Notes

- The Phase 10 QA artifacts (debug-signed APK, iOS simulator report) in
  `RC_ARTIFACTS.md` predate this program and are not RCs: they carry the
  inherited identity and the untraceable audio, and were superseded by the
  provenance-clean regeneration.

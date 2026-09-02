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
| RC1 | `4fb6cebb094548117c4e6cb2acc998a9f15de9a1` (release branch head after the reception-audio run; later commits are release records only) | `v1.0.0-rc.1` (tagged after merge) | 1.1.0 inherited / no build number yet — the identity migration resets to 1.0.0 / build 1 and yields RC2 | web export entry bundle `entry-4f1909b2f84fd4eb929ff03afa98240e.js` (4,194,333 bytes) SHA-256 `d5434685dc6b40870d3ee4edad79471420fa48b9117f0f000384fe9789821f37`; QA APK: `android-release-build.yml` run 33660049388 (dispatched on `07f1b50`, which differs from `4fb6ceb` only in release records — identical app sources): `app-release.apk` 125,209,226 bytes (universal, debug-signed), `targetSdkVersion 36` confirmed, no removed permission present; artifact `android-release-qa` id 9859191410, zip 64,233,638 bytes, SHA-256 `db799a2b57b5b504b7d87313e9baa015186800a798c4ea1cf1d92f167bec15d3` (retained until 2026-10-02; re-dispatch to rebuild); EAS store builds: blocked until the owner's EAS project exists | CI green on the branch (run ids in `PUBLICATION_STATUS.md`); audio provenance CLOSED | 30 pass · 0 fail · 5 device-only · 3 test-backed | not started (no store build; needs identity + accounts) | open — engineering candidate; superseded by RC2 after `apply-identity.ts migrate` |

## Notes

- The Phase 10 QA artifacts (debug-signed APK, iOS simulator report) in
  `RC_ARTIFACTS.md` predate this program and are not RCs: they carry the
  inherited identity and the untraceable audio, and were superseded by the
  provenance-clean regeneration.

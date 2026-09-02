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
| RC1 | _cut after the regenerated audio lands on the release branch_ | `v1.0.0-rc.1` | 1.0.0 / build 1 (after the identity migration) | web export bundle: _fill_; QA APK artifact zip: _fill_; EAS builds: _blocked until the owner's EAS project exists_ | _run id_ | _pass count_ | _not started_ | _open_ |

## Notes

- The Phase 10 QA artifacts (debug-signed APK, iOS simulator report) in
  `RC_ARTIFACTS.md` predate this program and are not RCs: they carry the
  inherited identity and the untraceable audio, and were superseded by the
  provenance-clean regeneration.

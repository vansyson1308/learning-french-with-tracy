# Versioning policy — v1 (§6)

This app is a new standalone store identity ("Learning French with Tracy"),
so it does not inherit the upstream App Store version numbering. The first
public version is **1.0.0**.

| Field | v1 value | Where |
|---|---|---|
| `expo.version` (user-facing) | `1.0.0` | `app.json` |
| `expo.ios.buildNumber` (CFBundleVersion) | `1` | `app.json` |
| `expo.android.versionCode` | `1` | `app.json` |
| `cli.appVersionSource` | `local` | `eas.json` |

Rules:

1. **Local source of truth.** `eas.json` uses `appVersionSource: "local"`: EAS reads the values above and never writes to the project. The same values drive the GitHub-Actions-built artifacts, so every build channel agrees.
2. **One build number per uploaded binary.** Before every store or TestFlight upload, increment both `ios.buildNumber` and `android.versionCode` together (`bun scripts/bump-build.ts`); a build number is never reused for different bytes (the RC history records commit → version → build → hash).
3. **Semantic user-facing version.** `1.0.x` for fixes, `1.x.0` for features; the user-facing version changes only when the learner would notice something.
4. **Release candidates** are labelled `1.0.0-rc.N` in `release/RC_HISTORY.md` only; the binaries carry `1.0.0` with the incrementing build number.
5. Switching to `remote` later is a one-command migration (`eas build:version:set`) once the owner's EAS project exists; nothing in the app depends on which source is used.

Rationale: a personal project with CI-built artifacts is easier to audit when the version is a committed value; the Expo documentation supports both sources and notes that `local` means "EAS reads app version values and builds projects as they are."

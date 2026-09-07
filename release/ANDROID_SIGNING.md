# Android signing (RC2 program, Part V)

Non-secret record of how the Android app is signed. **No keystore, no
password, no private key ever appears in this repository, in release
documents, in workflow logs, or in GitHub artifacts.**

## Strategy

| Question | Decision |
|---|---|
| Permanent application id | `com.vansyson1308.learningfrenchwithtracy` (owner-approved 2026-09-08; immutable once uploaded to a store) |
| Who holds the key | **EAS-managed** remote keystore under the owner's Expo account. No owner-controlled keystore existed before this program, so EAS generates one at the first `preview` build (interactive: answer **yes** to "Generate a new Android Keystore?"; `--non-interactive`: EAS CLI generates it automatically — verified in eas-cli 23.2.0 `CreateKeystore.provideOrGenerateAsync`). |
| Number of keys | **One.** Every later RC (rc.3, rc.4, …) and the future Play upload use the same keystore. A changed certificate fingerprint on a later build is a **release failure** unless deliberately explained here. |
| Where it is recorded | The certificate SHA-256 fingerprint, subject and creation date are printed by `eas-build.yml` (`apksigner verify --print-certs`) and copied into the table below; `eas credentials --platform android` shows the same on the owner's machine. |
| Backup | EAS keeps the keystore; the owner may download a copy from `eas credentials` and store it offline (never in git — `.gitignore` excludes `*.jks`, `*.p12`, `*.key`). |
| Google Play (later) | Recommended: **Play App Signing** with this EAS keystore as the *upload key*. Google then signs the distributed APKs with its own app-signing key, which differs from the upload key. Consequence: **sideloaded RC builds signed with the EAS key may need to be uninstalled before a Play build installs** (different signer). This is documented for testers; seamless update from a sideloaded RC to the Play build is not promised unless the signatures are proven identical. |
| Debug keystore | Only the Phase 10 QA artifact (`android-release-build.yml`, debug-signed) used the template debug key. It is not an RC and cannot update an EAS-signed install. |

## Continuity check (every RC)

```
apksigner verify --verbose --print-certs app.apk | grep -E "Signer #1 certificate (SHA-256|DN)"
```

The SHA-256 line must equal the fingerprint recorded for RC2. `eas-build.yml`
prints it in the run summary and stores it in the `android-rc-preview`
artifact (`apksigner.txt`).

## Record (filled from the RC2 build; non-secret fields only)

| Field | Value |
|---|---|
| Keystore location | EAS-managed (owner's Expo account, project id in `release/identity.json`) |
| Key alias | recorded from `eas credentials` when the build exists |
| Certificate SHA-256 fingerprint | **pending RC2 build** |
| Certificate subject (DN) | **pending RC2 build** |
| Created | **pending RC2 build** |
| Package | `com.vansyson1308.learningfrenchwithtracy` |
| EAS project id | **pending `eas init`** (`release/identity.json`) |
| First build using it | RC2 (`ANDROID_RC2.md`) |

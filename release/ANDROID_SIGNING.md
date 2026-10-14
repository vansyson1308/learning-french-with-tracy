# Android signing (RC2 program Part V; RC3 local route)

Non-secret record of how the Android app is signed. **No keystore, no
password, no private key ever appears in this repository, in release
documents, in workflow logs, or in GitHub artifacts.**

## Strategy (RC3, 2026-10-14: owner-held keystore, local Windows build)

| Question | Decision |
|---|---|
| Permanent application id | `com.vansyson1308.learningfrenchwithtracy` (owner-approved 2026-09-08; immutable once uploaded to a store) |
| Who holds the key | **The owner, on their own PC.** `C:\keys\lft-upload.jks`, alias `upload`, RSA 2048, validity 10,000 days, generated interactively by the owner with `keytool -genkeypair` (`plan/scripts/sign-apk-windows.cmd` runs it once if the file is missing). The owner types the passwords; they are never stored in a file, the repo, a workflow or a log. This replaces the EAS-managed route planned for RC2 (`ANDROID_RC2.md` §3 keeps those instructions for the day an EAS project exists; if it is ever used, the EAS keystore must be *this* file uploaded, never a second key). |
| Number of keys | **One.** Every later RC (rc.4, …) and the future Play upload use the same keystore. A changed certificate fingerprint on a later build is a **release failure** unless deliberately explained here. |
| Where it is recorded | The certificate SHA-256 fingerprint, subject (DN) and creation date are printed by `apksigner verify --print-certs` into `outc.N-signing-report.txt` and copied into the table below. |
| Backup | The owner backs up `lft-upload.jks` **and** both passwords offline in two separate places (for example an encrypted USB stick and a password manager). Losing the key means every future update needs a new application id. `.gitignore` excludes `*.jks`, `*.p12`, `*.key`, `out/`. |
| Google Play (later) | Recommended: **Play App Signing** with this keystore as the *upload key*. Google then signs the distributed APKs with its own app-signing key. Consequence: **sideloaded RC builds signed with the upload key must be uninstalled before a Play build installs** (different signer). Documented for testers; seamless update from a sideloaded RC to the Play build is not promised. |
| Debug keystore | Only the Phase 10 QA artifact (`android-release-build.yml`, debug-signed) used the template debug key. It is not an RC and cannot update an owner-key-signed install. |

## Continuity check (every RC)

```
apksigner verify --verbose --print-certs app.apk | grep -E "Signer #1 certificate (SHA-256|DN)"
```

The SHA-256 line must equal the fingerprint recorded for RC3 below.
`plan/scripts/sign-apk-windows.cmd` prints it into `outc.N-signing-report.txt`
for every local build; `eas-build.yml` would print it in the run summary if the
EAS route is ever used.

## Record (non-secret fields only)

| Field | Value |
|---|---|
| Keystore location | `C:\keys\lft-upload.jks` on the owner's PC (owner-held; offline backups in two places) |
| Key alias | `upload` |
| Key algorithm / size / validity | RSA / 2048 / 10,000 days |
| Certificate SHA-256 fingerprint | **pending — the owner runs `plan\scripts\sign-apk-windows.cmd`; copy from `outc.3-signing-report.txt`** |
| Certificate subject (DN) | **pending (same report)** |
| Created | **pending (the day the owner runs keytool)** |
| Package | `com.vansyson1308.learningfrenchwithtracy` |
| EAS project id | none (not needed for the local route; `release/identity.json` unchanged) |
| First build using it | RC3 (`ANDROID_RC3.md`) |

# P0 — Build and sign a release APK locally on Windows (RC3)

Read `CLAUDE.md`, then `plan/01-TONG-QUAN-VA-QUYET-DINH.md`, `plan/07-PRODUCT-SPEC.md`, `plan/08-ROADMAP.md`, and **`plan/04-AUDIT-BUILD-RELEASE.md` in full**. Create a task list before coding. Work on branch `phase-0/rc3-local-apk`. Do not touch French learning behaviour. End with the REPORT block from `plan/prompts/README.md`.

## Goal
A release-signed APK of the current `main` (plus the small fixes below) installed on the owner's Android phone, built entirely on this Windows PC without EAS, signed with a new owner-held keystore, and recorded as **RC3** in the release records.

## Environment facts (verified 2026-10-14)
Node 24.14, Temurin JDK 17 and 21 at `C:\Program Files\Eclipse Adoptium\`, Git 2.49, 32 GB RAM, 113 GB free, `LongPathsEnabled=1`. **Missing:** bun, Android SDK, adb. The repo may not be cloned yet.

## Tasks
1. **Toolchain.** If `bun`, `%LOCALAPPDATA%\Android\Sdk\build-tools\36.0.0` or `ndk\27.1.12297006` are missing, run `plan/scripts/setup-windows-android.ps1` (it is idempotent) and then open a new shell. Verify: `bun --version`, `java -version` (17), `adb version`, `sdkmanager --list_installed`.
2. **Repo.** Ensure the checkout is at `C:\src\lft` cloned with `-c core.autocrlf=false` (if the current checkout has CRLF files, `git ls-files --eol | findstr crlf` — re-clone if so). `bun install --frozen-lockfile`. If `plan/` and `CLAUDE.md` are not in the repo yet, copy them from `C:\Users\MSI\Documents\app hoc ngoai ngu\` (folders `plan/`, file `CLAUDE.md`) into the repo root and commit them first (`docs(plan): add coordination plan and CLAUDE.md`).
3. **Gates before building:** `bun run typecheck`, `bun run lint`, `bun run test`, `bun run content:check`, `bun run release:identity`. Expect `audio:check` to fail on Windows because of backslash keys — fix it as part of task 4 and re-run.
4. **Small fixes, one PR, all with tests** (these do not change French learning behaviour):
   - `scripts/lib/audio.ts`: normalise relative paths to `/` so `bun run audio:check` passes on Windows (lines ~85–102, 137–143).
   - Add `.gitattributes` with `* text=auto eol=lf` and binary rules for `*.mp3 *.wav *.png *.db *.jks`.
   - `src/app/onboarding.tsx` / `src/lib/store.ts`: onboarding preselects `fr-en` (keep a separate `LEGACY_FLAT_COURSE_ID = "es-en"` constant for the v0 migration in `persistence/migrations.ts`).
   - Course guards: `/goals`, `/placement/intro`, `/placement/run`, `/checkpoint/[id]` and the magic lesson ids `srs-listening`, `srs-speaking`, `writing-practice`, `conversation` redirect home unless the active course has the capability (extend `src/lib/capabilities.ts` with `placement`, `checkpoints`, `goals`, `listening`, `speaking`, `writing`, `conversation` flags; only `fr-en` has them).
   - Lesson MCQ option order: shuffle `select`, `fillBlank`, `listeningComprehension`, `readingComprehension` options in lessons with the existing seeded RNG (`review-builder.ts` `seededRng`, seed = exercise id + attempt), keeping `correct` mapped; checkpoints/placement keep `option-order.ts`. Add a test.
   - Delete the orphan `src/content/pack.json`; fix stale comments listed in `plan/02-AUDIT-ARCHITECTURE.md` §10.3 item 8; update `LEXICON_LICENSE.md` and the `original-french-lexicon` registry notes to the real state (126 lexemes, Lexique 4 retrieved, 123 with Lexique data).
   - Re-run all gates; commit as `fix(release): windows audio check, onboarding default, course guards, lesson option shuffle, licence doc`.
5. **Prebuild + build.** `bunx expo prebuild --platform android --no-install --clean` → `git checkout package.json` → `cd android` → `.\gradlew.bat :app:assembleRelease --no-daemon --stacktrace`. If the NDK/CMake step fails on path length or spaces, report the exact error; do not hack `node_modules`.
6. **Keystore (owner-held, once).** If `C:\keys\lft-upload.jks` does not exist, run `keytool -genkeypair -v -keystore C:\keys\lft-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000` interactively with the owner present (the owner types the passwords; never store them in files or the repo). Tell the owner to back up the `.jks` and passwords offline in two places.
7. **Sign and verify** with `zipalign` + `apksigner` exactly as in `plan/04-AUDIT-BUILD-RELEASE.md` §3.4, output `out\learning-french-with-tracy-v1.0.0-rc.3.apk`. Run the badging/permission/debuggable checks and `certutil -hashfile … SHA256`. Record Signer #1 SHA-256 and DN.
8. **Install.** `adb devices` (owner enables USB debugging); if a debug-signed build is present, ask the owner to export progress first, then `adb uninstall com.vansyson1308.learningfrenchwithtracy`; `adb install out\…rc.3.apk`; cold launch; `adb logcat -d *:E | findstr /I "AndroidRuntime FATAL ReactNative SQLite Audio Speech"`.
9. **Records.** Update `release/ANDROID_SIGNING.md` (strategy → owner-held key; fingerprint, DN, created, alias), `release/RC_HISTORY.md` (RC3 row: commit, version 1.0.0 build 1, APK sha256 + size, "local Windows build", device: pending), `release/ANDROID_RC2.md` (note RC3 supersedes the EAS route for now; keep the EAS instructions), `release/PUBLICATION_STATUS.md` (RC builds row), `plan/STATUS.md` (new file: milestone table with dates). Do **not** bump the version for RC3 (no device test has happened yet); the next RC after device findings bumps via `bun run release:bump`.
10. Give the owner Packets 1–3 from `plan/04-AUDIT-BUILD-RELEASE.md` §6 as a checklist to run on the phone, with Windows-friendly commands (`findstr`, `adb shell screencap -p /sdcard/x.png` + `adb pull`).

## Definition of Done
- `out\…rc.3.apk` exists, `apksigner verify` prints "Verifies", badging shows package `com.vansyson1308.learningfrenchwithtracy`, `versionName='1.0.0'`, `targetSdkVersion:'36'`, permissions exactly `INTERNET MODIFY_AUDIO_SETTINGS RECORD_AUDIO VIBRATE`, not debuggable.
- APK installed and launched on the phone with no FATAL lines.
- All gates green on the branch; PR opened to `main` with the gate results in the description.
- Records updated; owner has the keystore backup instruction and the Packet 1–3 checklist.

## Owner actions you must request (never do them yourself)
Keystore passwords; USB debugging; running the phone packets; pushing the annotated tag `v1.0.0-rc.3` after CI is green.

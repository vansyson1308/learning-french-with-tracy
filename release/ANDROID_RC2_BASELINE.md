# Android RC2 program — baseline record

Recorded at the start of the "Android V1 RC2: personal identity → signed
APK → real device acceptance" program, before any change on the working
branch. Everything below was read from the live repository and GitHub,
not assumed.

## Repository

| Fact | Value |
|---|---|
| `main` | `e70442f76ad63fcd2da63e4730667599d8dc469f` (merge of PR #19), matches the expected baseline |
| CI on `main` | run 33663972700, success (5 time-zone check lanes + export-size lane) |
| Open pull requests | none |
| Working branch | `release/android-v1-device-acceptance`, created from `main` at `e70442f` |
| Working tree at start | clean |
| Latest tags on the remote | none (the RC1 tag push was refused to the automation credential; `RC_HISTORY.md`) |

## Identity at start (inherited, unconfirmed)

| Field | Value |
|---|---|
| `expo.name` / `slug` / `scheme` | `Lingo Lessons` / `lingo` / `lingo` |
| `expo.version` | `1.1.0` (no `buildNumber`, no `versionCode`) |
| `expo.owner` | `ahmet909` |
| iOS bundle id / Android package | `com.ahmet.lingo` |
| `extra.eas.projectId` | `c5e5ee9a-1aac-4b7c-ba0f-a97897c4d348` (upstream) |
| `eas.json` | `appVersionSource: remote`, `autoIncrement` on both profiles, ASC app id `6781818623` |
| `release/identity.json` | `ownership.status: unconfirmed`, `storeDistribution: blocked` |
| `release/support-contact.json` | `email: null` |

## Owner decisions applied in this program (closed, not re-asked)

Display name Learning French with Tracy · slug `learning-french-with-tracy`
· scheme `learningfrenchtracy` · iOS bundle id and Android package
`com.vansyson1308.learningfrenchwithtracy` · version 1.0.0 · build 1 ·
support email `duymank250997@gmail.com` (provisional, real, monitored) ·
GitHub Pages enabled by the owner.

## Public site at start

| Fact | Value |
|---|---|
| Repository `has_pages` | `true` (owner enabled Pages) |
| Pages deployments | none yet — the only Pages run (33663402880) predates enablement and failed at site creation |
| Repository description / homepage | still upstream's ("(Open Source) Lingo Lessons …", `https://lingo.openappsstudio.com/`) — an owner-only repository setting, does not block Android installation |

## Execution-environment ceiling (stated up front)

| Capability | State here |
|---|---|
| Android SDK / `adb` / emulator | absent (no `ANDROID_HOME`; `dl.google.com` was egress-blocked in Phase 10 and the SDK is still absent) |
| Java / Gradle | present (`/usr/bin/java`, Gradle 8.14.3) |
| EAS CLI | runnable through `npx eas-cli@latest`; `eas whoami` → **Not logged in**; no `EXPO_TOKEN` in the environment |
| `https://vansyson1308.github.io/…` | egress-blocked from this sandbox (proxy CONNECT 403 and the fetch tool both refuse) — external HTTP verification of the site must be done by the owner or a runner outside this sandbox |
| Physical Android phone | not attachable to this cloud container; ADB-driven testing must run on the owner's machine with the packets in `ANDROID_DEVICE_ACCEPTANCE_PACKETS.md` |
| GitHub Actions | available (Ubuntu runners have the Android SDK; the dispatch-only workflows already build APKs there) |

Consequences: the identity migration, configuration, regression, prebuild
verification, documentation and site changes are done here; the EAS
project, the signed build and the phone work are owner-gated and are
driven with exact numbered packets, never vague questions.

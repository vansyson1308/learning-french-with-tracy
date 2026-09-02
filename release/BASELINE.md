# Phase 10 — Authoritative starting baseline

Recorded at the start of Phase 10 (2026-09-02), before any Phase-10 mutation.
Everything below was measured in the working tree, not copied from earlier
reports.

## Repository state

| Item | Value | Evidence |
|---|---|---|
| Expected `main` (mandate) | `c663b43e4fd4d5e553e8f4bae788f9aaef92bdfe` | mandate §0 |
| Actual `origin/main` | `c663b43e4fd4d5e553e8f4bae788f9aaef92bdfe` | `git fetch origin && git rev-parse origin/main` |
| Head commit | "Phase 9: A1 communication completion — writing, spoken interaction, capstone, claim split (#14)" (merge commit) | `git log -1` |
| Open pull requests | none | GitHub API |
| CI on `main` | run #118, `success`, head `c663b43e` | GitHub Actions |
| Working tree | clean | `git status` |
| Phase-10 branch | `phase10/final-release` (from `main`) | `git branch --show-current` |
| Repository visibility | public fork of `Open-Apps-Studio/lingo-lessons` | GitHub |

## Toolchain and dependencies (installed, `node_modules`)

| Component | Version | Note |
|---|---|---|
| Expo SDK | `expo` 56.0.11 | registry `sdk-56` tag is 56.0.21; `latest` is 57.0.19 (2026-09-01) |
| React Native | 0.85.3 | |
| React / react-dom | 19.2.3 | unchanged in SDK 57 |
| Hermes | V1 `250829098.0.10` (`hermes-compiler`), `HERMES_VERSION_NAME=0.16.0` | **affected by the Hermes V1 memory regression** (expo-doctor: fix first in `250829098.0.16`) |
| react-native-reanimated | 4.3.1 | SDK 57 pairs 4.5.1 |
| react-native-worklets | 0.8.3 | SDK 57 pairs 0.10.1 |
| expo-audio | 56.0.12 | SDK 57 pairs ~57.0.4 |
| expo-speech-recognition | 56.0.4 (exact pin) | 57.0.0 published 2026-08-30 — byte-identical code, only the version string differs |
| expo-sqlite | 56.0.5 | SDK 57 pairs ~57.0.2 |
| ts-fsrs | 5.4.1 (exact pin) | |
| expo-router | 56.2.10 | SDK 57 pairs ~57.0.18 |
| jest-expo | 56.0.5 | SDK 57 pairs ~57.0.5 |
| TypeScript | ~6.0.3 | |
| Bun / Node | 1.3.11 / 22.22.2 | |
| Native toolchain here | Java 21, Gradle 8.14.3; **no Android SDK, no adb, no Xcode** | `dl.google.com` egress-blocked (no SDK download) |

`expo-doctor` on this tree (SDK 56): 18/22 checks passed. Real findings:
(1) Hermes V1 memory regression (above); (2) missing required peer dependency
`expo-asset` (required by `expo-audio`) — "Your app may crash outside of Expo
Go without this dependency". The two other failures are network-caused in
this sandbox (Expo config schema fetch, React Native Directory metadata).

## Persistence

| Item | Value |
|---|---|
| zustand persist key | `progress-v2` (never renamed) |
| `PERSIST_VERSION` | 3 |
| Backup `ENVELOPE_VERSION` | 1 |

## Release identity (inherited upstream — audited in Gate 1, not mutated)

| Field | Value |
|---|---|
| `expo.name` / `slug` / `scheme` | "Lingo Lessons" / `lingo` / `lingo` |
| `expo.version` | 1.1.0 (`package.json` version 1.0.0) |
| `expo.owner` | `ahmet909` |
| iOS `bundleIdentifier` | `com.ahmet.lingo` |
| Android `package` | `com.ahmet.lingo` |
| EAS `projectId` | `c5e5ee9a-1aac-4b7c-ba0f-a97897c4d348` |
| `eas.json` submit `ascAppId` | `6781818623` |
| `eas.json` `appVersionSource` | `remote` |
| Android permissions declared | `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK` |

## French content (compiled `src/content` + sources)

| Item | Value |
|---|---|
| Sections | 6 |
| Units | 27 |
| Lessons | 108 |
| Exercises | 604 (gradeTargets on 256/604: select 230/271, match 26/26) |
| Lexemes (rich lexicon) | 126 (contentHash `07337cd4a8d13484`, SQLite asset `fr-lexicon-v2-07337cd4a8d13484.db`, 118,784 bytes) |
| Audio assets | 1,024 mp3 files, 19 MB total across 9 dirs; `fr` 92 files (1.8 MB), `fr-reception` 167 files (3.1 MB) |
| Objectives | 34 (`content/fr/assessment/objectives.json`) |
| Checkpoints | 7 (six section checkpoints + `fr.checkpoint.a1-capstone` with forms `a`/`b`, 10 items each) |
| Placement | `content/fr/assessment/placement.json` |
| Interaction scenarios | 18 |

## Assessment claims (compiled `src/content/assessment/fr-claim.json`)

| Level | courseClaimable | unassessedDomains |
|---|---|---|
| PRE_A1 | false | all five |
| A1 | **true** | none |
| A2 | false | all five |

Claim wording (compiled): "CEFR-aligned estimate — not an official CEFR
examination or certification."

Learner-estimate policy at baseline (`src/lib/assessment/estimate.ts`): a
domain is `demonstrated` when **at least one** direct-A1 objective in that
domain carries a `demonstrated` verdict under the latest-attempt policy;
overall A1 = every domain demonstrated. Phase 10 Gate 2 replaces the
"at least one" rule with an authored attainment blueprint.

## Automated test surface

| Lane | Result at baseline |
|---|---|
| `bun run test` (src + scripts) | 1047 pass / 0 fail, 8,997 assertions, 66 files |
| `bunx jest` (integration-tests/) | 68 pass, 10 suites |
| `bunx tsc --noEmit` | clean |
| `bunx eslint .` | 0 errors, 25 warnings |
| `bun scripts/validate-content.ts` | passed (packs + registry + rich lexicon + pedagogy + assessment + reception + speech + writing + interaction) |
| `bun scripts/compile-content.ts --check` | generated artifacts up to date |
| Browser E2E (Phase 9 suite, Chromium over the static web export) | 7/7 — script lived only in the session scratchpad; Phase 10 commits an `e2e/` harness |

## Size baseline (Phase 9 artifacts, built from the identical tree — `git diff 290f9d5 c663b43` is empty)

| Artifact | Size |
|---|---|
| Web static export | 28 MB (directory) |
| Android JS bundle (`expo export --platform android`) | 5,021,687 bytes |
| Android Hermes bytecode (`hermesc -emit-binary`) | 5,792,979 bytes |
| Lexicon SQLite | 118,784 bytes |
| Audio | 19 MB |

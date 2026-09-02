# Device acceptance pack (Part IV)

Everything the automated program cannot prove — permissions, share sheets,
speech on a real recogniser, screen readers, offline mode, the store
install paths — is proved here, on phones, by the owner (and beta
testers), against a named release-candidate build. Automated evidence for
everything else is in `docs/USER_GUIDE_VALIDATION.md` (guide walk),
`release/SOAK_REPORT.md`, `release/ACCESSIBILITY_FINAL.md` and CI.

## 0. Before you start

| Item | Value |
|---|---|
| Build under test | RC from `release/RC_HISTORY.md` — write its build number / versionCode here: ______ |
| iPhone install | TestFlight invitation (after Apple enrollment) — `APPLE_ACCOUNT_SETUP.md` |
| Android install | Play internal-testing link, or the signed `.apk` attached to the GitHub Release for the same commit (`PUBLISHING_RUNBOOK.md` §Direct APK) |
| Minimum OS | iOS 16.4 · Android 7.0 (API 24) |
| Time | ~90 minutes per device for the full matrix; the beta testers do the persona flows only |

Record results in the tables (PASS / FAIL / N/A + a note). Any FAIL is
triaged with the severity scale in `KNOWN_LIMITATIONS.md`; **P0/P1 block
release**, P2 is fixed or explicitly accepted, P3 is recorded.

## 1. Tester personas

Each persona is a complete first-session script; beta testers pick one
(`docs/BETA_TESTER_GUIDE.md`), the owner runs all eight on each platform.

| # | Persona | Script | What it proves |
|---|---|---|---|
| P1 | **Complete beginner** | install → French → goal 20 → Learn French → first three lessons of *Basics 1* → check Profile (XP 45–60, streak 1) | onboarding, lesson loop, XP/streak |
| P2 | **Studied before** | onboarding → *Studied French before?* → answer honestly, use *I don't know* twice → accept *Start here* → open the first unlocked lesson → Goals shows Retake + Reset | placement, floor, cleared markers |
| P3 | **Returning learner** | after P1: Profile → Export progress (save to Files/Drive) → delete the app → reinstall → Import progress → Profile figures identical | backup export/import through the OS |
| P4 | **Speaker** | Section 4 lesson: allow microphone + speech; 3 attempts of each kind; Play back my recording; skip one step | recognition, playback, cleanup, skip |
| P5 | **Speaker, permission denied** | deny microphone at the prompt → *Allow microphone* → deny again → *Open Settings* path → Skip this step; then grant in Settings and retry | denied-permission UX, Settings route |
| P6 | **Offline commuter** | airplane mode ON: Learn lesson, Today session, listening lesson, vocabulary search, checkpoint section 1 — all work; speaking step explains the network need or works with an on-device model | offline claim |
| P7 | **Screen-reader user** | VoiceOver / TalkBack rows A1–A13 in `ACCESSIBILITY_FINAL.md` | accessibility |
| P8 | **Large text** | largest accessibility text size: P1's script plus Today, Goals, Profile | scaling, clipping |
| P9 | **Sideloader (Android only)** | install the release `.apk`: unknown-app warning appears, install succeeds, app identity (name, icon) correct, no Play Protect block; update by installing the next APK keeps progress | direct distribution |

## 2. iPhone matrix

Run on at least: one recent iPhone (iOS 18) and one older supported
device (iOS 16.4–17). Same table per device; note model + iOS version.

| # | Guide § | Step | Expected | Result |
|---|---|---|---|---|
| I1 | 2 | Install from TestFlight | installs; icon is the é mark; name "Learning French with Tracy" | |
| I2 | 3 | First launch | course grid; goal chips; Learn French; Learn tab; no onboarding flash on relaunch | |
| I3 | 6–8 | Lesson 1 to the end | Check/Continue; wrong answer re-queued; summary with XP; Profile updates | |
| I4 | 14 | Listening lesson (Section 3) | clip plays through the speaker; Play again; Slow; silent switch respected? (plays in silent mode by design — note) | |
| I5 | 15–17 | First speaking step | microphone + speech prompts appear once each; the on-device-model notice appears when no offline French model (Got it) | |
| I6 | 15 | Record / stop / playback | *I heard: …* shows; Play back my recording works; second attempt; model answer after two misses | |
| I7 | 16 | Denied permissions | Allow microphone → Open Settings; Settings → Privacy & Security → Microphone / Speech Recognition list the app | |
| I8 | 12 | Today with Can't speak now | switch shown; on: no speaking steps; off: speaking steps present | |
| I9 | 13 | Review with Undo | after a due review exists (next day): Undo this review reverts the last answer | |
| I10 | 18 | Writing task | keyboard does not cover the field; feedback names what is missing | |
| I11 | 19 | Conversation | partner audio plays; rephrase once on a miss; transcript on screen | |
| I12 | 21–22 | Checkpoint section 1; capstone pre-gate | scored flow; retake cooling-off shown; capstone speech pre-gate respects the permission state | |
| I13 | 25, 34 | Reset starting point | native alert Keep it / Reset; reset keeps lessons/XP/streak | |
| I14 | 27 | Export progress | share sheet; file saved to Files; file contains no audio/transcripts (open it: JSON with progress only) | |
| I15 | 28 | Import progress | file picker; valid file imports; an edited/truncated file is refused with a reason and nothing changes | |
| I16 | 29 | Privacy screen | policy text; website link opens Safari to `/privacy/` | |
| I17 | 30 | Appearance | Device/Light/Dark switch immediately; system dark mode followed | |
| I18 | 31 | Airplane mode | P6 script passes | |
| I19 | 35 | Licenses | Lexique 4, ts-fsrs, Lingo Lessons, each Piper voice with license | |
| I20 | — | Background/foreground during a lesson and a recording | resumes; no stuck recording; no duplicate audio | |
| I21 | — | Low storage / memory warning simulation (Xcode) | no crash; progress intact after relaunch | |
| I22 | — | Soak blocks 1–8 (`SOAK_REPORT.md`) | plateau; `speech-attempts/` empty | |
| I23 | — | Accessibility rows A1–A15 (`ACCESSIBILITY_FINAL.md`) | all PASS | |

## 3. Android matrix

Run on at least: one recent Android (14/15) and one older supported device
(Android 8–10); include one low-RAM device if available.

| # | Guide § | Step | Expected | Result |
|---|---|---|---|---|
| A1 | 2 | Install from the internal-testing link | installs; icon (adaptive + themed/monochrome on Android 13+); name correct | |
| A2 | 2 | Install the release `.apk` (P9) | unknown-app warning; installs; same identity; updating in place keeps progress | |
| A3 | 3 | First launch | as I2; predictive back does not exit mid-lesson unexpectedly | |
| A4 | 6–8 | Lesson 1 to the end | as I3; hardware/gesture back from a lesson asks nothing and returns to Learn (state per design) | |
| A5 | 14 | Listening lesson | plays; Play again; Slow; volume rocker controls media volume | |
| A6 | 15–17 | First speaking step | RECORD_AUDIO prompt; the on-device-model notice when the recogniser has no offline French pack; Got it | |
| A7 | 15 | Record / stop / playback | as I6 | |
| A8 | 16 | Denied permission | Allow microphone → after "Don't ask again", Open Settings; Settings → Apps → app → Permissions → Microphone | |
| A9 | 12 | Today with Can't speak now | as I8 | |
| A10 | 13 | Review with Undo | as I9 | |
| A11 | 18 | Writing task | keyboard/IME does not cover the field; autocorrect suggestions do not break grading | |
| A12 | 19 | Conversation | as I11 | |
| A13 | 21–22 | Checkpoint; capstone pre-gate | as I12 | |
| A14 | 25, 34 | Reset starting point | native dialog; reset keeps lessons/XP/streak | |
| A15 | 27 | Export progress | share sheet → Drive/Files; file has progress only | |
| A16 | 28 | Import progress | document picker; refusal path as I15 | |
| A17 | 29 | Privacy screen | text; website link opens the browser | |
| A18 | 30 | Appearance | as I17 | |
| A19 | 31 | Airplane mode | P6 script passes | |
| A20 | 35 | Licenses | as I19 | |
| A21 | — | Background/foreground; screen rotation (if allowed) during a lesson and a recording | resumes; no stuck recording | |
| A22 | — | App info → permissions list | only Microphone (and no storage/notifications/location) | |
| A23 | — | Soak blocks 1–8 | plateau; cache dir empty | |
| A24 | — | TalkBack rows A1–A15 | all PASS | |

## 4. Recording sheet

| Device | OS | Build | Persona/rows run | FAILs (id + severity) | Date | Tester |
|---|---|---|---|---|---|---|
| | | | | | | |

## 5. Exit criteria (DEVICE ACCEPTED)

- Both matrices run on the RC build on at least two devices per platform.
- Zero open P0/P1; every P2 either fixed in a new RC (re-run the affected
  rows) or accepted in `KNOWN_LIMITATIONS.md` with a reason.
- Accessibility rows A1–A15 PASS on both platforms (or the store
  accessibility claims are withheld, `ACCESSIBILITY_FINAL.md`).
- Soak blocks complete without a monotonic memory rise or an orphaned
  recording.
- The recording sheet filled in and this file committed with the results.

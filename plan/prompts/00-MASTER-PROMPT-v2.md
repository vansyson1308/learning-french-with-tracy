# MASTER PROMPT v2 — long-run mode until the v1.0 "perfect build" (owner decision 2026-10-27)

Owner decision: **no more intermediate phone tests or owner stops.** The owner installs an APK only once, when the v1.0 build below is complete. Time is not a constraint; invest in depth. You keep working milestone after milestone and never wait for the owner except for the two things only a human can do (typing the keystore password, and the final review/acceptance) — those are collected in one file and done once at the end.

## 0. Immediate changes
1. **RC4 is parked, not tested.** Record in `release/RC_HISTORY.md`: "RC4 (build 2, 3ff3b96) built, unsigned, not device-tested — superseded by the v1.0 candidate per owner decision 2026-10-27". Remove every pending owner action from `plan/STATUS.md` and move them into **`plan/OWNER-FINAL-CHECKLIST.md`** (one consolidated list: keystore, reviews, device acceptance, accounts). From now on any new human-only task is appended there, never blocks work.
2. Finish the open parts of `plan/prompts/P3g-rc4-release-hardening.md` that did not land (verified on `main` 2026-10-27): **B** per-course lazy content + split audio maps — the web entry bundle is still **7.5 MB** (gate ≤ 4.5 MB not in CI); **C** phone APK for arm64-v8a + armeabi-v7a only (RC4 was built universal, 133.7 MB). Add P3g to STATUS.
3. Because the owner will not test on a phone until the end, **the CI must become the phone tester** — milestone P3h below, done before any new course.

## P3h — Automated device acceptance on every PR touching the app (new)
- Android emulator job (API 34 x86_64 and API 30, GitHub runner, reuse `android-emulator-smoke.yml`) driven by **Maestro** flows (Apache-2.0, CI-only, never bundled), with `testID`s:
  - fresh install → Vietnamese onboarding → one lesson in every shipped course (fr-vi, es-vi, then each new course) → Today with daily words → one checkpoint → exam mock section → Profile;
  - **upgrade test**: install the previous tagged build, seed progress with a scripted flow, install the new build with `adb install -r`, assert streak/XP/lessons/cards/placement unchanged (covers every persistence migration);
  - offline: whole flow with network disabled on the emulator;
  - audio: assert playback started/finished events for one clip per course (log marker), no `MediaPlayer`/ExoPlayer errors;
  - backup export → `pm clear` → import → assertions;
  - crash/ANR scan of logcat; cold-start time (`am start -W`) recorded, budget ≤ 3.5 s on the API 34 emulator; memory snapshot after the flow.
- Screenshots of every screen in vi and en saved as artifacts; a visual check job fails on clipped text (Maestro `assertVisible` on full strings + the existing large-font run).
- This job is required for merge. Speech recognition cannot run on the emulator: keep the speech grader unit tests and the "recogniser unavailable" path covered by the flow.

## Order of work (each milestone = its prompt in `plan/prompts/`, PR, all gates + P3h green, merge, STATUS, report)
P3g(B,C) → **P3h** → P4a → P5b (graded stories, all shipped languages) → P3d(de) → P3d(it) → P3d(pt) → P4b (CJK plugins + Hán-Việt) → P4c ja-vi + JLPT N5 → P4d zh-vi + HSK 1–2 → P4e ko-vi + TOPIK I → P4f en-vi + VSTEP → P5a FSRS visible → P5c own-text importer → P5e mistake-driven grammar → P5d pronunciation coach → P5f constrained LLM (opt-in) → P6a brand/store prep → **v1.0 candidate**.
For every new course: P3e-level hardening is part of its P3d run (lesson-shape gate, variety/script gates, LanguageTool where the language is supported, back-translation pass, tiered review files, syllabus ≥ 600 A1 lexemes with ≥ 1 context sentence each from lessons/readings/stories, exam track checked against the official format document with URL and date, audio within budget, beta label until reviewed).

## v1.0 "perfect build" — definition (the only build the owner installs)
All of these, verified by CI and recorded in `release/V1_ACCEPTANCE.md`:
1. Courses, all from Vietnamese: fr, es, de, it, pt, ja, zh, ko, en — each A1 to French parity, claim gate A1 claimable, its exam track (DELF/DELE/Goethe/CILS/CAPLE A1, JLPT N5, HSK 1–2, TOPIK I, VSTEP basics) validated against official format sources; `fr-en` kept; inherited `*-en` packs removed or under "Khoá khác".
2. Features: daily words + graded stories with audio and tap-to-gloss; FSRS visible; importer; mistake-driven grammar; pronunciation coach for at least en + one more language; Hán-Việt readings for ja/zh/ko; LLM tutor off by default and opt-in only.
3. Quality gates green: all unit/jest/e2e/golden/content/audio/LanguageTool/size gates; P3h emulator suite on both API levels incl. upgrade from RC3 data; zero open P0/P1 in `KNOWN_LIMITATIONS.md`; no beta labels left **except** where the owner explicitly accepts them in the final checklist.
4. Budgets: phone APK (arm64) ≤ 150 MB or Play Asset Delivery plan implemented for the AAB; per-language audio ≤ 12 MB; web entry ≤ 4.5 MB; cold start ≤ 3.5 s (emulator).
5. Store readiness: brand applied, Vietnamese + English listing, screenshots from the candidate, Data safety "No data collected" (plus opt-in declarations), privacy policy live, closed-test plan ready.
Only then: build the signed candidate (owner types the password once), owner runs the single acceptance pass from `plan/OWNER-FINAL-CHECKLIST.md`, fixes → next candidate, then Play closed test.

## Working rules (unchanged unless stated)
CLAUDE.md non-negotiables; never weaken a gate; never claim a device result you did not observe (emulator results are labelled "emulator"); no owner stops; short Vietnamese summary in `plan/reports/<milestone>.md` and a one-paragraph Vietnamese note at the top of `plan/STATUS.md` after each milestone; mirror STATUS and OWNER-FINAL-CHECKLIST to `C:\Users\MSI\Documents\app hoc ngoai ngu\plan\`; clean temp files and stop background processes you started on the owner's PC.

Start now with step 0.

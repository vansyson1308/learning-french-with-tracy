# P5a — FSRS made visible: optimizer, retention forecast, gentle streak

Read `CLAUDE.md`, `plan/05-RESEARCH-MARKET.md` §3.1, §3.5, §4.5, `src/lib/learning/{fsrs-adapter,fsrs-defaults,scheduler,today}.ts`, `src/lib/store.ts` (streak), `ts-fsrs` docs (version pinned in package.json). Branch `phase-5/fsrs-visible`. End with the REPORT block.

## Tasks
1. Confirm ts-fsrs FSRS-6 parameters are in use; add per-course **parameter optimisation** on device using the review log (ts-fsrs optimizer if available in the pinned version; otherwise a bounded grid/gradient over the log-loss on the learner's own log, run in a background task ≤ 2 s, min 400 reviews, results stored per target with provenance and a "reset to defaults" button). Never change parameters mid-session; tests with synthetic logs.
2. Learner-facing views (Vietnamese/English via i18n): Practice tab "Ôn tập" card shows due today / next 7 days bars, estimated retention now, and per card "why now" (stability, last reviewed, predicted recall) in the vocabulary detail and the post-answer panel; Profile shows "memory health" (cards by stability band). All computed from existing state; no new persisted fields except optimizer results.
3. Streak: free freezes (2 banked, refilled weekly), "streak paused" instead of "lost" wording, no streak notifications; daily goal in minutes-or-items; remove any copy that pressures. Tests for the freeze logic across TZ lanes.
4. Docs: `docs/USER_GUIDE*.md`, `release/ASSESSMENT_DOSSIER.md` (retention estimates are not level claims).

## Definition of Done
Goldens: scheduling outputs unchanged with default parameters; optimizer tests; UI snapshot tests; CI green; `plan/STATUS.md`.

# P1d — Persistence v4: per-course assessment, SQLite learner store, backup v2

Read `CLAUDE.md`, `plan/02-AUDIT-ARCHITECTURE.md` §7 (all), `release/SOAK_REPORT.md`, `src/lib/persistence/*`, `src/lib/backup.ts`, `src/lib/store.ts`. Branch `phase-1/persistence-v4`. Goldens for migrations/backup will legitimately change (new version) — re-bless with a CHANGELOG entry that explains each diff. End with the REPORT block.

## Goal
Learner state scales to several FSRS courses and years of reviews without hitting AsyncStorage limits; assessment state is per course; backups stay importable both ways.

## Tasks
1. **Migration v3 → v4** (`migrations.ts`): `assessment` → `assessmentByCourse: Record<courseId, {checkpointAttempts, placement?, placementFloor}>` with the existing data moved under `"fr-en"`; `speechNoticeAckAt` stays global; `uiLanguage` field added (default `"system"`, used in P2a). Fixtures for every historical persona + a v3 persona with assessment data; tests in all TZ lanes; failure-injection seam kept.
2. **SQLite learner store** (`src/lib/persistence/learner-db.ts`, expo-sqlite): tables `cards (course_id, item_id, skill, state_json, due, updated_at)`, `review_log (seq, course_id, …)`, `meta`. Zustand keeps settings, progress counters, completed lessons, mistakes, wordStats, assessment. `cards`/`reviewLog` are loaded lazily per course into memory and written through a small transactional repository (`CardRepository`, `ReviewLogRepository`) with the same pure engine on top. Write path: one transaction per session completion (not per answer), plus a crash-safe pending buffer. Keep a **web fallback** (AsyncStorage JSON) behind the same repository interface.
3. **One-time import** on first launch after v4: move `courses[*].cards` and `reviewLog` from the AsyncStorage blob into SQLite inside a transaction, verify counts, then strip them from the blob; keep a `progress-before-v4-*.json` safety copy in `Paths.document` like the import flow does. Idempotent; tested with a 10k-entry log persona (performance assertion < 2 s in Bun).
4. **Backup v2**: envelope `envelopeVersion: 2` includes cards + review log pulled from SQLite; import accepts v1 and v2, migrates in scratch, runs `runInvariants`, commits atomically (blob + SQLite in one logical transaction with rollback file). File name prefix becomes the new brand slug later (P6a) — for now keep `lingo-progress-*` and accept both forever.
5. **Soak**: extend `src/lib/__tests__/soak-*.test.ts` to 2 FSRS courses × 50 days and assert blob size stays under 512 KB; update `release/SOAK_REPORT.md` with the new numbers and the Bun timings.
6. **Undo**: `undoLastReview(courseId)` works against the SQLite repository (last mutation index per course).
7. Docs: `release/PRIVACY_INVENTORY.md` / `PRIVACY_POLICY.md` wording ("progress is stored on your device in a local database and settings store"), `docs/USER_GUIDE.md` backup section, `KNOWN_LIMITATIONS.md` (remove the "unknown store size" P2 if measured).

## Definition of Done
All migration personas pass; backup round trips v1→v4 and v2→v2; soak assertions pass; jest integration tests for Today/goals/vocabulary still pass; a device smoke on the owner's phone (install over RC3 → progress preserved) is listed as an Owner action; CI green; `plan/STATUS.md` updated.

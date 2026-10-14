# P6b — Final device acceptance, accessibility, soak, submission

Read `CLAUDE.md`, `plan/04-AUDIT-BUILD-RELEASE.md` §5–§6, `release/DEVICE_ACCEPTANCE.md`, `ANDROID_DEVICE_ACCEPTANCE_PACKETS.md`, `ACCESSIBILITY_FINAL.md`, `SOAK_REPORT.md`, `RC_HISTORY.md`, `RELEASE_CHECKLIST.md`. Branch `phase-6/acceptance`. End with the REPORT block.

## Tasks
1. Produce the RC (bump, tag by owner), run CI, emulator smoke, web e2e; generate the packet checklists for each course the store lists (fr-en, fr-vi, es-vi and every shipped `-vi` course) with Windows-friendly commands.
2. Owner runs packets on ≥ 2 devices (one Android 14/15, one 8–10); Claude Code ingests the replies into `DEVICE_ACCEPTANCE.md` rows, triages P0/P1 → fixes → next RC (repeat), P2 → `KNOWN_LIMITATIONS.md`.
3. Accessibility rows A1–A15 (TalkBack, large text, scanner) recorded; soak snapshots analysed against `SOAK_REPORT.md` criteria.
4. Final RC exit gate table in `RC_HISTORY.md`; `PUBLICATION_STATUS.md` → DEVICE ACCEPTED → STORE READY; closed test start; after 14 days, production submission checklist (`PUBLISHING_RUNBOOK.md` H).

## Definition of Done
Zero open P0/P1; A1–A15 PASS; soak PASS; records committed; closed test running; submission prepared.

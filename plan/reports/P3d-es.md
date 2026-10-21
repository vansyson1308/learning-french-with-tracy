# P3d (es) — `es-vi`: Spanish A1 for Vietnamese speakers + DELE A1 exam track

Session: 2026-10-21/22 (Claude Code, autonomous loop). Branch `phase-3/es-vi`.

## REPORT P3d-es
Branch / PR: `phase-3/es-vi` → `main`; PR: see `plan/STATUS.md`.
Changed:
- **The course `es-vi`** (authored with the P3c toolkit, every step through `emit`/`ingest` and the validators; learner-facing text in Vietnamese, target text neutral Latin-American Spanish, *ustedes* not *vosotros*):
  - 6 sections, 27 units, 108 lessons, **589 exercises** of all 15 types (select 241, wordBank 61, fillBlank 45, typeAnswer 43, match 42, listeningComprehension 35, readingComprehension 24, conjugationCloze 20, speakProduction 20, articleSelect 16, guidedWriting 16, speakRepetition 9, interactionScenario 8, dictation 7, simpleForm 2); concept steps interleaved in 25 lessons; Vietnamese guidebooks.
  - 34 objectives over 5 domains (`direct` / `supports`, evidence notes, `canDo {vi, en}`), claim policy v2, attainment, clean-room `RESEARCH.md`.
  - 21 concept cards + 11 paradigm tables (ser, estar, tener, ir, hacer, querer, poder, hablar, trabajar, comer, vivir) evidenced by `morphology.json`.
  - Lexicon: all 887 lexemes reviewed in Vietnamese (the 293 `TODO:vi` resolved, POS fixes, example translations), A1 additions through the new `lexicon-add` step; ids frozen.
  - Reception: 37 readings, 255 clips (teaching, checkpoint, placement, exam, 113 + 21 partner turns), cast A `kokoro-ef_dora` / B `kokoro-em_alex` from the canary.
  - 54 speech items (26 reserved), 38 writing tasks (20 reserved), 22 scenarios (14 reserved).
  - 7 checkpoints (sections 1–6 + the A1 capstone with 2 parallel forms, 102 items) and a 4-stage, 28-item placement, item for item on the French blueprint.
  - **Claim gate: A1 claimable in all five domains** (`content/reports/es/cefr-claim-gate.json`, an aligned estimate).
  - `content/courses/es-vi.profile.json`: `role: primary`, `allowUnreviewed: true` + KNOWN_LIMITATIONS entry; `content/es/REVIEW-CHECKLIST.md` for the native reviewer.
- **Course roles** (`scripts/lib/course-roles.ts`). A profile may say `"role": "primary"` or `"standalone"`. The primary course carries the target's rich layers, reports and claim gates; a standalone course shares only the lexicon (its own native-language dictionary, `es-en-*` artifacts and database) and none of the rich layers. Without roles the smallest native code stays primary, so French is byte-identical. `es-en` is standalone: its 40 lessons are back to their original bytes, onboarding no longer offers it, and the Courses screen lists it under **Khoá khác**. The onboarding default is chosen by core capabilities, then exercise count — still `fr-en` (a tie on capability count had silently made `es-vi` the default; caught by the default-course test).
- **DELE A1 exam track** — `content/es/exam/dele-a1.json`, formats only, every item original:
  - Sections and timing as in the public format: Reading 4 tasks / 25 items / 45 min, Listening 4 / 25 / 20 min, Writing 2 tasks / 25 min, Speaking 4 tasks / 15 min + 15 min preparation; 25 points each; groups Reading + Writing and Listening + Speaking, 30 of 50. `formatSource.checkedAgainstOfficialGuide = false`: the Instituto Cervantes pages and the guide PDF were unreachable (maintenance / connection refused), so the figures come from the brief and the app says so.
  - Two disjoint parallel forms, 56 items each, with their own 18 readings, 78 clips, 4 speech items, 4 writing tasks and 4 role-play scenarios (reserved).
  - Readiness bands worded as **mức sẵn sàng ước tính** (good / getting close / more practice); a sitting without Speaking gets no band ("chưa đủ dữ liệu"). The validator rejects "sẽ đỗ", "will pass" and similar, and requires the estimate wording.
- **Exam engine** (reused by every later exam track):
  - Schema `examTrackSchema`, validator + compiler `scripts/lib/exam.ts` (groups, parallel forms, per-task counts, exercise types per skill, 3-option rule, references, native text, honesty wording); exam items join the scored banks of the speech, writing and interaction validators (reserved items only).
  - Artifact `src/content/exam/<prefix>-exam-tracks.json`, profile `artifacts.examTracks`, optional capability `exam` (absent on courses without a track, so their profiles keep their bytes).
  - Runtime `src/lib/exam/`: form rotation, section sessions (completion `exam`), scoring by score group, readiness band, weak areas. Attempts reuse the `CheckpointAttempt` shape with `objectiveResults: []` — no persisted-shape change, no migration, and exam practice never moves the CEFR objective states.
  - UI: Practice-tab exam card, `/exam/[trackId]` (format, last mock, section practice), `/exam/run` (untimed section practice with feedback; timed mock section by section with a clock in the session header, unanswered items at time-up count as not answered, speech pre-gate with a skip; weak-area vocabulary practice as an ordinary FSRS review).
  - Toolkit step `exam` (`emit`/`ingest`, one file per track).
- **Fixes found on the way**:
  - Form exercises (`simpleForm`) said "with the details on the card" but no card was rendered anywhere. They now take optional `cueFacts` (mirrored from the task, shown as a card); every Spanish form has them. **French forms still show no card** — fixing them needs a French content change (see open questions).
  - The writing box placeholder was hard-coded French ("Écris ta réponse ici…"); it now comes from the UI catalogue.
  - `content:compile` refused to run when the only errors were stale generated files it would itself rewrite (new frozen ids); write mode now defers those and re-validates after writing; `--check` is unchanged.
- **Tests**: `course-roles.test.ts` (7), `exam.test.ts` (17: the authored track + every rule), `exam-engine.test.ts` (16: availability, forms, sessions, option shuffling, scoring, incomplete sittings, time-up, attempt shape, CEFR isolation, weak areas, FSRS review); tests that assumed "Spanish has no rich layers" moved to German; `e2e/exam-web.mjs` (14 checks, Vietnamese web export).
Gates (one exit code per gate): `typecheck` ✓, `lint` ✓, `content:validate` ✓, `content:check` ✓, `audio:check` ✓, `golden --check` ✓ (re-blessed with reasons; no French artifact changed), `i18n-keys --check` ✓, `release:identity` ✓, `bunx jest` ✓, `bun run test` 1,470 pass / 0 fail in each of UTC, America/Los_Angeles, Asia/Tokyo, Pacific/Kiritimati, Pacific/Pago_Pago (re-run after the form-card fix, same result); `e2e:exam` 14/14 on the Vietnamese export (also added to the CI Vietnamese lane); French `e2e:web` 15/15 (en, fr-en) and 15/15 (vi, fr-vi); `e2e:guide` 30 pass / 0 fail (5 device-only).
Device: not run — needs the owner (Packets 3–6 adapted to `es-vi`; the mock's speaking part needs a phone with Spanish recognition).
Docs updated: `docs/USER_GUIDE.md` + `docs/USER_GUIDE.vi.md` (es-vi and DELE A1 practice), `release/KNOWN_LIMITATIONS.md` (es-vi unreviewed, DELE format not re-checked, Spanish audio pending), `content/README.md` (staging), `plan/STATUS.md`, this report.
Open questions / risks:
- **Spanish audio**: the 255 clip scripts and the pack words have no bundled audio until the `audio.yml` generate run for `es` (layers pack + lexicon + reception) is dispatched on `main` after the merge; the earlier run was cut by the job timeout (fixed in P3c). Until then listening items offer the skip and pack words use device TTS.
- **French form cards**: `fr-en` / `fr-vi` Section 5 and checkpoint forms ask for "the details on the card" without showing one (the task's cue facts exist). The fix is to add `cueFacts` to those French exercises — a French content change, so it is left for an explicit task.
- The DELE figures should be re-checked against the official guide when the Cervantes site is back; set `checkedAgainstOfficialGuide: true` (and bump `trackVersion` if anything changes).
- Section practice uses both mock forms, so a later mock can repeat questions (the app says so). A third form would remove that.
- Writing and speaking points are coarse (deterministic rubric pass/fail per item, 2 and 4 items per form).
- Native review of the 6,191 Vietnamese strings in `content/es/REVIEW-CHECKLIST.md` (now including checkpoint, placement and exam payloads) and of the Spanish is still to do.
Owner actions:
- Walk `content/es/REVIEW-CHECKLIST.md` (or ask a Vietnamese reviewer), then set `review: { native, date }` in `content/courses/es-vi.profile.json`; a Spanish teacher should skim the Spanish lessons and the exam items.
- Device walk of `es-vi` (onboarding, a lesson per section, a checkpoint, the timed mock including Speaking).
Next: P4a (fix inherited courses / retire `-en` packs) can reuse course roles (`standalone`) to retire each inherited pack once its `-vi` course ships; P3d(de/it/pt) reuse the toolkit steps including `exam` and the exam engine unchanged.

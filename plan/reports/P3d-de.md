# P3d (de) — `de-vi`: German A1 for Vietnamese speakers + Goethe A1 practice

Session: 2026-10-28/29 (Claude Code, autonomous loop, `plan/prompts/00-MASTER-PROMPT-v2.md`), under coordinator QC `plan/prompts/QC-2026-10-28-de-vi.md`. Branch `phase-4/de-vi`.

## REPORT P3d-de
Branch / PR: `phase-4/de-vi` → `main`; PR: see `plan/STATUS.md`.

### QC 2026-10-28, point by point

**§1 — de-en untouched, no v9.**
- `de-en` is `"role": "standalone"`: same lessons, bytes and stored surfaces, listed under **Khoá khác**.
- German lexemes carry `legacySurfaces` (e.g. "Freund" → `de:w:freund`). Persist v8's surface → id mapping consumes them.
- `src/lib/__tests__/migrations-v8-de.test.ts` proves that RC3 de-en progress lands on `de:w:` ids with every count kept. It also covers the legacy review queue and the backup import.
- Every de-en pack word maps to an id, directly or through `legacySurfaces`, so no `unmapped` list was needed. **No migration v9.**

**§2 — blueprint lessons, not an 11-step template.**
- Lessons follow the blueprint's per-section type mix: production in German from Section 1, lesson-shape gate (≥ 5, varied), position balance, duplicates as errors.
- Section 1 was authored per de-vi unit word, not translated from de-en.
- **Concept steps sit in 25 lessons and all 23 cards are shown.** A recount after the promote found 20 lessons and two cards never shown (questions, place-prepositions); fixed in b6bd6a3.
- **German gates** (`scripts/lib/languages/de-gates.ts`, wired into the de plugin; tests in `scripts/__tests__/de-gates.test.ts`):
  - nouns capitalised, introduced with their article and plural;
  - dative only in declared chunks before Section 4 (`content/de/lexicon/dative-chunks.json`);
  - verb-second and separable verbs each get a concept card + ≥ 6 exercises after it;
  - du/Sie register consistent within each scenario (sentence-initial *Sie* does not count).
- Variety: standard German (Germany) is the production model; Austrian/Swiss forms are variant notes only (`content/de/VARIETY.md`).
- **LanguageTool (de-DE)** runs on every target string in CI (allow-list with reasons: `content/de/languagetool-allow.json`; findings uploaded as artifact `languagetool-de-vi`).
- **Back-translation pass:** 5,043 pairs and 249 flags, every flag read, none open (`content/de/_drafts/BACKTRANSLATION.md`). It is not independent: the same session wrote both languages.
- **Tier-1 review files:** `content/de/REVIEW-TIER1-vi.md` (378 lines, owner) and `content/de/REVIEW-TIER1-de.md` (309 lines, hired German teacher).

**§3 — Goethe A1 from the official documents.**
- Read before any item was written: the Durchführungsbestimmungen (Stand 1 September 2025, full text) and the Start Deutsch 1 Modellsatz (02/2024, format only). The Wortliste was used as a coverage check only and is not copied.
- URLs and dates are in `formatSource` and `content/de/exam/FORMAT-SOURCES.md`; `checkedAgainstOfficialGuide: true`.
- Modelled as published:
  - Hören about 20 min (Teil 1–3: 6 + 4 + 5 items);
  - Lesen 25 min (5 + 5 + 5);
  - Schreiben 20 min (form 5 points + message 10 points);
  - Sprechen about 15 min (3 + 6 + 6 points);
  - each part 15 raw points × 1.66, pass at 60 of 100.
- Differences, stated in the track and `KNOWN_LIMITATIONS.md`:
  - Sprechen is simulated one to one (the real exam is a group exam);
  - Teil 1 leaves out spelling and repeating a number;
- **Exam engine additions** (tests first):
  - task format `mcq2`: richtig/falsch and a/b, exactly 2 options, fixed order;
  - optional task `points` that weight a section, on every task of a section or on none.

**§4 — stories.**
- **43 German stories, 922 sentences.**
  - The first 40 use about 1,000 words, so they are band A2-1 (QC 2026-10-29 §1.2).
  - Three A1-2 stories use only the 690-word A1 syllabus and close its last gaps.
- **Context coverage of the A1 syllabus: 100 % (690 / 690)**, gated by `content/de/lexicon/context-uncovered.json` (empty) in `content:validate`.
  - The committed report is `content/reports/de/context-coverage.json`.
  - Before QC 2026-10-29 the measure was 92 % of a 1,029-word list.
- The resolver handles German endings and umlaut plurals through the plugin's `storyEndings`, plus a per-story token map for irregular forms.
- `plan/STORIES-PLAN.md` holds the 40–50-per-language plan; es and fr top-ups are still to do.

### Changed
- **The course `de-vi`** (P3c toolkit with staging, every step through `emit` / `ingest` / validators, promoted with `author.ts promote --allow-missing-audio`):
  - 6 sections, 27 units, 108 lessons, **704 exercises** of all 15 types:
    - select 212, fillBlank 115, typeAnswer 92, wordBank 81;
    - listeningComprehension 35, articleSelect 32, conjugationCloze 26, match 25;
    - readingComprehension 23, speakProduction 20, guidedWriting 14, speakRepetition 10;
    - dictation 9, interactionScenario 8, simpleForm 2.
  - 35 objectives; 23 concept cards + 12 paradigm tables; Vietnamese guidebooks.
  - Lexicon: 1,288 lexemes with Vietnamese glosses (frozen ids kept). The Goethe Wortliste coverage check added 291 missing core words through `lexicon-add`.
  - **A1 syllabus (QC 2026-10-29 §1.2): 690 lexemes**, committed as `content/de/lexicon/syllabus.json`.
    - The 690 are the Wortliste headwords, the words a lesson teaches and the closed-class core.
    - The other 598 are band A2-1 (`syllabus-a2-1.json`): still in the lexicon, used by A2-1 stories, not offered as daily words.
  - Reception: 40 readings (24 exam) and 244 clips (30 exam, 134 partner turns), cast A `thorsten-high` / B `kerstin-low`.
  - Speech, writing and scenarios: 54 speech items (24 reserved), 36 writing tasks (20 reserved), 22 scenarios (14 reserved).
  - Assessment: 7 checkpoints (102 items) and a 4-stage, 28-item placement.
  - **Goethe A1 practice track** `content/de/exam/goethe-a1.json`: 70 original items, 2 disjoint forms × 35.
  - `content/courses/de-vi.profile.json`: `role: primary`, `allowUnreviewed`, `betaUntilReviewed`.
- **Syllabus rule:** a word added by the course's own `lexicon-add` step (example key `add`) belongs to the syllabus (`courseSelected`). This change re-derived `content/es/lexicon/syllabus.json` (627 lexemes).
- **Toolkit:**
  - `author.ts promote --allow-missing-audio` sets aside only "audioTarget has no audio" errors; every other error still blocks.
  - `scripts/stories.ts --staged` and `scripts/context-draft.ts` measure staged work.
- **CI:** LanguageTool gate for de-vi. The compile-golden recompile test timeout is now 900 s; local Windows needs about 510 s, CI about 17 s.
- **Tests updated for a second German course:**
  - catalogue and onboarding: hidden courses are now `de-en` and `es-en`;
  - de-vi grade targets: 196;
  - the "no authored pedagogy" examples moved to it-en.

### Gates
Real runs on GitHub Actions (PR #49). Nothing is claimed from a phone.

- **Audio** (`audio.yml` generate, all, run 40815633778, head `5832d22`): success.
  - The bot commit is `52417e1`.
  - Strict QA (`content/reports/de/audio-quality.json`): 1,388 clips, 1,208 unique assets, **0 technical failures**, 11 sentence clips for review. They are re-synthesised in the next de run (QC 2026-10-29b §3.4). de audio is 5.63 MB.
  - Before this success, four runs failed on 1–3 letter words below the 0.25 s floor: 40758568130 and 40769226097 (du, Sie), 40782316966 (du), 40809387767 (Sie). Each failure came only after 1–2.5 h of ASR. The pipeline fix (fail-fast checks, ASR cache, padding instead of slow-down) is on `phase-4/ai-review`.
- **CI on `1176b76`** (run 40850339435, pull_request): every job green.
  - Five timezones (UTC, America/Los_Angeles, Asia/Tokyo, Pacific/Pago_Pago, Pacific/Kiritimati): 1,689 unit/content tests, 63 runtime goldens, jest 12 suites / 79 tests, `content:check`, `audio:check` (3,511 baseline files), web e2e (web, guide, exam).
  - export-size: green.
  - **LanguageTool:**
    - es-vi: 3,820 strings, 101 matches, all allowed, 0 failing, 0 stale.
    - **de-vi:** 4,676 strings, 249 matches, all allowed, 0 failing, 0 stale. The gate took 84 s for the batched screen.
    - The de-vi gate had never finished before: German costs about 0.9 s per request, and its 20-min job was cancelled every time. It now screens in batches and re-checks each touched string on its own (`0aa9493`).
    - The first full run found 267 findings. 19 were fixed in the content (none of them carry audio). 248 are allowed with reasons in `content/de/languagetool-allow.json`, and no rule is disabled.
- **Device acceptance on `1176b76`** (run 40850339650, pull_request): both APK builds green; 6 emulator shards (API 30 + 34 × core, lessons, backup-upgrade). See the PR checks for the final state. On `52417e1`, run 40831169624 was 6/6 green and run 40836205696 on `3065d2f` was 6/6 green.

### Device
Not run. It needs the owner: OWNER-FINAL-CHECKLIST D, adapted to `de-vi`. The timed mock's Sprechen part needs a phone with German speech recognition.

### Docs updated
- `docs/USER_GUIDE.md` and `docs/USER_GUIDE.vi.md`: the de-vi section and Goethe A1 practice.
- `release/KNOWN_LIMITATIONS.md`: de-vi unreviewed; German stories text-only; the two remaining Goethe differences.
- `release/ASSET_DELIVERY.md`: per-language audio projection and the story-audio decision.
- `plan/STATUS.md` and `plan/OWNER-FINAL-CHECKLIST.md` B: de-vi Tier-1 vi + de, and the 43 German stories.
- This report.

### Open questions / risks
- **Native review is still to do:**
  - both Tier-1 files;
  - the 43 story translations;
  - the German of readings, scripts, model answers and exam texts.
- **German stories are text-only** until per-language asset packs exist (`release/ASSET_DELIVERY.md`). With their audio, German would be about 17 MB against the 12 MB budget.
- **es and fr story top-ups** to 40–50 per language (`plan/STORIES-PLAN.md`) are still open.
- **Writing and speaking points are coarse:** deterministic rubric pass/fail per item.
- **Section practice uses both mock forms,** so a later mock can repeat questions; the app says so.

### Owner actions
- Sign `content/de/REVIEW-TIER1-vi.md`, then tell Claude the name and date so it can record `review` in the profile.
- Hire a German teacher for `content/de/REVIEW-TIER1-de.md` (2–3 hours).
- Device walk of `de-vi`:
  - onboarding;
  - a lesson per section;
  - a checkpoint;
  - the timed Goethe mock, including Sprechen.

### Next
P3d(it): it-vi + CILS A1, under the same QC rules. Then P3d(pt), then P4b.

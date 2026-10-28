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
  - Hören Teil 2 can be played twice (product rule §67; heard once in the real exam).
- **Exam engine additions** (tests first):
  - task format `mcq2`: richtig/falsch and a/b, exactly 2 options, fixed order;
  - optional task `points` that weight a section, on every task of a section or on none.

**§4 — stories.**
- **40 German stories** (856 sentences, band A1-2), all written to close the coverage gap.
- Context coverage of the German syllabus rose from 8 % to **92 % (947 / 1,029 lexemes)** (`content/reports/de/context-coverage.json`).
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
_To be filled from the CI run on the audio bot commit._

### Device
Not run. It needs the owner: OWNER-FINAL-CHECKLIST D, adapted to `de-vi`. The timed mock's Sprechen part needs a phone with German speech recognition.

### Docs updated
- `docs/USER_GUIDE.md` and `docs/USER_GUIDE.vi.md`: the de-vi section and Goethe A1 practice.
- `release/KNOWN_LIMITATIONS.md`: de-vi unreviewed; the three Goethe differences.
- `plan/STATUS.md` and `plan/OWNER-FINAL-CHECKLIST.md` B: de-vi Tier-1 vi + de, and the 40 German stories.
- This report.

### Open questions / risks
- **Native review is still to do:**
  - both Tier-1 files;
  - the 40 story translations;
  - the German of readings, scripts, model answers and exam texts.
- **82 syllabus lexemes still lack a context sentence.** A few more stories would close them.
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

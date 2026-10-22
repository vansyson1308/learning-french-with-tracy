# P3e — harden the course template on `es-vi`

Session: 2026-10-22 (Claude Code, autonomous loop). Branch `phase-3/es-vi-hardening`.
Prompt: `plan/prompts/P3e-harden-template-es.md` (QC findings on PR #39, which was merged first).

## REPORT P3e
Branch / PR: `phase-3/es-vi-hardening` → `main`; PR: see `plan/STATUS.md`.

Changed, item by item:

1. **DELE A1 to the 2020 model** (`26e786c`). Exam schema v2: task formats `mcq3`,
   `pictureMcq`, `matchToPool` / `completeFromPool` (one lettered pool shared by several
   items, fixed order, distinct keys), `form`, `short_text`, `monologue`, `conversation`;
   per-task stimulus word bands, plays per recording, speaking minutes; pass rule as score
   groups (Reading + Writing, Listening + Speaking, 30 of 50 each) with readiness taken from
   the weaker group. `content/es/exam/dele-a1.json` re-authored (`trackVersion` 2): Reading
   4 tasks / 45 min, Listening 4 / 25 min, Writing 2 / 25 min, Speaking 3 / 10 min, two forms,
   110 items; exam texts are reserved (lessons cannot use them). References recorded in
   `formatSource.references`; **the official guide could not be opened** (2026-10-21 and
   2026-10-22: examenes.cervantes.es → maintenance page, web archive unreachable), so
   `checkedAgainstOfficialGuide` stays `false` and the app says so.
2. **Daily new words** (`268dfae`). Lexical syllabus `content/<lang>/lexicon/syllabus.json`
   (Spanish: 613 A1 lexemes after §8; French derived at compile time from its 126-lexeme
   lexicon), compiled to `<lang>-daily.json`; Today adds N unseen syllabus words from units the
   learner has reached; Profile → Learning → New words a day (0–15, default 5); persist v6
   (`dailyNewWords`, numbered migration + fixtures + backup round trip); lint
   `syllabus-coverage` (every lesson lexeme is in the syllabus).
3. **No thin lessons, no repeats** (`0bf9d92`). Lesson-shape gate for every non-legacy
   course: ≥ 5 exercises per teaching lesson, `lessonKind` scenario/form, no repeated payload
   in a lesson; `es-vi` now 108 lessons / 712 exercises. French opts out
   (`legacyLessonShapes`, byte-identical).
4. **Peninsular Spanish, Latin-American accepted** (`adb6ffa`). `content/es/VARIETY.md`;
   lexeme `variety { region, equivalent }`; regional forms rejected in model text and
   accepted in answer lists; teach-card note "Ở Mỹ Latinh: …"; vosotros forms in paradigms
   and notes. Three rewrite artefacts it left in guidebooks were found by the §8 review files
   and fixed.
5. **Audio QA** (`a8f2bd2`, canaries `c5a696f` `2fe5dee` `7237d04` `2fe21f4`). Korean scored
   by character error rate; one-word clips checked against an absolute duration band.
   Results: **ko** A `melotts-ko` (mean CER 0.14, 0 technical failures — was
   `no-clean-voice`), **ja** A `kokoro-jf_alpha` / B `kokoro-jm_kumo`, **zh** A `melotts-zh` /
   B `kokoro-zm_yunjian`, **vi** A `vais1000-medium` (audited with Whisper medium). The first
   ja run lost a push race; `scripts/ci/bot-commit.sh` now stashes run leftovers and resolves
   golden-only conflicts before re-gating (`1b5a02b`).
6. **French simple-form card** (`50dc5a1`), the one approved French change: French
   `simpleForm` exercises show their cue card; golden re-blessed with the reason
   "fr simpleForm info card (bug fix approved 2026-10-22)".
7. **Default course by UI language** (`0968df8`). The compiler emits
   `defaultCourseByNative` in its default order: `vi` → `fr-vi` (an `en-vi` would sort first),
   `en` → `fr-en`; onboarding preselects it; `LEGACY_FLAT_COURSE_ID` untouched; tests for both
   locales.
8. **Tiered review** (`0874b0f`, `dc28fbc`, `772be25`).
   - `content/es/REVIEW-TIER1-vi.md` (352 lines) and `REVIEW-TIER1-es.md` (313 lines, brief in
     Vietnamese + English) from `bun scripts/author.ts review-tiers --course es-vi`; they replace
     the 6,230-line checklist.
   - LanguageTool gate (`scripts/languagetool.ts`, CI job `languagetool`, LanguageTool 6.6 LGPL,
     hash-pinned, runner only, never shipped): 3,809 distinct Spanish strings, 101 matches, all
     allowed with reasons in `content/es/languagetool-allow.json` (deliberate wrong options,
     names, accent-free accepted answers, syllable splits); stale allowances fail too. It
     found real errors: *la alma / la área / la habla / la haya*, *la tv*, *tipar*, the ETL
     artefact *el friend* (now *la amistad*), 32 bad examples.
   - Back-translation pass over all 3,024 Spanish/Vietnamese pairs:
     `content/es/_drafts/BACKTRANSLATION.md`, every flag resolved or justified. It exposed a
     **systemic ETL defect**: a form's count is split between every lemma sharing it, so
     *asir* took the frequency of *así*, *casar* of *casa*, *ademar* of *además*. 35 such
     lexemes lost their frequency and left the syllabus; course-authored core words (23, e.g.
     *siete, enero, la farmacia*) joined it. No id added or removed.
   - `betaUntilReviewed` on es-vi: the Learn tab shows "Bản beta — nội dung đang được duyệt"
     until `review` is recorded; `allowUnreviewed` stays true.

Also: `plan/prompts/P3e-harden-template-es.md` copied and the P3e row added after P3d(es)
(`15d1e7d`).

Gates (local, Windows): see the PR description for the final run — typecheck, lint,
`bun run test` (1,528 pass, UTC), `content:validate`, `content:check`, `audio:check`,
goldens (re-blessed with reasons only), LanguageTool, jest, e2e web / guide / exam (en) and
web / guide (vi). CI runs the 5 time zones.

Spanish audio: `generate es all` (pack + reception + lexicon) dispatched on the branch after
the text was final; its result is recorded in `plan/STATUS.md`.

## Template notes for P3d de / it / pt
- Run the lesson-shape, variety and syllabus gates from the start (they are generic).
- Before authoring a lexicon, check the pool for homograph-inflated lemmas (secondary zipf
  missing or < 3.5 while the measured rank is high) — the ETL rule is unchanged.
- Give each language a `languagetool-allow.json` and add the course to the CI job.
- Generate the two Tier-1 files instead of a full checklist; set `betaUntilReviewed`.

## Open questions
- The DELE figures still need one look at the official 2020 guide once the Cervantes site is
  back (`formatSource.references`).

## Owner actions
- Sign `content/es/REVIEW-TIER1-vi.md` (then `review: { native, date, checklist }` in
  `content/courses/es-vi.profile.json`; the beta label disappears) and have a Spanish teacher
  go through `REVIEW-TIER1-es.md` (2–3 h).
- When examenes.cervantes.es is back, compare `content/es/exam/dele-a1.json` with the guide
  (or send the page text to the next session).
- Device walk on the next RC: onboarding in Vietnamese preselects `fr-vi`; es-vi shows the beta
  label, a daily-words session, the DELE timed mock.

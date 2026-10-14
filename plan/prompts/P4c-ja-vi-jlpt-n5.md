# P4c — `ja-vi` A1-equivalent course with a JLPT N5 exam track

Read `CLAUDE.md`, `plan/07-PRODUCT-SPEC.md` §4.3, `plan/05-RESEARCH-MARKET.md` §2.1 (labour export, JLPT), `plan/06-RESEARCH-OPEN-RESOURCES.md` §1.6, §2.4, `plan/authoring/BLUEPRINT.md`, `STYLE-vi.md`. Branch `phase-4/ja-vi`. Follow `P3d-author-course-vi.md` with `<target> = ja` (same steps, all learner-facing text in Vietnamese) plus the additions below; multi-session. End each session with the REPORT block.

## Goal
Japanese for Vietnamese speakers to French parity (A1-equivalent, CEFR-aligned objectives from the CV plus JF Standard by identity) **and** the first exam track (JLPT N5: vocabulary ≈800, kanji ≈100, grammar points, question formats 文字・語彙 / 文法 / 読解 / 聴解, mock test, readiness estimate).

## Tasks
1. Lexicon via P3a ETL: openjlpt N5 (+N4 tail) anchors, JMdict glosses, wordfreq ja ranks, readings from P4b; ≈900 lexemes with `glosses.vi` reviewed.
2. Exam-track feature (engine, reusable for HSK/TOPIK): `content/<lang>/exam/<track>.json` = levels → item banks per section with the same reserved/teaching split, timing, scoring, `readiness {vi,en}` wording rules (never "will pass"; "mức sẵn sàng ước tính"); UI: Exam tab card, section practice, timed mock, result with weak-area list feeding FSRS; validators; honest-claim test (reuse claim-gate pattern).
3. Audio: Kokoro ja or MeloTTS-JP (MIT) via P3b, two voices, canary with pitch/long vowels/geminates; SenseVoice/Whisper ja audit with CER.
4. Author all layers with the toolkit (P3c) per the P3d steps, scenarios around work in Japan (factory safety instructions, 面接 basics, konbini, city office, clinic, phone to employer), speech via `ja-JP` recogniser, writing with kana input.
5. Script primer (kana) mandatory before Section 1; romaji shown only until the learner passes the primer checkpoint.
6. Native review; claim gate; RC.

## Definition of Done
Validators + claim gate; N5 mock test runs offline with ≥ 2 forms; audio provenance; owner device walk; CI green; `plan/STATUS.md`.

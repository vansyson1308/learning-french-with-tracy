# P3e — QC fixes on `es-vi` and hardening the course template (before de/it/pt)

Coordinator QC of PR #39 (2026-10-22). Branch `phase-3/es-vi-hardening` (off `main` after #39 is merged). Everything here must land **before** P3d is re-run for de/it/pt, otherwise each defect is copied three more times. End with the REPORT block. Report to the owner in short Vietnamese.

## 0. Merge #39 first
CI is green on #39 (12/12). Merge it (merge commit), then branch from `main`.

## 1. DELE A1 track is modelled on the OLD format — fix to the official 2020 specification (blocking: honesty)
Sources (Instituto Cervantes, official): `https://agenda.cervantes.es/sites/default/files/DELE_A1_v2020_Guia-de-examen.pdf`, `https://agenda.cervantes.es/sites/default/files/Especificaciones_DELE_A1_2020.pdf`, `https://examenes.cervantes.es/a1a2/a1_en.htm`. Fetch them yourself to confirm before changing; record URL + retrieval date in `content/es/exam/dele-a1.json` `formatSource` and remove the "not yet checked against the official guide" disclaimer once matched.
Required structure:
- **Reading** 45 min, 25 items: T1 one text 150–175 words, 5 MCQ × 3 options (last item with images); T2 nine very short texts (20–30 words) → match 6 statements; T3 nine short ads → match 6 people's statements; T4 one text 175–210 words, 8 MCQ × 3 options. (Current: 5/6/8-matching/6 — wrong order and types.)
- **Listening 25 min** (current says 20), 25 items, each recording **played twice**: T1 five short dialogues, 5 items × 3 picture options; T2 five short announcements → match to 5 of 8 images; T3 eight statements of one monologue → match 8 sentence beginnings to 8 of 11 endings; T4 one conversation (160–185 words) → complete 7 statements choosing from 8 options. (Current T2 and T4 are MCQ — wrong.)
- **Writing** 25 min: T1 form, 15–25 words of short personal answers; T2 postcard/email/message/short letter, 30–40 words.
- **Speaking 10 min + 10 min preparation, 3 tasks** (current: 15+15, 4 tasks — the pre-2020 format): T1 prepared monologue on identity data 1–2 min; T2 prepared monologue on immediate surroundings 2–3 min; T3 conversation with the examiner about T1–T2 in which the candidate asks **two** questions, 3–4 min.
- **Scoring:** 25 points per test, 100 total; Group 1 = reading + writing, Group 2 = listening + speaking; **≥ 30/50 in each group** for "Apto"; 1 point per correct objective item, no negative marking. The readiness estimate must use this group rule (never a single total), and keep the wording "mức sẵn sàng ước tính".
- Engine changes needed: item formats `pictureMcq` (image options — use emoji/OpenMoji tiles, licence-registered), `matchToPool` (N items → M > N options, no reuse), `completeFromPool`; per-section "play twice" policy; group-based pass rule in the exam-track engine (generic: `passRule: {groups: [{sections, min}]}` so Goethe/JLPT/HSK/TOPIK can declare theirs). Re-author the item banks for both forms A/B; validators enforce counts per task and word-length bands; tests.

## 2. Vocabulary depth — 135 taught words is not A1 (blocking: product quality)
The pack teaches 135 unique words while `content/es/lexicon` has 887 lexemes (762 lint findings are "never taught / taught once"). French has the same weakness (126). Fix it once in the engine, for every course:
- **"Từ mới mỗi ngày" (lexicon-driven new words):** the TODAY composer introduces N new lexemes per day (default 5, setting 0–15) from the course's lexicon in frequency/anchor order, filtered to the learner's unit progress (only lexemes whose `topic`/band is unlocked), each as a teach card (word, article/gender, IPA, Vietnamese gloss, 1 example with Vietnamese translation, audio) followed by FSRS `recognize` (+ `listen` when audio exists). These items go through the existing evidence gate; they never count toward the CEFR claim.
- Course syllabus target: **≥ 600 lexemes reachable for A1** per Latin-script course (`syllabus.json` lists which lexemes belong to A1 and which unit unlocks them); lessons must use every A1-syllabus lexeme ≥ 2 times across exercises *or* it is delivered by the daily-words stream (linter reports which path covers each lexeme; 0 uncovered allowed).
- Audio: run the `layer=lexicon` generation for es (surfaces + examples).
- Apply to fr as well (French content unchanged; only the new stream reads the existing French lexicon) — golden re-bless limited to TODAY composer snapshots, with a CHANGELOG reason.

## 3. Thin lessons and duplicates (template defects copied from French)
- 41 of 108 lessons have ≤ 2 exercises. Linter becomes an **error**: every teaching lesson ≥ 5 exercises (exemptions only for lessons whose single item is an `interactionScenario` or `simpleForm`, declared via `lessonKind`). Fill the es lessons.
- 3 duplicate payloads (`uf-l0-e4 = uf-l3-e5`, `uf-l2-e4 = uh-l3-e3`, `un-l0-e0 = un-l3-e0`) — fix; `duplicate-payload` becomes an error for all non-fr courses.
- `distractor-pos` (12): fix the 12 cases (e.g. *hoy* among nouns); keep as warning.
- Unit title "Những động từ hiệu quả cao" is a literal calque of "high-yield verbs" — use "Những động từ dùng nhiều nhất". Add to `STYLE-vi.md`: avoid calques like "hiệu quả cao", "tần suất cao" in learner-facing titles.

## 4. Spanish variety is inconsistent (boleto 41 / billete 15, jugo 17 / zumo 2, carro 2 / coche) and the selected voices (Kokoro ef_dora / em_alex) are Peninsular
Decision (coordinator): **teach Peninsular Spanish (español de España)** as the production model — DELE is administered by Instituto Cervantes, the chosen voices are Castilian, and one variety must be consistent — while **accepting** the main Latin-American equivalents in graded answers and showing them as "Ở Mỹ Latinh: …" notes in glossary/teach cards. Add `content/es/VARIETY.md` (pairs: billete/boleto, zumo/jugo, coche/carro, ordenador/computadora, móvil/celular, vosotros forms taught for recognition at A1 + ustedes). Linter: flag any non-Peninsular form in target text unless marked as a variant note. Re-run the es audio generate after the text change. `vosotros` must appear in paradigms for recognition (currently absent).

## 5. Korean "no clean voice" is a measurement bug, not a voice problem
`content/reports/ko/audio-canary.json`: reference "커피와 피자를 팔아요." vs heard "커 피와 피 자를 팔 아요" scores WER 2.0 — SenseVoice inserts spaces; Korean must be scored like ja/zh: **CER on NFC Hangul syllables with all whitespace and punctuation removed**. Fix the ko normaliser + metric in `scripts/audio-asr-audit.py` and the ko language plugin, add a test with exactly this pair, re-run the ko canary. Expected: MeloTTS-KR passes. If it passes, ko courses get bundled audio; dialogues use one voice with clear A/B speaker labels (no second licence-clean Korean voice exists — record this in `KNOWN_LIMITATIONS.md`).
Also: ja B = None and zh B = None although `kokoro-jm_kumo` (0.11) and `kokoro-zm_yunjian` (0.045) pass on the pack layer — their reception-layer runs had technical failures (1 and 4). Read the per-clip technical reasons (likely the speaking-rate band or edge silence for CJK), fix the band/trim, re-run, and select B. vi: re-audit with faster-whisper **medium** (base returned empty/digit transcripts) — low priority, UI audio only.

## 6. French simple form without its info card — approved
The French `simpleForm` items say "fill in from the card" but no card is shown (same bug as es, already fixed there). Coordinator approves fixing French content: render the card for fr as well; this is the one allowed French content change in this milestone — golden re-bless with CHANGELOG reason "fr simpleForm info card (bug fix approved 2026-10-22)".

## 7. Default course by UI language
D-1 says Vietnamese is the UI/native language for the national app. Onboarding preselection must follow UI language: `vi` → first `-vi` course in catalog order (fr-vi today; en-vi when it exists), `en` → fr-en. Keep `LEGACY_FLAT_COURSE_ID` for migrations untouched. Tests for both locales.

## 8. Review load — replace the 6,191-line checklist with a tiered review
The owner is a native Vietnamese translator (EN/FR), not a Spanish teacher. Generate instead:
- `content/es/REVIEW-TIER1-vi.md` — only high-impact Vietnamese prose (guidebooks, concept explanations, exam instructions, rubric/feedback messages, scenario goals): target ≤ 600 lines, grouped by unit, with the Spanish shown for context. Owner reviews this.
- `content/es/REVIEW-TIER1-es.md` — high-impact **Spanish** strings (reading/listening scripts, scenario partner lines, model answers, exam texts): ≤ 500 lines, for a hired Spanish teacher (2–3 hours). Include a short brief in Vietnamese + English for that reviewer.
- **Automated tier:** (a) LanguageTool (LGPL, run in CI as a dev tool only, never shipped) on every target-language string for es (and later de/fr/pt/it), errors fail the build unless whitelisted with a reason; (b) a back-translation consistency pass done in a Claude Code session: each Vietnamese gloss/translation vs its Spanish source, flags written to `content/es/_drafts/BACKTRANSLATION.md`; resolve or justify every flag.
- `allowUnreviewed` stays true until Tier-1 vi is signed by the owner; the app shows "Bản beta — nội dung đang được duyệt" on es-vi until then.

## Definition of Done
#39 merged; DELE track matches the 2020 spec (counts, durations, formats, group pass rule) with sources recorded; daily-words stream live for es and fr with ≥ 600 A1 lexemes reachable for es; 0 thin teaching lessons, 0 duplicates; Spanish variety consistent + variants accepted; ko re-scored and audio status updated, ja/zh B voices resolved; fr simpleForm card; locale-based default course; tiered review files + LanguageTool gate; es audio (pack + reception + lexicon) generated; all gates green; `plan/STATUS.md` and `plan/reports/P3e.md`. Then continue with P4a, then P3d for de/it/pt using the hardened template.

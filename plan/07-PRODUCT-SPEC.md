# Product spec v2 — from "Learning French with Tracy" to a Vietnamese-first national language app

Status: APPROVED by the owner on 2026-10-14 with D-1/D-2 fixed as below. Everything here is derived from `02`–`06` in this folder.

## 1. Positioning

**One sentence:** a free, offline, no-account, no-ads language app whose engine is as rigorous as Anki + a real course (CEFR-aligned path, FSRS review, listening/reading/speaking/writing/conversation, honest level estimate), built for Vietnamese learners first.

**Why this and not "8 languages from English":** Vietnam learns EN, ZH, JA, KO (jobs, exams, labour export); most adults cannot learn JA/ZH *through English* (EF band "moderate"); every local winner sells in Vietnamese; Duolingo's AI features do not exist for the from-Vietnamese courses; subscriptions are resented and arbitraged (Super resold at 350k VND/yr) while one-time exam packs are normal (`05-RESEARCH-MARKET.md` §2, §6).

**Moat (keep, never trade away):** no network by default → "No data collected" badge; offline; no account to share; provenance/licence gates; honest CEFR estimate; open-source engine.

## 2. Decisions

| id | decision | default (recommended) | alternative |
|---|---|---|---|
| **D-1** Direction | Native/UI language | **DECIDED: Vietnamese is the native/source and UI language for every course.** All learner-facing text (instructions, explanations, feedback, rubrics, can-do, goals, screens) in Vietnamese; English UI kept as a second UI language; `fr-en` kept as the only English-source course (already complete) | — |
| **D-2** Course priority | Order of full courses | **DECIDED: all 8 targets to French parity, from Vietnamese:** `fr-vi` (translation of fr-en) → `es-vi` (first new course, proves the template) → `de-vi`, `it-vi`, `pt-vi` → `ja-vi`, `zh-vi`, `ko-vi` → **`en-vi` recommended addition** (largest VN market). The 7 inherited `*-en` basic packs are retired from onboarding when their `-vi` course ships. Each course gets an exam track (DELF/DELE/Goethe/CILS/CAPLE A1, JLPT N5, HSK 1–2, TOPIK I, VSTEP/TOEIC basics) | — |
| **D-3** Brand & identity | App name / package id | Rename display name + slug to a language-neutral brand before the first Play upload (package id `com.vansyson1308.learningfrenchwithtracy` is invisible to users and can stay; changing it = `apply-identity.ts migrate`, cheap now, impossible after Play upload) | keep "Learning French with Tracy" |
| **D-4** Keyed identities | FSRS card / lexicon ids | Keyed by **target language** (`en:w:apple`), shared across native languages (`en-vi`, `en-fr`…); learner progress stays per course | per course |
| **D-5** Audio | Scored stimuli | Build-time synthesis only (Kokoro / MeloTTS / Piper voices with licence gate), bundled; device TTS only for unscored playback | runtime on-device TTS (later, Phase 5) |
| **D-6** Network | Default | **None.** Opt-in features (BYO-key tutor, model-pack download) behind explicit consent screens and declared in Data safety | — |
| **D-7** Monetisation | v1 | Free; later one-time "ủng hộ"/exam packs (Phase 6); never ads/energy/hearts/leagues | — |
| **D-8** Speech stack | ASR | Device recogniser by default; optional on-device sherpa-onnx pack (Zipformer/SenseVoice/Moonshine) + GOP pronunciation scoring, English first | — |
| **D-9** LLM | Tutor | Constrained only (JSON-schema outputs, fixed taxonomies): optional on-device Qwen3-1.7B pack **or** BYO key; never an open chatbot, never touches grading/FSRS | no LLM at all |

## 3. Course model (after Phase 1)

```
CourseProfile {
  id: "en-vi",  targetCode: "en", nativeCode: "vi",
  recognitionLocale: "en-US", ttsLocale: "en-US",
  script: "latin" | "cjk" | "hangul" | "kana-kanji",
  idPrefix: "en",                      // lexeme ids en:w:*, objectives en.obj.*, clips en.clip.*
  capabilities: { fsrs, dailySession, lexicon, concepts, placement, checkpoints, goals,
                  listening, reading, speaking, writing, conversation, examTracks[] },
  languageRules: "src/lib/languages/en.ts" // articles, numbers, normalise, tokenise, fold
  artifacts: generated index of src/content/<target>/… for this course
}
```
- Content is authored under `content/<target>/` (lexicon, pedagogy, reception, speech, writing, interaction, assessment) exactly like `content/fr/`, with **native-language text keyed by nativeCode** (`glosses: {vi, en}`, `examples[].translations: {vi, en}`, `canDo: {vi, en}`), so one target corpus serves several native languages.
- Packs stay one file per course (`content/courses/en-vi.json`) because exercise prompts/options are native-language-specific.
- Everything French keeps working byte-for-byte: `fr-en` ids `fr:w:*` are frozen; golden tests pin the French compile output and runtime behaviour.

## 4. Feature set

### 4.1 Core (exists for French; generalised in Phase 1)
Path + sections + guidebook; FSRS-6 review (recognize/listen/speak); Today composer; lexicon browser; concept cards; listening/reading with bundled audio; speaking (repeat/produce) via device recogniser; guided writing with deterministic rubric; branching spoken conversations; placement; section checkpoints; capstone + honest CEFR estimate; export/import backup; privacy/licences screens; light/dark; accessibility labels.

### 4.2 Vietnamese-first UX (Phase 2)
- UI language setting (vi default on vi-locale devices, en otherwise); every string through `t()`; Vietnamese explanations in concept cards, feedback, rubric messages, goals.
- Script/sound onboarding modules per target: pinyin + tones (zh), kana + pitch basics (ja), Hangul (ko), nasal vowels/liaison (fr), umlauts/final devoicing (de), rr/ñ (es), doubled consonants (it), nasal vowels (pt), stress/final consonants (en) — all explained in Vietnamese.
- Romanization/reading aids rendered (furigana/pinyin/RR) with a per-course toggle.

### 4.3 Exam tracks (Phase 4)
`examTracks[]` on the course: vocabulary list per level in FSRS (JLPT N5, HSK 1–2, TOPIK I, VSTEP/TOEIC basics for en), question-format practice, listening sets, a mock test, readiness estimate with the same honesty rules as the CEFR estimate (never "you will pass").

### 4.4 Breakthrough features (Phase 5) — each behind a capability flag, each shippable alone
1. **Pronunciation coach (headline):** optional on-device ASR pack (sherpa-onnx, Apache/MIT) + forced alignment + GOP per phoneme over a small CTC model; Vietnamese-language tips keyed to known L1 errors per target language (from the pedagogy briefs); start with the language that has the best open acoustic models; transcript matching stays the fallback. Never gameable by repeating the prompt (random cue sentences, first attempt scored).
2. **Graded stories:** generated at build time from the frequency lexicon (every story ≥95 % known words + 3–5 new FSRS items), bundled audio, tap-to-gloss in Vietnamese, comprehension check; feeds FSRS `listen` skill.
3. **Learn from your own text:** paste / .srt / .epub → tokenise (Intl.Segmenter or bundled segmenter for ja/zh) → map to lexicon → highlight unknown → add to FSRS. Offline, no server.
4. **Mistake-driven grammar:** error taxonomy per language; writing/speaking mistakes clustered by rule; rule cards scheduled by FSRS; explanation in Vietnamese.
5. **FSRS visible:** retention forecast, "why this card now", per-user parameter optimisation (ts-fsrs optimizer), gentle streak with free freezes, no leagues/energy.
6. **Optional constrained LLM:** (a) on-device Qwen3-1.7B pack (download, RAM gate ≥4 GB) via llama.rn / react-native-executorch, or (b) BYO API key; tasks limited to error classification, Vietnamese explanation, roleplay turn variation; JSON-schema outputs; opt-in screen; privacy policy + Data safety updated; import-graph test keeps it out of grading.
7. **Share without a server:** export/import decks, stories, progress as files/QR.

### 4.5 Explicitly not doing
Energy/hearts/leagues/gem shop; aggressive notifications; open-ended chatbot as the product; accounts/servers/analytics; GPL engine code or NC/unknown-licence voices in the APK; 1 GB+ mandatory downloads; eight thin EN-source courses on the storefront.

## 5. Content pipeline v2 (Phase 3)
`scripts/lang/<code>/` plugins + generic ETL: kaikki/Wiktextract (CC BY-SA) for lemma/POS/forms/IPA/gender + FrequencyWords/wordfreq rank + CEFR/exam anchors (CEFR-J, NGSL, openjlpt, hsk30, NIKL) + Tatoeba examples + VI/EN glosses (kaikki translations, LLM fallback flagged for review) → `content/<target>/lexicon/` with the same fail-closed source manifest pattern as Lexique. Audio: build-time synthesis in a dispatch workflow with the existing licence gate extended to Kokoro (Apache) / MeloTTS (MIT) / Piper (per-voice) and the ASR round-trip audit (Whisper/SenseVoice; CER for ja/zh). LLM-assisted authoring scripts produce lessons/readings/speech/writing/scenarios/objectives/checkpoints **as drafts** that must pass every validator and a native-review checklist before compile. Licence rules: `06-RESEARCH-OPEN-RESOURCES.md` §7.

## 6. Non-functional
- APK: arm64 + armeabi-v7a only for Play (AAB splits); audio per course ≤ 6 MB; optional packs downloaded on demand.
- Mid-range Android (4 GB RAM, Android 13+ for on-device ASR; graceful fallback below).
- Every write to learner state transactional; move `reviewLog`/`cards` to SQLite (Phase 1) before volume grows.
- All tests green in 5 TZ lanes; content drift check; licence gate; identity gate; no secrets in repo.

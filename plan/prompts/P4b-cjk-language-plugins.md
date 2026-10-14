# P4b — Language plugins for Japanese, Chinese, Korean (script, segmentation, readings, grading)

Read `CLAUDE.md`, `plan/07-PRODUCT-SPEC.md` §4.2, **`plan/06-RESEARCH-OPEN-RESOURCES.md` §1.6–1.8, §3**, `plan/02-AUDIT-ARCHITECTURE.md` §2.5–2.6, `src/lib/languages/*` (P1b), `scripts/lib/languages/*` (P1c). Branch `phase-4/cjk-plugins`. End with the REPORT block.

## Goal
Everything the engine needs to teach ja/zh/ko correctly for Vietnamese speakers, before any course is authored.

## Tasks
1. Build-time (scripts): readings precomputed and stored in content — ja: kana reading + furigana segments per token (MeCab/UniDic via a pinned Python step in the lexicon workflow; kuroshiro fallback), pitch accent where JMdict/kaikki has it; zh: pinyin with tone marks per syllable from CC-CEDICT (traditional/simplified both stored, simplified shown by default); ko: Revised Romanization from a deterministic rule set (tests on the NIKL list). Schema: `Word.reading { kana?, furigana?[], pinyin?, rr? }`, lexeme `pronunciation.notation` adds `kana | pinyin | rr`.
2. Runtime plugin (`src/lib/languages/{ja,zh,ko}.ts`): `tokenize` (bundled lightweight segmenter: dictionary-based maximal match over the course lexicon + Intl.Segmenter when available), `normalizeLenient` (ja: kana width/long-vowel/kanji↔kana via the stored readings; zh: simplified/traditional fold + accept pinyin input with or without tones as *lenient*; ko: NFC jamo composition, spacing-insensitive lenient), `normalizeStrict`, `fold` for search (zh pinyin FTS; ja kana; ko jamo prefix), number words (ja native/sino counters, zh, ko native/sino), `charsPerSecBand`, `recognitionLocale` (ja-JP, zh-CN, ko-KR).
3. Speech grader: tokenisation by plugin; ASR text normalisation for ja/zh (no spaces); accept kana vs kanji variants from stored readings; tests with real recogniser outputs collected by the owner (Owner action: 20 sample transcripts per language from the phone, no audio).
4. Exercise renderers: furigana above kanji (ruby-like layout component), pinyin under hanzi, RR under hangul, toggle per course; input exercises accept kana for ja and pinyin-with-tones for zh as *practice* only (production evidence still requires the target script unless the course profile says otherwise).
5. Script onboarding modules (content type `scriptPrimer`): kana tables with audio, hanzi stroke/pinyin tones primer with minimal pairs, Hangul blocks — authored in `content/<lang>/primer/` with Vietnamese explanations; validators; shown in Section 1.
6. Grammar paradigm cells declared by plugin: ja (plain/polite × non-past/past × affirmative/negative, te-form), ko (해요체 present/past/future, honorific), zh (none; measure-word and aspect particle concepts instead).
7. FTS: `trigram` tokenizer for the cjk DBs; search tests for kana/pinyin/jamo.

## Definition of Done
Unit tests per plugin (≥ 40 cases each incl. tricky ones); synthetic `xx` extended with a cjk variant to run the validators; renderer snapshot tests; `fr`/`en` unchanged; CI green; `plan/STATUS.md` updated.

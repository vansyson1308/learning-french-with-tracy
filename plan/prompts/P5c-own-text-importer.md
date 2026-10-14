# P5c — Learn from your own text (paste / .srt / .epub → lexicon → FSRS)

Read `CLAUDE.md`, `plan/05-RESEARCH-MARKET.md` §4.8, `plan/07-PRODUCT-SPEC.md` §4.4(3), language plugins (P1b/P4b), `src/lib/lexicon/*`. Branch `phase-5/importer`. End with the REPORT block.

## Tasks
1. Import sources: clipboard/paste, `.txt`, `.srt`/`.vtt`, `.epub` (zip + XHTML extraction; no network, no DRM), via `expo-document-picker`; size caps; stored under the app's documents as learner-owned texts (included in backup v2; deletable).
2. Processing in a JS worker-ish chunked loop (keep UI responsive): tokenise with the language plugin, lemmatise via the lexicon forms table (kaikki forms from P3a — add a `forms` table to the SQLite DB), classify tokens known/learning/unknown/not-in-lexicon, frequency-sort unknowns, show coverage %.
3. UI: text reader with highlights and tap-to-gloss (vi/en), "add N words to review" creating FSRS cards (`recognize` only; item ids are lexeme ids — never raw surfaces for lexicon words; out-of-lexicon words become `user:<lang>:<lemma>` cards with user-entered gloss, clearly separated and excluded from any level estimate), sentence-level listening via device TTS (unscored).
4. Privacy: everything local; add to privacy inventory; file access only via the picker (no storage permissions).
5. Tests: tokenisation/lemmatisation fixtures per language, evidence gate, backup inclusion; docs.

## Definition of Done
Works for en/fr/es/de/it/pt and ja/zh/ko with the P4b segmenters; device walk; CI green; `plan/STATUS.md`.

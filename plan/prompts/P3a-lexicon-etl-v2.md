# P3a — Lexicon ETL v2 for all target languages (kaikki + frequency + exam anchors), Vietnamese glosses

Read `CLAUDE.md`, `plan/07-PRODUCT-SPEC.md` §5 and D-1/D-2, **`plan/06-RESEARCH-OPEN-RESOURCES.md` §1, §7 and the licence notes**, `plan/03-AUDIT-CONTENT.md` §4, `content/fr/lexicon/ACQUISITION.md`, `scripts/lexique-*.ts`, `scripts/lexicon-*.ts`, `.github/workflows/lexique-source.yml`. Branch `phase-3/lexicon-etl-v2`. End with the REPORT block.

## Goal
One generic, fail-closed lexicon derivation that produces `content/<lang>/lexicon/` for **fr, es, de, it, pt, ja, ko, zh (and en)** from open sources, with **Vietnamese glosses as the primary native text** (`glosses.vi`, `examples[].translations.vi`) and English as secondary. First full output: Spanish (~800 lemmas, A1–A2). For the other languages produce the derived evidence files and candidate pools so later milestones only author.

## Sources (licences in `06-RESEARCH-OPEN-RESOURCES.md`; re-verify the licence text at fetch time, pin sha256 like Lexique)
- kaikki.org Wiktextract JSONL per language (CC BY-SA 4.0 + GFDL): lemma, POS, forms (conjugation/declension), gender, IPA, senses, examples, `translations[]` (source of `vi` and `en` glosses).
- Frequency: hermitdave/FrequencyWords (CC BY-SA 4.0) primary; wordfreq data (CC BY-SA 4.0, cite DOI) secondary; SUBTLEX-PT (CC BY) for pt; Lexique 4 stays for fr.
- Anchors: openjlpt N5/N4 (ja), ivankra/hsk30 levels 1–2 (zh), NIKL learner list A/B (ko, KOGL-1, separate file), JMdict/KANJIDIC2 (ja, CC BY-SA, About-screen credit), CC-CEDICT (zh, CC BY-SA 3.0, one-way merge), CEFR-J/NGSL (en). For es/de/it/pt no licence-clean CEFR list exists → frequency-derived bands + the exam-syllabus *topic lists* as human selectors only (never copy entries from Goethe/Cervantes/Oxford lists).
- Vietnamese glosses: kaikki `translations[].code == "vi"` first; else `TODO:vi` which **blocks compile** until filled by the authoring toolkit (P3c) and reviewed. Never use FVDP/OVDP (GPL).
- Tatoeba (CC BY 2.0 FR; prefer CC0 subset) for examples with `vie` links where they exist.

## Tasks
1. Workflow `.github/workflows/lexicon-source.yml` (dispatch-only, generalising `lexique-source.yml`): inputs `lang`, `mode=recon|extract`; double-download, pin sha256/size/date in `content/<lang>/lexicon/source-manifest.json` (multi-source schema), licence texts captured under `content/<lang>/lexicon/sources/*.md`; raw dumps are run artifacts only (stream-parse; kaikki en ≈ 2 GB).
2. `scripts/lib/lexicon-etl/`: adapters (`kaikki.ts`, `frequencywords.ts`, `wordfreq.ts`, `subtlex-pt.ts`, `lexique.ts` wrapper, `anchors/*.ts`) → `CandidateLexeme` → `derive.ts` emits per language: `derived/candidate-pool.json`, `frequency-stats.json` (population quantiles → bands exactly as French), `morphology.json` (forms → paradigm cells from the language plugin; validators require evidence per taught cell), `gender-stats.json` (de/es/it/pt incl. neuter for de), `anchors.json` (exam level per lemma), `readings.json` for ja/zh/ko (kana/pinyin/RR — produced here, consumed by P4b).
3. `scripts/lexicon-author.ts --lang es --size 800`: anchor-first + frequency-filled + topic-balanced selection; writes `content/es/lexemes.json` (ids `es:w:<slug>`, frozen once committed) and `content/es/lexicon/lexemes.json` with `glosses {vi, en}`, 1–3 examples with `translations {vi, en}`, IPA (kaikki, mark notation), frequency, gender/article, confusables (same POS/topic + edit-distance heuristic), `sourceRefs` per field; `REVIEW.md` lists every `TODO:vi`, every auto-confusable and every untranslated example for the P3c review pass. Run it for es now; run `--size 0 --pool-only` for de/it/pt/ja/ko/zh/en so the pools and evidence are committed.
4. Validators (from P1c) run for every language with content; add rules: anchors consistency, registry coverage per source id, no GPL/NC ids, `glosses.vi` required for every lexeme of any `-vi` course before it can compile, `glosses.en` required for `-en` courses.
5. Compile → one SQLite DB per language (`assets/lexicon/<lang>-lexicon-v3-<hash>.db`), index, web fallback; Licences screen shows the new sources.
6. Docs: `content/<lang>/lexicon/ACQUISITION.md` per language, `LEXICON_LICENSE.md` per-language sections, `ATTRIBUTIONS.md` regenerated, `plan/STATUS.md`.

## Definition of Done
Spanish lexicon ≥ 700 lexemes validates (TODO:vi count reported and handed to P3c); pools/evidence committed for the other 7 languages; drift check clean; licences registered; `fr` unchanged.

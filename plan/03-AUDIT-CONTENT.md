# Content audit: learning-french-with-tracy (2026-10-14)

Every number comes from reading the repo (`content/`, `src/content/`, `scripts/`), counted with `python3 -I` over the JSON.

## 1. The 8 course packs (`content/courses/*.json`)

| course | sections | units | lessons | exercises | word entries / unique | romanization | audioTargets | audio policy | guidebook chars (total, min–max) | lesson `objectives` / `flow` |
|---|---|---|---|---|---|---|---|---|---|---|
| de-en | 1 | 5 | 20 | 220 | 60 / 55 | – | 200 | bundled (thorsten) | 4,158 (666–1,046) | 0 / 0 |
| es-en | 1 | 10 | 40 | 440 | 120 / 109 | – | 400 | bundled (davefx) | 7,879 (600–1,152) | 0 / 0 |
| **fr-en** | **6** | **27** | **108** | **604** | **172 / 126** | – | 203 | bundled (siwis) | 16,748 (136–1,780) | 108 / 17 |
| it-en | 1 | 5 | 20 | 220 | 60 / 56 | – | 200 | `device-tts` | 4,016 | 0 / 0 |
| ja-en | 1 | 5 | 20 | 220 | 60 / 58 | 60/60 | 200 | `device-tts` | 4,198 | 0 / 0 |
| ko-en | 1 | 5 | 20 | 220 | 60 / 57 | 60/60 | 200 | `device-tts` | 4,563 | 0 / 0 |
| pt-en | 1 | 5 | 20 | 220 | 60 / 56 | – | 200 | bundled (faber, pt_BR) | 4,315 | 0 / 0 |
| zh-en | 1 | 5 | 20 | 220 | 60 / 56 | 60/60 | 200 | `device-tts` | 3,991 | 0 / 0 |

Exercise types: the 7 non-French courses use only `select`, `wordBank`, `fillBlank`, `match`, `typeAnswer`. French uses all 15: select 271, wordBank 56, fillBlank 43, match 26, typeAnswer 34, articleSelect 20, conjugationCloze 33, listeningComprehension 35, dictation 7, readingComprehension 24, speakRepetition 9, speakProduction 20, guidedWriting 16, simpleForm 2, interactionScenario 8.

Unit titles: de/it/ja/ko/pt/zh = Basics 1 · Greetings · Food · Animals · Travel; es adds Family · Shopping · Weather · Work & School · Health. No CEFR claims outside French (validator forbids `objectives`/`objectiveTargets` elsewhere, "French-only metadata (§153)").

### 1.2 Structural finding: the non-French courses are one template
Every lesson in the 7 courses has the same 11-step sequence: select t→n ×3, select n→t ×2, select listen ×1, wordBank t→n ×2, fillBlank ×1, match ×1, typeAnswer translate ×1. 12 words per unit, 4 lessons per unit. wordBank is always target→native and typeAnswer always `translate` (answer in English) → **no target-language production anywhere** in those courses. French Section 1 (5 units, 220 exercises) is the same upstream template; Sections 2–6 are the new authored work. Word lists repeat across units (de 5, es 8 — la manzana/el agua/la leche ×3, ja 2, ko 3, pt 4, zh 4). All non-French content is upstream Lingo Lessons (MIT).

### 1.3 Quality defects by language
- **Japanese**: 14/20 fillBlanks are degenerate (`___。` with whole-sentence options), 2 have no blank; only 7/20 distinct sentences; romanization mixes Hepburn macrons (`kōhī`) with doubled vowels (`gyuunyuu`, `ohayou`); units 1–3 hiragana, Animals/Travel kanji without readings (兎, 象, 博物館, 切符).
- **Chinese**: all 20 fillBlanks degenerate; pinyin spacing inconsistent (`nán rén` vs `píngguǒ`); tone marks OK.
- **Korean**: 13/20 fillBlank sentences have spacing stripped (`저는___먹어요.`); romanization hyphenated in typeAnswer alternatives but plain RR for words.
- **ja/ko/zh**: 20 typeAnswer items each whose `alternatives` hold the romanized target sentence → typing the romanized prompt is accepted as a "translation". `Word.romanization` is never rendered anywhere (180 authored romanizations invisible).
- **Italian**: 3 fillBlanks have no `___` and apostrophe-stripped options (`it-en:u0-l3-e8`, `u2-l1-e8` "Bevo l'acqua." → `lacqua`; `u4-l0-e8` "Dov'è" → `Dovè`). Validator only checks `___` for conjugationCloze.
- **German**: Basics 1 guidebook calls *Ich* a "time word".
- **Spanish**: Latin-American text (jugo, boleto, computadora, no vosotros) with Castilian voice `es_ES-davefx`; canary mean WER 0.44 (worst selected voice).
- **Portuguese**: Brazilian text + pt_BR voice — consistent.
- **French**: answer-position bias — select 176/271 at index 0, listeningComprehension 35/35, readingComprehension 24/24, fillBlank 25/43 (`option-order.ts` shuffles only checkpoint/placement; lesson renderers show authored order; only `match.tsx` shuffles). 5 duplicate exercise payloads (`fr-en:u0-l2-e10`=`u2-l0-e10`, `ub-l0-e5`=`ue-l3-e5`, `s3-e5`=`s3-e24`, `s3-e17`=`s3-e63`, `s4-e27`=`s4-e33`). Exercise ids inconsistent: Sections 1–2 `fr-en:uX-lN-eN`, Sections 3–6 bare `sN-eN` (uniqueness only per pack → collision risk). Sections 4–6 thin: 41 lessons with ≤2 exercises; Section 5 guidebooks 136–179 chars. `src/content/pack.json` (340 KB) is an orphaned legacy es-en pack — delete.

## 2. French deep dive (`content/fr/**`)

| file | records | schema |
|---|---|---|
| `lexemes.json` | 126 surface → `fr:w:<slug>` | `FrLexemeMapSchema`; must equal `src/lib/learning/ids-fr.ts` |
| `lexicon/lexemes.json` | 126 rich lexemes | `RichLexiconSchema` |
| `lexicon/source-manifest.json` | Lexique 4, 37 pinned columns | fail-closed |
| `lexicon/match-overrides.json` | 4 | |
| `pedagogy/concepts.json` | 17 concepts | |
| `pedagogy/conjugations.json` | 8 verbs × 8 cells | |
| `reception/listening.json` | 177 clips (169 one-segment, 8 two-segment) | |
| `reception/reading.json` | 19 texts, 32 blocks, 13–30 tokens | |
| `reception/audio-canary.json` | 14 canary sentences | |
| `speech/items.json` | 50 (22 reserved, 42 scored-eligible, 28 with model audio) | |
| `writing/tasks.json` | 34 (30 guided/4 open; 16 reserved) | |
| `interaction/scenarios.json` | 18 scenarios, 214 nodes (92 partner, 84 learner, 38 terminal), 104 intents | |
| `assessment/objectives.json` | 34 objectives (23 essential; A1 direct 20) | |
| `assessment/checkpoints.json` | 7 checkpoints, 102 items (capstone 20, 2 parallel forms) | |
| `assessment/placement.json` | 4 stages, 16 clusters, 28 items | |
| `assessment/claim-policy.json`, `attainment.json` | 1 policy, 5 domain policies | |

Lexicon: POS noun 94 / verb 19 / interj 5 / adv 4 / expr 3 / adj 1; gender m 48 / f 46; 10 topics; IPA 126/126; frequency 123 (very-common 73, common 46, less-common 4). Concepts: gender ×4, être/avoir, -er verbs, futur proche, passé composé, cognates, false friends, numbers ×3, elision, liaison, h. Listening clips by kind: message 136, word_phrase 18, dialogue 8, announcement 7, factual 6, instruction 2; by prefix `ix_` 113 (interaction partner turns), teaching 29, checkpoint 10, speech models 19, placement 2, capstone 4. Objectives by category: grammar 8, lexical 5, written_production 5, written_reception 4, spoken_reception 4, spoken_production 4, interaction 2, phonology 1, strategy 1.

Checkpoints (demonstratedShare 0.66): section-1 12 select; section-2 18 (cloze 6, articleSelect 5, typeAnswer 3, fillBlank 2, select 2); section-3 22 (listening 11, reading 7, dictation 2, select 2); section-4 12 speakProduction; section-5 12 (guidedWriting 9, simpleForm 3); section-6 6 interactionScenario; a1-capstone 20 (4 per domain, 2 forms of 10).

Units → objectives: Section 1 (template) reading.familiar_words + vocab basics; Section 2 a–e gender/articles, high-yield verbs, cognates, numbers 0–100, elision/liaison; Section 3 f–j listening/reading families; Section 4 k–n formulaic / self-intro / give-info / describe; Section 5 o–r personal info / phrases / message / form; Section 6 s–v conversation + practical needs.

RESEARCH.md rationale (keep these rules for every new language):
- Pedagogy: clean-room; "always" only at ≥99.5 % with exceptions named, else "usually"; every taught conjugation cell must be evidenced in morphology data; numbers accept both hyphenations; spoken cues never labelled IPA.
- Reception: clips ≤ ~12 s, 1–2 speakers, 1–3 information units; texts ≤ ~60 tokens by unit 2, ≤ 90 by unit 5; mostly locate questions. **Scored input is bundled deterministic audio only; device TTS is never a scored stimulus**; scored playback 2 plays, normal rate, no transcript; slow mode ~0.85×. Voice canary with ASR WER gate.
- Assessment: CEFR CV 2020 cited by identity, no descriptor text reproduced; `direct` alignment needs real assessment; claim policy requires all 5 domains, ≥3 items and 2 independent inputs per direct objective, 2 task families + 2 scales per domain; vocabulary/lesson/XP counts never inputs; fixed wording "CEFR-aligned estimate — not an official CEFR examination or certification"; retakes: latest valid attempt wins, parallel forms rotate; option order randomized at administration only.
- Speech: STT accuracy ≠ pronunciation quality; repetition is practice, never production evidence; production ≠ interaction; on-device preferred, no cloud STT, raw audio cache only.
- Writing: separate open practice vs guided assessable; deterministic rubric (slots, length, plausibility, anti-gaming), tri-state, no LLM.
- Interaction: contingency on recognized intent; supportive interlocutor (repeat/rephrase/repair) part of the construct; scored learner turns first-attempt only; interaction never mutates FSRS.

Reports: `cefr-claim-gate.json` → A1 claimable = true (limitation: synthesized standard-French audio); PRE_A1 and A2 false. `grade-targets.json`: only fr has gradeTargets (256/604). Sources registry (10): upstream-lingo-lessons MIT; original-french-lexicon CC-BY-SA-4.0; lexique-4 CC-BY-SA-4.0; original-french-pedagogy MIT; ts-fsrs MIT; piper voices siwis CC-BY-4.0, upmc CC-BY-SA-4.0, thorsten/davefx/faber CC0. **Stale**: registry notes + `REVIEW.md`/`ACQUISITION.md`/`LEXICON_LICENSE.md` still describe "54 lexemes / Lexique not retrieved"; siwis entry covers only `assets/audio/fr/` though it is speaker A in `fr-reception`; no registry entry covers `content/fr/{reception,speech,writing,interaction,assessment}` (they use `sourceRef:"original-project"`; registry validator only checks courses + audio).

## 3. Audio

Inventory: `assets/audio` = 710 MP3 (64 kbps, 22.05 kHz mono), content-keyed (20-hex): de 95 (735 KB), es 189 (1.5 MB), fr 164 (1.3 MB), pt 96 (733 KB), fr-reception 166 (2.9 MB). `assets/sfx`: 3 synthesized tones. Baseline `content/audio/legacy-baseline.json`: 713 files, 7.24 MB, sha256 each. Unique speakable strings per course: de 95 / es 189 / fr 164 / it 95 / ja 98 / ko 95 / pt 96 / zh 96 (it/ja/ko/zh have none bundled).

Voices (all `rhasspy/piper-voices` v1.0.0, `piper-tts==1.2.0`): de thorsten-medium CC0 (canary WER 0.208); es davefx-medium CC0 (0.442; sharvard excluded CC BY 3.0 not allowlisted); fr siwis-medium CC-BY-4.0 (0.167) + reception B upmc-medium spk 1 CC-BY-SA-4.0 (mls excluded on WER, tom excluded AGPL dataset); pt faber-medium CC0 (0.229); it paola "See URL" excluded; zh huayan "Unknown" excluded; ja/ko no Piper voice. Full-generation mean WER (Whisper medium): de 0.173, es 0.252, fr 0.169, pt 0.345.

Pack pipeline (`scripts/pack-audio.ts`, `.github/workflows/pack-audio.yml`, dispatch-only; weights never committed): `recon` (double download, hash pin, MODEL_CARD license gate fail-closed: allow CC BY 4.0 / CC BY-SA 4.0 / CC0 / PD, deny AGPL/GPL/NC/ND word-bounded) → `plan --mode canary` (12 strings/voice) → piper → 0.35 s gaps → ffmpeg 64 kbps MP3 → `audio-asr-audit.py` (faster-whisper base) → `qa` → `select` (lowest mean WER, fail if > 0.6). `generate`: `verify` pins → `plan --mode generate` (every speakable string of every generated course) → synth + sfx → ASR medium → `qa --strict` → `apply` (assets, `audio-manifest.ts`) → `check-audio --write-baseline` → compile/validate → commit. Asset key = `sha256(JSON["pack", courseId, voiceId, speaker, text, 1.0, pipelineVersion])[:20]`. Technical QA: leading silence ≤ 1.0 s, trailing ≤ 1.2 s, chars/sec 3–30 (zh 1.2–12), volume/clipping. ASR review flag: WER ≥ 0.5 on ≥3-word clips; normalization NFC lowercase, œ→oe, ß→ss, digits removed, zh per character.

Reception pipeline (`scripts/reception-audio.ts`, French-only paths, `fr.clip.` regex, French ASR normalizer in `reception-asr-audit.py`): `recon` (allow CC BY 4.0 / CC BY-SA 4.0 only), `canary` (14 sentences × speaker sweep; report only), `generate` (every clip; `voiceCast` A/B; identical text shares assets: 177 clips → 166 assets; orphan asset = validation error). Last results: canary siwis 0.184 / upmc#1 0.197; quality 177 clips, 0 technical failures.

Reproduction recipe for a new language L: add `courses["L-xx"]` + `voices[]` to `content/audio/pack-audio-manifest.json` (or `{policy:"device-tts", reason}`); dispatch `pack-audio` `mode=recon courses=L-xx`; review canary; dispatch `mode=generate` with **every** generated course listed (apply rewrites the whole manifest); hand-review flagged rows. Whisper must support L; non-alphabetic scripts need a character-level branch in `audio-asr-audit.py` and a `charsPerSecBand`. Reception/speech/interaction audio needs the reception pipeline parameterized per language with two pinned voices and a language-specific canary.

## 4. Lexicon
Source Lexique 4.00 (CC BY-SA 4.0), `Lexique400.tsv` 33 MB / 189,863 rows / 37 columns, sha `fe333b4f…610a5a`, retrieved 2026-08-27, never committed. Workflow `lexique-source.yml`: `recon` → pin columns → `extract` (`lexique-derive.ts`: `lexique-subset.json` 126 evidence rows, `candidate-pool.json` 1,500, `frequency-stats.json` p95 = 12.472/M p99 = 97.203/M over 64,836 lemmas, `core-ranks.json`, `gender-suffix-stats.json` 27 suffixes + 273 endings, `verb-morphology.json` 446 entries) → `lexicon:crosscheck` → `lexicon:import` (frequency rawValue = 12_FreqLemme, rank, band very-common ≥ p99 / common ≥ p95 / else less-common; IPA = 3_Phono_IPA; sourceRefs matchKey `Mot|Cgram|Genre|Nombre`) → `content:compile` → `fr-index.json`, `fr-web-fallback.json`, `assets/lexicon/fr-lexicon-v2-<hash>.db` (SQLite: metadata, lexemes, examples, relations, sources, lexeme_sources, FTS5 `lexeme_fts`).

Per-lexeme fields the app needs (mapping target for other sources): required `id` (`<lang>:w:<slug>`, frozen — persisted in learner data), `surface` (course string incl. article), `lemma`, `lookupForm`, `partOfSpeech` (11 values), `gender` (nouns only, mandatory; values masculine/feminine/both/unknown — **no neuter**; article check hardcodes le/la), `nativeGloss` (byte-identical to pack `word.native`), `topic` (10 values), `examples[]` ≥1 `{fr, en, source}` (key literally `fr`), `sourceRefs[]`. Optional but feature-driving: `pronunciation {value, notation ipa|phonology, source}`, `frequency {source, rawValue per million, rank, band}`, `relations.confusables[]` (symmetric). Population data needed from a licensed source: frequency quantiles, verb morphology rows (form ↔ mood:tense:person; every taught cell must be evidenced), noun gender × ending stats, optional candidate pool.

## 5. Compiler & validators
Commands: `bun run content:validate`, `content:compile` (validation first; deterministic; containment-checked), `--check` drift guard. Generated targets (`GENERATED_TARGETS` in `scripts/lib/pipeline.ts`): `src/content/packs/*.json` + `index.ts` (gradeTargets emitted for fr only), `src/content/{lexicon,concepts,assessment,reception,speech,writing,interaction}`, `assets/lexicon/*.db`, `content/reports/*`, `ATTRIBUTIONS.md`, `src/content/attributions.json`. `src/content/catalog.json` is hand-maintained (counts validated). Compiled pack sizes: fr 542 KB, es 350 KB, others ~175–182 KB. No size budgets exist.

Validation rules (summary): pack id = filename, unique; exercise ids unique per pack; gradeTargets compiler-only; every audioTarget in manifest unless device-tts; select/fillBlank/listening/reading `correct` in range, no duplicate options; wordBank tokens multiset; match no duplicate targets; articleSelect no le/la on vowel/h noun; **listening, reading, dictation, articleSelect rejected outside fr-en**; French number drills agree with `french-numbers.ts`; lexeme map = `ids-fr.ts`; catalog counts; registry licence allowlist (MIT, Apache-2.0, CC-BY-4.0, CC-BY-SA-4.0, CC-BY-2.0-FR, CC0-1.0, original) and coverage of `content/courses/*` and `assets/audio/`. Lexicon: unique ids, every pack word present, gloss identity, lookupForm, article/gender consistency, topic, ≥1 example, confusables symmetric, sources registered, IPA not ASCII, frequency only from measurements. Pedagogy: concept ids unique, no CEFR labels in titles, flows cover every exercise once, conjugation tables complete, -er paradigm rules, every cell evidenced, cloze rules; concepts and conjugationCloze forbidden outside fr. Assessment (63 rules): objectives resolve, every objective taught, French lessons must declare objectives (forbidden elsewhere), CEFR sourceRef registered + documented, direct needs evidenceNote, checkpoint/placement items carry objective mapping, forms satisfy floors, placement ≤ maxItems, claim-policy domains, attainment covers essentials, capstone can't complete a domain. Reception: dialogues ≥2 segments both speakers; maxPlays 2; transcript/token caps; glossary surfaces appear; refs resolve; no orphan assets. Speech: exercise payload mirrors item byte-for-byte; repetition needs model clip, never scored; reserved items never teach; variants normalize non-empty/unique. Writing: mirror rule; formFields only on simple_form; minTokens < maxTokens; open never scored; no answer leak. Interaction: reachable graph, no dead ends, ≥1 goal_met terminal, noMatchNext via repair node, ≥2 learner turns, ≥2 scored for reserved, clips resolve.

Hardcoded French that blocks rich layers for any other course: all rich schemas `language: z.literal("fr")`; id regexes `fr\.obj`, `fr:w:`, `fr:concept:`, `fr\.clip\.`, `fr\.read\.`, `fr\.speak\.`, `fr\.write\.`, `fr\.scenario\.`, `fr\.checkpoint\.`, `fr\.pli\.`; `recognitionLocale: z.literal("fr-FR")`; example key `fr`; no neuter; le/la article logic; `CONJUGATION_CELLS` present-tense only; `compile-content.ts` loads only `content/fr/*`; runtime `capabilities.ts` FLAGS only for fr-en; `FR_COURSE_ID` gating in engine/evidence/sources/today/store/distractors.

## 6. Guidebook
`src/lib/guidebook-markdown.ts` parses a narrow markdown subset (h1–h3, bullets, paragraphs, bold/italic). `src/app/guidebook/[unitId].tsx` renders unit description + guidebook + "Key words" (emoji, target, native, speaker) — no romanization. All 8 languages have guidebooks (600–1,162 chars/unit non-French; French 16.7 K over 27 units, Sections 3–6 only 136–386). French grammar is mainly taught by the 17 ConceptSteps interleaved via lesson `flow` (French only).

## 7. Gap table: French vs each other language

| feature | fr | de | es | it | pt | ja | ko | zh |
|---|---|---|---|---|---|---|---|---|
| lesson pack | 27u/108l/604ex | 5/20/220 | 10/40/440 | 5/20/220 | 5/20/220 | 5/20/220 | 5/20/220 | 5/20/220 |
| target-language production | yes | no | no | no | no | no | no | no |
| rich lexicon + browser | 126 (Lexique 4) | no | no | no | no | no | no | no |
| FSRS gradeTargets + Today | yes (256 ex.) | no | no | no | no | no | no | no |
| concepts / flows | 17 / 17 lessons | no | no | no | no | no | no | no |
| conjugation drills | 8 verbs / 33 | no | no | no | no | new cells needed | new cells needed | n/a |
| article/gender drills | 20 | needs neuter | no | no | no | n/a | n/a | measure words instead |
| listening + dictation | 177 clips, 42 ex. | no | no | no | no | no | no | no |
| reading | 19 texts, 24 ex. | no | no | no | no | no | no | no |
| speaking | 50 items, 29 ex. | no | no | no | no | no | no | no |
| writing | 34 tasks, 18 ex. | no | no | no | no | no | no | no |
| conversations | 18 (214 nodes) | no | no | no | no | no | no | no |
| CEFR objectives / placement / checkpoints / capstone | 34 / 28 / 6 (82) / yes | no | no | no | no | no | no | no |
| bundled audio | 164 + 166 | 95 | 189 | device | 96 | device | device | device |
| licence-clean voices for A/B cast | 2 | 1 | 1 (dialect mismatch) | 0 | 3 | 0 | 0 | 0 |
| romanization shown | n/a | n/a | n/a | n/a | n/a | authored, hidden | authored, hidden | authored, hidden |

Consequence of the audio rule: scored listening, dictation, speech model clips and interaction partner turns need bundled licence-clean audio → it/ja/ko/zh need a new voice source (see `06-RESEARCH-OPEN-RESOURCES.md`: Kokoro it/ja/zh Apache, MeloTTS ja/ko/zh MIT, Piper vi CC-BY); de/es need a second voice for dialogues.

## 8. Effort to reach French parity (content only, per language)
Inventory: 22 units / 88 lessons / ~384 exercises beyond Section 1; +70 rich lexemes to 126 (12+ fields); ~15–20 concepts; 8 conjugation tables (0 for zh); 64 teaching/checkpoint/model clips + ~113 partner clips; 19 readings; 50 speech items (+100–200 variants); 34 writing tasks; 18 scenarios; 34 objectives; 102 checkpoint items; 28 placement items; ~230 pack + ~170 reception audio files.

Rough person-days (LLM draft + native review + validators): de/es/pt ≈ 40–65 each; it ≈ 40–60 (+ audio unblocked by Kokoro); ja/ko/zh ≈ 55–80 each (script/romanization, different grammar models, character-level QA). One-time engineering prerequisite: generalize schemas/regexes/compiler/gating (≈10–20 days) — see `02-AUDIT-ARCHITECTURE.md` §2.

Fix the existing Section 1 defects first: ja 16 broken fillBlanks, zh 20, it 3, ko 13 spacing; 60 romanized "translation" alternatives (ja/ko/zh); render romanization; ja romanization + kanji/kana normalization; de guidebook error; es voice/dialect decision (es_MX `claude` voice is Apache-2.0); French answer-position bias (shuffle options in lessons with a seeded RNG).

LLM-generatable (then native review + deterministic validators): lesson exercises, guidebooks, concept prose/examples, reading texts, listening scripts, speech items + variants, writing tasks + slot variants + model answers, scenario graphs, objective can-do text (original wording, no CEFR descriptors), checkpoint/placement items, glosses/examples/topics/confusables. Needs licensed/measured data: lemma frequency + quantiles, IPA/pronunciation, noun gender (+ suffix stats where claims are made), verb morphology evidence, TTS voices with clean model cards (≥2 for dialogue), romanization via deterministic tools.

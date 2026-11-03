# P4c — `ja-vi` working plan (Japanese for Vietnamese speakers + JLPT N5 practice track)

Prompt: `plan/prompts/P4c-ja-vi-jlpt-n5.md`, following `P3d-author-course-vi.md` with target `ja`. Branch `phase-4/ja-vi`.
Model: the en-vi course (`plan/authoring/en-plan.md`): `content/ja/_drafts/_generators/` is the source of truth; change a
generator, run `bash content/ja/_drafts/_generators/ja-pipeline.sh` (byte-deterministic, offline), then later
`bun scripts/author.ts promote --target ja --native vi --allow-missing-audio`.

## 1. Status after session 1 (2026-11-03)

| Layer | State | Where |
|---|---|---|
| Lexicon | 944 lexemes: A1 718, A2-1 226; every one with `glosses.vi`, kana reading (furigana on 683 kanji surfaces), an original example in vi + en | `content/ja/lexicon/lexemes.json`, frozen ids `content/ja/lexemes.json` |
| JLPT anchor | 629 of 662 OpenJLPT N5 entries taken; the other 33 have a reason (`anchors-left-out.txt`) | `content/ja/lexicon/REVIEW.md` |
| Kanji | 100 taught kanji: all 79 N5 + the 21 N4 kanji the A1 words use most | `content/ja/_drafts/review/kanji.json` |
| Hán-Việt | 115 course words added to the P4b table (160 entries); each passes the Unihan check or carries a note | `content/hanviet/ja.json`, source `hanviet-ja.txt` |
| Objectives | 37 (26 essential), claim policy v2, attainment, RESEARCH.md, JF Standard categories | staged `content/ja/assessment/`, `_drafts/objectives/jf-standard.json` |
| Course skeleton | 6 sections, 27 units, 108 lessons, 174 unit words, guidebooks in Vietnamese | staged `content/courses/ja-vi.json` |
| Lessons (session 2) | 108 lessons, 835 exercises (select 410, fillBlank 137, typeAnswer 110, wordBank 93, match 83), 60 particle fill-ins, concept steps in 47 lessons; self-check 0 findings | `_generators/ja-lessons-s1…s6.py`, `ja-check-answers.py`, `_drafts/REVIEW-NOTES.md` |
| Concept cards (session 2) | 25 cards (vi + en), all used in lesson flows; no paradigm table (§10.6) | `_generators/ja-concepts.py` → staged `content/ja/pedagogy/concepts.json` |
| Furigana of inflected forms (session 2) | verbs and い-adjectives read through inflection keys at run time; kana typed for them aligns as practice | `src/lib/languages/ja-inflection.ts` (+ test), ported in `_generators/ja_text.py` |
| Syllabus | A1 718 by unit, A2-1 226 | staged `content/ja/lexicon/syllabus*.json`, `topic-units.json` |
| ja-en (basic pack) | never edited; 57 of 58 words map (9 through `legacySurfaces`), さかな listed in `legacy-unmapped.json`; standalone profile staged | `content/ja/lexicon/legacy-unmapped.json` |
| Session 3 | kana primer (full tables + 20-item checkpoint, pass 16), persist v9 `primerPassed`, profile `romajiUntilPrimer` (ja-vi), romaji line; free writing in kana/pinyin = practice; morphology re-derived (supplement pin, nine cells tagged); 22 conjugationCloze on 25 tables; 8 proper nouns (kind R) → 952 lexemes | `_generators/ja-primer.py`, `ja_paradigms.py`, `src/lib/languages/ja-romaji.ts`, `scripts/lib/lexicon-etl/ja-morphology.ts` |
| Session 4 | readings 28 (19 teaching, 9 reserved); clips 220 (64 reception of which 21 reserved, 30 speech models, 126 partner turns; one voice: A jf_alpha 116, B jm_kumo 91, two-voice dialogues 13); speech 50 (20 reserved, ja-JP); writing 35 (15 guided, 4 open, 16 reserved); scenarios 21 (11 teaching, 10 reserved); Sections 3–6 +163 exercises (LC 44, RC 42, dictation 5, speakProduction 33, speakRepetition 9, guidedWriting 17, simpleForm 2, interactionScenario 11) → 1,020; self-check extended, 0 findings; proper nouns `proper: true`, never a daily new word | `_generators/ja-reception-s3.py`, `ja-speech-s4.py`, `ja-writing-s5.py`, `ja-scenarios-s6.py`, `ja_layers.py`, `ja_lesson_refs.py`; staged `content/ja/{reception,speech,writing,interaction}/` |
| Session 5 | checkpoints 7 (112 items; capstone 2 forms of 10), placement 4 stages (21 items), 2 more reserved speech items (22); JLPT N5 track `jlpt-n5.json` (staged): 3 sections 20/40/30 min, 14 question types, 2 forms × 67 items, 48 exam clips, 10 exam readings, pass rule 38/120 + 19/60 + total 80/180, `formatFidelity: partial`, checked against jlpt.jp; exam engine: `mcq4`, a task's own skill, item `lexemeRefs`, `select.scriptAid`; signs 立入禁止 安全第一 禁煙 足元注意 消火器 as lexemes (957); spoken kana of inflected verbs matches; KNOWN_LIMITATIONS entry | `_generators/ja-assessment.py`, `ja-exam.py`; `content/ja/exam/FORMAT-SOURCES.md`; staged `content/ja/{assessment,exam}/` |
| Session 6 | graded stories 45 (A1-0 7, A1-1 14, A1-2 14, A2-1 10), 1,084 sentences, 62–227 word tokens, 135 questions (vi, one inference each); stories engine: unspaced scripts (ja, zh) segment by dictionary maximal match with one step of lookahead, never Intl.Segmenter (fr/en unchanged); 26 function words; inflected forms and names in each story's tokenMap; story self-check 0 findings; band-1 audio list (18) for the audio session | `_generators/ja-stories-00…06.py`, `ja_stories_lib.py`, `ja-check-stories.py`, `ja-stories-seed.py`; `scripts/lib/stories.ts`; staged `content/ja/stories/stories.json`; `_drafts/stories/story-audio.json` |

## 2. Course shape (BLUEPRINT §1)

Before Section 1: the kana primer (`/primer`, `content/ja/primer/script-primer.json`). Today it holds the vowels and the K row;
it must grow to all of hiragana and katakana with dakuten, small kana, っ and ー, plus a checkpoint (session 3).

| Section | Units (ids) | Lessons | Exercise mix (per blueprint) |
|---|---|---|---|
| 1 Nhập môn | 1 Lời chào · 2 Tôi là ai? · 3 Gia đình · 4 Ăn và uống · 5 Số và tiền | 20 | select, wordBank, fillBlank (with options), match; **no typed kana** (decision 22): production by word bank, or a choice for a single word |
| 2 Viên gạch nền | a Câu danh từ và trợ từ · b Động từ thể ます · c あります・います và tính từ · d Giờ, ngày, lượng từ · e Chữ và âm tiếng Nhật | 20 | select, conjugationCloze (ます forms), fillBlank (particles), typeAnswer (kana typing starts here); concept steps in `flow` |
| 3 Hiểu tiếng Nhật hằng ngày | f Nghe từ · g Biển báo và nội quy ở nhà máy · h Thông báo ở nhà ga · i Hội thoại ở konbini · j Chuyện ở ký túc xá | 20 | listening/reading comprehension, dictation (kana), select, match |
| 4 Nói | k Chào hỏi ở chỗ làm · l Tự giới thiệu khi phỏng vấn · m Nói số · n Mô tả | 16 | speakProduction, speakRepetition (ja-JP recogniser), select |
| 5 Viết | o Viết về mình (kana input) · p Câu đơn giản · q Tin nhắn cho cấp trên · r Giấy tờ ở toà thị chính | 16 | guidedWriting, wordBank, simpleForm (フリガナ, 住所, 生年月日) |
| 6 Trò chuyện | s Konbini và quán ăn · t Hỏi đường, đi tàu · u Phòng khám · v Gọi điện cho chỗ làm | 16 | interactionScenario, select, wordBank |

`articleSelect` has no Japanese counterpart: its slot in Section 2 goes to particle `fillBlank` items (は/が/を/に/で/へ), and the
"15 exercise types" rule of later QCs must say so. Likewise the blueprint's Section 1 `typeAnswer` (the French mix of
`scripts/lib/authoring/lint.ts` `BLUEPRINT_MIX`, an info-level reference) has no ja-vi counterpart: its production slot
goes to word banks built from the same sentence, and `author.ts lint` reports Section 1 "missing: typeAnswer" by design.
`typeAnswer` stays in every later section. Section 2's "connected speech" unit becomes unit e: long vowels, っ, ん,
pitch, and Hán-Việt.

## 3. JLPT N5 targets

- **Vocabulary ≈ 800 at N5:** 630 lexemes are anchored N5 (527 A1, 103 A2-1; they take 629 of the 662 list entries), and
  189 more are everyday words the community list leaves out (set phrases, months and dates, particles, counters). Words
  beyond N5 are the N4 tail (125) and the work scenarios (工場, 安全, 面接, 在留カード, 市役所…). Counts by band and level:
  `content/ja/lexicon/REVIEW.md`.
- **Kanji ≈ 100:** `kanji.json` `taught`. Every other kanji on a surface is shown with furigana and is not a learning target.
- **Grammar points (N5, taught by the end of Section 6):** です/じゃありません/でした; は, が (set patterns), を, に (time, place
  of existence, destination, recipient), で (place of action, means), へ, と, も, の, や, か, から/まで, より; これ/それ/あれ/どれ,
  この/その/あの/どの, ここ/そこ/あそこ/どこ, こちら…; question words; ます/ません/ました/ませんでした; ましょう, ませんか;
  verb groups 1/2/3; て form: てください, ないでください, ています, てもいいですか, てから; plain form recognition (dictionary,
  ない, た); たい; い/な adjectives (present, negative, past, before nouns, くて/で linking); あります/います with に/が;
  counters つ, 人, 枚, 本, 個, 回, 階, 杯, 台, 歳; numbers to 99,999, time, dates, days; ～が好き/嫌い/上手/下手/欲しい;
  ～から (reason); ～とき (recognition); ～前に, ～後で; ～がほしい; もう/まだ; あまり～ない, 全然～ない; いつも, よく, 時々;
  sentence-final ね, よ. Every point gets a concept card or a lesson `flow` step; the exam track's 文法 items draw only on
  this list.
- **Exam track (session 5):** `content/ja/exam/jlpt-n5.json` with the engine of es/de/it/en: sections 言語知識（文字・語彙）,
  言語知識（文法）・読解, 聴解; item formats of the public test (kanji reading, orthography, context, paraphrase; grammar form,
  sentence order, text grammar; short and mid passages, information search; task, point, utterance, quick response
  listening), timing and scoring as published by the JLPT (jlpt.jp; read the official pages and record URL + date in
  `content/ja/exam/FORMAT-SOURCES.md` before authoring), **original items only**, ≥ 2 parallel mock forms, weak areas →
  FSRS, readiness wording "mức sẵn sàng ước tính", never "sẽ đỗ". JLPT N5 is not a CEFR level and the app never says so.

## 4. Kana primer and the romaji gate (engine work, session 3) — done

Done in session 3 as planned below: migration v9, fixture `v8-before-primer.json`; the checkpoint is 20 items (10 kana →
rōmaji, 10 sound → kana of which 5 are minimal pairs), pass mark 16; the romaji line is kana-faithful Hepburn (ー = macron,
おう stays ou), never on word-bank tiles or fill-blank options. Planned:
1. `scriptPrimer` content: full hiragana and katakana tables, dakuten, small kana, っ, ー, plus a `checkpoint` block
   (≈ 20 items: kana → sound select, sound → kana, minimal pairs).
2. A learner flag `primerPassed[courseId]` set by the checkpoint. It is a persisted-shape change → a numbered migration,
   fixtures and backup round-trip tests (non-negotiable 6).
3. Rendering: `RubyText` shows romaji under kana only while the flag is false and the course profile says
   `romajiUntilPrimer: true` (new profile field, validator + test). Section 1 lessons stay reachable; the primer is offered
   first, not forced (no dark pattern).
4. Typed answers: romaji is never accepted as an answer; kana typed for a kanji key stays practice (P4b evidence guard).

## 5. Scenarios (18, 10 reserved; session 4)

Work in Japan first (brief §4, P4c task 4): first day at the factory (自己紹介), safety instructions on the line (stop the
machine, wear the helmet), 面接 basics (name, country, experience, why Japan), konbini (bag, point card, heating), restaurant
order, station (which platform, change trains), asking the way, post office, clinic reception and symptoms, pharmacy dose,
city office (住所 registration, 在留カード), bank account, phone to the employer (ill, late), message to a senior,
dormitory rules (garbage day), weekend small talk with a 先輩, shift change request, lost wallet at the 交番.
Partner speech in polite style; the learner uses です/ます throughout.

Done in session 4 (21, not 18: three teaching scenarios were added so that every theme of P4c task 4 is taught, as en has
11 teaching + 10 reserved): teaching — konbini (heat the bento, no bag), restaurant order, asking the way to the station,
which platform, clinic reception, the doctor, city office (moved house, 在留カード), 面接 (experience, why Japan), factory
safety (helmet and gloves, how to stop the machine), phoning in sick, phoning in late; reserved — new colleague, 面接,
paying at the konbini, the way to the bank, a cough at the clinic, phoning the office (checkpoint 6); first day at the
factory, a neighbour, a plan with a friend, lunch with a colleague (capstone). Not yet: post office, pharmacy dose, bank
account, garbage day, shift change, lost wallet at the 交番 — material for the exam track and the stories.

## 6. Hán-Việt

QC 2026-11-03 §2: only where it helps. 115 course words (Sino-Japanese, on'yomi, kanji only) carry a reading; kun words, mixed
words (豚肉, 家賃) and words where the reading does not help (大切, 心配, 案内) are left out. False friends carry a note the D-10
reviewer reads first: 工場 (công trường), 試験 (thí nghiệm), 親切 (thân thiết), 丈夫, 道具, 材料, 資格, 部長, 運転, 丁寧, 大事, 無理,
警官. Four words (倉庫, 機械, 洗濯, 砂糖) wait for a character missing from `content/hanviet/unihan-readings.json` (re-derive
from the pinned Unihan.zip). Concept card "Kanji N5 và âm Hán-Việt" (brief §3.2) states when the sound is NOT close.

## 7. Voices and audio (session 6)

- Cast per `content/audio/voice-casts.json`: A `kokoro-jf_alpha` (female, canary CER 0.23), B `kokoro-jm_kumo` (male, CER 0.50).
  MeloTTS-JA is excluded: it fails the lineage gate (D-11), whatever the brief says.
- Open: jm_kumo's CER is high. Before generating, re-run the canary with pitch pairs (はし/はし), long vowels (おばさん/おばあさん)
  and geminates (きて/きって); if B stays above 0.35, ask the coordinator (Kokoro has no other male ja voice).
- ASR audit by CER with SenseVoice or Whisper-small (P3b), as in `plan/06-RESEARCH-OPEN-RESOURCES.md` §2.4.
- Primer audio: the device voice until the clips exist (P4b).

## 8. Sources and licences (verified 2026-11-03)

| Source | Use | Licence (as read) | Ships? |
|---|---|---|---|
| OpenJLPT 0.1.0 (PyPI tarball, sha256 pinned) | N5/N4 word lists and kanji as an anchor | README: "Dataset and code: CC BY-SA 4.0"; levels from Waller's lists (CC BY per NOTICE.md; tanos.co.uk did not resolve on 2026-11-03) | no — build time only (registry `buildTimeOnly`) |
| JmdictFurigana 2.3.1 (sha256 pinned, P4b) | kana + furigana of every kanji surface | CC BY-SA 4.0, same as JMdict | yes, in the lexicon (attributed) |
| JMdict (EDRDG) | through JmdictFurigana; English glosses are authored, not copied (the pinned JMdict_e of 2026-10-14 is no longer downloadable) | CC BY-SA 4.0 | readings only |
| FrequencyWords (P3a pool) | frequency on 209 lexemes | CC BY-SA 4.0 | yes |
| kaikki-en (P3a pool) | sourceRefs where the pool has the lemma | CC BY-SA 4.0 | refs only |
| Unihan 17.0.0 | Hán-Việt check | Unicode-3.0 (data scope) | check only |
| Course text | glosses, examples, objectives, guidebooks | original (`original-lexicon-etl`, `original-japanese-course`, MIT) | yes |

Not used: Tatoeba sentences (examples are original), MeCab/UniDic/IPADIC (licences not on the allowlist), wordfreq (the pool's
frequency is FrequencyWords; wordfreq Zipf stays secondary evidence in the pool).

## 9. Learner data

- ja-en is never edited. Its kana surfaces map through `legacySurfaces` (みず→水, ぎゅうにゅう→牛乳, たべます→食べる,
  のみます→飲む, おちゃ→お茶, ごはん→ご飯, たまご→卵, くだもの→果物, にく→肉). さかな cannot: ja-en also teaches 魚 with a
  different English gloss, so it is listed in `legacy-unmapped.json` (new, validated: a listed surface must be taught and
  must not map) and keeps a reversible `ja:legacy:` id.
- No `src/content/ids/ja.json` is compiled yet. At promote, the first compile creates it: add `ja` to `V8_REKEYED_TARGETS`
  (v8 never ran on a device), with a fixture `v3-rc3-ja.json` and a test like `migrations-v8-it.test.ts`. No v9.
  Done at the promote (2026-11-03): `migrations-v8-ja.test.ts` registers, until the audio bot commit compiles the
  registry, the one the compiler writes from the same sources, and checks the compiled one equals it afterwards;
  `migrations-v8.test.ts` lets a target join the list one compile early when its `content/<code>/lexemes.json` exists.

## 10. Decisions taken in session 1

1. English glosses are authored (short, for tools and the ja-en pack); JMdict senses are not copied.
2. Readings come only from JmdictFurigana: the whole-surface entry, or a chain of entries and literal kana (the kanji stem of
   an inflecting entry explains 待って). No chain, no lexeme.
3. Lexicon committed to `content/` (like it and en); every course-specific file (objectives, pack, syllabus, profiles) staged.
   `content:compile` is not run until promote, so `src/content/` is untouched.
4. 100 N5 words moved to A2-1 so that A1 ≈ 700 (`core-a2.txt`, last block).
5. Lexeme ids: Hepburn-like romaji of the kana, long marks doubled (コーヒー → `ja:w:koohii`), a clash gets the English
   gloss's first word (`ja:w:hashi-bridge`). Frozen from now on.

### Session 2 (2026-11-03)

6. **No conjugationCloze yet.** A ja paradigm table must be complete and every cell evidenced by morphology rows; the
   committed `derived/morphology.json` tags only `inf` and `formal`. Verb forms are drilled as fill-ins with the forms as
   options. Re-open when the derivation tags the other seven cells (needs the kaikki dump).
7. **Furigana come from the lexicon at run time**, so exercise text holds no readings. Inflected forms read through
   inflection keys (`src/lib/languages/ja-inflection.ts`); a key two verbs share with different readings (降ります) is
   dropped. Exercise text therefore writes: kanji only inside lexicon surfaces or their inflected forms, numbers before
   a counter in digits (7時, 2枚; kanji numeral compounds only when they are lexemes: 一人, 二つ, 五月), non-lexicon words
   and Japanese names in kana, 何 before です/で/の as なん.
8. **Kana as production**: unit o lists the kana spelling of a kanji key; elsewhere kana is practice. (Section 1 did too
   until decision 22 removed typing from it.)
9. Lessons are written per section into `_drafts/lessons/parts/<s>.jsonl`; `ja-check-answers.py` joins them into
   `lessons/OUTPUT.jsonl` and is the self-check of the answer keys (`REVIEW-NOTES.md`).

### Session 3 (2026-11-03)

10. **Romaji until the primer** (§4): `romajiUntilPrimer` in the staged ja-vi profile; v9 `primerPassed`; Section 1 is
    never locked, the primer card is first and says "recommended" / "passed".
11. **Free writing in kana / pinyin = understood practice** (P4b open item): ja and zh align free-writing slots through
    the stored readings (`alignWrittenToKey`), kana / pinyin spellings of course words count as known vocabulary; the
    slot is reading-only, so no production evidence. Latin plugins unchanged.
12. **Morphology**: the 2026-10-14 jsonl pin is no longer served; a supplement retrieval of the .gz is pinned apart
    (sha256 1e0b1e48…, 2026-11-03) and read only for verb / i-adjective rows. A cell no table states is composed from a
    stated row of the same page and marked `composed` (7 of the 25 cloze tables use one). Decision 6 is re-opened and
    closed: conjugationCloze exists (22 items).
13. **Proper nouns** are lexemes of kind R (noun): furigana from JmdictFurigana, no Hán-Việt, not counted as kanji
    targets; 山田 dropped for 木村 (no reading chain). Re-run `ja-subset.py` (pinned OpenJLPT + JmdictFurigana) after
    adding kanji words.

### Session 5 (2026-11-03)

14. **JLPT N5 format**: only what jlpt.jp states is reproduced (times, 大問, options, scoring sections, pass marks);
    item counts per 大問 (not published since 2020), the 60/60 split of the 120 points, one play per recording and the
    raw-share scoring are the course's choices and the track says so (`formatFidelity: partial`,
    `checkedAgainstOfficialGuide: true` for the figures that were read). Listening questions are Vietnamese and options
    printed.
15. **Exam engine for language knowledge** (reused by HSK/TOPIK): `mcq4`; a task's `skill` (reading / structures)
    inside one timed section; item `lexemeRefs` for weak areas when no stimulus names the word; `select.scriptAid:
    "hidden"` for kanji-reading and spelling items.
16. **Signs as lexemes**: 立入禁止, 安全第一, 禁煙, 足元注意, 消火器 (A2-1, work), read through the pinned JmdictFurigana.
17. **Spoken kana for inflected forms**: whole variants compare by an utterance reading that includes the
    ja-inflection keys; concept slots stay word-level (no fuzzy substring match).

### Session 6 (2026-11-03)

18. **Stories segment ja by dictionary** (`scripts/lib/stories.ts`, test first): for a target whose script has no
    spaces (build plugin `script` japanese / han) a story sentence is cut by left-to-right maximal match over the keys
    the resolver knows — lexicon lemma and lookup forms (one key each, never split), the verb rows of morphology.json,
    the function words and the token-map keys — with one step of lookahead: the longest key gives way to a shorter one
    when the character after it would start no key (パン は いくら, not パン はい く ら). Deterministic on every runtime;
    Latin targets keep Intl.Segmenter, so fr/en/es/de/it analyses are unchanged.
19. **Function words** are the particles, the copula forms and な/たち/ごろ/だけ (26); the particles stay A1-1 lexemes
    for the lessons. Inflected forms outside the morphology and names go into each story's `tokenMap` (explicit), so
    the file-level map is empty. Authors write a space between words; the builder checks the engine's cut against it.
20. **Register and script**: polite sentence ends throughout; plain forms inside A2-1 sentences only; kanji only inside
    lexicon surfaces and inflection keys (the lesson rule), digits before counters. The reader does not render
    furigana yet (open, §11).
21. **Audio**: voice cast A/B as §7 (N narrates with A); band-1 audio = the first 18 stories after the micro-stories
    (`_drafts/stories/story-audio.json`); the audio session writes it into the reception voice manifest.

### 2026-11-04 (coordinator)

22. **No free kana typing in Section 1.** Section 1 comes before the learner is expected to have done the kana primer:
    such a learner cannot read kana yet and may have no Japanese keyboard (and Maestro cannot type kana on Android, so
    the first lesson was not automatable). The 23 Section 1 `typeAnswer` items became 16 word banks (tiles that join to
    the old key, so every `audioTarget` and audio key is unchanged) and 7 `nativeToTarget` choices where the answer is
    one word (こんにちは, はい, いいえ, はじめまして, 五, 十, 三つ); same ids, lesson objectives and exercise counts.
    Kana typing starts in Section 2. `ja-check-answers.py` rule 10 stops on any typed-Japanese exercise (typeAnswer,
    dictation, conjugationCloze, a fill-in without options, guidedWriting, simpleForm) in a Section 1 lesson, checkpoint
    or placement item.

## 11. Next sessions

1. ~~**Lessons**~~ done in session 2 (one session): 108 lessons, 835 exercises, 25 cards. Left for the layer sessions:
   the Section 3–6 exercise types that point at reception, speech, writing and scenario records.
2. ~~**Reception + speech + writing**~~ done in session 4: 28 readings, 220 clips, 50 speech items (20 reserved; the
   exam step adds its own, as in en), 35 writing tasks (16 reserved); the Section 3–6 exercises point at them through
   `ja_lesson_refs.py`.
3. ~~**Primer + romaji gate**~~ done in session 3, with the free-writing decision, the morphology and the names.
4. ~~**Scenarios**~~ done in session 4: 21 (10 reserved), interactionScenario in units s–v (§5).
5. ~~**Assessment + JLPT N5 track**~~ done in session 5 (one session): 7 checkpoints, placement, the exam file with 2
   mock forms, format sources (decisions 14–17 below).
6. ~~**Stories**~~ done in session 6: 45 graded stories A1-0…A2-1 (decisions 18–21). Open: the story reader
   (`src/components/story/sentence-row.tsx`) shows no furigana or romaji line; the lessons do (RubyText). Wire the
   script reading into the reader before ja-vi ships stories, or keep kanji in stories to the 100 taught kanji.
7. **D-10 review** (AI pass, then the owner), **audio** (canary + generate, CER audit), promote, compile, V8 re-key, claim gate,
   KNOWN_LIMITATIONS entry, STATUS.
8. ~~**Section 1 without kana typing**~~ done 2026-11-04 (decision 22): the first ja-vi lesson is automatable by the
   Maestro suite; typed answers start in Section 2.

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
| Course skeleton | 6 sections, 27 units, 108 lessons (no exercises yet), 174 unit words, guidebooks in Vietnamese | staged `content/courses/ja-vi.json` = `_drafts/pack.json` |
| Syllabus | A1 718 by unit, A2-1 226 | staged `content/ja/lexicon/syllabus*.json`, `topic-units.json` |
| ja-en (basic pack) | never edited; 57 of 58 words map (9 through `legacySurfaces`), さかな listed in `legacy-unmapped.json`; standalone profile staged | `content/ja/lexicon/legacy-unmapped.json` |

## 2. Course shape (BLUEPRINT §1)

Before Section 1: the kana primer (`/primer`, `content/ja/primer/script-primer.json`). Today it holds the vowels and the K row;
it must grow to all of hiragana and katakana with dakuten, small kana, っ and ー, plus a checkpoint (session 3).

| Section | Units (ids) | Lessons | Exercise mix (per blueprint) |
|---|---|---|---|
| 1 Nhập môn | 1 Lời chào · 2 Tôi là ai? · 3 Gia đình · 4 Ăn và uống · 5 Số và tiền | 20 | select, wordBank, fillBlank, match, typeAnswer (kana) |
| 2 Viên gạch nền | a Câu danh từ và trợ từ · b Động từ thể ます · c あります・います và tính từ · d Giờ, ngày, lượng từ · e Chữ và âm tiếng Nhật | 20 | select, conjugationCloze (ます forms), fillBlank (particles), typeAnswer; concept steps in `flow` |
| 3 Hiểu tiếng Nhật hằng ngày | f Nghe từ · g Biển báo và nội quy ở nhà máy · h Thông báo ở nhà ga · i Hội thoại ở konbini · j Chuyện ở ký túc xá | 20 | listening/reading comprehension, dictation (kana), select, match |
| 4 Nói | k Chào hỏi ở chỗ làm · l Tự giới thiệu khi phỏng vấn · m Nói số · n Mô tả | 16 | speakProduction, speakRepetition (ja-JP recogniser), select |
| 5 Viết | o Viết về mình (kana input) · p Câu đơn giản · q Tin nhắn cho cấp trên · r Giấy tờ ở toà thị chính | 16 | guidedWriting, wordBank, simpleForm (フリガナ, 住所, 生年月日) |
| 6 Trò chuyện | s Konbini và quán ăn · t Hỏi đường, đi tàu · u Phòng khám · v Gọi điện cho chỗ làm | 16 | interactionScenario, select, wordBank |

`articleSelect` has no Japanese counterpart: its slot in Section 2 goes to particle `fillBlank` items (は/が/を/に/で/へ), and the
"15 exercise types" rule of later QCs must say so. Section 2's "connected speech" unit becomes unit e: long vowels, っ, ん,
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

## 4. Kana primer and the romaji gate (engine work, session 3)

P4c task 5: romaji is shown only until the learner passes the primer checkpoint. Today P4b shows romanization on basic packs
and has no primer checkpoint. Needed:
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

## 10. Decisions taken in session 1

1. English glosses are authored (short, for tools and the ja-en pack); JMdict senses are not copied.
2. Readings come only from JmdictFurigana: the whole-surface entry, or a chain of entries and literal kana (the kanji stem of
   an inflecting entry explains 待って). No chain, no lexeme.
3. Lexicon committed to `content/` (like it and en); every course-specific file (objectives, pack, syllabus, profiles) staged.
   `content:compile` is not run until promote, so `src/content/` is untouched.
4. 100 N5 words moved to A2-1 so that A1 ≈ 700 (`core-a2.txt`, last block).
5. Lexeme ids: Hepburn-like romaji of the kana, long marks doubled (コーヒー → `ja:w:koohii`), a clash gets the English
   gloss's first word (`ja:w:hashi-bridge`). Frozen from now on.

## 11. Next sessions

1. **Lessons** (2 sessions): Sections 1–2 then 3–6; all exercise types the blueprint allows for ja; Japanese production from
   Section 1 (kana typeAnswer, wordBank); `flow` concept steps in ≥ 25 lessons; concept cards (≈ 20, brief §3).
2. **Reception + speech + writing** (1–2): ≥ 19 readings with furigana, ≈ 180 clips (cast A/B), 50 speech items
   (22 reserved, ja-JP), 34 writing tasks (16 reserved, kana input; decide P4b's open item: free writing typed all in
   kana = practice).
3. **Primer + romaji gate** (1): §4 above, with the migration.
4. **Scenarios** (1): §5, 18 with 10 reserved.
5. **Assessment + JLPT N5 track** (1–2): 7 checkpoints, placement, the exam file with ≥ 2 mock forms, format sources.
6. **Stories** (1–2): 40–50 graded stories A1-0…A2-1, context coverage of the A1 syllabus.
7. **D-10 review** (AI pass, then the owner), **audio** (canary + generate, CER audit), promote, compile, V8 re-key, claim gate,
   KNOWN_LIMITATIONS entry, STATUS.

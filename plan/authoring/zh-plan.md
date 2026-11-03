# P4d — `zh-vi` working plan (Mandarin Chinese for Vietnamese speakers + HSK 1–2 practice track)

Prompt: `plan/prompts/P4d-zh-vi-hsk.md`, following `P3d-author-course-vi.md` with target `zh` and the additions of
`P4c-ja-vi-jlpt-n5.md`. Branch `phase-4/zh-vi`. Model: the finished ja-vi course (`plan/authoring/ja-plan.md`,
`plan/reports/P4c-ja-vi.md`): `content/zh/_drafts/_generators/` is the source of truth; change a generator, run
`bash content/zh/_drafts/_generators/zh-pipeline.sh` (byte-deterministic, offline: two runs give identical files), then
later `bun scripts/author.ts promote --target zh --native vi --allow-missing-audio`.

## 1. Status after sessions 1–2 (2026-11-04)

| Layer | State | Where |
|---|---|---|
| Lexicon | 903 lexemes: A1 718, A2-1 185; every one with `glosses.vi`, tone-marked pinyin and the traditional spelling from CC-CEDICT, an original example in vi + en; 9 proper nouns (cities, three family names) | `content/zh/lexicon/lexemes.json`, frozen ids `content/zh/lexemes.json` |
| HSK 3.0 anchor | level 1: 435 of 506 words taken (the other 71 have a reason, `anchors-left-out.txt`); level 2: 332 of 767 | `content/zh/lexicon/REVIEW.md` |
| Characters | 520 in A1 surfaces: 299 of the 300 HSK level-1 characters, 175 level-2, 46 beyond; target 474 (levels 1–2) | `content/zh/_drafts/review/hanzi.json` |
| Hán-Việt | 159 course words added to the P4b table (195 entries, 189 lexemes covered); each passes the Unihan check or carries a note; 24 false friends flagged, more marked "partly" | `content/hanviet/zh.json`, source `hanviet-zh.txt`; sheet `content/hanviet/REVIEW.md` regenerated |
| Objectives | 36 (25 essential), claim policy v2, attainment, RESEARCH.md, HSK band + skill per objective | staged `content/zh/assessment/`, `_drafts/objectives/hsk-standard.json` |
| Course skeleton | 6 sections, 27 units, 108 lesson stubs, 174 unit words, guidebooks in Vietnamese | staged `content/courses/zh-vi.json` |
| Syllabus | A1 718 by unit, A2-1 185 | staged `content/zh/lexicon/syllabus*.json`, `topic-units.json` |
| zh-en (basic pack) | never edited; all 58 words are lexemes with the pack's English glosses (no legacy surface, nothing unmapped); standalone profile staged | — |
| Lessons (session 2) | 108 lessons, 811 exercises (select 400, fillBlank 144, wordBank 96, typeAnswer 92, match 79), 24 measure-word and 11 aspect fill-ins, concept steps in 41 lessons; Section 1 tap-only; self-check 0 findings | `_generators/zh-lessons-s1…s6.py`, `zh_lesson_lib.py`, `zh_text.py`, `zh-check-answers.py`, `_drafts/REVIEW-NOTES.md`; staged `content/courses/zh-vi.json` |
| Concept cards (session 2) | 28 cards (vi + en), all shown in lesson flows; no paradigm table | `_generators/zh-concepts.py` → staged `content/zh/pedagogy/concepts.json` |
| Hán-Việt + Unihan (session 2) | Unihan re-derived from the pinned zip (+12 characters); 工厂, 仓库, 经验, 辞职 added (199 entries) | `content/hanviet/unihan-readings.json`, `zh.json`, `REVIEW.md` |

`course-draft.ts validate --target zh`: 192 errors, all of three kinds a session-1 course has (ja-vi had the same):
108 stub lessons with one exercise and 81 stub payload repeats (lessons, session 2), and the missing checkpoints,
placement and attainment-of-checkpoints (assessment session).

After session 2: 735 errors of two kinds only — 732 `audioTarget has no audio` (the audio session; the promote runs
with `--allow-missing-audio`) and the 3 missing assessment files (session 5). The lesson and concept errors are gone.

## 2. Course shape (BLUEPRINT §1)

Before Section 1: the tone and pinyin primer (`/primer`, `content/zh/primer/script-primer.json`, §4). Section 1 is
never locked; the primer card comes first and says "recommended" / "passed" (ja decision 10).

| Section | Units (ids) | Lessons | Exercise mix |
|---|---|---|---|
| 1 Nhập môn | 1 Lời chào · 2 Tôi là ai? · 3 Gia đình · 4 Ăn và uống · 5 Số và tiền | 20 | select, wordBank, fillBlank (with options), match; **no free typing of hanzi or pinyin** (ja decision 22): production by word bank, a one-word answer by choice |
| 2 Viên gạch nền | a 是, 不/没, 吗 · b Lượng từ · c 有, 在, 的 · d Thời gian, 了, 过 · e Chữ Hán, pinyin, Hán-Việt | 20 | select, fillBlank (measure words, 了/过/在, 的), typeAnswer (typing through a pinyin keyboard starts here), wordBank (word order); concept steps in `flow` |
| 3 Hiểu tiếng Trung hằng ngày | f Nghe từ · g Biển báo, nội quy nhà máy · h Ga tàu, sân bay · i Cửa hàng · j Ký túc xá | 20 | listening/reading comprehension, dictation, select, match |
| 4 Nói | k Chào hỏi ở chỗ làm · l Tự giới thiệu, phỏng vấn · m Nói số · n Mô tả | 16 | speakProduction, speakRepetition (`zh-CN` recogniser), select |
| 5 Viết | o Viết về mình (pinyin keyboard) · p Câu đơn giản · q Tin nhắn WeChat cho quản lý · r Ngân hàng: biểu mẫu | 16 | guidedWriting, wordBank, simpleForm (姓名, 国籍, 护照号码, 电话, 地址) |
| 6 Trò chuyện | s Nhà hàng, cửa hàng · t Hỏi đường, taxi, tàu điện · u Phòng khám · v Gọi điện cho chỗ làm | 16 | interactionScenario, select, wordBank |

`conjugationCloze` and `articleSelect` have no Chinese counterpart (the build plugin declares no paradigm): their slots
go to measure-word and aspect fill-ins (`zh:concept:measure-words`, `aspect-le/-guo/-zhe/-zai`), and the "15 exercise
types" rule of later QCs must say so; `author.ts lint` will report them missing by design.

## 3. HSK 3.0 levels 1–2 targets

- **Words:** HSK 3.0 (GF0025-2021) lists 500 words at level 1 and 772 at level 2 (ivankra/hsk30 counts 506 and 767
  after expanding variants). The course takes 435 + 332; A1 holds 629 HSK 1–2 words plus 89 everyday or work words
  beyond them (家庭, 吸烟, 安全帽, 微信…), A2-1 holds 121 more HSK 2 words and the work tail (仓库, 车间, 质量, 合同,
  身份证, 挂号…). HSK 2 words left out are listed in `REVIEW.md` for v1.1 (A2).
- **Characters:** the 300 level-1 characters (299 appear in A1 words; the last, 京, only in the name 北京, which is
  not counted — `hanzi.json`) and the 175 level-2 characters the A1 words use: recognition with pinyin, never
  handwriting.
- **Grammar points (taught by the end of Section 6):** 是, 不/没, 吗, A不A, 呢; question words 什么/谁/哪/哪儿/几/多少/
  怎么/怎么样/为什么; 的 (possession, modifier before the noun); 有/没有, 在 (place); location words after the noun
  (桌子上, 包里); numbers to 99,999, 两/二, measure words 个/本/杯/只/件/张/口/次/块/斤/双/瓶/碗/条/层/份/辆/遍;
  这/那 + measure word; time and place before the verb; 了 (completion and change), 过 (experience), 在/正在
  (progressive), 着 (state, recognition only); 想/要/会/能/可以; 很 + adjective, 太…了, 有点儿, 比; 也/都/还/就/
  再/又; 和/但是/因为…所以/如果/然后/或者/还是; 把 and the resultative complements (看见, 找到, 听懂) as set
  phrases only; 得 (说得很好) as a pattern. Every point gets a concept card or a lesson `flow` step; the exam track
  draws only on this list.
- **Exam track (later session):** `content/zh/exam/hsk-1.json` and `hsk-2.json` on the es/de/it/ja exam engine
  (mcq4, a task's own skill, item `lexemeRefs`, `select.scriptAid`). Sections 听力 and 阅读, and 书写 at level 2 if the
  HSK 3.0 format published on chinesetest.cn says so: read the official pages and record URL + date in
  `content/zh/exam/FORMAT-SOURCES.md` before authoring (the brief's 20/20 and 35/25 counts are the HSK 2.0 papers);
  original items only, ≥ 2 mock forms per level, weak areas → FSRS, "mức sẵn sàng ước tính", never "sẽ đỗ". HSK
  bands are not CEFR levels and the app never says so.

## 4. Tone and pinyin primer (extend the P4b primer, session 3) — done

Done in session 3 (`_generators/zh-primer.py` → `content/zh/primer/script-primer.json`, compiled copy and review sheet
regenerated with the compile step's own function): the five tones with the comparisons below (each marked "so sánh gần
đúng"), a note that ´ ` ˇ do not mean sắc/huyền/hỏi; 10 minimal tone pairs (买/卖, 是/十, 书/树, 汤/糖, 问/闻, 课/渴, 水/睡,
鸡/几, 包/饱, 烟/盐); 10 sound contrasts (new section kind `soundContrasts`: zh–z 找/早, ch–c 茶/词, sh–s 是/四, r–l 热/乐,
j–q 鸡/七, d–t 都/偷, b–p 爸/怕, ü–u 绿/路, -n/-ng 班/帮, -in/-ing 心/星) with notes on the missing stop finals and er/儿;
the sandhi of 3+3, 不 and 一 (new kind `toneSandhi`: written and said pinyin per example, checked by
`scripts/lib/zh-sandhi.ts`, the rule the audio front-end will reuse) with the 一 = yāo note; the strokes; and a 20-item
checkpoint (new item kind `soundToPinyin`: 10 tone/sound identifications with four options, 10 pairs with two), pass
mark 16, on ja's `primerPassed` (v9). Decision 18 below: no pinyin-until-primer switch.

P4b ships four tones on *ma*, four minimal pairs and the strokes. Vietnamese speakers already hear tones, so the
primer maps each tone to the nearest Vietnamese contour and says where it is NOT the same:

| Tone | Contour | Nearest Vietnamese | Warn |
|---|---|---|---|
| 1 ā | 55 high level | thanh ngang | higher than ngang (33) and held flat to the end; do not let it fall |
| 2 á | 35 rising | thanh sắc | starts from the middle, not from high; no tense, clipped ending as in Northern sắc |
| 3 ǎ | 214 dipping | thanh hỏi | in speech usually only the low part (21); never glottalised like ngã; 3 + 3 → the first is said as tone 2 |
| 4 à | 51 falling | none (huyền is low, 21) | starts at the very top and falls the whole range; not huyền, and not cut off like nặng |
| neutral | short, pitch after the previous tone | none | light and short (thanh nhẹ), no glottal stop; 了, 的, 吗, the second 妈 of 妈妈 |

Add: initials and finals with the Vietnamese traps (zh/ch/sh/r against z/c/s; j/q/x; ü; final -n/-ng; er and the 儿
ending), the sandhi of 不 (bú before tone 4) and 一 (yí/yì), stored citation tones against what the audio says, and a
checkpoint of 20 items (10 sound → pinyin choice, 10 minimal pairs: 买/卖, 是/十, 四/十, 汤-type pairs from the course
words), pass mark 16, reusing ja's `primerPassed` (v9, keyed by course id: no new migration). Pinyin stays under the
characters (RubyText) in every section; v1 has no automatic fade in HSK 2 units (decision 11) — the learner turns it off
with the existing per-course `readingAid` switch. Pinyin is never accepted as production evidence (P4b guard).

## 5. Concept cards instead of paradigms (session 2) — done

Done: 28 cards (`zh-concepts.py`): pinyin-tones, tone-sandhi, initials-traps, hanzi-radicals, hanviet-false-friends,
simplified-traditional, greetings, family, shi-sentences, bu-mei, questions-ma, question-words, measure-words, liang-er,
numbers-money, zhe-na-measure, you-zai, location-words, de-modifier, time-place-order, aspect-le, aspect-guo,
aspect-zai-zhe, modals, hen-adjective, comparison-bi, polite-work, linking. Planned:

About 25 cards (vi + en): pinyin and tones (the comparison above); tone sandhi; retroflex and ü; characters and
radicals; Hán-Việt and false friends; 是 sentences; 不 against 没; 吗, A不A, 呢; question words in place; measure
words (Vietnamese loại từ comparison, 个 as the default, shapes 张/条/件); 两 against 二; numbers and prices;
这/那 + measure word; 有 and 在; location words after the noun; 的 and the modifier before the noun (*xe màu đỏ* /
*红色的车*); time and place before the verb; 了 (rồi: completion and change — not a past tense); 过 (từng); 在/正在
(đang) and 着; 想/要/会/能/可以; 很 + adjective with no 是; 太…了, 有点儿, 比; polite forms at work (您, 请, titles);
simplified and traditional. No paradigm table (build plugin: Mandarin verbs do not inflect).

## 6. Hán-Việt (QC 2026-11-03 §2: only where it helps)

Every Chinese word is Sino, so the rule is usefulness, not origin: a reading is shown where a Vietnamese speaker
recognises it and it helps the meaning (学生 học sinh, 银行 ngân hàng, 准备 chuẩn bị, 护照 hộ chiếu, 地址 địa chỉ), never
as a substitute for pinyin, never for names, and not where no Vietnamese speaker would know it (告诉 cáo tố, 知道 tri
đạo, 觉得 giác đắc). False friends carry a note the D-10 reviewer reads first: 小心, 方便, 意思, 东西, 地方, 颜色, 名字,
家人, 丈夫, 妻子, 中间, 照顾, 快乐, 容易, 认真, 水平, 提高, 出口, 入口, 机器, 生气, 作业, 所以, 认识 (+ partly: 小姐,
爱人, 商场, 生活, 习惯, 身体, 新闻, 非常, 可能, 商量, 虽然, 工作, 辞职). 33 entries name a character Unihan 17.0.0
cannot confirm (e.g. 女, 电, 静, 春, 仓) and say why. Session 2 (decision 12): `unihan-readings.json` re-derived from the
pinned Unihan.zip (sha256 f7a48b2b…, the hash checked before parsing) with `scripts/hanviet-unihan.ts derive` — 2,975
characters, +12 (仓 倉 厂 廠 辞 辤 辭 验 and the one-hop variants of session-1 table words), nothing removed; the four
words that waited are in the table: 工厂 công xưởng, 经验 kinh nghiệm and 辞职 từ chức confirmed by Unihan, 仓库 thương khố
with a note (仓 and 倉 have no kVietnamese; 庫 lists the everyday kho).

## 7. Voices and audio (audio session)

- **Engine:** Kokoro-82M v1.0 zh voices only. MeloTTS is excluded by D-11, whatever the brief says, although the
  2026-10-22 canary scored melotts-zh best (0.133). Candidates in `voice-casts.json`: `zf_xiaobei` (canary CER 0.224)
  and `zm_yunjian` (0.148, already registered for zh-en). Before generating, add `zf_xiaoni`, `zf_xiaoxiao`,
  `zf_xiaoyi`, `zm_yunxi` to the canary with tone pairs (买/卖), sandhi (你好, 不是, 一个) and neutral tones; cast A female,
  B male if both stay under the floor. ASR audit by CER with SenseVoiceSmall (funasr, audit only).
- **G2P licences (read 2026-11-04 from PyPI metadata and the misaki 0.9.4 sdist):** misaki 0.9.4 Apache-2.0 (its zh
  frontend, tone sandhi and normaliser are adapted from PaddleSpeech, Apache-2.0; `transcription.py` from
  stefantaubert/pinyin-to-ipa, MIT); jieba 0.42.1 MIT; pypinyin 0.55.0 MIT (dictionaries from mozillazg/pinyin-data and
  phrase-pinyin-data, MIT); cn2an 0.5.24 MIT (+ proces 0.1.7 MIT); ordered-set 4.1.0 MIT; pypinyin-dict 0.9.0 MIT. All
  allowlisted, recorded as `misaki-zh-g2p` (build time only). **Caveat, like the ja MeCab case but milder:**
  pypinyin-dict's `large_pinyin` phrase table merges zdic.net scrapes whose licence is not stated; Kokoro v1.0 (lang
  `z`) does not load it (misaki's legacy path: jieba + pypinyin's own dictionaries), only the version-1.1 frontend does.
  The legacy path also applies no tone sandhi and guesses readings of 了/得/还 by its own dictionary.
- **Front-end (decided by the coordinator, 2026-11-04; decision 10):** as for ja's course-readings front-end, feed
  Kokoro phonemes built from the course's own stored CC-CEDICT pinyin (one reading per lexeme, chosen and checked here),
  with the tone sandhi of 3-3 (→ 2-3), 不 (bù → bú before tone 4) and 一 (yī → yí before tone 4, yì before the others;
  yī when counting) applied **for audio only** by a small tested rule, and misaki's `pinyin_to_ipa` table (MIT
  lineage); `phonemeFrontends.zh.version` + `inputsSha256` gate re-renders. No clip depends on jieba's segmentation or
  the zdic data. Implemented in the audio session, not before; stored pinyin stays citation tones (decision 2).
- **Size:** ja is 8.9 MB for 2,036 files at Opus 16 kbps; zh will have about the same number of clips (≈ 900 lexemes,
  ≈ 270 reception clips, stories) → ≈ 9 MB, under the 12 MB cap. All languages today: 51.3 MB of 88 MB.
- Primer audio: the device voice until the clips exist.

## 8. Sources and licences (verified 2026-11-04)

| Source | Use | Licence (as read) | Ships? |
|---|---|---|---|
| ivankra/hsk30 (`hsk30.csv` re-hashed to the 2026-10-14 pin 8c2b73f7…; `hsk30-chars.csv` pinned 8c595710…) | HSK 3.0 levels 1–3 and level-1/2 characters as an anchor | repository LICENSE: MIT (Ivan Krasilnikov 2023, Shawky 2021, Pleco Inc. 2021); README: code MIT, data derived from two MIT repositories that transcribe the Ministry's list, with the Ministry's copyright notice and a note that it may be public domain under PRC law | no — level facts only, build time (registry `buildTimeOnly`) |
| CC-CEDICT, MDBG export retrieved 2026-11-04 (sha256 2ec9a065…, 3,983,195 bytes; header: CC BY-SA 4.0, 2026-11-03, 125,360 entries) | pinyin and traditional spelling of every lexeme | CC BY-SA 4.0 | yes, in the lexicon (attributed) |
| wordfreq 3.1.1 wheel (sha256 4b1c6ecf…), `large_zh` list | rank per word, selection evidence | data CC BY-SA 4.0, code Apache-2.0 | no |
| kaikki-en (P3a pool) | sourceRefs where the pool has the lemma | CC BY-SA 4.0 | refs only |
| Unihan 17.0.0 | Hán-Việt check | Unicode-3.0 (data scope) | check only |
| Course text | glosses, examples, objectives, guidebooks | original (`original-lexicon-etl`, `original-chinese-course`, MIT) | yes |

Not used: Tatoeba sentences (examples are original); FrequencyWords as `frequency` — the zh_cn subtitle list
mis-segments Chinese (的士 is its rank 1, 學生 rank 2,742), so zh lexemes carry no `frequency` field and the syllabus
orders lexemes within a unit without a frequency rank. The wordfreq export the pool pinned (wordfreq-zh.csv) cannot be rebuilt
byte for byte from the wheel without jieba (its Zipf values go through jieba); the ranks here are read from the
wheel's list directly. Session 2 (decision 13): the registry's `wordfreq` entry records it as the zh frequency source
of zh-vi — build-time selection evidence only, nothing ships; licence re-read on its README (code Apache licence, data
CC BY-SA 4.0 with credit to Google Books Ngram, SUBTLEX and OpenSubtitles). Lexemes still carry no `frequency`, and the
pool manifest's `frequencySourceId` stays frequencywords (no zh lexeme uses it).

## 9. Script

Simplified characters by default (the Mainland standard and HSK); traditional is accepted wherever the learner types
or speaks it, word by word through the stored `traditional` (P4b fold: 學生 = 学生); traditional is shown for
recognition only, on Taiwan signs and scenarios (Section 3 unit g/h, scenario "first day at a Taiwan factory"). The
stored traditional is the HSK list's Taiwan-first variant where CC-CEDICT has several (裡, 著, 隻).

## 10. Scenarios (21, 10 reserved; session 4)

Teaching: shop (fruit, pay by QR), restaurant order (with the Taiwan 便当 variant), asking the way to the subway,
taxi, clinic reception, the doctor, opening a bank account (form, password), factory safety briefing (helmet, gloves,
stop the machine), warehouse instructions (carry, put, count boxes), phoning in sick, first day at a Taiwan factory
(team leader, clock-in, dormitory). Reserved: new colleague, job interview, paying at a supermarket, the way to the
bank, a cough at the clinic, phoning the office (checkpoint 6); a shift change on WeChat, lunch in the canteen, a plan
with a friend, weekend small talk (capstone). Partner speech polite (您 with the learner as a new worker); the learner
uses 您 and 请 with bosses.

## 11. Learner data

- zh-en is never edited; every one of its 58 surfaces is a zh-vi lexeme with the pack's English gloss, so no legacy
  surface and no `legacy-unmapped.json`.
- No `src/content/ids/zh.json` is compiled yet (compile waits for the promote). At promote: add `zh` to
  `V8_REKEYED_TARGETS` with a fixture `v3-rc3-zh.json` and a test like `migrations-v8-ja.test.ts`. No new migration:
  `primerPassed` (v9) is keyed by course id.

## 12. Decisions taken in session 1

1. **English glosses are authored** (short, for tools and the zh-en pack); CC-CEDICT senses are not copied.
2. **Readings only from CC-CEDICT, citation tones** (tone sandhi is taught and rendered, never stored): the entry the
   HSK list confirms (tone-exact, else toneless), else the only reading, else the row's pinyin, which must be a
   CC-CEDICT reading; a set phrase with no entry is a chain of entries (您好 = 您 + 好). Nothing is guessed.
3. **One lexeme per surface**: of a homograph the course teaches the reading A1 needs (只 zhī the measure word, 还
   hái, 长 cháng, 得 de, 行 xíng, 重 zhòng, 干 gàn); the other reading comes later or through compounds (只是, 还书 as
   phrases). 地 and 中 are left out alone and taught in compounds.
4. **Lexicon committed to `content/`** (like ja); every course file (objectives, pack, syllabus, profiles) staged.
   `content:compile` is not run until promote, so `src/content/` is untouched.
5. **Lexeme ids:** toneless pinyin, ü as v (`zh:w:xuesheng`, `zh:w:lv`); the most common word of a spelling gets the
   bare id (A1 first, then HSK level, then wordfreq rank); another word with other tones gets the tone digits
   (`zh:w:hao-4` for 号), one with the same tones the first word of its English gloss (`zh:w:ta-she`). Frozen from now on.
6. **No `frequency` on zh lexemes** (§8).
7. **Proper nouns** (kind R): cities and three family names, never daily words, never a Hán-Việt reading, not counted as
   character targets; 张 is the measure word, not the family name.
8. **Examples:** an A1 example uses only characters of A1 surfaces (names aside), ≤ 20 characters, Chinese
   punctuation; an A2-1 example only characters of the lexicon (zh-lex.py enforces it).
9. **Hán-Việt review sheet regenerated in this session** (`content/hanviet/REVIEW.md`), so the bot's later compile finds
   it current (P4c lesson: the bot does not commit review sheets).

### Session 2 (2026-11-04; decisions 10–13 by the coordinator)

10. **Audio front-end** from the stored CC-CEDICT pinyin with tone sandhi for audio only (§7); built in the audio session.
11. **No automatic pinyin fade** in HSK 2 units for v1: the learner uses the existing `readingAid` toggle (§4).
12. **Unihan re-derived now** (§6): +12 characters; 工厂, 仓库, 经验, 辞职 get their Hán-Việt; the review sheet is regenerated.
13. **wordfreq registered** as the zh frequency source, build-time selection evidence only (§8).
14. **Lessons are written per section** into `_drafts/lessons/parts/<s>.jsonl`; `zh-check-answers.py` joins them into
    `lessons/OUTPUT.jsonl` and is the self-check (`REVIEW-NOTES.md`). Exercise text holds no pinyin: the app lays the
    stored readings under the hanzi, so every hanzi of an exercise lies inside a lexicon surface (the longest-match cut
    of `annotateText`), homographs appear only in their stored reading (只 zhī, 得 de, 还 hái, 长 cháng), and 中 / 地 only
    in compounds. Names of people use characters the lexicon reads (阮海, 阮南, 小王, 王经理, 李组长); proper nouns are
    never a daily word.
15. **Section 1 is tap-only** (ja decision 22 applied from the start): word banks and choices, no typeAnswer, dictation or
    fill-in without options; `zh-check-answers.py` stops on one. Typing (pinyin keyboard, hanzi keys) starts in Section 2.
16. **Measure-word and aspect fill-ins** replace conjugationCloze and articleSelect (24 and 11 items); the self-check
    reads each measure-word key against `zh_text.NOUN_MEASURES`, so no offered option is a second measure word the noun
    takes. `author.ts lint` reports them as "missing: conjugationCloze, articleSelect" by design, like Section 1's
    "missing: typeAnswer" and the Section 3–6 layer types the later sessions add.
17. **Typed keys** list numbers in digits and hanzi (2个 ⇄ 两个, 15块 ⇄ 十五块), the time word before and after the
    subject, 这儿/这里, 那儿/那里, 哪儿/哪里, 一点儿/一点, 有点儿/有点, 星期天/星期日, and the subject the Vietnamese
    states (`zh_text.widen`); the app folds traditional characters, punctuation and spaces itself.

### Session 3 (2026-11-04)

18. **No "pinyin until the primer" switch.** ja's `romajiUntilPrimer` hides a romaji line that duplicates the kana a
    learner can already read once the kana check is passed. Pinyin has no such duplicate: it is the only reading of a
    hanzi, and an A1 learner needs it for every new character long after the tone check (HSK 1–2 words are still met for
    the first time in Section 6). Hiding it at a pass would strand the learner. So the zh checkpoint records
    `primerPassed` (the v9 record, keyed by course id: no migration, no new profile flag), the primer card then says
    "passed", and pinyin stays under the characters until the learner turns off the course's `readingAid` switch
    (decision 11). The checkpoint texts say so ("Cách đọc vẫn hiện dưới chữ…"); the ja texts are chosen only for a kana
    primer (`isKanaPrimer`), so ja-vi and ja-en read exactly as before.

## 13. Next sessions

1. ~~**Lessons + concept cards**~~ done in session 2: 108 lessons, 811 exercises, 28 cards, self-check 0 findings
   (decisions 14–17). Left for the layer sessions: the Section 3–6 types that point at reception, speech, writing and
   scenario records (a `zh_lesson_refs.py` and the LC/RC/D/SP/WR/IX helpers of `ja_lesson_lib.py`).
2. ~~**Primer** (session 3)~~ done: §4, decision 18.
3. **Reception, speech, writing, scenarios** (session 4): readings, ≈ 220 clips, 50 speech items (`zh-CN`), 35 writing
   tasks, 21 scenarios (§10).
4. **Assessment + HSK 1–2 track** (session 5): checkpoints, placement, FORMAT-SOURCES.md from chinesetest.cn, two mock
   forms per level.
5. **Stories** (session 6): graded stories on the dictionary tokenizer of P4c (`scripts/lib/stories.ts`, script han).
6. **D-10 review, audio** (canary with the extra voices, the front-end of §7, generate, CER audit), promote, compile,
   V8 re-key, claim gate, KNOWN_LIMITATIONS, STATUS.

The four open questions of session 1 (audio front-end, pinyin fade, Unihan re-derive, wordfreq) were decided by the
coordinator on 2026-11-04 (decisions 10–13).

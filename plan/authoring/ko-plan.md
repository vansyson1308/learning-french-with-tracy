# P4e — `ko-vi` working plan (Korean for Vietnamese speakers + TOPIK I practice track)

Prompt: `plan/prompts/P4e-ko-vi-topik.md`, following `P3d-author-course-vi.md` with target `ko` and the additions of
`P4c-ja-vi-jlpt-n5.md`. Pedagogy brief: `plan/authoring/briefs/ko-vi.md` (its TOPIK I figures — 듣기 30 items / 40 min,
읽기 40 items / 60 min, level 1 from 80/200 — are to be confirmed on topik.go.kr in session 5). Voice decision:
`QC-2026-11-05.md` §2. Branch `phase-4/ko-vi`. Model: ja-vi
(`plan/authoring/ja-plan.md`). `content/ko/_drafts/_generators/` is the source of truth; change a generator, run
`bash content/ko/_drafts/_generators/ko-pipeline.sh` (byte-deterministic, offline), check with
`bun scripts/course-draft.ts validate --target ko`, and later `bun scripts/author.ts promote --target ko --native vi`.

## 1. Status after session 1 (2026-11-05)

| Layer | State | Where |
|---|---|---|
| Device-voice listening (engine) | profile flag `deviceVoiceScoredListening` (device-tts courses only, validated); listening + dictation graded through the local device voice; no voice → "chưa có giọng đọc trên máy" + install hint + skip (no evidence); Learn-tab note; reception validator asks no clip asset of such a language | `src/lib/reception/device-voice-listening.ts`, `use-device-listening-player.ts`, `use-listening-audio.ts`, `src/components/session/device-voice-missing.tsx` |
| Google Cloud TTS (prepared, OFF) | adapter, disabled engine entry, registry `pendingApproval` (`commercial-tts-output`, not allowlisted), dry-run test | `scripts/lib/tts/google-cloud.ts`, `content/audio/engines.json`, `content/sources/registry.json` |
| Lexicon | 995 lexemes: A1 783, A2-1 212; every one with `glosses.vi`, RR, an original example in vi + en; 5 names (kind R, `proper`) | staged `content/ko/lexicon/lexemes.json`, frozen ids staged `content/ko/lexemes.json` |
| Frequency anchor | 182 of the pool's 300 most frequent content entries taken; the 118 left out have a reason | `_generators/anchors-left-out.txt`, staged `content/ko/lexicon/REVIEW.md` |
| Hán-Việt | 194 course words added to the 37 P4b pairs (231); each passes the Unihan check or names the character in a note; false friends say so | staged `content/hanviet/ko.json`, source `_generators/hanviet-ko.txt`; Unihan subset re-derived (staged `content/hanviet/unihan-readings.json`) |
| Objectives | 38 (28 essential), claim policy v2, attainment, RESEARCH.md, TOPIK I references by section | staged `content/ko/assessment/`, `_drafts/objectives/topik-references.json` |
| Course skeleton | 6 sections, 27 units, 108 lesson stubs, 278 unit words, guidebooks in Vietnamese; pack audio policy `device-tts` with its reason | staged `content/courses/ko-vi.json`, `ko-vi.profile.json`, `ko-en.profile.json` |
| Syllabus | A1 783 by unit, A2-1 212 | staged `content/ko/lexicon/syllabus*.json`, `topic-units.json` |

### Session 2 (2026-11-05)

| Layer | State | Where |
|---|---|---|
| Concept cards | 31 cards (vi + en): Hangul, the three consonant series, 받침, sound changes; greetings, speech levels, the copula; 은/는, 이/가, 을/를, 에/에서, 도/만/하고/의; 해요 present, irregular stems, 있어요/없어요, adjectives; Sino and native numbers with counters, time and dates, the homographs 개 / 이 / 네 / 일; 안/못, -고 싶어요, requests, rules (-아도 돼요, -(으)면 안 돼요, -아야 해요), past, future, question words, 이/그/저, Hán-Việt and loanwords, connectors, family address | `_generators/ko-concepts.py` → staged `content/ko/pedagogy/concepts.json` |
| Paradigm tables | 17 verbs (가다 하다 보다 사다 타다 서다 켜다 기다리다 찾다 알다 살다 놀다 팔다 열다 쓰다 모르다 걷다), every cell evidenced by the verb's kaikki rows (decision 11) | `_generators/ko_paradigms.py` → staged `content/ko/pedagogy/paradigms.json` |
| Lessons | 108 lessons, 824 exercises: select 362 (targetToNative 179, nativeToTarget 159, listen 24), fillBlank 124 (40 particle fill-ins), match 101, wordBank 115, typeAnswer 99, conjugationCloze 23; concept steps in 50 lessons; Section 1 tap-only; Sections 3–6 hold the lesson-internal types (the layer exercises join in sessions 3–4) | `_generators/ko-lessons-s1…s6.py`, `ko_lesson_lib.py`, `ko_text.py` → staged `content/courses/ko-vi.json` |
| Answer self-check | 0 findings (rules in `ko-check-answers.py`; what it found on the way: `_drafts/REVIEW-NOTES.md`) | `_generators/ko-check-answers.py`, `_drafts/review/selfcheck.json` |
| Hangul primer | P4b section + 5 sound sections (5 tense consonants, 11 compound vowels, 15 finals with the 7 sounds, 9 double finals, liaison / nasalisation / ㅎ / palatalisation / tensing with pronounced spellings) and a 20-item checkpoint (pass 16) recording `primerPassed` | `_generators/ko-primer.py` → staged `content/ko/primer/script-primer.json`; engine: `content/schema.ts`, `scripts/lib/script-primer.ts`, `src/app/primer.tsx` |

`course-draft validate --target ko`: 3 errors left, all session 5 (no checkpoints.json, placement.json, attainment
reads the checkpoints). Two pipeline runs are byte-identical.

### Session 3 (2026-11-05)

| Layer | State | Where |
|---|---|---|
| Readings | 28: 19 teaching (units f-j), 5 checkpoint 3, 2 capstone, 2 placement | `_generators/ko-reception-s3.py` → staged `content/ko/reception/reading.json` |
| Listening clips | 92, no asset (device voice): 41 teaching, 21 assessment, 30 speech models | same → staged `content/ko/reception/listening.json` |
| Speech | 52 items (22 reserved), ko-KR | `_generators/ko-speech-s4.py` → staged `content/ko/speech/items.json` |
| Writing | 36 tasks (15 guided + 4 open teaching, 16 reserved; 5 forms) | `_generators/ko-writing-s5.py` → staged `content/ko/writing/tasks.json` |
| Lessons | 968 exercises; Sections 3–5 add listening 41, reading 36, dictation 5, speakProduction 33, speakRepetition 9, guidedWriting 18, simpleForm 2 | `_generators/ko_lesson_refs.py`, `ko-lessons-s3…s5.py` |
| Device voice, unscored | speech models and scenario partner lines read by the local ko-KR voice, else the install hint (no skip) | `src/components/exercises/model-playback.tsx`, `interaction-scenario.tsx`, `src/lib/reception/device-voice-listening.ts` |
| Self-check | rule 9 (layers); 0 findings | `_generators/ko-check-answers.py` |

`course-draft validate --target ko`: the same 3 assessment errors.

### Session 4 (2026-11-05)

| Layer | State | Where |
|---|---|---|
| Scenarios | 20 (8 teaching in units s–v, 12 reserved), 200 nodes, 120 partner clips (device voice) | `_generators/ko-scenarios-s6.py` → staged `content/ko/interaction/scenarios.json` |
| Writing endings | every slot lists its 해요 and 합니다 variants by kind (name / place / other); self-check rule 10 | `_generators/ko-writing-s5.py`, `ko-check-answers.py` |
| TOPIK I format | NIIED regulation 제204호 (2024-09-12), read 2026-11-05; topik.go.kr renders by script (cited, no figure taken) | `_generators/ko-topik-format.py` → `exam/topik-i-format.json`, staged `content/ko/exam/FORMAT-SOURCES.md` |
| Checkpoints | 6 sections + the A1 capstone, 2 disjoint forms each, 145 items, reserved records only; self-check rule 11 | `_generators/ko-assessment.py` → staged `content/ko/assessment/checkpoints.json` |
| Placement | 4 stages (foundations, building blocks, reception, production), 21 items | same → staged `content/ko/assessment/placement.json` |
| Stories | 43 graded (A1-1 12, A1-2 16, A2-1 15) + 2 micro, 7,334 tokens, device voice | `_generators/ko_stories_lib.py`, `ko-stories-00…06.py`, `ko-check-stories.py`, `ko-stories-seed.py` → staged `content/ko/stories/stories.json` |

`course-draft validate --target ko`: **0 errors**. `ko-vi-checkpoints.test.ts` and `ko-vi-stories.test.ts` (the real
story validator over the staged layer) pass. Two pipeline runs are byte-identical.

## 2. Course shape (BLUEPRINT §1)

Before Section 1: the Hangul primer (`/primer`, `content/ko/primer/script-primer.json`, P4b: 14 consonants, 10 vowels,
block examples). Session 2 extends it (§4).

| Section | Units (ids) | Exercise mix |
|---|---|---|
| 1 Nhập môn | 1 Lời chào · 2 Tôi là ai? · 3 Gia đình · 4 Ăn và uống · 5 Số và tiền | select, wordBank, fillBlank (with options), match; **no free Hangul typing** (ja decision 22): production by word bank tiles |
| 2 Viên gạch nền | a 이에요 và 은/는 · b Động từ 해요 · c 있어요/없어요 và tính từ · d Giờ, số thuần Hàn, lượng từ · e Chữ và âm (받침, biến âm, Hán-Việt) | select, conjugationCloze (해요 forms), particle fillBlank (은/는, 이/가, 을/를, 에/에서), typeAnswer (Hangul typing starts here) |
| 3 Hiểu tiếng Hàn hằng ngày | f Thời tiết (nghe từ) · g Biển báo và nội quy nhà máy · h Thông báo tàu điện, xe buýt · i Cửa hàng tiện lợi · j Ký túc xá | listening (device voice) / reading comprehension, dictation, select, match |
| 4 Nói | k Chào hỏi ở chỗ làm · l Tự giới thiệu khi phỏng vấn · m Nói số và giờ · n Kể và mô tả | speakProduction, speakRepetition (`ko-KR` recogniser), select |
| 5 Viết | o Viết về mình · p Câu đơn giản, 안/못 · q Tin nhắn cho tổ trưởng · r Giấy tờ ở 고용센터 | guidedWriting, wordBank, simpleForm (이름, 생년월일, 외국인 등록 번호) |
| 6 Trò chuyện | s Cửa hàng và quán ăn · t Hỏi đường · u Phòng khám, nhà thuốc · v Gọi điện cho chỗ làm, ngân hàng | interactionScenario, select, wordBank |

`articleSelect` has no Korean counterpart; its Section 2 slot goes to particle fill-ins (as ja).

## 3. TOPIK I targets

- **TOPIK I** = levels 1–2, sections 듣기 (listening) and 읽기 (reading) only. The exam-track session reads
  `https://www.topik.go.kr/` first and records URL + date in `content/ko/exam/FORMAT-SOURCES.md` (number of items,
  times, pass marks per level) before authoring; until then `topik-references.json` says
  `checkedAgainstOfficialSource: false`. Original items only, ≥ 2 mock forms, readiness "mức sẵn sàng ước tính",
  never "sẽ đỗ". TOPIK levels are not CEFR levels and the app never says so. EPS-TOPIK shares the scenario world but
  its items and word list are not reproduced.
- **Vocabulary**: no allowlisted list can be fetched. The NIKL 한국어 학습용 어휘 목록 (KOGL Type 1) is an owner
  download (`OWNER-FINAL-CHECKLIST.md` C); when the file arrives, add it as an anchor exactly like OpenJLPT (build time
  only, attributed) and re-run the anchor report. Today: frequency (FrequencyWords via the P3a pool) + kaikki lemmas,
  documented in the staged `content/ko/lexicon/REVIEW.md`.
- **Grammar (TOPIK I level 1–2, taught by the end of Section 6)**: 이에요/예요, 아니에요, 입니다; 은/는, 이/가, 을/를, 에, 에서,
  도, 의, 하고/와/과, (으)로, 까지, 부터, 에게/한테; 해요 present with the 아/어 contraction; 았/었어요; (으)ㄹ 거예요,
  (으)ㄹ게요; -(으)세요, -지 마세요, -아/어 주세요, -아/어도 돼요, -(으)면 안 돼요; 안 / 못 / -지 않아요; 있어요/없어요; -고
  싶어요; -고 (and then), -아/어서 (reason, recognition), -지만; question words; the two number systems and counters
  (명, 시, 분, 살, 병, 잔, 장, 권, 마리, 대, 번, 층, 원); 합쇼체 set phrases; honorific -시- in set forms (계세요, 드세요,
  가세요). Every point gets a concept card or a lesson `flow` step; the exam's grammar items draw only on this list.

## 4. Hangul primer (session 2; P4b primer extended)

Done in session 2 (staged; decision 9). P4b had 14 basic consonants, 10 vowels, block examples. Added: the tense consonants ㄲ ㄸ ㅃ ㅆ ㅉ and the plain /
tense / aspirated contrast (가 까 카), the 11 compound vowels (ㅐ ㅔ ㅒ ㅖ ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ), 받침 with the 7
representative sounds and the double finals (ㄳ ㄵ ㄶ ㄺ ㄻ ㄼ ㄾ ㅀ ㅄ), the sound changes the course needs (연음 liaison,
비음화 nasalisation 합니다 [함니다], ㅎ aspiration 좋다 [조타], 경음화 recognition), and a checkpoint (≈ 20 items: block →
RR select, sound → block, minimal pairs 달/딸/탈, 불/뿔/풀). The primer is offered first, never forced. Engine: the
P4c primer checkpoint and `primerPassed` (v9) are generic; ko needs no new migration unless a romanization line is
wanted (decision 5: not now — RR is the reading aid already shown by `RubyText`).

## 5. Speech levels, numbers, Hán-Việt

- **해요체** is the default of every lesson, example and partner line. **합쇼체** only in set phrases (감사합니다,
  알겠습니다, 수고하셨습니다, 처음 뵙겠습니다), self-introduction at an interview, announcements and the workplace
  report. **반말** only where the plan says: recognition in unit k ("don't use it with a boss"), the lexeme 나, and
  friend dialogues in stories (session 6). The learner never produces 반말 to a superior.
- **Numbers**: Sino-Korean for prices, dates, minutes, phone numbers, floors, bus and exit numbers; native for hours,
  ages and counting with counters. Homographs limit the lexicon (§10, decision 4): the Sino 2 (이) and the native
  counter form 네 are taught in the numbers concept card, not as lexemes.
- **Hán-Việt** (QC 2026-11-03 §2, P4b rules): only Sino-Korean words with hanja, never a native word, never a mixed
  word (교통카드, 고용센터) or a name. False friends carry a note the D-10 reviewer reads first: 공장 (công trường), 출구 /
  입구 (xuất khẩu / nhập khẩu), 시험 (thí nghiệm), 질문 (chất vấn), 취미 (thú vị), 식사 (thực sự), 불량 (bất lương), 비상구
  (phi thường), 재료 (tài liệu), 운전 (vận chuyển), 계단 (giai đoạn), 기차 (汽車 is a car in Chinese), 문자 (văn tự).

## 6. Scenarios (18, 10 reserved; session 4)

Work in Korea first (EPS): first day at the factory (자기소개), safety on the line (helmet, gloves, stop the machine,
report an accident), the employment centre (고용센터: change workplace, contract extension), the immigration office
(외국인 등록증), convenience store (bag, heating, card), restaurant order, bank (open an account, send money home),
clinic (reception, symptoms) and pharmacy (dose), phone to the employer (ill, late), message to the team leader,
dormitory rules (recycling day), asking the way, the subway (transfer), a farm (greenhouse, harvest), a fishing boat
(nets). Partner lines in 해요체; they are read by the device voice (unscored playback, D-5 allows it); the learner
speaks through the `ko-KR` recogniser.

## 7. Voice and audio (QC 2026-11-05 §2)

- **Now: the device voice.** Pack `audio.policy = device-tts`; profile `deviceVoiceScoredListening`. Listening and
  dictation are graded when a local ko-KR voice is installed; otherwise skipped with the hint, never wrong, so the
  claim gate counts only items actually heard. One voice reads both parts of a dialogue, B at pitch 0.8. Word-level
  playback (`speakTarget`: match pairs, select feedback) already falls back to the device voice for any course.
  Engine item, **scheduled for session 3** (coordinator 2026-11-05): partner turns in `interaction-scenario.tsx` and
  speech models in `speak-repetition.tsx` / `speak-production.tsx` resolve clips through `clipAudioSource` only — they
  follow the same rule as listening for a `deviceVoiceScoredListening` course: played (and, for listening, graded)
  through the local ko-KR voice when one is installed, otherwise the "chưa có giọng đọc trên máy" install hint.
- **Prepared: Google Cloud Text-to-Speech** (`scripts/lib/tts/google-cloud.ts`, OFF). Terms
  (`https://docs.cloud.google.com/text-to-speech/docs/basics`, read 2026-11-05): the generated files may "power your
  applications". Cast A `ko-KR-Neural2-A` (female), B `ko-KR-Neural2-C` (male); fallback `ko-KR-Wavenet-A` / `-C`.
  Unlock = the owner approves `commercial-tts-output` + creates the secret `GOOGLE_CLOUD_TTS_API_KEY` (B2); then wire the
  engine into `scripts/audio.ts`, canary + SenseVoice CER audit, generate, and the pack policy leaves device-tts.
- **Documented option**: self-training on CC BY 4.0 data (`release/AUDIO_PROVENANCE_FINAL.md`), no GPU money now.
- MeloTTS-KR stays excluded (D-11: no declared training data).

## 8. Sources and licences (verified 2026-11-05)

| Source | Use | Licence | Ships? |
|---|---|---|---|
| FrequencyWords (P3a pool) | frequency on 469 lexemes; the anchor | CC BY-SA 4.0 | yes (frequency fields) |
| kaikki-en (P3a pool) | sourceRefs on 481 lexemes; English senses read, not copied | CC BY-SA 4.0 | refs only |
| Wiktionary romanization (in the pool) | confirms the RR of 474 lexemes (P4b) | CC BY-SA 4.0 | check only |
| Unihan 17.0.0 (pinned sha256 f7a48b2b…) | Hán-Việt check, re-derived with the ko-vi hanja | Unicode-3.0 (data scope) | check only |
| Revised Romanization rules (NIKL rule text) | RR by the project's own code | — (rules, not data) | yes (RR) |
| Course text | glosses, examples, objectives, guidebooks | original (`original-lexicon-etl`) | yes |
| Google Cloud TTS output | prepared, not used | `commercial-tts-output`, **pending owner approval** | no |

Not used: Tatoeba sentences (examples are original), NIKL list (owner download pending), MeloTTS-KR (D-11),
Urimalsaem (coordinator 2026-11-05: CC BY-SA 2.0 KR is not on the allowlist, so it is not used; an optional owner line
in `OWNER-FINAL-CHECKLIST.md` C asks for a licence review).

## 9. Learner data

- ko-en is never edited. Every one of its 57 words is a ko-vi lexeme with the pack's English gloss (`잘 가요`,
  `새끼 고양이` included, possible since spaced surfaces are allowed); no `legacy-unmapped.json` is needed.
- No `src/content/ids/ko.json` is compiled yet. At promote: add `ko` to `V8_REKEYED_TARGETS` with a fixture
  `v3-rc3-ko.json` and a test like `migrations-v8-ja.test.ts` (the roadmap's open blocker, legacy-course re-key).

## 10. Decisions taken in session 1

1. **Everything is staged**, the lexicon, the frozen id map and the Hán-Việt table included (ja wrote those three to
   `content/` directly): a real `content/ko/lexicon/lexemes.json` or `content/hanviet/ko.json` changes compiled files
   the goldens pin, and this session must not re-bless. The Unihan subset is re-derived into the staged layer too.
2. **Glosses and examples are authored**; kaikki senses are not copied. Examples are 해요체, ≤ 40 characters, Hangul
   and digits only; the generator checks that each uses its word (해요 contractions, 하다 roots, `form=` for irregulars).
3. **RR**: a pool lemma keeps the reading P4b confirmed; every other word is the rule output, and a disagreement with
   Wiktionary is listed (6: ㄱ/ㄷ/ㅂ + ㅎ aspiration in 깨끗하다, 착하다, 비슷하다, 특히, 솔직히, 정확히 — the official rule
   aspirates; Wiktionary keeps ㅎ). Rule fixes in this session: spaced set phrases are valid RR surfaces (word by word);
   ㄺ before ㄱ reads ㄹ only in a verb stem (닭고기 dakgogi). `rrs=` marks a compound boundary (맛+없다 madeopda).
4. **One lexeme per surface** (the schema's rule). Korean homographs that matter at A1 keep one sense: 개 dog (ko-en),
   이 "this", 네 "yes", 눈 eye, 안 "not", 일 "one / day of month", 만 ten thousand, 팔 eight, 열 ten, 배 belly, 차 tea,
   말 horse, 새 bird, 밤 night. The other senses are taught in concept cards and exercises without their own card.
   **Coordinator, 2026-11-05: no sense-keyed lexemes for v1.0.** The homographs stay handled by the concept card
   `ko:concept:homographs` (개 dog / counter, 이 this / two, 네 yes / four, 일 one / day / work). Sense-keyed lexemes
   (surface + sense id) are a post-v1.0 engine item.
5. **No romanization gate**: RR is a reading aid in `RubyText`; no `romajiUntilPrimer`-style line for ko.
6. **Lexeme ids**: `ko:w:<rr>` from the RR (hyphens kept), a clash takes the English gloss's first word. Frozen.
7. **Proper nouns** (민수, 지영, 서울, 부산, 하노이): kind R, never daily words, no Hán-Việt. Countries are ordinary nouns.
8. **Expressions carry no frequency** (the lexicon validator: a pool count on an authored phrase would be fabricated).

### Session 2 (2026-11-05)

9. **The primer and the source registry are staged too.** The committed P4b primer compiles into the golden-pinned
   `src/content/primer/ko.json`, and `content/sources/registry.json` feeds the golden-pinned `ATTRIBUTIONS.md`; both
   are written to the staged layer (`ko-primer.py`, `ko-concepts.py` — the registry copy is the committed registry plus
   `original-korean-course`, regenerated on every run, so promote must take the registry of `main` at that time).
   The primer engine is generic: a `hangulSounds` section kind (letters by position, example rows, pronounced
   spellings checked against the RR rules, tensing against plain → tense initials) and two checkpoint item kinds
   (`hangulToRr`, `soundToHangul`) with the checkpoint's own pass / entry wording (`messages`), since passing turns
   nothing off for ko (decision 5). Tests in `scripts/__tests__/script-primer.test.ts`.
10. **Section 1 is tap-only** (ja decision 22): word banks and choices; Hangul typing starts in Section 2.
    `ko-check-answers.py` rule 7 stops on a typed exercise in a Section 1 lesson.
11. **conjugationCloze evidence**: the kaikki derivation tags Korean rows only `inf` / `formal` / `informal`;
    `tagKoreanCells` (ko-morph.ts, test first in `cjk-paradigms.test.ts`) names the cells from each verb's own rows —
    present = an `inf` row + 요 that is an informal row, past = that infinitive + ㅆ어요, honorific = the informal row in
    세요, future = the stated prospective modifier + 거예요 (marked `composed`). A verb whose table lacks a row has no
    table (먹다: 드세요; 주다: the table states 주었어요, the course teaches 줬어요). The cloze shows no cell label, so
    every cloze sentence fixes its form (매일 for the present, 어제 for the past, 아마 for the future; a 해요 key
    for "Hãy …" also accepts 써 주세요 and 쓰십시오).
12. **Fair renderings are generated, not hand-listed** (`ko_text.variants`, D-10 P0 patterns of ja-vi): the subject
    the Vietnamese states (저는 … / …), 제 / 우리 / 저희 / nothing before a family word, digits ⇄ Hangul numbers with the
    right system, 안 V ⇄ V-지 않아요, 못 V ⇄ V-지 못해요, an object particle dropped, 이/가 dropped before 있어요 /
    없어요 / 아파요, a leading time word with or without 은/는, 이거 ⇄ 이것은, 하고 ⇄ 와/과 ⇄ (이)랑, 에게 ⇄ 한테, the 해요
    key in 합쇼체, 은/는 ⇄ 이/가 on the subject of an adjective, a counted noun with 을/를. Typed answers list them; a
    word-bank tile the learner may leave out (저는) becomes an alternative; the self-check uses the same function to
    find a distractor that is also correct.
13. **Word check** (`ko_text.Index`): every word of a key is a lexicon surface, a form of a lexicon verb (the
    conjugator covers ㅂ ㄷ ㅅ 르 ㅎ 으 ㄹ stems and 하다), a noun with its particles or copula in the right allomorph, a
    name, a number with its counter, or one of a few grammar words (거예요, 싶어요, 않아요, 마세요, 수, 거, 때, the
    suppletive 드세요 / 계세요 / 주무세요). Distractors are checked for script only (they are wrong on purpose).
14. **Vietnamese glosses** write "anh chị", never "anh/chị": the synonym-distractor validator splits glosses on "/", so
    안녕히 가세요 and 안녕히 계세요 shared the meaning "chào anh".

### Session 3 (2026-11-05)

15. **합쇼체 renderings of a 해요 key are accepted** (coordinator, after session 2): `ko_text._formal_forms`, tested in
    `scripts/__tests__/ko-vi-formal-answers.test.ts`.
16. **Unscored device voice** (coordinator 2026-11-05): a speech model and a scenario partner line of a
    `deviceVoiceScoredListening` course without a bundled clip are read by the local voice; with no voice the notice
    and install hint show without a skip, since nothing is graded — the target, the microphone and the partner's
    text stay. A partner line reads its clip's transcript, else the node text.
17. **ko writing is graded by spaced words.** The build-time ko rules have no lexicon, so the tokenizer cuts at spaces
    (eojeol); a slot variant must be a spaced word or run the answer itself writes. Noun slots list the noun with its
    particles and copula (남이에요, 안산에, 스물세 살이에요); a greeting slot is 안녕하세요 alone (one greeting, not two);
    no `requireSentenceVerbs` (a ko verb is an ending). The runtime tokenizer (lexicon maximal match) gives the same
    verdict on these runs; a D-10 check of the slot lists is noted in REVIEW-NOTES.
18. **Dictation accepts the spelling without spaces** (strict grading keeps spacing; 띄어쓰기 is not the A1 target),
    and dictation clips carry no digits.
19. **Assessment records are authored with their layers** (as ja): the checkpoint 3 / capstone / placement readings and
    clips, the reserved speech items and writing tasks exist now; session 4 builds the checkpoint and placement files on
    them.

### Session 4 (2026-11-05)

20. **Scenarios before the assessment** (coordinator): checkpoint 6 and the capstone sample the reserved scenarios.
21. **Writing slots keep the build-time split** (coordinator): the generator adds the common endings per slot kind;
    rule 10 checks every 해요 variant has its 합쇼체 rendering and a bare-noun slot both N이에요/예요 and N입니다.
22. **TOPIK I is cited from NIIED's regulation**, with the URL and the date read; results are "mức sẵn sàng ước tính",
    never a TOPIK level or certificate.
23. **Two parallel forms per checkpoint**: items alternate a / b per objective, so each form holds ≥ 2 items of every
    objective the checkpoint samples (P9 §39); the capstone's forms are explicit, one objective per domain. Register
    (politeness.speech_levels) is assessed in Section 2 by situation → register choice; negation in Section 5.
24. **Stories are graded by the engine's eojeol tokens**: the builder writes each authored word's lexeme into the
    story's tokenMap; no story bundles audio (D-11); a story never ends a sentence in 반말.

## 11. Next sessions

1. ~~**Concepts + lessons**~~ done in session 2: 31 cards, 17 paradigm tables, 108 lessons / 824 exercises, the
   Hangul primer and its checkpoint, the self-check at 0 findings.
2. ~~**Reception + speech + writing**~~ done in session 3: 28 readings, 92 clips, 52 speech items, 36 writing tasks,
   the unscored device voice, self-check rule 9 (decisions 15–19).
3. ~~**Session 4**~~ done: scenarios, writing endings, the TOPIK I format, checkpoints in 2 forms, placement,
   attainment, 45 stories; `course-draft validate --target ko` at 0 errors (decisions 20–24).
4. **TOPIK I practice track** (exam/ mock forms, as ja's JLPT N5 track): 2 mock forms in the PBT format recorded in
   `exam/topik-i-format.json`; device-voice listening (a skipped item is no evidence in the mock either).
5. **D-10 review** (AI pass, then the owner; REVIEW-NOTES "Open for the reviewer"), promote (rebuild the registry from
   main's, the reception manifest with `stories/story-audio.json`), compile, V8 re-key, claim gate, STATUS. Audio:
   Google route if the owner approves (B2), else the device voice stays.

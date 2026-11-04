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

`course-draft validate --target ko`: the remaining categories are the empty lessons (108 × "needs ≥ 5 exercises", 81
stub-payload repeats) and the missing checkpoints and placement (3). Everything else validates with the staged layer.

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

Today: 14 basic consonants, 10 vowels, block examples. To add: the tense consonants ㄲ ㄸ ㅃ ㅆ ㅉ and the plain /
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
  Open engine item for session 3/4: partner turns in `interaction-scenario.tsx` and speech models in
  `speak-repetition.tsx` / `speak-production.tsx` resolve clips through `clipAudioSource` only — wire the device voice
  there for a `deviceVoiceScoredListening` course (unscored playback).
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
Urimalsaem (not needed by session 1; if used later it stays a separate CC BY-SA 2.0 KR data file — that licence is
not on the allowlist, so it needs an owner decision first).

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
   **Open question for the coordinator**: should the engine allow sense-keyed lexemes (surface + sense id) for ko?
5. **No romanization gate**: RR is a reading aid in `RubyText`; no `romajiUntilPrimer`-style line for ko.
6. **Lexeme ids**: `ko:w:<rr>` from the RR (hyphens kept), a clash takes the English gloss's first word. Frozen.
7. **Proper nouns** (민수, 지영, 서울, 부산, 하노이): kind R, never daily words, no Hán-Việt. Countries are ordinary nouns.
8. **Expressions carry no frequency** (the lexicon validator: a pool count on an authored phrase would be fabricated).

## 11. Next sessions

1. **Concepts + lessons** (session 2): ≈ 20 concept cards (particles in pairs, 해요 contraction, 안/못, two number
   systems and the homograph counters 개 / 이 / 네, speech levels, 받침 and sound changes, Hán-Việt and false friends,
   irregular stems), 108 lessons with the blueprint mix, Section 1 tap-only (self-check rule: no typed Korean in
   Section 1, checkpoints or placement Section 1 items); the answer-key self-check (`ko-check-answers.py`) and review
   findings written incrementally (QC §1.4). Hangul primer extension (§4).
2. **Reception + speech + writing** (session 3): readings, clips (no assets: device voice), speech items (`ko-KR`),
   writing tasks; the device voice for speech models.
3. **Scenarios** (session 4) with the device voice for partner turns (§7 open engine item).
4. **Checkpoints, placement, TOPIK I track** (session 5): read topik.go.kr first; 2 mock forms; device-voice listening
   (a skipped item is no evidence in the mock either).
5. **Stories** (session 6), **D-10 review** (AI pass, then the owner), promote, compile, V8 re-key, claim gate,
   STATUS. Audio: Google route if the owner approves (B2), else the device voice stays.

# ko-vi — authoring notes for the D-10 review (P4e)

## Session 2 (2026-11-05): concept cards, lessons, primer, answer self-check

**What exists.** 31 concept cards (vi + en), 17 paradigm tables, 108 lessons / 824 exercises (select 362, fillBlank 124
with 40 particle fill-ins, wordBank 115, match 101, typeAnswer 99, conjugationCloze 23), concept steps in 50 lessons;
the Hangul primer extended (5 sound sections, 20-item checkpoint). All staged; `ko-pipeline.sh` regenerates it
byte for byte.

**How the keys were checked.** `ko-check-answers.py` (rules 1–8 in its docstring) runs in the pipeline and stops on a
finding; it ends at **0 findings, 0 decided**. The generator library (`ko_lesson_lib.py`) already stops on a word
outside the lexicon, a wrong particle or copula allomorph, a number of the wrong system before a counter, Latin
letters, a 반말 key, a Vietnamese prompt that shows Korean and two options with one gloss. A seeded test (10 planted
mistakes: 이/은 both offered, a distractor that drops 저는, a typed key without its digits, 삼 시, 집에서 있어요, a 반말
key, 합니다 mixed with 해요, 물를 and an unknown verb, a typed Section 1 item, 공장에 일해요) was flagged in full and
then removed.

**What the checks found on the way, and what changed.**

| Found | By | Count | Resolution |
|---|---|---|---|
| A word bank whose answer stays correct without one tile (저는 학생이에요 → 학생이에요; 우리 어머니는 → 어머니는) — the learner's correct sentence would have been marked wrong (the ja-vi P0 family) | self-check rule 1 (tile-drop) | 10 word banks | `W()` now adds every such shorter sentence as an alternative (ko_text.variants) |
| A conjugation cloze whose sentence did not fix the form (내일 … ___ with the present key; the future key where 가요 also answers "sẽ đi") — the cloze shows no cell label | author's read-through | 5 clozes | sentences rewritten: 매일 for the present, 아마 for the future (a guess takes -(으)ㄹ 거예요 only), a third person so -(으)ㄹ게요 cannot answer |
| "Hãy viết …" answered as well by 써 주세요 / 쓰십시오 | read-through | 2 clozes | the honorific key accepts both |
| Typed answers missing a natural rendering: the 합쇼체 of a 해요 key, 은/는 ⇄ 이/가 on the subject of an adjective, 사과를 두 개, and hand paraphrases (한국어를 배워요, 오늘은 날씨가 더워요, 내일은 추울 거예요, 문을 닫아 주세요, 카드로 계산할게요 …) | read-through | 17 typed items by hand; every typed item through the new rules | rules added to `ko_text.variants`; 92 of the 99 typed answers carry alternatives (the 7 single words need none) |
| Over-generated renderings (오늘이 더워요, 공부와 싶어요 from the -고 of 공부하다, 저는 알겠습니다, 되지 않아요 for 안 돼요, 거입니다, 사진을 두 장이 필요해요) | read-through of all 99 typed items | 7 patterns | the rules narrowed (no time word, counter or 아니다 in the topic swap; 하고 only after a noun; no 저는 before a set phrase; no 되다 in the negation swap; 거예요 → 겁니다; the counted object only before 주세요 / 사요) |
| A listening choice that differed from the key only by "?" (비가 와요 / 비가 와요?) — the device voice may not show the intonation | read-through | 1 | distractor 비가 안 와요 |
| A distractor that is also correct (여기에 가까워요? "close to here"; 고용센터에 와요 for "Tôi đến …") | read-through | 2 | replaced (여기에서 가까웠어요?, 고용센터를 몰라요) |
| 은/는 against 을/를 before the copula (저를 … 이에요 is no rival) | self-check, first run | 8 false findings | rule 1 compares topic and object only before an action verb |
| 반에 / 주에 read as places (세 시 반에 만나요, 다음 주에 쉬어요) | self-check | 2 false findings | time words before 에 excluded from the place rule |
| Checker gaps: 누가 / 제가, 서른 before 살, the honorific 께 | generator library | 3 | added to ko_text |
| Synonym-distractor validator: 안녕히 가세요 / 안녕히 계세요 (and 여기요 / 저기요) shared "chào anh" because the glosses wrote "anh/chị" | `course-draft validate` | 2 errors | glosses write "anh chị" (8 lexemes in core-0.txt, core-a2.txt) |
| 주다: the kaikki table states 주었어요, the course teaches 줬어요 | paradigm validator | 1 | no table for 주다 |
| Vietnamese words in English concept text (học, hát, họp; đã, rồi) | english-fields validator | 2 | English rewritten |

**Coordinator decision (2026-11-05, after session 2): 합쇼체 renderings of a 해요 key are accepted.** They are correct,
only more formal (가요 → 갑니다, 학생이에요 → 학생입니다, 갈 거예요 → 갈 겁니다, 가고 싶어요 → 가고 싶습니다, 아니에요 →
아닙니다, 조심하세요 → 조심하십시오, 안녕하세요 → 안녕하십니까). `ko_text._formal_forms` generates them for every typed
key unless the prompt asks for the familiar style; `scripts/__tests__/ko-vi-formal-answers.test.ts` checks eight known
keys through the ko rules' lenient form and that every 해요 key lists a 합쇼체 rendering. Writing it found 5 keys the
first rule missed (아니에요, -고 싶어요 ×3, 안녕하세요); the rule now covers the auxiliaries.

## Session 3 (2026-11-05): readings, device-voice clips, speech, writing

**What exists.** 28 readings (19 teaching, 5 checkpoint 3, 2 capstone, 2 placement), 92 clips (41 teaching, 21
assessment, 30 speech models), 52 speech items (22 reserved), 36 writing tasks (15 guided + 4 open teaching, 16
reserved; 5 forms). Sections 3–5 lessons point at them through `ko_lesson_refs.py`: listening 41, reading 36,
dictation 5, speakProduction 33, speakRepetition 9, guidedWriting 18, simpleForm 2; 968 exercises in all. No clip
has an asset: listening is graded through the device's ko-KR voice, or skipped with the install hint.

**What the checks found on the way, and what changed.**

| Found | By | Count | Resolution |
|---|---|---|---|
| Words outside the lexicon in first drafts (마실래요, 근처, 자기소개, 소개, 규칙, 계산 as a noun, 요리 as a noun, 안 as "inside" — 안 is the lexeme "not") | generator word check | 12 | rewritten with lexicon words (드릴까요, 옆, 공장에서, 계산대에서 계산하세요, 요리하는 것) |
| A vocative 흐엉아 in the capstone mother's message (family 반말) | word check | 1 | 흐엉, — the message stays 반말, read only (marked plain) |
| Writing slots that were bare nouns (남, 안산, 스물세 살): the build-time ko tokenizer cuts at spaces, so 남이에요 is one token and 남 no run of it — 14 model answers did not meet their own rubric | writing validator | 14 tasks | a noun slot now lists the spaced words an answer writes (남이에요, 남입니다, 안산에, 안산에서 …) |
| A greeting realized twice (반장님, 안녕하세요 with both as variants: "keyword stuffing") and a day named twice in one model | writing validator | 5 | the greeting slot is 안녕하세요 only; the model says 그래서 |
| The self-check's layer rules (rule 9) on 5 planted mistakes (a Korean question, repeated options, a key not in its text, a dictation without its no-space spelling, a Latin spoken variant, missing spoken renderings, a slot the model does not realize) | seeded test | 11 flags | all flagged, then removed |

**Open for the reviewer.** Writing is graded by whole spaced words: a learner who writes 남 이에요 or puts a particle
the slot does not list (남이라고 해요) is told the slot is missing. The slots list the common forms; the D-10 pass
should read the slot lists of the 19 teaching tasks.

## Session 4 (2026-11-05): scenarios, writing endings, assessment, TOPIK I, stories

**Scenarios.** 18 (8 teaching in units s–v, 10 reserved for checkpoint 6 and the capstone), 180 nodes, 108 partner
clips (device voice). Every partner line is word-checked; learner answers are 해요체 grading strings widened by the fair
renderings, Hangul only; required concepts list the spaced words that carry them (역이 / 역은), since the build-time
tokenizer cuts at spaces. First run: 0 word problems, 0 scenario validator errors.

**Writing endings (coordinator).** Every noun slot now lists, by kind: a name with 은/는, 이/가, 이에요/예요, 입니다,
이었어요, (이)라고 해요 / 합니다 and 씨; a place with its place particles and the copula; anything else with the common
particles and the copula; every 해요 phrase its 합쇼체 rendering. Self-check rule 10 checks it; its first run flagged
2 slots (남 씨 / 란 씨 without a copula) — the rule now skips 씨, which takes no copula there.

**For the D-10 reviewer (read first).**
- Section 1 is tap-only: no typed Korean before the primer. Typing starts in Section 2.
- 해요체 everywhere; 합쇼체 only in set phrases, the interview (unit l, ua-l3) and announcements; 반말 only in two
  recognition items of unit k (uk-l0, uk-l2), each option marked "(Nói thân mật …)", and as wrong options.
- Numbers: native for hours, ages and counted things, Sino-Korean for money, minutes, dates, floors, phone and bus
  numbers; typed keys accept digits and Hangul.
- The homographs 개 (dog / counter), 이 (this / two), 네 (yes / four), 일 (one / day / work) keep one lexeme each
  (coordinator, 2026-11-05); the card `ko:concept:homographs` teaches the other senses.
- The Vietnamese comparisons of the primer and the cards are approximations and say so.
- Sections 3–6 carry their readings, device-voice clips, speech items, writing tasks and scenarios (sessions 3–4);
  checkpoints and the capstone use only the reserved records (cp*, a1cap_*, pl_*), never a teaching stimulus.

**TOPIK I format (coordinator).** `content/ko/exam/FORMAT-SOURCES.md` (staged) and `exam/topik-i-format.json` record
the format from NIIED's regulation 제204호 of 2024-09-12 (niied.go.kr preview), read on 2026-11-05: PBT 듣기 30 items
/ 40 min and 읽기 40 items / 60 min, 1급 80–139 and 2급 140–200 of 200; IBT 30 / 40 min and 30 / 45 min, 1급 132–207
and 2급 208–400 of 400. The topik.go.kr guide page renders by script and the fetch returned only its title, so no
figure comes from it; it is cited as the page a reviewer should compare by hand. `topik-references.json` now says
`checkedAgainstOfficialSource: true` with the date and the document. Every checkpoint text says "mức sẵn sàng ước
tính", never a TOPIK level or a certificate.

**Assessment.** 6 section checkpoints and the A1 capstone, each in 2 parallel forms (145 items: 16 / 32 / 33 / 16 / 20
/ 8 and 20), and a 4-stage placement (foundations, building blocks, reception, production; 21 items, anchors in
curriculum order). Each form holds ≥ 2 items of every objective its checkpoint samples (items alternate a / b per
objective); the capstone's forms are explicit, one objective per domain, 2 items each. Essential objectives with no
checkpoint item got 4: script.hangul and politeness.speech_levels (Section 2, the register a situation asks for) and
negation.an_mot (Section 5). Reserved records added for the second forms: 3 clips and 1 reading (Section 3), 2
description speech items, 4 writing tasks, 2 scenarios (weekend talk, pharmacy). Self-check rule 11 runs every
answer rule over both banks. Findings on the first runs: 1 non-word (모 → 차), 4 items repeating a lesson payload
(rewritten), 1 distractor that is a fair rendering of the key (마십니다 for 마셔요 in a register item: replaced by
마십니까 / 마시십시오 / 마셔), Hangul in one Vietnamese description (rewritten). `course-draft validate --target ko`: 0
errors.

**Graded stories (coordinator: 40–50, as for de-vi).** 43 graded stories (A1-1 12, A1-2 16, A2-1 15) and 2 A1-0
micro-stories, 7,334 word tokens, 144 declared new words; 616 of the 786 A1 syllabus lexemes occur in a story.
`ko_stories_lib.py` ports the story engine for Korean (Intl.Segmenter cuts at spaces, so a token is an eojeol): each
authored word is analysed to the lexeme it is (a noun with its particles and the copula, a conjugated verb) and
written into the story's tokenMap, so the app's word sheet shows that lexeme. Every sentence passes the lesson word
check (particles, number systems) and ends in 해요체 or 합쇼체. `ko-check-stories.py` re-runs every check and the band
mix; `ko-vi-stories.test.ts` runs the real validator (validateStories) over the staged layer: 0 errors. No story
bundles audio (no clean recorded voice, D-11); `stories/story-audio.json` holds the `storyAudio: bundled false` block
for the reception manifest at promote. Written by six agents from one brief, then rebuilt and checked together.
Findings: the name 후에 (Huế) hid the time word 후에 (removed from the names); the brief listed 그리고 / 하지만 as
function words, but they are lexemes with a band (the A1-1 stories use 그래도 / 그러면 instead).

**Open for the reviewer (stories).** (1) A parent speaks 해요체 to a child (a11a_call_home, the micro-stories): 반말
is not taught as production, so the stories never end a sentence in it; a real mother would. (2) A compound number
(이천, 스물두) has no lexeme: the tokenMap points it at its head (천, 스물), which the word sheet then shows. (3) 개
(the counter) resolves to "dog" (one lexeme, coordinator 2026-11-05), so the stories avoid the counter; 말 (speech)
likewise is only "horse". (4) The D-10 pass should read the A2-1 workplace stories (shift change, forklift, visa
extension, remittance) for the facts they state.

**Open for the reviewer (assessment).** The register items accept only the register asked for, so a select item may
show 반말 (마셔.) as a wrong option; the dictations are scored by whole text with the no-space spelling as the only
alternative; pronunciation.batchim_sounds is not sampled by a checkpoint (non-essential; the listening item 딸 / 달 /
탈 / 땀 is tagged script.hangul).

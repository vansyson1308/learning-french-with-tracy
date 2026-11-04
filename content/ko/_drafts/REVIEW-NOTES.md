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

**For the D-10 reviewer (read first).**
- Section 1 is tap-only: no typed Korean before the primer. Typing starts in Section 2.
- 해요체 everywhere; 합쇼체 only in set phrases, the interview (unit l, ua-l3) and announcements; 반말 only in two
  recognition items of unit k (uk-l0, uk-l2), each option marked "(Nói thân mật …)", and as wrong options.
- Numbers: native for hours, ages and counted things, Sino-Korean for money, minutes, dates, floors, phone and bus
  numbers; typed keys accept digits and Hangul.
- The homographs 개 (dog / counter), 이 (this / two), 네 (yes / four), 일 (one / day / work) keep one lexeme each
  (coordinator, 2026-11-05); the card `ko:concept:homographs` teaches the other senses.
- The Vietnamese comparisons of the primer and the cards are approximations and say so.
- Sections 3–6 hold only lesson-internal exercises so far; their readings, device-voice clips, speech items, writing
  tasks and scenarios join in sessions 3–4.

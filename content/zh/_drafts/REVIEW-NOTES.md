# zh-vi — review notes (P4d sessions 2-5: lessons, concept cards, the layer exercises, assessment, stories)

Self-check of the answer keys, run by the session that wrote them. It is not the D-10 review: that is a later session
(AI pass, then the owner), and it reads these notes first.

## What the self-check is

`_generators/zh-check-answers.py` runs in `zh-pipeline.sh` after the six lesson generators and stops the pipeline on a
finding (a standing finding needs a reason in its `DECIDED` table, which is empty). The generators themselves
(`zh_lesson_lib.py` + `zh_text.py`) stop earlier on every reading problem. Output: `review/selfcheck.json`.

| Check | Where | Rule |
|---|---|---|
| Hanzi without pinyin | generators + self-check | every hanzi of every Chinese string shown (keys and distractors) lies inside a lexicon surface, by the longest-match cut of `script-reading.ts annotateText`; 中 and 地 only inside compounds |
| Homographs | generators + self-check | 只 only as the measure word zhī (after a number, 这/那/几/每), 得 never děi, 还 never huán, 长 never zhǎng outside 长大 — the lexicon stores one reading per surface |
| Latin letters | generators + self-check | no pinyin as target text; no Latin letter in a typed key (pinyin typed for a hanzi key is practice, P4b guard) |
| Chinese in Vietnamese | generators | no hanzi in a Vietnamese prompt, translation, option or tile |
| Proper nouns | generators + self-check | a city or family name is never a T/N/M word; names of people use characters the lexicon reads (阮海, 阮南, 小王, 王经理) |
| Two defensible answers | self-check | pairs offered together (了/过, 在/正在, 吗/吧, 很/非常/真, 这儿/这里, 那儿/那里, 哪儿/哪里, 一点儿/一点); 不 against 没 unless 有 follows or the Vietnamese says chưa / đã không / hôm qua; a measure word the noun also takes (`NOUN_MEASURES`; an undeclared noun is a finding); options sharing a gloss or a synonym group (`content/synonym-groups.json`); a sentence distractor that is another accepted spelling of the key; a word-bank tile that swaps into a correct sentence |
| Measure words in a key | self-check | number / 这 / 那 / 哪 / 几 / 每 straight before a noun; 二 before a measure word (outside 十二, 第二); 两 before no measure word |
| 了 and friends | self-check | 没 + verb … 了 in one clause (没电了 is right and passes); 了 with 每天/常常/经常; 不有; 吗 after a question word or A不A; 是 before a bare adjective; 很/非常/太 after 比 |
| Typed renderings | self-check | every typed answer lists the numbers before a measure word in digits and hanzi (3个 ⇄ 三个, 2张 ⇄ 两张, 15块 ⇄ 十五块), the time word before and after the subject, the natural pairs, and 我 when the Vietnamese states "Tôi" (or the key without 我 when it does not) |
| Section 1 typing | self-check | no typeAnswer, dictation, fill-in without options, guidedWriting or simpleForm in a Section 1 lesson |
| Duplicates, concepts | self-check | no repeated payload across the 108 lessons; every concept card is shown in some lesson flow |

The D-10 patterns of ja-vi (`content/ja/REVIEW-AI.md`) were written in from the start rather than found later: the
subject and time-word variants, digit and hanzi numerals, the natural alternatives (这儿/这里 …), and distractors that are
also correct (e.g. 我是阮海 beside 我叫阮海, 多少个 beside 几个, 你的电话号码是什么, 我在超市买东西 for "đi siêu thị mua đồ",
two spatially symmetric sentences such as 银行在超市旁边 / 超市在银行旁边) were left out of the options.

## Findings fixed this session (counts)

| Rule | Found | Fixed how |
|---|---|---|
| Hanzi without a reading | 7 items | 妈 alone → 妈妈 or 喝; 红色 → 漂亮的衣服 (色 is no lexeme); 码 in a word-order distractor; 往右走 → 往右边走; 烧 in a distractor |
| 只 read alone | 2 false positives | the rule exempts a string that is the lexeme itself |
| Same gloss in options | 2 | 住 beside 在 ("ở"), 好吃 beside 好喝 ("ngon"); distractor replaced |
| Two defensible answers | 3 | 吗 tile beside 吧 (给我发照片吧); 房子 and 家 both "nhà"; 不客气 beside 没关系 (synonym group, found by the validator; the self-check now reads the groups) |
| Measure words | 2 | 先生 declared (个/位); the typed variant 这箱子很轻 dropped |
| Self-check false positives | 3 | 吃三次药 (次 counts actions: verbal measure words skip the noun check), 没电了 (没 + noun + 了 is right), 几门外语 (门 is a measure word) |
| Generated variant | 1 | 便宜一点吧 grew 便宜1点吧: 一点 "a bit" is no longer turned into digits |
| Concept English | 2 | the English explanations named the Vietnamese tones in Vietnamese; reworded |

End state: 108 lessons, 811 exercises (select 400 — targetToNative 199, nativeToTarget 168, listen 33 — fillBlank 144,
wordBank 96, typeAnswer 92, match 79), 24 measure-word and 11 aspect fill-ins, 28 concept cards in 41 lesson flows
(43 steps), 0 findings, 0 decided. Two pipeline runs give identical files.

## Session 3 (2026-11-04): the layers and the Section 3-6 exercises

Rule 8 joins the self-check: comprehension items (options distinct, all Chinese or all Vietnamese, a Vietnamese
question, a Chinese key found in its reading or clip and no Chinese distractor heard there too), dictations (no digits,
the clip's own transcript, its numeral and natural spellings listed), spoken answers (target among its variants, hanzi
only, natural pairs listed), writing (each guided slot realized in the model, each form value a variant, hanzi only),
and the reading and grammar rules over every reading, clip, speech answer, writing model and scenario line (reserved
records included). `zh_lesson_lib.finish` also stops when a lesson's layer ids differ from `zh_lesson_refs.py`.

| Rule | Found | Fixed how |
|---|---|---|
| 吗 after a question word | 4 strings (有什么事吗？ ×2, 还要什么吗？, 你有什么问题吗？) — false positives | 什么 after 有 / 要 before a final 吗 is the indefinite "anything": the rule skips it |
| Number before a noun | 1 (五路公交车) — false positive | 路 after a number is a bus route: exempt like 楼 and 家 |
| Distractor heard | 1 (天 inside the clip 天气) | distractor replaced (雨) |
| Spoken variants (validator) | 22 items: digit spellings (25岁 beside 二十五岁) duplicate after the grader's fold | numbers are no longer widened for spoken answers (`zh_layers.spoken_variants`) |
| Model answer vs its rubric (validator) | 4 under Intl.Segmenter's words (我是, 我不, 先吃, 点到), then 2 under the app's tokens: q_reply and cp5_note_movie realized a slot twice | validators read zh with the app's dictionary tokenizer (zh-plan decision 19); the two models rewritten |
| Form rubric (schema) | 5 forms with minTokens 1 | 2, as ja |
| English fields | 3 primer `en` texts named the Vietnamese tones in Vietnamese | reworded ("the Vietnamese rising tone") |

End state: 976 exercises (+165: listeningComprehension 44, readingComprehension 47, dictation 7, speakProduction 28,
speakRepetition 9, guidedWriting 17, simpleForm 2, interactionScenario 11), 0 findings, 0 decided. Layers: 29 readings
(20 teaching), 222 clips (66 reception, 30 speech models, 126 partner turns), 52 speech items (22 reserved), 35 writing
tasks (16 reserved), 21 scenarios (10 reserved). Two pipeline runs give identical files (112 files).

## Session 4 (2026-11-04): checkpoints, placement and the HSK 1-2 tracks

Rule 9 joins the self-check: every checkpoint, placement and HSK item goes through rules 1-8 (`exercise_rules`), the
Section 1 checkpoint and the first placement stage are tap-only, and an HSK item's options are distinct, of one
language, and never the key in another spelling. An HSK item's Chinese key is a reply or a word the stimulus need not
contain, so the key-in-stimulus rule of rule 8 stays with the lessons and checkpoints. A 书写 component item
(`scriptAid: "hidden"`) is not reading-checked: it shows no pinyin and its options are components, not words.
`zh-exam.py` itself stops on any word above the track's HSK 3.0 level (`hsk-course.json`).

| Rule | Found | Fixed how |
|---|---|---|
| Word above the level (generator) | 19 strings: 苹果 and 工厂 are HSK 3.0 level 3; 每天 and 服务员 are not in the list and 每 / 员 are no level 1-2 characters; 近 is level 2 in an HSK 1 item | replaced by level words (面包, 鸡蛋, 银行, 常常, 您好 …) |
| Hanzi without a reading | 1 (常 alone) + 5 typed keys (朋, 气, 起, 妈, 医 are no lexemes alone, so the shown answer had no pinyin) | 很少去; the typed keys are single-character lexemes (吃, 冷, 给, 不, 飞) |
| Checkpoint description | 1 (是, 不, 有 … named in a Vietnamese description) | named in Vietnamese ("là", "có", "ở") |

End state: 7 checkpoints (12 / 24 / 27 / 14 / 12 / 6 items and a 20-item capstone in two forms of 10), a 4-stage
placement of 22 items, HSK 1 (80 items, two forms of 40) and HSK 2 (120 items, two forms of 60), 90 exam clips and 90
exam readings; 0 findings, 0 decided. Two pipeline runs give identical files (125 files).

For the D-10 reviewer, session 4: read the HSK pools first — each pool of six was written so that exactly one option
fits each item (R3 words: 去 and 在 never in one pool, 想 / 要 never beside 喜欢); the 书写 component pools were chosen so
that the shown part takes no other pool component to make a character with the target's reading (唱/倡, 机/叽, 妹/昧
avoided). The Vietnamese labels of the emoji pictures are short on purpose (a picture names a thing, not a sentence).

## Session 5 (2026-11-04): graded stories

The stories have their own self-check (`_generators/zh-check-stories.py`, run at the end of `zh-pipeline.sh` because
the stories are graded by the staged syllabus): 42 stories (A1-0 5, A1-1 13, A1-2 13, A2-1 11), 902 sentences, 126
questions, 0 findings, 0 decided; output `review/stories-selfcheck.json`. Every check also runs in the builder
(`zh_stories_lib.story`), which stops a batch on any finding.

| Check | Rule |
|---|---|
| Segmentation | sentences are authored word-spaced; the port of the `stories.ts` dictionary path (longest match, one step of lookahead) must cut exactly there and resolve each word to the lexeme meant |
| Coverage | word tokens 50–100 (A1-0) or 150–400; ≥ 95 % known at the band; 3–5 new lexemes, each in the text, none of an earlier band; nothing beyond the band undeclared; every token resolves |
| Readings | `zh_text.Index` as in the lessons (every hanzi inside a lexicon surface, 中 / 地 in compounds, 只 / 得 / 还 / 长 in the stored reading, no Latin), no half-width punctuation; titles too |
| Measure words | rule 2 of the lessons, plus the counted noun must take that measure word (`NOUN_MEASURES` + `STORY_MEASURES`; an undeclared counted noun is a finding); 把 never counts (the lexeme is the preposition) |
| 了 and aspect | rule 3 of the lessons (没 + verb … 了, 了 with a habit, 不有, 吗 after a question word, 是 + bare adjective, 很 after 比) + 正在 … 了; 了 from A1-1, 过 from A1-2, 着 from A2-1 |
| Kinship | a third-person narrator says whose family it is (他妈妈, 阮海的妻子), never a bare or 我 kin word, and its Vietnamese never says "mẹ tôi"; first-person stories (5) speak of 我妈妈 / 妈妈 |
| Questions | three per story, exactly one inference, 3–4 distinct Vietnamese options, a "?"; answer positions spread (the builder moves the right option by the story id) |

Found and fixed while writing (counts): 8 sentences the engine would cut otherwise (最好吃 → 最好|吃, 很好的 and 不好的 →
好的 ×2, 你好好学习 → 你好, 多少 钱 → 多少钱, 不 对 → 不对 ×3); 9 stories under 150 tokens or over 5 % new words
(lengthened, or a declared word replaced by a known one); 3 words of a later band left undeclared (晚上 and 雨 in A1-1,
车间 in A1-2); 1 declared new word of an earlier band (声音); 12 counted nouns declared in `STORY_MEASURES`; 3 counts
with 把 (一把椅子 ×2, 两把钥匙: the lexeme is the preposition, so the word check would show its gloss); 1 character
without a lexeme (唱 → 唱歌); 3 hanzi in Vietnamese translations; 1 false positive of the lessons' measure-word rule
fixed in the story port (那 + 下次 is "then", not a missing measure word), and one of `zh_text` avoided by rewording
(组长了 matches the 长了 = zhǎng pattern). The builder splits a hanzi numeral written as one word (二十, 五月) into the
engine's one-character words.

For the D-10 reviewer, session 5: read the inference questions first (`stories/OUTPUT.jsonl`, kind `infer`) — each was
written so that the text implies one option and states none; then the A1-1 stories, which say a lot with a few
adjectives (贵 and 便宜 are the only A1-1 adjectives, so 好 / 大 / 多 / 高兴 come in as declared new words); then the
Mid-Autumn story, which says 八月十五 and 月亮 because 中秋节 and 月饼 are not lexemes. Vocatives in the Vietnamese follow
the speakers' ages and roles (cháu / ông for an old neighbour, em / anh for a team leader and a young worker).

## For the D-10 reviewer

- Read the typed keys first (every `typeAnswer` with its alternatives in `lessons/OUTPUT.jsonl`): the
  rule tables cover numerals, word order of time and subject and the natural pairs, not every synonym (e.g. 晚到 vs
  迟到 are both listed only where written by hand).
- Sentence distractors were written to be wrong; the self-check proves only the mechanical cases. Look for a distractor
  a native would accept in context.
- Hán-Việt appears only where the table has the word; the four words that waited (工厂, 仓库, 经验, 辞职) now carry it.
- Session 3: read the spoken and scenario answers (`speech/OUTPUT.jsonl`, `scenarios/OUTPUT.jsonl`): the variant lists
  are hand-written menus (greetings, 是/对/好的 replies, 我叫/我是 for a name) and will miss some natural replies. Check
  the partner register (a clerk says 您, a colleague 你), the comprehension distractors (written to be wrong, Vietnamese
  numbers in digits), and the Taiwan-factory and 便当 scenarios, which are in simplified characters and Mainland words
  except 便当 and 打卡.

# zh-vi — review notes (P4d session 2: lessons and concept cards)

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

## For the D-10 reviewer

- Read the typed keys first (every `typeAnswer` with its alternatives in `lessons/OUTPUT.jsonl`): the
  rule tables cover numerals, word order of time and subject and the natural pairs, not every synonym (e.g. 晚到 vs
  迟到 are both listed only where written by hand).
- Sentence distractors were written to be wrong; the self-check proves only the mechanical cases. Look for a distractor
  a native would accept in context.
- Hán-Việt appears only where the table has the word; the four words that waited (工厂, 仓库, 经验, 辞职) now carry it.

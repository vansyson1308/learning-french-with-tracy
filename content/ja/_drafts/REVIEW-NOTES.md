# ja-vi — review notes (P4c session 2: lessons and concept cards)

Self-check of the answer keys, run by the session that wrote them. It is not the D-10 review: that is a later session
(AI pass, then the owner), and it reads these notes first.

## What the self-check is

`_generators/ja-check-answers.py` runs in `ja-pipeline.sh` after the six lesson generators and stops the pipeline on a
finding (a standing finding needs a reason in its `DECIDED` table, which is empty). The generators themselves
(`ja_lesson_lib.py` + `ja_text.py`) stop earlier on every reading problem. Output: `review/selfcheck.json`.

| Check | Where | Rule |
|---|---|---|
| Kanji without furigana | generators | every kanji is inside a lexicon surface or an inflection key (`ja_text.Index`, the same keys as `src/lib/languages/ja-inflection.ts`) |
| Misread single kanji | generators | a one-kanji word beside another kanji or a digit (三人 → さん+ひと, 2025年 → とし); 何 before です/で/の/と (read なん, stored なに) |
| Romaji | generators | no Latin letter in a Japanese string |
| Register | generators + self-check | a keyed sentence ends in です/ます style; plain forms only in exercises marked plain (one: uk-l1, "which sentence is plain speech") |
| Japanese in Vietnamese | generators | no kana/kanji in a Vietnamese prompt, translation or option |
| Two defensible answers | self-check | particle pairs offered together (は/が, に/へ with a verb of motion, と/や, ね/よ without "nhỉ"/"đấy", は/も against "cũng", を key with は); options sharing a Vietnamese gloss; a distractor equal to the key without わたしは or in plain form; a word-bank tile that swaps に/へ, と/や, ね/よ |
| Wrong particles in a key | self-check | を/で before あります/います; を before 好き/嫌い/上手/下手/欲しい/わかります; を乗ります; に after 今日/明日/毎日…; を行きます/来ます/帰ります |
| Duplicates | both | no repeated payload across the 108 lessons |

## Findings fixed this session (counts)

| Rule | Found | Fixed how |
|---|---|---|
| Kanji without furigana / misread kanji | 34 messages in 17 items (concepts 6, s1 1, s2 1, s6 2, s3–s6 forks 7) | numbers in digits (7時, 2枚, 1万円), non-lexicon words in kana (かさ, おおさか, なんめいさま, あたためて, もえるごみ), Japanese names in hiragana (やまださん), 何 → なん |
| 降ります (ふります or おります) | 2 items | the key is dropped by design; text uses 降りて / 降って or rewords |
| Duplicate payloads or near-duplicate prompts | 7 | reworded (uj-l1, uh-l0, uh-l2, us-l0 ×2, ut-l2, uq-l2 ×2) |
| Two defensible answers | 13 | distractor replaced: ここのたばこ, カードを, 一緒に見ました(か), 遅れる beside 遅刻する, が in 週末は友達___, 明日___大丈夫 (が), に tile beside うちへ, で tile in 角を右に曲がって; word-order alternatives added to 3 word banks (ナムさん、おはようございます, 月曜日に会社へ, 一日2回コーヒーを); digit forms added to 1 typed answer |
| Register | 0 real (1 false positive: the kana spelling がっこう) | marked as a word, not a sentence |
| Wrong particles | 0 real (2 false positives on 住んでいます-type て forms) | rule excludes ん/い before で |
| Self-check false positives | 9 | rules narrowed: particle glosses compared without their brackets; は/が, は/も not read on tiles |

End state: 108 lessons, 835 exercises, 0 findings, 0 decided.

## Open for the D-10 reviewer

1. **Typed answers are narrow by nature.** Alternatives cover わたしは dropped, 私 for わたし, に/へ with motion,
   ください/お願いします, digit/kanji numerals where listed. Other correct orders (time word moved, は vs が in a
   subordinate spot) are not generated: read every `typeAnswer` (110) with that in mind.
2. **Kana as production** is listed only in Section 1 (23 typed answers carry the kana spelling) and unit o
   (`kana=True`). Everywhere else kana typed for a kanji key aligns through the readings and counts as practice
   (P4b evidence guard; session 2 extends the readings to inflected forms, see below).
3. **Furigana come from the lexicon at run time**, not from the exercise text. Inflected verbs and い-adjectives read
   through the new inflection keys (`src/lib/languages/ja-inflection.ts`). A form two verbs share (降ります) gets none;
   any other kanji in a lesson is a lexicon surface. Numbers are written in digits where a kanji numeral + counter
   would get a wrong reading (三百, 四時, 三人).
4. **No conjugationCloze.** A ja paradigm table needs morphology rows for all nine cells; the committed derivation
   tags only the dictionary form and the ます form (scripts/lib/languages/ja.ts). ます forms are drilled as fill-ins
   (ub-l0…ub-l3) and the te form through the cards and fill-ins until the derivation tags the other cells.
5. **Sections 3–6 wait for their layers.** Listening/reading comprehension, dictation, speech, writing and scenario
   exercises are added to these lessons when reception, speech, writing and scenarios exist (sessions 3–4); today
   those lessons use listen-selects (49), reading selects of signs and messages, word banks and typed answers.
6. **Names**: Vietnamese names in katakana (ナム, ラン, グエン), Japanese names and cities in hiragana (たなかさん,
   やまださん, おおさか, なごや) because their kanji are not lexemes. Latin spellings of Japanese names appear only in
   Vietnamese text ("anh Tanaka", "ga Osaka"), never in a Japanese string.
7. **Hán-Việt** appears in the card "Kanji và âm Hán-Việt" and in ue-l1 only; the false friends 工場 and 勉強 are
   taught there.

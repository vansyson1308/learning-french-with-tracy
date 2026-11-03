# ja-vi — review notes (P4c sessions 2–4: lessons, concept cards, reception, speech, writing, scenarios)

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

Session 3 (2026-11-03): 857 exercises (+22 conjugationCloze), still 0 findings, 0 decided. One rule widened in
`ja_text.READS_APART`: 阪駅 (大阪駅 reads おおさか + えき).

Session 4 (2026-11-03): the layers and their exercises. 1,020 exercises (+163: listeningComprehension 44,
readingComprehension 42, dictation 5, speakProduction 33, speakRepetition 9, guidedWriting 17, simpleForm 2,
interactionScenario 11), still 0 findings, 0 decided. Every exercise type of the blueprint is used except articleSelect
(no Japanese counterpart, §2 of ja-plan.md). The self-check now also reads (rule 5 of its docstring): dictation keys and
their one alternative (the kana spelling, no digits), every spoken answer a speech exercise accepts (register, particles,
no Latin letter: no Hán-Việt, no romaji), writing model answers (every guided slot realized, every form value a variant),
Japanese comprehension keys (present in the text) and every learner answer of the 21 scenarios. The layer generators
check every displayed Japanese string with the same reading rules (`ja_layers.py`). Fixed while writing, before the
first full run: 6 reading problems (5分前 → 少し早く; 変わりましたか and 一週間, not lexemes, reworded), 5 writing rubrics
whose time slot the validator's tokenizer splits (7時に → 七 / 時に: the bare number is listed too), 1 sentence-verb rule
on a negative sentence, 1 sign question with two defensible keys (出口 beside 非常口: the question now asks for 入口), and concept forms
that are a stem of a set phrase (お願い inside お願いします, 大丈夫 inside 大丈夫です: the phrase is listed too).

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
4. **conjugationCloze (session 3): 22 items** — ub-l0…ub-l3 15 (polite non-past / past, affirmative / negative),
   te form in ug-l1 3, uq-l3 2, uv-l1 2 — on 25 paradigm tables (`_generators/ja_paradigms.py`, emitted with the
   cards). Every cell is a row of the kaikki morphology (re-derived this session: the nine cells are tagged); the
   group rules check the same tables. Read with that in mind:
   - 7 tables use a cell the Wiktionary page states nowhere, composed from a stated row of the same page and marked
     `composed` in morphology.json: 来る, 寝る, 勉強する, 読む, 入る, 見せる, 持つ (the polite negative / past cells).
   - The key's kana spelling is accepted (alternatives): the drill is the ending, and a cloze is practice by design.
   - 飲む, 休む, 出す, 取る, 続ける have no conjugation table in the retrieval, so no cloze drills them.
5. **Sections 3–6 and their layers (session 4).** Read with the layers' generators open:
   - Signs: the course has no lexeme 立入禁止, 安全第一 or 禁煙, so the factory signs read 入口, 出口, 非常口, 危険, 注意 and
     the rules are sentences (たばこは禁止です). Adding those words needs `ja-subset.py` with the pinned JmdictFurigana file.
   - Dictation (5): the key is the clip in the standard script, its one alternative the same text in kana (strict
     grading: a mix of the two fails); no clip with a number is dictated (7時 / しちじ / 七時).
   - Speech: variants list わたしは / 私は and the bare sentence; the recogniser's kana is matched through the readings
     for stored words, but **not** for inflected verbs (働いています written in kana by the recogniser reads per
     character: the spoken tokenizer keeps the stored words, P4b). Recognisers usually write kanji; to check on a device.
   - Writing: model answers in the target script; a kana answer aligns as practice. A time slot lists the bare number
     because the validator's tokenizer splits 7時に as 七 / 時に (the app's lexicon tokenizer does not).
   - Scenarios: a required concept is a run of tokens of the course tokenizer, so a set phrase is listed beside its stem.
6. **Names** (session 3): Japanese names and places are lexemes now (row kind R in core-7.txt): 田中, 木村, 東京,
   大阪, 京都, 名古屋, 北海道, 富士山 — kanji with furigana from JmdictFurigana, Vietnamese gloss, no Hán-Việt, never a
   kanji target. 山田 has no JmdictFurigana chain (やまだ: rendaku), so its two uses became 木村. The lessons write
   them in kanji (田中さん, 大阪, 名古屋); Vietnamese names stay in katakana (ナム, ラン, グエン). Latin spellings of
   Japanese names appear only in Vietnamese text ("anh Tanaka", "ga Osaka"), never in a Japanese string. Decided in
   session 4 (coordinator): they carry `proper: true` and TODAY never offers one as a daily new word; the lessons keep
   them.
7. **Hán-Việt** appears in the card "Kanji và âm Hán-Việt" and in ue-l1 only; the false friends 工場 and 勉強 are
   taught there.
8. **Free writing in kana** (decided in session 3, P4b open item): a guided-writing answer typed entirely in kana is
   aligned to its slots through the stored readings and accepted as practice, never production evidence — the same
   rule as typed answers and simple forms.
9. **Romaji** (session 3): the ja-vi profile sets `romajiUntilPrimer`; a Hepburn line under Japanese text shows until
   the learner passes the primer checkpoint (16/20). Read the kana primer (`content/ja/primer/REVIEW.md`) and its 20
   checkpoint items in `_generators/ja-primer.py`.

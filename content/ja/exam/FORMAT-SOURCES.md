# JLPT N5: official format sources

The `ja-vi` practice track `jlpt-n5.json` (staged under `content/ja/_drafts/staged/content/ja/exam/` until promote;
generator `content/ja/_drafts/_generators/ja-exam.py`) follows what the official JLPT pages state. Every item is
original: no official sample question, text, script or picture was copied or paraphrased. The track is
`formatFidelity: "partial"` (D-12) because the official pages fix the question types but not the number of items per
type, and the app adapts the listening paper. The JLPT is run by the Japan Foundation and Japan Educational Exchanges
and Services. **JLPT N5 is not a CEFR level**, and the app never says it is.

## Read (2026-11-03)

| Document | URL | Read | What was taken |
|---|---|---|---|
| 試験科目と試験時間 / 問題の構成 (Japanese) | https://www.jlpt.jp/guideline/testsections.html | yes, through a fetch tool (page text, summarized by a small model; figures asked for and returned verbatim) | the three N5 test sections and their times; the 大問 marked ○ for N5 |
| Test Sections and Test Times (English) | https://www.jlpt.jp/sp/e/guideline/testsections.html | yes, same tool | the same, in English; the note that N4/N5 times changed from the second 2020 session (December); "time allotted for each section may change" |
| N5 大問のねらい (PDF, 1 page) | https://www.jlpt.jp/guideline/pdf/n5_revised.pdf | **yes, the page itself** (rendered table) | the 13 大問 with their aims and text lengths |
| 得点区分・合格点と基準点 | https://www.jlpt.jp/guideline/results.html | yes, fetch tool | scoring sections, ranges, pass mark and sectional minimums for N5 |
| よくある質問 (FAQ) | https://www.jlpt.jp/faq/index.html | yes, fetch tool | options per item; scores are scaled (項目応答理論, 尺度得点); question numbers reduced in some sections in 2020 |
| Sample questions index | https://www.jlpt.jp/samples/forlearners.html, https://www.jlpt.jp/samples/sample09.html | yes, fetch tool | that the samples differ from the real booklet, and that the 2009 sample counts are not the real counts |
| N5 解答用紙 of the 2009 sample set (PDF, 3 pages) | https://www.jlpt.jp/samples/pdf/N5-kaitou.pdf | **yes, the pages themselves** | answer sheet layout only: ①–④ for 文字・語彙, 文法・読解 and 聴解 もんだい1–2; ①–③ for 聴解 もんだい3–4 |
| N5 sample booklet, script, audio | https://www.jlpt.jp/samples/pdf/N5-mondai.pdf, …/N5-script.pdf, …/mp3/N5Sample.mp3 | **no**: not needed for the format, and not opened so that nothing could be copied | — |
| N5 sample page | https://www.jlpt.jp/samples/n5/index.html | no: the page builds its content with a script the fetch tool cannot run | — |

## What the official pages state

**Test sections and times (N5, since December 2020):** 言語知識（文字・語彙） 20 min; 言語知識（文法）・読解 40 min;
聴解 30 min ("may vary slightly depending on the length of the recorded materials").

**大問 (N5 大問のねらい):**

| Section | 大問 | Aim (paraphrased) |
|---|---|---|
| 文字・語彙 | 1 漢字読み | the reading of a word written in kanji |
| | 2 表記 | how a word written in hiragana is written in kanji or katakana |
| | 3 文脈規定 | the word the context defines |
| | 4 言い換え類義 | a word or expression close in meaning |
| 文法 | 1 文の文法1（文法形式の判断） | the grammatical form that fits the sentence |
| | 2 文の文法2（文の組み立て） | building a sentence that is correct and makes sense |
| | 3 文章の文法 | sentences that fit the flow of a text |
| 読解 | 4 内容理解（短文） | an easy text of about 80 characters on study, life or work |
| | 5 内容理解（中文） | an easy text of about 250 characters on everyday topics |
| | 6 情報検索 | finding information in a notice or announcement of about 250 characters |
| 聴解 | 1 課題理解 | hear a coherent text and understand what to do next |
| | 2 ポイント理解 | hear a coherent text and catch the point asked beforehand |
| | 3 発話表現 | look at an illustration, hear the situation, choose the right utterance |
| | 4 即時応答 | hear a short utterance (a question) and choose the right reply |

Not at N5: 語形成, 用法, 内容理解（長文）, 統合理解, 主張理解（長文）, 概要理解.

**Options:** "選択枝の数はほとんど4つですが、「聴解」では3つの問題もあります" (FAQ). The sample answer sheet shows four
options for 聴解 もんだい1–2 and three for もんだい3–4.

**Scoring (N5):** two scoring sections — 言語知識（文字・語彙・文法）・読解 0–120, sectional minimum (基準点) 38;
聴解 0–60, minimum 19; total 0–180, pass mark 80. A candidate passes only with the total at or above 80 AND every
section at or above its minimum; missing any test section means failing. Scores are scaled scores (尺度得点) based on
item response theory, not a sum of item points (FAQ).

## What the official pages do not state, and what the course chose

| Not stated | The course's choice | Shown to the learner |
|---|---|---|
| Items per 大問 (the 2009 sample counts are pre-revision; the FAQ says some sections were shortened in 2020 and points to a page that gives no counts) | 7 / 5 / 6 / 3; 9 / 4 / 4 / 2 / 2 / 1; 7 / 6 / 5 / 6 — 67 items per form, sized to the official times. **Owner:** compare with the current 公式問題集 before release. | track description |
| The split of the 120 points between the two test sections | 60 + 60, every item of a section the same weight | formatSource note |
| Scaled scoring | the share of correct answers × the section's points; readiness bands from the weakest rule (both minimums and the total) | description, note, disclaimer |
| How often a recording plays | once (the section plays each recording once; the clips keep the product cap of 2 for practice outside the exam) | task instructions |

## App consequences (adaptations, stated in the track)

- **Listening:** the question is shown in Vietnamese, and the options are printed (Vietnamese for もんだい1–2,
  Japanese utterances for 3–4). On the real paper the question is spoken in Japanese, もんだい1–2 print options or
  pictures in Japanese, もんだい3 shows an illustration, and もんだい3–4 options are only heard.
- **Kanji reading and spelling (漢字読み, 表記):** the app hides furigana, the romaji line and Hán-Việt on these items
  (`scriptAid: "hidden"`); the rest of the sentence is in kana, as on the paper. Elsewhere the learner's reading-aid
  switch applies; the real paper shows no furigana on N5 kanji.
- **Questions of the reading part** are in Vietnamese with Vietnamese options (the paper is all Japanese); the texts are
  Japanese in the lengths the official table gives (about 80 and about 250 characters; the generator checks a band).
- **Vocabulary** is the course lexicon (A1 and A2-1, which hold 629 of the 662 OpenJLPT N5 entries); words outside it
  are written in kana.
- **Readiness** is an estimate from course practice, never a prediction of passing ("mức sẵn sàng ước tính").

## Who checked

`checkedAgainstOfficialGuide: true`, `checkedBy: "coding agent (owner-delegated)"`, `checkedAt: 2026-11-03`: the times,
question types, option counts, scoring sections and pass marks above were read on the official pages on that date (the
two PDFs directly, the HTML pages through a fetch tool). The item counts were not, and the track says so. **Owner
checklist:** re-read the two pages and the PDF before release, and compare the item counts with the current official
practice workbook (`plan/OWNER-FINAL-CHECKLIST.md`).

# HSK 1 and HSK 2 (HSK 3.0): official format sources

The `zh-vi` practice tracks `hsk-1.json` and `hsk-2.json` (staged under `content/zh/_drafts/staged/content/zh/exam/`
until promote; generator `content/zh/_drafts/_generators/zh-exam.py`) follow what the official HSK documents state.
Every item is original: no official sample question, sentence, picture, script or recording was copied or paraphrased.
Both tracks are `formatFidelity: "partial"` (D-12): the official sample papers fix the parts, item counts, times and task
types, but the documents read do not publish the HSK 3.0 score scale, pass mark or play count, and the app adapts the
pictures, the listening questions and the handwriting part. The HSK is published by the Center for Language Education
and Cooperation (中外语言交流合作中心, CLEC) and administered by Chinese Testing International (汉考国际, CTI).
**HSK levels are not CEFR levels**, and the app never says they are.

## Which HSK is administered now

- The CTI announcement of 2026-09-08 says HSK 3.0 is "officially launched worldwide on December 13, 2026"; paper
  registration closes 16 November, computer-based 3 December.
- The 2026 test calendar (published 2025-12-24) lists the HSK 1–6 sessions; the session before 13 December is
  7 November 2026.
- The HSK pages of chinesetest.cn (`/HSK/1`, `/HSK/2`) still describe the current HSK (2.0): level 1 is 20 + 20 items
  (listening about 15 minutes, reading 17), level 2 is 35 + 25 (about 25 and 22 minutes); 100 points a section, a total
  of 200, pass at 120, no section minimum.

A learner who starts this course now sits HSK 3.0 at the earliest session they can reach, so the tracks follow HSK 3.0.
Level 2 of HSK 3.0 has a third part, 书写, which the current HSK 2 does not.

## Read (2026-11-04)

| Document | URL | Read | What was taken |
|---|---|---|---|
| HSK 3.0 launch announcement | https://www.chinesetest.cn/news/51336883 | yes, in a browser (the page renders by script) | the first HSK 3.0 date, 13 December 2026 |
| Chinese Test Dates in 2026 | https://www.chinesetest.cn/news/50278989 | yes, in a browser | the last session before it, 7 November 2026 |
| HSK Level 1 / Level 2 pages | https://www.chinesetest.cn/HSK/1, https://www.chinesetest.cn/HSK/2 | yes, in a browser | the current HSK's structure and score report (100 per section, 120/200 to pass) |
| 新版HSK考试大纲 (PDF, 406 pages, 4,943,759 bytes, sha256 d8b66465…) | https://hsk.cn-bj.ufileos.com/3.0/%E6%96%B0%E7%89%88HSK%E8%80%83%E8%AF%95%E5%A4%A7%E7%BA%B21219.pdf (linked as "Examination Syllabus" on chinesetest.cn) | yes, the text extracted from the PDF (contents, the level 1–2 task lists) | "2025-11 发布, 2026-07 实施"; the syllabus has five parts (tasks, topics, words, characters, grammar) and holds **no** test structure or scoring |
| HSK3.0考试能力描述 (PDF, 1 page, sha256 2f9ecd7d…) | https://hsk.cn-bj.ufileos.com/3.0/HSK3.0%E8%80%83%E8%AF%95%E8%83%BD%E5%8A%9B%E6%8F%8F%E8%BF%B0.pdf | yes | one-line can-do per level (not used in the app) |
| HSK 3.0 sample package (zip, 395 MB, Last-Modified 2026-09-09) | https://hsk-sample-1409982902.cos.ap-beijing.myqcloud.com/HSK3.0.zip (linked as "Sample Questions") | the central directory read by range request; only `HSK（一级）样卷.pdf`, `HSK（二级）样卷.pdf` and their two answer keys extracted (no audio) | **the cover note (parts, item counts, times) and each part's layout** (number of options, shared pools, the ★ question, the 书写 tasks); the questions themselves were not used |
| Sample audio, levels 3–9, speaking papers | same zip | **no**: not needed for levels 1–2, and not opened so that nothing could be copied | — |
| HSK 3.0 online demo | https://hsk3demo.chinesetest.cn | no | — |

## What the official documents state

**HSK 1 (样卷 cover):** two parts, 40 items — 听力 20 items, about 12 minutes; 阅读 20 items, 20 minutes; 3 minutes after
the listening to fill in the answer sheet; about 40 minutes in all, including 5 minutes for personal details.

| Part | Items | Layout read from the sample |
|---|---|---|
| 听力 第一部分 | 1–5 | hear a short sentence, choose one of three pictures (A–C) |
| 听力 第二部分 | 6–10 | hear a question, choose one of three printed replies |
| 听力 第三部分 | 11–15 | hear a short dialogue, choose from a shared pool of six pictures (A–F); one keys the example |
| 听力 第四部分 | 16–20 | hear a sentence and a question, choose one of three printed options |
| 阅读 第一部分 | 21–25 | match each sentence to a shared pool of six pictures (one keys the example) |
| 阅读 第二部分 | 26–30 | match each question to a shared pool of six replies (one keys the example) |
| 阅读 第三部分 | 31–35 | fill the gap （ ） from a shared pool of six words (one keys the example) |
| 阅读 第四部分 | 36–40 | read a sentence and a ★ question, choose one of three options |

**HSK 2 (样卷 cover):** three parts, 60 items — 听力 25 items, about 17 minutes; 阅读 25 items, 25 minutes; 书写 10
items, 10 minutes; 3 minutes for the answer sheet; about 60 minutes in all, including 5 minutes for personal details.

| Part | Items | Layout read from the sample |
|---|---|---|
| 听力 第一部分 | 1–5 | hear a sentence, choose one of three pictures |
| 听力 第二部分 | 6–15 | match dialogues to pictures in two groups: 6–10 with six pictures (one keys the example), 11–15 with five pictures for five items |
| 听力 第三部分 | 16–25 | hear a dialogue and a question, choose one of three printed options |
| 阅读 第一部分 | 26–30 | match each sentence to a shared pool of six pictures |
| 阅读 第二部分 | 31–35 | fill the gap from a shared pool of six words |
| 阅读 第三部分 | 36–45 | match each sentence to its reply in two groups: 36–40 with six replies, 41–45 with five for five |
| 阅读 第四部分 | 46–50 | read a short text and a ★ question, choose one of three options |
| 书写 第一部分 | 51–55 | a word with pinyin in which one character lacks a component; choose the component from a pool of six (one keys the example) |
| 书写 第二部分 | 56–60 | write the character for the pinyin printed in the gap |

Both papers print pinyin above every character, options included. The level-2 answer key numbers 书写 as 54–63 while
the booklet numbers it 51–60 (an inconsistency of the published key; only the layout was used).

## What the official documents do not state, and what the course chose

| Not stated (for HSK 3.0) | The course's choice | Shown to the learner |
|---|---|---|
| Score scale and pass mark | 100 points a part (every item of a part the same weight); a **reference threshold** of 60 % of the total: 120/200 (HSK 1), 180/300 (HSK 2) — the current HSK's published rule, with no part minimum | track description, pass-rule title ("ngưỡng tham khảo của khoá học … HSK 3.0 chưa công bố điểm đạt"), disclaimer |
| How often a recording plays | twice (the clips' product cap) | description |
| Questions of 听力 第三/四部分 (HSK 1), 第三部分 (HSK 2) | heard in Chinese on the paper; shown in Vietnamese here, not spoken | task instructions |

## App consequences (adaptations, stated in the tracks)

- **Pictures** are emoji with a short Vietnamese label (the engine's `pictureMcq` / pool options), not drawings.
- **Listening questions** are shown in Vietnamese; the options are printed in Chinese as on the paper (replies,
  words), and pictures as above.
- **Pools of five for five** (HSK 2 听力 11–15, 阅读 41–45): the engine's shared pool needs a spare option, so each of
  these groups has six options; the instruction says so.
- **书写 第一部分:** the app cannot draw a character without a component, so the target character is replaced by ？ and
  its right-hand part is named in the prompt ("…gồm 先 ở bên phải…"); readings are hidden (`scriptAid: "hidden"`). Each
  pool was checked by hand so that the shown part takes no other component of the pool to make a common character
  with the target's reading (e.g. 唱/倡 and 机/叽 were avoided).
- **书写 第二部分:** the character is typed with the pinyin keyboard (a `typeAnswer` on the `formCompletion` format)
  instead of handwritten; the key is one character of the HSK 3.0 handwriting list (levels 1–2).
- **Vocabulary:** every word of an HSK 1 item is an HSK 3.0 level-1 word, and of an HSK 2 item a level 1–2 word
  (`hsk-course.json` from ivankra/hsk30); a compound the list does not hold passes only when each of its characters is
  a character of the level; names and 越南 pass. `zh-exam.py` stops on any other word.
- **Readiness** is an estimate from course practice, never a prediction of passing ("mức sẵn sàng ước tính"); the
  section 书写 is `structures` in the engine (character knowledge, not free writing).

## Who checked

`checkedAgainstOfficialGuide: true`, `checkedBy: "coding agent (owner-delegated)"`, `checkedAt: 2026-11-04`: the first
HSK 3.0 date, the parts, item counts, times and task layouts above were read in the official sample papers and pages
on that date (the PDFs directly, the chinesetest.cn pages in a browser). The score scale, pass mark and play count
were not found, and the tracks say so. **Owner checklist:** before release, re-read chinesetest.cn for an HSK 3.0
score report and pass mark (and update `passRule`, the description and the disclaimer if one is published), confirm
the play count from the official listening scripts or the demo, and re-check the sample package for a newer version
(`plan/OWNER-FINAL-CHECKLIST.md`).

# P4d: zh-vi (Mandarin for Vietnamese speakers) and the HSK 1–2 track

Branch `phase-4/zh-vi`. Built in five authoring sessions with deterministic generators under `content/zh/_drafts/_generators/`. `zh-pipeline.sh` gives byte-identical output on a second run. The working plan is `plan/authoring/zh-plan.md`. QC-2026-11-05 §1 sets the order of the finishing steps.

## Content
- **Lexicon:** 916 lexemes (A1 725, A2-1 191).
  - Each has a Vietnamese gloss, CC-CEDICT pinyin and an example sentence.
  - New words from the review were added through the Mandarin ETL, with readings from the pinned CC-CEDICT slice and Vietnamese written by hand.
- **Hán-Việt:** 199 entries, false friends flagged.
- **Course:** 108 lessons and 976 exercises, 28 concept cards, plus a tone and pinyin primer with its checkpoint.
- **Reception and production:**
  - 29 readings and 312 clips (222 teaching, 90 HSK);
  - 52 speech items, 35 writing tasks;
  - 21 scenarios about work and life in China;
  - 42 graded stories (902 sentences, 126 questions).
- **Assessment:**
  - 7 checkpoints (115 items, including the A1 capstone);
  - a 4-stage placement test (22 items);
  - HSK 1 and HSK 2: 2 disjoint forms each, 200 original items in total.
  - Readiness is worded as an estimate, never a certificate.

## Engine work this milestone needed (all languages keep their results unless they declare the data)
- **Negation-aware grading for every course** (`src/lib/languages/negation.ts`, rules as plugin data):
  - zh 不/没; ja ない/ません; ko 안/못/지 않다;
  - fr ne…pas; de nicht/kein; es/it/pt no/non/não; en not/n't.
  - Speech, scenario and writing graders no longer accept 不是 for 是 or 不能 for 能. Tests sit beside the engine.
- **Dictation accepts traditional characters** (the screen shows simplified), tested over ≥ 30 pairs.
- **`LanguageRules.slotRuns`** (`src/lib/languages/runs.ts`) and **`joinTokens`**:
  - meaning-neutral insertions inside writing slots (了/过/一下/measure words, a surname before a title);
  - token joins across tokenizer boundaries (138 1234 5678).
- **`LanguageRules.utteranceFrame`** in the speech and scenario graders: forms of address and sentence particles around an accepted answer.
- **D-15 priority tie-break** (`content/onboarding-priority.json`, `deriveDefaultCourses`):
  - the Vietnamese UI default stays en-vi, the English UI default stays fr-en;
  - zh-vi does not win on alphabetical order.
- **Progress re-key:** zh added to `V8_REKEYED_TARGETS`, with a re-key test for zh-en progress.

## Audio
- **Front-end without jieba/pypinyin** (`plan/reports/P4d-zh-audio-frontend.md`):
  - Kokoro is fed phonemes built from the course's stored CC-CEDICT pinyin.
  - Tone sandhi applies to audio only: 不, 一 and third-tone runs (by word structure).
  - Re-render gate `phonemeFrontends.zh` (version + inputsSha256).
  - The voices are Kokoro zf_xiaobei (A) and zm_yunjian (B).
- **Canary** [41909390222](https://github.com/vansyson1308/learning-french-with-tracy/actions/runs/41909390222): sentence CER xiaobei 0.0135, yunjian 0.0187. The canary was rewritten with course words only, because the first one failed closed on 6 words outside the lexicon.
- **Generate run** [41928304254](https://github.com/vansyson1308/learning-french-with-tracy/actions/runs/41928304254), bot commit 7e6eed46:
  - 2,326 clips (1,969 assets), 0 technical failures.
  - Reception mean CER: mixed 0.0197, yunjian 0.0198, xiaobei 0.0446.
  - The pack's single words come to 0.40, the usual ASR noise on one-word clips (informational only by policy).
  - `ownerListening` is empty, and nothing needed re-synthesis.
- **Size:** zh is 9.5 MB as Opus 16 kbps (cap 12 MB). All languages together come to 60.8 MB of 88 MB.
- **Earlier run, and what it fixed:** 41919221002 failed technical QA on 15 short words with about 1.2 s of trailing silence (一般, 明白, 越南…). zh joined `TRIM_EDGES` (8e312500), and the rerun re-synthesised only those clips (`reuse_run`).
- **ASR flags on sentence clips:** 10 reception clips, all short.
  - 3 are single characters: 水, 猫, 鱼.
  - The rest are mostly homophone transcriptions: 我在喝茶 heard as 我在核查, 两斤十块 as 亮金石块, 你发烧吗 as 逆发少码, and 530 heard as 五百三十.
  - None crosses the owner-listening bar. An optional listen is on the checklist.

## Review (D-10)
`content/zh/REVIEW-AI.md` has the full record.
- **Answer pass 1:** 56 findings (18 P0, 33 P1, 5 P2).
- **Language pass:** 105 findings (0 P0, 25 P1, 80 P2), written incrementally per unit.
- **Answer pass 2, full** (QC-2026-11-05 §1.3, because pass 1 had 18 P0): 87 findings (14 P0, 41 P1, 32 P2).
  - Most came from four root causes. Three were fixed in the grader through zh plugin data, the fourth in the content.
- **Independent audit:** 414 lines (seed 20261105) with 0.24 % P0+P1, under the 2 % limit.
  - Answer keys alone came to 0.79 %.
  - 10 of the 10 re-checked fixes were correct.
  - The only P1 became a rule (特别 ⇄ 很/非常).
- **Decisions:** all 259 findings decided (243 fixed, 13 fixed differently, 3 kept with a reason). Recurring patterns are generator rules enforced by the self-checks.

This is an AI-simulated review. The profile stays `betaUntilReviewed` until the owner ticks `ai-review:zh-vi`.

## Gates
- **A1 claim gate:** zh-vi A1 is `courseClaimable: true` with no unassessed domain (an aligned estimate). PRE_A1 and A2 are not claimable.
- **Defaults:** vi → en-vi, en → fr-en, global fr-en.
- **Context coverage:** 612 / 725 (84 %), 21 words above level only.
- **Bot gate on 7e6eed46:** `bun run test`, `content:check` and `audio:check` ✔.
- **After pulling it, locally:**
  - `audio:check` ✔ (11,174 baseline files), typecheck and lint ✔.
  - `content:check` and `golden --check` report one difference, the order of two keys in `src/content/audio/zh-vi.ts` (累 / 红).
  - bun's ICU on Windows collates these two Han characters differently from the Linux runner. The committed file is the runner's output, and CI decides.
  - Follow-up: make the audio-manifest key order independent of ICU (code-point order for keys with Han/kana/Hangul) before ko-vi adds Hangul keys.
- **CI on the PR:** 5 timezones, languagetool, export-size and the device shards.

## Open
- **儿化 display:** pinyin is shown per character (nà r, not nàr). This is recorded in `release/KNOWN_LIMITATIONS.md`.
- **李师傅:** needs 师傅 and 傅 in the pinned sources. It is an owner choice (REVIEW-AI "Chưa chắc").
- **zh-en** stays on the device voice: its pack says 早餐, which the lexicon lacks.
- **Not seen on a device:**
  - the Chinese IME with typed answers (simplified and traditional);
  - the recogniser's zh-CN output;
  - the ruby (pinyin) layout;
  - Opus on iOS.

## Owner (`plan/OWNER-FINAL-CHECKLIST.md`)
- Read `content/zh/REVIEW-AI.md` and tick `ai-review:zh-vi`.
- Optional: listen to the 10 flagged short reception clips (list in `content/reports/zh/audio-quality.json` → `review`, layer reception).
- Optional: 20 recogniser transcripts for zh-CN.
- Device walk of zh-vi with the Chinese keyboard.

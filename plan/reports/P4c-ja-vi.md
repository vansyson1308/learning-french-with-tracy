# P4c: ja-vi (Japanese for Vietnamese speakers) and the JLPT N5 track

Branch `phase-4/ja-vi`. Prompt: `plan/prompts/P4c-ja-vi-jlpt-n5.md`. Built across seven sessions with deterministic generators under `content/ja/_drafts/_generators/` (`ja-pipeline.sh`, byte-identical on a second run). The working plan is `plan/authoring/ja-plan.md`.

## Content
- **Lexicon:** 957 lexemes (A1 + the A2-1 band).
  - Each has a Vietnamese gloss, kana, furigana and an example.
  - 8 proper nouns are taught in lessons but never offered as daily new words.
  - Factory safety signs are included (立入禁止, 安全第一, 禁煙, 足元注意, 消火器).
- **JLPT N5:** 629 of the 662 OpenJLPT N5 entries (each of the 33 left out has a reason), and 100 target kanji.
- **Hán-Việt:** 160 ja entries, each checked against Unihan or carrying a note. False friends are flagged (大丈夫, 必要, 意味, 丁寧…).
- **Course:** 108 lessons and 1,024 exercises (22 conjugationCloze, 60 particle fill-ins), plus 25 concept cards.
  - The kana primer comes with a 20-item checkpoint; migration v9 stores `primerPassed`.
  - Romaji is shown until that checkpoint is passed.
  - Section 1 has no kana typing: production uses tiles, and typing starts in Section 2.
  - "Type in katakana" items reject hiragana.
- **Reception and production:**
  - 28 readings, 268 clips, 52 speech items, 35 writing tasks.
  - 21 scenarios around work in Japan: factory safety, 面接, konbini, city office, clinic, phone to employer.
  - 45 graded stories (1,084 sentences, 135 questions).
- **Assessment:** 7 checkpoints (112 items) and a 4-stage placement test.
- **JLPT N5 track:** 2 disjoint forms × 67 original items, with section timings and pass marks taken from jlpt.jp.
  - `checkedAgainstOfficialGuide: true`: the official pages were read.
  - `formatFidelity: partial`: jlpt.jp publishes no item counts per question type.
  - Readiness is worded as "mức sẵn sàng ước tính".

## Engine work this milestone needed
- Furigana and kana readings for inflected forms (`ja-inflection.ts`).
- A speech match for kana transcripts of inflected verbs.
- Free writing in kana counts as practice.
- A primer checkpoint, migration v9 and romaji until the primer is passed.
- A story reader with RubyText and word-spaced romaji.
- Story tokenising by dictionary longest match with lookahead.
- `typeAnswer.script: "katakana"`.
- Reusable exam additions (mcq4, a skill per task, item lexeme refs, hidden reading aids).
- ja in `V8_REKEYED_TARGETS`, with a re-key test for ja-en progress.

## Audio
- **Front-end without MeCab** (`plan/reports/P4c-ja-audio-frontend.md`):
  - Every MeCab dictionary is BSD-licensed, which is not on the allowlist. Kokoro is therefore fed phonemes built from the course's own stored kana, through misaki/cutlet tables (Apache-2.0/MIT).
  - Re-render gate: when the reading inputs change, `phonemeFrontends.ja.version` must be bumped or a test fails.
  - Canary run 41653925472 against the misaki path: jf_alpha 0.2301 (was 0.2255), jm_kumo 0.3977 (was 0.5026).
- **Size:**
  - The first full run was 16.9 MB, over the 12 MB per-language cap, so ja pack, lexicon and reception clips use Opus 16 kbps like the stories.
  - Ja is now 8.9 MB (2,036 files); all languages total 51.3 MB of 88 MB.
- **Generate run** [41705404069](https://github.com/vansyson1308/learning-french-with-tracy/actions/runs/41705404069), bot commit 7deea79:
  - 2,421 clips, 0 technical failures.
  - Reception mean WER 0.043–0.070. The pack single words run 0.32–0.38, the usual ASR noise on one-word clips.
  - `owner-checklist` flags no clip after re-synthesis.
- **Earlier runs and what each fixed:**
  - 41632963222: ja-vi had no pack voice entry.
  - 41633821152: MeCab, which led to the front-end above.
  - 41655941175: size, which led to Opus.
  - 41678853220: 5 tests that only fail once ja-vi compiles, including Section 1 kana typing.
  - 41702274429: a grade-target count.

## Review (D-10)
`content/ja/REVIEW-AI.md` has the full record.
- **Answer pass:** 87 findings (62 P0, 18 P1, 7 P2).
- **Language pass:** 107 findings (3 P0, 40 P1, 64 P2).
- **Decisions:** all 194 decided. Recurring patterns became generator rules that the self-checks enforce.
- **Independent audit:** 407 lines (seed 20261104) with 0.74 % P0+P1, under the 2 % limit; 10/10 fixes correct. Answer keys alone came to 2.54 %; their three classes were closed by rules.

This is an AI-simulated review. The profile stays `betaUntilReviewed` until the owner ticks `ai-review:ja-vi`.

## Gates
- **A1 claim gate:** claimable in all five domains (an aligned estimate). The Vietnamese UI default stays en-vi and the global default fr-en. ja-en leaves onboarding as a legacy course.
- **Bot gate on 7deea79:** `bun run test`, `content:check` and `audio:check` ✔; goldens re-blessed by the run.
- **After pulling it:** `content:check` ✔ once the two review sheets were regenerated (they are outside the bot's paths). `golden --check` ✔, runtime goldens 65/65.
- **Earlier sessions:** typecheck and lint ✔, jest 123/123.
- **CI on the PR:** 5 timezones, languagetool, export-size, 6 device shards. These include the first device check of Opus lesson clips (ja-vi audio events).

## Open
- **Context coverage is 620 / 726 (85 %).** The missing words are mostly particles, dates and number words. They are taught through fill-in exercises, which carry no grade target, so the metric does not count them. Follow-up: put them into readings, clips or stories, or let fill-ins count, before v1.0.
- **Typed answers:** alternatives are still narrow in places (word order, time words). The D-10 review covered a sample.
- **No conjugation tables** for 飲む, 休む, 出す, 取る and 続ける: the kaikki dump has none.
- **Not seen on a device:**
  - Opus on iOS;
  - the Japanese IME with typed answers;
  - the recogniser's kana or kanji output;
  - the ruby layout.

## Owner (`plan/OWNER-FINAL-CHECKLIST.md`)
- Read `content/ja/REVIEW-AI.md` and tick `ai-review:ja-vi`.
- Compare the JLPT item counts with the official workbook.
- Check the JF Standard category names against the official site.
- Optional: 20 recogniser transcripts per language.
- Device walk of ja-vi, including Opus on iOS and the Japanese keyboard.

# P3d (it) — `it-vi`: Italian A1 for Vietnamese speakers + CILS A1 practice

Session: 2026-10-30/31 (Claude Code, autonomous loop), under `plan/prompts/QC-2026-10-29-de-it.md` §3 and the coordinator decisions of 2026-10-30 evening. Branch `phase-4/it-vi`.

## REPORT P3d-it

### Changed
- **The course `it-vi`:** 6 sections, 27 units, 108 lessons, 721 exercises of all 15 types; concept steps in 25 lessons, 25 of 25 cards shown; 35 objectives.
- **Lexicon:** 777 lexemes with Vietnamese glosses; A1 syllabus 735; A2-1 band 33.
- **Reception:** 34 readings and 220 clips, cast A `kokoro-im_nicola`, B `kokoro-if_sara`. Speech 54, writing 36, scenarios 20.
- **Assessment:** 7 checkpoints (102 items) and a 4-stage, 28-item placement.
- **CILS A1 track** `content/it/exam/cils-a1.json`: A1 standard module only, 112 original items in 2 forms. No certificate validity period is stated.
- **Stories:** 46 (6 A1-0, 2 A1-1, 34 A1-2, 4 A2-1), 864 sentences. Context coverage 735 / 735, all level-correct.
- **Italian gates** (`scripts/lib/languages/it-gates.ts`): article by gender and sound, plural, elision, essere/avere with agreement, Lei/tu per scenario, double-consonant drill. Variety: `content/it/VARIETY.md`.
- **`it-en` is untouched:** standalone, hidden from onboarding. Italian joins the v8 re-key, because v8 has not reached a device, so no v9 (`migrations-v8-it.test.ts`, fixture `v3-rc3-it.json`).
- **Engine fixes found on the way:**
  - The Goals screen pushed the French capstone id for every course; each course now uses its own (`capstone-link.test.ts`).
  - A language with clips and no audio passed validation with only a warning. A clip with no committed asset is now always an error.
  - `compileStoryAssetsModule` writes the eslint header only for Opus maps; lint runs with `--max-warnings 0`.

### Review (D-10)
`content/it/REVIEW-AI.md`: answer pass 125 findings (116 P0), language pass 134 (6 P0). Independent audit of 310 lines: 0 P0, 1 P1, 15 P2, so 0.3 % P0+P1, under the 2 % limit. The audit judged story questions and exam stems on the sampled text only. This is an AI-simulated review, not a native speaker's. The profile stays `betaUntilReviewed` until the owner ticks `ai-review:it-vi`.

Back-translation: 3,321 pairs, 52 flags, none open; not independent, as the same session ran the script and wrote the text (`content/it/_drafts/BACKTRANSLATION.md`).

### Gates
Real runs on GitHub Actions. Nothing is claimed from a phone.
- **Audio:** run 41126080727, bot commit 9b7e9d9. 1,856 clips, 1,599 unique assets, 0 technical failures, 23 sentence clips for review. Italian audio is 10.3 MB against the 12 MB cap; all languages 37.0 MB against 88 MB.
  - Earlier runs: 41098812088 and 41098878353 failed at the dry run (no manifest entry); 41098993931 failed the commit gate on 5 tests; 41117377680 passed but carried no reception audio, which led to the fix above.
- **Local on 9b7e9d9:** `audio:check` passed (5,512 baseline files), `content:check` up to date. LanguageTool it-vi before audio: 3,681 strings, 195 matches, all allowed, 0 failing, 0 stale.
- **CI and device shards:** see the PR checks.

### Device
Not run. It needs the owner: `OWNER-FINAL-CHECKLIST.md` D. Speech recognition in Italian has not been tried on a phone.

### Open questions / risks
- **Audio quality:** Kokoro's author grades the Italian voices C. Six clips whose ASR reading differs in meaning are in checklist C1; the other 17 flagged clips look like spelling differences (digits, *Arrivederci* split). Kokoro has no noise-scale re-synthesis.
- **Only two A1-1 stories:** A1-2 carries most of the set.
- **CILS format:** based on the 2009 guide and the June 2017 sample; re-check before a release that changes the track.

### Owner actions
- Read `content/it/REVIEW-AI.md` and tick `ai-review:it-vi` if accepted; decide the 2 uncertain items.
- Listen to the 6 clips in checklist C1.
- Device walk of `it-vi` with the rest of the final acceptance.

### Next
`audio/voice-lineage` (D-11), per `plan/prompts/QC-2026-10-31.md`.

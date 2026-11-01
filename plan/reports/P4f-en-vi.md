# P4f — `en-vi`: American English A1 for Vietnamese speakers + bậc 2 practice track

Session: 2026-10-31 to 2026-11-02 (Claude Code, autonomous loop), under `plan/prompts/P4f-en-vi-vstep.md`, `plan/authoring/en-plan.md` and QC 2026-11-01. Branch `phase-4/en-vi`.

## REPORT P4f

### Changed
- **The course `en-vi`:** 6 sections, 27 units, 108 lessons, 803 exercises of all 15 types; 37 objectives.
- **Lexicon:** 868 lexemes with Vietnamese glosses; A1 syllabus 750; A2-1 band 118.
- **Reception:** 55 readings and 280 clips, cast A `kokoro-am_michael`, B `kokoro-af_heart`. Speech 55, writing 47, scenarios 25.
- **Assessment:** 7 checkpoints (102 items) and a 4-stage, 26-item placement.
- **Practice track** `content/en/exam/bac2-qd1481.json`: bậc 2 of QĐ 1481/QĐ-BGDĐT, adults, 124 original items in 2 forms, `formatFidelity: "partial"`. Words above A1 can be tapped for a gloss (89 items, 81 words), never one that gives away the correct option.
- **Stories:** 46 (6 A1-0, 12 A1-1, 16 A1-2, 12 A2-1), 811 sentences. Context coverage 750 / 750.
- **English rules and gates** (`src/lib/languages/en.ts`, `scripts/lib/languages/en-gates.ts`): contractions, spoken numbers, clock and price formats, British spellings and words; a/an by sound, third-person -s, do-support, *very* before a verb, object pronouns as subjects, uncountable nouns.
- **Engine fixes from the code review:**
  - An n't before *there*, *it* or *you* expands unless it is really inverted: "She was not there." now matches "She wasn't there.".
  - In free writing a single British word counts only as a noun: "The land is flat" no longer meets an apartment slot. New `alignWrittenToKey`; exact-match answers and form fields keep `alignAnswerToKey`.
  - The exam validator refuses a gloss whose surface or translation is in the correct option; 9 glosses removed.
  - `authoredVerbs` is scoped to English, so a re-extract cannot change another language.
  - Optional `repeatable` on a writing slot: "Thank you. Best regards" is one closing, not keyword stuffing.

### Departure from P4f: no VSTEP track, no TOEIC set
P4f and D-13 ask for "VSTEP A1–A2" and a "TOEIC-basics" set. Neither can be done honestly as written (`plan/authoring/en-plan.md`):
- **VSTEP has no bậc 1–2 format.** QĐ 729/QĐ-BGDĐT covers bậc 3–5 only. A "VSTEP bậc 1–2" track would be a false level claim, which non-negotiable 3 forbids. The app names VSTEP only to say this track is not VSTEP.
- **TOEIC:** ETS's guidelines bar the name from product names and advertising keywords and require a notice on an app's opening screen; TOEIC Listening & Reading is far above A1. No set, and the name does not appear in the app or the user guide.
- **Instead:** the track models QĐ 1481, the Ministry's own bậc 2 format for adults. It is above this A1 course and says so.

### Variety
American English (`content/en/VARIETY.md`): the course name is "Tiếng Anh (Mỹ)", every modelled text uses the American form, and the voices are American. British forms are correct and never marked wrong in typed answers. Speech is not covered: "lift" for an `elevator` target needs an authored variant.

### IPA method
General American from Wiktionary through kaikki, verbatim, wherever a tagged or agreeing value exists: 771 `kaikki-en` (459 General American tag, 118 US tag, 194 untagged lines that agree with the hand-written column). The other 97 are hand-written, `original-english-course`: no licensed value, or a value the review rejected. Against the hand-written column: 389 identical, 370 notation only, 12 different (`content/en/_drafts/review/ipa-diff.json`). The kaikki values are not normalized, which is an open owner item.

The kaikki dump is pinned and republished weekly, so a fresh fetch does not match the pinned sha256 and `extract` for `en` stops, by design. Refreshing the dump is a deliberate step that re-pins it.

### Review (D-10)
`content/en/REVIEW-AI.md`: answer pass 140 findings (107 P0, 17 P1, 16 P2), language pass 196 (17 P0, 94 P1, 85 P2; 44 IPA). Independent audit of 329 lines (92 of 919 exercise lines, 237 of 2,367 language lines, seed 20261102): 2 P0, 2 P1, 13 P2, so 0.6 % P0 and 0.6 % P1, total 1.2 %, under the 2 % limit. All 10 re-checked fixes were correct. The audit read lines, not whole stories, and an exam item's reading or clip only if it fell in the sample. This is an AI-simulated review, not a native speaker's. The profile stays `betaUntilReviewed` until the owner ticks `ai-review:en-vi`.

Back-translation: 3,860 pairs, 43 flags, none open; not independent, as the same session ran the script and wrote the text (`content/en/_drafts/BACKTRANSLATION.md`).

### Gates
**Pending audio.** The audio workflow has not run on this content. Nothing is claimed from CI or a phone.
- **Audio:** pending. `validate-content` reports only missing audio: 420 `audioTarget` and 280 reception assets. `promote` therefore exits 1 at compile, as expected, and `src/content` has no compiled `en-vi` yet.
- **Goldens:** pending. The check fails only because compiled `en-vi` output is new against the baseline; the audio bot commit re-blesses it (non-negotiable 10).
- **Local on this branch:** see the commit's run in the session report; LanguageTool en-US: 4,724 strings, 396 matches, all allowed, 0 failing, 0 stale.
- **CI and device shards:** pending. No PR yet.

### Device
Not run. It needs the owner: `OWNER-FINAL-CHECKLIST.md` D. Speech recognition in this course has not been tried on a phone.

### Open questions / risks
- **The track's format needs a re-check before release.** The figures come from a reproduction on caselaw.vn. The Ministry's copy could not be opened on 2026-11-02 (502), so `checkedAgainstOfficialGuide` is `false` and the owner compares them with the signed copy (`OWNER-FINAL-CHECKLIST.md` B). The format source is also worth re-reading before any release that changes the track.
- **Writing rubric keys are narrow by nature:** the answer pass found most P0s there, and the audit found one more. A correct sentence that matches no authored phrasing still gets "don't forget".
- **Adjectives in free writing are a closed list:** "a strange flat" does not meet an apartment slot, though "an apartment" always does.
- **Audio quality:** not yet heard by anyone.

### Owner actions
- Read `content/en/REVIEW-AI.md` and tick `ai-review:en-vi` if accepted; decide the 7 uncertain items.
- Compare QĐ 1481 with the signed copy (`OWNER-FINAL-CHECKLIST.md` B).
- Device walk of `en-vi` with the rest of the final acceptance.

### Next
The audio workflow for `en`, the goldens it re-blesses, then the PR and its CI and device shards.

# P5b — Graded stories: comprehensible input from the learner's own lexicon state

Read `CLAUDE.md`, `plan/05-RESEARCH-MARKET.md` §3.2, §4.6, `plan/07-PRODUCT-SPEC.md` §4.4(2), `src/lib/reception/*`, `plan/authoring/*`. Branch `phase-5/stories`. End with the REPORT block.

## Tasks
1. Content type `story` under `content/<lang>/stories/`: 150–400 tokens, graded by lexicon band (A1-1 … A2-2), every token mapped to a lexeme id or marked `function`/`name`; 3–5 "new" lexemes per story; audio via P3b (two voices for dialogue); 3 comprehension questions (locate/infer); `translations.vi` per sentence for tap-to-gloss. Authoring step `stories` in the toolkit (prompt bundle + validators: coverage ≥ 95 % known at band, length caps, no CEFR text).
2. Runtime: "Đọc & nghe / Read & listen" entry in Practice and in Today (finale slot option); reader screen with sentence highlight synced to audio timestamps (store per-sentence offsets at build), tap word → gloss + add to review; completion feeds FSRS `listen`/`recognize` evidence for the new lexemes only, through the evidence gate (one mutation per card per session).
3. Selection engine: pick the next story whose unknown-word count for this learner (from card states) is 3–6; fallback order; tests with personas.
4. Author 20 stories for `en` and 10 for `fr` (French gets its own voice cast; goldens re-blessed only for the added artifacts, documented).
5. Docs + user guide; privacy unchanged.

## Definition of Done
Validators; reader works offline with audio; evidence tests; device walk; CI green; `plan/STATUS.md`.

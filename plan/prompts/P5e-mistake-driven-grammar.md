# P5e — Mistake-driven personal grammar

Read `CLAUDE.md`, `plan/05-RESEARCH-MARKET.md` §4.9, `plan/07-PRODUCT-SPEC.md` §4.4(4), `src/lib/writing/rubric.ts`, `src/lib/speech/grader.ts`, `src/lib/learning/concepts.ts`. Branch `phase-5/grammar-mistakes`. End with the REPORT block.

## Tasks
1. Error taxonomy per language (`content/<lang>/grammar/taxonomy.json`): rule ids linked to concept ids (articles, plural -s, verb -s, tense particle, word order, question auxiliary, …) with `{vi,en}` explanations and 3 example pairs each.
2. Deterministic detectors first: extend the writing rubric and typeAnswer/fillBlank/cloze graders to emit `errorTags[]` (slot missing, wrong form from the paradigm table, article mismatch from lexicon gender/countability, missing -s, wrong auxiliary) — no LLM in this milestone.
3. Rule cards: FSRS-scheduled `rule` items (`<lang>:rule:<id>`, skill `recognize`) created when a tag fires ≥ 2 times; review exercise type `ruleFix` (choose/correct the sentence) generated from the taxonomy examples + the learner's own anonymised sentence; evidence gate rules unchanged (assessment-origin only).
4. UI: "Lỗi thường gặp của bạn / Your common mistakes" in Practice with the top rules and a short Vietnamese explanation; concept card link.
5. Tests with fixtures of real learner-like answers (owner provides 30 examples per language as an Owner action).

## Definition of Done
Detectors precision-tested (no false positives on model answers); rule scheduling tests; UI; docs; CI green; `plan/STATUS.md`.

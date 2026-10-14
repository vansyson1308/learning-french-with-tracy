# P2b — Native-language content: produce `fr-vi` from `fr-en`

Read `CLAUDE.md`, `plan/07-PRODUCT-SPEC.md` §3, `plan/03-AUDIT-CONTENT.md` §2, `plan/02-AUDIT-ARCHITECTURE.md` §9.3–9.4, `content/README.md` (from P1c). Branch `phase-2/fr-vi`. End with the REPORT block.

## Goal
A second French course for Vietnamese speakers (`fr-vi`) that shares the French target corpus (lexemes `fr:w:*`, clips, speech items, scenarios, objectives, checkpoints, placement) and differs only in native-language text; both courses installed side by side; FSRS cards for French are shared across the two courses per decision D-4.

## Tasks
1. **Translation workflow** `bun scripts/translate-native.ts --from en --to vi --target fr`: walks every `Record<nativeCode,string>` field in `content/fr/**` and the pack `content/courses/fr-en.json` (glosses, options, prompts, questions, translations, guidebooks, concept prose, can-do, instructions, slot descriptions, cue facts, scenario goal/support, rubric strings), emits `content/courses/fr-vi.json` + adds `vi` keys in the shared `content/fr/**` files, and writes a **review sheet** `content/fr/REVIEW-vi.md` listing every string with source/target for a native reviewer. Translation engine: a pluggable provider interface; implement (a) a "manual/LLM-assisted draft" provider that reads drafts from a JSONL file the owner produces with Claude (give the exact prompt template with glossary and style rules in `plan/authoring/TRANSLATION-STYLE-vi.md`), and (b) no network calls from the repo itself. Fail closed: any untranslated key blocks compile for `fr-vi`.
2. Pack `fr-vi`: `nativeCode: "vi"`, exercise ids `fr-vi:…` mapped 1:1 to `fr-en` ids via a generated `content/courses/fr-vi.map.json` so the shared evidence (gradeTargets → `fr:w:*`) is identical; wordBank tokens and typeAnswer answers in Vietnamese re-authored where word order differs (translation ≠ token shuffle — review sheet flags these); `audio` policy inherits French voices.
3. Shared-progress rule (D-4): FSRS `cards` and `reviewLog` keyed by `(targetCode, itemId, skill)` in the P1d SQLite store, with `courseId` recorded for provenance; `completedLessons`, XP, mistakes stay per course. Migration note: existing `fr-en` cards are already `fr:w:*`, so no data change — add tests that a review in `fr-vi` updates the card seen in `fr-en`.
4. Assessment sharing: checkpoints/placement/estimate are target-level (`assessmentByCourse` from P1d becomes keyed by targetCode with the course recorded) — implement with a v5 migration moving `fr-en` → `fr`; document the decision.
5. Validators: cross-course consistency rule (`fr-vi` must cover the same exercise set, objectives, flows as `fr-en`); native-language coverage rule (every `Record<nativeCode,string>` has every nativeCode used by any course of that target).
6. UI: onboarding lists `fr-vi` for Vietnamese UI users first; course switcher shows native language; Licences/Privacy already language-aware (P2a).
7. Claim gate: `fr-vi` inherits French's A1 claimable status (the target corpus is the same) — the report `cefr-claim-gate.json` becomes per target with per-course coverage.
8. Docs: `plan/authoring/TRANSLATION-STYLE-vi.md` (register, glossary, how to treat grammar terms, what NOT to translate), `docs/USER_GUIDE.vi.md` updated, `KNOWN_LIMITATIONS.md` ("Vietnamese translation reviewed by: pending native review" until the owner signs off).

## Definition of Done
`fr-vi` compiles, validates, claim gate passes; device walk of `fr-vi` in Vietnamese UI by the owner listed as Owner action; `fr-en` goldens unchanged except the documented keying migration; CI green; `plan/STATUS.md` updated.

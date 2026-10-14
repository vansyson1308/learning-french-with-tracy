# P1a — Golden tests that pin French behaviour before the refactor

Read `CLAUDE.md`, then `plan/01-TONG-QUAN-VA-QUYET-DINH.md`, `plan/07-PRODUCT-SPEC.md`, `plan/08-ROADMAP.md`, and `plan/02-AUDIT-ARCHITECTURE.md` §1, §6, §7. Create a task list before coding. Branch `phase-1/golden-tests`. Do not change any behaviour. End with the REPORT block from `plan/prompts/README.md`.

## Goal
A set of snapshot/golden tests that will fail if Phase 1 refactors change anything observable about the French course, so that P1b–P1d can be proven safe.

## Tasks
1. **Compile goldens** (`scripts/__tests__/golden/`): hash (sha256) of every file under `src/content/**` and `assets/lexicon/*.db` logical dump, plus `content/reports/*.json`, stored in `scripts/__tests__/golden/compile-manifest.json`. A test recompiles into a temp dir (the pipeline already supports containment — find the API in `scripts/lib/pipeline.ts`) and compares hashes. Provide `bun scripts/golden.ts --update` to re-bless with a required `--reason` string that is appended to `scripts/__tests__/golden/CHANGELOG.md`.
2. **Runtime goldens** (`src/lib/__tests__/golden/`), all deterministic (seeded RNG, fixed `now`):
   - Session: for `fr-en` lesson `fr-en:u0-l0`, a Section 2 lesson with `flow`, the `mistakes`, `srs`, `srs-listening`, `srs-speaking`, `writing-practice`, `conversation` definitions, the section-3 checkpoint and the placement stage 1 — snapshot the full `SessionDefinition` (steps, policies) and the reducer trace for a scripted answer sequence (correct, wrong, retry, undo).
   - Today composer: snapshot plans for 3 personas from `src/lib/__fixtures__/progress/` at short/regular/long presets with and without `canSpeak`.
   - Evidence → FSRS: snapshot the card states and review log after a scripted session for each persona (`applyEvidence` outputs).
   - Assessment: snapshot `estimate.ts` output (objective states + A1 claim) and checkpoint scoring for the fixtures; placement run result for a scripted answer path.
   - Lexicon: snapshot `fr-index.json` lookups, `lexicon-search` results for `café`, `cafe`, `oeuf`, `œuf`, `le`, and `articleCueFor` for 10 lexemes.
   - Grading: table-driven snapshot of `checkAnswer` for every exercise type with 5 inputs each (reuse existing fixtures).
   - Migrations + backup: snapshot the migrated state for each historical persona and a backup export/import round trip.
3. Snapshots are JSON files committed next to the tests; the tests must run in all 5 CI timezones (use the existing `dates.ts` seams). Keep total runtime < 20 s.
4. Add `golden` to `ci.yml` as a named step so the REPORT block can cite it.
5. Document in `plan/STATUS.md` and a short `src/lib/__tests__/golden/README.md` (what is pinned, how to re-bless, when re-blessing is legitimate).

## Definition of Done
`bun run test` includes the golden suites and passes; `bun scripts/golden.ts --check` passes on `main`; re-running compile produces zero hash changes; CI green.

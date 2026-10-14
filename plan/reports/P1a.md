# P1a — Golden tests that pin French behaviour before the refactor

Session: 2026-10-14 (Claude Code, autonomous loop). Branch `phase-1/golden-tests`.

## REPORT P1a
Branch / PR: `phase-1/golden-tests` → `main`; PR: PR_PLACEHOLDER
Changed:
- `scripts/lib/compile-artifacts.ts` (new): `validateAllSources()` + `compileAllArtifacts()` — the compiler's validation and in-memory artifact assembly extracted verbatim from `scripts/compile-content.ts` (which now calls them; `content:check` proves zero drift). Needed so a golden test can recompile without writing.
- `scripts/lib/golden.ts` (new): compile manifest (sha256 of every file under `src/content/**`, every `content/reports/*.json`, `ATTRIBUTIONS.md`; logical dump of `assets/lexicon/*.db`), fresh recompile hashing, diffs, snapshot hashing.
- `scripts/golden.ts` (new CLI): `--check` (manifest vs committed + fresh recompile, then the runtime suites); `--update --reason "…"` (mandatory reason; refuses stale artifacts; rewrites manifest + snapshots; appends to `scripts/__tests__/golden/CHANGELOG.md`).
- `scripts/__tests__/golden/compile-golden.test.ts` + `compile-manifest.json` (45 files + db dump) + `CHANGELOG.md` (initial bless logged).
- `src/lib/__tests__/golden/` (new): `helpers.ts` (expectGolden with sorted-key JSON, fixed clock `2026-06-15T12:00Z`, fixed seed day, personas from `__fixtures__/progress/`, French pack index, scripted correct/wrong answers per exercise type, reducer tracer), 7 suites × 54 tests, 68 snapshots under `snapshots/`:
  - session: definitions + reducer traces for `fr-en:u0-l0` (first + replay), the Section-2 flow lesson `fr-en:ua-l0`, mistakes (v0-rich), srs (v0-rich cards + a synthetic due set), srs-listening, srs-speaking, writing-practice, conversation, section-3 checkpoint (attempt 0 and 1), placement stage 1 (with skips).
  - today: 4 personas (fresh, multi-course, v0-rich, synthetic-due with listen/speak cards) × short/regular/long × speak/silent.
  - evidence: scripted 6–8 ReviewEvidence items per persona through `applyEvidence` → cards, wordStats, srs, review log, mutation flags.
  - assessment: objective states + A1 estimate per persona (speech known / unknown); checkpoint scoring of a scripted sitting for section-1 and section-3 + the estimate after it; placement stage-1 run (answers, stage advance, recommendation, estimates, result).
  - lexicon: index lookups + article cues + lookup-form resolution; search (`café`, `cafe`, `oeuf`, `œuf`, `le`, …); repository detail/examples/list orders.
  - grading: `answerIsReady` / `checkAnswer` / `correctAnswerText` for the first authored exercise of all 15 types × 5 inputs.
  - migrations + backup: every persona (incl. v0-flat-legacy) migrated → envelope → staged import; v0-rich at each intermediate version.
  - `README.md`: what is pinned, how to re-bless, when that is legitimate.
- `.github/workflows/ci.yml`: named step **Golden tests (French behaviour pinned)** (`bun scripts/golden.ts --check`) in every timezone lane.
- `plan/STATUS.md`, `plan/reports/P1a.md`.
Gates: typecheck ✅ · lint ✅ · bun test ✅ (1259pass incl. 54 runtime + 3 compile goldens; local TZ, plus the golden suites re-run under Pacific/Kiritimati, Pacific/Pago_Pago, Asia/Tokyo ✅) · jest ✅ (69) · content:check ✅ (zero drift after the compiler extraction) · audio:check ✅ · release:identity ✅ · golden ✅ (`bun scripts/golden.ts --check`: 45 files + db, 54 runtime, ~6 s total; runtime suites alone ~0.2 s) · web export+e2e: CI
Device: not run (no app change).
Docs updated: `src/lib/__tests__/golden/README.md`, `scripts/__tests__/golden/CHANGELOG.md`, `plan/STATUS.md`.
Open questions / risks:
- The compile golden pins *every* generated file, including the seven inherited `*-en` packs and the audio reports; P4a (retiring those packs) and any audio re-bless will legitimately change it — re-bless with the milestone named in `--reason`.
- Snapshots total ~0.7 MB of JSON; `today/*` and `session/*.definition` are the large ones. Acceptable; if they grow, pin step ids + exercise ids instead of full exercises.
- `simpleForm` goldens use the rubric's first slot variants as the "correct" form; `interactionScenario` uses a synthetic finished-run answer (the engine itself has its own suites).
Owner actions: none for P1a (RC3 phone packets + tag from P0 still outstanding).
Next: P1b (CourseProfile decouple) must keep every golden byte-identical; run `bun scripts/golden.ts --check` after each refactor step, never re-bless to make a refactor pass.

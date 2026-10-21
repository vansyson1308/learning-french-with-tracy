# CLAUDE.md — project instructions for Claude Code

This repository is a local-first language-learning app (Expo SDK 57 / React Native 0.86 / React 19 / Hermes, expo-router, zustand, expo-sqlite, ts-fsrs). French (`fr-en`) is complete to a CEFR-aligned A1 with an "excellence layer"; the project is now being generalised into a Vietnamese-first multi-language app. **Read `plan/01-TONG-QUAN-VA-QUYET-DINH.md` (overview), `plan/07-PRODUCT-SPEC.md` and `plan/08-ROADMAP.md` before any non-trivial task.** The engineering facts you need are in `plan/02-AUDIT-ARCHITECTURE.md`, `plan/03-AUDIT-CONTENT.md`, `plan/04-AUDIT-BUILD-RELEASE.md`.

## Commands
```bash
bun install --frozen-lockfile
bun run typecheck && bun run lint
bun run test                      # bun unit + content tests (CI runs them in 5 timezones)
bunx jest                         # integration tests (jest-expo)
bun run content:validate          # every validator
bun run content:compile           # regenerates src/content/*, assets/lexicon/*.db, content/reports/*, ATTRIBUTIONS.md — commit the outputs
bun run content:check             # drift guard (what CI runs)
bun run audio:check               # audio baseline (needs LF line endings; on Windows run after the path-separator fix)
bun run release:identity          # identity gate
bunx expo export --platform web && bun run e2e:web && bun run e2e:guide
```
Windows: clone with `-c core.autocrlf=false`, keep the checkout at a short path without spaces (`C:\src\lft`), JDK 17, see `plan/04-AUDIT-BUILD-RELEASE.md` §3.

## Non-negotiables
1. **No network by default.** The app makes no requests; no analytics, accounts, or telemetry. Any opt-in network feature needs an explicit consent screen, a privacy-policy change (`release/PRIVACY_POLICY.md` + `src/lib/privacy-policy.ts` + its test), and a Data-safety note.
2. **Provenance and licences.** Every data source, voice, model and library goes into `content/sources/registry.json` (allowlist: MIT, Apache-2.0, CC-BY-4.0, CC-BY-SA-4.0, CC-BY-2.0-FR, CC0-1.0, original) and surfaces in `ATTRIBUTIONS.md`/Licences screen. Nothing GPL, NC, ND or "licence unknown" ships in the APK. CC BY-SA data stays in data files, never in code.
3. **Honesty.** CEFR/exam results are "aligned estimates", never certifications; the claim gate (`content/reports/cefr-claim-gate.json`) decides what the app may say. Vocabulary/lesson/XP counts are never inputs to a level claim.
4. **French stays byte-identical** unless a task explicitly changes it. `fr:w:*` ids are frozen (persisted in learner data). Golden tests under `src/lib/__tests__/golden/` and `scripts/__tests__/golden/` must pass.
5. **Deterministic content.** Authored content lives under `content/`; `src/content/` is generated. Never hand-edit generated files. Run `content:compile` and commit outputs. Validators are the contract: extend them when you extend the schema.
6. **Learner data is sacred.** Any persisted-shape change needs a numbered migration in `src/lib/persistence/migrations.ts`, fixtures in `src/lib/__fixtures__/progress/`, and backup round-trip tests.
7. **Speech privacy.** No transcripts or audio persisted; speech cache swept; the tutor seam (`src/lib/tutor`) can never be imported by grading/assessment/learning/session modules (import-graph test).
8. **Release discipline.** Versions change only via `bun run release:bump`. Never commit keystores, tokens, `android/`, `ios/`. Any app change after device testing = next RC; record it in `release/RC_HISTORY.md`.
9. **No engagement dark patterns.** No energy/hearts/leagues/gem shop/aggressive notifications. Gentle streak with free freezes only.
10. **Bot commits pass the PR gates.** A workflow commits only through `scripts/ci/bot-commit.sh` (audio, lexicon-source, lexique-source, eas-build): it re-blesses the goldens with a reason naming `<workflow> <lang> <mode> run <run_id>` when they changed, then runs `bun run test`, `content:check` and `audio:check`; any failure commits nothing. Workflow-token pushes do not trigger CI, so `ci.yml` also runs on `workflow_run` of those workflows and daily. After merging bot commits from `main` into a branch, run `bun scripts/golden.ts --check` before pushing.

## Conventions
- TypeScript strict; pure engines in `src/lib/**` with tests beside them in `src/lib/__tests__/`; UI in `src/app` (expo-router) and `src/components`.
- Per-language rules live in `src/lib/languages/<code>.ts` (runtime) and `scripts/lib/languages/<code>.ts` (build). Never add a new `=== "fr-en"` check; use `courseProfile(courseId).capabilities`.
- Content ids are namespaced by target language: `<lang>:w:<slug>` (lexemes), `<lang>.obj.*`, `<lang>.clip.*`, `<lang>.read.*`, `<lang>.speak.*`, `<lang>.write.*`, `<lang>.scenario.*`, `<lang>.checkpoint.*`, `<lang>.pli.*`; exercise ids `<courseId>:<unit>-<lesson>-e<n>`.
- Native-language text is keyed by native code (`{vi: …, en: …}`); never assume English.
- UI strings go through `t()` (after Phase 2); no hardcoded English in `src/`.
- Tests: add a failing test first for engine changes; keep e2e selectors on `testID`.
- Commits: conventional (`feat(engine): …`, `content(en): …`, `release: …`); PR description lists the gates run and their results; end with the attribution lines the session provides.

## Working style for milestone prompts
1. Read the milestone prompt in `plan/prompts/`, the referenced sections of the audits, and the files it names. Make a task list.
2. Do the work on branch `phase-N/<milestone>`; run every gate locally; fix what breaks.
3. Update docs (`release/*`, `docs/USER_GUIDE.md`, `KNOWN_LIMITATIONS.md`, `plan/STATUS.md`).
4. Finish with a report: what changed, gates + results, open questions, what the owner must do by hand (device tests, secrets, accounts). Never claim a device result you did not observe.

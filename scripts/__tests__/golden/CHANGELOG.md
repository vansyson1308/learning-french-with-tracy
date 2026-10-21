# Golden CHANGELOG

Every re-bless of the compile manifest or the runtime snapshots is logged here by
`bun scripts/golden.ts --update --reason "..."` (date, reason, changed goldens).
A refactor must never appear in this file; only deliberate French changes do.

## 2026-10-14 — P1a initial bless: pins French compile artifacts and runtime behaviour before the Phase 1 refactors

- runtime: new      src/lib/__tests__/golden/snapshots/assessment/checkpoint.fr.checkpoint.section-1.json
- runtime: new      src/lib/__tests__/golden/snapshots/assessment/checkpoint.fr.checkpoint.section-3.json
- runtime: new      src/lib/__tests__/golden/snapshots/assessment/estimate.fresh.json
- runtime: new      src/lib/__tests__/golden/snapshots/assessment/estimate.multi-course.json
- runtime: new      src/lib/__tests__/golden/snapshots/assessment/estimate.v0-rich.json
- runtime: new      src/lib/__tests__/golden/snapshots/assessment/placement.stage-1.json
- runtime: new      src/lib/__tests__/golden/snapshots/evidence/fresh.json
- runtime: new      src/lib/__tests__/golden/snapshots/evidence/multi-course.json
- runtime: new      src/lib/__tests__/golden/snapshots/evidence/v0-rich.json
- runtime: new      src/lib/__tests__/golden/snapshots/grading/table.json
- runtime: new      src/lib/__tests__/golden/snapshots/lexicon/index.json
- runtime: new      src/lib/__tests__/golden/snapshots/lexicon/repository.json
- runtime: new      src/lib/__tests__/golden/snapshots/lexicon/search.json
- runtime: new      src/lib/__tests__/golden/snapshots/migrations/fresh.json
- runtime: new      src/lib/__tests__/golden/snapshots/migrations/multi-course.json
- runtime: new      src/lib/__tests__/golden/snapshots/migrations/v0-flat-legacy.json
- runtime: new      src/lib/__tests__/golden/snapshots/migrations/v0-rich.json
- runtime: new      src/lib/__tests__/golden/snapshots/migrations/v0-rich.steps.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/checkpoint-section-3-attempt0.definition.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/checkpoint-section-3-attempt0.trace.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/checkpoint-section-3-attempt1.definition.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/checkpoint-section-3-attempt1.trace.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/conversation.definition.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/conversation.trace.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/mistakes-v0-rich.definition.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/mistakes-v0-rich.trace.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/path-u0-l0-first.definition.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/path-u0-l0-first.trace.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/path-u0-l0-replay.definition.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/path-u0-l0-replay.trace.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/path-ua-l0-flow.definition.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/path-ua-l0-flow.trace.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/placement-stage-1.definition.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/placement-stage-1.trace.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/srs-listening.definition.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/srs-listening.trace.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/srs-speaking.definition.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/srs-speaking.trace.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/srs-synthetic.definition.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/srs-synthetic.trace.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/srs-v0-rich.definition.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/srs-v0-rich.trace.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/writing-practice.definition.json
- runtime: new      src/lib/__tests__/golden/snapshots/session/writing-practice.trace.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/fresh.long.silent.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/fresh.long.speak.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/fresh.regular.silent.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/fresh.regular.speak.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/fresh.short.silent.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/fresh.short.speak.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/multi-course.long.silent.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/multi-course.long.speak.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/multi-course.regular.silent.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/multi-course.regular.speak.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/multi-course.short.silent.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/multi-course.short.speak.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/synthetic-due.long.silent.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/synthetic-due.long.speak.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/synthetic-due.regular.silent.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/synthetic-due.regular.speak.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/synthetic-due.short.silent.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/synthetic-due.short.speak.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/v0-rich.long.silent.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/v0-rich.long.speak.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/v0-rich.regular.silent.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/v0-rich.regular.speak.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/v0-rich.short.silent.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/v0-rich.short.speak.json

## 2026-10-14 — P1b course profiles: the compiler now also emits src/content/course-profiles.json, src/content/ids/*, src/content/artifacts/*, src/content/flags.ts and src/content/lexicon/db-assets.ts (replacing db-asset.ts); every pre-existing French artifact and every runtime snapshot is byte-identical

- compile: new      src/content/artifacts/de-en.ts
- compile: new      src/content/artifacts/es-en.ts
- compile: new      src/content/artifacts/fr-en.ts
- compile: new      src/content/artifacts/index.ts
- compile: new      src/content/artifacts/it-en.ts
- compile: new      src/content/artifacts/ja-en.ts
- compile: new      src/content/artifacts/ko-en.ts
- compile: new      src/content/artifacts/pt-en.ts
- compile: new      src/content/artifacts/zh-en.ts
- compile: new      src/content/course-profiles.json
- compile: new      src/content/flags.ts
- compile: new      src/content/ids/fr.json
- compile: new      src/content/ids/index.ts
- compile: new      src/content/lexicon/db-assets.ts
- compile: missing  src/content/lexicon/db-asset.ts

## 2026-10-14 — P1c schema/compiler generalisation: the lexicon database is now one per target language (assets/lexicon/<lang>-lexicon-v3-<hash>.db, schema v3: examples columns target_text/native_text, FTS tokenizer by script) — the French database's logical dump is identical to v2 except user_version, metadata.schemaVersion/contentHash and the two examples column names (verified), so fr-index.json / fr-web-fallback.json / lexicon-quality.json / course-profiles.json / db-assets.ts and the lexicon/index runtime snapshot change only in contentHash/schemaVersion/db name; src/content/catalog.json is now generated and gains nativeCode; the synthetic test language xx adds src/content/test-only/** and content/reports/xx/*; every other French artifact and every other runtime snapshot is byte-identical

- compile: initial manifest (format compile-golden/2 — `lexiconDbs` keyed by language replaces `lexiconDb`; the format-1 manifest could not be diffed by the CLI, so the file-level diff below is taken from git against the P1b bless)
- compile: changed  src/content/catalog.json (now generated: every course row gains `nativeCode`; counts unchanged)
- compile: changed  src/content/course-profiles.json (fr-en `artifacts.lexiconDb` → assets/lexicon/fr-lexicon-v3-4fd93ff6c545b579.db)
- compile: changed  src/content/lexicon/db-assets.ts (same database rename)
- compile: changed  src/content/lexicon/fr-index.json (`contentHash` only: 07337cd4a8d13484 → 4fd93ff6c545b579)
- compile: changed  src/content/lexicon/fr-web-fallback.json (`contentHash` + `schemaVersion` 2 → 3 only)
- compile: changed  content/reports/lexicon-quality.json (`contentHash` only)
- compile: renamed  assets/lexicon/fr-lexicon-v2-07337cd4a8d13484.db → fr-lexicon-v3-4fd93ff6c545b579.db (logical dump identical except `user_version`, `metadata.schemaVersion`/`contentHash`, and `examples.fr`/`en` → `target_text`/`native_text`; verified row-for-row before the bless)
- compile: new      assets/lexicon/xx-lexicon-v3-c228fce0a96c54c4.db, src/content/test-only/** (23 files), content/reports/xx/*.json (8 files) — the synthetic test language, never bundled
- compile: unchanged every other French artifact (packs, concepts, assessment, reception, speech, writing, interaction, every other report, ATTRIBUTIONS.md, attributions.json) — byte-identical
- runtime: changed  src/lib/__tests__/golden/snapshots/lexicon/index.json (`contentHash` only); the other 53 runtime snapshots are byte-identical

## 2026-10-14 — P1d: persist v4 (per-course assessment, uiLanguage), backup envelope v2 (blob + learner store halves), new v3-assessed persona; cards/review log leave the blob

- runtime: changed  src/lib/__tests__/golden/snapshots/migrations/fresh.json
- runtime: changed  src/lib/__tests__/golden/snapshots/migrations/multi-course.json
- runtime: changed  src/lib/__tests__/golden/snapshots/migrations/v0-flat-legacy.json
- runtime: changed  src/lib/__tests__/golden/snapshots/migrations/v0-rich.json
- runtime: changed  src/lib/__tests__/golden/snapshots/migrations/v0-rich.steps.json
- runtime: new      src/lib/__tests__/golden/snapshots/assessment/estimate.v3-assessed.json
- runtime: new      src/lib/__tests__/golden/snapshots/evidence/v3-assessed.json
- runtime: new      src/lib/__tests__/golden/snapshots/migrations/v3-assessed.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/v3-assessed.long.silent.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/v3-assessed.long.speak.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/v3-assessed.regular.silent.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/v3-assessed.regular.speak.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/v3-assessed.short.silent.json
- runtime: new      src/lib/__tests__/golden/snapshots/today/v3-assessed.short.speak.json
- runtime: unchanged every French behaviour snapshot (today, evidence, assessment, session, grading, lexicon) for the existing personas — byte-identical; the migration diffs are only `persistVersion` 3→4, `assessment` → `assessmentByCourse`, `uiLanguage`, envelope v2 (`learner` half + manifest counts)
- compile: unchanged — no content artifact changed

## 2026-10-14 — P2b: fr-vi (Vietnamese-native French) course — new fr-vi compile artifacts + fr-vi lexicon DB pin; runtime migration goldens now end at persist v5 (assessment keyed by target language, D-4); French fr-en artifacts remain byte-identical (same lexicon hash 4fd93ff6c545b579)

- compile: changed  content/reports/cefr-claim-gate.json
- compile: changed  content/reports/grade-targets.json
- compile: changed  src/content/artifacts/index.ts
- compile: changed  src/content/catalog.json
- compile: changed  src/content/course-profiles.json
- compile: changed  src/content/flags.ts
- compile: changed  src/content/lexicon/db-assets.ts
- compile: changed  src/content/packs/index.ts
- compile: new      src/content/artifacts/fr-vi.ts
- compile: new      src/content/assessment/fr-vi-checkpoints.json
- compile: new      src/content/assessment/fr-vi-objectives.json
- compile: new      src/content/assessment/fr-vi-placement.json
- compile: new      src/content/concepts/fr-vi-concepts.json
- compile: new      src/content/interaction/fr-vi-scenarios.json
- compile: new      src/content/lexicon/fr-vi-index.json
- compile: new      src/content/lexicon/fr-vi-web-fallback.json
- compile: new      src/content/packs/fr-vi.json
- compile: new      src/content/reception/fr-vi-reading.json
- compile: new      src/content/speech/fr-vi-speech-items.json
- compile: new      src/content/writing/fr-vi-writing.json
- compile: new      lexicon-db:fr-vi:fr-vi-lexicon-v3-b49c69da4dd7df8b.db
- runtime: changed  src/lib/__tests__/golden/snapshots/migrations/fresh.json
- runtime: changed  src/lib/__tests__/golden/snapshots/migrations/multi-course.json
- runtime: changed  src/lib/__tests__/golden/snapshots/migrations/v0-flat-legacy.json
- runtime: changed  src/lib/__tests__/golden/snapshots/migrations/v0-rich.json
- runtime: changed  src/lib/__tests__/golden/snapshots/migrations/v0-rich.steps.json
- runtime: changed  src/lib/__tests__/golden/snapshots/migrations/v3-assessed.json

## 2026-10-14 — P3a: Spanish lexicon (800 lexemes) compiled from the ETL v2 evidence — new es artifacts (ids registry, lexicon index/fallback/DB pin, reports), es-en pack gains gradeTargets from the registry, db-assets/course-profiles/attributions list the new language and sources; French artifacts and every runtime snapshot byte-identical

- compile: changed  ATTRIBUTIONS.md
- compile: changed  content/reports/grade-targets.json
- compile: changed  src/content/artifacts/es-en.ts
- compile: changed  src/content/attributions.json
- compile: changed  src/content/course-profiles.json
- compile: changed  src/content/ids/index.ts
- compile: changed  src/content/lexicon/db-assets.ts
- compile: changed  src/content/packs/es-en.json
- compile: new      content/reports/es/lexicon-quality.json
- compile: new      content/reports/es/lexicon-source-audit.json
- compile: new      src/content/ids/es.json
- compile: new      src/content/lexicon/es-index.json
- compile: new      src/content/lexicon/es-web-fallback.json
- compile: new      lexicon-db:es:es-lexicon-v3-e06659b53a31c566.db

## 2026-10-14 — P3b: registry gains the Kokoro-82M and MeloTTS engine entries (build-time only) — ATTRIBUTIONS.md / attributions.json regenerated; no content artifact changed, French byte-identical

- compile: changed  ATTRIBUTIONS.md
- compile: changed  src/content/attributions.json

## 2026-10-21 — audio canary de/it/vi from data workflow (commits 758395ca, ea78252a, 92abc46d)

- compile: changed  ATTRIBUTIONS.md
- compile: changed  src/content/attributions.json
- compile: new      content/reports/de/audio-canary.json
- compile: new      content/reports/de/audio-recon.json
- compile: new      content/reports/it/audio-canary.json
- compile: new      content/reports/it/audio-recon.json
- compile: new      content/reports/vi/audio-canary.json
- compile: new      content/reports/vi/audio-recon.json

## 2026-10-21 — de voice cast B: thorsten-medium (same reader as A) replaced by kerstin-low under the different-speaker cast rule (QC 2026-10-21)

- compile: changed  ATTRIBUTIONS.md
- compile: changed  src/content/attributions.json

<<<<<<< HEAD
## 2026-10-21 — register original-spanish-course (es-vi authored content source, P3d) — attributions only

- compile: changed  ATTRIBUTIONS.md
- compile: changed  src/content/attributions.json
=======
## 2026-10-21 — audio.yml es canary (all) run 39639505968

- compile: changed  ATTRIBUTIONS.md
- compile: changed  src/content/attributions.json
- compile: new      content/reports/es/audio-canary.json
- compile: new      content/reports/es/audio-recon.json

## 2026-10-21 — audio.yml pt canary (all) run 39641421297

- compile: changed  ATTRIBUTIONS.md
- compile: changed  src/content/attributions.json
- compile: new      content/reports/pt/audio-canary.json
- compile: new      content/reports/pt/audio-recon.json

## 2026-10-21 — audio.yml zh canary (all) run 39642847235

- compile: changed  ATTRIBUTIONS.md
- compile: changed  src/content/attributions.json
- compile: new      content/reports/zh/audio-canary.json
- compile: new      content/reports/zh/audio-recon.json

## 2026-10-21 — audio.yml en canary (all) run 39644566161

- compile: changed  ATTRIBUTIONS.md
- compile: changed  src/content/attributions.json
- compile: new      content/reports/en/audio-canary.json
- compile: new      content/reports/en/audio-recon.json

## 2026-10-21 — audio.yml ko canary (all) run 39647522722

- compile: new      content/reports/ko/audio-canary.json
- compile: new      content/reports/ko/audio-recon.json

## 2026-10-21 — audio.yml de canary (all) run 39648961207

- compile: changed  ATTRIBUTIONS.md
- compile: changed  content/reports/de/audio-canary.json
>>>>>>> origin/main

## 2026-10-21 — merge main into phase-3/es-vi: audio canary bot commits (es, pt, zh, en, ko, de) and the original-spanish-course registry entry

- compile: changed  ATTRIBUTIONS.md
- compile: changed  src/content/attributions.json

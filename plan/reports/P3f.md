# P3f — QC follow-up of PR #40, audio size budget, RC4

Session: 2026-10-22 (Claude Code). Branch `phase-3/es-vi-hardening` (PR #40), then RC4.
Prompt: `plan/prompts/P3f-qc-followup-and-rc4.md`.

## REPORT P3f (blocks A–C, E; D = RC4 below)

**A. CI red → green** (`2d4dbae`)
1. `src/content/audio-manifest.ts` had 178 duplicate keys (TS1117): the pack and lexicon layers both
   key clips `<course>:<text>`. `apply` now merges per key (`scripts/lib/audio-manifest.ts`): identical
   asset → one entry, different assets → the pack's; two pack assets or keys differing only by Unicode
   normalisation fail the run. Tests reproduce the collision; `audio.ts manifest-dedupe` repaired the
   committed manifest.
2. `scripts/ci/bot-commit.sh` also runs `typecheck` and `lint`; CLAUDE.md rule 10 updated.
3. `ci.yml` `workflow_run` acts only on runs of `main` (trigger `branches: [main]` + job conditions);
   feature branches get CI from their own events — after a bot commit on a branch, push a commit of your
   own.

**B. Audio size** (`bd444d8`, `b62bd5c`, `8d412e9`, run 39761607493 → `4709acc`)
1. Lexicon audio = syllabus words only (`scripts/lib/lexicon-audio.ts`).
2. pipelineVersion 3 (default; French stays 1) encodes speech at 32 kbps mono
   (`engines.json` `encoding.mp3KbpsFromVersion`). Device playback is on the RC4 checklist.
3. Size gate: `audio:check` fails above 12 MB per language and on a stale
   `content/reports/audio-size.json`. Result: **es 7.4 MB** (was 35.2 MB; 1,197 files), fr 4.2, de 0.7,
   pt 0.7; total 13.0 MB.
4. `release/ASSET_DELIVERY.md` — Play Asset Delivery / ODR plan for > 4 languages (not implemented).
   Found on the way and fixed: the first Spanish generate voiced only `es-en` (primary course taken by
   smallest native code instead of the declared role; `es-vi` missing from the pack manifest; no Spanish
   reception manifest → reception silently skipped), and reception asset keys were hard-coded to
   pipelineVersion 1 in the validator/compiler. Spanish QA: 1,348 clips, 0 technical failures, mean
   WER es-vi pack 0.18 / es-en 0.07 / reception 0.01–0.09, 5 sentences flagged for listening review.

**C. Content** (`2f6256e`)
1. `content/es/lexicon/topic-units.json` (topic or topic:pos → unit): unit-1 no longer collects 328
   untaught daily words (verbs → unit-b, everyday nouns → unit-j, adjectives → unit-n, …). Lint
   `syllabus-context` (warning): **404 / 613** daily words still have no sentence in a lesson, reading or
   clip — the P5b target is 0.
2. The paradigms already had the vosotros cells; added concept `es:concept:vosotros-ustedes` and lesson
   `es-vi:ub-l4` (6 recognition exercises). Production keeps accepting ustedes.
3. Variety: already an error in `content:validate`; "boleto" only in accepted answers / clip ids; "coche"
   is the Peninsular model — no content change needed.
4. DELE A1 `checkedAgainstOfficialGuide: true`, `checkedBy: "coordinator (owner-delegated)"`,
   `checkedAt: 2026-10-22`, retrieval dates on the two official PDFs; the in-app note disappears;
   recordings play twice (validator-enforced). Docs corrected: **30 of 50 points per group**.

**E. Roadmap** (`ee166bd`): P4a → P5b → P3d(de/it/pt) → P4b (with Hán-Việt from Unihan `kVietnamese` +
reviewed overrides, a concept card per course, a lint rule) → P4c–f → rest of P5 → P6
(`plan/08-ROADMAP.md`, `plan/STATUS.md`).

Gates (local, Windows, after the bot commit): typecheck ✅ · lint ✅ · `bun run test` 1,538 pass ✅ ·
`content:check` ✅ · `audio:check` ✅ (1,721 baseline files, size gate) · goldens ✅ (re-blessed with reasons;
French unchanged).

## D. RC4
Recorded in `release/RC_HISTORY.md` and `release/DEVICE_ACCEPTANCE.md` once built and tested.

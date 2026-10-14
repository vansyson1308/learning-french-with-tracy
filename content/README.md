# `content/` — authored sources and how to add a language

Everything learners see is authored here and compiled by
`bun run content:compile` into `src/content/**`, `assets/lexicon/*.db` and
`content/reports/**`. Generated files are committed and drift-guarded
(`bun run content:check`); never edit them by hand. The schema is
`content/schema.ts`; `bun run content:validate` runs every rule.

Since P1c the pipeline is language-neutral: the compiler discovers every
**target language** from the course packs and the `content/<code>/` folders
and loops over them. Nothing in `scripts/` or `src/` names a language —
French is just the first target that has every layer.

## Layout

```
content/
  courses/<target>-<native>.json      one course pack per (target, native) pair
  courses/<id>.profile.json           optional capability overrides (P1b)
  <target>/lexemes.json               frozen surface → `<target>:w:<slug>` ids (persisted in learner data)
  <target>/lexicon/lexemes.json       rich lexicon (glosses, examples, pronunciation, frequency…)
  <target>/lexicon/source-manifest.json   external lexical source pin (optional; Lexique 4 for French)
  <target>/lexicon/match-overrides.json   §15 manual dispositions (optional)
  <target>/pedagogy/concepts.json     Continue-only teaching cards
  <target>/pedagogy/paradigms.json    grammar tables (cells declared by the language plugin; optional)
  <target>/assessment/objectives.json, claim-policy.json, attainment.json,
                      checkpoints.json, placement.json, RESEARCH.md
  <target>/reception/reading.json, listening.json, audio-source-manifest.json, audio-canary.json
  <target>/speech/items.json
  <target>/writing/tasks.json
  <target>/interaction/scenarios.json
  sources/registry.json               provenance for every source, voice, model and library
  audio/                              pack-audio manifest, baseline, model cards
  reports/                            generated reports (French at the root, other languages under reports/<code>/)
```

Every layer is optional: a course whose target language has only a pack
is a legacy-style course; each layer that exists switches on the matching
capability in the compiled course profile (`src/content/course-profiles.json`).

## Ids and native-language text

- Content ids are namespaced by target code: `<code>:w:<slug>` (lexemes),
  `<code>:concept:<slug>`, `<code>.obj.<area>.<slug>`, `<code>.clip.<slug>`,
  `<code>.read.<slug>`, `<code>.speak.<slug>`, `<code>.write.<slug>`,
  `<code>.scenario.<slug>`, `<code>.checkpoint.<slug>`, `<code>.cpi.<slug>`,
  `<code>.pstage.<slug>`, `<code>.pcluster.<slug>`, `<code>.pli.<slug>`.
  Exercise ids are `<courseId>:<unit>-<lesson>-e<n>` (the French pack predates
  the convention and is marked `frozenExerciseIds`).
- Every native-language string in `content/<target>/**` is a
  `Record<nativeCode, string>` (`{ "en": "…", "vi": "…" }`): lexeme
  `glosses`, example `translations`, concept prose and example notes,
  objective `title`/`canDo`, checkpoint `title`/`description`, placement
  stage `title`, reading glossary `gloss`, speech `prompt.instruction` and
  cue-fact `label`, writing `instruction`/cue labels/slot `description`,
  scenario `title`/`goal` and learner-turn `prompt`, paradigm `gloss`.
  The compiler resolves each course's native code and emits plain strings;
  a missing translation fails validation (never a silent fallback).
- Course packs (`content/courses/*.json`) are per course and stay plain
  strings in that course's native language.
- Example sentences compile to `{ "<target>": …, "<native>": … }` objects;
  the runtime resolves the two keys through the course profile.

## Adding a language `<code>`

1. **Pack.** `content/courses/<code>-<native>.json` with `targetCode`,
   `nativeCode`, `flag`, sections/units/lessons. Exercise ids must follow
   the convention above. If no licence-clean voice exists, set
   `"audio": { "policy": "device-tts", "reason": "…" }`.
2. **Plugin.** Optional `scripts/lib/languages/<code>.ts` (build) and
   `src/lib/languages/<code>.ts` (runtime). Without one the generic plugin
   applies: Latin folding, no gendered articles, no paradigm cells, no
   number speller. Declare `articleRules` (article → gender, elision rule),
   `paradigm` (cell ids, groups, evidence source and loader), `numberWords`,
   `functionWords`, `normalizeForAsr`, and register it in
   `scripts/lib/languages/index.ts` (`BUILD_LANGUAGES` facts: locales,
   script, flag asset) and `src/lib/languages/index.ts`.
3. **Flag.** `assets/images/flags/<flagAsset>.svg` (HatScripts circle-flags, MIT).
4. **Rich layers.** Add `content/<code>/lexemes.json` + `lexicon/lexemes.json`
   first (stable ids, glosses, examples); then pedagogy, assessment
   (objectives + claim policy + attainment + checkpoints + placement +
   RESEARCH.md documenting every `sourceRef` used), reception, speech,
   writing, interaction. Each layer's validator rules are listed in
   `plan/03-AUDIT-CONTENT.md` §5 and enforced by `content:validate`.
5. **Registry.** Every source backing the content goes into
   `content/sources/registry.json` with an allowlisted licence and a
   `covers` path; it surfaces in `ATTRIBUTIONS.md` and the Licences screen.
6. **Audio.** Pack audio: `scripts/pack-audio.ts` (manifest in
   `content/audio/`). Reception clips: `content/<code>/reception/audio-source-manifest.json`
   (pinned voices, licence gate), then the dispatch-only workflow
   `reception-audio.yml` with `lang: <code>`; `bun scripts/reception-audio.ts plan --lang <code> --mode generate --dry-run`
   validates offline. Generated clips live in `assets/audio/<code>-reception/`.
7. **Compile.** `bun run content:validate && bun run content:compile`, commit
   the generated outputs. The French goldens (`bun scripts/golden.ts --check`)
   must stay green — a new language never changes French artifacts.

## The synthetic test language `xx`

`content/xx/` + `content/courses/xx-en.json` is a two-word invented
language whose only purpose is to prove that every validator and the
compiler run for a non-French target. Its pack is `testOnly` with the
`test-only` audio policy (0.5 s generated tones, `bun scripts/test-tone.ts --lang xx`);
it compiles into `src/content/test-only/**` and `content/reports/xx/`,
is never bundled, never listed in the catalog, never in the audio
baseline, and its registry source is marked `testOnly` so it is never
attributed in the app. `integration-tests/test-language.test.tsx` loads
its artifacts through the real course registry.

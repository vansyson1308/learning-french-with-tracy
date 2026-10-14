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

## A second native language for a target (`fr-vi` from `fr-en`, P2b)

A target language can have one course per native language. The TARGET
corpus is authored once (`content/<target>/**`: lexemes, clips, speech,
writing, scenarios, objectives, checkpoints, placement) and every
native-language string is a `Record<nativeCode, string>`; the course packs
differ only in their native text. Producing the Vietnamese-native French
course:

1. **Extract** — `bun scripts/translate-native.ts extract --from en --to vi --target fr`
   walks every native field of `content/fr/**`, the assessment exercises
   (see `scripts/lib/native-fields.ts` for the per-exercise-type table of
   native paths) and the pack `content/courses/fr-en.json`, and writes two
   draft files: `content/fr/translations/vi.dictionary.json` (one entry per
   distinct source text — short strings) and `content/fr/translations/vi.jsonl`
   (one record per key for guidebooks, concept prose and the structured
   word-bank / typed-answer records that must be re-authored, not token-shuffled).
   The owner fills the drafts (Claude prompt template, register and glossary in
   `plan/authoring/TRANSLATION-STYLE-vi.md`); the repository itself never calls
   a network service. `status` reports what is still missing.
2. **Apply** — `… apply …` fails closed on any missing draft, then adds the
   `vi` keys in the shared `content/fr/**` files, attaches
   `exerciseNative.vi` overlays to assessment items (the exercise payload of
   checkpoints and placement stays authored in `exerciseNativeCode`, default
   `en`; a secondary native language is an overlay of native-text paths),
   writes the pack `content/courses/fr-vi.json` (section and unit ids are
   target-level and kept; lesson and exercise ids are rewritten to the
   `fr-vi:` prefix with the 1:1 map in `content/courses/fr-vi.map.json`, flows
   remapped), and the native review sheet `content/fr/REVIEW-vi.md`.
3. **Validate** — besides the per-language rules, `content:validate` checks:
   every native field carries every native code used by a course of the
   target (no silent fallback); the secondary course has the same sections,
   units, words, lessons, objectives and exercise types as the primary one
   (`stripNative` comparison; word-bank token arrays may differ in length);
   placement anchors resolve in each course (`placementForCourse` re-points
   `<primary>:` lesson ids); pack audio keys resolve against the primary
   course's manifest (the audio is the target language's, recorded once).
4. **Compile** — the primary native language of a target is its smallest
   native code (`en` for French, so `fr-*` artifact names and the French
   goldens are unchanged); a secondary course gets its own native-dependent
   artifacts prefixed by the course id (`fr-vi-index.json`,
   `assets/lexicon/fr-vi-lexicon-v3-<hash>.db`, `fr-vi-placement.json`, …) and
   shares the target-level ones (`fr.json` ids, attainment, claim, listening,
   clip assets). The lexicon content hash is taken over the NATIVE VIEW of the
   lexicon (`lexiconNativeView`), so adding `vi` glosses never changes the
   `fr-en` database. The course profile records `audioCourseId: "fr-en"` so the
   runtime plays the primary course's pack audio. The claim gate stays per
   target and lists the courses that inherit it.
5. **Learner data (D-4)** — FSRS cards are keyed by target language
   (`cards (target_code, item_id, skill)`, course recorded as provenance),
   the review log stays per course, and the assessment record (checkpoints,
   placement) is per target (`assessmentByTarget`, persist v5). A review in
   `fr-vi` moves the card `fr-en` sees.

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

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

## Lexicon ETL v2 (P3a): deriving `content/<code>/lexicon/` from open sources

One generic, fail-closed derivation produces the lexical evidence of any
target language from the open sources catalogued in
`scripts/lib/lexicon-etl/sources.ts` (kaikki.org Wiktextract — English and
Vietnamese editions —, FrequencyWords, wordfreq, Tatoeba, and per language
JMdict / CC-CEDICT / OpenJLPT / hsk30 / CEFR-J / NGSL):

1. **Acquire** (never in CI): dispatch `.github/workflows/lexicon-source.yml`
   with `lang` and `mode` (`recon` pins every artifact's sha256/bytes/date
   into `content/<code>/lexicon/source-manifest.json` — a v2 multi-source
   manifest — and captures the licence notes under `sources/`; `extract`
   verifies the pins and derives; `both` for first contact), or run
   `bun scripts/lexicon-etl.ts fetch|recon|extract --lang <code> --dir <scratch>`
   locally. Raw dumps (0.2–3.3 GB) are streamed and discarded; small
   artifacts are kept as workflow run artifacts for audit. A retrieval that
   does not hash to the pin is source-version drift and `extract` refuses.
2. **Derived evidence** (`content/<code>/lexicon/derived/`, committed):
   `candidate-pool.json` (top lemmas by measured frequency + every
   course-pack word, with en/vi glosses, IPA, gender, examples, topics,
   anchors, readings), `frequency-stats.json` (population quantiles → bands
   exactly as French), `morphology.json` (verb forms → paradigm atoms),
   `gender-stats.json`, `anchors.json` (exam/CEFR levels, or the honest
   `frequency-derived` record), `readings.json` (ja/ko/zh),
   `tatoeba-credits.json`, `recon.json`; for English also `vi-bridge.json`
   (English lemma → Vietnamese translations) which other languages may use
   to draft a Vietnamese gloss from an English sense (flagged for review).
3. **Author** (offline, deterministic): `bun scripts/lexicon-author.ts --lang <code> --size N`
   selects pack words first, then anchor-listed lemmas, then the frequency
   population under a per-topic quota, and writes `content/<code>/lexemes.json`
   (frozen ids), `content/<code>/lexicon/lexemes.json` and `REVIEW.md`
   (every `TODO:vi`, bridged gloss, auto-confusable, untranslated example).
   `--size 0 --pool-only` writes the review statistics only.
4. **Validate / compile** as for any language: the lexicon validators add
   the P3a rules — every native language a course of the target is taught
   in needs a gloss and example translations on every lexeme, `TODO:`
   markers are never glosses, a lexeme may cite only retrieved manifest
   sources, `frequency` cites the manifest's frequency source only, and
   every cited source is registered with an allowlisted licence.

## Audio pipeline v2 (P3b): pack, lexicon and reception audio for any language

One dispatch-only workflow (`.github/workflows/audio.yml`) synthesises,
audits and applies audio with any licence-gated engine — Piper (MIT engine,
per-voice dataset licence), Kokoro-82M (Apache-2.0) or MeloTTS (MIT):

- `content/audio/engines.json` — engine, model and ASR pins, the licence
  gate (allow CC0 / CC BY 4.0 / CC BY-SA 4.0 / Apache-2.0 / MIT; deny
  GPL/NC/ND/RAIL/unknown), loudness target, encoding.
- `content/audio/voice-casts.json` — candidate voices per language and the
  selected cast `{A, B}` with the canary results (`pending-canary`,
  `selected`, `no-clean-voice`).
- `content/audio/pack-audio-manifest.json` (v2) — pins of every voice
  (`engine` per voice), per-course `voiceCast`, per-language
  `pipelineVersions` (French frozen at 1; others 2 = loudness-normalised).
- `content/<code>/reception/audio-canary.json` — 12 language-specific traps
  every candidate voice must render before anything ships;
  `audio-source-manifest.json` (v2, `engine` per voice) for the listening
  clips of a language that has them.
- Layers: `pack` (every string a course pack speaks), `lexicon` (every
  lexeme surface and example of `content/<code>/lexicon/lexemes.json`, keyed
  by the language's primary course), `reception` (listening clips).
- Steps: `recon` (double download, gate, pin) → `canary` (synthesise the
  canary × every eligible candidate, ASR audit — Whisper, or SenseVoice for
  zh/ja/ko (not vi: the model has no Vietnamese), CER for ja/zh — select
  the cast, register the voices) →
  `generate` (strict technical QA with the plugin's `charsPerSecBand`,
  per-language merge of `src/content/audio-manifest.ts` and
  `assets/audio/<code>/`, re-bless `content/audio/baseline/<code>.json`).
- Offline: `bun scripts/audio.ts plan --lang <code> --layer all --mode generate --dry-run`.

## Authoring a course (P3c toolkit)

A full French-parity course is authored **from Vietnamese** with Claude's
help, step by step, where every generated artifact is a draft that the
deterministic validators and a native review must approve before compile:

1. `plan/authoring/BLUEPRINT.md` is the template (the French shape and
   counts), `plan/authoring/STYLE-vi.md` the Vietnamese prose rules,
   `plan/authoring/GLOSSARY.md` the grammar terms, and
   `plan/authoring/briefs/<target>-vi.md` the pedagogy brief injected into
   every prompt (what Vietnamese speakers find hard, exams, scenarios).
2. `bun scripts/author.ts emit <step> --target es --native vi` writes
   `content/es/_drafts/<step>/PROMPT.md` + `INPUT.json` (task, blueprint
   slice, brief, style, the record's JSON schema from zod, allowed ids,
   French exemplars that already carry Vietnamese). A Claude session answers
   with `OUTPUT.jsonl` in the same folder; `bun scripts/author.ts ingest
   <step> --target es --native vi` validates every record, merges the valid
   ones into the authored file, runs the validators and writes `REPORT.md`
   (pass/fail per record) — repeat until the report is clean.
3. Steps and the sessions they take: `objectives` (1) → `units` (1; the
   draft pack `_drafts/pack.json` with lesson stubs) → `lexicon-review`
   (2–3; fills `TODO:vi`) → `lessons` (3–4; the real pack is written once
   every lesson has exercises) → `concepts` (1–2) → `readings` (1) →
   `listening` (2) → `speech` (1) → `writing` (1) → `scenarios` (2) →
   `checkpoints` (2) → `placement` (1). `bun scripts/author.ts steps` lists them.
4. `bun scripts/author.ts lint --course <id>` runs the quality linters
   (answer-position balance, duplicate payloads, distractor plausibility,
   guidebook length, exercise-type mix vs the blueprint, lexeme coverage,
   CEFR-descriptor leak, reading-level caps) — advisory, the validators gate.
5. `bun scripts/author.ts checklist --course <id>` writes
   `content/<target>/REVIEW-CHECKLIST.md` (every learner-facing string).
   The **review gate**: a course whose native language is not the original
   English compiles only when `content/courses/<id>.profile.json` records
   `review: { native, date }` or `allowUnreviewed: true` together with an
   entry naming the course in `release/KNOWN_LIMITATIONS.md` (beta content
   ships honestly, never silently).
6. **Staging (P3d).** While a course is being built (no
   `content/courses/<id>.json` yet, or `content/<lang>/_drafts/staged/`
   exists), `ingest` writes every authored file under
   `content/<lang>/_drafts/staged/<repo path>` instead of `content/`, and
   `emit` / `ingest` / `lint` / `checklist` see the staged layer overlaid on
   the real tree for the duration of the command (the real tree is restored
   byte for byte). The repository therefore stays green between sessions
   even though objectives, lessons, checkpoints and placement only validate
   together. `bun scripts/author.ts promote --target <lang>` moves the layer
   into `content/` once the whole repository validates with it; then run
   `bun run content:compile`. `--direct` writes straight into `content/`.
7. `bun scripts/author.ts selftest --target xx --native en` proves the
   toolkit end-to-end on the synthetic language (every committed record
   round-trips through its step schema). `_drafts/` folders are committed
   (they are not part of the app bundle); the `xx` self-test output is ignored.

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


# Engineering audit: learning-french-with-tracy (Expo SDK 57 / RN 0.86.3 / React 19.2.3)

Repo root: `/home/claude/learning-french-with-tracy`. Every claim below comes from reading the files; line numbers are true file lines.

## 0. Executive summary

- **What it is.** A local-first Expo Router app (zustand plus AsyncStorage, expo-sqlite for a read-only lexicon only, ts-fsrs 5.4.1). It carries 8 inherited "Lingo Lessons" packs. Only `fr-en` gets the "excellence layer":
  - FSRS cards keyed by stable ids, with skills recognize, listen and speak
  - the TODAY composer
  - lexicon browser, concepts, conjugation
  - reception (listening/reading with Piper audio)
  - speech (device ASR) and writing rubric
  - deterministic conversations
  - checkpoints, placement and the A1 estimate
- **How French is wired in.** The layer is **not abstracted per language**. It hangs off about 60 hardcoded `"fr-en"` / `FR_COURSE_ID` branches across about 25 runtime files.
  - French artifacts are statically imported (`src/content/*/fr-*.json`).
  - zod schemas pin `language: z.literal("fr")` and `fr.`-prefixed id regexes.
  - The build validators forbid French-only exercise types and metadata in any other course.
- **Persistence.**
  - One AsyncStorage key `progress-v2`, persist version 3.
  - Per-course: xp, completedLessons, mistakes, wordStats, plus `srs` (legacy SM-2) for non-French courses or `cards` (FSRS) for French only.
  - **Global, not per course:** assessment state (checkpoints, placement, placementFloor), reviewLog, streak and daily XP.
  - SQLite holds only the immutable French lexicon DB.
- **UI language and i18n.**
  - UI is English-only with no i18n layer (316 `<Text` usages, plus English strings inside lib modules).
  - The "native language" is also baked into the content: English options, instructions, glosses, guidebooks, can-do statements and rubric descriptions.
  - So a Vietnamese-native course means new content packs (e.g. `fr-vi`), not just UI translation. Every `=== "fr-en"` check would then break.
- **Engineering quality.** Very high for the French layer: pure engines, extensive tests (~1,170 bun tests, 69 jest), deterministic compile with a drift guard, provenance and license gates.
- **The 7 other courses are thin**: 5 units / 20 lessons (es: 10/40), 5 exercise types, 60 words, legacy SM-2. it, ja, ko and zh have no bundled audio (device TTS).

---

## 1. Architecture map

### 1.1 Stack and config

- `package.json`
  - Scripts: `test` = `bun test src scripts`; `test:integration` = jest (integration-tests only).
  - Content: `content:validate|compile|check`, `audio:check`, `release:identity`.
  - E2E: `e2e:web|guide|screens`.
  - Lexicon: `lexicon:*`.
  - No i18n, no network libraries. zod is a devDependency only (validation is build-time, never shipped).
- `app.json`
  - name "Learning French with Tracy", id `com.vansyson1308.learningfrenchwithtracy`, `typedRoutes` and `reactCompiler` experiments on.
  - Android permissions: RECORD_AUDIO and MODIFY_AUDIO_SETTINGS only; `allowBackup: false`.
  - Plugins: expo-speech-recognition with French-specific permission strings ("practice speaking French"); expo-audio with no background playback.
- `bunfig.toml` preloads `src/lib/__tests__/setup.ts` (native mocks) and loads `.mp3` as file.
- `jest.config.js` uses the jest-expo preset over `integration-tests/` and maps reanimated to mocks.
- `eas.json` and `release/identity.json` feed the identity gate.

### 1.2 Routes (`src/app`)

| Route | File | What it does | Course scope |
|---|---|---|---|
| Root stack | `_layout.tsx` | Holds the splash until zustand hydrates (`useSyncExternalStore` on `persist`). Redirects to `/onboarding` if `!onboardingDone && !hasProgress`. Declares the modal/fullScreenModal presentations. Sets ReducedMotion to System. | all |
| `(tabs)/_layout.tsx` | tabs | Learn, Today, Practice, Profile. The Today tab is hidden via `href: null` unless `courseCapabilities(activeCourseId).dailySession` (lines 13, 46). | Today is fr only |
| `(tabs)/index.tsx` (Learn/PATH) | | Duolingo-style path: course flag picker, streak, XP, daily-goal bar, sections, unit banners with guidebook button, lesson nodes (completed / cleared / current / locked / crown). | Placement entry card (59-62), placement floor (48-49) and CheckpointCard per section (187-195) are hard-gated `activeCourseId === "fr-en"` |
| `(tabs)/today.tsx` | | TODAY preview (composer dry run) with short/regular/long presets and a "Can't speak now" toggle. Redirects home without the capability. | fr |
| `(tabs)/practice.tsx` | | Daily quests, Spaced review (FSRS for fr, SM-2 otherwise), Mistakes, word list with strength bars. | Listening review, Speaking review, Writing practice and Conversation practice cards gated `isFrench` (line 31: `activeCourseId === FR_COURSE_ID`). Vocabulary card gated by the `lexicon` capability. |
| `(tabs)/profile.tsx` | | Course card and switch, 7-day streak calendar, stats grid, theme (system/light/dark), backup export/import (`DataCard`), links to privacy and licenses. | "Your French goals" entry gated `activeCourseId === "fr-en"` (line 151) |
| `onboarding.tsx` | | Course grid (`orderedCourses`), daily XP goal (10/20/30/50), CTA "Learn {targetLanguage}". **Default selection is `DEFAULT_COURSE` = `"es-en"`** (lines 15-19, via `store.ts:30` and `migrations.ts:39`), so a French-branded app preselects Spanish. The e2e clicks "French" explicitly (`e2e/smoke-web.mjs:74`). | all |
| `courses.tsx` | modal | Course switcher showing lessons done per course; "Progress is saved per course". | all |
| `lesson/[id].tsx` | fullScreenModal | Thin adapter that builds a `SessionDefinition` once from a store snapshot. Magic ids: `mistakes`, `srs`, `srs-listening`, `srs-speaking`, `writing-practice`, `conversation`, otherwise a pack lesson id. | srs-listening/speaking/writing/conversation build FR-only definitions with no course guard (deep-linkable from any course) |
| `session/today.tsx` | fullScreenModal | Freezes a TODAY plan (`composeTodayFromSnapshot`), stats summary, `remainingBacklog: dueFrenchReviewQueue` (line 109). Redirects without the capability. | fr |
| `checkpoint/[id].tsx` | fullScreenModal | Scored checkpoint: speech pre-gate (`frenchRecognitionAvailable`, 76-78), network disclosure, results. `targetLanguage="French"` (190). | fr only by content; **no course guard** |
| `placement/intro.tsx` | modal | "Have you studied French before?" | fr; no guard |
| `placement/run.tsx` | fullScreenModal | Staged diagnostic. `useCourseContent("fr-en")` (90), `targetLanguage="French"` (166). | fr; no guard |
| `goals.tsx` | modal | Objectives grouped by evidence state, A1 estimate, placement reset. `useCourseContent("fr-en")` and `progress.courses["fr-en"]` (94-95). | fr; no guard |
| `vocabulary/index.tsx`, `vocabulary/[id].tsx` | stack | Lexicon browser and detail (SQLite native, JSON web fallback). Read-only to learner state. Redirect if `!lexicon` capability (102 / 57). | fr |
| `guidebook/[unitId].tsx` | modal | Renders `unit.guidebook` with an in-house markdown subset (`lib/guidebook-markdown.ts`). | all |
| `licenses.tsx` | modal | MIT lineage, Lexique 4 text, audio provenance, `src/content/attributions.json`, French lexicon section. | static French text |
| `privacy.tsx` | modal | Renders `lib/privacy-policy.ts`. | all |

### 1.3 `src/lib` modules

**Core and state**
- `store.ts` (519 lines)
  - zustand + persist (AsyncStorage key `progress-v2`, `version: PERSIST_VERSION`, `migrate: migrateProgress`).
  - Actions:
    - `completeLesson` (XP 15, +5 for perfect; replays count as a session only)
    - `recordPracticeSession`, `completeTodaySession` (XP capped at 15)
    - `addMistake` / `clearMistake`
    - `submitEvidence` (the single evidence path, routed by **`state.activeCourseId`**, not by the definition's courseId; line 353)
    - `undoLastFrenchReview` (FR only, 370-405)
    - `recordCheckpointAttempt`, `setPlacementResult`, `resetPlacement`, `acknowledgeSpeechNotice`, `setActiveCourse`, `finishOnboarding`
  - Legacy `recordWord` / `reviewSrsWord` remain only for the parity tests.
  - Selectors: `currentLessonIndex` (placement floor aware), `currentStreak`, `dailyQuests` (English labels in code, 481-502), `lastSevenDays`, `dueSrsWords`.
- `content.ts`: catalog, `orderedCourses` (by unitCount desc), `getPack`, `useCourseContent` (module-level cache of the lesson index, lesson lookup, `allWords`).
- `types.ts`: runtime mirror of `content/schema.ts`.
- `capabilities.ts`: `FLAGS = { "fr-en": { dailySession: true, lexicon: true } }` (16-18). This is the only intended rollout seam, and it covers just 2 of roughly 10 French features.
- `theme.ts`: light/dark palettes, `radius`, `unitPalette`, `makeThemedStyles`.
- `navigation.ts` (`exitScreen`), `dates.ts` (local-day strings, UTC-to-local grandfathering), `haptics.ts`.
- `audio.ts`
  - `speakTarget(courseId, text)` plays the bundled `audioManifest["<courseId>:<text>"]`, otherwise falls back to expo-speech with `TTS_LOCALES[pack.targetCode]` (14-23).
  - Also `stopSpeechPlayback`, `restorePlaybackAudioMode`, `useSfx`.
- `grading.ts`
  - `normalize` (apostrophes, NBSP, lowercase, **NFD accent stripping**, œ/æ, punctuation).
  - `strictFrenchEquals` (accents kept) for conjugationCloze and dictation.
  - `checkAnswer` / `correctAnswerText` / `answerIsReady` for all 15 types; delegates speech to `speech/grader` and writing to `writing/rubric`.
- `exercise-registry.ts`: `EXERCISE_BEHAVIOR` for all 15 types (isReady, check, answerText, modality, selfAdvancing). Its header still says "five exercise types" (stale).
- `review-builder.ts`: FNV hash, mulberry32 `seededRng`, `buildSrsExercises` (default `courseId = "fr-en"`, line 49).
- `srs.ts`: legacy SM-2 (`reviewWord`, `isDue`).
- `guidebook-markdown.ts`: in-house markdown subset parser.
- `privacy-policy.ts`: the single-source policy text (states the app makes no network requests; the tutor is disabled).
- `backup.ts` and `persistence/backup-core.ts`: see §7.
- `persistence/migrations.ts`: see §7.

**Learning engine (`lib/learning`)**
- `engine.ts`
  - `itemIdForCourse` (fr gets stable ids; others the raw surface; line 31).
  - `applyEvidence` (line 200): fr goes through `applyFrench` (gate, FSRS mutation, review log); everything else through `applyLegacy` (exact SM-2 translation).
  - `dueFrenchReviewQueue(cards, now, skill)` (~237) resolves only curated ids via `FR_SURFACE_FOR_ID`.
  - `frCardForSurface`, `frMemoryStrengthPercent`.
- `ids-fr.ts`
  - `FR_COURSE_ID = "fr-en"` (21).
  - `FR_LEXEME_IDS`: a hand-maintained 126-entry surface → `fr:w:<slug>` map (28-161). It must equal `content/fr/lexemes.json`, which the pipeline drift-checks.
  - Also `FR_LEGACY_PREFIX`, `frItemIdFor`, `isCuratedFrItemId`, `FR_SURFACE_FOR_ID`.
- `card-key.ts`: `SKILLS = ["recognize","listen","speak"]`; serialized `${itemId}|${skill}`.
- `scheduler.ts`: the port. `fsrs-adapter.ts` is the only ts-fsrs importer (known-vector self-check, fail closed). `legacy-adapter.ts` (LegacySchedulerAdapter) is **unused in production** (tests only).
- `fsrs-defaults.ts` (FSRS-6 params pinned), `sm2-migration.ts` (SM-2 to FSRS estimate, pure).
- `evidence.ts` (ReviewEvidence type) and `evidence-gate.ts` (only `assessment` mutates; one mutation per card per session; refuses hinted/assisted).
- `review-log.ts`: ring buffer, `REVIEW_LOG_CAP = 10_000`; `lastMutationIndex(log, courseId)`.
- `today.ts`: the TODAY composer (warm-up due cards, new teach+retrieve from the PATH frontier, mixed, finale match; listen/speak budgets). FR-hardcoded at 32, 190, 329, 378.
- `distractors.ts`: tiered smart distractors. `metaFor` returns undefined unless fr (43).
- `lexicon-index.ts`: sync accessor over `fr-index.json`; `articleCueFor` hardcodes le/la/l'.
- `lexicon-search.ts`: French fold (œ/æ, diacritics).
- `concepts.ts`: `conceptFor(id)` over `fr-concepts.json`, with no courseId parameter.
- `french-numbers.ts`: French 0-100 spelling, used by `speech/grader` and the build validator.

**Session (`lib/session`)**
- `types.ts`: SessionDefinition (kind, courseId, steps, completion, evidenceSource, trackMistakes, allowUndo, retryPolicy, feedbackPolicy, assessment).
- `reducer.ts`: the pure queue/retry/first-attempt machine.
- `controller.ts`: side effects (sfx, haptics, evidence submit at line 201, `speakTarget(definition.courseId, …)` at 215, completion policy 101-120, undo 287).
- `timing.ts`: active-time latency.
- `sources.ts`: builders for path, mistakes, review (fr FSRS vs legacy, 122), listening review, speaking review, writing practice, conversation practice, checkpoint, placement stage. Most hardcode `FR_COURSE_ID` / `"fr-en"`.
- `evidence.ts`: `evidencePlanFor` (FR checks at 55, 63, 75, 93, 102), `buildCheckEvidence`, `buildMatchWordEvidence`.
- `panel.ts`: post-answer panel identity (curated FR ids only).

**Assessment (`lib/assessment`)**
- `types.ts` (persisted CheckpointAttempt and PlacementResult; `CHECKPOINT_ATTEMPTS_KEPT_PER_ID = 5`).
- `content.ts` (imports the 5 `fr-*` artifacts).
- `checkpoint.ts` (scoring, `selectCheckpointForm` rotation), `placement.ts` (deterministic staged engine), `states.ts` (objective state precedence), `estimate.ts` (A1 estimate, claim split), `option-order.ts` (seeded MCQ shuffling).

**Speech (`lib/speech`)**
- `types.ts`: `FRENCH_LOCALE = "fr-FR"` (9); SpeechCapability with French-named fields (`frenchRecognitionAvailable`, `frenchOnDeviceModelInstalled`).
- `recognizer-port.ts` (the port), `expo-adapter.ts` (expo-speech-recognition; `isFrench = l.startsWith("fr")` at 182-191).
- `attempt-machine.ts`, `use-speech-attempt.ts` (locale default `FRENCH_LOCALE`, 211), `use-speech-session.ts`.
- `step-policy.ts` (practice vs production rules), `grader.ts` (deterministic; French digit→word via `frenchNumber`, whitespace tokenisation), `speech-cache.ts` (attempt audio in cache only, swept), `content.ts` (`fr-speech-items.json`).

**Reception (`lib/reception`)**
- `content.ts` imports `fr-listening.json`, `fr-reading.json` and `RECEPTION_CLIP_ASSETS`; provides `clipFor` and `listenWordClipIndex`.
- `listening-player.ts` (pure play-budget reducer), `use-listening-player.ts` (expo-audio adapter).

**Writing (`lib/writing`)**
- `content.ts` (`fr-writing.json` plus `knownFrenchVocabulary`).
- `rubric.ts` (tri-state rubric: `FRENCH_SHARE_FLOOR = 0.5` at 127, English feedback strings, `normalizeWrittenFrench`).

**Interaction (`lib/interaction`)**
- `machine.ts`: authored finite graph; intents matched with the speech grader over n-best; repeat/rephrase support.
- `content.ts`: `fr-scenarios.json`; `interactionPracticeScenarios()` filters out reserved scenarios.

**Lexicon (`lib/lexicon`)**
- `provider.ts`: the generated repository (`fr-web-fallback.json`) is always available, then lazily upgraded to native SQLite.
- `native-loader.native.ts`: copies `FR_LEXICON_DB_ASSET` into `SQLite/`, verifies the `metadata.contentHash`, deletes stale `fr-lexicon-*.db`. `native-loader.ts` is the web stub.
- `native-sql.ts` (bound SQL, FTS5), `native-repository.ts`, `generated-repository.ts`, `types.ts`, `use-lexicon-repository.ts`.

**Tutor (`lib/tutor`)**: see §8.

### 1.4 `src/components`

- Shared: `duo-button.tsx` (3D button with `textTransform: "uppercase"`, line 78), `close-button.tsx` (44×44), `flag.tsx` (courseId → circle-flag SVG, 12-21), `speaker-button.tsx`.
- `session/`
  - `session-screen.tsx` (renders any SessionDefinition), `exercise-renderer.tsx` (single switch over 15 types, 149-292), `session-summary.tsx`, `post-answer-panel.tsx` (FR lexical detail)
  - `teach-card.tsx` (TODAY), `concept-card.tsx`, `listening-player-view.tsx`, `reading-passage.tsx`
- `exercises/` (one per type): select, word-bank, match, type-answer, fill-blank, article-select, conjugation-cloze, listening-comprehension, reading-comprehension, dictation, speak-repetition, speak-production, speak-record-control (permission flow, network disclosure), guided-writing, simple-form, interaction-scenario, option-card.
  - Several hardcode "French" in UI strings: guided-writing:43/69, speak-production:74, conjugation-cloze:50, dictation:45, simple-form:42, speak-record-control:186.
- `assessment/`: checkpoint-card (PATH entry), checkpoint-results, placement-results.

### 1.5 `src/content` (compiled, committed) and data flow

**Authored sources (`content/`):**
- `content/courses/<id>.json`: 8 packs.
- `content/fr/lexemes.json`: surface → id map, 126 entries.
- `content/fr/lexicon/`: `lexemes.json` (126 rich lexemes), `source-manifest.json` (Lexique 4 pinned sha), `match-overrides.json`, `derived/*` (Lexique-derived committed evidence), and REVIEW / ACQUISITION / LEXIQUE4_COLUMNS docs.
- `content/fr/pedagogy/`: `concepts.json` (17) and `conjugations.json` (8 verbs).
- `content/fr/assessment/`:
  - `objectives.json`: 34 objectives, 23 essential
  - `checkpoints.json`: 6 section checkpoints plus `a1-capstone` (20 items, 2 forms)
  - `placement.json`: v3, 4 stages, 28 items max
  - `claim-policy.json`, `attainment.json`
- `content/fr/reception/`:
  - `listening.json`: 177 clips; voiceCast A = siwis, B = upmc speaker 1
  - `reading.json`: 19
  - `audio-source-manifest.json`, `audio-canary.json`, `generated-plan.json`, model-cards
- `content/fr/speech/items.json`: 50, 22 reserved.
- `content/fr/writing/tasks.json`: 34, 16 reserved.
- `content/fr/interaction/scenarios.json`: 18, 10 reserved.
- `content/audio/`: `pack-audio-manifest.json`, `legacy-baseline.json`, model-cards.
- `content/sources/registry.json`: 10 sources with licenses.
- `content/reports/*`: generated.

**Pipeline:** `scripts/compile-content.ts`
1. Runs every validator (`validateContent`, `validateLexicon`, `validatePedagogy`, `validateAssessment`, `validateReception`, `validateSpeech`, `validateWriting`, `validateInteraction`; most get `frPack = content/courses/fr-en.json`).
2. `compileAll()` (`scripts/lib/pipeline.ts:428`) emits:
   - `src/content/packs/<id>.json`. `compilePack` adds `gradeTargets` **only for fr-en** (`isFr`, 389-402).
   - `packs/index.ts`, `content/reports/grade-targets.json`, `ATTRIBUTIONS.md`, `src/content/attributions.json`.
3. Lexicon artifacts: `src/content/lexicon/fr-index.json`, `fr-web-fallback.json`, `db-asset.ts`, and `assets/lexicon/fr-lexicon-v2-<hash>.db`. The SQLite drift contract is a logical dump, plus integrity_check and foreign_key_check.
4. `src/content/concepts/fr-concepts.json`.
5. Assessment artifacts: `src/content/assessment/fr-{objectives,checkpoints,attainment,claim,placement}.json`.
6. Reception: `src/content/reception/fr-{reading,listening}.json` and `fr-clip-assets.ts` (177 clips → 166 unique mp3 requires).
7. `src/content/speech/fr-speech-items.json` (reserved items excluded), `src/content/writing/fr-writing.json`, `src/content/interaction/fr-scenarios.json` (includes reserved).
8. Reports: cefr-alignment, cefr-claim-gate, course-objective-coverage, placement-coverage, gender-patterns, reception-audio-census.
9. `--check` mode compares output and fails CI on any drift.

**Not compiled:**
- `src/content/catalog.json` is hand-maintained (unit/lesson counts are validated against the packs).
- `src/content/audio-manifest.ts` is generated by `scripts/pack-audio.ts apply`, not by the compiler (544 entries: de 95, es 189, fr 164, pt 96; it/ja/ko/zh 0).
- **`src/content/pack.json` (340 KB) is a dead legacy file.** It is an old es-en pack in an obsolete schema (`course`, `fromLanguage`) that nothing imports. Delete it.

**Runtime:** `lib/content.ts` reads `PACKS` and `catalog`. The French layer modules each import their own `fr-*` artifact statically.

---

## 2. French coupling audit

Each entry gives the location, what it does, and what generalising to `courseId` / `targetCode` would take.

### 2.1 Identity and ids

1. **`src/lib/learning/ids-fr.ts:21-196`**: `FR_COURSE_ID`, the hand-maintained `FR_LEXEME_IDS` (126 entries), `fr:w:` and `fr:legacy:` prefixes, `frItemIdFor`, `isCuratedFrItemId`, `FR_SURFACE_FOR_ID`.
   - Generalise: a per-course `LexemeIdRegistry` generated by the compiler from `content/<lang>/lexemes.json`, e.g. `ids/<courseId>.json` (`{prefix:"vi:w:", map}`), behind an interface `itemIdFor(courseId, surface)`, `surfaceFor(courseId, id)`, `isCurated(courseId, id)`.
   - Retire the hand-maintained TS map; it currently exists only because of the drift check at `scripts/lib/pipeline.ts:~236-251`.
   - Ids are persisted in learner data, so `fr:w:*` must never change.
2. **`content/schema.ts`**: French-literal ids everywhere.
   - `objectiveId` `^fr\.obj\.` (29), `conceptId` `^fr:concept:` (350), `lexemeId` `^fr:w:` (444).
   - Clip/reading/speech/writing/scenario/checkpoint/placement ids all use `^fr\.` (166, 181, 195, 210, 284, 326, 878-879, 956-958, 1015-1016, 1127, 1229).
   - `language: z.literal("fr")` in RichLexicon (550), PedagogyConcepts (649), Conjugations (675), CourseObjectives (796), Attainment (867), Checkpoints (947), Placement (996), Readings (1076), Listening (1109), SpeechItems (1205), WritingTasks (1261), InteractionScenarios (1337).
   - `recognitionLocale: z.literal("fr-FR")` (1194).
   - `SpeakProductionExercise.evidenceLexemeRefs` regex `fr:w:` (235). `LexemeExampleSchema {fr,en}` (496), `ConceptExampleSchema {fr,en}` (619).
   - `CONJUGATION_CELLS` (104) are French présent/participle cells; `ConjugatedVerb.auxiliary: avoir|être`.
   - Generalise: parameterise by language code (`${lang}\.obj\.`), `language: z.string()` with a cross-check against the pack's `targetCode`, `recognitionLocale` as BCP-47, example fields `{target, native}`, and language-specific grammar schemas (conjugation cells per language, or a generic paradigm table).
3. **`src/lib/learning/card-key.ts`**: language-neutral and fine.

### 2.2 Learning engine and store

4. **`engine.ts:31`** `itemIdForCourse` (fr gets stable ids, others raw surface); **:200-215** `applyEvidence` routes fr to FSRS and others to legacy; **:191 (baseLogEntry FR_COURSE_ID)**; **~237** `dueFrenchReviewQueue` uses `FR_SURFACE_FOR_ID`; **~266** `frCardForSurface`.
   - Generalise: route on a capability `scheduler: "fsrs" | "legacy"` and resolve surfaces through the per-course id registry.
   - A new language should start on FSRS directly; there is no SM-2 history to migrate.
5. **`store.ts:16, 370-405`**: `undoLastFrenchReview` hardcodes `FR_COURSE_ID`. **:353** `submitEvidence` keys on `activeCourseId` while sessions carry `definition.courseId`.
   - Generalise: `undoLastReview(courseId)`; pass `courseId` explicitly from the controller.
6. **`persistence/migrations.ts:26, 183-223`**: the v1→v2 migration touches only `courses["fr-en"]`. **:39** `DEFAULT_COURSE_ID = "es-en"` is used for the flat-legacy nest and as the store or onboarding default.
   - Keep the historical migration as is.
   - Add a new migration only if FSRS is enabled for existing legacy courses that have SM-2 data; the same `estimateFsrsCardFromSm2` can be reused per course.
   - Change the onboarding default to fr-en, or to the course matching the device locale.
7. **`persistence/backup-core.ts` runInvariants**: "fr-en stores cards, others srs; a course must have one of them". This is already course-agnostic in code; only the comments say fr.
8. **`review-builder.ts:49`**: default `courseId = "fr-en"`. Remove the default.
9. **`learning/distractors.ts:27, 43`**: `metaFor` returns undefined unless fr. Generalise to a per-course lexicon index lookup.
10. **`learning/lexicon-index.ts:10`**: imports `fr-index.json`; `articleCueFor` (72-78) hardcodes le/la/l'. Generalise to `lexiconIndexFor(courseId)` and a per-language `articleCue` strategy (de: der/die/das, es: el/la, it: il/lo/la/l', pt: o/a; none for ja/ko/zh/vi).
11. **`learning/today.ts:32, 190, 329, 378`**: composer steps tagged `FR_COURSE_ID`; surfaces via `FR_SURFACE_FOR_ID`. Generalise with a `courseId` input and the id registry.
12. **`learning/concepts.ts:8`**: `fr-concepts.json`, lookup not course-scoped. Generalise to `conceptFor(courseId, id)` (or rely on id prefixes plus a per-course artifact map).
13. **`learning/french-numbers.ts`**: French number speller used by `speech/grader.ts:18, ~51-56` (`digitsToFrench`) and the build validator (`pipeline.ts:97-120`). Generalise to a `numberSpeller(targetCode)` registry; Vietnamese numbers would need their own (e.g. mốt/một, lăm/năm, tư/bốn variants).

### 2.3 Sessions and evidence

14. **`session/sources.ts`**
    - `:122` review branch `courseId === FR_COURSE_ID`; `:157` `allowUndo: courseId === FR_COURSE_ID`.
    - `:187, :216` listening review; `:270` speaking review; `:325` writing practice; `:366` conversation (all `FR_COURSE_ID`).
    - `:436` checkpoint and `:503` placement (`"fr-en"` literal).
    - `:202` English question string "What do you hear?".
    - Generalise: pass `courseId` into every builder and resolve content via per-course content registries.
15. **`session/evidence.ts:22, 55, 63, 75, 93, 102`**: articleSelect, conjugationCloze, listening, speakProduction and select gradeTargets evidence only when `courseId === FR_COURSE_ID`. Generalise to `capabilities.fsrs` plus the course's id registry.
16. **`session/panel.ts:14`**: `isCuratedFrItemId`.
17. **`app/lesson/[id].tsx`**: the `srs-listening`, `srs-speaking`, `writing-practice` and `conversation` magic ids build FR definitions regardless of the active course (no guard).

### 2.4 UI gates (the non-French experience)

18. **`(tabs)/_layout.tsx:13, 46`**: Today tab via the capability (correct mechanism).
19. **`(tabs)/index.tsx:48-49`** placement floor; **59-62** placement entry card; **187-195** CheckpointCard. All are literal `"fr-en"`, which bypasses capabilities.
20. **`(tabs)/practice.tsx:18, 31-61, 107, 127, 149, 167`**: `isFrench` gates and French copy ("Browse every French word…" at 210).
21. **`(tabs)/profile.tsx:151`**: goals entry is literal fr-en.
22. **`goals.tsx:94-95`, `placement/run.tsx:90, 166`, `checkpoint/[id].tsx:76-78, 132-143, 190`, `placement/intro.tsx:32`**: hardcoded fr-en content and "French" copy; no course guard.
23. **`vocabulary/index.tsx:60, 102`, `vocabulary/[id].tsx:57, 71`**: capability-guarded, but they read the French-only lexicon provider.
24. **`components/flag.tsx:12-21`**: the courseId → flag map. A new course needs a flag SVG plus a map entry; should be derived from `catalog.flagAsset` or `targetCode`.
25. **`capabilities.ts:16-18`**: only `dailySession` and `lexicon`. Missing flags for placement, checkpoints, goals/A1, listeningReview, speakingReview, writingPractice, conversation, concepts, fsrs.

### 2.5 Audio and speech

26. **`audio.ts:14-23`**: `TTS_LOCALES` (no `vi: "vi-VN"`); keyed by `targetCode`. Add entries per new language.
27. **`speech/types.ts:9`** `FRENCH_LOCALE`; French-named capability fields (24-30); **`expo-adapter.ts:89, 182-191`** probes only "fr*" locales; **`use-speech-attempt.ts:211`** defaults to fr-FR.
    - Generalise: `probeSpeechCapability(locale)` with fields `targetRecognitionAvailable` and `targetOnDeviceModelInstalled`; pass `locale` from `pack.recognitionLocale`.
    - Memoised `probeSpeechCapabilityOnce` would need to be keyed per locale.
28. **`speech/grader.ts`**
    - French digit mapping.
    - Whitespace tokenisation (`tokens()`, `containsRun`) breaks for ja/zh, whose transcripts have no spaces. Needs a segmenter (`Intl.Segmenter`, whose Hermes support should be verified) or character-level matching.
29. **`lib/reception/content.ts:9-11`**: imports `fr-*` artifacts and `RECEPTION_CLIP_ASSETS`. Generalise to a per-course artifact registry; the static `require` maps per language must be generated (Metro needs static requires).

### 2.6 Writing and grading

30. **`writing/rubric.ts:127, 181`**: the "French share" plausibility floor uses `knownFrenchVocabulary()` (`writing/content.ts`, compiled from French lexicon and pack). English feedback strings ("Write your answer in French.", "I can only check French…").
    - Generalise: a known-vocabulary set per course and localised feedback keys.
31. **`grading.ts:119-139`**: `normalize` strips **all** combining marks (NFD), so a lenient match ignores accents.
    - Fine for typed answers in fr/es/de/pt/it.
    - For a Vietnamese target it would equate tone-distinct words (ma/má/mà/mả/mã/mạ). Tone-insensitive matching might be acceptable only as a "near miss" hint, not as correct.
    - `strictFrenchEquals` (148) is generic despite its name.

### 2.7 Lexicon runtime

32. **`lexicon/provider.ts:9`** (`fr-web-fallback.json`), **`native-loader.native.ts`** (`FR_LEXICON_DB_*`, `"fr-lexicon-"` prefix cleanup), **`content/lexicon/db-asset.ts`** (generated, French names), **`licenses.tsx:15, 58-78`**.
    - Generalise: `getLexiconRepository(courseId)` and one DB per language (`<lang>-lexicon-v<schema>-<hash>.db`). The cleanup logic must keep other languages' DBs.

### 2.8 Build pipeline (scripts)

33. **`scripts/lib/pipeline.ts`**
    - `:31` imports `FR_LEXEME_IDS`; `:97-120` French number-drill validation.
    - `:147-157` listening/reading/dictation forbidden outside fr-en; `:159-173` articleSelect forbidden outside fr-en with French elision regex.
    - `:236-251` lexemes drift check; `:384-413` gradeTargets only for fr; `:429` `FrLexemeMapSchema` on `content/fr/lexemes.json`.
34. **`scripts/lib/assessment.ts:333, 350`**: objectives and objectiveTargets are "French-only metadata (§153)".
35. **`scripts/lib/pedagogy.ts:81, 202`**: concept steps and conjugationCloze forbidden outside fr.
36. **`scripts/compile-content.ts:93-130, 163-310`**: every validator gets `frPack`; all output paths are `fr-*`.
37. **Speech, writing and interaction validators** (`scripts/lib/speech.ts:321`, `writing.ts:275`, `interaction.ts:238`) only mirror-check the fr pack. A speak/writing/interaction exercise in another pack would not be cross-checked; it would only pass the schema's `fr.` id regex.
38. **Hardcoded `content/fr/...` paths** (~40 string literals) across `scripts/lib/{lexicon,assessment,pedagogy,reception,speech,writing,interaction,lexique-derive-lib,lexicon-crosscheck}.ts` and `scripts/{lexique-derive,lexicon-import,lexicon-crosscheck,lexicon-source,lexique-recon,reception-audio}.ts`.
39. **`scripts/lib/lexicon.ts:55-66, 163-176`**: `splitSurfaceArticle` (le/la/l') plus gender/article consistency rules. These are French grammar rules in the validator.
40. **`scripts/reception-audio.ts:31-33`**: paths `content/fr/reception/*`. **`scripts/reception-asr-audit.py`**: French-only normalisation. (`scripts/audio-asr-audit.py` is language-aware.)

**Generalisation pattern for scripts:** a `languages/<code>/` plugin per target language (paths, article rules, number speller, normaliser) and `for (const course of coursesWithLayer)` loops.

### 2.9 What a non-French learner actually gets today

| Feature | fr-en | other 7 |
|---|---|---|
| PATH lessons (5 types: select, wordBank, match, typeAnswer, fillBlank) | yes, plus 10 more types | yes (5 types only) |
| Guidebooks | yes | yes (inherited) |
| Today tab and TODAY session | yes | hidden (capability) |
| Spaced review | FSRS (recognize) | legacy SM-2 |
| Listening, speaking, writing and conversation practice cards | yes | hidden |
| Vocabulary browser (lexicon) | yes | hidden |
| Placement entry, checkpoints, goals/A1 estimate | yes | hidden (literal fr checks) but deep-linkable |
| Concept steps, post-answer lexical panel, smart distractors | yes | no (fallback tier) |
| Bundled audio | Piper siwis plus reception clips | de/es/pt Piper; it/ja/ko/zh device TTS |
| Undo last review | yes | no |

---

## 3. Content schema and what a "complete" language needs

### 3.1 Pack shape (`content/schema.ts:366-431`)

- `Pack {id, version, targetLanguage, targetCode, nativeLanguage, nativeCode, flag, audio?: {policy: bundled|device-tts, reason?}, sections[]}`
  - `nativeLanguage` / `nativeCode` exist but **nothing in the runtime reads them**.
- `Section {id, title, units[]}`
- `Unit {id, title, description, guidebook (markdown), words[] {target, native, emoji, romanization?}, lessons[]}`
- `Lesson {id, title, exercises[], flow?: ({concept}|{exercise})[], objectives?: fr.obj ids}`
- Catalog (`src/content/catalog.json`): `{id, targetLanguage, targetCode, nativeLanguage, flag, unitCount, lessonCount}`, hand-maintained and count-validated.

### 3.2 Exercise types: 15 (schema 39-348; registry; renderer; components)

| Type | Key fields | French-only by validator? | Evidence |
|---|---|---|---|
| select | mode targetToNative/nativeToTarget/listen, prompt, audioTarget, options{text, emoji}, correct, gradeTargets (compiler), objectiveTargets | no | FSRS recognize via gradeTargets (fr) |
| wordBank | direction, tokens, answer | no | none |
| match | pairs | no | reinforcement only |
| typeAnswer | mode translate/listen/produceTarget, answer, alternatives | no | none |
| fillBlank | sentence, translation, options, correct | no | none |
| articleSelect | articles, noun, gloss, correct | **yes** | practice |
| conjugationCloze | sentence, translation, verb, cell (CONJUGATION_CELLS), answer | **yes** (pedagogy) | practice |
| listeningComprehension | clipId (fr.clip), question, options | **yes** | listen card if word_phrase clip with one lexeme |
| readingComprehension | readingId (fr.read), question, options | **yes** | none |
| dictation | clipId, answer, alternatives (strict) | **yes** | none |
| speakRepetition | speechItemId, modelClipId, target, acceptedVariants, requiredConcepts | ids fr-only | never evidence |
| speakProduction | instruction, cueEmoji, cueFacts, target, acceptedVariants, evidenceLexemeRefs, reveal/bias/model/allowedAttempts | ids fr-only | speak card |
| guidedWriting | writingTaskId, writingMode guided/open, instruction, cueFacts, rubric {requiredSlots{id, description, variants, cueProvided}, minTokens, maxTokens, requireSentenceVerbs}, modelAnswers | ids fr-only | none (writing mints no cards) |
| simpleForm | fields{id, label, slotId}, rubric, modelAnswers | ids fr-only | none |
| interactionScenario | scenarioId | ids fr-only | none |

### 3.3 French lexicon schema (440-553)

- `RichLexeme {id fr:w, surface, lemma, lookupForm, partOfSpeech (11 POS), gender (nouns), nativeGloss, pronunciation {value, notation ipa|phonology, source}, frequency {source, rawValue per million, rank, band}, topic (10 topics), examples[{fr, en, source}], relations.confusables, sourceRefs}`
- Supporting schemas:
  - `SourceManifestSchema` (fail-closed retrieval pins; `license: z.enum(["CC-BY-SA-4.0"])`)
  - `MatchOverridesSchema` (Lexique `Mot|Cgram|Genre|Nombre` matchKey)
  - `SourceRegistrySchema` (license allowlist MIT / Apache-2.0 / CC-BY-4.0 / CC-BY-SA-4.0 / CC-BY-2.0-FR / CC0-1.0 / original)

### 3.4 Other French layers

- **Pedagogy:** `ConceptSchema` (title, shortRule, explanation, examples{fr, en, note}, exceptions, memoryHint, objectives, sourceRefs); `ConjugationsSchema` (lemma, english, group, auxiliary, cells).
- **Assessment:**
  - `CourseObjectiveSchema` (id, title, canDo ≥10 chars, category in 9 values, prerequisites, cefrAlignments{level, scaleName, relation direct|supports, sourceRef}, essential)
  - `ClaimPolicySchema` v2 (evaluatedLevels, requiredDomains, min items / inputs / families / scales, claimWording)
  - `AttainmentPolicySchema` (per-domain requiredObjectiveIds and excluded with reasons)
  - `CheckpointSchema` (versioning, sectionId, items{exercise, objectiveTargets, essential}, forms ≥2, criteria{minItemsPerObjective ≥2, demonstratedShare})
  - `PlacementSchema` (stages, then clusters{objectiveId, anchorLessonId, 1-3 items}, maxItems ≤28, allComfortableLessonId)
- **Reception:**
  - `ReadingSource` (kind among 7, blocks paragraph|line, objectiveRefs, lexemeRefs, supportGlossary, authoringSpec)
  - `ListeningClip` (kind among 6, segments speaker A|B, scoredPlaybackPolicy) plus `voiceCast`
- **Speech:** `SpeechItem` (taskFamily among 4, elicitationType practice repetition|read_aloud or production among 4, prompt, target, acceptedVariants, requiredConcepts, evidenceLexemeRefs, assistancePolicy, scoredEligibility, modelAudioRef, recognitionLocale fr-FR, allowedAttempts, reserved).
- **Writing:** `WritingTask` (taskFamily among 4, mode, instruction, cueFacts, formFields, rubric, modelAnswers, refs, scoredEligibility, reserved).
- **Interaction:** scenario graph of partner nodes (text, clipId, rephrase, next), learner nodes (expected intents{intent, acceptedVariants, requiredConcepts, next}), terminal nodes; taskFamily; support; reserved.

### 3.5 File-by-file checklist for a new language L to reach French parity (French counts in brackets)

1. `content/courses/L-en.json`: a 6-section pack [27 units, 108 lessons, 172 words, 599 exercises across 15 types, 17 lessons with `flow`, every lesson with `objectives`], plus a catalog row and flag.
2. `content/L/lexemes.json` (id map) and `content/L/lexicon/lexemes.json` [126 rich lexemes with IPA, frequency, examples, confusables], plus `source-manifest.json`, `match-overrides.json`, `derived/*` from a licensed frequency/pronunciation source, `REVIEW.md` and `ACQUISITION.md`.
3. `content/L/pedagogy/concepts.json` [17] and a grammar table (`conjugations.json` [8 verbs], or a language-specific equivalent).
4. `content/L/assessment/objectives.json` [34], `checkpoints.json` [7 including the capstone with 2 forms], `placement.json` [4 stages / 28 items], `claim-policy.json`, `attainment.json`, and `RESEARCH.md`.
5. `content/L/reception/listening.json` [177 clips with a 2-voice cast], `reading.json` [19], `audio-source-manifest.json`, `audio-canary.json`, model-cards, `RESEARCH.md`.
6. `content/L/speech/items.json` [50, 22 reserved] and `native-acceptance.json`.
7. `content/L/writing/tasks.json` [34, 16 reserved].
8. `content/L/interaction/scenarios.json` [18, 10 reserved], whose partner lines need clips in listening.
9. Audio: pack-audio voice (manifest course entry) and reception voices; generated mp3s under `assets/audio/L` and `assets/audio/L-reception`.
10. Registry entries in `content/sources/registry.json` for every new source or voice.
11. Code: number speller, article/gender rules (if any), normaliser, recognition locale, TTS locale, flag, and capability flags.

---

## 4. Audio pipeline

### 4.1 Two pipelines, both Piper, both dispatch-only GitHub Actions

Model weights never enter the repo, and huggingface.co is unreachable from the dev sandbox.

**1) Pack audio:** `scripts/pack-audio.ts`, `scripts/lib/piper-audio.ts`, `.github/workflows/pack-audio.yml`, manifest `content/audio/pack-audio-manifest.json`.
- Engine: `piper-tts==1.2.0` (pip), voices from `huggingface.co/rhasspy/piper-voices` revision `v1.0.0`.
- Per-course policy:

| Course | Policy | Voice / reason |
|---|---|---|
| de-en | generated | `de_DE-thorsten-medium` (CC0); mls is an eligible fallback |
| es-en | generated | `es_ES-davefx-medium` (CC0); sharvard excluded (CC BY 3.0 not allowlisted) |
| fr-en | generated | `fr_FR-siwis-medium` (CC BY 4.0) |
| pt-en | generated | `pt_BR-faber-medium` (CC0); cadu and jeff are candidates |
| it-en | device-tts | paola "License: See URL" |
| zh-en | device-tts | huayan "License: Unknown" |
| ja-en, ko-en | device-tts | no Piper voice exists |

- Modes:
  - `recon`: double download (hashes must match), parse MODEL_CARD, apply the license gate fail-closed (allow CC BY 4.0, CC BY-SA 4.0, CC0, PD; deny AGPL/GPL/NC/ND), canary synthesis, ASR with the faster-whisper `base` model, `select` one voice per course.
  - `generate`: verify pins, `plan`, `synth-script` (bash), sfx, strict technical QA, ASR audit (`scripts/audio-asr-audit.py`, faster-whisper 1.0.3, `medium` model, 1 s / 0.5 s silence padding, language-aware WER/CER), `apply`, `check-audio --write-baseline`, compile, validate, commit.
- Assets are content-addressed: `assets/audio/<lang>/<20hex>.mp3`. `src/content/audio-manifest.ts` keys are `"<courseId>:<text>"`.
- QA report `content/reports/pack-audio-quality.json`: 544 clips, 0 technical failures, per-voice mean WER (de ≈0.17), 5 sentence clips flagged for review.

**2) Reception audio (French only):** `scripts/reception-audio.ts` (paths hardcoded to `content/fr/reception/*`), `.github/workflows/reception-audio.yml`, manifest `content/fr/reception/audio-source-manifest.json`.
- Voices: `fr_FR-siwis-medium` (speaker A, CC BY 4.0) and `fr_FR-upmc-medium` speaker 1 (speaker B, CC BY-SA 4.0, chosen by canary ASR, run 33231334069).
- Excluded: `fr_FR-tom-medium` (AGPL dataset) and `fr_FR-mls-medium` (canary WER 0.98-2.47).
- Canary `content/fr/reception/audio-canary.json` holds French-difficulty sentences (elision, liaison…).
- Multi-segment clips are concatenated deterministically. Census: 177 authored clips → 166 unique assets (`content/reports/reception-audio-census.json`), emitted as `src/content/reception/fr-clip-assets.ts`.
- ASR: `scripts/reception-asr-audit.py`, a French-only normaliser.
- Scored listening never falls back to device TTS (`lib/reception/content.ts`).

### 4.2 Verification in CI

- `scripts/check-audio.ts` and `scripts/lib/audio.ts` verify `content/audio/legacy-baseline.json` (713 files: 544 pack + 166 reception + 3 sfx; sha256 each, plus the manifest hash).
- `pipeline.ts:216-220` requires every `audioTarget` in a non-device-tts pack to resolve in the manifest.
- Stale wording: `scripts/lib/audio.ts` and the check-audio header still call it an "IMMUTABLE LEGACY BASELINE" of "856 MP3s", but it is now re-blessed by the generate run.
- Provenance record: `release/AUDIO_PROVENANCE_FINAL.md`.

### 4.3 Total size

`assets/audio` is about 8.6 MB: de 916K, es 1.9M, fr 1.7M, fr-reception 3.1M, pt 956K.

### 4.4 Producing audio for another language (e.g. Vietnamese, or adding it/ja/ko/zh)

1. Add the course to the pack-audio manifest `courses` with candidate voice ids and file paths. For Vietnamese, piper-voices v1.0.0 has `vi_VN-*` voices (vais1000-medium, 25hours_single-low, vivos-x_low).
   - Their MODEL_CARD licenses are unverified here; the recon gate will decide. If none pass, fall back to `device-tts` (`TTS_LOCALES` needs `vi: "vi-VN"`).
2. Dispatch `pack-audio` in `recon` mode, then `generate` with the full course list (the manifest regenerates for all generated courses).
3. For a reception layer, generalise `reception-audio.ts` and `reception-asr-audit.py`: `--lang`, paths `content/<lang>/reception`, a language-aware normaliser (reuse `audio-asr-audit.py`), a per-language canary file, a 2-voice cast with license-clean voices, and a per-language clip-asset module (`src/content/reception/<lang>-clip-assets.ts`).
4. Add `content/sources/registry.json` entries (`piper-voice-*`) so the provenance gate and the in-app Licenses screen cover them.
5. Bundle size grows roughly 2-5 MB per fully voiced language.
6. ASR intelligibility checks need a faster-whisper model that supports the language (Whisper supports vi, ja, ko, zh). Whitespace WER is meaningless for ja/zh; use CER (the script already does this for zh).

---

## 5. Lexicon pipeline

### 5.1 Source and acquisition

- Source: **Lexique 4.00** (New, Pallier, Schalchli, Bourgin, Gimenes 2026; CC BY-SA 4.0).
- `content/fr/lexicon/source-manifest.json`: retrieval `retrieved`, `Lexique400.tsv`, `https://lexique.org/databases/Lexique400/Lexique400.tsv`, retrievedAt 2026-08-27, pinned sha256 `fe333b4f…610a5a`.
- The raw TSV (about 33 MB) is never committed.

### 5.2 Steps

1. `.github/workflows/lexique-source.yml` (dispatch-only) has two modes:
   - `recon` runs `scripts/lexique-recon.ts`: double download, header/column profile, emits `derived/lexique4-recon.json` and `LEXIQUE4_COLUMNS.md`.
   - `extract` runs `scripts/lexique-derive.ts`, which fails closed on manifest, hash and columns, then does one pass via `scripts/lib/lexique-derive-lib.ts`. It emits `derived/lexique-subset.json` (core evidence rows plus match audit), `candidate-pool.json`, `frequency-stats.json` (population quantiles for bands), `gender-suffix-stats.json` (36,940 noun lemmas), `verb-morphology.json` and `core-ranks.json`.
2. `scripts/lexicon-source.ts verify`: local sha check of an artifact.
3. `scripts/lexicon-crosscheck.ts` (+ `scripts/lib/lexicon-crosscheck.ts`): offline field-by-field authored vs Lexique comparison, producing `derived/core-crosscheck.json` and a manual queue. Dispositions go into `match-overrides.json` (with justification) and `REVIEW.md`.
4. `scripts/lexicon-import.ts`: a deliberate offline merge into `content/fr/lexicon/lexemes.json`.
   - frequency = 12_FreqLemme, rank and band; IPA from 3_Phono_IPA; `sourceRefs` gains `lexique-4` with matchKey.
   - Result: 123/126 lexemes carry lexique-4 frequency; 126/126 IPA.
5. Compile (`scripts/lib/lexicon-build.ts`):
   - `src/content/lexicon/fr-index.json` (session-critical sync metadata)
   - `fr-web-fallback.json` (web tier repository)
   - `assets/lexicon/fr-lexicon-v2-07337cd4a8d13484.db` (118 KB SQLite: tables `metadata`, `lexemes`, `examples`, `relations`, `sources`, `lexeme_sources`, FTS5 `lexeme_fts`; `PRAGMA user_version`)
   - `db-asset.ts`
   - Also `gender-patterns.json` and `lexicon-quality` / `lexicon-source-audit` reports.
6. Runtime: lazy native SQLite with a hash check, otherwise the JSON fallback (§1.3).

### 5.3 Stale documentation

**`LEXICON_LICENSE.md` is stale.** It says "no Lexique data is present in this repository yet" and "54 curriculum lexemes". The reality is 126 lexemes, 123 with Lexique-4 data, and `lexique-4` registered in the registry. This must be fixed for CC BY-SA compliance.

### 5.4 Equivalent plan for other languages

Parameterise the pipeline: `content/<lang>/lexicon/source-manifest.json` with a per-language column map and derivation library. Candidate open sources (license verification still required):

| Language | Candidate sources |
|---|---|
| es | SUBTLEX-ESP or EsPal (check license); IPA via a rule-based G2P or Wiktionary-derived (CC BY-SA) |
| de | SUBTLEX-DE, DeReWo (check license); Wiktionary IPA |
| it | SUBTLEX-IT; Wiktionary |
| pt | SUBTLEX-PT-BR; Wiktionary |
| ja / ko / zh | SUBTLEX-CH / JLPT lists (check license); romanisation via pinyin / kana / revised romanization (`Word.romanization` exists in the schema) |
| vi | Vietnamese frequency (e.g. VnCoreNLP-derived or OpenSubtitles counts; verify license); IPA via Wiktionary; tones matter in search folding |

What to change:
- `RichLexemeSchema.gender` (`GENDER_VALUES` masculine/feminine/both/unknown) is fine for fr/es/it/pt; German needs `neuter`; ja/ko/zh/vi need none.
- `PronunciationSchema.notation` may need `romanization`.
- `lexicon-search.ts` folding must not strip Vietnamese tones for exact match, though accent-insensitive prefix search can stay.
- SQLite FTS5 `unicode61 remove_diacritics 2` handles Latin scripts. CJK needs the `trigram` tokenizer or n-grams.
- If the frequency source is CC BY-SA, keep a per-language `LEXICON_LICENSE` section.

---

## 6. Tests and CI

### 6.1 Test suites

- **Bun** (`bun test src scripts`): 61 files in `src/lib/__tests__`, 19 in `scripts/__tests__`. `RELEASE_READINESS.md` reports 1,173 tests passing in 5 timezones.
  - Coverage spans grading, session reducer/evidence/panel/sources/timing, FSRS adapter, SM-2 migration, migrations v1/v2/v3, historical personas, backup, store, streak (timezone lanes), TODAY composer and completion, distractors, lexicon repository/search/db parity, placement, checkpoint, retake, option-order, A1 estimate and red team, speech grader/adapter/attempt machine/step policy/privacy/cache, listening player, writing rubric/evidence, interaction machine/attacks, tutor seam, french-numbers, ids-and-keys, soak cycles (50-day).
  - `scripts/__tests__` covers pipeline, lexicon, lexicon-db, lexicon parity, crosscheck, lexique-derive, gender patterns, verb morphology, pedagogy, assessment, forms audit, reception, speech validators, interaction red team, article rules, permissions, privacy policy, release identity, bump-build.
- **Jest-expo** (`integration-tests/`): 10 suites, 69 tests. They use `renderRouter` over the real app tree: today-tab, goals, vocabulary, lexicon-ui, concept-card, reception, speak-exercises, speech-hook, checkpoint-speech-gate, interaction-scenario.
- **E2E** (playwright-core against the static web export): `e2e/smoke-web.mjs` (12 checks: onboarding→French, Section 6, goals, practice cards, writing, conversation no-recogniser, capstone pre-gate, MCQ checkpoint, privacy, licenses…), `e2e/guide-walk.mjs` (walks `docs/USER_GUIDE.md`), `e2e/screenshots.mjs`; `e2e/serve-static.py`. `scripts/emulator-smoke.sh` is for the Android emulator.

### 6.2 Workflows (`.github/workflows`)

| Workflow | Trigger | Purpose |
|---|---|---|
| `ci.yml` | push / PR | Job `checks`, matrix TZ (UTC, America/Los_Angeles, Asia/Tokyo, Pacific/Kiritimati, Pacific/Pago_Pago): frozen install, `tsc --noEmit`, `bun run test`. In UTC only: lint, jest, `content:check`, `audio:check`, `release:identity`. Job `export-size`: `expo export --platform web`, size report, `build-site.ts`, `e2e:web`, `e2e:guide`. |
| `pages.yml` | push and dispatch | Build and deploy the docs site (`site/`, `scripts/build-site.ts`), then `verify-site.sh` |
| `site-verify.yml` | dispatch | Re-verify the live site |
| `pack-audio.yml` | dispatch | Piper pack-audio recon / generate (§4) |
| `reception-audio.yml` | dispatch | French reception audio recon / generate |
| `lexique-source.yml` | dispatch | Lexique 4 recon / extract (§5) |
| `android-release-build.yml` | dispatch | Prebuild plus gradle assembleRelease (QA APK) |
| `android-direct-apk.yml` | dispatch | Signed APK to a GitHub Release |
| `android-emulator-smoke.yml` | dispatch | Emulator install, launch and deep-link smoke |
| `ios-simulator-build.yml` | dispatch | Prebuild and xcodebuild compile check |
| `eas-build.yml` | dispatch | EAS Android RC (needs `EXPO_TOKEN`; identity gate) |

`dependabot.yml` covers actions and bun. Every action is pinned to a SHA.

### 6.3 Must stay green

- `tsc`, eslint, `bun test` in all 5 TZ lanes, jest.
- `content:check` (zero drift, including the SQLite logical dump and stale-DB detection).
- `content:validate` (every validator; catalog counts).
- `audio:check` (baseline hashes; every audioTarget resolves).
- `release:identity`.
- Web export plus the E2E smoke and guide walk.

**Consequences for planning:**
- Any content edit requires `bun run content:compile` and committing the outputs.
- Any audio edit requires the dispatch workflow (the baseline re-bless happens there).
- E2E selectors depend on English strings ("French", "Section 6: Talk with someone", "learn french"), so i18n work must update them.

---

## 7. Persistence

### 7.1 Where state lives

**AsyncStorage** (not SQLite) holds all learner state: key `progress-v2`, persisted as the zustand `{state, version}` envelope, `PERSIST_VERSION = 3`.

**Top-level fields:**
- `activeCourseId`, `streak`, `lastActiveDay`, `dailyGoal`, `dailyXp`, `dailyXpDay`, `onboardingDone`, `themePreference`
- `courses: Record<courseId, CourseProgress>`
- `activeDays` (pruned to 70 days)
- `reviewLog` (ring, cap 10,000; each entry carries `courseId`)
- `assessment {checkpointAttempts (5 per id), placement?, placementFloor}`
- `speechNoticeAckAt?`

**Per-course `CourseProgress`** (`store.ts:47-58`):
- `xp`, `completedLessons`, `mistakes[{lessonId, exerciseId}]`, `wordStats` (fr keyed by `fr:w:` id; others by surface)
- `srs` (legacy SM-2, non-fr)
- `cards` (FSRS keyed `itemId|skill`, fr only)
- `srsLegacy` (fr rollback copy, still retained)

### 7.2 Not per course (design debt for multi-language)

- `assessment`: checkpoints, placement result and **placementFloor are global**. `index.tsx:48` applies the floor only when fr is active. A second language with placement would collide, so this must become `assessment: Record<courseId, …>` (a v4 migration that moves the existing data under `"fr-en"`).
- `streak`, `dailyXp`, `activeDays` and quests are global across courses. That is reasonable product-wise, but XP accounting is per course while the daily goal is global.
- `speechNoticeAckAt` is global (fine; the disclosure is OS-level).

### 7.3 Migrations (`persistence/migrations.ts`)

- v0→v1: nest flat legacy under `es-en`; prune `mistakes`/`srs` sentinels; UTC-to-local day grandfathering.
- v1→v2: fr-only SM-2→FSRS with stable ids; `fr:legacy:` orphans preserved; wordStats re-key and merge.
- v2→v3: additive `assessment`.
- A test seam injects failures (`__setMigrationFailureForTests`). Fixtures live in `src/lib/__fixtures__/progress/*`.

### 7.4 Backup (`backup.ts` + `persistence/backup-core.ts`)

- Envelope `{format: "lingo-progress-backup", envelopeVersion: 1, persistVersion, exportedAt, manifest {topLevelKeys, courses}, state}`.
  - The format and file names `lingo-progress-*.json` still carry the upstream brand. Renaming the format would break import of existing backups, so accept both.
- Export reads the raw AsyncStorage blob. The fallback `snapshotFromStore()` (backup.ts ~36-50) omits `reviewLog`, `assessment` and `speechNoticeAckAt`; it is only used when nothing is stored.
- Import is staged: parse, envelope check, newer-version refusal, `sanitize` (drops prototype-pollution keys), migrate in scratch, `runInvariants`. Then commit: a safety copy to `Paths.document/progress-before-import-*.json`, `setItem`, `rehydrate`, read-back verify, restore on failure.

### 7.5 SQLite

Only the immutable lexicon (`SQLite/fr-lexicon-v2-<hash>.db`, copied from the bundled asset). It never holds learner data.

### 7.6 Implications and risks

- **Every write re-serialises the whole state.** `release/SOAK_REPORT.md` estimates about 6 MB at the 10k log cap and 10-15 ms per write in Bun (3-5× on phones).
  - On Android, `@react-native-async-storage` is SQLite-backed with a 6 MB default DB cap. Large single values are also known to hit the "Row too big to fit into CursorWindow" (~2 MB) read limit.
  - **Verify on a device before v1 users accumulate logs.** Adding languages with FSRS multiplies log volume.
  - Recommended remedy (already named in the soak plan): move `reviewLog` and `cards` into an expo-sqlite learner DB (or MMKV), keeping AsyncStorage for small settings.
- New FSRS languages need no migration if they start empty. Enabling FSRS for es/de/… with existing SM-2 data needs a v4 step (reuse `migrateV1toV2` logic per course).
- Backup invariants are already course-generic: each course must have `srs` or `cards`.

---

## 8. Tutor

### 8.1 What exists

- **`src/lib/tutor/provider.ts`**: `TutorContext {kind: writing|speaking|interaction, instruction, learnerText, deterministicFindings[]}`, `TutorFeedback {encouragement, explanations[{point, example?}], suggestions[]}`, `interface TutorProvider {id, available, explain(ctx)}`, `DisabledTutorProvider` (rejects), and `productionTutorProvider()`, which always returns Disabled.
- **`mock-provider.ts`**: deterministic `MockTutorProvider` (tests only).

### 8.2 Wiring

- **Nothing in `src/app` or `src/components` imports the tutor.** It has no UI surface; the only references are the test and `privacy-policy.ts` text ("contains a switch for an optional AI tutor. It is disabled…").
- `src/lib/__tests__/tutor-seam.test.ts` pins three things:
  - production returns Disabled
  - **no grading / assessment / learning / session module may import the tutor** (import-graph scan)
  - no model-vendor key pattern appears in client source or config

### 8.3 Constraints to honour

- No API key in the app, no bring-your-own-key, no direct vendor calls.
- The only allowed live transport is an authenticated proxy operated by the project.
- Explicit per-feature opt-in before sending learner text.
- The context may carry only the current task and the learner's text.
- The tutor may never influence scores or FSRS.

### 8.4 What enabling an LLM tutor requires

1. A backend proxy (e.g. a Cloudflare Worker or similar) with authentication: device attestation (App Attest / Play Integrity) or anonymous tokens, rate limiting, server-side model key, logging policy.
2. A `RemoteTutorProvider implements TutorProvider` (fetch with timeout, schema-validate the response, fail soft to hidden UI).
3. An opt-in UI flow plus a persisted consent flag (a new store field; backup passes it through).
4. UI surfaces after the writing feedback, the speech result and the interaction terminal, rendered only when `provider.available`.
5. **Policy and documentation changes:**
   - `release/PRIVACY_POLICY.md`, `src/lib/privacy-policy.ts` and `scripts/__tests__/privacy-policy.test.ts` (they currently assert "makes no network requests")
   - iOS privacy manifest (collected data types)
   - Play Data Safety (`release/DATA_SAFETY.md`)
   - App Store 5.1.2 (AI data disclosure)
   - The README "Private" claim
   - The Android INTERNET permission is implicitly present in Expo; verify the merged manifest.
6. Keep the import-graph test so the tutor can never feed grading.

---

## 9. UI/UX, design system and i18n

### 9.1 Theme and design system

- `src/lib/theme.ts`: Tailwind-derived light/dark palettes with identical keys, `radius {md 12, lg 16, xl 24, full}`, `unitPalette`, and `makeThemedStyles` (cached per palette). The user can choose system, light or dark.
- **No typography scale or spacing tokens.** There are 242 inline `fontSize` literals (13, 15 and 14 are most common), `fontWeight: "800"` everywhere, and the system font only.
- Components follow the Duolingo look: 3D `DuoButton` with uppercase labels, path nodes, unit banners, Ionicons and MaterialCommunityIcons.
- **Accessibility work is visible:**
  - `accessibilityRole`, `Label`, `Hint` and `State` on nodes and chips
  - `maxFontSizeMultiplier` on dense stats
  - 44 pt close button
  - ReduceMotion set to System
  - Device assistive-technology pass not yet done (`release/ACCESSIBILITY_FINAL.md`)
- **Quality verdict:** consistent and pleasant, but ad hoc (per-screen `StyleSheet`s, no shared Text / Card / Section primitives beyond DuoButton, OptionCard and CloseButton). Introducing typography tokens and a few primitives would make localisation and redesign far cheaper.

### 9.2 i18n

- **None.** No library and no string catalog.
- UI strings are hardcoded English across about 30 screen and component files (316 `<Text` nodes, plus `accessibilityLabel`/`Hint` strings, `Alert` texts, DuoButton labels).
- English also lives in lib modules:
  - `store.ts:493-500` quest labels
  - `session/sources.ts:202` "What do you hear?"
  - `writing/rubric.ts` feedback strings
  - interaction machine and step-policy messages
  - goals and estimate wording (`goals.tsx:70-87`)
  - `privacy-policy.ts`
  - `licenses.tsx`
- Many strings say "French" literally (§2.4, §1.4).
- `KNOWN_LIMITATIONS.md` explicitly lists "UI language is English only (no i18n)".

### 9.3 The native language is content, not chrome

- `Word.native`, MCQ options ("the coffee"), `question` ("On which day is the museum closed?"), `translation`, unit guidebooks, concept explanations and examples `{fr, en}`, objective `canDo`, speech `prompt.instruction` (by construct: "meaning-only cue — English instruction"), writing slot `description` and `cueFacts` labels, scenario `goal`/`support`, lexeme `nativeGloss` and `examples.en`.
- The writing rubric's language-plausibility floor assumes the learner writes French and that English is "not French".

### 9.4 What a Vietnamese (or multi-native) UI would take

**Step 1: chrome i18n**
- Add `expo-localization` and a light catalog (i18next or a typed in-house `t()` with ICU plurals; e.g. Vietnamese has no plural inflection, English does).
- Extract about 400-600 strings, including accessibility labels and lib-level messages (refactor lib functions to return message keys plus parameters, not English sentences).
- Add a `uiLanguage` store field (system default) and a Profile picker.
- Fonts: system fonts render Vietnamese diacritics fine, but check line-height clipping of stacked diacritics (ệ, ở) at the 800 weight and with uppercase `DuoButton` labels.
- Update E2E selectors (use testIDs instead of English text).
- Translate `privacy-policy.ts`, store metadata and the site.

**Step 2: native-language content.** Course ids already encode the native language (`fr-en`). A Vietnamese-speaker French course is a **new course `fr-vi`**:
- translated pack (glosses, options, questions, guidebooks)
- translated concepts, objectives `canDo`, speech and writing instructions, scenario support
- lexicon `nativeGloss` and examples split by native language (schema change: `glosses: Record<nativeCode, string>`, `examples[].translations`)

Because the French layer keys on the literal `"fr-en"` everywhere, the coupling refactor in §2 (resolve by `targetCode` plus capabilities, share FSRS ids `fr:w:*` across `fr-en` and `fr-vi`) is a prerequisite.

**Design decision needed:** should FSRS cards, lexicon and assessment be keyed by target language (shared across native languages) or by course? Item ids are target-language identities, so per-target sharing is natural, but persisted `courses[courseId].cards` is per course.

Machine translation of authored content would still need human review (the project's honesty and provenance rules apply; translations should be registered as `original` sources).

---

## 10. State of completion

### 10.1 Production quality

- The French learning engine is rigorous:
  - FSRS adapter with known-vector self-check
  - evidence gate (one mutation per card per session; assisted and hinted refused)
  - undo with integrity guard
  - append-only log
  - active-time latency
- Deterministic, pure, heavily tested session architecture (one reducer for path, review, mistakes, TODAY, checkpoint and placement).
- Content pipeline:
  - strict zod
  - deterministic compile with a drift guard
  - provenance registry and license allowlist
  - generated attributions, in-app Licenses screen
- Assessment honesty machinery: claim gate, attainment policy, parallel forms, seeded option order, red-team tests.
- Speech privacy: no persisted transcripts or audio, cache sweeping, network disclosure; the permission set is minimal.
- Persistence migrations and backup are transaction-safe and tested across historical personas.
- Audio provenance is closed (all upstream recordings replaced by pinned, license-gated Piper output).
- Release engineering: identity gate, SHA-pinned actions, dispatch-only data workflows, documentation site, extensive `release/` dossiers.

### 10.2 Thin

- **The 7 non-French courses:**
  - 1 section, 5 units, 20 lessons (es 10/40), 60 words, 5 exercise types
  - no objectives, concepts, lexicon or reception
  - legacy SM-2
  - no audio for it/ja/ko/zh (device TTS, quality varies by device)
  - ja/ko/zh rely on `romanization` fields in packs
- **French itself is a narrow A1:**
  - 126 lexemes and 172 pack words (very small for A1; CEFR A1 is typically 500-1,000 words)
  - 108 lessons; 4 lessons per unit
  - Section 1 is inherited Lingo content with `fr-en:u0-l0-e0` ids, while later sections use `s3-e1`-style ids (inconsistent naming)
  - only 17/108 lessons use `flow` concept interleaving
- Web tier: hydration error #418 suppressed; no speech; JSON lexicon fallback.
- Device validation: no physical-device acceptance, no assistive-technology pass, no device soak (`PUBLICATION_STATUS.md`). Store accounts, EAS project and signing are all waiting on the owner.

### 10.3 Tech debt and correctness risks (prioritised)

1. **French coupling is spread across about 25 runtime files and the scripts** (§2); `capabilities.ts` covers only 2 features. This is the single biggest blocker for "more languages" or "Vietnamese-native".
2. **Global assessment and placementFloor state** (§7.2) blocks a second assessed language.
3. **AsyncStorage single-blob scaling** (§7.6): an Android size or CursorWindow risk as the review log grows. Plan a SQLite learner store.
4. **Onboarding defaults to Spanish** (`onboarding.tsx:15-19`, `DEFAULT_COURSE_ID = "es-en"`) in a French-branded app. An easy fix, but `DEFAULT_COURSE_ID` is also the v0 flat-legacy nesting target, so keep a separate constant for migration.
5. **French-only routes lack course guards**: `/goals`, `/placement/*`, `/checkpoint/*`, `/lesson/srs-listening|srs-speaking|writing-practice|conversation`. They are deep-linkable while another course is active; evidence would then route to `activeCourseId` (`store.ts:353`) while the definition says fr-en.
6. Hand-maintained `ids-fr.ts` duplicating `content/fr/lexemes.json` (drift-checked, but redundant).
7. Dead code and files:
   - `src/content/pack.json` (340 KB, unused, obsolete schema)
   - `LegacySchedulerAdapter` (tests only)
   - store `recordWord` / `reviewSrsWord` (parity only)
   - `srsLegacy` rollback copy still retained (needs an explicit decision)
8. Stale documentation and comments:
   - `LEXICON_LICENSE.md` (claims no Lexique data and 54 lexemes): a **license-compliance fix**
   - `exercise-registry.ts` ("five exercise types")
   - `scripts/lib/audio.ts` and `check-audio.ts` ("immutable legacy baseline, 856 MP3s")
   - `lib/speech/content.ts` ("artifact is empty until Section-4…")
   - `UX_REVIEW.md` brand section (predates the identity migration)
9. No i18n and no typography tokens (§9).
10. The backup format name is still `lingo-progress-backup` / `lingo-progress-*.json` (brand residue; keep accepting it).
11. Speech grader tokenises on whitespace and lenient `normalize` strips all diacritics. Both are wrong for CJK and Vietnamese targets respectively (§2.5, §2.6).
12. `concepts.ts` lookup is not course-scoped.

### 10.4 Known limitations by design (`release/KNOWN_LIMITATIONS.md`)

- AI tutor disabled; no accounts or sync.
- Non-French courses on the legacy scheduler.
- A1 is an "aligned estimate" with no empirical validation.
- No pronunciation scoring (graded on the transcript).
- English-only UI.
- Web tier has no SQLite or speech.
- Open P2 items: web hydration, unknown store size, OS speech may use the network, untested OEM recognisers, no baseline profile, rubric construct quirks (L8/L9).

### 10.5 Suggested refactor order for the next build phases

1. Introduce a `CourseProfile` registry generated by the compiler: `courseId → {targetCode, nativeCode, recognitionLocale, ttsLocale, flagAsset, capabilities{fsrs, dailySession, lexicon, placement, checkpoints, goals, listening, speaking, writing, conversation, concepts}, idPrefix, artifacts…}`.
2. Replace every `"fr-en"` / `FR_COURSE_ID` check with capability or profile lookups. Thread `courseId` explicitly (store, controller, sources, composer).
3. Per-course artifact loaders: compile `src/content/<lang>/…` plus generated index modules with static requires (Metro).
4. Parameterise the schema ids and `language` literals; split language rules (articles, numbers, normalisation, tokenisation) into `src/lib/languages/<code>.ts` and `scripts/lib/languages/<code>.ts`.
5. Persist v4: per-course assessment; optional FSRS migration for legacy courses; move the review log and cards to SQLite.
6. i18n chrome, then native-language content schema changes (`glosses` per native language), then `fr-vi`.
7. Fix the cheap issues: onboarding default, route guards, `LEXICON_LICENSE.md`, dead files, stale comments.

---

Key paths for the caller:
- `/home/claude/learning-french-with-tracy/src/lib/capabilities.ts`
- `/home/claude/learning-french-with-tracy/src/lib/learning/ids-fr.ts`
- `/home/claude/learning-french-with-tracy/src/lib/learning/engine.ts`
- `/home/claude/learning-french-with-tracy/src/lib/session/sources.ts`
- `/home/claude/learning-french-with-tracy/src/lib/session/evidence.ts`
- `/home/claude/learning-french-with-tracy/src/lib/store.ts`
- `/home/claude/learning-french-with-tracy/src/lib/persistence/migrations.ts`
- `/home/claude/learning-french-with-tracy/content/schema.ts`
- `/home/claude/learning-french-with-tracy/scripts/compile-content.ts`
- `/home/claude/learning-french-with-tracy/scripts/lib/pipeline.ts`
- `/home/claude/learning-french-with-tracy/scripts/pack-audio.ts`
- `/home/claude/learning-french-with-tracy/scripts/reception-audio.ts`
- `/home/claude/learning-french-with-tracy/content/audio/pack-audio-manifest.json`
- `/home/claude/learning-french-with-tracy/src/lib/tutor/provider.ts`
- `/home/claude/learning-french-with-tracy/src/app/onboarding.tsx`
- `/home/claude/learning-french-with-tracy/LEXICON_LICENSE.md`
- `/home/claude/learning-french-with-tracy/release/KNOWN_LIMITATIONS.md`
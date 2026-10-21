# Course blueprint — the French A1 course as the template (P3c)

Every new course (`<target>-vi`) is authored against this blueprint: the
same six-section shape, the same construct families, the same validator
contract. Counts below are the French `fr-en` course as committed
(`content/courses/fr-en.json`, `content/fr/**`, audit `plan/03-AUDIT-CONTENT.md` §2),
measured by `scripts/author.ts blueprint`. A new course may be smaller in a
section (the validators enforce structure, not size) but the **claim gate**
needs the assessment half intact (section "Assessment").

## 1. Course pack (`content/courses/<target>-vi.json`)

| Section | Title (fr) | Units | Lessons | Exercises | Exercise types | Words/unit | Guidebook chars/unit |
|---|---|---|---|---|---|---|---|
| 1 Beginner | Section 1: Beginner | 5 | 20 (4/unit) | 220 (11/lesson) | select 120, wordBank 40, fillBlank 20, match 20, typeAnswer 20 | 12 | 703–912 |
| 2 Building blocks | Section 2 | 5 | 20 | 191 (8–11/lesson) | select 101, conjugationCloze 33, fillBlank 23, articleSelect 20, typeAnswer 14 | 2–17 | 1,143–1,780 |
| 3 Understand everyday … | Section 3 | 5 | 20 | 104 (5–6/lesson) | listeningComprehension 35, select 32, readingComprehension 24, dictation 7, match 6 | 4–7 | 271–377 |
| 4 Speak your first … | Section 4 | 4 | 16 | 34 (1–3/lesson) | speakProduction 20, speakRepetition 9, select 5 | 4 | 342–386 |
| 5 Write everyday … | Section 5 | 4 | 16 | 24 (1–2/lesson) | guidedWriting 16, wordBank 6, simpleForm 2 | 3 | 136–271 (thin — see linters) |
| 6 Talk with someone | Section 6 | 4 | 16 | 31 (1–3/lesson) | select 13, wordBank 10, interactionScenario 8 | 3 | 220–338 |
| **Total** | | **27** | **108** | **604** | | **126 lexemes** | 16.7 K |

Section 1 is the inherited beginner pack translated (P2b workflow:
`scripts/translate-native.ts`); the toolkit authors sections 2–6. Lesson
`flow` entries interleave concept steps only in section 2 (17 concept
steps over 4+4+3+3+3 lessons). Section 2 unit themes: gender & articles,
high-yield verbs, cognates & false friends, numbers 0–100, connected
speech (elision/liaison for French; the brief names the equivalent for
each target). Section 3: listening words/phrases, messages & signs,
announcements & instructions, small dialogues, little stories. Section 4:
say hello, introduce yourself, numbers aloud, describe it. Section 5: write
who you are, simple sentences, short messages, forms & messages. Section 6:
first exchanges, café & shop, finding your way, making plans.

Exercise rules the validators enforce (`plan/03-AUDIT-CONTENT.md` §5):
ids `<courseId>:<unit>-l<n>-e<n>`; `select`/`fillBlank`/`listening`/`reading`
`correct` in range and no duplicate options; `wordBank` tokens are a
multiset of the answer + distractors; `match` no duplicate targets;
`articleSelect` never on a vowel/h-initial noun (French rule; the plugin's
`neutralBefore`/elision rule for other languages); every `audioTarget` must
exist in the audio manifest unless the course is `device-tts`; lessons in
sections 2–6 declare `objectives`. Options/prompts reference **lexeme
surfaces or glosses only** (the toolkit emits the allowed lists).

## 2. Lexicon (`content/<target>/lexicon/lexemes.json`, P3a ETL)

126 French lexemes (94 nouns, 19 verbs, 5 interjections, 4 adverbs, 3
expressions, 1 adjective); every pack word is a lexeme; IPA 126/126;
frequency 123/126 (bands very-common 73 / common 46 / less-common 4);
≥1 example each; confusables symmetric; 10 topics. A new course starts from
the ETL output (≈800 lexemes for Spanish) and the `lexicon-review` step
fills `TODO:vi` glosses/examples and confirms confusables.

## 3. Pedagogy (`content/<target>/pedagogy/`)

17 concept cards (`concepts.json`: title, shortRule, explanation,
examples with notes, exceptions, memoryHint, objectives, sourceRefs):
gender ×4, être/avoir, -er verbs, futur proche, passé composé, cognates ×2,
false friends, numbers ×3, elision, liaison, h. 8 paradigm tables
(`paradigms.json`: lemma, gloss, group, cells inf/pre:1s…3p/participle,
evidence source) — every cell must be evidenced by the committed morphology
rows (`derived/morphology.json` for ETL languages, `verb-morphology.json`
for French). Rules of `RESEARCH.md`: clean-room prose; "always" only at
≥ 99.5 % with named exceptions, else "usually"; spoken cues never labelled
IPA; every statistic cites the derived evidence.

## 4. Reception (`content/<target>/reception/`)

19 readings (`reading.json`: message 6, notice 5, description 4, dialogue 2,
narrative 2; 13–30 tokens; blocks; objectiveRefs; lexemeRefs;
supportGlossary — ≤ ~60 tokens by unit 2, ≤ 90 by unit 5). 177 listening
clips (`listening.json`: message 136, word_phrase 18, dialogue 8,
announcement 7, factual 6, instruction 2; of which 113 are interaction
partner turns `ix_*`, 29 teaching, 10 checkpoint, 19 speech models, 2
placement, 4 capstone; ≤ ~12 s, 1–2 speakers, 1–3 information units,
`scoredPlaybackPolicy` maxPlays 2 rate 1; voiceCast A/B). Scored input is
bundled deterministic audio only (pipeline v2 generates it per language).

## 5. Speech (`content/<target>/speech/items.json`)

50 items: task families information_giving 16, formulaic_exchange 14,
self_introduction 11, description 9; elicitation information_prompt 14,
semantic_prompt 12, situation_prompt 11, repetition 8, picture_prompt 5;
22 reserved for checkpoints, 42 scored-eligible, 28 with model audio.
Repetition is practice (never production evidence); STT accuracy ≠
pronunciation; accepted variants normalise non-empty and unique.

## 6. Writing (`content/<target>/writing/tasks.json`)

34 tasks: short_message 12, personal_profile 9, simple_description 8,
simple_form 5; 30 guided (deterministic rubric: required slots with
variants, length window, plausibility floor, anti-gaming) + 4 open
(practice only, never scored); 16 reserved. `formFields` only on
simple_form; minTokens < maxTokens; no answer leak in cue facts.

## 7. Interaction (`content/<target>/interaction/scenarios.json`)

18 scenarios (conversation 8, transaction 5, information_exchange 5), 214
nodes (92 partner, 84 learner, 38 terminal), 104 intents, 10 reserved.
Graph rules: reachable, no dead ends, ≥ 1 goal_met terminal, `noMatchNext`
through a repair node, ≥ 2 learner turns (≥ 2 scored when reserved), every
partner line has a clip. Supportive interlocutor (repeat/rephrase/repair)
is part of the construct; interaction never mutates FSRS.

## 8. Assessment (`content/<target>/assessment/`)

34 objectives (`objectives.json`: grammar 8, lexical 5, written_production
5, written_reception 4, spoken_reception 4, spoken_production 4,
interaction 2, phonology 1, strategy 1; 23 essential; CEFR alignments 22
direct / 29 supports, cited by scale identity with `sourceRef`
`cefr-cv-2020`, **no descriptor text**; `direct` needs an evidenceNote).
7 checkpoints (`checkpoints.json`, demonstratedShare 0.66): section-1 12
select; section-2 18 (conjugationCloze 6, articleSelect 5, typeAnswer 3,
fillBlank 2, select 2); section-3 22 (listening 11, reading 7, dictation 2,
select 2); section-4 12 speakProduction; section-5 12 (guidedWriting 9,
simpleForm 3); section-6 6 interactionScenario; a1-capstone 20 (4 per
domain, 2 parallel forms of 10). Placement (`placement.json`): 4 stages
(foundations 4 clusters / 7 items, building_blocks 6 / 9, reception 4 / 6,
production 2 / 6), 28 items, maxItems 28, anchors strictly later per
cluster. `claim-policy.json` (v2): evaluated levels, required domains
(reception/production/interaction), ≥ 3 items and 2 distinct inputs per
direct objective, 2 task families + 2 scales per domain, fixed wording
"CEFR-aligned estimate — not an official CEFR examination or
certification". `attainment.json`: the per-domain essential objectives a
level estimate needs. Vocabulary / lesson / XP counts are never inputs.

## 9. Authoring order and sessions (see `content/README.md` → Authoring a course)

`scaffold` → `objectives` (1 session) → `units` (1) → `lexicon-review`
(2–3) → `lessons` (3–4, one per section) → `concepts` (1–2) → `readings`
(1) → `listening` (2: teaching + partner lines after scenarios) →
`speech` (1) → `writing` (1) → `scenarios` (2) → `checkpoints` (2) →
`placement` (1) → `checklist` → native review → audio pipeline v2
(`canary`, `generate --layer all`) → compile. Every ingest runs the
validators and writes `_drafts/<step>/REPORT.md`; a step is repeated until
its report has no failures.

# en-vi assessment research base (clean-room)

Authored for this project (P4f, 2026-10-31). It is the provenance register for the
`sourceRef` keys used in `objectives.json` and records how the English objectives
were derived. **No CEFR descriptor text is reproduced anywhere in this repository.**
The structure follows the RESEARCH.md of the French, Spanish, German and Italian
courses; what they say about the framework model, the claim gate and parallel forms
applies unchanged and is not repeated here.

## Primary sources

- **Council of Europe, CEFR Companion Volume (2020)**: *Common European Framework of
  Reference for Languages: Learning, teaching, assessment. Companion Volume*, Council
  of Europe Publishing, Strasbourg, 2020.
  https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4
- **Council of Europe, CEFR descriptors page**:
  https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors

Nothing here quotes official descriptor wording, so no verbatim accuracy is claimed
or needed.

## How the English objectives were derived

The objectives keep the construct families and CEFR scale alignments of the other
courses (`plan/authoring/BLUEPRINT.md` §8), because the scales describe communicative
activities and competences independently of the language. Every `title`, `canDo` and
`evidenceNote` was written for English and for Vietnamese learners
(`plan/authoring/briefs/en-vi.md`), with a stronger pull toward work: scenarios and
instructions at a factory or an office replace some travel settings. The grammar
family differs most, because the transfer problems differ:

| Objective | Why it exists |
|---|---|
| `en.obj.articles.a_an_the` | Vietnamese has no articles (brief §3.2) |
| `en.obj.nouns.plurals_countability` | plural marking and uncountable nouns (brief §3.3) |
| `en.obj.verbs.be_there_is` | be is not simply "là"; "có" splits into have and there is (brief §3.1, §3.8) |
| `en.obj.verbs.present_simple_do` | third-person -s and do-support (brief §3.4) |
| `en.obj.syntax.questions_word_order` | question words move to the front (brief §3.12) |
| `en.obj.verbs.present_continuous` | be + -ing against "đang" (brief §3.5) |
| `en.obj.verbs.past_recognition` | the verb changes where Vietnamese adds "đã"; kept at A2 *supports* (brief §3.6) |
| `en.obj.verbs.future_can_would` | going to, will, can, would like; kept at A2 *supports* (brief §3.7, §3.10) |
| `en.obj.pronouns.possessives` | I / me / my / mine against one word "tôi" (brief §3.9) |
| `en.obj.prepositions.time_place` | in, on, at (brief §3.11) |
| `en.obj.adjectives.order_very` | adjective before noun, "I very like" (brief §2, §3.13) |
| `en.obj.pronunciation.final_sounds` | final consonants, th, -s/-ed, stress (brief §2, §3.15-16) |
| `en.obj.strategy.loanwords_false_friends` | words Vietnamese already uses, and phonetic false friends (brief §2) |

The speaking objectives cue meaning in **Vietnamese**; the English target is never
shown before the attempt.

## sourceRef register

Every `cefrAlignments[].sourceRef` in `objectives.json` uses a key below. Keys name
the CEFR scale consulted; they are references, not quotations.

| key | CEFR scale (Companion Volume 2020) |
|---|---|
| `cefr-cv-2020:conversation` | Conversation (spoken interaction) |
| `cefr-cv-2020:sociolinguistic-appropriateness` | Sociolinguistic appropriateness |
| `cefr-cv-2020:vocabulary-range` | Vocabulary range |
| `cefr-cv-2020:grammatical-accuracy` | Grammatical accuracy |
| `cefr-cv-2020:orthographic-control` | Orthographic control |
| `cefr-cv-2020:phonological-control` | Phonological control |
| `cefr-cv-2020:identifying-cues-inferring` | Identifying cues and inferring (reception strategy) |
| `cefr-cv-2020:overall-reading-comprehension` | Overall reading comprehension |
| `cefr-cv-2020:overall-listening-comprehension` | Overall listening comprehension |
| `cefr-cv-2020:audio-media-recordings` | Listening to audio media and recordings |
| `cefr-cv-2020:announcements-instructions` | Listening to announcements and instructions |
| `cefr-cv-2020:understanding-conversation` | Understanding conversation between other speakers |
| `cefr-cv-2020:reading-correspondence` | Reading correspondence |
| `cefr-cv-2020:reading-orientation` | Reading for orientation |
| `cefr-cv-2020:overall-oral-production` | Overall oral production |
| `cefr-cv-2020:sustained-monologue-describing` | Sustained monologue: describing experience |
| `cefr-cv-2020:sustained-monologue-giving-information` | Sustained monologue: giving information |
| `cefr-cv-2020:overall-written-production` | Overall written production |
| `cefr-cv-2020:overall-written-interaction` | Overall written interaction |
| `cefr-cv-2020:notes-messages-forms` | Notes, messages and forms |
| `cefr-cv-2020:correspondence` | Correspondence |
| `cefr-cv-2020:overall-oral-interaction` | Overall oral interaction |
| `cefr-cv-2020:information-exchange` | Information exchange |
| `cefr-cv-2020:obtaining-goods-services` | Obtaining goods and services |

## Descriptor paraphrase policy

- Learner-facing `canDo` text is original wording written for this course's actual
  content, in Vietnamese, with an English version for the build tools. It never copies
  Companion Volume descriptor sentences.
- Alignments record only level, scale name, relation and `sourceRef`.

## direct vs supports

Same rule as the other courses: `direct` only where the course genuinely assesses the
communicative ability at that level within its stated scope (evidence notes say what
is NOT assessed); everything else is `supports`. Doubt resolves to `supports`. The
interaction and speaking objectives rely on the same deterministic scenario and
recognised-word graders as French.

## Word lists

CEFR-J and the New General Service List are anchors for word choice only
(`content/en/lexicon/derived/anchors.json`, `content/en/lexicon/REVIEW.md`). A list
level is never an input to a level claim, and vocabulary counts never are.

## Exam track

This course has no exam track at this step. The decision on what may be built is in
`plan/authoring/en-plan.md`.

## Assessment limitations

As for the other courses: synthesized bundled audio only, recognised words only for
speech (never a pronunciation-quality score), rubric slots for writing, deterministic
scenarios for interaction. The A1 estimate is a CEFR-aligned estimate, not an official
examination or certification.

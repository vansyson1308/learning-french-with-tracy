# it-vi assessment research base (clean-room)

Authored for this project (P3d, 2026-10-30). It is the provenance register for the
`sourceRef` keys used in `objectives.json` and records how the Italian objectives
were derived. **No CEFR descriptor text is reproduced anywhere in this
repository.** The structure follows `content/fr/assessment/RESEARCH.md`,
`content/es/assessment/RESEARCH.md` and `content/de/assessment/RESEARCH.md`;
everything said there about the framework model, the claim gate and parallel
forms applies unchanged and is not repeated here.

## Primary sources

- **Council of Europe — CEFR Companion Volume (2020)**: *Common European
  Framework of Reference for Languages: Learning, teaching, assessment —
  Companion Volume*, Council of Europe Publishing, Strasbourg, 2020.
  https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4
- **Council of Europe — CEFR descriptors page**:
  https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors
- **Profilo della lingua italiana** (Spinelli, Parizzi; La Nuova Italia, 2010): the
  Italian reference-level inventories. Used as context only (see the boundary below).

Nothing here quotes official descriptor wording, so no verbatim accuracy is
claimed or needed.

## How the Italian objectives were derived

The objectives mirror the German set (`plan/authoring/BLUEPRINT.md` §8): the same
nine categories, the same essential objectives and the same CEFR scale alignments,
because the scales describe communicative activities and competences independently
of the language. Every `title`, `canDo` and `evidenceNote` that names language facts
was rewritten for Italian and for Vietnamese learners (`plan/authoring/briefs/it-vi.md`).
Language-specific substitutions:

| German objective | Italian objective | why |
|---|---|---|
| `de.obj.gender.articles_basic` | `it.obj.articles.definite` | il / lo / la / l' chosen by gender and first sound (brief §3.1-2) |
| `de.obj.gender.plurals_kein` | `it.obj.articles.plurals` | -i / -e with i / gli / le, invariable nouns (brief §3.4) |
| `de.obj.cases.accusative` | `it.obj.articles.indefinite_elision` | un / uno / una / un' and the apostrophe; articulated prepositions as chunks (brief §3.3, §3.12, §3.18) |
| `de.obj.verbs.sein_haben_present` | `it.obj.verbs.essere_avere_present` | the two auxiliaries, and c'è / ci sono (brief §3.6) |
| `de.obj.word_order.verb_second` | `it.obj.syntax.negation_questions` | dropped subject, non, intonation questions (brief §3.7, §3.10) |
| `de.obj.verbs.separable_modal` | `it.obj.verbs.modals_piacere` | volere, potere, dovere + infinitive; mi piace (brief §3.13-14) |
| `de.obj.verbs.perfekt_recognition` | `it.obj.verbs.passato_recognition` | high-frequency forms and the auxiliary choice; agreement is recognition only (brief §3.9); kept at A2 *supports* |
| `de.obj.spelling.capitals_umlaut` | `it.obj.spelling.accents_apostrophe` | the orthographic-control objective (brief §2) |
| `de.obj.pronunciation.vowels_ch` | `it.obj.pronunciation.double_consonants` | the phonological-control objective: double consonants above all (brief §2, §3.15) |
| `de.obj.strategy.cognates_compounds` | `it.obj.strategy.cognates_false_friends` | international words and false friends for English speakers (brief §2) |

The speaking objectives cue meaning in **Vietnamese**; the Italian target is never
shown before the attempt.

## sourceRef register

Every `cefrAlignments[].sourceRef` in `objectives.json` uses a key below. Keys
name the CEFR scale consulted; they are references, not quotations.

| key | CEFR scale (Companion Volume 2020) |
|---|---|
| `cefr-cv-2020:overall-reading-comprehension` | Overall reading comprehension (incl. Pre-A1 band) |
| `cefr-cv-2020:conversation` | Conversation (spoken interaction) |
| `cefr-cv-2020:sociolinguistic-appropriateness` | Sociolinguistic appropriateness |
| `cefr-cv-2020:vocabulary-range` | Vocabulary range |
| `cefr-cv-2020:grammatical-accuracy` | Grammatical accuracy |
| `cefr-cv-2020:orthographic-control` | Orthographic control |
| `cefr-cv-2020:phonological-control` | Phonological control |
| `cefr-cv-2020:identifying-cues-inferring` | Identifying cues and inferring (reception strategy) |
| `cefr-cv-2020:overall-listening-comprehension` | Overall listening comprehension (incl. Pre-A1 band) |
| `cefr-cv-2020:audio-media-recordings` | Listening to audio media and recordings |
| `cefr-cv-2020:announcements-instructions` | Listening to announcements and instructions |
| `cefr-cv-2020:understanding-conversation` | Understanding conversation between other speakers |
| `cefr-cv-2020:reading-correspondence` | Reading correspondence |
| `cefr-cv-2020:reading-orientation` | Reading for orientation |
| `cefr-cv-2020:overall-oral-production` | Overall oral production (incl. Pre-A1 band) |
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

- Learner-facing `canDo` text is original wording written for this course's
  actual content, in Vietnamese (with an English version for the build tools). It
  never copies Companion Volume descriptor sentences.
- Alignments record only level, scale name, relation and `sourceRef`.

## direct vs supports

Same rule as the other courses: `direct` only where the course genuinely assesses
the communicative ability at that level within its stated scope (evidence notes
say what is NOT assessed); everything else is `supports`. Doubt resolves to
`supports`. The interaction and speaking objectives rely on the same
deterministic scenario and recognised-word graders as French.

## Profilo della lingua italiana boundary

The *Profilo* defines Italian-specific inventories per level. It is a copyrighted
publication. This project uses its existence and its level structure as context
only, copies no inventories, tables, item lists or exercises from it, and cites it
only as bibliography.

## Exam-track boundary (CILS A1 standard)

The CILS A1 standard track reproduces the *public format* of the exam (sections,
task types, timing, scoring structure) with original items only
(`content/it/exam/FORMAT-SOURCES.md`). No official exam item, sample paper or model
answer is copied. Results are worded as an estimated readiness ("mức sẵn sàng ước
tính"), never as a prediction of passing. CELI Impatto and PLIDA A1 are named in the
brief as alternatives only; no track is built for them. The other CILS A1 modules
(integrazione in Italia, bambini, adolescenti) are not modelled.

## Assessment limitations

As for the other courses: synthesized bundled audio only, recognised words only for
speech (never a pronunciation-quality score), rubric slots for writing, deterministic
scenarios for interaction. The A1 estimate is a CEFR-aligned estimate, not an
official examination or certification.

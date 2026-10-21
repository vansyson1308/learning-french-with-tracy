# es-vi assessment research base (clean-room)

Authored for this project (P3d, 2026-10-22). It is the provenance register for the
`sourceRef` keys used in `objectives.json` and records how the Spanish objectives
were derived. **No CEFR descriptor text is reproduced anywhere in this
repository.** The structure follows `content/fr/assessment/RESEARCH.md`; everything
said there about the framework model, the claim gate and parallel forms applies
unchanged and is not repeated here.

## Primary sources

- **Council of Europe — CEFR Companion Volume (2020)**: *Common European
  Framework of Reference for Languages: Learning, teaching, assessment —
  Companion Volume*, Council of Europe Publishing, Strasbourg, 2020.
  https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4
- **Council of Europe — CEFR descriptors page**:
  https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors
- **Instituto Cervantes — Plan Curricular del Instituto Cervantes. Niveles de
  referencia para el español** (2006): the Spanish reference-level inventories.
  Used as context only (see the boundary below).

Nothing here quotes official descriptor wording, so no verbatim accuracy is
claimed or needed.

## How the Spanish objectives were derived

The 34 objectives mirror the French set one to one (`plan/authoring/BLUEPRINT.md`
§8): same nine categories and counts, the same 23 essential objectives and the
same CEFR scale alignments, because the scales describe communicative activities
and competences independently of the language. Every `title`, `canDo` and
`evidenceNote` was rewritten for Spanish and for Vietnamese learners
(`plan/authoring/briefs/es-vi.md`). Language-specific substitutions:

| French objective | Spanish objective | why |
|---|---|---|
| `fr.obj.gender.ending_patterns` | `es.obj.gender.agreement` | Spanish gender is mostly predictable from -o/-a; the hard part for Vietnamese speakers is plural and adjective agreement |
| `fr.obj.verbs.etre_avoir_present` | `es.obj.verbs.ser_estar_present` | the two "to be" verbs are the core A1 contrast (brief §3.4) |
| `fr.obj.verbs.er_present` | `es.obj.verbs.regular_present` | three regular conjugations, subject dropping (brief §3.5, §3.7) |
| `fr.obj.verbs.aller_faire_present` | `es.obj.verbs.tener_ir_hacer_present` | core irregulars and *hay* vs *tener* (brief §3.6, §3.9) |
| `fr.obj.verbs.futur_proche` | `es.obj.verbs.ir_a_infinitive` | near future (brief §3.12) |
| `fr.obj.verbs.passe_compose_avoir` | `es.obj.verbs.preterite_recognition` | recognition of high-frequency preterite forms only (brief §3.13); kept at A2 *supports* |
| `fr.obj.connected.elision` | `es.obj.spelling.written_accents` | the orthographic-control objective: meaning-changing accents and ¿ ¡ |
| `fr.obj.connected.liaison_h` | `es.obj.pronunciation.stress_r` | the phonological-control objective: stress rules and r / rr (brief §2, §3.16-17) |

The speaking objectives cue meaning in **Vietnamese**; the Spanish target is never
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

Same rule as French: `direct` only where the course genuinely assesses the
communicative ability at that level within its stated scope (evidence notes say
what is NOT assessed); everything else is `supports`. Doubt resolves to
`supports`. The interaction and speaking objectives rely on the same deterministic
scenario and recognised-word graders as French.

## Plan Curricular boundary

The *Plan Curricular del Instituto Cervantes* defines Spanish-specific inventories
(grammar, functions, notions, vocabulary) per level. It is a copyrighted
publication. This project uses its existence and its level structure as context
only, copies no inventories, tables, item lists or exercises from it, and cites it
only as bibliography.

## Exam-track boundary (DELE A1)

The DELE A1 exam track reproduces the *public format* of the exam (parts, task
types, timing, scoring structure) with original items only. No official exam
item, sample paper or model answer is copied. Results are worded as an estimated
readiness ("mức sẵn sàng ước tính"), never as a prediction of passing, following
the same honesty rules as the CEFR-aligned estimate.

## Assessment limitations

As for French: synthesized bundled audio only, recognised words only for speech
(never a pronunciation-quality score), rubric slots for writing, deterministic
scenarios for interaction. The A1 estimate is a CEFR-aligned estimate, not an
official examination or certification.

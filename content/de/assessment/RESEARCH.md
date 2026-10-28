# de-vi assessment research base (clean-room)

Authored for this project (P3d, 2026-10-28). It is the provenance register for the
`sourceRef` keys used in `objectives.json` and records how the German objectives
were derived. **No CEFR descriptor text is reproduced anywhere in this
repository.** The structure follows `content/fr/assessment/RESEARCH.md` and
`content/es/assessment/RESEARCH.md`; everything said there about the framework
model, the claim gate and parallel forms applies unchanged and is not repeated
here.

## Primary sources

- **Council of Europe — CEFR Companion Volume (2020)**: *Common European
  Framework of Reference for Languages: Learning, teaching, assessment —
  Companion Volume*, Council of Europe Publishing, Strasbourg, 2020.
  https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4
- **Council of Europe — CEFR descriptors page**:
  https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors
- **Profile deutsch** (Glaboniat, Müller, Rusch, Schmitz, Wertenschlag;
  Langenscheidt) — the German reference-level inventories. Used as context only
  (see the boundary below).

Nothing here quotes official descriptor wording, so no verbatim accuracy is
claimed or needed.

## How the German objectives were derived

The objectives mirror the French and Spanish sets (`plan/authoring/BLUEPRINT.md`
§8): the same nine categories, the same 23 essential objectives and the same CEFR
scale alignments, because the scales describe communicative activities and
competences independently of the language. German has one more grammar objective
(35 in total): the subject/object article change is a separate, non-essential
objective because it is the first case contrast Vietnamese speakers meet (brief
§2, §3.4). Every `title`, `canDo` and `evidenceNote` was rewritten for German and
for Vietnamese learners (`plan/authoring/briefs/de-vi.md`). Language-specific
substitutions:

| Spanish objective | German objective | why |
|---|---|---|
| `es.obj.gender.agreement` | `de.obj.gender.plurals_kein` | German gender is not predictable from meaning; the A1 pain points are the plural patterns (always *die*) and *kein* (brief §3.2-3) |
| — | `de.obj.cases.accusative` | *der → den*, *ein → einen*; the dative only in set phrases (brief §3.4-5) |
| `es.obj.verbs.ser_estar_present` | `de.obj.verbs.sein_haben_present` | the two auxiliaries every A1 sentence needs (brief §3.6) |
| `es.obj.verbs.regular_present` | `de.obj.verbs.regular_present` | person endings and the common vowel changes (brief §3.6) |
| `es.obj.verbs.tener_ir_hacer_present` | `de.obj.word_order.verb_second` | verb-second, inversion after a time word, yes/no and W-questions (brief §3.7, §3.11) |
| `es.obj.verbs.ir_a_infinitive` | `de.obj.verbs.separable_modal` | the sentence bracket: separable verbs and *können / möchten / müssen* + infinitive at the end (brief §3.8-9) |
| `es.obj.verbs.preterite_recognition` | `de.obj.verbs.perfekt_recognition` | recognition of high-frequency Perfekt forms only (brief §3.10); kept at A2 *supports* |
| `es.obj.spelling.written_accents` | `de.obj.spelling.capitals_umlaut` | the orthographic-control objective: capital nouns, umlaut, ß / ss (brief §3.18) |
| `es.obj.pronunciation.stress_r` | `de.obj.pronunciation.vowels_ch` | the phonological-control objective: ü / ö, the two *ch*, vowel length, final devoicing (brief §2, §3.15) |
| `es.obj.strategy.cognate_transfer` | `de.obj.strategy.cognates_compounds` | international words, transparent compounds, false friends for English speakers (brief §2, §3.17) |

The speaking objectives cue meaning in **Vietnamese**; the German target is never
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

Same rule as French and Spanish: `direct` only where the course genuinely assesses
the communicative ability at that level within its stated scope (evidence notes
say what is NOT assessed); everything else is `supports`. Doubt resolves to
`supports`. The interaction and speaking objectives rely on the same
deterministic scenario and recognised-word graders as French.

## Profile deutsch boundary

*Profile deutsch* defines German-specific inventories (grammar, functions,
notions, vocabulary) per level. It is a copyrighted publication. This project
uses its existence and its level structure as context only, copies no
inventories, tables, item lists or exercises from it, and cites it only as
bibliography.

## Exam-track boundary (Goethe-Zertifikat A1: Start Deutsch 1)

The Start Deutsch 1 exam track reproduces the *public format* of the exam (parts,
task types, timing, scoring structure) with original items only. No official
exam item, model paper (Modellsatz) or model answer is copied. Results are worded
as an estimated readiness ("mức sẵn sàng ước tính"), never as a prediction of
passing, following the same honesty rules as the CEFR-aligned estimate. telc
Deutsch A1 and ÖSD A1 are named in the brief as alternatives only; no track is
built for them.

## Assessment limitations

As for French and Spanish: synthesized bundled audio only, recognised words only
for speech (never a pronunciation-quality score), rubric slots for writing,
deterministic scenarios for interaction. The A1 estimate is a CEFR-aligned
estimate, not an official examination or certification.

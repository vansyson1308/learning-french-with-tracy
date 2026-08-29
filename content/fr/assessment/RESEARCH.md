# Phase 6 assessment research base (clean-room)

Authored for this project. Facts below are framework knowledge verified
against the official sources listed; **no descriptor text is reproduced**
anywhere in this repository (see the paraphrase policy). This file is the
provenance register for `sourceRef` keys used in `objectives.json`.

## Primary sources

- **Council of Europe — CEFR Companion Volume (2020)**: *Common European
  Framework of Reference for Languages: Learning, teaching, assessment —
  Companion Volume*, Council of Europe Publishing, Strasbourg, 2020.
  Canonical document: https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4
- **Council of Europe — CEFR descriptors page**:
  https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors
- **Council of Europe — Reference Level Descriptions (RLDs)**:
  https://www.coe.int/en/web/common-european-framework-reference-languages/reference-level-descriptions-rlds-developed-so-far

**Access note (environment honesty):** `coe.int` and `rm.coe.int` are
egress-blocked from this build environment. The references above were
identified and cross-checked through public search results and secondary
summaries during Phase-6 research; the framework structure used here
(levels incl. Pre-A1; activities/strategies/competences organisation;
action-oriented approach) is standard published CEFR knowledge. Nothing
in this repository quotes official descriptor wording, so no verbatim
accuracy against the blocked documents is required or claimed.

## Framework model used

- **Levels**: PRE_A1, A1, A2, B1, B2, C1, C2. Pre-A1 is a documented
  milestone below A1 in the Companion Volume; the earliest course content
  aligns most honestly there rather than at A1 (§14).
- **What vs how (§7-8)**: CEFR proficiency is defined by what learners can
  DO with language (communicative language activities: reception,
  production, interaction, mediation) enabled by RESOURCES (communicative
  language competences: linguistic, sociolinguistic, pragmatic — plus
  strategies). Grammar/vocabulary knowledge alone never implies a level.
- **Action-oriented chain (§9)**: objective → learning activity →
  assessment evidence, modelled explicitly in this directory.

## sourceRef register

Every `cefrAlignments[].sourceRef` in `objectives.json` uses a key below.
Keys name the CEFR scale consulted; they are references, not quotations.

| key | CEFR scale (Companion Volume 2020) |
|---|---|
| `cefr-cv-2020:overall-reading-comprehension` | Overall reading comprehension (incl. Pre-A1 band) |
| `cefr-cv-2020:conversation` | Conversation (spoken interaction) |
| `cefr-cv-2020:sociolinguistic-appropriateness` | Sociolinguistic appropriateness |
| `cefr-cv-2020:vocabulary-range` | Vocabulary range (linguistic competence) |
| `cefr-cv-2020:grammatical-accuracy` | Grammatical accuracy (linguistic competence) |
| `cefr-cv-2020:orthographic-control` | Orthographic control (linguistic competence) |
| `cefr-cv-2020:phonological-control` | Phonological control |
| `cefr-cv-2020:identifying-cues-inferring` | Identifying cues and inferring (reception strategy) |
| `cefr-cv-2020:overall-listening-comprehension` | Overall listening comprehension (Phase 7; incl. Pre-A1 band) |
| `cefr-cv-2020:audio-media-recordings` | Listening to audio media & recordings (Phase 7) |
| `cefr-cv-2020:announcements-instructions` | Listening to announcements & instructions (Phase 7) |
| `cefr-cv-2020:understanding-conversation` | Understanding conversation between other speakers (Phase 7) |
| `cefr-cv-2020:reading-correspondence` | Reading correspondence / short messages (Phase 7) |
| `cefr-cv-2020:reading-orientation` | Reading for orientation — signs, notices (Phase 7) |
| `cefr-cv-2020:overall-oral-production` | Overall oral production (Phase 8; incl. Pre-A1 band) |
| `cefr-cv-2020:sustained-monologue-describing` | Sustained monologue: describing experience (Phase 8) |
| `cefr-cv-2020:sustained-monologue-giving-information` | Sustained monologue: giving information (Phase 8) |
| `cefr-cv-2020:overall-written-production` | Overall written production (Phase 9; A1 row snippet-verified — see content/fr/writing/RESEARCH.md) |
| `cefr-cv-2020:overall-written-interaction` | Overall written interaction (Phase 9; A1 row snippet-verified) |
| `cefr-cv-2020:notes-messages-forms` | Notes, messages and forms (Phase 9; A1 row snippet-verified) |
| `cefr-cv-2020:correspondence` | Correspondence (Phase 9; used conservatively — verification status in content/fr/writing/RESEARCH.md) |
| `cefr-cv-2020:overall-oral-interaction` | Overall oral interaction (Phase 9; A1 row snippet-verified — see content/fr/interaction/RESEARCH.md) |
| `cefr-cv-2020:information-exchange` | Information exchange (Phase 9; A1 row snippet-verified) |
| `cefr-cv-2020:obtaining-goods-services` | Obtaining goods and services (Phase 9; A1 row snippet-verified) |

## Descriptor paraphrase policy (§10, §141)

- User-facing `canDo` text is ORIGINAL app wording written for this course's
  actual content. It never copies Companion Volume descriptor sentences.
- Alignments record only: level + scale name + relation + sourceRef.
- The Companion Volume carries a standard Council of Europe reproduction-
  permission notice; because nothing is reproduced, no permission is
  required. If future work ever wants verbatim descriptors, it must first
  obtain/verify written permission — until then, paraphrase only.

## direct vs supports (§18-19, §166)

- `direct` — the objective closely represents the communicative ability the
  scale describes at that level AND the course genuinely assesses it.
  Phase 6 grants exactly ONE direct alignment:
  `fr.obj.reading.familiar_words` @ PRE_A1 overall reading comprehension —
  written recognition of familiar words and learned phrases is precisely
  what the course's recognition exercises assess.
- `supports` — the objective develops linguistic resources (grammar,
  vocabulary, orthography, phonology awareness, strategies) that support
  descriptors without constituting the communicative activity. Everything
  else is `supports`. Doubt resolves to `supports`, always.

## French Reference Level Descriptions boundary (§13)

The French RLD series — *Niveau A1.1 / A1 / A2 / B1 / B2 / C1-C2 pour le
français (un référentiel)*, Beacco, Porquier et al., Éditions Didier —
exists and defines language-specific inventories for French. These are
copyrighted commercial publications. This project:

- uses their EXISTENCE and methodology as context only;
- copies no inventories, tables, item lists or exercise content from them;
- cites them only as bibliography.

## Assessment limitations (§15, §129-130)

The current product assesses through: written recognition (selects,
fillBlank, match), typed production of words/forms (typeAnswer,
conjugationCloze), and grammar choice (articleSelect). It does NOT assess:

- spoken production or spoken interaction (no STT, by mandate),
- listening beyond optional word-level TTS (not used in scored assessment
  in Phase 6),
- extended reading (texts), extended writing (composed sentences).

Consequently the overall-level claim gate is expected to report every
evaluated level as NOT claimable, including PRE_A1 — the required
communicative-activity domains (spoken reception/production, interaction)
have no assessable objectives yet. This is the honest finding Phase 6
exists to make precise (§178).

## Overall-level claim policy (§98-103)

`claim-policy.json` is the machine-readable rule set:

- Required domains for an overall claim at ANY evaluated level:
  spoken_reception, written_reception, spoken_production,
  written_production, interaction.
- A domain counts only through objectives with a DIRECT alignment at the
  level AND real checkpoint assessment coverage.
- Vocabulary counts, lesson counts and XP are never inputs (§100-101).
- Even a claimable level would be worded as a "CEFR-aligned estimate",
  never a certification (§102); no Council of Europe endorsement is stated
  or implied anywhere in the product (§11).

## Product boundary statements (§11-12)

- The app never claims: "Certified by the Council of Europe", "Official
  CEFR test", or any endorsement.
- The in-app disclaimer explains: learning goals are aligned with selected
  CEFR descriptors; the app's assessments are course-based learning
  diagnostics, not an official CEFR examination or certification.

## Retakes, versioning and parallel forms (Phase 9 §38-§40)

The retake policy, in full:

- **Latest valid attempt wins.** A learner's standing per objective is
  the most recent checkpoint attempt that produced a REAL verdict
  (`demonstrated` or `needs_practice`) for that objective — in both
  directions: a later `needs_practice` supersedes an earlier
  `demonstrated`, and vice versa. `insufficient_evidence` is thin
  sampling, not a verdict: it never overwrites anything and never counts
  against the learner.
- **History is never rescored.** Attempts are append-only records
  (bounded to the most recent 5 per checkpoint id). Content updates
  never rewrite or re-grade a stored attempt; instead every attempt
  carries the `checkpointVersion`, `formId` and `formVersion` in force
  when it was sat, so old records stay interpretable after the content
  evolves. Attempts recorded before forms existed carry no form fields
  and keep their full standing.
- **Parallel forms.** A checkpoint MAY declare ≥2 named forms — subsets
  of its item bank that each independently satisfy the per-objective
  criteria floor (validator-enforced, so no form can be structurally
  unable to demonstrate an objective). A sitting administers exactly one
  form, selected deterministically by rotation over the learner's prior
  attempt count at that checkpoint: the second sitting is a different
  form, never a memory test of the first. A checkpoint without declared
  forms administers its whole bank as the single implicit form `full`.
- **Why the six section checkpoints are single-form.** Each bank sits
  deliberately at the claim gate's 3-items-per-direct-objective floor;
  splitting it into disjoint forms would drop per-sitting evidence below
  the checkpoint's own published criteria, and overlapping micro-forms
  would trade real evidence for cosmetic variety. The A1 capstone is the
  surface sized for genuine parallel forms and is built on exactly this
  machinery.

# Phase 7 Reception Research — Listening & Reading

Status: working research record for the receptive-French system (Phase 7).
Everything learner-facing that follows from this document is **original,
app-owned wording**. No Council of Europe descriptor text is reproduced here
or anywhere in the product (same clean-room rule as
`content/fr/assessment/RESEARCH.md`).

## 1. Primary framework sources (consulted by identity)

- Council of Europe, *Common European Framework of Reference for Languages:
  Learning, teaching, assessment — Companion Volume* (2020). Canonical:
  https://www.coe.int/en/web/common-european-framework-reference-languages
  and https://rm.coe.int/common-european-framework-of-reference-for-languages-learning-teaching/16809ea0d4
- CEFR illustrative descriptor set (2020 update), reception scales.
- CEFR guidance on course planning and on tests/examinations (the CEFR site's
  "Tests and examinations" and curriculum-planning pages).

**Environment limitation (recorded honestly):** `coe.int` / `rm.coe.int` are
egress-blocked from this build environment (verified again at Phase-7 start;
HTTP CONNECT 403 from the proxy). As in Phase 6, the framework is used at the
level of its public structure — scale names, level ordering, the
reception/production/interaction/mediation model — from professional
knowledge of the 2020 Companion Volume, cited by canonical URL. No descriptor
sentence is quoted, so no reproduction-permission question arises. Before any
store-facing marketing ever *names* CEFR beyond the disclaimers, re-verify
wording against the live documents from an unrestricted environment.

## 2. Reception model

CEFR reception separates at least:

- **aural reception (listening)** — `spoken_reception` in our objective model
- **visual reception (reading)** — `written_reception`
- audio-visual reception (e.g. video with text) — out of Phase-7 scope.

### Listening is not one skill
Reception scales relevant to this course's beginner scope (consulted as a
family, paraphrased titles):

- overall listening comprehension
- understanding conversation between other speakers
- listening to announcements and instructions
- listening to audio media & recordings

### Reading is not one skill
- overall reading comprehension
- reading correspondence (short messages)
- reading for orientation (signs, notices, finding information)
- reading for information & argument
- reading instructions

Phase 7 targets the **Pre-A1/A1 band** of these families only: familiar
words, very short simple texts and clips, concrete everyday content,
slow/clear delivery.

## 3. Source-reference register (Phase 7 additions)

These keys extend the `cefr-cv-2020:*` register defined in
`content/fr/assessment/RESEARCH.md` and are valid `sourceRef` values for
Phase-7 objective alignments:

| key | scale family (paraphrased) |
|---|---|
| `cefr-cv-2020:overall-listening-comprehension` | overall aural reception |
| `cefr-cv-2020:understanding-conversation` | understanding conversation between other speakers |
| `cefr-cv-2020:announcements-instructions` | listening to announcements & instructions |
| `cefr-cv-2020:audio-media-recordings` | listening to audio media & recordings |
| `cefr-cv-2020:reading-correspondence` | reading correspondence / short messages |
| `cefr-cv-2020:reading-orientation` | reading for orientation (signs, notices) |
| `cefr-cv-2020:reading-information` | reading for information |
| `cefr-cv-2020:reading-instructions` | reading instructions |

(The Phase-6 keys, including `cefr-cv-2020:overall-reading-comprehension`,
remain valid.)

## 4. Task-difficulty authoring model (NOT psychometrics)

These are **authoring specifications** recorded per clip/text in
`authoringSpec`. They are design controls, not calibrated difficulty scores
(§119: no IRT/Rasch/theta without pilot data).

Listening variables: clip duration (s) · speech rate (authored playback
rate) · speaker count · lexical familiarity (share of transcript tokens
inside the course lexicon at the intended frontier) · syntactic complexity
(clause count) · information units · inference demand (locate vs infer) ·
allowed listens · distractor competition.

Reading variables: text length (tokens) · sentence length · lexical
familiarity · grammatical complexity · text type (notice / message /
dialogue / description / info) · information units · inference demand ·
competing information · question complexity.

Beginner authoring rules derived from these:
- clips ≤ ~12 s; one or two speakers; one to three information units
- texts ≤ ~60 tokens at unit 2, ≤ ~90 by unit 5
- locate-type questions dominate; inference appears only in unit 5 and stays
  context-supported
- new (uncovered) lexical load per text small and glossed in learning mode

## 5. Audio policy

- **Scored listening input is bundled, deterministic audio only.** Device
  TTS (`expo-speech`) varies by OS/voice/version and is never a scored
  stimulus; it remains the learning-mode fallback for lexical playback.
- Scored playback: authored normal rate only, replay capped (2 deliberate
  plays), no seeking, no transcript before answering. These caps are
  **product-local assessment rules**, not CEFR prescriptions.
- Learning playback: play/replay freely, optional slow mode (~0.85×, pitch
  corrected), transcript available after answering.
- Backgrounding pauses scored audio; background time never counts as
  listening. A hardware interruption (headphone/Bluetooth disconnect) is a
  technical interruption, never a consumed play or learner failure.
- An "I can't use audio right now" affordance exists everywhere audio is
  required; in scored contexts it yields skipped/insufficient evidence,
  never "wrong" (§69, §104, §110).

## 6. Accent & voice policy (evidence limitation)

Phase-7 audio is synthesized, clear, standard metropolitan French from a
small pinned voice set. The product therefore claims — and the claim-gate
report records — only comprehension of **clear standard synthesized speech
with limited speaker/accent diversity**. Broad accent comprehension is a
later-maturity goal and is explicitly out of evidence scope.

### Voice selection record (canary evidence)

- **fr_FR-siwis-medium** (CC BY 4.0) — PASSED the canary ASR audit
  (workflow run 33230542810): mean WER 0.19 over the 14-item phonetic
  canary, with residual errors dominated by the ASR normalizer counting
  digit renderings of numbers as word mismatches. Speaker A.
- **fr_FR-mls-medium** (CC BY 4.0) — EXCLUDED on quality. Same run, same
  pipeline: mean WER 0.98–2.47 across all eight sampled speakers, with
  Whisper hallucinating unrelated French on roughly half the clips — the
  audio is not reliably intelligible, and intelligibility IS the scored
  construct (P7 §40, §56-60). License was clean; the exclusion is
  recorded in audio-source-manifest.json `excludedVoices`.
- **fr_FR-upmc-medium** (CC BY-SA 4.0, two speakers: Jessica, Pierre) —
  ADOPTED as speaker B after passing the same fail-closed recon + canary.
  Its share-alike license is accepted deliberately: the project already
  publishes derived data under CC BY-SA 4.0 with an in-app attributions
  screen (approved plan §AC2; registry entries `piper-voice-*`), so the
  obligations are already implemented. The first recon attempt failed
  closed on the then-CC-BY-only allow list — working exactly as designed —
  and the allow list was then aligned with the project-wide
  LICENSE_ALLOWLIST (CC BY / CC BY-SA, text and URL spellings).
  AGPL/GPL/NC/ND stay denied (fr_FR-tom-medium remains excluded).
  Canary verdict (run 33231334069): speaker 1 mean WER 0.197, speaker 0
  0.209, siwis 0.184 through the identical pipeline — both speakers on
  par with siwis. **Speaker 1 pinned** for voiceCast B: best WER of the
  two and a male voice, giving dialogues a clear contrast with siwis
  (female) for who-is-speaking comprehension.

## 7. Reading policy

- All reading texts are original project-authored (`original-project`
  sourceRef). CEFR illustrative tasks, exam passages and textbook texts are
  design references only — never copied.
- Learning mode may offer tap-to-gloss for the small supported-unknown load;
  scored mode disables lexical help before answering, and revealed
  assistance disqualifies/marks the evidence (§54-55, §98).
- Dialogue texts carry explicit speaker labels (never color-only).

## 8. Claim-gate hardening (Phase 7, Part II)

Phase 6's gate required only `minAssessedObjectivesPerDomain: 1` with ≥2
scored items per objective. That is honest for "assessed at all" but too
thin to ever ground an overall-level claim. Phase 7 hardens the gate with
**breadth requirements**, all of them **internal evidence-sufficiency
rules — product-local, and in no sense Council of Europe cut scores**:

- ≥1 direct-aligned objective per required domain, each assessed by
  ≥`minItemsPerDirectObjective` scored items (raised to 3)
- ≥`minDistinctInputsPerDirectObjective` (2) independent source inputs
  (distinct clips/texts; three questions about one clip are one input)
- ≥`minTaskFamiliesPerDomain` (2) distinct task families across the
  domain's assessed direct objectives
- ≥`minDistinctScalesPerDomain` (2) distinct aligned CEFR scale families

Consequence accepted deliberately: Pre-A1 `written_reception`, previously
"covered" by one familiar-word select family, reports
`insufficient_breadth` until Phase-7 reading content genuinely adds a second
construct family with independent inputs. The gate got stricter before the
content got richer — in that order on purpose (§10).

**Overall A1 remains not claimable after Phase 7**: `spoken_production` and
`interaction` have no objectives and no assessment. This is the expected
result, not a failure (§15, §121).

## 9. TTS limitations (assessment honesty)

Synthesized speech can mispronounce numbers, liaison contexts, proper names
and rare homographs. Every scored clip passes a technical gate and a
linguistic listening review; any clip with a known-bad rendering is
rewritten or replaced, never shipped (§125). ASR-based auditing, if used, is
a secondary technical check — not a linguistic oracle (§41).

## 10. What Phase-7 evidence will and will not prove

Will: beginner-scope understanding of short clear synthesized spoken French
and short simple written French, demonstrated in scored checkpoint tasks.

Will not: spoken production, interaction, sustained listening, accent
diversity, authentic-speed conversation, or any overall CEFR level.

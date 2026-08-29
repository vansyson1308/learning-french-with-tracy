# Written production at A1 — research notes (Phase 9)

Construct research for the Section-5 writing system. Framework reference:
Council of Europe, *CEFR Companion Volume* (2020). All can-do wording in
this app is ORIGINAL — descriptor text is studied for construct meaning,
never copied into learner-facing content. Direct coe.int/rm.coe.int access
is egress-blocked in the build environment; each scale below records how
its A1 row was verified.

## The construct (P9 §12, locked)

Written production at A1 is **producing short meaningful language about
familiar, personal, concrete matters** — not typing one missing verb.
Filling a blank or translating a supplied sentence exercises orthography
and forms (SUPPORTING evidence); production requires the learner to decide
*what to say* within a communicative frame and write it. A1 output is
"simple isolated phrases and sentences" — connected discourse, register
control, and audience adaptation are NOT A1 constructs and must not leak
into rubrics.

Two task classes follow (P9 §15):

- **Open writing practice** — freer expression, local structural feedback,
  never assessment-grade evidence on its own.
- **Guided assessable writing** — the task fixes the communicative
  requirements (which information slots must be present) tightly enough
  that a conservative deterministic rubric can grade it. Only this class
  yields direct written-production evidence.

## Scales studied and their A1 meaning (own words)

| Scale (register key) | A1 expectation (paraphrased) | Verification |
|---|---|---|
| Overall written production (`cefr-cv-2020:overall-written-production`) | writes simple isolated phrases and sentences | snippet-verified 2026-08-29 (search results quoting the CV row verbatim) |
| Overall written interaction (`cefr-cv-2020:overall-written-interaction`) | asks for or passes on personal details in written form | snippet-verified 2026-08-29 |
| Notes, messages and forms (`cefr-cv-2020:notes-messages-forms`) | fills the concrete fields of a simple form — numbers, dates, own name, nationality, address, age | snippet-verified 2026-08-29 |
| Correspondence (`cefr-cv-2020:correspondence`) | writes a very short, simple message of the postcard kind (greetings + one or two facts) | training-knowledge, official page blocked — used conservatively; our tasks demand LESS than this row, never more |
| Creative writing | simple phrases/sentences about self and others, where they live, what they do | training-knowledge only → **not used for any direct mapping**; the same ground is covered by the verified scales above |

Interaction-strategy scales (turn-taking, asking for clarification) belong
to the interaction research notes; their A1 rows could not be verified from
this environment and are **excluded from direct written/oral mappings**.

## Task families (Section 5)

Derived from the verified scales, each family names the scale it measures:

1. `personal_profile` — give simple personal information in writing (name,
   age, nationality, home, work/study). → overall-written-production +
   overall-written-interaction.
2. `simple_description` — one to three short sentences about a familiar
   person/place/thing (likes, location, possession). →
   overall-written-production.
3. `short_message` — a two-to-three-element practical note (greeting +
   fact + question or closing) to a named reader. → correspondence +
   overall-written-interaction.
4. `simple_form` — discrete concrete fields (name, nationality, age, city,
   date). → notes-messages-forms.

No essays, no narratives, no opinion pieces — those are A2+ constructs.

## Rubric philosophy (P9 §16-§19)

- Deterministic and local. No LLM anywhere in scoring.
- A rubric checks **communicative requirements** (required information
  slots with accepted lexical/form variants), **minimum meaningful
  length**, **French-language plausibility** (known lexeme/function-word
  coverage), and **anti-gaming rules** (prompt-copy detection, English-only
  responses) — never free grammar judgment the engine cannot defend.
- Tri-state output (`meets_rubric` / `does_not_meet_rubric` /
  `insufficiently_scorable`): when the deterministic engine genuinely
  cannot classify, the honest state is *insufficient evidence*, never a
  fail (P9 §17).
- Feedback names missing slots ("You included the place, but not the
  time") and never emits pseudo-precision ("82% writing quality").

## What this system does NOT claim

- No spelling/grammar CORRECTNESS scoring beyond taught, task-specific
  structures the engine can actually check.
- No claim that rubric-met writing equals examiner-rated A1 writing —
  wording stays "CEFR-aligned estimate".
- Open free-writing practice never mints assessment evidence.

## Sources

- Council of Europe, CEFR Companion Volume (2020) — framework reference
  (rm.coe.int; egress-blocked here, rows verified via search snippets as
  recorded above).
- Existing register `CEFR_SOURCE_REFS` in `scripts/lib/assessment.ts` —
  Phase-9 keys added alongside these notes.

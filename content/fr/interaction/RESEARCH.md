# Spoken interaction at A1 — research notes (Phase 9)

Construct research for the Section-6 interaction system. Framework
reference: Council of Europe, *CEFR Companion Volume* (2020). All can-do
wording in this app is ORIGINAL. Direct coe.int/rm.coe.int access is
egress-blocked in this environment; per-scale verification status is
recorded below.

## The construct (P9 §11, locked)

**Interaction ≠ multiple independent speaking prompts.** Interaction
exists only when there is genuine CONTINGENCY:

    partner turn → learner understands and reacts → the learner's turn
    influences what happens next → the partner responds → the exchange
    proceeds (or is repaired)

A fixed sequence of questions that continues identically regardless of
what the learner says is spoken production with decoration, and may never
carry a direct interaction alignment. The engine must therefore branch on
the RECOGNIZED MEANING of the learner turn (authored intents + slots), and
the assessment records whether the communicative goal of the exchange was
achieved — not merely whether each utterance matched a string.

## The supportive interlocutor (P9 §29)

The verified A1 anchor row (Overall oral interaction) states that A1
communication is *dependent on repetition at a slower rate, rephrasing and
repair*. Support is therefore PART of the construct, not a concession:

- the learner may ask for a repeat, a slower/rephrased turn, or
  clarification where the scenario supports it;
- using a permitted support move never fails the exchange by itself;
- `supportUsed` / `repairMoves` / goal completion are recorded as
  assessment metadata so scoring can stay honest about HOW the goal was
  reached;
- unlimited re-answering is NOT support: first-attempt semantics govern
  the scored learner turns (P9 §37) — a repair move changes the PARTNER's
  next turn; it does not reopen a judged learner turn.

## Scales studied and their A1 meaning (own words)

| Scale (register key) | A1 expectation (paraphrased) | Verification |
|---|---|---|
| Overall oral interaction (`cefr-cv-2020:overall-oral-interaction`) | interacts simply; communication depends on slower repetition, rephrasing and repair; asks/answers simple questions in areas of immediate need | snippet-verified 2026-08-29 (row quoted verbatim in search results) |
| Conversation (`cefr-cv-2020:conversation`, registered since Phase 6) | introductions, basic greeting and leave-taking, simple social exchange with a sympathetic interlocutor | snippet-verified 2026-08-29 |
| Information exchange (`cefr-cv-2020:information-exchange`) | asks and answers simple questions about self and others — where they live, people they know, things they have | snippet-verified 2026-08-29 |
| Obtaining goods and services (`cefr-cv-2020:obtaining-goods-services`) | asks for things and gives things; handles numbers, quantities, cost and time | snippet-verified 2026-08-29 |
| Turn-taking / Asking for clarification (strategy scales) | — | NOT reliably verifiable from this environment at A1 → **excluded from direct mappings**; repair behavior is anchored on the verified overall-oral-interaction row instead |

## Scenario design implications (Section 6)

- Domains: meeting someone; café/shop exchanges; places, directions and
  simple information; plans, preferences and everyday needs — all inside
  the verified A1 scales above.
- Every scenario is an authored finite graph (partner turns, learner
  turns, branches, terminals). Every learner turn names the small set of
  authored INTENTS it can recognize (deterministic n-best matching on the
  Phase-8 transcripts — no general NLU, no LLM), and every intent leads to
  a contextually appropriate partner response. Unrecognized speech routes
  to an authored repair branch (repeat/rephrase), never a dead end.
- Scored scenarios must contain multiple contingent turns; one isolated
  microphone prompt is never interaction evidence (P9 §36, §80).
- Technical speech states (no recognizer, permission, STT failure) are
  insufficient evidence — never learner failure (P9 §71).

## Evidence boundary (P9 §33)

Interaction produces course-objective / assessment evidence only. It does
NOT mutate recognize/listen/speak FSRS cards merely because a word occurred
in conversation — lexical memory and communicative interaction remain
distinct constructs with distinct stores.

## Sources

- Council of Europe, CEFR Companion Volume (2020) — framework reference
  (rm.coe.int; egress-blocked here, rows verified via search snippets as
  recorded above).
- Phase-8 speech research (`content/fr/speech/RESEARCH.md`) — capture,
  n-best transcripts, technical-state taxonomy this engine builds on.

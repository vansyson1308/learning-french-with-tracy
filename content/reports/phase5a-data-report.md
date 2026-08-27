# Phase 5A data report — Lexique 4 activation

The factual record of what was acquired, verified, cross-checked and
activated. Everything below is reproducible from committed artifacts;
nothing claims data the repository does not carry.

## 1. Source identity (pinned forever)

| | |
|---|---|
| Dataset | Lexique 4.00 (New, Pallier, Schalchli, Bourgin & Gimenes, 2026) |
| Artifact | `Lexique400.tsv` from `https://lexique.org/databases/Lexique400/Lexique400.tsv` |
| Retrieved | 2026-08-27, GitHub-hosted runner via the dispatch-only workflow (`.github/workflows/lexique-source.yml`) |
| Identity | 33,067,258 bytes · 189,863 data rows · 37 columns · UTF-8 no BOM |
| SHA-256 | `fe333b4f9e1797f23922d5863cde28635ee13685813af0f9b4b4b9f7d4610a5a` |
| License | CC BY-SA 4.0 (official README, committed at `content/fr/lexicon/derived/README-Lexique400.txt`) |
| Reproducibility | every acquisition run downloads twice; both downloads must hash identically; extract/import fail closed on any hash drift |
| Raw-data policy | the TSV is a 90-day workflow run artifact only — never committed; the repository carries deterministic derived datasets |

Column roles are documented from evidence in
`content/fr/lexicon/LEXIQUE4_COLUMNS.md` (recon profile:
`derived/lexique4-recon.json`). The real 37-column layout replaced the
Lexique 3 lineage names Phase 4 had declared as placeholders.

## 2. 54-core cross-check (§13–15)

`bun run lexicon:crosscheck` → `derived/core-crosscheck.json`. Final state:

| Field | agree | other |
|---|---|---|
| lookup | 51 | 3 not-applicable (expressions, never matched by design) |
| lemma | 51 | — |
| partOfSpeech | 49 | 2 disagree — bonjour/bonsoir, documented taxonomy divergence (below) |
| gender | 40 | 1 external-missing (œuf: the source row carries no genre — authored masculine stands on the internal article audit), 1 ambiguous (gauche: source épicène by sense-mixing; authored feminine kept for the taught sense) |
| pronunciation | 51 | — |
| frequency | 51 | — |

Match audit: 49 strict matches, 2 justified overrides, 3 expressions.
Dispositions (zero silent corrections — every change listed):
`content/fr/lexicon/REVIEW.md` pass 3. The two overrides
(`content/fr/lexicon/match-overrides.json`) adopt the NOM rows of
bonjour/bonsoir for measurements while the authored `interjection`
classification stands; the validator rejects overrides for matched items,
expressions, phantom rows and duplicates.

Independent quality signal: 45 of the 51 authored Phase 4 IPA values
matched the source's dedicated genuine-IPA column exactly (under the
documented normalization); the 6 differences were systematic
transcription conventions (mid-vowel o/ɔ, /ɑ/→/a/, ɡ vs ASCII g), all
resolved by adopting the source transcription verbatim.

## 3. Activated measurements (§16–19)

Per effectively-matched lexeme (51 of 54; the 3 expressions stay fully
project-authored):

- **frequency.rawValue** — `12_FreqLemme`, occurrences per million
  (scale confirmed: the eligible-population maximum is être at 35,040/M).
- **frequency.rank** — 1-based rank in the full eligible lemma population
  (64,836 learnable lemmas; `derived/core-ranks.json`); honestly absent
  for merci/salut/pardon, whose ONO category the population does not rank.
- **frequency.band** — §18 population-quantile derivation, never
  hardcoded: very-common = top 1% (≥ 97.203/M, p99), common = top 5%
  (≥ 12.472/M, p95), less-common = rest (`derived/frequency-stats.json`;
  the validator recomputes every stored band from its rawValue).
  Curriculum split: 23 very-common / 25 common / 3 less-common —
  discriminative, where coarser quantiles collapsed all items into one band.
- **pronunciation** — `3_Phono_IPA` verbatim (genuine IPA; `2_Phono`'s
  ASCII alphabet is never labeled IPA and the validator rejects the
  mislabel by character class).
- **provenance** — a `lexique-4` sourceRef with the adopted
  `Mot|Cgram|Genre|Nombre` row key on every import; lexique-4 registered
  in the source registry with the official citation (flows to
  ATTRIBUTIONS.md and the in-app licenses screen).

Runtime: both repository tiers sort by raw per-million (rank is never the
sort key), verified equal by the executor-agnostic parity suite; the
Vocabulary Browser's Frequency sort is active; distractor tier 3
(same POS + same band) is non-vacuous and pinned by tests (§20).

## 4. Candidate pool (§21–24)

`derived/candidate-pool.json`: 1,500 authoring-only entries (never
curriculum, never cards, no fabricated glosses), plain lexical categories
only (NOM/VER/ADJ/ADV — subcategorized function words like ADJ:pos "mon"
are grammar material, not vocabulary candidates), ranked by lemma
frequency with CD, prevalence, IPA, gender, source rank and a selection
reason per §23. Data-quality loop findings, all handled with recorded
rules:

- **CD-corroboration guard**: "upas" (inherits "pas"'s 18,098/M at CD
  0.014%, prevalence 0) and "garçonne" (431.8/M at CD 0.037%) are source
  lemmatization artifacts — excluded and RECORDED in the artifact
  (`excludedByQualityGuard`), never silently dropped.
- Function-word flood (eleven of the first thirty ranks) fixed by the
  plain-category restriction above.

## 5. Population studies for Phase 5B

- **Gender × ending** (`derived/gender-suffix-stats.json`): 36,940
  gendered noun lemmas (m 21,965 / f 13,091 / e 1,884). Researched
  suffixes carry real reliabilities (-tion 99.5% f n=1895; -isme 99.8% m
  n=616; -ment 99.8% m n=1094; -age 98.5% m n=1234; -eau 96.7% m n=212;
  -ance 98.9% f; -ence 98.3% f; …) plus a data-driven ending table
  (every 2/3-letter ending with ≥30 lemmas). Known trap, recorded for the
  unit derivation: the 2-letter "-on" reads 71.9% feminine only because
  -ion (feminine) contaminates it — pattern derivation must use
  longest-distinctive-suffix logic.
- **Verb morphology** (`derived/verb-morphology.json`): complete
  inflection rows for 38 high-yield verbs (VER and AUX readings, per-form
  IPA and frequency) plus the full-file InfoVER inventory (441 raw values,
  46 atomic mood:tense:person analyses).

## 6. Conjugation-source decision (§26–29)

**Lexique 4 suffices — no additional dataset.** No Morphalou ingestion,
no scraping, no third-party conjugator. Evidence and caveats:

- `9_InfoVER` + orthographic forms recover the full curriculum scope
  (présent, futur proche via aller + infinitives, passé composé via
  AUX présent + past participles), machine-verified for 29 curriculum
  verbs by `scripts/__tests__/verb-morphology-coverage.test.ts`.
- Two source quirks were found and are documented in
  LEXIQUE4_COLUMNS.md: on high-frequency homographic forms InfoVER is a
  form-level union across lemmas (être's "suis" row also lists suivre's
  readings), and `8_Nombre` is row-level and noisy (the "peux" row says
  plural). **Consumption contract:** Phase 5B authors its conjugation
  cells and verifies each (form, cell) against this evidence — never
  blind extraction.

## 7. Honest gaps and residuals

- bonjour/bonsoir POS taxonomy divergence and gauche's épicène flag stay
  visible in the cross-check attention queue with their documented
  dispositions — by design, not oversight.
- œuf's source row carries no gender value (source gap); the authored
  masculine stands on internal evidence ("un œuf" in the example corpus).
- Population rank is absent for the three ONO-category greetings; sorting
  never depends on it.
- CD and prevalence are stored in the derived artifacts (per-form
  breadth/quality signals), not on lexemes — the lexeme carries the raw
  frequency measurement that ranking and bands actually use.
- The 3 expressions carry no external measurements — expressions are
  never lexique-matched (fail-closed rule since Phase 4).

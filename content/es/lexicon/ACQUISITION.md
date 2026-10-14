# Spanish lexicon acquisition record (P3a, lexicon ETL v2)

A factual engineering record of where every byte of `content/es/lexicon/`
comes from, how it was retrieved, and the fail-closed rules that govern
re-runs. Nothing below claims data we do not have.

## Sources (licences re-verified at fetch time, 2026-10-15)

| Registry id | Artifact (scratch name) | Official location | Licence | Identity |
| --- | --- | --- | --- | --- |
| `kaikki-en` | `kaikki-en-es.jsonl` (1,054,565,723 bytes, 811,049 entries) | https://kaikki.org/dictionary/Spanish/kaikki.org-dictionary-Spanish.jsonl | CC BY-SA 4.0 (Wiktionary) | sha256 pinned in `source-manifest.json` |
| `kaikki-vi` | `kaikki-vi-es.jsonl` (4,302,623 bytes, 4,706 entries) | https://kaikki.org/viwiktionary/Tiếng Tây Ban Nha/… | CC BY-SA 4.0 (Vietnamese Wiktionary) | pinned |
| `frequencywords` | `frequencywords-es.txt` (50,000 forms) | https://github.com/hermitdave/FrequencyWords (content/2018/es/es_50k.txt) | CC BY-SA 4.0 (content) | pinned |
| `wordfreq` | `wordfreq-es.csv` (50,000 words, Zipf) | exported from the PyPI package `wordfreq==3.1.1` (`large` list) | CC BY-SA 4.0 (data) | pinned |
| `tatoeba` | `tatoeba-es-sentences.tsv` (442,544), `tatoeba-es-links-en.tsv` (283,852), `tatoeba-es-links-vi.tsv` (591), `tatoeba-eng-sentences.tsv` (2,038,719), `tatoeba-vie-sentences.tsv` (33,223) | https://downloads.tatoeba.org/exports/per_language/… (detailed exports) | CC BY 2.0 FR | pinned |

Declared but not retrieved: none for Spanish (SUBTLEX-ESP has no confirmed
licence and is research-only; the Instituto Cervantes PCIC inventories
carry no open licence — neither is read).

The licence notes captured at acquisition are under `sources/<id>.md`; the
registry entries (`content/sources/registry.json`) carry the attribution
text that `ATTRIBUTIONS.md` and the Licences screen render.

## Retrieval (2026-10-15)

- Performed on the developer machine with `bun scripts/lexicon-etl.ts`
  (`recon` → `extract`) against the official locations above; the
  GitHub-hosted workflow `.github/workflows/lexicon-source.yml` runs the
  identical commands (with `--twice`: two retrievals must hash identically)
  and is the route for every later language and for re-pins.
- The raw artifacts (≈1.3 GB) live only in the scratch directory and were
  deleted after the run; the repository carries their identities
  (`source-manifest.json`: sha256, bytes, date) and the deterministic derived
  outputs. A future retrieval that does not hash to the pins is
  source-version drift: `extract` refuses to run until `recon` re-pins
  deliberately.
- kaikki.org regenerates its dumps regularly; a re-pin therefore changes
  the candidate pool. The authored lexeme ids (`content/es/lexemes.json`)
  are frozen and never follow a re-pin.

## Derivation (`content/es/lexicon/derived/`, generator `scripts/lib/lexicon-etl/derive.ts`)

- `frequency-stats.json` — population = lemma|pos pairs of the content
  parts of speech with a kaikki lemma entry and ≥1 FrequencyWords form; a
  form shared by several readings splits its count by the readings'
  richness (senses + examples + inflection table), a closed-class lemma
  identical to the form absorbs the whole count, letter/note readings and
  proper nouns absorb nothing. Bands exactly as French: very-common ≥ p99,
  common ≥ p95 of the population's per-million (relative to the list total).
- `candidate-pool.json` — top 3,000 content lemmas + 200 function words +
  every course-pack word (forced), each with English glosses (kaikki
  senses), Vietnamese glosses (Vietnamese Wiktionary), IPA, gender, up to 4
  examples (kaikki senses with English translation; Tatoeba sentence pairs
  as the fallback, Vietnamese link when one exists), topics (kaikki topical
  categories → `TOPIC_VALUES`), usage tags, readings (n/a), anchors (none —
  no licence-clean Spanish CEFR list exists; bands are frequency-derived).
- `morphology.json` — every pool verb's inflected forms as analysis atoms
  (`ind:pre:1`, `par:pas`, …): the evidence the Spanish paradigm cells
  (`scripts/lib/languages/es.ts`) are validated against.
- `gender-stats.json` — noun gender × ending aggregates (≥20 nouns).
- `anchors.json` — `status: frequency-derived` (honest record).
- `tatoeba-credits.json` — contributor username of every Tatoeba sentence
  used (CC BY attribution).
- `recon.json` — line counts and sample entries of each artifact.

## Authoring (`scripts/lexicon-author.ts --lang es --size 800`)

Deterministic over the committed evidence: every `es-en` pack word first
(gloss identity with the pack is a validator rule; the pack's own
sentences are the example of last resort), then the frequency population
in rank order under a per-topic quota, with a reserved share of function
words. Homograph readings of one lemma are authored once (best-ranked);
epicene nouns are `both`. The result is `content/es/lexicon/lexemes.json`
+ the frozen id map `content/es/lexemes.json`; `REVIEW.md` lists every
`TODO:vi` gloss, every Vietnamese gloss bridged through the English
Wiktionary translation table, auto-confusables, untranslated examples and
unresolved topics for the P3c review pass.

## Fail-closed rules

1. A lexeme may cite only sources the manifest records as `retrieved`;
   `frequency` fields cite the manifest's `frequencySourceId` only and their
   band must recompute from the committed quantiles.
2. `TODO:vi` is a draft marker, never a gloss: the validators refuse to
   compile any `es-vi` course while one remains (there is no `es-vi` course
   yet; `es-en` compiles with the English glosses).
3. CI never downloads anything; it validates the committed derived data
   offline (`bun run content:validate`, `content:check`).

# Lexique 4 acquisition record (Phase 4)

This file documents the provenance target for the French lexicon's external
frequency/phonology/morphology source, the acquisition attempt made when the
lexicon system was built, and the fail-closed rules that govern ingestion.
It is a factual engineering record, not marketing: nothing below claims data
we do not have.

## Source identification (verified 2026-08-27)

- **Dataset**: Lexique 4 (version line 4.00) — the current major release of
  the Lexique French lexical database, superseding Lexique 3.83.
- **Authors**: Boris New, Christophe Pallier, Gauvain Schalchli,
  Jessica Bourgin, Manuel Gimenes.
- **Publication**: New, B., Pallier, C., Schalchli, G., Bourgin, J., &
  Gimenes, M. (2026). *Lexique 4: A major upgrade of the Lexique French
  lexical database.* Behavior Research Methods.
  DOI: [10.3758/s13428-026-02967-5](https://doi.org/10.3758/s13428-026-02967-5)
  (PubMed ID 42030008).
- **Corpus** (from the publication abstract): 316 million words across
  65,317 documents (movie/TV/documentary subtitles); adds orthographic
  surface frequency, contextual diversity, and detailed morphological
  structure over Lexique 3.
- **License**: Creative Commons Attribution-ShareAlike 4.0 (CC BY-SA 4.0) —
  stated by the Lexique project for the database distribution.
- **Official distribution locations**:
  - <http://www.lexique.org> (project site and database downloads)
  - OSF repository `arjcz` (<https://osf.io/arjcz/>) — the paper's data
    deposit.

## Acquisition attempt (2026-08-27, Phase 4 build environment)

The Phase 4 build ran in a network-restricted remote container whose egress
proxy allows only GitHub hosts and package registries. Every distribution
channel for Lexique 4 was attempted and refused at the proxy
(`CONNECT` → 403 / egress-blocked):

| Host | Result |
| --- | --- |
| `lexique.org` / `www.lexique.org` | egress-blocked |
| `osf.io` / `api.osf.io` | egress-blocked |
| `link.springer.com`, `pubmed.ncbi.nlm.nih.gov`, `doi.org` | egress-blocked |
| `zenodo.org`, `hal.science`, `europepmc.org` | egress-blocked |
| `huggingface.co`, `archive.org` / `web.archive.org` | egress-blocked |
| `chrplr.github.io` / `openlexicon.fr` (GitHub Pages) | egress-blocked |
| GitHub repos (`github.com`, `raw.githubusercontent.com`, `codeload`) | reachable — **no repository hosts Lexique 4** (checked `chrplr/openlexicon`, last commit 2025-06, pre-dates the release; searched for mirrors) |
| npm / PyPI registries (allowlisted) | reachable — no Lexique 4 package exists (`pylexique` bundles Lexique 3.83 only, which this project explicitly does not use as a source) |

**Conclusion**: the official Lexique 4.00 artifact could not be retrieved
from this environment. No fallback to Lexique 3 was made (Phase 4 mandate:
Lexique 4 only), and no other dictionary/corpus dataset was substituted
(Phase 4 mandate: no Wiktionary/Kaikki/Tatoeba/FreeDict/Lingua Libre
ingestion).

## What this means for the shipped data (fail-closed rules)

1. `content/fr/lexicon/source-manifest.json` records the source with
   `retrieval.status: "not-retrieved"` and `sha256: null`. The ingestion
   command (`bun run lexicon:source:extract`) **refuses to run** until a
   developer places the official artifact locally, records its SHA-256 in
   the manifest, and confirms the column layout against the official
   documentation. There is no code path that ingests unpinned data.
2. Every learner-facing field currently shipped for the 54 curriculum
   lexemes is **newly-authored original project material** (glosses reuse
   the project's existing course content; pronunciation, examples, gender,
   topics are authored and carry `original-project` source references).
   Nothing is labeled as Lexique-derived anywhere in the data, the app, or
   the reports.
3. Frequency fields are **absent** (the Phase 4 rule is: frequency comes
   only from real Lexique measurements). UI that would need frequency
   (e.g. a frequency sort in the vocabulary browser) stays hidden while the
   data honestly cannot support it.
4. The per-lexeme source-match audit reports `source-unavailable` for all
   entries rather than inventing matches; the article-consistency audit
   runs against authored gender (a real internal-consistency gate) and
   gains the Lexique cross-check automatically once the artifact is
   ingested.
5. CI never downloads anything: ingestion is a deliberate developer-side
   action; CI validates only committed derived data.

## How the retrieval was planned (Phase 4, written before it happened)

1. Download the official Lexique 4 database export from lexique.org or the
   OSF deposit above, on a normally-networked machine.
2. `sha256sum <artifact>` and record filename, URL used, retrieval date,
   and hash in `content/fr/lexicon/source-manifest.json`
   (`retrieval.status: "retrieved"`).
3. Confirm the column layout of the artifact against the official
   documentation and update the manifest's `expectedColumns`.
4. Run the derivation and commit the derived subset + updated reports.

## Retrieval completed (2026-08-27, Phase 5A)

The plan above was executed with GitHub-hosted Actions runners as the
"normally-networked machine" (the only environment in this project's reach
whose egress includes lexique.org). Full mechanics live in
`.github/workflows/lexique-source.yml` — a workflow with exactly one
trigger, `workflow_dispatch`, so CI stays fully offline:

- **Artifact**: `Lexique400.tsv` from
  `https://lexique.org/databases/Lexique400/Lexique400.tsv` (the apex host
  serves a valid TLS certificate; `www.lexique.org` does not — curl error
  60 observed — and TLS verification was never disabled).
- **Identity**: 33,067,258 bytes, 189,863 data rows, 37 columns, UTF-8
  without BOM, sha256
  `fe333b4f9e1797f23922d5863cde28635ee13685813af0f9b4b4b9f7d4610a5a` —
  pinned in `source-manifest.json`.
- **Reproducibility**: the run downloaded the artifact twice; both
  downloads hashed identically (enforced in the workflow — a mismatch
  aborts the run).
- **Raw data policy**: the ~33 MB TSV is retained as a 90-day workflow run
  artifact for audit and is never committed; the repository carries only
  the committed reconnaissance report (`derived/lexique4-recon.json`), the
  official README (`derived/README-Lexique400.txt`, which states the
  CC BY-SA 4.0 license and the citation), and the deterministic derived
  datasets produced by `scripts/lexique-derive.ts` (extract mode).
- **Column mapping**: the real 37-column layout differs from the Lexique 3
  lineage names the Phase 4 manifest declared as placeholders; every
  column's meaning, type, null behavior and use is documented in
  `LEXIQUE4_COLUMNS.md`, and the manifest's `expectedColumns` now pins the
  real header with `toConfirm: false`.
- **Drift guard**: verification (`bun run lexicon:source:verify`) and
  derivation (`bun run lexicon:derive`) both fail loudly on any artifact
  whose hash differs from the pin — a future Lexique release is a
  deliberate re-pin, never a silent upgrade.

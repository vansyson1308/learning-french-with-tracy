# French lexicon data license

This file governs the **French lexicon dataset** in this repository — the
files under `content/fr/lexicon/` and every artifact generated from them
(the runtime lexicon index, the prebuilt SQLite lexicon database, and the
lexicon reports). It does **not** govern application code.

## The dataset: CC BY-SA 4.0

The French lexicon dataset is published under the
**Creative Commons Attribution-ShareAlike 4.0 International license**
(CC BY-SA 4.0, <https://creativecommons.org/licenses/by-sa/4.0/>).

- **Current composition** (as of 2026-10-14): **126 curriculum lexemes**
  in `content/fr/lexicon/lexemes.json`. The original material authored by
  the Learning French with Tracy project covers parts of speech, gender,
  topics, example sentences, and confusable relations for all of them;
  native glosses reuse this repository's existing MIT-licensed course
  content, which the project may and does also offer here under CC BY-SA
  4.0 as part of the dataset. **123 of the 126 lexemes additionally carry
  Lexique-4-derived fields** (frequency: `12_FreqLemme` raw value,
  population rank and quantile band; pronunciation: `3_Phono_IPA`), each
  marked by a `lexique-4` entry in its `sourceRefs`; the derived population
  statistics under `content/fr/lexicon/derived/` are Lexique-4-derived as
  well.
- **Why CC BY-SA 4.0 for original data**: the dataset is designed to be
  enriched with data derived from **Lexique 4** (New, B., Pallier, C.,
  Schalchli, G., Bourgin, J., & Gimenes, M. (2026). *Lexique 4: A major
  upgrade of the Lexique French lexical database.* Behavior Research
  Methods. <https://doi.org/10.3758/s13428-026-02967-5>), which is
  distributed under CC BY-SA 4.0. Publishing the authored portion under the
  same license keeps the combined dataset license-coherent from day one.
- **Current Lexique status**: **Lexique 4 has been retrieved and its
  derived rows are present.** The official artifact `Lexique400.tsv` is
  pinned by SHA-256 in `content/fr/lexicon/source-manifest.json` (the raw
  file is never committed; the acquisition record is
  `content/fr/lexicon/ACQUISITION.md`, the column mapping
  `content/fr/lexicon/LEXIQUE4_COLUMNS.md`). The Lexique-derived rows are
  CC BY-SA 4.0 with attribution to the Lexique authors; the per-entry
  `sourceRefs`, the `lexique-4` entry of `content/sources/registry.json`
  and the generated `ATTRIBUTIONS.md` say so.

## Application code: unchanged (MIT)

The application source code, build scripts, and everything outside the
dataset described above keep their existing licensing — see `LICENSE`
(MIT, including the preserved create-expo-app template notice). **CC BY-SA
4.0 applies to the lexicon dataset only and does not relicense, restrict,
or otherwise affect any code in this repository.** Code that merely reads
the dataset (at build time or at runtime) is not a derivative of the
dataset.

## Attribution when reusing the dataset

If you redistribute or adapt the dataset, CC BY-SA 4.0 requires
attribution and share-alike. Suggested attribution:

> French lexicon data from the Learning French with Tracy project
> (<https://github.com/vansyson1308/learning-french-with-tracy>), licensed
> CC BY-SA 4.0. Portions derived from Lexique 4 (New, Pallier, Schalchli,
> Bourgin, & Gimenes, 2026), licensed CC BY-SA 4.0 — see
> `content/fr/lexicon/source-manifest.json` for the pinned source.

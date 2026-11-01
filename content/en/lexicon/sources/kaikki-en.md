# kaikki.org Wiktextract — English (English Wiktionary edition)

- Registry id: `kaikki-en`
- Licence: CC-BY-SA-4.0
- Citation: Ylonen, T. (2022). Wiktextract: Wiktionary as Machine-Readable Structured Data. Proceedings of the 13th Conference on Language Resources and Evaluation (LREC), pp. 1395–1403. Data: https://kaikki.org/dictionary/ (Wiktionary, CC BY-SA 4.0 / GFDL).
- Artifact: kaikki-en-en.jsonl ← https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl
- Recorded: 2026-10-14 by scripts/lexicon-etl.ts recon

Wiktionary content under CC BY-SA 4.0 (and GFDL); used under CC BY-SA 4.0 with attribution to Wiktionary contributors and kaikki.org. Per-entry provenance is the word|pos key in sourceRefs.

## Later retrieval for General American IPA and verb rows (QC 2026-11-01)

- Artifact: kaikki-en-en-supplement.jsonl.gz ← https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl.gz
- Retrieved: 2026-11-02 (server Last-Modified 2026-10-30)
- sha256 of the .gz, pinned in `source-manifest.json`: 4d03b6cba283744756c57ff661c2c6cbfe34fcf8ff513a966576cf7d97e91a99 (534,186,395 bytes)
- sha256 of the .jsonl inside: ce2b80e5ad1132f14cedd2f531a606e1f0c6aeab422d50515e88db13a16a59a7 (3,431,211,190 bytes)
- Used for: `derived/ipa-general-american.json` and the verb rows of `derived/morphology.json`. The candidate pool, frequency and anchors stay on the retrieval above, which predates it.
- How: the stream is filtered to the course's words by `content/en/_drafts/_generators/en-kaikki-subset.py`, then `bun scripts/lexicon-etl.ts supplement --lang en --dir <dir>`. Nothing of the dump is committed. Same licence, CC BY-SA data files only.

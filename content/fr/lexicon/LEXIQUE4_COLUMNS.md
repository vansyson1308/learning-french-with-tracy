# Lexique 4.00 — real column layout and how this project uses it

Evidence-based column mapping for the pinned artifact
`Lexique400.tsv` (sha256 `fe333b4f9e1797f23922d5863cde28635ee13685813af0f9b4b4b9f7d4610a5a`,
33,067,258 bytes, 189,863 data rows + 1 header row, UTF-8 without BOM,
retrieved 2026-08-27 from https://lexique.org/databases/Lexique400/Lexique400.tsv).

Nothing here is assumed from Lexique 3 lore: the header, emptiness rates and
sample values come from the committed reconnaissance report
(`derived/lexique4-recon.json`, 5,000-row profile) produced runner-side from
the real artifact; descriptions additionally draw on the official README
(`derived/README-Lexique400.txt`) — which states the database provides
"frequency measures from a 316M-word subtitle corpus, contextual diversity,
phonological representations, lemmas, morphological structure, prevalence,
and lexical decision data" — and, for fields carried over from earlier
Lexique releases, on the documentation lineage the README itself points to
("the description of the databases is still useful", re: Manuel_Lexique.3.pdf).
Where a detail is interpretation rather than direct observation it is marked
**presumed** and, where it matters to us, verified mechanically by the
derivation step (`scripts/lexique-derive.ts` → `derived/frequency-stats.json`).

One row = one (word form, grammatical reading). The same orthographic form
appears in multiple rows when it has several grammatical readings
(e.g. a `VER` and an `ADJ` row).

## Columns used by this project

| # | Column | Type | Empty (5k sample) | Meaning & use |
|---|--------|------|-------------------|---------------|
| 1 | `1_Mot` | string | 0% | The word form (surface orthography), lowercase for common words. **Use:** match key for curriculum `lookupForm`s; candidate-pool lemma display; verb inflected surfaces. |
| 2 | `2_Phono` | string | 0% | Phonological form in **Lexique's ASCII alphabet** (e.g. `sibERnetisj5`, `akyz§` — `5` = /ɛ̃/, `§` = /ɔ̃/, `R` = /ʁ/, `Z` = /ʒ/). **Never IPA — never label it IPA.** **Use:** kept in derived subsets for audit only. |
| 3 | `3_Phono_IPA` | string | 0% | The same phonological form in **genuine IPA** — a Lexique 4 addition. Observed glyphs include ɔ ʁ ʒ ɛ ɔ̃ ɛ̃ (combining tilde for nasals), e.g. `pɔlak`, `sibɛʁnetisjɛ̃`, `akyzɔ̃`, `fɛʁlaʒ`. **Use:** the honest external IPA reference for the 54-core pronunciation cross-check; the only Lexique field that may ever feed a `notation: "ipa"` pronunciation, verbatim. |
| 4 | `4_Lemme` | string | 0% | Dictionary lemma of the form (`disproportionnées` → `disproportionner`, `accusons` → `accuser`). **Use:** lemma matching; grouping verb inflections; candidate-pool identity. |
| 5 | `5_Cgram` | enum | 0% | Primary grammatical category of THIS row (15 distinct in sample: `NOM`, `VER`, `ADJ`, `PRE`, `ADV`, `PRO:rel`, …). Mapped to app POS by `LEXIQUE_CGRAM_TO_POS` (scripts/lib/lexicon.ts); unmapped values are reported by the derive step, never guessed. **Use:** POS disambiguation, population filters. |
| 6 | `6_CgramOrtho` | string | 0% | Comma-joined list of ALL categories this orthographic form takes across rows (e.g. `VER,ADJ`, `NOM,ADJ,VER`). **Use:** audit context in derived subsets (homograph awareness); not parsed for matching. |
| 7 | `7_Genre` | enum | 41.1% | Grammatical gender: `m`, `f`, or `e` (épicène — either gender; a Lexique 4 value, mapped to the schema's `both`). Empty for rows where gender is not applicable (verbs, adverbs, …). **Use:** noun gender cross-check (§13–15) and the gender-pattern population study (§51–53). An external `e` never silently satisfies an authored `m`/`f` — the cross-check reports it explicitly. |
| 8 | `8_Nombre` | enum | 10.8% | Grammatical number: `s` (singular), `p` (plural), `i` (invariable). **Use:** picking the singular/lemma row in cross-checks; carries the person's number for verb readings (see `9_InfoVER`). |
| 9 | `9_InfoVER` | string | 54.7% | Verb morphology of a `VER` row as `mood:tense:person`, comma-joined when one surface has several readings (`ind:pre:1,imp:pre:1`), trailing empty person for non-personal forms (`par:pas:`). Observed moods: `inf` (infinitive), `ind` (indicative), `imp` (imperative), `cnd` (conditional), `par` (participle); observed tenses: `pre`, `imp` (imparfait — first field disambiguates: `imp:pre:*` is imperative present, `ind:imp:*` is indicative imparfait), `fut`, `pas`. Person is `1`/`2`/`3` with singular/plural carried by `8_Nombre`. The full value inventory over the real file is recorded in `derived/verb-morphology.json`. **Use:** §26 verb-morphology recovery — this column is why no additional conjugation dataset is needed. |
| 10 | `10_FreqMot` | number | 0% | Frequency of THIS (form, category) reading in the subtitle corpus, occurrences per million words (**presumed per-million** from the Lexique lineage; scale verified by the min/max recorded in `derived/frequency-stats.json`). Evidence for the reading-level interpretation: `disproportionnées` VER row has `10_FreqMot` 0.041 < `11_FreqOrtho` 0.085. **Use:** verb-form frequency in conjugation data. |
| 11 | `11_FreqOrtho` | number | 0% | Total frequency of the orthographic form across all its category readings (same units). **Use:** audit context; stored raw in derived subsets. |
| 12 | `12_FreqLemme` | number | 0% | Total frequency of the LEMMA across all its inflected forms (same units; `disproportionner` 0.339 vs single form 0.041; sample max 59.472). **The only genuinely lemma-level frequency variable in the file.** **Use:** primary ranking variable for the candidate pool and the §18 band derivation (population quantiles — never arbitrary thresholds, never row order). |
| 13 | `13_CDOrtho` | number | 0% | Contextual diversity of the orthographic form — the breadth of subtitle documents containing it (README names contextual diversity explicitly). Scale (proportion 0–1 vs percentage) is not decidable from rare-word samples alone; the derive step records the CD of the highest-frequency lemmas in `derived/frequency-stats.json` as scale evidence. Measured per FORM, not per lemma (no `CDLemme` exists), so a verb lemma's own-form CD understates its real breadth — which is why CD is a stored breadth/quality signal and secondary filter, while `12_FreqLemme` is the primary lemma-ranking variable. **Use:** candidate-pool quality signal; §17 raw storage. |
| 14 | `14_IsLem` | 0/1 | 0% | `1` when this row IS the lemma's canonical row (infinitive for verbs, singular for nouns, …). **Use:** the population filter for §18 frequency quantiles, §51 gender-pattern aggregates, and candidate-pool lemma selection. |
| 33 | `33_Preval` | number | 39.1% | Word prevalence — the share of speakers who know the word, from prevalence norming (README lists prevalence; observed integers 4–100, **presumed percentage**, range verified in `derived/frequency-stats.json`). **Use:** candidate-pool quality filter (a frequent-but-unknown-to-raters form is a poor teaching candidate); stored raw where present. |
| 34 | `34_PrevalNb` | number | 39.1% | Number of raters behind `33_Preval`. **Use:** kept alongside prevalence for context. |

## Columns present but not used (documented so nothing is a mystery)

| # | Column | Meaning (lineage/observation) |
|---|--------|-------------------------------|
| 15 | `15_NbLettres` | Letter count of the form. |
| 16 | `16_NbPhons` | Phoneme count of the form. |
| 17 | `17_OLD20` | Mean orthographic Levenshtein distance to the 20 nearest neighbors (psycholinguistic neighborhood measure). |
| 18 | `18_PLD20` | Same, phonological. |
| 19 | `19_CVOrtho` | Consonant/vowel skeleton of the orthography (`CVCCVC`). |
| 20 | `20_CVPhono` | Consonant/vowel skeleton of the phonology (uses `Y` for glides). |
| 21 | `21_VoisOrtho` | Count of orthographic neighbors. |
| 22 | `22_VoisPhono` | Count of phonological neighbors. |
| 23 | `23_NbHomog` | Count of homographs. |
| 24 | `24_NbHomoph` | Count of homophones. |
| 25 | `25_SyllPhono` | Syllabified phonology in the Lexique ASCII alphabet (`pO-lak`). |
| 26 | `26_SyllNb` | Syllable count. |
| 27 | `27_SyllCV` | Syllabified CV skeleton. |
| 28 | `28_PUOrtho` | Orthographic uniqueness point (point d'unicité). |
| 29 | `29_PUPhon` | Phonological uniqueness point. |
| 30 | `30_MorphoBase` | Morphological base of derived words (`marger` → `marge`); 78.3% empty. Candidate input for future cognate-family work; unused today. |
| 31 | `31_MorphoStruct` | Morphological structure code (`0-1-1` prefix-root-suffix counts, presumed); 73.5% empty. |
| 32 | `32_MorphoDecomp` | Morphological decomposition (`/marg(e).er`); 73.7% empty. |
| 35 | `35_RT_FLP` | Mean lexical-decision reaction time (ms) from the French Lexicon Project; 74.5% empty. |
| 36 | `36_zRT_FLP` | Standardized reaction time. |
| 37 | `37_Err_FLP` | Lexical-decision error rate (0–1). |

## Normalization rules applied by our pipeline

- Cells are used verbatim (the file is clean UTF-8; the 500-row probe found
  zero U+FFFD replacement characters). No accent folding, no case folding:
  curriculum `lookupForm`s are stored lowercase exactly as Lexique writes
  common words.
- Numeric columns are parsed with `Number(...)`; a non-finite parse drops the
  row from numeric aggregations and is counted in the derive report, never
  silently coerced.
- Empty string means "not applicable / not available" for that column (per
  the observed empty rates above) — it is never treated as zero for
  gender/number/InfoVER, and never invented.
- `5_Cgram` values that `LEXIQUE_CGRAM_TO_POS` does not map are collected and
  reported by the derive step (`unknownCgramValues`); extending the map is a
  reviewed code change, never a runtime guess.

## Provenance

- License: CC BY-SA 4.0 (stated in the official README, committed at
  `derived/README-Lexique400.txt`).
- Citation: New, B., Pallier, C., Schalchli, G., Bourgin, J., & Gimenes, M.
  (2026). "Lexique 4: a major upgrade of the « Lexique » French Lexical
  Database", Behavior Research Methods.
- Acquisition history, including the Phase 4 egress-blocked attempts and the
  Phase 5A runner-side retrieval: `ACQUISITION.md`.

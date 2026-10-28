# CILS A1: official format sources

This file applies coordinator QC 2026-10-28 §3 to Italian: the CILS A1 track is
modelled on the official documents only. Every item is original, and nothing
here copies an item from an official test.

**Module.** CILS A1 has four modules: *A1 standard*, *A1 modulo per
l'integrazione in Italia*, *A1 bambini* and *A1 adolescenti*. The app models
**A1 standard**, the adult module abroad. In the timing table it is the column
"A1 ad. all'estero".

**Still to do before items are authored (QC 2026-10-29 §3.2):** check
unistrasi.it for a CILS A1 format newer than the 2009 guidelines and the 2017
sample, and record here which version is modelled.

## Read (2026-10-29)

| Document | URL | Version | Read |
|---|---|---|---|
| Linee guida CILS (Università per Stranieri di Siena, 63 p.) | https://cils.unistrasi.it/public/articoli/52/Linee_guida_cils_pdf.pdf | I edizione 2009; linked from "Come prepararsi agli esami CILS" | yes: §1.1, §1.4.4.4–1.4.4.5, §2.1.1, Tab. 3.1 |
| Istruzioni per lo svolgimento delle prove (Centro CILS, 4 p.) | https://cils.unistrasi.it/public/articoli/28/Istruzioni%20svolgimento%20prove.pdf | undated | yes: full text |
| Sample A1 standard, June 2017 session: Quaderno, Trascrizioni, Produzione orale, PS1/PS2 sheets, Criteri di valutazione | https://cils.unistrasi.it/1/89/195/Prove_Liv._A1_standard.htm | Giugno 2017 (criteria file created 2023) | yes: format only (instructions, item counts, scoring) |
| La valutazione (web page) | https://cils.unistrasi.it/1/117/83/La_valutazione.htm | live page, 2026-10-29 | yes |

## Facts

The Linee guida §2.1.1 is the level specification. The *Istruzioni* give the
timing. The 2017 sample and its *Criteri* give the item counts and points.

| Section | Time | Prove | Format (sample 2017 / Tab. 3.1) | Points |
|---|---|---|---|---|
| Ascolto | about 30 min | 2 | P1: 6 short dialogues/monologues, multiple choice a/b/c, 6 items. P2: 1 dialogue, multiple choice a/b/c, 6 items. **Each text is heard twice** (§2.1.1), with reading and checking time inside the recording. | 12 (1 per item) |
| Comprensione della lettura | 30 min | 3 | P1: 1 informative text, multiple choice a/b/c, 4 items. P2: 4 short texts, one true statement of three per text ("individuazione di informazioni"). P3: 4 texts completed by 4 of 8 continuations (A–H). | 12 (4 + 4 + 4) |
| Analisi delle strutture di comunicazione | 30 min | 3 | P1: cloze on definite articles, 10 gaps (0.4 each). P2: cloze on auxiliary essere/avere in the passato prossimo, 10 gaps (0.4 each). P3: lexical cloze with a/b/c, 8 gaps (0.5 each). | 12 |
| Pausa | 15 min | | | |
| Produzione scritta | 30 min | 2 | P1: description (of a picture in the sample), 20–40 words, 6 points. P2: a short message or e-mail to ask for information or services (the sample proposes going out together: day, time, place), 15–30 words, 6 points. | 12 |
| Produzione orale | about 10 min, **individual**, 2 prove | 2 | P1: conversation with the examiner about oneself (about 2–3 min), 6 points. P2: monologue on one topic the candidate chooses from three, one being a picture (about 1.5–2 min), 6 points. | 12 |

The written part lasts about 2 h 15 min, pause included.

- **Writing criteria.**
  - P1: communicative effectiveness 2.5, morphosyntax 1.5, vocabulary 1, spelling and punctuation 1.
  - P2: effectiveness 1.5, content 1, morphosyntax 1.5, vocabulary 1, spelling 1.
- **Speaking criteria (each task).** Effectiveness 2, morphosyntax 1.5, vocabulary 1.5, pronunciation and intonation 1.
- **Pass rule (Linee guida §1.4.4.5).** Each skill carries 12 points, and a skill passes at 7. The maximum is 60 and the minimum total is 35. **The certificate needs every skill passed.**
- **Partial result.** A partial pass is "capitalizzabile": only the failed skills are retaken. The sources disagree on how long a passed skill is kept (Linee guida 2009: one year; the current *La valutazione* page: 18 months). **The app states no validity period at all** (QC 2026-10-29 §3.3); `formatSource` links the official page instead.
- **Answer handling.** No dictionaries are allowed. A candidate cannot pause or replay the recording; the recording itself plays each text twice.

## App consequences

- **Structure.** The track has five sections with the times above, 12 points each, a pass at 7 per skill and the certificate rule "all five". The readiness estimate is computed per skill, never as a predicted pass.
- **Speaking** is individual in the real exam, so the app's one-to-one simulation matches. The examiner's turns are played by the app; free conversation is reduced to guided questions, as with the Goethe and DELE tracks.
- **Listening:** the real exam plays each text twice; the app allows two plays (product rule §67). This matches.
- **Analisi delle strutture:** P1 and P2 are open cloze items in the real test (the candidate writes the article or auxiliary). The app uses typed fill-blank items graded by exact match with listed alternatives.
- **Gap.** The level specification is from 2009, and the sample is from 2017. `checkedAgainstOfficialGuide: true` is justified because the official guide and the official sample were read. `formatSource` records that the Centro CILS describes the tables as indicative (Linee guida, footnote 5).
- **No copying.** No item, text or picture of the official sample is copied or paraphrased.

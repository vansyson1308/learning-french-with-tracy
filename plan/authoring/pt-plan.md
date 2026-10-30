# P3d(pt) — variety decision and working notes

## Decision (2026-10-30): pt-PT is the production model of `pt-vi`; pt-BR appears as variant notes

QC 2026-10-29 §4 asks for this before any content is written.

**Why pt-PT:**
- **The A1 exam exists only on the European side.** CAPLE (Universidade de Lisboa) has an A1 exam, ACESSO, followed by CIPLE at A2. Celpe-Bras, the Brazilian exam, has no A1: its lowest certificate is Intermediário. A course whose promise is "A1 aligned, with exam practice" can only model ACESSO, and that exam is European Portuguese.
- **A clean voice exists.** `pt_PT-tugão-medium` (Piper): language pt_PT, one speaker, dataset licence CC0, per its `MODEL_CARD` read on 2026-10-30. CC0 is on the allowlist. It still needs its registry entry and the audio canary.

**How pt-BR is handled:**
- `content/pt/VARIETY.md` lists the differences that matter at A1, as notes: `você` and `tu` use, `autocarro`/`ônibus`, `comboio`/`trem`, `pequeno-almoço`/`café da manhã`, `estou a comer`/`estou comendo`, `telemóvel`/`celular`.
- Regional forms are recognised as variants, never taught as the model (the same rule as the German course, `plan/reports/P3d-de.md`).

**`pt-en` stays as it is.** That basic pack is pt-BR (`tchau`, `ônibus`, `trem`, `cachorro`, with `pt_BR` voices), and it keeps its bytes, like `de-en`. It stays `standalone`, so the app has two Portuguese courses of different varieties. The course list must say which is which.

## Open risks, to settle before the audio step
1. **One pt-PT voice only.** The validator requires two distinct voices for dialogue (voiceCast A ≠ B), and tugão has one speaker. No second allowlisted pt-PT voice has been found. Options, in order:
   - search again for a clean pt-PT voice;
   - a second voice derived deterministically from tugão (pitch and formant shift), if the ASR audit and listening prove it intelligible; it must be labelled as derived in the registry;
   - if neither works, the owner decides whether dialogue may use one voice, which means changing a gate. Never relax that gate silently.
2. **The pt lexicon evidence is mixed.** `content/pt/lexicon/derived/` and the canary were prepared for pt-BR (the canary tests `ti/di` palatalisation). The pool needs a variety pass: Kaikki tags and the pt-PT frequency list, with BR-only entries moved to variants. The canary must be rewritten for pt-PT (reduced vowels, final `s` as /ʃ/, `lh`/`nh`).
3. **The learner migration question.** `pt:w:*` ids must not collide with stored `pt-en` progress. Check `legacySurfaces` as in `de-vi`.

## Before authoring items
Read the official ACESSO documents on the CAPLE site (`caple.letras.ulisboa.pt`) and record them in `content/pt/exam/FORMAT-SOURCES.md`: document, URL, version/date, read yes/no, parts, scoring, pass rule. Nothing about the format is modelled from secondary sources. A 2018 IPOR timetable (reading + writing 40 min, listening 25, speaking 10–15) is a lead only.

## Sources
- [CAPLE (Wikipedia)](https://en.wikipedia.org/wiki/CAPLE), [IPOR CAPLE 2019 calendar](https://ipor.mo/wp-content/uploads/2019/01/calendario_2019_EN_final.pdf): ACESSO is the A1 certificate.
- [Celpe-Bras certificates](https://antishkola.com/pt/portugues/guia-celpe-bras/): lowest level Intermediário. Secondary; confirm with Inep before it is quoted to learners.
- [`pt_PT-tugão-medium` model files](https://huggingface.co/rhasspy/piper-voices/tree/main/pt/pt_PT/tug%C3%A3o/medium).

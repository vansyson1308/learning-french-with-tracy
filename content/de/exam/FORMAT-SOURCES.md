# Goethe-Zertifikat A1: Start Deutsch 1: official format sources

Coordinator QC 2026-10-28 §3: the Goethe A1 track is modelled on the
official documents only. Items are original. Nothing here copies an item
from an official test.

## Read (2026-10-28)

| Document | URL | Version | Read |
|---|---|---|---|
| Durchführungsbestimmungen Goethe-Zertifikat A1: Start Deutsch 1 (16 p.) | https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_A1_Start_Deutsch_1.pdf | Stand: 1. September 2025 | yes: full text |
| Prüfungsordnung der Goethe-Institut e.V. (21 p.) | https://www.goethe.de/pro/relaunch/prf/de/Pruefungsordnung.pdf | — | downloaded; general rules only |
| Modellsatz Start Deutsch 1 (Erwachsene, 47 p.), "Prüfungstraining 1" on https://www.goethe.de/de/spr/prf/ueb/pa1.html | https://www.goethe.de/pro/relaunch/prf/materialien/A1_sd1/sd_1_modellsatz.pdf | Version R04SWV01.01, 19795-LoeBo-MS-02/2024 | yes: format only (instructions, item numbering, answer sheet) |
| Wortliste Goethe-Zertifikat A1: Start Deutsch 1 (29 p.) | https://www.goethe.de/pro/relaunch/prf/de/A1_SD1_Wortliste_02.pdf | — | yes: used only as a coverage check for the de-vi syllabus |
| Übungssatz 01 / 02 (further practice sets) | https://www.goethe.de/pro/relaunch/prf/materialien/A1_sd1/sd_1_uebungssatz01.pdf, …02.pdf | — | not needed (same format as the Modellsatz) |

## Task formats per Teil (Modellsatz, answer sheet)

| Section | Teil | Items | Format |
|---|---|---|---|
| HÖREN (about 20 min, three parts) | 1 | 1–6 | short conversations; a/b/c; **each text heard twice** |
| | 2 | 7–10 | announcements; richtig/falsch; **each text heard once** |
| | 3 | 11–15 | short phone/radio messages; a/b/c; **each text heard twice** |
| LESEN (25 min, three parts) | 1 | 1–5 | two short letters/e-mails; richtig/falsch |
| | 2 | 6–10 | short ads/web pages; "Wo finden Sie Informationen?", choose a or b |
| | 3 | 11–15 | signs and notices; richtig/falsch |
| SCHREIBEN (20 min, two parts) | 1 | 5 gaps | fill a form for someone, from a short situation text (5 missing details) |
| | 2 | 1 text | short message with three guided points, one or two sentences each, about 30 words, with greeting and closing |
| SPRECHEN (about 15 min, in a group) | 1 | — | introduce yourself from keywords; spell a word; say a number |
| | 2 | — | ask for and give information with word cards (topic cards) |
| | 3 | — | formulate requests and react, with picture cards |

Written answers are transferred to the answer sheet at the end. Dictionaries
are not allowed. A worked example (Beispiel) opens each Teil.

Automated fetches of goethe.de pages return HTTP 403. The two PDFs were
retrieved directly from the URLs above. The exam overview page
(`/de/spr/prf.html`) links them.

## Facts taken from the Durchführungsbestimmungen (Stand 1.9.2025)

- **Components.** Two compulsory sub-exams: a written group exam (HÖREN,
  LESEN, SCHREIBEN) and an oral group exam (SPRECHEN).
- **Timing (written, 65 minutes).** HÖREN about 20 minutes, LESEN 25
  minutes, SCHREIBEN 20 minutes. There is no break between the parts.
  - HÖREN normally comes first; the invigilator plays the audio.
  - About 5 minutes inside the HÖREN time are for transferring answers to
    the answer sheet.
  - LESEN and SCHREIBEN may be taken in either order, with about 5 minutes
    planned for transfer.
  - The SCHREIBEN Teil 2 text is written directly on the answer sheet.
- **Parts.** HÖREN Teil 1–3, LESEN Teil 1–3, SCHREIBEN Teil 1–2, SPRECHEN
  Teil 1–3.
- **SPRECHEN is a group exam** with at most four participants. It lasts 15
  minutes with no preparation time, and two examiners conduct it. Each
  part takes about 5 minutes.
  - Teil 1: introduce yourself using keyword cards, then spell a word and
    say back a number.
  - Teil 2: participants ask each other questions and answer them (word
    cards).
  - Teil 3: participants make requests and respond to them (picture/action
    cards).
  - In an individual exam the participant speaks with an examiner.
- **Scoring.**
  - HÖREN: 15 points, 1 or 0 per answer.
  - LESEN: 15 points, 1 or 0 per answer.
  - SCHREIBEN: Teil 1 5 points (1 or 0 per answer); Teil 2 10 points.
    Teil 2 is scored by two graders on fixed criteria; their mean is
    rounded to whole points.
  - SPRECHEN: 15 points (Teil 1 3, Teil 2 6, Teil 3 6), scored by two
    examiners; their mean is rounded.
- **Overall result.** Each section's points × 1.66, summed and rounded to
  whole points. Maximum 100: 75 written, 25 oral. **Pass: at least 60
  points (60 %) and every part taken.** Ratings: 100–90 sehr gut, 89–80
  gut, 79–70 befriedigend, 69–60 ausreichend, 59–0 nicht bestanden.
- **No separate module certification.** Modular certification applies to
  B1–C2 only (exam overview page).

## Wortliste coverage check (2026-10-28)

Script `scratchpad goethe-gap.py` compared the Wortliste's alphabetical
headwords with the de lexicon. It is not committed, because the list's text
must not ship (no open licence).

- **Before:** 319 of about 640 headwords were in the lexicon. The selection
  had kept only committed (frozen) lexemes. Several very frequent core words
  had never been added: *gehen* (frequency rank 8), *tun*, *noch*, *nur*,
  *heißen*, *mögen*, and every-day nouns absent from the subtitle pool
  (*Brötchen*, *Fahrkarte*, *Lehrer*, *Sonne*).
- **Added:** 291 of them through `lexicon-add`, with original glosses,
  topics and examples (`content/de/_drafts/_generators/de-goethe-core.py`).
- **Left out:** inflected or derived forms the resolver already reaches
  (*geöffnet*, *besser*, *möchten*), closed-class forms handled as story
  function words (*dich*, *dir*, *welch-*), and parse noise.
- **Copying:** nothing from the Wortliste is copied. Words are facts; every
  example is new.

## App consequences

- The track reproduces the four sections, the timings, the 15/15/15/15
  points, the ×1.66 conversion and the 60-point pass rule.
- **The app cannot run a group exam.** SPRECHEN is simulated individually:
  the learner speaks to the app as "examiner". The track description and
  `KNOWN_LIMITATIONS.md` say so.
- The item counts and formats of each Teil come from the Modellsatz above.
  - Items are original texts in those formats.
  - `formatSource` records these URLs and the 2026-10-28 read date, and
    `checkedAgainstOfficialGuide: true` is set because the Modellsatz and the
    Durchführungsbestimmungen were actually read.
  - No item, text or picture of the official sets is copied or paraphrased.

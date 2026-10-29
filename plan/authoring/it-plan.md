# P3d(it) — working notes (start after the de-vi PR merges)

The CILS A1 format has been verified from official documents:
`content/it/exam/FORMAT-SOURCES.md`. Before authoring items, check for a newer
format on unistrasi.it (QC 2026-10-29 §3.2). Model CILS A1 standard only (not
the "Integrazione in Italia", "bambini" or "adolescenti" modules), and say so
in the track description. State no certificate validity period.

## Exam engine (done in PR phase-4/exam-engine-v2)
- `EXAM_SKILLS` has `"structures"` for "Analisi delle strutture di comunicazione".
- `EXAM_TASK_FORMATS` has:
  - `"cloze"` (`fillBlank`, `select`, `articleSelect`): P3 is a lexical cloze a/b/c;
  - `"formCompletion"` (`conjugationCloze`, `typeAnswer`, `fillBlank`): the open gaps of P1 (articles) and P2 (essere/avere), graded by exact match with listed alternatives.
- Pass rule:
  - `sectionMinimums`: every section `min: 7` of 12;
  - `total`: `min: 35` of 60;
  - `everySectionTaken: true`.
  The result screen lists every rule not reached ("Phần Nghe: 6/12 — cần ≥ 7").
- Points per task inside a section:
  - Ascolto 6+6 and Lettura 4+4+4 are equal per item.
  - Strutture 4+4+4 is not (10 / 10 / 8 items), so it needs task `points`.
  - Scritta 6+6 and Orale 6+6.
- Speaking is individual in CILS (candidate and examiner). Set `simulatedIndividually` on it, as DELE and Goethe do: the app has no examiner.
- Per-part `minutes` where the official timing gives them.

## Course (same QC rules as de-vi)
- Do not edit the it-en pack. Give it `legacySurfaces` if v8 needs a re-key: check whether it has an id registry. it-en is a basic pack, so probably no registry yet. Then nothing to migrate: say so.
- Italian gates (plugin):
  - articles il/lo/la/l'/i/gli/le chosen by the initial sound (s+consonant, z, gn, ps, x, vowel);
  - elision and apostrophes (l'amico, un'amica vs un amico);
  - auxiliary essere/avere in the passato prossimo with participle agreement after essere (A1 production does not require agreement per the CILS syllabus; recognition only);
  - the formal Lei register is consistent per scenario.
- Variety: standard Italian; regional forms only as notes (`VARIETY.md`).
- LanguageTool it-IT on CI.
- Back-translation pass and Tier-1 review files.
- 40–50 stories, with context-coverage ≥ 90 %.
- Audio: Italian voices. Check the audio canary for it (Piper `it_IT-paola-medium` / `riccardo-x_low`?). The registry needs licence check first.

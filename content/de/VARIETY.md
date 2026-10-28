# German variety — de-vi (P3d(de), QC 2026-10-28)

**Production model: standard German as used in Germany (Bundesdeutsch).**
Every target-language text the course models uses the German-German form:
- lesson prompts, options and sentences;
- readings and clip transcripts;
- speech targets and model answers;
- conversation partner lines;
- checkpoint, placement and Goethe A1 items.

Reasons:
- Goethe-Zertifikat A1: Start Deutsch 1 is written in standard German.
- Most Vietnamese learners go to Germany (Ausbildung, nursing, family
  reunion).
- The selected voices (`thorsten`, `kerstin`) are German-German.
- A learner needs one consistent variety.

**Austrian and Swiss standard forms are accepted, never punished.**
- They appear in every accepted-answer list: typed alternatives, speech
  `acceptedVariants`, rubric slot variants, scenario intents.
- They show as a note on the teach card of the German-German word, for
  example: *"Ở Áo: der Jänner"*, *"Ở Thụy Sĩ: das Velo"*.

| Germany (taught) | Austria / Switzerland (accepted, shown as a note) |
|---|---|
| der Januar | der Jänner (AT) |
| das Fahrrad | das Velo (CH) |
| die Tomate | der Paradeiser (AT) |
| Hallo / Guten Tag | Grüß Gott (AT, South Germany), Grüezi (CH), Servus (AT, Bavaria) |
| Tschüss | Servus (AT), Ade / Uf Widerluege (CH) |
| das Taxi | der Taxi (CH) |
| ß (Straße) | ss (Strasse, CH, where ß is not used) |

The lexicon records Swiss *der Taxi* as a regional gender: das Taxi is
taught, and the kaikki head template confirms it (`n:m[Switzerland, but
rare]`).

## How the rule is enforced

- A regional form is a lexeme with `variety: { region: "at" | "ch",
  equivalent }`, added through the toolkit step `lexicon-add-variety`
  (same mechanism as es).
  - It is never in the syllabus and never the model of an exercise.
  - Its surface appears on the equivalent's teach card.
- `content:validate` rejects a regional form in any target-language model
  text of de-vi and its sources (`scripts/lib/variety.ts`). Accepted-answer
  lists are exempt.
- ASR: the German normalisation folds ß → ss (`scripts/lib/languages/de.ts`),
  so a Swiss spelling never fails a speech or dictation check.
- Learner grading (`src/lib/languages/de.ts`, D-10 review): typed answers,
  word banks and writing rubric slots fold ß → ss, so "heisst", "gross" or
  "Grüsse" are correct without being listed; typed answers also accept
  ae/oe/ue for ä/ö/ü ("schoen", "Mueller"). Dictation and conjugation
  drills stay exact: there the spelling itself is what is practised.

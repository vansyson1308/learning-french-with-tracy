# Phase 5B pedagogy research base (clean-room)

The factual grounding for the Section 2 pedagogy units. Rules stated in
learner-facing content must trace to an entry here; every entry names its
source. **Clean-room contract:** facts, categories and statistics are drawn
from the sources below; ALL learner-facing prose is original to this
project. No sentence is copied from any reference work or app.

Data-derived claims cite this repository's committed Lexique 4 derivations
(`content/fr/lexicon/derived/`) — themselves reproducible from the pinned
official artifact (see `../lexicon/LEXIQUE4_COLUMNS.md`).

## A. Gender & articles

- **Two noun classes; article as part of the word.** Standard descriptive
  grammar; statistics from this repository's population study
  (`derived/gender-suffix-stats.json`): 36,940 gendered noun lemmas —
  59.5% masculine, 35.4% feminine, 5.1% épicène rows.
- **Ending patterns worth teaching** (reliability = share of that ending's
  lemmas with the majority gender, from the same study; n = lemma count):
  -tion 99.5% f (n=1,895) · -sion 99.1% f (n=222) · -isme 99.8% m (n=616)
  · -ment 99.8% m (n=1,094) · -age 98.5% m (n=1,234) · -eau 96.7% m
  (n=212) · -ance 98.9% f (n=272) · -ence 98.3% f (n=232) · -ette 94.3% f
  (n=476) · -ie 96.3% f (n=1,902) · -ier 97.1% m (n=589) · -al 98.6% m
  (n=210) · -in 97.0% m (n=558) · -té 91.6% f (n=1,031) · -eur 92.5% m
  (n=1,938).
- **Derivation trap (recorded in the Phase 5A data report):** a short
  ending's statistics can be contaminated by a longer feminine ending it
  contains — "-on" reads 71.9% feminine only because -ion (f) dominates
  the bucket. Pattern derivation for the unit must use
  longest-distinctive-suffix logic and honest "usually / very often"
  wording, never "always" unless the data shows ≥99.5% and the exceptions
  are named.
- **Elision hides gender**: le/la → l' before vowel sound (standard
  grammar; see also section E). Teaching consequence: vowel-initial nouns
  are drilled with un/une.
- **h aspiré vs h muet**: h muet elides (l'homme), h aspiré blocks elision
  and liaison (le héros, les | héros). Reference: Office québécois de la
  langue française (OQLF), Banque de dépannage linguistique, « H muet et
  h aspiré »; Académie française usage guidance. Consequence for
  generated articleSelect exercises: nouns with ambiguous or aspirated h
  are EXCLUDED from auto-generation (safety rule §57).

## B. High-yield verbs (présent, futur proche, passé composé)

- **Form evidence**: every taught conjugation cell must be verifiable
  against `derived/verb-morphology.json` (form + mood:tense:person atom of
  the right lemma) — the consumption contract in
  `../lexicon/LEXIQUE4_COLUMNS.md` (9_InfoVER caveats: form-level unions on
  homographs; noisy row-level number). Machine gate:
  `scripts/__tests__/verb-morphology-coverage.test.ts`.
- **Verb selection**: by real lemma frequency (all of être/avoir/aller/
  faire/pouvoir/vouloir/savoir/devoir/dire/venir/voir/prendre are in the
  top ranks of the eligible population — `derived/frequency-stats.json`
  top list) plus utility for the futur-proche and passé-composé patterns.
- **Leverage patterns** (standard pedagogy of French, re-authored):
  regular -er présent endings; futur proche = aller (présent) +
  infinitive; passé composé = avoir/être (présent) + past participle;
  être-auxiliary verbs limited to the classic movement/change set taught
  explicitly as a list.

## C. Cognates & false friends

- **Cognate suffix correspondences** (-tion/-tion, -té/-ty, -isme/-ism,
  -ique/-ic(al), -aire/-ary, -eur/-or…) are public linguistic facts; the
  unit's reliability wording must be derived from the candidate-pool
  evidence (how many of the pool's -tion words are transparent cognates)
  during P5B.4 authoring, not asserted.
- **False friends**: researched pair list authored in P5B.4 with per-pair
  sources; each trap is wired as an authored confusable relation so the
  distractor engine can spring it honestly.

## D. Numbers 0–100

- **System facts** (standard French numeration): 17–19 compound
  (dix-sept…); 21/31/41/51/61/71 use "et" (vingt et un, soixante et onze);
  22–29 etc. hyphenate; 70s = soixante-dix + teens; 80s = quatre-vingts
  base (final -s only when nothing follows: quatre-vingts vs
  quatre-vingt-un); 90s = quatre-vingt-dix + units; 100 = cent.
- **Orthography variants**: traditional hyphenation (vingt et un) and the
  1990 rectifications (vingt-et-un) are BOTH official. References: Académie
  française (Questions de langue — écriture des nombres), OQLF Banque de
  dépannage linguistique (« Écriture des nombres en lettres »,
  rectifications de l'orthographe). Decision recorded for the unit:
  traditional forms displayed; both forms accepted in grading.
- **Regional note only**: septante/nonante (Belgium/Switzerland) taught as
  a recognition note, never graded as the expected answer (France French
  default — program rule §78).

## E. Connected French (liaison & elision)

- **Liaison categories**: obligatoire (determiner+noun: les‿amis;
  pronoun+verb: nous‿avons), facultative (register-dependent), interdite
  (after et; before h aspiré; after singular nouns). Reference: Académie
  française, Questions de langue — « Liaisons » (QDL046 lineage); OQLF
  BDL liaison pages.
- **Elision**: le/la/je/ne/de/que → l'/j'/n'/d'/qu' before vowel sound and
  h muet; blocked before h aspiré. The le/l' test doubles as the h-type
  detector for data safety rules.
- **Spoken cues are NOT IPA** unless taken verbatim from the lexicon's
  genuine-IPA values; the connected-speech model labels its field
  `spokenCue` and never claims IPA status (program rule §88).

## Source register

1. This repository's Lexique 4 derivations (pinned sha `fe333b4f…`):
   gender-suffix-stats, frequency-stats, verb-morphology, candidate-pool.
2. Académie française — Questions de langue pages (liaisons; écriture des
   nombres). Facts referenced; no prose reproduced.
3. Office québécois de la langue française — Banque de dépannage
   linguistique (h muet/h aspiré; écriture des nombres; liaison). Facts
   referenced; no prose reproduced.
4. Standard descriptive grammar of French (gender classes, elision,
   conjugation systems) — common linguistic knowledge, re-authored.

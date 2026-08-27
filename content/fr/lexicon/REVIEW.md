# Rich lexicon linguistic review (two-pass)

Scope: the 54 curriculum lexemes in `content/fr/lexicon/lexemes.json` —
part of speech, gender, IPA, topics, confusable relations, and the newly
authored FR/EN example sentences. All of this data is original project
authorship (`original-french-lexicon`); nothing was copied from Wiktionary,
Tatoeba, Lexique, or any other external dataset.

## Pass 1 — authoring

Authored directly against the course pack (surfaces and glosses verbatim
from `content/courses/fr-en.json`), with one short beginner-appropriate
example per lexeme, built mostly from curriculum vocabulary plus basic
function words (être/avoir/aller/aimer forms, partitives, prepositions).
Every example is a distinct sentence; noun examples were written to carry
gendered determiners where natural so the article audit has real evidence
to check.

## Pass 2 — verification (fresh read of every entry)

Checked per entry: IPA against standard European French dictionary
conventions; gender; example grammar (agreement, partitives, elision);
translation fidelity; register and level. Findings and decisions:

1. **IPA**: all 54 values re-verified individually. Notables confirmed:
   femme /fam/ (irregular -emme), monsieur /məsjø/ (irregular), oiseau
   /wazo/, œuf /œf/ (singular), fruit /fʁɥi/, bonne nuit /bɔn nɥi/ (ɥ
   glide), fille /fij/. No corrections needed in pass 2.
2. **Confusable symmetry**: pass 2 caught `fr:w:jus` listing `fr:w:eau`
   without the reverse edge; fixed by adding eau → jus. The validator now
   enforces symmetry mechanically so this class of slip cannot recur.
3. **oui / non**: classified **adverb** (standard dictionary practice —
   adverbe d'affirmation / de négation), not interjection.
4. **bonjour, bonsoir, salut, merci, pardon**: dictionaries also carry
   noun (nom masculin) senses; classified **interjection** to match their
   curriculum function as greetings. Consequence recorded for the future
   Lexique match: prefer INT/ONO rows for these; matching a NOM row
   instead would be a deliberate re-decision, not an automatic fallback.
5. **gauche / droite**: surfaces keep the course's article-bearing noun
   form ("la gauche" / "la droite"); examples deliberately use the more
   natural adverbial "à gauche" / "à droite".
6. **âne**: /ɑn/ uses the traditional back vowel (dictionary form); many
   modern speakers merge toward /an/ — accepted variation, not an error.
7. **Typography**: "Où est la gare ?" keeps the French space before the
   question mark. Examples are display-only (never graded), so answer
   normalization is unaffected.
8. **Gender evidence coverage** (article audit): surfaces give evidence
   for 45 nouns via "le "/"la "; the 7 elided surfaces (l'homme, l'eau,
   l'œuf, l'oiseau, l'âne, l'aéroport, l'hôtel) plus the article-less
   monsieur/madame rest on authored gender. Of those, œuf ("un œuf", twice)
   and oiseau ("Un oiseau") gain example-level evidence, leaving exactly
   seven entries (homme, eau, âne, aéroport, hôtel, monsieur, madame) whose
   gender is authored-only — precisely the rows where the future Lexique 4
   cross-check adds independent verification. All authored values are
   standard, uncontroversial French.
9. **Example distinctness**: verified all 54 French sentences are unique
   and none leaks the answer pattern of another entry's exercise.
10. **Glosses**: byte-identical to the course pack by validation rule
    (checked mechanically; no manual drift possible).

## Outcome

Pass 2 accepted all 54 entries with the pass-1 corrections above already
applied. The mechanical audits (article consistency, symmetry, gloss
identity, triple id lock) run in `content:validate` on every CI build, so
the review's structural findings are locked in as executable rules rather
than prose.

## Pass 3 — Lexique 4 cross-check dispositions (Phase 5A.2)

The retrieved Lexique 4 artifact (sha256 `fe333b4f…`, see
`source-manifest.json`) enabled the external cross-check of all 54 items
(`bun run lexicon:crosscheck` → `derived/core-crosscheck.json`). Result:
43 items agree on every checkable field, 3 are expressions
(never lexique-matched by design), 8 initially needed investigation — one
resolved as a cross-check comparison bug (œuf's lemma is spelled with the
digraph "oeuf" in the source; the documented ligature fold now applies to
the lemma comparison too), leaving 7 items. Each has a deliberate
disposition below. **No authored value was changed silently; every change
is listed here.**

1. **bonjour, bonsoir — partOfSpeech: authored `interjection`, source `NOM m`.**
   Lexique 4 has no interjection reading for either greeting (its
   interjection-adjacent category, ONO, covers onomatopoeia). The NOM
   classification is lexicographically standard ("un bonjour chaleureux"),
   and the curriculum classification as a greeting interjection is
   pedagogically standard; both describe the same surface in the same
   spoken usage. **Disposition: keep authored `interjection`;** adopt the
   NOM rows' measurements (frequency, prevalence, IPA — byte-identical to
   the authored IPA on both words) through the validated, justified
   entries in `match-overrides.json`. The strict matcher continues to
   report these as unmatched — the override channel exists precisely so
   this divergence stays visible instead of being patched into the
   matcher.
2. **fromage /fʁɔmaʒ/→/fʁomaʒ/, cochon /kɔʃɔ̃/→/koʃɔ̃/, aéroport
   /aeʁɔpɔʁ/→/aeʁopɔʁ/ — mid-vowel convention.** The differences are
   systematic, not errors: Lexique 4 transcribes the o-vowel in unstressed
   open syllables as close /o/ (loi de position), while the Phase 4
   authored values used open /ɔ/. Both conventions appear in published
   dictionaries. **Disposition: adopt the source transcription verbatim
   for matched lexemes** during the Phase 5A.3 import (pronunciation
   source becomes `lexique-4`, notation stays honestly `ipa` because the
   values come from the dedicated 3_Phono_IPA column). Rationale: one
   consistent, citable transcription system across all lexemes beats a
   per-word editorial mix; the values change exactly where listed here.
3. **âne /ɑn/→/an/ — /ɑ/–/a/ merger.** Lexique 4 does not use /ɑ/: the
   back-a is merged into /a/ in its transcription system, matching the
   near-complete merger in contemporary European French. **Disposition:
   adopt /an/ with the same import** (covered by disposition 2's rule).
   The traditional /ɑn/ remains correct in conservative accents; the app
   teaches the contemporary form.
4. **gauche — gender: authored `feminine`, source `e` (épicène).** The
   source marks the noun épicène because both genders exist with
   different senses ("la gauche" — the left side / political left; "un
   gauche" — a left punch, boxing). The curriculum teaches the direction
   sense, which is feminine. **Disposition: keep authored `feminine`;**
   the épicène flag is sense-mixing, not evidence against the taught
   sense. No data change.

Remaining honest gaps after Phase 5A.3 imports: bonjour/bonsoir keep
`partOfSpeech: interjection` with adopted measurements via overrides;
œuf's source row carries no gender value (empty `7_Genre` — a source gap;
the authored masculine stands on the internal article audit: "un œuf" in
the example corpus); expressions stay entirely project-authored.

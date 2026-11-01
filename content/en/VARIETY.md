# English variety — en-vi (QC 2026-11-01 §2.1)

**Production model: American English (General American).**
Every target-language text the course models uses the American form:
- lesson prompts, options and sentences;
- readings, stories and clip transcripts;
- speech targets and model answers;
- conversation partner lines;
- checkpoint, placement and QĐ 1481 practice items.

The course name is "Tiếng Anh (Mỹ)" and its flag is the US one. IPA is General American, from Wiktionary through kaikki wherever a value exists (`content/en/lexicon/derived/ipa-general-american.json`). The two course voices (Kokoro `am_michael`, `af_heart`) are American.

Reasons:
- One variety keeps spelling, sound and vocabulary consistent for a beginner.
- The voices the licence gate allows for this course are American.

## British forms are correct, and are accepted

A learner who writes British English has not made a mistake. Typed answers are never marked wrong for it. Two mechanisms in `src/lib/languages/en.ts`:

| What | Examples | How it works |
|---|---|---|
| Same word, other spelling | colour, centre, organise, travelled, grey, learnt, mum | Folded to the US spelling on both sides, in every typed comparison and in dictation and conjugation. A closed list, so "colourless" stays itself. |
| Different word, same thing | flat/apartment, lift/elevator, lorry/truck, petrol/gas, holiday/vacation, film/movie, shop/store | Rewritten only when the key has the US word, including the article: "a flat" for the key "an apartment". The written rubric's slots use the same seam. |

The second kind is pair-aware because these are ordinary words with other meanings. "The road is flat" does not take "apartment", and "Do not lift heavy boxes" does not take "elevator". A US word stays off the list when it has a sense the British word lacks: `line` (a queue is not a drawn line), `check` (a bill is not every check), and `first floor`, which is a different floor in each variety.

The list of tested pairs is in `src/lib/__tests__/languages-en.test.ts`.

**Speech** is not part of this. The recogniser is `en-US`, and spoken items accept what the author listed. Spelling never matters, because the same fold applies to what is heard, but "lift" for an `elevator` target needs an authored variant.

## British words in notes only

A British word may appear in an explanation or a concept card, as a note, never as the taught model: the spelling note on the writing concept, and "have got" on the card about have and there is. The course teaches *apartment*, not *flat*; *on the weekend*, not *at the weekend*; *parking lot*, not *car park*.

Ordinary American uses of a word that also has a British sense stay: `lift` is taught as the verb, `flat` appears as the adjective.

Titles are still written Mr and Mrs, without the American full stop. Typed answers accept both. The D-10 language pass decides whether to change them.

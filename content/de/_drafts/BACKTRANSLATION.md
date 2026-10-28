# Back-translation pass: de-vi (P3d, QC 2026-10-28)

Done in a Claude Code session on 2026-10-29. **Limit:** the same session wrote
the German and the Vietnamese of this course, so this pass is not independent.
It is an automated consistency check with every flag read by hand.

Independent checks come from elsewhere:
- the Tier-1 review files, signed by the owner (`content/de/REVIEW-TIER1-vi.md`)
  and a hired German teacher (`content/de/REVIEW-TIER1-de.md`);
- the LanguageTool gate (`content/de/languagetool-allow.json`, CI job
  `languagetool`).

## Pairs checked

Every pair where the course shows German with its Vietnamese meaning was
extracted. The script is `scratchpad backtrans.py`; its logic is summarised
here.

| Group | Pairs |
|---|---|
| Pack words (`words[]`) | 194 |
| Pack exercises: the correct option of `targetToNative` / `nativeToTarget` selects, match pairs, fill-blank and conjugation-cloze translations, word-bank answers, typed answers | 614 |
| Lexicon glosses (`glosses.vi` vs surface) | 1,288 |
| Lexicon example translations | 2,015 |
| Story sentences (40 stories) | 856 |
| Concept-card examples | 76 |
| **Total** | **5,043** |

## Automated flags (249) and how each was resolved

A pair is flagged when a meaning marker disagrees between the two sides. The
markers are:
- a German digit absent from the Vietnamese;
- German negation (*nicht, kein-, nie, nichts, niemand, nein*) without a
  Vietnamese one, or the reverse;
- a question mark on one side only;
- an empty Vietnamese, or one that copies the German.

| Kind of flag | Count | Resolution |
|---|---|---|
| Vietnamese yes/no question ending in *không* ("Hast du Hunger?" → "Cháu có đói không?") | ~170 | justified: *không* is the question particle here, not a negation |
| *không khí* (air, atmosphere), *không sao* (all right) | ~15 | justified: not a negation |
| German *nichts sagen* → Vietnamese *im lặng*; *kostet nichts* → *miễn phí*; *kaum* → *gần như không* | ~20 | justified: negation expressed by the meaning |
| Digits written as words or converted ("14 Jahre" → "mười bốn tuổi", "13 Uhr" → "1 giờ chiều", "22 Uhr" → "10 giờ tối", "1000" → "1.000") | 9 | justified: same value, Vietnamese time convention |
| Word-bank answers (tokens without punctuation) compared with a prompt ending in "?" | 5 | justified: word banks never show punctuation |
| Remaining lexicon-example flags (Tatoeba sentences with idiomatic Vietnamese) | ~30 | read one by one; each translation says what the German says |

**Open flags: none. Changed: nothing.** Every flagged pair carries the same
meaning on both sides.

## Not covered here

- **Prose that teaches or judges:** guidebooks, concept explanations, writing
  rubrics, scenario goals and exam instructions. These are Tier-1 (owner)
  material: `content/de/REVIEW-TIER1-vi.md`, 378 lines.
- **Long target-language text:** readings, listening scripts, scenario
  partner lines, model answers and the Goethe A1 practice texts. These go to
  a hired German teacher: `content/de/REVIEW-TIER1-de.md`, 309 lines.

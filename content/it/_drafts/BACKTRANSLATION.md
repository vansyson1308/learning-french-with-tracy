# Back-translation pass: it-vi (P3d(it), QC 2026-10-29 §3)

Done in a Claude Code session on 2026-10-31. The script is
`content/it/_drafts/_generators/it-backtrans.py`. **Limit:** the session that ran
this script also wrote the Italian and the Vietnamese, so the script alone is not
independent: it is a consistency check with every flag read by hand.

Independent checks come from elsewhere:
- the D-10 reviewers, fresh agents that read every story, reading, clip and scenario
  line as an Italian / Vietnamese pair (`content/it/REVIEW-AI.md`);
- the Tier-1 files (`content/it/REVIEW-TIER1-vi.md`, `content/it/REVIEW-TIER1-it.md`);
- the LanguageTool gate (`content/it/languagetool-allow.json`, CI job `languagetool`).

## Pairs checked

| Group | Pairs |
|---|---|
| Pack words (`words[]`) | 194 |
| Pack exercises: the correct option of `targetToNative` / `nativeToTarget` selects, match pairs, fill-blank and conjugation-cloze translations, word-bank answers, typed answers | 613 |
| Lexicon glosses (`glosses.vi` vs surface) | 777 |
| Lexicon example translations | 777 |
| Story sentences (46 stories) | 864 |
| Concept-card examples | 96 |
| **Total** | **3,321** |

## Automated flags (52) and how each was resolved

A pair is flagged when a meaning marker disagrees between the two sides:
- an Italian digit absent from the Vietnamese;
- Italian negation (*non, nessun-, mai, niente, nulla, né, no*) without a Vietnamese
  one (*không, chẳng, chưa, đừng, hết, thiếu…*), or the reverse;
- a question mark on one side only, in stories, examples and concept cards;
- an empty Vietnamese, or one that copies the Italian.

Only the negation marker fired.

| Kind of flag | Resolution |
|---|---|
| *prego* → *không có gì*; *zero* → *số không*; *come stai?* → *bạn khỏe không* | justified: not a negation, or the question particle |
| *senza* → *không*; *male* → *không khỏe*; *manca* → *thiếu*; *costa poco* → *không đắt*; *fidanzato* → *chưa cưới* | justified: negation expressed by the meaning |
| *hết* as "all" or "the total" (*Capiamo tutto*, *Sono quattro euro*, *finisce il turno*) | justified: not a negation |
| *Non è un problema* → *Không sao*, *non è niente* → *không sao*: the script masks *không sao*, so the Italian side alone fired | justified: same meaning |
| Italian tag *no?* → Vietnamese *phải không?* or *nhỉ?* | justified: a question tag |
| Blank exercises (*Scusa, ___ capisco.*), where the negation is the answer | justified: the blank hides it |

**Open flags: none. Changed: nothing.** Every flagged pair carries the same meaning on
both sides.

## Not covered here

- **Prose that teaches or judges:** guidebooks, concept explanations, writing rubrics,
  scenario goals and exam instructions. These are Tier-1 (owner) material:
  `content/it/REVIEW-TIER1-vi.md`.
- **Long target-language text:** readings, listening scripts, scenario partner lines,
  model answers and the CILS A1 practice texts: `content/it/REVIEW-TIER1-it.md`.

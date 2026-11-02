# Back-translation pass: en-vi (P4f, modelled on `content/it/_drafts/BACKTRANSLATION.md`)

Done in a Claude Code session on 2026-11-02. The script is
`content/en/_drafts/_generators/en-backtrans.py`. **Limit:** the session that ran
this script also wrote the English and the Vietnamese, so the script alone is not
independent: it is a consistency check with every flag read by hand.

Independent checks come from elsewhere:
- the D-10 reviewers, fresh agents that read every story, reading, clip and scenario
  line as an English / Vietnamese pair (`content/en/REVIEW-AI.md`);
- the Tier-1 files (`content/en/REVIEW-TIER1-vi.md`, `content/en/REVIEW-TIER1-en.md`);
- the LanguageTool gate (`content/en/languagetool-allow.json`).

## Pairs checked

| Group | Pairs |
|---|---|
| Pack words (`words[]`) | 204 |
| Pack exercises: the correct option of `targetToNative` / `nativeToTarget` selects, match pairs, fill-blank and conjugation-cloze translations, word-bank answers, typed answers | 986 |
| Lexicon glosses (`glosses.vi` vs surface) | 868 |
| Lexicon example translations | 894 |
| Story sentences (46 stories) | 811 |
| Concept-card examples | 97 |
| **Total** | **3,860** |

## Automated flags (43) and how each was resolved

A pair is flagged when a meaning marker disagrees between the two sides:
- an English digit absent from the Vietnamese;
- English negation (*not, n't, no, never, none, nothing, no one, without, cannot…*) without
  a Vietnamese one (*không, chẳng, chưa, đừng, hết, thiếu, miễn phí, cấm…*), or the reverse;
- a question mark on one side only, in stories, examples and concept cards;
- an empty Vietnamese, or one that copies the English.

The negation marker fired 39 times, the digit marker twice, the question marker twice.

| Kind of flag | Resolution |
|---|---|
| *you're welcome* → *không có gì*; *zero* → *số không* (and *zero dong* → *không có đồng nào*); *first name* → *tên (không kèm họ)*; *much* → *nhiều (không đếm được)* | justified: not a negation, or a gloss's note |
| *free* → *miễn phí*; *afraid to cross* → *không dám*; *without food* → *lúc đói*; *the old houses are all gone* → *không còn nữa* | justified: negation expressed by the meaning |
| *hết* as "all" or "most" (*all of it, everything, most, most of the bill, Safety comes first, the floor was wet* → *ướt hết*); *soon* → *chẳng bao lâu, chẳng mấy chốc*; *You see?* → *Thấy chưa?* | justified: not a negation |
| *but not for that man* → *không đủ cho ông kia*; *I can't really say* → *không chắc lắm*; *Your phone has no map* → *không có bản đồ*; *No problem* → *Không sao*: the script masks *không sao* and *có … không*, so only the English side fired | justified: same meaning |
| English tag *can't I?* → Vietnamese *chứ nhỉ?* | justified: a question tag |
| A blank (*I ___ eat meat.*), where the negation is the answer; a situation prompt (*What does this mean?* for *Bạn không hiểu một ô…*), which is not a translation | justified |
| Digits *12*, *2* written in words in the Vietnamese (*số mười hai*, *hai con trai*) | justified: same number |
| *Can I see your passport?* → *Cho tôi xem hộ chiếu của chị.*: a polite request; *Maybe you lost it at work.* → *Hay anh để quên ở chỗ làm?*: a guess put as a question | justified: natural in each language |

**Open flags: none. Changed: nothing.** Every flagged pair carries the same meaning on
both sides.

**A limit of the script:** the mask *có … không* is wide, so a real negation in a Vietnamese
sentence that also has *có* can pass unflagged. The script finds disagreements in markers, not
in meaning.

## Not covered here

- **Prose that teaches or judges:** guidebooks, concept explanations, writing rubrics,
  scenario goals and exam instructions. These are Tier-1 (owner) material:
  `content/en/REVIEW-TIER1-vi.md`.
- **Long target-language text:** readings, listening scripts, scenario partner lines,
  model answers and the bậc 2 practice texts: `content/en/REVIEW-TIER1-en.md`.

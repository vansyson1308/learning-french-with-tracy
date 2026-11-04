"""Self-check of the zh-vi graded stories (P4d session 5), after ja-check-stories.py (zh-check-answers.py reads the
lessons and the assessment banks; the stories come after the syllabus, at the end of zh-pipeline.sh, so they have their
own script). It reads _drafts/stories/OUTPUT.jsonl and flags, per story:

 1. coverage, through the port of the story engine in zh_stories_lib.py (dictionary segmentation with one step of
    lookahead, the resolver, the bands of the staged syllabus, band A1-0 = the words of units 1-3 + closed-class
    lexemes): every token resolves; word tokens 50-100 (A1-0) or 150-400; >= 95 % known at the band; 3-5 new lexemes,
    each in the text, none from an earlier band; no lexeme beyond the band that is not declared new;
 2. readings (zh_text.Index, as the lessons): every hanzi inside a lexicon surface (names too: 阮 + a lexeme), 中 / 地
    only in compounds, the homographs only in their stored reading (只 zhī, 得 de, 还 hái, 长 cháng), no Latin letter, no
    half-width punctuation; the title too;
 3. measure words: a number, 这/那/哪, 几 or 每 straight before a noun; 二 before a measure word; 两 before no measure
    word; a counted noun with a measure word it does not take (zh_text.NOUN_MEASURES + STORY_MEASURES; an undeclared
    counted noun is a finding);
 4. 了 and friends: 没 + verb … 了 in one clause, 了 with a habit, 正在 … 了, 不有, 吗 after a question word or an A不A
    question, 是 before a bare adjective, 很/非常/太 after 比; the aspect words by band: 了 from A1-1, 过 from A1-2, 着
    from A2-1;
 5. kinship: a third-person narrator says whose family it is (他妈妈, 阮南的妈妈, never a bare or a 我 kin word) and its
    Vietnamese never says "mẹ tôi"; a first-person narrator speaks of 我妈妈;
 6. Vietnamese: every translation, blurb, question and option in Vietnamese with no hanzi; questions end with "?";
 7. questions: three, exactly one an inference, 3-4 distinct options, the answer an option; the answer positions vary;
 8. the file: unique ids and titles, sentence counts 8-60, no sentence over 220 characters, voices N/A/B.
A finding stops the pipeline unless DECIDED gives the reason it stands. Counts go to review/stories-selfcheck.json and,
by hand, to REVIEW-NOTES.md. usage: python -I zh-check-stories.py <repo root>
"""
import json, os, sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from zh_stories_lib import analyze, check_story, first_person  # noqa: E402

ROOT = sys.argv[1]
D = f"{ROOT}/content/zh/_drafts"
# A finding that stands, with its reason. Keys are (story id, message prefix).
DECIDED = {}

stories = [json.loads(line) for line in open(f"{D}/stories/OUTPUT.jsonl", encoding="utf-8")]
findings = []


def flag(sid, msg):
    if (sid, msg.split(":")[0]) in DECIDED:
        return
    findings.append({"id": sid, "message": msg})


ids, titles = Counter(s["id"] for s in stories), Counter(s["title"] for s in stories)
for k, n in ids.items():
    if n > 1:
        flag(k, f"duplicate id ({n})")
for k, n in titles.items():
    if n > 1:
        flag(k, f"duplicate title {k!r} ({n})")

rows = []
answer_positions = Counter()
for s in stories:
    for m in check_story(s):
        flag(s["id"], m)
    a = analyze(s)
    for q in s["questions"]:
        answer_positions[q["answer"]] += 1
    rows.append({"id": s["id"], "band": s["band"], "sentences": len(s["sentences"]), "tokens": a["tokens"],
                 "coverage": round(a["coverage"], 4), "newTokens": a["unknown"], "distinctLexemes": len(a["lexemes"]),
                 "newLexemes": s["newLexemes"], "narrator": "first" if first_person(s) else "third",
                 "speakers": "".join(sorted({x["speaker"] for x in s["sentences"]}))})
# The right option is not always in one place (the builder moves it by the story id).
if answer_positions and max(answer_positions.values()) > 0.6 * sum(answer_positions.values()):
    flag("*", f"answer positions {dict(answer_positions)}: one position takes more than 60 %")

by_band = Counter(r["band"] for r in rows)
summary = {
    "generator": "content/zh/_drafts/_generators/zh-check-stories.py",
    "stories": len(rows),
    "byBand": dict(sorted(by_band.items())),
    "sentences": sum(r["sentences"] for r in rows),
    "questions": sum(len(s["questions"]) for s in stories),
    "tokensRange": {b: [min(r["tokens"] for r in rows if r["band"] == b), max(r["tokens"] for r in rows if r["band"] == b)] for b in sorted(by_band)},
    "answerPositions": dict(sorted(answer_positions.items())),
    "perStory": rows,
    "findings": findings,
    "decided": [{"id": k[0], "rule": k[1], "reason": v} for k, v in sorted(DECIDED.items())],
}
os.makedirs(f"{D}/review", exist_ok=True)
with open(f"{D}/review/stories-selfcheck.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump(summary, f, ensure_ascii=False, indent=2)
    f.write("\n")
for x in findings:
    print(f"{x['id']}: {x['message']}", file=sys.stderr)
if "-v" in sys.argv:
    for r in rows:
        print(r["id"], r["band"], r["sentences"], "sent", r["tokens"], "tok", r["newTokens"], "new", r["coverage"], r["narrator"])
print(f"stories self-check: {summary['stories']} stories {summary['byBand']}, {summary['sentences']} sentences, "
      f"{summary['questions']} questions, {len(findings)} finding(s), {len(DECIDED)} decided")
if findings:
    sys.exit(1)

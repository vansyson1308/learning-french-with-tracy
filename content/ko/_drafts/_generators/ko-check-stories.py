"""Self-check of the ko-vi graded stories (P4e session 4), after ja-check-stories.py: every check of
ko_stories_lib.check_story again over stories/OUTPUT.jsonl, plus the set rules — unique ids, 40–50 stories, the band
mix of plan/STORIES-PLAN.md (A1-1 10–12, A1-2 15–18, A2-1 15–20; micro-stories extra), 3 questions each. Writes
review/stories-selfcheck.json; a finding stops the pipeline.
usage: python -I ko-check-stories.py <repo root>"""
import collections, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ko_stories_lib import D, LEX_BY_ID, STORY_BANDS, analyze, check_story  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
rows = [json.loads(line) for line in open(os.path.join(D, "stories", "OUTPUT.jsonl"), encoding="utf-8")]
findings = []
ids = collections.Counter(r["id"] for r in rows)
findings += [f"duplicate story id {i}" for i, n in ids.items() if n > 1]
for r in rows:
    findings += [f"{r['id']}: {m}" for m in check_story(r)]
bands = collections.Counter(r["band"] for r in rows)
graded = sum(n for b, n in bands.items() if b != "A1-0")
if not 40 <= graded <= 50:
    findings.append(f"{graded} graded stories (40-50, as for de-vi)")
for band, (lo, hi) in {"A1-1": (10, 12), "A1-2": (15, 18), "A2-1": (15, 20)}.items():
    if not lo <= bands.get(band, 0) <= hi:
        findings.append(f"{bands.get(band, 0)} stories of band {band} ({lo}-{hi})")
# Context coverage (plan/STORIES-PLAN.md): which syllabus lexemes the stories give a context.
used = set()
tokens = 0
for r in rows:
    a = analyze(r)
    used |= set(a["lexemes"])
    tokens += a["tokens"]
syllabus = {i for i, b in STORY_BANDS.items() if b in ("A1-0", "A1-1", "A1-2")}
summary = {"stories": len(rows), "byBand": dict(sorted(bands.items())), "wordTokens": tokens,
           "syllabusLexemesInStories": len(used & syllabus), "syllabusLexemes": len(syllabus),
           "a21LexemesInStories": len({i for i in used if STORY_BANDS.get(i) == "A2-1"}),
           "newLexemes": sum(len(r["newLexemes"]) for r in rows), "findings": findings}
assert all(i in LEX_BY_ID for i in used)
os.makedirs(os.path.join(D, "review"), exist_ok=True)
with open(os.path.join(D, "review", "stories-selfcheck.json"), "w", encoding="utf-8", newline="\n") as f:
    json.dump(summary, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("stories self-check:", {k: v for k, v in summary.items() if k != "findings"}, len(findings), "finding(s)")
for m in findings:
    print(" ", m)
sys.exit(1 if findings else 0)

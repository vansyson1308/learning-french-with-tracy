"""Apply the D-10 independent audit to the generated OUTPUT files and the lexicon, after the two review passes. Findings and the decision on each are recorded in
content/it/_drafts/review/decisions-audit.json. usage: python -I it-review-audit.py <repo root>"""
import json, re, sys

ROOT = sys.argv[1]
D = f"{ROOT}/content/it/_drafts"
REVIEW = f"{D}/review"
lines = lambda s: [json.loads(l) for l in open(f"{D}/{s}/OUTPUT.jsonl", encoding="utf-8") if l.strip()]
EN = {"it.story.micro_la_cena#6": "The pasta is on the plate."}
SWEEP = "applied course-wide in the generators: quán bar becomes quán cà phê"
UNCERTAIN = "uncertain: no change, listed in content/it/REVIEW-AI.md for the owner"

lessons = lines("lessons")
stories = lines("stories")
by_ex = {e["id"]: e for lesson in lessons for e in lesson["exercises"]}
by_story = {s["id"]: s for s in stories}
lex_path = f"{ROOT}/content/it/lexicon/lexemes.json"
lex = json.load(open(lex_path, encoding="utf-8"))
by_lex = {l["id"]: l for l in lex["lexemes"]}

decisions = []
for f in json.load(open(f"{REVIEW}/findings-audit.json", encoding="utf-8")):
    i, fix = f["id"], f["fix"]
    if f["uncertain"]:
        decisions.append({**f, "decision": UNCERTAIN})
        continue
    if fix.startswith("Course-wide"):
        decisions.append({**f, "decision": SWEEP})
        continue
    if i.startswith("it:w:"):
        _, gloss, _, vi = re.match(r"(.+?) = (.+?) \| (.+?) \|\| (.+)$", fix).groups()
        by_lex[i]["glosses"]["vi"] = gloss
        by_lex[i]["examples"][0]["translations"]["vi"] = vi
    elif i.startswith("it.story."):
        sid, _, n = i.partition("#")
        m = re.match(r"\[(\w)\] (.+?) \|\| (.+)$", fix)
        s = by_story[sid]["sentences"][int(n)]
        if s["text"] != m.group(2):
            s["text"] = m.group(2)
            s["translation"]["en"] = EN[i]
        s["translation"]["vi"] = m.group(3)
    else:
        by_ex[i]["translation"] = fix
    decisions.append({**f, "decision": "fixed"})

with open(f"{REVIEW}/decisions-audit.json", "w", encoding="utf-8", newline="\n") as out:
    json.dump(decisions, out, ensure_ascii=False, indent=1)
    out.write("\n")
for s, docs in (("lessons", lessons), ("stories", stories)):
    with open(f"{D}/{s}/OUTPUT.jsonl", "w", encoding="utf-8", newline="\n") as out:
        for r in docs:
            out.write(json.dumps(r, ensure_ascii=False) + "\n")
with open(lex_path, "w", encoding="utf-8", newline="\n") as out:
    json.dump(lex, out, ensure_ascii=False, indent=2)
    out.write("\n")
print("audit:", len(decisions), "decided,", sum(d["decision"] == "fixed" for d in decisions), "fixed")

"""Move the core-a2.txt lexemes out of the derived A1 syllabus into content/it/lexicon/syllabus-a2-1.json (QC 2026-10-29 §1.2).
Run after `syllabus.ts derive`. usage: python -I it-a2-split.py <repo root>"""
import json, os, sys

ROOT = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
ids = json.load(open(f"{ROOT}/content/it/lexemes.json", encoding="utf-8"))
by_lemma = {}
for surface, i in ids.items():
    by_lemma[surface] = i
a2 = set()
for line in open(os.path.join(HERE, "core-a2.txt"), encoding="utf-8"):
    if not line.strip() or line.startswith("#"):
        continue
    p = line.split("|")
    match = [i for s, i in ids.items() if s == p[1] or s.endswith(" " + p[1]) or s == "l'" + p[1]]
    if not match:
        raise SystemExit(f"not in the id map: {p[1]}")
    a2.add(match[0])
path = f"{ROOT}/content/it/lexicon/syllabus.json"
syl = json.load(open(path, encoding="utf-8"))
later = [e for e in syl["entries"] if e["lexemeId"] in a2]
syl["entries"] = [e for e in syl["entries"] if e["lexemeId"] not in a2]
syl["derivation"] = syl["derivation"].rstrip(".") + "; the words of content/it/_drafts/_generators/core-a2.txt are band A2-1 (syllabus-a2-1.json)"
with open(path, "w", encoding="utf-8", newline="\n") as f:
    json.dump(syl, f, ensure_ascii=False, indent=2)
    f.write("\n")
doc = {"version": 1, "language": "it", "level": "A2-1", "minLexemes": 0, "derivation": "words the first A2 stories add beyond the A1 syllabus", "entries": later}
with open(f"{ROOT}/content/it/lexicon/syllabus-a2-1.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump(doc, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("A1", len(syl["entries"]), "A2-1", len(later))

"""Restore the committed German frozen id map with the deliberate surface fixes; extend exclude.json.
usage: python -I restore-frozen.py <old frozen.json> <repo root>"""
import json, sys, pathlib
old_path, root = sys.argv[1], pathlib.Path(sys.argv[2])
frozen = json.load(open(old_path, encoding="utf-8"))
RENAMES = {"der Taxi": "das Taxi", "der Deutscher": "der Deutsche", "Freund": "der Freund", "Name": "der Name", "Eltern": "die Eltern", "See": "der See", "Virus": "das Virus", "Knie": "das Knie"}
out = {}
for surface, id_ in frozen.items():
    out[RENAMES.get(surface, surface)] = id_
(root / "content/de/lexemes.json").write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")

ex_path = root / "content/de/lexicon/exclude.json"
ex = json.load(open(ex_path, encoding="utf-8"))
have = {e["key"] for e in ex["entries"]}
ADD = [
    ("ein|adjective", "predicative-only 'on (switch)'; the learner's ein is the article / numeral"),
    ("ein|adverb", "only in compounds (separable prefix ein-)"),
]
for key, why in ADD:
    if key not in have:
        ex["entries"].append({"key": key, "reason": why})
ex_path.write_text(json.dumps(ex, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
print(len(out), "frozen;", len(ex["entries"]), "exclusions")

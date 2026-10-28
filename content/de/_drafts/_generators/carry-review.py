"""Carry the reviewed Vietnamese of the old German lexicon onto a re-authored one.

usage: python -I carry-review.py <old reviewed lexemes.json> <new lexemes.json> <out OUTPUT.jsonl> <out todo.json>

For each new lexeme with the same id, English gloss and part of speech as a reviewed
one, the review is re-applied as a lexicon-review record:
- glossVi;
- examples the reviewer had dropped are dropped again (dropExamples);
- examples the reviewer had added (not in the new sources) are added again;
- each kept example keeps its reviewed translation.
Everything else (new ids, changed English gloss) goes to todo.json for a human review.
"""
import json, sys

old_path, new_path, out_path, todo_path = sys.argv[1:5]
load = lambda p: json.load(open(p, encoding="utf-8"))
old = {l["id"]: l for l in load(old_path)["lexemes"]}
new = load(new_path)["lexemes"]

records, todo = [], []
for lex in new:
    o = old.get(lex["id"])
    same = o and o["glosses"].get("en") == lex["glosses"].get("en")
    gloss = o["glosses"].get("vi") if same else None
    if same and gloss and not str(gloss).startswith("TODO"):
        old_ex = {e["target"]: e for e in o["examples"]}
        new_targets = [e["target"] for e in lex["examples"]]
        drop = [i for i, t in enumerate(new_targets) if t not in old_ex]
        kept = [t for t in new_targets if t in old_ex]
        add = [{"target": t, "en": e["translations"].get("en", ""), "vi": e["translations"]["vi"]} for t, e in old_ex.items() if t not in new_targets]
        rec = {"id": lex["id"], "glossVi": gloss, "exampleTranslationsVi": [old_ex[t]["translations"]["vi"] for t in kept]}
        if drop:
            rec["dropExamples"] = drop
        if add:
            rec["addExamples"] = add
        if o.get("partOfSpeech") != lex.get("partOfSpeech"):
            rec["partOfSpeech"] = o["partOfSpeech"]
        conf = (o.get("relations") or {}).get("confusables")
        if conf:
            rec["confusables"] = conf
        records.append(rec)
        continue
    old_ex = {e["target"]: e["translations"].get("vi") for e in (o or {}).get("examples", [])}
    todo.append({
        "id": lex["id"], "surface": lex["surface"], "pos": lex.get("partOfSpeech"), "gender": lex.get("gender"),
        "en": lex["glosses"].get("en"), "draftVi": lex["glosses"].get("vi"), "oldVi": (o or {}).get("glosses", {}).get("vi"),
        "examples": [{"target": e["target"], "en": e["translations"].get("en"), "oldVi": old_ex.get(e["target"])} for e in lex.get("examples", [])],
    })

with open(out_path, "w", encoding="utf-8", newline="\n") as f:
    for r in records:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
json.dump(todo, open(todo_path, "w", encoding="utf-8", newline="\n"), ensure_ascii=False, indent=1)
print(f"carried {len(records)}, to review {len(todo)} (new ids: {sum(1 for t in todo if t['oldVi'] is None)})")

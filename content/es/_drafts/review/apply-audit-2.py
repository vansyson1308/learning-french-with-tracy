"""es-vi second audit (es-vi-audit-2.json: 0 P0/P1 of 178). Applies the P2s that only widen accepted answers.
usage: python -I apply-audit-2.py"""
import json, pathlib, sys
sys.stdout.reconfigure(encoding="utf-8")
R = pathlib.Path(r"C:\src\lft-air")
P = R / "content/courses/es-vi.json"
pack = json.loads(P.read_text(encoding="utf-8"))
ex = {e["id"]: e for s in pack["sections"] for u in s["units"] for l in u["lessons"] for e in l["exercises"]}
dec = {}
def widen(eid, extra, key):
    e = ex[eid]
    if e["type"] != "typeAnswer":
        dec[key] = f"not applied: {eid} is a {e['type']}"
        return
    added = [v for v in extra if v not in e["alternatives"]]
    e["alternatives"].extend(added)
    dec[key] = f"fixed: accepted {added}"
widen("es-vi:u3-l2-e10", ["Mi mamá tiene un gato."], "es-au2-2")
widen("es-vi:ub-l1-e8", ["Vivo en Hà Nội.", "Vivo en Ha Noi."], "es-au2-3")
e = ex["es-vi:u1-l3-e7"]
if e["type"] == "wordBank":
    want = ["Por", "favor,", "un", "té"]
    toks = e["tokens"]
    if all(t in toks for t in want):
        e.setdefault("alternatives", []).append(want); dec["es-au2-1"] = "fixed: alternative 'Por favor, un té'"
    else:
        dec["es-au2-1"] = f"not applied: the tiles {toks} do not build it as authored (capitalised 'Un')"
dec["es-au2-4"] = "kept: 'Buenos días' → 'Chào buổi sáng' is the better key; the distractor is defensible but not correct"
dec["es-au2-5"] = "kept: same calque family as es-au-6 (kept to mirror por favor)"
dec["es-au2-6"] = "not applied: needs 'ya está' added as a scenario key phrase; listed for a later pass"
P.write_text(json.dumps(pack, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
(R / "content/es/_drafts/review/decisions-audit-2.json").write_text(json.dumps(dec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
print(json.dumps(dec, ensure_ascii=False, indent=1))

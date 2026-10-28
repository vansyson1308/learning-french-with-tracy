"""D-10 AI review, es-vi answer keys: apply the reviewer findings (es-vi-answers.jsonl) to the course
pack and record what happened to each one (decisions-answers.json).
usage: python -I apply-answers.py"""
import json, pathlib
R = pathlib.Path(r"C:\src\lft-air")
F = R / "content/es/_drafts/review/es-vi-answers.jsonl"
P = R / "content/courses/es-vi.json"
findings = [json.loads(l) for l in F.read_text(encoding="utf-8").splitlines() if l.strip() and not json.loads(l).get("summary")]
pack = json.loads(P.read_text(encoding="utf-8"))
ex = {e["id"]: e for s in pack["sections"] for u in s["units"] for l in u["lessons"] for e in l["exercises"]}
decisions = {}

def add_alts(eid, alts, key="alternatives"):
    e = ex[eid]
    cur = e.setdefault(key, [])
    for a in alts:
        if a not in cur and a != e.get("answer"):
            cur.append(a)

ENGINE_PUNCT = {"es-ak-46", "es-ak-47", "es-ak-49"}  # dictation punctuation: fixed in src/lib/grading.ts
NO_CHANGE = {
    "es-ak-50": "the key follows the prompt order; no change",
    "es-ak-51": "P2; the Spanish greeting and its Vietnamese key are equivalent enough at A1",
    "es-ak-52": "'rộng' renders 'ancha' (wide) correctly; kept",
    "es-ak-53": "P2 style; kept",
    "es-ak-54": "P2: both 'Me gusta(n) el té y el pan' are heard; the wordBank key was aligned (es-ak-14 pattern) instead",
}
UNCERTAIN = {"es-ak-44": "speaking target 'Es por la mañana': the model clip says it; a native teacher should choose between 'Es la mañana' and rewording the task"}

for f in findings:
    fid, eid = f["id"], f["exerciseId"]
    if fid in ENGINE_PUNCT:
        decisions[fid] = "engine: dictation ignores punctuation (src/lib/grading.ts)"; continue
    if fid in NO_CHANGE:
        decisions[fid] = "no change: " + NO_CHANGE[fid]; continue
    if fid in UNCERTAIN:
        decisions[fid] = "uncertain: " + UNCERTAIN[fid]; continue
    if f.get("field") in ("alternatives", "acceptedVariants") and str(f["proposed"]).startswith("["):
        add_alts(eid, json.loads(f["proposed"]), f["field"])
        decisions[fid] = "fixed"
        continue
# Hand-decided ones
e = ex["es-vi:u3-l0-e10"]; e["prompt"] = "Bà tôi là người tốt."; add_alts(e["id"], ["Mi abuela es muy buena."]); decisions["es-ak-1"] = "fixed: prompt now says what the key says; 'muy buena' accepted"
ex["es-vi:u1-l1-e6"]["answer"] = ["Chúc", "bạn", "ngủ", "ngon"]; decisions["es-ak-8"] = "fixed"
ex["es-vi:u1-l2-e6"]["alternatives"] = [["chào", "ông"]]; decisions["es-ak-15"] = "fixed: wordBank alternative"
ex["es-vi:u4-l1-e6"]["alternatives"] = [["chiếc", "Xe", "taxi", "ở", "trên", "phố"]]; decisions["es-ak-16"] = "fixed: wordBank alternative"
e = ex["es-vi:ub-l0-e9"]; e["tokens"] = ["el" if t == "la" else t for t in e["tokens"]]; decisions["es-ak-17"] = "fixed: distractor 'la' → 'el'"
ex["es-vi:u4-l0-e7"]["alternatives"] = [["aquí", "está", "La", "estación"]]; decisions["es-ak-18"] = "fixed: wordBank alternative"
ex["es-vi:uq-l1-e1"]["alternatives"] = [["mañana", "El", "tren", "sale", "a", "las", "nueve"]]; decisions["es-ak-19"] = "fixed: wordBank alternative"
e = ex["es-vi:u2-l0-e7"]; e["tokens"] = e["tokens"] + ["está"]; e["answer"] = ["La", "sopa", "está", "buena"]; e["alternatives"] = [["La", "sopa", "es", "buena"]]; decisions["es-ak-14"] = "fixed: key 'está buena', 'es buena' accepted"
e = ex["es-vi:ur-l2-e0"]
for v in ["voy", "quedamos", "vemos"]:
    if v not in e["rubric"]["requireSentenceVerbs"]: e["rubric"]["requireSentenceVerbs"].append(v)
decisions["es-ak-45"] = "fixed (pack exercise and content/es/writing/tasks.json)"
add_alts("es-vi:uh-l3-e3", ["el andén 2", "andén 2"]); decisions["es-ak-48"] = "fixed (digit); punctuation by the engine"
# writing task source mirrors the pack rubric
W = R / "content/es/writing/tasks.json"
w = json.loads(W.read_text(encoding="utf-8"))
for t in w["tasks"]:
    if t["id"] == e["writingTaskId"]:
        for v in ["voy", "quedamos", "vemos"]:
            if v not in t["rubric"]["requireSentenceVerbs"]: t["rubric"]["requireSentenceVerbs"].append(v)
W.write_text(json.dumps(w, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
P.write_text(json.dumps(pack, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
missing = [f["id"] for f in findings if f["id"] not in decisions]
(R / "content/es/_drafts/review/decisions-answers.json").write_text(json.dumps(decisions, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
print("decided", len(decisions), "of", len(findings), "undecided:", missing)

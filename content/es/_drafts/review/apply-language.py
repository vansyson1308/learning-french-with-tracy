"""D-10 AI review, es-vi language pass: apply es-vi-language.jsonl. Every `current` text is
replaced by `proposed` wherever it occurs in the authored Spanish sources (copies of a partner line
live in scenarios.json and listening.json). Findings that need a Vietnamese follow-up or that are
deliberately not applied are decided here; decisions-language.json records the outcome of each.
usage: python -I apply-language.py"""
import json, pathlib
R = pathlib.Path(r"C:\src\lft-air")
F = R / "content/es/_drafts/review/es-vi-language.jsonl"
findings = [json.loads(l) for l in F.read_text(encoding="utf-8").splitlines() if l.strip() and not json.loads(l).get("summary")]
FILES = [R / "content/courses/es-vi.json"] + [p for p in (R / "content/es").rglob("*.json") if "_drafts" not in p.parts and p.name not in ("generated-plan.json", "lexemes.json")]
NOT_APPLIED = {
    "es-lg-24": "changes the sign's meaning (door → stairs); the original is correct",
    "es-lg-26": "P2; 'cerca del tren' is understandable on a sign, kept",
    "es-lg-29": "P2; 'Perdone' as a waiter's opener is idiomatic in Spain",
    "es-lg-85": "P2; the short sentence is clear in context and the audio is clean",
    "es-lg-86": "a dictionary example from an external source (kaikki/Tatoeba); it is not course text and is not rewritten",
    "es-lg-65": "uncertain: pastel vs tarta for a birthday cake — Spain prefers tarta; left for a native teacher",
    "es-lg-19": "uncertain: invariable 'Abierto' on signs is common in Spain",
    "es-lg-20": "uncertain: invariable 'Cerrado' on signs is common in Spain",
    "es-lg-21": "uncertain: invariable 'Abierto' on signs is common in Spain",
}
# Vietnamese text that must follow a Spanish meaning change (same file, exact replace).
VI_FOLLOW = {
    "es-lg-47": [("Mẹ ơi, Toby đâu rồi?", "Bố ơi, Toby đâu rồi?"), ("Mum, where is Toby?", "Dad, where is Toby?")],
    "es-lg-63": [("No, Rosa. I'm a grandpa.", "No, Rosa. I'm old now.")],
}
texts = {p: p.read_text(encoding="utf-8") for p in FILES}
decisions = {}

def esc(s):
    return json.dumps(s, ensure_ascii=False)[1:-1]

for f in findings:
    fid = f["id"]
    if fid in NOT_APPLIED:
        decisions[fid] = ("uncertain: " if NOT_APPLIED[fid].startswith("uncertain") else "not applied: ") + NOT_APPLIED[fid].removeprefix("uncertain: ")
        continue
    cur, new = esc(f["current"]), esc(f["proposed"])
    hits = 0
    for p in FILES:
        n = texts[p].count(cur)
        if n:
            texts[p] = texts[p].replace(cur, new)
            hits += n
    decisions[fid] = f"fixed ({hits} occurrence{'s' if hits != 1 else ''})" if hits else "NOT FOUND"
    for a, b in VI_FOLLOW.get(fid, []):
        for p in FILES:
            texts[p] = texts[p].replace(esc(a), esc(b))
for p, t in texts.items():
    if t != p.read_text(encoding="utf-8"):
        p.write_text(t, encoding="utf-8", newline="\n")
(R / "content/es/_drafts/review/decisions-language.json").write_text(json.dumps(decisions, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
print({k: v for k, v in decisions.items() if v.startswith("NOT FOUND")})
print(sum(1 for v in decisions.values() if v.startswith("fixed")), "fixed of", len(findings))

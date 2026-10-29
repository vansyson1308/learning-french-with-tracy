"""D-10 audit follow-up for fr-vi (fr-vi-audit.json): the audit's P1s and the two applied-fix gaps.
usage: python -I apply-audit.py"""
import json, pathlib, sys
sys.stdout.reconfigure(encoding="utf-8")
R = pathlib.Path(r"C:\src\lft-air")
J = R / "content/fr/translations/vi.jsonl"
DJ = R / "content/fr/translations/vi.dictionary.json"
dic = json.loads(DJ.read_text(encoding="utf-8"))
recs = [json.loads(l) for l in J.read_text(encoding="utf-8").splitlines() if l.strip()]
def dsub(old, new):
    n = 0
    for k, v in dic.items():
        if old in v:
            dic[k] = v.replace(old, new); n += 1
    for r in recs:
        if isinstance(r["vi"], str) and old in r["vi"]:
            r["vi"] = r["vi"].replace(old, new); n += 1
    assert n, old
    return n
counts = {
    "audit P1 ×2 'hỏi thêm nước' → 'gọi thêm nước'": dsub("hỏi thêm nước", "gọi thêm nước"),
    "audit P1 ×2 'một sự thật' → 'một thông tin'": dsub("một sự thật", "một thông tin"),
    "fr-59 carry-over 'một trà' → 'một tách trà'": dsub("một trà", "một tách trà"),
}
for r in recs:
    if r["key"].endswith("units.0.lessons.1.exercises.6.wordBank"):
        r["vi"]["alternatives"] = ["Đây là cậu bé"]
    if r["key"].endswith("units.0.lessons.1.exercises.7.wordBank"):
        r["vi"]["alternatives"] = ["Đây là cô bé"]
counts["fr-24/25 wordBank alternatives"] = 2
J.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in recs), encoding="utf-8", newline="\n")
DJ.write_text(json.dumps(dic, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
print(counts)

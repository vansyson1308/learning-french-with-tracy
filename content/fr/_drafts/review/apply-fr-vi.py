"""D-10 AI review, fr-vi: apply fr-vi.jsonl to the Vietnamese translation sources
(content/fr/translations/vi.jsonl and vi.dictionary.json), then `translate-native.ts apply`
rebuilds fr-vi. The French text is untouched (fr-en stays byte-identical).
usage: python -I apply-fr-vi.py   → decisions-fr-vi.json"""
import json, pathlib
R = pathlib.Path(r"C:\src\lft-air")
F = R / "content/fr/_drafts/review/fr-vi.jsonl"
J = R / "content/fr/translations/vi.jsonl"
DJ = R / "content/fr/translations/vi.dictionary.json"
findings = [json.loads(l) for l in F.read_text(encoding="utf-8").splitlines() if l.strip() and not json.loads(l).get("summary")]
recs = [json.loads(l) for l in J.read_text(encoding="utf-8").splitlines() if l.strip()]
byKey = {r["key"]: r for r in recs}
dic = json.loads(DJ.read_text(encoding="utf-8"))
decisions = {}
UNCERTAIN = {"fr-66": "'nhập cảnh' vs a hotel/arrival form: depends on the scene; left for the owner",
             "fr-67": "same as fr-66", "fr-81": "lower-case 'thứ Bảy' inside a sentence is correct Vietnamese; the option list mixes cases"}
NOT_APPLIED = {"fr-68": "the project term is 'nguyên mẫu' (TRANSLATION-STYLE-vi.md); the GLOSSARY vs style question is listed for the owner"}
PROMPTS = {  # fr-42…50: native-language prompts now translated (scripts/lib/native-fields.ts NATIVE_PROMPT_EXERCISES)
    "fr-42": ("In « les amis », the final s…", "Trong « les amis », chữ s cuối…"),
    "fr-43": ("Which phrase has a required liaison?", "Cụm nào có nối âm bắt buộc?"),
    "fr-44": ("In « vous êtes », the s of vous…", "Trong « vous êtes », chữ s của vous…"),
    "fr-45": ("After « et », a liaison is…", "Sau « et », nối âm thì…"),
    "fr-46": ("Which phrase has NO liaison?", "Cụm nào KHÔNG có nối âm?"),
    "fr-47": ("In « les hommes », the final s of les…", "Trong « les hommes », chữ s cuối của les…"),
    "fr-48": ("In « les héros », the final s of les…", "Trong « les héros », chữ s cuối của les…"),
    "fr-49": ("Both h's in héros and histoire are…", "Chữ h trong héros và histoire đều…"),
    "fr-50": ("Which is written correctly?", "Câu nào viết đúng?"),
}
for f in findings:
    fid, loc, cur, new = f["id"], f.get("locator", ""), f.get("current"), f.get("proposed")
    if fid in UNCERTAIN: decisions[fid] = "uncertain: " + UNCERTAIN[fid]; continue
    if fid in NOT_APPLIED: decisions[fid] = "not applied: " + NOT_APPLIED[fid]; continue
    if fid in PROMPTS:
        en, vi = PROMPTS[fid]; dic[en] = vi; decisions[fid] = "fixed: prompt translated (native-fields + dictionary)"; continue
    if fid == "fr-51":
        decisions[fid] = "fixed in scripts/translate-native.ts: distractors are split into single tiles"; continue
    key = loc.split(" ")[0]
    if key in byKey and isinstance(byKey[key]["vi"], dict):
        byKey[key]["vi"] = json.loads(new); decisions[fid] = "fixed"; continue
    if key in byKey and isinstance(byKey[key]["vi"], str) and cur in byKey[key]["vi"]:
        byKey[key]["vi"] = byKey[key]["vi"].replace(cur, new); decisions[fid] = "fixed"; continue
    if loc in dic and dic[loc] == cur:
        dic[loc] = new; decisions[fid] = "fixed"; continue
    # a guidebook / concept string held in vi.jsonl under another key: replace the exact text
    hit = [r for r in recs if isinstance(r["vi"], str) and cur and cur in r["vi"]]
    if hit:
        for r in hit: r["vi"] = r["vi"].replace(cur, new)
        decisions[fid] = f"fixed ({len(hit)} record{'s' if len(hit) > 1 else ''})"; continue
    hitd = [k for k, v in dic.items() if v == cur]
    if hitd:
        for k in hitd: dic[k] = new
        decisions[fid] = f"fixed ({len(hitd)} dictionary entr{'ies' if len(hitd) > 1 else 'y'})"; continue
    decisions[fid] = "NOT FOUND"
J.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in recs), encoding="utf-8", newline="\n")
DJ.write_text(json.dumps(dic, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
(R / "content/fr/_drafts/review/decisions-fr-vi.json").write_text(json.dumps(decisions, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
print({k: v for k, v in decisions.items() if "NOT FOUND" in v})
print(sum(v.startswith("fixed") for v in decisions.values()), "fixed of", len(findings))

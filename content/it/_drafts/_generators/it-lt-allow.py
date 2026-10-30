"""content/it/languagetool-allow.json from a LanguageTool findings file: every allowed match has a reason; anything unclassified is printed and stays failing.
usage: python -I it-lt-allow.py <repo root> <lt-it-vi.json>"""
import json, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
root, src = sys.argv[1], sys.argv[2]
d = json.load(open(src, encoding="utf-8"))
NAMES = {"Minh", "Trang", "Nga", "Duc", "Duc e", "Bao", "Binh", "Hoa", "Moser", "Lan", "Klara", "Giang", "Phuong", "Dung", "Hien", "Quan", "Rex", "Khoa", "Linh", "Nam", "Pham", "Hue", "Thu", "Tran", "Tuan", "Guten"}
SLOTS = {"bologna", "firenze", "padova", "verona", "anna", "lan", "a roma", "roma", "luca", "minh", "nguyen", "pham", "hoa", "tran", "tuan", "venezia", "caffe"}
WRONG = {"cittá", "citta", "filme", "gentila", "gentilo", "noono", "ventatre", "ventiotti", "ventiotto", "ventitre", "ventiuna", "ventiuno", "ventoto", "ventune"}
REASONS = [
    (NAMES, "A person's or place's name (Vietnamese or foreign), or a loan greeting: not an Italian dictionary word."),
    (SLOTS, "A lowercased rubric variant or typed alternative: grading text compared after folding, never shown to the learner."),
    (WRONG, "A deliberately wrong option of a spelling or number exercise: the distractor must be misspelt."),
]
OTHER = {"Ciao ciao": "The everyday spoken goodbye: the repetition is the idiom.", "aiutarLa": "The formal enclitic is written with a capital La in the Lei register this scenario keeps.", "participle": "An internal paradigm cell id, not learner text.", "oggi": "The sentence follows the salutation \"Ciao Luca,\" in a letter, so it starts in lower case."}
allow, left, seen = [], [], set()
for f in d["findings"]:
    key = (f["rule"], f["match"])
    if key in seen:
        continue
    seen.add(key)
    reason = OTHER.get(f["match"]) or next((r for names, r in REASONS if f["match"] in names), None)
    if reason:
        allow.append({"rule": f["rule"], "match": f["match"], "reason": reason})
    else:
        left.append(key)
allow.sort(key=lambda a: (a["rule"], a["match"]))
with open(f"{root}/content/it/languagetool-allow.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump({"version": 1, "language": "it", "disabledRules": [], "allow": allow}, f, ensure_ascii=False, indent=2)
    f.write("\n")
print(len(allow), "allowed;", "unclassified:", left)

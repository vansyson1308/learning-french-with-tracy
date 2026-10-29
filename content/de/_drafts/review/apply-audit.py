"""D-10 audit follow-up for de-vi (de-vi-audit.json: 1 P1 of 160 = 0.6 %, under the 2 % bar).
Fixes the P1 and the P2s; records each decision in decisions-audit.json.
usage: python -I apply-audit.py"""
import json, pathlib, sys
sys.stdout.reconfigure(encoding="utf-8")
R = pathlib.Path(r"C:\src\lft-air")
def load(rel): return json.loads((R / rel).read_text(encoding="utf-8"))
def save(rel, d): (R / rel).write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
dec = {}

pack = load("content/courses/de-vi.json")
ex = {e["id"]: e for s in pack["sections"] for u in s["units"] for l in u["lessons"] for e in l["exercises"]}
sp = load("content/de/speech/items.json")
e = ex["de-vi:um-l3-e0"]
for v in ["Es ist Montag", "Wir haben heute Montag", "Heute haben wir Montag"]:
    if v not in e["acceptedVariants"]:
        e["acceptedVariants"].append(v)
item = next(i for i in sp["items"] if i["id"] == e["speechItemId"])
item["acceptedVariants"] = list(e["acceptedVariants"])
dec["de-au-1"] = "fixed: 'Es ist Montag', 'Wir haben heute Montag', 'Heute haben wir Montag' accepted"

n = 0
for eid in ("de-vi:un-l3-e3", "de-vi:un-l3-e1"):
    for k, v in ex[eid].items():
        if isinstance(v, str) and v in ("Ngôi nhà cũ.", "Ngôi nhà này cũ rồi."):
            ex[eid][k] = "Ngôi nhà này cũ rồi."; n += 1
dec["de-au-2"] = f"fixed ({n} field(s)): 'Ngôi nhà này cũ rồi.' reads as a sentence, not a noun phrase" if n else "not applied: prompt text not found as a whole field"
save("content/courses/de-vi.json", pack)
save("content/de/speech/items.json", sp)

st = load("content/de/stories/stories.json")
by = {s["id"]: s for s in st["stories"]}
def sent(sid, text):
    x = next((x for x in by[sid]["sentences"] if x["text"] == text), None)
    assert x is not None, (sid, text)
    return x
x = sent("de.story.der_alte_hund_rex", "Am Nachmittag legen sie Rex im Garten unter den großen Baum.")
x["translation"]["vi"] = "Buổi chiều họ đặt Rex nằm trong vườn, dưới gốc cây to."
dec["de-au-3"] = "fixed in Vietnamese (begraben is not in the lexicon; the German stays)"
x = sent("de.story.der_koenig_und_das_feuer", "Ella, du hast uns gerettet!")
x["text"] = "Der König sagt: Ella, du hast uns gerettet!"
x["speaker"] = "N"
if isinstance(x["translation"].get("en"), str):
    x["translation"]["en"] = "The king says: Ella, you saved us!"
x["translation"]["vi"] = "Nhà vua nói: Ella, con đã cứu chúng ta!"
dec["de-au-4"] = "fixed: a narrator cue, so the king no longer shares the villain's voice"
x = sent("de.story.am_bahnhof", "Natürlich. Der Zug fährt um 10 Uhr 15 von Gleis sieben ab.")
x["text"] = "Natürlich. Der Zug fährt um zehn Uhr fünfzehn von Gleis sieben ab."
dec["de-au-5"] = "fixed: numbers written as words throughout the sentence"
save("content/de/stories/stories.json", st)

sc = load("content/de/interaction/scenarios.json")
s = json.dumps(sc, ensure_ascii=False)
old = "Ihre Karte zeigt ein Fenster. Bitte, was möchten Sie?"
assert s.count(old) >= 1
sc = json.loads(s.replace(old, "Ihre Karte zeigt ein Fenster. Was möchten Sie sagen?"))
save("content/de/interaction/scenarios.json", sc)
dec["de-au-6"] = "fixed"

(R / "content/de/_drafts/review/decisions-audit.json").write_text(json.dumps(dec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
print(json.dumps(dec, ensure_ascii=False, indent=1))

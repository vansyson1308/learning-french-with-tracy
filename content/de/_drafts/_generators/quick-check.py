"""Approximate the story resolver offline: unresolved tokens, token counts, declared-new share."""
import json, re, sys
S = r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad"
lex = json.load(open(r"C:\src\lft\content\de\lexicon\lexemes.json", encoding="utf-8"))["lexemes"]
morph = json.load(open(r"C:\src\lft\content\de\lexicon\derived\morphology.json", encoding="utf-8"))["verbs"]
skel = json.load(open(r"C:\src\lft\content\de\_drafts\staged\content\de\stories\stories.json", encoding="utf-8"))
fw = set(skel["functionWords"])
single, pos = {}, {}
for l in lex:
    for f in {l["lookupForm"], l["lemma"]}:
        toks = re.findall(r"[\wäöüÄÖÜß]+", f.lower())
        if len(toks) == 1:
            single.setdefault(toks[0], l["id"])
    pos[l["id"]] = l["partOfSpeech"]
verbs = {l["lemma"].lower(): l["id"] for l in lex if l["partOfSpeech"] == "verb"}
for v in morph:
    vid = verbs.get(v["lemma"].lower())
    if not vid:
        continue
    for r in v["rows"]:
        if " " not in r["mot"]:
            single.setdefault(r["mot"].lower(), vid)
CLOSED = {"sondern", "oh", "ach", "na", "welcher", "welche", "welchen", "welches", "welchem", "einige", "einigen", "einiges"}
END = ["ern", "en", "em", "er", "es", "n", "e", "s", "r", "m", "nen"]
INFL = {"noun", "adjective", "determiner", "pronoun", "numeral"}
FILE_TM = {k.lower(): v for k, v in skel.get("tokenMap", {}).items()}
def resolve(k, tm):
    tm = {**FILE_TM, **tm}
    if k in tm: return tm[k]
    if k in fw: return "function"
    if re.fullmatch(r"\d+([.,]\d+)?", k): return "number"
    if k in single: return single[k]
    for e in END:
        if k.endswith(e) and single.get(k[: -len(e)]) and pos.get(single[k[: -len(e)]]) in INFL:
            return single[k[: -len(e)]]
    return None
ok = True
for line in open(r"C:\src\lft\content\de\_drafts\stories\OUTPUT.jsonl", encoding="utf-8"):
    st = json.loads(line)
    tm = {k.lower(): v for k, v in (st.get("tokenMap") or {}).items()}
    toks = [t.lower() for s in st["sentences"] for t in re.findall(r"[\wäöüÄÖÜß]+", s["text"])]
    un = sorted({t for t in toks if resolve(t, tm) is None})
    new = set(st["newLexemes"])
    newtok = sum(1 for t in toks if resolve(t, tm) in new)
    missing_new = [n for n in new if n not in {resolve(t, tm) for t in toks}]
    flag = "" if 150 <= len(toks) <= 400 else " TOKENS!"
    fn = sorted(k for k, v in tm.items() if v == "function" and k not in CLOSED)
    if fn:
        flag += " FUNCTION-MAPPED (review: closed class only): " + " ".join(fn)
    print(f"{st['id']}: {len(toks)} tokens{flag}, new {newtok} ({newtok / max(1, len(toks)) * 100:.1f} %){' MISSING NEW ' + str(missing_new) if missing_new else ''}{' UNRESOLVED: ' + ' '.join(un) if un else ''}")
    ok = ok and not un and not missing_new and 150 <= len(toks) <= 400
sys.exit(0 if ok else 1)

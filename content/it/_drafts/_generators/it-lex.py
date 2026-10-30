"""Italian lexicon from the curated lists core-*.txt.
usage: python -I it-lex.py review|add|plurals <repo root>
  review   content/it/_drafts/lexicon-review/OUTPUT.jsonl for the 56 it-en pack words (core-0.txt)
  add      content/it/_drafts/lexicon-add/OUTPUT.jsonl for every other word
  plurals  content/it/lexicon/noun-plurals.json from the committed id map
"""
import json, os, re, sys, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
POS = {"N": "noun", "V": "verb", "A": "adjective", "D": "adverb", "P": "pronoun", "T": "determiner", "R": "preposition", "C": "conjunction", "I": "interjection", "E": "expression"}
VOWEL = re.compile(r"^[aeiouàèéìíòóùúh]", re.I)
IMPURE = re.compile(r"^(?:s[^aeiouàèéìíòóùú\s]|z|gn|ps|pn|x|y)", re.I)
PLURAL_ONLY = {"genitori", "pantaloni", "occhiali", "capelli", "soldi", "contanti"}
GENDER = {"m": "masculine", "f": "feminine"}


def rows(name):
    out = []
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if not line or line.startswith("#"):
                continue
            p = line.split("|")
            if len(p) < 9:
                raise SystemExit(f"{name}: short row: {line}")
            out.append({"kind": p[0], "lemma": p[1], "gender": p[2], "vi": p[3], "en": p[4], "topic": p[5], "it": p[6], "exEn": p[7], "exVi": p[8], "plural": p[9] if len(p) > 9 else None})
    return out


def article(noun, gender):
    if noun in PLURAL_ONLY:
        return "gli " if VOWEL.match(noun) or IMPURE.match(noun) else "i "
    if VOWEL.match(noun):
        return "l'"
    if gender == "f":
        return "la "
    return "lo " if IMPURE.match(noun) else "il "


def surface(r):
    return article(r["lemma"], r["gender"]) + r["lemma"] if r["kind"] == "N" else r["lemma"]


def plural_form(n):
    if re.search(r"[àèéìòù]$|[^aeiou]$", n):
        return n
    for a, b in [("ca", "che"), ("ga", "ghe"), ("co", "chi"), ("go", "ghi"), ("io", "i"), ("o", "i"), ("a", "e"), ("e", "i")]:
        if n.endswith(a):
            return n[: -len(a)] + b
    return n


def plural_of(r):
    if r["plural"]:
        return r["plural"]
    if r["lemma"] in PLURAL_ONLY:
        return "—"
    form = plural_form(r["lemma"])
    if r["gender"] == "f":
        return "le " + form
    return ("gli " if VOWEL.match(form) or IMPURE.match(form) else "i ") + form


def main():
    cmd, root = sys.argv[1], sys.argv[2]
    pack, added = rows("core-0.txt"), rows("core-1.txt") + rows("core-2.txt") + rows("core-3.txt") + rows("core-4.txt")
    if cmd == "review":
        lex = {l["surface"]: l for l in json.load(open(f"{root}/content/it/lexicon/lexemes.json", encoding="utf-8"))["lexemes"]}
        os.makedirs(f"{root}/content/it/_drafts/lexicon-review", exist_ok=True)
        with open(f"{root}/content/it/_drafts/lexicon-review/OUTPUT.jsonl", "w", encoding="utf-8", newline="\n") as f:
            for r in pack:
                l = lex[surface(r)]
                # ETL examples come from a subtitle corpus: the course shows its own A1 sentence.
                f.write(json.dumps({"id": l["id"], "glossVi": r["vi"], "exampleTranslationsVi": [], "dropExamples": list(range(len(l["examples"]))), "addExamples": [{"target": r["it"], "en": r["exEn"], "vi": r["exVi"]}]}, ensure_ascii=False) + "\n")
        print("review", len(pack))
    elif cmd == "add":
        os.makedirs(f"{root}/content/it/_drafts/lexicon-add", exist_ok=True)
        seen = {surface(r) for r in pack}
        n = 0
        with open(f"{root}/content/it/_drafts/lexicon-add/OUTPUT.jsonl", "w", encoding="utf-8", newline="\n") as f:
            for r in added:
                s = surface(r)
                if s in seen:
                    raise SystemExit(f"duplicate surface {s}")
                seen.add(s)
                rec = {"lemma": r["lemma"], "partOfSpeech": POS[r["kind"]], "surface": s, "glossEn": r["en"], "glossVi": r["vi"], "topic": r["topic"], "examples": [{"target": r["it"], "en": r["exEn"], "vi": r["exVi"]}]}
                if r["kind"] == "N":
                    rec["gender"] = GENDER[r["gender"]]
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")
                n += 1
        print("add", n, "total", n + len(pack))
    elif cmd == "plurals":
        ids = json.load(open(f"{root}/content/it/lexemes.json", encoding="utf-8"))
        plurals = {ids[surface(r)]: plural_of(r) for r in pack + added if r["kind"] == "N"}
        with open(f"{root}/content/it/lexicon/noun-plurals.json", "w", encoding="utf-8", newline="\n") as f:
            json.dump({"version": 1, "language": "it", "note": "Plural with article of every noun in the Italian lexicon, authored with the curated lists in content/it/_drafts/_generators; — = no plural in everyday use.", "plurals": dict(sorted(plurals.items()))}, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print("plurals", len(plurals))
    else:
        raise SystemExit("usage")


main()

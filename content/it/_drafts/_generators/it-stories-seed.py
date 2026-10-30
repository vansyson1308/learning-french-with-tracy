"""Seed content/it/stories/stories.json: voice cast from the listening cast, function words, shared token map.
Stories themselves come through `author ingest stories`. usage: python -I it-stories-seed.py <repo root>"""
import json, os, sys

ROOT = sys.argv[1]
path = f"{ROOT}/content/it/stories/stories.json"
listening = json.load(open(f"{ROOT}/content/it/reception/listening.json", encoding="utf-8"))
ids = json.load(open(f"{ROOT}/content/it/lexemes.json", encoding="utf-8"))
cast = listening["voiceCast"]
# Closed-class words the story resolver treats as known, plus the elided forms and the present of essere and avere.
FUNCTION = ("il lo la i gli le un uno una l' un' del dello della dei degli delle dell' al allo alla ai agli alle all' dal dallo dalla dai dagli dalle dall' "
            "nel nello nella nei negli nelle nell' sul sullo sulla sui sugli sulle sull' col di d' a ad da in con su per tra fra senza "
            "e ed o ma però se che perché quando come dove quanto chi cosa non né anche "
            "io tu lui lei noi voi loro mi ti si ci vi lo li ne me te c' dov' "
            "mio mia miei mie tuo tua tuoi tue suo sua suoi sue nostro nostra nostri nostre vostro vostra "
            "questo questa questi queste quello quella quelli quelle quel quell' quest' "
            "sono sei è siamo siete ho hai ha abbiamo avete hanno").split()
# A form that is itself a lexeme resolves as that lexeme (so it counts as context), except `non` and the verb forms.
lexemes = {l["lookupForm"].lower() for l in json.load(open(f"{ROOT}/content/it/lexicon/lexemes.json", encoding="utf-8"))["lexemes"]}
ALWAYS = set("non sono sei è siamo siete ho hai ha abbiamo avete hanno".split())
words = sorted(w for w in set(FUNCTION) if w in ALWAYS or w not in lexemes)
# Irregular plurals and forms the endings cannot reach.
TOKENS = {"colleghi": "il collega", "ferma": "fermarsi", "ferma": "fermarsi", "nevica": "nevicare", "compila": "compilare", "arance": "l'arancia", "camicie": "la camicia", "valigie": "la valigia", "chiama": "chiamare", "riposo": "riposarsi", "riposa": "riposarsi", "riposano": "riposarsi", "alzo": "alzarsi", "alza": "alzarsi", "alzi": "alzarsi", "alzano": "alzarsi", "va": "andare", "vanno": "andare", "fa": "fare", "sto": "stare", "sta": "stare", "so": "sapere", "sa": "sapere", "do": "dare", "uomini": "l'uomo", "mani": "la mano", "uova": "l'uovo", "braccia": "il braccio", "orecchie": "l'orecchio", "po": "po'", "buon": "buono", "buona": "buono", "bel": "bello", "bei": "bello", "begli": "bello", "bell'": "bello"}
doc = json.load(open(path, encoding="utf-8")) if os.path.exists(path) else {"version": 1, "language": "it", "stories": []}
doc["voiceCast"] = {"N": cast["A"], "A": cast["A"], "B": cast["B"]}
doc["functionWords"] = words
doc["tokenMap"] = {k: ids[v] for k, v in TOKENS.items() if v in ids}
os.makedirs(os.path.dirname(path), exist_ok=True)
ordered = {k: doc[k] for k in ("version", "language", "voiceCast", "functionWords", "tokenMap", "stories")}
with open(path, "w", encoding="utf-8", newline="\n") as f:
    json.dump(ordered, f, ensure_ascii=False, indent=2)
    f.write("\n")
print("seeded", len(words), "function words")

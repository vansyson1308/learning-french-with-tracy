"""Staged skeleton of content/de/stories/stories.json: voice cast (from listening), function words
(closed-class German forms that are NOT lexicon entries — a lexicon word must stay a lexeme so it
earns context), language-wide tokenMap. Stories are merged in by `author ingest stories`."""
import json, os

ROOT = r"C:\src\lft\content\de"
lex = json.load(open(os.path.join(ROOT, "lexicon", "lexemes.json"), encoding="utf-8"))["lexemes"]
forms = {f.lower() for l in lex for f in (l["lookupForm"], l["lemma"])}
listening = json.load(open(os.path.join(ROOT, "_drafts", "staged", "content", "de", "reception", "listening.json"), encoding="utf-8"))
cast = listening["voiceCast"]
CANDIDATES = """die den dem des einen einem eines eine
mich mir dich dir uns euch ihm ihnen ihre ihren ihrem ihrer ihres seine seinen seinem seiner seines sein
meine meinen meinem meines deine deinen deinem deines unsere unseren unserem eure
keine keinen keinem keines
im am zum zur vom beim ins ans aufs
noch nur so da doch ja denn mal dann schon sehr gern
durch ohne seit zwischen hinter neben während trotz
ganz""".split()
INFLECTING = {"noun", "adjective", "determiner", "pronoun", "numeral"}
pos = {}
for l in lex:
    for f in (l["lookupForm"], l["lemma"]):
        pos.setdefault(f.lower(), l["partOfSpeech"])
ENDINGS = ["nen", "ern", "en", "em", "er", "es", "n", "e", "s"]
def via_ending(w):
    return any(w.endswith(e) and pos.get(w[: -len(e)]) in INFLECTING for e in ENDINGS)
fw = []
for w in CANDIDATES:
    if w in forms or via_ending(w) or w in fw:
        continue
    fw.append(w)
# Stem changes the ending rules never guess (umlaut plurals, irregular comparison, separable stems).
FORMS = {
 "Mann": ["männer", "männern"], "Apfel": ["äpfel", "äpfeln"], "Gast": ["gäste", "gästen"], "Baum": ["bäume", "bäumen"],
 "Haus": ["häuser", "häusern"], "Buch": ["bücher", "büchern"], "Tochter": ["töchter"], "Sohn": ["söhne", "söhnen"],
 "Bruder": ["brüder", "brüdern"], "Mutter": ["mütter"], "Vater": ["väter"], "Hand": ["hände", "händen"], "Fuß": ["füße", "füßen"],
 "Stadt": ["städte", "städten"], "Zug": ["züge", "zügen"], "Bahnhof": ["bahnhöfe"], "Stuhl": ["stühle", "stühlen"],
 "Nacht": ["nächte"], "Wort": ["wörter"], "Land": ["länder", "ländern"], "Glas": ["gläser", "gläsern"], "Arzt": ["ärzte", "ärztin"],
 "Stein": [], "Blume": [], "Kopf": ["köpfe"], "Platz": ["plätze"], "Schuh": [], "Großmutter": [], "Großeltern": [],
 "viel": ["viele", "vielen", "vieles", "vielem"], "gut": ["besser", "bessere", "besseren", "beste", "besten"], "groß": ["größer", "größte", "größten"],
 "anrufen": ["ruft", "rufe", "rufst", "rufen", "rief", "angerufen"], "aufstehen": ["aufgestanden"],
 "Glückwunsch": ["glückwünsche", "glückwünschen"], "Markt": ["märkte", "märkten"], "Pass": ["pässe"], "Topf": ["töpfe"], "Wand": ["wände"], "Schrank": ["schränke"], "Koch": ["köche"], "Ausflug": ["ausflüge"],
 "dunkel": ["dunkle", "dunklen", "dunkles", "dunkler", "dunklem"], "teuer": ["teure", "teuren", "teures", "teurer"],
 "Gruß": ["grüße", "grüßen"],
 "dieser": ["diese", "diesen", "diesem", "dieses"], "jeder": ["jede", "jeden", "jedem", "jedes"],
}
by_lookup = {l["lookupForm"]: l["id"] for l in lex}
tm = {form: by_lookup[lemma] for lemma, forms in FORMS.items() for form in forms}
doc = {"version": 1, "language": "de", "voiceCast": {"N": cast["A"], "A": cast["A"], "B": cast["B"]}, "functionWords": fw, "tokenMap": tm, "stories": []}
target = os.path.join(ROOT, "_drafts", "staged", "content", "de", "stories", "stories.json")
os.makedirs(os.path.dirname(target), exist_ok=True)
if os.path.exists(target):
    old = json.load(open(target, encoding="utf-8"))
    doc["stories"] = old.get("stories", [])
    doc["tokenMap"] = {**old.get("tokenMap", {}), **tm}
with open(target, "w", encoding="utf-8", newline="\n") as f:
    f.write(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")
S = r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad"
open(S + r"\skeleton.txt", "w", encoding="utf-8").write(f"cast {json.dumps(doc['voiceCast'])}\nfunctionWords {len(fw)}: {' '.join(fw)}\nkept as lexemes: {' '.join(w for w in CANDIDATES if w in forms or via_ending(w))}\n")

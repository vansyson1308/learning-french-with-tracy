"""de-vi reception content for section 3: 8 readings + 30 listening clips (original German).
Writes content/de/_drafts/readings/OUTPUT.jsonl and content/de/_drafts/listening/OUTPUT.jsonl.
lexemeRefs are the lexicon entries whose lookup form / lemma appears in the text (plus explicit refs)."""
import json, os, re

ROOT = r"C:\src\lft\content\de"
LEX = json.load(open(os.path.join(ROOT, "lexicon", "lexemes.json"), encoding="utf-8"))["lexemes"]
FORMS = {}
for l in LEX:
    if l["partOfSpeech"] in ("pronoun", "determiner", "preposition", "conjunction"):
        continue  # function words are not listed as context
    for f in {l["lookupForm"], l["lemma"]}:
        FORMS.setdefault(f.lower(), l["id"])
EXTRA_FORMS = {  # inflected forms → lemma (A1 high frequency)
    "fährt": "fahren", "fahre": "fahren", "kommt": "kommen", "kommst": "kommen", "wohnt": "wohnen", "trinkt": "trinken", "isst": "essen",
    "kauft": "kaufen", "spielt": "spielen", "warte": "warten", "wartet": "warten", "öffnen": "öffnen", "schließt": "schließen", "kostet": "kosten",
    "möchten": "möchten", "bezahlen": "bezahlen", "gehen": "gehen", "geht": "gehen", "sieht": "sehen", "macht": "machen", "hat": "haben", "ist": "sein",
    "sind": "sein", "bin": "sein", "habe": "haben",
}
def refs(text, explicit=()):
    out = []
    for tok in re.findall(r"[\wäöüÄÖÜß]+", text):
        t = tok.lower()
        lemma = EXTRA_FORMS.get(t, t)
        i = FORMS.get(lemma) or FORMS.get(t)
        if i and i not in out:
            out.append(i)
    for e in explicit:
        if e not in out:
            out.append(e)
    known = {l["id"] for l in LEX}
    return [i for i in out if i in known]

def gl(surface, vi, en):
    return {"surface": surface, "gloss": {"vi": vi, "en": en}}

READINGS = [
  ("de.read.ug_oeffnungszeiten", "notice", "Öffnungszeiten", ["Bäckerei Schmidt", "Montag bis Freitag: 7 bis 18 Uhr.", "Samstag: 7 bis 12 Uhr.", "Sonntag: geschlossen."],
   ["de.obj.reading.notices_info"], [gl("Bäckerei", "tiệm bánh", "bakery"), gl("geschlossen", "đóng cửa", "closed")], 3),
  ("de.read.ug_nachricht_anna", "message", "Eine Nachricht von Anna", ["Hallo Tom,", "ich bin heute im Café am Bahnhof. Kommst du um drei Uhr? Ich warte auf dich.", "Bis dann, Anna"],
   ["de.obj.reading.short_messages"], [gl("Café", "quán cà phê", "café"), gl("Bis dann", "hẹn gặp lại", "see you")], 3),
  ("de.read.ug_schilder", "notice", "Schilder im Bahnhof", ["Eingang", "Ausgang", "Hier nicht parken!", "Toiletten: links"],
   ["de.obj.reading.notices_info"], [gl("Eingang", "lối vào", "entrance"), gl("Ausgang", "lối ra", "exit"), gl("parken", "đỗ xe", "to park"), gl("Toiletten", "nhà vệ sinh", "toilets"), gl("links", "bên trái", "left")], 4),
  ("de.read.ug_post", "notice", "Die Post", ["Die Post ist heute geschlossen.", "Morgen öffnen wir um 9 Uhr.", "Vielen Dank!"],
   ["de.obj.reading.notices_info"], [gl("geschlossen", "đóng cửa", "closed"), gl("Vielen Dank", "cảm ơn nhiều", "many thanks")], 2),
  ("de.read.uj_mia", "narrative", "Mia fährt zur Arbeit", ["Mia wohnt in Köln. Am Montag fährt sie mit dem Bus zur Arbeit. Die Arbeit beginnt um acht Uhr. Am Abend kocht sie mit ihrem Bruder."],
   ["de.obj.reading.short_texts"], [gl("beginnt", "bắt đầu", "begins"), gl("kocht", "nấu ăn", "cooks")], 4),
  ("de.read.uj_jonas", "narrative", "Der Samstag von Jonas", ["Am Samstag schläft Jonas lange. Dann trinkt er Kaffee und isst ein Brot. Am Nachmittag spielt er mit Freunden Fußball. Am Abend sieht er einen Film."],
   ["de.obj.reading.short_texts"], [gl("schläft", "ngủ", "sleeps"), gl("lange", "lâu", "long"), gl("Nachmittag", "buổi chiều", "afternoon"), gl("Fußball", "bóng đá", "football")], 4),
  ("de.read.uj_bahnhof", "description", "Der Bahnhof am Morgen", ["Es ist sieben Uhr. Am Bahnhof sind viele Menschen. Ein Zug kommt, ein Zug fährt. Eine Frau kauft ein Ticket. Ein Kind trinkt Milch."],
   ["de.obj.reading.short_texts"], [gl("viele", "nhiều", "many")], 4),
  ("de.read.uj_sonntag", "narrative", "Sonntag mit der Familie", ["Am Sonntag ist die Familie zusammen. Die Mutter macht Frühstück. Dann gehen alle in den Park. Der Hund spielt im Wasser."],
   ["de.obj.reading.short_texts"], [gl("alle", "tất cả mọi người", "everyone"), gl("Park", "công viên", "park")], 4),
]

def reading(r):
    rid, kind, title, blocks, objs, glossary, units = r
    text = " ".join(blocks)
    return {"id": rid, "kind": kind, "title": title, "blocks": [{"kind": "paragraph", "text": b} for b in blocks], "objectiveRefs": objs,
            "lexemeRefs": refs(text), "supportGlossary": glossary, "sourceRef": "original-project",
            "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"}}

CLIPS = []
def clip(cid, kind, segs, objs, units=1):
    text = " ".join(t for _, t in segs)
    CLIPS.append({"id": cid, "kind": kind, "segments": [{"speaker": s, "text": t} for s, t in segs], "objectiveRefs": objs, "lexemeRefs": refs(text),
                  "sourceRef": "original-project", "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"}, "scoredPlaybackPolicy": {"maxPlays": 2, "rate": 1}})

FW = ["de.obj.listening.familiar_words"]
for slug, text in [("morgen", "der Morgen"), ("abend", "der Abend"), ("wasser", "das Wasser"), ("zeit", "die Zeit"), ("vater", "der Vater"), ("nacht", "die Nacht"),
                   ("guten_morgen", "Guten Morgen!"), ("guten_abend", "Guten Abend!"), ("gute_nacht", "Gute Nacht!"), ("keine_zeit", "Ich habe keine Zeit.")]:
    clip(f"de.clip.uf_{slug}", "word_phrase", [("A", text)], FW)
AN = ["de.obj.listening.announcements", "de.obj.listening.short_info"]
clip("de.clip.uh_zug_berlin", "announcement", [("A", "Der Zug nach Berlin fährt um acht Uhr von Gleis zwei.")], AN + ["de.obj.numbers.0_100"], 3)
clip("de.clip.uh_verspaetung", "announcement", [("A", "Achtung: Der Zug aus Hamburg kommt zehn Minuten später.")], AN, 2)
clip("de.clip.uh_geschaeft", "announcement", [("A", "Das Geschäft schließt in fünf Minuten. Bitte kommen Sie zur Kasse.")], AN, 2)
clip("de.clip.uh_bus_sieben", "announcement", [("A", "Der Bus Nummer sieben kommt in drei Minuten.")], AN + ["de.obj.numbers.0_100"], 2)
clip("de.clip.uh_warten", "instruction", [("A", "Bitte warten Sie hier.")], ["de.obj.listening.announcements"], 1)
clip("de.clip.uh_geradeaus", "instruction", [("A", "Gehen Sie geradeaus und dann links.")], ["de.obj.listening.announcements"], 2)
clip("de.clip.uh_kasse", "instruction", [("A", "Bitte bezahlen Sie an der Kasse.")], ["de.obj.listening.announcements"], 1)
clip("de.clip.uh_kaffee_preis", "factual", [("A", "Der Kaffee kostet zwei Euro.")], ["de.obj.listening.short_info", "de.obj.numbers.0_100"], 2)
clip("de.clip.uh_ticket_preis", "factual", [("A", "Das Ticket kostet zwanzig Euro.")], ["de.obj.listening.short_info", "de.obj.numbers.0_100"], 2)
clip("de.clip.uh_brot_preis", "factual", [("A", "Das Brot kostet drei Euro fünfzig.")], ["de.obj.listening.short_info", "de.obj.numbers.0_100"], 2)
DI = ["de.obj.listening.short_dialogues"]
clip("de.clip.ui_baeckerei", "dialogue", [("A", "Guten Morgen! Was möchten Sie?"), ("B", "Zwei Brötchen und einen Kaffee, bitte.")], DI, 2)
clip("de.clip.ui_fahrkarte", "dialogue", [("A", "Eine Fahrkarte nach München, bitte."), ("B", "Einfach oder hin und zurück?"), ("A", "Einfach, bitte.")], DI, 2)
clip("de.clip.ui_bezahlen", "dialogue", [("A", "Das macht vier Euro."), ("B", "Kann ich mit Karte bezahlen?"), ("A", "Ja, natürlich.")], DI + ["de.obj.numbers.0_100"], 2)
clip("de.clip.ui_uhrzeit", "dialogue", [("B", "Entschuldigung, wie spät ist es?"), ("A", "Es ist halb drei.")], DI + ["de.obj.numbers.0_100"], 1)
clip("de.clip.ui_brot_milch", "dialogue", [("A", "Kaufst du Brot?"), ("B", "Ja, und Milch.")], DI, 2)
clip("de.clip.ui_zug_wann", "dialogue", [("B", "Wann kommt der Zug?"), ("A", "Um zehn Uhr.")], DI + ["de.obj.numbers.0_100"], 1)
NA = ["de.obj.listening.short_info"]
clip("de.clip.uj_mia", "factual", [("B", "Mia fährt am Montag mit dem Bus zur Arbeit.")], NA, 3)
clip("de.clip.uj_jonas", "factual", [("A", "Am Samstag trinkt Jonas Kaffee und isst ein Brot.")], NA, 3)
clip("de.clip.uj_bahnhof", "factual", [("B", "Am Bahnhof kauft eine Frau ein Ticket.")], NA, 2)
clip("de.clip.uj_sonntag", "factual", [("A", "Am Sonntag ist die Familie zusammen im Park.")], NA, 2)

os.makedirs(os.path.join(ROOT, "_drafts", "readings"), exist_ok=True)
os.makedirs(os.path.join(ROOT, "_drafts", "listening"), exist_ok=True)
with open(os.path.join(ROOT, "_drafts", "readings", "OUTPUT.jsonl"), "w", encoding="utf-8", newline="\n") as f:
    for r in READINGS:
        f.write(json.dumps(reading(r), ensure_ascii=False) + "\n")
with open(os.path.join(ROOT, "_drafts", "listening", "OUTPUT.jsonl"), "w", encoding="utf-8", newline="\n") as f:
    for c in CLIPS:
        f.write(json.dumps(c, ensure_ascii=False) + "\n")
print(len(READINGS), "readings", len(CLIPS), "clips")

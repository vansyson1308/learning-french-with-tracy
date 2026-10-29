"""content/de/lexicon/noun-plurals.json and dative-chunks.json (QC 2026-10-28 German gates)."""
import json
PL = {
 "der Mann": "¨-er", "die Frau": "-en", "der Junge": "-n", "das Mädchen": "-", "das Kind": "-er", "der Apfel": "¨",
 "das Brot": "-e", "das Wasser": "—", "die Milch": "—", "der Morgen": "-", "der Abend": "-e", "die Nacht": "¨-e",
 "der Tag": "-e", "der Freund": "-e", "der Name": "-n", "der Kaffee": "-s", "der Tee": "-s", "der Reis": "—",
 "das Ei": "-er", "der Käse": "-", "das Obst": "—", "der Saft": "¨-e", "der Fisch": "-e", "der Zucker": "—",
 "der Kuchen": "-", "das Frühstück": "-e", "die Schokolade": "-n", "die Familie": "-n", "die Mutter": "¨", "der Vater": "¨",
 "die Eltern": "—", "der Bruder": "¨", "die Schwester": "-n", "der Sohn": "¨-e", "die Tochter": "¨", "der Onkel": "-",
 "die Tante": "-n", "der Hund": "-e", "die Katze": "-n", "die Stadt": "¨-e", "der Bahnhof": "¨-e", "der Zug": "¨-e",
 "die Straße": "-n", "das Hotel": "-s", "der Flughafen": "¨", "das Ticket": "-s", "der Bus": "-se", "das Auto": "-s",
 "das Fahrrad": "¨-er", "das Museum": "Museen", "der Weg": "-e", "der Tisch": "-e", "die Tür": "-en", "das Fenster": "-",
 "der Stuhl": "¨-e", "die Wohnung": "-en", "das Haus": "¨-er", "das Bett": "-en", "die Küche": "-n", "der Schlüssel": "-",
 "die Tasche": "-n", "das Bild": "-er", "die Uhr": "-en", "das Telefon": "-e", "das Handy": "-s", "die Musik": "—",
 "das Foto": "-s", "der Film": "-e", "das Internet": "—", "die Pizza": "-s", "das Problem": "-e", "der Chef": "-s",
 "das Krankenhaus": "¨-er", "das Schlafzimmer": "-", "das Wochenende": "-n", "der Geburtstag": "-e", "die Zahl": "-en",
 "die Minute": "-n", "die Woche": "-n", "der Monat": "-e", "das Jahr": "-e", "die Zeit": "-en", "der Montag": "-e",
 "der Freitag": "-e", "das Geld": "—", "das Alter": "-", "der Fluss": "¨-e", "das Schild": "-er", "die Nachricht": "-en",
 "das Geschäft": "-e", "der Sonntag": "-e", "die Post": "—", "die Karte": "-n", "die Arbeit": "-en", "der Samstag": "-e",
 "der Termin": "-e",
}
ids = {}
for line in open(r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad\nouns.txt", encoding="utf-8"):
    if line.strip():
        i, t = line.rstrip("\n").split("\t")
        ids[t] = i
missing = [t for t in ids if t not in PL]
assert not missing, missing
doc = {
    "version": 1,
    "language": "de",
    "note": "Plural of every noun the de-vi course teaches (QC 2026-10-28 gate noun-plural). Notation: -e, -er, -n, -en, -s, -se, -nen (ending added), ¨ (umlaut only), ¨-e / ¨-er (umlaut + ending), - (unchanged), — (no plural in A1 use, or plural only); a capitalised word is an irregular full plural (Museen).",
    "plurals": {ids[t]: PL[t] for t in sorted(ids, key=lambda t: ids[t])},
}
open(r"C:\src\lft\content\de\pedagogy\noun-plurals.json", "w", encoding="utf-8", newline="\n").write(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")
chunks = [
    "mit dem Bus", "mit dem Zug", "mit dem Auto", "mit dem Fahrrad", "mit dem Taxi", "mit der U-Bahn", "mit der S-Bahn",
    "im Haus", "im Hotel", "im Museum", "im Büro", "im Supermarkt", "im Café", "im Restaurant", "im Wasser", "im Baum",
    "im Kühlschrank", "im Januar", "im Sommer", "im Winter", "in der Schule", "in der Stadt", "in der Küche", "in der Nähe",
    "zum Bahnhof", "zum Museum", "zum Flughafen", "zum Arzt", "zum Frühstück", "zum Geburtstag",
    "zur Post", "zur Arbeit", "zur Schule", "zur Bank",
    "am Montag", "am Dienstag", "am Mittwoch", "am Donnerstag", "am Freitag", "am Samstag", "am Sonntag",
    "am Wochenende", "am Morgen", "am Abend", "am Nachmittag", "am Bahnhof",
    "vom Bahnhof", "beim Arzt", "beim Bäcker",
    "auf dem Feld", "auf dem Tisch", "in einem Hotel", "mit einem Freund",
]
open(r"C:\src\lft\content\de\pedagogy\dative-chunks.json", "w", encoding="utf-8", newline="\n").write(json.dumps({
    "version": 1, "language": "de",
    "note": "Fixed dative chunks allowed before Section 4 (QC 2026-10-28 gate dative-chunks): A1 teaches Nominativ and Akkusativ explicitly; the dative appears only in these formulas until the dative card (de:concept:dative-phrases).",
    "chunks": chunks}, ensure_ascii=False, indent=2) + "\n")
print(len(doc["plurals"]), len(chunks))

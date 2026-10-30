"""it-vi reception content for section 3: 8 readings + 30 listening clips (original Italian).
Writes content/it/_drafts/readings/OUTPUT.jsonl and content/it/_drafts/listening/OUTPUT.jsonl.
lexemeRefs are the lexicon entries whose lookup form / lemma appears in the text.
usage: python -I it-reception-s3.py <repo root>"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from it_refs import refs

ROOT = sys.argv[1] + "/content/it"


def gl(surface, vi, en):
    return {"surface": surface, "gloss": {"vi": vi, "en": en}}


READINGS = [
  ("it.read.ug_orario", "notice", "Orario del negozio", ["Panetteria Rossi", "Da lunedì a venerdì: 7:00–18:00.", "Sabato: 7:00–12:00.", "Domenica: chiuso."],
   ["it.obj.reading.notices_info"], [gl("panetteria", "tiệm bánh mì", "bakery"), gl("chiuso", "đóng cửa", "closed")], 3),
  ("it.read.ug_messaggio_anna", "message", "Un messaggio di Anna", ["Ciao Luca,", "oggi sono al bar vicino alla stazione. Vieni alle tre? Ti aspetto.", "A presto, Anna"],
   ["it.obj.reading.short_messages"], [gl("Ti aspetto", "mình đợi bạn", "I am waiting for you"), gl("A presto", "hẹn sớm gặp lại", "see you soon")], 3),
  ("it.read.ug_cartelli", "notice", "Cartelli alla stazione", ["Ingresso", "Uscita", "Vietato fumare", "Bagno: a sinistra"],
   ["it.obj.reading.notices_info"], [gl("Ingresso", "lối vào", "entrance"), gl("Uscita", "lối ra", "exit"), gl("Vietato fumare", "cấm hút thuốc", "no smoking"), gl("Bagno", "nhà vệ sinh", "toilet"), gl("a sinistra", "bên trái", "on the left")], 4),
  ("it.read.ug_posta", "notice", "La posta", ["Oggi la posta è chiusa.", "Domani apriamo alle 9:00.", "Grazie!"],
   ["it.obj.reading.notices_info"], [gl("chiusa", "đóng cửa", "closed"), gl("apriamo", "chúng tôi mở cửa", "we open")], 2),
  ("it.read.uj_mia", "narrative", "Mia va al lavoro", ["Mia abita a Bologna. Il lunedì prende l'autobus per andare al lavoro. Il lavoro comincia alle otto. La sera cucina con suo fratello."],
   ["it.obj.reading.short_texts"], [gl("comincia", "bắt đầu", "begins"), gl("cucina", "nấu ăn", "cooks")], 4),
  ("it.read.uj_paolo", "narrative", "Il sabato di Paolo", ["Il sabato Paolo si alza tardi. Poi beve un caffè e mangia un cornetto. Il pomeriggio gioca a calcio con gli amici. La sera guarda un film."],
   ["it.obj.reading.short_texts"], [gl("si alza", "thức dậy", "gets up"), gl("tardi", "muộn", "late"), gl("pomeriggio", "buổi chiều", "afternoon"), gl("calcio", "bóng đá", "football")], 4),
  ("it.read.uj_stazione", "description", "La stazione di mattina", ["Sono le sette. Alla stazione c'è molta gente. Un treno arriva, un treno parte. Una donna compra un biglietto. Un bambino beve il latte."],
   ["it.obj.reading.short_texts"], [gl("molta gente", "rất đông người", "many people")], 4),
  ("it.read.uj_domenica", "narrative", "La domenica in famiglia", ["La domenica la famiglia è insieme. La madre prepara la colazione. Poi tutti vanno al parco. Il cane gioca nell'acqua."],
   ["it.obj.reading.short_texts"], [gl("prepara", "chuẩn bị", "prepares"), gl("tutti", "tất cả mọi người", "everyone"), gl("parco", "công viên", "park")], 4),
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


FW = ["it.obj.listening.familiar_words"]
for slug, text in [("mattina", "la mattina"), ("sera", "la sera"), ("acqua", "l'acqua"), ("tempo", "il tempo"), ("padre", "il padre"), ("notte", "la notte"),
                   ("buongiorno", "Buongiorno!"), ("buonasera", "Buonasera!"), ("buonanotte", "Buonanotte!"), ("non_ho_tempo", "Non ho tempo.")]:
    clip(f"it.clip.uf_{slug}", "word_phrase", [("A", text)], FW)
AN = ["it.obj.listening.announcements", "it.obj.listening.short_info"]
clip("it.clip.uh_treno_roma", "announcement", [("A", "Il treno per Roma parte alle otto dal binario due.")], AN + ["it.obj.numbers.0_100"], 3)
clip("it.clip.uh_ritardo", "announcement", [("A", "Attenzione: il treno da Napoli arriva con dieci minuti di ritardo.")], AN, 2)
clip("it.clip.uh_negozio", "announcement", [("A", "Il negozio chiude tra cinque minuti. Per favore, andate alla cassa.")], AN, 2)
clip("it.clip.uh_autobus_sette", "announcement", [("A", "L'autobus numero sette arriva tra tre minuti.")], AN + ["it.obj.numbers.0_100"], 2)
clip("it.clip.uh_aspetti", "instruction", [("A", "Per favore, aspetti qui.")], ["it.obj.listening.announcements"], 1)
clip("it.clip.uh_dritto", "instruction", [("A", "Vada dritto e poi giri a sinistra.")], ["it.obj.listening.announcements"], 2)
clip("it.clip.uh_cassa", "instruction", [("A", "Per favore, paghi alla cassa.")], ["it.obj.listening.announcements"], 1)
clip("it.clip.uh_caffe_prezzo", "factual", [("A", "Il caffè costa due euro.")], ["it.obj.listening.short_info", "it.obj.numbers.0_100"], 2)
clip("it.clip.uh_biglietto_prezzo", "factual", [("A", "Il biglietto costa venti euro.")], ["it.obj.listening.short_info", "it.obj.numbers.0_100"], 2)
clip("it.clip.uh_pane_prezzo", "factual", [("A", "Il pane costa tre euro e cinquanta.")], ["it.obj.listening.short_info", "it.obj.numbers.0_100"], 2)
DI = ["it.obj.listening.short_dialogues"]
clip("it.clip.ui_bar", "dialogue", [("A", "Buongiorno! Cosa desidera?"), ("B", "Due cornetti e un caffè, per favore.")], DI, 2)
clip("it.clip.ui_biglietto", "dialogue", [("A", "Un biglietto per Firenze, per favore."), ("B", "Solo andata?"), ("A", "Sì, solo andata.")], DI, 2)
clip("it.clip.ui_pagare", "dialogue", [("A", "Sono quattro euro."), ("B", "Posso pagare con la carta?"), ("A", "Sì, certo.")], DI + ["it.obj.numbers.0_100"], 2)
clip("it.clip.ui_ora", "dialogue", [("B", "Scusi, che ora è?"), ("A", "Sono le due e mezza.")], DI + ["it.obj.numbers.0_100"], 1)
clip("it.clip.ui_pane_latte", "dialogue", [("A", "Compri il pane?"), ("B", "Sì, e anche il latte.")], DI, 2)
clip("it.clip.ui_treno_quando", "dialogue", [("B", "Quando arriva il treno?"), ("A", "Alle dieci.")], DI + ["it.obj.numbers.0_100"], 1)
NA = ["it.obj.listening.short_info"]
clip("it.clip.uj_mia", "factual", [("B", "Il lunedì Mia prende l'autobus per andare al lavoro.")], NA, 3)
clip("it.clip.uj_paolo", "factual", [("A", "Il sabato Paolo beve un caffè e mangia un cornetto.")], NA, 3)
clip("it.clip.uj_stazione", "factual", [("B", "Alla stazione una donna compra un biglietto.")], NA, 2)
clip("it.clip.uj_domenica", "factual", [("A", "La domenica la famiglia è insieme al parco.")], NA, 2)

os.makedirs(os.path.join(ROOT, "_drafts", "readings"), exist_ok=True)
os.makedirs(os.path.join(ROOT, "_drafts", "listening"), exist_ok=True)
with open(os.path.join(ROOT, "_drafts", "readings", "OUTPUT.jsonl"), "w", encoding="utf-8", newline="\n") as f:
    for r in READINGS:
        f.write(json.dumps(reading(r), ensure_ascii=False) + "\n")
with open(os.path.join(ROOT, "_drafts", "listening", "OUTPUT.jsonl"), "w", encoding="utf-8", newline="\n") as f:
    for c in CLIPS:
        f.write(json.dumps(c, ensure_ascii=False) + "\n")
print(len(READINGS), "readings", len(CLIPS), "clips")

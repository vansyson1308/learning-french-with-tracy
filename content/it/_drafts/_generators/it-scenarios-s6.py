"""it-vi section 6 (interaction): 8 scenarios (register per scenario: tu or Lei, consistent), partner clips, 16 lessons.
Writes content/it/_drafts/scenarios/OUTPUT.jsonl, appends partner clips to the listening OUTPUT, S6 lesson records to argv[2].
usage: python -I it-scenarios-s6.py <repo root> <out.jsonl>"""
import json, os, sys
from collections import Counter

ROOT = sys.argv[1] + "/content/it"
CONV, PRAC = "it.obj.interaction.everyday_conversation", "it.obj.interaction.practical_needs"

# id, family, objective, title vi, goal vi, steps [(partner, rephrase, learner prompt vi, intent, variants, concepts)], end text, miss text
SC = [
 ("ciao_come_stai", "conversation", CONV, "Một lời chào nhanh", "Chào một người bạn, nói bạn khỏe, rồi chào tạm biệt.",
  [("Ciao! Come stai?", "Ciao! Stai bene?", "Hãy chào lại và nói rằng bạn khỏe.", "greet_fine", ["Ciao! Bene, grazie.", "Bene, grazie.", "Sto bene, grazie.", "Molto bene, grazie.", "Bene, e tu?"], [["bene"]]),
   ("Bene! Adesso vado. Ciao!", "Ciao, a presto!", "Hãy chào tạm biệt kiểu thân mật.", "say_bye", ["Ciao!", "A presto!", "Ciao, a presto!", "A domani!"], [["ciao", "presto", "domani"]])],
  "A presto!", "Non importa! Ciao!"),
 ("piacere", "information_exchange", CONV, "Gặp một người lần đầu", "Nói tên và quê của bạn với một người ở lớp học.",
  [("Buongiorno! Come si chiama?", "Qual è il Suo nome?", "Hãy nói tên của bạn: Minh.", "give_name", ["Mi chiamo Minh.", "Il mio nome è Minh.", "Sono Minh.", "Minh."], [["minh"]]),
   ("Piacere! Di dov'è?", "Da dove viene?", "Hãy nói bạn đến từ Việt Nam.", "give_origin", ["Sono vietnamita.", "Vengo dal Vietnam.", "Sono del Vietnam.", "Dal Vietnam."], [["vietnam", "vietnamita"]])],
  "Benvenuto in Italia!", "Non importa. A dopo!"),
 ("al_bar", "transaction", PRAC, "Ở quán bar", "Gọi một ly cà phê và một cái bánh sừng bò, rồi trả tiền.",
  [("Buongiorno! Cosa desidera?", "Cosa prende?", "Hãy gọi một ly cà phê.", "order_coffee", ["Un caffè, per favore.", "Vorrei un caffè, per favore.", "Prendo un caffè."], [["caffè", "caffe"]]),
   ("Altro?", "Desidera altro?", "Hãy gọi thêm một cái bánh sừng bò.", "order_croissant", ["Un cornetto, per favore.", "E un cornetto, per favore.", "Sì, un cornetto."], [["cornetto"]]),
   ("Sono tre euro.", "Tre euro, per favore.", "Hãy đưa tiền và nói một câu lịch sự.", "pay", ["Ecco, grazie.", "Ecco a Lei.", "Ecco tre euro.", "Grazie!"], [["ecco", "grazie"]])],
  "Grazie a Lei! Buona giornata!", "Non importa. Arrivederci!"),
 ("negozio_prezzo", "transaction", PRAC, "Ở cửa hàng", "Hỏi giá một cái túi, rồi mua nó.",
  [("Buongiorno! Posso aiutarLa?", "Cerca qualcosa?", "Hãy hỏi cái túi giá bao nhiêu.", "ask_price", ["Quanto costa la borsa?", "Quanto costa questa borsa?", "Scusi, quanto costa la borsa?"], [["quanto"], ["borsa"]]),
   ("La borsa costa venti euro.", "Venti euro.", "Hãy nói bạn lấy cái túi.", "buy", ["Prendo la borsa.", "Va bene, la prendo.", "Compro la borsa."], [["prendo", "compro"]])],
  "Grazie mille! Arrivederci!", "Non importa. Arrivederci!"),
 ("dove_stazione", "information_exchange", PRAC, "Hỏi đường ra nhà ga", "Hỏi một người lạ nhà ga ở đâu, rồi cảm ơn.",
  [("Sì, mi dica?", "Posso aiutarLa?", "Hãy hỏi nhà ga ở đâu.", "ask_station", ["Scusi, dov'è la stazione?", "Dov'è la stazione?", "Scusi, dove è la stazione?"], [["dov", "dove"], ["stazione"]]),
   ("Vada dritto e poi giri a sinistra.", "Dritto, poi a sinistra.", "Hãy cảm ơn.", "thank", ["Grazie mille!", "Grazie!", "Grazie, signora!"], [["grazie"]])],
  "Prego! Buon viaggio!", "Non importa. Arrivederci!"),
 ("farmacia", "information_exchange", PRAC, "Ở hiệu thuốc", "Nói bạn bị đau đầu, rồi mua thuốc và cảm ơn.",
  [("Buonasera! Come posso aiutarLa?", "Cosa cerca?", "Hãy nói bạn bị đau đầu.", "headache", ["Ho mal di testa.", "Buonasera, ho mal di testa.", "Mi fa male la testa."], [["testa"]]),
   ("Ecco una medicina. Sono cinque euro.", "Cinque euro, per favore.", "Hãy cảm ơn và chào tạm biệt lịch sự.", "thank_bye", ["Grazie! Arrivederci!", "Grazie mille, arrivederci!", "Grazie!"], [["grazie"]])],
  "Prego! Buona serata!", "Non importa. Buona serata!"),
 ("programmi", "conversation", CONV, "Hẹn một người bạn", "Nhận lời hẹn vào thứ Bảy và nói giờ gặp.",
  [("Sei libero sabato?", "Hai tempo sabato?", "Hãy nói rằng bạn rảnh.", "accept", ["Sì, sono libero.", "Sì, sono libera.", "Sì, sabato ho tempo.", "Sì, certo."], [["sì", "si"]]),
   ("Bene! A che ora ci vediamo?", "Quando ci vediamo?", "Hãy nói gặp lúc tám giờ.", "time", ["Alle otto.", "Ci vediamo alle otto.", "Alle 8."], [["otto", "8"]])],
  "Perfetto, a sabato!", "Non importa. Un'altra volta!"),
 ("sono_malato", "information_exchange", PRAC, "Gọi điện xin nghỉ ốm", "Gọi cho công ty, nói bạn bị ốm và hôm nay không đến được.",
  [("Ditta Rossi, buongiorno.", "Pronto, qui è la ditta Rossi.", "Hãy chào, nói tên Minh và nói bạn bị ốm.", "sick", ["Buongiorno, sono Minh. Sono malato.", "Sono Minh, sono malata.", "Sono malato.", "Sono malata."], [["malato", "malata"]]),
   ("Oh, mi dispiace. Oggi non viene?", "Viene oggi?", "Hãy nói hôm nay bạn không đến được.", "not_today", ["No, oggi non vengo.", "No, non posso venire oggi.", "Oggi no."], [["non", "no"]])],
  "Buona guarigione!", "Non importa. Buona guarigione!"),
]
scen, clips, info = [], [], {}


def clip(cid, text, obj):
    clips.append({"id": cid, "kind": "message", "segments": [{"speaker": "A", "text": text}], "objectiveRefs": [obj], "lexemeRefs": [],
                  "sourceRef": "original-project", "authoringSpec": {"informationUnits": 1, "inferenceDemand": "locate"}, "scoredPlaybackPolicy": {"maxPlays": 2, "rate": 1}})


for sid, fam, obj, title, goal, steps, end, miss in SC:
    base = f"it.clip.ix_{sid}"
    nodes = {}
    clip(f"{base}_miss", miss, obj)
    nodes["t_miss"] = {"kind": "terminal", "id": "t_miss", "outcome": "goal_not_met", "text": miss, "clipId": f"{base}_miss"}
    for i, (p, rp, prompt, intent, variants, concepts) in enumerate(steps):
        nxt = f"p{i+1}" if i + 1 < len(steps) else "t_ok"
        clip(f"{base}_{i}", p, obj)
        clip(f"{base}_{i}_s", rp, obj)
        nodes[f"p{i}"] = {"kind": "partner", "id": f"p{i}", "text": p, "clipId": f"{base}_{i}", "rephraseText": rp, "rephraseClipId": f"{base}_{i}_s", "next": f"l{i}"}
        exp = [{"intent": intent, "acceptedVariants": variants, "requiredConcepts": concepts, "next": nxt}]
        nodes[f"l{i}"] = {"kind": "learner", "id": f"l{i}", "prompt": {"vi": prompt, "en": prompt}, "expected": exp, "noMatchNext": f"r{i}", "scored": True}
        nodes[f"r{i}"] = {"kind": "partner", "id": f"r{i}", "text": rp, "clipId": f"{base}_{i}_s", "next": f"l{i}b"}
        nodes[f"l{i}b"] = {"kind": "learner", "id": f"l{i}b", "prompt": {"vi": prompt, "en": prompt}, "expected": exp, "noMatchNext": "t_miss", "scored": False}
    clip(f"{base}_end", end, obj)
    nodes["t_ok"] = {"kind": "terminal", "id": "t_ok", "outcome": "goal_met", "text": end, "clipId": f"{base}_end"}
    scen.append({"id": f"it.scenario.{sid}", "title": {"vi": title, "en": title}, "goal": {"vi": goal, "en": goal}, "taskFamily": fam, "objectiveRefs": [obj],
                 "startNodeId": "p0", "nodes": nodes, "support": {"allowRepeat": True, "allowRephrase": True}, "reserved": False, "sourceRef": "original-project"})
    info[sid] = obj

os.makedirs(os.path.join(ROOT, "_drafts", "scenarios"), exist_ok=True)
with open(os.path.join(ROOT, "_drafts", "scenarios", "OUTPUT.jsonl"), "w", encoding="utf-8", newline="\n") as f:
    for s in scen:
        f.write(json.dumps(s, ensure_ascii=False) + "\n")
with open(os.path.join(ROOT, "_drafts", "listening", "OUTPUT.jsonl"), "a", encoding="utf-8", newline="\n") as f:
    for c in clips:
        f.write(json.dumps(c, ensure_ascii=False) + "\n")

C = "it-vi"
pos = [0]


def place(correct, wrong):
    p = pos[0] % 4
    pos[0] += 1
    o = list(wrong[:3])
    o.insert(p, correct)
    return o, p


def IX(sid):
    return {"type": "interactionScenario", "scenarioId": f"it.scenario.{sid}", "objectiveTargets": [info[sid]]}


def t2n(it, vi, wrong):
    o, p = place(vi, wrong)
    return {"type": "select", "mode": "targetToNative", "prompt": it, "audioTarget": it, "options": [{"text": t} for t in o], "correct": p}


def wb(vi, it, extra):
    ans = it.rstrip(".!?").replace(",", "").split()
    toks = ans + [x for x in extra if x not in ans]
    order = sorted(range(len(toks)), key=lambda i: ((i * 5 + pos[0]) % 7, i))
    pos[0] += 1
    return {"type": "wordBank", "direction": "nativeToTarget", "prompt": vi, "tokens": [toks[i] for i in order], "answer": ans}


def fill(sent, ans, wrong, vi):
    o, p = place(ans, wrong)
    return {"type": "fillBlank", "sentence": sent, "translation": vi, "audioTarget": sent.replace("___", ans), "options": o, "correct": p}


def typ(vi, it, alts):
    return {"type": "typeAnswer", "mode": "produceTarget", "prompt": vi, "audioTarget": it, "answer": it, "alternatives": alts}


L = {
 "us-l0": [t2n("Come stai?", "Bạn khỏe không?", ["Bạn tên gì?", "Bạn ở đâu?", "Mấy giờ rồi?"]), wb("Tôi khỏe, cảm ơn.", "Sto bene grazie.", ["stai", "ciao", "male"]), t2n("Sto bene.", "Tôi khỏe.", ["Tôi mệt.", "Tôi đói.", "Tôi không khỏe."]), typ("Bạn khỏe không?", "Come stai?", ["Come stai"]), fill("Come ___?", "stai", ["sto", "sta", "stanno"], "Bạn khỏe không?")],
 "us-l1": [wb("Hẹn sớm gặp lại!", "A presto!", ["ciao", "domani", "tardi"]), IX("ciao_come_stai"), t2n("Ciao!", "Tạm biệt!", ["Cảm ơn!", "Xin lỗi!", "Làm ơn!"]), fill("Sto ___, grazie.", "bene", ["buono", "tardi", "nuovo"], "Tôi khỏe, cảm ơn."), typ("Tạm biệt, hẹn sớm gặp lại!", "Ciao, a presto!", ["Ciao a presto!"])],
 "us-l2": [t2n("Come si chiama?", "Ông/bà tên là gì?", ["Ông/bà ở đâu?", "Ông/bà khỏe không?", "Ông/bà muốn gì?"]), wb("Tên tôi là Minh.", "Il mio nome è Minh.", ["chiamo", "Suo", "sono"]), t2n("Di dov'è?", "Ông/bà từ đâu đến?", ["Ông/bà sống ở đâu?", "Ông/bà làm nghề gì?", "Ông/bà đi đâu?"]), fill("Qual è il Suo ___?", "nome", ["amico", "giorno", "numero"], "Tên của ông/bà là gì?"), typ("Ông/bà tên là gì?", "Come si chiama?", ["Come si chiama"])],
 "us-l3": [IX("piacere"), t2n("Benvenuto!", "Chào mừng!", ["Chúc ngủ ngon!", "Hẹn gặp lại!", "Cảm ơn nhiều!"]), wb("Tôi là người Việt Nam.", "Sono vietnamita.", ["in", "abito", "è"]), fill("Vengo ___ Vietnam.", "dal", ["al", "nel", "del"], "Tôi đến từ Việt Nam."), typ("Bạn tôi tên là Lea.", "La mia amica si chiama Lea.", ["La mia amica si chiama Lea"])],
 "ut-l0": [t2n("Cosa desidera?", "Ông/bà dùng gì ạ?", ["Bao nhiêu tiền?", "Mấy giờ rồi?", "Ông/bà ở đâu?"]), wb("Cho tôi một ly cà phê.", "Un caffè per favore.", ["tè", "due", "compro"]), t2n("Prendo un caffè.", "Tôi lấy một ly cà phê.", ["Tôi uống trà.", "Tôi không muốn cà phê.", "Tôi mua bánh mì."]), fill("___ un cornetto, per favore.", "Vorrei", ["Vorrai", "Voglia", "Volere"], "Cho tôi một cái bánh sừng bò."), typ("Cho tôi một ly trà.", "Un tè, per favore.", ["Un tè per favore."])],
 "ut-l1": [wb("Tôi trả tiền.", "Pago io.", ["paga", "compro", "tu"]), IX("al_bar"), t2n("Altro?", "Còn gì nữa không?", ["Bao nhiêu tiền?", "Mấy giờ rồi?", "Có gì mới không?"]), fill("Sono quattro ___.", "euro", ["ore", "anni", "giorni"], "Hết bốn euro."), typ("Hết bốn euro.", "Sono quattro euro.", ["Sono 4 euro."])],
 "ut-l2": [t2n("È tutto.", "Thế thôi ạ.", ["Còn nữa.", "Không có gì.", "Tôi không biết."]), wb("Tôi trả bằng thẻ.", "Pago con la carta.", ["compro", "contanti", "il"]), t2n("Posso pagare con la carta?", "Tôi trả bằng thẻ được không?", ["Tôi mua thẻ được không?", "Bao nhiêu tiền?", "Tôi lấy vé được không?"]), fill("Posso ___ con la carta?", "pagare", ["pago", "paga", "comprare"], "Tôi trả bằng thẻ được không?"), typ("Thế thôi ạ.", "È tutto.", ["È tutto"])],
 "ut-l3": [IX("negozio_prezzo"), t2n("Quanto costa la borsa?", "Cái túi giá bao nhiêu?", ["Cái túi ở đâu?", "Cái túi màu gì?", "Cái túi có mới không?"]), wb("Tôi lấy cái túi.", "Prendo la borsa.", ["compra", "il", "prende"]), fill("Quanto ___?", "costa", ["costano", "compro", "paga"], "Cái này giá bao nhiêu?"), typ("Cái này giá bao nhiêu?", "Quanto costa?", ["Quanto costa"])],
 "uu-l0": [t2n("Dov'è la stazione?", "Nhà ga ở đâu?", ["Nhà ga có xa không?", "Tàu đến lúc nào?", "Vé giá bao nhiêu?"]), wb("Khách sạn ở đâu?", "Dov'è l'albergo?", ["quando", "il", "chi"]), t2n("Scusi, dov'è la posta?", "Xin lỗi, bưu điện ở đâu?", ["Xin lỗi, mấy giờ rồi?", "Xin lỗi, ông là ai?", "Xin lỗi, bao nhiêu tiền?"]), fill("___ è la stazione?", "Dov'", ["Chi", "Quando", "Cosa"], "Nhà ga ở đâu?"), typ("Xin lỗi, nhà ga ở đâu?", "Scusi, dov'è la stazione?", ["Scusi dov'è la stazione?"])],
 "uu-l1": [wb("Đi thẳng rồi rẽ trái.", "Dritto e poi a sinistra.", ["destra", "stazione", "dietro"]), IX("dove_stazione"), t2n("Vada dritto.", "Ông/bà cứ đi thẳng.", ["Ông/bà rẽ trái.", "Ông/bà quay lại.", "Ông/bà đợi ở đây."]), fill("Vada dritto e poi giri a ___.", "sinistra", ["dietro", "qui", "tardi"], "Ông/bà đi thẳng rồi rẽ trái."), typ("Rẽ trái.", "Giri a sinistra.", ["A sinistra."])],
 "uu-l2": [t2n("a destra", "bên phải", ["bên trái", "đi thẳng", "phía sau"]), t2n("a sinistra", "bên trái", ["bên phải", "đi thẳng", "ở đây"]), wb("Khách sạn ở bên phải.", "L'albergo è a destra.", ["sinistra", "il", "dritto"]), fill("La strada è a ___.", "sinistra", ["tardi", "bene", "nuova"], "Con đường ở bên trái."), typ("Nhà ga ở bên trái.", "La stazione è a sinistra.", ["La stazione è a sinistra"])],
 "uu-l3": [IX("farmacia"), t2n("Non è lontano.", "Không xa đâu.", ["Xa lắm.", "Ở ngay đây.", "Tôi không biết."]), wb("Tôi bị đau đầu.", "Ho mal di testa.", ["sono", "denti", "ha"]), fill("Ho ___ di testa.", "mal", ["male", "bene", "fame"], "Tôi bị đau đầu."), typ("Khách sạn có xa không?", "L'albergo è lontano?", ["L'albergo è lontano"])],
 "uv-l0": [t2n("A che ora ci vediamo?", "Mấy giờ chúng ta gặp nhau?", ["Chúng ta gặp nhau ở đâu?", "Chúng ta là ai?", "Chúng ta đi đâu?"]), wb("Chúng ta gặp nhau lúc tám giờ.", "Ci vediamo alle otto.", ["al", "vedo", "dieci"]), t2n("Sei libero sabato?", "Thứ Bảy bạn có rảnh không?", ["Thứ Bảy bạn làm gì?", "Thứ Bảy là ngày mấy?", "Bạn có tiền không?"]), fill("Hai ___ sabato?", "tempo", ["soldi", "fame", "lavoro"], "Thứ Bảy bạn có rảnh không?"), typ("Mấy giờ chúng ta gặp nhau?", "A che ora ci vediamo?", ["A che ora ci vediamo"])],
 "uv-l1": [wb("Vâng, tôi có thời gian.", "Sì ho tempo.", ["no", "hai", "soldi"]), IX("programmi"), t2n("A sabato!", "Hẹn thứ Bảy nhé!", ["Hẹn tối nay nhé!", "Thứ Bảy vui vẻ!", "Hôm nay là thứ Bảy."]), fill("Ci ___ sabato.", "vediamo", ["vede", "vedo", "vedi"], "Thứ Bảy chúng ta gặp nhau."), typ("Hẹn thứ Bảy nhé!", "A sabato!", ["A sabato"])],
 "uv-l2": [t2n("Vorrei un appuntamento.", "Tôi muốn đặt một cuộc hẹn.", ["Tôi có một cuộc hẹn.", "Tôi không có thời gian.", "Tôi bị ốm."]), wb("Tôi muốn đặt một cuộc hẹn.", "Vorrei un appuntamento.", ["tempo", "ho", "una"]), t2n("Lunedì va bene?", "Thứ Hai được không?", ["Thứ Hai là ngày mấy?", "Bạn đi thứ Hai à?", "Thứ Hai bạn ở đâu?"]), fill("Vorrei un ___.", "appuntamento", ["ora", "medico", "giorno"], "Tôi muốn đặt một cuộc hẹn."), typ("Thứ Hai lúc mười giờ được không?", "Lunedì alle dieci va bene?", ["Lunedì alle 10 va bene?"])],
 "uv-l3": [IX("sono_malato"), t2n("Sono malato.", "Tôi bị ốm.", ["Tôi khỏe.", "Tôi bận.", "Tôi đến muộn."]), wb("Hôm nay tôi không đến.", "Oggi non vengo.", ["viene", "domani", "sono"]), fill("Oggi sono ___.", "malato", ["grande", "nuovo", "caro"], "Hôm nay tôi bị ốm."), typ("Tôi xin lỗi.", "Mi dispiace.", ["Mi dispiace"])],
}
recs = []
for lid_, exs in L.items():
    out = []
    for i, e in enumerate(exs):
        e = dict(e)
        e["id"] = f"{C}:{lid_}-e{i}"
        out.append(e)
    recs.append({"lessonId": f"{C}:{lid_}", "exercises": out})
with open(sys.argv[2], "w", encoding="utf-8", newline="\n") as f:
    for r in recs:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
print(len(scen), "scenarios", len(clips), "clips", len(recs), "lessons", sum(len(r["exercises"]) for r in recs), dict(Counter(e["type"] for r in recs for e in r["exercises"])))

"""it-vi CILS A1 standard practice track (format per content/it/exam/FORMAT-SOURCES.md).
Original items only. Appends exam stimuli to listening / readings / speech / writing / scenarios OUTPUT
(run after it-assessment.py) and writes exam/OUTPUT.jsonl (one track record).
usage: python -I it-exam-cils.py <repo root>"""
import json, os, sys
from collections import Counter

ROOT = sys.argv[1] + "/content/it"
D = os.path.join(ROOT, "_drafts")
LEX = json.load(open(os.path.join(ROOT, "lexicon", "lexemes.json"), encoding="utf-8"))["lexemes"]
SURF = {l["surface"]: l["id"] for l in LEX}


def lx(*surfaces):
    return [SURF[s] for s in surfaces if s in SURF]


def O(k):
    return f"it.obj.{k}"


TRACK = "cils_a1"
clips, readings, speech, tasks, scenarios, items = [], [], [], [], [], []
pos = [0]


def place(correct, wrong):
    p = pos[0] % (len(wrong) + 1)
    pos[0] += 1
    o = list(wrong)
    o.insert(p, correct)
    return o, p


SEC = {"a": "listening", "l": "reading", "c": "structures", "s": "writing", "o": "speaking"}


def item(form, sec, task, n, exercise, obj):
    slug = f"{form}_{sec}{task}_{n:02d}"
    ex = dict(exercise)
    ex["id"] = f"it-exx-{TRACK}-{slug}"
    items.append({"id": f"it.exi.{TRACK}.{slug}", "itemVersion": 1, "sectionId": SEC[sec], "taskId": f"p{task}", "exercise": ex, "objectiveTargets": [obj]})


def clip(cid, kind, segs, obj, lex=(), units=2):
    clips.append({"id": cid, "kind": kind, "segments": [{"speaker": s, "text": t} for s, t in segs], "objectiveRefs": [obj], "lexemeRefs": lx(*lex),
                  "sourceRef": "original-project", "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"},
                  "scoredPlaybackPolicy": {"maxPlays": 2, "rate": 1}, "use": "exam"})
    return cid


def reading(rid, kind, paras, obj, lex=(), gloss=(), title=None, units=3):
    r = {"id": rid, "kind": kind}
    if title:
        r["title"] = title
    r.update({"blocks": [{"kind": "paragraph", "text": p} for p in paras], "objectiveRefs": [obj], "lexemeRefs": lx(*lex),
              "supportGlossary": [{"surface": a, "gloss": {"vi": b, "en": b}} for a, b in gloss], "sourceRef": "original-project",
              "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"}, "use": "exam"})
    readings.append(r)
    return rid


LD, LA, LI = O("listening.short_dialogues"), O("listening.announcements"), O("listening.short_info")
RM, RN, RT = O("reading.short_messages"), O("reading.notices_info"), O("reading.short_texts")

# ---------------- ASCOLTO ----------------
# Prova 1: six short dialogues or monologues, a/b/c, heard twice.
A1 = {
 "a": [
  ([("A", "Scusi, a che ora parte l'autobus per Siena?"), ("B", "Alle dieci e un quarto.")], "Xe buýt đi Siena chạy lúc mấy giờ?", "10:15", ["10:45", "9:15"], ["l'autobus"]),
  ([("A", "Cosa prendi? Un caffè?"), ("B", "No, grazie. Prendo un tè con il latte.")], "Người thứ hai uống gì?", "Trà với sữa", ["Cà phê", "Sữa"], ["il caffè", "il tè", "il latte"]),
  ([("A", "Scusi, dov'è il bagno?"), ("B", "Al primo piano, vicino alla scala.")], "Nhà vệ sinh ở đâu?", "Ở tầng một", ["Ở tầng trệt", "Ở tầng hai"], ["il bagno"]),
  ([("A", "Quanto costano i pomodori?"), ("B", "Due euro e cinquanta al chilo.")], "Một ký cà chua giá bao nhiêu?", "2,50 €", ["2,15 €", "5,20 €"], ["il pomodoro"]),
  ([("A", "Vieni a lezione lunedì?"), ("B", "Lunedì no, lavoro. Ma mercoledì vengo.")], "Người thứ hai đến lớp vào ngày nào?", "Thứ Tư", ["Thứ Hai", "Thứ Ba"], ["il lunedì", "il mercoledì"]),
  ([("A", "Qual è il tuo numero di telefono?"), ("B", "Tre, tre, otto, sei, quattro, nove.")], "Số điện thoại là số nào?", "338 649", ["383 649", "338 694"], ["il telefono"]),
 ],
 "b": [
  ([("A", "A che ora comincia il film?"), ("B", "Alle sette e mezza. Ci vediamo alle sette davanti al cinema.")], "Bộ phim bắt đầu lúc mấy giờ?", "7:30", ["7:00", "8:30"], ["il film", "il cinema"]),
  ([("A", "Cosa compriamo per la colazione?"), ("B", "Il pane e il formaggio. Le uova ci sono già.")], "Họ mua gì?", "Bánh mì và phô mai", ["Trứng và bánh mì", "Phô mai và trứng"], ["il pane", "il formaggio", "la colazione"]),
  ([("A", "Dove abita adesso tua sorella?"), ("B", "A Torino. Prima abitava a Roma.")], "Bây giờ chị gái sống ở đâu?", "Ở Torino", ["Ở Roma", "Ở Milano"], ["la sorella", "abitare"]),
  ([("A", "Scusi, è questo il binario quattro?"), ("B", "No, questo è il due. Il quattro è lì.")], "Họ đang đứng ở sân ga số mấy?", "Số hai", ["Số bốn", "Số mười bốn"], ["il binario"]),
  ([("A", "Come vai al lavoro? In macchina?"), ("B", "No, in bicicletta. È bello e non costa niente.")], "Người thứ hai đi làm bằng gì?", "Bằng xe đạp", ["Bằng xe hơi", "Bằng xe buýt"], ["la bicicletta", "la macchina", "il lavoro"]),
  ([("A", "Quanto costa la camera?"), ("B", "Settanta euro a notte, con la colazione.")], "Một đêm phòng giá bao nhiêu?", "70 €", ["17 €", "60 €"], ["la camera", "la colazione"]),
 ],
}
# Prova 2: one dialogue, six questions a/b/c, heard twice.
A2 = {
 "a": ([("A", "Pronto, Giulia? Sono Marco. Sei libera sabato?"), ("B", "Ciao Marco! Sabato mattina lavoro, ma il pomeriggio sono libera."), ("A", "Bene! C'è la festa di Luca alle cinque, a casa sua."), ("B", "Che bello! Devo portare qualcosa?"), ("A", "Sì, porta una torta. Io porto la frutta."), ("B", "Va bene. Vengo in autobus. Ci vediamo lì!")],
       ["la festa", "la torta", "la frutta", "l'autobus"],
       [("Giulia làm việc khi nào?", "Sáng thứ Bảy", ["Chiều thứ Bảy", "Chủ nhật"]), ("Bữa tiệc của ai?", "Của Luca", ["Của Marco", "Của Giulia"]), ("Bữa tiệc lúc mấy giờ?", "5 giờ", ["4 giờ", "7 giờ"]),
        ("Bữa tiệc ở đâu?", "Ở nhà Luca", ["Ở quán cà phê", "Ở nhà Giulia"]), ("Giulia mang gì?", "Bánh ngọt", ["Trái cây", "Rượu vang"]), ("Giulia đến bằng gì?", "Xe buýt", ["Xe hơi", "Đi bộ"])]),
 "b": ([("A", "Buongiorno, vorrei prenotare una camera per due notti."), ("B", "Buongiorno. Per quando?"), ("A", "Per venerdì e sabato."), ("B", "Va bene. Una camera singola costa sessanta euro a notte."), ("A", "C'è la colazione?"), ("B", "Sì, dalle sette alle dieci. Il Suo nome, per favore?"), ("A", "Pham. Arrivo alle otto di sera.")],
       ["la camera", "la colazione", "il venerdì", "il sabato"],
       [("Khách muốn đặt phòng mấy đêm?", "Hai đêm", ["Một đêm", "Ba đêm"]), ("Khách ở những ngày nào?", "Thứ Sáu và thứ Bảy", ["Thứ Bảy và Chủ nhật", "Thứ Năm và thứ Sáu"]), ("Phòng đơn giá bao nhiêu một đêm?", "60 euro", ["16 euro", "70 euro"]),
        ("Bữa sáng từ mấy giờ?", "7 giờ", ["8 giờ", "10 giờ"]), ("Khách tên gì?", "Pham", ["Tran", "Nguyen"]), ("Khách đến lúc mấy giờ?", "8 giờ tối", ["8 giờ sáng", "10 giờ tối"])]),
}
for form in "ab":
    for n, (segs, q, ok, wrong, lex) in enumerate(A1[form], 1):
        cid = clip(f"it.clip.cils_{form}_a1_{n:02d}", "dialogue", segs, LD, lex)
        o, p = place(ok, wrong)
        item(form, "a", 1, n, {"type": "listeningComprehension", "clipId": cid, "question": q, "options": [{"text": t} for t in o], "correct": p}, LD)
    segs, lex, qs = A2[form]
    cid = clip(f"it.clip.cils_{form}_a2", "dialogue", segs, LI, lex, 3)
    for n, (q, ok, wrong) in enumerate(qs, 1):
        o, p = place(ok, wrong)
        item(form, "a", 2, n, {"type": "listeningComprehension", "clipId": cid, "question": q, "options": [{"text": t} for t in o], "correct": p}, LI)

# ---------------- COMPRENSIONE DELLA LETTURA ----------------
# Prova 1: one informative text, four questions a/b/c.
L1 = {
 "a": (["La scuola di italiano Dante è in via Roma 12, vicino alla stazione. I corsi per stranieri cominciano a settembre e finiscono a dicembre. Le lezioni sono il lunedì e il giovedì, dalle sei alle otto di sera. Un corso costa cento euro. Per iscriversi, scrivete un'email o venite a scuola la mattina."],
       [("Trường ở đâu?", "Gần nhà ga", ["Gần bảo tàng", "Ở quảng trường"]), ("Khóa học bắt đầu tháng nào?", "Tháng Chín", ["Tháng Mười Hai", "Tháng Một"]), ("Buổi học vào những ngày nào?", "Thứ Hai và thứ Năm", ["Thứ Ba và thứ Sáu", "Mọi ngày"]), ("Khóa học giá bao nhiêu?", "100 euro", ["10 euro", "60 euro"])],
       [("iscriversi", "đăng ký")]),
 "b": (["Il museo della città è aperto tutti i giorni tranne il lunedì, dalle nove alle diciotto. Il biglietto costa otto euro; per gli studenti costa quattro euro. La domenica mattina i bambini entrano gratis. Vicino all'ingresso c'è un piccolo bar. Non si può mangiare nelle sale."],
       [("Bảo tàng đóng cửa ngày nào?", "Thứ Hai", ["Chủ nhật", "Thứ Sáu"]), ("Vé cho sinh viên giá bao nhiêu?", "4 euro", ["8 euro", "9 euro"]), ("Khi nào trẻ em vào miễn phí?", "Sáng Chủ nhật", ["Chiều thứ Bảy", "Mọi ngày"]), ("Quán cà phê ở đâu?", "Gần lối vào", ["Trong phòng trưng bày", "Ngoài quảng trường"])],
       [("tranne", "trừ"), ("gratis", "miễn phí"), ("sale", "các phòng")]),
}
# Prova 2: four short texts, one true statement of three.
L2 = {
 "a": [
  (["Cerco una camera in centro per una studentessa. Massimo 300 euro al mese. Telefonare la sera: 333 445566."], "Câu nào đúng?", "Người đăng tìm một phòng ở trung tâm.", ["Phòng này giá 300 euro một tuần.", "Có thể gọi điện vào buổi sáng."]),
  (["Bar Sport: oggi chiuso per ferie. Riapriamo lunedì alle 7:00."], "Câu nào đúng?", "Hôm nay quán cà phê đóng cửa.", ["Quán cà phê mở cửa vào thứ Hai lúc 8 giờ.", "Quán cà phê bán đồ thể thao."]),
  (["Ciao mamma, torno tardi: ho un esame alle quattro. La cena la preparo io domani. Un bacio, Lan"], "Câu nào đúng?", "Hôm nay Lan về muộn.", ["Lan chuẩn bị bữa tối hôm nay.", "Bài thi vào buổi sáng."]),
  (["Vendo bicicletta nera, quasi nuova, 80 euro. Scrivere a Paolo: paolo@posta.it"], "Câu nào đúng?", "Paolo bán một chiếc xe đạp.", ["Chiếc xe đạp đã rất cũ.", "Muốn mua thì phải gọi điện."]),
 ],
 "b": [
  (["Farmacia Centrale: aperta anche la domenica, dalle 9:00 alle 13:00."], "Câu nào đúng?", "Hiệu thuốc mở cửa sáng Chủ nhật.", ["Hiệu thuốc đóng cửa Chủ nhật.", "Chủ nhật hiệu thuốc mở đến 19 giờ."]),
  (["Cercasi cameriere per ristorante in piazza. Sabato e domenica sera. Parlare con il signor Conti."], "Câu nào đúng?", "Nhà hàng cần người phục vụ cuối tuần.", ["Công việc vào mọi buổi sáng.", "Phải gửi thư cho ông Conti."]),
  (["Caro Marco, il treno arriva alle otto e dieci, binario cinque. Ti aspetto alla stazione. Hoa"], "Câu nào đúng?", "Hoa đợi Marco ở nhà ga.", ["Tàu đến lúc mười giờ tám phút.", "Tàu đến sân ga số tám."]),
  (["Corso di cucina italiana: ogni martedì sera. Portare un coltello e una bottiglia di olio."], "Câu nào đúng?", "Khóa nấu ăn học vào tối thứ Ba.", ["Khóa nấu ăn học vào sáng thứ Ba.", "Học viên phải mang theo rượu vang."]),
 ],
}
# Prova 3: four texts completed by four of eight continuations (A–H): the pool is the whole task's.
L3 = {
 "a": ([("Vado al supermercato perché", 0), ("Ho molto sonno, quindi", 1), ("Il treno è in ritardo e", 2), ("Mi piace il mare, ma", 3)],
       ["non ho il latte.", "vado a letto.", "aspetto alla stazione.", "non so nuotare.", "la casa è grande.", "costa due euro.", "si chiama Marco.", "il libro è nuovo."]),
 "b": ([("Oggi non lavoro perché", 0), ("Fa freddo, quindi", 1), ("Abito a Roma, ma", 2), ("Ho fame e", 3)],
       ["sono malata.", "porto il cappotto.", "lavoro a Tivoli.", "mangio un panino.", "il cane è nero.", "il biglietto è caro.", "domani è lunedì.", "la porta è aperta."]),
}
for form in "ab":
    paras, qs, gloss = L1[form]
    rid = reading(f"it.read.cils_{form}_l1", "description", paras, RT, gloss=gloss, title="Informazioni")
    for n, (q, ok, wrong) in enumerate(qs, 1):
        o, p = place(ok, wrong)
        item(form, "l", 1, n, {"type": "readingComprehension", "readingId": rid, "question": q, "options": [{"text": t} for t in o], "correct": p}, RT)
    for n, (paras, q, ok, wrong) in enumerate(L2[form], 1):
        rid = reading(f"it.read.cils_{form}_l2_{n:02d}", "notice", paras, RN, units=2)
        o, p = place(ok, wrong)
        item(form, "l", 2, n, {"type": "readingComprehension", "readingId": rid, "question": q, "options": [{"text": t} for t in o], "correct": p}, RN)
    starts, pool = L3[form]
    for n, (start, key) in enumerate(starts, 1):
        rid = reading(f"it.read.cils_{form}_l3_{n:02d}", "message", [f"{start} …"], RM, units=1)
        item(form, "l", 3, n, {"type": "readingComprehension", "readingId": rid, "question": "Chọn phần tiếp theo đúng nhất cho câu này.", "options": [{"text": t} for t in pool], "correct": key}, RM)

# ---------------- ANALISI DELLE STRUTTURE DI COMUNICAZIONE ----------------
ART, AUX, VOC = O("articles.definite"), O("verbs.passato_recognition"), O("vocab.everyday_basics")
C1 = {
 "a": [("___ libro di Marco è sul tavolo.", "Il"), ("___ amica di Anna abita a Roma.", "L'"), ("___ zaino è nella camera.", "Lo"), ("___ casa di Luca è grande.", "La"), ("___ studenti sono in classe.", "Gli"),
       ("___ scarpe sono nere.", "Le"), ("___ bambini giocano in giardino.", "I"), ("___ acqua è fredda.", "L'"), ("___ professore parla piano.", "Il"), ("___ amici di Paolo sono simpatici.", "Gli")],
 "b": [("___ treno parte alle otto.", "Il"), ("___ albergo è vicino.", "L'"), ("___ sport mi piace molto.", "Lo"), ("___ porta è aperta.", "La"), ("___ zii di Hoa abitano a Milano.", "Gli"),
       ("___ case sono piccole.", "Le"), ("___ cani sono in giardino.", "I"), ("___ aeroporto è lontano.", "L'"), ("___ pane è buono.", "Il"), ("___ uomini lavorano in ufficio.", "Gli")],
}
C2 = {
 "a": [("Ieri Anna ___ andata a Roma.", "è"), ("Io ___ mangiato la pizza.", "ho"), ("Noi ___ arrivati alle tre.", "siamo"), ("Marco ___ comprato il pane.", "ha"), ("Tu ___ tornato tardi.", "sei"),
       ("I ragazzi ___ giocato a calcio.", "hanno"), ("Voi ___ partiti ieri?", "siete"), ("Noi ___ visto un film.", "abbiamo"), ("Luca ___ uscito alle otto.", "è"), ("Tu ___ letto il giornale?", "hai")],
 "b": [("Domenica Paolo ___ andato al mare.", "è"), ("Io ___ scritto un'email.", "ho"), ("Noi ___ tornati a casa.", "siamo"), ("Lisa ___ preso il treno.", "ha"), ("Tu ___ arrivata presto.", "sei"),
       ("I miei amici ___ mangiato al ristorante.", "hanno"), ("Voi ___ andati a scuola?", "siete"), ("Noi ___ parlato con il medico.", "abbiamo"), ("Hoa ___ entrata nel negozio.", "è"), ("Tu ___ dormito bene?", "hai")],
}
C3 = {
 "a": [("Vorrei un ___ di vino, per favore.", "bicchiere", ["libro", "treno"], "Cho tôi một ly rượu vang."), ("Il medico lavora in ___.", "ospedale", ["cucina", "giardino"], "Bác sĩ làm việc ở bệnh viện."), ("Di sera guardo la ___.", "televisione", ["finestra", "valigia"], "Buổi tối tôi xem ti vi."), ("Per aprire la porta uso la ___.", "chiave", ["penna", "sedia"], "Để mở cửa tôi dùng chìa khóa."),
       ("In inverno fa ___.", "freddo", ["caldo", "bello"], "Mùa đông trời lạnh."), ("Compro il pane in ___.", "panetteria", ["banca", "palestra"], "Tôi mua bánh mì ở tiệm bánh."), ("Il treno parte dal ___ due.", "binario", ["piano", "ponte"], "Tàu chạy từ sân ga số hai."), ("Mia madre e mio padre sono i miei ___.", "genitori", ["amici", "colleghi"], "Mẹ và bố là bố mẹ của tôi.")],
 "b": [("Un chilo di ___, per favore.", "mele", ["sedie", "penne"], "Cho tôi một ký táo."), ("L'insegnante lavora a ___.", "scuola", ["letto", "mare"], "Giáo viên làm việc ở trường."), ("La mattina bevo il ___.", "caffè", ["pollo", "riso"], "Buổi sáng tôi uống cà phê."), ("Per scrivere uso la ___.", "penna", ["chiave", "tazza"], "Để viết tôi dùng bút."),
       ("In estate fa ___.", "caldo", ["freddo", "tardi"], "Mùa hè trời nóng."), ("Prendo le medicine in ___.", "farmacia", ["piazza", "cucina"], "Tôi mua thuốc ở hiệu thuốc."), ("L'aereo parte dall'___.", "aeroporto", ["ufficio", "armadio"], "Máy bay khởi hành từ sân bay."), ("Il figlio di mio fratello è mio ___.", "nipote", ["nonno", "marito"], "Con trai của anh tôi là cháu tôi.")],
}
for form in "ab":
    for n, (sent, ans) in enumerate(C1[form], 1):
        item(form, "c", 1, n, {"type": "typeAnswer", "mode": "produceTarget", "prompt": f"Điền mạo từ xác định: {sent}", "answer": ans, "alternatives": []}, ART)
    for n, (sent, ans) in enumerate(C2[form], 1):
        item(form, "c", 2, n, {"type": "typeAnswer", "mode": "produceTarget", "prompt": f"Điền trợ động từ essere hoặc avere: {sent}", "answer": ans, "alternatives": []}, AUX)
    for n, (sent, ans, wrong, vi) in enumerate(C3[form], 1):
        o, p = place(ans, wrong)
        item(form, "c", 3, n, {"type": "fillBlank", "sentence": sent, "translation": vi, "options": o, "correct": p}, VOC)


# ---------------- PRODUZIONE SCRITTA ----------------
def write(form, task, tid, fam, instr, cue, slots, mn, mx, model, obj, lex=()):
    rubric = {"requiredSlots": [{"id": i, "description": {"vi": d, "en": d}, "variants": v, "cueProvided": c} for i, d, v, c in slots], "minTokens": mn, "maxTokens": mx}
    t = {"id": tid, "taskFamily": fam, "mode": "guided", "instruction": {"vi": instr, "en": instr}}
    if cue:
        t["cueFacts"] = [{"label": {"vi": a, "en": a}, "value": b} for a, b in cue]
    t.update({"rubric": rubric, "modelAnswers": [model], "objectiveRefs": [obj], "lexemeRefs": lx(*lex), "scoredEligibility": True, "reserved": True, "sourceRef": "original-project"})
    tasks.append(t)
    flat = {**rubric, "requiredSlots": [{**s, "description": s["description"]["vi"]} for s in rubric["requiredSlots"]]}
    e = {"type": "guidedWriting", "writingTaskId": tid, "writingMode": "guided", "instruction": instr}
    if cue:
        e["cueFacts"] = [{"label": a, "value": b} for a, b in cue]
    e.update({"rubric": flat, "modelAnswers": [model]})
    item(form, "s", task, 1, e, obj)


WP, WM = O("writing.phrases_sentences"), O("writing.short_message")
GREET = ["ciao", "caro", "cara", "salve", "gentile", "buongiorno"]
CLOSE = ["a presto", "a domani", "un abbraccio", "a sabato", "grazie", "cordiali saluti"]
write("a", 1, "it.write.cils_a_descr", "simple_description",
      "Prova 1 — Hãy tả căn phòng của bạn (20 đến 40 từ): phòng lớn hay nhỏ, trong phòng có gì, bạn làm gì ở đó.", [("Trong phòng", "il letto, il tavolo, la finestra")],
      [("room", "căn phòng", ["camera"], False), ("bed", "cái giường", ["letto"], True), ("table", "cái bàn", ["tavolo"], True), ("do", "bạn làm gì ở đó", ["studio", "dormo", "leggo", "lavoro"], False)], 20, 45,
      "La mia camera è piccola ma bella. C'è un letto, un tavolo e una grande finestra. La sera studio l'italiano in questa stanza grande.", WP, ["la camera", "il letto", "il tavolo", "la finestra"])
write("b", 1, "it.write.cils_b_descr", "simple_description",
      "Prova 1 — Hãy tả gia đình của bạn (20 đến 40 từ): có những ai, họ sống ở đâu, họ làm gì.", [("Gia đình", "il padre, la madre, la sorella")],
      [("family", "gia đình", ["famiglia"], False), ("father", "người bố", ["padre", "papà"], True), ("mother", "người mẹ", ["madre", "mamma"], True), ("where", "nơi họ sống", ["abita", "abitano", "vive", "vivono"], False)], 20, 45,
      "La mia famiglia è piccola. Mio padre e mia madre abitano a Hanoi. Mia sorella studia all'università e lavora in un bar. Io abito in Italia.", WP, ["la famiglia", "il padre", "la madre", "la sorella"])
write("a", 2, "it.write.cils_a_msg", "short_message",
      "Prova 2 — Hãy viết một tin nhắn cho bạn Paolo (15 đến 30 từ): rủ anh ấy đi xem phim, nói ngày, giờ và nơi gặp. Có lời chào và lời kết.", [("Gửi", "Paolo"), ("Ngày", "sabato"), ("Giờ", "8:00"), ("Nơi", "cinema")],
      [("greeting", "lời chào", GREET, False), ("day", "ngày", ["sabato"], True), ("time", "giờ", ["alle otto", "alle 20"], True), ("place", "nơi gặp", ["cinema"], True), ("closing", "lời kết", CLOSE, False)], 12, 35,
      "Ciao Paolo, andiamo al cinema sabato? Ci vediamo alle otto davanti al cinema. A presto, Lan", WM, ["il cinema", "il sabato"])
write("b", 2, "it.write.cils_b_msg", "short_message",
      "Prova 2 — Hãy viết thư ngắn cho một trường học (15 đến 30 từ): hỏi thông tin về khóa học tiếng Ý, hỏi giá và giờ học. Có lời chào và lời kết.", [("Gửi", "Scuola Dante"), ("Hỏi", "prezzo, orario")],
      [("greeting", "lời chào", GREET, False), ("course", "khóa học", ["corso"], False), ("price", "giá", ["costa", "prezzo"], True), ("time", "giờ học", ["orario", "a che ora", "quando"], True), ("closing", "lời kết", CLOSE, False)], 12, 35,
      "Buongiorno, vorrei informazioni sul corso di italiano. Quanto costa? Qual è l'orario delle lezioni? Cordiali saluti, Minh", WM, ["il corso", "l'orario"])


# ---------------- PRODUZIONE ORALE ----------------
def pclip(cid, text, obj):
    clips.append({"id": cid, "kind": "message", "segments": [{"speaker": "A", "text": text}], "objectiveRefs": [obj], "lexemeRefs": [], "sourceRef": "original-project",
                  "authoringSpec": {"informationUnits": 1, "inferenceDemand": "locate"}, "scoredPlaybackPolicy": {"maxPlays": 2, "rate": 1}})


def scenario(form, task, sid, fam, obj, title, goal, steps, end, miss):
    base = f"it.clip.ix_{sid}"
    nodes = {}
    pclip(f"{base}_miss", miss, obj)
    nodes["t_miss"] = {"kind": "terminal", "id": "t_miss", "outcome": "goal_not_met", "text": miss, "clipId": f"{base}_miss"}
    for i, (p, rp, prompt, intent, variants, concepts) in enumerate(steps):
        nxt = f"p{i+1}" if i + 1 < len(steps) else "t_ok"
        pclip(f"{base}_{i}", p, obj)
        pclip(f"{base}_{i}_s", rp, obj)
        nodes[f"p{i}"] = {"kind": "partner", "id": f"p{i}", "text": p, "clipId": f"{base}_{i}", "rephraseText": rp, "rephraseClipId": f"{base}_{i}_s", "next": f"l{i}"}
        exp = [{"intent": intent, "acceptedVariants": variants, "requiredConcepts": concepts, "next": nxt}]
        nodes[f"l{i}"] = {"kind": "learner", "id": f"l{i}", "prompt": {"vi": prompt, "en": prompt}, "expected": exp, "noMatchNext": f"r{i}", "scored": True}
        nodes[f"r{i}"] = {"kind": "partner", "id": f"r{i}", "text": rp, "clipId": f"{base}_{i}_s", "next": f"l{i}b"}
        nodes[f"l{i}b"] = {"kind": "learner", "id": f"l{i}b", "prompt": {"vi": prompt, "en": prompt}, "expected": exp, "noMatchNext": "t_miss", "scored": False}
    pclip(f"{base}_end", end, obj)
    nodes["t_ok"] = {"kind": "terminal", "id": "t_ok", "outcome": "goal_met", "text": end, "clipId": f"{base}_end"}
    scenarios.append({"id": f"it.scenario.{sid}", "title": {"vi": title, "en": title}, "goal": {"vi": goal, "en": goal}, "taskFamily": fam, "objectiveRefs": [obj],
                      "startNodeId": "p0", "nodes": nodes, "support": {"allowRepeat": True, "allowRephrase": True}, "reserved": True, "sourceRef": "original-project"})
    item(form, "o", task, 1, {"type": "interactionScenario", "scenarioId": f"it.scenario.{sid}"}, obj)


CONV = O("interaction.everyday_conversation")
scenario("a", 1, "cils_a_colloquio", "information_exchange", CONV, "Prova 1 — Trò chuyện với giám khảo", "Trả lời câu hỏi của giám khảo về bản thân: tên, quê, nơi sống.",
 [("Buongiorno. Come si chiama?", "Qual è il Suo nome?", "Hãy nói tên của bạn: Lan.", "name", ["Mi chiamo Lan.", "Il mio nome è Lan.", "Sono Lan."], [["lan"]]),
  ("Di dov'è?", "Da dove viene?", "Hãy nói bạn đến từ Việt Nam.", "origin", ["Sono vietnamita.", "Vengo dal Vietnam.", "Sono del Vietnam."], [["vietnam", "vietnamita"]]),
  ("Dove abita in Italia?", "In quale città abita?", "Hãy nói bạn sống ở Padova.", "city", ["Abito a Padova.", "Vivo a Padova.", "A Padova."], [["padova"]])],
 "Grazie, va bene.", "Non importa. Grazie!")
scenario("b", 1, "cils_b_colloquio", "information_exchange", CONV, "Prova 1 — Trò chuyện với giám khảo", "Trả lời câu hỏi của giám khảo: tên, công việc, ngôn ngữ.",
 [("Buongiorno. Come si chiama?", "Qual è il Suo nome?", "Hãy nói tên của bạn: Minh.", "name", ["Mi chiamo Minh.", "Il mio nome è Minh.", "Sono Minh."], [["minh"]]),
  ("Che lavoro fa?", "Dove lavora?", "Hãy nói bạn làm đầu bếp.", "job", ["Sono cuoco.", "Faccio il cuoco.", "Lavoro come cuoco."], [["cuoco"]]),
  ("Quali lingue parla?", "Parla altre lingue?", "Hãy nói bạn nói tiếng Việt và tiếng Ý.", "languages", ["Parlo vietnamita e italiano.", "Vietnamita e italiano."], [["vietnamita"], ["italiano"]])],
 "Grazie, va bene.", "Non importa. Grazie!")
SD = O("speaking.describe")


def monologue(form, sid, instr, cue, target, variants, concepts):
    it = {"id": sid, "taskFamily": "description", "elicitationType": "information_prompt",
          "prompt": {"instruction": {"vi": instr, "en": instr}, "cueFacts": [{"label": {"vi": a, "en": a}, "value": b} for a, b in cue]},
          "target": target, "acceptedVariants": variants, "requiredConcepts": concepts, "objectiveRefs": [SD], "lexemeRefs": [], "evidenceLexemeRefs": [],
          "assistancePolicy": {"allowContextualBias": False, "revealTargetAfterAttempts": None}, "scoredEligibility": True, "modelAudioRef": None,
          "recognitionLocale": "it-IT", "allowedAttempts": 2, "reserved": True, "sourceRef": "original-project"}
    speech.append(it)
    item(form, "o", 2, 1, {"type": "speakProduction", "speechItemId": sid, "instruction": instr, "cueFacts": [{"label": a, "value": b} for a, b in cue],
                           "target": target, "acceptedVariants": variants, "requiredConcepts": concepts, "evidenceLexemeRefs": [], "revealTargetAfterAttempts": None,
                           "allowContextualBias": False, "modelClipId": None, "allowedAttempts": 2}, SD)


monologue("a", "it.speak.cils_a_mono", "Prova 2 — Hãy nói về ngôi nhà của bạn theo các từ khoá.", [("La casa", "piccola"), ("Stanze", "3"), ("Città", "Padova")],
          "La mia casa è piccola, ha tre stanze ed è a Padova",
          ["La mia casa è piccola, ha tre stanze ed è a Padova", "Ho una casa piccola con tre stanze a Padova"], [["casa"], ["piccola"], ["tre", "3"], ["padova"]])
monologue("b", "it.speak.cils_b_mono", "Prova 2 — Hãy nói về một ngày của bạn theo các từ khoá.", [("Mattina", "lavoro"), ("Pomeriggio", "studio"), ("Sera", "cucino")],
          "La mattina lavoro, il pomeriggio studio e la sera cucino",
          ["La mattina lavoro, il pomeriggio studio e la sera cucino", "Di mattina lavoro, di pomeriggio studio e di sera cucino"], [["lavoro"], ["studio"], ["cucino"]])


# ---------------- track ----------------
def T(vi, en=None):
    return {"vi": vi, "en": en or vi}


def task(tid, title, instr, fmt, n, **kw):
    t = {"id": tid, "title": T(title), "instruction": T(instr), "format": fmt, "itemsPerForm": n}
    t.update(kw)
    return t


LG = "https://cils.unistrasi.it/public/articoli/52/Linee_guida_cils_pdf.pdf"
IS = "https://cils.unistrasi.it/public/articoli/28/Istruzioni%20svolgimento%20prove.pdf"
SA = "https://cils.unistrasi.it/1/89/195/Prove_Liv._A1_standard.htm"
VA = "https://cils.unistrasi.it/1/117/83/La_valutazione.htm"
SECTIONS = ["listening", "reading", "structures", "writing", "speaking"]
track = {
 "id": f"it.exam.{TRACK}", "trackVersion": 1, "name": "CILS A1 standard", "level": "A1",
 "title": {"vi": "Luyện thi CILS A1", "en": "CILS A1 practice"},
 "description": {
  "vi": "Luyện theo định dạng công khai của CILS A1 standard (Università per Stranieri di Siena, theo Linee guida CILS và đề mẫu tháng 6 năm 2017): Nghe, Đọc, Cấu trúc ngôn ngữ, Viết và Nói, với số câu, thời gian và cách tính điểm của kỳ thi. Khoá chỉ mô phỏng module A1 standard, không gồm các module integrazione in Italia, bambini hay adolescenti. Phần Nói trong kỳ thi thật là thi riêng với giám khảo; ứng dụng đóng vai giám khảo và rút gọn thành các câu hỏi có hướng dẫn. Mọi câu hỏi do khoá học tự soạn, không phải đề thi thật.",
  "en": "Practise the public CILS A1 standard format (Università per Stranieri di Siena, per the Linee guida CILS and the June 2017 sample): listening, reading, language structures, writing and speaking, with the exam's items, timing and scoring. Only the A1 standard module is modelled, not the integrazione in Italia, bambini or adolescenti modules. The real speaking test is one to one with an examiner; the app plays the examiner and reduces it to guided questions. Every question is original to this course, never a real exam item."},
 "formatSource": {
  "publisher": "Università per Stranieri di Siena, Centro CILS",
  "references": [
   {"url": LG, "title": "Linee guida CILS (Università per Stranieri di Siena)", "retrieved": "2026-10-29"},
   {"url": IS, "title": "Centro CILS — Istruzioni per lo svolgimento delle prove", "retrieved": "2026-10-29"},
   {"url": SA, "title": "Centro CILS — Prove Livello A1 standard (sessione giugno 2017)", "retrieved": "2026-10-29"},
   {"url": VA, "title": "Centro CILS — La valutazione", "retrieved": "2026-10-29"},
  ],
  "checkedAgainstOfficialGuide": True, "checkedBy": "coding agent (owner-delegated)", "checkedAt": "2026-10-29",
  "note": {"vi": "Định dạng theo Linee guida CILS và đề mẫu A1 standard tháng 6 năm 2017, đọc trực tiếp ngày 2026-10-29; Centro CILS ghi các bảng trong Linee guida chỉ mang tính tham khảo. Mỗi phần 12 điểm, đạt phần khi được ít nhất 7; tổng tối đa 60, tối thiểu 35. Thời hạn và điều kiện chứng chỉ: xem trang chính thức La valutazione.",
           "en": "Format per the Linee guida CILS and the June 2017 A1 standard sample, read directly on 2026-10-29; the Centro CILS calls the guide's tables indicative. Each part carries 12 points and is passed at 7; the maximum is 60 and the minimum total 35. For certificate conditions see the official La valutazione page."}},
 "sections": [
  {"id": "listening", "skill": "listening", "title": T("Ascolto — Nghe"), "minutes": 30, "maxPoints": 12, "playsPerRecording": 2, "tasks": [
    task("p1", "Prova 1 — Sáu đoạn ngắn", "Nghe mỗi đoạn hai lần và chọn a, b hoặc c.", "mcq3", 6),
    task("p2", "Prova 2 — Một cuộc hội thoại", "Nghe cuộc hội thoại hai lần và trả lời sáu câu hỏi, chọn a, b hoặc c.", "mcq3", 6)]},
  {"id": "reading", "skill": "reading", "title": T("Comprensione della lettura — Đọc"), "minutes": 30, "maxPoints": 12, "tasks": [
    task("p1", "Prova 1 — Một văn bản thông tin", "Đọc văn bản và chọn a, b hoặc c cho bốn câu hỏi.", "mcq3", 4),
    task("p2", "Prova 2 — Bốn văn bản ngắn", "Với mỗi văn bản, chọn một câu đúng trong ba câu.", "mcq3", 4),
    task("p3", "Prova 3 — Bốn câu để hoàn thành", "Hoàn thành mỗi câu bằng một trong tám phần tiếp theo. Bốn phần không được dùng.", "completeFromPool", 4, poolSize=8)]},
  {"id": "structures", "skill": "structures", "title": T("Analisi delle strutture di comunicazione — Cấu trúc ngôn ngữ"), "minutes": 30, "maxPoints": 12, "tasks": [
    task("p1", "Prova 1 — Mạo từ xác định", "Viết mạo từ đúng vào mỗi chỗ trống (10 chỗ).", "formCompletion", 10, points=4),
    task("p2", "Prova 2 — Trợ động từ essere và avere", "Viết dạng đúng của essere hoặc avere vào mỗi chỗ trống (10 chỗ).", "formCompletion", 10, points=4),
    task("p3", "Prova 3 — Chọn từ", "Chọn a, b hoặc c cho mỗi chỗ trống (8 chỗ).", "cloze", 8, points=4)]},
  {"id": "writing", "skill": "writing", "title": T("Produzione scritta — Viết"), "minutes": 30, "maxPoints": 12, "tasks": [
    task("p1", "Prova 1 — Mô tả", "Viết một đoạn mô tả từ 20 đến 40 từ.", "short_text", 1, answerWords={"min": 20, "max": 45}, points=6),
    task("p2", "Prova 2 — Tin nhắn hoặc thư", "Viết một tin nhắn từ 15 đến 30 từ, có lời chào và lời kết.", "short_text", 1, answerWords={"min": 12, "max": 35}, points=6)]},
  {"id": "speaking", "skill": "speaking", "title": T("Produzione orale — Nói"), "minutes": 10, "maxPoints": 12, "simulatedIndividually": True, "tasks": [
    task("p1", "Prova 1 — Trò chuyện về bản thân", "Trả lời câu hỏi của giám khảo về bản thân.", "conversation", 1, speakingMinutes={"min": 2, "max": 3}, points=6),
    task("p2", "Prova 2 — Nói về một chủ đề", "Nói về chủ đề theo các từ khoá. (Trong kỳ thi thật bạn chọn một trong ba chủ đề.)", "monologue", 1, speakingMinutes={"min": 1.5, "max": 2}, points=6)]},
 ],
 "passRule": {
  "sectionMinimums": [{"section": s, "min": 7} for s in SECTIONS],
  "total": {"title": T("Tổng điểm — cả năm phần"), "min": 35},
  "everySectionTaken": True,
 },
 "scoring": {"perItem": "share_of_section_points", "negativeMarking": False},
 "readiness": {
  "bands": [
   {"id": "ready_estimate", "minGroupShare": 0.7, "label": T("Mức sẵn sàng ước tính: tốt", "Estimated readiness: good"), "message": T("Ở lần thi thử này, mọi phần và tổng điểm đều cao hơn ngưỡng của định dạng thi một khoảng an toàn. Đây là mức sẵn sàng ước tính từ bài luyện của khoá học, không phải điểm thi thật.", "In this mock every part and the total are comfortably above the format's thresholds. This is an estimated readiness from the course's practice, not a real exam score.")},
   {"id": "getting_close", "minGroupShare": 0.58, "label": T("Mức sẵn sàng ước tính: gần đạt", "Estimated readiness: getting close"), "message": T("Mọi phần đạt ngưỡng của định dạng thi nhưng chưa có khoảng an toàn. Hãy luyện thêm các phần yếu bên dưới.", "Every part reaches the format's threshold, without a safety margin yet. Practise the weak areas below.")},
   {"id": "not_yet", "minGroupShare": 0, "label": T("Mức sẵn sàng ước tính: cần luyện thêm", "Estimated readiness: more practice needed"), "message": T("Có phần còn dưới ngưỡng của định dạng thi. Hãy luyện các phần yếu bên dưới rồi thử lại với đề còn lại.", "A part is below the format's threshold. Practise the weak areas below, then try the other form.")}],
  "incomplete": T("Chưa đủ dữ liệu để ước tính: kỳ thi chỉ tính khi làm đủ cả năm phần, và phần Nói cần micro cùng nhận dạng giọng nói trên thiết bị. Các phần khác vẫn được tính điểm."),
  "disclaimer": T("Mức sẵn sàng ước tính dựa trên bài thi thử của khoá học: không phải kỳ thi CILS, không do Università per Stranieri di Siena cấp và không dự đoán kết quả thi thật. Phần Nói được mô phỏng với ứng dụng thay cho giám khảo; phần Viết và Nói được chấm bằng tiêu chí tự động đơn giản, nên điểm của hai phần này chỉ là gần đúng.", "Estimated readiness from this course's mock: not the CILS exam, not issued by the Università per Stranieri di Siena, and no prediction of a real result. Speaking is simulated with the app instead of an examiner; Writing and Speaking are graded by simple automatic rubrics, so their points are approximate.")},
 "items": items,
 "forms": [{"formId": f, "itemIds": [i["id"] for i in items if i["id"].split(".")[-1].startswith(f + "_")]} for f in "ab"],
}


def append(rel, recs):
    with open(os.path.join(D, rel), "a", encoding="utf-8", newline="\n") as f:
        for r in recs:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


append("listening/OUTPUT.jsonl", clips)
append("readings/OUTPUT.jsonl", readings)
append("speech/OUTPUT.jsonl", speech)
append("writing/OUTPUT.jsonl", tasks)
append("scenarios/OUTPUT.jsonl", scenarios)
os.makedirs(os.path.join(D, "exam"), exist_ok=True)
with open(os.path.join(D, "exam", "OUTPUT.jsonl"), "w", encoding="utf-8", newline="\n") as f:
    f.write(json.dumps(track, ensure_ascii=False) + "\n")
print(len(items), "items", dict(Counter((i["sectionId"], i["taskId"]) for i in items)), len(clips), "clips", len(readings), "readings", len(speech), "speech", len(tasks), "tasks", len(scenarios), "scenarios")

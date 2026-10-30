"""it-vi section 5 (writing): 16 writing tasks + 16 lessons.
Writes content/it/_drafts/writing/OUTPUT.jsonl; S5 lesson records to argv[2].
usage: python -I it-writing-s5.py <repo root> <out.jsonl>"""
import json, os, sys
from collections import Counter

ROOT = sys.argv[1] + "/content/it"
LEX = json.load(open(os.path.join(ROOT, "lexicon", "lexemes.json"), encoding="utf-8"))["lexemes"]
SURF = {l["surface"]: l for l in LEX}


def lid(s):
    assert s in SURF, s
    return SURF[s]["id"]


OBJ = {"o": "it.obj.writing.personal_info", "p": "it.obj.writing.phrases_sentences", "q": "it.obj.writing.short_message", "r": "it.obj.writing.form_filling"}
GREET = ["ciao", "salve", "caro", "cara", "buongiorno"]
CLOSE = ["a presto", "a domani", "un abbraccio", "a sabato"]
# slug -> (family, instruction vi, cueFacts [(label, value)], slots [(id, desc vi, variants, cueProvided)], minT, maxT, verbs, model, lexeme surfaces, formFields)
T = {
 "o_name": ("personal_profile", "Bạn là Lena. Hãy viết một câu tiếng Ý ngắn nói tên của bạn.", [("Tên của bạn", "Lena")],
            [("name", "tên của bạn", ["mi chiamo lena", "il mio nome è lena", "sono lena"], True)], 2, 12, ["chiamo", "è", "sono"], "Mi chiamo Lena.", ["il nome"], None),
 "o_age": ("personal_profile", "Bạn 25 tuổi. Hãy viết một câu tiếng Ý nói tuổi của bạn.", [("Tuổi", "25")],
           [("age", "tuổi của bạn", ["ho 25 anni"], True)], 3, 12, ["ho"], "Ho 25 anni.", ["l'anno", "avere"], None),
 "o_city": ("personal_profile", "Bạn sống ở Firenze. Hãy viết một câu tiếng Ý nói bạn sống ở đâu.", [("Thành phố", "Firenze")],
            [("city", "thành phố bạn sống", ["abito a firenze", "vivo a firenze"], True)], 3, 12, ["abito", "vivo"], "Abito a Firenze.", ["abitare", "la città"], None),
 "o_all": ("personal_profile", "Hãy viết ba câu ngắn về bạn: tên, tuổi và thành phố.", [("Tên", "Lena"), ("Tuổi", "25"), ("Thành phố", "Firenze")],
           [("name", "tên", ["mi chiamo lena", "il mio nome è lena", "sono lena"], True), ("age", "tuổi", ["25"], True), ("city", "thành phố", ["a firenze"], True)], 6, 25, ["chiamo", "ho", "abito"],
           "Mi chiamo Lena. Ho 25 anni. Abito a Firenze.", ["il nome", "l'anno", "abitare", "la città"], None),
 "p_like": ("simple_description", "Hãy viết một câu tiếng Ý nói rằng bạn thích bóng đá.", None,
            [("like", "bạn thích bóng đá", ["mi piace il calcio"], False)], 3, 10, ["piace"], "Mi piace il calcio.", ["il calcio", "mi piace"], None),
 "p_two": ("simple_description", "Hãy viết một câu nói rằng bạn thích cà phê và trà.", None,
           [("coffee", "cà phê", ["caffè"], False), ("tea", "trà", ["tè"], False)], 4, 12, ["piace", "piacciono"], "Mi piace il caffè e mi piace il tè.", ["il caffè", "il tè", "mi piace"], None),
 "p_other": ("simple_description", "Hãy viết hai câu về Paolo: tên anh ấy và nơi anh ấy sống.", [("Tên", "Paolo"), ("Thành phố", "Bologna")],
             [("name", "tên của Paolo", ["si chiama paolo", "il suo nome è paolo", "lui è paolo"], True), ("city", "nơi Paolo sống", ["abita a bologna", "vive a bologna"], True)], 5, 16, ["chiama", "abita", "è", "vive"],
             "Si chiama Paolo. Abita a Bologna.", ["abitare"], None),
 "p_scene": ("simple_description", "Hãy viết hai câu tả bức tranh: con mèo nhỏ, ngôi nhà lớn.", None,
             [("cat", "con mèo nhỏ", ["il gatto è piccolo", "un gatto piccolo"], False), ("house", "ngôi nhà lớn", ["la casa è grande", "una casa grande"], False)], 6, 16, ["è"],
             "Il gatto è piccolo. La casa è grande.", ["il gatto", "piccolo", "la casa", "grande"], None),
 "q_bar": ("short_message", "Hãy viết một lời nhắn ngắn cho Anna: chào cô ấy, và hẹn gặp ở quán bar lúc ba giờ.", [("Gửi", "Anna"), ("Ở đâu", "il bar"), ("Giờ", "3:00")],
           [("greeting", "lời chào", GREET, False), ("addressee", "tên người nhận", ["anna"], True), ("place", "quán bar", ["bar"], True), ("time", "giờ hẹn", ["alle tre", "alle 15"], True)], 5, 20, None,
           "Ciao Anna, ci vediamo alle tre al bar.", ["il bar"], None),
 "q_train": ("short_message", "Hãy nhắn cho Luca: tàu của bạn đến lúc tám giờ.", [("Gửi", "Luca"), ("Giờ", "8:00")],
             [("greeting", "lời chào", GREET, False), ("train", "chuyến tàu", ["treno"], False), ("time", "giờ tàu đến", ["alle otto"], True)], 5, 20, None,
             "Ciao Luca, il mio treno arriva alle otto.", ["il treno", "arrivare"], None),
 "q_late": ("short_message", "Hãy nhắn cho Lisa: chào, báo bạn sẽ đến muộn, rồi chào kết.", [("Gửi", "Lisa")],
            [("greeting", "lời chào", GREET, False), ("late", "bạn đến muộn", ["tardi", "ritardo"], False), ("closing", "lời chào kết", CLOSE, False)], 5, 20, None,
            "Ciao Lisa, oggi arrivo tardi. A presto!", ["tardi", "arrivare"], None),
 "q_own": ("short_message", "Hãy nhắn cho Paolo: hẹn gặp vào thứ Bảy, rồi chào kết.", [("Gửi", "Paolo"), ("Ngày", "sabato")],
           [("greeting", "lời chào", GREET, False), ("day", "ngày hẹn", ["sabato"], True), ("closing", "lời chào kết", CLOSE, False)], 5, 20, None,
           "Ciao Paolo, ci vediamo sabato. A presto!", ["il sabato"], None),
 "r_form_course": ("simple_form", "Hãy điền phiếu đăng ký khoá học với các thông tin trên thẻ.", [("Tên", "Minh"), ("Thành phố", "Bologna"), ("Điện thoại", "333 123456")],
                   [("name", "tên", ["minh"], True), ("city", "thành phố", ["bologna"], True), ("phone", "số điện thoại", ["333 123456", "333123456"], True)], 2, 12, None,
                   "Minh | Bologna | 333 123456", ["il nome", "la città", "il telefono"], [("nome", "Nome", "name"), ("citta", "Città", "city"), ("telefono", "Telefono", "phone")]),
 "r_form_hotel": ("simple_form", "Hãy điền phiếu khách sạn với các thông tin trên thẻ.", [("Họ", "Tran"), ("Địa chỉ", "Via Roma 5"), ("Điện thoại", "347 987654")],
                  [("name", "họ của bạn", ["tran"], True), ("street", "địa chỉ", ["via roma 5"], True), ("phone", "số điện thoại", ["347 987654", "347987654"], True)], 2, 12, None,
                  "Tran | Via Roma 5 | 347 987654", ["il cognome", "l'indirizzo", "il telefono"], [("cognome", "Cognome", "name"), ("indirizzo", "Indirizzo", "street"), ("telefono", "Telefono", "phone")]),
 "r_hotel_mail": ("short_message", "Hãy viết thư ngắn cho một khách sạn: chào, hỏi một phòng cho thứ Bảy, rồi chào kết.", [("Ngày", "sabato")],
                  [("greeting", "lời chào", ["gentile", "buongiorno", "salve"], False), ("room", "một phòng", ["camera"], False), ("day", "thứ Bảy", ["sabato"], True), ("closing", "lời chào kết", ["cordiali saluti", "grazie", "saluti"], False)], 8, 30, None,
                  "Buongiorno, vorrei una camera per sabato. Cordiali saluti, Minh", ["la camera", "il sabato"], None),
 "r_all": ("personal_profile", "Hãy viết về bạn: tên, đến từ Việt Nam, sống ở Bologna, làm việc ở một bệnh viện.", [("Tên", "Minh"), ("Quê", "Việt Nam"), ("Thành phố", "Bologna"), ("Nơi làm việc", "bệnh viện")],
           [("name", "tên", ["mi chiamo minh", "il mio nome è minh", "sono minh"], True), ("from", "quê", ["vietnam", "vietnamita"], True), ("city", "thành phố", ["a bologna"], True), ("work", "nơi làm việc", ["ospedale"], True)], 10, 35, ["chiamo", "sono", "abito", "lavoro"],
           "Mi chiamo Minh. Sono vietnamita. Abito a Bologna e lavoro in un ospedale.", ["il nome", "vietnamita", "abitare", "lavorare", "l'ospedale"], None),
}
tasks, ex_for = [], {}
for slug, (fam, instr, cue, slots, mn, mx, verbs, model, lex, fields) in T.items():
    u = slug[0]
    tid = f"it.write.{slug}"
    rubric = {"requiredSlots": [{"id": i, "description": {"vi": d, "en": d}, "variants": v, "cueProvided": c} for i, d, v, c in slots], "minTokens": mn, "maxTokens": mx}
    if verbs:
        rubric["requireSentenceVerbs"] = verbs
    t = {"id": tid, "taskFamily": fam, "mode": "guided", "instruction": {"vi": instr, "en": instr}}
    if cue:
        t["cueFacts"] = [{"label": {"vi": a, "en": a}, "value": b} for a, b in cue]
    if fields:
        t["formFields"] = [{"id": a, "label": b, "slotId": c} for a, b, c in fields]
    t.update({"rubric": rubric, "modelAnswers": [model], "objectiveRefs": [OBJ[u]], "lexemeRefs": [lid(s) for s in lex], "scoredEligibility": False, "reserved": False, "sourceRef": "original-project"})
    tasks.append(t)
    flat_rubric = {**rubric, "requiredSlots": [{**s, "description": s["description"]["vi"]} for s in rubric["requiredSlots"]]}
    e = {"type": "simpleForm" if fields else "guidedWriting", "writingTaskId": tid}
    if not fields:
        e["writingMode"] = "guided"
    e["instruction"] = instr
    if cue:
        e["cueFacts"] = [{"label": a, "value": b} for a, b in cue]
    if fields:
        e["fields"] = [{"id": a, "label": b, "slotId": c} for a, b, c in fields]
    e.update({"rubric": flat_rubric, "modelAnswers": [model], "objectiveTargets": [OBJ[u]]})
    ex_for[slug] = e

os.makedirs(os.path.join(ROOT, "_drafts", "writing"), exist_ok=True)
with open(os.path.join(ROOT, "_drafts", "writing", "OUTPUT.jsonl"), "w", encoding="utf-8", newline="\n") as f:
    for t in tasks:
        f.write(json.dumps(t, ensure_ascii=False) + "\n")

C = "it-vi"
pos = [0]


def place(correct, wrong):
    p = pos[0] % 4
    pos[0] += 1
    o = list(wrong[:3])
    o.insert(p, correct)
    return o, p


def W(slug):
    return dict(ex_for[slug])


def wb(vi, it, extra):
    ans = it.rstrip(".!?").replace(",", "").split()
    toks = ans + [x for x in extra if x not in ans]
    order = sorted(range(len(toks)), key=lambda i: ((i * 5 + pos[0]) % 7, i))
    pos[0] += 1
    return {"type": "wordBank", "direction": "nativeToTarget", "prompt": vi, "tokens": [toks[i] for i in order], "answer": ans}


def typ(vi, it, alts):
    return {"type": "typeAnswer", "mode": "produceTarget", "prompt": vi, "audioTarget": it, "answer": it, "alternatives": alts}


def fill(sent, ans, wrong, vi):
    o, p = place(ans, wrong)
    return {"type": "fillBlank", "sentence": sent, "translation": vi, "audioTarget": sent.replace("___", ans), "options": o, "correct": p}


def n2t(surface, wrong):
    o, p = place(surface, wrong)
    return {"type": "select", "mode": "nativeToTarget", "prompt": SURF[surface]["glosses"]["vi"].split(";")[0], "audioTarget": surface, "options": [{"text": t} for t in o], "correct": p}


L = {
 "uo-l0": [wb("Tôi tên là Lena.", "Mi chiamo Lena.", ["sono", "nome", "chiama"]), W("o_name"), typ("Viết bằng tiếng Ý: tôi tên là Lena.", "Mi chiamo Lena.", ["Il mio nome è Lena.", "Sono Lena."]), fill("Il mio ___ è Lena.", "nome", ["anno", "numero", "giorno"], "Tên tôi là Lena."), n2t("il nome", ["l'anno", "la città", "la strada"]), typ("họ (kèm mạo từ)", "il cognome", [])],
 "uo-l1": [wb("Tôi 25 tuổi.", "Ho 25 anni.", ["sono", "anno", "hai"]), W("o_age"), fill("Ho 25 ___.", "anni", ["anno", "ore", "giorni"], "Tôi 25 tuổi."), n2t("l'anno", ["il nome", "la settimana", "il mese"]), typ("Viết: Tôi 40 tuổi.", "Ho 40 anni.", ["Ho quaranta anni."])],
 "uo-l2": [wb("Tôi sống ở Firenze.", "Abito a Firenze.", ["in", "vengo", "sono"]), W("o_city"), fill("Abito ___ Firenze.", "a", ["in", "di", "su"], "Tôi sống ở Firenze."), n2t("la città", ["la strada", "il nome", "l'anno"]), typ("Tôi sống ở một thành phố lớn.", "Abito in una grande città.", ["Abito in una città grande."])],
 "uo-l3": [W("o_all"), typ("Tôi 30 tuổi.", "Ho 30 anni.", ["Ho trenta anni."]), wb("Tôi tên là Minh và tôi sống ở Bari.", "Mi chiamo Minh e abito a Bari.", ["sono", "in", "chiama"]), fill("___ chiamo Minh.", "Mi", ["Ti", "Si", "Ci"], "Tôi tên là Minh."), n2t("il nome", ["la città", "l'anno", "la strada"])],
 "up-l0": [wb("Tôi thích bóng đá.", "Mi piace il calcio.", ["piacciono", "non", "bevo"]), W("p_like"), fill("Mi ___ il calcio.", "piace", ["piacciono", "piaci", "piaccio"], "Tôi thích bóng đá."), n2t("il calcio", ["il film", "lo sport", "la musica"]), typ("Tôi thích đọc sách.", "Mi piace leggere.", ["Mi piace leggere"])],
 "up-l1": [W("p_two"), wb("Tôi thích trà.", "Mi piace il tè.", ["caffè", "bevo", "piacciono"]), typ("Tôi thích mèo.", "Mi piacciono i gatti.", ["Mi piacciono i gatti"]), fill("Non mi ___ il caffè.", "piace", ["piacciono", "piaci", "piaccio"], "Tôi không thích cà phê."), wb("Anh ấy không uống cà phê.", "Non beve il caffè.", ["tè", "bevo", "è"])],
 "up-l2": [W("p_other"), wb("Anh ấy tên là Paolo.", "Si chiama Paolo.", ["mi", "sono", "chiamo"]), fill("Lui ___ a Bologna.", "abita", ["abito", "abitano", "abiti"], "Anh ấy sống ở Bologna."), typ("Cô ấy sống ở Roma.", "Abita a Roma.", ["Lei abita a Roma.", "Abita a Roma"]), n2t("abitare", ["venire", "giocare", "amare"])],
 "up-l3": [W("p_scene"), fill("Il gatto è ___.", "piccolo", ["grande", "vecchio", "tardi"], "Con mèo nhỏ."), wb("Ngôi nhà lớn và đẹp.", "La casa è grande e bella.", ["piccola", "sono", "il"]), n2t("giocare", ["amare", "abitare", "venire"]), typ("Cái giường lớn.", "Il letto è grande.", ["Il letto è grande"])],
 "uq-l0": [W("q_bar"), wb("Chúng ta gặp nhau lúc ba giờ.", "Ci vediamo alle tre.", ["vedo", "al", "due"]), fill("Ci ___ alle tre.", "vediamo", ["vede", "vedi", "vedo"], "Chúng ta gặp nhau lúc ba giờ."), n2t("il messaggio", ["il telefono", "il nome", "la strada"]), typ("Chúng ta gặp nhau lúc bốn giờ.", "Ci vediamo alle quattro.", ["Ci vediamo alle 4."])],
 "uq-l1": [W("q_train"), fill("Il mio treno ___ alle otto.", "arriva", ["arrivo", "arrivano", "arrivi"], "Tàu của tôi đến lúc tám giờ."), wb("Tàu của tôi đến lúc tám giờ.", "Il mio treno arriva alle otto.", ["autobus", "al", "arrivo"]), typ("Xe buýt đến lúc chín giờ.", "L'autobus arriva alle nove.", ["L'autobus arriva alle 9."]), n2t("arrivare", ["giocare", "abitare", "amare"])],
 "uq-l2": [W("q_late"), fill("Oggi arrivo ___.", "tardi", ["presto", "grande", "nuovo"], "Hôm nay tôi đến muộn."), wb("Hẹn sớm gặp lại!", "A presto!", ["Ciao", "domani", "tardi"]), n2t("tardi", ["presto", "sempre", "oggi"]), typ("Hôm nay tôi đến muộn.", "Oggi arrivo tardi.", ["Arrivo tardi oggi."])],
 "uq-l3": [W("q_own"), typ("Chúng ta gặp nhau vào thứ Bảy.", "Ci vediamo sabato.", ["Ci vediamo sabato"]), fill("Ci vediamo ___.", "sabato", ["nome", "treno", "telefono"], "Chúng ta gặp nhau vào thứ Bảy."), wb("Chúng ta gặp nhau vào Chủ nhật.", "Ci vediamo domenica.", ["alle", "vedo", "sabato"]), typ("Hẹn mai gặp lại!", "A domani!", ["A domani"])],
 "ur-l0": [W("r_form_course"), n2t("il telefono", ["il nome", "la strada", "la città"]), fill("Il mio ___ è Minh.", "nome", ["telefono", "indirizzo", "numero"], "Tên tôi là Minh."), typ("điện thoại (kèm mạo từ)", "il telefono", []), wb("Tên tôi là Lan.", "Il mio nome è Lan.", ["chiamo", "telefono", "sono"])],
 "ur-l1": [W("r_form_hotel"), n2t("l'indirizzo", ["la città", "il telefono", "il nome"]), fill("Abito in ___ Roma 5.", "via", ["città", "casa", "piano"], "Tôi sống ở số 5 phố Roma."), typ("Tôi sống ở phố Roma.", "Abito in via Roma.", ["Abito in via Roma"]), fill("Il mio ___ è nuovo.", "telefono", ["strada", "città", "casa"], "Điện thoại của tôi còn mới.")],
 "ur-l2": [W("r_hotel_mail"), fill("Vorrei una ___ per sabato.", "camera", ["casa", "porta", "sedia"], "Tôi muốn một phòng cho thứ Bảy."), wb("Tôi muốn một phòng.", "Vorrei una camera.", ["sono", "un", "casa"]), typ("Khách sạn còn phòng trống không?", "C'è una camera libera?", ["C'è una camera libera"]), typ("Tôi cần một phòng.", "Ho bisogno di una camera.", ["Ho bisogno di una camera"])],
 "ur-l3": [W("r_all"), wb("Tôi làm việc ở một bệnh viện.", "Lavoro in un ospedale.", ["abito", "a", "casa"]), fill("Vengo ___ Hanoi.", "da", ["a", "in", "su"], "Tôi đến từ Hà Nội."), n2t("l'ospedale", ["la casa", "l'albergo", "il museo"]), typ("Tôi làm việc ở Bologna.", "Lavoro a Bologna.", ["Lavoro a Bologna"])],
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
print(len(tasks), "tasks", len(recs), "lessons", sum(len(r["exercises"]) for r in recs), dict(Counter(e["type"] for r in recs for e in r["exercises"])))

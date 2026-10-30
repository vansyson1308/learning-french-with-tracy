"""it-vi section 2 lessons (articles, verbs, international words, numbers, sounds & spelling).
Hand-authored per lesson in a compact DSL; conjugation answers come from the committed
paradigm tables; every lesson interleaves its concept cards in `flow`.
usage: python -I it-lessons-s2.py <repo root> <out.jsonl>"""
import json, os, sys
from collections import Counter

ROOT, OUT = sys.argv[1], sys.argv[2]
LEX = {l["surface"]: l for l in json.load(open(f"{ROOT}/content/it/lexicon/lexemes.json", encoding="utf-8"))["lexemes"]}
PP = f"{ROOT}/content/it/_drafts/staged/content/it/pedagogy/paradigms.json"
if not os.path.exists(PP):
    PP = f"{ROOT}/content/it/pedagogy/paradigms.json"
PAR = {t["lemma"]: t["cells"] for t in json.load(open(PP, encoding="utf-8"))["tables"]}
C = "it-vi"
ARTS = ["il", "lo", "la", "l'"]


def g(surface):
    l = LEX.get(surface)
    assert l, f"not a lexeme: {surface}"
    return l["glosses"]["vi"].split(";")[0].strip()


def split_art(s):
    if s.startswith("l'"):
        return "l'", s[2:]
    return tuple(s.split(" ", 1))


pos = [0]


def place(correct, wrong):
    p = pos[0] % 4
    pos[0] += 1
    out = list(wrong[:3])
    out.insert(p, correct)
    return out, p


# Steps: ("concept", id) ("art", surface) ("t2n", surface, [surfaces]) ("n2t", surface, [surfaces]) ("listen", surface, [surfaces])
# ("t2nx", target, vi, [wrong vi]) ("fill", sentence, answer, [wrong], vi) ("conj", sentence, verb, cell, vi)
# ("type", vi, it, [alts]) ("wb", vi, it, [extra]) ("wbt", it, vi, [extra]) ("match", [surfaces])
k = lambda s: f"it:concept:{s}"
L = {}
# ---- unit a: articles
L["ua-l0"] = [("concept", k("definite-articles")), ("art", "il libro"), ("art", "lo zaino"), ("art", "la casa"), ("art", "l'amico"), ("t2n", "il libro", ["la casa", "lo zaino", "la porta"]),
  ("art", "lo studente"), ("art", "la scuola"), ("n2t", "la scuola", ["la casa", "la porta", "la sedia"]),
  ("fill", "___ zaino è nuovo.", "Lo", ["Il", "La", "L'"], "Cái ba lô mới."), ("type", "ngôi nhà (kèm mạo từ)", "la casa", []),
  ("match", ["il libro", "la casa", "lo zaino", "l'amico", "la scuola"])]
L["ua-l1"] = [("concept", k("plurals")), ("fill", "Ho due ___.", "libri", ["libro", "libre", "libra"], "Tôi có hai quyển sách."), ("fill", "___ amici sono qui.", "Gli", ["I", "Le", "Lo"], "Những người bạn ở đây."),
  ("fill", "___ case sono grandi.", "Le", ["I", "Gli", "La"], "Những ngôi nhà lớn."), ("fill", "___ libri sono nuovi.", "I", ["Gli", "Le", "Il"], "Những quyển sách mới."),
  ("t2nx", "gli studenti", "các sinh viên", ["một sinh viên", "những cái ghế", "những người bạn"]), ("fill", "Ci sono due ___.", "chiavi", ["chiave", "chiava", "chiavo"], "Có hai cái chìa khóa."),
  ("type", "những ngôi nhà", "le case", ["case"]), ("type", "những người bạn nam", "gli amici", ["amici"]),
  ("wb", "Những cái ba lô ở đây.", "Gli zaini sono qui.", ["I", "zaino", "è"]), ("concept", k("gender-endings")), ("art", "la chiave"), ("art", "il nome")]
L["ua-l2"] = [("concept", k("indefinite-articles")), ("fill", "Ho ___ libro.", "un", ["uno", "una", "un'"], "Tôi có một quyển sách."), ("fill", "Ho ___ zaino.", "uno", ["un", "una", "un'"], "Tôi có một cái ba lô."),
  ("fill", "Ho ___ casa.", "una", ["un", "uno", "un'"], "Tôi có một ngôi nhà."), ("fill", "Ho ___ amica.", "un'", ["un", "uno", "una"], "Tôi có một người bạn nữ."), ("fill", "Ho ___ amico.", "un", ["un'", "uno", "una"], "Tôi có một người bạn nam."),
  ("t2n", "la finestra", ["la porta", "la sedia", "il tavolo"]), ("n2t", "la sedia", ["il tavolo", "la porta", "la finestra"]), ("type", "Tôi có một người bạn nữ.", "Ho un'amica.", ["Ho un'amica"]),
  ("wb", "Tôi có một cái bàn và một cái ghế.", "Ho un tavolo e una sedia.", ["uno", "un'", "sono"])]
L["ua-l3"] = [("concept", k("elision")), ("fill", "___ acqua è fredda.", "L'", ["La", "Il", "Lo"], "Nước lạnh."), ("fill", "___ albergo è grande.", "L'", ["Il", "Lo", "La"], "Khách sạn lớn."),
  ("art", "il tavolo"), ("art", "la sedia"), ("art", "la porta"), ("art", "lo sport"), ("art", "l'amica"), ("type", "người bạn nữ (kèm mạo từ)", "l'amica", []),
  ("concept", k("prepositions")), ("fill", "Vado ___ stazione.", "alla", ["al", "nel", "della"], "Tôi đến nhà ga."), ("fill", "Vado ___ bar.", "al", ["alla", "della", "nella"], "Tôi đến quán cà phê."),
  ("fill", "Abito ___ Roma.", "a", ["in", "di", "con"], "Tôi sống ở Roma."), ("fill", "Abito ___ Italia.", "in", ["a", "di", "con"], "Tôi sống ở Ý."),
  ("wbt", "L'amico è alla stazione.", "Người bạn ở nhà ga.", ["trường", "không", "hai"]), ("wb", "Tôi đến từ Hà Nội.", "Sono di Hanoi.", ["a", "ha", "in"])]
# ---- unit b: verbs
L["ub-l0"] = [("concept", k("essere-avere")), ("conj", "Io ___ Anna.", "essere", "pre:1s", "Tôi là Anna."), ("conj", "Tu ___ di Roma.", "essere", "pre:2s", "Bạn đến từ Roma."),
  ("conj", "Marco ___ a casa.", "essere", "pre:3s", "Marco ở nhà."), ("conj", "Noi ___ una famiglia.", "essere", "pre:1p", "Chúng tôi là một gia đình."), ("conj", "Voi ___ qui.", "essere", "pre:2p", "Các bạn ở đây."),
  ("conj", "Io ___ una macchina.", "avere", "pre:1s", "Tôi có một chiếc xe ô tô."), ("conj", "Tu ___ un cane.", "avere", "pre:2s", "Bạn có một con chó."), ("conj", "Noi ___ tempo.", "avere", "pre:1p", "Chúng tôi có thời gian."),
  ("concept", k("c-e-ci-sono")), ("fill", "___ un bar qui vicino.", "C'è", ["Ci sono", "Ha", "Sono"], "Gần đây có một quán cà phê."), ("fill", "___ due letti.", "Ci sono", ["C'è", "Hanno", "È"], "Có hai cái giường."),
  ("t2n", "essere", ["avere", "parlare", "andare"]), ("type", "Tôi hai mươi tuổi.", "Ho vent'anni.", ["Ho venti anni."])]
L["ub-l1"] = [("concept", k("present-regular")), ("conj", "Io ___ a Hanoi.", "abitare", "pre:1s", "Tôi sống ở Hà Nội."), ("conj", "Lei ___ a Roma.", "lavorare", "pre:3s", "Cô ấy làm việc ở Roma."),
  ("conj", "Tu ___ qui.", "lavorare", "pre:2s", "Bạn làm việc ở đây."), ("conj", "Noi ___ a Milano.", "abitare", "pre:1p", "Chúng tôi sống ở Milano."), ("conj", "Marco ___ il giornale.", "leggere", "pre:3s", "Marco đọc báo."),
  ("conj", "Voi ___ bene.", "dormire", "pre:2p", "Các bạn ngủ ngon."), ("concept", k("subject-drop")), ("wb", "Tôi nói tiếng Ý.", "Parlo italiano.", ["parla", "parli", "non"]),
  ("concept", k("isc-verbs")), ("conj", "Io non ___.", "capire", "pre:1s", "Tôi không hiểu."), ("conj", "Tu ___ il tè?", "preferire", "pre:2s", "Bạn thích trà hơn à?"), ("conj", "Noi ___ tutto.", "capire", "pre:1p", "Chúng tôi hiểu hết."),
  ("concept", k("negation-questions")), ("wb", "Tôi không nói tiếng Đức.", "Non parlo tedesco.", ["parlo", "ma", "è"]), ("fill", "___ abiti?", "Dove", ["Chi", "Quanto", "Cosa"], "Bạn sống ở đâu?"), ("type", "Tôi sống ở Hà Nội.", "Abito a Hanoi.", ["Abito a Hanoi"]),
  ("t2n", "lavorare", ["abitare", "parlare", "dormire"])]
L["ub-l2"] = [("concept", k("modal-verbs")), ("conj", "Io ___ un caffè.", "volere", "pre:1s", "Tôi muốn một ly cà phê."), ("conj", "___ entrare?", "potere", "pre:1s", "Tôi vào được không?"),
  ("conj", "Marco ___ lavorare oggi.", "dovere", "pre:3s", "Hôm nay Marco phải làm việc."), ("conj", "Tu ___ mangiare?", "volere", "pre:2s", "Bạn có muốn ăn không?"), ("conj", "Noi ___ partire.", "dovere", "pre:1p", "Chúng tôi phải đi."),
  ("wb", "Tôi muốn học tiếng Ý.", "Voglio imparare l'italiano.", ["vuole", "imparo", "un"]), ("concept", k("mi-piace")), ("fill", "Mi ___ la pizza.", "piace", ["piacciono", "piaci", "piaccio"], "Tôi thích pizza."),
  ("fill", "Mi ___ i gatti.", "piacciono", ["piace", "piaci", "piacete"], "Tôi thích mèo."), ("fill", "Non mi ___ il caffè.", "piace", ["piacciono", "piaci", "piaccio"], "Tôi không thích cà phê."),
  ("fill", "Mi piace ___.", "leggere", ["leggo", "letto", "legge"], "Tôi thích đọc sách."), ("type", "Tôi thích âm nhạc.", "Mi piace la musica.", ["Mi piace la musica"]), ("t2n", "volere", ["fare", "andare", "capire"]),
  ("concept", k("tu-lei")), ("fill", "Buongiorno, signora. Come ___?", "sta", ["stai", "sto", "state"], "Chào bà. Bà khỏe không?"), ("fill", "Ciao, Marco. Come ___?", "stai", ["sta", "sto", "stanno"], "Chào Marco. Bạn khỏe không?"),
  ("wbt", "Lei parla italiano?", "Ông có nói tiếng Ý không?", ["tôi", "hai", "và"])]
L["ub-l3"] = [("concept", k("passato-prossimo")), ("conj", "Ho ___ la pizza.", "mangiare", "participle", "Tôi đã ăn pizza."), ("conj", "Abbiamo ___ italiano.", "parlare", "participle", "Chúng tôi đã nói tiếng Ý."),
  ("conj", "Hai ___ bene?", "dormire", "participle", "Bạn đã ngủ ngon không?"), ("conj", "Marco ha ___ il giornale.", "leggere", "participle", "Marco đã đọc báo."), ("conj", "Sono ___ a Roma.", "andare", "participle", "Tôi đã đi Roma."),
  ("fill", "___ andato a Roma.", "Sono", ["Ho", "Ha", "Hai"], "Tôi đã đi Roma."), ("fill", "___ mangiato la pasta.", "Abbiamo", ["Siamo", "Sono", "È"], "Chúng tôi đã ăn mì."), ("fill", "Anna è ___ ieri.", "arrivata", ["arrivato", "arrivati", "arrivare"], "Hôm qua Anna đã đến."),
  ("type", "Tôi đã ăn.", "Ho mangiato.", ["Ho mangiato"]), ("wbt", "Ho comprato il pane.", "Tôi đã mua bánh mì.", ["uống", "sẽ", "hai"])]
# ---- unit c: international words
L["uc-l0"] = [("concept", k("false-friends")), ("t2n", "la musica", ["il film", "il taxi", "il bar"]), ("t2n", "il taxi", ["il computer", "il film", "la musica"]), ("t2n", "il computer", ["il telefono", "il taxi", "il cinema"]),
  ("n2t", "il film", ["il cinema", "il bar", "la musica"]), ("n2t", "il ristorante", ["il bar", "il cinema", "il taxi"]), ("art", "il film"), ("art", "il computer"), ("type", "bộ phim (kèm mạo từ)", "il film", []),
  ("match", ["la musica", "il film", "il taxi", "il computer", "il bar"])]
L["uc-l1"] = [("concept", k("false-friends")), ("t2nx", "la camera", "căn phòng", ["máy ảnh", "máy tính", "điện thoại"]), ("fill", "La ___ è grande.", "camera", ["taxi", "film", "bar"], "Căn phòng rộng."), ("t2n", "il telefono", ["il computer", "il cinema", "il taxi"]),
  ("wb", "Căn phòng ở tầng một.", "La camera è al primo piano.", ["una", "il", "sono"]), ("fill", "I miei ___ sono a Hanoi.", "genitori", ["figli", "amici", "nonni"], "Bố mẹ tôi ở Hà Nội."),
  ("type", "Bố mẹ tôi ở Việt Nam.", "I miei genitori sono in Vietnam.", ["I miei genitori sono in Vietnam"]), ("n2t", "il telefono", ["il computer", "il film", "il bar"]), ("t2n", "il cinema", ["il teatro", "il bar", "il museo"])]
L["uc-l2"] = [("concept", k("gender-endings")), ("fill", "___ problema è grande.", "Il", ["La", "L'", "Lo"], "Vấn đề lớn."), ("fill", "___ foto è bella.", "La", ["Il", "Lo", "L'"], "Bức ảnh đẹp."), ("art", "il problema"), ("art", "la foto"), ("art", "l'università"),
  ("fill", "Ho due ___.", "film", ["filmi", "filme", "filma"], "Tôi có hai bộ phim."), ("t2n", "il problema", ["la foto", "la musica", "il film"]), ("n2t", "la foto", ["il problema", "il film", "la musica"]),
  ("type", "Không có vấn đề gì.", "Non c'è problema.", ["Non c'è problema"])]
L["uc-l3"] = [("concept", k("negation-questions")), ("t2n", "chi", ["dove", "cosa", "come"]), ("t2n", "dove", ["chi", "quando", "cosa"]), ("fill", "___ è quel ragazzo?", "Chi", ["Dove", "Come", "Quando"], "Cậu bé kia là ai?"), ("fill", "___ è il bar?", "Dov'", ["Chi", "Cosa", "Quanto"], "Quán cà phê ở đâu?"),
  ("t2n", "il ristorante", ["il bar", "il cinema", "il museo"]), ("type", "Đó là ai?", "Chi è?", ["Chi è"]), ("wbt", "Allora, dov'è l'albergo?", "Vậy khách sạn ở đâu?", ["ai", "khi", "và"]),
  ("match", ["chi", "dove", "cosa", "allora", "il telefono"])]
# ---- unit d: numbers
L["ud-l0"] = [("concept", k("numbers")), ("t2n", "tre", ["due", "quattro", "otto"]), ("t2n", "dodici", ["undici", "dieci", "due"]), ("t2n", "sette", ["sei", "nove", "otto"]),
  ("n2t", "nove", ["otto", "dieci", "cinque"]), ("fill", "Una settimana ha ___ giorni.", "sette", ["sei", "otto", "dieci"], "Một tuần có bảy ngày."), ("fill", "Un anno ha ___ mesi.", "dodici", ["undici", "dieci", "due"], "Một năm có mười hai tháng."),
  ("type", "mười", "dieci", []), ("type", "Tôi có hai con chó.", "Ho due cani.", ["Ho due cani"]),
  ("match", ["zero", "due", "tre", "quattro", "cinque"]), ("wbt", "Costa dieci euro.", "Giá mười euro.", ["hai", "tôi", "giờ"])]
L["ud-l1"] = [("concept", k("numbers")), ("t2n", "tredici", ["trenta", "tre", "venti"]), ("t2n", "sedici", ["sei", "sessanta", "diciassette"]), ("t2n", "diciassette", ["settanta", "sette", "sedici"]), ("t2n", "venti", ["dodici", "due", "trenta"]),
  ("n2t", "sedici", ["sessanta", "sei", "diciassette"]), ("fill", "Lui ha ___ anni.", "diciassette", ["settanta", "sette", "sedici"], "Cậu ấy mười bảy tuổi."),
  ("fill", "Il biglietto costa ___ euro.", "venti", ["dodici", "due", "cento"], "Vé giá hai mươi euro."), ("type", "mười ba", "tredici", []), ("type", "Tôi mười sáu tuổi.", "Ho sedici anni.", ["Ho sedici anni"]),
  ("match", ["tredici", "sedici", "diciassette", "venti", "dodici"])]
L["ud-l2"] = [("concept", k("numbers")), ("fill", "venti + uno = ___", "ventuno", ["ventiuno", "ventiuna", "ventune"], "hai mươi mốt"), ("fill", "venti + otto = ___", "ventotto", ["ventiotto", "ventoto", "ventiotti"], "hai mươi tám"), ("fill", "venti + tre = ___", "ventitré", ["ventitre'", "ventitrè", "ventatre"], "hai mươi ba"),
  ("t2n", "trenta", ["tredici", "tre", "quaranta"]), ("t2n", "cinquanta", ["cinque", "quindici", "sessanta"]), ("t2n", "cento", ["dieci", "venti", "cinquanta"]),
  ("fill", "Un'ora ha ___ minuti.", "sessanta", ["sedici", "sei", "settanta"], "Một giờ có sáu mươi phút."), ("type", "ba mươi", "trenta", []), ("type", "một trăm", "cento", []), ("n2t", "cinquanta", ["cinque", "quaranta", "sessanta"]),
  ("wb", "Bố tôi bốn mươi tuổi.", "Mio padre ha quaranta anni.", ["quattro", "è", "mia"])]
L["ud-l3"] = [("concept", k("time-and-prices")), ("fill", "Sono le due e ___.", "mezza", ["mezzi", "metà", "ora"], "Bây giờ là hai giờ rưỡi."), ("fill", "Il treno arriva ___ otto.", "alle", ["al", "la", "le"], "Tàu đến lúc tám giờ."),
  ("fill", "Costa dieci ___.", "euro", ["ore", "anni", "minuti"], "Giá mười euro."), ("fill", "___ l'una.", "È", ["Sono", "Ha", "Ho"], "Bây giờ là một giờ."), ("type", "Bây giờ là mười giờ.", "Sono le dieci.", ["Sono le dieci"]), ("wb", "Tôi ba mươi tuổi.", "Ho trenta anni.", ["tre", "sono", "anno"]),
  ("t2n", "l'ora", ["la settimana", "l'anno", "il minuto"]), ("t2n", "l'euro", ["l'ora", "l'anno", "il numero"]), ("n2t", "il minuto", ["la settimana", "il mese", "l'ora"]), ("art", "il minuto")]
# ---- unit e: sounds and spelling (the drill the Italian gate requires: card + ≥ 6 exercises + ≥ 4 pairs)
L["ue-l0"] = [("concept", k("double-consonants")), ("listen", "la palla", ["la pala", "il carro", "la sete"]), ("listen", "la pala", ["la palla", "il nonno", "sette"]), ("listen", "il carro", ["caro", "la palla", "il sonno"]), ("listen", "caro", ["il carro", "nono", "la pala"]),
  ("listen", "sette", ["la sete", "nono", "il nonno"]), ("listen", "la sete", ["sette", "il sonno", "la pala"]), ("listen", "il nonno", ["nono", "sette", "caro"]), ("listen", "nono", ["il nonno", "la sete", "caro"]),
  ("fill", "Il bambino gioca con la ___.", "palla", ["pala", "carro", "caro"], "Đứa bé chơi với quả bóng."), ("type", "số bảy", "sette", [])]
L["ue-l1"] = [("concept", k("c-g-sounds")), ("listen", "il sonno", ["la sete", "il nonno", "sette"]), ("fill", "Ho ___.", "sonno", ["sono", "sete", "sette"], "Tôi buồn ngủ."), ("fill", "Io ___ stanco.", "sono", ["sonno", "sei", "sette"], "Tôi mệt."),
  ("t2n", "la famiglia", ["la mamma", "la mano", "la sedia"]), ("t2n", "il bagno", ["il libro", "il pane", "il tavolo"]), ("n2t", "la cena", ["la chiave", "la casa", "la sera"]), ("type", "Gia đình tôi lớn.", "La mia famiglia è grande.", ["La mia famiglia è grande"]), ("wbt", "Il pesce è sul piatto.", "Con cá ở trên đĩa.", ["tôi", "ở dưới", "hai"])]
L["ue-l2"] = [("concept", k("stress-accents")), ("fill", "Marco ___ Anna sono qui.", "e", ["è", "ha", "ho"], "Marco và Anna ở đây."), ("fill", "Marco ___ a casa.", "è", ["e", "ha", "ho"], "Marco ở nhà."), ("fill", "___, parlo italiano.", "Sì", ["Si", "Se", "Sa"], "Vâng, tôi nói tiếng Ý."),
  ("t2n", "la città", ["la casa", "la sedia", "la porta"]), ("t2n", "il caffè", ["il tè", "il riso", "il vino"]), ("type", "Tôi uống cà phê.", "Bevo il caffè.", ["Bevo il caffè"]), ("type", "Roma là một thành phố.", "Roma è una città.", ["Roma è una città"]), ("n2t", "l'età", ["la città", "l'ora", "la sera"])]
L["ue-l3"] = [("concept", k("adjective-agreement")), ("fill", "La casa è ___.", "piccola", ["piccolo", "piccoli", "piccole"], "Ngôi nhà nhỏ."), ("fill", "Il libro è ___.", "nuovo", ["nuova", "nuovi", "nuove"], "Quyển sách mới."),
  ("fill", "Le scarpe sono ___.", "nere", ["nero", "nera", "neri"], "Đôi giày màu đen."), ("fill", "I ragazzi sono ___.", "alti", ["alto", "alta", "alte"], "Các cậu bé cao."), ("fill", "Un ragazzo ___.", "gentile", ["gentila", "gentilo", "gentili"], "Một cậu bé tử tế."),
  ("wb", "Một con mèo đen.", "Un gatto nero.", ["nera", "una", "la"]), ("t2n", "caro", ["economico", "nuovo", "piccolo"]), ("type", "Một ngôi nhà lớn.", "Una casa grande.", ["Una casa grande"]),
  ("fill", "Dov'è ___ stazione?", "la", ["il", "lo", "l'"], "Nhà ga ở đâu?"), ("wbt", "Una bella casa.", "Một ngôi nhà đẹp.", ["xấu", "hai", "cũ"]), ("match", ["il carro", "la palla", "la sete", "il sonno", "la mamma"])]


def build(lesson_id, steps):
    ex, flow = [], []

    def add(e):
        e["id"] = f"{C}:{lesson_id}-e{len(ex)}"
        ex.append(e)
        flow.append({"exercise": e["id"]})

    for st in steps:
        kind = st[0]
        if kind == "concept":
            flow.append({"concept": st[1]})
        elif kind == "art":
            art, noun = split_art(st[1])
            add({"type": "articleSelect", "articles": ARTS, "noun": noun, "gloss": g(st[1]), "correct": ARTS.index(art), "audioTarget": st[1]})
        elif kind in ("t2n", "n2t", "listen"):
            s, wrong = st[1], st[2]
            if kind == "t2n":
                o, p = place({"text": g(s)}, [{"text": g(w)} for w in wrong])
                add({"type": "select", "mode": "targetToNative", "prompt": s, "audioTarget": s, "options": o, "correct": p})
            elif kind == "n2t":
                o, p = place({"text": s}, [{"text": w} for w in wrong])
                add({"type": "select", "mode": "nativeToTarget", "prompt": g(s), "audioTarget": s, "options": o, "correct": p})
            else:
                o, p = place({"text": s}, [{"text": w} for w in wrong])
                add({"type": "select", "mode": "listen", "prompt": "Nghe rồi chọn từ bạn nghe thấy.", "audioTarget": s, "options": o, "correct": p})
        elif kind == "t2nx":
            o, p = place({"text": st[2]}, [{"text": w} for w in st[3]])
            add({"type": "select", "mode": "targetToNative", "prompt": st[1], "audioTarget": st[1], "options": o, "correct": p})
        elif kind == "fill":
            sent, ans, wrong, vi = st[1:]
            o, p = place(ans, wrong)
            add({"type": "fillBlank", "sentence": sent, "translation": vi, "audioTarget": sent.replace("___ ", ans if ans.endswith("'") else f"{ans} ").replace("___", ans), "options": o, "correct": p})
        elif kind == "conj":
            sent, verb, cell, vi = st[1:]
            add({"type": "conjugationCloze", "sentence": sent, "translation": vi, "verb": verb, "cell": cell, "answer": PAR[verb][cell], "alternatives": []})
        elif kind == "type":
            add({"type": "typeAnswer", "mode": "produceTarget", "prompt": st[1], "audioTarget": st[2], "answer": st[2], "alternatives": st[3]})
        elif kind == "wb":
            vi, it, extra = st[1:]
            ans = it.rstrip(".!?").replace(",", "").split()
            toks = ans + [x for x in extra if x not in ans]
            order = sorted(range(len(toks)), key=lambda i: ((i * 5 + len(ex) * 3) % 7, i))
            add({"type": "wordBank", "direction": "nativeToTarget", "prompt": vi, "tokens": [toks[i] for i in order], "answer": ans})
        elif kind == "wbt":
            it, vi, extra = st[1:]
            ans = vi.rstrip(".!?").replace(",", "").split()
            toks = ans + [x for x in extra if x not in ans]
            order = sorted(range(len(toks)), key=lambda i: ((i * 5 + len(ex) * 3) % 7, i))
            add({"type": "wordBank", "direction": "targetToNative", "prompt": it, "audioTarget": it, "tokens": [toks[i] for i in order], "answer": ans})
        elif kind == "match":
            add({"type": "match", "pairs": [{"target": t, "native": g(t)} for t in st[1]]})
    return {"lessonId": f"{C}:{lesson_id}", "exercises": ex, "flow": flow}


recs = [build(k_, v) for k_, v in L.items()]
with open(OUT, "w", encoding="utf-8", newline="\n") as f:
    for r in recs:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
print(len(recs), sum(len(r["exercises"]) for r in recs), dict(Counter(e["type"] for r in recs for e in r["exercises"])))

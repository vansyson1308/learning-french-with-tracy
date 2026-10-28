"""de-vi section 2 lessons (gender & articles, verbs, cognates, numbers, spelling & sounds).
Hand-authored per lesson in a compact DSL; conjugation answers come from the committed
paradigm tables; every lesson interleaves its concept cards in `flow`.
usage: python -I de-lessons-s2.py <out.jsonl> (appends nothing; writes section 2 records)"""
import json, os, sys

ROOT = r"C:\src\lft\content\de"
LEX = {l["surface"]: l for l in json.load(open(os.path.join(ROOT, "lexicon", "lexemes.json"), encoding="utf-8"))["lexemes"]}
PP = os.path.join(ROOT, "_drafts", "staged", "content", "de", "pedagogy", "paradigms.json")
PAR = {t["lemma"]: t["cells"] for t in json.load(open(PP, encoding="utf-8"))["tables"]}
C = "de-vi"
ARTS = ["der", "die", "das"]

def g(surface):
    l = LEX.get(surface)
    assert l, f"not a lexeme: {surface}"
    return l["glosses"]["vi"].split(";")[0].strip()

pos = [0]
def P():
    p = pos[0] % 4
    pos[0] += 1
    return p

def place(correct, wrong):
    p = P()
    out = list(wrong[:3])
    out.insert(p, correct)
    return out, p

# Each lesson: list of steps. Step kinds:
#  ("concept", id)
#  ("art", "der Tisch")                              articleSelect
#  ("t2n", surface, [distractor surfaces])           select target→native
#  ("n2t", surface, [distractor surfaces])           select native→target
#  ("t2nx", target_text, vi, [wrong vi])             select with custom (non-lexeme) texts
#  ("listen", surface, [distractor surfaces])
#  ("fill", sentence, answer, [wrong], vi)
#  ("conj", sentence, verb, cell, vi)
#  ("type", vi, de, [alts])
#  ("wb", vi, de, [extra German tokens])             wordBank native→target
#  ("wbt", de, vi, [extra Vietnamese tokens])        wordBank target→native
#  ("match", [(target, native)])
L = {}
L["ua-l0"] = [("concept", "de:concept:three-genders"), ("art", "der Tisch"), ("art", "die Tür"), ("art", "das Haus"), ("t2n", "der Tisch", ["die Tür", "das Bett", "die Küche"]),
  ("concept", "de:concept:gender-endings"), ("art", "die Wohnung"), ("art", "die Küche"), ("n2t", "die Wohnung", ["das Haus", "der Stuhl", "die Tür"]),
  ("fill", "___ Fenster ist groß.", "Das", ["Der", "Die", "Den"], "Cửa sổ to."), ("type", "ngôi nhà (kèm mạo từ)", "das Haus", []),
  ("match", [("der Tisch", g("der Tisch")), ("die Tür", g("die Tür")), ("das Haus", g("das Haus")), ("die Küche", g("die Küche")), ("das Bett", g("das Bett"))])]
L["ua-l1"] = [("concept", "de:concept:ein-kein"), ("fill", "Das ist ___ Tisch.", "ein", ["eine", "einen", "kein"], "Đây là một cái bàn."), ("fill", "Das ist ___ Tasche.", "eine", ["ein", "einen", "keine"], "Đây là một cái túi."),
  ("art", "die Uhr"), ("art", "die Tasche"), ("fill", "Das ist ___ Bild.", "kein", ["keine", "keinen", "nicht"], "Đây không phải là bức tranh."), ("t2n", "das Handy", ["das Telefon", "die Uhr", "das Bild"]),
  ("n2t", "das Telefon", ["das Handy", "der Schlüssel", "die Tasche"]), ("type", "Đây là một cái ghế.", "Das ist ein Stuhl.", ["Das ist ein Stuhl"]),
  ("wb", "Đây không phải là cái túi.", "Das ist keine Tasche.", ["kein", "nicht", "ein"])]
L["ua-l2"] = [("concept", "de:concept:plurals"), ("fill", "Ich habe zwei ___.", "Tische", ["Tisch", "Tischen", "Tischs"], "Tôi có hai cái bàn."), ("fill", "drei ___", "Betten", ["Bett", "Bette", "Bettes"], "ba cái giường"),
  ("fill", "zwei ___", "Häuser", ["Haus", "Hause", "Hausen"], "hai ngôi nhà"), ("fill", "Die ___ sind groß.", "Fenster", ["Fensters", "Fenstern", "Fenstere"], "Những cái cửa sổ to."),
  ("t2nx", "die Uhren", "những cái đồng hồ", ["một cái đồng hồ", "những cái túi", "những cái bàn"]), ("type", "hai cái chìa khóa", "zwei Schlüssel", []), ("type", "những căn hộ", "die Wohnungen", ["Wohnungen"]),
  ("wb", "Tôi có hai cái túi.", "Ich habe zwei Taschen.", ["Tasche", "drei", "hat"]),
  ("match", [("die Tische", "những cái bàn"), ("die Häuser", "những ngôi nhà"), ("die Betten", "những cái giường"), ("die Uhren", "những cái đồng hồ"), ("die Taschen", "những cái túi")])]
L["ua-l3"] = [("concept", "de:concept:accusative"), ("fill", "Ich habe ___ Schlüssel.", "den", ["der", "das", "die"], "Tôi có chìa khóa (đó)."), ("fill", "Ich kaufe ___ Tisch.", "einen", ["ein", "eine", "keine"], "Tôi mua một cái bàn."),
  ("fill", "Ich kaufe ___ Tasche.", "eine", ["einen", "ein", "keinen"], "Tôi mua một cái túi."), ("fill", "Wir haben ___ Stuhl.", "keinen", ["kein", "keine", "einen"], "Chúng tôi không có ghế."),
  ("conj", "Er ___ eine Uhr.", "haben", "pre:3s", "Anh ấy có một cái đồng hồ."), ("type", "Tôi có một cái điện thoại di động.", "Ich habe ein Handy.", ["Ich habe ein Handy"]),
  ("wb", "Bạn có chìa khóa không?", "Hast du den Schlüssel?", ["der", "hat", "einen"]), ("n2t", "der Schlüssel", ["der Stuhl", "der Tisch", "das Bild"]),
  ("wbt", "Ich habe einen Tisch.", "Tôi có một cái bàn.", ["ghế", "không", "hai"])]
L["ub-l0"] = [("concept", "de:concept:sein-haben"), ("conj", "Ich ___ Anna.", "sein", "pre:1s", "Tôi là Anna."), ("conj", "Du ___ mein Freund.", "sein", "pre:2s", "Bạn là bạn của tôi."),
  ("conj", "Er ___ in Berlin.", "sein", "pre:3s", "Anh ấy ở Berlin."), ("conj", "Wir ___ eine Familie.", "sein", "pre:1p", "Chúng tôi là một gia đình."), ("conj", "Ihr ___ hier.", "sein", "pre:2p", "Các bạn ở đây."),
  ("conj", "Ich ___ ein Auto.", "haben", "pre:1s", "Tôi có một chiếc ô tô."), ("conj", "Du ___ einen Hund.", "haben", "pre:2s", "Bạn có một con chó."), ("conj", "Wir ___ Zeit.", "haben", "pre:1p", "Chúng tôi có thời gian."),
  ("t2n", "sein", ["haben", "wohnen", "kommen"]), ("type", "Tôi là Minh.", "Ich bin Minh.", ["Ich bin Minh"])]
L["ub-l1"] = [("concept", "de:concept:present-endings"), ("conj", "Ich ___ in Hanoi.", "wohnen", "pre:1s", "Tôi sống ở Hà Nội."), ("conj", "Sie ___ in Berlin.", "arbeiten", "pre:3s", "Cô ấy làm việc ở Berlin."),
  ("conj", "Du ___ hier.", "arbeiten", "pre:2s", "Bạn làm việc ở đây."), ("conj", "Wir ___ in Köln.", "wohnen", "pre:1p", "Chúng tôi sống ở Köln."), ("conj", "Das Kind ___ im Haus.", "spielen", "pre:3s", "Đứa trẻ chơi trong nhà."),
  ("fill", "Ihr ___ in Berlin.", "wohnt", ["wohnst", "wohnen", "wohne"], "Các bạn sống ở Berlin."), ("concept", "de:concept:vowel-change"),
  ("conj", "Du ___ Deutsch.", "sprechen", "pre:2s", "Bạn nói tiếng Đức."), ("conj", "Er ___ nach Berlin.", "fahren", "pre:3s", "Anh ấy đi Berlin."), ("type", "Tôi sống ở Hà Nội.", "Ich wohne in Hanoi.", ["Ich wohne in Hanoi"]),
  ("t2n", "arbeiten", ["wohnen", "spielen", "sprechen"])]
L["ub-l2"] = [("concept", "de:concept:verb-second"), ("wb", "Hôm nay tôi làm việc.", "Heute arbeite ich.", ["arbeiten", "du", "nicht"]),
  ("fill", "Heute ___ ich in Berlin.", "arbeite", ["arbeiten", "arbeitest", "arbeitet"], "Hôm nay tôi làm việc ở Berlin."), ("wb", "Ngày mai chúng tôi đi Berlin.", "Morgen fahren wir nach Berlin.", ["fährt", "ich", "in"]),
  ("fill", "Am Wochenende ___ wir Musik.", "spielen", ["spiele", "spielt", "spielst"], "Cuối tuần chúng tôi chơi nhạc."), ("type", "Bây giờ tôi uống cà phê.", "Jetzt trinke ich Kaffee.", ["Jetzt trinke ich Kaffee"]),
  ("wbt", "Heute fährt er mit dem Bus.", "Hôm nay anh ấy đi xe buýt.", ["tôi", "tàu", "ngày mai"]),
  ("concept", "de:concept:separable-verbs"), ("fill", "Ich rufe Anna ___.", "an", ["auf", "ab", "ein"], "Tôi gọi điện cho Anna."), ("fill", "Ich ___ Anna an.", "rufe", ["rufst", "ruft", "rufen"], "Tôi gọi điện cho Anna."),
  ("wb", "Tôi gọi điện cho mẹ.", "Ich rufe meine Mutter an.", ["auf", "rufen", "mein"]), ("fill", "Wann ___ der Film an?", "fängt", ["fangen", "fängst", "fange"], "Bộ phim bắt đầu lúc nào?"),
  ("type", "Bộ phim bắt đầu lúc tám giờ.", "Der Film fängt um acht Uhr an.", ["Der Film fängt um acht Uhr an"]), ("t2n", "anrufen", ["anfangen", "kommen", "sprechen"]),
  ("concept", "de:concept:modal-verbs"), ("conj", "Ich ___ Deutsch sprechen.", "können", "pre:1s", "Tôi biết nói tiếng Đức."), ("conj", "Er ___ heute arbeiten.", "müssen", "pre:3s", "Hôm nay anh ấy phải làm việc.")]
L["ub-l3"] = [("concept", "de:concept:perfekt"), ("conj", "Ich habe in Berlin ___.", "wohnen", "participle", "Tôi đã sống ở Berlin."), ("conj", "Wir haben Musik ___.", "spielen", "participle", "Chúng tôi đã chơi nhạc."),
  ("conj", "Er hat viel ___.", "arbeiten", "participle", "Anh ấy đã làm việc nhiều."), ("conj", "Ich bin nach Berlin ___.", "fahren", "participle", "Tôi đã đi Berlin."), ("conj", "Sie hat Deutsch ___.", "sprechen", "participle", "Cô ấy đã nói tiếng Đức."),
  ("fill", "Ich ___ nach Hamburg gefahren.", "bin", ["habe", "hat", "ist"], "Tôi đã đi Hamburg."), ("fill", "Wir ___ Pizza gegessen.", "haben", ["sind", "hat", "bin"], "Chúng tôi đã ăn pizza."),
  ("type", "Tôi đã làm việc.", "Ich habe gearbeitet.", ["Ich habe gearbeitet"]), ("wbt", "Ich habe einen Kuchen gegessen.", "Tôi đã ăn một cái bánh ngọt.", ["uống", "sẽ", "hai"])]
L["uc-l0"] = [("t2n", "die Musik", ["das Foto", "der Film", "das Internet"]), ("t2n", "das Foto", ["die Musik", "die Pizza", "das Problem"]), ("t2n", "der Film", ["das Internet", "das Foto", "die Musik"]),
  ("n2t", "die Pizza", ["das Problem", "der Film", "die Musik"]), ("n2t", "das Problem", ["das Foto", "die Pizza", "das Internet"]), ("art", "der Film"), ("art", "die Pizza"), ("art", "das Internet"),
  ("type", "bộ phim (kèm mạo từ)", "der Film", []), ("match", [("die Musik", g("die Musik")), ("das Foto", g("das Foto")), ("der Film", g("der Film")), ("das Internet", g("das Internet")), ("die Pizza", g("die Pizza"))])]
L["uc-l1"] = [("concept", "de:concept:compounds"), ("t2n", "das Krankenhaus", ["das Schlafzimmer", "das Wochenende", "der Geburtstag"]), ("t2n", "das Schlafzimmer", ["das Krankenhaus", "der Geburtstag", "das Wochenende"]),
  ("fill", "das Kranken___", "haus", ["zimmer", "tag", "ende"], "bệnh viện (người ốm + nhà)"), ("fill", "das Schlaf___", "zimmer", ["haus", "tag", "ende"], "phòng ngủ (ngủ + phòng)"),
  ("fill", "der Geburts___", "tag", ["haus", "zimmer", "ende"], "sinh nhật (ra đời + ngày)"), ("fill", "das Wochen___", "ende", ["tag", "haus", "zimmer"], "cuối tuần (tuần + cuối)"),
  ("art", "das Schlafzimmer"), ("art", "der Geburtstag"), ("type", "cuối tuần (kèm mạo từ)", "das Wochenende", []), ("n2t", "der Geburtstag", ["das Wochenende", "das Krankenhaus", "das Schlafzimmer"])]
L["uc-l2"] = [("concept", "de:concept:false-friends"), ("t2nx", "der Chef", "sếp", ["đầu bếp", "khách", "bạn"]), ("t2nx", "bekommen", "nhận được", ["trở thành", "đến", "có thể"]),
  ("fill", "Ich ___ eine Nachricht.", "bekomme", ["bekommst", "bekommt", "bekommen"], "Tôi nhận được một tin nhắn."), ("type", "Sếp của tôi tên là Müller.", "Mein Chef heißt Müller.", ["Mein Chef heißt Müller"]),
  ("wb", "Tôi nhận được một bức ảnh.", "Ich bekomme ein Foto.", ["werde", "einen", "der"]), ("conj", "Das Kind ___ groß.", "werden", "pre:3s", "Đứa trẻ lớn lên (trở nên to)."),
  ("n2t", "der Chef", ["der Film", "das Problem", "das Foto"]), ("fill", "Es ___ kalt.", "wird", ["bekommt", "hat", "kommt"], "Trời trở lạnh.")]
L["uc-l3"] = [("t2n", "wer", ["wo", "was", "wie"]), ("t2n", "wo", ["wer", "wann", "was"]), ("t2n", "also", ["auch", "aber", "oder"]),
  ("fill", "___ ist das?", "Wer", ["Wo", "Wie", "Wann"], "Đó là ai?"), ("fill", "___ ist der Bahnhof?", "Wo", ["Wer", "Was", "Wann"], "Nhà ga ở đâu?"), ("t2n", "das Handy", ["das Telefon", "das Foto", "das Internet"]),
  ("type", "Đó là ai?", "Wer ist das?", ["Wer ist das"]), ("wbt", "Also, wo ist das Hotel?", "Vậy khách sạn ở đâu?", ["ai", "khi", "và"]),
  ("match", [("wer", g("wer")), ("wo", g("wo")), ("was", g("was")), ("also", g("also")), ("das Handy", g("das Handy"))])]
L["ud-l0"] = [("concept", "de:concept:numbers"), ("t2n", "drei", ["zwei", "vier", "acht"]), ("t2n", "zwölf", ["elf", "zehn", "zwei"]), ("t2n", "sieben", ["sechs", "neun", "acht"]),
  ("n2t", "neun", ["acht", "zehn", "fünf"]), ("fill", "Eine Woche hat ___ Tage.", "sieben", ["sechs", "acht", "zehn"], "Một tuần có bảy ngày."), ("fill", "Ein Jahr hat ___ Monate.", "zwölf", ["elf", "zehn", "zwei"], "Một năm có mười hai tháng."),
  ("type", "mười", "zehn", []), ("type", "Tôi có hai con chó.", "Ich habe zwei Hunde.", ["Ich habe zwei Hunde"]),
  ("match", [("eins", g("eins")), ("zwei", g("zwei")), ("drei", g("drei")), ("vier", g("vier")), ("fünf", g("fünf"))]), ("wbt", "Das kostet zehn Euro.", "Cái đó giá mười euro.", ["hai", "tôi", "giờ"])]
L["ud-l1"] = [("t2n", "dreizehn", ["dreißig", "drei", "zwanzig"]), ("t2n", "sechzehn", ["sechs", "sechzig", "siebzehn"]), ("t2n", "siebzehn", ["siebzig", "sieben", "sechzehn"]), ("t2n", "zwanzig", ["zwölf", "zwei", "dreißig"]),
  ("n2t", "sechzehn", ["sechzig", "sechs", "siebzehn"]), ("fill", "Er ist ___ Jahre alt.", "siebzehn", ["siebenzehn", "siebzig", "sieben"], "Cậu ấy mười bảy tuổi."),
  ("fill", "Das Ticket kostet ___ Euro.", "zwanzig", ["zweizig", "zwölf", "zwei"], "Vé giá hai mươi euro."), ("type", "mười ba", "dreizehn", []), ("type", "Tôi mười sáu tuổi.", "Ich bin sechzehn Jahre alt.", ["Ich bin sechzehn.", "Ich bin sechzehn"]),
  ("match", [("dreizehn", g("dreizehn")), ("sechzehn", g("sechzehn")), ("siebzehn", g("siebzehn")), ("zwanzig", g("zwanzig")), ("zwölf", g("zwölf"))])]
L["ud-l2"] = [("fill", "drei___zwanzig", "und", ["an", "um", "in"], "hai mươi ba (ba-và-hai mươi)"), ("t2n", "dreißig", ["dreizehn", "drei", "vierzig"]), ("t2n", "fünfzig", ["fünf", "fünfzehn", "sechzig"]),
  ("t2n", "siebzig", ["siebzehn", "sieben", "sechzig"]), ("t2n", "hundert", ["zehn", "zwanzig", "fünfzig"]), ("fill", "Eine Stunde hat ___ Minuten.", "sechzig", ["sechzehn", "sechs", "siebzig"], "Một giờ có sáu mươi phút."),
  ("type", "ba mươi", "dreißig", []), ("type", "một trăm", "hundert", ["einhundert"]), ("n2t", "fünfzig", ["fünf", "vierzig", "sechzig"]), ("wb", "Bố tôi bốn mươi tuổi.", "Mein Vater ist vierzig.", ["vier", "sind", "meine"])]
L["ud-l3"] = [("concept", "de:concept:clock-time"), ("fill", "Es ist ___ drei.", "halb", ["um", "nach", "vor"], "Bây giờ là hai giờ rưỡi."), ("fill", "Der Zug kommt ___ acht Uhr.", "um", ["in", "an", "zu"], "Tàu đến lúc tám giờ."),
  ("fill", "Das kostet zehn ___.", "Euro", ["Uhr", "Jahre", "Minuten"], "Cái đó giá mười euro."), ("type", "Bây giờ là mười giờ.", "Es ist zehn Uhr.", ["Es ist zehn Uhr"]), ("wb", "Tôi ba mươi tuổi.", "Ich bin dreißig Jahre alt.", ["drei", "bist", "Jahr"]),
  ("t2n", "die Uhr", ["die Woche", "das Jahr", "die Minute"]), ("t2n", "das Geld", ["die Zeit", "das Jahr", "die Zahl"]), ("n2t", "die Minute", ["die Woche", "der Monat", "die Uhr"]),
  ("match", [("die Woche", g("die Woche")), ("der Monat", g("der Monat")), ("das Jahr", g("das Jahr")), ("die Minute", g("die Minute")), ("die Zeit", g("die Zeit"))])]
L["ue-l0"] = [("concept", "de:concept:capitals-eszett"), ("fill", "die Stra___e", "ß", ["ss", "s", "sz"], "đường phố (ß sau nguyên âm dài)"), ("fill", "der Flu___", "ss", ["ß", "s", "sch"], "dòng sông (ss sau nguyên âm ngắn)"),
  ("fill", "Das ___ ist schön.", "Haus", ["haus", "HAUS", "Hause"], "Ngôi nhà đẹp."), ("t2n", "schön", ["groß", "klein", "spät"]), ("t2n", "groß", ["klein", "schön", "früh"]),
  ("type", "đường phố (kèm mạo từ)", "die Straße", ["die Strasse"]), ("n2t", "klein", ["groß", "schön", "spät"]), ("match", [("schön", g("schön")), ("groß", g("groß")), ("klein", g("klein")), ("früh", g("früh")), ("spät", g("spät"))])]
L["ue-l1"] = [("concept", "de:concept:sounds-umlaut-ch"), ("listen", "früh", ["spät", "groß", "klein"]), ("listen", "schön", ["groß", "spät", "früh"]), ("t2n", "die Tür", ["die Straße", "der Fluss", "das Haus"]),
  ("fill", "Die T___r ist zu.", "ü", ["u", "ue", "i"], "Cửa đóng rồi."), ("fill", "Das ist sch___n.", "ö", ["o", "oe", "e"], "Cái đó đẹp."), ("t2n", "das Buch", ["das Bild", "das Haus", "das Bett"]),
  ("type", "đẹp", "schön", ["schoen"]), ("listen", "die Tür", ["die Uhr", "das Haus", "der Fluss"])]
L["ue-l2"] = [("concept", "de:concept:final-devoicing-length"), ("fill", "Der Hun___ ist groß.", "d", ["t", "dt", "tt"], "Con chó to (viết d, đọc như t)."), ("fill", "der Ta___", "g", ["k", "ck", "gg"], "ngày (viết g, đọc như k)"),
  ("fill", "Das Ki___ spielt.", "nd", ["nt", "ndt", "ntt"], "Đứa trẻ chơi."), ("type", "con chó (kèm mạo từ)", "der Hund", []), ("listen", "klein", ["groß", "schön", "spät"]), ("t2n", "spät", ["früh", "klein", "groß"]),
  ("t2n", "früh", ["spät", "schön", "klein"]), ("match", [("der Hund", g("der Hund")), ("der Tag", g("der Tag")), ("das Kind", g("das Kind")), ("die Stadt", g("die Stadt")), ("das Brot", g("das Brot"))])]
L["ue-l3"] = [("wb", "Buổi sáng tôi uống cà phê.", "Am Morgen trinke ich Kaffee.", ["trinkst", "Tee", "du"]), ("wbt", "Der Fluss ist groß und schön.", "Dòng sông to và đẹp.", ["nhỏ", "muộn", "không"]),
  ("fill", "Ich komme heute ___.", "spät", ["früh", "groß", "klein"], "Hôm nay tôi đến muộn."), ("conj", "Du ___ in Köln.", "wohnen", "pre:2s", "Bạn sống ở Köln."),
  ("conj", "Wir ___ am Wochenende.", "spielen", "pre:1p", "Cuối tuần chúng tôi chơi."), ("type", "Bạn đến sớm.", "Du kommst früh.", ["Du kommst früh"]), ("t2n", "der Fluss", ["die Straße", "die Tür", "die Stadt"]),
  ("n2t", "spät", ["früh", "schön", "groß"])]

def build(lesson_id, steps):
    unit = lesson_id.split("-")[0]
    ex, flow = [], []
    def add(e):
        e["id"] = f"{C}:{lesson_id}-e{len(ex)}"
        ex.append(e)
        flow.append({"exercise": e["id"]})
    for st in steps:
        k = st[0]
        if k == "concept":
            flow.append({"concept": st[1]})
        elif k == "art":
            art, noun = st[1].split(" ", 1)
            add({"type": "articleSelect", "articles": ARTS, "noun": noun, "gloss": g(st[1]), "correct": ARTS.index(art), "audioTarget": st[1]})
        elif k in ("t2n", "n2t", "listen"):
            s, wrong = st[1], st[2]
            if k == "t2n":
                o, p = place({"text": g(s)}, [{"text": g(w)} for w in wrong])
                add({"type": "select", "mode": "targetToNative", "prompt": s, "audioTarget": s, "options": o, "correct": p})
            elif k == "n2t":
                o, p = place({"text": s}, [{"text": w} for w in wrong])
                add({"type": "select", "mode": "nativeToTarget", "prompt": g(s), "audioTarget": s, "options": o, "correct": p})
            else:
                o, p = place({"text": s}, [{"text": w} for w in wrong])
                add({"type": "select", "mode": "listen", "prompt": "Nghe rồi chọn từ bạn nghe thấy.", "audioTarget": s, "options": o, "correct": p})
        elif k == "t2nx":
            o, p = place({"text": st[2]}, [{"text": w} for w in st[3]])
            add({"type": "select", "mode": "targetToNative", "prompt": st[1], "audioTarget": st[1], "options": o, "correct": p})
        elif k == "fill":
            sent, ans, wrong, vi = st[1:]
            o, p = place(ans, wrong)
            add({"type": "fillBlank", "sentence": sent, "translation": vi, "audioTarget": sent.replace("___", ans), "options": o, "correct": p})
        elif k == "conj":
            sent, verb, cell, vi = st[1:]
            add({"type": "conjugationCloze", "sentence": sent, "translation": vi, "verb": verb, "cell": cell, "answer": PAR[verb][cell], "alternatives": []})
        elif k == "type":
            add({"type": "typeAnswer", "mode": "produceTarget", "prompt": st[1], "audioTarget": st[2], "answer": st[2], "alternatives": st[3]})
        elif k == "wb":
            vi, de, extra = st[1:]
            ans = de.rstrip(".!?").replace(",", "").split()
            toks = ans + [x for x in extra if x not in ans]
            order = sorted(range(len(toks)), key=lambda i: ((i * 5 + len(ex) * 3) % 7, i))
            add({"type": "wordBank", "direction": "nativeToTarget", "prompt": vi, "tokens": [toks[i] for i in order], "answer": ans})
        elif k == "wbt":
            de, vi, extra = st[1:]
            ans = vi.rstrip(".!?").replace(",", "").split()
            toks = ans + [x for x in extra if x not in ans]
            order = sorted(range(len(toks)), key=lambda i: ((i * 5 + len(ex) * 3) % 7, i))
            add({"type": "wordBank", "direction": "targetToNative", "prompt": de, "audioTarget": de, "tokens": [toks[i] for i in order], "answer": ans})
        elif k == "match":
            add({"type": "match", "pairs": [{"target": t, "native": n} for t, n in st[1]]})
    return {"lessonId": f"{C}:{lesson_id}", "exercises": ex, "flow": flow}

recs = [build(k, v) for k, v in L.items()]
with open(sys.argv[1], "w", encoding="utf-8", newline="\n") as f:
    for r in recs:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
from collections import Counter
print(len(recs), sum(len(r["exercises"]) for r in recs), dict(Counter(e["type"] for r in recs for e in r["exercises"])))

"""de-vi section 5 (writing): 16 writing tasks + 16 lessons.
Writes content/de/_drafts/writing/OUTPUT.jsonl; S5 lesson records to argv[1]."""
import json, os, re, sys

ROOT = r"C:\src\lft\content\de"
LEX = json.load(open(os.path.join(ROOT, "lexicon", "lexemes.json"), encoding="utf-8"))["lexemes"]
SURF = {l["surface"]: l for l in LEX}
def lid(s):
    assert s in SURF, s
    return SURF[s]["id"]

OBJ = {"o": "de.obj.writing.personal_info", "p": "de.obj.writing.phrases_sentences", "q": "de.obj.writing.short_message", "r": "de.obj.writing.form_filling"}
GREET = ["hallo", "hi", "liebe", "lieber", "guten tag"]
CLOSE = ["bis bald", "tschüss", "viele grüße", "liebe grüße", "bis dann"]
# slug -> (family, instruction vi, cueFacts [(label, value)], slots [(id, desc vi, variants, cueProvided)], minT, maxT, verbs, model, lexeme surfaces, formFields)
T = {
 "o_name": ("personal_profile", "Bạn là Lena. Hãy viết một câu tiếng Đức ngắn nói tên của bạn.", [("Tên của bạn", "Lena")],
            [("name", "tên của bạn", ["ich heiße lena", "mein name ist lena", "ich bin lena"], True)], 2, 12, ["heiße", "ist", "bin"], "Ich heiße Lena.", ["der Name"], None),
 "o_age": ("personal_profile", "Bạn 25 tuổi. Hãy viết một câu tiếng Đức nói tuổi của bạn.", [("Tuổi", "25")],
           [("age", "tuổi của bạn", ["ich bin 25", "ich bin fünfundzwanzig", "ich bin 25 jahre alt", "ich bin fünfundzwanzig jahre alt"], True)], 3, 12, ["bin"], "Ich bin 25 Jahre alt.", ["das Jahr", "alt"], None),
 "o_city": ("personal_profile", "Bạn sống ở Hamburg. Hãy viết một câu tiếng Đức nói bạn sống ở đâu.", [("Thành phố", "Hamburg")],
            [("city", "thành phố bạn sống", ["ich wohne in hamburg", "ich lebe in hamburg"], True)], 3, 12, ["wohne", "lebe"], "Ich wohne in Hamburg.", ["wohnen", "die Stadt"], None),
 "o_all": ("personal_profile", "Hãy viết ba câu ngắn về bạn: tên, tuổi và thành phố.", [("Tên", "Lena"), ("Tuổi", "25"), ("Thành phố", "Hamburg")],
           [("name", "tên", ["ich heiße lena", "mein name ist lena", "ich bin lena"], True), ("age", "tuổi", ["25", "fünfundzwanzig"], True), ("city", "thành phố", ["in hamburg"], True)], 6, 25, ["heiße", "bin", "wohne"],
           "Ich heiße Lena. Ich bin 25 Jahre alt. Ich wohne in Hamburg.", ["der Name", "das Jahr", "wohnen", "die Stadt"], None),
 "p_like": ("simple_description", "Hãy viết một câu tiếng Đức nói rằng bạn thích chơi bóng đá.", None,
            [("like", "bạn thích chơi bóng đá", ["ich spiele gern fußball", "ich spiele gerne fußball"], False)], 3, 10, ["spiele"], "Ich spiele gern Fußball.", ["spielen", "gern"], None),
 "p_two": ("simple_description", "Hãy viết một câu nói rằng bạn thích uống cà phê và trà.", None,
           [("coffee", "cà phê", ["kaffee"], False), ("tea", "trà", ["tee"], False)], 4, 12, ["trinke"], "Ich trinke gern Kaffee und Tee.", ["der Kaffee", "der Tee", "gern"], None),
 "p_other": ("simple_description", "Hãy viết hai câu về Paul: tên anh ấy và nơi anh ấy sống.", [("Tên", "Paul"), ("Thành phố", "Köln")],
             [("name", "tên của Paul", ["er heißt paul", "sein name ist paul", "das ist paul"], True), ("city", "nơi Paul sống", ["er wohnt in köln", "er lebt in köln"], True)], 5, 16, ["heißt", "wohnt", "ist", "lebt"],
             "Er heißt Paul. Er wohnt in Köln.", ["wohnen"], None),
 "p_scene": ("simple_description", "Hãy viết hai câu tả bức tranh: con mèo nhỏ, ngôi nhà to.", None,
             [("cat", "con mèo nhỏ", ["die katze ist klein"], False), ("house", "ngôi nhà to", ["das haus ist groß", "das haus ist gross"], False)], 6, 16, ["ist"],
             "Die Katze ist klein. Das Haus ist groß.", ["die Katze", "klein", "das Haus", "groß"], None),
 "q_cafe": ("short_message", "Hãy viết một lời nhắn ngắn cho Anna: chào cô ấy, và hẹn gặp ở quán cà phê lúc ba giờ.", [("Gửi", "Anna"), ("Ở đâu", "quán cà phê"), ("Giờ", "3:00")],
            [("greeting", "lời chào", GREET, False), ("addressee", "tên người nhận", ["anna"], True), ("place", "quán cà phê", ["café", "kaffee"], True), ("time", "giờ hẹn", ["um drei", "um 3", "um 15 uhr"], True)], 5, 20, None,
            "Hallo Anna, wir treffen uns um drei im Café.", ["treffen"], None),
 "q_train": ("short_message", "Hãy nhắn cho Tom: tàu của bạn đến lúc tám giờ.", [("Gửi", "Tom"), ("Giờ", "8:00")],
             [("greeting", "lời chào", GREET, False), ("train", "chuyến tàu", ["zug"], False), ("time", "giờ tàu đến", ["um acht", "um 8"], True)], 5, 20, None,
             "Hallo Tom, mein Zug kommt um acht Uhr.", ["der Zug", "kommen"], None),
 "q_late": ("short_message", "Hãy nhắn cho Lisa: chào, báo bạn sẽ đến muộn, rồi chào kết.", [("Gửi", "Lisa")],
            [("greeting", "lời chào", GREET, False), ("late", "bạn đến muộn", ["später", "spät"], False), ("closing", "lời chào kết", CLOSE, False)], 5, 20, None,
            "Hallo Lisa, ich komme heute später. Bis bald!", ["spät", "kommen"], None),
 "q_own": ("short_message", "Hãy nhắn cho Jonas: hẹn gặp vào thứ Bảy, rồi chào kết.", [("Gửi", "Jonas"), ("Ngày", "thứ Bảy")],
           [("greeting", "lời chào", GREET, False), ("day", "ngày hẹn", ["samstag"], True), ("closing", "lời chào kết", CLOSE, False)], 5, 20, None,
           "Hallo Jonas, wir treffen uns am Samstag. Tschüss!", ["treffen", "der Samstag"], None),
 "r_form_course": ("simple_form", "Hãy điền phiếu đăng ký khoá học với các thông tin trên thẻ.", [("Tên", "Minh"), ("Thành phố", "Köln"), ("Điện thoại", "0170 123456")],
                   [("name", "tên", ["minh"], True), ("city", "thành phố", ["köln", "koeln"], True), ("phone", "số điện thoại", ["0170 123456", "0170123456"], True)], 2, 12, None,
                   "Minh | Köln | 0170 123456", ["der Name", "die Stadt", "das Telefon"], [("name", "Name", "name"), ("stadt", "Stadt", "city"), ("telefon", "Telefon", "phone")]),
 "r_form_hotel": ("simple_form", "Hãy điền phiếu khách sạn với các thông tin trên thẻ.", [("Họ", "Tran"), ("Đường", "Bahnhofstraße 5"), ("Điện thoại", "0151 987654")],
                  [("name", "họ tên", ["tran"], True), ("street", "đường", ["bahnhofstraße 5", "bahnhofstrasse 5"], True), ("phone", "số điện thoại", ["0151 987654", "0151987654"], True)], 2, 12, None,
                  "Tran | Bahnhofstraße 5 | 0151 987654", ["der Name", "die Straße", "das Telefon"], [("name", "Name", "name"), ("strasse", "Straße", "street"), ("telefon", "Telefon", "phone")]),
 "r_hotel_mail": ("short_message", "Hãy viết thư ngắn cho một khách sạn: chào, hỏi một phòng cho thứ Bảy, rồi chào kết.", [("Ngày", "thứ Bảy")],
                  [("greeting", "lời chào", ["sehr geehrte damen und herren", "guten tag", "hallo"], False), ("room", "một phòng", ["zimmer"], False), ("day", "thứ Bảy", ["samstag"], True), ("closing", "lời chào kết", ["viele grüße", "mit freundlichen grüßen", "freundliche grüße"], False)], 8, 30, None,
                  "Sehr geehrte Damen und Herren, haben Sie am Samstag ein Zimmer frei? Viele Grüße, Minh", ["das Zimmer", "der Samstag"], None),
 "r_all": ("personal_profile", "Hãy viết về bạn: tên, đến từ Việt Nam, sống ở Köln, làm việc ở một bệnh viện.", [("Tên", "Minh"), ("Quê", "Việt Nam"), ("Thành phố", "Köln"), ("Nơi làm việc", "bệnh viện")],
           [("name", "tên", ["ich heiße minh", "mein name ist minh", "ich bin minh"], True), ("from", "quê", ["aus vietnam"], True), ("city", "thành phố", ["in köln"], True), ("work", "nơi làm việc", ["krankenhaus"], True)], 10, 35, ["heiße", "komme", "wohne", "arbeite"],
           "Ich heiße Minh. Ich komme aus Vietnam. Ich wohne in Köln und arbeite in einem Krankenhaus.", ["der Name", "kommen", "wohnen", "arbeiten", "das Krankenhaus"], None),
}
tasks, ex_for = [], {}
for slug, (fam, instr, cue, slots, mn, mx, verbs, model, lex, fields) in T.items():
    u = slug[0]
    tid = f"de.write.{slug}"
    rubric = {"requiredSlots": [{"id": i, "description": {"vi": d, "en": d}, "variants": v, "cueProvided": c} for i, d, v, c in slots], "minTokens": mn, "maxTokens": mx}
    if verbs: rubric["requireSentenceVerbs"] = verbs
    t = {"id": tid, "taskFamily": fam, "mode": "guided", "instruction": {"vi": instr, "en": instr}}
    if cue: t["cueFacts"] = [{"label": {"vi": a, "en": a}, "value": b} for a, b in cue]
    if fields: t["formFields"] = [{"id": a, "label": b, "slotId": c} for a, b, c in fields]
    t.update({"rubric": rubric, "modelAnswers": [model], "objectiveRefs": [OBJ[u]], "lexemeRefs": [lid(s) for s in lex], "scoredEligibility": False, "reserved": False, "sourceRef": "original-project"})
    tasks.append(t)
    flat_rubric = {**rubric, "requiredSlots": [{**s, "description": s["description"]["vi"]} for s in rubric["requiredSlots"]]}
    e = {"type": "simpleForm" if fields else "guidedWriting", "writingTaskId": tid}
    if not fields: e["writingMode"] = "guided"
    e["instruction"] = instr
    if cue: e["cueFacts"] = [{"label": a, "value": b} for a, b in cue]
    if fields: e["fields"] = [{"id": a, "label": b, "slotId": c} for a, b, c in fields]
    e.update({"rubric": flat_rubric, "modelAnswers": [model], "objectiveTargets": [OBJ[u]]})
    ex_for[slug] = e

os.makedirs(os.path.join(ROOT, "_drafts", "writing"), exist_ok=True)
with open(os.path.join(ROOT, "_drafts", "writing", "OUTPUT.jsonl"), "w", encoding="utf-8", newline="\n") as f:
    for t in tasks:
        f.write(json.dumps(t, ensure_ascii=False) + "\n")

C = "de-vi"
pos = [0]
def place(correct, wrong):
    p = pos[0] % 4; pos[0] += 1
    o = list(wrong[:3]); o.insert(p, correct)
    return o, p
def W(slug): return dict(ex_for[slug])
def wb(vi, de, extra):
    ans = de.rstrip(".!?").replace(",", "").split()
    toks = ans + [x for x in extra if x not in ans]
    order = sorted(range(len(toks)), key=lambda i: ((i * 5 + pos[0]) % 7, i)); pos[0] += 1
    return {"type": "wordBank", "direction": "nativeToTarget", "prompt": vi, "tokens": [toks[i] for i in order], "answer": ans}
def typ(vi, de, alts): return {"type": "typeAnswer", "mode": "produceTarget", "prompt": vi, "audioTarget": de, "answer": de, "alternatives": alts}
def fill(sent, ans, wrong, vi):
    o, p = place(ans, wrong)
    return {"type": "fillBlank", "sentence": sent, "translation": vi, "audioTarget": sent.replace("___", ans), "options": o, "correct": p}
def n2t(surface, wrong):
    o, p = place(surface, wrong)
    return {"type": "select", "mode": "nativeToTarget", "prompt": SURF[surface]["glosses"]["vi"].split(";")[0], "audioTarget": surface, "options": [{"text": t} for t in o], "correct": p}

L = {
 "uo-l0": [wb("Tôi tên là Lena.", "Ich heiße Lena.", ["bin", "Name", "heißt"]), W("o_name"), typ("Viết bằng tiếng Đức: tôi tên là Lena.", "Ich heiße Lena.", ["Mein Name ist Lena.", "Ich bin Lena."]), fill("Mein ___ ist Lena.", "Name", ["Jahr", "Stadt", "Haus"], "Tên tôi là Lena."), n2t("der Name", ["das Jahr", "die Stadt", "die Straße"])],
 "uo-l1": [wb("Tôi 25 tuổi.", "Ich bin 25 Jahre alt.", ["habe", "Jahr", "bist"]), W("o_age"), fill("Ich bin 25 Jahre ___.", "alt", ["neu", "groß", "klein"], "Tôi 25 tuổi."), n2t("das Jahr", ["der Name", "die Woche", "der Monat"])],
 "uo-l2": [wb("Tôi sống ở Hamburg.", "Ich wohne in Hamburg.", ["komme", "aus", "bin"]), W("o_city"), fill("Ich wohne ___ Hamburg.", "in", ["aus", "nach", "um"], "Tôi sống ở Hamburg."), n2t("die Stadt", ["die Straße", "der Name", "das Jahr"]), typ("Tôi sống ở một thành phố lớn.", "Ich wohne in einer großen Stadt.", ["Ich wohne in einer großen Stadt"])],
 "uo-l3": [W("o_all"), typ("Tôi 30 tuổi.", "Ich bin 30 Jahre alt.", ["Ich bin dreißig Jahre alt.", "Ich bin 30."]), wb("Tôi tên là Minh và tôi sống ở Bonn.", "Ich heiße Minh und ich wohne in Bonn.", ["bin", "aus", "heißt"]), fill("___ heiße Minh.", "Ich", ["Du", "Er", "Wir"], "Tôi tên là Minh.")],
 "up-l0": [wb("Tôi thích chơi bóng đá.", "Ich spiele gern Fußball.", ["spielt", "nicht", "trinke"]), W("p_like"), fill("Ich spiele ___ Fußball.", "gern", ["groß", "spät", "neu"], "Tôi thích chơi bóng đá."), n2t("gern", ["spät", "früh", "groß"])],
 "up-l1": [W("p_two"), wb("Tôi thích uống trà.", "Ich trinke gern Tee.", ["Kaffee", "isst", "spiele"]), typ("Tôi thích uống cà phê và trà.", "Ich trinke gern Kaffee und Tee.", ["Ich trinke gerne Kaffee und Tee."]), fill("Ich ___ dich.", "liebe", ["lieben", "liebt", "liebst"], "Anh yêu em / Tôi yêu bạn.")],
 "up-l2": [W("p_other"), wb("Anh ấy tên là Paul.", "Er heißt Paul.", ["heiße", "bin", "Sie"]), fill("Er ___ in Köln.", "wohnt", ["wohne", "wohnen", "wohnst"], "Anh ấy sống ở Köln."), typ("Cô ấy sống ở Berlin.", "Sie wohnt in Berlin.", ["Sie wohnt in Berlin"])],
 "up-l3": [W("p_scene"), fill("Die Katze ist ___.", "klein", ["groß", "alt", "spät"], "Con mèo nhỏ."), wb("Ngôi nhà to và đẹp.", "Das Haus ist groß und schön.", ["klein", "sind", "die"]), n2t("spielen", ["lieben", "wohnen", "kommen"])],
 "uq-l0": [W("q_cafe"), wb("Chúng ta gặp nhau lúc ba giờ.", "Wir treffen uns um drei.", ["treffe", "am", "zwei"]), fill("Wir ___ uns um drei.", "treffen", ["trifft", "triffst", "treffe"], "Chúng ta gặp nhau lúc ba giờ."), n2t("die Nachricht", ["das Telefon", "der Name", "die Straße"])],
 "uq-l1": [W("q_train"), fill("Mein Zug ___ um acht Uhr.", "kommt", ["komme", "kommen", "kommst"], "Tàu của tôi đến lúc tám giờ."), wb("Tàu của tôi đến lúc tám giờ.", "Mein Zug kommt um acht Uhr.", ["Bus", "am", "kommen"]), typ("Xe buýt đến lúc chín giờ.", "Der Bus kommt um neun Uhr.", ["Der Bus kommt um 9 Uhr."])],
 "uq-l2": [W("q_late"), fill("Ich komme heute ___.", "später", ["früher", "groß", "neu"], "Hôm nay tôi đến muộn hơn."), wb("Hẹn sớm gặp lại!", "Bis bald!", ["Tschüss", "dann", "später"]), n2t("spät", ["früh", "gern", "neu"])],
 "uq-l3": [W("q_own"), typ("Chúng ta gặp nhau vào thứ Bảy.", "Wir treffen uns am Samstag.", ["Wir treffen uns am Samstag"]), fill("Viele ___!", "Grüße", ["Danke", "Dank", "Tag"], "Thân chào (cuối thư)!"), wb("Chúng ta gặp nhau vào Chủ nhật.", "Wir treffen uns am Sonntag.", ["um", "treffe", "Samstag"])],
 "ur-l0": [W("r_form_course"), n2t("das Telefon", ["der Name", "die Straße", "die Stadt"]), fill("Mein ___ ist Minh.", "Name", ["Telefon", "Straße", "Stadt"], "Tên tôi là Minh."), typ("điện thoại (kèm mạo từ)", "das Telefon", [])],
 "ur-l1": [W("r_form_hotel"), n2t("die Straße", ["die Stadt", "das Telefon", "der Name"]), fill("Ich wohne in der Bahnhof___ 5.", "straße", ["stadt", "haus", "tag"], "Tôi sống ở số 5 phố Bahnhofstraße."), typ("Tôi sống ở phố Bahnhofstraße.", "Ich wohne in der Bahnhofstraße.", ["Ich wohne in der Bahnhofstrasse."])],
 "ur-l2": [W("r_hotel_mail"), fill("Haben Sie ein ___ frei?", "Zimmer", ["Haus", "Bett", "Bild"], "Ông/bà còn phòng trống không?"), wb("Thân chào, Minh", "Viele Grüße Minh", ["Danke", "Tschüss", "Liebe"]), typ("Ông/bà còn phòng trống không?", "Haben Sie ein Zimmer frei?", ["Haben Sie ein Zimmer frei"])],
 "ur-l3": [W("r_all"), wb("Tôi làm việc ở một bệnh viện.", "Ich arbeite in einem Krankenhaus.", ["wohne", "aus", "Haus"]), fill("Ich komme ___ Vietnam.", "aus", ["in", "nach", "um"], "Tôi đến từ Việt Nam."), n2t("das Krankenhaus", ["das Haus", "das Hotel", "das Museum"])],
}
# Teaching lessons need >= 5 exercises: one more practice item each.
EXTRA = {
 "uo-l1": typ("Tôi bao nhiêu tuổi? Viết: Tôi 40 tuổi.", "Ich bin 40 Jahre alt.", ["Ich bin vierzig Jahre alt."]),
 "uo-l3": n2t("der Name", ["die Stadt", "das Jahr", "die Straße"]),
 "up-l0": typ("Tôi thích đọc sách.", "Ich lese gern Bücher.", ["Ich lese gerne Bücher."]),
 "up-l1": wb("Anh ấy thích uống cà phê.", "Er trinkt gern Kaffee.", ["Tee", "trinke", "nicht"]),
 "up-l2": n2t("wohnen", ["kommen", "spielen", "lieben"]),
 "up-l3": typ("Cái giường to.", "Das Bett ist groß.", ["Das Bett ist gross."]),
 "uq-l0": typ("Chúng ta gặp nhau lúc bốn giờ.", "Wir treffen uns um vier.", ["Wir treffen uns um vier Uhr.", "Wir treffen uns um 4."]),
 "uq-l1": n2t("treffen", ["spielen", "wohnen", "lieben"]),
 "uq-l2": typ("Hôm nay tôi đến muộn.", "Ich komme heute spät.", ["Heute komme ich spät."]),
 "uq-l3": fill("Wir treffen uns am ___.", "Samstag", ["Name", "Zug", "Telefon"], "Chúng ta gặp nhau vào thứ Bảy."),
 "ur-l0": wb("Tên tôi là Lan.", "Mein Name ist Lan.", ["heiße", "Telefon", "bin"]),
 "ur-l1": fill("Mein ___ ist neu.", "Telefon", ["Straße", "Stadt", "Name"], "Điện thoại của tôi còn mới."),
 "ur-l2": typ("Tôi cần một phòng.", "Ich brauche ein Zimmer.", ["Ich brauche ein Zimmer"]),
 "ur-l3": typ("Tôi làm việc ở Köln.", "Ich arbeite in Köln.", ["Ich arbeite in Köln"]),
}
for k, e in EXTRA.items():
    L[k].append(e)
recs = []
for lid_, exs in L.items():
    out = []
    for i, e in enumerate(exs):
        e = dict(e); e["id"] = f"{C}:{lid_}-e{i}"; out.append(e)
    recs.append({"lessonId": f"{C}:{lid_}", "exercises": out})
with open(sys.argv[1], "w", encoding="utf-8", newline="\n") as f:
    for r in recs:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
from collections import Counter
print(len(tasks), "tasks", len(recs), "lessons", sum(len(r["exercises"]) for r in recs), dict(Counter(e["type"] for r in recs for e in r["exercises"])))

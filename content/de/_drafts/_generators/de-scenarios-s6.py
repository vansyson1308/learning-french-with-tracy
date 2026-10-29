"""de-vi section 6 (interaction): 8 scenarios (register per scenario: du or Sie, consistent), partner clips, 16 lessons.
Writes content/de/_drafts/scenarios/OUTPUT.jsonl, appends partner clips to listening OUTPUT, S6 lesson records to argv[1]."""
import json, os, sys

ROOT = r"C:\src\lft\content\de"
LEX = {l["surface"]: l for l in json.load(open(os.path.join(ROOT, "lexicon", "lexemes.json"), encoding="utf-8"))["lexemes"]}
CONV, PRAC = "de.obj.interaction.everyday_conversation", "de.obj.interaction.practical_needs"

# id, register, family, objective, title vi, goal vi, steps [(partner, rephrase, learner prompt vi, intent, variants, concepts)], end text, miss text
SC = [
 ("hallo_wie_gehts", "du", "conversation", CONV, "Một lời chào nhanh", "Chào một người bạn, nói bạn khỏe, rồi chào tạm biệt.",
  [("Hallo! Wie geht's?", "Hallo! Wie geht es dir?", "Hãy chào lại và nói rằng bạn khỏe.", "greet_fine", ["Hallo! Gut, danke.", "Gut, danke.", "Danke, gut. Und dir?", "Mir geht's gut.", "Sehr gut, danke."], [["gut", "sehr gut"]]),
   ("Schön! Ich muss jetzt los. Tschüss!", "Tschüss!", "Hãy chào tạm biệt kiểu thân mật.", "say_bye", ["Tschüss!", "Bis bald!", "Tschüss, bis bald!", "Ciao!", "Bis dann!"], [["tschüss", "bis bald", "ciao", "bis dann"]])],
  "Bis bald!", "Kein Problem! Bis zum nächsten Mal."),
 ("kennenlernen", "Sie", "information_exchange", CONV, "Gặp một người lần đầu", "Nói tên và quê của bạn với một người ở lớp học.",
  [("Guten Tag! Wie heißen Sie?", "Wie ist Ihr Name?", "Hãy nói tên của bạn: Minh.", "give_name", ["Ich heiße Minh.", "Mein Name ist Minh.", "Ich bin Minh.", "Minh."], [["minh"]]),
   ("Woher kommen Sie?", "Aus welchem Land kommen Sie?", "Hãy nói bạn đến từ Việt Nam.", "give_origin", ["Ich komme aus Vietnam.", "Aus Vietnam.", "Ich bin aus Vietnam."], [["vietnam"]])],
  "Herzlich willkommen!", "Kein Problem. Bis später!"),
 ("baeckerei", "Sie", "transaction", PRAC, "Ở tiệm bánh", "Mua một ổ bánh mì và một cà phê, rồi trả tiền.",
  [("Guten Morgen! Was möchten Sie?", "Was darf es sein?", "Hãy gọi một ổ bánh mì.", "order_bread", ["Ein Brot, bitte.", "Ich möchte ein Brot, bitte.", "Ich nehme ein Brot."], [["brot"]]),
   ("Sonst noch etwas?", "Möchten Sie noch etwas?", "Hãy gọi thêm một cà phê.", "order_coffee", ["Einen Kaffee, bitte.", "Und einen Kaffee, bitte.", "Ja, einen Kaffee."], [["kaffee"]]),
   ("Das macht vier Euro.", "Vier Euro, bitte.", "Hãy đưa tiền và nói một câu lịch sự.", "pay", ["Hier, bitte.", "Bitte schön.", "Hier sind vier Euro.", "Danke!"], [["bitte", "danke", "hier"]])],
  "Danke schön! Einen schönen Tag!", "Kein Problem. Auf Wiedersehen!"),
 ("geschaeft_preis", "Sie", "transaction", PRAC, "Ở cửa hàng", "Hỏi giá một cái túi, rồi mua nó.",
  [("Guten Tag! Kann ich Ihnen helfen?", "Suchen Sie etwas?", "Hãy hỏi cái túi giá bao nhiêu.", "ask_price", ["Was kostet die Tasche?", "Wie viel kostet die Tasche?", "Was kostet die Tasche, bitte?"], [["kostet"], ["tasche"]]),
   ("Die Tasche kostet zwanzig Euro.", "Zwanzig Euro.", "Hãy nói bạn lấy cái túi.", "buy", ["Ich nehme die Tasche.", "Gut, ich nehme sie.", "Ich kaufe die Tasche."], [["nehme", "kaufe"]])],
  "Vielen Dank! Auf Wiedersehen!", "Kein Problem. Auf Wiedersehen!"),
 ("wo_bahnhof", "Sie", "information_exchange", PRAC, "Hỏi đường ra nhà ga", "Hỏi một người lạ nhà ga ở đâu, rồi cảm ơn.",
  [("Ja, bitte?", "Kann ich Ihnen helfen?", "Hãy hỏi nhà ga ở đâu.", "ask_station", ["Entschuldigung, wo ist der Bahnhof?", "Wo ist der Bahnhof?", "Entschuldigen Sie, wo ist der Bahnhof?"], [["wo"], ["bahnhof"]]),
   ("Gehen Sie geradeaus und dann links.", "Geradeaus, dann links.", "Hãy cảm ơn.", "thank", ["Danke schön!", "Vielen Dank!", "Danke!"], [["danke", "dank"]])],
  "Bitte schön! Gute Reise!", "Kein Problem. Auf Wiedersehen!"),
 ("wo_hotel", "Sie", "information_exchange", PRAC, "Tìm khách sạn", "Hỏi khách sạn ở đâu, rồi cảm ơn.",
  [("Guten Abend! Wie kann ich Ihnen helfen?", "Was suchen Sie?", "Hãy hỏi khách sạn Hotel Berlin ở đâu.", "ask_hotel", ["Wo ist das Hotel Berlin?", "Entschuldigung, wo ist das Hotel?", "Wo ist das Hotel Berlin, bitte?"], [["hotel"], ["wo"]]),
   ("Das Hotel ist in der Bahnhofstraße, nur fünf Minuten von hier.", "In der Bahnhofstraße.", "Hãy cảm ơn và chào tạm biệt lịch sự.", "thank_bye", ["Vielen Dank! Auf Wiedersehen!", "Danke schön, auf Wiedersehen!", "Danke!"], [["danke", "dank"]])],
  "Gern geschehen! Gute Nacht!", "Kein Problem. Gute Nacht!"),
 ("plaene", "du", "conversation", CONV, "Hẹn một người bạn", "Nhận lời hẹn vào thứ Bảy và nói giờ gặp.",
  [("Hast du am Samstag Zeit?", "Kannst du am Samstag?", "Hãy nói rằng bạn rảnh.", "accept", ["Ja, ich habe Zeit.", "Ja, am Samstag habe ich Zeit.", "Ja, gern."], [["ja", "gern"]]),
   ("Super! Wann treffen wir uns?", "Um wie viel Uhr?", "Hãy nói gặp lúc tám giờ.", "time", ["Um acht Uhr.", "Um acht.", "Wir treffen uns um acht."], [["acht"]])],
  "Toll, bis Samstag!", "Kein Problem. Ein anderes Mal!"),
 ("krankmeldung", "Sie", "information_exchange", PRAC, "Gọi điện xin nghỉ ốm", "Gọi cho công ty, nói bạn bị ốm và hôm nay không đến được.",
  [("Firma Müller, guten Morgen.", "Hier ist die Firma Müller.", "Hãy chào, nói tên Minh và nói bạn bị ốm.", "sick", ["Guten Morgen, hier ist Minh. Ich bin krank.", "Hier ist Minh, ich bin krank.", "Ich bin krank."], [["krank"]]),
   ("Oh, das tut mir leid. Kommen Sie heute nicht?", "Kommen Sie heute?", "Hãy nói hôm nay bạn không đến được.", "not_today", ["Nein, heute komme ich nicht.", "Nein, ich komme heute nicht.", "Heute nicht."], [["nicht"]])],
  "Gute Besserung!", "Kein Problem. Gute Besserung!"),
]
SIE = {"sie", "ihnen", "ihr", "ihre", "ihren"}
DU = {"du", "dich", "dir", "dein", "deine", "deinen"}
scen, clips, info = [], [], {}
def clip(cid, text, obj):
    clips.append({"id": cid, "kind": "message", "segments": [{"speaker": "A", "text": text}], "objectiveRefs": [obj], "lexemeRefs": [],
                  "sourceRef": "original-project", "authoringSpec": {"informationUnits": 1, "inferenceDemand": "locate"}, "scoredPlaybackPolicy": {"maxPlays": 2, "rate": 1}})
for sid, reg, fam, obj, title, goal, steps, end, miss in SC:
    base = f"de.clip.ix_{sid}"
    nodes = {}
    clip(f"{base}_miss", miss, obj)
    nodes["t_miss"] = {"kind": "terminal", "id": "t_miss", "outcome": "goal_not_met", "text": miss, "clipId": f"{base}_miss"}
    for i, (p, rp, prompt, intent, variants, concepts) in enumerate(steps):
        nxt = f"p{i+1}" if i + 1 < len(steps) else "t_ok"
        clip(f"{base}_{i}", p, obj); clip(f"{base}_{i}_s", rp, obj)
        nodes[f"p{i}"] = {"kind": "partner", "id": f"p{i}", "text": p, "clipId": f"{base}_{i}", "rephraseText": rp, "rephraseClipId": f"{base}_{i}_s", "next": f"l{i}"}
        exp = [{"intent": intent, "acceptedVariants": variants, "requiredConcepts": concepts, "next": nxt}]
        nodes[f"l{i}"] = {"kind": "learner", "id": f"l{i}", "prompt": {"vi": prompt, "en": prompt}, "expected": exp, "noMatchNext": f"r{i}", "scored": True}
        nodes[f"r{i}"] = {"kind": "partner", "id": f"r{i}", "text": rp, "clipId": f"{base}_{i}_s", "next": f"l{i}b"}
        nodes[f"l{i}b"] = {"kind": "learner", "id": f"l{i}b", "prompt": {"vi": prompt, "en": prompt}, "expected": exp, "noMatchNext": "t_miss", "scored": False}
    clip(f"{base}_end", end, obj)
    nodes["t_ok"] = {"kind": "terminal", "id": "t_ok", "outcome": "goal_met", "text": end, "clipId": f"{base}_end"}
    # Register check: partner lines use only the declared register.
    words = {w.strip("?!.,").lower() for n in nodes.values() if n["kind"] != "learner" for w in (n["text"] + " " + n.get("rephraseText", "")).split()}
    other = DU if reg == "Sie" else SIE - {"ihr", "ihre", "ihren", "sie"}
    assert not (words & other), (sid, words & other)
    scen.append({"id": f"de.scenario.{sid}", "title": {"vi": title, "en": title}, "goal": {"vi": goal, "en": goal}, "taskFamily": fam, "objectiveRefs": [obj],
                 "startNodeId": "p0", "nodes": nodes, "support": {"allowRepeat": True, "allowRephrase": True}, "reserved": False, "sourceRef": "original-project"})
    info[sid] = obj

os.makedirs(os.path.join(ROOT, "_drafts", "scenarios"), exist_ok=True)
with open(os.path.join(ROOT, "_drafts", "scenarios", "OUTPUT.jsonl"), "w", encoding="utf-8", newline="\n") as f:
    for s in scen:
        f.write(json.dumps(s, ensure_ascii=False) + "\n")
with open(os.path.join(ROOT, "_drafts", "listening", "OUTPUT.jsonl"), "a", encoding="utf-8", newline="\n") as f:
    for c in clips:
        f.write(json.dumps(c, ensure_ascii=False) + "\n")

C = "de-vi"
pos = [0]
def place(correct, wrong):
    p = pos[0] % 4; pos[0] += 1
    o = list(wrong[:3]); o.insert(p, correct)
    return o, p
def IX(sid): return {"type": "interactionScenario", "scenarioId": f"de.scenario.{sid}", "objectiveTargets": [info[sid]]}
def t2n(de, vi, wrong):
    o, p = place(vi, wrong)
    return {"type": "select", "mode": "targetToNative", "prompt": de, "audioTarget": de, "options": [{"text": t} for t in o], "correct": p}
def wb(vi, de, extra):
    ans = de.rstrip(".!?").replace(",", "").split()
    toks = ans + [x for x in extra if x not in ans]
    order = sorted(range(len(toks)), key=lambda i: ((i * 5 + pos[0]) % 7, i)); pos[0] += 1
    return {"type": "wordBank", "direction": "nativeToTarget", "prompt": vi, "tokens": [toks[i] for i in order], "answer": ans}
def fill(sent, ans, wrong, vi):
    o, p = place(ans, wrong)
    return {"type": "fillBlank", "sentence": sent, "translation": vi, "audioTarget": sent.replace("___", ans), "options": o, "correct": p}
def typ(vi, de, alts): return {"type": "typeAnswer", "mode": "produceTarget", "prompt": vi, "audioTarget": de, "answer": de, "alternatives": alts}

L = {
 "us-l0": [t2n("Wie geht's?", "Bạn khoẻ không?", ["Bạn tên gì?", "Bạn ở đâu?", "Mấy giờ rồi?"]), wb("Tôi khoẻ, cảm ơn.", "Mir geht's gut danke.", ["dir", "Tschüss", "schlecht"]), t2n("Mir geht's gut.", "Tôi khoẻ.", ["Tôi mệt.", "Tôi đói.", "Tôi ổn chứ?"]), typ("Bạn khoẻ không?", "Wie geht's?", ["Wie geht es dir?"]), fill("Wie geht es ___?", "dir", ["du", "dich", "dein"], "Bạn khoẻ không?")],
 "us-l1": [wb("Hẹn sớm gặp lại!", "Bis bald!", ["dann", "Tschüss", "später"]), IX("hallo_wie_gehts"), t2n("Tschüss!", "Tạm biệt!", ["Xin chào!", "Cảm ơn!", "Xin lỗi!"]), fill("Mir geht's ___, danke.", "gut", ["groß", "spät", "neu"], "Tôi khoẻ, cảm ơn."), typ("Tạm biệt, hẹn sớm gặp lại!", "Tschüss, bis bald!", ["Tschüss bis bald!"])],
 "us-l2": [t2n("Wie heißen Sie?", "Ông/bà tên là gì?", ["Ông/bà ở đâu?", "Ông/bà khoẻ không?", "Ông/bà muốn gì?"]), wb("Tên tôi là Minh.", "Mein Name ist Minh.", ["heiße", "Ihr", "bin"]), t2n("Woher kommen Sie?", "Ông/bà từ đâu đến?", ["Ông/bà sống ở đâu?", "Ông/bà làm nghề gì?", "Ông/bà đi đâu?"]), fill("Wie ist Ihr ___?", "Name", ["Freund", "Tag", "Abend"], "Tên của ông/bà là gì?"), typ("Ông/bà tên là gì?", "Wie heißen Sie?", ["Wie heißen Sie"])],
 "us-l3": [IX("kennenlernen"), t2n("Herzlich willkommen!", "Nhiệt liệt chào mừng!", ["Chúc ngủ ngon!", "Hẹn gặp lại!", "Cảm ơn nhiều!"]), wb("Tôi đến từ Việt Nam.", "Ich komme aus Vietnam.", ["in", "wohne", "Sie"]), fill("Ich komme ___ Vietnam.", "aus", ["in", "nach", "um"], "Tôi đến từ Việt Nam."), typ("Bạn tôi tên là Lea.", "Mein Freund heißt Lea.", ["Meine Freundin heißt Lea."])],
 "ut-l0": [t2n("Was darf es sein?", "Ông/bà dùng gì ạ?", ["Bao nhiêu tiền?", "Mấy giờ rồi?", "Ông/bà ở đâu?"]), wb("Cho tôi một ổ bánh mì.", "Ein Brot bitte.", ["Kaffee", "zwei", "kaufe"]), t2n("Ich nehme einen Kaffee.", "Tôi lấy một cà phê.", ["Tôi uống trà.", "Tôi không muốn cà phê.", "Tôi mua bánh mì."]), fill("Ich ___ ein Brot.", "kaufe", ["kaufen", "kauft", "kaufst"], "Tôi mua một ổ bánh mì."), typ("Cho tôi một cà phê.", "Einen Kaffee, bitte.", ["Einen Kaffee bitte."])],
 "ut-l1": [wb("Tôi trả tiền.", "Ich bezahle.", ["bezahlt", "kaufe", "du"]), IX("baeckerei"), t2n("Sonst noch etwas?", "Còn gì nữa không?", ["Bao nhiêu tiền?", "Mấy giờ rồi?", "Có gì mới không?"]), fill("Das ___ vier Euro.", "macht", ["machen", "kostest", "bist"], "Tổng cộng bốn euro."), typ("Tổng cộng bốn euro.", "Das macht vier Euro.", ["Das macht 4 Euro."])],
 "ut-l2": [t2n("Das ist alles.", "Thế thôi ạ.", ["Còn nữa.", "Không có gì.", "Tôi không biết."]), wb("Tôi trả bằng thẻ.", "Ich bezahle mit Karte.", ["kaufe", "bar", "dem"]), t2n("Kann ich mit Karte bezahlen?", "Tôi trả bằng thẻ được không?", ["Tôi mua thẻ được không?", "Bao nhiêu tiền?", "Tôi lấy vé được không?"]), fill("Kann ich mit Karte ___?", "bezahlen", ["bezahle", "bezahlt", "kaufen"], "Tôi trả bằng thẻ được không?"), typ("Thế thôi ạ.", "Das ist alles.", ["Das ist alles"])],
 "ut-l3": [IX("geschaeft_preis"), t2n("Was kostet die Tasche?", "Cái túi giá bao nhiêu?", ["Cái túi ở đâu?", "Cái túi màu gì?", "Cái túi có mới không?"]), wb("Tôi lấy cái túi.", "Ich nehme die Tasche.", ["kaufe", "den", "nimmt"]), fill("Was ___ das?", "kostet", ["kosten", "kaufe", "macht"], "Cái này giá bao nhiêu?"), typ("Cái này giá bao nhiêu?", "Was kostet das?", ["Wie viel kostet das?"])],
 "uu-l0": [t2n("Wo ist der Bahnhof?", "Nhà ga ở đâu?", ["Nhà ga có xa không?", "Tàu đến lúc nào?", "Vé giá bao nhiêu?"]), wb("Khách sạn ở đâu?", "Wo ist das Hotel?", ["Wann", "der", "ist"]), t2n("Entschuldigung, wo ist die Post?", "Xin lỗi, bưu điện ở đâu?", ["Xin lỗi, mấy giờ rồi?", "Xin lỗi, bạn là ai?", "Xin lỗi, bao nhiêu tiền?"]), fill("___ ist der Weg zum Bahnhof?", "Wo", ["Wer", "Wann", "Was"], "Đường đến nhà ga ở đâu?"), typ("Xin lỗi, nhà ga ở đâu?", "Entschuldigung, wo ist der Bahnhof?", ["Entschuldigen Sie, wo ist der Bahnhof?"])],
 "uu-l1": [wb("Đi thẳng rồi rẽ trái.", "Geradeaus und dann links.", ["rechts", "Bahnhof", "zurück"]), IX("wo_bahnhof"), t2n("Gehen Sie geradeaus.", "Ông/bà cứ đi thẳng.", ["Ông/bà rẽ trái.", "Ông/bà quay lại.", "Ông/bà chờ ở đây."]), fill("Gehen Sie ___ und dann links.", "geradeaus", ["zurück", "hier", "spät"], "Ông/bà đi thẳng rồi rẽ trái."), typ("Rẽ trái.", "Links.", ["Gehen Sie links."])],
 "uu-l2": [t2n("rechts", "bên phải", ["bên trái", "đi thẳng", "phía sau"]), t2n("links", "bên trái", ["bên phải", "đi thẳng", "ở đây"]), wb("Khách sạn ở bên phải.", "Das Hotel ist rechts.", ["links", "der", "geradeaus"]), fill("Die Straße ist ___.", "links", ["spät", "gern", "neu"], "Con đường ở bên trái."), typ("Nhà ga ở bên trái.", "Der Bahnhof ist links.", ["Der Bahnhof ist links"])],
 "uu-l3": [IX("wo_hotel"), t2n("Das ist nicht weit.", "Không xa đâu.", ["Xa lắm.", "Ở ngay đây.", "Tôi không biết."]), wb("Chỉ năm phút từ đây.", "Nur fünf Minuten von hier.", ["zehn", "nach", "Stunden"]), fill("Das Hotel ist in der Bahnhof___.", "straße", ["stadt", "haus", "zimmer"], "Khách sạn ở phố Bahnhofstraße."), typ("Khách sạn có xa không?", "Ist das Hotel weit?", ["Ist das Hotel weit"])],
 "uv-l0": [t2n("Wann treffen wir uns?", "Khi nào chúng ta gặp nhau?", ["Chúng ta gặp nhau ở đâu?", "Chúng ta là ai?", "Chúng ta đi đâu?"]), wb("Chúng ta gặp nhau lúc tám giờ.", "Wir treffen uns um acht.", ["am", "treffe", "zehn"]), t2n("Hast du am Samstag Zeit?", "Thứ Bảy bạn có rảnh không?", ["Thứ Bảy bạn làm gì?", "Thứ Bảy là ngày mấy?", "Bạn có tiền không?"]), fill("Hast du am Samstag ___?", "Zeit", ["Geld", "Hunger", "Arbeit"], "Thứ Bảy bạn có rảnh không?"), typ("Khi nào chúng ta gặp nhau?", "Wann treffen wir uns?", ["Wann treffen wir uns"])],
 "uv-l1": [wb("Vâng, tôi rảnh.", "Ja ich habe Zeit.", ["nein", "hast", "Geld"]), IX("plaene"), t2n("Bis Samstag!", "Hẹn thứ Bảy nhé!", ["Hẹn tối nay nhé!", "Thứ Bảy vui vẻ!", "Hôm nay là thứ Bảy."]), fill("Wir ___ uns am Samstag.", "treffen", ["trifft", "treffe", "triffst"], "Chúng ta gặp nhau vào thứ Bảy."), typ("Hẹn thứ Bảy nhé!", "Bis Samstag!", ["Bis Samstag"])],
 "uv-l2": [t2n("Ich möchte einen Termin.", "Tôi muốn đặt một cuộc hẹn.", ["Tôi có một cuộc hẹn.", "Tôi không có thời gian.", "Tôi bị ốm."]), wb("Tôi muốn đặt một cuộc hẹn.", "Ich möchte einen Termin.", ["Zeit", "habe", "eine"]), t2n("Geht es am Montag?", "Thứ Hai được không?", ["Thứ Hai là ngày mấy?", "Bạn đi thứ Hai à?", "Thứ Hai bạn ở đâu?"]), fill("Ich möchte einen ___.", "Termin", ["Zeit", "Arzt", "Tag"], "Tôi muốn đặt một cuộc hẹn."), typ("Thứ Hai lúc mười giờ được không?", "Geht es am Montag um zehn?", ["Geht es am Montag um zehn Uhr?"])],
 "uv-l3": [IX("krankmeldung"), t2n("Ich bin krank.", "Tôi bị ốm.", ["Tôi khoẻ.", "Tôi bận.", "Tôi đến muộn."]), wb("Hôm nay tôi không đến.", "Heute komme ich nicht.", ["kommt", "morgen", "bin"]), fill("Ich bin heute ___.", "krank", ["groß", "neu", "gern"], "Hôm nay tôi bị ốm."), typ("Chúc mau khỏi bệnh!", "Gute Besserung!", ["Gute Besserung"])],
}
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
print(len(scen), "scenarios", len(clips), "clips", len(recs), "lessons", sum(len(r["exercises"]) for r in recs), dict(Counter(e["type"] for r in recs for e in r["exercises"])))

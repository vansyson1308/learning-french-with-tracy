"""de-vi Goethe-Zertifikat A1: Start Deutsch 1 practice track (format per content/de/exam/FORMAT-SOURCES.md).
Original items only. Appends exam stimuli to listening / readings / speech / writing / scenarios OUTPUT
(run after de-assessment.py) and writes exam/OUTPUT.jsonl (one track record)."""
import json, os

ROOT = r"C:\src\lft\content\de"
D = os.path.join(ROOT, "_drafts")
LEX = json.load(open(os.path.join(ROOT, "lexicon", "lexemes.json"), encoding="utf-8"))["lexemes"]
SURF = {l["surface"]: l["id"] for l in LEX}
def lx(*surfaces): return [SURF[s] for s in surfaces if s in SURF]
def O(k): return f"de.obj.{k}"
TRACK = "goethe_a1"

clips, readings, speech, tasks, scenarios, items = [], [], [], [], [], []
pos = [0]
def place(correct, wrong):
    p = pos[0] % (len(wrong) + 1); pos[0] += 1
    o = list(wrong); o.insert(p, correct)
    return o, p
RF = [{"text": "Đúng (richtig)"}, {"text": "Sai (falsch)"}]
AB = [{"text": "a"}, {"text": "b"}]

def item(form, sec, task, n, exercise, obj):
    slug = f"{form}_{sec}{task}_{n:02d}"
    ex = dict(exercise); ex["id"] = f"de-exx-{TRACK}-{slug}"
    items.append({"id": f"de.exi.{TRACK}.{slug}", "itemVersion": 1, "sectionId": SEC[sec], "taskId": f"t{task}", "exercise": ex, "objectiveTargets": [obj]})
SEC = {"h": "listening", "l": "reading", "s": "writing", "p": "speaking"}

def clip(cid, kind, segs, obj, plays, lex=(), units=2):
    clips.append({"id": cid, "kind": kind, "segments": [{"speaker": s, "text": t} for s, t in segs], "objectiveRefs": [obj], "lexemeRefs": lx(*lex),
                  "sourceRef": "original-project", "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"},
                  "scoredPlaybackPolicy": {"maxPlays": plays, "rate": 1}, "use": "exam"})
    return cid
def reading(rid, kind, paras, obj, lex=(), gloss=(), title=None, units=3):
    r = {"id": rid, "kind": kind}
    if title: r["title"] = title
    r.update({"blocks": [{"kind": "paragraph", "text": p} for p in paras], "objectiveRefs": [obj], "lexemeRefs": lx(*lex),
              "supportGlossary": [{"surface": a, "gloss": {"vi": b, "en": b}} for a, b in gloss], "sourceRef": "original-project",
              "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"}, "use": "exam"})
    readings.append(r)
    return rid

LD, LA, LI = O("listening.short_dialogues"), O("listening.announcements"), O("listening.short_info")
RM, RN = O("reading.short_messages"), O("reading.notices_info")

# ---------------- HÖREN ----------------
# Teil 1: short conversations, a/b/c, heard twice.
H1 = {
 "a": [
  ([("A", "Entschuldigung, wann fährt der Bus nach Hamburg?"), ("B", "Um Viertel nach zehn. Also um 10 Uhr 15.")], "Xe buýt đi Hamburg chạy lúc mấy giờ?", "10:15", ["10:45", "9:15"], ["der Bus"]),
  ([("A", "Was möchtest du trinken? Kaffee?"), ("B", "Nein, keinen Kaffee. Ich nehme einen Tee mit Milch.")], "Người phụ nữ uống gì?", "Trà với sữa", ["Cà phê", "Sữa"], ["der Kaffee", "der Tee", "die Milch"]),
  ([("A", "Wo ist hier die Toilette, bitte?"), ("B", "Im ersten Stock, neben dem Aufzug.")], "Nhà vệ sinh ở đâu?", "Ở tầng một, cạnh thang máy", ["Ở tầng trệt", "Ở tầng hai, cạnh cầu thang"], []),
  ([("A", "Wie viel kosten die Tomaten?"), ("B", "Ein Kilo kostet zwei Euro fünfzig.")], "Một ký cà chua giá bao nhiêu?", "2,50 €", ["2,15 €", "5,20 €"], []),
  ([("A", "Kommst du am Montag zum Deutschkurs?"), ("B", "Am Montag nicht, da arbeite ich. Aber am Mittwoch komme ich.")], "Người đàn ông đến lớp vào ngày nào?", "Thứ Tư", ["Thứ Hai", "Thứ Ba"], ["der Montag"]),
  ([("A", "Wie ist deine Telefonnummer?"), ("B", "Null, eins, sieben, sechs — vier, drei, acht, neun.")], "Số điện thoại là số nào?", "0176 4389", ["0167 4389", "0176 4398"], []),
 ],
 "b": [
  ([("A", "Wann beginnt der Film?"), ("B", "Um halb acht. Wir treffen uns um sieben vor dem Kino.")], "Bộ phim bắt đầu lúc mấy giờ?", "7:30", ["7:00", "8:30"], ["der Film"]),
  ([("A", "Was kaufen wir für das Frühstück?"), ("B", "Brot und Käse. Eier haben wir noch.")], "Họ mua gì?", "Bánh mì và phô mai", ["Trứng và bánh mì", "Phô mai và trứng"], ["das Brot", "der Käse", "das Ei", "das Frühstück"]),
  ([("A", "Wo wohnt deine Schwester jetzt?"), ("B", "In Wien. Früher hat sie in Berlin gewohnt.")], "Bây giờ chị gái sống ở đâu?", "Ở Wien", ["Ở Berlin", "Ở München"], ["die Schwester", "wohnen"]),
  ([("A", "Entschuldigung, ist das Gleis vier?"), ("B", "Nein, das ist Gleis zwei. Gleis vier ist da drüben.")], "Họ đang đứng ở đường ray số mấy?", "Số hai", ["Số bốn", "Số mười bốn"], []),
  ([("A", "Wie fährst du zur Arbeit? Mit dem Auto?"), ("B", "Nein, mit dem Fahrrad. Das ist gesund und billig.")], "Người phụ nữ đi làm bằng gì?", "Bằng xe đạp", ["Bằng xe hơi", "Bằng xe buýt"], ["das Fahrrad", "das Auto", "die Arbeit"]),
  ([("A", "Wie viel kostet das Zimmer pro Nacht?"), ("B", "Siebzig Euro, mit Frühstück.")], "Một đêm phòng giá bao nhiêu?", "70 €", ["17 €", "60 €"], ["das Zimmer", "das Frühstück"]),
 ],
}
# Teil 2: announcements, richtig/falsch, heard ONCE.
H2 = {
 "a": [
  ("Achtung am Gleis fünf: Der ICE nach München hat heute zwanzig Minuten Verspätung.", "Tàu ICE đi München hôm nay đến muộn hai mươi phút.", True, ["die Minute"]),
  ("Liebe Kunden, heute sind alle Schuhe im zweiten Stock zwanzig Prozent billiger.", "Hôm nay giày ở tầng một rẻ hơn.", False, []),
  ("Die Linie drei fährt heute nicht. Bitte nehmen Sie den Bus Nummer zwölf.", "Hôm nay hành khách phải đi xe buýt số mười hai.", True, ["der Bus"]),
  ("Liebe Gäste, unser Restaurant schließt heute schon um einundzwanzig Uhr.", "Nhà hàng hôm nay đóng cửa lúc hai mươi ba giờ.", False, ["schließen"]),
 ],
 "b": [
  ("Information für die Fahrgäste nach Köln: Ihr Zug fährt heute von Gleis acht.", "Tàu đi Köln hôm nay chạy từ đường ray số tám.", True, ["der Zug"]),
  ("Liebe Kunden, unser Supermarkt ist am Sonntag geschlossen.", "Siêu thị mở cửa vào Chủ nhật.", False, ["der Sonntag"]),
  ("Der Deutschkurs beginnt heute nicht in Raum zehn, sondern in Raum vierzehn.", "Hôm nay lớp tiếng Đức học ở phòng mười bốn.", True, []),
  ("Achtung: Das Flugzeug nach Hanoi fliegt heute um sechzehn Uhr dreißig.", "Máy bay đi Hà Nội cất cánh lúc mười sáu giờ.", False, []),
 ],
}
# Teil 3: phone / radio messages, a/b/c, heard twice.
H3 = {
 "a": [
  ("Hallo Anna, hier ist Paul. Wir treffen uns morgen nicht um drei, sondern um vier Uhr im Café. Bis morgen!", "Paul và Anna gặp nhau lúc mấy giờ?", "Lúc bốn giờ", ["Lúc ba giờ", "Lúc hai giờ"], ["treffen"]),
  ("Guten Tag, hier ist die Praxis Dr. Weber. Ihr Termin ist am Donnerstag um neun Uhr. Bitte bringen Sie Ihre Karte mit.", "Lịch hẹn ở phòng khám vào ngày nào?", "Thứ Năm", ["Thứ Ba", "Thứ Sáu"], ["der Termin", "die Karte"]),
  ("Hallo Mama, ich komme heute später nach Hause. Ich muss noch einkaufen. Ich bin um sieben da.", "Vì sao người con về muộn?", "Phải đi mua đồ", ["Phải làm thêm", "Phải đi bác sĩ"], ["müssen"]),
  ("Und jetzt das Wetter für morgen: Am Vormittag regnet es, am Nachmittag scheint die Sonne.", "Chiều mai thời tiết thế nào?", "Nắng", ["Mưa", "Có tuyết"], []),
  ("Hallo, hier ist Lisa. Ich habe am Samstag Geburtstag und mache eine Party. Kannst du Musik mitbringen?", "Lisa nhờ mang gì đến?", "Nhạc", ["Bánh", "Đồ uống"], ["der Geburtstag", "die Musik", "der Samstag"]),
 ],
 "b": [
  ("Hallo Tom, hier ist Sara. Ich bin krank und kann heute nicht zum Kurs kommen. Kannst du mir die Hausaufgaben schicken?", "Sara nhờ Tom việc gì?", "Gửi bài tập về nhà", ["Đến thăm cô ấy", "Gọi điện cho thầy giáo"], []),
  ("Guten Tag, hier ist das Autohaus Becker. Ihr Auto ist fertig. Sie können es heute bis achtzehn Uhr abholen.", "Có thể lấy xe đến mấy giờ?", "Đến 18 giờ", ["Đến 8 giờ", "Đến 16 giờ"], ["das Auto"]),
  ("Hallo Jonas, ich stehe am Bahnhof, aber der Zug kommt erst um halb neun. Bitte warte nicht auf mich.", "Tàu đến lúc mấy giờ?", "8:30", ["9:30", "8:00"], ["der Bahnhof", "der Zug", "warten"]),
  ("Hier ist die Stadtbibliothek. Ab Montag haben wir neue Öffnungszeiten: von zehn bis neunzehn Uhr.", "Từ thứ Hai thư viện mở cửa giờ nào?", "Từ 10 đến 19 giờ", ["Từ 9 đến 18 giờ", "Từ 10 đến 17 giờ"], ["der Montag"]),
  ("Hallo Frau Nguyen, hier ist Herr Klein vom Hotel Sonne. Ihr Zimmer ist frei. Sie können schon um zwölf Uhr kommen.", "Bà Nguyen có thể đến khách sạn từ mấy giờ?", "Từ 12 giờ", ["Từ 2 giờ", "Từ 14 giờ"], ["das Zimmer", "das Hotel"]),
 ],
}
for form in "ab":
    for n, (segs, q, ok, wrong, lex) in enumerate(H1[form], 1):
        cid = clip(f"de.clip.goethe_{form}_h1_{n:02d}", "dialogue", segs, LD, 2, lex)
        o, p = place(ok, wrong)
        item(form, "h", 1, n, {"type": "listeningComprehension", "clipId": cid, "question": q, "options": [{"text": t} for t in o], "correct": p}, LD)
    for n, (text, stmt, true, lex) in enumerate(H2[form], 1):
        cid = clip(f"de.clip.goethe_{form}_h2_{n:02d}", "announcement", [("A", text)], LA, 2, lex)
        item(form, "h", 2, n, {"type": "listeningComprehension", "clipId": cid, "question": stmt, "options": RF, "correct": 0 if true else 1}, LA)
    for n, (text, q, ok, wrong, lex) in enumerate(H3[form], 1):
        cid = clip(f"de.clip.goethe_{form}_h3_{n:02d}", "message", [("A", text)], LI, 2, lex)
        o, p = place(ok, wrong)
        item(form, "h", 3, n, {"type": "listeningComprehension", "clipId": cid, "question": q, "options": [{"text": t} for t in o], "correct": p}, LI)

# ---------------- LESEN ----------------
# Teil 1: two short letters / e-mails, 5 richtig/falsch statements.
L1 = {
 "a": [
  ("mail_julia", ["Liebe Mai,", "ich bin jetzt in Leipzig und wohne bei meiner Tante. Die Wohnung ist klein, aber schön. Am Montag beginnt mein Deutschkurs. Er ist jeden Tag von neun bis zwölf Uhr. Am Wochenende besuche ich dich in Dresden!", "Viele Grüße, Julia"],
   [("Julia sống ở nhà dì của cô ấy.", True), ("Lớp tiếng Đức bắt đầu vào thứ Hai.", True), ("Lớp học vào buổi chiều.", False)], ["die Tante", "die Wohnung", "der Montag", "das Wochenende"]),
  ("mail_chef", ["Hallo Herr Schmidt,", "leider bin ich heute krank und kann nicht zur Arbeit kommen. Ich gehe um zehn Uhr zum Arzt. Morgen bin ich wieder im Büro.", "Mit freundlichen Grüßen", "Minh Tran"],
   [("Hôm nay Minh đi làm muộn.", False), ("Ngày mai Minh quay lại văn phòng.", True)], ["die Arbeit"]),
 ],
 "b": [
  ("mail_tom", ["Hallo Lena,", "danke für deine Nachricht! Ich komme am Freitag mit dem Zug nach Köln. Der Zug kommt um 17 Uhr 40 an. Kannst du mich am Bahnhof abholen? Am Samstag möchte ich gern ins Museum gehen.", "Bis Freitag, Tom"],
   [("Tom đến Köln bằng tàu.", True), ("Tom muốn Lena đón anh ở sân bay.", False), ("Thứ Bảy Tom muốn đi bảo tàng.", True)], ["die Nachricht", "der Freitag", "der Zug", "der Bahnhof", "das Museum", "der Samstag"]),
  ("mail_kurs", ["Liebe Kursteilnehmer,", "der Deutschkurs am Dienstag ist nicht in Raum 3, sondern in Raum 12. Bitte bringen Sie Ihr Buch mit. Der Kurs beginnt wie immer um 18 Uhr.", "Ihre Kursleiterin, Frau Wolf"],
   [("Thứ Ba lớp học ở phòng 3.", False), ("Lớp học bắt đầu lúc 18 giờ như mọi khi.", True)], []),
 ],
}
# Teil 2: two short ads / web pages each, "Wo finden Sie Informationen?", a or b.
L2 = {
 "a": [
  ("Bạn muốn học bơi vào cuối tuần. Bạn tìm thông tin ở đâu?", ["a) Schwimmbad am Park — Schwimmkurse für Erwachsene: Samstag und Sonntag, 10 Uhr.", "b) Sportgeschäft Lauf — Schwimmhosen und Badetücher jetzt billiger!"], 0),
  ("Bạn cần một phòng khách sạn rẻ ở Berlin. Bạn xem ở đâu?", ["a) Hotel Adler, Berlin-Mitte — Zimmer ab 120 Euro pro Nacht, mit Restaurant und Spa.", "b) Hostel Berlin — Zimmer ab 25 Euro pro Nacht, Küche für alle Gäste."], 1),
  ("Bạn muốn mua một chiếc xe đạp cũ. Bạn xem ở đâu?", ["a) Fahrradmarkt jeden Samstag: gebrauchte Fahrräder ab 50 Euro.", "b) Fahrradwerkstatt Müller: Wir reparieren Ihr Fahrrad schnell."], 0),
  ("Tối thứ Sáu bạn muốn đi ăn món Ý. Bạn xem ở đâu?", ["a) Restaurant Roma — italienische Küche, Montag bis Samstag 12–23 Uhr.", "b) Café Sonne — Frühstück und Kuchen, täglich 8–14 Uhr."], 0),
  ("Bạn muốn học tiếng Đức vào buổi tối. Bạn tìm thông tin ở đâu?", ["a) Sprachschule Lingua — Deutschkurse am Vormittag, 9–12 Uhr.", "b) Volkshochschule — Deutsch A1 am Abend, Montag und Mittwoch 18–20 Uhr."], 1),
 ],
 "b": [
  ("Bạn muốn thuê một căn hộ nhỏ gần trung tâm. Bạn xem ở đâu?", ["a) Wohnung in der Altstadt: 2 Zimmer, Küche, Bad, 650 Euro.", "b) Haus mit Garten am Stadtrand: 5 Zimmer, 1.800 Euro."], 0),
  ("Con bạn muốn chơi bóng đá. Bạn tìm thông tin ở đâu?", ["a) Fußballverein FC Nord — Training für Kinder: Dienstag und Donnerstag, 16 Uhr.", "b) Sportbar Tor — alle Fußballspiele live im Fernsehen."], 0),
  ("Bạn cần đi bác sĩ vào thứ Bảy. Bạn xem ở đâu?", ["a) Praxis Dr. Lang — Montag bis Freitag 8–18 Uhr.", "b) Ärztlicher Notdienst — Samstag und Sonntag 9–21 Uhr, Telefon 116 117."], 1),
  ("Bạn muốn mua bánh mì sáng Chủ nhật. Bạn xem ở đâu?", ["a) Bäckerei Korn — sonntags 7–11 Uhr geöffnet.", "b) Supermarkt Frisch — Montag bis Samstag 7–21 Uhr."], 0),
  ("Bạn muốn đi xem hoà nhạc ở thành phố. Bạn tìm thông tin ở đâu?", ["a) Kino Stern — neue Filme jeden Donnerstag.", "b) Stadthalle — Konzert am Freitag, 20 Uhr, Karten ab 15 Euro."], 1),
 ],
}
# Teil 3: signs and notices, richtig/falsch.
L3 = {
 "a": [
  (["Arztpraxis Dr. Hoffmann", "Heute geschlossen! Bitte gehen Sie zu Dr. Braun, Bahnhofstraße 4."], "Hôm nay bạn có thể khám ở phòng khám bác sĩ Hoffmann.", False),
  (["Bibliothek", "Bitte leise sein! Telefonieren nur im Eingang."], "Bạn được gọi điện ở lối vào.", True),
  (["Schwimmbad", "Kinder unter 6 Jahren nur mit Eltern."], "Trẻ em năm tuổi được đi bơi một mình.", False),
  (["Bäckerei Schmidt", "Wir suchen eine Verkäuferin oder einen Verkäufer. Fragen Sie im Geschäft!"], "Tiệm bánh đang tìm người bán hàng.", True),
  (["Parkplatz", "Nur für Gäste des Hotels. Andere Autos kosten 20 Euro."], "Mọi người đều được đỗ xe miễn phí.", False),
 ],
 "b": [
  (["Supermarkt", "Neue Öffnungszeiten: Montag bis Samstag 7–22 Uhr."], "Siêu thị mở cửa đến 22 giờ.", True),
  (["Achtung!", "Der Aufzug ist kaputt. Bitte nehmen Sie die Treppe."], "Hôm nay bạn có thể đi thang máy.", False),
  (["Museum", "Eintritt frei für Schüler und Studenten."], "Sinh viên vào cửa không mất tiền.", True),
  (["Sprachschule", "Der Kurs Deutsch A1 beginnt am 3. März. Anmeldung im Büro."], "Bạn đăng ký khoá học ở văn phòng.", True),
  (["Restaurant Linde", "Montag Ruhetag."], "Nhà hàng mở cửa vào thứ Hai.", False),
 ],
}
for form in "ab":
    n = 0
    for slug, paras, stmts, lex in L1[form]:
        rid = reading(f"de.read.goethe_{form}_{slug}", "message", paras, RM, lex)
        for stmt, true in stmts:
            n += 1
            item(form, "l", 1, n, {"type": "readingComprehension", "readingId": rid, "question": stmt, "options": RF, "correct": 0 if true else 1}, RM)
    for n, (q, ads, key) in enumerate(L2[form], 1):
        rid = reading(f"de.read.goethe_{form}_l2_{n:02d}", "info", ads, RN, units=2)
        item(form, "l", 2, n, {"type": "readingComprehension", "readingId": rid, "question": q, "options": AB, "correct": key}, RN)
    for n, (paras, stmt, true) in enumerate(L3[form], 1):
        rid = reading(f"de.read.goethe_{form}_l3_{n:02d}", "notice", paras, RN, units=2)
        item(form, "l", 3, n, {"type": "readingComprehension", "readingId": rid, "question": stmt, "options": RF, "correct": 0 if true else 1}, RN)

# ---------------- SCHREIBEN ----------------
def write(form, task, tid, fam, instr, cue, slots, mn, mx, model, obj, lex=(), fields=None):
    rubric = {"requiredSlots": [{"id": i, "description": {"vi": d, "en": d}, "variants": v, "cueProvided": c} for i, d, v, c in slots], "minTokens": mn, "maxTokens": mx}
    t = {"id": tid, "taskFamily": fam, "mode": "guided", "instruction": {"vi": instr, "en": instr}}
    if cue: t["cueFacts"] = [{"label": {"vi": a, "en": a}, "value": b} for a, b in cue]
    if fields: t["formFields"] = [{"id": a, "label": b, "slotId": c} for a, b, c in fields]
    t.update({"rubric": rubric, "modelAnswers": [model], "objectiveRefs": [obj], "lexemeRefs": lx(*lex), "scoredEligibility": True, "reserved": True, "sourceRef": "original-project"})
    tasks.append(t)
    flat = {**rubric, "requiredSlots": [{**s, "description": s["description"]["vi"]} for s in rubric["requiredSlots"]]}
    e = {"type": "simpleForm" if fields else "guidedWriting", "writingTaskId": tid}
    if not fields: e["writingMode"] = "guided"
    e["instruction"] = instr
    if cue: e["cueFacts"] = [{"label": a, "value": b} for a, b in cue]
    if fields: e["fields"] = [{"id": a, "label": b, "slotId": c} for a, b, c in fields]
    e.update({"rubric": flat, "modelAnswers": [model]})
    item(form, "s", task, 1, e, obj)
WF, WM = O("writing.form_filling"), O("writing.short_message")
GREET = ["hallo", "hi", "liebe", "lieber", "guten tag", "sehr geehrte"]
CLOSE = ["viele grüße", "liebe grüße", "bis bald", "tschüss", "mit freundlichen grüßen", "bis dann"]
write("a", 1, "de.write.goethe_a_formular", "simple_form",
      "Teil 1 — Bạn của bạn là Mai Tran muốn đăng ký một khoá học bơi. Cô ấy đến từ Việt Nam, sống ở Leipzig, Goethestraße 7, và muốn học vào thứ Bảy. Hãy điền phiếu cho cô ấy (năm chỗ trống).",
      [("Tên", "Mai"), ("Họ", "Tran"), ("Đến từ", "Vietnam"), ("Địa chỉ", "Goethestraße 7, Leipzig"), ("Ngày học", "Samstag")],
      [("first", "tên", ["mai"], True), ("last", "họ của cô ấy", ["tran"], True), ("country", "quê của cô ấy", ["vietnam"], True),
       ("street", "địa chỉ", ["goethestraße 7", "goethestrasse 7"], True), ("day", "ngày học", ["samstag"], True)], 5, 15,
      "Mai | Tran | Vietnam | Goethestraße 7 | Samstag", WF, [], [("vorname", "Vorname", "first"), ("nachname", "Familienname", "last"), ("land", "Herkunftsland", "country"), ("adresse", "Straße, Hausnummer", "street"), ("kurstag", "Kurstag", "day")])
write("b", 1, "de.write.goethe_b_formular", "simple_form",
      "Teil 1 — Bạn của bạn là Tuấn Le muốn thuê một chiếc xe đạp trong ba ngày. Anh ấy 24 tuổi, ở khách sạn Hotel Sonne và có số điện thoại 0151 223344. Hãy điền phiếu cho anh ấy (năm chỗ trống).",
      [("Tên", "Tuấn"), ("Họ", "Le"), ("Tuổi", "24"), ("Khách sạn", "Hotel Sonne"), ("Điện thoại", "0151 223344")],
      [("first", "tên", ["tuấn"], True), ("last", "họ của anh ấy", ["le"], True), ("age", "tuổi", ["24", "vierundzwanzig"], True),
       ("hotel", "khách sạn", ["hotel sonne", "sonne"], True), ("phone", "số điện thoại", ["0151 223344", "0151223344"], True)], 5, 15,
      "Tuấn | Le | 24 | Hotel Sonne | 0151 223344", WF, ["das Hotel"], [("vorname", "Vorname", "first"), ("nachname", "Familienname", "last"), ("alter", "Alter", "age"), ("hotel", "Hotel", "hotel"), ("telefon", "Telefon", "phone")])
write("a", 2, "de.write.goethe_a_nachricht", "short_message",
      "Teil 2 — Bạn có sinh nhật vào thứ Bảy. Hãy viết cho bạn của bạn là Paul (khoảng 30 từ): mời anh ấy đến dự tiệc, nói giờ bắt đầu, và nhờ anh ấy mang đồ uống. Có lời chào và lời chào kết.",
      [("Gửi", "Paul"), ("Khi nào", "Samstag, 19 Uhr"), ("Nhờ mang", "Getränke")],
      [("greeting", "lời chào", GREET, False), ("invite", "lời mời dự tiệc", ["kommst du", "komm doch", "lade dich ein", "möchtest du kommen"], False), ("time", "giờ bắt đầu", ["um 19 uhr", "um sieben", "um 7", "um neunzehn uhr"], True),
       ("bring", "nhờ mang đồ uống", ["getränke", "trinken", "saft", "wasser", "cola"], True), ("closing", "lời chào kết", CLOSE, False)], 20, 45,
      "Lieber Paul, am Samstag habe ich Geburtstag und ich mache eine Party. Kommst du auch? Die Party beginnt um 19 Uhr. Kannst du bitte Getränke mitbringen? Viele Grüße, Lan", WM, ["der Geburtstag", "der Samstag"])
write("b", 2, "de.write.goethe_b_nachricht", "short_message",
      "Teil 2 — Bạn không thể đến lớp tiếng Đức ngày mai. Hãy viết cho cô giáo, bà Wolf (khoảng 30 từ): nói rằng bạn không đến được, giải thích lý do, và hỏi về bài tập về nhà. Có lời chào và lời chào kết.",
      [("Gửi", "Frau Wolf"), ("Lý do", "krank"), ("Hỏi", "Hausaufgaben")],
      [("greeting", "lời chào", ["liebe frau wolf", "sehr geehrte frau wolf", "guten tag", "hallo"], False), ("absent", "bạn không đến được", ["nicht zum kurs kommen", "nicht kommen", "komme nicht", "kann leider nicht"], False),
       ("reason", "lý do", ["krank"], True), ("homework", "bài tập về nhà", ["hausaufgaben", "hausaufgabe"], True), ("closing", "lời chào kết", CLOSE, False)], 20, 45,
      "Liebe Frau Wolf, morgen kann ich leider nicht zum Kurs kommen. Ich bin krank und muss zum Arzt. Was sind die Hausaufgaben? Können Sie mir bitte schreiben? Viele Grüße, Minh", WM)

# ---------------- SPRECHEN ----------------
SI = O("speaking.self_intro")
def speak(form, sid, instr, cue, target, variants, concepts):
    it = {"id": sid, "taskFamily": "self_introduction", "elicitationType": "information_prompt",
          "prompt": {"instruction": {"vi": instr, "en": instr}, "cueFacts": [{"label": {"vi": a, "en": a}, "value": b} for a, b in cue]},
          "target": target, "acceptedVariants": variants, "requiredConcepts": concepts, "objectiveRefs": [SI], "lexemeRefs": [], "evidenceLexemeRefs": [],
          "assistancePolicy": {"allowContextualBias": False, "revealTargetAfterAttempts": None}, "scoredEligibility": True, "modelAudioRef": None,
          "recognitionLocale": "de-DE", "allowedAttempts": 2, "reserved": True, "sourceRef": "original-project"}
    speech.append(it)
    item(form, "p", 1, 1, {"type": "speakProduction", "speechItemId": sid, "instruction": instr, "cueFacts": [{"label": a, "value": b} for a, b in cue],
                           "target": target, "acceptedVariants": variants, "requiredConcepts": concepts, "evidenceLexemeRefs": [], "revealTargetAfterAttempts": None,
                           "allowContextualBias": False, "modelClipId": None, "allowedAttempts": 2}, SI)
speak("a", "de.speak.goethe_a_vorstellung", "Teil 1 — Hãy tự giới thiệu theo các từ khoá: tên, tuổi, quê và nơi bạn sống.",
      [("Name", "Lan"), ("Alter", "28"), ("Land", "Vietnam"), ("Wohnort", "Leipzig")],
      "Ich heiße Lan, ich bin achtundzwanzig Jahre alt, ich komme aus Vietnam und ich wohne in Leipzig",
      ["Ich heiße Lan, ich bin achtundzwanzig Jahre alt, ich komme aus Vietnam und ich wohne in Leipzig", "Mein Name ist Lan, ich bin achtundzwanzig, ich komme aus Vietnam und wohne in Leipzig"],
      [["lan"], ["achtundzwanzig", "28"], ["vietnam"], ["leipzig"]])
speak("b", "de.speak.goethe_b_vorstellung", "Teil 1 — Hãy tự giới thiệu theo các từ khoá: tên, quê, ngôn ngữ và nghề nghiệp.",
      [("Name", "Minh"), ("Land", "Vietnam"), ("Sprachen", "Vietnamesisch, Deutsch"), ("Beruf", "Koch")],
      "Ich heiße Minh, ich komme aus Vietnam, ich spreche Vietnamesisch und Deutsch und ich bin Koch",
      ["Ich heiße Minh, ich komme aus Vietnam, ich spreche Vietnamesisch und Deutsch und ich bin Koch", "Mein Name ist Minh, ich komme aus Vietnam, ich spreche Vietnamesisch und Deutsch, ich bin Koch von Beruf"],
      [["minh"], ["vietnam"], ["vietnamesisch"], ["deutsch"], ["koch"]])

def scenario(form, task, sid, fam, obj, title, goal, steps, end, miss):
    base = f"de.clip.ix_{sid}"
    nodes = {}
    def pclip(cid, text):
        clips.append({"id": cid, "kind": "message", "segments": [{"speaker": "A", "text": text}], "objectiveRefs": [obj], "lexemeRefs": [], "sourceRef": "original-project",
                      "authoringSpec": {"informationUnits": 1, "inferenceDemand": "locate"}, "scoredPlaybackPolicy": {"maxPlays": 2, "rate": 1}})
    pclip(f"{base}_miss", miss)
    nodes["t_miss"] = {"kind": "terminal", "id": "t_miss", "outcome": "goal_not_met", "text": miss, "clipId": f"{base}_miss"}
    for i, (p, rp, prompt, intent, variants, concepts) in enumerate(steps):
        nxt = f"p{i+1}" if i + 1 < len(steps) else "t_ok"
        pclip(f"{base}_{i}", p); pclip(f"{base}_{i}_s", rp)
        nodes[f"p{i}"] = {"kind": "partner", "id": f"p{i}", "text": p, "clipId": f"{base}_{i}", "rephraseText": rp, "rephraseClipId": f"{base}_{i}_s", "next": f"l{i}"}
        exp = [{"intent": intent, "acceptedVariants": variants, "requiredConcepts": concepts, "next": nxt}]
        nodes[f"l{i}"] = {"kind": "learner", "id": f"l{i}", "prompt": {"vi": prompt, "en": prompt}, "expected": exp, "noMatchNext": f"r{i}", "scored": True}
        nodes[f"r{i}"] = {"kind": "partner", "id": f"r{i}", "text": rp, "clipId": f"{base}_{i}_s", "next": f"l{i}b"}
        nodes[f"l{i}b"] = {"kind": "learner", "id": f"l{i}b", "prompt": {"vi": prompt, "en": prompt}, "expected": exp, "noMatchNext": "t_miss", "scored": False}
    pclip(f"{base}_end", end)
    nodes["t_ok"] = {"kind": "terminal", "id": "t_ok", "outcome": "goal_met", "text": end, "clipId": f"{base}_end"}
    scenarios.append({"id": f"de.scenario.{sid}", "title": {"vi": title, "en": title}, "goal": {"vi": goal, "en": goal}, "taskFamily": fam, "objectiveRefs": [obj],
                      "startNodeId": "p0", "nodes": nodes, "support": {"allowRepeat": True, "allowRephrase": True}, "reserved": True, "sourceRef": "original-project"})
    item(form, "p", task, 1, {"type": "interactionScenario", "scenarioId": f"de.scenario.{sid}"}, obj)
CONV, PRAC = O("interaction.everyday_conversation"), O("interaction.practical_needs")
scenario("a", 2, "goethe_a_thema", "information_exchange", CONV, "Teil 2 — Chủ đề: Đồ ăn và đồ uống", "Trả lời câu hỏi của bạn thi về chủ đề ăn uống, rồi tự hỏi lại một câu (thẻ từ: Frühstück, Lieblingsessen).",
 [("Thema Essen und Trinken. Meine Karte: Frühstück. Was essen Sie zum Frühstück?", "Was frühstücken Sie?", "Hãy trả lời: bữa sáng bạn ăn bánh mì và uống cà phê.", "answer", ["Ich esse Brot und trinke Kaffee.", "Zum Frühstück esse ich Brot und trinke Kaffee.", "Brot und Kaffee."], [["brot"], ["kaffee"]]),
  ("Danke. Und jetzt Sie! Ihre Karte: Lieblingsessen.", "Bitte fragen Sie mich: Lieblingsessen.", "Hãy hỏi bạn thi món ăn yêu thích của người đó là gì.", "ask", ["Was ist Ihr Lieblingsessen?", "Was essen Sie gern?", "Was ist Ihr Lieblingsessen, bitte?"], [["lieblingsessen", "essen sie gern"]])],
 "Mein Lieblingsessen ist Pizza. Danke!", "Kein Problem. Danke schön!")
scenario("b", 2, "goethe_b_thema", "information_exchange", CONV, "Teil 2 — Chủ đề: Thời gian rảnh", "Trả lời câu hỏi của bạn thi về thời gian rảnh, rồi tự hỏi lại một câu (thẻ từ: Wochenende, Sport).",
 [("Thema Freizeit. Meine Karte: Wochenende. Was machen Sie am Wochenende?", "Was machen Sie am Samstag und Sonntag?", "Hãy trả lời: cuối tuần bạn đi thăm bạn bè.", "answer", ["Am Wochenende besuche ich Freunde.", "Ich besuche Freunde.", "Ich treffe Freunde."], [["freunde", "freund"]]),
  ("Danke. Und jetzt Sie! Ihre Karte: Sport.", "Bitte fragen Sie mich: Sport.", "Hãy hỏi bạn thi có chơi thể thao không.", "ask", ["Machen Sie Sport?", "Spielen Sie gern Fußball?", "Welchen Sport machen Sie?"], [["sport", "fußball", "spielen"]])],
 "Ja, ich spiele gern Tennis. Danke!", "Kein Problem. Danke schön!")
scenario("a", 3, "goethe_a_bitte", "transaction", PRAC, "Teil 3 — Nhờ và đáp lại", "Lịch sự nhờ một việc theo thẻ tranh, rồi đáp lại lời nhờ của bạn thi (thẻ: 🪟 cửa sổ, ✏️ bút).",
 [("Ihre Karte zeigt ein Fenster. Bitte, was möchten Sie?", "Sie haben die Karte mit dem Fenster.", "Hãy lịch sự nhờ mở cửa sổ.", "request", ["Können Sie bitte das Fenster öffnen?", "Öffnen Sie bitte das Fenster.", "Machen Sie bitte das Fenster auf."], [["fenster"], ["bitte"]]),
  ("Gern. Und ich habe eine Bitte: Können Sie mir bitte einen Stift geben?", "Haben Sie einen Stift für mich?", "Hãy đồng ý và đưa bút.", "react", ["Ja, gern. Hier, bitte.", "Hier ist der Stift.", "Ja, natürlich. Bitte schön."], [["ja", "hier", "bitte"]])],
 "Danke schön!", "Kein Problem. Danke!")
scenario("b", 3, "goethe_b_bitte", "transaction", PRAC, "Teil 3 — Nhờ và đáp lại", "Lịch sự nhờ một việc theo thẻ tranh, rồi đáp lại lời nhờ của bạn thi (thẻ: 💧 nước, 📱 điện thoại).",
 [("Ihre Karte zeigt ein Glas Wasser. Bitte, was möchten Sie?", "Sie haben die Karte mit dem Wasser.", "Hãy lịch sự xin một cốc nước.", "request", ["Ein Glas Wasser, bitte.", "Kann ich bitte ein Wasser haben?", "Ich möchte ein Glas Wasser, bitte."], [["wasser"], ["bitte"]]),
  ("Bitte schön. Und ich habe eine Bitte: Darf ich Ihr Telefon benutzen?", "Kann ich kurz Ihr Handy haben?", "Hãy đồng ý.", "react", ["Ja, gern.", "Ja, natürlich. Hier, bitte.", "Ja, bitte schön."], [["ja", "gern", "natürlich"]])],
 "Vielen Dank!", "Kein Problem. Danke!")

# ---------------- track ----------------
def T(vi, en=None): return {"vi": vi, "en": en or vi}
def task(tid, title, instr, fmt, n, **kw):
    t = {"id": tid, "title": T(title), "instruction": T(instr), "format": fmt, "itemsPerForm": n}
    t.update(kw)
    return t
DB = "https://www.goethe.de/pro/relaunch/prf/de/Durchfuehrungsbestimmungen_A1_Start_Deutsch_1.pdf"
MS = "https://www.goethe.de/pro/relaunch/prf/materialien/A1_sd1/sd_1_modellsatz.pdf"
track = {
 "id": f"de.exam.{TRACK}", "trackVersion": 1, "name": "Goethe-Zertifikat A1: Start Deutsch 1", "level": "A1",
 "title": {"vi": "Luyện thi Goethe A1 (Start Deutsch 1)", "en": "Goethe A1 practice (Start Deutsch 1)"},
 "description": {
  "vi": "Luyện theo định dạng công khai của Goethe-Zertifikat A1: Start Deutsch 1 (Goethe-Institut, quy chế thi bản 1/9/2025 và đề mẫu Modellsatz): Nghe, Đọc, Viết và Nói với số câu, thời gian và cách tính điểm của kỳ thi. Phần Nói trong kỳ thi thật là thi theo nhóm (tối đa bốn người, hai giám khảo); ứng dụng chỉ mô phỏng từng người một — ứng dụng đóng vai bạn thi và giám khảo, và không có phần đánh vần hay đọc lại số. Mọi câu hỏi do khoá học tự soạn — không phải đề thi thật.",
  "en": "Practise the public Goethe-Zertifikat A1: Start Deutsch 1 format (Goethe-Institut regulations of 1 Sept 2025 and the Modellsatz): listening, reading, writing and speaking with the exam's items, timing and scoring. The real speaking exam is a group exam (up to four candidates, two examiners); the app only simulates it one learner at a time — the app plays partner and examiner, and the spelling / number read-back is not included. Every question is original to this course — never a real exam item."},
 "formatSource": {
  "publisher": "Goethe-Institut e.V.",
  "references": [
   {"url": DB, "title": "Goethe-Institut — Durchführungsbestimmungen Goethe-Zertifikat A1: Start Deutsch 1 (Stand 1. September 2025)", "retrieved": "2026-10-28"},
   {"url": MS, "title": "Goethe-Institut — Modellsatz Start Deutsch 1 (Erwachsene)", "retrieved": "2026-10-28"},
   {"url": "https://www.goethe.de/de/spr/prf/ueb/pa1.html", "title": "Goethe-Institut — Goethe-Zertifikat A1: Start Deutsch 1, Übungsmaterialien"},
  ],
  "checkedAgainstOfficialGuide": True, "checkedBy": "coding agent (owner-delegated; owner supplied the Durchführungsbestimmungen PDF)", "checkedAt": "2026-10-28",
  "note": {"vi": "Định dạng theo quy chế thi (Durchführungsbestimmungen, bản 1/9/2025) và đề mẫu Modellsatz của Goethe-Institut, đã đọc trực tiếp ngày 2026-10-28. Mỗi phần 15 điểm thô được quy đổi ×1,66 (≈ 25 điểm); đạt khi tổng ≥ 60/100 và làm đủ mọi phần.",
           "en": "Format per the Goethe-Institut regulations (Durchführungsbestimmungen, 1 Sept 2025) and the Modellsatz, read directly on 2026-10-28. Each part's 15 raw points are converted ×1.66 (≈ 25 points); a pass needs ≥ 60/100 with every part taken."}},
 "sections": [
  {"id": "listening", "skill": "listening", "title": T("Hören — Nghe"), "minutes": 20, "maxPoints": 25, "playsPerRecording": 2, "tasks": [
    task("t1", "Teil 1 — Sáu hội thoại ngắn", "Nghe mỗi hội thoại hai lần và chọn a, b hoặc c.", "mcq3", 6),
    task("t2", "Teil 2 — Bốn thông báo", "Nghe mỗi thông báo và chọn đúng (richtig) hay sai (falsch). Trong kỳ thi thật phần này chỉ nghe MỘT lần; ứng dụng cho nghe tối đa hai lần như mọi bài nghe — hãy thử chỉ nghe một lần.", "mcq2", 4),
    task("t3", "Teil 3 — Năm tin nhắn qua điện thoại hoặc đài", "Nghe mỗi tin nhắn hai lần và chọn a, b hoặc c.", "mcq3", 5)]},
  {"id": "reading", "skill": "reading", "title": T("Lesen — Đọc"), "minutes": 25, "maxPoints": 25, "tasks": [
    task("t1", "Teil 1 — Hai lá thư hoặc email ngắn", "Đọc hai văn bản và chọn đúng (richtig) hay sai (falsch) cho mỗi câu.", "mcq2", 5),
    task("t2", "Teil 2 — Quảng cáo và trang web", "Bạn tìm thông tin ở đâu? Đọc hai quảng cáo và chọn a hoặc b.", "mcq2", 5),
    task("t3", "Teil 3 — Biển báo và thông báo", "Đọc biển báo và chọn đúng (richtig) hay sai (falsch).", "mcq2", 5)]},
  {"id": "writing", "skill": "writing", "title": T("Schreiben — Viết"), "minutes": 20, "maxPoints": 25, "tasks": [
    task("t1", "Teil 1 — Điền phiếu", "Đọc tình huống và điền năm thông tin còn thiếu vào phiếu cho một người khác.", "form", 1, points=5),
    task("t2", "Teil 2 — Một tin nhắn ngắn", "Viết một tin nhắn khoảng 30 từ theo ba gợi ý, có lời chào và lời chào kết.", "short_text", 1, answerWords={"min": 20, "max": 45}, points=10)]},
  {"id": "speaking", "skill": "speaking", "title": T("Sprechen — Nói"), "minutes": 15, "maxPoints": 25, "tasks": [
    task("t1", "Teil 1 — Giới thiệu bản thân", "Tự giới thiệu theo các từ khoá trên thẻ. (Trong kỳ thi thật còn có đánh vần một từ và đọc lại một con số.)", "monologue", 1, speakingMinutes={"min": 1, "max": 2}, points=3),
    task("t2", "Teil 2 — Hỏi và trả lời theo chủ đề", "Trả lời câu hỏi của bạn thi và tự hỏi lại theo thẻ từ.", "conversation", 1, speakingMinutes={"min": 1, "max": 3}, points=6),
    task("t3", "Teil 3 — Nhờ và đáp lại", "Lịch sự nhờ một việc theo thẻ tranh và đáp lại lời nhờ.", "conversation", 1, speakingMinutes={"min": 1, "max": 3}, points=6)]},
 ],
 "passRule": {"groups": [{"id": "gesamt", "title": T("Tổng điểm — cả bốn phần"), "sections": ["listening", "reading", "writing", "speaking"], "min": 60}]},
 "scoring": {"perItem": "share_of_section_points", "negativeMarking": False},
 "readiness": {
  "bands": [
   {"id": "ready_estimate", "minGroupShare": 0.7, "label": T("Mức sẵn sàng ước tính: tốt", "Estimated readiness: good"), "message": T("Ở lần thi thử này, tổng điểm cao hơn ngưỡng 60/100 của định dạng thi một khoảng an toàn. Đây là mức sẵn sàng ước tính từ bài luyện của khoá học, không phải điểm thi thật.", "In this mock the total is comfortably above the format's 60/100 threshold. This is an estimated readiness from the course's practice, not a real exam score.")},
   {"id": "getting_close", "minGroupShare": 0.6, "label": T("Mức sẵn sàng ước tính: gần đạt", "Estimated readiness: getting close"), "message": T("Tổng điểm đạt ngưỡng 60/100 của định dạng thi nhưng chưa có khoảng an toàn. Hãy luyện thêm các phần yếu bên dưới.", "The total reaches the format's 60/100 threshold, without a safety margin yet. Practise the weak areas below.")},
   {"id": "not_yet", "minGroupShare": 0, "label": T("Mức sẵn sàng ước tính: cần luyện thêm", "Estimated readiness: more practice needed"), "message": T("Tổng điểm còn dưới ngưỡng 60/100 của định dạng thi. Hãy luyện các phần yếu bên dưới rồi thử lại với đề còn lại.", "The total is below the format's 60/100 threshold. Practise the weak areas below, then try the other form.")}],
  "incomplete": T("Chưa đủ dữ liệu để ước tính: kỳ thi chỉ tính khi làm đủ cả bốn phần, và phần Nói cần micro cùng nhận dạng giọng nói trên thiết bị. Các phần khác vẫn được tính điểm."),
  "disclaimer": T("Mức sẵn sàng ước tính dựa trên bài thi thử của khoá học — không phải kỳ thi Goethe, không do Goethe-Institut cấp và không dự đoán kết quả thi thật. Phần Nói được mô phỏng một người với ứng dụng thay cho thi nhóm; phần Viết và Nói được chấm bằng tiêu chí tự động đơn giản, nên điểm của hai phần này chỉ là gần đúng.", "Estimated readiness from this course's mock — not the Goethe exam, not issued by the Goethe-Institut, and no prediction of a real result. Speaking is simulated one-to-one with the app instead of the group exam; Writing and Speaking are graded by simple automatic rubrics, so their points are approximate.")},
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
from collections import Counter
print(len(items), "items", dict(Counter((i["sectionId"], i["taskId"]) for i in items)), len(clips), "clips", len(readings), "readings", len(speech), "speech", len(tasks), "tasks", len(scenarios), "scenarios")

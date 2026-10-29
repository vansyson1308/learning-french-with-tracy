"""de-vi section 3 lessons (listen / read): 20 lessons of 5-6 exercises over the S3 readings and clips.
usage: python -I de-lessons-s3.py <out.jsonl>"""
import json, sys
C = "de-vi"
pos = [0]
def place(correct, wrong):
    p = pos[0] % 4
    pos[0] += 1
    o = list(wrong[:3])
    o.insert(p, correct)
    return [{"text": t} for t in o], p

def LC(clip, q, ans, wrong, obj=None):
    o, p = place(ans, wrong)
    e = {"type": "listeningComprehension", "clipId": clip, "question": q, "options": o, "correct": p}
    if obj: e["objectiveTargets"] = obj
    return e
def RC(reading, q, ans, wrong):
    o, p = place(ans, wrong)
    return {"type": "readingComprehension", "readingId": reading, "question": q, "options": o, "correct": p}
def DICT(clip, ans, alts=()):
    return {"type": "dictation", "clipId": clip, "answer": ans, "alternatives": list(alts), "objectiveTargets": ["de.obj.listening.familiar_words"]}
def LISTEN(target, wrong):
    o, p = place(target, wrong)
    return {"type": "select", "mode": "listen", "prompt": "Nghe rồi chọn từ bạn nghe thấy.", "audioTarget": target, "options": o, "correct": p}
def T2N(target, ans, wrong):
    o, p = place(ans, wrong)
    return {"type": "select", "mode": "targetToNative", "prompt": target, "audioTarget": target, "options": o, "correct": p}
def MATCH(pairs):
    return {"type": "match", "pairs": [{"target": t, "native": n} for t, n in pairs]}

Q = "Bạn nghe thấy gì?"
L = {
 "uf-l0": [LC("de.clip.uf_morgen", Q, "buổi sáng", ["buổi tối", "ban đêm", "thời gian"]), LC("de.clip.uf_wasser", Q, "nước", ["sữa", "bánh mì", "cà phê"]), DICT("de.clip.uf_wasser", "das Wasser", ["Wasser"]),
           LISTEN("der Abend", ["der Morgen", "die Nacht", "der Vater"]), MATCH([("der Morgen", "buổi sáng"), ("der Abend", "buổi tối"), ("die Nacht", "ban đêm"), ("das Wasser", "nước")])],
 "uf-l1": [LC("de.clip.uf_guten_morgen", "Người nói chào lúc nào?", "buổi sáng", ["buổi tối", "ban đêm", "buổi trưa"]), LC("de.clip.uf_gute_nacht", "Câu này dùng khi nào?", "trước khi đi ngủ", ["khi gặp ai buổi sáng", "khi cảm ơn", "khi xin lỗi"]),
           LC("de.clip.uf_keine_zeit", "Người nói muốn nói gì?", "Tôi không có thời gian.", ["Tôi có nhiều thời gian.", "Bây giờ là mấy giờ?", "Tôi rất vui."]), DICT("de.clip.uf_nacht", "die Nacht", ["Nacht"]),
           LISTEN("Guten Abend!", ["Guten Morgen!", "Gute Nacht!", "Guten Tag!"])],
 "uf-l2": [LC("de.clip.uf_abend", Q, "buổi tối", ["buổi sáng", "ngày", "ban đêm"]), LC("de.clip.uf_guten_abend", "Người nói chào lúc nào?", "buổi tối", ["buổi sáng", "ban đêm", "buổi trưa"]), DICT("de.clip.uf_morgen", "der Morgen", ["Morgen"]),
           T2N("die Nacht", "ban đêm", ["buổi sáng", "buổi tối", "ngày"]), LISTEN("der Morgen", ["der Abend", "die Nacht", "das Wasser"])],
 "uf-l3": [LC("de.clip.uf_vater", Q, "bố", ["mẹ", "anh trai", "con trai"]), LC("de.clip.uf_zeit", Q, "thời gian", ["tiền", "năm", "phút"]), DICT("de.clip.uf_vater", "der Vater", ["Vater"]),
           DICT("de.clip.uf_zeit", "die Zeit", ["Zeit"]), MATCH([("der Vater", "bố"), ("die Zeit", "thời gian"), ("das Wasser", "nước"), ("der Abend", "buổi tối"), ("die Nacht", "ban đêm")]), LISTEN("die Zeit", ["der Vater", "das Wasser", "die Nacht"])],
 "ug-l0": [RC("de.read.ug_oeffnungszeiten", "Thứ Bảy tiệm bánh mở cửa đến mấy giờ?", "12 giờ", ["18 giờ", "7 giờ", "đóng cả ngày"]), RC("de.read.ug_oeffnungszeiten", "Ngày nào tiệm bánh đóng cửa?", "Chủ nhật", ["thứ Hai", "thứ Bảy", "thứ Sáu"]),
           RC("de.read.ug_oeffnungszeiten", "Từ thứ Hai đến thứ Sáu tiệm mở lúc mấy giờ?", "7 giờ", ["12 giờ", "18 giờ", "9 giờ"]), T2N("der Sonntag", "Chủ nhật", ["thứ Bảy", "thứ Hai", "thứ Sáu"]),
           MATCH([("der Montag", "thứ Hai"), ("der Freitag", "thứ Sáu"), ("der Samstag", "thứ Bảy"), ("der Sonntag", "Chủ nhật")])],
 "ug-l1": [RC("de.read.ug_nachricht_anna", "Anna đang ở đâu?", "ở quán cà phê gần nhà ga", ["ở nhà", "ở bưu điện", "ở tiệm bánh"]), RC("de.read.ug_nachricht_anna", "Anna hỏi Tom điều gì?", "Tom có đến lúc ba giờ không", ["Tom có tiền không", "Tom sống ở đâu", "Tom tên là gì"]),
           RC("de.read.ug_nachricht_anna", "Ai viết tin nhắn?", "Anna", ["Tom", "mẹ của Tom", "người bán hàng"]), T2N("die Nachricht", "tin nhắn", ["cửa hàng", "bưu điện", "tấm biển"]), LISTEN("die Nachricht", ["das Geschäft", "die Post", "das Schild"])],
 "ug-l2": [RC("de.read.ug_schilder", "Bạn muốn đi ra khỏi nhà ga. Bạn đi theo biển nào?", "Ausgang", ["Eingang", "Toiletten", "Hier nicht parken!"]), RC("de.read.ug_schilder", "Nhà vệ sinh ở đâu?", "bên trái", ["bên phải", "ở lối vào", "không có"]),
           RC("de.read.ug_schilder", "Biển nào cấm đỗ xe ở đây?", "Hier nicht parken!", ["Eingang", "Ausgang", "Toiletten: links"]), T2N("das Schild", "tấm biển", ["tin nhắn", "cửa hàng", "bưu điện"]),
           MATCH([("das Schild", "tấm biển"), ("die Nachricht", "tin nhắn"), ("das Geschäft", "cửa hàng"), ("die Post", "bưu điện")])],
 "ug-l3": [RC("de.read.ug_post", "Hôm nay bưu điện thế nào?", "đóng cửa", ["mở cửa đến 9 giờ", "mở cả ngày", "mở lúc 18 giờ"]), RC("de.read.ug_post", "Ngày mai bưu điện mở cửa lúc mấy giờ?", "9 giờ", ["7 giờ", "12 giờ", "3 giờ"]),
           T2N("öffnen", "mở", ["đóng", "mua", "chờ"]), T2N("schließen", "đóng", ["mở", "trả tiền", "nghe"]), LISTEN("öffnen", ["schließen", "warten", "hören"])],
 "uh-l0": [LC("de.clip.uh_zug_berlin", "Tàu đi Berlin chạy lúc mấy giờ?", "8 giờ", ["2 giờ", "10 giờ", "7 giờ"]), LC("de.clip.uh_zug_berlin", "Tàu chạy từ đường ray nào?", "đường ray số 2", ["đường ray số 8", "đường ray số 7", "đường ray số 10"]),
           LC("de.clip.uh_verspaetung", "Tàu từ Hamburg thế nào?", "đến muộn mười phút", ["đến sớm mười phút", "bị huỷ", "đến đúng giờ"]), T2N("der Bahnhof", "nhà ga", ["tàu hỏa", "phút", "tiền"]), LISTEN("der Zug", ["der Bahnhof", "die Minute", "das Geld"])],
 "uh-l1": [LC("de.clip.uh_geschaeft", "Cửa hàng sẽ làm gì trong năm phút nữa?", "đóng cửa", ["mở cửa", "giảm giá", "gọi điện"]), LC("de.clip.uh_bus_sieben", "Xe buýt số mấy sắp đến?", "số 7", ["số 3", "số 2", "số 10"]),
           LC("de.clip.uh_bus_sieben", "Bao lâu nữa xe buýt đến?", "ba phút", ["bảy phút", "mười phút", "năm phút"]), T2N("die Minute", "phút", ["giờ", "tiền", "tàu hỏa"]), DICT("de.clip.uh_warten", "Bitte warten Sie hier.", ["Bitte warten Sie hier"])],
 "uh-l2": [LC("de.clip.uh_warten", "Người ta yêu cầu bạn làm gì?", "chờ ở đây", ["trả tiền ở quầy", "đi thẳng", "đi bên trái"]), LC("de.clip.uh_geradeaus", "Bạn phải đi thế nào?", "đi thẳng rồi rẽ trái", ["đi thẳng rồi rẽ phải", "quay lại", "chờ ở đây"]),
           LC("de.clip.uh_kasse", "Bạn trả tiền ở đâu?", "ở quầy thu ngân", ["ở nhà ga", "trên tàu", "ở bưu điện"]), T2N("warten", "chờ, đợi", ["nghe", "mua", "trả tiền"]), LISTEN("hören", ["warten", "kaufen", "öffnen"])],
 "uh-l3": [LC("de.clip.uh_kaffee_preis", "Cà phê giá bao nhiêu?", "2 euro", ["3 euro", "20 euro", "12 euro"]), LC("de.clip.uh_ticket_preis", "Vé giá bao nhiêu?", "20 euro", ["2 euro", "12 euro", "30 euro"]),
           LC("de.clip.uh_brot_preis", "Bánh mì giá bao nhiêu?", "3,50 euro", ["3 euro", "5,30 euro", "13,50 euro"]), T2N("das Geld", "tiền", ["giờ", "phút", "vé"]), DICT("de.clip.uh_kaffee_preis", "Der Kaffee kostet zwei Euro.", ["Der Kaffee kostet 2 Euro."])],
 "ui-l0": [LC("de.clip.ui_baeckerei", "Khách muốn mua gì?", "hai cái bánh mì nhỏ và một cà phê", ["một cái bánh ngọt", "hai cà phê", "bánh mì và trà"]), LC("de.clip.ui_baeckerei", "Người bán hàng hỏi gì?", "Khách muốn gì", ["Khách tên là gì", "Khách ở đâu", "Bây giờ mấy giờ"]),
           T2N("der Kaffee", "cà phê", ["trà", "bánh mì", "nước ép"]), T2N("das Brot", "bánh mì", ["cà phê", "bánh ngọt", "sữa"]), LISTEN("das Brot", ["der Kaffee", "die Karte", "die Uhr"])],
 "ui-l1": [LC("de.clip.ui_fahrkarte", "Khách muốn đi đâu?", "München", ["Berlin", "Hamburg", "Köln"]), LC("de.clip.ui_fahrkarte", "Khách chọn vé gì?", "vé một chiều", ["vé khứ hồi", "vé tháng", "vé xe buýt"]),
           LC("de.clip.ui_zug_wann", "Tàu đến lúc mấy giờ?", "10 giờ", ["2 giờ", "12 giờ", "8 giờ"]), T2N("die Karte", "vé", ["giờ", "tiền", "cà phê"]), DICT("de.clip.ui_zug_wann", "Wann kommt der Zug?", ["Wann kommt der Zug"])],
 "ui-l2": [LC("de.clip.ui_bezahlen", "Phải trả bao nhiêu tiền?", "4 euro", ["14 euro", "40 euro", "2 euro"]), LC("de.clip.ui_bezahlen", "Khách có trả bằng thẻ được không?", "được", ["không được", "chỉ trả tiền mặt", "phải trả sau"]),
           LC("de.clip.ui_brot_milch", "Người thứ hai mua thêm gì?", "sữa", ["cà phê", "nước", "trà"]), T2N("kaufen", "mua", ["trả tiền", "chờ", "nghe"]), T2N("bezahlen", "trả tiền", ["mua", "mở", "đóng"]),
           MATCH([("kaufen", "mua"), ("bezahlen", "trả tiền"), ("der Kaffee", "cà phê"), ("das Brot", "bánh mì")])],
 "ui-l3": [LC("de.clip.ui_uhrzeit", "Bây giờ là mấy giờ?", "2 giờ 30", ["3 giờ 30", "3 giờ", "2 giờ"]), LC("de.clip.ui_uhrzeit", "Người hỏi nói gì đầu tiên?", "Xin lỗi", ["Cảm ơn", "Chào buổi sáng", "Tạm biệt"]),
           T2N("die Uhr", "đồng hồ", ["vé", "tiền", "bánh mì"]), DICT("de.clip.ui_uhrzeit", "Es ist halb drei.", ["Es ist halb drei"]), LISTEN("die Uhr", ["die Karte", "das Brot", "der Kaffee"])],
 "uj-l0": [RC("de.read.uj_mia", "Mia sống ở đâu?", "Köln", ["Berlin", "München", "Hamburg"]), RC("de.read.uj_mia", "Mia đi làm bằng gì?", "xe buýt", ["tàu hỏa", "xe đạp", "ô tô"]), RC("de.read.uj_mia", "Công việc bắt đầu lúc mấy giờ?", "8 giờ", ["7 giờ", "9 giờ", "10 giờ"]),
           LC("de.clip.uj_mia", "Mia đi làm vào ngày nào?", "thứ Hai", ["thứ Bảy", "Chủ nhật", "thứ Sáu"]), T2N("die Arbeit", "công việc", ["gia đình", "nhà ga", "thứ Bảy"])],
 "uj-l1": [RC("de.read.uj_jonas", "Thứ Bảy Jonas làm gì đầu tiên?", "ngủ dậy muộn", ["đi làm", "chơi bóng đá", "xem phim"]), RC("de.read.uj_jonas", "Buổi chiều Jonas làm gì?", "chơi bóng đá với bạn", ["xem phim", "uống cà phê", "đi làm"]),
           RC("de.read.uj_jonas", "Buổi tối Jonas làm gì?", "xem một bộ phim", ["chơi bóng đá", "ngủ", "ăn bánh mì"]), LC("de.clip.uj_jonas", "Jonas ăn gì?", "bánh mì", ["bánh ngọt", "cá", "trứng"]), T2N("der Samstag", "thứ Bảy", ["Chủ nhật", "thứ Hai", "thứ Sáu"])],
 "uj-l2": [RC("de.read.uj_bahnhof", "Bây giờ là mấy giờ?", "7 giờ", ["8 giờ", "6 giờ", "10 giờ"]), RC("de.read.uj_bahnhof", "Người phụ nữ làm gì?", "mua một cái vé", ["uống sữa", "lên tàu", "đợi xe buýt"]),
           RC("de.read.uj_bahnhof", "Đứa trẻ uống gì?", "sữa", ["nước", "cà phê", "nước ép"]), LC("de.clip.uj_bahnhof", "Ở nhà ga, người phụ nữ mua gì?", "vé", ["sữa", "bánh mì", "báo"]), T2N("dann", "sau đó, rồi", ["cùng nhau", "hôm nay", "ở đây"])],
 "uj-l3": [RC("de.read.uj_sonntag", "Chủ nhật gia đình thế nào?", "ở cùng nhau", ["đi làm", "đi tàu", "ở nhà ga"]), RC("de.read.uj_sonntag", "Người mẹ làm gì?", "làm bữa sáng", ["chơi với chó", "đi làm", "mua vé"]),
           RC("de.read.uj_sonntag", "Con chó chơi ở đâu?", "trong nước", ["trong nhà", "ở nhà ga", "trên đường"]), LC("de.clip.uj_sonntag", "Gia đình ở đâu vào Chủ nhật?", "trong công viên", ["ở nhà", "ở nhà ga", "ở bưu điện"]),
           T2N("zusammen", "cùng nhau", ["sau đó", "một mình", "hôm nay"]), MATCH([("die Familie", "gia đình"), ("zusammen", "cùng nhau"), ("dann", "sau đó, rồi"), ("die Arbeit", "công việc")])],
}
recs = []
for lid, exs in L.items():
    out = []
    for i, e in enumerate(exs):
        e = dict(e)
        e["id"] = f"{C}:{lid}-e{i}"
        out.append(e)
    recs.append({"lessonId": f"{C}:{lid}", "exercises": out})
with open(sys.argv[1], "w", encoding="utf-8", newline="\n") as f:
    for r in recs:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
from collections import Counter
print(len(recs), sum(len(r["exercises"]) for r in recs), dict(Counter(e["type"] for r in recs for e in r["exercises"])))

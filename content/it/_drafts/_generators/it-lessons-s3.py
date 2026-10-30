"""it-vi section 3 lessons (listen / read): 20 lessons of 5-6 exercises over the S3 readings and clips.
usage: python -I it-lessons-s3.py <out.jsonl>"""
import json, sys
from collections import Counter

C = "it-vi"
pos = [0]


def place(correct, wrong):
    p = pos[0] % 4
    pos[0] += 1
    o = list(wrong[:3])
    o.insert(p, correct)
    return [{"text": t} for t in o], p


def LC(clip, q, ans, wrong, obj=None):
    o, p = place(ans, wrong)
    e = {"type": "listeningComprehension", "clipId": f"it.clip.{clip}", "question": q, "options": o, "correct": p}
    if obj:
        e["objectiveTargets"] = obj
    return e


def RC(reading, q, ans, wrong):
    o, p = place(ans, wrong)
    return {"type": "readingComprehension", "readingId": f"it.read.{reading}", "question": q, "options": o, "correct": p}


def DICT(clip, ans, alts=()):
    return {"type": "dictation", "clipId": f"it.clip.{clip}", "answer": ans, "alternatives": list(alts), "objectiveTargets": ["it.obj.listening.familiar_words"]}


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
 "uf-l0": [LC("uf_mattina", Q, "buổi sáng", ["buổi tối", "ban đêm", "thời gian"]), LC("uf_acqua", Q, "nước", ["sữa", "bánh mì", "cà phê"]), DICT("uf_acqua", "l'acqua", ["acqua"]),
           LISTEN("la sera", ["la mattina", "la notte", "il padre"]), MATCH([("la mattina", "buổi sáng"), ("la sera", "buổi tối"), ("la notte", "ban đêm"), ("l'acqua", "nước")])],
 "uf-l1": [LC("uf_buongiorno", "Người nói chào lúc nào?", "ban ngày", ["buổi tối", "trước khi ngủ", "khi xin lỗi"]), LC("uf_buonanotte", "Câu này dùng khi nào?", "trước khi đi ngủ", ["khi gặp ai buổi sáng", "khi cảm ơn", "khi xin lỗi"]),
           LC("uf_non_ho_tempo", "Người nói muốn nói gì?", "Tôi không có thời gian.", ["Tôi có nhiều thời gian.", "Bây giờ là mấy giờ?", "Tôi rất vui."]), DICT("uf_notte", "la notte", ["notte"]),
           LISTEN("Buonasera!", ["Buongiorno!", "Buonanotte!", "Arrivederci!"])],
 "uf-l2": [LC("uf_sera", Q, "buổi tối", ["buổi sáng", "ngày", "ban đêm"]), LC("uf_buonasera", "Người nói chào lúc nào?", "buổi tối", ["buổi sáng", "ban đêm", "buổi trưa"]), DICT("uf_mattina", "la mattina", ["mattina"]),
           T2N("la notte", "ban đêm", ["buổi sáng", "buổi tối", "ngày"]), LISTEN("la mattina", ["la sera", "la notte", "l'acqua"])],
 "uf-l3": [LC("uf_padre", Q, "bố", ["mẹ", "anh trai", "con trai"]), LC("uf_tempo", Q, "thời gian", ["tiền", "năm", "phút"]), DICT("uf_padre", "il padre", ["padre"]),
           DICT("uf_tempo", "il tempo", ["tempo"]), MATCH([("il padre", "bố"), ("il tempo", "thời gian"), ("l'acqua", "nước"), ("la sera", "buổi tối"), ("la notte", "ban đêm")]), LISTEN("il tempo", ["il padre", "l'acqua", "la notte"])],
 "ug-l0": [RC("ug_orario", "Thứ Bảy tiệm bánh mở cửa đến mấy giờ?", "12 giờ", ["18 giờ", "7 giờ", "đóng cả ngày"]), RC("ug_orario", "Ngày nào tiệm bánh đóng cửa?", "Chủ nhật", ["thứ Hai", "thứ Bảy", "thứ Sáu"]),
           RC("ug_orario", "Từ thứ Hai đến thứ Sáu tiệm mở lúc mấy giờ?", "7 giờ", ["12 giờ", "18 giờ", "9 giờ"]), T2N("la domenica", "Chủ nhật", ["thứ Bảy", "thứ Hai", "thứ Sáu"]),
           MATCH([("il lunedì", "thứ Hai"), ("il venerdì", "thứ Sáu"), ("il sabato", "thứ Bảy"), ("la domenica", "Chủ nhật")])],
 "ug-l1": [RC("ug_messaggio_anna", "Anna đang ở đâu?", "ở quán cà phê gần nhà ga", ["ở nhà", "ở bưu điện", "ở tiệm bánh"]), RC("ug_messaggio_anna", "Anna hỏi Luca điều gì?", "Luca có đến lúc ba giờ không", ["Luca có tiền không", "Luca sống ở đâu", "Luca tên là gì"]),
           RC("ug_messaggio_anna", "Ai viết tin nhắn?", "Anna", ["Luca", "mẹ của Luca", "người bán hàng"]), T2N("il messaggio", "tin nhắn", ["cửa hàng", "bưu điện", "lối vào"]), LISTEN("il messaggio", ["il negozio", "la posta", "l'uscita"])],
 "ug-l2": [RC("ug_cartelli", "Bạn muốn đi ra khỏi nhà ga. Bạn đi theo biển nào?", "Uscita", ["Ingresso", "Bagno: a sinistra", "Vietato fumare"]), RC("ug_cartelli", "Nhà vệ sinh ở đâu?", "bên trái", ["bên phải", "ở lối vào", "không có"]),
           RC("ug_cartelli", "Biển nào cấm hút thuốc?", "Vietato fumare", ["Ingresso", "Uscita", "Bagno: a sinistra"]), T2N("l'ingresso", "lối vào", ["tin nhắn", "cửa hàng", "lối ra"]),
           MATCH([("l'ingresso", "lối vào"), ("il messaggio", "tin nhắn"), ("il negozio", "cửa hàng"), ("l'uscita", "lối ra")])],
 "ug-l3": [RC("ug_posta", "Hôm nay bưu điện thế nào?", "đóng cửa", ["mở cửa đến 9 giờ", "mở cả ngày", "mở lúc 18 giờ"]), RC("ug_posta", "Ngày mai bưu điện mở cửa lúc mấy giờ?", "9 giờ", ["7 giờ", "12 giờ", "3 giờ"]),
           T2N("aperto", "mở", ["đóng", "đầy", "mới"]), T2N("chiuso", "đóng", ["mở", "đầy", "cũ"]), LISTEN("aperto", ["chiuso", "l'orario", "il negozio"])],
 "uh-l0": [LC("uh_treno_roma", "Tàu đi Roma chạy lúc mấy giờ?", "8 giờ", ["2 giờ", "10 giờ", "7 giờ"]), LC("uh_treno_roma", "Tàu chạy từ sân ga nào?", "sân ga số 2", ["sân ga số 8", "sân ga số 7", "sân ga số 10"]),
           LC("uh_ritardo", "Tàu từ Napoli thế nào?", "đến muộn mười phút", ["đến sớm mười phút", "bị hủy", "đến đúng giờ"]), T2N("il binario", "sân ga", ["bến xe", "phút", "tiền"]), LISTEN("il binario", ["la fermata", "il ritardo", "la pagina"])],
 "uh-l1": [LC("uh_negozio", "Cửa hàng sẽ làm gì trong năm phút nữa?", "đóng cửa", ["mở cửa", "giảm giá", "gọi điện"]), LC("uh_autobus_sette", "Xe buýt số mấy sắp đến?", "số 7", ["số 3", "số 2", "số 10"]),
           LC("uh_autobus_sette", "Bao lâu nữa xe buýt đến?", "ba phút", ["bảy phút", "mười phút", "năm phút"]), T2N("il minuto", "phút", ["giờ", "tiền", "tàu hỏa"]), DICT("uh_aspetti", "Per favore, aspetti qui.", ["Per favore aspetti qui", "Per favore, aspetti qui"])],
 "uh-l2": [LC("uh_aspetti", "Người ta yêu cầu bạn làm gì?", "đợi ở đây", ["trả tiền ở quầy", "đi thẳng", "rẽ trái"]), LC("uh_dritto", "Bạn phải đi thế nào?", "đi thẳng rồi rẽ trái", ["đi thẳng rồi rẽ phải", "quay lại", "đợi ở đây"]),
           LC("uh_cassa", "Bạn trả tiền ở đâu?", "ở quầy thu ngân", ["ở nhà ga", "trên tàu", "ở bưu điện"]), T2N("aspettare", "đợi", ["nghe", "mua", "trả tiền"]), LISTEN("ascoltare", ["aspettare", "comprare", "aprire"])],
 "uh-l3": [LC("uh_caffe_prezzo", "Cà phê giá bao nhiêu?", "2 euro", ["3 euro", "20 euro", "12 euro"]), LC("uh_biglietto_prezzo", "Vé giá bao nhiêu?", "20 euro", ["2 euro", "12 euro", "30 euro"]),
           LC("uh_pane_prezzo", "Bánh mì giá bao nhiêu?", "3,50 euro", ["3 euro", "5,30 euro", "13,50 euro"]), T2N("il prezzo", "giá", ["giờ", "phút", "vé"]), DICT("uh_caffe_prezzo", "Il caffè costa due euro.", ["Il caffè costa 2 euro.", "Il caffè costa due euro", "Il caffè costa 2 euro"])],
 "ui-l0": [LC("ui_bar", "Khách muốn mua gì?", "hai cái bánh sừng bò và một cà phê", ["một cái bánh ngọt", "hai ly cà phê", "bánh mì và trà"]), LC("ui_bar", "Người bán hàng hỏi gì?", "Khách muốn gì", ["Khách tên là gì", "Khách ở đâu", "Bây giờ mấy giờ"]),
           T2N("il caffè", "cà phê", ["trà", "bánh mì", "nước ép"]), T2N("il cornetto", "bánh sừng bò", ["cà phê", "bánh ngọt", "sữa"]), LISTEN("il cornetto", ["il caffè", "la carta", "il prezzo"])],
 "ui-l1": [LC("ui_biglietto", "Khách muốn đi đâu?", "Firenze", ["Roma", "Napoli", "Milano"]), LC("ui_biglietto", "Khách chọn vé gì?", "vé một chiều", ["vé khứ hồi", "vé tháng", "vé xe buýt"]),
           LC("ui_treno_quando", "Tàu đến lúc mấy giờ?", "10 giờ", ["2 giờ", "12 giờ", "8 giờ"]), T2N("il biglietto", "vé", ["giờ", "tiền", "cà phê"]), DICT("ui_treno_quando", "Quando arriva il treno?", ["Quando arriva il treno"])],
 "ui-l2": [LC("ui_pagare", "Phải trả bao nhiêu tiền?", "4 euro", ["14 euro", "40 euro", "2 euro"]), LC("ui_pagare", "Khách có trả bằng thẻ được không?", "được", ["không được", "chỉ trả tiền mặt", "phải trả sau"]),
           LC("ui_pane_latte", "Người thứ hai mua thêm gì?", "sữa", ["cà phê", "nước", "trà"]), T2N("comprare", "mua", ["trả tiền", "đợi", "nghe"]), T2N("pagare", "trả tiền", ["mua", "mở", "đóng"]),
           MATCH([("comprare", "mua"), ("pagare", "trả tiền"), ("il caffè", "cà phê"), ("il pane", "bánh mì")])],
 "ui-l3": [LC("ui_ora", "Bây giờ là mấy giờ?", "2 giờ 30", ["3 giờ 30", "3 giờ", "2 giờ"]), LC("ui_ora", "Người hỏi nói gì đầu tiên?", "Xin lỗi", ["Cảm ơn", "Chào buổi sáng", "Tạm biệt"]),
           T2N("l'ora", "giờ", ["vé", "tiền", "bánh mì"]), DICT("ui_ora", "Sono le due e mezza.", ["Sono le due e mezza", "Sono le 2 e mezza."]), LISTEN("l'ora", ["la carta", "il pane", "il caffè"])],
 "uj-l0": [RC("uj_mia", "Mia sống ở đâu?", "Bologna", ["Roma", "Milano", "Napoli"]), RC("uj_mia", "Mia đi làm bằng gì?", "xe buýt", ["tàu hỏa", "xe đạp", "ô tô"]), RC("uj_mia", "Công việc bắt đầu lúc mấy giờ?", "8 giờ", ["7 giờ", "9 giờ", "10 giờ"]),
           LC("uj_mia", "Mia đi làm bằng xe buýt vào ngày nào?", "thứ Hai", ["thứ Bảy", "Chủ nhật", "thứ Sáu"]), T2N("il lavoro", "công việc", ["gia đình", "nhà ga", "thứ Bảy"])],
 "uj-l1": [RC("uj_paolo", "Thứ Bảy Paolo làm gì đầu tiên?", "dậy muộn", ["đi làm", "chơi bóng đá", "xem phim"]), RC("uj_paolo", "Buổi chiều Paolo làm gì?", "chơi bóng đá với bạn", ["xem phim", "uống cà phê", "đi làm"]),
           RC("uj_paolo", "Buổi tối Paolo làm gì?", "xem một bộ phim", ["chơi bóng đá", "ngủ", "ăn bánh"]), LC("uj_paolo", "Paolo ăn gì?", "bánh sừng bò", ["bánh ngọt", "cá", "trứng"]), T2N("il sabato", "thứ Bảy", ["Chủ nhật", "thứ Hai", "thứ Sáu"])],
 "uj-l2": [RC("uj_stazione", "Bây giờ là mấy giờ?", "7 giờ", ["8 giờ", "6 giờ", "10 giờ"]), RC("uj_stazione", "Người phụ nữ làm gì?", "mua một cái vé", ["uống sữa", "lên tàu", "đợi xe buýt"]),
           RC("uj_stazione", "Đứa bé uống gì?", "sữa", ["nước", "cà phê", "nước ép"]), LC("uj_stazione", "Ở nhà ga, người phụ nữ mua gì?", "vé", ["sữa", "bánh mì", "báo"]), T2N("poi", "sau đó", ["cùng nhau", "hôm nay", "ở đây"])],
 "uj-l3": [RC("uj_domenica", "Chủ nhật gia đình thế nào?", "ở cùng nhau", ["đi làm", "đi tàu", "ở nhà ga"]), RC("uj_domenica", "Người mẹ làm gì?", "chuẩn bị bữa sáng", ["chơi với chó", "đi làm", "mua vé"]),
           RC("uj_domenica", "Con chó chơi ở đâu?", "trong nước", ["trong nhà", "ở nhà ga", "trên đường"]), LC("uj_domenica", "Gia đình ở đâu vào Chủ nhật?", "ở công viên", ["ở nhà", "ở nhà ga", "ở bưu điện"]),
           T2N("insieme", "cùng nhau", ["sau đó", "một mình", "hôm nay"]), MATCH([("la famiglia", "gia đình"), ("insieme", "cùng nhau"), ("poi", "sau đó"), ("il lavoro", "công việc")])],
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
print(len(recs), sum(len(r["exercises"]) for r in recs), dict(Counter(e["type"] for r in recs for e in r["exercises"])))

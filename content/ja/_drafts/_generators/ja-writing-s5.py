"""ja-vi writing (P4c session 4), after en-writing-s5.py: guided and open tasks of units o-r, and 16 reserved tasks for
checkpoint 5 and the capstone (four short messages, two in each form). Exam writing tasks are added by the exam step.
Writes content/ja/_drafts/writing/OUTPUT.jsonl.

Model answers are in the target script (kanji where the lexicon has the word, with furigana at run time). A learner who
types kana for a kanji slot is aligned through the stored readings and gets the verdict as practice, never production
evidence (P4b guard, session-3 decision): the rubric lists the standard spelling only. Rubric notes: the writing fold
reads digits 0–100 as kanji numerals and katakana as hiragana, and drops the middle dot, so 23歳 = 二十三歳 and
グエン・ナム = グエンナム are one variant; a slot with several variants is realized once in the model answer (keyword
stuffing). Under the validator's tokenizer a clock time glued to its particle (7時に) splits after the numeral,
so a time slot also lists the bare number. Names are cue facts in Vietnamese spelling; the answer writes them in katakana. Clock cues read "7 giờ".
usage: python -I ja-writing-s5.py <repo root>
"""
import os, sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ja_layers import DRAFTS, check, check_vi, content_refs, report, write_jsonl  # noqa: E402
from ja_text import natural_spellings  # noqa: E402

PROFILE, SENT, MSG, FORM = "ja.obj.writing.personal_info", "ja.obj.writing.phrases_sentences", "ja.obj.writing.short_message", "ja.obj.writing.form_filling"
GREET = ["お疲れさまです", "おはようございます", "こんにちは"]
SORRY = ["すみません", "申し訳ありません", "申し訳ございません"]
# D-10 review: 休みたいです is the likeliest A1 way to ask for leave (cp5_mail_shift already took it).
REST = ["休みます", "休んでもいいですか", "休ませてください", "休みたい", "休ませてもらえますか"]
VERBS = ["です", "ます", "ました"]
FIELDS = {"name": ("name", "名前"), "address": ("address", "住所"), "phone": ("phone", "電話番号"), "birthday": ("birthday", "誕生日"), "country": ("country", "国")}
# slug -> (family, objective, instruction, cue facts, slots (id, description, variants, cue provided), min, max, sentence verbs, model, form fields)
GUIDED = {
 "o_name": ("personal_profile", PROFILE, "Bạn là Nam. Hãy viết một câu tiếng Nhật nói tên của bạn.", [("Tên", "Nam (viết bằng katakana)")],
            [("name", "tên của bạn", ["ナム"], True)], 2, 12, ["です"], "わたしはナムです。", None),
 "o_age": ("personal_profile", PROFILE, "Bạn 23 tuổi. Hãy viết một câu tiếng Nhật nói tuổi của bạn.", [("Tuổi", "23")],
           [("age", "tuổi của bạn", ["23歳", "23さい"], True)], 2, 12, ["です"], "わたしは23歳です。", None),
 "o_home": ("personal_profile", PROFILE, "Hãy viết hai câu: bạn đến từ nước nào và bây giờ bạn sống ở thành phố nào.", [("Nước", "Việt Nam"), ("Thành phố", "Osaka")],
            [("from", "bạn đến từ đâu", ["ベトナムから", "ベトナム人"], True), ("city", "thành phố bạn sống", ["大阪"], True)], 4, 20, VERBS, "ベトナムから来ました。今、大阪に住んでいます。", None),
 "o_family": ("personal_profile", PROFILE, "Hãy viết hai câu: bạn có hai em gái, và bạn thích nấu ăn.", None,
              [("sisters", "hai em gái", ["妹が二人", "妹は二人", "二人の妹"], False),
               ("like", "bạn thích nấu ăn", ["料理が好き", "料理が大好き", "料理をするのが好き", "料理するのが好き", "料理を作るのが好き"], False)], 4, 20, VERBS, "妹が二人います。料理が好きです。", None),
 "o_all": ("personal_profile", PROFILE, "Hãy viết ba câu ngắn về bạn: tên, tuổi và thành phố bạn sống.", [("Tên", "Lan"), ("Tuổi", "28"), ("Thành phố", "Nagoya")],
           [("name", "tên", ["ラン"], True), ("age", "tuổi", ["28歳", "28さい"], True), ("city", "thành phố", ["名古屋"], True)], 6, 30, VERBS, "ランです。28歳です。名古屋に住んでいます。", None),
 "p_who": ("simple_description", SENT, "Hãy viết một câu: anh Nam uống cà phê vào buổi sáng.", [("Người", "Nam")],
           [("drink", "uống cà phê", ["コーヒーを飲み"], False), ("morning", "vào buổi sáng", ["朝", "毎朝"], False)], 3, 15, VERBS, "ナムさんは朝、コーヒーを飲みます。", None),
 "p_neg": ("simple_description", SENT, "Hãy viết một câu phủ định: bạn không uống rượu.", None,
           [("neg", "bạn không uống rượu", ["お酒を飲みません", "お酒は飲みません"], False)], 2, 12, None, "お酒を飲みません。", None),
 "p_ask": ("simple_description", SENT, "Hãy viết một câu hỏi lịch sự: Bạn sống ở đâu?", None,
           [("ask", "câu hỏi về nơi sống", ["どこに住んで"], False)], 2, 12, VERBS, "どこに住んでいますか。", None),
 "p_link": ("simple_description", SENT, "Hãy viết hai câu: bạn ăn sáng, sau đó bạn đi làm. Dùng một từ nối.", None,
            [("breakfast", "bạn ăn sáng", ["朝ご飯を食べ"], False), ("link", "từ nối", ["それから", "そして"], False), ("work", "bạn đi làm", ["会社へ行き", "会社に行き", "仕事に行き", "工場へ行き", "工場に行き"], False)], 5, 25, VERBS,
            "朝ご飯を食べます。それから、会社へ行きます。", None),
 "q_sick": ("short_message", MSG, "Hãy nhắn cho cấp trên: chào, báo bạn bị sốt, và hôm nay bạn xin nghỉ.", None,
            [("greeting", "lời chào", GREET, False), ("fever", "bạn bị sốt", ["熱があり", "熱が出"], False), ("rest", "xin nghỉ", REST, False)], 5, 30, None, "お疲れさまです。グエンです。熱があります。今日は休みます。", None),
 "q_late": ("short_message", MSG, "Hãy nhắn cho anh Tanaka: chào, báo tàu điện bị trễ, rồi xin lỗi.", [("Gửi", "anh Tanaka")],
            [("greeting", "lời chào", GREET, False), ("train", "tàu điện bị trễ", ["電車が遅れ"], False), ("sorry", "lời xin lỗi", SORRY, False)], 5, 30, None, "田中さん、お疲れさまです。電車が遅れています。すみません。", None),
 "q_reply": ("short_message", MSG, "Cấp trên nhắn: mai làm từ 7 giờ. Hãy trả lời: bạn đã hiểu, và cảm ơn.", None,
             [("ok", "bạn đã hiểu", ["わかりました", "承知しました"], False), ("thanks", "lời cảm ơn", ["ありがとうございます", "ありがとうございました"], False)], 2, 20, None, "わかりました。ありがとうございます。", None),
 "r_form_office": ("simple_form", FORM, "Hãy điền phiếu ở toà thị chính với các thông tin trên thẻ. Tên viết bằng katakana.", [("Tên", "Nguyễn Nam"), ("Địa chỉ", "Osaka"), ("Điện thoại", "080-1234-5678")],
                   [("name", "tên (katakana)", ["グエン・ナム"], True), ("address", "địa chỉ", ["大阪"], True), ("phone", "số điện thoại", ["080-1234-5678"], True)], 2, 12, None, "グエン・ナム | 大阪 | 080-1234-5678",
                   ["name", "address", "phone"]),
 "r_form_clinic": ("simple_form", FORM, "Hãy điền phiếu của phòng khám với các thông tin trên thẻ. Tên viết bằng katakana.", [("Tên", "Lan"), ("Sinh nhật", "ngày 20 tháng 9"), ("Điện thoại", "090-8765-4321")],
                   [("name", "tên (katakana)", ["ラン"], True), ("birthday", "ngày sinh", ["九月二十日"], True), ("phone", "số điện thoại", ["090-8765-4321"], True)], 2, 12, None, "ラン | 九月二十日 | 090-8765-4321",
                   ["name", "birthday", "phone"]),
 "r_note": ("short_message", SENT, "Hãy viết lời nhắn cho đàn anh: máy không chạy, xin anh gọi cấp trên.", None,
            [("machine", "cái máy", ["機械"], False), ("broken", "máy không chạy", ["動きません", "止まりました", "壊れ", "止まって", "動いていません"], False), ("call", "gọi cấp trên", ["上司を呼んで", "上司に電話して"], False)], 4, 25, None,
            "先輩、機械が動きません。上司を呼んでください。", None),
}
# Open practice: menu slots, never scored.
OPEN = {
 "o_open": ("personal_profile", PROFILE, "Hãy viết vài câu về bạn. Bạn chọn nói gì cũng được.", [("about", "một câu về bạn", ["です", "ます", "ました"])], 3, 40, "わたしはホアです。ハノイから来ました。音楽が好きです。"),
 "p_open": ("simple_description", SENT, "Hãy viết vài câu về một ngày của bạn.", [("day", "một câu về ngày của bạn", ["起きます", "食べます", "働きます", "寝ます", "毎日", "毎朝", "毎晩"])], 3, 40, "毎朝6時に起きます。夜は寮で晩ご飯を食べます。"),
 "q_open": ("short_message", MSG, "Hãy viết một tin nhắn ngắn cho một người bạn.", [("message", "lời chào hoặc lời mời", ["こんにちは", "お疲れさまです", "ありがとう", "ませんか", "ましょう"])], 3, 40, "リンさん、こんにちは。土曜日に一緒に映画を見ませんか。"),
 "r_open": ("personal_profile", SENT, "Hãy viết vài câu về công việc của bạn.", [("work", "một câu về công việc", ["仕事", "工場", "会社", "上司", "先輩", "働いて"])], 3, 40, "工場で働いています。仕事は8時からです。先輩はとても親切です。"),
}
RESERVED = {
 "cp5_profile_hoa": ("personal_profile", PROFILE, "Bạn là Hoa. Hãy tự giới thiệu: tên, tuổi và thành phố, bằng câu hoàn chỉnh.", [("Tên", "Hoa"), ("Tuổi", "24"), ("Thành phố", "Kyoto")],
                     [("name", "tên", ["ホア"], True), ("age", "tuổi", ["24歳", "24さい"], True), ("city", "thành phố", ["京都"], True)], 6, 30, VERBS, "ホアです。24歳です。京都に住んでいます。", None),
 "cp5_profile_tuan": ("personal_profile", PROFILE, "Bạn là Tuấn. Hãy viết về bạn: tên, nước của bạn và nơi bạn làm việc.", [("Tên", "Tuấn (viết トゥアン)"), ("Nước", "Việt Nam"), ("Nơi làm việc", "nhà máy")],
                      [("name", "tên", ["トゥアン"], True), ("from", "nước của bạn", ["ベトナムから", "ベトナム人"], True), ("work", "nơi làm việc", ["工場"], True)], 6, 30, VERBS,
                      "トゥアンです。ベトナムから来ました。工場で働いています。", None),
 "cp5_like_music": ("simple_description", SENT, "Hãy viết một câu nói rằng bạn thích âm nhạc.", None,
                    [("like", "bạn thích âm nhạc", ["音楽が好き", "音楽が大好き"], False)], 2, 12, VERBS, "音楽が好きです。", None),
 "cp5_sister": ("simple_description", SENT, "Hãy viết hai câu về chị gái bạn: chị ấy tên là Linh, và chị ấy là y tá.", [("Tên", "Linh")],
                [("name", "tên của chị ấy", ["リン"], True), ("job", "nghề của chị ấy", ["看護師"], False)], 4, 20, VERBS, "姉はリンです。看護師です。", None),
 "cp5_room": ("simple_description", SENT, "Hãy viết hai câu tả căn phòng: phòng nhỏ, và trong phòng có một cái giường.", None,
              [("small", "phòng nhỏ", ["部屋は小さい", "小さい部屋", "部屋は狭い", "狭い部屋"], False), ("bed", "có một cái giường", ["ベッドがあり"], False)], 4, 20, VERBS, "部屋は小さいです。ベッドがあります。", None),
 "cp5_note_movie": ("short_message", MSG, "Hãy nhắn cho Lan: rủ bạn ấy đi xem phim lúc 7 giờ.", [("Gửi", "Lan"), ("Giờ", "7 giờ")],
                    [("movie", "bộ phim", ["映画"], False), ("time", "giờ hẹn", ["7時", "7"], True), ("invite", "lời rủ", ["ませんか", "ましょう"], False)], 4, 25, None, "ランさん、7時に映画を見ませんか。", None),
 "cp5_note_sick": ("short_message", MSG, "Hãy nhắn cho cấp trên: chào, báo bạn bị cảm, và hôm nay bạn xin nghỉ.", None,
                   [("greeting", "lời chào", GREET, False), ("cold", "bạn bị cảm", ["風邪"], False), ("rest", "xin nghỉ", REST, False)], 5, 30, None, "お疲れさまです。風邪をひきました。今日は休みます。", None),
 "cp5_note_late": ("short_message", MSG, "Hãy nhắn cho cấp trên: xin lỗi, bạn sẽ đến muộn khoảng 15 phút.", [("Đến muộn", "15 phút")],
                   [("sorry", "lời xin lỗi", SORRY, False), ("minutes", "đến muộn bao lâu", ["15分"], True), ("late", "bạn sẽ đến muộn", ["遅れます", "遅刻します"], False)], 4, 25, None, "すみません。15分ぐらい遅れます。", None),
 "cp5_mail_shift": ("short_message", MSG, "Hãy nhắn cho cấp trên: chào, rồi hỏi thứ Bảy bạn có thể nghỉ không.", [("Ngày", "thứ Bảy")],
                    [("greeting", "lời chào", GREET, False), ("day", "ngày nghỉ", ["土曜日"], True), ("rest", "xin nghỉ", ["休んでもいいですか", "休みたいです", "休ませてください"], False)], 4, 25, None,
                    "お疲れさまです。土曜日に休んでもいいですか。", None),
 "cp5_form_office": ("simple_form", FORM, "Hãy điền phiếu ở toà thị chính với các thông tin trên thẻ. Tên viết bằng katakana.", [("Tên", "Phạm Linh (viết ファム・リン)"), ("Địa chỉ", "Kyoto"), ("Điện thoại", "080-2222-3333")],
                     [("name", "tên (katakana)", ["ファム・リン"], True), ("address", "địa chỉ", ["京都"], True), ("phone", "số điện thoại", ["080-2222-3333"], True)], 2, 12, None, "ファム・リン | 京都 | 080-2222-3333",
                     ["name", "address", "phone"]),
 "cp5_form_clinic": ("simple_form", FORM, "Hãy điền phiếu của phòng khám với các thông tin trên thẻ. Tên viết bằng katakana.", [("Tên", "Hùng (viết フン)"), ("Sinh nhật", "ngày 5 tháng 4"), ("Điện thoại", "090-1111-2222")],
                     [("name", "tên (katakana)", ["フン"], True), ("birthday", "ngày sinh", ["四月五日"], True), ("phone", "số điện thoại", ["090-1111-2222"], True)], 2, 12, None, "フン | 四月五日 | 090-1111-2222",
                     ["name", "birthday", "phone"]),
 "cp5_form_work": ("simple_form", FORM, "Hãy điền phiếu nhân viên mới với các thông tin trên thẻ. Tên viết bằng katakana.", [("Tên", "Lê Mai (viết レ・マイ)"), ("Nước", "Việt Nam"), ("Điện thoại", "080-3333-4444")],
                   [("name", "tên (katakana)", ["レ・マイ"], True), ("country", "nước", ["ベトナム"], True), ("phone", "số điện thoại", ["080-3333-4444"], True)], 2, 12, None, "レ・マイ | ベトナム | 080-3333-4444",
                   ["name", "country", "phone"]),
 "a1cap_note_station": ("short_message", MSG, "Hãy nhắn cho Hoa: hẹn gặp ở nhà ga lúc 5 giờ.", [("Gửi", "Hoa"), ("Giờ", "5 giờ")],
                        [("place", "nhà ga", ["駅"], False), ("time", "giờ hẹn", ["5時", "5"], True), ("meet", "lời hẹn gặp", ["会いましょう", "会いませんか"], False)], 4, 25, None, "ホアさん、5時に駅で会いましょう。", None),
 "a1cap_note_bus": ("short_message", MSG, "Hãy nhắn cho Nam: báo xe buýt của bạn đến lúc 6 giờ.", [("Gửi", "Nam"), ("Giờ", "6 giờ")],
                    [("bus", "xe buýt", ["バス"], False), ("time", "giờ xe đến", ["6時", "6"], True)], 3, 25, VERBS, "ナムさん、バスは6時に着きます。", None),
 "a1cap_note_home": ("short_message", MSG, "Hãy nhắn cho Lan: bạn đang ở siêu thị, và 5 giờ bạn về nhà.", [("Gửi", "Lan"), ("Giờ", "5 giờ")],
                     [("place", "siêu thị", ["スーパー"], False), ("time", "giờ về nhà", ["5時", "5"], True), ("home", "bạn về nhà", ["帰ります"], False)], 4, 25, None, "ランさん、今スーパーにいます。5時にうちへ帰ります。", None),
 "a1cap_mail_absent": ("short_message", MSG, "Hãy nhắn cho cấp trên: chào, báo thứ Năm bạn đi bệnh viện, nên bạn xin nghỉ.", [("Ngày", "thứ Năm")],
                       [("greeting", "lời chào", GREET, False), ("day", "ngày nghỉ", ["木曜日"], True), ("hospital", "bệnh viện", ["病院"], False), ("rest", "xin nghỉ", REST, False)], 5, 30, None,
                       "お疲れさまです。木曜日に病院へ行きます。木曜日は休みます。", None),
}


def _widen(variants):
    """D-10 review: a slot also takes the kanji the IME offers for the course's kana (お疲れ様です, 分かりました) and 大きな /
    小さな. Numbers, the middle dot, hyphens and spaces need nothing: the writing fold reads digits as kanji numerals and drops
    ・, - and the space between Japanese characters (normalizeWritten → foldSpokenJapanese)."""
    out = []
    for v in variants:
        for x in [v] + natural_spellings(v):
            if x not in out:
                out.append(x)
    return out


def task(slug, spec, reserved):
    fam, obj, instr, cue, slots, mn, mx, verbs, model, fields = spec
    tid = f"ja.write.{slug}"
    check_vi(tid, instr)
    rubric = {"requiredSlots": [{"id": i, "description": {"vi": d}, "variants": _widen(v), "cueProvided": c} for i, d, v, c in slots], "minTokens": mn, "maxTokens": mx}
    for _, d, v, _c in slots:
        check_vi(tid, d)
    if verbs:
        rubric["requireSentenceVerbs"] = verbs
    t = {"id": tid, "taskFamily": fam, "mode": "guided", "instruction": {"vi": instr}}
    if cue:
        t["cueFacts"] = [{"label": {"vi": a}, "value": b} for a, b in cue]
    if fields:
        t["formFields"] = [{"id": FIELDS[f][0], "label": FIELDS[f][1], "slotId": f} for f in fields]
        for f in fields:
            check(tid, FIELDS[f][1], plain=True)
    else:
        check(tid, model)
    t.update({"rubric": rubric, "modelAnswers": [model], "objectiveRefs": [obj], "lexemeRefs": [] if fields else content_refs(model), "scoredEligibility": reserved, "reserved": reserved, "sourceRef": "original-project"})
    return t


def open_task(slug, spec):
    fam, obj, instr, slots, mn, mx, model = spec
    tid = f"ja.write.{slug}"
    check(tid, model)
    check_vi(tid, instr)
    rubric = {"requiredSlots": [{"id": i, "description": {"vi": d}, "variants": _widen(v), "cueProvided": False} for i, d, v in slots], "minTokens": mn, "maxTokens": mx}
    return {"id": tid, "taskFamily": fam, "mode": "open", "instruction": {"vi": instr}, "rubric": rubric, "modelAnswers": [model], "objectiveRefs": [obj], "lexemeRefs": content_refs(model), "scoredEligibility": False, "reserved": False, "sourceRef": "original-project"}


tasks = [task(s, x, False) for s, x in GUIDED.items()] + [open_task(s, x) for s, x in OPEN.items()] + [task(s, x, True) for s, x in RESERVED.items()]
write_jsonl(f"{DRAFTS}/writing/OUTPUT.jsonl", tasks)
report()
print(len(tasks), "tasks", sum(t["reserved"] for t in tasks), "reserved", dict(Counter(t["taskFamily"] for t in tasks)))

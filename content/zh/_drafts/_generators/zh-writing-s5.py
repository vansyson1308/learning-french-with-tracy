"""zh-vi writing (P4d session 3), after ja-writing-s5.py: guided and open tasks of units o-r, and 16 reserved tasks for
checkpoint 5 and the capstone (four short messages, two in each form). Exam writing tasks are added by the exam step.
Writes content/zh/_drafts/writing/OUTPUT.jsonl.

Model answers are simplified hanzi (pinyin from the lexicon at run time). A learner who types pinyin for a slot is
aligned through the stored readings and gets the verdict as practice, never production evidence (P4b guard): the rubric
lists hanzi only. Rubric notes: the writing fold reads digits as hanzi numerals before it tokenizes (zh.ts spells digit
runs), drops punctuation and the spaces between hanzi, and folds traditional characters, so 23岁 = 二十三岁 and a phone
number's hyphens need nothing; a slot therefore lists a number once, in hanzi, and widens only by the natural pairs
(哪儿/哪里, 这儿/这里 …). A slot with several variants is realized once in the model answer (keyword stuffing). Names are
cue facts in Vietnamese spelling; the answer writes the characters the lessons taught (Nguyễn Hải → 阮海). Clock cues
read "7 giờ". usage: python -I zh-writing-s5.py <repo root>
"""
import os, sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zh_layers import DRAFTS, bare, check, check_vi, content_refs, natural_spellings, report, write_jsonl  # noqa: E402

PROFILE, SENT, MSG, FORM = "zh.obj.writing.personal_info", "zh.obj.writing.phrases_sentences", "zh.obj.writing.short_message", "zh.obj.writing.form_filling"
GREET = ["您好", "你好", "组长好", "经理好"]
SORRY = ["对不起", "不好意思"]
REST = ["请假", "不能上班", "休息"]
FIELDS = {"name": ("name", "姓名"), "address": ("address", "地址"), "phone": ("phone", "电话"), "birthday": ("birthday", "生日"), "country": ("country", "国家")}
# slug -> (family, objective, instruction, cue facts, slots (id, description, variants, cue provided), min, max, sentence verbs, model, form fields)
GUIDED = {
 "o_name": ("personal_profile", PROFILE, "Bạn là Nguyễn Hải. Hãy viết một câu tiếng Trung nói tên của bạn (gõ pinyin rồi chọn chữ Hán).", [("Tên", "Nguyễn Hải")],
            [("name", "tên của bạn", ["阮海"], True)], 2, 12, ["叫", "是"], "我叫阮海。", None),
 "o_age": ("personal_profile", PROFILE, "Bạn 23 tuổi. Hãy viết một câu tiếng Trung nói tuổi của bạn.", [("Tuổi", "23")],
           [("age", "tuổi của bạn", ["二十三岁"], True)], 2, 12, None, "我今年二十三岁。", None),
 "o_home": ("personal_profile", PROFILE, "Hãy viết hai câu: bạn là người nước nào, và bây giờ bạn sống ở thành phố nào.", [("Nước", "Việt Nam"), ("Thành phố", "Thượng Hải")],
            [("from", "bạn là người nước nào", ["越南人", "越南"], True), ("city", "thành phố bạn sống", ["上海"], True)], 4, 20, ["是", "住"], "我是越南人。我现在住在上海。", None),
 "o_family": ("personal_profile", PROFILE, "Hãy viết hai câu: bạn có hai em gái, và bạn thích nấu ăn.", None,
              [("sisters", "hai em gái", ["两个妹妹"], False), ("like", "bạn thích nấu ăn", ["喜欢做饭"], False)], 4, 20, ["有", "喜欢"], "我有两个妹妹。我喜欢做饭。", None),
 "o_all": ("personal_profile", PROFILE, "Hãy viết ba câu ngắn về bạn: tên, tuổi và thành phố bạn sống.", [("Tên", "Nguyễn Hồng"), ("Tuổi", "28"), ("Thành phố", "Quảng Châu")],
           [("name", "tên", ["阮红"], True), ("age", "tuổi", ["二十八岁"], True), ("city", "thành phố", ["广州"], True)], 6, 30, ["叫", "是", "住"], "我叫阮红。我今年二十八岁。我住在广州。", None),
 "p_who": ("simple_description", SENT, "Hãy viết một câu: buổi sáng anh Nguyễn Nam uống cà phê.", [("Người", "Nguyễn Nam")],
           [("drink", "uống cà phê", ["喝咖啡"], False), ("morning", "buổi sáng", ["早上", "每天早上"], False)], 3, 15, None, "阮南早上喝咖啡。", None),
 "p_neg": ("simple_description", SENT, "Hãy viết một câu phủ định: bạn không uống rượu.", None,
           [("neg", "bạn không uống rượu", ["不喝酒"], False)], 2, 12, None, "我不喝酒。", None),
 "p_ask": ("simple_description", SENT, "Hãy viết một câu hỏi: Bạn sống ở đâu?", None,
           [("ask", "câu hỏi về nơi sống", ["住在哪儿", "住哪儿"], False)], 2, 12, None, "你住在哪儿？", None),
 "p_link": ("simple_description", SENT, "Hãy viết hai câu: bạn ăn sáng, sau đó bạn đi làm. Dùng một từ nối.", None,
            [("breakfast", "bạn ăn sáng", ["吃早饭"], False), ("link", "từ nối", ["然后"], False), ("work", "bạn đi làm", ["上班", "去工厂", "去公司"], False)], 5, 25, None,
            "我先吃早饭，然后去上班。", None),
 "q_sick": ("short_message", MSG, "Hãy nhắn cho tổ trưởng Lý: chào, báo bạn bị sốt, và hôm nay bạn xin nghỉ.", [("Gửi", "tổ trưởng Lý")],
            [("greeting", "lời chào", GREET, False), ("fever", "bạn bị sốt", ["发烧"], False), ("rest", "xin nghỉ", REST, False)], 5, 30, None, "李组长，您好！我发烧了，今天想请假。", None),
 "q_late": ("short_message", MSG, "Hãy nhắn cho giám đốc Vương: chào, báo xe buýt đến muộn, rồi xin lỗi.", [("Gửi", "giám đốc Vương")],
            [("greeting", "lời chào", GREET, False), ("bus", "xe buýt đến muộn", ["公交车来晚了", "公交车晚了"], False), ("sorry", "lời xin lỗi", SORRY, False)], 5, 30, None,
            "王经理，您好！公交车来晚了，对不起！", None),
 "q_reply": ("short_message", MSG, "Tổ trưởng nhắn: mai làm từ 7 giờ. Hãy trả lời: bạn đã hiểu, và cảm ơn.", None,
             [("ok", "bạn đã hiểu", ["好的", "明白了", "我明白了", "知道了", "收到"], False), ("thanks", "lời cảm ơn", ["谢谢"], False)], 2, 20, None, "明白了，谢谢组长！", None),
 "r_form_bank": ("simple_form", FORM, "Hãy điền đơn mở thẻ ngân hàng với các thông tin trên thẻ.", [("Họ tên", "Nguyễn Nam"), ("Nước", "Việt Nam"), ("Điện thoại", "138-1234-5678")],
                 [("name", "họ tên", ["阮南"], True), ("country", "nước", ["越南"], True), ("phone", "số điện thoại", ["138-1234-5678"], True)], 2, 12, None,
                 "阮南 | 越南 | 138-1234-5678", ["name", "country", "phone"]),
 "r_form_dorm": ("simple_form", FORM, "Hãy điền phiếu đăng ký ký túc xá với các thông tin trên thẻ.", [("Họ tên", "Nguyễn Hải"), ("Địa chỉ", "Thượng Hải"), ("Điện thoại", "139-8765-4321")],
                 [("name", "họ tên", ["阮海"], True), ("address", "địa chỉ", ["上海"], True), ("phone", "số điện thoại", ["139-8765-4321"], True)], 2, 12, None,
                 "阮海 | 上海 | 139-8765-4321", ["name", "address", "phone"]),
 "r_note": ("short_message", SENT, "Hãy viết lời nhắn cho đồng nghiệp: máy bị hỏng, xin gọi tổ trưởng đến.", None,
            [("machine", "cái máy", ["机器"], False), ("broken", "máy bị hỏng", ["坏了", "有问题", "不动了"], False), ("call", "gọi tổ trưởng", ["叫组长", "告诉组长", "给组长打电话"], False)], 4, 25, None,
            "机器坏了，请叫组长来。", None),
}
# Open practice: menu slots, never scored.
OPEN = {
 "o_open": ("personal_profile", PROFILE, "Hãy viết vài câu về bạn. Bạn chọn nói gì cũng được.", [("about", "một câu về bạn", ["是", "叫", "住", "喜欢", "工作"])], 3, 40, "我叫阮花。我是越南人。我喜欢音乐。"),
 "p_open": ("simple_description", SENT, "Hãy viết vài câu về một ngày của bạn.", [("day", "một câu về ngày của bạn", ["起床", "吃饭", "上班", "下班", "睡觉", "每天"])], 3, 40, "我每天六点起床。晚上我在宿舍吃饭。"),
 "q_open": ("short_message", MSG, "Hãy viết một tin nhắn ngắn cho một người bạn.", [("message", "lời chào hoặc lời mời", ["你好", "一起", "吧", "谢谢"])], 3, 40, "小王，你好！星期六我们一起去看电影吧。"),
 "r_open": ("personal_profile", SENT, "Hãy viết vài câu về công việc của bạn.", [("work", "một câu về công việc", ["工作", "工厂", "公司", "组长", "同事", "上班"])], 3, 40, "我在工厂工作。我早上七点上班。我的组长很好。"),
}
RESERVED = {
 "cp5_profile_hua": ("personal_profile", PROFILE, "Bạn là Nguyễn Hoa. Hãy tự giới thiệu: tên, tuổi và thành phố, bằng câu hoàn chỉnh.", [("Tên", "Nguyễn Hoa"), ("Tuổi", "24"), ("Thành phố", "Bắc Kinh")],
                     [("name", "tên", ["阮花"], True), ("age", "tuổi", ["二十四岁"], True), ("city", "thành phố", ["北京"], True)], 6, 30, ["叫", "是", "住"], "我叫阮花。我今年二十四岁。我住在北京。", None),
 "cp5_profile_nam": ("personal_profile", PROFILE, "Bạn là Nguyễn Nam. Hãy viết về bạn: tên, nước của bạn và nơi bạn làm việc.", [("Tên", "Nguyễn Nam"), ("Nước", "Việt Nam"), ("Nơi làm việc", "nhà máy")],
                     [("name", "tên", ["阮南"], True), ("from", "nước của bạn", ["越南人", "越南"], True), ("work", "nơi làm việc", ["工厂"], True)], 6, 30, ["叫", "是", "在"],
                     "我叫阮南。我是越南人。我在工厂工作。", None),
 "cp5_like_music": ("simple_description", SENT, "Hãy viết một câu nói rằng bạn thích âm nhạc.", None,
                    [("like", "bạn thích âm nhạc", ["喜欢音乐"], False)], 2, 12, None, "我喜欢音乐。", None),
 "cp5_sister": ("simple_description", SENT, "Hãy viết hai câu về chị gái bạn: chị ấy tên là Nguyễn Hồng, và chị ấy là bác sĩ.", [("Tên", "Nguyễn Hồng")],
                [("name", "tên của chị ấy", ["阮红"], True), ("job", "nghề của chị ấy", ["医生"], False)], 4, 20, ["叫", "是"], "我姐姐叫阮红。她是医生。", None),
 "cp5_room": ("simple_description", SENT, "Hãy viết hai câu tả căn phòng: phòng nhỏ, và trong phòng có một cái giường.", None,
              [("small", "phòng nhỏ", ["房间很小", "房间不大"], False), ("bed", "có một cái giường", ["一张床"], False)], 4, 20, None, "我的房间很小。房间里有一张床。", None),
 "cp5_note_movie": ("short_message", MSG, "Hãy nhắn cho Tiểu Vương: rủ bạn ấy đi xem phim lúc 7 giờ.", [("Gửi", "Tiểu Vương"), ("Giờ", "7 giờ")],
                    [("movie", "bộ phim", ["看电影"], False), ("time", "giờ hẹn", ["七点"], True), ("invite", "lời rủ", ["吧", "好吗"], False)], 4, 25, None,
                    "小王，晚上七点我们去看电影吧？", None),
 "cp5_note_sick": ("short_message", MSG, "Hãy nhắn cho tổ trưởng: chào, báo bạn bị cảm, và hôm nay bạn xin nghỉ.", None,
                   [("greeting", "lời chào", GREET, False), ("cold", "bạn bị cảm", ["感冒"], False), ("rest", "xin nghỉ", REST, False)], 5, 30, None, "组长，您好！我感冒了，今天想请假。", None),
 "cp5_note_late": ("short_message", MSG, "Hãy nhắn cho giám đốc: xin lỗi, bạn sẽ đến muộn khoảng 15 phút.", [("Đến muộn", "15 phút")],
                   [("sorry", "lời xin lỗi", SORRY, False), ("minutes", "đến muộn bao lâu", ["十五分钟"], True), ("late", "bạn sẽ đến muộn", ["晚到", "迟到"], False)], 4, 25, None,
                   "对不起，我会晚到十五分钟。", None),
 "cp5_mail_shift": ("short_message", MSG, "Hãy nhắn cho giám đốc Vương: chào, rồi hỏi thứ Bảy bạn có thể nghỉ không.", [("Ngày", "thứ Bảy")],
                    [("greeting", "lời chào", GREET, False), ("day", "ngày nghỉ", ["星期六"], True), ("rest", "xin nghỉ", ["可以请假吗", "能请假吗", "可以休息吗", "能休息吗"], False)], 4, 25, None,
                    "王经理，您好！星期六我可以请假吗？", None),
 "cp5_form_bank": ("simple_form", FORM, "Hãy điền đơn mở thẻ ngân hàng với các thông tin trên thẻ.", [("Họ tên", "Nguyễn Hồng"), ("Nước", "Việt Nam"), ("Điện thoại", "137-2222-3333")],
                   [("name", "họ tên", ["阮红"], True), ("country", "nước", ["越南"], True), ("phone", "số điện thoại", ["137-2222-3333"], True)], 2, 12, None,
                   "阮红 | 越南 | 137-2222-3333", ["name", "country", "phone"]),
 "cp5_form_clinic": ("simple_form", FORM, "Hãy điền phiếu khám bệnh với các thông tin trên thẻ.", [("Họ tên", "Nguyễn Nam"), ("Sinh nhật", "ngày 5 tháng 4"), ("Điện thoại", "139-1111-2222")],
                     [("name", "họ tên", ["阮南"], True), ("birthday", "ngày sinh", ["四月五号"], True), ("phone", "số điện thoại", ["139-1111-2222"], True)], 2, 12, None,
                     "阮南 | 四月五号 | 139-1111-2222", ["name", "birthday", "phone"]),
 "cp5_form_work": ("simple_form", FORM, "Hãy điền phiếu nhân viên mới với các thông tin trên thẻ.", [("Họ tên", "Nguyễn Hoa"), ("Địa chỉ", "Quảng Châu"), ("Điện thoại", "136-4444-5555")],
                   [("name", "họ tên", ["阮花"], True), ("address", "địa chỉ", ["广州"], True), ("phone", "số điện thoại", ["136-4444-5555"], True)], 2, 12, None,
                   "阮花 | 广州 | 136-4444-5555", ["name", "address", "phone"]),
 "a1cap_note_station": ("short_message", MSG, "Hãy nhắn cho Nguyễn Hoa: hẹn gặp ở ga tàu hoả lúc 5 giờ.", [("Gửi", "Nguyễn Hoa"), ("Giờ", "5 giờ")],
                        [("place", "ga tàu hoả", ["火车站"], False), ("time", "giờ hẹn", ["五点"], True), ("meet", "lời hẹn gặp", ["见"], False)], 4, 25, None, "阮花，我们五点在火车站见吧。", None),
 "a1cap_note_bus": ("short_message", MSG, "Hãy nhắn cho Nguyễn Nam: báo xe buýt của bạn đến lúc 6 giờ.", [("Gửi", "Nguyễn Nam"), ("Giờ", "6 giờ")],
                    [("bus", "xe buýt", ["公交车"], False), ("time", "giờ xe đến", ["六点"], True)], 3, 25, None, "阮南，我的公交车六点到。", None),
 "a1cap_note_home": ("short_message", MSG, "Hãy nhắn cho Tiểu Lý: bạn đang ở siêu thị, và 5 giờ bạn về nhà.", [("Gửi", "Tiểu Lý"), ("Giờ", "5 giờ")],
                     [("place", "siêu thị", ["超市"], False), ("time", "giờ về nhà", ["五点"], True), ("home", "bạn về nhà", ["回家"], False)], 4, 25, None, "小李，我现在在超市，五点回家。", None),
 "a1cap_mail_absent": ("short_message", MSG, "Hãy nhắn cho giám đốc Vương: chào, báo thứ Năm bạn đi bệnh viện, nên bạn xin nghỉ.", [("Ngày", "thứ Năm")],
                       [("greeting", "lời chào", GREET, False), ("day", "ngày nghỉ", ["星期四"], True), ("hospital", "bệnh viện", ["医院"], False), ("rest", "xin nghỉ", REST, False)], 5, 30, None,
                       "王经理，您好！星期四我要去医院，想请假一天。", None),
}


def _widen(variants):
    """A slot also takes the other natural spelling of 哪儿/哪里, 这儿/这里 … (zh_text.natural_spellings). Numbers need
    nothing: the writing fold reads digits as hanzi numerals."""
    out = []
    for v in variants:
        for x in [v] + natural_spellings(v):
            if bare(x) not in {bare(y) for y in out}:
                out.append(x)
    return out


def task(slug, spec, reserved):
    fam, obj, instr, cue, slots, mn, mx, verbs, model, fields = spec
    tid = f"zh.write.{slug}"
    check_vi(tid, instr)
    for a, b in cue or []:
        check_vi(tid, a)
        check_vi(tid, b)
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
            check(tid, FIELDS[f][1])
        for value in model.split(" | "):
            if any("一" <= ch <= "鿿" for ch in value):
                check(tid, value)
    else:
        check(tid, model)
    t.update({"rubric": rubric, "modelAnswers": [model], "objectiveRefs": [obj], "lexemeRefs": [] if fields else content_refs(model), "scoredEligibility": reserved, "reserved": reserved, "sourceRef": "original-project"})
    return t


def open_task(slug, spec):
    fam, obj, instr, slots, mn, mx, model = spec
    tid = f"zh.write.{slug}"
    check(tid, model)
    check_vi(tid, instr)
    rubric = {"requiredSlots": [{"id": i, "description": {"vi": d}, "variants": _widen(v), "cueProvided": False} for i, d, v in slots], "minTokens": mn, "maxTokens": mx}
    return {"id": tid, "taskFamily": fam, "mode": "open", "instruction": {"vi": instr}, "rubric": rubric, "modelAnswers": [model], "objectiveRefs": [obj], "lexemeRefs": content_refs(model), "scoredEligibility": False, "reserved": False, "sourceRef": "original-project"}


tasks = [task(s, x, False) for s, x in GUIDED.items()] + [open_task(s, x) for s, x in OPEN.items()] + [task(s, x, True) for s, x in RESERVED.items()]
write_jsonl(f"{DRAFTS}/writing/OUTPUT.jsonl", tasks)
report()
print(len(tasks), "tasks", sum(t["reserved"] for t in tasks), "reserved", dict(Counter(t["taskFamily"] for t in tasks)))

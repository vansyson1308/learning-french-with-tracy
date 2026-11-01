"""en-vi writing: guided and open tasks of units o-r, and 16 reserved tasks for checkpoint 5 and the capstone (four short messages:
one objective per domain, two in each form). Exam writing tasks are added by en-exam.py.
Writes content/en/_drafts/writing/OUTPUT.jsonl. Rubric notes: digits are normalized ("at 3" = "at three": one variant);
contractions too ("i'm" = "i am"); a slot with several variants must be realized once in the model answer.
Clock cues are written in Vietnamese ("3 giờ"), never 3:00. usage: python -I en-writing-s5.py <repo root>
"""
import os, sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from en_refs import check, content_refs, report, write_jsonl

DRAFTS = sys.argv[1] + "/content/en/_drafts"
PROFILE, SENT, MSG, FORM = "en.obj.writing.personal_info", "en.obj.writing.phrases_sentences", "en.obj.writing.short_message", "en.obj.writing.form_filling"
GREET = ["hi", "hello", "dear"]
FORMAL = ["dear", "hello", "good morning"]
CLOSE = ["see you", "bye", "goodbye", "thanks", "thank you"]
SIGN = ["best regards", "regards", "thank you", "thanks"]
NAME = lambda n: [f"my name is {n}", f"i am {n}", f"my name's {n}"]
BE = ["am", "is"]
# slug -> (family, objective, instruction, cue facts, slots (id, description, variants, cue provided), min, max, sentence verbs, model, form fields)
GUIDED = {
 "o_name": ("personal_profile", PROFILE, "Bạn là Mai. Hãy viết một câu tiếng Anh ngắn nói tên của bạn.", [("Tên của bạn", "Mai")],
            [("name", "tên của bạn", NAME("mai"), True)], 2, 12, BE, "My name is Mai.", None),
 "o_age": ("personal_profile", PROFILE, "Bạn 30 tuổi. Hãy viết một câu tiếng Anh nói tuổi của bạn.", [("Tuổi", "30")],
           [("age", "tuổi của bạn", ["i am 30", "30 years old"], True)], 3, 12, BE, "I am 30 years old.", None),
 "o_home": ("personal_profile", PROFILE, "Hãy viết hai câu tiếng Anh: quê của bạn và thành phố bạn đang sống.", [("Nước", "Vietnam"), ("Thành phố", "Hanoi")],
            [("from", "bạn đến từ đâu", ["from vietnam", "vietnamese"], True), ("city", "thành phố bạn sống", ["in hanoi"], True)], 5, 16, ["am", "come", "live"], "I am from Vietnam. I live in Hanoi.", None),
 "o_family": ("personal_profile", PROFILE, "Hãy viết hai câu tiếng Anh: bạn có hai đứa con và bạn là công nhân.", None,
              [("children", "hai đứa con", ["two children"], False), ("job", "công việc của bạn", ["a worker"], False)], 6, 16, ["have", "am"], "I have two children. I am a worker.", None),
 "o_all": ("personal_profile", PROFILE, "Hãy viết ba câu ngắn về bạn: tên, tuổi và thành phố.", [("Tên", "Lan"), ("Tuổi", "28"), ("Thành phố", "Hue")],
           [("name", "tên", NAME("lan"), True), ("age", "tuổi", ["28"], True), ("city", "thành phố", ["in hue"], True)], 8, 25, BE + ["live"], "My name is Lan. I am 28 years old. I live in Hue.", None),
 "p_who": ("simple_description", SENT, "Hãy viết một câu: Anna uống cà phê vào buổi sáng.", [("Người", "Anna")],
           [("drink", "uống cà phê", ["drinks coffee"], False), ("morning", "vào buổi sáng", ["in the morning"], False)], 4, 12, ["drinks"], "Anna drinks coffee in the morning.", None),
 "p_neg": ("simple_description", SENT, "Hãy viết một câu phủ định: bạn không uống bia.", None,
           [("neg", "bạn không uống bia", ["i do not drink beer"], False)], 3, 10, ["do not"], "I don't drink beer.", None),
 "p_ask": ("simple_description", SENT, "Hãy viết một câu hỏi: Bạn sống ở đâu?", None,
           [("ask", "câu hỏi về nơi sống", ["where do you live"], False)], 3, 8, None, "Where do you live?", None),
 "p_like": ("simple_description", SENT, "Hãy viết một câu nói rằng bạn thích bóng đá.", None,
            [("like", "bạn thích bóng đá", ["i like soccer", "i love soccer"], False)], 3, 10, ["like", "love"], "I like soccer.", None),
 "p_because": ("simple_description", SENT, "Hãy viết một câu: hôm nay bạn ở nhà vì bạn bị ốm.", None,
               [("home", "ở nhà", ["at home"], False), ("because", "từ nối chỉ lý do", ["because"], False), ("sick", "bạn bị ốm", ["i am sick"], False)], 5, 16, ["am"], "I am at home today because I am sick.", None),
 "p_scene": ("simple_description", SENT, "Hãy viết hai câu tả bức tranh: con mèo nhỏ, ngôi nhà to.", None,
             [("cat", "con mèo nhỏ", ["the cat is small", "a small cat"], False), ("house", "ngôi nhà to", ["the house is big", "a big house"], False)], 6, 16, ["is"], "The cat is small. The house is big.", None),
 "q_meet": ("short_message", MSG, "Hãy nhắn cho Anna: chào cô ấy, rồi hẹn gặp ở quán cà phê lúc ba giờ.", [("Gửi", "Anna"), ("Giờ", "3 giờ")],
            [("greeting", "lời chào", GREET, False), ("place", "quán cà phê", ["coffee shop", "cafe"], False), ("time", "giờ hẹn", ["at three"], True)], 5, 20, None, "Hi Anna, let's meet at the coffee shop at three.", None),
 "q_late": ("short_message", MSG, "Hãy nhắn cho Lan: chào, báo hôm nay bạn đến muộn, rồi chào kết.", [("Gửi", "Lan")],
            [("greeting", "lời chào", GREET, False), ("late", "bạn đến muộn", ["late"], False), ("closing", "lời chào kết", CLOSE, False)], 5, 20, None, "Hi Lan, I am late today. See you soon.", None),
 "q_report": ("short_message", MSG, "Hãy viết email ngắn cho chị Brown: chào trang trọng, báo bạn đang gửi báo cáo, rồi chào kết.", [("Gửi", "Ms. Brown")],
              [("greeting", "lời chào trang trọng", FORMAL, False), ("report", "báo cáo", ["report"], False), ("closing", "lời chào kết", SIGN, False)], 6, 25, None, "Dear Ms. Brown, I am sending you the report today. Best regards, Minh", None),
 "q_meeting": ("short_message", MSG, "Hãy viết email ngắn cho Tom: báo cuộc họp vào thứ Hai lúc chín giờ.", [("Gửi", "Tom"), ("Ngày", "Monday"), ("Giờ", "9 giờ")],
               [("greeting", "lời chào", GREET, False), ("meeting", "cuộc họp", ["meeting"], False), ("day", "ngày họp", ["monday"], True), ("time", "giờ họp", ["at nine"], True)], 6, 25, None, "Hello Tom, the meeting is on Monday at nine.", None),
 "q_own": ("short_message", MSG, "Hãy nhắn cho Hoa: hẹn gặp vào thứ Bảy, rồi chào kết.", [("Gửi", "Hoa"), ("Ngày", "Saturday")],
           [("greeting", "lời chào", GREET, False), ("day", "ngày hẹn", ["saturday"], True), ("closing", "lời chào kết", CLOSE, False)], 5, 20, None, "Hi Hoa, let's meet on Saturday. See you!", None),
 "r_form_course": ("simple_form", FORM, "Hãy điền phiếu đăng ký khoá học với các thông tin trên thẻ.", [("Tên", "Minh"), ("Thành phố", "Hue"), ("Điện thoại", "0912 345 678")],
                   [("name", "tên", ["minh"], True), ("city", "thành phố", ["hue"], True), ("phone", "số điện thoại", ["0912 345 678", "0912345678"], True)], 2, 12, None, "Minh | Hue | 0912 345 678",
                   [("first_name", "First name", "name"), ("city", "City", "city"), ("phone", "Phone number", "phone")]),
 "r_form_job": ("simple_form", FORM, "Hãy điền phiếu xin việc với các thông tin trên thẻ.", [("Tên", "Lan"), ("Họ", "Tran"), ("Công việc", "nurse")],
                [("first", "tên", ["lan"], True), ("last", "họ của bạn", ["tran"], True), ("job", "công việc", ["nurse"], True)], 2, 12, None, "Lan | Tran | nurse",
                [("first_name", "First name", "first"), ("last_name", "Last name", "last"), ("job", "Job", "job")]),
 "r_form_hotel": ("simple_form", FORM, "Hãy điền phiếu khách sạn với các thông tin trên thẻ.", [("Họ", "Nguyen"), ("Địa chỉ", "12 Green Street"), ("Điện thoại", "0987 654 321")],
                  [("last", "họ của bạn", ["nguyen"], True), ("street", "địa chỉ", ["12 green street"], True), ("phone", "số điện thoại", ["0987 654 321", "0987654321"], True)], 2, 12, None, "Nguyen | 12 Green Street | 0987 654 321",
                  [("last_name", "Last name", "last"), ("address", "Address", "street"), ("phone", "Phone number", "phone")]),
 "r_note": ("short_message", SENT, "Hãy viết lời nhắn cho Tom: máy in không chạy, xin anh ấy gọi cho quản lý.", [("Gửi", "Tom")],
            [("printer", "máy in", ["printer"], False), ("broken", "không chạy", ["does not work"], False), ("call", "gọi cho quản lý", ["call the manager"], False)], 6, 25, None, "Tom, the printer does not work. Please call the manager.", None),
 "r_mail_hotel": ("short_message", MSG, "Hãy viết email ngắn cho một khách sạn: chào, hỏi một phòng cho thứ Bảy, rồi chào kết.", [("Ngày", "Saturday")],
                  [("greeting", "lời chào", FORMAL, False), ("room", "một phòng", ["room"], False), ("day", "thứ Bảy", ["saturday"], True), ("closing", "lời chào kết", SIGN, False)], 8, 30, None, "Dear Sir, I would like a room for Saturday. Best regards, Minh", None),
}
# Open practice: menu slots, never scored.
OPEN = {
 "o_open": ("personal_profile", PROFILE, "Hãy viết vài câu về bạn. Bạn chọn nói gì cũng được.", [("about", "một câu về bạn", ["i am", "my name", "i live", "i have", "i work", "i like"])], 3, 40, "My name is Hoa. I live in Hanoi and I like music."),
 "p_open": ("simple_description", SENT, "Hãy viết vài câu về một ngày của bạn.", [("day", "một câu về ngày của bạn", ["i go", "i work", "i eat", "i drink", "every day", "in the morning", "in the evening"])], 3, 40, "I work in the morning. In the evening I eat with my family."),
 "q_open": ("short_message", MSG, "Hãy viết một tin nhắn ngắn cho một người bạn.", [("greeting", "lời chào hoặc lời kết", ["hi", "hello", "dear", "see you", "thanks", "bye"])], 3, 40, "Hi Lan, how are you? See you tomorrow."),
 "r_open": ("personal_profile", SENT, "Hãy viết vài câu về công việc của bạn.", [("work", "một câu về công việc", ["i work", "my job", "i am a", "my company", "my boss"])], 3, 40, "I work in an office. My boss is very nice."),
}
RESERVED = {
 "cp5_profile_hoa": ("personal_profile", PROFILE, "Bạn là Hoa. Hãy tự giới thiệu: tên, tuổi và thành phố, bằng câu hoàn chỉnh.", [("Tên", "Hoa"), ("Tuổi", "24"), ("Thành phố", "Hanoi")],
                     [("name", "tên", NAME("hoa"), True), ("age", "tuổi", ["24"], True), ("city", "thành phố", ["in hanoi"], True)], 8, 30, BE + ["live"], "My name is Hoa. I am 24 years old. I live in Hanoi.", None),
 "cp5_profile_tuan": ("personal_profile", PROFILE, "Bạn là Tuấn. Hãy viết về bạn: tên, nước của bạn và nơi bạn làm việc.", [("Tên", "Tuan"), ("Nước", "Vietnam"), ("Nơi làm việc", "factory")],
                      [("name", "tên", NAME("tuan"), True), ("from", "nước của bạn", ["from vietnam", "vietnamese"], True), ("work", "nơi làm việc", ["factory"], True)], 8, 30, BE + ["work"], "My name is Tuan. I am from Vietnam. I work in a factory.", None),
 "cp5_like_music": ("simple_description", SENT, "Hãy viết một câu nói rằng bạn thích âm nhạc.", None,
                    [("like", "bạn thích âm nhạc", ["i like music", "i love music"], False)], 3, 10, ["like", "love"], "I like music.", None),
 "cp5_sister": ("simple_description", SENT, "Hãy viết hai câu về chị gái bạn: chị ấy tên là Linh và chị ấy làm việc ở Hà Nội.", [("Tên", "Linh"), ("Thành phố", "Hanoi")],
                [("name", "tên của chị ấy", ["her name is linh", "she is linh"], True), ("work", "nơi chị ấy làm việc", ["works in hanoi"], True)], 6, 20, ["is", "works"], "Her name is Linh. She works in Hanoi.", None),
 "cp5_room": ("simple_description", SENT, "Hãy viết hai câu tả căn phòng: cái giường to, cái bàn nhỏ.", None,
              [("bed", "cái giường to", ["the bed is big", "a big bed"], False), ("table", "cái bàn nhỏ", ["the table is small", "a small table"], False)], 6, 16, ["is"], "The bed is big. The table is small.", None),
 "cp5_note_peter": ("short_message", MSG, "Hãy nhắn cho Peter: chào anh ấy, rồi hẹn đi xem phim lúc tám giờ.", [("Gửi", "Peter"), ("Giờ", "8 giờ")],
                    [("greeting", "lời chào", GREET, False), ("movie", "bộ phim", ["movie"], False), ("time", "giờ hẹn", ["at eight"], True)], 5, 20, None, "Hi Peter, let's watch a movie at eight.", None),
 "cp5_note_sick": ("short_message", MSG, "Hãy nhắn cho Mai: chào, báo hôm nay bạn không đến được vì bị ốm, rồi chào kết.", [("Gửi", "Mai")],
                    [("greeting", "lời chào", GREET, False), ("sick", "bạn bị ốm", ["sick"], False), ("closing", "lời chào kết", CLOSE, False)], 6, 25, None, "Hi Mai, I can't come today because I am sick. See you tomorrow.", None),
 "cp5_mail_boss": ("short_message", MSG, "Hãy viết email ngắn cho anh Lee: chào trang trọng, xin một cuộc hẹn vào thứ Ba, rồi chào kết.", [("Gửi", "Mr. Lee"), ("Ngày", "Tuesday")],
                   [("greeting", "lời chào trang trọng", FORMAL, False), ("appointment", "cuộc hẹn", ["appointment", "meeting"], False), ("day", "ngày hẹn", ["tuesday"], True), ("closing", "lời chào kết", SIGN, False)], 8, 30, None, "Dear Mr. Lee, I would like an appointment on Tuesday. Best regards, Hung", None),
 "cp5_mail_shop": ("short_message", MSG, "Hãy viết email ngắn cho một cửa hàng: chào, hỏi giá một chiếc điện thoại, rồi chào kết.", None,
                   [("greeting", "lời chào", FORMAL, False), ("price", "câu hỏi về giá", ["how much"], False), ("phone", "điện thoại", ["phone"], False), ("closing", "lời chào kết", SIGN, False)], 6, 30, None, "Hello, how much is this phone? Thank you, Lan", None),
 "cp5_form_clinic": ("simple_form", FORM, "Hãy điền phiếu của phòng khám với các thông tin trên thẻ.", [("Tên", "Hung"), ("Tuổi", "41"), ("Điện thoại", "0903 111 222")],
                     [("name", "tên", ["hung"], True), ("age", "tuổi", ["41"], True), ("phone", "số điện thoại", ["0903 111 222", "0903111222"], True)], 2, 12, None, "Hung | 41 | 0903 111 222",
                     [("first_name", "First name", "name"), ("age", "Age", "age"), ("phone", "Phone number", "phone")]),
 "cp5_form_bank": ("simple_form", FORM, "Hãy điền phiếu của ngân hàng với các thông tin trên thẻ.", [("Tên", "Linh"), ("Họ", "Pham"), ("Địa chỉ", "5 River Road")],
                   [("first", "tên", ["linh"], True), ("last", "họ của bạn", ["pham"], True), ("street", "địa chỉ", ["5 river road"], True)], 2, 12, None, "Linh | Pham | 5 River Road",
                   [("first_name", "First name", "first"), ("last_name", "Last name", "last"), ("address", "Address", "street")]),
 "cp5_form_work": ("simple_form", FORM, "Hãy điền phiếu nhân viên mới với các thông tin trên thẻ.", [("Họ", "Le"), ("Công việc", "driver"), ("Điện thoại", "0911 222 333")],
                   [("last", "họ của bạn", ["le"], True), ("job", "công việc", ["driver"], True), ("phone", "số điện thoại", ["0911 222 333", "0911222333"], True)], 2, 12, None, "Le | driver | 0911 222 333",
                   [("last_name", "Last name", "last"), ("job", "Job", "job"), ("phone", "Phone number", "phone")]),
 "a1cap_note_sarah": ("short_message", MSG, "Hãy nhắn cho Sarah: chào, hẹn gặp ở nhà ga lúc năm giờ.", [("Gửi", "Sarah"), ("Giờ", "5 giờ")],
                      [("greeting", "lời chào", GREET, False), ("place", "nhà ga", ["station"], False), ("time", "giờ hẹn", ["at five"], True)], 5, 20, None, "Hi Sarah, let's meet at the station at five.", None),
 "a1cap_note_bus": ("short_message", MSG, "Hãy nhắn cho Tom: chào anh ấy, rồi báo xe buýt của bạn đến lúc sáu giờ.", [("Gửi", "Tom"), ("Giờ", "6 giờ")],
                    [("greeting", "lời chào", GREET, False), ("bus", "xe buýt", ["bus"], False), ("time", "giờ xe đến", ["at six"], True)], 5, 20, None, "Hi Tom, my bus arrives at six.", None),
 "a1cap_note_home": ("short_message", MSG, "Hãy nhắn cho Hoa: chào, báo bạn đang ở siêu thị và về nhà lúc năm giờ, rồi chào kết.", [("Gửi", "Hoa"), ("Giờ", "5 giờ")],
                     [("greeting", "lời chào", GREET, False), ("place", "siêu thị", ["supermarket"], False), ("time", "giờ về nhà", ["at five"], True), ("closing", "lời chào kết", CLOSE, False)], 6, 25, None, "Hi Hoa, I am at the supermarket. I will come home at five. See you!", None),
 "a1cap_mail_smith": ("short_message", MSG, "Hãy viết email ngắn cho chị Smith: chào trang trọng, báo thứ Năm bạn nghỉ làm vì bị ốm, rồi chào kết.", [("Gửi", "Ms. Smith"), ("Ngày", "Thursday")],
                      [("greeting", "lời chào trang trọng", FORMAL, False), ("day", "ngày nghỉ", ["thursday"], True), ("sick", "bạn bị ốm", ["sick"], False), ("closing", "lời chào kết", SIGN, False)], 8, 30, None, "Dear Ms. Smith, I can't come to work on Thursday because I am sick. Best regards, Nam", None),
}


def task(slug, spec, reserved):
    fam, obj, instr, cue, slots, mn, mx, verbs, model, fields = spec
    tid = f"en.write.{slug}"
    rubric = {"requiredSlots": [{"id": i, "description": {"vi": d}, "variants": v, "cueProvided": c} for i, d, v, c in slots], "minTokens": mn, "maxTokens": mx}
    if verbs:
        rubric["requireSentenceVerbs"] = verbs
    t = {"id": tid, "taskFamily": fam, "mode": "guided", "instruction": {"vi": instr}}
    if cue:
        t["cueFacts"] = [{"label": {"vi": a}, "value": b} for a, b in cue]
    if fields:
        t["formFields"] = [{"id": a, "label": b, "slotId": c} for a, b, c in fields]
    if not fields:
        check(tid, model)
    t.update({"rubric": rubric, "modelAnswers": [model], "objectiveRefs": [obj], "lexemeRefs": [] if fields else content_refs(model), "scoredEligibility": reserved, "reserved": reserved, "sourceRef": "original-project"})
    return t


def open_task(slug, spec):
    fam, obj, instr, slots, mn, mx, model = spec
    tid = f"en.write.{slug}"
    check(tid, model)
    rubric = {"requiredSlots": [{"id": i, "description": {"vi": d}, "variants": v, "cueProvided": False} for i, d, v in slots], "minTokens": mn, "maxTokens": mx}
    return {"id": tid, "taskFamily": fam, "mode": "open", "instruction": {"vi": instr}, "rubric": rubric, "modelAnswers": [model], "objectiveRefs": [obj], "lexemeRefs": content_refs(model), "scoredEligibility": False, "reserved": False, "sourceRef": "original-project"}


tasks = [task(s, x, False) for s, x in GUIDED.items()] + [open_task(s, x) for s, x in OPEN.items()] + [task(s, x, True) for s, x in RESERVED.items()]
write_jsonl(f"{DRAFTS}/writing/OUTPUT.jsonl", tasks)
report()
print(len(tasks), "tasks", sum(t["reserved"] for t in tasks), "reserved", dict(Counter(t["taskFamily"] for t in tasks)))

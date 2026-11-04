"""ko-vi writing (P4e session 3), after ja-writing-s5.py: guided and open tasks of units o-r, and 16 reserved tasks for
checkpoint 5 and the capstone (four short messages, two in each form). Exam writing tasks are added by the exam step
(TOPIK I has no writing section, so none). Writes content/ko/_drafts/writing/OUTPUT.jsonl.

Model answers are 해요체 (합쇼체 in set phrases). Slot variants are whole words or phrases, never a bare stem: the
writing grader matches token runs after the ko rules' fold (spacing-insensitive tokens over the lexicon, digits spelled
by their counter), so a variant must be a run the answer itself produces. Each slot lists the fair spellings of
ko_text.variants for its phrase (안 ⇄ -지 않아요, 합쇼체, the object particle dropped). Numbers are Hangul in the
variants; a learner who types digits is folded to the same words. Names are cue facts in Vietnamese spelling with the
Hangul spelling the answer uses; form values are a name, a place and a number. No requireSentenceVerbs: a ko verb is
an ending, not a token. usage: python -I ko-writing-s5.py <repo root>
"""
import os, re, sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ko_layers import DRAFTS, INDEX, LEX, check, check_vi, content_refs, report, write_jsonl  # noqa: E402
from ko_text import _bare, ends_in_consonant, variants as fair  # noqa: E402

PROFILE, SENT, MSG, FORM = "ko.obj.writing.personal_info", "ko.obj.writing.phrases_sentences", "ko.obj.writing.short_message", "ko.obj.writing.form_filling"
# A greeting is one slot realized once: 반장님, 안녕하세요 is one greeting (the name of address is not a variant).
GREET = ["안녕하세요"]
SORRY = ["죄송합니다", "미안해요"]
REST = ["쉬고 싶어요", "쉬어도 돼요", "쉴게요", "못 가요", "출근 못 해요", "쉴 거예요"]
FIELDS = {"name": ("name", "이름"), "address": ("address", "주소"), "phone": ("phone", "전화번호"), "birthday": ("birthday", "생일"), "country": ("country", "나라")}
# slug -> (family, objective, instruction, cue facts, slots (id, description, variants, cue provided), min, max, model, form fields)
GUIDED = {
 "o_name": ("personal_profile", PROFILE, "Bạn là Nam. Hãy viết một câu tiếng Hàn nói tên của bạn.", [("Tên", "Nam (viết 남)")],
            [("name", "tên của bạn", ["남"], True)], 2, 12, "저는 남이에요.", None),
 "o_age": ("personal_profile", PROFILE, "Bạn 23 tuổi. Hãy viết một câu tiếng Hàn nói tuổi của bạn.", [("Tuổi", "23")],
           [("age", "tuổi của bạn", ["스물세 살"], True)], 2, 12, "저는 스물세 살이에요.", None),
 "o_home": ("personal_profile", PROFILE, "Hãy viết hai câu: bạn đến từ nước nào và bây giờ bạn sống ở thành phố nào.", [("Nước", "Việt Nam"), ("Thành phố", "Ansan (viết 안산)")],
            [("from", "bạn đến từ đâu", ["베트남에서", "베트남 사람"], True), ("city", "thành phố bạn sống", ["안산"], True)], 4, 20, "베트남에서 왔어요. 지금 안산에 살아요.", None),
 "o_family": ("personal_profile", PROFILE, "Hãy viết hai câu: bạn có hai em gái, và bạn thích nấu ăn.", None,
              [("sisters", "hai em gái", ["여동생이 두 명", "여동생 두 명", "여동생은 두 명"], False),
               ("like", "bạn thích nấu ăn", ["요리하는 것을 좋아해요", "요리하는 것이 좋아요"], False)], 4, 20, "여동생이 두 명 있어요. 요리하는 것을 좋아해요.", None),
 "o_all": ("personal_profile", PROFILE, "Hãy viết ba câu ngắn về bạn: tên, tuổi và thành phố bạn sống.", [("Tên", "Lan (viết 란)"), ("Tuổi", "28"), ("Thành phố", "Suwon (viết 수원)")],
           [("name", "tên", ["란"], True), ("age", "tuổi", ["스물여덟 살"], True), ("city", "thành phố", ["수원"], True)], 6, 30, "저는 란이에요. 스물여덟 살이에요. 수원에 살아요.", None),
 "p_who": ("simple_description", SENT, "Hãy viết một câu: anh Nam uống cà phê vào buổi sáng.", [("Người", "Nam (viết 남)")],
           [("drink", "uống cà phê", ["커피를 마셔요"], False), ("morning", "vào buổi sáng", ["아침에", "매일 아침"], False)], 3, 15, "남 씨는 아침에 커피를 마셔요.", None),
 "p_neg": ("simple_description", SENT, "Hãy viết một câu phủ định: bạn không uống rượu.", None,
           [("neg", "bạn không uống rượu", ["술을 안 마셔요", "술은 안 마셔요"], False)], 2, 12, "저는 술을 안 마셔요.", None),
 "p_cant": ("simple_description", SENT, "Hãy viết một câu: hôm nay bạn không đi làm được.", None,
            [("cant", "bạn không đi làm được", ["못 가요", "출근 못 해요"], False)], 2, 12, "오늘은 회사에 못 가요.", None),
 "p_ask": ("simple_description", SENT, "Hãy viết một câu hỏi lịch sự: Bạn sống ở đâu?", None,
           [("ask", "câu hỏi về nơi sống", ["어디에 살아요", "어디에서 살아요", "어디 살아요", "어디에 사세요"], False)], 2, 12, "어디에 살아요?", None),
 "p_link": ("simple_description", SENT, "Hãy viết hai câu: bạn ăn sáng, sau đó bạn đi làm. Dùng một từ nối.", None,
            [("breakfast", "bạn ăn sáng", ["아침을 먹어요", "아침을 먹었어요"], False), ("link", "từ nối", ["그리고"], False),
             ("work", "bạn đi làm", ["회사에 가요", "출근해요", "공장에 가요"], False)], 5, 25, "아침을 먹어요. 그리고 회사에 가요.", None),
 "q_sick": ("short_message", MSG, "Hãy nhắn cho tổ trưởng: chào, báo bạn bị ốm, và hôm nay bạn xin nghỉ.", None,
            [("greeting", "lời chào", GREET, False), ("sick", "bạn bị ốm", ["몸이 아파요", "아파요", "감기에 걸렸어요"], False), ("rest", "xin nghỉ", REST, False)], 5, 30,
            "반장님, 안녕하세요. 몸이 아파요. 오늘은 쉬고 싶어요.", None),
 "q_late": ("short_message", MSG, "Hãy nhắn cho tổ trưởng: báo xe buýt không đến, xin lỗi, và nói bạn sẽ đến muộn.", None,
            [("bus", "xe buýt không đến", ["버스가 안 와요", "버스가 늦어요"], False), ("sorry", "lời xin lỗi", SORRY, False), ("late", "bạn sẽ đến muộn", ["늦어요", "늦을 거예요"], False)], 5, 30,
            "반장님, 버스가 안 와요. 죄송합니다. 조금 늦어요.", None),
 "q_reply": ("short_message", MSG, "Tổ trưởng nhắn: mai làm từ 7 giờ. Hãy trả lời: bạn đã hiểu, và cảm ơn.", None,
             [("ok", "bạn đã hiểu", ["알겠습니다"], False), ("thanks", "lời cảm ơn", ["감사합니다", "고맙습니다", "고마워요"], False)], 2, 20, "네, 알겠습니다. 감사합니다.", None),
 "r_form_center": ("simple_form", FORM, "Hãy điền phiếu ở trung tâm việc làm với các thông tin trên thẻ.", [("Tên", "Nguyễn Nam (viết 응우옌 남)"), ("Địa chỉ", "Ansan (viết 안산)"), ("Điện thoại", "010-1234-5678")],
                   [("name", "tên", ["응우옌 남"], True), ("address", "địa chỉ", ["안산"], True), ("phone", "số điện thoại", ["010-1234-5678"], True)], 2, 12, "응우옌 남 | 안산 | 010-1234-5678",
                   ["name", "address", "phone"]),
 "r_form_clinic": ("simple_form", FORM, "Hãy điền phiếu của phòng khám với các thông tin trên thẻ.", [("Tên", "Lan (viết 란)"), ("Sinh nhật", "ngày 20 tháng 9 (viết 구월 이십일)"), ("Điện thoại", "010-8765-4321")],
                   [("name", "tên", ["란"], True), ("birthday", "ngày sinh", ["구월 이십일"], True), ("phone", "số điện thoại", ["010-8765-4321"], True)], 2, 12, "란 | 구월 이십일 | 010-8765-4321",
                   ["name", "birthday", "phone"]),
 "r_note": ("short_message", SENT, "Hãy viết lời nhắn cho đồng nghiệp: máy dừng rồi, xin gọi tổ trưởng giúp.", None,
            [("machine", "máy dừng rồi", ["기계가 멈췄어요", "기계가 안 돼요"], False), ("call", "gọi tổ trưởng", ["반장님을 불러 주세요", "반장님에게 전화해 주세요"], False)], 4, 25,
            "기계가 멈췄어요. 반장님을 불러 주세요.", None),
}
# Open practice: menu slots, never scored.
OPEN = {
 "o_open": ("personal_profile", PROFILE, "Hãy viết vài câu về bạn. Bạn chọn nói gì cũng được.", [("about", "một câu về bạn", ["저는", "살아요", "좋아해요", "일해요"])], 3, 40, "저는 호아예요. 하노이에서 왔어요. 음악을 좋아해요."),
 "p_open": ("simple_description", SENT, "Hãy viết vài câu về một ngày của bạn.", [("day", "một câu về ngày của bạn", ["일어나요", "먹어요", "일해요", "자요", "매일"])], 3, 40, "매일 여섯 시에 일어나요. 저녁에는 기숙사에서 밥을 먹어요."),
 "q_open": ("short_message", MSG, "Hãy viết một tin nhắn ngắn cho một người bạn.", [("message", "lời chào hoặc lời mời", ["안녕하세요", "고마워요", "같이", "볼까요"])], 3, 40, "란 씨, 안녕하세요. 토요일에 같이 영화 볼까요?"),
 "r_open": ("personal_profile", SENT, "Hãy viết vài câu về công việc của bạn.", [("work", "một câu về công việc", ["공장", "회사", "일해요", "반장님", "동료"])], 3, 40, "공장에서 일해요. 일은 여덟 시부터예요. 반장님은 아주 친절해요."),
}
RESERVED = {
 "cp5_profile_hoa": ("personal_profile", PROFILE, "Bạn là Hoa. Hãy tự giới thiệu: tên, tuổi và thành phố, bằng câu hoàn chỉnh.", [("Tên", "Hoa (viết 호아)"), ("Tuổi", "24"), ("Thành phố", "Suwon (viết 수원)")],
                     [("name", "tên", ["호아"], True), ("age", "tuổi", ["스물네 살"], True), ("city", "thành phố", ["수원"], True)], 6, 30, "저는 호아예요. 스물네 살이에요. 수원에 살아요.", None),
 "cp5_profile_tuan": ("personal_profile", PROFILE, "Bạn là Tuấn. Hãy viết về bạn: tên, nước của bạn và nơi bạn làm việc.", [("Tên", "Tuấn (viết 뚜언)"), ("Nước", "Việt Nam"), ("Nơi làm việc", "nhà máy")],
                      [("name", "tên", ["뚜언"], True), ("from", "nước của bạn", ["베트남에서", "베트남 사람"], True), ("work", "nơi làm việc", ["공장"], True)], 6, 30,
                      "저는 뚜언이에요. 베트남에서 왔어요. 공장에서 일해요.", None),
 "cp5_like_music": ("simple_description", SENT, "Hãy viết một câu nói rằng bạn thích âm nhạc.", None,
                    [("like", "bạn thích âm nhạc", ["음악을 좋아해요", "음악이 좋아요"], False)], 2, 12, "저는 음악을 좋아해요.", None),
 "cp5_sister": ("simple_description", SENT, "Hãy viết hai câu về chị gái bạn (bạn là nữ): chị ấy tên là Thuỷ, và chị ấy là y tá.", [("Tên", "Thuỷ (viết 투이)")],
                [("name", "tên của chị ấy", ["투이"], True), ("job", "nghề của chị ấy", ["간호사"], False)], 4, 20, "우리 언니는 투이예요. 간호사예요.", None),
 "cp5_room": ("simple_description", SENT, "Hãy viết hai câu tả căn phòng: phòng nhỏ, và trong phòng có một cái giường.", None,
              [("small", "phòng nhỏ", ["방이 작아요", "방은 작아요", "작은 방"], False), ("bed", "có một cái giường", ["침대가 있어요", "침대가 하나 있어요", "침대 하나가 있어요"], False)], 4, 20,
              "방이 작아요. 침대가 하나 있어요.", None),
 "cp5_note_movie": ("short_message", MSG, "Hãy nhắn cho Lan: rủ bạn ấy đi xem phim lúc 7 giờ.", [("Gửi", "Lan (viết 란)"), ("Giờ", "7 giờ")],
                    [("movie", "bộ phim", ["영화"], False), ("time", "giờ hẹn", ["일곱 시"], True), ("invite", "lời rủ", ["볼까요", "봐요"], False)], 4, 25, "란 씨, 일곱 시에 같이 영화 볼까요?", None),
 "cp5_note_sick": ("short_message", MSG, "Hãy nhắn cho tổ trưởng: chào, báo bạn bị cảm, và hôm nay bạn xin nghỉ.", None,
                   [("greeting", "lời chào", GREET, False), ("cold", "bạn bị cảm", ["감기"], False), ("rest", "xin nghỉ", REST, False)], 5, 30, "반장님, 안녕하세요. 감기에 걸렸어요. 오늘은 쉬고 싶어요.", None),
 "cp5_note_late": ("short_message", MSG, "Hãy nhắn cho tổ trưởng: xin lỗi, bạn sẽ đến muộn khoảng 15 phút.", [("Đến muộn", "15 phút")],
                   [("sorry", "lời xin lỗi", SORRY, False), ("minutes", "đến muộn bao lâu", ["십오 분"], True), ("late", "bạn sẽ đến muộn", ["늦어요", "늦을 거예요"], False)], 4, 25,
                   "죄송합니다. 십오 분 늦어요.", None),
 "cp5_mail_shift": ("short_message", MSG, "Hãy nhắn cho tổ trưởng: chào, rồi hỏi thứ Bảy bạn có thể nghỉ không.", [("Ngày", "thứ Bảy")],
                    [("greeting", "lời chào", GREET, False), ("day", "ngày nghỉ", ["토요일"], True), ("rest", "xin nghỉ", ["쉬어도 돼요", "쉬고 싶어요"], False)], 4, 25,
                    "반장님, 안녕하세요. 토요일에 쉬어도 돼요?", None),
 "cp5_form_center": ("simple_form", FORM, "Hãy điền phiếu ở trung tâm việc làm với các thông tin trên thẻ.", [("Tên", "Phạm Linh (viết 팜 린)"), ("Địa chỉ", "Suwon (viết 수원)"), ("Điện thoại", "010-2222-3333")],
                     [("name", "tên", ["팜 린"], True), ("address", "địa chỉ", ["수원"], True), ("phone", "số điện thoại", ["010-2222-3333"], True)], 2, 12, "팜 린 | 수원 | 010-2222-3333",
                     ["name", "address", "phone"]),
 "cp5_form_clinic": ("simple_form", FORM, "Hãy điền phiếu của phòng khám với các thông tin trên thẻ.", [("Tên", "Hùng (viết 훙)"), ("Sinh nhật", "ngày 5 tháng 4 (viết 사월 오일)"), ("Điện thoại", "010-1111-2222")],
                     [("name", "tên", ["훙"], True), ("birthday", "ngày sinh", ["사월 오일"], True), ("phone", "số điện thoại", ["010-1111-2222"], True)], 2, 12, "훙 | 사월 오일 | 010-1111-2222",
                     ["name", "birthday", "phone"]),
 "cp5_form_work": ("simple_form", FORM, "Hãy điền phiếu nhân viên mới với các thông tin trên thẻ.", [("Tên", "Lê Mai (viết 레 마이)"), ("Nước", "Việt Nam"), ("Điện thoại", "010-3333-4444")],
                   [("name", "tên", ["레 마이"], True), ("country", "nước", ["베트남"], True), ("phone", "số điện thoại", ["010-3333-4444"], True)], 2, 12, "레 마이 | 베트남 | 010-3333-4444",
                   ["name", "country", "phone"]),
 "a1cap_note_station": ("short_message", MSG, "Hãy nhắn cho Hoa: hẹn gặp ở nhà ga lúc 5 giờ.", [("Gửi", "Hoa (viết 호아)"), ("Giờ", "5 giờ")],
                        [("place", "nhà ga", ["역"], False), ("time", "giờ hẹn", ["다섯 시"], True), ("meet", "lời hẹn gặp", ["만나요", "만날까요"], False)], 4, 25, "호아 씨, 다섯 시에 역에서 만나요.", None),
 "a1cap_note_bus": ("short_message", MSG, "Hãy nhắn cho Nam: báo xe buýt của bạn đến lúc 6 giờ.", [("Gửi", "Nam (viết 남)"), ("Giờ", "6 giờ")],
                    [("bus", "xe buýt", ["버스"], False), ("time", "giờ xe đến", ["여섯 시"], True)], 3, 25, "남 씨, 버스는 여섯 시에 도착해요.", None),
 "a1cap_note_home": ("short_message", MSG, "Hãy nhắn cho Lan: bạn đang ở siêu thị, và 5 giờ bạn về nhà.", [("Gửi", "Lan (viết 란)"), ("Giờ", "5 giờ")],
                     [("place", "siêu thị", ["마트"], False), ("time", "giờ về nhà", ["다섯 시"], True), ("home", "bạn về nhà", ["집에 가요", "집에 돌아가요", "집에 갈 거예요"], False)], 4, 25,
                     "란 씨, 지금 마트에 있어요. 다섯 시에 집에 가요.", None),
 "a1cap_mail_absent": ("short_message", MSG, "Hãy nhắn cho tổ trưởng: chào, báo thứ Năm bạn đi bệnh viện, nên bạn xin nghỉ.", [("Ngày", "thứ Năm")],
                       [("greeting", "lời chào", GREET, False), ("day", "ngày nghỉ", ["목요일"], True), ("hospital", "bệnh viện", ["병원"], False), ("rest", "xin nghỉ", REST, False)], 5, 30,
                       "반장님, 안녕하세요. 목요일에 병원에 가요. 그래서 쉬고 싶어요.", None),
}


# The spaced words a noun slot is written as, by what the slot holds: a name, a place, or anything else (an age, a job,
# a day). Coordinator 2026-11-05 (session 4): with the endings a learner can write at this point — 해요체 and 합쇼체 of
# the copula, and for a name (이)라고 해요 / 합니다 (저는 남이라고 해요).
NAME_TAILS = ["", "은/는", "이/가", "이에요/예요", "입니다", "이었어요/였어요", "이라고/라고 해요", "이라고/라고 합니다", " 씨"]
PLACE_TAILS = ["", "은/는", "이/가", "에", "에서", "에는", "에서는", "도", "이에요/예요", "입니다"]
OTHER_TAILS = ["", "은/는", "이/가", "을/를", "에", "에는", "도", "이에요/예요", "입니다", "이었어요/였어요"]
PLACE_SLOTS = {"city", "address", "place", "work", "hospital", "home"}


def _with_particles(noun, slot=""):
    """A noun slot (a name, a place, an age, a day) realized as the spaced word the answer writes: the build-time
    tokenizer cuts ko at spaces, so 남이에요 is one token and the bare 남 is no run of it."""
    last = noun.split(" ")[-1]
    head = noun[: len(noun) - len(last)]
    tails = NAME_TAILS if slot == "name" else PLACE_TAILS if slot in PLACE_SLOTS else OTHER_TAILS
    out = []
    for tail in tails:
        rest = ""
        if " " in tail.strip():
            tail, rest = tail.split(" ", 1)
            rest = " " + rest
        if tail == "" and rest == " 씨":
            out.append(head + last + " 씨")
            continue
        if "/" in tail:
            a, b = tail.split("/")
            tail = a if ends_in_consonant(last) else b
        out.append(head + last + tail + rest)
    return out


def _widen(variants, instr, slot=""):
    """A phrase variant also takes its fair spellings (no digits: the writing fold spells them), deduplicated; a noun
    variant takes its particles and copula."""
    out = []
    expanded = []
    for v in variants:
        last = v.split(" ")[-1]
        expanded += _with_particles(v, slot) if (INDEX.nounish(last) or last in LEX and LEX[last]["partOfSpeech"] == "noun") and not re.search(r"\d", v) else [v]
    for v in expanded:
        for x in [v] + fair(instr, v, INDEX):
            x = re.sub(r"[.?!]+$", "", x.strip())
            if not x or re.search(r"\d", x) and not re.search(r"\d", v) or _bare(x) in {_bare(y) for y in out}:
                continue
            out.append(x)
    return out


def task(slug, spec, reserved):
    fam, obj, instr, cue, slots, mn, mx, model, fields = spec
    tid = f"ko.write.{slug}"
    check_vi(tid, instr)
    rubric = {"requiredSlots": [{"id": i, "description": {"vi": d}, "variants": _widen(v, instr, i), "cueProvided": c} for i, d, v, c in slots], "minTokens": mn, "maxTokens": mx}
    for _, d, v, _c in slots:
        check_vi(tid, d)
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
    tid = f"ko.write.{slug}"
    check(tid, model)
    check_vi(tid, instr)
    rubric = {"requiredSlots": [{"id": i, "description": {"vi": d}, "variants": _widen(v, instr, i), "cueProvided": False} for i, d, v in slots], "minTokens": mn, "maxTokens": mx}
    return {"id": tid, "taskFamily": fam, "mode": "open", "instruction": {"vi": instr}, "rubric": rubric, "modelAnswers": [model], "objectiveRefs": [obj], "lexemeRefs": content_refs(model), "scoredEligibility": False, "reserved": False, "sourceRef": "original-project"}


tasks = [task(s, x, False) for s, x in GUIDED.items()] + [open_task(s, x) for s, x in OPEN.items()] + [task(s, x, True) for s, x in RESERVED.items()]
write_jsonl(f"{DRAFTS}/writing/OUTPUT.jsonl", tasks)
report()
print(len(tasks), "tasks", sum(t["reserved"] for t in tasks), "reserved", dict(Counter(t["taskFamily"] for t in tasks)))

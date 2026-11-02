"""en-vi assessment: 6 section checkpoints, the A1 capstone with 2 forms, and a 4-stage placement. Scored inputs (clips, readings, speech
items, writing tasks, scenarios) are the reserved records the section generators already wrote; this step only points at them, and
mirrors speech and writing payloads from them. Writes checkpoints/OUTPUT.jsonl and placement/OUTPUT.jsonl. English that a learner must
recognize as right is level-checked through en_refs; a distractor may be wrong on purpose.
usage: python -I en-assessment.py <repo root>"""
import json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from en_refs import check, report, write_jsonl  # noqa: E402

DRAFTS = sys.argv[1] + "/content/en/_drafts"
_STG = f"{DRAFTS}/staged/content/en/pedagogy/paradigms.json"
PAR = {t["lemma"]: t["cells"] for t in json.load(open(_STG, encoding="utf-8"))["tables"]}


def _rows(step):
    return {r["id"]: r for r in (json.loads(x) for x in open(f"{DRAFTS}/{step}/OUTPUT.jsonl", encoding="utf-8") if x.strip())}


SPEECH, WRITING, SCENARIOS, CLIPS, READINGS = _rows("speech"), _rows("writing"), _rows("scenarios"), _rows("listening"), _rows("readings")
PROBLEMS = []
_pos = [0]


def O(k):
    return f"en.obj.{k}"


def place(correct, wrong):
    p = _pos[0] % (len(wrong) + 1)
    _pos[0] += 1
    o = list(wrong)
    o.insert(p, correct)
    return o, p


def fixed(p, make):
    """An item added after review: its correct option sits at p, and the rotation of every other item is left as it was."""
    saved = _pos[0]
    _pos[0] = p
    try:
        return make()
    finally:
        _pos[0] = saved


def sel(prompt, correct, wrong, mode, audio=False):
    check(prompt, prompt if mode == "targetToNative" else correct)
    o, p = place(correct, wrong)
    e = {"type": "select", "mode": mode, "prompt": prompt, "options": [{"text": t} for t in o], "correct": p}
    if audio:
        e["audioTarget"] = prompt
    return e


def _known(table, key, what):
    if key not in table:
        PROBLEMS.append(f"unknown {what} {key}")
    elif what != "clip" and what != "reading" and table[key].get("reserved") is not True:
        PROBLEMS.append(f"{what} {key} is not reserved")
    return key


def lc(clip, q, correct, wrong):
    cid = _known(CLIPS, f"en.clip.{clip}", "clip")
    o, p = place(correct, wrong)
    return {"type": "listeningComprehension", "clipId": cid, "question": q, "options": [{"text": t} for t in o], "correct": p}


def rc(reading, q, correct, wrong):
    rid = _known(READINGS, f"en.read.{reading}", "reading")
    o, p = place(correct, wrong)
    return {"type": "readingComprehension", "readingId": rid, "question": q, "options": [{"text": t} for t in o], "correct": p}


def dict_(clip, answer, *alts):
    return {"type": "dictation", "clipId": _known(CLIPS, f"en.clip.{clip}", "clip"), "answer": answer, "alternatives": list(alts)}


ARTS = ["a", "an"]


def art(noun, gloss, correct):
    check(noun, noun)
    return {"type": "articleSelect", "articles": ARTS, "noun": noun, "gloss": gloss, "correct": ARTS.index(correct)}


def fill(sent, ans, wrong, vi):
    check(sent, sent.replace("___", ans))
    o, p = place(ans, wrong)
    return {"type": "fillBlank", "sentence": sent, "translation": vi, "options": o, "correct": p}


def conj(sent, vi, verb, cell):
    ans = PAR[verb][cell]
    check(sent, sent.replace("___", ans))
    return {"type": "conjugationCloze", "sentence": sent, "translation": vi, "verb": verb, "cell": cell, "answer": ans, "alternatives": []}


def typ(prompt, ans, *alts):
    check(prompt, ans)
    return {"type": "typeAnswer", "mode": "produceTarget", "prompt": prompt, "answer": ans, "alternatives": list(alts)}


def speak(slug):
    """A speech exercise mirroring its reserved item; its objective is the item's."""
    sid = _known(SPEECH, f"en.speak.{slug}", "speech item")
    it = SPEECH[sid]
    pr = it["prompt"]
    e = {"type": "speakProduction", "speechItemId": sid, "instruction": pr["instruction"]["vi"]}
    if "cueFacts" in pr:
        e["cueFacts"] = [{"label": f["label"]["vi"], "value": f["value"]} for f in pr["cueFacts"]]
    if "cueEmoji" in pr:
        e["cueEmoji"] = pr["cueEmoji"]
    e.update({"target": it["target"], "acceptedVariants": it["acceptedVariants"]})
    if it.get("requiredConcepts"):
        e["requiredConcepts"] = it["requiredConcepts"]
    e.update({"evidenceLexemeRefs": it["evidenceLexemeRefs"], "revealTargetAfterAttempts": it["assistancePolicy"]["revealTargetAfterAttempts"],
              "allowContextualBias": it["assistancePolicy"]["allowContextualBias"], "modelClipId": it["modelAudioRef"], "allowedAttempts": it["allowedAttempts"]})
    return e, it["objectiveRefs"][0]


def write(slug):
    """A writing exercise mirroring its reserved task."""
    tid = _known(WRITING, f"en.write.{slug}", "writing task")
    t = WRITING[tid]
    rub = {**t["rubric"], "requiredSlots": [{**s, "description": s["description"]["vi"]} for s in t["rubric"]["requiredSlots"]]}
    fields = t.get("formFields")
    e = {"type": "simpleForm" if fields else "guidedWriting", "writingTaskId": tid}
    if not fields:
        e["writingMode"] = t["mode"]
    e["instruction"] = t["instruction"]["vi"]
    if t.get("cueFacts"):
        e["cueFacts"] = [{"label": f["label"]["vi"], "value": f["value"]} for f in t["cueFacts"]]
    if fields:
        e["fields"] = fields
    e.update({"rubric": rub, "modelAnswers": t["modelAnswers"]})
    return e, t["objectiveRefs"][0]


def talk(slug):
    sid = _known(SCENARIOS, f"en.scenario.{slug}", "scenario")
    return {"type": "interactionScenario", "scenarioId": sid}, SCENARIOS[sid]["objectiveRefs"][0]


def items(prefix, rows, essential_of=lambda o: True):
    out = []
    for slug, (ex, objs) in rows:
        ex = dict(ex)
        ex["id"] = f"en-cpx-{prefix}-{slug}"
        objs = objs if isinstance(objs, list) else [objs]
        out.append({"id": f"en.cpi.{prefix}.{slug}", "itemVersion": 1, "exercise": ex, "objectiveTargets": objs, "essential": essential_of(objs[0])})
    return out


NONESS = {O(k) for k in ["vocab.places_work", "nouns.plurals_countability", "syntax.questions_word_order", "strategy.loanwords_false_friends", "speaking.describe", "writing.form_filling"]}
ess = lambda o: o not in NONESS
G, EV, RD, PW = O("greetings.basic"), O("vocab.everyday_basics"), O("reading.familiar_words"), O("vocab.places_work")
s1 = items("s1", [
 ("greet_evening", (sel("Bạn đến nhà hàng lúc tám giờ tối. Bạn nói gì?", "Good evening!", ["Good morning!", "Goodbye!", "Thank you!"], "nativeToTarget"), G)),
 ("greet_leave", (sel("Hết giờ làm, bạn ra về. Bạn nói gì với đồng nghiệp?", "Goodbye!", ["Good morning!", "Excuse me!", "Please!"], "nativeToTarget"), G)),
 ("greet_sorry", (sel("Bạn giẫm vào chân một người trên xe buýt. Bạn nói:", "Sorry!", ["Thank you!", "Hello!", "Good night!"], "nativeToTarget"), G)),
 ("vocab_bread", (sel("bánh mì", "bread", ["rice", "milk", "egg"], "nativeToTarget"), EV)),
 ("vocab_daughter", (sel("daughter", "con gái", ["con trai", "người mẹ", "chị gái"], "targetToNative", True), EV)),
 ("vocab_juice", (sel("nước ép", "juice", ["tea", "water", "sugar"], "nativeToTarget"), EV)),
 ("read_boy", (sel("The boy drinks milk.", "Cậu bé uống sữa.", ["Cô gái uống sữa.", "Cậu bé ăn bánh mì.", "Cậu bé uống nước."], "targetToNative"), RD)),
 ("read_cat", (sel("The cat eats fish.", "Con mèo ăn cá.", ["Con chó ăn cá.", "Con mèo uống sữa.", "Con mèo ăn cơm."], "targetToNative"), RD)),
 ("read_family", (sel("My family is big.", "Gia đình tôi đông người.", ["Gia đình tôi ít người.", "Bạn tôi cao.", "Nhà tôi to."], "targetToNative"), RD)),
 ("place_airport", (sel("sân bay", "airport", ["station", "hotel", "bank"], "nativeToTarget"), PW)),
 ("place_ticket", (sel("ticket", "cái vé", ["tấm bản đồ", "chiếc xe đạp", "con đường"], "targetToNative", True), PW)),
 ("place_bus", (sel("The bus goes to the airport.", "Xe buýt đi đến sân bay.", ["Tàu hoả đi đến sân bay.", "Xe buýt ở nhà ga.", "Ô tô đi đến sân bay."], "targetToNative"), PW)),
], ess)

BE, DO, AR, NU, PLU, QU, LOAN, WF = O("verbs.be_there_is"), O("verbs.present_simple_do"), O("articles.a_an_the"), O("numbers.0_100"), O("nouns.plurals_countability"), O("syntax.questions_word_order"), O("strategy.loanwords_false_friends"), O("writing.familiar_words")
s2 = items("s2", [
 ("be_we", (conj("We ___ in Hanoi.", "Chúng tôi đang ở Hà Nội.", "be", "pre:1p"), [BE, WF])),
 ("be_you", (conj("You ___ very kind.", "Bạn rất tốt bụng.", "be", "pre:2s"), [BE, WF])),
 ("be_he", (conj("He ___ a doctor.", "Anh ấy là bác sĩ.", "be", "pre:3s"), [BE, WF])),
 ("work_she", (conj("She ___ in a bank.", "Cô ấy làm việc ở một ngân hàng.", "work", "pre:3s"), [DO, WF])),
 ("live_brother", (conj("My brother ___ in Hue.", "Anh trai tôi sống ở Huế.", "live", "pre:3s"), [DO, WF])),
 ("do_where", (conj("Where ___ he work?", "Anh ấy làm việc ở đâu?", "do", "pre:3s"), [DO, WF])),
 ("art_orange", (art("orange", "quả cam", "an"), AR)),
 ("art_uniform", (art("uniform", "bộ đồng phục", "a"), AR)),
 ("art_the", (fill("I see a car. ___ car is red.", "The", ["A", "An"], "Tôi thấy một chiếc ô tô. Chiếc ô tô đó màu đỏ."), AR)),
 ("num_47", (typ("Viết bằng chữ: 47", "forty-seven", "forty seven"), [NU, WF])),
 ("num_16", (typ("Viết bằng chữ: 16", "sixteen"), [NU, WF])),
 ("num_30", (typ("Viết bằng chữ: 30", "thirty"), [NU, WF])),
 ("plural_women", (fill("There are three ___ in the room.", "women", ["woman", "womans"], "Trong phòng có ba người phụ nữ."), PLU)),
 ("plural_buses", (fill("We have two ___.", "buses", ["bus", "buss"], "Chúng tôi có hai chiếc xe buýt."), PLU)),
 ("q_where", (sel("Bạn làm việc ở đâu?", "Where do you work?", ["Where you work?", "Where are you work?", "You work where?"], "nativeToTarget"), QU)),
 ("q_does", (sel("Cô ấy có sống ở đây không?", "Does she live here?", ["Do she live here?", "Is she live here?", "She does live here?"], "nativeToTarget"), QU)),
 ("loan_boss", (sel("boss", "sếp", ["bản sao", "kích cỡ", "thực đơn"], "targetToNative", True), LOAN)),
 ("loan_copy", (sel("I need a copy of this document.", "Tôi cần một bản sao của giấy tờ này.", ["Tôi cần một tấm ảnh của giấy tờ này.", "Tôi cần sếp ký giấy tờ này.", "Tôi cần cỡ nhỏ hơn."], "targetToNative"), LOAN)),
], ess)

LF, LI, LA, LD = O("listening.familiar_words"), O("listening.short_info"), O("listening.announcements"), O("listening.short_dialogues")
RM, RN, RT = O("reading.short_messages"), O("reading.notices_info"), O("reading.short_texts")
s3 = items("s3", [
 ("fam_night", (dict_("cp3_dict_night", "I work at night.", "I work at night"), LF)),
 ("fam_bus", (dict_("cp3_dict_bus", "The bus leaves at nine.", "The bus leaves at nine", "The bus leaves at 9."), LF)),
 # Second task families at A1 for both reception domains (the claim gate needs two per domain; fr has the same three).
 ("ann_busno", (dict_("cp3_dict_busno", "Bus number seven.", "Bus number 7.", "Bus No. 7", "Bus No.7", "Bus #7", "Bus # 7"), LA)),
 ("msg_closed", (fixed(1, lambda: sel("The store is closed today.", "Hôm nay cửa hàng đóng cửa.", ["Hôm nay cửa hàng mở cửa.", "Ngày mai cửa hàng mở cửa.", "Cửa hàng ở cạnh nhà ga."], "targetToNative")), RM)),
 ("note_exit", (fixed(3, lambda: sel("Exit", "Lối ra", ["Lối vào", "Quầy vé", "Nhà vệ sinh"], "targetToNative")), RN)),
 ("info_shirt", (lc("cp3_shirt_price", "Chiếc áo giá bao nhiêu?", "Ba mươi đô la", ["Mười ba đô la", "Ba đô la", "Ba trăm đô la"]), LI)),
 ("info_class", (lc("cp3_class", "Lớp tiếng Anh bắt đầu lúc mấy giờ?", "Lúc bảy giờ", ["Lúc sáu giờ", "Lúc mười một giờ", "Lúc bảy giờ rưỡi"]), LI)),
 ("info_party", (lc("cp3_party", "Bữa tiệc vào khi nào?", "Tối thứ Bảy", ["Sáng thứ Bảy", "Tối thứ Sáu", "Tối Chủ nhật"]), LI)),
 ("ann_train", (lc("cp3_train_hue", "Tàu đi Huế chạy lúc mấy giờ?", "Lúc sáu giờ", ["Lúc bảy giờ", "Lúc mười sáu giờ", "Lúc hai giờ"]), LA)),
 ("ann_plane", (lc("cp3_plane", "Máy bay khởi hành khi nào?", "Buổi trưa", ["Buổi sáng", "Buổi tối", "Nửa đêm"]), LA)),
 ("ann_supermarket", (lc("cp3_supermarket", "Tối nay siêu thị đóng cửa lúc mấy giờ?", "Lúc mười giờ", ["Lúc chín giờ", "Lúc hai giờ", "Lúc mười hai giờ"]), LA)),
 ("ann_page", (lc("cp3_page", "Bạn phải mở sách trang mấy?", "Trang mười hai", ["Trang hai mươi", "Trang hai", "Trang ba mươi"]), LA)),
 ("dlg_tea", (lc("cp3_dlg_tea", "Người thứ hai chọn gì?", "Trà", ["Cà phê", "Nước", "Sữa"]), LD)),
 ("dlg_live", (lc("cp3_dlg_live", "Người thứ hai sống ở đâu?", "Gần con sông", ["Gần nhà ga", "Gần chợ", "Gần công viên"]), LD)),
 ("dlg_movie", (lc("cp3_dlg_movie", "Tối nay họ làm gì?", "Xem phim", ["Đi ăn", "Đi làm", "Ở nhà ngủ"]), LD)),
 ("dlg_doctor", (lc("cp3_dlg_doctor", "Người thứ hai bị làm sao?", "Đau đầu", ["Đau răng", "Sốt", "Ho"]), LD)),
 ("msg_time", (rc("cp3_msg_hoa", "Tàu của Hoa đến lúc mấy giờ?", "Lúc năm giờ", ["Lúc hai giờ", "Lúc mười lăm giờ", "Lúc sáu giờ"]), RM)),
 ("msg_bags", (rc("cp3_msg_hoa", "Hoa mang theo gì?", "Hai cái túi to", ["Một cái túi nhỏ", "Hai cái túi nhỏ", "Một cái vali"]), RM)),
 ("mail_printer", (rc("cp3_mail_staff", "Hôm nay nhân viên nên dùng máy in ở đâu?", "Trong văn phòng của quản lý", ["Ở tầng hai", "Ở tầng một", "Ở phòng họp"]), RM)),
 ("note_hours", (rc("cp3_notice_shop", "Cửa hàng mở cửa từ mấy giờ đến mấy giờ?", "Từ 9 giờ sáng đến 8 giờ tối", ["Từ 8 giờ sáng đến 8 giờ tối", "Từ 9 giờ sáng đến 12 giờ trưa", "Từ 8 giờ tối đến 9 giờ sáng"]), RN)),
 ("note_closed", (rc("cp3_notice_shop", "Cửa hàng đóng cửa khi nào?", "Sáng Chủ nhật", ["Cả ngày Chủ nhật", "Sáng thứ Bảy", "Chiều Chủ nhật"]), RN)),
 ("note_pay", (rc("cp3_notice_shop", "Khách trả tiền ở đâu?", "Ở quầy thu ngân", ["Ở cửa ra vào", "Ở ngân hàng", "Trên mạng"]), RN)),
 ("text_linh_work", (rc("cp3_text_linh", "Linh làm việc ở đâu?", "Ở một bệnh viện", ["Ở một ngân hàng", "Ở một trường học", "Ở một khách sạn"]), RT)),
 ("text_linh_age", (rc("cp3_text_linh", "Linh bao nhiêu tuổi?", "Hai mươi sáu", ["Mười sáu", "Sáu mươi hai", "Hai mươi"]), RT)),
 ("text_david", (rc("cp3_text_david", "Thứ Bảy David đi đâu?", "Đi chợ", ["Đi làm", "Ở nhà đọc sách", "Đi xem phim"]), RT)),
], ess)

s4 = items("s4", [(x.split("_", 1)[1], speak(x)) for x in [
 "cp4_greet_afternoon", "cp4_thanks_water", "cp4_sorry_cup", "cp4_name_lan", "cp4_vietnamese", "cp4_driver", "cp4_price_bag", "cp4_time_ten", "cp4_day_friday", "cp4_brothers", "cp4_desc_dog", "cp4_desc_shirt"]], ess)
s5 = items("s5", [(x.split("_", 1)[1], write(x)) for x in [
 "cp5_profile_hoa", "cp5_profile_tuan", "cp5_like_music", "cp5_sister", "cp5_room", "cp5_note_peter", "cp5_note_sick", "cp5_mail_boss", "cp5_mail_shop", "cp5_form_clinic", "cp5_form_bank", "cp5_form_work"]], ess)
s6 = items("s6", [(x.split("_", 1)[1], talk(x)) for x in [
 "cp6_new_colleague", "cp6_shop_job", "cp6_call_office", "cp6_shop_shoes", "cp6_way_bank", "cp6_clinic_cough"]])

# The capstone samples ONE objective per domain, two items in each form: it can contribute to a domain, never complete one.
cap = items("cap", [
 ("listen_bank", (lc("a1cap_bank", "Ngân hàng mở cửa lúc mấy giờ?", "Lúc chín giờ", ["Lúc năm giờ", "Lúc mười chín giờ", "Lúc mười giờ"]), LI)),
 ("listen_bus", (lc("a1cap_bus", "Xe buýt số mười hai dừng ở đâu?", "Gần bệnh viện", ["Gần nhà ga", "Gần bưu điện", "Trước ngân hàng"]), LI)),
 ("listen_pharmacy", (lc("a1cap_pharmacy", "Hiệu thuốc ở đâu?", "Cạnh bưu điện", ["Cạnh ngân hàng", "Gần nhà ga", "Đối diện bệnh viện"]), LI)),
 ("listen_bag", (lc("a1cap_bag", "Cái túi giá bao nhiêu?", "Mười lăm đô la", ["Năm mươi đô la", "Năm đô la", "Mười đô la"]), LI)),
 ("read_father_where", (rc("a1cap_msg_father", "Bố Mai ở chỗ làm đến mấy giờ?", "Đến sáu giờ", ["Đến năm giờ", "Đến bảy giờ", "Đến mười giờ"]), RM)),
 ("read_father_do", (rc("a1cap_msg_father", "Bố nhờ Mai làm gì?", "Rửa cốc", ["Nấu súp", "Đi chợ", "Dọn tủ lạnh"]), RM)),
 ("read_invite_when", (rc("a1cap_invite", "Bữa tiệc vào khi nào?", "Tối thứ Sáu", ["Sáng thứ Sáu", "Tối thứ Bảy", "Tối Chủ nhật"]), RM)),
 ("read_invite_time", (rc("a1cap_invite", "Bữa tiệc bắt đầu lúc mấy giờ?", "Lúc bảy giờ", ["Lúc sáu giờ", "Lúc tám giờ", "Lúc năm giờ"]), RM)),
 ("speak_price", speak("a1cap_price_tea")),
 ("speak_time", speak("a1cap_time_nine")),
 ("speak_birthday", speak("a1cap_birthday")),
 ("speak_family", speak("a1cap_family_six")),
 ("write_sarah", write("a1cap_note_sarah")),
 ("write_bus", write("a1cap_note_bus")),
 ("write_home", write("a1cap_note_home")),
 ("write_smith", write("a1cap_mail_smith")),
 ("talk_worker", talk("a1cap_new_worker")),
 ("talk_neighbor", talk("a1cap_neighbor")),
 ("talk_friend", talk("a1cap_friend_plan")),
 ("talk_lunch", talk("a1cap_lunch")),
])
form_a = [f"en.cpi.cap.{s}" for s in ["listen_bank", "listen_bus", "read_father_where", "read_father_do", "speak_price", "speak_time", "write_sarah", "write_bus", "talk_worker", "talk_neighbor"]]
form_b = [f"en.cpi.cap.{s}" for s in ["listen_pharmacy", "listen_bag", "read_invite_when", "read_invite_time", "speak_birthday", "speak_family", "write_home", "write_smith", "talk_friend", "talk_lunch"]]


def cp(sec, title, desc, its, crit=2, forms=None, cid=None):
    r = {"id": cid or f"en.checkpoint.section-{sec}", "checkpointVersion": 1, "formVersion": 1, "sectionId": f"en-vi:section-{sec}",
         "title": {"vi": title}, "description": {"vi": desc}, "items": its}
    if forms:
        r["forms"] = forms
    r["criteria"] = {"minItemsPerObjective": crit, "demonstratedShare": 0.66}
    return r


CPS = [
 cp(1, "Kiểm tra Phần 1", "Thể hiện những gì bạn làm được với kiến thức nền: lời chào, từ hằng ngày, nơi chốn và đọc những câu tiếng Anh quen thuộc.", s1),
 cp(2, "Kiểm tra Phần 2", "Kiểm tra những viên gạch nền: a, an và the, động từ be và đuôi -s, câu hỏi, số đếm, số nhiều và những từ dễ nhầm.", s2),
 cp(3, "Kiểm tra Phần 3", "Nghe và đọc: từ quen thuộc, thông báo, hội thoại ngắn, tin nhắn, biển báo và đoạn văn ngắn.", s3),
 cp(4, "Kiểm tra Phần 4", "Nói thành tiếng: chào hỏi, giới thiệu bản thân, nói thông tin và tả đồ vật.", s4),
 cp(5, "Kiểm tra Phần 5", "Viết: giới thiệu bản thân, câu ngắn, tin nhắn và email ngắn, điền biểu mẫu.", s5),
 cp(6, "Kiểm tra Phần 6", "Hội thoại: trò chuyện hằng ngày và lo những việc thiết thực bằng tiếng Anh.", s6, crit=3),
 cp(6, "Bài tổng kết A1", "Bài tổng kết: nghe, đọc, nói, viết và hội thoại, mỗi kỹ năng một phần nhỏ. Kết quả là ước tính theo khung CEFR, không phải chứng chỉ.", cap,
    forms=[{"formId": "a", "itemIds": form_a}, {"formId": "b", "itemIds": form_b}], cid="en.checkpoint.a1-capstone"),
]


def pli(prefix, slug, ex_obj):
    ex, obj = ex_obj
    ex = dict(ex)
    ex["id"] = f"en-plx-{prefix}-{slug}"
    return {"id": f"en.pli.{prefix}.{slug}", "itemVersion": 1, "exercise": ex, "objectiveTargets": [obj]}


def cluster(cid, obj, anchor, its):
    return {"id": f"en.pcluster.{cid}", "objectiveId": obj, "anchorLessonId": f"en-vi:{anchor}", "items": its}


SF, SI, SD = O("speaking.formulaic"), O("speaking.self_intro"), O("speaking.describe")
STAGES = [
 {"id": "en.pstage.foundations", "title": {"vi": "Nền tảng"}, "clusters": [
   cluster("everyday", EV, "u0-l0", [pli("s1", "tea", (sel("trà", "tea", ["water", "milk", "rice"], "nativeToTarget"), EV)),
                                     pli("s1", "woman", (sel("woman", "người phụ nữ", ["người đàn ông", "cô gái", "em bé"], "targetToNative", True), EV))]),
   cluster("greetings", G, "u1-l0", [pli("s1", "morning", (sel("Buổi sáng, bạn bước vào văn phòng. Bạn nói:", "Good morning!", ["Good night!", "Goodbye!", "Thank you!"], "nativeToTarget"), G)),
                                     pli("s1", "thanks", (sel("Có người giúp bạn. Bạn nói:", "Thank you!", ["Hello!", "Goodbye!", "Good evening!"], "nativeToTarget"), G))]),
   cluster("reading", RD, "u2-l0", [pli("s1", "girl_apple", (sel("The girl eats an apple.", "Cô gái ăn một quả táo.", ["Cậu bé ăn một quả táo.", "Cô gái uống nước.", "Cô gái ăn cơm."], "targetToNative"), RD)),
                                    pli("s1", "father_coffee", (sel("My father drinks coffee.", "Bố tôi uống cà phê.", ["Mẹ tôi uống cà phê.", "Bố tôi uống trà.", "Bố tôi ăn cá."], "targetToNative"), RD))]),
   cluster("places", PW, "u4-l0", [pli("s1", "station", (sel("nhà ga", "station", ["airport", "hotel", "street"], "nativeToTarget"), PW))]),
 ]},
 {"id": "en.pstage.building_blocks", "title": {"vi": "Viên gạch nền"}, "clusters": [
   cluster("articles", AR, "ua-l0", [pli("s2", "art_egg", (art("egg", "quả trứng", "an"), AR)), pli("s2", "art_book", (art("book", "quyển sách", "a"), AR))]),
   cluster("plurals", PLU, "ua-l2", [pli("s2", "plural_children", (fill("I have three ___.", "children", ["child", "childs"], "Tôi có ba đứa con."), PLU))]),
   cluster("be", BE, "ub-l0", [pli("s2", "be_sel", (sel("Chúng tôi là sinh viên.", "We are students.", ["We have students.", "We is students.", "We students."], "nativeToTarget"), BE)),
                               pli("s2", "be_she", (conj("Anna ___ my sister.", "Anna là chị gái tôi.", "be", "pre:3s"), BE))]),
   cluster("present", DO, "ub-l1", [pli("s2", "live_you", (conj("Where ___ you live?", "Bạn sống ở đâu?", "do", "pre:2s"), DO))]),
   cluster("loanwords", LOAN, "uc-l1", [pli("s2", "loan_size", (sel("size", "kích cỡ", ["sếp", "bản sao", "tấm ảnh"], "targetToNative", True), LOAN))]),
   cluster("numbers", NU, "ud-l0", [pli("s2", "num_21", (typ("Viết bằng chữ: 21", "twenty-one", "twenty one"), NU)), pli("s2", "num_13", (typ("Viết bằng chữ: 13", "thirteen"), NU))]),
 ]},
 {"id": "en.pstage.reception", "title": {"vi": "Hiểu tiếng Anh"}, "clusters": [
   cluster("listen_words", LF, "uf-l0", [pli("s3", "listen_milk", (lc("pl_milk", "Bạn nghe thấy gì?", "sữa", ["nước", "bánh mì", "trà"]), LF))]),
   cluster("read_messages", RM, "ug-l0", [pli("s3", "message_when", (rc("pl_message", "Lan muốn Tuấn gọi điện khi nào?", "Tối nay", ["Sáng nay", "Ngày mai", "Bây giờ"]), RM))]),
   cluster("read_notices", RN, "ug-l1", [pli("s3", "notice_dinner", (rc("pl_notice_cafe", "Bữa tối phục vụ từ mấy giờ?", "Từ 5 giờ chiều", ["Từ 11 giờ sáng", "Từ 2 giờ chiều", "Từ 9 giờ tối"]), RN)),
                                         pli("s3", "notice_closed", (rc("pl_notice_cafe", "Nhà hàng đóng cửa ngày nào?", "Thứ Hai", ["Chủ nhật", "Thứ Bảy", "Thứ Ba"]), RN))]),
   cluster("listen_announcements", LA, "uh-l0", [pli("s3", "shop_time", (lc("pl_shop", "Cửa hàng đóng cửa lúc mấy giờ?", "Lúc sáu giờ", ["Lúc bảy giờ", "Lúc hai giờ", "Lúc mười sáu giờ"]), LA)),
                                                 pli("s3", "pay_where", (lc("pl_pay", "Bạn trả tiền ở đâu?", "Ở cửa", ["Ở ngân hàng", "Trên xe buýt", "Ở quầy trên tầng hai"]), LA))]),
 ]},
 {"id": "en.pstage.production", "title": {"vi": "Nói tiếng Anh"}, "clusters": [
   cluster("speak_formulaic", SF, "uk-l0", [pli("s4", "hello", speak("pl_hello"))]),
   cluster("speak_intro", SI, "ul-l0", [pli("s4", "name", speak("pl_name_nam")), pli("s4", "age", speak("pl_age"))]),
   cluster("speak_describe", SD, "un-l0", [pli("s4", "car", speak("pl_big_car"))]),
 ]},
]

write_jsonl(f"{DRAFTS}/checkpoints/OUTPUT.jsonl", CPS)
write_jsonl(f"{DRAFTS}/placement/OUTPUT.jsonl", STAGES)
for p in PROBLEMS:
    print(p, file=sys.stderr)
report()
if PROBLEMS:
    sys.exit(f"{len(PROBLEMS)} problem(s)")
print("checkpoints", [len(x["items"]) for x in CPS], sum(len(x["items"]) for x in CPS), "items; placement", sum(len(cl["items"]) for st in STAGES for cl in st["clusters"]), "items in", len(STAGES), "stages")

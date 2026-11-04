"""zh-vi assessment (P4d session 4), after ja-assessment.py: 6 section checkpoints, the A1 capstone with 2 forms, and a
4-stage placement. Scored inputs (clips, readings, speech items, writing tasks, scenarios) are the reserved records the
layer generators already wrote (cp*, a1cap_*, pl_*); this step only points at them, and mirrors speech and writing payloads
from them. Writes checkpoints/OUTPUT.jsonl and placement/OUTPUT.jsonl; zh-check-answers.py reads both (rule 9).

Every Chinese string is reading-checked like the lessons (zh_layers.check: every hanzi inside a lexicon surface, homographs
in their stored reading, 中 / 地 only in compounds, no pinyin); every Vietnamese string carries no Chinese. Choices have
four options like the lessons; a distractor is wrong on purpose. Section 1 stays tap-only (decision 15): typing starts in
the Section 2 checkpoint. usage: python -I zh-assessment.py <repo root>"""
import os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zh_layers import DRAFTS, HAN, PROBLEMS, bare, check, check_vi, read_jsonl, report, write_jsonl  # noqa: E402
from zh_text import subject_spellings, widen  # noqa: E402

OBJECTIVES = {o["id"]: o for o in read_jsonl(f"{DRAFTS}/objectives/OUTPUT.jsonl")}


def _rows(step):
    return {r["id"]: r for r in read_jsonl(f"{DRAFTS}/{step}/OUTPUT.jsonl")}


SPEECH, WRITING, SCENARIOS, CLIPS, READINGS = _rows("speech"), _rows("writing"), _rows("scenarios"), _rows("listening"), _rows("readings")
_pos = [0]


def O(k):
    oid = f"zh.obj.{k}"
    if oid not in OBJECTIVES:
        PROBLEMS.append(f"unknown objective {oid}")
    return oid


def place(correct, wrong):
    if len(wrong) != 3 or correct in wrong or len(set(wrong)) != 3:
        PROBLEMS.append(f"{correct}: needs three distinct distractors, got {wrong}")
    p = _pos[0] % 4
    _pos[0] += 1
    o = list(wrong)
    o.insert(p, correct)
    return o, p


def _side(text, where):
    """A Chinese option or prompt is reading-checked; a Vietnamese one carries no Chinese."""
    (check if HAN.search(text) else check_vi)(where, text)


def sel(prompt, correct, wrong, mode):
    """select: targetToNative shows Chinese and offers Vietnamese; nativeToTarget the reverse."""
    for t in [prompt, correct, *wrong]:
        _side(t, prompt)
    o, p = place(correct, wrong)
    e = {"type": "select", "mode": mode, "prompt": prompt, "options": [{"text": t} for t in o], "correct": p}
    e["audioTarget"] = prompt if mode == "targetToNative" else correct
    return e


def listen(word, wrong):
    for t in [word, *wrong]:
        check(word, t)
    o, p = place(word, wrong)
    return {"type": "select", "mode": "listen", "prompt": "Nghe rồi chọn từ bạn nghe thấy.", "audioTarget": word, "options": [{"text": t} for t in o], "correct": p}


def fill(sent, ans, wrong, vi):
    if sent.count("___") != 1:
        PROBLEMS.append(f"{sent}: a blank needs exactly one ___")
    check(sent, sent.replace("___", ans))
    for w in wrong:
        check(sent, w)
    check_vi(sent, vi)
    o, p = place(ans, wrong)
    return {"type": "fillBlank", "sentence": sent, "translation": vi, "audioTarget": sent.replace("___", ans), "options": o, "correct": p}


def typ(vi, zh, *alts):
    """Typed Chinese through the pinyin keyboard (Section 2 on): the key is hanzi, widened like zh_lesson_lib.Y."""
    check_vi(vi, vi)
    base = [zh, *alts]
    for a in list(base):
        check(vi, a)
        base += [x for x in subject_spellings(vi, a) if x not in base]
    seen, out = {bare(zh)}, []
    for x in widen(base):
        if bare(x) not in seen:
            seen.add(bare(x))
            out.append(x)
    return {"type": "typeAnswer", "mode": "produceTarget", "prompt": vi, "audioTarget": zh, "answer": zh, "alternatives": out}


def _known(table, key, what):
    if key not in table:
        PROBLEMS.append(f"unknown {what} {key}")
    elif what in ("speech item", "writing task", "scenario") and table[key].get("reserved") is not True:
        PROBLEMS.append(f"{what} {key} is not reserved")
    elif what in ("clip", "reading") and not key.split(".")[-1].startswith(("cp", "a1cap", "pl_")):
        PROBLEMS.append(f"{what} {key} is a teaching stimulus, not an assessment one")
    return key


def _q(q, correct, wrong):
    check_vi(q, q)
    for t in [correct, *wrong]:
        _side(t, q)


def lc(clip, q, correct, wrong):
    cid = _known(CLIPS, f"zh.clip.{clip}", "clip")
    _q(q, correct, wrong)
    o, p = place(correct, wrong)
    return {"type": "listeningComprehension", "clipId": cid, "question": q, "options": [{"text": t} for t in o], "correct": p}


def rc(reading, q, correct, wrong):
    rid = _known(READINGS, f"zh.read.{reading}", "reading")
    _q(q, correct, wrong)
    o, p = place(correct, wrong)
    return {"type": "readingComprehension", "readingId": rid, "question": q, "options": [{"text": t} for t in o], "correct": p}


def dict_(clip):
    """Dictation of a reserved clip, as zh_lesson_lib.D: the transcript in simplified hanzi, its fair spellings listed."""
    cid = _known(CLIPS, f"zh.clip.{clip}", "clip")
    text = "".join(s["text"] for s in CLIPS[cid]["segments"]) if cid in CLIPS else "?"
    if re.search(r"[0-9０-９]", text):
        PROBLEMS.append(f"dictation {clip}: a number has two spellings")
    return {"type": "dictation", "clipId": cid, "answer": text, "alternatives": [x for x in widen([text]) if bare(x) != bare(text)]}


def speak(slug):
    """A speech exercise mirroring its reserved item; its objective is the item's."""
    sid = _known(SPEECH, f"zh.speak.{slug}", "speech item")
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
    tid = _known(WRITING, f"zh.write.{slug}", "writing task")
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
    sid = _known(SCENARIOS, f"zh.scenario.{slug}", "scenario")
    return {"type": "interactionScenario", "scenarioId": sid}, SCENARIOS[sid]["objectiveRefs"][0]


def essential(objs):
    return any(OBJECTIVES.get(o, {}).get("essential") is True for o in objs)


def items(prefix, rows):
    out = []
    for slug, (ex, objs) in rows:
        ex = dict(ex)
        ex["id"] = f"zh-cpx-{prefix}-{slug}"
        objs = objs if isinstance(objs, list) else [objs]
        out.append({"id": f"zh.cpi.{prefix}.{slug}", "itemVersion": 1, "exercise": ex, "objectiveTargets": objs, "essential": essential(objs)})
    return out


T2N, N2T = "targetToNative", "nativeToTarget"

# ---------------------------------------------------------------- Section 1: greetings, words, numbers, reading (units 1-5), tap-only
G, EV, RD, NU = O("greetings.basic"), O("vocab.everyday_basics"), O("reading.familiar_words"), O("numbers.measure_words")
s1 = items("s1", [
 ("greet_morning", (sel("Buổi sáng, bạn gặp đồng nghiệp ở nhà máy. Bạn nói gì?", "早上好", ["晚上好", "再见", "晚安"], N2T), G)),
 ("greet_sorry", (sel("Bạn làm vỡ cái cốc của đồng nghiệp. Bạn nói gì?", "对不起", ["谢谢", "不客气", "再见"], N2T), G)),
 ("greet_reply", (sel("Có người cảm ơn bạn. Bạn đáp lại thế nào?", "不客气", ["对不起", "再见", "早上好"], N2T), G)),
 ("word_water", (sel("水", "nước", ["sữa", "trà", "cơm"], T2N), EV)),
 ("word_bread", (sel("bánh mì", "面包", ["米饭", "鸡蛋", "面条"], N2T), EV)),
 ("word_mother", (sel("妈妈", "mẹ", ["bố", "chị gái", "em gái"], T2N), EV)),
 ("read_father", (sel("爸爸喝咖啡。", "Bố tôi uống cà phê.", ["Mẹ tôi uống cà phê.", "Bố tôi uống trà.", "Bố tôi ăn bánh mì."], T2N), RD)),
 ("read_sister", (sel("姐姐是大学生。", "Chị gái tôi là sinh viên.", ["Em gái tôi là sinh viên.", "Chị gái tôi là giáo viên.", "Anh trai tôi là sinh viên."], T2N), RD)),
 ("read_fish", (sel("我不吃鱼。", "Tôi không ăn cá.", ["Tôi ăn cá.", "Tôi không ăn thịt.", "Tôi không uống nước."], T2N), RD)),
 ("num_apples", (sel("我要两个苹果。", "Tôi muốn hai quả táo.", ["Tôi muốn ba quả táo.", "Tôi muốn một quả táo.", "Tôi có hai quả táo."], T2N), NU)),
 ("num_price", (sel("mười lăm tệ", "十五块", ["五十块", "十五点", "五块"], N2T), NU)),
 ("num_family", (sel("Nhà bạn có bốn người. Bạn nói thế nào?", "我家有四口人。", ["我家有三口人。", "我家有四本书。", "我有四个朋友。"], N2T), NU)),
])

# ---------------------------------------------------------------- Section 2: building blocks (units a-e)
SQ, WO, AS, EX = O("sentences.shi_questions"), O("grammar.word_order"), O("aspect.le_guo_zai"), O("existence.you_zai")
QW, PI, HV, PT = O("questions.question_words"), O("writing.pinyin_input"), O("script.hanzi_hanviet"), O("script.pinyin_tones")
s2 = items("s2", [
 ("shi_vietnamese", (fill("我___越南人。", "是", ["有", "在", "很"], "Tôi là người Việt Nam."), SQ)),
 ("shi_not_teacher", (sel("Anh ấy không phải là giáo viên.", "他不是老师。", ["他没是老师。", "他是不老师。", "他不老师是。"], N2T), SQ)),
 ("ma_chinese", (fill("你是中国人___？", "吗", ["呢", "了", "过"], "Bạn là người Trung Quốc à?"), SQ)),
 ("mei_yesterday", (fill("昨天我___去上班。", "没", ["不", "了", "吗"], "Hôm qua tôi không đi làm."), SQ)),
 ("mw_books", (fill("我买了三___书。", "本", ["张", "件", "杯"], "Tôi đã mua ba quyển sách."), NU)),
 ("mw_photos", (fill("桌子上有两___照片。", "张", ["本", "件", "条"], "Trên bàn có hai tấm ảnh."), NU)),
 ("mw_clothes", (fill("这___衣服很漂亮。", "件", ["本", "张", "只"], "Cái áo này rất đẹp."), NU)),
 ("zai_bank", (fill("超市___银行旁边。", "在", ["有", "是", "的"], "Siêu thị ở cạnh ngân hàng."), EX)),
 ("you_bed", (sel("Trong phòng có một cái giường.", "房间里有一张床。", ["房间里在一张床。", "有一张床房间里。", "房间有里一张床。"], N2T), EX)),
 ("order_factory", (sel("Tôi làm việc ở nhà máy.", "我在工厂工作。", ["我工作在工厂。", "我工厂在工作。", "工厂在我工作。"], N2T), WO)),
 ("order_tomorrow", (sel("Ngày mai tôi đi Bắc Kinh.", "我明天去北京。", ["我去北京明天。", "明天去我北京。", "我去明天北京。"], N2T), WO)),
 ("de_my_book", (fill("这是我___书。", "的", ["了", "吗", "在"], "Đây là sách của tôi."), WO)),
 ("guo_beijing", (fill("我去___北京。", "过", ["在", "吗", "很"], "Tôi từng đến Bắc Kinh."), AS)),
 ("le_ate", (fill("我吃饭___。", "了", ["的", "在", "很"], "Tôi ăn cơm rồi."), AS)),
 ("zai_tv", (fill("他___看电视。", "在", ["了", "过", "的"], "Anh ấy đang xem ti vi."), AS)),
 ("qw_name", (fill("你叫___名字？", "什么", ["谁", "哪儿", "几"], "Bạn tên là gì?"), QW)),
 ("qw_toilet", (fill("洗手间在___？", "哪儿", ["什么", "谁", "几"], "Nhà vệ sinh ở đâu?"), QW)),
 ("type_thanks", (typ("Gõ bằng bàn phím pinyin: \"Cảm ơn!\"", "谢谢！"), PI)),
 ("type_factory", (typ("Gõ bằng bàn phím pinyin: \"nhà máy\"", "工厂"), PI)),
 ("type_vietnamese", (typ("Gõ bằng bàn phím pinyin: \"Tôi là người Việt Nam.\"", "我是越南人。"), PI)),
 ("hv_student", (sel("Từ nào có âm Hán-Việt là \"học sinh\"?", "学生", ["先生", "学校", "医生"], N2T), HV)),
 ("hv_careful", (sel("小心", "cẩn thận", ["nhỏ bé", "trái tim", "lo lắng"], T2N), HV)),
 ("tone_shi", (listen("是", ["十", "四", "字"]), PT)),
 ("tone_mai", (listen("买", ["卖", "来", "没"]), PT)),
])

# ---------------------------------------------------------------- Section 3: listening and reading (units f-j)
LF, LI, LA, LD = O("listening.familiar_words"), O("listening.short_info"), O("listening.announcements"), O("listening.short_dialogues")
RM, RN, RT = O("reading.short_messages"), O("reading.notices_info"), O("reading.short_texts")
s3 = items("s3", [
 ("dict_work", (dict_("cp3_dict_work"), LF)),
 ("dict_station", (dict_("cp3_dict_station"), LF)),
 # A safety-instruction dictation: the second task family of spoken reception (claim-gate breadth, as ja).
 ("dict_safety", (dict_("cp3_dict_safety"), LA)),
 ("ann_train", (lc("cp3_train_gz", "Tàu đi Quảng Châu chạy lúc mấy giờ?", "Lúc sáu giờ", ["Lúc bảy giờ", "Lúc mười sáu giờ", "Lúc sáu giờ rưỡi"]), LA)),
 ("ann_plane", (lc("cp3_plane", "Máy bay đến lúc mấy giờ?", "Lúc mười hai giờ", ["Lúc hai giờ", "Lúc mười giờ", "Lúc hai giờ chiều"]), LA)),
 ("ann_supermarket", (lc("cp3_supermarket", "Siêu thị đóng cửa lúc mấy giờ?", "Lúc mười giờ tối", ["Lúc mười giờ sáng", "Lúc chín giờ tối", "Lúc mười một giờ tối"]), LA)),
 ("ann_page", (lc("cp3_page", "Bạn phải mở sách trang mấy?", "Trang mười hai", ["Trang hai", "Trang hai mươi", "Trang mười"]), LA)),
 ("info_shirt", (lc("cp3_shirt", "Cái áo này giá bao nhiêu?", "300 tệ", ["30 tệ", "3000 tệ", "350 tệ"]), LI)),
 ("info_class", (lc("cp3_class", "Lớp tiếng Trung bắt đầu lúc mấy giờ?", "Bảy giờ tối", ["Bảy giờ sáng", "Một giờ chiều", "Bảy giờ rưỡi tối"]), LI)),
 ("info_birthday", (lc("cp3_birthday", "Sinh nhật của Tiểu Vương vào thứ mấy?", "Thứ Bảy", ["Thứ Sáu", "Chủ nhật", "Thứ Hai"]), LI)),
 ("dlg_tea", (lc("cp3_dlg_tea", "Người thứ hai uống gì?", "Trà", ["Cà phê", "Nước", "Sữa"]), LD)),
 ("dlg_live", (lc("cp3_dlg_live", "Người thứ hai sống ở đâu?", "Cạnh ga tàu", ["Cạnh công viên", "Cạnh nhà máy", "Cạnh siêu thị"]), LD)),
 ("dlg_movie", (lc("cp3_dlg_movie", "Người thứ hai rủ làm gì?", "Cùng đi xem phim", ["Cùng đi ăn tối", "Cùng đi làm", "Cùng đi siêu thị"]), LD)),
 ("dlg_doctor", (lc("cp3_dlg_doctor", "Người thứ hai bị làm sao?", "Đau đầu", ["Đau bụng", "Bị sốt", "Bị ho"]), LD)),
 ("msg_time", (rc("cp3_msg_hua", "Tàu của Hoa đến Thượng Hải lúc mấy giờ?", "Năm giờ chiều", ["Năm giờ sáng", "Hai giờ chiều", "Mười lăm giờ"]), RM)),
 ("msg_ask", (rc("cp3_msg_hua", "Hoa nhờ Nam làm gì?", "Ra ga tàu đón chị ấy", ["Mua vé tàu cho chị ấy", "Gọi điện cho chị ấy", "Cùng đi Thượng Hải"]), RM)),
 ("meeting_when", (rc("cp3_notice_meeting", "Cuộc họp vào lúc nào?", "Hai giờ chiều mai", ["Hai giờ chiều nay", "Mười hai giờ trưa mai", "Hai giờ sáng mai"]), RM)),
 ("meeting_where", (rc("cp3_notice_meeting", "Họp ở đâu?", "Văn phòng tầng hai", ["Văn phòng tầng một", "Nhà ăn tầng hai", "Ở nhà máy"]), RN)),
 ("shop_hours", (rc("cp3_notice_shop", "Cửa hàng mở cửa từ mấy giờ đến mấy giờ?", "Từ 9 giờ sáng đến 9 giờ tối", ["Từ 9 giờ sáng đến 5 giờ chiều", "Từ 8 giờ sáng đến 9 giờ tối", "Từ 9 giờ tối đến 9 giờ sáng"]), RN)),
 ("shop_closed", (rc("cp3_notice_shop", "Ngày nào cửa hàng không mở cửa?", "Thứ Hai", ["Chủ nhật", "Thứ Bảy", "Thứ Ba"]), RN)),
 ("shop_queue", (rc("cp3_notice_shop", "Thông báo nhờ khách làm gì?", "Xếp hàng ở cửa", ["Trả tiền ở cửa", "Gọi điện trước", "Đến trước chín giờ"]), RN)),
 ("sign_noentry", (sel("禁止进入", "Cấm vào", ["Lối vào", "Lối ra", "Chú ý"], T2N), RN)),
 ("sign_exit", (sel("紧急出口", "Lối thoát hiểm", ["Lối vào", "Cấm hút thuốc", "Thang máy"], T2N), RN)),
 ("hong_age", (rc("cp3_text_hong", "Hồng bao nhiêu tuổi?", "Hai mươi bốn", ["Mười bốn", "Bốn mươi hai", "Hai mươi"]), RT)),
 ("hong_work", (rc("cp3_text_hong", "Hồng làm việc ở đâu?", "Ở một bệnh viện ở Bắc Kinh", ["Ở một nhà máy ở Bắc Kinh", "Ở một bệnh viện ở Thượng Hải", "Ở một trường học ở Bắc Kinh"]), RT)),
 ("li_commute", (rc("cp3_text_week", "Tiểu Lý đi làm bằng gì?", "Tàu điện ngầm", ["Xe buýt", "Xe đạp", "Taxi"]), RT)),
 ("li_sunday", (rc("cp3_text_week", "Chủ nhật Tiểu Lý làm gì?", "Đọc sách ở nhà", ["Đi siêu thị mua đồ", "Đi làm", "Đi xem phim"]), RT)),
])

s4 = items("s4", [(x.split("_", 1)[1], speak(x)) for x in [
 "cp4_greet_evening", "cp4_thanks_water", "cp4_sorry_cup", "cp4_congrats", "cp4_name_hua", "cp4_vietnamese", "cp4_student", "cp4_work_shop",
 "cp4_price_tea", "cp4_time_ten", "cp4_day_friday", "cp4_tickets_three", "cp4_desc_dog", "cp4_desc_shirt"]])
s5 = items("s5", [(x.split("_", 1)[1], write(x)) for x in [
 "cp5_profile_hua", "cp5_profile_nam", "cp5_like_music", "cp5_sister", "cp5_room", "cp5_note_movie", "cp5_note_sick", "cp5_note_late", "cp5_mail_shift",
 "cp5_form_bank", "cp5_form_clinic", "cp5_form_work"]])
s6 = items("s6", [(x.split("_", 1)[1], talk(x)) for x in [
 "cp6_new_colleague", "cp6_interview", "cp6_call_office", "cp6_supermarket_pay", "cp6_way_bank", "cp6_clinic_cough"]])

# The capstone samples ONE objective per domain, two items in each form: it can contribute to a domain, never complete one.
cap = items("cap", [
 ("listen_bank", (lc("a1cap_bank", "Ngân hàng mở cửa lúc mấy giờ?", "Chín giờ sáng", ["Chín giờ tối", "Năm giờ chiều", "Mười giờ sáng"]), LI)),
 ("listen_bus", (lc("a1cap_bus", "Muốn đến bệnh viện thì đi xe buýt số mấy?", "Số năm", ["Số bốn", "Số mười lăm", "Số chín"]), LI)),
 ("listen_pharmacy", (lc("a1cap_pharmacy", "Hiệu thuốc ở đâu?", "Cạnh ngân hàng", ["Đối diện ngân hàng", "Cạnh bệnh viện", "Trong siêu thị"]), LI)),
 ("listen_bag", (lc("a1cap_bag", "Cái túi này giá bao nhiêu?", "200 tệ", ["20 tệ", "2000 tệ", "250 tệ"]), LI)),
 ("read_mother_night", (rc("a1cap_msg_mother", "Tối nay mẹ của Tiểu Hoa làm gì?", "Làm thêm giờ", ["Nấu cơm", "Đi siêu thị", "Ở nhà"]), RM)),
 ("read_mother_ask", (rc("a1cap_msg_mother", "Mẹ nhờ Tiểu Hoa làm gì sau khi ăn?", "Rửa bát", ["Nấu cơm tối", "Gọi điện cho mẹ", "Dọn bàn"]), RM)),
 ("read_invite_when", (rc("a1cap_invite", "Sinh nhật của Tiểu Vương vào ngày nào?", "Thứ Sáu", ["Thứ Năm", "Thứ Bảy", "Chủ nhật"]), RM)),
 ("read_invite_time", (rc("a1cap_invite", "Mọi người ăn tối ở nhà hàng lúc mấy giờ?", "Bảy giờ tối", ["Sáu giờ tối", "Tám giờ tối", "Một giờ chiều"]), RM)),
 ("speak_time", speak("a1cap_time_nine")),
 ("speak_price", speak("a1cap_price_coffee")),
 ("speak_day", speak("a1cap_day_sunday")),
 ("speak_birthday", speak("a1cap_birthday")),
 ("write_station", write("a1cap_note_station")),
 ("write_bus", write("a1cap_note_bus")),
 ("write_home", write("a1cap_note_home")),
 ("write_absent", write("a1cap_mail_absent")),
 ("talk_shift", talk("a1cap_shift_change")),
 ("talk_canteen", talk("a1cap_canteen_lunch")),
 ("talk_friend", talk("a1cap_friend_plan")),
 ("talk_weekend", talk("a1cap_weekend")),
])
form_a = [f"zh.cpi.cap.{s}" for s in ["listen_bank", "listen_bus", "read_mother_night", "read_mother_ask", "speak_time", "speak_price", "write_station", "write_bus", "talk_shift", "talk_canteen"]]
form_b = [f"zh.cpi.cap.{s}" for s in ["listen_pharmacy", "listen_bag", "read_invite_when", "read_invite_time", "speak_day", "speak_birthday", "write_home", "write_absent", "talk_friend", "talk_weekend"]]


def cp(sec, title, desc, its, crit=2, forms=None, cid=None):
    check_vi(title, title)
    check_vi(desc, desc)
    r = {"id": cid or f"zh.checkpoint.section-{sec}", "checkpointVersion": 1, "formVersion": 1, "sectionId": f"zh-vi:section-{sec}",
         "title": {"vi": title}, "description": {"vi": desc}, "items": its}
    if forms:
        r["forms"] = forms
    r["criteria"] = {"minItemsPerObjective": crit, "demonstratedShare": 0.66}
    return r


CPS = [
 cp(1, "Kiểm tra Phần 1", "Thể hiện những gì bạn làm được với kiến thức nhập môn: lời chào, từ hằng ngày, số đếm và giá tiền, và đọc những câu tiếng Trung quen thuộc. Phần này chỉ cần chạm để chọn.", s1),
 cp(2, "Kiểm tra Phần 2", "Kiểm tra những viên gạch nền: câu \"là\", câu phủ định và câu hỏi, lượng từ, \"có\" và \"ở\", trật tự từ, các dấu hiệu \"rồi\", \"từng\", \"đang\", gõ bằng bàn phím pinyin, chữ Hán và Hán-Việt, thanh điệu.", s2),
 cp(3, "Kiểm tra Phần 3", "Nghe và đọc: từ quen thuộc, thông báo và lời nhắc an toàn, hội thoại ngắn, tin nhắn, biển báo và đoạn văn ngắn.", s3),
 cp(4, "Kiểm tra Phần 4", "Nói thành tiếng: chào hỏi, giới thiệu bản thân, nói thông tin và tả đồ vật.", s4),
 cp(5, "Kiểm tra Phần 5", "Viết bằng bàn phím pinyin: giới thiệu bản thân, câu ngắn, tin nhắn cho cấp trên và bạn bè, điền phiếu.", s5),
 cp(6, "Kiểm tra Phần 6", "Hội thoại: trò chuyện hằng ngày và lo những việc thiết thực bằng tiếng Trung.", s6, crit=3),
 cp(6, "Bài tổng kết A1", "Bài tổng kết: nghe, đọc, nói, viết và hội thoại, mỗi kỹ năng một phần nhỏ. Kết quả là ước tính theo khung CEFR, không phải chứng chỉ, và không phải một cấp HSK.", cap,
    forms=[{"formId": "a", "itemIds": form_a}, {"formId": "b", "itemIds": form_b}], cid="zh.checkpoint.a1-capstone"),
]


# ---------------------------------------------------------------- placement: 4 stages, anchors in curriculum order
def pli(prefix, slug, ex_obj):
    ex, obj = ex_obj
    ex = dict(ex)
    ex["id"] = f"zh-plx-{prefix}-{slug}"
    return {"id": f"zh.pli.{prefix}.{slug}", "itemVersion": 1, "exercise": ex, "objectiveTargets": [obj]}


def cluster(cid, obj, anchor, its):
    return {"id": f"zh.pcluster.{cid}", "objectiveId": obj, "anchorLessonId": f"zh-vi:{anchor}", "items": its}


SF, SI, SD = O("speaking.formulaic"), O("speaking.self_intro"), O("speaking.describe")
STAGES = [
 {"id": "zh.pstage.foundations", "title": {"vi": "Nhập môn"}, "clusters": [
   cluster("greetings", G, "u0-l0", [pli("s1", "first_meeting", (sel("Bạn gặp một người lần đầu. Bạn nói gì?", "你好", ["再见", "不客气", "晚安"], N2T), G)),
                                     pli("s1", "good_night", (sel("Bạn đi ngủ. Bạn nói gì với gia đình?", "晚安", ["早上好", "谢谢", "对不起"], N2T), G))]),
   cluster("everyday", EV, "u2-l0", [pli("s1", "father", (sel("爸爸", "bố", ["mẹ", "anh trai", "ông"], T2N), EV)),
                                     pli("s1", "egg", (sel("trứng", "鸡蛋", ["米饭", "面包", "牛奶"], N2T), EV))]),
   cluster("reading", RD, "u3-l0", [pli("s1", "drink_tea", (sel("我喝茶。", "Tôi uống trà.", ["Tôi uống nước.", "Tôi ăn cơm.", "Mẹ tôi uống trà."], T2N), RD)),
                                    pli("s1", "brother_job", (sel("哥哥是医生。", "Anh trai tôi là bác sĩ.", ["Em trai tôi là bác sĩ.", "Anh trai tôi là giáo viên.", "Bố tôi là bác sĩ."], T2N), RD))]),
   cluster("numbers", NU, "u4-l0", [pli("s1", "three_buns", (sel("我要三个包子。", "Tôi muốn ba cái bánh bao.", ["Tôi muốn hai cái bánh bao.", "Tôi muốn một cái bánh bao.", "Tôi muốn ba cốc trà."], T2N), NU))]),
 ]},
 {"id": "zh.pstage.building_blocks", "title": {"vi": "Viên gạch nền"}, "clusters": [
   cluster("shi_questions", SQ, "ua-l0", [pli("s2", "teacher_ma", (fill("你是老师___？", "吗", ["呢", "了", "过"], "Bạn là giáo viên à?"), SQ))]),
   cluster("measure", NU, "ub-l0", [pli("s2", "two_tickets", (fill("我要两___票。", "张", ["本", "件", "条"], "Tôi muốn hai vé."), NU))]),
   cluster("you_zai", EX, "uc-l0", [pli("s2", "cat_room", (fill("我家___一只猫。", "有", ["在", "是", "的"], "Nhà tôi có một con mèo."), EX))]),
   cluster("aspect", AS, "ud-l0", [pli("s2", "le_bought", (fill("我买___一件衣服。", "了", ["的", "在", "很"], "Tôi đã mua một cái áo."), AS))]),
   cluster("pinyin", PT, "ue-l0", [pli("s2", "tone_shi", (listen("十", ["是", "四", "字"]), PT))]),
 ]},
 {"id": "zh.pstage.reception", "title": {"vi": "Hiểu tiếng Trung"}, "clusters": [
   cluster("listen_words", LF, "uf-l0", [pli("s3", "water", (lc("pl_shui", "Bạn nghe thấy gì?", "nước", ["sữa", "trà", "bánh mì"]), LF))]),
   cluster("read_notices", RN, "ug-l0", [pli("s3", "dinner", (rc("pl_notice_restaurant", "Buổi tối nhà hàng mở cửa từ mấy giờ?", "Từ 5 giờ", ["Từ 11 giờ", "Từ 2 giờ", "Từ 9 giờ"]), RN)),
                                         pli("s3", "closed", (rc("pl_notice_restaurant", "Nhà hàng nghỉ ngày nào?", "Thứ Hai", ["Chủ nhật", "Thứ Bảy", "Thứ Ba"]), RN))]),
   cluster("read_messages", RM, "ug-l2", [pli("s3", "call", (rc("pl_message", "Nam muốn Tiểu Vương làm gì?", "Gọi điện vào buổi tối", ["Đến nhà Nam", "Gọi điện vào buổi sáng", "Gửi tin nhắn cho Nam"]), RM))]),
   cluster("listen_announcements", LA, "uh-l0", [pli("s3", "shop", (lc("pl_shop", "Cửa hàng đóng cửa lúc mấy giờ?", "Lúc sáu giờ", ["Lúc bảy giờ", "Lúc bốn giờ", "Lúc mười sáu giờ"]), LA)),
                                                 pli("s3", "pay", (lc("pl_pay", "Người nói nhờ bạn làm gì ở đây?", "Trả tiền", ["Xếp hàng", "Chờ một chút", "Ký tên"]), LA))]),
 ]},
 {"id": "zh.pstage.production", "title": {"vi": "Nói tiếng Trung"}, "clusters": [
   cluster("speak_formulaic", SF, "uk-l0", [pli("s4", "hello", speak("pl_hello"))]),
   cluster("speak_intro", SI, "ul-l0", [pli("s4", "name", speak("pl_name_nam")), pli("s4", "age", speak("pl_age"))]),
   cluster("speak_describe", SD, "un-l0", [pli("s4", "car", speak("pl_big_car"))]),
 ]},
]

write_jsonl(f"{DRAFTS}/checkpoints/OUTPUT.jsonl", CPS)
write_jsonl(f"{DRAFTS}/placement/OUTPUT.jsonl", STAGES)
report()
print("checkpoints", [len(x["items"]) for x in CPS], sum(len(x["items"]) for x in CPS), "items; placement", sum(len(cl["items"]) for st in STAGES for cl in st["clusters"]), "items in", len(STAGES), "stages")

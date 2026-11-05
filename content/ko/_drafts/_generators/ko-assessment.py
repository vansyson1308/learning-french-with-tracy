"""ko-vi assessment (P4e session 4), after ja-assessment.py: 6 section checkpoints and the A1 capstone, each in 2 parallel
forms (coordinator 2026-11-05), and a 4-stage placement. Scored inputs (clips, readings, speech items, writing tasks,
scenarios) are the reserved records the layer generators already wrote (cp*, a1cap_*, pl_*); this step only points at
them and mirrors their payloads. Writes checkpoints/OUTPUT.jsonl and placement/OUTPUT.jsonl; ko-check-answers.py reads
both (rule 11).

TOPIK I alignment (content/ko/exam/FORMAT-SOURCES.md, regulation 제204호 read 2026-11-05): checkpoint 3 and the
capstone's listening and reading items are the kinds TOPIK I tests (듣기, 읽기), 4-option choices. The result is an
estimate of readiness on the course's items, never a TOPIK level ("mức sẵn sàng ước tính").

Every Korean string goes through ko_layers.check (lexicon words, allomorphs, number systems, no 반말 in a key); every
Vietnamese string carries no Hangul. Section 1 items are tap-only (no typed Korean before the primer).
usage: python -I ko-assessment.py <repo root>"""
import os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ko_layers import DRAFTS, INDEX, PROBLEMS, check, check_vi, read_jsonl, report, write_jsonl  # noqa: E402
from ko_paradigms import TABLES  # noqa: E402
from ko_text import _eu, aeo, variants  # noqa: E402

OBJECTIVES = {o["id"]: o for o in read_jsonl(f"{DRAFTS}/objectives/OUTPUT.jsonl")}


def _rows(step):
    return {r["id"]: r for r in read_jsonl(f"{DRAFTS}/{step}/OUTPUT.jsonl")}


SPEECH, WRITING, SCENARIOS, CLIPS, READINGS = _rows("speech"), _rows("writing"), _rows("scenarios"), _rows("listening"), _rows("readings")
_pos = [0]
KO = re.compile(r"[가-힣]")
ASSESS = re.compile(r"[._](cp\d|a1cap|pl)_")


def O(k):
    oid = f"ko.obj.{k}"
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


def _side(text, where, key=False):
    """A Korean key is fully checked; a Korean distractor only for its script (it is wrong on purpose)."""
    if KO.search(text):
        if key:
            check(where, text, plain=not text.endswith((".", "?", "!")))
        elif re.search(r"[A-Za-z一-鿿]", text):
            PROBLEMS.append(f"{where}: distractor {text!r} is not Hangul")
    else:
        check_vi(where, text)


def sel(prompt, correct, wrong, mode):
    _side(prompt, prompt, key=mode == "targetToNative")
    _side(correct, prompt, key=True)
    for t in wrong:
        _side(t, prompt)
    o, p = place(correct, wrong)
    e = {"type": "select", "mode": mode, "prompt": prompt, "options": [{"text": t} for t in o], "correct": p}
    e["audioTarget"] = prompt if mode == "targetToNative" else correct
    return e


def listen(word, wrong):
    check(word, word, plain=True)
    o, p = place(word, wrong)
    return {"type": "select", "mode": "listen", "prompt": "Nghe rồi chọn từ bạn nghe thấy.", "audioTarget": word, "options": [{"text": t} for t in o], "correct": p}


def fill(sent, ans, wrong, vi):
    if sent.count("___") != 1:
        PROBLEMS.append(f"{sent}: a blank needs exactly one ___")
    check(sent, sent.replace("___", ans))
    check_vi(sent, vi)
    o, p = place(ans, wrong)
    return {"type": "fillBlank", "sentence": sent, "translation": vi, "audioTarget": sent.replace("___", ans), "options": o, "correct": p}


def conj(sent, vi, verb, cell):
    t = TABLES.get(verb)
    if t is None or cell not in t["cells"]:
        PROBLEMS.append(f"{sent}: {verb} has no paradigm cell {cell}")
        return {"type": "conjugationCloze", "sentence": sent, "translation": vi, "verb": verb, "cell": cell, "answer": "?", "alternatives": []}
    ans = t["cells"][cell]
    check(sent, sent.replace("___", ans))
    check_vi(sent, vi)
    alts = [ans.replace(" ", "")] if " " in ans else []
    if cell == "hon:pre":
        alts += [aeo(verb) + " 주세요", aeo(verb) + "주세요", _eu(verb, "십시오")]
    return {"type": "conjugationCloze", "sentence": sent, "translation": vi, "verb": verb, "cell": cell, "answer": ans, "alternatives": alts}


def typ(prompt, ans, *alts):
    """Typed Korean (Section 2 on) with every fair rendering, as ko_lesson_lib.Y."""
    check_vi(prompt, prompt)
    more = [a for a in alts if a != ans]
    for base in [ans, *alts]:
        for x in variants(prompt, base, INDEX):
            if x != ans and x not in more:
                more.append(x)
    for t in (ans, *more):
        check(prompt, t, plain=True)
    return {"type": "typeAnswer", "mode": "produceTarget", "prompt": prompt, "answer": ans, "alternatives": more}


def _known(table, key, what):
    if key not in table:
        PROBLEMS.append(f"unknown {what} {key}")
    elif what in ("speech item", "writing task", "scenario") and table[key].get("reserved") is not True:
        PROBLEMS.append(f"{what} {key} is not reserved")
    elif what in ("clip", "reading") and not ASSESS.search(key):
        PROBLEMS.append(f"{what} {key} is a teaching stimulus, not an assessment one")
    return key


def _q(q, correct, wrong):
    check_vi(q, q)
    for t in [correct, *wrong]:
        _side(t, q, key=t == correct)


def lc(clip, q, correct, wrong):
    cid = _known(CLIPS, f"ko.clip.{clip}", "clip")
    _q(q, correct, wrong)
    o, p = place(correct, wrong)
    return {"type": "listeningComprehension", "clipId": cid, "question": q, "options": [{"text": t} for t in o], "correct": p}


def rc(reading, q, correct, wrong):
    rid = _known(READINGS, f"ko.read.{reading}", "reading")
    _q(q, correct, wrong)
    o, p = place(correct, wrong)
    return {"type": "readingComprehension", "readingId": rid, "question": q, "options": [{"text": t} for t in o], "correct": p}


def dict_(clip):
    cid = _known(CLIPS, f"ko.clip.{clip}", "clip")
    text = " ".join(s["text"] for s in CLIPS[cid]["segments"]) if cid in CLIPS else "?"
    if re.search(r"\d", text):
        PROBLEMS.append(f"dictation {clip}: a number has two spellings")
    return {"type": "dictation", "clipId": cid, "answer": text, "alternatives": [text.replace(" ", "")] if " " in text else []}


def speak(slug):
    sid = _known(SPEECH, f"ko.speak.{slug}", "speech item")
    it = SPEECH[sid]
    pr = it["prompt"]
    e = {"type": "speakProduction", "speechItemId": sid, "instruction": pr["instruction"]["vi"]}
    if "cueFacts" in pr:
        e["cueFacts"] = [{"label": f["label"]["vi"], "value": f["value"]} for f in pr["cueFacts"]]
    if "cueEmoji" in pr:
        e["cueEmoji"] = pr["cueEmoji"]
    e.update({"target": it["target"], "acceptedVariants": it["acceptedVariants"], "evidenceLexemeRefs": it["evidenceLexemeRefs"],
              "revealTargetAfterAttempts": it["assistancePolicy"]["revealTargetAfterAttempts"], "allowContextualBias": it["assistancePolicy"]["allowContextualBias"],
              "modelClipId": it["modelAudioRef"], "allowedAttempts": it["allowedAttempts"]})
    return e, it["objectiveRefs"][0]


def write(slug):
    tid = _known(WRITING, f"ko.write.{slug}", "writing task")
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
    sid = _known(SCENARIOS, f"ko.scenario.{slug}", "scenario")
    return {"type": "interactionScenario", "scenarioId": sid}, SCENARIOS[sid]["objectiveRefs"][0]


def essential(objs):
    return any(OBJECTIVES.get(o, {}).get("essential") is True for o in objs)


def items(prefix, rows):
    out = []
    for slug, (ex, objs) in rows:
        ex = dict(ex)
        ex["id"] = f"ko-cpx-{prefix}-{slug}"
        objs = objs if isinstance(objs, list) else [objs]
        out.append({"id": f"ko.cpi.{prefix}.{slug}", "itemVersion": 1, "exercise": ex, "objectiveTargets": objs, "essential": essential(objs)})
    return out


T2N, N2T = "targetToNative", "nativeToTarget"

# ---------------------------------------------------------------- Section 1 (units 1-5): tap only
G, EV, RD, NU = O("greetings.basic"), O("vocab.everyday_basics"), O("reading.familiar_words"), O("numbers.two_systems")
s1 = items("s1", [
 ("greet_meal", (sel("Trước bữa ăn ở căng tin, bạn nói gì?", "잘 먹겠습니다", ["잘 먹었습니다", "안녕히 계세요", "수고하셨습니다"], N2T), G)),
 ("greet_leave", (sel("Bạn ra về trước, đồng nghiệp còn ở lại. Bạn chào:", "안녕히 계세요", ["안녕히 가세요", "어서 오세요", "잘 먹겠습니다"], N2T), G)),
 ("greet_sorry", (sel("Bạn làm rơi đồ của tổ trưởng. Bạn nói gì?", "죄송합니다", ["감사합니다", "안녕하세요", "축하합니다"], N2T), G)),
 ("greet_thanks", (sel("감사합니다", "cảm ơn", ["xin lỗi", "xin chào", "không sao"], T2N), G)),
 ("word_water", (sel("물", "nước", ["sữa", "trà", "cơm"], T2N), EV)),
 ("word_bread", (sel("bánh mì", "빵", ["밥", "고기", "우유"], N2T), EV)),
 ("word_mother", (sel("어머니", "mẹ", ["bố", "chị gái", "em"], T2N), EV)),
 ("word_family", (sel("gia đình", "가족", ["가방", "가게", "가수"], N2T), EV)),
 ("read_father", (sel("우리 아버지는 커피를 마셔요.", "Bố tôi uống cà phê.", ["Mẹ tôi uống cà phê.", "Bố tôi uống trà.", "Bố tôi ăn bánh mì."], T2N), RD)),
 ("read_student", (sel("저는 학생이 아니에요.", "Tôi không phải là học sinh.", ["Tôi là học sinh.", "Tôi là giáo viên.", "Bạn có phải là học sinh không?"], T2N), RD)),
 ("read_meat", (sel("고기를 먹어요.", "Tôi ăn thịt.", ["Tôi ăn cá.", "Tôi không ăn thịt.", "Tôi mua thịt."], T2N), RD)),
 ("read_name", (sel("제 이름은 란이에요.", "Tên tôi là Lan.", ["Tôi là bạn của Lan.", "Lan là học sinh.", "Tên bạn là gì?"], T2N), RD)),
 ("num_price", (sel("오천 원이에요.", "Năm nghìn won.", ["Năm trăm won.", "Năm mươi nghìn won.", "Năm mươi won."], T2N), NU)),
 ("num_ten_thousand", (sel("Mười nghìn won.", "만 원이에요.", ["천 원이에요.", "십 원이에요.", "백 원이에요."], N2T), NU)),
 ("num_three", (listen("삼", ["사", "산", "십"]), NU)),
 ("num_cheap", (sel("이거 싸요.", "Cái này rẻ.", ["Cái này đắt.", "Cái này ngon.", "Cái này bao nhiêu?"], T2N), NU)),
])

# ---------------------------------------------------------------- Section 2 (units a-e)
CP, PC, HV, EX, SH, HI, QW, PL = (O("sentences.copula"), O("particles.core"), O("verbs.haeyo_present"), O("existence.itda"), O("script.hangul"),
                                  O("writing.hangul_input"), O("questions.question_words"), O("politeness.speech_levels"))
s2 = items("s2", [
 ("cop_doctor", (fill("우리 어머니는 의사___.", "예요", ["이에요", "를", "가"], "Mẹ tôi là bác sĩ."), CP)),
 ("cop_not", (sel("Tôi không phải là người Hàn Quốc.", "저는 한국 사람이 아니에요.", ["저는 한국 사람이 아니요.", "저는 한국 사람을 아니에요.", "저는 한국 사람이에요."], N2T), CP)),
 ("cop_formal", (fill("처음 뵙겠습니다. 저는 응우옌 남___.", "입니다", ["입니까", "을", "아니요"], "Rất hân hạnh. Tôi là Nguyễn Nam."), CP)),
 ("cop_station", (sel("Đây là nhà ga.", "여기는 역이에요.", ["여기는 역예요.", "여기는 역을 이에요.", "여기는 역이 아니에요."], N2T), CP)),
 ("part_topic", (fill("저___ 베트남 사람이에요.", "는", ["은", "를", "에"], "Tôi là người Việt Nam."), PC)),
 ("part_eseo", (fill("공장___ 일해요.", "에서", ["에", "를", "는"], "Tôi làm việc ở nhà máy."), PC)),
 ("part_reul", (fill("커피___ 마셔요.", "를", ["을", "에", "이"], "Tôi uống cà phê."), PC)),
 ("part_e_time", (fill("일곱 시___ 일어나요.", "에", ["에서", "를", "가"], "Tôi dậy lúc bảy giờ."), PC)),
 ("haeyo_go", (conj("매일 아침 공장에 ___.", "Sáng nào tôi cũng đi đến nhà máy.", "가다", "haeyo:pre"), HV)),
 ("haeyo_buy", (conj("편의점에서 물을 ___.", "Tôi mua nước ở cửa hàng tiện lợi.", "사다", "haeyo:pre"), HV)),
 ("haeyo_drink", (fill("물을 ___.", "마셔요", ["마시요", "먹어요", "가요"], "Tôi uống nước."), HV)),
 ("haeyo_listen", (fill("저녁에 한국 노래를 ___.", "들어요", ["듣어요", "봐요", "자요"], "Buổi tối tôi nghe bài hát Hàn Quốc."), HV)),
 ("exist_time", (fill("오늘은 시간___ 없어요.", "이", ["을", "에", "를"], "Hôm nay tôi không có thời gian."), EX)),
 ("exist_bed", (sel("Trong phòng có giường.", "방에 침대가 있어요.", ["방에서 침대가 있어요.", "방에 침대를 있어요.", "방에 침대가 없어요."], N2T), EX)),
 ("exist_cat", (fill("집에 고양이가 ___.", "없어요", ["아니에요", "이에요", "있어요"], "Nhà tôi không có mèo."), EX)),
 ("exist_book", (sel("가방에 책이 있어요.", "Trong túi có sách.", ["Trong túi không có sách.", "Trên bàn có sách.", "Đây là cái túi sách."], T2N), EX)),
 ("hangul_ga", (sel("Chữ nào đọc là \"ga\"?", "가", ["카", "까", "거"], N2T), SH)),
 ("hangul_tense", (listen("딸", ["달", "탈", "땀"]), SH)),
 ("hangul_cha", (sel("Chữ nào đọc là \"cha\"?", "차", ["자", "짜", "타"], N2T), SH)),
 ("hangul_korea", (sel("Từ \"Hàn Quốc\" viết bằng Hangul là:", "한국", ["한극", "환국", "한곡"], N2T), SH)),
 ("type_flower", (typ("Gõ bằng tiếng Hàn: hoa", "꽃"), HI)),
 ("type_study", (typ("Tôi học tiếng Hàn.", "한국어를 공부해요.", "한국어를 배워요.", "저는 한국어를 공부해요.", "한국어 공부해요.", "한국어를 공부합니다."), HI)),
 ("type_water", (typ("Gõ bằng tiếng Hàn: nước", "물"), HI)),
 ("type_student", (typ("Tôi là học sinh.", "저는 학생이에요.", "학생이에요."), HI)),
 ("q_who", (fill("그 사람은 ___예요?", "누구", ["무엇", "얼마", "언제"], "Người đó là ai?"), QW)),
 ("q_where", (sel("Nhà vệ sinh ở đâu?", "화장실이 어디예요?", ["화장실이 누구예요?", "화장실이 얼마예요?", "화장실이 언제예요?"], N2T), QW)),
 ("q_price", (fill("이거 ___예요?", "얼마", ["누구", "어디", "언제"], "Cái này bao nhiêu tiền?"), QW)),
 ("q_name", (sel("Bạn tên là gì?", "이름이 뭐예요?", ["이름이 어디예요?", "이름이 누구예요?", "이름이 얼마예요?"], N2T), QW)),
 # 해요체 / 합쇼체: which register a situation asks for (unit a; essential, §64)
 ("pol_meeting", (sel("Trong buổi họp, bạn tự giới thiệu với giám đốc. Câu nào trang trọng nhất?", "저는 남입니다.", ["저는 남이에요?", "남이에요?", "저는 남입니까?"], N2T), PL)),
 ("pol_daily", (sel("Giờ nghỉ, một đồng nghiệp lớn tuổi hỏi bạn uống gì. Bạn trả lời lịch sự: \"Tôi uống cà phê.\"", "커피를 마셔요.", ["커피를 마십니까?", "커피를 마셔.", "커피를 마시십시오."], N2T), PL)),
 ("pol_sorry", (sel("Bạn xin lỗi giám đốc. Câu nào trang trọng nhất?", "죄송합니다.", ["미안해요.", "괜찮아요.", "감사합니다."], N2T), PL)),
 ("pol_bank", (sel("Nhân viên ngân hàng chào khách một cách trang trọng. Câu nào đúng?", "안녕하십니까?", ["안녕히 계세요.", "안녕하세요?", "잘 먹겠습니다."], N2T), PL)),
])

# ---------------------------------------------------------------- Section 3 (units f-j): TOPIK I-aligned listening and reading
LF, LI, LA, LD = O("listening.familiar_words"), O("listening.short_info"), O("listening.announcements"), O("listening.short_dialogues")
RM, RN, RT, RQ = O("reading.short_messages"), O("reading.notices_info"), O("reading.short_texts"), O("verbs.requests_rules")
s3 = items("s3", [
 ("dict_work", (dict_("cp3_dict_work"), LF)),
 ("dict_station", (dict_("cp3_dict_station"), LF)),
 ("word_bus", (lc("cp3_word_bus", "Bạn nghe thấy gì?", "xe buýt", ["tàu điện", "xe đạp", "máy bay"]), LF)),
 ("word_milk", (lc("cp3_word_milk", "Bạn nghe thấy gì?", "sữa", ["nước", "trà", "cà phê"]), LF)),
 ("dict_helmet", (dict_("cp3_dict_door"), LA)),
 ("ann_train", (lc("cp3_train", "Tàu đi Busan xuất phát lúc mấy giờ?", "6 giờ", ["7 giờ", "16 giờ", "6 giờ rưỡi"]), LA)),
 ("ann_bus", (lc("cp3_bus_late", "Xe buýt đến muộn bao lâu?", "15 phút", ["5 phút", "50 phút", "10 phút"]), LA)),
 ("ann_mart", (lc("cp3_mart", "Siêu thị đóng cửa lúc mấy giờ?", "10 giờ tối", ["10 giờ sáng", "9 giờ tối", "11 giờ tối"]), LA)),
 ("ann_floor", (lc("cp3_floor", "Văn phòng ở tầng mấy?", "tầng 5", ["tầng 3", "tầng 4", "tầng 15"]), LA)),
 ("info_price", (lc("cp3_price", "Chiếc áo phông giá bao nhiêu?", "15.000 won", ["5.000 won", "50.000 won", "1.500 won"]), LI)),
 ("info_class", (lc("cp3_class", "Lớp tiếng Hàn bắt đầu lúc mấy giờ?", "7 giờ tối", ["7 giờ sáng", "8 giờ tối", "1 giờ chiều"]), LI)),
 ("info_party", (lc("cp3_party", "Bữa tiệc vào khi nào?", "tối thứ Bảy", ["sáng thứ Bảy", "tối Chủ nhật", "tối thứ Sáu"]), LI)),
 ("info_meeting", (lc("cp3_meeting", "Cuộc họp bắt đầu lúc mấy giờ?", "3 giờ rưỡi", ["3 giờ", "4 giờ rưỡi", "13 giờ rưỡi"]), LI)),
 ("dlg_drink", (lc("cp3_dlg_drink", "Người thứ hai chọn gì?", "trà", ["cà phê", "nước", "sữa"]), LD)),
 ("dlg_live", (lc("cp3_dlg_live", "Người thứ hai sống ở đâu?", "bên cạnh nhà ga", ["gần công viên", "gần nhà máy", "trước siêu thị"]), LD)),
 ("dlg_movie", (lc("cp3_dlg_movie", "Người thứ hai rủ làm gì?", "cùng xem phim", ["cùng ăn tối", "cùng đi làm", "cùng đi mua sắm"]), LD)),
 ("dlg_doctor", (lc("cp3_dlg_doctor", "Người thứ hai bị làm sao?", "đau đầu", ["đau bụng", "đau họng", "bị ho"]), LD)),
 ("msg_time", (rc("cp3_msg_lan", "Tàu của Lan đến lúc mấy giờ?", "5 giờ", ["2 giờ", "4 giờ", "15 giờ"]), RM)),
 ("msg_bags", (rc("cp3_msg_lan", "Lan có mấy cái túi?", "hai cái", ["một cái", "ba cái", "không có túi nào"]), RM)),
 ("staff_toilet", (rc("cp3_notice_staff", "Hôm nay nhân viên nên dùng nhà vệ sinh ở đâu?", "ở tầng một", ["ở tầng này", "ở tầng ba", "ở văn phòng giám đốc"]), RM)),
 ("leader_meeting", (rc("cp3_msg_leader", "Cuộc họp ngày mai lúc mấy giờ?", "10 giờ sáng", ["10 giờ tối", "2 giờ chiều", "1 giờ sáng"]), RM)),
 ("shop_hours", (rc("cp3_notice_shop", "Cửa hàng mở cửa từ mấy giờ đến mấy giờ?", "từ 10 giờ sáng đến 10 giờ tối", ["từ 8 giờ sáng đến 10 giờ tối", "từ 10 giờ sáng đến 6 giờ chiều", "từ 9 giờ sáng đến 8 giờ tối"]), RN)),
 ("shop_closed", (rc("cp3_notice_shop", "Khi nào cửa hàng nghỉ?", "sáng Chủ nhật", ["cả ngày Chủ nhật", "sáng thứ Bảy", "tối Chủ nhật"]), RN)),
 ("shop_pay", (rc("cp3_notice_shop", "Khách trả tiền ở đâu?", "ở quầy thanh toán", ["ở cửa ra vào", "trên mạng", "ở ngân hàng"]), RN)),
 ("sign_noentry", (sel("출입 금지", "Cấm ra vào", ["Lối vào", "Lối ra", "Cấm hút thuốc"], T2N), RN)),
 ("friend_age", (rc("cp3_text_friend", "Chị Thuỷ bao nhiêu tuổi?", "hai mươi bốn", ["mười bốn", "bốn mươi hai", "hai mươi"]), RT)),
 ("friend_work", (rc("cp3_text_friend", "Chị Thuỷ làm việc ở đâu?", "ở một bệnh viện ở Suwon", ["ở một nhà máy ở Suwon", "ở một bệnh viện ở Seoul", "ở một trường học ở Suwon"]), RT)),
 ("week_bike", (rc("cp3_text_week", "Anh Min-su đi làm bằng gì?", "xe đạp", ["xe buýt", "tàu điện", "đi bộ"]), RT)),
 ("week_sunday", (rc("cp3_text_week", "Chủ nhật anh Min-su làm gì?", "đọc sách ở nhà", ["đi siêu thị", "đi làm", "đi xe đạp"]), RT)),
 ("req_write", (conj("서류에 주소를 ___.", "Hãy viết địa chỉ vào hồ sơ.", "쓰다", "hon:pre"), RQ)),
 ("req_wait", (conj("역 앞에서 ___.", "Hãy đợi ở trước nhà ga.", "기다리다", "hon:pre"), RQ)),
 ("req_call", (conj("저녁에 집에 전화를 ___.", "Buổi tối hãy gọi điện về nhà.", "하다", "hon:pre"), RQ)),
 ("req_rule", (sel("Không được hút thuốc ở đây.", "여기는 금연이에요.", ["여기는 비상구예요.", "여기는 위험해요.", "여기는 출구예요."], N2T), RQ)),
])

s4 = items("s4", [(x.split("_", 1)[1], speak(x)) for x in [
 "cp4_greet_evening", "cp4_thanks_water", "cp4_sorry_cup", "cp4_congrats", "cp4_name_lan", "cp4_vietnamese", "cp4_job", "cp4_work_store",
 "cp4_price_tea", "cp4_time_ten", "cp4_day_friday", "cp4_tickets_three", "cp4_desc_dog", "cp4_desc_bag", "cp4_desc_room", "cp4_desc_bike"]])
NG = O("negation.an_mot")
s5 = items("s5", [(x.split("_", 1)[1], write(x)) for x in [
 "cp5_profile_hoa", "cp5_profile_tuan", "cp5_profile_mai", "cp5_profile_hung", "cp5_like_music", "cp5_sister", "cp5_room", "cp5_neg_meat",
 "cp5_note_movie", "cp5_note_sick", "cp5_note_late", "cp5_mail_shift", "cp5_form_center", "cp5_form_clinic", "cp5_form_work", "cp5_form_bank"]] + [
 # 안 / 못 (unit p; essential, §64)
 ("neg_breakfast", (fill("저는 아침을 ___ 먹어요.", "안", ["못", "잘", "또"], "Tôi không ăn sáng (vì không muốn)."), NG)),
 ("neg_cannot", (fill("머리가 아파요. 오늘은 회사에 ___ 가요.", "못", ["안", "잘", "또"], "Tôi đau đầu. Hôm nay tôi không thể đi làm được."), NG)),
 ("neg_coffee", (sel("Tôi không uống cà phê.", "저는 커피를 안 마셔요.", ["저는 커피를 마셔요.", "저는 커피를 많이 마셔요.", "저는 차를 안 마셔요."], N2T), NG)),
 ("neg_movie", (typ("Tôi không xem phim.", "영화를 안 봐요.", "저는 영화를 안 봐요."), NG)),
])
s6 = items("s6", [(x.split("_", 1)[1], talk(x)) for x in [
 "cp6_new_colleague", "cp6_interview", "cp6_call_office", "cp6_weekend", "cp6_store_pay", "cp6_way_bank", "cp6_clinic_cough", "cp6_pharmacy"]])

# The capstone samples one objective per domain, two items in each form.
cap = items("cap", [
 ("listen_bank", (lc("a1cap_bank", "Ngân hàng mở cửa lúc mấy giờ?", "9 giờ", ["5 giờ", "7 giờ", "10 giờ"]), LI)),
 ("listen_bus", (lc("a1cap_bus", "Xe buýt số 5 dừng ở đâu?", "trước bệnh viện", ["trước nhà ga", "trước ngân hàng", "sau bệnh viện"]), LI)),
 ("listen_pharmacy", (lc("a1cap_pharmacy", "Nhà thuốc ở đâu?", "bên cạnh bưu điện", ["bên cạnh ngân hàng", "trước bưu điện", "bên cạnh nhà ga"]), LI)),
 ("listen_bag", (lc("a1cap_bag", "Cái túi giá bao nhiêu?", "25.000 won", ["20.000 won", "15.000 won", "52.000 won"]), LI)),
 ("read_mother_until", (rc("a1cap_msg_mother", "Mẹ của Hương làm việc đến mấy giờ?", "6 giờ", ["5 giờ", "7 giờ", "10 giờ"]), RM)),
 ("read_mother_fridge", (rc("a1cap_msg_mother", "Trong tủ lạnh có gì?", "bữa tối", ["nước", "sữa", "kim chi"]), RM)),
 ("read_invite_when", (rc("a1cap_invite", "Bữa tiệc vào khi nào?", "tối thứ Sáu", ["sáng thứ Sáu", "tối thứ Bảy", "tối Chủ nhật"]), RM)),
 ("read_invite_time", (rc("a1cap_invite", "Bữa tiệc bắt đầu lúc mấy giờ?", "7 giờ", ["6 giờ", "8 giờ", "1 giờ"]), RM)),
 ("speak_time", speak("a1cap_time_nine")),
 ("speak_price", speak("a1cap_price_coffee")),
 ("speak_day", speak("a1cap_day_sunday")),
 ("speak_birthday", speak("a1cap_birthday")),
 ("write_station", write("a1cap_note_station")),
 ("write_bus", write("a1cap_note_bus")),
 ("write_home", write("a1cap_note_home")),
 ("write_absent", write("a1cap_mail_absent")),
 ("talk_first_day", talk("a1cap_first_day")),
 ("talk_neighbor", talk("a1cap_neighbor")),
 ("talk_friend", talk("a1cap_friend_plan")),
 ("talk_lunch", talk("a1cap_lunch")),
])
cap_a = ["listen_bank", "listen_bus", "read_mother_until", "read_mother_fridge", "speak_time", "speak_price", "write_station", "write_bus", "talk_first_day", "talk_neighbor"]
cap_b = ["listen_pharmacy", "listen_bag", "read_invite_when", "read_invite_time", "speak_day", "speak_birthday", "write_home", "write_absent", "talk_friend", "talk_lunch"]


def two_forms(its, prefix):
    """Two parallel forms (coordinator 2026-11-05): per objective, its items alternate a / b, so each form samples
    every objective the checkpoint has two or more items for."""
    by_obj, a, b = {}, [], []
    for it in its:
        by_obj.setdefault(it["objectiveTargets"][0], []).append(it["id"])
    for obj, ids in by_obj.items():
        for i, x in enumerate(ids):
            (a if i % 2 == 0 else b).append(x)
    return [{"formId": "a", "itemIds": a}, {"formId": "b", "itemIds": b}]


def cp(sec, title, desc, its, crit=2, forms=None, cid=None):
    check_vi(title, title)
    check_vi(desc, desc)
    r = {"id": cid or f"ko.checkpoint.section-{sec}", "checkpointVersion": 1, "formVersion": 1, "sectionId": f"ko-vi:section-{sec}",
         "title": {"vi": title}, "description": {"vi": desc}, "items": its}
    r["forms"] = forms or two_forms(its, sec)
    r["criteria"] = {"minItemsPerObjective": crit, "demonstratedShare": 0.66}
    return r


CPS = [
 cp(1, "Kiểm tra Phần 1", "Lời chào, từ hằng ngày, số và giá tiền, và đọc những câu tiếng Hàn quen thuộc. Chỉ chạm để chọn, không cần gõ.", s1),
 cp(2, "Kiểm tra Phần 2", "Những viên gạch nền: câu \"A là B\", trợ từ, động từ ở thì hiện tại lịch sự, có và không có, chữ Hangul và từ để hỏi, gõ Hangul, và chọn cách nói trang trọng hay lịch sự hằng ngày.", s2),
 cp(3, "Kiểm tra Phần 3", "Nghe và đọc như phần thi TOPIK I: thông báo, hội thoại ngắn, tin nhắn, biển báo và đoạn văn ngắn. Kết quả là mức sẵn sàng ước tính, không phải điểm TOPIK.", s3),
 cp(4, "Kiểm tra Phần 4", "Nói thành tiếng: chào hỏi ở chỗ làm, giới thiệu bản thân, nói thông tin và tả đồ vật.", s4),
 cp(5, "Kiểm tra Phần 5", "Viết: giới thiệu bản thân, câu ngắn và câu phủ định, tin nhắn cho tổ trưởng và bạn bè, điền phiếu.", s5),
 cp(6, "Kiểm tra Phần 6", "Hội thoại: trò chuyện hằng ngày và lo những việc thiết thực bằng tiếng Hàn.", s6),
 cp(6, "Bài tổng kết A1", "Bài tổng kết: nghe, đọc, nói, viết và hội thoại, mỗi kỹ năng một phần nhỏ. Kết quả là ước tính theo khung CEFR, không phải chứng chỉ.", cap,
    forms=[{"formId": "a", "itemIds": [f"ko.cpi.cap.{s}" for s in cap_a]}, {"formId": "b", "itemIds": [f"ko.cpi.cap.{s}" for s in cap_b]}], cid="ko.checkpoint.a1-capstone"),
]


# ---------------------------------------------------------------- placement: 4 stages, anchors in curriculum order
def pli(prefix, slug, ex_obj):
    ex, obj = ex_obj
    ex = dict(ex)
    ex["id"] = f"ko-plx-{prefix}-{slug}"
    return {"id": f"ko.pli.{prefix}.{slug}", "itemVersion": 1, "exercise": ex, "objectiveTargets": [obj]}


def cluster(cid, obj, anchor, its):
    return {"id": f"ko.pcluster.{cid}", "objectiveId": obj, "anchorLessonId": f"ko-vi:{anchor}", "items": its}


SF, SI, SD = O("speaking.formulaic"), O("speaking.self_intro"), O("speaking.describe")
STAGES = [
 {"id": "ko.pstage.foundations", "title": {"vi": "Nhập môn"}, "clusters": [
   cluster("greetings", G, "u0-l0", [pli("s1", "first_meeting", (sel("Bạn gặp giám đốc lần đầu. Bạn nói gì?", "처음 뵙겠습니다", ["잘 먹었습니다", "안녕히 가세요", "수고하세요"], N2T), G)),
                                     pli("s1", "goodbye_go", (sel("Khách ra về, bạn ở lại. Bạn chào:", "안녕히 가세요", ["안녕히 계세요", "잘 먹겠습니다", "처음 뵙겠습니다"], N2T), G))]),
   cluster("everyday", EV, "u2-l0", [pli("s1", "father", (sel("아버지", "bố", ["mẹ", "anh trai", "ông"], T2N), EV)),
                                     pli("s1", "rice", (sel("cơm", "밥", ["빵", "물", "고기"], N2T), EV))]),
   cluster("reading", RD, "u3-l0", [pli("s1", "drink_water", (sel("저는 물을 마셔요.", "Tôi uống nước.", ["Tôi uống trà.", "Tôi ăn cơm.", "Mẹ tôi uống nước."], T2N), RD)),
                                    pli("s1", "brother_job", (sel("형은 회사원이에요.", "Anh trai tôi là nhân viên công ty.", ["Em tôi là nhân viên công ty.", "Anh trai tôi là học sinh.", "Bố tôi là nhân viên công ty."], T2N), RD))]),
   cluster("numbers", NU, "u4-l0", [pli("s1", "price", (sel("삼천 원이에요.", "Ba nghìn won.", ["Ba trăm won.", "Ba mươi nghìn won.", "Ba mươi won."], T2N), NU))]),
 ]},
 {"id": "ko.pstage.building_blocks", "title": {"vi": "Viên gạch nền"}, "clusters": [
   cluster("particles", PC, "ua-l0", [pli("s2", "topic", (fill("제 이름___ 흐엉이에요.", "은", ["는", "을", "를"], "Tên tôi là Hương."), PC))]),
   cluster("haeyo", HV, "ub-l0", [pli("s2", "study", (conj("매일 버스를 ___.", "Ngày nào tôi cũng đi xe buýt.", "타다", "haeyo:pre"), HV))]),
   cluster("exist", EX, "uc-l0", [pli("s2", "cat", (fill("방에 고양이___ 있어요.", "가", ["이", "를", "을"], "Trong phòng có con mèo."), EX))]),
   cluster("hangul", SH, "ue-l0", [pli("s2", "coffee", (sel("Từ \"cà phê\" viết bằng Hangul là:", "커피", ["거피", "코피", "커비"], N2T), SH))]),
 ]},
 {"id": "ko.pstage.reception", "title": {"vi": "Hiểu tiếng Hàn"}, "clusters": [
   cluster("listen_words", LF, "uf-l0", [pli("s3", "water", (lc("pl_mul", "Bạn nghe thấy gì?", "nước", ["sữa", "trà", "bánh mì"]), LF))]),
   cluster("read_notices", RN, "ug-l0", [pli("s3", "dinner", (rc("pl_notice_shop", "Buổi tối quán ăn mở cửa từ mấy giờ?", "từ 5 giờ", ["từ 11 giờ", "từ 2 giờ", "từ 9 giờ"]), RN)),
                                         pli("s3", "closed", (rc("pl_notice_shop", "Quán ăn nghỉ ngày nào?", "thứ Hai", ["Chủ nhật", "thứ Bảy", "thứ Ba"]), RN))]),
   cluster("read_messages", RM, "ug-l2", [pli("s3", "call", (rc("pl_message", "Lan muốn anh Min-su làm gì?", "gọi điện vào buổi tối", ["đến nhà Lan", "gọi điện vào buổi sáng", "nhắn tin cho Lan"]), RM))]),
   cluster("listen_announcements", LA, "uh-l0", [pli("s3", "shop", (lc("pl_shop", "Cửa hàng đóng cửa lúc mấy giờ?", "6 giờ", ["7 giờ", "4 giờ", "16 giờ"]), LA)),
                                                 pli("s3", "pay", (lc("pl_pay", "Khách trả tiền ở đâu?", "ở quầy thanh toán", ["ở cửa ra vào", "trên mạng", "ở ngân hàng"]), LA))]),
 ]},
 {"id": "ko.pstage.production", "title": {"vi": "Nói tiếng Hàn"}, "clusters": [
   cluster("speak_formulaic", SF, "uk-l0", [pli("s4", "hello", speak("pl_hello"))]),
   cluster("speak_intro", SI, "ul-l0", [pli("s4", "name", speak("pl_name_minh")), pli("s4", "age", speak("pl_age"))]),
   cluster("speak_describe", SD, "un-l0", [pli("s4", "car", speak("pl_big_car"))]),
 ]},
]

write_jsonl(f"{DRAFTS}/checkpoints/OUTPUT.jsonl", CPS)
write_jsonl(f"{DRAFTS}/placement/OUTPUT.jsonl", STAGES)
report()
print("checkpoints", [len(x["items"]) for x in CPS], sum(len(x["items"]) for x in CPS), "items; placement", sum(len(cl["items"]) for st in STAGES for cl in st["clusters"]), "items in", len(STAGES), "stages")

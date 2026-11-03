"""ja-vi assessment (P4c session 5), after en-assessment.py: 6 section checkpoints, the A1 capstone with 2 forms, and a
4-stage placement. Scored inputs (clips, readings, speech items, writing tasks, scenarios) are the reserved records the
layer generators already wrote (cp*, a1cap_*, pl_*); this step only points at them, and mirrors speech and writing payloads
from them. Writes checkpoints/OUTPUT.jsonl and placement/OUTPUT.jsonl; ja-check-answers.py reads both.

Every Japanese string is reading- and register-checked like the lessons (ja_layers.check: kanji only inside lexicon
surfaces or inflection keys, numbers before a counter in digits where the stored ruby stays right, no romaji); every
Vietnamese string carries no Japanese. Choices have four options like the lessons; a distractor may be wrong on purpose.
usage: python -I ja-assessment.py <repo root>"""
import json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ja_layers import DRAFTS, ROOT, check, check_vi, read_jsonl, report, write_jsonl, PROBLEMS  # noqa: E402
from ja_paradigms import tables as _paradigm_tables  # noqa: E402
from ja_text import load_lexicon  # noqa: E402

PAR = _paradigm_tables(ROOT, load_lexicon(ROOT))
OBJECTIVES = {o["id"]: o for o in read_jsonl(f"{DRAFTS}/objectives/OUTPUT.jsonl")}


def _rows(step):
    return {r["id"]: r for r in read_jsonl(f"{DRAFTS}/{step}/OUTPUT.jsonl")}


SPEECH, WRITING, SCENARIOS, CLIPS, READINGS = _rows("speech"), _rows("writing"), _rows("scenarios"), _rows("listening"), _rows("readings")
_pos = [0]
JA = re.compile(r"[ぁ-ゖァ-ヺー㐀-䶿一-鿿]")


def O(k):
    oid = f"ja.obj.{k}"
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
    """A Japanese option or prompt is reading-checked as a word or phrase; a Vietnamese one carries no Japanese."""
    if JA.search(text):
        check(where, text, plain=not text.endswith(("。", "？", "か")))
    else:
        check_vi(where, text)


def sel(prompt, correct, wrong, mode):
    """select: targetToNative shows Japanese and offers Vietnamese; nativeToTarget the reverse; listen plays the key."""
    for t in [prompt, correct, *wrong]:
        _side(t, prompt)
    o, p = place(correct, wrong)
    e = {"type": "select", "mode": mode, "prompt": prompt, "options": [{"text": t} for t in o], "correct": p}
    if mode == "targetToNative":
        e["audioTarget"] = prompt
    elif mode == "nativeToTarget":
        e["audioTarget"] = correct
    return e


def listen(word, wrong):
    for t in [word, *wrong]:
        check(word, t, plain=True)
    o, p = place(word, wrong)
    return {"type": "select", "mode": "listen", "prompt": "Nghe rồi chọn từ bạn nghe thấy.", "audioTarget": word, "options": [{"text": t} for t in o], "correct": p}


def fill(sent, ans, wrong, vi, plain=False):
    if sent.count("___") != 1:
        PROBLEMS.append(f"{sent}: a blank needs exactly one ___")
    check(sent, sent.replace("___", ans), plain)
    for w in wrong:
        check(sent, w, plain=True)
    check_vi(sent, vi)
    o, p = place(ans, wrong)
    return {"type": "fillBlank", "sentence": sent, "translation": vi, "audioTarget": sent.replace("___", ans), "options": o, "correct": p}


def conj(sent, vi, verb, cell):
    t = PAR.get(verb)
    if t is None or cell not in t["cells"]:
        PROBLEMS.append(f"{sent}: {verb} has no paradigm cell {cell}")
        return {"type": "conjugationCloze", "sentence": sent, "translation": vi, "verb": verb, "cell": cell, "answer": "?", "alternatives": []}
    ans = t["cells"][cell]
    check(sent, sent.replace("___", ans))
    check_vi(sent, vi)
    alts = [t["kana"][cell]] if cell in t["kana"] else []
    return {"type": "conjugationCloze", "sentence": sent, "translation": vi, "verb": verb, "cell": cell, "answer": ans, "alternatives": alts}


def typ(prompt, ans, *alts):
    """Typed kana: the answer is production in the script asked for (writing.kana_input)."""
    check_vi(prompt, prompt)
    for t in (ans, *alts):
        check(prompt, t, plain=True)
    return {"type": "typeAnswer", "mode": "produceTarget", "prompt": prompt, "answer": ans, "alternatives": list(alts)}


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
    cid = _known(CLIPS, f"ja.clip.{clip}", "clip")
    _q(q, correct, wrong)
    o, p = place(correct, wrong)
    return {"type": "listeningComprehension", "clipId": cid, "question": q, "options": [{"text": t} for t in o], "correct": p}


def rc(reading, q, correct, wrong):
    rid = _known(READINGS, f"ja.read.{reading}", "reading")
    _q(q, correct, wrong)
    o, p = place(correct, wrong)
    return {"type": "readingComprehension", "readingId": rid, "question": q, "options": [{"text": t} for t in o], "correct": p}


def dict_(clip):
    """Dictation of a reserved clip, as ja_lesson_lib.D: the transcript in the standard script, its kana spelling the one alternative."""
    from ja_layers import INDEX  # noqa: E402
    cid = _known(CLIPS, f"ja.clip.{clip}", "clip")
    text = "".join(s["text"] for s in CLIPS[cid]["segments"]) if cid in CLIPS else "?"
    if re.search(r"[0-9]", text):
        PROBLEMS.append(f"dictation {clip}: a number has two spellings")
    kana = INDEX.kana(text)
    return {"type": "dictation", "clipId": cid, "answer": text, "alternatives": [kana] if kana != text else []}


def speak(slug):
    """A speech exercise mirroring its reserved item; its objective is the item's."""
    sid = _known(SPEECH, f"ja.speak.{slug}", "speech item")
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
    tid = _known(WRITING, f"ja.write.{slug}", "writing task")
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
    sid = _known(SCENARIOS, f"ja.scenario.{slug}", "scenario")
    return {"type": "interactionScenario", "scenarioId": sid}, SCENARIOS[sid]["objectiveRefs"][0]


def essential(objs):
    return any(OBJECTIVES.get(o, {}).get("essential") is True for o in objs)


def items(prefix, rows):
    out = []
    for slug, (ex, objs) in rows:
        ex = dict(ex)
        ex["id"] = f"ja-cpx-{prefix}-{slug}"
        objs = objs if isinstance(objs, list) else [objs]
        out.append({"id": f"ja.cpi.{prefix}.{slug}", "itemVersion": 1, "exercise": ex, "objectiveTargets": objs, "essential": essential(objs)})
    return out


T2N, N2T = "targetToNative", "nativeToTarget"

# ---------------------------------------------------------------- Section 1: greetings, words, numbers, reading (units 0-4)
G, EV, RD, NU = O("greetings.basic"), O("vocab.everyday_basics"), O("reading.familiar_words"), O("numbers.counters")
s1 = items("s1", [
 ("greet_meal", (sel("Trước khi ăn cơm, bạn nói gì?", "いただきます", ["ごちそうさまでした", "おやすみなさい", "どういたしまして"], N2T), G)),
 ("greet_morning", (sel("Buổi sáng, bạn gặp đồng nghiệp ở nhà máy. Bạn nói gì?", "おはようございます", ["こんばんは", "さようなら", "おやすみなさい"], N2T), G)),
 ("greet_reply", (sel("Có người cảm ơn bạn. Bạn đáp lại thế nào?", "どういたしまして", ["すみません", "いただきます", "はじめまして"], N2T), G)),
 ("word_water", (sel("水", "nước", ["sữa", "trà", "cơm"], T2N), EV)),
 ("word_bread", (sel("bánh mì", "パン", ["ご飯", "卵", "肉"], N2T), EV)),
 ("word_mother", (sel("お母さん", "mẹ", ["bố", "chị gái", "em trai"], T2N), EV)),
 ("read_father", (sel("父はコーヒーを飲みます。", "Bố tôi uống cà phê.", ["Mẹ tôi uống cà phê.", "Bố tôi uống trà.", "Bố tôi ăn bánh mì."], T2N), RD)),
 ("read_sister", (sel("姉は学生です。", "Chị gái tôi là sinh viên.", ["Em gái tôi là sinh viên.", "Chị gái tôi là giáo viên.", "Anh trai tôi là sinh viên."], T2N), RD)),
 ("read_fish", (sel("わたしは魚を食べます。", "Tôi ăn cá.", ["Tôi ăn thịt.", "Tôi không ăn cá.", "Tôi uống nước."], T2N), RD)),
 ("num_apples", (sel("りんごを二つください。", "Cho tôi hai quả táo.", ["Cho tôi ba quả táo.", "Cho tôi một quả táo.", "Tôi có hai quả táo."], T2N), NU)),
 ("num_people", (sel("Có mấy người? Bạn trả lời: hai người.", "二人です", ["二つです", "2枚です", "2回です"], N2T), NU)),
 ("num_shirts", (sel("シャツを2枚買いました。", "Tôi đã mua hai cái áo sơ mi.", ["Tôi đã mua ba cái áo sơ mi.", "Tôi sẽ mua hai cái áo sơ mi.", "Tôi đã mua hai đôi giày."], T2N), NU)),
])

# ---------------------------------------------------------------- Section 2: building blocks (units a-e)
ND, PC, MV, EX, KA, KI = O("sentences.noun_desu"), O("particles.core"), O("verbs.masu_forms"), O("existence.aru_iru"), O("script.kana"), O("writing.kana_input")
AD, QW = O("adjectives.i_na"), O("questions.question_words")
s2 = items("s2", [
 ("noun_book", (sel("Đây là quyển sách của tôi.", "これはわたしの本です。", ["これはわたしは本です。", "それはわたしの本でした。", "これをわたしの本です。"], N2T), ND)),
 ("noun_desu", (fill("ナムさんは会社員___。", "です", ["ます", "を", "に"], "Anh Nam là nhân viên công ty."), ND)),
 ("part_time", (fill("毎朝7時___起きます。", "に", ["で", "を", "が"], "Mỗi sáng tôi dậy lúc 7 giờ."), PC)),
 ("part_bus", (fill("バス___会社へ行きます。", "で", ["を", "が", "の"], "Tôi đi làm bằng xe buýt."), PC)),
 ("part_place", (fill("スーパー___パンを買いました。", "で", ["を", "が", "の"], "Tôi đã mua bánh mì ở siêu thị."), PC)),
 ("masu_saw", (conj("昨日、映画を___。", "Hôm qua tôi đã xem phim.", "見る", "polite:past:aff"), MV)),
 ("masu_not_go", (conj("明日は会社へ___。", "Ngày mai tôi không đi làm.", "行く", "polite:nonpast:neg"), MV)),
 ("masu_sleep", (conj("毎晩11時に___。", "Tối nào tôi cũng đi ngủ lúc 11 giờ.", "寝る", "polite:nonpast:aff"), MV)),
 ("exist_child", (fill("公園に子供が___。", "います", ["あります", "です", "します"], "Ở công viên có trẻ con."), EX)),
 ("exist_phone", (sel("Trên bàn có cái điện thoại.", "机の上に電話があります。", ["机の上に電話がいます。", "机の上を電話があります。", "机の上で電話があります。"], N2T), EX)),
 ("kana_coffee", (sel("Từ \"cà phê\" viết bằng katakana là:", "コーヒー", ["コーヒ", "コオヒー", "ユーヒー"], N2T), KA)),
 ("kana_kitte", (listen("きって", ["きて", "きいて", "きっと"]), KA)),
 ("kana_nu", (sel("Chữ hiragana nào đọc là \"nu\"?", "ぬ", ["め", "ね", "の"], N2T), KA)),
 ("type_water", (typ("Gõ từ \"nước\" bằng hiragana.", "みず", "水"), KI)),
 ("type_vietnam", (typ("Gõ từ \"Việt Nam\" bằng katakana.", "ベトナム"), KI)),
 ("type_thanks", (typ("Gõ lời cảm ơn bằng hiragana.", "ありがとう", "ありがとうございます"), KI)),
 ("adj_hot", (sel("Hôm qua trời nóng.", "昨日は暑かったです。", ["昨日は暑いでした。", "昨日は暑くです。", "昨日は暑かったでした。"], N2T), AD)),
 ("adj_new", (fill("これは___かばんです。", "新しい", ["新しく", "新しいな", "新しくて"], "Đây là cái túi mới."), AD)),
 ("q_where", (fill("トイレは___ですか。", "どこ", ["だれ", "いつ", "いくら"], "Nhà vệ sinh ở đâu?"), QW)),
 ("q_when", (sel("Bạn đã đến Nhật khi nào?", "いつ日本へ来ましたか。", ["だれ日本へ来ましたか。", "いつ日本を来ましたか。", "なに日本へ来ましたか。"], N2T), QW)),
])

# ---------------------------------------------------------------- Section 3: listening and reading (units f-j)
LF, LI, LA, LD = O("listening.familiar_words"), O("listening.short_info"), O("listening.announcements"), O("listening.short_dialogues")
RM, RN, RT, TE = O("reading.short_messages"), O("reading.notices_info"), O("reading.short_texts"), O("verbs.te_form")
s3 = items("s3", [
 ("dict_work", (dict_("cp3_dict_work"), LF)),
 ("dict_station", (dict_("cp3_dict_station"), LF)),
 # An announcement dictation: the second task family of spoken reception (claim-gate breadth, as fr and en).
 ("dict_door", (dict_("cp3_dict_door"), LA)),
 ("ann_train", (lc("cp3_train_kyoto", "Tàu đi Kyoto chạy lúc mấy giờ?", "Lúc sáu giờ", ["Lúc bảy giờ", "Lúc mười sáu giờ", "Lúc sáu giờ rưỡi"]), LA)),
 ("ann_plane", (lc("cp3_plane", "Máy bay đến lúc mấy giờ?", "Lúc mười hai giờ", ["Lúc hai giờ", "Lúc mười giờ", "Lúc hai giờ chiều"]), LA)),
 ("ann_supermarket", (lc("cp3_supermarket", "Siêu thị đóng cửa lúc mấy giờ?", "Lúc mười giờ tối", ["Lúc mười giờ sáng", "Lúc chín giờ tối", "Lúc mười một giờ tối"]), LA)),
 ("ann_page", (lc("cp3_page", "Bạn phải mở trang mấy?", "Trang mười hai", ["Trang hai", "Trang hai mươi", "Trang mười"]), LA)),
 ("info_shirt", (lc("cp3_shirt_price", "Chiếc áo sơ mi giá bao nhiêu?", "3000 yên", ["300 yên", "13000 yên", "3500 yên"]), LI)),
 ("info_class", (lc("cp3_class", "Lớp tiếng Nhật bắt đầu lúc mấy giờ?", "Lúc bảy giờ", ["Lúc một giờ", "Lúc bốn giờ", "Lúc bảy giờ rưỡi"]), LI)),
 ("info_party", (lc("cp3_party", "Bữa tiệc vào khi nào?", "Tối thứ Bảy", ["Sáng thứ Bảy", "Tối Chủ nhật", "Tối thứ Sáu"]), LI)),
 ("dlg_tea", (lc("cp3_dlg_tea", "Người thứ hai chọn gì?", "Trà", ["Cà phê", "Nước", "Sữa"]), LD)),
 ("dlg_live", (lc("cp3_dlg_live", "Người thứ hai sống ở đâu?", "Gần nhà ga", ["Gần công viên", "Gần nhà máy", "Gần siêu thị"]), LD)),
 ("dlg_movie", (lc("cp3_dlg_movie", "Người thứ hai rủ làm gì?", "Cùng xem phim", ["Cùng ăn tối", "Cùng đi làm", "Cùng đi mua sắm"]), LD)),
 ("dlg_doctor", (lc("cp3_dlg_doctor", "Người thứ hai bị làm sao?", "Đau đầu", ["Đau bụng", "Bị sốt", "Bị ho"]), LD)),
 ("msg_time", (rc("cp3_msg_hoa", "Tàu của Hoa đến lúc mấy giờ?", "Lúc năm giờ", ["Lúc hai giờ", "Lúc bốn giờ", "Lúc mười lăm giờ"]), RM)),
 ("msg_bags", (rc("cp3_msg_hoa", "Hoa mang theo mấy kiện hành lý?", "Hai kiện", ["Một kiện", "Ba kiện", "Không có kiện nào"]), RM)),
 ("mail_copy", (rc("cp3_mail_staff", "Hôm nay nhân viên nên dùng máy photocopy ở đâu?", "Ở tầng một", ["Ở tầng hai", "Ở tầng ba", "Ở phòng của chị Kimura"]), RM)),
 ("msg_closed", (sel("今日、店は休みです。", "Hôm nay cửa hàng nghỉ.", ["Hôm nay cửa hàng mở cửa.", "Ngày mai cửa hàng nghỉ.", "Cửa hàng ở cạnh nhà ga."], T2N), RM)),
 ("note_hours", (rc("cp3_notice_shop", "Cửa hàng mở cửa từ mấy giờ đến mấy giờ?", "Từ 10 giờ đến 8 giờ", ["Từ 8 giờ đến 10 giờ", "Từ 10 giờ đến 6 giờ", "Từ 9 giờ đến 8 giờ"]), RN)),
 ("note_closed", (rc("cp3_notice_shop", "Khi nào cửa hàng nghỉ?", "Sáng Chủ nhật", ["Cả ngày Chủ nhật", "Sáng thứ Bảy", "Tối Chủ nhật"]), RN)),
 ("note_pay", (rc("cp3_notice_shop", "Khách trả tiền ở đâu?", "Ở quầy thu ngân", ["Ở cửa ra vào", "Trên mạng", "Ở ngân hàng"]), RN)),
 ("note_noentry", (sel("立入禁止", "Cấm vào", ["Lối vào", "Lối ra", "Chú ý"], T2N), RN)),
 ("text_linh_age", (rc("cp3_text_linh", "Chị Linh bao nhiêu tuổi?", "Hai mươi bốn", ["Mười bốn", "Bốn mươi hai", "Hai mươi"]), RT)),
 ("text_linh_work", (rc("cp3_text_linh", "Chị Linh làm việc ở đâu?", "Ở một bệnh viện ở Kyoto", ["Ở một nhà máy ở Kyoto", "Ở một bệnh viện ở Osaka", "Ở một trường học ở Kyoto"]), RT)),
 ("text_tuan_bike", (rc("cp3_text_week", "Anh Tuấn đi làm bằng gì?", "Xe đạp", ["Xe buýt", "Tàu điện", "Đi bộ"]), RT)),
 ("text_tuan_sunday", (rc("cp3_text_week", "Chủ nhật anh Tuấn làm gì?", "Đọc sách ở nhà", ["Đi mua sắm ở siêu thị", "Đi làm", "Đi xe đạp"]), RT)),
 ("te_write", (conj("ここに名前を___ください。", "Hãy viết tên vào đây.", "書く", "te"), TE)),
 ("te_wait", (conj("駅の前で___ください。", "Hãy đợi ở trước nhà ga.", "待つ", "te"), TE)),
])

s4 = items("s4", [(x.split("_", 1)[1], speak(x)) for x in [
 "cp4_greet_evening", "cp4_thanks_water", "cp4_sorry_cup", "cp4_congrats", "cp4_name_lan", "cp4_vietnamese", "cp4_student", "cp4_work_konbini",
 "cp4_price_tea", "cp4_time_ten", "cp4_day_friday", "cp4_tickets_three", "cp4_desc_dog", "cp4_desc_shirt"]])
s5 = items("s5", [(x.split("_", 1)[1], write(x)) for x in [
 "cp5_profile_hoa", "cp5_profile_tuan", "cp5_like_music", "cp5_sister", "cp5_room", "cp5_note_movie", "cp5_note_sick", "cp5_note_late", "cp5_mail_shift",
 "cp5_form_office", "cp5_form_clinic", "cp5_form_work"]])
s6 = items("s6", [(x.split("_", 1)[1], talk(x)) for x in [
 "cp6_new_colleague", "cp6_interview", "cp6_call_office", "cp6_konbini_pay", "cp6_way_bank", "cp6_clinic_cough"]])

# The capstone samples ONE objective per domain, two items in each form: it can contribute to a domain, never complete one.
cap = items("cap", [
 ("listen_bank", (lc("a1cap_bank", "Ngân hàng mở cửa lúc mấy giờ?", "Lúc chín giờ", ["Lúc năm giờ", "Lúc bảy giờ", "Lúc mười giờ"]), LI)),
 ("listen_bus", (lc("a1cap_bus", "Xe buýt số năm dừng ở đâu?", "Trước bệnh viện", ["Trước nhà ga", "Trước ngân hàng", "Sau bệnh viện"]), LI)),
 ("listen_pharmacy", (lc("a1cap_pharmacy", "Hiệu thuốc ở đâu?", "Cạnh bưu điện", ["Cạnh ngân hàng", "Trước bưu điện", "Cạnh nhà ga"]), LI)),
 ("listen_bag", (lc("a1cap_bag", "Cái túi giá bao nhiêu?", "2500 yên", ["2000 yên", "1500 yên", "5200 yên"]), LI)),
 ("read_mother_until", (rc("a1cap_msg_mother", "Mẹ của Mai làm việc đến mấy giờ?", "Đến sáu giờ", ["Đến năm giờ", "Đến bảy giờ", "Đến mười giờ"]), RM)),
 ("read_mother_do", (rc("a1cap_msg_mother", "Mẹ nhờ Mai làm gì?", "Rửa cốc", ["Nấu cơm tối", "Đi chợ", "Dọn tủ lạnh"]), RM)),
 ("read_invite_when", (rc("a1cap_invite", "Bữa tiệc vào khi nào?", "Tối thứ Sáu", ["Sáng thứ Sáu", "Tối thứ Bảy", "Tối Chủ nhật"]), RM)),
 ("read_invite_time", (rc("a1cap_invite", "Bữa tiệc bắt đầu lúc mấy giờ?", "Lúc bảy giờ", ["Lúc sáu giờ", "Lúc tám giờ", "Lúc một giờ"]), RM)),
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
form_a = [f"ja.cpi.cap.{s}" for s in ["listen_bank", "listen_bus", "read_mother_until", "read_mother_do", "speak_time", "speak_price", "write_station", "write_bus", "talk_first_day", "talk_neighbor"]]
form_b = [f"ja.cpi.cap.{s}" for s in ["listen_pharmacy", "listen_bag", "read_invite_when", "read_invite_time", "speak_day", "speak_birthday", "write_home", "write_absent", "talk_friend", "talk_lunch"]]


def cp(sec, title, desc, its, crit=2, forms=None, cid=None):
    check_vi(title, title)
    check_vi(desc, desc)
    r = {"id": cid or f"ja.checkpoint.section-{sec}", "checkpointVersion": 1, "formVersion": 1, "sectionId": f"ja-vi:section-{sec}",
         "title": {"vi": title}, "description": {"vi": desc}, "items": its}
    if forms:
        r["forms"] = forms
    r["criteria"] = {"minItemsPerObjective": crit, "demonstratedShare": 0.66}
    return r


CPS = [
 cp(1, "Kiểm tra Phần 1", "Thể hiện những gì bạn làm được với kiến thức nhập môn: lời chào, từ hằng ngày, số đếm và đọc những câu tiếng Nhật quen thuộc.", s1),
 cp(2, "Kiểm tra Phần 2", "Kiểm tra những viên gạch nền: câu danh từ, trợ từ, động từ thể lịch sự, động từ chỉ sự tồn tại, tính từ, từ để hỏi, và gõ chữ kana.", s2),
 cp(3, "Kiểm tra Phần 3", "Nghe và đọc: từ quen thuộc, thông báo, hội thoại ngắn, tin nhắn, biển báo và đoạn văn ngắn, cùng dạng động từ dùng trong lời chỉ dẫn.", s3),
 cp(4, "Kiểm tra Phần 4", "Nói thành tiếng: chào hỏi, giới thiệu bản thân, nói thông tin và tả đồ vật.", s4),
 cp(5, "Kiểm tra Phần 5", "Viết: giới thiệu bản thân, câu ngắn, tin nhắn cho cấp trên và bạn bè, điền phiếu.", s5),
 cp(6, "Kiểm tra Phần 6", "Hội thoại: trò chuyện hằng ngày và lo những việc thiết thực bằng tiếng Nhật.", s6, crit=3),
 cp(6, "Bài tổng kết A1", "Bài tổng kết: nghe, đọc, nói, viết và hội thoại, mỗi kỹ năng một phần nhỏ. Kết quả là ước tính theo khung CEFR, không phải chứng chỉ.", cap,
    forms=[{"formId": "a", "itemIds": form_a}, {"formId": "b", "itemIds": form_b}], cid="ja.checkpoint.a1-capstone"),
]


# ---------------------------------------------------------------- placement: 4 stages, anchors in curriculum order
def pli(prefix, slug, ex_obj):
    ex, obj = ex_obj
    ex = dict(ex)
    ex["id"] = f"ja-plx-{prefix}-{slug}"
    return {"id": f"ja.pli.{prefix}.{slug}", "itemVersion": 1, "exercise": ex, "objectiveTargets": [obj]}


def cluster(cid, obj, anchor, its):
    return {"id": f"ja.pcluster.{cid}", "objectiveId": obj, "anchorLessonId": f"ja-vi:{anchor}", "items": its}


SF, SI, SD = O("speaking.formulaic"), O("speaking.self_intro"), O("speaking.describe")
STAGES = [
 {"id": "ja.pstage.foundations", "title": {"vi": "Nhập môn"}, "clusters": [
   cluster("greetings", G, "u0-l0", [pli("s1", "first_meeting", (sel("Bạn gặp một người lần đầu. Bạn nói gì?", "はじめまして", ["さようなら", "どういたしまして", "おやすみなさい"], N2T), G)),
                                     pli("s1", "good_night", (sel("Bạn đi ngủ. Bạn nói gì với gia đình?", "おやすみなさい", ["おはようございます", "ごちそうさまでした", "はじめまして"], N2T), G))]),
   cluster("everyday", EV, "u2-l0", [pli("s1", "father", (sel("お父さん", "bố", ["mẹ", "anh trai", "ông"], T2N), EV)),
                                     pli("s1", "egg", (sel("trứng", "卵", ["肉", "魚", "水"], N2T), EV))]),
   cluster("reading", RD, "u3-l0", [pli("s1", "drink_water", (sel("わたしは水を飲みます。", "Tôi uống nước.", ["Tôi uống trà.", "Tôi ăn cơm.", "Mẹ tôi uống nước."], T2N), RD)),
                                    pli("s1", "brother_job", (sel("兄は会社員です。", "Anh trai tôi là nhân viên công ty.", ["Em trai tôi là nhân viên công ty.", "Anh trai tôi là sinh viên.", "Bố tôi là nhân viên công ty."], T2N), RD))]),
   cluster("numbers", NU, "u4-l0", [pli("s1", "three_bread", (sel("パンを三つください。", "Cho tôi ba cái bánh mì.", ["Cho tôi hai cái bánh mì.", "Cho tôi một cái bánh mì.", "Cho tôi ba cốc cà phê."], T2N), NU))]),
 ]},
 {"id": "ja.pstage.building_blocks", "title": {"vi": "Viên gạch nền"}, "clusters": [
   cluster("particles", PC, "ua-l0", [pli("s2", "from", (fill("わたしはベトナム___来ました。", "から", ["まで", "を", "が"], "Tôi đến từ Việt Nam."), PC))]),
   cluster("masu", MV, "ub-l0", [pli("s2", "study", (conj("毎日日本語を___。", "Ngày nào tôi cũng học tiếng Nhật.", "勉強する", "polite:nonpast:aff"), MV))]),
   cluster("exist", EX, "uc-l0", [pli("s2", "cat", (fill("部屋に猫が___。", "います", ["あります", "です", "します"], "Trong phòng có con mèo."), EX))]),
   cluster("kana", KA, "ue-l0", [pli("s2", "bus", (sel("Từ \"xe buýt\" viết bằng katakana là:", "バス", ["パス", "バズ", "ボス"], N2T), KA))]),
 ]},
 {"id": "ja.pstage.reception", "title": {"vi": "Hiểu tiếng Nhật"}, "clusters": [
   cluster("listen_words", LF, "uf-l0", [pli("s3", "water", (lc("pl_mizu", "Bạn nghe thấy gì?", "nước", ["sữa", "trà", "bánh mì"]), LF))]),
   cluster("read_notices", RN, "ug-l0", [pli("s3", "dinner", (rc("pl_notice_shop", "Buổi tối nhà hàng mở cửa từ mấy giờ?", "Từ 5 giờ", ["Từ 11 giờ", "Từ 2 giờ", "Từ 9 giờ"]), RN)),
                                         pli("s3", "closed", (rc("pl_notice_shop", "Nhà hàng nghỉ ngày nào?", "Thứ Hai", ["Chủ nhật", "Thứ Bảy", "Thứ Ba"]), RN))]),
   cluster("read_messages", RM, "ug-l2", [pli("s3", "call", (rc("pl_message", "Lan muốn anh Tuấn làm gì?", "Gọi điện vào buổi tối", ["Đến nhà Lan", "Gọi điện vào buổi sáng", "Viết thư cho Lan"]), RM))]),
   cluster("listen_announcements", LA, "uh-l0", [pli("s3", "shop", (lc("pl_shop", "Cửa hàng đóng cửa lúc mấy giờ?", "Lúc sáu giờ", ["Lúc bảy giờ", "Lúc bốn giờ", "Lúc mười sáu giờ"]), LA)),
                                                 pli("s3", "pay", (lc("pl_pay", "Bạn trả tiền ở đâu?", "Ở quầy thu ngân", ["Ở cửa ra vào", "Trên mạng", "Ở ngân hàng"]), LA))]),
 ]},
 {"id": "ja.pstage.production", "title": {"vi": "Nói tiếng Nhật"}, "clusters": [
   cluster("speak_formulaic", SF, "uk-l0", [pli("s4", "hello", speak("pl_hello"))]),
   cluster("speak_intro", SI, "ul-l0", [pli("s4", "name", speak("pl_name_minh")), pli("s4", "age", speak("pl_age"))]),
   cluster("speak_describe", SD, "un-l0", [pli("s4", "car", speak("pl_big_car"))]),
 ]},
]

write_jsonl(f"{DRAFTS}/checkpoints/OUTPUT.jsonl", CPS)
write_jsonl(f"{DRAFTS}/placement/OUTPUT.jsonl", STAGES)
report()
print("checkpoints", [len(x["items"]) for x in CPS], sum(len(x["items"]) for x in CPS), "items; placement", sum(len(cl["items"]) for st in STAGES for cl in st["clusters"]), "items in", len(STAGES), "stages")

"""zh-vi speech (P4d session 3), after ja-speech-s4.py: 30 teaching items with model clips (units k-n) and 22 reserved
items for checkpoint 4, the capstone (four give_info items, two in each form) and placement. Recogniser zh-CN. Writes
content/zh/_drafts/speech/OUTPUT.jsonl and appends the model clips to listening/OUTPUT.jsonl.

Targets and variants are hanzi; pinyin is never an answer (a recogniser writes characters, and a pinyin answer would be
practice only, P4b guard), and neither is Hán-Việt. Variants: zh_layers.spoken_variants widens every answer by the
zh_text rules — numbers in digits and hanzi before a measure word or unit (25岁 ⇄ 二十五岁, 两张 ⇄ 2张), the time word
before or after the subject, 这儿/这里, 星期天/星期日 — since a recogniser may write either; the grader folds traditional
characters, punctuation and spaces itself, so neither is listed. The name a learner gives is cued in Vietnamese
spelling (Nguyễn Hải) and answered in the characters the lessons taught (阮海). usage: python -I zh-speech-s4.py <repo root>
"""
import os, re, sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zh_layers import DRAFTS, PROBLEMS, check, check_vi, clip, content_refs, refs, report, spoken_variants, write_jsonl  # noqa: E402

OBJ = {"k": "zh.obj.speaking.formulaic", "l": "zh.obj.speaking.self_intro", "m": "zh.obj.speaking.give_info", "n": "zh.obj.speaking.describe"}
FAM = {"k": "formulaic_exchange", "l": "self_introduction", "m": "information_giving", "n": "description"}
REP = "Nghe, rồi nói lại."
SAY = "Hãy nói câu đó bằng tiếng Trung."
# slug, elicitation, instruction | None (repetition), target, more accepted answers, cue facts | None, emoji | None
TEACHING = {
 "k": [
  ("rep_zaoshang", "repetition", None, "早上好！", [], None, None),
  ("greet_morning", "situation_prompt", "Buổi sáng, bạn đến nhà máy. Hãy chào mọi người.", "大家早上好！", ["早上好", "大家好", "你们好", "大家早", "早"], None, None),
  ("rep_xinku", "repetition", None, "辛苦了！", [], None, None),
  ("xinku", "situation_prompt", "Hết ca, bạn đi ngang một đồng nghiệp còn đang làm. Hãy nói một câu thăm hỏi quen dùng ở chỗ làm.", "辛苦了！", ["你辛苦了", "大家辛苦了", "您辛苦了"], None, None),
  ("thanks", "situation_prompt", "Tổ trưởng giúp bạn khiêng thùng hàng. Hãy cảm ơn anh ấy.", "谢谢您！", ["谢谢", "谢谢你", "太谢谢了", "太谢谢你了", "谢谢组长", "非常感谢"], None, None),
  ("rep_xianzou", "repetition", None, "我先走了。", [], None, None),
  ("xianzou", "situation_prompt", "Ca của bạn đã hết, đồng nghiệp còn làm. Hãy xin phép về trước.", "我先走了，明天见！", ["我先走了", "我先走了，再见", "我下班了，明天见", "明天见", "我先下班了"], None, None),
  ("sorry", "situation_prompt", "Bạn đến muộn năm phút. Hãy xin lỗi tổ trưởng.", "对不起，我迟到了。", ["对不起", "不好意思，我迟到了", "不好意思", "对不起，我来晚了", "不好意思，我来晚了", "对不起，我晚到了"], None, None),
  ("excuse", "situation_prompt", "Bạn muốn hỏi đường một người lạ. Hãy mở lời lịch sự.", "请问。", ["你好，请问", "您好，请问", "不好意思，请问", "对不起，请问"], None, None),
 ],
 "l": [
  ("rep_renshi", "repetition", None, "认识您很高兴。", [], None, None),
  ("name", "information_prompt", "Hãy nói tên của bạn.", "我叫阮海。", ["我是阮海", "阮海", "我的名字是阮海", "您好，我叫阮海", "你好，我叫阮海", "我姓阮，叫阮海"], [("Tên", "Nguyễn Hải")], None),
  ("from", "information_prompt", "Hãy nói bạn là người nước nào.", "我是越南人。", ["越南人", "我从越南来", "我是从越南来的"], [("Nước", "Việt Nam")], None),
  ("age", "information_prompt", "Hãy nói tuổi của bạn.", "我今年二十五岁。", ["我二十五岁", "二十五岁", "今年二十五岁"], [("Tuổi", "25")], None),
  ("work", "information_prompt", "Hãy nói bạn làm việc ở đâu.", "我在工厂工作。", ["我在工厂上班", "在工厂工作", "我在一家工厂工作"], [("Nơi làm việc", "nhà máy")], None),
  ("like", "semantic_prompt", "Hãy nói rằng bạn thích hát.", "我喜欢唱歌。", ["我很喜欢唱歌", "我的爱好是唱歌", "我爱唱歌", "我非常喜欢唱歌"], None, "🎤"),
  ("rep_jieshao", "repetition", None, "我来介绍一下。", [], None, None),
 ],
 "m": [
  ("rep_price", "repetition", None, "十五块。", [], None, None),
  ("price", "information_prompt", "Một vị khách hỏi giá một bát mì. Hãy trả lời.", "十八块。", ["十八块钱", "十八元", "一碗十八块", "面条十八块"], [("Giá", "18 tệ")], None),
  ("time", "information_prompt", "Có người hỏi giờ. Hãy trả lời.", "现在八点。", ["八点", "八点了", "现在是八点"], [("Giờ", "8 giờ")], "🕗"),
  ("rep_half", "repetition", None, "三点半。", [], None, None),
  ("day", "information_prompt", "Hãy nói hôm nay là thứ mấy.", "今天星期一。", ["星期一", "今天是星期一"], [("Hôm nay", "thứ Hai")], None),
  ("birthday", "information_prompt", "Hãy nói sinh nhật của bạn.", "我的生日是五月十号。", ["五月十号", "我生日是五月十号", "我的生日五月十号"], [("Sinh nhật", "ngày 10 tháng 5")], "🎂"),
  ("tickets", "information_prompt", "Ở ga, bạn mua vé. Hãy nói bạn muốn hai vé.", "我要两张票。", ["两张票", "请给我两张票", "给我两张票", "我买两张票"], [("Số vé", "2")], "🎫"),
 ],
 "n": [
  ("rep_zhong", "repetition", None, "这个箱子很重。", [], None, None),
  ("box", "picture_prompt", "Nhìn hình: cái thùng to. " + SAY, "这个箱子很大。", ["箱子很大", "这个箱子非常大", "这是一个大箱子", "很大"], None, "📦"),
  ("car", "picture_prompt", "Nhìn hình: chiếc xe mới. " + SAY, "这辆车很新。", ["车很新", "这是一辆新车", "这辆汽车很新", "这是新车", "新车"], None, "🚗"),
  ("cat", "picture_prompt", "Nhìn hình: con mèo nhỏ. " + SAY, "这只猫很小。", ["猫很小", "这是一只小猫", "小猫", "这只猫非常小"], None, "🐈"),
  ("rep_bai", "repetition", None, "我的衣服是白的。", [], None, None),
  ("room", "picture_prompt", "Nhìn hình: căn phòng này sạch sẽ. " + SAY, "这个房间很干净。", ["房间很干净", "这个房间非常干净", "很干净"], None, "🛏️"),
  ("person", "picture_prompt", "Nhìn hình: người phụ nữ này cao. " + SAY, "她很高。", ["她非常高", "这个女人很高", "这个人很高", "很高"], None, "👩"),
 ],
}
# slug, unit (family, objective), elicitation, instruction, target, more accepted answers, cue facts, emoji
RESERVED = [
 ("cp4_greet_evening", "k", "situation_prompt", "Buổi tối, bạn gặp hàng xóm trước ký túc xá. Hãy chào.", "晚上好！", ["你好", "您好"], None, None),
 ("cp4_thanks_water", "k", "situation_prompt", "Một đồng nghiệp đưa cho bạn một cốc nước. Hãy cảm ơn.", "谢谢！", ["谢谢你", "谢谢您", "太谢谢你了"], None, None),
 ("cp4_sorry_cup", "k", "situation_prompt", "Bạn làm rơi cốc của đồng nghiệp. Hãy xin lỗi.", "对不起！", ["不好意思", "真对不起", "真不好意思"], None, None),
 ("cp4_congrats", "k", "situation_prompt", "Hôm nay là sinh nhật một đồng nghiệp. Hãy chúc mừng.", "生日快乐！", ["祝你生日快乐", "祝您生日快乐"], None, "🎉"),
 ("cp4_name_hua", "l", "information_prompt", "Hãy nói tên của bạn.", "我叫阮花。", ["我是阮花", "阮花", "我的名字是阮花", "我姓阮，叫阮花"], [("Tên", "Nguyễn Hoa")], None),
 ("cp4_vietnamese", "l", "situation_prompt", "Có người hỏi bạn là người nước nào. Hãy trả lời rằng bạn là người Việt.", "我是越南人。", ["越南人", "我从越南来", "我是从越南来的"], None, None),
 ("cp4_student", "l", "information_prompt", "Hãy nói bạn làm nghề gì.", "我是大学生。", ["我是学生", "大学生", "学生"], [("Công việc", "sinh viên")], None),
 ("cp4_work_shop", "l", "information_prompt", "Hãy nói bạn làm việc ở đâu.", "我在超市工作。", ["我在超市上班", "在超市工作", "我在一家超市工作"], [("Nơi làm việc", "siêu thị")], None),
 ("cp4_price_tea", "m", "information_prompt", "Một vị khách hỏi giá chai trà. Hãy trả lời.", "五块。", ["五块钱", "五元", "一瓶五块", "茶五块"], [("Giá", "5 tệ")], None),
 ("cp4_time_ten", "m", "information_prompt", "Có người hỏi giờ. Hãy trả lời.", "现在十点。", ["十点", "十点了", "现在是十点"], [("Giờ", "10 giờ")], None),
 ("cp4_day_friday", "m", "information_prompt", "Hãy nói hôm nay là thứ mấy.", "今天星期五。", ["星期五", "今天是星期五"], [("Hôm nay", "thứ Sáu")], None),
 ("cp4_tickets_three", "m", "information_prompt", "Ở ga, bạn mua vé. Hãy nói bạn muốn ba vé.", "我要三张票。", ["三张票", "请给我三张票", "给我三张票", "我买三张票"], [("Số vé", "3")], None),
 ("cp4_desc_dog", "n", "picture_prompt", "Nhìn hình: con chó to. " + SAY, "这只狗很大。", ["狗很大", "这是一只大狗", "大狗"], None, "🐕"),
 ("cp4_desc_shirt", "n", "picture_prompt", "Nhìn hình: chiếc áo trắng. " + SAY, "这件衣服是白的。", ["衣服是白的", "这是一件白衣服", "白衣服"], None, "👕"),
 ("a1cap_time_nine", "m", "information_prompt", "Có người hỏi giờ. Hãy trả lời.", "现在九点。", ["九点", "九点了", "现在是九点"], [("Giờ", "9 giờ")], None),
 ("a1cap_price_coffee", "m", "information_prompt", "Một vị khách hỏi giá cà phê. Hãy trả lời.", "二十块。", ["二十块钱", "二十元", "一杯二十块", "咖啡二十块"], [("Giá", "20 tệ")], None),
 ("a1cap_day_sunday", "m", "information_prompt", "Hãy nói hôm nay là thứ mấy.", "今天星期天。", ["星期天", "今天是星期天"], [("Hôm nay", "Chủ nhật")], None),
 ("a1cap_birthday", "m", "information_prompt", "Hãy nói sinh nhật của bạn.", "我的生日是九月二十号。", ["九月二十号", "我生日是九月二十号", "我的生日九月二十号"], [("Sinh nhật", "ngày 20 tháng 9")], None),
 ("pl_hello", "k", "situation_prompt", "Buổi trưa, bạn gặp một người quen trên phố. Hãy chào.", "你好！", ["您好", "你好啊"], None, None),
 ("pl_name_nam", "l", "information_prompt", "Hãy nói tên của bạn.", "我叫阮南。", ["我是阮南", "阮南", "我的名字是阮南"], [("Tên", "Nguyễn Nam")], None),
 ("pl_age", "l", "information_prompt", "Hãy nói tuổi của bạn.", "我今年三十岁。", ["我三十岁", "三十岁", "今年三十岁"], [("Tuổi", "30")], None),
 ("pl_big_car", "n", "picture_prompt", "Nhìn hình: chiếc xe to. " + SAY, "这辆车很大。", ["车很大", "这是一辆大车", "大车"], None, "🚙"),
]

LATIN = re.compile(r"[A-Za-zÀ-ɏḀ-ỿ]")


def prompt(instr, facts, emoji):
    p = {"instruction": {"vi": instr}}
    if facts:
        p["cueFacts"] = [{"label": {"vi": a}, "value": b} for a, b in facts]
    if emoji:
        p["cueEmoji"] = emoji
    return p


def item(sid, u, elic, instr, target, more, facts, emoji, reserved, model):
    rep = elic == "repetition"
    check(sid, target)
    check_vi(sid, instr or REP)
    for a, b in facts or []:
        check_vi(sid, a)
        check_vi(sid, b)
    lex = refs(target)
    evidence = [] if rep else [i for i in content_refs(target) if i in lex]
    plain = target.rstrip("。！？")
    variants = spoken_variants([plain] + list(more))
    for v in variants:
        if LATIN.search(v):
            PROBLEMS.append(f"{sid}: {v!r} — a spoken answer is hanzi only (no pinyin, no Hán-Việt)")
    return {"id": sid, "taskFamily": FAM[u], "elicitationType": elic, "prompt": prompt(instr or REP, facts, emoji), "target": target,
            "acceptedVariants": variants, "objectiveRefs": [OBJ[u]], "lexemeRefs": lex, "evidenceLexemeRefs": evidence,
            "assistancePolicy": {"allowContextualBias": rep, "revealTargetAfterAttempts": None if rep or reserved else 2}, "scoredEligibility": not rep,
            "modelAudioRef": model, "recognitionLocale": "zh-CN", "allowedAttempts": 2, "reserved": reserved, "sourceRef": "original-project"}


items, clips = [], []
for u, rows in TEACHING.items():
    for i, (slug, elic, instr, target, more, facts, emoji) in enumerate(rows):
        cid = f"zh.clip.u{u}_model_{slug}"
        items.append(item(f"zh.speak.{u}_{slug}", u, elic, instr, target, more, facts, emoji, False, cid))
        clips.append(clip(cid, "word_phrase", [("B" if i % 3 == 2 else "A", target)], [OBJ[u]]))
for slug, u, elic, instr, target, more, facts, emoji in RESERVED:
    items.append(item(f"zh.speak.{slug}", u, elic, instr, target, more, facts, emoji, True, None))

write_jsonl(f"{DRAFTS}/speech/OUTPUT.jsonl", items)
write_jsonl(f"{DRAFTS}/listening/OUTPUT.jsonl", clips, "a")
report()
print(len(items), "items", sum(i["reserved"] for i in items), "reserved", len(clips), "clips", dict(Counter(i["taskFamily"] for i in items)))

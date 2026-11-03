"""ja-vi speech (P4c session 4), after en-speech-s4.py: 30 teaching items with model clips (units k-n), 20 reserved items
for checkpoint 4, the capstone (four give_info items, two in each form) and placement. Recogniser ja-JP. Exam speech
items are added by the exam step. Writes content/ja/_drafts/speech/OUTPUT.jsonl and appends the model clips to
listening/OUTPUT.jsonl.

Variants: the grader folds digits 0–100 to kanji numerals (25歳 = 二十五歳) and compares the reading when the recogniser
writes kana for the author's kanji (P4b), so neither is listed twice; a duplicate after normalization fails the validator.
わたしは / 私は and the bare sentence are listed. Every target and variant is in です/ます style; Hán-Việt never appears
in an answer. usage: python -I ja-speech-s4.py <repo root>
"""
import os, sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ja_layers import DRAFTS, check, check_vi, clip, content_refs, refs, report, write_jsonl  # noqa: E402

OBJ = {"k": "ja.obj.speaking.formulaic", "l": "ja.obj.speaking.self_intro", "m": "ja.obj.speaking.give_info", "n": "ja.obj.speaking.describe"}
FAM = {"k": "formulaic_exchange", "l": "self_introduction", "m": "information_giving", "n": "description"}
REP = "Nghe, rồi nói lại."
SAY = "Hãy nói câu đó bằng tiếng Nhật."
# slug, elicitation, instruction | None (repetition), target, more accepted answers, cue facts | None, emoji | None
TEACHING = {
 "k": [
  ("rep_ohayou", "repetition", None, "おはようございます。", [], None, None),
  ("greet_morning", "situation_prompt", "Buổi sáng, bạn đến nhà máy. Hãy chào mọi người.", "おはようございます。", ["皆さん、おはようございます", "みなさん、おはようございます"], None, None),
  ("rep_otsukare", "repetition", None, "お疲れさまです。", [], None, None),
  ("otsukare", "situation_prompt", "Một đồng nghiệp đi ngang qua bạn trong giờ làm. Hãy chào theo cách ở chỗ làm.", "お疲れさまです。", ["お疲れ様です"], None, None),
  ("thanks", "situation_prompt", "Đàn anh giúp bạn khiêng thùng hàng. Hãy cảm ơn.", "ありがとうございます。", ["どうもありがとうございます", "ありがとうございました", "どうもありがとうございました"], None, None),
  ("rep_osaki", "repetition", None, "お先に失礼します。", [], None, None),
  ("osaki", "situation_prompt", "Ca của bạn đã hết, đồng nghiệp còn làm. Hãy xin phép về trước.", "お先に失礼します。", ["すみません、お先に失礼します", "では、お先に失礼します"], None, None),
  ("sorry", "situation_prompt", "Bạn đến muộn năm phút. Hãy xin lỗi đàn anh.", "遅れて、すみません。", ["すみません", "遅くなってすみません", "遅れてごめんなさい", "申し訳ありません"], None, None),
  ("excuse", "situation_prompt", "Bạn muốn hỏi đường một người lạ. Hãy mở lời lịch sự.", "すみません。", ["あのう、すみません", "すみません、ちょっといいですか"], None, None),
 ],
 "l": [
  ("rep_hajimemashite", "repetition", None, "はじめまして。", [], None, None),
  ("name", "information_prompt", "Hãy nói tên của bạn.", "ナムです。", ["わたしはナムです", "私はナムです", "はじめまして、ナムです", "ナムと申します"], [("Tên", "Nam")], None),
  ("from", "information_prompt", "Hãy nói bạn đến từ đâu.", "ベトナムから来ました。", ["わたしはベトナムから来ました", "私はベトナムから来ました", "ベトナム人です", "わたしはベトナム人です"], [("Nước", "Việt Nam")], None),
  ("age", "information_prompt", "Hãy nói tuổi của bạn.", "25歳です。", ["わたしは25歳です", "私は25歳です"], [("Tuổi", "25")], None),
  ("work", "information_prompt", "Hãy nói bạn làm việc ở đâu.", "工場で働いています。", ["工場で働きます", "わたしは工場で働いています", "私は工場で働いています"], [("Nơi làm việc", "nhà máy")], None),
  ("like", "semantic_prompt", "Hãy nói rằng bạn thích bóng đá.", "サッカーが好きです。", ["サッカーが大好きです", "わたしはサッカーが好きです", "趣味はサッカーです"], None, "⚽"),
  ("rep_yoroshiku", "repetition", None, "よろしくおねがいします。", [], None, None),
 ],
 "m": [
  ("rep_price", "repetition", None, "500円です。", [], None, None),
  ("price", "information_prompt", "Một vị khách hỏi giá hộp cơm. Hãy trả lời.", "450円です。", ["お弁当は450円です", "450円"], [("Giá", "450 yên")], None),
  ("time", "information_prompt", "Có người hỏi giờ. Hãy trả lời.", "8時です。", ["今、8時です", "8時"], [("Giờ", "8 giờ")], "🕗"),
  ("rep_half", "repetition", None, "3時半です。", [], None, None),
  ("day", "information_prompt", "Hãy nói hôm nay là thứ mấy.", "今日は月曜日です。", ["月曜日です"], [("Hôm nay", "thứ Hai")], None),
  ("birthday", "information_prompt", "Hãy nói sinh nhật của bạn.", "誕生日は五月十日です。", ["五月十日です", "わたしの誕生日は五月十日です"], [("Sinh nhật", "ngày 10 tháng 5")], "🎂"),
  ("tickets", "information_prompt", "Ở ga, bạn mua vé. Hãy nói bạn muốn hai vé.", "切符を2枚ください。", ["2枚ください", "切符を2枚お願いします", "2枚お願いします"], [("Số vé", "2")], "🎫"),
 ],
 "n": [
  ("rep_ookii", "repetition", None, "この箱は大きいです。", [], None, None),
  ("box", "picture_prompt", "Nhìn hình: cái thùng to. " + SAY, "大きい箱です。", ["この箱は大きいです", "箱は大きいです", "大きいです"], None, "📦"),
  ("car", "picture_prompt", "Nhìn hình: chiếc ô tô mới. " + SAY, "新しい車です。", ["この車は新しいです", "車は新しいです", "新しいです"], None, "🚗"),
  ("cat", "picture_prompt", "Nhìn hình: con mèo nhỏ. " + SAY, "小さい猫です。", ["この猫は小さいです", "猫は小さいです", "小さいです"], None, "🐈"),
  ("rep_shiroi", "repetition", None, "白いシャツです。", [], None, None),
  ("room", "picture_prompt", "Nhìn hình: căn phòng này rộng. " + SAY, "この部屋は広いです。", ["部屋は広いです", "広い部屋です", "広いです"], None, "🛋️"),
  ("person", "picture_prompt", "Nhìn hình: người phụ nữ này cao. " + SAY, "背が高いです。", ["この人は背が高いです", "女の人は背が高いです", "背の高い人です"], None, "👩"),
 ],
}
# slug, unit (family, objective), elicitation, instruction, target, more accepted answers, cue facts, emoji
RESERVED = [
 ("cp4_greet_evening", "k", "situation_prompt", "Buổi tối, bạn gặp hàng xóm trước ký túc xá. Hãy chào.", "こんばんは。", [], None, None),
 ("cp4_thanks_water", "k", "situation_prompt", "Một đồng nghiệp đưa cho bạn một cốc nước. Hãy cảm ơn.", "ありがとうございます。", ["どうもありがとうございます", "どうも"], None, None),
 ("cp4_sorry_cup", "k", "situation_prompt", "Bạn làm rơi cốc của đồng nghiệp. Hãy xin lỗi.", "すみません。", ["ごめんなさい", "本当にすみません", "申し訳ありません"], None, None),
 ("cp4_name_lan", "l", "information_prompt", "Hãy nói tên của bạn.", "ランです。", ["わたしはランです", "私はランです", "ランと申します"], [("Tên", "Lan")], None),
 ("cp4_vietnamese", "l", "situation_prompt", "Có người hỏi quốc tịch của bạn. Hãy trả lời rằng bạn là người Việt.", "ベトナム人です。", ["わたしはベトナム人です", "私はベトナム人です", "ベトナムから来ました"], None, None),
 ("cp4_student", "l", "information_prompt", "Hãy nói bạn làm nghề gì.", "学生です。", ["わたしは学生です", "私は学生です"], [("Công việc", "sinh viên")], None),
 ("cp4_price_tea", "m", "information_prompt", "Một vị khách hỏi giá chai trà. Hãy trả lời.", "150円です。", ["お茶は150円です", "150円"], [("Giá", "150 yên")], None),
 ("cp4_time_ten", "m", "information_prompt", "Có người hỏi giờ. Hãy trả lời.", "10時です。", ["今、10時です", "10時"], [("Giờ", "10 giờ")], None),
 ("cp4_day_friday", "m", "information_prompt", "Hãy nói hôm nay là thứ mấy.", "今日は金曜日です。", ["金曜日です"], [("Hôm nay", "thứ Sáu")], None),
 ("cp4_tickets_three", "m", "information_prompt", "Ở ga, bạn mua vé. Hãy nói bạn muốn ba vé.", "切符を3枚ください。", ["3枚ください", "切符を3枚お願いします", "3枚お願いします"], [("Số vé", "3")], None),
 ("cp4_desc_dog", "n", "picture_prompt", "Nhìn hình: con chó to. " + SAY, "大きい犬です。", ["この犬は大きいです", "犬は大きいです", "大きいです"], None, "🐕"),
 ("cp4_desc_shirt", "n", "picture_prompt", "Nhìn hình: chiếc áo sơ mi trắng. " + SAY, "白いシャツです。", ["このシャツは白いです", "シャツは白いです", "白いです"], None, "👕"),
 ("a1cap_time_nine", "m", "information_prompt", "Có người hỏi giờ. Hãy trả lời.", "9時です。", ["今、9時です", "9時"], [("Giờ", "9 giờ")], None),
 ("a1cap_price_coffee", "m", "information_prompt", "Một vị khách hỏi giá cà phê. Hãy trả lời.", "200円です。", ["コーヒーは200円です", "200円"], [("Giá", "200 yên")], None),
 ("a1cap_day_sunday", "m", "information_prompt", "Hãy nói hôm nay là thứ mấy.", "今日は日曜日です。", ["日曜日です"], [("Hôm nay", "Chủ nhật")], None),
 ("a1cap_birthday", "m", "information_prompt", "Hãy nói sinh nhật của bạn.", "誕生日は九月二十日です。", ["九月二十日です", "わたしの誕生日は九月二十日です"], [("Sinh nhật", "ngày 20 tháng 9")], None),
 ("pl_hello", "k", "situation_prompt", "Buổi trưa, bạn gặp một người quen trên phố. Hãy chào.", "こんにちは。", [], None, None),
 ("pl_name_minh", "l", "information_prompt", "Hãy nói tên của bạn.", "ミンです。", ["わたしはミンです", "私はミンです"], [("Tên", "Minh")], None),
 ("pl_age", "l", "information_prompt", "Hãy nói tuổi của bạn.", "30歳です。", ["わたしは30歳です", "私は30歳です"], [("Tuổi", "30")], None),
 ("pl_big_car", "n", "picture_prompt", "Nhìn hình: chiếc ô tô to. " + SAY, "大きい車です。", ["この車は大きいです", "車は大きいです", "大きいです"], None, "🚙"),
]


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
    plain = target.rstrip("。！")
    return {"id": sid, "taskFamily": FAM[u], "elicitationType": elic, "prompt": prompt(instr or REP, facts, emoji), "target": target,
            "acceptedVariants": [plain] + [v for v in more if v != plain], "objectiveRefs": [OBJ[u]], "lexemeRefs": lex, "evidenceLexemeRefs": evidence,
            "assistancePolicy": {"allowContextualBias": rep, "revealTargetAfterAttempts": None if rep or reserved else 2}, "scoredEligibility": not rep,
            "modelAudioRef": model, "recognitionLocale": "ja-JP", "allowedAttempts": 2, "reserved": reserved, "sourceRef": "original-project"}


items, clips = [], []
for u, rows in TEACHING.items():
    for i, (slug, elic, instr, target, more, facts, emoji) in enumerate(rows):
        cid = f"ja.clip.u{u}_model_{slug}"
        items.append(item(f"ja.speak.{u}_{slug}", u, elic, instr, target, more, facts, emoji, False, cid))
        clips.append(clip(cid, "word_phrase", [("B" if i % 3 == 2 else "A", target)], [OBJ[u]]))
for slug, u, elic, instr, target, more, facts, emoji in RESERVED:
    items.append(item(f"ja.speak.{slug}", u, elic, instr, target, more, facts, emoji, True, None))

write_jsonl(f"{DRAFTS}/speech/OUTPUT.jsonl", items)
write_jsonl(f"{DRAFTS}/listening/OUTPUT.jsonl", clips, "a")
report()
print(len(items), "items", sum(i["reserved"] for i in items), "reserved", len(clips), "clips", dict(Counter(i["taskFamily"] for i in items)))

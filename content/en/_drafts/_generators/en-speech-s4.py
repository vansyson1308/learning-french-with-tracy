"""en-vi speech: 31 teaching items with model clips (units k-n), 22 reserved items for checkpoint 4, the capstone and placement.
Writes content/en/_drafts/speech/OUTPUT.jsonl and appends the model clips to listening/OUTPUT.jsonl.
Contractions need no second variant: the English rules fold I'm = I am, so listing both is a duplicate-variant error.
usage: python -I en-speech-s4.py <repo root>
"""
import os, sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from en_refs import check, clip, content_refs, refs, report, write_jsonl

DRAFTS = sys.argv[1] + "/content/en/_drafts"
OBJ = {"k": "en.obj.speaking.formulaic", "l": "en.obj.speaking.self_intro", "m": "en.obj.speaking.give_info", "n": "en.obj.speaking.describe"}
FAM = {"k": "formulaic_exchange", "l": "self_introduction", "m": "information_giving", "n": "description"}
REP = "Nghe, rồi nói lại."
# slug, elicitation, instruction | None (repetition), target, more accepted answers, cue facts | None, emoji | None
TEACHING = {
 "k": [
  ("rep_hello", "repetition", None, "Hello!", [], None, None),
  ("greet_morning", "situation_prompt", "Buổi sáng, bạn bước vào văn phòng. Hãy chào đồng nghiệp.", "Good morning!", ["Morning", "Hello", "Hi", "Good morning everyone"], None, None),
  ("rep_thanks", "repetition", None, "Thank you very much!", ["Thank you"], None, None),
  ("thank", "situation_prompt", "Một đồng nghiệp giúp bạn mang thùng hàng. Hãy cảm ơn.", "Thank you!", ["Thanks", "Thanks a lot", "Thank you very much"], None, None),
  ("rep_evening", "repetition", None, "Good evening!", [], None, None),
  ("greet_evening", "situation_prompt", "Buổi tối, một vị khách bước vào khách sạn nơi bạn làm việc. Hãy chào lịch sự.", "Good evening!", ["Hello", "Good evening sir", "Good evening madam"], None, None),
  ("bye", "situation_prompt", "Hết ca làm, bạn chia tay một người bạn. Hãy chào tạm biệt.", "Goodbye!", ["Bye", "Bye bye", "See you", "See you tomorrow"], None, None),
  ("rep_sorry", "repetition", None, "I'm sorry!", ["Sorry"], None, None),
  ("excuse", "situation_prompt", "Một người lạ đứng chắn lối đi của bạn. Hãy nói lịch sự để xin qua.", "Excuse me!", ["Excuse me please", "Sorry"], None, None),
 ],
 "l": [
  ("rep_name", "repetition", None, "My name is Minh.", ["I'm Minh"], None, None),
  ("name", "information_prompt", "Hãy nói tên của bạn.", "My name is Minh.", ["I'm Minh", "My name's Minh"], [("Tên", "Minh")], None),
  ("rep_from", "repetition", None, "I'm from Vietnam.", ["I come from Vietnam"], None, None),
  ("from", "information_prompt", "Hãy nói bạn từ đâu đến.", "I'm from Hanoi.", ["I come from Hanoi"], [("Quê", "Hà Nội")], None),
  ("live", "information_prompt", "Hãy nói bạn đang sống ở thành phố nào.", "I live in Hue.", [], [("Thành phố", "Huế")], None),
  ("age", "information_prompt", "Hãy nói tuổi của bạn.", "I'm twenty-five years old.", ["I'm twenty-five"], [("Tuổi", "25")], None),
  ("work", "information_prompt", "Hãy nói bạn làm việc ở đâu.", "I work in a factory.", ["I work at a factory"], [("Nơi làm việc", "nhà máy")], None),
  ("like", "semantic_prompt", "Hãy nói rằng bạn thích cà phê.", "I like coffee.", ["I love coffee", "I like coffee very much"], None, "☕"),
 ],
 "m": [
  ("rep_ten", "repetition", None, "It costs ten dollars.", ["Ten dollars"], None, None),
  ("price", "information_prompt", "Một vị khách hỏi giá cà phê. Hãy trả lời.", "It costs three dollars.", ["Three dollars", "It's three dollars", "The coffee costs three dollars"], [("Giá", "3 đô la")], None),
  ("children", "information_prompt", "Hãy nói bạn có mấy đứa con.", "I have two children.", ["Two children", "I've got two children"], [("Số con", "2")], None),
  ("time", "information_prompt", "Có người hỏi giờ. Hãy trả lời.", "It's eight o'clock.", ["Eight o'clock", "It's eight"], [("Giờ", "8 giờ")], "🕗"),
  ("rep_half", "repetition", None, "It's half past two.", ["Half past two"], None, None),
  ("day", "information_prompt", "Hãy nói hôm nay là thứ mấy.", "Today is Monday.", ["It's Monday", "Monday"], [("Hôm nay", "thứ Hai")], None),
  ("team", "information_prompt", "Hãy nói nhóm của bạn có bao nhiêu người.", "There are ten people in my team.", ["Ten people", "We have ten people"], [("Số người", "10")], None),
 ],
 "n": [
  ("rep_big", "repetition", None, "The house is big.", [], None, None),
  ("house", "picture_prompt", "Nhìn hình: ngôi nhà to. Hãy nói câu đó bằng tiếng Anh.", "The house is big.", ["It's a big house", "A big house", "It's big"], None, "🏠"),
  ("cat", "picture_prompt", "Nhìn hình: con mèo nhỏ. Hãy nói câu đó bằng tiếng Anh.", "The cat is small.", ["It's a small cat", "A small cat", "It's small"], None, "🐈"),
  ("car", "picture_prompt", "Nhìn hình: chiếc ô tô cũ. Hãy nói câu đó bằng tiếng Anh.", "The car is old.", ["It's an old car", "An old car", "It's old"], None, "🚗"),
  ("rep_new", "repetition", None, "The phone is new.", [], None, None),
  ("woman", "picture_prompt", "Nhìn hình: người phụ nữ này cao. Hãy nói câu đó bằng tiếng Anh.", "She is tall.", ["The woman is tall", "She's a tall woman"], None, "👩"),
  ("room", "picture_prompt", "Nhìn hình: trong phòng có một cái bàn. Hãy nói câu đó bằng tiếng Anh.", "There is a table in the room.", ["There is a table"], None, "🛋️"),
 ],
}
# slug, unit (family, objective), elicitation, instruction, target, more accepted answers, cue facts, emoji
RESERVED = [
 ("cp4_greet_afternoon", "k", "situation_prompt", "Buổi chiều, bạn gặp quản lý ở hành lang. Hãy chào lịch sự.", "Good afternoon.", ["Hello", "Good afternoon sir", "Good afternoon madam"], None, None),
 ("cp4_thanks_water", "k", "situation_prompt", "Một người đưa cho bạn một ly nước. Hãy cảm ơn.", "Thank you.", ["Thanks", "Thank you very much", "Thanks a lot"], None, None),
 ("cp4_sorry_cup", "k", "situation_prompt", "Bạn làm rơi cốc của đồng nghiệp. Hãy xin lỗi.", "I'm sorry.", ["Sorry", "I'm so sorry", "I'm very sorry"], None, None),
 ("cp4_name_lan", "l", "information_prompt", "Hãy nói tên của bạn.", "My name is Lan.", ["I'm Lan", "My name's Lan"], [("Tên", "Lan")], None),
 ("cp4_vietnamese", "l", "situation_prompt", "Một người hỏi quốc tịch của bạn. Hãy trả lời rằng bạn là người Việt.", "I'm Vietnamese.", ["I'm from Vietnam", "I come from Vietnam"], None, None),
 ("cp4_driver", "l", "information_prompt", "Hãy nói bạn làm nghề gì.", "I'm a driver.", ["I work as a driver"], [("Công việc", "tài xế")], None),
 ("cp4_price_bag", "m", "information_prompt", "Một vị khách hỏi giá cái túi. Hãy trả lời.", "It costs fifteen dollars.", ["Fifteen dollars", "It's fifteen dollars", "The bag costs fifteen dollars"], [("Giá", "15 đô la")], None),
 ("cp4_time_ten", "m", "information_prompt", "Có người hỏi giờ. Hãy trả lời.", "It's ten o'clock.", ["Ten o'clock", "It's ten"], [("Giờ", "10 giờ")], None),
 ("cp4_day_friday", "m", "information_prompt", "Hãy nói hôm nay là thứ mấy.", "Today is Friday.", ["It's Friday", "Friday"], [("Hôm nay", "thứ Sáu")], None),
 ("cp4_brothers", "m", "information_prompt", "Hãy nói bạn có mấy anh trai.", "I have two brothers.", ["Two brothers", "I've got two brothers"], [("Số anh trai", "2")], None),
 ("cp4_desc_dog", "n", "picture_prompt", "Nhìn hình: con chó to. Hãy nói câu đó bằng tiếng Anh.", "The dog is big.", ["It's a big dog", "A big dog", "It's big"], None, "🐕"),
 ("cp4_desc_shirt", "n", "picture_prompt", "Nhìn hình: chiếc áo màu xanh lam. Hãy nói câu đó bằng tiếng Anh.", "The shirt is blue.", ["It's a blue shirt", "A blue shirt", "It's blue"], None, "👕"),
 ("a1cap_water", "k", "situation_prompt", "Bạn muốn xin một ly nước. Hãy nói thật lịch sự.", "Water, please.", ["Can I have some water please", "I'd like some water please", "Some water please", "A glass of water please"], None, None),
 ("a1cap_live", "l", "information_prompt", "Hãy nói bạn sống ở thành phố nào.", "I live in Hanoi.", [], [("Thành phố", "Hà Nội")], None),
 ("a1cap_hospital", "l", "information_prompt", "Hãy nói bạn làm việc ở đâu.", "I work in a hospital.", ["I work at a hospital"], [("Nơi làm việc", "bệnh viện")], None),
 ("a1cap_price_tea", "m", "information_prompt", "Một vị khách hỏi giá trà. Hãy trả lời.", "It costs two dollars.", ["Two dollars", "It's two dollars", "The tea costs two dollars"], [("Giá", "2 đô la")], None),
 ("a1cap_birthday", "m", "information_prompt", "Hãy nói sinh nhật của bạn vào tháng nào.", "My birthday is in May.", ["It's in May", "In May"], [("Sinh nhật", "tháng Năm")], None),
 ("a1cap_desc_house", "n", "picture_prompt", "Nhìn hình: ngôi nhà nhỏ. Hãy nói câu đó bằng tiếng Anh.", "The house is small.", ["It's a small house", "A small house", "It's small"], None, "🏡"),
 ("pl_hello", "k", "situation_prompt", "Bạn gặp một người bạn trên phố. Hãy chào.", "Hello!", ["Hi", "Hi there"], None, None),
 ("pl_name_nam", "l", "information_prompt", "Hãy nói tên của bạn.", "My name is Nam.", ["I'm Nam", "My name's Nam"], [("Tên", "Nam")], None),
 ("pl_age", "l", "information_prompt", "Hãy nói tuổi của bạn.", "I'm thirty years old.", ["I'm thirty"], [("Tuổi", "30")], None),
 ("pl_big_car", "n", "picture_prompt", "Nhìn hình: chiếc ô tô to. Hãy nói câu đó bằng tiếng Anh.", "The car is big.", ["It's a big car", "A big car", "It's big"], None, "🚙"),
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
    lex = refs(target)
    evidence = [] if rep else [i for i in content_refs(target) if i in lex]
    plain = target.rstrip("!.")
    return {"id": sid, "taskFamily": FAM[u], "elicitationType": elic, "prompt": prompt(instr or REP, facts, emoji), "target": target,
            "acceptedVariants": [plain] + [v for v in more if v != plain], "objectiveRefs": [OBJ[u]], "lexemeRefs": lex, "evidenceLexemeRefs": evidence,
            "assistancePolicy": {"allowContextualBias": rep, "revealTargetAfterAttempts": None if rep or reserved else 2}, "scoredEligibility": not rep,
            "modelAudioRef": model, "recognitionLocale": "en-US", "allowedAttempts": 2, "reserved": reserved, "sourceRef": "original-project"}


items, clips = [], []
for u, rows in TEACHING.items():
    for i, (slug, elic, instr, target, more, facts, emoji) in enumerate(rows):
        cid = f"en.clip.u{u}_model_{slug}"
        items.append(item(f"en.speak.{u}_{slug}", u, elic, instr, target, more, facts, emoji, False, cid))
        clips.append(clip(cid, "word_phrase", [("B" if i % 3 == 2 else "A", target)], [OBJ[u]]))
for slug, u, elic, instr, target, more, facts, emoji in RESERVED:
    items.append(item(f"en.speak.{slug}", u, elic, instr, target, more, facts, emoji, True, None))

write_jsonl(f"{DRAFTS}/speech/OUTPUT.jsonl", items)
write_jsonl(f"{DRAFTS}/listening/OUTPUT.jsonl", clips, "a")
report()
print(len(items), "items", sum(i["reserved"] for i in items), "reserved", len(clips), "clips", dict(Counter(i["taskFamily"] for i in items)))

"""ko-vi speech (P4e session 3), after ja-speech-s4.py: 30 teaching items with model clips (units k-n) and 22 reserved
items for checkpoint 4, the capstone (four give_info items, two in each form) and placement. Recogniser ko-KR.
TOPIK I has no speaking section, so the exam step adds no speech item. Writes content/ko/_drafts/speech/OUTPUT.jsonl
and appends the model clips to listening/OUTPUT.jsonl. The model clips have no asset (device voice, unscored).

Accepted variants: the target, the hand-listed answers, and every fair rendering ko_text.variants gives (저는 dropped
or stated, 제 / 우리, 합쇼체, 안 ⇄ -지 않아요 …), deduplicated without spaces and punctuation. Numbers are Hangul
only: the speech grader spells digits the recogniser writes (1개 → 한 개, 3시 → 세 시, 5,000 → 오천), so a digit
variant would duplicate its Hangul one. 해요체 throughout; 합쇼체 in the set phrases and their renderings.
usage: python -I ko-speech-s4.py <repo root>
"""
import os, re, sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ko_layers import DRAFTS, INDEX, check, check_vi, clip, content_refs, refs, report, write_jsonl  # noqa: E402
from ko_text import _bare, variants as fair  # noqa: E402

OBJ = {"k": "ko.obj.speaking.formulaic", "l": "ko.obj.speaking.self_intro", "m": "ko.obj.speaking.give_info", "n": "ko.obj.speaking.describe"}
FAM = {"k": "formulaic_exchange", "l": "self_introduction", "m": "information_giving", "n": "description"}
REP = "Nghe, rồi nói lại."
SAY = "Hãy nói câu đó bằng tiếng Hàn."
# slug, elicitation, instruction | None (repetition), target, more accepted answers, cue facts | None, emoji | None
TEACHING = {
 "k": [
  ("rep_annyeong", "repetition", None, "안녕하세요.", [], None, None),
  ("greet_leader", "situation_prompt", "Buổi sáng, bạn gặp tổ trưởng ở nhà máy. Hãy chào.", "반장님, 안녕하세요.", ["안녕하세요", "안녕하세요, 반장님"], None, None),
  ("rep_sugo", "repetition", None, "수고하셨습니다.", [], None, None),
  ("sugo", "situation_prompt", "Hết ca, mọi người cùng về. Hãy chào đồng nghiệp theo cách ở chỗ làm.", "수고하셨습니다.", ["오늘도 수고하셨습니다"], None, None),
  ("thanks", "situation_prompt", "Một đồng nghiệp giúp bạn khiêng thùng hàng. Hãy cảm ơn.", "감사합니다.", ["고맙습니다", "정말 감사합니다", "고마워요"], None, None),
  ("rep_meonjeo", "repetition", None, "먼저 가보겠습니다.", [], None, None),
  ("leave_first", "situation_prompt", "Ca của bạn đã hết, đồng nghiệp vẫn làm. Hãy xin phép về trước.", "먼저 가보겠습니다.", ["먼저 가보겠습니다. 수고하세요", "수고하세요"], None, None),
  ("sorry", "situation_prompt", "Bạn đến muộn năm phút. Hãy xin lỗi tổ trưởng.", "늦어서 죄송합니다.", ["죄송합니다", "늦었어요. 죄송합니다", "늦어서 미안해요", "반장님, 죄송합니다"], None, None),
  ("excuse", "situation_prompt", "Bạn muốn hỏi đường một người lạ. Hãy mở lời lịch sự.", "실례합니다.", ["저기요", "저기요, 실례합니다"], None, None),
 ],
 "l": [
  ("rep_cheoeum", "repetition", None, "처음 뵙겠습니다.", [], None, None),
  ("name", "information_prompt", "Hãy nói tên của bạn.", "저는 남이에요.", ["제 이름은 남이에요", "처음 뵙겠습니다. 남입니다", "저는 응우옌 남이에요"], [("Tên", "Nam")], None),
  ("from", "information_prompt", "Hãy nói bạn đến từ đâu.", "베트남에서 왔어요.", ["저는 베트남 사람이에요", "베트남 사람이에요"], [("Nước", "Việt Nam")], None),
  ("age", "information_prompt", "Hãy nói tuổi của bạn.", "스물다섯 살이에요.", ["저는 스물다섯 살이에요"], [("Tuổi", "25")], None),
  ("work", "information_prompt", "Hãy nói bạn làm việc ở đâu.", "공장에서 일해요.", ["저는 공장에서 일해요"], [("Nơi làm việc", "nhà máy")], None),
  ("like", "semantic_prompt", "Hãy nói rằng bạn thích bóng đá.", "축구를 좋아해요.", ["축구가 좋아요", "제 취미는 축구예요"], None, "⚽"),
  ("rep_butak", "repetition", None, "잘 부탁드립니다.", [], None, None),
 ],
 "m": [
  ("rep_price", "repetition", None, "오천 원이에요.", [], None, None),
  ("price", "information_prompt", "Một vị khách hỏi giá hộp cơm. Hãy trả lời.", "사천오백 원이에요.", ["도시락은 사천오백 원이에요"], [("Giá", "4.500 won")], None),
  ("time", "information_prompt", "Có người hỏi giờ. Hãy trả lời.", "여덟 시예요.", ["지금 여덟 시예요"], [("Giờ", "8 giờ")], "🕗"),
  ("rep_half", "repetition", None, "세 시 반이에요.", [], None, None),
  ("day", "information_prompt", "Hãy nói hôm nay là thứ mấy.", "오늘은 월요일이에요.", ["월요일이에요"], [("Hôm nay", "thứ Hai")], None),
  ("birthday", "information_prompt", "Hãy nói sinh nhật của bạn.", "제 생일은 오월 십일이에요.", ["오월 십일이에요", "생일은 오월 십일이에요"], [("Sinh nhật", "ngày 10 tháng 5")], "🎂"),
  ("tickets", "information_prompt", "Ở ga, bạn mua vé. Hãy nói bạn muốn hai vé.", "표 두 장 주세요.", ["두 장 주세요", "표 두 장이요"], [("Số vé", "2")], "🎫"),
 ],
 "n": [
  ("rep_keoyo", "repetition", None, "이 상자는 커요.", [], None, None),
  ("box", "picture_prompt", "Nhìn hình: cái thùng to. " + SAY, "상자가 커요.", ["큰 상자예요", "커요"], None, "📦"),
  ("car", "picture_prompt", "Nhìn hình: chiếc ô tô đắt tiền. " + SAY, "자동차가 비싸요.", ["비싼 자동차예요", "비싸요"], None, "🚗"),
  ("cat", "picture_prompt", "Nhìn hình: con mèo nhỏ. " + SAY, "고양이가 작아요.", ["작은 고양이예요", "작아요"], None, "🐈"),
  ("rep_past", "repetition", None, "어제 영화를 봤어요.", [], None, None),
  ("weekend", "semantic_prompt", "Hãy nói: cuối tuần trước bạn đã đi Busan.", "지난 주말에 부산에 갔어요.", ["주말에 부산에 갔어요", "지난주에 부산에 갔어요"], None, None),
  ("tomorrow", "semantic_prompt", "Hãy nói: ngày mai bạn sẽ gặp bạn bè.", "내일 친구를 만날 거예요.", ["내일 친구를 만나요"], None, None),
 ],
}
# slug, unit, elicitation, instruction, target, more accepted answers, cue facts, emoji
RESERVED = [
 ("cp4_greet_evening", "k", "situation_prompt", "Buổi tối, bạn gặp hàng xóm trước ký túc xá. Hãy chào.", "안녕하세요.", [], None, None),
 ("cp4_thanks_water", "k", "situation_prompt", "Một đồng nghiệp đưa cho bạn một cốc nước. Hãy cảm ơn.", "감사합니다.", ["고맙습니다", "고마워요"], None, None),
 ("cp4_sorry_cup", "k", "situation_prompt", "Bạn làm rơi cốc của đồng nghiệp. Hãy xin lỗi.", "죄송합니다.", ["미안해요", "정말 죄송합니다"], None, None),
 ("cp4_name_lan", "l", "information_prompt", "Hãy nói tên của bạn.", "저는 란이에요.", ["제 이름은 란이에요"], [("Tên", "Lan")], None),
 ("cp4_vietnamese", "l", "situation_prompt", "Có người hỏi quốc tịch của bạn. Hãy trả lời rằng bạn là người Việt.", "베트남 사람이에요.", ["베트남에서 왔어요"], None, None),
 ("cp4_job", "l", "information_prompt", "Hãy nói bạn làm nghề gì.", "저는 근로자예요.", [], [("Công việc", "người lao động")], None),
 ("cp4_price_tea", "m", "information_prompt", "Một vị khách hỏi giá chai trà. Hãy trả lời.", "천오백 원이에요.", ["차는 천오백 원이에요"], [("Giá", "1.500 won")], None),
 ("cp4_time_ten", "m", "information_prompt", "Có người hỏi giờ. Hãy trả lời.", "열 시예요.", ["지금 열 시예요"], [("Giờ", "10 giờ")], None),
 ("cp4_day_friday", "m", "information_prompt", "Hãy nói hôm nay là thứ mấy.", "오늘은 금요일이에요.", ["금요일이에요"], [("Hôm nay", "thứ Sáu")], None),
 ("cp4_tickets_three", "m", "information_prompt", "Ở ga, bạn mua vé. Hãy nói bạn muốn ba vé.", "표 세 장 주세요.", ["세 장 주세요", "표 세 장이요"], [("Số vé", "3")], None),
 ("cp4_desc_dog", "n", "picture_prompt", "Nhìn hình: con chó to. " + SAY, "개가 커요.", ["큰 개예요", "커요"], None, "🐕"),
 ("cp4_desc_room", "n", "picture_prompt", "Nhìn hình: căn phòng nhỏ. " + SAY, "방이 작아요.", ["작은 방이에요", "작아요"], None, "🛏️"),
 ("cp4_desc_bike", "n", "picture_prompt", "Nhìn hình: chiếc xe đạp rẻ. " + SAY, "자전거가 싸요.", ["싼 자전거예요", "싸요"], None, "🚲"),
 ("cp4_desc_bag", "n", "picture_prompt", "Nhìn hình: cái túi đắt tiền. " + SAY, "가방이 비싸요.", ["비싼 가방이에요", "비싸요"], None, "👜"),
 ("cp4_congrats", "k", "situation_prompt", "Hôm nay là sinh nhật của một đồng nghiệp. Hãy chúc mừng.", "생일 축하합니다.", ["축하합니다"], None, "🎉"),
 ("cp4_work_store", "l", "information_prompt", "Hãy nói bạn làm việc ở đâu.", "편의점에서 일해요.", ["저는 편의점에서 일해요"], [("Nơi làm việc", "cửa hàng tiện lợi")], None),
 ("a1cap_time_nine", "m", "information_prompt", "Có người hỏi giờ. Hãy trả lời.", "아홉 시예요.", ["지금 아홉 시예요"], [("Giờ", "9 giờ")], None),
 ("a1cap_price_coffee", "m", "information_prompt", "Một vị khách hỏi giá cà phê. Hãy trả lời.", "이천 원이에요.", ["커피는 이천 원이에요"], [("Giá", "2.000 won")], None),
 ("a1cap_day_sunday", "m", "information_prompt", "Hãy nói hôm nay là thứ mấy.", "오늘은 일요일이에요.", ["일요일이에요"], [("Hôm nay", "Chủ nhật")], None),
 ("a1cap_birthday", "m", "information_prompt", "Hãy nói sinh nhật của bạn.", "제 생일은 구월 이십일이에요.", ["구월 이십일이에요", "생일은 구월 이십일이에요"], [("Sinh nhật", "ngày 20 tháng 9")], None),
 ("pl_hello", "k", "situation_prompt", "Buổi trưa, bạn gặp một người quen trên phố. Hãy chào.", "안녕하세요.", [], None, None),
 ("pl_name_minh", "l", "information_prompt", "Hãy nói tên của bạn.", "저는 민이에요.", ["제 이름은 민이에요"], [("Tên", "Minh")], None),
 ("pl_age", "l", "information_prompt", "Hãy nói tuổi của bạn.", "서른 살이에요.", ["저는 서른 살이에요"], [("Tuổi", "30")], None),
 ("pl_big_car", "n", "picture_prompt", "Nhìn hình: chiếc ô tô to. " + SAY, "자동차가 커요.", ["큰 자동차예요", "커요"], None, "🚙"),
]


def prompt(instr, facts, emoji):
    p = {"instruction": {"vi": instr}}
    if facts:
        p["cueFacts"] = [{"label": {"vi": a}, "value": b} for a, b in facts]
    if emoji:
        p["cueEmoji"] = emoji
    return p


def accepted(instr, target, more):
    """The target without its final mark, the hand-listed answers and their fair renderings (no digits)."""
    out = []
    for v in [target] + list(more):
        for x in [v] + fair(instr or "", v, INDEX):
            x = re.sub(r"[.?!]+$", "", x.strip())
            if re.search(r"\d", x) or _bare(x) in {_bare(y) for y in out}:
                continue
            out.append(x)
    return out


def item(sid, u, elic, instr, target, more, facts, emoji, reserved, model):
    rep = elic == "repetition"
    check(sid, target)
    check_vi(sid, instr or REP)
    for a, b in facts or []:
        check_vi(sid, a)
        check_vi(sid, b)
    variants = accepted(instr, target, more)
    for v in variants:
        check(sid, v)
    lex = refs(target)
    evidence = [] if rep else [i for i in content_refs(target) if i in lex]
    return {"id": sid, "taskFamily": FAM[u], "elicitationType": elic, "prompt": prompt(instr or REP, facts, emoji), "target": target,
            "acceptedVariants": variants, "objectiveRefs": [OBJ[u]], "lexemeRefs": lex, "evidenceLexemeRefs": evidence,
            "assistancePolicy": {"allowContextualBias": rep, "revealTargetAfterAttempts": None if rep or reserved else 2}, "scoredEligibility": not rep,
            "modelAudioRef": model, "recognitionLocale": "ko-KR", "allowedAttempts": 2, "reserved": reserved, "sourceRef": "original-project"}


items, clips = [], []
for u, rows in TEACHING.items():
    for i, (slug, elic, instr, target, more, facts, emoji) in enumerate(rows):
        cid = f"ko.clip.u{u}_model_{slug}"
        items.append(item(f"ko.speak.{u}_{slug}", u, elic, instr, target, more, facts, emoji, False, cid))
        clips.append(clip(cid, "word_phrase", [("B" if i % 3 == 2 else "A", target)], [OBJ[u]]))
for slug, u, elic, instr, target, more, facts, emoji in RESERVED:
    items.append(item(f"ko.speak.{slug}", u, elic, instr, target, more, facts, emoji, True, None))

write_jsonl(f"{DRAFTS}/speech/OUTPUT.jsonl", items)
write_jsonl(f"{DRAFTS}/listening/OUTPUT.jsonl", clips, "a")
report()
print(len(items), "items", sum(i["reserved"] for i in items), "reserved", len(clips), "clips", dict(Counter(i["taskFamily"] for i in items)))

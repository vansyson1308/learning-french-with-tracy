"""ko-vi interaction (P4e session 4), after ja-scenarios-s6.py: 8 teaching scenarios (units s-v: the convenience store,
the restaurant, the way, the subway, the pharmacy, the doctor, phoning the team leader, the bank) and 10 reserved ones
(checkpoint 6, capstone), with their partner clips. Writes content/ko/_drafts/scenarios/OUTPUT.jsonl, appends the clips
to listening/OUTPUT.jsonl, then checks that every id of ko_lesson_refs.py exists and is not reserved, and that every
teaching speech item, writing task and scenario has a lesson.

Partner lines are 해요체 (합쇼체 in set phrases and a company's phone greeting), word-checked like every displayed
Korean string, and read by the device voice (no asset; with no ko-KR voice the text stays and the install hint shows).
The learner's accepted answers are grading strings in 해요체, widened by the fair renderings (ko_text.variants) and kept
to Hangul (the grader spells digits). A required concept is matched as a run of tokens, and the build-time ko tokenizer
cuts at spaces: a concept lists the spaced words that carry it (역이, 역은 …), never a bare stem.
usage: python -I ko-scenarios-s6.py <repo root>
"""
import os, re, sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ko_lesson_refs import REFS  # noqa: E402
from ko_layers import DRAFTS, INDEX, check, check_vi, clip, read_jsonl, report, write_jsonl  # noqa: E402
from ko_text import _bare, variants as fair  # noqa: E402

CONV, PRAC = "ko.obj.interaction.everyday_conversation", "ko.obj.interaction.practical_needs"
THANKS = ["감사합니다", "고맙습니다", "고마워요", "네, 감사합니다"]
THANK_CONCEPT = [["감사합니다", "고맙습니다", "고마워요"]]
AGAIN = "죄송합니다. 다시 말해 주세요."
# id, family, objective, title, goal, steps [(partner, rephrase, learner prompt, intent, variants, concepts)], end, miss
TEACHING = [
 ("store_bag", "transaction", PRAC, "Ở cửa hàng tiện lợi", "Nói bạn cần một cái túi, rồi nói bạn trả bằng thẻ.",
  [("어서 오세요. 봉투 필요하세요?", "봉투 드릴까요?", "Hãy nói bạn cần một cái túi.", "need_bag", ["네, 하나 주세요", "네, 주세요", "네, 봉투 하나 주세요", "봉투 주세요", "네, 필요해요"], [["네", "주세요", "필요해요"]]),
   ("모두 칠천 원이에요.", "칠천 원이에요.", "Hãy nói bạn trả bằng thẻ.", "card", ["카드로 할게요", "카드로 계산할게요", "카드로 계산해요", "카드요"], [["카드로", "카드요"]])],
  "네, 감사합니다. 안녕히 가세요.", AGAIN),
 ("restaurant_order", "transaction", PRAC, "Gọi món ở quán ăn", "Nói bạn đi hai người, rồi gọi hai bát cơm trộn.",
  [("어서 오세요. 몇 분이세요?", "몇 명이에요?", "Hãy nói bạn đi hai người.", "two_people", ["두 명이에요", "두 명이요", "두 명"], [["두"]]),
   ("이쪽으로 앉으세요. 뭐 드릴까요?", "뭐 먹을 거예요?", "Hãy gọi hai bát cơm trộn.", "order", ["비빔밥 두 개 주세요", "비빔밥 두 그릇 주세요", "비빔밥 둘 주세요", "비빔밥 두 개요", "비빔밥 주세요"], [["비빔밥"]])],
  "네, 비빔밥 두 개요. 잠깐만요.", AGAIN),
 ("ask_station", "information_exchange", PRAC, "Hỏi đường đến ga", "Hỏi một người lạ ga ở đâu, rồi cảm ơn.",
  [("네, 무슨 일이세요?", "네, 말씀하세요.", "Hãy hỏi ga ở đâu.", "ask_way", ["역이 어디예요", "실례합니다. 역이 어디예요", "역이 어디에 있어요", "저기요, 역이 어디예요"], [["역이", "역은"], ["어디예요", "어디에", "어디"]]),
   ("똑바로 가서 오른쪽으로 가세요.", "오른쪽이에요.", "Hãy cảm ơn.", "thank", THANKS, THANK_CONCEPT)],
  "네, 안녕히 가세요.", "죄송합니다. 잘 모르겠어요."),
 ("subway_transfer", "information_exchange", PRAC, "Đổi tàu điện ngầm", "Hỏi nhân viên nhà ga đi Toà thị chính thế nào, rồi nhắc lại tuyến tàu.",
  [("네, 말씀하세요.", "무슨 일이세요?", "Hãy hỏi đi đến Toà thị chính thế nào.", "ask_route", ["시청에 어떻게 가요", "시청은 어떻게 가요", "시청에 가고 싶어요", "시청에 어떻게 가야 해요"], [["시청에", "시청은"]]),
   ("다음 역에서 2호선으로 갈아타세요.", "2호선이에요.", "Hãy nhắc lại tuyến tàu để chắc chắn.", "repeat", ["이호선이요", "이호선이에요", "이호선으로 갈아타요"], [["이호선이요", "이호선이에요", "이호선으로"]])],
  "네, 맞아요.", "다시 말해 주세요."),
 ("pharmacy", "transaction", PRAC, "Ở nhà thuốc", "Nói bạn bị cảm và cần thuốc, rồi hỏi một ngày uống mấy lần.",
  [("어서 오세요. 어디가 아프세요?", "뭐 필요하세요?", "Hãy nói bạn bị cảm và cần thuốc.", "cold", ["감기에 걸렸어요. 약 주세요", "감기에 걸렸어요", "감기에 걸렸어요. 약 있어요"], [["감기에"]]),
   ("이 약을 드세요.", "이 약이에요.", "Hãy hỏi một ngày uống mấy lần.", "how_often", ["하루에 몇 번 먹어요", "몇 번 먹어요", "하루에 몇 번 드세요", "몇 번 드세요"], [["몇"]])],
  "하루에 세 번, 밥을 먹고 드세요.", "다시 말해 주세요."),
 ("clinic_doctor", "information_exchange", PRAC, "Đi khám bệnh", "Nói với bác sĩ bạn đau đầu và bị ho, từ hôm qua.",
  [("어디가 아프세요?", "어디가 안 좋아요?", "Hãy nói bạn đau đầu và bị ho.", "symptom", ["머리가 아프고 기침을 해요", "머리가 아파요. 기침도 해요", "머리가 아파요", "기침을 해요", "머리가 아프고 기침이 나요"],
    [["머리가", "머리도", "기침을", "기침이", "기침도"]]),
   ("언제부터 아팠어요?", "어제부터예요? 오늘부터예요?", "Hãy nói từ hôm qua.", "since", ["어제부터요", "어제부터 아팠어요", "어제부터예요"], [["어제부터요", "어제부터", "어제부터예요"]])],
  "이 약을 하루에 세 번 드세요.", "간호사에게 말하세요."),
 ("call_sick", "information_exchange", CONV, "Gọi điện xin nghỉ ốm", "Gọi cho tổ trưởng: nói bạn là Nam, bạn bị ốm và hôm nay xin nghỉ.",
  [("여보세요?", "네, 여보세요.", "Hãy chào và nói bạn là Nam.", "give_name", ["반장님, 안녕하세요. 남이에요", "남이에요", "여보세요, 남이에요", "안녕하세요. 저는 남이에요", "남입니다"], [["남이에요", "남입니다"]]),
   ("남 씨, 무슨 일이에요?", "왜요?", "Hãy nói bạn bị ốm và hôm nay xin nghỉ.", "sick", ["몸이 아파요. 오늘 쉬고 싶어요", "아파요. 오늘 쉬어도 돼요", "오늘 못 가요", "감기에 걸렸어요. 오늘 쉬고 싶어요", "몸이 아파서 오늘 못 가요"],
    [["아파요", "아파서", "감기에", "쉬고", "쉬어도", "못"]])],
  "네, 쉬세요. 내일 봐요.", "네, 다시 전화하세요."),
 ("bank_account", "transaction", PRAC, "Ở ngân hàng", "Nói bạn muốn mở tài khoản, rồi đưa thẻ đăng ký người nước ngoài.",
  [("어서 오세요. 어떻게 오셨어요?", "무슨 일이세요?", "Hãy nói bạn muốn mở tài khoản.", "open_account", ["통장을 만들고 싶어요", "계좌를 만들고 싶어요", "통장 만들고 싶어요", "계좌 만들고 싶어요"], [["통장을", "통장", "계좌를", "계좌"]]),
   ("신분증 있으세요?", "외국인 등록증 있으세요?", "Hãy đưa thẻ đăng ký người nước ngoài và nói một câu lịch sự.", "hand_over", ["네, 여기 있어요", "여기 있어요", "네, 있어요", "외국인 등록증 여기 있어요"], [["있어요"]])],
  "감사합니다. 여기에 이름을 쓰세요.", AGAIN),
]
RESERVED = [
 ("cp6_new_colleague", "conversation", CONV, "Đồng nghiệp mới", "Làm quen với một đồng nghiệp ở nhà máy.",
  [("안녕하세요. 저는 민수예요. 새로 왔어요?", "오늘 처음 왔어요?", "Hãy nói đúng vậy, rồi nói tên bạn: Hoa.", "give_name", ["네, 호아예요", "네, 저는 호아예요", "호아예요", "네, 처음이에요. 호아예요"], [["호아예요", "호아입니다"]]),
   ("호아 씨는 어느 나라 사람이에요?", "고향이 어디예요?", "Hãy nói bạn đến từ Việt Nam.", "give_origin", ["베트남 사람이에요", "베트남에서 왔어요", "베트남이에요"], [["베트남", "베트남에서", "베트남이에요"]])],
  "만나서 반갑습니다.", "네, 또 봐요."),
 ("cp6_interview", "information_exchange", CONV, "Phỏng vấn xin việc", "Trả lời hai câu hỏi trong buổi phỏng vấn.",
  [("안녕하세요. 이름이 뭐예요?", "이름을 말해 주세요.", "Hãy chào và nói tên bạn: Nam.", "give_name", ["안녕하세요. 남입니다", "남이에요", "저는 남입니다", "안녕하세요. 저는 남이에요"], [["남이에요", "남입니다"]]),
   ("한국어를 할 수 있어요?", "한국어 해요?", "Hãy nói bạn nói được một chút.", "little", ["조금 해요", "네, 조금 할 수 있어요", "조금 할 수 있어요", "조금요"], [["조금", "조금요"]])],
  "알겠습니다. 다음 주에 전화할게요.", "감사합니다."),
 ("cp6_store_pay", "transaction", PRAC, "Trả tiền ở cửa hàng tiện lợi", "Hỏi trả bằng thẻ được không, rồi nói bạn cần hoá đơn.",
  [("모두 팔천이백 원이에요.", "팔천이백 원이에요.", "Hãy hỏi trả bằng thẻ được không.", "card", ["카드로 계산해도 돼요", "카드 돼요", "카드로 해도 돼요", "카드로 할게요"], [["카드로", "카드"]]),
   ("네, 돼요. 영수증 드릴까요?", "영수증 필요하세요?", "Hãy nói bạn cần hoá đơn.", "receipt", ["네, 주세요", "네", "네, 영수증 주세요", "네, 필요해요"], [["네"]])],
  "감사합니다. 안녕히 가세요.", AGAIN),
 ("cp6_way_bank", "information_exchange", PRAC, "Tìm ngân hàng", "Hỏi một người lạ ngân hàng ở đâu, rồi cảm ơn.",
  [("네, 무슨 일이세요?", "네, 말씀하세요.", "Hãy hỏi ngân hàng ở đâu.", "ask_way", ["은행이 어디예요", "실례합니다. 은행이 어디예요", "은행이 어디에 있어요"], [["은행이", "은행은"], ["어디예요", "어디에", "어디"]]),
   ("은행은 역 앞에 있어요. 가까워요.", "역 앞이에요.", "Hãy cảm ơn.", "thank", THANKS, THANK_CONCEPT)],
  "네, 안녕히 가세요.", "죄송합니다. 잘 모르겠어요."),
 ("cp6_clinic_cough", "information_exchange", PRAC, "Ở phòng khám", "Nói với y tá bạn bị ho, và họng bạn không đau.",
  [("어디가 아프세요?", "어디가 안 좋아요?", "Hãy nói bạn bị ho.", "symptom", ["기침을 해요", "기침이 나요", "기침이 많이 나요"], [["기침을", "기침이"]]),
   ("목도 아파요?", "목은요?", "Hãy nói họng bạn không đau.", "no_pain", ["아니요, 안 아파요", "안 아파요", "아니요, 괜찮아요", "목은 안 아파요"], [["안", "괜찮아요"]])],
  "물을 많이 마시고 쉬세요.", "네, 잠깐만요."),
 ("cp6_call_office", "information_exchange", CONV, "Gọi điện đến công ty", "Xin nói chuyện với anh Min-su; anh ấy không có ở đó, nên bạn sẽ gọi lại.",
  [("여보세요? 안산 공장입니다.", "공장입니다.", "Hãy xin nói chuyện với anh Min-su.", "ask_person", ["민수 씨 있어요", "민수 씨 계세요", "민수 씨 좀 바꿔 주세요"], [["민수"]]),
   ("죄송합니다. 민수 씨는 지금 없어요. 나중에 다시 전화해 주세요.", "지금 없어요.", "Hãy đồng ý gọi lại sau.", "agree", ["네, 다시 전화할게요", "알겠습니다", "네, 나중에 전화할게요", "알겠습니다. 다시 전화할게요"], [["전화할게요", "알겠습니다", "네"]])],
  "감사합니다. 안녕히 계세요.", "네, 안녕히 계세요."),
 ("a1cap_first_day", "conversation", CONV, "Ngày đầu ở nhà máy", "Trả lời một đồng nghiệp trong ngày đầu đi làm.",
  [("안녕하세요. 오늘 처음 왔어요?", "새로 왔어요?", "Hãy trả lời là đúng.", "confirm", ["네, 처음 왔어요", "네", "네, 오늘 처음이에요", "네, 맞아요"], [["네"]]),
   ("안전모 있어요?", "안전모요.", "Hãy nói bạn không có.", "no_helmet", ["아니요, 없어요", "없어요", "죄송합니다. 없어요", "아니요"], [["없어요", "아니요"]])],
  "그러면 이 안전모를 쓰세요.", "반장님에게 말하세요."),
 ("a1cap_neighbor", "conversation", CONV, "Làm quen với hàng xóm", "Trả lời một người hàng xóm mới: tên và nơi làm việc của bạn.",
  [("안녕하세요. 옆 방 사람이에요?", "옆에 살아요?", "Hãy trả lời là đúng, rồi nói tên bạn: Mai.", "give_name", ["네, 마이예요", "네, 저는 마이예요", "마이예요"], [["마이예요", "마이입니다"]]),
   ("마이 씨는 무슨 일을 해요?", "어디에서 일해요?", "Hãy nói bạn làm việc ở nhà máy.", "give_work", ["공장에서 일해요", "공장이에요", "저는 공장에서 일해요"], [["공장에서", "공장이에요"]])],
  "반가워요. 자주 봐요.", "네, 안녕히 계세요."),
 ("a1cap_friend_plan", "conversation", CONV, "Hẹn một người bạn", "Nhận lời hẹn vào Chủ nhật, rồi nói giờ gặp.",
  [("일요일에 시간 있어요?", "일요일에 바빠요?", "Hãy nói bạn rảnh.", "accept", ["네, 있어요", "네, 시간 있어요", "시간 있어요", "네, 괜찮아요"], [["있어요", "괜찮아요"]]),
   ("몇 시에 만날까요?", "몇 시가 좋아요?", "Hãy nói gặp lúc 3 giờ.", "time", ["세 시에 만나요", "세 시 어때요", "세 시요", "세 시가 좋아요"], [["세"]])],
  "좋아요. 일요일 세 시에 만나요.", "네, 또 전화해요."),
 ("a1cap_lunch", "conversation", CONV, "Ăn trưa với đồng nghiệp", "Nhận lời ăn trưa với một đồng nghiệp, rồi nói bạn muốn ăn gì.",
  [("열두 시예요. 같이 점심 먹을까요?", "같이 먹어요?", "Hãy nhận lời.", "accept", ["네, 좋아요", "좋아요", "네, 같이 먹어요", "네, 먹어요"], [["좋아요", "먹어요", "네"]]),
   ("뭐 먹고 싶어요?", "뭐 먹을 거예요?", "Hãy nói bạn muốn ăn mì gói.", "food", ["라면 먹고 싶어요", "라면이 좋아요", "라면요", "라면 먹어요"], [["라면", "라면이", "라면요"]])],
  "좋아요. 같이 가요.", "네, 내일 같이 먹어요."),
]

scen, clips = [], []


def add_clip(cid, text, obj, speaker):
    clips.append(clip(cid, "message", [(speaker, text)], [obj]))


def heard(prompt, variants):
    out = []
    for v in variants:
        for x in [v] + fair(prompt, v, INDEX):
            x = re.sub(r"[.?!]+$", "", x.strip())
            if re.search(r"\d", x) or _bare(x) in {_bare(y) for y in out}:
                continue
            check(prompt, x)
            out.append(x)
    return out


for rows, reserved in ((TEACHING, False), (RESERVED, True)):
    for n, (sid, fam, obj, title, goal, steps, end, miss) in enumerate(rows):
        base = f"ko.clip.ix_{sid}"
        # Partner voices alternate (A / B: one device voice, B at a lower pitch).
        speaker = "A" if n % 2 == 0 else "B"
        check_vi(sid, title)
        check_vi(sid, goal)
        nodes = {}
        add_clip(f"{base}_miss", miss, obj, speaker)
        nodes["t_miss"] = {"kind": "terminal", "id": "t_miss", "outcome": "goal_not_met", "text": miss, "clipId": f"{base}_miss"}
        for i, (p, rp, prompt, intent, variants, concepts) in enumerate(steps):
            check_vi(sid, prompt)
            nxt = f"p{i + 1}" if i + 1 < len(steps) else "t_ok"
            add_clip(f"{base}_{i}", p, obj, speaker)
            add_clip(f"{base}_{i}_s", rp, obj, speaker)
            nodes[f"p{i}"] = {"kind": "partner", "id": f"p{i}", "text": p, "clipId": f"{base}_{i}", "rephraseText": rp, "rephraseClipId": f"{base}_{i}_s", "next": f"l{i}"}
            exp = [{"intent": intent, "acceptedVariants": heard(prompt, variants), "requiredConcepts": concepts, "next": nxt}]
            nodes[f"l{i}"] = {"kind": "learner", "id": f"l{i}", "prompt": {"vi": prompt}, "expected": exp, "noMatchNext": f"r{i}", "scored": True}
            nodes[f"r{i}"] = {"kind": "partner", "id": f"r{i}", "text": rp, "clipId": f"{base}_{i}_s", "next": f"l{i}b"}
            nodes[f"l{i}b"] = {"kind": "learner", "id": f"l{i}b", "prompt": {"vi": prompt}, "expected": exp, "noMatchNext": "t_miss", "scored": False}
        add_clip(f"{base}_end", end, obj, speaker)
        nodes["t_ok"] = {"kind": "terminal", "id": "t_ok", "outcome": "goal_met", "text": end, "clipId": f"{base}_end"}
        scen.append({"id": f"ko.scenario.{sid}", "title": {"vi": title}, "goal": {"vi": goal}, "taskFamily": fam, "objectiveRefs": [obj], "startNodeId": "p0",
                     "nodes": nodes, "support": {"allowRepeat": True, "allowRephrase": True}, "reserved": reserved, "sourceRef": "original-project"})

write_jsonl(f"{DRAFTS}/scenarios/OUTPUT.jsonl", scen)
write_jsonl(f"{DRAFTS}/listening/OUTPUT.jsonl", clips, "a")
report()


def ids(step):
    return {r["id"]: r for r in read_jsonl(f"{DRAFTS}/{step}/OUTPUT.jsonl")}


KNOWN = {"clips": ids("listening"), "readings": ids("readings"), "speech": ids("speech"), "writing": ids("writing"), "scenarios": ids("scenarios")}
ASSESS = re.compile(r"\.(cp\d|a1cap|pl)_")
bad = [f"{lesson} {kind} {x}" for lesson, by in REFS.items() for kind, xs in by.items() for x in xs if x not in KNOWN[kind] or KNOWN[kind][x].get("reserved") is True or ASSESS.search(x)]
used = {kind: {x for by in REFS.values() for x in by.get(kind, [])} for kind in KNOWN}
unused = [x for kind in ("speech", "writing", "scenarios") for x, r in KNOWN[kind].items() if not r.get("reserved") and x not in used[kind]]
unused += [x for x in KNOWN["readings"] if not ASSESS.search(x) and x not in used["readings"]]
if bad or unused:
    sys.exit("ko_lesson_refs.py: " + "; ".join(bad + [f"unused {x}" for x in unused]))
print(len(scen), "scenarios", sum(s["reserved"] for s in scen), "reserved", len(clips), "clips", sum(len(s["nodes"]) for s in scen), "nodes", dict(Counter(s["taskFamily"] for s in scen)))

"""ko-vi reception (P4e session 3): readings and listening clips of Section 3 (units f-j), checkpoint 3, the capstone and
placement, original Korean after ja-reception-s3.py. Writes content/ko/_drafts/readings/OUTPUT.jsonl and
listening/OUTPUT.jsonl (ko-speech-s4.py appends the model clips).

No clip has an asset: ko-vi is a device-voice course (pack audio policy device-tts, profile deviceVoiceScoredListening).
A listening item is graded through the installed local ko-KR voice, otherwise shown with the install hint and skipped
(never wrong, no evidence). One voice reads both parts, B at a lower pitch; speakers A / B only alternate.
Texts are 해요체; announcements on trains and buses and the workplace notice in 합쇼체 (ko-plan §5). Every word is a
lexicon word, a form of one or a noun with its particles (ko_layers.check); a line ending without . ? ! is a sign or
a list line (a noun phrase) and is not register-checked. Numbers: native for hours and counted things, Sino-Korean for
money, minutes, dates, floors, bus and exit numbers; prices in digits as on a real receipt.
usage: python -I ko-reception-s3.py <repo root>
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ko_layers import DRAFTS, check, check_vi, clip, refs, report, write_jsonl  # noqa: E402

R_WORDS, R_MSG, R_NOTICE, R_TEXT = "ko.obj.reading.familiar_words", "ko.obj.reading.short_messages", "ko.obj.reading.notices_info", "ko.obj.reading.short_texts"
FW, INFO, ANN, DLG = "ko.obj.listening.familiar_words", "ko.obj.listening.short_info", "ko.obj.listening.announcements", "ko.obj.listening.short_dialogues"
NUM, TIME, WORK, EXIST, RULES = "ko.obj.numbers.two_systems", "ko.obj.vocab.time_calendar", "ko.obj.vocab.work_korea", "ko.obj.existence.itda", "ko.obj.verbs.requests_rules"


def gl(surface, vi):
    return {"surface": surface, "gloss": {"vi": vi}}


def para(blocks):
    return [{"kind": "paragraph", "text": b} for b in blocks]


def lines(pairs):
    return [{"kind": "line", "speaker": s, "text": t} for s, t in pairs]


SENTENCE_END = (".", "?", "!")

# id, kind, title, blocks, objectives, glossary, information units
READINGS = [
 # Unit f: the weather.
 ("uf_forecast", "notice", "이번 주 날씨", para(["월요일은 맑아요.", "화요일에는 비가 와요.", "수요일은 흐려요.", "목요일부터 추워요."]), [R_NOTICE, TIME], [], 4),
 ("uf_seasons", "description", "한국의 날씨", para(["한국에는 봄, 여름, 가을, 겨울이 있어요. 여름은 덥고 비가 많이 와요. 겨울은 아주 추워요. 저는 가을을 제일 좋아해요."]), [R_TEXT], [], 4),
 ("uf_card", "notice", "저는요", para(["이름: 응우옌 남", "나라: 베트남", "직업: 근로자", "전화번호: 010-1234-5678"]), [R_WORDS], [], 4),
 # Unit g: signs, rules and messages at the factory.
 ("ug_signs", "notice", "공장 안", para(["위험", "금연", "출입 금지", "비상구", "소화기"]), [R_NOTICE, WORK], [], 5),
 ("ug_rules", "notice", "공장에서", para(["공장에서는 안전모를 쓰세요.", "장갑을 끼세요.", "기계에 손을 넣지 마세요.", "공장은 금연이에요."]), [R_NOTICE, RULES], [], 4),
 ("ug_shift", "notice", "근무 시간", para(["주간: 오전 여덟 시부터 오후 다섯 시까지", "야간: 오후 여덟 시부터 오전 다섯 시까지", "점심시간: 열두 시부터 한 시까지"]), [R_NOTICE, TIME], [], 3),
 ("ug_msg_leader", "message", "문자", para(["남 씨, 내일은 일곱 시에 출근하세요.", "식당 앞에서 만나요.", "반장님"]), [R_MSG], [], 3),
 ("ug_menu", "notice", "식당 메뉴", para(["김밥 3,000원", "라면 4,000원", "비빔밥 7,000원", "음료수 1,500원"]), [R_NOTICE, NUM], [], 4),
 # Unit h: the station and the bus.
 ("uh_exits", "notice", "출구", para(["1번 출구: 시청", "2번 출구: 병원", "3번 출구: 고용센터"]), [R_NOTICE, NUM], [], 3),
 ("uh_bus", "notice", "10번 버스", para(["10번 버스는 역에서 출발해요.", "버스는 십 분마다 와요.", "밤 열한 시까지 있어요."]), [R_NOTICE, NUM], [], 3),
 # Unit i: the convenience store.
 ("ui_receipt", "notice", "영수증", para(["김밥 1개 3,000원", "생수 1병 1,000원", "모두 4,000원", "카드"]), [R_NOTICE, NUM], [], 4),
 ("ui_store", "dialogue", "편의점에서", lines([("직원", "어서 오세요."), ("흐엉", "이 도시락 얼마예요?"), ("직원", "오천 원이에요. 봉투 필요하세요?"), ("흐엉", "네, 봉투 하나 주세요.")]), [R_MSG, NUM], [], 3),
 ("ui_msg_friend", "message", "문자", para(["란 씨, 지금 편의점에 있어요.", "물하고 과자를 살 거예요.", "뭐 필요해요?"]), [R_MSG], [], 3),
 ("ui_msg_late", "message", "문자", para(["반장님, 죄송합니다.", "버스가 안 와요. 십 분 늦어요.", "흐엉"]), [R_MSG], [], 2),
 # Unit j: the dormitory and life in Korea.
 ("uj_rules", "notice", "기숙사에서", para(["밤 열 시부터 조용히 하세요.", "방에서 요리하면 안 돼요.", "쓰레기는 월요일과 목요일에 버리세요.", "세탁기는 밤 아홉 시까지 쓸 수 있어요."]), [R_NOTICE, RULES], [], 4),
 ("uj_room", "description", "제 방", para(["제 방은 기숙사 삼 층에 있어요. 방은 작지만 깨끗해요. 침대하고 책상이 있어요. 냉장고는 부엌에 있어요."]), [R_TEXT, EXIST], [], 4),
 ("uj_day", "narrative", "남 씨의 하루", para(["남 씨는 안산의 공장에서 일해요. 매일 여섯 시에 일어나요. 일곱 시에 버스를 타요. 일은 여덟 시부터 다섯 시까지예요. 저녁에는 기숙사에서 한국어를 공부해요."]), [R_TEXT], [], 5),
 ("uj_weekend", "narrative", "주말", para(["지난 주말에 흐엉 씨는 친구하고 서울에 갔어요. 시장에서 옷을 샀어요. 그리고 식당에서 불고기를 먹었어요. 정말 재미있었어요."]), [R_TEXT], [], 4),
 ("uj_rent", "notice", "월세", para(["이번 달 월세는 이십만 원이에요.", "이십오일까지 보내 주세요.", "관리비는 삼만 원이에요."]), [R_NOTICE, NUM], [], 3),
 # Checkpoint 3 (never used in lessons).
 ("cp3_msg_lan", "message", "문자", para(["남 씨, 기차가 다섯 시에 도착해요.", "역에 와 주세요. 가방이 두 개 있어요.", "란"]), [R_MSG], [], 3),
 ("cp3_notice_shop", "notice", "가게", para(["매일 오전 열 시부터 밤 열 시까지", "일요일 오전은 쉬어요.", "계산대에서 계산하세요."]), [R_NOTICE, TIME], [], 3),
 ("cp3_notice_staff", "notice", "직원 여러분", para(["오늘 이 층 화장실은 쓸 수 없어요.", "일 층 화장실을 쓰세요.", "사장님"]), [R_MSG, R_NOTICE], [], 2),
 ("cp3_text_friend", "description", "제 친구 투이", para(["투이 씨는 제 친구예요. 스물네 살이에요. 수원의 병원에서 일해요. 역 옆의 아파트에 살아요. 음악을 좋아해요."]), [R_TEXT], [], 5),
 ("cp3_msg_leader", "message", "문자", para(["흐엉 씨, 내일 회의는 오전 열 시예요.", "서류를 가져오세요.", "반장님"]), [R_MSG, TIME], [], 2),
 ("cp3_text_week", "narrative", "민수 씨의 한 주", para(["민수 씨는 월요일부터 금요일까지 일해요. 매일 자전거로 회사에 가요. 토요일에는 마트에서 장을 봐요. 일요일에는 집에서 책을 읽어요."]), [R_TEXT], [gl("장을 봐요", "đi chợ, mua đồ")], 4),
 # Capstone and placement.
 ("a1cap_msg_mother", "message", "문자", para(["흐엉, 엄마는 여섯 시까지 일해. 냉장고에 저녁이 있어."]), [R_MSG], [], 2),
 ("a1cap_invite", "message", "파티", para(["남 씨, 금요일 저녁에 우리 집에서 파티를 해요.", "일곱 시부터예요. 같이 가요?", "지영"]), [R_MSG], [], 3),
 ("pl_notice_shop", "notice", "식당", para(["점심: 열한 시부터 두 시까지", "저녁: 다섯 시부터 아홉 시까지", "월요일은 쉬어요."]), [R_NOTICE], [], 3),
 ("pl_message", "message", "문자", para(["민수 씨, 오늘은 집에 있어요. 저녁에 전화해 주세요. 란"]), [R_MSG], [], 2),
]
# The capstone message from a mother to her daughter is family 반말: read, never produced (ko-plan §5).
PLAIN_READINGS = {"a1cap_msg_mother"}


def reading(r):
    slug, kind, title, blocks, objs, glossary, units = r
    rid = f"ko.read.{slug}"
    check(rid, title, plain=True)
    for b in blocks:
        check(rid, b["text"], plain=slug in PLAIN_READINGS or not b["text"].endswith(SENTENCE_END))
        if "speaker" in b:
            check(rid, b["speaker"], plain=True)
    for g in glossary:
        check_vi(rid, g["gloss"]["vi"])
    text = " ".join(b["text"] for b in blocks)
    return {"id": rid, "kind": kind, "title": title, "blocks": blocks, "objectiveRefs": objs, "lexemeRefs": refs(title + " " + text), "supportGlossary": glossary,
            "sourceRef": "original-project", "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"}}


C = lambda slug, kind, segs, objs, units=1: clip(f"ko.clip.{slug}", kind, segs, objs, units)
A = lambda text: [("A", text)]
B = lambda text: [("B", text)]
CLIPS = []
# Unit f: words and short sentences about the weather, and phrases for when you do not understand.
for slug, seg in [("nalssi", A("날씨")), ("bi", B("비")), ("usan", A("우산")), ("baram", B("바람")), ("bom", A("봄")), ("gyeoul", B("겨울")),
                  ("deowoyo", A("더워요.")), ("chuwoyo", B("추워요.")), ("bi_wayo", A("비가 와요.")), ("malgayo", B("오늘은 맑아요.")),
                  ("usan_isseoyo", A("우산 있어요?")), ("moreugesseoyo", B("모르겠어요.")), ("dasi", A("다시 말해 주세요.")), ("cheoncheonhi", B("천천히 말해 주세요."))]:
    CLIPS.append(C(f"uf_{slug}", "word_phrase", seg, [FW]))
CLIPS += [
 C("uf_rain_tomorrow", "factual", A("내일은 비가 올 거예요."), [INFO, TIME], 2),
 C("uf_cold_wind", "factual", B("오늘은 춥고 바람이 많아요."), [INFO], 2),
]
# Unit g: instructions and facts at the factory.
CLIPS += [
 C("ug_stop", "instruction", A("기계를 멈추세요."), [ANN, FW], 1),
 C("ug_helmet", "instruction", B("안전모를 쓰세요."), [ANN, FW], 1),
 C("ug_gloves", "instruction", A("장갑을 끼고 일하세요."), [ANN, FW], 1),
 C("ug_exit", "factual", B("비상구는 왼쪽에 있어요."), [ANN, INFO], 1),
 C("ug_lunch", "factual", A("점심시간은 열두 시부터예요."), [INFO, NUM], 2),
 C("ug_off", "factual", B("오늘은 다섯 시에 퇴근해요."), [INFO, NUM], 2),
]
# Unit h: announcements on the subway and the bus (합쇼체, as announced).
CLIPS += [
 C("uh_this_station", "announcement", A("이번 역은 시청입니다."), [ANN], 1),
 C("uh_next_station", "announcement", B("다음 역은 안산입니다."), [ANN], 1),
 C("uh_transfer", "announcement", A("2호선으로 갈아타세요."), [ANN, NUM], 2),
 C("uh_exit3", "instruction", B("3번 출구로 나가세요."), [ANN, NUM], 2),
 C("uh_bus_soon", "announcement", A("10번 버스가 곧 도착합니다."), [ANN, NUM], 2),
 C("uh_bus_cityhall", "factual", B("이 버스는 시청에 가요."), [INFO], 1),
 C("uh_next_stop", "announcement", A("다음 정류장은 병원입니다."), [ANN], 1),
 C("uh_ten_minutes", "factual", B("버스는 십 분마다 와요."), [INFO, NUM], 2),
]
# Unit i: short dialogues in the convenience store.
CLIPS += [
 C("ui_bag", "dialogue", [("A", "봉투 필요하세요?"), ("B", "네, 하나 주세요.")], [DLG], 1),
 C("ui_price", "dialogue", [("B", "이거 얼마예요?"), ("A", "삼천 원이에요.")], [DLG, NUM], 2),
 C("ui_card", "dialogue", [("A", "카드로 계산할게요."), ("B", "네, 여기 영수증이요.")], [DLG], 1),
 C("ui_bento", "dialogue", [("B", "도시락 있어요?"), ("A", "아니요, 없어요.")], [DLG, EXIST], 1),
 C("ui_ramen", "dialogue", [("A", "라면 두 개 주세요."), ("B", "모두 이천 원이에요.")], [DLG, NUM], 2),
 C("ui_welcome", "dialogue", [("B", "어서 오세요."), ("A", "안녕하세요. 물 있어요?"), ("B", "네, 저기에 있어요.")], [DLG, EXIST], 2),
]
# Unit j: one sentence from each text, and the rules.
CLIPS += [
 C("uj_nam_ansan", "factual", A("남 씨는 안산에서 일해요."), [INFO], 2),
 C("uj_seoul", "factual", B("흐엉 씨는 주말에 서울에 갔어요."), [INFO, TIME], 3),
 C("uj_third_floor", "factual", A("제 방은 삼 층에 있어요."), [INFO, NUM], 2),
 C("uj_trash", "instruction", B("쓰레기는 월요일에 버리세요."), [ANN, INFO], 2),
 C("uj_quiet", "instruction", A("밤 열 시부터 조용히 하세요."), [ANN, INFO], 2),
]
# Checkpoint 3: 11 listening, 3 dictation. Never used in lessons.
CLIPS += [
 C("cp3_train", "announcement", A("부산에 가는 기차는 여섯 시에 출발합니다."), [ANN, INFO, NUM], 2),
 C("cp3_bus_late", "announcement", B("버스가 십오 분 늦게 도착합니다."), [ANN, INFO], 2),
 C("cp3_mart", "announcement", A("마트는 밤 열 시에 문을 닫습니다."), [ANN, NUM], 2),
 C("cp3_floor", "instruction", B("사무실은 오 층에 있어요. 엘리베이터를 타세요."), [ANN, NUM], 2),
 C("cp3_price", "factual", A("이 티셔츠는 만 오천 원이에요."), [INFO, NUM], 2),
 C("cp3_class", "factual", B("한국어 수업은 저녁 일곱 시부터예요."), [INFO, NUM], 2),
 C("cp3_party", "factual", A("파티는 토요일 저녁이에요."), [INFO, TIME], 2),
 C("cp3_dlg_drink", "dialogue", [("A", "커피 드릴까요? 차 드릴까요?"), ("B", "차 주세요.")], [DLG], 1),
 C("cp3_dlg_live", "dialogue", [("B", "어디에 살아요?"), ("A", "역 옆에 살아요.")], [DLG], 1),
 C("cp3_dlg_movie", "dialogue", [("A", "오늘 저녁에 시간 있어요?"), ("B", "네. 같이 영화 볼까요?")], [DLG], 2),
 C("cp3_dlg_doctor", "dialogue", [("B", "어디가 아프세요?"), ("A", "머리가 아파요.")], [DLG], 1),
 C("cp3_word_bus", "word_phrase", B("버스"), [FW]),
 C("cp3_word_milk", "word_phrase", A("우유"), [FW]),
 C("cp3_meeting", "factual", A("회의는 세 시 반에 시작해요."), [INFO, NUM], 2),
 C("cp3_dict_work", "message", A("매일 공장에서 일해요."), [FW], 1),
 C("cp3_dict_station", "message", B("역은 가까워요."), [FW], 1),
 C("cp3_dict_door", "announcement", A("안전모를 쓰세요."), [ANN], 1),
 # Capstone: 4 listening items across two forms. Placement: 3.
 C("a1cap_bank", "factual", A("은행은 아홉 시에 문을 열어요."), [INFO, NUM], 2),
 C("a1cap_bus", "announcement", B("5번 버스는 병원 앞에 섭니다."), [ANN, INFO, NUM], 2),
 C("a1cap_pharmacy", "factual", A("약국은 우체국 옆에 있어요."), [INFO], 2),
 C("a1cap_bag", "factual", B("이 가방은 이만 오천 원이에요."), [INFO, NUM], 2),
 C("pl_mul", "word_phrase", A("물"), [FW]),
 C("pl_shop", "announcement", B("가게는 여섯 시에 문을 닫습니다."), [ANN, NUM], 2),
 C("pl_pay", "instruction", A("계산대에서 계산하세요."), [ANN], 1),
]

rows = [reading(r) for r in READINGS]
write_jsonl(f"{DRAFTS}/readings/OUTPUT.jsonl", rows)
write_jsonl(f"{DRAFTS}/listening/OUTPUT.jsonl", CLIPS)
report()
print(len(rows), "readings", sum(not r["id"].split(".")[-1].startswith(("cp3", "a1cap", "pl_")) for r in rows), "teaching;", len(CLIPS), "clips")

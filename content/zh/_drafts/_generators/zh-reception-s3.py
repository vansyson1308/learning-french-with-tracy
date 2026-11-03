"""zh-vi reception (P4d session 3): readings and listening clips of Section 3, checkpoint 3, the capstone and placement,
original Chinese after ja-reception-s3.py. Writes content/zh/_drafts/readings/OUTPUT.jsonl and listening/OUTPUT.jsonl
(zh-speech-s4.py and zh-scenarios-s6.py append their clips). The ingest takes the voice cast from
content/audio/voice-casts.json (zh: pending its canary, so the cast is still "unselected"; A is meant to be the female
voice, B the male one, and a clip whose speaker states a gender sits on the matching voice). Exam-track texts belong to
the exam step (session 5).

Pinyin comes from the lexicon at run time, so the text holds no readings: every hanzi lies inside a lexicon surface
(zh_layers.check, the longest-match cut of annotateText), homographs only in their stored reading, 中 and 地 only in
compounds. Signs and notices of the factory, the warehouse and the dormitory use the work words of the lexicon (安全出口,
紧急出口, 禁止吸烟, 禁止进入, 小心, 注意安全, 灭火器, 打卡; 紧急, 员工, 进入 are lexemes since this session, core-a2.txt).
Numbers are hanzi in running text and digits only in a phone number or a time table, never in a clip a dictation uses.
Names: 阮海 (Nguyễn Hải), 阮南 (Nguyễn Nam), 阮花 (Nguyễn Hoa), 阮红 (Nguyễn Hồng), 小王, 小李, 王经理, 李组长 — characters
the lexicon reads. Simplified characters only (traditional, for Taiwan signs, is recognition-only and later).
usage: python -I zh-reception-s3.py <repo root>
"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zh_layers import DRAFTS, check, check_vi, clip, refs, report, write_jsonl  # noqa: E402

R_WORDS, R_MSG, R_NOTICE, R_TEXT = "zh.obj.reading.familiar_words", "zh.obj.reading.short_messages", "zh.obj.reading.notices_info", "zh.obj.reading.short_texts"
FW, INFO, ANN, DLG = "zh.obj.listening.familiar_words", "zh.obj.listening.short_info", "zh.obj.listening.announcements", "zh.obj.listening.short_dialogues"
NUM, TIME, WORK, EXIST = "zh.obj.numbers.measure_words", "zh.obj.vocab.time_calendar", "zh.obj.vocab.work_china", "zh.obj.existence.you_zai"


def gl(surface, vi):
    return {"surface": surface, "gloss": {"vi": vi}}


def para(blocks):
    return [{"kind": "paragraph", "text": b} for b in blocks]


def lines(pairs):
    return [{"kind": "line", "speaker": s, "text": t} for s, t in pairs]


# id, kind, title, blocks, objectives, glossary, information units
READINGS = [
 # Unit f: words a learner can already read.
 ("uf_weather", "notice", "这个星期的天气", para(["星期一：晴，二十五度", "星期二：阴，二十二度", "星期三：下雨，十八度", "星期四：下雨，有风", "星期五：晴，很热"]), [R_WORDS, TIME], [], 5),
 ("uf_card", "notice", "我的名字", para(["姓名：阮海", "国家：越南", "工作：工人", "电话：138-1234-5678", "地址：工厂宿舍三号楼"]), [R_WORDS], [], 5),
 # Unit g: signs, rules and messages at the factory and the warehouse.
 ("ug_signs", "notice", "工厂里", para(["安全出口", "入口", "出口", "紧急出口", "危险", "小心机器", "禁止吸烟", "禁止进入", "注意安全", "灭火器"]), [R_NOTICE, WORK], [], 6),
 ("ug_rules", "notice", "车间安全", para(["进入车间要戴安全帽。", "工作的时候请穿工作服，戴手套。", "机器有问题，请马上停机器，告诉组长。", "车间里禁止吸烟。", "灭火器在门口旁边。"]), [R_NOTICE, WORK], [], 5),
 ("ug_msg_leader", "message", "组长的短信", para(["大家好！", "明天早上七点上班，七点半开会。请别迟到。", "李组长"]), [R_MSG, TIME], [], 3),
 ("ug_shift", "notice", "早班和夜班", para(["早班：早上七点到下午三点", "夜班：晚上十一点到早上七点", "上班以前和下班以前请打卡。"]), [R_NOTICE, TIME], [], 3),
 ("ug_warehouse", "notice", "仓库", para(["重的箱子请两个人一起搬。", "箱子不要放在门口。", "货到了，先检查，然后放好。", "仓库里很危险，请小心。"]), [R_NOTICE, WORK], [], 4),
 # Unit h: the station, the subway and the airport.
 ("uh_timetable", "notice", "火车时间", para(["去北京：上午九点", "去上海：上午十点半", "去广州：下午两点", "请在二号门上车。"]), [R_NOTICE, TIME], [], 4),
 ("uh_subway", "notice", "地铁", para(["下一站：火车站", "请先下车，后上车。", "车上禁止吸烟。", "请注意安全。"]), [R_NOTICE], [], 3),
 ("uh_airport", "notice", "机票", para(["从：河内", "到：北京", "日期：五月一号", "时间：上午八点", "请带好护照和签证。"]), [R_NOTICE, TIME], [], 5),
 # Unit i: the shop.
 ("ui_dialogue", "dialogue", "买水果", lines([("老板", "你好！你要什么？"), ("阮花", "我要两斤苹果。多少钱？"), ("老板", "一共十块。"), ("阮花", "可以扫码吗？"), ("老板", "可以，你扫我吧。")]), [DLG, R_MSG, NUM], [], 3),
 ("ui_prices", "notice", "今天的水果", para(["苹果：五块一斤", "水：两块一瓶", "牛奶：八块一瓶", "面包：六块一个"]), [R_NOTICE, NUM], [], 4),
 ("ui_hours", "notice", "超市", para(["每天早上八点开门，晚上十点关门。", "星期天也开门。", "可以扫码，也可以用银行卡。"]), [R_NOTICE, TIME], [], 3),
 # Unit j: little texts about life in the dormitory and at work.
 ("uj_hai_day", "narrative", "阮海的一天", para(["阮海在一家中国工厂工作。他每天早上六点起床，七点上班。中午他在食堂吃饭，下午五点下班。晚上他在宿舍休息，给妈妈打电话。"]), [R_TEXT], [], 5),
 ("uj_dorm", "notice", "宿舍", para(["晚上十一点以后请安静。", "宿舍里禁止吸烟。", "洗衣机在一楼。", "出门的时候请关灯。"]), [R_NOTICE, R_TEXT], [], 4),
 ("uj_family", "description", "阮花的家", para(["阮花家有四口人：爸爸、妈妈、哥哥和她。爸爸是司机，妈妈是医生。哥哥在河内工作，阮花在上海的一家公司工作。"]), [R_TEXT, R_WORDS], [], 5),
 ("uj_workday", "narrative", "忙的一天", para(["今天很忙。早上我们检查了五十个箱子，然后把货送到仓库。中午我很饿，在食堂吃了一碗面条。下午我们加班到七点。"]), [R_TEXT], [], 4),
 ("uj_canteen", "notice", "员工食堂", para(["午饭：十一点半到一点", "晚饭：五点半到七点", "米饭：两块一碗", "面条：八块一碗"]), [R_NOTICE, NUM], [], 4),
 ("uj_colleague", "description", "我的同事小王", para(["小王是我的同事。他是中国人，今年二十八岁。他很热情，常常帮我学汉语。他喜欢唱歌，也喜欢打球。"]), [R_TEXT], [], 5),
 ("uj_msg_wang", "message", "小王的短信", para(["阮海，你好！", "星期六我们一起去公园吧？上午十点在宿舍门口见。", "小王"]), [R_MSG, TIME], [], 3),
 # Checkpoint 3 (never used in lessons).
 ("cp3_msg_hua", "message", "短信", para(["阮南，你好！", "我的火车下午五点到上海。你来火车站接我，好吗？", "阮花"]), [R_MSG], [], 3),
 ("cp3_notice_shop", "notice", "商店", para(["每天上午九点到晚上九点", "星期一不开门。", "请在门口排队。"]), [R_NOTICE, TIME], [], 3),
 ("cp3_notice_meeting", "notice", "通知", para(["明天下午两点开会，请大家别迟到。", "开会的地方：二楼办公室", "王经理"]), [R_MSG, R_NOTICE], [], 3),
 ("cp3_text_hong", "description", "我的朋友", para(["阮红是我的朋友。她今年二十四岁，在北京的一家医院工作。她住在医院旁边。她喜欢音乐。"]), [R_TEXT], [], 5),
 ("cp3_text_week", "narrative", "小李的一个星期", para(["小李星期一到星期五上班。他每天坐地铁去公司。星期六他去超市买东西。星期天他在家看书。"]), [R_TEXT], [], 4),
 # Capstone and placement.
 ("a1cap_msg_mother", "message", "妈妈的短信", para(["小花：", "妈妈今天晚上加班。饭在桌子上。吃了饭请洗碗。", "妈妈"]), [R_MSG], [], 3),
 ("a1cap_invite", "message", "生日", para(["阮海：", "星期五是我的生日。晚上七点我们在饭馆吃饭，你来吗？", "小王"]), [R_MSG], [], 3),
 ("pl_notice_restaurant", "notice", "饭馆", para(["中午：十一点到两点", "晚上：五点到九点", "星期一休息。"]), [R_NOTICE], [], 3),
 ("pl_message", "message", "短信", para(["小王，我今天在家。晚上给我打电话吧。阮南"]), [R_MSG], [], 2),
]


def reading(r):
    slug, kind, title, blocks, objs, glossary, units = r
    rid = f"zh.read.{slug}"
    check(rid, title)
    for b in blocks:
        check(rid, b["text"])
        if "speaker" in b:
            check(rid, b["speaker"])
    for g in glossary:
        check_vi(rid, g["gloss"]["vi"])
    text = "".join(b["text"] for b in blocks)
    return {"id": rid, "kind": kind, "title": title, "blocks": blocks, "objectiveRefs": objs, "lexemeRefs": refs(title + "。" + text), "supportGlossary": glossary,
            "sourceRef": "original-project", "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"}}


C = lambda slug, kind, segs, objs, units=1: clip(f"zh.clip.{slug}", kind, segs, objs, units)
A = lambda text: [("A", text)]
B = lambda text: [("B", text)]
CLIPS = []
# Unit f: words, phrases, short sentences (weather, seasons, numbers, animals, asking again).
for slug, seg in [("tianqi", A("天气")), ("hen_leng", B("今天很冷。")), ("hen_re", A("今天很热。")),
                  ("xiayu", B("下雨了。")), ("feng", A("风很大。")),
                  ("chuntian", B("春天")), ("siyue", A("四月")), ("zaishuo", B("请再说一遍。")), ("mandian", A("请说慢一点儿。")),
                  ("jiudian", B("九点")), ("shiwu", A("十五块")), ("mao", B("猫")), ("yu", A("鱼")), ("tingbudong", B("我听不懂。"))]:
    CLIPS.append(C(f"uf_{slug}", "word_phrase", seg, [FW]))
# Unit g (lesson 3): instructions in the workshop and the warehouse.
CLIPS += [
 C("ug_anquanmao", "instruction", A("请戴安全帽。"), [ANN, FW, WORK], 1),
 C("ug_tingji", "instruction", B("机器有问题，马上停机器！"), [ANN, WORK], 2),
 C("ug_fang", "instruction", A("请把箱子放在这儿。"), [ANN, WORK], 1),
 C("ug_shoutao", "instruction", B("请戴手套，穿工作服。"), [ANN, WORK], 2),
]
# Unit h: announcements and facts at the station, in the subway and at the airport.
CLIPS += [
 C("uh_beijing", "announcement", A("去北京的火车八点出发。"), [ANN, INFO, TIME], 2),
 C("uh_wanle", "announcement", B("火车晚了二十分钟。"), [ANN, INFO], 2),
 C("uh_menkou", "announcement", A("请在三号门上车。"), [ANN, INFO, NUM], 2),
 C("uh_xiayizhan", "announcement", B("下一站：火车站。"), [ANN], 1),
 C("uh_zhuyi", "announcement", A("请注意安全。"), [ANN], 1),
 C("uh_shangche", "announcement", B("请先下车，后上车。"), [ANN], 1),
 C("uh_plane", "announcement", A("飞机下午三点到。"), [ANN, INFO, TIME], 2),
 C("uh_piao", "factual", B("去上海的票三百块。"), [INFO, NUM], 2),
 C("uh_liangzhang", "factual", A("我要两张去北京的票。"), [INFO, NUM], 2),
 C("uh_zhanzai", "factual", B("地铁站在火车站旁边。"), [INFO], 2),
 C("uh_huzhao", "instruction", A("请拿好护照和机票。"), [ANN, INFO], 2),
 C("uh_wumen", "announcement", B("去北京的飞机在五号门。"), [ANN, INFO, NUM], 2),
 C("uh_yixiaoshi", "announcement", A("飞机晚了一个小时。"), [ANN, INFO], 2),
]
# Unit i: short dialogues at the shop.
CLIPS += [
 C("ui_yao", "dialogue", [("A", "你要什么？"), ("B", "我要两个苹果。")], [DLG, NUM], 1),
 C("ui_yifu", "dialogue", [("B", "你好，我想买一件衣服。"), ("A", "你要什么颜色的？")], [DLG], 1),
 C("ui_yigong", "dialogue", [("A", "一共多少钱？"), ("B", "一共二十八块。")], [DLG, NUM], 1),
 C("ui_jin", "dialogue", [("B", "苹果多少钱一斤？"), ("A", "五块一斤。")], [DLG, NUM], 1),
 C("ui_saoma", "dialogue", [("A", "可以扫码吗？"), ("B", "可以，你扫我吧。")], [DLG], 1),
 C("ui_zhaoqian", "dialogue", [("B", "给你一百块。"), ("A", "找你二十块。")], [DLG, NUM], 2),
 C("ui_gui", "dialogue", [("A", "太贵了，便宜一点儿吧。"), ("B", "好吧，三十块。")], [DLG, NUM], 2),
 C("ui_shi", "dialogue", [("B", "我可以试一下吗？"), ("A", "可以，这边请。")], [DLG], 1),
 C("ui_xiexie", "dialogue", [("A", "谢谢！"), ("B", "不客气，再见！")], [DLG], 1),
]
# Unit j: one sentence from each text.
CLIPS += [
 C("uj_hai_work", "factual", B("阮海在一家中国工厂工作。"), [INFO], 2),
 C("uj_hua_father", "factual", A("阮花的爸爸是司机。"), [INFO], 2),
 C("uj_canteen_open", "factual", A("食堂中午十一点半开门。"), [INFO, TIME], 2),
 C("uj_park", "factual", B("星期六我们一起去公园。"), [INFO, TIME], 2),
 C("uj_anjing", "instruction", A("晚上十一点以后请安静。"), [ANN, INFO], 1),
]
# Checkpoint 3: 11 listening, 3 dictation. Never used in lessons.
CLIPS += [
 C("cp3_train_gz", "announcement", A("去广州的火车六点出发。"), [ANN, INFO, TIME], 2),
 C("cp3_plane", "announcement", B("飞机十二点到。"), [ANN, INFO], 1),
 C("cp3_supermarket", "announcement", A("超市晚上十点关门。"), [ANN, TIME], 2),
 C("cp3_page", "instruction", B("请看课本第十二页。"), [ANN, NUM], 1),
 C("cp3_shirt", "factual", A("这件衣服三百块。"), [INFO, NUM], 2),
 C("cp3_class", "factual", B("汉语课晚上七点开始。"), [INFO, TIME], 2),
 C("cp3_birthday", "factual", A("小王的生日是星期六。"), [INFO, TIME], 2),
 C("cp3_dlg_tea", "dialogue", [("A", "你喝茶还是咖啡？"), ("B", "我喝茶。")], [DLG], 1),
 C("cp3_dlg_live", "dialogue", [("B", "你住在哪儿？"), ("A", "我住在火车站旁边。")], [DLG], 1),
 C("cp3_dlg_movie", "dialogue", [("A", "今天晚上你有时间吗？"), ("B", "有。我们一起去看电影吧。")], [DLG], 2),
 C("cp3_dlg_doctor", "dialogue", [("B", "你哪儿不舒服？"), ("A", "我头疼。")], [DLG], 1),
 C("cp3_dict_work", "message", A("我每天在工厂工作。"), [FW], 1),
 C("cp3_dict_station", "message", B("火车站很近。"), [FW], 1),
 # An announcement dictation: the second task family of spoken reception (claim-gate breadth, as fr, en and ja).
 C("cp3_dict_safety", "announcement", A("请注意安全。"), [ANN], 1),
 # Capstone: 4 listening items across two forms. Placement: 3.
 C("a1cap_bank", "factual", A("银行上午九点开门。"), [INFO, TIME], 2),
 C("a1cap_bus", "announcement", B("去医院请坐五路公交车。"), [ANN, INFO, NUM], 2),
 C("a1cap_pharmacy", "factual", A("药店在银行旁边。"), [INFO], 2),
 C("a1cap_bag", "factual", B("这个包两百块。"), [INFO, NUM], 2),
 C("pl_shui", "word_phrase", A("水"), [FW]),
 C("pl_shop", "announcement", B("商店六点关门。"), [ANN, TIME], 2),
 C("pl_pay", "instruction", A("请在这儿付钱。"), [ANN], 1),
]

rows = [reading(r) for r in READINGS]
write_jsonl(f"{DRAFTS}/readings/OUTPUT.jsonl", rows)
write_jsonl(f"{DRAFTS}/listening/OUTPUT.jsonl", CLIPS)
report()
print(len(rows), "readings", sum(not r["id"].split(".")[-1].startswith(("cp3", "a1cap", "pl_")) for r in rows), "teaching;", len(CLIPS), "clips")

"""zh-vi interaction (P4d session 3), after ja-scenarios-s6.py: 11 teaching scenarios (units s-v) and 10 reserved ones
(checkpoint 6, capstone) around life and work with a Chinese-speaking employer (fruit stall with a QR payment, a
Taiwan-style 便当 shop, the way to the subway, a taxi, clinic reception and the doctor, a bank account, phoning in sick,
the factory safety briefing, warehouse instructions, the first day at a Taiwan factory), with their partner clips.
Writes content/zh/_drafts/scenarios/OUTPUT.jsonl, appends the clips to listening/OUTPUT.jsonl, then checks that every id
of zh_lesson_refs.py exists, is not reserved, and that every teaching reading, speech item, writing task and scenario
has a lesson.

Partner lines are reading-checked like every displayed Chinese string; a team leader or a clerk speaks to the learner as
a new worker or a customer (您 from a clerk, 你 between colleagues), and the learner's prompts ask for 您 and 请 with
bosses. The learner's accepted answers are grading strings, hanzi only, widened by zh_layers.spoken_variants (numbers in
digits and hanzi, 这儿/这里 …). A required concept is matched as a run of the course tokenizer's tokens (the dictionary's
longest match), so a word stored whole is its own token: 我明白了 is one lexeme, so a concept "明白" is listed beside it.
usage: python -I zh-scenarios-s6.py <repo root>
"""
import os, re, sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zh_lesson_refs import REFS  # noqa: E402
from zh_layers import DRAFTS, PROBLEMS, check_vi, clip, read_jsonl, report, spoken_variants, write_jsonl  # noqa: E402

CONV, PRAC = "zh.obj.interaction.everyday_conversation", "zh.obj.interaction.practical_needs"
THANKS = ["谢谢", "谢谢你", "谢谢您", "太谢谢了", "好的，谢谢"]
AGAIN = "不好意思，请再说一遍。"
LATIN = re.compile(r"[A-Za-zÀ-ɏḀ-ỿ]")
# id, family, objective, title, goal, steps [(partner, rephrase, learner prompt, intent, variants, concepts)], end, miss
TEACHING = [
 ("shop_fruit", "transaction", PRAC, "Mua hoa quả", "Mua hai cân táo, rồi hỏi trả bằng mã QR được không.",
  [("你好！你要什么？", "你想买什么？", "Hãy nói bạn muốn hai cân táo.", "buy", ["我要两斤苹果", "两斤苹果", "我想买两斤苹果", "给我两斤苹果", "请给我两斤苹果", "我买两斤苹果"], [["苹果"]]),
   ("两斤十块。", "一共十块钱。", "Hãy hỏi trả bằng mã QR được không.", "qr", ["可以扫码吗", "能扫码吗", "我可以扫码吗", "扫码可以吗", "我扫你可以吗"], [["扫码", "扫"]])],
  "可以，你扫我吧。谢谢！", "不好意思，我不明白。"),
 ("restaurant_order", "transaction", PRAC, "Mua cơm hộp ở quán (kiểu Đài Loan)", "Gọi một hộp cơm và một chai nước, rồi nói bạn ăn ở đây.",
  [("欢迎！您要什么？", "您想吃什么？", "Hãy gọi một hộp cơm và một chai nước.", "order", ["我要一个便当和一瓶水", "一个便当，一瓶水", "请给我一个便当和一瓶水", "给我一个便当和一瓶水", "我要一个便当，一瓶水"], [["便当"], ["水"]]),
   ("在这儿吃还是带走？", "您在这儿吃吗？", "Hãy nói bạn ăn ở đây.", "eat_here", ["在这儿吃", "我在这儿吃", "这儿吃", "在这儿吃吧"], [["这儿", "这里"]])],
  "好的，请坐。", AGAIN),
 ("ask_subway", "information_exchange", PRAC, "Hỏi đường đến ga tàu điện ngầm", "Hỏi một người lạ ga tàu điện ngầm ở đâu, rồi cảm ơn.",
  [("你好，有什么事吗？", "你需要帮忙吗？", "Hãy hỏi ga tàu điện ngầm ở đâu.", "ask_way", ["请问，地铁站在哪儿", "地铁站在哪儿", "请问地铁站怎么走", "地铁站怎么走", "请问，去地铁站怎么走"], [["地铁站", "地铁"]]),
   ("一直往前走，到路口往右边走。", "往前走，然后往右边走。", "Hãy cảm ơn.", "thank", THANKS, [["谢谢"]])],
  "不客气！", "对不起，我也不知道。"),
 ("taxi", "transaction", PRAC, "Đi taxi", "Nói với tài xế bạn đi ga tàu hoả, rồi xin dừng ở đây khi đến nơi.",
  [("您好，去哪儿？", "您要去哪儿？", "Hãy nói bạn đi ga tàu hoả.", "where", ["去火车站", "我去火车站", "火车站", "请去火车站", "我要去火车站"], [["火车站"]]),
   ("到了。在这儿停吗？", "这儿可以吗？", "Hãy nói: vâng, dừng ở đây.", "stop", ["好，在这儿停", "对，在这儿停", "可以", "好的，就在这儿停", "在这儿停吧", "对，就在这儿"], [["这儿", "这里", "可以", "好", "好的"]])],
  "好的，三十块。", "对不起，我听不懂。"),
 ("clinic_reception", "information_exchange", PRAC, "Ở quầy lễ tân phòng khám", "Nói đây là lần đầu bạn đến, rồi đưa hộ chiếu.",
  [("您好！您是第一次来吗？", "以前来过吗？", "Hãy trả lời: đúng, đây là lần đầu bạn đến.", "first", ["是，第一次", "对，第一次", "是的，我第一次来", "是第一次", "对", "是"], [["第一", "是", "对"]]),
   ("请给我看一下您的护照。", "有护照吗？", "Hãy đưa hộ chiếu và nói một câu lịch sự.", "hand_over", ["好的，给您", "给您", "这是我的护照", "好，给你", "在这儿"], [["给", "这是", "护照", "这儿"]])],
  "好，请等一下。", AGAIN),
 ("bank_account", "transaction", PRAC, "Làm thẻ ở ngân hàng", "Nói bạn muốn làm một thẻ ngân hàng, rồi báo bạn đã điền xong đơn.",
  [("您好，您需要什么？", "您要做什么？", "Hãy nói bạn muốn làm một thẻ ngân hàng.", "card", ["我想要一张银行卡", "我要一张银行卡", "我想办一张银行卡", "我要办银行卡", "办银行卡"], [["银行卡"]]),
   ("好的，请先填这张表。", "请填一下这张表。", "Hãy nói bạn đã điền xong.", "filled", ["我填好了", "填好了", "好了", "我已经填好了", "好的，填好了"], [["好了", "填好"]])],
  "好的，请输入密码。", "没关系，我帮您填。"),
 ("clinic_doctor", "information_exchange", PRAC, "Đi khám bệnh", "Nói với bác sĩ bạn đau đầu và bị sốt, đã hai ngày rồi.",
  [("你哪儿不舒服？", "你怎么了？", "Hãy nói bạn đau đầu và bị sốt.", "symptom", ["我头疼，发烧", "我头疼，还发烧", "头疼，发烧", "我头疼，也发烧了", "我头疼", "我发烧了", "我头很疼，发烧了"], [["头疼", "头", "发烧"]]),
   ("疼了几天了？", "几天了？", "Hãy nói đã hai ngày rồi.", "since", ["两天了", "两天", "疼了两天了", "已经两天了"], [["两天", "两"]])],
  "这是药，一天吃三次。", "我们去问护士吧。"),
 ("call_sick", "information_exchange", CONV, "Gọi điện xin nghỉ ốm", "Gọi cho tổ trưởng Lý: nói bạn là Nguyễn Hải, bạn bị sốt và hôm nay xin nghỉ.",
  [("喂，你好！", "喂，哪位？", "Hãy chào tổ trưởng và nói bạn là Nguyễn Hải.", "give_name", ["喂，组长好，我是阮海", "组长好，我是阮海", "我是阮海", "喂，我是阮海", "您好，我是阮海", "李组长，我是阮海"], [["阮海"]]),
   ("阮海，什么事？", "有什么事吗？", "Hãy nói bạn bị sốt và hôm nay xin nghỉ.", "sick", ["我发烧了，今天想请假", "我发烧了，今天不能上班", "我今天想请假", "我发烧了", "我生病了，想请假一天", "我今天不能来上班"], [["发烧", "生病", "请假", "不能"]])],
  "好的，好好休息。", "我听不清楚，你再说一遍。"),
 ("factory_safety", "information_exchange", PRAC, "Chỉ dẫn an toàn ở nhà máy", "Nghe chỉ dẫn an toàn, nói bạn đã hiểu, rồi hỏi cách dừng máy.",
  [("进车间以前，请戴安全帽和手套。", "要戴安全帽，戴手套。", "Hãy nói bạn đã hiểu.", "understood", ["我明白了", "明白了", "好的，明白了", "好的", "知道了", "好的，我知道了"], [["我明白了", "明白", "知道", "好的"]]),
   ("这个机器很危险，工作的时候要小心。", "机器很危险，要小心。", "Hãy hỏi làm sao để dừng máy.", "ask_stop", ["机器怎么停", "怎么停机器", "请问怎么停", "机器怎么关", "怎么关机器", "怎么停"], [["停", "关"]])],
  "用这个红的，机器就停了。", "不明白的时候，问组长。"),
 ("warehouse_boxes", "information_exchange", PRAC, "Làm việc trong kho", "Hỏi tổ trưởng để thùng ở đâu, rồi nói có bao nhiêu thùng.",
  [("请把这些箱子搬到仓库。", "这些箱子，搬到仓库去。", "Hãy hỏi để thùng ở đâu.", "where_put", ["放在哪儿", "箱子放在哪儿", "放哪儿", "箱子放哪儿", "请问放在哪儿"], [["哪儿", "哪里"]]),
   ("放在门口旁边。一共有几个箱子？", "有几个箱子？", "Hãy nói có hai mươi thùng.", "count", ["二十个", "一共二十个", "有二十个箱子", "一共有二十个箱子", "二十个箱子"], [["二十"]])],
  "好的，谢谢，辛苦了！", "没关系，我来看看。"),
 ("taiwan_first_day", "conversation", CONV, "Ngày đầu ở nhà máy Đài Loan", "Trả lời tổ trưởng trong ngày đầu đi làm, rồi hỏi chỗ chấm công.",
  [("早！你是新来的工人吗？", "你是新来的吗？", "Hãy trả lời là đúng, rồi nói tên bạn: Nguyễn Nam.", "give_name", ["是，我叫阮南", "对，我是阮南", "是的，我叫阮南", "我叫阮南", "我是阮南"], [["阮南"]]),
   ("好。上班以前要打卡。", "上班要先打卡。", "Hãy hỏi chấm công ở đâu.", "where_clock", ["在哪儿打卡", "请问在哪儿打卡", "打卡在哪儿", "在哪儿打卡呢"], [["打卡"]])],
  "在门口。宿舍在工厂后边，下班以后我带你去。", "不懂可以问我。"),
]
RESERVED = [
 ("cp6_new_colleague", "conversation", CONV, "Đồng nghiệp mới", "Làm quen với một đồng nghiệp ở nhà máy.",
  [("你好！我叫小王。你是新来的吗？", "你是新同事吗？", "Hãy trả lời là đúng, rồi nói tên bạn: Nguyễn Hoa.", "give_name", ["是，我叫阮花", "对，我叫阮花", "我叫阮花", "我是阮花", "是的，我是阮花"], [["阮花"]]),
   ("你是哪国人？", "你是从哪儿来的？", "Hãy nói bạn là người Việt Nam.", "give_origin", ["我是越南人", "越南人", "我从越南来", "我是从越南来的"], [["越南"]])],
  "认识你很高兴！", "没关系，以后再说吧。"),
 ("cp6_interview", "information_exchange", CONV, "Phỏng vấn xin việc", "Trả lời hai câu hỏi trong buổi phỏng vấn.",
  [("你好，请坐。你叫什么名字？", "您的名字是？", "Hãy nói tên bạn: Nguyễn Nam.", "give_name", ["我叫阮南", "我是阮南", "阮南", "您好，我叫阮南"], [["阮南"]]),
   ("你会说汉语吗？", "你的汉语怎么样？", "Hãy nói bạn biết nói một chút.", "little", ["会一点儿", "我会说一点儿", "会说一点儿汉语", "一点儿", "我会说一点儿汉语"], [["一点儿", "一点"]])],
  "好，下个星期给你打电话。", "谢谢，再见。"),
 ("cp6_supermarket_pay", "transaction", PRAC, "Trả tiền ở siêu thị", "Hỏi trả bằng thẻ ngân hàng được không, rồi nói bạn không cần gì thêm.",
  [("一共八十二块。", "八十二块钱。", "Hãy hỏi trả bằng thẻ ngân hàng được không.", "card", ["可以用银行卡吗", "能用银行卡吗", "用银行卡可以吗", "我用银行卡，可以吗"], [["银行卡", "卡"]]),
   ("可以。还要别的吗？", "还要什么吗？", "Hãy nói bạn không cần gì nữa.", "nothing", ["不要了", "不要了，谢谢", "没有了", "没有了，谢谢", "不用了，谢谢", "不用了"], [["不要", "没有", "不用"]])],
  "好的，谢谢，欢迎再来！", AGAIN),
 ("cp6_way_bank", "information_exchange", PRAC, "Tìm ngân hàng", "Hỏi một người lạ ngân hàng ở đâu, rồi cảm ơn.",
  [("你好，有什么事吗？", "你要去哪儿？", "Hãy hỏi ngân hàng ở đâu.", "ask_way", ["请问，银行在哪儿", "银行在哪儿", "请问银行怎么走", "银行怎么走", "请问，去银行怎么走"], [["银行"]]),
   ("银行在超市对面，很近。", "在超市对面。", "Hãy cảm ơn.", "thank", THANKS, [["谢谢"]])],
  "不客气。", "对不起，我不知道。"),
 ("cp6_clinic_cough", "information_exchange", PRAC, "Ở phòng khám", "Nói với y tá bạn bị ho, và bạn không sốt.",
  [("你怎么了？", "哪儿不舒服？", "Hãy nói bạn bị ho.", "symptom", ["我咳嗽", "我咳嗽了", "咳嗽", "我有点儿咳嗽"], [["咳嗽"]]),
   ("发烧吗？", "你发烧吗？", "Hãy nói bạn không sốt.", "no_fever", ["不发烧", "我不发烧", "没有发烧", "没发烧", "没有"], [["不", "没", "没有"]])],
  "多喝水，好好休息。", "请等一下，医生马上来。"),
 ("cp6_call_office", "information_exchange", CONV, "Gọi điện đến văn phòng", "Xin nói chuyện với giám đốc Vương; ông ấy không có ở đó, nên bạn sẽ gọi lại.",
  [("喂，您好！这里是工厂办公室。", "您好，办公室。", "Hãy xin nói chuyện với giám đốc Vương.", "ask_person", ["我找王经理", "请问王经理在吗", "王经理在吗", "我想找王经理", "我要找王经理"], [["王经理", "经理"]]),
   ("王经理现在不在。您一会儿再打吧。", "他现在不在。", "Hãy đồng ý gọi lại sau.", "agree", ["好的，我一会儿再打", "好的", "我一会儿再打", "好，我再打", "好的，谢谢"], [["好", "好的", "再打"]])],
  "好的，再见。", "对不起，我听不清楚。"),
 ("a1cap_shift_change", "conversation", CONV, "Đổi ca", "Tổ trưởng hỏi bạn đổi ca: nói bạn làm ca đêm được, rồi hỏi mấy giờ bắt đầu.",
  [("明天你能上夜班吗？", "明天上夜班，可以吗？", "Hãy nói được.", "accept", ["可以", "能", "可以，没问题", "没问题", "好的", "能上"], [["可以", "能", "没问题", "好的"]]),
   ("太好了，谢谢！你有什么问题吗？", "有问题吗？", "Hãy hỏi mấy giờ bắt đầu.", "ask_time", ["几点开始", "夜班几点开始", "几点上班", "夜班几点上班", "请问几点开始"], [["几点"]])],
  "晚上十一点开始。", "我在微信上告诉你。"),
 ("a1cap_canteen_lunch", "conversation", CONV, "Ăn trưa ở căng tin", "Nhận lời ăn trưa với đồng nghiệp, rồi nói bạn muốn ăn gì.",
  [("十二点了，一起去食堂吃饭吧？", "去吃午饭吗？", "Hãy nhận lời.", "accept", ["好啊", "好的", "好，一起去吧", "走吧", "好啊，走吧", "好的，一起去"], [["好", "好的", "走"]]),
   ("你想吃什么？", "吃什么？", "Hãy nói bạn muốn ăn mì.", "food", ["我想吃面条", "面条", "我要面条", "吃面条吧"], [["面条"]])],
  "好，我也吃面条。", "没关系，我们去看看吧。"),
 ("a1cap_friend_plan", "conversation", CONV, "Hẹn một người bạn", "Nhận lời hẹn vào Chủ nhật, rồi nói giờ gặp.",
  [("星期天你有时间吗？", "星期天忙不忙？", "Hãy nói bạn rảnh.", "accept", ["有时间", "有", "我有时间", "星期天有时间", "我不忙"], [["有", "不忙"]]),
   ("我们几点见？", "几点见面？", "Hãy nói gặp lúc 3 giờ.", "time", ["三点见", "下午三点见", "三点吧", "我们三点见", "三点"], [["三点"]])],
  "好，星期天下午三点见！", "好的，以后再说吧。"),
 ("a1cap_weekend", "conversation", CONV, "Chuyện cuối tuần", "Kể với đồng nghiệp cuối tuần bạn đã đi đâu.",
  [("周末你做什么了？", "周末去哪儿了？", "Hãy nói bạn đã đi công viên.", "where", ["我去公园了", "去公园了", "我去了公园", "我和朋友去公园了"], [["公园"]]),
   ("公园怎么样？", "好玩儿吗？", "Hãy nói công viên rất đẹp.", "how", ["很漂亮", "公园很漂亮", "非常漂亮", "很好看", "公园很好看"], [["漂亮", "好看"]])],
  "下次我也想去。", "好，下次再说吧。"),
]

scen, clips = [], []


def add_clip(cid, text, obj, speaker):
    clips.append(clip(cid, "message", [(speaker, text)], [obj]))


for rows, reserved in ((TEACHING, False), (RESERVED, True)):
    for n, (sid, fam, obj, title, goal, steps, end, miss) in enumerate(rows):
        base = f"zh.clip.ix_{sid}"
        # Partner voices alternate, so that a learner meets both: A is meant to be the female voice, B the male one.
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
            heard = spoken_variants(variants)
            for v in heard:
                if LATIN.search(v):
                    PROBLEMS.append(f"{sid}/l{i}: {v!r} — an answer is hanzi only")
            exp = [{"intent": intent, "acceptedVariants": heard, "requiredConcepts": concepts, "next": nxt}]
            nodes[f"l{i}"] = {"kind": "learner", "id": f"l{i}", "prompt": {"vi": prompt}, "expected": exp, "noMatchNext": f"r{i}", "scored": True}
            nodes[f"r{i}"] = {"kind": "partner", "id": f"r{i}", "text": rp, "clipId": f"{base}_{i}_s", "next": f"l{i}b"}
            nodes[f"l{i}b"] = {"kind": "learner", "id": f"l{i}b", "prompt": {"vi": prompt}, "expected": exp, "noMatchNext": "t_miss", "scored": False}
        add_clip(f"{base}_end", end, obj, speaker)
        nodes["t_ok"] = {"kind": "terminal", "id": "t_ok", "outcome": "goal_met", "text": end, "clipId": f"{base}_end"}
        scen.append({"id": f"zh.scenario.{sid}", "title": {"vi": title}, "goal": {"vi": goal}, "taskFamily": fam, "objectiveRefs": [obj], "startNodeId": "p0",
                     "nodes": nodes, "support": {"allowRepeat": True, "allowRephrase": True}, "reserved": reserved, "sourceRef": "original-project"})

write_jsonl(f"{DRAFTS}/scenarios/OUTPUT.jsonl", scen)
write_jsonl(f"{DRAFTS}/listening/OUTPUT.jsonl", clips, "a")
report()


def ids(step):
    return {r["id"]: r for r in read_jsonl(f"{DRAFTS}/{step}/OUTPUT.jsonl")}


ASSESSMENT = ("cp", "a1cap", "pl_")
KNOWN = {"clips": ids("listening"), "readings": ids("readings"), "speech": ids("speech"), "writing": ids("writing"), "scenarios": ids("scenarios")}
bad = [f"{lesson} {kind} {x}" for lesson, by in REFS.items() for kind, xs in by.items() for x in xs if x not in KNOWN[kind] or KNOWN[kind][x].get("reserved") is True]
bad += [f"{lesson} clip {x} is reserved for assessment" for lesson, by in REFS.items() for x in by.get("clips", []) + by.get("readings", []) if x.split(".")[-1].startswith(ASSESSMENT)]
used = {kind: {x for by in REFS.values() for x in by.get(kind, [])} for kind in KNOWN}
unused = [x for kind in ("speech", "writing", "scenarios") for x, r in KNOWN[kind].items() if not r.get("reserved") and x not in used[kind]]
unused += [x for kind in ("readings",) for x in KNOWN[kind] if not x.split(".")[-1].startswith(ASSESSMENT) and x not in used[kind]]
# Every Section 3 clip of the reception generator has a lesson too (speech models and partner turns are used through
# their items and scenarios).
unused += [x for x in KNOWN["clips"] if x.split(".")[-1][:3] in ("uf_", "ug_", "uh_", "ui_", "uj_") and x not in used["clips"]]
if bad or unused:
    sys.exit("zh_lesson_refs.py: " + "; ".join(bad + [f"unused {x}" for x in unused]))
print(len(scen), "scenarios", sum(s["reserved"] for s in scen), "reserved", len(clips), "clips", sum(len(s["nodes"]) for s in scen), "nodes", dict(Counter(s["taskFamily"] for s in scen)))

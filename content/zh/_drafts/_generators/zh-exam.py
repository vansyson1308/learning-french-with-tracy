"""zh-vi practice tracks on the format of the new HSK 1 and HSK 2 (HSK 3.0; content/zh/exam/FORMAT-SOURCES.md), after
ja-exam.py. Original items only: no official sample question, sentence, picture or script is copied or paraphrased. Two
parallel forms per level, each a full administration.

What the official documents fix (read 2026-11-04): HSK 3.0 is administered from the 13 December 2026 session
(chinesetest.cn announcement of 2026-09-08); the sessions before it, the last on 7 November 2026, sit the current HSK.
The official sample papers (HSK（一级）样卷 and HSK（二级）样卷, 中外语言交流合作中心 编制, in the sample package the site
links) give the parts, item numbers and times: HSK 1 has 听力 20 items in about 12 minutes and 阅读 20 items in 20
minutes, four parts of five items each; HSK 2 has 听力 25 (about 17 minutes; parts of 5, 10 and 10), 阅读 25 (25 minutes;
5, 5, 10, 5) and 书写 10 (10 minutes; 5 and 5). Each part's task type is read from the sample's layout: three pictures,
three printed replies, a shared pool of six pictures / replies / words (one keyed by the example), three printed
options after a ★ question, six character components, a character written for the pinyin in a blank. What they do not
fix for HSK 3.0, and the course chose: the score scale and pass mark (the current HSK publishes 100 points a section and
a 60 % total, 120/200, with no section minimum; the course keeps that as a reference threshold and says so), how often a
recording plays (here twice), and the pool of the second group in a 10-item matching part (the sample has five options
for five items; the engine's pool needs one spare, so the course adds one and says so).

Appends its stimuli (use: "exam") to listening/OUTPUT.jsonl and readings/OUTPUT.jsonl (run after the layer generators)
and writes exam/OUTPUT.jsonl. Every Chinese string goes through the reading checks of the layers (zh_layers.check), and
every word must belong to the HSK 3.0 level of its track or below (hsk-course.json, from ivankra/hsk30; a compound the
list does not hold passes when each of its characters is a character of the level; names and 越南 pass).
usage: python -I zh-exam.py <repo root>"""
import json, os, re, sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zh_layers import BY_ID, DRAFTS, HAN, INDEX, LEX, PROBLEMS, ROOT, check, check_vi, refs, report, write_jsonl  # noqa: E402

HSK = json.load(open(f"{ROOT}/content/zh/lexicon/derived/hsk-course.json", encoding="utf-8"))
LEVEL_OF, CHARS, WRITE_LEVEL = HSK["courseLevels"], HSK["chars"], HSK["writingLevel"]
COUNTRY = {"越南", "越南人", "越南语"}
clips, readings, tracks = [], [], []
_pos = [0]


def O(k):
    return f"zh.obj.{k}"


LF, LI, LD, RD, RT, EV, HV, PI = (O(k) for k in ["listening.familiar_words", "listening.short_info", "listening.short_dialogues", "reading.familiar_words",
                                                 "reading.short_texts", "vocab.everyday_basics", "script.hanzi_hanviet", "writing.pinyin_input"])


# ---------------------------------------------------------------- checks
def level_check(where, text, level):
    """Every word of an HSK n string is an HSK 3.0 word of level n or below."""
    allowed = {str(i) for i in range(1, level + 1)}
    chars = "".join(CHARS.get(k, "") for k in allowed)
    for tok, py in INDEX.tokens(text):
        if py is None or tok in COUNTRY or (tok in LEX and LEX[tok].get("proper")):
            continue
        lv = LEVEL_OF.get(tok)
        if lv in allowed:
            continue
        if lv is None and all(c in chars for c in tok):
            continue
        PROBLEMS.append(f"{where}: {tok} is HSK level {lv or 'none'}, above HSK {level}, in {text!r}")


def zh(where, text, level):
    check(where, text)
    level_check(where, text, level)


def place(correct, wrong):
    n = len(wrong) + 1
    if correct in wrong or len(set(wrong)) != len(wrong):
        PROBLEMS.append(f"{correct}: a distractor repeats an option: {wrong}")
    p = _pos[0] % n
    _pos[0] += 1
    o = list(wrong)
    o.insert(p, correct)
    return o, p


# ---------------------------------------------------------------- stimuli
def clip(cid, segs, obj, level, units=1):
    for _, t in segs:
        zh(cid, t, level)
    text = "".join(t for _, t in segs)
    clips.append({"id": cid, "kind": "dialogue" if len(segs) > 1 else "message", "segments": [{"speaker": s, "text": t} for s, t in segs], "objectiveRefs": [obj],
                  "lexemeRefs": refs(text), "sourceRef": "original-project", "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"},
                  "scoredPlaybackPolicy": {"maxPlays": 2, "rate": 1}, "use": "exam"})
    return cid


def reading(rid, blocks, obj, level, kind="description", units=1):
    for b in blocks:
        zh(rid, b, level)
    readings.append({"id": rid, "kind": kind, "blocks": [{"kind": "paragraph", "text": b} for b in blocks], "objectiveRefs": [obj], "lexemeRefs": refs("".join(blocks)),
                     "supportGlossary": [], "sourceRef": "original-project", "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"}, "use": "exam"})
    return rid


# ---------------------------------------------------------------- one track
class Track:
    def __init__(self, slug, level):
        self.slug, self.level, self.items = slug, level, []
        self.short = slug.replace("_", "")

    def item(self, form, task, n, exercise, obj, section, lex=None):
        s = f"{form}_{task}_{n:02d}"
        ex = dict(exercise)
        ex["id"] = f"zh-exx-{self.slug}-{s}"
        rec = {"id": f"zh.exi.{self.slug}.{s}", "itemVersion": 1, "sectionId": section, "taskId": task, "exercise": ex, "objectiveTargets": [obj]}
        if lex:
            rec["lexemeRefs"] = lex
        self.items.append(rec)

    def _opts(self, where, texts, emojis=None):
        for t in texts:
            (zh(where, t, self.level) if HAN.search(t) else check_vi(where, t))
        if emojis:
            if len(set(emojis)) != len(emojis):
                PROBLEMS.append(f"{where}: two options share a picture")
            return [{"text": t, "emoji": e} for t, e in zip(texts, emojis)]
        return [{"text": t} for t in texts]

    # three pictures (pictureMcq) or three printed options (mcq3) after a clip or a reading
    def lc3(self, form, task, n, segs, q, key, wrong, obj, units=1):
        """key and wrong are texts, or (Vietnamese label, emoji) pictures."""
        cid = clip(f"zh.clip.{self.short}_{form}_{task}_{n:02d}", segs, obj, self.level, units)
        check_vi(cid, q)
        o, p = place(key, wrong)
        if isinstance(key, tuple):
            opts = self._opts(cid, [t for t, _ in o], [e for _, e in o])
        else:
            opts = self._opts(cid, o)
        self.item(form, task, n, {"type": "listeningComprehension", "clipId": cid, "question": q, "options": opts, "correct": p}, obj, "tingli")

    def rc3(self, form, task, n, blocks, q, key, wrong, obj):
        rid = reading(f"zh.read.{self.short}_{form}_{task}_{n:02d}", blocks, obj, self.level)
        check_vi(rid, q)
        o, p = place(key, wrong)
        self.item(form, task, n, {"type": "readingComprehension", "readingId": rid, "question": q, "options": self._opts(rid, o), "correct": p}, obj, "yuedu")

    # a shared pool: every item offers the same options in the same order; each option keys at most one item
    def pool(self, form, task, rows, pool, q, obj, listening):
        """pool: texts, or (Vietnamese label, emoji) pictures; a row's key is the text or label."""
        emojis = [e for _, e in pool] if isinstance(pool[0], tuple) else None
        pool = [p[0] for p in pool] if emojis else pool
        keys = [k for *_x, k in rows]
        if len(set(keys)) != len(keys) or any(k not in pool for k in keys) or len(pool) <= len(rows):
            PROBLEMS.append(f"{self.slug} {form}/{task}: keys {keys} must be distinct members of a larger pool {pool}")
        check_vi(task, q)
        for n, row in enumerate(rows, 1):
            stim, key = row[0], row[-1]
            where = f"{self.slug} {form}/{task}/{n}"
            opts = self._opts(where, pool, emojis)
            if listening:
                cid = clip(f"zh.clip.{self.short}_{form}_{task}_{n:02d}", stim, obj, self.level, 2)
                ex = {"type": "listeningComprehension", "clipId": cid, "question": q, "options": opts, "correct": pool.index(key)}
                self.item(form, task, n, ex, obj, "tingli")
            else:
                rid = reading(f"zh.read.{self.short}_{form}_{task}_{n:02d}", [stim], obj, self.level)
                ex = {"type": "readingComprehension", "readingId": rid, "question": q, "options": opts, "correct": pool.index(key)}
                self.item(form, task, n, ex, obj, "yuedu")

    # 书写 1: the missing component of a character (select, readings hidden: the target is never shown)
    def component(self, form, rows, pool):
        keys = [r[-1] for r in rows]
        if len(set(keys)) != len(keys) or any(k not in pool for k in keys) or len(pool) <= len(rows):
            PROBLEMS.append(f"{self.slug} {form}/w1: keys {keys} must be distinct members of a larger pool {pool}")
        for n, (word, py, vi, target, given, key) in enumerate(rows, 1):
            if target not in word or WRITE_LEVEL.get(target) not in ("1", "2"):
                PROBLEMS.append(f"{word}: {target} is no HSK 1-2 handwriting character of the word")
            zh(f"w1 {word}", word, self.level)
            check_vi(word, vi)
            shown = word.replace(target, "？")
            prompt = f"Từ \"{vi}\" ({py}) viết là {shown}. Chữ ở chỗ ？ gồm {given} ở bên phải và một bộ phận ở bên trái. Chọn bộ phận còn thiếu."
            ex = {"type": "select", "mode": "nativeToTarget", "prompt": prompt, "options": [{"text": c} for c in pool], "correct": pool.index(key), "scriptAid": "hidden"}
            self.item(form, "w1", n, ex, HV, "shuxie", refs(word))

    # 书写 2: the character for the pinyin given in the blank, typed through the pinyin keyboard
    def write_char(self, form, rows):
        for n, (sentence, py, key) in enumerate(rows, 1):
            if sentence.count("___") != 1 or len(key) != 1 or WRITE_LEVEL.get(key) not in ("1", "2"):
                PROBLEMS.append(f"{sentence}: one blank, one HSK 1-2 handwriting character ({key}: level {WRITE_LEVEL.get(key)})")
            full = sentence.replace("___", key)
            zh(sentence, full, self.level)
            if INDEX.pinyin(key).replace(" ", "") != py and py not in INDEX.pinyin(full):
                PROBLEMS.append(f"{sentence}: {key} does not read {py} ({INDEX.pinyin(full)})")
            prompt = f"Gõ chữ Hán đọc là {py} vào chỗ trống: {sentence}"
            ex = {"type": "typeAnswer", "mode": "produceTarget", "prompt": prompt, "answer": key, "alternatives": []}
            self.item(form, "w2", n, ex, PI, "shuxie", refs(full))


# =============================================================== the HSK 1 forms
def pics(*pairs):
    """(label, emoji) pairs: the Vietnamese label is the option text, the emoji the picture; a three-picture item lists its key first."""
    return list(pairs)


H1 = Track("hsk_1", 1)
SAY = "Bạn nghe thấy gì? Chọn tranh đúng."
REPLY = "Chọn câu trả lời đúng."
MATCH_HEARD = "Hội thoại này hợp với tranh nào?"
MATCH_READ = "Câu này hợp với tranh nào?"
MATCH_REPLY = "Chọn câu trả lời hợp với câu này."
GAP = "Chọn từ thích hợp cho chỗ trống （　）."
H1L1 = {
 "a": [("我在喝茶。", pics(("Uống trà", "🍵"), ("Ăn cơm", "🍚"), ("Đọc sách", "📖"))),
       ("他在开车。", pics(("Lái xe", "🚗"), ("Đi máy bay", "✈️"), ("Đi bộ", "🚶"))),
       ("今天下雨了。", pics(("Trời mưa", "🌧️"), ("Trời nắng", "☀️"), ("Có gió", "💨"))),
       ("这是我的手机。", pics(("Điện thoại di động", "📱"), ("Máy tính", "💻"), ("Ví tiền", "👛"))),
       ("我去医院。", pics(("Bệnh viện", "🏥"), ("Trường học", "🏫"), ("Cửa hàng", "🏪")))],
 "b": [("我在看书。", pics(("Đọc sách", "📚"), ("Xem ti vi", "📺"), ("Nghe nhạc", "🎧"))),
       ("我们坐火车去。", pics(("Tàu hoả", "🚆"), ("Xe buýt", "🚌"), ("Máy bay", "🛫"))),
       ("他在睡觉。", pics(("Ngủ", "😴"), ("Chạy", "🏃"), ("Ăn mì", "🍜"))),
       ("这是我的电脑。", pics(("Máy tính", "💻"), ("Điện thoại", "☎️"), ("Ti vi", "📺"))),
       ("我想吃米饭。", pics(("Cơm", "🍙"), ("Bánh mì", "🍞"), ("Trứng", "🥚")))],
}
H1L2 = {
 "a": [("你叫什么名字？", "我叫阮南。", ["我是学生。", "我很好。"]),
       ("你去哪儿？", "我去商店。", ["八点去。", "我是老师。"]),
       ("这个多少钱？", "十五块。", ["三个人。", "下午三点。"]),
       ("你今天忙吗？", "很忙。", ["很好吃。", "在学校。"]),
       ("你喝什么？", "我喝水。", ["我吃米饭。", "我不去。"])],
 "b": [("你多大了？", "我二十岁。", ["我很高兴。", "我在大学。"]),
       ("你什么时候回家？", "明天回家。", ["坐火车回家。", "我家很大。"]),
       ("你会说汉语吗？", "会一点儿。", ["不客气。", "我没有钱。"]),
       ("你爸爸做什么工作？", "他是医生。", ["他很忙。", "他五十岁。"]),
       ("你想喝茶还是喝水？", "喝水吧。", ["我不想吃。", "在桌子上。"])],
}
H1L3 = {
 "a": (pics(("A. Xem ti vi", "📺"), ("B. Gọi điện thoại", "☎️"), ("C. Hoa quả", "🍎"), ("D. Trường học", "🏫"), ("E. Đi ngủ", "🛏️"), ("F. Taxi", "🚕")),
       [([("A", "你在做什么？"), ("B", "我在打电话。")], "B. Gọi điện thoại"),
        ([("B", "你想吃什么？"), ("A", "我想吃水果。")], "C. Hoa quả"),
        ([("A", "你明天去哪儿？"), ("B", "我去学校。")], "D. Trường học"),
        ([("B", "你累吗？"), ("A", "很累，我想睡觉。")], "E. Đi ngủ"),
        ([("A", "我们怎么去机场？"), ("B", "打车去吧。")], "F. Taxi")]),
 "b": (pics(("A. Bệnh viện", "🏨"), ("B. Mua quần áo", "👕"), ("C. Học tiếng Trung", "📝"), ("D. Ga tàu", "🚉"), ("E. Uống trà nóng", "☕"), ("F. Nấu cơm", "🍳")),
       [([("A", "你怎么了？"), ("B", "我生病了，想去医院。")], "A. Bệnh viện"),
        ([("B", "你买什么？"), ("A", "我想买衣服。")], "B. Mua quần áo"),
        ([("A", "你在学什么？"), ("B", "我在学汉语。")], "C. Học tiếng Trung"),
        ([("B", "火车站在哪儿？"), ("A", "在前边，不远。")], "D. Ga tàu"),
        ([("A", "你喝什么？"), ("B", "我喝茶，谢谢。")], "E. Uống trà nóng")]),
}
H1L4 = {
 "a": [("我下午去商店买东西。", "Buổi chiều người nói đi đâu?", "商店", ["学校", "医院"]),
       ("我家有四口人：爸爸、妈妈、哥哥和我。", "Nhà người nói có mấy người?", "四口人", ["三口人", "五口人"]),
       ("明天是我的生日，我就十八岁了。", "Ngày mai người nói bao nhiêu tuổi?", "十八岁", ["八岁", "十岁"]),
       ("我坐飞机去北京，下午三点到。", "Người nói đi Bắc Kinh bằng gì?", "坐飞机", ["坐火车", "开车"]),
       ("这本书很好看，我想再看一次。", "Người nói muốn làm gì?", "再看一次", ["买这本书", "写一本书"])],
 "b": [("我在商店工作，我很喜欢我的工作。", "Người nói làm việc ở đâu?", "商店", ["医院", "学校"]),
       ("我女儿今年六岁，她很喜欢唱歌。", "Con gái của người nói thích làm gì?", "唱歌", ["看电视", "写字"]),
       ("明天上午我去机场，我坐十点的飞机。", "Người nói đi chuyến bay lúc mấy giờ?", "十点", ["八点", "十二点"]),
       ("我家在学校旁边，我走路去上学。", "Nhà người nói ở đâu?", "学校旁边", ["医院旁边", "商店前边"]),
       ("昨天我和同学去看电影了，电影很好看。", "Hôm qua người nói đã làm gì?", "看电影", ["看书", "去医院"])],
}
H1R1 = {
 "a": (pics(("A. Xe đạp", "🚲"), ("B. Bác sĩ", "🧑‍⚕️"), ("C. Sữa", "🥛"), ("D. Ăn ở nhà hàng", "🍽️"), ("E. Trời đẹp", "🌤️"), ("F. Quyển sách", "📕")),
       [("我早上喝牛奶。", "C. Sữa"), ("他在医院工作，他是医生。", "B. Bác sĩ"), ("桌子上有一本书。", "F. Quyển sách"),
        ("今天天气很好，不冷也不热。", "E. Trời đẹp"), ("我们在饭店吃饭。", "D. Ăn ở nhà hàng")]),
 "b": (pics(("A. Cà phê", "☕️"), ("B. Máy bay", "✈"), ("C. Gia đình", "👨‍👩‍👧"), ("D. Gọi điện", "📞"), ("E. Trời mưa", "☔"), ("F. Viết chữ", "✍️")),
       [("我家有三口人：爸爸、妈妈和我。", "C. Gia đình"), ("明天我坐飞机去北京。", "B. Máy bay"), ("外边下雨了，别出去了。", "E. Trời mưa"),
        ("我在写汉字。", "F. Viết chữ"), ("我给妈妈打电话。", "D. Gọi điện")]),
}
H1R2 = {
 "a": (["不客气。", "在学校旁边。", "我是越南人。", "九点半。", "喜欢，我常常喝。", "我和朋友一起去。"],
       [("你喜欢喝茶吗？", "喜欢，我常常喝。"), ("你家在哪儿？", "在学校旁边。"), ("现在几点了？", "九点半。"), ("你是哪国人？", "我是越南人。"), ("你和谁一起去？", "我和朋友一起去。")]),
 "b": (["吃了，很好吃。", "我叫阮南。", "在桌子上。", "下午三点吧。", "认识，他是我同学。", "四口人。"],
       [("你吃饭了吗？", "吃了，很好吃。"), ("你的手机在哪儿？", "在桌子上。"), ("我们几点见面？", "下午三点吧。"), ("你认识他吗？", "认识，他是我同学。"), ("你家有几口人？", "四口人。")]),
}
H1R3 = {
 "a": (["本", "是", "喜欢", "热", "回", "名字"],
       [("我（　）看电影。", "喜欢"), ("这（　）我的书。", "是"), ("我有三（　）书。", "本"), ("今天很（　），我想喝水。", "热"), ("下午我（　）家。", "回")]),
 "b": (["杯", "去", "很", "知道", "几", "学生"],
       [("我要一（　）水。", "杯"), ("我（　）医院看病。", "去"), ("这个菜（　）好吃。", "很"), ("我不（　）他是谁。", "知道"), ("今天星期（　）？", "几")]),
}
H1R4 = {
 "a": [(["我叫阮南，我是越南人，我在北京学习汉语。", "★ 阮南在北京做什么？"], "Nam làm gì ở Bắc Kinh?", "学习汉语", ["工作", "看病"]),
       (["今天是星期天，我不上班，我在家休息。", "★ 说话人今天做什么？"], "Hôm nay người viết làm gì?", "在家休息", ["上班", "去学校"]),
       (["这个包很好看，也不贵，我想买。", "★ 说话人想做什么？"], "Người viết muốn làm gì?", "买这个包", ["买衣服", "回家"]),
       (["我早上七点起床，八点去学校。", "★ 说话人几点去学校？"], "Người viết đi học lúc mấy giờ?", "八点", ["七点", "九点"]),
       (["我爸爸是老师，妈妈是医生。", "★ 说话人的妈妈做什么工作？"], "Mẹ của người viết làm nghề gì?", "医生", ["老师", "学生"])],
 "b": [(["我在机场工作，我常常坐飞机。", "★ 说话人在哪儿工作？"], "Người viết làm việc ở đâu?", "机场", ["火车站", "饭店"]),
       (["我今天很忙，没有时间吃午饭。", "★ 说话人今天怎么了？"], "Hôm nay người viết thế nào?", "很忙", ["生病了", "不想吃"]),
       (["我女朋友是北京人，她在越南工作。", "★ 说话人的女朋友在哪儿工作？"], "Bạn gái của người viết làm việc ở đâu?", "越南", ["北京", "中国"]),
       (["现在是下午五点，我想六点回家。", "★ 说话人想几点回家？"], "Người viết muốn mấy giờ về nhà?", "六点", ["五点", "七点"]),
       (["我的房间不大，很干净。", "★ 说话人的房间大吗？"], "Phòng của người viết có to không?", "不大", ["很大", "有一点儿大"])],
}
for f in "ab":
    for n, (line, opts) in enumerate(H1L1[f], 1):
        H1.lc3(f, "l1", n, [("A" if n % 2 else "B", line)], SAY, opts[0], opts[1:], LF)
    for n, (q, key, wrong) in enumerate(H1L2[f], 1):
        H1.lc3(f, "l2", n, [("B" if n % 2 else "A", q)], REPLY, key, wrong, LD)
    pool, rows = H1L3[f]
    H1.pool(f, "l3", rows, pool, MATCH_HEARD, LD, True)
    for n, (line, q, key, wrong) in enumerate(H1L4[f], 1):
        H1.lc3(f, "l4", n, [("A" if n % 2 else "B", line)], q, key, wrong, LI)
    pool, rows = H1R1[f]
    H1.pool(f, "r1", rows, pool, MATCH_READ, RD, False)
    pool, rows = H1R2[f]
    H1.pool(f, "r2", rows, pool, MATCH_REPLY, RT, False)
    pool, rows = H1R3[f]
    H1.pool(f, "r3", rows, pool, GAP, EV, False)
    for n, (blocks, q, key, wrong) in enumerate(H1R4[f], 1):
        H1.rc3(f, "r4", n, blocks, q, key, wrong, RT)

# =============================================================== the HSK 2 forms
H2 = Track("hsk_2", 2)
H2L1 = {
 "a": [("我骑自行车上班。", pics(("Xe đạp", "🚴"), ("Xe buýt", "🚍"), ("Tàu điện ngầm", "🚇"))),
       ("外边下雪了，很冷。", pics(("Tuyết rơi", "❄️"), ("Mưa to", "⛈️"), ("Nắng to", "🔆"))),
       ("我的狗很可爱。", pics(("Con chó", "🐶"), ("Con mèo", "🐈"), ("Con cá", "🐠"))),
       ("他在银行取钱。", pics(("Ngân hàng", "🏦"), ("Bệnh viện", "🚑"), ("Khách sạn", "🏩"))),
       ("我的鞋太小了。", pics(("Đôi giày", "👟"), ("Cái mũ", "🧢"), ("Cái áo", "🎽")))],
 "b": [("妹妹在洗澡。", pics(("Tắm", "🛁"), ("Ăn cơm", "🥢"), ("Ngủ", "🛌"))),
       ("我们坐出租车去机场吧。", pics(("Taxi", "🚖"), ("Xe buýt", "🚎"), ("Xe đạp", "🛵"))),
       ("我喜欢吃鱼。", pics(("Cá", "🐟"), ("Gà", "🍗"), ("Sủi cảo", "🥟"))),
       ("今天的月亮很漂亮。", pics(("Mặt trăng", "🌙"), ("Ngôi sao", "⭐"), ("Mặt trời", "🌞"))),
       ("我给朋友发短信。", pics(("Nhắn tin", "💬"), ("Gọi điện", "📲"), ("Viết thư", "✉️")))],
}
H2L2A = {
 "a": (pics(("A. Sinh nhật", "🎂"), ("B. Công viên", "🌳"), ("C. Bị ốm", "🤒"), ("D. Ảnh", "🖼️"), ("E. Tàu điện ngầm", "🚈"), ("F. Hộ chiếu", "🛂")),
       [([("A", "你周末做什么了？"), ("B", "我和朋友去公园玩儿了。")], "B. Công viên"),
        ([("B", "你哪儿不舒服？"), ("A", "我头疼，不想吃饭。")], "C. Bị ốm"),
        ([("A", "这是你的照片吗？"), ("B", "对，这是我和我妹妹。")], "D. Ảnh"),
        ([("B", "我们坐地铁去吧。"), ("A", "好，地铁站就在前边。")], "E. Tàu điện ngầm"),
        ([("A", "你在找什么？"), ("B", "我在找我的护照。")], "F. Hộ chiếu")]),
 "b": (pics(("A. Bơi", "🏊"), ("B. Du lịch", "🧳"), ("C. Đau chân", "🦵"), ("D. Sách hay", "📗"), ("E. Mì", "🍝"), ("F. Con mèo", "🐱")),
       [([("A", "下个月你打算做什么？"), ("B", "我打算去北京旅游。")], "B. Du lịch"),
        ([("B", "你的腿怎么了？"), ("A", "很疼，我不能走路了。")], "C. Đau chân"),
        ([("A", "你在看什么书？"), ("B", "一本中文书，很有意思。")], "D. Sách hay"),
        ([("B", "您好，我们要两碗面条。"), ("A", "好的，请等一下。")], "E. Mì"),
        ([("A", "你家的猫真可爱！"), ("B", "谢谢，它两岁了。")], "F. Con mèo")]),
}
H2L2B = {
 "a": (pics(("A. Màu đỏ", "🔴"), ("B. Con mèo", "😺"), ("C. Nấu ăn", "🥘"), ("D. Máy tính", "⌨️"), ("E. Bài tập", "📓"), ("F. Trà nóng", "🫖")),
       [([("A", "你喜欢什么颜色？"), ("B", "我喜欢红的。")], "A. Màu đỏ"),
        ([("B", "你会做饭吗？"), ("A", "会，我常常给家人做饭。")], "C. Nấu ăn"),
        ([("A", "你的电脑怎么了？"), ("B", "坏了，我要去买一个新的。")], "D. Máy tính"),
        ([("B", "今天的作业多吗？"), ("A", "不多，我已经做好了。")], "E. Bài tập"),
        ([("A", "你想喝什么？"), ("B", "给我一杯热茶吧。")], "F. Trà nóng")]),
 "b": (pics(("A. Xe buýt", "🚌"), ("B. Bệnh viện", "🏥"), ("C. Điện thoại mới", "📱"), ("D. Tuyết", "☃️"), ("E. Giặt quần áo", "🧺"), ("F. Căn phòng", "🛋️")),
       [([("A", "你在等什么？"), ("B", "我在等公交车。")], "A. Xe buýt"),
        ([("B", "你看，那是我的新手机。"), ("A", "真漂亮！多少钱？")], "C. Điện thoại mới"),
        ([("A", "你喜欢下雪吗？"), ("B", "喜欢，冬天我常常去北方玩儿。")], "D. Tuyết"),
        ([("B", "你在做什么？"), ("A", "我在洗衣服。")], "E. Giặt quần áo"),
        ([("A", "这个房间怎么样？"), ("B", "很干净，也很安静。")], "F. Căn phòng")]),
}
H2L3 = {
 "a": [([("A", "小王，你明天几点上班？"), ("B", "八点半。我们一起去吧。")], "Ngày mai Tiểu Vương đi làm lúc mấy giờ?", "八点半", ["八点", "九点半"]),
       ([("A", "阮南，你的生日是几月几号？"), ("B", "九月十号。")], "Sinh nhật của Nam là ngày nào?", "九月十号", ["十月九号", "九月四号"]),
       ([("A", "请问，银行在哪儿？"), ("B", "在超市对面，走路五分钟。")], "Ngân hàng ở đâu?", "超市对面", ["超市旁边", "医院对面"]),
       ([("A", "小李，你怎么来的？"), ("B", "我坐出租车来的。")], "Tiểu Lý đến bằng gì?", "坐出租车", ["坐公交车", "骑自行车"]),
       ([("A", "这些鸡蛋多少钱一斤？"), ("B", "六块一斤，您要几斤？"), ("A", "我要两斤。")], "Trứng giá bao nhiêu tiền nửa ký?", "六块", ["两块", "十二块"]),
       ([("A", "王经理在办公室吗？"), ("B", "不在，他去开会了。")], "Quản lý Vương đi làm gì?", "开会", ["吃饭", "回家"]),
       ([("B", "阮花，你周末想去哪儿玩儿？"), ("A", "我想去公园。")], "Cuối tuần Hoa muốn đi đâu chơi?", "公园", ["动物园", "商场"]),
       ([("A", "阮南，你的汉语说得真好！你学了多长时间？"), ("B", "两年了。")], "Nam đã học tiếng Trung bao lâu?", "两年", ["两个月", "一年"]),
       ([("A", "小王，你怎么了？"), ("B", "我有点儿头疼，今天想请假。")], "Tiểu Vương muốn làm gì?", "请假", ["上班", "去旅游"]),
       ([("A", "这件衣服有大一点儿的吗？"), ("B", "有，您试试这件。")], "Người mua muốn cái áo thế nào?", "大一点儿的", ["小一点儿的", "便宜一点儿的"])],
 "b": [([("A", "小李，你早上几点起床？"), ("B", "六点半，我七点就出门了。")], "Buổi sáng Tiểu Lý dậy lúc mấy giờ?", "六点半", ["七点", "七点半"]),
       ([("B", "阮花，你哥哥做什么工作？"), ("A", "他是司机，开出租车。")], "Anh trai của Hoa làm nghề gì?", "司机", ["医生", "老师"]),
       ([("A", "请问，去火车站坐几路公交车？"), ("B", "坐十二路，在对面上车。")], "Muốn đến ga tàu thì đi xe buýt số mấy?", "十二路", ["二路", "二十路"]),
       ([("A", "王经理，我明天可以请假吗？"), ("B", "可以，但是后天你要早一点儿来。")], "Hôm nào phải đến sớm hơn?", "后天", ["明天", "今天"]),
       ([("A", "你的房间在几层？"), ("B", "在八层。")], "Phòng ở tầng mấy?", "八层", ["四层", "十八层"]),
       ([("A", "小王，你的作业写好了吗？"), ("B", "还没有，我晚上写。")], "Khi nào Tiểu Vương làm bài tập?", "晚上", ["早上", "中午"]),
       ([("A", "我们去哪儿吃饭？"), ("B", "去学校旁边那家饭馆吧，那儿的饺子很好吃。")], "Quán ăn đó có món gì ngon?", "饺子", ["面条", "包子"]),
       ([("A", "阮南，你什么时候回国？"), ("B", "下个星期五。")], "Khi nào Nam về nước?", "下个星期五", ["这个星期五", "下个星期一"]),
       ([("A", "你要红的还是黑的？"), ("B", "黑的吧，红的太贵了。")], "Người mua chọn màu gì?", "黑的", ["红的", "白的"]),
       ([("A", "小李，你为什么学汉语？"), ("B", "因为我想去中国工作。")], "Vì sao Tiểu Lý học tiếng Trung?", "想去中国工作", ["想去中国旅游", "喜欢中国菜"])],
}
H2R1 = {
 "a": (pics(("A. Hát", "🎤"), ("B. Rửa tay", "🧼"), ("C. Họp", "🧑‍💼"), ("D. Trời nắng", "☀️"), ("E. Kể chuyện", "📖"), ("F. Xe đạp hỏng", "🔧")),
       [("他在洗手。", "B. Rửa tay"), ("我们在公司开会。", "C. Họp"), ("今天是晴天，我们去公园吧。", "D. Trời nắng"),
        ("她正在给孩子讲故事。", "E. Kể chuyện"), ("我的自行车坏了。", "F. Xe đạp hỏng")]),
 "b": (pics(("A. Bóng đá", "⚽"), ("B. Uống thuốc", "💊"), ("C. Thư viện", "🏛️"), ("D. Lái xe", "🚗"), ("E. Cá dưới sông", "🎣"), ("F. Hát cùng nhau", "🎶")),
       [("你一天吃三次药，饭后吃。", "B. Uống thuốc"), ("我在图书馆看书。", "C. Thư viện"), ("他开车开得很快。", "D. Lái xe"),
        ("你看，河里有很多鱼。", "E. Cá dưới sông"), ("我们一起唱歌吧。", "F. Hát cùng nhau")]),
}
H2R2 = {
 "a": (["已经", "离", "件", "打算", "因为", "便宜"],
       [("我家（　）公司很近。", "离"), ("我（　）吃过饭了。", "已经"), ("这（　）衣服很漂亮。", "件"), ("（　）下雨，我们没去公园。", "因为"), ("这个包不贵，很（　）。", "便宜")]),
 "b": (["一共", "比", "往", "可以", "但是", "遍"],
       [("这里（　）停车吗？", "可以"), ("你（　）前走，就到了。", "往"), ("今天（　）昨天冷。", "比"), ("我说了三（　），他还是不明白。", "遍"), ("这些东西（　）多少钱？", "一共")]),
}
H2R3A = {
 "a": (["今天工作太多了。", "早上七点，在门口见。", "我想在家休息。", "很喜欢，特别是饺子。", "不客气，有问题再找我。", "他是我哥哥。"],
       [("你怎么还没下班？", "今天工作太多了。"), ("我们明天几点出发？", "早上七点，在门口见。"), ("这个周末你有什么打算？", "我想在家休息。"),
        ("你喜欢吃中国菜吗？", "很喜欢，特别是饺子。"), ("谢谢你帮我。", "不客气，有问题再找我。")]),
 "b": (["我们去吃饺子吧。", "我在等我朋友。", "我也不知道，查一下词典吧。", "会，我开了五年了。", "听说明天是晴天。", "两个小时。"],
       [("你晚上想吃什么？", "我们去吃饺子吧。"), ("你怎么还在这儿？", "我在等我朋友。"), ("这个字是什么意思？", "我也不知道，查一下词典吧。"),
        ("你会开车吗？", "会，我开了五年了。"), ("明天会下雨吗？", "听说明天是晴天。")]),
}
H2R3B = {
 "a": (["在桌子上，你看。", "一天三次，饭后吃。", "去过，去年去的。", "很冷，多穿一件衣服吧。", "我已经饱了。", "我们坐地铁去。"],
       [("你看见我的笔了吗？", "在桌子上，你看。"), ("医生，这个药怎么吃？", "一天三次，饭后吃。"), ("你去过上海吗？", "去过，去年去的。"),
        ("外边冷不冷？", "很冷，多穿一件衣服吧。"), ("你怎么不吃了？", "我已经饱了。")]),
 "b": (["又便宜又好吃。", "最近特别忙，常常工作到很晚。", "一直往前走，在右边。", "我刚到。", "八点，别忘了。", "我不喝酒。"],
       [("这家饭馆的菜怎么样？", "又便宜又好吃。"), ("你的工作忙吗？", "最近特别忙，常常工作到很晚。"), ("请问，洗手间在哪儿？", "一直往前走，在右边。"),
        ("你什么时候到的？", "我刚到。"), ("我们几点出发？", "八点，别忘了。")]),
}
H2R4 = {
 "a": [(["我们公司离地铁站很近，走路五分钟就到了。", "★ 从公司走到地铁站要多长时间？"], "Đi bộ từ công ty đến ga tàu điện ngầm mất bao lâu?", "五分钟", ["十五分钟", "半个小时"]),
       (["今天是我妈妈的生日，我给她买了一件红衣服，她非常喜欢。", "★ 说话人给妈妈买了什么？"], "Người viết mua gì cho mẹ?", "衣服", ["鞋", "笔"]),
       (["我以前在银行工作，现在在一家饭馆工作。", "★ 说话人现在在哪儿工作？"], "Bây giờ người viết làm việc ở đâu?", "饭馆", ["银行", "医院"]),
       (["这家超市的东西很便宜，但是离我家有点儿远，所以我很少去。", "★ 说话人为什么很少去这家超市？"], "Vì sao người viết ít khi đến siêu thị này?", "有点儿远", ["东西太贵", "东西不好"]),
       (["明天要下雨，我们别去公园了，在家看电影吧。", "★ 明天他们打算做什么？"], "Ngày mai họ định làm gì?", "在家看电影", ["去公园", "去电影院"])],
 "b": [(["我叫阮红，今年二十二岁，是大学生。我在北京学习了一年，我觉得北京的冬天太冷了。", "★ 阮红觉得北京的冬天怎么样？"], "Hồng thấy mùa đông ở Bắc Kinh thế nào?", "太冷了", ["很热", "很舒服"]),
       (["我骑自行车去公司，要二十分钟。下雨的时候，我坐地铁。", "★ 下雨的时候，说话人怎么去公司？"], "Khi trời mưa, người viết đi làm bằng gì?", "坐地铁", ["骑自行车", "坐出租车"]),
       (["这个房子离地铁站很近，房间也很大，可是有点儿贵，一个月五千块。", "★ 这个房子怎么样？"], "Căn nhà này thế nào?", "有点儿贵", ["离地铁站很远", "房间很小"]),
       (["上个星期我生病了，没去上班。现在我的身体已经好了。", "★ 说话人现在怎么样？"], "Bây giờ người viết thế nào?", "身体好了", ["还在生病", "要去医院"]),
       (["我想学做中国菜，我朋友说她可以教我。", "★ 谁可以教说话人做中国菜？"], "Ai có thể dạy người viết nấu món Trung Quốc?", "朋友", ["老师", "妈妈"])],
}
# 书写 1: (word, pinyin, Vietnamese, the character, its right-hand part shown, the missing left-hand component). Each pool is
# chosen so that the shown part takes no other component of the pool to make a common character read like the target.
H2W1 = {
 "a": (["氵", "亻", "口", "女", "木", "讠"],
       [("洗手间", "xǐshǒujiān", "nhà vệ sinh", "洗", "先", "氵"), ("我们", "wǒmen", "chúng tôi", "们", "门", "亻"), ("吃饭", "chīfàn", "ăn cơm", "吃", "乞", "口"),
        ("姐姐", "jiějie", "chị gái", "姐", "且", "女"), ("学校", "xuéxiào", "trường học", "校", "交", "木")]),
 "b": (["氵", "亻", "口", "女", "日", "讠"],
       [("汉语", "hànyǔ", "tiếng Trung", "汉", "又", "氵"), ("上课", "shàngkè", "lên lớp", "课", "果", "讠"), ("时间", "shíjiān", "thời gian", "时", "寸", "日"),
        ("休息", "xiūxi", "nghỉ ngơi", "休", "木", "亻"), ("你好", "nǐhǎo", "xin chào", "好", "子", "女")]),
}
H2W2 = {
 "a": [("你叫什么名___？", "zì", "字"), ("我___喝水。", "xiǎng", "想"), ("我们___饭吧。", "chī", "吃"), ("外边很___，多穿一件衣服。", "lěng", "冷"), ("我___了两个面包。", "mǎi", "买")],
 "b": [("我___你一本书。", "gěi", "给"), ("现在几___？", "diǎn", "点"), ("我___说汉语。", "huì", "会"), ("明天我___在家。", "bù", "不"), ("我坐___机去北京。", "fēi", "飞")],
}
for f in "ab":
    for n, (line, opts) in enumerate(H2L1[f], 1):
        H2.lc3(f, "l1", n, [("A" if n % 2 else "B", line)], SAY, opts[0], opts[1:], LF)
    for task, table in (("l2a", H2L2A), ("l2b", H2L2B)):
        pool, rows = table[f]
        H2.pool(f, task, rows, pool, MATCH_HEARD, LD, True)
    for n, (segs, q, key, wrong) in enumerate(H2L3[f], 1):
        H2.lc3(f, "l3", n, segs, q, key, wrong, LD, units=2)
    pool, rows = H2R1[f]
    H2.pool(f, "r1", rows, pool, MATCH_READ, RD, False)
    pool, rows = H2R2[f]
    H2.pool(f, "r2", rows, pool, GAP, EV, False)
    for task, table in (("r3a", H2R3A), ("r3b", H2R3B)):
        pool, rows = table[f]
        H2.pool(f, task, rows, pool, MATCH_REPLY, RT, False)
    for n, (blocks, q, key, wrong) in enumerate(H2R4[f], 1):
        H2.rc3(f, "r4", n, blocks, q, key, wrong, RT)
    pool, rows = H2W1[f]
    H2.component(f, rows, pool)
    H2.write_char(f, H2W2[f])


# =============================================================== the tracks
def T(vi):
    """Vietnamese track text; the Chinese names of the sections (听力, 阅读, 书写) are proper names and pass."""
    bare = vi
    for name in ("听力", "阅读", "书写"):
        bare = bare.replace(name, "")
    check_vi("track", bare)
    return {"vi": vi}


def task(tid, title, instr, fmt, n, **kw):
    t = {"id": tid, "title": T(title), "instruction": T(instr), "format": fmt}
    t.update(kw)
    t["itemsPerForm"] = n
    return t


PUBLISHER = "Center for Language Education and Cooperation (中外语言交流合作中心); Chinese Testing International (汉考国际, CTI)"
WHO = "Trung tâm Giao lưu Hợp tác Ngôn ngữ Trung – Ngoại (CLEC) ban hành và Công ty Khảo thí Hán ngữ Quốc tế (CTI) tổ chức"
SAMPLE = "https://hsk-sample-1409982902.cos.ap-beijing.myqcloud.com/HSK3.0.zip"
REFS = [
 {"url": "https://www.chinesetest.cn/news/51336883", "title": "HSK 3.0 will be officially launched worldwide on December 13, 2026! (announcement, published 2026-09-08)", "retrieved": "2026-11-04"},
 {"url": "https://www.chinesetest.cn/news/50278989", "title": "Chinese Test Dates in 2026 (HSK 1-6 sessions; the last before HSK 3.0 is 7 November)", "retrieved": "2026-11-04"},
 {"url": SAMPLE, "title": "HSK 3.0 sample package linked from chinesetest.cn ('Sample Questions'): HSK（一级）样卷 and HSK（二级）样卷 with answer keys — cover notes and part layout only", "retrieved": "2026-11-04"},
 {"url": "https://hsk.cn-bj.ufileos.com/3.0/%E6%96%B0%E7%89%88HSK%E8%80%83%E8%AF%95%E5%A4%A7%E7%BA%B21219.pdf", "title": "新版HSK考试大纲 (syllabus: 2025-11 published, 2026-07 in force; tasks, topics, words, characters, grammar)", "retrieved": "2026-11-04"},
 {"url": "https://www.chinesetest.cn/HSK/1", "title": "HSK (Level 1) test structure and score report of the current HSK (100 points a section, 120/200 to pass)", "retrieved": "2026-11-04"},
 {"url": "https://www.chinesetest.cn/HSK/2", "title": "HSK (Level 2) test structure and score report of the current HSK (100 points a section, 120/200 to pass)", "retrieved": "2026-11-04"},
]


def readiness(level, max_points, pass_points):
    who = "CLEC hay CTI"
    return {
     "bands": [
      {"id": "ready_estimate", "minGroupShare": 0.75, "label": T("Mức sẵn sàng ước tính: tốt"),
       "message": T(f"Ở lần làm thử này, tổng điểm cao hơn ngưỡng tham khảo {pass_points}/{max_points} một khoảng an toàn. Đây là mức sẵn sàng ước tính từ bài luyện của khoá học, không phải điểm HSK.")},
      {"id": "getting_close", "minGroupShare": 0.6, "label": T("Mức sẵn sàng ước tính: gần đạt"),
       "message": T(f"Tổng điểm đã chạm ngưỡng tham khảo {pass_points}/{max_points} nhưng chưa có khoảng an toàn. Hãy luyện thêm các phần yếu bên dưới.")},
      {"id": "not_yet", "minGroupShare": 0, "label": T("Mức sẵn sàng ước tính: cần luyện thêm"),
       "message": T("Tổng điểm còn dưới ngưỡng tham khảo. Hãy luyện các phần yếu bên dưới, rồi thử đề còn lại.")}],
     "incomplete": T(f"Chưa đủ dữ liệu để ước tính: hãy làm đủ các phần thi của HSK {level}. Các phần đã làm vẫn được tính điểm."),
     "disclaimer": T(f"Mức sẵn sàng ước tính dựa trên bài luyện của khoá học: không phải kỳ thi chính thức, không do {who} cấp, và không dự đoán kết quả thi thật. "
                     f"Các tài liệu khoá học đã đọc chưa công bố thang điểm và điểm đạt của HSK 3.0; ngưỡng {pass_points}/{max_points} là ngưỡng tham khảo của khoá học, lấy theo quy định đang công bố của HSK hiện hành. "
                     f"Cấp HSK không phải một bậc của khung CEFR, và HSK {level} không tương ứng với một bậc CEFR nào."),
    }


H1_NOT = "Những điều các tài liệu chính thức đã đọc chưa công bố cho HSK 3.0 do khoá học chọn: thang điểm (ở đây mỗi phần thi 100 điểm, mỗi câu trong phần bằng điểm nhau), ngưỡng tham khảo"
SHOWN = "Ở đây câu hỏi hiện bằng tiếng Việt; trong đề thật câu hỏi được đọc bằng tiếng Trung."
PICTURE = "Tranh ở đây là biểu tượng kèm chữ tiếng Việt; đề thật dùng tranh vẽ."
POOL_NOTE = "Trong đề thật nhóm câu này có năm lựa chọn cho năm câu; công cụ của khoá học cần một lựa chọn thừa nên có sáu."


def track(slug, level, name, description, note, sections, max_points, pass_points, items):
    return {
     "id": f"zh.exam.{slug}", "trackVersion": 1, "name": name, "level": f"HSK {level}", "formatFidelity": "partial",
     "title": T(f"Luyện đề {name} (theo đề mẫu HSK 3.0 chính thức)"),
     "description": T(description),
     "formatSource": {"publisher": PUBLISHER, "references": REFS, "checkedAgainstOfficialGuide": True, "checkedBy": "coding agent (owner-delegated)", "checkedAt": "2026-11-04", "note": T(note)},
     "sections": sections,
     "passRule": {"total": {"title": T(f"Ngưỡng tham khảo của khoá học: tổng điểm tối thiểu {pass_points}/{max_points} (HSK 3.0 chưa công bố điểm đạt)"), "min": pass_points}, "everySectionTaken": True},
     "scoring": {"perItem": "share_of_section_points", "negativeMarking": False},
     "readiness": readiness(level, max_points, pass_points),
     "items": items,
     "forms": [{"formId": f, "itemIds": [i["id"] for i in items if i["id"].split(".")[-1].startswith(f + "_")]} for f in "ab"],
    }


COMMON_NOTE = ("Cấu trúc (các phần thi, số câu, thời gian, dạng câu hỏi của từng phần) được đối chiếu ngày 2026-11-04 với đề mẫu chính thức HSK 3.0 do chinesetest.cn dẫn tới "
               "và thông báo HSK 3.0 bắt đầu từ kỳ thi ngày 13/12/2026. Chỉ đọc phần chú ý ở bìa và bố cục các phần của đề mẫu, không chép câu hỏi nào. "
               "Thang điểm, điểm đạt và số lần nghe của HSK 3.0 không có trong các tài liệu đã đọc: khoá học dùng 100 điểm mỗi phần, ngưỡng tham khảo 60 % tổng điểm "
               "(quy định đang công bố của HSK hiện hành) và cho nghe hai lần.")
h1 = track("hsk_1", 1, "HSK 1",
 f"Luyện theo cấu trúc của HSK 1 bản mới (HSK 3.0), kỳ thi Hán ngữ do {WHO}, áp dụng từ kỳ thi ngày 13/12/2026. "
 "Theo đề mẫu chính thức: hai phần thi, 40 câu — Nghe 20 câu (khoảng 12 phút) và Đọc 20 câu (20 phút), mỗi phần thi có bốn dạng, mỗi dạng năm câu. "
 "Mọi câu hỏi đều do khoá học tự soạn, không lấy từ đề thi hay đề mẫu. "
 f"{H1_NOT} 120/200 (theo quy định đang công bố của HSK 1 hiện hành) và số lần nghe (ở đây hai lần). "
 "Phần Nghe được điều chỉnh: tranh là biểu tượng kèm chữ tiếng Việt, câu hỏi hiện bằng tiếng Việt, các lựa chọn được in ra. Pinyin hiện dưới chữ Hán như trên đề mẫu. "
 "Từ vựng thuộc cấp 1 của chuẩn HSK 3.0. HSK 1 không phải một bậc của khung CEFR, và đây không phải kỳ thi chính thức.",
 COMMON_NOTE,
 [{"id": "tingli", "skill": "listening", "title": T("听力 — Nghe hiểu"), "minutes": 12, "maxPoints": 100, "playsPerRecording": 2, "tasks": [
    task("l1", "Phần 1 — Nghe, chọn tranh", f"Nghe một câu, chọn tranh đúng trong ba tranh. {PICTURE}", "pictureMcq", 5),
    task("l2", "Phần 2 — Nghe câu hỏi, chọn câu trả lời", "Nghe một câu hỏi, chọn câu trả lời đúng trong ba câu in sẵn.", "mcq3", 5),
    task("l3", "Phần 3 — Nghe hội thoại, ghép tranh", f"Nghe mỗi hội thoại ngắn, chọn tranh phù hợp trong sáu tranh dùng chung (một tranh thừa; trong đề thật đó là tranh của câu ví dụ). {PICTURE}", "matchToPool", 5, poolSize=6),
    task("l4", "Phần 4 — Nghe và trả lời", f"Nghe một câu nói, chọn câu trả lời đúng trong ba lựa chọn in sẵn. {SHOWN}", "mcq3", 5)]},
  {"id": "yuedu", "skill": "reading", "title": T("阅读 — Đọc hiểu"), "minutes": 20, "maxPoints": 100, "tasks": [
    task("r1", "Phần 1 — Đọc câu, ghép tranh", f"Đọc mỗi câu, chọn tranh phù hợp trong sáu tranh dùng chung (một tranh thừa). {PICTURE}", "matchToPool", 5, poolSize=6),
    task("r2", "Phần 2 — Ghép câu hỏi với câu trả lời", "Đọc mỗi câu hỏi, chọn câu trả lời phù hợp trong sáu câu dùng chung (một câu thừa).", "matchToPool", 5, poolSize=6),
    task("r3", "Phần 3 — Chọn từ điền chỗ trống", "Chọn từ thích hợp cho chỗ trống （　） trong sáu từ dùng chung (một từ thừa).", "completeFromPool", 5, poolSize=6),
    task("r4", "Phần 4 — Đọc và trả lời câu hỏi ★", "Đọc câu văn và câu hỏi có dấu ★, chọn câu trả lời đúng. Câu hỏi cũng hiện bằng tiếng Việt.", "mcq3", 5)]}],
 200, 120, H1.items)

h2 = track("hsk_2", 2, "HSK 2",
 f"Luyện theo cấu trúc của HSK 2 bản mới (HSK 3.0), kỳ thi Hán ngữ do {WHO}, áp dụng từ kỳ thi ngày 13/12/2026. "
 "Theo đề mẫu chính thức: ba phần thi, 60 câu — Nghe 25 câu (khoảng 17 phút), Đọc 25 câu (25 phút) và Viết chữ Hán 10 câu (10 phút). "
 "Mọi câu hỏi đều do khoá học tự soạn, không lấy từ đề thi hay đề mẫu. "
 f"{H1_NOT} 180/300 (60 % tổng điểm, như quy định đang công bố của HSK 2 hiện hành, vốn chỉ có hai phần thi) và số lần nghe (ở đây hai lần). "
 "Phần Nghe được điều chỉnh: tranh là biểu tượng kèm chữ tiếng Việt, câu hỏi hiện bằng tiếng Việt, các lựa chọn được in ra. "
 "Trong hai nhóm ghép câu thứ hai, đề thật có năm lựa chọn cho năm câu; ở đây có sáu. "
 "Phần Viết chữ Hán: chọn bộ phận còn thiếu của một chữ (đề thật in chữ thiếu nét, ở đây chữ được mô tả bằng phần còn lại), và gõ chữ Hán bằng bàn phím pinyin thay cho viết tay. "
 "Từ vựng thuộc cấp 1–2 của chuẩn HSK 3.0. HSK 2 không phải một bậc của khung CEFR, và đây không phải kỳ thi chính thức.",
 COMMON_NOTE,
 [{"id": "tingli", "skill": "listening", "title": T("听力 — Nghe hiểu"), "minutes": 17, "maxPoints": 100, "playsPerRecording": 2, "tasks": [
    task("l1", "Phần 1 — Nghe, chọn tranh", f"Nghe một câu, chọn tranh đúng trong ba tranh. {PICTURE}", "pictureMcq", 5),
    task("l2a", "Phần 2 (nhóm 1) — Nghe hội thoại, ghép tranh", f"Nghe mỗi hội thoại ngắn, chọn tranh phù hợp trong sáu tranh dùng chung (một tranh thừa). {PICTURE}", "matchToPool", 5, poolSize=6),
    task("l2b", "Phần 2 (nhóm 2) — Nghe hội thoại, ghép tranh", f"Nghe mỗi hội thoại ngắn, chọn tranh phù hợp trong sáu tranh dùng chung. {POOL_NOTE}", "matchToPool", 5, poolSize=6),
    task("l3", "Phần 3 — Nghe hội thoại, trả lời câu hỏi", f"Nghe một hội thoại ngắn, chọn câu trả lời đúng trong ba lựa chọn in sẵn. {SHOWN}", "mcq3", 10)]},
  {"id": "yuedu", "skill": "reading", "title": T("阅读 — Đọc hiểu"), "minutes": 25, "maxPoints": 100, "tasks": [
    task("r1", "Phần 1 — Đọc câu, ghép tranh", f"Đọc mỗi câu, chọn tranh phù hợp trong sáu tranh dùng chung (một tranh thừa). {PICTURE}", "matchToPool", 5, poolSize=6),
    task("r2", "Phần 2 — Chọn từ điền chỗ trống", "Chọn từ thích hợp cho chỗ trống （　） trong sáu từ dùng chung (một từ thừa).", "completeFromPool", 5, poolSize=6),
    task("r3a", "Phần 3 (nhóm 1) — Ghép câu với câu đáp", "Đọc mỗi câu, chọn câu đáp phù hợp trong sáu câu dùng chung (một câu thừa).", "matchToPool", 5, poolSize=6),
    task("r3b", "Phần 3 (nhóm 2) — Ghép câu với câu đáp", f"Đọc mỗi câu, chọn câu đáp phù hợp trong sáu câu dùng chung. {POOL_NOTE}", "matchToPool", 5, poolSize=6),
    task("r4", "Phần 4 — Đọc và trả lời câu hỏi ★", "Đọc đoạn văn ngắn và câu hỏi có dấu ★, chọn câu trả lời đúng. Câu hỏi cũng hiện bằng tiếng Việt.", "mcq3", 5)]},
  {"id": "shuxie", "skill": "structures", "title": T("书写 — Viết chữ Hán"), "minutes": 10, "maxPoints": 100, "tasks": [
    task("w1", "Phần 1 — Chọn bộ phận của chữ", "Chọn bộ phận bên trái còn thiếu của một chữ trong từ đã cho, trong sáu bộ phận dùng chung (một bộ phận thừa). Đề thật in chữ thiếu nét; ở đây chữ đó được thay bằng ？ và phần còn lại được nêu ra. Không hiện pinyin dưới các lựa chọn.", "cloze", 5),
    task("w2", "Phần 2 — Viết chữ theo pinyin", "Gõ chữ Hán có cách đọc đã cho vào chỗ trống, bằng bàn phím pinyin. Đề thật yêu cầu viết tay.", "formCompletion", 5)]}],
 300, 180, H2.items)

for t, pools in ((h1, {}), (h2, {})):
    per = Counter((i["sectionId"], i["taskId"]) for i in t["items"])
    for s in t["sections"]:
        for k in s["tasks"]:
            if per[(s["id"], k["id"])] != 2 * k["itemsPerForm"]:
                PROBLEMS.append(f"{t['id']} {s['id']}/{k['id']}: {per[(s['id'], k['id'])]} items, two forms need {2 * k['itemsPerForm']}")
    for i in t["items"]:
        n, fmt = len(i["exercise"].get("options", [])), next(k["format"] for s in t["sections"] for k in s["tasks"] if k["id"] == i["taskId"])
        want = {"pictureMcq": 3, "mcq3": 3, "matchToPool": 6, "completeFromPool": 6, "cloze": 6, "formCompletion": 0}[fmt]
        if n != want:
            PROBLEMS.append(f"{i['id']}: {n} options, the task needs {want}")
# No stimulus text repeats anywhere in the two tracks, and no item without a stimulus repeats another's payload.
seen = {}
for s in clips + readings:
    body = "".join(x["text"] for x in s.get("segments") or s.get("blocks"))
    if body in seen:
        PROBLEMS.append(f"{s['id']}: the same text as {seen[body]}")
    seen[body] = s["id"]
for i in h1["items"] + h2["items"]:
    e = i["exercise"]
    if "clipId" not in e and "readingId" not in e:
        sig = json.dumps({k: v for k, v in e.items() if k != "id"}, ensure_ascii=False, sort_keys=True)
        if sig in seen:
            PROBLEMS.append(f"{i['id']}: repeats {seen[sig]}")
        seen[sig] = i["id"]
tracks += [h1, h2]

write_jsonl(f"{DRAFTS}/listening/OUTPUT.jsonl", clips, "a")
write_jsonl(f"{DRAFTS}/readings/OUTPUT.jsonl", readings, "a")
write_jsonl(f"{DRAFTS}/exam/OUTPUT.jsonl", tracks)
report()
print("HSK 1:", len(h1["items"]), "items,", "HSK 2:", len(h2["items"]), "items;", len(clips), "clips,", len(readings), "readings;",
      dict(sorted(Counter(f"{t['name']}/{i['taskId']}" for t in tracks for i in t["items"]).items())))

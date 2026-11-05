"""Chinese text analysis shared by the zh-vi lesson and concept generators and the self-check (zh-check-answers.py),
after ja_text.py.

It simulates what the app shows over a Chinese string: RubyText lays pinyin under the hanzi of the longest stored
surface, left to right (src/lib/learning/script-reading.ts annotateText), from the course lexicon. A hanzi no stored
surface covers shows no pinyin, so the checks a generator runs on every Chinese string are:
 - every hanzi is covered by a lexicon surface (no character without a reading);
 - a homograph is used only in the reading the lexicon stores (只 zhī the measure word, never zhǐ "only"; 得 de, never
   děi; 长 cháng, never zhǎng outside 长大; 还 hái, never huán; 了 le, never liǎo), and 中 / 地 only inside a compound;
 - no Latin letters (pinyin is never target text in an exercise; the app shows it under the hanzi).

Answer keys (D-10 patterns of ja-vi, REVIEW-AI.md): a typed answer lists every rendering a learner may fairly type —
numbers before a measure word in digits and in hanzi (3个 ⇄ 三个, 2个 ⇄ 两个, 15块 ⇄ 十五块), the time word before or
after the subject (我明天上班 ⇄ 明天我上班), 这儿/这里, 那儿/那里, 哪儿/哪里, 一点儿/一点, 有点儿/有点, 星期天/星期日,
and the subject 我 when the Vietnamese prompt states "Tôi" (or without it when the prompt drops it). The app folds
traditional characters and punctuation itself (src/lib/languages/zh.ts), and accepts pinyin as practice only (P4b
guard), so neither is listed.
"""
import json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")
HAN = re.compile(r"[㐀-䶿一-鿿〇]")
LATIN = re.compile(r"[A-Za-zÀ-ɏḀ-ỿＡ-Ｚａ-ｚ]")
DIGIT = re.compile(r"[0-9０-９]")
PUNCT = re.compile(r"[。，、！？；：“”‘’（）《》…\s.,!?;:\"'()]")


def load_lexicon(root):
    return json.load(open(f"{root}/content/zh/lexicon/lexemes.json", encoding="utf-8"))["lexemes"]


def bare(text):
    """An answer without punctuation and spaces: the graders compare so (zh.ts normalizeLenientAlternate)."""
    return PUNCT.sub("", text)


# ---------------------------------------------------------------- homographs: the reading the lexicon stores, nothing else
# 只 is stored zhī (the measure word): it must follow a number, 这/那/哪/几/每 or a measure context; 只是 / 只有 (zhǐ) are
# not lexemes, so they would read zhī. 得 is stored de: after a verb before an adjective phrase (说得很好), never děi
# (我得走了). 长 is stored cháng (long). 还 is stored hái. 了 is stored le.
_ZHI_OK = re.compile(r"(?:[0-9一二三四五六七八九十两几这那哪每])只")
_DEI = re.compile(r"(?:我|你|他|她|我们|你们|他们)得(?!很|太|非常|不|好|快|慢)")
_HUAN = re.compile(r"还(?:书|钱|给你|给我|回)")
_ZHANG = re.compile(r"长(?:得|了|高)")
COMPOUND_ONLY = "中地"


class Index:
    """The reading index of the course: every lexicon surface with its stored pinyin (one reading per surface)."""

    def __init__(self, lexemes):
        self.by = {}
        self.proper = set()
        for x in lexemes:
            py = x.get("reading", {}).get("pinyin")
            if py and x["surface"] not in self.by:
                self.by[x["surface"]] = py
            if x.get("proper"):
                self.proper.add(x["surface"])
        self.max = max(len(k) for k in self.by)

    def tokens(self, text):
        """Longest-match tokens (annotateText): (text, pinyin or None)."""
        out, i = [], 0
        while i < len(text):
            for n in range(min(self.max, len(text) - i), 0, -1):
                w = text[i:i + n]
                if w in self.by:
                    out.append((w, self.by[w]))
                    i += n
                    break
            else:
                out.append((text[i], None))
                i += 1
        return out

    def words(self, text):
        return [t for t, py in self.tokens(text) if py is not None]

    def pinyin(self, text):
        return " ".join(py if py else t for t, py in self.tokens(text) if not PUNCT.fullmatch(t))

    def _zhang(self, text):
        """长 read zhǎng (长得, 长了, 长高): only a 长 that is a word of its own. Inside a longer lexeme (组长, 厂长, 校长, 家长)
        it is that word's syllable, so 组长了 is no finding (the false positive of session 5)."""
        toks = self.tokens(text)
        for i, (t, _) in enumerate(toks):
            if t == "长" and i + 1 < len(toks) and toks[i + 1][0][:1] in ("得", "了", "高"):
                return True
        return False

    def problems(self, text):
        found = []
        for t, py in self.tokens(text):
            if py is None and HAN.search(t):
                found.append(f"hanzi {t} has no reading (not inside a lexicon surface) in {text!r}")
            if py is not None and t in COMPOUND_ONLY:
                found.append(f"{t} alone in {text!r}: it is taught in compounds only")
        if "只" in text and text not in self.by and not _ZHI_OK.search(text):
            found.append(f"只 in {text!r} is not the measure word zhī (the lexicon stores no zhǐ)")
        if _DEI.search(text):
            found.append(f"得 in {text!r} reads děi; the lexicon stores de")
        if _HUAN.search(text):
            found.append(f"还 in {text!r} reads huán; the lexicon stores hái")
        if self._zhang(text):
            found.append(f"长 in {text!r} reads zhǎng; the lexicon stores cháng")
        if LATIN.search(text):
            found.append(f"Latin letters in {text!r}")
        return found


# ---------------------------------------------------------------- measure words
MEASURE_WORDS = ["个", "本", "杯", "只", "件", "张", "口", "次", "块", "斤", "双", "瓶", "碗", "条", "层", "份", "辆", "遍", "位",
                 "种", "节", "句", "页", "支", "门", "公斤", "公里", "分钟", "毛", "元", "岁", "点", "刻", "度"]
# Nouns that count without a measure word (they are units themselves).
COUNTER_NOUNS = ["天", "年", "星期", "小时", "周", "号", "日", "月", "分", "人"]
# The measure words a noun takes that a native speaker accepts (a fill-in may offer no other option of this set).
NOUN_MEASURES = {
    "人": {"个", "位", "口"}, "先生": {"个", "位"}, "朋友": {"个", "位"}, "老师": {"个", "位"}, "客人": {"个", "位"}, "同事": {"个", "位"},
    "工人": {"个", "位"}, "学生": {"个", "位"}, "医生": {"个", "位"}, "孩子": {"个"}, "妹妹": {"个"}, "弟弟": {"个"},
    "哥哥": {"个"}, "姐姐": {"个"}, "儿子": {"个"}, "女儿": {"个"}, "经理": {"个", "位"}, "服务员": {"个", "位"},
    "书": {"本"}, "课本": {"本"}, "词典": {"本"}, "笔记本": {"本"},
    "茶": {"杯", "瓶"}, "咖啡": {"杯"}, "水": {"杯", "瓶"}, "牛奶": {"杯", "瓶"}, "果汁": {"杯", "瓶"}, "酒": {"杯", "瓶"},
    "猫": {"只"}, "狗": {"只", "条"}, "鸟": {"只"}, "鸡": {"只"}, "鱼": {"条"}, "马": {"匹"}, "牛": {"头"},
    "衣服": {"件"}, "事": {"件"}, "事情": {"件"},
    "票": {"张"}, "车票": {"张"}, "机票": {"张"}, "门票": {"张"}, "纸": {"张"}, "桌子": {"张"}, "床": {"张"}, "照片": {"张"},
    "卡": {"张"}, "银行卡": {"张"}, "表": {"张"},
    "苹果": {"个", "斤"}, "包子": {"个"}, "鸡蛋": {"个"}, "杯子": {"个"}, "箱子": {"个"}, "手机": {"个", "部"}, "问题": {"个"},
    "房间": {"个", "间"}, "椅子": {"把", "个"}, "面包": {"个", "块"}, "钱包": {"个"}, "包": {"个"}, "字": {"个"}, "词": {"个"},
    "国家": {"个"}, "城市": {"个"}, "公司": {"个", "家"}, "工厂": {"个", "家"}, "商店": {"个", "家"}, "超市": {"个", "家"},
    "银行": {"个", "家"}, "医院": {"个", "家"}, "饭馆": {"个", "家"}, "办法": {"个"}, "地方": {"个"},
    "路": {"条"}, "河": {"条"}, "裤子": {"条"},
    "鞋": {"双"}, "筷子": {"双"}, "手套": {"双"},
    "面条": {"碗"}, "米饭": {"碗"}, "饭": {"碗"},
    "车": {"辆"}, "汽车": {"辆"}, "自行车": {"辆"}, "出租车": {"辆"}, "公交车": {"辆"},
    "楼": {"层"}, "药": {"种"}, "菜": {"个", "种", "份"}, "帽子": {"顶", "个"}, "安全帽": {"顶", "个"}, "电脑": {"台", "个"},
    "机器": {"台", "个"}, "电视": {"台", "个"}, "句子": {"个"}, "课": {"节"}, "歌": {"首"}, "电影": {"部", "个"},
}


# ---------------------------------------------------------------- numbers
HAN_DIGITS = "零一二三四五六七八九"
_HAN_NUM = re.compile(r"[零一二三四五六七八九十百千万两]+")
_DIGITS = re.compile(r"[0-9]+")
# A hanzi numeral that is part of a word, not a number (一起 together, 一定, 一下, 一点儿 'a bit', 第一 ordinal…).
_NOT_A_NUMBER = ("一起", "一定", "一下", "一点儿", "一些", "一共", "一直", "一样", "一般", "一会儿", "一半", "一路", "星期",
                 "万一", "一切")


def chinese_number(n, before_measure=False):
    """1-99999 in hanzi; 2 is 两 before a measure word, and 两 also leads 百/千/万 there (两百 is the spoken form)."""
    if n == 2 and before_measure:
        return "两"
    if n < 10:
        return HAN_DIGITS[n]
    if n < 20:
        return "十" + (HAN_DIGITS[n % 10] if n % 10 else "")
    if n < 100:
        return HAN_DIGITS[n // 10] + "十" + (HAN_DIGITS[n % 10] if n % 10 else "")
    out, rest, zero = "", n, False
    for value, sign in ((10000, "万"), (1000, "千"), (100, "百"), (10, "十")):
        d = rest // value
        rest %= value
        if d:
            if zero:
                out += "零"
                zero = False
            out += ("两" if d == 2 and before_measure and value >= 100 and not out else HAN_DIGITS[d]) + sign
        elif out:
            zero = True
    if rest:
        out += ("零" if zero else "") + HAN_DIGITS[rest]
    return out


def number_of_hanzi(s):
    if s in ("两",):
        return 2
    total, part, digit = 0, 0, None
    for ch in s:
        if ch in HAN_DIGITS:
            digit = HAN_DIGITS.index(ch)
        elif ch == "两":
            digit = 2
        elif ch in "十百千":
            part += (digit if digit is not None else 1) * {"十": 10, "百": 100, "千": 1000}[ch]
            digit = None
        elif ch == "万":
            total += (part + (digit or 0) or 1) * 10000
            part, digit = 0, None
        else:
            return None
    return total + part + (digit or 0)


COUNTED = tuple(sorted(MEASURE_WORDS + COUNTER_NOUNS + ["点半"], key=len, reverse=True))
_BIT_BEFORE = ("便宜", "快", "慢", "大", "小", "多", "少", "贵", "早", "晚", "好", "高", "低", "近", "远", "长", "轻", "重")


def numeral_spellings(text):
    """The other spellings of every number before a measure word or unit noun: 3个 ⇄ 三个, 2个 ⇄ 两个, 15块 ⇄ 十五块."""
    out = []
    for m in _DIGITS.finditer(text):
        rest = text[m.end():]
        if rest.startswith(COUNTED) and not text[:m.start()].endswith(("第",)):
            n = int(m.group())
            if 0 < n < 100000:
                before = rest.startswith(tuple(MEASURE_WORDS)) or rest.startswith("点")
                out.append(text[:m.start()] + chinese_number(n, before_measure=before) + rest)
    for m in _HAN_NUM.finditer(text):
        rest = text[m.end():]
        head = text[m.start():]
        if not rest.startswith(COUNTED) or head.startswith(_NOT_A_NUMBER) or text[:m.start()].endswith(("第", "星期")):
            continue
        if m.group() == "一" and rest.startswith("点") and not re.match(r"点(?:半|钟|[零一二三四五六七八九十0-9]|$|[。，？！])", rest):
            continue  # 便宜一点吧: "a bit", not one o'clock
        if m.group() == "一" and rest.startswith("点") and text[:m.start()].endswith(_BIT_BEFORE):
            continue  # 便宜一点 at the end: "a bit" after an adjective, not one o'clock
        n = number_of_hanzi(m.group())
        if n:
            out.append(text[:m.start()] + str(n) + rest)
    return out


NATURAL_PAIRS = [("这儿", "这里"), ("那儿", "那里"), ("哪儿", "哪里"), ("一点儿", "一点"), ("有点儿", "有点"), ("星期天", "星期日")]


def _natural_step(text):
    out = []
    for a, b in NATURAL_PAIRS:
        if a in text:
            out.append(text.replace(a, b))
        if b in text and a not in text and b != "一点":
            # 一点 alone may be one o'clock, so it never grows a 儿
            out.append(text.replace(b, a))
    return out


TIMES = sorted(["今天", "明天", "昨天", "现在", "每天", "早上", "晚上", "上午", "下午", "中午", "周末", "今年", "明年", "去年",
                "后天", "前天", "以后", "刚才", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期天", "下次",
                "上次", "一会儿", "周一", "周二", "周三", "周四", "周五", "周六", "周日"], key=len, reverse=True)
SUBJECTS = ("我们", "你们", "他们", "我", "你", "他", "她", "您")
_SUBJ_TIME = re.compile(rf"^({'|'.join(SUBJECTS)})((?:{'|'.join(TIMES)})+)(.+)$")
_TIME_SUBJ = re.compile(rf"^((?:{'|'.join(TIMES)})+)，?({'|'.join(SUBJECTS)})(.+)$")


def topic_spellings(text):
    """The time word before or after the subject: 我明天上班 ⇄ 明天我上班 (both are standard)."""
    m = _SUBJ_TIME.match(text)
    if m and not m.group(3).startswith(("的", "是")):
        return [m.group(2) + m.group(1) + m.group(3)]
    m = _TIME_SUBJ.match(text)
    if m:
        return [m.group(2) + m.group(1) + m.group(3)]
    return []


def natural_spellings(text):
    out, todo = [], [text]
    while todo:
        cur = todo.pop(0)
        for x in _natural_step(cur) + topic_spellings(cur):
            if x != text and x not in out:
                out.append(x)
                todo.append(x)
    return out


# ---------------------------------------------------------------- word variants (D-10 review of zh-vi, 2026-11-05)
# Other words or word orders a native speaker says for the same answer. Typed answers, spoken answers, writing slots and
# scenario replies list them (widen, zh_layers.spoken_variants, zh-writing-s5 _widen); a dictation does not, since it
# transcribes what the clip says. zh-check-answers.py rule 10 flags an answer that leaves one out.
_PRICE_UNIT = r"(?:块钱|块|元)"
_NUM = r"[零一二三四五六七八九十百千万两0-9]+"
_PRICE_MEASURES = "碗杯斤瓶个张本件双份盒包"
_PRICE_AFTER = re.compile(rf"一([{_PRICE_MEASURES}])({_NUM}){_PRICE_UNIT}")
_PRICE_BEFORE = re.compile(rf"({_NUM})({_PRICE_UNIT})一([{_PRICE_MEASURES}])")
_DATE_HAO = re.compile(rf"(月{_NUM})号")
_MEI_STOP = set("了吗呢啊吧") | set("。，！？；：、")
TYPED_PAIRS = [("疼", "痛")]


def price_spellings(text):
    """The price per unit in both orders, with and without 钱: 一碗十八块 ⇄ 十八块一碗 ⇄ 十八块钱一碗 (苹果五块钱一斤 is the
    order the lessons teach; 一斤五块 is as common)."""
    out = []
    for m in _PRICE_AFTER.finditer(text):
        unit = m.group(0)[1 + 1 + len(m.group(2)):]
        for u in ([unit] + (["块钱"] if unit == "块" else ["块"] if unit == "块钱" else [])):
            out.append(text[:m.start()] + m.group(2) + u + "一" + m.group(1) + text[m.end():])
    for m in _PRICE_BEFORE.finditer(text):
        out.append(text[:m.start()] + "一" + m.group(3) + m.group(1) + m.group(2) + text[m.end():])
        other = {"块": "块钱", "块钱": "块"}.get(m.group(2))
        if other:
            out.append(text[:m.start()] + m.group(1) + other + "一" + m.group(3) + text[m.end():])
    return out


def mei_spellings(text, index):
    """没 and 没有 before a verb or a noun are one negation (我没去 ⇄ 我没有去, 我没有妹妹 ⇄ 我没妹妹); 没有 that ends a clause
    (还没有。) keeps its 有, and the idioms are lexemes of their own (没关系, 没问题)."""
    toks = [t for t, _ in index.tokens(text)]
    out = []
    for i, t in enumerate(toks):
        nxt = toks[i + 1] if i + 1 < len(toks) else ""
        prev = toks[i - 1] if i > 0 else ""
        # an A没A question (有没有, 去没去) keeps its shape
        if t == "没" and nxt and nxt[0] not in _MEI_STOP and not nxt.startswith("有") and prev != nxt:
            out.append("".join(toks[:i]) + "没有" + "".join(toks[i + 1:]))
        if t == "没有" and nxt and nxt[0] not in _MEI_STOP and prev != "有":
            out.append("".join(toks[:i]) + "没" + "".join(toks[i + 1:]))
    return out


def bit_spellings(text, index, pos):
    """An adjective + 一点儿 / 一点 also drops the 一: 便宜一点儿吧 ⇄ 便宜点儿吧 ⇄ 便宜点吧 (the commonest spoken form)."""
    toks = [t for t, _ in index.tokens(text)]
    out = []
    for i, t in enumerate(toks[:-1]):
        if pos.get(t) == "adjective" and toks[i + 1] in ("一点儿", "一点"):
            short = toks[i + 1][1:]
            for s in (short, "点" if short == "点儿" else "点儿"):
                out.append("".join(toks[:i + 1]) + s + "".join(toks[i + 2:]))
    return out


PERSON_NOUNS = {"工人", "学生", "大学生", "老师", "医生", "护士", "司机", "经理", "越南人", "中国人"}
# A job or a role also counts with 名 (我是一名工人, the written and formal measure word); a nationality does not.
ROLE_NOUNS = PERSON_NOUNS - {"越南人", "中国人"}


def one_spellings(text, index):
    """是 + a person noun also takes 一个 (我是工人 ⇄ 我是一个工人: a learner says both), and a job 一名 (pass 2:
    我也是一名工人, which uo-l3-e0 accepted and ua-l3-e7 did not)."""
    toks = [t for t, _ in index.tokens(text)]
    out = []
    for i, t in enumerate(toks[:-1]):
        if t == "是" and toks[i + 1] in PERSON_NOUNS:
            out.append("".join(toks[:i + 1]) + "一个" + "".join(toks[i + 1:]))
            if toks[i + 1] in ROLE_NOUNS:
                out.append("".join(toks[:i + 1]) + "一名" + "".join(toks[i + 1:]))
    return out


def dou_spellings(text, index, pos):
    """每天 + a verb phrase also takes 都 (我每天洗澡 ⇄ 我每天都洗澡, 每天我在工厂工作 ⇄ 每天我都在工厂工作: 每天 … 都 is the
    collocation most learners are taught; answer-key pass 2)."""
    toks = [t for t, _ in index.tokens(text)]
    out = []
    for i, t in enumerate(toks):
        if t != "每天":
            continue
        j = i + 1
        if j < len(toks) and toks[j] in SUBJECTS:
            j += 1
        if j < len(toks) and toks[j] != "都" and (pos.get(toks[j]) == "verb" or toks[j] in ("在", "去", "来")):
            out.append("".join(toks[:j]) + "都" + "".join(toks[j:]))
    return out


_AGE_END = re.compile(r"岁(?=$|[。，！？])")


def age_spellings(text):
    """An age at the end of a clause also takes 了 (我今年二十岁 ⇄ 我今年二十岁了: 今年 … 岁了 is how one states one's age)."""
    return [_AGE_END.sub("岁了", text, count=1)] if _AGE_END.search(text) and "岁了" not in text else []


# A weekday: 星期一 ⇄ 周一 (everyday spoken and written Chinese); 星期天 / 星期日 ⇄ 周日. Not 周末, not 一周 (a week).
_XINGQI = re.compile(r"星期([一二三四五六天日])")
_ZHOU = re.compile(r"(?<![一二三四五六七八九十两几每这上下])周([一二三四五六日])")


def week_spellings(text):
    out = []
    if _XINGQI.search(text):
        out.append(_XINGQI.sub(lambda m: "周" + ("日" if m.group(1) in "天日" else m.group(1)), text))
    if _ZHOU.search(text):
        out.append(_ZHOU.sub(lambda m: "星期" + ("天" if m.group(1) == "日" else m.group(1)), text))
    return out


INTENSIFIERS = ("很", "非常")


def tebie_spellings(text, index, pos):
    """很 / 非常 before a verb or an adjective also take 特别 (我很喜欢唱歌 ⇄ 我特别喜欢唱歌: 特别 is a course word and the
    learner's "… lắm"; independent audit, 2026-11-05, P1 on zh.speak.l_like). Not in a clause with 比 (no degree word
    after 比), and not 很多 / 很少 before a noun (很多人, never 特别多人)."""
    out = []
    for clause in _clauses(text):
        if "比" in clause:
            continue
        toks = [t for t, _ in index.tokens(clause)]
        for i, t in enumerate(toks[:-1]):
            nxt = toks[i + 1]
            if t not in INTENSIFIERS or pos.get(nxt) not in ("adjective", "verb"):
                continue
            if nxt in ("多", "少") and i + 2 < len(toks) and toks[i + 2] not in _FINAL:
                continue
            out.append(text.replace(clause, "".join(toks[:i]) + "特别" + "".join(toks[i + 1:]), 1))
    return out


GEI_VERBS = ("发", "打", "打电话", "寄", "送", "写", "传")
_FINAL = ("吧", "了", "吗", "呢", "啊", "。", "！", "？")


def order_variants(toks, swap_time=True):
    """Word orders of one token (or word-bank tile) list that say the same thing:
     - the time word before or after the subject (我 昨天 去了 ⇄ 昨天 我 去了; strings get it from topic_spellings);
     - 给 + person before the verb or after its object (给 我 发 照片 吧 ⇄ 发 照片 给 我 吧; 给 妈妈 打电话 ⇄ 打电话 给 妈妈),
       for the verbs of sending and calling only (给我试一下 has no such order);
     - 住在 + place or 在 + place + 住 at the end (我 住 在 河内 ⇄ 我 在 河内 住)."""
    out = []
    n = len(toks)
    end = n
    while end > 0 and toks[end - 1] in _FINAL:
        end -= 1
    tail = list(toks[end:])
    if swap_time and n >= 3:
        if toks[0] in SUBJECTS and toks[1] in TIMES and toks[2] not in ("的", "是"):
            k = 1
            while k < n and toks[k] in TIMES:
                k += 1
            out.append(list(toks[1:k]) + [toks[0]] + list(toks[k:]))
        if toks[0] in TIMES:
            k = 0
            while k < n and toks[k] in TIMES:
                k += 1
            if k < n - 1 and toks[k] in SUBJECTS:
                out.append([toks[k]] + list(toks[:k]) + list(toks[k + 1:]))
    for i in range(end - 2):
        # 给 P V O… (to the end) → V O… 给 P; P is one token or a pronoun + a noun (给我妈妈打电话, answer-key pass 2)
        for size in (1, 2):
            v = i + 1 + size
            if size == 2 and toks[i + 1] not in SUBJECTS:
                continue
            if v < end and toks[i] == "给" and toks[v] in GEI_VERBS and (end - (v + 1) >= 1 or toks[v] == "打电话"):
                out.append(list(toks[:i]) + list(toks[v:end]) + ["给"] + list(toks[i + 1:v]) + tail)
    for i in range(end):
        # V O… 给 P (at the end) → 给 P V O…; P as above
        done = False
        for size in (1, 2):
            g = end - 1 - size
            if size == 2 and (g + 1 >= end or toks[g + 1] not in SUBJECTS):
                continue
            if toks[i] in GEI_VERBS and g > i and toks[g] == "给" and (g - (i + 1) >= 1 or toks[i] == "打电话"):
                out.append(list(toks[:i]) + ["给"] + list(toks[g + 1:end]) + list(toks[i:g]) + tail)
                done = True
        if done:
            break
    if end >= 3 and "住" in toks[:end]:
        j = list(toks[:end]).index("住")
        if j + 2 <= end - 1 and toks[j + 1] == "在":
            out.append(list(toks[:j]) + ["在"] + list(toks[j + 2:end]) + ["住"] + tail)
        if j == end - 1 and "在" in toks[:j]:
            k = list(toks[:j]).index("在")
            out.append(list(toks[:k]) + ["住", "在"] + list(toks[k + 1:j]) + tail)
    for i, t in enumerate(toks[:end]):
        # 住在 as one tile or token
        if t == "住在" and i + 1 < end:
            out.append(list(toks[:i]) + ["在"] + list(toks[i + 1:end]) + ["住"] + tail)
    return [o for o in out if o != list(toks)]


def _clauses(text):
    return [c for c in re.split(r"[，。！？；]", text) if c]


_VINDEX = [None, None]


def variant_spellings(text):
    """The word variants of one answer (one step; widen and the checks close them)."""
    if _VINDEX[0] is None:
        here = os.path.dirname(os.path.abspath(__file__))
        lex = load_lexicon(os.path.abspath(os.path.join(here, "..", "..", "..", "..")))
        _VINDEX[0], _VINDEX[1] = Index(lex), {x["surface"]: x["partOfSpeech"] for x in lex}
    index, pos = _VINDEX
    out = price_spellings(text) + mei_spellings(text, index) + bit_spellings(text, index, pos) + one_spellings(text, index)
    # answer-key pass 2: 每天 … 都, an age with 了, 星期一 ⇄ 周一
    out += dou_spellings(text, index, pos) + age_spellings(text) + week_spellings(text)
    # independent audit: 很 / 非常 ⇄ 特别 before a verb or an adjective
    out += tebie_spellings(text, index, pos)
    for clause in _clauses(text):
        toks = [t for t, _ in index.tokens(clause)]
        out += [text.replace(clause, "".join(v), 1) for v in order_variants(toks, swap_time=False)]
    out += [_DATE_HAO.sub(r"\1日", text)] if _DATE_HAO.search(text) else []
    # A phone number typed without its hyphens. The writing fold keeps each hyphen a token of its own (138-1234-5678 is
    # five tokens, 13812345678 one); the zh plugin's joined slot runs (src/lib/languages/runs.ts, answer-key pass 2) then
    # take the number with spaces (138 1234 5678) for the unbroken variant, so both spellings are listed.
    out += [re.sub(r"(?<=\d)-(?=\d)", "", text)] if re.search(r"\d-\d", text) else []
    for a, b in TYPED_PAIRS:
        if a in text:
            out.append(text.replace(a, b))
    return [x for x in dict.fromkeys(out) if x != text]


# ---------------------------------------------------------------- speech twins (answer-key pass 2, 2026-11-05)
# A reserved speech item (checkpoint, capstone, placement) that asks what a lesson item asks, with other facts, accepts
# every form the lesson item accepts, the facts swapped (zh-speech-s4.py widens it so, zh-check-answers.py rule 11 checks
# it): a learner placed or examined on the twin is never held to a narrower list than the one they practised.
SPEECH_TWINS = {
    "cp4_thanks_water": ("k_thanks", {}),
    "cp4_name_hua": ("l_name", {"阮海": "阮花"}),
    "pl_name_nam": ("l_name", {"阮海": "阮南"}),
    "cp4_vietnamese": ("l_from", {}),
    "cp4_work_shop": ("l_work", {"工厂": "超市"}),
    "pl_age": ("l_age", {"二十五": "三十", "25": "30"}),
    "cp4_tickets_three": ("m_tickets", {"两": "三", "2": "3"}),
    "cp4_time_ten": ("m_time", {"八": "十", "8": "10"}),
    "a1cap_time_nine": ("m_time", {"八": "九", "8": "9"}),
    "cp4_day_friday": ("m_day", {"一": "五", "1": "5"}),
    "a1cap_day_sunday": ("m_day", {"星期一": "星期天", "周一": "周日"}),
    "a1cap_birthday": ("m_birthday", {"五": "九", "十": "二十", "5": "9", "10": "20"}),
    "cp4_price_tea": ("m_price", {"十八": "五", "18": "5", "碗": "瓶", "面条": "茶"}),
    "a1cap_price_coffee": ("m_price", {"十八": "二十", "18": "20", "碗": "杯", "面条": "咖啡"}),
    "cp4_desc_dog": ("n_box", {"箱子": "狗", "个": "只"}),
}


def twin_text(text, mapping):
    """One lesson answer with the twin's facts (every key replaced at once, the longest first)."""
    if not mapping:
        return text
    pattern = re.compile("|".join(re.escape(k) for k in sorted(mapping, key=len, reverse=True)))
    return pattern.sub(lambda m: mapping[m.group(0)], text)


# ---------------------------------------------------------------- voices (D-10 review, 2026-11-05)
# The two-voice cast of every clip and story: A female, B male (zh-plan §7; N narrates with A's voice). The Vietnamese
# names of the course people say which voice speaks as them.
NAME_VOICE = {"阮花": "A", "阮红": "A", "阮雪": "A", "阮云": "A", "阮河": "A", "阮南": "B", "阮海": "B", "阮山": "B"}
_VOCATIVE = re.compile("^(" + "|".join(NAME_VOICE) + ")[，！,]")


def voice_problems(segments, replies=True):
    """(speaker, text) segments of one clip or scene: a line saying 我叫 / 我是 + a name is in that name's voice, and (a
    two-person clip, replies=True) the reply to a line that calls a name (阮花，…) is in the called name's voice. A story
    has more people than voices: its declared cast is checked instead (zh_stories_lib)."""
    out = []
    for i, (sp, text) in enumerate(segments):
        for name, voice in NAME_VOICE.items():
            if sp in ("A", "B") and re.search(f"我(?:叫|是){name}", text) and sp != voice:
                out.append(f"{text!r} is said as {name} by voice {sp}; {name} speaks with voice {voice}")
        m = _VOCATIVE.match(text)
        if replies and m and i + 1 < len(segments):
            nsp = segments[i + 1][0]
            if nsp in ("A", "B") and nsp != sp and nsp != NAME_VOICE[m.group(1)]:
                out.append(f"{text!r} calls {m.group(1)}, who answers with voice {nsp}; {m.group(1)} speaks with voice {NAME_VOICE[m.group(1)]}")
    return out


# ---------------------------------------------------------------- units in the Vietnamese (D-10 review, 2026-11-05)
# 块 / 元 is the yuan: Vietnamese "tệ" (the lessons' word), never "đồng", which a Vietnamese reader takes for the dong
# (7.000 đồng is a few cents). 斤 is half a kilogram, but a Vietnamese "cân" is a kilogram: a line beside 斤 says
# "nửa ký", "một ký" … or "cân Trung Quốc", never a bare "cân".
_VI_NUMBER = r"(?:\d[\d.,]*|một|hai|ba|bốn|tư|năm|lăm|sáu|bảy|tám|chín|mười|mươi|mốt|trăm|nghìn|ngàn|vạn|triệu|rưỡi|bao nhiêu|mấy)"
_VI_DONG = re.compile(rf"(?<![\w]){_VI_NUMBER}\s+đồng(?![\w])", re.I)
_VI_CAN = re.compile(r"(?<![\w])cân(?![\w])(?! Trung Quốc)", re.I)
_ZH_YUAN = re.compile(r"[0-9零一二三四五六七八九十百千万两几少]\s*(?:块|元)|块钱")


def vi_unit_problems(zh, vi):
    out = []
    if _ZH_YUAN.search(zh) and _VI_DONG.search(vi):
        out.append(f"{vi!r} says 'đồng' for the yuan of {zh!r}: write 'tệ'")
    if re.search(r"(?<!公)斤", zh) and _VI_CAN.search(vi):
        out.append(f"{vi!r} says a bare 'cân' beside 斤 in {zh!r}: 一斤 is half a kilogram (nửa ký; cân Trung Quốc)")
    return out


VI_SUBJECT = re.compile(r"^(?:(?:Hôm nay|Hôm qua|Ngày mai|Mai|Bây giờ|Sáng nay|Tối nay|Cuối tuần|Năm nay|Thứ [A-ZÂƯa-zâư]+|Chủ nhật)\s*,?\s+)?Tôi\s")


def subject_spellings(vi, key):
    """我 in front of a key whose Vietnamese prompt says "Tôi …" and whose Chinese leaves it out (a reply such as 明天去);
    the key without 我 when the prompt drops the subject (Vietnamese "Mai đi làm." → 我明天上班 / 明天上班)."""
    if VI_SUBJECT.search(vi) and not key.startswith(SUBJECTS) and not _TIME_SUBJ.match(key):
        return ["我" + key]
    if key.startswith("我") and not key.startswith("我们") and not re.search(r"\btôi\b", vi, re.I) and len(bare(key)) > 3:
        return [key[1:]]
    return []


def widen(answers, variants=True):
    """Every accepted answer plus its numeral and natural spellings and (unless variants=False: a dictation transcribes the
    clip) its word variants, closed under all of them, in order, without repeats."""
    out = []
    for a in answers:
        if a not in out:
            out.append(a)
    grown = True
    while grown:
        grown = False
        for a in list(out):
            for x in numeral_spellings(a) + natural_spellings(a) + (variant_spellings(a) if variants else []):
                if x not in out and bare(x) not in {bare(y) for y in out}:
                    out.append(x)
                    grown = True
    return out

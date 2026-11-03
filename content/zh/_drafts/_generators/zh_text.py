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
        if _ZHANG.search(text):
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
                "上次", "一会儿"], key=len, reverse=True)
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


VI_SUBJECT = re.compile(r"^(?:(?:Hôm nay|Hôm qua|Ngày mai|Mai|Bây giờ|Sáng nay|Tối nay|Cuối tuần|Năm nay|Thứ [A-ZÂƯa-zâư]+|Chủ nhật)\s*,?\s+)?Tôi\s")


def subject_spellings(vi, key):
    """我 in front of a key whose Vietnamese prompt says "Tôi …" and whose Chinese leaves it out (a reply such as 明天去);
    the key without 我 when the prompt drops the subject (Vietnamese "Mai đi làm." → 我明天上班 / 明天上班)."""
    if VI_SUBJECT.search(vi) and not key.startswith(SUBJECTS) and not _TIME_SUBJ.match(key):
        return ["我" + key]
    if key.startswith("我") and not key.startswith("我们") and not re.search(r"\btôi\b", vi, re.I) and len(bare(key)) > 3:
        return [key[1:]]
    return []


def widen(answers):
    """Every accepted answer plus its numeral and natural spellings, closed under both, in order, without repeats."""
    out = []
    for a in answers:
        if a not in out:
            out.append(a)
    grown = True
    while grown:
        grown = False
        for a in list(out):
            for x in numeral_spellings(a) + natural_spellings(a):
                if x not in out and bare(x) not in {bare(y) for y in out}:
                    out.append(x)
                    grown = True
    return out

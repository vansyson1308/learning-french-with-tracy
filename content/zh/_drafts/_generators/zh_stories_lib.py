"""Shared builder and checker of the zh-vi graded stories (P4d session 5; the zh-stories-NN.py batches import it), after
ja_stories_lib.py.

A sentence is (speaker, Chinese text with a space between words, Vietnamese). The spaces are the author's word boundaries:
they are removed from the text the app shows, and the builder checks that the story engine finds exactly those words.
Chinese has no spaces, so scripts/lib/stories.ts segments a zh story (script han) by left-to-right maximal match over
every key it resolves (lexicon lemma and lookup forms, the rows of derived/morphology.json, the function words, the
token-map keys), with one step of lookahead — the P4c dictionary path, never Intl.Segmenter. `segment` and `resolve`
port that segmentation and resolution one for one; a sentence the engine would cut differently from the author (家人 for
家 人, 回家 for 回 家) stops the batch.

A word token is a lexeme surface (Mandarin does not inflect: no story token map of verb forms is needed); `word=slug`
forces the lexeme zh:w:<slug>, `word=name` marks a name. The people of the stories carry names whose characters the
lexicon reads (阮南, 阮花, 小王, 老李 …, NAMES): each is mapped as a name in the story's tokenMap, so the engine keeps it
whole. The family names 王 / 李 before a title (王经理, 李组长) are names too.

Voices (zh-plan.md §7; content/audio/voice-casts.json is still pending its canary, so the cast is the plan's): A is the
female voice (kokoro-zf_xiaobei) and narrates (N takes A's voice), B the male voice (kokoro-zm_yunjian): a woman's lines
are A, a man's lines B. D-10 review (2026-11-05): a story with dialogue declares its cast, story(..., cast=(A, B)) — one
character per voice for the whole story (a third speaker is narrated: 司机问：“…”); a name of the course people is in its
own voice (zh_text.NAME_VOICE); no voice calls its own character by name; no voice answers its own question; and the
Vietnamese of a 块 amount says "tệ", of a 斤 weight never a bare "cân" (zh_text.vi_unit_problems). The casts go to
stories/casts.json, which zh-check-stories.py reads.

Questions are authored with the right option first; `story` moves it to a position taken from the story id and the
question number, as the ja stories do. Every check of `check_story` runs here and again in zh-check-stories.py.
"""
import glob, json, math, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from zh_text import COUNTER_NOUNS, HAN, MEASURE_WORDS, NAME_VOICE, NOUN_MEASURES, Index, vi_unit_problems, voice_problems  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
D = os.path.join(ROOT, "content", "zh", "_drafts")
STAGED = os.path.join(D, "staged", "content")
BANDS = ["A1-0", "A1-1", "A1-2", "A2-1", "A2-2", "B1-1", "B1-2", "B2-1", "B2-2"]
STORY_MIN_COVERAGE = 0.95
TOKEN_RANGE = {"A1-0": (50, 100)}
DEFAULT_RANGE = (150, 400)
SENTENCE_MAX_CHARS = 220
# The plan's cast (zh-plan.md §7: A female, B male), used while voice-casts.json has no zh cast.
PLAN_CAST = {"A": "kokoro-zf_xiaobei", "B": "kokoro-zm_yunjian"}


def _load(rel):
    return json.load(open(os.path.join(ROOT, rel), encoding="utf-8"))


LEX = _load("content/zh/lexicon/lexemes.json")["lexemes"]
LEX_BY_ID = {x["id"]: x for x in LEX}
BY_SURFACE = {x["surface"]: x["id"] for x in LEX}
POS = {x["surface"]: x["partOfSpeech"] for x in LEX}
MORPH = _load("content/zh/lexicon/derived/morphology.json")
SYLLABUS = json.load(open(os.path.join(STAGED, "zh", "lexicon", "syllabus.json"), encoding="utf-8"))
LATER = json.load(open(os.path.join(STAGED, "zh", "lexicon", "syllabus-a2-1.json"), encoding="utf-8"))
PACK = json.load(open(os.path.join(STAGED, "courses", "zh-vi.json"), encoding="utf-8"))
INDEX = Index(LEX)


def cast():
    """The story voice cast: voice-casts.json once the canary has selected one, else the plan's."""
    c = _load("content/audio/voice-casts.json")["languages"]["zh"]["cast"]
    return {"A": c["A"] or PLAN_CAST["A"], "B": c["B"] or PLAN_CAST["B"]}


# Grammar words of the stories (the seed writes them into stories.json): the structural and aspect particles, the
# sentence-final particles, the plural suffix 们, the negations and the three adverbs of the first lessons. All are
# lexemes of band A1-1 or A1-2; as function words they are known at every band, as the particles are in the ja stories.
# 了 / 过 / 着 are still gated by band in check_story (了 from A1-1, 过 from A1-2, 着 from A2-1).
FUNCTION = "的 了 吗 呢 吧 啊 着 过 得 们 不 没 也 都 很".split()
# People of the stories: Vietnamese names (阮 + a one-character lexeme: Nam, Hải, Hoa, Hồng, Sơn, Tuyết, Vân, Hà) and
# the Chinese colleagues (小王, 小李, 老王, 老李; 王 and 李 before a title).
NAMES = set("阮南 阮海 阮花 阮红 阮山 阮雪 阮云 阮河 小王 小李 老王 老李 王 李".split())
CLOSED_CLASS = {"pronoun", "determiner", "preposition", "conjunction"}


def _bands():
    """lexemeBands of stories.ts: the syllabus halves (A1-1, A1-2), the later list (A2-1)."""
    out = {}
    half = math.ceil(len(SYLLABUS["entries"]) / 2)
    for i, e in enumerate(SYLLABUS["entries"]):
        out.setdefault(e["lexemeId"], "A1-1" if i < half else "A1-2")
    for e in LATER["entries"]:
        out.setdefault(e["lexemeId"], LATER["level"].upper())
    return out


RESOLUTION_BANDS = _bands()
_units = [u for s in PACK["sections"] for u in s["units"]][:3]
MICRO_SURFACES = {w["target"].lower() for u in _units for w in u["words"]}
MICRO = {x["id"] for x in LEX if not x.get("variety") and (x["partOfSpeech"] in CLOSED_CLASS or x["surface"].lower() in MICRO_SURFACES)}
STORY_BANDS = dict(RESOLUTION_BANDS)
for _id in MICRO:
    STORY_BANDS[_id] = "A1-0"


def band_rank(b):
    return BANDS.index(b)


# ---------------------------------------------------------------------------
# The story engine, ported (scripts/lib/stories.ts buildLexemeIndex, resolveToken, the dictionary path)
# ---------------------------------------------------------------------------

def _single_index():
    cands = {}

    def offer(key, lid, rank):
        cands.setdefault(key, []).append((rank, lid))

    def rank_of(lid, conjugated, order):
        b = RESOLUTION_BANDS.get(lid)
        return (conjugated, 1 if b is None else 0, 0 if b is None else band_rank(b), order)

    by_lemma = {}
    for order, x in enumerate(LEX):
        for form in dict.fromkeys([x["lookupForm"], x["lemma"]]):
            if any(ch.isalpha() for ch in form):
                offer(form.lower().replace(" ", ""), x["id"], rank_of(x["id"], 0, order))
        if x["partOfSpeech"] == "verb" and x["lemma"].lower() not in by_lemma:
            by_lemma[x["lemma"].lower()] = x["id"]
    for order, v in enumerate(MORPH["verbs"]):
        lid = by_lemma.get(v["lemma"].lower())
        if lid is None:
            continue
        for row in v["rows"]:
            offer(row["mot"].lower(), lid, rank_of(lid, 1, order))
    return {k: min(v)[1] for k, v in cands.items()}


SINGLE = _single_index()
_LATIN_DIGIT = re.compile(r"[A-Za-z0-9À-ɏ０-９]")
_NUMBER = re.compile(r"^\d+(?:[.,:]\d+)*$")


def _is_word(token):
    return any(ch.isalpha() for ch in token) and not _NUMBER.match(token)


def segment(text, words):
    """matchUnspaced of stories.ts over one sentence: the longest key at each position unless the next character would
    start no key (and is a letter) while a shorter key leaves a clean start; else a Latin/digit run, else one character."""
    keys = {w.lower().replace(" ", "") for w in words}
    keys.discard("")
    longest = max((len(k) for k in keys), default=1)

    def clean_start(part, j):
        if j >= len(part) or not part[j].isalpha():
            return True
        return any(part[j:j + n] in keys for n in range(min(longest, len(part) - j), 0, -1))

    out = []
    for part in re.split(r"(\s+)", text):
        if not part:
            continue
        if part.isspace():
            out.append((part, False))
            continue
        i = 0
        while i < len(part):
            end = 0
            lengths = [n for n in range(min(longest, len(part) - i), 0, -1) if part[i:i + n] in keys]
            if lengths:
                end = i + next((n for n in lengths if clean_start(part, i + n)), lengths[0])
            if end == 0 and _LATIN_DIGIT.match(part[i]):
                end = i + 1
                while end < len(part) and _LATIN_DIGIT.match(part[end]):
                    end += 1
            if end == 0:
                end = i + 1
            tok = part[i:end]
            out.append((tok, _is_word(tok)))
            i = end
    return out


def resolve(key, token_map, function=FUNCTION):
    """resolveToken of stories.ts: tokenMap, function words, numbers, the lexeme index (the Romance endings never apply
    to hanzi)."""
    key = key.lower()
    if key in token_map:
        v = token_map[key]
        return ("function", None) if v == "function" else ("name", None) if v == "name" else ("lexeme", v)
    if key in function:
        return ("function", None)
    if re.fullmatch(r"\d+([.,]\d+)?", key):
        return ("number", None)
    if key in SINGLE:
        return ("lexeme", SINGLE[key])
    return ("unresolved", None)


def analyze(record, file_token_map=None):
    """analyzeStory of stories.ts over one story record: word tokens with their resolution, counts, coverage."""
    tm = {k.lower(): v for k, v in {**(file_token_map or {}), **record.get("tokenMap", {})}.items()}
    words = list(SINGLE) + FUNCTION + list(tm)
    new = set(record["newLexemes"])
    band = record["band"]
    tokens, unknown, lexemes, undeclared, unresolved, sentences = 0, 0, [], set(), set(), []
    for s in record["sentences"]:
        pieces = []
        for tok, is_word in segment(s["text"], words):
            if not is_word:
                pieces.append((tok, None))
                continue
            tokens += 1
            kind, lid = resolve(tok, tm)
            if kind == "lexeme":
                if lid not in lexemes:
                    lexemes.append(lid)
                b = STORY_BANDS.get(lid)
                known = lid not in new and b is not None and band_rank(b) <= band_rank(band)
                if not known:
                    unknown += 1
                    if lid not in new:
                        undeclared.add(lid)
            elif kind == "unresolved":
                unresolved.add(tok)
                unknown += 1
            pieces.append((tok, (kind, lid)))
        sentences.append(pieces)
    return {"tokens": tokens, "unknown": unknown, "coverage": (tokens - unknown) / tokens if tokens else 0.0,
            "lexemes": lexemes, "undeclared": sorted(undeclared), "unresolved": sorted(unresolved), "sentences": sentences}


# ---------------------------------------------------------------------------
# Checks (also run by zh-check-stories.py)
# ---------------------------------------------------------------------------

VI_MARK = re.compile(r"[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]", re.I)
ASCII_PUNCT = re.compile(r"[,.?!:;\"'()]")
QUOTED = re.compile(r"“[^”]*”")
NUMERALS = set("一二三四五六七八九十百千万两几零") | {"这", "那", "哪", "每"}
# A noun right after a number or 这/那 that is right (zh-check-answers.py rule 2): units, floors, 一家公司, 哪国人, bus routes.
NOUN_AFTER_NUMBER_OK = set(COUNTER_NOUNS) | {"楼", "家", "国", "口", "路"} | {"上午", "下午", "中午", "早上", "晚上", "白天", "夜"}
# Measure words that count actions or measure time, distance, age (吃三次药, 十分钟, 三公里): the next word is no counted noun.
NON_NOUN_MEASURES = {"次", "遍", "分钟", "公里", "岁", "点", "刻", "度", "分", "毛", "元", "块", "页", "节", "句"}
# Nouns the stories count that the lessons' table does not declare, with the measure words a native speaker accepts.
STORY_MEASURES = {
    "钱": {"块", "元", "毛"}, "肉": {"斤", "块", "公斤"}, "男人": {"个"}, "女人": {"个"}, "周末": {"个"}, "生日": {"个"},
    "东西": {"个", "件", "样"}, "小孩儿": {"个"}, "洗手间": {"个"}, "群": {"个"}, "月": {"个"}, "微信": {"条"}, "星期": {"个"}, "汉语": set(),
    **{d: {"个"} for d in ("星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期天")}, "饺子": {"个", "盘", "碗"}, "西瓜": {"个"}, "家人": {"个", "位"}, "工作": {"个", "份"},
    "电话": {"个", "通"}, "短信": {"条", "个"}, "照片": {"张"}, "礼物": {"个", "件", "份"}, "护照": {"本"}, "身份证": {"张"},
    "表": {"张"}, "合同": {"份", "个"}, "箱子": {"个"}, "货": {"批"}, "灭火器": {"个", "台"}, "口罩": {"个", "只"},
    "工作服": {"件", "套"}, "鞋": {"双"}, "手套": {"双"}, "帽子": {"顶", "个"}, "苹果": {"个", "斤", "公斤"}, "水果": {"斤", "种"},
    "饭馆": {"个", "家"}, "酒店": {"个", "家"}, "药店": {"个", "家"}, "书店": {"个", "家"}, "房子": {"个", "套"},
    "宿舍": {"个", "间"}, "楼": {"层", "栋"}, "地方": {"个"}, "便当": {"个", "份"}, "面条": {"碗"}, "米饭": {"碗"},
    "包子": {"个"}, "鸡蛋": {"个"}, "菜": {"个", "种", "份", "盘"}, "车票": {"张"}, "机票": {"张"}, "票": {"张"}, "钥匙": {"把"},
    "洗衣机": {"台", "个"}, "椅子": {"把", "个"}, "桌子": {"张"}, "床": {"张"}, "人": {"个", "位", "口"}, "工人": {"个", "位"},
    "老乡": {"个", "位"}, "朋友": {"个", "位"}, "同事": {"个", "位"}, "孩子": {"个"}, "女儿": {"个"}, "儿子": {"个"},
    "病人": {"个", "位"}, "客人": {"个", "位"}, "顾客": {"个", "位"}, "员工": {"个", "位"}, "产品": {"个", "种", "件"},
    "衣服": {"件"}, "事": {"件"}, "事情": {"件"}, "问题": {"个"}, "汉字": {"个"}, "字": {"个"}, "词": {"个"}, "生词": {"个"},
    "句子": {"个"}, "歌": {"首"}, "电影": {"部", "个"}, "书": {"本"}, "课本": {"本"}, "词典": {"本"}, "笔": {"支"},
    "笔记本": {"本", "个"}, "杯子": {"个"}, "筷子": {"双"}, "包": {"个"}, "书包": {"个"}, "钱包": {"个"}, "手机": {"个", "部"},
    "电脑": {"台", "个"}, "机器": {"台", "个"}, "车": {"辆"}, "自行车": {"辆"}, "出租车": {"辆"}, "公交车": {"辆"}, "汽车": {"辆"},
    "摩托车": {"辆"}, "机车": {"辆"}, "茶": {"杯", "瓶"}, "水": {"杯", "瓶"}, "咖啡": {"杯"}, "牛奶": {"杯", "瓶"},
    "果汁": {"杯", "瓶"}, "酒": {"杯", "瓶"}, "猫": {"只"}, "狗": {"只", "条"}, "鸟": {"只"}, "鸡": {"只"}, "鱼": {"条"},
    "路": {"条"}, "河": {"条"}, "裤子": {"条"}, "城市": {"个"}, "国家": {"个"}, "公司": {"个", "家"}, "工厂": {"个", "家"},
    "超市": {"个", "家"}, "商店": {"个", "家"}, "银行": {"个", "家"}, "医院": {"个", "家"}, "房间": {"个", "间"},
    "车间": {"个"}, "仓库": {"个"}, "办法": {"个"}, "机会": {"个"}, "故事": {"个"}, "卡": {"张"}, "银行卡": {"张"},
    "信用卡": {"张"}, "纸": {"张"}, "号码": {"个"}, "密码": {"个"}, "地址": {"个"}, "门票": {"张"}, "灯": {"盏", "个"},
    "花": {"朵", "束"}, "树": {"棵"}, "月饼": {"个"}, "组": {"个"}, "班": {"个"}, "年轻人": {"个"}, "老人": {"个", "位"},
    "司机": {"个", "位"}, "医生": {"个", "位"}, "护士": {"个", "位"}, "老师": {"个", "位"}, "学生": {"个"},
    "留学生": {"个", "位"}, "服务员": {"个", "位"}, "经理": {"个", "位"}, "主管": {"个", "位"}, "组长": {"个", "位"},
    "老板": {"个", "位"}, "先生": {"个", "位"}, "小姐": {"个", "位"}, "男孩": {"个"}, "女孩": {"个"}, "工具": {"个", "种"},
    "座位": {"个"}, "地图": {"张"}, "动物": {"只", "种"}, "外卖": {"份", "个"}, "面包": {"个", "块"},
    "电视": {"台", "个"}, "门": {"扇", "个"}, "病": {"种"}, "药": {"种"}, "课": {"节"},
}
MEASURES_OF = {**{k: set(v) for k, v in NOUN_MEASURES.items()}}
for _k, _v in STORY_MEASURES.items():
    MEASURES_OF.setdefault(_k, set()).update(_v)
KIN = ("爸爸", "妈妈", "哥哥", "姐姐", "弟弟", "妹妹", "儿子", "女儿", "爷爷", "奶奶", "丈夫", "妻子", "爱人", "家人")
# Before a kin word in a third-person narrator line: whose family it is.
POSSESSORS = {"他", "她", "他们", "她们", "的", "和", "、"} | set(KIN)
VI_MY_KIN = re.compile(r"\b(?:bố|mẹ|anh trai|chị gái|em trai|em gái|ông nội|bà nội|vợ|chồng|con trai|con gái|gia đình|người nhà) tôi\b", re.I)
_ASPECT_FROM = {"了": "A1-1", "过": "A1-2", "着": "A2-1"}


def grammar_problems(text):
    """Rules 2 and 3 of zh-check-answers.py (measure words, 两/二, 了 and friends) over one story sentence, plus the noun a
    measure word counts (MEASURES_OF: a noun counted with a measure word it does not take, or undeclared, is a finding)."""
    msgs = []
    toks = [t for t, _ in INDEX.tokens(text)]
    for i, t in enumerate(toks[:-1]):
        nxt = toks[i + 1]
        if (t in NUMERALS or re.fullmatch(r"[0-9]", t[-1:] or "")) and POS.get(nxt) == "noun" and nxt not in NOUN_AFTER_NUMBER_OK and nxt not in MEASURE_WORDS:
            # 这 / 那 also open a clause ("那下次我们来吃包子", "那 = then"): only a countable noun needs the measure word there.
            if t not in ("这", "那") or nxt in MEASURES_OF:
                msgs.append(f"{t}{nxt} needs a measure word in {text!r}")
        if t == "二" and nxt in MEASURE_WORDS and not (i > 0 and (toks[i - 1] in ("十", "第") or toks[i - 1] in "一三四五六七八九")):
            msgs.append(f"二 before the measure word {nxt}: say 两, in {text!r}")
        if t == "两" and nxt not in MEASURE_WORDS and nxt not in COUNTER_NOUNS and nxt not in ("百", "千", "万", "点", "张", "楼", "把"):
            msgs.append(f"两 before {nxt}, which is no measure word or unit, in {text!r}")
        # 把 the lexeme is the preposition (zh:w:ba-3): as a measure word (一把椅子) the word check would show its gloss.
        if nxt == "把" and (t in NUMERALS or re.fullmatch(r"[0-9]+", t)):
            msgs.append(f"{t}把: 把 is stored as the preposition, not the measure word, in {text!r}")
    for i, t in enumerate(toks):
        counted = t in MEASURE_WORDS and t not in NON_NOUN_MEASURES and i > 0 and (toks[i - 1] in NUMERALS or re.fullmatch(r"[0-9]+", toks[i - 1]))
        if t in ("这个", "那个", "哪个"):
            counted, t = True, "个"
        if not counted:
            continue
        j = i + 1
        if j < len(toks) and POS.get(toks[j]) == "adjective":
            j += 1
        if j < len(toks) and POS.get(toks[j]) == "noun" and toks[j] not in COUNTER_NOUNS:
            noun = toks[j]
            allowed = MEASURES_OF.get(noun)
            if allowed is None:
                msgs.append(f"{noun} counted with {t} but not declared in STORY_MEASURES, in {text!r}")
            elif t not in allowed:
                msgs.append(f"{noun} takes {'/'.join(sorted(allowed))}, not {t}, in {text!r}")
    for i, t in enumerate(toks[:-1]):
        if t == "没" and POS.get(toks[i + 1]) == "verb" and toks[i + 1] != "有":
            clause_end = next((j for j in range(i, len(toks)) if toks[j] in "，。！？；"), len(toks))
            if "了" in toks[i + 1:clause_end]:
                msgs.append(f"没 + verb … 了 in one clause in {text!r}")
    for clause in re.split(r"[，。！？；：]", text):
        if re.search(r"(?:每天|常常|经常).*了", clause):
            msgs.append(f"了 with a habit (每天, 常常, 经常) in {text!r}")
        if re.search(r"正在[^，。！？]*了", clause):
            msgs.append(f"正在 … 了 in one clause in {text!r}")
        if "不有" in clause:
            msgs.append(f"不有 in {text!r}: the negative of 有 is 没有")
        if clause.endswith("吗") and re.search(r"什么|谁|哪|几|多少|怎么|为什么", re.sub(r"(?:有|要)什么", "", clause)):
            msgs.append(f"a question word takes no 吗 in {text!r}")
        if clause.endswith("吗") and re.search(r"(.)不\1", clause):
            msgs.append(f"an A不A question takes no 吗 in {text!r}")
        if re.search(r"比[^，。]*?(?:很|非常|太)", clause):
            msgs.append(f"no 很/非常/太 after 比 in {text!r}")
    for i, t in enumerate(toks):
        if t != "是":
            continue
        rest = [x for x in toks[i + 1:] if x not in ("很", "太", "非常")]
        if rest and POS.get(rest[0]) == "adjective" and (len(rest) == 1 or rest[1] in "。！？，了"):
            msgs.append(f"是 before a bare adjective ({rest[0]}) in {text!r}")
    return msgs


def first_person(r):
    """A story is told in the first person when a narrator line (outside a quotation) says 我 or 我们."""
    return any(s["speaker"] == "N" and "我" in QUOTED.sub("", s["text"]) for s in r["sentences"])


def voice_and_unit_problems(r, cast):
    """The D-10 rules of 2026-11-05 (module docstring): one character per voice, in its own voice, never calling itself or
    answering its own question; 块 in tệ and 斤 never as a bare cân in the Vietnamese."""
    msgs = []
    sents = r["sentences"]
    for n, s in enumerate(sents, 1):
        for p in vi_unit_problems(s["text"], s["translation"].get("vi", "")):
            msgs.append(f"#{n}: {p}")
    body = "".join(s["text"] for s in sents)
    for i, q in enumerate(r["questions"]):
        for t in [q["prompt"]["vi"]] + [o["vi"] for o in q["options"]]:
            for p in vi_unit_problems(body, t):
                msgs.append(f"q{i}: {p.split(' in ')[0]}")
    letters = sorted({s["speaker"] for s in sents} - {"N"})
    if not letters:
        return msgs
    if not cast:
        msgs.append(f"voices {''.join(letters)} without a declared cast: story(..., cast=(A character, B character))")
        return msgs
    for letter, who in zip("AB", cast):
        if who in NAME_VOICE and NAME_VOICE[who] != letter:
            msgs.append(f"cast: {who} speaks with voice {NAME_VOICE[who]}, not {letter} (A female, B male)")
    for n, s in enumerate(sents, 1):
        if s["speaker"] in ("A", "B"):
            who = cast["AB".index(s["speaker"])]
            if re.match(f"^{re.escape(who)}[，！]", s["text"]):
                msgs.append(f"#{n}: voice {s['speaker']} ({who}) calls its own character: {s['text']!r}")
            for other in NAME_VOICE:
                if other != who and re.search(f"我(?:叫|是){other}", s["text"]):
                    msgs.append(f"#{n}: voice {s['speaker']} ({who}) says it is {other}: {s['text']!r}")
        if n < len(sents):
            nxt = sents[n]
            if s["speaker"] in ("A", "B") and nxt["speaker"] == s["speaker"] and s["text"].endswith("？") and not nxt["text"].endswith("？"):
                msgs.append(f"#{n}-#{n + 1}: voice {s['speaker']} answers its own question: {s['text']!r} / {nxt['text']!r}")
    for p in voice_problems([(s["speaker"], s["text"]) for s in sents if s["speaker"] != "N"], replies=False):
        msgs.append(p)
    return msgs


def check_story(r, cast=None):
    """Messages for one story record (empty: the story passes)."""
    msgs = voice_and_unit_problems(r, cast)
    a = analyze(r)
    lo, hi = TOKEN_RANGE.get(r["band"], DEFAULT_RANGE)
    if not lo <= a["tokens"] <= hi:
        msgs.append(f"{a['tokens']} word tokens (band {r['band']}: {lo}-{hi})")
    if a["unresolved"]:
        msgs.append(f"unresolved {a['unresolved']}")
    if a["undeclared"]:
        msgs.append("beyond band " + r["band"] + ": " + ", ".join(f"{i} ({LEX_BY_ID[i]['surface']}, {STORY_BANDS.get(i)})" for i in a["undeclared"]))
    if a["coverage"] < STORY_MIN_COVERAGE:
        msgs.append(f"coverage {a['coverage']:.3f} ({a['unknown']} of {a['tokens']} tokens new)")
    if not 3 <= len(r["newLexemes"]) <= 5 or len(set(r["newLexemes"])) != len(r["newLexemes"]):
        msgs.append(f"newLexemes {r['newLexemes']}: 3-5 distinct")
    for lid in r["newLexemes"]:
        if lid not in a["lexemes"]:
            msgs.append(f"new lexeme {lid} never occurs")
        b = STORY_BANDS.get(lid)
        if b is not None and band_rank(b) < band_rank(r["band"]):
            msgs.append(f"new lexeme {lid} is a word of an earlier band ({b})")
    if not 8 <= len(r["sentences"]) <= 60:
        msgs.append(f"{len(r['sentences'])} sentences (8-60)")
    for p in INDEX.problems(r["title"]):
        msgs.append("title: " + p)
    third = not first_person(r)
    for n, (s, pieces) in enumerate(zip(r["sentences"], a["sentences"]), 1):
        text = s["text"]
        if len(text) > SENTENCE_MAX_CHARS or " " in text or "　" in text:
            msgs.append(f"#{n}: over {SENTENCE_MAX_CHARS} characters or a space in {text!r}")
        for p in INDEX.problems(text):
            msgs.append(f"#{n}: {p}")
        if ASCII_PUNCT.search(text):
            msgs.append(f"#{n}: half-width punctuation in Chinese text {text!r} (write ，。？！：“”)")
        for p in grammar_problems(text):
            msgs.append(f"#{n}: {p}")
        words = [tok for tok, res in pieces if res is not None]
        for asp, frm in _ASPECT_FROM.items():
            if asp in words and band_rank(r["band"]) < band_rank(frm):
                msgs.append(f"#{n}: {asp} before band {frm} in {text!r}")
        if third and s["speaker"] == "N":
            plain = [tok for tok, res in segment(QUOTED.sub("", text), list(SINGLE) + FUNCTION + list(r.get("tokenMap", {}))) if res]
            for k, tok in enumerate(plain):
                if tok in KIN and not (k > 0 and (plain[k - 1] in POSSESSORS or r.get("tokenMap", {}).get(plain[k - 1]) == "name")):
                    msgs.append(f"#{n}: a third-person narrator says whose {tok} it is (他{tok}, 阮南的{tok}) in {text!r}")
            if VI_MY_KIN.search(s["translation"].get("vi", "")):
                msgs.append(f"#{n}: a third-person narrator line translated with 'tôi': {s['translation']['vi']!r}")
        vi = s["translation"].get("vi", "")
        if not vi.strip() or HAN.search(vi):
            msgs.append(f"#{n}: Vietnamese translation empty or with hanzi: {vi!r}")
        if s["speaker"] not in ("N", "A", "B"):
            msgs.append(f"#{n}: speaker {s['speaker']}")
    blurb = r["blurb"].get("vi", "")
    if not blurb.strip() or HAN.search(blurb) or not VI_MARK.search(blurb):
        msgs.append(f"blurb {blurb!r}")
    qs = r["questions"]
    if len(qs) != 3 or sum(q["kind"] == "infer" for q in qs) != 1:
        msgs.append("three questions, exactly one an inference")
    for i, q in enumerate(qs):
        texts = [q["prompt"]["vi"]] + [o["vi"] for o in q["options"]]
        if any(HAN.search(t) or not t.strip() for t in texts):
            msgs.append(f"q{i}: hanzi or empty text in a question")
        if not q["prompt"]["vi"].rstrip().endswith("?"):
            msgs.append(f"q{i}: a question ends with '?'")
        opts = [o["vi"].strip().lower() for o in q["options"]]
        if len(set(opts)) != len(opts) or not 3 <= len(opts) <= 4:
            msgs.append(f"q{i}: 3-4 distinct options")
        if not 0 <= q["answer"] < len(opts):
            msgs.append(f"q{i}: answer {q['answer']} has no option")
    if r.get("sourceRef") != "original-project":
        msgs.append("sourceRef")
    return msgs


# ---------------------------------------------------------------------------
# Builder
# ---------------------------------------------------------------------------

def Q(vi, opts, kind="locate"):
    """A question whose first option is the right one."""
    return (kind, vi, opts)


_NOT_WORD = r"[0-9０-９]+|[、。！？!?，,：:；;“”…（）()·]+"


def _words_of(raw):
    """(words, forced) of one authored token: 'word=slug' forces zh:w:<slug>, 'word=name' / 'word=function' a kind;
    digits and punctuation (8点, 。) are not words."""
    forced = None
    if "=" in raw:
        raw, forced = raw.split("=", 1)
        forced = re.match(r"[a-z0-9_-]+", forced).group()
        forced = forced if forced in ("name", "function") else "zh:w:" + forced
        assert forced in ("name", "function") or forced in LEX_BY_ID, f"no lexeme {forced}"
    parts = [p for p in re.split(f"({_NOT_WORD})", raw) if p and not re.fullmatch(_NOT_WORD, p)]
    # A hanzi numeral written as one word (二十, 一百五十, 十二月) is one lexeme per character for the engine: 二|十, 十|二|月.
    out = []
    for p in parts:
        m = re.fullmatch(r"([零一二三四五六七八九十百千万两]+)(.*)", p)
        if p in BY_SURFACE or not m or (m.group(2) and m.group(2) not in BY_SURFACE) or len(p) < 2:
            out.append(p)
        else:
            out += list(m.group(1)) + ([m.group(2)] if m.group(2) else [])
    return out, forced


CASTS = {}


def story(sid, band, title, blurb, new, sentences, questions, cast=None):
    full = f"zh.story.{sid}"
    if cast:
        CASTS[full] = list(cast)
    tm = {}
    authored = []  # per sentence: the word tokens the author wrote
    for speaker, text, _vi in sentences:
        words = []
        for raw in text.split():
            parts, forced = _words_of(raw)
            for w in parts:
                if forced:
                    if w not in FUNCTION:
                        tm[w] = forced
                elif w in NAMES:
                    tm[w] = "name"
                elif w in FUNCTION:
                    pass
                else:
                    lid = BY_SURFACE.get(w)
                    assert lid is not None, f"{full}: {w!r} is no lexeme surface (write {w}=slug or a name)"
                    kind, got = resolve(w, {})
                    if kind != "lexeme" or got != lid:
                        tm[w] = lid
                words.append(w)
        authored.append(words)
    out = {"id": full, "band": band, "title": title, "blurb": {"vi": blurb}, "newLexemes": []}
    for w in new:
        lid = w if w.startswith("zh:w:") else BY_SURFACE.get(w)
        assert lid is not None, f"{full}: new word {w!r} is no lexeme"
        out["newLexemes"].append(lid)
    if tm:
        out["tokenMap"] = dict(sorted(tm.items()))
    out["sentences"] = [{"speaker": s, "text": re.sub(r"=[a-z0-9_-]+", "", t).replace(" ", "").replace("?", "？").replace("!", "！"), "translation": {"vi": vi}}
                        for s, t, vi in sentences]
    seed = sum(ord(c) for c in full)
    rows = []
    for i, (kind, qv, opts) in enumerate(questions):
        at = (seed + i) % len(opts)
        ordered = opts[1:at + 1] + opts[:1] + opts[at + 1:]
        rows.append({"kind": kind, "prompt": {"vi": qv}, "options": [{"vi": o} for o in ordered], "answer": at})
    out["questions"] = rows
    out["sourceRef"] = "original-project"
    # The engine must cut every sentence exactly where the author did, and resolve each word to the lexeme meant.
    a = analyze(out)
    problems = []
    for n, (words, pieces) in enumerate(zip(authored, a["sentences"]), 1):
        got = [t for t, res in pieces if res is not None]
        if got != words:
            problems.append(f"#{n}: engine words {'|'.join(got)} ≠ authored {'|'.join(words)}")
    problems += check_story(out, cast)
    if problems:
        FAILED.append(f"{full} ({a['tokens']} tokens, {a['unknown']} new):\n  " + "\n  ".join(problems))
    return out


FAILED = []


def write_batch(name, stories):
    """Write one batch and rebuild OUTPUT.jsonl; a story that failed a check stops the pipeline (nothing is written)."""
    if FAILED:
        raise SystemExit("\n".join(FAILED))
    base = os.path.join(D, "stories")
    d = os.path.join(base, "batches")
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, f"{name}.jsonl"), "w", encoding="utf-8", newline="\n") as f:
        for s in stories:
            f.write(json.dumps(s, ensure_ascii=False) + "\n")
    with open(os.path.join(base, "OUTPUT.jsonl"), "w", encoding="utf-8", newline="\n") as out:
        for fn in sorted(glob.glob(os.path.join(d, "*.jsonl"))):
            out.write(open(fn, encoding="utf-8").read())
    # The casts of this batch beside it; casts.json joins every batch's (zh-check-stories.py reads it).
    with open(os.path.join(d, f"{name}.casts.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump({s["id"]: CASTS[s["id"]] for s in stories if s["id"] in CASTS}, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write("\n")
    joined = {}
    for fn in sorted(glob.glob(os.path.join(d, "*.casts.json"))):
        joined.update(json.load(open(fn, encoding="utf-8")))
    with open(os.path.join(base, "casts.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(dict(sorted(joined.items())), f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(name, len(stories), "stories")

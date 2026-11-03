"""Japanese text analysis shared by the ja-vi lesson and concept generators and the self-check (ja-check-answers.py).

It simulates what the app shows over a Japanese string: RubyText lays furigana over the longest stored surface, left to
right (src/lib/learning/script-reading.ts annotateText), from the course's words and its lexicon index. Inflected verbs
and い-adjectives get their furigana through the inflection keys of src/lib/languages/ja-inflection.ts, ported here
one for one (inflection_keys): masu stem + ま/た/に, te and ta forms, nai stem + な, and the adjective stem + く/か.

The checks a generator runs on every Japanese string:
 - every kanji is covered by a furigana segment (no kanji outside the lexicon readings);
 - no single-kanji word is read on its own beside another kanji or a digit when the compound reads otherwise
   (三人 would show ひと over 人), and 何 before です/で/の/と (read なん, stored なに) is written in kana;
 - no Latin letters (romaji never appears in an exercise);
 - register: a keyed sentence ends in です/ます style unless the exercise is marked plain on purpose.
"""
import json, os, re, sys

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")
HAN =re.compile(r"[㐀-䶿一-鿿々〆]")
LATIN = re.compile(r"[A-Za-zＡ-Ｚａ-ｚ]")
KANA = re.compile(r"[ぁ-ゖァ-ヺー]")
DIGIT = re.compile(r"[0-9０-９]")

GODAN = {
    "う": ("わ", "い", "って", "った"), "つ": ("た", "ち", "って", "った"), "る": ("ら", "り", "って", "った"),
    "む": ("ま", "み", "んで", "んだ"), "ぶ": ("ば", "び", "んで", "んだ"), "ぬ": ("な", "に", "んで", "んだ"),
    "く": ("か", "き", "いて", "いた"), "ぐ": ("が", "ぎ", "いで", "いだ"), "す": ("さ", "し", "して", "した"),
}


def _segments(surface, reading):
    """wordSegments of script-reading.ts: the stored furigana when it spells the surface, else the whole kana over a kanji word."""
    fur = reading.get("furigana") or []
    if fur and "".join(s["base"] for s in fur) == surface:
        return [dict(s) for s in fur]
    kana = reading.get("kana")
    if kana:
        return [{"base": surface, "ruby": kana}] if HAN.search(surface) else [{"base": surface}]
    return None


def _drop_tail(segs, n):
    """The segments without the last n characters, which must be plain kana (okurigana)."""
    out = [dict(s) for s in segs]
    while n > 0:
        if not out or "ruby" in out[-1]:
            return None
        base = out[-1]["base"]
        if len(base) <= n:
            n -= len(base)
            out.pop()
        else:
            out[-1] = {"base": base[:-n]}
            n = 0
    return out


def _plus(segs, kana_tail):
    out = [dict(s) for s in segs]
    if out and "ruby" not in out[-1]:
        out[-1] = {"base": out[-1]["base"] + kana_tail}
    else:
        out.append({"base": kana_tail})
    return out


def inflection_keys(surface, kana, pos, segs):
    """(key, kana, segments) of the inflected stems of a verb or い-adjective whose surface has kanji."""
    if not HAN.search(surface) or segs is None:
        return []
    out = []

    def add(drop, tail, ruby=None):
        base = _drop_tail(segs, drop)
        if base is None:
            return
        if ruby is not None:
            idx = max(i for i, s in enumerate(base) if "ruby" in s)
            base[idx] = {"base": base[idx]["base"], "ruby": ruby}
        new = _plus(base, tail)
        key = "".join(s["base"] for s in new)
        reading = "".join(s.get("ruby", s["base"]) for s in new)
        out.append((key, reading, new))

    if pos == "verb":
        if surface.endswith("する"):
            for t in ("しま", "した", "しに", "して", "しな"):
                add(2, t)
        elif surface.endswith("来る"):
            for t in ("ま", "た", "に", "て"):
                add(1, t, "き")
            add(1, "な", "こ")
        else:
            last = surface[-1]
            if last in GODAN:
                a, i, te, ta = GODAN[last]
                if surface.endswith("行く"):
                    te, ta = "って", "った"
                for t in (i, i + "ま", i + "た", i + "に", te, ta, a + "な"):
                    add(1, t)
            if last == "る":
                # The bare ichidan stem only when it ends in kana (食べ): 見 or 寝 alone would read inside other words.
                stem_kana = len(surface) >= 2 and not HAN.search(surface[-2])
                for t in ("", "ま", "た", "に", "て", "な") if stem_kana else ("ま", "た", "に", "て", "な"):
                    if t or stem_kana:
                        add(1, t)
    elif pos == "adjective" and surface.endswith("い") and kana.endswith("い"):
        for t in ("く", "か"):
            add(1, t)
    return out


class Index:
    """The reading index of the course: its words, its lexicon, then the inflection keys (a stored surface wins)."""

    def __init__(self, lexemes, extra_surfaces=()):
        self.by = {}
        self.single = set()
        for x in lexemes:
            segs = _segments(x["surface"], x.get("reading", {}))
            if segs is not None and x["surface"] not in self.by:
                self.by[x["surface"]] = segs
        # An inflection key two lexemes make with different readings (降り: ふり from 降る, おり from 降りる) is dropped:
        # no furigana is better than a wrong one.
        made, clash = {}, set()
        for x in lexemes:
            segs = self.by.get(x["surface"])
            for key, kana, new in inflection_keys(x["surface"], x.get("reading", {}).get("kana", ""), x["partOfSpeech"], segs):
                if key in self.by:
                    continue
                if key in made and made[key][0] != kana:
                    clash.add(key)
                made.setdefault(key, (kana, new))
        for key, (_k, new) in made.items():
            if key not in clash:
                self.by[key] = new
        self.max = max(len(k) for k in self.by)
        self.single = {k for k, s in self.by.items() if len(k) == 1 and HAN.search(k)}

    def tokens(self, text):
        """Longest-match tokens: (text, segments or None)."""
        out, i = [], 0
        while i < len(text):
            for n in range(min(self.max, len(text) - i), 0, -1):
                w = text[i:i + n]
                segs = self.by.get(w)
                if segs is not None:
                    out.append((w, segs))
                    i += n
                    break
            else:
                out.append((text[i], None))
                i += 1
        return out

    def kana(self, text):
        """The text spelt in kana through the stored readings (kanji not covered stay)."""
        return "".join("".join(s.get("ruby", s["base"]) for s in segs) if segs else t for t, segs in self.tokens(text))

    def mixes(self, text):
        """Every spelling of a text with each kanji word in kanji or in its kana (D-10 review: a dictation accepts the
        mixed spellings of correct orthography, ドアがしまります。ご注意ください。), the text itself first."""
        toks = self.tokens(text)
        options = [[t] if not (segs and HAN.search(t)) else [t, "".join(s.get("ruby", s["base"]) for s in segs)] for t, segs in toks]
        out = [""]
        for opts in options:
            out = [o + x for o in out for x in opts]
        return [x for x in dict.fromkeys(out)]

    def problems(self, text):
        """Reading problems of one Japanese string."""
        found = []
        toks = self.tokens(text)
        for t, segs in toks:
            if segs is None and HAN.search(t):
                found.append(f"kanji {t} has no furigana (not a lexicon surface)")
        for j, (t, segs) in enumerate(toks):
            if t not in self.single:
                continue
            prev = toks[j - 1][0][-1] if j > 0 else ""
            nxt = toks[j + 1][0][0] if j + 1 < len(toks) else ""
            counter = DIGIT.search(prev) and _after_digit_ok(t, prev)
            bad = (HAN.search(prev) and prev + t not in READS_APART) or (HAN.search(nxt) and t + nxt not in READS_APART and not counter)
            if DIGIT.search(prev) and not counter:
                bad = True
            if bad:
                found.append(f"{t} is read {self.by[t][0].get('ruby')} on its own inside {text!r}")
        if re.search(r"何(?:です|で|の|と|だ)", text):
            found.append(f"何 before です/で/の/と is read なん (stored なに): write なん in {text!r}")
        if LATIN.search(text):
            found.append(f"Latin letters in {text!r}")
        return found


# Two characters where a single-kanji word next to another kanji keeps its own reading (時半: じ + はん). P4c: a station
# after a place name keeps えき (大阪駅: おおさか + えき, 名古屋駅: なごや + えき).
READS_APART = {"時半", "万円", "千円", "百円", "阪駅", "屋駅"}
# Counters a digit may precede with the stored ruby still right (the digit carries the sound change: 1回 いっかい).
DIGIT_COUNTERS = {"時": "", "円": "", "歳": "", "枚": "", "個": "", "回": "", "番": "", "台": "", "万": "", "分": "2579", "階": "124567890",
                  "本": "24579", "杯": "24579"}


def _after_digit_ok(t, digit):
    allowed = DIGIT_COUNTERS.get(t)
    if allowed is None:
        return False
    return allowed == "" or digit in allowed


POLITE_END = re.compile(r"(?:です|ます|ません|ました|ませんでした|ましょう|でした|ください|ありません|ませんか|ですか|ますか|でしたか|ましたか|ましょうか|ね|よ|か|ですね|ますね|ですよ|ますよ)$")
PLAIN_END = re.compile(r"(?:[うくぐすつぬぶむる]|た|だ|ない|なかった|たい|かった)$")


def sentence_ends(text):
    """The ends of the sentences of a Japanese string, without punctuation."""
    parts = [p.strip() for p in re.split(r"[。！？!?]", text) if p.strip()]
    return [re.sub(r"[、…\s]+$", "", p) for p in parts]


# ---------------------------------------------------------------- D-10 review (2026-11-03): spellings a learner may fairly
# type or a recogniser writes, which the grader does not fold. ja-check-answers.py reads the same tables, so a key that
# leaves one out is a finding.
# Kana spelling → the kanji spelling the phone keyboard (IME) offers first; the course writes the kana.
IME_SPELLINGS = [("わかり", "分かり"), ("いってきます", "行ってきます"), ("いってきます", "行って来ます"),
                 ("いってらっしゃい", "行ってらっしゃい"), ("かのじょ", "彼女"), ("お疲れさま", "お疲れ様"),
                 ("おつかれさま", "お疲れ様"), ("気をつけ", "気を付け"), ("おねがい", "お願い")]
# An い-adjective of size before a noun has a spoken prenominal form (大きい箱 = 大きな箱).
ADNOMINAL = [("大きい", "大きな"), ("小さい", "小さな")]
NUMERAL_KANJI = "〇一二三四五六七八九"
COUNTERS = ("週間", "時間", "ページ", "人", "つ", "月", "時", "歳", "円", "分", "日", "年", "回", "枚", "本", "杯", "個", "階", "台")
_KANJI_NUM = re.compile(r"[一二三四五六七八九十百千万]+")
_DIGITS = re.compile(r"[0-9]+")
# A kanji numeral that is part of a word, not a number (一緒, 一番 'most'; 一人で 'alone' stays a number: 1人で is fine).
_NOT_A_NUMBER = ("一緒", "一番")


def kanji_number(n):
    """1-99999 in kanji numerals (11 十一, 200 二百, 10000 一万)."""
    if n >= 10000:
        return kanji_number(n // 10000) + "万" + (kanji_number(n % 10000) if n % 10000 else "")
    out = ""
    for value, sign in ((1000, "千"), (100, "百"), (10, "十")):
        d = n // value
        n %= value
        if d:
            out += ("" if d == 1 else NUMERAL_KANJI[d]) + sign
    return out + (NUMERAL_KANJI[n] if n else "")


def number_of_kanji(s):
    """The value of a kanji numeral run, or None."""
    total, part, digit = 0, 0, None
    for ch in s:
        if ch in NUMERAL_KANJI:
            digit = NUMERAL_KANJI.index(ch)
        elif ch in "十百千":
            part += (digit if digit is not None else 1) * {"十": 10, "百": 100, "千": 1000}[ch]
            digit = None
        elif ch == "万":
            total += (part + (digit or 0) or 1) * 10000
            part, digit = 0, None
        else:
            return None
    return total + part + (digit or 0)


def numeral_spellings(text):
    """The other spellings of every number before a counter: 11時 ⇄ 十一時, 三つ ⇄ 3つ, 1万円 ⇄ 一万円 / 10000円."""
    out = []
    for m in _DIGITS.finditer(text):
        rest = text[m.end():]
        if rest.startswith(COUNTERS) or rest.startswith("万"):
            n = int(m.group())
            if 0 < n < 100000:
                out.append(text[:m.start()] + kanji_number(n) + rest)
    for m in _KANJI_NUM.finditer(text):
        rest = text[m.end():]
        if not rest.startswith(COUNTERS) or text[m.start():].startswith(_NOT_A_NUMBER):
            continue
        n = number_of_kanji(m.group())
        if n:
            out.append(text[:m.start()] + str(n) + rest)
            if "万" in m.group() and n % 10000 == 0:
                out.append(text[:m.start()] + str(n // 10000) + "万" + rest)
    return out


def natural_spellings(text):
    """IME kanji spellings and the prenominal 大きな / 小さな of one accepted answer (none when it has neither)."""
    out = []
    for kana, kanji in IME_SPELLINGS:
        if kana in text:
            out.append(text.replace(kana, kanji))
    for adj, pre in ADNOMINAL:
        if re.search(rf"{adj}[一-鿿ァ-ヺ]", text):
            out.append(re.sub(rf"{adj}(?=[一-鿿ァ-ヺ])", pre, text))
    return out


# The first person the Vietnamese prompt states and Japanese may drop: "Tôi uống nước." (subject) → わたしは水を飲みます;
# "Bố tôi …" / "Sở thích của tôi …" (owner) → わたしの父は… A verb of asking ("Cho tôi nước") is no owner.
VI_SUBJECT = re.compile(r"^(?:(?:Hôm nay|Hôm qua|Ngày mai|Mai|Sáng nay|Tối nay|Tuần trước|Tuần sau)\s+)?Tôi\s")
VI_OWNER = re.compile(r"^(?!(?:Tôi|Cho|Hãy|Xin|Nhờ|Mời|Gọi|Giúp)\b)[^\s.,!?]+(?:\s[^\s.,!?]+)?\s(?:của\s)?tôi\b")
TIMES = sorted(["今日", "明日", "昨日", "今", "今朝", "今晩", "今週", "来週", "先週", "毎日", "毎朝", "週末", "今年", "来年", "去年",
                "おととい", "あさって"], key=len, reverse=True)
_TOPIC_TIME = re.compile(rf"^({'|'.join(TIMES)})(は|、)(.+)$")


def subject_spellings(vi, key):
    """わたしは / わたしの in front of a key whose Vietnamese prompt says "Tôi …" or "<noun> tôi …" (none for a set phrase:
    a key with no particle, わかりません, いってきます)."""
    if key.startswith(("わたし", "私")):
        return []
    if VI_OWNER.search(vi) and re.match(r"^[^、。]+?は", key):
        return ["わたしの" + key]
    if VI_SUBJECT.search(vi) and re.search(r"[をにへでがはもと]|から", key):
        out = ["わたしは" + key]
        m = _TOPIC_TIME.match(key)
        if m:
            out.append(m.group(1) + "、わたしは" + m.group(3))
        return out
    return []


def topic_spellings(key):
    """A leading time word with or without は: 昨日は暑かったです ⇄ 昨日、暑かったです (the grader strips the comma)."""
    m = _TOPIC_TIME.match(key)
    if not m or m.group(3).startswith(("は", "、")) or (m.group(1).startswith("毎") and m.group(2) == "、"):
        return []  # 毎日は… is contrastive, not the plain sentence
    return [m.group(1) + ("、" if m.group(2) == "は" else "は") + m.group(3)]


def widen(answers):
    """Every accepted answer plus its numeral, IME and prenominal spellings, in order, without repeats."""
    out = []
    for a in answers:
        for x in [a] + numeral_spellings(a) + natural_spellings(a):
            if x not in out:
                out.append(x)
    return out


def load_lexicon(root):
    return json.load(open(f"{root}/content/ja/lexicon/lexemes.json", encoding="utf-8"))["lexemes"]


def taught_kanji(root):
    return set(json.load(open(os.path.join(root, "content/ja/_drafts/review/kanji.json"), encoding="utf-8"))["taught"])

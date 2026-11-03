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
# after a place name keeps えき (大阪駅: おおさか + えき).
READS_APART = {"時半", "万円", "千円", "百円", "阪駅"}
# Counters a digit may precede with the stored ruby still right (the digit carries the sound change: 1回 いっかい).
DIGIT_COUNTERS = {"時": "", "円": "", "歳": "", "枚": "", "個": "", "回": "", "番": "", "台": "", "万": "", "分": "2579", "階": "124567890"}


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


def load_lexicon(root):
    return json.load(open(f"{root}/content/ja/lexicon/lexemes.json", encoding="utf-8"))["lexemes"]


def taught_kanji(root):
    return set(json.load(open(os.path.join(root, "content/ja/_drafts/review/kanji.json"), encoding="utf-8"))["taught"])

"""Korean text rules of the ko-vi generators (lessons, concepts, self-check), after ja_text.py.

 - Hangul arithmetic: split / join a syllable block, its final consonant (받침).
 - A conjugator for the verbs and adjectives of the lexicon: the 해요체 present, past, future, the honorific (으)세요, the
   합쇼체 (ㅂ니다 / 습니다), the connective and modifier forms the course uses, with the irregular stems (ㅂ, ㄷ, ㅅ, 르,
   ㅎ, 으, ㄹ, 하다). Each form knows its lemma and its kind (haeyo, formal, banmal, connective, modifier).
 - Index.problems(text): every word of a Korean string is a lexicon surface, a form of a lexicon verb, a noun with its
   particles or copula (allomorph by the final consonant: 은/는, 이/가, 을/를, 과/와, (으)로, 이에요/예요), a name, a
   number (digits or Hangul) with its counter, or one of the few grammar words below; Hangul only (digits allowed);
   sino numbers never stand before a native counter (삼 시) and native ones never before a sino counter (다섯 원).
 - variants(vi, ko): the other renderings a learner may fairly type (D-10 patterns of ja-vi, REVIEW-AI.md): the subject
   or owner the Vietnamese states (저는 … / …; 우리 / 저희 / 제 아버지), numbers in digits or Hangul (세 시 ⇄ 3시),
   안 V ⇄ V-지 않아요, 못 V ⇄ V-지 못해요, an object particle dropped before its verb, 이/가 dropped before 있어요 /
   없어요, a leading time word with or without 은/는, 이거 ⇄ 이것, 하고 ⇄ 와/과 ⇄ (이)랑, 에게 ⇄ 한테.
"""
import json, os, re

S0, NV, NT = 0xAC00, 21, 28
# Final consonant indices (종성).
T_K, T_N, T_D, T_L, T_M, T_B, T_S, T_SS, T_NG, T_H = 1, 4, 7, 8, 16, 17, 19, 20, 21, 27
V_A, V_AE, V_YA, V_EO, V_E, V_YEO, V_O, V_WA, V_WAE, V_OE, V_YO, V_U, V_WO, V_WI, V_EU, V_I = 0, 1, 2, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 16, 18, 20
L_R = 5
HANGUL = re.compile(r"[가-힣]")


def is_syl(ch):
    return "가" <= ch <= "힣"


def split(ch):
    c = ord(ch) - S0
    return c // (NV * NT), (c % (NV * NT)) // NT, c % NT


def join(l, v, t=0):
    return chr(S0 + (l * NV + v) * NT + t)


def final(ch):
    return split(ch)[2] if is_syl(ch) else 0


def with_final(word, t):
    l, v, _ = split(word[-1])
    return word[:-1] + join(l, v, t)


def bright(v):
    return v in (V_A, V_YA, V_O, V_YO)


# Sino reading of a digit, for the allomorph after a number written in digits (3시 → 시; 010-1234-5678 → 팔).
DIGIT_SYL = {"0": "영", "1": "일", "2": "이", "3": "삼", "4": "사", "5": "오", "6": "육", "7": "칠", "8": "팔", "9": "구"}


def ends_in_consonant(word):
    """Whether a word closes on a final consonant (받침); digits read in Sino-Korean."""
    w = word.rstrip(".,?!")
    if not w:
        return False
    ch = w[-1]
    if ch in DIGIT_SYL:
        return final(DIGIT_SYL[ch]) != 0
    return final(ch) != 0


# ---------------------------------------------------------------- the conjugator
IRREG_B = {"덥다", "춥다", "가깝다", "어렵다", "쉽다", "무겁다", "가볍다", "뜨겁다", "차갑다", "맵다", "더럽다", "시끄럽다", "어둡다", "귀엽다",
           "아름답다", "반갑다", "고맙다", "외롭다", "무섭다", "부럽다", "두껍다", "미끄럽다", "가렵다", "돕다"}
IRREG_D = {"걷다", "듣다"}
IRREG_S = {"낫다"}
IRREG_H = {"그렇다", "어떻다", "이렇다", "저렇다", "빨갛다", "파랗다", "노랗다", "하얗다", "까맣다"}
REGULAR_REU = {"따르다", "치르다"}


def _contract(stem):
    """The 아/어 form of a regular stem (가 → 가, 오 → 와, 마시 → 마셔, 쓰 → 써, 바쁘 → 바빠, 먹 → 먹어)."""
    head, last = stem[:-1], stem[-1]
    l, v, t = split(last)
    if t:
        return stem + ("아" if bright(v) else "어")
    if v in (V_A, V_EO, V_AE, V_E, V_YEO):
        return stem
    if v == V_O:
        return head + join(l, V_WA)
    if v == V_U:
        return head + join(l, V_WO)
    if v == V_I:
        return head + join(l, V_YEO)
    if v == V_OE:
        return head + join(l, V_WAE)
    if v == V_EU:
        pv = split(head[-1])[1] if head else V_EO
        return head + join(l, V_A if bright(pv) else V_EO)
    return stem + ("아" if bright(v) else "어")


def aeo(lemma):
    """The 아/어 form (the base of 해요, 했어요, 해서, 해 주세요)."""
    s = lemma[:-1]
    if s.endswith("하"):
        return s[:-1] + "해"
    if lemma == "아니다":
        return "아니어"
    if lemma in IRREG_B:
        l, v, _ = split(s[-1])
        return s[:-1] + join(l, v) + ("와" if lemma == "돕다" else "워")
    if lemma in IRREG_D:
        l, v, _ = split(s[-1])
        return s[:-1] + join(l, v, T_L) + ("아" if bright(v) else "어")
    if lemma in IRREG_S:
        l, v, _ = split(s[-1])
        return s[:-1] + join(l, v) + ("아" if bright(v) else "어")
    if lemma in IRREG_H:
        l, v, _ = split(s[-1])
        nv = 3 if v == V_YA else V_AE  # 하얗 → 하얘, 그렇 → 그래, 빨갛 → 빨개
        return s[:-1] + join(l, nv)
    if s.endswith("르") and len(s) >= 2 and lemma not in REGULAR_REU:
        pl, pv, pt = split(s[-2])
        return s[:-2] + join(pl, pv, T_L) + ("라" if bright(pv) else "러")
    return _contract(s)


def _eu_base(lemma):
    """(stem, joins) for the (으) endings: the stem the ending attaches to and whether it needs 으 first."""
    s = lemma[:-1]
    t = final(s[-1])
    if lemma in IRREG_B:
        l, v, _ = split(s[-1])
        return s[:-1] + join(l, v) + "우", False
    if lemma in IRREG_D:
        l, v, _ = split(s[-1])
        return s[:-1] + join(l, v, T_L), True
    if lemma in IRREG_S:
        l, v, _ = split(s[-1])
        return s[:-1] + join(l, v), True
    if lemma in IRREG_H:
        l, v, _ = split(s[-1])
        return s[:-1] + join(l, v), False
    if t == 0:
        return s, False
    if t == T_L:
        return s, False  # ㄹ stems: ㄹ drops before ㄴ ㅂ ㅅ, stays before 면 / 러, merges with ㄹ
    return s, True


def _eu(lemma, ending):
    """Attach a (으) ending: ending is one of 'ㄴ', 'ㄹ', '세요', '셨어요', '십시오', '면', '러', 'ㄹ게요', 'ㄹ까요', '니까'."""
    base, need = _eu_base(lemma)
    lstem = final(base[-1]) == T_L and lemma not in IRREG_D
    if ending in ("ㄴ", "ㄹ"):
        t = T_N if ending == "ㄴ" else T_L
        if need:
            return base + join(11, V_EU, t)  # 은 / 을
        if lstem:
            return with_final(base, t)  # 살 → 산 / 살
        return with_final(base, t)
    if ending in ("ㄹ게요", "ㄹ까요"):
        return _eu(lemma, "ㄹ") + ending[1:]
    if lstem and ending in ("세요", "셨어요", "십시오", "니까"):
        base = with_final(base, 0)  # 살 → 사세요
    return base + ("으" if need else "") + ending


def _formal(lemma, question=False):
    s = lemma[:-1]
    end = "니까" if question else "니다"
    if lemma == "아니다":
        return "아닙" + end
    t = final(s[-1])
    if t == 0:
        return with_final(s, T_B) + end
    if t == T_L:
        return with_final(with_final(s, 0), T_B) + end
    return s + "습" + end


def _past(lemma):
    a = aeo(lemma)
    if lemma == "아니다":
        a = "아니었"
        return a
    return with_final(a, T_SS)


def conjugate(lemma, pos="verb"):
    """{form: kind} for one verb or adjective. A form with a space is several words (갈 거예요)."""
    if not lemma.endswith("다") or len(lemma) < 2 or not all(is_syl(c) for c in lemma):
        return {}
    s = lemma[:-1]
    out = {}
    adj = pos == "adjective" and not (s.endswith("있") or s.endswith("없"))

    def add(form, kind):
        out.setdefault(form, kind)

    a = aeo(lemma)
    past = _past(lemma)
    if lemma == "아니다":
        add("아니에요", "haeyo")
        add("아니요", "haeyo")
    else:
        add(a + "요", "haeyo")
    add(past + "어요", "haeyo")
    add(_formal(lemma), "formal")
    add(_formal(lemma, True), "formal")
    add(past + "습니다", "formal")
    add(past + "습니까", "formal")
    add(lemma, "banmal")
    add(a, "aeo")  # 반말 present, and the base of -아/어 주세요, -아/어도, -아/어야
    add(past + "어", "banmal")
    add(_eu(lemma, "ㄹ") + " 거예요", "haeyo")
    add(_eu(lemma, "ㄹ") + " 거예요?", "haeyo")
    add(_eu(lemma, "ㄹ게요"), "haeyo")
    add(_eu(lemma, "ㄹ까요"), "haeyo")
    add(_eu(lemma, "세요"), "haeyo")
    add(_eu(lemma, "셨어요"), "haeyo")
    add(_eu(lemma, "십시오"), "formal")
    add(_eu(lemma, "면"), "connective")
    add(_eu(lemma, "러"), "connective")
    add(_eu(lemma, "니까"), "connective")
    if not (s.endswith("있") or s.endswith("없")):
        add(_eu(lemma, "ㄴ"), "modifier")  # past modifier of a verb, present modifier of an adjective
    add(_eu(lemma, "ㄹ"), "modifier")
    if s.endswith("있") or s.endswith("없"):
        add(s + "는", "modifier")
    elif adj:
        pass  # an adjective has no 는 modifier (추운, never 춥는)
    elif final(s[-1]) == T_L and lemma not in IRREG_D:
        add(with_final(s, 0) + "는", "modifier")
    else:
        add(s + "는", "modifier")
    for ending in ("고", "지", "지만", "기"):
        add(s + ending, "connective")
    for ending in ("서", "도", "야"):
        add(a + ending, "connective")
    if lemma == "아니다":
        add("아니라", "connective")
    return out


# Honorific and suppletive forms the course uses (먹다 / 마시다 → 드세요, 있다 → 계세요, 자다 → 주무세요).
SUPPLETIVE = {"드세요": "haeyo", "드셨어요": "haeyo", "계세요": "haeyo", "계셨어요": "haeyo", "계십니다": "formal", "주무세요": "haeyo",
              "드십시오": "formal", "말씀하세요": "haeyo"}
# Grammar words that are not lexemes of their own: auxiliaries and the dependent nouns of the patterns taught.
GRAMMAR = {
    "거예요": "haeyo", "거예요?": "haeyo", "겁니다": "formal", "겁니까": "formal", "거": "noun", "것": "noun", "수": "noun", "때": "noun",
    "싶어요": "haeyo", "싶었어요": "haeyo", "싶습니다": "formal", "싶어서": "connective", "싶지만": "connective",
    "않아요": "haeyo", "않았어요": "haeyo", "않습니다": "formal", "않습니까": "formal", "않으세요": "haeyo", "싶습니까": "formal", "못합니까": "formal",
    "안녕하십니까": "formal",
    "마세요": "haeyo", "마십시오": "formal", "못해요": "haeyo", "못했어요": "haeyo", "못합니다": "formal",
    "있어요": "haeyo", "있었어요": "haeyo",
}
NOUN_POS = {"noun", "pronoun"}
PARTICLES = ["에서부터", "에서는", "에서도", "에게서", "한테서", "까지는", "부터는", "하고는", "에게는", "한테는", "에는", "에도", "에서", "에게", "한테",
             "까지", "부터", "하고", "처럼", "이랑", "으로", "보다", "께서", "마다", "밖에", "은", "는", "이", "가", "을", "를", "에", "도", "만", "의",
             "와", "과", "랑", "로", "께", "요"]
# Allomorphs: (particle, needs a final consonant). 로 also follows ㄹ.
NEEDS_FINAL = {"은": True, "는": False, "이": True, "가": False, "을": True, "를": False, "과": True, "와": False, "이랑": True, "랑": False,
               "으로": True, "로": False}
COPULA = {"이에요": True, "예요": False, "이었어요": True, "였어요": False, "이세요": True, "세요": False, "입니다": None, "입니까": None,
          "이었습니다": True, "였습니다": False, "이고": None, "고": False, "이지만": None, "지만": False, "일": None, "인": None,
          "이에요?": True, "예요?": False, "이야": True, "야": False}
NATIVE_COUNTERS = {"시", "명", "살", "개", "병", "잔", "장", "권", "마리", "대", "시간", "그릇", "사람", "달"}
SINO_COUNTERS = {"원", "층", "월", "년", "호선", "인분", "일"}
SINO_NUM = re.compile(r"^[일이삼사오육칠팔구십백천만]+$")
SINO_COUNTED = re.compile(r"^[일이삼사오육칠팔구십백천만]+(?:월|일|년|층|원|분|번|호선|인분)$")
NATIVE_PLAIN = {"하나", "둘", "셋", "넷", "다섯", "여섯", "일곱", "여덟", "아홉", "열", "스물", "서른", "마흔", "쉰"}
NATIVE_ATTR = {"한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉", "열", "스무", "열한", "열두", "열세", "열네", "스물한", "스물두",
               "스물세", "스물네", "서른", "마흔", "쉰", "열다섯", "스물다섯"}
DIGITS = re.compile(r"^(\d[\d,\-]*)(.*)$")
COUNTER_NAMES = sorted(NATIVE_COUNTERS | SINO_COUNTERS | {"분", "번", "주", "개월", "층", "번째"}, key=len, reverse=True)
NAMES = ["민수", "지영", "수진", "준호", "김", "박", "흐엉", "남", "란", "민", "투이", "응우옌", "호찌민", "하노이", "서울", "부산", "인천", "안산", "수원",
         "화성", "흐엉", "호아", "뚜언", "린", "김민수", "이지영", "박준호", "응우옌 남", "다낭"]


def load_lexicon(root):
    path = f"{root}/content/ko/_drafts/staged/content/ko/lexicon/lexemes.json"
    return json.load(open(path, encoding="utf-8"))["lexemes"]


class Index:
    def __init__(self, lexemes):
        self.lex = {x["surface"]: x for x in lexemes}
        self.forms = {}  # word → (lemma, kind)
        self.nouns = set(NAMES)
        self.words = set()
        for x in lexemes:
            surf, pos = x["surface"], x["partOfSpeech"]
            if pos in ("verb", "adjective") and surf.endswith("다") and " " not in surf:
                for form, kind in conjugate(surf, pos).items():
                    parts = form.split(" ")
                    self.forms.setdefault(parts[0], (surf, kind if len(parts) == 1 else "modifier"))
            if " " in surf:
                for w in surf.split(" "):
                    self.words.add(w)
            else:
                self.words.add(surf)
            if pos in NOUN_POS or (pos == "other" and surf in ("명", "시", "분", "살", "병", "잔", "장", "권", "마리", "대", "번", "층", "씨", "님")):
                self.nouns.add(surf)
            if pos == "noun" and " " in surf:
                self.nouns.add(surf.split(" ")[-1])
        for w, k in {**SUPPLETIVE, **GRAMMAR}.items():
            self.forms.setdefault(w, (w, k))
        for w in ("거", "것", "수", "때"):
            self.nouns.add(w)
        # 저 / 나 / 누구 + 가 contract: 제가, 내가, 누가 (the particle check rejects 저가, 누구가)
        self.words |= {"제가", "내가", "누가"}
        self.adverbs = {x["surface"] for x in lexemes if x["partOfSpeech"] in ("adverb", "determiner", "interjection", "conjunction")}

    # -------------------------------------------------------------- one word
    def number_word(self, w):
        return bool(SINO_NUM.match(w)) or w in NATIVE_PLAIN or w in NATIVE_ATTR or self.compound_native(w)

    @staticmethod
    def compound_native(w):
        for tens in ("열", "스물", "서른", "마흔", "쉰"):
            if w.startswith(tens) and w[len(tens):] in NATIVE_PLAIN | {"한", "두", "세", "네"}:
                return True
        return False

    def nounish(self, w):
        if w in self.nouns or self.number_word(w):
            return True
        # a Sino-Korean number written together with its counter: 삼월, 오일, 십 분 → 십분 (dates are written solid)
        if SINO_COUNTED.match(w) or w in ("유월", "시월"):
            return True
        m = DIGITS.match(w)
        if m:
            rest = m.group(2)
            return rest == "" or rest in COUNTER_NAMES
        # a name + 씨 / 님 written together (흐엉씨) is still a name
        return False

    def copula_ok(self, w):
        """N + copula; returns None when not a copula form, else a problem string or ''."""
        for cop in sorted(COPULA, key=len, reverse=True):
            if w.endswith(cop) and len(w) > len(cop):
                base = w[: -len(cop)]
                if not self.nounish(base):
                    continue
                need = COPULA[cop]
                if need is not None and ends_in_consonant(base) != need:
                    if cop in ("고", "지만") and need is False and ends_in_consonant(base):
                        continue
                    if cop in ("세요",) and ends_in_consonant(base):
                        continue
                    return f"copula {cop!r} after {base!r} (use {'이에요' if ends_in_consonant(base) else '예요'} by the final consonant)"
                return ""
        return None

    def particle_problem(self, base, p):
        need = NEEDS_FINAL.get(p)
        if need is None:
            return ""
        has = ends_in_consonant(base)
        if p == "로" and has and final(base[-1]) == T_L:
            return ""
        if p == "으로" and final(base[-1]) == T_L:
            return f"{base}{p}: after ㄹ the particle is 로"
        if p == "가" and base in ("저", "나", "누구"):
            return f"{base}가: say {'제가' if base == '저' else '내가' if base == '나' else '누가'}"
        if has != need:
            return f"{base}{p}: the particle after {'a final consonant' if has else 'a vowel'} is {_other(p)}"
        return ""

    def word_problems(self, w, depth=0):
        """'' when the word is fine, else why not. w is one eojeol without punctuation."""
        if w in self.words or w in self.forms or self.nounish(w):
            return ""
        c = self.copula_ok(w)
        if c is not None:
            return c
        if depth > 1:
            return f"{w!r} is not a lexicon word, a form of one, or a noun with its particles"
        # particles, up to two (에서는, 까지도 …), after a noun, a number, an adverb or a name; 요 after any word (저도요)
        for p in PARTICLES:
            if not (w.endswith(p) and len(w) > len(p)):
                continue
            base = w[: -len(p)]
            if p == "요":
                if self.word_problems(base, depth + 1) == "":
                    return ""
                continue
            if self.nounish(base) or (base in self.words and base not in self.forms):
                return self.particle_problem(base, p)
            for p2 in PARTICLES:
                if p2 != "요" and base.endswith(p2) and len(base) > len(p2):
                    b2 = base[: -len(p2)]
                    if self.nounish(b2) or (b2 in self.words and b2 not in self.forms):
                        return self.particle_problem(b2, p2)
        return f"{w!r} is not a lexicon word, a form of one, or a noun with its particles"

    # -------------------------------------------------------------- a string
    def tokens(self, text):
        text = re.sub(r"(?<=\d),(?=\d)", "", text)  # 5,000원 is one word
        return [t for t in re.split(r"[\s.,?!~:;\"'()…·/]+", text) if t]

    def problems(self, text):
        out = []
        if re.search(r"[A-Za-z]", text):
            out.append(f"{text!r}: Latin letters in Korean text")
        if re.search(r"[一-鿿]", text):
            out.append(f"{text!r}: hanja in Korean text")
        if re.search(r"[ㄱ-ㅣ]", text):
            out.append(f"{text!r}: a loose jamo in Korean text")
        toks = self.tokens(text)
        for t in toks:
            p = self.word_problems(t)
            if p:
                out.append(p)
        out += self.number_problems(toks)
        return out

    def base_of(self, w):
        """A word without its particles / copula (for the number rule)."""
        for cop in sorted(COPULA, key=len, reverse=True):
            if w.endswith(cop) and self.nounish(w[: -len(cop)]):
                return w[: -len(cop)]
        for p in PARTICLES:
            if w.endswith(p) and self.nounish(w[: -len(p)]):
                return w[: -len(p)]
        return w

    def number_problems(self, toks):
        out = []
        for a, b in zip(toks, toks[1:]):
            nb = self.base_of(b)
            if nb in NATIVE_COUNTERS and nb != "달":
                if SINO_NUM.match(a) and a not in ("이",):
                    out.append(f"{a} {b}: {nb} counts with native numbers (한, 두, 세 …), not {a}")
                if a in ("하나", "둘", "셋", "넷", "스물"):
                    out.append(f"{a} {b}: before a counter the native number is {_attr(a)}")
            if nb in SINO_COUNTERS and nb != "일":
                if a in NATIVE_ATTR or a in NATIVE_PLAIN:
                    out.append(f"{a} {b}: {nb} counts with Sino-Korean numbers (일, 이, 삼 …), not {a}")
        return out

    # -------------------------------------------------------------- speech level
    def sentence_ends(self, text):
        """(last word, kind) of each sentence; kind is haeyo / formal / banmal / fragment."""
        out = []
        for sent in re.split(r"(?<=[.?!])\s+", text.strip()):
            toks = self.tokens(sent)
            if not toks:
                continue
            last = toks[-1]
            out.append((last, self.kind(last)))
        return out

    def kind(self, w):
        if w.endswith("요") or w.endswith("니다") or w.endswith("니까") or w.endswith("시오"):
            return "formal" if (w.endswith("니다") or w.endswith("니까") or w.endswith("시오")) else "haeyo"
        if w in self.forms:
            k = self.forms[w][1]
            if k in ("banmal", "aeo", "connective"):
                return "banmal"
            return k
        if w == "안녕" or w.endswith("야"):
            return "banmal"
        return "fragment"


def _other(p):
    pairs = {"은": "는", "는": "은", "이": "가", "가": "이", "을": "를", "를": "을", "과": "와", "와": "과", "이랑": "랑", "랑": "이랑", "으로": "로", "로": "으로"}
    return pairs.get(p, p)


def _attr(n):
    return {"하나": "한", "둘": "두", "셋": "세", "넷": "네", "스물": "스무"}.get(n, n)


# ---------------------------------------------------------------- numbers
SINO_VAL = {"일": 1, "이": 2, "삼": 3, "사": 4, "오": 5, "육": 6, "칠": 7, "팔": 8, "구": 9}
NATIVE_VAL = {"한": 1, "하나": 1, "두": 2, "둘": 2, "세": 3, "셋": 3, "네": 4, "넷": 4, "다섯": 5, "여섯": 6, "일곱": 7, "여덟": 8, "아홉": 9}
NATIVE_TENS = {"열": 10, "스물": 20, "스무": 20, "서른": 30, "마흔": 40, "쉰": 50}


def sino_value(w):
    if not SINO_NUM.match(w):
        return None
    total, cur, big = 0, 0, 0
    for ch in w:
        if ch in SINO_VAL:
            cur = SINO_VAL[ch]
        elif ch == "십":
            total += (cur or 1) * 10
            cur = 0
        elif ch == "백":
            total += (cur or 1) * 100
            cur = 0
        elif ch == "천":
            total += (cur or 1) * 1000
            cur = 0
        elif ch == "만":
            big += (total + cur or 1) * 10000
            total, cur = 0, 0
    return big + total + cur


def native_value(w):
    if w in NATIVE_VAL:
        return NATIVE_VAL[w]
    if w in NATIVE_TENS:
        return NATIVE_TENS[w]
    for t, v in NATIVE_TENS.items():
        if w.startswith(t) and w[len(t):] in NATIVE_VAL:
            return v + NATIVE_VAL[w[len(t):]]
    return None


def digits_of(n, comma):
    s = str(n)
    if comma and n >= 1000:
        s = f"{n:,}"
    return s


def number_spellings(ko):
    """세 시 ⇄ 3시, 오천 원 ⇄ 5,000원 ⇄ 5000원, 두 명 ⇄ 2명, 3시 → 세 시, 5,000원 → 오천 원."""
    out = set()
    toks = ko.split(" ")
    for i in range(len(toks) - 1):
        a, b = toks[i], toks[i + 1]
        counter = next((c for c in COUNTER_NAMES if b.startswith(c)), None)
        if counter is None:
            continue
        v = native_value(a) if counter in NATIVE_COUNTERS else sino_value(a)
        if v is None and counter in ("분", "번", "주", "개월", "번째"):
            v = sino_value(a) if counter != "번째" else native_value(a)
        if v is None:
            continue
        for comma in (True, False):
            out.add(" ".join(toks[:i] + [digits_of(v, comma) + b] + toks[i + 2:]))
    for i, t in enumerate(toks):
        m = DIGITS.match(t)
        if not m or "-" in m.group(1):
            continue
        num = int(m.group(1).replace(",", ""))
        rest = m.group(2)
        counter = next((c for c in COUNTER_NAMES if rest.startswith(c)), None)
        if counter is None:
            continue
        if counter in NATIVE_COUNTERS and 1 <= num <= 59:
            word = _native_attr(num)
        elif counter in NATIVE_COUNTERS:
            continue
        else:
            word = _sino(num)
        out.add(" ".join(toks[:i] + [word, rest] + toks[i + 1:]))
        if comma_free := m.group(1).replace(",", ""):
            if comma_free != m.group(1):
                out.add(" ".join(toks[:i] + [comma_free + rest] + toks[i + 1:]))
            elif num >= 1000:
                out.add(" ".join(toks[:i] + [f"{num:,}" + rest] + toks[i + 1:]))
    return sorted(out)


def _native_attr(n):
    units = ["", "한", "두", "세", "네", "다섯", "여섯", "일곱", "여덟", "아홉"]
    tens = ["", "열", "스물", "서른", "마흔", "쉰"]
    if n == 20:
        return "스무"
    return tens[n // 10] + units[n % 10]


def _sino(n):
    digits = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"]
    out = ""
    if n >= 10000:
        m = n // 10000
        out += ("" if m == 1 else _sino(m)) + "만"
        n %= 10000
    for value, name in ((1000, "천"), (100, "백"), (10, "십")):
        d = n // value
        if d:
            out += ("" if d == 1 else digits[d]) + name
        n %= value
    return out + digits[n] if (out or n) else "영"


# ---------------------------------------------------------------- the renderings a learner may type
FAMILY = {"아버지", "어머니", "아빠", "엄마", "부모님", "형", "오빠", "누나", "언니", "동생", "남동생", "여동생", "할아버지", "할머니", "남편", "아내", "아들",
          "딸", "가족", "형제", "아기"}
OWNED = {"회사", "집", "고향", "나라", "반장님", "사장님", "방", "기숙사", "공장"}
TIME_LEAD = ["오늘", "내일", "어제", "지금", "요즘", "주말에", "아침에", "저녁에", "오전에", "오후에", "밤에", "이번 주에", "다음 주에", "월요일에",
             "토요일에", "일요일에", "평일에"]


def _bare(s):
    return re.sub(r"[.,?!\s]", "", s)


def topic(word):
    return word + ("은" if ends_in_consonant(word) else "는")


def subj(word):
    return word + ("이" if ends_in_consonant(word) else "가")


def obj(word):
    return word + ("을" if ends_in_consonant(word) else "를")


def wa(word):
    return word + ("과" if ends_in_consonant(word) else "와")


def _subject_forms(vi, ko, index):
    out = []
    v = vi.strip().lstrip("\"“")
    toks = ko.split(" ")
    states_i = bool(re.match(r"^(?:Tôi|Em|Mình)\b", v)) or bool(re.search(r"[.,!?:] (?:Tôi|tôi) ", v))
    if toks and toks[0] in ("저는", "제가") and len(toks) > 1:
        out.append(" ".join(toks[1:]))
    if toks and toks[0] in ("우리는", "저희는") and len(toks) > 1:
        out.append(" ".join(toks[1:]))
        out.append(" ".join(["저희는" if toks[0] == "우리는" else "우리는"] + toks[1:]))
    # 저는 added in front: never before a set phrase or an interjection (알겠습니다, 여보세요, 네), never twice
    first = re.sub(r"[,.?!]+$", "", toks[0]) if toks else ""
    set_phrase = re.sub(r"[.?!]+$", "", ko) in index.lex or (first in index.lex and index.lex[first]["partOfSpeech"] in ("expression", "interjection"))
    if states_i and toks and not set_phrase and not re.search(r"(^|\s)(저는|제가|저도|저희|우리)", ko):
        out.append("저는 " + ko)
    # 제 / 우리 / 저희 / nothing before a family word or a place one owns (제 아버지 ⇄ 우리 아버지 ⇄ 아버지)
    for i, t in enumerate(toks[:-1]):
        nxt = toks[i + 1]
        head = re.sub(r"(은|는|이|가|을|를|에|에서|도|의)$", "", nxt)
        if t in ("제", "우리", "저희") and (head in FAMILY or head in OWNED):
            for alt in ("제", "우리", "저희", None):
                if alt == t or (alt == "제" and head in OWNED and head not in ("방", "고향", "나라")):
                    continue
                out.append(" ".join(toks[:i] + ([alt] if alt else []) + toks[i + 1:]))
    if toks and toks[0] == "제" and len(toks) > 2 and toks[1] == "이름은":
        rest = toks[2:]
        out.append(" ".join(["이름은"] + rest))
        out.append(" ".join(["저는"] + rest))
        out.append(" ".join(rest))
    return out


def _negation_forms(ko, index):
    out = []
    toks = ko.split(" ")
    for i, t in enumerate(toks):
        end = re.match(r"^(.*?)([.?!]*)$", t)
        word, punct = end.group(1), end.group(2)
        # 안 V ⇄ V-지 않아요;  못 V ⇄ V-지 못해요
        if t in ("안", "못") and i + 1 < len(toks):
            nxt = re.match(r"^(.*?)([.?!]*)$", toks[i + 1])
            w2, p2 = nxt.group(1), nxt.group(2)
            info = index.forms.get(w2)
            if not info or info[0] in GRAMMAR:
                continue
            lemma, kind = info
            # 안 돼요 (not allowed) is an idiom: 되지 않아요 says something else; 있다 / 알다 negate as 없다 / 모르다
            if lemma in ("있다", "없다", "알다", "되다") or kind != "haeyo":
                continue
            past = w2.endswith("어요") and with_final(aeo(lemma), T_SS) + "어요" == w2
            pres = aeo(lemma) + "요" == w2
            if not (past or pres):
                continue
            aux = ("않았어요" if past else "않아요") if t == "안" else ("못했어요" if past else "못해요")
            prev = toks[i - 1] if i > 0 else None
            if lemma == "하다" and prev and (prev + "하다") in index.lex:
                out.append(" ".join(toks[: i - 1] + [prev + "하지", aux + p2] + toks[i + 2:]))
            elif lemma != "하다":
                out.append(" ".join(toks[:i] + [lemma[:-1] + "지", aux + p2] + toks[i + 2:]))
        if word.endswith("지") and i + 1 < len(toks):
            nxt = re.match(r"^(.*?)([.?!]*)$", toks[i + 1])
            w2, p2 = nxt.group(1), nxt.group(2)
            if w2 in ("않아요", "않았어요", "못해요", "못했어요"):
                lemma = word[:-1] + "다"
                if lemma not in index.lex:
                    continue
                past = w2 in ("않았어요", "못했어요")
                neg = "안" if w2.startswith("않") else "못"
                if lemma.endswith("하다") and lemma[:-2] in index.lex and lemma != "하다":
                    form = "했어요" if past else "해요"
                    out.append(" ".join(toks[:i] + [lemma[:-2], neg, form + p2] + toks[i + 2:]))
                else:
                    form = (with_final(aeo(lemma), T_SS) + "어요") if past else (aeo(lemma) + "요")
                    out.append(" ".join(toks[:i] + [neg, form + p2] + toks[i + 2:]))
    return out


def _particle_drop_forms(ko, index):
    """An object particle dropped before its verb (물을 마셔요 → 물 마셔요); 이/가 before 있어요 / 없어요."""
    out = []
    toks = ko.split(" ")
    for i in range(len(toks) - 1):
        t, nxt = toks[i], re.sub(r"[.?!]+$", "", toks[i + 1])
        nxt_is_verb = nxt in index.forms or nxt in ("주세요",)
        for p in ("을", "를"):
            if t.endswith(p) and index.nounish(t[: -len(p)]) and nxt_is_verb and t[: -len(p)] not in ("저", "제"):
                out.append(" ".join(toks[:i] + [t[: -len(p)]] + toks[i + 1:]))
        for p in ("이", "가"):
            if t.endswith(p) and index.nounish(t[: -len(p)]) and re.match(r"^(있|없|아파|아팠)", nxt) and t[: -len(p)] not in ("저", "제"):
                out.append(" ".join(toks[:i] + [t[: -len(p)]] + toks[i + 1:]))
    return out


def _swap_forms(ko, index):
    out = []
    toks = ko.split(" ")
    for i, t in enumerate(toks):
        # 이거 ⇄ 이것 (그거 / 저거 alike), with its particle
        for a, b in (("이거", "이것"), ("그거", "그것"), ("저거", "저것")):
            if t.startswith(a) and (t == a or t[len(a):] in ("는", "를", "도", "예요", "예요?", "가", "요")):
                tail = t[len(a):]
                if tail == "":
                    # bare 이거 is spoken; written, it takes its particle: 이것은 얼마예요? / 이것을 주세요.
                    nxt = toks[i + 1] if i + 1 < len(toks) else ""
                    tail = "은" if re.match(r"^(얼마|뭐|누구|무엇|제|우리|저희)", nxt) or nxt.endswith("예요") or nxt.endswith("이에요") else "을"
                tail = {"는": "은", "를": "을", "가": "이", "예요": "이에요", "예요?": "이에요?"}.get(tail, tail)
                out.append(" ".join(toks[:i] + [b + tail] + toks[i + 1:]))
            if t.startswith(b) and t[len(b):] in ("은", "을", "도", "이에요", "이"):
                tail = {"은": "는", "을": "를", "이에요": "예요", "이": "가"}.get(t[len(b):], t[len(b):])
                out.append(" ".join(toks[:i] + [a + tail] + toks[i + 1:]))
        # 하고 ⇄ 와/과 ⇄ (이)랑 — the particle after a noun, never the -고 of a 하다 verb (공부하고 싶어요)
        if t.endswith("하고") and len(t) > 2 and i + 1 < len(toks):
            base = t[:-2]
            if HANGUL.search(base[-1:]) and index.nounish(base) and t not in index.forms:
                out.append(" ".join(toks[:i] + [wa(base)] + toks[i + 1:]))
                out.append(" ".join(toks[:i] + [base + ("이랑" if ends_in_consonant(base) else "랑")] + toks[i + 1:]))
        for p in ("와", "과"):
            if t.endswith(p) and len(t) > 1 and i + 1 < len(toks) and ends_in_consonant(t[:-1]) == (p == "과") and index.nounish(t[:-1]) and t not in index.forms:
                out.append(" ".join(toks[:i] + [t[:-1] + "하고"] + toks[i + 1:]))
        # 에게 ⇄ 한테
        if t.endswith("에게"):
            out.append(" ".join(toks[:i] + [t[:-2] + "한테"] + toks[i + 1:]))
        if t.endswith("한테"):
            out.append(" ".join(toks[:i] + [t[:-2] + "에게"] + toks[i + 1:]))
    # a leading time word with or without 은/는
    for w in TIME_LEAD:
        if ko.startswith(w + " "):
            out.append(topic(w) + ko[len(w):])
        if ko.startswith(topic(w) + " "):
            out.append(w + ko[len(topic(w)):])
    return out


def _formal_forms(vi, ko, index):
    """The 해요체 key in 합쇼체 (more polite, never wrong to a stranger): 가요 → 갑니다, 갔어요 → 갔습니다, 학생이에요 →
    학생입니다, 조심하세요 → 조심하십시오. Every sentence end at once; a prompt that asks for the familiar style keeps it."""
    if "thân mật" in vi:
        return []
    parts = re.split(r"(?<=[.?!])\s+", ko.strip())
    out = []
    changed = False
    for sent in parts:
        m = re.match(r"^(.*?)([.?!]*)$", sent)
        body, punct = m.group(1), m.group(2)
        toks = body.split(" ")
        last = toks[-1]
        q = punct.startswith("?")
        new = None
        info = index.forms.get(last)
        AUX = {"거예요": "겁니", "싶어요": "싶습니", "않아요": "않습니", "못해요": "못합니", "아니에요": "아닙니"}
        if last == "안녕하세요":
            new = "안녕하십니까"  # the formal greeting is always a question form
            punct = "?" if punct else punct
        elif last in AUX:
            new = AUX[last] + ("까" if q else "다")  # 갈 거예요 → 갈 겁니다 (거 = 것); 가고 싶어요 → 가고 싶습니다
        elif last == "마세요" and not q:
            new = "마십시오"
        elif info and info[0] in index.lex and info[1] == "haeyo":
            lemma = info[0]
            if last == aeo(lemma) + "요" and lemma != "아니다":
                new = _formal(lemma, q)
            elif last == _past(lemma) + "어요":
                new = _past(lemma) + ("습니까" if q else "습니다")
            elif last == _eu(lemma, "세요") and not q:
                new = _eu(lemma, "십시오")
        else:
            for cop, formal in (("이었어요", "이었습니"), ("였어요", "였습니"), ("이에요", "입니"), ("예요", "입니")):
                if last.endswith(cop) and index.nounish(last[: -len(cop)]):
                    new = last[: -len(cop)] + formal + ("까" if q else "다")
                    break
        if new:
            changed = True
            toks[-1] = new
        out.append(" ".join(toks) + punct)
    return [" ".join(out)] if changed else []


TIME_NOUNS = {"오늘", "내일", "어제", "지금", "요즘", "주말", "아침", "저녁", "밤", "오전", "오후", "매일"}


def _topic_subject_forms(ko, index):
    """The one noun of a simple adjective or 있다 / 없다 sentence with 은/는 or with 이/가 (제 방은 깨끗해요 ⇄ 제 방이
    깨끗해요, 봄은 따뜻해요 ⇄ 봄이 따뜻해요). Only a sentence with a single marked noun; never a time word, a counter,
    저 / 나 / 누구, or the negative copula."""
    if re.search(r"[.?!]\s", ko.strip()):
        return []
    toks = ko.split(" ")
    if len(toks) < 2:
        return []
    last = re.sub(r"[.?!]+$", "", toks[-1])
    info = index.forms.get(last)
    if not info or info[0] not in index.lex or info[0] == "아니다":
        return []
    if index.lex[info[0]]["partOfSpeech"] != "adjective" and info[0] not in ("있다", "없다"):
        return []
    marked = [(i, t, a, b) for i, t in enumerate(toks[:-1]) for a, b in (("은", "이"), ("는", "가"), ("이", "은"), ("가", "는"))
              if t.endswith(a) and index.nounish(t[: -len(a)])]
    particled = [t for t in toks[:-1] if any(t.endswith(p) and len(t) > len(p) and index.nounish(t[: -len(p)]) for p in PARTICLES if p != "요")]
    if len(marked) != 1 or len(particled) != 1:
        return []
    i, t, a, b = marked[0]
    base = t[: -len(a)]
    if base in ("저", "나", "누구", "제") or base in TIME_NOUNS or base in COUNTER_NAMES or DIGITS.match(base):
        return []
    return [" ".join(toks[:i] + [base + b] + toks[i + 1:])]


def _counted_object_forms(ko, index):
    """사과 두 개 주세요 → 사과를 두 개 주세요 (the counted noun may take its object particle)."""
    toks = ko.split(" ")
    out = []
    for i in range(len(toks) - 2):
        n, num, cnt = toks[i], toks[i + 1], toks[i + 2]
        # the counter stands alone (두 개, not 두 장이) and the verb takes an object (주세요, 사요)
        if n in index.nouns and (num in NATIVE_ATTR or SINO_NUM.match(num)) and cnt in COUNTER_NAMES:
            rest = " ".join(toks[i + 3:])
            if re.match(r"^(주세요|사요|샀어요)", rest):
                out.append(" ".join(toks[:i] + [obj(n)] + toks[i + 1:]))
    return out


def variants(vi, ko, index, limit=48):
    """The closure of the renderings above (the key first is not repeated)."""
    seen = [ko]
    frontier = [ko]
    while frontier and len(seen) < limit:
        nxt = []
        for k in frontier:
            for x in (_subject_forms(vi, k, index) + number_spellings(k) + _negation_forms(k, index) + _particle_drop_forms(k, index) + _swap_forms(k, index)
                      + _formal_forms(vi, k, index) + _topic_subject_forms(k, index) + _counted_object_forms(k, index)):
                x = re.sub(r"\s+", " ", x).strip()
                if x and x not in seen and _bare(x) not in {_bare(s) for s in seen}:
                    seen.append(x)
                    nxt.append(x)
        frontier = nxt
    return seen[1:limit]


def same_answer(a, b, index, vi=""):
    """Whether b is one of the renderings of a (a distractor that is also correct)."""
    if _bare(a) == _bare(b):
        return True
    return _bare(b) in {_bare(x) for x in variants(vi, a, index, limit=80)}

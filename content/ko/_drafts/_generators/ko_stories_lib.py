"""Shared builder and checker of the ko-vi graded stories (P4e session 4; the ko-stories-NN.py batches import it), after
ja_stories_lib.py.

A sentence is (speaker, Korean text, Vietnamese). Korean is written with spaces, so the story engine (scripts/lib/
stories.ts) cuts a ko sentence with Intl.Segmenter at spaces and punctuation: one token is one eojeol (공장에서, 먹었어요).
The engine resolves a token through the story's tokenMap, the function words, then its lexeme index (each lexeme's
lemma and lookup form, and the verb rows of content/ko/lexicon/derived/morphology.json); multi-word lexemes (잘
먹겠습니다) match first as word sequences. `resolve` and `analyze` port that one for one.

An eojeol is rarely a bare lexicon form (a noun carries its particles, a verb its ending), so `story` works out the
lexeme each authored word IS with ko_text's analysis (a lexeme surface; a conjugated form of a verb or adjective; a
noun, name or number with its particles and the copula) and writes every word the index would not resolve to that
lexeme into the story's tokenMap, explicitly. `word=slug` forces the lexeme ko:w:<slug> (a form two lexemes claim);
a name (ko_text NAMES and the story names here) resolves as a name.

Grading is the engine's: a lexeme's band is its position in the staged syllabus (first / second half of A1, then
the A2-1 list); band A1-0 is the words of the course's first 3 units plus the closed-class lexemes. ≥ 95 % of the
tokens known at the story's band, 3–5 declared new lexemes.

Voices: ko has no clean recorded voice (content/audio/voice-casts.json, D-11), so every story is read with the
device's ko-KR voice; the voice cast keeps the listening layer's "unselected" voice with the speaker letter, so a
dialogue's two speakers stay distinct.

Every Korean sentence passes ko_text's word check (lexicon words, particle allomorphs, number systems) and ends in
해요체 or 합쇼체; every Vietnamese string carries no Hangul. Questions are authored with the right option first;
`story` moves it to a position taken from the story id and the question number, as the ja stories do.
"""
import glob, json, math, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from ko_text import COPULA, IRREG_D, NAMES as KO_NAMES, PARTICLES, T_L, Index, _past, conjugate, final, with_final  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
D = os.path.join(ROOT, "content", "ko", "_drafts")
STAGED = os.path.join(D, "staged", "content")
BANDS = ["A1-0", "A1-1", "A1-2", "A2-1", "A2-2", "B1-1", "B1-2", "B2-1", "B2-2"]
STORY_MIN_COVERAGE = 0.95
TOKEN_RANGE = {"A1-0": (50, 100)}
DEFAULT_RANGE = (150, 400)
SENTENCE_MAX_CHARS = 220


def _staged(rel):
    return json.load(open(os.path.join(STAGED, rel), encoding="utf-8"))


LEX = _staged("ko/lexicon/lexemes.json")["lexemes"]
LEX_BY_ID = {x["id"]: x for x in LEX}
BY_SURFACE = {}
for _x in LEX:
    BY_SURFACE.setdefault(_x["surface"], []).append(_x["id"])
MORPH = json.load(open(os.path.join(ROOT, "content", "ko", "lexicon", "derived", "morphology.json"), encoding="utf-8"))
SYLLABUS = _staged("ko/lexicon/syllabus.json")
LATER = _staged("ko/lexicon/syllabus-a2-1.json")
PACK = _staged("courses/ko-vi.json")
FROZEN = _staged("ko/lexemes.json")
INDEX = Index(LEX)

# Function words the seed writes into stories.json: grammar with no lexeme of its own — the dependent words of the
# patterns the course teaches (갈 거예요, 할 수 있어요) and the auxiliaries of -고 싶다, -지 않다 and -지 마세요, as ja's
# ます is grammar. Known at every band. The connectives (그리고, 하지만 …) are lexemes and keep their band.
FUNCTION = ("거 거예요 겁니다 수 싶어요 싶었어요 싶습니다 싶어서 않아요 않았어요 않습니다 마세요 마십시오 "
            "싶어 싶었어 않아 않았어").split()  # the last four: their 반말 forms (session 5, dialogue lines only)
# Names of the stories (Korean and Vietnamese people, places) on top of ko_text NAMES; none spells a lexeme
# (no 이 / 한 / 정: they are words too).
NAMES = (set(KO_NAMES) | set("지민 서연 현우 영수 미나 하준 수민 정우 은지 철수 영희 대구 광주 대전 제주도 명동 강남 "
                             "꾸엉 하이퐁 사파 박닌 응에안 다낭".split())) - {w for w in BY_SURFACE}
# Not 후에 (Huế): it spells 후 + 에, "after".
INDEX.nouns |= NAMES  # the word check takes the story names as nouns (particles, copula)
CLOSED_CLASS = {"pronoun", "determiner", "preposition", "conjunction"}
sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")


def _bands():
    """lexemeBands of stories.ts: the syllabus halves (A1-1, A1-2), then the later list (A2-1)."""
    out = {}
    half = math.ceil(len(SYLLABUS["entries"]) / 2)
    for i, e in enumerate(SYLLABUS["entries"]):
        out.setdefault(e["lexemeId"], "A1-1" if i < half else "A1-2")
    for e in LATER["entries"]:
        out.setdefault(e["lexemeId"], LATER["level"].upper())
    return out


RESOLUTION_BANDS = _bands()
_units = [u for s in PACK["sections"] for u in s["units"]][:3]
_taught = [w["target"] for u in _units for w in u["words"]]
_keys = {t.lower() for t in _taught}
_mapped = {FROZEN[t] for t in _taught if t in FROZEN}
MICRO = {x["id"] for x in LEX if not x.get("variety") and (x["partOfSpeech"] in CLOSED_CLASS or x["id"] in _mapped or x["surface"].lower() in _keys)}
STORY_BANDS = dict(RESOLUTION_BANDS)
for _id in MICRO:
    STORY_BANDS[_id] = "A1-0"


def band_rank(b):
    return BANDS.index(b)


# ---------------------------------------------------------------------------
# The story engine, ported (scripts/lib/stories.ts segmentSentence, buildLexemeIndex, resolveToken, matchMulti)
# ---------------------------------------------------------------------------

WORD = re.compile(r"[0-9A-Za-z가-힣]+")
NUMBER = re.compile(r"^\d+(?:[.,:]\d+)*$")


def keys_of(form):
    return [w.lower() for w in WORD.findall(form)]


def _index():
    cands, multi, by_lemma = {}, [], {}

    def rank_of(lid, conjugated, order):
        b = RESOLUTION_BANDS.get(lid)
        return (conjugated, 1 if b is None else 0, 0 if b is None else band_rank(b), order)

    for order, x in enumerate(LEX):
        for form in dict.fromkeys([x["lookupForm"], x["lemma"]]):
            toks = keys_of(form)
            if len(toks) == 1:
                cands.setdefault(toks[0], []).append((rank_of(x["id"], 0, order), x["id"]))
            elif len(toks) > 1:
                multi.append((toks, x["id"]))
        if x["partOfSpeech"] == "verb" and x["lemma"].lower() not in by_lemma:
            by_lemma[x["lemma"].lower()] = x["id"]
    for order, v in enumerate(MORPH["verbs"]):
        lid = by_lemma.get(v["lemma"].lower())
        if lid is None:
            continue
        for row in v["rows"]:
            cands.setdefault(row["mot"].lower(), []).append((rank_of(lid, 1, order), lid))
    multi.sort(key=lambda m: -len(m[0]))  # stable, as Array.sort
    return {k: min(v)[1] for k, v in cands.items()}, multi


SINGLE, MULTI = _index()


def segment(text):
    """Word pieces of a sentence in order (Intl.Segmenter at word granularity, for Hangul text without digits)."""
    out, pos = [], 0
    for m in WORD.finditer(text):
        if m.start() > pos:
            out.append((text[pos:m.start()], False))
        tok = m.group()
        out.append((tok, not NUMBER.match(tok)))
        pos = m.end()
    if pos < len(text):
        out.append((text[pos:], False))
    return out


def resolve(key, token_map):
    key = key.lower()
    if key in token_map:
        v = token_map[key]
        return ("function", None) if v == "function" else ("name", None) if v == "name" else ("lexeme", v)
    if key in FUNCTION:
        return ("function", None)
    if re.fullmatch(r"\d+([.,]\d+)?", key):
        return ("number", None)
    if key in SINGLE:
        return ("lexeme", SINGLE[key])
    return ("unresolved", None)


def _multi_at(pieces, i):
    for toks, lid in MULTI:
        p, end, ok = i, i, True
        for t, want in enumerate(toks):
            while t > 0 and p < len(pieces) and not pieces[p][1]:
                if pieces[p][0].strip():
                    ok = False
                    break
                p += 1
            if not ok or p >= len(pieces) or not pieces[p][1] or pieces[p][0].lower() != want:
                ok = False
                break
            end = p
            p += 1
        if ok:
            return lid, end, len(toks)
    return None


def analyze(record):
    """analyzeStory of stories.ts over one record: word tokens with their resolution, counts, coverage."""
    tm = {k.lower(): v for k, v in record.get("tokenMap", {}).items()}
    new = set(record["newLexemes"])
    band = record["band"]
    st = {"tokens": 0, "unknown": 0}
    lexemes, undeclared, unresolved, sentences = [], set(), set(), []

    def count(lid):
        if lid not in lexemes:
            lexemes.append(lid)
        b = STORY_BANDS.get(lid)
        if lid in new or b is None or band_rank(b) > band_rank(band):
            st["unknown"] += 1
            if lid not in new:
                undeclared.add(lid)

    for s in record["sentences"]:
        pieces = segment(s["text"])
        words = []
        i = 0
        while i < len(pieces):
            tok, is_word = pieces[i]
            if not is_word:
                i += 1
                continue
            m = _multi_at(pieces, i)
            if m:
                lid, end, n = m
                st["tokens"] += n
                for _ in range(n):
                    count(lid)
                words.append((" ".join(p[0] for p in pieces[i:end + 1] if p[1]), ("lexeme", lid)))
                i = end + 1
                continue
            st["tokens"] += 1
            kind, lid = resolve(tok, tm)
            if kind == "lexeme":
                count(lid)
            elif kind == "unresolved":
                unresolved.add(tok)
                st["unknown"] += 1
            words.append((tok, (kind, lid)))
            i += 1
        sentences.append(words)
    t = st["tokens"]
    return {"tokens": t, "unknown": st["unknown"], "coverage": (t - st["unknown"]) / t if t else 0.0, "lexemes": lexemes,
            "undeclared": sorted(undeclared), "unresolved": sorted(unresolved), "sentences": sentences}


# ---------------------------------------------------------------------------
# The lexeme an authored word is
# ---------------------------------------------------------------------------

def _forms():
    out = {}
    for x in LEX:
        if x["partOfSpeech"] in ("verb", "adjective") and " " not in x["surface"]:
            for form in conjugate(x["surface"], x["partOfSpeech"]):
                head = form.split(" ")[0]
                out.setdefault(head, [])
                if x["id"] not in out[head]:
                    out[head].append(x["id"])
    return out


FORMS = _forms()

# ---------------------------------------------------------------------------
# 반말 in dialogue (coordinator 2026-11-05, session 5)
# ---------------------------------------------------------------------------
# A dialogue line may end in 반말 only for a declared relation, and only with an ending of the allowlist; never in
# narration. The first occurrence of each ending in a story carries its gloss in the Vietnamese line.
RELATIONS = {"parent>child": "bố mẹ nói với con", "friends": "bạn thân cùng tuổi", "older>younger": "anh chị nói với em"}
BANMAL_GLOSS = {
    "eo": "thân mật: đuôi -a/-eo, bỏ «yo» của -ayo/-eoyo",
    "ya": "thân mật: «-ya / -iya» thay cho «-yeyo / -ieyo» (là)",
    "ja": "rủ thân mật: «-ja» = «mình cùng … nhé»",
    "ji": "thân mật: «-ji» = «… nhỉ, … chứ»",
    "ne": "thân mật: «-ne» = «… quá, … ghê» (vừa nhận ra)",
}


def _banmal_forms():
    """{form: (lexeme id, ending)} for the -자 / -지 / -네 forms of the lexicon verbs and adjectives (present and past)."""
    out = {}
    for x in LEX:
        lemma, pos = x["surface"], x["partOfSpeech"]
        if pos not in ("verb", "adjective") or " " in lemma or not lemma.endswith("다") or len(lemma) < 2:
            continue
        s = lemma[:-1]
        ne_stem = with_final(s, 0) if final(s[-1]) == T_L and lemma not in IRREG_D else s  # 살다 → 사네
        past = _past(lemma)
        got = {s + "지": "ji", past + "지": "ji", ne_stem + "네": "ne", past + "네": "ne"}
        if pos == "verb":
            got[s + "자"] = "ja"
        for form, kind in got.items():
            out.setdefault(form, (x["id"], kind))
    return out


BANMAL_FORMS = _banmal_forms()
for _aux in ("싶어", "싶었어", "않아", "않았어"):
    INDEX.forms.setdefault(_aux, (_aux, "banmal"))
for _f, (_lid, _k) in BANMAL_FORMS.items():
    INDEX.forms.setdefault(_f, (LEX_BY_ID[_lid]["surface"], "banmal"))
    if _f not in FORMS:
        FORMS[_f] = [_lid]


def banmal_ending(word):
    """The allowlisted 반말 ending a sentence-final word carries (eo / ya / ja / ji / ne), 'other' for any other 반말
    end (the dictionary form, -ㄹ게, a connective), None when the word is not 반말."""
    if INDEX.kind(word) != "banmal":
        return None
    if word in BANMAL_FORMS:
        return BANMAL_FORMS[word][1]
    form = INDEX.forms.get(word)
    if form and (form[1] == "aeo" or (form[1] == "banmal" and word[-1] in "어아") and not word.endswith("다")):
        return "eo"
    if word.endswith("야") and (INDEX.nounish(word[:-1]) or (word.endswith("이야") and INDEX.nounish(word[:-2])) or word[:-1] in BY_SURFACE):
        return "ya"
    return "other"
# Honorific / suppletive forms of the course (ko_text SUPPLETIVE) and the auxiliaries' own lexemes.
SUPPLETIVE = {"드세요": "먹다", "드셨어요": "먹다", "드십시오": "먹다", "계세요": "있다", "계셨어요": "있다", "계십니다": "있다", "주무세요": "자다"}
COPULAS = sorted(COPULA, key=len, reverse=True)
PARTS = sorted((p for p in PARTICLES if p != "요"), key=len, reverse=True)


def _one(surface):
    ids = BY_SURFACE.get(surface)
    return ids[0] if ids and len(ids) == 1 else None


def _base(word):
    """A noun, name or number the word carries particles / the copula on; None when it is none of those."""
    if word in NAMES:
        return word
    if word in BY_SURFACE or INDEX.nounish(word):
        return word
    return None


def intended(word):
    """('lexeme', id) | ('name', None) | ('function', None) | None (unknown, or two lexemes claim it)."""
    if word in FUNCTION:
        return ("function", None)
    if word in NAMES:
        return ("name", None)
    lid = _one(word)
    if lid:
        return ("lexeme", lid)
    if word in BY_SURFACE:
        return None
    if word in SUPPLETIVE:
        return ("lexeme", _one(SUPPLETIVE[word]))
    ids = FORMS.get(word)
    if ids:
        return ("lexeme", ids[0]) if len(ids) == 1 else None
    if word.endswith("요") and len(word) > 1:  # 저도요, 남 씨요
        got = intended(word[:-1])
        if got:
            return got
    for tail in COPULAS + PARTS:
        if word.endswith(tail) and len(word) > len(tail):
            base = word[: -len(tail)]
            for b in (base, *(base[: -len(p)] for p in PARTS if base.endswith(p) and len(base) > len(p))):
                if b in FUNCTION:
                    return ("function", None)
                if b in NAMES:
                    return ("name", None)
                if b in BY_SURFACE:
                    lid = _one(b)
                    return ("lexeme", lid) if lid else None
    return None


# ---------------------------------------------------------------------------
# Checks (also run by ko-check-stories.py)
# ---------------------------------------------------------------------------

HANGUL = re.compile(r"[가-힣ㄱ-ㅣ]")
VI_MARK = re.compile(r"[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]", re.I)
CEFR = re.compile(r"\b(CEFR|[ABC][12](?:[-.]\d)?)\b")


def check_story(r, registers=None):
    """Messages for one story record (empty: the story passes). `registers`: sentence number (1-based, as a string) →
    the declared relation of a 반말 dialogue line (stories/batches/*.registers.json)."""
    msgs = []
    regs = registers or {}
    glossed = set()
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
        if not LEX_BY_ID[lid]["glosses"].get("vi"):
            msgs.append(f"new lexeme {lid} has no vi gloss")
    if not 8 <= len(r["sentences"]) <= 60:
        msgs.append(f"{len(r['sentences'])} sentences (8-60)")
    for p in INDEX.problems(r["title"]):
        msgs.append("title: " + p)
    if CEFR.search(r["title"]):
        msgs.append("title: a level label")
    for n, s in enumerate(r["sentences"], 1):
        text = s["text"]
        if len(text) > SENTENCE_MAX_CHARS or re.search(r"[\t\n\r]|  ", text):
            msgs.append(f"#{n}: over {SENTENCE_MAX_CHARS} characters or a double space in {text!r}")
        if re.search(r"[0-9A-Za-z“”‘’「」]", text):
            msgs.append(f"#{n}: digits, Latin letters or curly quotes in {text!r} (numbers in Hangul)")
        for p in INDEX.problems(text):
            msgs.append(f"#{n}: {p}")
        vi = s["translation"].get("vi", "")
        rel = regs.get(str(n))
        if rel is not None and (rel not in RELATIONS or s["speaker"] == "N"):
            msgs.append(f"#{n}: relation {rel!r} on a {'narrator' if s['speaker'] == 'N' else 'dialogue'} line (relations: {sorted(RELATIONS)}, dialogue only)")
        for last, kind in INDEX.sentence_ends(text):
            if kind != "banmal":
                continue
            ending = banmal_ending(last)
            if s["speaker"] == "N":
                msgs.append(f"#{n}: 반말 sentence end {last!r} in narration (narration speaks 해요체)")
            elif rel not in RELATIONS:
                msgs.append(f"#{n}: 반말 sentence end {last!r} without a declared relation ({', '.join(sorted(RELATIONS))})")
            elif ending not in BANMAL_GLOSS:
                msgs.append(f"#{n}: 반말 sentence end {last!r} is not one of the allowed endings -아/어, -야/이야, -자, -지, -네")
            elif ending not in glossed:
                glossed.add(ending)
                if BANMAL_GLOSS[ending] not in vi:
                    msgs.append(f"#{n}: the first {ending!r} ending of the story ({last!r}) carries no gloss in its Vietnamese line")
        if not vi.strip() or HANGUL.search(vi) or CEFR.search(vi):
            msgs.append(f"#{n}: Vietnamese translation empty, with Hangul or a level label: {vi!r}")
        if s["speaker"] not in ("N", "A", "B"):
            msgs.append(f"#{n}: speaker {s['speaker']}")
    blurb = r["blurb"].get("vi", "")
    if not blurb.strip() or HANGUL.search(blurb) or not VI_MARK.search(blurb) or CEFR.search(blurb):
        msgs.append(f"blurb {blurb!r}")
    qs = r["questions"]
    if len(qs) != 3 or not any(q["kind"] == "infer" for q in qs):
        msgs.append("three questions, one an inference")
    for i, q in enumerate(qs):
        texts = [q["prompt"]["vi"]] + [o["vi"] for o in q["options"]]
        if any(HANGUL.search(t) or not t.strip() or CEFR.search(t) for t in texts):
            msgs.append(f"q{i}: Hangul, a level label or empty text in a question")
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


def _slug_id(slug):
    lid = "ko:w:" + slug
    assert lid in LEX_BY_ID, f"no lexeme {lid}"
    return lid


def story(sid, band, title, blurb, new, sentences, questions):
    """A sentence is (speaker, Korean, Vietnamese) or, for a 반말 dialogue line, (speaker, Korean, Vietnamese,
    relation) with a relation of RELATIONS; the first occurrence of each 반말 ending gets its gloss appended."""
    full = f"ko.story.{sid}"
    tm, problems, texts, regs, glossed = {}, [], [], {}, set()
    for n, (speaker, text, vi, *rel) in enumerate(sentences, 1):
        if rel:
            regs[str(n)] = rel[0]
            for last, kind in INDEX.sentence_ends(re.sub(r"=[a-z0-9_-]+", "", text)):
                ending = banmal_ending(last) if kind == "banmal" else None
                if ending in BANMAL_GLOSS and ending not in glossed:
                    glossed.add(ending)
                    vi = f"{vi} ({BANMAL_GLOSS[ending]}; {RELATIONS.get(rel[0], rel[0])})"
        forced = dict(re.findall(r"([가-힣]+)=([a-z0-9_-]+)", text))
        clean = re.sub(r"=[a-z0-9_-]+", "", text)
        texts.append((speaker, clean, vi))
        pieces = segment(clean)
        i = 0
        while i < len(pieces):
            w, is_word = pieces[i]
            if not is_word:
                i += 1
                continue
            m = _multi_at(pieces, i)
            if m and w not in forced:
                i = m[1] + 1
                continue
            if w in forced:
                f = forced[w]
                want = ("name", None) if f == "name" else ("function", None) if f == "function" else ("lexeme", _slug_id(f))
            else:
                want = intended(w)
            if want is None:
                problems.append(f"#{n}: {w!r} is no lexeme surface, form, or noun with its particles (or two lexemes claim it: write {w}=slug)")
            else:
                got = resolve(w, {})
                if got != want:
                    v = want[0] if want[0] in ("name", "function") else want[1]
                    if tm.get(w.lower(), v) != v:
                        problems.append(f"#{n}: {w!r} is mapped to two lexemes in one story")
                    tm[w.lower()] = v
            i += 1
    out = {"id": full, "band": band, "title": title, "blurb": {"vi": blurb}, "newLexemes": []}
    for w in new:
        lid = _slug_id(w[5:]) if w.startswith("ko:w:") else _one(w)
        if lid is None:
            problems.append(f"new word {w!r} is no single lexeme")
            continue
        out["newLexemes"].append(lid)
    if tm:
        out["tokenMap"] = dict(sorted(tm.items()))
    out["sentences"] = [{"speaker": s, "text": t, "translation": {"vi": vi}} for s, t, vi in texts]
    seed = sum(ord(c) for c in full)
    rows = []
    for i, (kind, qv, opts) in enumerate(questions):
        at = (seed + i) % len(opts)
        ordered = opts[1:at + 1] + opts[:1] + opts[at + 1:]
        rows.append({"kind": kind, "prompt": {"vi": qv}, "options": [{"vi": o} for o in ordered], "answer": at})
    out["questions"] = rows
    out["sourceRef"] = "original-project"
    problems += check_story(out, regs)
    if problems:
        FAILED.append(f"{full}:\n  " + "\n  ".join(problems))
    if regs:
        REGISTERS[full] = regs
    return out


FAILED = []
REGISTERS = {}  # story id → {sentence number: relation} of its 반말 dialogue lines


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
    regs = {s["id"]: REGISTERS[s["id"]] for s in stories if s["id"] in REGISTERS}
    with open(os.path.join(d, f"{name}.registers.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(regs, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.write("\n")
    with open(os.path.join(base, "OUTPUT.jsonl"), "w", encoding="utf-8", newline="\n") as out:
        for fn in sorted(glob.glob(os.path.join(d, "*.jsonl"))):
            out.write(open(fn, encoding="utf-8").read())
    print(name, len(stories), "stories")

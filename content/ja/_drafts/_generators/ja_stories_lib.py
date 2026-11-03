"""Shared builder and checker of the ja-vi graded stories (P4c session 6; the ja-stories-NN.py batches import it).

A sentence is (speaker, Japanese text with a space between words, Vietnamese). The spaces are the author's word boundaries:
they are removed from the text the app shows, and the builder checks that the story engine finds exactly those words.
Japanese has no spaces, so scripts/lib/stories.ts segments a ja story by left-to-right maximal match over every key it
resolves (lexicon lemma and lookup forms, the verb rows of derived/morphology.json, the function words, the token-map
keys), with one step of lookahead (は いくら, not はい く ら) — the P4b dictionary path, never Intl.Segmenter. `segment`
and `resolve` port that segmentation and resolution one for one; a sentence the engine would cut differently from the
author (わたした ち for わたし たち: わたした is a kana row of 渡す) stops the batch.

A word token is a lexeme surface; an inflected verb or い-adjective (食べます, 行きましょう, 高かった) whose form the
morphology does not list goes into the story's tokenMap, explicitly; `word=slug` forces the lexeme ja:w:<slug>
(homographs), `word=name` marks a name. Vietnamese names in katakana and the kana names in NAMES are names.

Voices (content/audio/voice-casts.json, ja-plan.md §7): A is the female voice (kokoro-jf_alpha) and narrates (N takes A's
voice), B the male voice (kokoro-jm_kumo): a woman's lines are A, a man's lines B.

Questions are authored with the right option first; `story` moves it to a position taken from the story id and the
question number, as the en stories do. Every check of `check_story` runs here and again in ja-check-answers.py (rule 7).
"""
import glob, json, math, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from ja_text import GODAN, PLAIN_END, POLITE_END, Index, sentence_ends  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..", ".."))
D = os.path.join(ROOT, "content", "ja", "_drafts")
STAGED = os.path.join(D, "staged", "content")
BANDS = ["A1-0", "A1-1", "A1-2", "A2-1", "A2-2", "B1-1", "B1-2", "B2-1", "B2-2"]
STORY_MIN_COVERAGE = 0.95
TOKEN_RANGE = {"A1-0": (50, 100)}
DEFAULT_RANGE = (150, 400)
SENTENCE_MAX_CHARS = 220


def _load(rel):
    return json.load(open(os.path.join(ROOT, rel), encoding="utf-8"))


LEX = _load("content/ja/lexicon/lexemes.json")["lexemes"]
LEX_BY_ID = {x["id"]: x for x in LEX}
MORPH = _load("content/ja/lexicon/derived/morphology.json")
SYLLABUS = json.load(open(os.path.join(STAGED, "ja", "lexicon", "syllabus.json"), encoding="utf-8"))
LATER = json.load(open(os.path.join(STAGED, "ja", "lexicon", "syllabus-a2-1.json"), encoding="utf-8"))
PACK = json.load(open(os.path.join(STAGED, "courses", "ja-vi.json"), encoding="utf-8"))
INDEX = Index(LEX)

# Closed-class words of the stories (the seed writes them into stories.json): the particles, the copula and two
# suffixes. The particles are lexemes of band A1-1 too; as function words they are known at every band, as "am/is/are"
# are in the en stories.
FUNCTION = ("は が を に で へ と も の や か から まで ね よ など な "
            "です でした でしょう じゃありません ではありません じゃありませんでした "
            "たち ごろ だけ").split()
# Vietnamese names in katakana, Japanese family names without a lexeme in hiragana (as the lessons write やまださん).
NAMES = set("ナム ラン ミン ホア グエン トゥアン マイ リン フン フオン タオ ビン ゴック タム ハイ ズン チャン ロン "
            "すずき やまだ こばやし いのうえ ハノイ フエ ダナン ハイフォン ホーチミン".split())
CLOSED_CLASS = {"pronoun", "determiner", "preposition", "conjunction"}


def _bands():
    """lexemeBands of stories.ts: the syllabus halves (A1-1, A1-2), the later list (A2-1); micro first when asked."""
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
    # min() over (rank, id) keeps the first of equal ranks only if ids tie-break the same way as the engine's strict
    # "before"; ranks never tie (the order component differs), so the minimum rank decides.
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
    """resolveToken of stories.ts: tokenMap, function words, numbers, the lexeme index (no endings apply to kana)."""
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
# Inflected forms (written in kanji, as the lessons write them)
# ---------------------------------------------------------------------------

# Verbs with no conjugation table in the morphology: their group, from the dictionary form.
GROUP = {"飲む": "godan", "取る": "godan", "かかる": "godan", "なくす": "godan", "休む": "godan", "撮る": "godan", "出す": "godan",
         "出かける": "ichidan", "つける": "ichidan", "あびる": "ichidan", "はく": "godan", "かぶる": "godan", "疲れる": "ichidan",
         "かける": "ichidan", "気をつける": "ichidan", "歌う": "godan", "引っ越す": "godan", "間に合う": "godan", "続ける": "ichidan",
         "登る": "godan"}
MORPH_BY_LEMMA = {v["lemma"]: v for v in MORPH["verbs"]}
NA_ENDING_IN_I = {"きれい", "嫌い", "大嫌い"}


def _group(lemma):
    if lemma.endswith("する"):
        return "suru"
    if lemma.endswith("来る"):
        return "kuru"
    v = MORPH_BY_LEMMA.get(lemma)
    if v:
        masu = [r["mot"] for r in v["rows"] if r["infoVer"].startswith("polite:nonpast:aff") and r["mot"][:1] == lemma[:1]]
        if masu:
            return "ichidan" if lemma.endswith("る") and masu[0][:-2] == lemma[:-1] else "godan"
    return GROUP[lemma]


def verb_forms(lemma):
    """form → category (polite, te, tai, plain) of one verb, in its own script."""
    g = _group(lemma)
    if g == "suru":
        base = lemma[:-2]
        m, te, ta, nai = base + "し", base + "して", base + "した", base + "し"
    elif g == "kuru":
        base = lemma[:-1]
        m, te, ta, nai = base, base + "て", base + "た", base
    elif g == "ichidan":
        m = lemma[:-1]
        te, ta, nai = m + "て", m + "た", m
    else:
        a, i, t, tt = GODAN[lemma[-1]]
        if lemma.endswith("行く"):
            t, tt = "って", "った"
        stem = lemma[:-1]
        m, te, ta, nai = stem + i, stem + t, stem + tt, stem + a
    out = {}
    for end in ("ます", "ません", "ました", "ませんでした", "ましょう"):
        out[m + end] = "polite"
    for end in ("たい", "たくない", "たかった"):
        out[m + end] = "tai"
    out[te] = "te"
    out[nai + "ないで"] = "te"
    for f in (lemma, ta, nai + "ない", nai + "なかった"):
        out.setdefault(f, "plain")
    return out


def adjective_forms(surface):
    if surface in NA_ENDING_IN_I or not surface.endswith("い"):
        return {}
    stem = "よ" if surface == "いい" else surface[:-1]
    out = {surface: "adj"}
    for end in ("くない", "かった", "くなかった", "くて", "く"):
        f = stem + end
        if not (surface == "いい" and f == "よく"):
            out[f] = "adj"
    return out


def _inflected():
    forms = {}
    for x in LEX:
        if x["partOfSpeech"] == "verb":
            got = verb_forms(x["lemma"])
        elif x["partOfSpeech"] == "adjective":
            got = adjective_forms(x["surface"])
        else:
            continue
        for f, cat in got.items():
            forms.setdefault(f, {})[x["id"]] = cat
    return forms


INFLECTED = _inflected()
BY_SURFACE = {}
for _x in LEX:
    BY_SURFACE.setdefault(_x["surface"], []).append(_x["id"])


def intended(word):
    """The lexeme an authored word is: its surface, else an inflected form; None when two lexemes claim it."""
    ids = BY_SURFACE.get(word)
    if ids:
        return ids[0] if len(ids) == 1 else None
    got = INFLECTED.get(word)
    if got:
        return next(iter(got)) if len(got) == 1 else None
    return None


def category(word, lid):
    """polite / te / tai / plain / adj / word: the inflection category of a resolved token."""
    return INFLECTED.get(word, {}).get(lid, "word")


# ---------------------------------------------------------------------------
# Checks (also run by ja-check-answers.py)
# ---------------------------------------------------------------------------

JA = re.compile(r"[ぁ-ゖァ-ヺー㐀-䶿一-鿿]")
# A sentence may end on a set phrase (ありがとう, いってきます): not a plain verb form.
SET_PHRASES = sorted({x["surface"] for x in LEX if x["partOfSpeech"] in ("expression", "interjection") and len(x["surface"]) >= 2})
VI_MARK = re.compile(r"[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]", re.I)
# The pairs the lesson self-check reads as two defensible answers, in a sentence's own particles.
_TIME_NI = re.compile(r"(?:今日|明日|昨日|毎日|毎朝|毎晩|毎週|毎月|今朝|今週|来週|先週|今月|来月|先月|今年|来年|去年|おととい|あさって)に(?![ぁ-ゖ]*(?:なり|入))(?!は|も)")
# D-10 review (2026-11-03): a time word counted from now cannot go with a past verb (来月、…結婚しました: "the following
# month" is another word); a narrator speaks of a character's family with the respectful words (お父さん, not 父: 父 is
# the speaker's own father).
_FUTURE_PAST = re.compile(r"(?:来月|来週|来年|明日|あした|あさって)[^。！？]*?(?:ました|でした)")
_NARRATOR_KIN = re.compile(r"(?<![お])(?:父|母|兄|姉)(?!さん|弟|妹|親)")


def check_story(r):
    """Messages for one story record (empty: the story passes)."""
    msgs = []
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
        # A new word is a word of the story's band or beyond (the A2-1 stories introduce A2-1 words).
        if b is not None and band_rank(b) < band_rank(r["band"]):
            msgs.append(f"new lexeme {lid} is a word of an earlier band ({b})")
    if not 8 <= len(r["sentences"]) <= 60:
        msgs.append(f"{len(r['sentences'])} sentences (8-60)")
    for p in INDEX.problems(r["title"]):
        msgs.append("title: " + p)
    plain_ok = band_rank(r["band"]) >= band_rank("A2-1")
    for n, (s, pieces) in enumerate(zip(r["sentences"], a["sentences"]), 1):
        text = s["text"]
        if len(text) > SENTENCE_MAX_CHARS or " " in text or "　" in text:
            msgs.append(f"#{n}: over {SENTENCE_MAX_CHARS} characters or a space in {text!r}")
        for p in INDEX.problems(text):
            msgs.append(f"#{n}: {p}")
        if re.search(r"(?:を|(?<![んい])で)(?:あります|います|ありません|いません|ありました|いました)", text):
            msgs.append(f"#{n}: あります/います take に and が: {text!r}")
        if re.search(r"を(?:好き|嫌い|上手|下手|欲しい|わかり)", text) or re.search(r"を乗り", text) or _TIME_NI.search(text):
            msgs.append(f"#{n}: wrong particle in {text!r}")
        if re.search(r"(?<!道)(?<!角)(?<!橋)(?<!交差点)を(?:行き|来ま|帰り)", text):
            msgs.append(f"#{n}: を before a verb of motion in {text!r}")
        if _FUTURE_PAST.search(re.sub(r"「[^」]*」", "", text)):  # reported speech keeps its own time
            msgs.append(f"#{n}: a time word counted from now with a past verb in {text!r}")
        if s["speaker"] == "N" and _NARRATOR_KIN.search(text):
            msgs.append(f"#{n}: the narrator uses a humble kin word (父/母/兄/姉) for a character's family in {text!r}")
        if re.search(r"[?!]", text):
            msgs.append(f"#{n}: half-width ? or ! in Japanese text {text!r} (write ？ ！)")
        for end in sentence_ends(text):
            if len(end) > 3 and PLAIN_END.search(end) and not POLITE_END.search(end) and not end.endswith("でしょう") and not any(end.endswith(x) for x in SET_PHRASES):
                msgs.append(f"#{n}: plain sentence end {end!r} (stories speak です/ます)")
        if not plain_ok:
            for tok, res in pieces:
                if res and res[0] == "lexeme" and LEX_BY_ID[res[1]]["partOfSpeech"] == "verb" and category(tok, res[1]) == "plain":
                    msgs.append(f"#{n}: plain verb form {tok} before band A2-1")
        vi = s["translation"].get("vi", "")
        if not vi.strip() or JA.search(vi):
            msgs.append(f"#{n}: Vietnamese translation empty or with Japanese: {vi!r}")
        if s["speaker"] not in ("N", "A", "B"):
            msgs.append(f"#{n}: speaker {s['speaker']}")
    blurb = r["blurb"].get("vi", "")
    if not blurb.strip() or JA.search(blurb) or not VI_MARK.search(blurb):
        msgs.append(f"blurb {blurb!r}")
    qs = r["questions"]
    if len(qs) != 3 or not any(q["kind"] == "infer" for q in qs):
        msgs.append("three questions, one an inference")
    for i, q in enumerate(qs):
        texts = [q["prompt"]["vi"]] + [o["vi"] for o in q["options"]]
        if any(JA.search(t) or not t.strip() for t in texts):
            msgs.append(f"q{i}: Japanese or empty text in a question")
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


_NOT_WORD = r"[0-9０-９]+|[、。！？!?「」『』…・：:（）()]+"


def _words_of(raw):
    """(words, forced) of one authored token: 'word=slug' forces ja:w:<slug>, 'word=name' / 'word=function' a kind;
    digits and punctuation (7時, 。) are not words."""
    forced = None
    if "=" in raw:
        raw, forced = raw.split("=", 1)
        forced = re.match(r"[a-z0-9_-]+", forced).group()
        forced = forced if forced in ("name", "function") else "ja:w:" + forced
        assert forced in ("name", "function") or forced in LEX_BY_ID, f"no lexeme {forced}"
    return [p for p in re.split(f"({_NOT_WORD})", raw) if p and not re.fullmatch(_NOT_WORD, p)], forced


def story(sid, band, title, blurb, new, sentences, questions):
    full = f"ja.story.{sid}"
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
                    lid = intended(w)
                    assert lid is not None, f"{full}: {w!r} is no lexeme surface or inflected form (or two lexemes claim it: write {w}=slug)"
                    kind, got = resolve(w, {})
                    if kind != "lexeme" or got != lid:
                        tm[w] = lid
                words.append(w)
        authored.append(words)
    out = {"id": full, "band": band, "title": title, "blurb": {"vi": blurb}, "newLexemes": []}
    for w in new:
        lid = w if w.startswith("ja:w:") else intended(w)
        assert lid is not None, f"{full}: new word {w!r} is no lexeme"
        out["newLexemes"].append(lid)
    if tm:
        out["tokenMap"] = dict(sorted(tm.items()))
    # D-10 review: Japanese text takes the full-width ？ and ！ (the authored lines use the ASCII ones).
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
    problems += check_story(out)
    if problems:
        FAILED.append(f"{full}:\n  " + "\n  ".join(problems))
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
    print(name, len(stories), "stories")

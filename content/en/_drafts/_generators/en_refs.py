"""lexemeRefs of an English text, and the level check of the en-vi layers (readings, clips, speech targets, model answers).

refs(text): the A1 lexicon entries the text uses. Pronouns, determiners, prepositions and conjunctions count only in a
sentence (3+ words), so that a word-phrase clip like "a key" keeps its one lexeme (src/lib/session/evidence.ts) while the
syllabus function words still get their context. content_refs(text) leaves them out: speech evidence.
check(where, text): records every word that is neither an A1 lexeme, nor a form of one, nor a declared name; report() ends
the generator with a non-zero exit if any was found. A1 = the lexicon minus core-a2.txt, as in en-units.py.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
_LEX_DIR = os.path.abspath(os.path.join(HERE, "..", "..", "lexicon"))
LEX = json.load(open(os.path.join(_LEX_DIR, "lexemes.json"), encoding="utf-8"))["lexemes"]
_IRR = json.load(open(os.path.join(_LEX_DIR, "irregular-forms.json"), encoding="utf-8"))
_PLURALS = json.load(open(os.path.join(_LEX_DIR, "noun-plurals.json"), encoding="utf-8"))["plurals"]
LATER = set()
for _line in open(os.path.join(HERE, "core-a2.txt"), encoding="utf-8"):
    if _line.strip() and not _line.startswith(("#", "+")):
        LATER.add(_line.split("|")[1])
A1 = [l for l in LEX if l["surface"] not in LATER]
BY_ID = {l["id"]: l for l in LEX}
FUNCTION_POS = {"pronoun", "determiner", "preposition", "conjunction"}

NAMES = set("minh lan nam hoa tuan mai linh hung tran nguyen pham le vo anna tom sarah john mary david peter lee smith hanoi hue da nang sydney london abc binh hanh thu trang kim ma ha long singapore australia lam".split())
# Not lexemes, and safe at A1: a chunk the course needs in speech, spelling variants.
ALLOW = set("oh ok its".split())
EXTRA = {"slowly": "slow"}
BE = set("am is are was were been being".split())

_TOKEN = re.compile(r"[A-Za-z]+(?:'[A-Za-z]+)*|\d+")


def _tokens(text):
    return _TOKEN.findall(text.replace("’", "'"))


def _forms(lexemes):
    single, multi, exact = {}, {}, {}
    for l in lexemes:
        exact.setdefault(l["surface"], l["id"])
        for f in {l["surface"], l["lookupForm"], l["lemma"]}:
            toks = tuple(t.lower() for t in _tokens(f))
            if len(toks) == 1:
                single.setdefault(toks[0], l["id"])
            elif len(toks) > 1:
                multi.setdefault(toks, l["id"])
    return single, multi, exact


SINGLE, MULTI, EXACT = _forms(A1)
_MAXN = max(len(k) for k in MULTI)
_LATER_SINGLE, _LATER_MULTI, _ = _forms([l for l in LEX if l["surface"] in LATER])
IRREGULAR = {}
for _id, _v in _IRR["verbs"].items():
    for _key in ("past", "participle"):
        for _f in str(_v.get(_key, "")).split(","):
            if _f.strip():
                IRREGULAR.setdefault(_f.strip().lower(), _id)
for _id, _v in _IRR.get("adjectives", {}).items():
    for _f in _v.values() if isinstance(_v, dict) else []:
        if isinstance(_f, str):
            IRREGULAR.setdefault(_f.lower(), _id)
for _id, _p in _PLURALS.items():
    if _p != "—":
        IRREGULAR.setdefault(_p.lower(), _id)

_N_T = {"don't": "do", "doesn't": "do", "didn't": "do", "isn't": "be", "aren't": "be", "wasn't": "be", "weren't": "be", "can't": "can", "won't": "will", "couldn't": "could", "wouldn't": "would", "shouldn't": "should", "mustn't": "must", "haven't": "have", "hasn't": "have"}


def _contraction(t):
    if t in _N_T:
        return [_N_T[t], "not"]
    if t == "cannot":
        return ["can", "not"]
    if t == "let's":
        return ["let", "us"]
    m = re.fullmatch(r"([a-z]+)'(m|re|ve|ll|d|s)", t)
    if not m:
        return None
    head, tail = m.groups()
    if tail == "s":
        return [head] if head not in {"he", "she", "it", "that", "what", "where", "who", "how", "there", "here"} else [head, "be"]
    return [head, {"m": "be", "re": "be", "ve": "have", "ll": "will", "d": "would"}[tail]]


def _pos(i):
    return BY_ID[i]["partOfSpeech"]


def _regular(t):
    """A regular form of an A1 lexeme: -s for verbs and nouns, -ed and -ing for verbs, -er and -est for adjectives."""
    cands = []
    if t.endswith("ies"):
        cands.append((t[:-3] + "y", {"noun", "verb"}))
    if t.endswith("es"):
        cands.append((t[:-2], {"noun", "verb"}))
    if t.endswith("s"):
        cands.append((t[:-1], {"noun", "verb"}))
    if t.endswith("ied"):
        cands.append((t[:-3] + "y", {"verb"}))
    if t.endswith("ed"):
        cands += [(t[:-2], {"verb"}), (t[:-1], {"verb"})]
        if len(t) > 4 and t[-3] == t[-4]:
            cands.append((t[:-3], {"verb"}))
    if t.endswith("ing"):
        cands += [(t[:-3], {"verb"}), (t[:-3] + "e", {"verb"})]
        if len(t) > 5 and t[-4] == t[-5]:
            cands.append((t[:-4], {"verb"}))
    for end in ("er", "est"):
        if t.endswith(end):
            stem = t[: -len(end)]
            cands += [(stem, {"adjective", "adverb"}), (stem + "e", {"adjective", "adverb"})]
            if stem.endswith("i"):
                cands.append((stem[:-1] + "y", {"adjective", "adverb"}))
            if len(stem) > 2 and stem[-1] == stem[-2]:
                cands.append((stem[:-1], {"adjective", "adverb"}))
    for base, pos in cands:
        if base in SINGLE and _pos(SINGLE[base]) in pos:
            return SINGLE[base]
    return None


def _one(raw, first):
    """Lexeme ids of one token, [] for a name or an allowed word, None for an unknown word."""
    t = raw.lower()
    if raw.isdigit() or t in NAMES or t in ALLOW:
        return []
    if raw in EXACT and not first:
        return [EXACT[raw]]
    if t in SINGLE:
        return [SINGLE[t]]
    if t in BE:
        return [SINGLE["be"]]
    if t in EXTRA:
        return [SINGLE[EXTRA[t]]]
    parts = _contraction(t)
    if parts:
        out = []
        for p in parts:
            got = _one(p, False)
            if got is None:
                return None
            out += got
        return out
    if t in {"has", "had", "having"}:
        return [SINGLE["have"]]
    if t in {"does", "did", "done", "doing"}:
        return [SINGLE["do"]]
    if t in IRREGULAR and BY_ID[IRREGULAR[t]]["surface"] not in LATER:
        return [IRREGULAR[t]]
    i = _regular(t)
    return [i] if i else None


def _scan(text):
    """(lexeme ids, unknown words) of a text, longest multi-word lexemes first."""
    toks = _tokens(text)
    low = [t.lower() for t in toks]
    ids, unknown = [], []
    i = 0
    while i < len(toks):
        for n in range(min(_MAXN, len(toks) - i), 1, -1):
            key = tuple(low[i:i + n])
            if key in MULTI:
                ids.append(MULTI[key])
                i += n
                break
        else:
            got = _one(toks[i], i == 0)
            if got is None:
                unknown.append(toks[i])
            else:
                ids += got
            i += 1
    out = []
    for x in ids:
        if x not in out:
            out.append(x)
    return out, unknown


def later_lexeme(raw):
    """The band A2-1 lexeme of a word outside the A1 list: its surface, or a regular form of it. None if the lexicon has neither."""
    t = raw.lower()
    if t in _LATER_SINGLE:
        return BY_ID[_LATER_SINGLE[t]]
    if t in IRREGULAR and BY_ID[IRREGULAR[t]]["surface"] in LATER:
        return BY_ID[IRREGULAR[t]]
    stems = []
    if t.endswith("ies"):
        stems.append(t[:-3] + "y")
    if t.endswith("es"):
        stems.append(t[:-2])
    if t.endswith("s"):
        stems.append(t[:-1])
    if t.endswith("ed"):
        stems += [t[:-2], t[:-1]]
    if t.endswith("ing"):
        stems += [t[:-3], t[:-3] + "e"]
    for s in stems:
        if s in _LATER_SINGLE:
            return BY_ID[_LATER_SINGLE[s]]
    return None


def refs(text):
    ids, _ = _scan(text)
    if len(_tokens(text)) < 3:
        ids = [i for i in ids if _pos(i) not in FUNCTION_POS]
    return ids


def content_refs(text):
    return [i for i in _scan(text)[0] if _pos(i) not in FUNCTION_POS]


PROBLEMS = []


def check(where, text):
    for w in _scan(text)[1]:
        PROBLEMS.append(f"{where}: \"{w}\" is not A1 in \"{text}\"")


def report():
    for p in PROBLEMS:
        print(p.encode("utf-8", "replace").decode("utf-8"), file=sys.stderr)
    if PROBLEMS:
        sys.exit(f"{len(PROBLEMS)} off-level word(s)")


def write_jsonl(path, rows, mode="w"):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, mode, encoding="utf-8", newline="\n") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


def clip(cid, kind, segs, objs, units=1):
    """A listening clip; segs = [(speaker, text)]. Every line is level-checked."""
    text = " ".join(t for _, t in segs)
    check(cid, text)
    return {"id": cid, "kind": kind, "segments": [{"speaker": s, "text": t} for s, t in segs], "objectiveRefs": objs, "lexemeRefs": refs(text),
            "sourceRef": "original-project", "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"}, "scoredPlaybackPolicy": {"maxPlays": 2, "rate": 1}}

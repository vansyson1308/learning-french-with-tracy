"""Shared helpers of the ko-vi reception, speech and writing generators (P4e session 3), after ja_layers.py.

refs(text): the lexeme ids a Korean text uses (ko_text.Index.lexemes_of: set phrases, surfaces, verb forms by their
lemma, nouns with their particles or copula). content_refs(text) leaves out particles, the copula, counters,
pronouns, determiners and conjunctions: speech and writing evidence.
check(where, text, plain=False): every problem of a Korean string (a word outside the lexicon, a particle or copula
allomorph, a number of the wrong system, Latin letters) and, unless plain, a 반말 sentence end (the course speaks
해요체; 합쇼체 announcements and set phrases are fine). check_vi(where, text): no Hangul in a Vietnamese string.
report() ends the generator with a non-zero exit if anything was found.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from ko_text import Index, load_lexicon  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")
ROOT = sys.argv[1]
DRAFTS = f"{ROOT}/content/ko/_drafts"
LEXL = load_lexicon(ROOT)
LEX = {x["surface"]: x for x in LEXL}
INDEX = Index(LEXL)
KO = re.compile(r"[가-힣ㄱ-ㅣ]")
FUNCTION_POS = {"other", "pronoun", "determiner", "conjunction"}
PROBLEMS = []


def refs(text):
    return [LEX[s]["id"] for s in INDEX.lexemes_of(text)]


def content_refs(text):
    return [LEX[s]["id"] for s in INDEX.lexemes_of(text) if LEX[s]["partOfSpeech"] not in FUNCTION_POS]


def check(where, text, plain=False):
    for p in INDEX.problems(text):
        PROBLEMS.append(f"{where}: {p}")
    if not KO.search(text):
        PROBLEMS.append(f"{where}: no Korean in {text!r}")
    if plain:
        return
    for last, kind in INDEX.sentence_ends(text):
        if kind == "banmal":
            PROBLEMS.append(f"{where}: 반말 sentence end {last!r} (the course speaks 해요체)")


def check_vi(where, text):
    if KO.search(text):
        PROBLEMS.append(f"{where}: Korean inside the Vietnamese {text!r}")


def report():
    for p in PROBLEMS:
        print(p, file=sys.stderr)
    if PROBLEMS:
        sys.exit(f"{len(PROBLEMS)} problem(s)")


def write_jsonl(path, rows, mode="w"):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, mode, encoding="utf-8", newline="\n") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


def read_jsonl(path):
    return [json.loads(x) for x in open(path, encoding="utf-8") if x.strip()] if os.path.exists(path) else []


def clip(cid, kind, segs, objs, units=1, plain=False):
    """A listening clip; segs = [(speaker, text)]. Every line is checked. No asset: ko-vi is a device-voice course."""
    for _, t in segs:
        check(cid, t, plain)
    text = " ".join(t for _, t in segs)
    return {"id": cid, "kind": kind, "segments": [{"speaker": s, "text": t} for s, t in segs], "objectiveRefs": objs, "lexemeRefs": refs(text),
            "sourceRef": "original-project", "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"}, "scoredPlaybackPolicy": {"maxPlays": 2, "rate": 1}}

"""Shared helpers of the zh-vi reception, speech, writing and scenario generators (P4d session 3), after ja_layers.py.

refs(text): the lexemes a Chinese text uses, read the way the app lays pinyin under it (zh_text.Index: the longest stored
surface, left to right — annotateText). Every hanzi is a token of its own when no longer surface covers it, so a
single-character word counts. content_refs(text) leaves out particles, numerals and measure words (part of speech
"other"), pronouns, determiners, conjunctions and prepositions: speech evidence.
check(where, text): every reading problem of a Chinese string (a hanzi outside the lexicon, a homograph outside its
stored reading, 中 / 地 alone, Latin letters); check_vi(where, text): no hanzi in a Vietnamese string. report() ends the
generator with a non-zero exit if anything was found.
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from zh_text import HAN, PUNCT, Index, bare, load_lexicon, natural_spellings, numeral_spellings  # noqa: E402

ROOT = sys.argv[1]
DRAFTS = f"{ROOT}/content/zh/_drafts"
LEXL = load_lexicon(ROOT)
LEX = {x["surface"]: x for x in LEXL}
BY_ID = {x["id"]: x for x in LEXL}
INDEX = Index(LEXL)
FUNCTION_POS = {"other", "pronoun", "determiner", "conjunction", "preposition"}
TOKEN_ID = {}
for _x in LEXL:
    TOKEN_ID.setdefault(_x["surface"], _x["id"])


def refs(text):
    out = []
    for tok, py in INDEX.tokens(text):
        if py is None or tok not in TOKEN_ID:
            continue
        lid = TOKEN_ID[tok]
        if lid not in out:
            out.append(lid)
    return out


def content_refs(text):
    return [i for i in refs(text) if BY_ID[i]["partOfSpeech"] not in FUNCTION_POS and not BY_ID[i].get("proper")]


PROBLEMS = []


def check(where, text):
    for p in INDEX.problems(text):
        PROBLEMS.append(f"{where}: {p}")
    if not HAN.search(text):
        PROBLEMS.append(f"{where}: no Chinese in {text!r}")


def check_vi(where, text):
    if HAN.search(text):
        PROBLEMS.append(f"{where}: Chinese inside the Vietnamese {text!r}")


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


def clip(cid, kind, segs, objs, units=1):
    """A listening clip; segs = [(speaker, text)]. Every line is reading-checked."""
    for _, t in segs:
        check(cid, t)
    text = "".join(t for _, t in segs)
    return {"id": cid, "kind": kind, "segments": [{"speaker": s, "text": t} for s, t in segs], "objectiveRefs": objs, "lexemeRefs": refs(text),
            "sourceRef": "original-project", "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"}, "scoredPlaybackPolicy": {"maxPlays": 2, "rate": 1}}


def spoken_variants(answers):
    """Every accepted spoken answer the grader should match, widened by the natural pairs and word orders of zh_text
    (the time word before or after the subject, 这儿/这里, 星期天/星期日 …), without repeats after punctuation. Numbers
    are not widened: the grader spells digits as hanzi numerals before it compares (25岁 = 二十五岁, 2张 = 两张), so a
    digit variant would be a duplicate; it also folds traditional characters, punctuation and spaces (zh.ts)."""
    out = []
    for a in answers:
        for x in [a] + natural_spellings(a):
            if bare(x) not in {bare(y) for y in out}:
                out.append(x)
    return out


__all__ = ["DRAFTS", "LEX", "BY_ID", "INDEX", "HAN", "PUNCT", "bare", "check", "check_vi", "clip", "content_refs", "natural_spellings",
           "numeral_spellings", "read_jsonl", "refs", "report", "spoken_variants", "write_jsonl"]

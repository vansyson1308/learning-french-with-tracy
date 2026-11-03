"""Shared helpers of the ja-vi reception, speech, writing and scenario generators (P4c session 4), after en_refs.py.

refs(text): the lexemes a Japanese text uses, read the way the app lays furigana over it (ja_text.Index: longest stored
surface, then the inflection keys of verbs and い-adjectives, which resolve to their lexeme). A token of one kana is
never a reference: it is a particle or a piece of an unstored word, and coverage QA must not count it. content_refs(text)
leaves out particles, the copula, counters, pronouns, determiners and conjunctions: speech evidence.
check(where, text, plain=False): every reading problem of a Japanese string (kanji outside the lexicon, a misread single
kanji, romaji) and, unless plain, a sentence end outside です/ます style; check_vi(where, text): no kana or kanji in a
Vietnamese string. report() ends the generator with a non-zero exit if anything was found.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from ja_text import HAN, PLAIN_END, POLITE_END, Index, inflection_keys, load_lexicon, sentence_ends  # noqa: E402

ROOT = sys.argv[1]
DRAFTS = f"{ROOT}/content/ja/_drafts"
LEXL = load_lexicon(ROOT)
LEX = {x["surface"]: x for x in LEXL}
BY_ID = {x["id"]: x for x in LEXL}
INDEX = Index(LEXL)
JA = re.compile(r"[ぁ-ゖァ-ヺー㐀-䶿一-鿿]")
FUNCTION_POS = {"other", "pronoun", "determiner", "conjunction"}

# Token → lexeme id: every stored surface, then the inflection keys the Index kept (a key two lexemes share is not there).
TOKEN_ID = {x["surface"]: x["id"] for x in reversed(LEXL)}
for _x in LEXL:
    _segs = INDEX.by.get(_x["surface"])
    for _key, _kana, _new in inflection_keys(_x["surface"], _x.get("reading", {}).get("kana", ""), _x["partOfSpeech"], _segs):
        if _key in INDEX.by and _key not in TOKEN_ID:
            TOKEN_ID[_key] = _x["id"]


def refs(text):
    out = []
    for tok, segs in INDEX.tokens(text):
        if segs is None or tok not in TOKEN_ID:
            continue
        if len(tok) == 1 and not HAN.search(tok):
            continue
        lid = TOKEN_ID[tok]
        if lid not in out:
            out.append(lid)
    return out


def content_refs(text):
    return [i for i in refs(text) if BY_ID[i]["partOfSpeech"] not in FUNCTION_POS]


PROBLEMS = []


def check(where, text, plain=False):
    for p in INDEX.problems(text):
        PROBLEMS.append(f"{where}: {p}")
    if not JA.search(text):
        PROBLEMS.append(f"{where}: no Japanese in {text!r}")
    if plain:
        return
    for end in sentence_ends(text):
        if len(end) > 3 and PLAIN_END.search(end) and not POLITE_END.search(end) and JA.search(end):
            PROBLEMS.append(f"{where}: plain-form ending {end!r} (the course speaks です/ます)")


def check_vi(where, text):
    if JA.search(text):
        PROBLEMS.append(f"{where}: Japanese inside the Vietnamese {text!r}")


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
    """A listening clip; segs = [(speaker, text)]. Every line is reading- and register-checked."""
    for _, t in segs:
        check(cid, t, plain)
    text = "".join(t for _, t in segs)
    return {"id": cid, "kind": kind, "segments": [{"speaker": s, "text": t} for s, t in segs], "objectiveRefs": objs, "lexemeRefs": refs(text),
            "sourceRef": "original-project", "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"}, "scoredPlaybackPolicy": {"maxPlays": 2, "rate": 1}}

"""Shared builder for the en-vi graded stories (the en-stories-NN.py batches import it).

A sentence is (speaker, English text, Vietnamese). translation.en is the sentence itself: the course's target is English,
so the English "translation" the schema asks for is the text. Voices: N and A are the male voice, B the female voice
(content/audio/voice-casts.json), so a man's lines are A and a woman's lines are B.

Questions are authored with the right option first; `story` moves it to a position taken from the story id and the question
number, so that the answer is not always the first option. Names and the possessive 's get their tokenMap entries here.
"""
import glob, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
LEX = json.load(open(os.path.join(ROOT, "lexicon", "lexemes.json"), encoding="utf-8"))["lexemes"]
BY_SURFACE = {l["surface"]: l["id"] for l in LEX}
BY_LOOKUP = {}
for l in LEX:
    BY_LOOKUP.setdefault(l["lookupForm"].lower(), l["id"])

# Spelled without diacritics, so that a voice can read them. None of them is a lexeme.
NAMES = set(
    "minh lan nam hoa tuan mai linh hung thu trang duc huong phuong quang dung khanh ha thao vy binh kien tam hien yen bao ngoc giang hai "
    "anna tom sarah john mary david peter maria carlos kim ken yuki priya ali chen emma jack lucy mike paul raj "
    "smith brown tran nguyen pham le vo lee "
    "hanoi hue saigon da nang haiphong sapa bac ninh singapore japan korea germany australia seoul tokyo london sydney india".split()
)
# Heads of a contraction ("what's"): the seed's file-level tokenMap resolves them.
CONTRACTED = set("i you he she it we they that there what where who here how let".split())
_POSSESSIVE = re.compile(r"\b([A-Za-z]+)['’]s\b")
_WORD = re.compile(r"[A-Za-z]+")


def lid(word):
    """Lexeme id by surface or lookup form."""
    if word in BY_SURFACE:
        return BY_SURFACE[word]
    k = word.lower()
    assert k in BY_LOOKUP, f"not in lexicon: {word}"
    return BY_LOOKUP[k]


def Q(vi, en, opts, kind="locate"):
    """A question whose first option is the right one."""
    return (kind, vi, en, opts)


def story(sid, band, title, blurb, new, sentences, questions, token_map=None):
    assert sum(1 for q in questions if q[0] == "infer") >= 1, f"{sid}: needs an inference question"
    full = f"en.story.{sid}"
    tm = {}
    for _, text, _vi in sentences:
        for m in _POSSESSIVE.finditer(text):
            head = m.group(1).lower()
            if head in NAMES:
                tm[f"{head}'"] = "name"
            elif head not in CONTRACTED:
                tm[f"{head}'"] = lid(head)
        for w in _WORD.findall(text):
            if w[0].isupper() and w.lower() in NAMES:
                tm[w.lower()] = "name"
    for k, v in (token_map or {}).items():
        tm[k.lower()] = v if v in ("function", "name") else lid(v)
    out = {"id": full, "band": band, "title": title, "blurb": {"vi": blurb[0], "en": blurb[1]}, "newLexemes": [lid(w) for w in new]}
    if tm:
        out["tokenMap"] = dict(sorted(tm.items()))
    out["sentences"] = [{"speaker": s, "text": t, "translation": {"vi": vi, "en": t}} for s, t, vi in sentences]
    seed = sum(ord(c) for c in full)
    rows = []
    for i, (kind, qv, qe, opts) in enumerate(questions):
        at = (seed + i) % len(opts)
        ordered = opts[1:at + 1] + opts[:1] + opts[at + 1:]
        rows.append({"kind": kind, "prompt": {"vi": qv, "en": qe}, "options": [{"vi": a, "en": b} for a, b in ordered], "answer": at})
    out["questions"] = rows
    out["sourceRef"] = "original-project"
    return out


def write_batch(name, stories):
    base = os.path.join(ROOT, "_drafts", "stories")
    d = os.path.join(base, "batches")
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, f"{name}.jsonl"), "w", encoding="utf-8", newline="\n") as f:
        for s in stories:
            f.write(json.dumps(s, ensure_ascii=False) + "\n")
    with open(os.path.join(base, "OUTPUT.jsonl"), "w", encoding="utf-8", newline="\n") as out:
        for fn in sorted(glob.glob(os.path.join(d, "*.jsonl"))):
            out.write(open(fn, encoding="utf-8").read())
    print(name, len(stories), "stories")

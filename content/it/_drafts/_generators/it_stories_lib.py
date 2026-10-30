"""Shared builder for it-vi graded stories (batches import it)."""
import json, os, glob

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
LEX = json.load(open(os.path.join(ROOT, "lexicon", "lexemes.json"), encoding="utf-8"))["lexemes"]
BY_SURFACE = {l["surface"]: l["id"] for l in LEX}
BY_LOOKUP = {}
for l in LEX:
    BY_LOOKUP.setdefault(l["lookupForm"].lower(), l["id"])


def lid(word):
    """Lexeme id by surface ('il ladro') or lookup form ('ladro')."""
    if word in BY_SURFACE:
        return BY_SURFACE[word]
    k = word.lower()
    assert k in BY_LOOKUP, f"not in lexicon: {word}"
    return BY_LOOKUP[k]


def story(sid, band, title, blurb, new, sentences, questions, names=(), token_map=None):
    tm = {n.lower(): "name" for n in names}
    for k, v in (token_map or {}).items():
        tm[k.lower()] = v if v in ("function", "name") or ":" in v else lid(v)
    out = {"id": f"it.story.{sid}", "band": band, "title": title, "blurb": {"vi": blurb[0], "en": blurb[1]}, "newLexemes": [lid(w) for w in new]}
    if tm:
        out["tokenMap"] = tm
    out["sentences"] = [{"speaker": s, "text": it, "translation": {"vi": vi, "en": en}} for s, it, vi, en in sentences]
    out["questions"] = [{"kind": k, "prompt": {"vi": qv, "en": qe}, "options": [{"vi": a, "en": b} for a, b in opts], "answer": ans} for k, qv, qe, opts, ans in questions]
    out["sourceRef"] = "original-project"
    return out


def write_batch(name, stories):
    d = os.path.join(ROOT, "_drafts", "stories", "batches")
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, f"{name}.jsonl"), "w", encoding="utf-8", newline="\n") as f:
        for s in stories:
            f.write(json.dumps(s, ensure_ascii=False) + "\n")
    with open(os.path.join(ROOT, "_drafts", "stories", "OUTPUT.jsonl"), "w", encoding="utf-8", newline="\n") as out:
        for fn in sorted(glob.glob(os.path.join(d, "*.jsonl"))):
            out.write(open(fn, encoding="utf-8").read())
    print(name, len(stories), "stories")

"""Shared builder for the es-vi graded-story top-up (QC 2026-10-29b §4).

Each batch file (es-stories-NN.py) builds its stories with `story()` and calls
`write_batch()`. The batch is written to content/es/_drafts/stories/batches/NN.jsonl;
then content/es/stories/stories.json is rebuilt as: the first ORIGINAL_COUNT
stories exactly as committed (the 20 stories before the top-up stay byte-identical),
followed by every batch in name order.

Run a batch with: python -I -X utf8 content/es/_drafts/_generators/es-stories-NN.py
"""
import json, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
LEXICON = os.path.join(ROOT, "content", "es", "lexicon", "lexemes.json")
STORIES = os.path.join(ROOT, "content", "es", "stories", "stories.json")
BATCHES = os.path.join(ROOT, "content", "es", "_drafts", "stories", "batches")
ORIGINAL_COUNT = 20

LEX = json.load(open(LEXICON, encoding="utf-8"))["lexemes"]
IDS = {l["id"] for l in LEX}
BY_SURFACE = {l["surface"]: l["id"] for l in LEX}
BY_LOOKUP = {}
for l in LEX:
    BY_LOOKUP.setdefault(l["lookupForm"].lower(), l["id"])


def lid(word):
    """Lexeme id: an explicit id ('es:w:donde-adverb'), a surface ('el hombre') or a lookup form ('hombre')."""
    if word.startswith("es:w:"):
        assert word in IDS, f"not in lexicon: {word}"
        return word
    if "es:w:" + word in IDS:
        return "es:w:" + word
    if word in BY_SURFACE:
        return BY_SURFACE[word]
    k = word.lower()
    assert k in BY_LOOKUP, f"not in lexicon: {word}"
    return BY_LOOKUP[k]


# Closed-class words the file-level functionWords list lacks (adverbs of time,
# conjunctions, vosotros/possessive pronouns, interjections). Added to a story's
# tokenMap only when the story uses them, so the 20 earlier stories are untouched.
AUTO_FUNCTION = {
    "ahora", "antes", "luego", "donde", "aunque", "mientras", "tan", "tanto", "poco", "poca", "pocos", "pocas",
    "os", "vuestro", "vuestra", "vuestros", "vuestras", "mío", "mía", "tuyo", "tuya", "suyo", "suya",
    "ningún", "ninguno", "ninguna", "algún", "alguno", "alguna", "algunos", "algunas", "tal", "durante",
    "contra", "sino", "según", "ay", "pues", "claro", "encima", "debajo", "delante", "detrás",
    "míos", "mías", "tuyos", "tuyas", "suyos", "suyas", "aquel", "aquella", "aquellos", "aquellas",
}
# Inflected forms the resolver cannot reach (z→c plurals, -or → -ora, a verb form shadowing a noun plural).
AUTO_LEXEME = {
    "muchos": "es:w:mucho", "muchas": "es:w:mucho", "mucha": "es:w:mucho",
    "cosas": "es:w:cosa", "veces": "es:w:vez", "voces": "es:w:voz", "partes": "es:w:parte",
    "profesora": "es:w:profesor", "profesores": "es:w:profesor", "señores": "es:w:senor",
    "casas": "es:w:casa", "meses": "es:w:mes", "libres": "es:w:libre", "zapato": "es:w:zapatos",
    "pruebas": "es:w:prueba", "jefa": "es:w:jefe", "jóvenes": "es:w:joven",
}
# From band A1-2 on, the subject pronouns and question words are graded as the
# syllabus lexemes they are (they are function words in an A1-1 story).
AUTO_PRONOUN = {
    "yo": "es:w:yo", "tú": "es:w:tu", "usted": "es:w:usted", "ustedes": "es:w:ustedes",
    "nosotros": "es:w:nosotros", "ellos": "es:w:ellos", "quién": "es:w:quien", "cuál": "es:w:cual",
    "dónde": "es:w:donde-adverb", "cuándo": "es:w:cuando",
}


for _v in list(AUTO_LEXEME.values()) + list(AUTO_PRONOUN.values()):
    assert _v in IDS, f"not in lexicon: {_v}"


def _words(sentences):
    import re
    return {w.lower() for _, es, _, _ in sentences for w in re.findall(r"[^\W\d_]+", es)}


def story(sid, band, title, blurb, new, sentences, questions, names=(), token_map=None):
    tm = {}
    used = _words(sentences)
    auto = {**{w: "function" for w in AUTO_FUNCTION}, **AUTO_LEXEME, **(AUTO_PRONOUN if band != "A1-1" else {})}
    for k, v in sorted(auto.items()):
        if k in used:
            tm[k] = v
    for n in names:
        tm[n.lower()] = "name"
    for k, v in (token_map or {}).items():
        tm[k.lower()] = v if v in ("function", "name") else lid(v)
    out = {"id": f"es.story.{sid}", "band": band, "title": title, "blurb": {"vi": blurb[0], "en": blurb[1]},
           "newLexemes": [lid(w) for w in new]}
    if tm:
        out["tokenMap"] = tm
    out["sentences"] = [{"speaker": s, "text": es, "translation": {"vi": vi, "en": en}} for s, es, vi, en in sentences]
    out["questions"] = [{"kind": k, "prompt": {"vi": qv, "en": qe}, "options": [{"vi": a, "en": b} for a, b in opts], "answer": ans}
                        for k, qv, qe, opts, ans in questions]
    out["sourceRef"] = "original-project"
    return out


def dump(doc):
    return json.dumps(doc, ensure_ascii=False, indent=2) + "\n"


def write_batch(name, stories):
    os.makedirs(BATCHES, exist_ok=True)
    with open(os.path.join(BATCHES, f"{name}.jsonl"), "w", encoding="utf-8", newline="\n") as f:
        for s in stories:
            f.write(json.dumps(s, ensure_ascii=False) + "\n")
    raw = open(STORIES, encoding="utf-8").read()
    doc = json.loads(raw)
    original = doc["stories"][:ORIGINAL_COUNT]
    added = []
    for fn in sorted(os.listdir(BATCHES)):
        for line in open(os.path.join(BATCHES, fn), encoding="utf-8"):
            if line.strip():
                added.append(json.loads(line))
    ids = [s["id"] for s in original + added]
    assert len(ids) == len(set(ids)), "duplicate story id"
    doc["stories"] = original + added
    with open(STORIES, "w", encoding="utf-8", newline="\n") as f:
        f.write(dump(doc))
    print(name, len(stories), "stories; total", len(doc["stories"]))

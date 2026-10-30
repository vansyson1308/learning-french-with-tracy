"""Back-translation consistency pass over it-vi: flags a pair when a meaning marker disagrees between the Italian and the Vietnamese.
usage: python -I it-backtrans.py <repo root>"""
import io, json, re, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
ROOT = sys.argv[1]
load = lambda p: json.load(open(f"{ROOT}/{p}", encoding="utf-8"))
NEG_IT = re.compile(r"\b(non|nessun\w*|mai|niente|nulla|né|no)\b", re.I)
NEG_VI = re.compile(r"\b(không|chẳng|chưa|đừng|chả|đâu có|miễn phí|hết|thiếu|im lặng)\b", re.I)
QUESTION_NOT = re.compile(r"(không|chưa)\s*(ạ|nhỉ|nhé|vậy|thế)?\s*\?|không khí|không sao|không gian|có .* không", re.I)
NUMBERS = dict(zip("zero uno due tre quattro cinque sei sette otto nove dieci".split(), range(11)))
pairs = {"pack": [], "exercises": [], "glosses": [], "examples": [], "stories": [], "concepts": []}

course = load("content/courses/it-vi.json")
for section in course["sections"]:
    for unit in section["units"]:
        for w in unit.get("words", []):
            pairs["pack"].append((w["target"], w.get("native", w.get("translation", ""))))
        for lesson in unit["lessons"]:
            for e in lesson["exercises"]:
                t = e["type"]
                if t == "match":
                    pairs["exercises"] += [(p["target"], p["native"]) for p in e["pairs"]]
                elif t in ("fillBlank", "conjugationCloze") and e.get("translation"):
                    pairs["exercises"].append((e.get("sentence", ""), e["translation"]))
                elif t == "select" and e.get("mode") in ("targetToNative", "nativeToTarget"):
                    right = e["options"][e["correct"]]["text"]
                    pairs["exercises"].append((e["prompt"], right) if e["mode"] == "targetToNative" else (right, e["prompt"]))
                elif t in ("typeAnswer", "wordBank") and e.get("prompt"):
                    a = e.get("answer")
                    pairs["exercises"].append((" ".join(a) if isinstance(a, list) else str(a), e["prompt"]))

lex = load("content/it/lexicon/lexemes.json")["lexemes"]
for l in lex:
    gloss = l.get("glosses", {}).get("vi")
    if gloss:
        pairs["glosses"].append((l["surface"], gloss if isinstance(gloss, str) else "; ".join(gloss)))
    for ex in l.get("examples", []):
        pairs["examples"].append((ex.get("target") or ex.get("text", ""), (ex.get("translations") or ex.get("translation") or {}).get("vi", "")))

stories = load("content/it/stories/stories.json")
for s in stories if isinstance(stories, list) else stories["stories"]:
    pairs["stories"] += [(x["text"], x["translation"]["vi"]) for x in s["sentences"]]

for path in ("content/it/concepts.json", "content/it/pedagogy/concepts.json"):
    try:
        data = load(path)
    except OSError:
        continue
    for c in data if isinstance(data, list) else data.get("concepts", []):
        for ex in c.get("examples", []):
            pairs["concepts"].append((ex["target"], ex["translations"]["vi"]))

flags = []
for group, items in pairs.items():
    for it, vi in items:
        kinds = []
        if not vi.strip():
            kinds.append("empty")
        elif it.strip().lower() == vi.strip().lower() and " " in it:
            kinds.append("copy")
        for d in re.findall(r"\d+", it):
            if d not in vi:
                kinds.append(f"digit {d}")
        # "Mai" is also a person's name in the stories, always capitalised and never negating there.
        neg_it, neg_vi = bool(NEG_IT.search(re.sub(r"\bMai\b", "", it))), bool(NEG_VI.search(QUESTION_NOT.sub("", vi)))
        if neg_it != neg_vi:
            kinds.append("negation")
        if group in ("stories", "examples", "concepts") and it.rstrip().endswith("?") != vi.rstrip().endswith("?"):
            kinds.append("question")
        if kinds:
            flags.append((group, kinds, it, vi))
print({k: len(v) for k, v in pairs.items()}, "total", sum(len(v) for v in pairs.values()), "flags", len(flags))
for g, k, it, vi in flags:
    print(g, k, "|", it, "||", vi)

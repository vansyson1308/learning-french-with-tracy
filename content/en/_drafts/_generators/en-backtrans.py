"""Back-translation consistency pass over en-vi: flags a pair when a meaning marker disagrees between the English and the Vietnamese.
usage: python -I en-backtrans.py <repo root>"""
import io, json, re, sys

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
ROOT = sys.argv[1]
load = lambda p: json.load(open(f"{ROOT}/{p}", encoding="utf-8"))
NEG_EN = re.compile(r"\b(not|no|never|none|nothing|nobody|no one|nowhere|neither|nor|without|cannot)\b|n['’]t\b", re.I)
NEG_VI = re.compile(r"\b(không|chẳng|chưa|đừng|chả|đâu có|miễn phí|hết|thiếu|im lặng|cấm)\b", re.I)
# Vietnamese questions and set phrases where không or chưa is no negation; the English side of them says so with a question mark.
QUESTION_NOT = re.compile(r"(không|chưa)\s*(ạ|nhỉ|nhé|vậy|thế|anh|chị|em|bạn|mẹ|con)?\s*\?|không khí|không sao|không gian|có .* không|phải không", re.I)
pairs = {"pack": [], "exercises": [], "glosses": [], "examples": [], "stories": [], "concepts": []}

course = load("content/courses/en-vi.json")
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

lex = load("content/en/lexicon/lexemes.json")["lexemes"]
for l in lex:
    gloss = l.get("glosses", {}).get("vi")
    if gloss:
        pairs["glosses"].append((l["surface"], gloss if isinstance(gloss, str) else "; ".join(gloss)))
    for ex in l.get("examples", []):
        pairs["examples"].append((ex.get("target", ""), ex.get("translations", {}).get("vi", "")))

for s in load("content/en/stories/stories.json")["stories"]:
    pairs["stories"] += [(x["text"], x["translation"]["vi"]) for x in s["sentences"]]

for c in load("content/en/pedagogy/concepts.json")["concepts"]:
    for ex in c.get("examples", []):
        pairs["concepts"].append((ex["target"], ex["translations"]["vi"]))

flags = []
for group, items in pairs.items():
    for en, vi in items:
        kinds = []
        if not vi.strip():
            kinds.append("empty")
        elif en.strip().lower() == vi.strip().lower() and " " in en:
            kinds.append("copy")
        for d in re.findall(r"\d+", en):
            if d not in vi:
                kinds.append(f"digit {d}")
        neg_en, neg_vi = bool(NEG_EN.search(en)), bool(NEG_VI.search(QUESTION_NOT.sub("", vi)))
        if neg_en != neg_vi:
            kinds.append("negation")
        if group in ("stories", "examples", "concepts") and en.rstrip().endswith("?") != vi.rstrip().endswith("?"):
            kinds.append("question")
        if kinds:
            flags.append((group, kinds, en, vi))
print({k: len(v) for k, v in pairs.items()}, "total", sum(len(v) for v in pairs.values()), "flags", len(flags))
for g, k, en, vi in flags:
    print(g, k, "|", en, "||", vi)

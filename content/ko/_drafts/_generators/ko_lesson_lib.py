"""The exercise DSL of the ko-vi lesson generators (ko-lessons-s1.py … ko-lessons-s6.py), after ja_lesson_lib.py.

Every helper returns one exercise without an id; lesson() numbers them and builds the flow. Every Korean string goes
through ko_text.Index: a word that is no lexicon surface, no form of a lexicon verb, no noun with its particles, a wrong
particle or copula allomorph (물를, 학생예요), a number of the wrong system before a counter (삼 시, 다섯 원), Latin
letters or a 반말 sentence end stops the generator. finish() also stops on a duplicate payload, a broken word bank, a
lesson of under five exercises, a Vietnamese prompt that shows Korean, or an option whose Vietnamese gloss is the same as
the key's.

Answer keys:
 - Y() is a typed Korean answer (Section 2 on). It adds the renderings a learner may fairly type (ko_text.variants: the
   subject or owner the Vietnamese states, numbers in digits or Hangul, 안 ⇄ -지 않아요, an object particle dropped …).
   Section 1 never uses Y() (ja decision 22, kept for ko: no free Hangul typing before the primer); its production
   items are W() word banks and N() / NX() choices. ko-check-answers.py stops on a typed item there.
 - W() takes tiles written with | between them (one tile = one spaced word, 어절, so the sentence keeps its spacing); a
   distractor tile may not repeat a tile of the answer.
 - Particle fill-ins (F with a particle key) never offer two particles that both fit (은/는 with 이/가, 에 with 에서 for
   살다, 에 with (으)로 for a verb of motion, 하고 with 와/과): ko-check-answers.py reads them.
 - K() is a conjugationCloze whose key is the verb's paradigm cell (ko_paradigms.py); the validator evidences every
   cell against the kaikki rows of the verb (scripts/lib/languages/ko-morph.ts tagKoreanCells).
반말 sentence ends appear only in exercises marked plain=True (recognition: unit k).
"""
import json, os, re, sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from ko_paradigms import TABLES  # noqa: E402
from ko_text import Index, _eu, aeo, load_lexicon, same_answer, variants  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")
ROOT = sys.argv[1]
DRAFTS = f"{ROOT}/content/ko/_drafts"
COURSE = "ko-vi"
LEXL = load_lexicon(ROOT)
LEX = {x["surface"]: x for x in LEXL}
INDEX = Index(LEXL)


def _jsonl(path):
    return [json.loads(x) for x in open(path, encoding="utf-8") if x.strip()] if os.path.exists(path) else []


EMOJI = {w["target"]: w["emoji"] for u in _jsonl(f"{DRAFTS}/units/OUTPUT.jsonl") for w in u["words"]}
CONCEPTS = {c["id"] for c in _jsonl(f"{DRAFTS}/concepts/OUTPUT.jsonl") if "id" in c}

Q_LISTEN = "Nghe rồi chọn từ bạn nghe thấy."
Q_LISTEN_S = "Nghe rồi chọn câu bạn nghe thấy."
_pos = [0]
_seed = [0]
RECORDS = []
PROBLEMS = []
KO = re.compile(r"[가-힣ㄱ-ㅣ]")


def g(surface):
    """The first Vietnamese gloss of a lexeme; a bracket the ; cut open is closed."""
    first = LEX[surface]["glosses"]["vi"].split(";")[0].strip()
    return first + ")" if first.count("(") > first.count(")") else first


def head(gloss):
    """A gloss without its bracketed note, for comparing meanings."""
    x = gloss.split(";")[0]
    return (re.sub(r"\s*\(.*?\)?\s*$", "", x).strip() or x).lower()


def place(correct, wrong):
    if len(wrong) != 3:
        PROBLEMS.append(f"{correct}: {len(wrong)} distractors")
    if correct in wrong or len(set(wrong)) != len(wrong):
        PROBLEMS.append(f"{correct}: a distractor repeats an option: {wrong}")
    p = _pos[0] % 4
    _pos[0] += 1
    o = list(wrong)
    o.insert(p, correct)
    return o, p


def _word_options(pairs):
    """Pictures only when all four options have one and no two share it."""
    emojis = [EMOJI.get(s) for s, _ in pairs]
    use = all(emojis) and len(set(emojis)) == len(emojis)
    return [({"text": t, "emoji": e} if use else {"text": t}) for (_, t), e in zip(pairs, emojis)]


def _same_meaning(surface, others):
    if surface not in LEX:
        PROBLEMS.append(f"{surface} is not a lexeme")
        return
    for o in others:
        if o not in LEX:
            PROBLEMS.append(f"option {o} is not a lexeme")
        elif head(g(o)) == head(g(surface)):
            PROBLEMS.append(f"{surface} and {o} share the gloss {g(surface)!r}: two options fit")


def T(surface, wrong):
    """The word shown (and heard): choose its Vietnamese."""
    _same_meaning(surface, wrong)
    order, p = place(surface, wrong)
    return {"type": "select", "mode": "targetToNative", "prompt": surface, "audioTarget": surface, "options": _word_options([(s, g(s)) for s in order]), "correct": p}


def N(surface, wrong, prompt=None):
    """The Vietnamese shown: choose the Korean word."""
    _same_meaning(surface, wrong)
    order, p = place(surface, wrong)
    return {"type": "select", "mode": "nativeToTarget", "prompt": prompt or g(surface), "audioTarget": surface, "options": _word_options([(s, s) for s in order]), "correct": p}


def H(surface, wrong):
    """Heard: choose the word or sentence."""
    order, p = place(surface, wrong)
    q = Q_LISTEN_S if " " in surface or re.search(r"[.?!]", surface) else Q_LISTEN
    return {"type": "select", "mode": "listen", "prompt": q, "audioTarget": surface, "options": [{"text": s} for s in order], "correct": p}


def TX(ko, vi, wrong, plain=False):
    """A Korean sentence: choose its Vietnamese."""
    o, p = place(vi, wrong)
    return _mark({"type": "select", "mode": "targetToNative", "prompt": ko, "audioTarget": ko, "options": [{"text": t} for t in o], "correct": p}, plain)


def NX(vi, ko, wrong, plain=False):
    """A Vietnamese sentence or situation: choose the Korean. Distractors are wrong on purpose (particle, word, form)."""
    o, p = place(ko, wrong)
    return _mark({"type": "select", "mode": "nativeToTarget", "prompt": vi, "audioTarget": ko, "options": [{"text": t} for t in o], "correct": p}, plain)


def M(*surfaces):
    for s in surfaces:
        if s not in LEX:
            PROBLEMS.append(f"match: {s} is not a lexeme")
    return {"type": "match", "pairs": [{"target": s, "native": g(s)} for s in surfaces]}


def MP(*pairs):
    return {"type": "match", "pairs": [{"target": a, "native": b} for a, b in pairs]}


def F(sentence, answer, wrong, vi, plain=False):
    """fillBlank; a particle key makes it a particle fill-in (the article slot of the blueprint)."""
    o, p = place(answer, wrong)
    e = {"type": "fillBlank", "sentence": sentence, "translation": vi, "audioTarget": sentence.replace("___", answer), "options": o, "correct": p}
    return _mark(e, plain)


def Y(vi, ko, *alts, plain=False):
    """Typed Korean from a Vietnamese prompt (Section 2 on), with every fair rendering (ko_text.variants)."""
    more = []
    for a in list(alts):
        if a != ko and a not in more:
            more.append(a)
    for base in [ko] + list(alts):
        for x in variants(vi, base, INDEX):
            if x != ko and x not in more:
                more.append(x)
    e = {"type": "typeAnswer", "mode": "produceTarget", "prompt": vi, "audioTarget": ko, "answer": ko, "alternatives": more}
    return _mark(e, plain)


def _tiles(answer, extra, label):
    for x in extra:
        if x in answer:
            PROBLEMS.append(f"{label}: distractor tile \"{x}\" is also in the answer")
    toks = answer + list(extra)
    _seed[0] += 1
    s = _seed[0]
    order = sorted(range(len(toks)), key=lambda i: ((i * 5 + s * 3) % 7, i))
    if [toks[i] for i in order] == answer + list(extra):
        order = order[1:] + order[:1]
    return [toks[i] for i in order]


def W(vi, ko, extra, alts=(), plain=False, end=None):
    """Tiles to a Korean sentence; ko is written with | between the tiles (spaced words)."""
    ans = [x.strip() for x in ko.split("|")]
    punct = end if end is not None else ("?" if vi.rstrip().endswith("?") else ".")
    spoken = " ".join(ans)
    if not re.search(r"[.?!]$", spoken):
        spoken += punct
    e = {"type": "wordBank", "direction": "nativeToTarget", "prompt": vi, "audioTarget": spoken, "tokens": _tiles(ans, extra, ko), "answer": ans}
    alts = list(alts)
    # A tile the learner may fairly leave out (저는, 우리, 제: ko_text.variants) is an alternative too (D-10 P0 family).
    for i in range(len(ans)):
        shorter = ans[:i] + ans[i + 1:]
        if len(ans) > 1 and same_answer(" ".join(ans), " ".join(shorter), INDEX, vi) and "|".join(shorter) not in alts:
            alts.append("|".join(shorter))
    if alts:
        e["alternatives"] = [[x.strip() for x in a.split("|")] for a in alts]
        for a in e["alternatives"]:
            if Counter(a) - Counter(e["tokens"]):
                PROBLEMS.append(f"{ko}: alternative {a} is not built from the tiles")
    return _mark(e, plain)


def WT(ko, vi, extra):
    """Tiles to a Vietnamese sentence. Tiles are words, written with | between them."""
    ans = [x.strip() for x in vi.split("|")]
    return {"type": "wordBank", "direction": "targetToNative", "prompt": ko, "audioTarget": ko, "tokens": _tiles(ans, extra, ko), "answer": ans}


def K(sentence, verb, cell, vi):
    """conjugationCloze: the key is the verb's paradigm cell (ko_paradigms.py, evidenced by the kaikki rows). A future
    key (갈 거예요) also accepts the spelling without its space (strict grading keeps spaces)."""
    t = TABLES.get(verb)
    if t is None or cell not in t["cells"]:
        PROBLEMS.append(f"{sentence}: {verb} has no paradigm cell {cell}")
        return {"type": "conjugationCloze", "sentence": sentence, "translation": vi, "verb": verb, "cell": cell, "answer": "?", "alternatives": []}
    if sentence.count("___") != 1:
        PROBLEMS.append(f"{sentence}: a cloze has exactly one ___")
    ans = t["cells"][cell]
    alts = [ans.replace(" ", "")] if " " in ans else []
    if cell == "hon:pre":
        # "Hãy viết …" is answered as well by the favour (써 주세요) and the formal imperative (쓰십시오).
        alts += [aeo(verb) + " 주세요", aeo(verb) + "주세요", _eu(verb, "십시오")]
    return {"type": "conjugationCloze", "sentence": sentence, "translation": vi, "verb": verb, "cell": cell, "answer": ans, "alternatives": alts}


def C(concept):
    return {"concept": f"ko:concept:{concept}"}


def _mark(e, plain):
    if plain:
        e["_plain"] = True
    return e


# ---------------------------------------------------------------- what a learner reads in Korean
def keyed(e):
    """The Korean of the key: what must be right."""
    t = e["type"]
    if t == "select":
        if e["mode"] == "targetToNative":
            return [e["prompt"]]
        return [e["options"][e["correct"]]["text"]]
    if t == "wordBank":
        return [" ".join(e["answer"])] + [" ".join(a) for a in e.get("alternatives", [])] if e["direction"] == "nativeToTarget" else [e["prompt"]]
    if t == "match":
        return [p["target"] for p in e["pairs"]]
    if t == "fillBlank":
        return [e["audioTarget"]]
    if t == "typeAnswer":
        return [e["answer"]] + list(e["alternatives"])
    if t == "conjugationCloze":
        return [e["sentence"].replace("___", e["answer"])]
    return []


def shown(e):
    """Every Korean string the learner sees, distractors included."""
    t = e["type"]
    out = list(keyed(e))
    if t == "conjugationCloze":
        out.append(e["verb"])
    if t == "select" and e["mode"] != "targetToNative":
        out += [o["text"] for o in e["options"]]
    if t == "wordBank" and e["direction"] == "nativeToTarget":
        out += e["tokens"]
    if t == "fillBlank":
        out += [e["sentence"].replace("___", o) for o in e["options"]]
    return out


def _check(eid, e):
    plain = e.pop("_plain", False)
    distractor_texts = set()
    if e["type"] == "fillBlank":
        distractor_texts = {e["sentence"].replace("___", o) for i, o in enumerate(e["options"]) if i != e["correct"]}
    if e["type"] == "select" and e["mode"] != "targetToNative":
        distractor_texts = {o["text"] for i, o in enumerate(e["options"]) if i != e["correct"]}
    if e["type"] == "wordBank" and e["direction"] == "nativeToTarget":
        distractor_texts = set(e["tokens"]) - set(e["answer"])
    for text in set(shown(e)) - distractor_texts:
        for p in INDEX.problems(text):
            PROBLEMS.append(f"{eid}: {p}")
    # Distractors are wrong on purpose (a particle, an allomorph, a conjugation, a number system, a near sound): only
    # the script is checked. ko-check-answers.py reads them for a distractor that is also correct.
    for text in distractor_texts:
        if re.search(r"[A-Za-z一-鿿]", text):
            PROBLEMS.append(f"{eid}: distractor {text!r} is not Hangul")
    if not plain:
        for text in keyed(e):
            if text in LEX:
                continue
            for last, kind in INDEX.sentence_ends(text):
                if kind == "banmal":
                    PROBLEMS.append(f"{eid}: 반말 sentence end {last!r} in a 해요체 exercise")
    prompt = None
    if e["type"] == "typeAnswer" or (e["type"] == "wordBank" and e["direction"] == "nativeToTarget") or (e["type"] == "select" and e["mode"] == "nativeToTarget"):
        prompt = e["prompt"]
    if e["type"] in ("fillBlank", "conjugationCloze"):
        prompt = e["translation"]
    if prompt and KO.search(prompt):
        PROBLEMS.append(f"{eid}: Vietnamese prompt {prompt!r} holds Korean")
    if e["type"] == "select" and e["mode"] == "targetToNative" and any(KO.search(o["text"]) for o in e["options"]):
        PROBLEMS.append(f"{eid}: a Vietnamese option holds Korean")
    if e["type"] == "wordBank" and e["direction"] == "targetToNative" and any(KO.search(t) for t in e["tokens"]):
        PROBLEMS.append(f"{eid}: a Vietnamese tile holds Korean")
    return plain


def lesson(lid, steps):
    full = f"{COURSE}:{lid}"
    ex, flow, has_concept = [], [], False
    for st in steps:
        if "concept" in st:
            if CONCEPTS and st["concept"] not in CONCEPTS:
                PROBLEMS.append(f"{lid}: unknown concept {st['concept']}")
            flow.append(st)
            has_concept = True
        else:
            e = dict(st)
            e = {"type": e.pop("type"), "id": f"{full}-e{len(ex)}", **e}
            _check(e["id"], e)
            ex.append(e)
            flow.append({"exercise": e["id"]})
    rec = {"lessonId": full, "exercises": ex}
    if has_concept:
        rec["flow"] = flow
    if len(ex) < 5:
        PROBLEMS.append(f"{lid}: {len(ex)} exercises")
    RECORDS.append(rec)


def finish(part):
    """Write this generator's lessons to lessons/parts/<part>.jsonl and stop on any problem."""
    seen = {}
    for r in RECORDS:
        for e in r["exercises"]:
            key = json.dumps({k: v for k, v in e.items() if k != "id"}, ensure_ascii=False, sort_keys=True)
            if key in seen:
                PROBLEMS.append(f"{e['id']} repeats {seen[key]}")
            seen[key] = e["id"]
    for p in PROBLEMS:
        print(p, file=sys.stderr)
    if PROBLEMS:
        sys.exit(f"{part}: {len(PROBLEMS)} problem(s)")
    os.makedirs(f"{DRAFTS}/lessons/parts", exist_ok=True)
    with open(f"{DRAFTS}/lessons/parts/{part}.jsonl", "w", encoding="utf-8", newline="\n") as f:
        for r in RECORDS:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    mix = Counter(e["type"] for r in RECORDS for e in r["exercises"])
    print(part, len(RECORDS), "lessons", sum(len(r["exercises"]) for r in RECORDS), "exercises", dict(sorted(mix.items())), "flow", sum(1 for r in RECORDS if "flow" in r))

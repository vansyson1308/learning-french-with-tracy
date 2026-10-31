"""The exercise DSL of the en-vi lesson generators (en-lessons-s1.py, -s2.py, -s3.py).

Every helper returns one exercise without an id; lesson() numbers them and builds the flow. Each English string is level-checked
through en_refs.check, and finish() stops the generator on an off-level word, a duplicate payload, a broken word bank, a lesson of
under five exercises or a prompt that shows its own answer. Answer keys are the worst failure, so:
 - Y() adds what a learner may fairly type: digits for number words, and the synonyms of SYNONYMS. The English rules already fold
   contractions (I'm = I am), case and punctuation, so contractions are not listed. Other word orders are passed by hand.
 - D() (dictation, strict comparison, no contraction folding) lists contractions by hand.
 - W() fails if a distractor tile repeats a tile of the answer, and takes other correct orders in alts.
"""
import json, os, re, sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from en_refs import check, report, write_jsonl  # noqa: E402

ROOT = sys.argv[1]
DRAFTS = f"{ROOT}/content/en/_drafts"
COURSE = "en-vi"
LEX = {x["surface"]: x for x in json.load(open(f"{ROOT}/content/en/lexicon/lexemes.json", encoding="utf-8"))["lexemes"]}
EMOJI = {w["target"]: w["emoji"] for s in json.load(open(f"{DRAFTS}/pack.json", encoding="utf-8"))["sections"] for u in s["units"] for w in u["words"]}
_stg = f"{DRAFTS}/staged/content/en/pedagogy/paradigms.json"
PAR = {t["lemma"]: t["cells"] for t in json.load(open(_stg, encoding="utf-8"))["tables"]}
CONCEPTS = {c["id"] for c in json.load(open(f"{DRAFTS}/staged/content/en/pedagogy/concepts.json", encoding="utf-8"))["concepts"]}


def _jsonl(step):
    return [json.loads(x) for x in open(f"{DRAFTS}/{step}/OUTPUT.jsonl", encoding="utf-8") if x.strip()]


SPEECH = {x["id"]: x for x in _jsonl("speech")}
WRITING = {x["id"]: x for x in _jsonl("writing")}
SCENARIOS = {x["id"]: x for x in _jsonl("scenarios")}
CLIPS = {x["id"]: x for x in _jsonl("listening")}
READINGS = {x["id"]: x for x in _jsonl("readings")}

Q_LISTEN = "Nghe rồi chọn từ bạn nghe thấy."
Q_LISTEN_S = "Nghe rồi chọn câu bạn nghe thấy."
_pos = [0]
_seed = [0]
RECORDS = []
PROBLEMS = []

NUM = {w: str(i) for i, w in enumerate("zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split())}
for _i, _t in enumerate("twenty thirty forty fifty sixty seventy eighty ninety".split()):
    NUM[_t] = str((_i + 2) * 10)
    for _j, _u in enumerate("one two three four five six seven eight nine".split()):
        NUM[f"{_t}-{_u}"] = str((_i + 2) * 10 + _j + 1)
NUM["one hundred"] = "100"
NUM["a hundred"] = "100"
# Words the course does not teach but a learner may fairly use for the same Vietnamese prompt. Same meaning in every sentence here.
SYNONYMS = [("movie", "film"), ("movies", "films"), ("shop", "store"), ("motorbike", "motorcycle"), ("bike", "bicycle"), ("mother", "mom"), ("mother", "mum"), ("father", "dad"),
            ("thank you", "thanks"), ("hello", "hi"), ("goodbye", "bye"), ("taxi", "cab"), ("sick", "ill"), ("toilet", "restroom"), ("vacation", "holiday"), ("big", "large"), ("football", "soccer")]
# Vietnamese words that are also English words: not a leak when both happen to occur.
VI_HOMOGRAPHS = set("tom email".split())
# Wrong forms a distractor shows on purpose (adjectives take no plural): not level words.
TRAPS = re.compile(r"\b(?:bigs|reds)\b", re.I)


def g(surface):
    return LEX[surface]["glosses"]["vi"].split(";")[0].strip()


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


def _word_options(pairs, p):
    """Pictures only when all four options have one and no two share it."""
    emojis = [EMOJI.get(s) for s, _ in pairs]
    use = all(emojis) and len(set(emojis)) == len(emojis)
    return [({"text": t, "emoji": e} if use else {"text": t}) for (_, t), e in zip(pairs, emojis)]


def T(surface, wrong):
    """The word shown (and heard): choose its Vietnamese."""
    order, p = place(surface, wrong)
    return {"type": "select", "mode": "targetToNative", "prompt": surface, "audioTarget": surface, "options": _word_options([(s, g(s)) for s in order], p), "correct": p}


def N(surface, wrong, prompt=None):
    """The Vietnamese shown: choose the English word."""
    order, p = place(surface, wrong)
    return {"type": "select", "mode": "nativeToTarget", "prompt": prompt or g(surface), "audioTarget": surface, "options": _word_options([(s, s) for s in order], p), "correct": p}


def H(surface, wrong):
    """Heard: choose the word."""
    order, p = place(surface, wrong)
    return {"type": "select", "mode": "listen", "prompt": Q_LISTEN if len(surface.split()) < 3 else Q_LISTEN_S, "audioTarget": surface, "options": [{"text": s} for s in order], "correct": p}


def TX(en, vi, wrong):
    """An English sentence: choose its Vietnamese."""
    o, p = place(vi, wrong)
    return {"type": "select", "mode": "targetToNative", "prompt": en, "audioTarget": en, "options": [{"text": t} for t in o], "correct": p}


def NX(vi, en, wrong):
    """A Vietnamese sentence: choose its English. The distractors may be wrong English on purpose (the Vietnamese learner's traps)."""
    o, p = place(en, wrong)
    return {"type": "select", "mode": "nativeToTarget", "prompt": vi, "audioTarget": en, "options": [{"text": t} for t in o], "correct": p}


def M(*surfaces):
    return {"type": "match", "pairs": [{"target": s, "native": g(s)} for s in surfaces]}


def MP(*pairs):
    return {"type": "match", "pairs": [{"target": a, "native": b} for a, b in pairs]}


def F(sentence, answer, wrong, vi):
    o, p = place(answer, wrong)
    return {"type": "fillBlank", "sentence": sentence, "translation": vi, "audioTarget": sentence.replace("___", answer), "options": o, "correct": p}


def _digits(text):
    def sub(m):
        return NUM.get(m.group(0).lower(), m.group(0))

    return re.sub(r"\b(?:one hundred|a hundred|(?:twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:-(?:one|two|three|four|five|six|seven|eight|nine))?|zero|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\b", sub, text, flags=re.I)


def _fold(text):
    return re.sub(r"[.,!?;:\"]", "", text.lower().replace("’", "'")).strip()


def accepted(answer, alts, digits=True):
    """The alternatives of a typed answer: the authored ones, then digits and synonyms of each."""
    out, seen = [], {_fold(answer)}

    def add(x):
        if _fold(x) not in seen:
            seen.add(_fold(x))
            out.append(x)

    for a in alts:
        add(a)
    for base in [answer] + list(alts):
        d = _digits(base)
        if digits and d != base:
            add(d)
        for a, b in SYNONYMS:
            for pattern, rep in ((rf"\b{a}\b", b), (rf"\b{a.capitalize()}\b", b.capitalize())):
                s = re.sub(pattern, rep, base)
                if s != base:
                    add(s)
    return out


def Y(vi, en, *alts, digits=True):
    """Typed English from a Vietnamese prompt. digits=False when spelling the number IS the exercise."""
    return {"type": "typeAnswer", "mode": "produceTarget", "prompt": vi, "audioTarget": en, "answer": en, "alternatives": accepted(en, alts, digits)}


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


def _tok(en):
    return [t.strip(".,!?") for t in en.split() if t.strip(".,!?")]


def W(vi, en, extra, alts=()):
    """Tiles to an English sentence."""
    ans = _tok(en)
    e = {"type": "wordBank", "direction": "nativeToTarget", "prompt": vi, "tokens": _tiles(ans, extra, en), "answer": ans}
    if alts:
        # Grading folds case, but the validator matches an alternative against the tiles exactly: use the tile's own case.
        tile = {t.lower(): t for t in e["tokens"]}
        e["alternatives"] = [[tile.get(t.lower(), t) for t in _tok(a)] for a in alts]
    return e


def WT(en, vi, extra):
    """Tiles to a Vietnamese sentence. Tiles are words, written with | between them, so "giáo viên" stays one tile."""
    ans = [x.strip() for x in vi.split("|")]
    return {"type": "wordBank", "direction": "targetToNative", "prompt": en, "audioTarget": en, "tokens": _tiles(ans, extra, en), "answer": ans}


def J(sentence, verb, cell, vi, alts=()):
    """conjugationCloze; the answer is the committed paradigm cell. A blank never opens the sentence: the key is lower case."""
    if sentence.startswith("___"):
        PROBLEMS.append(f"{sentence}: a cloze blank opens the sentence")
    return {"type": "conjugationCloze", "sentence": sentence, "translation": vi, "verb": verb, "cell": cell, "answer": PAR[verb][cell], "alternatives": list(alts)}


def LC(clip, q, ans, wrong, objs=None):
    o, p = place(ans, wrong)
    e = {"type": "listeningComprehension", "clipId": f"en.clip.{clip}", "question": q, "options": [{"text": t} for t in o], "correct": p}
    if objs:
        e["objectiveTargets"] = objs
    return e


def RC(reading, q, ans, wrong):
    o, p = place(ans, wrong)
    return {"type": "readingComprehension", "readingId": f"en.read.{reading}", "question": q, "options": [{"text": t} for t in o], "correct": p}


def D(clip, ans, *alts):
    return {"type": "dictation", "clipId": f"en.clip.{clip}", "answer": ans, "alternatives": list(alts), "objectiveTargets": ["en.obj.listening.familiar_words"]}


def SP(slug, more=()):
    """A speech exercise mirroring its item. A review lesson re-using an item names one more objective, so the two are not one payload."""
    sid = f"en.speak.{slug}"
    it = SPEECH[sid]
    objs = it["objectiveRefs"] + [f"en.obj.{m}" for m in more]
    if it["elicitationType"] == "repetition":
        return {"type": "speakRepetition", "speechItemId": sid, "modelClipId": it["modelAudioRef"], "target": it["target"], "acceptedVariants": it["acceptedVariants"], "objectiveTargets": objs}
    pr = it["prompt"]
    e = {"type": "speakProduction", "speechItemId": sid, "instruction": pr["instruction"]["vi"], "target": it["target"], "acceptedVariants": it["acceptedVariants"], "evidenceLexemeRefs": it["evidenceLexemeRefs"],
         "revealTargetAfterAttempts": it["assistancePolicy"]["revealTargetAfterAttempts"], "allowContextualBias": it["assistancePolicy"]["allowContextualBias"], "modelClipId": it["modelAudioRef"], "allowedAttempts": it["allowedAttempts"], "objectiveTargets": objs}
    if "cueEmoji" in pr:
        e["cueEmoji"] = pr["cueEmoji"]
    if "cueFacts" in pr:
        e["cueFacts"] = [{"label": f["label"]["vi"], "value": f["value"]} for f in pr["cueFacts"]]
    return e


def WR(slug):
    """A writing exercise mirroring its task."""
    tid = f"en.write.{slug}"
    t = WRITING[tid]
    rub = {**t["rubric"], "requiredSlots": [{**s, "description": s["description"]["vi"]} for s in t["rubric"]["requiredSlots"]]}
    fields = t.get("formFields")
    e = {"type": "simpleForm" if fields else "guidedWriting", "writingTaskId": tid}
    if not fields:
        e["writingMode"] = t["mode"]
    e["instruction"] = t["instruction"]["vi"]
    if t.get("cueFacts"):
        e["cueFacts"] = [{"label": f["label"]["vi"], "value": f["value"]} for f in t["cueFacts"]]
    if fields:
        e["fields"] = fields
    e.update({"rubric": rub, "modelAnswers": t["modelAnswers"], "objectiveTargets": t["objectiveRefs"]})
    return e


def IX(slug):
    sid = f"en.scenario.{slug}"
    return {"type": "interactionScenario", "scenarioId": sid, "objectiveTargets": SCENARIOS[sid]["objectiveRefs"]}


def C(concept):
    return {"concept": f"en:concept:{concept}"}


def _english(e):
    """The English a learner meets in an exercise: everything the level check reads."""
    t = e["type"]
    if t == "select":
        out = [e["audioTarget"]]
        if e["mode"] != "targetToNative":
            out += [o["text"] for o in e["options"]]
        return out
    if t == "wordBank":
        if e["direction"] == "nativeToTarget":
            rest = list(e["tokens"])
            for w in e["answer"]:
                rest.remove(w)
            return [" ".join(e["answer"])] + rest
        return [e["prompt"]]
    if t == "match":
        return [p["target"] for p in e["pairs"]]
    if t == "fillBlank":
        return [e["audioTarget"]] + e["options"]
    if t == "typeAnswer":
        return [e["answer"]]
    if t == "conjugationCloze":
        return [e["sentence"].replace("___", e["answer"])]
    if t == "dictation":
        return [e["answer"]]
    return []


def _leak(lid, e):
    """A Vietnamese prompt that already holds the answer: an English word, or the digits a learner should produce."""
    t = e["type"]
    if t == "typeAnswer":
        prompt, answer = e["prompt"], e["answer"]
    elif t == "wordBank" and e["direction"] == "nativeToTarget":
        prompt, answer = e["prompt"], " ".join(e["answer"])
    elif t == "select" and e["mode"] == "nativeToTarget":
        prompt, answer = e["prompt"], e["options"][e["correct"]]["text"]
    else:
        return
    low = {w for w in re.findall(r"[a-z']+", answer.lower()) if len(w) >= 3}
    names = {w.lower() for w in re.findall(r"\b[A-Z][a-z]+\b", prompt)}
    for w in re.findall(r"[a-z']+", prompt.lower()):
        if w in low and w not in VI_HOMOGRAPHS and w not in names:
            PROBLEMS.append(f"{lid}: prompt \"{prompt}\" shows the answer word \"{w}\"")
    if re.search(r"\d", prompt) or re.search(r"\b\d{1,2}:\d{2}\b", prompt):
        PROBLEMS.append(f"{lid}: prompt \"{prompt}\" holds digits: write the number in Vietnamese")


def lesson(lid, steps):
    full = f"{COURSE}:{lid}"
    ex, flow, has_concept = [], [], False
    for st in steps:
        if "concept" in st:
            if st["concept"] not in CONCEPTS:
                PROBLEMS.append(f"{lid}: unknown concept {st['concept']}")
            flow.append(st)
            has_concept = True
        else:
            e = dict(st)
            e = {"type": e.pop("type"), "id": f"{full}-e{len(ex)}", **e}
            for text in _english(e):
                check(e["id"], TRAPS.sub("big", text))
            _leak(e["id"], e)
            ex.append(e)
            flow.append({"exercise": e["id"]})
    rec = {"lessonId": full, "exercises": ex}
    if has_concept:
        rec["flow"] = flow
    if len(ex) < 5:
        PROBLEMS.append(f"{lid}: {len(ex)} exercises")
    RECORDS.append(rec)


def finish(mode):
    """Append this generator's lessons to lessons/OUTPUT.jsonl (s1 starts the file) and stop on any problem."""
    seen = {}
    for r in RECORDS:
        for e in r["exercises"]:
            key = json.dumps({k: v for k, v in e.items() if k != "id"}, ensure_ascii=False, sort_keys=True)
            if key in seen:
                PROBLEMS.append(f"{e['id']} repeats {seen[key]}")
            seen[key] = e["id"]
    write_jsonl(f"{DRAFTS}/lessons/OUTPUT.jsonl", RECORDS, mode)
    for p in PROBLEMS:
        print(p.encode("utf-8", "replace").decode("utf-8"), file=sys.stderr)
    report()
    if PROBLEMS:
        sys.exit(f"{len(PROBLEMS)} problem(s)")
    mix = Counter(e["type"] for r in RECORDS for e in r["exercises"])
    print(len(RECORDS), "lessons", sum(len(r["exercises"]) for r in RECORDS), "exercises", dict(sorted(mix.items())), "flow", sum(1 for r in RECORDS if "flow" in r))

"""The exercise DSL of the zh-vi lesson generators (zh-lessons-s1.py … zh-lessons-s6.py), after ja_lesson_lib.py.

Every helper returns one exercise without an id; lesson() numbers them and builds the flow. Every Chinese string goes
through zh_text.Index: a hanzi outside the lexicon surfaces (no pinyin under it), a homograph in a reading the lexicon
does not store, or Latin letters stop the generator. finish() also stops on a duplicate payload, a broken word bank, a
lesson of under five exercises, a Vietnamese prompt that shows Chinese, a proper noun taught as a daily word, or an
option whose Vietnamese gloss is the same as the key's.

Answer keys:
 - Y() is a typed Chinese answer in simplified hanzi (Section 2 on). It adds the renderings a learner may fairly type
   (zh_text.widen: numbers in digits or hanzi, the time word before or after the subject, 这儿/这里 …, the subject 我
   the Vietnamese states). Pinyin typed for a hanzi key is accepted by the app as practice only (P4b evidence guard),
   and traditional characters are folded by the app, so neither is listed.
   Section 1 never uses Y() (coordinator decision 2026-11-04 for ja, applied to zh from the start: no typing of hanzi or
   pinyin before the tone primer); its production items are W() word banks and N()/NX() choices. zh-check-answers.py
   stops on a typed item there.
 - W() takes tiles written with | between them; a distractor tile may not repeat a tile of the answer.
 - Measure-word and aspect fill-ins (F with a measure word or 了/过/着/在 as the key) take the slot of the blueprint's
   conjugation and article drills (Mandarin has neither); the self-check reads them against NOUN_MEASURES and the
   aspect pairs, so no second option fits.
Sections 3-6 (session 3): LC, RC, D, SP, WR, IX point at the records of the layer generators, which run first; finish()
also stops when a lesson's layer ids differ from zh_lesson_refs.py, or an id is unknown or reserved for assessment.
"""
import json, os, re, sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from zh_text import HAN, Index, bare, load_lexicon, order_variants, subject_spellings, widen  # noqa: E402

ROOT = sys.argv[1]
DRAFTS = f"{ROOT}/content/zh/_drafts"
COURSE = "zh-vi"
LEXL = load_lexicon(ROOT)
LEX = {x["surface"]: x for x in LEXL}
INDEX = Index(LEXL)


def _jsonl(path):
    return [json.loads(x) for x in open(path, encoding="utf-8") if x.strip()] if os.path.exists(path) else []


EMOJI = {w["target"]: w["emoji"] for u in _jsonl(f"{DRAFTS}/units/OUTPUT.jsonl") for w in u["words"] if w.get("emoji")}
CONCEPTS = {c["id"] for c in _jsonl(f"{DRAFTS}/concepts/OUTPUT.jsonl") if "id" in c}
# P4d session 3: the layers the Section 3-6 exercises point at (written by zh-reception-s3 … zh-scenarios-s6, which run first).
CLIPS = {c["id"]: c for c in _jsonl(f"{DRAFTS}/listening/OUTPUT.jsonl")}
READINGS = {r["id"]: r for r in _jsonl(f"{DRAFTS}/readings/OUTPUT.jsonl")}
SPEECH = {r["id"]: r for r in _jsonl(f"{DRAFTS}/speech/OUTPUT.jsonl")}
WRITING = {r["id"]: r for r in _jsonl(f"{DRAFTS}/writing/OUTPUT.jsonl")}
SCENARIOS = {r["id"]: r for r in _jsonl(f"{DRAFTS}/scenarios/OUTPUT.jsonl")}

Q_LISTEN = "Nghe rồi chọn từ bạn nghe thấy."
Q_LISTEN_S = "Nghe rồi chọn câu bạn nghe thấy."
_pos = [0]
_seed = [0]
RECORDS = []
PROBLEMS = []


def g(surface):
    """The first Vietnamese gloss of a lexeme; a bracket the ; cut open is closed."""
    first = LEX[surface]["glosses"]["vi"].split(";")[0].strip()
    return first + ")" if first.count("(") > first.count(")") else first


def head(gloss):
    g_ = gloss.split(";")[0]
    return (re.sub(r"\s*\(.*?\)?\s*$", "", g_).strip() or g_).lower()


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


def _word(surface):
    if surface not in LEX:
        PROBLEMS.append(f"{surface}: not a lexicon surface")
        return False
    if LEX[surface].get("proper"):
        PROBLEMS.append(f"{surface}: a proper noun is never taught as a daily word")
    return True


def _same_meaning(surface, others):
    for o in others:
        if o in LEX and surface in LEX and head(g(o)) == head(g(surface)):
            PROBLEMS.append(f"{surface} and {o} share the gloss {g(surface)!r}: two options fit")


def T(surface, wrong):
    """The word shown (and heard): choose its Vietnamese."""
    for s in [surface] + wrong:
        _word(s)
    _same_meaning(surface, wrong)
    order, p = place(surface, wrong)
    return {"type": "select", "mode": "targetToNative", "prompt": surface, "audioTarget": surface, "options": _word_options([(s, g(s)) for s in order]), "correct": p}


def N(surface, wrong, prompt=None):
    """The Vietnamese shown: choose the Chinese word."""
    for s in [surface] + wrong:
        _word(s)
    _same_meaning(surface, wrong)
    order, p = place(surface, wrong)
    return {"type": "select", "mode": "nativeToTarget", "prompt": prompt or g(surface), "audioTarget": surface, "options": _word_options([(s, s) for s in order]), "correct": p}


def H(surface, wrong):
    """Heard: choose the word or sentence."""
    order, p = place(surface, wrong)
    q = Q_LISTEN_S if len(surface) > 4 or "。" in surface or "？" in surface else Q_LISTEN
    return {"type": "select", "mode": "listen", "prompt": q, "audioTarget": surface, "options": [{"text": s} for s in order], "correct": p}


def TX(zh, vi, wrong):
    """A Chinese sentence: choose its Vietnamese."""
    o, p = place(vi, wrong)
    return {"type": "select", "mode": "targetToNative", "prompt": zh, "audioTarget": zh, "options": [{"text": t} for t in o], "correct": p}


def NX(vi, zh, wrong):
    """A Vietnamese sentence or situation: choose the Chinese. Distractors are wrong on purpose (measure word, word, order)."""
    o, p = place(zh, wrong)
    return {"type": "select", "mode": "nativeToTarget", "prompt": vi, "audioTarget": zh, "options": [{"text": t} for t in o], "correct": p}


def M(*surfaces):
    for s in surfaces:
        _word(s)
    return {"type": "match", "pairs": [{"target": s, "native": g(s)} for s in surfaces]}


def MP(*pairs):
    return {"type": "match", "pairs": [{"target": a, "native": b} for a, b in pairs]}


def F(sentence, answer, wrong, vi):
    """fillBlank with options; a measure word or 了/过/着/在 as the key makes it a measure-word or aspect fill-in."""
    o, p = place(answer, wrong)
    if sentence.count("___") != 1:
        PROBLEMS.append(f"{sentence}: a fill-in has exactly one ___")
    return {"type": "fillBlank", "sentence": sentence, "translation": vi, "audioTarget": sentence.replace("___", answer), "options": o, "correct": p}


def Y(vi, zh, *alts):
    """Typed Chinese from a Vietnamese prompt (Section 2 on)."""
    base = [zh] + list(alts)
    for a in list(base):
        for x in subject_spellings(vi, a):
            if x not in base:
                base.append(x)
    more = [x for x in widen(base) if x != zh]
    seen, out = {bare(zh)}, []
    for x in more:
        if bare(x) not in seen:
            seen.add(bare(x))
            out.append(x)
    return {"type": "typeAnswer", "mode": "produceTarget", "prompt": vi, "audioTarget": zh, "answer": zh, "alternatives": out}


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


def W(vi, zh, extra, alts=()):
    """Tiles to a Chinese sentence; zh is written with | between the tiles."""
    ans = [x.strip() for x in zh.split("|")]
    e = {"type": "wordBank", "direction": "nativeToTarget", "prompt": vi, "audioTarget": "".join(ans), "tokens": _tiles(ans, extra, zh), "answer": ans}
    given = [[x.strip() for x in a.split("|")] for a in alts]
    for a in given:
        if Counter(a) - Counter(e["tokens"]):
            PROBLEMS.append(f"{zh}: alternative {a} is not built from the tiles")
    # D-10 (2026-11-05): every order of the same tiles that says the same thing is accepted (zh_text.order_variants: the
    # time word before or after the subject, 给 + person before or after the verb phrase, 住在 + place / 在 + place + 住).
    out, todo = [], [ans] + given
    while todo:
        a = todo.pop(0)
        if a != ans and a not in out:
            out.append(a)
        for v in order_variants(a):
            if v != ans and v not in out and v not in todo and not (Counter(v) - Counter(e["tokens"])):
                todo.append(v)
    if out:
        e["alternatives"] = out
    return e


def WT(zh, vi, extra):
    """Tiles to a Vietnamese sentence. Tiles are words, written with | between them."""
    ans = [x.strip() for x in vi.split("|")]
    return {"type": "wordBank", "direction": "targetToNative", "prompt": zh, "audioTarget": zh, "tokens": _tiles(ans, extra, zh), "answer": ans}


def C(concept):
    return {"concept": f"zh:concept:{concept}"}


# ---------------------------------------------------------------- Sections 3-6: the layers (P4d session 3, after ja_lesson_lib.py)
ASSESSMENT = ("cp", "a1cap", "pl_")


def _need(table, xid, what):
    if xid not in table:
        PROBLEMS.append(f"unknown {what} {xid}")
        return None
    if table[xid].get("reserved") is True or xid.split(".")[-1].startswith(ASSESSMENT):
        PROBLEMS.append(f"{what} {xid} is reserved for assessment")
    return table[xid]


def LC(clip, q, ans, wrong, objs=None):
    """listeningComprehension: a Vietnamese question; Vietnamese options, or Chinese ones (a word or a sign heard)."""
    _need(CLIPS, f"zh.clip.{clip}", "clip")
    o, p = place(ans, wrong)
    e = {"type": "listeningComprehension", "clipId": f"zh.clip.{clip}", "question": q, "options": [{"text": t} for t in o], "correct": p}
    if objs:
        e["objectiveTargets"] = objs
    return e


def RC(reading, q, ans, wrong):
    _need(READINGS, f"zh.read.{reading}", "reading")
    o, p = place(ans, wrong)
    return {"type": "readingComprehension", "readingId": f"zh.read.{reading}", "question": q, "options": [{"text": t} for t in o], "correct": p}


def D(clip):
    """dictation of a clip: the key is its transcript in simplified hanzi; the alternatives are its other fair spellings
    (zh_text.widen: a hanzi number in digits, 这儿/这里 …). Traditional characters and punctuation are folded by the app;
    pinyin typed for it is practice only (P4b guard). A clip with digits is never dictated (two spellings of one number
    in the key itself)."""
    c = _need(CLIPS, f"zh.clip.{clip}", "clip")
    text = "".join(s["text"] for s in c["segments"]) if c else "?"
    if re.search(r"[0-9０-９]", text):
        PROBLEMS.append(f"dictation {clip}: a clip with digits has two spellings")
    alts = [x for x in widen([text], variants=False) if bare(x) != bare(text)]
    return {"type": "dictation", "clipId": f"zh.clip.{clip}", "answer": text, "alternatives": alts, "objectiveTargets": ["zh.obj.listening.familiar_words"]}


def SP(slug, more=()):
    """A speech exercise mirroring its item. A review lesson re-using an item names one more objective, so the two are not one payload."""
    sid = f"zh.speak.{slug}"
    it = _need(SPEECH, sid, "speech item")
    if it is None:
        return {"type": "speakRepetition", "speechItemId": sid}
    objs = it["objectiveRefs"] + [f"zh.obj.{m}" for m in more]
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
    tid = f"zh.write.{slug}"
    t = _need(WRITING, tid, "writing task")
    if t is None:
        return {"type": "guidedWriting", "writingTaskId": tid}
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
    sid = f"zh.scenario.{slug}"
    s = _need(SCENARIOS, sid, "scenario")
    return {"type": "interactionScenario", "scenarioId": sid, "objectiveTargets": s["objectiveRefs"] if s else []}


LAYER_FIELDS = (("clipId", "clips"), ("readingId", "readings"), ("speechItemId", "speech"), ("writingTaskId", "writing"), ("scenarioId", "scenarios"))


def _layer_refs():
    """Every lesson of this generator uses exactly the layer ids zh_lesson_refs.py maps to it (ja_lesson_lib.py)."""
    from zh_lesson_refs import REFS
    for rec in RECORDS:
        got = {kind: set() for _, kind in LAYER_FIELDS}
        for e in rec["exercises"]:
            for field, kind in LAYER_FIELDS:
                if field in e:
                    got[kind].add(e[field])
        want = REFS.get(rec["lessonId"], {})
        for kind, xs in want.items():
            for x in xs:
                if x not in got[kind]:
                    PROBLEMS.append(f"{rec['lessonId']}: mapped {kind} id {x} is not used")
        for kind, xs in got.items():
            for x in sorted(xs - set(want.get(kind, []))):
                PROBLEMS.append(f"{rec['lessonId']}: {x} is not mapped to this lesson")


# ---------------------------------------------------------------- what a learner reads in Chinese
def keyed(e):
    """The Chinese of the key: what must be right."""
    t = e["type"]
    if t == "select":
        if e["mode"] == "targetToNative":
            return [e["prompt"]]
        return [e["options"][e["correct"]]["text"]]
    if t == "wordBank":
        return ["".join(e["answer"])] + ["".join(a) for a in e.get("alternatives", [])] if e["direction"] == "nativeToTarget" else [e["prompt"]]
    if t == "match":
        return [p["target"] for p in e["pairs"]]
    if t == "fillBlank":
        return [e["audioTarget"]]
    if t == "typeAnswer":
        return [e["answer"]]
    if t == "dictation":
        return [e["answer"]]
    if t in ("speakRepetition", "speakProduction"):
        return [e["target"]]  # the variants are grading strings, never shown
    if t == "guidedWriting":
        return list(e["modelAnswers"])
    if t == "simpleForm":
        return [v.strip() for m in e["modelAnswers"] for v in m.split(" | ") if HAN.search(v)]
    if t in ("listeningComprehension", "readingComprehension") and HAN.search(e["options"][e["correct"]]["text"]):
        return [e["options"][e["correct"]]["text"]]
    return []


def shown(e):
    """Every Chinese string the learner sees, distractors included."""
    t = e["type"]
    out = list(keyed(e))
    if t == "select" and e["mode"] != "targetToNative":
        out += [o["text"] for o in e["options"]]
    if t == "wordBank" and e["direction"] == "nativeToTarget":
        out += e["tokens"]
    if t == "fillBlank":
        out += [e["sentence"].replace("___", o) for o in e["options"]]
    if t in ("listeningComprehension", "readingComprehension"):
        out += [o["text"] for o in e["options"] if HAN.search(o["text"])]
    return out


def _check(eid, e):
    for text in set(shown(e)):
        for p in INDEX.problems(text):
            PROBLEMS.append(f"{eid}: {p}")
    prompt = None
    if e["type"] == "typeAnswer" or (e["type"] == "wordBank" and e["direction"] == "nativeToTarget") or (e["type"] == "select" and e["mode"] == "nativeToTarget"):
        prompt = e["prompt"]
    if e["type"] == "fillBlank":
        prompt = e["translation"]
    if prompt and HAN.search(prompt):
        PROBLEMS.append(f"{eid}: Vietnamese prompt {prompt!r} holds Chinese")
    if e["type"] == "select" and e["mode"] == "targetToNative" and any(HAN.search(o["text"]) for o in e["options"]):
        PROBLEMS.append(f"{eid}: a Vietnamese option holds Chinese")
    if e["type"] == "wordBank" and e["direction"] == "targetToNative" and any(HAN.search(x) for x in e["tokens"]):
        PROBLEMS.append(f"{eid}: a Vietnamese tile holds Chinese")
    if e["type"] in ("typeAnswer", "dictation"):
        for a in [e["answer"]] + e["alternatives"]:
            if re.search(r"[A-Za-z]", a):
                PROBLEMS.append(f"{eid}: typed key {a!r} holds Latin letters (pinyin is practice, never a key)")
    # Comprehension: a Vietnamese question; options all Vietnamese, or all Chinese (the sign or word itself).
    if e["type"] in ("listeningComprehension", "readingComprehension"):
        if HAN.search(e["question"]):
            PROBLEMS.append(f"{eid}: Vietnamese question {e['question']!r} holds Chinese")
        zh_opts = [bool(HAN.search(o["text"])) for o in e["options"]]
        if any(zh_opts) and not all(zh_opts):
            PROBLEMS.append(f"{eid}: options mix Chinese and Vietnamese")
    if e["type"] in ("speakProduction", "guidedWriting", "simpleForm") and HAN.search(e["instruction"]):
        PROBLEMS.append(f"{eid}: Vietnamese instruction holds Chinese")


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
    _layer_refs()
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

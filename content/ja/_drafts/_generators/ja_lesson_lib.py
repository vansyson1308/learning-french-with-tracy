"""The exercise DSL of the ja-vi lesson generators (ja-lessons-s1.py … ja-lessons-s56.py), after en_lesson_lib.py.

Every helper returns one exercise without an id; lesson() numbers them and builds the flow. Every Japanese string goes
through ja_text.Index: a kanji without furigana, a misread single kanji, Latin letters or a plain-form sentence end
stops the generator. finish() also stops on a duplicate payload, a broken word bank, a lesson of under five exercises,
a Vietnamese prompt that shows Japanese, or an option whose Vietnamese gloss is the same as the key's.

Answer keys:
 - Y() is a typed Japanese answer in the standard script. It adds the other renderings a learner may fairly type: the
   sentence without わたしは (Japanese drops a known subject), 私 for わたし (the phone keyboard offers it), and, only
   where the course plan lets kana count as production (Section 1, the kana-input unit o), the answer spelt in kana.
   Elsewhere kana typed for kanji is accepted by the app as practice only (P4b evidence guard), so it is not listed.
 - W() takes tiles written with | between them; a distractor tile may not repeat a tile of the answer.
 - Particle fill-ins (F with a particle key) never offer two particles that both fit: the self-check
   (ja-check-answers.py) reads the pairs は/が, に/へ, と/や, ね/よ, は/も against the Vietnamese translation.
Plain forms (dictionary, ない, た) appear only in exercises marked plain=True (recognition, Section 2 unit b and later).
Sections 3-6 (session 4): LC, RC, D, SP, WR, IX point at the records of the layer generators, which run first; finish()
also stops when a lesson's layer ids differ from ja_lesson_refs.py, or an id is unknown or reserved for assessment.
"""
import json, os, re, sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from ja_paradigms import cloze_kana, tables as _paradigm_tables  # noqa: E402
from ja_text import HAN, KANA, POLITE_END, PLAIN_END, Index, load_lexicon, sentence_ends, subject_spellings, topic_spellings, widen  # noqa: E402

ROOT = sys.argv[1]
DRAFTS = f"{ROOT}/content/ja/_drafts"
COURSE = "ja-vi"
LEXL = load_lexicon(ROOT)
LEX = {x["surface"]: x for x in LEXL}
INDEX = Index(LEXL)
PARADIGMS = _paradigm_tables(ROOT, LEXL)


def _jsonl(path):
    return [json.loads(x) for x in open(path, encoding="utf-8") if x.strip()] if os.path.exists(path) else []


EMOJI = {w["target"]: w["emoji"] for u in _jsonl(f"{DRAFTS}/units/OUTPUT.jsonl") for w in u["words"]}
CONCEPTS = {c["id"] for c in _jsonl(f"{DRAFTS}/concepts/OUTPUT.jsonl") if "id" in c}
# P4c session 4: the layers the Section 3-6 exercises point at (written by ja-reception-s3 … ja-scenarios-s6, which run first).
CLIPS = {c["id"]: c for c in _jsonl(f"{DRAFTS}/listening/OUTPUT.jsonl")}
READINGS = {r["id"]: r for r in _jsonl(f"{DRAFTS}/readings/OUTPUT.jsonl")}
SPEECH = {r["id"]: r for r in _jsonl(f"{DRAFTS}/speech/OUTPUT.jsonl")}
WRITING = {r["id"]: r for r in _jsonl(f"{DRAFTS}/writing/OUTPUT.jsonl")}
SCENARIOS = {r["id"]: r for r in _jsonl(f"{DRAFTS}/scenarios/OUTPUT.jsonl")}

Q_LISTEN = "Nghe rồi chọn từ bạn nghe thấy."
Q_LISTEN_S = "Nghe rồi chọn câu bạn nghe thấy."
PARTICLES = ["は", "が", "を", "に", "で", "へ", "と", "も", "の", "か", "ね", "よ", "や", "から", "まで"]
_pos = [0]
_seed = [0]
RECORDS = []
PROBLEMS = []
JA = re.compile(r"[ぁ-ゖァ-ヺー㐀-䶿一-鿿]")


def g(surface):
    """The first Vietnamese gloss of a lexeme; a bracket the ; cut open is closed (mẹ (người khác; gọi mẹ) → mẹ (người khác))."""
    first = LEX[surface]["glosses"]["vi"].split(";")[0].strip()
    return first + ")" if first.count("(") > first.count(")") else first


def head(gloss):
    """A gloss without its bracketed note, for comparing meanings."""
    g = gloss.split(";")[0]
    return (re.sub(r"\s*\(.*?\)?\s*$", "", g).strip() or g).lower()


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
    for o in others:
        if o in LEX and head(g(o)) == head(g(surface)):
            PROBLEMS.append(f"{surface} and {o} share the gloss {g(surface)!r}: two options fit")


def T(surface, wrong):
    """The word shown (and heard): choose its Vietnamese."""
    _same_meaning(surface, wrong)
    order, p = place(surface, wrong)
    return {"type": "select", "mode": "targetToNative", "prompt": surface, "audioTarget": surface, "options": _word_options([(s, g(s)) for s in order]), "correct": p}


def N(surface, wrong, prompt=None):
    """The Vietnamese shown: choose the Japanese word."""
    _same_meaning(surface, wrong)
    order, p = place(surface, wrong)
    return {"type": "select", "mode": "nativeToTarget", "prompt": prompt or g(surface), "audioTarget": surface, "options": _word_options([(s, s) for s in order]), "correct": p}


def H(surface, wrong):
    """Heard: choose the word or sentence."""
    order, p = place(surface, wrong)
    q = Q_LISTEN_S if len(surface) > 8 or "。" in surface else Q_LISTEN
    return {"type": "select", "mode": "listen", "prompt": q, "audioTarget": surface, "options": [{"text": s} for s in order], "correct": p}


def TX(ja, vi, wrong):
    """A Japanese sentence: choose its Vietnamese."""
    o, p = place(vi, wrong)
    return {"type": "select", "mode": "targetToNative", "prompt": ja, "audioTarget": ja, "options": [{"text": t} for t in o], "correct": p}


def NX(vi, ja, wrong, plain=False):
    """A Vietnamese sentence or situation: choose the Japanese. Distractors are wrong on purpose (particle, word, order)."""
    o, p = place(ja, wrong)
    e = {"type": "select", "mode": "nativeToTarget", "prompt": vi, "audioTarget": ja, "options": [{"text": t} for t in o], "correct": p}
    return _mark(e, plain)


def M(*surfaces):
    return {"type": "match", "pairs": [{"target": s, "native": g(s)} for s in surfaces]}


def MP(*pairs):
    return {"type": "match", "pairs": [{"target": a, "native": b} for a, b in pairs]}


def F(sentence, answer, wrong, vi, plain=False):
    """fillBlank; a particle key makes it a particle fill-in (the article slot of the blueprint)."""
    o, p = place(answer, wrong)
    e = {"type": "fillBlank", "sentence": sentence, "translation": vi, "audioTarget": sentence.replace("___", answer), "options": o, "correct": p}
    return _mark(e, plain)


def _variants(answer, alts, vi=""):
    """The renderings a learner may fairly type (D-10 review, 2026-11-03: the subject or owner the Vietnamese states,
    the time word with or without は, numbers in digits or kanji, the IME's kanji spellings, 大きな / 小さな)."""
    out, seen = [], {answer}

    def add(x):
        if x not in seen:
            seen.add(x)
            out.append(x)

    for a in alts:
        add(a)
    for base in [answer] + list(alts):
        for x in subject_spellings(vi, base) + topic_spellings(base):
            add(x)
    for base in [answer] + list(out):
        if base.startswith("わたしは") and len(base) > 6:
            add(base[4:])
        if "わたし" in base:
            add(base.replace("わたし", "私"))
    for x in widen([answer] + list(out)):
        add(x)
    return out


def Y(vi, ja, *alts, kana=False, plain=False):
    """Typed Japanese from a Vietnamese prompt. kana=True (Section 1, unit o) also accepts the answer in kana as production."""
    more = _variants(ja, alts, vi)
    if kana:
        for base in [ja] + [a for a in more if "私" not in a]:
            k = INDEX.kana(base)
            if k != base and not HAN.search(k) and k not in more:
                more.append(k)
        more += [x for x in widen(more) if x not in more and x != ja]
    e = {"type": "typeAnswer", "mode": "produceTarget", "prompt": vi, "audioTarget": ja, "answer": ja, "alternatives": more}
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


LINKS = ("でも", "それから", "そして", "だから", "じゃあ")


def _spoken(tiles):
    """The audio script of a word bank: tiles joined, a sentence break before a linking word and a comma after it (D-10
    review: 日本語は難しいですでも楽しいです was read as one run-on sentence)."""
    out = ""
    for i, t in enumerate(tiles):
        out += ("。" + t + "、") if t in LINKS and i > 0 else t
    return out


def W(vi, ja, extra, alts=(), plain=False):
    """Tiles to a Japanese sentence; ja is written with | between the tiles."""
    ans = [x.strip() for x in ja.split("|")]
    e = {"type": "wordBank", "direction": "nativeToTarget", "prompt": vi, "audioTarget": _spoken(ans), "tokens": _tiles(ans, extra, ja), "answer": ans}
    if alts:
        e["alternatives"] = [[x.strip() for x in a.split("|")] for a in alts]
        for a in e["alternatives"]:
            if Counter(a) - Counter(e["tokens"]):
                PROBLEMS.append(f"{ja}: alternative {a} is not built from the tiles")
    return _mark(e, plain)


def WT(ja, vi, extra):
    """Tiles to a Vietnamese sentence. Tiles are words, written with | between them."""
    ans = [x.strip() for x in vi.split("|")]
    return {"type": "wordBank", "direction": "targetToNative", "prompt": ja, "audioTarget": ja, "tokens": _tiles(ans, extra, ja), "answer": ans}


def K(sentence, verb, cell, vi):
    """conjugationCloze (P4c session 3): the key is the verb's paradigm cell, read from the kaikki morphology rows
    (ja_paradigms.py). The same form typed in kana is accepted too: the drill is the ending, and a cloze is practice
    evidence by design (never lexical FSRS)."""
    t = PARADIGMS.get(verb)
    if t is None or cell not in t["cells"]:
        PROBLEMS.append(f"{sentence}: {verb} has no paradigm cell {cell}")
        return {"type": "conjugationCloze", "sentence": sentence, "translation": vi, "verb": verb, "cell": cell, "answer": "?", "alternatives": []}
    if sentence.count("___") != 1:
        PROBLEMS.append(f"{sentence}: a cloze has exactly one ___")
    ans = t["cells"][cell]
    return {"type": "conjugationCloze", "sentence": sentence, "translation": vi, "verb": verb, "cell": cell, "answer": ans, "alternatives": cloze_kana(t, cell, ans, INDEX)}


def C(concept):
    return {"concept": f"ja:concept:{concept}"}


# ---------------------------------------------------------------- Sections 3-6: the layers (P4c session 4, after en_lesson_lib.py)
def _need(table, xid, what):
    if xid not in table:
        PROBLEMS.append(f"unknown {what} {xid}")
        return None
    if table[xid].get("reserved") is True:
        PROBLEMS.append(f"{what} {xid} is reserved for assessment")
    return table[xid]


def LC(clip, q, ans, wrong, objs=None):
    """listeningComprehension: a Vietnamese question; Vietnamese options, or Japanese ones (a sign, a word heard)."""
    _need(CLIPS, f"ja.clip.{clip}", "clip")
    o, p = place(ans, wrong)
    e = {"type": "listeningComprehension", "clipId": f"ja.clip.{clip}", "question": q, "options": [{"text": t} for t in o], "correct": p}
    if objs:
        e["objectiveTargets"] = objs
    return e


def RC(reading, q, ans, wrong):
    _need(READINGS, f"ja.read.{reading}", "reading")
    o, p = place(ans, wrong)
    return {"type": "readingComprehension", "readingId": f"ja.read.{reading}", "question": q, "options": [{"text": t} for t in o], "correct": p}


def D(clip):
    """dictation of a clip: the key is its transcript in the standard script; the alternatives are every spelling with each
    kanji word in kanji or kana (through the stored readings; D-10 review: a correct mixed spelling is not wrong).
    Dictation is strict (kanji vs kana counts), so a digit-free clip is chosen."""
    c = _need(CLIPS, f"ja.clip.{clip}", "clip")
    text = "".join(s["text"] for s in c["segments"]) if c else "?"
    if DIGIT_RE.search(text):
        PROBLEMS.append(f"dictation {clip}: digits have two spellings in kana")
    kana = INDEX.kana(text)
    if HAN.search(kana):
        PROBLEMS.append(f"dictation {clip}: no kana spelling for {text!r}")
    alts = INDEX.mixes(text)[1:]
    return {"type": "dictation", "clipId": f"ja.clip.{clip}", "answer": text, "alternatives": alts, "objectiveTargets": ["ja.obj.listening.familiar_words"]}


def SP(slug, more=()):
    """A speech exercise mirroring its item. A review lesson re-using an item names one more objective, so the two are not one payload."""
    sid = f"ja.speak.{slug}"
    it = _need(SPEECH, sid, "speech item")
    if it is None:
        return {"type": "speakRepetition", "speechItemId": sid}
    objs = it["objectiveRefs"] + [f"ja.obj.{m}" for m in more]
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
    tid = f"ja.write.{slug}"
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
    sid = f"ja.scenario.{slug}"
    s = _need(SCENARIOS, sid, "scenario")
    return {"type": "interactionScenario", "scenarioId": sid, "objectiveTargets": s["objectiveRefs"] if s else []}


DIGIT_RE = re.compile(r"[0-9０-９]")
LAYER_FIELDS = (("clipId", "clips"), ("readingId", "readings"), ("speechItemId", "speech"), ("writingTaskId", "writing"), ("scenarioId", "scenarios"))


def _layer_refs():
    """Every lesson of this generator uses exactly the layer ids ja_lesson_refs.py maps to it (en-lessons-s3.py)."""
    from ja_lesson_refs import REFS
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


def _mark(e, plain):
    if plain:
        e["_plain"] = True
    return e


# ---------------------------------------------------------------- what a learner reads in Japanese
def keyed(e):
    """The Japanese of the key: what must be right."""
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
        return [e["answer"]]  # the alternatives are never shown
    if t == "conjugationCloze":
        return [e["sentence"].replace("___", e["answer"])]
    if t == "dictation":
        return [e["answer"]]
    if t in ("speakRepetition", "speakProduction"):
        return [e["target"]]
    if t == "guidedWriting":
        return list(e["modelAnswers"])
    if t == "simpleForm":
        return [v.strip() for m in e["modelAnswers"] for v in m.split(" | ")]
    return []


def shown(e):
    """Every Japanese string the learner sees, distractors included."""
    t = e["type"]
    out = list(keyed(e))
    if t == "conjugationCloze":
        out.append(e["verb"])  # the hint: the dictionary form
    if t == "select" and e["mode"] != "targetToNative":
        out += [o["text"] for o in e["options"]]
    if t == "wordBank" and e["direction"] == "nativeToTarget":
        out += e["tokens"]
    if t == "fillBlank":
        out += [e["sentence"].replace("___", o) for o in e["options"]]
    if t in ("listeningComprehension", "readingComprehension"):
        out += [o["text"] for o in e["options"] if JA.search(o["text"])]
    return out


def _check(eid, e):
    plain = e.pop("_plain", False)
    for text in set(shown(e)):
        for p in INDEX.problems(text):
            PROBLEMS.append(f"{eid}: {p}")
    if not plain:
        for text in keyed(e):
            if text in LEX:
                continue  # a word shown in its dictionary form, not a sentence
            for end in sentence_ends(text):
                if len(end) > 3 and PLAIN_END.search(end) and not POLITE_END.search(end) and JA.search(end):
                    PROBLEMS.append(f"{eid}: plain-form ending {end!r} in a polite exercise")
    # A Vietnamese prompt of a production exercise must not show the Japanese it asks for.
    prompt = None
    if e["type"] in ("typeAnswer",) or (e["type"] == "wordBank" and e["direction"] == "nativeToTarget") or (e["type"] == "select" and e["mode"] == "nativeToTarget"):
        prompt = e["prompt"]
    if e["type"] in ("fillBlank", "conjugationCloze"):
        prompt = e["translation"]
    if prompt and JA.search(prompt):
        PROBLEMS.append(f"{eid}: Vietnamese prompt {prompt!r} holds Japanese")
    if e["type"] == "select" and e["mode"] == "targetToNative" and any(JA.search(o["text"]) for o in e["options"]):
        PROBLEMS.append(f"{eid}: a Vietnamese option holds Japanese")
    # Comprehension: a Vietnamese question; options all Vietnamese, or all Japanese (the sign or word itself).
    if e["type"] in ("listeningComprehension", "readingComprehension"):
        if JA.search(e["question"]):
            PROBLEMS.append(f"{eid}: Vietnamese question {e['question']!r} holds Japanese")
        ja_opts = [bool(JA.search(o["text"])) for o in e["options"]]
        if any(ja_opts) and not all(ja_opts):
            PROBLEMS.append(f"{eid}: options mix Japanese and Vietnamese")
    if e["type"] in ("speakProduction", "guidedWriting", "simpleForm") and JA.search(e["instruction"]):
        PROBLEMS.append(f"{eid}: Vietnamese instruction holds Japanese")
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

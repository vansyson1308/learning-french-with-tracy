"""Self-check of the ko-vi answer keys (P4e session 2; the D-10 answer pass is a later session). It joins
lessons/parts/*.jsonl into lessons/OUTPUT.jsonl, then flags, built up front from the D-10 P0 patterns of ja-vi
(content/ja/REVIEW-AI.md):

 1. more than one defensible answer: a particle fill-in offering two particles that both fit the blank (은/는 with
    이/가 or 을/를 or 도 — the allomorph the word takes, so 학생가 is no rival of 학생은 —, 에 with 에서 for 살다, 에 with
    (으)로 for a verb of motion, 을/를 with 에 for 타다, 하고 / 와 / 과 / (이)랑, 에게 / 한테, 도 against "cũng");
    two word options with the same Vietnamese gloss; a distractor (a choice, a filled blank, a word bank with one tile
    swapped) that is one of the key's fair renderings (ko_text.variants: the subject dropped or stated, 제 / 우리 /
    저희, digits ⇄ Hangul numbers, 안 ⇄ -지 않아요, an object particle dropped, 이거 ⇄ 이것 …);
 2. wrong particles in a key: 에서 before 있다 / 없다, 을/를 before 있어요 / 없어요 / 좋아요 / 싫어요 / 필요해요 /
    아파요, 이/가 before 좋아해요 / 싫어해요, 에 between a place and an action verb (공장에 일해요), 에 after 오늘 /
    내일 / 어제 / 지금, 을/를 before 가요 / 와요; and every allomorph (물를, 서울으로, 저가, 학생예요) through
    ko_text.Index;
 3. speech levels: a 반말 sentence end in a key (outside the exercises that teach 반말 recognition), and 합쇼체 mixed
    with 해요체 in one key unless the 합쇼체 sentence is a set phrase of the lexicon (감사합니다, 죄송합니다 …);
 4. number systems: a Sino-Korean number before a native counter (삼 시, 일 명), a native one before a Sino counter
    (다섯 원), the plain native form before a counter (하나 개); every typed key with a number lists it in digits and
    in Hangul (세 시 ⇄ 3시);
 5. words outside the lexicon: every word of every key is a lexicon surface, a form of a lexicon verb, a noun with its
    particles or copula, a name or a number (ko_text.Index);
 6. typed renderings: every typed answer lists the renderings ko_text.variants gives (the D-10 P0 family "a correct
    answer was not accepted": optional 저는, 제 / 우리 아버지, digits, natural alternatives);
 7. Section 1 typing (ja decision 22, kept for ko): no Section 1 lesson holds an exercise that asks for typed Korean
    (typeAnswer, dictation, conjugationCloze, a fill-in without options, guidedWriting, simpleForm);
 8. a payload repeated across lessons; a Vietnamese option whose bracket is not closed; a conjugation cloze whose future
    key lacks its spelling without the space.
A finding stops the pipeline unless DECIDED gives the reason it stands. Counts go to review/selfcheck.json and, by
hand, to REVIEW-NOTES.md. usage: python -I ko-check-answers.py <repo root>
"""
import json, os, re, sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from ko_text import Index, _bare, ends_in_consonant, load_lexicon, same_answer, variants  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")
ROOT = sys.argv[1]
D = f"{ROOT}/content/ko/_drafts"
PARTS = ["s1", "s2", "s3", "s4", "s5", "s6"]
LEXL = load_lexicon(ROOT)
LEX = {x["surface"]: x for x in LEXL}
INDEX = Index(LEXL)
SET_PHRASES = sorted((x["surface"] for x in LEXL if x["partOfSpeech"] == "expression" and re.search(r"(니다|니까)$", x["surface"])), key=len, reverse=True)
# A finding that stands, with its reason. Keys are (exercise id, rule).
DECIDED = {}

records = []
for p in PARTS:
    path = f"{D}/lessons/parts/{p}.jsonl"
    if os.path.exists(path):
        records += [json.loads(x) for x in open(path, encoding="utf-8") if x.strip()]
SECTION1_LESSONS = {l["id"] for u in (json.loads(x) for x in open(f"{D}/units/OUTPUT.jsonl", encoding="utf-8") if x.strip())
                    if u["sectionId"] == "ko-vi:section-1" for l in u["lessons"]}
TYPED_TYPES = {"typeAnswer", "dictation", "conjugationCloze", "guidedWriting", "simpleForm"}
findings = []
VI_BRACKET = re.compile(r"[()]")


def flag(eid, rule, msg):
    if (eid, rule) in DECIDED:
        return
    findings.append({"id": eid, "rule": rule, "message": msg})


def key_texts(e):
    t = e["type"]
    if t == "select":
        return [e["prompt"]] if e["mode"] == "targetToNative" else [e["options"][e["correct"]]["text"]]
    if t == "fillBlank":
        return [e["audioTarget"]]
    if t == "wordBank" and e["direction"] == "nativeToTarget":
        return [" ".join(e["answer"])] + [" ".join(a) for a in e.get("alternatives", [])]
    if t == "wordBank":
        return [e["prompt"]]
    if t == "typeAnswer":
        return [e["answer"]] + list(e["alternatives"])
    if t == "conjugationCloze":
        return [e["sentence"].replace("___", e["answer"])]
    if t == "match":
        return [p["target"] for p in e["pairs"]]
    return []


# ---------------------------------------------------------------- rule 2: particles in a key
ACTION_STEMS = ("일해", "일했", "공부해", "공부했", "먹어", "먹었", "마셔", "마셨", "만나", "만났", "기다려", "기다렸", "운동해", "요리해", "청소해", "빨래해",
                "쉬어", "쉬었", "놀아", "놀았", "배워", "배웠", "가르쳐", "사요", "샀어", "팔아", "봐요", "봤어")
MOTION = re.compile(r"^(가요|가세요|갈|갔|와요|와|왔|올|들어가|나가|돌아가|올라가|내려가)")
TIME_NO_E = ("오늘", "내일", "어제", "지금", "매일", "요즘")


def particle_rules(eid, text):
    toks = INDEX.tokens(text)
    for a, b in zip(toks, toks[1:]):
        if a.endswith("에서") and re.match(r"^(있|없|계세요)", b):
            flag(eid, "existence-eseo", f"{text!r}: {a} {b}: 있다 / 없다 take 에, not 에서")
        if re.search(r"[을를]$", a) and INDEX.nounish(a[:-1]) and re.match(r"^(있어|없어|있었|없었|좋아요|좋았|싫어요|필요해|아파|아팠)", b):
            flag(eid, "subject-predicate", f"{text!r}: {a} {b}: this predicate takes 이/가")
        if re.search(r"[이가]$", a) and INDEX.nounish(a[:-1]) and re.match(r"^(좋아해|싫어해)", b):
            flag(eid, "object-predicate", f"{text!r}: {a} {b}: 좋아하다 / 싫어하다 take 을/를")
        if a.endswith("에") and not a.endswith("에게") and INDEX.nounish(a[:-1]) and b.startswith(ACTION_STEMS) and not a[:-1] in ("아침", "점심", "저녁", "밤", "오전", "오후", "주말"):
            if not re.search(r"(시|분|반|요일|월|일|년|주|후|전|때)에$", a):
                flag(eid, "e-action", f"{text!r}: {a} {b}: the place of an action takes 에서")
        if a in [w + "에" for w in TIME_NO_E]:
            flag(eid, "time-e", f"{text!r}: {a}: {a[:-1]} takes no 에")
        if re.search(r"[을를]$", a) and INDEX.nounish(a[:-1]) and a[:-1] != "길" and MOTION.match(b):
            flag(eid, "motion-eul", f"{text!r}: {a} {b}: a destination takes 에")


# ---------------------------------------------------------------- rule 1: two defensible particles
GROUPS = {"은": "TOPIC", "는": "TOPIC", "이": "SUBJ", "가": "SUBJ", "을": "OBJ", "를": "OBJ", "도": "ALSO", "만": "ONLY", "에": "LOC", "에서": "ACT",
          "으로": "DIR", "로": "DIR", "하고": "AND", "와": "AND", "과": "AND", "이랑": "AND", "랑": "AND", "에게": "TO", "한테": "TO", "까지": "UNTIL",
          "부터": "FROM", "의": "GEN"}
NEEDS = {"은": True, "는": False, "이": True, "가": False, "을": True, "를": False, "과": True, "와": False, "이랑": True, "랑": False, "으로": True, "로": False}


def fits(base, p):
    """Whether particle p is the allomorph the word before the blank takes (학생은, never 학생는)."""
    if p in ("가",) and base in ("저", "나", "누구"):
        return False
    need = NEEDS.get(p)
    if need is None:
        return True
    if p == "로" and base and ends_in_consonant(base) and base[-1] >= "가" and ((ord(base[-1]) - 0xAC00) % 28) == 8:
        return True
    if p == "으로" and base and ((ord(base[-1]) - 0xAC00) % 28) == 8:
        return False
    return ends_in_consonant(base) == need


def transitive(word):
    """Whether a predicate is a form of an action verb (not the copula, an adjective, 있다 / 없다 or 되다)."""
    info = INDEX.forms.get(re.sub(r"[.?!]+$", "", word))
    if not info or info[0] not in LEX:
        return False
    return LEX[info[0]]["partOfSpeech"] == "verb" and info[0] not in ("있다", "없다", "아니다", "되다")


def particle_ambiguity(eid, e):
    if e["type"] != "fillBlank":
        return
    key = e["options"][e["correct"]]
    if key not in GROUPS:
        return
    s = e["sentence"]
    before, _, after = s.partition("___")
    if not before or before.endswith(" ") or not re.search(r"[가-힣0-9]$", before):
        return
    base = INDEX.tokens(before)[-1]
    rest = INDEX.tokens(after)
    verb = rest[-1] if rest else ""
    vi = e["translation"]
    kg = GROUPS[key]
    for o in e["options"]:
        if o == key or o not in GROUPS or not fits(base, o):
            continue
        og = GROUPS[o]
        pair = {kg, og}
        bad = None
        if pair == {"TOPIC", "SUBJ"}:
            bad = "topic and subject both fit"
        elif pair == {"TOPIC", "OBJ"} and transitive(verb):
            bad = "topic and object both fit a transitive verb"
        elif pair == {"TOPIC", "ALSO"} or pair == {"SUBJ", "ALSO"} or pair == {"OBJ", "ALSO"}:
            if ("cũng" in vi) != (kg == "ALSO"):
                bad = "도 against the translation"
            elif "cũng" not in vi and kg != "ALSO":
                pass
        elif pair == {"LOC", "ACT"} and re.match(r"^(살아|살았|사세요|살)", verb):
            bad = "살다 takes 에 and 에서"
        elif pair == {"LOC", "DIR"} and MOTION.match(verb):
            bad = "a verb of motion takes 에 and (으)로"
        elif pair == {"OBJ", "LOC"} and re.match(r"^(타요|탔|타세요)", verb):
            bad = "타다 takes 을/를 and 에"
        elif kg == og and kg in ("AND", "TO"):
            bad = "synonymous particles"
        elif pair == {"OBJ", "SUBJ"} and re.search(r"싶어", after):
            bad = "-고 싶다 takes 을/를 and 이/가"
        if bad:
            flag(eid, "two-particles", f"{s!r}: {key} and {o} — {bad}")


def ambiguity(eid, e):
    particle_ambiguity(eid, e)
    vi = e.get("translation") or e.get("prompt") or ""
    if e["type"] == "select":
        opts = [o["text"] for o in e["options"]]
        key = opts[e["correct"]]
        others = [o for i, o in enumerate(opts) if i != e["correct"]]
        if all(o in LEX for o in opts):
            heads = Counter(gloss_head(o) for o in opts)
            if heads[gloss_head(key)] > 1:
                flag(eid, "same-gloss", f"options {opts}: the key's gloss is shared")
        if e["mode"] != "targetToNative":
            for o in others:
                if same_answer(key, o, INDEX, vi):
                    flag(eid, "distractor-correct", f"{o!r} is also a correct rendering of {key!r}")
        if e["mode"] == "targetToNative":
            for o in others:
                if VI_BRACKET.search(o) and o.count("(") != o.count(")"):
                    flag(eid, "vi-bracket", f"{o!r}: a bracket is not closed")
    if e["type"] == "fillBlank":
        key = e["audioTarget"]
        for i, o in enumerate(e["options"]):
            if i != e["correct"] and same_answer(key, e["sentence"].replace("___", o), INDEX, vi):
                flag(eid, "distractor-correct", f"the blank filled with {o!r} is also correct")
    if e["type"] == "wordBank" and e["direction"] == "nativeToTarget":
        extra = list(e["tokens"])
        for t in e["answer"]:
            extra.remove(t)
        key = " ".join(e["answer"])
        accepted = {_bare(key)} | {_bare(" ".join(a)) for a in e.get("alternatives", [])}
        for d in extra:
            for i in range(len(e["answer"])):
                swapped = " ".join(e["answer"][:i] + [d] + e["answer"][i + 1:])
                if _bare(swapped) not in accepted and same_answer(key, swapped, INDEX, vi):
                    flag(eid, "tile-swap", f"tile {d!r} for {e['answer'][i]!r} builds another correct sentence: {swapped!r}")
        # a tile left out may also leave a correct sentence (the subject 저는 dropped)
        for i in range(len(e["answer"])):
            shorter = " ".join(e["answer"][:i] + e["answer"][i + 1:])
            if shorter and _bare(shorter) not in accepted and same_answer(key, shorter, INDEX, vi) and len(e["answer"]) > 1:
                flag(eid, "tile-drop", f"without {e['answer'][i]!r} the tiles still build a correct sentence ({shorter!r}): list it as an alternative")


def gloss_head(s):
    g = LEX[s]["glosses"]["vi"].split(";")[0]
    return (re.sub(r"\s*\(.*?\)?\s*$", "", g).strip() or g).lower()


# ---------------------------------------------------------------- rule 3: speech levels
def sentence_kinds(text):
    out = []
    for sent in re.split(r"(?<=[.?!])\s+", text.strip()):
        bare = re.sub(r"[.?!,]+$", "", sent).strip()
        if not bare:
            continue
        if any(bare.endswith(p) for p in SET_PHRASES) or bare in LEX:
            out.append("set")
            continue
        toks = INDEX.tokens(bare)
        out.append(INDEX.kind(toks[-1]) if toks else "fragment")
    return out


def register(eid, e, plain_ok):
    for text in key_texts(e):
        if e["type"] == "match":
            continue
        kinds = sentence_kinds(text)
        if "banmal" in kinds and not plain_ok:
            flag(eid, "banmal", f"{text!r}: a 반말 sentence end in a 해요체 key")
        if "formal" in kinds and "haeyo" in kinds:
            flag(eid, "level-mix", f"{text!r}: 합쇼체 and 해요체 in one key (outside the set phrases)")


# ---------------------------------------------------------------- rule 6: typed renderings
def typed_rules(eid, e):
    if e["type"] != "typeAnswer":
        return
    acc = {_bare(a) for a in [e["answer"]] + list(e["alternatives"])}
    for w in variants(e["prompt"], e["answer"], INDEX):
        if _bare(w) not in acc:
            flag(eid, "typed-rendering", f"{w!r} is a correct answer to {e['prompt']!r} and is not accepted")
    if re.search(r"\d", e["answer"]) or re.search(r"(시|명|살|개|원|분|층|병|잔|장)", e["answer"]):
        pass  # number_spellings is part of variants


def section1_rules(eid, e):
    if e["type"] in TYPED_TYPES or (e["type"] == "fillBlank" and not e.get("options")):
        flag(eid, "section1-typing", f"{e['type']}: Section 1 has no Hangul typing (word bank or choice instead; typing starts in Section 2)")


def cloze_rules(eid, e):
    if e["type"] == "conjugationCloze" and " " in e["answer"] and e["answer"].replace(" ", "") not in e["alternatives"]:
        flag(eid, "cloze-spacing", f"{e['answer']!r}: the spelling without the space is not accepted")


# ---------------------------------------------------------------- run
PLAIN_LESSON_EXERCISES = set()
seen = {}
stats = Counter()
particle_items = Counter()
lessons_with_flow = 0
concept_steps = 0
for r in records:
    if "flow" in r:
        lessons_with_flow += 1
        concept_steps += sum(1 for s in r["flow"] if "concept" in s)
    for e in r["exercises"]:
        eid = e["id"]
        stats[e["type"] + (":" + e["mode"] if e["type"] == "select" else "")] += 1
        payload = json.dumps({k: v for k, v in e.items() if k != "id"}, ensure_ascii=False, sort_keys=True)
        if payload in seen:
            flag(eid, "duplicate", f"repeats {seen[payload]}")
        seen[payload] = eid
        # 반말 recognition: unit k marks its exercises with a "(Nói thân mật" prompt option set (plain=True in the generator)
        plain_ok = e["type"] == "select" and e["mode"] == "targetToNative" and all("Nói thân mật" in o["text"] for o in e["options"])
        for text in key_texts(e):
            particle_rules(eid, text)
            for p in INDEX.problems(text):
                flag(eid, "word" if "is not a lexicon word" in p else "number" if "counts with" in p or "before a counter" in p else "particle", p)
        ambiguity(eid, e)
        register(eid, e, plain_ok)
        typed_rules(eid, e)
        cloze_rules(eid, e)
        if r["lessonId"] in SECTION1_LESSONS:
            section1_rules(eid, e)
        if e["type"] == "fillBlank" and e["options"][e["correct"]] in GROUPS:
            particle_items[e["options"][e["correct"]]] += 1

os.makedirs(f"{D}/lessons", exist_ok=True)
with open(f"{D}/lessons/OUTPUT.jsonl", "w", encoding="utf-8", newline="\n") as f:
    for r in records:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
summary = {
    "lessons": len(records),
    "exercises": sum(len(r["exercises"]) for r in records),
    "byType": dict(sorted(stats.items())),
    "particleFillIns": dict(sorted(particle_items.items(), key=lambda kv: (-kv[1], kv[0]))),
    "lessonsWithConceptSteps": lessons_with_flow,
    "conceptSteps": concept_steps,
    "findings": findings,
    "decided": [{"id": k[0], "rule": k[1], "reason": v} for k, v in sorted(DECIDED.items())],
}
os.makedirs(f"{D}/review", exist_ok=True)
with open(f"{D}/review/selfcheck.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump(summary, f, ensure_ascii=False, indent=2)
    f.write("\n")
for x in findings:
    print(f"{x['id']} [{x['rule']}] {x['message']}", file=sys.stderr)
print(f"self-check: {summary['lessons']} lessons, {summary['exercises']} exercises, {sum(particle_items.values())} particle fill-ins, "
      f"{lessons_with_flow} lessons with concept steps ({concept_steps} steps), {len(findings)} finding(s), {len(DECIDED)} decided")
if findings:
    sys.exit(1)

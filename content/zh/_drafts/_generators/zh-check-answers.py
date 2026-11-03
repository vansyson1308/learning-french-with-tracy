"""Self-check of the zh-vi answer keys (after ja-check-answers.py; the full D-10 review is a later session). It joins
lessons/parts/*.jsonl into lessons/OUTPUT.jsonl, then flags:

 1. more than one defensible answer: a fill-in or a word bank that offers both members of a pair that can fit the same
    gap (了/过, 在/正在, 吗/吧, 很/非常/真, 这儿/这里, 那儿/那里, 哪儿/哪里, 一点儿/一点), 不 against 没 where the
    sentence or its Vietnamese does not decide (有 after the gap, chưa / đã không / hôm qua); a measure-word fill-in whose
    noun takes another offered measure word too (zh_text.NOUN_MEASURES; a noun missing from the table is a finding, so
    each new noun is declared); two options with the same Vietnamese gloss or in one synonym group
    (content/synonym-groups.json, which the pack validator reads too); a sentence distractor that is the key in
    another accepted spelling (the numeral, natural or time-word variants of zh_text);
 2. measure-word errors in a key: a number, 这/那/哪, 几 or 每 straight before a noun (三书), 二 before a measure word
    (二个, outside 十二 / 第二), 两 before no measure word or unit;
 3. 了 misuse in a key: 没 … 了 in one clause, 了 with a habit (每天, 常常, 经常), 不有; and, with it, 吗 after a
    question word or an A不A question, 是 before a bare adjective (他是高), 很/非常/太 after 比;
 4. numerals: every typed answer lists each number before a measure word or unit in digits and in hanzi (3个 ⇄ 三个,
    2个 ⇄ 两个), the time word before and after the subject (我明天上班 ⇄ 明天我上班), the natural pairs (这儿/这里 …), and
    the subject 我 the Vietnamese prompt states — the D-10 patterns of ja-vi (content/ja/REVIEW-AI.md);
 5. characters outside the lexicon without a reading, homographs outside their stored reading, Latin letters in Chinese
    text or in a typed key (zh_text.Index; pinyin is practice, never a key), a proper noun taught as a daily word;
 6. Section 1 typing (coordinator decision for ja-vi 2026-11-04, applied to zh-vi from the start): a Section 1 lesson
    (by its unit's sectionId in units/OUTPUT.jsonl) holds no exercise that asks for typed Chinese or pinyin —
    typeAnswer, dictation, a fill-in without options, guidedWriting, simpleForm;
 7. a payload repeated across lessons;
 8. (session 3) the layer exercises and records: comprehension options distinct, all Chinese or all Vietnamese, a
    Vietnamese question, a Chinese key found in its reading or clip (and no Chinese distractor heard there too); a
    dictation without digits, keyed to its clip's transcript, listing its numeral and natural spellings; a spoken
    target among its own variants, every spoken, written or scenario answer hanzi only (no pinyin, no Hán-Việt) and
    widened by the natural pairs; every guided slot realized in the model answer, every form value a variant of its
    slot; rules 2, 3 and 5 over every reading, clip, speech answer, writing model and scenario line.
A finding stops the pipeline unless DECIDED gives the reason it stands. Counts go to review/selfcheck.json and, by hand,
to REVIEW-NOTES.md. usage: python -I zh-check-answers.py <repo root>
"""
import json, os, re, sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from zh_text import (COUNTER_NOUNS, HAN, MEASURE_WORDS, NOUN_MEASURES, Index, bare, load_lexicon, natural_spellings,  # noqa: E402
                     numeral_spellings, subject_spellings, topic_spellings)

ROOT = sys.argv[1]
D = f"{ROOT}/content/zh/_drafts"
PARTS = ["s1", "s2", "s3", "s4", "s5", "s6"]
LEXL = load_lexicon(ROOT)
LEX = {x["surface"]: x for x in LEXL}
INDEX = Index(LEXL)
SYNONYMS = json.load(open(f"{ROOT}/content/synonym-groups.json", encoding="utf-8"))["groups"].get("zh", [])
# A finding that stands, with its reason. Keys are (exercise id, rule).
DECIDED = {}
findings = []


def flag(eid, rule, msg):
    if (eid, rule) in DECIDED:
        return
    findings.append({"id": eid, "rule": rule, "message": msg})


records = []
for p in PARTS:
    path = f"{D}/lessons/parts/{p}.jsonl"
    if os.path.exists(path):
        records += [json.loads(x) for x in open(path, encoding="utf-8") if x.strip()]
SECTION1_LESSONS = {l["id"] for u in (json.loads(x) for x in open(f"{D}/units/OUTPUT.jsonl", encoding="utf-8") if x.strip())
                    if u["sectionId"] == "zh-vi:section-1" for l in u["lessons"]}
TYPED_TYPES = {"typeAnswer", "dictation", "guidedWriting", "simpleForm"}


def gloss_head(s):
    g = LEX[s]["glosses"]["vi"].split(";")[0]
    return (re.sub(r"\s*\(.*?\)?\s*$", "", g).strip() or g).lower()


def key_texts(e):
    t = e["type"]
    if t == "select":
        return [e["prompt"]] if e["mode"] == "targetToNative" else [e["options"][e["correct"]]["text"]]
    if t == "fillBlank":
        return [e["audioTarget"]]
    if t == "wordBank":
        return ["".join(e["answer"])] + ["".join(a) for a in e.get("alternatives", [])] if e["direction"] == "nativeToTarget" else [e["prompt"]]
    if t == "typeAnswer":
        return [e["answer"]] + list(e["alternatives"])
    if t == "match":
        return [p["target"] for p in e["pairs"]]
    # Session 3: the layers. A dictation key and its other spellings, a spoken target (its variants are grading strings,
    # layer_rules reads them), the model answers of a writing task (a form's hanzi values), a Chinese comprehension key.
    if t == "dictation":
        return [e["answer"]] + list(e["alternatives"])
    if t in ("speakRepetition", "speakProduction"):
        return [e["target"]]
    if t == "guidedWriting":
        return list(e["modelAnswers"])
    if t == "simpleForm":
        return [v.strip() for m in e["modelAnswers"] for v in m.split(" | ") if HAN.search(v)]
    if t in ("listeningComprehension", "readingComprehension") and HAN.search(e["options"][e["correct"]]["text"]):
        return [e["options"][e["correct"]]["text"]]
    return []


def shown_texts(e):
    t = e["type"]
    hidden = t in ("typeAnswer", "dictation")  # the alternatives of a typed key are never shown
    out = [x for x in key_texts(e) if not hidden] + ([e["answer"]] if hidden else [])
    if t == "select" and e["mode"] != "targetToNative":
        out += [o["text"] for o in e["options"]]
    if t == "fillBlank":
        out += [e["sentence"].replace("___", o) for o in e["options"]]
    if t == "wordBank" and e["direction"] == "nativeToTarget":
        out += e["tokens"]
    if t in ("listeningComprehension", "readingComprehension"):
        out += [o["text"] for o in e["options"] if HAN.search(o["text"])]
    return out


# ---------------------------------------------------------------- rule 2 and 3: grammar of a key
NUMERALS = set("一二三四五六七八九十百千万两几零") | {"这", "那", "哪", "每"}
POS = {x["surface"]: x["partOfSpeech"] for x in LEXL}
# A noun right after a number or 这/那 that is right: units (天, 年 …), floors (三楼), 家 as a measure (一家公司), 哪国人,
# a bus route (五路公交车).
NOUN_AFTER_NUMBER_OK = set(COUNTER_NOUNS) | {"楼", "家", "国", "口", "路"}
_DIGIT_RUN = re.compile(r"[0-9]")


def grammar_rules(eid, text):
    toks = [t for t, _ in INDEX.tokens(text)]
    for i, t in enumerate(toks[:-1]):
        nxt = toks[i + 1]
        if (t in NUMERALS or _DIGIT_RUN.fullmatch(t[-1:] or "")) and POS.get(nxt) == "noun" and nxt not in NOUN_AFTER_NUMBER_OK and nxt not in MEASURE_WORDS:
            if t in ("这", "那") and i + 2 <= len(toks):
                flag(eid, "measure-missing", f"{text!r}: {t}{nxt} needs a measure word ({t}个{nxt}, {t}本{nxt} …)")
            elif t not in ("这", "那"):
                flag(eid, "measure-missing", f"{text!r}: {t}{nxt} needs a measure word between the number and the noun")
        if t == "二" and (nxt in MEASURE_WORDS) and not (i > 0 and toks[i - 1] in ("十", "第") or (i > 0 and toks[i - 1] in "一三四五六七八九")):
            flag(eid, "liang-er", f"{text!r}: 二 before the measure word {nxt}: say 两")
        if t == "两" and nxt not in MEASURE_WORDS and nxt not in COUNTER_NOUNS and nxt not in ("百", "千", "万", "点", "张", "楼"):
            flag(eid, "liang-er", f"{text!r}: 两 before {nxt}, which is no measure word or unit")
    if toks and toks[-1] == "两" and len(toks) > 1:
        flag(eid, "liang-er", f"{text!r}: 两 ends the phrase without a measure word")
    # 没 + verb … 了 (我没吃了) is wrong; 没 + noun + 了 (没电了, 没钱了: "has run out") is right.
    for i, t in enumerate(toks[:-1]):
        if t == "没" and POS.get(toks[i + 1]) == "verb" and toks[i + 1] not in ("有",):
            clause_end = next((j for j in range(i, len(toks)) if toks[j] in "，。！？；"), len(toks))
            if "了" in toks[i + 1:clause_end]:
                flag(eid, "le-mei", f"{text!r}: 没 + verb … 了 in one clause (the negative of a done action drops 了)")
    for clause in re.split(r"[，。！？；]", text):
        if re.search(r"(?:每天|常常|经常).*了", clause):
            flag(eid, "le-habit", f"{text!r}: 了 with a habit (每天, 常常, 经常)")
        if "不有" in clause:
            flag(eid, "bu-you", f"{text!r}: the negative of 有 is 没有")
        # 什么 after 有 / 要 before a final 吗 is the indefinite "anything" (有什么事吗？ 还要什么吗？), which is right.
        if clause.endswith("吗") and re.search(r"什么|谁|哪|几|多少|怎么|为什么", re.sub(r"(?:有|要)什么", "", clause)):
            flag(eid, "ma-question-word", f"{text!r}: a question word takes no 吗")
        if clause.endswith("吗") and re.search(r"(.)不\1", clause):
            flag(eid, "ma-a-not-a", f"{text!r}: an A不A question takes no 吗")
        if re.search(r"比[^，。]*?(?:很|非常|太)", clause) and "比" in clause:
            flag(eid, "bi-hen", f"{text!r}: no 很/非常/太 after 比")
    for i, t in enumerate(toks):
        if t != "是":
            continue
        rest = [x for x in toks[i + 1:] if x not in ("很", "太", "非常")]
        if rest and POS.get(rest[0]) == "adjective" and (len(rest) == 1 or rest[1] in "。！？，了"):
            flag(eid, "shi-adjective", f"{text!r}: 是 before a bare adjective ({rest[0]}): use 很, no 是")


# ---------------------------------------------------------------- rule 1: more than one defensible answer
PAIRS = [("了", "过"), ("在", "正在"), ("吗", "吧"), ("很", "非常"), ("很", "真"), ("非常", "真"),
         ("这儿", "这里"), ("那儿", "那里"), ("哪儿", "哪里"), ("一点儿", "一点")]
# Measure words that count actions (吃三次药: 次 counts the eating), so the noun after them is the verb's object.
VERBAL_MEASURES = {"次", "遍"}
PAST_CUE = re.compile(r"chưa|đã không|hôm qua|Hôm qua|đã|năm ngoái|tuần trước", re.I)


def after_gap(sentence):
    rest = sentence.split("___", 1)[1]
    toks = [t for t, py in INDEX.tokens(rest) if py]
    return toks[0] if toks else ""


def fill_rules(eid, e):
    opts, c = e["options"], e["correct"]
    key, others = opts[c], [o for i, o in enumerate(opts) if i != c]
    vi, sentence = e["translation"], e["sentence"]
    for a, b in PAIRS:
        if key in (a, b) and (b if key == a else a) in others:
            if {a, b} == {"吗", "吧"} and re.search(r"nhé|đi$|chứ|nhỉ", vi) and key == "吧":
                continue
            flag(eid, "pair", f"{sentence!r}: {a} and {b} both offered — both can fill the gap")
    if key in ("不", "没", "没有") and any(o in ("不", "没", "没有") for o in others):
        nxt = after_gap(sentence)
        past = bool(PAST_CUE.search(vi))
        if key == "不" and (nxt == "有" or past):
            flag(eid, "bu-mei", f"{sentence!r}: the key 不 sits before 有 or in a past sentence ({vi!r})")
        if key in ("没", "没有") and not (nxt == "有" or past or "có" in vi):
            flag(eid, "bu-mei", f"{sentence!r}: nothing in the sentence or {vi!r} rules out 不")
    if key in MEASURE_WORDS and key not in VERBAL_MEASURES:
        noun = after_gap(sentence)
        if noun and POS.get(noun) == "noun":
            ok = NOUN_MEASURES.get(noun)
            if ok is None:
                flag(eid, "measure-table", f"{sentence!r}: declare the measure words of {noun} in zh_text.NOUN_MEASURES")
            else:
                if key not in ok:
                    flag(eid, "measure-key", f"{sentence!r}: {noun} does not take {key} ({'/'.join(sorted(ok))})")
                for o in others:
                    if o in ok:
                        flag(eid, "measure-two", f"{sentence!r}: {noun} takes {o} too")


def tile_rules(eid, e):
    if e["type"] != "wordBank" or e["direction"] != "nativeToTarget":
        return
    extra = list(e["tokens"])
    for t in e["answer"]:
        extra.remove(t)
    for a, b in PAIRS:
        for p, q in ((a, b), (b, a)):
            if p in e["answer"] and q in extra:
                flag(eid, "tile-swap", f"tiles {e['answer']} + {q!r}: {q} can replace {p}")
    # a measure word tile the noun also takes
    for i, t in enumerate(e["answer"][:-1]):
        if t in MEASURE_WORDS:
            noun = e["answer"][i + 1]
            ok = NOUN_MEASURES.get(noun, set())
            for q in extra:
                if q in ok and q != t:
                    flag(eid, "tile-measure", f"tiles {e['answer']} + {q!r}: {noun} takes {q} too")


def equivalents(text):
    out = set()
    for x in numeral_spellings(text) + natural_spellings(text) + topic_spellings(text):
        out.add(bare(x))
    return out


def option_rules(eid, e):
    if e["type"] != "select":
        return
    opts = [o["text"] for o in e["options"]]
    key = opts[e["correct"]]
    if len(set(opts)) != len(opts):
        flag(eid, "options", f"repeated option in {opts}")
    if e["mode"] != "listen":
        for o in opts:
            if o != key and any(o in grp and key in grp for grp in SYNONYMS):
                flag(eid, "synonym", f"{o!r} and the key {key!r} are one synonym group (content/synonym-groups.json)")
    if all(o in LEX for o in opts) and e["mode"] != "listen":
        heads = Counter(gloss_head(o) for o in opts)
        if heads[gloss_head(key)] > 1:
            flag(eid, "same-gloss", f"options {opts}: the key's gloss is shared")
        for o in opts:
            if LEX[o].get("proper"):
                flag(eid, "proper-word", f"{o}: a proper noun is never a daily word")
    if e["mode"] == "nativeToTarget" and HAN.search(key):
        eq = equivalents(key)
        for o in opts:
            if o != key and bare(o) in eq:
                flag(eid, "equivalent-distractor", f"{o!r} is another spelling of the key {key!r}")


# ---------------------------------------------------------------- rule 4: typed renderings
def missing(accepted, wanted):
    have = {bare(a) for a in accepted}
    return [w for w in wanted if bare(w) not in have]


def typed_rules(eid, e):
    acc = [e["answer"]] + list(e["alternatives"])
    want = []
    for a in acc:
        want += numeral_spellings(a) + natural_spellings(a) + subject_spellings(e["prompt"], a)
    for w in missing(acc, want):
        flag(eid, "typed-rendering", f"{w!r} is a correct answer to {e['prompt']!r} and is not accepted")
    for a in acc:
        if re.search(r"[A-Za-z]", a):
            flag(eid, "typed-latin", f"{a!r}: a typed key is hanzi only (pinyin is practice)")
    if len({bare(a) for a in acc}) != len(acc):
        flag(eid, "typed-duplicate", f"{acc}: two accepted answers are one after punctuation")


# ---------------------------------------------------------------- rule 8 (session 3): the layer exercises and records
def _jsonl(step):
    path = f"{D}/{step}/OUTPUT.jsonl"
    return {r["id"]: r for r in (json.loads(x) for x in open(path, encoding="utf-8") if x.strip())} if os.path.exists(path) else {}


READINGS, CLIPS, SPEECH, WRITING, SCENARIOS = _jsonl("readings"), _jsonl("listening"), _jsonl("speech"), _jsonl("writing"), _jsonl("scenarios")
LATIN = re.compile(r"[A-Za-zÀ-ɏḀ-ỿ]")
VI_LETTER = re.compile(r"[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]", re.I)


def layer_rules(eid, e):
    """The rules of the Section 3-6 exercise types (the layer generators check their own records too)."""
    t = e["type"]
    if t in ("listeningComprehension", "readingComprehension"):
        texts = [o["text"] for o in e["options"]]
        if len(set(texts)) != len(texts):
            flag(eid, "comprehension-options", f"repeated option in {texts}")
        if HAN.search(e["question"]):
            flag(eid, "comprehension-question", f"{e['question']!r}: the question is Vietnamese")
        zh = [bool(HAN.search(x)) for x in texts]
        if any(zh) and not all(zh):
            flag(eid, "comprehension-options", f"{texts}: options are all Chinese or all Vietnamese")
        key = texts[e["correct"]]
        if t == "readingComprehension" and HAN.search(key):
            body = "".join(b["text"] for b in READINGS[e["readingId"]]["blocks"])
            if key not in body:
                flag(eid, "comprehension-key", f"{key!r} is not in the text of {e['readingId']}")
        if t == "listeningComprehension" and HAN.search(key):
            heard = "".join(s["text"] for s in CLIPS[e["clipId"]]["segments"])
            if key not in heard:
                flag(eid, "comprehension-key", f"{key!r} is not in the clip {e['clipId']}")
            for x in texts:
                if x != key and x in heard:
                    flag(eid, "comprehension-key", f"the distractor {x!r} is heard in {e['clipId']} too")
    if t == "dictation":
        if re.search(r"[0-9０-９]", e["answer"]):
            flag(eid, "dictation-digits", f"{e['answer']!r}: a number has two spellings")
        heard = "".join(s["text"] for s in CLIPS[e["clipId"]]["segments"])
        if e["answer"] != heard:
            flag(eid, "dictation-key", f"{e['answer']!r} is not the transcript of {e['clipId']}")
        want = numeral_spellings(e["answer"]) + natural_spellings(e["answer"])
        for w in missing([e["answer"]] + list(e["alternatives"]), want):
            flag(eid, "typed-rendering", f"{w!r} is a correct spelling of the dictation and is not accepted")
    if t in ("speakRepetition", "speakProduction"):
        plain = bare(e["target"])
        if plain not in {bare(v) for v in e["acceptedVariants"]}:
            flag(eid, "speech-target", f"{e['target']!r} is not among its own variants")
        for v in [e["target"]] + e["acceptedVariants"]:
            if LATIN.search(v):
                flag(eid, "speech-latin", f"{v!r}: a spoken answer is hanzi only (no pinyin, no Hán-Việt)")
        for w in missing(e["acceptedVariants"], [x for v in e["acceptedVariants"] for x in natural_spellings(v)]):
            flag(eid, "spoken-spelling", f"{w!r} (a recogniser's spelling) is not among the variants")
    if t == "guidedWriting":
        for model in e["modelAnswers"]:
            if e["writingMode"] != "guided":
                continue
            for slot in e["rubric"]["requiredSlots"]:
                if not any(v in model for v in slot["variants"]):
                    flag(eid, "writing-slot", f"model {model!r} realizes no variant of slot {slot['id']}")
    if t in ("guidedWriting", "simpleForm"):
        for slot in e["rubric"]["requiredSlots"]:
            for v in slot["variants"]:
                if LATIN.search(v):
                    flag(eid, "writing-latin", f"slot {slot['id']}: {v!r} — a variant is hanzi (pinyin is practice)")
            for w in missing(slot["variants"], [x for v in slot["variants"] for x in natural_spellings(v)]):
                flag(eid, "written-spelling", f"slot {slot['id']}: {w!r} is a correct spelling and not a variant")
    if t == "simpleForm":
        for model in e["modelAnswers"]:
            values = [v.strip() for v in model.split(" | ")]
            for field, value in zip(e["fields"], values):
                slot = next(s for s in e["rubric"]["requiredSlots"] if s["id"] == field["slotId"])
                if value not in slot["variants"]:
                    flag(eid, "form-value", f"{value!r} is not a variant of slot {slot['id']}")


def scenario_rules():
    """Every partner line is read like a lesson string; every learner answer is hanzi only and lists the natural pairs."""
    for s in SCENARIOS.values():
        for node in s["nodes"].values():
            where = f"{s['id']}/{node['id']}"
            for text in [node.get("text"), node.get("rephraseText")]:
                if text:
                    for p in INDEX.problems(text):
                        flag(where, "reading", p)
                    grammar_rules(where, text)
            if node["kind"] != "learner":
                continue
            for x in node["expected"]:
                for v in x["acceptedVariants"]:
                    if LATIN.search(v) or VI_LETTER.search(v):
                        flag(where, "scenario-latin", f"{v!r}: an answer is hanzi only")
                    grammar_rules(where, v)
                for w in missing(x["acceptedVariants"], [y for v in x["acceptedVariants"] for y in natural_spellings(v)]):
                    flag(where, "spoken-spelling", f"{w!r} (a recogniser's spelling) is not among the variants")


def reception_rules():
    """The readings and clips are shown (with pinyin) or heard: the reading and grammar rules apply to every line."""
    for rid, r in READINGS.items():
        for b in r["blocks"]:
            for text in [b["text"]] + ([b["speaker"]] if "speaker" in b else []):
                for p in INDEX.problems(text):
                    flag(rid, "reading", p)
            grammar_rules(rid, b["text"])
    for cid, c in CLIPS.items():
        for s in c["segments"]:
            for p in INDEX.problems(s["text"]):
                flag(cid, "reading", p)
            grammar_rules(cid, s["text"])
    for sid, it in SPEECH.items():
        for v in [it["target"]] + it["acceptedVariants"]:
            if LATIN.search(v):
                flag(sid, "speech-latin", f"{v!r}: a spoken answer is hanzi only")
            grammar_rules(sid, v)
    for tid, task in WRITING.items():
        for model in task["modelAnswers"]:
            for value in model.split(" | "):
                if HAN.search(value):
                    for p in INDEX.problems(value):
                        flag(tid, "reading", p)
                    grammar_rules(tid, value)


# ---------------------------------------------------------------- run
seen = {}
stats = Counter()
measure_items = Counter()
aspect_items = Counter()
lessons_with_flow = 0
concept_steps = 0
concepts_used = set()
for r in records:
    if "flow" in r:
        lessons_with_flow += 1
        for s in r["flow"]:
            if "concept" in s:
                concept_steps += 1
                concepts_used.add(s["concept"])
    for e in r["exercises"]:
        eid = e["id"]
        stats[e["type"] + (":" + e["mode"] if e["type"] == "select" else "")] += 1
        payload = json.dumps({k: v for k, v in e.items() if k != "id"}, ensure_ascii=False, sort_keys=True)
        if payload in seen:
            flag(eid, "duplicate", f"repeats {seen[payload]}")
        seen[payload] = eid
        for text in set(shown_texts(e)):
            for p in INDEX.problems(text):
                flag(eid, "reading", p)
        for text in key_texts(e):
            if text not in LEX:
                grammar_rules(eid, text)
        if e["type"] == "fillBlank":
            fill_rules(eid, e)
            k = e["options"][e["correct"]]
            if k in MEASURE_WORDS:
                measure_items[k] += 1
            if k in ("了", "过", "着", "在", "正在"):
                aspect_items[k] += 1
        tile_rules(eid, e)
        option_rules(eid, e)
        layer_rules(eid, e)
        if e["type"] == "typeAnswer":
            typed_rules(eid, e)
        if r["lessonId"] in SECTION1_LESSONS and (e["type"] in TYPED_TYPES or (e["type"] == "fillBlank" and not e.get("options"))):
            flag(eid, "section1-typing", f"{e['type']}: Section 1 has no typing of hanzi or pinyin (word bank or choice instead)")

concepts = {json.loads(x)["id"] for x in open(f"{D}/concepts/OUTPUT.jsonl", encoding="utf-8") if x.strip()}
for c in sorted(concepts - concepts_used):
    flag(c, "concept-unused", "no lesson flow shows this card")
# The lexicon examples are shown with pinyin too: the grammar rules apply to them (names may lack a reading, decision 8).
for x in LEXL:
    for ex in x.get("examples", []):
        grammar_rules(x["id"], ex["target"])
# Session 3: the layer records themselves (reserved ones included: checkpoints and placement show them later).
reception_rules()
scenario_rules()

os.makedirs(f"{D}/lessons", exist_ok=True)
with open(f"{D}/lessons/OUTPUT.jsonl", "w", encoding="utf-8", newline="\n") as f:
    for r in records:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
summary = {
    "lessons": len(records),
    "exercises": sum(len(r["exercises"]) for r in records),
    "byType": dict(sorted(stats.items())),
    "measureWordFillIns": dict(sorted(measure_items.items(), key=lambda kv: (-kv[1], kv[0]))),
    "aspectFillIns": dict(sorted(aspect_items.items(), key=lambda kv: (-kv[1], kv[0]))),
    "lessonsWithConceptSteps": lessons_with_flow,
    "conceptSteps": concept_steps,
    "conceptCardsUsed": len(concepts_used),
    "findings": findings,
    "decided": [{"id": k[0], "rule": k[1], "reason": v} for k, v in sorted(DECIDED.items())],
}
os.makedirs(f"{D}/review", exist_ok=True)
with open(f"{D}/review/selfcheck.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump(summary, f, ensure_ascii=False, indent=2)
    f.write("\n")
for x in findings:
    print(f"{x['id']} [{x['rule']}] {x['message']}", file=sys.stderr)
print(f"self-check: {summary['lessons']} lessons, {summary['exercises']} exercises, {sum(measure_items.values())} measure-word and "
      f"{sum(aspect_items.values())} aspect fill-ins, {lessons_with_flow} lessons with concept steps ({len(concepts_used)} cards), "
      f"{len(findings)} finding(s), {len(DECIDED)} decided")
if findings:
    sys.exit(1)

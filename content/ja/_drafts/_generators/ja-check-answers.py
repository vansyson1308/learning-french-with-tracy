"""Self-check of the ja-vi answer keys (the en D-10 answer pass, run by the generators' author; the full D-10 review is a
later session). It joins lessons/parts/*.jsonl into lessons/OUTPUT.jsonl, then flags:

 1. more than one defensible answer: two particles that both fit one blank (は/が, に/へ with a verb of motion, と/や,
    ね/よ without "nhỉ"/"đấy" in the translation, は/も against "cũng"); two options with the same Vietnamese gloss;
    a distractor that is the key in another register (ます vs plain) or with the subject dropped;
 2. wrong particles in a key: を or で before あります/います, を before 好き/嫌い/上手/下手/欲しい/わかります,
    を before 乗ります, に after a relative time word (今日, 毎日…), を before 行きます/来ます/帰ります;
 3. register mixing: a plain sentence end in a polite key (unless the exercise teaches plain forms), polite and plain
    endings in one key;
 4. kanji outside the lexicon readings (no furigana), misread single kanji, romaji (ja_text.Index);
 5. (session 4) the layer exercises: rules 2-4 over dictation keys and their kana spelling, every spoken answer a speech
    exercise accepts, writing model answers and Japanese comprehension keys; comprehension questions in Vietnamese,
    options distinct, a Japanese reading key present in its text; dictation without digits, its one alternative the kana
    spelling; a speech target among its own variants, no Latin letter (Hán-Việt, romaji) in an answer; every guided slot
    realized in the model answer, every form value a variant of its slot; every learner answer of the scenarios polite,
    Japanese only, with the right particles.
 6. (session 5) the assessment banks: every item of the checkpoints, the placement and the JLPT N5 track goes through rules
    1-5 like a lesson exercise. A select whose prompt has a gap （　） is read as a fill-in (the key fills the gap; particle
    pairs are checked); a reading-comprehension key that fills a numbered gap of its text (文章の文法) is not looked for
    in the text; a payload repeated across lessons and banks is a finding.
A finding stops the pipeline unless DECIDED gives the reason it stands. Counts go to review/selfcheck.json and, by hand,
to REVIEW-NOTES.md. usage: python -I ja-check-answers.py <repo root>
"""
import json, os, re, sys
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from ja_text import PLAIN_END, POLITE_END, Index, load_lexicon, sentence_ends  # noqa: E402

ROOT = sys.argv[1]
D = f"{ROOT}/content/ja/_drafts"
PARTS = ["s1", "s2", "s3", "s4", "s5", "s6"]
LEXL = load_lexicon(ROOT)
LEX = {x["surface"]: x for x in LEXL}
INDEX = Index(LEXL)
PARTICLES = {"は", "が", "を", "に", "で", "へ", "と", "も", "の", "か", "ね", "よ", "や", "から", "まで"}
# A finding that stands, with its reason. Keys are (exercise id, rule).
DECIDED = {}

def _jsonl(step):
    path = f"{D}/{step}/OUTPUT.jsonl"
    return {r["id"]: r for r in (json.loads(x) for x in open(path, encoding="utf-8") if x.strip())} if os.path.exists(path) else {}


READINGS, SCENARIOS = _jsonl("readings"), _jsonl("scenarios")
records = []
for p in PARTS:
    path = f"{D}/lessons/parts/{p}.jsonl"
    if os.path.exists(path):
        records += [json.loads(x) for x in open(path, encoding="utf-8") if x.strip()]
# Session 5: the assessment banks (checkpoints, placement, the exam track), as exercises with the id of their item.
BANKS = {"checkpoints": [], "placement": [], "exam": []}
for cp in _jsonl("checkpoints").values():
    BANKS["checkpoints"] += [i["exercise"] for i in cp["items"]]
for stage in _jsonl("placement").values():
    BANKS["placement"] += [i["exercise"] for cl in stage["clusters"] for i in cl["items"]]
for track in _jsonl("exam").values():
    BANKS["exam"] += [i["exercise"] for i in track["items"]]
GAP = "（　）"
findings = []


def flag(eid, rule, msg):
    if (eid, rule) in DECIDED:
        return
    findings.append({"id": eid, "rule": rule, "message": msg})


def gloss_head(s):
    g = LEX[s]["glosses"]["vi"].split(";")[0]
    return (re.sub(r"\s*\(.*?\)?\s*$", "", g).strip() or g).lower()


def options(e):
    if e["type"] == "select":
        return [o["text"] for o in e["options"]], e["correct"]
    if e["type"] == "fillBlank":
        return e["options"], e["correct"]
    return None, None


MOTION = re.compile(r"(?:行き|来|帰り|行っ|帰っ|来て)")
TIME_WORDS = ["今日", "明日", "昨日", "毎日", "毎朝", "毎晩", "毎週", "毎月", "今", "今朝", "今週", "来週", "先週", "今月", "来月", "先月", "今年", "来年", "去年", "あさって"]
LIKE_PRED = re.compile(r"を(?:好き|嫌い|上手|下手|欲しい|わかり)")


def key_texts(e):
    t = e["type"]
    if t == "select" and GAP in e["prompt"]:
        return [e["prompt"].replace(GAP, e["options"][e["correct"]]["text"])]
    if t == "select":
        return [e["prompt"]] if e["mode"] == "targetToNative" else [e["options"][e["correct"]]["text"]]
    if t == "fillBlank":
        return [e["audioTarget"]]
    if t == "wordBank" and e["direction"] == "nativeToTarget":
        return ["".join(e["answer"])]
    if t == "wordBank":
        return [e["prompt"]]
    if t == "typeAnswer":
        return [e["answer"]]
    if t == "conjugationCloze":
        return [e["sentence"].replace("___", e["answer"])]
    # Session 4: the layers. A dictation key and its kana spelling, every spoken answer the grader accepts, the model
    # answers of a writing task (a form's values are names, places and numbers: no sentence), Japanese comprehension keys.
    if t == "dictation":
        return [e["answer"]] + list(e["alternatives"])
    if t in ("speakRepetition", "speakProduction"):
        return [e["target"]]  # the variants are grading strings, never shown: layer_rules reads them
    if t == "guidedWriting":
        return list(e["modelAnswers"])
    if t in ("listeningComprehension", "readingComprehension") and JA.search(e["options"][e["correct"]]["text"]):
        return [e["options"][e["correct"]]["text"]]
    return []


JA = re.compile(r"[ぁ-ゖァ-ヺー㐀-䶿一-鿿]")
HAN_RE = re.compile(r"[㐀-䶿一-鿿々]")
VI_LETTER = re.compile(r"[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]", re.I)


def layer_rules(eid, e):
    """Session 4: the rules of the new exercise types (the layer generators check their own records too)."""
    t = e["type"]
    if t in ("listeningComprehension", "readingComprehension"):
        texts = [o["text"] for o in e["options"]]
        if len(set(texts)) != len(texts):
            flag(eid, "comprehension-options", f"repeated option in {texts}")
        if JA.search(e["question"]):
            flag(eid, "comprehension-question", f"{e['question']!r}: the question is Vietnamese")
        key = texts[e["correct"]]
        if t == "readingComprehension" and JA.search(key):
            body = "".join(b["text"] for b in READINGS[e["readingId"]]["blocks"])
            gap = re.search(r"（(\d)）", e["question"])
            if gap and f"（{gap.group(1)}）" in body:
                pass  # 文章の文法: the key fills a numbered gap of the text
            elif key not in body:
                flag(eid, "comprehension-key", f"{key!r} is not in the text of {e['readingId']}")
    if t == "dictation":
        if re.search(r"[0-9０-９]", e["answer"]):
            flag(eid, "dictation-digits", f"{e['answer']!r}: a number has two spellings")
        for a in e["alternatives"]:
            if HAN_RE.search(a):
                flag(eid, "dictation-alternative", f"{a!r}: the one alternative is the kana spelling")
            if INDEX.kana(e["answer"]) != a:
                flag(eid, "dictation-alternative", f"{a!r} is not the kana spelling of {e['answer']!r}")
    if t in ("speakRepetition", "speakProduction"):
        plain = e["target"].rstrip("。！")
        if plain not in e["acceptedVariants"]:
            flag(eid, "speech-target", f"{e['target']!r} is not among its own variants")
        for v in [e["target"]] + e["acceptedVariants"]:
            if VI_LETTER.search(v) or re.search(r"[A-Za-z]", v):
                flag(eid, "speech-latin", f"{v!r}: an answer is Japanese only (no Hán-Việt, no romaji)")
            particle_rules(eid, v)
            for end in sentence_ends(v):
                if len(end) > 3 and PLAIN_END.search(end) and not POLITE_END.search(end):
                    flag(eid, "speech-register", f"{v!r}: a spoken answer is in です/ます style")
    if t == "guidedWriting":
        for model in e["modelAnswers"]:
            for slot in e["rubric"]["requiredSlots"]:
                if not any(v in model for v in slot["variants"]) and e["writingMode"] == "guided":
                    flag(eid, "writing-slot", f"model {model!r} realizes no variant of slot {slot['id']}")
    if t == "simpleForm":
        for model in e["modelAnswers"]:
            values = [v.strip() for v in model.split(" | ")]
            for field, value in zip(e["fields"], values):
                slot = next(s for s in e["rubric"]["requiredSlots"] if s["id"] == field["slotId"])
                if value not in slot["variants"]:
                    flag(eid, "form-value", f"{value!r} is not a variant of slot {slot['id']}")


def scenario_rules():
    """Every learner answer a scenario accepts: polite, Japanese only, the right particles."""
    for s in SCENARIOS.values():
        for node in s["nodes"].values():
            if node["kind"] != "learner":
                continue
            for x in node["expected"]:
                for v in x["acceptedVariants"]:
                    where = f"{s['id']}/{node['id']}"
                    particle_rules(where, v)
                    if VI_LETTER.search(v) or re.search(r"[A-Za-z]", v):
                        flag(where, "scenario-latin", f"{v!r}: an answer is Japanese only")
                    for end in sentence_ends(v):
                        if len(end) > 3 and PLAIN_END.search(end) and not POLITE_END.search(end):
                            flag(where, "scenario-register", f"{v!r}: the learner speaks です/ます")


def particle_rules(eid, text):
    if re.search(r"(?:を|(?<![んい])で)(?:あります|います|ありません|いません|ありました|いました)", text):
        flag(eid, "existence-particle", f"{text!r}: あります/います take に (place) and が (thing)")
    if LIKE_PRED.search(text):
        flag(eid, "ga-predicate", f"{text!r}: 好き/嫌い/上手/下手/欲しい/わかります take が")
    if re.search(r"を乗り", text):
        flag(eid, "noru-ni", f"{text!r}: 乗ります takes に")
    for w in TIME_WORDS:
        if re.search(rf"(?<![一-鿿]){w}に(?![ぁ-ゖ]*(?:なり|入))", text) and not re.search(rf"{w}に(?:は|も)", text):
            flag(eid, "time-ni", f"{text!r}: {w} takes no に")
    if re.search(r"(?<!道)(?<!角)(?<!橋)を(?:行き|来ま|帰り)", text):
        flag(eid, "motion-wo", f"{text!r}: 行きます/来ます/帰ります take に or へ, not を")


AMBIGUOUS_PAIRS = [("は", "が"), ("に", "へ"), ("と", "や"), ("ね", "よ"), ("は", "も")]


def tile_ambiguity(eid, e):
    """A distractor tile that swaps for an answer particle into another correct sentence."""
    if e["type"] != "wordBank" or e["direction"] != "nativeToTarget":
        return
    extra = list(e["tokens"])
    for t in e["answer"]:
        extra.remove(t)
    sentence = "".join(e["answer"])
    # は/が and は/も are read in the fill-ins, where the blank shows the context; in a word bank a swapped は is
    # usually ungrammatical (週末が映画を見ます) or changes the meaning the prompt gives (これも).
    for a, b in AMBIGUOUS_PAIRS[1:4]:
        for p, q in ((a, b), (b, a)):
            if p in e["answer"] and q in extra:
                if (p, q) in (("に", "へ"), ("へ", "に")) and not MOTION.search(sentence):
                    continue
                if {p, q} == {"は", "も"} and "cũng" in e["prompt"]:
                    continue
                if {p, q} == {"ね", "よ"} and re.search(r"nhỉ|đấy", e["prompt"]):
                    continue
                flag(eid, "tile-swap", f"tiles {e['answer']} + {q!r}: {q} can replace {p}")


def ambiguity(eid, e, vi):
    tile_ambiguity(eid, e)
    opts, c = options(e)
    if opts is None:
        return
    key = opts[c]
    others = [o for i, o in enumerate(opts) if i != c]
    gap_select = e["type"] == "select" and GAP in e["prompt"]
    if (e["type"] == "fillBlank" or gap_select) and key in PARTICLES:
        sentence = e["prompt"].replace(GAP, "___") if gap_select else e["sentence"]
        pair = lambda a, b: key in (a, b) and (b if key == a else a) in others
        if pair("は", "が") and not re.search(r"(?:誰|何|どこ|どれ)___", sentence):
            flag(eid, "wa-ga", f"{sentence!r}: は and が both offered")
        if pair("に", "へ") and MOTION.search(sentence):
            flag(eid, "ni-he", f"{sentence!r}: に and へ both fit a verb of motion")
        if pair("と", "や"):
            flag(eid, "to-ya", f"{sentence!r}: と and や both fit")
        if pair("ね", "よ") and not re.search(r"nhỉ|đấy|đó|mà|nhé", vi):
            flag(eid, "ne-yo", f"{sentence!r}: ね and よ without a cue in the translation")
        if pair("は", "も") and ("cũng" in vi) != (key == "も"):
            flag(eid, "wa-mo", f"{sentence!r}: は/も against the translation {vi!r}")
        if key == "を" and "は" in others and not re.search(r"(?:は|が).*___", sentence):
            flag(eid, "wo-wa", f"{sentence!r}: を and は both offered (contrastive は also fits)")
    # Two options with the same Vietnamese meaning.
    if all(o in LEX for o in opts):
        heads = Counter(gloss_head(o) for o in opts)
        if heads[gloss_head(key)] > 1:
            flag(eid, "same-gloss", f"options {opts}: the key's gloss is shared")
    # A distractor that is the key in another register, or the key without its subject.
    for o in others:
        if re.sub(r"[。、]", "", o) == re.sub(r"^わたしは", "", re.sub(r"[。、]", "", key)) and o != key:
            flag(eid, "dropped-subject", f"{o!r} is {key!r} without わたしは")
        for end in sentence_ends(o):
            if len(end) > 3 and PLAIN_END.search(end) and not POLITE_END.search(end) and POLITE_END.search(sentence_ends(key)[-1] if sentence_ends(key) else ""):
                if o.rstrip("。")[:2] == key.rstrip("。")[:2]:
                    flag(eid, "register-distractor", f"{o!r}: a plain form beside the polite key {key!r}")


def register(eid, e):
    for text in key_texts(e):
        if text in LEX:
            continue
        ends = [x for x in sentence_ends(text) if len(x) > 3]
        polite = [x for x in ends if POLITE_END.search(x)]
        plain = [x for x in ends if PLAIN_END.search(x) and not POLITE_END.search(x)]
        if polite and plain:
            flag(eid, "register-mix", f"{text!r}: polite and plain sentence ends together")


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
        stats[e["type"] + (":" + e["mode"] if "mode" in e and e["type"] == "select" else "")] += 1
        payload = json.dumps({k: v for k, v in e.items() if k != "id"}, ensure_ascii=False, sort_keys=True)
        if payload in seen:
            flag(eid, "duplicate", f"repeats {seen[payload]}")
        seen[payload] = eid
        vi = e.get("translation") or e.get("prompt") or ""
        for text in key_texts(e):
            particle_rules(eid, text)
            for p in INDEX.problems(text):
                flag(eid, "reading", p)
        ambiguity(eid, e, vi)
        register(eid, e)
        layer_rules(eid, e)
        if e["type"] == "fillBlank" and e["options"][e["correct"]] in PARTICLES:
            particle_items[e["options"][e["correct"]]] += 1

bank_counts = {}
for bank, exercises in BANKS.items():
    bank_counts[bank] = len(exercises)
    for e in exercises:
        eid = e["id"]
        payload = json.dumps({k: v for k, v in e.items() if k != "id"}, ensure_ascii=False, sort_keys=True)
        if payload in seen:
            flag(eid, "duplicate", f"repeats {seen[payload]}")
        seen[payload] = eid
        vi = e.get("translation") or e.get("prompt") or ""
        texts = key_texts(e)
        # A Japanese prompt of a choice (an exam sentence, a kanji-reading item) is read like a key.
        if e["type"] == "select" and e["mode"] == "nativeToTarget" and JA.search(e["prompt"]) and GAP not in e["prompt"] and "★" not in e["prompt"]:
            texts = texts + [e["prompt"].replace("【", "").replace("】", "")]
        for text in texts:
            particle_rules(eid, text)
            for p in INDEX.problems(text):
                flag(eid, "reading", p)
        ambiguity(eid, e, vi)
        register(eid, e)
        layer_rules(eid, e)

scenario_rules()
os.makedirs(f"{D}/lessons", exist_ok=True)
with open(f"{D}/lessons/OUTPUT.jsonl", "w", encoding="utf-8", newline="\n") as f:
    for r in records:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
summary = {
    "lessons": len(records),
    "exercises": sum(len(r["exercises"]) for r in records),
    "byType": dict(sorted(stats.items())),
    "particleFillIns": dict(sorted(particle_items.items(), key=lambda kv: -kv[1])),
    "lessonsWithConceptSteps": lessons_with_flow,
    "conceptSteps": concept_steps,
    "assessmentItems": bank_counts,
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
      f"{lessons_with_flow} lessons with concept steps, assessment items {bank_counts}, {len(findings)} finding(s), {len(DECIDED)} decided")
if findings:
    sys.exit(1)

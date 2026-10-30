"""Apply the D-10 answer-key review to the generated OUTPUT files, before ingest. Findings and the decision on each are recorded in
content/it/_drafts/review/decisions-answers.json. usage: python -I it-review-apply.py <repo root>"""
import json, os, re, sys

ROOT = sys.argv[1]
D = f"{ROOT}/content/it/_drafts"
REVIEW = f"{D}/review"
STEPS = ["lessons", "speech", "writing", "checkpoints", "placement", "exam"]
docs = {s: [json.loads(l) for l in open(f"{D}/{s}/OUTPUT.jsonl", encoding="utf-8") if l.strip()] for s in STEPS}

ex = {}
for lesson in docs["lessons"]:
    for e in lesson["exercises"]:
        ex[e["id"]] = e
for cp in docs["checkpoints"]:
    for it in cp["items"]:
        ex[it["id"]] = it["exercise"]
for st in docs["placement"]:
    for c in st["clusters"]:
        for it in c["items"]:
            ex[it["id"]] = it["exercise"]
for track in docs["exam"]:
    for it in track["items"]:
        ex[it["id"]] = it["exercise"]
speech = {s["id"]: s for s in docs["speech"]}
tasks = {t["id"]: t for t in docs["writing"]}

# The grader spells digits (src/lib/languages/it.ts), so a digit form of a listed number is already accepted.
DIGIT_REASON = "No change: the Italian rules spell digits 0-100 before grading, so the digit form is already accepted (the reviewer read a checkout without them)."
SKIP = {
    "uo-l1-e1": DIGIT_REASON,
    "uo-l3-e0": DIGIT_REASON,
    "um-l1-e0": DIGIT_REASON,
    "um-l1-e1": DIGIT_REASON,
    "um-l2-e0": DIGIT_REASON,
    "um-l2-e1": DIGIT_REASON,
    "it.cpi.s4.time": DIGIT_REASON,
    "it.cpi.s4.price": DIGIT_REASON,
    "it.cpi.cap.speak_time": DIGIT_REASON,
    "it.cpi.cap.speak_price": DIGIT_REASON,
    "it.pli.s4.time": DIGIT_REASON,
    "it.pli.s4.price": DIGIT_REASON,
    "uc-l1-e3": "Kept: the guidebook of unit c now explains that primo piano is the floor above the ground floor.",
}
CLOSINGS = ["a dopo", "a più tardi", "saluti", "baci", "un bacio"]
SLOTS = {
    "up-l0-e1": {"like": ["mi piace molto il calcio", "a me piace il calcio"]},
    "up-l3-e0": {"cat": ["un piccolo gatto", "il gatto piccolo"], "house": ["una grande casa", "la casa grande"]},
    "uq-l0-e0": {"greeting": ["buonasera"]},
    "uq-l1-e0": {"time": ["alle 20"], "greeting": ["buonasera"]},
    "uq-l2-e0": {"closing": CLOSINGS},
    "uq-l3-e0": {"closing": CLOSINGS},
    "ur-l2-e0": {"room": ["stanza"], "greeting": ["buonasera"]},
    "ur-l1-e0": {},
}
OPTION_TEXT = {
    "u1-l0-e0": {"tạm biệt": "cảm ơn"},
    "uk-l2-e2": {"Xin chào buổi sáng!": "Xin lỗi!", "Chào buổi tối!": "Làm ơn!"},
    "it.cpi.s1.greet_leave": {"Buongiorno!": "Buonanotte!", "Ciao!": "Benvenuto!"},
}
SET = {
    "ud-l2-e0": {"audioTarget": "ventuno"},
    "ud-l2-e1": {"audioTarget": "ventotto"},
    "ud-l2-e2": {"audioTarget": "ventitré"},
    "uu-l0-e3": {"audioTarget": "Dov'è la stazione?"},
    "it.pli.s2.ind_key": {"sentence": "In classe c'è ___ studente.", "translation": "Trong lớp có một sinh viên."},
}


def full(i):
    return i if i.startswith("it.") else f"it-vi:{i}"


def add_unique(lst, values):
    for v in values:
        if v not in lst:
            lst.append(v)


def add_answers(e, values):
    if e["type"] in ("speakProduction", "speakRepetition"):
        values = [v.rstrip(".!") for v in values if not re.search(r"\d", v)]
        add_unique(e["acceptedVariants"], values)
        add_unique(speech[e["speechItemId"]]["acceptedVariants"], values)
    else:
        e.setdefault("alternatives", [])
        add_unique(e["alternatives"], values)


def add_order(e, order):
    by_lower = {t.lower(): t for t in e["tokens"]}
    tokens = [by_lower[t.lower()] for t in order]
    e.setdefault("alternatives", [])
    if tokens != e["answer"] and tokens not in e["alternatives"]:
        e["alternatives"].append(tokens)


def add_slots(e, slots):
    for rubric in (e["rubric"], tasks[e["writingTaskId"]]["rubric"]):
        for slot in rubric["requiredSlots"]:
            add_unique(slot["variants"], slots.get(slot["id"], []))


findings = json.load(open(f"{REVIEW}/findings-answers.json", encoding="utf-8"))
decisions = []
for f in findings:
    i, fix = f["id"].replace("it-vi:", ""), str(f["fix"])
    e = ex.get(full(i))
    if i in SKIP:
        decisions.append({**f, "decision": SKIP[i]})
        continue
    if e is None:
        raise SystemExit(f"unknown id {i}")
    done = "fixed"
    if i in OPTION_TEXT:
        for o in e["options"]:
            if o["text"] in OPTION_TEXT[i]:
                o["text"] = OPTION_TEXT[i][o["text"]]
    elif i in SET:
        e.update(SET[i])
    elif i in SLOTS:
        add_slots(e, SLOTS[i])
    elif i == "it.cpi.s4.from":
        target = "Vengo dal Vietnam"
        e["target"] = target
        speech[e["speechItemId"]]["target"] = target
        add_answers(e, ["Io vengo dal Vietnam", "Io sono vietnamita"])
    elif i == "it.pli.s4.please":
        for holder in (e, speech[e["speechItemId"]]):
            holder["requiredConcepts"][1] = ["favore", "piacere", "cortesia"]
    elif i == "it.exi.cils_a1.a_s1_01":
        model = "La mia camera è piccola ma bella. C'è un letto, un tavolo e una grande finestra. La sera studio l'italiano in questa stanza."
        e["modelAnswers"] = [model]
        tasks[e["writingTaskId"]]["modelAnswers"] = [model]
    else:
        m = re.search(r"(?:Add|add) (alternative orders?|alternatives?|acceptedVariants?|acceptedVariant)\s*:\s*(.+)$", fix)
        if not m:
            raise SystemExit(f"{i}: no rule for fix {fix!r}")
        kind, body = m.group(1), m.group(2)
        if "order" in kind:
            for part in body.split(" | "):
                add_order(e, json.loads(part))
        else:
            add_answers(e, [p.strip() for p in body.split(" | ")])
    decisions.append({**f, "decision": done})

with open(f"{REVIEW}/decisions-answers.json", "w", encoding="utf-8", newline="\n") as out:
    json.dump(decisions, out, ensure_ascii=False, indent=1)
    out.write("\n")
for s in STEPS:
    with open(f"{D}/{s}/OUTPUT.jsonl", "w", encoding="utf-8", newline="\n") as out:
        for r in docs[s]:
            out.write(json.dumps(r, ensure_ascii=False) + "\n")
print("answer review:", len(decisions), "decided,", sum(d["decision"] == "fixed" for d in decisions), "fixed")

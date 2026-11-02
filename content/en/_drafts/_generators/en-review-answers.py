"""Apply the D-10 answer-key review to the generated OUTPUT files, before ingest. A British form the course no longer models was
changed in the generators; what is here widens or corrects keys. The outcome of each finding is written to
content/en/_drafts/review/decisions-answers.json. usage: python -I en-review-answers.py <repo root>"""
import json, re, sys

ROOT = sys.argv[1]
D = f"{ROOT}/content/en/_drafts"
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

IN_GENERATORS = "fixed in the generators"
# Done at the source, or kept: the reason is the decision.
DECIDED = {
    ("en-vi:uc-l2-e1", None): None,
    ("en-vi:ua-l1-e6", None): "Kept for the owner: the item teaches 'the'; accepting 'on a table' would take away the point of the lesson.",
    ("en-vi:ud-l2-e0", None): f"fixed: key is now It's eight thirty, with its distractors, {IN_GENERATORS}; half past stays taught for recognition.",
    ("en-vi:ue-l0-e3", None): f"fixed: the word list of unit e shows 🍿 for watch, {IN_GENERATORS} (👀, 👁️ and 📺 are taken by see you, see and TV; the emoji gate wants one word each).",
    ("en-vi:ue-l0-e4", None): f"fixed: the word list of unit e shows 🍿 for watch, {IN_GENERATORS}.",
    ("en-vi:ue-l1-e1", None): f"fixed: the word list of unit e shows 🍿 for watch, {IN_GENERATORS}.",
    ("en-vi:uh-l3-e4", None): f"fixed, {IN_GENERATORS}.",
    ("en-vi:ur-l0-e2", None): f"fixed: fill out, {IN_GENERATORS}.",
    ("en-vi:ur-l0-e3", None): f"fixed: answer is Please fill out this form, {IN_GENERATORS}. No tile 'in' is added, so the British order is not offered as a trap.",
    ("en-vi:ut-l2-e3", None): f"fixed: The check, please, {IN_GENERATORS}; the lexeme bill moved to the A2-1 list with an example about a phone bill.",
    ("en-vi:ut-l3-e3", None): f"fixed: at this store, {IN_GENERATORS}; store is a new A1 lexeme, shop stays for coffee shop.",
    ("en-vi:ug-l1-e0", None): f"fixed: Restrooms, in the reading and the options, {IN_GENERATORS}.",
    ("en-vi:ug-l1-e2", None): f"fixed: Restrooms, in the reading and the options, {IN_GENERATORS}.",
    ("en-vi:ug-l2-e0", None): f"fixed: 8 a.m. to 6 p.m. style on all four notices with the keys and options that followed them, {IN_GENERATORS}: no question depends on the 24-hour clock.",
    ("en.cpi.s3.ann_page", None): f"fixed: to page twelve, {IN_GENERATORS}.",
    ("en.cpi.s3.note_pay", None): f"fixed: Please pay at the cashier, {IN_GENERATORS}.",
    ("en.exi.bac2_qd1481.b_r1_04", None): f"fixed: Store closing!, {IN_GENERATORS}; a store, not a shop, in the options too.",
}
# Variants by rubric slot. Where a finding listed loose words, phrases are used instead: the rubric refuses a slot realized in two
# separate places (slotRealizations), so one-word variants would fail "The weather is sunny and hot" and "How much does it cost?".
WEATHER = ["it is sunny", "it is hot", "it is rainy", "it is raining", "it is cold", "it is warm", "it is cloudy", "it is windy", "it is very hot", "it is very cold", "it is very sunny", "sunny day", "hot day", "rainy day", "cold day"]
CLOSE_FRIEND = ["take care", "your friend", "best", "regards"]
CLOSE_FORMAL = ["sincerely", "best wishes", "best"]
SLOTS = {
    "en-vi:uo-l2-e1": {"children": ["two kids"]},
    "en-vi:up-l2-e1": {"home": ["stay home", "staying home", "am home"], "sick": ["i am ill", "i feel sick", "i am not well"]},
    "en-vi:up-l3-e0": {"cat": ["a little cat", "the cat is little", "the small cat"], "house": ["a large house", "the house is large", "the big house"]},
    "en-vi:uq-l2-e0": {"closing": CLOSE_FORMAL, "greeting": ["good afternoon"]},
    "en-vi:ur-l3-e1": {"closing": CLOSE_FORMAL, "greeting": ["good afternoon"]},
    "en-vi:ur-l2-e0": {"broken": ["is not working", "is broken"], "call": ["call your manager", "call our manager", "call my manager"]},
    "en.exi.bac2_qd1481.a_w1_01": {"s1": ["live in a small apartment near a park"], "s2": ["works in the hospital in hue", "works at the hospital in hue"], "s3": ["do not go to work on sundays", "did not go to work on sunday", "are not going to work on sunday"], "s5": ["what time did you get up"]},
    "en.exi.bac2_qd1481.b_w1_01": {"s3": ["did not like coffee"], "s5": ["where do you buy this bag"]},
    "en.exi.bac2_qd1481.a_w2_01": {"closing": CLOSE_FORMAL},
    "en.exi.bac2_qd1481.b_w2_01": {"closing": CLOSE_FORMAL, "greeting": ["to all", "to everyone", "hi everyone", "hello everyone", "dear everyone"]},
    "en.cpi.s5.profile_hoa": {"city": ["from hanoi", "city is hanoi"]},
    "en-vi:uo-l3-e0": {"city": ["from hue", "city is hue"]},
    "en.cpi.s5.like_music": {"like": ["i really like music", "i enjoy music", "i really love music"]},
    "en.cpi.s5.sister": {"name": ["name is linh", "name's linh", "sister is linh"]},
    "en.cpi.s5.note_peter": {"greeting": ["hey"]},
    "en.cpi.s5.note_sick": {"sick": ["ill", "not well", "not feeling well"], "greeting": ["hey"], "closing": ["take care"]},
    "en.cpi.cap.write_smith": {"sick": ["ill", "not well", "not feeling well"], "closing": CLOSE_FORMAL},
    "en.cpi.s5.mail_boss": {"closing": CLOSE_FORMAL, "greeting": ["good afternoon"]},
    "en.cpi.s5.mail_shop": {"price": ["price of", "what is the price", "what does it cost", "what does this phone cost", "what does the phone cost"], "closing": CLOSE_FORMAL, "greeting": ["good afternoon"]},
}
# Two findings on one item: the first names one slot, the second another.
SLOT_FINDINGS = {
    ("en.exi.bac2_qd1481.a_w3_01", "sunny"): {"weather": WEATHER},
    ("en.exi.bac2_qd1481.a_w3_01", "danang"): {"place": ["danang"], "closing": CLOSE_FRIEND},
    ("en.exi.bac2_qd1481.b_w3_01", "new apartment"): {"house": ["new apartment", "new place", "new flat"], "closing": CLOSE_FRIEND},
    ("en.cpi.s5.room", "the big bed"): {"bed": ["the big bed", "the bed is large", "a large bed"], "table": ["the small table", "the table is little", "a little table"]},
}
NOTES = {
    "en.exi.bac2_qd1481.a_w3_01": "fixed with phrases (it is sunny, it is raining …), not loose words, because a slot realized twice fails the rubric's stuffing check; thanks left out of the closing for the same reason.",
    "en.exi.bac2_qd1481.b_w3_01": "fixed; thanks left out of the closing: 'Thanks! See you soon' would count as a slot realized twice.",
    "en.exi.bac2_qd1481.b_w2_01": "fixed with to everyone, hi everyone and the like, not a bare 'everyone': 'Hi everyone' would count as a greeting realized twice.",
    "en.cpi.s5.mail_shop": "fixed with price of, what is the price and what does it cost, not bare cost: 'How much does it cost?' would count as a slot realized twice.",
    "en-vi:up-l2-e1": "fixed; feel and stay were also added to the required verbs, or 'I stay home because I feel sick' still fails on the verb.",
    "en.cpi.s5.like_music": "fixed; enjoy was also added to the required verbs.",
}
# requireSentenceVerbs beyond the findings' own: a failed check gives does_not_meet_rubric (src/lib/writing/rubric.ts, step 5).
VERBS = {"en-vi:up-l2-e1": ["feel", "stay", "staying"], "en.cpi.s5.like_music": ["enjoy"], "en.cpi.s5.room": ["has", "have", "there are"]}
CONCEPTS = {
    "en.exi.bac2_qd1481.a_s3_01": ("cook", ["cooking", "cooks", "cooked", "make dinner", "makes dinner"]),
    "en.exi.bac2_qd1481.a_s4_01": ("because", ["so", "since"]),
    "en.exi.bac2_qd1481.b_s4_01": ("because", ["so", "since"]),
}
OPTION_TEXT = {"en-vi:ue-l2-e1": {"washes": "helps"}, "en-vi:uu-l2-e3": {"hurt": "hurting"}}
PROMPT = {"en-vi:uc-l2-e1": "Nó rất tốt."}
CUE = {"en-vi:un-l2-e0": "🪑", "en-vi:un-l3-e2": "🪑"}


def add_unique(lst, values):
    for v in values:
        if v not in lst:
            lst.append(v)


def mirrors(key, value):
    return [e for e in ex.values() if e.get(key) == value]


def spoken_key(text):
    """What the validator's normalization makes of a variant, for the contraction it folds here."""
    return re.sub(r"[.,!?]", "", text.lower().replace("i'm", "i am")).strip()


def add_speech(e, values):
    sid = e["speechItemId"]
    have = {spoken_key(v) for v in speech[sid]["acceptedVariants"]} | {spoken_key(speech[sid]["target"])}
    fresh = []
    for v in values:
        if spoken_key(v) not in have:
            have.add(spoken_key(v))
            fresh.append(v.rstrip(".!"))
    values = fresh
    add_unique(speech[sid]["acceptedVariants"], values)
    for m in mirrors("speechItemId", sid):
        add_unique(m["acceptedVariants"], values)


def set_cue(e, cue):
    sid = e["speechItemId"]
    speech[sid]["prompt"]["cueEmoji"] = cue
    for m in mirrors("speechItemId", sid):
        m["cueEmoji"] = cue


def add_concepts(e, head, values):
    sid = e["speechItemId"]
    for holder in [speech[sid]] + mirrors("speechItemId", sid):
        for slot in holder["requiredConcepts"]:
            if head in slot:
                add_unique(slot, values)


def add_slots(e, slots):
    tid = e["writingTaskId"]
    for holder in [tasks[tid]] + mirrors("writingTaskId", tid):
        for slot in holder["rubric"]["requiredSlots"]:
            add_unique(slot["variants"], slots.get(slot["id"], []))
    wanted = set(slots) - {s["id"] for s in tasks[tid]["rubric"]["requiredSlots"]}
    if wanted:
        raise SystemExit(f"{tid}: no slot {wanted}")


def add_verbs(e, verbs):
    tid = e["writingTaskId"]
    for holder in [tasks[tid]] + mirrors("writingTaskId", tid):
        add_unique(holder["rubric"]["requireSentenceVerbs"], verbs)


def add_order(e, order):
    by_lower = {t.lower(): t for t in e["tokens"]}
    tokens = [by_lower[t.lower()] for t in order]
    e.setdefault("alternatives", [])
    if tokens != e["answer"] and tokens not in e["alternatives"]:
        e["alternatives"].append(tokens)


findings = json.load(open(f"{REVIEW}/findings-answers.json", encoding="utf-8"))
decisions = []
for f in findings:
    i, fix = f["id"], str(f["fix"])
    e = ex.get(i)
    if e is None:
        raise SystemExit(f"unknown id {i}")
    outcome = "fixed"
    if (i, None) in DECIDED and DECIDED[(i, None)]:
        outcome = DECIDED[(i, None)]
    elif i == "en-vi:um-l0-e1" and fix.startswith("Set target"):
        outcome = f"fixed: target and model clip say on my team, {IN_GENERATORS}."
    elif i == "en-vi:um-l0-e1":
        add_speech(e, ["There are ten people on my team", "My team has ten people", "Ten"])
    elif i in OPTION_TEXT:
        for old, new in OPTION_TEXT[i].items():
            if e["type"] == "fillBlank":
                e["options"] = [new if o == old else o for o in e["options"]]
            else:
                for o in e["options"]:
                    if o["text"] == old:
                        o["text"] = new
    elif i in PROMPT:
        e["prompt"] = PROMPT[i]
    elif i in CUE and fix.startswith("Set cueEmoji"):
        set_cue(e, CUE[i])
        outcome = "fixed: no table emoji exists; a chair is closer than a sofa, and the instruction names the table."
    elif i in CONCEPTS:
        add_concepts(e, *CONCEPTS[i])
        outcome = "fixed, in the requiredConcepts slot."
        if "s4" in i:
            outcome += " The empty pass ('I agree because') is recorded for the owner: a stricter slot is an author decision."
    elif "requireSentenceVerb" in fix:
        add_verbs(e, VERBS[i])
        outcome = "fixed: a missing verb gives does_not_meet_rubric (src/lib/writing/rubric.ts, step 5), so has, have and there are now count."
    elif i in SLOTS or any(k[0] == i and k[1] in fix for k in SLOT_FINDINGS):
        slots = SLOTS.get(i)
        for k, v in SLOT_FINDINGS.items():
            if k[0] == i and k[1] in fix:
                slots = v
        add_slots(e, slots)
        if i in VERBS and i != "en.cpi.s5.room":
            add_verbs(e, VERBS[i])
        outcome = NOTES.get(i, "fixed")
    elif i == "en-vi:ua-l3-e9":
        e["alternatives"] += ["We have no milk.", "We don't have any milk.", "We don't have milk."]
        outcome = "fixed: correct English for a prompt with no subject."
    else:
        m = re.search(r"Add (alternative orders?|alternatives?|acceptedVariants?)\s*:\s*(.+)$", fix)
        if not m:
            raise SystemExit(f"{i}: no rule for fix {fix!r}")
        kind, body = m.group(1), m.group(2)
        if "order" in kind:
            for part in body.split(" | "):
                add_order(e, json.loads(part))
        elif e["type"].startswith("speak"):
            add_speech(e, [p.strip() for p in body.split(" | ")])
        else:
            e.setdefault("alternatives", [])
            add_unique(e["alternatives"], [p.strip() for p in body.split(" | ")])
    row = {**f, "decision": outcome}
    if "owner" in outcome.split(":")[0] or "recorded for the owner" in outcome:
        row["forOwner"] = True
    decisions.append(row)

# The reviewer could not see the scenarios' answer data. Reviewed by the same standard; the change is in the generators (en-scenarios-s6.py, en-exam.py).
# A word that also fits a refusal ("thanks": "No, thanks") went in as a whole-answer variant, never as a concept that would pass the refusal.
SCENARIO_REVIEW = {
    "en.scenario.shop_shirt, cp6_shop_shoes": "ask_price also takes price and cost (What is the price of this shirt?).",
    "en.scenario.ask_directions, cp6_way_bank": "ask_way also takes how and way (How do I get to the post office?).",
    "en.scenario.restaurant_order": "ask_check takes check and bill; the model answers say check.",
    "en.scenario.clinic_visit": "symptom also takes head hurts.",
    "en.scenario.phone_appointment": "ask_appointment also takes see the doctor; agree also takes sure, all right, and That's good and Thanks as whole answers.",
    "en.scenario.email_question": "agree takes all right; Thank you, Thanks and Please do as whole answers.",
    "en.scenario.factory_instructions": "understood also takes got it, yes, sure, all right; ask_stop also takes turn it off.",
    "en.scenario.airport_checkin, hotel_checkin": "hand_over also takes passport (This is my passport); accept_seat takes A window seat, please.",
    "en.scenario.cp6_shop_job": "little also takes a bit.",
    "en.scenario.cp6_clinic_cough": "no_fever also takes do not (I don't have a fever).",
    "en.scenario.cp6_call_office": "agree also takes call later, call back.",
    "en.scenario.a1cap_new_worker": "confirm takes That's right, That's me, I am, Right as whole answers; no_helmet also takes do not.",
    "en.scenario.a1cap_friend_plan, a1cap_lunch": "accept takes okay; I'm free, Good idea, I'd love to as whole answers.",
    "en.scenario.bac2_a_social": "weekend also takes cooking.",
    "en.scenario.bac2_b_social": "live_with also takes mom, mother, dad, father.",
    "en.scenario.bac2_a_greet, bac2_b_greet": "fine also takes great.",
}
decisions += [{"id": k, "severity": "own review", "problem": "Intent patterns narrower than the natural answers.", "fix": v, "decision": "fixed"} for k, v in SCENARIO_REVIEW.items()]

with open(f"{REVIEW}/decisions-answers.json", "w", encoding="utf-8", newline="\n") as out:
    json.dump(decisions, out, ensure_ascii=False, indent=1)
    out.write("\n")
for s in STEPS:
    with open(f"{D}/{s}/OUTPUT.jsonl", "w", encoding="utf-8", newline="\n") as out:
        for r in docs[s]:
            out.write(json.dumps(r, ensure_ascii=False) + "\n")
print("answer review:", len(decisions), "decided,", sum(d["decision"].startswith("fixed") for d in decisions), "fixed")

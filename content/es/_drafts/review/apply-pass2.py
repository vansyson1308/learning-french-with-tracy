"""D-10 second AI-simulated native review of es-vi (es-vi-pass2.jsonl: 66 findings, 0 P0, 17 P1, 49 P2).
Every P1 is fixed (in content or by the new Spanish number speller in src/lib/languages/es.ts); P2s are
fixed where the fix stays inside the es lexicon and the story band and is clearly better. Each decision is
written to decisions-pass2.json. Speech items stay mirrored in the pack, checkpoints, placement and exam;
where displayed text changes, the clip transcript changes with it (an es audio run follows).
Run on a clean checkout of the content (it is not idempotent).
usage: python -I apply-pass2.py"""
import json, pathlib, re, sys
sys.stdout.reconfigure(encoding="utf-8")
R = pathlib.Path(r"C:\src\lft-air")
def load(rel): return json.loads((R / rel).read_text(encoding="utf-8"))
def save(rel, d): (R / rel).write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
def text_replace(rel, old, new, count=1):
    p = R / rel
    t = p.read_text(encoding="utf-8")
    assert t.count(old) == count, (rel, old, t.count(old))
    p.write_text(t.replace(old, new), encoding="utf-8", newline="\n")
dec = {}

PACK, SPEECH, CP, PL, EXAM = ("content/courses/es-vi.json", "content/es/speech/items.json", "content/es/assessment/checkpoints.json",
                              "content/es/assessment/placement.json", "content/es/exam/dele-a1.json")
SC, LS, ST, WT, RD, CC = ("content/es/interaction/scenarios.json", "content/es/reception/listening.json", "content/es/stories/stories.json",
                          "content/es/writing/tasks.json", "content/es/reception/reading.json", "content/es/pedagogy/concepts.json")
pack, sp, cp, pl, exam = load(PACK), load(SPEECH), load(CP), load(PL), load(EXAM)
sc, ls, st, wt, rd, cc = load(SC), load(LS), load(ST), load(WT), load(RD), load(CC)

def walk(o, fn):
    if isinstance(o, dict):
        fn(o)
        for v in o.values(): walk(v, fn)
    elif isinstance(o, list):
        for v in o: walk(v, fn)

ex = {e["id"]: e for s in pack["sections"] for u in s["units"] for l in u["lessons"] for e in l["exercises"]}
units = {u["id"]: u for s in pack["sections"] for u in s["units"]}
items = {i["id"]: i for i in sp["items"]}
clips = {c["id"]: c for c in ls["clips"]}
scen = {s["id"].split(".")[-1]: s for s in sc["scenarios"]}
stories = {s["id"].split(".")[-1]: s for s in st["stories"]}

# ---------------------------------------------------------------- speech items and their mirrors
def speech(item_id, add=(), concepts=None, instruction_vi=None, instruction_en=None, model_clip=None):
    item = items[item_id]
    for v in add:
        if v not in item["acceptedVariants"]:
            item["acceptedVariants"].append(v)
    if concepts is not None:
        item["requiredConcepts"] = concepts
    if instruction_vi is not None:
        item["prompt"]["instruction"]["vi"] = instruction_vi
    if instruction_en is not None:
        item["prompt"]["instruction"]["en"] = instruction_en
    if model_clip is not None:
        item["modelAudioRef"] = model_clip
    seen = []
    def mirror(o):
        if o.get("speechItemId") != item_id: return
        o["acceptedVariants"] = list(item["acceptedVariants"])
        if "requiredConcepts" in item: o["requiredConcepts"] = [list(s) for s in item["requiredConcepts"]]
        if instruction_vi is not None: o["instruction"] = instruction_vi
        if model_clip is not None: o["modelClipId"] = model_clip
        seen.append(o.get("id"))
    for doc in (pack, cp, pl, exam): walk(doc, mirror)
    return seen

# es-p2-1: a "Buenos días" model clip for the greeting item (it played "hola")
new_clip = {
    "id": "es.clip.uk_buenos_dias", "kind": "message", "segments": [{"speaker": "A", "text": "¡Buenos días!"}],
    "objectiveRefs": ["es.obj.speaking.formulaic"], "lexemeRefs": ["es:w:buenos-dias"], "sourceRef": "original-project",
    "authoringSpec": {"informationUnits": 1, "inferenceDemand": "locate"}, "scoredPlaybackPolicy": {"maxPlays": 2, "rate": 1},
}
at = next(i for i, c in enumerate(ls["clips"]) if c["id"] == "es.clip.uk_adios")
ls["clips"].insert(at + 1, new_clip)
seen = speech("es.speak.k_greet_morning", add=["Hola, buenos días, señora", "Hola, buenos días, señor"], model_clip="es.clip.uk_buenos_dias")
dec["es-p2-1"] = "fixed: new teaching clip es.clip.uk_buenos_dias (\"¡Buenos días!\", speaker A, declared like uk_adios) is the model of es.speak.k_greet_morning and es-vi:uk-l0-e2"
dec["es-p2-18"] = "fixed: \"Hola, buenos días, señora/señor\" accepted (speech item and es-vi:uk-l0-e2)"

# es-p2-2..5: the Spanish number speller (engine); variants only where a form is still missing
dec["es-p2-2"] = "fixed by the engine: Spanish rules now spell digits 0–100 and read euro amounts (\"16 €\", \"16 euros\" = \"dieciséis euros\"); digit variants would be duplicates after normalization"
dec["es-p2-3"] = "fixed by the engine: \"a las 10\" and \"a las 10:00\" now normalize to \"a las diez\""
speech("es.speak.a1cap_time", add=["Son las diez en punto"])
dec["es-p2-4"] = "fixed by the engine: (\"Son las 10\" / \"Son las 10:00\" = \"Son las diez\"); \"Son las diez en punto\" added to the speech item and es.cpi.cap.speak_time. No concept slots: [\"son las\"]+[\"diez\"] would also pass \"son las diez y media\" against a 10:00 cue"
speech("es.speak.a1cap_price", concepts=[["cuesta", "son", "es"], ["tres", "3"], ["euros", "euro"]])
dec["es-p2-5"] = "fixed: requiredConcepts as in its twins (m_price, cp4_price_five, pl4_price_seven) on the speech item and es.cpi.cap.speak_price; \"3 €\" / \"3 euros\" are read by the engine"
speech("es.speak.cp4_evening_pic", add=["Es por la noche"])
dec["es-p2-6"] = "fixed: \"Es por la noche\" accepted (speech item and es.cpi.s4.evening_pic)"
speech("es.speak.cp4_greet_restaurant", add=["Hola, buenas noches", "Hola, buenas noches, señor", "Hola, buenas noches, señora"],
       instruction_vi="Bạn bước vào nhà hàng lúc chín giờ tối. Hãy chào người phục vụ.",
       instruction_en="You walk into a restaurant at nine in the evening. Greet the waiter.")
dec["es-p2-7"] = "fixed: the \"Hola, …\" forms accepted, and the cue moved to nine in the evening (at 20:00 \"buenas tardes\" is still normal in Spain); speech item and es.cpi.s4.greet_restaurant"
speech("es.speak.l_like_coffee", add=["Me gusta mucho el café", "Me encanta el café"])
dec["es-p2-19"] = "fixed: \"Me gusta mucho el café\", \"Me encanta el café\" accepted (speech item and es-vi:ul-l2-e0)"
speech("es.speak.l_work_morning", add=["Trabajo por las mañanas", "Yo trabajo por las mañanas"])
speech("es.speak.cp4_work_evening", add=["Trabajo por las noches", "Yo trabajo por las noches"])
dec["es-p2-20"] = "fixed: habitual \"por las mañanas\" / \"por las noches\" accepted (l_work_morning + es-vi:ul-l2-e1, cp4_work_evening + es.cpi.s4.work_evening)"
speech("es.speak.n_station", add=["Esta es la estación", "Es la estación de tren"],
       instruction_vi="Bạn đến một tòa nhà lớn, nơi có nhiều chuyến tàu đến và đi. Hãy nói đây là nơi nào.")
dec["es-p2-21"] = "fixed: \"Esta es la estación\", \"Es la estación de tren\" accepted (speech item and es-vi:un-l1-e0)"
dec["es-p2-61"] = "fixed: instruction reworded in the speech item and es-vi:un-l1-e0"
speech("es.speak.n_morning", add=["Es de día"])
dec["es-p2-22"] = "fixed: \"Es de día\" accepted (parallels \"Es de noche\"); target kept; \"Es de mañana\" not added (it means \"early\", not the Peninsular way to name the time of day)"
dec["es-p2-23"] = "fixed by the engine: \"5 €\" is read as \"cinco euros\" before matching, so the euro slot already matches; no \"€\" form needed"
speech("es.speak.cp4_leave_shop", add=["Gracias, hasta luego", "Adiós, gracias", "Hasta luego, gracias"])
dec["es-p2-24"] = "fixed: three \"gracias\" farewells accepted (speech item and es.cpi.s4.leave_shop)"
speech("es.speak.pl4_farewell_bus", instruction_vi="Xe buýt của người bạn sắp chạy và bạn ấy vẫy tay chào bạn. Hãy chào tạm biệt.")
dec["es-p2-60"] = "fixed: instruction reworded in the speech item and es.pli.s4.farewell_bus"

# ---------------------------------------------------------------- pack exercises
def alts(eid, extra):
    e = ex["es-vi:" + eid]
    e.setdefault("alternatives", [])
    for a in extra:
        if a not in e["alternatives"]: e["alternatives"].append(a)
    return e
alts("u3-l0-e10", ["Mi abuela es una buena persona.", "Mi abuela es buena persona.", "Mi abuela es una persona buena."])
dec["es-p2-10"] = "fixed: the three \"persona\" renderings accepted"
alts("uo-l0-e0", [["Soy", "Lucía"]])
dec["es-p2-11"] = "fixed: word-bank alternative \"Soy Lucía\""
alts("ur-l3-e1", [["soy", "Minh", "y", "vivo", "en", "Madrid"]])
dec["es-p2-12"] = "fixed: word-bank alternative \"soy Minh y vivo en Madrid\""
alts("us-l0-e1", [["bien", "gracias"]])
dec["es-p2-13"] = "fixed: word-bank alternative \"bien, gracias\""
e = ex["es-vi:up-l1-e1"]; e["tokens"].insert(2, "gustan")
alts("up-l1-e1", [["Me", "gustan", "el", "té", "y", "el", "pan"]])
dec["es-p2-43"] = "fixed: tile \"gustan\" added and \"Me gustan el té y el pan\" accepted, matching the writing model"
e = ex["es-vi:u2-l2-e10"]
assert e["answer"] == "¿El menú, por favor?"
e["answer"] = "La carta, por favor."; e["audioTarget"] = "La carta, por favor."
e["alternatives"] = ["¿La carta, por favor?", "Por favor, la carta.", "¿El menú, por favor?", "Por favor, el menú."]
e["prompt"] = "Cho tôi xem thực đơn được không?"
dec["es-p2-44"] = "fixed: model answer \"La carta, por favor.\" (as the unit-3 guidebook teaches); the menú forms stay accepted"
dec["es-p2-58"] = "fixed: prompt \"Cho tôi xem thực đơn được không?\""
e = ex["es-vi:u4-l3-e7"]; assert e["prompt"] == "Con phố rộng."; e["prompt"] = "Con phố lớn."
dec["es-p2-45"] = "fixed: prompt \"Con phố lớn.\" (ancha is not in the es lexicon)"
alts("u1-l0-e10", ["Quiero un café, por favor.", "Quiero un café."])
dec["es-p2-46"] = "fixed: \"Quiero un café (, por favor).\" accepted"
alts("u2-l0-e6", [["Tôi", "muốn", "uống", "một", "cà", "phê"], ["Tôi", "muốn", "uống", "cà", "phê"]])
dec["es-p2-47"] = "fixed: \"Tôi muốn uống (một) cà phê\" accepted; the answer keeps the tiles it has (no \"ly\" tile added)"
alts("us-l1-e4", ["Hasta pronto.", "Nos vemos."])
dec["es-p2-48"] = "fixed: \"Hasta pronto.\", \"Nos vemos.\" accepted, as in es.speak.k_bye"
e = ex["es-vi:u1-l0-e6"]
assert e["answer"] == ["Xin", "chào", "chào", "buổi", "sáng"]
e["tokens"] = ["vui", "buổi", "Chúc", "sáng", "Chào", "Xin", "biệt"]
e["answer"] = ["Chào", "buổi", "sáng"]
dec["es-p2-59"] = "fixed: answer \"Chào buổi sáng\"; the duplicate \"chào\" tile removed, \"Xin\" stays as a distractor"

# es-p2-57: "Cho một X, làm ơn" calques (prompts and the unit-3 guidebook example)
vi_orders = {"Cho một cà phê, làm ơn.": "Làm ơn cho tôi một ly cà phê.",
             "Cho một trà, làm ơn.": "Làm ơn cho tôi một tách trà.",
             "Cho một bia, làm ơn.": "Làm ơn cho tôi một cốc bia."}
hits = []
def reorder(o):
    for k, v in list(o.items()):
        if isinstance(v, str):
            for old, new in vi_orders.items():
                if old in v:
                    o[k] = o[k].replace(old, new); hits.append(o.get("id", k))
walk(pack, reorder)
dec["es-p2-57"] = ("fixed: \"Làm ơn cho tôi một ly cà phê / một tách trà / một cốc bia.\" in " + ", ".join(sorted(set(map(str, hits))))
                   + " — \"làm ơn\" kept sentence-initially so the items still cue por favor")

# es-p2-15: la mañana is "buổi sáng"; tomorrow is the adverb without article
n = 0
def gloss(o):
    global n
    for k, v in list(o.items()):
        if v == "buổi sáng / ngày mai":
            o[k] = "buổi sáng"; n += 1
walk(pack, gloss)
text_replace("content/es/lexicon/lexemes.json", '"vi": "buổi sáng / ngày mai"', '"vi": "buổi sáng"')
dec["es-p2-15"] = f"fixed: es:w:manana (id kept) glossed \"buổi sáng\" in lexemes.json; the {n} pack copies (unit word lists, uf-l0-e5, uf-l1-e2, uf-l2-e5, uf-l3-e3) follow; the adverb is explained in the unit-f guidebook (es-p2-16)"

# guidebooks
def guide(uid, old, new):
    u = units["es-vi:" + uid]
    assert u["guidebook"].count(old) == 1, (uid, old)
    u["guidebook"] = u["guidebook"].replace(old, new)
guide("unit-f", "*La mañana* là buổi sáng, *la noche* là buổi tối. Hai từ này cũng xuất hiện trong lời chào bạn đã học: *buenos días, buenas noches*.",
      "*La mañana* là buổi sáng, *la noche* là buổi tối. *Noche* có trong lời chào *buenas noches*; còn buổi sáng thì người ta chào *buenos días* (không dùng *mañana*). Không có mạo từ, *mañana* nghĩa là \"ngày mai\".")
dec["es-p2-16"] = "fixed: as proposed"
guide("unit-k", "- *Muchas gracias.* *De nada.*", "- *Muchas gracias.* *Por favor.*")
dec["es-p2-52"] = "fixed: as proposed"
guide("unit-p", "3. Danh từ có mạo từ chưa? (*el té, la leche*)",
      "3. Sau *me gusta* danh từ có mạo từ chưa? (*me gusta el té*). Sau *bebo, como* thì có thể không cần: *Bebo leche.*")
dec["es-p2-53"] = "fixed: as proposed"
guide("unit-i", "Bạn có thể nghe lại bao nhiêu lần cũng được.",
      "Khi luyện tập, bạn có thể nghe lại nhiều lần; trong bài kiểm tra, mỗi đoạn chỉ được nghe hai lần.")
dec["es-p2-54"] = "fixed: lesson playback is uncapped (exercise-renderer passes maxPlays null when not scored); checkpoints and the exam cap at the clip's maxPlays 2 — the tip now says both"
dec["es-p2-51"] = "fixed by the engine: the Spanish speller makes the sentence true for every number item; sentence kept"

# es-p2-50 (reviewer-flagged uncertain): ser for an appointment
e = ex["es-vi:uq-l0-e3"]
assert e["sentence"] == "Hola, Ana: el café es a las ___." and e["audioTarget"] == "Hola, Ana: tomamos un café a las dos."
e["sentence"] = "Hola, Ana: tomamos un café a las ___."
dec["es-p2-50"] = ("uncertain: \"El café es a las dos\" is grammatical (ser + event) and quedar is only taught in unit v, after unit q; "
                   "kept in uq-l0-e0/e2 and cp5_note_ana for a native decision. uq-l0-e3's sentence now reads \"tomamos un café a las ___\", "
                   "which is what its audio already says")

# dictation digit policy
def anden(o):
    if o.get("id") == "es-cpx-s3-ann_dictado_anden":
        o["alternatives"] = ["andén 4", "el andén cuatro", "el andén 4"]
walk(cp, anden)
dec["es-p2-49"] = "fixed: one policy — dictation accepts the digit as in uh-l3-e3; es.cpi.s3.ann_dictado_anden accepts \"andén 4\" (and the article forms)"

# ---------------------------------------------------------------- writing
def fix_model(o):
    if isinstance(o.get("modelAnswers"), list):
        o["modelAnswers"] = [m.replace("¿Quieres venir a cenar a mi casa el sábado a las nueve?",
                                       "¿Quieres venir a mi casa el sábado a las seis de la tarde?") for m in o["modelAnswers"]]
for doc in (wt, exam): walk(doc, fix_model)
assert "a las seis de la tarde" in json.dumps(wt, ensure_ascii=False) and "a las seis de la tarde" in json.dumps(exam, ensure_ascii=False)
dec["es-p2-14"] = "fixed: in es.write.dele_b_correo and its exam copy es-exx-dele_a1-b_w2_01: \"el sábado a las seis de la tarde\", matching the cue"

# writing slots: digit variants that the speller now makes duplicates of the word form
UNITS_ = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"]
TEENS_ = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"]
TW_ = ["veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"]
TENS_ = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"]
def es_num(v):
    if v == 100: return "cien"
    if v < 10: return UNITS_[v]
    if v < 20: return TEENS_[v - 10]
    if v < 30: return TW_[v - 20]
    return TENS_[v // 10] + ("" if v % 10 == 0 else " y " + UNITS_[v % 10])
def spelt(text):
    t = re.sub(r"\b(\d{1,2}):00\b", r"\1", text.lower())
    return re.sub(r"\b\d{1,3}\b", lambda m: es_num(int(m.group())) if int(m.group()) <= 100 else m.group(), t)
dropped = []
def dedupe(o):
    if not isinstance(o.get("requiredSlots"), list): return
    for slot in o["requiredSlots"]:
        vs = slot.get("variants", [])
        words = {v.lower() for v in vs if not re.search(r"\d", v)}
        keep = [v for v in vs if not (re.search(r"\d", v) and spelt(v) in words)]
        if keep != vs:
            dropped.extend(v for v in vs if v not in keep); slot["variants"] = keep
for doc in (wt, pack, exam, cp, pl): walk(doc, dedupe)
print("writing digit variants dropped:", len(dropped), sorted(set(dropped)))

# ---------------------------------------------------------------- scenarios and their clips
def node(sid, nid): return scen[sid]["nodes"][nid]
def intent(sid, nid, name): return next(x for x in node(sid, nid)["expected"] if x["intent"] == name)
for sid in ("tienda_compras", "cp_panaderia"):
    for nid in ("l_more", "l_more_b"):
        x = intent(sid, nid, "thats_all")
        x["acceptedVariants"].append("No, gracias.")
        x["requiredConcepts"][0].append("no gracias")
dec["es-p2-8"] = "fixed: \"No, gracias.\" accepted and \"no gracias\" added to the concept slot (l_more, l_more_b)"
dec["es-p2-9"] = "fixed: as es-p2-8, in cp_panaderia (l_more, l_more_b)"
for nid in ("l_question", "l_question_b"):
    x = intent("cp_boleto", nid, "ask_time")
    x["acceptedVariants"].append("¿Cuándo sale el tren?")
    x["requiredConcepts"] = [["hora", "cuándo", "cuando"]]
dec["es-p2-25"] = "fixed: \"¿Cuándo sale el tren?\" accepted; concept slot hora/cuándo/cuando"
for nid in ("l_english", "l_english_b"):
    x = intent("cp_conocerse", nid, "yes_speak")
    x["acceptedVariants"].append("Un poco.")
    x["requiredConcepts"][0].append("un poco")
dec["es-p2-26"] = "fixed: \"Un poco.\" accepted (variant and concept form)"
for sid in ("una_cita", "a1cap_telefono"):
    for nid in ("l_place", "l_place_b"):
        for x in node(sid, nid)["expected"]:
            x["requiredConcepts"] = [["café", "cafe", "cafetería", "cafeteria"]]
dec["es-p2-27"] = "fixed: cafetería/cafeteria added to the place slot in una_cita and a1cap_telefono (l_place, l_place_b)"
for nid in ("l_ask_back", "l_ask_back_b"):
    p = node("cp_conocerse", nid)["prompt"]
    assert p["vi"] == "Giờ hãy hỏi ANH ẤY: còn ông, ông sống ở đâu?"
    p["vi"] = "Giờ hãy hỏi ANH ẤY: còn anh, anh sống ở đâu?"
dec["es-p2-62"] = "fixed: as proposed"

def clip_text(cid, old, new):
    seg = clips[cid]["segments"]
    assert len(seg) == 1 and seg[0]["text"] == old, (cid, seg)
    seg[0]["text"] = new
# es-p2-28: the _s clip backs p_more.rephraseText and r_more.text; one line for both, audio follows
clip_text("es.clip.ix_cp_panaderia_more_s", "¿Otra cosa?", "¿Quiere algo más?")
node("cp_panaderia", "p_more")["rephraseText"] = "¿Quiere algo más?"
node("cp_panaderia", "r_more")["text"] = "¿Quiere algo más?"
dec["es-p2-28"] = "fixed: clip es.clip.ix_cp_panaderia_more_s, p_more.rephraseText and r_more.text all read \"¿Quiere algo más?\" (as tienda_compras); audio re-renders"
for sid in ("dele_a_conversacion", "dele_b_conversacion"):
    clip_text(f"es.clip.ix_{sid}_thanks_s", "Terminamos. Gracias.", "Hemos terminado. Muchas gracias.")
    p = node(sid, "p_thanks"); assert p["rephraseText"] == "Terminamos. Gracias."
    p["rephraseText"] = "Hemos terminado. Muchas gracias."
    assert node(sid, "r_thanks")["text"] == "Hemos terminado. Muchas gracias."
dec["es-p2-29"] = "fixed: both _thanks_s clips and both p_thanks.rephraseText read \"Hemos terminado. Muchas gracias.\", like r_thanks; audio re-renders"
t = node("cp_conocer", "t_ok"); assert t["text"] == "¡Buen día!"; t["text"] = "¡Que tenga un buen día!"
clip_text(t["clipId"], "¡Buen día!", "¡Que tenga un buen día!")
t = node("tienda_compras", "t_want_agua"); old = t["text"]; t["text"] = old.replace("¡Gracias, buen día!", "¡Gracias, que tenga un buen día!")
clip_text(t["clipId"], old, t["text"])
for nid in ("l_bye", "l_bye_b"):
    x = intent("a1cap_vecina", nid, "goodday")
    x["acceptedVariants"] = ["¡Que tenga un buen día!"] + [v for v in x["acceptedVariants"] if v != "¡Que tenga un buen día!"]
dec["es-p2-30"] = "fixed: cp_conocer t_ok and tienda_compras t_want_agua (text and clip) say \"que tenga un buen día\"; a1cap_vecina lists it first and still accepts \"¡Buen día!\""
seg = clips["es.clip.dele_a_l1_01"]["segments"][0]; assert seg["text"] == "Perdone, ¿qué desea tomar?"; seg["text"] = "Hola, ¿qué desea tomar?"
dec["es-p2-31"] = "fixed: clip transcript \"Hola, ¿qué desea tomar?\" (audio re-renders)"

# ---------------------------------------------------------------- stories
def sent(sid, i, old):
    x = stories[sid]["sentences"][i]
    assert x["text"] == old, (sid, i, x["text"])
    return x
dec["es-p2-17"] = "not applied: needs mojado/mojada (not in the es lexicon); same decision as es-lg-67"
dec["es-p2-32"] = "not applied: needs deberes (not in the es lexicon); tarea stays in the story and in ub-l2-e4, as es-lg-75/76"
sent("el_barco_del_abuelo", 14, "No, Rosa. Soy un abuelo.")
dec["es-p2-33"] = ("not applied: mayor is beyond the A1-1 band of this story; declared as a new word it drops the story to 94.9 % known "
                   "(validator floor 95 %) — same outcome as es-lg-63")
sent("un_dia_de_lluvia", 21, "Hay sol en la calle.")["text"] = "En la calle hace sol."
sent("un_viaje_a_la_isla", 16, "En la playa hay sol.")["text"] = "En la playa hace sol."
dec["es-p2-34"] = "fixed: \"En la calle hace sol.\" and \"En la playa hace sol.\"; \"ya no hay lluvia\" stays — \"ya no llueve\" needs llover, not in the es lexicon (as es-lg-68)"
sent("el_cumpleanos_de_mama", 8, "Hay uno rojo y uno blanco.")["text"] = "Hay uno rojo y otro blanco."
dec["es-p2-35"] = "fixed: as proposed"
sent("la_panaderia_del_senor_ramon", 9, "En la calle, Sofía encuentra a su amigo Diego.")["text"] = "En la calle, Sofía se encuentra con su amigo Diego."
dec["es-p2-36"] = "fixed: as proposed"
sent("el_perro_de_ana", 15, "El perro escucha a Ana y corre hacia ella.")["text"] = "El perro oye a Ana y corre hacia ella."
dec["es-p2-37"] = "fixed: as proposed"
dec["es-p2-38"] = "not applied: needs chocar (or caer for \"se cae\"); neither is in the es lexicon (as es-lg-70)"
sent("el_mercado_del_domingo", 15, "El perro baila con música.")["text"] = "El perro baila con la música."
sent("el_mercado_del_domingo", 18, "El hombre pide dinero en una caja.")["text"] = "El hombre pide dinero con una caja."
dec["es-p2-39"] = "fixed: as proposed"
x = sent("el_tren_de_la_noche", 11, "Yo voy a ver a mi hija. Tiene un bebé nuevo.")
x["text"] = "Yo voy a ver a mi hija. Tiene un bebé de una semana."; x["translation"]["en"] = "I'm going to see my daughter. She has a one-week-old baby."
dec["es-p2-40"] = "fixed: within the lexicon, \"Tiene un bebé de una semana.\" (acabar is not in the es lexicon); the vi \"vừa sinh em bé\" fits"
dec["es-p2-41"] = "not applied: needs acordarse (not in the es lexicon); \"¿no recuerdas?\" is correct, if formal"
n = 0
for s in st["stories"]:
    for x in s["sentences"]:
        new = re.sub(r"(?<!\bse )\b(ríe|ríen)\b", r"se \1", x["text"])
        if new != x["text"]:
            x["text"] = new; n += 1
dec["es-p2-42"] = f"fixed: \"se ríe / se ríen\" in all {n} remaining sentences"
x = sent("carlos_esta_enfermo", 0, "Carlos tiene un problema."); assert x["translation"]["vi"] == "Carlos gặp một chuyện."
x["translation"]["vi"] = "Carlos đang gặp chuyện."
dec["es-p2-65"] = "fixed: as proposed"
dec["es-p2-66"] = "uncertain: \"súp gà có gạo\" names raw rice and \"súp gà với cơm\" suggests a side bowl; a native vi reviewer should pick (e.g. \"súp gà nấu với cơm\")"

# ---------------------------------------------------------------- reading, exam option, concepts
def glossary(rid, surface, vi):
    r = next(r for r in rd["readings"] if r["id"] == rid)
    g = next(g for g in r["supportGlossary"] if g["surface"] == surface)
    g["gloss"]["vi"] = vi
glossary("es.read.dele_a_r2_avisos", "económico", "rẻ, giá phải chăng")
dec["es-p2-63"] = "fixed: as proposed"
glossary("es.read.dele_b_r1_correo", "terraza", "ban công lớn / sân hiên")
n = 0
def option(o):
    global n
    if o.get("text") == "Một sân thượng nhìn ra công viên":
        o["text"] = "Một ban công lớn nhìn ra công viên"; n += 1
walk(exam, option)
assert n == 1
dec["es-p2-64"] = "fixed: glossary and exam option b_r1_04 (\"Một ban công lớn nhìn ra công viên\")"
def concept(cid): return next(c for c in cc["concepts"] if c["id"] == cid)
c = concept("es:concept:core-irregulars"); assert c["explanation"]["vi"].count("voy, vas, va, vamos, van") == 1
c["explanation"]["vi"] = c["explanation"]["vi"].replace("voy, vas, va, vamos, van", "voy, vas, va, vamos, vais, van")
c = concept("es:concept:ir-a-future"); assert c["shortRule"]["vi"].count("voy / vas / va / vamos / van") == 1
c["shortRule"]["vi"] = c["shortRule"]["vi"].replace("voy / vas / va / vamos / van", "voy / vas / va / vamos / vais / van")
dec["es-p2-55"] = "fixed: vi texts (the en fields serve es-en and are left as they are)"
c = concept("es:concept:sounds-r-j-ll"); assert c["explanation"]["vi"].count("(jugo, gente)") == 1
c["explanation"]["vi"] = c["explanation"]["vi"].replace("(jugo, gente)", "(jamón, gente)")
dec["es-p2-56"] = "fixed: vi text, as in the unit-f guidebook"

for rel, doc in ((PACK, pack), (SPEECH, sp), (CP, cp), (PL, pl), (EXAM, exam), (SC, sc), (LS, ls), (ST, st), (WT, wt), (RD, rd), (CC, cc)):
    save(rel, doc)

ids = [json.loads(l)["id"] for l in (R / "content/es/_drafts/review/es-vi-pass2.jsonl").read_text(encoding="utf-8").splitlines() if l.strip()]
missing = [i for i in ids if i not in dec]; extra = [k for k in dec if k not in ids]
assert not missing and not extra, (missing, extra)
ordered = {i: dec[i] for i in ids}
(R / "content/es/_drafts/review/decisions-pass2.json").write_text(json.dumps(ordered, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
kinds = {}
for v in ordered.values():
    k = next(p for p in ("fixed by the engine: ", "fixed: ", "kept: ", "not applied: ", "uncertain: ") if v.startswith(p)).rstrip(": ")
    kinds[k] = kinds.get(k, 0) + 1
print(json.dumps(kinds, ensure_ascii=False))

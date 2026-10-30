"""it-vi assessment: 7 checkpoints + placement, with their reserved inputs (clips, readings, speech items,
writing tasks, scenarios). Appends the reserved inputs to the listening / readings / speech / writing /
scenarios OUTPUT files (run after the section generators) and writes checkpoints + placement OUTPUT.
usage: python -I it-assessment.py <repo root>"""
import json, os, sys

ROOT = sys.argv[1] + "/content/it"
D = os.path.join(ROOT, "_drafts")
LEX = json.load(open(os.path.join(ROOT, "lexicon", "lexemes.json"), encoding="utf-8"))["lexemes"]
SURF = {l["surface"]: l["id"] for l in LEX}


def lx(*surfaces):
    return [SURF[s] for s in surfaces if s in SURF]


def O(k):
    return f"it.obj.{k}"


pos = [0]


def place(correct, wrong):
    p = pos[0] % 4
    pos[0] += 1
    o = list(wrong[:3])
    o.insert(p, correct)
    return o, p


clips, readings, speech, tasks, scenarios = [], [], [], [], []


def clip(cid, kind, segs, obj, lex=(), units=1, demand="locate"):
    clips.append({"id": cid, "kind": kind, "segments": [{"speaker": s, "text": t} for s, t in segs], "objectiveRefs": [obj], "lexemeRefs": lx(*lex),
                  "sourceRef": "original-project", "authoringSpec": {"informationUnits": units, "inferenceDemand": demand}, "scoredPlaybackPolicy": {"maxPlays": 2, "rate": 1}})
    return cid


def reading(rid, kind, paras, obj, lex=(), gloss=(), units=3, title=None):
    r = {"id": rid, "kind": kind}
    if title:
        r["title"] = title
    r.update({"blocks": [{"kind": "paragraph", "text": p} for p in paras], "objectiveRefs": [obj], "lexemeRefs": lx(*lex),
              "supportGlossary": [{"surface": a, "gloss": {"vi": b, "en": b}} for a, b in gloss], "sourceRef": "original-project",
              "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"}})
    readings.append(r)
    return rid


def sel(prompt, correct, wrong, mode, audio=False):
    o, p = place(correct, wrong)
    e = {"type": "select", "mode": mode, "prompt": prompt, "options": [{"text": t} for t in o], "correct": p}
    if audio:
        e["audioTarget"] = prompt
    return e


def lc(cid, q, correct, wrong):
    o, p = place(correct, wrong)
    return {"type": "listeningComprehension", "clipId": cid, "question": q, "options": [{"text": t} for t in o], "correct": p}


def rc(rid, q, correct, wrong):
    o, p = place(correct, wrong)
    return {"type": "readingComprehension", "readingId": rid, "question": q, "options": [{"text": t} for t in o], "correct": p}


def dict_(cid, answer, alts):
    return {"type": "dictation", "clipId": cid, "answer": answer, "alternatives": alts}


ARTS = ["il", "lo", "la", "l'"]


def art(noun, gloss, correct):
    return {"type": "articleSelect", "articles": ARTS, "noun": noun, "gloss": gloss, "correct": ARTS.index(correct)}


def fill(sent, ans, wrong, vi):
    o = [ans] + wrong
    o = o[pos[0] % len(o):] + o[:pos[0] % len(o)]
    pos[0] += 1
    return {"type": "fillBlank", "sentence": sent, "translation": vi, "options": o, "correct": o.index(ans)}


def conj(sent, vi, verb, cell, ans):
    return {"type": "conjugationCloze", "sentence": sent, "translation": vi, "verb": verb, "cell": cell, "answer": ans, "alternatives": []}


def typ(prompt, ans, alts=()):
    return {"type": "typeAnswer", "mode": "produceTarget", "prompt": prompt, "answer": ans, "alternatives": list(alts)}


FAM = {"formulaic": ("formulaic_exchange", "situation_prompt"), "self_intro": ("self_introduction", "information_prompt"),
       "give_info": ("information_giving", "information_prompt"), "describe": ("description", "picture_prompt")}


def speak(sid, obj, instr, target, variants, cue=None, emoji=None, lex=(), concepts=None):
    fam, el = FAM[obj]
    prompt = {"instruction": {"vi": instr, "en": instr}}
    if cue:
        prompt["cueFacts"] = [{"label": {"vi": a, "en": a}, "value": b} for a, b in cue]
    if emoji:
        prompt["cueEmoji"] = emoji
    it = {"id": sid, "taskFamily": fam, "elicitationType": el, "prompt": prompt, "target": target, "acceptedVariants": variants,
          "objectiveRefs": [O("speaking." + obj)], "lexemeRefs": lx(*lex), "evidenceLexemeRefs": [],
          "assistancePolicy": {"allowContextualBias": False, "revealTargetAfterAttempts": None}, "scoredEligibility": True, "modelAudioRef": None,
          "recognitionLocale": "it-IT", "allowedAttempts": 2, "reserved": True, "sourceRef": "original-project"}
    if concepts:
        it["requiredConcepts"] = concepts
    speech.append(it)
    e = {"type": "speakProduction", "speechItemId": sid, "instruction": instr}
    if cue:
        e["cueFacts"] = [{"label": a, "value": b} for a, b in cue]
    if emoji:
        e["cueEmoji"] = emoji
    e.update({"target": target, "acceptedVariants": variants})
    if concepts:
        e["requiredConcepts"] = concepts
    e.update({"evidenceLexemeRefs": [], "revealTargetAfterAttempts": None, "allowContextualBias": False, "modelClipId": None, "allowedAttempts": 2})
    return e, O("speaking." + obj)


GREET = ["ciao", "salve", "caro", "cara", "buongiorno", "buonasera"]
CLOSE = ["a presto", "a domani", "un abbraccio", "ci vediamo", "a venerdì"]
WOBJ = {"personal_profile": "personal_info", "simple_description": "phrases_sentences", "short_message": "short_message", "simple_form": "form_filling"}


def write(tid, fam, instr, cue, slots, mn, mx, model, lex=(), verbs=None, fields=None, obj=None):
    rubric = {"requiredSlots": [{"id": i, "description": {"vi": d, "en": d}, "variants": v, "cueProvided": c} for i, d, v, c in slots], "minTokens": mn, "maxTokens": mx}
    if verbs:
        rubric["requireSentenceVerbs"] = verbs
    objective = O("writing." + (obj or WOBJ[fam]))
    t = {"id": tid, "taskFamily": fam, "mode": "guided", "instruction": {"vi": instr, "en": instr}}
    if cue:
        t["cueFacts"] = [{"label": {"vi": a, "en": a}, "value": b} for a, b in cue]
    if fields:
        t["formFields"] = [{"id": a, "label": b, "slotId": c} for a, b, c in fields]
    t.update({"rubric": rubric, "modelAnswers": [model], "objectiveRefs": [objective], "lexemeRefs": lx(*lex), "scoredEligibility": True, "reserved": True, "sourceRef": "original-project"})
    tasks.append(t)
    flat = {**rubric, "requiredSlots": [{**s, "description": s["description"]["vi"]} for s in rubric["requiredSlots"]]}
    e = {"type": "simpleForm" if fields else "guidedWriting", "writingTaskId": tid}
    if not fields:
        e["writingMode"] = "guided"
    e["instruction"] = instr
    if cue:
        e["cueFacts"] = [{"label": a, "value": b} for a, b in cue]
    if fields:
        e["fields"] = [{"id": a, "label": b, "slotId": c} for a, b, c in fields]
    e.update({"rubric": flat, "modelAnswers": [model]})
    return e, objective


def scenario(sid, fam, obj, title, goal, steps, end, miss):
    base = f"it.clip.ix_{sid}"
    nodes = {}
    clip(f"{base}_miss", "message", [("A", miss)], obj)
    nodes["t_miss"] = {"kind": "terminal", "id": "t_miss", "outcome": "goal_not_met", "text": miss, "clipId": f"{base}_miss"}
    for i, (p, rp, prompt, intent, variants, concepts) in enumerate(steps):
        nxt = f"p{i+1}" if i + 1 < len(steps) else "t_ok"
        clip(f"{base}_{i}", "message", [("A", p)], obj)
        clip(f"{base}_{i}_s", "message", [("A", rp)], obj)
        nodes[f"p{i}"] = {"kind": "partner", "id": f"p{i}", "text": p, "clipId": f"{base}_{i}", "rephraseText": rp, "rephraseClipId": f"{base}_{i}_s", "next": f"l{i}"}
        exp = [{"intent": intent, "acceptedVariants": variants, "requiredConcepts": concepts, "next": nxt}]
        nodes[f"l{i}"] = {"kind": "learner", "id": f"l{i}", "prompt": {"vi": prompt, "en": prompt}, "expected": exp, "noMatchNext": f"r{i}", "scored": True}
        nodes[f"r{i}"] = {"kind": "partner", "id": f"r{i}", "text": rp, "clipId": f"{base}_{i}_s", "next": f"l{i}b"}
        nodes[f"l{i}b"] = {"kind": "learner", "id": f"l{i}b", "prompt": {"vi": prompt, "en": prompt}, "expected": exp, "noMatchNext": "t_miss", "scored": False}
    clip(f"{base}_end", "message", [("A", end)], obj)
    nodes["t_ok"] = {"kind": "terminal", "id": "t_ok", "outcome": "goal_met", "text": end, "clipId": f"{base}_end"}
    scenarios.append({"id": f"it.scenario.{sid}", "title": {"vi": title, "en": title}, "goal": {"vi": goal, "en": goal}, "taskFamily": fam, "objectiveRefs": [obj],
                      "startNodeId": "p0", "nodes": nodes, "support": {"allowRepeat": True, "allowRephrase": True}, "reserved": True, "sourceRef": "original-project"})
    return {"type": "interactionScenario", "scenarioId": f"it.scenario.{sid}"}, obj


CONV, PRAC = O("interaction.everyday_conversation"), O("interaction.practical_needs")


def items(prefix, rows, essential_of=lambda o: True):
    out = []
    for slug, (ex, objs) in rows:
        ex = dict(ex)
        ex["id"] = f"it-cpx-{prefix}-{slug}"
        objs = objs if isinstance(objs, list) else [objs]
        out.append({"id": f"it.cpi.{prefix}.{slug}", "itemVersion": 1, "exercise": ex, "objectiveTargets": objs, "essential": essential_of(objs[0])})
    return out


NONESS = {O("vocab.places_travel"), O("speaking.describe"), O("writing.form_filling"), O("articles.plurals"), O("articles.indefinite_elision"),
          O("spelling.accents_apostrophe"), O("strategy.cognates_false_friends"), O("syntax.negation_questions")}
ess = lambda o: o not in NONESS
G, EV, RD, PL = O("greetings.basic"), O("vocab.everyday_basics"), O("reading.familiar_words"), O("vocab.places_travel")
s1 = items("s1", [
 ("greet_evening", (sel("Bạn đến nhà hàng lúc tám giờ tối. Bạn nói gì?", "Buonasera!", ["Buongiorno!", "Arrivederci!", "Grazie!"], "nativeToTarget"), G)),
 ("greet_leave", (sel("Bạn rời khỏi một cửa hàng. Bạn nói gì?", "Arrivederci!", ["Buongiorno!", "Ciao!", "Prego!"], "nativeToTarget"), G)),
 ("greet_sorry", (sel("Bạn giẫm vào chân một người lạ trên tàu. Bạn nói:", "Scusi!", ["Grazie!", "Benvenuto!", "Buonanotte!"], "nativeToTarget"), G)),
 ("vocab_cheese", (sel("phô mai", "il formaggio", ["il pane", "il latte", "l'uovo"], "nativeToTarget"), EV)),
 ("vocab_daughter", (sel("la figlia", "con gái", ["con trai", "người mẹ", "chị gái"], "targetToNative", True), EV)),
 ("vocab_juice", (sel("nước ép", "il succo", ["il tè", "l'acqua", "lo zucchero"], "nativeToTarget"), EV)),
 ("read_boy", (sel("Il ragazzo beve il latte.", "Cậu bé uống sữa.", ["Cô gái uống sữa.", "Cậu bé ăn bánh mì.", "Cậu bé uống nước."], "targetToNative"), RD)),
 ("read_cat", (sel("Il gatto mangia il pesce.", "Con mèo ăn cá.", ["Con chó ăn cá.", "Con mèo uống sữa.", "Con mèo ăn bánh."], "targetToNative"), RD)),
 ("read_family", (sel("La mia famiglia è grande.", "Gia đình tôi đông người.", ["Gia đình tôi nhỏ.", "Bạn tôi cao.", "Nhà tôi lớn."], "targetToNative"), RD)),
 ("place_airport", (sel("sân bay", "l'aeroporto", ["la stazione", "l'albergo", "il museo"], "nativeToTarget"), PL)),
 ("place_ticket", (sel("il biglietto", "tấm vé", ["tấm bản đồ", "chiếc xe đạp", "con đường"], "targetToNative", True), PL)),
 ("place_bus", (sel("L'autobus va in città.", "Xe buýt đi vào thành phố.", ["Tàu đi vào thành phố.", "Xe buýt ở nhà ga.", "Xe hơi đi ra sân bay."], "targetToNative"), PL)),
], ess)
AR, ELI, SH, RP, NU, SP, COG, WF = O("articles.definite"), O("articles.indefinite_elision"), O("verbs.essere_avere_present"), O("verbs.regular_present"), O("numbers.0_100"), O("spelling.accents_apostrophe"), O("strategy.cognates_false_friends"), O("writing.familiar_words")
s2 = items("s2", [
 ("essere_noi", (conj("Noi ___ a Roma.", "Chúng tôi ở Roma.", "essere", "pre:1p", "siamo"), [SH, WF])),
 ("essere_tu", (conj("Tu ___ molto gentile.", "Bạn rất tử tế.", "essere", "pre:2s", "sei"), [SH, WF])),
 ("avere_io", (conj("Io ___ un fratello.", "Tôi có một anh trai.", "avere", "pre:1s", "ho"), [SH, WF])),
 ("abitare_lui", (conj("Lui ___ a Torino.", "Anh ấy sống ở Torino.", "abitare", "pre:3s", "abita"), [RP, WF])),
 ("parlare_voi", (conj("Voi ___ italiano.", "Các bạn nói tiếng Ý.", "parlare", "pre:2p", "parlate"), [RP, WF])),
 ("capire_tu", (conj("Tu ___ tutto.", "Bạn hiểu hết.", "capire", "pre:2s", "capisci"), [RP, WF])),
 ("art_window", (art("finestra", "cửa sổ", "la"), AR)),
 ("art_friend", (art("amico", "người bạn nam", "l'"), AR)),
 ("art_backpack", (art("zaino", "ba lô", "lo"), AR)),
 ("ind_amica", (fill("Ho ___ amica.", "un'", ["un", "una"], "Tôi có một người bạn nữ."), ELI)),
 ("ind_zaino", (fill("Ho ___ zaino.", "uno", ["un", "una"], "Tôi có một cái ba lô."), ELI)),
 ("num_47", (typ("47", "quarantasette"), [NU, WF])),
 ("num_16", (typ("16", "sedici"), [NU, WF])),
 ("num_30", (typ("30", "trenta"), [NU, WF])),
 ("spell_e", (fill("Marco ___ a casa.", "è", ["e", "ha"], "Marco ở nhà."), SP)),
 ("spell_citta", (fill("Roma è una ___.", "città", ["citta'", "cittá"], "Roma là một thành phố."), SP)),
 ("cog_camera", (sel("la camera", "căn phòng", ["máy ảnh", "nhà hàng", "trường học"], "targetToNative", True), COG)),
 ("cog_genitori", (sel("I miei genitori sono qui.", "Bố mẹ tôi ở đây.", ["Họ hàng tôi ở đây.", "Con tôi ở đây.", "Bạn tôi ở đây."], "targetToNative"), COG)),
], ess)

LF, LI, LA, LD = O("listening.familiar_words"), O("listening.short_info"), O("listening.announcements"), O("listening.short_dialogues")
RM, RN, RT = O("reading.short_messages"), O("reading.notices_info"), O("reading.short_texts")
c = lambda cid, *a, **k: clip(f"it.clip.{cid}", *a, **k)
r_ = lambda rid, *a, **k: reading(f"it.read.{rid}", *a, **k)
c("cp3_stazione", "word_phrase", [("A", "la stazione")], LF, ["la stazione"])
c("cp3_formaggio", "word_phrase", [("A", "il formaggio")], LF, ["il formaggio"])
c("cp3_dett_notte", "word_phrase", [("A", "la notte")], LF, ["la notte"])
c("cp3_prezzo", "message", [("A", "Il caffè costa tre euro.")], LI, ["il caffè"], 2)
c("cp3_corso", "message", [("A", "Il corso di italiano comincia alle nove.")], LI, ["il corso"], 2)
c("cp3_festa", "message", [("A", "La festa è sabato, non venerdì.")], LI, ["il sabato", "il venerdì"], 2)
c("cp3_binario", "announcement", [("A", "Attenzione! Il treno per Roma parte oggi dal binario tre.")], LA, ["il treno", "il binario"], 2)
c("cp3_super", "announcement", [("A", "Gentili clienti, il supermercato chiude tra dieci minuti.")], LA, ["il supermercato", "il minuto"], 2)
c("cp3_libro", "instruction", [("A", "Aprite il libro a pagina venti, per favore.")], LA, ["aprire", "il libro"], 2)
c("cp3_dett_treno", "announcement", [("A", "Il treno arriva.")], LA, ["il treno", "arrivare"])
c("cp3_dlg_te", "dialogue", [("A", "Vuoi un caffè?"), ("B", "No, grazie. Preferisco un tè.")], LD, ["il caffè", "il tè"], 2)
c("cp3_dlg_abitare", "dialogue", [("A", "Dove abiti?"), ("B", "Abito a Milano, ma sono di Hanoi.")], LD, ["abitare"], 2)
c("cp3_dlg_cinema", "dialogue", [("A", "Andiamo al cinema venerdì?"), ("B", "Venerdì non posso. Domenica?"), ("A", "Sì, va bene!")], LD, ["il cinema", "il venerdì", "la domenica"], 2)
r_("cp3_messaggio_luca", "message", ["Ciao Mia! Domenica vado a Firenze in treno. Il treno parte alle otto. Vieni con me? Luca"], RM, ["la domenica", "il treno"], units=3)
r_("cp3_cartello_biblioteca", "notice", ["Biblioteca comunale", "Da lunedì a venerdì: 9:00–19:00", "Sabato: 10:00–14:00", "Domenica: chiuso"], RN, ["la biblioteca", "il lunedì", "il venerdì", "il sabato", "la domenica"], [("comunale", "của thành phố"), ("chiuso", "đóng cửa")], 3, "Orario")
r_("cp3_testo_anna", "description", ["Mi chiamo Anna. Ho trenta anni e abito a Bologna. Ho due figli e un gatto. Il fine settimana gioco a tennis."], RT, ["l'anno", "abitare", "il gatto", "giocare"], [("fine settimana", "cuối tuần"), ("tennis", "quần vợt")], units=3)
r_("cp3_testo_paolo", "narrative", ["Paolo si alza alle sei. Beve un caffè e poi prende l'autobus per andare al lavoro. Lavora in una panetteria."], RT, ["il caffè", "l'autobus", "il lavoro", "lavorare"], [("panetteria", "tiệm bánh mì")], 3)
s3 = items("s3", [
 ("fam_stazione", (lc("it.clip.cp3_stazione", "Bạn nghe thấy gì?", "nhà ga", ["khách sạn", "sân bay", "bảo tàng"]), LF)),
 ("fam_formaggio", (lc("it.clip.cp3_formaggio", "Bạn nghe thấy gì?", "phô mai", ["bánh mì", "trứng", "sữa"]), LF)),
 ("fam_dett_notte", (dict_("it.clip.cp3_dett_notte", "la notte", ["notte"]), LF)),
 ("info_prezzo", (lc("it.clip.cp3_prezzo", "Cà phê giá bao nhiêu?", "Ba euro", ["Hai euro", "Mười ba euro", "Ba mươi euro"]), LI)),
 ("info_corso", (lc("it.clip.cp3_corso", "Khóa học tiếng Ý bắt đầu lúc mấy giờ?", "Lúc chín giờ", ["Lúc mười giờ", "Lúc một giờ", "Lúc mười chín giờ"]), LI)),
 ("info_festa", (lc("it.clip.cp3_festa", "Bữa tiệc vào ngày nào?", "Thứ Bảy", ["Thứ Sáu", "Chủ nhật", "Thứ Hai"]), LI)),
 ("ann_binario", (lc("it.clip.cp3_binario", "Tàu đi Roma chạy từ sân ga số mấy?", "Số ba", ["Số hai", "Số tám", "Số mười ba"]), LA)),
 ("ann_super", (lc("it.clip.cp3_super", "Siêu thị đóng cửa khi nào?", "Sau mười phút nữa", ["Sau hai phút nữa", "Lúc mười giờ", "Ngày mai"]), LA)),
 ("ann_libro", (lc("it.clip.cp3_libro", "Bạn phải mở sách trang mấy?", "Trang hai mươi", ["Trang mười hai", "Trang hai", "Trang ba mươi"]), LA)),
 ("ann_dett_treno", (dict_("it.clip.cp3_dett_treno", "Il treno arriva.", ["Il treno arriva", "il treno arriva"]), LA)),
 ("dlg_te", (lc("it.clip.cp3_dlg_te", "Người thứ hai muốn uống gì?", "Trà", ["Cà phê", "Nước", "Sữa"]), LD)),
 ("dlg_abitare", (lc("it.clip.cp3_dlg_abitare", "Người thứ hai sống ở đâu?", "Ở Milano", ["Ở Hà Nội", "Ở Roma", "Ở Napoli"]), LD)),
 ("dlg_cinema", (lc("it.clip.cp3_dlg_cinema", "Họ đi xem phim vào ngày nào?", "Chủ nhật", ["Thứ Sáu", "Thứ Bảy", "Hôm nay"]), LD)),
 ("msg_dove", (rc("it.read.cp3_messaggio_luca", "Chủ nhật Luca đi đâu?", "Đi Firenze bằng tàu", ["Đi Firenze bằng xe buýt", "Đến nhà Mia", "Đi làm"]), RM)),
 ("msg_ora", (rc("it.read.cp3_messaggio_luca", "Tàu chạy lúc mấy giờ?", "Lúc tám giờ", ["Lúc sáu giờ", "Lúc mười giờ", "Lúc mười tám giờ"]), RM)),
 ("msg_bar", (sel("Oggi il bar è chiuso.", "Hôm nay quán cà phê đóng cửa.", ["Hôm nay quán cà phê mở cửa.", "Ngày mai quán cà phê đóng cửa.", "Quán cà phê ở cạnh nhà ga."], "targetToNative"), RM)),
 ("note_sabato", (rc("it.read.cp3_cartello_biblioteca", "Thứ Bảy thư viện mở cửa giờ nào?", "Từ 10 đến 14 giờ", ["Từ 9 đến 19 giờ", "Cả ngày", "Đóng cửa"]), RN)),
 ("note_chiuso", (rc("it.read.cp3_cartello_biblioteca", "Ngày nào thư viện đóng cửa?", "Chủ nhật", ["Thứ Hai", "Thứ Bảy", "Thứ Sáu"]), RN)),
 ("note_fumare", (sel("Vietato fumare", "Cấm hút thuốc", ["Xin hãy đợi", "Cấm chạy", "Xin mời vào"], "targetToNative"), RN)),
 ("text_anna_dove", (rc("it.read.cp3_testo_anna", "Anna sống ở đâu?", "Ở Bologna", ["Ở Roma", "Ở Torino", "Ở Milano"]), RT)),
 ("text_anna_figli", (rc("it.read.cp3_testo_anna", "Anna có mấy đứa con?", "Hai", ["Một", "Ba", "Không có"]), RT)),
 ("text_paolo", (rc("it.read.cp3_testo_paolo", "Paolo đi làm bằng gì?", "Bằng xe buýt", ["Bằng tàu", "Bằng xe đạp", "Đi bộ"]), RT)),
], ess)

s4 = items("s4", [
 ("greet_evening", speak("it.speak.cp4_greet_evening", "formulaic", "Bạn bước vào nhà hàng lúc tám giờ tối. Hãy chào người phục vụ.", "Buonasera", ["Buonasera", "Salve, buonasera"], lex=["buonasera"])),
 ("thanks", speak("it.speak.cp4_thanks", "formulaic", "Có người đưa cho bạn một ly nước. Hãy cảm ơn.", "Grazie", ["Grazie", "Grazie mille", "Grazie tante"], lex=["grazie"])),
 ("sorry", speak("it.speak.cp4_sorry", "formulaic", "Bạn va vào một người lạ trên phố. Hãy xin lỗi.", "Scusi", ["Scusi", "Mi scusi", "Oh, scusi"], lex=["scusi"])),
 ("name", speak("it.speak.cp4_name", "self_intro", "Hãy nói tên của bạn.", "Mi chiamo Lan", ["Mi chiamo Lan", "Il mio nome è Lan", "Sono Lan"], cue=[("Tên", "Lan")], lex=["il nome"])),
 ("from", speak("it.speak.cp4_from", "self_intro", "Hãy nói bạn đến từ đâu.", "Sono del Vietnam", ["Sono del Vietnam", "Vengo dal Vietnam", "Sono vietnamita"], cue=[("Quê", "Việt Nam")], lex=["vietnamita"])),
 ("live", speak("it.speak.cp4_live", "self_intro", "Hãy nói bạn sống ở đâu.", "Abito a Padova", ["Abito a Padova", "Vivo a Padova"], cue=[("Thành phố", "Padova")], lex=["abitare"])),
 ("time", speak("it.speak.cp4_time", "give_info", "Hãy nói bây giờ là mấy giờ.", "Sono le nove", ["Sono le nove", "Le nove", "Nove"], cue=[("Giờ", "9:00")], lex=["l'ora"])),
 ("price", speak("it.speak.cp4_price", "give_info", "Hãy nói cái bánh giá bao nhiêu.", "La torta costa cinque euro", ["La torta costa cinque euro", "Costa cinque euro", "Cinque euro"], cue=[("Giá", "5 €")], lex=["la torta"])),
 ("age", speak("it.speak.cp4_age", "give_info", "Hãy nói bạn bao nhiêu tuổi.", "Ho venticinque anni", ["Ho venticinque anni", "Venticinque anni"], cue=[("Tuổi", "25")], lex=["l'anno"])),
 ("dog", speak("it.speak.cp4_dog", "describe", "Hãy nói con chó trong hình nhỏ.", "Il cane è piccolo", ["Il cane è piccolo", "È un cane piccolo"], emoji="🐕", lex=["il cane", "piccolo"])),
 ("car", speak("it.speak.cp4_car", "describe", "Hãy nói chiếc xe hơi trong hình mới.", "La macchina è nuova", ["La macchina è nuova", "È una macchina nuova"], emoji="🚗✨", lex=["la macchina", "nuovo"])),
 ("city", speak("it.speak.cp4_city", "describe", "Hãy nói thành phố trong hình đẹp.", "La città è bella", ["La città è bella", "È una bella città"], emoji="🏙️", lex=["la città", "bello"])),
], ess)

s5 = items("s5", [
 ("profile_lan", write("it.write.cp5_profile_lan", "personal_profile", "Bạn là Lan. Hãy tự giới thiệu bằng cách viết: tên, tuổi và thành phố, bằng câu hoàn chỉnh.", [("Tên", "Lan"), ("Tuổi", "28"), ("Thành phố", "Padova")],
   [("name", "tên", ["mi chiamo lan", "il mio nome è lan", "sono lan"], True), ("age", "tuổi", ["28"], True), ("city", "thành phố", ["a padova"], True)], 8, 30, "Mi chiamo Lan. Ho 28 anni. Abito a Padova.", ["il nome", "l'anno", "abitare"], ["chiamo", "ho", "abito", "vivo"])),
 ("profile_tuan", write("it.write.cp5_profile_tuan", "personal_profile", "Bạn là Tuấn. Hãy viết về bạn: tên, quê và nơi bạn sống.", [("Tên", "Tuấn"), ("Quê", "Việt Nam"), ("Thành phố", "Verona")],
   [("name", "tên", ["mi chiamo tuấn", "il mio nome è tuấn", "sono tuấn"], True), ("from", "quê", ["vietnam", "vietnamita"], True), ("city", "thành phố", ["a verona"], True)], 8, 30, "Mi chiamo Tuấn. Sono vietnamita e abito a Verona.", ["vietnamita", "abitare"], ["chiamo", "sono", "abito", "vivo"])),
 ("profile_mai", write("it.write.cp5_profile_mai", "personal_profile", "Bạn là Mai. Hãy viết tên của bạn và những tiếng bạn nói.", [("Tên", "Mai"), ("Ngôn ngữ", "tiếng Việt, tiếng Ý")],
   [("name", "tên", ["mi chiamo mai", "il mio nome è mai", "sono mai"], True), ("vi", "tiếng Việt", ["vietnamita"], True), ("it", "tiếng Ý", ["italiano"], True)], 6, 25, "Mi chiamo Mai. Parlo vietnamita e italiano.", ["parlare"], ["chiamo", "parlo", "sono"])),
 ("like_music", write("it.write.cp5_like_music", "simple_description", "Hãy viết một câu nói rằng bạn thích âm nhạc.", None,
   [("music", "âm nhạc", ["musica"], False), ("like", "bạn thích", ["mi piace", "amo", "ascolto"], False)], 3, 12, "Mi piace la musica.", ["la musica", "mi piace"], ["piace", "amo", "ascolto"])),
 ("sister", write("it.write.cp5_sister", "simple_description", "Hãy viết hai câu về chị gái bạn: chị ấy tên là Hoa và chị ấy làm việc ở Roma.", [("Tên", "Hoa"), ("Thành phố", "Roma")],
   [("name", "tên chị gái", ["si chiama hoa", "il suo nome è hoa", "mia sorella è hoa"], True), ("work", "nơi làm việc", ["lavora a roma"], True)], 5, 20, "Mia sorella si chiama Hoa. Lavora a Roma.", ["la sorella", "lavorare"], ["chiama", "lavora", "è"])),
 ("room", write("it.write.cp5_room", "simple_description", "Hãy viết hai câu tả căn phòng: cái giường lớn, cái bàn nhỏ.", None,
   [("bed", "cái giường lớn", ["il letto è grande"], False), ("table", "cái bàn nhỏ", ["il tavolo è piccolo"], False)], 6, 16, "Il letto è grande. Il tavolo è piccolo.", ["il letto", "il tavolo", "grande", "piccolo"], ["è"])),
 ("msg_cinema", write("it.write.cp5_msg_cinema", "short_message", "Hãy viết lời nhắn cho Luca: chào anh ấy, rồi hẹn đi xem phim lúc tám giờ.", [("Gửi", "Luca"), ("Việc gì", "il cinema"), ("Giờ", "8:00")],
   [("greeting", "lời chào", GREET, False), ("addressee", "tên người nhận", ["luca"], True), ("what", "xem phim", ["cinema", "film"], True), ("time", "giờ hẹn", ["alle otto", "alle 20"], True)], 5, 20, "Ciao Luca, andiamo al cinema alle otto?", ["il cinema"])),
 ("msg_nonna", write("it.write.cp5_msg_nonna", "short_message", "Hãy nhắn cho bà: chào bà, nói rằng bạn đến vào Chủ nhật, rồi chào kết.", [("Gửi", "bà (nonna)"), ("Ngày", "domenica")],
   [("greeting", "lời chào", GREET, False), ("day", "ngày bạn đến", ["domenica"], True), ("closing", "lời chào kết", CLOSE, False)], 5, 20, "Cara nonna, vengo domenica. A presto!", ["la domenica", "venire"])),
 ("msg_malato", write("it.write.cp5_msg_malato", "short_message", "Hãy nhắn cho đồng nghiệp Lisa: chào, nói rằng hôm nay bạn bị ốm, rồi chào kết.", [("Gửi", "Lisa")],
   [("greeting", "lời chào", GREET, False), ("sick", "bạn bị ốm", ["malato", "malata"], False), ("closing", "lời chào kết", CLOSE, False)], 5, 20, "Ciao Lisa, oggi sono malata. A domani!", ["malato"])),
 ("form_corso", write("it.write.cp5_form_corso", "simple_form", "Hãy điền phiếu đăng ký khoá học với các thông tin trên thẻ.", [("Tên", "Lan"), ("Họ", "Nguyen"), ("Tuổi", "28")],
   [("first", "tên của bạn", ["lan"], True), ("last", "họ của bạn", ["nguyen"], True), ("age", "tuổi", ["28"], True)], 2, 12, "Lan | Nguyen | 28", ["il nome"], fields=[("nome", "Nome", "first"), ("cognome", "Cognome", "last"), ("eta", "Età", "age")])),
 ("form_medico", write("it.write.cp5_form_medico", "simple_form", "Hãy điền phiếu ở phòng khám với các thông tin trên thẻ.", [("Họ tên", "Tuan Pham"), ("Thành phố", "Verona"), ("Điện thoại", "340 445566")],
   [("name", "họ tên", ["tuan pham", "pham"], True), ("city", "thành phố", ["verona"], True), ("phone", "số điện thoại", ["340 445566", "340445566"], True)], 2, 12, "Tuan Pham | Verona | 340 445566", ["la città", "il telefono"], fields=[("nome", "Nome", "name"), ("citta", "Città", "city"), ("telefono", "Telefono", "phone")])),
 ("form_albergo", write("it.write.cp5_form_albergo", "simple_form", "Hãy điền phiếu khách sạn với các thông tin trên thẻ.", [("Họ tên", "Mai Le"), ("Nước", "Việt Nam"), ("Số đêm", "2")],
   [("name", "họ tên", ["mai le", "le"], True), ("country", "nước", ["vietnam"], True), ("nights", "số đêm", ["2"], True)], 2, 12, "Mai Le | Vietnam | 2", ["l'albergo"], fields=[("nome", "Nome", "name"), ("paese", "Paese", "country"), ("notti", "Notti", "nights")])),
], ess)

s6 = items("s6", [
 ("corso", scenario("cp_corso", "conversation", CONV, "Bạn mới ở lớp học", "Làm quen với một bạn cùng lớp: nói tên và quê.",
   [("Ciao! Sono Luca. E tu?", "Come ti chiami?", "Hãy nói tên bạn: Lan.", "name", ["Sono Lan.", "Mi chiamo Lan.", "Ciao, sono Lan."], [["lan"]]),
    ("Di dove sei?", "Da dove vieni?", "Hãy nói bạn đến từ Việt Nam.", "origin", ["Sono del Vietnam.", "Vengo dal Vietnam.", "Sono vietnamita."], [["vietnam", "vietnamita"]])],
   "Bene! A domani!", "Non importa. A domani!")),
 ("vicina", scenario("cp_vicina", "conversation", CONV, "Gặp bà hàng xóm", "Chào bà hàng xóm và trả lời bà ấy.",
   [("Buongiorno! Come sta?", "Sta bene oggi?", "Hãy chào và nói bạn khỏe.", "fine", ["Buongiorno! Bene, grazie.", "Bene, grazie.", "Molto bene, grazie."], [["bene"]]),
    ("Abita qui da molto?", "Da quanto tempo abita qui?", "Hãy nói bạn sống ở đây được một năm.", "time", ["Da un anno.", "Abito qui da un anno.", "Un anno."], [["anno"]])],
   "Bene! Buona giornata!", "Non importa. Arrivederci!")),
 ("festa", scenario("cp_festa", "conversation", CONV, "Lời mời dự tiệc", "Nhận lời mời của bạn và hỏi giờ.",
   [("Sabato faccio una festa. Vieni?", "Vieni alla mia festa sabato?", "Hãy nhận lời.", "accept", ["Sì, volentieri!", "Sì, vengo.", "Sì, certo."], [["sì", "si"]]),
    ("Bene! Hai una domanda?", "Vuoi sapere qualcosa?", "Hãy hỏi bữa tiệc bắt đầu lúc mấy giờ.", "ask_time", ["A che ora comincia la festa?", "A che ora?", "Quando comincia?"], [["ora", "quando"]])],
   "Alle otto. A sabato!", "Non importa. A presto!")),
 ("bar", scenario("cp_bar", "transaction", PRAC, "Ở quán cà phê", "Gọi một ly trà và hỏi giá.",
   [("Buongiorno! Cosa prende?", "Cosa desidera?", "Hãy gọi một ly trà.", "order", ["Un tè, per favore.", "Vorrei un tè.", "Prendo un tè."], [["tè", "te"]]),
    ("Subito. Altro?", "Desidera altro?", "Hãy hỏi giá bao nhiêu.", "price", ["Quanto costa?", "Quant'è?", "Quanto pago?"], [["quanto", "quant"]])],
   "Due euro e cinquanta. Grazie!", "Non importa. Arrivederci!")),
 ("biglietto", scenario("cp_biglietto", "transaction", PRAC, "Mua vé tàu", "Mua một vé đi Venezia.",
   [("Buongiorno! Dove va?", "Per quale città?", "Hãy nói bạn muốn đi Venezia.", "dest", ["Per Venezia, per favore.", "Vorrei andare a Venezia.", "A Venezia."], [["venezia"]]),
    ("Solo andata o andata e ritorno?", "Anche il ritorno?", "Hãy nói bạn chỉ cần vé một chiều.", "oneway", ["Solo andata, per favore.", "Solo andata."], [["solo"]])],
   "Sono trenta euro. Buon viaggio!", "Non importa. Arrivederci!")),
 ("farmacia_dove", scenario("cp_farmacia", "information_exchange", PRAC, "Hỏi đường đến hiệu thuốc", "Hỏi hiệu thuốc ở đâu, rồi cảm ơn.",
   [("Sì, mi dica?", "Posso aiutarLa?", "Hãy hỏi hiệu thuốc ở đâu.", "ask", ["Dov'è la farmacia?", "Scusi, dov'è la farmacia?", "C'è una farmacia qui vicino?"], [["farmacia"]]),
    ("La farmacia è in piazza, a sinistra.", "In piazza, a sinistra.", "Hãy cảm ơn.", "thank", ["Grazie mille!", "Grazie!", "Grazie, signore!"], [["grazie"]])],
   "Prego!", "Non importa. Arrivederci!")),
])
for it in s6:
    it["essential"] = True

c("a1cap_museo", "message", [("A", "Il museo è aperto dalle dieci alle diciotto.")], LI, ["il museo", "aperto"], 2)
c("a1cap_autobus", "announcement", [("A", "L'autobus numero dodici oggi arriva con venti minuti di ritardo.")], LI, ["l'autobus", "il minuto"], 2)
c("a1cap_farmacia", "message", [("A", "La farmacia è in via Dante, vicino alla posta.")], LI, ["la farmacia", "la posta"], 2)
c("a1cap_prezzo", "dialogue", [("A", "Quanto costano le mele?"), ("B", "Due euro al chilo.")], LI, ["la mela"], 2)
r_("a1cap_biglietto_papa", "message", ["Ciao ragazzi! Sono al supermercato. Torno a casa alle sei. La cena è nel frigorifero. Papà"], RM, ["il supermercato", "il frigorifero"], units=3)
r_("a1cap_invito", "message", ["Cara Mai, venerdì è il mio compleanno! La festa comincia alle sette a casa mia. Porta la musica, per favore! Lisa"], RM, ["il venerdì", "il compleanno", "la musica"], units=3)
cap_rows = [
 ("listen_museo", (lc("it.clip.a1cap_museo", "Bảo tàng mở cửa giờ nào?", "Từ mười giờ đến mười tám giờ", ["Từ tám giờ đến mười giờ", "Cả ngày lẫn đêm", "Từ hai giờ đến tám giờ"]), LI)),
 ("listen_autobus", (lc("it.clip.a1cap_autobus", "Hôm nay xe buýt số mười hai thế nào?", "Đến muộn hai mươi phút", ["Đến sớm hai mươi phút", "Không chạy", "Đến muộn mười hai phút"]), LI)),
 ("listen_farmacia", (lc("it.clip.a1cap_farmacia", "Hiệu thuốc ở đâu?", "Ở phố Dante, gần bưu điện", ["Ở nhà ga", "Gần siêu thị", "Ở phố Dante, gần ngân hàng"]), LI)),
 ("listen_prezzo", (lc("it.clip.a1cap_prezzo", "Một ký táo giá bao nhiêu?", "Hai euro", ["Mười hai euro", "Một euro", "Hai mươi euro"]), LI)),
 ("read_papa_dove", (rc("it.read.a1cap_biglietto_papa", "Bố đang ở đâu?", "Ở siêu thị", ["Ở nhà", "Ở chỗ làm", "Ở nhà ga"]), RM)),
 ("read_papa_ora", (rc("it.read.a1cap_biglietto_papa", "Mấy giờ bố về nhà?", "Lúc sáu giờ", ["Lúc bảy giờ", "Lúc sáu giờ rưỡi", "Lúc mười sáu giờ"]), RM)),
 ("read_invito_cosa", (rc("it.read.a1cap_invito", "Vì sao Lisa làm tiệc?", "Vì là sinh nhật Lisa", ["Vì Mai đến chơi", "Vì là cuối tuần", "Vì có khách"]), RM)),
 ("read_invito_porta", (rc("it.read.a1cap_invito", "Mai nên mang gì đến?", "Nhạc", ["Bánh", "Hoa", "Đồ uống"]), RM)),
 ("speak_time", speak("it.speak.a1cap_time", "give_info", "Hãy nói bây giờ là mấy giờ.", "Sono le dieci", ["Sono le dieci", "Le dieci", "Dieci"], cue=[("Giờ", "10:00")], lex=["l'ora"])),
 ("speak_price", speak("it.speak.a1cap_price", "give_info", "Hãy nói cuốn sách giá bao nhiêu.", "Il libro costa dodici euro", ["Il libro costa dodici euro", "Costa dodici euro", "Dodici euro"], cue=[("Giá", "12 €")], lex=["il libro"])),
 ("speak_count", speak("it.speak.a1cap_count", "give_info", "Hãy nói bạn có mấy anh chị em.", "Ho due fratelli", ["Ho due fratelli", "Ho due sorelle", "Due"], cue=[("Anh chị em", "2")], concepts=[["due", "2"]])),
 ("speak_day", speak("it.speak.a1cap_day", "give_info", "Hãy nói hôm nay là thứ mấy.", "Oggi è lunedì", ["Oggi è lunedì", "È lunedì", "Lunedì"], cue=[("Hôm nay", "thứ Hai")], lex=["il lunedì"])),
 ("write_note_treno", write("it.write.a1cap_note_treno", "short_message", "Hãy viết lời nhắn ngắn cho Paolo: chào anh ấy, và nói rằng tàu chạy lúc chín giờ.", [("Gửi", "Paolo"), ("Việc gì", "il treno"), ("Giờ", "9:00")],
   [("greeting", "lời chào", GREET, False), ("addressee", "tên người nhận", ["paolo"], True), ("what", "tàu hỏa", ["treno"], True), ("time", "giờ", ["alle nove"], True)], 5, 20, "Ciao Paolo, il treno parte alle nove.", ["il treno"])),
 ("write_note_negozio", write("it.write.a1cap_note_negozio", "short_message", "Hãy nhắn cho Anna: chào, nói bạn đang ở cửa hàng và về nhà lúc năm giờ.", [("Gửi", "Anna"), ("Ở đâu", "il negozio"), ("Giờ", "5:00")],
   [("greeting", "lời chào", GREET, False), ("place", "cửa hàng", ["negozio", "supermercato"], True), ("time", "giờ về", ["alle cinque", "alle 17"], True)], 5, 20, "Ciao Anna, sono in negozio. Torno a casa alle cinque.", ["il negozio"])),
 ("write_note_bar", write("it.write.a1cap_note_bar", "short_message", "Hãy nhắn cho Ben: hẹn gặp ở quán cà phê vào thứ Sáu, rồi chào kết.", [("Gửi", "Ben"), ("Ở đâu", "il bar"), ("Ngày", "venerdì")],
   [("place", "quán cà phê", ["bar"], True), ("day", "ngày hẹn", ["venerdì"], True), ("closing", "lời chào kết", ["a presto", "a domani", "un abbraccio", "ciao"], False)], 5, 20, "Ci vediamo venerdì al bar. A presto!", ["il venerdì", "il bar"])),
 ("write_note_ritardo", write("it.write.a1cap_note_ritardo", "short_message", "Hãy nhắn cho thầy giáo: chào, nói rằng hôm nay bạn đến muộn mười phút.", [("Gửi", "thầy Bianchi"), ("Muộn", "10 minuti")],
   [("greeting", "lời chào", ["buongiorno", "salve", "gentile professore", "caro professore"], False), ("late", "đến muộn", ["ritardo", "tardi"], False), ("minutes", "mười phút", ["dieci minuti"], True)], 5, 20, "Buongiorno, professore, oggi arrivo con dieci minuti di ritardo.", ["il minuto", "il ritardo"])),
 ("talk_vicino", scenario("a1cap_vicino", "conversation", CONV, "Nói chuyện với hàng xóm mới", "Chào hàng xóm mới, nói tên và nơi làm việc.",
   [("Buongiorno! Sono il signor Conti. E Lei come si chiama?", "Qual è il Suo nome?", "Hãy nói tên bạn: Minh.", "name", ["Mi chiamo Minh.", "Il mio nome è Minh.", "Sono Minh."], [["minh"]]),
    ("E che lavoro fa?", "Dove lavora?", "Hãy nói bạn làm việc ở bệnh viện.", "job", ["Lavoro in ospedale.", "In ospedale.", "Lavoro in un ospedale."], [["ospedale"]])],
   "Interessante! Piacere!", "Non importa. Arrivederci!")),
 ("talk_telefono", scenario("a1cap_telefono", "conversation", CONV, "Gọi điện cho bạn", "Gọi cho một người bạn và hẹn gặp ngày mai.",
   [("Pronto, sono Sara!", "Ciao, qui è Sara!", "Hãy chào và nói tên bạn: Lan.", "greet", ["Ciao Sara, sono Lan.", "Ciao, sono Lan.", "Sono Lan."], [["lan"]]),
    ("Hai tempo domani?", "Sei libera domani?", "Hãy nói ngày mai bạn rảnh.", "free", ["Sì, domani ho tempo.", "Sì, ho tempo.", "Sì, volentieri."], [["sì", "si"]])],
   "Bene, a domani!", "Non importa. A presto!")),
 ("talk_giulia", scenario("a1cap_giulia", "conversation", CONV, "Gặp Giulia ở công viên", "Trò chuyện ngắn với Giulia về sở thích.",
   [("Ciao! Cosa ti piace fare il sabato?", "Cosa fai il sabato?", "Hãy nói bạn thích đọc sách.", "hobby", ["Mi piace leggere.", "Leggo.", "Leggere."], [["leggere", "leggo"]]),
    ("Bello! Anche a me. Vuoi un caffè?", "Prendi un caffè con me?", "Hãy nhận lời.", "yes", ["Sì, volentieri!", "Sì, grazie.", "Sì, certo."], [["sì", "si"]])],
   "Bene, andiamo!", "Non importa. Un'altra volta!")),
 ("talk_medico", scenario("a1cap_medico", "conversation", CONV, "Đặt lịch khám", "Gọi phòng khám và đặt lịch hẹn vào thứ Hai.",
   [("Studio del dottor Neri, buongiorno.", "Qui è lo studio del dottor Neri.", "Hãy chào và nói bạn muốn đặt lịch hẹn.", "appt", ["Buongiorno, vorrei un appuntamento.", "Ho bisogno di un appuntamento.", "Un appuntamento, per favore."], [["appuntamento"]]),
    ("Lunedì alle dieci va bene?", "Lunedì, alle dieci?", "Hãy nói được.", "ok", ["Sì, va bene.", "Sì, grazie.", "Sì, lunedì alle dieci va bene."], [["sì", "si"]])],
   "Bene, a lunedì!", "Non importa. Arrivederci!")),
]
cap = items("cap", cap_rows)
for it in cap:
    it["essential"] = True
form_a = [f"it.cpi.cap.{s}" for s in ["listen_museo", "listen_autobus", "read_papa_dove", "read_papa_ora", "speak_time", "speak_price", "write_note_treno", "write_note_negozio", "talk_vicino", "talk_telefono"]]
form_b = [f"it.cpi.cap.{s}" for s in ["listen_farmacia", "listen_prezzo", "read_invito_cosa", "read_invito_porta", "speak_count", "speak_day", "write_note_bar", "write_note_ritardo", "talk_giulia", "talk_medico"]]


def cp(sec, title, desc, its, crit=2, forms=None, cid=None):
    r = {"id": cid or f"it.checkpoint.section-{sec}", "checkpointVersion": 1, "formVersion": 1, "sectionId": f"it-vi:section-{sec}",
         "title": {"vi": title, "en": title}, "description": {"vi": desc, "en": desc}, "items": its}
    if forms:
        r["forms"] = forms
    r["criteria"] = {"minItemsPerObjective": crit, "demonstratedShare": 0.66}
    return r


CPS = [
 cp(1, "Kiểm tra Phần 1", "Thể hiện những gì bạn làm được với kiến thức nền: lời chào, từ hằng ngày, và đọc những câu tiếng Ý quen thuộc.", s1),
 cp(2, "Kiểm tra Phần 2", "Kiểm tra những viên gạch nền: mạo từ il/lo/la/l', essere và avere, đuôi động từ, số đếm và chính tả tiếng Ý.", s2),
 cp(3, "Kiểm tra Phần 3", "Nghe và đọc: từ quen thuộc, thông báo, đoạn hội thoại ngắn, tin nhắn, biển báo và đoạn văn ngắn.", s3),
 cp(4, "Kiểm tra Phần 4", "Nói thành tiếng: chào hỏi, giới thiệu bản thân, nói thông tin và tả đồ vật.", s4),
 cp(5, "Kiểm tra Phần 5", "Viết: giới thiệu bản thân, câu ngắn, tin nhắn ngắn và điền biểu mẫu.", s5),
 cp(6, "Kiểm tra Phần 6", "Hội thoại: trò chuyện hằng ngày và lo những việc thiết thực bằng tiếng Ý.", s6, crit=3),
 cp(6, "Bài tổng kết A1", "Bài tổng kết: nghe, đọc, nói, viết và hội thoại, mỗi kỹ năng một phần nhỏ. Kết quả là ước tính theo khung CEFR, không phải chứng chỉ.", cap,
    forms=[{"formId": "a", "itemIds": form_a}, {"formId": "b", "itemIds": form_b}], cid="it.checkpoint.a1-capstone"),
]

c("pl_latte", "word_phrase", [("A", "il latte")], LF, ["il latte"])
c("pl_annuncio", "announcement", [("A", "Il treno per Bologna parte oggi alle dieci.")], LA, ["il treno"], 2)
c("pl_cassa", "announcement", [("A", "La cassa tre è aperta.")], LA, ["la cassa", "aperto"], 1)
r_("pl_cartello_bar", "notice", ["Bar Centrale", "Da lunedì a sabato: 8:00–18:00", "Domenica: chiuso"], RN, ["il lunedì", "il sabato", "la domenica"], [("chiuso", "đóng cửa")], 2, "Orario")
r_("pl_messaggio", "message", ["Ciao Luca! Domani sera mangiamo al ristorante. Vieni anche tu? Lena"], RM, ["il ristorante"], units=2)


def pli(prefix, slug, ex_obj):
    ex, obj = ex_obj
    ex = dict(ex)
    ex["id"] = f"it-plx-{prefix}-{slug}"
    return {"id": f"it.pli.{prefix}.{slug}", "itemVersion": 1, "exercise": ex, "objectiveTargets": [obj]}


def cluster(cid, obj, anchor, its):
    return {"id": f"it.pcluster.{cid}", "objectiveId": obj, "anchorLessonId": f"it-vi:{anchor}", "items": its}


STAGES = [
 {"id": "it.pstage.foundations", "title": {"vi": "Nền tảng", "en": "Foundations"}, "clusters": [
   cluster("everyday", EV, "u0-l0", [pli("s1", "bread", (sel("bánh mì", "il pane", ["l'acqua", "la mela", "il latte"], "nativeToTarget"), EV)),
                                    pli("s1", "woman", (sel("la donna", "người phụ nữ", ["người đàn ông", "cô gái", "đứa bé"], "targetToNative", True), EV))]),
   cluster("greetings", G, "u1-l0", [pli("s1", "morning", (sel("Buổi sáng, bạn bước vào quán cà phê. Bạn nói:", "Buongiorno!", ["Buonanotte!", "Arrivederci!", "Grazie!"], "nativeToTarget"), G)),
                                     pli("s1", "thanks", (sel("Có người giúp bạn. Bạn nói:", "Grazie!", ["Ciao!", "Arrivederci!", "Buonasera!"], "nativeToTarget"), G))]),
   cluster("reading", RD, "u2-l0", [pli("s1", "girl_apple", (sel("La ragazza mangia una mela.", "Cô gái ăn một quả táo.", ["Cậu bé ăn một quả táo.", "Cô gái uống nước.", "Cô gái ăn bánh mì."], "targetToNative"), RD)),
                                    pli("s1", "father_coffee", (sel("Il padre beve il caffè.", "Người bố uống cà phê.", ["Người mẹ uống cà phê.", "Người bố uống trà.", "Người bố ăn bánh."], "targetToNative"), RD))]),
   cluster("places", PL, "u4-l0", [pli("s1", "station", (sel("nhà ga", "la stazione", ["l'aeroporto", "l'albergo", "la strada"], "nativeToTarget"), PL))]),
 ]},
 {"id": "it.pstage.building_blocks", "title": {"vi": "Viên gạch nền", "en": "Building blocks"}, "clusters": [
   cluster("articles", AR, "ua-l0", [pli("s2", "art_bed", (art("letto", "cái giường", "il"), AR)),
                                     pli("s2", "art_door", (art("porta", "cửa ra vào", "la"), AR))]),
   cluster("indefinite", ELI, "ua-l2", [pli("s2", "ind_key", (fill("Ho ___ studente in classe.", "uno", ["un", "una"], "Trong lớp tôi có một sinh viên."), ELI))]),
   cluster("essere_avere", SH, "ub-l0", [pli("s2", "essere_sel", (sel("Chúng tôi là sinh viên.", "Siamo studenti.", ["Abbiamo studenti.", "Siete studenti.", "Sei studenti."], "nativeToTarget"), SH)),
                                         pli("s2", "avere_lei", (conj("Anna ___ un gatto.", "Anna có một con mèo.", "avere", "pre:3s", "ha"), SH))]),
   cluster("regular", RP, "ub-l1", [pli("s2", "abitare_tu", (conj("Dove ___?", "Bạn sống ở đâu?", "abitare", "pre:2s", "abiti"), RP))]),
   cluster("numbers", NU, "ud-l0", [pli("s2", "num_21", (typ("21", "ventuno"), NU)), pli("s2", "num_13", (typ("13", "tredici"), NU))]),
   cluster("spelling", SP, "ue-l2", [pli("s2", "spell_nonno", (fill("Mio ___ abita a Hanoi.", "nonno", ["nono", "noono"], "Ông tôi sống ở Hà Nội."), SP))]),
 ]},
 {"id": "it.pstage.reception", "title": {"vi": "Hiểu tiếng Ý", "en": "Understanding Italian"}, "clusters": [
   cluster("listen_words", LF, "uf-l0", [pli("s3", "listen_latte", (lc("it.clip.pl_latte", "Bạn nghe thấy gì?", "sữa", ["nước", "bánh mì", "trà"]), LF))]),
   cluster("read_notices", RN, "ug-l0", [pli("s3", "cartello_giorni", (rc("it.read.pl_cartello_bar", "Quán cà phê mở cửa những ngày nào?", "Thứ Hai đến thứ Bảy", ["Hằng ngày", "Thứ Bảy và Chủ nhật", "Thứ Ba đến thứ Sáu"]), RN)),
                                         pli("s3", "cartello_domenica", (rc("it.read.pl_cartello_bar", "Chủ nhật quán thế nào?", "Đóng cửa", ["Mở từ 8 giờ", "Mở cả ngày", "Mở đến 18 giờ"]), RN))]),
   cluster("read_messages", RM, "ug-l1", [pli("s3", "messaggio_quando", (rc("it.read.pl_messaggio", "Bữa tối ở nhà hàng là khi nào?", "Tối mai", ["Tối nay", "Sáng mai", "Thứ Bảy tới"]), RM))]),
   cluster("listen_announcements", LA, "uh-l0", [pli("s3", "annuncio_ora", (lc("it.clip.pl_annuncio", "Tàu đi Bologna chạy lúc mấy giờ?", "Lúc mười giờ", ["Lúc hai giờ", "Lúc mười hai giờ", "Lúc mười một giờ"]), LA)),
                                                 pli("s3", "cassa", (lc("it.clip.pl_cassa", "Quầy thu ngân số mấy đang mở?", "Số ba", ["Số hai", "Số tám", "Số mười ba"]), LA))]),
 ]},
 {"id": "it.pstage.production", "title": {"vi": "Nói tiếng Ý", "en": "Speaking Italian"}, "clusters": [
   cluster("speak_formulaic", O("speaking.formulaic"), "uk-l0", [
     pli("s4", "greet_shop", speak("it.speak.pl4_greet_shop", "formulaic", "Buổi sáng bạn bước vào một cửa hàng nhỏ. Hãy chào người bán hàng.", "Buongiorno", ["Buongiorno", "Salve", "Salve, buongiorno"], lex=["buongiorno"])),
     pli("s4", "bye", speak("it.speak.pl4_bye", "formulaic", "Bạn rời khỏi văn phòng. Hãy chào tạm biệt lịch sự.", "Arrivederci", ["Arrivederci", "Arrivederci, buona giornata", "Buona giornata"], lex=["arrivederci"])),
     pli("s4", "please", speak("it.speak.pl4_please", "formulaic", "Bạn muốn xin một ly nước. Hãy nói thật lịch sự.", "Un bicchiere d'acqua, per favore", ["Un bicchiere d'acqua, per favore", "Acqua, per favore", "Vorrei un bicchiere d'acqua, per favore"], lex=["l'acqua"], concepts=[["acqua"], ["favore"]]))]),
   cluster("speak_info", O("speaking.give_info"), "um-l0", [
     pli("s4", "apples", speak("it.speak.pl4_apples", "give_info", "Hãy nói có bao nhiêu quả táo.", "Ci sono tre mele", ["Ci sono tre mele", "Tre mele"], cue=[("Táo", "3")], emoji="🍎🍎🍎", lex=["la mela"], concepts=[["tre", "3"]])),
     pli("s4", "time", speak("it.speak.pl4_time", "give_info", "Hãy nói bây giờ là mấy giờ.", "Sono le otto", ["Sono le otto", "Le otto", "Otto"], cue=[("Giờ", "8:00")], lex=["l'ora"])),
     pli("s4", "price", speak("it.speak.pl4_price", "give_info", "Hãy nói tấm vé giá bao nhiêu.", "Il biglietto costa dieci euro", ["Il biglietto costa dieci euro", "Costa dieci euro", "Dieci euro"], cue=[("Giá", "10 €")], lex=["il biglietto"]))]),
 ]},
]


def append(rel, recs):
    with open(os.path.join(D, rel), "a", encoding="utf-8", newline="\n") as f:
        for r in recs:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


def write_out(rel, recs):
    os.makedirs(os.path.dirname(os.path.join(D, rel)), exist_ok=True)
    with open(os.path.join(D, rel), "w", encoding="utf-8", newline="\n") as f:
        for r in recs:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


append("listening/OUTPUT.jsonl", clips)
append("readings/OUTPUT.jsonl", readings)
append("speech/OUTPUT.jsonl", speech)
append("writing/OUTPUT.jsonl", tasks)
append("scenarios/OUTPUT.jsonl", scenarios)
write_out("checkpoints/OUTPUT.jsonl", CPS)
write_out("placement/OUTPUT.jsonl", STAGES)
n_pl = sum(len(cl["items"]) for st in STAGES for cl in st["clusters"])
print(len(clips), "clips", len(readings), "readings", len(speech), "speech", len(tasks), "tasks", len(scenarios), "scenarios", [len(x["items"]) for x in CPS], "placement", n_pl)

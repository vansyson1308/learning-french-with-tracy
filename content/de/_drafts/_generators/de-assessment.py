"""de-vi assessment: 7 checkpoints + placement, with their reserved inputs (clips, readings, speech items,
writing tasks, scenarios). Appends the reserved inputs to the listening / readings / speech / writing /
scenarios OUTPUT files (run after the section generators) and writes checkpoints + placement OUTPUT."""
import json, os

ROOT = r"C:\src\lft\content\de"
D = os.path.join(ROOT, "_drafts")
LEX = json.load(open(os.path.join(ROOT, "lexicon", "lexemes.json"), encoding="utf-8"))["lexemes"]
SURF = {l["surface"]: l["id"] for l in LEX}
def lx(*surfaces): return [SURF[s] for s in surfaces if s in SURF]
def O(k): return f"de.obj.{k}"

pos = [0]
def place(correct, wrong):
    p = pos[0] % 4; pos[0] += 1
    o = list(wrong[:3]); o.insert(p, correct)
    return o, p

clips, readings, speech, tasks, scenarios = [], [], [], [], []
def clip(cid, kind, segs, obj, lex=(), units=1, demand="locate"):
    clips.append({"id": cid, "kind": kind, "segments": [{"speaker": s, "text": t} for s, t in segs], "objectiveRefs": [obj], "lexemeRefs": lx(*lex),
                  "sourceRef": "original-project", "authoringSpec": {"informationUnits": units, "inferenceDemand": demand}, "scoredPlaybackPolicy": {"maxPlays": 2, "rate": 1}})
    return cid
def reading(rid, kind, paras, obj, lex=(), gloss=(), units=3, title=None):
    r = {"id": rid, "kind": kind}
    if title: r["title"] = title
    r.update({"blocks": [{"kind": "paragraph", "text": p} for p in paras], "objectiveRefs": [obj], "lexemeRefs": lx(*lex),
              "supportGlossary": [{"surface": a, "gloss": {"vi": b, "en": b}} for a, b in gloss], "sourceRef": "original-project",
              "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"}})
    readings.append(r)
    return rid

# ---------- exercise builders ----------
def sel(prompt, correct, wrong, mode, audio=False):
    o, p = place(correct, wrong)
    e = {"type": "select", "mode": mode, "prompt": prompt, "options": [{"text": t} for t in o], "correct": p}
    if audio: e["audioTarget"] = prompt
    return e
def lc(cid, q, correct, wrong):
    o, p = place(correct, wrong)
    return {"type": "listeningComprehension", "clipId": cid, "question": q, "options": [{"text": t} for t in o], "correct": p}
def rc(rid, q, correct, wrong):
    o, p = place(correct, wrong)
    return {"type": "readingComprehension", "readingId": rid, "question": q, "options": [{"text": t} for t in o], "correct": p}
def dict_(cid, answer, alts): return {"type": "dictation", "clipId": cid, "answer": answer, "alternatives": alts}
def art(noun, gloss, articles, correct): return {"type": "articleSelect", "articles": articles, "noun": noun, "gloss": gloss, "correct": articles.index(correct)}
def fill(sent, ans, wrong, vi):
    o = [ans] + wrong
    o = o[pos[0] % len(o):] + o[:pos[0] % len(o)]; pos[0] += 1
    return {"type": "fillBlank", "sentence": sent, "translation": vi, "options": o, "correct": o.index(ans)}
def conj(sent, vi, verb, cell, ans): return {"type": "conjugationCloze", "sentence": sent, "translation": vi, "verb": verb, "cell": cell, "answer": ans, "alternatives": []}
def typ(prompt, ans, alts=()): return {"type": "typeAnswer", "mode": "produceTarget", "prompt": prompt, "answer": ans, "alternatives": list(alts)}

FAM = {"formulaic": ("formulaic_exchange", "situation_prompt"), "self_intro": ("self_introduction", "information_prompt"),
       "give_info": ("information_giving", "information_prompt"), "describe": ("description", "picture_prompt")}
def speak(sid, obj, instr, target, variants, cue=None, emoji=None, lex=(), concepts=None):
    fam, el = FAM[obj]
    prompt = {"instruction": {"vi": instr, "en": instr}}
    if cue: prompt["cueFacts"] = [{"label": {"vi": a, "en": a}, "value": b} for a, b in cue]
    if emoji: prompt["cueEmoji"] = emoji
    it = {"id": sid, "taskFamily": fam, "elicitationType": el, "prompt": prompt, "target": target, "acceptedVariants": variants,
          "objectiveRefs": [O("speaking." + obj)], "lexemeRefs": lx(*lex), "evidenceLexemeRefs": [],
          "assistancePolicy": {"allowContextualBias": False, "revealTargetAfterAttempts": None}, "scoredEligibility": True, "modelAudioRef": None,
          "recognitionLocale": "de-DE", "allowedAttempts": 2, "reserved": True, "sourceRef": "original-project"}
    if concepts: it["requiredConcepts"] = concepts
    speech.append(it)
    e = {"type": "speakProduction", "speechItemId": sid, "instruction": instr}
    if cue: e["cueFacts"] = [{"label": a, "value": b} for a, b in cue]
    if emoji: e["cueEmoji"] = emoji
    e.update({"target": target, "acceptedVariants": variants})
    if concepts: e["requiredConcepts"] = concepts
    e.update({"evidenceLexemeRefs": [], "revealTargetAfterAttempts": None, "allowContextualBias": False, "modelClipId": None, "allowedAttempts": 2})
    return e, O("speaking." + obj)

GREET = ["hallo", "hi", "liebe", "lieber", "guten tag", "guten morgen"]
CLOSE = ["bis bald", "tschüss", "viele grüße", "liebe grüße", "bis dann", "bis morgen"]
WOBJ = {"personal_profile": "personal_info", "simple_description": "phrases_sentences", "short_message": "short_message", "simple_form": "form_filling"}
def write(tid, fam, instr, cue, slots, mn, mx, model, lex=(), verbs=None, fields=None, obj=None):
    rubric = {"requiredSlots": [{"id": i, "description": {"vi": d, "en": d}, "variants": v, "cueProvided": c} for i, d, v, c in slots], "minTokens": mn, "maxTokens": mx}
    if verbs: rubric["requireSentenceVerbs"] = verbs
    objective = O("writing." + (obj or WOBJ[fam]))
    t = {"id": tid, "taskFamily": fam, "mode": "guided", "instruction": {"vi": instr, "en": instr}}
    if cue: t["cueFacts"] = [{"label": {"vi": a, "en": a}, "value": b} for a, b in cue]
    if fields: t["formFields"] = [{"id": a, "label": b, "slotId": c} for a, b, c in fields]
    t.update({"rubric": rubric, "modelAnswers": [model], "objectiveRefs": [objective], "lexemeRefs": lx(*lex), "scoredEligibility": True, "reserved": True, "sourceRef": "original-project"})
    tasks.append(t)
    flat = {**rubric, "requiredSlots": [{**s, "description": s["description"]["vi"]} for s in rubric["requiredSlots"]]}
    e = {"type": "simpleForm" if fields else "guidedWriting", "writingTaskId": tid}
    if not fields: e["writingMode"] = "guided"
    e["instruction"] = instr
    if cue: e["cueFacts"] = [{"label": a, "value": b} for a, b in cue]
    if fields: e["fields"] = [{"id": a, "label": b, "slotId": c} for a, b, c in fields]
    e.update({"rubric": flat, "modelAnswers": [model]})
    return e, objective

SIE = {"Sie", "Ihnen", "Ihr", "Ihre", "Ihren"}
DU = {"du", "dich", "dir", "dein", "deine", "deinen"}
def scenario(sid, reg, fam, obj, title, goal, steps, end, miss):
    base = f"de.clip.ix_{sid}"
    nodes = {}
    clip(f"{base}_miss", "message", [("A", miss)], obj)
    nodes["t_miss"] = {"kind": "terminal", "id": "t_miss", "outcome": "goal_not_met", "text": miss, "clipId": f"{base}_miss"}
    for i, (p, rp, prompt, intent, variants, concepts) in enumerate(steps):
        nxt = f"p{i+1}" if i + 1 < len(steps) else "t_ok"
        clip(f"{base}_{i}", "message", [("A", p)], obj); clip(f"{base}_{i}_s", "message", [("A", rp)], obj)
        nodes[f"p{i}"] = {"kind": "partner", "id": f"p{i}", "text": p, "clipId": f"{base}_{i}", "rephraseText": rp, "rephraseClipId": f"{base}_{i}_s", "next": f"l{i}"}
        exp = [{"intent": intent, "acceptedVariants": variants, "requiredConcepts": concepts, "next": nxt}]
        nodes[f"l{i}"] = {"kind": "learner", "id": f"l{i}", "prompt": {"vi": prompt, "en": prompt}, "expected": exp, "noMatchNext": f"r{i}", "scored": True}
        nodes[f"r{i}"] = {"kind": "partner", "id": f"r{i}", "text": rp, "clipId": f"{base}_{i}_s", "next": f"l{i}b"}
        nodes[f"l{i}b"] = {"kind": "learner", "id": f"l{i}b", "prompt": {"vi": prompt, "en": prompt}, "expected": exp, "noMatchNext": "t_miss", "scored": False}
    clip(f"{base}_end", "message", [("A", end)], obj)
    nodes["t_ok"] = {"kind": "terminal", "id": "t_ok", "outcome": "goal_met", "text": end, "clipId": f"{base}_end"}
    words = {w.strip("?!.,").lower() for n in nodes.values() if n["kind"] != "learner" for w in (n["text"] + " " + n.get("rephraseText", "")).split()}
    assert not (words & (DU if reg == "Sie" else set())), (sid, words & DU)
    scenarios.append({"id": f"de.scenario.{sid}", "title": {"vi": title, "en": title}, "goal": {"vi": goal, "en": goal}, "taskFamily": fam, "objectiveRefs": [obj],
                      "startNodeId": "p0", "nodes": nodes, "support": {"allowRepeat": True, "allowRephrase": True}, "reserved": True, "sourceRef": "original-project"})
    return {"type": "interactionScenario", "scenarioId": f"de.scenario.{sid}"}, obj
CONV, PRAC = O("interaction.everyday_conversation"), O("interaction.practical_needs")

# ---------- checkpoint items ----------
def items(prefix, rows, essential_of=lambda o: True):
    out = []
    for slug, (ex, objs) in rows:
        ex = dict(ex); ex["id"] = f"de-cpx-{prefix}-{slug}"
        objs = objs if isinstance(objs, list) else [objs]
        out.append({"id": f"de.cpi.{prefix}.{slug}", "itemVersion": 1, "exercise": ex, "objectiveTargets": objs, "essential": essential_of(objs[0])})
    return out
NONESS = {O("vocab.places_travel"), O("speaking.describe"), O("writing.form_filling"), O("gender.plurals_kein"), O("cases.accusative"),
          O("spelling.capitals_umlaut"), O("strategy.cognates_compounds"), O("word_order.verb_second")}
ess = lambda o: o not in NONESS
G, EV, RD, PL = O("greetings.basic"), O("vocab.everyday_basics"), O("reading.familiar_words"), O("vocab.places_travel")
s1 = items("s1", [
 ("greet_evening", (sel("Bạn đến nhà hàng lúc tám giờ tối. Bạn nói gì?", "Guten Abend!", ["Guten Morgen!", "Tschüss!", "Danke!"], "nativeToTarget"), G)),
 ("greet_leave", (sel("Bạn rời khỏi một cửa hàng. Bạn nói gì?", "Auf Wiedersehen!", ["Guten Tag!", "Hallo!", "Bitte!"], "nativeToTarget"), G)),
 ("greet_sorry", (sel("Bạn giẫm vào chân một người trên tàu. Bạn nói:", "Entschuldigung!", ["Danke!", "Willkommen!", "Gute Nacht!"], "nativeToTarget"), G)),
 ("vocab_cheese", (sel("phô mai", "der Käse", ["das Brot", "die Milch", "das Ei"], "nativeToTarget"), EV)),
 ("vocab_daughter", (sel("die Tochter", "con gái", ["con trai", "người mẹ", "chị/em gái"], "targetToNative", True), EV)),
 ("vocab_juice", (sel("nước ép", "der Saft", ["der Tee", "das Wasser", "der Zucker"], "nativeToTarget"), EV)),
 ("read_boy", (sel("Der Junge trinkt Milch.", "Cậu bé uống sữa.", ["Cô bé uống sữa.", "Cậu bé ăn bánh mì.", "Cậu bé uống nước."], "targetToNative"), RD)),
 ("read_cat", (sel("Die Katze isst Fisch.", "Con mèo ăn cá.", ["Con chó ăn cá.", "Con mèo uống sữa.", "Con mèo ăn bánh."], "targetToNative"), RD)),
 ("read_family", (sel("Meine Familie ist groß.", "Gia đình tôi đông người.", ["Gia đình tôi nhỏ.", "Bạn tôi cao.", "Nhà tôi to."], "targetToNative"), RD)),
 ("place_airport", (sel("sân bay", "der Flughafen", ["der Bahnhof", "das Hotel", "das Museum"], "nativeToTarget"), PL)),
 ("place_ticket", (sel("das Ticket", "tấm vé", ["tấm bản đồ", "chiếc xe đạp", "con đường"], "targetToNative", True), PL)),
 ("place_bus", (sel("Der Bus fährt in die Stadt.", "Xe buýt chạy vào thành phố.", ["Tàu chạy vào thành phố.", "Xe buýt ở nhà ga.", "Xe hơi chạy ra sân bay."], "targetToNative"), PL)),
], ess)
AR, ACC, SH, RP, NU, SP, COG, WF = O("gender.articles_basic"), O("cases.accusative"), O("verbs.sein_haben_present"), O("verbs.regular_present"), O("numbers.0_100"), O("spelling.capitals_umlaut"), O("strategy.cognates_compounds"), O("writing.familiar_words")
s2 = items("s2", [
 ("sein_wir", (conj("Wir ___ in Berlin.", "Chúng tôi ở Berlin.", "sein", "pre:1p", "sind"), [SH, WF])),
 ("sein_du", (conj("Du ___ sehr nett.", "Bạn rất dễ thương.", "sein", "pre:2s", "bist"), [SH, WF])),
 ("haben_ich", (conj("Ich ___ einen Bruder.", "Tôi có một anh/em trai.", "haben", "pre:1s", "habe"), [SH, WF])),
 ("wohnen_er", (conj("Er ___ in Wien.", "Anh ấy sống ở Wien.", "wohnen", "pre:3s", "wohnt"), [RP, WF])),
 ("spielen_ihr", (conj("Ihr ___ gern Fußball.", "Các bạn thích chơi bóng đá.", "spielen", "pre:2p", "spielt"), [RP, WF])),
 ("sprechen_du", (conj("___ du Deutsch? — Ja, du ___ gut Deutsch.", "Bạn nói tiếng Đức à? — Vâng, bạn nói tiếng Đức giỏi.", "sprechen", "pre:2s", "sprichst") if False else conj("Du ___ gut Deutsch.", "Bạn nói tiếng Đức giỏi.", "sprechen", "pre:2s", "sprichst"), [RP, WF])),
 ("art_window", (art("Fenster", "cửa sổ", ["der", "die", "das"], "das"), AR)),
 ("art_kitchen", (art("Küche", "nhà bếp", ["der", "die", "das"], "die"), AR)),
 ("art_chair", (art("Stuhl", "cái ghế", ["der", "die", "das"], "der"), AR)),
 ("art_acc_bus", (fill("Ich nehme ___ Bus.", "den", ["der", "das"], "Tôi đi xe buýt."), ACC)),
 ("art_acc_brother", (fill("Ich habe ___ Bruder.", "einen", ["ein", "eine"], "Tôi có một anh trai."), ACC)),
 ("num_47", (typ("47", "siebenundvierzig"), [NU, WF])),
 ("num_16", (typ("16", "sechzehn"), [NU, WF])),
 ("num_30", (typ("30", "dreißig", ["dreissig"]), [NU, WF])),
 ("spell_schoen", (fill("Das Wetter ist ___.", "schön", ["schon", "schöne"], "Thời tiết đẹp."), SP)),
 ("spell_strasse", (fill("Ich wohne in der Haupt___.", "straße", ["strase", "Strasze"], "Tôi sống ở phố Hauptstraße."), SP)),
 ("cog_hospital", (sel("das Krankenhaus", "bệnh viện", ["nhà nghỉ", "nhà hàng", "trường học"], "targetToNative", True), COG)),
 ("cog_get", (sel("Ich bekomme ein Geschenk.", "Tôi nhận được một món quà.", ["Tôi trở thành một món quà.", "Tôi mua một món quà.", "Tôi làm mất một món quà."], "targetToNative"), COG)),
], ess)

LF, LI, LA, LD = O("listening.familiar_words"), O("listening.short_info"), O("listening.announcements"), O("listening.short_dialogues")
RM, RN, RT = O("reading.short_messages"), O("reading.notices_info"), O("reading.short_texts")
c = lambda cid, *a, **k: clip(f"de.clip.{cid}", *a, **k)
r_ = lambda rid, *a, **k: reading(f"de.read.{rid}", *a, **k)
c("cp3_bahnhof", "word_phrase", [("A", "der Bahnhof")], LF, ["der Bahnhof"])
c("cp3_kaese", "word_phrase", [("A", "der Käse")], LF, ["der Käse"])
c("cp3_dikt_nacht", "word_phrase", [("A", "die Nacht")], LF, ["die Nacht"])
c("cp3_preis", "message", [("A", "Der Kaffee kostet drei Euro.")], LI, ["der Kaffee"], 2)
c("cp3_kurs", "message", [("A", "Der Deutschkurs beginnt um neun Uhr.")], LI, ["die Uhr"], 2)
c("cp3_party", "message", [("A", "Die Party ist am Samstag, nicht am Freitag.")], LI, ["der Samstag", "der Freitag"], 2)
c("cp3_gleis", "announcement", [("A", "Achtung, bitte! Der Zug nach Berlin fährt heute von Gleis drei.")], LA, ["der Zug"], 2)
c("cp3_laden", "announcement", [("A", "Liebe Kunden, der Supermarkt schließt in zehn Minuten.")], LA, ["schließen", "die Minute"], 2)
c("cp3_buch", "instruction", [("A", "Öffnen Sie bitte das Buch auf Seite zwanzig.")], LA, ["öffnen"], 2)
c("cp3_dikt_zug", "announcement", [("A", "Der Zug kommt.")], LA, ["der Zug", "kommen"])
c("cp3_dlg_tee", "dialogue", [("A", "Möchtest du einen Kaffee?"), ("B", "Nein, danke. Ich trinke lieber Tee.")], LD, ["der Kaffee", "der Tee"], 2)
c("cp3_dlg_wohnen", "dialogue", [("A", "Wo wohnst du?"), ("B", "Ich wohne in Hamburg, aber ich komme aus Hanoi.")], LD, ["wohnen", "kommen"], 2)
c("cp3_dlg_kino", "dialogue", [("A", "Gehen wir am Freitag ins Kino?"), ("B", "Am Freitag kann ich nicht. Am Sonntag?"), ("A", "Ja, gut!")], LD, ["der Freitag", "der Sonntag"], 2)
r_("cp3_nachricht_jonas", "message", ["Hallo Mia! Am Sonntag fahre ich mit dem Zug nach München. Der Zug fährt um acht Uhr. Kommst du mit? Jonas"], RM, ["der Sonntag", "der Zug", "die Uhr"], units=3)
r_("cp3_schild_bibliothek", "notice", ["Stadtbibliothek", "Montag bis Freitag: 9 bis 19 Uhr", "Samstag: 10 bis 14 Uhr", "Sonntag: geschlossen"], RN, ["der Montag", "der Freitag", "der Samstag", "der Sonntag"], [("Stadtbibliothek", "thư viện thành phố"), ("geschlossen", "đóng cửa")], 3, "Öffnungszeiten")
r_("cp3_text_anna", "description", ["Ich heiße Anna. Ich bin dreißig Jahre alt und wohne in Köln. Ich habe zwei Kinder und eine Katze. Am Wochenende spiele ich gern Tennis."], RT, ["das Jahr", "wohnen", "das Kind", "die Katze", "das Wochenende", "spielen"], units=3)
r_("cp3_text_paul", "narrative", ["Paul steht um sechs Uhr auf. Er trinkt einen Kaffee und fährt dann mit dem Bus zur Arbeit. Er arbeitet in einer Bäckerei."], RT, ["der Kaffee", "der Bus", "die Arbeit", "arbeiten"], [("Bäckerei", "tiệm bánh")], 3)
s3 = items("s3", [
 ("fam_bahnhof", (lc("de.clip.cp3_bahnhof", "Bạn nghe thấy gì?", "nhà ga", ["khách sạn", "sân bay", "bảo tàng"]), LF)),
 ("fam_kaese", (lc("de.clip.cp3_kaese", "Bạn nghe thấy gì?", "phô mai", ["bánh mì", "trứng", "sữa"]), LF)),
 ("fam_dikt_nacht", (dict_("de.clip.cp3_dikt_nacht", "die Nacht", ["Nacht"]), LF)),
 ("info_preis", (lc("de.clip.cp3_preis", "Cà phê giá bao nhiêu?", "Ba euro", ["Hai euro", "Mười ba euro", "Ba mươi euro"]), LI)),
 ("info_kurs", (lc("de.clip.cp3_kurs", "Khoá học tiếng Đức bắt đầu lúc mấy giờ?", "Lúc chín giờ", ["Lúc mười giờ", "Lúc một giờ", "Lúc mười chín giờ"]), LI)),
 ("info_party", (lc("de.clip.cp3_party", "Bữa tiệc vào ngày nào?", "Thứ Bảy", ["Thứ Sáu", "Chủ nhật", "Thứ Hai"]), LI)),
 ("ann_gleis", (lc("de.clip.cp3_gleis", "Tàu đi Berlin chạy từ đường ray số mấy?", "Số ba", ["Số hai", "Số tám", "Số mười ba"]), LA)),
 ("ann_laden", (lc("de.clip.cp3_laden", "Siêu thị đóng cửa khi nào?", "Sau mười phút nữa", ["Sau hai phút nữa", "Lúc mười giờ", "Ngày mai"]), LA)),
 ("ann_buch", (lc("de.clip.cp3_buch", "Bạn phải mở sách trang mấy?", "Trang hai mươi", ["Trang mười hai", "Trang hai", "Trang ba mươi"]), LA)),
 ("ann_dikt_zug", (dict_("de.clip.cp3_dikt_zug", "Der Zug kommt.", ["Der Zug kommt", "der Zug kommt"]), LA)),
 ("dlg_tee", (lc("de.clip.cp3_dlg_tee", "Người thứ hai muốn uống gì?", "Trà", ["Cà phê", "Nước", "Sữa"]), LD)),
 ("dlg_wohnen", (lc("de.clip.cp3_dlg_wohnen", "Người thứ hai sống ở đâu?", "Ở Hamburg", ["Ở Hà Nội", "Ở Berlin", "Ở München"]), LD)),
 ("dlg_kino", (lc("de.clip.cp3_dlg_kino", "Họ đi xem phim vào ngày nào?", "Chủ nhật", ["Thứ Sáu", "Thứ Bảy", "Hôm nay"]), LD)),
 ("msg_wohin", (rc("de.read.cp3_nachricht_jonas", "Jonas đi đâu vào Chủ nhật?", "Đi München bằng tàu", ["Đi München bằng xe buýt", "Đến nhà Mia", "Đi làm"]), RM)),
 ("msg_uhr", (rc("de.read.cp3_nachricht_jonas", "Tàu chạy lúc mấy giờ?", "Lúc tám giờ", ["Lúc sáu giờ", "Lúc mười giờ", "Lúc mười tám giờ"]), RM)),
 ("msg_cafe", (sel("Das Café ist heute geschlossen.", "Hôm nay quán cà phê đóng cửa.", ["Hôm nay quán cà phê mở cửa.", "Ngày mai quán cà phê đóng cửa.", "Quán cà phê ở cạnh nhà ga."], "targetToNative"), RM)),
 ("note_samstag", (rc("de.read.cp3_schild_bibliothek", "Thứ Bảy thư viện mở cửa giờ nào?", "Từ 10 đến 14 giờ", ["Từ 9 đến 19 giờ", "Cả ngày", "Đóng cửa"]), RN)),
 ("note_zu", (rc("de.read.cp3_schild_bibliothek", "Ngày nào thư viện đóng cửa?", "Chủ nhật", ["Thứ Hai", "Thứ Bảy", "Thứ Sáu"]), RN)),
 ("note_rauchen", (sel("Bitte nicht rauchen!", "Xin đừng hút thuốc!", ["Xin hãy đợi!", "Xin đừng chạy!", "Xin mời vào!"], "targetToNative"), RN)),
 ("text_anna_wo", (rc("de.read.cp3_text_anna", "Anna sống ở đâu?", "Ở Köln", ["Ở Berlin", "Ở Wien", "Ở Hamburg"]), RT)),
 ("text_anna_kinder", (rc("de.read.cp3_text_anna", "Anna có mấy đứa con?", "Hai", ["Một", "Ba", "Không có"]), RT)),
 ("text_paul", (rc("de.read.cp3_text_paul", "Paul đi làm bằng gì?", "Bằng xe buýt", ["Bằng tàu", "Bằng xe đạp", "Đi bộ"]), RT)),
], ess)

s4 = items("s4", [
 ("greet_evening", speak("de.speak.cp4_greet_evening", "formulaic", "Bạn bước vào nhà hàng lúc tám giờ tối. Hãy chào người phục vụ.", "Guten Abend", ["Guten Abend", "Hallo, guten Abend"], lex=["der Abend"])),
 ("thanks", speak("de.speak.cp4_thanks", "formulaic", "Có người đưa cho bạn một cốc nước. Hãy cảm ơn.", "Danke", ["Danke", "Danke schön", "Vielen Dank", "Danke sehr"], lex=["Danke"])),
 ("sorry", speak("de.speak.cp4_sorry", "formulaic", "Bạn va vào một người trên phố. Hãy xin lỗi.", "Entschuldigung", ["Entschuldigung", "Entschuldigen Sie", "Oh, Entschuldigung"], lex=["Entschuldigung"])),
 ("name", speak("de.speak.cp4_name", "self_intro", "Hãy nói tên của bạn.", "Ich heiße Lan", ["Ich heiße Lan", "Mein Name ist Lan", "Ich bin Lan"], cue=[("Tên", "Lan")], lex=["der Name"])),
 ("from", speak("de.speak.cp4_from", "self_intro", "Hãy nói bạn đến từ đâu.", "Ich komme aus Vietnam", ["Ich komme aus Vietnam", "Ich bin aus Vietnam"], cue=[("Quê", "Việt Nam")], lex=["kommen"])),
 ("live", speak("de.speak.cp4_live", "self_intro", "Hãy nói bạn sống ở đâu.", "Ich wohne in Leipzig", ["Ich wohne in Leipzig", "Ich lebe in Leipzig"], cue=[("Thành phố", "Leipzig")], lex=["wohnen"])),
 ("time", speak("de.speak.cp4_time", "give_info", "Hãy nói bây giờ là mấy giờ.", "Es ist neun Uhr", ["Es ist neun Uhr", "Es ist neun", "Neun Uhr"], cue=[("Giờ", "9:00")], lex=["die Uhr"])),
 ("price", speak("de.speak.cp4_price", "give_info", "Hãy nói cái bánh giá bao nhiêu.", "Der Kuchen kostet fünf Euro", ["Der Kuchen kostet fünf Euro", "Er kostet fünf Euro", "Fünf Euro"], cue=[("Giá", "5 €")], lex=["der Kuchen"])),
 ("age", speak("de.speak.cp4_age", "give_info", "Hãy nói bạn bao nhiêu tuổi.", "Ich bin fünfundzwanzig Jahre alt", ["Ich bin fünfundzwanzig Jahre alt", "Ich bin fünfundzwanzig"], cue=[("Tuổi", "25")], lex=["das Jahr", "alt"])),
 ("dog", speak("de.speak.cp4_dog", "describe", "Hãy nói con chó trong hình nhỏ.", "Der Hund ist klein", ["Der Hund ist klein", "Das ist ein kleiner Hund"], emoji="🐕", lex=["der Hund", "klein"])),
 ("car", speak("de.speak.cp4_car", "describe", "Hãy nói chiếc xe hơi trong hình mới.", "Das Auto ist neu", ["Das Auto ist neu", "Das ist ein neues Auto"], emoji="🚗✨", lex=["das Auto", "neu"])),
 ("city", speak("de.speak.cp4_city", "describe", "Hãy nói thành phố trong hình đẹp.", "Die Stadt ist schön", ["Die Stadt ist schön", "Das ist eine schöne Stadt"], emoji="🏙️", lex=["die Stadt", "schön"])),
], ess)

s5 = items("s5", [
 ("profile_lan", write("de.write.cp5_profile_lan", "personal_profile", "Bạn là Lan. Hãy tự giới thiệu bằng cách viết — tên, tuổi và thành phố, bằng câu hoàn chỉnh.", [("Tên", "Lan"), ("Tuổi", "28"), ("Thành phố", "Leipzig")],
   [("name", "tên", ["ich heiße lan", "mein name ist lan", "ich bin lan"], True), ("age", "tuổi", ["28", "achtundzwanzig"], True), ("city", "thành phố", ["in leipzig"], True)], 8, 30, "Ich heiße Lan. Ich bin 28 Jahre alt. Ich wohne in Leipzig.", ["der Name", "das Jahr", "wohnen"], ["heiße", "bin", "wohne", "lebe"])),
 ("profile_tuan", write("de.write.cp5_profile_tuan", "personal_profile", "Bạn là Tuấn. Hãy viết về bạn: tên, quê và nơi bạn sống.", [("Tên", "Tuấn"), ("Quê", "Việt Nam"), ("Thành phố", "Dresden")],
   [("name", "tên", ["ich heiße tuấn", "mein name ist tuấn", "ich bin tuấn"], True), ("from", "quê", ["aus vietnam"], True), ("city", "thành phố", ["in dresden"], True)], 8, 30, "Ich heiße Tuấn. Ich komme aus Vietnam und wohne in Dresden.", ["kommen", "wohnen"], ["heiße", "komme", "wohne", "bin", "lebe"])),
 ("profile_mai", write("de.write.cp5_profile_mai", "personal_profile", "Bạn là Mai. Hãy viết tên của bạn và những tiếng bạn nói.", [("Tên", "Mai"), ("Ngôn ngữ", "tiếng Việt, tiếng Đức")],
   [("name", "tên", ["ich heiße mai", "mein name ist mai", "ich bin mai"], True), ("vi", "tiếng Việt", ["vietnamesisch"], True), ("de", "tiếng Đức", ["deutsch"], True)], 6, 25, "Ich heiße Mai. Ich spreche Vietnamesisch und Deutsch.", ["sprechen"], ["heiße", "spreche", "bin"])),
 ("like_music", write("de.write.cp5_like_music", "simple_description", "Hãy viết một câu nói rằng bạn thích nghe nhạc.", None,
   [("music", "nghe nhạc", ["musik"], False), ("like", "bạn thích", ["gern", "gerne", "mag", "liebe"], False)], 3, 12, "Ich höre gern Musik.", ["die Musik", "gern"], ["höre", "mag", "liebe"])),
 ("sister", write("de.write.cp5_sister", "simple_description", "Hãy viết hai câu về chị gái bạn: tên chị ấy là Hoa và chị ấy làm việc ở Berlin.", [("Tên", "Hoa"), ("Thành phố", "Berlin")],
   [("name", "tên chị gái", ["sie heißt hoa", "ihr name ist hoa", "meine schwester heißt hoa"], True), ("work", "nơi làm việc", ["arbeitet in berlin"], True)], 5, 20, "Meine Schwester heißt Hoa. Sie arbeitet in Berlin.", ["die Schwester", "arbeiten"], ["heißt", "arbeitet", "ist"])),
 ("room", write("de.write.cp5_room", "simple_description", "Hãy viết hai câu tả căn phòng: cái giường to, cái bàn nhỏ.", None,
   [("bed", "cái giường to", ["das bett ist groß", "das bett ist gross"], False), ("table", "cái bàn nhỏ", ["der tisch ist klein"], False)], 6, 16, "Das Bett ist groß. Der Tisch ist klein.", ["das Bett", "der Tisch", "groß", "klein"], ["ist"])),
 ("msg_kino", write("de.write.cp5_msg_kino", "short_message", "Hãy viết lời nhắn cho Tom: chào anh ấy, rồi hẹn đi xem phim lúc tám giờ.", [("Gửi", "Tom"), ("Việc gì", "xem phim"), ("Giờ", "8:00")],
   [("greeting", "lời chào", GREET, False), ("addressee", "tên người nhận", ["tom"], True), ("what", "xem phim", ["kino", "film"], True), ("time", "giờ hẹn", ["um acht", "um 8", "um 20 uhr", "um zwanzig uhr"], True)], 5, 20, "Hallo Tom, gehen wir um acht Uhr ins Kino?", ["der Film"])),
 ("msg_oma", write("de.write.cp5_msg_oma", "short_message", "Hãy nhắn cho bà: chào bà, nói rằng bạn đến vào Chủ nhật, rồi chào kết.", [("Gửi", "bà (Oma)"), ("Ngày", "Chủ nhật")],
   [("greeting", "lời chào", GREET, False), ("day", "ngày bạn đến", ["sonntag"], True), ("closing", "lời chào kết", CLOSE, False)], 5, 20, "Liebe Oma, ich komme am Sonntag. Bis bald!", ["der Sonntag", "kommen"])),
 ("msg_krank", write("de.write.cp5_msg_krank", "short_message", "Hãy nhắn cho đồng nghiệp Lisa: chào, nói rằng hôm nay bạn bị ốm, rồi chào kết.", [("Gửi", "Lisa")],
   [("greeting", "lời chào", GREET, False), ("sick", "bạn bị ốm", ["krank"], False), ("closing", "lời chào kết", CLOSE, False)], 5, 20, "Hallo Lisa, ich bin heute krank. Viele Grüße!", [])),
 ("form_kurs", write("de.write.cp5_form_kurs", "simple_form", "Hãy điền phiếu đăng ký khoá học với các thông tin trên thẻ.", [("Tên", "Lan"), ("Họ", "Nguyen"), ("Tuổi", "28")],
   [("first", "tên của bạn", ["lan"], True), ("last", "họ của bạn", ["nguyễn"], True), ("age", "tuổi", ["28", "achtundzwanzig"], True)], 2, 12, "Lan | Nguyen | 28", ["der Name"], fields=[("vorname", "Vorname", "first"), ("nachname", "Nachname", "last"), ("alter", "Alter", "age")])),
 ("form_arzt", write("de.write.cp5_form_arzt", "simple_form", "Hãy điền phiếu ở phòng khám với các thông tin trên thẻ.", [("Họ tên", "Tuấn Pham"), ("Thành phố", "Dresden"), ("Điện thoại", "0160 445566")],
   [("name", "họ tên", ["tuấn pham", "pham"], True), ("city", "thành phố", ["dresden"], True), ("phone", "số điện thoại", ["0160 445566", "0160445566"], True)], 2, 12, "Tuấn Pham | Dresden | 0160 445566", ["die Stadt", "das Telefon"], fields=[("name", "Name", "name"), ("wohnort", "Wohnort", "city"), ("telefon", "Telefon", "phone")])),
 ("form_hotel", write("de.write.cp5_form_hotel", "simple_form", "Hãy điền phiếu khách sạn với các thông tin trên thẻ.", [("Họ tên", "Mai Le"), ("Nước", "Việt Nam"), ("Số đêm", "2")],
   [("name", "họ tên", ["mai le", "le"], True), ("country", "nước", ["vietnam"], True), ("nights", "số đêm", ["2", "zwei"], True)], 2, 12, "Mai Le | Vietnam | 2", ["das Hotel"], fields=[("name", "Name", "name"), ("land", "Land", "country"), ("naechte", "Nächte", "nights")])),
], ess)

s6 = items("s6", [
 ("kurs", scenario("cp_kurs", "du", "conversation", CONV, "Bạn mới ở lớp học", "Làm quen với một bạn cùng lớp: nói tên và quê.",
   [("Hallo! Ich bin Jonas. Und du?", "Wie heißt du?", "Hãy nói tên bạn: Lan.", "name", ["Ich bin Lan.", "Ich heiße Lan.", "Hallo, ich bin Lan."], [["lan"]]),
    ("Woher kommst du?", "Aus welchem Land kommst du?", "Hãy nói bạn đến từ Việt Nam.", "origin", ["Ich komme aus Vietnam.", "Aus Vietnam."], [["vietnam"]])],
   "Cool! Bis morgen!", "Kein Problem. Bis morgen!")),
 ("nachbarin", scenario("cp_nachbarin", "Sie", "conversation", CONV, "Gặp hàng xóm", "Chào bà hàng xóm và trả lời bà ấy.",
   [("Guten Morgen! Wie geht es Ihnen?", "Wie geht es Ihnen heute?", "Hãy chào và nói bạn khoẻ.", "fine", ["Guten Morgen! Gut, danke.", "Gut, danke.", "Danke, sehr gut."], [["gut"]]),
    ("Wohnen Sie schon lange hier?", "Seit wann wohnen Sie hier?", "Hãy nói bạn sống ở đây được một năm.", "time", ["Seit einem Jahr.", "Ich wohne seit einem Jahr hier.", "Ein Jahr."], [["jahr"]])],
   "Schön! Einen schönen Tag noch!", "Kein Problem. Auf Wiedersehen!")),
 ("party", scenario("cp_party", "du", "conversation", CONV, "Lời mời dự tiệc", "Nhận lời mời của bạn và hỏi giờ.",
   [("Ich mache am Samstag eine Party. Kommst du?", "Kommst du am Samstag zu meiner Party?", "Hãy nhận lời.", "accept", ["Ja, gern!", "Ja, ich komme.", "Ja, sehr gern."], [["ja", "gern"]]),
    ("Super! Hast du noch eine Frage?", "Möchtest du etwas wissen?", "Hãy hỏi bữa tiệc bắt đầu lúc mấy giờ.", "ask_time", ["Wann beginnt die Party?", "Um wie viel Uhr?", "Wann fängt die Party an?"], [["wann", "uhr"]])],
   "Um acht Uhr. Bis Samstag!", "Kein Problem. Bis bald!")),
 ("cafe", scenario("cp_cafe", "Sie", "transaction", PRAC, "Ở quán cà phê", "Gọi một cốc trà và hỏi giá.",
   [("Guten Tag! Was möchten Sie?", "Was darf es sein?", "Hãy gọi một cốc trà.", "order", ["Einen Tee, bitte.", "Ich möchte einen Tee.", "Ich nehme einen Tee."], [["tee"]]),
    ("Gern. Sonst noch etwas?", "Möchten Sie noch etwas?", "Hãy hỏi giá bao nhiêu.", "price", ["Was kostet das?", "Wie viel kostet das?", "Was macht das?"], [["kostet", "macht"]])],
   "Zwei Euro fünfzig, bitte. Danke!", "Kein Problem. Auf Wiedersehen!")),
 ("fahrkarte", scenario("cp_fahrkarte", "Sie", "transaction", PRAC, "Mua vé tàu", "Mua một vé đi Hamburg.",
   [("Guten Tag! Wohin möchten Sie fahren?", "Wohin fahren Sie?", "Hãy nói bạn muốn đi Hamburg.", "dest", ["Nach Hamburg, bitte.", "Ich möchte nach Hamburg.", "Nach Hamburg."], [["hamburg"]]),
    ("Einfach oder hin und zurück?", "Nur hin oder auch zurück?", "Hãy nói bạn chỉ cần vé một chiều.", "oneway", ["Einfach, bitte.", "Nur hin, bitte.", "Einfach."], [["einfach", "nur hin"]])],
   "Das macht dreißig Euro. Gute Reise!", "Kein Problem. Auf Wiedersehen!")),
 ("apotheke", scenario("cp_apotheke", "Sie", "information_exchange", PRAC, "Hỏi đường đến hiệu thuốc", "Hỏi hiệu thuốc ở đâu và hỏi lại cho rõ.",
   [("Ja, bitte? Kann ich Ihnen helfen?", "Suchen Sie etwas?", "Hãy hỏi hiệu thuốc ở đâu.", "ask", ["Wo ist die Apotheke?", "Entschuldigung, wo ist die Apotheke?", "Wo ist hier eine Apotheke?"], [["wo"], ["apotheke"]]),
    ("Die Apotheke ist am Marktplatz, gleich links.", "Am Marktplatz, links.", "Hãy cảm ơn.", "thank", ["Danke schön!", "Vielen Dank!", "Danke!"], [["danke", "dank"]])],
   "Bitte schön!", "Kein Problem. Auf Wiedersehen!")),
])
for it in s6: it["essential"] = True

c("a1cap_museum", "message", [("A", "Das Museum ist von zehn bis achtzehn Uhr geöffnet.")], LI, ["das Museum", "die Uhr"], 2)
c("a1cap_bus", "announcement", [("A", "Der Bus Nummer zwölf kommt heute zwanzig Minuten später.")], LI, ["der Bus", "die Minute"], 2)
c("a1cap_apotheke", "message", [("A", "Die Apotheke ist in der Goethestraße, neben der Post.")], LI, ["die Straße", "die Post"], 2)
c("a1cap_preis", "dialogue", [("A", "Was kosten die Äpfel?"), ("B", "Ein Kilo kostet zwei Euro.")], LI, ["der Apfel"], 2)
r_("a1cap_zettel_vater", "message", ["Hallo Kinder! Ich bin im Supermarkt. Um sechs Uhr bin ich zu Hause. Das Essen ist im Kühlschrank. Papa"], RM, ["die Uhr"], [("Kühlschrank", "tủ lạnh")], 3)
r_("a1cap_einladung", "message", ["Liebe Mai, am Freitag habe ich Geburtstag! Die Party beginnt um sieben Uhr bei mir. Bring bitte Musik mit! Deine Lisa"], RM, ["der Freitag", "der Geburtstag", "die Musik"], units=3)
cap_rows = [
 ("listen_museum", (lc("de.clip.a1cap_museum", "Bảo tàng mở cửa giờ nào?", "Từ mười giờ đến mười tám giờ", ["Từ tám giờ đến mười giờ", "Cả ngày lẫn đêm", "Từ hai giờ đến tám giờ"]), LI)),
 ("listen_bus", (lc("de.clip.a1cap_bus", "Hôm nay xe buýt số mười hai thế nào?", "Đến muộn hai mươi phút", ["Đến sớm hai mươi phút", "Không chạy", "Đến muộn mười hai phút"]), LI)),
 ("listen_apotheke", (lc("de.clip.a1cap_apotheke", "Hiệu thuốc ở đâu?", "Ở phố Goethe, cạnh bưu điện", ["Ở nhà ga", "Cạnh siêu thị", "Ở phố Goethe, cạnh ngân hàng"]), LI)),
 ("listen_preis", (lc("de.clip.a1cap_preis", "Một ký táo giá bao nhiêu?", "Hai euro", ["Mười hai euro", "Một euro", "Hai mươi euro"]), LI)),
 ("read_vater_wo", (rc("de.read.a1cap_zettel_vater", "Bố đang ở đâu?", "Ở siêu thị", ["Ở nhà", "Ở chỗ làm", "Ở nhà ga"]), RM)),
 ("read_vater_wann", (rc("de.read.a1cap_zettel_vater", "Mấy giờ bố về nhà?", "Lúc sáu giờ", ["Lúc bảy giờ", "Lúc sáu giờ rưỡi", "Lúc mười sáu giờ"]), RM)),
 ("read_einl_was", (rc("de.read.a1cap_einladung", "Vì sao Lisa làm tiệc?", "Vì là sinh nhật Lisa", ["Vì Mai đến chơi", "Vì là cuối tuần", "Vì có khách"]), RM)),
 ("read_einl_bring", (rc("de.read.a1cap_einladung", "Mai nên mang gì đến?", "Nhạc", ["Bánh", "Hoa", "Đồ uống"]), RM)),
 ("speak_time", speak("de.speak.a1cap_time", "give_info", "Hãy nói bây giờ là mấy giờ.", "Es ist zehn Uhr", ["Es ist zehn Uhr", "Es ist zehn", "Zehn Uhr"], cue=[("Giờ", "10:00")], lex=["die Uhr"])),
 ("speak_price", speak("de.speak.a1cap_price", "give_info", "Hãy nói cuốn sách giá bao nhiêu.", "Das Buch kostet zwölf Euro", ["Das Buch kostet zwölf Euro", "Es kostet zwölf Euro", "Zwölf Euro"], cue=[("Giá", "12 €")])),
 ("speak_count", speak("de.speak.a1cap_count", "give_info", "Hãy nói bạn có mấy anh chị em.", "Ich habe zwei Geschwister", ["Ich habe zwei Geschwister", "Ich habe zwei Brüder", "Zwei"], cue=[("Anh chị em", "2")], concepts=[["zwei", "2"]])),
 ("speak_day", speak("de.speak.a1cap_day", "give_info", "Hãy nói hôm nay là thứ mấy.", "Heute ist Montag", ["Heute ist Montag", "Es ist Montag", "Montag"], cue=[("Hôm nay", "thứ Hai")], lex=["der Montag"])),
 ("write_note_train", write("de.write.a1cap_note_train", "short_message", "Hãy viết lời nhắn ngắn cho Paul: chào anh ấy, và nói rằng tàu chạy lúc chín giờ.", [("Gửi", "Paul"), ("Việc gì", "tàu hoả"), ("Giờ", "9:00")],
   [("greeting", "lời chào", GREET, False), ("addressee", "tên người nhận", ["paul"], True), ("what", "tàu hoả", ["zug"], True), ("time", "giờ", ["um neun", "um 9"], True)], 5, 20, "Hallo Paul, der Zug fährt um neun Uhr.", ["der Zug"])),
 ("write_note_shop", write("de.write.a1cap_note_shop", "short_message", "Hãy nhắn cho Anna: chào, nói bạn đang ở cửa hàng và về nhà lúc năm giờ.", [("Gửi", "Anna"), ("Ở đâu", "cửa hàng"), ("Giờ", "5:00")],
   [("greeting", "lời chào", GREET, False), ("place", "cửa hàng", ["geschäft", "laden", "supermarkt"], True), ("time", "giờ về", ["um fünf", "um 5", "um 17 uhr"], True)], 5, 20, "Hallo Anna, ich bin im Geschäft. Um fünf bin ich zu Hause.", ["das Geschäft"])),
 ("write_note_cafe", write("de.write.a1cap_note_cafe", "short_message", "Hãy nhắn cho Ben: hẹn gặp ở quán cà phê vào thứ Sáu, rồi chào kết.", [("Gửi", "Ben"), ("Ở đâu", "quán cà phê"), ("Ngày", "thứ Sáu")],
   [("place", "quán cà phê", ["café", "kaffee"], True), ("day", "ngày hẹn", ["freitag"], True), ("closing", "lời chào kết", CLOSE, False)], 5, 20, "Hallo Ben, wir treffen uns am Freitag im Café. Bis dann!", ["der Freitag", "treffen"])),
 ("write_note_late", write("de.write.a1cap_note_late", "short_message", "Hãy nhắn cho thầy giáo: chào, nói rằng hôm nay bạn đến muộn mười phút.", [("Gửi", "thầy Becker"), ("Muộn", "10 phút")],
   [("greeting", "lời chào", ["guten tag", "guten morgen", "hallo", "lieber herr becker", "sehr geehrter herr becker"], False), ("late", "đến muộn", ["später", "spät"], False), ("minutes", "mười phút", ["zehn minuten", "10 minuten"], True)], 5, 20, "Guten Morgen, Herr Becker, ich komme heute zehn Minuten später.", ["die Minute", "spät"])),
 ("talk_nachbar", scenario("a1cap_nachbar", "Sie", "conversation", CONV, "Nói chuyện với hàng xóm mới", "Chào hàng xóm mới, nói tên và nơi làm việc.",
   [("Guten Tag! Ich bin Herr Weber. Und wie heißen Sie?", "Wie ist Ihr Name?", "Hãy nói tên bạn: Minh.", "name", ["Ich heiße Minh.", "Mein Name ist Minh.", "Ich bin Minh."], [["minh"]]),
    ("Und was machen Sie beruflich?", "Wo arbeiten Sie?", "Hãy nói bạn làm việc ở bệnh viện.", "job", ["Ich arbeite im Krankenhaus.", "Im Krankenhaus.", "Ich arbeite in einem Krankenhaus."], [["krankenhaus"]])],
   "Interessant! Auf gute Nachbarschaft!", "Kein Problem. Auf Wiedersehen!")),
 ("talk_telefon", scenario("a1cap_telefon", "du", "conversation", CONV, "Gọi điện cho bạn", "Gọi cho một người bạn và hẹn gặp ngày mai.",
   [("Hallo, hier ist Sara!", "Hallo, Sara hier!", "Hãy chào và nói tên bạn: Lan.", "greet", ["Hallo Sara, hier ist Lan.", "Hallo, hier ist Lan.", "Hi Sara, ich bin's, Lan."], [["lan"]]),
    ("Hast du morgen Zeit?", "Kannst du morgen?", "Hãy nói ngày mai bạn rảnh.", "free", ["Ja, morgen habe ich Zeit.", "Ja, ich habe Zeit.", "Ja, gern."], [["ja", "gern"]])],
   "Super, bis morgen!", "Kein Problem. Bis bald!")),
 ("talk_julia", scenario("a1cap_julia", "du", "conversation", CONV, "Gặp Julia ở công viên", "Trò chuyện ngắn với Julia về sở thích.",
   [("Hi! Was machst du gern am Wochenende?", "Was ist dein Hobby?", "Hãy nói bạn thích đọc sách.", "hobby", ["Ich lese gern.", "Ich lese gern Bücher.", "Lesen."], [["lese", "lesen"]]),
    ("Toll! Ich auch. Trinkst du einen Kaffee mit mir?", "Möchtest du einen Kaffee?", "Hãy nhận lời.", "yes", ["Ja, gern!", "Ja, sehr gern.", "Gerne!"], [["ja", "gern"]])],
   "Super, komm mit!", "Kein Problem. Ein anderes Mal!")),
 ("talk_arzt", scenario("a1cap_arzt", "Sie", "conversation", CONV, "Đặt lịch khám", "Gọi phòng khám và đặt lịch hẹn vào thứ Hai.",
   [("Praxis Dr. Klein, guten Tag.", "Hier ist die Praxis Dr. Klein.", "Hãy chào và nói bạn muốn đặt lịch hẹn.", "termin", ["Guten Tag, ich möchte einen Termin.", "Ich brauche einen Termin, bitte.", "Einen Termin, bitte."], [["termin"]]),
    ("Geht es am Montag um zehn Uhr?", "Montag, zehn Uhr — passt das?", "Hãy nói được.", "ok", ["Ja, das geht.", "Ja, gut.", "Ja, Montag um zehn ist gut."], [["ja"]])],
   "Gut, dann bis Montag!", "Kein Problem. Auf Wiedersehen!")),
]
cap = items("cap", cap_rows)
for it in cap: it["essential"] = True
form_a = [f"de.cpi.cap.{s}" for s in ["listen_museum", "listen_bus", "read_vater_wo", "read_vater_wann", "speak_time", "speak_price", "write_note_train", "write_note_shop", "talk_nachbar", "talk_telefon"]]
form_b = [f"de.cpi.cap.{s}" for s in ["listen_apotheke", "listen_preis", "read_einl_was", "read_einl_bring", "speak_count", "speak_day", "write_note_cafe", "write_note_late", "talk_julia", "talk_arzt"]]

def cp(sec, title, desc, its, crit=2, forms=None, cid=None):
    r = {"id": cid or f"de.checkpoint.section-{sec}", "checkpointVersion": 1, "formVersion": 1, "sectionId": f"de-vi:section-{sec}",
         "title": {"vi": title, "en": title}, "description": {"vi": desc, "en": desc}, "items": its}
    if forms: r["forms"] = forms
    r["criteria"] = {"minItemsPerObjective": crit, "demonstratedShare": 0.66}
    return r
CPS = [
 cp(1, "Kiểm tra Phần 1", "Thể hiện những gì bạn làm được với kiến thức nền — lời chào, từ hằng ngày, và đọc những câu tiếng Đức quen thuộc.", s1),
 cp(2, "Kiểm tra Phần 2", "Kiểm tra những viên gạch nền: mạo từ der/die/das, sein và haben, đuôi động từ, số đếm và chính tả tiếng Đức.", s2),
 cp(3, "Kiểm tra Phần 3", "Nghe và đọc: từ quen thuộc, thông báo, đoạn hội thoại ngắn, tin nhắn, biển báo và đoạn văn ngắn.", s3),
 cp(4, "Kiểm tra Phần 4", "Nói thành tiếng: chào hỏi, giới thiệu bản thân, nói thông tin và tả đồ vật.", s4),
 cp(5, "Kiểm tra Phần 5", "Viết: giới thiệu bản thân, câu ngắn, tin nhắn ngắn và điền biểu mẫu.", s5),
 cp(6, "Kiểm tra Phần 6", "Hội thoại: trò chuyện hằng ngày và lo những việc thiết thực bằng tiếng Đức.", s6, crit=3),
 cp(6, "Bài tổng kết A1", "Bài tổng kết: nghe, đọc, nói, viết và hội thoại — mỗi kỹ năng một phần nhỏ. Kết quả là ước tính theo khung CEFR, không phải chứng chỉ.", cap,
    forms=[{"formId": "a", "itemIds": form_a}, {"formId": "b", "itemIds": form_b}], cid="de.checkpoint.a1-capstone"),
]

# ---------- placement ----------
c("pl_milch", "word_phrase", [("A", "die Milch")], LF, ["die Milch"])
c("pl_durchsage", "announcement", [("A", "Der Zug nach Köln fährt heute um zehn Uhr.")], LA, ["der Zug", "die Uhr"], 2)
c("pl_kasse", "announcement", [("A", "Kasse drei ist jetzt geöffnet.")], LA, [], 1)
r_("pl_schild_cafe", "notice", ["Café am Markt", "Montag bis Samstag: 8 bis 18 Uhr", "Sonntag: Ruhetag"], RN, ["der Montag", "der Samstag", "der Sonntag"], [("Ruhetag", "ngày nghỉ")], 2, "Öffnungszeiten")
r_("pl_nachricht", "message", ["Hallo Tom! Wir essen morgen Abend im Restaurant. Kommst du auch? Lena"], RM, ["der Abend"], units=2)
def pli(prefix, slug, ex_obj):
    ex, obj = ex_obj
    ex = dict(ex); ex["id"] = f"de-plx-{prefix}-{slug}"
    return {"id": f"de.pli.{prefix}.{slug}", "itemVersion": 1, "exercise": ex, "objectiveTargets": [obj]}
def cluster(cid, obj, anchor, its): return {"id": f"de.pcluster.{cid}", "objectiveId": obj, "anchorLessonId": f"de-vi:{anchor}", "items": its}
STAGES = [
 {"id": "de.pstage.foundations", "title": {"vi": "Nền tảng", "en": "Foundations"}, "clusters": [
   cluster("everyday", EV, "u0-l0", [pli("s1", "bread", (sel("bánh mì", "das Brot", ["das Wasser", "der Apfel", "die Milch"], "nativeToTarget"), EV)),
                                    pli("s1", "woman", (sel("die Frau", "người phụ nữ", ["người đàn ông", "cô bé", "đứa trẻ"], "targetToNative", True), EV))]),
   cluster("greetings", G, "u1-l0", [pli("s1", "morning", (sel("Buổi sáng, bạn bước vào tiệm bánh. Bạn nói:", "Guten Morgen!", ["Gute Nacht!", "Tschüss!", "Danke!"], "nativeToTarget"), G)),
                                     pli("s1", "thanks", (sel("Có người giúp bạn. Bạn nói:", "Danke!", ["Hallo!", "Tschüss!", "Guten Abend!"], "nativeToTarget"), G))]),
   cluster("reading", RD, "u2-l0", [pli("s1", "girl_apple", (sel("Das Mädchen isst einen Apfel.", "Cô bé ăn một quả táo.", ["Cậu bé ăn một quả táo.", "Cô bé uống nước.", "Cô bé ăn bánh mì."], "targetToNative"), RD)),
                                    pli("s1", "father_coffee", (sel("Der Vater trinkt Kaffee.", "Người bố uống cà phê.", ["Người mẹ uống cà phê.", "Người bố uống trà.", "Người bố ăn bánh."], "targetToNative"), RD))]),
   cluster("places", PL, "u4-l0", [pli("s1", "station", (sel("nhà ga", "der Bahnhof", ["der Flughafen", "das Hotel", "die Straße"], "nativeToTarget"), PL))]),
 ]},
 {"id": "de.pstage.building_blocks", "title": {"vi": "Viên gạch nền", "en": "Building blocks"}, "clusters": [
   cluster("articles", AR, "ua-l0", [pli("s2", "art_bed", (art("Bett", "cái giường", ["der", "die", "das"], "das"), AR)),
                                     pli("s2", "art_door", (art("Tür", "cửa ra vào", ["der", "die", "das"], "die"), AR))]),
   cluster("accusative", ACC, "ua-l3", [pli("s2", "acc_key", (fill("Ich suche ___ Schlüssel.", "den", ["der", "dem"], "Tôi đang tìm chìa khoá."), ACC))]),
   cluster("sein_haben", SH, "ub-l0", [pli("s2", "sein_sel", (sel("Chúng tôi là sinh viên.", "Wir sind Studenten.", ["Wir haben Studenten.", "Wir seid Studenten.", "Wir bist Studenten."], "nativeToTarget"), SH)),
                                       pli("s2", "haben_sie", (conj("Sie ___ eine Katze.", "Cô ấy có một con mèo.", "haben", "pre:3s", "hat"), SH))]),
   cluster("regular", RP, "ub-l1", [pli("s2", "wohnen_du", (conj("Wo ___ du?", "Bạn sống ở đâu?", "wohnen", "pre:2s", "wohnst"), RP))]),
   cluster("numbers", NU, "ud-l0", [pli("s2", "num_21", (typ("21", "einundzwanzig"), NU)), pli("s2", "num_13", (typ("13", "dreizehn"), NU))]),
   cluster("spelling", SP, "ue-l0", [pli("s2", "spell_mueller", (fill("Meine ___ wohnt in Hanoi.", "Mutter", ["mutter", "Muter"], "Mẹ tôi sống ở Hà Nội."), SP))]),
 ]},
 {"id": "de.pstage.reception", "title": {"vi": "Hiểu tiếng Đức", "en": "Understanding German"}, "clusters": [
   cluster("listen_words", LF, "uf-l0", [pli("s3", "listen_milch", (lc("de.clip.pl_milch", "Bạn nghe thấy gì?", "sữa", ["nước", "bánh mì", "trà"]), LF))]),
   cluster("read_notices", RN, "ug-l0", [pli("s3", "schild_tage", (rc("de.read.pl_schild_cafe", "Quán cà phê mở cửa những ngày nào?", "Thứ Hai đến thứ Bảy", ["Hằng ngày", "Thứ Bảy và Chủ nhật", "Thứ Ba đến thứ Sáu"]), RN)),
                                         pli("s3", "schild_sonntag", (rc("de.read.pl_schild_cafe", "Chủ nhật quán thế nào?", "Nghỉ", ["Mở từ 8 giờ", "Mở cả ngày", "Mở đến 18 giờ"]), RN))]),
   cluster("read_messages", RM, "ug-l1", [pli("s3", "nachricht_wann", (rc("de.read.pl_nachricht", "Bữa tối ở nhà hàng là khi nào?", "Tối mai", ["Tối nay", "Sáng mai", "Thứ Bảy tới"]), RM))]),
   cluster("listen_announcements", LA, "uh-l0", [pli("s3", "durchsage_uhr", (lc("de.clip.pl_durchsage", "Tàu đi Köln chạy lúc mấy giờ?", "Lúc mười giờ", ["Lúc hai giờ", "Lúc mười hai giờ", "Lúc mười một giờ"]), LA)),
                                                 pli("s3", "kasse", (lc("de.clip.pl_kasse", "Quầy thu ngân số mấy vừa mở?", "Số ba", ["Số hai", "Số tám", "Số mười ba"]), LA))]),
 ]},
 {"id": "de.pstage.production", "title": {"vi": "Nói tiếng Đức", "en": "Speaking German"}, "clusters": [
   cluster("speak_formulaic", O("speaking.formulaic"), "uk-l0", [
     pli("s4", "greet_shop", speak("de.speak.pl4_greet_shop", "formulaic", "Buổi sáng bạn bước vào một cửa hàng nhỏ. Hãy chào người bán hàng.", "Guten Morgen", ["Guten Morgen", "Hallo, guten Morgen", "Guten Tag"], lex=["der Morgen"])),
     pli("s4", "bye", speak("de.speak.pl4_bye", "formulaic", "Bạn rời khỏi văn phòng. Hãy chào tạm biệt lịch sự.", "Auf Wiedersehen", ["Auf Wiedersehen", "Tschüss", "Schönen Tag noch"])),
     pli("s4", "please", speak("de.speak.pl4_please", "formulaic", "Bạn muốn xin một cốc nước. Hãy nói thật lịch sự.", "Ein Wasser, bitte", ["Ein Wasser, bitte", "Wasser, bitte", "Ich möchte ein Wasser, bitte"], lex=["das Wasser"], concepts=[["wasser"], ["bitte"]]))]),
   cluster("speak_info", O("speaking.give_info"), "um-l0", [
     pli("s4", "apples", speak("de.speak.pl4_apples", "give_info", "Hãy nói có bao nhiêu quả táo.", "Das sind drei Äpfel", ["Das sind drei Äpfel", "Drei Äpfel", "Es gibt drei Äpfel"], cue=[("Táo", "3")], emoji="🍎🍎🍎", lex=["der Apfel"], concepts=[["drei", "3"]])),
     pli("s4", "time", speak("de.speak.pl4_time", "give_info", "Hãy nói bây giờ là mấy giờ.", "Es ist acht Uhr", ["Es ist acht Uhr", "Es ist acht", "Acht Uhr"], cue=[("Giờ", "8:00")], lex=["die Uhr"])),
     pli("s4", "price", speak("de.speak.pl4_price", "give_info", "Hãy nói tấm vé giá bao nhiêu.", "Das Ticket kostet zehn Euro", ["Das Ticket kostet zehn Euro", "Es kostet zehn Euro", "Zehn Euro"], cue=[("Giá", "10 €")], lex=["das Ticket"]))]),
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
print(len(clips), "clips", len(readings), "readings", len(speech), "speech", len(tasks), "tasks", len(scenarios), "scenarios",
      [len(x["items"]) for x in CPS], "placement", n_pl)

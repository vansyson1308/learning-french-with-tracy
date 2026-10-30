"""it-vi section 4 (speaking): 30 speech items, their model clips, 16 lessons.
Writes content/it/_drafts/speech/OUTPUT.jsonl, appends model clips to the listening OUTPUT, writes S4 lesson records to argv[2].
usage: python -I it-speech-s4.py <repo root> <out.jsonl>"""
import json, os, sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from it_refs import refs

ROOT = sys.argv[1] + "/content/it"
OBJ = {"k": "it.obj.speaking.formulaic", "l": "it.obj.speaking.self_intro", "m": "it.obj.speaking.give_info", "n": "it.obj.speaking.describe"}
FAM = {"k": "formulaic_exchange", "l": "self_introduction", "m": "information_giving", "n": "description"}
# (slug, elicitation, instruction-vi | None, target, variants, vi translation, cueFacts | None, cueEmoji | None)
ITEMS = {
 "k": [
  ("rep_ciao", "repetition", None, "Ciao!", ["Ciao"], "Chào bạn!", None, None),
  ("greet_morning", "situation_prompt", "Buổi sáng, bạn bước vào một quán cà phê. Hãy chào người bán hàng.", "Buongiorno!", ["Buongiorno", "Salve", "Buongiorno a tutti"], "Xin chào!", None, None),
  ("rep_grazie", "repetition", None, "Grazie mille!", ["Grazie mille", "Grazie"], "Cảm ơn nhiều!", None, None),
  ("thank", "situation_prompt", "Người bán đưa bạn ly cà phê. Hãy cảm ơn.", "Grazie!", ["Grazie", "Grazie mille", "Grazie tante"], "Cảm ơn!", None, None),
  ("rep_buonasera", "repetition", None, "Buonasera!", ["Buonasera"], "Chào buổi tối!", None, None),
  ("greet_evening", "situation_prompt", "Buổi tối bạn gặp bà hàng xóm lớn tuổi. Hãy chào lịch sự.", "Buonasera!", ["Buonasera", "Buonasera, signora", "Buonasera signora Rossi"], "Chào buổi tối!", None, None),
  ("bye", "situation_prompt", "Bạn chia tay một người bạn thân. Hãy chào tạm biệt kiểu thân mật.", "Ciao!", ["Ciao", "Ciao, a presto", "A presto"], "Tạm biệt!", None, None),
  ("rep_scusi", "repetition", None, "Scusi!", ["Scusi"], "Xin lỗi!", None, None),
  ("excuse", "situation_prompt", "Trên tàu, bạn vô tình chạm vào một người lạ. Hãy xin lỗi.", "Scusi!", ["Scusi", "Mi scusi", "Oh, scusi"], "Xin lỗi!", None, None),
 ],
 "l": [
  ("rep_name", "repetition", None, "Mi chiamo Minh.", ["Mi chiamo Minh"], "Tôi tên là Minh.", None, None),
  ("name", "information_prompt", "Hãy nói tên của bạn.", "Mi chiamo Minh.", ["Mi chiamo Minh", "Il mio nome è Minh", "Sono Minh"], "Tôi tên là Minh.", [("Tên", "Minh")], None),
  ("rep_from", "repetition", None, "Sono vietnamita.", ["Sono vietnamita"], "Tôi là người Việt Nam.", None, None),
  ("from", "information_prompt", "Hãy nói bạn đến từ đâu.", "Sono di Hanoi.", ["Sono di Hanoi", "Vengo da Hanoi"], "Tôi đến từ Hà Nội.", [("Quê", "Hà Nội")], None),
  ("live", "information_prompt", "Hãy nói bạn đang sống ở đâu.", "Abito a Roma.", ["Abito a Roma", "Vivo a Roma"], "Tôi sống ở Roma.", [("Thành phố", "Roma")], None),
  ("speak", "information_prompt", "Hãy nói bạn nói những thứ tiếng nào.", "Parlo vietnamita e italiano.", ["Parlo vietnamita e italiano", "Parlo vietnamita e un po' di italiano"], "Tôi nói tiếng Việt và tiếng Ý.", [("Tiếng", "Việt, Ý")], None),
  ("work", "information_prompt", "Hãy nói bạn làm việc ở đâu.", "Lavoro in un albergo.", ["Lavoro in un albergo", "Lavoro in albergo"], "Tôi làm việc ở một khách sạn.", [("Nơi làm việc", "khách sạn")], None),
  ("like", "semantic_prompt", "Hãy nói bạn thích cà phê.", "Mi piace il caffè.", ["Mi piace il caffè", "Il caffè mi piace"], "Tôi thích cà phê.", None, "☕"),
 ],
 "m": [
  ("rep_dieci", "repetition", None, "Costa dieci euro.", ["Costa dieci euro", "Dieci euro"], "Giá mười euro.", None, None),
  ("price", "information_prompt", "Người khách hỏi giá cà phê. Hãy trả lời.", "Costa tre euro.", ["Costa tre euro", "Tre euro", "Il caffè costa tre euro"], "Giá ba euro.", [("Giá", "3 euro")], None),
  ("children", "information_prompt", "Hãy nói bạn có mấy đứa con.", "Ho due figli.", ["Ho due figli", "Due figli"], "Tôi có hai đứa con.", [("Con", "2")], None),
  ("time", "information_prompt", "Có người hỏi giờ. Hãy nói giờ.", "Sono le otto.", ["Sono le otto", "Le otto", "Otto"], "Bây giờ là tám giờ.", [("Giờ", "8:00")], "🕗"),
  ("rep_mezza", "repetition", None, "Sono le due e mezza.", ["Sono le due e mezza", "Sono le due e mezzo"], "Bây giờ là hai giờ rưỡi.", None, None),
  ("day", "information_prompt", "Hãy nói hôm nay là thứ mấy.", "Oggi è lunedì.", ["Oggi è lunedì", "Lunedì"], "Hôm nay là thứ Hai.", [("Hôm nay", "thứ Hai")], None),
  ("age", "information_prompt", "Hãy nói tuổi của bạn.", "Ho vent'anni.", ["Ho venti anni", "Venti anni", "Vent'anni"], "Tôi hai mươi tuổi.", [("Tuổi", "20")], None),
 ],
 "n": [
  ("rep_grande", "repetition", None, "La casa è grande.", ["La casa è grande"], "Ngôi nhà lớn.", None, None),
  ("house", "picture_prompt", "Hãy nói ngôi nhà trong hình lớn.", "La casa è grande.", ["La casa è grande", "È una casa grande"], "Ngôi nhà lớn.", None, "🏠"),
  ("cat", "picture_prompt", "Hãy nói con mèo trong hình nhỏ.", "Il gatto è piccolo.", ["Il gatto è piccolo", "È un gatto piccolo"], "Con mèo nhỏ.", None, "🐈"),
  ("car", "picture_prompt", "Hãy nói chiếc ô tô trong hình cũ.", "La macchina è vecchia.", ["La macchina è vecchia", "È una macchina vecchia"], "Chiếc ô tô cũ.", None, "🚗"),
  ("phone", "picture_prompt", "Hãy nói chiếc điện thoại trong hình mới.", "Il telefono è nuovo.", ["Il telefono è nuovo", "È un telefono nuovo"], "Chiếc điện thoại mới.", None, "📱"),
  ("rep_nuovo", "repetition", None, "Il telefono è nuovo.", ["Il telefono è nuovo"], "Chiếc điện thoại mới.", None, None),
 ],
}
items, clips, by = [], [], {}
for u, lst in ITEMS.items():
    for slug, elic, instr, target, variants, vi, facts, emoji in lst:
        sid = f"it.speak.{u}_{slug}"
        cid = f"it.clip.u{u}_model_{slug}"
        rep = elic == "repetition"
        lex = refs(target)
        prompt = {"instruction": {"vi": instr or "Nghe, rồi tự nói lại.", "en": "Listen, then say it yourself." if rep else "Say it in Italian."}}
        if facts:
            prompt["cueFacts"] = [{"label": {"vi": a, "en": a}, "value": b} for a, b in facts]
        if emoji:
            prompt["cueEmoji"] = emoji
        items.append({"id": sid, "taskFamily": FAM[u], "elicitationType": elic, "prompt": prompt, "target": target, "acceptedVariants": [target.rstrip("!.")] + [v for v in variants if v != target.rstrip("!.")],
                      "objectiveRefs": [OBJ[u]], "lexemeRefs": lex, "evidenceLexemeRefs": [] if rep else lex,
                      "assistancePolicy": {"allowContextualBias": rep, "revealTargetAfterAttempts": None if rep else 2}, "scoredEligibility": not rep,
                      "modelAudioRef": cid, "recognitionLocale": "it-IT", "allowedAttempts": 2, "reserved": False, "sourceRef": "original-project"})
        clips.append({"id": cid, "kind": "word_phrase", "segments": [{"speaker": "A", "text": target}], "objectiveRefs": [OBJ[u]], "lexemeRefs": lex,
                      "sourceRef": "original-project", "authoringSpec": {"informationUnits": 1, "inferenceDemand": "locate"}, "scoredPlaybackPolicy": {"maxPlays": 2, "rate": 1}})
        by[sid] = (items[-1], cid, vi)

os.makedirs(os.path.join(ROOT, "_drafts", "speech"), exist_ok=True)
with open(os.path.join(ROOT, "_drafts", "speech", "OUTPUT.jsonl"), "w", encoding="utf-8", newline="\n") as f:
    for it in items:
        f.write(json.dumps(it, ensure_ascii=False) + "\n")
with open(os.path.join(ROOT, "_drafts", "listening", "OUTPUT.jsonl"), "a", encoding="utf-8", newline="\n") as f:
    for c in clips:
        f.write(json.dumps(c, ensure_ascii=False) + "\n")

C = "it-vi"
pos = [0]


def place(correct, wrong):
    p = pos[0] % 4
    pos[0] += 1
    o = list(wrong[:3])
    o.insert(p, correct)
    return o, p


def speak(sid):
    it, cid, _ = by[sid]
    if it["elicitationType"] == "repetition":
        return {"type": "speakRepetition", "speechItemId": sid, "modelClipId": cid, "target": it["target"], "acceptedVariants": it["acceptedVariants"], "objectiveTargets": it["objectiveRefs"]}
    return {"type": "speakProduction", "speechItemId": sid, "instruction": it["prompt"]["instruction"]["vi"], "target": it["target"], "acceptedVariants": it["acceptedVariants"],
            "evidenceLexemeRefs": it["evidenceLexemeRefs"], "revealTargetAfterAttempts": 2, "allowContextualBias": False, "modelClipId": cid, "allowedAttempts": 2, "objectiveTargets": it["objectiveRefs"],
            **({"cueEmoji": it["prompt"]["cueEmoji"]} if "cueEmoji" in it["prompt"] else {}),
            **({"cueFacts": [{"label": f["label"]["vi"], "value": f["value"]} for f in it["prompt"]["cueFacts"]]} if "cueFacts" in it["prompt"] else {})}


def sel(sid, wrong_vi):
    it, _, vi = by[sid]
    o, p = place(vi, wrong_vi)
    return {"type": "select", "mode": "targetToNative", "prompt": it["target"], "audioTarget": it["target"], "options": [{"text": t} for t in o], "correct": p}


def wb(sid, extra):
    it, _, vi = by[sid]
    ans = it["target"].rstrip(".!?").replace(",", "").split()
    toks = ans + [x for x in extra if x not in ans]
    order = sorted(range(len(toks)), key=lambda i: ((i * 5 + pos[0]) % 7, i))
    pos[0] += 1
    return {"type": "wordBank", "direction": "nativeToTarget", "prompt": vi, "tokens": [toks[i] for i in order], "answer": ans}


def fill(sentence, ans, wrong, vi):
    o, p = place(ans, wrong)
    return {"type": "fillBlank", "sentence": sentence, "translation": vi, "audioTarget": sentence.replace("___", ans), "options": o, "correct": p}


def typ(vi, it, alts):
    return {"type": "typeAnswer", "mode": "produceTarget", "prompt": vi, "audioTarget": it, "answer": it, "alternatives": alts}


K = lambda s: f"it.speak.k_{s}"
Lm = lambda s: f"it.speak.l_{s}"
M = lambda s: f"it.speak.m_{s}"
N = lambda s: f"it.speak.n_{s}"
LESSONS = {
 "uk-l0": [speak(K("rep_ciao")), sel(K("greet_morning"), ["Chúc ngủ ngon!", "Tạm biệt!", "Cảm ơn!"]), speak(K("greet_morning")), typ("Xin chào (ban ngày)!", "Buongiorno!", ["Buongiorno"]), fill("___, signora!", "Buongiorno", ["Buonanotte", "Grazie", "Prego"], "Chào bà ạ!")],
 "uk-l1": [speak(K("rep_grazie")), sel(K("thank"), ["Xin lỗi!", "Xin chào!", "Tạm biệt!"]), speak(K("thank")), typ("Cảm ơn nhiều!", "Grazie mille!", ["Grazie mille"]), fill("Grazie ___!", "mille", ["cento", "per", "molto"], "Cảm ơn nhiều!")],
 "uk-l2": [speak(K("rep_buonasera")), speak(K("greet_evening")), sel(K("bye"), ["Xin chào buổi sáng!", "Cảm ơn!", "Chào buổi tối!"]), speak(K("bye")), typ("Hẹn sớm gặp lại!", "A presto!", ["A presto"])],
 "uk-l3": [speak(K("rep_scusi")), speak(K("excuse")), sel(K("excuse"), ["Cảm ơn!", "Chào buổi sáng!", "Tạm biệt!"]), typ("Xin lỗi (lịch sự)!", "Scusi!", ["Scusi", "Mi scusi!"]), fill("Scusa, ___ capisco.", "non", ["no", "ne", "mi"], "Xin lỗi, mình không hiểu.")],
 "ul-l0": [speak(Lm("rep_name")), speak(Lm("name")), sel(Lm("name"), ["Tôi đến từ Việt Nam.", "Tôi sống ở Roma.", "Tôi làm việc ở đây."]), wb(Lm("name"), ["sono", "nome", "ti"]), fill("Mi ___ Minh.", "chiamo", ["chiama", "chiami", "abito"], "Tôi tên là Minh.")],
 "ul-l1": [speak(Lm("rep_from")), speak(Lm("from")), sel(Lm("from"), ["Tôi sống ở Hà Nội.", "Tôi tên là Minh.", "Tôi nói tiếng Việt."]), wb(Lm("from"), ["a", "abito", "ho"]), fill("Sono ___ Hanoi.", "di", ["a", "in", "su"], "Tôi đến từ Hà Nội.")],
 "ul-l2": [speak(Lm("speak")), speak(Lm("like")), sel(Lm("like"), ["Tôi uống trà.", "Tôi không uống cà phê.", "Tôi mua cà phê."]), speak(Lm("work")), typ("Tôi thích trà.", "Mi piace il tè.", ["Mi piace il tè"])],
 "ul-l3": [speak(Lm("live")), sel(Lm("live"), ["Tôi đến từ Roma.", "Tôi làm việc ở Roma.", "Tôi thích Roma."]), wb(Lm("live"), ["vengo", "da", "sono"]), fill("___ a Roma.", "Abito", ["Abiti", "Abita", "Vengo"], "Tôi sống ở Roma."), typ("Tôi sống ở Milano.", "Abito a Milano.", ["Abito a Milano"])],
 "um-l0": [speak(M("children")), sel(M("children"), ["Tôi có ba đứa con.", "Tôi có một con chó.", "Tôi không có con."]), wb(M("children"), ["tre", "ha", "figlio"]), fill("Ho ___ figli.", "due", ["dodici", "dieci", "venti"], "Tôi có hai đứa con."), typ("Tôi có ba đứa con.", "Ho tre figli.", ["Ho tre figli"])],
 "um-l1": [speak(M("rep_dieci")), speak(M("price")), sel(M("price"), ["Giá mười ba euro.", "Giá ba mươi euro.", "Không mất tiền."]), fill("___ tre euro.", "Costa", ["Costare", "Ha", "Ho"], "Giá ba euro."), typ("Giá hai mươi euro.", "Costa venti euro.", ["Costa 20 euro."])],
 "um-l2": [speak(M("time")), speak(M("rep_mezza")), sel(M("rep_mezza"), ["Bây giờ là ba giờ rưỡi.", "Bây giờ là hai giờ.", "Bây giờ là ba giờ."]), wb(M("time"), ["ora", "mezza", "alle"]), fill("Sono le ___.", "otto", ["ottanta", "ottavo", "ora"], "Bây giờ là tám giờ.")],
 "um-l3": [speak(M("day")), speak(M("age")), sel(M("day"), ["Hôm qua là thứ Hai.", "Hôm nay là thứ Sáu.", "Ngày mai là thứ Hai."]), wb(M("age"), ["anno", "sono", "dodici"]), typ("Hôm nay là thứ Sáu.", "Oggi è venerdì.", ["Oggi è venerdì"])],
 "un-l0": [speak(N("rep_grande")), speak(N("house")), sel(N("house"), ["Ngôi nhà nhỏ.", "Ngôi nhà cũ.", "Ngôi nhà mới."]), fill("La casa è ___.", "grande", ["piccola", "nuova", "vecchia"], "Ngôi nhà lớn."), wb(N("house"), ["piccola", "sono", "una"])],
 "un-l1": [speak(N("cat")), sel(N("cat"), ["Con mèo lớn.", "Con chó nhỏ.", "Con mèo già."]), wb(N("cat"), ["grande", "la", "sono"]), fill("Il gatto è ___.", "piccolo", ["grande", "vecchio", "nuovo"], "Con mèo nhỏ."), typ("Con chó lớn.", "Il cane è grande.", ["Il cane è grande"])],
 "un-l2": [speak(N("car")), speak(N("phone")), sel(N("car"), ["Chiếc ô tô mới.", "Chiếc ô tô lớn.", "Chiếc ô tô nhỏ."]), fill("Il telefono è ___.", "nuovo", ["vecchio", "grande", "piccolo"], "Chiếc điện thoại mới."), wb(N("phone"), ["vecchio", "la", "sono"])],
 "un-l3": [speak(N("rep_nuovo")), fill("La macchina è ___.", "vecchia", ["vecchio", "vecchie", "vecchi"], "Chiếc ô tô cũ."), wb(N("car"), ["nuova", "il", "sono"]), typ("Ngôi nhà cũ.", "La casa è vecchia.", ["La casa è vecchia"]), sel(N("rep_nuovo"), ["Chiếc điện thoại cũ.", "Chiếc điện thoại lớn.", "Chiếc điện thoại nhỏ."])],
}
recs = []
for lid, exs in LESSONS.items():
    out = []
    for i, e in enumerate(exs):
        e = dict(e)
        e["id"] = f"{C}:{lid}-e{i}"
        out.append(e)
    recs.append({"lessonId": f"{C}:{lid}", "exercises": out})
with open(sys.argv[2], "w", encoding="utf-8", newline="\n") as f:
    for r in recs:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
print(len(items), "items", len(clips), "clips", len(recs), "lessons", sum(len(r["exercises"]) for r in recs), dict(Counter(e["type"] for r in recs for e in r["exercises"])))

"""de-vi section 4 (speaking): 30 speech items, their model clips, 16 lessons.
Writes content/de/_drafts/speech/OUTPUT.jsonl, appends model clips to listening OUTPUT, prints S4 lesson records to argv[1]."""
import json, os, re, sys

ROOT = r"C:\src\lft\content\de"
LEX = json.load(open(os.path.join(ROOT, "lexicon", "lexemes.json"), encoding="utf-8"))["lexemes"]
IDS = {l["id"] for l in LEX}
FORMS = {}
for l in LEX:
    if l["partOfSpeech"] in ("pronoun", "determiner", "preposition", "conjunction"):
        continue
    for f in {l["lookupForm"], l["lemma"]}:
        FORMS.setdefault(f.lower(), l["id"])
INFL = {"heiße": "heißen", "komme": "kommen", "wohne": "wohnen", "spreche": "sprechen", "arbeite": "arbeiten", "trinke": "trinken", "kostet": "kosten",
        "habe": "haben", "ist": "sein", "bin": "sein"}
def refs(text):
    out = []
    for tok in re.findall(r"[\wäöüÄÖÜß]+", text):
        t = tok.lower()
        i = FORMS.get(INFL.get(t, t)) or FORMS.get(t)
        if i and i in IDS and i not in out:
            out.append(i)
    return out

OBJ = {"k": "de.obj.speaking.formulaic", "l": "de.obj.speaking.self_intro", "m": "de.obj.speaking.give_info", "n": "de.obj.speaking.describe"}
FAM = {"k": "formulaic_exchange", "l": "self_introduction", "m": "information_giving", "n": "description"}
# (slug, elicitation, instruction-vi | None, target, variants, vi translation, cueFacts | None, cueEmoji | None)
ITEMS = {
 "k": [
  ("rep_hallo", "repetition", None, "Hallo!", ["Hallo"], "Xin chào!", None, None),
  ("greet_morning", "situation_prompt", "Buổi sáng, bạn bước vào tiệm bánh. Hãy chào người bán hàng.", "Guten Morgen!", ["Guten Morgen", "Hallo, guten Morgen", "Morgen"], "Chào buổi sáng!", None, None),
  ("rep_danke", "repetition", None, "Danke schön!", ["Danke schön", "Danke"], "Cảm ơn nhiều!", None, None),
  ("thank", "situation_prompt", "Người bán đưa bạn cốc cà phê. Hãy cảm ơn.", "Danke!", ["Danke", "Danke schön", "Vielen Dank"], "Cảm ơn!", None, None),
  ("rep_abend", "repetition", None, "Guten Abend!", ["Guten Abend"], "Chào buổi tối!", None, None),
  ("greet_evening", "situation_prompt", "Buổi tối bạn gặp hàng xóm lớn tuổi. Hãy chào lịch sự.", "Guten Abend!", ["Guten Abend", "Guten Abend, Frau Müller", "Guten Abend, Herr Müller"], "Chào buổi tối!", None, None),
  ("bye", "situation_prompt", "Bạn chia tay một người bạn thân. Hãy chào tạm biệt kiểu thân mật.", "Tschüss!", ["Tschüss", "Tschüss, bis bald", "Bis bald"], "Tạm biệt!", None, None),
  ("rep_entschuldigung", "repetition", None, "Entschuldigung!", ["Entschuldigung"], "Xin lỗi!", None, None),
  ("excuse", "situation_prompt", "Trên tàu, bạn vô tình chạm vào một người. Hãy xin lỗi.", "Entschuldigung!", ["Entschuldigung", "Entschuldigen Sie", "Oh, Entschuldigung"], "Xin lỗi!", None, None),
 ],
 "l": [
  ("rep_name", "repetition", None, "Ich heiße Minh.", ["Ich heiße Minh"], "Tôi tên là Minh.", None, None),
  ("name", "information_prompt", "Hãy nói tên của bạn.", "Ich heiße Minh.", ["Ich heiße Minh", "Mein Name ist Minh", "Ich bin Minh"], "Tôi tên là Minh.", [("Tên", "Minh")], None),
  ("rep_from", "repetition", None, "Ich komme aus Vietnam.", ["Ich komme aus Vietnam"], "Tôi đến từ Việt Nam.", None, None),
  ("from", "information_prompt", "Hãy nói bạn đến từ đâu.", "Ich komme aus Vietnam.", ["Ich komme aus Vietnam", "Ich bin aus Vietnam"], "Tôi đến từ Việt Nam.", [("Quê", "Việt Nam")], None),
  ("live", "information_prompt", "Hãy nói bạn đang sống ở đâu.", "Ich wohne in Berlin.", ["Ich wohne in Berlin", "Ich lebe in Berlin"], "Tôi sống ở Berlin.", [("Thành phố", "Berlin")], None),
  ("speak", "information_prompt", "Hãy nói bạn nói những thứ tiếng nào.", "Ich spreche Vietnamesisch und Deutsch.", ["Ich spreche Vietnamesisch und Deutsch", "Ich spreche Vietnamesisch und ein bisschen Deutsch"], "Tôi nói tiếng Việt và tiếng Đức.", [("Tiếng", "Việt, Đức")], None),
  ("work", "information_prompt", "Hãy nói bạn làm việc ở đâu.", "Ich arbeite in einem Hotel.", ["Ich arbeite in einem Hotel", "Ich arbeite im Hotel"], "Tôi làm việc ở một khách sạn.", [("Nơi làm việc", "khách sạn")], None),
  ("like", "semantic_prompt", "Hãy nói bạn thích uống cà phê.", "Ich trinke gern Kaffee.", ["Ich trinke gern Kaffee", "Ich trinke gerne Kaffee"], "Tôi thích uống cà phê.", None, "☕"),
 ],
 "m": [
  ("rep_zehn", "repetition", None, "Das kostet zehn Euro.", ["Das kostet zehn Euro", "Zehn Euro"], "Cái đó giá mười euro.", None, None),
  ("price", "information_prompt", "Người khách hỏi giá cà phê. Hãy trả lời.", "Das kostet drei Euro.", ["Das kostet drei Euro", "Drei Euro", "Der Kaffee kostet drei Euro"], "Cái đó giá ba euro.", [("Giá", "3 euro")], None),
  ("children", "information_prompt", "Hãy nói bạn có mấy đứa con.", "Ich habe zwei Kinder.", ["Ich habe zwei Kinder", "Zwei Kinder"], "Tôi có hai đứa con.", [("Con", "2")], None),
  ("time", "information_prompt", "Có người hỏi giờ. Hãy nói giờ.", "Es ist acht Uhr.", ["Es ist acht Uhr", "Acht Uhr"], "Bây giờ là tám giờ.", [("Giờ", "8:00")], "🕗"),
  ("rep_halb", "repetition", None, "Es ist halb drei.", ["Es ist halb drei"], "Bây giờ là hai giờ rưỡi.", None, None),
  ("day", "information_prompt", "Hãy nói hôm nay là thứ mấy.", "Heute ist Montag.", ["Heute ist Montag", "Montag"], "Hôm nay là thứ Hai.", [("Hôm nay", "thứ Hai")], None),
  ("age", "information_prompt", "Hãy nói tuổi của bạn.", "Ich bin zwanzig Jahre alt.", ["Ich bin zwanzig Jahre alt", "Ich bin zwanzig"], "Tôi hai mươi tuổi.", [("Tuổi", "20")], None),
 ],
 "n": [
  ("rep_gross", "repetition", None, "Das Haus ist groß.", ["Das Haus ist groß"], "Ngôi nhà to.", None, None),
  ("house", "picture_prompt", "Hãy nói ngôi nhà trong hình to.", "Das Haus ist groß.", ["Das Haus ist groß", "Das ist ein großes Haus"], "Ngôi nhà to.", None, "🏠"),
  ("cat", "picture_prompt", "Hãy nói con mèo trong hình nhỏ.", "Die Katze ist klein.", ["Die Katze ist klein", "Das ist eine kleine Katze"], "Con mèo nhỏ.", None, "🐈"),
  ("car", "picture_prompt", "Hãy nói chiếc ô tô trong hình cũ.", "Das Auto ist alt.", ["Das Auto ist alt", "Das ist ein altes Auto"], "Chiếc ô tô cũ.", None, "🚗"),
  ("phone", "picture_prompt", "Hãy nói chiếc điện thoại trong hình mới.", "Das Handy ist neu.", ["Das Handy ist neu", "Das ist ein neues Handy"], "Chiếc điện thoại mới.", None, "📱"),
  ("rep_neu", "repetition", None, "Das Handy ist neu.", ["Das Handy ist neu"], "Chiếc điện thoại mới.", None, None),
 ],
}
items, clips, by = [], [], {}
for u, lst in ITEMS.items():
    for slug, elic, instr, target, variants, vi, facts, emoji in lst:
        sid = f"de.speak.{u}_{slug}"
        cid = f"de.clip.u{u}_model_{slug}"
        rep = elic == "repetition"
        lex = refs(target)
        prompt = {"instruction": {"vi": instr or "Nghe, rồi tự nói lại.", "en": "Listen, then say it yourself." if rep else "Say it in German."}}
        if facts: prompt["cueFacts"] = [{"label": {"vi": a, "en": a}, "value": b} for a, b in facts]
        if emoji: prompt["cueEmoji"] = emoji
        items.append({"id": sid, "taskFamily": FAM[u], "elicitationType": elic, "prompt": prompt, "target": target, "acceptedVariants": [target.rstrip("!.")] + [v for v in variants if v != target.rstrip("!.")],
                      "objectiveRefs": [OBJ[u]], "lexemeRefs": lex, "evidenceLexemeRefs": [] if rep else lex,
                      "assistancePolicy": {"allowContextualBias": rep, "revealTargetAfterAttempts": None if rep else 2}, "scoredEligibility": not rep,
                      "modelAudioRef": cid, "recognitionLocale": "de-DE", "allowedAttempts": 2, "reserved": False, "sourceRef": "original-project"})
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

# ---- lessons
C = "de-vi"
pos = [0]
def place(correct, wrong):
    p = pos[0] % 4
    pos[0] += 1
    o = list(wrong[:3]); o.insert(p, correct)
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
    order = sorted(range(len(toks)), key=lambda i: ((i * 5 + pos[0]) % 7, i)); pos[0] += 1
    return {"type": "wordBank", "direction": "nativeToTarget", "prompt": vi, "tokens": [toks[i] for i in order], "answer": ans}
def fill(sentence, ans, wrong, vi):
    o, p = place(ans, wrong)
    return {"type": "fillBlank", "sentence": sentence, "translation": vi, "audioTarget": sentence.replace("___", ans), "options": o, "correct": p}
def typ(vi, de, alts):
    return {"type": "typeAnswer", "mode": "produceTarget", "prompt": vi, "audioTarget": de, "answer": de, "alternatives": alts}

K = lambda s: f"de.speak.k_{s}"; Lm = lambda s: f"de.speak.l_{s}"; M = lambda s: f"de.speak.m_{s}"; N = lambda s: f"de.speak.n_{s}"
LESSONS = {
 "uk-l0": [speak(K("rep_hallo")), sel(K("greet_morning"), ["Chúc ngủ ngon!", "Tạm biệt!", "Cảm ơn!"]), speak(K("greet_morning")), wb(K("greet_morning"), ["Abend", "Gute", "Tag"]), fill("Guten ___!", "Morgen", ["Nacht", "Danke", "Tschüss"], "Chào buổi sáng!")],
 "uk-l1": [speak(K("rep_danke")), sel(K("thank"), ["Xin lỗi!", "Xin chào!", "Tạm biệt!"]), speak(K("thank")), typ("Cảm ơn nhiều!", "Danke schön!", ["Danke schön", "Vielen Dank!"]), fill("Vielen ___!", "Dank", ["Danke", "Tag", "Abend"], "Cảm ơn nhiều!")],
 "uk-l2": [speak(K("rep_abend")), speak(K("greet_evening")), sel(K("bye"), ["Xin chào!", "Cảm ơn!", "Chào buổi tối!"]), speak(K("bye")), wb(K("greet_evening"), ["Morgen", "Gute", "Nacht"])],
 "uk-l3": [speak(K("rep_entschuldigung")), speak(K("excuse")), sel(K("excuse"), ["Cảm ơn!", "Chào buổi sáng!", "Tạm biệt!"]), typ("Xin lỗi!", "Entschuldigung!", ["Entschuldigung", "Entschuldigen Sie!"]), fill("Entschuldigen ___!", "Sie", ["du", "ich", "wir"], "Xin lỗi (lịch sự)!")],
 "ul-l0": [speak(Lm("rep_name")), speak(Lm("name")), sel(Lm("name"), ["Tôi đến từ Việt Nam.", "Tôi sống ở Berlin.", "Tôi làm việc ở đây."]), wb(Lm("name"), ["bin", "Name", "komme"]), fill("Ich ___ Minh.", "heiße", ["heißt", "heißen", "wohne"], "Tôi tên là Minh.")],
 "ul-l1": [speak(Lm("rep_from")), speak(Lm("from")), sel(Lm("from"), ["Tôi sống ở Việt Nam.", "Tôi tên là Minh.", "Tôi nói tiếng Việt."]), wb(Lm("from"), ["in", "wohne", "bin"]), fill("Ich komme ___ Vietnam.", "aus", ["in", "nach", "von"], "Tôi đến từ Việt Nam.")],
 "ul-l2": [speak(Lm("speak")), speak(Lm("like")), sel(Lm("like"), ["Tôi uống trà.", "Tôi không uống cà phê.", "Tôi mua cà phê."]), speak(Lm("work")), typ("Tôi thích uống trà.", "Ich trinke gern Tee.", ["Ich trinke gerne Tee."])],
 "ul-l3": [speak(Lm("live")), sel(Lm("live"), ["Tôi đến từ Berlin.", "Tôi làm việc ở Berlin.", "Tôi thích Berlin."]), wb(Lm("live"), ["komme", "aus", "bin"]), fill("Ich ___ in Berlin.", "wohne", ["wohnst", "wohnt", "komme"], "Tôi sống ở Berlin."), typ("Tôi sống ở Köln.", "Ich wohne in Köln.", ["Ich wohne in Köln"])],
 "um-l0": [speak(M("children")), sel(M("children"), ["Tôi có ba đứa con.", "Tôi có một con chó.", "Tôi không có con."]), wb(M("children"), ["drei", "hat", "Kind"]), fill("Ich habe ___ Kinder.", "zwei", ["zwölf", "zehn", "zwanzig"], "Tôi có hai đứa con."), typ("Tôi có ba đứa con.", "Ich habe drei Kinder.", ["Ich habe drei Kinder"])],
 "um-l1": [speak(M("rep_zehn")), speak(M("price")), sel(M("price"), ["Cái đó giá mười ba euro.", "Cái đó giá ba mươi euro.", "Cái đó miễn phí."]), fill("Das ___ drei Euro.", "kostet", ["kosten", "ist", "hat"], "Cái đó giá ba euro."), typ("Cái đó giá hai mươi euro.", "Das kostet zwanzig Euro.", ["Das kostet 20 Euro."])],
 "um-l2": [speak(M("time")), speak(M("rep_halb")), sel(M("rep_halb"), ["Bây giờ là ba giờ rưỡi.", "Bây giờ là hai giờ.", "Bây giờ là ba giờ."]), wb(M("time"), ["Uhr", "halb", "um"]), fill("Es ist ___ Uhr.", "acht", ["achte", "achtzig", "Acht"], "Bây giờ là tám giờ.")],
 "um-l3": [speak(M("day")), speak(M("age")), sel(M("day"), ["Hôm qua là thứ Hai.", "Hôm nay là thứ Sáu.", "Ngày mai là thứ Hai."]), wb(M("age"), ["Jahr", "bist", "zwölf"]), typ("Hôm nay là thứ Sáu.", "Heute ist Freitag.", ["Heute ist Freitag"])],
 "un-l0": [speak(N("rep_gross")), speak(N("house")), sel(N("house"), ["Ngôi nhà nhỏ.", "Ngôi nhà cũ.", "Ngôi nhà mới."]), fill("Das Haus ist ___.", "groß", ["klein", "neu", "alt"], "Ngôi nhà to."), wb(N("house"), ["klein", "sind", "ein"])],
 "un-l1": [speak(N("cat")), sel(N("cat"), ["Con mèo to.", "Con chó nhỏ.", "Con mèo già."]), wb(N("cat"), ["groß", "der", "sind"]), fill("Die Katze ist ___.", "klein", ["groß", "alt", "neu"], "Con mèo nhỏ."), typ("Con chó to.", "Der Hund ist groß.", ["Der Hund ist groß"])],
 "un-l2": [speak(N("car")), speak(N("phone")), sel(N("car"), ["Chiếc ô tô mới.", "Chiếc ô tô to.", "Chiếc ô tô nhỏ."]), fill("Das Handy ist ___.", "neu", ["alt", "groß", "klein"], "Chiếc điện thoại mới."), wb(N("phone"), ["alt", "die", "sind"])],
 "un-l3": [speak(N("rep_neu")), fill("Das Auto ist ___.", "alt", ["neu", "klein", "groß"], "Chiếc ô tô cũ."), wb(N("car"), ["neu", "der", "sind"]), typ("Ngôi nhà cũ.", "Das Haus ist alt.", ["Das Haus ist alt"]), sel(N("rep_neu"), ["Chiếc điện thoại cũ.", "Chiếc điện thoại to.", "Chiếc điện thoại nhỏ."])],
}
recs = []
for lid, exs in LESSONS.items():
    out = []
    for i, e in enumerate(exs):
        e = dict(e); e["id"] = f"{C}:{lid}-e{i}"; out.append(e)
    recs.append({"lessonId": f"{C}:{lid}", "exercises": out})
with open(sys.argv[1], "w", encoding="utf-8", newline="\n") as f:
    for r in recs:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
from collections import Counter
print(len(items), "items", len(clips), "clips", len(recs), "lessons", sum(len(r["exercises"]) for r in recs), dict(Counter(e["type"] for r in recs for e in r["exercises"])))

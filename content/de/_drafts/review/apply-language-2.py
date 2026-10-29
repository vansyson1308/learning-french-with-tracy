"""Second pass after apply-answers.py and apply-language.py: the validators reject a few results.
- dative-chunks: the new fillBlank distractor "dem" is a dative before Section 4 → "ein".
  (The word-bank alternatives were flagged token by token: the gate now reads them as sentences,
  scripts/lib/languages/de-gates.ts.)
- stories: urlaub_im_internet no longer uses Reise (de-lg-89) → it leaves newLexemes.
- context gate: six syllabus lexemes lost their only context sentence through the story fixes; each
  gets one back in the same story, in natural German (Toilette, Zahl, Ausländer, Erwachsene,
  ausziehen, abfliegen).
- writing: the German folds (ß → ss, digits → words) make some authored slot variants identical
  ("ich bin 25" = "ich bin fünfundzwanzig", "bahnhofstrasse 5" = "bahnhofstraße 5"); the later
  duplicate is removed in the writing task and in every mirror of its rubric (pack, exam).
decisions-answers.json / decisions-language.json are updated.
usage: python -I apply-language-2.py"""
import json, pathlib, re, unicodedata

R = pathlib.Path(r"C:\src\lft-air")
DA = R / "content/de/_drafts/review/decisions-answers.json"
DL = R / "content/de/_drafts/review/decisions-language.json"
da = json.loads(DA.read_text(encoding="utf-8"))
dl = json.loads(DL.read_text(encoding="utf-8"))


def load(rel):
    return json.loads((R / rel).read_text(encoding="utf-8"))


def save(rel, d):
    (R / rel).write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")


# --- dative distractor ------------------------------------------------------------------------------
pack = load("content/courses/de-vi.json")
ex = {e["id"]: e for s in pack["sections"] for u in s["units"] for l in u["lessons"] for e in l["exercises"]}
e = ex["de-vi:ua-l3-e0"]
assert e["options"][3] == "dem"
e["options"][3] = "ein"
da["de-ak-5"] = "fixed: distractor \"die\" → \"ein\" (the plural \"die Schlüssel\" was also correct; the proposed \"dem\" is a dative, which the de-vi dative-chunks gate keeps out of Sections 1–3)"

# --- stories --------------------------------------------------------------------------------------------
st = load("content/de/stories/stories.json")
by = {s["id"]: s for s in st["stories"]}


def retext(sid, i, old, new, vi, en):
    x = by[sid]["sentences"][i]
    assert x["text"] == old, (sid, i, x["text"])
    x["text"], x["translation"]["vi"], x["translation"]["en"] = new, vi, en


s = "de.story.urlaub_im_internet"
by[s]["newLexemes"].remove("de:w:reise")
dl["de-lg-89"] += "; de:w:reise no longer occurs, so it leaves the story's newLexemes"
retext(s, 15, "Wir müssen um sechs Uhr zum Flughafen fahren. Am Mittag können wir ankommen.",
       "Wir müssen um sechs Uhr zum Flughafen fahren. Wir können um acht Uhr abfliegen und am Mittag ankommen.",
       "Mình phải ra sân bay lúc sáu giờ sáng. Mình có thể bay lúc tám giờ và đến nơi vào buổi trưa.", "We have to go to the airport at six. We can fly out at eight and arrive at midday.")
dl["de-lg-87"] += "; abfliegen keeps a context sentence where it is used correctly (sentence 16: \"Wir können um acht Uhr abfliegen und am Mittag ankommen.\")"

retext("de.story.eine_wohnung_fuer_herrn_neumann", 8, "Es hat ein Zimmer, eine kleine Küche und ein Bad mit Dusche.",
       "Es hat ein Zimmer, eine kleine Küche und ein Bad mit Toilette und Dusche.",
       "Căn hộ có một phòng, một bếp nhỏ và một phòng tắm có bồn cầu và vòi sen.", "It has one room, a small kitchen and a bathroom with a toilet and a shower.")
dl["de-lg-74"] = "fixed: \"eine Toilette mit Dusche\" → \"ein Bad mit Toilette und Dusche\" (the usual flat-ad wording; keeps the context sentence of de:w:toilette); translations updated"

retext("de.story.der_umzug", 20, "Sieben, das ist gut. Ich besuche dich bald.", "Sieben, das ist eine gute Zahl! Ich besuche dich bald.",
       "Bảy, con số đẹp đấy! Tớ sẽ sớm đến thăm cậu.", "Seven, that's a good number! I'll visit you soon.")
dl["de-lg-93"] += "; de:w:zahl keeps a context sentence in the reply (\"Sieben, das ist eine gute Zahl!\")"

retext("de.story.beim_amt", 1, "Heute muss sie sich in der Stadt anmelden. Das muss in Deutschland jeder machen.",
       "Heute muss sie sich in der Stadt anmelden. Das muss jeder machen, auch Ausländer.",
       "Hôm nay cô phải đăng ký cư trú ở thành phố. Ai cũng phải làm việc này, kể cả người nước ngoài.", "Today she has to register in the city. Everyone has to do that, foreigners too.")
dl["de-lg-83"] = "fixed: \"Das ist für alle Ausländer wichtig.\" → \"Das muss jeder machen, auch Ausländer.\" (registration is for every resident; keeps the context sentence of de:w:auslander); translations updated"

s = "de.story.papa_holt_lina_ab"
retext(s, 6, "Lina? Die ist nicht hier. Sie ist mit einer Gruppe im Park.", "Lina? Die ist nicht hier. Sie ist mit einer Gruppe und zwei Erwachsenen im Park.",
       "Lina ạ? Bé không có ở đây. Bé đi công viên với một nhóm và hai người lớn.", "Lina? She isn't here. She's in the park with a group and two adults.")
dl["de-lg-85"] += "; de:w:erwachsene keeps a context sentence where it is natural (sentence 7: the group goes to the park with two adults)"

retext("de.story.die_einladung_zum_grillen", 9, "Hung zieht ein schwarzes Hemd an. Aber dann zieht er es wieder aus und nimmt ein Hemd mit Blumen.",
       "Hung zieht ein schwarzes Hemd an. Aber dann will er es wieder ausziehen. Er nimmt ein Hemd mit Blumen.",
       "Hùng mặc một chiếc áo sơ mi đen. Nhưng rồi anh lại muốn cởi ra. Anh chọn một chiếc áo có hoa.", "Hung puts on a black shirt. But then he wants to take it off again. He picks a shirt with flowers.")
dl["de-lg-81"] = ("fixed: intention and action are now two sentences — \"Aber dann will er es wieder ausziehen. Er nimmt ein Hemd mit Blumen.\" — instead of the proposed \"zieht er es wieder aus\", "
                  "because the story tokenizer cannot resolve a split separable verb to de:w:ausziehen and this is that lexeme's only context sentence; translations updated")
save("content/de/stories/stories.json", st)

# --- writing: duplicate slot variants under the German folds --------------------------------------------
UNITS = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"]
TEENS = ["zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"]
TENS = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"]


def number(n):
    if n == 100:
        return "hundert"
    if n < 10:
        return UNITS[n]
    if n < 20:
        return TEENS[n - 10]
    u, t = n % 10, TENS[n // 10]
    return t if u == 0 else ("ein" if u == 1 else UNITS[u]) + "und" + t


def formats(t):
    t = re.sub(r"\b(\d{1,2})[:.](\d{2})\s*Uhr\b", lambda m: f"{m[1]} Uhr" if m[2] == "00" else f"{m[1]} Uhr {int(m[2])}", t, flags=re.I)
    t = re.sub(r"\b(\d{1,3}),(\d{2})\s*(?:€|Euro\b)", lambda m: f"{m[1]} Euro" if m[2] == "00" else f"{m[1]} Euro {int(m[2])}", t, flags=re.I)
    return re.sub(r"\b(\d{1,3})\s*€", r"\1 Euro", t)


def written(t):
    """Python replica of normalizeWritten under the German rules (src/lib/writing/rubric.ts)."""
    t = unicodedata.normalize("NFC", formats(t)).replace("œ", "oe").replace("Œ", "OE").replace("æ", "ae").replace("Æ", "AE").lower()
    t = re.sub(r"[\u2019\u02bc']", " ", t)
    t = re.sub(r"[-\u2010\u2011\u2013\u2014]", " ", t)
    t = re.sub(r"[.,!?;:\u2026\"\u201c\u201d\u00ab\u00bb()\u00a0]", " ", t)
    toks = [w for w in re.sub(r"\s+", " ", t).strip().split(" ") if w]
    toks = [number(int(w)) if re.fullmatch(r"\d{1,3}", w) and int(w) <= 100 else w for w in toks]
    t = " ".join(toks)
    t = unicodedata.normalize("NFD", t)
    t = re.sub(r"[\u0300-\u036f]", "", t).replace("đ", "d")
    t = re.sub(r"[.,!?\u00bf\u00a1;:\"'\u3001\u3002\uff01\uff1f\u00ab\u00bb\u201c\u201d\u2026]", "", t)
    return re.sub(r"\s+", " ", t).strip().replace("ß", "ss")


def dedupe(variants):
    seen, out, dropped = set(), [], []
    for v in variants:
        k = written(v)
        if k in seen:
            dropped.append(v)
        else:
            seen.add(k)
            out.append(v)
    return out, dropped


writing = load("content/de/writing/tasks.json")
plan = {}  # (taskId, slotId) -> (old variants, new variants)
for t in writing["tasks"]:
    for sl in t["rubric"]["requiredSlots"]:
        new, dropped = dedupe(sl["variants"])
        if dropped:
            plan[(t["id"], sl["id"])] = (list(sl["variants"]), new, dropped)
            sl["variants"] = new
save("content/de/writing/tasks.json", writing)

mirrors = {k: 0 for k in plan}


def walk(node):
    if isinstance(node, dict):
        tid = node.get("writingTaskId")
        if tid and isinstance(node.get("rubric"), dict):
            for sl in node["rubric"].get("requiredSlots", []):
                key = (tid, sl["id"])
                if key in plan:
                    old, new, _ = plan[key]
                    assert sl["variants"] == old, (key, sl["variants"])
                    sl["variants"] = list(new)
                    mirrors[key] += 1
        for v in node.values():
            walk(v)
    elif isinstance(node, list):
        for v in node:
            walk(v)


walk(pack)
save("content/courses/de-vi.json", pack)
for p in sorted((R / "content/de").rglob("*.json")):
    if "_drafts" in p.parts or p.name == "tasks.json" and p.parent.name == "writing":
        continue
    rel = p.relative_to(R).as_posix()
    text = p.read_text(encoding="utf-8")
    if "writingTaskId" not in text:
        continue
    d = json.loads(text)
    before = json.dumps(d, ensure_ascii=False)
    walk(d)
    if json.dumps(d, ensure_ascii=False) != before:
        save(rel, d)

lines = [f"{tid}/{sid}: dropped {', '.join(dropped)} (mirrors: {mirrors[(tid, sid)]})" for (tid, sid), (_, _, dropped) in plan.items()]
da["de-ak-19"] += "; slot variants the folds made identical were removed from the writing tasks and their rubric mirrors (the validator rejects duplicates): " + "; ".join(lines)
da["de-ak-81"] = "fixed: time slot accepts \"um 15\"; \"um 15:00 Uhr\" also matches \"um 15 uhr\" by the engine (HH:MM Uhr is read as H Uhr, digits spelt); \"um 3\" was dropped as a duplicate of \"um drei\" under the number speller"
for k in [k for k in plan if not mirrors[k]]:
    print("no mirror for", k)
print("\n".join(lines))

DA.write_text(json.dumps(da, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
DL.write_text(json.dumps(dl, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
print("ok")

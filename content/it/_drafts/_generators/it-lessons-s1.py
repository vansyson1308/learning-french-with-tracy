"""it-vi section 1 lessons — varied shapes (QC 2026-10-28 §2: no uniform template).

Each unit's four lessons use four different recipes (rotated per unit), 7–12
exercises each: introduce (recognise + first production), articles
(articleSelect + a concept card), sentences (word banks, cloze, typed
Italian), review (mixed, two typed answers). Italian production from the first
lesson (typeAnswer, wordBank native→target). Five lessons interleave a
concept card in `flow`. Sentences are original A1 Italian with Vietnamese.
usage: python -I it-lessons-s1.py <repo root> <out.jsonl>"""
import json, sys

ROOT, OUT = sys.argv[1], sys.argv[2]
PACK = json.load(open(f"{ROOT}/content/it/_drafts/pack.json", encoding="utf-8"))
C = "it-vi"
ARTS = ["il", "lo", "la", "l'"]

# Per lesson: wordBank t→n (it, vi), wordBank n→t (vi, it), fillBlank (sentence, answer, options, vi), typeAnswer (vi, it, alts)
S = {
 "u0": [
  (("Marco è un uomo.", "Marco là một người đàn ông."), ("Anna là một người phụ nữ.", "Anna è una donna."), ("Luca è un ___.", "ragazzo", ["ragazzo", "uomo", "pane", "latte"], "Luca là một cậu bé."), ("Người đàn ông và người phụ nữ.", "L'uomo e la donna.", ["L'uomo e la donna"])),
  (("La ragazza mangia una mela.", "Cô gái ăn một quả táo."), ("Đứa bé có một quả táo.", "Il bambino ha una mela."), ("Il ___ mangia una mela.", "bambino", ["pane", "bambino", "latte", "acqua"], "Đứa bé ăn một quả táo."), ("Cô gái và cậu bé.", "La ragazza e il ragazzo.", ["La ragazza e il ragazzo"])),
  (("Bevo l'acqua.", "Tôi uống nước."), ("Đứa bé uống sữa.", "Il bambino beve il latte."), ("L'uomo mangia il ___.", "pane", ["latte", "pane", "acqua", "ragazzo"], "Người đàn ông ăn bánh mì."), ("Tôi uống sữa.", "Bevo il latte.", ["Bevo il latte", "Io bevo il latte."])),
  (("Mangiamo il pane.", "Chúng tôi ăn bánh mì."), ("Tôi có một quả táo.", "Ho una mela."), ("La donna ___ l'acqua.", "beve", ["mangia", "ha", "sono", "beve"], "Người phụ nữ uống nước."), ("Bạn ăn một quả táo.", "Mangi una mela.", ["Mangi una mela", "Tu mangi una mela."])),
 ],
 "u1": [
  (("Ciao, sono Anna.", "Chào, tôi là Anna."), ("Tạm biệt, Paolo!", "Ciao, Paolo!"), ("___, come stai?", "Ciao", ["Ciao", "Grazie", "Prego", "Buonanotte"], "Chào, bạn khỏe không?"), ("Chào bạn!", "Ciao!", ["Ciao"])),
  (("Grazie, signora.", "Cảm ơn bà."), ("Chào ông ạ.", "Buongiorno, signore."), ("___, dov'è la stazione?", "Scusi", ["Prego", "Scusi", "Grazie", "Ciao"], "Xin lỗi, nhà ga ở đâu ạ?"), ("Cảm ơn!", "Grazie!", ["Grazie"])),
  (("Buongiorno, mamma!", "Chào mẹ buổi sáng!"), ("Chào buổi tối, bà ạ.", "Buonasera, signora."), ("___, papà!", "Buonanotte", ["Buongiorno", "Buonasera", "Buonanotte", "Grazie"], "Chúc bố ngủ ngon!"), ("Chúc ngủ ngon!", "Buonanotte!", ["Buonanotte"])),
  (("Un caffè, per favore.", "Cho tôi một ly cà phê."), ("Không, cảm ơn.", "No, grazie."), ("Sì, ___ favore.", "per", ["per", "con", "di", "a"], "Vâng, làm ơn."), ("Tạm biệt và cảm ơn.", "Arrivederci e grazie.", ["Arrivederci e grazie"])),
 ],
 "u2": [
  (("Bevo il caffè.", "Tôi uống cà phê."), ("Bạn có uống trà không?", "Bevi il tè?"), ("Mangiamo il ___.", "riso", ["tè", "riso", "caffè", "succo"], "Chúng tôi ăn cơm."), ("Tôi uống trà.", "Bevo il tè.", ["Bevo il tè"])),
  (("Mangio un uovo.", "Tôi ăn một quả trứng."), ("Người phụ nữ ăn phô mai.", "La donna mangia il formaggio."), ("Il bambino mangia la ___.", "frutta", ["caffè", "frutta", "succo", "vino"], "Đứa bé ăn trái cây."), ("Tôi không ăn trứng.", "Non mangio le uova.", ["Non mangio le uova", "Non mangio uova."])),
  (("Bevo un succo.", "Tôi uống một ly nước ép."), ("Người đàn ông ăn pizza.", "L'uomo mangia la pizza."), ("Pasta con il ___?", "pollo", ["pollo", "tè", "vino", "caffè"], "Mì với thịt gà à?"), ("Tôi ăn mì.", "Mangio la pasta.", ["Mangio la pasta"])),
  (("Il vino è buono.", "Rượu vang ngon."), ("Đứa bé ăn thịt gà.", "Il bambino mangia il pollo."), ("Vorrei una ___, per favore.", "pizza", ["pizza", "riso", "vino", "formaggio"], "Cho tôi một cái pizza."), ("Tôi muốn một ly cà phê.", "Vorrei un caffè.", ["Vorrei un caffè"])),
 ],
 "u3": [
  (("Questa è la mia famiglia.", "Đây là gia đình tôi."), ("Mẹ tôi uống trà.", "Mia madre beve il tè."), ("Mio ___ si chiama Paolo.", "padre", ["padre", "madre", "sorella", "moglie"], "Bố tôi tên là Paolo."), ("Đây là mẹ tôi.", "Questa è mia madre.", ["Questa è mia madre"])),
  (("Mio padre e mia madre sono a Roma.", "Bố mẹ tôi ở Roma."), ("Tôi có một anh trai.", "Ho un fratello."), ("Mia ___ si chiama Lisa.", "sorella", ["fratello", "sorella", "padre", "marito"], "Chị gái tôi tên là Lisa."), ("Tôi có một chị gái.", "Ho una sorella.", ["Ho una sorella"])),
  (("Questo è mio figlio.", "Đây là con trai tôi."), ("Con gái tôi uống sữa.", "Mia figlia beve il latte."), ("Mio ___ ha un cane.", "nonno", ["nonno", "nonna", "figlia", "madre"], "Ông tôi có một con chó."), ("Chúng tôi là một gia đình.", "Siamo una famiglia.", ["Siamo una famiglia"])),
  (("Il cane beve l'acqua.", "Con chó uống nước."), ("Bà tôi có một con chó.", "Mia nonna ha un cane."), ("Abbiamo un ___.", "cane", ["figlio", "fratello", "marito", "cane"], "Chúng tôi có một con chó."), ("Tôi có một con chó.", "Ho un cane.", ["Ho un cane"])),
 ],
 "u4": [
  (("Roma è una città.", "Roma là một thành phố."), ("Nhà ga ở đâu?", "Dov'è la stazione?"), ("Il ___ arriva alle otto.", "treno", ["treno", "museo", "viaggio", "biglietto"], "Tàu đến lúc tám giờ."), ("Tôi đi tàu.", "Prendo il treno.", ["Prendo il treno"])),
  (("L'albergo è in città.", "Khách sạn ở trong thành phố."), ("Sân bay ở đâu?", "Dov'è l'aeroporto?"), ("Dov'è la ___?", "strada", ["città", "strada", "albergo", "treno"], "Con đường ở đâu?"), ("Khách sạn ở đâu?", "Dov'è l'albergo?", ["Dov'è l'albergo"])),
  (("Ho un biglietto.", "Tôi có một cái vé."), ("Tôi đi xe buýt.", "Prendo l'autobus."), ("Ho una ___ pesante.", "valigia", ["mappa", "valigia", "stazione", "strada"], "Tôi có một cái va li nặng."), ("Tôi có một cái bản đồ.", "Ho una mappa.", ["Ho una mappa"])),
  (("Buon viaggio!", "Chúc chuyến đi vui vẻ!"), ("Bảo tàng ở đâu?", "Dov'è il museo?"), ("Vorrei un ___ per Roma.", "biglietto", ["viaggio", "treno", "museo", "biglietto"], "Tôi muốn một vé đi Roma."), ("Bảo tàng ở trong thành phố.", "Il museo è in città.", ["Il museo è in città"])),
 ],
}
# Concept cards interleaved in section 1 (lesson key → concept, inserted after the first exercises).
FLOW = {("u0", 1): "it:concept:gender-endings", ("u1", 1): "it:concept:greetings-register", ("u2", 1): "it:concept:definite-articles",
        ("u3", 2): "it:concept:possessives", ("u4", 2): "it:concept:elision"}
RECIPES = {
    "intro": ["t2n", "t2n", "t2n", "listen", "n2t", "n2t", "match", "typeWord"],
    "articles": ["article", "article", "article", "t2n", "fill", "wbN2T", "typeSentence"],
    "sentences": ["t2n", "wbT2N", "wbN2T", "fill", "fill2", "n2t", "listen", "typeSentence"],
    "review": ["match", "t2n", "n2t", "listen", "n2t", "wbT2N", "fill", "article", "typeSentence", "typeWord", "t2n"],
}
ORDERS = [["intro", "articles", "sentences", "review"], ["intro", "sentences", "articles", "review"],
          ["intro", "articles", "review", "sentences"], ["intro", "sentences", "review", "articles"],
          ["intro", "review", "articles", "sentences"]]


def short(native):
    return native.split(";")[0].strip()


VI_FILLER = ["không", "bạn", "và", "có", "là", "một", "tôi"]
IT_FILLER = ["non", "e", "è", "sono", "un", "la", "il", "ha"]


def shuffled(toks, seed):
    order = sorted(range(len(toks)), key=lambda i: ((i * 7 + seed * 5) % 11, i))
    return [toks[i] for i in order]


def with_distractors(answer, pool, n, seed):
    extra = [w for w in pool if w not in answer]
    pick = list(dict.fromkeys(extra[(seed + i * 3) % len(extra)] for i in range(n)))
    return shuffled(answer + pick, seed)


def noun_parts(target):
    if target.startswith("l'"):
        return "l'", target[2:]
    parts = target.split(" ", 1)
    return (parts[0], parts[1]) if len(parts) == 2 and parts[0] in ARTS else (None, None)


def tokens(sentence):
    return sentence.rstrip(".!?").replace(",", "").split()


records = []
pos = [0]


def nextpos():
    p = pos[0] % 4
    pos[0] += 1
    return p


sec = PACK["sections"][0]
for ui, unit in enumerate(sec["units"]):
    key = f"u{ui}"
    words = unit["words"]
    for li, lesson in enumerate(unit["lessons"]):
        recipe = RECIPES[ORDERS[ui][li]]
        new = words[3 * li: 3 * li + 3]
        seen = words[: 3 * li + 3]
        nouns_seen = [w for w in seen if noun_parts(w["target"])[0]]
        wb1, wb2, fb, ta = S[key][li]
        ex = []
        counters = {"t2n": 0, "n2t": 0, "listen": 0, "article": 0}

        def eid():
            return f"{C}:{key}-l{li}-e{len(ex)}"

        def opts(w, p, field, emoji=True, shift=1):
            others = [x for x in words if x["target"] != w["target"]]
            same = [x for x in others if (noun_parts(x["target"])[0] is None) == (noun_parts(w["target"])[0] is None)]
            if len(same) < 3:
                same = same + [x for x in others if x not in same]
            k = (li + shift + len(ex)) % len(same)
            d = (same[k:] + same[:k])[:3]
            val = (lambda x: short(x["native"])) if field == "native" else (lambda x: x["target"])
            items = [({"text": val(x), "emoji": x.get("emoji", "")} if emoji else {"text": val(x)}) for x in d]
            items.insert(p, {"text": val(w), "emoji": w.get("emoji", "")} if emoji else {"text": val(w)})
            return items

        def pick(kind, pool):
            i = counters[kind]
            counters[kind] += 1
            return pool[i % len(pool)]

        for step in recipe:
            if step == "article" and not nouns_seen:
                step = "n2t"  # unit 2 teaches no noun before signore / signora
            if step == "t2n":
                w = pick("t2n", new + seen[:-3] if len(seen) > 3 else new)
                p = nextpos()
                ex.append({"type": "select", "id": eid(), "mode": "targetToNative", "prompt": w["target"], "audioTarget": w["target"], "options": opts(w, p, "native"), "correct": p})
            elif step == "n2t":
                w = pick("n2t", list(reversed(new)) + seen[:-3])
                p = nextpos()
                ex.append({"type": "select", "id": eid(), "mode": "nativeToTarget", "prompt": short(w["native"]), "audioTarget": w["target"], "options": opts(w, p, "target", shift=2), "correct": p})
            elif step == "listen":
                w = pick("listen", new[1:] + new[:1])
                p = nextpos()
                ex.append({"type": "select", "id": eid(), "mode": "listen", "prompt": "Nghe rồi chọn từ bạn nghe thấy.", "audioTarget": w["target"], "options": opts(w, p, "target", emoji=False, shift=3), "correct": p})
            elif step == "article":
                if not nouns_seen:
                    continue
                w = pick("article", nouns_seen[::-1])
                art, noun = noun_parts(w["target"])
                ex.append({"type": "articleSelect", "id": eid(), "articles": ARTS, "noun": noun, "gloss": short(w["native"]), "correct": ARTS.index(art), "audioTarget": w["target"]})
            elif step == "match":
                mp = seen[-5:] if len(seen) >= 5 else words[:5]
                ex.append({"type": "match", "id": eid(), "pairs": [{"target": x["target"], "native": short(x["native"])} for x in mp]})
            elif step == "wbT2N":
                it1, vi1 = wb1
                ans = tokens(vi1)
                ex.append({"type": "wordBank", "id": eid(), "direction": "targetToNative", "prompt": it1, "audioTarget": it1, "tokens": with_distractors(ans, VI_FILLER, 3, ui * 4 + li), "answer": ans})
            elif step == "wbN2T":
                vi2, it2 = wb2
                ans = tokens(it2)
                ex.append({"type": "wordBank", "id": eid(), "direction": "nativeToTarget", "prompt": vi2, "tokens": with_distractors(ans, IT_FILLER, 3, ui * 4 + li + 1), "answer": ans})
            elif step == "fill":
                sent, answer, options, vi = fb
                ex.append({"type": "fillBlank", "id": eid(), "sentence": sent, "translation": vi, "audioTarget": sent.replace("___", answer), "options": options, "correct": options.index(answer)})
            elif step == "fill2":
                # A second cloze from the n→t word-bank sentence: blank its last unit noun or verb form.
                vi2, it2 = wb2
                toks = tokens(it2)
                bare = lambda w: noun_parts(w["target"])[1] or w["target"]
                cand = [t for t in toks if any(t == bare(w) for w in seen)]
                if not cand:
                    continue
                gap = cand[-1]
                sent = it2.replace(gap, "___", 1)
                pool_words = [bare(w) for w in words if bare(w) != gap]
                options = [gap] + pool_words[li:li + 3] if len(pool_words) >= li + 3 else [gap] + pool_words[:3]
                p = nextpos()
                options = options[1:p + 1] + [gap] + options[p + 1:]
                ex.append({"type": "fillBlank", "id": eid(), "sentence": sent, "translation": vi2, "audioTarget": it2, "options": options, "correct": options.index(gap)})
            elif step == "typeSentence":
                tvi, tit, alts = ta
                ex.append({"type": "typeAnswer", "id": eid(), "mode": "produceTarget", "prompt": tvi, "audioTarget": tit, "answer": tit, "alternatives": alts})
            elif step == "typeWord":
                w = new[0] if recipe[-1] == "typeWord" and ORDERS[ui][li] == "intro" else new[-1]
                hint = " (kèm mạo từ)" if noun_parts(w["target"])[0] else ""
                ex.append({"type": "typeAnswer", "id": eid(), "mode": "produceTarget", "prompt": short(w["native"]) + hint, "audioTarget": w["target"], "answer": w["target"], "alternatives": []})
        rec = {"lessonId": lesson["id"], "exercises": ex}
        concept = FLOW.get((key, li))
        if concept:
            at = 2 if len(ex) > 4 else 1
            rec["flow"] = [{"exercise": e["id"]} for e in ex[:at]] + [{"concept": concept}] + [{"exercise": e["id"]} for e in ex[at:]]
        records.append(rec)

with open(OUT, "w", encoding="utf-8", newline="\n") as f:
    for r in records:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
from collections import Counter
mix = Counter(e["type"] for r in records for e in r["exercises"])
print(len(records), "lessons", sum(len(r["exercises"]) for r in records), "exercises", dict(mix), "flow", sum(1 for r in records if "flow" in r))

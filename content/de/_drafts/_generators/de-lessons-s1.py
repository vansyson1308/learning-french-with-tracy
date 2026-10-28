"""de-vi section 1 lessons — varied shapes (QC 2026-10-28 §2: no uniform template).

Each unit's four lessons use four different recipes (rotated per unit), 7–12
exercises each: introduce (recognise + first production), articles
(articleSelect + a concept card), sentences (word banks, cloze, typed
German), review (mixed, two typed answers). German production from the first
lesson (typeAnswer, wordBank native→target). Five lessons interleave a
concept card in `flow`. Sentences are original A1 German with Vietnamese.
usage: python -I de-lessons-s1.py <out.jsonl>"""
import json, sys

PACK = json.load(open(r"C:\src\lft\content\de\_drafts\pack.json", encoding="utf-8"))
C = "de-vi"
ARTS = ["der", "die", "das"]

# Per lesson: wordBank t→n (de, vi), wordBank n→t (vi, de), fillBlank (sentence, answer, options, vi), typeAnswer (vi, de, alts)
S = {
 "u0": [
  (("Ich bin ein Mann.", "Tôi là một người đàn ông."), ("Bạn là một người phụ nữ.", "Du bist eine Frau."), ("Er ist ein ___.", "Junge", ["Junge", "Mann", "Apfel", "Kind"], "Nó là một cậu bé."), ("Người đàn ông và người phụ nữ.", "Der Mann und die Frau.", [])),
  (("Sie ist ein Mädchen.", "Cô ấy là một cô bé."), ("Đứa trẻ có một quả táo.", "Das Kind hat einen Apfel."), ("Das ___ isst einen Apfel.", "Kind", ["Brot", "Kind", "Wasser", "Milch"], "Đứa trẻ ăn một quả táo."), ("Cô bé và cậu bé.", "Das Mädchen und der Junge.", [])),
  (("Ich trinke Wasser.", "Tôi uống nước."), ("Đứa trẻ uống sữa.", "Das Kind trinkt Milch."), ("Der Mann isst ___.", "Brot", ["Wasser", "Milch", "Brot", "Frau"], "Người đàn ông ăn bánh mì."), ("Tôi uống sữa.", "Ich trinke Milch.", [])),
  (("Wir essen Brot.", "Chúng tôi ăn bánh mì."), ("Tôi có một quả táo.", "Ich habe einen Apfel."), ("Die Frau ___ Wasser.", "trinkt", ["isst", "hat", "bin", "trinkt"], "Người phụ nữ uống nước."), ("Bạn ăn một quả táo.", "Du isst einen Apfel.", ["Du isst einen Apfel"])),
 ],
 "u1": [
  (("Hallo, ich bin Anna.", "Xin chào, tôi là Anna."), ("Tạm biệt, Paul!", "Tschüss, Paul!"), ("___, wie geht's?", "Hallo", ["Hallo", "Tschüss", "Danke", "Bitte"], "Xin chào, bạn khoẻ không?"), ("Xin chào!", "Hallo!", ["Hallo"])),
  (("Danke, das ist gut.", "Cảm ơn, cái đó tốt."), ("Chào mừng đến Berlin!", "Willkommen in Berlin!"), ("___, wo ist der Bahnhof?", "Entschuldigung", ["Willkommen", "Entschuldigung", "Danke", "Tschüss"], "Xin lỗi, nhà ga ở đâu?"), ("Cảm ơn!", "Danke!", ["Danke", "Danke schön!"])),
  (("Guten Morgen, Mama!", "Chào buổi sáng, mẹ!"), ("Chào buổi tối!", "Guten Abend!"), ("Gute ___!", "Nacht", ["Morgen", "Abend", "Nacht", "Tag"], "Chúc ngủ ngon!"), ("Chào buổi sáng!", "Guten Morgen!", ["Guten Morgen"])),
  (("Mein Name ist Tom.", "Tên tôi là Tom."), ("Anh ấy là bạn tôi.", "Er ist mein Freund."), ("Wie ist dein ___?", "Name", ["Tag", "Freund", "Abend", "Name"], "Bạn tên là gì?"), ("Xin chào (ban ngày)!", "Guten Tag!", ["Guten Tag"])),
 ],
 "u2": [
  (("Ich trinke Kaffee.", "Tôi uống cà phê."), ("Bạn uống trà không?", "Trinkst du Tee?"), ("Wir essen ___.", "Reis", ["Tee", "Reis", "Kaffee", "Saft"], "Chúng tôi ăn cơm."), ("Tôi uống trà.", "Ich trinke Tee.", ["Ich trinke Tee"])),
  (("Ich esse ein Ei.", "Tôi ăn một quả trứng."), ("Người phụ nữ ăn phô mai.", "Die Frau isst Käse."), ("Das Kind isst ___.", "Obst", ["Kaffee", "Tee", "Saft", "Obst"], "Đứa trẻ ăn trái cây."), ("Tôi không ăn trứng.", "Ich esse kein Ei.", ["Ich esse kein Ei"])),
  (("Ich trinke Saft.", "Tôi uống nước ép."), ("Người đàn ông ăn cá.", "Der Mann isst Fisch."), ("Kaffee mit ___?", "Zucker", ["Zucker", "Fisch", "Reis", "Käse"], "Cà phê có đường không?"), ("Tôi ăn cá.", "Ich esse Fisch.", ["Ich esse Fisch"])),
  (("Der Kuchen ist gut.", "Bánh ngọt ngon."), ("Đứa trẻ ăn sô-cô-la.", "Das Kind isst Schokolade."), ("Das ___ ist um acht Uhr.", "Frühstück", ["Ei", "Frühstück", "Obst", "Brot"], "Bữa sáng lúc tám giờ."), ("Tôi ăn bánh ngọt.", "Ich esse Kuchen.", ["Ich esse Kuchen"])),
 ],
 "u3": [
  (("Das ist meine Familie.", "Đây là gia đình tôi."), ("Mẹ tôi uống trà.", "Meine Mutter trinkt Tee."), ("Mein ___ heißt Peter.", "Vater", ["Vater", "Mutter", "Familie", "Tante"], "Bố tôi tên là Peter."), ("Đây là mẹ tôi.", "Das ist meine Mutter.", ["Das ist meine Mutter"])),
  (("Meine Eltern wohnen in Berlin.", "Bố mẹ tôi sống ở Berlin."), ("Tôi có một anh trai.", "Ich habe einen Bruder."), ("Meine ___ heißt Lisa.", "Schwester", ["Bruder", "Schwester", "Vater", "Onkel"], "Chị gái tôi tên là Lisa."), ("Tôi có một em gái.", "Ich habe eine Schwester.", ["Ich habe eine Schwester"])),
  (("Das ist mein Sohn.", "Đây là con trai tôi."), ("Con gái tôi uống sữa.", "Meine Tochter trinkt Milch."), ("Mein ___ hat einen Hund.", "Onkel", ["Onkel", "Tante", "Tochter", "Mutter"], "Chú tôi có một con chó."), ("Chúng tôi là một gia đình.", "Wir sind eine Familie.", ["Wir sind eine Familie"])),
  (("Die Katze trinkt Milch.", "Con mèo uống sữa."), ("Cô tôi có một con mèo.", "Meine Tante hat eine Katze."), ("Wir haben einen ___.", "Hund", ["Sohn", "Bruder", "Onkel", "Hund"], "Chúng tôi có một con chó."), ("Tôi có một con mèo.", "Ich habe eine Katze.", ["Ich habe eine Katze"])),
 ],
 "u4": [
  (("Berlin ist eine Stadt.", "Berlin là một thành phố."), ("Nhà ga ở đâu?", "Wo ist der Bahnhof?"), ("Der ___ kommt um acht Uhr.", "Zug", ["Zug", "Bahnhof", "Weg", "Bus"], "Tàu đến lúc tám giờ."), ("Tôi đi tàu.", "Ich fahre mit dem Zug.", ["Ich fahre mit dem Zug"])),
  (("Das Hotel ist in der Stadt.", "Khách sạn ở trong thành phố."), ("Sân bay ở đâu?", "Wo ist der Flughafen?"), ("Wo ist die ___?", "Straße", ["Stadt", "Straße", "Hotel", "Zug"], "Con đường ở đâu?"), ("Khách sạn ở đâu?", "Wo ist das Hotel?", ["Wo ist das Hotel"])),
  (("Ich habe ein Ticket.", "Tôi có một cái vé."), ("Tôi đi xe buýt.", "Ich fahre mit dem Bus."), ("Wir fahren mit dem ___.", "Auto", ["Ticket", "Hotel", "Auto", "Museum"], "Chúng tôi đi bằng ô tô."), ("Tôi có một chiếc ô tô.", "Ich habe ein Auto.", ["Ich habe ein Auto"])),
  (("Ich fahre Fahrrad.", "Tôi đi xe đạp."), ("Bảo tàng ở đâu?", "Wo ist das Museum?"), ("Wie ist der ___ zum Bahnhof?", "Weg", ["Bus", "Zug", "Flughafen", "Weg"], "Đường đến nhà ga thế nào?"), ("Bảo tàng ở trong thành phố.", "Das Museum ist in der Stadt.", ["Das Museum ist in der Stadt"])),
 ],
}
# Concept cards interleaved in section 1 (lesson key → concept, inserted after the first exercises).
FLOW = {("u0", 1): "de:concept:three-genders", ("u1", 1): "de:concept:du-sie", ("u2", 1): "de:concept:ein-kein",
        ("u3", 2): "de:concept:sein-haben", ("u4", 2): "de:concept:dative-phrases"}
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
DE_FILLER = ["nicht", "und", "ist", "bin", "ein", "die", "der", "hat"]

def shuffled(toks, seed):
    order = sorted(range(len(toks)), key=lambda i: ((i * 7 + seed * 5) % 11, i))
    return [toks[i] for i in order]

def with_distractors(answer, pool, n, seed):
    extra = [w for w in pool if w not in answer]
    pick = list(dict.fromkeys(extra[(seed + i * 3) % len(extra)] for i in range(n)))
    return shuffled(answer + pick, seed)

def noun_parts(target):
    parts = target.split(" ", 1)
    return (parts[0], parts[1]) if len(parts) == 2 and parts[0] in ARTS else (None, None)

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
        nouns_seen = [w for w in seen if noun_parts(w["target"])[0] and w["target"] != "die Eltern"]
        wb1, wb2, fb, ta = S[key][li]
        ex = []
        counters = {"t2n": 0, "n2t": 0, "listen": 0, "article": 0}
        def eid():
            return f"{C}:{key}-l{li}-e{len(ex)}"
        def opts(w, p, field, emoji=True, shift=1):
            others = [x for x in words if x["target"] != w["target"]]
            same = [x for x in others if (noun_parts(x["target"])[0] is None) == (noun_parts(w["target"])[0] is None)]
            if len(same) < 3:  # e.g. a unit with three verbs: fill the options from the whole unit
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
                de1, vi1 = wb1
                ans = vi1.rstrip(".!?").replace(",", "").split()
                ex.append({"type": "wordBank", "id": eid(), "direction": "targetToNative", "prompt": de1, "audioTarget": de1, "tokens": with_distractors(ans, VI_FILLER, 3, ui * 4 + li), "answer": ans})
            elif step == "wbN2T":
                vi2, de2 = wb2
                ans = de2.rstrip(".!?").replace(",", "").split()
                ex.append({"type": "wordBank", "id": eid(), "direction": "nativeToTarget", "prompt": vi2, "tokens": with_distractors(ans, DE_FILLER, 3, ui * 4 + li + 1), "answer": ans})
            elif step == "fill":
                sent, answer, options, vi = fb
                ex.append({"type": "fillBlank", "id": eid(), "sentence": sent, "translation": vi, "audioTarget": sent.replace("___", answer), "options": options, "correct": options.index(answer)})
            elif step == "fill2":
                # A second cloze from the n→t word-bank sentence: blank its first unit noun or verb form.
                vi2, de2 = wb2
                toks = de2.rstrip(".!?").split()
                cand = [t for t in toks if any(t == (noun_parts(w["target"])[1] or w["target"]) for w in seen)]
                if not cand:
                    continue
                gap = cand[-1]
                sent = de2.replace(gap, "___", 1)
                pool_words = [noun_parts(w["target"])[1] or w["target"] for w in words if (noun_parts(w["target"])[1] or w["target"]) != gap]
                options = [gap] + pool_words[li:li + 3] if len(pool_words) >= li + 3 else [gap] + pool_words[:3]
                p = nextpos()
                options = options[1:p + 1] + [gap] + options[p + 1:]
                ex.append({"type": "fillBlank", "id": eid(), "sentence": sent, "translation": vi2, "audioTarget": de2, "options": options, "correct": options.index(gap)})
            elif step == "typeSentence":
                tvi, tde, alts = ta
                ex.append({"type": "typeAnswer", "id": eid(), "mode": "produceTarget", "prompt": tvi, "audioTarget": tde, "answer": tde, "alternatives": alts})
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

with open(sys.argv[1], "w", encoding="utf-8", newline="\n") as f:
    for r in records:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
from collections import Counter
mix = Counter(e["type"] for r in records for e in r["exercises"])
print(len(records), "lessons", sum(len(r["exercises"]) for r in records), "exercises", dict(mix), "sizes", sorted(Counter(len(r["exercises"]) for r in records).items()), "flow", sum(1 for r in records if "flow" in r))

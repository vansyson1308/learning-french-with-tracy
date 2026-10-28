"""de-vi section 1 lessons (20 × 11 exercises), the de-en / es-vi section-1 shape:
3 select target→native, 2 native→target, 1 listen, wordBank t→n + n→t, fillBlank,
match (5 pairs), typeAnswer (produce German). Sentences are original, A1, with
Vietnamese translations. usage: python -I de-lessons-s1.py <out.jsonl>"""
import json, sys

PACK = json.load(open(r"C:\src\lft\content\de\_drafts\pack.json", encoding="utf-8"))
C = "de-vi"

# Per lesson: (wordBank t→n (de, vi), wordBank n→t (vi, de), fillBlank (sentence, answer, options, vi), typeAnswer (vi, de, [alts]))
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
  (("Ich esse ein Ei.", "Tôi ăn một quả trứng."), ("Người phụ nữ ăn phô mai.", "Die Frau isst Käse."), ("Das Kind isst ___.", "Obst", ["Kaffee", "Tee", "Saft", "Obst"], "Đứa trẻ ăn trái cây."), ("Tôi ăn trái cây.", "Ich esse Obst.", ["Ich esse Obst"])),
  (("Ich trinke Saft.", "Tôi uống nước ép."), ("Người đàn ông ăn cá.", "Der Mann isst Fisch."), ("Kaffee mit ___?", "Zucker", ["Zucker", "Fisch", "Reis", "Käse"], "Cà phê có đường không?"), ("Tôi ăn cá.", "Ich esse Fisch.", ["Ich esse Fisch"])),
  (("Der Kuchen ist gut.", "Bánh ngọt ngon."), ("Đứa trẻ ăn sô-cô-la.", "Das Kind isst Schokolade."), ("Das ___ ist um acht Uhr.", "Frühstück", ["Ei", "Frühstück", "Obst", "Brot"], "Bữa sáng lúc tám giờ."), ("Tôi ăn bánh ngọt.", "Ich esse Kuchen.", ["Ich esse Kuchen"])),
 ],
 "u3": [
  (("Das ist meine Familie.", "Đây là gia đình tôi."), ("Mẹ tôi uống trà.", "Meine Mutter trinkt Tee."), ("Mein ___ heißt Peter.", "Vater", ["Vater", "Mutter", "Familie", "Tante"], "Bố tôi tên là Peter."), ("Đây là mẹ tôi.", "Das ist meine Mutter.", ["Das ist meine Mutter"])),
  (("Meine Eltern wohnen in Berlin.", "Bố mẹ tôi sống ở Berlin."), ("Tôi có một anh trai.", "Ich habe einen Bruder."), ("Meine ___ heißt Lisa.", "Schwester", ["Bruder", "Schwester", "Vater", "Onkel"], "Chị gái tôi tên là Lisa."), ("Tôi có một em gái.", "Ich habe eine Schwester.", ["Ich habe eine Schwester"])),
  (("Das ist mein Sohn.", "Đây là con trai tôi."), ("Con gái tôi uống sữa.", "Meine Tochter trinkt Milch."), ("Mein ___ hat einen Hund.", "Onkel", ["Onkel", "Tante", "Tochter", "Mutter"], "Chú tôi có một con chó."), ("Đây là con gái tôi.", "Das ist meine Tochter.", ["Das ist meine Tochter"])),
  (("Die Katze trinkt Milch.", "Con mèo uống sữa."), ("Cô tôi có một con mèo.", "Meine Tante hat eine Katze."), ("Wir haben einen ___.", "Hund", ["Sohn", "Bruder", "Onkel", "Hund"], "Chúng tôi có một con chó."), ("Tôi có một con mèo.", "Ich habe eine Katze.", ["Ich habe eine Katze"])),
 ],
 "u4": [
  (("Berlin ist eine Stadt.", "Berlin là một thành phố."), ("Nhà ga ở đâu?", "Wo ist der Bahnhof?"), ("Der ___ kommt um acht Uhr.", "Zug", ["Zug", "Bahnhof", "Weg", "Bus"], "Tàu đến lúc tám giờ."), ("Tôi đi tàu.", "Ich fahre mit dem Zug.", ["Ich fahre mit dem Zug"])),
  (("Das Hotel ist in der Stadt.", "Khách sạn ở trong thành phố."), ("Sân bay ở đâu?", "Wo ist der Flughafen?"), ("Wo ist die ___?", "Straße", ["Stadt", "Straße", "Hotel", "Zug"], "Con đường ở đâu?"), ("Khách sạn ở đâu?", "Wo ist das Hotel?", ["Wo ist das Hotel"])),
  (("Ich habe ein Ticket.", "Tôi có một cái vé."), ("Tôi đi xe buýt.", "Ich fahre mit dem Bus."), ("Wir fahren mit dem ___.", "Auto", ["Ticket", "Hotel", "Auto", "Museum"], "Chúng tôi đi bằng ô tô."), ("Tôi có một chiếc ô tô.", "Ich habe ein Auto.", ["Ich habe ein Auto"])),
  (("Ich fahre Fahrrad.", "Tôi đi xe đạp."), ("Bảo tàng ở đâu?", "Wo ist das Museum?"), ("Wie ist der ___ zum Bahnhof?", "Weg", ["Bus", "Zug", "Flughafen", "Weg"], "Đường đến nhà ga thế nào?"), ("Bảo tàng ở trong thành phố.", "Das Museum ist in der Stadt.", ["Das Museum ist in der Stadt"])),
 ],
}

def short(native):
    return native.split(";")[0].strip()

def rotate(items, correct_item, pos):
    """Place correct_item at index pos among items (others keep their order)."""
    others = [x for x in items if x != correct_item][:3]
    out = others[:]
    out.insert(pos, correct_item)
    return out

VI_FILLER = ["không", "bạn", "và", "có", "là", "một", "tôi"]
DE_FILLER = ["nicht", "und", "ist", "bin", "ein", "die", "der", "hat"]

def tokens_with_distractors(answer, pool, n, seed):
    extra = [w for w in pool if w not in answer]
    pick = [extra[(seed + i * 3) % len(extra)] for i in range(n)]
    pick = list(dict.fromkeys(pick))
    toks = answer + pick
    # deterministic shuffle
    order = sorted(range(len(toks)), key=lambda i: ((i * 7 + seed * 5) % 11, i))
    return [toks[i] for i in order]

records = []
pos_cycle = 0
sec = PACK["sections"][0]
for ui, unit in enumerate(sec["units"]):
    key = f"u{ui}"
    words = unit["words"]
    assert len(words) >= 12, unit["id"]
    for li, lesson in enumerate(unit["lessons"]):
        new = words[3 * li: 3 * li + 3]
        seen = words[: 3 * li + 3]
        pool = words  # distractors from the unit
        ex = []
        eid = lambda n: f"{C}:{key}-l{li}-e{n}"
        def opts_native(w, p):
            others = [x for x in pool if x["target"] != w["target"]]
            # prefer distractors of the same part of speech class (noun vs other) — nouns have an article
            same = [x for x in others if (" " in x["target"]) == (" " in w["target"])] or others
            d = (same[(li + 1) % len(same):] + same[:(li + 1) % len(same)])[:3]
            items = [{"text": short(x["native"]), "emoji": x.get("emoji", "")} for x in d]
            items.insert(p, {"text": short(w["native"]), "emoji": w.get("emoji", "")})
            return items
        def opts_target(w, p, with_emoji=True):
            others = [x for x in pool if x["target"] != w["target"]]
            same = [x for x in others if (" " in x["target"]) == (" " in w["target"])] or others
            d = (same[(li + 2) % len(same):] + same[:(li + 2) % len(same)])[:3]
            items = [({"text": x["target"], "emoji": x.get("emoji", "")} if with_emoji else {"text": x["target"]}) for x in d]
            items.insert(p, {"text": w["target"], "emoji": w.get("emoji", "")} if with_emoji else {"text": w["target"]})
            return items
        n = 0
        for w in new:
            p = pos_cycle % 4; pos_cycle += 1
            ex.append({"type": "select", "id": eid(n), "mode": "targetToNative", "prompt": w["target"], "audioTarget": w["target"], "options": opts_native(w, p), "correct": p}); n += 1
        for w in new[:2]:
            p = pos_cycle % 4; pos_cycle += 1
            ex.append({"type": "select", "id": eid(n), "mode": "nativeToTarget", "prompt": short(w["native"]), "audioTarget": w["target"], "options": opts_target(w, p), "correct": p}); n += 1
        w = new[2]
        p = pos_cycle % 4; pos_cycle += 1
        ex.append({"type": "select", "id": eid(n), "mode": "listen", "prompt": "Nghe rồi chọn từ bạn nghe thấy.", "audioTarget": w["target"], "options": opts_target(w, p, with_emoji=False), "correct": p}); n += 1
        (wb1, wb2, fb, ta) = S[key][li]
        de1, vi1 = wb1
        ans = vi1.rstrip(".!?").split()
        ex.append({"type": "wordBank", "id": eid(n), "direction": "targetToNative", "prompt": de1, "audioTarget": de1, "tokens": tokens_with_distractors(ans, VI_FILLER, 3, ui * 4 + li), "answer": ans}); n += 1
        vi2, de2 = wb2
        ans2 = de2.rstrip(".!?").replace(",", "").split()
        ex.append({"type": "wordBank", "id": eid(n), "direction": "nativeToTarget", "prompt": vi2, "tokens": tokens_with_distractors(ans2, DE_FILLER, 3, ui * 4 + li + 1), "answer": ans2}); n += 1
        sent, answer, options, vi = fb
        ex.append({"type": "fillBlank", "id": eid(n), "sentence": sent, "translation": vi, "audioTarget": sent.replace("___", answer), "options": options, "correct": options.index(answer)}); n += 1
        mp = seen[-5:] if len(seen) >= 5 else words[:5]
        ex.append({"type": "match", "id": eid(n), "pairs": [{"target": x["target"], "native": short(x["native"])} for x in mp]}); n += 1
        tvi, tde, alts = ta
        ex.append({"type": "typeAnswer", "id": eid(n), "mode": "produceTarget", "prompt": tvi, "audioTarget": tde, "answer": tde, "alternatives": alts}); n += 1
        records.append({"lessonId": lesson["id"], "exercises": ex})

with open(sys.argv[1], "w", encoding="utf-8", newline="\n") as f:
    for r in records:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")
print(len(records), "lessons", sum(len(r["exercises"]) for r in records), "exercises")

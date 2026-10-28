"""D-10 audit follow-up for es-vi (es-vi-audit.json: 4 P1 of 160 = 2.5 %, above the 2 % bar).
Fixes every P1 and the P2s that need no word outside the lexicon; records each decision in
decisions-audit.json. The course pass is then redone on the systemic patterns the audit found
(vosotros paradigms, habitual days, 'a/en casa de').
usage: python -I apply-audit.py"""
import json, pathlib, sys
sys.stdout.reconfigure(encoding="utf-8")
R = pathlib.Path(r"C:\src\lft-air")
def load(rel): return json.loads((R / rel).read_text(encoding="utf-8"))
def save(rel, d): (R / rel).write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
dec = {}

# es-au-1, es-au-7: speech variants (pack and speech items stay in sync)
pack = load("content/courses/es-vi.json")
ex = {e["id"]: e for s in pack["sections"] for u in s["units"] for l in u["lessons"] for e in l["exercises"]}
sp = load("content/es/speech/items.json")
def add_variants(eid, extra):
    e = ex[eid]
    for v in extra:
        if v not in e["acceptedVariants"]:
            e["acceptedVariants"].append(v)
    item = next(i for i in sp["items"] if i["id"] == e["speechItemId"])
    item["acceptedVariants"] = list(e["acceptedVariants"])
add_variants("es-vi:un-l0-e1", ["Esto es un perro", "Eso es un perro"])
dec["es-au-1"] = "fixed: 'Esto/Eso es un perro' accepted"
add_variants("es-vi:un-l2-e0", ["La tienda ya está abierta", "La tienda está abierta ahora"])
dec["es-au-7"] = "fixed: two natural variants accepted"

# es-au-4: vosotros forms in the unit-b guidebook (VARIETY.md: Peninsular paradigms)
unit_b = next(u for s in pack["sections"] for u in s["units"] if u["id"] == "es-vi:unit-b")
g = unit_b["guidebook"]
reps = [
    ("*soy, eres, es, somos, son* / *estoy, estás, está, estamos, están*",
     "*soy, eres, es, somos, sois, son* / *estoy, estás, está, estamos, estáis, están*"),
    ("*hablo, hablas, habla, hablamos, hablan*", "*hablo, hablas, habla, hablamos, habláis, hablan*"),
    ("*como, comes, come, comemos, comen*", "*como, comes, come, comemos, coméis, comen*"),
    ("*vivo, vives, vive, vivimos, viven*", "*vivo, vives, vive, vivimos, vivís, viven*"),
    ("*voy, vas, va, vamos, van*.", "*voy, vas, va, vamos, vais, van*."),
]
for old, new in reps:
    assert g.count(old) == 1, old
    g = g.replace(old, new)
note = ("\n\n### Ngôi *vosotros*\nỞ Tây Ban Nha, \"các bạn\" (nói thân mật với nhiều người) là *vosotros*: *sois, estáis, habláis, coméis, vivís, vais*. "
        "Khi nói lịch sự với nhiều người thì dùng *ustedes* với cùng dạng như *ellos*: *son, hablan, van*. Ở Mỹ Latinh chỉ dùng *ustedes*.")
anchor = "\n\n### Tener và hay"
assert g.count(anchor) == 1
g = g.replace(anchor, note + anchor)
unit_b["guidebook"] = g
dec["es-au-4"] = "fixed: vosotros forms in every paradigm of the unit-b guidebook, plus a short vosotros/ustedes note"
save("content/courses/es-vi.json", pack)
save("content/es/speech/items.json", sp)

# es-au-5, es-au-6: Vietnamese translations in the pack
pack = load("content/courses/es-vi.json")
ex = {e["id"]: e for s in pack["sections"] for u in s["units"] for l in u["lessons"] for e in l["exercises"]}
def vi_fix(eid, old, new):
    e = ex[eid]
    hits = [k for k, v in e.items() if isinstance(v, str) and old in v]
    assert hits, (eid, old)
    for k in hits:
        e[k] = e[k].replace(old, new)
    return hits
dec["es-au-5"] = "fixed: " + ",".join(vi_fix("es-vi:u3-l0-e8", "Tôi có một anh trai.", "Tôi có một anh trai (hoặc em trai)."))
dec["es-au-6"] = "kept: the blank drills por favor = làm ơn; a reordered gloss would hide what the gap tests"
save("content/courses/es-vi.json", pack)

# reading texts
rd = load("content/es/reception/reading.json")
def rd_fix(tid, old, new):
    t = next(x for x in rd["readings"] if x["id"] == tid)
    n = 0
    for b in t["blocks"]:
        if old in b["text"]:
            b["text"] = b["text"].replace(old, new); n += 1
    assert n, (tid, old)
rd_fix("es.read.ug_horario_museo", "Cerrado el lunes.", "Cerrado los lunes.")
rd_fix("es.read.cp3_aviso_biblioteca", "Cerrado el domingo y el lunes", "Cerrado los domingos y los lunes")
rd_fix("es.read.ug_horario_panaderia", "Cerrado el domingo.", "Cerrado los domingos.")
dec["es-au-2"] = "fixed in all three opening-hours notices (museo, biblioteca, panadería): habitual 'los lunes' / 'los domingos'"
rd_fix("es.read.uj_ciudad_mateo", "trabaja en la tienda.", "trabaja en una tienda.")
dec["es-au-8"] = "fixed"
rd_fix("es.read.uj_manana_estacion", "El café de la estación", "La cafetería de la estación")
dec["es-au-15"] = "fixed if cafetería is in the lexicon (checked by content:validate)"
save("content/es/reception/reading.json", rd)

# stories
st = load("content/es/stories/stories.json")
by = {s["id"]: s for s in st["stories"]}
def retext(sid, old, new, vi=None):
    x = next((x for x in by[sid]["sentences"] if x["text"] == old), None)
    assert x is not None, (sid, old)
    x["text"] = new
    if vi: x["translation"]["vi"] = vi
def sub_all(sid, old, new):
    n = 0
    for x in by[sid]["sentences"]:
        if old in x["text"]:
            x["text"] = x["text"].replace(old, new); n += 1
    return n
retext("es.story.carlos_esta_enfermo", "Con esta medicina, la fiebre va a pasar pronto.", "Con esta medicina, la fiebre va a bajar pronto.")
dec["es-au-3"] = "fixed: 'la fiebre va a bajar pronto' (bajar is taught; avoids the pronominal form at A1)"
retext("es.story.el_perro_de_ana", "Ana ríe y no llora más.", "Ana se ríe y ya no llora.")
dec["es-au-9"] = "fixed"
n = 0
for sid in by:
    n += sub_all(sid, "a la casa de ", "a casa de ") + sub_all(sid, "en la casa de ", "en casa de ") + sub_all(sid, "En la casa de ", "En casa de ")
dec["es-au-10"] = f"fixed across all stories ({n} sentences): 'a/en casa de + persona'"
dec["es-au-11"] = "fixed with es-au-10"
retext("es.story.la_fiesta_en_la_playa", "Lola lleva música y Iván lleva las bebidas.", "Lola lleva la música e Iván, las bebidas.")
dec["es-au-12"] = "fixed ('e Iván' before the i- sound)"
x = next(x for x in by["es.story.un_viaje_a_la_isla"]["sentences"] if x["translation"]["vi"] == "Khách sạn nằm trước mặt biển.")
x["translation"]["vi"] = "Khách sạn nằm ngay trước biển."
dec["es-au-13"] = "fixed"
retext("es.story.la_clase_de_baile", "Después de la clase, las diez personas de la clase van a un bar.", "Después de la clase, las diez personas van a un bar.")
dec["es-au-14"] = "fixed: repetition removed (compañero is not in the story band)"
save("content/es/stories/stories.json", st)

# listening, scenarios, concepts
ls = load("content/es/reception/listening.json")
clip = next(c for c in ls["clips"] if c["id"] == "es.clip.dele_b_l4_conversacion")
seg = [s for s in clip["segments"] if "somos cuatro" in s["text"]]
if seg:
    seg[0]["text"] = seg[0]["text"].replace("somos cuatro", "somos tres")
    for s in clip["segments"]:
        if "solo cuatro personas" in s["text"]:
            s["text"] = s["text"].replace("solo cuatro personas", "solo tres personas")
    dec["es-au-16"] = "fixed: the count matches the three people named"
save("content/es/reception/listening.json", ls)

sc = load("content/es/interaction/scenarios.json")
def walk(o):
    if isinstance(o, dict):
        for k, v in o.items():
            if k == "text" and v == "¿Otra cosa?": o[k] = "¿Algo más?"; dec["es-au-17"] = "fixed"
            elif k == "text" and v == "Terminamos. Gracias.": o[k] = "Hemos terminado. Muchas gracias."; dec["es-au-18"] = "fixed"
            else: walk(v)
    elif isinstance(o, list):
        for v in o: walk(v)
walk(sc)
save("content/es/interaction/scenarios.json", sc)

cc = load("content/es/pedagogy/concepts.json")
s = json.dumps(cc, ensure_ascii=False)
old = "động từ hợp với thứ được thích"
if old in s:
    cc = json.loads(s.replace(old, "động từ chia theo thứ được thích")); dec["es-au-19"] = "fixed"
save("content/es/pedagogy/concepts.json", cc)

(R / "content/es/_drafts/review/decisions-audit.json").write_text(json.dumps(dec, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
print(json.dumps(dec, ensure_ascii=False, indent=1))

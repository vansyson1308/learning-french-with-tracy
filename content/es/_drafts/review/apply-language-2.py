"""Second pass after apply-language.py: the story, speech and writing validators reject some fixes
(words outside the lexicon or the story band). Each is reworded within the course vocabulary,
or reverted and recorded as not applied (decisions-language.json is updated).
usage: python -I apply-language-2.py"""
import json, pathlib
R = pathlib.Path(r"C:\src\lft-air")
D = R / "content/es/_drafts/review/decisions-language.json"
dec = json.loads(D.read_text(encoding="utf-8"))
def load(rel): return json.loads((R / rel).read_text(encoding="utf-8"))
def save(rel, d): (R / rel).write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")

st = load("content/es/stories/stories.json")
by = {s["id"]: s for s in st["stories"]}
def sent(sid, text):
    return next(x for x in by[sid]["sentences"] if x["text"] == text)
def retext(sid, old, new, vi=None, en=None):
    x = sent(sid, old); x["text"] = new
    if vi: x["translation"]["vi"] = vi
    if en: x["translation"]["en"] = en
tm = lambda sid: by[sid].setdefault("tokenMap", {})

s = "es.story.el_perro_de_ana"; by[s]["newLexemes"].append("es:w:papa"); tm(s)["buscarlo"] = "es:w:buscar"
dec["es-lg-47"] += "; papá declared as a new word of the story"; dec["es-lg-48"] += "; buscarlo mapped to buscar"
by["es.story.la_cancion_de_ines"]["newLexemes"].append("es:w:terminar"); dec["es-lg-61"] += "; terminar declared new"
retext("es.story.el_barco_del_abuelo", "No, Rosa. Ya soy mayor.", "No, Rosa. Soy un abuelo.", en="No, Rosa. I'm a grandpa.")
dec["es-lg-63"] = "not applied: 'mayor' is beyond the A1-1 band of this story; 'Soy un abuelo' (≈ I'm too old) is understandable in context"
tm("es.story.ropa_para_la_oficina")["tal"] = "function"; dec["es-lg-69"] += "; 'tal' of qué tal mapped as a function word"
s = "es.story.un_dia_de_lluvia"
retext(s, "Pero cuando abre la ventana, ve que llueve.", "Pero cuando abre la ventana, ve la lluvia.")
retext(s, "Tengo frío y tengo toda la ropa mojada.", "Tengo frío y tengo agua en toda la ropa.")
retext(s, "Cuando salen del cine, ya no llueve.", "Cuando salen del cine, ya no hay lluvia.")
dec["es-lg-66"] = "fixed within the lexicon: 've la lluvia' (llover is not in the es lexicon)"
dec["es-lg-67"] = "fixed within the lexicon: 'tengo agua en toda la ropa' (mojado is not in the es lexicon)"
dec["es-lg-68"] = "not applied: 'ya no llueve' needs llover, not in the es lexicon; kept until the lexicon adds it"
s = "es.story.la_rodilla_de_javier"
retext(s, "Javier no ve una caja y tropieza con ella.", "Javier no ve una caja y golpea la caja con el pie.")
retext(s, "Y no puede correr durante dos semanas.", "Y no puede correr dos semanas.")
dec["es-lg-70"] = "not applied: tropezar is not in the es lexicon"
dec["es-lg-71"] = "fixed within the lexicon: 'no puede correr dos semanas'"
s = "es.story.el_examen_de_marcos"
retext(s, "Marcos, ¿y los deberes?", "Marcos, ¿y tu tarea?")
retext(s, "Mamá, la próxima vez voy a hacer los deberes.", "Mamá, la próxima vez voy a hacer mi tarea.")
retext(s, "Marcos tiene quince años y va al instituto.", "Marcos tiene quince años y va a la escuela.")
for k in ("es-lg-75", "es-lg-76"): dec[k] = "uncertain: 'los deberes' (Spain) is not in the es lexicon; 'tarea' stays until it is added"
dec["es-lg-78"] = "not applied: 'instituto' is beyond the story's band; 'escuela' is understood"
tm("es.story.el_tren_de_la_noche")["ay"] = "function"; dec["es-lg-81"] += "; interjection 'ay' mapped as a function word"
s = "es.story.la_clase_de_baile"; tm(s)["vuestro"] = "function"
retext(s, "¡Sí, claro!", "¡Sí, sí!", vi="Có chứ!", en="Yes, yes!")
dec["es-lg-83"] += "; possessive 'vuestro' mapped as a function word"
dec["es-lg-84"] = "fixed within the lexicon: '¡Sí, sí!' (claro is not in the es lexicon); the other story's '¡Sí, por favor!' answers an offer and is kept"
save("content/es/stories/stories.json", st)

# speech items mirror the pack's acceptedVariants
pack = load("content/courses/es-vi.json")
ex = {e["id"]: e for s_ in pack["sections"] for u in s_["units"] for l in u["lessons"] for e in l["exercises"]}
sp = load("content/es/speech/items.json")
for e_id in ("es-vi:uk-l2-e0", "es-vi:uk-l2-e1", "es-vi:uk-l3-e0"):
    item = next(i for i in sp["items"] if i["id"] == ex[e_id]["speechItemId"])
    item["acceptedVariants"] = list(ex[e_id]["acceptedVariants"])
save("content/es/speech/items.json", sp)

# writing model answer reverted (the rubric slot 'sống ở Madrid' needs 'vive en Madrid')
for rel in ("content/es/writing/tasks.json", "content/courses/es-vi.json"):
    p = R / rel
    t = p.read_text(encoding="utf-8").replace("Leo vive y trabaja en Madrid.", "Leo vive en Madrid y trabaja.")
    p.write_text(t, encoding="utf-8", newline="\n")
dec["es-lg-44"] = "not applied: the rubric slot 'lives in Madrid' expects 'vive en Madrid'; the model answer must meet its own rubric"
D.write_text(json.dumps(dec, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
print("ok")

"""Apply the D-10 language review to the generated OUTPUT files and the lexicon, before ingest. Decisions go to
content/it/_drafts/review/decisions-language.json. An Italian line that changes needs its English here: nothing is left stale.
usage: python -I it-review-language.py <repo root>"""
import json, re, sys

ROOT = sys.argv[1]
D = f"{ROOT}/content/it/_drafts"
REVIEW = f"{D}/review"
findings = json.load(open(f"{REVIEW}/findings-language.json", encoding="utf-8"))

EN = {
    "it.story.il_vicino_nuovo#10": "I am sorry, madam! I did not know: I have been here for two days.",
    "it.story.la_lettera_del_nonno#6": "He is my grandfather. His name was Hai and he was very kind.",
    "it.story.l_incidente#16": "My name is Paola. Here is my number, if you need anything.",
    "it.story.micro_la_cena#5": "No, no salt. Pasta with cheese and an egg.",
    "it.story.micro_il_signore#13": "The gentleman drinks tea and eats fruit.",
    "it.story.micro_pollo_o_pizza#5": "The waiter arrives.",
    "it.story.micro_buonanotte#6": "No! The milk and then to bed. No apple, no juice, no cheese.",
    "it.story.la_casa_di_lan#11": "The bathroom is near the kitchen. And there is a garden.",
    "it.story.la_casa_di_lan#12": "How much is the rent?",
    "it.story.la_casa_di_lan#15": "Good! For you, the rent is low.",
    "it.story.la_nave_di_nonno#0": "Pietro's grandfather is seventy.",
    "it.story.la_famiglia_conti#22": "Anna is happy: her father is kind to Marco.",
    "it.story.la_ricetta_di_rosa#4": "Rosa takes the bicycle and goes shopping.",
    "it.story.dal_dottore#10": "It is nothing serious. The body needs rest.",
    "it.story.che_tempo_fa#14": "In November it is already cold and it often rains.",
    "it.story.una_giornata_di_hoa#0": "Hoa is thirty and works in a hotel in Milan.",
    "it.story.una_giornata_di_hoa#17": "At ten she rests on the sofa.",
    "it.story.al_mercato#15": "Sara gives the money and the man gives the receipt to Grandma.",
    "it.story.il_compleanno_di_chi#5": "About a hundred euros. There are ten of us, so ten euros each.",
    "it.story.il_compleanno_di_chi#12": "At once the light comes on and all the friends sing.",
    "it.story.in_montagna#4": "They leave the car and go on foot.",
    "it.story.gli_animali_del_nonno#4": "Grandpa, can we help you?",
    "it.story.gli_animali_del_nonno#12": "The rabbit is in the kitchen, under the table, eating a carrot!",
    "it.story.il_vicino_nuovo#15": "Now every Thursday Duc goes to a lesson at Mrs Bruni's. He learns many new words.",
    "it.story.una_lingua_nuova#7": "The first lesson is on Tuesday at four.",
    "it.story.la_borsa_di_marta#11": "I have found a black bag on a seat.",
    "it.story.a_teatro#9": "Sorry, Chiara, what seats do we have?",
    "it.story.in_palestra#2": "On Monday evening she goes in and asks for information.",
    "it.story.il_bar_di_piazza#6": "A cappuccino without sugar?",
    "it.story.il_gatto_cattivo#9": "Lucia takes Otto to the vet.",
    "it.story.come_ti_chiami#0": "Bao is a Vietnamese boy. He is twenty-one.",
    "it.story.come_ti_chiami#14": "Do you want some more, Bao?",
    "it.story.la_nostra_casa#16": "Thank you, Mum. This is the most beautiful house in the world!",
    "it.story.il_biscotto_dolce#1": "An elderly lady is eating a very sweet biscuit.",
    "it.story.il_nuovo_lavoro#1": "One day she reads an advert on the internet.",
    "it.story.il_nuovo_lavoro#17": "Excuse me, miss, this is not my dish.",
    "it.story.il_cane_al_parco#14": "Let's go and look for him together. Do not be afraid.",
    "it.story.la_pizza_di_nino#6": "It is easy! You need flour, water, salt, oil and then tomato and cheese.",
    "it.story.lo_sciopero#18": "You got here despite the strike: for me that is a good thing. You start on Monday!",
    "it.story.la_torta_di_nonna#6": "We have to use flour, three eggs, sugar, milk and a lemon.",
    "it.story.la_torta_di_nonna#10": "The sisters put everything in a bowl.",
    "it.story.in_treno_con_lo_zaino#18": "Tom always loses everything, Pietro says.",
    "it.story.il_primo_giorno#17": "You are welcome, Minh. You study a lot: well done!",
    "it.story.la_ricetta_di_rosa#5": "She comes back with salt, a lemon and a bottle of oil.",
    "it.story.la_ricetta_di_rosa#12": "They eat together and drink orange juice.",
    "it.story.che_tempo_fa#13": "In September autumn begins.",
    "it.story.al_mercato#18": "All right, Sara. But first wash the tomatoes well!",
    "it.story.gli_animali_del_nonno#8": "Don't worry, Leo. Let's look for it together.",
    "it.story.il_vicino_nuovo#6": "I teach English.",
    "it.story.l_ultimo_treno#18": "Nam decides: from tomorrow he leaves earlier.",
    "it.story.a_teatro#21": "Me too! Shall we go back next month?",
    "it.story.il_bar_di_piazza#16": "You are good, Paola. Perhaps one day the bar will be yours!",
    "it.story.la_nostra_casa#2": "Our garden has many flowers, the mother goes on.",
    "it.story.l_incidente#15": "In the evening the woman from the car brought some flowers to the hospital.",
    "it.story.la_torta_di_nonna#12": "Can Dad help? He is a cook.",
    "it.story.la_torta_di_nonna#13": "No! Dad is at work. We will do it ourselves.",
    "it.story.in_treno_con_lo_zaino#11": "My backpack! On the train to Rome.",
    "it.story.in_treno_con_lo_zaino#14": "Good! Your backpack is on the three o'clock train.",
}
# Vietnamese names in Italian text: an Italian voice reads plain letters (the Vietnamese translation keeps the diacritics).
RENAME = {"it.story.dal_dottore": {"Tuấn": "Tuan"}, "it.story.la_bicicletta_rubata": {"Quân": "Quan"}, "it.story.l_incidente": {"Dũng": "Dung"}, "it.story.il_supermercato_chiuso": {"Bình": "Binh", "Ha": "Hoa"}}
MANUAL = {"dal_dottore#0", "la_bicicletta_rubata#0", "l_incidente#0", "il_supermercato_chiuso#1"}
FRAGMENTS = "applied in the generators (it-units.py, it-concepts.py)"

lines = lambda s: [json.loads(l) for l in open(f"{D}/{s}/OUTPUT.jsonl", encoding="utf-8") if l.strip()]
stories = {s["id"]: s for s in lines("stories")}
readings = lines("readings")
clips = lines("listening")
scenarios = lines("scenarios")
lex_path = f"{ROOT}/content/it/lexicon/lexemes.json"
lex = json.load(open(lex_path, encoding="utf-8"))
ids_path = f"{ROOT}/content/it/lexemes.json"
ids = json.load(open(ids_path, encoding="utf-8"))
by_lex = {l["id"]: l for l in lex["lexemes"]}
by_read = {r["id"]: r for r in readings}
by_clip = {c["id"]: c for c in clips}
by_scen = {s["id"]: s for s in scenarios}
decisions = []


def apply_lexeme(i, fix):
    l = by_lex[i]
    m = re.match(r"(.+?) = (.+?) \| (.+?) \|\| (.+)$", fix)
    surface, gloss, target, vi = m.groups()
    if surface != l["surface"]:
        del ids[l["surface"]]
        ids[surface] = i
        l["surface"] = surface
    l["glosses"]["vi"] = gloss
    ex = l["examples"][0]
    if ex["target"] != target:
        ex["target"] = target
        ex["translations"]["en"] = LEX_EN[i]
    ex["translations"]["vi"] = vi


LEX_EN = {
    "it:w:sorella": "My sister is twenty.", "it:w:anno": "I am twenty years old.", "it:w:ventuno": "Bus twenty-one goes to the centre.", "it:w:trenta": "A month has thirty days.",
    "it:w:quaranta": "There are forty students in the class.", "it:w:settanta": "The room costs seventy euros.", "it:w:ottanta": "The ticket costs eighty euros.", "it:w:colore": "What colour is it?",
    "it:w:papa": "Dad works here.", "it:w:arancia": "I would like an orange juice.", "it:w:mille": "The rent is a thousand euros.", "it:w:carro": "The horse pulls the cart.", "it:w:piano": "I live on the second floor.",
}

for f in findings:
    i, fix = f["id"], str(f["fix"])
    if i.startswith("it.story."):
        sid, _, rest = i.partition("#")
        if sid.endswith(".blurb"):
            stories[sid[:-6]]["blurb"]["vi"] = fix
        elif i.replace("it.story.", "") in MANUAL:
            pass
        else:
            m = re.match(r"\[(\w)\] (.+?) \|\| (.+)$", fix)
            s = stories[sid]["sentences"][int(rest)]
            if s["text"] != m.group(2):
                s["text"] = m.group(2)
                s["translation"]["en"] = EN[i]
            s["translation"]["vi"] = m.group(3)
    elif i.startswith("it.read."):
        by_read[i]["blocks"][0]["text"] = fix
    elif i.startswith("it.clip."):
        for part, seg in zip(fix.split(" | "), by_clip[i]["segments"]):
            seg["text"] = part.split(": ", 1)[1]
    elif i.startswith("it.scenario."):
        sid, node = i.rsplit(".", 1)
        n = by_scen[sid]["nodes"][node]
        parts = fix.split(" // ")
        n["text"] = parts[0]
        if len(parts) > 1:
            n["rephraseText"] = parts[1]
    elif i.startswith("it:w:"):
        apply_lexeme(i, fix)
    elif i.startswith(("it-vi:unit-", "it:concept:")):
        decisions.append({**f, "decision": FRAGMENTS})
        continue
    else:
        raise SystemExit(f"no rule for {i}")
    decisions.append({**f, "decision": "fixed"})

# The reviewer's wording, kept within the story's word band and length (the validators decide).
BAND = {
    "it.story.micro_pollo_o_pizza#5": ("Il cameriere è con Sara e Paolo.", "Người phục vụ đến chỗ Sara và Paolo.", "The waiter is with Sara and Paolo."),
    "it.story.micro_buonanotte#6": ("No! Il latte e a letto. Niente mela, niente succo, niente formaggio.", "Không! Sữa rồi lên giường. Không táo, không nước ép, không phô mai.", "No! The milk and to bed. No apple, no juice, no cheese."),
    "it.story.l_ultimo_treno#18": ("Da domani Nam parte prima.", "Từ mai Nam đi sớm hơn.", "From tomorrow Nam leaves earlier."),
    "it.story.in_treno_con_lo_zaino#18": ("Tom perde tutto, dice Pietro.", "Tom làm mất mọi thứ, Pietro nói.", "Tom loses everything, Pietro says."),
    "it.story.micro_pollo_o_pizza#3": ("La pizza! E tu, Sara?", "Pizza! Còn em, Sara?", "The pizza! And you, Sara?"),
    # Level-correct context for the words the reviewed sentences no longer carry (scala, ottobre, conto, sopra).
    "it.story.in_treno_con_lo_zaino#7": ("Tom e Pietro corrono sulle scale della stazione.", "Tom và Pietro chạy trên cầu thang nhà ga.", "Tom and Pietro run on the station stairs."),
    "it.story.che_tempo_fa#14": ("A ottobre e a novembre fa già freddo e piove spesso.", "Tháng Mười và tháng Mười Một trời đã lạnh và hay mưa.", "In October and November it is already cold and it often rains."),
    "it.story.il_bar_di_piazza#12": ("Un turista chiede il conto, ma non sa come pagare.", "Một du khách xin hóa đơn nhưng không biết trả tiền thế nào.", "A tourist asks for the bill but does not know how to pay."),
    "it.story.la_casa_di_lan#4": ("Buongiorno! Ecco la chiave. Questa è la porta. Io abito sopra.", "Chào cháu! Chìa khóa đây. Đây là cửa. Bác ở tầng trên.", "Good morning! Here is the key. This is the door. I live upstairs."),
}
stories["it.story.in_treno_con_lo_zaino"].setdefault("tokenMap", {})["scale"] = "it:w:scala"
for i, (it, vi, en) in BAND.items():
    sid, _, n = i.partition("#")
    stories[sid]["sentences"][int(n)].update({"text": it, "translation": {"vi": vi, "en": en}})
APPEND = {
    "it.story.il_vicino_nuovo": ("N", "La signora Bruni è molto contenta.", "Bà Bruni rất vui.", "Mrs Bruni is very happy."),
    "it.story.il_bar_di_piazza": ("B", "Grazie, Rina!", "Cảm ơn chị Rina!", "Thank you, Rina!"),
    "it.story.in_treno_con_lo_zaino": ("N", "Tom beve l'acqua e mangia un altro panino.", "Tom uống nước và ăn thêm một cái bánh mì kẹp.", "Tom drinks water and eats another sandwich."),
}
for sid, (sp, it, vi, en) in APPEND.items():
    stories[sid]["sentences"].append({"speaker": sp, "text": it, "translation": {"vi": vi, "en": en}})
stories["it.story.in_treno_con_lo_zaino"]["sentences"].append({"speaker": "N", "text": "Nonostante tutto, Tom sta bene.", "translation": {"vi": "Dù vậy, Tom vẫn ổn.", "en": "Despite everything, Tom is fine."}})

for sid, names in RENAME.items():
    st = stories[sid]
    for s in st["sentences"]:
        for a, b in names.items():
            s["text"] = re.sub(rf"\b{a}\b", b, s["text"])
    tm = st.setdefault("tokenMap", {})
    for a, b in names.items():
        tm.pop(a.lower(), None)
        tm[b.lower()] = "name"
hoa = stories["it.story.il_supermercato_chiuso"]
for s in hoa["sentences"]:
    s["translation"]["vi"] = s["translation"]["vi"].replace("Hà", "Hoa")
    s["translation"]["en"] = re.sub(r"\bHa\b", "Hoa", s["translation"]["en"])
hoa["blurb"]["vi"] = hoa["blurb"]["vi"].replace("Hà", "Hoa")
hoa["blurb"]["en"] = re.sub(r"\bHa\b", "Hoa", hoa["blurb"]["en"])

# Two scenarios share a clip with their rephrasing; a changed partner line must keep its clip's text.
for c in clips:
    m = re.match(r"it\.clip\.ix_(.+)_(\d+)(_s)?$", c["id"])
    if m and f"it.scenario.{m.group(1)}" in by_scen:
        n = by_scen[f"it.scenario.{m.group(1)}"]["nodes"][f"p{m.group(2)}"]
        c["segments"][0]["text"] = n["rephraseText"] if m.group(3) else n["text"]
for sc in scenarios:
    for k, n in sc["nodes"].items():
        if re.match(r"r\d+$", k):
            n["text"] = sc["nodes"]["p" + k[1:]]["rephraseText"]


def save(step, rows):
    with open(f"{D}/{step}/OUTPUT.jsonl", "w", encoding="utf-8", newline="\n") as out:
        for r in rows:
            out.write(json.dumps(r, ensure_ascii=False) + "\n")


save("stories", list(stories.values()))
save("readings", readings)
save("listening", clips)
save("scenarios", scenarios)
with open(lex_path, "w", encoding="utf-8", newline="\n") as out:
    json.dump(lex, out, ensure_ascii=False, indent=2)
    out.write("\n")
with open(ids_path, "w", encoding="utf-8", newline="\n") as out:
    json.dump(ids, out, ensure_ascii=False, indent=2)
    out.write("\n")
with open(f"{REVIEW}/decisions-language.json", "w", encoding="utf-8", newline="\n") as out:
    json.dump(decisions, out, ensure_ascii=False, indent=1)
    out.write("\n")
print("language review:", len(decisions), "decided")

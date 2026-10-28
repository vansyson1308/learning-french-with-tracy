"""D-10 AI review, de-vi language pass: apply de-vi-language.jsonl and record the outcome of every
finding (decisions-language.json).

- Plain text findings (readings, clips, scenarios, writing, guidebooks, concepts, exam options) are
  exact replacements in the named source file(s); each must hit exactly once per listed file.
- Story findings edit one sentence (text and/or speaker, with translation.vi / translation.en kept
  in step) through `story()`, which checks the current text first. Story text stays inside the de
  lexicon and the story's band: a word the lexicon lacks is either a compound mapped to its head in
  the story's tokenMap, or the fix is reworded / not applied.
- Voice casting: stories.json declares N and A on the male voice (thorsten) and B on the female one
  (kerstin); a woman's lines are moved to B.
- de-lg-1..4 (tier files) are fixed in the generator scripts/lib/authoring/review-tiers.ts and the
  files are regenerated with `bun scripts/author.ts review-tiers --course de-vi`.
Run once on a clean tree (git checkout the content files first to re-run).
usage: python -I apply-language.py"""
import json, pathlib

R = pathlib.Path(r"C:\src\lft-air")
F = R / "content/de/_drafts/review/de-vi-language.jsonl"
findings = [json.loads(l) for l in F.read_text(encoding="utf-8").splitlines() if l.strip() and not json.loads(l).get("summary")]
decisions = {}
texts = {}


def esc(s):
    return json.dumps(s, ensure_ascii=False)[1:-1]


def text_of(rel):
    if rel not in texts:
        texts[rel] = (R / rel).read_text(encoding="utf-8")
    return texts[rel]


def replace(fid, rels, old, new, note=""):
    """Exact replacement of a JSON string fragment, once in each file."""
    for rel in rels:
        t = text_of(rel)
        n = t.count(esc(old))
        if n != 1:
            raise SystemExit(f"{fid}: {rel} has {n} occurrences of {old!r}")
        texts[rel] = t.replace(esc(old), esc(new))
    decisions[fid] = f"fixed: \"{old}\" → \"{new}\"" + (f" ({', '.join(rels)})" if len(rels) > 1 else "") + note


# --- Tier files: generator fix ------------------------------------------------------------------------
GEN = " — fixed in the generator scripts/lib/authoring/review-tiers.ts (per-language name and variety, test in scripts/__tests__/review-tiers.test.ts); content/de/REVIEW-TIER1-*.md regenerated with `bun scripts/author.ts review-tiers --course de-vi`"
decisions["de-lg-1"] = "fixed: title \"# Review Tier 1 — Deutsch (de-vi)\"" + GEN
decisions["de-lg-2"] = "fixed: the Vietnamese brief names tiếng Đức, Bundesdeutsch and the Austrian/Swiss forms" + GEN
decisions["de-lg-3"] = "fixed: the English brief names German, Bundesdeutsch and the Austrian/Swiss forms" + GEN
decisions["de-lg-4"] = "fixed: \"Tiếng Đức in nghiêng chỉ để đối chiếu.\"" + GEN

# --- Readings, clips -----------------------------------------------------------------------------------
READ = "content/de/reception/reading.json"
LIS = "content/de/reception/listening.json"
replace("de-lg-5", [READ], "Nur für Gäste des Hotels. Andere Autos kosten 20 Euro.", "Nur für Gäste des Hotels. Für alle anderen: 20 Euro pro Tag.")
replace("de-lg-6", [READ], "Schwimmhosen und Badetücher jetzt billiger!", "Badehosen und Badetücher jetzt billiger!")
replace("de-lg-7", [READ], "Bitte leise sein! Telefonieren nur im Eingang.", "Bitte leise sein! Telefonieren nur im Eingangsbereich.")
replace("de-lg-8", [READ], "Hallo Herr Schmidt,", "Guten Tag, Herr Schmidt,", note=" (with the Duden comma after the greeting)")
decisions["de-lg-9"] = "uncertain: whether the Piper/espeak voice reads \"ICE\" as I-C-E or as the English word needs a listen to the generated clip; the item question names the ICE too, so the clip is left as is until then"
replace("de-lg-10", [LIS], "Um Viertel nach zehn. Also um 10 Uhr 15.", "Um Viertel nach zehn. Also um zehn Uhr fünfzehn.")
decisions["de-lg-11"] = "uncertain: espeak-ng's German front end normally expands \"Dr.\" to \"Doktor\"; confirm on the generated clip before rewording (the scenario text keeps \"Dr.\" either way)"
decisions["de-lg-12"] = "uncertain: same \"Dr.\" expansion question as de-lg-11; these clips voice the a1cap_arzt partner lines, whose shown text says \"Dr. Klein\", so the clip and the line should change together after the listen"
replace("de-lg-13", [LIS], "Achtung: Das Flugzeug nach Hanoi fliegt heute um sechzehn Uhr dreißig.", "Achtung: Der Abflug nach Hanoi ist heute um sechzehn Uhr dreißig.",
        note="; \"starten\" is not in the de lexicon, so the announcement uses Abflug (a course word); the item \"cất cánh lúc mười sáu giờ\" stays falsch")

# --- Scenarios, writing ----------------------------------------------------------------------------------
SCEN = "content/de/interaction/scenarios.json"
replace("de-lg-14", [SCEN], "Hỏi hiệu thuốc ở đâu và hỏi lại cho rõ.", "Hỏi hiệu thuốc ở đâu, rồi cảm ơn.")
t = text_of(SCEN)
n = t.count(esc("Hãy nói được."))
if n != 2:
    raise SystemExit(f"de-lg-15: {n} occurrences")
texts[SCEN] = t.replace(esc("Hãy nói được."), esc("Hãy đồng ý với giờ hẹn đó."))
decisions["de-lg-15"] = "fixed: \"Hãy nói được.\" → \"Hãy đồng ý với giờ hẹn đó.\" (nodes l1 and l1b)"
WRI = "content/de/writing/tasks.json"
PACK = "content/courses/de-vi.json"
EXAM = "content/de/exam/goethe-a1.json"
replace("de-lg-16", [WRI, PACK], "Sehr geehrte Damen und Herren, haben Sie am Samstag ein Zimmer frei? Viele Grüße, Minh",
        "Sehr geehrte Damen und Herren, haben Sie am Samstag ein Zimmer frei? Mit freundlichen Grüßen, Minh Tran")
replace("de-lg-17", [WRI, EXAM], "Was sind die Hausaufgaben? Können Sie mir bitte schreiben?", "Was sind die Hausaufgaben? Können Sie mir das bitte schreiben?")

# --- Guidebooks (de-vi.json) -------------------------------------------------------------------------------
replace("de-lg-18", [PACK], "Muốn phủ định một động từ, đặt *nicht* sau nó: *Ich esse nicht.* — Tôi không ăn.",
        "Muốn phủ định, thêm *nicht*; trong câu ngắn, *nicht* đứng sau động từ: *Ich esse nicht.* — Tôi không ăn. Với danh từ không có mạo từ thì dùng *kein*: *Ich esse kein Brot.*")
replace("de-lg-19", [PACK], "*Ein Wasser, bitte.* — Một nước, làm ơn.", "*Ein Wasser, bitte.* — Cho tôi một chai nước.")
replace("de-lg-20", [PACK], "**12.355 danh từ**", "**12.358 danh từ**")
replace("de-lg-21", [PACK], "- **-e**: giống cái 85,0 %", "- **-e**: giống cái 84,9 %")
t = text_of(PACK)
assert t.count(esc("- **-er**: giống đực 81,1 %")) == 1
texts[PACK] = t.replace(esc("- **-er**: giống đực 81,1 %"), esc("- **-er**: giống đực 80,9 %"))
decisions["de-lg-21"] += "; and \"-er: giống đực 81,1 %\" → \"80,9 %\" (both as in gender-stats and the concept card)"
decisions["de-lg-22"] = "uncertain: the proposed wording for the ich-Laut (\"như tiếng gió bật ra khi lưỡi đặt ở vị trí «i»\") is the reviewer's own guess; a native teacher should choose the Vietnamese description (Vietnamese «x» is [s], so a change is wanted)"
replace("de-lg-23", [PACK], "Nghe *Sie* là biết đó là cuộc trò chuyện trang trọng.", "Nghe *Sie* là biết hai người không thân và đang nói chuyện lịch sự.")
replace("de-lg-24", [PACK], "*Der Kurs beginnt um neun.* — Khóa học bắt đầu lúc chín giờ.", "*Der Kurs beginnt um neun.* — Lớp học bắt đầu lúc chín giờ.")
replace("de-lg-25", [PACK], "*Langsamer, bitte.* — Chậm hơn, làm ơn.", "*Langsamer, bitte.* — Làm ơn nói chậm hơn.")
replace("de-lg-26", [PACK], "*Haben Sie morgen um zehn Zeit?* — Ngày mai lúc mười giờ ông/bà có rảnh không?",
        "*Haben Sie morgen um zehn einen Termin frei?* — Ngày mai lúc mười giờ còn lịch trống không ạ?")

# --- Concept cards ---------------------------------------------------------------------------------------
CON = "content/de/pedagogy/concepts.json"
replace("de-lg-27", [CON], "-er kèm umlaut (das Kind → die Kinder, das Haus → die Häuser)", "-er, có umlaut nếu nguyên âm a/o/u đổi được (das Kind → die Kinder, das Haus → die Häuser)")
replace("de-lg-28", [CON], "Tiếng Đức là ngôn ngữ duy nhất viết hoa mọi danh từ, kể cả giữa câu", "Tiếng Đức viết hoa mọi danh từ, kể cả giữa câu")
replace("de-lg-29", [CON], "Ở số nhiều, âm lại «mềm»: die Hunde, die Tage.", "Khi phụ âm không còn đứng cuối (ví dụ ở số nhiều), âm lại «mềm»: die Hunde, die Tage.")
replace("de-lg-30", [CON], "Sau haben, möchten, brauchen, nehmen, kaufen tân ngữ ở đối cách: Ich möchte einen Tee.", "Một số danh từ giống đực còn thêm -n: der Junge → den Jungen, der Name → den Namen.")
replace("de-lg-31", [CON], "Muốn nói «không có» một danh từ, đặt k- trước", "Muốn phủ định một danh từ («không có», «không … nào»), thêm k- vào trước")
replace("de-lg-32", [CON], "Ở nhiều nơi làm việc trẻ và quán cà phê", "Ở nhiều công ty trẻ và quán cà phê")
decisions["de-lg-33"] = "uncertain: same ich-Laut description as de-lg-22; left for a native teacher so the guidebook and the concept card change together"

# --- Exam options ------------------------------------------------------------------------------------------
replace("de-lg-34", [EXAM], "Ở tầng một, cạnh thang máy", "Ở tầng 2 (ngay trên tầng trệt), cạnh thang máy",
        note="; the German \"erster Stock\" is not shown in the option (it would expose the audio's words), \"ngay trên tầng trệt\" removes the North/South ambiguity")
replace("de-lg-35", [EXAM], "Ở tầng hai, cạnh cầu thang", "Ở tầng 3, cạnh cầu thang")

for rel, t in texts.items():
    if t != (R / rel).read_text(encoding="utf-8"):
        (R / rel).write_text(t, encoding="utf-8", newline="\n")

# --- Stories -------------------------------------------------------------------------------------------------
ST = R / "content/de/stories/stories.json"
st = json.loads(ST.read_text(encoding="utf-8"))
by = {s["id"]: s for s in st["stories"]}


def story(fid, sid, i, old=None, text=None, vi=None, en=None, speaker=None, decision=None):
    x = by[sid]["sentences"][i]
    if old is not None and x["text"] != old:
        raise SystemExit(f"{fid}: {sid}#{i} is {x['text']!r}, expected {old!r}")
    if text is not None:
        x["text"] = text
    if vi is not None:
        x["translation"]["vi"] = vi
    if en is not None:
        x["translation"]["en"] = en
    if speaker is not None:
        x["speaker"] = speaker
    if decision is not None:
        decisions[fid] = decision
    elif text is not None:
        decisions[fid] = f"fixed: \"{old}\" → \"{text}\"" + ("; translations updated" if (vi or en) else "")
    else:
        decisions[fid] = "fixed: translation updated"


def tm(sid, key, target):
    by[sid].setdefault("tokenMap", {})[key] = target


def vi_replace(fid, sid, where, old, new):
    """Replace a Vietnamese string inside a story (sentence translation, question, option or blurb)."""
    s = by[sid]
    blob = json.dumps(s, ensure_ascii=False)
    if blob.count(esc(old)) != 1:
        raise SystemExit(f"{fid}: {blob.count(esc(old))} occurrences of {old!r} in {sid}")
    by[sid] = json.loads(blob.replace(esc(old), esc(new)))
    idx = next(k for k, v in enumerate(st["stories"]) if v["id"] == sid)
    st["stories"][idx] = by[sid]
    decisions[fid] = decisions.get(fid, f"fixed: {where} \"{old}\" → \"{new}\"")


s = "de.story.eine_wohnung_fuer_herrn_neumann"
story("de-lg-36", s, 3, "Dann findet er eine Anzeige: Kleines Apartment, 40 Meter, hell und modern, 500 Euro.",
      text="Dann findet er eine Anzeige: Kleines Apartment, 40 Quadratmeter, hell und modern, 500 Euro.",
      decision="fixed: \"40 Meter\" → \"40 Quadratmeter\"; Quadratmeter is not in the de lexicon (it cannot be declared new), so the story's tokenMap maps the compound to its head de:w:meter (A2-1, the story's band) — add de:w:quadratmeter to the lexicon later; translation and Q0 already say 40 mét vuông")
tm(s, "quadratmeter", "de:w:meter")
story("de-lg-74", s, 8, "Es hat ein Zimmer, eine kleine Küche und eine Toilette mit Dusche.", text="Es hat ein Zimmer, eine kleine Küche und ein Bad mit Dusche.",
      vi="Căn hộ có một phòng, một bếp nhỏ và một phòng tắm có vòi sen.", en="It has one room, a small kitchen and a bathroom with a shower.")

s = "de.story.der_geist_im_schloss"
story("de-lg-37", s, 12, "Der Junge hält seiner Mutter den Arm und sagt nichts mehr.", text="Der Junge hält seine Mutter am Arm und sagt nichts mehr.",
      en="The boy holds his mother by the arm. He says nothing more.")
story("de-lg-38", s, 18, "Hat er dort etwas gesehen? Das erzählt er niemals jemandem.", text="Hat er dort etwas gesehen? Das erzählt er niemandem.",
      en="Did he see something there? He tells nobody.")
story("de-lg-39", s, 9, "Eine alte Dame sagt laut: Mein Gott! Ein Teufel!", text="Eine alte Dame sagt laut: Mein Gott! Der Geist!",
      vi="Một bà cụ hét lên: Lạy Chúa! Hồn ma!", en="An old lady screams: My God! The ghost!")
story("de-lg-40", s, 1, "Der Eintritt kostet zehn Euro. Der Fahrer vom Bus wartet draußen.", text="Der Eintritt kostet zehn Euro. Der Busfahrer wartet draußen.")
story("de-lg-40", s, 14, "Es ist der Fahrer vom Bus! Er hat eine Maske in der Hand.", text="Es ist der Busfahrer! Er hat eine Maske in der Hand.",
      decision="fixed: \"der Fahrer vom Bus\" → \"der Busfahrer\" in sentences 2 and 15; the compound is mapped to its head de:w:fahrer in the story's tokenMap (Busfahrer is not in the lexicon)")
tm(s, "busfahrer", "de:w:fahrer")

s = "de.story.die_hochzeit_von_tante_lisa"
story("de-lg-41", s, 13, "Nein, ich bin froh. Das ist die Freude!", text="Nein, ich bin froh. Ich weine vor Freude!",
      vi="Không, mẹ vui lắm. Mẹ khóc vì vui đấy!", en="No, I'm glad. I'm crying with joy!")
for i in (5, 13):
    assert by[s]["sentences"][i]["speaker"] == "A"
    by[s]["sentences"][i]["speaker"] = "B"
decisions["de-lg-42"] = ("fixed (speaker field): Mia's mother's lines (sentences 6 and 14) move from cast A (thorsten, male) to B (kerstin, female); "
                         "the story keeps its Mama, and Mia and her mother now share the one female story voice — each line addresses the other, so the turns stay clear")

s = "de.story.ein_fall_fuer_frau_weber"
story("de-lg-43", s, 11, "Der Dieb ist über den Baum gekommen.", text="Der Dieb ist über den Baum durch das Fenster gekommen.",
      vi="Tên trộm đã trèo lên cây rồi vào qua cửa sổ.", en="The thief came in over the tree and through the window.")

s = "de.story.ben_beim_arzt"
decisions["de-lg-44"] = "not applied: Tablette is not in the de lexicon (it cannot be declared new), and de:w:pille is the story's declared new word; add de:w:tablette to the lexicon, then swap"
story("de-lg-45", s, 1, "Er ist zu schnell und fällt auf die Straße.", text="Er fährt zu schnell und fällt auf die Straße.",
      vi="Cậu đạp xe quá nhanh và ngã xuống đường.", en="He rides too fast and falls onto the street.")
story("de-lg-46", s, 9, "Nach einer Stunde sagt eine Dame: Ben, bitte!", text="Nach einer Stunde ruft eine Frau: Ben, bitte!",
      vi="Sau một tiếng, một người phụ nữ gọi: Ben, mời vào!", en="After an hour a woman calls: Ben, please!")

story("de-lg-47", "de.story.wo_ist_mein_handy", 12, "Irgendwo klingt eine leise Musik.", text="Irgendwo spielt leise Musik.")
story("de-lg-48", "de.story.ein_abend_im_kino", 17, "Der Film war super. Und du?", text="Der Film war super. Wie findest du ihn?",
      vi="Bộ phim tuyệt quá. Anh thấy phim thế nào?", en="The film was great. What did you think of it?")
s = "de.story.ein_tag_am_see"
story("de-lg-49", s, 13, "Bello! Komm hierher!", text="Bello! Komm her!")
story("de-lg-50", s, 9, "Später kommt Wind.", text="Später kommt Wind auf.")
story("de-lg-98", s, 4, vi="Bọn trẻ bơi, còn bố đọc sách trên bãi tắm ven hồ.", decision="fixed: \"bãi biển\" → \"bãi tắm ven hồ\" (translation.vi)")
vi_replace("de-lg-99", s, "question 1", "Bố làm gì trên bãi biển?", "Bố làm gì trên bãi tắm ven hồ?")

s = "de.story.das_grosse_spiel"
story("de-lg-51", s, 11, "Jonas wirft den Ball zu seinem Freund Leo, und Leo trifft. Eins zu eins!", text="Jonas spielt den Ball zu seinem Freund Leo, und Leo trifft. Eins zu eins!",
      en="Jonas passes the ball to his friend Leo, and Leo scores. One all!")
story("de-lg-100", s, 11, vi="Jonas chuyền bóng cho bạn Leo, và Leo ghi bàn. Một đều!", decision="fixed: \"ném bóng\" → \"chuyền bóng\" (translation.vi, with de-lg-51)")
story("de-lg-52", s, 8, "Das sagt Herr Klein. Er hilft dem Team und glaubt an seine Kinder.", text="Das sagt Herr Klein. Er hilft dem Team und glaubt an die Kinder.",
      vi="Ông Klein nói vậy. Ông giúp cả đội và tin vào bọn trẻ.", en="Mr Klein says that. He helps the team and believes in the children.")

story("de-lg-53", "de.story.opas_geschichte", 10, "Und wie hast du Oma gefunden?", text="Und wie hast du Oma kennengelernt?", en="And how did you meet Grandma?")
s = "de.story.kochen_mit_oma"
story("de-lg-54", s, 8, "Dann mischt Tim das Gemüse in die Suppe.", text="Dann gibt Tim das Gemüse in die Suppe und mischt alles.",
      en="Then Tim puts the vegetables into the soup and stirs everything.")
story("de-lg-55", s, 15, "Die Kartoffel nimmt das Salz. Das hat mir meine Mutter erklärt.", text="Die Kartoffel nimmt das Salz auf. Das hat mir meine Mutter erklärt.",
      en="The potato soaks up the salt. My mother explained that to me.")
story("de-lg-56", s, 7, "Oma macht den Herd an und gibt Öl, Fleisch und Wasser dazu.", text="Oma macht den Herd an und gibt Öl, Fleisch und Wasser in den Topf.",
      vi="Bà bật bếp rồi cho dầu, thịt và nước vào nồi.", en="Grandma switches on the stove and puts oil, meat and water into the pot.")
story("de-lg-57", "de.story.der_koenig_und_das_feuer", 13, "Wirf den Stein vor die Armee, sagte die Frau.", text="„Wirf den Stein vor die Armee!“, sagte die Frau.",
      vi="“Hãy ném hòn đá trước đạo quân!”, bà lão nói.", en="“Throw the stone in front of the army!” the woman said.")

s = "de.story.die_pruefung"
story("de-lg-58", s, 13, "Das Programm ist lang: Lesen, Hören, Schreiben und Sprechen.", text="Die Prüfung ist lang: Lesen, Hören, Schreiben und Sprechen.",
      vi="Bài thi dài: Đọc, Nghe, Viết và Nói.", en="The exam is long: reading, listening, writing and speaking.")
by[s]["newLexemes"].remove("de:w:programm")
decisions["de-lg-58"] += "; de:w:programm no longer occurs here, so it leaves the story's newLexemes (still taught in eine_internationale_hochzeit)"
story("de-lg-59", s, 10, "Dann werden es weniger. Am Ende sind ihre Fehler selten.", text="Dann werden es weniger. Am Ende macht sie nur noch selten Fehler.",
      en="Then there are fewer. In the end she only rarely makes mistakes.")
for i, x in enumerate(by[s]["sentences"]):
    if i in (5, 7, 11, 21):
        assert x["speaker"] == "A", (i, x)
        x["speaker"] = "B"
decisions["de-lg-60"] = ("fixed (speaker field): Nina's lines (sentences 6, 8, 12 and 22) move from cast A (thorsten, male) to B (kerstin, female); "
                         "Nina stays Lan's friend Nina, and the two friends share the one female story voice — the narrator separates most turns")

s = "de.story.der_alte_hund_rex"
story("de-lg-61", s, 22, "Ja. Und die vergessen wir nie.", text="Ja. Und Rex vergessen wir nie.",
      vi="Ừ. Và chúng ta sẽ không bao giờ quên Rex.", en="Yes. And we'll never forget Rex.")
story("de-lg-62", s, 19, "Auf einem Foto ist Rex noch ein Baby, mit großen Augen und kurzen Beinen.", text="Auf einem Foto ist Rex noch ganz klein, mit großen Augen und kurzen Beinen.",
      vi="Trong một bức ảnh Rex vẫn còn bé xíu, mắt to và chân ngắn.", en="In one photo Rex is still very small, with big eyes and short legs.")
story("de-lg-63", "de.story.die_party_bei_kai", 16, "Kein Problem. Hier geht es nur um den Spaß!", text="Kein Problem. Hier geht es nur um Spaß!")
story("de-lg-64", "de.story.hilfe_im_zug", 10, "Am nächsten Bahnhof gibt es ein Café. Der Zug wartet dort fünf Minuten.", text="Am nächsten Bahnhof gibt es ein Café. Der Zug hält dort fünf Minuten.",
      en="At the next station there is a café. The train stops there for five minutes.")
story("de-lg-65", "de.story.urlaub_in_vietnam", 7, "An Bord ist es ruhig. Die Kinder schlafen bald.", text="An Bord ist es ruhig. Die Kinder schlafen bald ein.",
      vi="Trên máy bay yên tĩnh. Bọn trẻ chẳng mấy chốc đã ngủ.")
story("de-lg-66", "de.story.auf_dem_markt", 12, "Beim Käse ist es teuer. Hundert Gramm kosten vier Euro.", text="Der Käse ist teuer. Hundert Gramm kosten vier Euro.",
      vi="Phô mai thì đắt. Một trăm gam giá bốn euro.", en="The cheese is expensive. A hundred grams cost four euros.")

s = "de.story.der_erste_tag_im_kurs"
story("de-lg-67", s, 0, "Heute ist Montag. Duc beginnt einen Kurs für Deutsch an einer Schule in der Stadt.", text="Heute ist Montag. Duc beginnt einen Deutschkurs an einer Schule in der Stadt.")
decisions["de-lg-67"] += "; the compound is mapped to its head de:w:kurs in the story's tokenMap (Deutschkurs is not in the lexicon)"
tm(s, "deutschkurs", "de:w:kurs")
story("de-lg-68", s, 15, "Sie hat die richtige Antwort, und alle lachen froh.", text="Sie hat die richtige Antwort, und alle freuen sich.",
      vi="Cô trả lời đúng, và mọi người đều vui.", en="She has the right answer, and everyone is pleased.")

story("de-lg-69", "de.story.ein_jahr_mit_familie_schulz", 6, "Im Juni ist die Schule zu Ende, und im Juli und im August ist Sommer.", text="Im Juni ist es schon warm, und im Juli und im August ist Sommer.",
      vi="Tháng Sáu trời đã ấm, tháng Bảy và tháng Tám là mùa hè.", en="In June it is already warm, and July and August are summer.")
story("de-lg-70", "de.story.im_restaurant", 16, "Das Essen von Ihnen kostet heute nichts. Das war unser Fehler.", text="Ihr Essen kostet heute nichts. Das war unser Fehler.")
story("de-lg-71", "de.story.ein_anruf_von_opa", 13, "Vielleicht einen Kuchen. Die Großmutter macht das Essen.", text="Vielleicht einen Kuchen. Oma macht das Essen.")
story("de-lg-104", "de.story.ein_anruf_von_opa", 1, vi="Đó là ông ở Hamburg.", decision="fixed: \"ông nội\" → \"ông\" (translation.vi)")
story("de-lg-72", "de.story.der_ausflug_im_regen", 6, "Die Abfahrt von ihrem Zug ist um 9 Uhr 10, die Ankunft um 10 Uhr.", text="Auf der Fahrkarte steht: Abfahrt 9 Uhr 10, Ankunft 10 Uhr.",
      vi="Trên vé ghi: khởi hành 9 giờ 10, đến nơi 10 giờ.", en="The ticket says: departure 9.10, arrival 10.00.")
story("de-lg-73", "de.story.das_praktikum", 18, "Vielleicht können wir den Kunden mehr Information im Internet geben?", text="Vielleicht können wir den Kunden mehr Informationen im Internet geben?")
s = "de.story.krank_im_bett"
story("de-lg-75", s, 9, "Das ist nicht gut für Ihren Körper. Sie sollen aufhören.", text="Das ist nicht gut für Ihren Körper. Sie müssen aufhören.",
      vi="Như thế không tốt cho cơ thể ông. Ông phải bỏ thuốc.", en="That's not good for your body. You must stop.")
story("de-lg-76", s, 11, "Sie gibt ihm Medizin für den Husten und eine Pille für das Fieber.", text="Sie gibt ihm Medizin gegen den Husten und eine Pille gegen das Fieber.")
story("de-lg-77", "de.story.der_schatz_im_alten_haus", 17, "Das sind dein Opa und ich. Hier haben wir uns kennengelernt. Das war unser Schatz.",
      text="Das sind euer Opa und ich. Hier haben wir uns kennengelernt. Das war unser Schatz.")
s = "de.story.die_wahl_im_dorf"
story("de-lg-78", s, 3, "Herr Groß hat viel Geld und einen großen Ruf. Er ist ein Boss in einer Firma.", text="Herr Groß hat viel Geld und ist sehr bekannt. Er ist Chef in einer Firma.",
      vi="Ông Groß giàu có và rất nổi tiếng. Ông là sếp ở một công ty.", en="Mr Groß is rich and very well known. He is a boss at a company.")
story("de-lg-79", s, 4, "Herr Stein ist ein Bauer. Er ist ein Mitglied im Verein für Fußball, und alle kennen ihn.", text="Herr Stein ist ein Bauer. Er ist Mitglied im Fußballverein, und alle kennen ihn.")
decisions["de-lg-79"] += "; the compound is mapped to its head de:w:verein in the story's tokenMap (Fußballverein is not in the lexicon)"
tm(s, "fußballverein", "de:w:verein")
s = "de.story.die_einladung_zum_grillen"
story("de-lg-80", s, 6, "Keine Sorge. Im Sommer ist die Kleidung beim Grillen ganz normal.", text="Keine Sorge. Beim Grillen im Sommer trägt man ganz normale Kleidung.",
      en="Don't worry. At a barbecue in summer people wear quite normal clothes.")
story("de-lg-81", s, 9, "Hung zieht ein schwarzes Hemd an. Aber dann möchte er es wieder ausziehen und nimmt ein Hemd mit Blumen.",
      text="Hung zieht ein schwarzes Hemd an. Aber dann zieht er es wieder aus und nimmt ein Hemd mit Blumen.",
      vi="Hùng mặc một chiếc áo sơ mi đen. Nhưng rồi anh lại cởi ra và chọn một chiếc áo có hoa.", en="Hung puts on a black shirt. But then he takes it off again and picks a shirt with flowers.")
s = "de.story.beim_amt"
story("de-lg-82", s, 17, "Danach geht Thao zur Bank. Sie möchte ein Konto für ihr Geld.", text="Danach geht Thao zur Bank. Sie braucht ein Konto.",
      vi="Sau đó Thảo đến ngân hàng. Cô cần mở một tài khoản ngân hàng.", en="After that Thao goes to the bank. She needs an account.")
story("de-lg-83", s, 1, "Heute muss sie sich in der Stadt anmelden. Das ist für alle Ausländer wichtig.", text="Heute muss sie sich in der Stadt anmelden. Das muss in Deutschland jeder machen.",
      vi="Hôm nay cô phải đăng ký cư trú ở thành phố. Ở Đức ai cũng phải làm việc này.", en="Today she has to register in the city. Everyone in Germany has to do that.")
s = "de.story.papa_holt_lina_ab"
story("de-lg-84", s, 3, "Er beeilt sich, denn er ist schon ein bisschen spät.", text="Er beeilt sich, denn er ist schon ein bisschen zu spät.")
story("de-lg-85", s, 4, "Im Kindergarten malen die Kinder gerade Bilder. Eine Erwachsene, Frau Engel, hilft ihnen.", text="Im Kindergarten malen die Kinder gerade Bilder. Frau Engel hilft ihnen.",
      vi="Ở nhà trẻ bọn trẻ đang vẽ tranh. Cô Engel đang giúp các bé.", en="At the kindergarten the children are painting pictures. Ms Engel is helping them.")
story("de-lg-86", s, 13, "Weil du gern Grün magst!", text="Weil du Grün so magst!", en="Because you like green so much!")
s = "de.story.urlaub_im_internet"
story("de-lg-87", s, 2, "Ich möchte auf eine Insel abfliegen und am Strand liegen.", text="Ich möchte auf eine Insel fliegen und am Strand liegen.")
story("de-lg-88", s, 7, "Sie muss nur zwei Mal anklicken, und schon sieht man schöne Fotos.", text="Sie klickt eine Seite an, und schon sieht man schöne Fotos.",
      vi="Mẹ nhấp chuột vào một trang, và thế là đã thấy những bức ảnh đẹp.", en="She clicks on a page, and there are already beautiful photos.")
tm(s, "klickt", "de:w:anklicken")
decisions["de-lg-88"] += "; \"klickt\" (of anklicken) mapped in the story's tokenMap"
story("de-lg-89", s, 18, "Moment! Ich muss erst die Reise beenden. Noch ein Mal anklicken — fertig!", text="Moment! Ich muss noch bezahlen. Noch einmal hier anklicken — fertig!",
      vi="Đợi đã! Mẹ còn phải thanh toán. Nhấp thêm một lần nữa — xong!", en="Wait! I still have to pay. One more click here — done!",
      decision="fixed within the lexicon: \"Moment! Ich muss noch bezahlen. Noch einmal hier anklicken — fertig!\" — Buchung/buchen are not in the de lexicon, so the booking is completed by paying (bezahlen, A1-2); the false \"die Reise beenden\" is gone; translations updated")
s = "de.story.an_der_ampel"
story("de-lg-90", s, 13, "Stimmt das?", text="Der Polizist fragt Paul: Stimmt das?", speaker="N",
      vi="Viên cảnh sát hỏi Paul: Có đúng vậy không?", en="The officer asks Paul: Is that right?",
      decision="fixed: sentence 14 becomes a narrator line \"Der Polizist fragt Paul: Stimmt das?\" (speaker A → N), so the next line on the same male voice is clearly Paul's answer; the narrator and A share the only male voice, so the cue has to be in the text")
story("de-lg-91", s, 5, "Haben Sie sich verletzt? Es tut mir so leid! Meine Reaktion war zu spät.", text="Haben Sie sich verletzt? Es tut mir so leid! Meine Reaktion war zu langsam.",
      en="Are you hurt? I'm so sorry! My reaction was too slow.")
s = "de.story.die_anmeldung"
story("de-lg-92", s, 3, "Guten Tag. Darf ich Sie um Hilfe bitten? Ich will einen Kurs machen.", text="Guten Tag. Darf ich Sie um Hilfe bitten? Ich möchte einen Deutschkurs machen.",
      vi="Chào chị. Chị giúp tôi được không? Tôi muốn học một khoá tiếng Đức.", en="Good morning. May I ask you for help? I'd like to take a German course.")
decisions["de-lg-92"] += "; Deutschkurs mapped to its head de:w:kurs in the story's tokenMap"
tm(s, "deutschkurs", "de:w:kurs")
story("de-lg-105", s, 0, vi="Anh Minh mới đến thành phố. Anh muốn học tiếng Đức.")
story("de-lg-105", s, 24, vi="Thứ Hai anh Minh có mặt đúng giờ. Vợ anh cũng đến.", decision="fixed: \"anh Tran\" → \"anh Minh\" in translation.vi of sentences 1 and 25")
s = "de.story.der_umzug"
story("de-lg-93", s, 19, "Die Straße kennst du schon. Und die Zahl an der Tür ist sieben.", text="Die Straße kennst du schon. Und die Nummer an der Tür ist sieben.")
story("de-lg-94", s, 12, "Wir können den Schrank verkaufen. Ich empfehle das Internet.", text="Wir können den Schrank im Internet verkaufen. Das empfehle ich dir.",
      vi="Mình có thể bán cái tủ trên mạng. Tớ khuyên cậu thế.", en="We can sell the wardrobe on the internet. I recommend that.")
story("de-lg-95", "de.story.die_reise_nach_hamburg", 11, "Paul muss früh aufstehen. Er geht zur Straße. Aber sein Auto ist weg!", text="Paul muss früh aufstehen. Er geht auf die Straße. Aber sein Auto ist weg!")
s = "de.story.der_flohmarkt"
story("de-lg-96", s, 3, "Die Kamera ist kaputt. Nam will sie nicht erst reparieren.", text="Die Kamera ist kaputt. Nam will sie nicht reparieren.",
      vi="Máy ảnh bị hỏng. Nam không muốn sửa nó.", en="The camera is broken. Nam doesn't want to repair it.")
story("de-lg-97", s, 7, "Fünf Euro. Er ist echt gut und noch ganz neu.", text="Fünf Euro. Er ist echt gut und wie neu.",
      vi="Năm euro ạ. Nó tốt thật sự và còn như mới.", en="Five euros. It's really good and as good as new.",
      decision="fixed within the lexicon: \"noch ganz neu\" → \"wie neu\" (\"fast\" is not in the de lexicon); translations updated")
story("de-lg-102", s, 13, vi="Nó đã hơn sáu mươi năm tuổi. Với ông nó rất quan trọng. Ông trả các cháu 80 euro.", decision="fixed: \"ta\" → \"ông\" (translation.vi)")
story("de-lg-103", s, 15, vi="Ông sửa máy ảnh cũ. Đó là sở thích của ông.", decision="fixed: \"ta\" → \"ông\" (translation.vi)")
story("de-lg-101", "de.story.die_neue_wohnung", 15, vi="Xin chào. Tôi là ông Braun. Tôi sống ở tầng dưới.", decision="fixed: \"tầng một bên dưới\" → \"tầng dưới\" (translation.vi)")
s = "de.story.der_professor_und_der_stein"
story("de-lg-106", s, 6, vi="Giáo sư nói như vậy với cô sinh viên Nora.")
vi_replace("de-lg-106", s, "blurb", "Cô học trò Nora", "Cô sinh viên Nora")
decisions["de-lg-106"] = "fixed: \"học trò\" → \"sinh viên\" in sentence 7's translation.vi and the blurb"

ST.write_text(json.dumps(st, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")

missing = [f["id"] for f in findings if f["id"] not in decisions]
order = {f["id"]: i for i, f in enumerate(findings)}
out = {k: decisions[k] for k in sorted(decisions, key=lambda k: order[k])}
(R / "content/de/_drafts/review/decisions-language.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
print("decided", len(decisions), "of", len(findings), "undecided:", missing)

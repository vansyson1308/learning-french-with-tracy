"""de-vi stories 44+ (QC 2026-10-29 evening §2): A1-2 stories written with the 690-word A1 syllabus only,
so every A1 lexeme that so far met the learner only in an A2-1 story has a level-correct context.
Writes content/de/stories/stories.json directly, as de-stories-25.py does (the course is promoted, there
is no staged copy): the first 43 stories stay byte-identical and in order, these follow;
the new stories are not in the band-1 audio list (they are read with the device voice).
Cast: A = de_DE-thorsten-high (male), B = de_DE-kerstin-low (female).
usage: python -I -X utf8 content/de/_drafts/_generators/de-stories-26.py"""
import json, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
LEX = json.load(open(os.path.join(ROOT, "content", "de", "lexicon", "lexemes.json"), encoding="utf-8"))["lexemes"]
IDS = {l["id"] for l in LEX}
BY_SURFACE = {l["surface"]: l["id"] for l in LEX}
BY_LOOKUP = {}
for l in LEX:
    BY_LOOKUP.setdefault(l["lookupForm"].lower(), l["id"])
STORIES = os.path.join(ROOT, "content", "de", "stories", "stories.json")


def lid(word):
    if word.startswith("de:w:"):
        assert word in IDS, f"not in lexicon: {word}"
        return word
    if word in BY_SURFACE:
        return BY_SURFACE[word]
    k = word.lower()
    assert k in BY_LOOKUP, f"not in lexicon: {word}"
    return BY_LOOKUP[k]


# "ihr/ihre/…" as the possessive "her/their" (de:w:ihr), not the formal "Ihr" (de:w:ihr-determiner).
HER = {k: "de:w:ihr" for k in ("ihr", "ihre", "ihren", "ihrem", "ihrer")}


# Homographs whose lexicon entry beyond A1 would otherwise win: "alle" (determiner all, not the A2 entry),
# "glaube" (verb, not der Glaube), "liebe" (adjective lieb), "macht" (machen, not die Macht),
# "meinen" (possessive mein, not the verb), "schickt" (missing from the verb evidence).
COMMON = {"alle": "de:w:all", "allen": "de:w:all", "glaube": "de:w:glauben", "liebe": "de:w:lieb",
          "macht": "de:w:machen", "meine": "de:w:mein", "meinen": "de:w:mein", "schickt": "de:w:schicken"}


def story(sid, title, blurb, new, sentences, questions, names=(), token_map=None):
    import re
    used = {w.lower() for _, de, _, _ in sentences for w in re.findall(r"[^\W\d_]+", de)}
    tm = {k: v for k, v in COMMON.items() if k in used}
    tm.update({n.lower(): "name" for n in names})
    for k, v in (token_map or {}).items():
        tm[k.lower()] = v if v in ("function", "name") else lid(v)
    out = {"id": f"de.story.{sid}", "band": "A1-2", "title": title, "blurb": {"vi": blurb[0], "en": blurb[1]},
           "newLexemes": [lid(w) for w in new]}
    if tm:
        out["tokenMap"] = tm
    out["sentences"] = [{"speaker": s, "text": de, "translation": {"vi": vi, "en": en}} for s, de, vi, en in sentences]
    out["questions"] = [{"kind": k, "prompt": {"vi": qv, "en": qe}, "options": [{"vi": a, "en": b} for a, b in opts], "answer": ans}
                        for k, qv, qe, opts, ans in questions]
    out["sourceRef"] = "original-project"
    return out


S = []
S.append(story("mit_dem_zug_nach_wien", "Mit dem Zug nach Wien",
 ("Ông Becker và con gái Mia đi tàu đến Viên thăm ông bà. Tàu đến muộn, và họ lỡ chuyến nối.", "Mr Becker and his daughter Mia take the train to Vienna to visit the grandparents. The train is late, and they miss their connection."),
 ["Papa", "Durchsage", "Anschluss"],
 [("N", "Herr Becker und seine Tochter Mia reisen am Samstag nach Wien. Dort leben Mias Großeltern.", "Ông Becker và con gái Mia đi Viên vào thứ Bảy. Ông bà của Mia sống ở đó.", "Mr Becker and his daughter Mia are travelling to Vienna on Saturday. Mia's grandparents live there."),
  ("N", "Die Fahrkarten hat Herr Becker im Reisebüro gekauft. Die Reise mit der Bahn dauert sieben Stunden.", "Ông Becker đã mua vé ở đại lý du lịch. Chuyến đi bằng tàu mất bảy tiếng.", "Mr Becker bought the tickets at the travel agency. The journey by train takes seven hours."),
  ("B", "Papa, wo fährt unser Zug ab?", "Bố ơi, tàu của mình chạy từ đâu ạ?", "Dad, where does our train leave from?"),
  ("A", "Moment! Ich brauche noch Geld vom Automaten. Dann fragen wir an der Auskunft.", "Đợi chút! Bố còn phải rút tiền ở máy đã. Rồi mình hỏi ở quầy thông tin.", "Just a moment! I still need money from the machine. Then we'll ask at the information desk."),
  ("N", "An der Auskunft sagt eine Frau: „Der Zug nach Wien soll um 8 Uhr von Gleis 12 abfahren.“", "Ở quầy thông tin, một người phụ nữ nói: «Tàu đi Viên sẽ khởi hành lúc 8 giờ từ đường ray số 12.»", "At the information desk a woman says: \"The train to Vienna is due to leave from track 12 at 8 o'clock.\""),
  ("N", "Mia hat Durst. Am Kiosk kauft sie eine Flasche Wasser und ihr Vater eine Zeitung.", "Mia khát nước. Ở ki-ốt, cô bé mua một chai nước, còn bố cô mua một tờ báo.", "Mia is thirsty. At the kiosk she buys a bottle of water and her father a newspaper."),
  ("N", "Dann gehen sie zum Bahnsteig. Da kommt eine Durchsage: Der Zug kommt heute 30 Minuten später.", "Rồi họ ra sân ga. Đúng lúc đó có thông báo qua loa: hôm nay tàu đến muộn 30 phút.", "Then they go to the platform. Just then there's an announcement: the train is coming 30 minutes later today."),
  ("A", "Das ist schlecht! Dann kriegen wir in München unseren Anschluss nicht.", "Tệ quá! Thế thì mình sẽ lỡ chuyến nối ở München mất.", "That's bad! Then we won't make our connection in Munich."),
  ("B", "Warum fliegen wir nicht? Mit dem Flugzeug geht es schnell.", "Sao mình không đi máy bay hả bố? Đi máy bay nhanh mà.", "Why don't we fly? It's fast by plane."),
  ("A", "Fliegen ist zu teuer, und ich mag keine Flugzeuge.", "Đi máy bay đắt quá, mà bố lại không thích máy bay.", "Flying is too expensive, and I don't like planes."),
  ("N", "Um 8.30 Uhr kommt der Zug, und sie können einsteigen. Ihre Plätze sind am Fenster.", "Lúc 8 giờ 30 tàu đến, và hai bố con được lên tàu. Chỗ của họ ở cạnh cửa sổ.", "At 8.30 the train arrives and they can get on. Their seats are by the window."),
  ("N", "Aber auf Mias Platz sitzt schon eine alte Dame.", "Nhưng trên ghế của Mia đã có một bà cụ ngồi.", "But an old lady is already sitting in Mia's seat."),
  ("B", "Entschuldigen Sie, ich glaube, das ist mein Platz.", "Xin lỗi bà, cháu nghĩ đây là chỗ của cháu.", "Excuse me, I think this is my seat."),
  ("N", "Die Dame lacht. Sie stellt ihre Tasche unter den Tisch und sitzt dann daneben.", "Bà cụ bật cười. Bà đặt túi xuống dưới bàn rồi ngồi sang ghế bên cạnh.", "The lady laughs. She puts her bag under the table and then sits in the seat next to it."),
  ("N", "Die Dame erzählt: Sie lebt in Wien, aber ihre Heimat ist Italien. Sie war 40 Jahre im Ausland.", "Bà kể: bà sống ở Viên, nhưng quê bà ở Ý. Bà đã sống ở nước ngoài 40 năm.", "The lady tells them that she lives in Vienna, but her homeland is Italy. She spent 40 years abroad."),
  ("N", "Im Zug gibt es Getränke, und Mia trinkt einen Tee mit der Dame.", "Trên tàu có bán đồ uống, và Mia uống trà cùng bà cụ.", "There are drinks on the train, and Mia has a tea with the lady."),
  ("N", "In München müssen alle aussteigen. Herr Becker hat es eilig, aber der Anschluss nach Wien ist schon weg.", "Đến München, mọi người phải xuống tàu. Ông Becker vội vàng, nhưng chuyến nối đi Viên đã chạy mất rồi.", "In Munich everyone has to get off. Mr Becker is in a hurry, but the connection to Vienna has already gone."),
  ("A", "Was machen wir jetzt? Wir haben viel Gepäck, und Mia ist müde.", "Giờ mình làm gì đây? Mình có nhiều hành lý, mà Mia lại mệt.", "What do we do now? We have lots of luggage, and Mia is tired."),
  ("N", "Die alte Dame hilft. Sie kennt ein kleines Hotel zwischen dem Bahnhof und der Haltestelle der Straßenbahn.", "Bà cụ giúp họ. Bà biết một khách sạn nhỏ nằm giữa nhà ga và trạm xe điện.", "The old lady helps. She knows a small hotel between the station and the tram stop."),
  ("N", "Dort können sie übernachten, und am Morgen fährt ab 7 Uhr ein Zug nach Wien.", "Họ có thể ngủ lại đó, và sáng hôm sau từ 7 giờ có tàu đi Viên.", "They can stay the night there, and in the morning there is a train to Vienna from 7 o'clock."),
  ("N", "Am Sonntag um 12 Uhr ist die Ankunft in Wien. Die Großeltern warten am Bahnsteig.", "Chủ nhật lúc 12 giờ họ đến Viên. Ông bà đang chờ ở sân ga.", "On Sunday at 12 o'clock they arrive in Vienna. The grandparents are waiting on the platform."),
  ("N", "Für den Weg zurück kauft Herr Becker zwei Tickets für das Flugzeug. Der Abflug ist am Freitag um 18 Uhr.", "Để về nhà, ông Becker mua hai vé máy bay. Chuyến bay cất cánh lúc 18 giờ thứ Sáu.", "For the way back Mr Becker buys two plane tickets. The flight leaves on Friday at 6 pm."),
  ("N", "Am Flughafen braucht man den Pass oder den Ausweis. Herr Becker sieht seinen Ausweis an: Er ist nicht mehr gültig!", "Ở sân bay cần có hộ chiếu hoặc thẻ căn cước. Ông Becker xem thẻ căn cước của mình: nó đã hết hạn!", "At the airport you need your passport or your ID card. Mr Becker looks at his ID card: it is no longer valid!"),
  ("A", "Zum Glück ist mein Pass noch gültig.", "May mà hộ chiếu của bố vẫn còn hạn.", "Luckily my passport is still valid."),
  ("N", "Beim Zoll geht alles schnell, und sie können pünktlich abfliegen. Nach einer Stunde sind sie schon zu Hause.", "Qua hải quan rất nhanh, và họ cất cánh đúng giờ. Sau một tiếng, họ đã về đến nhà.", "Customs is quick, and they can take off on time. After an hour they are already home."),
  ("B", "Papa, das Flugzeug ist gut! Nur eine Stunde!", "Bố ơi, máy bay hay thật! Chỉ một tiếng thôi!", "Dad, the plane is great! Only one hour!"),
  ("A", "Ja. Aber im Zug haben wir eine liebe Dame kennengelernt.", "Ừ. Nhưng trên tàu mình đã quen được một bà cụ dễ mến.", "Yes. But on the train we got to know a lovely lady.")],
 [("locate", "Ở ki-ốt Mia mua gì?", "What does Mia buy at the kiosk?", [("Một chai nước", "A bottle of water"), ("Một tờ báo", "A newspaper"), ("Một tách trà", "A cup of tea")], 0),
  ("locate", "Quê của bà cụ ở đâu?", "Where is the old lady's homeland?", [("Ở Viên", "In Vienna"), ("Ở Ý", "In Italy"), ("Ở München", "In Munich")], 1),
  ("infer", "Vì sao hai bố con phải ngủ lại ở München?", "Why do father and daughter have to stay the night in Munich?", [("Vì Mia bị ốm", "Because Mia is ill"), ("Vì họ muốn tham quan München", "Because they want to see Munich"), ("Vì tàu đến muộn nên họ lỡ chuyến nối", "Because the train was late, so they missed the connection")], 2)],
 names=["Becker", "Mia", "Mias", "Wien", "München", "Italien"],
 token_map=HER))

S.append(story("regen_am_meer", "Regen am Meer",
 ("Jana và Tom đi nghỉ ở một khách sạn bên biển. Ngày đầu trời nắng đẹp, rồi mưa kéo đến.", "Jana and Tom are on holiday at a hotel by the sea. The first day is sunny, then the rain comes."),
 ["Halbpension", "Rezeption", "Führung"],
 [("N", "Jana und Tom machen Urlaub am Meer. Sie haben ein Doppelzimmer mit Halbpension.", "Jana và Tom đi nghỉ ở biển. Họ ở một phòng đôi kèm bữa sáng và bữa tối.", "Jana and Tom are on holiday by the sea. They have a double room with half board."),
  ("A", "Guten Tag! Sie haben ein Doppelzimmer, kein Einzelzimmer, richtig?", "Xin chào! Anh chị đặt một phòng đôi, không phải phòng đơn, đúng không ạ?", "Good afternoon! You have a double room, not a single room, right?"),
  ("N", "Der junge Mann an der Rezeption sagt: „Ihr Zimmer ist im 4. Stock. Der Aufzug ist dort hinten in der Ecke.“", "Chàng trai trẻ ở quầy lễ tân nói: «Phòng của anh chị ở tầng 4. Thang máy ở góc đằng kia.»", "The young man at reception says: \"Your room is on the 4th floor. The lift is over there in the corner.\""),
  ("N", "Das Zimmer ist schön. Es hat ein Bad mit Dusche und Toilette und einen großen Balkon.", "Căn phòng đẹp. Có phòng tắm với vòi sen và nhà vệ sinh, cùng một ban công lớn.", "The room is nice. It has a bathroom with a shower and a toilet, and a big balcony."),
  ("B", "Tom, komm! Von hier sieht man das Meer!", "Tom ơi, lại đây! Từ đây nhìn thấy cả biển!", "Tom, come here! You can see the sea from here!"),
  ("N", "Die Sonne scheint, und das Wasser ist ruhig. Tom will sofort schwimmen.", "Mặt trời chiếu sáng, mặt nước lặng yên. Tom muốn đi bơi ngay.", "The sun is shining and the water is calm. Tom wants to go swimming at once."),
  ("N", "Aber am Abend kommt der Wind, und in der Nacht beginnt es zu regnen.", "Nhưng đến tối thì gió nổi lên, và đêm đó trời bắt đầu mưa.", "But in the evening the wind comes, and in the night it starts to rain."),
  ("N", "Am Morgen regnet es immer noch. Das Wetter ist schlecht.", "Sáng hôm sau trời vẫn mưa. Thời tiết xấu.", "In the morning it is still raining. The weather is bad."),
  ("A", "So ein Regen! Was machen wir jetzt?", "Mưa gì mà lắm thế! Giờ mình làm gì đây?", "What rain! What do we do now?"),
  ("B", "Das Hotel hat ein Schwimmbad. Da kann man auch bei Regen baden.", "Khách sạn có bể bơi. Ở đó trời mưa vẫn tắm được.", "The hotel has a swimming pool. You can swim there even when it rains."),
  ("N", "Aber im Schwimmbad sind viele Kinder, und es ist sehr laut.", "Nhưng ở bể bơi có rất nhiều trẻ con, và rất ồn.", "But there are lots of children in the pool, and it is very loud."),
  ("A", "Hier ist es mir zu laut. Machen wir einen Ausflug?", "Ở đây ồn quá với anh. Mình đi chơi đâu đó nhé?", "It's too loud for me here. Shall we go on a trip?"),
  ("N", "Der Mann an der Rezeption empfiehlt eine Führung durch das alte Dorf. Das Dorf hat viele Sehenswürdigkeiten, und der Eintritt ist frei.", "Người ở quầy lễ tân gợi ý một chuyến tham quan có hướng dẫn qua ngôi làng cổ. Làng có nhiều thắng cảnh, và vào cửa miễn phí.", "The man at reception recommends a guided tour of the old village. The village has lots of sights, and entry is free."),
  ("N", "Das Dorf ist nicht weit, und sie können zu Fuß gehen.", "Ngôi làng không xa, và họ có thể đi bộ.", "The village isn't far, and they can walk."),
  ("N", "In der Mitte vom Dorf steht ein alter Baum. Er ist sehr hoch und breit.", "Ở giữa làng có một cây cổ thụ. Cây rất cao và tán rất rộng.", "In the middle of the village there is an old tree. It is very tall and wide."),
  ("N", "Die Frau von der Führung erzählt: Der Baum ist 500 Jahre alt.", "Người phụ nữ hướng dẫn kể: cái cây này đã 500 tuổi.", "The woman leading the tour says the tree is 500 years old."),
  ("N", "Dann besichtigen sie noch ein Museum und einen schönen Garten mit vielen Blumen.", "Sau đó họ còn tham quan một bảo tàng và một khu vườn đẹp đầy hoa.", "Then they also visit a museum and a beautiful garden with lots of flowers."),
  ("N", "Am Anfang will Tom nicht so weit laufen. Aber am Ende ist er zufrieden.", "Lúc đầu Tom không muốn đi bộ xa như thế. Nhưng cuối cùng anh lại hài lòng.", "At first Tom doesn't want to walk so far. But in the end he is pleased."),
  ("N", "Auf dem Weg zurück ist sein Schuh kaputt, und seine Beine sind sehr müde.", "Trên đường về, giày của anh bị hỏng, và chân anh mỏi nhừ.", "On the way back his shoe is broken, and his legs are very tired."),
  ("N", "Im Hotel duschen beide, und dann gehen sie essen.", "Về khách sạn, cả hai tắm rồi đi ăn.", "At the hotel they both have a shower, and then they go and eat."),
  ("N", "Am Sonntag scheint die Sonne. Hinter dem Dorf gibt es einen kleinen See, und dort ist es leise.", "Chủ nhật trời nắng. Sau làng có một cái hồ nhỏ, ở đó rất yên tĩnh.", "On Sunday the sun is shining. Behind the village there is a small lake, and it is quiet there."),
  ("N", "Sie wandern zum See und baden im Wasser.", "Họ đi bộ đến hồ và tắm dưới nước.", "They hike to the lake and swim in the water."),
  ("A", "Das ist der beste Tag vom Urlaub.", "Đây là ngày tuyệt nhất của kỳ nghỉ.", "This is the best day of the holiday."),
  ("N", "Zum Schluss sitzen sie am Abend auf dem Balkon und sehen auf das Meer.", "Cuối cùng, buổi tối họ ngồi ngoài ban công ngắm biển.", "Finally, in the evening, they sit on the balcony and look out at the sea."),
  ("B", "Hier will ich noch einmal Urlaub machen.", "Em muốn lại đến đây nghỉ thêm một lần nữa.", "I want to have a holiday here once more.")],
 [("locate", "Phòng của Jana và Tom ở tầng mấy?", "Which floor is Jana and Tom's room on?", [("Tầng 4", "The 4th floor"), ("Tầng 2", "The 2nd floor"), ("Tầng trệt", "The ground floor")], 0),
  ("locate", "Ở giữa làng có gì?", "What is in the middle of the village?", [("Một bảo tàng", "A museum"), ("Một cây cổ thụ rất cao", "A very tall old tree"), ("Một cái hồ", "A lake")], 1),
  ("infer", "Vì sao Jana và Tom không ở lại bể bơi của khách sạn?", "Why don't Jana and Tom stay at the hotel pool?", [("Vì bể bơi đóng cửa", "Because the pool is closed"), ("Vì nước lạnh", "Because the water is cold"), ("Vì ở đó có nhiều trẻ con và quá ồn", "Because there are lots of children and it's too loud")], 2)],
 names=["Jana", "Tom"]))

S.append(story("eine_wohnung_in_hamburg", "Eine Wohnung in Hamburg",
 ("Chị Yilmaz tìm thuê một căn hộ ở Hamburg. Chủ nhà rất tốt bụng, nhưng chiếc máy in mới lại không chạy.", "Ms Yilmaz is looking for a flat to rent in Hamburg. The landlord is very kind, but her new printer doesn't work."),
 ["Euro", "Vermieter", "Postleitzahl"],
 [("N", "Frau Yilmaz möchte eine Wohnung in Hamburg mieten. Sie liest oft die Anzeigen in der Zeitung und im Internet.", "Chị Yilmaz muốn thuê một căn hộ ở Hamburg. Chị thường đọc tin rao vặt trên báo và trên mạng.", "Ms Yilmaz wants to rent a flat in Hamburg. She often reads the ads in the newspaper and on the internet."),
  ("N", "Ein Angebot ist sehr günstig: ein Apartment mit Balkon, nicht weit vom Bahnhof.", "Có một tin rất hời: một căn hộ nhỏ có ban công, không xa nhà ga.", "One offer is very good value: a flat with a balcony, not far from the station."),
  ("N", "Sie ruft an. Der Vermieter heißt Herr Brandt.", "Chị gọi điện. Chủ nhà tên là ông Brandt.", "She phones. The landlord is called Mr Brandt."),
  ("A", "Guten Tag! Sie können die Wohnung heute um 17 Uhr sehen.", "Chào chị! Chị có thể đến xem căn hộ hôm nay lúc 17 giờ.", "Hello! You can see the flat today at 5 pm."),
  ("N", "Das Haus ist alt, aber die Wohnung ist modern. Sie liegt oben, im 3. Stock.", "Ngôi nhà cũ, nhưng căn hộ thì hiện đại. Nó nằm trên cao, ở tầng 3.", "The house is old, but the flat is modern. It is at the top, on the 3rd floor."),
  ("N", "Es gibt keinen Aufzug, nur eine Treppe.", "Không có thang máy, chỉ có cầu thang bộ.", "There is no lift, only stairs."),
  ("B", "Und wo ist die Küche?", "Thế bếp ở đâu ạ?", "And where is the kitchen?"),
  ("A", "Hier. Der Kühlschrank ist neu, und daneben steht eine Maschine zum Waschen.", "Đây ạ. Tủ lạnh còn mới, bên cạnh có một chiếc máy giặt.", "Here. The fridge is new, and next to it there's a washing machine."),
  ("A", "Unten im Haus gibt es eine große Halle für die Fahrräder.", "Ở tầng dưới có một gian rộng để xe đạp.", "Downstairs in the house there is a big hall for the bicycles."),
  ("B", "Wie hoch ist die Miete?", "Tiền thuê bao nhiêu ạ?", "How high is the rent?"),
  ("A", "Die Miete ist 600 Euro im Monat. Das ist hier nicht teuer.", "Tiền thuê là 600 euro một tháng. Ở đây như thế là không đắt.", "The rent is 600 euros a month. That isn't expensive here."),
  ("B", "Kann ich bar zahlen?", "Tôi trả tiền mặt được không?", "Can I pay in cash?"),
  ("A", "Nein, bitte überweisen Sie die Miete auf mein Konto.", "Không được ạ, chị chuyển khoản tiền thuê vào tài khoản của tôi nhé.", "No, please transfer the rent to my account."),
  ("N", "Frau Yilmaz findet die Wohnung gut, und Herr Brandt will sie gern an sie vermieten.", "Chị Yilmaz thấy căn hộ ổn, và ông Brandt cũng sẵn lòng cho chị thuê.", "Ms Yilmaz likes the flat, and Mr Brandt is happy to rent it to her."),
  ("A", "Sie müssen hier unterschreiben. Haben Sie einen Kugelschreiber?", "Chị phải ký vào đây. Chị có bút bi không?", "You need to sign here. Do you have a ballpoint pen?"),
  ("B", "Nein, nur einen Bleistift.", "Không, tôi chỉ có bút chì.", "No, only a pencil."),
  ("A", "Das geht nicht. Hier, nehmen Sie meinen Kugelschreiber.", "Thế thì không được. Đây, chị cầm bút của tôi.", "That won't do. Here, take my pen."),
  ("N", "Er gibt ihr ein Papier mit dem Datum und der Adresse.", "Ông đưa cho chị một tờ giấy ghi ngày tháng và địa chỉ.", "He gives her a sheet of paper with the date and the address."),
  ("B", "Und wie ist die Postleitzahl?", "Thế mã bưu chính là bao nhiêu ạ?", "And what is the postcode?"),
  ("A", "Die steht unten auf dem Papier.", "Ở phía dưới tờ giấy ấy.", "It's at the bottom of the paper."),
  ("N", "Eine Woche später kann Frau Yilmaz umziehen. Sie hat nur ein Sofa, einen Tisch und einen Stuhl.", "Một tuần sau, chị Yilmaz được chuyển đến. Chị chỉ có một chiếc sofa, một cái bàn và một cái ghế.", "A week later Ms Yilmaz can move in. She only has a sofa, a table and a chair."),
  ("N", "Sie stellt das Sofa ans Fenster und legt ein Bild auf den Tisch.", "Chị kê sofa cạnh cửa sổ và đặt một bức ảnh lên bàn.", "She puts the sofa by the window and lays a picture on the table."),
  ("N", "Am Abend will sie einen Brief an ihre Mutter schreiben. Sie schreibt ihn am Computer.", "Buổi tối chị muốn viết thư cho mẹ. Chị viết trên máy tính.", "In the evening she wants to write a letter to her mother. She writes it on the computer."),
  ("N", "Sie will „Drucken“ anklicken, aber es geht nicht. Der Drucker druckt nicht!", "Chị muốn bấm vào «In», nhưng không được. Máy in không in!", "She wants to click on \"Print\", but it doesn't work. The printer won't print!"),
  ("N", "Sie ruft Herrn Brandt an.", "Chị gọi cho ông Brandt.", "She phones Mr Brandt."),
  ("A", "Kein Problem. Mein Sohn macht Reparaturen am Computer. Er kommt morgen.", "Không sao đâu. Con trai tôi sửa máy tính. Mai nó sẽ đến.", "No problem. My son does computer repairs. He'll come tomorrow."),
  ("N", "Der Sohn repariert den Drucker in fünf Minuten, und Frau Yilmaz kann den Brief drucken.", "Cậu con trai sửa máy in trong năm phút, và chị Yilmaz in được lá thư.", "The son repairs the printer in five minutes, and Ms Yilmaz can print the letter."),
  ("N", "Oben links steht der Absender: ihr Name und ihre neue Adresse. In der Mitte steht der Empfänger: ihre Mutter in Ankara.", "Góc trên bên trái là người gửi: tên và địa chỉ mới của chị. Ở giữa là người nhận: mẹ chị ở Ankara.", "At the top left is the sender: her name and her new address. In the middle is the recipient: her mother in Ankara."),
  ("N", "Dann kauft sie eine Briefmarke und schickt den Brief nach Ankara.", "Rồi chị mua tem và gửi thư đi Ankara.", "Then she buys a stamp and sends the letter to Ankara."),
  ("N", "Um 23 Uhr will sie das Licht ausmachen und schlafen. Sie ist sehr glücklich.", "Lúc 23 giờ chị muốn tắt đèn đi ngủ. Chị rất hạnh phúc.", "At 11 pm she wants to switch off the light and sleep. She is very happy.")],
 [("locate", "Căn hộ nằm ở tầng mấy?", "Which floor is the flat on?", [("Tầng 3", "The 3rd floor"), ("Tầng 1", "The 1st floor"), ("Tầng hầm", "The basement")], 0),
  ("locate", "Chị Yilmaz phải trả tiền thuê thế nào?", "How does Ms Yilmaz have to pay the rent?", [("Bằng tiền mặt", "In cash"), ("Chuyển khoản vào tài khoản của ông Brandt", "By transfer to Mr Brandt's account"), ("Bằng thẻ", "By card")], 1),
  ("infer", "Vì sao chị Yilmaz không in được lá thư ngay?", "Why can't Ms Yilmaz print the letter at first?", [("Vì chị không có giấy", "Because she has no paper"), ("Vì chị không có máy tính", "Because she has no computer"), ("Vì máy in có vấn đề", "Because there is something wrong with the printer")], 2)],
 names=["Yilmaz", "Hamburg", "Brandt", "Ankara"],
 token_map={**HER, "fahrräder": "de:w:fahrrad", "drucken": "de:w:drucken"}))

S.append(story("am_schalter", "Am Schalter",
 ("Anh Nguyen mới sang Leipzig và phải đi đăng ký cư trú. Tiếng Đức còn lạ, nhưng cô nhân viên nói rất chậm.", "Mr Nguyen is new in Leipzig and has to register his address. German is still strange to him, but the official speaks very slowly."),
 ["Familienstand", "buchstabieren", "Schalter"],
 [("N", "Herr Nguyen ist seit einer Woche in Leipzig. Heute muss er sich bei der Stadt anmelden.", "Anh Nguyen đến Leipzig được một tuần. Hôm nay anh phải đi đăng ký cư trú với thành phố.", "Mr Nguyen has been in Leipzig for a week. Today he has to register with the city."),
  ("N", "Die Sprache ist für ihn noch sehr fremd.", "Ngôn ngữ ở đây với anh vẫn còn rất lạ.", "The language is still very strange to him."),
  ("N", "In der Halle warten viele Leute, auch viele Ausländer. Er nimmt eine Nummer und wartet.", "Trong sảnh có nhiều người đang chờ, cả nhiều người nước ngoài. Anh lấy số rồi chờ.", "Lots of people are waiting in the hall, many foreigners too. He takes a number and waits."),
  ("N", "Auf einem Schild steht: Erwachsene und Jugendliche ab 16 Jahren brauchen einen Ausweis.", "Trên một tấm biển ghi: người lớn và thanh thiếu niên từ 16 tuổi cần có giấy tờ tùy thân.", "A sign says: adults and young people from the age of 16 need an ID card."),
  ("N", "Nach 40 Minuten kann er zum Schalter 5 gehen. Dort sitzt eine junge Beamtin.", "Sau 40 phút, anh được đến quầy số 5. Ở đó có một cô nhân viên trẻ.", "After 40 minutes he can go to counter 5. A young official is sitting there."),
  ("B", "Guten Tag. Was kann ich für Sie tun?", "Chào anh. Tôi có thể giúp gì cho anh?", "Good morning. What can I do for you?"),
  ("A", "Guten Tag. Ich möchte mich anmelden. Hier ist mein Pass.", "Chào chị. Tôi muốn đăng ký cư trú. Đây là hộ chiếu của tôi.", "Good morning. I would like to register. Here is my passport."),
  ("B", "Danke. Bitte antworten Sie langsam. Ich schreibe die Antworten sofort in den Computer.", "Cảm ơn anh. Anh trả lời chậm thôi nhé. Tôi ghi các câu trả lời ngay vào máy tính.", "Thank you. Please answer slowly. I'll type the answers straight into the computer."),
  ("B", "Wie ist Ihr Familienname? Können Sie ihn buchstabieren?", "Họ của anh là gì? Anh đánh vần được không?", "What is your surname? Can you spell it?"),
  ("A", "Buchstabieren ist schwer für mich. Mein Name hat nur 6 Buchstaben. Darf ich ihn schreiben?", "Đánh vần thì khó với tôi. Tên tôi chỉ có sáu chữ cái thôi. Tôi viết ra được không?", "Spelling is hard for me. My name only has six letters. May I write it down?"),
  ("B", "Ja, gern. Und wann und wo sind Sie geboren?", "Vâng, được ạ. Thế anh sinh năm nào, ở đâu?", "Yes, of course. And when and where were you born?"),
  ("A", "Ich bin 1990 in Hanoi geboren.", "Tôi sinh năm 1990 ở Hà Nội.", "I was born in Hanoi in 1990."),
  ("B", "Also: Geburtsjahr 1990, Geburtsort Hanoi. Und Ihr Familienstand?", "Vậy là: năm sinh 1990, nơi sinh Hà Nội. Còn tình trạng hôn nhân của anh?", "So: year of birth 1990, place of birth Hanoi. And your marital status?"),
  ("A", "Entschuldigung, was bedeutet das Wort?", "Xin lỗi, từ đó nghĩa là gì ạ?", "Sorry, what does that word mean?"),
  ("B", "Ich erkläre es: Sind Sie ledig oder verheiratet?", "Tôi giải thích nhé: anh còn độc thân hay đã kết hôn?", "I'll explain: are you single or married?"),
  ("A", "Verheiratet. Meine Ehefrau und unser Sohn kommen in zwei Monaten.", "Đã kết hôn. Vợ và con trai tôi hai tháng nữa sẽ sang.", "Married. My wife and our son are coming in two months."),
  ("B", "Und das Alter von Ihrem Sohn?", "Còn con trai anh bao nhiêu tuổi?", "And how old is your son?"),
  ("A", "Er ist vier. Er soll hier in den Kindergarten gehen.", "Cháu bốn tuổi. Cháu sẽ đi mẫu giáo ở đây.", "He's four. He's going to go to kindergarten here."),
  ("B", "Was ist Ihr Beruf? Sind Sie selbstständig?", "Anh làm nghề gì? Anh làm tự do phải không?", "What is your job? Are you self-employed?"),
  ("A", "Zurzeit bin ich arbeitslos. In Vietnam war ich Lehrer. Meine Frau arbeitet hier in einem Krankenhaus, und ich bin dann Hausmann.", "Hiện giờ tôi chưa có việc. Ở Việt Nam tôi là giáo viên. Vợ tôi sẽ làm ở một bệnh viện ở đây, còn tôi ở nhà nội trợ.", "At the moment I'm unemployed. In Vietnam I was a teacher. My wife works in a hospital here, and I'll be a househusband."),
  ("B", "Haben Sie Geschwister oder Verwandte in Deutschland?", "Anh có anh chị em hay họ hàng ở Đức không?", "Do you have brothers and sisters or relatives in Germany?"),
  ("A", "Ja, meine Schwester lebt hier, schon lange.", "Có, chị gái tôi sống ở đây lâu rồi.", "Yes, my sister lives here, and has for a long time."),
  ("B", "Hier ist ein Beispiel für das Formular. Bitte lesen Sie den Text. Dann brauche ich noch Ort und Datum, und Sie unterschreiben hier.", "Đây là một mẫu tờ khai. Anh đọc phần chữ nhé. Rồi tôi cần thêm nơi và ngày ký, và anh ký vào đây.", "Here is an example of the form. Please read the text. Then I need the place and date, and you sign here."),
  ("N", "Nach 10 Minuten ist alles fertig.", "Sau 10 phút là xong hết.", "After 10 minutes everything is done."),
  ("B", "Hier ist Ihre Anmeldung. Haben Sie noch eine Frage?", "Đây là giấy đăng ký của anh. Anh còn câu hỏi nào không?", "Here is your registration. Do you have any more questions?"),
  ("A", "Nein, danke. Sie haben sehr langsam gesprochen, und ich habe alles verstanden!", "Không, cảm ơn chị. Chị nói rất chậm, và tôi đã hiểu hết!", "No, thank you. You spoke very slowly, and I understood everything!"),
  ("B", "Sie sprechen schon gut Deutsch!", "Anh nói tiếng Đức giỏi rồi đấy!", "You already speak good German!"),
  ("N", "Am Abend ruft Herr Nguyen seine Frau an und erzählt ihr alles.", "Buổi tối anh Nguyen gọi cho vợ và kể cho chị nghe mọi chuyện.", "In the evening Mr Nguyen phones his wife and tells her everything.")],
 [("locate", "Anh Nguyen sinh ra ở đâu?", "Where was Mr Nguyen born?", [("Ở Leipzig", "In Leipzig"), ("Ở Hà Nội", "In Hanoi"), ("Ở Thành phố Hồ Chí Minh", "In Ho Chi Minh City")], 1),
  ("locate", "Ở Việt Nam anh Nguyen làm nghề gì?", "What was Mr Nguyen's job in Vietnam?", [("Giáo viên", "Teacher"), ("Bác sĩ", "Doctor"), ("Lái xe", "Driver")], 0),
  ("infer", "Vì sao anh Nguyen hiểu được hết cuộc nói chuyện?", "Why does Mr Nguyen understand the whole conversation?", [("Vì anh đã học tiếng Đức nhiều năm", "Because he has studied German for years"), ("Vì chị gái anh đi cùng", "Because his sister came with him"), ("Vì cô nhân viên nói rất chậm", "Because the official spoke very slowly")], 2)],
 names=["Nguyen", "Leipzig", "Hanoi", "Vietnam", "Deutschland", "Deutsch"],
 token_map={**HER, "beamtin": "de:w:beamte"}))

S.append(story("die_hochzeit_von_sara_und_jan", "Die Hochzeit von Sara und Jan",
 ("Sara và Jan tổ chức đám cưới. Ông Karl, 80 tuổi, mang đến một món quà đặc biệt và còn nhảy giỏi nhất buổi tiệc.", "Sara and Jan are getting married. Grandpa Karl, 80, brings a special present and turns out to be the best dancer at the party."),
 ["Disco", "Zigarette", "Ehemann"],
 [("N", "Sara und Jan lieben sich. Sara hat ihren Partner Jan vor fünf Jahren kennengelernt. Am Samstag wollen sie heiraten.", "Sara và Jan yêu nhau. Sara quen Jan từ năm năm trước. Thứ Bảy này họ sẽ cưới.", "Sara and Jan love each other. Sara met her partner Jan five years ago. On Saturday they are getting married."),
  ("N", "Sie schicken Einladungen an Freunde, Kollegen und Verwandte.", "Họ gửi thiệp mời cho bạn bè, đồng nghiệp và họ hàng.", "They send invitations to friends, colleagues and relatives."),
  ("N", "Auf der Einladung steht: „Wir möchten euch herzlich zu unserer Hochzeit einladen.“", "Trên thiệp ghi: «Chúng tôi trân trọng mời các bạn đến dự đám cưới của chúng tôi.»", "The invitation says: \"We would like to warmly invite you to our wedding.\""),
  ("N", "Saras Großvater Karl ist 80 Jahre alt. Er lebt allein, denn seine Frau ist tot.", "Ông Karl, ông nội của Sara, 80 tuổi. Ông sống một mình, vì vợ ông đã mất.", "Sara's grandfather Karl is 80 years old. He lives alone, because his wife is dead."),
  ("A", "Ich komme gern. Aber was soll ich anziehen? Meine Kleidung ist alt.", "Ông đến chứ. Nhưng ông nên mặc gì đây? Quần áo của ông cũ cả rồi.", "I'd love to come. But what should I wear? My clothes are old."),
  ("B", "Opa, deine Jacke ist schön. Und deine Schuhe auch.", "Ông ơi, áo khoác của ông đẹp mà. Cả đôi giày nữa.", "Grandpa, your jacket is nice. And your shoes too."),
  ("N", "Am Samstag scheint die Sonne. Die Gäste kommen um 11 Uhr und bringen Geschenke und Blumen.", "Thứ Bảy trời nắng. Khách đến lúc 11 giờ, mang theo quà và hoa.", "On Saturday the sun is shining. The guests arrive at 11 o'clock and bring presents and flowers."),
  ("N", "Alle gratulieren Sara und Jan: „Herzlichen Glückwunsch!“", "Mọi người đều chúc mừng Sara và Jan: «Chúc mừng hai bạn!»", "Everyone congratulates Sara and Jan: \"Congratulations!\""),
  ("N", "Opa Karl hat ein Geschenk für Sara: ein altes Bild von seiner Hochzeit.", "Ông Karl có một món quà cho Sara: một bức ảnh cũ chụp đám cưới của ông.", "Grandpa Karl has a present for Sara: an old picture of his own wedding."),
  ("A", "Auf dem Bild sind eure Großmutter und ich. Wir haben vor 60 Jahren geheiratet.", "Trong ảnh là bà của các cháu và ông. Ông bà cưới nhau từ 60 năm trước.", "In the picture are your grandmother and me. We got married 60 years ago."),
  ("B", "Opa, du warst so jung! Und die Haare von Oma sind so lang!", "Ông ơi, hồi đó ông trẻ quá! Mà tóc bà dài thế!", "Grandpa, you were so young! And Grandma's hair is so long!"),
  ("A", "Ja, das war früher. Ich habe eure Oma sehr geliebt.", "Ừ, chuyện ngày xưa rồi. Ông đã yêu bà các cháu lắm.", "Yes, that was long ago. I loved your grandma very much."),
  ("N", "Sara lacht. Das Geschenk gefällt ihr sehr.", "Sara mỉm cười. Cô rất thích món quà.", "Sara laughs. She likes the present very much."),
  ("N", "Beim Essen trinken die Gäste Wein und Bier. Dann steht Jan auf und hält sein Glas hoch.", "Trong bữa tiệc, khách uống rượu vang và bia. Rồi Jan đứng dậy nâng ly.", "During the meal the guests drink wine and beer. Then Jan stands up and raises his glass."),
  ("A", "Ich danke euch allen. Heute bin ich sehr glücklich: Sara ist jetzt meine Ehefrau!", "Cảm ơn tất cả mọi người. Hôm nay tôi rất hạnh phúc: Sara giờ là vợ tôi!", "Thank you all. Today I am very happy: Sara is now my wife!"),
  ("B", "Und Jan ist mein Ehemann. Was für ein Glück!", "Và Jan là chồng em. Thật là hạnh phúc!", "And Jan is my husband. What luck!"),
  ("N", "Am Abend ist Party. Ein Freund von Jan spielt alte und neue Lieder, und viele Gäste tanzen.", "Buổi tối có tiệc. Một người bạn của Jan chơi những bài hát cũ và mới, và nhiều khách nhảy múa.", "In the evening there's a party. A friend of Jan's plays old and new songs, and many guests dance."),
  ("B", "Opa, komm, tanz mit mir!", "Ông ơi, nào, nhảy với cháu đi!", "Grandpa, come on, dance with me!"),
  ("A", "Ich? Tanzen? Das habe ich seit 20 Jahren nicht gemacht.", "Ông á? Nhảy á? Hai mươi năm nay ông có nhảy đâu.", "Me? Dance? I haven't done that for 20 years."),
  ("N", "Aber dann will Opa Karl doch mitmachen. Er tanzt sehr gut, und alle lachen. Opa ist so lustig!", "Nhưng rồi ông Karl cũng nhập cuộc. Ông nhảy rất giỏi, và mọi người cười vang. Ông thật vui tính!", "But then Grandpa Karl does join in. He dances very well, and everyone laughs. Grandpa is so funny!"),
  ("N", "Draußen vor der Tür rauchen zwei Kollegen von Jan. Einer fragt: „Möchten Sie eine Zigarette?“", "Ngoài cửa, hai đồng nghiệp của Jan đang hút thuốc. Một người hỏi: «Ông có muốn hút một điếu không?»", "Outside the door two of Jan's colleagues are smoking. One of them asks: \"Would you like a cigarette?\""),
  ("A", "Nein, danke. Ich will noch lange leben.", "Không, cảm ơn. Ông còn muốn sống lâu.", "No, thank you. I want to live for a long time yet."),
  ("N", "Um 24 Uhr gehen die jungen Leute noch in eine Disco.", "Lúc nửa đêm, những người trẻ còn đi tiếp đến một vũ trường.", "At midnight the young people go on to a disco."),
  ("B", "Opa, willst du mitkommen?", "Ông ơi, ông có muốn đi cùng không?", "Grandpa, do you want to come along?"),
  ("A", "Nein, Kinder. Ich bin müde. Ich will jetzt meine Schuhe ausziehen und schlafen.", "Thôi, các cháu ạ. Ông mệt rồi. Giờ ông chỉ muốn cởi giày ra và đi ngủ.", "No, children. I'm tired. I want to take my shoes off now and sleep."),
  ("N", "Er sagt allen „Auf Wiedersehen“. Am Sonntag bekommen Sara und Jan eine Karte: „Danke für den schönen Tag! Viele Grüße, euer Opa Karl. Und wann kommt ein Baby?“", "Ông chào tạm biệt mọi người. Chủ nhật, Sara và Jan nhận được một tấm thiệp: «Cảm ơn các cháu vì một ngày tuyệt vời! Thân, ông Karl của các cháu. Thế bao giờ có em bé?»", "He says goodbye to everyone. On Sunday Sara and Jan get a card: \"Thank you for the lovely day! Best wishes, your Grandpa Karl. And when is a baby coming?\"")],
 [("locate", "Ông Karl tặng Sara món quà gì?", "What present does Grandpa Karl give Sara?", [("Một bức ảnh cũ chụp đám cưới của ông", "An old picture of his own wedding"), ("Một bó hoa", "A bunch of flowers"), ("Một chai rượu vang", "A bottle of wine")], 0),
  ("locate", "Vì sao ông Karl không đi vũ trường?", "Why doesn't Grandpa Karl go to the disco?", [("Vì ông không biết nhảy", "Because he can't dance"), ("Vì ông mệt và muốn đi ngủ", "Because he is tired and wants to sleep"), ("Vì ông không được mời", "Because he isn't invited")], 1),
  ("infer", "Vì sao mọi người ngạc nhiên khi ông Karl nhảy?", "Why is everyone surprised when Grandpa Karl dances?", [("Vì ông nhảy với cô dâu", "Because he dances with the bride"), ("Vì ông nhảy một mình", "Because he dances alone"), ("Vì ông nói đã 20 năm không nhảy, nhưng lại nhảy rất giỏi", "Because he said he hadn't danced for 20 years, but he dances very well")], 2)],
 names=["Sara", "Jan", "Saras", "Karl"],
 token_map=HER))

S.append(story("das_praktikum_von_lea", "Das Praktikum von Lea",
 ("Lea là sinh viên ngành thể thao. Cô đi thực tập ở một cửa hàng xe đạp và mắc nhiều lỗi lúc đầu.", "Lea is a sports student. She does an internship in a bicycle shop and makes lots of mistakes at the beginning."),
 ["Prospekt", "Verkäufer", "Verein"],
 [("N", "Lea ist Studentin. Sie studiert Sport in Köln. Das Studium ist nicht leicht: Sie hat viele Prüfungen und Tests.", "Lea là sinh viên. Cô học ngành thể thao ở Köln. Việc học không dễ: cô có nhiều kỳ thi và bài kiểm tra.", "Lea is a student. She studies sport in Cologne. Her studies aren't easy: she has lots of exams and tests."),
  ("N", "Zurzeit hat sie frei. Sie möchte Geld verdienen und macht ein Praktikum.", "Hiện giờ cô được nghỉ. Cô muốn kiếm tiền và đi thực tập.", "At the moment she has time off. She wants to earn money and is doing an internship."),
  ("N", "Ihr Arbeitsplatz ist ein Geschäft für Fahrräder. Der Chef heißt Herr Wolf.", "Nơi làm việc của cô là một cửa hàng xe đạp. Ông chủ tên là Wolf.", "Her workplace is a bicycle shop. The boss is called Mr Wolf."),
  ("A", "Deine Aufgabe ist einfach: Du hilfst den Kunden und verkaufst Fahrräder. Hier sind die Prospekte. Da stehen alle Preise.", "Việc của cháu đơn giản thôi: cháu giúp khách và bán xe đạp. Đây là các tờ quảng cáo. Giá cả ghi hết trong đó.", "Your job is simple: you help the customers and sell bicycles. Here are the brochures. All the prices are in them."),
  ("A", "Ein guter Verkäufer fragt viel und spricht wenig.", "Một người bán hàng giỏi thì hỏi nhiều và nói ít.", "A good salesperson asks a lot and talks little."),
  ("N", "Am Anfang macht Lea viele Fehler. Für sie sehen alle Fahrräder gleich aus.", "Lúc đầu Lea mắc nhiều lỗi. Với cô, chiếc xe đạp nào trông cũng giống nhau.", "At the beginning Lea makes lots of mistakes. To her, all the bicycles look the same."),
  ("A", "Fehler sind normal. Du lernst schnell.", "Mắc lỗi là bình thường. Cháu học nhanh lắm.", "Mistakes are normal. You learn fast."),
  ("N", "Ein Kunde möchte ein Fahrrad für seine Tochter. Lea bringt ihm ein kleines Fahrrad.", "Một vị khách muốn mua xe đạp cho con gái. Lea mang ra cho ông một chiếc xe nhỏ.", "A customer wants a bicycle for his daughter. Lea brings him a small bicycle."),
  ("A", "Was? Das ist zu teuer! Haben Sie auch billige Fahrräder?", "Cái gì? Đắt quá! Ở đây có xe rẻ hơn không?", "What? That's too expensive! Do you have cheap bicycles too?"),
  ("B", "Moment, ich frage meinen Chef.", "Ông đợi chút, cháu hỏi ông chủ đã.", "Just a moment, I'll ask my boss."),
  ("N", "Herr Wolf hat eine Lösung: Der Kunde kann ein altes Fahrrad kaufen. Es ist wie neu, aber nicht so teuer.", "Ông Wolf có cách: khách có thể mua một chiếc xe cũ. Nó như mới, nhưng không đắt bằng.", "Mr Wolf has a solution: the customer can buy an old bicycle. It's as good as new, but not as expensive."),
  ("N", "Der Kunde ist zufrieden. Er will das Fahrrad am Freitag abholen.", "Vị khách hài lòng. Ông muốn đến lấy xe vào thứ Sáu.", "The customer is satisfied. He wants to collect the bicycle on Friday."),
  ("N", "Um 12 Uhr macht Lea eine kurze Pause. Sie isst ein Brötchen und liest ihre Hausaufgabe für das Studium.", "Lúc 12 giờ, Lea nghỉ một lát. Cô ăn một chiếc bánh mì nhỏ và đọc bài tập về nhà của trường.", "At 12 o'clock Lea takes a short break. She eats a bread roll and reads her homework for her studies."),
  ("N", "Das Thema ist: Warum ist Sport wichtig? Lea weiß die Antwort schon.", "Chủ đề là: Vì sao thể thao quan trọng? Lea đã biết câu trả lời rồi.", "The topic is: why is sport important? Lea already knows the answer."),
  ("N", "Später kommt eine Gruppe von Schülern mit ihrem Lehrer.", "Sau đó có một nhóm học sinh đến cùng thầy giáo.", "Later a group of pupils comes in with their teacher."),
  ("A", "Wir sind eine Klasse aus Bonn. Wir machen einen Ausflug und brauchen 12 Fahrräder für einen Tag.", "Chúng tôi là một lớp học từ Bonn. Chúng tôi đi dã ngoại và cần 12 chiếc xe đạp trong một ngày.", "We're a class from Bonn. We're going on a trip and need 12 bicycles for one day."),
  ("N", "Lea hat ein langes Gespräch mit dem Lehrer und schreibt einen Plan für den Tag.", "Lea nói chuyện khá lâu với thầy giáo và viết một kế hoạch cho cả ngày.", "Lea has a long conversation with the teacher and writes a plan for the day."),
  ("N", "Nach zwei Wochen ist das Praktikum zu Ende.", "Sau hai tuần, đợt thực tập kết thúc.", "After two weeks the internship is over."),
  ("A", "Du hast gut gearbeitet. Das Ergebnis ist sehr gut. Wir haben eine Stelle frei. Möchtest du am Samstag hier arbeiten, neben dem Studium?", "Cháu làm tốt lắm. Kết quả rất tốt. Ở đây đang có một chỗ trống. Cháu có muốn làm vào thứ Bảy, bên cạnh việc học không?", "You've worked well. The result is very good. We have a job free. Would you like to work here on Saturdays, alongside your studies?"),
  ("B", "Gern! Fahrräder sind mein Hobby.", "Cháu rất muốn ạ! Xe đạp là sở thích của cháu.", "I'd love to! Bicycles are my hobby."),
  ("N", "In ihrer Freizeit fährt Lea mit ihrem Verein Fahrrad. Am Sonntag möchte sie gewinnen.", "Lúc rảnh, Lea đạp xe cùng câu lạc bộ. Chủ nhật này cô muốn giành chiến thắng.", "In her free time Lea cycles with her club. On Sunday she wants to win."),
  ("N", "Am Abend geht sie mit Freunden ins Kino.", "Buổi tối cô đi xem phim với bạn bè.", "In the evening she goes to the cinema with friends.")],
 [("locate", "Lea thực tập ở đâu?", "Where does Lea do her internship?", [("Ở một cửa hàng xe đạp", "In a bicycle shop"), ("Ở một trường học", "At a school"), ("Ở một rạp chiếu phim", "At a cinema")], 0),
  ("locate", "Nhóm học sinh cần bao nhiêu chiếc xe đạp?", "How many bicycles does the group of pupils need?", [("2 chiếc", "2"), ("12 chiếc", "12"), ("20 chiếc", "20")], 1),
  ("infer", "Vì sao ông Wolf mời Lea làm tiếp vào thứ Bảy?", "Why does Mr Wolf offer Lea a Saturday job?", [("Vì cô là con gái ông", "Because she is his daughter"), ("Vì cô cần tiền đi học", "Because she needs money for her studies"), ("Vì cô đã làm việc tốt trong đợt thực tập", "Because she worked well during the internship")], 2)],
 names=["Lea", "Köln", "Wolf", "Bonn"],
 token_map={**HER, "fahrräder": "de:w:fahrrad", "studentin": "de:w:student"}))

S.append(story("peter_und_die_pommes", "Peter und die Pommes",
 ("Ông Peter Schulz bị ốm, và bác sĩ bảo ông ăn quá nhiều thịt và khoai tây chiên. Ông quyết định thay đổi.", "Peter Schulz is ill, and the doctor tells him he eats too much meat and too many chips. He decides to change."),
 ["Praxis", "Gewicht", "Speisekarte"],
 [("N", "Herr Schulz ist krank. Er hat Fieber, sein Kopf ist schwer, und er hat keinen Appetit.", "Ông Schulz bị ốm. Ông sốt, đầu nặng trĩu, và ăn không thấy ngon.", "Mr Schulz is ill. He has a fever, his head feels heavy and he has no appetite."),
  ("N", "Er geht in die Praxis von Frau Doktor Braun.", "Ông đến phòng khám của bác sĩ Braun.", "He goes to Dr Braun's practice."),
  ("B", "Guten Tag, Herr Schulz. Was ist das Problem?", "Chào ông Schulz. Ông bị làm sao ạ?", "Good morning, Mr Schulz. What's the problem?"),
  ("A", "Ich bin seit drei Tagen krank. Ich habe Fieber und keinen Hunger.", "Tôi ốm ba ngày nay rồi. Tôi sốt và không thấy đói.", "I've been ill for three days. I have a fever and I'm not hungry."),
  ("B", "Machen Sie bitte den Mund auf. Und jetzt die Augen. Geben Sie mir bitte Ihre Hand und Ihren Arm.", "Ông há miệng ra nhé. Giờ đến mắt. Ông đưa tay và cánh tay cho tôi.", "Please open your mouth. And now your eyes. Please give me your hand and your arm."),
  ("B", "Sie müssen drei Tage im Bett bleiben und viel Tee trinken.", "Ông phải nằm nghỉ trên giường ba ngày và uống nhiều trà.", "You must stay in bed for three days and drink lots of tea."),
  ("B", "Und Ihr Gewicht ist zu hoch. Sie essen zu viel Fleisch und Pommes, richtig?", "Mà cân nặng của ông cao quá. Ông ăn quá nhiều thịt và khoai tây chiên, đúng không?", "And your weight is too high. You eat too much meat and too many chips, right?"),
  ("A", "Ja, leider. Ich esse gern im Lokal an der Ecke.", "Vâng, tiếc là thế. Tôi thích ăn ở quán ngoài góc phố.", "Yes, I'm afraid so. I like eating at the pub on the corner."),
  ("B", "Essen Sie mehr Salat, Tomaten und Obst, zum Beispiel Bananen und Birnen.", "Ông nên ăn nhiều xà lách, cà chua và trái cây hơn, ví dụ chuối và lê.", "Eat more salad, tomatoes and fruit, for example bananas and pears."),
  ("N", "Nach einer Woche geht es Herrn Schulz gut. Er will jetzt mehr Obst und Gemüse essen und geht einkaufen.", "Sau một tuần, ông Schulz đã khỏe. Giờ ông muốn ăn nhiều trái cây và rau hơn, và đi mua đồ.", "After a week Mr Schulz is well. He wants to eat more fruit and vegetables now and goes shopping."),
  ("N", "Er kauft Kartoffeln, Tomaten, Butter und ein bisschen Schinken.", "Ông mua khoai tây, cà chua, bơ và một ít giăm bông.", "He buys potatoes, tomatoes, butter and a little ham."),
  ("N", "Das Brot riecht so gut! Er kauft auch Brötchen, denn morgen will er schön frühstücken.", "Bánh mì thơm quá! Ông mua thêm cả bánh mì nhỏ, vì sáng mai ông muốn ăn sáng thật ngon.", "The bread smells so good! He also buys bread rolls, because tomorrow he wants to have a nice breakfast."),
  ("N", "Am Samstag grillen seine Freunde im Garten.", "Thứ Bảy, bạn bè ông nướng thịt ngoài vườn.", "On Saturday his friends have a barbecue in the garden."),
  ("B", "Peter, hier ist ein Hähnchen für dich!", "Peter ơi, gà nướng của anh đây!", "Peter, here's a chicken for you!"),
  ("A", "Nein, danke. Ich esse heute nur Gemüse.", "Thôi, cảm ơn. Hôm nay anh chỉ ăn rau.", "No, thank you. Today I'm only eating vegetables."),
  ("B", "Vorsicht, Peter! Das Feuer!", "Cẩn thận, Peter! Lửa đấy!", "Careful, Peter! The fire!"),
  ("N", "Dann sitzt Peter mit den Freunden am Tisch. Er isst Kartoffeln mit Öl und Salz.", "Rồi Peter ngồi vào bàn cùng các bạn. Ông ăn khoai tây với dầu và muối.", "Then Peter sits at the table with his friends. He eats potatoes with oil and salt."),
  ("A", "Das schmeckt sehr gut!", "Ngon thật đấy!", "That tastes very good!"),
  ("N", "Nur der Kaffee schmeckt ein bisschen bitter.", "Chỉ có cà phê là hơi đắng.", "Only the coffee tastes a little bitter."),
  ("N", "Am Sonntag geht Peter doch ins Lokal an der Ecke. Er liest die Speisekarte und bestellt einen Salat.", "Chủ nhật, rốt cuộc Peter vẫn ghé quán ở góc phố. Ông đọc thực đơn và gọi một đĩa xà lách.", "On Sunday Peter goes to the pub on the corner after all. He reads the menu and orders a salad."),
  ("B", "Nur einen Salat? Keine Pommes?", "Chỉ xà lách thôi ạ? Không lấy khoai tây chiên à?", "Just a salad? No chips?"),
  ("A", "Nein! Pommes sind für mich jetzt verboten. Die Rechnung, bitte.", "Không! Giờ khoai tây chiên bị cấm với tôi rồi. Cho tôi thanh toán.", "No! Chips are forbidden for me now. The bill, please.")],
 [("locate", "Bác sĩ bảo ông Schulz làm gì trong ba ngày?", "What does the doctor tell Mr Schulz to do for three days?", [("Nằm nghỉ trên giường và uống nhiều trà", "Stay in bed and drink lots of tea"), ("Đi bơi", "Go swimming"), ("Ăn nhiều thịt", "Eat lots of meat")], 0),
  ("locate", "Ở quán, ông Peter gọi món gì?", "What does Peter order at the pub?", [("Khoai tây chiên", "Chips"), ("Một đĩa xà lách", "A salad"), ("Một con gà", "A chicken")], 1),
  ("infer", "Vì sao ông Peter không ăn gà ở buổi nướng?", "Why doesn't Peter eat the chicken at the barbecue?", [("Vì gà bị cháy", "Because the chicken is burnt"), ("Vì ông không đói", "Because he isn't hungry"), ("Vì ông muốn ăn ít thịt như lời bác sĩ", "Because he wants to eat less meat, as the doctor said")], 2)],
 names=["Schulz", "Braun", "Peter"],
 token_map={"herrn": "de:w:herr"}))

S.append(story("das_handy_auf_der_bank", "Das Handy auf der Bank",
 ("Trên đường đi làm, bác sĩ Ben nhặt được một chiếc điện thoại trên ghế đá. Chủ nhân là một hướng dẫn viên du lịch sắp lên tàu.", "On his way to work, Ben, a doctor, finds a phone on a bench. It belongs to a tour guide who is about to catch a train."),
 ["Aussage", "Reiseführer", "Abfahrt"],
 [("N", "Ben ist Arzt. Am Montag geht er gegen 7 Uhr über einen bekannten Platz in Dresden.", "Ben là bác sĩ. Sáng thứ Hai, khoảng 7 giờ, anh đi bộ qua một quảng trường nổi tiếng ở Dresden.", "Ben is a doctor. On Monday at about 7 o'clock he walks across a well-known square in Dresden."),
  ("N", "Es hat gerade aufgehört zu regnen. Auf einer Bank liegt ein Handy, und daneben liegt ein Reiseführer für Dresden.", "Trời vừa tạnh mưa. Trên một chiếc ghế dài có một chiếc điện thoại, bên cạnh là một cuốn sách hướng dẫn du lịch Dresden.", "It has just stopped raining. On a bench there is a phone, and next to it a guidebook for Dresden."),
  ("A", "Entschuldigung, ist das vielleicht Ihr Reiseführer?", "Xin lỗi, đây có phải sách hướng dẫn của ông không?", "Excuse me, is this your guidebook, perhaps?"),
  ("N", "Ein Mann sagt: „Nein, das ist nicht meiner.“", "Một người đàn ông đáp: «Không, không phải của tôi.»", "A man says: \"No, that's not mine.\""),
  ("N", "Ben glaubt: Dieses Handy und dieses Buch gehören einer Frau aus dem Ausland, denn das Buch ist auf Englisch.", "Ben đoán: chiếc điện thoại và cuốn sách là của một người phụ nữ nước ngoài, vì cuốn sách viết bằng tiếng Anh.", "Ben thinks the phone and the book belong to a woman from abroad, because the book is in English."),
  ("N", "Er drückt lange auf das Handy. Nichts! Er muss es laden.", "Anh bấm giữ điện thoại một lúc lâu. Không có gì! Phải sạc nó đã.", "He presses the phone for a long time. Nothing! He has to charge it."),
  ("N", "Ben bringt das Handy zur Polizei. Dort macht er eine Aussage: wo, wann und wie.", "Ben mang chiếc điện thoại đến đồn cảnh sát. Ở đó anh khai lại: ở đâu, khi nào và thế nào.", "Ben takes the phone to the police. There he makes a statement: where, when and how."),
  ("B", "Danke für die Information. Wir laden das Handy.", "Cảm ơn anh đã báo tin. Chúng tôi sẽ sạc điện thoại.", "Thanks for the information. We'll charge the phone."),
  ("N", "Nach 20 Minuten kommt ein Anruf.", "Sau 20 phút có một cuộc gọi đến.", "After 20 minutes a call comes in."),
  ("B", "Hallo? Hier ist Eva Novak. Das ist mein Handy! Wo ist es?", "A lô? Tôi là Eva Novak. Đấy là điện thoại của tôi! Nó đang ở đâu vậy?", "Hello? This is Eva Novak. That's my phone! Where is it?"),
  ("N", "Die Frau von der Polizei gibt Ben das Handy, und Ben telefoniert mit Frau Novak.", "Chị cảnh sát đưa điện thoại cho Ben, và Ben nói chuyện với chị Novak.", "The policewoman gives Ben the phone, and Ben talks to Ms Novak."),
  ("B", "Ich bin Reiseführerin und habe eine internationale Gruppe. Die Leute kommen aus vielen Ländern.", "Tôi là hướng dẫn viên du lịch, tôi dẫn một đoàn khách quốc tế. Khách đến từ nhiều nước.", "I'm a tour guide and have an international group. The people come from many countries."),
  ("B", "Ohne Handy kann ich nicht arbeiten! Alle Informationen für die Reise sind im Handy.", "Không có điện thoại thì tôi không làm việc được! Mọi thông tin cho chuyến đi đều ở trong đó.", "I can't work without my phone! All the information for the trip is on it."),
  ("A", "Wo sind Sie gerade? Wohin fahren Sie?", "Chị đang ở đâu? Chị đi đâu vậy?", "Where are you right now? Where are you going?"),
  ("B", "Ich bin am Bahnhof. Unsere Reise endet nicht hier: Wir fahren heute weiter nach Prag. Die Abfahrt ist um 10 Uhr.", "Tôi đang ở nhà ga. Chuyến đi của chúng tôi chưa kết thúc ở đây: hôm nay chúng tôi đi tiếp đến Praha. Tàu khởi hành lúc 10 giờ.", "I'm at the station. Our trip doesn't end here: we're going on to Prague today. Departure is at 10 o'clock."),
  ("A", "Ich komme sofort.", "Tôi đến ngay.", "I'm coming right away."),
  ("N", "Ben ruft ein Taxi, aber die Nummer ist besetzt. Er nimmt die Straßenbahn.", "Ben gọi taxi, nhưng máy bận. Anh đi xe điện.", "Ben calls a taxi, but the number is engaged. He takes the tram."),
  ("N", "Am Bahnhof hört er eine Ansage: „Der Zug nach Prag fährt heute von Gleis 3 ab.“", "Ở nhà ga anh nghe thông báo: «Tàu đi Praha hôm nay khởi hành từ đường ray số 3.»", "At the station he hears an announcement: \"The train to Prague leaves from track 3 today.\""),
  ("N", "Frau Novak steht mit ihrer Gruppe am Gleis. Ben gibt ihr das Handy und den Reiseführer.", "Chị Novak đứng cùng đoàn khách ở đường ray. Ben đưa chị điện thoại và cuốn sách hướng dẫn.", "Ms Novak is standing on the platform with her group. Ben gives her the phone and the guidebook."),
  ("B", "Darf ich mich vorstellen? Ich bin Eva. Ich freue mich so! Danke, danke!", "Cho phép tôi tự giới thiệu nhé. Tôi là Eva. Tôi mừng quá! Cảm ơn anh, cảm ơn anh!", "May I introduce myself? I'm Eva. I'm so happy! Thank you, thank you!"),
  ("N", "Sie will ihm danken und möchte ihm Geld anbieten.", "Chị muốn cảm ơn anh và muốn biếu anh ít tiền.", "She wants to thank him and would like to offer him money."),
  ("A", "Nein, danke. Für so etwas nehme ich nie Geld.", "Không, cảm ơn chị. Việc như thế này tôi không bao giờ nhận tiền.", "No, thank you. I never take money for something like that."),
  ("B", "Es gibt noch gute Menschen auf der Welt!", "Trên đời vẫn còn những người tốt!", "There are still good people in the world!"),
  ("N", "Die Leute aus der Gruppe lachen und sagen: „Wir feiern heute Abend in Prag. Kommen Sie mit!“", "Những người trong đoàn cười và nói: «Tối nay chúng tôi liên hoan ở Praha. Anh đi cùng đi!»", "The people in the group laugh and say: \"We're celebrating in Prague tonight. Come with us!\""),
  ("A", "Leider nicht, ich muss arbeiten. Aber wann soll der Zug in Prag ankommen?", "Tiếc là không được, tôi phải đi làm. Nhưng tàu bao giờ thì đến Praha?", "Unfortunately not, I have to work. But when is the train due to arrive in Prague?"),
  ("B", "Um 13 Uhr. Und Sie sind nicht böse? Sie kommen jetzt zu spät zur Arbeit!", "Lúc 13 giờ. Mà anh không giận chứ? Giờ anh sẽ đi làm muộn mất!", "At 1 pm. And you're not angry? You're going to be late for work now!"),
  ("A", "Nein. Heute wird ein guter Tag.", "Không đâu. Hôm nay sẽ là một ngày tốt lành.", "No. Today is going to be a good day."),
  ("N", "Der Zug fährt ab, und Ben sieht die Gruppe am Fenster.", "Tàu chuyển bánh, và Ben nhìn thấy cả đoàn bên cửa sổ.", "The train leaves, and Ben sees the group at the window.")],
 [("locate", "Ben nhặt được chiếc điện thoại ở đâu?", "Where does Ben find the phone?", [("Trên một chiếc ghế dài ở quảng trường", "On a bench in a square"), ("Ở nhà ga", "At the station"), ("Trên xe điện", "On the tram")], 0),
  ("locate", "Chị Novak làm nghề gì?", "What is Ms Novak's job?", [("Bác sĩ", "Doctor"), ("Hướng dẫn viên du lịch", "Tour guide"), ("Cảnh sát", "Police officer")], 1),
  ("infer", "Vì sao Ben đoán chủ chiếc điện thoại là người nước ngoài?", "Why does Ben guess that the phone's owner is from abroad?", [("Vì điện thoại rất đắt", "Because the phone is very expensive"), ("Vì có người nói cho anh biết", "Because someone tells him"), ("Vì cuốn sách bên cạnh viết bằng tiếng Anh", "Because the book next to it is in English")], 2)],
 names=["Ben", "Dresden", "Englisch", "Eva", "Novak", "Prag"],
 token_map={**HER, "reiseführerin": "de:w:reisefuhrer", "ländern": "de:w:land", "bekannten": "de:w:bekannt"}))

# Every new story is A1-2; the reading order puts the band before the authored order.
# The 43 stories committed before this batch stay exactly as they are, in their order.
ORIGINAL_COUNT = 43
doc = json.load(open(STORIES, encoding="utf-8"))
doc["stories"] = doc["stories"][:ORIGINAL_COUNT] + S
with open(STORIES, "w", encoding="utf-8", newline="\n") as f:
    f.write(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")
print(len(S), "new stories;", len(doc["stories"]), "in all")

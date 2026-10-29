"""Second batch of core A1 words missing from the de lexicon (thematic lists: days, months, seasons,
times of day, measures; everyday nouns the first pass missed). Original glosses and examples only."""
import json, pathlib

M, F, N = "masculine", "feminine", "neuter"
W = [
 ("Mittwoch", "noun", M, "Wednesday", "thứ Tư", "time", "Am Mittwoch habe ich Deutschkurs.", "On Wednesday I have German class.", "Thứ Tư tôi có lớp tiếng Đức."),
 ("Januar", "noun", M, "January", "tháng Một", "time", "Im Januar ist es kalt.", "In January it is cold.", "Tháng Một trời lạnh."),
 ("Februar", "noun", M, "February", "tháng Hai", "time", "Mein Geburtstag ist im Februar.", "My birthday is in February.", "Sinh nhật tôi vào tháng Hai."),
 ("März", "noun", M, "March", "tháng Ba", "time", "Im März beginnt der Kurs.", "The course starts in March.", "Khóa học bắt đầu vào tháng Ba."),
 ("April", "noun", M, "April", "tháng Tư", "time", "Im April regnet es oft.", "In April it often rains.", "Tháng Tư trời hay mưa."),
 ("Mai", "noun", M, "May", "tháng Năm", "time", "Im Mai fahren wir ans Meer.", "In May we go to the sea.", "Tháng Năm chúng tôi đi biển."),
 ("Juni", "noun", M, "June", "tháng Sáu", "time", "Im Juni ist die Schule zu Ende.", "In June school is over.", "Tháng Sáu năm học kết thúc."),
 ("Juli", "noun", M, "July", "tháng Bảy", "time", "Im Juli ist es sehr heiß.", "In July it is very hot.", "Tháng Bảy trời rất nóng."),
 ("August", "noun", M, "August", "tháng Tám", "time", "Im August machen wir Urlaub.", "In August we go on holiday.", "Tháng Tám chúng tôi đi nghỉ."),
 ("September", "noun", M, "September", "tháng Chín", "time", "Im September beginnt die Arbeit wieder.", "In September work starts again.", "Tháng Chín công việc lại bắt đầu."),
 ("Oktober", "noun", M, "October", "tháng Mười", "time", "Im Oktober ziehen wir um.", "In October we are moving.", "Tháng Mười chúng tôi chuyển nhà."),
 ("November", "noun", M, "November", "tháng Mười Một", "time", "Im November ist der Himmel oft grau.", "In November the sky is often grey.", "Tháng Mười Một bầu trời hay xám xịt."),
 ("Dezember", "noun", M, "December", "tháng Mười Hai", "time", "Im Dezember gibt es viel Schnee.", "In December there is a lot of snow.", "Tháng Mười Hai có nhiều tuyết."),
 ("Frühling", "noun", M, "spring", "mùa xuân", "time", "Im Frühling blühen die Blumen.", "In spring the flowers bloom.", "Mùa xuân hoa nở."),
 ("Herbst", "noun", M, "autumn", "mùa thu", "time", "Im Herbst ist es windig.", "In autumn it is windy.", "Mùa thu trời nhiều gió."),
 ("Vormittag", "noun", M, "morning (before noon)", "buổi sáng (trước trưa)", "time", "Am Vormittag arbeite ich im Büro.", "In the morning I work at the office.", "Buổi sáng tôi làm việc ở văn phòng."),
 ("Mittag", "noun", M, "midday, noon", "buổi trưa", "time", "Am Mittag essen wir zusammen.", "At midday we eat together.", "Buổi trưa chúng tôi ăn cùng nhau."),
 ("Nachmittag", "noun", M, "afternoon", "buổi chiều", "time", "Am Nachmittag gehe ich schwimmen.", "In the afternoon I go swimming.", "Buổi chiều tôi đi bơi."),
 ("Cent", "noun", M, "cent", "xu (cent)", "shopping", "Das kostet nur 50 Cent.", "That only costs 50 cents.", "Cái này chỉ có 50 xu."),
 ("Meter", "noun", M, "metre", "mét", "numbers", "Der Weg ist 100 Meter lang.", "The path is 100 metres long.", "Con đường dài 100 mét."),
 ("Kilometer", "noun", M, "kilometre", "ki-lô-mét", "numbers", "Bis zum Bahnhof sind es zwei Kilometer.", "It is two kilometres to the station.", "Từ đây đến nhà ga là hai ki-lô-mét."),
 ("Liter", "noun", M, "litre", "lít", "numbers", "Ein Liter Milch, bitte.", "A litre of milk, please.", "Cho tôi một lít sữa."),
 ("Gramm", "noun", N, "gram", "gam", "numbers", "Ich nehme 200 Gramm Käse.", "I'll take 200 grams of cheese.", "Tôi lấy 200 gam phô mai."),
 ("Suppe", "noun", F, "soup", "món súp, canh", "food", "Die Suppe ist heiß.", "The soup is hot.", "Súp đang nóng."),
 ("Topf", "noun", M, "pot, saucepan", "cái nồi", "home", "Der Topf steht auf dem Herd.", "The pot is on the stove.", "Cái nồi ở trên bếp."),
 ("Messer", "noun", N, "knife", "con dao", "home", "Das Messer ist sehr scharf.", "The knife is very sharp.", "Con dao rất sắc."),
 ("Tasse", "noun", F, "cup", "cái tách", "food", "Eine Tasse Tee, bitte.", "A cup of tea, please.", "Cho tôi một tách trà."),
 ("Teller", "noun", M, "plate", "cái đĩa", "home", "Die Teller sind im Schrank.", "The plates are in the cupboard.", "Đĩa ở trong tủ."),
 ("Gabel", "noun", F, "fork", "cái nĩa", "home", "Ich brauche eine Gabel.", "I need a fork.", "Tôi cần một cái nĩa."),
 ("Löffel", "noun", M, "spoon", "cái thìa", "home", "Die Suppe isst man mit dem Löffel.", "You eat soup with a spoon.", "Ăn súp bằng thìa."),
 ("Nudel", "noun", F, "noodle, pasta", "mì, nui", "food", "Die Kinder essen gern Nudeln.", "The children like eating pasta.", "Bọn trẻ thích ăn mì."),
 ("Wurst", "noun", F, "sausage", "xúc xích", "food", "Zum Frühstück esse ich Brot mit Wurst.", "For breakfast I eat bread with sausage.", "Bữa sáng tôi ăn bánh mì với xúc xích."),
 ("Eis", "noun", N, "ice cream; ice", "kem; nước đá", "food", "Im Sommer essen wir gern Eis.", "In summer we like eating ice cream.", "Mùa hè chúng tôi thích ăn kem."),
 ("Pommes", "noun", F, "chips, French fries", "khoai tây chiên", "food", "Einmal Pommes, bitte.", "One portion of chips, please.", "Cho một phần khoai tây chiên."),
 ("Mittagessen", "noun", N, "lunch", "bữa trưa", "food", "Das Mittagessen ist um zwölf Uhr.", "Lunch is at twelve.", "Bữa trưa lúc mười hai giờ."),
 ("Abendessen", "noun", N, "dinner, supper", "bữa tối", "food", "Zum Abendessen gibt es Fisch.", "For dinner there is fish.", "Bữa tối có cá."),
 ("Park", "noun", M, "park", "công viên", "places", "Die Kinder spielen im Park.", "The children play in the park.", "Bọn trẻ chơi trong công viên."),
 ("Markt", "noun", M, "market", "chợ", "shopping", "Am Samstag kaufe ich Obst auf dem Markt.", "On Saturday I buy fruit at the market.", "Thứ Bảy tôi mua trái cây ở chợ."),
 ("Supermarkt", "noun", M, "supermarket", "siêu thị", "shopping", "Der Supermarkt ist bis 22 Uhr offen.", "The supermarket is open until 10 pm.", "Siêu thị mở cửa đến 22 giờ."),
 ("Ampel", "noun", F, "traffic lights", "đèn giao thông", "travel", "An der Ampel gehen Sie links.", "At the traffic lights, go left.", "Đến đèn giao thông thì ông/bà rẽ trái."),
 ("Dorf", "noun", N, "village", "ngôi làng", "places", "Meine Großeltern wohnen in einem Dorf.", "My grandparents live in a village.", "Ông bà tôi sống ở một ngôi làng."),
 ("Café", "noun", N, "café", "quán cà phê", "food", "Wir treffen uns im Café.", "We meet at the café.", "Chúng ta gặp nhau ở quán cà phê."),
 ("Aufzug", "noun", M, "lift, elevator", "thang máy", "home", "Der Aufzug ist kaputt.", "The lift is broken.", "Thang máy bị hỏng."),
 ("Sehenswürdigkeit", "noun", F, "sight, place of interest", "địa điểm tham quan", "travel", "Die Kirche ist eine bekannte Sehenswürdigkeit.", "The church is a well-known sight.", "Nhà thờ là một địa điểm tham quan nổi tiếng."),
 ("Arbeitsplatz", "noun", M, "workplace; job", "nơi làm việc; chỗ làm", "people", "Mein Arbeitsplatz ist im zweiten Stock.", "My workplace is on the second floor.", "Chỗ làm của tôi ở tầng hai."),
 ("Wand", "noun", F, "wall", "bức tường", "home", "Das Bild hängt an der Wand.", "The picture hangs on the wall.", "Bức tranh treo trên tường."),
 ("Schrank", "noun", M, "cupboard, wardrobe", "cái tủ", "home", "Die Kleidung ist im Schrank.", "The clothes are in the wardrobe.", "Quần áo ở trong tủ."),
 ("Nachbar", "noun", M, "neighbour", "hàng xóm", "people", "Unser Nachbar ist sehr nett.", "Our neighbour is very nice.", "Hàng xóm của chúng tôi rất dễ mến."),
 ("Kellner", "noun", M, "waiter", "người phục vụ (bàn)", "food", "Der Kellner bringt die Speisekarte.", "The waiter brings the menu.", "Người phục vụ mang thực đơn đến."),
 ("Koch", "noun", M, "cook, chef", "đầu bếp", "food", "Mein Bruder ist Koch in einem Restaurant.", "My brother is a cook in a restaurant.", "Anh tôi là đầu bếp ở một nhà hàng."),
 ("Ehemann", "noun", M, "husband", "người chồng", "family", "Das ist mein Ehemann.", "This is my husband.", "Đây là chồng tôi."),
 ("Ehefrau", "noun", F, "wife", "người vợ", "family", "Seine Ehefrau kommt aus Hanoi.", "His wife is from Hanoi.", "Vợ anh ấy người Hà Nội."),
 ("Hausfrau", "noun", F, "housewife", "người vợ nội trợ", "people", "Meine Tante ist Hausfrau.", "My aunt is a housewife.", "Cô tôi ở nhà làm nội trợ."),
 ("Bauer", "noun", M, "farmer", "nông dân", "people", "Der Bauer hat viele Tiere.", "The farmer has many animals.", "Bác nông dân có nhiều vật nuôi."),
 ("Tor", "noun", N, "goal; gate", "khung thành, bàn thắng; cổng", "leisure", "Er schießt ein Tor!", "He scores a goal!", "Anh ấy ghi một bàn!"),
 ("Kamera", "noun", F, "camera", "máy ảnh", "technology", "Die Kamera ist neu.", "The camera is new.", "Máy ảnh còn mới."),
 ("dunkel", "adjective", None, "dark", "tối", "colors", "Im Winter ist es früh dunkel.", "In winter it gets dark early.", "Mùa đông trời tối sớm."),
 ("stolz", "adjective", None, "proud", "tự hào", "feelings", "Die Mutter ist stolz auf ihre Tochter.", "The mother is proud of her daughter.", "Người mẹ tự hào về con gái."),
 ("plötzlich", "adverb", None, "suddenly", "bỗng nhiên, đột nhiên", "time", "Plötzlich geht das Licht aus.", "Suddenly the light goes out.", "Đột nhiên đèn tắt."),
 ("weg", "adverb", None, "away, gone", "đi mất, không còn", "places", "Mein Schlüssel ist weg!", "My key is gone!", "Chìa khóa của tôi mất rồi!"),
 ("Spaß", "noun", M, "fun", "niềm vui, sự vui vẻ", "leisure", "Das Spiel macht viel Spaß.", "The game is a lot of fun.", "Trò chơi rất vui."),
 ("kriegen", "verb", None, "to get (informal)", "nhận được (khẩu ngữ)", "everyday", "Ich kriege eine Nachricht.", "I'm getting a message.", "Tôi nhận được một tin nhắn."),
 ("modern", "adjective", None, "modern", "hiện đại", "everyday", "Die Wohnung ist sehr modern.", "The flat is very modern.", "Căn hộ rất hiện đại."),
 ("Pass", "noun", M, "passport", "hộ chiếu", "travel", "Hast du deinen Pass?", "Do you have your passport?", "Bạn có mang hộ chiếu không?"),
 ("Gruß", "noun", M, "greeting", "lời chào (Viele Grüße! = thân chào)", "greetings", "Viele Grüße an deine Familie!", "Best wishes to your family!", "Gửi lời chào đến gia đình bạn!"),
 ("Auskunft", "noun", F, "information (desk)", "thông tin; quầy thông tin", "travel", "Fragen Sie an der Auskunft.", "Ask at the information desk.", "Ông/bà hỏi ở quầy thông tin."),
 ("Brille", "noun", F, "glasses", "cặp kính", "body", "Ohne Brille kann ich nicht lesen.", "I can't read without glasses.", "Không có kính tôi không đọc được."),
 ("Schnee", "noun", M, "snow", "tuyết", "weather", "Die Kinder spielen im Schnee.", "The children play in the snow.", "Bọn trẻ chơi trong tuyết."),
 ("Wolke", "noun", F, "cloud", "đám mây", "weather", "Am Himmel ist keine Wolke.", "There is not a cloud in the sky.", "Trên trời không một gợn mây."),
]
recs = []
for lemma, pos, gender, en, vi, topic, de, xen, xvi in W:
    rec = {"lemma": lemma, "partOfSpeech": pos}
    if gender: rec["gender"] = gender
    rec.update({"glossEn": en, "glossVi": vi, "topic": topic, "examples": [{"target": de, "en": xen, "vi": xvi}]})
    recs.append(rec)
assert len({r["lemma"] for r in recs}) == len(recs)
S = pathlib.Path(r"C:\Users\MSI\AppData\Local\Temp\claude\C--Users-MSI-Documents-app-hoc-ngoai-ngu\82ea6b33-e22d-4a2d-907b-9b4441f9e202\scratchpad")
pathlib.Path(r"C:\src\lft\content\de\_drafts\lexicon-add\OUTPUT.jsonl").write_bytes("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in recs).encode("utf-8"))
allp = S / "de-lexicon-add-all.jsonl"
old = [json.loads(l) for l in allp.read_text(encoding="utf-8").splitlines() if l.strip()]
have = {r["lemma"] for r in old}
allp.write_bytes("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in old + [r for r in recs if r["lemma"] not in have]).encode("utf-8"))
print(len(recs), "records")

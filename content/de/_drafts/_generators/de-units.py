"""Build content/de/_drafts/units/OUTPUT.jsonl for de-vi.

Words are (surface, emoji); the Vietnamese gloss is copied from the (staged)
lexicon so it is identical to the lexicon, as the units step requires.
"""
import json, os, sys

LEX = r"C:\src\lft\content\de\_drafts\staged\content\de\lexicon\lexemes.json"
if not os.path.exists(LEX):
    LEX = r"C:\src\lft\content\de\lexicon\lexemes.json"
OUT = r"C:\src\lft\content\de\_drafts\units\OUTPUT.jsonl"
d = json.load(open(LEX, encoding="utf-8"))
L = d["lexemes"] if isinstance(d, dict) else d
GLOSS = {x["surface"]: x["glosses"]["vi"] for x in L}

C = "de-vi"
S = {
    1: "Phần 1: Nhập môn",
    2: "Phần 2: Viên gạch nền",
    3: "Phần 3: Hiểu tiếng Đức hằng ngày",
    4: "Phần 4: Nói những câu tiếng Đức đầu tiên",
    5: "Phần 5: Viết tiếng Đức hằng ngày",
    6: "Phần 6: Trò chuyện với ai đó",
}
O = lambda *xs: [f"de.obj.{x}" for x in xs]

UNITS = []


def unit(section, uid, lkey, title, desc, guidebook, words, lessons):
    UNITS.append(dict(section=section, uid=uid, lkey=lkey, title=title, desc=desc, gb=guidebook.strip(), words=words, lessons=lessons))


# ---------------------------------------------------------------- Section 1
unit(1, "unit-1", "u0", "Căn bản 1", "Những từ tiếng Đức đầu tiên: người, đồ ăn, đồ uống, có và không.", """
## Willkommen! Chào mừng bạn đến với tiếng Đức 🇩🇪

Mọi danh từ tiếng Đức đều có **giống**: **giống đực** đi với *der*, **giống cái** đi với *die*, **giống trung** đi với *das*. Tiếng Việt không có mạo từ, nên hãy học danh từ cùng mạo từ ngay từ đầu: *der Mann*, *die Frau*, *das Kind*.

### Người
- *der Mann* — người đàn ông, *die Frau* — người phụ nữ
- *der Junge* — cậu bé, *das Mädchen* — cô bé (giống trung, dù là con gái!)
- *das Kind* — đứa trẻ

### Đồ ăn và đồ uống
- *das Brot* — bánh mì, *der Apfel* — quả táo
- *das Wasser* — nước, *die Milch* — sữa

### Hai động từ đầu tiên
- **essen** (ăn): *Ich esse Brot.* — Tôi ăn bánh mì.
- **trinken** (uống): *Das Kind trinkt Milch.* — Đứa trẻ uống sữa.

### Viết hoa danh từ
Trong tiếng Đức, **mọi danh từ đều viết hoa**, kể cả giữa câu: *Ich trinke Wasser.*

### Có và không
*Ja* là vâng, *nein* là không. Muốn phủ định một động từ, đặt *nicht* sau nó: *Ich esse nicht.* — Tôi không ăn.
""", [("der Mann", "👨"), ("die Frau", "👩"), ("der Junge", "👦"), ("das Mädchen", "👧"), ("das Kind", "🧒"), ("der Apfel", "🍎"), ("das Brot", "🍞"), ("das Wasser", "💧"), ("die Milch", "🥛"), ("essen", "🍽️"), ("trinken", "🥤"), ("haben", "🤲")],
     [("Bài 1", O("vocab.everyday_basics", "reading.familiar_words"))] * 4)

unit(1, "unit-2", "u1", "Chào hỏi", "Lời chào và câu lịch sự thiết yếu cho mọi lúc trong ngày.", """
## Guten Tag! 👋

Người Đức chào nhau theo thời điểm trong ngày. Với người lạ, người lớn tuổi hay ở nơi làm việc, câu chào trang trọng an toàn hơn.

### Theo giờ trong ngày
- *Guten Morgen* — chào buổi sáng (đến khoảng 10–11 giờ)
- *Guten Tag* — chào (ban ngày)
- *Guten Abend* — chào buổi tối
- *Gute Nacht* — chúc ngủ ngon (chỉ khi đi ngủ)

### Thân mật hay trang trọng
- *Hallo!* — xin chào (bạn bè, người quen)
- *Tschüss!* — tạm biệt (thân mật)
- *Auf Wiedersehen!* — tạm biệt (trang trọng)

### Ba từ lịch sự
- *Danke!* — cảm ơn. *Danke schön!* — cảm ơn nhiều.
- *Bitte!* — làm ơn; cũng là "không có gì" khi đáp lại *Danke*.
- *Entschuldigung!* — xin lỗi; cũng dùng để gọi ai đó.

### Tên của bạn
*Wie heißen Sie?* — Ông/bà tên gì? *Ich heiße Lan.* — Tôi tên là Lan. Chữ *ß* đọc như *ss*.
""", [("Hallo", "👋"), ("Tschüss", "🚪"), ("Bitte", "🙏"), ("Danke", "😊"), ("Entschuldigung", "🙇"), ("Willkommen", "🤗"), ("der Morgen", "🌅"), ("der Abend", "🌆"), ("die Nacht", "🌙"), ("der Tag", "☀️"), ("Freund", "🧑‍🤝‍🧑"), ("Name", "🏷️")],
     [("Bài 1", O("greetings.basic", "reading.familiar_words"))] * 4)

unit(1, "unit-3", "u2", "Đồ ăn", "Đồ ăn thức uống và cách gọi món đơn giản.", """
## Guten Appetit! 🍽️

*Guten Appetit!* là câu chúc ngon miệng trước bữa ăn. Trong đơn vị này bạn học tên đồ ăn thức uống hằng ngày — luôn kèm mạo từ.

### Bữa sáng kiểu Đức
- *das Frühstück* — bữa sáng
- *das Brot* — bánh mì, *der Käse* — phô mai, *das Ei* — quả trứng
- *der Kaffee* — cà phê, *der Tee* — trà, *der Saft* — nước ép

### Bữa chính
- *der Reis* — cơm, gạo, *der Fisch* — cá
- *das Obst* — trái cây (danh từ chỉ chung, không đếm)

### Đồ ngọt
- *der Kuchen* — bánh ngọt, *die Schokolade* — sô-cô-la, *der Zucker* — đường

### Gọi món lịch sự
- *Ich möchte einen Kaffee, bitte.* — Cho tôi một cà phê.
- *Ein Wasser, bitte.* — Một nước, làm ơn.

Để ý: sau *möchte*, *der Kaffee* đổi thành *einen Kaffee*. Bạn sẽ học quy tắc này ở Phần 2; giờ chỉ cần nhớ cả cụm.
""", [("der Kaffee", "☕"), ("der Tee", "🍵"), ("der Reis", "🍚"), ("das Ei", "🥚"), ("der Käse", "🧀"), ("das Obst", "🍇"), ("der Saft", "🧃"), ("der Fisch", "🐟"), ("der Zucker", "🍬"), ("der Kuchen", "🍰"), ("das Frühstück", "🥐"), ("die Schokolade", "🍫")],
     [("Bài 1", O("vocab.everyday_basics", "reading.familiar_words"))] * 4)

unit(1, "unit-4", "u3", "Gia đình", "Bố mẹ, anh chị em, họ hàng — và con vật cưng trong nhà.", """
## Meine Familie 👨‍👩‍👧

*Meine Familie* nghĩa là "gia đình tôi". *Mein* đi với danh từ giống đực và giống trung, *meine* đi với giống cái và số nhiều.

### Bố mẹ và con cái
- *die Mutter* — mẹ, *der Vater* — bố, *die Eltern* — bố mẹ (luôn số nhiều)
- *der Sohn* — con trai, *die Tochter* — con gái

### Anh chị em
Tiếng Đức không phân biệt anh hay em như tiếng Việt:
- *der Bruder* — anh trai hoặc em trai
- *die Schwester* — chị gái hoặc em gái

### Họ hàng
- *der Onkel* — chú, bác, cậu (một từ cho tất cả!)
- *die Tante* — cô, dì, thím

### Con vật trong nhà
- *der Hund* — con chó, *die Katze* — con mèo

### Câu mẫu
*Ich habe einen Bruder und eine Schwester.* — Tôi có một anh/em trai và một chị/em gái.
""", [("die Familie", "👪"), ("die Mutter", "👩"), ("der Vater", "👨"), ("Eltern", "👫"), ("der Bruder", "👦"), ("die Schwester", "👧"), ("der Sohn", "👶"), ("die Tochter", "👧"), ("der Onkel", "🧔"), ("die Tante", "👩‍🦰"), ("der Hund", "🐕"), ("die Katze", "🐈")],
     [("Bài 1", O("vocab.everyday_basics", "reading.familiar_words"))] * 4)

unit(1, "unit-5", "u4", "Đi lại", "Từ vựng và mẫu câu để đi lại trong thành phố.", """
## Unterwegs — trên đường 🚆

Đức có mạng lưới tàu xe dày đặc. Đơn vị này dạy những từ bạn cần để đi lại trong thành phố.

### Nơi chốn
- *die Stadt* — thành phố, *die Straße* — đường phố
- *der Bahnhof* — nhà ga, *der Flughafen* — sân bay
- *das Hotel* — khách sạn, *das Museum* — bảo tàng

### Phương tiện
- *der Zug* — tàu hỏa, *der Bus* — xe buýt
- *das Auto* — ô tô, *das Fahrrad* — xe đạp

### Vé và đường đi
- *das Ticket* — vé; ở nhà ga người ta cũng nói *die Fahrkarte*
- *der Weg* — con đường, lối đi

### Từ ghép giúp bạn đoán nghĩa
*Bahnhof* = *Bahn* (đường sắt) + *Hof* (sân); *Flughafen* = *Flug* (chuyến bay) + *Hafen* (bến cảng). Giống của từ ghép theo **từ cuối**: *der Hafen* → *der Flughafen*.

### Câu hỏi đường
*Wo ist der Bahnhof?* — Nhà ga ở đâu?
""", [("die Stadt", "🏙️"), ("der Bahnhof", "🚉"), ("der Zug", "🚆"), ("die Straße", "🛣️"), ("das Hotel", "🏨"), ("der Flughafen", "🛫"), ("das Ticket", "🎫"), ("der Bus", "🚌"), ("das Auto", "🚗"), ("das Fahrrad", "🚲"), ("das Museum", "🏛️"), ("der Weg", "🧭")],
     [("Bài 1", O("vocab.places_travel", "reading.familiar_words"))] * 4)

# ---------------------------------------------------------------- Section 2
unit(2, "unit-a", "ua", "Giống & Mạo từ", "Der, die hay das? Đuôi từ thường mách bạn câu trả lời.", """
## Der, die oder das? 🎯

Mọi danh từ tiếng Đức có một trong ba giống. Nghĩa của từ hiếm khi cho biết giống (*das Mädchen* — cô bé — là giống trung), nhưng **đuôi từ** thường mách bạn. Số liệu dưới đây lấy từ **12.355 danh từ** trong dữ liệu từ điển của khoá học.

### Gần như luôn là die
- **-ung**: 99,1 % — *die Wohnung, die Zeitung*
- **-heit / -keit**: 98,7 % — *die Freiheit, die Möglichkeit*
- **-ion**: 98,2 % — *die Information, die Station*
- **-tät**: 59/59 — *die Universität*

### Thường là die hoặc der
- **-e**: giống cái 85,0 % — *die Tasche, die Küche*; nhưng *der Junge, der Name*
- **-er**: giống đực 81,1 % — *der Lehrer, der Computer*; nhưng *die Mutter, das Fenster*

### Thường là das
- **-chen**: *das Mädchen, das Brötchen* — từ nhỏ hóa (đuôi -hen trong dữ liệu là giống trung 88,8 %; ngoại lệ *der Kuchen*)

### Mạo từ không xác định và kein
- *ein* (der, das) — *eine* (die): *ein Tisch, eine Tür, ein Fenster*
- Phủ định danh từ dùng **kein / keine**: *Ich habe keine Zeit.*

### Số nhiều luôn là die
*der Tisch → die Tische, die Tür → die Türen, das Bild → die Bilder.* Hãy học số nhiều cùng danh từ.
""", [("der Tisch", "🪑"), ("die Tür", "🚪"), ("das Fenster", "🪟"), ("der Stuhl", "💺"), ("die Wohnung", "🏢"), ("das Haus", "🏠"), ("das Bett", "🛏️"), ("die Küche", "🍳"), ("der Schlüssel", "🔑"), ("die Tasche", "👜"), ("das Bild", "🖼️"), ("die Uhr", "🕰️"), ("das Telefon", "☎️"), ("das Handy", "📱")],
     [("Ba giống", O("gender.articles_basic")), ("Ein, eine và kein", O("gender.plurals_kein", "gender.articles_basic")), ("Số nhiều", O("gender.plurals_kein")), ("Der hay den?", O("cases.accusative", "gender.articles_basic"))])

unit(2, "unit-b", "ub", "Những động từ dùng nhiều nhất", "Sein, haben, đuôi động từ và vị trí của động từ trong câu.", """
## Động từ là trái tim của câu 💪

Tiếng Việt không chia động từ: *tôi ở*, *bạn ở*, *cô ấy ở*. Tiếng Đức đổi **đuôi** động từ theo ngôi: *ich wohne, du wohnst, sie wohnt*.

### Sein (là, ở) và haben (có)
- *ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind*
- *ich habe, du hast, er/sie/es hat, wir haben, ihr habt, sie/Sie haben*

### Đuôi động từ quy tắc
Bỏ *-en* của nguyên thể rồi thêm đuôi: *wohnen → wohn-*
- *ich wohn**e***, *du wohn**st***, *er wohn**t***, *wir wohn**en***, *ihr wohn**t***, *sie wohn**en***

### Đổi nguyên âm
Một số động từ đổi nguyên âm ở *du* và *er/sie/es*: *sprechen → du sprichst, er spricht*; *fahren → du fährst*; *essen → er isst*.

### Động từ ở vị trí thứ hai
Trong câu kể, động từ luôn đứng **thứ hai**: *Ich lerne heute.* → *Heute lerne ich.* Câu hỏi có/không đưa động từ lên đầu: *Wohnst du in Berlin?*

### Câu "hai mảnh"
*können, müssen, möchten* đứng thứ hai, động từ chính về **cuối**: *Ich kann Deutsch sprechen.* Động từ tách cũng vậy: *anrufen → Ich rufe dich an.*

### Quá khứ thường dùng
*Ich habe gegessen.* — Tôi đã ăn. Tiếng Việt thêm *đã*; tiếng Đức dùng *haben/sein* + phân từ ở cuối câu.
""", [("sein", "🟰"), ("haben", "🤲"), ("wohnen", "🏡"), ("arbeiten", "💼"), ("spielen", "⚽"), ("sprechen", "🗣️"), ("fahren", "🚗"), ("kommen", "🛬"), ("können", "💪"), ("müssen", "❗"), ("anrufen", "📞"), ("anfangen", "🏁")],
     [("Sein và haben", O("verbs.sein_haben_present", "writing.familiar_words")), ("Đuôi động từ", O("verbs.regular_present", "writing.familiar_words")), ("Động từ đứng thứ hai", O("word_order.verb_second", "verbs.separable_modal", "writing.familiar_words")), ("Hôm qua và hôm nay", O("verbs.sein_haben_present", "verbs.perfekt_recognition", "writing.familiar_words"))])

unit(2, "unit-c", "uc", "Từ quốc tế & Bạn giả", "Từ quốc tế và từ ghép giúp bạn đoán nghĩa — và vài cái bẫy cần né.", """
## Bạn đã biết nhiều từ tiếng Đức hơn bạn nghĩ 🌍

Nhiều từ tiếng Đức là từ quốc tế, giống tiếng Anh hoặc đã quen với người Việt.

### Từ quốc tế
- *die Musik, das Foto, der Film, das Internet, die Pizza, das Problem*
- Cách viết đôi khi khác: *das Foto* (không phải *photo*), chữ cái đầu viết hoa vì là danh từ.

### Từ ghép: lợi thế lớn
Tiếng Đức ghép từ như xếp gạch. Hiểu từng mảnh là đoán được nghĩa:
- *das Krankenhaus* = *krank* (ốm) + *Haus* (nhà) → bệnh viện
- *das Schlafzimmer* = *schlafen* (ngủ) + *Zimmer* (phòng) → phòng ngủ
- *das Wochenende* = *Woche* (tuần) + *Ende* (cuối) → cuối tuần
- *der Geburtstag* = *Geburt* (sự ra đời) + *Tag* (ngày) → sinh nhật

Giống của từ ghép luôn theo **từ cuối**: *das Ende → das Wochenende*.

### Bạn giả (nếu bạn biết tiếng Anh)
- *bekommen* = **nhận được**, không phải *become* (trở thành = *werden*)
- *der Chef* = **sếp**, không phải đầu bếp
- *das Gift* = **chất độc**, không phải món quà (quà = *das Geschenk*)
""", [("die Musik", "🎵"), ("das Foto", "📷"), ("der Film", "🎬"), ("das Internet", "🌐"), ("die Pizza", "🍕"), ("das Problem", "🧩"), ("der Chef", "👔"), ("bekommen", "📦"), ("das Krankenhaus", "🏥"), ("das Schlafzimmer", "🛏️"), ("das Wochenende", "🎉"), ("der Geburtstag", "🎂")],
     [("Từ quốc tế", O("strategy.cognates_compounds", "gender.articles_basic")), ("Từ ghép", O("strategy.cognates_compounds", "gender.articles_basic")), ("Những từ đánh lừa", O("strategy.cognates_compounds", "vocab.places_travel")), ("Thêm bẫy", O("strategy.cognates_compounds", "vocab.everyday_basics"))])

unit(2, "unit-d", "ud", "Số từ 0 đến 100", "Đếm, nói tuổi, giờ và giá — cùng các từ chỉ thời gian.", """
## Zahlen — con số 🔢

### 0 đến 12: học thuộc
*null, eins, zwei, drei, vier, fünf, sechs, sieben, acht, neun, zehn, elf, zwölf*

### 13 đến 19: số + zehn
*dreizehn, vierzehn, fünfzehn, sechzehn* (bỏ *s* của *sechs*), *siebzehn* (bỏ *en* của *sieben*), *achtzehn, neunzehn*

### Hàng chục
*zwanzig, dreißig* (có *ß*!), *vierzig, fünfzig, sechzig, siebzig, achtzig, neunzig, hundert*

### Đơn vị đọc trước, hàng chục đọc sau
Đây là điểm khác lớn nhất với tiếng Việt: *21* là *einundzwanzig* — "một và hai mươi". *45* là *fünfundvierzig*. Khi nghe, hãy chờ đến hết số rồi mới viết.

### Tuổi, giá, giờ
- *Ich bin zwanzig Jahre alt.* — Tôi hai mươi tuổi.
- *Das kostet drei Euro.* — Cái này giá ba euro.
- *Es ist acht Uhr.* — Bây giờ là tám giờ.
- Bẫy: *halb drei* là **2 giờ 30** (nửa tiếng *trước* ba giờ), không phải 3 giờ 30.

### Thời gian
*die Minute, die Stunde, der Tag, die Woche, der Monat, das Jahr*
""", [("die Zahl", "🔢"), ("die Minute", "⏱️"), ("die Uhr", "🕰️"), ("die Woche", "📆"), ("der Monat", "🗓️"), ("das Jahr", "🎆"), ("die Zeit", "⏳"), ("das Wochenende", "🎉"), ("der Montag", "📅"), ("der Freitag", "📅"), ("das Geld", "💶"), ("das Alter", "🎂")],
     [("Từ không đến mười hai", O("numbers.0_100", "vocab.time_calendar", "writing.familiar_words")), ("Từ mười ba đến hai mươi", O("numbers.0_100", "vocab.time_calendar", "writing.familiar_words")), ("Đơn vị trước, chục sau", O("numbers.0_100", "vocab.time_calendar", "writing.familiar_words")), ("Giờ, tuổi và giá", O("numbers.0_100", "vocab.time_calendar", "writing.familiar_words"))])

unit(2, "unit-e", "ue", "Chữ viết & Âm tiếng Đức", "Viết hoa danh từ, umlaut, ß — và những âm người Việt hay vấp.", """
## Viết và đọc cho đúng ✏️

### Viết hoa danh từ
Mọi danh từ viết hoa: *der Tisch, die Liebe, das Essen*. Động từ và tính từ viết thường: *essen, schön*.

### Umlaut đổi nghĩa
Hai chấm trên *ä, ö, ü* làm từ khác hẳn:
- *schon* (đã) — *schön* (đẹp)
- *die Mutter* (mẹ) — *die Mütter* (các bà mẹ)
Nếu bàn phím không có umlaut, nhấn giữ phím *a, o, u* để chọn.

### ß hay ss?
Sau nguyên âm dài viết *ß*: *die Straße, groß*. Sau nguyên âm ngắn viết *ss*: *der Fluss, essen*.

### Âm ü và ö
*ü*: môi tròn như khi nói "u", nhưng lưỡi đặt như "i" — gần giống thôi, hãy nghe mẫu. *ö*: môi tròn như "ô", lưỡi như "ê".

### Hai kiểu ch
- Sau *a, o, u*: âm cổ họng, gần "kh" tiếng Việt — *Buch, acht*
- Sau *e, i, ä, ö, ü*: âm nhẹ, gần "x" đọc giữa lưỡi — *ich, nicht*

### Phụ âm cuối đọc "cứng"
*d, g, b* ở cuối từ đọc gần như *t, k, p*: *der Hund, der Tag*. Đừng bỏ âm cuối: *und* không đọc là "un".

### Nguyên âm dài và ngắn
*die Miete* (tiền thuê nhà, *ie* dài) — *die Mitte* (ở giữa, *i* ngắn trước phụ âm đôi).
""", [("die Straße", "🛣️"), ("schön", "🌸"), ("groß", "🐘"), ("klein", "🐭"), ("der Fluss", "🏞️"), ("die Tür", "🚪"), ("früh", "🌄"), ("spät", "🌃")],
     [("Viết hoa & umlaut", O("spelling.capitals_umlaut")), ("Ü, ö và ch", O("pronunciation.vowels_ch")), ("Dài hay ngắn?", O("pronunciation.vowels_ch")), ("Ghép lại", O("spelling.capitals_umlaut", "verbs.regular_present"))])

# ---------------------------------------------------------------- Section 3
unit(3, "unit-f", "uf", "Hör zu!", "Luyện tai: từ và cụm từ quen thuộc, chỉ bằng âm thanh.", """
## Nghe trước, đọc sau 👂

Trong đơn vị này bạn chỉ nghe. Mỗi đoạn âm thanh được đọc chậm và rõ bởi giọng tổng hợp, có hai giọng khác nhau để tai bạn quen với nhiều cách nói.

### Cách nghe hiệu quả
- Nghe cả đoạn một lần, đừng dừng ở từ khó.
- Nghe lại và tìm **từ khóa**: người, nơi chốn, đồ vật.
- Đoán từ ngữ cảnh: *Guten Morgen* thường nghe vào buổi sáng.

### Âm hay gặp
- *w* đọc gần như "v": *Wasser, wo*.
- *v* thường đọc như "f": *der Vater, vier*.
- *z* đọc như "ts": *zehn, die Zeit*.
- *ei* đọc gần "ai", *ie* đọc "i" dài: *drei* — *die*.

### Buổi sáng và buổi tối
*Der Morgen* là buổi sáng, *der Abend* là buổi tối. Hai từ này nằm trong lời chào bạn đã học: *Guten Morgen, Guten Abend*.
""", [("der Morgen", "🌅"), ("der Abend", "🌆"), ("das Wasser", "💧"), ("die Zeit", "⏳"), ("der Vater", "👨"), ("die Nacht", "🌙")],
     [("Những âm đầu tiên", O("listening.familiar_words", "vocab.everyday_basics")), ("Cụm từ nghe được", O("listening.familiar_words")), ("Sáng và tối", O("listening.familiar_words", "reading.familiar_words")), ("Ôn tập nghe", O("listening.familiar_words"))])

unit(3, "unit-g", "ug", "Nachrichten und Schilder", "Đọc tiếng Đức đời thực: tin nhắn, biển hiệu, giờ mở cửa.", """
## Đọc tiếng Đức ngoài đời 📌

Ở Đức, chữ có mặt khắp nơi: biển cửa hàng, giờ mở cửa, tin nhắn của bạn bè. Bạn không cần hiểu từng chữ — chỉ cần tìm thông tin mình cần.

### Biển hiệu hay gặp
- *geöffnet* — đang mở cửa, *geschlossen* — đóng cửa
- *Eingang* — lối vào, *Ausgang* — lối ra
- *Ziehen* — kéo, *Drücken* — đẩy (trên cửa)

### Giờ mở cửa
*Mo–Fr 9–18 Uhr* nghĩa là thứ Hai đến thứ Sáu, 9 giờ đến 18 giờ. *Sa* là thứ Bảy, *So* là Chủ nhật. Ở Đức nhiều cửa hàng đóng cửa vào Chủ nhật.

### Tin nhắn ngắn
- *Hallo Anna, ich komme um sieben. Bis später! Ben*
- Mở đầu bằng lời chào, giữa là thông tin, cuối là lời tạm biệt và tên.

### Mẹo đọc
Tìm con số, tên ngày và danh từ viết hoa trước — chúng mang phần lớn thông tin.
""", [("das Schild", "🪧"), ("die Nachricht", "💬"), ("das Geschäft", "🏪"), ("öffnen", "🔓"), ("schließen", "🔒"), ("der Sonntag", "📅"), ("die Post", "📮")],
     [("Giờ mở cửa", O("reading.notices_info", "reading.familiar_words")), ("Một tin nhắn nhỏ", O("reading.short_messages", "reading.familiar_words")), ("Biển hiệu có ích", O("reading.notices_info", "reading.short_messages")), ("Mở hay đóng?", O("reading.notices_info"))])

unit(3, "unit-h", "uh", "Durchsagen und Anweisungen", "Bắt ý chính trong thông báo: giờ, đường ray và chỉ dẫn đơn giản.", """
## Thông báo ở nhà ga 📢

Ở nhà ga Đức, thông báo nói nhanh và có tiếng ồn. Ở đây bạn nghe bản chậm, rõ để luyện bắt **từ khóa**.

### Từ khóa ở nhà ga
- *der Zug* — tàu, *das Gleis* — đường ray (số đường ray để lên tàu)
- *Abfahrt* — giờ khởi hành, *Ankunft* — giờ đến
- *Verspätung* — trễ giờ: *Der Zug hat zehn Minuten Verspätung.*

### Cấu trúc một thông báo
*Der Zug nach München fährt heute von Gleis 5.* — Chuyến tàu đi München hôm nay chạy từ đường ray số 5.

### Chỉ dẫn trong lớp và cửa hàng
- *Hören Sie zu!* — Hãy nghe!
- *Bitte warten Sie.* — Xin hãy chờ.
- *Die Kasse ist dort.* — Quầy thu ngân ở đằng kia.

### Mẹo nghe số
Nhớ: đơn vị đọc trước — *fünfundzwanzig* là 25. Chờ hết số rồi mới chọn.
""", [("der Zug", "🚆"), ("der Bahnhof", "🚉"), ("warten", "⏳"), ("die Minute", "⏱️"), ("das Geld", "💶"), ("hören", "👂")],
     [("Ở nhà ga", O("listening.announcements", "listening.short_info", "numbers.0_100")), ("Mở và đóng", O("listening.announcements", "listening.short_info")), ("Chỉ dẫn đơn giản", O("listening.announcements")), ("Bao nhiêu tiền?", O("listening.short_info", "numbers.0_100", "listening.announcements"))])

unit(3, "unit-i", "ui", "Kleine Dialoge", "Theo dõi các trao đổi ngắn: ở tiệm bánh, nhà ga, cửa hàng.", """
## Hai người nói chuyện 🗣️🗣️

Bạn nghe hai giọng khác nhau trao đổi vài câu ngắn. Hãy tìm: **ai** nói, họ ở **đâu**, họ muốn **gì**.

### Ở tiệm bánh (die Bäckerei)
- *Guten Morgen! Was möchten Sie?* — Chào buổi sáng! Ông/bà muốn gì?
- *Zwei Brötchen, bitte.* — Hai ổ bánh mì nhỏ.
- *Das macht einen Euro zwanzig.* — Tổng cộng một euro hai mươi.

### Ở nhà ga
- *Eine Fahrkarte nach Hamburg, bitte.* — Một vé đi Hamburg.
- *Einfach oder hin und zurück?* — Một chiều hay khứ hồi?

### Du hay Sie?
Người bán và khách nói *Sie* (lịch sự). Bạn bè nói *du*. Nghe *Sie* là biết đó là cuộc trò chuyện trang trọng.

### Mẹo
Câu trả lời thường nằm ở câu cuối: giá tiền, giờ giấc, con số.
""", [("der Kaffee", "☕"), ("das Brot", "🍞"), ("die Karte", "🎫"), ("kaufen", "🛒"), ("bezahlen", "💳"), ("die Uhr", "🕰️")],
     [("Ở tiệm bánh", O("listening.short_dialogues", "reading.short_texts")), ("Một vé, làm ơn", O("listening.short_dialogues", "listening.short_info")), ("Mua và trả tiền", O("listening.short_dialogues")), ("Mấy giờ?", O("listening.short_dialogues", "reading.short_texts", "reading.short_messages"))])

unit(3, "unit-j", "uj", "Kleine Geschichten", "Đọc những đoạn ngắn có mạch: tìm thông tin, theo dõi câu chuyện.", """
## Những câu chuyện nhỏ 📖

Bạn đọc những đoạn văn 3–5 câu về một ngày bình thường: đi làm, cuối tuần, gia đình. Mỗi đoạn có câu hỏi để kiểm tra bạn đã hiểu.

### Cách đọc
- Đọc một lần để biết chuyện gì xảy ra.
- Đọc lại để tìm chi tiết: giờ, nơi chốn, người.
- Động từ đứng thứ hai giúp bạn tìm "ai làm gì": *Am Samstag spielt Jonas Fußball.*

### Từ nối hay gặp
- *und* — và, *aber* — nhưng, *dann* — sau đó
- *zuerst* — trước tiên, *danach* — sau đó

### Nhân vật
Mia, Jonas, Lena và Ben là những người hư cấu sống ở các thành phố Đức. Bạn sẽ gặp lại họ trong phần nói và phần hội thoại. Nếu gặp từ lạ, hãy đoán nghĩa từ câu xung quanh trước khi tra.
""", [("die Arbeit", "💼"), ("der Samstag", "📅"), ("die Familie", "👪"), ("der Bahnhof", "🚉"), ("dann", "➡️"), ("zusammen", "🤝")],
     [("Mia đi làm", O("reading.short_texts")), ("Thứ Bảy của Jonas", O("reading.short_texts", "numbers.0_100")), ("Nhà ga buổi sáng", O("reading.short_texts", "reading.notices_info", "listening.short_info")), ("Chủ nhật cùng gia đình", O("reading.short_texts", "listening.short_info"))])

# ---------------------------------------------------------------- Section 4
unit(4, "unit-k", "uk", "Sag Hallo!", "Nói thành tiếng lời chào, lời cảm ơn và câu xin lỗi.", """
## Nói thành tiếng 🎙️

Từ phần này, bạn nói vào micro. Bộ nhận dạng giọng nói trên điện thoại của bạn ghi lại những từ nó nghe được, và ứng dụng so với câu cần nói. Mình chỉ kiểm tra **từ được nhận ra**, không chấm phát âm đẹp hay xấu.

### Trước khi nói
- Nghe mẫu một lần, rồi nói chậm và rõ.
- Nói cả câu, đừng ngắt giữa chừng.
- Nếu mình không nghe được, bạn có thể thử lại hoặc bỏ qua — bỏ qua không bị tính là sai.

### Câu sẽ luyện
- *Hallo! Guten Tag!* *Guten Morgen, Frau Weber.*
- *Danke schön!* *Bitte schön!*
- *Entschuldigung!* *Tschüss! Auf Wiedersehen!*

### Mẹo phát âm
*Tschüss* bắt đầu bằng "tsch" — gần giống "ch" tiếng Việt nhưng tròn môi hơn. Hãy nghe mẫu để bắt chước.
""", [("Hallo", "👋"), ("Danke", "😊"), ("Entschuldigung", "🙇"), ("Tschüss", "🚪")],
     [("Hallo!", O("speaking.formulaic")), ("Danke schön", O("speaking.formulaic")), ("Guten Abend", O("speaking.formulaic")), ("Entschuldigung!", O("speaking.formulaic"))])

unit(4, "unit-l", "ul", "Ich stelle mich vor", "Tự giới thiệu thành tiếng: tên, quê, nơi ở và sở thích.", """
## Giới thiệu bản thân 🙋

Ở sở ngoại kiều, trường nghề hay nơi làm việc, bạn sẽ cần nói vài câu về mình. Mỗi bài cho một gợi ý bằng tiếng Việt; bạn nói câu tiếng Đức.

### Tên và quê
- *Ich heiße Lan.* — Tôi tên là Lan.
- *Ich komme aus Vietnam.* — Tôi đến từ Việt Nam.

### Nơi ở và ngôn ngữ
- *Ich wohne in Leipzig.* — Tôi sống ở Leipzig.
- *Ich spreche Vietnamesisch und ein bisschen Deutsch.* — Tôi nói tiếng Việt và một chút tiếng Đức.

### Nghề và sở thích
- *Ich arbeite als Krankenpfleger.* — Tôi làm điều dưỡng.
- *Ich spiele gern Fußball.* — Tôi thích chơi bóng đá. *gern* sau động từ nghĩa là "thích làm".

### Nhớ
Động từ đứng thứ hai, và đuôi động từ với *ich* là **-e**: *heiße, komme, wohne, spreche*.
""", [("kommen", "🛬"), ("wohnen", "🏡"), ("sprechen", "🗣️"), ("arbeiten", "💼"), ("gern", "❤️")],
     [("Tôi tên là…", O("speaking.self_intro")), ("Tôi đến từ…", O("speaking.self_intro")), ("Tôi thích, tôi làm", O("speaking.self_intro")), ("Tôi sống ở…", O("speaking.self_intro"))])

unit(4, "unit-m", "um", "Zahlen laut sagen", "Nói thông tin thật: bao nhiêu cái, bao nhiêu tiền, lúc mấy giờ.", """
## Nói con số 🔢

Bạn nói thông tin có con số: số lượng, giá tiền, giờ giấc. Ứng dụng chấp nhận cả chữ số và chữ viết (*drei* hay *3*), nhưng số sai là câu trả lời sai.

### Số lượng
- *Ich habe zwei Brüder.* — Tôi có hai anh/em trai.
- *Wir sind vier Personen.* — Chúng tôi có bốn người.

### Giá tiền
- *Das kostet fünf Euro.* — Cái này giá năm euro.
- *Zwei Euro fünfzig.* — Hai euro năm mươi.

### Giờ giấc
- *Um acht Uhr.* — Lúc tám giờ.
- *Der Kurs beginnt um neun.* — Khóa học bắt đầu lúc chín giờ.

### Ngày trong tuần
*am Montag* — vào thứ Hai, *am Wochenende* — vào cuối tuần.

### Mẹo
Với số hai chữ số, nói đơn vị trước: *vierundzwanzig* (24).
""", [("das Geld", "💶"), ("die Uhr", "🕰️"), ("der Montag", "📅"), ("das Jahr", "🎆")],
     [("Có bao nhiêu?", O("speaking.give_info")), ("Giá bao nhiêu?", O("speaking.give_info")), ("Mấy giờ?", O("speaking.give_info")), ("Các ngày", O("speaking.give_info"))])

unit(4, "unit-n", "un", "Beschreib es!", "Mô tả điều bạn thấy bằng cụm ngắn: đó là gì, và một đặc điểm.", """
## Mô tả bằng cụm ngắn 🔍

Bạn nhìn gợi ý rồi nói một cụm ngắn: đó là gì, và một đặc điểm.

### Đó là gì?
- *Das ist ein Hund.* — Đó là một con chó.
- *Das ist eine Katze.* — Đó là một con mèo.

### Một đặc điểm
- *Der Hund ist groß.* — Con chó to.
- *Die Wohnung ist klein.* — Căn hộ nhỏ.
- *Das Wetter ist schön.* — Thời tiết đẹp.

### Tính từ sau sein không đổi đuôi
Sau *ist* / *sind*, tính từ giữ nguyên: *Das Haus ist alt.* (Tính từ đứng trước danh từ thì đổi đuôi — bạn sẽ học ở trình độ sau.)

### Nơi chốn
*Das Café ist offen.* — Quán cà phê đang mở. *Das Museum ist geschlossen.* — Bảo tàng đóng cửa.
""", [("groß", "🐘"), ("klein", "🐭"), ("alt", "🏚️"), ("neu", "✨")],
     [("Das ist…", O("speaking.describe")), ("Nơi chốn", O("speaking.describe")), ("Mở hay đóng?", O("speaking.describe")), ("Ôn tập nói", O("speaking.describe"))])

# ---------------------------------------------------------------- Section 5
unit(5, "unit-o", "uo", "Schreib, wer du bist", "Viết về bản thân: tên, tuổi, quê và nơi bạn sống.", """
## Viết về chính bạn ✍️

Trong phần này bạn viết câu ngắn bằng tiếng Đức. Mỗi bài có danh sách thông tin bắt buộc. Ứng dụng kiểm tra từng ô thông tin, không chấm văn hay hay dở.

### Ba câu cơ bản
- *Ich heiße Lan.* — Tôi tên là Lan.
- *Ich bin zwanzig Jahre alt.* — Tôi hai mươi tuổi (dùng **sein**).
- *Ich wohne in Hanoi.* — Tôi sống ở Hà Nội.

### Quê và quốc tịch
*Ich komme aus Vietnam.* *Ich bin Vietnamesin.* (nữ) / *Ich bin Vietnamese.* (nam)

### Mẹo khi gõ
- Viết hoa danh từ: *Jahre, Vietnam*.
- Gõ đủ umlaut: *für*, không phải *fur*. Nếu bàn phím không có, nhấn giữ phím *u*.
- Kết thúc mỗi câu bằng dấu chấm.
""", [("wohnen", "🏡"), ("die Stadt", "🏙️"), ("das Jahr", "🎆"), ("alt", "🎂")],
     [("Tên của bạn", O("writing.personal_info")), ("Tuổi của bạn", O("writing.personal_info")), ("Thành phố của bạn", O("writing.personal_info")), ("Tất cả về bạn", O("writing.personal_info"))])

unit(5, "unit-p", "up", "Einfache Sätze", "Viết câu đơn giản về người, đồ vật và sở thích.", """
## Viết câu đơn giản 📝

Mỗi câu cần ít nhất **chủ ngữ + động từ**. Rồi thêm thông tin bài yêu cầu.

### Ai làm gì
- *Mein Bruder arbeitet in Berlin.* — Anh trai tôi làm việc ở Berlin.
- *Meine Mutter kocht gern.* — Mẹ tôi thích nấu ăn.

### Điều bạn thích
- *Ich trinke gern Kaffee.* — Tôi thích uống cà phê.
- *Ich mag Musik.* — Tôi thích âm nhạc.

### Hai ý trong một câu
Nối bằng *und* (và) hoặc *aber* (nhưng); động từ vẫn đứng thứ hai trong mỗi vế: *Ich lerne Deutsch und mein Freund lernt Englisch.*

### Kiểm tra trước khi gửi
Động từ có đúng đuôi chưa? (*ich -e, du -st, er/sie -t*) Danh từ đã viết hoa chưa?
""", [("gern", "❤️"), ("lieben", "💕"), ("spielen", "⚽")],
     [("Điều bạn thích", O("writing.phrases_sentences")), ("Hai thứ bạn thích", O("writing.phrases_sentences")), ("Về một người khác", O("writing.phrases_sentences")), ("Một cảnh nhỏ", O("writing.phrases_sentences"))])

unit(5, "unit-q", "uq", "Kurze Nachrichten", "Viết lời nhắn ngắn hằng ngày: chào, thông tin, kết.", """
## Lời nhắn ngắn 💬

Một lời nhắn tốt có ba phần. Ứng dụng kiểm tra đủ ba phần, không chấm văn phong.

### 1. Lời chào
- *Hallo Mia,* *Liebe Lena,* (thân mật) — *Sehr geehrte Frau Schmidt,* (trang trọng)

### 2. Thông tin
- *Ich komme um acht Uhr.* — Mình đến lúc tám giờ.
- *Wir treffen uns am Bahnhof.* — Chúng ta gặp nhau ở nhà ga.
- *Ich bin krank und komme heute nicht.* — Tôi ốm và hôm nay không đến được.

### 3. Lời kết
- *Bis später!* *Bis morgen!* *Viele Grüße, Lan*

### Mẹo
Sau lời chào có dấu phẩy, dòng tiếp theo viết thường nếu không phải danh từ: *Hallo Mia, ich komme…* Viết với bạn bè dùng *du*, với thầy cô hay sếp dùng *Sie*.
""", [("die Nachricht", "💬"), ("treffen", "🤝"), ("spät", "⏰")],
     [("Nhắn về quán cà phê", O("writing.short_message")), ("Nhắn về chuyến tàu", O("writing.short_message")), ("Chào, thông tin, kết", O("writing.short_message")), ("Lời nhắn của riêng bạn", O("writing.short_message"))])

unit(5, "unit-r", "ur", "Formulare und Nachrichten", "Điền biểu mẫu đơn giản và ghép các phần đã viết.", """
## Điền biểu mẫu 🗂️

Ở Đức bạn sẽ điền nhiều biểu mẫu: đăng ký cư trú, khóa học, khách sạn. Các ô hay gặp:

### Ô thông tin
- *Vorname* — tên, *Nachname* — họ
- *Alter* — tuổi, *Geburtsdatum* — ngày sinh
- *Wohnort* — nơi ở, *Straße* — đường phố
- *Telefonnummer* — số điện thoại
- *Staatsangehörigkeit* — quốc tịch: *vietnamesisch*

### Họ và tên
Người Việt ghi họ trước, người Đức ghi tên trước. Với *Nguyễn Văn An*: *Vorname: Van An*, *Nachname: Nguyen*.

### Ngày tháng
Người Đức viết ngày trước, tháng sau, có dấu chấm: *15.03.2002*.

### Ghép các phần
Bài cuối của đơn vị ghép biểu mẫu với lời nhắn ngắn — dùng những gì bạn đã viết ở các đơn vị trước.
""", [("der Name" if "der Name" in GLOSS else "Name", "🏷️"), ("die Straße", "🛣️"), ("das Telefon", "☎️")],
     [("Biểu mẫu đăng ký", O("writing.form_filling")), ("Biểu mẫu khách sạn", O("writing.form_filling")), ("Một lời nhắn đầy đủ", O("writing.short_message", "writing.personal_info")), ("Mọi thứ về bạn", O("writing.personal_info", "writing.phrases_sentences"))])

# ---------------------------------------------------------------- Section 6
unit(6, "unit-s", "us", "Erste Gespräche", "Trao đổi thật đầu tiên: chào, hỏi thăm, hỏi tên, tạm biệt.", """
## Trò chuyện thật sự 🤝

Trong phần này bạn nói chuyện với một nhân vật. Câu bạn nói quyết định nhân vật trả lời gì tiếp theo. Nếu cần, bạn có thể nhờ nhắc lại hoặc nói cách khác — làm vậy không bị trừ điểm.

### Chào và hỏi thăm
- *— Hallo! Wie geht's?* — Chào! Khỏe không?
- *— Gut, danke. Und dir?* — Khỏe, cảm ơn. Còn bạn?

### Hỏi tên
- *— Wie heißt du?* — Bạn tên gì?
- *— Ich heiße Minh. Und du?*

### Khi không hiểu
- *Noch einmal, bitte.* — Xin nhắc lại.
- *Langsamer, bitte.* — Chậm hơn, làm ơn.

### Kết thúc
*Tschüss!*, *Bis bald!* (hẹn sớm gặp lại). Với người lạ hoặc người lớn tuổi, dùng *Sie*: *Wie heißen Sie?*, và chào *Auf Wiedersehen*.
""", [("Hallo", "👋"), ("Name", "🏷️"), ("Tschüss", "🚪"), ("Freund", "🧑‍🤝‍🧑")],
     [("Hallo, wie geht's?", O("interaction.everyday_conversation")), ("Hội thoại: chào nhanh", O("interaction.everyday_conversation")), ("Tên", O("interaction.everyday_conversation")), ("Hội thoại: gặp một người", O("interaction.everyday_conversation"))])

unit(6, "unit-t", "ut", "In der Bäckerei und im Geschäft", "Gọi món, mua và trả tiền bằng câu lịch sự đơn giản.", """
## Mua bán lịch sự 🥨

Ở tiệm bánh, siêu thị hay quán ăn, vài câu ngắn là đủ.

### Người bán hỏi
- *Was darf es sein?* — Ông/bà dùng gì ạ?
- *Sonst noch etwas?* — Còn gì nữa không ạ?

### Bạn trả lời
- *Ich hätte gern zwei Brötchen.* / *Ich möchte einen Kaffee.* — Cho tôi…
- *Nein, danke. Das ist alles.* — Không, cảm ơn. Thế thôi.

### Trả tiền
- *Was kostet das?* — Cái này bao nhiêu tiền?
- *Das macht drei Euro fünfzig.* — Tổng cộng ba euro năm mươi.
- *Mit Karte, bitte.* — Trả bằng thẻ. *Bar* — tiền mặt.

### Lịch sự
Luôn thêm *bitte* khi yêu cầu và *danke* khi nhận. Người bán dùng *Sie*. Khi ra về, chào *Tschüss!* hoặc *Schönen Tag noch!* (chúc một ngày tốt lành).
""", [("kaufen", "🛒"), ("bezahlen", "💳"), ("das Brot", "🍞"), ("der Kaffee", "☕")],
     [("Was darf es sein?", O("interaction.practical_needs")), ("Hội thoại: ở tiệm bánh", O("interaction.practical_needs")), ("Das ist alles", O("interaction.practical_needs")), ("Hội thoại: ở cửa hàng", O("interaction.practical_needs"))])

unit(6, "unit-u", "uu", "Wo ist…?", "Hỏi đường, hỏi tàu và hiểu chỉ dẫn ngắn.", """
## Hỏi đường 🧭

### Hỏi
- *Entschuldigung, wo ist der Bahnhof?* — Xin lỗi, nhà ga ở đâu?
- *Wie komme ich zum Museum?* — Tôi đến bảo tàng bằng cách nào?
- *Von welchem Gleis fährt der Zug nach Berlin?* — Tàu đi Berlin chạy từ đường ray nào?

### Chỉ dẫn
- *links* — bên trái, *rechts* — bên phải, *geradeaus* — đi thẳng
- *Da vorne.* — Ở đằng trước kia. *Gleich hier.* — Ngay đây.
- *Nehmen Sie die S-Bahn.* — Ông/bà hãy đi tàu S-Bahn.

### Khi chưa rõ
*Noch einmal, bitte?* — Xin nhắc lại? *Ist das weit?* — Có xa không?

### Cảm ơn
*Vielen Dank!* — Cảm ơn nhiều! Người kia sẽ đáp *Bitte schön!* hoặc *Gern geschehen!*
""", [("die Straße", "🛣️"), ("der Bahnhof", "🚉"), ("das Hotel", "🏨"), ("der Weg", "🧭")],
     [("… ở đâu?", O("interaction.practical_needs")), ("Hội thoại: nhà ga", O("interaction.practical_needs")), ("Trái, phải, đi thẳng", O("interaction.practical_needs")), ("Hội thoại: khách sạn", O("interaction.practical_needs"))])

unit(6, "unit-v", "uv", "Termine und Pläne", "Thống nhất ngày, giờ, địa điểm — và nói bạn muốn gì.", """
## Hẹn giờ và lên kế hoạch 📅

Ở Đức người ta rất coi trọng *der Termin* — cuộc hẹn. Bạn sẽ hẹn với bạn bè, đặt lịch ở phòng khám và gọi điện xin nghỉ ốm.

### Hỏi ngày giờ
- *Hast du am Samstag Zeit?* — Thứ Bảy bạn rảnh không?
- *Um wie viel Uhr?* — Mấy giờ?
- *Wo treffen wir uns?* — Mình gặp nhau ở đâu?

### Đồng ý hoặc từ chối
- *Ja, gern!* — Có, rất sẵn lòng!
- *Leider nicht. Ich muss arbeiten.* — Tiếc là không. Mình phải làm việc.

### Ở phòng khám
- *Ich brauche einen Termin.* — Tôi cần một cuộc hẹn.
- *Haben Sie morgen um zehn Zeit?* — Ngày mai lúc mười giờ ông/bà có rảnh không?

### Gọi điện xin nghỉ
*Ich bin krank. Ich kann heute nicht kommen.* — Tôi bị ốm. Hôm nay tôi không đến được.
""", [("der Termin", "📅"), ("die Zeit", "⏳"), ("treffen", "🤝")],
     [("Ngày nào? Mấy giờ?", O("interaction.everyday_conversation")), ("Hội thoại: lên kế hoạch", O("interaction.everyday_conversation")), ("Ở phòng khám", O("interaction.practical_needs")), ("Hội thoại: gọi điện xin nghỉ", O("interaction.everyday_conversation"))])

# ---------------------------------------------------------------- emit
missing = []
lines = []
for u in UNITS:
    words = []
    for surface, emoji in u["words"]:
        if surface not in GLOSS:
            missing.append((u["uid"], surface))
            continue
        words.append({"target": surface, "native": GLOSS[surface], "emoji": emoji})
    rec = {"sectionId": f"{C}:section-{u['section']}", "id": f"{C}:{u['uid']}", "title": u["title"], "description": u["desc"], "guidebook": u["gb"], "words": words,
           "lessons": [{"id": f"{C}:{u['lkey']}-l{i}", "title": (t if t != "Bài 1" else f"Bài {i + 1}"), "objectives": objs} for i, (t, objs) in enumerate(u["lessons"])]}
    if u["uid"] in ("unit-1", "unit-a", "unit-f", "unit-k", "unit-o", "unit-s"):
        rec["sectionTitle"] = S[u["section"]]
    lines.append(json.dumps(rec, ensure_ascii=False))
    n = len(u["gb"])
    if not 600 <= n <= 2000:
        print("guidebook length", u["uid"], n)
    if len(u["desc"]) > 90:
        print("description length", u["uid"], len(u["desc"]))
open(OUT, "w", encoding="utf-8", newline="\n").write("\n".join(lines) + "\n")
print(len(lines), "units; missing words:", missing)

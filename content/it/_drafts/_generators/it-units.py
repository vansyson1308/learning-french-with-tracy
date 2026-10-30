"""Build content/it/_drafts/units/OUTPUT.jsonl for it-vi.

Words are (surface, emoji); the Vietnamese gloss is copied from the lexicon so it
is identical to the lexicon, as the units step requires.
usage: python -I it-units.py <repo root>
"""
import json, os, sys

ROOT = sys.argv[1]
d = json.load(open(f"{ROOT}/content/it/lexicon/lexemes.json", encoding="utf-8"))
GLOSS = {x["surface"]: x["glosses"]["vi"] for x in d["lexemes"]}
C = "it-vi"
S = {
    1: "Phần 1: Nhập môn",
    2: "Phần 2: Viên gạch nền",
    3: "Phần 3: Hiểu tiếng Ý hằng ngày",
    4: "Phần 4: Nói những câu tiếng Ý đầu tiên",
    5: "Phần 5: Viết tiếng Ý hằng ngày",
    6: "Phần 6: Trò chuyện với ai đó",
}
O = lambda *xs: [f"it.obj.{x}" for x in xs]
UNITS = []


def unit(section, uid, lkey, title, desc, guidebook, words, lessons):
    UNITS.append(dict(section=section, uid=uid, lkey=lkey, title=title, desc=desc, gb=guidebook.strip(), words=words, lessons=lessons))


# ---------------------------------------------------------------- Section 1
unit(1, "unit-1", "u0", "Căn bản 1", "Những từ tiếng Ý đầu tiên: người, đồ ăn, đồ uống và động từ avere.", """
## Benvenuto! Chào mừng bạn đến với tiếng Ý 🇮🇹

Mọi danh từ tiếng Ý đều có **giống**: giống đực hoặc giống cái. Tiếng Việt không có mạo từ, nên hãy học danh từ cùng mạo từ ngay từ đầu: *il ragazzo*, *la ragazza*, *l'acqua*.

### Người
- *l'uomo* — người đàn ông, *la donna* — người phụ nữ
- *il ragazzo* — cậu bé, *la ragazza* — cô gái, *il bambino* — đứa bé

### Đồ ăn và đồ uống
- *la mela* — quả táo, *il pane* — bánh mì
- *l'acqua* — nước, *il latte* — sữa

### Động từ
- **mangiare** (ăn): *Mangio il pane.* — Tôi ăn bánh mì.
- **bere** (uống): *Il bambino beve il latte.* — Đứa bé uống sữa.
- **avere** (có): *Ho una mela.* — Tôi có một quả táo.

### Không cần "tôi"
Đuôi động từ đã cho biết ai đang làm: *mangio* là "tôi ăn", không cần thêm *io*.

### Phủ định
Đặt *non* trước động từ: *Non mangio.* — Tôi không ăn.
""", [("l'uomo", "👨"), ("la donna", "👩"), ("il ragazzo", "👦"), ("la ragazza", "👧"), ("il bambino", "👶"), ("la mela", "🍎"), ("il pane", "🍞"), ("l'acqua", "💧"), ("il latte", "🥛"), ("mangiare", "🍽️"), ("bere", "🥤"), ("avere", "🤲")],
     [("Bài 1", O("vocab.everyday_basics", "reading.familiar_words"))] * 4)

unit(1, "unit-2", "u1", "Chào hỏi", "Lời chào và câu lịch sự thiết yếu cho mọi lúc trong ngày.", """
## Chào hỏi kiểu Ý 👋

Người Ý chào theo thời điểm trong ngày và theo mức độ thân quen.

### Theo giờ
- *buongiorno* — xin chào (buổi sáng và đầu giờ chiều)
- *buonasera* — chào buổi tối (từ chiều muộn)
- *buonanotte* — chúc ngủ ngon (chỉ khi đi ngủ)

### Thân mật hay lịch sự?
- *ciao* — chào hoặc tạm biệt, chỉ dùng với bạn bè và người thân
- *arrivederci* — tạm biệt, dùng với người lạ, trong cửa hàng

### Lịch sự
- *per favore* — làm ơn
- *grazie* — cảm ơn; *prego* — không có gì
- *sì* — vâng; *no* — không

Chú ý: *sì* có dấu nghĩa là "vâng", còn *si* không dấu là một từ khác.

### Gọi người khác
*il signore* (ông) và *la signora* (bà). Khi gọi trực tiếp, người Ý nói *Buongiorno, signora!*
""", [("ciao", "👋"), ("buongiorno", "🌅"), ("buonasera", "🌆"), ("buonanotte", "🌙"), ("arrivederci", "🚶"), ("per favore", "🙏"), ("grazie", "😊"), ("prego", "🤝"), ("sì", "✅"), ("no", "❌"), ("il signore", "🧔"), ("la signora", "👵")],
     [("Bài 1", O("greetings.basic", "reading.familiar_words"))] * 4)

unit(1, "unit-3", "u2", "Đồ ăn", "Đồ ăn thức uống và cách gọi món đơn giản.", """
## A tavola! Vào bàn nào 🍝

### Món quen thuộc
- *la pasta* — mì Ý, *la pizza* — bánh pizza, *il riso* — cơm
- *il pollo* — thịt gà, *la carne* — thịt, *l'uovo* — quả trứng
- *il formaggio* — phô mai, *la frutta* — trái cây

### Đồ uống
- *il caffè* — cà phê, *il tè* — trà
- *il succo* — nước ép, *il vino* — rượu vang

### Gọi món
Cách gọi lịch sự nhất là **vorrei** (tôi muốn):
- *Vorrei un caffè, per favore.* — Cho tôi một ly cà phê.
- *Una pizza, per favore.* — Cho tôi một cái pizza.

### Dấu trên chữ cuối
*il caffè* và *il tè* có dấu: trọng âm rơi vào âm cuối. Dấu này chỉ trọng âm, không phải thanh điệu như tiếng Việt.

### Số nhiều đặc biệt
*l'uovo* (quả trứng) có số nhiều là *le uova*. Từ này đổi cả mạo từ.
""", [("il caffè", "☕"), ("il riso", "🍚"), ("l'uovo", "🥚"), ("il formaggio", "🧀"), ("la frutta", "🍇"), ("il succo", "🧃"), ("la pasta", "🍝"), ("il vino", "🍷"), ("la pizza", "🍕"), ("il pollo", "🍗"), ("la carne", "🥩"), ("il tè", "🍵")],
     [("Bài 1", O("vocab.everyday_basics", "reading.familiar_words"))] * 4)

unit(1, "unit-4", "u3", "Gia đình", "Bố mẹ, anh chị em, ông bà và con vật cưng trong nhà.", """
## La famiglia — Gia đình 👨‍👩‍👧

### Bố mẹ và con
- *il padre* — bố, *la madre* — mẹ
- *il figlio* — con trai, *la figlia* — con gái
- *il marito* — chồng, *la moglie* — vợ

### Anh chị em, ông bà
- *il fratello* — anh hoặc em trai (tiếng Ý không phân biệt anh hay em)
- *la sorella* — chị hoặc em gái
- *il nonno* — ông, *la nonna* — bà

Nghe kỹ: *nonno* có **hai chữ n**. Phụ âm kép đọc dài hơn hẳn.

### "Của tôi"
*mio* đi với giống đực, *mia* đi với giống cái:
- *Mio padre lavora qui.* — Bố tôi làm việc ở đây.
- *Mia madre è a casa.* — Mẹ tôi ở nhà.

Trước tên người thân ở số ít, người Ý không dùng mạo từ: nói *mia madre*, không nói *la mia madre*.

### Con vật cưng
*il cane* — con chó: *Ho un cane.*
""", [("la famiglia", "🏠"), ("il padre", "👨‍🦱"), ("la madre", "👩‍🦰"), ("il fratello", "👬"), ("la sorella", "👭"), ("il figlio", "🧑"), ("la figlia", "👱‍♀️"), ("il nonno", "👴"), ("la nonna", "🧓"), ("il marito", "🤵"), ("la moglie", "👰"), ("il cane", "🐕")],
     [("Bài 1", O("vocab.everyday_basics", "reading.familiar_words"))] * 4)

unit(1, "unit-5", "u4", "Đi lại", "Thành phố, nhà ga, khách sạn và tấm vé của bạn.", """
## In viaggio — Trên đường đi 🚆

### Trong thành phố
- *la città* — thành phố, *la strada* — con đường, *il museo* — bảo tàng
- *la stazione* — nhà ga, *l'aeroporto* — sân bay, *l'albergo* — khách sạn

### Phương tiện và đồ dùng
- *il treno* — tàu hỏa, *l'autobus* — xe buýt
- *il biglietto* — vé, *la valigia* — va li, *la mappa* — bản đồ

### Mua vé
*Vorrei un biglietto per Roma, per favore.* — Tôi muốn một vé đi Roma.

### Dấu lược
*l'* thay cho *lo* hoặc *la* trước nguyên âm: *l'albergo*, *l'aeroporto*, *l'autobus*. Viết liền, không có khoảng trắng sau dấu lược.

### Danh từ không đổi
*la città* có dấu ở chữ cuối nên số nhiều giữ nguyên: *le città*. *L'autobus* kết thúc bằng phụ âm cũng vậy: *gli autobus*.
""", [("la città", "🏙️"), ("il treno", "🚆"), ("la stazione", "🚉"), ("l'aeroporto", "🛫"), ("l'albergo", "🏨"), ("la strada", "🛣️"), ("il museo", "🏛️"), ("la mappa", "🗺️"), ("il biglietto", "🎫"), ("la valigia", "🧳"), ("l'autobus", "🚌"), ("il viaggio", "🧭")],
     [("Bài 1", O("vocab.places_travel", "reading.familiar_words"))] * 4)

# ---------------------------------------------------------------- Section 2
unit(2, "unit-a", "ua", "Giống & Mạo từ", "il, lo, la, l': chọn mạo từ theo giống và âm đầu của danh từ.", """
## Giống và mạo từ 📘

### Đoán giống từ đuôi
- Đuôi **-o** thường là giống đực: *il libro*
- Đuôi **-a** thường là giống cái: *la casa*
- Đuôi **-e** phải học từng từ: *il pane*, *la chiave*
- Ngoại lệ hay gặp: *la mano* (bàn tay) là giống cái, *il problema* là giống đực.

### Chọn mạo từ theo âm đầu
| Âm đầu của danh từ | Đực | Cái |
|---|---|---|
| phụ âm thường | *il libro* | *la casa* |
| nguyên âm | *l'amico* | *l'amica* |
| s + phụ âm, z, gn, ps | *lo studente, lo zaino* | *la scuola* |

### Số nhiều
- Đực: *i libri*, nhưng *gli amici*, *gli studenti*, *gli zaini*
- Cái: luôn là *le*: *le case*, *le amiche*

### Không xác định
*un libro*, *uno zaino*, *una casa*, *un'amica*. Chú ý: *un amico* không có dấu lược vì là giống đực; *un'amica* có dấu lược vì là giống cái.
""", [("il libro", "📕"), ("la casa", "🏡"), ("lo zaino", "🎒"), ("lo studente", "🧑‍🎓"), ("l'amico", "🧍‍♂️"), ("l'amica", "🧍‍♀️"), ("la scuola", "🏫"), ("il tavolo", "🪑"), ("la sedia", "💺"), ("la porta", "🚪"), ("la finestra", "🪟"), ("lo sport", "⚽"), ("il nome", "🏷️"), ("la chiave", "🔑")],
     [("il, lo, la, l'", O("articles.definite")), ("i, gli, le", O("articles.plurals", "articles.definite")), ("un, uno, una, un'", O("articles.indefinite_elision")), ("Ôn: mạo từ", O("articles.definite", "articles.indefinite_elision", "articles.plurals"))])

unit(2, "unit-b", "ub", "Những động từ dùng nhiều nhất", "essere, avere, ba nhóm động từ, động từ khuyết thiếu và thì quá khứ.", """
## Động từ tiếng Ý 🗣️

### essere và avere
| | essere (là) | avere (có) |
|---|---|---|
| io | sono | ho |
| tu | sei | hai |
| lui/lei/Lei | è | ha |
| noi | siamo | abbiamo |
| voi | siete | avete |
| loro | sono | hanno |

Chữ *h* trong *ho, hai, ha, hanno* không đọc. *È* có dấu là "là"; *e* không dấu là "và".

### Ba nhóm
- **-are**: *parlo, parli, parla, parliamo, parlate, parlano*
- **-ere**: *leggo, leggi, legge, leggiamo, leggete, leggono*
- **-ire**: *dormo, dormi, dorme, dormiamo, dormite, dormono*
- **-ire có -isc-**: *capisco, capisci, capisce, capiamo, capite, capiscono*

### Động từ khuyết thiếu
*Voglio mangiare. Posso entrare? Devo lavorare.*

### Quá khứ
Tiếng Việt thêm "đã"; tiếng Ý dùng trợ động từ + phân từ: *Ho mangiato. Sono andato.* Động từ di chuyển thường đi với *essere*.
""", [("essere", "🧘"), ("parlare", "💬"), ("abitare", "🏘️"), ("lavorare", "💼"), ("studiare", "📖"), ("leggere", "📰"), ("scrivere", "✍️"), ("dormire", "😴"), ("capire", "💡"), ("andare", "🚶‍♂️"), ("fare", "🛠️"), ("volere", "🤩")],
     [("essere và avere", O("verbs.essere_avere_present")), ("Ba nhóm động từ", O("verbs.regular_present", "syntax.negation_questions")), ("volere, potere, dovere; mi piace", O("verbs.modals_piacere")), ("Đã làm gì? Ho mangiato, sono andato", O("verbs.passato_recognition"))])

unit(2, "unit-c", "uc", "Từ quốc tế & Bạn giả", "Từ bạn đã biết sẵn, và những từ trông quen nhưng nghĩa khác.", """
## Từ quen và bẫy 🎭

### Từ quốc tế
Bạn đã biết sẵn nhiều từ: *il taxi*, *il computer*, *il film*, *il bar*, *la musica*. Tiếng Ý cũng cho thế giới nhiều từ: *la pizza*, *la pasta*.

Từ mượn kết thúc bằng phụ âm thường không đổi ở số nhiều: *i film*, *i computer*, *i bar*, *i taxi*.

### Bạn giả với tiếng Anh
Nếu bạn biết tiếng Anh, hãy cẩn thận:
- *la camera* là **căn phòng**, không phải máy ảnh.
- *il parente* là **họ hàng**, không phải bố mẹ. Bố mẹ là *i genitori*.
- *la fattoria* là **trang trại**, không phải nhà máy.

### Từ dễ nhầm giống
- *il problema* đuôi -a nhưng giống đực
- *la foto* đuôi -o nhưng giống cái (viết tắt của *la fotografia*)
- *la radio* cũng giống cái

### Quán bar ở Ý
*il bar* là nơi uống cà phê buổi sáng, không chỉ là nơi uống rượu.
""", [("il taxi", "🚕"), ("il computer", "💻"), ("il film", "🎬"), ("il bar", "🍸"), ("il ristorante", "🍴"), ("la musica", "🎵"), ("il cinema", "🎦"), ("la camera", "🛏️"), ("il telefono", "☎️"), ("l'università", "🎓"), ("la foto", "📷"), ("il problema", "❓")],
     [("Từ quốc tế", O("strategy.cognates_false_friends", "vocab.everyday_basics")), ("Bạn giả", O("strategy.cognates_false_friends")), ("Giống của từ mượn", O("articles.definite", "strategy.cognates_false_friends")), ("Ôn: đoán nghĩa", O("strategy.cognates_false_friends", "vocab.everyday_basics"))])

unit(2, "unit-d", "ud", "Số từ 0 đến 100", "Đếm, giờ giấc, giá tiền và tuổi.", """
## I numeri — Số đếm 🔢

### 0 đến 10
*zero, uno, due, tre, quattro, cinque, sei, sette, otto, nove, dieci*

### 11 đến 19
*undici, dodici, tredici, quattordici, quindici, sedici, diciassette, diciotto, diciannove*

### Hàng chục
*venti, trenta, quaranta, cinquanta, sessanta, settanta, ottanta, novanta, cento*

### Ghép số
Viết liền thành một từ: *ventidue*, *trentacinque*. Hai điều cần nhớ:
- Trước *uno* và *otto*, hàng chục rụng nguyên âm cuối: *ventuno*, *ventotto*, *trentuno*.
- Số tận cùng bằng 3 có dấu: *ventitré*, *trentatré*.

### Tuổi và giá
Tiếng Ý dùng **avere** để nói tuổi: *Ho venti anni* (nghĩa đen: "tôi có hai mươi năm").
*Euro* không đổi ở số nhiều: *un euro*, *dieci euro*. *Quanto costa?* — Giá bao nhiêu?

### Giờ
*Che ora è?* — *Sono le otto.* Riêng một giờ: *È l'una.*
""", [("zero", "0️⃣"), ("due", "2️⃣"), ("tre", "3️⃣"), ("quattro", "4️⃣"), ("cinque", "5️⃣"), ("sei", "6️⃣"), ("sette", "7️⃣"), ("otto", "8️⃣"), ("nove", "9️⃣"), ("dieci", "🔟"), ("l'euro", "💶"), ("l'ora", "🕐")],
     [("Đếm đến 20", O("numbers.0_100")), ("Hàng chục và số ghép", O("numbers.0_100", "writing.familiar_words")), ("Tuổi và giá tiền", O("numbers.0_100", "vocab.time_calendar")), ("Giờ giấc và ngày", O("vocab.time_calendar", "numbers.0_100"))])

unit(2, "unit-e", "ue", "Âm & Chữ viết tiếng Ý", "Phụ âm kép, c và g, gn và gli, dấu trọng âm và dấu lược.", """
## Âm tiếng Ý 🎧

### Phụ âm kép đổi nghĩa
Tiếng Việt không có phụ âm kép, nên đây là điểm khó nhất. Phụ âm kép đọc **dài hơn**, như giữ lại một nhịp:
- *pala* (cái xẻng) — *palla* (quả bóng)
- *caro* (đắt) — *carro* (xe kéo)
- *sete* (khát) — *sette* (số bảy)
- *nono* (thứ chín) — *nonno* (ông)
- *sono* (tôi là) — *sonno* (buồn ngủ)

### c và g
- *ca, co, cu*: âm k — *casa*; *ce, ci*: âm ch — *cena*
- *ga, go, gu*: âm g — *gatto*; *ge, gi*: âm gi — *gelato*
- *che, chi*: âm k — *chiave*; *ghe, ghi*: âm g

### Tổ hợp khó
*gn* như "nh": *bagno*. *gli* gần như "li" mềm: *famiglia*. *sc* trước e, i là âm "s" nặng: *pesce*.

### Trọng âm
Thường rơi vào âm áp chót. Dấu chỉ trọng âm ở cuối: *città*, *caffè*. Đừng đọc dấu như thanh huyền tiếng Việt.
""", [("la pala", "🪏"), ("la palla", "🏐"), ("il carro", "🛒"), ("nono", "🥉"), ("il sonno", "🥱"), ("la sete", "🏜️"), ("caro", "💎"), ("la mamma", "🤱")],
     [("Phụ âm kép", O("pronunciation.double_consonants")), ("c, g, gn, gli, sc", O("pronunciation.double_consonants", "spelling.accents_apostrophe")), ("Dấu trọng âm", O("spelling.accents_apostrophe", "pronunciation.double_consonants")), ("Dấu lược", O("spelling.accents_apostrophe", "articles.indefinite_elision"))])

# ---------------------------------------------------------------- Section 3
unit(3, "unit-f", "uf", "Ascolta!", "Nghe từ và cụm từ quen thuộc được nói rõ ràng, chậm rãi.", """
## Ascolta! — Nghe nào 👂

Trong phần này bạn tập **nghe hiểu**. Mỗi đoạn được đọc rõ và chậm; bạn được nghe tối đa hai lần khi làm bài có chấm điểm.

### Mẹo nghe
- Đừng dịch từng từ. Hãy bắt từ chính: tên người, nơi chốn, con số.
- Nghe kỹ phụ âm kép: *nonno* và *nono* khác nhau.
- Đọc câu hỏi trước khi nghe để biết cần tìm gì.

### Từ dùng khi nghe
- *ascoltare* — nghe, *ripetere* — nhắc lại
- *Può ripetere, per favore?* — Xin ông/bà nhắc lại được không?
- *Non capisco.* — Tôi không hiểu.
- *Parli piano, per favore.* — Xin nói chậm thôi.

### Từ trong phòng và ngoài phố
Bạn sẽ nghe những từ đã học ở Phần 1 và Phần 2. Nếu quên, cứ mở lại phần từ vựng rồi nghe lại. Mỗi lần nghe lại đều có ích.
""", [("ascoltare", "👂"), ("ripetere", "🔁"), ("guardare", "👀"), ("vedere", "🔭"), ("sentire", "🦻"), ("la parola", "🔤")],
     [("Từ và cụm từ", O("listening.familiar_words", "vocab.everyday_basics")), ("Người và đồ vật", O("listening.familiar_words", "reading.familiar_words")), ("Câu ngắn", O("listening.familiar_words")), ("Ôn: nghe và đọc", O("listening.familiar_words", "reading.familiar_words"))])

unit(3, "unit-g", "ug", "Messaggi e cartelli", "Đọc tin nhắn, biển báo và giờ mở cửa.", """
## Tin nhắn và biển báo 📩

Bạn không cần hiểu mọi từ để lấy được thông tin trên biển báo. Hãy tìm thông tin cần thiết.

### Biển báo hay gặp
- *aperto* — đang mở, *chiuso* — đóng cửa
- *l'ingresso* — lối vào, *l'uscita* — lối ra
- *l'orario* — giờ mở cửa
- *il lunedì chiuso* — đóng cửa vào thứ Hai

### Giờ giấc trên biển
Người Ý thường viết giờ theo 24 tiếng: *9:00–13:00, 15:00–19:00*. Nhiều cửa hàng nghỉ trưa, nên hãy đọc kỹ.

### Tin nhắn ngắn
Tin nhắn thường có lời chào, một thông tin và lời kết:
*Ciao Anna! Sono al bar in piazza. A presto, Marco*

### Dấu hiệu từ
Ngày và giờ thường đi với *a* hoặc *alle*: *alle otto* — lúc tám giờ, *a marzo* — vào tháng Ba.
""", [("aperto", "🔓"), ("chiuso", "🔒"), ("l'ingresso", "➡️"), ("l'uscita", "⬅️"), ("l'orario", "🗓️"), ("il messaggio", "📩"), ("il negozio", "🏪")],
     [("Tin nhắn ngắn", O("reading.short_messages", "reading.familiar_words")), ("Biển báo", O("reading.notices_info")), ("Giờ mở cửa", O("reading.notices_info", "numbers.0_100")), ("Ôn: tìm thông tin", O("reading.notices_info", "reading.short_messages"))])

unit(3, "unit-h", "uh", "Annunci e istruzioni", "Thông báo ở nhà ga, trong cửa hàng và chỉ dẫn trong lớp.", """
## Thông báo và chỉ dẫn 📢

### Ở nhà ga
Thông báo thường có ba thông tin: **tàu nào, giờ nào, sân ga nào**.
- *il binario* — sân ga: *Il treno parte dal binario due.*
- *in ritardo* — đến muộn
- *la fermata* — bến xe, điểm dừng

### Trong lớp
Giáo viên hay nói với cả lớp hoặc một người:
- *Ascolta!* — Hãy nghe! (với một bạn)
- *Leggete la pagina dieci.* — Các bạn hãy đọc trang mười.
- *Scrivi la risposta.* — Hãy viết câu trả lời.

### Lịch sự với người lạ
Khi chỉ đường cho người lạ, người Ý dùng dạng lịch sự: *Giri a destra.* — Hãy rẽ phải. *Vada sempre dritto.* — Cứ đi thẳng.

### Mẹo nghe
Con số thường là thông tin chính. Hãy chuẩn bị nghe số ngay khi nghe *binario* hoặc *alle*.
""", [("il binario", "🛤️"), ("la fermata", "🚏"), ("il ritardo", "⏰"), ("la pagina", "📄"), ("la risposta", "📝"), ("la domanda", "🙋")],
     [("Ở nhà ga", O("listening.announcements", "listening.short_info")), ("Trong cửa hàng", O("listening.announcements")), ("Trong lớp", O("listening.announcements", "listening.familiar_words")), ("Ôn: giờ và số", O("listening.short_info", "numbers.0_100"))])

unit(3, "unit-i", "ui", "Piccoli dialoghi", "Nghe và hiểu những cuộc trò chuyện rất ngắn giữa hai người.", """
## Hội thoại ngắn 💬

Hai giọng khác nhau trò chuyện vài câu. Bạn cần hiểu **họ nói về chuyện gì** và **thông tin chính**.

### Tu hay Lei?
- Với bạn bè: **tu** — *Come stai?* — Bạn khỏe không?
- Với người lạ: **Lei** — *Come sta?* — Ông/bà khỏe không?

Động từ với *Lei* chia như ngôi thứ ba: *Lei parla italiano?*

### Cuộc trò chuyện hay gặp
- *Come ti chiami?* — *Mi chiamo Luca.*
- *Di dove sei?* — *Sono di Hanoi.*
- *Quanti anni hai?* — *Ho venti anni.*
- *Quanto costa?* — *Due euro.*

### Từ nhỏ mà hữu ích
- *allora* — vậy thì
- *va bene* — được rồi
- *ecco* — đây này
- *d'accordo* — đồng ý

Hãy nghe cả giọng điệu: câu hỏi tiếng Ý thường chỉ khác câu kể ở ngữ điệu lên cao cuối câu.
""", [("va bene", "👌"), ("allora", "🤔"), ("ecco", "👉"), ("d'accordo", "🤝"), ("come stai", "🙂"), ("come sta", "🎩")],
     [("Làm quen", O("listening.short_dialogues", "greetings.basic")), ("Ở quán bar", O("listening.short_dialogues", "listening.short_info")), ("Đi đâu?", O("listening.short_dialogues", "reading.short_messages")), ("Ôn: tu và Lei", O("listening.short_dialogues", "listening.short_info"))])

unit(3, "unit-j", "uj", "Piccole storie", "Đọc và nghe những câu chuyện nhỏ về đời sống hằng ngày.", """
## Câu chuyện nhỏ 📖

Bây giờ bạn đọc những đoạn văn ngắn từ hai đến năm câu về một người và một ngày của họ.

### Cách đọc
1. Đọc lướt một lần để biết nói về ai.
2. Đọc câu hỏi.
3. Đọc lại và tìm câu trả lời trong đoạn.

### Từ chỉ thời gian giúp theo dõi câu chuyện
- *la mattina* — buổi sáng, *il pomeriggio* — buổi chiều, *la sera* — buổi tối
- *prima* — trước, *poi* — sau đó
- *ogni giorno* — mỗi ngày, *spesso* — thường, *sempre* — luôn luôn

### Thói quen hằng ngày
Một số động từ đi với đại từ nhỏ: *mi alzo* — tôi thức dậy, *mi lavo* — tôi tắm rửa. Đại từ đứng trước động từ.

### Đừng dừng lại
Gặp từ lạ, hãy đọc tiếp đã. Thường bạn vẫn trả lời được, vì từ lạ không phải lúc nào cũng là từ chính.
""", [("la mattina", "🌄"), ("il pomeriggio", "🌇"), ("la sera", "🌃"), ("poi", "⏭️"), ("ogni", "♾️"), ("spesso", "🔄")],
     [("Một ngày của tôi", O("reading.short_texts", "listening.short_info")), ("Gia đình của Luca", O("reading.short_texts", "reading.familiar_words")), ("Thông tin và con số", O("reading.short_texts", "numbers.0_100")), ("Ôn: đọc hiểu", O("reading.short_texts", "reading.notices_info"))])

# ---------------------------------------------------------------- Section 4
unit(4, "unit-k", "uk", "Di' ciao!", "Nói thành tiếng lời chào và câu lịch sự.", """
## Nói thành tiếng 🎤

Từ phần này bạn **nói** vào micro. Ứng dụng chỉ kiểm tra máy nghe được từ nào; đây không phải điểm phát âm. Âm thanh không được lưu lại.

### Mẹo nói
- Nói cả câu, không cần nhanh.
- Giữ đủ độ dài của phụ âm kép: *grazie* có một *z*, nhưng *arrivederci* có hai *r*.
- Nếu máy không nghe được, cứ thử lại. Trục trặc kỹ thuật không bị tính là sai.

### Chọn lời chào
- Sáng và đầu giờ chiều, với người lạ: *Buongiorno!*
- Tối: *Buonasera!*
- Với bạn bè: *Ciao!*
- Khi cần xin lỗi người lạ: *Scusi!*; với bạn bè: *Scusa!*

### Câu hữu ích
- *Grazie mille!* — Cảm ơn nhiều!
- *Mi dispiace.* — Tôi xin lỗi.
- *A presto!* — Hẹn sớm gặp lại!
""", [("scusi", "🙇"), ("scusa", "😅"), ("salve", "🖐️"), ("a presto", "⏳")],
     [("Chào hỏi", O("speaking.formulaic")), ("Cảm ơn và xin lỗi", O("speaking.formulaic")), ("Theo tình huống", O("speaking.formulaic", "greetings.basic")), ("Ôn: nói", O("speaking.formulaic"))])

unit(4, "unit-l", "ul", "Mi presento", "Nói về bản thân từng câu ngắn: tên, quê, nơi sống, sở thích.", """
## Giới thiệu bản thân 🙋

### Mẫu câu
- *Mi chiamo Lan.* — Tôi tên là Lan.
- *Sono vietnamita.* — Tôi là người Việt Nam.
- *Sono di Hanoi.* — Tôi đến từ Hà Nội.
- *Abito a Roma.* — Tôi sống ở Roma.
- *Ho venti anni.* — Tôi hai mươi tuổi.
- *Parlo vietnamita e un po' di italiano.* — Tôi nói tiếng Việt và một chút tiếng Ý.
- *Lavoro in un negozio.* / *Studio all'università.*
- *Mi piace la musica.* — Tôi thích âm nhạc.

### Giới từ với nơi chốn
Với **thành phố** dùng *a*: *a Roma*, *a Hanoi*. Với **đất nước** dùng *in*: *in Italia*, *in Vietnam*.

### Nam hay nữ?
Một số từ đổi theo người nói: *Sono italiano* (nam), *Sono italiana* (nữ). *Vietnamita* giữ nguyên cho cả hai.

### Hỏi lại
*E tu?* — Còn bạn? Với người lạ: *E Lei?*
""", [("mi chiamo", "📛"), ("vietnamita", "🇻🇳"), ("l'Italia", "🇮🇹"), ("il Vietnam", "🌏"), ("mi piace", "❤️")],
     [("Tên và quê", O("speaking.self_intro")), ("Nơi sống và tuổi", O("speaking.self_intro")), ("Công việc và sở thích", O("speaking.self_intro")), ("Ôn: tự giới thiệu", O("speaking.self_intro", "speaking.formulaic"))])

unit(4, "unit-m", "um", "I numeri ad alta voce", "Nói số, giá tiền và giờ giấc.", """
## Nói số 🔊

Trong phần này, chữ số và từ được tính như nhau: "8" và *otto* đều đúng khi bạn nói.

### Nói giá
- *Il caffè costa un euro.*
- *Il biglietto costa dieci euro.*
- Có số lẻ: *tre euro e cinquanta*

### Nói giờ
- *Sono le otto.* — Tám giờ.
- *Sono le otto e mezza.* — Tám giờ rưỡi.
- *Sono le otto e un quarto.* — Tám giờ mười lăm.
- *Sono le nove meno un quarto.* — Chín giờ kém mười lăm.
- *È l'una.* — Một giờ.

### Nói số lượng
- *Ho due fratelli.*
- *Siamo in quattro.* — Chúng tôi có bốn người.

### Số điện thoại
Người Ý đọc từng chữ số một: *tre, tre, otto…* Hãy tập đọc số của chính bạn.
""", [("il numero", "🔢"), ("costare", "🏷"), ("quanto", "❔"), ("mezzo", "🌗")],
     [("Số đếm", O("speaking.give_info", "numbers.0_100")), ("Giá tiền", O("speaking.give_info")), ("Giờ giấc", O("speaking.give_info", "vocab.time_calendar")), ("Ôn: nói thông tin", O("speaking.give_info"))])

unit(4, "unit-n", "un", "Descrivi!", "Mô tả người, nơi chốn, đồ vật bằng cụm từ ngắn.", """
## Mô tả 🎨

### Tính từ đứng sau danh từ
Giống tiếng Việt: *una casa grande* — một ngôi nhà lớn; *un gatto nero* — một con mèo đen.

### Tính từ hợp giống và số
| | số ít | số nhiều |
|---|---|---|
| đực | *piccolo* | *piccoli* |
| cái | *piccola* | *piccole* |

Tính từ đuôi -e giữ nguyên ở số ít cả hai giống: *un ragazzo gentile*, *una ragazza gentile*; số nhiều đổi thành -i: *gentili*.

### Mẫu câu
- *È grande.* — Nó lớn.
- *La casa è piccola.* — Ngôi nhà nhỏ.
- *Ha i capelli neri.* — Cô ấy có mái tóc đen.
- *C'è un tavolo.* — Có một cái bàn. *Ci sono due letti.* — Có hai cái giường.

### Từ dùng nhiều
*grande, piccolo, bello, nuovo, vecchio, alto, basso*.

*Molto* làm tính từ mạnh hơn: *molto bello* — rất đẹp.
""", [("grande", "🐘"), ("piccolo", "🐜"), ("bello", "🌸"), ("nuovo", "🆕")],
     [("Người", O("speaking.describe")), ("Đồ vật", O("speaking.describe", "vocab.everyday_basics")), ("Nơi chốn", O("speaking.describe")), ("Ôn: mô tả", O("speaking.describe", "speaking.self_intro"))])

# ---------------------------------------------------------------- Section 5
unit(5, "unit-o", "uo", "Scrivi chi sei", "Viết tên, tuổi, quê quán và nơi ở của bạn.", """
## Viết về bản thân ✏️

Bài viết được chấm tự động theo tiêu chí: có đủ thông tin được yêu cầu, đủ độ dài, từ có nghĩa. Bạn không cần viết hoa mỹ.

### Mẫu
*Mi chiamo Hoa. Ho ventidue anni. Sono vietnamita, di Hue. Abito a Milano con un'amica.*

Chú ý chính tả: *un'amica* có dấu lược, *un amico* thì không.

### Thông tin hay cần
- *il nome* — tên, *il cognome* — họ
- *l'età* — tuổi
- *l'indirizzo* — địa chỉ
- *il numero di telefono* — số điện thoại

### Viết hoa
Tên người, tên thành phố, tên nước viết hoa: *Marco, Roma, Vietnam*. Tên ngày và tháng viết thường: *lunedì, marzo*. Từ chỉ tiếng và quốc tịch cũng viết thường: *italiano, vietnamita*.

### Dấu lược và dấu nhấn
Đừng quên dấu ở *è, sì, età, città*.
""", [("il cognome", "🪪"), ("l'età", "🎂"), ("l'indirizzo", "📍"), ("il cellulare", "📱")],
     [("Tên và tuổi", O("writing.personal_info")), ("Quê và nơi ở", O("writing.personal_info")), ("Gia đình của tôi", O("writing.personal_info", "writing.phrases_sentences")), ("Ôn: viết về mình", O("writing.personal_info"))])

unit(5, "unit-p", "up", "Frasi semplici", "Viết những câu ngắn: ai làm gì, ở đâu, thích gì.", """
## Viết câu đơn giản 🖊️

### Trật tự câu
Giống tiếng Việt: chủ ngữ, động từ, phần còn lại: *Marco mangia la pizza.*

Nhưng chủ ngữ là đại từ thường bỏ đi: *Mangio la pizza.*

### Phủ định
*Non* đứng ngay trước động từ: *Non mangio la carne.*

### Mẫu "thích"
*Mi piace* cho một thứ hoặc một động từ; *mi piacciono* cho nhiều thứ:
- *Mi piace la pizza.*
- *Mi piace leggere.*
- *Mi piacciono i gatti.*

Câu này đảo so với tiếng Việt: nghĩa đen là "pizza làm tôi thích".

### Nối câu
- *e* — và: *Leggo e studio.*
- *ma* — nhưng: *Abito a Roma, ma lavoro a Tivoli.*
- *perché* — vì: *Studio l'italiano perché lavoro in Italia.*

### Chấm câu
Câu hỏi kết thúc bằng dấu hỏi: *Dove abiti?*
""", [("ma", "⚖️"), ("perché", "🧐"), ("anche", "➕")],
     [("Ai làm gì?", O("writing.phrases_sentences")), ("Phủ định và câu hỏi", O("writing.phrases_sentences", "syntax.negation_questions")), ("Tôi thích", O("writing.phrases_sentences", "verbs.modals_piacere")), ("Ôn: viết câu", O("writing.phrases_sentences"))])

unit(5, "unit-q", "uq", "Messaggi brevi", "Viết tin nhắn ngắn: lời chào, thông tin, lời kết.", """
## Viết tin nhắn ngắn 💌

Một tin nhắn cần ba phần: **lời chào, thông tin, lời kết**.

### Với bạn bè (tu)
*Ciao Marco! Vieni al bar domani alle otto? A presto, Lan*

### Với người lạ hoặc giáo viên (Lei)
*Gentile professoressa, domani non posso venire a lezione perché sono malata. Grazie. Cordiali saluti, Hoa*

### Mở đầu và kết thúc
| | Bắt đầu | Kết thúc |
|---|---|---|
| thân mật | *Ciao Anna!* | *A presto!*, *Ciao!* |
| lịch sự | *Gentile signora,* | *Cordiali saluti,* |

### Hỏi và hẹn
- *Sei libero sabato?* — Thứ Bảy bạn rảnh không?
- *Ci vediamo alle sette?* — Bảy giờ gặp nhau nhé?
- *Dove ci vediamo?* — Chúng ta gặp nhau ở đâu?

Trong kỳ thi CILS A1, bài viết thứ hai là một tin nhắn ngắn khoảng 15 đến 30 từ.
""", [("a domani", "📆"), ("il sabato", "🛍️"), ("libero", "🕊️")],
     [("Tin nhắn cho bạn", O("writing.short_message")), ("Hẹn gặp", O("writing.short_message", "vocab.time_calendar")), ("Tin nhắn lịch sự", O("writing.short_message")), ("Ôn: tin nhắn", O("writing.short_message"))])

unit(5, "unit-r", "ur", "Moduli e messaggi", "Điền biểu mẫu và viết lời nhắn cho tình huống thực tế.", """
## Biểu mẫu 📋

Ở Ý bạn sẽ phải điền nhiều biểu mẫu: ở trường, ở khách sạn, ở nơi làm việc.

### Các ô thường gặp
- *Nome* — tên, *Cognome* — họ
- *Età* — tuổi
- *Nazionalità* — quốc tịch
- *Indirizzo* — địa chỉ
- *Città* — thành phố
- *Telefono* — số điện thoại
- *Email* — thư điện tử

### Lưu ý
Người Ý viết họ trước trong nhiều giấy tờ: *Cognome: Nguyen. Nome: Lan.*
Ngày tháng viết theo thứ tự ngày, tháng, năm, giống tiếng Việt.

### Viết lời nhắn
*Vado al supermercato. Torno alle sei. Mamma* — Mẹ đi siêu thị. Sáu giờ về.

### Trong phần thi
Bài viết thứ nhất của CILS A1 là mô tả ngắn khoảng 20 đến 40 từ. Hãy dùng những mẫu câu bạn đã biết.
""", [("il modulo", "📋"), ("compilare", "🖋️"), ("l'email", "📧")],
     [("Điền biểu mẫu", O("writing.form_filling", "writing.personal_info")), ("Ở khách sạn", O("writing.form_filling")), ("Viết lời nhắn", O("writing.phrases_sentences", "writing.form_filling")), ("Ôn: viết", O("writing.form_filling", "writing.short_message"))])

# ---------------------------------------------------------------- Section 6
unit(6, "unit-s", "us", "Prime conversazioni", "Những cuộc trò chuyện đầu tiên: làm quen, hỏi thăm.", """
## Trò chuyện 🗨️

Bây giờ bạn trò chuyện với ứng dụng. Câu trả lời của bạn quyết định câu tiếp theo. Người đối thoại rất kiên nhẫn: nhắc lại, nói cách khác, không bao giờ phạt bạn khi cần giúp.

### Giữ cuộc trò chuyện
- *Può ripetere, per favore?* — Xin ông/bà nhắc lại được không? (Lei)
- *Puoi ripetere?* — Bạn nhắc lại được không? (tu)
- *Non capisco.* — Tôi không hiểu.
- *Come si dice…?* — Nói … thế nào?

### Giữ một cách xưng hô
Mỗi cuộc trò chuyện giữ một cách xưng hô: với bạn bè dùng **tu**, với người lạ dùng **Lei**. Đừng trộn hai cách.

| | tu | Lei |
|---|---|---|
| tên | *Come ti chiami?* | *Come si chiama?* |
| khỏe | *Come stai?* | *Come sta?* |
| ở đâu | *Dove abiti?* | *Dove abita?* |

### Làm quen
*Piacere!* — Rất vui được gặp bạn.
""", [("piacere", "🌟"), ("il vicino", "🏘"), ("la gente", "👥"), ("la lingua", "👅")],
     [("Làm quen", O("interaction.everyday_conversation")), ("Hỏi thăm", O("interaction.everyday_conversation")), ("Hội thoại: ở trường", O("interaction.everyday_conversation")), ("Hội thoại: hàng xóm", O("interaction.everyday_conversation"))])

unit(6, "unit-t", "ut", "Al bar e in negozio", "Gọi cà phê ở quầy, mua hàng, hỏi giá và trả tiền.", """
## Ở quán bar và cửa hàng ☕

### Quán bar kiểu Ý
Ở nhiều quán, bạn **trả tiền ở quầy thu ngân trước** (*la cassa*), lấy biên lai (*lo scontrino*), rồi đưa biên lai ở quầy (*il banco*) để lấy cà phê. Uống đứng tại quầy thường rẻ hơn ngồi bàn.

### Gọi món
- *Cosa desidera?* — Ông/bà muốn gì ạ?
- *Un caffè e un cornetto, per favore.*
- *Quant'è?* — Hết bao nhiêu?
- *Sono tre euro.*

### Mua hàng
- *Quanto costa questa borsa?*
- *Posso provare?* — Tôi thử được không?
- *Che taglia porta?* — Ông/bà mặc cỡ nào?
- *Pago in contanti.* / *Pago con la carta.*

### Lịch sự
Với người bán, dùng **Lei**. Khi ra về nói *Arrivederci!* hoặc *Grazie, buona giornata!*
""", [("il conto", "🧾"), ("la cassa", "🏧"), ("lo scontrino", "🎟️"), ("il banco", "🥃")],
     [("Ở quán bar", O("interaction.practical_needs")), ("Hội thoại: gọi cà phê", O("interaction.practical_needs")), ("Ở cửa hàng", O("interaction.practical_needs")), ("Hội thoại: ở chợ", O("interaction.practical_needs"))])

unit(6, "unit-u", "uu", "Dov'è…?", "Hỏi đường, đi tàu, đến hiệu thuốc.", """
## Hỏi đường 🧭

### Hỏi
- *Scusi, dov'è la stazione?* — Xin lỗi, nhà ga ở đâu ạ?
- *C'è una farmacia qui vicino?* — Gần đây có hiệu thuốc không?
- *È lontano?* — Có xa không?

### Trả lời
- *Vada sempre dritto.* — Cứ đi thẳng.
- *Giri a destra / a sinistra.* — Rẽ phải / rẽ trái.
- *È la seconda strada a sinistra.* — Đường thứ hai bên trái.
- *È qui vicino.* — Ở gần đây.

### Ở nhà ga
- *Un biglietto per Firenze, per favore.*
- *A che ora parte il treno?* — Tàu chạy lúc mấy giờ?
- *Da quale binario?* — Từ sân ga nào?

### Ở hiệu thuốc
- *Ho mal di testa.* — Tôi bị đau đầu.
- *Ho la febbre.* — Tôi bị sốt.
- *Ha una medicina per…?* — Có thuốc trị … không ạ?
""", [("la destra", "👉🏻"), ("la sinistra", "👈"), ("dritto", "⬆️"), ("la farmacia", "💊")],
     [("Đường đi", O("interaction.practical_needs")), ("Hội thoại: hỏi đường", O("interaction.practical_needs")), ("Ở nhà ga", O("interaction.practical_needs", "listening.short_info")), ("Hội thoại: hiệu thuốc", O("interaction.practical_needs"))])

unit(6, "unit-v", "uv", "Appuntamenti e programmi", "Lên kế hoạch, đặt hẹn, nói về giờ làm.", """
## Hẹn và kế hoạch 📅

### Rủ bạn bè (tu)
- *Sei libero sabato?* — Thứ Bảy bạn rảnh không?
- *Andiamo al cinema?* — Chúng ta đi xem phim nhé?
- *A che ora ci vediamo?* — Mấy giờ gặp nhau?
- *Alle otto, va bene?* — Tám giờ được không?

### Đặt hẹn (Lei)
- *Vorrei un appuntamento.* — Tôi muốn đặt một cuộc hẹn.
- *Quando può venire?* — Khi nào ông/bà đến được?
- *Domani alle dieci.* — Mai lúc mười giờ.

### Gọi điện
Trả lời điện thoại bằng *Pronto!* Tự giới thiệu: *Sono Lan.*

### Nơi làm việc
- *il turno* — ca làm việc, *il capo* — sếp
- *Oggi non posso venire: sono malato.* — Hôm nay tôi không đến được: tôi bị ốm.
- *Lavoro dalle nove alle cinque.* — Tôi làm từ chín giờ đến năm giờ.
""", [("l'appuntamento", "📅"), ("il turno", "🏭"), ("il capo", "👔")],
     [("Ngày nào? Mấy giờ?", O("interaction.everyday_conversation")), ("Hội thoại: lên kế hoạch", O("interaction.everyday_conversation")), ("Đặt hẹn", O("interaction.practical_needs")), ("Hội thoại: gọi điện xin nghỉ", O("interaction.everyday_conversation"))])

# ---------------------------------------------------------------- emit
missing = []
lines = []
seen = {}
for u in UNITS:
    words = []
    for surface, emoji in u["words"]:
        if surface not in GLOSS:
            missing.append((u["uid"], surface))
            continue
        if surface in seen:
            print("word in two units", surface, seen[surface], u["uid"])
        seen[surface] = u["uid"]
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
os.makedirs(f"{ROOT}/content/it/_drafts/units", exist_ok=True)
open(f"{ROOT}/content/it/_drafts/units/OUTPUT.jsonl", "w", encoding="utf-8", newline="\n").write("\n".join(lines) + "\n")
print(len(lines), "units; missing words:", missing)

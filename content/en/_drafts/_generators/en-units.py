"""Units of en-vi: content/en/_drafts/units/OUTPUT.jsonl, and the header of the draft pack (a new target has no sibling
course to take its language name and flag from, see ingest.ts), and the staged course profile.

Words are (surface, emoji); the Vietnamese gloss is copied from the lexicon. Only A1 lexemes may be taught here:
the words of core-a2.txt belong to the first A2 stories. Every other syllabus lexeme reaches a unit through the
topic map in en-lex.py (TOPIC_UNITS). usage: python -I en-units.py <repo root>
"""
import json, os, sys

ROOT = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
lex = json.load(open(f"{ROOT}/content/en/lexicon/lexemes.json", encoding="utf-8"))["lexemes"]
GLOSS = {x["surface"]: x["glosses"]["vi"] for x in lex}
LATER = set()
for line in open(os.path.join(HERE, "core-a2.txt"), encoding="utf-8"):
    if line.strip() and not line.startswith(("#", "+")):
        LATER.add(line.split("|")[1])
C = "en-vi"
S = {
    1: "Phần 1: Nhập môn",
    2: "Phần 2: Viên gạch nền",
    3: "Phần 3: Hiểu tiếng Anh hằng ngày",
    4: "Phần 4: Nói những câu tiếng Anh đầu tiên",
    5: "Phần 5: Viết tiếng Anh hằng ngày",
    6: "Phần 6: Trò chuyện với ai đó",
}
O = lambda *xs: [f"en.obj.{x}" for x in xs]
UNITS = []


def unit(section, uid, lkey, title, desc, guidebook, words, lessons):
    UNITS.append(dict(section=section, uid=uid, lkey=lkey, title=title, desc=desc, gb=guidebook.strip(), words=words, lessons=lessons))


# ---------------------------------------------------------------- Section 1: a Vietnamese learner's first words
unit(1, "unit-1", "u0", "Lời chào đầu tiên", "Chào, cảm ơn, xin lỗi: những từ bạn cần ngay từ hôm nay.", """
## Bạn đã biết vài từ rồi

Nhiều người Việt đã quen *hello*, *okay*, *thank you*. Hãy bắt đầu từ chính những từ đó, và tập đọc thật rõ âm cuối.

### Chào và tạm biệt
- *hello* — xin chào; *hi* — chào, dùng khi thân mật
- *good morning* — chào buổi sáng
- *good night* — chúc ngủ ngon, chỉ dùng khi chia tay buổi tối hoặc đi ngủ
- *goodbye* — tạm biệt

### Lịch sự
- *please* — làm ơn; *thank you* — cảm ơn
- *sorry* — xin lỗi, sau khi đã lỡ làm phiền
- *excuse me* — xin lỗi, trước khi hỏi hoặc xin đi qua

### Trả lời nhanh
- *yes* — vâng; *no* — không; *okay* — được

### Không cần đổi xưng hô
Tiếng Việt đổi xưng hô theo tuổi và vai vế: anh, chị, em, cô, chú. Tiếng Anh dùng một từ *you* cho mọi người. Sự lịch sự nằm ở *please* và *thank you*.

### Âm cuối
Tiếng Việt không có âm "s" hay "z" ở cuối từ, nên người Việt hay bỏ mất âm này. Hãy đọc đủ âm cuối của *please* và *yes*.
""", [("hello", "👋"), ("hi", "🙌"), ("goodbye", "🚶"), ("good morning", "🌅"), ("good night", "🌙"), ("please", "🙏"), ("thank you", "😊"), ("sorry", "😔"), ("excuse me", "🙋"), ("yes", "✅"), ("no", "❌"), ("okay", "👌")],
     [("Bài 1", O("greetings.basic", "reading.familiar_words"))] * 4)

unit(1, "unit-2", "u1", "Tôi là ai?", "Nói tên, nói bạn là người Việt, nói bạn làm nghề gì.", """
## Câu đầu tiên về bạn

Tiếng Việt chỉ cần "Tôi tên Lan". Tiếng Anh gần như luôn cần một động từ giữa chủ ngữ và phần còn lại:
- *I am Lan.* — Tôi là Lan.
- *You are my friend.* — Bạn là bạn của tôi.
- *My name is Lan.* — Tên tôi là Lan.

### I và you
*I* (tôi) luôn viết hoa, kể cả giữa câu. *you* là bạn, anh, chị, ông, bà: một từ cho tất cả.

### Tôi là người Việt
- *I am Vietnamese.* — Tôi là người Việt.
- *I am from Vietnam.* — Tôi đến từ Việt Nam.
- *I speak Vietnamese and English.* — Tôi nói tiếng Việt và tiếng Anh.

*Vietnam* là tên nước. *Vietnamese* là người Việt và tiếng Việt. Cả hai đều viết hoa, *English* cũng vậy.

### Việc làm cần có a hoặc an
Tiếng Việt nói "Tôi là công nhân". Tiếng Anh cần thêm *a*:
- *I am a worker.* — Tôi là công nhân.
- *She is a teacher.* — Cô ấy là giáo viên.
- *I am a student.* — Tôi là sinh viên.

### Người
*man* là người đàn ông, *woman* là người phụ nữ, *friend* là bạn. Bạn sẽ gặp lại chúng ở mọi phần sau.
""", [("I", "🙋‍♂️"), ("you", "🫵"), ("name", "🏷️"), ("Vietnam", "🇻🇳"), ("Vietnamese", "🗣️"), ("English", "🇺🇸"), ("man", "👨"), ("woman", "👩"), ("friend", "🧑‍🤝‍🧑"), ("teacher", "👩‍🏫"), ("student", "🧑‍🎓"), ("worker", "👷")],
     [("Bài 1", O("vocab.everyday_basics", "reading.familiar_words"))] * 4)

unit(1, "unit-3", "u2", "Gia đình của tôi", "Bố mẹ, anh chị em, vợ chồng, con cái và từ my.", """
## My family — Gia đình tôi

### Bố mẹ và con
- *father* — bố; *mother* — mẹ
- *son* — con trai; *daughter* — con gái
- *child* — đứa con, đứa trẻ; số nhiều là *children*

### Vợ chồng, anh chị em
- *husband* — chồng; *wife* — vợ
- *brother* — anh trai hoặc em trai
- *sister* — chị gái hoặc em gái

Tiếng Việt phân biệt anh với em, tiếng Anh thì không. Nếu cần rõ, người ta thêm *older* (lớn hơn) hoặc *younger* (nhỏ hơn).

### My: của tôi
Tiếng Việt đặt "của tôi" sau danh từ. Tiếng Anh đặt *my* trước danh từ, và không cần thêm mạo từ:
- *my mother* — mẹ tôi
- *my family* — gia đình tôi

Đừng nói "the my mother" hay "mother my".

### Have: có
*have* nói về thứ mình có, cả người thân:
- *I have a brother.* — Tôi có một anh trai.
- *I have two children.* — Tôi có hai con.

Câu cuối có *two children*. Khi có từ hai trở lên, danh từ tiếng Anh phải đổi sang số nhiều, dù tiếng Việt không đổi gì.

### Âm khó
*father*, *mother*, *brother* có âm *th* ở giữa, lưỡi đặt nhẹ giữa hai hàm răng. Đừng đọc thành "d" hay "ph".
""", [("family", "🏠"), ("father", "👨‍🦱"), ("mother", "👩‍🦰"), ("son", "🧑"), ("daughter", "👱‍♀️"), ("child", "🧒"), ("husband", "🤵"), ("wife", "👰"), ("brother", "👬"), ("sister", "👭"), ("my", "🫴"), ("have", "🤲")],
     [("Bài 1", O("vocab.everyday_basics", "pronouns.possessives"))] * 4)

unit(1, "unit-4", "u3", "Ăn và uống", "Cơm, phở, cà phê: gọi tên món quen và nói điều bạn muốn.", """
## Những món bạn biết

Vài từ đã quen tai với người Việt: *coffee* nghe gần giống "cà phê", *beer* gần giống "bia". Cách đọc thì khác, nên hãy nghe kỹ.

### Đồ ăn
- *rice* — cơm, gạo; *noodle* — sợi mì, sợi phở
- *egg* — quả trứng; *chicken* — thịt gà, con gà
- *fish* — cá

### Đồ uống
- *water* — nước; *tea* — trà
- *coffee* — cà phê; *beer* — bia

### Không đếm được
*water*, *rice*, *coffee* thường không đi với *a*, vì tiếng Anh coi chúng là khối không đếm được:
- *I eat rice.* — Tôi ăn cơm.
- *I drink water.* — Tôi uống nước.

Riêng khi gọi món, người ta vẫn nói *a coffee, please*: nghĩa là một ly cà phê.

### Eat, drink, want
- *I eat fish.* — Tôi ăn cá.
- *I drink tea.* — Tôi uống trà.
- *I want coffee.* — Tôi muốn cà phê.

### Không có "đang"
Tiếng Việt có thể nói "Tôi ăn cơm" và hiểu là đang ăn hoặc thường ăn. *I eat rice* chỉ nghĩa là thói quen. Bạn sẽ học cách nói "đang ăn" ở Phần 2.

### Âm cuối
Đọc đủ âm cuối của *rice* và *fish*. Tiếng Việt không có hai âm cuối này nên rất dễ bỏ sót.
""", [("rice", "🍚"), ("noodle", "🍜"), ("egg", "🥚"), ("chicken", "🍗"), ("fish", "🐟"), ("water", "💧"), ("tea", "🍵"), ("coffee", "☕"), ("beer", "🍺"), ("eat", "🍽️"), ("drink", "🥤"), ("want", "🤩")],
     [("Bài 1", O("vocab.everyday_basics", "reading.familiar_words"))] * 4)

unit(1, "unit-5", "u4", "Đi lại", "Xe buýt, tắc xi, nhà ga, sân bay và câu hỏi Where?", """
## Từ quen trên đường đi

Tiếng Việt đã có "xe buýt" và "tắc xi", nên *bus* và *taxi* rất dễ nhớ. Hãy đọc rõ âm cuối: *bus* kết thúc bằng âm "s".

### Xe cộ
- *bus* — xe buýt; *taxi* — tắc xi
- *motorbike* — xe máy; *car* — ô tô; *train* — tàu hỏa

### Nơi chốn
- *station* — nhà ga; *airport* — sân bay
- *street* — đường phố; *home* — nhà, chỗ ở của mình

### Vé
*ticket* — vé. *A ticket, please.* — Cho tôi một vé.

### Go và where
- *I go home.* — Tôi về nhà.
- *Where is the station?* — Nhà ga ở đâu?

Tiếng Việt để "ở đâu" cuối câu. Tiếng Anh đưa *where* lên đầu câu.

### Không có to trước home
Tiếng Anh nói *go to the station* nhưng *go home*: không có *to* và không có *the*.

### Cụm phụ âm
*street* mở đầu bằng ba phụ âm liền nhau: s, t, r. Tiếng Việt không có cụm như vậy, nên hãy đọc chậm rồi nhanh dần và đừng chen thêm nguyên âm.
""", [("bus", "🚌"), ("taxi", "🚕"), ("motorbike", "🏍️"), ("car", "🚗"), ("train", "🚆"), ("ticket", "🎫"), ("station", "🚉"), ("airport", "🛫"), ("street", "🛣️"), ("home", "🏡"), ("go", "🚶‍♂️"), ("where", "❓")],
     [("Bài 1", O("vocab.places_work", "reading.familiar_words"))] * 4)

# ---------------------------------------------------------------- Section 2
unit(2, "unit-a", "ua", "Mạo từ và số nhiều", "a, an, the: tiếng Việt không có. Thêm -s khi có nhiều, trừ vài trường hợp.", """
## Mạo từ và số nhiều

Tiếng Việt không có mạo từ và cũng ít khi đánh dấu số nhiều. Vì vậy đây là phần cần luyện nhiều nhất.

### a hay an?
Nghe âm đầu, đừng nhìn chữ đầu:
- *a book*, *a university* — âm đầu là phụ âm
- *an apple*, *an hour* — âm đầu là nguyên âm

*University* viết bằng chữ u nhưng âm đầu gần giống "i-u". *Hour* viết bằng chữ h nhưng h không đọc.

### the
Dùng *the* khi người nghe biết bạn nói về cái nào:
- *I have a dog. The dog is small.*

Lần đầu nhắc đến dùng *a*. Từ lần sau dùng *the*.

### Số nhiều
- Thêm *-s*: *books*
- Sau s, x, ch, sh thêm *-es*: *boxes*
- Phụ âm + y thành *-ies*: *city* → *cities*
- Bất quy tắc: *child* → *children*, *man* → *men*, *person* → *people*

### Không đếm được
*bread*, *milk*, *money*, *information* không đi với *a* và không có số nhiều. Muốn nói một phần, hãy dùng *some*: *some bread*.
""", [("a", "1️⃣"), ("an", "🅰️"), ("the", "☝️"), ("some", "🤏"), ("apple", "🍎"), ("book", "📕"), ("hour", "🕐"), ("university", "🎓"), ("box", "📦"), ("city", "🏙️"), ("people", "👥"), ("bread", "🍞"), ("milk", "🥛"), ("money", "💵")],
     [("a và an", O("articles.a_an_the")), ("the", O("articles.a_an_the")), ("Số nhiều", O("nouns.plurals_countability")), ("Đếm được và không đếm được", O("nouns.plurals_countability", "articles.a_an_the"))])

unit(2, "unit-b", "ub", "Những động từ dùng nhiều nhất", "be, do, thêm -s, thêm -ing, thêm -ed: động từ tiếng Anh đổi dạng thế nào.", """
## Động từ tiếng Anh đổi dạng

Tiếng Việt không chia động từ và dùng *đã, đang, sẽ*. Tiếng Anh đổi chính động từ.

### be
- *I am*, *he is*, *she is*, *it is*
- *you are*, *we are*, *they are*

Phủ định và câu hỏi: *I am not. Is she here?* Dạng rút gọn: *I'm*, *she's*, *isn't*.

### Hiện tại đơn: việc thường làm
- *I work*, nhưng *he works*, *she works*
- *Do you work here?* *Does she work here?*
- *I don't work.* *She doesn't work.*

Sau *does* và *doesn't*, động từ không có *-s*.

### Đang làm: be + V-ing
*I am working.* — Tôi đang làm việc.

### Đã làm
- *I worked.* — Thêm *-ed*.
- *I went*, *I had*, *I saw*: những dạng phải học thuộc.
- *Did you go?* *I didn't go.*

Tiếng Việt có thể bỏ "đã" khi đã có "hôm qua". Tiếng Anh thì không: *Yesterday I worked.*

### Sẽ làm
- *I am going to call him.* — Việc đã định.
- *I will call you.* — Việc vừa quyết định, lời hứa.
""", [("be", "🧘"), ("do", "🛠️"), ("work", "💼"), ("live", "🏘️"), ("like", "❤️"), ("need", "🆘"), ("come", "🏃"), ("see", "👁️"), ("make", "🧰"), ("take", "🫳"), ("know", "🧠"), ("buy", "🛒")],
     [("be: am, is, are", O("verbs.be_there_is")), ("Hiện tại đơn với do, does", O("verbs.present_simple_do", "syntax.questions_word_order")), ("Đang làm: be + V-ing", O("verbs.present_continuous")), ("Đã làm và sẽ làm", O("verbs.past_recognition", "verbs.future_can_would"))])

unit(2, "unit-c", "uc", "Từ quen và bẫy", "Từ tiếng Việt đã mượn, những từ dễ nhầm và lỗi I very like.", """
## Từ bạn đã biết, và những cái bẫy

### Từ quen tai
Tiếng Việt đã có nhiều từ gần giống tiếng Anh, nên bạn đoán được ngay: *TV* (ti vi), *hotel*, *menu*, *internet*, *computer*, *size* (cỡ), *card* (thẻ, tiếng Việt cũng nói "cạc").

Chỉ nghĩa là quen, còn cách đọc thì không. *Hotel* nhấn vào âm sau: ho-TEL. *Computer* nhấn vào âm giữa: com-PU-ter.

### Bạn giả
Một số từ nghe quen nhưng cách dùng khác:
- *photo* là tấm ảnh. "Đi phô-tô" trong tiếng Việt là *copy*: *I need a copy.*
- "Sếp" trong tiếng Việt là *boss*.
- *hot* tiếng Anh trước hết là nóng. Nghĩa "đang được yêu thích" chỉ dùng trong lời nói thân mật.

### Lỗi quen thuộc: I very like
*very* đứng trước tính từ, không đứng trước động từ:
- *I like it very much.* — Tôi rất thích nó.
- *It is very good.* — Nó rất tốt.

Đừng nói "I very like it".

### Tính từ đứng trước danh từ
Tiếng Việt nói "nhà to", tiếng Anh nói *a big house*. Sau *be* thì tính từ đứng một mình: *The house is big.* Tính từ không có số nhiều: *big houses*, không phải "bigs".

### Khi gặp từ lạ
Hãy nhìn những từ xung quanh rồi đoán. Câu vô nghĩa thì hãy tra từ điển trong ứng dụng.
""", [("TV", "📺"), ("hotel", "🏨"), ("menu", "📜"), ("internet", "🌐"), ("computer", "💻"), ("size", "📏"), ("card", "💳"), ("photo", "🖼️"), ("copy", "📠"), ("boss", "👔"), ("very", "🔥"), ("hot", "🌶️")],
     [("Từ quen tai", O("strategy.loanwords_false_friends", "vocab.everyday_basics")), ("Bạn giả", O("strategy.loanwords_false_friends")), ("I very like: sửa lỗi quen", O("adjectives.order_very")), ("Tính từ trước danh từ", O("adjectives.order_very"))])

unit(2, "unit-d", "ud", "Số, giờ, ngày và giá", "Đếm đến 100, nói giờ, ngày tháng và giá tiền.", """
## Số đếm

### 1 đến 20
*one, two, three, four, five, six, seven, eight, nine, ten, eleven, twelve*. Từ 13 đến 19 có đuôi *-teen*: *thirteen, fourteen*.

### Hàng chục
*twenty, thirty, forty, fifty*: đuôi *-ty*. Số ghép có dấu gạch nối: *twenty-one*.

### -teen hay -ty?
Đây là chỗ dễ nghe nhầm nhất:
- *thir-TEEN* (13): nhấn ở cuối
- *THIR-ty* (30): nhấn ở đầu

### Giờ
- *It's eight o'clock.* — Tám giờ.
- *half past eight* — tám giờ rưỡi
- *quarter past eight* — tám giờ mười lăm
- *quarter to nine* — chín giờ kém mười lăm

### Ngày và giá
- *on Monday* — vào thứ Hai; thứ và tháng luôn viết hoa
- Người Mỹ viết tháng trước ngày: *5/12* là ngày 12 tháng 5. Hãy đọc kỹ!
- *$10* đọc là *ten dollars*. Dấu đô la đứng trước số khi viết, nhưng từ *dollars* đứng sau số khi đọc.
- *How much is it?* — Giá bao nhiêu?
""", [("one", "🥇"), ("two", "2️⃣"), ("three", "3️⃣"), ("thirteen", "🔢"), ("thirty", "🎯"), ("hundred", "💯"), ("o'clock", "🕗"), ("half", "🌗"), ("quarter", "🕒"), ("Monday", "📅"), ("date", "🗓️"), ("dollar", "💲")],
     [("Đếm đến 20", O("numbers.0_100")), ("Hàng chục: -teen và -ty", O("numbers.0_100", "writing.familiar_words")), ("Giờ: half past, quarter to", O("vocab.time_calendar", "prepositions.time_place")), ("Ngày tháng và giá", O("vocab.time_calendar", "numbers.0_100", "prepositions.time_place"))])

unit(2, "unit-e", "ue", "Âm và chữ viết", "Âm cuối, cụm phụ âm, âm th, trọng âm và chính tả.", """
## Những âm người Việt hay vấp

### Âm cuối
Tiếng Việt có âm cuối nhưng không bật hơi, và không có các âm cuối như s, z, sh, j hay âm cuối của *watch*. Vì vậy *bag* dễ nghe thành *back*, *watch* mất đuôi. Tiếng Anh dựa vào âm cuối để phân biệt từ, nên hãy đọc rõ nó.

### Âm th
- *think*: lưỡi giữa hai hàm răng, thổi hơi, không rung cổ
- *this*: cùng vị trí lưỡi, có rung cổ

Đừng thay bằng "t", "d" hay "s".

### Nguyên âm ngắn và dài
*sit* ngắn, *seat* dài và căng hơn. *bad* mở miệng rộng hơn *bed*.

### -s và -ed
- *works* đọc âm s, *lives* âm z, *washes* thêm một âm tiết
- *worked* đọc âm t, *lived* âm d, *wanted* thêm một âm tiết

### Trọng âm
Tiếng Việt có thanh điệu trên mỗi tiếng. Tiếng Anh nhấn mạnh một âm tiết trong từ và đọc lướt các âm tiết khác: *WA-ter*, *ho-TEL*.

### Chính tả
Chữ viết không theo âm như tiếng Việt: *station* và *information* có đuôi *-tion*; *enough* viết *-ough* nhưng kết thúc bằng âm f. Hãy học mỗi từ cùng âm thanh của nó.
""", [("think", "🤔"), ("this", "👇"), ("sit", "🪑"), ("seat", "💺"), ("bad", "👎"), ("bed", "🛏️"), ("watch", "⌚"), ("bag", "👜"), ("information", "ℹ️"), ("enough", "🈵")],
     [("Âm cuối và cụm phụ âm", O("pronunciation.final_sounds")), ("Âm th và nguyên âm", O("pronunciation.final_sounds")), ("-s và -ed: ba cách đọc", O("pronunciation.final_sounds", "verbs.present_simple_do")), ("Trọng âm và chính tả", O("pronunciation.final_sounds", "writing.familiar_words"))])

# ---------------------------------------------------------------- Section 3
unit(3, "unit-f", "uf", "Nghe nào!", "Nghe từ và cụm từ quen thuộc được đọc rõ, chậm.", """
## Tập nghe

Trong phần này bạn tập **nghe hiểu**. Mỗi đoạn được đọc rõ và chậm. Khi làm bài có chấm điểm, bạn được nghe tối đa hai lần.

### Mẹo nghe
- Đừng dịch từng từ. Hãy bắt từ chính: tên người, nơi chốn, con số.
- Đọc câu hỏi trước khi nghe để biết cần tìm gì.
- Tiếng Anh đọc lướt nhiều từ nhỏ như *to*, *of*, *a*. Không nghe rõ chúng cũng không sao.

### Nghe gì trong câu
Từ được nhấn mạnh thường là từ quan trọng: *I WORK in a FACTORY.* Bạn chỉ cần nghe rõ *work* và *factory* là hiểu ý chính.

### Khi chưa nghe được
- *Sorry, I don't understand.* — Xin lỗi, tôi không hiểu.
- *Can you repeat that, please?* — Bạn nhắc lại được không?
- *Please speak slowly.* — Xin nói chậm thôi.

### Phân biệt listen và hear
*listen* là chủ động lắng nghe: *Listen to me.* *hear* là nghe thấy: *I can hear you.*
""", [("listen", "👂"), ("hear", "🦻"), ("repeat", "🔁"), ("understand", "💡"), ("slow", "🐢"), ("word", "🔤")],
     [("Từ và cụm từ", O("listening.familiar_words", "vocab.everyday_basics")), ("Người và đồ vật", O("listening.familiar_words", "reading.familiar_words")), ("Câu ngắn", O("listening.familiar_words")), ("Ôn: nghe và đọc", O("listening.familiar_words", "reading.familiar_words"))])

unit(3, "unit-g", "ug", "Tin nhắn và biển báo", "Đọc tin nhắn, biển báo, giờ mở cửa và nội quy nơi làm việc.", """
## Đọc để lấy thông tin

Bạn không cần hiểu mọi từ. Hãy tìm đúng thông tin bạn cần.

### Biển báo hay gặp
- *open* — mở cửa; *closed* — đóng cửa
- *entrance* — lối vào; *exit* — lối ra
- *no smoking* — cấm hút thuốc
- *dangerous* — nguy hiểm

### Giờ mở cửa
*Open: Monday to Friday, 9 to 5.* Câu này nghĩa là mở cửa từ thứ Hai đến thứ Sáu, từ 9 giờ đến 5 giờ. Biển báo ở Mỹ thường dùng *AM* (sáng) và *PM* (chiều, tối).

### Nội quy nơi làm việc
- *Wear a helmet.* — Đội mũ bảo hộ.
- *Do not touch.* — Không chạm vào.
- *Wash your hands.* — Rửa tay.

Câu mệnh lệnh bắt đầu thẳng bằng động từ, không cần chủ ngữ. *Do not* ở đầu câu nghĩa là cấm.

### Tin nhắn ngắn
Tin nhắn thường có lời chào, một thông tin và lời kết:
*Hi Lan. The meeting is at 3. See you, Tom.*

### Mẹo đọc
Giờ, ngày và số thường là thông tin chính. Hãy tìm chúng trước.
""", [("message", "📩"), ("open", "🔓"), ("closed", "🔒"), ("entrance", "➡️"), ("exit", "⬅️"), ("smoke", "🚭"), ("dangerous", "⚠️")],
     [("Tin nhắn ngắn", O("reading.short_messages", "reading.familiar_words")), ("Biển báo", O("reading.notices_info")), ("Giờ mở cửa và lịch làm", O("reading.notices_info", "numbers.0_100")), ("Nội quy nơi làm việc", O("reading.notices_info", "reading.short_messages"))])

unit(3, "unit-h", "uh", "Thông báo và chỉ dẫn", "Thông báo ở nhà ga, sân bay và chỉ dẫn ở nhà máy, văn phòng.", """
## Nghe thông báo

### Ở nhà ga và sân bay
Thông báo thường có ba thông tin: **chuyến nào, giờ nào, ở đâu**.
- *flight* — chuyến bay
- *The train is late.* — Tàu đến muộn.
- *Please wait here.* — Xin chờ ở đây.

### Ở nhà máy và văn phòng
Chỉ dẫn thường là câu mệnh lệnh ngắn, bắt đầu bằng động từ:
- *Press the green button.* — Nhấn nút xanh.
- *Stop the machine.* — Dừng máy lại.
- *Put on your gloves.* — Đeo găng tay vào.
- *Don't touch this.* — Đừng chạm vào cái này.

Khi nghe chỉ dẫn, hãy nghe động từ đầu câu trước. Động từ cho biết bạn phải làm gì.

### In, on, at trong thông báo
- *at nine o'clock* — lúc chín giờ
- *on Monday* — vào thứ Hai
- *in the office* — trong văn phòng

### Khi không chắc
Đừng đoán khi làm việc với máy móc. Hãy hỏi lại:
- *Sorry, can you say that again?* — Xin lỗi, bạn nói lại được không?

### Mẹo nghe
Con số thường là thông tin chính. Hãy chuẩn bị nghe số ngay khi nghe *at*.
""", [("flight", "✈️"), ("late", "⏰"), ("wait", "⏳"), ("instruction", "📋"), ("machine", "⚙️"), ("press", "🔘"), ("stop", "🛑")],
     [("Ở nhà ga và sân bay", O("listening.announcements", "listening.short_info")), ("Trong cửa hàng", O("listening.announcements")), ("Chỉ dẫn ở nhà máy và văn phòng", O("listening.announcements", "listening.familiar_words")), ("Ôn: giờ và số", O("listening.short_info", "numbers.0_100"))])

unit(3, "unit-i", "ui", "Hội thoại ngắn", "Nghe và hiểu những cuộc trò chuyện rất ngắn giữa hai người.", """
## Hai người trò chuyện

Hai giọng khác nhau nói vài câu. Bạn cần hiểu **họ nói về chuyện gì** và **thông tin chính**.

### Câu mở đầu hay gặp
- *How are you?* — Bạn khỏe không?
- *Fine, thanks. And you?* — Khỏe, cảm ơn. Còn bạn?
- *Nice to meet you.* — Rất vui được gặp bạn.

*How are you?* là lời chào hơn là câu hỏi về sức khỏe. Câu trả lời thường rất ngắn.

### Câu hỏi có từ để hỏi
Tiếng Việt để từ để hỏi ở chỗ của thông tin: "Bạn sống ở đâu?". Tiếng Anh đưa nó lên đầu câu và thêm *do*, *does*:
- *Where do you live?* — *I live in Hanoi.*
- *What do you do?* — *I am a nurse.*
- *How much is it?* — *Two dollars.*

### Ngữ điệu
Câu hỏi yes/no thường lên giọng ở cuối: *Are you ready?* Câu hỏi có từ để hỏi thường xuống giọng: *Where do you live?*

### Câu nhỏ hữu ích
- *Of course.* — Tất nhiên.
- *You're welcome.* — Không có gì.
- *Hold on.* — Chờ một chút.
- *See you.* — Hẹn gặp lại.
""", [("how are you", "🙂"), ("nice to meet you", "🤝"), ("of course", "👍"), ("you're welcome", "😌"), ("hold on", "✋"), ("see you", "👀")],
     [("Làm quen", O("listening.short_dialogues", "greetings.basic")), ("Hỏi và đáp", O("listening.short_dialogues", "syntax.questions_word_order")), ("Ở chỗ làm", O("listening.short_dialogues", "listening.short_info")), ("Ôn: nghe ý chính", O("listening.short_dialogues", "reading.short_messages"))])

unit(3, "unit-j", "uj", "Câu chuyện nhỏ", "Đọc và nghe những câu chuyện nhỏ về một ngày đi làm.", """
## Câu chuyện nhỏ

Bây giờ bạn đọc những đoạn văn hai đến năm câu về một người và một ngày của họ.

### Cách đọc
1. Đọc lướt một lần để biết nói về ai.
2. Đọc câu hỏi.
3. Đọc lại và tìm câu trả lời trong đoạn.

### Từ chỉ thời gian giúp theo dõi câu chuyện
- *morning* — buổi sáng; *afternoon* — buổi chiều; *evening* — buổi tối
- *in the morning*, *in the afternoon*, nhưng *at night*
- *then* — sau đó; *every day* — mỗi ngày

### Từ chỉ thói quen
*always* (luôn luôn), *usually* (thường), *sometimes* (thỉnh thoảng), *never* (không bao giờ). Chúng đứng trước động từ, nhưng đứng sau *be*:
- *Nam usually gets up early.*
- *Lan is always late.*

### Nhìn đuôi động từ
- *Nam works in a factory.* — Việc thường ngày.
- *Nam is working now.* — Việc đang diễn ra.
- *Nam worked yesterday.* — Việc đã xong.

Trong tiếng Việt cả ba có thể chỉ khác nhau ở "đang", "đã". Trong tiếng Anh, hãy nhìn động từ.

### Đừng dừng lại
Gặp từ lạ, hãy đọc tiếp đã. Thường bạn vẫn trả lời được.
""", [("morning", "🌄"), ("afternoon", "🌇"), ("evening", "🌃"), ("then", "⏭️"), ("every", "🔄"), ("usually", "📆"), ("always", "♾️")],
     [("Một ngày của tôi", O("reading.short_texts", "listening.short_info")), ("Gia đình của Nam", O("reading.short_texts", "reading.familiar_words")), ("Hôm qua", O("reading.short_texts", "verbs.past_recognition")), ("Ôn: đọc hiểu", O("reading.short_texts", "reading.notices_info"))])

# ---------------------------------------------------------------- Section 4
unit(4, "unit-k", "uk", "Chào thành tiếng", "Nói thành tiếng lời chào, lời cảm ơn và lời xin lỗi.", """
## Nói thành tiếng

Từ phần này bạn **nói** vào micro. Ứng dụng chỉ kiểm tra máy nghe được từ nào; đây không phải điểm phát âm. Âm thanh không được lưu lại.

### Mẹo nói
- Nói cả câu, không cần nhanh.
- Nhấn đúng âm tiết: *thank YOU*, *ex-CUSE me*.
- Đọc đủ âm cuối: *thanks* kết thúc bằng âm s, *good* kết thúc bằng âm d.
- Nếu máy không nghe được, cứ thử lại. Trục trặc kỹ thuật không bị tính là sai.

### Chọn lời chào
- Sáng: *Good morning.*
- Chiều: *Good afternoon.*
- Tối, khi gặp: *Good evening.*
- Với bạn bè: *Hi!*

### Lịch sự
- *Could you help me, please?* — Bạn giúp tôi được không?
- *Thanks!* — Cảm ơn, dùng khi thân mật.
- *You're welcome.* — Không có gì.
- *Welcome!* — Chào mừng bạn đến.

### Nói sorry hay excuse me?
*Excuse me* trước khi làm phiền: hỏi đường, đi qua. *Sorry* sau khi đã làm phiền: đến muộn, va vào ai đó.
""", [("good afternoon", "🌤️"), ("good evening", "🌆"), ("thanks", "🙇"), ("welcome", "🎉")],
     [("Chào hỏi", O("speaking.formulaic")), ("Cảm ơn và xin lỗi", O("speaking.formulaic")), ("Theo tình huống", O("speaking.formulaic", "greetings.basic")), ("Ôn: nói", O("speaking.formulaic"))])

unit(4, "unit-l", "ul", "Giới thiệu bản thân", "Nói về mình từng câu ngắn: tên, quê, việc làm, sở thích.", """
## Giới thiệu bản thân

### Mẫu câu
- *My name is Lan.* — Tên tôi là Lan.
- *I am from Vietnam.* — Tôi đến từ Việt Nam.
- *I am Vietnamese.* — Tôi là người Việt.
- *I live in Da Nang.* — Tôi sống ở Đà Nẵng.
- *I am twenty-five.* — Tôi hai mươi lăm tuổi.
- *I like music.* — Tôi thích âm nhạc.

### Nói tuổi bằng be
Tiếng Việt nói "tôi có hai mươi lăm tuổi" nghe vẫn được, nhưng tiếng Anh không dùng *have* cho tuổi: *I am twenty-five*, không phải "I have twenty-five".

### Giới thiệu ở chỗ làm
- *Hello, I'm Lan. I'm new here.* — Chào mọi người, tôi là Lan. Tôi mới đến.
- *I work in the office.* — Tôi làm ở văn phòng.
- *I am a nurse.* — Tôi là y tá. Nhớ có *a* trước tên nghề.
- *This is my colleague, Tom.* — Đây là đồng nghiệp của tôi, Tom.

### Từ nối: from
*from* đi với nơi xuất phát: *from Vietnam*, *from Hanoi*. Đừng nói "I come Vietnam".

### Hỏi lại
*And you?* — Còn bạn? Câu này dùng được với mọi người.

### Tên của bạn
Người nói tiếng Anh gọi tên riêng ở chỗ làm: *Lan*, không gọi "chị Lan". Nếu bạn dùng tên tiếng Việt, hãy đọc chậm cho người nghe.
""", [("from", "📍"), ("job", "🧑‍💻"), ("company", "🏢"), ("colleague", "🧑‍💼"), ("country", "🌏")],
     [("Tên và quê", O("speaking.self_intro")), ("Nơi sống và tuổi", O("speaking.self_intro")), ("Công việc và sở thích", O("speaking.self_intro")), ("Ôn: giới thiệu ở chỗ làm", O("speaking.self_intro", "speaking.formulaic"))])

unit(4, "unit-m", "um", "Nói số", "Nói số điện thoại, giá tiền, giờ giấc và số lượng.", """
## Nói số

Trong phần này, chữ số và chữ viết được tính như nhau: "8" và *eight* đều đúng khi bạn nói.

### Số điện thoại
Người nói tiếng Anh đọc từng chữ số. Số 0 có thể đọc là *zero* hoặc "oh":
- *zero nine one, two three four…*

### Giá tiền
- *It costs ten dollars.* — Giá mười đô la.
- *three fifty* hoặc *three dollars and fifty cents* — ba đô la năm mươi xu
- *How much is this?* — Cái này bao nhiêu tiền?

### Giờ
- *It's eight o'clock.* — Tám giờ.
- *It's half past eight.* — Tám giờ rưỡi.
- *It's quarter to nine.* — Chín giờ kém mười lăm.
- *I start at seven.* — Tôi bắt đầu lúc bảy giờ.

### Số lượng
- *How many children do you have?* — Bạn có mấy con?
- *How much money do you need?* — Bạn cần bao nhiêu tiền?

*How many* đi với danh từ đếm được. *How much* đi với danh từ không đếm được và với giá.

### Nhấn đúng chỗ
*thir-TEEN* và *THIR-ty* chỉ khác nhau ở trọng âm và đuôi. Hãy nhấn rõ để người nghe không nhầm.
""", [("number", "☎️"), ("how much", "💰"), ("how many", "🧮"), ("cost", "🪙")],
     [("Số đếm", O("speaking.give_info", "numbers.0_100")), ("Giá tiền", O("speaking.give_info")), ("Giờ giấc", O("speaking.give_info", "vocab.time_calendar")), ("Ôn: nói thông tin", O("speaking.give_info"))])

unit(4, "unit-n", "un", "Mô tả", "Mô tả người, nơi chốn, đồ vật bằng cụm từ ngắn.", """
## Mô tả

### Tính từ đứng trước danh từ
Ngược với tiếng Việt:
- "cái túi đỏ" → *a red bag*
- "nhà to" → *a big house*
- "xe mới" → *a new car*

### Sau be
- *The house is big.* — Ngôi nhà to.
- *It is new.* — Nó mới.

Tiếng Anh cần *is*: đừng nói "the house big".

### Tính từ không đổi
Tính từ không có số nhiều, không có giống: *a big house*, *big houses*.

### Từ dùng nhiều
*big, small, new, old, long, short, tall, good, bad*. Màu sắc: *red, blue, green, black, white*. Từ hỏi màu là *What color is it?*

### Có gì ở đó
Dùng *there is* cho một thứ và *there are* cho nhiều thứ:
- *There is a table in the room.* — Trong phòng có một cái bàn.
- *There are two beds.* — Có hai cái giường.

Tiếng Việt dùng một từ "có" cho hai ý này, còn tiếng Anh tách ra: *I have a car* là tôi có xe, còn *There is a car* là ở đó có xe.

### Very và too
- *It is very big.* — Nó rất to.
- *It is too big.* — Nó to quá, không vừa.

*too* mang ý không ổn. Đừng dùng *too* để khen.
""", [("big", "🐘"), ("small", "🐜"), ("new", "🆕"), ("old", "🕰️"), ("color", "🎨")],
     [("Người", O("speaking.describe", "adjectives.order_very")), ("Đồ vật", O("speaking.describe", "vocab.everyday_basics")), ("Nơi chốn", O("speaking.describe", "verbs.be_there_is")), ("Ôn: mô tả", O("speaking.describe", "speaking.self_intro"))])

# ---------------------------------------------------------------- Section 5
unit(5, "unit-o", "uo", "Viết về bạn", "Viết tên, tuổi, quê quán và nơi ở của bạn.", """
## Viết về bản thân

Bài viết được chấm tự động theo tiêu chí: có đủ thông tin được yêu cầu, đủ độ dài, từ có nghĩa. Bạn không cần viết hoa mỹ.

### Mẫu
*My name is Hoa. I am twenty-two. I am from Hue. I live in Hanoi with my sister.*

### Thông tin hay cần
- *first name* — tên; *last name* — họ
- *age* — tuổi
- *address* — địa chỉ
- *phone number* — số điện thoại

### Họ và tên
Tiếng Việt viết họ trước, tiếng Anh viết tên trước. Nguyễn Thị Hoa có *first name* là Hoa và *last name* là Nguyen. Khi điền giấy tờ, hãy đọc kỹ từng ô.

### Viết hoa
Tiếng Anh viết hoa nhiều hơn tiếng Việt:
- *I* luôn viết hoa
- Tên người, tên nơi: *Hoa, Hanoi, Vietnam*
- Thứ và tháng: *Monday, May*
- Tên tiếng và quốc tịch: *English, Vietnamese*

### Chính tả và dấu
Tiếng Anh không có dấu thanh. Trên giấy tờ quốc tế, Nguyễn thường được viết là Nguyen.

### Dấu câu
Mỗi câu kết thúc bằng dấu chấm. Dấu phẩy và dấu chấm viết sát từ trước đó.
""", [("last name", "🪪"), ("address", "🗺️"), ("age", "🎂"), ("phone number", "📱")],
     [("Tên và tuổi", O("writing.personal_info")), ("Quê và nơi ở", O("writing.personal_info")), ("Gia đình và công việc", O("writing.personal_info", "writing.phrases_sentences")), ("Ôn: viết về mình", O("writing.personal_info"))])

unit(5, "unit-p", "up", "Câu đơn giản", "Viết những câu ngắn: ai làm gì, ở đâu, thích gì.", """
## Viết câu đơn giản

### Trật tự câu
Giống tiếng Việt: chủ ngữ, động từ, phần còn lại: *Nam eats rice.*

Khác tiếng Việt, tiếng Anh gần như luôn cần chủ ngữ. Tiếng Việt nói được "Đi làm rồi", còn tiếng Anh cần *He went to work.*

### Nhớ thêm -s
*I work*, nhưng *she works*, *Nam works*. Đây là lỗi hay gặp nhất khi viết. Viết xong, hãy kiểm tra lại từng động từ sau *he*, *she* hoặc tên một người.

### Phủ định
Dùng *don't* hoặc *doesn't* trước động từ:
- *I don't eat meat.*
- *She doesn't smoke.*

Đừng viết "I no eat" hay "She not smoke".

### Mẫu "thích"
- *I like coffee.* — Tôi thích cà phê.
- *I like it very much.* — Tôi rất thích nó.
- *I like cats.* — Tôi thích mèo: số nhiều khi nói chung về một loài.

### Nối câu
- *and* — và: *I read and write.*
- *but* — nhưng: *I live in Hanoi, but I work in Bac Ninh.*
- *because* — vì: *I study English because I need it for work.*

Tiếng Việt nói "vì… nên…"; tiếng Anh dùng một từ thôi: đừng viết "because… so…".

### Chấm câu
Câu hỏi kết thúc bằng dấu hỏi: *Where do you live?*
""", [("and", "➕"), ("but", "⚖️"), ("because", "🧐")],
     [("Ai làm gì?", O("writing.phrases_sentences")), ("Phủ định và câu hỏi", O("writing.phrases_sentences", "syntax.questions_word_order")), ("Tôi thích", O("writing.phrases_sentences", "verbs.present_simple_do")), ("Ôn: viết câu", O("writing.phrases_sentences"))])

unit(5, "unit-q", "uq", "Tin nhắn và email", "Viết tin nhắn và email ngắn: lời chào, thông tin, lời kết.", """
## Viết tin nhắn và email

Một tin nhắn cần ba phần: **lời chào, thông tin, lời kết**.

### Tin nhắn cho bạn bè hoặc đồng nghiệp
*Hi Tom. I am at the station. See you at 8. Lan*

### Email ở chỗ làm
*Dear Mr Smith,*
*I am sorry, I can't come to work today. I am sick.*
*Best regards,*
*Lan Nguyen*

### Mở đầu và kết thúc
| | Bắt đầu | Kết thúc |
|---|---|---|
| thân mật | *Hi Tom,* | *See you,* |
| lịch sự | *Dear Ms Brown,* | *Best regards,* |

### Mr, Mrs, Ms
Sau *Mr*, *Mrs*, *Ms* là **họ**, không phải tên. Ông Tom Smith là *Mr Smith*, không phải "Mr Tom". Khác với tiếng Việt, nơi "ông Nam" gọi bằng tên.

### Hỏi và hẹn
- *Are you free on Saturday?* — Thứ Bảy bạn rảnh không?
- *Can you send me the file?* — Bạn gửi cho tôi tệp đó được không?
- *See you at 9.* — Hẹn gặp lúc 9 giờ.

### Từ dùng cho email
*send* (gửi), *reply* (trả lời), *email*, *message*, *file*. Dòng đầu email có *Subject*: một cụm từ ngắn nói về nội dung thư.
""", [("dear", "💌"), ("best regards", "🖋️"), ("email", "📧"), ("send", "📤")],
     [("Tin nhắn cho bạn", O("writing.short_message")), ("Hẹn gặp", O("writing.short_message", "vocab.time_calendar")), ("Email ở chỗ làm", O("writing.short_message", "reading.short_messages")), ("Ôn: tin nhắn và email", O("writing.short_message"))])

unit(5, "unit-r", "ur", "Biểu mẫu", "Điền biểu mẫu xin việc, giấy tờ và lời nhắn thực tế.", """
## Biểu mẫu

Khi xin việc, thuê nhà hay đi khám, bạn thường phải điền biểu mẫu.

### Các ô thường gặp
- *First name* — tên; *Last name* — họ
- *Date of birth* — ngày sinh
- *Address* — địa chỉ
- *Phone number* — số điện thoại
- *Email* — thư điện tử
- *Passport number* — số hộ chiếu
- *Job* — nghề nghiệp
- *Signature* — chữ ký

### Lưu ý
Ngày tháng dễ nhầm: nhiều biểu mẫu Mỹ viết tháng, ngày, năm: *05/12/1998* là ngày 12 tháng 5. Hãy nhìn gợi ý trên ô, ví dụ *MM/DD/YYYY*.

### Ký tên
*Sign here.* — Ký vào đây. *sign* cũng có nghĩa là biển báo, nên hãy nhìn câu xung quanh.

### Giấy tờ
*document* là giấy tờ nói chung. *passport* là hộ chiếu. *form* là biểu mẫu.
- *Please fill in this form.* — Xin điền vào biểu mẫu này.

### Viết lời nhắn
*I am at the clinic. I will be back at 3. Lan*
Câu này báo rằng Lan đang ở phòng khám và sẽ về lúc 3 giờ.

### Khi không hiểu một ô
Hãy hỏi: *Excuse me, what does this mean?* — Xin lỗi, cái này nghĩa là gì?
""", [("form", "📝"), ("sign", "✍️"), ("passport", "🛂"), ("document", "📑")],
     [("Điền biểu mẫu", O("writing.form_filling", "writing.personal_info")), ("Biểu mẫu xin việc", O("writing.form_filling")), ("Viết lời nhắn", O("writing.phrases_sentences", "writing.form_filling")), ("Ôn: viết", O("writing.form_filling", "writing.short_message"))])

# ---------------------------------------------------------------- Section 6
unit(6, "unit-s", "us", "Làm quen và phỏng vấn", "Giới thiệu mình ở chỗ làm và trả lời câu hỏi phỏng vấn đơn giản.", """
## Trò chuyện

Bây giờ bạn trò chuyện với ứng dụng. Câu trả lời của bạn quyết định câu tiếp theo. Người đối thoại rất kiên nhẫn: nhắc lại, nói cách khác, không bao giờ phạt bạn khi cần giúp.

### Giữ cuộc trò chuyện
- *Can you repeat that, please?* — Bạn nhắc lại được không?
- *Sorry, I don't understand.* — Xin lỗi, tôi không hiểu.
- *What does that mean?* — Câu đó nghĩa là gì?

### Ngày đầu ở chỗ làm
- *Hi, I'm Lan. I'm the new nurse.* — Chào anh chị, tôi là Lan, y tá mới.
- *Nice to meet you.* — Rất vui được gặp bạn.
- *Who is the manager?* — Ai là quản lý?

### Phỏng vấn xin việc
Câu hỏi thường rất đơn giản:
- *Tell me about yourself.* — Hãy nói về bạn.
- *Do you have experience?* — Bạn có kinh nghiệm không?
- *Yes, I worked in a factory for two years.* — Có, tôi làm ở nhà máy hai năm.
- *When can you start?* — Khi nào bạn bắt đầu được?
- *I can start on Monday.* — Tôi bắt đầu từ thứ Hai được.

### Xưng hô với người phỏng vấn
Chào bằng *Good morning* hoặc *Good afternoon*. Nếu người ta tự giới thiệu là *Mr Brown*, hãy gọi là *Mr Brown*. Nếu họ nói *Call me Tom*, hãy gọi là *Tom*.
""", [("introduce", "🤗"), ("manager", "🧑‍🏭"), ("interview", "🎙️"), ("experience", "🏅")],
     [("Làm quen", O("interaction.everyday_conversation")), ("Hội thoại: giới thiệu ở chỗ làm", O("interaction.everyday_conversation")), ("Những câu hỏi khi phỏng vấn", O("interaction.everyday_conversation", "syntax.questions_word_order")), ("Hội thoại: phỏng vấn xin việc", O("interaction.everyday_conversation"))])

unit(6, "unit-t", "ut", "Ở cửa hàng", "Mua hàng, hỏi giá, trả tiền và gọi món.", """
## Ở cửa hàng

### Hỏi và chọn
- *Can I help you?* — Tôi giúp gì được cho bạn?
- *I'm looking for a jacket.* — Tôi đang tìm một cái áo khoác.
- *How much is this?* — Cái này bao nhiêu tiền?
- *Do you have a small size?* — Bạn có cỡ nhỏ không?

### Gọi lịch sự
*I would like* lịch sự hơn *I want*. Viết tắt khi nói: *I'd like*.
- *I'd like this one, please.* — Cho tôi cái này.
- *I'd like a coffee, please.* — Cho tôi một ly cà phê.

### Trả tiền
- *Cash or card?* — Tiền mặt hay thẻ?
- *Here you are.* — Đây ạ.
- *Can I have a receipt, please?* — Cho tôi xin hóa đơn được không?

### Đếm được hay không?
- *How many apples?* — Mấy quả táo?
- *How much rice?* — Bao nhiêu gạo?
- *some water*, *a bottle of water*: muốn đếm nước, hãy đếm cái chai.

### Lịch sự với người bán
Người bán thường hỏi trước, và bạn trả lời ngắn cũng được. Hãy kết thúc bằng *Thank you* hoặc *Have a nice day*. Tiếng Việt có thể chỉ cười rồi đi, nhưng tiếng Anh cần một lời.
""", [("shop", "🏪"), ("cash", "💴"), ("receipt", "🧾"), ("pay", "🤑")],
     [("Hỏi giá và trả tiền", O("interaction.practical_needs", "verbs.future_can_would")), ("Hội thoại: ở cửa hàng", O("interaction.practical_needs")), ("Ở quán ăn", O("interaction.practical_needs")), ("Hội thoại: gọi món", O("interaction.practical_needs"))])

unit(6, "unit-u", "uu", "Hỏi đường và đi khám", "Hỏi đường trên phố, nói triệu chứng ở phòng khám.", """
## Hỏi đường

### Hỏi
- *Excuse me, where is the bank?* — Xin lỗi, ngân hàng ở đâu?
- *Is it far?* — Có xa không?

### Trả lời
- *Go straight.* — Đi thẳng.
- *Turn left.* — Rẽ trái. *Turn right.* — Rẽ phải.
- *It's next to the hotel.* — Nó ở cạnh khách sạn.
- *It's behind the school.* — Nó ở phía sau trường học.
- *It's on the left.* — Nó ở bên trái.

## Đi khám

### Nói triệu chứng
Tiếng Việt nói "tôi đau đầu"; tiếng Anh dùng *have*:
- *I have a headache.* — Tôi bị đau đầu.
- *I have a fever.* — Tôi bị sốt.
- *My arm hurts.* — Tay tôi đau.

### Ở phòng khám
- *I'd like to see a doctor.* — Tôi muốn gặp bác sĩ.
- *Do you have an appointment?* — Bạn có hẹn trước không?
- *Take this medicine twice a day.* — Uống thuốc này hai lần một ngày.

### Nghe kỹ con số
Liều thuốc rất quan trọng. Khi không chắc, hãy hỏi lại: *How many times a day?* — Mấy lần một ngày?
""", [("left", "👈"), ("right", "👉"), ("straight", "⬆️"), ("clinic", "🏥"), ("doctor", "🩺"), ("headache", "🤕")],
     [("Đường đi", O("interaction.practical_needs", "prepositions.time_place")), ("Hội thoại: hỏi đường", O("interaction.practical_needs")), ("Ở phòng khám", O("interaction.practical_needs", "listening.short_info")), ("Hội thoại: đi khám", O("interaction.practical_needs"))])

unit(6, "unit-v", "uv", "Điện thoại và chỉ dẫn ở chỗ làm", "Gọi điện, đặt hẹn, hỏi về email, làm theo chỉ dẫn của quản lý.", """
## Gọi điện

### Bắt đầu cuộc gọi
- *Hello, this is Lan.* — Xin chào, tôi là Lan. Trên điện thoại, người ta dùng *this is*, không dùng *I am*.
- *Can I speak to Mr Brown, please?* — Cho tôi nói chuyện với ông Brown được không?
- *Hold on, please.* — Xin chờ một chút.

### Đặt hẹn
- *I'd like to make an appointment.* — Tôi muốn đặt một cuộc hẹn.
- *When can you come?* — Khi nào bạn đến được?
- *On Friday at ten.* — Thứ Sáu lúc mười giờ.

### Xin nghỉ
*I'm sorry, I can't come to work today. I'm sick.* — Xin lỗi, hôm nay tôi không đi làm được. Tôi bị ốm.

### Email
- *Did you get my email?* — Bạn đã nhận được email của tôi chưa?
- *I'll send it now.* — Tôi sẽ gửi ngay.

## Ở chỗ làm

### Lịch làm việc
- *shift* — ca làm việc; *meeting* — cuộc họp
- *My shift starts at six.* — Ca của tôi bắt đầu lúc sáu giờ.

### Làm theo chỉ dẫn
Quản lý thường nói bằng câu mệnh lệnh: *Check the machine. Put the boxes here.* Hãy nhắc lại để chắc chắn: *Okay, the boxes go here?* Hỏi lại là việc nên làm, không phải là không lịch sự.
""", [("call", "📞"), ("appointment", "📇"), ("meeting", "💬"), ("shift", "🏭")],
     [("Gọi điện thoại", O("interaction.practical_needs", "interaction.everyday_conversation")), ("Hội thoại: gọi điện đặt hẹn", O("interaction.practical_needs")), ("Hội thoại: hỏi về một email", O("interaction.everyday_conversation", "reading.short_messages")), ("Hội thoại: chỉ dẫn ở chỗ làm", O("interaction.practical_needs", "listening.announcements"))])

# ---------------------------------------------------------------- emit
problems = []
lines = []
seen = {}
emojis = {}
for u in UNITS:
    words = []
    for surface, emoji in u["words"]:
        if surface not in GLOSS:
            problems.append(f"{u['uid']}: {surface} is not a lexeme")
            continue
        if surface in LATER:
            problems.append(f"{u['uid']}: {surface} is an A2-1 word")
        if surface in seen:
            problems.append(f"{surface} in {seen[surface]} and {u['uid']}")
        seen[surface] = u["uid"]
        if emoji in emojis:
            problems.append(f"emoji {emoji} on {surface} and {emojis[emoji]}")
        emojis[emoji] = surface
        words.append({"target": surface, "native": GLOSS[surface], "emoji": emoji})
    rec = {
        "sectionId": f"{C}:section-{u['section']}",
        "id": f"{C}:{u['uid']}",
        "title": u["title"],
        "description": u["desc"],
        "guidebook": u["gb"],
        "words": words,
        "lessons": [{"id": f"{C}:{u['lkey']}-l{i}", "title": (t if t != "Bài 1" else f"Bài {i + 1}"), "objectives": objs} for i, (t, objs) in enumerate(u["lessons"])],
    }
    if u["uid"] in ("unit-1", "unit-a", "unit-f", "unit-k", "unit-o", "unit-s"):
        rec["sectionTitle"] = S[u["section"]]
    lines.append(json.dumps(rec, ensure_ascii=False))
    n = len(u["gb"])
    if not 600 <= n <= 2000:
        problems.append(f"{u['uid']}: guidebook {n} chars")
    if len(u["desc"]) > 90:
        problems.append(f"{u['uid']}: description {len(u['desc'])} chars")
    if len(u["lessons"]) != 4:
        problems.append(f"{u['uid']}: {len(u['lessons'])} lessons")
if problems:
    for p in problems:
        sys.stdout.buffer.write((p + "\n").encode("utf-8"))
    raise SystemExit(f"{len(problems)} problem(s)")

os.makedirs(f"{ROOT}/content/en/_drafts/units", exist_ok=True)
with open(f"{ROOT}/content/en/_drafts/units/OUTPUT.jsonl", "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(lines) + "\n")

# The ingest takes language names and flag from a sibling pack; English has none. Later runs keep the pack (and its lessons).
pack_path = f"{ROOT}/content/en/_drafts/pack.json"
if not os.path.exists(pack_path):
    with open(pack_path, "w", encoding="utf-8", newline="\n") as f:
        json.dump({"id": C, "version": 1, "targetLanguage": "English", "targetCode": "en", "nativeLanguage": "Vietnamese", "nativeCode": "vi", "flag": "🇺🇸", "sections": []}, f, ensure_ascii=False, indent=2)
        f.write("\n")
profile = f"{ROOT}/content/en/_drafts/staged/content/courses/{C}.profile.json"
os.makedirs(os.path.dirname(profile), exist_ok=True)
with open(profile, "w", encoding="utf-8", newline="\n") as f:
    json.dump({"role": "primary", "allowUnreviewed": True, "betaUntilReviewed": True}, f, indent=2)
    f.write("\n")
print(len(lines), "units,", sum(len(u["words"]) for u in UNITS), "words")

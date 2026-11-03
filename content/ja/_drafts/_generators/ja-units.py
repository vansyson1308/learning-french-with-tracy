"""Units of ja-vi: content/ja/_drafts/units/OUTPUT.jsonl and the staged course profile. The units ingest takes the pack
header (language names, flag) from the sibling ja-en pack.

Words are (surface, emoji); the Vietnamese gloss is copied from the lexicon. Only A1 lexemes may be taught here: the
words of core-a2.txt are band A2-1. Every other syllabus lexeme reaches a unit through TOPIC_UNITS in ja-lex.py.
Guidebooks show Japanese in kana and kanji, with the kana reading of a kanji word in brackets the first time; never
romaji (the kana primer comes before Section 1). usage: python -I ja-units.py <repo root>
"""
import json, os, sys

sys.stdout.reconfigure(encoding="utf-8")
ROOT = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
lex = json.load(open(f"{ROOT}/content/ja/lexicon/lexemes.json", encoding="utf-8"))["lexemes"]
GLOSS = {x["surface"]: x["glosses"]["vi"] for x in lex}
LATER = set()
for line in open(os.path.join(HERE, "core-a2.txt"), encoding="utf-8"):
    if line.strip() and not line.startswith("#"):
        LATER.add(line.split("|")[1])
C = "ja-vi"
S = {
    1: "Phần 1: Nhập môn",
    2: "Phần 2: Viên gạch nền",
    3: "Phần 3: Hiểu tiếng Nhật hằng ngày",
    4: "Phần 4: Nói những câu tiếng Nhật đầu tiên",
    5: "Phần 5: Viết tiếng Nhật hằng ngày",
    6: "Phần 6: Trò chuyện với ai đó",
}
O = lambda *xs: [f"ja.obj.{x}" for x in xs]
UNITS = []


def unit(section, uid, lkey, title, desc, guidebook, words, lessons):
    UNITS.append(dict(section=section, uid=uid, lkey=lkey, title=title, desc=desc, gb=guidebook.strip(), words=words, lessons=lessons))


# ---------------------------------------------------------------- Section 1: the first words (after the kana primer)
unit(1, "unit-1", "u0", "Lời chào đầu tiên", "Chào theo giờ, cảm ơn, xin lỗi: những câu bạn dùng ngay ngày đầu.", """
## Chào theo giờ trong ngày

Người Nhật đổi lời chào theo buổi:
- *おはようございます* — chào buổi sáng; ở nhiều chỗ làm theo ca, dùng cả khi vào ca chiều
- *こんにちは* — xin chào, từ trưa đến chiều
- *こんばんは* — chào buổi tối
- *おやすみなさい* — chúc ngủ ngon
- *さようなら* — tạm biệt; ở chỗ làm người ta ít dùng câu này

### Cảm ơn và xin lỗi
- *ありがとうございます* — cảm ơn (lịch sự)
- *すみません* — xin lỗi, và cũng là "xin phép, làm phiền" khi gọi ai đó
- *お願いします* — làm ơn, xin nhờ: *コーヒー、お願いします*

### Ở chỗ làm
- *失礼します*（しつれいします） — xin phép, khi vào hay ra khỏi phòng
- *お疲れさまです*（おつかれさまです） — câu chào đồng nghiệp trong ngày, nghĩa gần như "anh chị vất vả rồi"

### Vâng và không
*はい* là vâng, *いいえ* là không. Người Nhật hay nói *はい* chỉ để cho biết "tôi đang nghe", chưa chắc là đồng ý.

### Cúi chào
Tiếng Việt chào kèm lời gọi: chào anh, chào chị. Tiếng Nhật không cần đại từ, nhưng thường cúi người khi chào.
""", [("おはようございます", "🌅"), ("こんにちは", "👋"), ("こんばんは", "🌆"), ("おやすみなさい", "🌙"), ("さようなら", "🚶"), ("ありがとうございます", "🙏"), ("すみません", "🙇"), ("お願いします", "🤲"), ("はい", "✅"), ("いいえ", "❌"), ("失礼します", "🚪"), ("お疲れさまです", "💪")],
     [("Bài 1", O("greetings.basic", "reading.familiar_words"))] * 4)

unit(1, "unit-2", "u1", "Tôi là ai?", "Nói tên, nói bạn là người Việt Nam, nói bạn làm nghề gì.", """
## Câu đầu tiên về bạn

Câu tiếng Nhật đơn giản nhất có dạng *A は B です*: A là B.
- *わたしはナムです。* — Tôi là Nam.
- *わたしはベトナム人（じん）です。* — Tôi là người Việt Nam.
- *わたしは学生（がくせい）です。* — Tôi là sinh viên.

*は* ở đây là trợ từ chủ đề. Viết bằng chữ は nhưng đọc như わ.

### です ở cuối câu
*です* đứng ở cuối câu (chỉ *か*, *ね*, *よ* có thể theo sau) và làm câu lịch sự. Tiếng Việt đặt "là" ở giữa, tiếng Nhật đặt *です* ở cuối.

### Gọi tên người khác
Thêm *さん* sau họ hoặc tên người khác: *田中（たなか）さん*. Không bao giờ thêm *さん* sau tên của chính mình.

### Lần đầu gặp mặt
- *はじめまして。* — Rất vui được gặp.
- *ナムです。* — Tôi là Nam.
- *よろしくおねがいします。* — Rất mong được giúp đỡ.

Ba câu này là phần mở đầu của mọi buổi tự giới thiệu, kể cả buổi phỏng vấn.

### Nghề nghiệp
*会社員（かいしゃいん）* là nhân viên công ty, *先生（せんせい）* là thầy cô giáo. Tiếng Nhật không cần thêm "một" trước danh từ: *会社員です* là "tôi là nhân viên công ty".
""", [("わたし", "🙋"), ("名前", "🏷️"), ("さん", "🧑"), ("ベトナム", "🇻🇳"), ("日本", "🇯🇵"), ("ベトナム人", "🗣️"), ("学生", "🧑‍🎓"), ("会社員", "💼"), ("先生", "👩‍🏫"), ("です", "🟰"), ("はじめまして", "🤝"), ("よろしくおねがいします", "🙇‍♂️")],
     [("Bài 1", O("sentences.noun_desu", "vocab.everyday_basics"))] * 4)

unit(1, "unit-3", "u2", "Gia đình", "Bố mẹ, anh chị em, vợ chồng: hai cách gọi, cho mình và cho người.", """
## Gia đình tôi, gia đình bạn

Tiếng Nhật có hai bộ từ chỉ người trong gia đình: một bộ khi nói về gia đình mình với người ngoài, một bộ khi nói về gia đình người khác.

### Gia đình tôi
- *父（ちち）* — bố tôi; *母（はは）* — mẹ tôi
- *兄（あに）* — anh trai tôi; *姉（あね）* — chị gái tôi
- *弟（おとうと）* — em trai; *妹（いもうと）* — em gái
- *夫（おっと）* — chồng tôi; *妻（つま）* — vợ tôi

### Gia đình người khác
- *お父（とう）さん*, *お母（かあ）さん* — bố, mẹ của bạn
- *お兄（にい）さん*, *お姉（ねえ）さん* — anh, chị của bạn

Khi gọi bố mẹ mình trong nhà, người Nhật cũng dùng *お父さん*, *お母さん*.

### Anh hay em
Tiếng Việt có "em" cho cả em trai và em gái. Tiếng Nhật tách rõ: *弟* là em trai, *妹* là em gái.

### Nói gia đình có mấy người
- *家族（かぞく）は四人（よにん）です。* — Gia đình tôi có bốn người.
- *両親（りょうしん）はベトナムにいます。* — Bố mẹ tôi ở Việt Nam.
""", [("家族", "👪"), ("父", "👨"), ("母", "👩"), ("兄", "👦"), ("姉", "👧"), ("弟", "🧒"), ("妹", "🎀"), ("子供", "🧸"), ("夫", "🤵"), ("妻", "👰"), ("両親", "👫"), ("友達", "🧑‍🤝‍🧑")],
     [("Bài 1", O("vocab.everyday_basics", "reading.familiar_words"))] * 4)

unit(1, "unit-4", "u3", "Ăn và uống", "Cơm, bánh mì, trà, cà phê, và hai động từ ăn, uống.", """
## Món ăn đầu tiên

### Đồ ăn
- *ご飯（ごはん）* — cơm, cũng là "bữa ăn"
- *パン* — bánh mì
- *肉（にく）* — thịt; *魚（さかな）* — cá; *野菜（やさい）* — rau; *卵（たまご）* — trứng

### Đồ uống
- *水（みず）* — nước; *お茶（ちゃ）* — trà; *牛乳（ぎゅうにゅう）* — sữa
- *コーヒー* — cà phê: một từ mượn, viết bằng katakana

### Động từ ở cuối câu
Tiếng Việt nói "Tôi ăn bánh mì". Tiếng Nhật đặt động từ ở cuối và đánh dấu tân ngữ bằng *を*:
- *パンを食べます。* — (Tôi) ăn bánh mì.
- *水を飲みます。* — (Tôi) uống nước.

*を* đọc như お. Chủ ngữ "tôi" thường được bỏ khi người nghe đã hiểu.

### Trước và sau bữa ăn
Người Nhật nói *いただきます* trước khi ăn và *ごちそうさまでした* sau khi ăn, kể cả ở căng tin công ty.

### Từ mượn
*コーヒー*, *パン* là từ mượn. Người Việt nhận ra nhiều từ katakana gốc tiếng Anh nhờ cách đọc gần giống.
""", [("ご飯", "🍚"), ("パン", "🍞"), ("水", "💧"), ("お茶", "🍵"), ("コーヒー", "☕"), ("牛乳", "🥛"), ("肉", "🥩"), ("魚", "🐟"), ("野菜", "🥦"), ("卵", "🥚"), ("食べる", "🍽️"), ("飲む", "🥤")],
     [("Bài 1", O("vocab.everyday_basics", "particles.core"))] * 4)

unit(1, "unit-5", "u4", "Số và tiền", "Đếm từ một đến mười nghìn, hỏi giá và trả tiền bằng yên.", """
## Đếm bằng tiếng Nhật

### Một đến mười
*一* いち, *二* に, *三* さん, *四* よん, *五* ご, *六* ろく, *七* なな, *八* はち, *九* きゅう, *十* じゅう.

Số 4 và số 7 có hai cách đọc (よん/し, なな/しち). Ở chỗ làm và khi nói số điện thoại, người ta hay dùng よん và なな cho rõ.

### Số lớn
- *百（ひゃく）* — một trăm; *千（せん）* — một nghìn; *万（まん）* — mười nghìn
- Tiếng Việt đếm theo nghìn, tiếng Nhật đếm theo vạn: 20.000 là *二万（にまん）*, không phải "hai mươi nghìn".

### Tiền
*円（えん）* là đồng yên. Giá viết bằng số Ả Rập: *350円*.
- *いくらですか。* — Bao nhiêu tiền?
- *三百五十円です。* — Ba trăm năm mươi yên.

### Đếm đồ vật
*いくつ* hỏi số lượng: *いくつありますか* — có mấy cái? Đồ vật đếm bằng *一つ（ひとつ）*, *二つ（ふたつ）*... Tiếng Việt cũng có loại từ như "cái", "con"; tiếng Nhật có nhiều loại hơn, bạn sẽ học ở Phần 2.
""", [("一", "1️⃣"), ("二", "2️⃣"), ("三", "3️⃣"), ("四", "4️⃣"), ("五", "5️⃣"), ("十", "🔟"), ("百", "💯"), ("千", "🪙"), ("万", "💴"), ("円", "💰"), ("いくら", "💲"), ("いくつ", "🔢")],
     [("Bài 1", O("numbers.counters", "reading.familiar_words"))] * 4)

# ---------------------------------------------------------------- Section 2: building blocks
unit(2, "unit-a", "ua", "Câu danh từ và trợ từ", "AはBです, phủ định, câu hỏi với か, và trợ từ の, も.", """
## Câu danh từ đầy đủ

| Nghĩa | Tiếng Nhật |
|---|---|
| là | *学生です* |
| không phải là | *学生じゃありません* |
| đã là | *学生でした* |

### Câu hỏi
Thêm *か* vào cuối câu, không đổi trật tự từ:
- *田中さんは先生ですか。* — Anh Tanaka là giáo viên à?
- *はい、そうです。* / *いいえ、先生じゃありません。*

### Từ để hỏi đứng đúng chỗ của câu trả lời
- *これは何（なん）ですか。* — Cái này là gì?
- *トイレはどこですか。* — Nhà vệ sinh ở đâu?

### の: của
*わたしの名前* — tên của tôi. Tiếng Việt đặt "của tôi" sau, tiếng Nhật đặt *わたしの* trước danh từ. *会社の人（ひと）* là người của công ty.

### も: cũng
*わたしもベトナム人です。* — Tôi cũng là người Việt Nam. *も* thay cho *は*, không đứng cạnh nó.

### これ, それ, あれ
*これ* ở gần người nói, *それ* ở gần người nghe, *あれ* ở xa cả hai. Trước danh từ thì dùng *この*, *その*, *あの*: *この本（ほん）*.
""", [("これ", "👉"), ("それ", "👈"), ("あれ", "☝️"), ("この", "📌"), ("どこ", "🗺️"), ("何", "❔"), ("国", "🌏"), ("会社", "🏢")],
     [("Bài 1", O("sentences.noun_desu", "questions.question_words")), ("Bài 2", O("sentences.noun_desu", "particles.core")), ("Bài 3", O("questions.question_words", "particles.core")), ("Bài 4", O("sentences.noun_desu", "reading.familiar_words"))])

unit(2, "unit-b", "ub", "Động từ thể ます", "Ba nhóm động từ, ます và ません, quá khứ ました, và các trợ từ に, で, へ.", """
## Động từ lịch sự

Tiếng Việt thêm "đã", "không" vào trước động từ. Tiếng Nhật đổi đuôi động từ:

| | Khẳng định | Phủ định |
|---|---|---|
| Hiện tại, tương lai | *行きます* | *行きません* |
| Quá khứ | *行きました* | *行きませんでした* |

*行きます* vừa là "đi" vừa là "sẽ đi": ngữ cảnh cho biết.

### Ba nhóm động từ
- Nhóm 1: *行く → 行きます*, *飲む → 飲みます*, *帰る → 帰ります*
- Nhóm 2: *食べる → 食べます*, *起きる → 起きます*, *寝る → 寝ます*
- Nhóm 3 (bất quy tắc): *する → します*, *来る → 来ます*（きます）

Từ điển ghi dạng gốc (*行く*); khi nói lịch sự, bạn dùng dạng *ます*.

### Trợ từ chỉ giờ, nơi, hướng
- *七時（しちじ）に起きます。* — Tôi dậy lúc bảy giờ. (*に*: thời điểm)
- *工場（こうじょう）で働きます。* — Tôi làm việc ở nhà máy. (*で*: nơi hành động)
- *会社へ行きます。* — Tôi đi đến công ty. (*へ*: hướng, đọc như え)

### Động từ đứng cuối
Dù câu dài, động từ luôn ở cuối: *毎日、電車で会社へ行きます。* — Ngày nào tôi cũng đi làm bằng tàu điện.
""", [("行く", "🚶‍♂️"), ("来る", "🛬"), ("帰る", "🏠"), ("働く", "👷"), ("起きる", "⏰"), ("寝る", "😴"), ("見る", "👀"), ("聞く", "👂"), ("する", "🛠️"), ("買う", "🛒")],
     [("Bài 1", O("verbs.masu_forms", "particles.core")), ("Bài 2", O("verbs.masu_forms")), ("Bài 3", O("verbs.masu_forms", "vocab.time_calendar")), ("Bài 4", O("particles.core", "reading.familiar_words"))])

unit(2, "unit-c", "uc", "あります・います và tính từ", "Ở đâu có gì, có ai; tính từ い và な.", """
## Có: あります và います

Tiếng Việt chỉ có một chữ "có". Tiếng Nhật chọn theo thứ được nói đến:
- đồ vật, cây cối: *あります* — *机（つくえ）の上に本があります。*
- người, con vật: *います* — *部屋に田中さんがいます。*

Mẫu câu: *nơi chốn に + vật が + あります / います*.

### Tính từ い
Kết thúc bằng い: *大きい*, *小さい*, *新しい*, *古い*, *高い*, *安い*.
- *この部屋は大きいです。* — Phòng này to.
- Phủ định: bỏ い, thêm くない: *大きくないです*.
- Ngoại lệ hay gặp: *いい* → *よくないです*.

### Tính từ な
*静か*, *きれい*, *便利*: đứng trước danh từ thì thêm な — *静かな部屋*. Cuối câu: *静かです*, phủ định *静かじゃありません*.

*きれい* tận cùng bằng い nhưng là tính từ な: *きれいな部屋*, không phải "きれくない".

### Vị trí
Tính từ đứng trước danh từ, ngược với tiếng Việt: *新しい会社* — công ty mới.
""", [("ある", "📦"), ("いる", "🧍"), ("大きい", "🐘"), ("小さい", "🐜"), ("新しい", "✨"), ("古い", "🏚️"), ("高い", "📈"), ("安い", "📉"), ("部屋", "🛏️"), ("机", "🗄️")],
     [("Bài 1", O("existence.aru_iru", "particles.core")), ("Bài 2", O("existence.aru_iru")), ("Bài 3", O("adjectives.i_na")), ("Bài 4", O("adjectives.i_na", "reading.familiar_words"))])

unit(2, "unit-d", "ud", "Giờ, ngày và lượng từ", "Hỏi giờ, nói thứ và ngày, đếm người và đồ vật.", """
## Giờ và phút
- *時（じ）* — giờ: *九時（くじ）*, *四時（よじ）*, *七時（しちじ）*: ba giờ đọc khác cần nhớ.
- *分（ふん）* — phút: *五分（ごふん）*, *十分（じっぷん）*.
- *半（はん）* — rưỡi: *八時半*.
- *今、何時ですか。* — Bây giờ là mấy giờ?

### Thứ trong tuần
*月曜日（げつようび）* thứ hai, rồi 火, 水, 木, 金, 土, *日曜日* chủ nhật. Mỗi ngày gắn với một chữ kanji: mặt trăng, lửa, nước, cây, vàng, đất, mặt trời.

### Ngày trong tháng
Ngày 1 đến 10, ngày 14, 20 và 24 có cách đọc riêng: *ついたち*, *二日（ふつか）*, *三日（みっか）*... *十四日（じゅうよっか）*, *二十日（はつか）*, *二十四日（にじゅうよっか）*. Những ngày khác đọc theo số + *日（にち）*.

### Lượng từ
Tiếng Việt có "cái", "con", "tờ". Tiếng Nhật cũng thế, và số đứng trước lượng từ:
- *一つ, 二つ* — đồ vật nói chung
- *一人（ひとり）, 二人（ふたり）, 三人（さんにん）* — người
- *枚（まい）* — vật mỏng: giấy, vé, áo
- *個（こ）* — vật nhỏ, tròn
- *回（かい）* — số lần; *階（かい）* — tầng

*切手を二枚ください。* — Cho tôi hai con tem.
""", [("時", "⌚"), ("分", "⏱️"), ("今日", "📅"), ("明日", "🌄"), ("毎日", "🔁"), ("月曜日", "🗓️"), ("一つ", "🍎"), ("一人", "🧍‍♂️"), ("枚", "📄"), ("個", "🍬")],
     [("Bài 1", O("vocab.time_calendar", "numbers.counters")), ("Bài 2", O("vocab.time_calendar")), ("Bài 3", O("numbers.counters")), ("Bài 4", O("numbers.counters", "reading.familiar_words"))])

unit(2, "unit-e", "ue", "Chữ và âm tiếng Nhật", "Ba bộ chữ, kanji qua âm Hán-Việt, trường âm và âm ngắt.", """
## Ba bộ chữ trong một câu

*わたしはコーヒーを飲みます。* có cả ba bộ chữ:
- hiragana (*わたし*, *は*, *を*, *みます*): từ thuần Nhật và đuôi ngữ pháp
- katakana (*コーヒー*): từ mượn, tên nước ngoài
- kanji (*飲*): phần mang nghĩa

### Kanji và âm Hán-Việt
Nhiều từ kanji đọc gần âm Hán-Việt: *電話（でんわ）* điện thoại, *会社（かいしゃ）* hội xã, *安全（あんぜん）* an toàn. Nhớ âm Hán-Việt giúp đoán nghĩa.

Cẩn thận với "bạn giả": *工場（こうじょう）* là nhà máy, không phải công trường; *勉強（べんきょう）* là học, không phải miễn cưỡng.

### Trường âm
Nguyên âm dài làm đổi nghĩa: *おばさん* (cô, dì) và *おばあさん* (bà). Trong katakana, dấu ー kéo dài âm: *コーヒー*.

### Âm ngắt っ
Chữ っ nhỏ là một nhịp ngắt ngắn: *きて* (hãy đến) và *きって* (tem).

### Cao độ không phải thanh điệu
Tiếng Nhật lên xuống giọng giữa các âm tiết, nhưng không có sáu thanh như tiếng Việt. Đừng gắn dấu thanh vào từ Nhật.
""", [("ひらがな", "🔤"), ("カタカナ", "🔠"), ("漢字", "🈷️"), ("日本語", "🗾"), ("言葉", "💬"), ("意味", "📖")],
     [("Bài 1", O("script.kana", "writing.kana_input")), ("Bài 2", O("script.kanji_hanviet", "strategy.hanviet_loanwords")), ("Bài 3", O("pronunciation.length_pitch")), ("Bài 4", O("pronunciation.length_pitch", "writing.kana_input"))])

# ---------------------------------------------------------------- Section 3: understanding everyday Japanese
unit(3, "unit-f", "uf", "Nghe từ và cụm từ", "Nghe ra từ quen trong câu nói rõ và chậm: thời tiết, giờ, số.", """
## Nghe từng từ

Ở phần này bạn nghe nhiều hơn đọc. Đừng cố hiểu hết: hãy bắt lấy những từ đã học.

### Thời tiết
- *天気（てんき）* — thời tiết; *雨（あめ）* — mưa
- *暑（あつ）い* — nóng; *寒（さむ）い* — lạnh
- *今日はいい天気ですね。* — Hôm nay trời đẹp nhỉ.

### Nghe số cho đúng
Số 4 (よん) và 7 (なな) được nói rõ; 1 (いち) và 7 (しち) dễ lẫn nếu ai đó dùng しち. Khi không chắc, hãy hỏi lại: *もう一度お願いします*.

### Nghe trường âm
*ビル* (toà nhà) và *ビール* (bia), *来て* và *切手*: độ dài âm là thông tin. Hãy nghe thêm một lần nếu cần.

### Câu kết thúc bằng ね
*ね* cuối câu như "nhỉ": người nói chờ bạn đồng ý. Trả lời *そうですね* là đủ.

### Cách luyện nghe
Mỗi đoạn được nghe tối đa hai lần khi làm bài có chấm điểm. Lần đầu nghe ý chính, lần hai nghe con số.
""", [("天気", "🌤️"), ("雨", "☔"), ("暑い", "🥵"), ("寒い", "🥶")],
     [("Nghe từ", O("listening.familiar_words")), ("Nghe số", O("listening.short_info", "numbers.counters")), ("Đọc từ", O("reading.familiar_words")), ("Ôn tập", O("listening.familiar_words", "listening.short_info"))])

unit(3, "unit-g", "ug", "Biển báo và nội quy ở nhà máy", "Đọc biển cấm, biển nguy hiểm, nội quy an toàn và tin nhắn của đàn anh.", """
## Biển báo ở chỗ làm

### Những chữ phải nhận ra ngay
- *危険（きけん）* — nguy hiểm
- *禁止（きんし）* — cấm: *立入禁止（たちいりきんし）* cấm vào, *禁煙（きんえん）* cấm hút thuốc
- *注意（ちゅうい）* — chú ý
- *安全（あんぜん）* — an toàn: *安全第一* an toàn là trên hết

### Câu nội quy
Nội quy thường dùng thể て:
- *ヘルメットをかぶってください。* — Hãy đội mũ bảo hộ.
- *機械（きかい）に触（さわ）らないでください。* — Đừng chạm vào máy.
- *走（はし）らないでください。* — Không được chạy.

*〜てください* là "hãy", *〜ないでください* là "đừng".

### Tin nhắn của đàn anh
*先輩（せんぱい）* là người vào làm trước bạn. Tin nhắn thường ngắn: *明日は七時からです。* — Mai làm từ bảy giờ. Hãy tìm giờ, ngày và việc cần làm.

### Khi không chắc
Hỏi ngay: *すみません、これは何ですか。* Ở nhà máy Nhật, hỏi lại là việc đúng, không phải thiếu lịch sự.
""", [("工場", "🏭"), ("安全", "🦺"), ("危ない", "⚠️"), ("禁止", "🚫"), ("注意", "❗"), ("出口", "🏃")],
     [("Biển báo", O("reading.notices_info", "vocab.work_japan")), ("Nội quy an toàn", O("reading.notices_info", "verbs.te_form")), ("Tin nhắn ở chỗ làm", O("reading.short_messages")), ("Chỉ dẫn an toàn", O("listening.announcements", "verbs.te_form"))])

unit(3, "unit-h", "uh", "Thông báo ở nhà ga", "Nghe thông báo trên sân ga, đọc bảng giờ tàu và mua vé.", """
## Ở nhà ga

### Từ cần biết
- *駅（えき）* — nhà ga; *電車（でんしゃ）* — tàu điện
- *切符（きっぷ）* — vé; *〜番線（ばんせん）* — đường ray số...
- *乗（の）る* — lên tàu: *電車に乗ります* (dùng trợ từ に)
- *降（お）りる* — xuống tàu: *次の駅で降ります*

### Thông báo hay nghe
- *まもなく、二番線に電車が参ります。* — Tàu sắp vào đường ray số 2.
- *黄色い線の内側までお下がりください。* — Xin lùi vào sau vạch vàng.

Thông báo dùng lời rất lịch sự. Bạn chỉ cần bắt số đường ray, giờ và tên ga.

### Bảng giờ tàu
Giờ viết theo 24 tiếng: *14:05*. *発（はつ）* là giờ chạy, *着（ちゃく）* là giờ đến.

### Hỏi
*すみません、この電車は大阪へ行きますか。* — Xin lỗi, tàu này có đi Osaka không?

### Khi tàu bị trễ
*電車が遅れています。* — Tàu đang bị trễ. Câu này hay dùng khi báo đến muộn cho chỗ làm.
""", [("駅", "🚉"), ("電車", "🚃"), ("切符", "🎫"), ("乗る", "🚌"), ("降りる", "⬇️")],
     [("Ở sân ga", O("listening.announcements")), ("Bảng giờ tàu", O("reading.notices_info", "vocab.time_calendar")), ("Thông báo", O("listening.announcements", "listening.short_info")), ("Ôn tập", O("listening.short_info", "reading.notices_info"))])

unit(3, "unit-i", "ui", "Hội thoại ngắn ở cửa hàng tiện lợi", "Nghe nhân viên hỏi về túi, thẻ tích điểm, hâm nóng, và trả lời ngắn.", """
## Ở cửa hàng tiện lợi

*コンビニ* có mặt khắp nơi ở Nhật. Nhân viên nói nhanh nhưng luôn hỏi cùng vài câu.

### Câu nhân viên hỏi
- *いらっしゃいませ。* — Xin mời vào. Không cần trả lời.
- *袋（ふくろ）はご利用ですか。* — Quý khách có dùng túi không?
- *ポイントカードはお持ちですか。* — Quý khách có thẻ tích điểm không?
- *温（あたた）めますか。* — Có hâm nóng không?
- *お箸（はし）はおつけしますか。* — Có lấy đũa không?

### Trả lời ngắn
- *はい、お願いします。* — Vâng, nhờ anh.
- *いいえ、結構（けっこう）です。* — Không, không cần ạ.
- *大丈夫です。* — Không cần đâu ạ.

*結構です* và *大丈夫です* ở đây là lời từ chối lịch sự, không phải "tốt lắm".

### Trả tiền
*レジ* là quầy thu ngân. Màn hình hiện số tiền; nghe con số và đưa tiền hoặc thẻ: *カードでお願いします*.
""", [("コンビニ", "🏪"), ("袋", "🛍️"), ("レジ", "🧾"), ("結構", "🙅")],
     [("Ở quầy thu ngân", O("listening.short_dialogues")), ("Câu nhân viên hỏi", O("listening.short_dialogues", "listening.short_info")), ("Đọc hoá đơn", O("reading.notices_info", "numbers.counters")), ("Ôn tập", O("listening.short_dialogues"))])

unit(3, "unit-j", "uj", "Chuyện nhỏ ở ký túc xá", "Đọc và nghe chuyện ngắn: đổ rác, giặt đồ, một ngày làm việc.", """
## Cuộc sống ở ký túc xá

Nhiều thực tập sinh sống ở *寮（りょう）* của công ty. Các câu chuyện ở bài này kể về những việc thường ngày.

### Đổ rác
Ở Nhật, rác được chia loại và đổ theo lịch. *ごみ* là rác; lịch ghi thứ cho từng loại:
- *燃（も）えるごみ* — rác cháy được
- *月曜日と木曜日* — thứ hai và thứ năm

Đọc lịch đổ rác là một bài đọc tìm thông tin rất thực tế.

### Giặt đồ và tắm
- *洗（あら）う* — rửa, giặt: *服を洗います*
- *着（き）る* — mặc áo; *お風呂（ふろ）に入ります* — tắm bồn

### Đọc chuyện ngắn
Mỗi câu chuyện chỉ có vài câu. Đọc chậm, đọc lại, và dùng furigana trên chữ kanji. Câu hỏi sau truyện hỏi ai, làm gì, khi nào. Trong truyện, mọi người nói です/ます cho bạn dễ học; trong gia đình, người Nhật thường nói thân mật hơn.

### Nội quy ký túc xá
Nội quy thường có giờ yên lặng và giờ tắm: *夜十時から静かにしてください。* — Từ mười giờ tối hãy giữ yên lặng.
""", [("寮", "🏘️"), ("ごみ", "🗑️"), ("洗う", "🧼"), ("着る", "👕")],
     [("Một ngày của Nam", O("reading.short_texts")), ("Lịch đổ rác", O("reading.notices_info")), ("Nghe kể chuyện", O("listening.short_dialogues", "reading.short_texts")), ("Ôn tập", O("reading.short_texts", "listening.short_info"))])

# ---------------------------------------------------------------- Section 4: speaking
unit(4, "unit-k", "uk", "Chào hỏi ở chỗ làm", "Nói lời chào khi vào ca, khi về trước, khi ra và vào nhà.", """
## Những câu nói mỗi ngày

### Ở chỗ làm
- *おはようございます* — khi bắt đầu ca (ở nhiều chỗ làm, kể cả ca chiều)
- *お疲れさまです* — khi gặp đồng nghiệp trong ngày
- *お先（さき）に失礼します* — khi về trước người khác
- *わかりました* — tôi hiểu rồi, sau khi nhận chỉ dẫn

### Ở nhà
- *いってきます* — tôi đi đây; người ở nhà đáp *いってらっしゃい*
- *ただいま* — tôi về rồi; người ở nhà đáp *おかえりなさい*

### Nói to và rõ
Ứng dụng nghe bạn bằng bộ nhận dạng giọng nói tiếng Nhật của điện thoại. Mình chỉ kiểm tra từ nghe được, không chấm phát âm. Nói đủ trường âm: *おはようございます* có một chỗ kéo dài, *よう* (yô-ô).

### Khi chưa nghe rõ
*すみません、もう一度お願いします。* — Xin lỗi, xin nói lại một lần nữa.
""", [("お先に失礼します", "🌇"), ("いってきます", "🎒"), ("ただいま", "🏡"), ("わかりました", "👌")],
     [("Chào khi vào ca", O("speaking.formulaic")), ("Về trước", O("speaking.formulaic", "politeness.levels")), ("Ở nhà", O("speaking.formulaic")), ("Ôn tập", O("speaking.formulaic", "greetings.basic"))])

unit(4, "unit-l", "ul", "Tự giới thiệu khi phỏng vấn", "Giới thiệu tên, tuổi, quê, kinh nghiệm và sở thích bằng câu ngắn.", """
## 自己紹介（じこしょうかい）

Trong buổi *面接（めんせつ）*, phần tự giới thiệu đi theo thứ tự quen thuộc:

1. *はじめまして。*
2. *グエン・ヴァン・ナムです。* — tên
3. *ベトナムから来ました。* — đến từ đâu
4. *二十二歳です。* — tuổi
5. *趣味（しゅみ）はサッカーです。* — sở thích
6. *よろしくおねがいします。*

### Nói về công việc
- *工場で三年働きました。* — Tôi đã làm ở nhà máy ba năm.
- *日本の会社で働きたいです。* — Tôi muốn làm việc ở công ty Nhật.

### Thích
*〜が好きです*: *日本の料理が好きです。* Chú ý trợ từ *が*, không phải *を*.

### Giữ câu ngắn
Câu ngắn và đúng tốt hơn câu dài và sai. Mỗi câu một ý, kết thúc bằng *です* hoặc *ます*.

### Câu hỏi hay gặp
- *どうして日本に来ましたか。* — Tại sao bạn đến Nhật?
- *日本語はどのぐらい勉強しましたか。* — Bạn đã học tiếng Nhật bao lâu?
- *何か質問はありますか。* — Bạn có câu hỏi gì không?
""", [("面接", "🎤"), ("仕事", "🧰"), ("趣味", "🎨"), ("好き", "❤️")],
     [("Tên và quê", O("speaking.self_intro")), ("Tuổi và công việc", O("speaking.self_intro", "verbs.masu_forms")), ("Sở thích", O("speaking.self_intro", "wants.tai_suki")), ("Ôn tập", O("speaking.self_intro", "politeness.levels"))])

unit(4, "unit-m", "um", "Nói số: điện thoại, giá, giờ", "Đọc số điện thoại, nói giá tiền và hẹn giờ.", """
## Số điện thoại
Đọc từng chữ số, chỗ gạch ngang nói *の*: 090-1234-5678 → *ゼロきゅうゼロの いちにさんよんの…*. Dùng *よん*, *なな*, *きゅう* cho rõ.

### Giá tiền
- *千五百円（せんごひゃくえん）* — 1.500 yên
- *三千円（さんぜんえん）*: ba nghìn đọc là さんぜん, không phải さんせん.
- *八百円（はっぴゃくえん）*, *六百円（ろっぴゃくえん）*: âm thay đổi, hãy nghe mẫu nhiều lần.

### Giờ
- *何時（なんじ）からですか。* — Từ mấy giờ?
- *八時から五時までです。* — Từ tám giờ đến năm giờ.

*から* là "từ", *まで* là "đến".

### Mình nghe thế nào
Số bạn nói có thể hiện ra dưới dạng chữ số hoặc kanji. Hai cách đều được tính là một. Sai số là sai thông tin, nên hãy nói chậm.

### Ngày tháng
*五月十四日（ごがつじゅうよっか）*: tháng đọc theo số + がつ; ngày 1 đến 10, ngày 14, 20 và 24 có cách đọc riêng (như *十四日 じゅうよっか*).
""", [("電話", "📞"), ("番号", "#️⃣"), ("時間", "⏳"), ("何時", "🕐")],
     [("Số điện thoại", O("speaking.give_info", "numbers.counters")), ("Giá tiền", O("speaking.give_info")), ("Giờ giấc", O("speaking.give_info", "vocab.time_calendar")), ("Ôn tập", O("speaking.give_info"))])

unit(4, "unit-n", "un", "Mô tả người và đồ vật", "Nói màu sắc, to nhỏ, dài ngắn bằng cụm từ ngắn.", """
## Mô tả bằng tính từ

### Màu sắc
- *赤（あか）い* — đỏ; *白（しろ）い* — trắng; *黒（くろ）い* — đen; *青（あお）い* — xanh
- *赤いかばん* — cái túi đỏ; *このシャツは白いです* — áo này màu trắng

Tiếng Việt nói "túi đỏ", tiếng Nhật nói "đỏ túi": tính từ luôn đứng trước.

### To nhỏ, dài ngắn
- *長（なが）い* — dài; *短（みじか）い* — ngắn
- *大きい箱* — thùng to; *小さい部屋* — phòng nhỏ

### Mô tả người
- *背（せ）が高いです。* — Cao.
- *やさしい人です。* — Là người tốt bụng.

### Một đặc điểm là đủ
Bài nói chỉ cần: đó là gì, và một đặc điểm. *これは赤い自転車です。* — Đây là chiếc xe đạp màu đỏ.

### Danh từ màu và tính từ màu
*赤* là màu đỏ (danh từ), *赤い* là đỏ (tính từ). Trước danh từ dùng *赤い*: *赤いボタン*; nói về màu thì dùng *赤*: *赤が好きです*.
""", [("色", "🌈"), ("赤い", "🔴"), ("白い", "⚪"), ("長い", "📏")],
     [("Màu sắc", O("speaking.describe", "adjectives.i_na")), ("To nhỏ", O("speaking.describe")), ("Mô tả người", O("speaking.describe", "adjectives.i_na")), ("Ôn tập", O("speaking.describe"))])

# ---------------------------------------------------------------- Section 5: writing
unit(5, "unit-o", "uo", "Viết về mình", "Gõ kana trên điện thoại và viết vài câu về bản thân.", """
## Gõ tiếng Nhật trên điện thoại

Bàn phím tiếng Nhật đổi chữ La-tinh hoặc phím kana thành hiragana, rồi gợi ý kanji. Ví dụ gõ かいしゃ rồi chọn *会社*.

### Những chỗ hay sai khi gõ
- trường âm: *おばあさん*, *がっこう*, *コーヒー*
- âm ngắt: *きって*, *ざっし*
- ん: *きんえん* — gõ n hai lần trên bàn phím La-tinh

Câu trả lời gõ bằng kana cho từ có kanji vẫn được chấp nhận, nhưng chỉ tính là luyện tập.

### Viết về bản thân
- *わたしはグエン・ミンです。*
- *二十三歳です。*
- *ベトナムのハノイから来ました。*
- *今、大阪の工場で働いています。*

### Dấu câu
Tiếng Nhật kết thúc câu bằng *。* và dùng *、* thay dấu phẩy.

### Kanji hay kana
Viết bằng kana không sai. Kanji giúp người Nhật đọc nhanh hơn, nên hãy dùng những chữ đã học: *会社*, *工場*, *日本*.
""", [("住所", "📮"), ("自分", "🪞"), ("書く", "✍️")],
     [("Gõ kana", O("writing.kana_input")), ("Câu về mình", O("writing.personal_info")), ("Quê và công việc", O("writing.personal_info", "writing.kana_input")), ("Ôn tập", O("writing.personal_info"))])

unit(5, "unit-p", "up", "Viết câu đơn giản", "Viết ai làm gì, ở đâu, khi nào, và nối câu.", """
## Câu đơn giản

### Thứ tự thường gặp
Thời gian → nơi chốn → tân ngữ → động từ:
*毎朝、食堂でご飯を食べます。* — Sáng nào tôi cũng ăn cơm ở căng tin.

### Nối câu
- *そして* — và, rồi
- *それから* — sau đó
- *でも* — nhưng

*日本語は難しいです。でも、楽しいです。* — Tiếng Nhật khó. Nhưng vui.

### Viết đúng trợ từ
Mỗi danh từ cần trợ từ của nó: *を* cho tân ngữ, *で* cho nơi làm việc gì, *に* cho thời điểm. Viết xong, hãy đọc lại từng trợ từ.

### Bài viết được chấm thế nào
Bài có các ô thông tin bắt buộc. Mình kiểm tra từng ô và độ dài, không chấm văn phong.

### Bỏ chủ ngữ
Khi đã rõ ai làm, tiếng Nhật bỏ *わたしは*: *六時に起きます。* là đủ. Tiếng Việt cũng hay nói "Sáu giờ dậy".
""", [("そして", "➕"), ("でも", "↔️"), ("それから", "⏭️")],
     [("Một ngày của tôi", O("writing.phrases_sentences")), ("Nối câu", O("writing.phrases_sentences", "particles.core")), ("Viết về chỗ làm", O("writing.phrases_sentences")), ("Ôn tập", O("writing.phrases_sentences", "writing.personal_info"))])

unit(5, "unit-q", "uq", "Tin nhắn cho cấp trên", "Viết tin nhắn xin nghỉ, báo đến muộn, và trả lời đồng nghiệp.", """
## Tin nhắn ở chỗ làm

Tin nhắn cho *上司（じょうし）* cần ngắn, rõ và lịch sự.

### Ba phần của tin nhắn
1. Chào: *お疲れさまです。グエンです。*
2. Thông tin: *熱があります。今日は休みます。*
3. Kết: *すみません。よろしくおねがいします。*

### Xin nghỉ, đến muộn
- *今日は休みます。* — Hôm nay tôi nghỉ.
- *電車が遅れています。10分（じゅっぷん）ぐらい遅れます。* — Tàu bị trễ, tôi đến muộn khoảng mười phút.
- *明日は大丈夫です。* — Ngày mai thì tôi ổn (đi làm được).

### Lý do ngắn
Một lý do là đủ: *風邪です*, *病院へ行きます*. Không cần xin lỗi nhiều lần.

### Trả lời đồng nghiệp
*わかりました。ありがとうございます。* — Tôi hiểu rồi, cảm ơn.

### Gửi sớm
Nếu phải nghỉ hay đến muộn, hãy nhắn trước giờ làm, không đợi đến khi ca đã bắt đầu. Ở Nhật, báo sớm là phép lịch sự.
""", [("上司", "👔"), ("休み", "🏖️"), ("遅刻する", "🐢"), ("メール", "📧")],
     [("Xin nghỉ", O("writing.short_message")), ("Báo đến muộn", O("writing.short_message", "vocab.time_calendar")), ("Trả lời tin nhắn", O("writing.short_message", "reading.short_messages")), ("Ôn tập", O("writing.short_message"))])

unit(5, "unit-r", "ur", "Giấy tờ ở toà thị chính", "Điền tên, địa chỉ, ngày sinh vào biểu mẫu đơn giản.", """
## Ở toà thị chính

Khi mới đến Nhật hay chuyển nhà, trong 14 ngày bạn khai báo địa chỉ ở *市役所（しやくしょ）* (ở thành phố lớn là *区役所（くやくしょ）*) và mang theo *在留（ざいりゅう）カード*.

### Ô trong biểu mẫu
- *名前* / *氏名（しめい）* — họ tên
- *フリガナ* — cách đọc tên, viết bằng katakana
- *住所（じゅうしょ）* — địa chỉ
- *電話番号* — số điện thoại
- *生年月日（せいねんがっぴ）* — ngày tháng năm sinh

### Tên người Việt
Tên Việt viết bằng katakana: Nguyễn Văn Nam → *グエン・ヴァン・ナム*. Dấu ・ ngăn họ, tên đệm và tên.

### Ngày tháng năm
Người Nhật viết năm trước, rồi tháng, rồi ngày: *2002年5月14日*. Tiếng Việt viết ngược lại.

### Con dấu
*はんこ* là con dấu cá nhân. Nhiều nơi chấp nhận chữ ký thay cho con dấu; hãy hỏi *サインでもいいですか*.
""", [("市役所", "🏛️"), ("在留カード", "🪪"), ("書類", "📑"), ("はんこ", "🔏")],
     [("Ô trong biểu mẫu", O("writing.form_filling")), ("Tên bằng katakana", O("writing.form_filling", "writing.kana_input")), ("Ngày tháng năm", O("writing.form_filling", "numbers.counters")), ("Ôn tập", O("writing.form_filling"))])

# ---------------------------------------------------------------- Section 6: talking with someone
unit(6, "unit-s", "us", "Ở cửa hàng và quán ăn", "Mua cơm hộp, trả lời nhân viên, gọi món ở quán.", """
## Mua hàng

### Ở cửa hàng tiện lợi
- *これをください。* — Cho tôi cái này.
- *お弁当（べんとう）、温めてください。* — Hâm nóng cơm hộp giúp tôi.
- *袋はいりません。* — Tôi không cần túi.
- *カードでお願いします。* — Tôi trả bằng thẻ.

### Ở quán ăn
- *何名（なんめい）さまですか。* — Quý khách đi mấy người?
- *一人です。* — Một người.
- *ラーメンを一つお願いします。* — Cho một bát mì.
- *お会計（かいけい）お願いします。* — Cho tôi thanh toán.

### Nhân viên nói rất lịch sự
Nhân viên dùng kính ngữ: *お持ちですか*, *ご利用ですか*. Bạn không cần nói như vậy; *です/ます* là đủ lịch sự.

### Khi không hiểu
*すみません、もう一度お願いします。* Người bán sẽ nói lại chậm hơn hoặc chỉ vào màn hình.

### Đếm khi gọi món
Gọi món dùng *一つ*, *二つ*: *ラーメンを二つお願いします*. Người thì đếm bằng *一人*, *二人*, *三人*.
""", [("お弁当", "🍱"), ("ください", "🫴"), ("いらっしゃいませ", "🛎️"), ("カード", "💳")],
     [("Ở cửa hàng tiện lợi", O("interaction.practical_needs")), ("Hội thoại: thanh toán", O("interaction.practical_needs", "listening.short_dialogues")), ("Ở quán ăn", O("interaction.practical_needs")), ("Hội thoại: gọi món", O("interaction.practical_needs"))])

unit(6, "unit-t", "ut", "Hỏi đường và đi tàu", "Hỏi đường đến ga, hỏi tàu nào, hiểu câu chỉ đường ngắn.", """
## Hỏi đường

### Hỏi
- *すみません、駅はどこですか。* — Xin lỗi, ga ở đâu ạ?
- *ここから遠いですか。* — Từ đây có xa không?

### Chỉ đường
- *まっすぐ行ってください。* — Đi thẳng.
- *右（みぎ）に曲（ま）がってください。* — Rẽ phải.
- *左（ひだり）に曲がってください。* — Rẽ trái.
- *二つ目の角（かど）を右です。* — Góc thứ hai thì rẽ phải.
- *コンビニの隣（となり）です。* — Ở cạnh cửa hàng tiện lợi.

### Ở ga
- *この電車は名古屋へ行きますか。* — Tàu này đi Nagoya không?
- *どこで乗り換えますか。* — Đổi tàu ở đâu?

### Nhắc lại để chắc
*まっすぐ、それから右ですね。* — Đi thẳng rồi rẽ phải, đúng không ạ? Nhắc lại giúp bạn và người chỉ đường cùng chắc chắn.

### Hỏi ai
Ở Nhật, bạn có thể hỏi đường ở *交番（こうばん）*, đồn cảnh sát nhỏ gần ga, hoặc hỏi nhân viên nhà ga.
""", [("右", "➡️"), ("左", "⬅️"), ("まっすぐ", "⬆️"), ("道", "🛣️")],
     [("Hỏi đường", O("interaction.practical_needs")), ("Hội thoại: đến nhà ga", O("interaction.practical_needs", "listening.short_dialogues")), ("Ở ga", O("interaction.everyday_conversation")), ("Hội thoại: đổi tàu", O("interaction.practical_needs"))])

unit(6, "unit-u", "uu", "Ở phòng khám", "Nói chỗ đau, trả lời câu hỏi ở quầy lễ tân, nghe cách uống thuốc.", """
## Đi khám

### Ở quầy lễ tân
- *初めてです。* — Tôi đến lần đầu.
- *保険証（ほけんしょう）を見せてください。* — Cho xem thẻ bảo hiểm.
- *この紙に書いてください。* — Hãy điền vào tờ giấy này.

### Nói triệu chứng
Tiếng Việt nói "tôi đau đầu"; tiếng Nhật nói "đầu đau":
- *頭（あたま）が痛（いた）いです。* — Tôi đau đầu.
- *おなかが痛いです。* — Tôi đau bụng.
- *熱（ねつ）があります。* — Tôi bị sốt.
- *昨日からです。* — Từ hôm qua.

### Thuốc
- *薬（くすり）を飲んでください。* — Hãy uống thuốc. Giống tiếng Việt, tiếng Nhật nói "uống" thuốc: *薬を飲みます*.
- *一日三回、食後（しょくご）です。* — Ngày ba lần, sau bữa ăn.

### Nghe kỹ con số
Liều thuốc là thông tin quan trọng. Nếu chưa chắc, hãy hỏi lại: *一日何回ですか。*

### Khi nguy cấp
Gọi 119 để có *救急車（きゅうきゅうしゃ）*, xe cấp cứu. Câu đầu tiên: *救急です。* — Cấp cứu.
""", [("病院", "🏥"), ("痛い", "🤕"), ("熱", "🌡️"), ("薬", "💊"), ("保険証", "📇")],
     [("Ở quầy lễ tân", O("interaction.practical_needs")), ("Hội thoại: nói triệu chứng", O("interaction.practical_needs", "listening.short_info")), ("Thuốc và liều", O("listening.short_info")), ("Hội thoại: ở phòng khám", O("interaction.practical_needs"))])

unit(6, "unit-v", "uv", "Gọi điện cho chỗ làm", "Gọi điện báo ốm, xin nghỉ, và trò chuyện ngắn với đàn anh.", """
## Gọi điện

### Mở đầu cuộc gọi
- *もしもし、グエンです。* — A lô, Nguyễn đây ạ. (Ở chỗ làm, người Nhật gọi bạn bằng họ, nên bạn xưng họ.)
- *田中さんはいらっしゃいますか。* — Anh Tanaka có ở đó không ạ?
- *少々（しょうしょう）お待ちください。* — Xin chờ một chút.

*もしもし* chỉ dùng trên điện thoại.

### Báo ốm, xin nghỉ
- *風邪（かぜ）をひきました。* — Tôi bị cảm.
- *今日は休んでもいいですか。* — Hôm nay tôi nghỉ được không ạ?
- *明日は行けます。* — Mai tôi đi làm được.

### Kết thúc
*よろしくおねがいします。失礼します。* — Rất mong anh thông cảm. Tôi xin phép cúp máy.

### Trò chuyện với đàn anh
*先輩* hay hỏi: *週末は何をしましたか。* — Cuối tuần làm gì? Trả lời một hai câu, rồi hỏi lại: *先輩は？*

### Nghe không rõ trên điện thoại
Điện thoại khó nghe hơn nói trực tiếp. Hãy nói: *すみません、もう少しゆっくりお願いします。* — Xin nói chậm hơn một chút.
""", [("風邪", "🤧"), ("休む", "🛌"), ("先輩", "🧑‍🏭"), ("すぐ", "⚡")],
     [("Gọi điện báo ốm", O("interaction.practical_needs")), ("Hội thoại: xin nghỉ", O("interaction.practical_needs", "politeness.levels")), ("Trò chuyện với đàn anh", O("interaction.everyday_conversation")), ("Hội thoại: phỏng vấn ngắn", O("interaction.everyday_conversation", "speaking.self_intro"))])

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
if len(UNITS) != 27:
    problems.append(f"{len(UNITS)} units, the blueprint has 27")
if problems:
    for p in problems:
        print(p)
    raise SystemExit(f"{len(problems)} problem(s)")

os.makedirs(f"{ROOT}/content/ja/_drafts/units", exist_ok=True)
with open(f"{ROOT}/content/ja/_drafts/units/OUTPUT.jsonl", "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(lines) + "\n")
profile = f"{ROOT}/content/ja/_drafts/staged/content/courses/{C}.profile.json"
os.makedirs(os.path.dirname(profile), exist_ok=True)
with open(profile, "w", encoding="utf-8", newline="\n") as f:
    # P4c task 5: romaji under Japanese text only until the learner passes the kana primer checkpoint.
    json.dump({"role": "primary", "allowUnreviewed": True, "betaUntilReviewed": True, "romajiUntilPrimer": True}, f, indent=2)
    f.write("\n")
# The inherited ja-en basic pack is never edited; once ja-vi is the primary course it stands alone like it-en and de-en:
# its own lessons, no shared daily words or FSRS stream (the syllabus and its units belong to ja-vi).
with open(f"{ROOT}/content/ja/_drafts/staged/content/courses/ja-en.profile.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump({"basicPack": True, "role": "standalone", "enabled": {"fsrs": False, "dailySession": False}}, f, indent=2)
    f.write("\n")
print(len(lines), "units,", sum(len(u["words"]) for u in UNITS), "words,", sum(len(u["lessons"]) for u in UNITS), "lessons")

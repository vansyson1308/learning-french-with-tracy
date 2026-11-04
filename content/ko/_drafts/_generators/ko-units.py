"""Units of ko-vi: content/ko/_drafts/units/OUTPUT.jsonl and the staged course profiles. The units ingest takes the pack
header (language names, flag) from the sibling ko-en pack; ko-pipeline.sh then records the pack audio policy device-tts
(QC 2026-11-05 §2.1).

Words are (surface, emoji); the Vietnamese gloss is copied from the staged lexicon. Only A1 lexemes may be taught here:
the words of core-a2.txt are band A2-1. Every other syllabus lexeme reaches a unit through TOPIC_UNITS in ko-lex.py.
Guidebooks show Korean in Hangul only (the Hangul primer comes before Section 1; the app shows RR as a reading aid).
usage: python -I ko-units.py <repo root>
"""
import json, os, sys

sys.stdout.reconfigure(encoding="utf-8")
ROOT = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
lex = json.load(open(f"{ROOT}/content/ko/_drafts/staged/content/ko/lexicon/lexemes.json", encoding="utf-8"))["lexemes"]
GLOSS = {x["surface"]: x["glosses"]["vi"] for x in lex}
LATER = set()
for line in open(os.path.join(HERE, "core-a2.txt"), encoding="utf-8"):
    if line.strip() and not line.startswith("#"):
        LATER.add(line.split("|")[1])
C = "ko-vi"
S = {
    1: "Phần 1: Nhập môn",
    2: "Phần 2: Viên gạch nền",
    3: "Phần 3: Hiểu tiếng Hàn hằng ngày",
    4: "Phần 4: Nói những câu tiếng Hàn đầu tiên",
    5: "Phần 5: Viết tiếng Hàn hằng ngày",
    6: "Phần 6: Trò chuyện với ai đó",
}
O = lambda *xs: [f"ko.obj.{x}" for x in xs]
UNITS = []


def unit(section, uid, lkey, title, desc, guidebook, words, lessons):
    UNITS.append(dict(section=section, uid=uid, lkey=lkey, title=title, desc=desc, gb=guidebook.strip(), words=words, lessons=lessons))


# ---------------------------------------------------------------- Section 1: the first words (after the Hangul primer; no typing)
unit(1, "unit-1", "u0", "Lời chào đầu tiên", "Chào, cảm ơn, xin lỗi: những câu bạn dùng ngay ngày đầu ở Hàn Quốc.", """
## Chào hỏi

- *안녕하세요* — xin chào, dùng được cả ngày, với mọi người
- *안녕히 가세요* — chào người **ra về** (họ đi, bạn ở lại)
- *안녕히 계세요* — chào khi **bạn ra về** (người kia ở lại)

Tiếng Việt chỉ có một câu "tạm biệt"; tiếng Hàn chọn câu theo ai đi, ai ở.

### Cảm ơn và xin lỗi
- *감사합니다* — cảm ơn (trang trọng, dùng ở chỗ làm)
- *죄송합니다* — xin lỗi (trang trọng)
- *괜찮아요* — không sao

### Vâng và không
*네* là vâng, dạ; *아니요* là không. Người Hàn hay nói *네* chỉ để cho biết "tôi đang nghe".

### Ở chỗ làm
- *수고하셨습니다* — anh chị vất vả rồi, nói khi hết giờ làm
- *잘 부탁드립니다* — mong anh chị giúp đỡ, nói ngày đầu đi làm

### Hai kiểu đuôi câu
Câu kết thúc bằng *-습니다* là kiểu trang trọng; câu kết thúc bằng *-요* là kiểu lịch sự thân thiện. Ở chỗ làm bạn sẽ nghe cả hai.
""", [("안녕하세요", "👋"), ("안녕히 가세요", "🚶"), ("안녕히 계세요", "🏠"), ("감사합니다", "🙏"), ("죄송합니다", "🙇"), ("괜찮아요", "👌"), ("네", "✅"), ("아니요", "❌"), ("수고하셨습니다", "💪"), ("잘 부탁드립니다", "🤝")],
     [("Bài 1", O("greetings.basic", "reading.familiar_words"))] * 4)

unit(1, "unit-2", "u1", "Tôi là ai?", "Nói tên, nói bạn là người Việt Nam, nói bạn làm nghề gì.", """
## Câu đầu tiên về bạn

Câu tiếng Hàn đơn giản nhất: *A는 B예요* hoặc *A은 B이에요* — A là B.
- *저는 흐엉이에요.* — Tôi là Hương.
- *저는 베트남 사람이에요.* — Tôi là người Việt Nam.
- *저는 근로자예요.* — Tôi là người lao động.

### 이에요 hay 예요?
Nhìn chữ cuối của danh từ:
- có phụ âm cuối (받침): *학생이에요*, *회사원이에요*, *흐엉이에요* (ㅇ ở cuối *엉* là một phụ âm cuối)
- không có phụ âm cuối: *근로자예요*, *투이예요*

Tiếng Việt đặt "là" ở giữa câu; tiếng Hàn đặt *이에요 / 예요* ở **cuối** câu.

### 저
*저* là "tôi" khiêm tốn, dùng với người lớn, cấp trên, người lạ. Tiếng Hàn hay bỏ chủ ngữ khi đã rõ: chỉ nói *학생이에요* cũng được.

### Lần đầu gặp mặt
- *처음 뵙겠습니다.* — Rất hân hạnh được gặp.
- *만나서 반갑습니다.* — Rất vui được gặp.

### Nước và người
*한국* là Hàn Quốc, *베트남* là Việt Nam. Thêm *사람*: *한국 사람* là người Hàn Quốc.
""", [("저", "🙋"), ("이름", "🏷️"), ("사람", "🧑"), ("베트남", "🇻🇳"), ("한국", "🇰🇷"), ("학생", "🧑‍🎓"), ("회사원", "💼"), ("근로자", "👷"), ("이에요", "🟰"), ("예요", "🔗"), ("처음 뵙겠습니다", "🎉"), ("만나서 반갑습니다", "😊")],
     [("Bài 1", O("sentences.copula", "vocab.everyday_basics"))] * 4)

unit(1, "unit-3", "u2", "Gia đình", "Bố mẹ, anh chị em, vợ chồng: người Hàn gọi anh chị theo người nói là nam hay nữ.", """
## Gia đình tôi

- *아버지* — bố; *어머니* — mẹ (thân mật: *아빠*, *엄마*)
- *할아버지* — ông; *할머니* — bà
- *남편* — chồng; *아내* — vợ
- *아들* — con trai; *딸* — con gái

### Anh, chị: tuỳ bạn là nam hay nữ
Tiếng Việt gọi "anh trai", "chị gái" như nhau với mọi người. Tiếng Hàn đổi từ theo **người gọi**:
- em trai gọi anh trai là *형*, gọi chị gái là *누나*
- em gái gọi anh trai là *오빠*, gọi chị gái là *언니*

Em thì chung một từ: *동생* (em trai *남동생*, em gái *여동생*).

### Gia đình có mấy người?
*가족이 몇 명이에요?* — Gia đình bạn có mấy người? Trả lời bằng số thuần Hàn và lượng từ *명*: *네 명이에요*.

### 가족 — gia tộc?
*가족* là từ Hán-Hàn, âm Hán-Việt là "gia tộc", nhưng nghĩa là **gia đình**, không phải dòng họ lớn.
""", [("가족", "👨‍👩‍👧"), ("아버지", "👨"), ("어머니", "👩"), ("형", "🧔"), ("언니", "👱‍♀️"), ("동생", "🧒"), ("남편", "🤵"), ("아내", "👰"), ("아들", "👦"), ("딸", "👧"), ("할머니", "👵"), ("할아버지", "👴")],
     [("Bài 1", O("vocab.everyday_basics", "reading.familiar_words"))] * 4)

unit(1, "unit-4", "u3", "Ăn và uống", "Cơm, nước, cà phê, kim chi: gọi món và nói món ăn ngon.", """
## Đồ ăn thức uống

- *밥* — cơm; *물* — nước; *빵* — bánh mì; *우유* — sữa
- *고기* — thịt; *김치* — kim chi; *커피* — cà phê

### Ăn và uống
*먹다* là ăn, *마시다* là uống. Ở dạng lịch sự: *먹어요*, *마셔요*.
- *밥을 먹어요.* — Tôi ăn cơm.
- *커피를 마셔요.* — Tôi uống cà phê.

Động từ luôn đứng **cuối** câu: tân ngữ (*밥을*) đứng trước động từ, ngược với tiếng Việt.

### Xin cái gì đó
Thêm *주세요* (cho tôi) sau món: *물 주세요* — cho tôi nước. Muốn nhẹ lời hơn: *물 좀 주세요*.

### Ngon!
*맛있어요* — ngon. Câu hỏi người Hàn hay nói trước bữa ăn: *밥 먹었어요?* — "Ăn cơm chưa?", cũng là một cách chào hỏi, giống tiếng Việt.

### Trước và sau bữa ăn
*잘 먹겠습니다* trước khi ăn và *잘 먹었습니다* sau khi ăn — nhất là khi người khác mời.
""", [("밥", "🍚"), ("물", "💧"), ("커피", "☕"), ("김치", "🥬"), ("빵", "🍞"), ("우유", "🥛"), ("고기", "🥩"), ("먹다", "🍽️"), ("마시다", "🥤"), ("맛있다", "😋"), ("주세요", "🫴")],
     [("Bài 1", O("vocab.everyday_basics", "reading.familiar_words"))] * 4)

unit(1, "unit-5", "u4", "Số và tiền", "Số Hán-Hàn để đọc giá tiền: 천 원, 만 원.", """
## Số Hán-Hàn

Tiếng Hàn có **hai** hệ số. Hệ đầu tiên là số Hán-Hàn, gần với âm Hán-Việt:
- *일* 1 (nhất), *이* 2 (nhị), *삼* 3 (tam), *사* 4 (tứ), *오* 5 (ngũ)
- *육* 6 (lục), *칠* 7 (thất), *팔* 8 (bát), *구* 9 (cửu), *십* 10 (thập)
- *백* 100 (bách), *천* 1.000 (thiên), *만* 10.000 (vạn)

Người Hàn đếm theo **vạn** (*만*): 10.000 là *만*, 50.000 là *오만*. Đừng đọc "mười nghìn".

### Tiền
Đơn vị là *원* (won): *천 원*, *오천 원*, *만 원*.
- *얼마예요?* — Bao nhiêu tiền?
- *만 오천 원이에요.* — 15.000 won.

### Rẻ và đắt
*싸요* — rẻ; *비싸요* — đắt. *돈* là tiền nói chung.

### Hai hệ số
Số Hán-Hàn dùng cho giá tiền, ngày tháng, phút, số điện thoại, số tầng. Hệ thứ hai (số thuần Hàn) học ở Phần 2: dùng cho giờ, tuổi, đếm đồ vật.
""", [("일", "1️⃣"), ("삼", "3️⃣"), ("오", "5️⃣"), ("십", "🔟"), ("백", "💯"), ("천", "🎟️"), ("만", "💴"), ("원", "🪙"), ("돈", "💰"), ("얼마예요", "💸"), ("싸다", "📉"), ("비싸다", "📈")],
     [("Bài 1", O("numbers.two_systems", "reading.familiar_words"))] * 4)

# ---------------------------------------------------------------- Section 2: the building blocks
unit(2, "unit-a", "ua", "Câu với 이에요 và tiểu từ chủ đề", "은/는 nói về ai, cái gì; 이거, 그거, 저거.", """
## Tiểu từ chủ đề 은 / 는

Tiếng Hàn gắn một **tiểu từ** sau danh từ để cho biết vai trò của nó trong câu. *은 / 는* đánh dấu chủ đề — "nói về":
- sau phụ âm cuối: *이름은*, *선생님은*
- sau nguyên âm: *저는*, *친구는*

*제 이름은 란이에요.* — Tên tôi là Lan.

### Cái này, cái đó, cái kia
- *이거* — cái này (gần người nói)
- *그거* — cái đó (gần người nghe)
- *저거* — cái kia (xa cả hai)

Ba mức giống tiếng Việt "này – đó – kia".

### Hỏi ai, cái gì
- *이거 뭐예요?* / trang trọng *이것은 무엇입니까?* — Cái này là gì?
- *저 사람은 누구예요?* — Người kia là ai?

### Không phải
*아니에요* phủ định câu danh từ: *저는 학생이 아니에요.* — Tôi không phải là học sinh. Trước *아니에요*, danh từ đi với *이 / 가*.

### Trang trọng
*입니다* là dạng trang trọng của *이에요*: *응우옌 남입니다.* Dùng khi tự giới thiệu ở buổi phỏng vấn.
""", [("은", "⭕"), ("는", "🔵"), ("이거", "👇"), ("그거", "👉"), ("저거", "🫵"), ("무엇", "❓"), ("누구", "🕵️"), ("친구", "👫"), ("선생님", "👩‍🏫"), ("아니에요", "🙅"), ("입니다", "🎙️")],
     [("Bài 1", O("sentences.copula", "particles.core")), ("Bài 2", O("sentences.copula", "questions.question_words")), ("Bài 3", O("particles.core", "vocab.everyday_basics")), ("Bài 4", O("sentences.copula", "politeness.speech_levels"))])

unit(2, "unit-b", "ub", "Động từ thể 해요", "가요, 먹어요, 해요: chia động từ lịch sự ở thì hiện tại.", """
## Từ điển và câu nói

Động từ trong từ điển kết thúc bằng *-다*: *가다*, *먹다*, *하다*. Khi nói, bỏ *-다* và thêm đuôi lịch sự *-아요 / -어요*:
- gốc có nguyên âm ㅏ hoặc ㅗ: *가다 → 가요*, *오다 → 와요*, *보다 → 봐요*
- nguyên âm khác: *먹다 → 먹어요*, *마시다 → 마셔요*
- *하다 → 해요*: *일하다 → 일해요*, *공부하다 → 공부해요*

Tiếng Việt không chia động từ; tiếng Hàn đổi đuôi, nhưng thì hiện tại 해요 chỉ có một dạng cho mọi ngôi.

### Tân ngữ: 을 / 를
- sau phụ âm: *밥을 먹어요*
- sau nguyên âm: *커피를 마셔요*

### Nơi làm việc gì đó: 에서
*공장에서 일해요.* — Tôi làm việc ở nhà máy. *에서* đi với hành động (làm, ăn, học).

### Trật tự câu
Chủ ngữ – (nơi chốn) – tân ngữ – **động từ**: *저는 식당에서 밥을 먹어요.* Động từ luôn ở cuối.
""", [("가다", "🚶‍♂️"), ("오다", "🏃"), ("하다", "🛠️"), ("보다", "👀"), ("자다", "😴"), ("일하다", "🧰"), ("공부하다", "📚"), ("만나다", "🤗"), ("을", "🎯"), ("를", "🏹"), ("에서", "📍")],
     [("Bài 1", O("verbs.haeyo_present", "particles.core")), ("Bài 2", O("verbs.haeyo_present", "vocab.everyday_basics")), ("Bài 3", O("particles.core", "verbs.haeyo_present")), ("Bài 4", O("verbs.haeyo_present", "writing.hangul_input"))])

unit(2, "unit-c", "uc", "있어요, 없어요 và tính từ", "Có và không có; to, nhỏ, tốt, nhiều; nhà và phòng.", """
## 있어요 / 없어요

Một chữ "có" của tiếng Việt, tiếng Hàn dùng *있어요*; "không có" là *없어요*:
- *시간이 있어요.* — Tôi có thời gian.
- *화장실이 어디에 있어요?* — Nhà vệ sinh ở đâu?
- *표가 없어요.* — Hết vé.

### Tiểu từ chủ ngữ 이 / 가
Trước *있어요 / 없어요* và trước tính từ, danh từ hay đi với *이 / 가*: *방이 작아요*, *비가 와요*.

### Ở đâu: 에
*에* chỉ nơi có, nơi ở: *집에 있어요.* So sánh: *에서* đi với hành động, *에* đi với *있어요* và với *가요 / 와요*.

### Tính từ là động từ
Tính từ tiếng Hàn chia như động từ: *크다 → 커요*, *작다 → 작아요*, *좋다 → 좋아요*, *많다 → 많아요*. *방이 커요* — phòng rộng: không cần thêm "là".

### Đây, đó, kia
*여기* — ở đây, *거기* — ở đó, *저기* — ở kia.
""", [("있다", "✔️"), ("없다", "✖️"), ("크다", "🗻"), ("작다", "🐜"), ("좋다", "👍"), ("많다", "🧮"), ("집", "🏡"), ("방", "🛋️"), ("여기", "⬇️"), ("거기", "↘️"), ("저기", "↗️"), ("화장실", "🚻"), ("가", "🔸"), ("에", "📌")],
     [("Bài 1", O("existence.itda", "particles.core")), ("Bài 2", O("existence.itda", "vocab.everyday_basics")), ("Bài 3", O("verbs.haeyo_present", "vocab.everyday_basics")), ("Bài 4", O("existence.itda", "writing.hangul_input"))])

unit(2, "unit-d", "ud", "Giờ, ngày, số thuần Hàn và lượng từ", "Hai hệ số: 세 시 십 분, 스무 살, 두 명.", """
## Số thuần Hàn

Hệ số thứ hai là số thuần Hàn: *하나, 둘, 셋, 넷, 다섯, 여섯, 일곱, 여덟, 아홉, 열*. Trước lượng từ, bốn số đầu rút gọn: *한, 두, 세, 네*; 20 là *스물*, trước lượng từ là *스무*.

### Lượng từ
Giống tiếng Việt có "cái, con, người", tiếng Hàn đặt **lượng từ sau số**:
- *명* — người: *두 명*
- *살* — tuổi: *스무 살*
- *시* — giờ: *세 시*
- *병* — chai, *잔* — ly, *장* — tờ

### Giờ: hai hệ số trong một câu
Giờ dùng số thuần Hàn, phút dùng số Hán-Hàn: *세 시 십 분* — 3 giờ 10 phút. *두 시 반* — 2 giờ rưỡi.

### Ngày
*오늘* — hôm nay, *내일* — ngày mai, *월요일* — thứ Hai. Ngày tháng dùng số Hán-Hàn: *오월 일 일* — ngày 1 tháng 5. Lưu ý: tháng 6 đọc *유월*, tháng 10 đọc *시월*.

### Hỏi
*몇 시예요?* — Mấy giờ? *몇 살이에요?* — Bao nhiêu tuổi?
""", [("시", "🕐"), ("분", "⏱️"), ("하나", "☝️"), ("둘", "✌️"), ("셋", "🤟"), ("다섯", "🖐️"), ("열", "🙌"), ("한", "🥇"), ("두", "🥈"), ("세", "🥉"), ("명", "👥"), ("살", "🎂"), ("오늘", "📅"), ("내일", "⏩"), ("월요일", "📆")],
     [("Bài 1", O("numbers.two_systems", "vocab.time_calendar")), ("Bài 2", O("numbers.two_systems", "questions.question_words")), ("Bài 3", O("vocab.time_calendar", "numbers.two_systems")), ("Bài 4", O("numbers.two_systems", "writing.hangul_input"))])

unit(2, "unit-e", "ue", "Chữ và âm tiếng Hàn", "Phụ âm cuối 받침, biến âm, và âm Hán-Việt giúp nhớ từ.", """
## Phụ âm cuối (받침)

Một khối chữ có thể có phụ âm cuối: *학*, *꽃*, *값*. Khi đứng cuối từ, nhiều phụ âm đọc gọn lại thành 7 âm: ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅇ. *꽃* và *옷* đều kết thúc bằng âm "t" khép.

### Nối âm
Khi sau phụ âm cuối là nguyên âm, phụ âm đó **nối sang**: *읽어요* đọc gần như "il-geo-yo", *앉으세요* như "an-jeu-se-yo". Chữ viết không đổi, chỉ cách đọc đổi.

### Biến âm trước ㄴ, ㅁ
*합니다* đọc là [함니다], *감사합니다* là [감사함니다]. Tiếng Việt không có hiện tượng này, nên hãy nghe nhiều.

### Ba loại phụ âm
*가 / 까 / 카*, *다 / 따 / 타*: thường, căng, bật hơi. Tiếng Việt chỉ phân biệt "t" và "th"; tiếng Hàn có ba mức.

### Âm Hán-Việt
Nhiều từ Hán-Hàn nghe gần tiếng Việt: *학교* học hiệu (trường học), *시간* thời gian, *전화* điện thoại, *한국어* Hàn Quốc ngữ. Nhưng cẩn thận "bạn giả": *공장* là nhà máy, không phải công trường.
""", [("학교", "🏫"), ("시간", "⌛"), ("전화", "☎️"), ("가방", "🎒"), ("꽃", "🌸"), ("옷", "👕"), ("값", "🔖"), ("읽다", "📖"), ("앉다", "🪑"), ("한국어", "🗣️")],
     [("Bài 1", O("pronunciation.batchim_sounds", "script.hangul")), ("Bài 2", O("pronunciation.batchim_sounds", "writing.hangul_input")), ("Bài 3", O("script.hanviet", "strategy.hanviet_loanwords")), ("Bài 4", O("strategy.hanviet_loanwords", "pronunciation.batchim_sounds"))])

# ---------------------------------------------------------------- Section 3: understanding everyday Korean
unit(3, "unit-f", "uf", "Nghe từ: thời tiết và bốn mùa", "Nghe từ quen thuộc qua giọng đọc của máy: mưa, nóng, lạnh, bốn mùa.", """
## Nghe bằng giọng đọc của máy

Khoá tiếng Hàn chưa có âm thanh thu sẵn. Các câu nghe được đọc bằng **giọng tiếng Hàn cài trên điện thoại**. Nếu máy chưa có giọng đó, app sẽ báo "chưa có giọng đọc trên máy", chỉ cách cài, và câu đó được bỏ qua — không tính là sai.

### Thời tiết
- *날씨* — thời tiết: *오늘 날씨가 좋아요.*
- *비가 와요* — trời mưa (mưa "đến"); *바람이 불어요* — gió thổi
- *더워요* — nóng; *추워요* — lạnh

### Bốn mùa
*봄* xuân, *여름* hè, *가을* thu, *겨울* đông. Mùa đông ở Hàn Quốc rất lạnh, thường dưới 0 độ — người từ miền Nam Việt Nam cần chuẩn bị áo ấm.

### Mẹo nghe
- Nghe từ khóa trước: *비*, *추워요*.
- Đuôi *-아요 / -어요* thường ở cuối, đừng bỏ lỡ phần trước nó.
- Bấm nghe chậm khi luyện tập; trong bài kiểm tra chỉ được nghe hai lần.

### Mang ô
*우산* là ô. *우산을 가져가세요* — mang ô theo nhé.
""", [("날씨", "🌤️"), ("비", "🌧️"), ("덥다", "🥵"), ("춥다", "🥶"), ("봄", "🌱"), ("여름", "☀️"), ("가을", "🍂"), ("겨울", "❄️"), ("바람", "🌬️"), ("우산", "☂️")],
     [("Bài 1", O("listening.familiar_words", "vocab.everyday_basics")), ("Bài 2", O("listening.familiar_words", "listening.short_info")), ("Bài 3", O("listening.short_info", "vocab.time_calendar")), ("Bài 4", O("listening.familiar_words", "reading.short_texts"))])

unit(3, "unit-g", "ug", "Biển báo và nội quy ở nhà máy", "위험, 금연, 출입 금지: đọc biển báo và nghe chỉ dẫn an toàn.", """
## An toàn là trên hết

Ở nhà máy Hàn Quốc, biển báo viết bằng Hangul, đôi khi có chữ Hán. Những từ cần biết ngay ngày đầu:
- *위험* — nguy hiểm
- *금지* — cấm; *출입 금지* — cấm vào
- *금연* — cấm hút thuốc
- *비상구* — lối thoát hiểm
- *소화기* — bình chữa cháy

### Đồ bảo hộ
*안전모* — mũ bảo hộ, *장갑* — găng tay, *안전화* — giày bảo hộ. Câu bạn sẽ nghe mỗi ngày: *안전모를 쓰세요.* — Hãy đội mũ bảo hộ.

### Nội quy: -지 마세요
*-지 마세요* nghĩa là "đừng": *만지지 마세요* — đừng chạm vào; *들어가지 마세요* — đừng vào.

### "Bạn giả" Hán-Việt
*비상구* đọc Hán-Việt là "phi thường khẩu", nhưng *비상* ở đây là **khẩn cấp**, không phải "phi thường". *공장* là nhà máy, không phải "công trường".

### Cẩn thận
*조심하세요* — cẩn thận nhé. Khi máy có tiếng lạ hay dừng, báo ngay cho *반장님* (tổ trưởng).
""", [("공장", "🏭"), ("안전", "🦺"), ("안전모", "⛑️"), ("위험", "⚠️"), ("금지", "🚫"), ("금연", "🚭"), ("비상구", "🚪"), ("소화기", "🧯"), ("장갑", "🧤"), ("기계", "⚙️"), ("조심하다", "🧐"), ("작업", "🔧")],
     [("Bài 1", O("reading.notices_info", "vocab.work_korea")), ("Bài 2", O("listening.announcements", "verbs.requests_rules")), ("Bài 3", O("reading.notices_info", "strategy.hanviet_loanwords")), ("Bài 4", O("listening.announcements", "reading.notices_info"))])

unit(3, "unit-h", "uh", "Thông báo trên tàu điện và xe buýt", "Ga sau, cửa ra, đổi tuyến: nghe thông báo và đọc bảng chỉ dẫn.", """
## Đi tàu điện ngầm

- *지하철* — tàu điện ngầm; *역* — ga; *버스* — xe buýt; *정류장* — trạm xe buýt
- *출구* — lối ra; *입구* — lối vào
- *표* — vé (ở Hàn Quốc người ta thường dùng thẻ giao thông)

### Thông báo bạn sẽ nghe
- *다음 역은 시청역입니다.* — Ga sau là ga Toà thị chính.
- *내리실 문은 오른쪽입니다.* — Cửa xuống ở bên phải.
- *갈아타실 분은* … — Hành khách muốn đổi tuyến …

Thông báo dùng kiểu trang trọng *-ㅂ니다* và kính ngữ *-시-*: bạn chỉ cần nhận ra từ khóa (*다음*, *역*, *내리*, *갈아타*).

### Động từ
- *타다* — lên (xe): *버스를 타요* (dùng *을 / 를*, khác tiếng Việt "đi xe buýt")
- *내리다* — xuống: *다음 역에서 내려요*
- *갈아타다* — đổi tuyến

### "Bạn giả"
*출구* đọc Hán-Việt là "xuất khẩu", *입구* là "nhập khẩu" — nhưng ở đây là **lối ra, lối vào**, không phải xuất nhập khẩu hàng hoá.
""", [("지하철", "🚇"), ("버스", "🚌"), ("역", "🚉"), ("출구", "↪️"), ("입구", "↩️"), ("타다", "🚋"), ("내리다", "🛬"), ("갈아타다", "🔄"), ("정류장", "🚏"), ("표", "🎫"), ("다음", "⏭️")],
     [("Bài 1", O("listening.announcements", "vocab.everyday_basics")), ("Bài 2", O("reading.notices_info", "strategy.hanviet_loanwords")), ("Bài 3", O("listening.announcements", "listening.short_info")), ("Bài 4", O("reading.notices_info", "listening.announcements"))])

unit(3, "unit-i", "ui", "Ở cửa hàng tiện lợi", "Gimbap, cơm hộp, túi và hoá đơn: hội thoại ngắn ở 편의점.", """
## 편의점

Cửa hàng tiện lợi (*편의점*) ở khắp nơi và mở cả đêm: bạn mua *김밥*, *도시락* (cơm hộp), *라면*, nước, và có thể trả tiền điện thoại hay nhận bưu kiện.

### Ở quầy thanh toán
Nhân viên sẽ hỏi:
- *봉투 필요하세요?* — Anh có cần túi không? (túi thường mất tiền)
- *데워 드릴까요?* — Có cần hâm nóng không?
- *영수증 드릴까요?* — Có lấy hoá đơn không?

Bạn trả lời: *네, 주세요* hoặc *아니요, 괜찮아요*.

### Trả tiền
- *카드로 계산할게요.* — Tôi trả bằng thẻ.
- *현금으로 할게요.* — Tôi trả tiền mặt.
*계산하다* là thanh toán, tính tiền.

### Hai người nói
Trong bài nghe có hai người: giọng thứ hai đọc trầm hơn. Câu hỏi thường ở người bán, câu trả lời ở người mua.

### Mua
*사다* — mua: *물을 사요.* Đã mua: *샀어요*.
""", [("편의점", "🏪"), ("김밥", "🍙"), ("도시락", "🍱"), ("라면", "🍜"), ("봉투", "🛍️"), ("영수증", "🧾"), ("카드", "💳"), ("현금", "💵"), ("계산하다", "🛒"), ("사다", "🧺")],
     [("Bài 1", O("listening.short_dialogues", "vocab.everyday_basics")), ("Bài 2", O("reading.short_messages", "listening.short_dialogues")), ("Bài 3", O("listening.short_info", "numbers.two_systems")), ("Bài 4", O("listening.short_dialogues", "reading.short_texts"))])

unit(3, "unit-j", "uj", "Ký túc xá và nhà ở", "Phòng, chìa khoá, rác, tiền thuê: đọc nội quy ký túc xá.", """
## Ở ký túc xá

Nhiều lao động sống ở *기숙사* (ký túc xá — âm Hán-Việt gần như y hệt) của công ty. Từ cần biết:
- *열쇠* — chìa khoá; *침대* — giường; *냉장고* — tủ lạnh; *세탁기* — máy giặt
- *월세* — tiền thuê nhà hằng tháng
- *쓰레기* — rác

### Phân loại rác
Ở Hàn Quốc, rác phải chia loại và bỏ đúng ngày. Bảng nội quy thường ghi: *쓰레기는 여기에 버리세요* — bỏ rác ở đây. Đọc kỹ ngày giờ trên bảng.

### Đọc nội quy
Nội quy hay dùng:
- *-(으)세요* — hãy: *조용히 하세요* (giữ yên lặng)
- *-지 마세요* — đừng: *담배를 피우지 마세요*
- *-(으)면 안 돼요* — không được

### Hỏi chủ nhà, tổ trưởng
*세탁기가 고장 났어요.* — Máy giặt bị hỏng. *뭐가 문제예요?* — Có vấn đề gì?

### Yên tĩnh
*조용하다* — yên tĩnh, *깨끗하다* — sạch: hai tính từ bạn sẽ đọc trên mọi bảng nội quy.
""", [("기숙사", "🏢"), ("열쇠", "🔑"), ("침대", "🛏️"), ("냉장고", "🧊"), ("세탁기", "🫧"), ("월세", "🏘️"), ("쓰레기", "🗑️"), ("조용하다", "🤫"), ("깨끗하다", "✨"), ("문", "🔒")],
     [("Bài 1", O("reading.notices_info", "vocab.everyday_basics")), ("Bài 2", O("reading.short_messages", "verbs.requests_rules")), ("Bài 3", O("reading.short_texts", "existence.itda")), ("Bài 4", O("reading.notices_info", "reading.short_texts"))])

# ---------------------------------------------------------------- Section 4: speaking
unit(4, "unit-k", "uk", "Chào hỏi ở chỗ làm", "Nói lời chào trang trọng với giám đốc, tổ trưởng, đồng nghiệp.", """
## Ba kiểu nói

1. *합니다* — trang trọng: *알겠습니다*, *수고하셨습니다*, *감사합니다*. Dùng với giám đốc (*사장님*), trong cuộc họp, khi báo cáo.
2. *해요* — lịch sự thân thiện: dùng hằng ngày với đồng nghiệp, người bán hàng.
3. *반말* — nói trống không với bạn thân, người nhỏ tuổi hơn. **Đừng** dùng với cấp trên.

Ở chỗ làm, an toàn nhất là *해요* và các câu *합니다* cố định.

### Câu nói mỗi ngày
- Vào ca: *안녕하세요*, hoặc *좋은 아침입니다*
- Nhận việc: *네, 알겠습니다*
- Về trước: *먼저 가보겠습니다* hoặc *수고하세요*
- Hết ca: *수고하셨습니다*

### Gọi người
*사장님* (giám đốc), *반장님* (tổ trưởng): thêm *님* để tỏ kính trọng. Với đồng nghiệp gọi tên + *씨*: *민수 씨*. Không gọi cấp trên bằng tên.

### Đi làm, tan làm
*출근* — đi làm, *퇴근* — tan làm: *몇 시에 퇴근해요?*
""", [("사장님", "👔"), ("반장님", "🧑‍🔧"), ("동료", "🤜"), ("출근", "🌅"), ("퇴근", "🌇"), ("알겠습니다", "🫡"), ("회사", "🏬"), ("씨", "🔤"), ("일찍", "🐓"), ("늦다", "🐢")],
     [("Bài 1", O("speaking.formulaic", "politeness.speech_levels")), ("Bài 2", O("speaking.formulaic", "greetings.basic")), ("Bài 3", O("politeness.speech_levels", "speaking.formulaic")), ("Bài 4", O("speaking.formulaic", "interaction.everyday_conversation"))])

unit(4, "unit-l", "ul", "Tự giới thiệu khi phỏng vấn", "Tên, quê, tuổi, kinh nghiệm: nói về mình ở buổi phỏng vấn.", """
## Giới thiệu bản thân

Buổi phỏng vấn hay ngày đầu đi làm thường bắt đầu như sau:
1. *처음 뵙겠습니다.*
2. *저는 응우옌 남입니다.* (tên)
3. *베트남 하노이에서 왔습니다.* (quê)
4. *스물다섯 살입니다.* (tuổi)
5. *공장에서 일한 경험이 있습니다.* (kinh nghiệm)
6. *잘 부탁드립니다.*

Ở phỏng vấn, dùng kiểu trang trọng *-습니다 / -ㅂ니다*.

### Câu hỏi thường gặp
- *고향이 어디예요?* — Quê bạn ở đâu?
- *나이가 어떻게 되세요?* — Bạn bao nhiêu tuổi?
- *결혼했어요?* — Bạn lập gia đình chưa?
- *취미가 뭐예요?* — Sở thích của bạn là gì?

### Thích
*좋아하다* — thích: *축구를 좋아해요*. Giỏi: *잘해요* — *한국어를 잘해요?* Trả lời khiêm tốn: *조금 해요.*

### 취미 không phải "thú vị"
*취미* đọc Hán-Việt là "thú vị", nhưng nghĩa là **sở thích**.
""", [("나라", "🌏"), ("나이", "🔢"), ("직업", "🧑‍💼"), ("경험", "🗂️"), ("면접", "🎤"), ("고향", "🏞️"), ("결혼", "💍"), ("취미", "🎨"), ("좋아하다", "❤️"), ("잘", "⭐")],
     [("Bài 1", O("speaking.self_intro", "sentences.copula")), ("Bài 2", O("speaking.self_intro", "politeness.speech_levels")), ("Bài 3", O("speaking.self_intro", "wants.goshipda")), ("Bài 4", O("speaking.self_intro", "interaction.everyday_conversation"))])

unit(4, "unit-m", "um", "Nói số và giờ", "Số điện thoại, giờ làm, giá tiền: nói số cho đúng hệ.", """
## Số điện thoại

Số điện thoại đọc từng chữ số, bằng số Hán-Hàn; số 0 đọc là *공*: 010-1234-5678 → *공일공 일이삼사 오육칠팔*. Gạch nối đọc là *에*.

### Giờ làm
- *오전* — buổi sáng (AM), *오후* — buổi chiều (PM)
- *일곱 시* (7 giờ), *여덟 시* (8 giờ), *아홉 시 반* (9 giờ rưỡi)
- *오전 여덟 시에 출근해요.* — Tôi đi làm lúc 8 giờ sáng.

Nhớ: giờ là số thuần Hàn, phút là số Hán-Hàn.

### Hỏi
- *몇 시에 끝나요?* — Mấy giờ xong?
- *전화번호가 뭐예요?* — Số điện thoại của bạn là gì?
- *얼마예요?* — Bao nhiêu tiền?

### Nói chậm, nói rõ
Khi nói số, nói chậm từng nhóm. Nếu người kia hỏi lại, nhắc lại và dùng tay chỉ số. Máy nhận dạng giọng nói chấp nhận cả chữ số (7) lẫn chữ (*일곱*).
""", [("전화번호", "📱"), ("번호", "#️⃣"), ("오전", "🌄"), ("오후", "🌆"), ("반", "🌗"), ("몇", "❔"), ("얼마", "💲"), ("일곱", "7️⃣"), ("여덟", "8️⃣"), ("아홉", "9️⃣")],
     [("Bài 1", O("speaking.give_info", "numbers.two_systems")), ("Bài 2", O("speaking.give_info", "vocab.time_calendar")), ("Bài 3", O("speaking.give_info", "questions.question_words")), ("Bài 4", O("speaking.give_info", "interaction.practical_needs"))])

unit(4, "unit-n", "un", "Kể và mô tả", "Hôm qua, cuối tuần: kể việc đã làm và nói nó thế nào.", """
## Quá khứ: 았어요 / 었어요

Tiếng Việt thêm "đã"; tiếng Hàn đổi đuôi động từ:
- ㅏ, ㅗ: *가다 → 갔어요*, *보다 → 봤어요*
- nguyên âm khác: *먹다 → 먹었어요*, *마시다 → 마셨어요*
- *하다 → 했어요*: *일했어요*, *공부했어요*

*어제 친구를 만났어요.* — Hôm qua tôi gặp bạn.

### Mô tả
Tính từ cũng có quá khứ: *재미있었어요* (đã vui), *힘들었어요* (đã vất vả).
- *재미있다* — thú vị, *힘들다* — vất vả
- *피곤하다* — mệt, *바쁘다* — bận
- *예쁘다* — đẹp, *친절하다* — tốt bụng

### Kể một ngày
*주말에 시장에 갔어요. 사람이 많았어요. 과일이 쌌어요.* Ba câu ngắn là đủ: ai, làm gì, thế nào.

### Không ngon
*맛없어요* — dở (ngược với *맛있어요*). Lịch sự hơn: *제 입에는 좀 안 맞아요* — không hợp khẩu vị tôi lắm.

### Bạn hỏi lại
Người nghe hay hỏi *그래요?* (vậy à?) hoặc *재미있었어요?* (có vui không?). Trả lời ngắn: *네, 재미있었어요.*
""", [("어제", "⏪"), ("주말", "🎡"), ("재미있다", "😄"), ("힘들다", "😓"), ("피곤하다", "😪"), ("바쁘다", "🏃‍♀️"), ("예쁘다", "🌺"), ("맛없다", "🤢"), ("친절하다", "😇")],
     [("Bài 1", O("speaking.describe", "verbs.past_future")), ("Bài 2", O("speaking.describe", "vocab.everyday_basics")), ("Bài 3", O("verbs.past_future", "speaking.describe")), ("Bài 4", O("speaking.describe", "speaking.self_intro"))])

# ---------------------------------------------------------------- Section 5: writing
unit(5, "unit-o", "uo", "Viết về mình", "Gõ Hangul trên điện thoại: tên, tuổi, nơi ở, công việc.", """
## Bàn phím Hangul

Trên điện thoại, thêm bàn phím **한국어** (thường là kiểu 두벌식: phụ âm bên trái, nguyên âm bên phải). Gõ theo thứ tự: phụ âm đầu → nguyên âm → phụ âm cuối; máy tự ghép thành khối: ㅎ + ㅏ + ㄱ → *학*.

### Viết về mình
- *제 이름은 …이에요 / 예요.*
- *저는 스물다섯 살이에요.*
- *저는 안산에 살아요.* — Tôi sống ở Ansan.
- *저는 공장에서 일해요.*

*살다* — sống: *살아요*. Nơi sống đi với *에*.

### Địa chỉ, sinh nhật
- *주소* — địa chỉ
- *생일* — sinh nhật: *제 생일은 삼월 십 일이에요.*

### Lỗi hay gặp
- Quên phụ âm cuối: *읽어요*, không phải *일어요*.
- Gõ nhầm *이에요 / 예요*: nhìn chữ cuối có 받침 hay không.
- Viết cách chữ (띄어쓰기) chưa bị chấm ở trình độ này, nhưng hãy cách sau tiểu từ: *저는 공장에서*.
""", [("살다", "🛖"), ("주소", "📮"), ("생일", "🎈"), ("우리", "👪"), ("저희", "🧑‍🤝‍🧑"), ("영어", "🔠"), ("베트남어", "🗨️"), ("제", "🪞")],
     [("Bài 1", O("writing.personal_info", "writing.hangul_input")), ("Bài 2", O("writing.personal_info", "sentences.copula")), ("Bài 3", O("writing.hangul_input", "writing.personal_info")), ("Bài 4", O("writing.personal_info", "writing.form_filling"))])

unit(5, "unit-p", "up", "Câu đơn giản và từ nối", "그리고, 그래서, 하지만; 안 và 못: viết câu nối và câu phủ định.", """
## Nối câu

- *그리고* — và, rồi: *밥을 먹어요. 그리고 쉬어요.*
- *그래서* — vì vậy: *비가 와요. 그래서 우산을 써요.*
- *그런데* — nhưng mà: *좋아요. 그런데 비싸요.*
- *하지만* — nhưng (trang trọng hơn)

Ở trình độ này, viết hai câu ngắn rồi nối bằng một từ nối là đủ.

### Phủ định: 안 và 못
Tiếng Việt chỉ có "không"; tiếng Hàn tách hai ý:
- *안* — không (không muốn, không làm): *술을 안 마셔요.*
- *못* — không thể: *오늘은 못 가요.*
*안 / 못* đứng ngay **trước** động từ. Với *하다*: *공부 안 해요* (không phải *안 공부해요*).

### Bao lâu một lần
*항상* — luôn luôn, *자주* — thường, *가끔* — thỉnh thoảng: đặt trước động từ.

### Viết
Viết 3–4 câu về một ngày làm việc, dùng ít nhất một từ nối và một câu phủ định.
""", [("그리고", "➕"), ("그래서", "⤵️"), ("그런데", "🔀"), ("하지만", "⚖️"), ("안", "🚷"), ("못", "🙊"), ("자주", "🔁"), ("가끔", "🎲"), ("항상", "♾️")],
     [("Bài 1", O("writing.phrases_sentences", "negation.an_mot")), ("Bài 2", O("writing.phrases_sentences", "verbs.haeyo_present")), ("Bài 3", O("negation.an_mot", "writing.phrases_sentences")), ("Bài 4", O("writing.phrases_sentences", "verbs.past_future"))])

unit(5, "unit-q", "uq", "Tin nhắn cho tổ trưởng", "Báo ốm, xin nghỉ, báo đến muộn: một tin nhắn ngắn và lịch sự.", """
## Một tin nhắn ba phần

1. Chào: *반장님, 안녕하세요. 남입니다.*
2. Thông tin: *오늘 감기에 걸렸어요. 병원에 가야 해요.*
3. Kết: *죄송합니다.* hoặc *감사합니다.*

Tin nhắn (*문자*) cho cấp trên luôn có tên mình và lời xin lỗi hay cảm ơn.

### Lý do
- *아파요* — tôi ốm, đau
- *감기에 걸렸어요* — tôi bị cảm
- *병원에 가요* — tôi đi bệnh viện
- *버스가 늦어요* — xe buýt đến muộn

### Xin nghỉ
*휴가* — nghỉ phép: *다음 주에 휴가를 신청하고 싶어요.* Ở trình độ này chỉ cần: *내일 쉬고 싶어요.*

### Gửi và gọi
*보내다* — gửi: *문자를 보냈어요.* *전화하다* — gọi điện: *이따가 전화할게요.* — lát nữa tôi gọi.

### Đừng dùng 반말
Không viết *나 아파* với cấp trên. Luôn dùng *-요* hoặc *-습니다*.

### Gửi sớm
Báo trước giờ vào ca, không đợi đến muộn mới nhắn. Nếu tổ trưởng gọi lại, xem bài gọi điện ở Phần 6.
""", [("문자", "💬"), ("휴가", "🏖️"), ("아프다", "🤒"), ("감기", "🤧"), ("병원", "🏥"), ("전화하다", "📞"), ("보내다", "📤"), ("미안해요", "😔")],
     [("Bài 1", O("writing.short_message", "politeness.speech_levels")), ("Bài 2", O("writing.short_message", "vocab.time_calendar")), ("Bài 3", O("writing.short_message", "verbs.past_future")), ("Bài 4", O("writing.short_message", "reading.short_messages"))])

unit(5, "unit-r", "ur", "Giấy tờ ở trung tâm việc làm", "Thẻ người nước ngoài, hộ chiếu, hợp đồng: điền biểu mẫu ở 고용센터.", """
## Giấy tờ quan trọng

- *외국인 등록증* — thẻ đăng ký người nước ngoài: mang theo luôn
- *여권* — hộ chiếu
- *계약서* — hợp đồng lao động: đọc kỹ giờ làm, lương, ngày nghỉ
- *서류* — giấy tờ, hồ sơ

### 고용센터
Trung tâm hỗ trợ việc làm (*고용센터*) giúp lao động EPS khi đổi nơi làm việc, gia hạn hợp đồng hay có vấn đề với chủ. Ở đó có thể có phiên dịch tiếng Việt.

### Biểu mẫu
Các ô thường gặp:
- *이름* — họ tên; *생년월일* — ngày tháng năm sinh
- *주소* — địa chỉ; *전화번호* — số điện thoại
- *국적* — quốc tịch: *베트남*

Viết ngày sinh theo thứ tự năm – tháng – ngày, ngược với Việt Nam: 1999년 5월 20일.

### Ảnh và chữ ký
*사진* — ảnh (thường cần ảnh thẻ). *여기에 이름을 쓰세요* — hãy viết tên vào đây.

### Lương
*월급* — lương tháng: *월급을 받았어요.* Lương thường vào tài khoản *은행*.
""", [("고용센터", "🏛️"), ("외국인 등록증", "🪪"), ("서류", "📄"), ("여권", "🛂"), ("계약서", "📝"), ("월급", "💶"), ("은행", "🏦"), ("사진", "📷"), ("쓰다", "✍️")],
     [("Bài 1", O("writing.form_filling", "vocab.work_korea")), ("Bài 2", O("writing.form_filling", "numbers.two_systems")), ("Bài 3", O("writing.personal_info", "writing.form_filling")), ("Bài 4", O("writing.form_filling", "reading.notices_info"))])

# ---------------------------------------------------------------- Section 6: conversation
unit(6, "unit-s", "us", "Cửa hàng và quán ăn", "Gọi món, hỏi cay không, gọi nhân viên: hội thoại ở quán ăn.", """
## Vào quán

Nhân viên: *어서 오세요. 몇 분이세요?* — Xin mời vào. Mấy người ạ? Bạn: *두 명이에요.*

### Gọi món
- *메뉴 좀 보여 주세요.* — Cho tôi xem thực đơn.
- *김치찌개 하나 주세요.* — Cho tôi một canh kim chi.
- *안 맵게 해 주세요.* — Làm không cay giúp tôi.

Gọi nhân viên: *여기요!* hoặc *저기요!* Ở Hàn Quốc gọi to như vậy là bình thường.

### Đồ uống
*주스*, *맥주*, *콜라*. *물은 셀프예요* — nước tự lấy: nhiều quán để nước ở góc.

### Cay
*맵다* — cay: *이거 매워요?* — Cái này cay không? Món Hàn nhiều ớt, nhưng khác vị cay của ớt Việt.

### Trả tiền
Thường trả ở quầy khi ra về: *계산해 주세요.* Không cần tiền boa.

### Trò chuyện
Trong bài hội thoại, máy đọc lời của người bán; bạn nói câu trả lời. Nói không được thì bấm *bỏ qua*: không bị tính sai.
""", [("식당", "🍴"), ("메뉴", "📋"), ("맵다", "🌶️"), ("여기요", "🙋‍♂️"), ("어서 오세요", "🛎️"), ("주스", "🧃"), ("맥주", "🍺"), ("음식", "🥘")],
     [("Bài 1", O("interaction.practical_needs", "speaking.formulaic")), ("Bài 2", O("interaction.practical_needs", "listening.short_dialogues")), ("Bài 3", O("interaction.everyday_conversation", "interaction.practical_needs")), ("Bài 4", O("interaction.practical_needs", "speaking.give_info"))])

unit(6, "unit-t", "ut", "Hỏi đường, đi tàu", "Bên phải, bên trái, đi thẳng: hỏi đường và hiểu câu trả lời.", """
## Hỏi đường

- *실례합니다. 역이 어디예요?* — Xin lỗi, ga ở đâu ạ?
- *은행에 어떻게 가요?* — Đến ngân hàng đi thế nào?

### Câu trả lời
- *똑바로 가세요* — đi thẳng
- *오른쪽으로 가세요* — đi về bên phải; *왼쪽* — bên trái
- *앞* — trước, *뒤* — sau, *옆* — bên cạnh: *편의점 옆에 있어요*
- *가까워요* — gần; *멀어요* — xa

### Đi bộ hay đi xe
*걸어서 가요* — đi bộ; *버스로 가요* — đi xe buýt. *얼마나 걸려요?* — Mất bao lâu? *십 분 걸려요* — mất mười phút.

### Nhờ nói lại
Không hiểu thì nói: *다시 말해 주세요* hoặc *천천히 말해 주세요*. Trong bài hội thoại, nhờ nói lại không bị trừ điểm.

### 길
*길* — đường: *길을 잃었어요* — tôi bị lạc đường. Bản đồ trên điện thoại là bạn tốt nhất, nhưng biết hỏi vẫn cần.
""", [("길", "🛣️"), ("오른쪽", "➡️"), ("왼쪽", "⬅️"), ("똑바로", "⬆️"), ("가깝다", "🧲"), ("멀다", "🔭"), ("앞", "🔜"), ("뒤", "🔙"), ("옆", "↔️"), ("걷다", "👣")],
     [("Bài 1", O("interaction.practical_needs", "listening.short_info")), ("Bài 2", O("interaction.everyday_conversation", "questions.question_words")), ("Bài 3", O("interaction.practical_needs", "speaking.give_info")), ("Bài 4", O("interaction.practical_needs", "listening.short_dialogues"))])

unit(6, "unit-u", "uu", "Phòng khám và nhà thuốc", "Đau ở đâu, bị gì, uống thuốc thế nào: đi khám bằng tiếng Hàn.", """
## Ở phòng khám

1. Đăng ký: *접수하세요* — xin đăng ký. Đưa thẻ người nước ngoài và thẻ bảo hiểm.
2. Bác sĩ hỏi: *어디가 아파요?* — Bạn đau ở đâu?
3. Bạn nói: *머리가 아파요*, *배가 아파요*, *목이 아파요*.

### Bộ phận cơ thể
*머리* đầu, *눈* mắt, *목* cổ họng, *배* bụng, *허리* lưng, *손* tay, *발* chân. Mẫu câu: **bộ phận + 이/가 아파요**.

### Triệu chứng
- *감기에 걸렸어요* — tôi bị cảm
- *열이 나요* — tôi bị sốt
- *기침이 나요* — tôi bị ho

### Nhà thuốc
*약국* — nhà thuốc; *약* — thuốc. Dược sĩ dặn: *하루에 세 번 드세요* — uống ngày ba lần; *식사 후에* — sau bữa ăn.

### Bảo hiểm
*보험* — bảo hiểm. Lao động EPS có bảo hiểm y tế; mang thẻ khi đi khám.

### Bạn giả
*약국* đọc Hán-Việt là "dược cục": chỉ là nhà thuốc, không phải cơ quan nhà nước.
""", [("약국", "⚕️"), ("약", "💊"), ("의사", "👨‍⚕️"), ("머리", "🧠"), ("배", "🫃"), ("목", "🦒"), ("손", "✋"), ("발", "🦶"), ("기침", "😷"), ("보험", "🛡️")],
     [("Bài 1", O("interaction.practical_needs", "vocab.everyday_basics")), ("Bài 2", O("interaction.practical_needs", "listening.short_dialogues")), ("Bài 3", O("interaction.everyday_conversation", "speaking.give_info")), ("Bài 4", O("interaction.practical_needs", "listening.short_info"))])

unit(6, "unit-v", "uv", "Gọi điện cho chỗ làm và ngân hàng", "Alô, tôi ốm, tôi đến muộn: gọi cho tổ trưởng; mở tài khoản.", """
## Gọi điện

- *여보세요?* — Alô?
- *반장님, 저 남이에요.* — Tổ trưởng ơi, em là Nam.
- *오늘 아파서 못 가요.* — Hôm nay em ốm nên không đi được.
- *삼십 분 늦을 것 같아요.* — Chắc em đến muộn ba mươi phút.
- *죄송합니다.*

Gọi điện khó hơn nói trực tiếp: không thấy mặt, không có cử chỉ. Chuẩn bị trước hai câu chính.

### Ngân hàng
- *통장을 만들고 싶어요.* — Tôi muốn mở tài khoản.
- *외국인 등록증 있으세요?* — Anh có thẻ người nước ngoài không?
- *베트남으로 돈을 보내고 싶어요.* — Tôi muốn gửi tiền về Việt Nam.

### Điện thoại
*핸드폰* — điện thoại di động (khẩu ngữ); *충전기* — cục sạc; *비밀번호* — mật khẩu: không bao giờ nói mật khẩu cho người lạ qua điện thoại.

### Liên lạc
*전화하다* gọi; *문자를 보내다* nhắn tin. Khi không nghe rõ: *잘 안 들려요* — tôi nghe không rõ.
""", [("여보세요", "📲"), ("핸드폰", "🤳"), ("충전기", "🔌"), ("비밀번호", "🔐"), ("인터넷", "🌐"), ("컴퓨터", "💻")],
     [("Bài 1", O("interaction.practical_needs", "speaking.formulaic")), ("Bài 2", O("interaction.everyday_conversation", "politeness.speech_levels")), ("Bài 3", O("interaction.practical_needs", "speaking.give_info")), ("Bài 4", O("interaction.practical_needs", "interaction.everyday_conversation"))])

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

os.makedirs(f"{ROOT}/content/ko/_drafts/units", exist_ok=True)
with open(f"{ROOT}/content/ko/_drafts/units/OUTPUT.jsonl", "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(lines) + "\n")
profile = f"{ROOT}/content/ko/_drafts/staged/content/courses/{C}.profile.json"
os.makedirs(os.path.dirname(profile), exist_ok=True)
with open(profile, "w", encoding="utf-8", newline="\n") as f:
    # QC 2026-11-05 §2.1: listening graded through the device voice (the pack's audio policy is device-tts).
    json.dump({"role": "primary", "allowUnreviewed": True, "betaUntilReviewed": True, "deviceVoiceScoredListening": True}, f, indent=2)
    f.write("\n")
# The inherited ko-en basic pack is never edited; once ko-vi is the primary course it stands alone like ja-en:
# its own lessons, no shared daily words or FSRS stream (the syllabus and its units belong to ko-vi).
with open(f"{ROOT}/content/ko/_drafts/staged/content/courses/ko-en.profile.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump({"basicPack": True, "role": "standalone", "enabled": {"fsrs": False, "dailySession": False}}, f, indent=2)
    f.write("\n")
print(len(lines), "units,", sum(len(u["words"]) for u in UNITS), "words,", sum(len(u["lessons"]) for u in UNITS), "lessons")

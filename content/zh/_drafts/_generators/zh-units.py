"""Units of zh-vi: content/zh/_drafts/units/OUTPUT.jsonl and the staged course profile. The units ingest takes the pack
header (language names, flag) from the sibling zh-en pack.

Words are (surface, emoji); the Vietnamese gloss is copied from the lexicon. Only A1 lexemes may be taught here: the
words of core-a2.txt are band A2-1. Every other syllabus lexeme reaches a unit through TOPIC_UNITS in zh-lex.py.
Guidebooks show Chinese in simplified characters with the tone-marked pinyin in brackets the first time (pinyin is the
reading aid, never the word itself); Hán-Việt only where the brief says it helps. usage: python -I zh-units.py <repo root>
"""
import json, os, sys

sys.stdout.reconfigure(encoding="utf-8")
ROOT = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
lex = json.load(open(f"{ROOT}/content/zh/lexicon/lexemes.json", encoding="utf-8"))["lexemes"]
GLOSS = {x["surface"]: x["glosses"]["vi"] for x in lex}
LATER = set()
for line in open(os.path.join(HERE, "core-a2.txt"), encoding="utf-8"):
    if line.strip() and not line.startswith("#"):
        LATER.add(line.split("|")[1])
C = "zh-vi"
S = {
    1: "Phần 1: Nhập môn",
    2: "Phần 2: Viên gạch nền",
    3: "Phần 3: Hiểu tiếng Trung hằng ngày",
    4: "Phần 4: Nói những câu tiếng Trung đầu tiên",
    5: "Phần 5: Viết tiếng Trung hằng ngày",
    6: "Phần 6: Trò chuyện với ai đó",
}
O = lambda *xs: [f"zh.obj.{x}" for x in xs]
UNITS = []


def unit(section, uid, lkey, title, desc, guidebook, words, lessons):
    UNITS.append(dict(section=section, uid=uid, lkey=lkey, title=title, desc=desc, gb=guidebook.strip(), words=words, lessons=lessons))


# ---------------------------------------------------------------- Section 1: the first words (after the tone primer)
unit(1, "unit-1", "u0", "Lời chào đầu tiên", "Chào hỏi, cảm ơn, xin lỗi: những câu bạn dùng ngay ngày đầu.", """
## Chào hỏi

- *你好* (nǐ hǎo) — xin chào, dùng được cả ngày, với mọi người
- *您好* (nín hǎo) — xin chào, lịch sự hơn: với cấp trên, khách hàng, người lớn tuổi
- *早上好* (zǎo shang hǎo) — chào buổi sáng; *晚上好* (wǎn shang hǎo) — chào buổi tối
- *晚安* (wǎn ān) — chúc ngủ ngon; *再见* (zài jiàn) — tạm biệt

### Cảm ơn và xin lỗi
- *谢谢* (xiè xie) — cảm ơn; đáp lại: *不客气* (bù kè qi) — không có gì
- *对不起* (duì bu qǐ) — xin lỗi; đáp lại: *没关系* (méi guān xi) — không sao

### Xin, mời, hỏi
*请* (qǐng) vừa là "mời", vừa là "xin vui lòng": *请坐* — mời ngồi. *请问* (qǐng wèn) mở đầu một câu hỏi lịch sự: *请问，洗手间在哪儿？*

### Thanh điệu ngay từ đầu
Hai thanh 3 đứng liền nhau thì thanh đầu đọc gần như thanh 2: *你好* viết nǐ hǎo nhưng đọc gần như ní hǎo. Pinyin trong khoá học luôn ghi thanh gốc; bài nghe cho bạn nghe cách nói thật.

### So với tiếng Việt
Tiếng Việt chào kèm cách xưng hô: chào anh, chào chị. Tiếng Trung chỉ cần *你好*; muốn lịch sự thì đổi *你* thành *您*.
""", [("你好", "👋"), ("您好", "🙇"), ("早上好", "🌅"), ("晚上好", "🌆"), ("晚安", "🌙"), ("再见", "🚶"), ("谢谢", "🙏"), ("不客气", "😊"), ("对不起", "😔"), ("没关系", "👌"), ("请", "🤲"), ("请问", "🙋")],
     [("Bài 1", O("greetings.basic", "reading.familiar_words"))] * 4)

unit(1, "unit-2", "u1", "Tôi là ai?", "Nói tên, nói bạn là người Việt Nam, nói bạn làm nghề gì.", """
## Câu đầu tiên về bạn

Câu đơn giản nhất có dạng *A 是 B*: A là B — giống hệt trật tự tiếng Việt.
- *我是越南人。* (wǒ shì yuè nán rén) — Tôi là người Việt Nam.
- *他是中国人。* — Anh ấy là người Trung Quốc.
- *我是工人。* — Tôi là công nhân.

### Tên và họ
- *我叫阮兰。* (jiào) — Tôi tên là Nguyễn Lan.
- *我姓阮。* (xìng) — Tôi họ Nguyễn. Hỏi lịch sự: *您贵姓？* — Ông/bà họ gì ạ?
- *你叫什么名字？* (míng zi) — Bạn tên là gì?

Họ người Việt có chữ Hán riêng: Nguyễn là *阮*, Trần là *陈*, Lê là *黎*.

### Anh ấy, cô ấy
*他* (tā, anh ấy) và *她* (tā, cô ấy) đọc giống hệt nhau; chỉ chữ viết khác. Nghe thì phải đoán theo ngữ cảnh.

### Không cần "một", không cần chia động từ
*我是学生* — tôi là sinh viên: không có mạo từ, và *是* không bao giờ đổi dạng, dù là tôi, bạn hay họ. Tiếng Việt cũng vậy, nên phần này rất dễ với bạn.

### Âm Hán-Việt giúp nhớ
*学生* đọc Hán-Việt là học sinh, *工人* là công nhân: nghĩa gần như giữ nguyên. Nhưng cách đọc tiếng Trung thì khác hẳn: hãy nhớ pinyin, đừng đọc theo âm Hán-Việt.
""", [("我", "🙋‍♀️"), ("你", "🫵"), ("他", "🧍‍♂️"), ("她", "🧍‍♀️"), ("是", "🟰"), ("叫", "🗣️"), ("名字", "🏷️"), ("姓", "🔤"), ("越南人", "🇻🇳"), ("中国人", "🇨🇳"), ("学生", "🧑‍🎓"), ("工人", "👷")],
     [("Bài 1", O("sentences.shi_questions", "vocab.everyday_basics"))] * 4)

unit(1, "unit-3", "u2", "Gia đình", "Bố mẹ, anh chị em, ông bà, và câu nhà bạn có mấy người.", """
## Người trong nhà

- *爸爸* (bà ba) — bố; *妈妈* (mā ma) — mẹ
- *哥哥* (gē ge) — anh trai; *姐姐* (jiě jie) — chị gái
- *弟弟* (dì di) — em trai; *妹妹* (mèi mei) — em gái
- *爷爷* (yé ye), *奶奶* (nǎi nai) — ông bà nội
- *儿子* (ér zi) — con trai; *女儿* (nǚ ér) — con gái

### Anh hay em
Tiếng Việt có "em" cho cả em trai lẫn em gái. Tiếng Trung tách rõ: *弟弟* là em trai, *妹妹* là em gái. Âm tiết thứ hai của các từ này đọc thanh nhẹ: ngắn và nhẹ.

### Có mấy người
- *我家有四口人。* (yǒu, kǒu) — Nhà tôi có bốn người.
- *你有哥哥吗？* — Bạn có anh trai không?

*口* là lượng từ khi đếm người trong gia đình. Tiếng Việt cũng có loại từ ("hai đứa con", "ba con mèo"); tiếng Trung bắt buộc phải có lượng từ giữa số và danh từ.

### Không có: 没有, không phải 不有
Phủ định của *有* luôn là *没有* (méi yǒu): *我没有妹妹。* — Tôi không có em gái. Không bao giờ nói 不有.
""", [("家", "🏠"), ("爸爸", "👨"), ("妈妈", "👩"), ("哥哥", "👦"), ("姐姐", "👧"), ("弟弟", "🧒"), ("妹妹", "🎀"), ("儿子", "👶"), ("女儿", "🧸"), ("爷爷", "👴"), ("奶奶", "👵"), ("有", "✋")],
     [("Bài 1", O("vocab.everyday_basics", "existence.you_zai"))] * 4)

unit(1, "unit-4", "u3", "Ăn và uống", "Cơm, mì, trà, cà phê, và hai động từ ăn, uống.", """
## Món ăn đầu tiên

- *米饭* (mǐ fàn) — cơm; *面条* (miàn tiáo) — mì sợi; *包子* (bāo zi) — bánh bao
- *鸡蛋* (jī dàn) — trứng gà; *菜* (cài) — món ăn, rau
- *苹果* (píng guǒ) — quả táo

### Đồ uống
- *水* (shuǐ) — nước; *茶* (chá) — trà; *咖啡* (kā fēi) — cà phê; *牛奶* (niú nǎi) — sữa

### Hai động từ
- *吃* (chī) — ăn: *我吃米饭。* — Tôi ăn cơm.
- *喝* (hē) — uống: *你喝茶吗？* — Bạn uống trà không?

Trật tự chủ ngữ – động từ – tân ngữ giống tiếng Việt. Câu hỏi có/không chỉ cần thêm *吗* (ma) ở cuối.

### Lời chào bằng bữa ăn
*你吃饭了吗？* — Bạn ăn cơm chưa? Giống người Việt, người Trung Quốc hay hỏi câu này như một lời chào, không phải lời mời.

### Ở quán ăn
*我要一碗面条。* — Cho tôi một bát mì. *要* (yào) là "muốn, lấy": cách gọi món đơn giản nhất.
""", [("吃", "🍽️"), ("喝", "🥤"), ("米饭", "🍚"), ("面条", "🍜"), ("包子", "🥟"), ("鸡蛋", "🥚"), ("水", "💧"), ("茶", "🍵"), ("咖啡", "☕"), ("牛奶", "🥛"), ("苹果", "🍎"), ("菜", "🥬")],
     [("Bài 1", O("vocab.everyday_basics", "reading.familiar_words"))] * 4)

unit(1, "unit-5", "u4", "Số và tiền", "Đếm đến một nghìn, hỏi giá, trả tiền bằng tệ.", """
## Đếm từ một đến mười

*一 二 三 四 五 六 七 八 九 十* (yī èr sān sì wǔ liù qī bā jiǔ shí). Số lớn ghép như tiếng Việt: *十一* mười một, *二十* hai mươi, *三十五* ba mươi lăm, *一百* một trăm, *一千* một nghìn.

### Hai: 二 hay 两
- Khi đếm, đọc số: *二* (èr) — *二十*, *二月*
- Trước lượng từ: *两* (liǎng) — *两个人*, *两杯茶*
- Trước *百* nói được cả *二百* lẫn *两百*; trước *千*, *万* thường nói *两千*, *两万*.

Nói *二个* là sai: đây là lỗi người mới học hay mắc nhất.

### Tiền
- *块* (kuài) — tệ, cách nói hằng ngày; trên bảng giá thường viết *元* (yuán)
- *钱* (qián) — tiền: *多少钱？* (duō shao qián) — Bao nhiêu tiền?
- *这个十五块。* — Cái này mười lăm tệ.

### Đắt và rẻ
*太贵了！* (tài guì le) — Đắt quá! *便宜一点儿吧。* (pián yi) — Bớt chút đi. Ở chợ, mặc cả nhẹ nhàng là chuyện bình thường; ở siêu thị thì không.

### Hỏi số lượng
*几* (jǐ) hỏi số nhỏ, thường dưới mười: *你有几个孩子？* *多少* hỏi số bất kỳ: *你们公司有多少人？*
""", [("一", "1️⃣"), ("二", "2️⃣"), ("三", "3️⃣"), ("十", "🔟"), ("两", "✌️"), ("百", "💯"), ("千", "🔢"), ("块", "💴"), ("钱", "💰"), ("多少", "❔"), ("贵", "💸"), ("便宜", "🪙")],
     [("Bài 1", O("numbers.measure_words", "reading.familiar_words"))] * 4)

# ---------------------------------------------------------------- Section 2: building blocks
unit(2, "unit-a", "ua", "Câu với 是, 不, 没 và 吗", "Khẳng định, phủ định, câu hỏi có/không và từ để hỏi.", """
## Ba kiểu câu cơ bản

| Nghĩa | Tiếng Trung |
|---|---|
| là | *我是工人。* |
| không phải là | *我不是工人。* |
| có phải … không? | *你是工人吗？* |

### 不 và 没
- *不* (bù) phủ định hiện tại, tương lai, thói quen: *我不喝酒。* — Tôi không uống rượu.
- *没* (méi) phủ định *有* và việc đã không xảy ra: *我没去。* — Tôi đã không đi.

Trước thanh 4, *不* đọc thành thanh 2: *不是* đọc bú shì, *不去* đọc bú qù.

### Hai cách hỏi có/không
- Thêm *吗*: *你忙吗？*
- Ghép khẳng định với phủ định: *你忙不忙？*, *你是不是越南人？*

### Từ để hỏi đứng đúng chỗ của câu trả lời
- *这是什么？* (shén me) — Đây là cái gì? → *这是茶。*
- *他是谁？* (shéi) — Anh ấy là ai? → *他是我哥哥。*
- *你是哪国人？* (nǎ) — Bạn người nước nào?

Tiếng Việt cũng để từ để hỏi tại chỗ ("anh ấy là ai?"), nên bạn không phải đảo câu như tiếng Anh. Đừng thêm *吗* vào câu đã có từ để hỏi.

### 呢: còn … thì sao?
*我很好，你呢？* — Tôi khoẻ, còn bạn?
""", [("不", "🚫"), ("没有", "🙅"), ("吗", "❓"), ("呢", "↩️"), ("什么", "🤔"), ("谁", "🕵️"), ("哪", "🌏"), ("这", "👇")],
     [("Bài 1", O("sentences.shi_questions", "questions.question_words")), ("Bài 2", O("sentences.shi_questions")), ("Bài 3", O("questions.question_words", "sentences.shi_questions")), ("Bài 4", O("sentences.shi_questions", "reading.familiar_words"))])

unit(2, "unit-b", "ub", "Lượng từ: 个, 本, 杯, 只", "Số + lượng từ + danh từ, và 这/那 + lượng từ.", """
## Số + lượng từ + danh từ

Tiếng Việt nói "ba quyển sách", "một con mèo": tiếng Trung cũng vậy, và lượng từ là bắt buộc.
- *三本书* (běn) — ba quyển sách
- *一杯茶* (bēi) — một cốc trà
- *一只猫* (zhī) — một con mèo
- *一件衣服* (jiàn) — một cái áo
- *两张票* (zhāng) — hai tấm vé

### 个: lượng từ chung
*个* (gè) dùng cho người và rất nhiều vật: *一个人*, *三个苹果*. Không chắc dùng lượng từ nào thì *个* thường vẫn được hiểu — nhưng *本*, *杯*, *张* nghe tự nhiên hơn.

### 这 / 那 + lượng từ
- *这个* (zhè ge) — cái này; *那个* (nà ge) — cái kia
- *这本书* — quyển sách này; *那件衣服* — chiếc áo kia

Tiếng Việt đặt "này" sau danh từ; tiếng Trung đặt *这* lên trước, kèm lượng từ: *这本书*, không nói 书这.

### Nhớ lượng từ qua hình dạng
- *张*: vật phẳng — vé, giấy, bàn, giường
- *条*: vật dài — đường, sông, cá
- *件*: áo, việc
""", [("个", "🔵"), ("本", "📘"), ("杯", "🥃"), ("只", "🐾"), ("件", "👕"), ("张", "🎫"), ("这个", "☝️"), ("那个", "👆")],
     [("Bài 1", O("numbers.measure_words")), ("Bài 2", O("numbers.measure_words", "grammar.word_order")), ("Bài 3", O("numbers.measure_words", "vocab.everyday_basics")), ("Bài 4", O("numbers.measure_words", "reading.familiar_words"))])

unit(2, "unit-c", "uc", "有, 在 và 的", "Ở đâu có gì, cái gì ở đâu, và 的 trước danh từ.", """
## Cái gì ở đâu: 在

*X 在 + nơi chốn*: *银行在超市旁边。* (zài) — Ngân hàng ở cạnh siêu thị. *我在工厂。* — Tôi ở nhà máy.

### Ở đâu có gì: 有
*Nơi chốn + 有 + X*: *宿舍里有洗手间。* — Trong ký túc xá có nhà vệ sinh. Tiếng Việt cũng nói "trong … có …", nên trật tự này rất quen.

### Vị trí đứng sau danh từ
- *桌子上* — trên bàn; *包里* — trong túi; *公司旁边* — cạnh công ty

Tiếng Việt đặt "trên" trước ("trên bàn"); tiếng Trung đặt *上* sau danh từ: *桌子上*.

### 的: định ngữ đứng trước
- *我的手机* (de) — điện thoại của tôi
- *红色的车* — chiếc xe màu đỏ
- *公司的同事* — đồng nghiệp ở công ty

Đây là chỗ ngược tiếng Việt: tiếng Việt nói "xe màu đỏ", tiếng Trung nói "đỏ 的 xe". Với người thân, *的* thường bỏ: *我妈妈*, *我们公司*.

### Đây, đó, đâu
*这儿* (zhèr) — đây; *那儿* (nàr) — đó; *哪儿* (nǎr) — đâu: *你在哪儿？* Ở Đài Loan và miền Nam Trung Quốc người ta hay nói *这里*, *那里*, *哪里*.
""", [("在", "📍"), ("的", "🔗"), ("这儿", "⬇️"), ("那儿", "➡️"), ("哪儿", "🧭"), ("上", "🔝"), ("里", "📥"), ("旁边", "↔️")],
     [("Bài 1", O("existence.you_zai")), ("Bài 2", O("existence.you_zai", "grammar.word_order")), ("Bài 3", O("grammar.word_order")), ("Bài 4", O("grammar.word_order", "reading.familiar_words"))])

unit(2, "unit-d", "ud", "Thời gian, 了 và 过", "Hỏi giờ, nói ngày, đặt thời gian trước động từ, nói việc đã làm.", """
## Giờ và ngày

- *现在几点？* (xiàn zài jǐ diǎn) — Bây giờ mấy giờ?
- *八点半* — tám giờ rưỡi; *差五分八点* — tám giờ kém năm
- *今天* hôm nay, *明天* ngày mai, *昨天* hôm qua
- *星期一* thứ Hai … *星期六* thứ Bảy, *星期天* Chủ nhật

Ngày tháng đi từ lớn đến nhỏ: *二〇二六年五月一号* — ngày 1 tháng 5 năm 2026, ngược với tiếng Việt.

### Thời gian đứng trước động từ
*我明天八点上班。* — Ngày mai tám giờ tôi đi làm. Tiếng Việt cũng hay nói "tôi đi làm lúc tám giờ", đặt giờ sau động từ; tiếng Trung luôn đặt giờ trước động từ.

### 了: đã xảy ra, đã thay đổi
- *我吃饭了。* (le) — Tôi ăn cơm rồi. Gần với "rồi" của tiếng Việt.
- *下雨了。* — Mưa rồi (trước đó chưa mưa).

*了* không phải thì quá khứ: phủ định của việc đã không xảy ra là *没* + động từ, không có *了*: *我没吃饭*.

### 过: đã từng
*我去过北京。* (guo) — Tôi đã từng đến Bắc Kinh. Gần với "từng".

### 在 / 正在: đang
*我在开会。* — Tôi đang họp. *正在* nhấn mạnh hơn: *他正在吃饭*.
""", [("现在", "⏰"), ("点", "🕗"), ("今天", "📅"), ("明天", "🌄"), ("昨天", "🔙"), ("星期", "🗓️"), ("了", "✅"), ("过", "🧳")],
     [("Bài 1", O("vocab.time_calendar")), ("Bài 2", O("vocab.time_calendar", "grammar.word_order")), ("Bài 3", O("aspect.le_guo_zai")), ("Bài 4", O("aspect.le_guo_zai", "reading.familiar_words"))])

unit(2, "unit-e", "ue", "Chữ Hán, pinyin và âm Hán-Việt", "Nét và bộ thủ, biến điệu thanh, và Hán-Việt: khi nào giúp, khi nào bẫy.", """
## Chữ Hán và pinyin

*汉字* (hàn zì) không ghép từ âm như chữ Việt. *拼音* (pīn yīn) chỉ là phiên âm để đọc và để gõ: trên điện thoại bạn gõ *xuesheng* rồi chọn *学生*. Khoá học dạy nhận chữ và gõ bằng pinyin; không bắt viết tay.

### Bộ thủ thường gặp
- *氵* (nước): *汉, 河, 海, 洗*
- *口* (miệng): *吃, 喝, 叫, 吗*
- *亻* (người): *你, 他, 们, 休*
- *讠* (lời nói): *说, 话, 请, 谢*

Nhiều chữ là chữ hình thanh: một phần chỉ nghĩa, một phần gợi âm — *妈* (女 nữ + 马 mǎ).

### Âm Hán-Việt: lợi thế lớn
Rất nhiều từ tiếng Trung trùng nghĩa với từ Hán-Việt: *学习* học tập, *银行* ngân hàng, *准备* chuẩn bị, *安全* an toàn. Khi thấy âm Hán-Việt dưới từ, hãy dùng nó để nhớ nghĩa — nhưng đọc theo pinyin.

### "Bạn giả"
- *小心* là cẩn thận, không phải "tiểu tâm"
- *方便* là thuận tiện, không phải "phương tiện"
- *意思* là ý nghĩa, không phải "ý tứ"
- *走* là đi (bộ), không phải "tẩu" bỏ chạy

### Biến điệu thanh
*不* trước thanh 4 đọc thanh 2 (*不是* bú shì). *一* trước thanh 4 đọc thanh 2 (*一个* yí ge), trước thanh khác đọc thanh 4 (*一杯* yì bēi). Khi đếm số, đọc số thứ tự hay khi *一* đứng cuối từ (*十一*, *第一*) thì vẫn đọc yī. Pinyin của khoá học ghi thanh gốc.

### Giản thể và phồn thể
Khoá học dùng chữ giản thể như Trung Quốc đại lục. Ở Đài Loan dùng phồn thể: *学* = *學*, *车* = *車*. Bạn gõ phồn thể thì ứng dụng vẫn hiểu.
""", [("汉语", "🀄"), ("汉字", "✍️"), ("中文", "📜"), ("字", "🔠"), ("学习", "📖"), ("老师", "👩‍🏫"), ("银行", "🏦"), ("意思", "💡")],
     [("Bài 1", O("script.hanzi_hanviet", "script.pinyin_tones")), ("Bài 2", O("script.hanzi_hanviet", "strategy.hanviet_false_friends")), ("Bài 3", O("pronunciation.tones_sounds", "script.pinyin_tones")), ("Bài 4", O("strategy.hanviet_false_friends", "reading.familiar_words"))])

# ---------------------------------------------------------------- Section 3: understanding everyday Chinese
unit(3, "unit-f", "uf", "Nghe từ và cụm từ", "Nghe ra từ quen trong câu nói rõ và chậm: thời tiết, giờ, số.", """
## Nghe tiếng Trung chậm

Bài nghe ở phần này dùng giọng đọc rõ và chậm. Hãy nghe trước, đọc chữ sau.

### Dự báo thời tiết
- *今天天气很好。* (tiān qì) — Hôm nay thời tiết đẹp.
- *明天下雨。* (xià yǔ) — Mai mưa.
- *冷* (lěng) lạnh, *热* (rè) nóng, *风很大* gió to, *晴天* trời nắng

### Nghe số
Số hay bị nghe nhầm: *四* (sì) và *十* (shí) khác nhau cả ở âm uốn lưỡi sh lẫn ở thanh (thanh 4 và thanh 2); *一* và *七* (yī, qī) chỉ khác phụ âm đầu. Hãy chú ý phụ âm đầu, không chỉ thanh điệu.

### Thanh điệu giúp phân biệt
*买* (mǎi) mua và *卖* (mài) bán khác nhau chỉ ở thanh. Người Việt nghe thanh tốt: thanh 3 tiếng Trung xuống thấp, gần giống thanh hỏi; thanh 4 rơi mạnh từ cao, gần giống giọng ra lệnh.

### Mẹo nghe
1. Đọc câu hỏi trước khi nghe.
2. Nghe từ khoá: giờ, ngày, giá, nơi chốn.
3. Không cần hiểu từng chữ.
""", [("天气", "🌤️"), ("冷", "🥶"), ("热", "🥵"), ("下雨", "🌧️"), ("风", "🌬️"), ("晴", "☀️")],
     [("Bài 1", O("listening.familiar_words")), ("Bài 2", O("listening.short_info")), ("Bài 3", O("listening.familiar_words", "pronunciation.tones_sounds")), ("Bài 4", O("listening.short_info", "vocab.time_calendar"))])

unit(3, "unit-g", "ug", "Biển báo và nội quy ở nhà máy", "Đọc biển cấm, biển cẩn thận, nội quy an toàn và tin nhắn của tổ trưởng.", """
## Biển báo ở nhà máy và kho hàng

- *小心* (xiǎo xīn) — cẩn thận
- *注意安全* (zhù yì ān quán) — chú ý an toàn
- *禁止吸烟* — cấm hút thuốc
- *出口* lối ra, *入口* lối vào. Trên biển báo, *出口* là lối ra; nghĩa "xuất khẩu" chỉ gặp khi nói về hàng hoá. "Nhập khẩu" là *进口*, không phải *入口*.

### Nội quy an toàn
- *进车间要戴安全帽。* (dài) — Vào xưởng phải đội mũ bảo hộ.
- *请戴手套。* — Hãy đeo găng tay.
- *别动机器！* — Đừng động vào máy!
- *机器坏了，快停！* — Máy hỏng rồi, dừng ngay!

*戴* dùng cho mũ, găng tay, khẩu trang, kính; *穿* dùng cho quần áo, giày.

### Tin nhắn của tổ trưởng
*明天早上七点上班，别迟到。* — Mai bảy giờ sáng vào làm, đừng đến muộn. Tin nhắn ngắn, không có lời chào dài: hãy tìm giờ, ngày, việc cần làm.

### Ở Đài Loan
Biển báo ở Đài Loan viết chữ phồn thể: *禁止吸菸* (Đài Loan viết *菸* cho thuốc lá), *小心*. Phần lớn chữ trông gần giống giản thể; ứng dụng chỉ yêu cầu bạn nhận ra, không yêu cầu viết.
""", [("工厂", "🏭"), ("小心", "⚠️"), ("安全", "🦺"), ("机器", "⚙️"), ("戴", "⛑️"), ("吸烟", "🚭")],
     [("Đọc biển báo", O("reading.notices_info")), ("Nội quy an toàn", O("reading.notices_info", "listening.announcements")), ("Tin nhắn của tổ trưởng", O("reading.short_messages")), ("Nghe chỉ dẫn", O("listening.announcements", "vocab.work_china"))])

unit(3, "unit-h", "uh", "Thông báo ở ga tàu và sân bay", "Nghe thông báo, đọc bảng giờ tàu, mua vé.", """
## Ở nhà ga, bến tàu điện ngầm

- *火车站* (huǒ chē zhàn) — ga tàu hoả; *地铁* (dì tiě) — tàu điện ngầm
- *票* (piào) — vé: *一张去上海的票* — một vé đi Thượng Hải
- *到* (dào) — đến: *火车八点到北京* — tàu tám giờ đến Bắc Kinh

### Thông báo thường nghe
- *列车马上就要出发了。* — Tàu sắp khởi hành.
- *下一站：人民广场。* — Ga tiếp theo: Quảng trường Nhân dân.
- *请注意安全。* — Xin chú ý an toàn.

Thông báo thường lặp lại hai lần, có khi bằng tiếng Anh. Hãy nghe tên ga và giờ.

### Ở sân bay
*机场* (jī chǎng) — sân bay; *护照* (hù zhào) — hộ chiếu (âm Hán-Việt trùng nghĩa). *请出示护照。* — Xin xuất trình hộ chiếu.

### Đài Bắc và Trung Quốc đại lục
Ở Đài Bắc, tàu điện ngầm gọi là *捷运*; ở đại lục là *地铁*. Bảng giờ ở Đài Loan viết phồn thể: *車站* = *车站*.
""", [("火车站", "🚉"), ("地铁", "🚇"), ("机场", "🛫"), ("票", "🎟️"), ("到", "🏁"), ("车站", "🚏")],
     [("Nghe thông báo", O("listening.announcements")), ("Đọc bảng giờ", O("reading.notices_info")), ("Mua vé", O("listening.short_dialogues", "numbers.measure_words")), ("Ở sân bay", O("listening.announcements", "listening.short_info"))])

unit(3, "unit-i", "ui", "Hội thoại ở cửa hàng", "Nghe người bán hỏi, trả giá, trả tiền bằng mã QR.", """
## Ở cửa hàng và siêu thị

- *商店* (shāng diàn) — cửa hàng; *超市* (chāo shì) — siêu thị
- *买* (mǎi) — mua; *卖* (mài) — bán: chỉ khác thanh, hãy nghe kỹ
- *要* (yào) — muốn, lấy: *我要两个。*

### Người bán thường hỏi
- *你要什么？* — Bạn cần gì?
- *要袋子吗？* — Có lấy túi không?
- *一共二十八块。* (yī gòng, đọc yí gòng) — Tổng cộng hai mươi tám tệ.

### Trả tiền
Ở Trung Quốc hầu hết mọi người trả bằng điện thoại: *扫码* (sǎo mǎ) — quét mã. *我扫你还是你扫我？* — Tôi quét mã của bạn hay bạn quét mã của tôi? Trả lời ngắn: *我扫你。*

### Trả giá ở chợ
- *太贵了，便宜一点儿吧。* — Đắt quá, bớt chút đi.
- *三十块，行吗？* — Ba mươi tệ được không?

### Mẹo nghe
Giá thường đến cuối câu. Nghe số trước, rồi nghe *块* hay *毛*.
""", [("商店", "🏪"), ("超市", "🛒"), ("买", "🛍️"), ("卖", "🏷"), ("要", "👍"), ("扫", "📱")],
     [("Nghe người bán", O("listening.short_dialogues")), ("Giá và số", O("listening.short_info", "numbers.measure_words")), ("Trả tiền bằng mã", O("listening.short_dialogues", "reading.notices_info")), ("Đọc bảng giá", O("reading.notices_info", "reading.familiar_words"))])

unit(3, "unit-j", "uj", "Chuyện nhỏ ở ký túc xá", "Đọc và nghe chuyện ngắn: một ngày làm việc, giặt đồ, đồng nghiệp.", """
## Một ngày ở ký túc xá

- *宿舍* (sù shè) — ký túc xá (Hán-Việt: túc xá)
- *房间* (fáng jiān) — phòng; *同事* (tóng shì) — đồng nghiệp
- *起床* (qǐ chuáng) — thức dậy; *睡觉* (shuì jiào) — đi ngủ; *洗澡* (xǐ zǎo) — tắm

### Một đoạn văn ngắn
*我每天六点起床，七点上班。中午在食堂吃饭。晚上我洗澡，然后给妈妈打电话。* — Hằng ngày tôi dậy lúc sáu giờ, bảy giờ vào làm. Trưa ăn ở nhà ăn. Tối tôi tắm, rồi gọi điện cho mẹ.

Thời điểm (mấy giờ, hôm nào) đứng trước động từ; *然后* (rán hòu) nối các việc theo thứ tự.

### Đọc chậm, đọc lại
1. Đọc lướt để tìm ai, ở đâu, khi nào.
2. Đọc lại câu bạn chưa hiểu, nhìn pinyin.
3. Từ mới thì chạm vào để xem nghĩa.

### Hỏi đồng nghiệp
*你住几号房间？* — Bạn ở phòng số mấy? *洗衣机在哪儿？* — Máy giặt ở đâu?
""", [("宿舍", "🛏️"), ("房间", "🚪"), ("同事", "🧑‍🤝‍🧑"), ("起床", "🌞"), ("睡觉", "😴"), ("洗澡", "🚿")],
     [("Đọc chuyện ngắn", O("reading.short_texts")), ("Nghe chuyện ngắn", O("listening.short_info", "reading.short_texts")), ("Một ngày làm việc", O("reading.short_texts", "vocab.time_calendar")), ("Hỏi đồng nghiệp", O("listening.short_dialogues"))])

# ---------------------------------------------------------------- Section 4: speaking
unit(4, "unit-k", "uk", "Chào hỏi ở chỗ làm", "Chào khi vào ca, khi tan ca, chào cấp trên và đồng nghiệp.", """
## Ở chỗ làm

- *早！* hoặc *早上好！* — chào buổi sáng (đồng nghiệp hay nói gọn *早*)
- *王经理好！* (jīng lǐ) — chào quản lý Vương: họ + chức vụ + *好*
- *辛苦了！* (xīn kǔ le) — vất vả rồi: cấp trên nói với nhân viên, đồng nghiệp nói với nhau
- *我先走了，明天见。* — Tôi về trước, mai gặp.

### Vào ca, tan ca
*上班* (shàng bān) — đi làm, vào ca; *下班* (xià bān) — tan ca. *你几点下班？* — Mấy giờ bạn tan ca?

### Gọi người khác
Gọi cấp trên bằng họ + chức vụ: *李组长*, *张经理*. Với đồng nghiệp cùng tuổi hoặc trẻ hơn: *小王*, *小李* (tiểu + họ, thân mật, gần như "cậu Vương", "em Lý"); với đồng nghiệp lớn tuổi hơn: *老王*, *老李*. Không gọi cấp trên bằng *你*: dùng *您* hoặc chức vụ.

### Nói thành tiếng
Ứng dụng nghe bạn nói bằng bộ nhận dạng giọng nói tiếng Trung (zh-CN) trên điện thoại và chỉ kiểm tra từ nhận ra được — không chấm thanh điệu. Hãy nói chậm, rõ, đủ câu.
""", [("辛苦了", "💪"), ("上班", "🏃"), ("下班", "🏡"), ("经理", "👔")],
     [("Chào khi vào ca", O("speaking.formulaic")), ("Chào cấp trên", O("speaking.formulaic", "politeness.register")), ("Khi tan ca", O("speaking.formulaic")), ("Nói lại cho rõ", O("speaking.formulaic", "pronunciation.tones_sounds"))])

unit(4, "unit-l", "ul", "Tự giới thiệu khi phỏng vấn", "Nói tên, tuổi, quê, kinh nghiệm bằng câu ngắn.", """
## Tự giới thiệu

1. *您好，我叫阮文明。* — Xin chào, tôi tên là Nguyễn Văn Minh.
2. *我是越南人，今年二十五岁。* (suì) — Tôi là người Việt Nam, năm nay 25 tuổi.
3. *我在工厂工作过三年。* — Tôi đã làm ở nhà máy ba năm.
4. *认识您很高兴。* (rèn shi, gāo xìng) — Rất vui được gặp ông/bà.

### Câu hỏi phỏng vấn thường gặp
- *你叫什么名字？* — Bạn tên gì?
- *你多大了？* — Bạn bao nhiêu tuổi?
- *你会说汉语吗？* — Bạn biết nói tiếng Trung không? → *会一点儿。*
- *你为什么想来我们公司？* — Tại sao bạn muốn vào công ty chúng tôi?

### Giới thiệu người khác
*我来介绍一下，这是我的同事小王。* (jiè shào) — Để tôi giới thiệu, đây là đồng nghiệp của tôi, Tiểu Vương.

### Lưu ý
Câu "认识你很高兴" dịch sát là "quen bạn rất vui": *认识* là quen biết một người, không phải "nhận thức". Đây là một "bạn giả" Hán-Việt.
""", [("认识", "🤝"), ("高兴", "😄"), ("介绍", "🗨️"), ("岁", "🎂")],
     [("Tên và quê", O("speaking.self_intro")), ("Tuổi và công việc", O("speaking.self_intro", "numbers.measure_words")), ("Trả lời phỏng vấn", O("speaking.self_intro", "modals.can_want")), ("Giới thiệu người khác", O("speaking.self_intro", "politeness.register"))])

unit(4, "unit-m", "um", "Nói số: điện thoại, giá, giờ", "Đọc số điện thoại, nói giá tiền, hẹn giờ.", """
## Số điện thoại

Đọc từng chữ số: *一三八 …*. Trong số điện thoại, số 1 thường đọc là *yāo* để khỏi nhầm với *七* (qī): *我的电话是 yāo 三八…*.

- *你的手机号码是多少？* (hào mǎ) — Số di động của bạn là bao nhiêu?
- Hỏi số dùng *多少*, không dùng *什么*.

### Giá tiền
- *二十五块* — 25 tệ; *两块五* — 2 tệ rưỡi (2,5)
- *一共多少钱？* — Tổng cộng bao nhiêu?

### Giờ hẹn
- *三点* 3 giờ, *三点十分* (fēn) 3 giờ 10, *三点半* 3 giờ rưỡi
- *我们几点见？* — Mấy giờ chúng ta gặp? → *下午两点。*

### Ngày
*五月一号* — ngày 1 tháng 5. *号* (hào) là ngày trong tháng khi nói; trên giấy viết *日*.

### Nói thành tiếng
Bộ nhận dạng có thể viết số bằng chữ số (25) hay bằng chữ (二十五): ứng dụng coi hai cách là một. Nhưng nói sai số là sai.
""", [("电话", "☎️"), ("号码", "#️⃣"), ("手机", "📲"), ("分", "⏱️")],
     [("Số điện thoại", O("speaking.give_info")), ("Giá tiền", O("speaking.give_info", "numbers.measure_words")), ("Giờ hẹn", O("speaking.give_info", "vocab.time_calendar")), ("Sở thích và ngày tháng", O("speaking.give_info"))])

unit(4, "unit-n", "un", "Mô tả người và đồ vật", "Nói to nhỏ, cao thấp, màu sắc bằng câu ngắn với 很.", """
## Tính từ với 很

Tiếng Trung không dùng *是* trước tính từ: *他很高。* (hěn gāo) — Anh ấy cao. Không nói 他是高.

*很* ở đây không mạnh như "rất"; nó chỉ làm câu tròn. Muốn nhấn mạnh thì dùng *非常* hay *太…了*: *太大了！*

### Người
- *高* cao, *年轻* trẻ, *漂亮* xinh, *可爱* đáng yêu
- *他个子很高，头发很短。* — Anh ấy dáng cao, tóc ngắn.

### Đồ vật
- *大* to, *小* nhỏ, *新* mới, *重* nặng
- *这个箱子很重。* — Cái thùng này nặng.

### Màu sắc
*颜色* (yán sè) — màu sắc ("bạn giả": không phải "nhan sắc"). *红* đỏ, *白* trắng, *黑* đen, *蓝* xanh lam, *绿* xanh lá, *黄* vàng. Trước danh từ thêm *的*: *红色的车* — xe màu đỏ.

### So sánh nhanh
*这个比那个大。* (bǐ) — Cái này to hơn cái kia.
""", [("大", "🐘"), ("小", "🐭"), ("高", "🦒"), ("颜色", "🎨")],
     [("Người", O("speaking.describe", "adjectives.hen_tai")), ("Đồ vật và màu sắc", O("speaking.describe")), ("So sánh", O("speaking.describe", "grammar.word_order")), ("Tả người", O("speaking.describe", "adjectives.hen_tai"))])

# ---------------------------------------------------------------- Section 5: writing
unit(5, "unit-o", "uo", "Viết về mình", "Gõ chữ Hán bằng bàn phím pinyin và viết vài câu về bản thân.", """
## Gõ chữ Hán trên điện thoại

Bật bàn phím tiếng Trung (pinyin giản thể). Gõ pinyin không dấu, rồi chọn chữ: gõ *gongzuo* → chọn *工作*. Nhiều chữ cùng âm: *shi* có *是, 事, 十, 时*. Hãy nhìn kỹ trước khi chọn.

### Câu mẫu về bạn
- *我叫阮兰，今年二十三岁。*
- *我是越南人，住在河内。* (zhù) — Tôi là người Việt Nam, sống ở Hà Nội.
- *我在一家中国公司工作。* (gōng zuò) — Tôi làm ở một công ty Trung Quốc.

### Pinyin hay chữ Hán?
Ứng dụng hiểu cả câu bạn gõ bằng pinyin, nhưng chỉ tính là luyện tập. Bài viết được chấm khi bạn viết bằng chữ Hán.

### Lỗi hay gặp
- Quên *在* trước nơi chốn: viết *我住在河内*, không viết 我住河内 khi mới học.
- Đặt thời gian sau động từ: viết *我明天去*, không viết 我去明天.
""", [("住", "🏘️"), ("工作", "💼"), ("国家", "🗺️")],
     [("Gõ pinyin", O("writing.pinyin_input")), ("Câu về mình", O("writing.personal_info")), ("Nơi ở và công việc", O("writing.personal_info", "grammar.word_order")), ("Viết lại cho đúng", O("writing.personal_info", "writing.pinyin_input"))])

unit(5, "unit-p", "up", "Viết câu đơn giản", "Viết ai làm gì, ở đâu, khi nào, và nối câu.", """
## Trật tự câu

*Ai + khi nào + ở đâu + làm gì*: *我明天在工厂加班。* — Mai tôi tăng ca ở nhà máy. Tiếng Việt linh hoạt hơn; tiếng Trung giữ trật tự này.

### Nối câu
- *和* (hé) — và, nối hai danh từ: *我和我朋友*. Không dùng *和* để nối hai câu.
- *但是* (dàn shì) — nhưng: *我想去，但是没有时间。*
- *然后* (rán hòu) — sau đó: *先吃饭，然后休息。*
- *因为…所以…* — vì … nên …: *因为下雨，所以我没去。*

### Một đoạn ngắn
*星期六我休息。上午我去超市买东西，然后和朋友吃饭。晚上我在宿舍看电视。*

### Kiểm tra trước khi gửi
1. Có động từ chưa?
2. Thời gian đứng trước động từ chưa?
3. Số có lượng từ chưa (*两个*, *三本*)?
4. Câu có tính từ thì có *很* chưa, và không có *是* (*今天很冷*)?
5. Cuối câu là dấu chấm tiếng Trung *。*, không phải dấu chấm Latin.
""", [("和", "➕"), ("但是", "🔀"), ("然后", "⏭️")],
     [("Ai làm gì", O("writing.phrases_sentences")), ("Khi nào, ở đâu", O("writing.phrases_sentences", "grammar.word_order")), ("Nối câu", O("writing.phrases_sentences")), ("Một đoạn ngắn", O("writing.phrases_sentences", "aspect.le_guo_zai"))])

unit(5, "unit-q", "uq", "Tin nhắn cho quản lý", "Viết tin nhắn xin nghỉ, báo ốm, báo đến muộn trên WeChat.", """
## Tin nhắn WeChat cho cấp trên

Ở Trung Quốc đại lục, *微信* (WeChat) là cách liên lạc chính ở chỗ làm (nhắn WeChat: *发微信*; *短信* là tin nhắn SMS); ở Đài Loan người ta thường dùng LINE. Cách viết tin nhắn thì giống nhau. Tin nhắn cho cấp trên nên ngắn và lịch sự:

1. Lời chào: *王经理，您好！*
2. Việc cần báo: *我今天生病了，想请假一天。* (shēng bìng, qǐng jià)
3. Lời kết: *谢谢！*

### Câu mẫu
- *我今天发烧，不能上班。* — Hôm nay tôi sốt, không đi làm được.
- *我会晚到二十分钟。* — Tôi sẽ đến muộn hai mươi phút.
- *明天我可以请假吗？* — Mai tôi xin nghỉ được không ạ?

### Trả lời đồng nghiệp
*好的，收到。* — Vâng, đã nhận. *没问题。* — Không vấn đề gì.

### Lịch sự
Dùng *您* với cấp trên. Tránh viết toàn pinyin: cấp trên người Hoa đọc chữ Hán nhanh hơn nhiều. Nên báo sớm, trước giờ vào ca, và nói rõ lý do bằng một câu.
""", [("请假", "📝"), ("生病", "🤒"), ("短信", "💬")],
     [("Xin nghỉ", O("writing.short_message", "modals.can_want")), ("Báo ốm", O("writing.short_message", "vocab.work_china")), ("Báo đến muộn", O("writing.short_message", "vocab.time_calendar")), ("Trả lời đồng nghiệp", O("writing.short_message", "politeness.register"))])

unit(5, "unit-r", "ur", "Ở ngân hàng: giấy tờ", "Điền họ tên, số hộ chiếu, điện thoại vào biểu mẫu mở tài khoản.", """
## Biểu mẫu ở ngân hàng

Khi mở tài khoản hay làm thẻ, bạn phải điền một tờ đơn:

| Ô trên đơn | Nghĩa | Ví dụ |
|---|---|---|
| *姓名* | họ tên | *阮文明* hoặc tên viết chữ cái |
| *国家* | nước (đơn thật thường ghi *国籍* — quốc tịch) | *越南* |
| *护照号码* | số hộ chiếu | *C1234567* |
| *电话* | điện thoại | *138…* |
| *地址* | địa chỉ | *工厂宿舍三号楼* |

### Câu ở quầy
- *我想办一张银行卡。* (yín háng kǎ) — Tôi muốn làm một thẻ ngân hàng.
- *请填这张表。* — Mời điền tờ đơn này.
- *请在这儿签字。* — Xin ký vào đây.

### Tên người Việt
Trên giấy tờ Trung Quốc, tên người nước ngoài thường viết theo hộ chiếu, bằng chữ cái. Có thể thêm tên chữ Hán: Nguyễn Văn Minh = *阮文明*.

### Mật khẩu
Nhân viên sẽ nói *请输入密码* — xin nhập mật khẩu. Không đọc mật khẩu thành tiếng cho ai.
""", [("银行卡", "💳"), ("护照", "🛂"), ("卡", "🪪")],
     [("Ô trên đơn", O("writing.form_filling")), ("Họ tên và quốc tịch", O("writing.form_filling", "writing.pinyin_input")), ("Địa chỉ và điện thoại", O("writing.form_filling", "numbers.measure_words")), ("Ở quầy", O("writing.form_filling", "reading.notices_info"))])

# ---------------------------------------------------------------- Section 6: talking with someone
unit(6, "unit-s", "us", "Nhà hàng và cửa hàng", "Gọi món, hỏi giá, trả tiền, mặc cả nhẹ nhàng.", """
## Ở nhà hàng

- *服务员！* (fú wù yuán) — Em ơi! (gọi phục vụ)
- *请给我菜单。* (cài dān) — Cho tôi xem thực đơn.
- *我要一个这个，一个那个。* — Cho tôi một món này, một món kia.
- *不要太辣。* — Đừng cay quá.

### Thanh toán
- *一共多少钱？* (yī gòng, đọc yí gòng) — Tổng cộng bao nhiêu?
- *可以扫码吗？* — Quét mã được không?
- *我来付。* (fù) — Để tôi trả. *今天我请客。* — Hôm nay tôi mời.

### Ở cửa hàng
Người bán hỏi nhanh: *要几个？* — Lấy mấy cái? Trả lời chỉ cần số và lượng từ: *两个。*

### Nghe không kịp
*请再说一遍。* — Xin nói lại một lần nữa. *请说慢一点儿。* — Xin nói chậm một chút. Người nghe kiên nhẫn sẽ nói lại; ứng dụng cũng vậy.

### Ở Đài Loan
Cơm hộp mang đi gọi là *便当*; ở cửa hàng tiện lợi người bán hay hỏi *要加热吗？* — Có hâm nóng không? Ở quán, người bán hỏi *內用還是外帶？* (ăn ở đây hay mang đi), ở đại lục là *在这儿吃还是带走？*
""", [("服务员", "🧑‍🍳"), ("菜单", "📋"), ("一共", "🧾"), ("付", "💵")],
     [("Gọi món", O("interaction.practical_needs")), ("Hội thoại: thanh toán", O("interaction.practical_needs", "numbers.measure_words")), ("Ăn ở nhà hàng", O("interaction.practical_needs")), ("Hội thoại: trả tiền, mời khách", O("interaction.practical_needs", "interaction.everyday_conversation"))])

unit(6, "unit-t", "ut", "Hỏi đường, taxi và tàu điện", "Hỏi đường đến ga, nói với tài xế taxi, hiểu chỉ đường ngắn.", """
## Hỏi đường

- *请问，地铁站怎么走？* (zěn me zǒu) — Xin hỏi, đến ga tàu điện đi thế nào?
- *远吗？* — Có xa không? → *不远，走五分钟。*

### Chỉ đường
- *一直往前走。* (wǎng) — Cứ đi thẳng.
- *到路口往左拐。* — Đến ngã tư thì rẽ trái.
- *在左边* bên trái, *在右边* bên phải, *在对面* đối diện

### Đi taxi
- *师傅，去火车站。* — Bác tài, đến ga tàu. (*师傅* là cách gọi lịch sự tài xế, thợ.)
- *到了，就在这儿停。* — Đến rồi, dừng ở đây.

*出租车* (chū zū chē) là taxi; "đi taxi" nói hằng ngày là *打车*. Ở Đài Loan taxi gọi là *計程車*. Ở Trung Quốc người ta hay gọi xe qua ứng dụng.

### "Bạn giả"
*走* (zǒu) là đi, đi bộ, rời đi — không phải "tẩu" (bỏ chạy) như trong tiếng Việt.

### Hỏi lại cho chắc
*是左边吗？* — Bên trái phải không? Nhắc lại hướng người ta vừa chỉ là cách tốt để không đi lạc.
""", [("出租车", "🚕"), ("往", "⤴️"), ("左边", "⬅️"), ("右边", "👉")],
     [("Hỏi đường", O("interaction.practical_needs")), ("Hội thoại: chỉ đường", O("interaction.practical_needs", "existence.you_zai")), ("Đi taxi", O("interaction.practical_needs")), ("Hội thoại: đi tàu", O("interaction.practical_needs", "listening.short_dialogues"))])

unit(6, "unit-u", "uu", "Ở phòng khám", "Nói chỗ đau, trả lời câu hỏi ở quầy, nghe cách uống thuốc.", """
## Đi khám

- *我不舒服。* (shū fu) — Tôi thấy không khoẻ.
- *我头疼。* (téng) — Tôi đau đầu. *肚子疼* đau bụng, *发烧* sốt
- *医生* (yī shēng) — bác sĩ; *医院* (yī yuàn) — bệnh viện

### Ở quầy lấy số
- *挂号* — lấy số khám. *您哪儿不舒服？* — Anh khó chịu ở đâu?
- *有护照吗？* — Có hộ chiếu không?

### Bác sĩ hỏi
- *疼了几天了？* — Đau mấy ngày rồi? → *两天了。*
- *发烧吗？* — Có sốt không?

### Uống thuốc
*药* (yào) — thuốc. *一天三次，一次两片。* — Một ngày ba lần, mỗi lần hai viên. *饭后吃。* — Uống sau khi ăn.

Tiếng Trung nói *吃药* (ăn thuốc), không phải "uống thuốc".

### Giấy nghỉ ốm
Muốn nghỉ có lương, nhiều công ty cần giấy của bác sĩ: *请给我开一张病假条。* — Xin viết cho tôi một giấy nghỉ ốm. Hãy giữ lại hoá đơn và giấy tờ.
""", [("医院", "🏥"), ("医生", "🩺"), ("疼", "🤕"), ("药", "💊")],
     [("Ở quầy", O("interaction.practical_needs")), ("Hội thoại: bác sĩ hỏi", O("interaction.practical_needs", "vocab.everyday_basics")), ("Nói chỗ đau", O("interaction.practical_needs")), ("Hội thoại: uống thuốc", O("interaction.practical_needs", "numbers.measure_words"))])

unit(6, "unit-v", "uv", "Gọi điện cho chỗ làm", "Gọi điện báo ốm, xin nghỉ, và nói chuyện ngắn với tổ trưởng.", """
## Nghe và gọi điện

- *喂，您好！* — A lô, xin chào! Pinyin ghi *喂* là wèi; khi nghe điện thoại người ta thường đọc wéi (thanh 2).
- *我是二号车间的阮明。* — Tôi là Nguyễn Minh ở phân xưởng số hai.

### Báo ốm, xin nghỉ
- *我今天生病了，不能来上班。* — Hôm nay tôi ốm, không đi làm được.
- *我想请一天假。* — Tôi muốn xin nghỉ một ngày.
- *明白了，好好休息。* (míng bai) — Hiểu rồi, nghỉ ngơi cho khoẻ.

### Gọi lại
*我一会儿再打给你。* (zài) — Lát nữa tôi gọi lại cho bạn. *再* là "lại, nữa" cho việc chưa xảy ra.

### Nghe không rõ
Điện thoại khó nghe hơn nói trực tiếp: *喂？听不清楚，请再说一遍。* — A lô? Nghe không rõ, xin nói lại.

### Kết thúc
*好，谢谢，再见！* Người Hoa hay nói *拜拜* (bái bái) khi cúp máy với đồng nghiệp.
""", [("喂", "📞"), ("打电话", "🤙"), ("明白", "🆗"), ("再", "🔁")],
     [("Gọi điện báo ốm", O("interaction.practical_needs")), ("Hội thoại: xin nghỉ", O("interaction.practical_needs", "politeness.register")), ("Trò chuyện với tổ trưởng", O("interaction.everyday_conversation")), ("Hội thoại: WeChat và ngày đầu đi làm", O("interaction.everyday_conversation", "speaking.self_intro"))])

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

os.makedirs(f"{ROOT}/content/zh/_drafts/units", exist_ok=True)
with open(f"{ROOT}/content/zh/_drafts/units/OUTPUT.jsonl", "w", encoding="utf-8", newline="\n") as f:
    f.write("\n".join(lines) + "\n")
profile = f"{ROOT}/content/zh/_drafts/staged/content/courses/{C}.profile.json"
os.makedirs(os.path.dirname(profile), exist_ok=True)
with open(profile, "w", encoding="utf-8", newline="\n") as f:
    json.dump({"role": "primary", "allowUnreviewed": True, "betaUntilReviewed": True}, f, indent=2)
    f.write("\n")
# The inherited zh-en basic pack is never edited; once zh-vi is the primary course it stands alone like ja-en and de-en:
# its own lessons, no shared daily words or FSRS stream (the syllabus and its units belong to zh-vi).
with open(f"{ROOT}/content/zh/_drafts/staged/content/courses/zh-en.profile.json", "w", encoding="utf-8", newline="\n") as f:
    json.dump({"basicPack": True, "role": "standalone", "enabled": {"fsrs": False, "dailySession": False}}, f, indent=2)
    f.write("\n")
print(len(lines), "units,", sum(len(u["words"]) for u in UNITS), "words,", sum(len(u["lessons"]) for u in UNITS), "lessons")

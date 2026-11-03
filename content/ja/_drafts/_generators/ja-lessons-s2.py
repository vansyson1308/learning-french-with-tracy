"""ja-vi Section 2 lessons (building blocks): noun sentences and particles (unit a), polite verbs and the three groups
(b), あります/います and adjectives (c), time, dates and counters (d), the scripts, kanji through Hán-Việt, long vowels
and the small っ (e). Every lesson shows a concept card. Particle fill-ins take the slot of the blueprint's article
exercise; ます forms are drilled as fill-ins and, from session 3, as conjugationCloze items (K) whose keys are the
paradigm cells of the kaikki morphology rows (ja_paradigms.py). Writes lessons/parts/s2.jsonl. usage: python -I ja-lessons-s2.py <repo root>"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ja_lesson_lib import C, F, H, K, M, N, NX, T, TX, W, Y, finish, lesson

# ---------------------------------------------------------------- ua: noun sentences and particles
lesson("ua-l0", [
    C("questions"),
    T("何", ["誰", "どこ", "いつ"]), N("誰", ["何", "どこ", "どれ"]),
    F("わたしは先生___。", "じゃありません", ["です", "でした", "ですか"], "Tôi không phải là giáo viên."),
    F("昨日は休み___。", "でした", ["です", "じゃありません", "ますか"], "Hôm qua là ngày nghỉ."),
    F("ナムさんは学生です___。", "か", ["を", "に", "で"], "Anh Nam là sinh viên à?"),
    TX("これはなんですか。", "Đây là cái gì?", ["Cái kia là cái gì?", "Đây là của ai?", "Cái này ở đâu?"]),
    NX("Anh Nam không phải là người Nhật.", "ナムさんは日本人じゃありません。", ["ナムさんは日本人です。", "ナムさんは日本人じゃありませんでした。", "ナムさんを日本人じゃありません。"]),
    W("Đó là cái gì?", "それ|は|なん|です|か", ["これ", "を"]),
    Y("Tôi không phải là sinh viên.", "わたしは学生じゃありません", "わたしは学生ではありません"),
])
lesson("ua-l1", [
    C("kosoado"),
    T("これ", ["それ", "あれ", "どれ"]), N("あれ", ["これ", "それ", "どれ"]),
    F("___本はわたしのです。", "この", ["これ", "ここ", "こちら"], "Quyển sách này là của tôi."),
    F("トイレは___ですか。", "どこ", ["どれ", "どの", "だれ"], "Nhà vệ sinh ở đâu?"),
    TX("それはわたしのかさです。", "Đó là cái ô của tôi.", ["Đây là cái ô của tôi.", "Cái ô kia là của bạn.", "Ô của tôi ở đâu?"]),
    NX("Cái túi kia là của ai?", "あのかばんは誰のですか。", ["あれかばんは誰のですか。", "あのかばんは誰ですか。", "あのかばんを誰のですか。"]),
    W("Đây là đồng hồ của tôi.", "これ|は|わたし|の|時計|です", ["この", "を"]),
    Y("Cái này là gì?", "これはなんですか", "これは何ですか"),
    M("この", "その", "あの", "どの"),
])
lesson("ua-l2", [
    C("particles-no-to-mo"),
    F("わたし___ベトナム人です。", "も", ["を", "で", "に"], "Tôi cũng là người Việt Nam."),
    F("これは会社___電話です。", "の", ["を", "で", "が"], "Đây là điện thoại của công ty."),
    F("パン___牛乳を買います。", "と", ["を", "で", "が"], "Tôi mua bánh mì và sữa."),
    F("パン___果物などを買います。", "や", ["を", "で", "が"], "Tôi mua những thứ như bánh mì, hoa quả."),
    T("手紙", ["切手", "新聞", "時計"]),
    TX("ミンさんとランさんは学生です。", "Minh và Lan là sinh viên.", ["Minh là sinh viên của Lan.", "Minh cũng là sinh viên.", "Minh và Lan là giáo viên."]),
    NX("Tôi cũng là sinh viên.", "わたしも学生です。", ["わたしはも学生です。", "わたしも学生をです。", "わたしの学生です。"]),
    W("Đây là báo của anh Nam.", "これ|は|ナム|さん|の|新聞|です", ["を", "も"]),
    Y("Tôi cũng là người Việt Nam.", "わたしもベトナム人です"),
])
lesson("ua-l3", [
    C("wa-ga"),
    F("誰___来ましたか。", "が", ["を", "で", "へ"], "Ai đã đến?"),
    F("これ___わたしのかばんです。", "は", ["を", "に", "で"], "Đây là cái túi của tôi."),
    T("国", ["会社", "名前", "物"]), N("会社", ["国", "学校", "店"]),
    TX("お国はどこですか。", "Bạn đến từ nước nào?", ["Bạn làm ở công ty nào?", "Bạn bao nhiêu tuổi?", "Nước này là nước nào?"]),
    NX("Bạn bao nhiêu tuổi?", "何歳ですか。", ["何時ですか。", "何人ですか。", "何曜日ですか。"]),
    W("Công ty ở đâu?", "会社|は|どこ|です|か", ["誰", "を"]),
    Y("Ai đã đến?", "誰が来ましたか", "だれが来ましたか"),
    M("国", "会社", "手紙", "新聞", "時計"),
])

# ---------------------------------------------------------------- ub: polite verbs
lesson("ub-l0", [
    C("masu-form"),
    T("行く", ["来る", "帰る", "働く"]), N("帰る", ["行く", "来る", "寝る"]),
    F("明日、会社へ___。", "行きます", ["行きました", "来ません", "寝ました"], "Mai tôi đi làm."),
    F("昨日、テレビを___。", "見ました", ["見ます", "見ません", "聞きます"], "Hôm qua tôi đã xem ti vi."),
    F("お酒を___。", "飲みません", ["飲みます", "飲みました", "食べません"], "Tôi không uống rượu."),
    NX("Tôi đã không đi làm.", "会社へ行きませんでした。", ["会社へ行きません。", "会社へ行きました。", "会社を行きませんでした。"]),
    W("Hôm qua tôi đã về nhà.", "昨日|うち|へ|帰りました", ["帰ります", "を"]),
    Y("Tôi đã xem ti vi.", "テレビを見ました"),
    M("行く", "来る", "帰る", "寝る", "起きる"),
    K("毎朝6時に___。", "起きる", "polite:nonpast:aff", "Sáng nào tôi cũng dậy lúc sáu giờ."),
    K("日曜日は会社へ___。", "行く", "polite:nonpast:neg", "Chủ nhật tôi không đi làm."),
    K("昨日、映画を___。", "見る", "polite:past:aff", "Hôm qua tôi đã xem phim."),
    K("昨日はテレビを___。", "見る", "polite:past:neg", "Hôm qua tôi đã không xem ti vi."),
])
lesson("ub-l1", [
    C("verb-groups"),
    F("食べる → ___", "食べます", ["食べります", "食べいます", "食べるます"], "ăn → dạng lịch sự"),
    F("帰る → ___", "帰ります", ["帰ます", "帰るます", "帰りです"], "về → dạng lịch sự"),
    F("来る → ___", "来ます", ["来るます", "くります", "こます"], "đến → dạng lịch sự"),
    F("する → ___", "します", ["すります", "しります", "すます"], "làm → dạng lịch sự"),
    T("起きる", ["寝る", "見る", "聞く"]), N("聞く", ["見る", "買う", "働く"]),
    TX("毎朝6時に起きます。", "Sáng nào tôi cũng dậy lúc sáu giờ.", ["Sáng nay tôi dậy lúc sáu giờ.", "Tối nào tôi cũng ngủ lúc sáu giờ.", "Tôi dậy lúc sáu giờ rưỡi."]),
    W("Tôi làm việc ở nhà máy.", "工場|で|働きます", ["に", "行きます"]),
    Y("Tôi mua bánh mì.", "パンを買います"),
    M("見る", "聞く", "買う", "する", "働く"),
    K("毎晩11時に___。", "寝る", "polite:nonpast:aff", "Tối nào tôi cũng đi ngủ lúc mười một giờ."),
    K("ナムさんは工場で___。", "働く", "polite:nonpast:aff", "Anh Nam làm việc ở nhà máy."),
    K("友達がうちへ___。", "来る", "polite:past:aff", "Bạn tôi đã đến nhà tôi."),
    K("日本語で手紙を___。", "書く", "polite:nonpast:aff", "Tôi viết thư bằng tiếng Nhật."),
    K("今日は何も___。", "買う", "polite:past:neg", "Hôm nay tôi đã không mua gì cả."),
])
lesson("ub-l2", [
    C("particles-ni-de-he"),
    F("7時___起きます。", "に", ["で", "を", "が"], "Tôi dậy lúc bảy giờ."),
    F("工場___働きます。", "で", ["に", "を", "が"], "Tôi làm việc ở nhà máy."),
    F("バス___会社へ行きます。", "で", ["を", "に", "が"], "Tôi đi làm bằng xe buýt."),
    F("毎日、日本語を勉強___。", "します", ["きます", "ます", "あります"], "Ngày nào tôi cũng học tiếng Nhật."),
    F("来週、日本___行きます。", "へ", ["を", "で", "が"], "Tuần sau tôi đi Nhật."),
    NX("Chủ nhật tôi đi công viên.", "日曜日に公園へ行きます。", ["日曜日に公園を行きます。", "日曜日で公園へ行きます。", "日曜日に公園で行きます。"]),
    TX("毎晩11時に寝ます。", "Tối nào tôi cũng đi ngủ lúc mười một giờ.", ["Tối nay tôi đi ngủ lúc mười một giờ.", "Tối nào tôi cũng dậy lúc mười một giờ.", "Tôi ngủ mười một tiếng."]),
    W("Thứ hai tôi đi đến công ty.", "月曜日|に|会社|へ|行きます", ["で", "を"], alts=("会社|へ|月曜日|に|行きます",)),
    Y("Tôi đi đến nhà ga.", "駅へ行きます", "駅に行きます"),
    M("毎日", "毎朝", "毎晩", "今日", "明日"),
    K("週末は日本語を___。", "勉強する", "polite:past:aff", "Cuối tuần tôi đã học tiếng Nhật."),
    K("駅で友達を___。", "待つ", "polite:nonpast:aff", "Tôi đợi bạn ở nhà ga."),
    K("昨日はうちへ___。", "帰る", "polite:past:neg", "Hôm qua tôi đã không về nhà."),
])
lesson("ub-l3", [
    C("invitations"),
    F("一緒に昼ご飯を食べ___。", "ませんか", ["ません", "ました", "ませんでした"], "Cùng ăn trưa không?"),
    F("じゃあ、行き___。", "ましょう", ["ません", "ました", "ませんでした"], "Vậy thì mình đi thôi."),
    TX("一緒に映画を見ませんか。", "Cùng xem phim không?", ["Tôi không xem phim.", "Bạn đã xem phim chưa?", "Cùng xem ti vi nhé."]),
    F("9時___5時まで働きます。", "から", ["まで", "に", "で"], "Tôi làm từ chín giờ đến năm giờ."),
    F("駅___歩きます。", "まで", ["が", "の", "と"], "Tôi đi bộ đến ga."),
    NX("Cuộc họp bắt đầu từ mấy giờ?", "会議は何時からですか。", ["会議は何時までですか。", "会議は何時にですか。", "会議を何時からですか。"]),
    W("Tôi làm việc từ thứ hai đến thứ sáu.", "月曜日|から|金曜日|まで|働きます", ["に", "で"]),
    Y("Cùng đi không?", "一緒に行きませんか"),
    H("いつも", ["もう", "まだ", "また"]),
    M("いつも", "時々", "よく", "もう", "まだ"),
    K("先週は新聞を___。", "読む", "polite:past:neg", "Tuần trước tôi đã không đọc báo."),
    K("先生と日本語で___。", "話す", "polite:past:aff", "Tôi đã nói chuyện với thầy giáo bằng tiếng Nhật."),
    K("今朝は朝ご飯を___。", "食べる", "polite:past:neg", "Sáng nay tôi đã không ăn sáng."),
])

# ---------------------------------------------------------------- uc: あります・います and adjectives
lesson("uc-l0", [
    C("aru-iru"),
    T("ある", ["いる", "する", "なる"]),
    F("机の上に本が___。", "あります", ["います", "します", "行きます"], "Trên bàn có quyển sách."),
    F("部屋にナムさんが___。", "います", ["あります", "します", "です"], "Trong phòng có anh Nam."),
    F("公園に犬___います。", "が", ["を", "で", "へ"], "Ở công viên có con chó."),
    NX("Ở ga có một cái hòm thư.", "駅にポストがあります。", ["駅にポストがいます。", "駅でポストがあります。", "駅にポストをあります。"]),
    W("Trong phòng có cái giường.", "部屋|に|ベッド|が|あります", ["います", "で"]),
    Y("Ở đây có nhà vệ sinh.", "ここにトイレがあります"),
    M("部屋", "机", "いす", "ベッド", "テーブル"),
])
lesson("uc-l1", [
    C("kosoado"),
    T("上", ["下", "中", "外"]), N("後ろ", ["前", "横", "外"]),
    F("かばんは机の___にあります。", "下", ["隣", "外", "後"], "Cái túi ở dưới gầm bàn."),
    F("銀行は___にありますか。", "どこ", ["だれ", "いつ", "なん"], "Ngân hàng ở đâu?"),
    TX("エレベーターはあそこです。", "Thang máy ở đằng kia.", ["Thang máy ở đây.", "Thang máy ở chỗ đó.", "Thang máy ở đâu?"]),
    NX("Con mèo ở sau cái ghế.", "猫はいすの後ろにいます。", ["猫はいすの後ろにあります。", "猫はいすの後ろでいます。", "いすは猫の後ろにいます。"]),
    W("Ngân hàng ở cạnh bưu điện.", "銀行|は|郵便局|の|隣|に|あります", ["います", "で"]),
    Y("Thang máy ở đâu?", "エレベーターはどこですか", "エレベーターはどこにありますか"),
    M("上", "下", "中", "外", "隣"),
])
lesson("uc-l2", [
    C("adjectives"),
    T("大きい", ["小さい", "新しい", "古い"]), N("安い", ["高い", "新しい", "古い"]),
    F("この部屋は___です。", "広い", ["広いな", "広く", "広かった"], "Phòng này rộng."),
    F("このかばんは高く___。", "ないです", ["です", "なです", "いです"], "Cái túi này không đắt."),
    F("静か___部屋です。", "な", ["の", "い", "が"], "Đó là căn phòng yên tĩnh."),
    NX("công ty mới", "新しい会社", ["新しいな会社", "会社新しい", "新しく会社"]),
    W("Cái túi này rẻ.", "この|かばん|は|安い|です", ["高い", "な"]),
    Y("Phòng này nhỏ.", "この部屋は小さいです"),
    M("大きい", "小さい", "新しい", "古い", "安い"),
])
lesson("uc-l3", [
    C("particles-ni-de-he"),
    F("昨日は___です。", "寒かった", ["寒い", "寒くない", "寒いでした"], "Hôm qua trời lạnh."),
    F("この町は___じゃありません。", "静か", ["古い", "大きい", "新しい"], "Thị trấn này không yên tĩnh."),
    F("このレストランは___です。", "有名", ["有名な", "有名の", "有名い"], "Nhà hàng này nổi tiếng."),
    TX("この辞書は便利です。", "Quyển từ điển này tiện lợi.", ["Quyển từ điển này đắt.", "Quyển từ điển này không tiện.", "Từ điển ở đâu?"]),
    NX("Hôm qua tôi bận.", "昨日は忙しかったです。", ["昨日は忙しいでした。", "昨日は忙しくないです。", "昨日は忙しいです。"]),
    W("Phòng của tôi sáng và rộng.", "わたし|の|部屋|は|明るくて|広い|です", ["な", "明るい"]),
    Y("Hôm qua trời nóng.", "昨日は暑かったです"),
    M("便利", "有名", "静か", "簡単", "きれい"),
])

# ---------------------------------------------------------------- ud: time, dates and counters
lesson("ud-l0", [
    C("time-dates"),
    T("今日", ["明日", "昨日", "毎日"]), N("明日", ["今日", "昨日", "あさって"]),
    F("今、___ですか。", "何時", ["何人", "何歳", "いくつ"], "Bây giờ là mấy giờ?"),
    F("8時___です。", "半", ["ごろ", "まで", "から"], "Tám giờ rưỡi."),
    TX("会議は3時からです。", "Cuộc họp bắt đầu từ ba giờ.", ["Cuộc họp kết thúc lúc ba giờ.", "Cuộc họp kéo dài ba tiếng.", "Cuộc họp lúc mấy giờ?"]),
    NX("Ngày mai tôi nghỉ.", "明日は休みです。", ["明日に休みです。", "昨日は休みでした。", "明日は休みでした。"]),
    W("Tôi dậy lúc sáu giờ rưỡi.", "6時半|に|起きます", ["で", "寝ます"]),
    Y("Bây giờ là mấy giờ?", "今、何時ですか", "今何時ですか"),
    M("今日", "明日", "昨日", "今朝", "毎日"),
])
lesson("ud-l1", [
    C("numbers"),
    T("月曜日", ["火曜日", "水曜日", "日曜日"]), N("金曜日", ["木曜日", "土曜日", "月曜日"]),
    M("月曜日", "火曜日", "水曜日", "木曜日", "金曜日"),
    F("今日は___ですか。", "何曜日", ["何時", "何人", "何歳"], "Hôm nay là thứ mấy?"),
    TX("誕生日は五月二十日です。", "Sinh nhật tôi là ngày hai mươi tháng năm.", ["Sinh nhật tôi là ngày năm tháng hai mươi.", "Sinh nhật tôi là ngày hai tháng năm.", "Sinh nhật tôi vào tháng năm năm nay."]),
    NX("Thứ bảy tuần sau tôi nghỉ.", "来週の土曜日は休みです。", ["先週の土曜日は休みです。", "来週の土曜日は休みでした。", "来週の日曜日は休みです。"]),
    W("Hôm nay là ngày mùng ba.", "今日|は|三日|です", ["三月", "に"]),
    Y("Sinh nhật tôi vào tháng chín.", "誕生日は九月です"),
    H("ついたち", ["はつか", "ようか", "いつか"]),
])
lesson("ud-l2", [
    C("counters"),
    T("枚", ["個", "回", "番"]),
    F("切手を2___ください。", "枚", ["個", "回", "番"], "Cho tôi hai con tem."),
    F("りんごを3___ください。", "個", ["枚", "回", "番"], "Cho tôi ba quả táo."),
    F("薬を一日3___飲みます。", "回", ["枚", "個", "番"], "Ngày tôi uống thuốc ba lần."),
    TX("兄弟は二人います。", "Tôi có hai anh chị em.", ["Tôi có hai người con.", "Tôi có hai người bạn.", "Anh chị em tôi hai tuổi."]),
    NX("Gia đình bạn có mấy người?", "家族は何人ですか。", ["家族はいくつですか。", "家族は何歳ですか。", "家族は何時ですか。"]),
    W("Cho tôi hai cái bánh mì.", "パン|を|二つ|ください", ["二人", "に"]),
    Y("Cho tôi một tấm vé.", "切符を1枚ください", "切符を一枚ください", "切符を1枚お願いします", "切符を一枚お願いします"),
    M("一つ", "一人", "枚", "個", "回"),
])
lesson("ud-l3", [
    C("questions"),
    F("学生は何人___か。", "います", ["あります", "します", "行きます"], "Có mấy sinh viên?"),
    TX("コップは全部でいくつありますか。", "Có tất cả bao nhiêu cái cốc?", ["Cốc này giá bao nhiêu?", "Cốc ở đâu?", "Bạn cần mấy cái cốc?"]),
    NX("Trong phòng có hai người.", "部屋に二人います。", ["部屋に二つあります。", "部屋に二人あります。", "部屋で二人います。"]),
    H("いくつ", ["いくら", "いつ", "どこ"]),
    W("Tôi uống cà phê hai lần một ngày.", "一日|2回|コーヒー|を|飲みます", ["2個", "で"], alts=("コーヒー|を|一日|2回|飲みます",)),
    Y("Có mấy cái?", "いくつありますか", "いくつですか"),
    F("このかばんはいくらです___。", "か", ["を", "が", "で"], "Cái túi này bao nhiêu tiền?"),
    M("いくつ", "いくら", "何人", "何歳", "何時"),
    N("何曜日", ["何時", "何歳", "何人"]),
])

# ---------------------------------------------------------------- ue: scripts, kanji, sounds
lesson("ue-l0", [
    C("kana"),
    T("ひらがな", ["カタカナ", "漢字", "言葉"]), N("カタカナ", ["ひらがな", "漢字", "日本語"]),
    F("コーヒーは___で書きます。", "カタカナ", ["ひらがな", "漢字", "英語"], "Từ \"cà phê\" được viết bằng katakana."),
    TX("これはひらがなです。", "Đây là chữ hiragana.", ["Đây là chữ katakana.", "Đây là chữ Hán.", "Đây là tiếng Nhật."]),
    NX("Tôi viết tên bằng katakana.", "名前をカタカナで書きます。", ["名前をカタカナを書きます。", "名前はカタカナに書きます。", "カタカナを名前で書きます。"]),
    W("Tôi đọc hiragana.", "ひらがな|を|読みます", ["書きます", "で"]),
    Y("Gõ bằng hiragana: \"tôi\".", "わたし"),
    Y("Gõ bằng katakana: \"bánh mì\".", "パン"),
    M("ひらがな", "カタカナ", "漢字", "日本語", "言葉"),
])
lesson("ue-l1", [
    C("kanji-hanviet"),
    T("電話", ["電気", "電車", "番号"]), T("安全", ["危険", "注意", "禁止"]), N("勉強", ["質問", "授業", "宿題"]),
    NX("Từ nào có âm Hán-Việt gần với \"điện thoại\"?", "電話", ["電車", "電気", "会社"]),
    NX("Từ nào nghĩa là \"nhà máy\", không phải \"công trường\"?", "工場", ["会社", "学校", "銀行"]),
    F("___を勉強します。", "日本語", ["日本人", "日本", "ベトナム人"], "Tôi học tiếng Nhật."),
    M("学生", "先生", "会社", "電話", "安全"),
    Y("Gõ từ \"điện thoại\" bằng tiếng Nhật.", "電話"),
])
lesson("ue-l2", [
    C("length-pitch"),
    H("おばあさん", ["おばさん", "おじさん", "おじいさん"]), H("切手", ["来て", "聞いて", "書いて"]), H("ビール", ["ビル", "ベル", "ボール"]),
    T("おばあさん", ["おじいさん", "お父さん", "お兄さん"]),
    F("コ___ヒー", "ー", ["っ", "ん", "ゃ"], "cà phê"),
    F("き___て", "っ", ["ー", "ん", "ゃ"], "con tem"),
    F("がっこ___", "う", ["お", "ー", "っ"], "trường học", plain=True),  # a word spelt in kana, not a sentence
    M("ビール", "コーヒー", "切手", "学校", "おばあさん"),
    Y("Gõ từ \"trường học\" bằng tiếng Nhật.", "学校"),
])
lesson("ue-l3", [
    C("katakana-loanwords"),
    T("テレビ", ["パソコン", "ラジオ", "カメラ"]), N("パソコン", ["テレビ", "スマホ", "メール"]),
    NX("Tên \"Lan\" viết bằng katakana là:", "ラン", ["ナム", "ミン", "らん"]),
    F("ホ___ル", "テ", ["タ", "ト", "チ"], "khách sạn"),
    W("Tôi uống bia.", "ビール|を|飲みます", ["ビル", "に"]),
    Y("Gõ bằng katakana: \"cà phê\".", "コーヒー"),
    Y("Gõ bằng katakana: \"xe buýt\".", "バス"),
    M("テレビ", "パソコン", "バス", "タクシー", "ホテル"),
])
finish("s2")

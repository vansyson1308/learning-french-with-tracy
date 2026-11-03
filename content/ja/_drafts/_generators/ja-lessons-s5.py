"""ja-vi Section 5 lessons: writing everyday Japanese. The lessons build the written sentences with word banks, typed answers
and fill-ins, and since the writing session (P4c session 4) write them: guidedWriting and simpleForm mirror the tasks of
ja-writing-s5.py. About yourself (unit o, where kana typed for a kanji word counts as production in typed answers; in a
writing task kana is aligned through the readings as practice), simple linked sentences (p), messages to a superior (q)
and the forms of the city office and the clinic (r). Four lessons show a concept card. Writes lessons/parts/s5.jsonl.
usage: python -I ja-lessons-s5.py <repo root>"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ja_lesson_lib import C, F, H, K, M, MP, N, NX, T, TX, W, WR, Y, finish, lesson

# ---------------------------------------------------------------- uo: writing about yourself (kana input)
lesson("uo-l0", [
    C("kana"),
    WR("o_name"),
    WR("o_age"),
    T("書く", ["読む", "話す", "聞く"]), N("住所", ["名前", "電話", "国"]),
    Y("Gõ bằng chữ Nhật: tên của bạn (Nam) bằng katakana.", "ナム", kana=True),
    Y("Gõ bằng chữ Nhật: cà phê", "コーヒー", kana=True, script="katakana"),  # a loanword: こーひー is a misspelling
    Y("Gõ bằng chữ Nhật: con tem", "切手", kana=True),
    Y("Gõ bằng chữ Nhật: trường học", "学校", kana=True),
    H("きって", ["きて", "きいて", "きった"]),
])
lesson("uo-l1", [
    WR("o_home"),
    T("自分", ["友達", "家族", "名前"]), N("名前", ["住所", "番号", "仕事"]),
    F("わたし___名前はミンです。", "の", ["を", "に", "で"], "Tên của tôi là Minh."),
    W("Tôi 23 tuổi.", "23歳|です", ["何歳", "か"]),
    Y("Tôi là Minh.", "わたしはミンです", kana=True),
    Y("Tôi 22 tuổi.", "22歳です", "わたしは22歳です", kana=True),
    NX("Bạn viết câu đầu tiên của bài giới thiệu.", "わたしはグエンです。", ["わたしをグエンです。", "わたしはグエンさんです。", "グエンはわたしをです。"]),
])
lesson("uo-l2", [
    WR("o_family"),
    F("ベトナム___来ました。", "から", ["まで", "を", "が"], "Tôi đến từ Việt Nam."),
    TX("ハノイから来ました。", "Tôi đến từ Hà Nội.", ["Tôi sẽ đi Hà Nội.", "Tôi sống ở Hà Nội.", "Tôi làm việc ở Hà Nội."]),
    W("Tôi đến từ Việt Nam.", "ベトナム|から|来ました", ["まで", "行きました"]),
    W("Ngày nào tôi cũng làm việc ở nhà máy.", "毎日|工場|で|働いています", ["に", "会社"], alts=("工場|で|毎日|働いています",)),
    Y("Tôi làm việc ở công ty.", "会社で働いています", "会社で働きます", kana=True),
    NX("Bây giờ tôi làm việc ở Osaka.", "今、大阪で働いています。", ["今、大阪を働いています。", "今、大阪へ働いています。", "今、大阪で働いていますか。"]),
    M("住所", "自分", "仕事", "工場", "会社"),
])
lesson("uo-l3", [
    WR("o_all"),
    WR("o_open"),
    T("趣味", ["仕事", "住所", "名前"]),
    F("趣味___サッカーです。", "は", ["を", "で", "に"], "Sở thích của tôi là bóng đá."),
    W("Sở thích của tôi là âm nhạc.", "趣味|は|音楽|です", ["を", "映画"]),
    Y("Tôi đến từ Việt Nam.", "ベトナムから来ました", kana=True),
    Y("Sở thích của tôi là bóng đá.", "趣味はサッカーです", kana=True),
    TX("わたしはグエン・ミンです。23歳です。", "Tôi là Nguyễn Minh. Tôi 23 tuổi.", ["Tôi là Nguyễn Minh. Tôi 32 tuổi.", "Bạn là Nguyễn Minh à? Bạn bao nhiêu tuổi?", "Đây là Nguyễn Minh. Anh ấy 23 tuổi."]),
    NX("Bạn kết thúc bài tự giới thiệu.", "よろしくおねがいします。", ["はじめまして。", "いただきます。", "お疲れさまです。"]),
])

# ---------------------------------------------------------------- up: simple sentences
lesson("up-l0", [
    C("sov-subject"),
    WR("p_who"),
    W("Tôi dậy lúc 6 giờ.", "6時|に|起きます", ["で", "寝ます"]),
    W("Sáng nào tôi cũng ăn sáng ở căng tin.", "毎朝|食堂|で|朝ご飯|を|食べます", ["に", "飲みます"], alts=("食堂|で|毎朝|朝ご飯|を|食べます",)),
    F("毎朝、7時___会社へ行きます。", "に", ["で", "を", "が"], "Sáng nào tôi cũng đi làm lúc 7 giờ."),
    NX("Tối nào tôi cũng học tiếng Nhật.", "毎晩、日本語を勉強します。", ["毎晩、日本語に勉強します。", "毎晩に、日本語を勉強します。", "日本語は毎晩を勉強します。"]),
    Y("Tôi đi ngủ lúc 11 giờ.", "11時に寝ます"),
    TX("毎日、電車で会社へ行きます。", "Ngày nào tôi cũng đi làm bằng tàu điện.", ["Ngày nào tôi cũng đi làm bằng xe buýt.", "Hôm nay tôi đi làm bằng tàu điện.", "Tôi làm việc ở nhà ga mỗi ngày."]),
])
lesson("up-l1", [
    WR("p_neg"),
    WR("p_ask"),
    T("そして", ["でも", "それから", "だから"]), N("でも", ["そして", "それから", "じゃあ"]),
    F("日本語は難しいです。___、楽しいです。", "でも", ["そして", "だから", "それから"], "Tiếng Nhật khó. Nhưng vui."),
    F("ご飯を食べます。___、テレビを見ます。", "それから", ["でも", "だから", "じゃあ"], "Tôi ăn cơm. Sau đó tôi xem ti vi."),
    W("Tiếng Nhật khó. Nhưng vui.", "日本語|は|難しいです|でも|楽しいです", ["そして", "を"]),
    TX("雨です。だから、バスで行きます。", "Trời mưa. Vì vậy tôi đi xe buýt.", ["Trời mưa. Nhưng tôi đi bộ.", "Trời mưa. Sau đó tôi đi xe buýt.", "Trời không mưa. Tôi đi xe buýt."]),
    M("そして", "でも", "それから", "だから", "じゃあ"),
])
lesson("up-l2", [
    WR("p_link"),
    F("工場___働きます。", "で", ["を", "に", "が"], "Tôi làm việc ở nhà máy."),
    F("仕事は9時___5時までです。", "から", ["まで", "に", "を"], "Công việc từ 9 giờ đến 5 giờ."),
    W("Công việc của tôi bận lắm.", "仕事|は|とても|忙しいです", ["を", "暇"]),
    NX("Tôi làm việc ở nhà máy từ thứ hai đến thứ sáu.", "月曜日から金曜日まで工場で働きます。", ["月曜日まで金曜日から工場で働きます。", "月曜日から金曜日まで工場を働きます。", "月曜日から金曜日まで工場に働きます。"]),
    Y("Công việc vất vả nhưng vui.", "仕事は大変です。でも、楽しいです", "仕事は大変ですが、楽しいです", "仕事は大変ですけど、楽しいです",
      "仕事は大変ですけれど、楽しいです"),
    TX("昼ご飯は食堂で食べます。", "Tôi ăn trưa ở căng tin.", ["Tôi ăn tối ở căng tin.", "Tôi ăn trưa ở nhà.", "Căng tin mở cửa buổi trưa."]),
    M("仕事", "工場", "食堂", "忙しい", "大変"),
])
lesson("up-l3", [
    WR("p_open"),
    W("Tôi đã mua bánh mì ở siêu thị. Sau đó tôi về nhà.", "スーパー|で|パン|を|買いました|それから|うち|へ|帰りました", ["でも", "が"]),
    F("週末は友達___映画を見ました。", "と", ["を", "で", "へ"], "Cuối tuần tôi xem phim với bạn."),
    NX("Hôm qua tôi không đi làm.", "昨日、会社へ行きませんでした。", ["昨日、会社へ行きません。", "昨日、会社を行きませんでした。", "昨日に、会社へ行きませんでした。"]),
    Y("Hôm qua tôi đã học tiếng Nhật.", "昨日、日本語を勉強しました", "昨日日本語を勉強しました"),
    TX("朝ご飯を食べました。そして、会社へ行きました。", "Tôi đã ăn sáng. Rồi tôi đi làm.", ["Tôi chưa ăn sáng. Tôi đi làm.", "Tôi ăn sáng ở công ty.", "Tôi đã đi làm. Rồi tôi ăn sáng."]),
    H("それから", ["そして", "そうですか", "それ"]),
])

# ---------------------------------------------------------------- uq: messages to a superior
lesson("uq-l0", [
    C("politeness"),
    WR("q_sick"),
    T("上司", ["先輩", "友達", "先生"]), N("休み", ["仕事", "上司", "会議"]),
    F("熱___あります。", "が", ["を", "で", "に"], "Tôi bị sốt."),
    W("Hôm nay tôi xin nghỉ.", "今日|は|休みます", ["を", "働きます"], alts=("今日|休みます",)),
    NX("Bạn mở đầu tin nhắn gửi cấp trên.", "お疲れさまです。グエンです。", ["おやすみなさい。グエンです。", "いただきます。グエンです。", "お疲れさまです。グエンさんです。"]),
    Y("Tôi bị sốt. Hôm nay tôi xin nghỉ.", "熱があります。今日は休みます", "熱があります。今日休みます"),
    M("上司", "休み", "メール", "熱", "風邪"),
])
lesson("uq-l1", [
    WR("q_late"),
    T("遅刻する", ["休む", "急ぐ", "働く"]),
    F("電車が___います。", "遅れて", ["遅れ", "遅れる", "遅れた"], "Tàu điện đang bị trễ."),
    W("Tàu điện đang bị trễ.", "電車|が|遅れています", ["を", "バス"]),
    NX("Tôi sẽ đến muộn khoảng 15 phút.", "15分ぐらい遅れます。", ["15分ぐらい遅れました。", "15時ぐらい遅れます。", "15分ぐらい休みます。"]),
    Y("Tàu điện bị trễ. Tôi sẽ đến muộn.", "電車が遅れています。遅刻します", "電車が遅れています。遅れます", "電車が遅れました。遅刻します", "電車が遅れました。遅れます"),
    TX("すみません。5分ぐらい遅れます。", "Xin lỗi. Tôi sẽ đến muộn khoảng 5 phút.",["Xin lỗi. Tôi đến sớm 5 phút.", "Xin lỗi. Tôi chờ 5 phút.", "Xin lỗi. Tàu đến sau 5 phút."]),
    H("遅刻します", ["休みます", "急ぎます", "働きます"]),
])
lesson("uq-l2", [
    WR("q_reply"),
    F("わかりました。ありがとう___。", "ございます", ["ください", "します", "でした"], "Tôi hiểu rồi. Cảm ơn anh."),
    TX("明日は9時からです。", "Mai làm từ 9 giờ.", ["Mai làm đến 9 giờ.", "Hôm nay làm từ 9 giờ.", "Mai nghỉ lúc 9 giờ."]),
    NX("Cấp trên nhắn: mai bắt đầu từ 8 giờ. Bạn trả lời:", "わかりました。ありがとうございます。", ["わかりません。ありがとうございます。", "いただきます。ありがとうございます。", "わかりました。おめでとうございます。"]),
    W("Tôi hiểu rồi. Cảm ơn anh.", "わかりました|ありがとうございます", ["わかりません", "すみません"]),
    Y("Ngày mai thì tôi ổn (đi làm được).", "明日は大丈夫です", "明日大丈夫です", "明日は行けます", "明日は仕事に行けます", "明日は会社に行けます"),
    TX("会議は4時からです。", "Cuộc họp bắt đầu từ 4 giờ.", ["Cuộc họp kết thúc lúc 4 giờ.", "Cuộc họp kéo dài 4 tiếng.", "Cuộc họp vào thứ tư."]),
    M("会議", "上司", "先輩", "メール", "わかりました"),
])
lesson("uq-l3", [
    C("te-form"),
    WR("q_open"),
    W("Tôi sẽ đi bệnh viện.", "病院|へ|行きます", ["を", "来ます"]),
    F("風邪です。病院___行きます。", "へ", ["を", "で", "が"], "Tôi bị cảm. Tôi sẽ đi bệnh viện."),
    NX("Bạn kết thúc tin nhắn xin nghỉ.", "すみません。よろしくおねがいします。", ["すみません。いただきます。", "すみません。おやすみなさい。", "すみません。はじめまして。"]),
    Y("Xin lỗi. Hôm nay tôi đến muộn.", "すみません。今日は遅刻します", "すみません。今日は遅れます", "すみません。今日遅刻します"),
    TX("お疲れさまです。ナムです。風邪です。今日は休みます。", "Chào anh. Tôi là Nam. Tôi bị cảm. Hôm nay tôi nghỉ.", ["Chào anh. Tôi là Nam. Tôi bị cảm. Mai tôi nghỉ.", "Chào anh. Tôi là Nam. Tôi khoẻ rồi. Hôm nay tôi đi làm.", "Chào anh. Tôi là Nam. Tôi đến muộn."]),
    F("メールを___ください。", "見て", ["見ます", "見る", "見た"], "Xin hãy xem email."),
    M("遅刻する", "休む", "病院", "薬", "上司"),
    K("ちょっと___ください。", "待つ", "te", "Xin đợi một chút."),
    K("ここに名前を___ください。", "書く", "te", "Hãy viết tên vào đây."),
])

# ---------------------------------------------------------------- ur: forms at the city office
lesson("ur-l0", [
    WR("r_form_office"),
    T("市役所", ["郵便局", "銀行", "病院"]), N("在留カード", ["保険証", "カード", "ポイントカード"]),
    T("書類", ["紙", "手紙", "新聞"]), T("はんこ", ["ペン", "かぎ", "はし"]),
    F("ここに名前と住所___書いてください。", "を", ["に", "が", "で"], "Hãy viết tên và địa chỉ vào đây."),
    TX("在留カードを見せてください。", "Xin cho xem thẻ cư trú.", ["Xin cho xem thẻ bảo hiểm.", "Hãy làm thẻ cư trú.", "Thẻ cư trú ở đâu?"]),
    M("市役所", "在留カード", "書類", "はんこ", "住所"),
])
lesson("ur-l1", [
    C("katakana-loanwords"),
    Y("Viết tên Nam bằng katakana.", "ナム"),
    Y("Viết tên Lan bằng katakana.", "ラン"),
    Y("Viết họ Nguyễn bằng katakana.", "グエン"),
    NX("Nguyễn Văn Nam viết bằng katakana là:", "グエン・ヴァン・ナム", ["ナム・ヴァン・グエン", "ぐえん・ゔぁん・なむ", "グエン・ナム・ヴァン"]),
    TX("フリガナはカタカナで書いてください。", "Hãy viết cách đọc bằng katakana.", ["Hãy viết cách đọc bằng hiragana.", "Hãy viết tên bằng kanji.", "Hãy đọc to tên của bạn."]),
    W("Hãy viết bằng katakana.", "カタカナ|で|書いてください", ["ひらがな", "を"]),
])
lesson("ur-l2", [
    C("time-dates"),
    WR("r_form_clinic"),
    T("誕生日", ["今日", "週末", "休み"]),
    N("五月", ["四月", "九月", "十月"]), N("十日", ["二日", "九日", "二十日"]),
    F("誕生日は___です。", "五月", ["五日", "五つ", "四月"], "Sinh nhật tôi vào tháng năm."),
    TX("誕生日は九月二十日です。", "Sinh nhật tôi là ngày 20 tháng 9.", ["Sinh nhật tôi là ngày 9 tháng 20.", "Sinh nhật tôi là ngày 2 tháng 9.", "Sinh nhật tôi là ngày 20 tháng 10."]),
    MP(("一月", "tháng một"), ("四月", "tháng tư"), ("七月", "tháng bảy"), ("九月", "tháng chín"), ("十二月", "tháng mười hai")),
    NX("Sinh nhật bạn là khi nào?", "誕生日はいつですか。", ["誕生日はどこですか。", "誕生日はいくらですか。", "誕生日はだれですか。"]),
])
lesson("ur-l3", [
    WR("r_note"),
    WR("r_open"),
    F("電話番号___書いてください。", "も", ["で", "が", "へ"], "Hãy viết cả số điện thoại."),
    W("Địa chỉ của tôi ở Osaka.", "住所|は|大阪|です", ["を", "名前"]),
    NX("Nhân viên muốn bạn đóng dấu. Bạn không có con dấu. Bạn hỏi:", "はんこがありません。サインでもいいですか。", ["はんこがありません。サインをください。", "はんこがあります。サインでもいいですか。", "はんこはいりません。ありがとうございます。"]),
    T("窓口", ["受付", "入口", "出口"]),
    Y("Đây là thẻ cư trú của tôi.", "これはわたしの在留カードです", "わたしの在留カードです", "これ、在留カードです"),
    TX("書類はあちらの窓口です。", "Giấy tờ thì nộp ở quầy đằng kia.", ["Giấy tờ ở trên bàn này.", "Quầy này không nhận giấy tờ.", "Hãy viết giấy tờ ở nhà."]),
    M("名前", "電話", "番号", "誕生日", "窓口"),
])
finish("s5")

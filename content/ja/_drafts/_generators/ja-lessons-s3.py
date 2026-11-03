"""ja-vi Section 3 lessons: understanding everyday Japanese. Until the reception layer exists (readings, clips), the
lessons read signs, rules, timetables, receipts and short messages through select items (TX) and listen through H items;
the listening/reading comprehension and dictation exercises join them in the reception session. Four lessons show a
concept card. Writes lessons/parts/s3.jsonl.
usage: python -I ja-lessons-s3.py <repo root>"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ja_lesson_lib import C, F, H, M, N, NX, T, TX, W, WT, Y, finish, lesson

# ---------------------------------------------------------------- uf: words and phrases by ear
lesson("uf-l0", [
    H("天気", ["電気", "元気", "病気"]), H("雨", ["雪", "風", "春"]),
    T("暑い", ["寒い", "暖かい", "涼しい"]), N("寒い", ["暑い", "涼しい", "暖かい"]),
    TX("今日はいい天気ですね。", "Hôm nay trời đẹp nhỉ.", ["Hôm nay trời mưa nhỉ.", "Mai trời đẹp không?", "Hôm qua trời đẹp."]),
    H("雨が降っています。", ["雪が降っています。", "風が強いです。", "今日は暑いです。"]),
    F("今日は___ですね。", "寒い", ["暑い", "雪", "花"], "Hôm nay lạnh nhỉ."),
    Y("Trời nóng nhỉ.", "暑いですね", "今日は暑いですね"),
])
lesson("uf-l1", [
    H("7時です。", ["1時です。", "4時です。", "9時です。"]),
    H("350円です。", ["530円です。", "305円です。", "3500円です。"]),
    H("4時半", ["7時半", "4時", "8時半"]),
    TX("会議は2時からです。", "Cuộc họp bắt đầu từ hai giờ.", ["Cuộc họp kết thúc lúc hai giờ.", "Cuộc họp bắt đầu từ mười hai giờ.", "Cuộc họp kéo dài hai tiếng."]),
    TX("もう一度お願いします。", "Xin nhắc lại một lần nữa.", ["Xin nói chậm.", "Xin đợi một chút.", "Tôi hiểu rồi."]),
    F("バスは___時に来ます。", "8", ["18", "80", "6"], "Xe buýt đến lúc tám giờ."),
    Y("Bây giờ là mấy giờ?", "今、何時ですか"),
])
lesson("uf-l2", [
    T("春", ["夏", "秋", "冬"]), N("冬", ["春", "夏", "秋"]), M("春", "夏", "秋", "冬", "雪"),
    TX("ベトナムの夏はとても暑いです。", "Mùa hè ở Việt Nam rất nóng.", ["Mùa đông ở Việt Nam rất lạnh.", "Mùa hè ở Nhật rất nóng.", "Mùa hè ở Việt Nam không nóng lắm."]),
    TX("日本の冬は雪が多いです。", "Mùa đông ở Nhật có nhiều tuyết.", ["Mùa thu ở Nhật có nhiều tuyết.", "Mùa đông ở Nhật trời mưa nhiều.", "Mùa đông ở Việt Nam có nhiều tuyết."]),
    F("公園に___がいます。", "犬", ["花", "木", "山"], "Ở công viên có con chó."),
    W("Hôm nay trời quang.", "今日|は|晴れ|です", ["雨", "を"]),
    Y("Hôm nay trời mưa.", "今日は雨です", "今日は雨が降っています", "雨です"),
])
lesson("uf-l3", [
    H("涼しい", ["寒い", "少ない", "新しい"]),
    NX("Hôm nay trời lạnh nhỉ.", "今日は寒いですね。", ["今日は寒いですか。", "今日を寒いですね。", "今日は寒いでした。"]),
    M("犬", "猫", "花", "木", "山"),
    WT("雨が降っています。", "Trời|đang|mưa", ["tuyết", "nắng"]),
    F("今日は___が強いですね。", "風", ["雨", "雪", "花"], "Hôm nay gió mạnh nhỉ."),
    F("今日は寒いです___。", "ね", ["よ", "を", "が"], "Hôm nay lạnh nhỉ."),
    TX("明日は曇りです。", "Ngày mai trời nhiều mây.", ["Ngày mai trời nắng.", "Hôm nay trời nhiều mây.", "Ngày mai có tuyết."]),
    Y("Trời lạnh nhỉ.", "寒いですね", "今日は寒いですね"),
])

# ---------------------------------------------------------------- ug: signs and rules at the factory
lesson("ug-l0", [
    T("禁止", ["注意", "安全", "出口"]), N("出口", ["入口", "非常口", "受付"]), T("危ない", ["安全", "忙しい", "重い"]),
    TX("たばこは禁止です。", "Cấm hút thuốc.", ["Được hút thuốc.", "Thuốc lá ở đây.", "Hãy mua thuốc lá."]),
    TX("ここは危ないです。", "Chỗ này nguy hiểm.", ["Chỗ này an toàn.", "Chỗ này là lối ra.", "Chỗ này yên tĩnh."]),
    H("出口", ["入口", "非常口", "窓口"]),
    F("ここ___たばこを吸わないでください。", "で", ["を", "が", "に"], "Đừng hút thuốc ở đây."),
    M("工場", "安全", "危ない", "禁止", "注意"),
])
lesson("ug-l1", [
    C("te-form"),
    TX("ヘルメットをかぶってください。", "Hãy đội mũ bảo hộ.", ["Hãy cởi mũ bảo hộ.", "Đừng đội mũ bảo hộ.", "Mũ bảo hộ ở đây."]),
    TX("機械に触らないでください。", "Đừng chạm vào máy.", ["Hãy chạm vào máy.", "Máy đang chạy.", "Hãy dừng máy lại."]),
    NX("Biển ghi: Hãy đeo găng tay.", "手袋をしてください。", ["手袋を脱いでください。", "手袋に触らないでください。", "手袋をしないでください。"]),
    F("ボタン___押してください。", "を", ["に", "で", "が"], "Hãy ấn nút."),
    F("廊下を___ないでください。", "走ら", ["走り", "走る", "走って"], "Đừng chạy ở hành lang."),
    W("Đừng chạy ở hành lang.", "廊下|を|走らないでください", ["で", "走ってください"]),
    Y("Hãy đội mũ bảo hộ.", "ヘルメットをかぶってください"),
])
lesson("ug-l2", [
    TX("明日は7時からです。", "Ngày mai làm từ bảy giờ.", ["Ngày mai làm đến bảy giờ.", "Hôm nay làm từ bảy giờ.", "Ngày mai được nghỉ."]),
    TX("今日は残業します。", "Hôm nay tôi làm thêm giờ.", ["Hôm nay tôi nghỉ.", "Hôm nay tôi đến muộn.", "Hôm nay tôi về sớm."]),
    TX("会議は2時からです。食堂に来てください。", "Cuộc họp từ hai giờ. Hãy đến nhà ăn.", ["Cuộc họp từ hai giờ. Hãy ăn ở nhà ăn.", "Cuộc họp hết lúc hai giờ. Hãy đến nhà ăn.", "Nhà ăn mở từ hai giờ."]),
    F("先輩___メールが来ました。", "から", ["まで", "を", "で"], "Có email từ đàn anh."),
    N("先輩", ["上司", "社長", "店員"]),
    W("Mai làm từ tám giờ.", "明日|は|8時|から|です", ["まで", "を"]),
    Y("Tôi hiểu rồi.", "わかりました"),
    M("先輩", "上司", "会議", "給料", "休み"),
])
lesson("ug-l3", [
    H("機械を止めてください。", ["機械を使ってください。", "機械に触らないでください。", "機械を運んでください。"]),
    H("気をつけてください。", ["ちょっと待ってください。", "急いでください。", "座ってください。"]),
    TX("重い箱は二人で運んでください。", "Thùng nặng thì hai người cùng khiêng.", ["Thùng nặng thì một người khiêng.", "Thùng nhẹ thì hai người cùng khiêng.", "Đừng khiêng thùng nặng."]),
    F("安全靴___はいてください。", "を", ["に", "で", "が"], "Hãy đi giày bảo hộ."),
    NX("Máy dừng rồi. Bạn báo cho đàn anh.", "すみません、機械が止まりました。", ["すみません、機械を止まりました。", "すみません、機械が止めました。", "すみません、機械に止まりました。"]),
    M("機械", "部品", "道具", "手袋", "ヘルメット"),
    Y("Hãy cẩn thận.", "気をつけてください", "気をつけて"),
])

# ---------------------------------------------------------------- uh: at the station
lesson("uh-l0", [
    C("particles-ni-de-he"),
    H("電車が来ます。", ["電車が出ます。", "電車が止まります。", "電車が遅れています。"]),
    F("駅で地下鉄___乗ります。", "に", ["を", "が", "の"], "Tôi lên tàu điện ngầm ở ga."),
    TX("2番のバスに乗ってください。", "Hãy lên xe buýt số hai.", ["Hãy xuống xe buýt số hai.", "Hãy lên xe buýt số mười hai.", "Xe buýt số hai không đến."]),
    T("駅", ["電車", "切符", "空港"]), N("切符", ["駅", "荷物", "地図"]),
    M("駅", "電車", "地下鉄", "切符", "空港"),
    W("Tôi đi đến ga bằng xe đạp.", "自転車|で|駅|へ|行きます", ["を", "が"], alts=("駅|へ|自転車|で|行きます",)),
])
lesson("uh-l1", [
    TX("次の電車は10時5分です。", "Chuyến tàu tiếp theo lúc mười giờ năm phút.", ["Chuyến tàu tiếp theo lúc năm giờ mười phút.", "Chuyến tàu tiếp theo sau năm phút.", "Chuyến tàu cuối lúc mười giờ."]),
    TX("この電車は空港へ行きますか。", "Tàu này có đi sân bay không?", ["Tàu này đi sân bay.", "Tàu này từ sân bay đến.", "Sân bay ở đâu?"]),
    F("次の電車は___ですか。", "何時", ["何人", "いくつ", "誰"], "Chuyến tàu tiếp theo lúc mấy giờ?"),
    F("この電車は空港へ行きます___。", "よ", ["ね", "を", "が"], "Tàu này đi sân bay đấy."),
    NX("Tàu đang bị trễ.", "電車が遅れています。", ["電車を遅れています。", "電車が遅いです。", "電車に遅れました。"]),
    H("10時半", ["10時", "4時半", "11時半"]),
    W("Tàu đi đến sân bay.", "電車|は|空港|へ|行きます", ["で", "を"]),
    Y("Chuyến tàu tiếp theo lúc mấy giờ?", "次の電車は何時ですか", "次の電車は何時に来ますか"),
])
lesson("uh-l2", [
    H("電車は5分ぐらい遅れています。", ["電車は2分ぐらい遅れています。", "電車は5時に来ます。", "電車は来ません。"]),
    TX("ドアが閉まります。", "Cửa sắp đóng.", ["Cửa đang mở.", "Hãy mở cửa.", "Đừng đóng cửa."]),
    TX("次の駅で降りてください。", "Hãy xuống ở ga tiếp theo.", ["Hãy lên tàu ở ga tiếp theo.", "Ga tiếp theo là ga cuối.", "Hãy xuống ở ga này."]),
    F("次の駅___降りてください。", "で", ["が", "か", "や"], "Hãy xuống ở ga tiếp theo."),
    T("降りる", ["乗る", "着く", "歩く"]), N("乗る", ["降りる", "渡る", "曲がる"]),
    Y("Hãy xuống ở ga tiếp theo.", "次の駅で降りてください"),
])
lesson("uh-l3", [
    M("バス", "タクシー", "自転車", "車", "飛行機"),
    TX("荷物はここに置いてください。", "Hãy để hành lý ở đây.", ["Hãy mang hành lý đi.", "Hành lý ở đằng kia.", "Đừng để hành lý ở đây."]),
    H("地下鉄", ["自転車", "電車", "飛行機"]),
    NX("Xin lỗi, tàu này có đi sân bay không?", "すみません、この電車は空港へ行きますか。", ["すみません、この電車は空港を行きますか。", "すみません、この電車は空港で行きますか。", "すみません、空港はこの電車へ行きますか。"]),
    F("バス___空港へ行きます。", "で", ["を", "の", "へ"], "Tôi đi sân bay bằng xe buýt."),
    WT("電車が遅れています。", "Tàu điện|đang|bị trễ", ["sớm", "xe buýt"]),
    Y("Tôi đi đến ga bằng tàu điện ngầm.", "地下鉄で駅へ行きます", "地下鉄で駅に行きます", "駅へ地下鉄で行きます", "駅に地下鉄で行きます"),
])

# ---------------------------------------------------------------- ui: at the convenience store
lesson("ui-l0", [
    T("コンビニ", ["スーパー", "レストラン", "銀行"]), N("レジ", ["レシート", "袋", "カード"]),
    H("いらっしゃいませ。", ["いってらっしゃい。", "いただきます。", "失礼します。"]),
    TX("袋はいりますか。", "Bạn có cần túi không?", ["Bạn có túi không?", "Túi bao nhiêu tiền?", "Bạn mua túi à?"]),
    NX("Nhân viên hỏi bạn có cần túi không. Bạn không cần.", "いいえ、結構です。", ["はい、お願いします。", "いらっしゃいませ。", "いただきます。"]),
    M("コンビニ", "レジ", "袋", "レシート", "ポイントカード"),
    W("Không, tôi không cần túi.", "袋|は|いりません", ["を", "あります"]),
    Y("Vâng, nhờ anh.", "はい、お願いします"),
])
lesson("ui-l1", [
    H("あたためますか。", ["袋はいりますか。", "ポイントカードはありますか。", "はしはいりますか。"]),
    TX("ポイントカードはありますか。", "Bạn có thẻ tích điểm không?", ["Bạn có trả bằng thẻ không?", "Thẻ tích điểm ở đâu?", "Bạn có cần túi không?"]),
    TX("お弁当をあたためますか。", "Có hâm nóng cơm hộp không?", ["Bạn có ăn cơm hộp không?", "Cơm hộp bao nhiêu tiền?", "Bạn có cần đũa không?"]),
    NX("Bạn muốn nhân viên hâm nóng cơm hộp.", "お弁当をあたためてください。", ["お弁当をあたためないでください。", "お弁当にあたためてください。", "お弁当があたためてください。"]),
    F("はし___いりますか。", "は", ["を", "で", "へ"], "Bạn có cần đũa không?"),
    Y("Không cần đâu ạ.", "大丈夫です", "結構です", "いいえ、大丈夫です", "いいえ、結構です"),
    M("お弁当", "はし", "スプーン", "袋", "カード"),
])
lesson("ui-l2", [
    C("counters"),
    TX("全部で750円です。", "Tất cả là bảy trăm năm mươi yên.", ["Tất cả là bảy nghìn năm trăm yên.", "Một cái bảy trăm năm mươi yên.", "Tất cả là năm trăm bảy mươi yên."]),
    H("1200円です。", ["2100円です。", "1020円です。", "12000円です。"]),
    F("お弁当を___ください。", "一つ", ["一人", "一日", "一月"], "Cho tôi một hộp cơm."),
    NX("Cho tôi hai cái túi.", "袋を二つください。", ["袋を二人ください。", "袋に二つください。", "二つを袋ください。"]),
    TX("レシートはいりますか。", "Bạn có cần hoá đơn không?", ["Bạn có hoá đơn không?", "Hoá đơn ở đâu?", "Hãy đưa hoá đơn cho tôi."]),
    W("Tôi trả bằng thẻ.", "カード|で|お願いします", ["が", "の"]),
    Y("Tất cả bao nhiêu tiền?", "全部でいくらですか"),
])
lesson("ui-l3", [
    H("カードでお願いします。", ["カードはありません。", "袋をお願いします。", "レシートをください。"]),
    NX("Nhân viên hỏi bạn có cần đũa không. Bạn cần.", "はい、お願いします。", ["いいえ、結構です。", "いらっしゃいませ。", "ごちそうさまでした。"]),
    TX("いいえ、大丈夫です。", "Không, không cần đâu ạ.", ["Vâng, tôi khoẻ.", "Không, tôi không hiểu.", "Vâng, nhờ anh."]),
    F("袋は___です。", "結構", ["元気", "上手", "有名"], "Tôi không cần túi."),
    M("いらっしゃいませ", "結構", "大丈夫", "レシート", "お弁当"),
    W("Cho tôi cái này.", "これ|を|ください", ["に", "それ"]),
    Y("Không, không cần ạ.", "いいえ、結構です", "いいえ、大丈夫です", "結構です", "大丈夫です"),
])

# ---------------------------------------------------------------- uj: life in the dormitory
lesson("uj-l0", [
    C("sov-subject"),
    TX("ナムさんの寮は駅の近くです。", "Ký túc xá của Nam ở gần ga.", ["Ký túc xá của Nam ở xa ga.", "Nam sống ở gần công ty.", "Nhà ga ở trong ký túc xá."]),
    TX("ナムさんは毎朝6時に起きます。", "Sáng nào Nam cũng dậy lúc sáu giờ.", ["Sáng nào Nam cũng ngủ đến sáu giờ.", "Tối nào Nam cũng ngủ lúc sáu giờ.", "Sáng nay Nam dậy lúc sáu giờ."]),
    TX("朝ご飯を食べて、7時に寮を出ます。", "Ăn sáng xong, bảy giờ Nam rời ký túc xá.", ["Bảy giờ Nam ăn sáng ở ký túc xá.", "Bảy giờ Nam về ký túc xá.", "Nam không ăn sáng."]),
    T("寮", ["部屋", "家", "会社"]),
    F("夜は___で晩ご飯を食べます。", "食堂", ["銀行", "空港", "郵便局"], "Buổi tối Nam ăn tối ở nhà ăn."),
    WT("ナムさんは工場で働きます。", "Nam|làm việc|ở|nhà máy", ["công ty", "học"]),
    Y("Ký túc xá ở gần ga.", "寮は駅の近くです", "寮は駅から近いです"),
])
lesson("uj-l1", [
    TX("もえるごみは月曜日と木曜日です。", "Rác cháy được đổ vào thứ hai và thứ năm.", ["Rác cháy được đổ vào thứ ba và thứ sáu.", "Thứ hai và thứ năm không đổ rác.", "Rác đổ vào mỗi ngày."]),
    TX("ごみは朝8時までに出してください。", "Hãy đổ rác trước tám giờ sáng.", ["Hãy đổ rác sau tám giờ sáng.", "Hãy đổ rác lúc tám giờ tối.", "Đừng đổ rác buổi sáng."]),
    F("ごみは月曜日___出してください。", "に", ["を", "で", "が"], "Hãy đổ rác vào thứ hai."),
    N("ごみ", ["かぎ", "袋", "箱"]),
    M("月曜日", "木曜日", "土曜日", "日曜日", "ごみ"),
    NX("Hôm nay là thứ mấy?", "今日は何曜日ですか。", ["今日は何時ですか。", "何曜日は今日ですか。", "今日に何曜日ですか。"]),
    Y("Hôm nay là thứ hai.", "今日は月曜日です"),
])
lesson("uj-l2", [
    H("服を洗います。", ["服を着ます。", "服を買います。", "服を脱ぎます。"]),
    H("シャワーをあびます。", ["お風呂に入ります。", "歯を磨きます。", "部屋を掃除します。"]),
    TX("日曜日に部屋を掃除して、服を洗濯します。", "Chủ nhật tôi dọn phòng và giặt quần áo.", ["Chủ nhật tôi mua quần áo.", "Thứ bảy tôi dọn phòng.", "Chủ nhật tôi không làm gì."]),
    T("着る", ["かぶる", "脱ぐ", "洗う"]),
    M("シャツ", "ズボン", "靴", "靴下", "帽子"),
    F("帽子を___ます。", "かぶり", ["着", "はき", "洗い"], "Tôi đội mũ."),
    W("Tôi đi giày.", "靴|を|はきます", ["着ます", "に"]),
    Y("Tôi giặt quần áo.", "服を洗います", "服を洗濯します"),
])
lesson("uj-l3", [
    TX("夜10時から静かにしてください。", "Từ mười giờ tối hãy giữ yên lặng.", ["Đến mười giờ tối hãy giữ yên lặng.", "Mười giờ tối hãy tắt đèn.", "Từ mười giờ sáng hãy giữ yên lặng."]),
    TX("お風呂は6時から11時までです。", "Giờ tắm từ sáu giờ đến mười một giờ.", ["Giờ tắm từ sáu giờ đến mười giờ.", "Giờ tắm từ mười một giờ.", "Giờ ăn tối từ sáu giờ đến mười một giờ."]),
    F("寮の部屋___たばこを吸わないでください。", "で", ["を", "が", "へ"], "Đừng hút thuốc trong phòng ký túc xá."),
    NX("Bạn đi làm về ký túc xá và chào bạn cùng phòng.", "ただいま。", ["いってきます。", "おかえりなさい。", "いってらっしゃい。"]),
    M("寮", "ごみ", "洗う", "着る", "消す"),
    W("Hãy tắt đèn.", "電気|を|消してください", ["つけてください", "に"]),
    Y("Hãy đóng cửa sổ.", "窓を閉めてください"),
])
finish("s3")

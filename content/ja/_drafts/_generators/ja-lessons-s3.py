"""ja-vi Section 3 lessons: understanding everyday Japanese. The lessons read signs, rules, timetables, receipts and short
messages (TX, H items) and, since the reception session (P4c session 4), the readings and clips of ja-reception-s3.py:
listening and reading comprehension (LC, RC) with Vietnamese questions, and five dictations (D) of digit-free clips. The
ids each lesson uses are the ones ja_lesson_refs.py maps to it. Four lessons show a concept card. Writes
lessons/parts/s3.jsonl. usage: python -I ja-lessons-s3.py <repo root>"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ja_lesson_lib import C, D, F, H, K, LC, M, N, NX, RC, T, TX, W, WT, Y, finish, lesson

Q = "Bạn nghe thấy gì?"
MEAN = "Câu này nghĩa là gì?"
# ---------------------------------------------------------------- uf: words and phrases by ear
lesson("uf-l0", [
    LC("uf_arigatou", MEAN, "Cảm ơn ạ.", ["Xin lỗi.", "Tạm biệt.", "Không có gì."]),
    LC("uf_sumimasen", "Bạn nói câu này khi nào?", "khi muốn xin lỗi hoặc gọi ai đó", ["khi ăn xong", "khi đi ngủ", "khi nhận quà"]),
    LC("uf_daijoubu", MEAN, "Không sao đâu.", ["Tôi không hiểu.", "Xin chờ một chút.", "Rất vui được gặp bạn."]),
    D("uf_arigatou"),
    H("天気", ["電気", "元気", "病気"]), H("雨", ["雪", "風", "春"]),
    T("暑い", ["寒い", "暖かい", "涼しい"]), N("寒い", ["暑い", "涼しい", "暖かい"]),
    TX("今日はいい天気ですね。", "Hôm nay trời đẹp nhỉ.", ["Hôm nay trời mưa nhỉ.", "Mai trời đẹp không?", "Hôm qua trời đẹp."]),
    H("雨が降っています。", ["雪が降っています。", "風が強いです。", "今日は暑いです。"]),
    F("今日は___ですね。", "寒い", ["暑い", "雪", "花"], "Hôm nay lạnh nhỉ."),
    Y("Trời nóng nhỉ.", "暑いですね", "今日は暑いですね"),
])
lesson("uf-l1", [
    LC("uf_kikai", Q, "cái máy", ["cái thùng", "đôi găng tay", "cái nút"]),
    LC("uf_herumetto", Q, "mũ bảo hộ", ["giày bảo hộ", "găng tay", "quần áo lao động"]),
    LC("uf_tebukuro", Q, "găng tay", ["mũ bảo hộ", "cái túi", "đôi giày"]),
    RC("uf_room", "Trong phòng có mấy cửa sổ?", "hai", ["một", "ba", "bốn"]),
    RC("uf_room", "Trong phòng không có gì?", "tủ lạnh", ["cái giường", "ti vi", "máy tính"]),
    H("7時です。", ["1時です。", "4時です。", "9時です。"]),
    H("350円です。", ["530円です。", "305円です。", "3500円です。"]),
    H("4時半", ["7時半", "4時", "8時半"]),
    TX("会議は2時からです。", "Cuộc họp bắt đầu từ hai giờ.", ["Cuộc họp kết thúc lúc hai giờ.", "Cuộc họp bắt đầu từ mười hai giờ.", "Cuộc họp kéo dài hai tiếng."]),
    TX("もう一度お願いします。", "Xin nhắc lại một lần nữa.", ["Xin nói chậm.", "Xin đợi một chút.", "Tôi hiểu rồi."]),
    F("バスは___時に来ます。", "8", ["18", "80", "6"], "Xe buýt đến lúc tám giờ."),
    Y("Bây giờ là mấy giờ?", "今、何時ですか"),
])
lesson("uf-l2", [
    LC("uf_kaidan", Q, "cầu thang", ["thang máy", "hành lang", "lối ra"]),
    LC("uf_mado", Q, "cửa sổ", ["cửa ra vào", "bức tường", "cái bàn"]),
    LC("uf_nanji", "Người nói muốn biết gì?", "bây giờ là mấy giờ", ["hôm nay là thứ mấy", "nhà ga ở đâu", "cái này giá bao nhiêu"]),
    LC("uf_wakarimasen", MEAN, "Tôi không hiểu.", ["Tôi hiểu rồi.", "Tôi không biết bạn.", "Tôi không nghe thấy."]),
    D("uf_wakarimasen"),
    T("春", ["夏", "秋", "冬"]), N("冬", ["春", "夏", "秋"]), M("春", "夏", "秋", "冬", "雪"),
    TX("ベトナムの夏はとても暑いです。", "Mùa hè ở Việt Nam rất nóng.", ["Mùa đông ở Việt Nam rất lạnh.", "Mùa hè ở Nhật rất nóng.", "Mùa hè ở Việt Nam không nóng lắm."]),
    TX("日本の冬は雪が多いです。", "Mùa đông ở Nhật có nhiều tuyết.", ["Mùa thu ở Nhật có nhiều tuyết.", "Mùa đông ở Nhật trời mưa nhiều.", "Mùa đông ở Việt Nam có nhiều tuyết."]),
    F("公園に___がいます。", "犬", ["花", "木", "山"], "Ở công viên có con chó."),
    W("Hôm nay trời quang.", "今日|は|晴れ|です", ["雨", "を"]),
    Y("Hôm nay trời mưa.", "今日は雨です", "今日は雨が降っています", "雨です"),
])
lesson("uf-l3", [
    LC("uf_mouichido", "Người nói muốn bạn làm gì?", "nói lại một lần nữa", ["nói nhanh hơn", "viết ra giấy", "đi ra ngoài"]),
    LC("uf_yukkuri", "Người nói muốn bạn làm gì?", "nói chậm thôi", ["nói to lên", "nói lại", "đọc to"]),
    LC("uf_imi", "Người nói hỏi gì?", "từ đó có nghĩa là gì", ["từ đó viết thế nào", "cái đó giá bao nhiêu", "cái đó ở đâu"]),
    LC("uf_nihongo", "Người nói muốn gì?", "nói bằng tiếng Nhật", ["nói bằng tiếng Việt", "nói chậm hơn", "viết bằng tiếng Nhật"]),
    RC("uf_card", "Người này tên là gì?", "Nguyễn Minh", ["Nguyễn Nam", "Trần Minh", "Nguyễn Lan"]),
    RC("uf_card", "Người này sống ở đâu?", "Osaka", ["Tokyo", "Kyoto", "Hà Nội"]),
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
    RC("ug_signs", "Bạn muốn đi vào nhà máy. Bạn đi theo biển nào?", "入口", ["出口", "危険", "注意"]),
    RC("ug_signs", "Khi có cháy, bạn chạy ra theo biển nào?", "非常口", ["入口", "注意", "危険"]),
    RC("ug_signs", "Biển nào báo chỗ nguy hiểm?", "危険", ["出口", "入口", "非常口"]),
    RC("ug_signs", "Biển nào nói bạn không được vào?", "立入禁止", ["入口", "安全第一", "出口"]),
    RC("ug_signs", "Biển nào nói không được hút thuốc?", "禁煙", ["非常口", "足元注意", "安全第一"]),
    RC("ug_signs", "Biển nào nhắc bạn nhìn dưới chân?", "足元注意", ["立入禁止", "禁煙", "出口"]),
    T("禁止", ["注意", "安全", "出口"]), N("出口", ["入口", "非常口", "受付"]), T("危ない", ["安全", "忙しい", "重い"]),
    TX("たばこは禁止です。", "Cấm hút thuốc.", ["Được hút thuốc.", "Thuốc lá ở đây.", "Hãy mua thuốc lá."]),
    TX("ここは危ないです。", "Chỗ này nguy hiểm.", ["Chỗ này an toàn.", "Chỗ này là lối ra.", "Chỗ này yên tĩnh."]),
    H("出口", ["入口", "非常口", "窓口"]),
    F("ここ___たばこを吸わないでください。", "で", ["を", "が", "に"], "Đừng hút thuốc ở đây."),
    M("工場", "安全", "危ない", "禁止", "注意"),
])
lesson("ug-l1", [
    C("te-form"),
    RC("ug_rules", "Trong nhà máy, bạn phải đội gì?", "mũ bảo hộ", ["mũ len", "găng tay", "kính bảo hộ"]),
    RC("ug_rules", "Bạn không được làm gì?", "chạm vào máy", ["đi giày bảo hộ", "đội mũ bảo hộ", "rửa tay"]),
    RC("ug_rules", "Nội quy nói gì về thuốc lá?", "cấm hút thuốc", ["được hút ở nhà ăn", "chỉ được hút buổi trưa", "phải mua ở cửa hàng"]),
    RC("ug_rules", "Bình chữa cháy ở đâu?", "cạnh lối vào", ["cạnh lối thoát hiểm", "trong nhà ăn", "ở tầng hai"]),
    TX("ヘルメットをかぶってください。", "Hãy đội mũ bảo hộ.", ["Hãy cởi mũ bảo hộ.", "Đừng đội mũ bảo hộ.", "Mũ bảo hộ ở đây."]),
    TX("機械に触らないでください。", "Đừng chạm vào máy.", ["Hãy chạm vào máy.", "Máy đang chạy.", "Hãy dừng máy lại."]),
    NX("Biển ghi: Hãy đeo găng tay.", "手袋をしてください。", ["手袋を脱いでください。", "手袋に触らないでください。", "手袋をしないでください。"]),
    F("ボタン___押してください。", "を", ["に", "で", "が"], "Hãy ấn nút."),
    F("廊下を___ないでください。", "走ら", ["走り", "走る", "走って"], "Đừng chạy ở hành lang."),
    W("Đừng chạy ở hành lang.", "廊下|を|走らないでください", ["で", "走ってください"]),
    Y("Hãy đội mũ bảo hộ.", "ヘルメットをかぶってください"),
    K("ここに___ください。", "座る", "te", "Xin mời ngồi ở đây."),
    K("窓を___ください。", "開ける", "te", "Hãy mở cửa sổ."),
    K("ドアを___ください。", "閉める", "te", "Hãy đóng cửa."),
])
lesson("ug-l2", [
    RC("ug_msg_senpai", "Ngày mai bắt đầu làm lúc mấy giờ?", "7 giờ", ["8 giờ", "6 giờ", "9 giờ"]),
    RC("ug_msg_senpai", "Hai người gặp nhau ở đâu?", "trước nhà ăn", ["trong nhà ăn", "trước nhà ga", "ở ký túc xá"]),
    RC("ug_msg_boss", "Cuộc họp hôm nay từ mấy giờ đến mấy giờ?", "từ 2 giờ đến 4 giờ", ["từ 2 giờ đến 3 giờ", "từ 4 giờ đến 6 giờ", "từ 12 giờ đến 2 giờ"]),
    RC("ug_msg_boss", "Anh Nguyễn phải mang gì đến?", "giấy tờ", ["máy tính", "cơm hộp", "thẻ cư trú"]),
    RC("ug_shift", "Ca chiều bắt đầu lúc mấy giờ?", "2 giờ", ["6 giờ", "10 giờ", "12 giờ"]),
    RC("ug_shift", "Thông báo nhắc công nhân điều gì?", "đến sớm một chút", ["về sớm", "đến đúng 6 giờ", "nghỉ trưa sớm"]),
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
    RC("ug_menu", "Món nào rẻ nhất?", "trà", ["mì ramen", "cà ri", "cơm hộp"]),
    RC("ug_menu", "Một bát mì ramen giá bao nhiêu?", "600 yên", ["550 yên", "500 yên", "100 yên"]),
    RC("ug_hours", "Toà thị chính mở cửa những ngày nào?", "từ thứ Hai đến thứ Sáu", ["mọi ngày", "từ thứ Hai đến thứ Bảy", "thứ Bảy và Chủ nhật"]),
    RC("ug_hours", "Buổi chiều toà thị chính đóng cửa lúc mấy giờ?", "5 giờ", ["8 giờ rưỡi", "4 giờ", "6 giờ"]),
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
    LC("uh_train_tokyo", "Tàu đi Tokyo chạy lúc mấy giờ?", "8 giờ", ["4 giờ", "7 giờ", "10 giờ"]),
    LC("uh_train_late", "Tàu điện thế nào?", "trễ khoảng 15 phút", ["trễ khoảng 50 phút", "đến sớm 15 phút", "hôm nay không chạy"]),
    LC("uh_platform", "Tàu đến sân ga số mấy?", "số 3", ["số 2", "số 4", "số 8"]),
    LC("uh_next_station", "Ga tiếp theo là ga nào?", "Osaka", ["Tokyo", "Kyoto", "Nagoya"]),
    H("電車が来ます。", ["電車が出ます。", "電車が止まります。", "電車が遅れています。"]),
    F("駅で地下鉄___乗ります。", "に", ["を", "が", "の"], "Tôi lên tàu điện ngầm ở ga."),
    TX("2番のバスに乗ってください。", "Hãy lên xe buýt số hai.", ["Hãy xuống xe buýt số hai.", "Hãy lên xe buýt số mười hai.", "Xe buýt số hai không đến."]),
    T("駅", ["電車", "切符", "空港"]), N("切符", ["駅", "荷物", "地図"]),
    M("駅", "電車", "地下鉄", "切符", "空港"),
    W("Tôi đi đến ga bằng xe đạp.", "自転車|で|駅|へ|行きます", ["を", "が"], alts=("駅|へ|自転車|で|行きます",)),
])
lesson("uh-l1", [
    LC("uh_doors", "Thông báo nói gì?", "Cửa sắp đóng, xin chú ý.", ["Cửa đang mở.", "Hãy mở cửa ra.", "Cửa bị hỏng."]),
    LC("uh_shop_close", "Cửa hàng đóng cửa lúc mấy giờ?", "9 giờ", ["7 giờ", "5 giờ", "10 giờ"]),
    LC("uh_shop_floor", "Giày ở tầng mấy?", "tầng 2", ["tầng 1", "tầng 3", "tầng 4"]),
    LC("uh_coffee_price", "Cà phê giá bao nhiêu?", "150 yên", ["115 yên", "500 yên", "50 yên"]),
    D("uh_doors"),
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
    LC("uh_press", "Bạn phải ấn nút màu gì?", "màu xanh lá", ["màu đỏ", "màu trắng", "màu đen"]),
    LC("uh_stop", "Bạn phải làm gì?", "dừng máy rồi gọi cấp trên", ["chạy máy rồi gọi cấp trên", "dừng máy rồi về nhà", "tự sửa máy"]),
    LC("uh_gloves", "Bạn phải đeo gì?", "găng tay và mũ bảo hộ", ["chỉ găng tay", "chỉ mũ bảo hộ", "giày bảo hộ"]),
    D("uh_stop"),
    H("電車は5分ぐらい遅れています。", ["電車は2分ぐらい遅れています。", "電車は5時に来ます。", "電車は来ません。"]),
    TX("ドアが閉まります。", "Cửa sắp đóng.", ["Cửa đang mở.", "Hãy mở cửa.", "Đừng đóng cửa."]),
    TX("次の駅で降りてください。", "Hãy xuống ở ga tiếp theo.", ["Hãy lên tàu ở ga tiếp theo.", "Ga tiếp theo là ga cuối.", "Hãy xuống ở ga này."]),
    F("次の駅___降りてください。", "で", ["が", "か", "や"], "Hãy xuống ở ga tiếp theo."),
    T("降りる", ["乗る", "着く", "歩く"]), N("乗る", ["降りる", "渡る", "曲がる"]),
    Y("Hãy xuống ở ga tiếp theo.", "次の駅で降りてください"),
])
lesson("uh-l3", [
    LC("uh_bento_price", "Cơm hộp giá bao nhiêu?", "500 yên", ["50 yên", "5000 yên", "600 yên"]),
    LC("uh_meeting_time", "Cuộc họp bắt đầu lúc mấy giờ?", "9 giờ rưỡi", ["9 giờ", "4 giờ rưỡi", "10 giờ rưỡi"]),
    LC("uh_shift_end", "Ca sáng kết thúc lúc mấy giờ?", "2 giờ", ["12 giờ", "8 giờ", "10 giờ"]),
    LC("uh_break", "Giờ nghỉ là khi nào?", "từ 12 giờ đến 1 giờ", ["từ 11 giờ đến 12 giờ", "từ 1 giờ đến 2 giờ", "từ 12 giờ đến 2 giờ"]),
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
    LC("ui_meet", "Hai người đang làm gì?", "làm quen với nhau", ["chào tạm biệt", "hỏi đường", "mua hàng"]),
    LC("ui_genki", "Người thứ hai thế nào?", "khoẻ", ["ốm", "mệt", "bận"]),
    RC("ui_first_day", "Nam đến từ đâu?", "Việt Nam", ["Nhật Bản", "Osaka", "Tokyo"]),
    RC("ui_first_day", "Anh Tanaka và Nam đang làm gì?", "chào nhau lần đầu", ["chào tạm biệt", "nói chuyện qua điện thoại", "ăn trưa"]),
    T("コンビニ", ["スーパー", "レストラン", "銀行"]), N("レジ", ["レシート", "袋", "カード"]),
    H("いらっしゃいませ。", ["いってらっしゃい。", "いただきます。", "失礼します。"]),
    TX("袋はいりますか。", "Bạn có cần túi không?", ["Bạn có túi không?", "Túi bao nhiêu tiền?", "Bạn mua túi à?"]),
    NX("Nhân viên hỏi bạn có cần túi không. Bạn không cần.", "いいえ、結構です。", ["はい、お願いします。", "いらっしゃいませ。", "いただきます。"]),
    M("コンビニ", "レジ", "袋", "レシート", "ポイントカード"),
    W("Không, tôi không cần túi.", "袋|は|いりません", ["を", "あります"]),
    Y("Vâng, nhờ anh.", "はい、お願いします"),
])
lesson("ui-l1", [
    LC("ui_order", "Khách gọi gì?", "một bát mì ramen", ["hai bát mì ramen", "một hộp cơm", "một cốc trà"]),
    LC("ui_pay", "Tất cả bao nhiêu tiền?", "680 yên", ["860 yên", "608 yên", "668 yên"]),
    LC("ui_pay", "Khách trả bằng gì?", "bằng thẻ", ["bằng tiền mặt", "bằng điện thoại", "chưa trả"]),
    LC("ui_time", "Bây giờ là mấy giờ?", "3 giờ rưỡi", ["3 giờ", "4 giờ rưỡi", "13 giờ rưỡi"]),
    RC("ui_konbini", "Nhân viên hỏi gì đầu tiên?", "có hâm nóng cơm hộp không", ["có cần túi không", "có thẻ tích điểm không", "trả bằng gì"]),
    RC("ui_konbini", "Chị Linh có lấy túi không?", "không", ["có", "lấy hai cái", "chưa trả lời"]),
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
    LC("ui_box", "Phải để cái thùng ở đâu?", "cạnh cửa", ["trên bàn", "dưới cầu thang", "trong phòng"]),
    LC("ui_late", "Vì sao người đó đến muộn?", "tàu điện bị trễ", ["người đó ngủ dậy muộn", "xe buýt bị trễ", "người đó bị ốm"]),
    LC("ui_phone", "Người gọi muốn nói chuyện với ai?", "anh Tanaka", ["chị Kimura", "anh Nam", "chị Linh"]),
    RC("ui_clinic", "Lễ tân hỏi gì đầu tiên?", "có thẻ bảo hiểm không", ["có thẻ cư trú không", "đau ở đâu", "tên là gì"]),
    RC("ui_clinic", "Lan phải viết gì?", "tên và địa chỉ", ["tên và số điện thoại", "tuổi và địa chỉ", "tên và ngày sinh"]),
    TX("全部で750円です。", "Tất cả là bảy trăm năm mươi yên.", ["Tất cả là bảy nghìn năm trăm yên.", "Một cái bảy trăm năm mươi yên.", "Tất cả là năm trăm bảy mươi yên."]),
    H("1200円です。", ["2100円です。", "1020円です。", "12000円です。"]),
    F("お弁当を___ください。", "一つ", ["一人", "一日", "一月"], "Cho tôi một hộp cơm."),
    NX("Cho tôi hai cái túi.", "袋を二つください。", ["袋を二人ください。", "袋に二つください。", "二つを袋ください。"]),
    TX("レシートはいりますか。", "Bạn có cần hoá đơn không?", ["Bạn có hoá đơn không?", "Hoá đơn ở đâu?", "Hãy đưa hoá đơn cho tôi."]),
    W("Tôi trả bằng thẻ.", "カード|で|お願いします", ["が", "の"]),
    Y("Tất cả bao nhiêu tiền?", "全部でいくらですか"),
])
lesson("ui-l3", [
    LC("ui_thanks", "Người thứ hai đáp lại lời cảm ơn thế nào?", "Không có gì.", ["Xin lỗi.", "Tạm biệt.", "Chờ một chút."]),
    RC("ui_sorry", "Vì sao hôm nay anh Nguyễn nghỉ?", "anh ấy bị cảm", ["anh ấy bận", "tàu bị trễ", "anh ấy đi Osaka"]),
    RC("ui_sorry", "Khi nào anh Nguyễn đi làm lại?", "ngày mai", ["hôm nay", "tuần sau", "thứ Hai"]),
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
    RC("uj_nam_day", "Nam làm việc ở đâu?", "ở một nhà máy ở Osaka", ["ở một nhà máy ở Tokyo", "ở một cửa hàng ở Osaka", "ở ký túc xá"]),
    RC("uj_nam_day", "Công việc của Nam từ mấy giờ đến mấy giờ?", "từ 8 giờ đến 5 giờ", ["từ 6 giờ đến 5 giờ", "từ 7 giờ đến 8 giờ", "từ 8 giờ đến 6 giờ"]),
    RC("uj_nam_day", "Buổi tối Nam ăn ở đâu?", "ở ký túc xá", ["ở nhà máy", "ở nhà ăn công ty", "ở quán ăn"]),
    LC("uj_nam_osaka", "Câu này nói gì về Nam?", "Nam làm ở một nhà máy ở Osaka.", ["Nam sống ở Tokyo.", "Nam là sinh viên ở Osaka.", "Nam làm ở một cửa hàng."]),
    TX("ナムさんの寮は駅の近くです。", "Ký túc xá của Nam ở gần ga.", ["Ký túc xá của Nam ở xa ga.", "Nam sống ở gần công ty.", "Nhà ga ở trong ký túc xá."]),
    TX("ナムさんは毎朝6時に起きます。", "Sáng nào Nam cũng dậy lúc sáu giờ.", ["Sáng nào Nam cũng ngủ đến sáu giờ.", "Tối nào Nam cũng ngủ lúc sáu giờ.", "Sáng nay Nam dậy lúc sáu giờ."]),
    TX("朝ご飯を食べて、7時に寮を出ます。", "Ăn sáng xong, bảy giờ Nam rời ký túc xá.", ["Bảy giờ Nam ăn sáng ở ký túc xá.", "Bảy giờ Nam về ký túc xá.", "Nam không ăn sáng."]),
    T("寮", ["部屋", "家", "会社"]),
    F("夜は___で晩ご飯を食べます。", "食堂", ["銀行", "空港", "郵便局"], "Buổi tối Nam ăn tối ở nhà ăn."),
    WT("ナムさんは工場で働きます。", "Nam|làm việc|ở|nhà máy", ["công ty", "học"]),
    Y("Ký túc xá ở gần ga.", "寮は駅の近くです", "寮は駅から近いです"),
])
lesson("uj-l1", [
    RC("uj_family", "Mẹ của Linh làm nghề gì?", "y tá", ["bác sĩ", "giáo viên", "nhân viên công ty"]),
    RC("uj_family", "Gia đình Linh nuôi con gì?", "một con chó", ["một con mèo", "một con chim", "không nuôi con gì"]),
    LC("uj_lin_father", "Câu này nói về ai?", "bố của Linh", ["mẹ của Linh", "em trai của Linh", "anh của Linh"]),
    RC("uj_dorm_rules", "Từ mấy giờ phải giữ yên lặng?", "10 giờ tối", ["11 giờ tối", "6 giờ tối", "8 giờ sáng"]),
    RC("uj_dorm_rules", "Phải đổ rác trước mấy giờ?", "8 giờ sáng", ["10 giờ tối", "6 giờ sáng", "11 giờ tối"]),
    TX("もえるごみは月曜日と木曜日です。", "Rác cháy được đổ vào thứ hai và thứ năm.", ["Rác cháy được đổ vào thứ ba và thứ sáu.", "Thứ hai và thứ năm không đổ rác.", "Rác đổ vào mỗi ngày."]),
    TX("ごみは朝8時までに出してください。", "Hãy đổ rác trước tám giờ sáng.", ["Hãy đổ rác sau tám giờ sáng.", "Hãy đổ rác lúc tám giờ tối.", "Đừng đổ rác buổi sáng."]),
    F("ごみは月曜日___出してください。", "に", ["を", "で", "が"], "Hãy đổ rác vào thứ hai."),
    N("ごみ", ["かぎ", "袋", "箱"]),
    M("月曜日", "木曜日", "土曜日", "日曜日", "ごみ"),
    NX("Hôm nay là thứ mấy?", "今日は何曜日ですか。", ["今日は何時ですか。", "何曜日は今日ですか。", "今日に何曜日ですか。"]),
    Y("Hôm nay là thứ hai.", "今日は月曜日です"),
])
lesson("uj-l2", [
    RC("uj_weekend", "Chủ nhật Lan đi đâu với bạn?", "công viên", ["nhà ga", "siêu thị", "bệnh viện"]),
    RC("uj_weekend", "Sau đó họ ăn gì?", "mì ramen", ["cơm hộp", "cà ri", "bánh mì"]),
    RC("uj_weekend", "Lan thấy ngày Chủ nhật thế nào?", "rất vui", ["rất mệt", "buồn", "bận"]),
    LC("uj_lan_park", "Chuyện này xảy ra khi nào?", "Chủ nhật", ["thứ Bảy", "hôm nay", "ngày mai"]),
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
    RC("uj_station", "Bây giờ là mấy giờ?", "7 giờ sáng", ["8 giờ sáng", "7 giờ tối", "6 giờ sáng"]),
    RC("uj_station", "Người phụ nữ làm gì?", "mua vé", ["ăn bánh mì", "lên tàu", "đợi xe buýt"]),
    LC("uj_station", "Người phụ nữ mua vé ở đâu?", "ở nhà ga", ["ở sân bay", "ở cửa hàng tiện lợi", "trên xe buýt"]),
    RC("uj_city_office", "Thông báo này viết cho ai?", "người đã chuyển nhà", ["người mới đến Nhật", "người bị ốm", "người tìm việc"]),
    RC("uj_city_office", "Phải mang gì đến toà thị chính?", "thẻ cư trú và thẻ bảo hiểm", ["hộ chiếu và ảnh", "thẻ cư trú và con dấu", "chỉ thẻ bảo hiểm"]),
    LC("uj_dorm", "Thông báo nhắc điều gì?", "từ 10 giờ tối giữ yên lặng", ["10 giờ tối đóng cửa", "từ 10 giờ sáng giữ yên lặng", "10 giờ tối đổ rác"]),
    D("uj_station"),
    TX("夜10時から静かにしてください。", "Từ mười giờ tối hãy giữ yên lặng.", ["Đến mười giờ tối hãy giữ yên lặng.", "Mười giờ tối hãy tắt đèn.", "Từ mười giờ sáng hãy giữ yên lặng."]),
    TX("お風呂は6時から11時までです。", "Giờ tắm từ sáu giờ đến mười một giờ.", ["Giờ tắm từ sáu giờ đến mười giờ.", "Giờ tắm từ mười một giờ.", "Giờ ăn tối từ sáu giờ đến mười một giờ."]),
    F("寮の部屋___たばこを吸わないでください。", "で", ["を", "が", "へ"], "Đừng hút thuốc trong phòng ký túc xá."),
    NX("Bạn đi làm về ký túc xá và chào bạn cùng phòng.", "ただいま。", ["いってきます。", "おかえりなさい。", "いってらっしゃい。"]),
    M("寮", "ごみ", "洗う", "着る", "消す"),
    W("Hãy tắt đèn.", "電気|を|消してください", ["つけてください", "に"]),
    Y("Hãy đóng cửa sổ.", "窓を閉めてください"),
])
finish("s3")

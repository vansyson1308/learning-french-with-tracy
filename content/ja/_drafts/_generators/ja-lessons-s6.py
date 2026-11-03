"""ja-vi Section 6 lessons: talking with someone at the convenience store and restaurant (unit s), on the way and at the station
(t), at the clinic (u) and on the phone to work (v). Each lesson reads or hears the other person's line (TX, H) and chooses or
builds the learner's reply (NX, W, F, Y), always in です/ます; since the scenario session (P4c session 4) the second and last
lesson of each unit holds a spoken conversation (and uu-l2, uv-l2: the city office, the 面接) (interactionScenario, ja-scenarios-s6.py). Four lessons show a concept card.
Writes lessons/parts/s6.jsonl.
usage: python -I ja-lessons-s6.py <repo root>"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ja_lesson_lib import C, F, H, IX, K, M, MP, N, NX, T, TX, W, Y, finish, lesson

# ---------------------------------------------------------------- us: shop and restaurant
lesson("us-l0", [
    T("いらっしゃいませ", ["ありがとうございます", "すみません", "お願いします"]), N("お弁当", ["ご飯", "パン", "料理"]),
    TX("スプーンはいりますか。", "Anh có cần thìa không?", ["Anh có cần đũa không?", "Thìa ở đâu?", "Anh có thìa không?"]),
    NX("Nhân viên hỏi bạn có cần túi không. Bạn không cần. Bạn nói:", "いいえ、いりません。", ["はい、お願いします。", "いいえ、いります。", "はい、いりません。"]),
    W("Cho tôi cái kia.", "あれ|を|ください", ["が", "これ"]),
    F("お弁当を___ください。", "あたためて", ["あたため", "あたためる", "あたためた"], "Hâm nóng cơm hộp giúp tôi."),
    M("お弁当", "袋", "レジ", "カード", "レシート"),
])
lesson("us-l1", [
    IX("konbini_bento"),
    H("ポイントカードはありますか。", ["ポイントカードはいりますか。", "袋はいりますか。", "お弁当はありますか。"]),
    NX("Nhân viên hỏi bạn có thẻ tích điểm không. Bạn không có. Bạn nói:", "いいえ、ありません。", ["いいえ、いません。", "はい、ありません。", "いいえ、ありますか。"]),
    F("カード___お願いします。", "で", ["が", "に", "へ"], "Tôi trả bằng thẻ."),
    W("Cho tôi hoá đơn.", "レシート|を|ください", ["が", "袋"]),
    TX("全部で680円です。", "Tất cả là 680 yên.", ["Tất cả là 860 yên.", "Mỗi cái 680 yên.", "Tất cả là 6.800 yên."]),
    Y("Tôi không cần túi.", "袋はいりません", "袋、いりません", "袋いりません"),
    NX("Nhân viên đưa hoá đơn cho bạn. Bạn nói:", "ありがとうございます。", ["いらっしゃいませ。", "いただきます。", "おめでとうございます。"]),
])
lesson("us-l2", [
    C("counters"),
    TX("なんめいさまですか。", "Quý khách đi mấy người?", ["Quý khách tên là gì?", "Quý khách gọi món gì?", "Quý khách mấy tuổi?"]),
    NX("Bạn đi ăn một mình. Nhân viên hỏi đi mấy người. Bạn nói:", "一人です。", ["一つです。", "一日です。", "一人ですか。"]),
    F("ラーメンを___お願いします。", "二つ", ["二人", "二日", "二月"], "Cho tôi hai bát mì ramen."),
    W("Cho tôi một bát mì ramen.", "ラーメン|を|一つ|お願いします", ["一人", "に"], alts=("ラーメン|一つ|お願いします",)),
    T("メニュー", ["レシート", "レジ", "カード"]),
    Y("Cho tôi hai cốc bia.", "ビールを二つお願いします", "ビールを二つください", "ビール二つお願いします", "ビール二つください", "ビールを2つお願いします", "ビールを2つください"),
    H("お水をお願いします。", ["お茶をお願いします。", "お水をどうぞ。", "お水はいりません。"]),
])
lesson("us-l3", [
    IX("restaurant_order"),
    TX("ごちゅうもんは。", "Quý khách gọi món gì ạ?", ["Quý khách thanh toán ạ?", "Quý khách đi mấy người ạ?", "Quý khách có cần túi không ạ?"]),
    NX("Bạn gọi một suất cơm hộp và một chai trà.", "お弁当とお茶をお願いします。", ["お弁当をお茶とお願いします。", "お弁当とお茶がお願いします。", "お弁当とお茶をいただきます。"]),
    NX("Ăn xong, bạn muốn thanh toán. Bạn nói với nhân viên:", "おかいけい、お願いします。", ["おかいけい、ありがとうございます。", "いらっしゃいませ。", "メニュー、ありがとうございます。"]),
    F("このラーメンはとても___です。", "おいしい", ["甘い", "冷たい", "うるさい"], "Bát mì này rất ngon."),
    W("Món này ngon nhỉ.", "これ|は|おいしいです|ね", ["よ", "を"]),
    Y("Cho tôi xem thực đơn.", "メニューを見せてください", "メニューをお願いします", "メニューをください"),
    M("メニュー", "ラーメン", "水", "お茶", "ビール"),
])

# ---------------------------------------------------------------- ut: asking the way, taking the train
lesson("ut-l0", [
    C("kosoado"),
    T("右", ["左", "道", "角"]), N("左", ["右", "後ろ", "前"]), T("まっすぐ", ["ゆっくり", "すぐ", "ちょっと"]),
    NX("Bạn hỏi một người lạ ga ở đâu.", "すみません、駅はどこですか。", ["すみません、駅はいつですか。", "すみません、駅をどこですか。", "すみません、駅はどれですか。"]),
    TX("まっすぐ行ってください。", "Hãy đi thẳng.", ["Hãy rẽ phải.", "Hãy đi chậm thôi.", "Hãy quay lại."]),
    W("Hãy rẽ phải ở góc phố.", "角|を|右|に|曲がってください", ["左", "が"]),
    M("右", "左", "まっすぐ", "道", "角"),
])
lesson("ut-l1", [
    IX("ask_station"),
    H("右に曲がってください。", ["左に曲がってください。", "まっすぐ行ってください。", "右に曲がりました。"]),
    TX("コンビニの隣です。", "Ở cạnh cửa hàng tiện lợi.", ["Ở trong cửa hàng tiện lợi.", "Ở sau cửa hàng tiện lợi.", "Ở xa cửa hàng tiện lợi."]),
    NX("Bạn hỏi từ đây đến ga có xa không.", "ここから駅まで遠いですか。", ["ここまで駅から遠いですか。", "ここから駅まで近いです。", "ここから駅を遠いですか。"]),
    F("次の角を左___曲がってください。", "に", ["を", "で", "が"], "Ở góc phố tiếp theo, hãy rẽ trái."),
    NX("Người chỉ đường nói: đi thẳng rồi rẽ phải. Bạn nhắc lại để chắc:", "まっすぐ、それから右ですね。", ["まっすぐ、それから左ですね。", "右、それからまっすぐですね。", "まっすぐ、それから右でした。"]),
    W("Đồn cảnh sát ở cạnh ngân hàng.", "交番|は|銀行|の|隣|です", ["を", "前"]),
    M("隣", "交番", "信号", "交差点", "近い"),
])
lesson("ut-l2", [
    C("particles-ni-de-he"),
    F("電車___乗ります。", "に", ["を", "で", "が"], "Tôi lên tàu điện."),
    F("どこ___乗り換えますか。", "で", ["を", "が", "と"], "Đổi tàu ở đâu?"),
    NX("Bạn hỏi tàu này có đi Nagoya không.", "この電車は名古屋へ行きますか。", ["この電車は名古屋を行きますか。", "この電車は名古屋へ行きました。", "名古屋はこの電車へ行きますか。"]),
    TX("3番のホームです。", "Ở sân ga số 3.", ["Ở sân ga số 8.", "Đi 3 ga nữa.", "Tàu chạy lúc 3 giờ."]),
    W("Tôi đổi tàu ở ga Osaka.", "大阪|駅|で|乗り換えます", ["に", "降りて"]),
    Y("Tôi lên tàu điện.", "電車に乗ります"),
])
lesson("ut-l3", [
    IX("train_platform"),
    NX("Bạn hỏi phải đổi tàu ở đâu.", "どこで乗り換えますか。", ["どこを乗り換えますか。", "どこで乗り換えました。", "いつ乗り換えますか。"]),
    TX("次の駅で乗り換えてください。", "Hãy đổi tàu ở ga tiếp theo.", ["Hãy xuống ở ga này.", "Hãy mua vé ở ga tiếp theo.", "Tàu không dừng ở ga tiếp theo."]),
    T("切符", ["荷物", "地図", "財布"]),
    W("Vé bao nhiêu tiền?", "切符|は|いくら|です|か", ["いくつ", "を"]),
    F("切符を2枚___。", "ください", ["います", "あります", "ありません"], "Cho tôi hai vé."),
    Y("Ga ở đâu?", "駅はどこですか", "駅はどこにありますか"),
    M("切符", "電車", "駅", "降りる", "乗る"),
])

# ---------------------------------------------------------------- uu: at the clinic
lesson("uu-l0", [
    T("病院", ["病気", "薬", "銀行"]), N("保険証", ["在留カード", "切符", "ポイントカード"]),
    TX("保険証を見せてください。", "Cho xem thẻ bảo hiểm.", ["Hãy làm thẻ bảo hiểm.", "Thẻ bảo hiểm ở đâu?", "Hãy mang thuốc đến."]),
    NX("Lễ tân hỏi bạn đến lần đầu à. Đúng vậy. Bạn nói:", "はい、初めてです。", ["はい、初めてですか。", "いいえ、初めてです。", "はい、はじめましてです。"]),
    F("この紙___名前を書いてください。", "に", ["を", "が", "と"], "Hãy viết tên vào tờ giấy này."),
    W("Đây là thẻ bảo hiểm.", "これ|は|保険証|です", ["を", "薬"]),
    M("病院", "保険証", "受付", "薬", "熱"),
])
lesson("uu-l1", [
    C("wa-ga"),
    IX("clinic_reception"),
    T("痛い", ["熱", "悪い", "疲れる"]),
    MP(("頭", "đầu"), ("おなか", "bụng"), ("歯", "răng"), ("足", "chân"), ("目", "mắt")),
    F("頭___痛いです。", "が", ["を", "で", "に"], "Tôi đau đầu."),
    NX("Bác sĩ hỏi bạn đau ở đâu. Bạn đau bụng.", "おなかが痛いです。", ["おなかを痛いです。", "おなかが痛くないです。", "おなかで痛いです。"]),
    W("Tôi bị sốt.", "熱|が|あります", ["を", "います"]),
    Y("Tôi đau đầu.", "頭が痛いです"),
    TX("昨日からです。", "Từ hôm qua.", ["Đến hôm qua.", "Từ hôm nay.", "Từ ngày mai."]),
])
lesson("uu-l2", [
    IX("city_office"),
    TX("この薬を飲んでください。", "Hãy uống thuốc này.", ["Đừng uống thuốc này.", "Hãy mua thuốc này.", "Thuốc này rất đắt."]),
    H("一日3回、飲んでください。", ["一日2回、飲んでください。", "一日3回、飲みました。", "一日3回、食べてください。"]),
    F("ご飯の後___飲んでください。", "で", ["を", "が", "と"], "Hãy uống sau bữa ăn."),
    NX("Bạn chưa rõ liều thuốc. Bạn hỏi lại: một ngày mấy lần?", "一日なんかいですか。",["一日いくらですか。", "一日何時ですか。", "なんにちですか。"]),
    W("Thuốc này: một ngày ba lần.", "薬|は|一日|3回|です", ["3時", "を"]),
    Y("Tôi uống thuốc sau bữa ăn.", "ご飯の後で薬を飲みます", "薬はご飯の後で飲みます", "ご飯の後、薬を飲みます"),
    M("薬", "飲む", "一日", "回", "お大事に"),
])
lesson("uu-l3", [
    IX("clinic_doctor"),
    NX("Bác sĩ hỏi từ khi nào bạn bị sốt. Từ hôm qua.", "昨日からです。", ["昨日までです。", "明日からです。", "昨日からですか。"]),
    TX("お大事に。", "Chúc mau khoẻ.", ["Cẩn thận nhé.", "Chúc ngủ ngon.", "Rất mong được giúp đỡ."]),
    F("救急車を___ください。", "呼んで", ["呼び", "呼ぶ", "呼んだ"], "Hãy gọi xe cấp cứu."),
    W("Tôi bị cảm từ hôm qua.", "昨日|から|風邪|です", ["まで", "熱"]),
    T("けが", ["病気", "熱", "風邪"]),
    Y("Tôi bị sốt.", "熱があります"),
    M("頭", "顔", "手", "体", "けが"),
])

# ---------------------------------------------------------------- uv: phoning work
lesson("uv-l0", [
    T("風邪", ["熱", "けが", "病気"]),
    NX("Bạn gọi điện cho chỗ làm. Câu đầu tiên:", "もしもし、グエンです。", ["もしもし、グエンさんです。", "いらっしゃいませ、グエンです。", "はじめまして、グエンですか。"]),
    TX("田中さんはいらっしゃいますか。", "Anh Tanaka có ở đó không ạ?", ["Anh Tanaka đi đâu ạ?", "Anh Tanaka khoẻ không ạ?", "Anh Tanaka đến chưa ạ?"]),
    H("ちょっと待ってください。", ["ちょっと待ちました。", "ゆっくり話してください。", "もう一度お願いします。"]),
    F("風邪___ひきました。", "を", ["に", "が", "で"], "Tôi bị cảm."),
    W("Tôi bị cảm. Hôm nay tôi nghỉ.", "風邪|を|ひきました|今日|は|休みます", ["働きます", "に"]),
    M("風邪", "電話", "携帯電話", "スマホ", "パソコン"),
])
lesson("uv-l1", [
    C("te-form"),
    IX("call_sick"),
    NX("Bạn xin phép nghỉ hôm nay.", "今日は休んでもいいですか。", ["今日は休んでください。", "今日は休みましたか。", "今日を休んでもいいですか。"]),
    TX("わかりました。お大事に。", "Tôi hiểu rồi. Chúc mau khoẻ.", ["Tôi không hiểu. Chúc mau khoẻ.", "Tôi hiểu rồi. Cẩn thận nhé.", "Tôi hiểu rồi. Mai gặp lại."]),
    F("明日___大丈夫です。", "は", ["を", "に", "へ"], "Mai thì tôi ổn."),
    W("Xin lỗi. Xin phép tôi cúp máy.", "すみません|失礼します", ["いただきます", "ただいま"]),
    Y("Hôm nay tôi nghỉ được không ạ?", "今日は休んでもいいですか", "今日、休んでもいいですか"),
    NX("Bạn kết thúc cuộc gọi với cấp trên.", "よろしくおねがいします。失礼します。", ["よろしくおねがいします。いただきます。", "はじめまして。失礼します。", "よろしくおねがいします。いってきます。"]),
    K("すみません、もう一度___ください。", "話す", "te", "Xin lỗi, xin anh nói lại một lần nữa."),
    K("在留カードを___ください。", "見せる", "te", "Xin cho tôi xem thẻ cư trú."),
])
lesson("uv-l2", [
    IX("interview_basics"),
    T("先輩", ["上司", "友達", "社長"]),
    TX("週末は何をしましたか。", "Cuối tuần bạn đã làm gì?", ["Cuối tuần bạn sẽ làm gì?", "Cuối tuần bạn đi đâu?", "Bạn thích làm gì vào cuối tuần?"]),
    NX("Đàn anh hỏi cuối tuần bạn làm gì. Bạn đã xem phim.", "映画を見ました。", ["映画を見ます。", "映画に見ました。", "映画を見ませんでした。"]),
    NX("Bạn trả lời xong và hỏi lại đàn anh: còn anh thì sao?", "先輩は？", ["先輩を？", "先輩もです。", "先輩で？"]),
    W("Tôi đã đi công viên với bạn.", "友達|と|公園|へ|行きました", ["を", "来ました"], alts=("公園|へ|友達|と|行きました",)),
    Y("Tôi đã xem phim.", "映画を見ました"),
])
lesson("uv-l3", [
    C("invitations"),
    IX("factory_safety"),
    IX("call_late"),
    TX("一緒に昼ご飯を食べませんか。", "Cùng ăn trưa không?", ["Bạn đã ăn trưa chưa?", "Tôi không ăn trưa.", "Bạn ăn trưa ở đâu?"]),
    NX("Đàn anh rủ bạn ăn trưa. Bạn đồng ý.", "いいですね。食べましょう。", ["いいですね。食べません。", "ちょっと…。食べましょう。", "いいですね。食べましたか。"]),
    NX("Đồng nghiệp rủ bạn đi uống bia tối nay. Bạn từ chối khéo.", "すみません、今日はちょっと…。", ["はい、行きましょう。", "いいですね。", "すみません、今日は行きましょう。"]),
    F("一緒に映画を見___か。", "ません", ["て", "てください", "たく"], "Cùng xem phim không?"),
    W("Cùng đi về không?", "一緒に|帰りませんか", ["帰りました", "も"]),
    Y("Cùng ăn trưa không?", "一緒に昼ご飯を食べませんか", "昼ご飯を一緒に食べませんか"),
    M("一緒に", "先輩", "すぐ", "休む", "かける"),
])
finish("s6")

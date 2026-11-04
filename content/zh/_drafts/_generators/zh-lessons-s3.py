"""zh-vi Section 3 lessons: understanding everyday Chinese — weather and numbers by ear (unit f), signs and rules at the
factory and the warehouse (g), the station and the airport (h), the shop (i), life in the dormitory (j). Session 2
wrote the word, sentence and listening-choice items (H, TX, F, Y, W); session 3 adds the listening and reading
comprehension (LC, RC) and the dictations (D) that point at the reception records of zh-reception-s3.py, as
zh_lesson_refs.py maps them. Two lessons show a concept card. Writes lessons/parts/s3.jsonl.
usage: python -I zh-lessons-s3.py <repo root>"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zh_lesson_lib import C, D, F, H, LC, M, N, NX, RC, T, TX, W, Y, finish, lesson

# ---------------------------------------------------------------- uf: weather, numbers, animals by ear
lesson("uf-l0", [
    H("天气", ["天", "下雨", "晴"]), T("冷", ["热", "晴", "阴"]), N("热", ["冷", "晴", "风"]),
    TX("今天天气很好。", "Hôm nay thời tiết đẹp.", ["Hôm nay trời mưa.", "Mai thời tiết đẹp.", "Hôm qua thời tiết đẹp."]),
    H("今天很冷。", ["今天很热。", "明天很冷。", "今天不冷。"]),
    F("今天很___。", "冷", ["雨", "风", "雪"], "Hôm nay lạnh."),
    Y("Hôm nay nóng.", "今天很热", "今天热", "今天非常热", "今天天气很热", "今天天气热", "今天好热", "今天真热", "今天天气非常热"),
    LC("uf_tianqi", "Bạn nghe thấy từ nào?", "天气", ["雨", "明天", "晴"]),
    LC("uf_hen_leng", "Hôm nay trời thế nào?", "Lạnh", ["Nóng", "Mưa", "Có gió"]),
    LC("uf_hen_re", "Người nói nói gì về hôm nay?", "Hôm nay nóng", ["Hôm nay lạnh", "Mai nóng", "Hôm nay mưa"]),
])
lesson("uf-l1", [
    T("下雨", ["下雪", "晴", "风"]), N("风", ["雨", "雪", "天气"]),
    H("下雨了。", ["下雪了。", "下班了。", "下课了。"]),
    TX("明天下雨。", "Mai trời mưa.", ["Hôm nay trời mưa.", "Mai trời nắng.", "Mai có tuyết."]),
    F("外边___雨了。", "下", ["上", "有", "是"], "Bên ngoài mưa rồi."),
    W("Gió to quá.", "风|太|大|了", ["雨", "小"]),
    M("下雨", "下雪", "风", "雨", "雪"),
    LC("uf_xiayu", "Chuyện gì đang xảy ra?", "Trời mưa rồi", ["Trời có tuyết", "Trời nắng", "Tan ca rồi"]),
    D("uf_xiayu"),
    LC("uf_feng", "Bạn nghe thấy gì?", "Gió to", ["Mưa to", "Trời lạnh", "Nắng gắt"]),
    RC("uf_weather", "Thứ Tư thời tiết thế nào?", "Mưa, 18 độ", ["Nắng, 25 độ", "Âm u, 22 độ", "Nắng, rất nóng"]),
    RC("uf_weather", "Ngày nào có gió?", "Thứ Năm", ["Thứ Hai", "Thứ Ba", "Thứ Sáu"]),
])
lesson("uf-l2", [
    T("夏天", ["冬天", "春天", "秋天"]), N("冬天", ["夏天", "春天", "秋天"]),
    H("春天", ["冬天", "秋天", "夏天"]), H("四月", ["十月", "四号", "十号"]),
    TX("越南的夏天很热。", "Mùa hè ở Việt Nam rất nóng.", ["Mùa đông ở Việt Nam rất lạnh.", "Mùa hè ở Trung Quốc rất nóng.", "Mùa hè ở Việt Nam không nóng."]),
    F("北京的冬天很___。", "冷", ["热", "晴", "阴"], "Mùa đông ở Bắc Kinh lạnh."),
    Y("Mùa thu thời tiết rất đẹp.", "秋天天气很好", "秋天的天气很好", "秋天天气非常好", "秋天天气真好", "秋天的天气非常好", "秋天的天气真好"),
    M("春天", "夏天", "秋天", "冬天", "天气"),
    LC("uf_chuntian", "Bạn nghe thấy mùa nào?", "春天", ["夏天", "秋天", "冬天"]),
    LC("uf_siyue", "Bạn nghe thấy tháng nào?", "Tháng Tư", ["Tháng Mười", "Ngày mùng 4", "Tháng Ba"]),
    LC("uf_zaishuo", "Người nói muốn gì?", "Nói lại một lần nữa", ["Nói chậm một chút", "Nói to hơn", "Viết ra giấy"]),
    LC("uf_mandian", "Người nói muốn gì?", "Nói chậm một chút", ["Nói lại một lần nữa", "Nói nhanh lên", "Đừng nói nữa"]),
])
lesson("uf-l3", [
    H("九点", ["六点", "十点", "九块"]), H("十五块", ["五十块", "十五个", "五块"]),
    T("狗", ["猫", "鸟", "鱼"]), N("猫", ["狗", "马", "牛"]),
    TX("我家有一只猫。", "Nhà tôi có một con mèo.", ["Nhà tôi có một con chó.", "Nhà tôi có hai con mèo.", "Tôi thích mèo."]),
    F("河里有很多___。", "鱼", ["鸟", "马", "花"], "Dưới sông có nhiều cá."),
    W("Trên núi có nhiều cây.", "山上|有|很多|树", ["花", "在"]),
    M("山", "河", "海", "花", "树"),
    LC("uf_jiudian", "Mấy giờ?", "9 giờ", ["6 giờ", "10 giờ", "9 tệ"]),
    LC("uf_shiwu", "Bao nhiêu tiền?", "15 tệ", ["50 tệ", "5 tệ", "15 giờ"]),
    LC("uf_mao", "Bạn nghe thấy con vật nào?", "猫", ["狗", "鸟", "马"]),
    LC("uf_yu", "Bạn nghe thấy con vật nào?", "鱼", ["牛", "鸟", "狗"]),
    D("uf_tingbudong"),
    RC("uf_card", "Anh Nguyễn Hải làm nghề gì?", "Công nhân", ["Bác sĩ", "Tài xế", "Giáo viên"]),
    RC("uf_card", "Anh ấy sống ở đâu?", "Ký túc xá nhà máy, toà số 3", ["Ký túc xá nhà máy, toà số 2", "Ở Thượng Hải", "Ở Hà Nội"]),
])

# ---------------------------------------------------------------- ug: signs and rules at the factory
lesson("ug-l0", [
    T("小心", ["安全", "注意", "危险"]), N("安全", ["小心", "危险", "注意"]),
    TX("禁止吸烟", "Cấm hút thuốc", ["Được hút thuốc", "Khu hút thuốc", "Hãy hút thuốc ở đây"]),
    TX("注意安全", "Chú ý an toàn", ["Cẩn thận máy", "Lối ra an toàn", "Không an toàn"]),
    NX("Biển nào báo chỗ nguy hiểm?", "危险", ["出口", "入口", "安全"]),
    F("___！机器很危险。", "小心", ["安全", "休息", "欢迎"], "Cẩn thận! Máy rất nguy hiểm."),
    M("工厂", "小心", "安全", "危险", "禁止"),
    RC("ug_signs", "Biển nào chỉ lối thoát khi có sự cố?", "紧急出口", ["入口", "危险", "灭火器"]),
    RC("ug_signs", "Biển nào cấm hút thuốc?", "禁止吸烟", ["禁止进入", "注意安全", "小心机器"]),
    RC("ug_signs", "Biển nào báo: không được vào?", "禁止进入", ["出口", "禁止吸烟", "安全出口"]),
])
lesson("ug-l1", [
    C("modals"),
    T("戴", ["穿", "动", "停"]), N("手套", ["安全帽", "帽子", "鞋"]),
    TX("进车间要戴安全帽。", "Vào xưởng phải đội mũ bảo hộ.", ["Vào xưởng phải đeo găng tay.", "Vào xưởng không cần đội mũ.", "Mũ bảo hộ ở trong xưởng."]),
    TX("别动机器！", "Đừng động vào máy!", ["Hãy bật máy!", "Máy hỏng rồi!", "Đừng dừng máy!"]),
    F("请___手套。", "戴", ["穿", "吃", "坐"], "Hãy đeo găng tay."),
    F("工作的时候___吸烟。", "不要", ["要", "可以", "会"], "Khi làm việc đừng hút thuốc."),
    W("Hãy đội mũ bảo hộ.", "请|戴|安全帽", ["穿", "手套"]),
    Y("Đừng hút thuốc!", "别吸烟", "不要吸烟", "请不要吸烟", "请别吸烟", "禁止吸烟", "不能吸烟", "别抽烟", "不要抽烟", "请不要抽烟"),
    M("戴", "穿", "手套", "安全帽", "机器"),
    RC("ug_rules", "Vào phân xưởng phải làm gì?", "Đội mũ bảo hộ", ["Tắt điện thoại", "Đi giày mới", "Gọi tổ trưởng"]),
    RC("ug_rules", "Máy có vấn đề thì làm gì?", "Dừng máy ngay rồi báo tổ trưởng", ["Tự sửa máy", "Tiếp tục làm việc", "Đi về nhà"]),
    RC("ug_rules", "Bình chữa cháy ở đâu?", "Cạnh cửa ra vào", ["Trong văn phòng", "Ở nhà ăn", "Trong kho"]),
])
lesson("ug-l2", [
    T("加班", ["上班", "下班", "休息"]), N("组长", ["经理", "老板", "工人"]),
    TX("明天早上七点上班，别迟到。", "Mai bảy giờ sáng vào làm, đừng đến muộn.", ["Mai bảy giờ tối vào làm, đừng đến muộn.", "Mai bảy giờ sáng tan ca.", "Hôm nay bảy giờ sáng vào làm."]),
    TX("今天晚上要加班。", "Tối nay phải tăng ca.", ["Tối nay được nghỉ.", "Mai phải tăng ca.", "Tối nay tan ca sớm."]),
    F("明天八点___会。", "开", ["关", "打", "看"], "Mai tám giờ họp."),
    W("Mai tôi tăng ca.", "我|明天|加班", ["下班", "了"], alts=("明天|我|加班",)),
    Y("Tôi đến muộn mười phút.", "我迟到了十分钟", "我晚到了十分钟", "我来晚了十分钟", "我晚了十分钟"),
    M("上班", "下班", "加班", "迟到", "组长"),
    RC("ug_msg_leader", "Mai mấy giờ họp?", "7 giờ rưỡi", ["7 giờ", "8 giờ", "3 giờ chiều"]),
    RC("ug_msg_leader", "Ai gửi tin nhắn?", "Tổ trưởng Lý", ["Quản lý Vương", "Tiểu Vương", "Nguyễn Hải"]),
    RC("ug_shift", "Ca đêm bắt đầu lúc mấy giờ?", "11 giờ đêm", ["7 giờ sáng", "3 giờ chiều", "7 giờ tối"]),
    RC("ug_shift", "Phải chấm công khi nào?", "Trước khi vào ca và trước khi tan ca", ["Chỉ khi vào ca", "Sau khi ăn trưa", "Mỗi tuần một lần"]),
])
lesson("ug-l3", [
    T("箱子", ["杯子", "桌子", "椅子"]), N("搬", ["放", "拿", "推"]),
    TX("这个箱子很重。", "Cái thùng này nặng.", ["Cái thùng này nhẹ.", "Cái thùng kia nặng.", "Cái thùng này to."]),
    F("请把箱子___在这儿。", "放", ["戴", "穿", "吃"], "Hãy để thùng ở đây."),
    F("仓库里有五十个___。", "箱子", ["工人", "机器", "手套"], "Trong kho có năm mươi cái thùng."),
    W("Cái thùng này rất nặng.", "这个|箱子|很|重", ["轻", "是"]),
    Y("Cái thùng này nhẹ.", "这个箱子很轻", "这个箱子轻"),
    M("箱子", "仓库", "搬", "放", "重"),
    RC("ug_warehouse", "Thùng nặng thì làm thế nào?", "Hai người cùng khiêng", ["Một người khiêng", "Để ở cửa", "Gọi quản lý"]),
    RC("ug_warehouse", "Hàng đến thì làm gì trước?", "Kiểm tra", ["Cất vào kho", "Đóng gói", "Gửi đi"]),
    LC("ug_anquanmao", "Bạn phải làm gì?", "Đội mũ bảo hộ", ["Đeo găng tay", "Mặc đồ bảo hộ", "Dừng máy"]),
    D("ug_anquanmao"),
    LC("ug_tingji", "Máy có vấn đề. Phải làm gì?", "Dừng máy ngay", ["Bật máy lên", "Gọi điện về nhà", "Đi nghỉ"]),
    LC("ug_fang", "Để thùng ở đâu?", "Ở đây", ["Ở cửa", "Trong kho", "Trên bàn"]),
    LC("ug_shoutao", "Bạn phải làm gì?", "Đeo găng tay và mặc đồ bảo hộ", ["Đội mũ bảo hộ", "Đeo khẩu trang", "Đi giày bảo hộ"]),
])

# ---------------------------------------------------------------- uh: the station and the airport
lesson("uh-l0", [
    T("火车站", ["机场", "地铁", "车站"]), N("地铁", ["火车", "飞机", "公交车"]), H("机场", ["火车站", "车站", "机票"]),
    TX("火车八点到北京。", "Tàu tám giờ đến Bắc Kinh.", ["Tàu tám giờ rời Bắc Kinh.", "Tàu chín giờ đến Bắc Kinh.", "Máy bay tám giờ đến Bắc Kinh."]),
    TX("请注意安全。", "Xin chú ý an toàn.", ["Xin chú ý giờ tàu.", "Xin cẩn thận cửa.", "Xin lên tàu."]),
    F("火车几点___？", "到", ["去", "是", "在"], "Tàu mấy giờ đến?"),
    M("火车站", "地铁", "机场", "飞机", "火车"),
    LC("uh_beijing", "Tàu đi Bắc Kinh khởi hành lúc mấy giờ?", "8 giờ", ["9 giờ", "8 giờ rưỡi", "10 giờ"]),
    LC("uh_wanle", "Tàu thế nào?", "Muộn 20 phút", ["Muộn 10 phút", "Đến sớm 20 phút", "Không chạy"]),
    LC("uh_menkou", "Lên tàu ở cửa số mấy?", "Cửa số 3", ["Cửa số 2", "Cửa số 4", "Cửa số 13"]),
    LC("uh_xiayizhan", "Ga tiếp theo là ga nào?", "Ga tàu hoả", ["Sân bay", "Ga tàu điện ngầm", "Bến xe buýt"]),
])
lesson("uh-l1", [
    T("票", ["车票", "机票", "门票"]), N("车票", ["机票", "门票", "钱包"]),
    F("我要一___去上海的票。", "张", ["本", "个", "件"], "Tôi muốn một vé đi Thượng Hải."),
    TX("一张去北京的票多少钱？", "Một vé đi Bắc Kinh bao nhiêu tiền?", ["Hai vé đi Bắc Kinh bao nhiêu tiền?", "Vé đi Bắc Kinh ở đâu?", "Một vé từ Bắc Kinh bao nhiêu tiền?"]),
    NX("hai vé tàu", "两张车票", ["二张车票", "两本车票", "两车票张"]),
    W("Tôi mua một vé máy bay.", "我|买|一张|机票", ["本", "卖"]),
    Y("hai vé", "两张票"),
    M("票", "车票", "机票", "门票", "张"),
    LC("uh_zhuyi", "Thông báo nói gì?", "Xin chú ý an toàn", ["Xin chú ý giờ tàu", "Xin lên tàu", "Cấm hút thuốc"]),
    D("uh_zhuyi"),
    LC("uh_shangche", "Thông báo nói gì?", "Xuống trước, lên sau", ["Lên trước, xuống sau", "Xin đứng ở cửa", "Xin ngồi xuống"]),
    D("uh_shangche"),
    LC("uh_plane", "Máy bay đến lúc mấy giờ?", "3 giờ chiều", ["3 giờ sáng", "4 giờ chiều", "13 giờ"]),
    RC("uh_timetable", "Tàu đi Thượng Hải chạy lúc mấy giờ?", "10 giờ rưỡi sáng", ["9 giờ sáng", "2 giờ chiều", "10 giờ sáng"]),
    RC("uh_timetable", "Lên tàu ở đâu?", "Cửa số 2", ["Cửa số 3", "Cửa số 10", "Cửa số 9"]),
])
lesson("uh-l2", [
    C("comparison-bi"),
    T("公交车", ["出租车", "火车", "自行车"]), N("飞机", ["火车", "汽车", "地铁"]),
    F("我___地铁上班。", "坐", ["开", "走", "骑"], "Tôi đi làm bằng tàu điện ngầm."),
    F("我___自行车去工厂。", "骑", ["坐", "开", "戴"], "Tôi đạp xe đạp đến nhà máy."),
    TX("坐地铁比坐公交车快。", "Đi tàu điện ngầm nhanh hơn đi xe buýt.", ["Đi xe buýt nhanh hơn đi tàu điện ngầm.", "Tàu điện ngầm và xe buýt nhanh như nhau.", "Đi tàu điện ngầm rẻ hơn đi xe buýt."]),
    W("Tôi đi máy bay đến Bắc Kinh.", "我|坐|飞机|去|北京", ["开", "火车"]),
    M("公交车", "出租车", "自行车", "汽车", "飞机"),
    LC("uh_piao", "Vé đi Thượng Hải bao nhiêu tiền?", "300 tệ", ["30 tệ", "3000 tệ", "200 tệ"]),
    LC("uh_liangzhang", "Người nói muốn mua gì?", "Hai vé đi Bắc Kinh", ["Một vé đi Bắc Kinh", "Hai vé đi Thượng Hải", "Hai vé máy bay"]),
    LC("uh_zhanzai", "Ga tàu điện ngầm ở đâu?", "Cạnh ga tàu hoả", ["Đối diện ga tàu hoả", "Trong sân bay", "Sau siêu thị"]),
    RC("uh_subway", "Ga tiếp theo là ga nào?", "Ga tàu hoả", ["Sân bay", "Ga cuối", "Bến xe buýt"]),
    RC("uh_subway", "Trên tàu cấm làm gì?", "Hút thuốc", ["Ăn uống", "Nói chuyện", "Gọi điện"]),
])
lesson("uh-l3", [
    H("下一站：火车站。", ["下一站：机场。", "这一站：火车站。", "下一站：车站。"]),
    H("火车马上出发。", ["火车马上到。", "火车已经出发了。", "飞机马上出发。"]),
    TX("火车马上就要出发了。", "Tàu sắp khởi hành.", ["Tàu đã khởi hành.", "Tàu sắp đến.", "Tàu không khởi hành."]),
    F("飞机三点___发。", "出", ["到", "开", "上"], "Máy bay ba giờ khởi hành."),
    W("Tàu tám giờ khởi hành.", "火车|八点|出发", ["到", "了"], alts=("八点|火车|出发",)),
    Y("Ga tàu hoả ở đâu?", "火车站在哪儿"),
    M("出发", "到", "马上", "车站", "地铁站"),
    LC("uh_huzhao", "Phải cầm sẵn gì?", "Hộ chiếu và vé máy bay", ["Hộ chiếu và thị thực", "Vé tàu", "Thẻ ngân hàng"]),
    LC("uh_wumen", "Máy bay đi Bắc Kinh ở cửa số mấy?", "Cửa số 5", ["Cửa số 3", "Cửa số 15", "Cửa số 2"]),
    LC("uh_yixiaoshi", "Máy bay thế nào?", "Muộn một tiếng", ["Muộn nửa tiếng", "Đã cất cánh", "Đến sớm một tiếng"]),
    RC("uh_airport", "Máy bay bay từ đâu đến đâu?", "Từ Hà Nội đến Bắc Kinh", ["Từ Bắc Kinh đến Hà Nội", "Từ Hà Nội đến Thượng Hải", "Từ Thượng Hải đến Bắc Kinh"]),
    RC("uh_airport", "Phải mang theo gì?", "Hộ chiếu và thị thực", ["Hộ chiếu và vé tàu", "Thẻ ngân hàng", "Thẻ căn cước"]),
    RC("uh_airport", "Bay ngày nào?", "Ngày 1 tháng 5", ["Ngày 5 tháng 1", "Ngày 1 tháng 8", "Ngày 8 tháng 5"]),
])

# ---------------------------------------------------------------- ui: the shop
lesson("ui-l0", [
    T("商店", ["超市", "书店", "商场"]), N("超市", ["商店", "商场", "书店"]), H("买", ["卖", "要", "来"]),
    TX("你要什么？", "Bạn cần gì?", ["Bạn muốn đi đâu?", "Bạn có gì?", "Bạn bán gì?"]),
    F("我___两个苹果。", "要", ["卖", "是", "在"], "Cho tôi hai quả táo."),
    W("Tôi đi siêu thị mua đồ.", "我|去|超市|买|东西", ["卖", "商场"]),
    Y("Tôi muốn mua cái này.", "我想买这个", "我要买这个"),
    M("商店", "超市", "买", "卖", "要"),
    LC("ui_yao", "Khách muốn mua gì?", "Hai quả táo", ["Một quả táo", "1 ký táo", "Hai chai nước"]),
    LC("ui_yifu", "Người bán hỏi gì?", "Khách muốn màu gì", ["Khách muốn cỡ nào", "Khách muốn mấy cái", "Khách trả bằng gì"]),
    RC("ui_dialogue", "Chị Hoa mua gì?", "1 ký táo", ["Hai quả táo", "Nửa ký táo", "Hai chai nước"]),
    RC("ui_dialogue", "Tổng cộng bao nhiêu tiền?", "10 tệ", ["2 tệ", "20 tệ", "12 tệ"]),
    RC("ui_dialogue", "Chị Hoa trả tiền bằng gì?", "Quét mã", ["Tiền mặt", "Thẻ ngân hàng", "Chưa trả"]),
])
lesson("ui-l1", [
    H("二十八块", ["十八块", "二十块", "八十二块"]), H("一共三十块。", ["一共十三块。", "一共四十块。", "一个三十块。"]),
    TX("一共二十八块。", "Tổng cộng hai mươi tám tệ.", ["Tổng cộng mười tám tệ.", "Một cái hai mươi tám tệ.", "Tổng cộng tám mươi hai tệ."]),
    F("苹果五块钱一___。", "斤", ["本", "张", "双"], "Táo năm tệ nửa ký."),
    NX("Bao nhiêu tiền nửa ký?", "多少钱一斤？", ["一斤多钱少？", "多少一斤钱？", "几钱一斤？"]),
    W("Tổng cộng bao nhiêu tiền?", "一共|多少|钱", ["几", "个"]),
    Y("Mười lăm tệ.", "十五块", "十五块钱", "十五元"),
    M("一共", "块", "毛", "斤", "钱"),
    LC("ui_yigong", "Tổng cộng bao nhiêu tiền?", "28 tệ", ["18 tệ", "82 tệ", "20 tệ"]),
    LC("ui_jin", "Táo bao nhiêu tiền nửa ký?", "5 tệ", ["15 tệ", "50 tệ", "4 tệ"]),
    RC("ui_prices", "Một chai sữa bao nhiêu tiền?", "8 tệ", ["2 tệ", "6 tệ", "5 tệ"]),
    RC("ui_prices", "Cái gì giá 2 tệ một chai?", "Nước", ["Sữa", "Táo", "Bánh mì"]),
])
lesson("ui-l2", [
    T("扫", ["找", "给", "试"]), N("找", ["扫", "给", "买"]),
    TX("我扫你还是你扫我？", "Tôi quét mã của bạn hay bạn quét mã của tôi?", ["Tôi trả tiền mặt nhé?", "Bạn có mã QR không?", "Bạn quét mã giúp tôi nhé."]),
    NX("Quét mã được không?", "可以扫码吗？", ["扫码可以吧吗？", "可以吗扫码？", "可以扫码呢？"]),
    F("我___你钱。", "给", ["扫", "试", "卖"], "Tôi đưa tiền cho bạn."),
    W("Cho tôi thử một chút.", "我|试|一下", ["扫", "给"], alts=("给|我|试|一下",)),
    Y("Quét mã được không?", "可以扫码吗", "能扫码吗", "我可以扫码吗", "扫码可以吗", "能不能扫码", "可不可以扫码", "可以扫码不"),
    M("扫", "找", "给", "试", "扫码"),
    LC("ui_saoma", "Có quét mã được không?", "Được, khách quét mã của người bán", ["Được, người bán quét mã của khách", "Không được", "Chỉ nhận tiền mặt"]),
    LC("ui_zhaoqian", "Người bán trả lại bao nhiêu?", "20 tệ", ["100 tệ", "80 tệ", "120 tệ"]),
])
lesson("ui-l3", [
    TX("太贵了，便宜一点儿吧。", "Đắt quá, bớt chút đi.", ["Rẻ quá, tôi lấy hai cái.", "Đắt quá, tôi không mua.", "Cái này rẻ một chút."]),
    TX("三十块，行吗？", "Ba mươi tệ được không?", ["Ba mươi tệ một cái.", "Mười ba tệ được không?", "Ba mươi tệ đắt quá."]),
    NX("Bớt cho tôi một chút đi.", "便宜一点儿吧。", ["便宜一点儿吗。", "一点儿便宜吧。", "贵一点儿吧。"]),
    F("这件衣服有点儿___。", "贵", ["便宜", "好", "新"], "Cái áo này hơi đắt."),
    N("卖", ["买", "要", "找"]),
    W("Đắt quá!", "太|贵|了", ["很", "便宜"]),
    Y("Bớt chút đi.", "便宜一点儿吧", "便宜点儿吧", "便宜一点儿"),
    M("太", "有点儿", "一点儿", "行", "便宜"),
    LC("ui_gui", "Cuối cùng giá bao nhiêu?", "30 tệ", ["13 tệ", "40 tệ", "300 tệ"]),
    LC("ui_shi", "Khách muốn làm gì?", "Mặc thử", ["Đổi áo", "Trả tiền", "Mua hai cái"]),
    LC("ui_xiexie", "Người bán nói gì cuối cùng?", "Không có gì, tạm biệt", ["Cảm ơn, hẹn mai gặp", "Xin lỗi", "Chào buổi sáng"]),
    RC("ui_hours", "Siêu thị đóng cửa lúc mấy giờ?", "10 giờ tối", ["8 giờ tối", "10 giờ sáng", "8 giờ sáng"]),
    RC("ui_hours", "Chủ nhật siêu thị có mở cửa không?", "Có", ["Không", "Chỉ buổi sáng", "Chỉ buổi chiều"]),
    RC("ui_hours", "Có thể trả tiền bằng gì?", "Quét mã hoặc thẻ ngân hàng", ["Chỉ tiền mặt", "Chỉ quét mã", "Chỉ thẻ ngân hàng"]),
])

# ---------------------------------------------------------------- uj: the dormitory
lesson("uj-l0", [
    T("宿舍", ["房间", "房子", "公园"]), N("房间", ["宿舍", "房子", "洗手间"]),
    TX("我住在工厂宿舍。", "Tôi sống ở ký túc xá nhà máy.", ["Tôi làm ở nhà máy.", "Ký túc xá ở cạnh nhà máy.", "Tôi sống ở nhà."]),
    TX("你住几号房间？", "Bạn ở phòng số mấy?", ["Phòng bạn có mấy người?", "Bạn ở ký túc xá nào?", "Bạn ở tầng mấy?"]),
    F("我的房间很___。", "干净", ["洗澡", "起床", "睡觉"], "Phòng của tôi sạch sẽ."),
    W("Phòng của tôi ở tầng ba.", "我的|房间|在|三|楼", ["上", "里"]),
    Y("Tôi sống ở ký túc xá.", "我住在宿舍", "我住宿舍", "我住在宿舍里"),
    M("宿舍", "房间", "同事", "洗手间", "干净"),
    LC("uj_hai_work", "Anh Nguyễn Hải làm việc ở đâu?", "Ở một nhà máy Trung Quốc", ["Ở một công ty Việt Nam", "Ở một bệnh viện", "Ở một siêu thị"]),
    D("uj_hai_work"),
    RC("uj_hai_day", "Anh Hải dậy lúc mấy giờ?", "6 giờ", ["7 giờ", "5 giờ", "8 giờ"]),
    RC("uj_hai_day", "Buổi trưa anh ấy ăn ở đâu?", "Ở nhà ăn", ["Ở ký túc xá", "Ở quán ăn", "Ở nhà"]),
    RC("uj_hai_day", "Buổi tối anh ấy làm gì?", "Nghỉ ở ký túc xá và gọi điện cho mẹ", ["Tăng ca ở nhà máy", "Đi siêu thị", "Học tiếng Trung"]),
    RC("uj_dorm", "Sau 11 giờ đêm phải làm gì?", "Giữ yên lặng", ["Tắt đèn", "Giặt quần áo", "Chấm công"]),
    RC("uj_dorm", "Máy giặt ở đâu?", "Tầng một", ["Tầng hai", "Tầng ba", "Trong phòng"]),
])
lesson("uj-l1", [
    T("起床", ["睡觉", "洗澡", "上班"]), N("睡觉", ["起床", "休息", "洗澡"]),
    TX("我每天六点起床。", "Hằng ngày tôi dậy lúc sáu giờ.", ["Hằng ngày tôi ngủ lúc sáu giờ.", "Hôm nay tôi dậy lúc sáu giờ.", "Hằng ngày tôi dậy lúc bảy giờ."]),
    F("我晚上十一点___。", "睡觉", ["起床", "上班", "早上"], "Tôi đi ngủ lúc mười một giờ tối."),
    NX("Tối tôi tắm, rồi gọi điện cho mẹ.", "晚上我洗澡，然后给妈妈打电话。", ["晚上我洗澡，但是给妈妈打电话。", "晚上我洗澡，然后妈妈给我打电话。", "晚上我打电话，然后洗澡。"]),
    W("Tôi dậy lúc sáu giờ.", "我|六点|起床", ["睡觉", "了"], alts=("六点|我|起床",)),
    Y("Hằng ngày tôi tắm.", "我每天洗澡"),  # 每天都 + V: zh_text.dou_spellings
    M("起床", "睡觉", "洗澡", "每天", "然后"),
    LC("uj_hua_father", "Bố của chị Hoa làm nghề gì?", "Tài xế", ["Bác sĩ", "Công nhân", "Giáo viên"]),
    RC("uj_family", "Nhà chị Hoa có mấy người?", "Bốn người", ["Ba người", "Năm người", "Hai người"]),
    RC("uj_family", "Mẹ chị Hoa làm nghề gì?", "Bác sĩ", ["Tài xế", "Y tá", "Công nhân"]),
    RC("uj_family", "Anh trai chị Hoa làm việc ở đâu?", "Ở Hà Nội", ["Ở Thượng Hải", "Ở Bắc Kinh", "Ở Quảng Châu"]),
])
lesson("uj-l2", [
    T("衣服", ["鞋", "帽子", "包"]), N("洗", ["穿", "戴", "买"]),
    F("我___衣服。", "洗", ["戴", "坐", "喝"], "Tôi giặt quần áo."),
    F("洗衣机在___？", "哪儿", ["什么", "谁", "几"], "Máy giặt ở đâu?"),
    TX("星期天我洗衣服。", "Chủ nhật tôi giặt quần áo.", ["Chủ nhật tôi mua quần áo.", "Thứ Bảy tôi giặt quần áo.", "Chủ nhật tôi mặc quần áo mới."]),
    W("Tôi mặc quần áo mới.", "我|穿|新|衣服", ["戴", "洗"]),
    Y("Máy giặt ở đâu?", "洗衣机在哪儿"),
    M("衣服", "鞋", "帽子", "洗", "穿"),
    LC("uj_canteen_open", "Nhà ăn mở cửa lúc mấy giờ?", "11 giờ rưỡi trưa", ["11 giờ trưa", "12 giờ rưỡi trưa", "1 giờ chiều"]),
    RC("uj_workday", "Buổi sáng họ kiểm tra bao nhiêu thùng?", "50 thùng", ["15 thùng", "5 thùng", "500 thùng"]),
    RC("uj_workday", "Buổi chiều họ làm gì?", "Tăng ca đến 7 giờ", ["Nghỉ ở ký túc xá", "Đi siêu thị", "Ăn ở nhà ăn"]),
    RC("uj_canteen", "Một bát mì bao nhiêu tiền?", "8 tệ", ["2 tệ", "5 tệ", "7 tệ"]),
    RC("uj_canteen", "Bữa tối ở nhà ăn từ mấy giờ?", "Từ 5 giờ rưỡi đến 7 giờ", ["Từ 11 giờ rưỡi đến 1 giờ", "Từ 5 giờ đến 7 giờ rưỡi", "Từ 7 giờ đến 9 giờ"]),
])
lesson("uj-l3", [
    T("同事", ["同学", "朋友", "客人"]),
    H("你回家吗？", ["你回来吗？", "你在家吗？", "你去哪儿？"]),
    F("下班以后我___家。", "回", ["去", "来", "上"], "Tan ca xong tôi về nhà."),
    NX("Vâng, tôi về nhà.", "对，我回家。", ["对，我回来家。", "对，我家回。", "不，我回家。"]),
    W("Đồng nghiệp của tôi là người Trung Quốc.", "我的|同事|是|中国人", ["越南人", "在"]),
    Y("Bạn về nhà mấy giờ?", "你几点回家", "你几点钟回家"),
    M("同事", "回家", "宿舍", "起床", "睡觉"),
    LC("uj_park", "Thứ Bảy họ đi đâu?", "Công viên", ["Siêu thị", "Nhà máy", "Bệnh viện"]),
    LC("uj_anjing", "Sau 11 giờ đêm phải làm gì?", "Giữ yên lặng", ["Đi ngủ", "Tắt đèn", "Về ký túc xá"]),
    D("uj_anjing"),
    RC("uj_colleague", "Tiểu Vương bao nhiêu tuổi?", "28 tuổi", ["18 tuổi", "24 tuổi", "82 tuổi"]),
    RC("uj_colleague", "Tiểu Vương thích gì?", "Hát và chơi bóng", ["Nấu ăn và đọc sách", "Xem phim", "Du lịch"]),
    RC("uj_msg_wang", "Họ hẹn gặp ở đâu?", "Ở cổng ký túc xá", ["Ở công viên", "Ở nhà máy", "Ở ga tàu"]),
    RC("uj_msg_wang", "Mấy giờ gặp?", "10 giờ sáng", ["10 giờ tối", "6 giờ sáng", "6 giờ tối"]),
])
finish("s3")

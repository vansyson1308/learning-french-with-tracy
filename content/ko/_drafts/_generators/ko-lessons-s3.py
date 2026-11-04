"""ko-vi Section 3 lessons (understand everyday Korean): weather and seasons (unit f), factory signs and rules (g),
subway and bus (h), the convenience store (i), the dormitory (j). Session 2 writes the lesson-internal exercise types
(choices, listening choices, fill-ins, typed answers, word banks, matches); the reception layers (readings, clips heard
through the device voice, dictation) join these lessons in session 3. Writes lessons/parts/s3.jsonl.
usage: python -I ko-lessons-s3.py <repo root>"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ko_lesson_lib import C, D, F, H, K, LC, M, N, NX, RC, T, TX, W, Y, finish, lesson

# ---------------------------------------------------------------- uf: weather and the four seasons
lesson("uf-l0", [
    C("irregular-stems"),
    T("날씨", ["비", "바람", "우산"]), N("비", ["날씨", "바람", "하늘"]),
    H("추워요", ["더워요", "좋아요", "와요"]),
    F("오늘은 날씨가 ___.", "추워요", ["춥어요", "더워요", "춥다"], "Hôm nay trời lạnh."),
    NX("Mùa hè nóng.", "여름은 더워요.", ["여름은 덥어요.", "겨울은 더워요.", "여름은 추워요."]),
    TX("비가 와요.", "Trời mưa.", ["Trời nắng.", "Trời có gió.", "Trời lạnh."]),
    Y("Hôm nay trời nóng.", "오늘은 더워요.", "오늘은 날씨가 더워요."),
    W("Hôm nay trời lạnh.", "오늘은|날씨가|추워요", ["날씨를", "더워요"]),
    M("봄", "여름", "가을", "겨울"),
    # layers (session 3)
    LC("uf_nalssi", "Bạn nghe thấy từ nào?", "thời tiết", ["mùa hè", "cái ô", "cơn gió"]), LC("uf_bi", "Bạn nghe thấy từ nào?", "mưa", ["gió", "mây", "nắng"]),
    LC("uf_usan", "Bạn nghe thấy từ nào?", "cái ô", ["cái mũ", "cái túi", "đôi giày"]), LC("uf_deowoyo", "Câu này nghĩa là gì?", "Trời nóng.", ["Trời lạnh.", "Trời mưa.", "Trời mát."]),
    LC("uf_chuwoyo", "Câu này nghĩa là gì?", "Trời lạnh.", ["Trời nóng.", "Trời ấm.", "Trời có gió."]),
])
lesson("uf-l1", [
    H("비가 와요", ["비가 안 와요", "바람이 많아요", "날씨가 좋아요"]),
    T("바람", ["비", "우산", "하늘"]),
    F("비가 와요. 우산___ 있어요?", "이", ["을", "에", "를"], "Trời mưa. Bạn có ô không?"),
    TX("봄은 따뜻해요.", "Mùa xuân ấm.", ["Mùa thu mát.", "Mùa đông lạnh.", "Mùa hè nóng."]),
    TX("가을은 시원해요.", "Mùa thu mát.", ["Mùa xuân ấm.", "Mùa thu nóng.", "Mùa hè mưa nhiều."]),
    Y("Mùa xuân ấm.", "봄은 따뜻해요."),
    W("Mùa thu trời mát.", "가을은|시원해요", ["가을을", "추워요"]),
    M("따뜻하다", "시원하다", "덥다", "춥다"),
    # layers (session 3)
    LC("uf_baram", "Bạn nghe thấy từ nào?", "gió", ["mưa", "mặt trời", "bầu trời"]), LC("uf_bi_wayo", "Câu này nghĩa là gì?", "Trời mưa.", ["Trời nắng.", "Trời có gió.", "Trời lạnh."]), D("uf_bi_wayo"),
    LC("uf_malgayo", "Hôm nay trời thế nào?", "trời quang", ["trời mưa", "trời âm u", "trời có gió"]),
    LC("uf_usan_isseoyo", "Người nói hỏi gì?", "bạn có ô không", ["ô ở đâu", "ô bao nhiêu tiền", "bạn có áo mưa không"]),
    RC("uf_forecast", "Ngày nào trời mưa?", "thứ Ba", ["thứ Hai", "thứ Tư", "thứ Năm"]), RC("uf_forecast", "Từ thứ Năm, trời thế nào?", "lạnh", ["nóng", "mưa", "quang"]),
])
lesson("uf-l2", [
    TX("오후에 비가 올 거예요.", "Chiều nay trời sẽ mưa.", ["Sáng nay trời đã mưa.", "Chiều nay trời nắng.", "Bây giờ trời đang mưa."]),
    H("맑아요", ["흐려요", "추워요", "더워요"]),
    T("맑다", ["흐리다", "덥다", "춥다"]),
    NX("Hôm nay trời âm u.", "오늘은 흐려요.", ["오늘은 맑아요.", "오늘은 흐리요.", "오늘을 흐려요."]),
    Y("Ngày mai trời lạnh.", "내일은 추워요.", "내일은 날씨가 추워요.", "내일은 추울 거예요."),
    W("Mùa đông ở Hàn Quốc lạnh.", "한국의|겨울은|추워요", ["겨울을", "더워요"]),
    M("맑다", "흐리다", "바람", "하늘", "해"),
    # layers (session 3)
    LC("uf_bom", "Bạn nghe thấy từ nào?", "mùa xuân", ["mùa hè", "mùa thu", "mùa đông"]), LC("uf_gyeoul", "Bạn nghe thấy từ nào?", "mùa đông", ["mùa xuân", "mùa hè", "mùa thu"]),
    LC("uf_rain_tomorrow", "Khi nào trời mưa?", "ngày mai", ["hôm nay", "hôm qua", "cuối tuần"]),
    LC("uf_cold_wind", "Hôm nay thời tiết thế nào?", "lạnh và nhiều gió", ["nóng và nhiều gió", "lạnh và mưa", "ấm và quang"]),
    RC("uf_seasons", "Mùa nào nóng và mưa nhiều?", "mùa hè", ["mùa xuân", "mùa thu", "mùa đông"]), RC("uf_seasons", "Người viết thích mùa nào nhất?", "mùa thu", ["mùa xuân", "mùa hè", "mùa đông"]),
])
lesson("uf-l3", [
    TX("여름에는 비가 많이 와요.", "Mùa hè mưa nhiều.", ["Mùa đông mưa nhiều.", "Mùa hè ít mưa.", "Mùa hè trời lạnh."]),
    F("겨울___ 아주 추워요.", "은", ["는", "을", "를"], "Mùa đông rất lạnh."),
    NX("Tôi thích mùa thu.", "저는 가을을 좋아해요.", ["저는 가을이 좋아해요.", "저는 가을을 좋아요.", "저는 겨울을 좋아해요."]),
    Y("Hôm nay thời tiết đẹp.", "오늘은 날씨가 좋아요."),
    H("우산", ["우유", "우리", "우체국"]),
    T("우산", ["가방", "모자", "옷"]),
    W("Hôm nay trời mưa.", "오늘은|비가|와요", ["비를", "가요"]),
    M("날씨", "비", "바람", "우산", "하늘"),
    # layers (session 3)
    LC("uf_moreugesseoyo", "Câu này nghĩa là gì?", "Tôi không biết.", ["Tôi hiểu rồi.", "Tôi không nghe thấy.", "Tôi biết người đó."]),
    LC("uf_dasi", "Câu này nghĩa là gì?", "Xin nói lại giúp tôi.", ["Xin nói chậm thôi.", "Xin chờ một chút.", "Xin lỗi, tôi đến muộn."]), D("uf_dasi"),
    LC("uf_cheoncheonhi", "Câu này nghĩa là gì?", "Xin nói chậm thôi.", ["Xin nói lại giúp tôi.", "Xin nói to lên.", "Xin viết ra giúp tôi."]),
    RC("uf_card", "Anh Nam làm nghề gì?", "người lao động", ["nhân viên công ty", "học sinh", "bác sĩ"]), RC("uf_card", "Anh Nam là người nước nào?", "Việt Nam", ["Hàn Quốc", "Trung Quốc", "Nhật Bản"]),
])

# ---------------------------------------------------------------- ug: signs and rules at the factory
lesson("ug-l0", [
    C("requests"),
    T("위험", ["안전", "금지", "주의"]), N("안전", ["위험", "금연", "주의"]), T("금연", ["금지", "출입", "비상구"]),
    NX("Biển báo \"Cấm hút thuốc\" ghi là:", "금연", ["금지", "위험", "주의"]),
    TX("위험! 조심하세요.", "Nguy hiểm! Hãy cẩn thận.", ["An toàn! Mời vào.", "Cấm hút thuốc.", "Lối thoát hiểm ở đây."]),
    F("안전모를 ___.", "쓰세요", ["쓰요", "먹으세요", "가세요"], "Hãy đội mũ bảo hộ."),
    Y("Hãy cẩn thận.", "조심하세요."),
    W("Hãy đeo găng tay.", "장갑을|끼세요", ["장갑이", "쓰세요"]),
    M("안전", "위험", "금지", "금연", "주의"),
    # layers (session 3)
    RC("ug_signs", "Biển nào chỉ lối thoát hiểm?", "비상구", ["소화기", "금연", "위험"]), RC("ug_signs", "Biển nào nghĩa là cấm hút thuốc?", "금연", ["금지", "위험", "출입"]),
    LC("ug_stop", "Câu này nghĩa là gì?", "Hãy dừng máy.", ["Hãy bật máy.", "Hãy sửa máy.", "Đừng cho tay vào máy."]),
    LC("ug_helmet", "Phải làm gì?", "đội mũ bảo hộ", ["đeo găng tay", "đi giày bảo hộ", "đeo khẩu trang"]), D("ug_helmet"),
])
lesson("ug-l1", [
    C("rules-permission"),
    T("비상구", ["출구", "입구", "소화기"]), N("소화기", ["비상구", "기계", "장갑"]),
    F("일할 때 핸드폰을 쓰면 ___.", "안 돼요", ["돼요", "좋아요", "있어요"], "Khi làm việc không được dùng điện thoại."),
    NX("Bắt buộc phải đội mũ bảo hộ.", "안전모를 써야 해요.", ["안전모를 써도 돼요.", "안전모를 쓰면 안 돼요.", "안전모를 써요?"]),
    TX("기계를 멈추세요.", "Hãy dừng máy.", ["Hãy bật máy.", "Hãy sửa máy.", "Máy bị hỏng."]),
    Y("Không được vào đây.", "여기에 들어가면 안 돼요.", "여기 들어가면 안 돼요.", "들어가면 안 돼요."),
    W("Tôi vào được không?", "들어가도|돼요", ["들어가지", "없어요"]),
    M("비상구", "소화기", "장갑", "마스크", "기계"),
    # layers (session 3)
    RC("ug_rules", "Trong nhà máy phải đội gì?", "mũ bảo hộ", ["mũ len", "kính bảo hộ", "khẩu trang"]),
    RC("ug_rules", "Điều nào bị cấm?", "cho tay vào máy", ["đeo găng tay", "đội mũ bảo hộ", "ăn ở nhà ăn"]),
    LC("ug_gloves", "Người nói dặn gì?", "đeo găng tay khi làm việc", ["tháo găng tay ra", "mua găng tay mới", "rửa tay"]),
    LC("ug_exit", "Lối thoát hiểm ở đâu?", "bên trái", ["bên phải", "phía trước", "phía sau"]),
])
lesson("ug-l2", [
    T("공장", ["농장", "회사", "사무실"]),
    NX("Từ nào nghe gần âm Hán-Việt \"an toàn\"?", "안전", ["안경", "안녕", "안개"]),
    TX("주의", "chú ý", ["chủ nhật", "cấm", "nguy hiểm"]),
    F("___ 금지", "출입", ["출구", "입구", "금연"], "Cấm ra vào"),
    T("금지", ["금연", "주의", "위험"]),
    TX("불량 제품이에요.", "Đây là hàng lỗi.", ["Đây là sản phẩm tốt.", "Đây là linh kiện.", "Đây là cái hộp."]),
    Y("Gõ bằng tiếng Hàn: an toàn", "안전"),
    W("Đây là lối thoát hiểm.", "여기가|비상구예요", ["비상구이에요", "여기를"]),
    M("공장", "제품", "부품", "상자", "불량"),
    # layers (session 3)
    RC("ug_shift", "Ca ngày kết thúc lúc mấy giờ?", "5 giờ chiều", ["8 giờ sáng", "8 giờ tối", "1 giờ chiều"]),
    RC("ug_msg_leader", "Ngày mai anh Nam đi làm lúc mấy giờ?", "7 giờ", ["6 giờ", "8 giờ", "9 giờ"]), RC("ug_msg_leader", "Họ gặp nhau ở đâu?", "trước nhà ăn", ["trong nhà máy", "ở nhà ga", "trước ký túc xá"]),
    LC("ug_lunch", "Giờ nghỉ trưa bắt đầu lúc mấy giờ?", "12 giờ", ["11 giờ", "1 giờ", "2 giờ"]),
])
lesson("ug-l3", [
    H("위험", ["위", "위치", "이험"]), H("조심하세요", ["조용하세요", "주세요", "주의하세요"]),
    TX("기계를 고쳐요.", "Tôi sửa máy.", ["Tôi dừng máy.", "Tôi bật máy.", "Máy ở đây."]),
    F("상자를 ___.", "옮겨요", ["옮기요", "마셔요", "자요"], "Tôi chuyển thùng hàng."),
    NX("Hãy kiểm tra máy.", "기계를 확인하세요.", ["기계를 확인해요?", "기계가 확인하세요.", "기계를 고치세요."]),
    Y("Hãy dừng máy.", "기계를 멈추세요.", "기계를 멈춰 주세요."),
    W("Hãy mặc quần áo bảo hộ.", "작업복을|입으세요", ["작업복이", "입어세요"]),
    M("조심하다", "멈추다", "고치다", "옮기다", "확인하다"),
    # layers (session 3)
    RC("ug_menu", "Cơm trộn giá bao nhiêu?", "7.000 won", ["3.000 won", "4.000 won", "1.500 won"]), RC("ug_menu", "Món nào rẻ nhất?", "đồ uống", ["cơm cuộn", "mì", "cơm trộn"]),
    LC("ug_off", "Hôm nay mấy giờ tan làm?", "5 giờ", ["4 giờ", "6 giờ", "7 giờ"]),
])

# ---------------------------------------------------------------- uh: subway and bus
lesson("uh-l0", [
    T("지하철", ["버스", "기차", "택시"]), N("역", ["정류장", "출구", "입구"]),
    F("버스___ 타요.", "를", ["을", "에서", "가"], "Tôi đi xe buýt."),
    TX("다음 역은 시청입니다.", "Ga tiếp theo là Toà thị chính.", ["Ga này là Toà thị chính.", "Hãy xuống ở Toà thị chính.", "Toà thị chính ở bên trái."]),
    NX("Tôi đi tàu điện ngầm.", "지하철을 타요.", ["지하철을 내려요.", "지하철에서 타요.", "지하철이 타요."]),
    Y("Tôi đi tàu điện ngầm.", "지하철을 타요."),
    W("Tôi xuống ở ga tiếp theo.", "다음|역에서|내려요", ["역을", "타요"]),
    M("지하철", "버스", "역", "정류장", "표"),
    # layers (session 3)
    LC("uh_this_station", "Ga này là ga nào?", "Toà thị chính", ["bệnh viện", "Ansan", "sân bay"]), LC("uh_next_station", "Ga tiếp theo là ga nào?", "Ansan", ["Seoul", "Toà thị chính", "Busan"]),
    LC("uh_transfer", "Thông báo nói gì?", "đổi sang tuyến số 2", ["xuống ở ga số 2", "ra lối ra số 2", "đi xe buýt số 2"]),
])
lesson("uh-l1", [
    T("출구", ["입구", "비상구", "역"]), N("입구", ["출구", "정류장", "문"]),
    TX("3번 출구로 나가세요.", "Hãy ra lối ra số 3.", ["Hãy vào lối vào số 3.", "Hãy đổi tàu ở ga số 3.", "Lối ra số 3 ở đâu?"]),
    F("몇 번 출구___ 나가요?", "로", ["으로", "를", "이"], "Ra lối ra số mấy?"),
    NX("Lối ra số 1 ở đâu?", "1번 출구가 어디예요?", ["1번 입구가 어디예요?", "1번 출구를 어디예요?", "일 번 출구가 누구예요?"]),
    Y("Lối vào ở đâu?", "입구가 어디예요?", "입구가 어디에 있어요?", "입구 어디예요?"),
    W("Hãy ra lối ra số 2.", "2번|출구로|나가세요", ["입구로", "들어가세요"]),
    M("출구", "입구", "표", "교통카드"),
    # layers (session 3)
    RC("uh_exits", "Muốn đến trung tâm việc làm thì ra lối ra số mấy?", "số 3", ["số 1", "số 2", "số 4"]), RC("uh_exits", "Lối ra số 2 dẫn đến đâu?", "bệnh viện", ["Toà thị chính", "trung tâm việc làm", "nhà ga"]),
    LC("uh_exit3", "Phải ra lối ra số mấy?", "số 3", ["số 1", "số 2", "số 4"]),
])
lesson("uh-l2", [
    TX("다음 역에서 갈아타세요.", "Hãy đổi tàu ở ga tiếp theo.", ["Hãy xuống ở ga tiếp theo.", "Hãy lên tàu ở ga này.", "Ga tiếp theo là ga cuối."]),
    T("갈아타다", ["타다", "내리다", "걷다"]),
    F("다음 역에서 2호선으로 ___.", "갈아타요", ["갈아타아요", "먹어요", "자요"], "Ở ga tiếp theo tôi đổi sang tuyến số 2."),
    K("버스를 ___.", "타다", "haeyo:pre", "Tôi đi xe buýt."),
    NX("Tôi đi xe buýt số 10.", "10번 버스를 타요.", ["10번 버스를 내려요.", "열 번 버스를 타요.", "10번 버스가 타요."]),
    Y("Tôi xuống ở ga này.", "이 역에서 내려요."),
    W("Tôi đổi sang tuyến số 2.", "2호선으로|갈아타요", ["2호선을", "내려요"]),
    M("타다", "내리다", "갈아타다", "걷다"),
    # layers (session 3)
    LC("uh_bus_soon", "Xe buýt số mấy sắp đến?", "số 10", ["số 2", "số 3", "số 5"]), LC("uh_bus_cityhall", "Xe buýt này đi đâu?", "Toà thị chính", ["bệnh viện", "nhà ga", "chợ"]), D("uh_bus_cityhall"),
    LC("uh_next_stop", "Trạm tiếp theo là trạm nào?", "bệnh viện", ["Toà thị chính", "nhà ga", "ngân hàng"]),
])
lesson("uh-l3", [
    TX("이번 정류장은 시청입니다.", "Trạm này là Toà thị chính.", ["Trạm tiếp theo là Toà thị chính.", "Toà thị chính ở bên trái.", "Hãy xuống ở Toà thị chính."]),
    F("표를 ___.", "사요", ["싸요", "팔아요", "타요"], "Tôi mua vé."),
    K("버스에서 ___.", "서다", "haeyo:pre", "Tôi đứng trên xe buýt."),
    NX("Tôi dùng thẻ giao thông.", "교통카드를 써요.", ["교통카드가 써요.", "교통카드를 사요.", "교통카드를 쓰어요."]),
    Y("Trạm xe buýt ở đâu?", "정류장이 어디예요?", "정류장이 어디에 있어요?", "정류장 어디예요?", "버스 정류장이 어디예요?"),
    W("Ga ở gần.", "역이|가까워요", ["역을", "멀어요"]),
    M("정류장", "교통카드", "택시", "기차", "비행기"),
    # layers (session 3)
    RC("uh_bus", "Xe buýt số 10 xuất phát ở đâu?", "nhà ga", ["bệnh viện", "Toà thị chính", "trung tâm việc làm"]), RC("uh_bus", "Xe buýt chạy đến mấy giờ đêm?", "11 giờ", ["10 giờ", "12 giờ", "9 giờ"]),
    LC("uh_ten_minutes", "Bao lâu có một chuyến xe buýt?", "mười phút", ["năm phút", "mười lăm phút", "một tiếng"]),
])

# ---------------------------------------------------------------- ui: the convenience store
lesson("ui-l0", [
    T("편의점", ["가게", "마트", "시장"]), N("도시락", ["김밥", "라면", "과자"]),
    TX("봉투 필요하세요?", "Anh có cần túi không?", ["Anh có cần hoá đơn không?", "Anh trả bằng thẻ à?", "Túi bao nhiêu tiền?"]),
    F("라면 ___ 개 주세요.", "두", ["둘", "이", "이십"], "Cho tôi hai gói mì."),
    NX("Cho tôi một hộp cơm.", "도시락 하나 주세요.", ["도시락 한 주세요.", "도시락 일 주세요.", "도시락 하나 있어요."]),
    Y("Cho tôi hai gói mì.", "라면 두 개 주세요."),
    W("Tôi mua cơm cuộn.", "김밥을|사요", ["김밥이", "팔아요"]),
    M("편의점", "김밥", "도시락", "라면", "과자"),
    # layers (session 3)
    LC("ui_bag", "Khách trả lời thế nào?", "Vâng, cho tôi một cái túi.", ["Không, cảm ơn.", "Cho tôi hoá đơn.", "Tôi trả bằng thẻ."]),
    LC("ui_welcome", "Khách hỏi gì?", "có nước không", ["nước ở đâu", "nước bao nhiêu tiền", "có cà phê không"]),
    RC("ui_store", "Hộp cơm giá bao nhiêu?", "5.000 won", ["4.000 won", "3.000 won", "500 won"]), RC("ui_store", "Chị Hương có lấy túi không?", "có, một cái", ["không lấy", "có, hai cái", "chị không nói"]),
])
lesson("ui-l1", [
    T("영수증", ["봉투", "카드", "현금"]), N("카드", ["현금", "영수증", "돈"]),
    TX("카드로 계산할게요.", "Tôi sẽ trả bằng thẻ.", ["Tôi sẽ trả bằng tiền mặt.", "Cho tôi hoá đơn.", "Thẻ của tôi đâu?"]),
    F("현금___ 계산해요.", "으로", ["로", "을", "에서"], "Tôi trả bằng tiền mặt."),
    NX("Cho tôi hoá đơn.", "영수증 주세요.", ["영수증 있어요.", "봉투 주세요.", "영수증 계산해요."]),
    Y("Tôi trả bằng thẻ.", "카드로 계산해요.", "카드로 계산할게요."),
    W("Anh có cần túi không?", "봉투|필요하세요", ["봉투를", "주세요"]),
    M("영수증", "봉투", "카드", "현금"),
    # layers (session 3)
    LC("ui_card", "Khách trả tiền bằng gì?", "thẻ", ["tiền mặt", "điện thoại", "phiếu quà tặng"]), LC("ui_bento", "Cửa hàng có cơm hộp không?", "không có", ["có", "có nhiều", "có, ở đằng kia"]),
    RC("ui_msg_friend", "Chị ấy sẽ mua gì?", "nước và bánh kẹo", ["nước và cơm cuộn", "cà phê và bánh kẹo", "mì và nước"]), RC("ui_msg_friend", "Bây giờ chị ấy ở đâu?", "cửa hàng tiện lợi", ["siêu thị", "nhà", "chợ"]),
])
lesson("ui-l2", [
    TX("모두 삼천오백 원입니다.", "Tất cả ba nghìn năm trăm won.", ["Tất cả năm nghìn ba trăm won.", "Tất cả ba trăm năm mươi won.", "Tất cả ba mươi lăm nghìn won."]),
    F("물 한 병___ 천 원이에요.", "에", ["을", "이", "를"], "Một chai nước giá một nghìn won."),
    NX("Tất cả bao nhiêu tiền?", "모두 얼마예요?", ["모두 누구예요?", "모두 몇 시예요?", "모두 어디예요?"]),
    Y("Một nghìn hai trăm won.", "천이백 원이에요."),
    Y("Cho tôi hai chai nước.", "물 두 병 주세요."),
    H("이천 원", ["이만 원", "이백 원", "삼천 원"]),
    W("Năm nghìn won.", "오천|원이에요", ["다섯", "천이에요"]),
    M("천", "만", "백", "원", "현금"),
    # layers (session 3)
    RC("ui_receipt", "Tất cả bao nhiêu tiền?", "4.000 won", ["3.000 won", "1.000 won", "5.000 won"]), RC("ui_receipt", "Khách trả bằng gì?", "thẻ", ["tiền mặt", "điện thoại", "phiếu quà tặng"]),
    LC("ui_price", "Cái đó bao nhiêu tiền?", "3.000 won", ["300 won", "30.000 won", "3.500 won"]), LC("ui_ramen", "Khách mua mấy gói mì?", "hai", ["một", "ba", "bốn"]),
])
lesson("ui-l3", [
    TX("이거 계산해 주세요.", "Tính tiền cái này giúp tôi.", ["Cái này bao nhiêu tiền?", "Cho tôi cái này.", "Tôi đã trả tiền rồi."]),
    F("과자___ 음료수를 사요.", "하고", ["을", "에", "는"], "Tôi mua bánh kẹo và đồ uống."),
    NX("Tôi mua nước suối và cơm cuộn.", "생수하고 김밥을 사요.", ["생수하고 김밥이 사요.", "생수하고 김밥을 팔아요.", "생수를 김밥을 사요."]),
    Y("Tôi mua nước suối.", "생수를 사요."),
    K("편의점에서 김밥을 ___.", "사다", "haeyo:pre", "Tôi mua cơm cuộn ở cửa hàng tiện lợi."),
    W("Tôi mua bánh kẹo ở cửa hàng tiện lợi.", "편의점에서|과자를|사요", ["편의점에", "팔아요"]),
    M("생수", "과자", "음료수", "물건"),
    # layers (session 3)
    RC("ui_msg_late", "Vì sao chị Hương đến muộn?", "xe buýt không đến", ["chị bị ốm", "chị dậy muộn", "tàu điện bị trễ"]),
    RC("ui_msg_late", "Chị Hương đến muộn bao lâu?", "mười phút", ["năm phút", "mười lăm phút", "một tiếng"]),
])

# ---------------------------------------------------------------- uj: the dormitory
lesson("uj-l0", [
    T("기숙사", ["집", "방", "아파트"]), N("냉장고", ["세탁기", "침대", "에어컨"]),
    TX("기숙사에 세탁기가 있어요.", "Ký túc xá có máy giặt.", ["Ký túc xá không có máy giặt.", "Máy giặt ở trong phòng.", "Tôi giặt đồ ở ký túc xá."]),
    F("방에 에어컨___ 있어요.", "이", ["을", "가", "에서"], "Trong phòng có máy lạnh."),
    NX("Ký túc xá ở đâu?", "기숙사가 어디에 있어요?", ["기숙사를 어디에 있어요?", "기숙사가 어디에서 있어요?", "기숙사가 누구예요?"]),
    Y("Trong phòng có giường.", "방에 침대가 있어요."),
    W("Tủ lạnh ở trong bếp.", "냉장고는|부엌에|있어요", ["부엌에서", "냉장고를"]),
    M("기숙사", "냉장고", "세탁기", "침대", "열쇠"),
    # layers (session 3)
    RC("uj_rules", "Từ mấy giờ phải giữ yên lặng?", "10 giờ tối", ["9 giờ tối", "11 giờ tối", "8 giờ tối"]), RC("uj_rules", "Điều nào không được làm trong phòng?", "nấu ăn", ["ngủ", "học bài", "gọi điện"]),
    LC("uj_trash", "Đổ rác vào ngày nào?", "thứ Hai", ["thứ Ba", "thứ Năm", "Chủ nhật"]), D("uj_trash"),
    LC("uj_quiet", "Người nói dặn gì?", "từ 10 giờ tối hãy giữ yên lặng", ["từ 10 giờ tối hãy tắt đèn", "10 giờ tối hãy đổ rác", "từ 10 giờ tối không được tắm"]),
])
lesson("uj-l1", [
    C("rules-permission"),
    TX("밤에는 조용히 하세요.", "Ban đêm hãy giữ yên lặng.", ["Ban đêm hãy tắt đèn.", "Ban đêm không được ra ngoài.", "Ban ngày hãy dọn dẹp."]),
    F("쓰레기를 여기에 버리면 ___.", "안 돼요", ["돼요", "좋아요", "있어요"], "Không được vứt rác ở đây."),
    NX("Hãy tắt đèn.", "불을 끄세요.", ["불을 켜세요.", "불이 끄세요.", "불을 꺼요?"]),
    K("방에 들어가서 불을 ___.", "켜다", "haeyo:pre", "Tôi vào phòng rồi bật đèn."),
    Y("Hãy đóng cửa.", "문을 닫으세요.", "문을 닫아 주세요."),
    W("Tôi bật máy lạnh được không?", "에어컨을|켜도|돼요", ["에어컨이", "꺼도"]),
    M("문", "창문", "불", "에어컨", "쓰레기"),
    # layers (session 3)
    RC("uj_rent", "Tiền thuê nhà tháng này bao nhiêu?", "200.000 won", ["20.000 won", "2.000.000 won", "30.000 won"]), RC("uj_rent", "Phải gửi tiền thuê nhà trước ngày nào?", "ngày 25", ["ngày 20", "ngày 15", "ngày 30"]),
])
lesson("uj-l2", [
    T("조용하다", ["깨끗하다", "시끄럽다", "더럽다"]),
    F("방이 ___.", "깨끗해요", ["깨끗하요", "더러워요", "시끄러워요"], "Phòng sạch."),
    NX("Ký túc xá yên tĩnh.", "기숙사가 조용해요.", ["기숙사가 시끄러워요.", "기숙사를 조용해요.", "기숙사가 조용하요."]),
    TX("월세가 얼마예요?", "Tiền thuê nhà bao nhiêu?", ["Tiền điện bao nhiêu?", "Nhà ở đâu?", "Tháng này là tháng mấy?"]),
    Y("Phòng của tôi sạch.", "제 방은 깨끗해요."),
    W("Ký túc xá không có máy giặt.", "기숙사에|세탁기가|없어요", ["세탁기를", "있어요"]),
    H("시끄러워요", ["조용해요", "깨끗해요", "추워요"]),
    # layers (session 3)
    RC("uj_room", "Phòng ở tầng mấy?", "tầng 3", ["tầng 1", "tầng 2", "tầng 4"]), RC("uj_room", "Tủ lạnh ở đâu?", "trong bếp", ["trong phòng", "ở tầng 3", "ngoài hành lang"]),
    LC("uj_third_floor", "Phòng của người nói ở tầng mấy?", "tầng 3", ["tầng 1", "tầng 2", "tầng 4"]),
])
lesson("uj-l3", [
    TX("월요일에 쓰레기를 버려요.", "Thứ Hai đổ rác.", ["Thứ Hai dọn phòng.", "Thứ Hai không được đổ rác.", "Chủ nhật đổ rác."]),
    F("문을 ___.", "열어요", ["열아요", "닫아요", "켜요"], "Tôi mở cửa."),
    K("창문을 ___.", "열다", "haeyo:pre", "Tôi mở cửa sổ."),
    NX("Chìa khoá ở đâu?", "열쇠가 어디에 있어요?", ["열쇠가 어디에서 있어요?", "열쇠를 어디에 있어요?", "열쇠가 어디에 가요?"]),
    Y("Tôi dọn dẹp phòng.", "방을 청소해요."),
    W("Cuối tuần tôi giặt đồ.", "주말에|빨래해요", ["주말을", "청소"]),
    M("청소하다", "빨래하다", "버리다", "켜다", "끄다"),
    # layers (session 3)
    RC("uj_day", "Anh Nam làm việc ở đâu?", "nhà máy ở Ansan", ["nhà máy ở Seoul", "cửa hàng ở Ansan", "ký túc xá"]),
    RC("uj_day", "Buổi tối anh Nam làm gì?", "học tiếng Hàn", ["xem ti vi", "làm thêm", "gọi điện về nhà"]), RC("uj_weekend", "Chị Hương đã ăn gì?", "thịt bò xào bulgogi", ["cơm trộn", "kim chi", "mì"]),
    LC("uj_nam_ansan", "Anh Nam làm việc ở đâu?", "Ansan", ["Seoul", "Suwon", "Busan"]), LC("uj_seoul", "Cuối tuần chị Hương đã đi đâu?", "Seoul", ["Busan", "Ansan", "Suwon"]),
])
finish("s3")

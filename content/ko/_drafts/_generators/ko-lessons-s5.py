"""ko-vi Section 5 lessons (write): about yourself (unit o), simple sentences with 안 / 못 and linking words (p), messages
to the team leader (q), papers at the employment centre (r). Typed Hangul carries the production here; session 2 writes
the lesson-internal exercise types, and the guided-writing and form tasks join these lessons in session 3.
Writes lessons/parts/s5.jsonl. usage: python -I ko-lessons-s5.py <repo root>"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ko_lesson_lib import C, F, K, M, N, NX, T, TX, W, Y, finish, lesson

# ---------------------------------------------------------------- uo: about yourself
lesson("uo-l0", [
    C("small-particles"),
    T("주소", ["생일", "이름", "나이"]), N("생일", ["주소", "나이", "이름"]),
    F("저는 안산에 ___.", "살아요", ["사세요", "사요", "살요"], "Tôi sống ở Ansan."),
    K("저는 수원에 ___.", "살다", "haeyo:pre", "Tôi sống ở Suwon."),
    NX("Sinh nhật tôi là ngày 5 tháng 3.", "제 생일은 삼월 오일이에요.", ["제 생일은 삼월 다섯 일이에요.", "제 생일은 오월 삼일이에요.", "제 생일을 삼월 오일이에요."]),
    Y("Tôi sống ở Ansan.", "저는 안산에 살아요.", "저는 안산에서 살아요."),
    W("Địa chỉ của tôi là Ansan.", "제|주소는|안산이에요", ["주소를", "안산예요"]),
    M("주소", "생일", "영어", "베트남어"),
])
lesson("uo-l1", [
    TX("저는 베트남어하고 영어를 해요.", "Tôi nói tiếng Việt và tiếng Anh.", ["Tôi học tiếng Việt và tiếng Anh.", "Tôi nói tiếng Hàn và tiếng Anh.", "Tôi không nói tiếng Anh."]),
    F("저는 영어___ 조금 해요.", "를", ["을", "가", "에"], "Tôi nói được một chút tiếng Anh."),
    NX("Chúng tôi là người Việt Nam.", "저희는 베트남 사람이에요.", ["저희를 베트남 사람이에요.", "저희는 베트남 사람예요.", "저는 베트남 사람이에요."]),
    Y("Tôi là người Việt Nam. Tôi hai mươi lăm tuổi.", "저는 베트남 사람이에요. 스물다섯 살이에요."),
    W("Tôi ba mươi tuổi.", "저는|서른|살이에요", ["삼십", "서른살"]),
    M("우리", "저희", "제", "저"),
])
lesson("uo-l2", [
    Y("Gõ bằng tiếng Hàn: địa chỉ", "주소"),
    Y("Gõ bằng tiếng Hàn: sinh nhật", "생일"),
    Y("Tôi sống ở Hàn Quốc.", "저는 한국에 살아요.", "저는 한국에서 살아요."),
    TX("어디에 살아요?", "Bạn sống ở đâu?", ["Bạn đi đâu?", "Bạn làm việc ở đâu?", "Nhà bạn có to không?"]),
    F("부모님은 하노이___ 사세요.", "에", ["을", "가", "는"], "Bố mẹ tôi sống ở Hà Nội."),
    W("Tôi sống cùng bạn.", "친구하고|같이|살아요", ["친구를", "사요"]),
    M("살다", "사다", "쓰다", "읽다"),
])
lesson("uo-l3", [
    T("이름", ["주소", "생일", "나이"]),
    NX("Trên tờ khai, ô \"Địa chỉ\" ghi bằng tiếng Hàn là:", "주소", ["주말", "주스", "주세요"]),
    NX("Ô \"Số điện thoại\" trên tờ khai:", "전화번호", ["주소", "이름", "생일"]),
    Y("Gõ bằng tiếng Hàn: số điện thoại", "전화번호"),
    TX("이름을 쓰세요.", "Hãy viết tên.", ["Hãy đọc tên.", "Tên bạn là gì?", "Tôi viết tên."]),
    K("여기에 주소를 ___.", "쓰다", "hon:pre", "Hãy viết địa chỉ vào đây."),
    W("Hãy viết số điện thoại.", "전화번호를|쓰세요", ["전화번호가", "읽으세요"]),
    M("이름", "주소", "생일", "전화번호"),
])

# ---------------------------------------------------------------- up: simple sentences, 안 / 못, linking words
lesson("up-l0", [
    C("negation-an-mot"),
    T("안", ["못", "또", "잘"]),
    F("저는 술을 ___ 마셔요.", "안", ["못", "잘", "또"], "Tôi không uống rượu."),
    F("오늘은 바빠서 ___ 가요.", "못", ["안", "잘", "또"], "Hôm nay tôi bận nên không đi được."),
    NX("Tôi không ăn thịt.", "고기를 안 먹어요.", ["고기를 못 먹어요.", "고기를 안 먹었어요.", "안 고기를 먹어요."]),
    Y("Tôi không uống cà phê.", "커피를 안 마셔요."),
    Y("Tôi không ăn được đồ cay.", "매운 음식을 못 먹어요.", "매운 음식은 못 먹어요."),
    W("Hôm nay tôi không làm việc.", "오늘은|일|안|해요", ["못", "일해요"]),
    M("안", "못", "자주", "가끔", "항상"),
])
lesson("up-l1", [
    C("connectors"),
    T("그리고", ["그래서", "하지만", "그런데"]), N("하지만", ["그리고", "그래서", "또"]),
    F("비가 와요. ___ 집에 있어요.", "그래서", ["그리고", "하지만", "그런데"], "Trời mưa. Vì vậy tôi ở nhà."),
    F("한국어는 어려워요. ___ 재미있어요.", "하지만", ["그래서", "그리고", "또"], "Tiếng Hàn khó. Nhưng thú vị."),
    NX("Tôi ăn cơm rồi uống cà phê.", "밥을 먹고 커피를 마셔요.", ["밥을 먹지만 커피를 마셔요.", "밥을 먹고 커피를 사요.", "밥을 먹어서 커피를 마셔요."]),
    Y("Tiếng Hàn khó nhưng thú vị.", "한국어는 어렵지만 재미있어요.", "한국어는 어려워요. 하지만 재미있어요.", "한국어는 어려워요. 그런데 재미있어요."),
    W("Trời lạnh. Vì vậy tôi mặc áo ấm.", "추워요.|그래서|따뜻한|옷을|입어요", ["하지만", "옷이"]),
    M("그리고", "그래서", "하지만", "그런데"),
])
lesson("up-l2", [
    TX("저는 고기를 먹지 않아요.", "Tôi không ăn thịt.", ["Tôi không ăn được thịt.", "Tôi đã ăn thịt.", "Tôi thích thịt."]),
    F("주말에는 일하지 ___.", "않아요", ["안 해요", "못해요", "없어요"], "Cuối tuần tôi không làm việc."),
    NX("Hôm qua tôi không ngủ được.", "어제 못 잤어요.", ["어제 안 잤어요.", "어제 못 자요.", "내일 못 잤어요."]),
    Y("Tôi không xem ti vi.", "텔레비전을 안 봐요."),
    K("그 사람을 ___.", "모르다", "haeyo:pre", "Tôi không biết người đó."),
    W("Tôi không biết rõ lắm.", "잘|몰라요", ["안", "알아요"]),
    M("하지만", "그래서", "자주", "가끔"),
])
lesson("up-l3", [
    C("past"),
    TX("어제는 바빴어요. 그래서 운동을 못 했어요.", "Hôm qua tôi bận. Vì vậy tôi không tập thể dục được.", ["Hôm qua tôi bận nhưng vẫn tập thể dục.", "Hôm qua tôi rảnh nên đã tập thể dục.", "Hôm nay tôi bận nên sẽ không tập."]),
    F("저는 항상 일곱 시에 ___.", "일어나요", ["일어나아요", "일어날까요", "일어나세요"], "Tôi luôn dậy lúc bảy giờ."),
    NX("Thỉnh thoảng tôi đi chợ.", "가끔 시장에 가요.", ["자주 시장에 가요.", "가끔 시장에서 가요.", "가끔 시장에 와요."]),
    Y("Tôi thường xuyên gọi điện cho mẹ.", "자주 어머니에게 전화해요.", "어머니에게 자주 전화해요."),
    W("Hôm qua tôi đã dọn dẹp và giặt đồ.", "어제|청소하고|빨래했어요", ["청소해요", "빨래하고"]),
    M("항상", "자주", "가끔", "또"),
])

# ---------------------------------------------------------------- uq: messages to the team leader
lesson("uq-l0", [
    C("speech-levels"),
    T("문자", ["전화", "휴가", "병원"]), N("휴가", ["휴식", "출근", "문자"]),
    TX("반장님, 오늘 몸이 아파요.", "Tổ trưởng ơi, hôm nay tôi bị ốm.", ["Tổ trưởng ơi, hôm nay tôi nghỉ phép.", "Tổ trưởng ơi, hôm nay tôi đến muộn.", "Tổ trưởng ơi, anh có ốm không?"]),
    F("반장님께 문자를 ___.", "보내요", ["받아요", "읽어요", "보내다"], "Tôi gửi tin nhắn cho tổ trưởng."),
    NX("Nhắn cho tổ trưởng: \"Hôm nay tôi bị cảm.\"", "반장님, 오늘 감기에 걸렸어요.", ["반장님, 오늘 감기를 걸렸어요.", "반장님, 오늘 감기에 걸려요?", "반장님, 오늘 휴가에 걸렸어요."]),
    Y("Xin lỗi. Hôm nay tôi đến muộn.", "죄송합니다. 오늘 늦어요.", "죄송합니다. 오늘 늦을 거예요."),
    W("Tổ trưởng ơi, tôi bị cảm.", "반장님|감기에|걸렸어요", ["감기를", "걸려요"]),
    M("문자", "휴가", "감기", "병원"),
])
lesson("uq-l1", [
    TX("내일 아침에 병원에 가요.", "Sáng mai tôi đi bệnh viện.", ["Sáng nay tôi đã đi bệnh viện.", "Tối mai tôi đi bệnh viện.", "Bệnh viện mở cửa buổi sáng."]),
    F("오후 두 시___ 갈게요.", "까지", ["부터", "에서", "을"], "Tôi sẽ đến trước hai giờ chiều."),
    NX("Tôi nghỉ phép từ thứ Hai đến thứ Tư.", "월요일부터 수요일까지 휴가예요.", ["월요일까지 수요일부터 휴가예요.", "월요일부터 수요일까지 휴가이에요.", "월요일에서 수요일에 휴가예요."]),
    Y("Ngày mai tôi nghỉ phép.", "내일 휴가예요."),
    K("반장님은 아마 내일 전화를 ___.", "하다", "haeyo:fut", "Có lẽ mai tổ trưởng sẽ gọi điện."),
    W("Tôi sẽ đến lúc ba giờ.", "세|시에|갈게요", ["삼", "갔어요"]),
    M("오전", "오후", "내일", "다음 주"),
])
lesson("uq-l2", [
    C("future"),
    TX("제가 다시 전화할게요.", "Tôi sẽ gọi lại.", ["Anh gọi lại cho tôi nhé.", "Tôi đã gọi lại rồi.", "Tôi không gọi được."]),
    F("내일 일찍 ___.", "올게요", ["왔어요", "올까요", "와야"], "Mai tôi sẽ đến sớm."),
    NX("Tôi sẽ gửi tin nhắn.", "문자를 보낼게요.", ["문자를 보냈어요.", "문자를 받을게요.", "문자가 보낼게요."]),
    Y("Tôi sẽ gọi điện.", "전화할게요.", "전화할 거예요.", "제가 전화할게요."),
    W("Xin lỗi. Tôi sẽ cẩn thận.", "죄송합니다|조심할게요", ["조심했어요", "괜찮아요"]),
    M("보내다", "받다", "전화하다", "기다리다"),
])
lesson("uq-l3", [
    TX("민수 씨, 문자 받았어요?", "Anh Min-su, anh nhận được tin nhắn chưa?", ["Anh Min-su, anh gửi tin nhắn chưa?", "Anh Min-su, anh có điện thoại không?", "Anh Min-su, gọi cho tôi nhé."]),
    F("어제 병원에 ___.", "갔어요", ["가요", "갈 거예요", "가었어요"], "Hôm qua tôi đã đi bệnh viện."),
    K("어제 동료를 한 시간 ___.", "기다리다", "haeyo:pas", "Hôm qua tôi đã đợi đồng nghiệp một tiếng."),
    NX("Tổ trưởng hỏi bạn: \"Bạn có sao không?\"", "괜찮아요?", ["괜찮았어요?", "괜찮을게요.", "안녕하세요?"]),
    Y("Hôm qua tôi đã đi bệnh viện.", "어제 병원에 갔어요."),
    W("Tôi đã gửi tin nhắn cho tổ trưởng.", "반장님에게|문자를|보냈어요", ["반장님을", "보낼게요"]),
    M("아프다", "감기", "약", "병원"),
])

# ---------------------------------------------------------------- ur: papers at the employment centre
lesson("ur-l0", [
    T("여권", ["서류", "사진", "계약서"]), N("서류", ["여권", "계약서", "사진"]),
    TX("외국인 등록증이 있어요?", "Bạn có thẻ đăng ký người nước ngoài không?", ["Bạn có hộ chiếu không?", "Bạn là người nước ngoài à?", "Thẻ đăng ký ở đâu?"]),
    F("여권___ 있어요?", "이", ["을", "가", "에"], "Bạn có hộ chiếu không?"),
    NX("Tôi đến trung tâm việc làm.", "고용센터에 가요.", ["고용센터에서 가요.", "고용센터를 몰라요.", "은행에 가요."]),
    Y("Đây là hộ chiếu của tôi.", "제 여권이에요.", "이거 제 여권이에요.", "이것은 제 여권이에요."),
    W("Hãy mang hồ sơ đến.", "서류를|가져오세요", ["서류가", "가져가세요"]),
    M("고용센터", "여권", "서류", "계약서", "사진"),
])
lesson("ur-l1", [
    TX("월급이 얼마예요?", "Lương tháng bao nhiêu?", ["Lương tháng trả khi nào?", "Tiền thuê nhà bao nhiêu?", "Hợp đồng bao lâu?"]),
    F("월급은 이백만 ___이에요.", "원", ["명", "살", "개"], "Lương tháng hai triệu won."),
    NX("Ngày sinh: ngày 10 tháng 5 năm 1998.", "천구백구십팔 년 오월 십일", ["천구백구십팔 년 십월 오일", "천구백팔십구 년 오월 십일", "천구백구십팔 년 오월 열 일"]),
    Y("Hai triệu won.", "이백만 원이에요."),
    W("Sinh nhật tôi là ngày 10 tháng 5.", "제|생일은|오월|십일이에요", ["다섯", "열"]),
    M("월급", "은행", "돈", "통장"),
])
lesson("ur-l2", [
    TX("은행에서 통장을 만들어요.", "Tôi mở sổ tài khoản ở ngân hàng.", ["Tôi rút tiền ở ngân hàng.", "Tôi làm việc ở ngân hàng.", "Ngân hàng ở đâu?"]),
    F("사진 두 ___ 필요해요.", "장", ["개", "명", "권"], "Cần hai tấm ảnh."),
    NX("Cần mấy tấm ảnh?", "사진이 몇 장 필요해요?", ["사진이 몇 명 필요해요?", "사진을 몇 장 필요해요?", "사진이 몇 시 필요해요?"]),
    Y("Cần hai tấm ảnh.", "사진 두 장이 필요해요.", "사진이 두 장 필요해요.", "사진 두 장 필요해요."),
    K("여기에 이름을 ___.", "쓰다", "hon:pre", "Hãy viết tên vào đây."),
    W("Hãy đọc hợp đồng.", "계약서를|읽으세요", ["계약서가", "쓰세요"]),
    M("사진", "통장", "은행", "계좌"),
])
lesson("ur-l3", [
    TX("외국인 등록증을 잃어버렸어요.", "Tôi làm mất thẻ đăng ký người nước ngoài.", ["Tôi quên thẻ đăng ký người nước ngoài.", "Tôi có thẻ đăng ký người nước ngoài.", "Tôi muốn làm thẻ đăng ký người nước ngoài."]),
    F("고용센터는 몇 시___ 문을 열어요?", "에", ["을", "가", "를"], "Trung tâm việc làm mở cửa lúc mấy giờ?"),
    NX("Tôi cần giấy tờ gì?", "무슨 서류가 필요해요?", ["무슨 서류를 필요해요?", "누구 서류가 필요해요?", "무슨 서류가 있었어요?"]),
    Y("Tôi làm mất hộ chiếu.", "여권을 잃어버렸어요."),
    W("Trung tâm việc làm ở đâu?", "고용센터가|어디에|있어요", ["고용센터를", "누구"]),
    M("서류", "신청서", "계약서", "여권"),
])
finish("s5")

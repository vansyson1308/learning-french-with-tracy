"""ko-vi Section 2 lessons (building blocks): 이에요 and the topic particle (unit a), 해요 verbs with 을/를 and 에서 (b),
있어요/없어요 and adjectives with 이/가 and 에 (c), time, native numbers and counters (d), the script and its sounds,
받침, Hán-Việt and loanwords (e). Every lesson shows a concept card. Particle fill-ins take the slot of the blueprint's
article exercise; 해요 forms are drilled as fill-ins and as conjugationCloze items (K) whose keys are the paradigm cells
of ko_paradigms.py, evidenced by the kaikki rows. Hangul typing (Y) starts here. Writes lessons/parts/s2.jsonl.
usage: python -I ko-lessons-s2.py <repo root>"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ko_lesson_lib import C, F, H, K, M, N, NX, T, TX, W, Y, finish, lesson

# ---------------------------------------------------------------- ua: 이에요 and 은/는
lesson("ua-l0", [
    C("topic-eun-neun"),
    F("이거___ 제 가방이에요.", "는", ["은", "를", "을"], "Đây là túi của tôi."),
    F("선생님___ 한국 사람이에요.", "은", ["는", "을", "를"], "Cô giáo là người Hàn Quốc."),
    F("친구는 학생___.", "이에요", ["예요", "을", "는"], "Bạn tôi là học sinh."),
    T("친구", ["선생님", "학생", "사람"]), N("선생님", ["친구", "학생", "회사원"]),
    NX("Đây là bạn tôi.", "제 친구예요.", ["제 친구이에요.", "제 친구는요.", "저 친구예요."]),
    Y("Tôi là học sinh.", "저는 학생이에요."),
    W("Bạn tôi là người Việt Nam.", "제|친구는|베트남|사람이에요", ["친구를", "사람예요"]),
    M("친구", "선생님", "이거", "그거", "저거"),
])
lesson("ua-l1", [
    C("question-words"),
    T("누구", ["무엇", "어디", "언제"]), N("무엇", ["누구", "어디", "얼마"]),
    F("저 사람은 ___예요?", "누구", ["무엇", "얼마", "언제"], "Người kia là ai?"),
    F("이거 ___예요?", "뭐", ["누구", "어디", "얼마"], "Cái này là cái gì?"),
    TX("저 사람은 누구예요?", "Người kia là ai?", ["Người này là ai?", "Người kia ở đâu?", "Người kia là bạn tôi."]),
    NX("Đó là cái gì?", "그거 뭐예요?", ["그거 누구예요?", "그거 얼마예요?", "이거 뭐예요?"]),
    Y("Người kia là ai?", "저 사람은 누구예요?"),
    W("Tên bạn là gì?", "이름이|뭐예요", ["이름을", "누구예요"]),
    M("누구", "무엇", "뭐", "어디"),
])
lesson("ua-l2", [
    C("copula"),
    T("아니에요", ["아니요", "맞아요", "괜찮아요"]),
    F("저는 선생님이 ___.", "아니에요", ["아니요", "이에요", "예요"], "Tôi không phải là giáo viên."),
    F("이거는 제 가방___ 아니에요.", "이", ["가", "을", "는"], "Đây không phải là túi của tôi."),
    F("저는 의사___ 아니에요.", "가", ["이", "를", "은"], "Tôi không phải là bác sĩ."),
    NX("Người đó không phải là người Hàn Quốc.", "그 사람은 한국 사람이 아니에요.", ["그 사람은 한국 사람이 아니요.", "그 사람은 한국 사람이에요.", "그 사람은 한국 사람을 아니에요."]),
    Y("Tôi không phải là học sinh.", "저는 학생이 아니에요."),
    TX("아니요, 회사원이 아니에요.", "Không, tôi không phải là nhân viên công ty.", ["Vâng, tôi là nhân viên công ty.", "Không, tôi là nhân viên công ty.", "Tôi không có công ty."]),
    W("Đây không phải là cà phê.", "이거는|커피가|아니에요", ["커피이", "아니요"]),
])
lesson("ua-l3", [
    C("speech-levels"),
    TX("저는 응우옌 남입니다.", "Tôi là Nguyễn Nam.", ["Tôi tên là Min-su.", "Anh là Nguyễn Nam à?", "Tôi không phải là Nam."]),
    NX("Ở buổi phỏng vấn, bạn nói trang trọng: \"Tôi là người Việt Nam.\"", "저는 베트남 사람입니다.", ["저는 베트남 사람예요.", "나는 베트남 사람이야.", "저는 베트남 사람입니까?"]),
    F("처음 뵙겠습니다. 저는 김민수___.", "입니다", ["입니까", "아니요", "을"], "Rất hân hạnh. Tôi là Kim Min-su."),
    Y("Tôi là nhân viên công ty. (kiểu trang trọng)", "저는 회사원입니다."),
    W("Rất hân hạnh. Tôi là Lan.", "처음 뵙겠습니다|저는|란입니다", ["란이야", "저를"]),
    TX("안녕하세요. 저는 흐엉이에요.", "Xin chào. Tôi là Hương.", ["Tạm biệt. Tôi là Hương.", "Xin chào chị Hương.", "Xin chào. Tôi không phải là Hương."]),
    H("처음 뵙겠습니다", ["잘 부탁드립니다", "안녕히 계세요", "수고하셨습니다"]),
    N("입니다", ["아니에요", "주세요", "괜찮아요"]),
])

# ---------------------------------------------------------------- ub: 해요 verbs
lesson("ub-l0", [
    C("haeyo-present"),
    T("가다", ["오다", "보다", "자다"]), N("오다", ["가다", "하다", "만나다"]),
    F("회사에 ___.", "가요", ["가어요", "와요", "봐요"], "Tôi đi đến công ty."),
    F("텔레비전을 ___.", "봐요", ["보요", "가요", "자요"], "Tôi xem ti vi."),
    K("주말에 영화를 ___.", "보다", "haeyo:pre", "Cuối tuần tôi xem phim."),
    NX("Tôi ngủ.", "자요.", ["가요.", "와요.", "봐요."]),
    Y("Tôi đi đến công ty.", "회사에 가요."),
    W("Ngày mai tôi gặp bạn.", "내일|친구를|만나요", ["친구가", "와요"]),
    M("가다", "오다", "보다", "자다", "만나다"),
])
lesson("ub-l1", [
    C("e-eseo"),
    T("일하다", ["공부하다", "만나다", "자다"]),
    F("공장___ 일해요.", "에서", ["에", "을", "는"], "Tôi làm việc ở nhà máy."),
    F("학교에서 한국어를 ___.", "공부해요", ["공부하요", "일해요", "가요"], "Tôi học tiếng Hàn ở trường."),
    K("저녁에 운동을 ___.", "하다", "haeyo:pre", "Buổi tối tôi tập thể dục."),
    NX("Tôi học tiếng Hàn ở nhà.", "집에서 한국어를 공부해요.", ["집에 한국어를 공부해요.", "집에서 한국어가 공부해요.", "집에서 한국어를 일해요."]),
    Y("Tôi làm việc ở nhà máy.", "공장에서 일해요."),
    W("Anh Min-su học ở thư viện.", "민수 씨는|도서관에서|공부해요", ["도서관에", "일해요"]),
    M("일하다", "공부하다", "운동하다", "요리하다"),
])
lesson("ub-l2", [
    C("object-eul-reul"),
    F("친구___ 만나요.", "를", ["을", "가", "에"], "Tôi gặp bạn."),
    F("커피___ 마셔요.", "를", ["을", "이", "에서"], "Tôi uống cà phê."),
    F("빵___ 먹어요.", "을", ["를", "에", "가"], "Tôi ăn bánh mì."),
    K("매일 회사에 ___.", "가다", "haeyo:pre", "Ngày nào tôi cũng đi làm."),
    NX("Tôi xem phim ở rạp.", "영화관에서 영화를 봐요.", ["영화관에 영화를 봐요.", "영화관에서 영화가 봐요.", "영화관에서 영화를 와요."]),
    Y("Tôi gặp bạn.", "친구를 만나요."),
    W("Tôi xem ti vi ở nhà.", "집에서|텔레비전을|봐요", ["집에", "텔레비전이"]),
    TX("식당에서 밥을 먹어요.", "Tôi ăn cơm ở quán.", ["Tôi đi đến quán ăn.", "Tôi nấu cơm ở nhà.", "Quán ăn ở đâu?"]),
])
lesson("ub-l3", [
    C("irregular-stems"),
    T("듣다", ["읽다", "쓰다", "말하다"]),
    F("음악을 ___.", "들어요", ["듣어요", "봐요", "자요"], "Tôi nghe nhạc."),
    F("이름을 ___.", "써요", ["쓰어요", "읽어요", "들어요"], "Tôi viết tên."),
    K("한국어를 잘 ___.", "모르다", "haeyo:pre", "Tôi không biết tiếng Hàn lắm."),
    K("여기에 이름을 ___.", "쓰다", "haeyo:pre", "Tôi viết tên vào đây."),
    Y("Tôi nghe nhạc.", "음악을 들어요."),
    Y("Tôi uống nước.", "물을 마셔요."),
    W("Tôi đọc sách.", "책을|읽어요", ["책이", "들어요"]),
    M("듣다", "읽다", "쓰다", "모르다", "배우다"),
])

# ---------------------------------------------------------------- uc: 있어요/없어요 and adjectives
lesson("uc-l0", [
    C("itda-eopda"),
    T("있다", ["없다", "좋다", "많다"]),
    F("시간___ 있어요.", "이", ["을", "에", "를"], "Tôi có thời gian."),
    F("화장실이 저기___ 있어요.", "에", ["에서", "를", "가"], "Nhà vệ sinh ở đằng kia."),
    F("오늘은 시간이 ___.", "없어요", ["있어요", "아니에요", "가요"], "Hôm nay tôi không có thời gian."),
    NX("Ở đây có nhà vệ sinh không?", "여기에 화장실이 있어요?", ["여기에서 화장실이 있어요?", "여기에 화장실을 있어요?", "여기에 화장실이 가요?"]),
    Y("Tôi không có tiền.", "돈이 없어요."),
    W("Trong phòng có giường.", "방에|침대가|있어요", ["방에서", "침대를"]),
    M("여기", "거기", "저기", "화장실", "방"),
])
lesson("uc-l1", [
    C("demonstratives"),
    T("여기", ["거기", "저기", "어디"]), N("저기", ["여기", "거기", "집"]),
    F("가방이 의자 ___에 있어요.", "위", ["옆", "뒤", "앞"], "Cái túi ở trên ghế."),
    TX("집이 어디예요?", "Nhà bạn ở đâu?", ["Nhà bạn có to không?", "Đây là nhà ai?", "Bạn có nhà không?"]),
    NX("Nhà tôi ở Ansan.", "집은 안산에 있어요.", ["집은 안산에서 있어요.", "집을 안산에 있어요.", "집은 안산에 없어요."]),
    Y("Nhà vệ sinh ở đâu?", "화장실이 어디에 있어요?", "화장실이 어디예요?", "화장실 어디예요?", "화장실이 어디 있어요?"),
    W("Ở đó có ghế.", "거기에|의자가|있어요", ["거기에서", "의자를"]),
    M("집", "방", "부엌", "문", "창문"),
])
lesson("uc-l2", [
    C("adjectives"),
    T("크다", ["작다", "많다", "좋다"]), N("작다", ["크다", "적다", "좋다"]),
    F("방이 ___.", "작아요", ["작어요", "작이에요", "많이"], "Phòng nhỏ."),
    F("이 집은 아주 ___.", "커요", ["크어요", "큰", "많아요"], "Căn nhà này rất to."),
    NX("Ở công ty có nhiều người.", "회사에 사람이 많아요.", ["회사에 사람을 많아요.", "회사에서 사람이 많이.", "회사에 사람이 작아요."]),
    Y("Căn phòng to.", "방이 커요."),
    W("Đây là một căn phòng nhỏ.", "작은|방이에요", ["작아요", "큰"]),
    M("크다", "작다", "좋다", "많다", "적다"),
])
lesson("uc-l3", [
    C("subject-i-ga"),
    F("머리___ 아파요.", "가", ["를", "을", "이"], "Tôi đau đầu."),
    F("여기에 물___ 있어요.", "이", ["가", "를", "을"], "Ở đây có nước."),
    F("고양이___ 있어요.", "가", ["이", "를", "을"], "Có một con mèo."),
    TX("누가 와요?", "Ai đến vậy?", ["Ai đấy?", "Bạn đến à?", "Ai đi vậy?"]),
    NX("Tôi có bạn người Hàn.", "한국 친구가 있어요.", ["한국 친구를 있어요.", "한국 친구가 없어요.", "한국 친구이 있어요."]),
    Y("Có chìa khoá không?", "열쇠가 있어요?"),
    Y("Tôi đau bụng.", "배가 아파요."),
    W("Ở đây có nhiều cửa hàng.", "여기에|가게가|많아요", ["가게를", "작아요"]),
])

# ---------------------------------------------------------------- ud: time, native numbers, counters
lesson("ud-l0", [
    C("native-numbers"),
    T("하나", ["둘", "셋", "다섯"]), N("셋", ["하나", "둘", "열"]),
    F("사과 ___ 개 주세요.", "두", ["둘", "이", "하나"], "Cho tôi hai quả táo."),
    F("직원이 ___ 명 있어요.", "세", ["셋", "삼", "네"], "Có ba nhân viên."),
    NX("Tôi hai mươi tuổi.", "저는 스무 살이에요.", ["저는 스물 살이에요.", "저는 이십 살이에요.", "저는 스무 시예요."]),
    Y("Cho tôi hai quả táo.", "사과 두 개 주세요."),
    W("Gia đình tôi có bốn người.", "우리|가족은|네|명이에요", ["넷", "사"]),
    M("하나", "둘", "셋", "넷", "다섯"),
])
lesson("ud-l1", [
    C("time-dates"),
    T("시", ["분", "살", "명"]),
    F("지금 ___ 시예요.", "세", ["셋", "삼", "네"], "Bây giờ là ba giờ."),
    F("세 시 ___ 분이에요.", "십", ["열", "하나", "한"], "Ba giờ mười phút."),
    TX("몇 시예요?", "Mấy giờ rồi?", ["Bao nhiêu tiền?", "Bạn bao nhiêu tuổi?", "Có mấy người?"]),
    NX("Ba giờ rưỡi.", "세 시 반이에요.", ["삼 시 반이에요.", "세 시 반 분이에요.", "셋 시 반이에요."]),
    Y("Bây giờ là bảy giờ.", "지금 일곱 시예요."),
    W("Tôi dậy lúc sáu giờ.", "여섯|시에|일어나요", ["육", "시를"]),
    M("시", "분", "반", "오전", "오후"),
])
lesson("ud-l2", [
    C("sino-numbers"),
    T("오늘", ["내일", "어제", "지금"]), N("내일", ["오늘", "어제", "주말"]), T("월요일", ["화요일", "수요일", "일요일"]),
    F("월요일___ 회의가 있어요.", "에", ["에서", "을", "는"], "Thứ Hai có cuộc họp."),
    F("내일___ 일해요.", "도", ["에", "을", "를"], "Ngày mai tôi cũng làm việc."),
    NX("Hôm nay là thứ Sáu.", "오늘은 금요일이에요.", ["오늘에 금요일이에요.", "오늘은 금요일예요.", "내일은 금요일이에요."]),
    Y("Ngày mai tôi nghỉ.", "내일 쉬어요."),
    W("Chủ nhật tôi gặp bạn.", "일요일에|친구를|만나요", ["일요일을", "친구가"]),
    M("월요일", "화요일", "수요일", "목요일", "금요일"),
])
lesson("ud-l3", [
    C("homographs"),
    TX("개가 두 마리 있어요.", "Có hai con chó.", ["Có hai cái.", "Có hai người.", "Có hai con mèo."]),
    F("사과 세 ___ 주세요.", "개", ["명", "살", "시"], "Cho tôi ba quả táo."),
    F("학생이 다섯 ___ 있어요.", "명", ["개", "살", "병"], "Có năm học sinh."),
    NX("Bốn người.", "네 명이에요.", ["넷 명이에요.", "사 명이에요.", "네 개예요."]),
    Y("Cho tôi một chai nước.", "물 한 병 주세요."),
    Y("Tôi ba mươi tuổi.", "저는 서른 살이에요."),
    W("Có ba con mèo.", "고양이가|세|마리|있어요", ["셋", "명"]),
    M("명", "살", "개", "병", "마리"),
])

# ---------------------------------------------------------------- ue: script and sounds
lesson("ue-l0", [
    C("batchim"),
    T("꽃", ["옷", "값", "가방"]), N("옷", ["꽃", "값", "가방"]),
    H("값", ["갑", "강", "감"]), H("옷", ["오", "온", "옥"]),
    TX("옷이 예뻐요.", "Quần áo đẹp.", ["Hoa đẹp.", "Túi đắt.", "Quần áo rẻ."]),
    Y("Gõ bằng tiếng Hàn: hoa", "꽃"),
    Y("Gõ bằng tiếng Hàn: giá", "값"),
    W("Tôi đọc sách tiếng Hàn.", "한국어|책을|읽어요", ["책이", "앉아요"]),
    M("꽃", "옷", "값", "가방", "학교"),
])
lesson("ue-l1", [
    C("consonant-series"),
    H("딸", ["달", "탈", "땀"]), H("불", ["뿔", "풀", "부"]),
    T("앉다", ["읽다", "서다", "가다"]),
    F("의자에 ___.", "앉아요", ["앉어요", "읽어요", "서요"], "Tôi ngồi xuống ghế."),
    Y("Tôi đọc sách.", "책을 읽어요."),
    Y("Tôi ngồi ở đây.", "여기에 앉아요.", "여기 앉아요."),
    NX("Con gái tôi đọc sách.", "우리 딸은 책을 읽어요.", ["우리 달은 책을 읽어요.", "우리 딸은 책을 앉아요.", "우리 딸은 책이 읽어요."]),
    M("딸", "달", "코", "불"),
])
lesson("ue-l2", [
    C("hanviet-loanwords"),
    T("학교", ["시간", "전화", "가족"]), T("전화", ["학교", "시간", "안전"]), N("시간", ["학교", "전화", "가족"]),
    TX("안전이 중요해요.", "An toàn là điều quan trọng.", ["An toàn là điều nguy hiểm.", "Gia đình là điều quan trọng.", "Thời gian là điều quan trọng."]),
    NX("Từ nào nghe gần âm Hán-Việt \"gia tộc\" (gia đình)?", "가족", ["가방", "가게", "가수"]),
    NX("Từ nào là \"bạn giả\": nghe như \"công trường\" nhưng nghĩa là nhà máy?", "공장", ["공원", "공항", "공부"]),
    Y("Gõ bằng tiếng Hàn: điện thoại", "전화"),
    W("Tôi gọi điện cho mẹ.", "어머니에게|전화해요", ["어머니를", "전화"]),
    M("학교", "시간", "전화", "안전", "가족"),
])
lesson("ue-l3", [
    C("sound-changes"),
    H("한국어", ["한국", "한국말", "한글"]),
    T("한국어", ["베트남어", "영어", "한국"]),
    TX("한국어를 공부해요.", "Tôi học tiếng Hàn.", ["Tôi là người Hàn.", "Tôi dạy tiếng Hàn.", "Tôi học tiếng Việt."]),
    NX("Từ mượn tiếng Anh nào nghĩa là \"máy tính\"?", "컴퓨터", ["핸드폰", "인터넷", "카메라"]),
    Y("Tôi học tiếng Hàn.", "한국어를 공부해요.", "한국어를 배워요."),
    Y("Cảm ơn. (kiểu trang trọng)", "감사합니다.", "고맙습니다."),
    W("Tôi đi xe buýt.", "버스를|타요", ["버스가", "가요"]),
    M("커피", "버스", "컴퓨터", "택시", "카메라"),
])
finish("s2")

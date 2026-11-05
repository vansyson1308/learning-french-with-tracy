"""ko-vi Section 4 lessons (speak): greetings at work and the speech levels (unit k, where 반말 is recognised but never
produced: exercises marked plain=True), the interview self-introduction (l), numbers and times aloud (m), telling and
describing in the past and the future (n). Session 2 writes the lesson-internal exercise types; the speech items (ko-KR
recogniser) join these lessons in session 3. Writes lessons/parts/s4.jsonl. usage: python -I ko-lessons-s4.py <repo root>"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ko_lesson_lib import C, F, H, K, M, N, NX, SP, T, TX, W, Y, finish, lesson

# ---------------------------------------------------------------- uk: greetings at work
lesson("uk-l0", [
    C("speech-levels"),
    T("출근", ["퇴근", "휴가", "회의"]), N("퇴근", ["출근", "야근", "휴식"]),
    TX("알겠습니다.", "Tôi hiểu rồi ạ.", ["Tôi không biết ạ.", "Cảm ơn ạ.", "Xin lỗi ạ."]),
    NX("Tổ trưởng giao việc. Bạn đáp lịch sự, trang trọng:", "네, 알겠습니다.", ["응, 알았어.", "네, 몰라요.", "아니요, 괜찮아요."]),
    F("반장님, 오늘 일찍 ___?", "퇴근하세요", ["퇴근해", "출근하세요", "퇴근하요"], "Tổ trưởng ơi, hôm nay anh về sớm ạ?"),
    TX("밥 먹었어?", "(Nói thân mật, với bạn) Ăn cơm chưa?", ["(Nói thân mật) Đi ăn đi.", "(Nói thân mật) Cơm ngon không?", "(Nói thân mật) Mai ăn cơm nhé."], plain=True),
    Y("Tôi hiểu rồi. (kiểu trang trọng)", "알겠습니다.", "네, 알겠습니다."),
    W("Giám đốc, anh vất vả rồi.", "사장님|수고하셨습니다", ["사장님을", "수고했어"]),
    M("사장님", "반장님", "동료", "출근", "퇴근"),
    # layers (session 3)
    SP("k_rep_annyeong"), SP("k_greet_leader"),
])
lesson("uk-l1", [
    T("동료", ["친구", "사장님", "손님"]),
    TX("먼저 가보겠습니다.", "Tôi xin phép về trước.", ["Mời anh về trước.", "Tôi đi làm đây.", "Anh vất vả rồi."]),
    NX("Bạn về trước đồng nghiệp. Bạn nói:", "먼저 가보겠습니다.", ["먼저 드세요.", "어서 오세요.", "잘 먹겠습니다."]),
    H("수고하세요", ["수고하셨습니다", "조심하세요", "어서 오세요"]),
    F("흐엉 ___, 안녕하세요.", "씨", ["가", "는", "을"], "Chào chị Hương."),
    Y("Chào giám đốc.", "사장님, 안녕하세요.", "안녕하세요, 사장님."),
    W("Tôi đi làm lúc tám giờ.", "여덟|시에|출근해요", ["팔", "퇴근해요"]),
    M("수고하세요", "수고하셨습니다", "알겠습니다", "잘 부탁드립니다"),
    # layers (session 3)
    SP("k_rep_sugo"), SP("k_sugo"), SP("k_thanks"),
])
lesson("uk-l2", [
    TX("고마워.", "(Nói thân mật, với bạn) Cảm ơn nhé.", ["(Nói thân mật) Xin lỗi nhé.", "(Nói thân mật) Tạm biệt.", "(Nói thân mật) Không sao."], plain=True),
    NX("Với giám đốc, câu cảm ơn nào hợp?", "고맙습니다.", ["고마워.", "땡큐.", "고맙다."]),
    F("사장님, 안녕히 ___.", "가세요", ["가", "가다", "갔어요"], "Chào giám đốc ạ (giám đốc ra về)."),
    Y("Mai gặp lại nhé.", "내일 봐요.", "내일 만나요."),
    K("반장님은 아마 그 사람을 ___.", "알다", "haeyo:fut", "Có lẽ tổ trưởng sẽ biết người đó."),
    W("Tôi đến muộn. Xin lỗi.", "늦어서|죄송합니다", ["늦고", "감사합니다"]),
    M("늦다", "일찍", "먼저", "같이"),
    # layers (session 3)
    SP("k_rep_meonjeo"), SP("k_leave_first"), SP("k_sorry"), SP("k_excuse"),
])
lesson("uk-l3", [
    TX("오늘 회의가 있어요?", "Hôm nay có họp không?", ["Hôm nay họp lúc mấy giờ?", "Hôm nay không có họp.", "Phòng họp ở đâu?"]),
    F("동료___ 같이 점심을 먹어요.", "하고", ["를", "에", "가"], "Tôi ăn trưa cùng đồng nghiệp."),
    NX("Ngày mai tôi sẽ đi làm sớm.", "내일 일찍 출근할 거예요.", ["어제 일찍 출근할 거예요.", "내일 일찍 출근했어요.", "내일 일찍 퇴근할 거예요."]),
    Y("Hôm nay tôi tan làm lúc sáu giờ.", "오늘 여섯 시에 퇴근해요."),
    W("Anh Min-su ơi, cùng ăn trưa nhé.", "민수 씨|같이|점심|먹어요", ["먹었어요", "혼자"]),
    M("회사", "회의", "점심시간", "휴식"),
    # layers (session 3)
    SP("k_greet_leader", more=("interaction.everyday_conversation",)), SP("k_sugo", more=("interaction.everyday_conversation",)), SP("k_leave_first", more=("interaction.everyday_conversation",)),
])

# ---------------------------------------------------------------- ul: the interview self-introduction
lesson("ul-l0", [
    C("copula"),
    T("나라", ["고향", "직업", "나이"]), N("고향", ["나라", "가족", "도시"]),
    TX("어느 나라 사람이에요?", "Bạn là người nước nào?", ["Bạn sống ở nước nào?", "Quê bạn ở đâu?", "Bạn làm nghề gì?"]),
    F("제 고향___ 하노이예요.", "은", ["는", "을", "에"], "Quê tôi là Hà Nội."),
    NX("Quê tôi là Hà Nội.", "제 고향은 하노이예요.", ["제 고향은 하노이이에요.", "제 고향을 하노이예요.", "저 고향은 하노이예요."]),
    Y("Tôi là người Việt Nam.", "저는 베트남 사람이에요."),
    W("Tôi đến từ Việt Nam.", "베트남에서|왔어요", ["베트남에", "가요"]),
    M("나라", "고향", "직업", "나이", "취미"),
    # layers (session 3)
    SP("l_rep_cheoeum"), SP("l_name"), SP("l_from"),
])
lesson("ul-l1", [
    T("면접", ["경험", "직업", "회사"]),
    TX("처음 뵙겠습니다. 응우옌 남입니다.", "Rất hân hạnh. Tôi là Nguyễn Nam.", ["Tạm biệt. Tôi là Nguyễn Nam.", "Rất hân hạnh. Anh là Nguyễn Nam à?", "Cảm ơn. Tôi là Nguyễn Nam."]),
    NX("Ở buổi phỏng vấn, bạn nói: \"Tôi hai mươi lăm tuổi.\"", "스물다섯 살입니다.", ["스물다섯 살이야.", "이십오 살입니다.", "스물다섯 명입니다."]),
    F("저는 공장에서 일한 경험___ 있습니다.", "이", ["을", "가", "에"], "Tôi có kinh nghiệm làm việc ở nhà máy."),
    Y("Tôi hai mươi tuổi. (kiểu trang trọng)", "저는 스무 살입니다."),
    W("Mong anh chị giúp đỡ.", "잘|부탁드립니다", ["잘못", "수고"]),
    M("면접", "경험", "직업", "결혼"),
    # layers (session 3)
    SP("l_age"), SP("l_work"),
])
lesson("ul-l2", [
    C("want-like"),
    T("좋아하다", ["싫어하다", "하다", "공부하다"]),
    F("저는 축구를 ___.", "좋아해요", ["좋아요", "좋아하요", "싫어요"], "Tôi thích bóng đá."),
    NX("Sở thích của tôi là âm nhạc.", "제 취미는 음악이에요.", ["제 취미는 음악예요.", "제 취미를 음악이에요.", "제 취미는 음악을 해요."]),
    TX("한국에서 일하고 싶어요.", "Tôi muốn làm việc ở Hàn Quốc.", ["Tôi đã làm việc ở Hàn Quốc.", "Tôi sẽ làm việc ở Hàn Quốc.", "Tôi không làm việc ở Hàn Quốc."]),
    Y("Tôi muốn học tiếng Hàn.", "한국어를 배우고 싶어요.", "한국어를 공부하고 싶어요."),
    W("Tôi muốn gặp gia đình.", "가족을|만나고|싶어요", ["가족이", "만나요"]),
    M("취미", "축구", "음악", "영화", "노래"),
    # layers (session 3)
    SP("l_like"), SP("l_rep_butak"),
])
lesson("ul-l3", [
    TX("결혼했어요?", "Bạn đã kết hôn chưa?", ["Bạn có con chưa?", "Bạn sẽ kết hôn à?", "Bạn có người yêu không?"]),
    F("저는 한국어를 조금 ___.", "해요", ["봐요", "있어요", "와요"], "Tôi nói được một chút tiếng Hàn."),
    NX("Tôi chưa kết hôn.", "아직 결혼 안 했어요.", ["벌써 결혼했어요.", "아직 결혼을 했어요.", "아직 결혼 안 할 거예요."]),
    Y("Tôi có kinh nghiệm.", "경험이 있어요."),
    W("Tôi nói tiếng Hàn giỏi.", "한국어를|잘|해요", ["한국어가", "못"]),
    M("결혼", "나이", "경험", "고향"),
    # layers (session 3)
    SP("l_name", more=("interaction.everyday_conversation",)), SP("l_from", more=("interaction.everyday_conversation",)), SP("l_work", more=("interaction.everyday_conversation",)),
])

# ---------------------------------------------------------------- um: numbers and times aloud
lesson("um-l0", [
    C("sino-numbers"),
    T("일곱", ["여덟", "아홉", "여섯"]), N("아홉", ["일곱", "여덟", "열"]),
    TX("전화번호가 뭐예요?", "Số điện thoại của bạn là gì?", ["Tên bạn là gì?", "Địa chỉ của bạn ở đâu?", "Bạn có điện thoại không?"]),
    F("전화번호가 ___ 번이에요?", "몇", ["얼마", "무슨", "누구"], "Số điện thoại là số mấy?"),
    NX("Số điện thoại của tôi là 010-1234-5678.", "제 전화번호는 010-1234-5678이에요.", ["제 전화번호는 010-1234-5678예요.", "제 전화번호를 010-1234-5678이에요.", "제 이름은 010-1234-5678이에요."]),
    Y("Số điện thoại là 010-1234-5678.", "전화번호는 010-1234-5678이에요.", "전화번호는 01012345678이에요."),
    W("Bảy giờ tối.", "오후|일곱|시예요", ["칠", "오전"]),
    M("일곱", "여덟", "아홉", "열"),
    # layers (session 3)
    SP("m_rep_price"), SP("m_price"),
])
lesson("um-l1", [
    C("time-dates"),
    T("오전", ["오후", "반", "시"]),
    F("___ 아홉 시에 출근해요.", "오전", ["오후", "밤", "저녁"], "Tôi đi làm lúc chín giờ sáng."),
    TX("오후 세 시 반에 만나요.", "Gặp nhau lúc ba giờ rưỡi chiều.", ["Gặp nhau lúc ba giờ sáng.", "Gặp nhau lúc ba giờ chiều.", "Gặp nhau lúc ba giờ ba mươi lăm."]),
    NX("Tám giờ sáng.", "오전 여덟 시예요.", ["오전 팔 시예요.", "오후 여덟 시예요.", "오전 여덟 분이에요."]),
    Y("Tôi dậy lúc sáu giờ sáng.", "오전 여섯 시에 일어나요.", "아침 여섯 시에 일어나요."),
    W("Mấy giờ bạn tan làm?", "몇|시에|퇴근해요", ["무슨", "출근해요"]),
    M("오전", "오후", "반", "몇"),
    # layers (session 3)
    SP("m_time"), SP("m_rep_half"), SP("m_day"),
])
lesson("um-l2", [
    TX("몇 살이에요?", "Bạn bao nhiêu tuổi?", ["Bạn tên là gì?", "Mấy giờ rồi?", "Có mấy người?"]),
    F("가족이 ___ 명이에요?", "몇", ["얼마", "무슨", "어느"], "Gia đình bạn có mấy người?"),
    NX("Cái này bao nhiêu tiền?", "이거 얼마예요?", ["이거 몇이에요?", "이거 누구예요?", "이거 몇 시예요?"]),
    Y("Bạn bao nhiêu tuổi?", "몇 살이에요?", "나이가 어떻게 되세요?"),
    Y("Có mấy người?", "몇 명이에요?", "몇 명 있어요?"),
    W("Tôi hai mươi tám tuổi.", "저는|스물여덟|살이에요", ["이십팔", "스무"]),
    H("몇 시예요", ["몇 살이에요", "몇 명이에요", "몇 번이에요"]),
    # layers (session 3)
    SP("m_birthday"), SP("m_tickets"),
])
lesson("um-l3", [
    TX("세 개에 오천 원이에요.", "Ba cái năm nghìn won.", ["Năm cái ba nghìn won.", "Ba cái ba nghìn won.", "Một cái năm nghìn won."]),
    F("버스가 ___ 분 후에 와요.", "십", ["열", "하나", "한"], "Mười phút nữa xe buýt đến."),
    NX("Tầng ba.", "삼 층이에요.", ["세 층이에요.", "셋 층이에요.", "삼 층예요."]),
    Y("Văn phòng ở tầng năm.", "사무실은 오 층에 있어요."),
    W("Cho tôi ba ly cà phê.", "커피|세|잔|주세요", ["셋", "삼"]),
    M("층", "잔", "병", "권"),
    # layers (session 3)
    SP("m_price", more=("interaction.practical_needs",)), SP("m_time", more=("interaction.practical_needs",)), SP("m_day", more=("interaction.practical_needs",)),
])

# ---------------------------------------------------------------- un: telling and describing
lesson("un-l0", [
    C("past"),
    T("어제", ["오늘", "내일", "주말"]),
    F("어제 친구를 ___.", "만났어요", ["만나요", "만날 거예요", "만나았어요"], "Hôm qua tôi đã gặp bạn."),
    K("어제 영화를 ___.", "보다", "haeyo:pas", "Hôm qua tôi đã xem phim."),
    NX("Cuối tuần tôi đã đi Busan.", "주말에 부산에 갔어요.", ["주말에 부산에 가요.", "주말에 부산을 갔어요.", "주말에 부산에 갈 거예요."]),
    Y("Hôm qua tôi đã làm việc.", "어제 일했어요."),
    W("Hôm qua tôi mệt.", "어제|피곤했어요", ["피곤해요", "내일"]),
    M("어제", "주말", "지난주", "작년"),
    # layers (session 3)
    SP("n_rep_keoyo"), SP("n_box"),
])
lesson("un-l1", [
    T("재미있다", ["재미없다", "힘들다", "바쁘다"]), N("친절하다", ["예쁘다", "바쁘다", "힘들다"]),
    F("한국어 공부가 ___.", "재미있어요", ["재미있아요", "재미없어요", "재미있이에요"], "Học tiếng Hàn thú vị."),
    NX("Người Hàn Quốc tử tế.", "한국 사람은 친절해요.", ["한국 사람은 친절하요.", "한국 사람을 친절해요.", "한국 사람은 바빠요."]),
    TX("일이 힘들어요.", "Công việc vất vả.", ["Công việc thú vị.", "Công việc dễ.", "Tôi không có việc."]),
    Y("Dạo này tôi bận.", "요즘 바빠요."),
    W("Căn phòng đẹp.", "방이|예뻐요", ["방을", "예쁘어요"]),
    M("재미있다", "힘들다", "피곤하다", "바쁘다", "친절하다"),
    # layers (session 3)
    SP("n_car"), SP("n_cat"),
])
lesson("un-l2", [
    C("future"),
    TX("내일 뭐 할 거예요?", "Mai bạn sẽ làm gì?", ["Hôm qua bạn đã làm gì?", "Bây giờ bạn làm gì?", "Mai bạn đi đâu?"]),
    K("주말에 아마 시장에 ___.", "가다", "haeyo:fut", "Cuối tuần có lẽ tôi sẽ đi chợ."),
    K("내일은 아마 집에서 ___.", "놀다", "haeyo:fut", "Mai có lẽ tôi sẽ chơi ở nhà."),
    F("다음 주에 고향에 ___.", "갈 거예요", ["갔어요", "가었어요", "가세요"], "Tuần sau tôi sẽ về quê."),
    NX("Để tôi làm.", "제가 할게요.", ["제가 했어요.", "저가 할게요.", "제가 할까요?"]),
    Y("Tuần sau tôi sẽ nghỉ.", "다음 주에 쉴 거예요.", "다음 주에 쉬어요."),
    W("Ngày mai trời sẽ lạnh.", "내일은|추울|거예요", ["추워요", "거야"]),
    # layers (session 3)
    SP("n_rep_past"), SP("n_weekend"), SP("n_tomorrow"),
])
lesson("un-l3", [
    TX("음식이 맛없었어요.", "Đồ ăn không ngon.", ["Đồ ăn ngon.", "Đồ ăn cay.", "Tôi không ăn."]),
    F("어제는 날씨가 ___.", "추웠어요", ["추워요", "춥었어요", "추울 거예요"], "Hôm qua trời lạnh."),
    NX("Hôm qua tôi đã ăn kim chi. Rất ngon.", "어제 김치를 먹었어요. 정말 맛있었어요.", ["어제 김치를 먹을 거예요. 정말 맛있었어요.", "어제 김치가 먹었어요. 정말 맛있었어요.", "어제 김치를 먹었어요. 정말 맛없었어요."]),
    Y("Hôm qua thú vị.", "어제는 재미있었어요."),
    W("Tôi đã mua quần áo đẹp.", "예쁜|옷을|샀어요", ["예뻐요", "살"]),
    M("예쁘다", "맛없다", "재미없다", "친절하다"),
    # layers (session 3)
    SP("n_box", more=("speaking.self_intro",)), SP("n_car", more=("speaking.self_intro",)), SP("n_cat", more=("speaking.self_intro",)),
])
finish("s4")

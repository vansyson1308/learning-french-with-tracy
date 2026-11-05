# TOPIK I practice track, reading, form a (data only; read by ko-exam.py). Original items: work, the factory, the
# dormitory, shopping and transport. Names in the Vietnamese text: 흐엉 = Hương, 란 = Lan, 투이 = Thủy, 민수 = Min-su.

# R1: two short sentences -> their topic.
R1 = [
    ("저는 공장에서 일해요. 제 친구는 식당에서 일해요.", "Chỗ làm việc", ["Quê hương", "Sở thích", "Gia đình"]),
    ("제 방에는 침대가 있어요. 책상하고 의자도 있어요.", "Đồ đạc", ["Món ăn", "Quần áo", "Thời tiết"]),
    ("저는 지하철로 출근해요. 동료는 자전거를 타요.", "Đi lại", ["Mua sắm", "Nấu ăn", "Tuổi tác"]),
    ("이 바지는 삼만 원이에요. 저 티셔츠는 만 원이에요.", "Giá tiền", ["Màu sắc", "Kích cỡ", "Thời tiết"]),
]

# R2: one gap.
R2 = [
    ("저는 매일 공장(   ) 일해요.", "에서", ["을", "의", "와"], "particles.core"),
    ("어제 저녁에 마트에서 과일을 (   ).", "샀어요", ["살 거예요", "사요", "살까요"], "verbs.past_future"),
    ("(   ) 버스를 타요? 정류장 앞에서 타요.", "어디에서", ["언제", "누가", "무엇을"], "questions.question_words"),
    ("손을 다쳐서 오늘은 일을 (   ) 해요.", "못", ["않", "잘", "또"], "negation.an_mot"),
    ("편의점에서 계산하고 (   )을 받았어요.", "영수증", ["여권", "열쇠", "안경"], "vocab.everyday_basics"),
    ("오늘은 금요일이에요. 내일은 (   )이에요.", "토요일", ["목요일", "일요일", "월요일"], "vocab.time_calendar"),
    ("머리를 다칠 수 있어요. (   )를 쓰세요.", "안전모", ["장갑", "안전화", "작업복"], "vocab.work_korea"),
    ("회사까지 버스로 (   ) 시간 걸려요.", "두", ["이", "삼", "사"], "numbers.two_systems"),
    ("냉장고에 우유가 (   ). 그래서 마트에서 우유를 살 거예요.", "없어요", ["있어요", "많아요", "맛있어요"], "existence.itda"),
    ("기계가 이상해요. 빨리 기계를 (   ).", "멈추세요", ["멈추고", "멈추지", "멈추면"], "verbs.requests_rules"),
]

# R3: notices and messages.
R3 = [
    ("notice", "탈의실",
     ["오전 일곱 시부터 문을 열어요.", "여기에서 작업복으로 갈아입으세요.", "가방은 바닥에 놓지 마세요."],
     "Phòng thay đồ mở cửa lúc mấy giờ?", "Bảy giờ sáng", ["Sáu giờ sáng", "Bảy giờ tối", "Tám giờ sáng"]),
    ("message", "문자",
     ["남 씨, 오늘은 야근이 있어요.", "저녁 아홉 시까지 일해요.", "저녁은 회사 식당에서 같이 먹어요.", "반장님"],
     "Hôm nay Nam làm việc đến mấy giờ?", "Chín giờ tối", ["Năm giờ chiều", "Chín giờ sáng", "Bảy giờ tối"]),
    ("notice", "세탁기",
     ["세탁기는 일 층에 있어요.", "오전 여섯 시부터 밤 열한 시까지 쓸 수 있어요.", "옷을 세탁기에 놓고 가지 마세요."],
     "Có thể dùng máy giặt đến mấy giờ?", "Mười một giờ đêm", ["Sáu giờ sáng", "Chín giờ tối", "Mười giờ đêm"]),
    ("notice", "마트 할인",
     ["이번 주 토요일과 일요일에 과일이 싸요.", "사과 한 상자 15,000원", "바나나 3,000원", "카드로 계산할 수 있어요."],
     "Một thùng táo giá bao nhiêu?", "15.000 won", ["5.000 won", "3.000 won", "13.000 won"]),
    ("notice", "정류장",
     ["이 정류장에서 7번 버스와 12번 버스를 탈 수 있어요.", "7번 버스는 시청에 가요.", "12번 버스는 공항에 가요.", "버스는 이십 분마다 와요."],
     "Muốn đi sân bay thì phải đi xe buýt số mấy?", "Xe buýt số 12", ["Xe buýt số 7", "Xe buýt số 20", "Xe buýt số 2"]),
    ("message", "문자",
     ["란 씨, 미안해요.", "지하철이 늦게 와요.", "이십 분 정도 늦을 거예요.", "백화점 입구에서 기다려 주세요.", "투이"],
     "Lan nên đợi Thủy ở đâu?", "Ở lối vào trung tâm thương mại",
     ["Ở ga tàu điện ngầm", "Ở lối ra trung tâm thương mại", "Ở trạm xe buýt"]),
]

# R4: short texts -> the true statement.
R4 = [
    ("narrative", "제 일",
     ["저는 화성의 공장에서 일해요. 우리 공장에서는 핸드폰 부품을 만들어요. 저는 부품 검사를 해요. 일은 힘들지만 동료가 모두 친절해요."],
     "Người viết làm công việc kiểm tra linh kiện.",
     ["Nhà máy của người viết sản xuất máy tính.", "Người viết làm việc ở Suwon.", "Đồng nghiệp của người viết không thân thiện."]),
    ("description", "우리 기숙사",
     ["우리 기숙사는 공장 뒤에 있어요. 방 하나에 두 사람이 살아요. 부엌은 일 층에 있어요. 기숙사에서는 술을 마시면 안 돼요."],
     "Mỗi phòng có hai người ở.",
     ["Ký túc xá ở phía trước nhà máy.", "Bếp ở tầng hai.", "Trong ký túc xá được uống rượu."]),
    ("message", "문자",
     ["민수 씨, 저는 지금 시장에 있어요.", "여기 과일이 정말 싸요.", "사과를 사 갈까요?", "저녁에 기숙사에서 같이 먹어요.", "흐엉"],
     "Hương hỏi có nên mua táo mang về không.",
     ["Hương đang ở siêu thị.", "Trái cây ở chợ rất đắt.", "Tối nay hai người ăn ở quán."]),
    ("notice", "공장 안전",
     ["공장에서는 안전화를 신으세요.", "지게차 옆에서는 걷지 마세요.", "기계가 이상하면 반장님에게 바로 말하세요.", "다치면 사무실에 연락하세요."],
     "Khi máy có vấn đề, phải báo ngay cho tổ trưởng.",
     ["Trong nhà máy có thể đi giày thường.", "Có thể đi bộ bên cạnh xe nâng.", "Khi bị thương, hãy về ký túc xá nghỉ."]),
    ("narrative", "아침 출근",
     ["저는 매일 아침 일곱 시에 기숙사에서 나가요. 정류장까지 걸어서 오 분 걸려요. 버스를 타고 역에 가요. 역에서 지하철로 갈아타요. 회사에는 여덟 시에 도착해요."],
     "Từ ký túc xá đến trạm xe buýt mất năm phút đi bộ.",
     ["Người viết đi xe đạp đến ga.", "Người viết rời ký túc xá lúc tám giờ.", "Người viết đi xe buýt thẳng đến công ty."]),
    ("description", "집 앞 마트",
     ["우리 집 앞에 큰 마트가 있어요. 마트는 아침 아홉 시에 문을 열고 밤 열한 시에 닫아요. 주말에는 사람이 아주 많아요. 그래서 저는 보통 평일 저녁에 마트에 가요. 마트에서는 봉투가 백 원이에요."],
     "Cuối tuần siêu thị rất đông người.",
     ["Siêu thị mở cửa lúc mười giờ sáng.", "Người viết thường đi siêu thị vào cuối tuần.", "Ở siêu thị, túi được cho miễn phí."]),
    ("notice", "회의",
     ["직원 여러분, 다음 주 월요일 오후 두 시에 회의가 있어요.", "회의는 삼 층 회의실에서 해요.", "회의 전에 서류를 꼭 읽어 오세요.", "회의는 한 시간 정도 걸릴 거예요.", "사장님"],
     "Cuộc họp diễn ra vào chiều thứ Hai tuần sau.",
     ["Cuộc họp ở phòng họp tầng hai.", "Nhân viên sẽ nhận hồ sơ sau cuộc họp.", "Cuộc họp kéo dài khoảng ba tiếng."]),
    ("narrative", "이사",
     ["지난달에 저는 기숙사에서 아파트로 이사했어요. 아파트는 회사에서 조금 멀어요. 그래서 출근할 때 지하철을 타요. 하지만 방이 넓고 조용해서 좋아요."],
     "Bây giờ người viết đi làm bằng tàu điện ngầm.",
     ["Người viết chuyển vào ký túc xá tháng trước.", "Căn hộ ở gần công ty.", "Phòng mới chật và ồn."]),
]

# R5: longer texts, two questions each.
R5 = [
    ("narrative", "처음 출근한 날",
     ["저는 작년 삼월에 한국에 왔어요. 그리고 안산의 공장에서 일을 시작했어요. 처음 출근한 날에는 정말 걱정했어요. 한국말을 잘 몰랐어요.",
      "하지만 반장님이 기계를 천천히 설명해 주셨어요. 점심시간에는 베트남 동료가 식당을 알려 줬어요. 지금은 일이 쉬워요. 그리고 친구도 많아요."],
     [("Người viết bắt đầu làm ở nhà máy khi nào?", "Tháng ba năm ngoái", ["Tháng ba năm nay", "Tháng tư năm ngoái", "Tháng mười năm ngoái"]),
      ("Ai đã giải thích về máy móc cho người viết?", "Tổ trưởng", ["Đồng nghiệp người Việt", "Giám đốc", "Một người bạn"])]),
    ("description", "우리 기숙사 생활",
     ["제 기숙사는 공장 옆에 있어요. 저는 동료 두 명과 같이 방을 써요. 방에는 침대 세 개와 에어컨이 있어요. 부엌과 화장실은 모두 같이 써요. "
      "관리비는 한 달에 오만 원이에요. 밤 열한 시부터는 음악을 들으면 안 돼요. 쓰레기는 수요일과 토요일에 버려요. 회사가 가까워서 정말 편해요."],
     [("Người viết ở chung phòng với ai?", "Hai đồng nghiệp", ["Ba đồng nghiệp", "Một người bạn", "Không ở chung với ai"]),
      ("Vì sao người viết thấy ký túc xá tiện?", "Vì gần công ty", ["Vì không phải trả tiền gì", "Vì phòng có bếp riêng", "Vì được nghe nhạc muộn"])]),
    ("narrative", "겨울 옷",
     ["지난 토요일에 저는 친구 란 씨하고 백화점에 갔어요. 한국의 겨울은 정말 추워요. 그래서 두꺼운 옷이 필요했어요. 백화점 옷은 예뻤어요. 하지만 너무 비쌌어요.",
      "그래서 우리는 시장에 갔어요. 시장에서 검은색 바지와 두꺼운 양말을 샀어요. 바지는 이만 원이고 양말은 삼천 원이었어요."],
     [("Vì sao họ không mua quần áo ở trung tâm thương mại?", "Vì quần áo quá đắt", ["Vì quần áo không đẹp", "Vì cửa hàng đóng cửa", "Vì không có cỡ vừa"]),
      ("Người viết đã mua gì ở chợ?", "Quần màu đen và tất dày", ["Quần màu trắng và tất mỏng", "Áo phông và mũ", "Giày và găng tay"])]),
    ("narrative", "고향에 가는 날",
     ["다음 주 금요일에 저는 베트남에 갈 거예요. 설날에 가족을 만나고 싶어요. 비행기는 밤 열 시에 인천 공항에서 출발해요. 기숙사에서 공항까지 멀어요. "
      "그래서 터미널에서 공항 버스를 탈 거예요. 버스로 두 시간 걸려요. 저는 오후 다섯 시에 기숙사에서 출발할 거예요. 여권과 표를 꼭 가방에 넣을 거예요."],
     [("Máy bay cất cánh lúc mấy giờ?", "Mười giờ tối", ["Năm giờ chiều", "Bảy giờ tối", "Mười giờ sáng"]),
      ("Người viết sẽ đến sân bay bằng gì?", "Xe buýt sân bay", ["Tàu điện ngầm", "Taxi", "Tàu hỏa"])]),
    ("description", "우리 공장의 근무 시간",
     ["우리 공장은 주간과 야간이 있어요. 주간은 오전 일곱 시부터 오후 네 시까지예요. 야간은 오후 일곱 시부터 오전 네 시까지예요. 저는 이번 주에 주간 근무를 해요. "
      "다음 주에는 야간 근무를 할 거예요. 야간 근무는 힘들지만 월급이 많아요. 토요일에는 가끔 잔업이 있고 일요일에는 쉬어요."],
     [("Tuần này người viết làm ca nào?", "Ca ngày", ["Ca đêm", "Ca làm thêm giờ", "Ca chiều"]),
      ("Ca đêm kết thúc lúc mấy giờ?", "Bốn giờ sáng", ["Bốn giờ chiều", "Bảy giờ tối", "Bảy giờ sáng"])]),
    ("narrative", "고용센터",
     ["흐엉 씨의 공장은 지난달에 문을 닫았어요. 그래서 흐엉 씨는 고용센터에 갔어요. 고용센터 직원이 아주 친절했어요. 직원이 수원에 있는 공장의 전화번호를 줬어요. "
      "다음 주 화요일에 그 공장에서 면접이 있어요. 흐엉 씨는 매일 한국어 대답을 연습해요. 면접 날에는 외국인 등록증을 꼭 가져갈 거예요."],
     [("Vì sao Hương đến trung tâm hỗ trợ việc làm?", "Vì nhà máy cũ đã đóng cửa", ["Vì muốn đổi thẻ cư trú", "Vì bị thương ở nhà máy", "Vì cần học tiếng Hàn"]),
      ("Buổi phỏng vấn diễn ra khi nào?", "Thứ Ba tuần sau", ["Thứ Ba tuần này", "Thứ Năm tuần sau", "Tháng sau"])]),
]

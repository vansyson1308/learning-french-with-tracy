"""TOPIK I practice track, listening, form b (data only; read by ko-exam.py). Original items: the clinic, the bank, the
post office, friends, hobbies, the weather and weekends. A and B are the two voices of a dialogue."""

# L1: one line heard -> the reply that fits (Korean); the three others are real sentences that do not answer it.
L1 = [
    (("A", "주말에 보통 뭐 해요?"), "친구하고 축구를 해요.", ["네, 같이 가요.", "회사가 멀어요.", "아니요, 주말이 아니에요."]),
    (("B", "소포를 어디로 보내요?"), "베트남으로 보내요.", ["소포가 무거워요.", "어제 받았어요.", "우체국이 가까워요."]),
    (("A", "통장을 만들고 싶어요. 뭐가 필요해요?"), "외국인 등록증이 필요해요.",
     ["통장이 없어요.", "은행은 네 시에 문을 닫아요.", "돈을 많이 모았어요."]),
    (("B", "내일 날씨가 어때요?"), "비가 올 거예요.", ["내일은 토요일이에요.", "우산을 잃어버렸어요.", "어제는 바빴어요."]),
    (("A", "취미가 뭐예요?"), "노래를 좋아해요. 노래방에 자주 가요.",
     ["네, 취미가 있어요.", "노래방은 시내에 있어요.", "아니요, 가수가 아니에요."]),
    (("B", "감기는 좀 괜찮아요?"), "네, 이제 괜찮아요. 고마워요.",
     ["병원은 역 앞에 있어요.", "내일 약국에 갈 거예요.", "아니요, 제 동생이에요."]),
]

# L2: where are they?
L2 = [
    ([("A", "어서 오세요. 어떻게 오셨어요?"), ("B", "통장을 만들고 싶어요."), ("A", "네, 이 신청서를 쓰고 외국인 등록증을 주세요.")],
     "Ngân hàng", ["Nhà thuốc", "Rạp chiếu phim", "Tiệm cắt tóc"]),
    ([("B", "이 소포를 하노이에 보내고 싶어요."), ("A", "상자를 여기에 놓으세요. 상자에 뭐가 있어요?"), ("B", "옷하고 과자가 있어요.")],
     "Bưu điện", ["Ngân hàng", "Thư viện", "Bệnh viện"]),
    ([("B", "목이 아프고 기침이 나요."), ("A", "처음 오셨어요? 그러면 여기에 이름을 쓰고 잠깐 기다리세요.")],
     "Bệnh viện", ["Bưu điện", "Thư viện", "Phòng hát karaoke"]),
    ([("A", "날씨가 정말 좋아요."), ("B", "네, 꽃이 많아요. 저기 의자에 앉을까요?"), ("A", "좋아요. 강아지도 정말 귀여워요.")],
     "Công viên", ["Thư viện", "Ngân hàng", "Rạp chiếu phim"]),
]

# L3: what are they talking about?
L3 = [
    ([("A", "오늘 아침에는 정말 추웠어요."), ("B", "네, 바람도 차가웠어요. 그래도 내일은 따뜻할 거예요.")],
     "Thời tiết", ["Quần áo", "Bữa sáng", "Kỳ nghỉ"]),
    ([("B", "흐엉 씨는 시간이 있을 때 뭐 해요?"), ("A", "집에서 베트남 음식을 요리해요. 민수 씨는요?"),
      ("B", "저는 사진을 찍어요. 주말에 산에 자주 가요.")],
     "Sở thích", ["Công việc", "Gia đình", "Quê hương"]),
    ([("A", "월급을 받으면 베트남에 돈을 보내요?"), ("B", "네, 부모님께 보내요."), ("A", "수수료는 얼마예요?"), ("B", "한 번에 오천 원이에요.")],
     "Chuyển tiền về Việt Nam", ["Đổi tiền ở sân bay", "Mở tài khoản mới", "Mua vé máy bay"]),
    ([("A", "토요일이 지영 씨 생일이에요."), ("B", "그래요? 그러면 선물을 같이 살까요?"), ("A", "좋아요. 지영 씨는 꽃을 좋아해요.")],
     "Quà sinh nhật cho Ji-yeong", ["Tiệc cuối năm của công ty", "Chuyến du lịch ra biển", "Bài hát Ji-yeong thích"]),
]

# L4: which statement is true?
L4 = [
    ([("A", "어디가 불편하세요?"), ("B", "어제부터 배가 아파요. 그래서 밥을 못 먹어요."), ("A", "그러면 이 약을 식사 후에 드세요.")],
     "Bệnh nhân bị đau bụng từ hôm qua.",
     ["Bệnh nhân bị đau đầu từ hôm qua.", "Bệnh nhân vẫn ăn cơm bình thường.", "Bác sĩ bảo uống thuốc trước bữa ăn."]),
    ([("B", "통장을 만들고 싶어요."), ("A", "신분증 있으세요?"), ("B", "네, 여기 외국인 등록증이요."), ("A", "그러면 이 신청서를 써 주세요.")],
     "Khách có mang theo giấy tờ tùy thân.",
     ["Khách muốn đổi tiền.", "Khách không có thẻ cư trú.", "Nhân viên tự viết đơn đăng ký giúp khách."]),
    ([("A", "이 소포를 베트남에 보내고 싶어요. 얼마나 걸려요?"), ("B", "비행기로 보내면 일주일 걸려요."), ("A", "그러면 비행기로 보낼게요.")],
     "Khách chọn gửi bưu kiện bằng máy bay.",
     ["Khách gửi bưu kiện sang Trung Quốc.", "Gửi bằng máy bay mất một tháng.", "Khách nhận một bưu kiện từ Việt Nam."]),
    ([("B", "이번 주말에 바다에 갈까요?"), ("A", "토요일에는 비가 와요. 일요일은 맑을 거예요."), ("B", "그러면 일요일에 가요.")],
     "Hai người sẽ đi biển vào Chủ nhật.",
     ["Chủ nhật trời sẽ mưa.", "Hai người sẽ đi núi vào thứ Bảy.", "Thứ Bảy trời sẽ nắng đẹp."]),
    ([("A", "준호 씨, 무슨 운동을 좋아해요?"), ("B", "축구를 좋아해요. 매주 토요일에 회사 동료하고 축구를 해요. 린 씨는요?"),
      ("A", "저는 운동을 별로 안 좋아해요. 집에서 영화를 자주 봐요.")],
     "Chị Linh không thích thể thao lắm.",
     ["Jun-ho đá bóng vào mỗi Chủ nhật.", "Jun-ho thường đá bóng một mình.", "Chị Linh ít khi xem phim."]),
    ([("B", "흐엉 씨, 내일 저녁에 시간 있어요?"), ("A", "미안해요. 내일은 야근이 있어요. 금요일은 괜찮아요."),
      ("B", "그러면 금요일 저녁에 같이 밥 먹어요.")],
     "Hai người sẽ ăn tối cùng nhau vào thứ Sáu.",
     ["Chị Hương rảnh vào tối mai.", "Hai người sẽ ăn trưa cùng nhau vào ngày mai.", "Chị Hương phải làm tối vào thứ Sáu."]),
    ([("A", "이 약은 아침하고 저녁에 드세요."), ("B", "식사 후에 먹어요?"), ("A", "네. 그리고 술은 마시지 마세요.")],
     "Khi dùng thuốc này thì không được uống rượu.",
     ["Thuốc này chỉ uống vào buổi sáng.", "Thuốc này uống trước bữa ăn.", "Khi dùng thuốc này có thể uống một chút rượu."]),
    ([("A", "민수 씨, 주말에 뭐 했어요?"), ("B", "토요일에는 집에서 쉬었어요. 일요일에는 친구하고 시내를 구경했어요."),
      ("A", "저는 일요일에 박물관에 갔어요.")],
     "Min-su đi tham quan trung tâm thành phố cùng bạn.",
     ["Min-su nghỉ ở nhà cả hai ngày.", "Min-su đi bảo tàng vào Chủ nhật.", "Người hỏi đi bảo tàng vào thứ Bảy."]),
]

# L5: four announcements (one voice, 합쇼체), then four longer dialogues.
L5 = [
    ([("A", "손님 여러분, 은행은 오후 네 시에 문을 닫습니다. 환전은 삼 층에서 하십시오.")],
     "Muốn đổi tiền thì phải đến đâu?", "Tầng ba", ["Tầng bốn", "Tầng một", "Quầy ở lối vào"]),
    ([("B", "환자 여러분께 알립니다. 오늘 내과는 오후 한 시부터 두 시까지 쉽니다. 치과는 오후에도 문을 엽니다.")],
     "Hôm nay khoa nội nghỉ vào lúc nào?", "Từ 1 giờ đến 2 giờ chiều", ["Từ 12 giờ đến 1 giờ chiều", "Cả buổi chiều", "Từ 2 giờ đến 3 giờ chiều"]),
    ([("A", "손님 여러분, 소포를 보내는 손님은 삼 층으로 올라가십시오. 일 층에서는 송금만 할 수 있습니다.")],
     "Người muốn gửi bưu kiện phải làm gì?", "Đi lên tầng ba", ["Ở lại tầng một", "Chờ ở lối vào", "Quay lại vào ngày mai"]),
    ([("B", "내일 날씨입니다. 오전에는 맑습니다. 그러나 오후부터 비가 많이 옵니다. 우산을 꼭 가져가십시오.")],
     "Ngày mai trời bắt đầu mưa từ khi nào?", "Từ buổi chiều", ["Từ sáng sớm", "Từ ban đêm", "Mưa cả ngày"]),
    ([("A", "어떻게 오셨어요?"), ("B", "어제부터 머리가 아프고 기침이 나요."), ("A", "처음 오셨어요? 외국인 등록증을 주세요."),
      ("B", "여기 있어요. 오래 기다려요?"), ("A", "아니요, 십 분 정도 기다리세요.")],
     "Bệnh nhân phải chờ bao lâu?", "Khoảng 10 phút", ["Khoảng 30 phút", "Khoảng 1 tiếng", "Không phải chờ"]),
    ([("B", "린 씨, 이번 토요일에 시간 있어요?"), ("A", "네, 오후에는 괜찮아요. 왜요?"),
      ("B", "제 친구 생일 파티가 있어요. 같이 노래방에 갈까요?"), ("A", "좋아요. 몇 시에 만나요?"), ("B", "다섯 시에 역 앞에서 만나요.")],
     "Hai người hẹn gặp nhau ở đâu?", "Trước nhà ga", ["Trước phòng karaoke", "Ở nhà người bạn", "Trước công ty"]),
    ([("A", "베트남에 돈을 보내고 싶어요."), ("B", "얼마를 보내세요?"), ("A", "백만 원이요. 수수료는 얼마예요?"),
      ("B", "만 원이에요. 그리고 오늘 보내면 내일 도착해요."), ("A", "네, 그러면 오늘 보낼게요.")],
     "Phí chuyển tiền là bao nhiêu?", "10.000 won", ["5.000 won", "100.000 won", "1.000.000 won"]),
    ([("B", "마이 씨, 요즘 주말에 뭐 해요?"), ("A", "토요일마다 한국어를 배워요. 일요일에는 수영장에 가요."), ("B", "수영장은 어디에 있어요?"),
      ("A", "공원 옆에 있어요. 아침 일곱 시에 문을 열어요."), ("B", "저도 다음 주에 같이 가고 싶어요.")],
     "Chị Mai làm gì vào Chủ nhật?", "Đi bể bơi", ["Học tiếng Hàn", "Đi làm thêm", "Ở nhà nghỉ ngơi"]),
]

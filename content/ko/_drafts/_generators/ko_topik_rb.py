"""ko-vi TOPIK I practice track, reading, form b: data only (read by ko-exam.py build()). Original items on the clinic,
the bank, the post office, friends, hobbies, the weather and weekends; form a (ko_topik_ra.py) takes work, the factory,
the dormitory, shopping and transport.
"""

# R1: two short sentences -> the topic (Vietnamese).
R1 = [
 ("오늘은 하늘이 흐려요. 오후에는 비가 많이 올 거예요.", "Thời tiết", ["Sở thích", "Gia đình", "Mua sắm"]),
 ("저는 사진을 좋아해요. 휴일에는 공원에서 사진을 찍어요.", "Sở thích", ["Thời tiết", "Sức khỏe", "Công việc"]),
 ("목이 아파요. 그리고 기침도 많이 나요.", "Sức khỏe", ["Thời tiết", "Quê hương", "Giá cả"]),
 ("제 친구는 하노이에서 왔어요. 지금은 서울에 살아요.", "Bạn bè", ["Sức khỏe", "Món ăn", "Giá cả"]),
]

# R2: one gap "(   )" -> the right word or form; the wrong options are never a second right answer.
R2 = [
 ("어제 우체국(   ) 소포를 보냈어요.", "에서", ["을", "로", "와"], "particles.core"),
 ("어제 친구하고 병원에 (   ).", "갔어요", ["갈 거예요", "가요", "가세요"], "verbs.past_future"),
 ("(   )은 토요일이에요. 그래서 내일은 일요일이에요.", "오늘", ["어제", "내일", "주말"], "vocab.time_calendar"),
 ("주말에 친구하고 커피 (   ) 잔을 마셨어요.", "두", ["둘", "이", "이십"], "numbers.two_systems"),
 ("목이 아파서 노래를 (   ) 불러요.", "못", ["잘", "많이", "자주"], "negation.an_mot"),
 ("저는 한국 통장이 (   ). 그래서 내일 은행에서 통장을 만들 거예요.", "없어요", ["있어요", "많아요", "좋아요"], "existence.itda"),
 ("여기에 이름하고 전화번호를 (   ).", "쓰세요", ["쓰고", "쓰지", "써서"], "verbs.requests_rules"),
 ("날씨가 좋아요. 이번 주말에 친구하고 바다에 가고 (   ).", "싶어요", ["싶고", "싶지만", "싶으면"], "wants.goshipda"),
 ("우체국이 (   )에 있어요? 은행 옆에 있어요.", "어디", ["언제", "누구", "무엇"], "questions.question_words"),
 ("밖에 비가 와요. (   )을 가져가세요.", "우산", ["안경", "여권", "책"], "vocab.everyday_basics"),
]

# R3: a notice or a message -> a question on one piece of information.
R3 = [
 ("notice", "병원 진료 시간",
  ["평일: 오전 아홉 시부터 오후 여섯 시까지", "토요일: 오전 아홉 시부터 오후 한 시까지", "점심시간: 오후 한 시부터 두 시까지", "일요일과 공휴일에는 쉽니다."],
  "Thứ Bảy bệnh viện khám đến mấy giờ?", "Đến 1 giờ chiều", ["Đến 6 giờ chiều", "Đến 2 giờ chiều", "Đến 9 giờ sáng"]),
 ("notice", "우체국",
  ["소포 접수: 평일 오전 아홉 시부터 오후 다섯 시까지", "토요일과 일요일에는 문을 닫습니다.", "소포에 주소와 전화번호를 꼭 쓰세요."],
  "Khi gửi bưu kiện, phải làm gì?", "Ghi địa chỉ và số điện thoại", ["Mang theo hộ chiếu", "Trả bằng tiền mặt", "Đến trước 9 giờ sáng"]),
 ("message", "문자",
  ["란 씨, 이번 토요일에 시간 있어요?", "같이 산에 갈까요?", "아침 여덟 시에 역 앞에서 만나요.", "민수"],
  "Min-su hẹn gặp Lan ở đâu?", "Trước nhà ga", ["Trên núi", "Trước bưu điện", "Ở nhà Min-su"]),
 ("message", "문자",
  ["흐엉 씨, 내일 오후 세 시에 치과에 오세요.", "신분증을 꼭 가져오세요.", "치과"],
  "Hương cần mang theo gì?", "Giấy tờ tùy thân", ["Đơn thuốc", "Sổ tài khoản", "Tiền mặt"]),
 ("notice", "은행",
  ["평일 오전 아홉 시부터 오후 네 시까지", "송금 수수료: 5,000원", "환전은 삼 층에서 하세요."],
  "Muốn đổi tiền thì phải lên tầng mấy?", "Tầng 3", ["Tầng 1", "Tầng 2", "Tầng 4"]),
 ("message", "문자",
  ["투이 씨, 내일 비가 많이 올 거예요.", "그래서 공원에 안 가요.", "우리 집에서 같이 영화를 볼까요?", "지영"],
  "Ji-yeong rủ Thúy làm gì?", "Xem phim ở nhà Ji-yeong", ["Đi dạo ở công viên", "Xem phim ở rạp", "Đi ăn ở quán"]),
]

# R4: a short text -> the one true statement (a paraphrase).
R4 = [
 ("description", "제 취미",
  ["저는 운동을 좋아해요. 토요일 아침에는 수영장에서 운동해요. 일요일에는 친구하고 축구를 해요. 운동 후에는 같이 냉면을 먹어요."],
  "Chủ nhật, người viết chơi bóng đá với bạn.",
  ["Chủ nhật, người viết đi bể bơi một mình.", "Người viết không thích thể thao lắm.", "Sau khi tập, họ thường ăn cơm trộn."]),
 ("narrative", "지난 주말",
  ["지난 주말에 저는 부산에 갔어요. 고속버스로 다섯 시간 걸렸어요. 바다가 정말 아름다웠어요. 하지만 비가 와서 사진을 많이 못 찍었어요."],
  "Vì trời mưa nên người viết chụp được ít ảnh.",
  ["Người viết đi Busan bằng tàu hoả.", "Chuyến đi đến Busan mất ba tiếng.", "Cuối tuần đó trời nắng đẹp suốt."]),
 ("notice", "약국",
  ["이 약은 소화제예요.", "식사 후에 먹으세요.", "하루에 세 번 먹으세요.", "약을 먹을 때 술은 마시지 마세요."],
  "Phải uống thuốc này sau khi ăn.",
  ["Mỗi ngày chỉ uống thuốc một lần.", "Khi uống thuốc có thể uống rượu.", "Đây là thuốc giảm đau đầu."]),
 ("message", "문자",
  ["남 씨, 생일 축하합니다!", "오늘 저녁에 같이 노래방에 갈까요?", "일곱 시에 회사 앞에서 기다릴 거예요.", "호아"],
  "Hòa sẽ đợi Nam ở trước công ty.",
  ["Hôm nay là sinh nhật của Hòa.", "Hai người hẹn gặp lúc tám giờ.", "Tối nay hai người sẽ đi xem phim."]),
 ("description", "하노이의 날씨",
  ["하노이는 여름에 아주 더워요. 그리고 비도 자주 와요. 겨울에는 조금 추워요. 하지만 눈은 거의 안 와요."],
  "Mùa hè ở Hà Nội hay có mưa.",
  ["Mùa đông ở Hà Nội tuyết rơi nhiều.", "Mùa hè ở Hà Nội mát mẻ.", "Mùa đông ở Hà Nội rất nóng."]),
 ("narrative", "송금",
  ["저는 월급을 받으면 베트남의 부모님에게 돈을 보내요. 은행의 송금 수수료는 조금 비싸요. 그래서 요즘은 핸드폰으로 송금을 해요. 핸드폰으로 하면 빠르고 편해요."],
  "Dạo này người viết chuyển tiền bằng điện thoại.",
  ["Người viết gửi tiền cho bạn ở Hàn Quốc.", "Phí chuyển tiền ở ngân hàng rất rẻ.", "Chuyển tiền bằng điện thoại thì chậm."]),
 ("notice", "병원 접수",
  ["처음 오면 접수에서 신청서를 쓰세요.", "외국인 등록증이 꼭 필요해요.", "오늘 진료는 오후 여섯 시에 끝나요."],
  "Đến khám phải có thẻ đăng ký người nước ngoài.",
  ["Đến khám không cần giấy tờ gì.", "Hôm nay khám bệnh đến tám giờ tối.", "Đơn đăng ký phải viết ở nhà thuốc."]),
 ("narrative", "제 친구 마이 씨",
  ["제 친구 마이 씨는 다낭에서 왔어요. 우리는 한국어 수업에서 처음 만났어요. 마이 씨는 음식을 아주 잘 만들어요. 그래서 주말에 가끔 같이 쌀국수를 만들어요."],
  "Hai người quen nhau ở lớp tiếng Hàn.",
  ["Mai đến từ Hà Nội.", "Mai nấu ăn không giỏi.", "Cuối tuần họ hay ăn phở ở quán."]),
]

# R5: a longer text -> two questions.
R5 = [
 ("narrative", "감기",
  ["지난주 목요일에 저는 머리가 아프고 기침이 많이 났어요. 그래서 일찍 퇴근하고 회사 옆의 내과에 갔어요. "
   "병원에서 진료를 받고 주사를 맞았어요. 그리고 약국에서 약을 샀어요. 다음 날은 회사에 못 가고 집에서 쉬었어요. 지금은 다 나았어요."],
  [("Ở bệnh viện, người viết đã làm gì?", "Được khám bệnh và tiêm", ["Chỉ mua thuốc rồi về", "Được phẫu thuật", "Làm thêm giờ"]),
   ("Ngày hôm sau, người viết làm gì?", "Nghỉ ở nhà", ["Đi làm như thường lệ", "Đến bệnh viện lần nữa", "Đi chơi với bạn"])]),
 ("description", "은행 통장",
  ["한국에서 통장이 필요하면 은행에 가세요. 외국인 등록증과 여권이 필요해요. 은행은 평일 오전 아홉 시에 문을 열어요. "
   "그리고 오후 네 시에 문을 닫아요. 토요일과 일요일에는 문을 열지 않아요. 통장을 만들면 카드도 받을 수 있어요."],
  [("Muốn mở sổ tài khoản, cần mang gì?", "Thẻ cư trú và hộ chiếu", ["Hợp đồng lao động", "Bằng lái xe", "Chỉ cần tiền mặt"]),
   ("Lúc nào có thể đến ngân hàng?", "Mười giờ sáng thứ Hai", ["Chiều thứ Bảy", "Sáng Chủ nhật", "Năm giờ chiều thứ Sáu"])]),
 ("narrative", "엄마의 생일",
  ["다음 주에 엄마의 생일이 있어요. 그래서 어제 우체국에 갔어요. 베트남에 소포를 보내고 싶었어요. 옷과 과자를 상자에 넣었어요. "
   "직원이 주소를 확인했어요. 소포는 일주일 후에 도착할 거예요. 엄마가 선물을 좋아할 거예요."],
  [("Trong bưu kiện có gì?", "Quần áo và bánh kẹo", ["Quần áo và sách", "Thuốc và bánh kẹo", "Tiền và ảnh"]),
   ("Khi nào bưu kiện đến nơi?", "Sau một tuần", ["Ngày mai", "Sau một tháng", "Sau hai ngày"])]),
 ("description", "새 취미",
  ["저는 기숙사에서 혼자 살아요. 그래서 처음에는 조금 외로웠어요. 그런데 지난달부터 노래를 배워요. 매주 토요일 오후에 학교에서 수업이 있어요. "
   "선생님은 한국 사람이고 아주 친절해요. 수업에서 친구도 많이 만났어요. 이제 주말이 정말 재미있어요."],
  [("Người viết học hát khi nào?", "Chiều thứ Bảy hằng tuần", ["Sáng Chủ nhật hằng tuần", "Tối thứ Sáu hằng tuần", "Mỗi buổi tối"]),
   ("Vì sao bây giờ cuối tuần của người viết vui?", "Vì có lớp hát và nhiều bạn mới", ["Vì người viết vừa chuyển nhà", "Vì người viết được về quê", "Vì người viết có nhiều tiền"])]),
 ("narrative", "토요일",
  ["토요일 아침에 하늘이 맑았어요. 그래서 친구하고 공원에 갔어요. 공원에는 꽃이 많았어요. 우리는 사진을 많이 찍고 김밥을 먹었어요. "
   "그런데 오후에 갑자기 비가 왔어요. 우산이 없어서 편의점에서 우산을 샀어요. 그리고 집에 일찍 돌아갔어요."],
  [("Buổi chiều thời tiết thế nào?", "Đột nhiên trời mưa", ["Trời nắng đẹp", "Trời có tuyết", "Trời rất nóng"]),
   ("Người viết mua ô ở đâu?", "Ở cửa hàng tiện lợi", ["Ở công viên", "Ở chợ", "Ở siêu thị"])]),
 ("description", "제 친구 준호 씨",
  ["준호 씨는 제 한국 친구예요. 우리는 회사 동료예요. 준호 씨는 베트남 음식을 아주 좋아해요. 그래서 주말에 가끔 같이 베트남 식당에 가요. "
   "준호 씨는 쌀국수를 제일 좋아해요. 저는 준호 씨에게 베트남어를 가르쳐요. 그리고 준호 씨는 저에게 한국어를 가르쳐요."],
  [("Jun-ho thích món nào nhất?", "Phở", ["Kim chi", "Cơm trộn", "Mì lạnh"]),
   ("Hai người giúp nhau thế nào?", "Dạy ngôn ngữ cho nhau", ["Nấu ăn cho nhau", "Cho nhau mượn tiền", "Đưa nhau đi làm"])]),
]

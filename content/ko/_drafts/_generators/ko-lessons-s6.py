"""ko-vi Section 6 lessons (talk with someone): the shop and the restaurant (unit s), asking the way (t), the clinic and
the pharmacy (u), phoning work and the bank (v). Session 2 writes the lesson-internal exercise types; the scenarios
(partner turns read by the device voice, learner turns through the ko-KR recogniser) join these lessons in session 4.
Writes lessons/parts/s6.jsonl. usage: python -I ko-lessons-s6.py <repo root>"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ko_lesson_lib import C, F, H, K, M, N, NX, T, TX, W, Y, finish, lesson

# ---------------------------------------------------------------- us: the shop and the restaurant
lesson("us-l0", [
    C("requests"),
    T("식당", ["가게", "편의점", "시장"]), N("메뉴", ["음식", "식당", "영수증"]),
    TX("어서 오세요. 몇 분이세요?", "Xin mời vào. Anh chị mấy người ạ?", ["Xin mời vào. Anh chị ăn gì ạ?", "Tạm biệt. Hẹn gặp lại.", "Xin mời vào. Mấy giờ rồi ạ?"]),
    NX("Bạn gọi nhân viên quán:", "여기요!", ["어서 오세요!", "안녕히 가세요!", "잘 먹었습니다!"]),
    F("비빔밥 하나 ___.", "주세요", ["드세요", "먹어요", "있어요"], "Cho tôi một bát cơm trộn."),
    Y("Cho tôi thực đơn.", "메뉴 주세요.", "메뉴 좀 주세요."),
    W("Hai người ạ.", "두|명이에요", ["둘", "이"]),
    M("비빔밥", "불고기", "김치찌개", "떡볶이"),
])
lesson("us-l1", [
    T("맵다", ["짜다", "달다", "맛있다"]),
    F("이 음식은 ___?", "매워요", ["맵어요", "맵다", "매운"], "Món này có cay không?"),
    NX("Món này không cay.", "이 음식은 안 매워요.", ["이 음식은 안 맵어요.", "이 음식은 못 매워요.", "이 음식은 매워요."]),
    TX("김치찌개가 조금 매워요.", "Canh kim chi hơi cay.", ["Canh kim chi rất ngọt.", "Canh kim chi không cay.", "Canh kim chi hơi mặn."]),
    Y("Món này cay.", "이 음식은 매워요."),
    W("Cho tôi hai cốc bia.", "맥주|두|잔|주세요", ["둘", "병"]),
    M("맵다", "짜다", "달다", "맛없다"),
])
lesson("us-l2", [
    C("want-like"),
    TX("뭐 먹고 싶어요?", "Bạn muốn ăn gì?", ["Bạn đã ăn gì?", "Bạn có đói không?", "Bạn thích món gì?"]),
    F("저는 불고기를 먹고 ___.", "싶어요", ["싶다", "있어요", "싶어서"], "Tôi muốn ăn thịt bò xào."),
    NX("Tôi muốn uống nước ép.", "주스를 마시고 싶어요.", ["주스를 마시고 싶다.", "주스를 마셨어요.", "주스를 팔고 싶어요."]),
    Y("Tôi muốn ăn cơm trộn.", "비빔밥을 먹고 싶어요."),
    W("Tôi muốn ăn món Hàn Quốc.", "한국|음식을|먹고|싶어요", ["마시고", "먹어요"]),
    M("식당", "메뉴", "음식", "맥주", "주스"),
])
lesson("us-l3", [
    TX("잘 먹었습니다.", "Cảm ơn, bữa ăn ngon quá.", ["Tôi xin phép ăn.", "Tôi no rồi.", "Món này ngon không?"]),
    F("계산___ 주세요.", "해", ["하", "했", "할"], "Tính tiền giúp tôi."),
    NX("Bạn muốn trả tiền ở quán. Bạn nói:", "계산해 주세요.", ["계산했어요.", "계산할 거예요?", "계산하지 마세요."]),
    Y("Cho tôi xin chút nước.", "물 좀 주세요.", "물 주세요."),
    W("Cảm ơn, bữa ăn ngon quá.", "잘|먹었습니다", ["잘못", "먹겠습니다"]),
    M("여기요", "어서 오세요", "잘 먹겠습니다", "잘 먹었습니다"),
])

# ---------------------------------------------------------------- ut: asking the way
lesson("ut-l0", [
    C("e-eseo"),
    T("오른쪽", ["왼쪽", "앞", "뒤"]), N("왼쪽", ["오른쪽", "옆", "앞"]),
    TX("똑바로 가세요.", "Hãy đi thẳng.", ["Hãy rẽ trái.", "Hãy rẽ phải.", "Hãy quay lại."]),
    F("은행은 우체국 ___에 있어요.", "옆", ["앞", "뒤", "왼쪽"], "Ngân hàng ở bên cạnh bưu điện."),
    NX("Hãy rẽ phải.", "오른쪽으로 가세요.", ["오른쪽로 가세요.", "왼쪽으로 가세요.", "오른쪽에서 가세요."]),
    Y("Hãy đi thẳng.", "똑바로 가세요."),
    W("Ga ở bên trái.", "역은|왼쪽에|있어요", ["오른쪽에", "역을"]),
    M("오른쪽", "왼쪽", "앞", "뒤", "옆"),
])
lesson("ut-l1", [
    C("question-words"),
    TX("병원이 어디에 있어요?", "Bệnh viện ở đâu?", ["Bệnh viện có xa không?", "Bệnh viện mở cửa lúc mấy giờ?", "Đây là bệnh viện à?"]),
    F("약국에 ___ 가요?", "어떻게", ["어디", "누구", "언제"], "Đi đến nhà thuốc như thế nào?"),
    NX("Từ đây có gần không?", "여기에서 가까워요?", ["여기에서 가깝어요?", "여기에서 멀어요?", "여기에서 가까웠어요?"]),
    Y("Ga ở đâu?", "역이 어디예요?", "역이 어디에 있어요?", "역 어디예요?"),
    W("Đi đến đó như thế nào?", "거기에|어떻게|가요", ["어디", "누구"]),
    T("길", ["지도", "거리", "도시"]),
])
lesson("ut-l2", [
    T("가깝다", ["멀다", "크다", "작다"]),
    F("역은 여기에서 ___.", "멀어요", ["멀아요", "멀다", "가깝어요"], "Ga xa chỗ này."),
    K("역까지 ___.", "걷다", "haeyo:pre", "Tôi đi bộ đến ga."),
    NX("Đi bộ mười phút.", "십 분 걸어요.", ["열 분 걸어요.", "십 분 걷어요.", "십 시간 걸어요."]),
    Y("Đi bộ mất mười phút.", "걸어서 십 분 걸려요."),
    W("Bưu điện ở gần.", "우체국이|가까워요", ["우체국을", "멀어요"]),
    M("가깝다", "멀다", "걷다", "길"),
])
lesson("ut-l3", [
    TX("다음 사거리에서 왼쪽으로 가세요.", "Đến ngã tư tiếp theo thì rẽ trái.", ["Đến ngã tư tiếp theo thì rẽ phải.", "Đi thẳng qua ngã tư.", "Ngã tư ở bên trái."]),
    F("은행 ___에서 만나요.", "앞", ["위", "아래", "밖"], "Gặp nhau trước ngân hàng."),
    NX("Đến đằng kia thì rẽ trái.", "저기에서 왼쪽으로 가세요.", ["저기에서 오른쪽으로 가세요.", "여기에서 왼쪽으로 가세요.", "저기에서 똑바로 가세요."]),
    Y("Hãy rẽ trái.", "왼쪽으로 가세요.", "왼쪽으로 도세요."),
    W("Đi thẳng rồi rẽ phải.", "똑바로|가서|오른쪽으로|가세요", ["왼쪽으로", "와서"]),
    M("앞", "뒤", "옆", "위", "아래"),
])

# ---------------------------------------------------------------- uu: the clinic and the pharmacy
lesson("uu-l0", [
    C("subject-i-ga"),
    T("머리", ["배", "목", "손"]), N("배", ["머리", "발", "손"]),
    F("목___ 아파요.", "이", ["을", "가", "에"], "Tôi đau họng."),
    NX("Tôi bị đau bụng.", "배가 아파요.", ["배를 아파요.", "배가 아퍼요.", "머리가 아파요."]),
    TX("기침을 해요.", "Tôi bị ho.", ["Tôi bị cảm.", "Tôi bị đau họng.", "Tôi bị sốt."]),
    Y("Tôi đau đầu.", "머리가 아파요."),
    W("Tay tôi đau.", "손이|아파요", ["손을", "발이"]),
    M("머리", "배", "목", "손", "발"),
])
lesson("uu-l1", [
    T("약국", ["병원", "약", "의사"]),
    TX("이 약을 하루에 세 번 드세요.", "Thuốc này uống một ngày ba lần.", ["Thuốc này uống một ngày hai lần.", "Thuốc này uống trước khi ngủ.", "Một ngày uống ba viên."]),
    F("하루에 두 ___ 드세요.", "번", ["개", "명", "장"], "Uống một ngày hai lần."),
    NX("Tôi bị cảm. Có thuốc không?", "감기에 걸렸어요. 약 있어요?", ["감기를 걸렸어요. 약 있어요?", "감기에 걸렸어요. 약 없어요?", "감기에 걸려요. 약 있었어요?"]),
    Y("Cho tôi thuốc.", "약 주세요.", "약 좀 주세요."),
    W("Tôi bị ho.", "기침을|해요", ["기침이", "아파요"]),
    M("약국", "약", "의사", "기침", "보험"),
])
lesson("uu-l2", [
    TX("어디가 아프세요?", "Anh đau ở đâu?", ["Anh đi đâu đấy?", "Anh có sao không?", "Anh đau từ khi nào?"]),
    F("어제부터 머리가 ___.", "아파요", ["아플게요", "아프세요", "아퍼요"], "Tôi đau đầu từ hôm qua."),
    NX("Tôi có bảo hiểm.", "보험이 있어요.", ["보험을 있어요.", "보험이 없어요.", "보험이 있었어요?"]),
    Y("Tôi đau chân.", "발이 아파요.", "다리가 아파요."),
    W("Tôi đau họng và ho.", "목이|아프고|기침을|해요", ["목을", "아파요"]),
    M("의사", "환자", "간호사", "약"),
])
lesson("uu-l3", [
    TX("보험 카드 있으세요?", "Anh có thẻ bảo hiểm không?", ["Anh có thẻ ngân hàng không?", "Anh có hộ chiếu không?", "Anh trả bằng thẻ à?"]),
    F("접수는 ___에서 해요.", "저기", ["누구", "언제", "몇"], "Đăng ký ở đằng kia."),
    NX("Tôi bị thương ở tay.", "손을 다쳤어요.", ["손이 다쳤어요.", "손을 다칠게요.", "발을 다쳤어요."]),
    Y("Tôi bị thương ở chân.", "발을 다쳤어요.", "다리를 다쳤어요."),
    K("약국에서 약을 ___.", "사다", "haeyo:pas", "Tôi đã mua thuốc ở nhà thuốc."),
    W("Hãy uống thuốc này.", "이|약을|드세요", ["약이", "마세요"]),
    M("손", "발", "다리", "허리"),
])

# ---------------------------------------------------------------- uv: phoning work and the bank
lesson("uv-l0", [
    C("small-particles"),
    T("핸드폰", ["충전기", "컴퓨터", "인터넷"]), N("충전기", ["핸드폰", "비밀번호", "컴퓨터"]),
    TX("여보세요? 민수 씨예요?", "Alô? Anh Min-su phải không?", ["Alô? Anh Min-su đi đâu đấy?", "Xin chào, tôi là Min-su.", "Anh Min-su gọi cho tôi nhé."]),
    NX("Bạn nghe điện thoại. Câu đầu tiên:", "여보세요?", ["어서 오세요.", "안녕히 계세요.", "잘 먹겠습니다."]),
    F("충전기___ 있어요?", "가", ["이", "를", "을"], "Bạn có cục sạc không?"),
    Y("Alô, tôi là Nam.", "여보세요, 저는 남이에요.", "여보세요, 남이에요.", "여보세요, 남입니다."),
    W("Tôi sẽ gọi lại.", "다시|전화할게요", ["전화했어요", "문자"]),
    M("핸드폰", "충전기", "인터넷", "컴퓨터", "비밀번호"),
])
lesson("uv-l1", [
    TX("반장님, 오늘 회사에 못 가요.", "Tổ trưởng ơi, hôm nay tôi không đến công ty được.", ["Tổ trưởng ơi, hôm nay tôi đến muộn.", "Tổ trưởng ơi, hôm nay tôi không muốn đi.", "Tổ trưởng ơi, mai tôi đến công ty."]),
    F("반장님, 지금 전화___ 괜찮으세요?", "해도", ["하도", "해서", "했도"], "Tổ trưởng ơi, bây giờ tôi gọi điện có tiện không ạ?"),
    NX("Bạn gọi cho tổ trưởng, xin nghỉ vì ốm. Bạn nói:", "반장님, 아파서 오늘 쉬고 싶어요.", ["반장님, 아파서 오늘 쉬었어요.", "반장님, 아파서 오늘 쉴까요?", "반장님, 아프고 오늘 쉬고 싶어요."]),
    Y("Hôm nay tôi không đến được.", "오늘 못 가요.", "오늘은 못 가요."),
    W("Xin lỗi, tôi đến muộn mười phút.", "죄송합니다|십|분|늦어요", ["열", "일찍"]),
    M("전화하다", "문자", "여보세요", "전화"),
])
lesson("uv-l2", [
    T("비밀번호", ["번호", "전화번호", "주소"]),
    TX("통장을 만들고 싶어요.", "Tôi muốn mở sổ tài khoản.", ["Tôi muốn rút tiền.", "Tôi muốn đổi tiền.", "Tôi làm mất sổ tài khoản."]),
    F("베트남에 돈을 ___ 싶어요.", "보내고", ["보내서", "보냈고", "받고"], "Tôi muốn gửi tiền về Việt Nam."),
    NX("Mật khẩu là gì?", "비밀번호가 뭐예요?", ["비밀번호를 뭐예요?", "비밀번호가 누구예요?", "전화번호가 뭐예요?"]),
    Y("Tôi muốn gửi tiền.", "돈을 보내고 싶어요."),
    W("Tôi muốn mở tài khoản.", "계좌를|만들고|싶어요", ["계좌가", "만들어요"]),
    M("은행", "계좌", "통장", "송금"),
])
lesson("uv-l3", [
    TX("인터넷이 안 돼요.", "Internet không vào được.", ["Tôi không có internet.", "Internet chậm.", "Hãy tắt internet."]),
    F("핸드폰을 ___ 싶어요.", "충전하고", ["충전해고", "충전해서", "충전했고"], "Tôi muốn sạc điện thoại."),
    NX("Tôi làm mất điện thoại.", "핸드폰을 잃어버렸어요.", ["핸드폰이 잃어버렸어요.", "핸드폰을 잊어버렸어요.", "핸드폰을 잃어버릴게요."]),
    Y("Internet không vào được.", "인터넷이 안 돼요."),
    K("컴퓨터를 ___.", "켜다", "haeyo:pas", "Tôi đã bật máy tính."),
    W("Cho tôi mượn cục sạc.", "충전기|좀|빌려주세요", ["빌려요", "사요"]),
    M("인터넷", "컴퓨터", "핸드폰", "충전기"),
])
finish("s6")

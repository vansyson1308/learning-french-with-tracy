"""en-vi sections 3 to 6 lessons: listening and reading, speaking, writing, conversation. Ids follow en_lesson_refs.py, and the end of
this file fails if a lesson leaves out an id mapped to it. A speech item re-used in a review lesson names one more objective, so the
two exercises are not one payload. Appends to lessons/OUTPUT.jsonl. usage: python -I en-lessons-s3.py <repo root>"""
import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from en_lesson_lib import C, D, F, H, IX, J, LC, M, MP, N, NX, PROBLEMS, RC, RECORDS, SP, T, TX, W, WR, WT, Y, finish, lesson
from en_lesson_refs import REFS

Q = "Bạn nghe thấy gì?"
MEAN = "Câu này nghĩa là gì?"
# ---------------------------------------------------------------- Section 3: uf
lesson("uf-l0", [
    LC("uf_thank_you", MEAN, "Cảm ơn.", ["Xin lỗi.", "Tạm biệt.", "Không có gì."]), LC("uf_excuse_me", "Bạn nói câu này khi nào?", "khi muốn hỏi ai đó hoặc xin đi qua", ["khi đi ngủ", "khi nhận quà", "khi ăn xong"]), LC("uf_of_course", MEAN, "Tất nhiên.", ["Có lẽ.", "Không bao giờ.", "Tôi không biết."]),
    D("uf_thank_you", "Thank you."), T("word", ["slow", "repeat", "hear"]), M("listen", "word", "repeat", "slow", "understand"),
])
lesson("uf-l1", [
    LC("uf_a_teacher", Q, "một giáo viên", ["một bác sĩ", "một công nhân", "một sinh viên"]), LC("uf_a_doctor", Q, "một bác sĩ", ["một giáo viên", "một y tá", "một tài xế"]), LC("uf_the_door", Q, "cửa ra vào", ["cửa sổ", "chìa khóa", "cái bàn"]), LC("uf_a_key", Q, "một chiếc chìa khóa", ["một cái cửa", "một quyển sách", "một cái túi"]), LC("uf_the_window", Q, "cửa sổ", ["cửa ra vào", "bức tường", "sàn nhà"]),
    RC("uf_desk", "Trên bàn có mấy quyển sách?", "hai quyển", ["một quyển", "ba quyển", "bốn quyển"]), RC("uf_desk", "Trên bàn có đồ uống gì?", "một tách trà", ["một ly nước", "một tách cà phê", "một chai bia"]), D("uf_a_key", "a key", "key"),
])
lesson("uf-l2", [
    LC("uf_what_time", "Người nói muốn biết gì?", "bây giờ là mấy giờ", ["hôm nay là thứ mấy", "nhà ga ở đâu", "vé giá bao nhiêu"]), LC("uf_not_understand", MEAN, "Tôi không hiểu.", ["Tôi không biết bạn.", "Tôi không nghe thấy.", "Tôi hiểu rồi."]), LC("uf_say_again", "Người nói muốn bạn làm gì?", "nói lại một lần nữa", ["nói nhanh hơn", "viết xuống", "đi ra ngoài"]), LC("uf_speak_slowly", "Người nói muốn bạn làm gì?", "nói chậm thôi", ["nói to lên", "nói lại", "đọc to"]), LC("uf_how_spell", "Người nói hỏi gì?", "cách đánh vần từ đó", ["nghĩa của từ đó", "cách đọc từ đó", "từ đó ở trang nào"]), LC("uf_what_mean", "Người nói hỏi gì?", "từ hoặc câu đó có nghĩa là gì", ["cái đó giá bao nhiêu", "cái đó ở đâu", "ai nói câu đó"]),
    C("stress-weak-forms"), D("uf_not_understand", "I don't understand.", "I do not understand."), F("Please ___ it again.", "say", ["hear", "listen", "word"], "Làm ơn nói lại lần nữa."),
    M("tell", "read", "spell", "end", "listen"),
])
lesson("uf-l3", [
    RC("uf_card", "Người này tên là gì?", "Mai", ["Tran", "Hanoi", "Lan"]), RC("uf_card", "Người này làm gì?", "là sinh viên", ["là giáo viên", "là công nhân", "là y tá"]), RC("uf_card", "Người này ở đâu?", "Hà Nội", ["Huế", "Đà Nẵng", "London"]),
    M("thing", "idea", "world", "life", "reason"), N("learn", ["teach", "write", "speak"]), N("teach", ["learn", "read", "say"]), F("I ___ English every day.", "learn", ["word", "noise", "news"], "Mỗi ngày tôi học tiếng Anh."), F("My mother is a teacher. She ___ English.", "teaches", ["learns", "reads", "hears"], "Mẹ tôi là giáo viên. Bà dạy tiếng Anh."), H("news", ["noise", "word", "way"]), T("news", ["world", "side", "example"]),
    M("thing", "reason", "world", "word", "news"),
])
# ---------------------------------------------------------------- ug
lesson("ug-l0", [
    RC("ug_msg_lan", "Lan đang ở đâu?", "ở quán cà phê gần nhà ga", ["ở nhà ga", "ở nhà", "ở chỗ làm"]), RC("ug_msg_lan", "Lan hỏi Minh điều gì?", "Minh có đến được lúc ba giờ không", ["Minh có tiền không", "Minh sống ở đâu", "Minh tên là gì"]), RC("ug_msg_tom", "Cuộc họp lúc mấy giờ?", "10 giờ ngày mai", ["9 giờ ngày mai", "10 giờ hôm nay", "9 giờ hôm nay"]), RC("ug_msg_tom", "Tom muốn Hoa làm gì?", "mang báo cáo đến", ["viết báo cáo", "gọi điện cho Tom", "đi họp lúc 9 giờ"]),
    T("message", ["important", "safe", "open"]), N("important", ["careful", "dangerous", "safe"]),
])
lesson("ug-l1", [
    RC("ug_signs", "Bạn muốn đi ra khỏi nhà ga. Bạn đi theo biển nào?", "Exit", ["Entrance", "No smoking", "Restrooms"]), RC("ug_signs", "Nhà vệ sinh ở phía nào?", "bên trái", ["bên phải", "ở lối vào", "ở lối ra"]), RC("ug_signs", "Biển nào cấm hút thuốc?", "No smoking", ["Entrance", "Exit", "Restrooms"]), RC("ug_post", "Hôm nay bưu điện thế nào?", "đóng cửa", ["mở cửa cả ngày", "mở cửa lúc 9 giờ", "mở cửa đến 9 giờ"]), RC("ug_post", "Ngày mai bưu điện mở cửa lúc mấy giờ?", "9 giờ", ["8 giờ", "10 giờ", "12 giờ"]), M("entrance", "exit", "open", "closed", "smoke"),
])
lesson("ug-l2", [
    RC("ug_hours", "Thứ Bảy chợ mở cửa đến mấy giờ?", "12 giờ", ["6 giờ", "8 giờ", "đóng cửa cả ngày"]), RC("ug_hours", "Ngày nào chợ đóng cửa?", "Chủ nhật", ["thứ Hai", "thứ Sáu", "thứ Bảy"]), RC("ug_shift", "Ca sáng bắt đầu lúc mấy giờ?", "6 giờ", ["8 giờ", "2 giờ", "10 giờ"]), RC("ug_shift", "Công nhân phải đến sớm bao lâu?", "mười phút", ["một tiếng", "hai phút", "nửa tiếng"]),
    T("safe", ["dangerous", "important", "closed"]), F("This street is not ___ at night.", "safe", ["message", "smoke", "exit"], "Con phố này không an toàn vào ban đêm."),
])
lesson("ug-l3", [
    RC("ug_rules", "Công nhân phải đeo gì?", "găng tay và mũ bảo hộ", ["chỉ găng tay", "chỉ mũ bảo hộ", "kính và găng tay"]), RC("ug_rules", "Công nhân không được làm gì?", "chạm vào máy", ["đội mũ", "rửa tay", "ăn trưa"]), RC("ug_rules", "Khi nào phải rửa tay?", "trước bữa trưa", ["sau bữa trưa", "trước khi về nhà", "sau khi hút thuốc"]), N("careful", ["safe", "closed", "open"]), W("Đây là một tin nhắn quan trọng.", "This is an important message.", ["a", "are"]), Y("Cẩn thận!", "Be careful!", "Careful!"),
])
# ---------------------------------------------------------------- uh
lesson("uh-l0", [
    C("numbers-time-prices"), LC("uh_train_hanoi", "Tàu đi Hà Nội chạy lúc mấy giờ?", "8 giờ", ["2 giờ", "10 giờ", "7 giờ"]), LC("uh_train_late", "Tàu từ Huế thế nào?", "đến muộn mười phút", ["đến sớm mười phút", "bị hủy", "đến đúng giờ"]), LC("uh_flight", "Chuyến bay đi đâu?", "Sydney", ["Hà Nội", "London", "Huế"]), LC("uh_flight", "Chuyến bay khởi hành lúc mấy giờ?", "9 giờ 30", ["9 giờ 13", "8 giờ 30", "9 giờ 21"]), LC("uh_bus_seven", "Bao lâu nữa xe buýt đến?", "ba phút", ["bảy phút", "mười phút", "năm phút"]), N("flight", ["late", "school", "class"]),
])
lesson("uh-l1", [
    LC("uh_shop_close", "Cửa hàng sẽ làm gì trong năm phút nữa?", "đóng cửa", ["mở cửa", "giảm giá", "chuyển tầng"]), LC("uh_shop_close", "Người ta yêu cầu bạn làm gì?", "trả tiền ngay", ["chờ ở đây", "đi ra lối khác", "quay lại ngày mai"]), LC("uh_shop_floor", "Giày ở tầng mấy?", "tầng hai", ["tầng một", "tầng ba", "tầng mười"]), LC("uh_coffee_price", "Cà phê giá bao nhiêu?", "2 đô la", ["3 đô la", "20 đô la", "12 đô la"]),
    D("uh_coffee_price", "The coffee costs two dollars.", "The coffee costs 2 dollars."), T("wait", ["walk", "stop", "drive"]),
])
lesson("uh-l2", [
    LC("uh_press", "Nhấn nút màu gì để chạy máy?", "màu xanh lá", ["màu đỏ", "màu đen", "màu vàng"]), LC("uh_stop", "Bạn phải làm gì?", "dừng máy và gọi quản lý", ["chạy máy và gọi quản lý", "dừng máy và về nhà", "sửa máy"]), LC("uh_gloves", "Bạn phải đeo gì?", "găng tay và mũ bảo hộ", ["găng tay và kính", "chỉ mũ bảo hộ", "đồng phục"]), D("uh_stop", "Stop the machine and call the manager."), M("press", "push", "pull", "lift", "touch"), F("___ the door to open it.", "Push", ["Fly", "Answer", "Follow"], "Đẩy cửa để mở."), Y("Làm ơn đợi ở đây.", "Please wait here.", "Wait here, please."),
])
lesson("uh-l3", [
    LC("uh_ticket_price", "Vé giá bao nhiêu?", "20 đô la", ["2 đô la", "12 đô la", "30 đô la"]), LC("uh_meeting_time", "Cuộc họp lúc mấy giờ?", "9 giờ rưỡi", ["10 giờ rưỡi", "9 giờ", "8 giờ rưỡi"]), LC("uh_shift_end", "Ca sáng kết thúc lúc mấy giờ?", "2 giờ", ["12 giờ", "8 giờ", "10 giờ"]), M("school", "class", "lesson", "exam", "test"), F("Please open your book to ___ ten.", "page", ["letter", "answer", "class"], "Hãy mở sách ở trang mười."), TX("Can you fix this machine?", "Bạn sửa được cái máy này không?", ["Bạn mua được cái máy này không?", "Cái máy này có đắt không?", "Bạn có dùng cái máy này không?"]),
    M("check", "fix", "lift", "pull", "ride"), M("lesson", "test", "page", "answer", "exam"), N("answer", ["sentence", "page", "exam"]),
])
# ---------------------------------------------------------------- ui
lesson("ui-l0", [
    LC("ui_meet", "Hai người đang làm gì?", "làm quen với nhau", ["chào tạm biệt", "hỏi đường", "mua hàng"]), LC("ui_how", "Người thứ hai thế nào?", "khỏe", ["ốm", "mệt", "đói"]), RC("ui_new_worker", "Minh là ai?", "công nhân mới", ["quản lý", "giáo viên", "khách hàng"]), RC("ui_new_worker", "Anna nói gì sau khi Minh nói tên?", "Rất vui được gặp bạn.", ["Tạm biệt.", "Bạn bao nhiêu tuổi?", "Xin lỗi."]), M("how are you", "nice to meet you", "see you", "of course", "you're welcome"), Y("Bạn có khỏe không?", "How are you?"),
])
lesson("ui-l1", [
    C("wh-questions"), LC("ui_order", "Khách muốn gì?", "một ly cà phê", ["một ly trà", "một ly nước", "bánh mì"]), LC("ui_pay", "Phải trả bao nhiêu tiền?", "4 đô la", ["14 đô la", "40 đô la", "2 đô la"]), LC("ui_pay", "Khách trả bằng thẻ được không?", "được", ["không được", "chỉ trả tiền mặt", "phải trả sau"]), LC("ui_time", "Bây giờ là mấy giờ?", "2 giờ rưỡi", ["3 giờ rưỡi", "2 giờ", "12 giờ rưỡi"]), RC("ui_at_shop", "Tom hỏi gì?", "giá của cái túi", ["giờ mở cửa", "tên của Lan", "đường đến cửa hàng"]), RC("ui_at_shop", "Cái túi giá bao nhiêu?", "10 đô la", ["2 đô la", "20 đô la", "12 đô la"]),
])
lesson("ui-l2", [
    LC("ui_box", "Người thứ nhất muốn đặt cái thùng ở đâu?", "cạnh cửa", ["trên bàn", "trong bếp", "dưới sàn nhà"]), LC("ui_late", "Vì sao người đó đến muộn?", "xe buýt đến muộn", ["người đó ngủ dậy muộn", "người đó bị ốm", "tàu đến muộn"]), LC("ui_hold", "Người gọi muốn nói chuyện với ai?", "ông Brown", ["bà Brown", "ông Smith", "bà Lee"]), T("hold on", ["see you", "of course", "here"]), F("I don't have ___.", "anything", ["something", "it", "up"], "Tôi không có gì cả."), TX("There is nothing here.", "Ở đây không có gì cả.", ["Ở đây có mọi thứ.", "Ở đây có một cái gì đó.", "Ở đó không có ai."]),
])
lesson("ui-l3", [
    LC("ui_welcome", "Người thứ hai nói gì sau lời cảm ơn?", "Không có gì.", ["Xin lỗi.", "Tạm biệt.", "Chờ một chút."]), RC("ui_sorry", "Vì sao Mai không đi họp?", "Mai bị ốm", ["Mai bận", "Mai đến muộn", "Mai đi Hà Nội"]), RC("ui_sorry", "Khi nào Mai gặp lại Tom?", "thứ Hai", ["hôm nay", "ngày mai", "thứ Sáu"]), M("up", "down", "out", "back", "away"), NX("Đợi tôi ở đây.", "Wait for me here.", ["Wait me here.", "Wait for I here.", "Wait here me."]), Y("Xin chờ một chút.", "Hold on, please.", "Please hold on.", "Please wait.", "Wait, please.", "One moment, please."),
    M("anything", "away", "down", "nothing", "out"),
])
# ---------------------------------------------------------------- uj
lesson("uj-l0", [
    RC("uj_nam_day", "Nam làm việc ở đâu?", "ở một nhà máy", ["ở một bệnh viện", "ở một trường học", "ở nhà"]), RC("uj_nam_day", "Ca làm của Nam bắt đầu lúc mấy giờ?", "7 giờ", ["6 giờ", "8 giờ", "9 giờ"]), RC("uj_saturday", "Thứ Bảy Tom thức dậy thế nào?", "muộn", ["sớm", "lúc 6 giờ", "không dậy"]), RC("uj_saturday", "Buổi tối Tom làm gì?", "xem một bộ phim", ["chơi bóng đá", "uống cà phê", "đi làm"]), LC("uj_nam_bus", "Nam đi làm bằng gì?", "xe buýt", ["tàu hỏa", "xe máy", "ô tô"]), LC("uj_tom_soccer", "Tom chơi bóng đá với ai?", "với bạn bè", ["với bố", "với con trai", "một mình"]),
])
lesson("uj-l1", [
    RC("uj_nam_family", "Vợ của Nam làm nghề gì?", "y tá", ["giáo viên", "công nhân", "bác sĩ"]), RC("uj_nam_family", "Con trai của Nam bao nhiêu tuổi?", "10 tuổi", ["6 tuổi", "16 tuổi", "12 tuổi"]), RC("uj_nam_family", "Gia đình Nam nuôi con gì?", "một con mèo", ["một con chó", "một con chim", "không nuôi con gì"]), LC("uj_nam_wife", "Câu này nói về ai?", "vợ của Nam", ["mẹ của Nam", "con gái của Nam", "chị của Nam"]),
    F("Lan is ___ late.", "always", ["every", "then", "ago"], "Lan luôn đến muộn."), F("I ___ eat meat.", "never", ["ago", "yesterday", "once"], "Tôi không bao giờ ăn thịt."), M("always", "usually", "often", "sometimes", "never"), Y("Tôi thường uống trà.", "I usually drink tea.", "I often drink tea.", "Usually I drink tea."),
    M("ago", "often", "sometimes", "when", "always"),
])
lesson("uj-l2", [
    C("past-did"), RC("uj_yesterday", "Hôm qua Lan có đi làm không?", "không", ["có", "đi nửa ngày", "đi cả ngày"]), RC("uj_yesterday", "Lan đã đi thăm ai?", "mẹ của cô ấy", ["bố của cô ấy", "bạn của cô ấy", "sếp của cô ấy"]), RC("uj_yesterday", "Họ đã nấu món gì?", "cá và cơm", ["gà và cơm", "phở", "súp"]), LC("uj_lan_mother", "Chuyện này xảy ra khi nào?", "hôm qua", ["hôm nay", "ngày mai", "tuần sau"]), J("Yesterday Lan ___ her mother at home.", "see", "pas:s", "Hôm qua Lan đã gặp mẹ ở nhà."), F("I saw him two days ___.", "ago", ["now", "tomorrow", "soon"], "Tôi đã gặp anh ấy cách đây hai ngày."),
])
lesson("uj-l3", [
    RC("uj_station", "Bây giờ là mấy giờ?", "7 giờ", ["8 giờ", "6 giờ", "9 giờ"]), RC("uj_station", "Người phụ nữ làm gì?", "mua một cái vé", ["ăn một quả chuối", "lên tàu", "đợi xe buýt"]), RC("uj_office", "Văn phòng ở tầng mấy?", "tầng ba", ["tầng một", "tầng hai", "tầng mười"]), RC("uj_office", "Phòng của quản lý ở đâu?", "cạnh cầu thang", ["cạnh nhà bếp", "ở tầng hai", "cạnh máy in"]), LC("uj_station", "Người phụ nữ mua vé ở đâu?", "ở nhà ga", ["ở sân bay", "ở chợ", "trên xe buýt"]),
    D("uj_station", "A woman buys a ticket at the station."), M("sun", "rain", "wind", "weather", "sea"), M("mountain", "river", "tree", "flower", "beach"), F("The ___ is cold today.", "weather", ["tree", "flower", "river"], "Hôm nay thời tiết lạnh."), TX("It is hot and dry in summer.", "Mùa hè nóng và khô.", ["Mùa hè lạnh và ướt.", "Mùa đông nóng và khô.", "Mùa hè ấm và có mưa."]),
    M("beach", "flower", "mountain", "river", "rain"), M("sun", "wind", "sea", "dry", "twice"),
])
# ---------------------------------------------------------------- Section 4: uk
lesson("uk-l0", [
    SP("k_rep_hello"), SP("k_greet_morning"), TX("Good afternoon!", "Chào buổi chiều!", ["Chào buổi sáng!", "Chúc ngủ ngon!", "Tạm biệt!"]), N("good evening", ["good morning", "good afternoon", "goodbye"]), Y("Chào buổi tối!", "Good evening!"),
])
lesson("uk-l1", [
    C("politeness"), SP("k_rep_thanks"), SP("k_thank"), SP("k_rep_sorry"), NX("Bạn giúp tôi được không?", "Could you help me, please?", ["You help me?", "Help me you could?", "Could you helps me?"]), Y("Cảm ơn bạn rất nhiều!", "Thank you very much!", "Thanks a lot!", "Thank you so much!", "Thanks very much!"),
])
lesson("uk-l2", [
    SP("k_rep_evening"), SP("k_greet_evening"), SP("k_bye"), SP("k_excuse"), F("___ to our company!", "Welcome", ["Thanks", "Sorry", "Goodbye"], "Chào mừng bạn đến công ty chúng tôi!"),
])
lesson("uk-l3", [
    SP("k_greet_morning", ["greetings.basic"]), SP("k_thank", ["greetings.basic"]), SP("k_bye", ["greetings.basic"]), M("good morning", "good afternoon", "good evening", "good night", "welcome"), Y("Xin lỗi, tôi đến muộn.", "Sorry, I'm late.", "I'm sorry, I'm late.", "Sorry I am late."),
])
# ---------------------------------------------------------------- ul
lesson("ul-l0", [
    SP("l_rep_name"), SP("l_name"), SP("l_rep_from"), SP("l_from"), W("Tôi đến từ Việt Nam.", "I come from Vietnam.", ["go", "to", "am"], ["I am from Vietnam."]),
])
lesson("ul-l1", [
    SP("l_live"), SP("l_age"), M("single", "married", "foreign", "kind", "problem"), TX("Are you married?", "Bạn đã kết hôn chưa?", ["Bạn bao nhiêu tuổi?", "Bạn có con chưa?", "Bạn sống ở đâu?"]), Y("Tôi ba mươi hai tuổi.", "I am thirty-two years old.", "I am thirty-two."),
])
lesson("ul-l2", [
    T("problem", ["job", "team", "report"]),
    SP("l_work"), SP("l_like"), N("company", ["job", "colleague", "factory"]), M("office", "factory", "engineer", "farmer", "team"), F("I am ___ engineer.", "an", ["a", "the", "some"], "Tôi là kỹ sư."), Y("Tôi là y tá.", "I am a nurse."),
])
lesson("ul-l3", [
    SP("l_name", ["speaking.formulaic"]), SP("l_from", ["speaking.formulaic"]), SP("l_work", ["speaking.formulaic"]), M("report", "paper", "list", "pen", "button"), TX("This is my colleague, Tom.", "Đây là đồng nghiệp của tôi, Tom.", ["Đây là sếp của tôi, Tom.", "Đây là anh trai tôi, Tom.", "Tôi là đồng nghiệp của Tom."]), Y("Tôi có một câu hỏi.", "I have a question."), F("Do you have a ___?", "question", ["paper", "safety", "staff"], "Bạn có câu hỏi nào không?"),
    M("farmer", "foreign", "list", "paper", "single"),
])
# ---------------------------------------------------------------- um
lesson("um-l0", [
    SP("m_children"), SP("m_team"), NX("Bạn có mấy anh chị em?", "How many brothers and sisters do you have?", ["How much brothers and sisters do you have?", "How many brother and sister you have?", "How many brothers and sisters you are?"]), W("Tôi có ba người bạn.", "I have three friends.", ["friend", "much"]), Y("Bạn có mấy đứa con?", "How many children do you have?", "How many kids do you have?"),
])
lesson("um-l1", [
    SP("m_rep_ten"), SP("m_price"), T("how much", ["how many", "number", "dollar"]), Y("Cái này giá bao nhiêu?", "How much is this?", "How much is it?", "How much does it cost?", "How much does this cost?"), W("Vé giá ba mươi đô la.", "The ticket costs thirty dollars.", ["cost", "thirteen"]),
])
lesson("um-l2", [
    SP("m_time"), SP("m_rep_half"), SP("m_day"), TX("Today is Tuesday.", "Hôm nay là thứ Ba.", ["Hôm nay là thứ Năm.", "Ngày mai là thứ Ba.", "Hôm qua là thứ Ba."]), Y("Hôm nay là thứ Tư.", "Today is Wednesday.", "It's Wednesday today.", "It's Wednesday."),
])
lesson("um-l3", [
    SP("m_price", ["numbers.0_100"]), SP("m_time", ["numbers.0_100"]), SP("m_children", ["numbers.0_100"]), N("number", ["cost", "half", "date"]), Y("Tôi có hai con.", "I have two children."),
])
# ---------------------------------------------------------------- un
lesson("un-l0", [
    SP("n_woman"), SP("n_rep_big"), M("tall", "short", "young", "old", "beautiful"), NX("Cô ấy trẻ và đẹp.", "She is young and beautiful.", ["She young and beautiful.", "She is young and a beautiful.", "She are young and beautiful."]), Y("Mẹ tôi không cao.", "My mother is not tall.", "My mother isn't very tall."), M("happy", "sad", "angry", "tired", "hungry"),
    M("shoe", "short", "sure", "happy", "tall"),
])
lesson("un-l1", [
    SP("n_house"), SP("n_cat"), SP("n_car"), SP("n_rep_new"), M("red", "blue", "green", "black", "white"), F("My shirt is ___.", "white", ["color", "shoes", "dress"], "Áo sơ mi của tôi màu trắng."), NX("một cái túi đỏ", "a red bag", ["a bag red", "red a bag", "a reds bag"]), Y("một chiếc ô tô màu đen", "a black car"), Y("Ô tô của tôi màu xanh dương.", "My car is blue."),
    M("large", "nice", "pants", "quiet", "sad"),
])
lesson("un-l2", [
    C("there-is-have"), SP("n_room"), J("My house ___ three rooms.", "have", "pre:3s", "Nhà tôi có ba phòng."), W("Trong phòng có hai cái ghế.", "There are two chairs in the room.", ["is", "chair"], ["In the room there are two chairs."]), Y("Trong bếp có một cái tủ lạnh.", "There is a fridge in the kitchen.", "In the kitchen there is a fridge."), M("large", "dark", "quiet", "empty", "full"),
    M("easy", "empty", "fine", "full", "hat"),
])
lesson("un-l3", [
    SP("n_house", ["adjectives.order_very"]), SP("n_woman", ["adjectives.order_very"]), SP("n_room", ["verbs.be_there_is"]), M("clothes", "jacket", "pants", "hat", "dress"), M("easy", "difficult", "expensive", "cheap", "different"), F("The exam is very ___.", "difficult", ["clothes", "uniform", "glasses"], "Bài thi rất khó."), Y("Áo sơ mi này quá nhỏ.", "This shirt is too small."),
    M("angry", "clothes", "dark", "different", "dress"),
])
# ---------------------------------------------------------------- Section 5: uo
lesson("uo-l0", [
    T("age", ["address", "last name", "phone number"]),
    W("Tên tôi là Hoa.", "My name is Hoa.", ["I", "are"]), WR("o_name"), WR("o_age"), N("first name", ["last name", "age", "address"]), Y("Tôi hai mươi tuổi.", "I am twenty years old.", "I am twenty."),
])
lesson("uo-l1", [
    W("Tôi sống ở Hà Nội.", "I live in Hanoi.", ["at", "lives"]), WR("o_home"), F("I am from ___.", "Hue", ["Vietnamese", "address", "age"], "Tôi đến từ Huế."), N("last name", ["first name", "phone number", "age"]), Y("Địa chỉ của tôi là số mười hai phố Green.", "My address is 12 Green Street.", "My address is twelve Green Street."),
])
lesson("uo-l2", [
    W("Tôi có hai anh trai.", "I have two brothers.", ["brother", "am"]), WR("o_family"), N("phone number", ["address", "last name", "age"]), M("address", "age", "first name", "last name", "phone number"), Y("Tôi có một con gái.", "I have a daughter."),
])
lesson("uo-l3", [
    WR("o_all"), WR("o_open"), F("___ live in Hanoi.", "I", ["Me", "My", "Mine"], "Tôi sống ở Hà Nội."), NX("Cách viết nào đúng?", "I am from Vietnam.", ["i am from vietnam.", "I am From vietnam.", "i am from Vietnam."]), Y("Tôi là người Việt và tôi nói tiếng Anh.", "I am Vietnamese and I speak English."),
])
# ---------------------------------------------------------------- up
lesson("up-l0", [
    W("Anna uống trà vào buổi sáng.", "Anna drinks tea in the morning.", ["drink", "at"], ["In the morning Anna drinks tea."]), WR("p_who"), J("Nam ___ rice every day.", "eat", "pre:3s", "Nam ăn cơm mỗi ngày."), J("Hoa ___ in a bank.", "work", "pre:3s", "Hoa làm việc ở một ngân hàng."), Y("Tom chơi bóng đá.", "Tom plays soccer."),
])
lesson("up-l1", [
    WR("p_neg"), WR("p_ask"), NX("Tôi không hút thuốc.", "I don't smoke.", ["I no smoke.", "I not smoke.", "I am not smoke."]), W("Bạn làm việc ở đâu?", "Where do you work?", ["does", "is"]), Y("Bạn có thích trà không?", "Do you like tea?"),
])
lesson("up-l2", [
    WR("p_like"), WR("p_because"), F("I study English ___ I need it for work.", "because", ["but", "or", "than"], "Tôi học tiếng Anh vì tôi cần nó cho công việc."), F("Do you want tea ___ coffee?", "or", ["but", "because", "than"], "Bạn muốn trà hay cà phê?"), W("Tôi rất thích âm nhạc.", "I love music.", ["very", "am"]), Y("Nếu bạn rảnh, hãy gọi cho tôi.", "If you are free, call me.", "If you are free, please call me.", "Call me if you are free.", "Please call me if you are free."), M("feel", "worry", "laugh", "smile", "love"),
    M("feel", "if", "laugh", "smile", "so"),
])
lesson("up-l3", [
    WR("p_scene"), WR("p_open"), TX("I can't drink coffee without sugar.", "Tôi không uống được cà phê không đường.", ["Tôi không uống được cà phê có đường.", "Tôi không có đường.", "Tôi không thích cà phê."]), Y("Tôi đọc và viết tiếng Anh.", "I read and write English."), W("Câu chuyện này nói về một gia đình.", "This story is about a family.", ["with", "are"]),
    M("without", "worry", "because", "but", "and"),
])
# ---------------------------------------------------------------- uq
lesson("uq-l0", [
    WR("q_meet"), F("Let's meet ___ three.", "at", ["in", "on", "to"], "Chúng ta gặp nhau lúc ba giờ nhé."), W("Hẹn gặp bạn ở nhà ga.", "See you at the station.", ["on", "are"]), N("phone", ["email", "website", "printer"]), Y("Chào Lan, bạn khỏe không?", "Hi Lan, how are you?", "Hello Lan, how are you?"),
    M("screen", "website", "email", "phone", "send"),
])
lesson("uq-l1", [
    WR("q_late"), WR("q_own"), W("Hôm nay tôi đến muộn.", "I am late today.", ["is", "tomorrow"], ["Today I am late."]), Y("Hẹn gặp bạn vào thứ Bảy.", "See you on Saturday.", "See you Saturday."), T("reply", ["send", "phone", "password"]),
])
lesson("uq-l2", [
    WR("q_report"), WR("q_meeting"), F("Dear ___ Brown,", "Ms.", ["Sister", "Woman", "My"], "Kính gửi chị Brown,"), NX("Ông Tom Smith được gọi là gì trong email?", "Mr. Smith", ["Mr. Tom", "Tom Mr.", "Smith Mr."]), Y("Tôi đang gửi email cho bạn.", "I am sending you an email.", "I am sending an email to you.", "I am sending you the email.", "I am sending the email to you."),
])
lesson("uq-l3", [
    WR("q_open"), M("file", "screen", "website", "password", "printer"), F("Please send me the ___.", "file", ["screen", "dear", "send"], "Làm ơn gửi cho tôi tệp đó."), W("Làm ơn trả lời email của tôi.", "Please reply to my email.", ["I", "at"]), TX("I forgot my password.", "Tôi quên mật khẩu rồi.", ["Tôi đổi mật khẩu rồi.", "Tôi biết mật khẩu.", "Tôi quên điện thoại rồi."]), Y("Bạn có email của tôi không?", "Do you have my email?"),
])
# ---------------------------------------------------------------- ur
lesson("ur-l0", [
    WR("r_form_course"), T("form", ["sign", "document", "passport"]), F("Please fill out this ___.", "form", ["passport", "sign", "age"], "Làm ơn điền vào biểu mẫu này."), W("Làm ơn điền vào biểu mẫu này.", "Please fill out this form.", ["these", "at"]), Y("Tôi sống ở Huế.", "I live in Hue."),
])
lesson("ur-l1", [
    WR("r_form_job"), T("passport", ["form", "document", "sign"]), N("document", ["passport", "form", "address"]), F("My ___ name is Nguyen.", "last", ["first", "form", "sign"], "Họ của tôi là Nguyen."), Y("Tôi là y tá.", "I'm a nurse.", "I work as a nurse."),
])
lesson("ur-l2", [
    WR("r_note"), TX("I will be back at three.", "Tôi sẽ quay lại lúc ba giờ.", ["Tôi đã quay lại lúc ba giờ.", "Tôi sẽ đi lúc ba giờ.", "Tôi quay lại sau ba ngày."]), W("Máy in không chạy.", "The printer does not work.", ["do", "works"]), Y("Làm ơn gọi cho tôi.", "Please call me.", "Call me, please."), NX("Bạn không hiểu một ô trong biểu mẫu. Bạn hỏi thế nào?", "What does this mean?", ["What this mean?", "What is mean this?", "What does this means?"]),
])
lesson("ur-l3", [
    WR("r_form_hotel"), WR("r_mail_hotel"), WR("r_open"), Y("Tôi muốn một phòng.", "I would like a room.", "I want a room.", "I need a room.", "I would like a room, please.", "A room, please."), MP(("First name", "Tên"), ("Last name", "Họ"), ("Address", "Địa chỉ"), ("Passport", "Hộ chiếu")),
])
# ---------------------------------------------------------------- Section 6: us
lesson("us-l0", [
    TX("Who is the manager?", "Ai là quản lý?", ["Quản lý ở đâu?", "Bạn là quản lý à?", "Quản lý tên là gì?"]), W("Rất vui được gặp bạn.", "Nice to meet you.", ["are", "see"]), T("introduce", ["manager", "interview", "experience"]), F("Can I ___ my colleague?", "introduce", ["experience", "interview", "manager"], "Tôi giới thiệu đồng nghiệp của tôi nhé?"), Y("Tôi là công nhân mới.", "I'm a new worker.", "I'm the new worker."),
])
lesson("us-l1", [
    W("Bạn đến từ đâu?", "Where are you from?", ["do", "to"]), IX("intro_at_work"), TX("Welcome to the team!", "Chào mừng bạn đến với nhóm!", ["Tạm biệt cả nhóm!", "Cảm ơn cả nhóm!", "Nhóm của bạn ở đâu?"]), F("I ___ from Vietnam.", "am", ["is", "are", "do"], "Tôi đến từ Việt Nam."), Y("Tôi tên là Minh.", "My name is Minh.", "I am Minh."),
])
lesson("us-l2", [
    TX("Tell me about your job.", "Hãy kể về công việc của bạn.", ["Hãy kể về công ty của tôi.", "Hãy nói tên của sếp.", "Bạn muốn hỏi gì?"]), TX("Do you have experience?", "Bạn có kinh nghiệm không?", ["Bạn có việc làm không?", "Bạn có câu hỏi không?", "Bạn có thời gian không?"]), F("I worked in a factory ___ two years.", "for", ["in", "at", "ago"], "Tôi đã làm ở nhà máy hai năm."), W("Khi nào bạn bắt đầu được?", "When can you start?", ["do", "starts"]), Y("Tôi có thể bắt đầu vào thứ Hai.", "I can start on Monday.", "I can start Monday."),
])
lesson("us-l3", [
    W("Tôi có hai năm kinh nghiệm.", "I have two years of experience.", ["year", "am"]), IX("job_interview"), T("experience", ["interview", "introduce", "manager"]), F("I work ___ a factory.", "in", ["on", "to", "of"], "Tôi làm việc ở một nhà máy."), Y("Tôi là công nhân.", "I am a worker.", "I am a factory worker."),
])
# ---------------------------------------------------------------- ut
lesson("ut-l0", [
    C("can-would-like"), NX("Cho tôi cái này.", "I would like this one, please.", ["I would like this one, sorry.", "I like would this one, please.", "I would likes this one, please."]), J("I can ___ you.", "help", "inf", "Tôi có thể giúp bạn."), W("Cho tôi một cái áo khoác.", "I would like a jacket.", ["likes", "an"]), M("store", "cash", "receipt", "price", "market"), Y("Tôi muốn một ly trà.", "I would like a tea.", "I'd like some tea.", "I want a tea.", "I want some tea.", "I would like some tea.", "A tea, please.", "Tea, please."),
])
lesson("ut-l1", [
    W("Cái áo sơ mi này giá bao nhiêu?", "How much is this shirt?", ["many", "are"]), IX("shop_shirt"), N("receipt", ["cash", "store", "pay"]), F("Do you want to pay by card or in ___?", "cash", ["market", "store", "pay"], "Bạn muốn trả bằng thẻ hay tiền mặt?"), Y("Tôi trả bằng thẻ.", "I'll pay by card.", "I pay by card.", "I will pay with my card.", "By card, please.", "I want to pay by card.", "I am paying by card."),
])
lesson("ut-l2", [
    TX("The soup is too spicy.", "Món súp cay quá.", ["Món súp ngọt quá.", "Món súp rất ngon.", "Món súp hết rồi."]), M("delicious", "spicy", "sweet", "cheap", "expensive"), F("The ___ is very kind.", "waiter", ["check", "spicy", "price"], "Người phục vụ rất tốt bụng."), W("Làm ơn cho tôi hóa đơn.", "The check, please.", ["Sorry", "A"]), Y("Thức ăn rất ngon.", "The food is delicious.", "The food is very good.", "The food is very delicious."),
])
lesson("ut-l3", [
    W("Cho tôi một ly nước.", "A glass of water, please.", ["an", "sorry"]), IX("restaurant_order"), N("market", ["supermarket", "store", "price"]), F("I ___ a lot of money at this store.", "spend", ["sell", "free", "change"], "Tôi tiêu nhiều tiền ở cửa hàng này."), Y("Bạn muốn uống gì?", "What would you like to drink?", "What do you want to drink?"),
    M("receipt", "free", "price", "spend", "sweet"),
])
# ---------------------------------------------------------------- uu
lesson("uu-l0", [
    C("prepositions-in-on-at"), N("right", ["left", "straight", "far"]), N("straight", ["left", "right", "far"]), F("The clinic is ___ front of the school.", "in", ["at", "on", "to"], "Phòng khám ở phía trước trường học."), W("Đi thẳng rồi rẽ trái.", "Go straight and turn left.", ["right", "to"]), M("traffic light", "post office", "pharmacy", "clinic", "hospital"), Y("Rẽ phải.", "Turn right.", "Turn right, please."),
    M("in front of", "pharmacy", "traffic light", "left", "right"),
])
lesson("uu-l1", [
    W("Bưu điện ở đâu?", "Where is the post office?", ["are", "go"]), IX("ask_directions"), IX("airport_checkin"), TX("Your flight leaves at nine.", "Chuyến bay của bạn khởi hành lúc chín giờ.", ["Chuyến bay của bạn đến lúc chín giờ.", "Chuyến tàu của bạn chạy lúc chín giờ.", "Chuyến bay của bạn khởi hành lúc năm giờ."]), Y("Xin lỗi, nhà ga ở đâu?", "Excuse me, where is the station?", "Sorry, where is the station?"),
])
lesson("uu-l2", [
    M("hand", "arm", "leg", "foot", "finger"), M("doctor", "nurse", "medicine", "fever", "cough"), NX("Tôi bị đau đầu.", "I have a headache.", ["I am a headache.", "I have headache a.", "I headache."]), F("My arm ___.", "hurts", ["hurt", "is hurt me", "pain"], "Tay tôi đau."), Y("Tôi muốn gặp bác sĩ.", "I would like to see a doctor.", "I want to see a doctor.", "I need to see a doctor.", "I would like to see the doctor."),
])
lesson("uu-l3", [
    W("Tôi bị đau đầu và sốt.", "I have a headache and a fever.", ["am", "an"], ["I have a fever and a headache."]), IX("clinic_visit"), IX("hotel_checkin"), TX("Take this medicine twice a day.", "Uống thuốc này hai lần một ngày.", ["Uống thuốc này một lần một ngày.", "Uống thuốc này hai ngày một lần.", "Đừng uống thuốc này."]), N("hospital", ["clinic", "pharmacy", "post office"]), Y("Tôi muốn một phòng cho hai đêm.", "I would like a room for two nights.", "I want a room for two nights.", "I need a room for two nights.", "A room for two nights, please."),
    M("cough", "finger", "foot", "hurt", "leg"),
])
# ---------------------------------------------------------------- uv
lesson("uv-l0", [
    NX("Cho tôi nói chuyện với ông Brown được không?", "Can I speak to Mr. Brown, please?", ["Can I speak Mr. Brown, please?", "I can speak to Mr. Brown?", "Can I speaks to Mr. Brown, please?"]), M("song", "game", "story", "picture", "gift"), M("sport", "soccer", "hobby", "swim", "party"), W("Tôi muốn đặt một cuộc hẹn.", "I would like to make an appointment.", ["a", "do"]), Y("Tôi là Hoa đây (nói qua điện thoại).", "This is Hoa.", "Hello, this is Hoa.", "It's Hoa."),
])
lesson("uv-l1", [
    W("Thứ Sáu lúc mười giờ được không?", "Is Friday at ten okay?", ["on", "are"]), IX("phone_appointment"), N("appointment", ["meeting", "shift", "party"]), TX("I'm sorry, I can't come to work today.", "Xin lỗi, hôm nay tôi không đi làm được.", ["Xin lỗi, hôm qua tôi không đi làm.", "Hôm nay tôi đi làm sớm.", "Xin lỗi, hôm nay tôi đến muộn."]), Y("Hôm nay tôi bị ốm.", "I am sick today.", "Today I am sick."),
])
lesson("uv-l2", [
    IX("email_question"), TX("Did you get my email?", "Bạn đã nhận được email của tôi chưa?", ["Bạn đã gửi email cho tôi chưa?", "Bạn có email không?", "Bạn đã đọc sách của tôi chưa?"]), F("I'll send it ___.", "now", ["ago", "last", "during"], "Tôi sẽ gửi ngay bây giờ."), W("Tôi chưa nhận được email.", "I didn't get the email.", ["don't", "got"]), Y("Tôi sẽ gửi nó ngày mai.", "I will send it tomorrow.", "Tomorrow I will send it."),
    M("song", "sport", "swim", "until", "meeting"),
])
lesson("uv-l3", [
    IX("factory_instructions"), F("My ___ starts at six.", "shift", ["music", "gift", "song"], "Ca của tôi bắt đầu lúc sáu giờ."), F("I work ___ five o'clock.", "until", ["ago", "last", "next"], "Tôi làm việc đến năm giờ."), W("Làm ơn kiểm tra cái máy.", "Please check the machine.", ["checks", "a"]), Y("Tôi không hiểu. Bạn nhắc lại được không?", "I don't understand. Can you repeat that?", "I don't understand. Can you say that again?", "I don't understand. Can you repeat?", "I don't understand. Could you repeat that?"),
    M("game", "gift", "hobby", "party", "picture"),
])


def _ids_of(rec):
    out = {"clips": set(), "readings": set(), "speech": set(), "writing": set(), "scenarios": set()}
    for e in rec["exercises"]:
        for field, kind in (("clipId", "clips"), ("readingId", "readings"), ("speechItemId", "speech"), ("writingTaskId", "writing"), ("scenarioId", "scenarios")):
            if field in e:
                out[kind].add(e[field])
    return out


by_lesson = {r["lessonId"]: _ids_of(r) for r in RECORDS}
for lid, want in REFS.items():
    for kind, ids in want.items():
        for i in ids:
            if i not in by_lesson[lid][kind]:
                PROBLEMS.append(f"{lid}: mapped {kind} id {i} is not used")
    for kind, ids in by_lesson[lid].items():
        for i in sorted(ids - set(want.get(kind, []))):
            PROBLEMS.append(f"{lid}: {i} is not mapped to this lesson")
finish("a")

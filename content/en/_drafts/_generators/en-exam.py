"""en-vi practice track on the format of QD 1481/QD-BGDDT, bac 2, adults (content/en/exam/FORMAT-SOURCES.md). Original items only.
The decision fixes skills, parts per skill, items per skill, timing and scoring; it does not split items by part and has no sample, so
the split is the course's design. Appends stimuli to listening / readings / speech / writing / scenarios OUTPUT (run after
en-assessment.py) and writes exam/OUTPUT.jsonl. Bac 2 is above the A1 syllabus: wider words are allowed and counted, not refused.
usage: python -I en-exam.py <repo root>"""
import json, os, sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from en_refs import _scan, content_refs, refs, write_jsonl  # noqa: E402

DRAFTS = sys.argv[1] + "/content/en/_drafts"
TRACK = "bac2_qd1481"
clips, readings, speech, tasks, scenarios, items = [], [], [], [], [], []
OFF_LIST = Counter()
_pos = [0]


def O(k):
    return f"en.obj.{k}"


def seen(text):
    for w in _scan(text)[1]:
        OFF_LIST[w.lower()] += 1
    return text


def place(correct, wrong):
    p = _pos[0] % (len(wrong) + 1)
    _pos[0] += 1
    o = list(wrong)
    o.insert(p, correct)
    return o, p


SEC = {"l": "listening", "r": "reading", "w": "writing", "s": "speaking"}


def item(form, sec, task, n, exercise, obj):
    slug = f"{form}_{sec}{task}_{n:02d}"
    ex = dict(exercise)
    ex["id"] = f"en-exx-{TRACK}-{slug}"
    items.append({"id": f"en.exi.{TRACK}.{slug}", "itemVersion": 1, "sectionId": SEC[sec], "taskId": f"p{task}", "exercise": ex, "objectiveTargets": [obj]})


def clip(cid, kind, segs, obj, units=2):
    text = " ".join(t for _, t in segs)
    seen(text)
    clips.append({"id": cid, "kind": kind, "segments": [{"speaker": s, "text": t} for s, t in segs], "objectiveRefs": [obj], "lexemeRefs": refs(text),
                  "sourceRef": "original-project", "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"}, "scoredPlaybackPolicy": {"maxPlays": 2, "rate": 1}, "use": "exam"})
    return cid


def reading(rid, kind, paras, obj, gloss=(), title=None, units=3):
    text = " ".join(paras)
    seen(text)
    r = {"id": rid, "kind": kind}
    if title:
        r["title"] = title
    r.update({"blocks": [{"kind": "paragraph", "text": p} for p in paras], "objectiveRefs": [obj], "lexemeRefs": refs(text),
              "supportGlossary": [{"surface": a, "gloss": {"vi": b}} for a, b in gloss], "sourceRef": "original-project",
              "authoringSpec": {"informationUnits": units, "inferenceDemand": "locate"}, "use": "exam"})
    readings.append(r)
    return rid


def lc(form, task, n, cid, q, ok, wrong, obj):
    o, p = place(ok, wrong)
    item(form, "l", task, n, {"type": "listeningComprehension", "clipId": cid, "question": q, "options": [{"text": t} for t in o], "correct": p}, obj)


def rc(form, task, n, rid, q, ok, wrong, obj):
    o, p = place(ok, wrong)
    item(form, "r", task, n, {"type": "readingComprehension", "readingId": rid, "question": q, "options": [{"text": t} for t in o], "correct": p}, obj)


LD, LA, LI = O("listening.short_dialogues"), O("listening.announcements"), O("listening.short_info")
RM, RN, RT = O("reading.short_messages"), O("reading.notices_info"), O("reading.short_texts")

# ---------------- LISTENING: 15 multiple choice (p1-p3), 10 gap items (p4-p5) ----------------
L1 = {
 "a": [
  ("Attention, please. The train to Da Nang will leave from platform four at ten fifteen.", "Tàu đi Đà Nẵng chạy từ sân ga số mấy?", "Số 4", ["Số 10", "Số 15"]),
  ("The library will close early today, at four o'clock, because of a staff meeting.", "Hôm nay thư viện đóng cửa lúc mấy giờ?", "4 giờ", ["5 giờ", "6 giờ"]),
  ("Good morning, everyone. Our English class is in room twelve today, not in room twenty.", "Hôm nay lớp học ở phòng nào?", "Phòng 12", ["Phòng 20", "Phòng 2"]),
  ("This is the last bus to the airport. Please show your ticket to the driver.", "Hành khách phải làm gì?", "Đưa vé cho tài xế", ["Mua vé ở sân bay", "Đợi chuyến xe sau"]),
  ("Today's special is chicken soup with rice. It costs five dollars, and the coffee is free.", "Món gì được miễn phí?", "Cà phê", ["Súp gà", "Cơm"]),
 ],
 "b": [
  ("Passengers for flight two four one, please go to gate seven. The plane leaves in twenty minutes.", "Hành khách phải đến cửa số mấy?", "Số 7", ["Số 2", "Số 20"]),
  ("The swimming pool is closed on Monday for cleaning. It opens again on Tuesday at six.", "Hồ bơi mở cửa lại khi nào?", "Thứ Ba", ["Thứ Hai", "Thứ Sáu"]),
  ("Dear customers, all shoes are half price until Sunday. The shoe department is on the third floor.", "Quầy giày ở tầng mấy?", "Tầng 3", ["Tầng 2", "Tầng 1"]),
  ("The meeting at two o'clock has moved to the small room next to the kitchen.", "Cuộc họp chuyển đến đâu?", "Phòng nhỏ cạnh nhà bếp", ["Trong nhà bếp", "Phòng lớn trên tầng hai"]),
  ("Please do not use the elevator today because it is broken. Use the stairs on the left.", "Hôm nay nên đi bằng đường nào?", "Cầu thang bên trái", ["Thang máy", "Cầu thang bên phải"]),
 ],
}
L2 = {
 "a": [
  ([("A", "Is this seat free?"), ("B", "Sorry, my friend is sitting here. That one by the window is free.")], "Chỗ nào còn trống?", "Chỗ cạnh cửa sổ", ["Chỗ cạnh người B", "Không còn chỗ nào"]),
  ([("A", "What time does your shift end tonight?"), ("B", "Usually at ten, but tonight I finish at eight.")], "Tối nay ca làm kết thúc lúc mấy giờ?", "8 giờ", ["10 giờ", "9 giờ"]),
  ([("A", "Can I pay by card?"), ("B", "I'm sorry, the machine is broken. You can pay in cash.")], "Khách phải trả bằng gì?", "Tiền mặt", ["Thẻ", "Chuyển khoản"]),
  ([("A", "How was your trip to Hue?"), ("B", "It was great, but it rained on the last day.")], "Trời mưa khi nào?", "Ngày cuối", ["Ngày đầu", "Suốt chuyến đi"]),
  ([("A", "Do you want to meet on Thursday?"), ("B", "I can't. I have to see the doctor. How about Friday?")], "Người B đề nghị gặp vào ngày nào?", "Thứ Sáu", ["Thứ Năm", "Thứ Bảy"]),
 ],
 "b": [
  ([("A", "Would you like some tea?"), ("B", "No, thanks. I just had one. A glass of water would be nice.")], "Người B muốn gì?", "Một ly nước", ["Trà", "Cà phê"]),
  ([("A", "Where did you put the keys?"), ("B", "They're in my bag, not on the table.")], "Chìa khoá ở đâu?", "Trong túi", ["Trên bàn", "Trong ô tô"]),
  ([("A", "How do you get to work?"), ("B", "I used to take the bus, but now I ride my motorbike.")], "Bây giờ người B đi làm bằng gì?", "Xe máy", ["Xe buýt", "Xe đạp"]),
  ([("A", "Is the pharmacy open now?"), ("B", "No, it closes at six, and it's six thirty now.")], "Bây giờ là mấy giờ?", "6 giờ 30", ["6 giờ", "7 giờ 30"]),
  ([("A", "Happy birthday! How old are you today?"), ("B", "Thanks! I'm thirty-two.")], "Người B bao nhiêu tuổi?", "32", ["23", "30"]),
 ],
}
L3 = {
 "a": ([("A", "Hello, I'm calling about the job at your restaurant."), ("B", "Yes. Have you worked in a restaurant before?"), ("A", "Yes, I worked as a waiter for two years in Hanoi."),
        ("B", "Good. We need someone for weekends, from eleven in the morning to nine at night."), ("A", "That's fine. How much is the pay?"), ("B", "Twelve dollars an hour. Can you come for an interview on Tuesday at three?"),
        ("A", "Yes, I can. Should I bring anything?"), ("B", "Please bring your ID card and a photo.")],
       [("Người A gọi điện về việc gì?", "Một công việc ở nhà hàng", ["Đặt một bàn ăn", "Một khoá học nấu ăn"]), ("Người A đã làm phục vụ bao lâu?", "Hai năm", ["Một năm", "Ba năm"]),
        ("Nhà hàng cần người làm khi nào?", "Cuối tuần", ["Các ngày trong tuần", "Mỗi buổi tối"]), ("Tiền lương là bao nhiêu?", "12 đô la một giờ", ["20 đô la một giờ", "12 đô la một ngày"]),
        ("Người A phải mang gì?", "Thẻ căn cước và một tấm ảnh", ["Sơ yếu lý lịch", "Bằng lái xe"])]),
 "b": ([("A", "Good morning, Green Clinic."), ("B", "Good morning. I'd like to see a doctor. I've had a bad cough for three days."), ("A", "Do you have a fever?"), ("B", "A little, last night."),
        ("A", "Doctor Lan can see you today at four, or tomorrow at nine."), ("B", "Today, please. I can't come tomorrow because I work in the morning."), ("A", "Fine. What's your name?"), ("B", "Hoa Pham."),
        ("A", "Please bring your health card and come ten minutes early.")],
       [("Người B đã ho mấy ngày?", "Ba ngày", ["Hai ngày", "Mười ngày"]), ("Người B bị sốt khi nào?", "Tối qua", ["Sáng nay", "Ba ngày trước"]),
        ("Người B đặt hẹn khi nào?", "Hôm nay lúc 4 giờ", ["Ngày mai lúc 9 giờ", "Hôm nay lúc 9 giờ"]), ("Vì sao người B không đến vào ngày mai?", "Vì sáng mai phải đi làm", ["Vì ngày mai phòng khám đóng cửa", "Vì bác sĩ Lan bận"]),
        ("Người B cần đến sớm bao lâu?", "10 phút", ["5 phút", "20 phút"])]),
}
# Talks with gaps. The real paper has the candidate write the word; the app offers three words.
L4 = {
 "a": ("Welcome to Green Factory. My name is Sarah and I am your manager. Work starts at seven thirty every morning. Lunch is at twelve in the cafeteria on the first floor. Please wear your gloves and a helmet near the machines. If you have a problem, call Mr Lee. You get your pay on the last Friday of the month.",
       [("Work starts at ___ every morning.", "seven thirty", ["seven fifty", "eight thirty"]), ("The cafeteria is on the ___ floor.", "first", ["second", "third"]), ("Near the machines, wear gloves and a ___.", "helmet", ["hat", "jacket"]),
        ("If you have a problem, call Mr ___.", "Lee", ["Lam", "Brown"]), ("You get your pay on the last ___ of the month.", "Friday", ["Monday", "Sunday"])]),
 "b": ("Welcome to the City Language Center. Our evening English course starts on the fifth of March and lasts ten weeks. Classes are on Tuesday and Thursday, from six to eight. The course costs ninety dollars, and books are included. You can pay at the front desk or by bank transfer. If you miss a class, please send an email to your teacher.",
       [("The course starts on the ___ of March.", "fifth", ["fifteenth", "first"]), ("The course lasts ___ weeks.", "ten", ["two", "twelve"]), ("Classes are on Tuesday and ___.", "Thursday", ["Friday", "Saturday"]),
        ("The course costs ___ dollars.", "ninety", ["nineteen", "fifty"]), ("If you miss a class, send an ___ to your teacher.", "email", ["apple", "invitation"])]),
}
L5 = {
 "a": ("Good evening. This is the city news. The new park on River Road opens this Saturday at nine in the morning. Tickets are free for children under ten. Adults pay two dollars. There will be music in the afternoon and a small food market near the lake. Bus number eight stops at the main gate. For more information, please visit the city website.",
       [("The new park opens this ___ at nine.", "Saturday", ["Sunday", "Thursday"]), ("Tickets are free for children under ___.", "ten", ["two", "eight"]), ("Adults pay ___ dollars.", "two", ["ten", "twelve"]),
        ("The food market is near the ___.", "lake", ["gate", "road"]), ("Bus number ___ stops at the main gate.", "eight", ["eighteen", "nine"])]),
 "b": ("Hello everyone, and welcome to our trip to Ha Long. This morning we will visit two caves. We will have lunch on the boat at half past twelve. In the afternoon you can swim in the sea or rest on the beach. Please take a hat and some water with you. The boat will go back to the city at five o'clock, so please do not be late.",
       [("This morning we will visit ___ caves.", "two", ["three", "four"]), ("We will have lunch on the ___.", "boat", ["beach", "island"]), ("Lunch is at half past ___.", "twelve", ["two", "eleven"]),
        ("Please take a hat and some ___.", "water", ["food", "money"]), ("The boat goes back at ___ o'clock.", "five", ["four", "six"])]),
}
GAP_Q = "Điền từ còn thiếu vào câu: "
for form in "ab":
    for n, (text, q, ok, wrong) in enumerate(L1[form], 1):
        lc(form, 1, n, clip(f"en.clip.bac2_{form}_l1_{n:02d}", "announcement", [("A" if n % 2 else "B", text)], LA), q, ok, wrong, LA)
    for n, (segs, q, ok, wrong) in enumerate(L2[form], 1):
        lc(form, 2, n, clip(f"en.clip.bac2_{form}_l2_{n:02d}", "dialogue", segs, LD), q, ok, wrong, LD)
    segs, qs = L3[form]
    cid = clip(f"en.clip.bac2_{form}_l3", "dialogue", segs, LD, 5)
    for n, (q, ok, wrong) in enumerate(qs, 1):
        lc(form, 3, n, cid, q, ok, wrong, LD)
    for task, table, speaker in ((4, L4, "B"), (5, L5, "A")):
        text, gaps = table[form]
        cid = clip(f"en.clip.bac2_{form}_l{task}", "factual", [(speaker, text)], LI, 5)
        for n, (sent, ok, wrong) in enumerate(gaps, 1):
            seen(sent)
            lc(form, task, n, cid, GAP_Q + sent, ok, wrong, LI)

# ---------------- READING: 8 matching (p1), 15 multiple choice (p2-p3), 7 short answers (p4) ----------------
R1 = {
 "a": ([("NOTICE: The elevator is out of order. Please use the stairs until Friday.", 0), ("Free parking for customers. Please show your receipt at the exit.", 1), ("Part-time cook wanted. Weekends only. Ask for Mrs Lan in the kitchen.", 2),
        ("The swimming pool is for members only. Buy your card at the front desk.", 3), ("Wet floor. Please walk slowly and hold the handrail.", 4), ("Lost: a black bag near the bus stop on Monday. Please call Minh on 0903 222 111.", 5),
        ("Library books must be returned within fourteen days. A late book costs one dollar a day.", 6), ("All staff: the meeting on Friday is canceled. We will meet next Tuesday instead.", 7)],
       ["You cannot use the elevator this week.", "You do not pay for your car if you buy something here.", "The restaurant needs someone to work on Saturday and Sunday.", "You need a card to go swimming.",
        "Be careful, because you could fall here.", "Someone is looking for a bag.", "You pay money if you keep a book too long.", "Workers will not have a meeting on Friday.", "You can buy a new bag here.", "The kitchen is closed on Saturday."]),
 "b": ([("CINEMA: Please switch off your phone before the movie starts.", 0), ("Children under twelve must be with an adult in the pool area.", 1), ("Room for rent near the university. No pets, please.", 2),
        ("Shop closing down! Everything is half price until Saturday.", 3), ("Bus 15 does not stop here this week because of road work. Please walk to Hoa Street.", 4), ("Found: a set of keys in the parking lot. Ask at the information desk.", 5),
        ("Staff: please wash your hands before you go back to work.", 6), ("English classes for adults. Evenings, Monday to Thursday. Beginners are welcome.", 7)],
       ["You must not use your phone here.", "Young children cannot swim here alone.", "You cannot keep a cat in this room.", "Things are cheaper this week.", "You have to walk to another bus stop.",
        "You can get your keys at the desk.", "Workers must keep their hands clean.", "You can learn English here without any experience.", "Bus 15 is free this week.", "You can buy a phone at this shop."]),
}
ORDER = {"a": [6, 2, 8, 0, 4, 9, 1, 7, 3, 5], "b": [3, 8, 5, 0, 7, 2, 9, 4, 1, 6]}
MATCH_Q = "Câu nào đúng với nội dung thông báo này?"
R2 = {
 "a": [
  (["Hi Tom, I am sorry I missed your call yesterday. My phone was broken, so I took it to the shop near my office. It will be ready on Thursday. Until then, please send me an email or call my office number. See you on the weekend! Hoa"], "message",
   [("Vì sao Hoa không nghe điện thoại?", "Điện thoại của Hoa bị hỏng", ["Hoa đang họp", "Hoa quên điện thoại ở nhà"]), ("Khi nào điện thoại sửa xong?", "Thứ Năm", ["Hôm nay", "Cuối tuần"])]),
  (["Room for rent in a quiet street, ten minutes by bus from the city center. The room has a bed, a desk and a small fridge. The kitchen and bathroom are shared with one other person. The rent is two hundred dollars a month, with water and internet included. Please call Mr Hung after six."], "notice",
   [("Tiền thuê đã gồm những gì?", "Nước và internet", ["Điện và nước", "Bữa ăn và internet"]), ("Nên gọi cho ông Hùng khi nào?", "Sau 6 giờ", ["Trước 6 giờ", "Buổi sáng"])]),
  (["Our shop will move to a bigger building on Lake Road on the first of June. The old shop will close on the twenty-fifth of May. During the week between, you can still buy from our website. Customers who visit the new shop in June will get ten percent off."], "notice",
   [("Cửa hàng cũ đóng cửa khi nào?", "Ngày 25 tháng 5", ["Ngày 1 tháng 6", "Ngày 10 tháng 6"]), ("Khách đến cửa hàng mới trong tháng 6 được gì?", "Giảm giá 10%", ["Một món quà", "Miễn phí giao hàng"])]),
  (["Dear neighbors, we are having a small party for our son's tenth birthday this Sunday afternoon. There may be some noise until about six o'clock. We are sorry about this. If you would like to join us, please come. There will be plenty of cake! Mai and Nam, apartment 12"], "message",
   [("Vì sao có bữa tiệc?", "Sinh nhật con trai của Mai và Nam", ["Mai và Nam mới chuyển nhà", "Mai và Nam kỷ niệm ngày cưới"]), ("Có thể ồn đến khoảng mấy giờ?", "6 giờ", ["10 giờ", "12 giờ"])]),
 ],
 "b": [
  (["Hi Linh, can you help me? I have to go to the hospital this morning because my mother is ill. Could you take my shift at the shop from ten until two? I can work for you on Sunday. Please text me before nine. Thanks a lot, Trang"], "message",
   [("Vì sao Trang phải đi bệnh viện?", "Mẹ của Trang bị ốm", ["Trang bị ốm", "Trang đi thăm bạn"]), ("Khi nào Trang làm thay cho Linh?", "Chủ nhật", ["Hôm nay", "Thứ Bảy"])]),
  (["For sale: a blue bicycle, two years old, in very good condition. I bought it for one hundred and twenty dollars and I am selling it for sixty because I am moving to Singapore next month. It comes with a lock and a helmet. You can see it on any evening this week. Please call An."], "notice",
   [("Xe đạp được bán với giá bao nhiêu?", "60 đô la", ["120 đô la", "20 đô la"]), ("Vì sao An bán xe?", "Tháng sau An chuyển đi Singapore", ["Xe đã quá cũ", "An mua một chiếc xe mới"])]),
  (["The Water Company will repair the pipes on Binh Street on Wednesday. There will be no water from nine in the morning until three in the afternoon. Please keep some water at home for that day. We are sorry for the trouble. If you have questions, please call 1900 1234."], "notice",
   [("Khi nào sẽ không có nước?", "Từ 9 giờ sáng đến 3 giờ chiều", ["Cả ngày thứ Tư", "Từ 3 giờ chiều đến 9 giờ tối"]), ("Người dân nên làm gì?", "Để sẵn nước ở nhà", ["Gọi cho công ty ngay", "Sửa đường ống"])]),
  (["Dear Ms Smith, thank you for your letter about the job in our sales team. We would like to meet you on the tenth of April at two o'clock at our office. Please bring your certificates and a list of your past jobs. If you cannot come on that day, please tell us by Friday. Best regards, Anna Lee"], "message",
   [("Cuộc gặp vào lúc nào?", "2 giờ ngày 10 tháng 4", ["10 giờ ngày 2 tháng 4", "2 giờ thứ Sáu"]), ("Chị Smith phải mang gì?", "Các chứng chỉ và danh sách công việc cũ", ["Một tấm ảnh", "Thư giới thiệu"])]),
 ],
}
R3 = {
 "a": ("My first job", ["When I finished school, I wanted to work in a big city, but I had no experience. My uncle told me that a hotel in Da Nang needed a receptionist. I was afraid because my English was not very good, but I decided to try. On my first day, a guest from Australia asked me where he could rent a motorbike. I did not understand him, so I asked him to write it down. He smiled and wrote the word on a piece of paper.",
                        "After that, I began to study English for one hour every evening after work. I learned the words that guests used most often, and I practiced with the other receptionists. Six months later, I could answer most questions without help. The manager saw this and asked me to train two new workers. Today I am the head receptionist at that hotel. I still make mistakes, but I am no longer afraid to speak. My advice to young people is simple: do not wait until your English is perfect. Start using it now, and you will learn much faster."],
       [("receptionist", "nhân viên lễ tân")],
       [("Ai nói với người viết về công việc này?", "Chú của người viết", ["Một vị khách", "Người quản lý"]), ("Vị khách người Úc muốn thuê gì?", "Một chiếc xe máy", ["Một căn phòng", "Một chiếc ô tô"]), ("Khi không hiểu, người viết làm gì?", "Nhờ khách viết ra", ["Gọi quản lý", "Xin lỗi rồi đi chỗ khác"]),
        ("Mỗi tối người viết học tiếng Anh bao lâu?", "Một giờ", ["Hai giờ", "Nửa giờ"]), ("Sáu tháng sau chuyện gì xảy ra?", "Người viết trả lời được phần lớn câu hỏi", ["Người viết nghỉ việc", "Người viết chuyển đến khách sạn khác"]), ("Bây giờ người viết làm gì?", "Trưởng nhóm lễ tân", ["Giáo viên tiếng Anh", "Quản lý khách sạn"]),
        ("Ý chính của lời khuyên là gì?", "Hãy dùng tiếng Anh ngay, đừng đợi đến khi giỏi", ["Hãy đi du học trước khi đi làm", "Hãy học ngữ pháp thật kỹ rồi mới nói"])]),
 "b": ("A small change", ["Two years ago, I was always tired. I worked in an office for nine hours a day, I drove to work, and I usually ate fast food for lunch. When my doctor told me that I was heavier than I should be, I knew I had to change. I did not want to go to a gym because it was too expensive, so I started with small steps. First, I began to walk to work. It takes thirty minutes, and it is a nice way to start the day.",
                          "Next, I stopped buying lunch and started bringing rice and vegetables from home. That saved me about fifty dollars a month. I also went to bed one hour earlier. It was not easy at first, but I did not stop. After three months, I felt much better and I had lost five kilos. My wife saw the change and began to walk with me on Sundays. Now our children sometimes join us too. I am not perfect, and I still enjoy a cake on the weekend. But I have learned that a small change, if you keep doing it, can be better than a big plan that you never start."],
       [("gym", "phòng tập thể dục")],
       [("Vì sao người viết quyết định thay đổi?", "Vì lời của bác sĩ", ["Vì lời của vợ", "Vì mất việc"]), ("Vì sao người viết không đến phòng tập?", "Vì quá đắt", ["Vì quá xa", "Vì không có thời gian"]), ("Đi bộ đến chỗ làm mất bao lâu?", "30 phút", ["50 phút", "9 phút"]),
        ("Mỗi tháng người viết tiết kiệm được bao nhiêu?", "Khoảng 50 đô la", ["Khoảng 30 đô la", "Khoảng 15 đô la"]), ("Sau ba tháng, kết quả là gì?", "Giảm năm cân", ["Giảm ba cân", "Tăng năm cân"]), ("Ai bắt đầu đi bộ cùng người viết?", "Vợ của người viết", ["Bác sĩ", "Đồng nghiệp"]),
        ("Ý chính của bài là gì?", "Một thay đổi nhỏ nhưng đều đặn rất có ích", ["Ai cũng nên đến phòng tập", "Không nên ăn bánh ngọt"])]),
}
R4 = {
 "a": ("Summer cooking course", ["Would you like to learn to cook Vietnamese food? The Community Center on Kim Ma Street has a new course this summer. The course starts on the eighth of July and finishes on the twenty-sixth of August. Classes are held every Saturday morning from nine to eleven thirty. Our teacher, Mrs Thu, worked as a chef in a large hotel for twenty years. Each class has no more than twelve students, so everyone gets help.",
                                 "The course costs one hundred and fifty dollars. This includes all the food, but students must bring their own knife and an apron. To join, please fill in a form at the front desk before the first of July, or call Mr Binh. Students who finish the course will receive a small gift and a book of recipes."],
       [("apron", "tạp dề"), ("recipes", "công thức nấu ăn")],
       [("Ngày bắt đầu: ___", "8 tháng 7", ["26 tháng 8", "1 tháng 7"]), ("Buổi học: sáng ___", "Thứ Bảy", ["Chủ nhật", "Thứ Hai"]), ("Giáo viên: bà ___", "Thu", ["Lan", "Binh"]), ("Số học viên tối đa mỗi lớp: ___", "12", ["20", "9"]),
        ("Học phí: ___ đô la", "150", ["115", "50"]), ("Học viên tự mang: dao và ___", "tạp dề", ["thức ăn", "sách"]), ("Hạn đăng ký: trước ___", "1 tháng 7", ["8 tháng 7", "26 tháng 8"])]),
 "b": ("Help at the museum", ["The City Museum is looking for volunteers to help at its new exhibition about old Hanoi. The exhibition opens on the third of October and runs for six weeks. Volunteers work one day a week, on a Saturday or a Sunday, from ten o'clock until four. Your job is to welcome visitors and answer simple questions in English or Vietnamese. You do not need any experience, but you must be at least eighteen years old.",
                              "We give all volunteers a free lunch and a free ticket for one friend. Training is on the twenty-eighth of September at the museum. To apply, send an email to Ms Hanh before the fifteenth of September. Please tell us which day you prefer and why you want to help. Volunteers who help for all six weeks will also receive a letter of thanks from the museum."],
       [("volunteers", "tình nguyện viên"), ("exhibition", "cuộc triển lãm")],
       [("Ngày khai mạc: ___", "3 tháng 10", ["28 tháng 9", "15 tháng 9"]), ("Thời gian triển lãm: ___ tuần", "6", ["4", "10"]), ("Giờ làm việc: từ 10 giờ đến ___ giờ", "4", ["6", "8"]), ("Tuổi tối thiểu: ___", "18", ["16", "28"]),
        ("Tình nguyện viên được: bữa trưa và ___", "một vé cho một người bạn", ["tiền lương", "một cuốn sách"]), ("Ngày tập huấn: ___", "28 tháng 9", ["3 tháng 10", "15 tháng 9"]), ("Gửi email cho: chị ___", "Hanh", ["Lan", "Thu"])]),
}
INFO_Q = "Điền vào phiếu thông tin. "
READING_WORDS = {}
for form in "ab":
    words = 0
    starts, pool = R1[form]
    shown = [pool[i] for i in ORDER[form]]
    words += sum(len(x.split()) for x in pool)
    for x in pool:
        seen(x)
    for n, (text, key) in enumerate(starts, 1):
        rid = reading(f"en.read.bac2_{form}_r1_{n:02d}", "notice", [text], RN, units=1)
        words += len(text.split())
        item(form, "r", 1, n, {"type": "readingComprehension", "readingId": rid, "question": MATCH_Q, "options": [{"text": t} for t in shown], "correct": ORDER[form].index(key)}, RN)
    n = 0
    for k, (paras, kind, qs) in enumerate(R2[form], 1):
        rid = reading(f"en.read.bac2_{form}_r2_{k:02d}", kind, paras, RM if kind == "message" else RN)
        words += sum(len(p.split()) for p in paras)
        for q, ok, wrong in qs:
            n += 1
            rc(form, 2, n, rid, q, ok, wrong, RM if kind == "message" else RN)
    title, paras, gloss, qs = R3[form]
    rid = reading(f"en.read.bac2_{form}_r3", "narrative", paras, RT, gloss, title, 6)
    words += sum(len(p.split()) for p in paras)
    for n, (q, ok, wrong) in enumerate(qs, 1):
        rc(form, 3, n, rid, q, ok, wrong, RT)
    title, paras, gloss, qs = R4[form]
    rid = reading(f"en.read.bac2_{form}_r4", "description", paras, RN, gloss, title, 6)
    words += sum(len(p.split()) for p in paras)
    for n, (q, ok, wrong) in enumerate(qs, 1):
        rc(form, 4, n, rid, INFO_Q + q, ok, wrong, RN)
    READING_WORDS[form] = words


# ---------------- WRITING: 3 tasks, 35 minutes ----------------
def write(form, task, slug, fam, instr, cue, slots, mn, mx, model, obj):
    tid = f"en.write.bac2_{form}_{slug}"
    seen(model)
    rubric = {"requiredSlots": [{"id": i, "description": {"vi": d}, "variants": v, "cueProvided": c} for i, d, v, c in slots], "minTokens": mn, "maxTokens": mx}
    t = {"id": tid, "taskFamily": fam, "mode": "guided", "instruction": {"vi": instr}, "cueFacts": [{"label": {"vi": a}, "value": b} for a, b in cue]}
    t.update({"rubric": rubric, "modelAnswers": [model], "objectiveRefs": [obj], "lexemeRefs": content_refs(model), "scoredEligibility": True, "reserved": True, "sourceRef": "original-project"})
    tasks.append(t)
    flat = {**rubric, "requiredSlots": [{**s, "description": s["description"]["vi"]} for s in rubric["requiredSlots"]]}
    item(form, "w", task, 1, {"type": "guidedWriting", "writingTaskId": tid, "writingMode": "guided", "instruction": instr, "cueFacts": [{"label": a, "value": b} for a, b in cue], "rubric": flat, "modelAnswers": [model]}, obj)


WP, WM = O("writing.phrases_sentences"), O("writing.short_message")
GREET = ["dear", "hi", "hello"]
SIGN = ["best regards", "regards", "thank you", "thanks"]
CLOSE = ["see you", "bye", "goodbye", "best wishes", "love"]
FIVE = "Phần 1 — Viết 5 câu hoàn chỉnh từ các cụm từ cho sẵn. Bạn cần thêm từ và đổi dạng động từ khi cần."
write("a", 1, "sentences", "simple_description", FIVE,
      [("Câu 1", "I / live / small apartment / near / park"), ("Câu 2", "My sister / work / hospital / Hue"), ("Câu 3", "We / not / go / work / Sunday"), ("Câu 4", "Yesterday / I / buy / new phone"), ("Câu 5", "What time / you / get up / morning?")],
      [("s1", "câu 1", ["live in a small apartment near the park"], False), ("s2", "câu 2", ["works in a hospital in hue", "works at a hospital in hue"], False), ("s3", "câu 3", ["do not go to work on sunday"], False),
       ("s4", "câu 4", ["bought a new phone"], False), ("s5", "câu 5", ["what time do you get up"], False)], 25, 50,
      "I live in a small apartment near the park. My sister works in a hospital in Hue. We do not go to work on Sunday. Yesterday I bought a new phone. What time do you get up in the morning?", WP)
write("b", 1, "sentences", "simple_description", FIVE,
      [("Câu 1", "My brother / usually / drive / work"), ("Câu 2", "There / two bedrooms / my house"), ("Câu 3", "She / not / like / coffee"), ("Câu 4", "Last week / we / visit / our grandmother"), ("Câu 5", "Where / you / buy / this bag?")],
      [("s1", "câu 1", ["usually drives to work"], False), ("s2", "câu 2", ["there are two bedrooms in my house"], False), ("s3", "câu 3", ["does not like coffee"], False),
       ("s4", "câu 4", ["visited our grandmother"], False), ("s5", "câu 5", ["where did you buy this bag"], False)], 22, 45,
      "My brother usually drives to work. There are two bedrooms in my house. She does not like coffee. Last week we visited our grandmother. Where did you buy this bag?", WP)
write("a", 2, "message", "short_message", "Phần 2 — Viết tin nhắn cho quản lý: báo bạn bị ốm và nghỉ làm vào ngày đã cho, nói ai làm thay và ngày bạn quay lại. Có lời chào và lời kết.",
      [("Gửi", "Mr Brown"), ("Ngày nghỉ", "Monday"), ("Người làm thay", "Hoa"), ("Ngày quay lại", "Tuesday")],
      [("greeting", "lời chào", GREET, False), ("sick", "bạn bị ốm", ["sick", "ill"], False), ("off", "ngày nghỉ", ["monday"], True), ("cover", "người làm thay", ["hoa"], True), ("back", "ngày quay lại", ["tuesday"], True), ("closing", "lời kết", SIGN, False)], 15, 50,
      "Dear Mr Brown, I am sick and I cannot work on Monday. Hoa will take my shift. I will come back on Tuesday. Best regards, Minh", WM)
write("b", 2, "memo", "short_message", "Phần 2 — Viết bản ghi nhớ cho cả nhóm: cuộc họp chuyển sang ngày và giờ đã cho, ở phòng đã cho, mọi người mang báo cáo. Có lời chào và lời kết.",
      [("Ngày mới", "Thursday"), ("Giờ", "3 giờ"), ("Phòng", "room 5")],
      [("greeting", "lời chào", ["dear", "hi", "hello", "to all staff"], False), ("day", "ngày họp mới", ["thursday"], True), ("time", "giờ họp", ["at three"], True), ("room", "phòng họp", ["room five"], True), ("report", "mang báo cáo", ["report"], False), ("closing", "lời kết", SIGN, False)], 12, 50,
      "To all staff: the meeting will move to Thursday at three in room five. Please bring your report. Thank you, Lan", WM)
write("a", 3, "postcard", "short_message", "Phần 3 — Viết bưu thiếp cho một người bạn: bạn đang nghỉ ở đâu, thời tiết thế nào, bạn làm gì và khi nào về. Có lời chào và lời kết.",
      [("Gửi", "Lan"), ("Nơi", "Da Nang"), ("Ngày về", "Sunday")],
      [("greeting", "lời chào", GREET, False), ("place", "nơi bạn đang nghỉ", ["da nang"], True), ("weather", "thời tiết", ["weather"], False), ("back", "ngày về", ["sunday"], True), ("closing", "lời kết", CLOSE, False)], 20, 60,
      "Dear Lan, I am on vacation in Da Nang with my family. The weather is sunny and hot. We swim in the sea every morning. I will come home on Sunday. See you soon, Minh", WM)
write("b", 3, "letter", "short_message", "Phần 3 — Viết thư ngắn mời một người bạn đến chơi: bạn có nhà mới, mời vào ngày và giờ đã cho, bạn sẽ làm gì cho khách. Có lời chào và lời kết.",
      [("Gửi", "Tom"), ("Ngày", "Saturday"), ("Giờ", "10 giờ")],
      [("greeting", "lời chào", GREET, False), ("house", "nhà mới", ["new house", "new home"], False), ("day", "ngày mời", ["saturday"], True), ("time", "giờ mời", ["at ten"], True), ("closing", "lời kết", CLOSE, False)], 20, 60,
      "Dear Tom, we have a new house near the lake. Would you like to visit us this Saturday? Please come at ten and bring your family. I will cook lunch for everyone. See you soon, Hoa", WM)


# ---------------- SPEAKING: 4 parts, 10 minutes including 2 of preparation ----------------
def pclip(cid, text, obj, speaker):
    seen(text)
    clips.append({"id": cid, "kind": "message", "segments": [{"speaker": speaker, "text": text}], "objectiveRefs": [obj], "lexemeRefs": refs(text), "sourceRef": "original-project",
                  "authoringSpec": {"informationUnits": 1, "inferenceDemand": "locate"}, "scoredPlaybackPolicy": {"maxPlays": 2, "rate": 1}})


def scenario(form, task, slug, fam, obj, title, goal, steps, end, miss):
    sid = f"bac2_{form}_{slug}"
    base = f"en.clip.ix_{sid}"
    speaker = "A" if task == 1 else "B"
    nodes = {}
    pclip(f"{base}_miss", miss, obj, speaker)
    nodes["t_miss"] = {"kind": "terminal", "id": "t_miss", "outcome": "goal_not_met", "text": miss, "clipId": f"{base}_miss"}
    for i, (p, rp, prompt, intent, variants, concepts) in enumerate(steps):
        nxt = f"p{i + 1}" if i + 1 < len(steps) else "t_ok"
        pclip(f"{base}_{i}", p, obj, speaker)
        pclip(f"{base}_{i}_s", rp, obj, speaker)
        nodes[f"p{i}"] = {"kind": "partner", "id": f"p{i}", "text": p, "clipId": f"{base}_{i}", "rephraseText": rp, "rephraseClipId": f"{base}_{i}_s", "next": f"l{i}"}
        exp = [{"intent": intent, "acceptedVariants": variants, "requiredConcepts": concepts, "next": nxt}]
        nodes[f"l{i}"] = {"kind": "learner", "id": f"l{i}", "prompt": {"vi": prompt}, "expected": exp, "noMatchNext": f"r{i}", "scored": True}
        nodes[f"r{i}"] = {"kind": "partner", "id": f"r{i}", "text": rp, "clipId": f"{base}_{i}_s", "next": f"l{i}b"}
        nodes[f"l{i}b"] = {"kind": "learner", "id": f"l{i}b", "prompt": {"vi": prompt}, "expected": exp, "noMatchNext": "t_miss", "scored": False}
    pclip(f"{base}_end", end, obj, speaker)
    nodes["t_ok"] = {"kind": "terminal", "id": "t_ok", "outcome": "goal_met", "text": end, "clipId": f"{base}_end"}
    scenarios.append({"id": f"en.scenario.{sid}", "title": {"vi": title}, "goal": {"vi": goal}, "taskFamily": fam, "objectiveRefs": [obj], "startNodeId": "p0", "nodes": nodes,
                      "support": {"allowRepeat": True, "allowRephrase": True}, "reserved": True, "sourceRef": "original-project"})
    item(form, "s", task, 1, {"type": "interactionScenario", "scenarioId": f"en.scenario.{sid}"}, obj)


CONV = O("interaction.everyday_conversation")
THANKS_END, STOP = "Thank you. That's all for this part.", "That's okay. Let's stop here."
scenario("a", 1, "greet", "conversation", CONV, "Phần 1 — Chào hỏi", "Chào giám khảo và nói tên, quê của bạn.",
 [("Good morning. Please sit down. How are you today?", "Hello. How do you feel today?", "Hãy chào lại và nói bạn khoẻ.", "fine", ["Good morning. I'm fine, thank you.", "I'm fine, thanks.", "I'm very well, thank you.", "I'm okay, thank you."], [["fine", "well", "okay", "good"]]),
  ("What is your name, and where are you from?", "Please tell me your name and your home town.", "Hãy nói tên bạn là Lan và bạn đến từ Huế.", "name_from", ["My name is Lan and I'm from Hue.", "I'm Lan, from Hue.", "I'm Lan and I come from Hue."], [["lan"], ["hue"]])], THANKS_END, STOP)
scenario("b", 1, "greet", "conversation", CONV, "Phần 1 — Chào hỏi", "Chào giám khảo và nói tên, nơi sống của bạn.",
 [("Good afternoon. Come in, please. How are you?", "Hello. How are you feeling today?", "Hãy chào lại và nói bạn khoẻ.", "fine", ["Good afternoon. I'm fine, thank you.", "I'm fine, thanks.", "I'm very well, thank you.", "I'm okay, thank you."], [["fine", "well", "okay", "good"]]),
  ("What is your name, and where do you live?", "Please tell me your name and your city.", "Hãy nói tên bạn là Nam và bạn sống ở Hà Nội.", "name_city", ["My name is Nam and I live in Hanoi.", "I'm Nam, and I live in Hanoi.", "I'm Nam, from Hanoi."], [["nam"], ["hanoi"]])], THANKS_END, STOP)
scenario("a", 2, "social", "information_exchange", CONV, "Phần 2 — Tương tác xã hội", "Trả lời câu hỏi về công việc và thời gian rảnh, rồi hỏi lại giám khảo một câu.",
 [("Let's talk about your work. What do you do?", "What is your job?", "Hãy nói bạn là y tá ở một bệnh viện.", "job", ["I'm a nurse in a hospital.", "I work as a nurse in a hospital.", "I'm a nurse."], [["nurse"]]),
  ("Do you like your job? Why?", "Is your job good for you? Why?", "Hãy nói bạn thích vì bạn giúp được mọi người.", "why", ["Yes, I like it because I can help people.", "Yes, because I help people.", "I like it because I help people."], [["help"]]),
  ("Now, your free time. What do you do on the weekend?", "What do you like to do on Saturday and Sunday?", "Hãy nói bạn đi bơi và nấu ăn.", "weekend", ["I go swimming and I cook.", "I swim and cook.", "I go swimming and cook."], [["swim", "swimming"], ["cook"]]),
  ("Good. Do you have a question for me?", "You can ask me a question now.", "Hãy hỏi giám khảo có thích nấu ăn không.", "ask", ["Do you like cooking?", "Do you like to cook?", "Do you cook?"], [["you"], ["cook", "cooking"]])], THANKS_END, STOP)
scenario("b", 2, "social", "information_exchange", CONV, "Phần 2 — Tương tác xã hội", "Trả lời câu hỏi về gia đình và món ăn, rồi hỏi lại giám khảo một câu.",
 [("Tell me about your family. How many people are there?", "How many people are in your family?", "Hãy nói gia đình bạn có năm người.", "count", ["There are five people in my family.", "Five people.", "We have five people."], [["five", "5"]]),
  ("Who do you live with?", "Do you live with your family?", "Hãy nói bạn sống với bố mẹ.", "live_with", ["I live with my parents.", "With my parents.", "My parents."], [["parents"]]),
  ("Let's talk about food. What is your favorite food?", "What food do you like best?", "Hãy nói bạn thích phở nhất.", "food", ["My favorite food is pho.", "I like pho best.", "Pho."], [["pho"]]),
  ("Good. Do you have a question for me?", "You can ask me a question now.", "Hãy hỏi giám khảo thích món gì.", "ask", ["What is your favorite food?", "What food do you like?", "What do you like to eat?"], [["what"], ["food", "eat"]])], THANKS_END, STOP)
SD, SG = O("speaking.describe"), O("speaking.give_info")


def monologue(form, task, slug, fam, elic, obj, instr, cue, target, variants, concepts):
    sid = f"en.speak.bac2_{form}_{slug}"
    seen(target)
    plain = target.rstrip(".!")
    accepted = [plain] + [v for v in variants if v != plain]
    speech.append({"id": sid, "taskFamily": fam, "elicitationType": elic, "prompt": {"instruction": {"vi": instr}, "cueFacts": [{"label": {"vi": a}, "value": b} for a, b in cue]},
                   "target": target, "acceptedVariants": accepted, "requiredConcepts": concepts, "objectiveRefs": [obj], "lexemeRefs": refs(target), "evidenceLexemeRefs": [],
                   "assistancePolicy": {"allowContextualBias": False, "revealTargetAfterAttempts": None}, "scoredEligibility": True, "modelAudioRef": None,
                   "recognitionLocale": "en-US", "allowedAttempts": 2, "reserved": True, "sourceRef": "original-project"})
    item(form, "s", task, 1, {"type": "speakProduction", "speechItemId": sid, "instruction": instr, "cueFacts": [{"label": a, "value": b} for a, b in cue], "target": target, "acceptedVariants": accepted,
                              "requiredConcepts": concepts, "evidenceLexemeRefs": [], "revealTargetAfterAttempts": None, "allowContextualBias": False, "modelClipId": None, "allowedAttempts": 2}, obj)


monologue("a", 3, "describe", "description", "information_prompt", SD, "Phần 3 — Hãy tả căn bếp nhà bạn theo các gợi ý.", [("Căn bếp", "nhỏ nhưng sạch"), ("Trong bếp", "một cái bàn, bốn cái ghế"), ("Hằng ngày", "nấu bữa tối")],
          "My kitchen is small but clean. There is a table and four chairs. I cook dinner there every day.",
          ["My kitchen is small and clean. There is a table and four chairs. I cook dinner there."], [["kitchen"], ["small"], ["clean"], ["table"], ["chairs", "chair"], ["cook"]])
monologue("b", 3, "describe", "description", "information_prompt", SD, "Phần 3 — Hãy tả một người bạn của bạn theo các gợi ý.", [("Tên", "Hoa"), ("Người", "cao, tốt bụng"), ("Công việc", "làm ở ngân hàng"), ("Sở thích", "âm nhạc")],
          "My friend Hoa is tall and kind. She works in a bank. She likes music.",
          ["Hoa is my friend. She is tall and kind. She works in a bank and she likes music."], [["hoa"], ["tall"], ["kind"], ["bank"], ["music"]])
monologue("a", 4, "discuss", "information_giving", "situation_prompt", SG, "Phần 4 — Giám khảo nêu ý kiến: nhiều người nên đi làm bằng xe buýt. Giám khảo đề xuất: thành phố nên có thêm xe buýt. Hãy nói bạn đồng ý hay không với cả hai, và nói một lý do.", [("Lý do của bạn", "xe buýt rẻ")],
          "I agree. People should take the bus because it is cheap, and the city needs more buses.",
          ["I agree because the bus is cheap. The city needs more buses.", "I disagree because buses are slow, but the city needs more buses."], [["agree", "disagree"], ["because"]])
monologue("b", 4, "discuss", "information_giving", "situation_prompt", SG, "Phần 4 — Giám khảo nêu ý kiến: học sinh không nên dùng điện thoại ở trường. Giám khảo đề xuất: trường nên giữ điện thoại trong giờ học. Hãy nói bạn đồng ý hay không với cả hai, và nói một lý do.", [("Lý do của bạn", "học sinh không tập trung")],
          "I agree. Students should not use phones at school because they cannot study well, and the school can keep the phones.",
          ["I agree because students cannot study well with phones.", "I disagree because students need to call their parents."], [["agree", "disagree"], ["because"]])


# ---------------- track ----------------
def T(vi):
    return {"vi": vi}


def task(tid, title, instr, fmt, n, **kw):
    t = {"id": tid, "title": T(title), "instruction": T(instr), "format": fmt, "itemsPerForm": n}
    t.update(kw)
    return t


NAME = "Luyện đề đánh giá năng lực tiếng Anh bậc 2 (theo định dạng QĐ 1481/QĐ-BGDĐT)"
URL = "https://caselaw.vn/van-ban-phap-luat/145550-quyet-dinh-1481-qd-bgddt-nam-2016-ve-dinh-dang-de-thi-danh-gia-nang-luc-su-dung-tieng-anh-bac-2-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-danh-cho-nguoi-lon-do-bo-giao-duc-va-dao-tao-ban-hanh"
GAP_NOTE = "Trong đề thật bạn tự viết từ; ở đây bạn chọn một trong ba từ."
track = {
 "id": f"en.exam.{TRACK}", "trackVersion": 1, "name": NAME, "level": "A2", "formatFidelity": "partial",
 "title": T(NAME),
 "description": T("Luyện theo định dạng trong Quyết định 1481/QĐ-BGDĐT (10/5/2016) của Bộ Giáo dục và Đào tạo, dành cho người lớn: Nghe, Đọc, Viết và Nói, với số phần, số câu, thời gian và thang điểm mà quyết định nêu. "
                  "Quyết định không chia câu theo từng phần và không kèm tiêu chí chấm hay đề mẫu, nên các dạng câu hỏi ở đây do khoá học tự thiết kế để luyện từng phần, không phải bản sao của đề thi thật. Mọi câu hỏi đều do khoá học tự soạn. "
                  "Đây là mục tiêu xa hơn khoá A1: học xong khoá A1 chưa đủ cho định dạng bậc 2 này. Đây không phải kỳ thi chính thức và không có giá trị xác nhận năng lực. Đây cũng không phải VSTEP: VSTEP.3-5 dành cho các bậc 3 đến 5."),
 "formatSource": {
  "publisher": "Bộ Giáo dục và Đào tạo",
  "references": [{"url": URL, "title": "Quyết định 1481/QĐ-BGDĐT ngày 10/5/2016 (bản đăng trên caselaw.vn)", "retrieved": "2026-10-31"}],
  "checkedAgainstOfficialGuide": False,
  "note": T("Các con số lấy từ bản đăng lại của Quyết định 1481/QĐ-BGDĐT trên caselaw.vn, đọc ngày 2026-10-31; chưa đối chiếu với bản có chữ ký. Quyết định không chia câu theo phần: cách chia ở đây là của khoá học. "
            "Câu điền từ và câu trả lời ngắn được chuyển thành câu chọn một trong ba đáp án. Quyết định không nói số lần nghe; khoá học cho nghe hai lần. Ứng dụng so tổng điểm với 65/100 (6,5/10); quyết định còn làm tròn đến 0,5 điểm, nên kết quả thật có thể khác một chút."),
 },
 "sections": [
  {"id": "listening", "skill": "listening", "title": T("Nghe"), "minutes": 25, "maxPoints": 25, "playsPerRecording": 2, "tasks": [
    task("p1", "Phần 1 — Thông báo ngắn", "Nghe mỗi thông báo và chọn đáp án đúng.", "mcq3", 5),
    task("p2", "Phần 2 — Hội thoại ngắn", "Nghe mỗi đoạn hội thoại và chọn đáp án đúng.", "mcq3", 5),
    task("p3", "Phần 3 — Một cuộc hội thoại", "Nghe cuộc hội thoại và trả lời năm câu hỏi.", "mcq3", 5),
    task("p4", "Phần 4 — Bài nói thứ nhất", f"Nghe bài nói và điền từ còn thiếu vào năm câu. {GAP_NOTE}", "mcq3", 5),
    task("p5", "Phần 5 — Bài nói thứ hai", f"Nghe bài nói và điền từ còn thiếu vào năm câu. {GAP_NOTE}", "mcq3", 5)]},
  {"id": "reading", "skill": "reading", "title": T("Đọc"), "minutes": 40, "maxPoints": 25, "tasks": [
    task("p1", "Phần 1 — Ghép với thông báo ngắn", "Đọc tám thông báo và chọn câu đúng với nội dung mỗi thông báo. Hai câu không được dùng.", "matchToPool", 8, poolSize=10),
    task("p2", "Phần 2 — Bốn văn bản ngắn", "Đọc mỗi văn bản và chọn đáp án đúng cho hai câu hỏi.", "mcq3", 8),
    task("p3", "Phần 3 — Một bài đọc", "Đọc bài và chọn đáp án đúng cho bảy câu hỏi.", "mcq3", 7),
    task("p4", "Phần 4 — Điền phiếu thông tin", "Đọc văn bản và tìm thông tin còn thiếu cho bảy dòng của phiếu. Trong đề thật bạn tự viết câu trả lời; ở đây bạn chọn một trong ba đáp án.", "mcq3", 7)]},
  {"id": "writing", "skill": "writing", "title": T("Viết"), "minutes": 35, "maxPoints": 25, "tasks": [
    task("p1", "Phần 1 — Viết 5 câu", "Viết 5 câu hoàn chỉnh từ các cụm từ cho sẵn.", "short_text", 1),
    task("p2", "Phần 2 — Tin nhắn hoặc bản ghi nhớ", "Viết một tin nhắn hoặc một bản ghi nhớ trong công việc theo yêu cầu.", "short_text", 1),
    task("p3", "Phần 3 — Thư hoặc bưu thiếp", "Viết một bức thư hoặc bưu thiếp về cuộc sống hằng ngày theo yêu cầu.", "short_text", 1)]},
  {"id": "speaking", "skill": "speaking", "title": T("Nói"), "minutes": 8, "preparationMinutes": 2, "maxPoints": 25, "simulatedIndividually": True, "tasks": [
    task("p1", "Phần 1 — Chào hỏi", "Chào hỏi và trả lời giám khảo.", "conversation", 1),
    task("p2", "Phần 2 — Tương tác xã hội", "Trả lời câu hỏi về hai chủ đề, rồi đặt câu hỏi cho giám khảo.", "conversation", 1),
    task("p3", "Phần 3 — Miêu tả", "Miêu tả một người, một đồ vật hay một môi trường sống, làm việc, học tập.", "monologue", 1),
    task("p4", "Phần 4 — Thảo luận", "Nghe một ý kiến và một đề xuất, rồi nói bạn đồng ý hay không.", "monologue", 1)]},
 ],
 "passRule": {"total": {"title": T("Tổng điểm cả bốn kỹ năng (6,5/10 tức là 65/100, theo Quyết định 1481)"), "min": 65}, "everySectionTaken": True},
 "scoring": {"perItem": "share_of_section_points", "negativeMarking": False},
 "readiness": {
  "bands": [
   {"id": "ready_estimate", "minGroupShare": 0.75, "label": T("Mức sẵn sàng ước tính: tốt"), "message": T("Ở lần làm thử này, tổng điểm cao hơn mức 6,5/10 của định dạng một khoảng an toàn. Đây là mức sẵn sàng ước tính từ bài luyện của khoá học, không phải điểm thi thật.")},
   {"id": "getting_close", "minGroupShare": 0.65, "label": T("Mức sẵn sàng ước tính: gần đạt"), "message": T("Tổng điểm đã chạm mức 6,5/10 của định dạng nhưng chưa có khoảng an toàn. Hãy luyện thêm các phần yếu bên dưới.")},
   {"id": "not_yet", "minGroupShare": 0, "label": T("Mức sẵn sàng ước tính: cần luyện thêm"), "message": T("Tổng điểm còn dưới mức 6,5/10 của định dạng. Định dạng này cao hơn khoá A1, nên điều đó là bình thường. Hãy luyện các phần yếu rồi thử đề còn lại.")}],
  "incomplete": T("Chưa đủ dữ liệu để ước tính: định dạng này yêu cầu có kết quả của cả bốn kỹ năng, và phần Nói cần micro cùng nhận dạng giọng nói trên thiết bị. Các phần khác vẫn được tính điểm."),
  "disclaimer": T("Mức sẵn sàng ước tính dựa trên bài luyện của khoá học: không phải kỳ thi chính thức, không do Bộ Giáo dục và Đào tạo hay cơ sở đánh giá nào cấp, và không dự đoán kết quả thi thật. Dạng câu hỏi do khoá học thiết kế; phần Viết và Nói được chấm bằng tiêu chí tự động đơn giản, nên điểm chỉ là gần đúng."),
 },
 "items": items,
 "forms": [{"formId": f, "itemIds": [i["id"] for i in items if i["id"].split(".")[-1].startswith(f + "_")]} for f in "ab"],
}

for form, n in READING_WORDS.items():
    if not 700 <= n <= 750:
        sys.exit(f"form {form}: reading has {n} words, the decision states 700-750")

write_jsonl(f"{DRAFTS}/listening/OUTPUT.jsonl", clips, "a")
write_jsonl(f"{DRAFTS}/readings/OUTPUT.jsonl", readings, "a")
write_jsonl(f"{DRAFTS}/speech/OUTPUT.jsonl", speech, "a")
write_jsonl(f"{DRAFTS}/writing/OUTPUT.jsonl", tasks, "a")
write_jsonl(f"{DRAFTS}/scenarios/OUTPUT.jsonl", scenarios, "a")
write_jsonl(f"{DRAFTS}/exam/OUTPUT.jsonl", [track])
print(len(items), "items", dict(sorted(Counter((i["sectionId"], i["taskId"]) for i in items).items())), len(clips), "clips", len(readings), "readings", len(speech), "speech", len(tasks), "tasks", len(scenarios), "scenarios", "reading words", READING_WORDS)
print(len(OFF_LIST), "word types outside the A1 list:", " ".join(sorted(OFF_LIST)))
